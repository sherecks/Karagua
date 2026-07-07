import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

/**
 * ScrollRevealText — frase que acende palavra a palavra conforme o scroll cruza
 * a seção (referência BASIC/DEPT: texto-âncora que se ilumina no scroll). Cada
 * palavra sobe de baixa para alta opacidade dentro do seu sub-trecho do
 * progresso. Sob reduced-motion exibe a frase plena, estática.
 */
function Word({
  word,
  range,
  progress,
}: {
  word: string;
  range: [number, number];
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <motion.span style={{ opacity }} className="mr-[0.28em] inline-block">
      {word}
    </motion.span>
  );
}

export function ScrollRevealText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.35"],
  });
  const words = text.split(" ");

  if (reduce) return <p className={className}>{text}</p>;

  return (
    <p ref={ref} className={`relative flex flex-wrap ${className ?? ""}`}>
      {words.map((w, i) => {
        const start = i / words.length;
        const end = (i + 1) / words.length;
        return <Word key={`${w}-${i}`} word={w} range={[start, end]} progress={scrollYProgress} />;
      })}
    </p>
  );
}
