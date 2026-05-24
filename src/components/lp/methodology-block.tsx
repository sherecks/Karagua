import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import { useRef } from "react";
import { Section, SectionHeader } from "@/components/lp/section";

/**
 * Methodology Block. Pinned, sticky-scrub: data points assemble linearly by
 * scroll position (useTransform, no spring — DS bans spring physics). Reduced
 * motion renders the final state flat. Cobertura e Permanência permanecem
 * fora até existir dado de campo verificado: o bloco mostra só o que já tem
 * lastro, em obediência ao princípio "cada número tem uma fonte".
 */
const dataPoints = [
  { label: "Método", value: "MRV-Manguezal" },
  { label: "Amostra", value: "obs. quinzenais" },
];

function DataCell({
  progress,
  index,
  label,
  value,
}: {
  progress: MotionValue<number>;
  index: number;
  label: string;
  value: string;
}) {
  // Each cell crossfades across a 30% window of the pinned scroll, in order.
  const start = 0.15 + index * 0.3;
  const opacity = useTransform(progress, [start, start + 0.25], [0, 1]);
  const y = useTransform(progress, [start, start + 0.25], [24, 0]);
  return (
    <motion.div style={{ opacity, y }} className="bg-k-elevated p-6">
      <dt className="text-label font-semibold tracking-[0.12em] text-k-ink-soft uppercase">
        {label}
      </dt>
      <dd className="mt-3 font-mono text-data text-k-deep">{value}</dd>
    </motion.div>
  );
}

export function MethodologyBlock() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const header = (
    <SectionHeader
      eyebrow="Metodologia"
      title={
        <>
          Cada número aqui carrega <span className="font-thin">sua origem.</span>
        </>
      }
    >
      O lastro de carbono azul é calculado por parcela amostral, com cobertura verificada em campo
      pelos Guardiões do Mangue e desconto de permanência aplicado antes da emissão. Registro pelo
      RCGI-USP Carbon Registry.
    </SectionHeader>
  );

  if (reduce) {
    return (
      <Section id="metodologia" surface="shell" fullHeight={false}>
        {header}
        <dl className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
          {dataPoints.map((d) => (
            <div key={d.label} className="bg-k-elevated p-6">
              <dt className="text-label font-semibold tracking-[0.12em] text-k-ink-soft uppercase">
                {d.label}
              </dt>
              <dd className="mt-3 font-mono text-data text-k-deep">{d.value}</dd>
            </div>
          ))}
        </dl>
      </Section>
    );
  }

  return (
    <Section id="metodologia" surface="shell" fullHeight={false}>
      <div ref={ref} className="relative min-h-[140vh]">
        <div className="sticky top-0 flex min-h-screen flex-col justify-center py-20">
          {header}
          <dl className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
            {dataPoints.map((d, i) => (
              <DataCell
                key={d.label}
                progress={scrollYProgress}
                index={i}
                label={d.label}
                value={d.value}
              />
            ))}
          </dl>
        </div>
      </div>
    </Section>
  );
}
