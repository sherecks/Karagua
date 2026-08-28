// Karaguá API — Express + Postgres (Railway) + JWT de admin único.
// Substitui o Supabase: CRUD de pontos_interesse, login do admin e a maré
// via Open-Meteo Marine (dados Copernicus, sem chave).
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const { NetCDFReader } = require("netcdfjs");
const { fromArrayBuffer: geotiffFromArrayBuffer, fromUrl: geotiffFromUrl } = require("geotiff");
const fs = require("fs");
const path = require("path");

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

// Teto de resolução da grade pedida por qualquer endpoint de manguezal
// (altura, biomassa, extensão GMW). Compartilhado entre os três — o front
// pede até esse valor quando quer mais detalhe (célula menor = mais
// variação no terreno 3D).
const MANGROVE_GRID_MAX = 320;
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
const TANDEMX_URL = (core) =>
  `https://data.ornldaac.earthdata.nasa.gov/protected/cms/CMS_Global_Mangrove_Forest_Ht/data/TDM1_DEM__04_${core}_DEM_EGM08_GMW314_2015_WM_hcap_cal.tif`;

// Cache só do OBJETO GeoTIFF decodificado (metadados + índice de tiles
// internos), não da grade de altura inteira: uma tile de 1°×1° a 12m nativo
// tem ~9000×9000 pixels (~300MB em float32) — decodificar isso tudo de uma
// vez pra depois amostrar por vizinho-mais-próximo foi o que causava o
// artefato de "quadrados": um recorte pequeno pedindo 320 colunas cai bem
// abaixo da resolução nativa, então virava amostragem grosseira demais
// (achatada em blocos). Em vez disso, cada request faz sua própria leitura
// EM JANELA (readRasters com `window`) só da porção da tile que cobre o
// bbox pedido, já reamostrada por bilinear pro tamanho exato solicitado —
// mais rápido (decodifica só os blocos internos necessários) e sem perder
// resolução antes de reamostrar.
const tandemxImageCache = new Map(); // tile core -> Promise<{ image, bbox, width, height } | null>
function getTandemxImage(core) {
  if (tandemxImageCache.has(core)) return tandemxImageCache.get(core);
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
    return {
      image,
      bbox: image.getBoundingBox(),
      width: image.getWidth(),
      height: image.getHeight(),
    };
  })();
  tandemxImageCache.set(core, promise);
  promise.catch(() => tandemxImageCache.delete(core));
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
    const tiles = (await Promise.all(tileCores.map(getTandemxImage))).filter(Boolean);

    const total = cols * rows;
    const heightCm = new Array(total).fill(0);
    let minCm = Infinity;
    let maxCm = 0;

    // Por tile: recorta só a sub-região da grade de SAÍDA (cols×rows) que
    // cai dentro do bbox da tile, e pede pro geotiff.js ler exatamente essa
    // janela nativa já reamostrada (bilinear) pro tamanho dessa sub-região —
    // sem passar por uma grade intermediária de resolução fixa.
    for (const tile of tiles) {
      const [tw, ts, te, tn] = tile.bbox;
      const clipWest = Math.max(west, tw);
      const clipEast = Math.min(east, te);
      const clipSouth = Math.max(south, ts);
      const clipNorth = Math.min(north, tn);
      if (clipWest >= clipEast || clipSouth >= clipNorth) continue;

      const colStart = Math.max(0, Math.ceil(((clipWest - west) / (east - west)) * (cols - 1)));
      const colEnd = Math.min(
        cols - 1,
        Math.floor(((clipEast - west) / (east - west)) * (cols - 1)),
      );
      const rowStart = Math.max(0, Math.ceil(((north - clipNorth) / (north - south)) * (rows - 1)));
      const rowEnd = Math.min(
        rows - 1,
        Math.floor(((north - clipSouth) / (north - south)) * (rows - 1)),
      );
      if (colEnd < colStart || rowEnd < rowStart) continue;
      const subCols = colEnd - colStart + 1;
      const subRows = rowEnd - rowStart + 1;

      const subWest = west + (colStart / (cols - 1)) * (east - west);
      const subEast = west + (colEnd / (cols - 1)) * (east - west);
      const subNorth = north - (rowStart / (rows - 1)) * (north - south);
      const subSouth = north - (rowEnd / (rows - 1)) * (north - south);

      const xMin = Math.max(0, Math.floor(((subWest - tw) / (te - tw)) * tile.width));
      const xMax = Math.min(tile.width, Math.ceil(((subEast - tw) / (te - tw)) * tile.width));
      const yMin = Math.max(0, Math.floor(((tn - subNorth) / (tn - ts)) * tile.height));
      const yMax = Math.min(tile.height, Math.ceil(((tn - subSouth) / (tn - ts)) * tile.height));
      if (xMax <= xMin || yMax <= yMin) continue;

      const [grid] = await tile.image.readRasters({
        window: [xMin, yMin, xMax, yMax],
        width: subCols,
        height: subRows,
        resampleMethod: "bilinear",
      });
      for (let r = 0; r < subRows; r++) {
        for (let c = 0; c < subCols; c++) {
          const meters = grid[r * subCols + c];
          const cm = Number.isFinite(meters) && meters > 0 ? Math.round(meters * 100) : 0;
          heightCm[(rowStart + r) * cols + (colStart + c)] = cm;
          if (cm > 0) {
            if (cm < minCm) minCm = cm;
            if (cm > maxCm) maxCm = cm;
          }
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

// ── Carbono orgânico do solo (Sanderman et al. 2018, atualização 2023) ────
// A maior parte do carbono de um manguezal fica no SOLO, não na biomassa
// acima dele — bem diferente de floresta terrestre comum, que é o que o
// biomassa (ESA CCI acima) mede. Esse dataset é calibrado especificamente
// pra manguezal (não solo genérico como o SoilGrids do ISRIC, que
// subestimaria bastante esse número por não considerar o solo encharcado/
// anaeróbico), 0-100cm de profundidade, 30m, em toneladas de carbono por
// hectare. Vem num único GeoTIFF de ~1,5GB cobrindo o mundo inteiro — o
// Zenodo aceita HTTP Range, então o geotiff.js lê só a janela da nossa área
// direto da URL remota (testado ao vivo: abrir o cabeçalho ~2s, ler a
// janela da nossa área ~2s, poucos KB baixados, nunca o arquivo inteiro).
// DOI 10.5281/zenodo.1469347 (concept) / zenodo.7727569 (v1.2).
const SOC_URL =
  "https://zenodo.org/api/records/7727569/files/soc.tha_tnc.mangroves.typology_m_30m_b0..100cm_2019_2020_go_epsg.4326_v1.2.tif/content";
const SOC_PERIOD = "2019-2020";
const SOC_GRID_MAX = 320;

let socImagePromise = null;
function getSocImage() {
  if (!socImagePromise) {
    socImagePromise = (async () => {
      const tiff = await geotiffFromUrl(SOC_URL);
      const image = await tiff.getImage();
      return {
        image,
        bbox: image.getBoundingBox(),
        width: image.getWidth(),
        height: image.getHeight(),
      };
    })();
    socImagePromise.catch(() => {
      socImagePromise = null;
    });
  }
  return socImagePromise;
}

const socCache = new Map();
const SOC_TTL_MS = 6 * 60 * 60 * 1000;

app.get("/mangrove-soc", async (req, res) => {
  const west = Number(req.query.west);
  const south = Number(req.query.south);
  const east = Number(req.query.east);
  const north = Number(req.query.north);
  if (![west, south, east, north].every(Number.isFinite)) {
    return res.status(400).json({ error: "west, south, east, north são obrigatórios e numéricos" });
  }
  const cols = Math.min(SOC_GRID_MAX, Math.max(8, Math.round(Number(req.query.cols) || 128)));
  const rows = Math.min(SOC_GRID_MAX, Math.max(8, Math.round(Number(req.query.rows) || 128)));

  const key = `${west.toFixed(4)},${south.toFixed(4)},${east.toFixed(4)},${north.toFixed(4)}:${cols}x${rows}`;
  const hit = socCache.get(key);
  if (hit && Date.now() - hit.at < SOC_TTL_MS) {
    return res.set("Cache-Control", "public, max-age=3600").json({ data: hit.data });
  }

  try {
    const soc = await getSocImage();
    const [tw, ts, te, tn] = soc.bbox;
    const clipWest = Math.max(west, tw);
    const clipEast = Math.min(east, te);
    const clipSouth = Math.max(south, ts);
    const clipNorth = Math.min(north, tn);

    const socTha = new Array(cols * rows).fill(0);
    let minTha = Infinity;
    let maxTha = 0;

    if (clipWest < clipEast && clipSouth < clipNorth) {
      const colStart = Math.max(0, Math.ceil(((clipWest - west) / (east - west)) * (cols - 1)));
      const colEnd = Math.min(
        cols - 1,
        Math.floor(((clipEast - west) / (east - west)) * (cols - 1)),
      );
      const rowStart = Math.max(0, Math.ceil(((north - clipNorth) / (north - south)) * (rows - 1)));
      const rowEnd = Math.min(
        rows - 1,
        Math.floor(((north - clipSouth) / (north - south)) * (rows - 1)),
      );

      if (colEnd >= colStart && rowEnd >= rowStart) {
        const subCols = colEnd - colStart + 1;
        const subRows = rowEnd - rowStart + 1;

        const subWest = west + (colStart / (cols - 1)) * (east - west);
        const subEast = west + (colEnd / (cols - 1)) * (east - west);
        const subNorth = north - (rowStart / (rows - 1)) * (north - south);
        const subSouth = north - (rowEnd / (rows - 1)) * (north - south);

        const xMin = Math.max(0, Math.floor(((subWest - tw) / (te - tw)) * soc.width));
        const xMax = Math.min(soc.width, Math.ceil(((subEast - tw) / (te - tw)) * soc.width));
        const yMin = Math.max(0, Math.floor(((tn - subNorth) / (tn - ts)) * soc.height));
        const yMax = Math.min(soc.height, Math.ceil(((tn - subSouth) / (tn - ts)) * soc.height));

        if (xMax > xMin && yMax > yMin) {
          const [grid] = await soc.image.readRasters({
            window: [xMin, yMin, xMax, yMax],
            width: subCols,
            height: subRows,
            resampleMethod: "bilinear",
          });
          for (let r = 0; r < subRows; r++) {
            for (let c = 0; c < subCols; c++) {
              const raw = grid[r * subCols + c];
              // nodata = -32768 (int16); qualquer valor real de SOC é positivo.
              const tha = Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 0;
              socTha[(rowStart + r) * cols + (colStart + c)] = tha;
              if (tha > 0) {
                if (tha < minTha) minTha = tha;
                if (tha > maxTha) maxTha = tha;
              }
            }
          }
        }
      }
    }
    if (!Number.isFinite(minTha)) minTha = 0;

    const data = {
      bbox: [west, south, east, north],
      cols,
      rows,
      socTha,
      minTha,
      maxTha,
      period: SOC_PERIOD,
    };
    socCache.set(key, { at: Date.now(), data });
    res.set("Cache-Control", "public, max-age=3600").json({ data });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

const METERS_PER_DEGREE_LAT = 111_320;

// ── Limite oficial do município (IBGE Malhas API) ──────────────────────────
// O histórico não pode usar a extensão VISÍVEL do mapa como área de
// referência: dar zoom out ou arrastar o mapa muda o que "conta", e sempre
// que o retângulo visível passa da fronteira ele pega manguezal de município
// vizinho — o número deixa de significar "manguezal de Balneário Barra do
// Sul". A malha oficial do IBGE (código 4202008) é o polígono real da
// fronteira municipal, não uma aproximação — usada tanto pro bbox de busca
// quanto (via ponto-dentro-do-polígono abaixo) pra excluir células que caem
// fora da fronteira mas dentro do bbox retangular (litoral é irregular).
const IBGE_MUNICIPIO_CODE = 4202057;
const IBGE_MALHA_URL = `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${IBGE_MUNICIPIO_CODE}?formato=application/vnd.geo+json&qualidade=maxima`;

let municipioPromise = null;
function getMunicipioPolygon() {
  if (!municipioPromise) {
    municipioPromise = (async () => {
      const res = await fetch(IBGE_MALHA_URL);
      if (!res.ok) throw new Error(`IBGE Malhas Municipais respondeu ${res.status}`);
      const geojson = await res.json();
      const geometry = geojson.features[0].geometry;
      // A malha pode vir como Polygon ou MultiPolygon dependendo do
      // município — normaliza pra sempre trabalhar com uma lista de anéis.
      const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
      let west = Infinity;
      let south = Infinity;
      let east = -Infinity;
      let north = -Infinity;
      for (const rings of polygons) {
        for (const [lon, lat] of rings[0]) {
          if (lon < west) west = lon;
          if (lon > east) east = lon;
          if (lat < south) south = lat;
          if (lat > north) north = lat;
        }
      }
      return { polygons, bbox: [west, south, east, north] };
    })();
    municipioPromise.catch(() => {
      municipioPromise = null;
    });
  }
  return municipioPromise;
}

// Ray casting padrão (contagem de cruzamentos par/ímpar). Só o anel externo
// de cada polígono importa aqui — a malha do IBGE não tem buraco/enclave
// interno nesse município.
function pointInPolygons(lon, lat, polygons) {
  let inside = false;
  for (const rings of polygons) {
    const ring = rings[0];
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      const crosses = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (crosses) inside = !inside;
    }
  }
  return inside;
}

function cellAreaHaFor(west, south, east, north, cols, rows) {
  const centerLat = (south + north) / 2;
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos((centerLat * Math.PI) / 180);
  const cellAreaM2 =
    ((east - west) / cols) *
    metersPerDegreeLng *
    (((north - south) / rows) * METERS_PER_DEGREE_LAT);
  return cellAreaM2 / 10_000;
}

// ── Extensão do manguezal (GMW v4.1 Timeseries, 1996-2025) ─────────────────
// Fonte única pra toda a extensão/histórico/perda: 1985-2025 anual, 10m,
// Sentinel-2/Landsat, UMA metodologia contínua (suavização Bayesiana + cadeia
// de Markov sobre todos os sensores combinados na hora de treinar, não
// depois) — ver comentário de GMW_FULL_HISTORY_YEARS abaixo pra por que isso
// substituiu o v3 (25m, 1996-2019) + v4 (10m, só 2020) que a camada visual
// usava antes. Zenodo 21346457. Mas o arquivo publicado é 1 tar.gz de
// ~1,3GB com o mundo inteiro (cada tile é 1 GeoTIFF de 41 bandas, uma por
// ano) — baixamos esse arquivo 1x, extraímos só as 2 tiles que cobrem
// Balneário Barra do Sul (~3,8MB) e commitamos esse recorte em
// api/data/gmw-v4112/. A API nunca busca o arquivo de 1,3GB — só lê esses
// arquivos locais já recortados.
const GMW_RECENT_TILE_DIR = path.join(__dirname, "data", "gmw-v4112");
const GMW_RECENT_YEAR_START = 1985;

function gmwRecentTilePath(tile) {
  const core = formatTileCore(tile, { northBased: true });
  return path.join(GMW_RECENT_TILE_DIR, `GMW_${core}_v4112_mng_ext.tif`);
}

const gmwRecentImageCache = new Map(); // caminho do arquivo -> Promise<{ image, bbox, width, height } | null>
function getGmwRecentImage(filePath) {
  if (gmwRecentImageCache.has(filePath)) return gmwRecentImageCache.get(filePath);
  const promise = (async () => {
    if (!fs.existsSync(filePath)) return null; // tile fora do recorte local (não cobre o município)
    const buf = fs.readFileSync(filePath);
    const tiff = await geotiffFromArrayBuffer(
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    );
    const image = await tiff.getImage(0);
    return {
      image,
      bbox: image.getBoundingBox(),
      width: image.getWidth(),
      height: image.getHeight(),
    };
  })();
  gmwRecentImageCache.set(filePath, promise);
  promise.catch(() => gmwRecentImageCache.delete(filePath));
  return promise;
}

// Mesma técnica de leitura em janela do TanDEM-X/SOC, mas amostragem NEAREST
// (não bilinear): é uma máscara binária (é/não é manguezal), interpolar
// criaria valores fracionários sem sentido físico. `samples: [bandIndex]`
// pega só a banda do ano pedido dentro do GeoTIFF de 41 bandas (uma por ano,
// 1985 = banda 0).
async function computeGmwMaskRecent(west, south, east, north, cols, rows, year) {
  const bandIndex = year - GMW_RECENT_YEAR_START;
  const tilePaths = integerTilesForBbox(west, south, east, north).map(gmwRecentTilePath);
  const tiles = (await Promise.all(tilePaths.map(getGmwRecentImage))).filter(Boolean);

  const mangrove = new Array(cols * rows).fill(0);
  for (const tile of tiles) {
    const [tw, ts, te, tn] = tile.bbox;
    const clipWest = Math.max(west, tw);
    const clipEast = Math.min(east, te);
    const clipSouth = Math.max(south, ts);
    const clipNorth = Math.min(north, tn);
    if (clipWest >= clipEast || clipSouth >= clipNorth) continue;

    const colStart = Math.max(0, Math.ceil(((clipWest - west) / (east - west)) * (cols - 1)));
    const colEnd = Math.min(cols - 1, Math.floor(((clipEast - west) / (east - west)) * (cols - 1)));
    const rowStart = Math.max(0, Math.ceil(((north - clipNorth) / (north - south)) * (rows - 1)));
    const rowEnd = Math.min(
      rows - 1,
      Math.floor(((north - clipSouth) / (north - south)) * (rows - 1)),
    );
    if (colEnd < colStart || rowEnd < rowStart) continue;
    const subCols = colEnd - colStart + 1;
    const subRows = rowEnd - rowStart + 1;

    const subWest = west + (colStart / (cols - 1)) * (east - west);
    const subEast = west + (colEnd / (cols - 1)) * (east - west);
    const subNorth = north - (rowStart / (rows - 1)) * (north - south);
    const subSouth = north - (rowEnd / (rows - 1)) * (north - south);

    const xMin = Math.max(0, Math.floor(((subWest - tw) / (te - tw)) * tile.width));
    const xMax = Math.min(tile.width, Math.ceil(((subEast - tw) / (te - tw)) * tile.width));
    const yMin = Math.max(0, Math.floor(((tn - subNorth) / (tn - ts)) * tile.height));
    const yMax = Math.min(tile.height, Math.ceil(((tn - subSouth) / (tn - ts)) * tile.height));
    if (xMax <= xMin || yMax <= yMin) continue;

    const [grid] = await tile.image.readRasters({
      window: [xMin, yMin, xMax, yMax],
      width: subCols,
      height: subRows,
      resampleMethod: "nearest",
      samples: [bandIndex],
    });
    for (let r = 0; r < subRows; r++) {
      for (let c = 0; c < subCols; c++) {
        if (grid[r * subCols + c] > 0) mangrove[(rowStart + r) * cols + (colStart + c)] = 1;
      }
    }
  }
  return mangrove;
}

// Tudo usa SÓ o v4.1.12 agora — histórico, perda E a camada visual do mapa
// (seletor de ano em "Concentração de manguezal"), que antes vinha do v3
// (25m, 1996-2019) + v4 (10m, só 2020). Motivo: descobrimos que o v4.1.12 já
// cobre 1985-2025 inteiro com UMA metodologia contínua (suavização Bayesiana
// + cadeia de Markov sobre todos os sensores — JAXA SAR, Landsat, Sentinel-2
// — combinados na hora de treinar, não depois). Comparar v3 (25m) com
// v4.1.12 (10m) media o efeito de trocar de sensor junto com a mudança real
// (resolução melhor enxerga manguezal fino que o produto antigo nunca via) —
// testamos ao vivo: 1996-2019-2020-2025 tudo pelo v4.1.12 dá uma transição
// suave em 2019→2020 (376→377 ha), sem o degrau que aparecia misturando v3
// com v4.
const GMW_FULL_HISTORY_YEARS = Array.from({ length: 2025 - 1996 + 1 }, (_, i) => 1996 + i);

async function computeGmwExtentRecent(west, south, east, north, cols, rows, year, polygons) {
  const mangrove = await computeGmwMaskRecent(west, south, east, north, cols, rows, year);
  const cellAreaHa = cellAreaHaFor(west, south, east, north, cols, rows);
  let mangroveCells = 0;
  for (let row = 0; row < rows; row++) {
    const lat = north - (row / (rows - 1)) * (north - south);
    for (let col = 0; col < cols; col++) {
      const lon = west + (col / (cols - 1)) * (east - west);
      if (mangrove[row * cols + col] && pointInPolygons(lon, lat, polygons)) mangroveCells++;
    }
  }
  return { mangrove, areaHa: Math.round(mangroveCells * cellAreaHa) };
}

// Extensão de UM ano pra camada visual do mapa (área VISÍVEL, sem filtro de
// município — diferente de computeGmwExtentRecent acima, que é só pro
// histórico/perda).
async function computeGmwExtentViewport(west, south, east, north, cols, rows, year) {
  const mangrove = await computeGmwMaskRecent(west, south, east, north, cols, rows, year);
  const cellAreaHa = cellAreaHaFor(west, south, east, north, cols, rows);
  const areaHa = Math.round(mangrove.reduce((s, v) => s + v, 0) * cellAreaHa);
  return { mangrove, areaHa };
}

// Mesma comparação pixel a pixel do computeGmwLossPeriod abaixo, mas pra
// área VISÍVEL do mapa (sem filtro de município) e devolvendo a grade
// célula a célula em vez de só o agregado em ha — é o que alimenta a
// camada visual "Perda de manguezal" (mostra ONDE, não só quanto).
// -1 = virou não-manguezal (perda), 1 = virou manguezal (ganho), 0 = igual
// nos dois anos.
async function computeGmwLossMask(west, south, east, north, cols, rows) {
  const [fromMask, toMask] = await Promise.all([
    computeGmwMaskRecent(west, south, east, north, cols, rows, 1996),
    computeGmwMaskRecent(west, south, east, north, cols, rows, 2025),
  ]);
  const change = new Array(cols * rows);
  for (let i = 0; i < change.length; i++) {
    const was = fromMask[i] > 0;
    const is = toMask[i] > 0;
    change[i] = was && !is ? -1 : !was && is ? 1 : 0;
  }
  return change;
}

// ── Perda de manguezal (diferença entre dois anos) ─────────────────────────
// Compara a máscara de dois anos pixel a pixel: era manguezal e deixou de
// ser = perda; não era e passou a ser = ganho. Uma comparação só, 1996→2025,
// os dois extremos disponíveis no v4.1.12 — ver comentário de
// GMW_FULL_HISTORY_YEARS acima pra por que não precisa mais dividir em dois
// períodos por fonte diferente.
async function computeGmwLossPeriod(municipio, fromYear, toYear) {
  const [west, south, east, north] = municipio.bbox;
  const cols = GMW_HISTORY_GRID;
  const rows = GMW_HISTORY_GRID;
  const [fromMask, toMask] = await Promise.all([
    computeGmwMaskRecent(west, south, east, north, cols, rows, fromYear),
    computeGmwMaskRecent(west, south, east, north, cols, rows, toYear),
  ]);
  const cellAreaHa = cellAreaHaFor(west, south, east, north, cols, rows);

  let lossCells = 0;
  let gainCells = 0;
  let stableCells = 0;
  for (let row = 0; row < rows; row++) {
    const lat = north - (row / (rows - 1)) * (north - south);
    for (let col = 0; col < cols; col++) {
      const lon = west + (col / (cols - 1)) * (east - west);
      if (!pointInPolygons(lon, lat, municipio.polygons)) continue;
      const i = row * cols + col;
      const was = fromMask[i] > 0;
      const is = toMask[i] > 0;
      if (was && !is) lossCells++;
      else if (!was && is) gainCells++;
      else if (was && is) stableCells++;
    }
  }
  return {
    fromYear,
    toYear,
    lossHa: Math.round(lossCells * cellAreaHa),
    gainHa: Math.round(gainCells * cellAreaHa),
    stableHa: Math.round(stableCells * cellAreaHa),
    source: "Global Mangrove Watch v4.1 Timeseries · Sentinel-2/Landsat, 10m",
  };
}

const GMW_LOSS_TTL_MS = 6 * 60 * 60 * 1000;
let gmwLossPromise = null;
let gmwLossAt = 0;

// Sem parâmetros de bbox, igual ao /mangrove-extent-history: sempre o
// município inteiro (limite oficial do IBGE), nunca a área visível do mapa.
app.get("/mangrove-loss", async (_req, res) => {
  if (gmwLossPromise && Date.now() - gmwLossAt < GMW_LOSS_TTL_MS) {
    try {
      return res.set("Cache-Control", "public, max-age=3600").json({ data: await gmwLossPromise });
    } catch {
      // cache inválido (a promise rejeitou) — recalcula abaixo
    }
  }

  gmwLossAt = Date.now();
  gmwLossPromise = (async () => {
    const municipio = await getMunicipioPolygon();
    const period = await computeGmwLossPeriod(municipio, 1996, 2025);
    return { municipio: "Balneário Barra do Sul", ...period };
  })();
  gmwLossPromise.catch(() => {
    gmwLossPromise = null;
  });

  try {
    const data = await gmwLossPromise;
    res.set("Cache-Control", "public, max-age=3600").json({ data });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

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
  const requestedYear = Number(req.query.year);
  const year = GMW_FULL_HISTORY_YEARS.includes(requestedYear) ? requestedYear : 2025;

  try {
    const { mangrove, areaHa } = await computeGmwExtentViewport(
      west,
      south,
      east,
      north,
      cols,
      rows,
      year,
    );
    const data = { bbox: [west, south, east, north], cols, rows, mangrove, areaHa, year };
    res.set("Cache-Control", "public, max-age=3600").json({ data });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// Camada visual de perda/ganho (1996→2025) na área VISÍVEL — mesmo padrão
// de /mangrove-extent-gmw, mas devolvendo o diff célula a célula em vez de
// uma máscara de 1 ano só. `change[i]`: -1 perda, 1 ganho, 0 sem mudança.
app.get("/mangrove-loss-map", async (req, res) => {
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
    const change = await computeGmwLossMask(west, south, east, north, cols, rows);
    const data = { bbox: [west, south, east, north], cols, rows, change };
    res.set("Cache-Control", "public, max-age=3600").json({ data });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// Grade fixa (não depende mais de viewport, então não precisa escalar com
// tamanho de tela) — 200 células já passa da resolução real do dado mais
// grosso (v3, 25m) pro tamanho do município inteiro, sem gastar tempo à toa.
const GMW_HISTORY_GRID = 200;
let gmwHistoryPromise = null;
const GMW_HISTORY_TTL_MS = 6 * 60 * 60 * 1000;
let gmwHistoryAt = 0;

// Sem parâmetros de bbox: o histórico é sempre do MUNICÍPIO inteiro (limite
// oficial do IBGE), nunca da área visível do mapa — ver comentário de
// getMunicipioPolygon acima pra entender por quê (viewport pega município
// vizinho sempre que o usuário dá zoom out ou arrasta o mapa).
app.get("/mangrove-extent-history", async (_req, res) => {
  if (gmwHistoryPromise && Date.now() - gmwHistoryAt < GMW_HISTORY_TTL_MS) {
    try {
      return res
        .set("Cache-Control", "public, max-age=3600")
        .json({ data: await gmwHistoryPromise });
    } catch {
      // cache inválido (a promise rejeitou) — recalcula abaixo
    }
  }

  gmwHistoryAt = Date.now();
  gmwHistoryPromise = (async () => {
    const municipio = await getMunicipioPolygon();
    const [west, south, east, north] = municipio.bbox;
    const years = await Promise.all(
      GMW_FULL_HISTORY_YEARS.map(async (year) => {
        const { areaHa } = await computeGmwExtentRecent(
          west,
          south,
          east,
          north,
          GMW_HISTORY_GRID,
          GMW_HISTORY_GRID,
          year,
          municipio.polygons,
        );
        return { year, areaHa };
      }),
    );
    return { bbox: municipio.bbox, municipio: "Balneário Barra do Sul", years };
  })();
  gmwHistoryPromise.catch(() => {
    gmwHistoryPromise = null;
  });

  try {
    const data = await gmwHistoryPromise;
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
