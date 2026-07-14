import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, useSyncExternalStore, type ReactNode } from "react";

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * Parallax — desloca o conteúdo no eixo Y em função do scroll, mais devagar que
 * a página (profundidade sem peso, referência BASIC/DEPT). `amount` em px é o
 * deslocamento total de ponta a ponta. Só transform; honra reduced-motion.
 * `minWidth` desativa o efeito abaixo dessa largura de viewport (mobile).
 * Para imagens, escale o filho >100% (ex.: scale-110) para o movimento não
 * revelar as bordas.
 */
export function Parallax({
  children,
  amount = 80,
  minWidth = 0,
  className,
}: {
  children: ReactNode;
  amount?: number;
  minWidth?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const wideEnough = useMediaQuery(`(min-width: ${minWidth}px)`);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [amount / 2, -amount / 2]);
  const active = !reduce && wideEnough;

  return (
    <div ref={ref} className={className}>
      <motion.div
        style={active ? { y } : undefined}
        className="h-full w-full will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}
