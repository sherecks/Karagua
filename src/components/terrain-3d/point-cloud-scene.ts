import {
  BufferAttribute,
  BufferGeometry,
  Color,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { heatColor } from "./height-color-ramp";

export type MangroveHeightmap = {
  bbox: [west: number, south: number, east: number, north: number];
  cols: number;
  rows: number;
  heightCm: number[];
  minCm: number;
  maxCm: number;
};

export type MangroveBiomass = {
  bbox: [west: number, south: number, east: number, north: number];
  cols: number;
  rows: number;
  agbMgHa: number[];
  minMgHa: number;
  maxMgHa: number;
};

const METERS_PER_DEGREE_LAT = 111_320;
const MIN_POINTS_PER_COLUMN = 4;
const MAX_POINTS_PER_COLUMN = 20;
// Altura real (poucos metros) é minúscula perto da extensão horizontal (dezenas
// a milhares de metros); sem exagero vertical o relevo não apareceria. Mesma
// convenção de qualquer mapa de relevo — a fração-alvo abaixo é calibrada pra
// parecer "um relevo", não um exagero cartunesco nem uma superfície lisa.
const TARGET_HEIGHT_FRACTION_OF_EXTENT = 0.16;

/** Cor de fundo escura da marca (k-color-surface-carbon), não preto puro. */
const BACKGROUND_COLOR = 0x1a2332;

// Amostra a altura numa posição FRACIONÁRIA da grade (não só nos índices
// inteiros de célula) por interpolação bilinear dos 4 vizinhos mais
// próximos. É o que resolve o efeito de "platô quadrado": sem isso, todo
// ponto de uma célula usava a MESMA altura (a da célula inteira), então
// células vizinhas com alturas parecidas formavam degraus retos entre si —
// com a amostragem contínua, a altura muda suavemente conforme a posição
// real do ponto (mesmo dentro da "mesma" célula), como um relevo de verdade.
function bilinearHeightCm(
  heightCm: number[],
  cols: number,
  rows: number,
  colF: number,
  rowF: number,
) {
  const c0 = Math.min(cols - 1, Math.max(0, Math.floor(colF)));
  const c1 = Math.min(cols - 1, c0 + 1);
  const r0 = Math.min(rows - 1, Math.max(0, Math.floor(rowF)));
  const r1 = Math.min(rows - 1, r0 + 1);
  const tc = Math.min(1, Math.max(0, colF - c0));
  const tr = Math.min(1, Math.max(0, rowF - r0));
  const h00 = heightCm[r0 * cols + c0];
  const h10 = heightCm[r0 * cols + c1];
  const h01 = heightCm[r1 * cols + c0];
  const h11 = heightCm[r1 * cols + c1];
  const top = h00 + (h10 - h00) * tc;
  const bottom = h01 + (h11 - h01) * tc;
  return top + (bottom - top) * tr;
}

export type PointCloudSceneHandle = {
  resize(): void;
  dispose(): void;
};

export function createPointCloudScene(
  container: HTMLElement,
  data: MangroveHeightmap,
  options: { reduceMotion: boolean; biomass?: MangroveBiomass | null },
): PointCloudSceneHandle {
  const { cols, rows, heightCm, bbox, maxCm } = data;
  const [west, south, east, north] = bbox;
  // Biomassa (ESA CCI) só colore por célula se vier na MESMA grade da altura
  // (mesmo bbox, mesmo cols/rows pedidos ao back-end) — sem isso não dá pra
  // combinar os dois datasets ponto a ponto.
  const biomass = options.biomass;
  const biomassAligned =
    !!biomass && biomass.cols === cols && biomass.rows === rows ? biomass : null;
  const centerLat = (south + north) / 2;
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos((centerLat * Math.PI) / 180);

  const widthM = (east - west) * metersPerDegreeLng;
  const depthM = (north - south) * METERS_PER_DEGREE_LAT;
  const horizontalExtentM = Math.max(widthM, depthM, 1);
  const maxHeightM = Math.max(maxCm / 100, 0.01);
  const verticalScale = (horizontalExtentM * TARGET_HEIGHT_FRACTION_OF_EXTENT) / maxHeightM;

  // Tamanho de célula em metros — usado só pro espalhamento horizontal
  // orgânico dos pontos (ver abaixo), não muda a projeção lat/lng → metros.
  const cellWidthM = widthM / Math.max(cols - 1, 1);
  const cellDepthM = depthM / Math.max(rows - 1, 1);

  // ── Geometria: uma coluna de pontos empilhados por célula da grade ────────
  // Célula sem canopy real (cm<=0) não gera ponto nenhum — um ponto raso ali
  // só formava uma grade de fundo sem informação (é sempre 0), poluindo a
  // cena; a orientação (onde essa área fica) já é resolvida pelo mini mapa
  // no HUD (point-cloud-scene-view.tsx), não precisa de nada no chão da cena.
  const positions: number[] = [];
  const colors: number[] = [];
  for (let row = 0; row < rows; row++) {
    // Linha 0 do PNG é o topo (norte); Z negativo = norte, então inverte aqui.
    const lat = north - (row / (rows - 1)) * (north - south);
    const z = -(lat - centerLat) * METERS_PER_DEGREE_LAT;
    for (let col = 0; col < cols; col++) {
      const lng = west + (col / (cols - 1)) * (east - west);
      const x = (lng - (west + east) / 2) * metersPerDegreeLng;

      const cellIndex = row * cols + col;
      const cm = heightCm[cellIndex];
      if (cm <= 0) continue;
      const pointCount = Math.min(
        MAX_POINTS_PER_COLUMN,
        Math.max(MIN_POINTS_PER_COLUMN, Math.round(4 + (cm / Math.max(maxCm, 1)) * 16)),
      );

      // Com biomassa alinhada: altura = posição vertical (NASA), cor =
      // concentração de carbono (ESA) — mesma cor pra coluna inteira, já que
      // biomassa é um valor por célula, não por ponto. Sem biomassa: mantém o
      // gradiente por altura de antes (fallback, um só dado disponível).
      const cellBiomassT = biomassAligned
        ? biomassAligned.agbMgHa[cellIndex] / Math.max(biomassAligned.maxMgHa, 1)
        : null;

      // Raio do espalhamento em CÍRCULO (não quadrado) e em unidade de
      // célula (não metros) — assim dá pra reamostrar a altura na posição
      // exata de cada ponto via bilinearHeightCm, deixando passar um pouco
      // pra célula vizinha de propósito: é isso que costura a transição
      // entre células (sem isso, cada célula era um "degau" reto plano).
      const jitterRadiusCells = 0.5;

      for (let p = 0; p < pointCount; p++) {
        const angle = Math.random() * Math.PI * 2;
        const radiusCells = Math.sqrt(Math.random()) * jitterRadiusCells;
        const jitterCol = Math.cos(angle) * radiusCells;
        const jitterRow = Math.sin(angle) * radiusCells;

        const sampledCm = bilinearHeightCm(heightCm, cols, rows, col + jitterCol, row + jitterRow);
        const sampledHeightSceneM = (Math.max(sampledCm, 0) / 100) * verticalScale;
        const y = (p / (pointCount - 1)) * sampledHeightSceneM;
        positions.push(x + jitterCol * cellWidthM, y, z + jitterRow * cellDepthM);

        const t = cellBiomassT ?? (maxHeightM > 0 ? y / (maxHeightM * verticalScale) : 0);
        const color = heatColor(t);
        colors.push(color.r, color.g, color.b);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));

  // Sem iluminação: nuvem de pontos real não tem sombreamento, a cor já É a
  // altura. PointsMaterial simplesmente exibe as vertexColors calculadas acima.
  const material = new PointsMaterial({
    size: Math.max(0.35, horizontalExtentM / Math.max(cols, rows) / 3),
    vertexColors: true,
    sizeAttenuation: true,
  });
  const points = new Points(geometry, material);

  const scene = new Scene();
  scene.background = new Color(BACKGROUND_COLOR);
  scene.add(points);

  const camera = new PerspectiveCamera(50, 1, 0.1, horizontalExtentM * 10);
  const cameraDistance = horizontalExtentM * 0.9;
  camera.position.set(cameraDistance * 0.6, cameraDistance * 0.5, cameraDistance * 0.6);

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, (maxHeightM * verticalScale) / 4, 0);
  controls.minDistance = horizontalExtentM * 0.1;
  controls.maxDistance = horizontalExtentM * 3;
  controls.maxPolarAngle = Math.PI * 0.49; // não deixa a câmera ir pra baixo do "chão"
  controls.enableDamping = !options.reduceMotion;
  controls.dampingFactor = 0.08;
  controls.update();

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    render();
  }

  function render() {
    renderer.render(scene, camera);
  }

  let rafId = 0;
  if (options.reduceMotion) {
    // Sem loop contínuo: só redesenha quando o usuário efetivamente arrasta.
    controls.addEventListener("change", render);
  } else {
    const loop = () => {
      controls.update();
      render();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  return {
    resize,
    dispose() {
      if (rafId) cancelAnimationFrame(rafId);
      controls.removeEventListener("change", render);
      resizeObserver.disconnect();
      controls.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
