import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import { useRef } from "react";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeIn, reveal, stagger } from "@/lib/motion";

const traits = [
  {
    t: "Lastro georreferenciado",
    d: "Cada ecobarreira tem coordenada, data e responsável. O ativo é rastreável até o ponto.",
  },
  {
    t: "Dados públicos",
    d: "Monitoramento aberto e acessível. Auditar um número é parte do projeto, não um favor.",
  },
  {
    t: "Registro independente",
    d: "Contabilidade de carbono azul pelo RCGI-USP Carbon Registry.",
  },
];

function TraitCard({
  progress,
  index,
  t,
  d,
}: {
  progress: MotionValue<number>;
  index: number;
  t: string;
  d: string;
}) {
  // Contained parallax: each column drifts a few px against the scroll, the
  // outer columns more than the centre. Linear map, never a spring (DS).
  const depth = (index - 1) * 18;
  const y = useTransform(progress, [0, 1], [depth, -depth]);
  return (
    <motion.div
      variants={fadeIn}
      style={{ y }}
      className="rounded-md border border-border bg-k-elevated p-6"
    >
      <h3 className="text-title font-semibold text-k-ink">{t}</h3>
      <p className="mt-3 text-body text-k-ink-soft">{d}</p>
    </motion.div>
  );
}

export function CarbonoAzul() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return (
    <Section id="carbono-azul" surface="shell">
      <SectionHeader eyebrow="Carbono azul" title="Um ativo ambiental de alta integridade.">
        O manguezal é um dos sumidouros de carbono mais densos do planeta. Karaguá transforma essa
        captura em um ativo verificável, com lastro que o investidor pode conferir, não apenas
        confiar.
      </SectionHeader>

      {reduce ? (
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {traits.map((x) => (
            <div key={x.t} className="rounded-md border border-border bg-k-elevated p-6">
              <h3 className="text-title font-semibold text-k-ink">{x.t}</h3>
              <p className="mt-3 text-body text-k-ink-soft">{x.d}</p>
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          ref={ref}
          {...reveal}
          variants={stagger}
          className="mt-14 grid gap-6 md:grid-cols-3"
        >
          {traits.map((x, i) => (
            <TraitCard key={x.t} progress={scrollYProgress} index={i} t={x.t} d={x.d} />
          ))}
        </motion.div>
      )}
    </Section>
  );
}
