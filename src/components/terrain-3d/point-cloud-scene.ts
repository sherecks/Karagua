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
import { heightColor } from "./height-color-ramp";

export type MangroveHeightmap = {
  bbox: [west: number, south: number, east: number, north: number];
  cols: number;
  rows: number;
  heightCm: number[];
  minCm: number;
  maxCm: number;
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

export type PointCloudSceneHandle = {
  resize(): void;
  dispose(): void;
};

export function createPointCloudScene(
  container: HTMLElement,
  data: MangroveHeightmap,
  options: { reduceMotion: boolean },
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

  // ── Geometria: uma coluna de pontos empilhados por célula da grade ────────
  const positions: number[] = [];
  const colors: number[] = [];
  for (let row = 0; row < rows; row++) {
    // Linha 0 do PNG é o topo (norte); Z negativo = norte, então inverte aqui.
    const lat = north - (row / (rows - 1)) * (north - south);
    const z = -(lat - centerLat) * METERS_PER_DEGREE_LAT;
    for (let col = 0; col < cols; col++) {
      const lng = west + (col / (cols - 1)) * (east - west);
      const x = (lng - (west + east) / 2) * metersPerDegreeLng;

      const cm = heightCm[row * cols + col];
      const heightSceneM = (cm / 100) * verticalScale;
      const pointCount =
        cm > 0
          ? Math.min(
              MAX_POINTS_PER_COLUMN,
              Math.max(MIN_POINTS_PER_COLUMN, Math.round(4 + (cm / Math.max(maxCm, 1)) * 16)),
            )
          : 1;

      for (let p = 0; p < pointCount; p++) {
        const y = pointCount > 1 ? (p / (pointCount - 1)) * heightSceneM : 0;
        positions.push(x, y, z);
        const color = heightColor(maxHeightM > 0 ? y / (maxHeightM * verticalScale) : 0);
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
