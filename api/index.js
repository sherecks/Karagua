// Karaguá API — Express + Postgres (Railway) + JWT de admin único.
// Substitui o Supabase: CRUD de pontos_interesse, login do admin e a maré
// via Open-Meteo Marine (dados Copernicus, sem chave).
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const {
  DATABASE_URL,
  JWT_SECRET,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  CORS_ORIGIN,
  PORT = 4000,
} = process.env;

for (const [name, value] of Object.entries({
  DATABASE_URL,
  JWT_SECRET,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
})) {
  if (!value) {
    console.error(`Variável de ambiente obrigatória ausente: ${name}`);
    process.exit(1);
  }
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  // Railway: a rede interna (postgres.railway.internal) não usa TLS; o proxy
  // público aceita TLS sem CA verificável. sslmode=require na URL decide.
  ssl: /sslmode=require/.test(DATABASE_URL) ? { rejectUnauthorized: false } : false,
});

async function ensureSchema() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE TABLE IF NOT EXISTS pontos_interesse (
      id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      nome        text        NOT NULL,
      latitude    float8      NOT NULL,
      longitude   float8      NOT NULL,
      dados       text        NOT NULL DEFAULT '',
      tipo        text        NOT NULL DEFAULT 'monitoramento',
      created_at  timestamptz NOT NULL DEFAULT now()
    );
  `);
}

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: CORS_ORIGIN ? CORS_ORIGIN.split(",").map((s) => s.trim()) : true,
  }),
);

// ── Auth ────────────────────────────────────────────────────────────────────
function timingSafeEqual(a, b) {
  const crypto = require("crypto");
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};
  const ok =
    email &&
    password &&
    timingSafeEqual(email, ADMIN_EMAIL) &&
    timingSafeEqual(password, ADMIN_PASSWORD);
  if (!ok) return res.status(401).json({ error: "Email ou senha incorretos." });
  const token = jwt.sign({ sub: "admin", email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Não autenticado." });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Sessão expirada. Entre novamente." });
  }
}

// ── Pontos de interesse ─────────────────────────────────────────────────────
const PONTO_COLS = "id, nome, latitude, longitude, dados, tipo, created_at";

app.get("/pontos", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${PONTO_COLS} FROM pontos_interesse ORDER BY created_at DESC`,
    );
    res.json({ data: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function parsePonto(body) {
  const { nome, latitude, longitude, dados = "", tipo = "monitoramento" } = body ?? {};
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!nome || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { error: "nome, latitude e longitude são obrigatórios (lat/lng numéricos)." };
  }
  if (!["fauna", "flora", "monitoramento"].includes(tipo)) {
    return { error: "tipo precisa ser fauna, flora ou monitoramento." };
  }
  return { value: { nome, lat, lng, dados, tipo } };
}

app.post("/pontos", requireAuth, async (req, res) => {
  const parsed = parsePonto(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const { nome, lat, lng, dados, tipo } = parsed.value;
  try {
    const { rows } = await pool.query(
      `INSERT INTO pontos_interesse (nome, latitude, longitude, dados, tipo)
       VALUES ($1, $2, $3, $4, $5) RETURNING ${PONTO_COLS}`,
      [nome, lat, lng, dados, tipo],
    );
    res.status(201).json({ data: rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/pontos/:id", requireAuth, async (req, res) => {
  const parsed = parsePonto(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const { nome, lat, lng, dados, tipo } = parsed.value;
  try {
    const { rows } = await pool.query(
      `UPDATE pontos_interesse
       SET nome = $1, latitude = $2, longitude = $3, dados = $4, tipo = $5
       WHERE id = $6 RETURNING ${PONTO_COLS}`,
      [nome, lat, lng, dados, tipo, req.params.id],
    );
    if (rows.length === 0) return res.status(404).json({ error: "Ponto não encontrado." });
    res.json({ data: rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/pontos/:id", requireAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM pontos_interesse WHERE id = $1", [
      req.params.id,
    ]);
    if (rowCount === 0) return res.status(404).json({ error: "Ponto não encontrado." });
    res.json({ data: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Maré (Open-Meteo Marine — nível do mar com maré, origem Copernicus) ─────
// Sem chave e sem cota relevante. Os extremos (alta/baixa) são calculados aqui
// a partir da série horária de sea_level_height_msl: máximos/mínimos locais,
// com o horário/altura afinados pelo vértice da parábola dos 3 pontos vizinhos.
// Datum = nível médio do mar (MSL), não LAT de carta náutica.
const tideCache = new Map();
const TIDE_TTL_MS = 30 * 60 * 1000;

function extremesFromHourlySeries(times, heights) {
  const out = [];
  for (let i = 1; i < heights.length - 1; i++) {
    const [prev, cur, next] = [heights[i - 1], heights[i], heights[i + 1]];
    if (typeof prev !== "number" || typeof cur !== "number" || typeof next !== "number") continue;
    const isHigh = cur > prev && cur >= next;
    const isLow = cur < prev && cur <= next;
    if (!isHigh && !isLow) continue;
    const denom = prev - 2 * cur + next;
    const offset = denom === 0 ? 0 : (0.5 * (prev - next)) / denom;
    out.push({
      time: new Date((times[i] + offset * 3600) * 1000).toISOString(),
      height: Number((cur - 0.25 * (prev - next) * offset).toFixed(2)),
      type: isHigh ? "high" : "low",
    });
  }
  return out;
}

app.get("/tide-extremes", async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: "lat e lng são obrigatórios e numéricos" });
  }

  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const hit = tideCache.get(key);
  if (hit && Date.now() - hit.at < TIDE_TTL_MS) {
    return res.set("Cache-Control", "public, max-age=1800").json({ data: hit.data });
  }

  try {
    const upstream = await fetch(
      `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}` +
        `&hourly=sea_level_height_msl&timeformat=unixtime&timezone=UTC&forecast_days=3`,
    );
    if (!upstream.ok)
      return res.status(502).json({ error: `open-meteo respondeu ${upstream.status}` });
    const body = await upstream.json();
    const times = body.hourly?.time ?? [];
    const heights = body.hourly?.sea_level_height_msl ?? [];
    if (!heights.some((h) => typeof h === "number")) {
      return res.status(502).json({ error: "sem dados de maré para essas coordenadas" });
    }
    const nowMs = Date.now();
    const data = extremesFromHourlySeries(times, heights)
      .filter((e) => Date.parse(e.time) >= nowMs)
      .slice(0, 8);
    tideCache.set(key, { at: Date.now(), data });
    res.set("Cache-Control", "public, max-age=1800").json({ data });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

ensureSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`Karaguá API na porta ${PORT}`));
  })
  .catch((e) => {
    console.error("Falha ao preparar o schema:", e.message);
    process.exit(1);
  });
