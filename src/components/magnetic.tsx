import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useRef, type ReactNode } from "react";

/**
 * Magnetic — envolve um alvo (tipicamente um Button) e o atrai de leve em
 * direção ao cursor. Tom institucional: imã curto (RADIUS px no máximo, sem
 * inércia exagerada), mola suave sem overshoot. Honra prefers-reduced-motion
 * (fica estático). Não interfere na detecção do cursor (é um wrapper inline,
 * o elemento clicável segue sendo o filho a[href]/button).
 */
const RADIUS = 6; // deslocamento máximo em px — sutil, não brincalhão
const SPRING = { stiffness: 220, damping: 22, mass: 0.4 } as const;

export function Magnetic({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, SPRING);
  const y = useSpring(my, SPRING);

  if (reduce) return <span className="inline-flex">{children}</span>;

  const onMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const relX = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const relY = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    mx.set(Math.max(-1, Math.min(1, relX)) * RADIUS);
    my.set(Math.max(-1, Math.min(1, relY)) * RADIUS);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ x, y }}
      className="inline-flex"
    >
      {children}
    </motion.span>
  );
}
