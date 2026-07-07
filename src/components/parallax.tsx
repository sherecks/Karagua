import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

/**
 * Parallax — desloca o conteúdo no eixo Y em função do scroll, mais devagar que
 * a página (profundidade sem peso, referência BASIC/DEPT). `amount` em px é o
 * deslocamento total de ponta a ponta. Só transform; honra reduced-motion.
 * Para imagens, escale o filho >100% (ex.: scale-110) para o movimento não
 * revelar as bordas.
 */
export function Parallax({
  children,
  amount = 80,
  className,
}: {
  children: ReactNode;
  amount?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [amount / 2, -amount / 2]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y }} className="h-full w-full will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}
