import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * CountUp — conta de 0 até `value` quando entra em tela (uma vez). ease-out
 * cubic, sem mola. Sob reduced-motion mostra o valor final direto. `format`
 * controla a string final (ex.: separador pt-BR). RAF manual: zero dependência
 * de animação imperativa.
 */
export function CountUp({
  value,
  durationMs = 1100,
  format = (n) => String(Math.round(n)),
  className,
}: {
  value: number;
  durationMs?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setN(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setN(value * ease(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {format(n)}
    </span>
  );
}
