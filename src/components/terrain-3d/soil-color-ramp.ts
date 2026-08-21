import { Color } from "three";

// Paleta de terra (não o azul→vermelho da altura/dossel acima do solo) —
// distingue visualmente as duas nuvens de pontos quando mostradas juntas
// (dossel em cima, solo embaixo). A progressão clara→escura também não é
// arbitrária: solo com mais carbono orgânico é literalmente mais escuro na
// realidade (terra preta), então "mais escuro = mais carbono" já é intuitivo.
const STOPS_R = [0.86, 0.62, 0.35, 0.13];
const STOPS_G = [0.79, 0.5, 0.25, 0.08];
const STOPS_B = [0.63, 0.32, 0.15, 0.06];

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
 * Cor por intensidade normalizada de carbono orgânico do solo (0 = baixo,
 * 1 = máximo real da área recortada). Mesma convenção de instância
 * reutilizável de `heatColor` (height-color-ramp.ts) — evita alocar um
 * Color novo por ponto.
 */
const scratch = new Color();
export function soilColor(t: number): Color {
  scratch.setRGB(sampleTable(STOPS_R, t), sampleTable(STOPS_G, t), sampleTable(STOPS_B, t));
  return scratch;
}
