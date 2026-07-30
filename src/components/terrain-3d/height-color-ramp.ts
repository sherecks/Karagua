import { Color } from "three";

// Mesmos 6 pontos do LUT de calor da camada 2D (filtro SVG feComponentTransfer
// em karagua-leaflet-map.js, filtro #mangrove-heat) — aqui recalculado em JS
// pra virar vertexColors reais no Three.js, mantendo a mesma paleta azul→
// verde→amarelo→vermelho entre as duas visualizações (2D e nuvem de pontos).
const STOPS_R = [0.08, 0.08, 0.16, 0.82, 0.9, 0.78];
const STOPS_G = [0.24, 0.55, 0.71, 0.82, 0.47, 0.12];
const STOPS_B = [0.47, 0.71, 0.31, 0.16, 0.12, 0.12];

/** Interpolação linear por partes entre pontos igualmente espaçados em [0,1] — mesma semântica do SVG type="table". */
function sampleTable(stops: number[], t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  const n = stops.length - 1;
  const pos = clamped * n;
  const i0 = Math.min(n - 1, Math.floor(pos));
  const i1 = i0 + 1;
  const frac = pos - i0;
  return stops[i0] + (stops[i1] - stops[i0]) * frac;
}

/**
 * Cor por altura normalizada (0 = nível do mar/sem manguezal, 1 = altura
 * máxima real da área recortada). Retorna uma instância de Color reutilizável
 * pra evitar alocar um objeto novo por ponto em nuvens de ~250 mil pontos.
 */
const scratch = new Color();
export function heightColor(t: number): Color {
  scratch.setRGB(sampleTable(STOPS_R, t), sampleTable(STOPS_G, t), sampleTable(STOPS_B, t));
  return scratch;
}
