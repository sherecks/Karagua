import { useEffect, useRef, useState } from "react";

// Cursor único, branco + mix-blend-difference (efeito negativo real: escuro
// sobre superfície clara, claro sobre carbon). Sobre elemento clicável ele
// encolhe e ganha blur interno. Sem onda/rastro.
//
// O negativo só funciona fora de um stacking context isolado: por isso o
// nó é `position: fixed` direto sob um <div> simples (sem position/z-index/
// opacity/transform), mesclando com o backdrop do contexto raiz = a página.

const INTERACTIVE =
  'a[href], button:not([disabled]), [role="button"]:not([aria-disabled="true"]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), label[for], [data-cursor-pointer]';

const SIZE = 64;
const HOVER_SCALE = 0.7; // encolhe sobre clicável
const HOVER_BLUR = 4; // blur interno sobre clicável (px)
const FOLLOW = 0.22; // suavização linear de posição (sem mola)
const SCALE_FOLLOW = 0.2; // suavização linear da escala

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function Cursor() {
  const [active, setActive] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mqFine = window.matchMedia("(pointer: fine)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setActive(mqFine.matches && !mqReduce.matches);
    sync();
    mqFine.addEventListener("change", sync);
    mqReduce.addEventListener("change", sync);
    return () => {
      mqFine.removeEventListener("change", sync);
      mqReduce.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!active) return;

    const html = document.documentElement;
    const prevCursor = html.style.cursor;
    html.style.cursor = "none";

    const mouse = { x: -9999, y: -9999 };
    const pos = { x: -9999, y: -9999 };
    let scale = 1;
    let hovering = false;
    let started = false;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!started) {
        started = true;
        pos.x = mouse.x;
        pos.y = mouse.y;
      }
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const next = !!(hit instanceof Element && hit.closest(INTERACTIVE));
      if (next !== hovering) {
        hovering = next;
        const el = dotRef.current;
        if (el) el.style.filter = hovering ? `blur(${HOVER_BLUR}px)` : "blur(0px)";
      }
    };

    const tick = () => {
      pos.x = lerp(pos.x, mouse.x, FOLLOW);
      pos.y = lerp(pos.y, mouse.y, FOLLOW);
      scale = lerp(scale, hovering ? HOVER_SCALE : 1, SCALE_FOLLOW);
      const el = dotRef.current;
      if (el) {
        const half = SIZE / 2;
        el.style.transform = `translate3d(${pos.x - half}px, ${pos.y - half}px, 0) scale(${scale})`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      html.style.cursor = prevCursor;
    };
  }, [active]);

  if (!active) return null;

  return (
    <div aria-hidden>
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: SIZE,
          height: SIZE,
          borderRadius: "9999px",
          background: "#fff",
          mixBlendMode: "difference",
          transform: "translate3d(-9999px, -9999px, 0)",
          transformOrigin: "center",
          filter: "blur(0px)",
          transition: "filter 0.18s cubic-bezier(0.25, 1, 0.5, 1)",
          zIndex: 9998,
          pointerEvents: "none",
          willChange: "transform",
        }}
      />
    </div>
  );
}
