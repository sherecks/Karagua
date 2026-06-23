import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vy: number;
  phase: number;
  size: number;
};

type PixelBeamBackgroundProps = {
  logoSrc: string;
};

const BG_COLOR = "#ebe8e2";
const DOT_COLOR = "#c7d926";

const CELL_SIZE = 6;
const MOUSE_RADIUS = 40;
const REVEAL_SPEED = 0.35;

const PARTICLE_COUNT = 40;
const RISE_SPEED_MIN = 0.35;
const RISE_SPEED_MAX = 0.85;
const ABSORB_SHRINK = 0.86;
const PARTICLE_REVEAL_SPEED = 0.05;

const MOUSE_EMIT_CHANCE = 0.6;
const MOUSE_PARTICLE_CAP = 90;

// Razão altura/largura do logo-sm (282x241).
const LOGO_ASPECT = 241 / 282;

/** Fundo decorativo: dots em grade revelam a logo ao passar o mouse, com partículas subindo e sendo absorvidas. */
export function PixelBeamBackground({ logoSrc }: PixelBeamBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas!.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let cols = 0;
    let rows = 0;
    let logoIsCell = new Uint8Array(0);
    let logoAlpha = new Float32Array(0);
    let logoRevealed = new Float32Array(0);

    const mouse = { x: -9999, y: -9999, active: false };

    const logoImg = new Image();
    let logoReady = false;

    let particles: Particle[] = [];
    let mouseParticles: Particle[] = [];

    function spawnParticle(p?: Particle): Particle {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      const target = p ?? ({} as Particle);
      target.x = Math.random() * w;
      target.y = h + Math.random() * 60;
      target.vy = -(RISE_SPEED_MIN + Math.random() * (RISE_SPEED_MAX - RISE_SPEED_MIN));
      target.phase = Math.random() * Math.PI * 2;
      target.size = 2.5 + Math.random() * 2.5;
      return target;
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(spawnParticle());
    }

    function sampleLogoMask(logoBox: { x: number; y: number; w: number; h: number }) {
      const sampleScale = 2;
      const offW = Math.round(logoBox.w * sampleScale);
      const offH = Math.round(logoBox.h * sampleScale);
      const off = document.createElement("canvas");
      off.width = offW;
      off.height = offH;
      const offCtx = off.getContext("2d");
      if (!offCtx) return null;
      offCtx.drawImage(logoImg, 0, 0, offW, offH);
      return { data: offCtx.getImageData(0, 0, offW, offH).data, w: offW, h: offH };
    }

    function buildGrid() {
      const vw = container!.clientWidth;
      const vh = container!.clientHeight;
      if (vw === 0 || vh === 0) return;
      cols = Math.ceil(vw / CELL_SIZE);
      rows = Math.ceil(vh / CELL_SIZE);
      const total = cols * rows;

      const logoW = Math.min(vw * 0.8, (vh * 0.8) / LOGO_ASPECT);
      const logoH = logoW * LOGO_ASPECT;
      const logoBox = {
        x: (vw - logoW) / 2,
        y: (vh - logoH) / 2 - vh * 0.08,
        w: logoW,
        h: logoH,
      };
      const mask = logoReady ? sampleLogoMask(logoBox) : null;

      logoIsCell = new Uint8Array(total);
      logoAlpha = new Float32Array(total);
      logoRevealed = new Float32Array(total);

      for (let yi = 0; yi < rows; yi++) {
        for (let xi = 0; xi < cols; xi++) {
          const idx = yi * cols + xi;
          const cx = xi * CELL_SIZE + CELL_SIZE / 2;
          const cy = yi * CELL_SIZE + CELL_SIZE / 2;

          if (
            mask &&
            cx >= logoBox.x &&
            cx <= logoBox.x + logoBox.w &&
            cy >= logoBox.y &&
            cy <= logoBox.y + logoBox.h
          ) {
            const sx = Math.floor(((cx - logoBox.x) / logoBox.w) * mask.w);
            const sy = Math.floor(((cy - logoBox.y) / logoBox.h) * mask.h);
            const a = mask.data[(sy * mask.w + sx) * 4 + 3] ?? 0;
            if (a > 28) {
              logoIsCell[idx] = 1;
              logoAlpha[idx] = a / 255;
            }
          }
        }
      }
    }

    function applyMouseReveal() {
      if (!mouse.active || cols === 0) return;
      const cellRadius = Math.ceil(MOUSE_RADIUS / CELL_SIZE);
      const mx = Math.floor(mouse.x / CELL_SIZE);
      const my = Math.floor(mouse.y / CELL_SIZE);

      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
          const xi = mx + dx;
          const yi = my + dy;
          if (xi < 0 || xi >= cols || yi < 0 || yi >= rows) continue;

          const dist = Math.hypot(dx * CELL_SIZE, dy * CELL_SIZE);
          if (dist > MOUSE_RADIUS) continue;

          const idx = yi * cols + xi;
          if (!logoIsCell[idx]) continue;

          const proximity = 1 - dist / MOUSE_RADIUS;
          logoRevealed[idx] = Math.min(1, logoRevealed[idx] + proximity * REVEAL_SPEED);
        }
      }
    }

    function updateParticleList(list: Particle[], recycle: boolean) {
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.phase += 0.02;
        p.x += Math.sin(p.phase) * 0.4;
        p.y += p.vy;

        const xi = Math.floor(p.x / CELL_SIZE);
        const yi = Math.floor(p.y / CELL_SIZE);
        const idx = xi >= 0 && xi < cols && yi >= 0 && yi < rows ? yi * cols + xi : -1;
        const insideLogo = idx >= 0 && logoIsCell[idx] === 1;

        if (insideLogo) {
          logoRevealed[idx] = Math.min(1, logoRevealed[idx] + PARTICLE_REVEAL_SPEED);
          p.size *= ABSORB_SHRINK;
        }

        if (p.y < -20 || p.size < 0.5) {
          if (recycle) spawnParticle(p);
          else list.splice(i, 1);
        }
      }
    }

    function emitMouseParticles() {
      if (!mouse.active) return;
      if (mouseParticles.length >= MOUSE_PARTICLE_CAP) return;
      if (Math.random() > MOUSE_EMIT_CHANCE) return;
      mouseParticles.push({
        x: mouse.x + (Math.random() - 0.5) * 12,
        y: mouse.y + (Math.random() - 0.5) * 12,
        vy: -(RISE_SPEED_MIN + Math.random() * (RISE_SPEED_MAX - RISE_SPEED_MIN)),
        phase: Math.random() * Math.PI * 2,
        size: 2.5 + Math.random() * 2.5,
      });
    }

    function resize() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.scale(dpr, dpr);
      buildGrid();
    }

    let rafId = 0;
    function render() {
      applyMouseReveal();
      updateParticleList(particles, true);
      emitMouseParticles();
      updateParticleList(mouseParticles, false);

      const vw = container!.clientWidth;
      const vh = container!.clientHeight;
      ctx!.fillStyle = BG_COLOR;
      ctx!.fillRect(0, 0, vw, vh);
      ctx!.fillStyle = DOT_COLOR;

      for (let yi = 0; yi < rows; yi++) {
        for (let xi = 0; xi < cols; xi++) {
          const idx = yi * cols + xi;
          if (!logoIsCell[idx]) continue;

          const revealed = logoRevealed[idx];
          if (revealed <= 0.15) continue;

          const cx = xi * CELL_SIZE + CELL_SIZE / 2;
          const cy = yi * CELL_SIZE + CELL_SIZE / 2;
          const a = logoAlpha[idx];
          const size = CELL_SIZE * (0.55 + a * 0.3);
          ctx!.fillRect(cx - size / 2, cy - size / 2, size, size);
        }
      }

      for (const p of particles) ctx!.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      for (const p of mouseParticles)
        ctx!.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);

      rafId = requestAnimationFrame(render);
    }

    function handleMouseMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    }
    function handleMouseLeave() {
      mouse.active = false;
    }

    logoImg.onload = () => {
      logoReady = true;
      buildGrid();
    };
    logoImg.src = logoSrc;

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    container!.addEventListener("mousemove", handleMouseMove);
    container!.addEventListener("mouseleave", handleMouseLeave);

    resize();
    initParticles();
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      container!.removeEventListener("mousemove", handleMouseMove);
      container!.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [logoSrc]);

  return (
    <div ref={containerRef} className="absolute inset-0" aria-hidden>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
