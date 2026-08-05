// Karaguá API — Express + Postgres (Railway) + JWT de admin único.
// Substitui o Supabase: CRUD de pontos_interesse, login do admin e a maré
// via Open-Meteo Marine (dados Copernicus, sem chave).
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const { NetCDFReader } = require("netcdfjs");
const { fromArrayBuffer: geotiffFromArrayBuffer } = require("geotiff");
const unzipper = require("unzipper");
const { Readable, PassThrough } = require("stream");

const {
  DATABASE_URL,
  JWT_SECRET,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  CORS_ORIGIN,
  // Opcional: só o /mangrove-heightmap (TanDEM-X, dataset protegido) precisa.
  // Sem essa variável o endpoint responde 502 com mensagem clara — não
  // derruba o resto da API, então fica de fora da checagem obrigatória abaixo.
  NASA_EARTHDATA_TOKEN,
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

const MANGROVE_GRID_MAX = 256;
const heightmapCache = new Map();
const HEIGHTMAP_TTL_MS = 6 * 60 * 60 * 1000;

// Enumera os quadrados inteiros de 1°×1° que cobrem um bbox — usado tanto
// pela altura (TanDEM-X) quanto pela extensão (GMW mais abaixo). IMPORTANTE,
// descoberto testando contra os arquivos reais: os dois datasets cobrem a
// MESMA área mas nomeiam a tile de jeitos DIFERENTES — GMW nomeia pelo canto
// NOROESTE (ex. GMW_S26W049 cobre lat [-27,-26)), TanDEM-X nomeia pelo canto
// SUDOESTE (ex. TDM1_..._S27W049_... cobre a MESMA área [-27,-26), mas com o
// número 27, não 26 — existe até um S26W049 diferente no TanDEM-X, cobrindo
// [-26,-25)). Por isso só a enumeração do quadrado (SW) é compartilhada; cada
// dataset tem sua própria função de nome a partir do mesmo {south, west}.
function integerTilesForBbox(west, south, east, north) {
  const tiles = [];
  for (let tileSouth = Math.floor(south); tileSouth < Math.ceil(north); tileSouth++) {
    const tileNorth = tileSouth + 1;
    if (tileSouth >= north || tileNorth <= south) continue;
    for (let tileWest = Math.floor(west); tileWest < Math.ceil(east); tileWest++) {
      const tileEast = tileWest + 1;
      if (tileWest >= east || tileEast <= west) continue;
      tiles.push({ south: tileSouth, west: tileWest });
    }
  }
  return tiles;
}

function formatTileCore({ south, west }, { northBased }) {
  const latValue = northBased ? south + 1 : south;
  const latLetter = latValue <= 0 ? "S" : "N";
  const lonLetter = west < 0 ? "W" : "E";
  const latNum = String(Math.abs(latValue)).padStart(2, "0");
  const lonNum = String(Math.abs(west)).padStart(3, "0");
  return `${latLetter}${latNum}${lonLetter}${lonNum}`;
}

// ── Altura de dossel do manguezal (TanDEM-X 2015, Simard et al. 2024) ─────
// Substitui o dataset anterior (Simard et al. 2019, ImageServer público): 12m
// de resolução (vs ~31m), calibrado/validado com GEDI, RMSE 2,4m. DOI
// 10.3334/ORNLDAAC/2251. Diferente de tudo mais que integramos: os arquivos
// ficam atrás de autenticação NASA Earthdata Login — precisa de um token
// pessoal (urs.earthdata.nasa.gov → Profile → Generate Token) na env
// NASA_EARTHDATA_TOKEN. Cada tile já vem em METROS reais (float32) direto do
// GeoTIFF — sem faixa global pra reconstruir feito o dataset antigo (que
// vinha em PNG de 8 bits e precisava de min/max documentados pra converter
// de volta pra cm).
const TANDEMX_YEAR = 2015;
// Cache em memória por tile igual ao GMW abaixo: decodifica 1x (~poucos
// segundos, arquivo de ~3-4MB) e guarda o array bruto — requests seguintes só
// amostram esse array. resampleMethod bilinear (não nearest) porque altura é
// contínua, diferente da máscara binária do GMW.
const TANDEMX_TILE_GRID = 2000;
const TANDEMX_URL = (core) =>
  `https://data.ornldaac.earthdata.nasa.gov/protected/cms/CMS_Global_Mangrove_Forest_Ht/data/TDM1_DEM__04_${core}_DEM_EGM08_GMW314_2015_WM_hcap_cal.tif`;

const tandemxTileGridCache = new Map(); // tile core -> Promise<{ grid, bbox } | null>
function getTandemxTileGrid(core) {
  if (tandemxTileGridCache.has(core)) return tandemxTileGridCache.get(core);
  const promise = (async () => {
    if (!NASA_EARTHDATA_TOKEN) {
      throw new Error(
        "NASA_EARTHDATA_TOKEN não configurado no servidor (necessário pro dataset TanDEM-X)",
      );
    }
    const upstream = await fetch(TANDEMX_URL(core), {
      headers: { Authorization: `Bearer ${NASA_EARTHDATA_TOKEN}` },
    });
    if (upstream.status === 404 || upstream.status === 403) return null; // tile sem manguezal nessa região
    if (!upstream.ok) {
      throw new Error(`NASA Earthdata respondeu ${upstream.status} (token expirado ou inválido?)`);
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    const tiff = await geotiffFromArrayBuffer(
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    );
    const image = await tiff.getImage();
    const [grid] = await image.readRasters({
      width: TANDEMX_TILE_GRID,
      height: TANDEMX_TILE_GRID,
      resampleMethod: "bilinear",
    });
    return { grid, bbox: image.getBoundingBox() };
  })();
  tandemxTileGridCache.set(core, promise);
  promise.catch(() => tandemxTileGridCache.delete(core));
  return promise;
}

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
    const tileCores = integerTilesForBbox(west, south, east, north).map((t) =>
      formatTileCore(t, { northBased: false }),
    );
    const tiles = (await Promise.all(tileCores.map(getTandemxTileGrid))).filter(Boolean);

    const total = cols * rows;
    const heightCm = new Array(total).fill(0);
    let minCm = Infinity;
    let maxCm = 0;
    for (let row = 0; row < rows; row++) {
      const lat = north - (row / (rows - 1)) * (north - south);
      for (let col = 0; col < cols; col++) {
        const lon = west + (col / (cols - 1)) * (east - west);
        for (const t of tiles) {
          const [tw, ts, te, tn] = t.bbox;
          if (lon < tw || lon > te || lat < ts || lat > tn) continue;
          const srcRow = Math.min(
            TANDEMX_TILE_GRID - 1,
            Math.max(0, Math.round(((tn - lat) / (tn - ts)) * (TANDEMX_TILE_GRID - 1))),
          );
          const srcCol = Math.min(
            TANDEMX_TILE_GRID - 1,
            Math.max(0, Math.round(((lon - tw) / (te - tw)) * (TANDEMX_TILE_GRID - 1))),
          );
          const meters = t.grid[srcRow * TANDEMX_TILE_GRID + srcCol];
          const cm = Number.isFinite(meters) && meters > 0 ? Math.round(meters * 100) : 0;
          heightCm[row * cols + col] = cm;
          if (cm > 0) {
            if (cm < minCm) minCm = cm;
            if (cm > maxCm) maxCm = cm;
          }
          break;
        }
      }
    }
    if (!Number.isFinite(minCm)) minCm = 0;

    const data = {
      bbox: [west, south, east, north],
      cols,
      rows,
      heightCm,
      minCm,
      maxCm,
      year: TANDEMX_YEAR,
    };
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

const METERS_PER_DEGREE_LAT = 111_320;

// ── Extensão real do manguezal (Global Mangrove Watch v4, 2020) ────────────
// NASA dá altura e ESA dá biomassa geral, mas nenhum dos dois responde "aqui
// É manguezal ou não" — é exatamente o que essa camada responde. Sentinel-2 a
// 10m, remapeado especificamente para capturar manguezal de franja e
// ripário em canais estreitos, como o Linguado.
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

// GMW nomeia pelo canto NOROESTE (northBased: true) — diferente do TanDEM-X
// acima, que nomeia pelo canto SUDOESTE. Ver o comentário de
// integerTilesForBbox pra o porquê dessa diferença entre os dois datasets.
function gmwTileName(tile) {
  return `GMW_${formatTileCore(tile, { northBased: true })}_v4019_mng.tif`;
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
    const tileNames = integerTilesForBbox(west, south, east, north).map(gmwTileName);
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
