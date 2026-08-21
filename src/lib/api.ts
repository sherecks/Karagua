// Cliente da Karaguá API (Express + Postgres no Railway). Substitui o
// Supabase: mesmas operações, mesmo shape { data, error } nas respostas.
export type PontoInteresse = {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  dados: string;
  tipo: "fauna" | "flora" | "monitoramento";
  created_at: string;
};

type ApiError = { message: string };
type Result<T> = { data: T | null; error: ApiError | null };

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");

if (!API_URL) {
  throw new Error("Karaguá API requer VITE_API_URL no build");
}

const TOKEN_KEY = "karagua_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Sessão válida = token presente e não expirado (exp do payload do JWT). */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}, auth = false): Promise<Result<T>> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (auth) {
      const token = getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${API_URL}${path}`, { ...init, headers });
    const body = (await res.json().catch(() => ({}))) as { data?: T; error?: string };
    if (!res.ok) {
      return { data: null, error: { message: body.error ?? `Erro ${res.status}` } };
    }
    return { data: body.data ?? null, error: null };
  } catch {
    return { data: null, error: { message: "Não foi possível conectar à API." } };
  }
}

export async function login(email: string, password: string): Promise<Result<true>> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = (await res.json().catch(() => ({}))) as { token?: string; error?: string };
    if (!res.ok || !body.token) {
      return { data: null, error: { message: body.error ?? "Email ou senha incorretos." } };
    }
    localStorage.setItem(TOKEN_KEY, body.token);
    return { data: true, error: null };
  } catch {
    return { data: null, error: { message: "Não foi possível conectar à API." } };
  }
}

export function listPontos(order: "asc" | "desc" = "desc") {
  return request<PontoInteresse[]>("/pontos").then((r) =>
    r.data && order === "asc" ? { ...r, data: [...r.data].reverse() } : r,
  );
}

export function createPonto(ponto: Omit<PontoInteresse, "id" | "created_at">) {
  return request<PontoInteresse>("/pontos", { method: "POST", body: JSON.stringify(ponto) }, true);
}

export function updatePonto(id: string, ponto: Omit<PontoInteresse, "id" | "created_at">) {
  return request<PontoInteresse>(
    `/pontos/${id}`,
    { method: "PUT", body: JSON.stringify(ponto) },
    true,
  );
}

export function deletePonto(id: string) {
  return request<true>(`/pontos/${id}`, { method: "DELETE" }, true);
}

export type MangroveHeightmap = {
  bbox: [west: number, south: number, east: number, north: number];
  cols: number;
  rows: number;
  heightCm: number[];
  minCm: number;
  maxCm: number;
  year: number;
};

/** Grade real de altura de dossel (cm) para o terreno 3D — decodificada no
 *  servidor a partir do GeoTIFF do TanDEM-X (dataset protegido, exige token
 *  do NASA Earthdata Login). Ver api/index.js:/mangrove-heightmap. */
export function fetchMangroveHeightmap(bbox: {
  west: number;
  south: number;
  east: number;
  north: number;
  cols?: number;
  rows?: number;
}) {
  const params = new URLSearchParams({
    west: String(bbox.west),
    south: String(bbox.south),
    east: String(bbox.east),
    north: String(bbox.north),
  });
  if (bbox.cols) params.set("cols", String(bbox.cols));
  if (bbox.rows) params.set("rows", String(bbox.rows));
  return request<MangroveHeightmap>(`/mangrove-heightmap?${params.toString()}`);
}

export type MangroveBiomass = {
  bbox: [west: number, south: number, east: number, north: number];
  cols: number;
  rows: number;
  agbMgHa: number[];
  minMgHa: number;
  maxMgHa: number;
  year: number;
};

/** Grade real de biomassa acima do solo (Mg/ha) na mesma área — ESA CCI
 *  Biomass, floresta em geral (não específico de manguezal), via THREDDS/ncss
 *  da CEDA. Ver api/index.js:/mangrove-biomass. */
export function fetchMangroveBiomass(bbox: {
  west: number;
  south: number;
  east: number;
  north: number;
  cols?: number;
  rows?: number;
}) {
  const params = new URLSearchParams({
    west: String(bbox.west),
    south: String(bbox.south),
    east: String(bbox.east),
    north: String(bbox.north),
  });
  if (bbox.cols) params.set("cols", String(bbox.cols));
  if (bbox.rows) params.set("rows", String(bbox.rows));
  return request<MangroveBiomass>(`/mangrove-biomass?${params.toString()}`);
}

export type MangroveSoc = {
  bbox: [west: number, south: number, east: number, north: number];
  cols: number;
  rows: number;
  socTha: number[];
  minTha: number;
  maxTha: number;
  period: string;
};

/** Grade real de carbono orgânico do solo (t C/ha, 0-100cm) na mesma área —
 *  Sanderman et al. 2018 (atualização 2023), calibrado especificamente pra
 *  manguezal. Ver api/index.js:/mangrove-soc. */
export function fetchMangroveSoc(bbox: {
  west: number;
  south: number;
  east: number;
  north: number;
  cols?: number;
  rows?: number;
}) {
  const params = new URLSearchParams({
    west: String(bbox.west),
    south: String(bbox.south),
    east: String(bbox.east),
    north: String(bbox.north),
  });
  if (bbox.cols) params.set("cols", String(bbox.cols));
  if (bbox.rows) params.set("rows", String(bbox.rows));
  return request<MangroveSoc>(`/mangrove-soc?${params.toString()}`);
}
