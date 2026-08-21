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
import { soilColor } from "./soil-color-ramp";

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

export type MangroveSoc = {
  bbox: [west: number, south: number, east: number, north: number];
  cols: number;
  rows: number;
  socTha: number[];
  minTha: number;
  maxTha: number;
};

const METERS_PER_DEGREE_LAT = 111_320;
// Densidade alta o suficiente pra parecer nuvem/espuma de vegetação (como um
// viewer LiDAR real) em vez de tufos esparsos — combinada com o raio de
// espalhamento (jitterRadiusCells, abaixo) que já dissolve o alinhamento em
// grade.
const MIN_POINTS_PER_COLUMN = 10;
const MAX_POINTS_PER_COLUMN = 45;
// Altura real (poucos metros) é minúscula perto da extensão horizontal (dezenas
// a milhares de metros); sem exagero vertical o relevo não apareceria. Mesma
// convenção de qualquer mapa de relevo — a fração-alvo abaixo é calibrada pra
// parecer "um relevo", não um exagero cartunesco nem uma superfície lisa.
const TARGET_HEIGHT_FRACTION_OF_EXTENT = 0.16;

// Pool de carbono do SOLO: mesma lógica da coluna de dossel acima, só que
// pra BAIXO (y negativo) — representa o segundo "pool" de carbono do
// manguezal, geralmente MAIOR que o da vegetação (a maior parte do carbono
// de um manguezal fica no solo, não acima dele). Densidade um pouco menor
// que o dossel (o solo tende a cobrir uma área maior/mais contínua, não
// precisa de tantos pontos por coluna pra não ficar ralo).
const MIN_POINTS_PER_SOIL_COLUMN = 8;
const MAX_POINTS_PER_SOIL_COLUMN = 40;
const TARGET_SOIL_DEPTH_FRACTION_OF_EXTENT = 0.16;

/** Cor de fundo escura da marca (k-color-surface-carbon), não preto puro. */
const BACKGROUND_COLOR = 0x1a2332;

// Amostra uma grade (altura OU carbono do solo — qualquer array cols×rows)
// numa posição FRACIONÁRIA (não só nos índices inteiros de célula) por
// interpolação bilinear dos 4 vizinhos mais próximos. É o que resolve o
// efeito de "platô quadrado": sem isso, todo ponto de uma célula usava o
// MESMO valor (o da célula inteira), então células vizinhas com valores
// parecidos formavam degraus retos entre si — com a amostragem contínua, o
// valor muda suavemente conforme a posição real do ponto (mesmo dentro da
// "mesma" célula), como um relevo de verdade.
function bilinearSample(grid: number[], cols: number, rows: number, colF: number, rowF: number) {
  const c0 = Math.min(cols - 1, Math.max(0, Math.floor(colF)));
  const c1 = Math.min(cols - 1, c0 + 1);
  const r0 = Math.min(rows - 1, Math.max(0, Math.floor(rowF)));
  const r1 = Math.min(rows - 1, r0 + 1);
  const tc = Math.min(1, Math.max(0, colF - c0));
  const tr = Math.min(1, Math.max(0, rowF - r0));
  const h00 = grid[r0 * cols + c0];
  const h10 = grid[r0 * cols + c1];
  const h01 = grid[r1 * cols + c0];
  const h11 = grid[r1 * cols + c1];
  const top = h00 + (h10 - h00) * tc;
  const bottom = h01 + (h11 - h01) * tc;
  return top + (bottom - top) * tr;
}

/**
 * Valor no percentil `p` (0-1) de uma lista já ordenada crescente. Usado pra
 * normalizar a COR pela altura sem deixar um pico isolado (árvore emergente
 * de verdade, ou ruído do próprio dado de satélite) dominar a escala inteira
 * — sem isso, um único pixel muito alto vira "o vermelho" e empurra todo o
 * resto do dossel pro azul, mesmo que a maioria seja bem mais alta que o
 * chão. É a mesma razão pela qual viewers de nuvem de pontos (CloudCompare
 * etc.) normalmente mostram uma faixa "arrumada" na legenda de Coord. Z, não
 * o mínimo/máximo bruto.
 */
function percentileSorted(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.floor(p * sortedAsc.length));
  return sortedAsc[idx];
}

export type PointCloudSceneHandle = {
  resize(): void;
  dispose(): void;
};

export function createPointCloudScene(
  container: HTMLElement,
  data: MangroveHeightmap,
  options: { reduceMotion: boolean; soc?: MangroveSoc | null },
): PointCloudSceneHandle {
  const { cols, rows, heightCm, bbox, maxCm } = data;
  const [west, south, east, north] = bbox;
  const centerLat = (south + north) / 2;
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos((centerLat * Math.PI) / 180);

  const widthM = (east - west) * metersPerDegreeLng;
  const depthM = (north - south) * METERS_PER_DEGREE_LAT;
  const horizontalExtentM = Math.max(widthM, depthM, 1);
  const maxHeightM = Math.max(maxCm / 100, 0.01);
  const verticalScale = (horizontalExtentM * TARGET_HEIGHT_FRACTION_OF_EXTENT) / maxHeightM;

  // Máximo de COR (percentil 95 das alturas reais > 0), separado do máximo de
  // ESCALA vertical acima (que continua usando o máximo bruto — a altura
  // física do pico continua correta na cena, só a cor satura em vermelho a
  // partir do p95 em vez de só no ponto mais alto de todos).
  const sortedNonZeroCm = heightCm.filter((cm) => cm > 0).sort((a, b) => a - b);
  const colorMaxCm = Math.max(percentileSorted(sortedNonZeroCm, 0.95), 1);
  const colorMaxSceneM = (colorMaxCm / 100) * verticalScale;

  // Solo (opcional): só participa se vier na MESMA grade do dossel (mesmo
  // bbox, mesmo cols/rows pedidos ao back-end) — sem isso não dá pra
  // combinar os dois pools ponto a ponto. Mesma ideia de escala/cor do
  // dossel acima, mas em toneladas de carbono por hectare (não precisa
  // converter cm→m, o dado já vem na unidade final).
  const soc = options.soc;
  const socAligned = soc && soc.cols === cols && soc.rows === rows ? soc : null;
  const maxSocTha = Math.max(socAligned?.maxTha ?? 0, 0.01);
  const soilVerticalScale = socAligned
    ? (horizontalExtentM * TARGET_SOIL_DEPTH_FRACTION_OF_EXTENT) / maxSocTha
    : 0;
  const sortedNonZeroTha = socAligned
    ? socAligned.socTha.filter((v) => v > 0).sort((a, b) => a - b)
    : [];
  const colorMaxTha = Math.max(percentileSorted(sortedNonZeroTha, 0.95), 1);

  // Tamanho de célula em metros — usado só pro espalhamento horizontal
  // orgânico dos pontos (ver abaixo), não muda a projeção lat/lng → metros.
  const cellWidthM = widthM / Math.max(cols - 1, 1);
  const cellDepthM = depthM / Math.max(rows - 1, 1);
  // Mesmo raio pro dossel e pro solo — ver comentário original mais abaixo
  // (dissolve o alinhamento em grade que fazia a nuvem parecer quadriculada).
  const jitterRadiusCells = 1.4;

  // ── Geometria: uma coluna de pontos empilhados por célula da grade ────────
  // Célula sem canopy real (cm<=0) ganha 1 ponto raso no nível do solo — é o
  // "chão" da cena, mas continua sendo nuvem de pontos (não imagem, não
  // malha): mesmo princípio de antes, só desenhado com o mesmo material dos
  // pontos de altura.
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

      if (cm <= 0) {
        // Chão (y=0) fica na cor mais baixa da rampa, igual a um viewer
        // LiDAR real onde o "nível do mar" é sempre a base da escala de cor.
        positions.push(x, 0, z);
        const color = heatColor(0);
        colors.push(color.r, color.g, color.b);
      } else {
        const pointCount = Math.min(
          MAX_POINTS_PER_COLUMN,
          Math.max(
            MIN_POINTS_PER_COLUMN,
            Math.round(
              MIN_POINTS_PER_COLUMN +
                (cm / Math.max(maxCm, 1)) * (MAX_POINTS_PER_COLUMN - MIN_POINTS_PER_COLUMN),
            ),
          ),
        );

        // Raio do espalhamento em CÍRCULO (não quadrado) e em unidade de
        // célula (não metros). Precisa passar bem além da própria célula (>1,
        // não só até a borda): com raio 0,5 o círculo de cada célula ficava
        // inscrito exatamente nela, então célula vizinha nunca se misturava —
        // o conjunto de "tufos" isolados, um por célula, alinhados na grade,
        // é o que lia como quadriculado. Com raio maior os círculos de
        // células vizinhas se sobrepõem bastante, dissolvendo o alinhamento
        // em grade numa massa contínua e irregular (bilinearSample garante
        // que o valor amostrado longe da célula original ainda faça sentido).
        for (let p = 0; p < pointCount; p++) {
          const angle = Math.random() * Math.PI * 2;
          const radiusCells = Math.sqrt(Math.random()) * jitterRadiusCells;
          const jitterCol = Math.cos(angle) * radiusCells;
          const jitterRow = Math.sin(angle) * radiusCells;

          const sampledCm = bilinearSample(heightCm, cols, rows, col + jitterCol, row + jitterRow);
          const sampledHeightSceneM = (Math.max(sampledCm, 0) / 100) * verticalScale;
          const y = (p / (pointCount - 1)) * sampledHeightSceneM;
          positions.push(x + jitterCol * cellWidthM, y, z + jitterRow * cellDepthM);

          // Cor pela altura REAL do próprio ponto (Z), igual a um viewer
          // LiDAR de verdade (legenda "Coord. Z"): gradiente azul→verde→
          // amarelo→vermelho conforme a altura sobre o solo. Normalizado
          // pelo percentil 95 (colorMaxSceneM), não pelo máximo bruto — ver
          // comentário acima.
          const t = colorMaxSceneM > 0 ? y / colorMaxSceneM : 0;
          const color = heatColor(t);
          colors.push(color.r, color.g, color.b);
        }
      }

      // Pool do solo: coluna independente pra BAIXO (y negativo) — existe
      // sempre que o dado de carbono do solo cobrir essa célula, com ou sem
      // canopy mapeado ali em cima (são dois datasets diferentes).
      if (socAligned) {
        const tha = socAligned.socTha[cellIndex];
        if (tha > 0) {
          const soilPointCount = Math.min(
            MAX_POINTS_PER_SOIL_COLUMN,
            Math.max(
              MIN_POINTS_PER_SOIL_COLUMN,
              Math.round(
                MIN_POINTS_PER_SOIL_COLUMN +
                  (tha / maxSocTha) * (MAX_POINTS_PER_SOIL_COLUMN - MIN_POINTS_PER_SOIL_COLUMN),
              ),
            ),
          );

          for (let p = 0; p < soilPointCount; p++) {
            const angle = Math.random() * Math.PI * 2;
            const radiusCells = Math.sqrt(Math.random()) * jitterRadiusCells;
            const jitterCol = Math.cos(angle) * radiusCells;
            const jitterRow = Math.sin(angle) * radiusCells;

            const sampledTha = bilinearSample(
              socAligned.socTha,
              cols,
              rows,
              col + jitterCol,
              row + jitterRow,
            );
            const sampledDepthSceneM = Math.max(sampledTha, 0) * soilVerticalScale;
            const y = -(p / (soilPointCount - 1)) * sampledDepthSceneM;
            positions.push(x + jitterCol * cellWidthM, y, z + jitterRow * cellDepthM);

            // Cor pelo carbono do próprio ponto (não pela profundidade): o
            // dado é um TOTAL 0-100cm, não um perfil por profundidade — não
            // temos como saber a distribuição real dentro da coluna, então
            // colorir por "profundidade" seria inventar um dado que não
            // existe. A cor representa quantidade de carbono, a posição
            // (extensão pra baixo) também — os dois crescem juntos.
            const soilT = colorMaxTha > 0 ? sampledTha / colorMaxTha : 0;
            const color = soilColor(soilT);
            colors.push(color.r, color.g, color.b);
          }
        }
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));

  // Sem iluminação: nuvem de pontos real não tem sombreamento, a cor já É a
  // altura. PointsMaterial simplesmente exibe as vertexColors calculadas acima.
  const material = new PointsMaterial({
    // Pontos um pouco menores que antes: com a densidade maior (acima), o
    // efeito de "espuma"/nuvem vem da quantidade de pontos sobrepostos, não
    // do tamanho individual de cada um — pontos grandes demais voltam a
    // parecer blocos.
    size: Math.max(0.3, horizontalExtentM / Math.max(cols, rows) / 2.6),
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
  // Com solo, centraliza a órbita no nível do chão (y=0) — os dois pools
  // ficam visíveis de forma equilibrada. Sem solo, mantém o comportamento
  // de antes (um pouco acima do chão, voltado pro dossel).
  controls.target.set(0, socAligned ? 0 : (maxHeightM * verticalScale) / 4, 0);
  controls.minDistance = horizontalExtentM * 0.1;
  controls.maxDistance = horizontalExtentM * 3;
  // Com solo, deixa a câmera orbitar mais perto do horizonte (mais próximo
  // de 0.5π) pra dar pra "olhar embaixo" do chão e ver o pool de carbono do
  // solo — sem solo, mantém a trava mais alta de antes (câmera sempre
  // razoavelmente acima do chão).
  controls.maxPolarAngle = socAligned ? Math.PI * 0.499 : Math.PI * 0.49;
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
