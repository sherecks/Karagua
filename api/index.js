// Karaguá API — Express + Postgres (Railway) + JWT de admin único.
// Substitui o Supabase: CRUD de pontos_interesse, login do admin e a maré
// via Open-Meteo Marine (dados Copernicus, sem chave).
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const sharp = require("sharp");
const { NetCDFReader } = require("netcdfjs");
const { fromUrl: geotiffFromUrl, fromArrayBuffer: geotiffFromArrayBuffer } = require("geotiff");
const unzipper = require("unzipper");
const { Readable, PassThrough } = require("stream");

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

// ── Altura de dossel do manguezal (NASA/ORNL DAAC) — grade real em cm ──────
// A camada 2D do mapa recolore o mesmo raster só com filtro CSS (nunca lê
// pixel, o ImageServer não manda CORS). Aqui é diferente: o fetch acontece no
// servidor (sem restrição de CORS) e devolvemos números reais em centímetros,
// prontos pro terreno 3D. DRA:false de propósito — o mapa 2D usa DRA:true pra
// ficar bonito em qualquer recorte de tela, mas isso normaliza pela área
// visível (a mesma altura real mudaria de valor conforme o enquadramento).
// Aqui a conversão usa as estatísticas globais do próprio serviço (min/max
// documentados), então o mesmo ponto sempre reconstrói pro mesmo cm real.
const MANGROVE_URL =
  "https://gis.earthdata.nasa.gov/image/rest/services/C2389107206-ORNL_CLOUD/CMS_Global_Map_Mangrove_Canopy_1665/ImageServer/exportImage";
const MANGROVE_MIN_CM = 0.2844882905483246;
const MANGROVE_MAX_CM = 910.4758911132812;
const MANGROVE_RENDERING_RULE = encodeURIComponent(
  JSON.stringify({
    rasterFunction: "Stretch",
    rasterFunctionArguments: { StretchType: 6, DRA: false, UseGamma: false },
  }),
);
const MANGROVE_GRID_MAX = 256;
const heightmapCache = new Map();
const HEIGHTMAP_TTL_MS = 6 * 60 * 60 * 1000;

app.get("/mangrove-heightmap", async (req, res) => {
  const west = Number(req.query.west);
  const south = Number(req.query.south);
  const east = Number(req.query.east);
  const north = Number(req.query.north);
  if (![west, south, east, north].every(Number.isFinite)) {
    return res.status(400).json({ error: "west, south, east, north são obrigatórios e numéricos" });
  }
  const cols = Math.min(MANGROVE_GRID_MAX, Math.max(8, Math.round(Number(req.query.cols) || 128)));
  const rows = Math.min(MANGROVE_GRID_MAX, Math.max(8, Math.round(Number(req.query.rows) || 128)));

  const key = `${west.toFixed(4)},${south.toFixed(4)},${east.toFixed(4)},${north.toFixed(4)}:${cols}x${rows}`;
  const hit = heightmapCache.get(key);
  if (hit && Date.now() - hit.at < HEIGHTMAP_TTL_MS) {
    return res.set("Cache-Control", "public, max-age=3600").json({ data: hit.data });
  }

  try {
    const url =
      `${MANGROVE_URL}?bbox=${west},${south},${east},${north}` +
      `&bboxSR=4326&imageSR=4326&size=${cols},${rows}&format=png32&f=image` +
      `&renderingRule=${MANGROVE_RENDERING_RULE}`;
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return res.status(502).json({ error: `NASA ImageServer respondeu ${upstream.status}` });
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    const { data: pixels, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });

    if (info.width !== cols || info.height !== rows || info.channels < 4) {
      return res.status(502).json({
        error: `Resposta inesperada da NASA (${info.width}x${info.height}, ${info.channels} canais)`,
      });
    }

    const total = cols * rows;
    const heightCm = new Array(total);
    let minCm = Infinity;
    let maxCm = 0;
    for (let i = 0; i < total; i++) {
      const o = i * info.channels;
      const alpha = pixels[o + 3];
      let cm = 0;
      if (alpha > 0) {
        const gray = pixels[o]; // R=G=B nessa renderização (escala de cinza)
        cm = Math.round(MANGROVE_MIN_CM + (gray / 255) * (MANGROVE_MAX_CM - MANGROVE_MIN_CM));
        if (cm < minCm) minCm = cm;
        if (cm > maxCm) maxCm = cm;
      }
      heightCm[i] = cm;
    }
    if (!Number.isFinite(minCm)) minCm = 0;

    const data = { bbox: [west, south, east, north], cols, rows, heightCm, minCm, maxCm };
    heightmapCache.set(key, { at: Date.now(), data });
    res.set("Cache-Control", "public, max-age=3600").json({ data });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ── Biomassa acima do solo (ESA CCI Biomass) — grade real em Mg/ha ─────────
// Complementa a altura da NASA: floresta em geral (não tem produto específico
// de manguezal), mas é o único dado de biomassa público, sem chave e com
// valores reais confirmados nesta área (a NASA tem camadas de biomassa no
// mesmo serviço, mas exigem token — nunca confirmadas como acessíveis). Via
// ncss (NetCDF Subset Service) do THREDDS da CEDA: devolve os valores nativos
// do NetCDF direto, sem quantização em 8-bit (diferente do PNG da NASA) —
// não precisa de min/max global pra reconstrução, o valor já vem em Mg/ha.
const ESA_AGB_YEAR = 2024;
const ESA_AGB_NCSS_URL = `https://data.cci.ceda.ac.uk/thredds/ncss/grid/esacci/biomass/data/agb/maps/v7.0/netcdf/ESACCI-BIOMASS-L4-AGB-MERGED-100m-${ESA_AGB_YEAR}-fv7.0.nc`;
// Passo nativo do grid em graus (~100m no equador), do dataset.xml da CEDA.
const ESA_NATIVE_CELL_DEG = 0.0008888888888805013;
// Nunca baixa mais que isso por lado — recortes grandes usam horizStride
// maior (subamostra no próprio servidor da CEDA, não baixa o grid inteiro).
const ESA_MAX_NATIVE_SAMPLES = 700;
const biomassCache = new Map();

app.get("/mangrove-biomass", async (req, res) => {
  const west = Number(req.query.west);
  const south = Number(req.query.south);
  const east = Number(req.query.east);
  const north = Number(req.query.north);
  if (![west, south, east, north].every(Number.isFinite)) {
    return res.status(400).json({ error: "west, south, east, north são obrigatórios e numéricos" });
  }
  const cols = Math.min(MANGROVE_GRID_MAX, Math.max(8, Math.round(Number(req.query.cols) || 128)));
  const rows = Math.min(MANGROVE_GRID_MAX, Math.max(8, Math.round(Number(req.query.rows) || 128)));

  const key = `${west.toFixed(4)},${south.toFixed(4)},${east.toFixed(4)},${north.toFixed(4)}:${cols}x${rows}`;
  const hit = biomassCache.get(key);
  if (hit && Date.now() - hit.at < HEIGHTMAP_TTL_MS) {
    return res.set("Cache-Control", "public, max-age=3600").json({ data: hit.data });
  }

  try {
    const nativeCols = Math.max(1, Math.round((east - west) / ESA_NATIVE_CELL_DEG));
    const nativeRows = Math.max(1, Math.round((north - south) / ESA_NATIVE_CELL_DEG));
    const stride = Math.max(
      1,
      Math.ceil(Math.max(nativeCols, nativeRows) / ESA_MAX_NATIVE_SAMPLES),
    );

    const url =
      `${ESA_AGB_NCSS_URL}?var=agb&north=${north}&south=${south}&east=${east}&west=${west}` +
      `&horizStride=${stride}&accept=netcdf`;
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return res.status(502).json({ error: `ESA THREDDS respondeu ${upstream.status}` });
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    const reader = new NetCDFReader(buf);
    const nativeLat = reader.getDataVariable("lat");
    const nativeLon = reader.getDataVariable("lon");
    const nativeAgb = reader.getDataVariable("agb");
    const nRows = nativeLat.length;
    const nCols = nativeLon.length;
    // NetCDF clássico alinha a variável em blocos de 4 bytes: grades com
    // dimensão ímpar (ex. 563x563 em tipos de 2 bytes) sobram 1 valor de
    // padding no fim — inofensivo, nunca é indexado (índice máximo é
    // (nRows-1)*nCols+(nCols-1), sempre menor que nRows*nCols).
    if (nativeAgb.length < nRows * nCols) {
      return res.status(502).json({ error: "Grade inesperada na resposta da ESA" });
    }

    // Reamostra (vizinho mais próximo) pra grade cols x rows pedida, alinhada
    // célula a célula com o /mangrove-heightmap (mesmo bbox) — a resolução
    // nativa é diferente (100m ESA vs ~31m NASA), então os dois só se casam na
    // grade de visualização, não no pixel de origem.
    const agbMgHa = new Array(cols * rows);
    let minMgHa = Infinity;
    let maxMgHa = 0;
    for (let row = 0; row < rows; row++) {
      const targetLat = north - (row / (rows - 1)) * (north - south);
      let srcRow = Math.round(
        ((targetLat - nativeLat[0]) / (nativeLat[nRows - 1] - nativeLat[0])) * (nRows - 1),
      );
      srcRow = Math.min(nRows - 1, Math.max(0, srcRow));
      for (let col = 0; col < cols; col++) {
        const targetLon = west + (col / (cols - 1)) * (east - west);
        let srcCol = Math.round(
          ((targetLon - nativeLon[0]) / (nativeLon[nCols - 1] - nativeLon[0])) * (nCols - 1),
        );
        srcCol = Math.min(nCols - 1, Math.max(0, srcCol));
        const raw = nativeAgb[srcRow * nCols + srcCol];
        const value = Number.isFinite(raw) ? raw : 0;
        agbMgHa[row * cols + col] = value;
        if (value > 0) {
          if (value < minMgHa) minMgHa = value;
          if (value > maxMgHa) maxMgHa = value;
        }
      }
    }
    if (!Number.isFinite(minMgHa)) minMgHa = 0;

    const data = {
      bbox: [west, south, east, north],
      cols,
      rows,
      agbMgHa,
      minMgHa,
      maxMgHa,
      year: ESA_AGB_YEAR,
    };
    biomassCache.set(key, { at: Date.now(), data });
    res.set("Cache-Control", "public, max-age=3600").json({ data });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ── Extensão real do manguezal (MapBiomas) — máscara de classificação ──────
// NASA dá altura e ESA dá biomassa geral, mas nenhum dos dois responde "aqui
// É manguezal ou não" — é exatamente o que a classificação anual do
// MapBiomas responde (classe 5 = Manguezal), e é a fonte mais citada em
// estudos revisados por pares sobre o tema no Brasil. O mosaico anual do
// Brasil inteiro fica num bucket público do Google Cloud Storage como
// Cloud-Optimized GeoTIFF (COG): sem chave, sem login, sem conta do Earth
// Engine — a lib `geotiff` faz range requests HTTP e lê só os blocos da
// área pedida (~poucos KB), nunca baixa o arquivo inteiro (~1GB, Brasil).
const MAPBIOMAS_YEAR = 2023; // ano mais recente confirmado disponível nesse caminho
const MAPBIOMAS_MANGROVE_CLASS = 5;
const MAPBIOMAS_URL = (year) =>
  `https://storage.googleapis.com/mapbiomas-public/initiatives/brasil/collection_9/lclu/coverage/brasil_coverage_${year}.tif`;
const METERS_PER_DEGREE_LAT = 111_320;

// A leitura do cabeçalho/IFD do COG remoto (~700ms) é reaproveitada entre
// requisições — só a janela pedida é buscada de novo a cada bbox diferente.
// IMPORTANTE: readRasters precisa ser chamado no objeto GeoTIFF (multi-IFD),
// não em getImage() — só assim ele escolhe automaticamente a overview certa
// pro tamanho pedido. Testado: via getImage() (força resolução plena, 155
// mil x 159 mil px) uma janela pequena não retornou nem em 2 minutos; via
// GeoTIFF direto, a mesma janela leva ~3,5s.
const mapbiomasTiffCache = new Map();
async function getMapbiomasTiff(year) {
  const hit = mapbiomasTiffCache.get(year);
  if (hit) return hit;
  const promise = geotiffFromUrl(MAPBIOMAS_URL(year));
  mapbiomasTiffCache.set(year, promise);
  promise.catch(() => mapbiomasTiffCache.delete(year));
  return promise;
}

const extentCache = new Map();

app.get("/mangrove-extent", async (req, res) => {
  const west = Number(req.query.west);
  const south = Number(req.query.south);
  const east = Number(req.query.east);
  const north = Number(req.query.north);
  if (![west, south, east, north].every(Number.isFinite)) {
    return res.status(400).json({ error: "west, south, east, north são obrigatórios e numéricos" });
  }
  const cols = Math.min(MANGROVE_GRID_MAX, Math.max(8, Math.round(Number(req.query.cols) || 128)));
  const rows = Math.min(MANGROVE_GRID_MAX, Math.max(8, Math.round(Number(req.query.rows) || 128)));
  const year = Math.round(Number(req.query.year)) || MAPBIOMAS_YEAR;

  const key = `${west.toFixed(4)},${south.toFixed(4)},${east.toFixed(4)},${north.toFixed(4)}:${cols}x${rows}:${year}`;
  const hit = extentCache.get(key);
  if (hit && Date.now() - hit.at < HEIGHTMAP_TTL_MS) {
    return res.set("Cache-Control", "public, max-age=3600").json({ data: hit.data });
  }

  try {
    const tiff = await getMapbiomasTiff(year);
    const [classes] = await tiff.readRasters({
      bbox: [west, south, east, north],
      width: cols,
      height: rows,
      resampleMethod: "nearest", // dado categórico: interpolar geraria classes que não existem
    });

    const total = cols * rows;
    const mangrove = new Array(total);
    const centerLat = (south + north) / 2;
    const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos((centerLat * Math.PI) / 180);
    const cellAreaM2 =
      ((east - west) / cols) *
      metersPerDegreeLng *
      (((north - south) / rows) * METERS_PER_DEGREE_LAT);
    let mangroveCells = 0;
    for (let i = 0; i < total; i++) {
      const isMangrove = classes[i] === MAPBIOMAS_MANGROVE_CLASS ? 1 : 0;
      mangrove[i] = isMangrove;
      mangroveCells += isMangrove;
    }
    const areaHa = Math.round((mangroveCells * cellAreaM2) / 10_000);

    const data = { bbox: [west, south, east, north], cols, rows, mangrove, areaHa, year };
    extentCache.set(key, { at: Date.now(), data });
    res.set("Cache-Control", "public, max-age=3600").json({ data });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ── Extensão real do manguezal (Global Mangrove Watch v4, 2020) ────────────
// Segunda fonte independente de extensão (a primeira é o MapBiomas acima):
// Sentinel-2 a 10m, remapeado especificamente para capturar manguezal de
// franja e ripário em canais estreitos — mais fino que o MapBiomas (30m).
// Sem chave, sem login (CC BY 4.0, Zenodo) — mas o arquivo publicado é 1
// único ZIP de ~180MB com o mundo inteiro, não um serviço de recorte como os
// outros. Truque: o ZIP na verdade contém 1647 tiles de 1°×1° já separados
// (~500KB-2MB cada); lendo só o índice central do ZIP via HTTP Range (nunca
// baixando o arquivo inteiro) a gente acha e busca só a tile da nossa área.
const GMW_ZIP_URL =
  "https://zenodo.org/api/records/12756047/files/gmw_mng_2020_v4019_gtiff.zip/content";
const GMW_YEAR = 2020;
// Resolução fixa do cache em memória por tile (1°×1° → ~55m/px): decodifica
// 1x (o passo lento, ~10s, é reler+inflar+decodificar o GeoTIFF da tile) e
// guarda o array bruto — todo request depois só amostra esse array em JS
// puro (testado: cai de segundos por request pra 1-3ms).
const GMW_TILE_GRID = 2000;

function gmwUrlSource(url) {
  return {
    size: async () => Number((await fetch(url, { method: "HEAD" })).headers.get("content-length")),
    stream: (offset, length) => {
      const end = length ? offset + length - 1 : "";
      const passthrough = new PassThrough();
      fetch(url, { headers: { range: `bytes=${offset}-${end}` } })
        .then((res) => Readable.fromWeb(res.body).pipe(passthrough))
        .catch((e) => passthrough.emit("error", e));
      return passthrough;
    },
  };
}

let gmwDirectoryPromise = null;
function getGmwDirectory() {
  if (!gmwDirectoryPromise) {
    gmwDirectoryPromise = unzipper.Open.custom(gmwUrlSource(GMW_ZIP_URL));
    gmwDirectoryPromise.catch(() => {
      gmwDirectoryPromise = null;
    });
  }
  return gmwDirectoryPromise;
}

// Convenção do nome da tile (confirmada testando contra o arquivo real): o
// número após S é o extremo NORTE do quadrado 1°×1° (ele se estende 1° pra
// SUL a partir dali); o número após W é o extremo OESTE (se estende 1° pro
// LESTE). Ex.: S26W049 cobre exatamente lat [-27,-26) × lon [-49,-48).
function gmwTileName(lat, lon) {
  const tileNorth = Math.ceil(lat);
  const tileWest = Math.floor(lon);
  const latLetter = tileNorth <= 0 ? "S" : "N";
  const lonLetter = tileWest < 0 ? "W" : "E";
  const latNum = String(Math.abs(tileNorth)).padStart(2, "0");
  const lonNum = String(Math.abs(tileWest)).padStart(3, "0");
  return `GMW_${latLetter}${latNum}${lonLetter}${lonNum}_v4019_mng.tif`;
}

function gmwTilesForBbox(west, south, east, north) {
  const names = [];
  for (let tileNorth = Math.floor(south) + 1; tileNorth <= Math.ceil(north); tileNorth++) {
    const tileSouth = tileNorth - 1;
    if (tileSouth >= north || tileNorth <= south) continue;
    for (let tileWest = Math.floor(west); tileWest < Math.ceil(east); tileWest++) {
      const tileEast = tileWest + 1;
      if (tileWest >= east || tileEast <= west) continue;
      names.push(gmwTileName(tileNorth - 0.5, tileWest + 0.5)); // ponto central evita ambiguidade de borda
    }
  }
  return names;
}

const gmwTileGridCache = new Map(); // nome da tile -> Promise<{ grid, bbox } | null>
function getGmwTileGrid(name) {
  if (gmwTileGridCache.has(name)) return gmwTileGridCache.get(name);
  const promise = (async () => {
    const directory = await getGmwDirectory();
    const entry = directory.files.find((f) => f.path === name);
    if (!entry) return null; // tile não existe no dataset = sem manguezal ali (é esparso, só existem tiles com dado)
    const buf = await entry.buffer();
    const tiff = await geotiffFromArrayBuffer(
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    );
    const image = await tiff.getImage();
    const [grid] = await image.readRasters({
      width: GMW_TILE_GRID,
      height: GMW_TILE_GRID,
      resampleMethod: "nearest",
    });
    return { grid, bbox: image.getBoundingBox() };
  })();
  gmwTileGridCache.set(name, promise);
  promise.catch(() => gmwTileGridCache.delete(name));
  return promise;
}

app.get("/mangrove-extent-gmw", async (req, res) => {
  const west = Number(req.query.west);
  const south = Number(req.query.south);
  const east = Number(req.query.east);
  const north = Number(req.query.north);
  if (![west, south, east, north].every(Number.isFinite)) {
    return res.status(400).json({ error: "west, south, east, north são obrigatórios e numéricos" });
  }
  const cols = Math.min(MANGROVE_GRID_MAX, Math.max(8, Math.round(Number(req.query.cols) || 128)));
  const rows = Math.min(MANGROVE_GRID_MAX, Math.max(8, Math.round(Number(req.query.rows) || 128)));

  try {
    const tileNames = gmwTilesForBbox(west, south, east, north);
    const tiles = (await Promise.all(tileNames.map(getGmwTileGrid))).filter(Boolean);

    const mangrove = new Array(cols * rows).fill(0);
    for (let row = 0; row < rows; row++) {
      const lat = north - (row / (rows - 1)) * (north - south);
      for (let col = 0; col < cols; col++) {
        const lon = west + (col / (cols - 1)) * (east - west);
        for (const t of tiles) {
          const [tw, ts, te, tn] = t.bbox;
          if (lon < tw || lon > te || lat < ts || lat > tn) continue;
          const srcRow = Math.min(
            GMW_TILE_GRID - 1,
            Math.max(0, Math.round(((tn - lat) / (tn - ts)) * (GMW_TILE_GRID - 1))),
          );
          const srcCol = Math.min(
            GMW_TILE_GRID - 1,
            Math.max(0, Math.round(((lon - tw) / (te - tw)) * (GMW_TILE_GRID - 1))),
          );
          if (t.grid[srcRow * GMW_TILE_GRID + srcCol]) mangrove[row * cols + col] = 1;
          break;
        }
      }
    }

    const centerLat = (south + north) / 2;
    const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos((centerLat * Math.PI) / 180);
    const cellAreaM2 =
      ((east - west) / cols) *
      metersPerDegreeLng *
      (((north - south) / rows) * METERS_PER_DEGREE_LAT);
    const mangroveCells = mangrove.reduce((s, v) => s + v, 0);
    const areaHa = Math.round((mangroveCells * cellAreaM2) / 10_000);

    const data = { bbox: [west, south, east, north], cols, rows, mangrove, areaHa, year: GMW_YEAR };
    res.set("Cache-Control", "public, max-age=3600").json({ data });
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
