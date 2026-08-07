import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  SRGBColorSpace,
  TextureLoader,
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

// Imagem de satélite real (mesmo servidor Esri já usado no mapa 2D, CORS
// liberado — testado) como "chão" da cena: dá o contexto que a nuvem de
// pontos sozinha não tem (formato da costa, canal de maré, manguezal
// vizinho). Sem isso a área sem canopy real virava um platô escuro genérico;
// com a imagem, quem olha reconhece o recorte na hora.
const BASEMAP_MAX_SIZE = 1024;
function basemapImageUrl(
  bbox: [west: number, south: number, east: number, north: number],
  widthM: number,
  depthM: number,
): string {
  const [west, south, east, north] = bbox;
  const aspect = widthM / depthM;
  const w = aspect >= 1 ? BASEMAP_MAX_SIZE : Math.round(BASEMAP_MAX_SIZE * aspect);
  const h = aspect >= 1 ? Math.round(BASEMAP_MAX_SIZE / aspect) : BASEMAP_MAX_SIZE;
  return (
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export" +
    `?bbox=${west},${south},${east},${north}&bboxSR=4326&imageSR=4326&size=${w},${h}&format=jpg&f=image`
  );
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
  // Célula sem canopy real (cm<=0) não gera ponto nenhum — antes tinha 1
  // ponto raso formando um "chão" de referência, mas agora quem cumpre esse
  // papel é a imagem de satélite de verdade (basemapMesh, abaixo); manter os
  // pontos rasos só poluiria a imagem com uma grade de pontos por cima.
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
      const heightSceneM = (cm / 100) * verticalScale;
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

      for (let p = 0; p < pointCount; p++) {
        const y = (p / (pointCount - 1)) * heightSceneM;
        // Espalhamento horizontal leve dentro da própria célula — copa de
        // manguezal de verdade não é uma coluna perfeitamente vertical, é uma
        // nuvem de galhos/folhas; sem isso cada célula parecia um "espeto".
        const jitterX = (Math.random() - 0.5) * cellWidthM * 0.7;
        const jitterZ = (Math.random() - 0.5) * cellDepthM * 0.7;
        positions.push(x + jitterX, y, z + jitterZ);
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

  // "Chão" da cena: plano com a imagem de satélite real da própria área,
  // pra dar o contexto que a nuvem de pontos sozinha não tem (canal de maré,
  // formato da costa, manguezal vizinho fora do recorte). Cor sólida escura
  // até a imagem terminar de carregar — nunca deixa a cena com um buraco.
  const basemapGeometry = new PlaneGeometry(widthM, depthM);
  const basemapMaterial = new MeshBasicMaterial({ color: BACKGROUND_COLOR });
  const basemapMesh = new Mesh(basemapGeometry, basemapMaterial);
  basemapMesh.rotation.x = -Math.PI / 2;
  basemapMesh.position.y = -0.05; // levemente abaixo de y=0, evita z-fighting com pontos futuros no nível do chão
  scene.add(basemapMesh);

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

  // Carrega a imagem à parte (não bloqueia a nuvem de pontos, que já é o
  // dado real principal) — assim que chegar, troca a cor sólida pela textura
  // e força um redraw (importante sob reduced-motion, que só redesenha por
  // evento, nunca por loop contínuo).
  const textureLoader = new TextureLoader();
  const basemapTexture = textureLoader.load(basemapImageUrl(bbox, widthM, depthM), (texture) => {
    texture.colorSpace = SRGBColorSpace;
    basemapMaterial.map = texture;
    basemapMaterial.color.set(0xffffff);
    basemapMaterial.needsUpdate = true;
    render();
  });

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
      basemapGeometry.dispose();
      basemapMaterial.dispose();
      basemapTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
