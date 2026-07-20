import { ValueMapBackground } from "@/components/lp/value-map-background";
import { EASE_OUT_QUART } from "@/lib/motion";
import { motion } from "motion/react";

/**
 * Headline editorial: 4 linhas com corpos e pesos contrastantes (Thin ↔ Bold,
 * DS: duas famílias, hierarquia = peso), cada uma subindo do próprio clip com
 * um pequeno atraso incremental. Os clamps mantêm a hierarquia no mobile.
 */
const rise = {
  hidden: { y: "110%" },
  visible: (i: number) => ({
    y: "0%",
    transition: { duration: 0.65, ease: EASE_OUT_QUART, delay: 0.1 + i * 0.09 },
  }),
};

const LINES = [
  {
    text: "Transformamos o",
    className: "text-[clamp(1.375rem,2vw,2rem)] leading-[1.05] font-light text-k-ink-soft",
    wrapClassName: "",
  },
  {
    text: "manguezal",
    // pb no span interno: com leading 0.9 a caixa é menor que o glifo e o
    // overflow-hidden do wrapper decepava o descendente do "g"; o -mb do
    // wrapper devolve a altura extra ao layout (ritmo entre linhas intacto).
    className:
      "text-[clamp(4rem,7.6vw,7.5rem)] leading-[0.9] font-bold -tracking-[0.03em] pb-[0.15em]",
    // -mt compensa o ar interno da fonte acima das minúsculas (cresce com o corpo).
    // O text-[...] repete o corpo do filho para o -mb em `em` compensar o pb na
    // mesma escala (senão resolveria contra o font-size herdado de ~16px).
    // -mb devolve só parte do pb: sobra ~0.09em de respiro entre a perna do "g"
    // e a linha de baixo.
    wrapClassName: "-mt-2 -mb-[0.06em] text-[clamp(4rem,7.6vw,7.5rem)] md:-mt-3 lg:-mt-4",
  },
  {
    text: "em ativo climático",
    className: "text-[clamp(2.2rem,4.2vw,4.25rem)] leading-[1.05] font-thin -tracking-[0.02em]",
    wrapClassName: "",
  },
  {
    text: "com tecnologia e comunidade.",
    className: "text-[clamp(1.65rem,2.8vw,2.875rem)] leading-[1.1] font-bold text-k-bright",
    wrapClassName: "",
  },
];

export function HeroV3() {
  return (
    <section id="topo" className="grid w-full lg:min-h-screen lg:grid-cols-2 lg:gap-12">
      <div className="relative flex flex-col justify-center px-4 pt-20 pb-6 md:px-10 md:pt-28 md:pb-16 lg:px-16 lg:pt-0">
        <div className="mx-auto w-full max-w-[60rem] lg:mx-0">
          <h1 className="flex flex-col gap-1 md:gap-2">
            {LINES.map((l, i) => (
              <span key={l.text} className={`block overflow-hidden ${l.wrapClassName}`}>
                <motion.span
                  custom={i}
                  variants={rise}
                  initial="hidden"
                  animate="visible"
                  className={`block ${l.className}`}
                >
                  {l.text}
                </motion.span>
              </span>
            ))}
          </h1>
        </div>
      </div>

      {/* Mobile: bloco com altura própria abaixo do texto; lg+: coluna direita. */}
      <div className="relative h-[40vh] min-h-[300px] overflow-hidden lg:h-auto lg:min-h-0">
        <ValueMapBackground />
      </div>
    </section>
  );
}
