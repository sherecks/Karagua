import { useEffect, useRef } from "react";

type Shape = "circle" | "diamond" | "triangle" | "ring" | null;
type EdgeKind = "spoke" | "scale";
type Edge = [string, string, EdgeKind];
type Point = { x: number; y: number };

type Pin = {
  id: string;
  gx: number;
  gy: number;
  stem: number;
  r: number;
  label: string;
  sub: string;
  shape: Shape;
  fill: string;
  mono: boolean;
};

const GREEN_BRIGHT = "#c7d926";
const SURFACE_FOG = "#ebe8e2";
const TEXT_PRIMARY = "#2c3e50";
const TEXT_SOFT = "#6b7b8d";
const BORDER = "#e2dfd6";

const FONT_SANS = "'Aileron', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace";

const ISO_COS = Math.cos(Math.PI / 6);
const ISO_SIN = Math.sin(Math.PI / 6);
const COLS = 16;
const ROWS = 11;

const PINS: Pin[] = [
  {
    id: "karagua",
    gx: 8,
    gy: 5,
    stem: 190,
    r: 15,
    label: "KARAGUÁ",
    sub: "HUB DO PROJETO",
    shape: null,
    fill: GREEN_BRIGHT,
    mono: false,
  },
  {
    id: "mercado",
    gx: 5,
    gy: 4,
    stem: 210,
    r: 16,
    label: "US$ 50B",
    sub: "MERCADO DE CARBONO · 2030",
    shape: "ring",
    fill: GREEN_BRIGHT,
    mono: true,
  },
  {
    id: "receita",
    gx: 2,
    gy: 6,
    stem: 120,
    r: 11,
    label: "R$ 1,2M/ANO",
    sub: "RECEITA ESTIMADA · PILOTO",
    shape: "ring",
    fill: GREEN_BRIGHT,
    mono: true,
  },
  {
    id: "babitonga",
    gx: 8,
    gy: 8,
    stem: 140,
    r: 13,
    label: "BABITONGA",
    sub: "",
    shape: "circle",
    fill: GREEN_BRIGHT,
    mono: false,
  },
  {
    id: "barra-sul",
    gx: 11,
    gy: 7,
    stem: 120,
    r: 9,
    label: "BARRA DO SUL",
    sub: "",
    shape: "circle",
    fill: GREEN_BRIGHT,
    mono: false,
  },
  {
    id: "potencial",
    gx: 5,
    gy: 10,
    stem: 95,
    r: 10,
    label: "8.000 HA",
    sub: "BABITONGA",
    shape: "circle",
    fill: GREEN_BRIGHT,
    mono: true,
  },
  {
    id: "familias",
    gx: 14,
    gy: 4,
    stem: 105,
    r: 8,
    label: "+400 FAM.",
    sub: "IMPACTADAS",
    shape: "circle",
    fill: GREEN_BRIGHT,
    mono: true,
  },
  {
    id: "lei",
    gx: 13,
    gy: 5,
    stem: 220,
    r: 7,
    label: "LEI 15.042/24",
    sub: "MERCADO REGULADO DE CARBONO",
    shape: "ring",
    fill: GREEN_BRIGHT,
    mono: true,
  },
  {
    id: "verra",
    gx: 14,
    gy: 9,
    stem: 60,
    r: 7,
    label: "VM0033·VM0007",
    sub: "",
    shape: "ring",
    fill: GREEN_BRIGHT,
    mono: true,
  },
];

const EDGES: Edge[] = [
  ["karagua", "mercado", "spoke"],
  ["karagua", "receita", "spoke"],
  ["karagua", "babitonga", "spoke"],
  ["karagua", "barra-sul", "spoke"],
  ["karagua", "potencial", "spoke"],
  ["karagua", "familias", "spoke"],
  ["karagua", "lei", "spoke"],
  ["karagua", "verra", "spoke"],
  ["barra-sul", "babitonga", "scale"],
];

function withAlpha(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function ValueMapBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let vw = 0;
    let vh = 0;
    let scaleF = 1;
    let cell = 0;
    let originX = 0;
    let originY = 0;
    let terrainAmp = 0;
    let barAmp = 0;

    function isoRel(gx: number, gy: number, z: number): Point {
      return {
        x: (gx - gy) * cell * ISO_COS,
        y: (gx + gy) * cell * ISO_SIN - (z || 0),
      };
    }

    function isoPt(gx: number, gy: number, z: number): Point {
      const p = isoRel(gx, gy, z);
      return { x: originX + p.x, y: originY + p.y };
    }

    function terrainHeight(gx: number, gy: number, time: number) {
      return (
        (Math.sin(gx * 0.35 + time * 0.9) * 0.5 +
          Math.cos(gy * 0.28 - time * 0.6) * 0.45 +
          Math.sin((gx + gy) * 0.15 + time * 0.4) * 0.7) *
        terrainAmp
      );
    }

    function resize() {
      vw = container!.clientWidth;
      vh = container!.clientHeight;
      if (vw === 0 || vh === 0) return;
      canvas!.width = vw * dpr;
      canvas!.height = vh * dpr;
      canvas!.style.width = `${vw}px`;
      canvas!.style.height = `${vh}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const minSide = Math.min(vw, vh);
      scaleF = Math.min(1.3, Math.max(0.45, minSide / 900));
      cell = minSide * 0.034;
      terrainAmp = 13 * scaleF;
      barAmp = 75 * scaleF;

      originX = 0;
      originY = 0;
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      const corners: Array<[number, number]> = [
        [0, 0],
        [COLS, 0],
        [0, ROWS],
        [COLS, ROWS],
      ];
      for (const [gx, gy] of corners) {
        const p = isoRel(gx, gy, terrainHeight(gx, gy, 0));
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
      for (const pin of PINS) {
        const z0 = terrainHeight(pin.gx, pin.gy, 0);
        const base = isoRel(pin.gx, pin.gy, z0);
        const top = isoRel(pin.gx, pin.gy, z0 + pin.stem * scaleF);
        const labelTop = top.y - pin.r * scaleF - 36 * scaleF;
        minX = Math.min(minX, base.x, top.x);
        maxX = Math.max(maxX, base.x, top.x);
        minY = Math.min(minY, base.y, labelTop);
        maxY = Math.max(maxY, base.y, top.y);
      }
      originX = vw / 2 - (minX + maxX) / 2;
      originY = vh / 2 - (minY + maxY) / 2;
    }

    function drawTerrain(time: number) {
      ctx!.strokeStyle = withAlpha(TEXT_PRIMARY, 0.45);
      ctx!.lineWidth = scaleF;
      for (let j = 0; j <= ROWS; j++) {
        ctx!.beginPath();
        for (let i = 0; i <= COLS; i++) {
          const pt = isoPt(i, j, terrainHeight(i, j, time));
          if (i === 0) ctx!.moveTo(pt.x, pt.y);
          else ctx!.lineTo(pt.x, pt.y);
        }
        ctx!.stroke();
      }
      for (let i = 0; i <= COLS; i++) {
        ctx!.beginPath();
        for (let j = 0; j <= ROWS; j++) {
          const pt = isoPt(i, j, terrainHeight(i, j, time));
          if (j === 0) ctx!.moveTo(pt.x, pt.y);
          else ctx!.lineTo(pt.x, pt.y);
        }
        ctx!.stroke();
      }
    }

    function drawBars(time: number) {
      const cxg = COLS * 0.55;
      const cyg = ROWS * 0.5;
      const maxD = Math.hypot(COLS, ROWS) * 0.5;

      for (let j = 0; j <= ROWS; j++) {
        for (let i = 0; i <= COLS; i++) {
          const d = Math.hypot(i - cxg, j - cyg) / maxD;
          const falloff = Math.max(0, 1 - d);
          if (falloff <= 0) continue;

          const n = 0.5 + 0.5 * Math.sin(i * 0.9 + j * 1.3 + Math.sin(i * 0.3 - j * 0.2) * 2);
          const barH = Math.pow(falloff, 1.5) * n * barAmp;
          if (barH < 4 * scaleF) continue;

          const z0 = terrainHeight(i, j, time);
          const base = isoPt(i, j, z0);
          const top = isoPt(i, j, z0 + barH);

          const flicker = Math.sin(time * 2 + i + j) * 0.04;
          ctx!.strokeStyle = GREEN_BRIGHT;
          ctx!.globalAlpha = Math.max(0.12, Math.min(0.85, 0.2 + falloff * 0.45 + flicker));
          ctx!.lineWidth = 1.4 * scaleF;
          ctx!.beginPath();
          ctx!.moveTo(base.x, base.y);
          ctx!.lineTo(top.x, top.y);
          ctx!.stroke();
        }
      }
      ctx!.globalAlpha = 1;
    }

    function drawShapeBadge(shape: Shape, x: number, y: number, size: number, color: string) {
      if (!shape) return;
      ctx!.globalAlpha = 0.55;
      ctx!.fillStyle = color;
      ctx!.strokeStyle = color;
      ctx!.lineWidth = 1.5 * scaleF;
      ctx!.beginPath();
      if (shape === "circle") {
        ctx!.arc(x, y, size, 0, Math.PI * 2);
        ctx!.fill();
      } else if (shape === "diamond") {
        ctx!.moveTo(x, y - size);
        ctx!.lineTo(x + size, y);
        ctx!.lineTo(x, y + size);
        ctx!.lineTo(x - size, y);
        ctx!.closePath();
        ctx!.fill();
      } else if (shape === "triangle") {
        ctx!.moveTo(x, y - size);
        ctx!.lineTo(x + size * 0.87, y + size * 0.5);
        ctx!.lineTo(x - size * 0.87, y + size * 0.5);
        ctx!.closePath();
        ctx!.fill();
      } else if (shape === "ring") {
        ctx!.arc(x, y, size, 0, Math.PI * 2);
        ctx!.stroke();
      }
      ctx!.globalAlpha = 1;
    }

    function drawPin(p: Pin, time: number): Point {
      const z0 = terrainHeight(p.gx, p.gy, time);
      const base = isoPt(p.gx, p.gy, z0);
      const bob = Math.sin(time * 1.3 + p.gx) * 4 * scaleF;
      const top = isoPt(p.gx, p.gy, z0 + p.stem * scaleF + bob);
      const r = p.r * scaleF;

      ctx!.strokeStyle = GREEN_BRIGHT;
      ctx!.globalAlpha = 0.85;
      ctx!.lineWidth = 1.5 * scaleF;
      ctx!.beginPath();
      ctx!.moveTo(base.x, base.y);
      ctx!.lineTo(top.x, top.y);
      ctx!.stroke();
      ctx!.globalAlpha = 1;

      ctx!.fillStyle = GREEN_BRIGHT;
      ctx!.beginPath();
      ctx!.arc(base.x, base.y, 3 * scaleF, 0, Math.PI * 2);
      ctx!.fill();

      drawShapeBadge(p.shape, top.x, top.y, r * 1.45, p.fill);

      ctx!.fillStyle = p.fill;
      ctx!.beginPath();
      ctx!.arc(top.x, top.y, r, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = withAlpha(BORDER, 0.9);
      ctx!.lineWidth = 1.5 * scaleF;
      ctx!.stroke();

      ctx!.textAlign = "center";
      ctx!.fillStyle = TEXT_PRIMARY;
      ctx!.font = `600 ${18 * scaleF}px ${p.mono ? FONT_MONO : FONT_SANS}`;
      ctx!.fillText(p.label, top.x, top.y - r - 22 * scaleF);
      ctx!.fillStyle = TEXT_SOFT;
      ctx!.font = `400 ${12 * scaleF}px ${FONT_SANS}`;
      ctx!.fillText(p.sub, top.x, top.y - r - 9 * scaleF);

      return top;
    }

    function drawEdges(pinAnchors: Record<string, Point>, t: number) {
      EDGES.forEach(([fromId, toId, kind], idx) => {
        const a = pinAnchors[fromId];
        const b = pinAnchors[toId];
        if (!a || !b) return;
        const isScale = kind === "scale";

        ctx!.strokeStyle = isScale ? withAlpha(GREEN_BRIGHT, 0.65) : withAlpha(GREEN_BRIGHT, 0.35);
        ctx!.lineWidth = (isScale ? 2 : 1) * scaleF;
        if (!isScale) ctx!.setLineDash([5 * scaleF, 5 * scaleF]);
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();
        ctx!.setLineDash([]);

        const speed = isScale ? 0.0035 : 0.0022;
        const phaseOffset = idx * 0.31;
        for (let k = 0; k < 2; k++) {
          const p = (t * speed + phaseOffset + k * 0.5) % 1;
          const px = a.x + (b.x - a.x) * p;
          const py = a.y + (b.y - a.y) * p;
          ctx!.fillStyle = GREEN_BRIGHT;
          ctx!.beginPath();
          ctx!.arc(px, py, (isScale ? 3 : 2) * scaleF, 0, Math.PI * 2);
          ctx!.fill();
        }
      });
    }

    let t = 0;
    let rafId = 0;

    function render() {
      t += 1;
      const time = t * 0.02;

      ctx!.fillStyle = SURFACE_FOG;
      ctx!.fillRect(0, 0, vw, vh);

      drawTerrain(time);
      drawBars(time);

      const pinAnchors: Record<string, Point> = {};
      for (const p of PINS) {
        pinAnchors[p.id] = drawPin(p, time);
      }

      drawEdges(pinAnchors, t);

      rafId = requestAnimationFrame(render);
    }

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    resize();
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0" aria-hidden>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
