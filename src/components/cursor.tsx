import { useEffect, useRef, useState } from "react";

// Cursor único, branco + mix-blend-difference (efeito negativo real: escuro
// sobre superfície clara, claro sobre carbon). Sobre elemento clicável ele
// encolhe. Sem onda/rastro.
//
// O negativo só funciona fora de um stacking context isolado: por isso o
// nó é `position: fixed` direto sob um <div> simples (sem position/z-index/
// opacity/transform), mesclando com o backdrop do contexto raiz = a página.
//
// Contextual (referência BASIC/DEPT): sobre um elemento com `data-cursor-label`
// o disco cresce, troca o blend pelo verde k-deep e mostra um micro-rótulo
// sóbrio (ex.: "abrir"). Todo o estado visual é imperativo, no loop RAF, para
// não conflitar com re-render do React.

const INTERACTIVE =
  'a[href], button:not([disabled]), [role="button"]:not([aria-disabled="true"]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), label[for], [data-cursor-pointer]';

const SIZE = 64;
const HOVER_SCALE = 0.7; // encolhe sobre clicável
const LABEL_SCALE = 1.5; // cresce sobre área com rótulo
const FOLLOW = 0.22; // suavização linear de posição (sem mola)
const SCALE_FOLLOW = 0.2; // suavização linear da escala

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function Cursor() {
  const [active, setActive] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

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
    let label: string | null = null;
    let appliedLabel: string | null = null; // último rótulo refletido no DOM
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
      const el = hit instanceof Element ? hit : null;
      hovering = !!(el && el.closest(INTERACTIVE));
      const labelled = el?.closest<HTMLElement>("[data-cursor-label]");
      label = labelled?.dataset.cursorLabel ?? null;
    };

    // Troca de estado visual (blend/cor/texto) só quando o rótulo muda — fora
    // do caminho quente do RAF.
    const reflectLabel = (dot: HTMLDivElement, span: HTMLSpanElement) => {
      if (label === appliedLabel) return;
      appliedLabel = label;
      const on = label !== null;
      dot.style.mixBlendMode = on ? "normal" : "difference";
      dot.style.background = on ? "var(--k-color-green-karagua-deep)" : "#fff";
      span.textContent = label ?? "";
      span.style.opacity = on ? "1" : "0";
    };

    const tick = () => {
      pos.x = lerp(pos.x, mouse.x, FOLLOW);
      pos.y = lerp(pos.y, mouse.y, FOLLOW);
      const target = label !== null ? LABEL_SCALE : hovering ? HOVER_SCALE : 1;
      scale = lerp(scale, target, SCALE_FOLLOW);
      const el = dotRef.current;
      const span = labelRef.current;
      if (el && span) {
        reflectLabel(el, span);
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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "9999px",
          background: "#fff",
          mixBlendMode: "difference",
          transform: "translate3d(-9999px, -9999px, 0)",
          transformOrigin: "center",
          zIndex: 9998,
          pointerEvents: "none",
          willChange: "transform",
        }}
      >
        <span
          ref={labelRef}
          style={{
            color: "#fff",
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            opacity: 0,
            transition: "opacity 160ms ease",
            userSelect: "none",
          }}
        />
      </div>
    </div>
  );
}
