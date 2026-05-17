import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import { useRef } from "react";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

/**
 * Methodology Block — the signature component. Appears on every page with a
 * quantitative claim: the visual instance of "each number has a source".
 * Carbon surface; footer carries the 4 mandatory data points in JetBrains
 * Mono with a Green Karaguá accent (placeholders until field data lands).
 *
 * Sticky-scrub: the block pins and the four data points assemble one by one,
 * driven LINEARLY by scroll position (useTransform, never a spring — DS bans
 * spring physics). Under prefers-reduced-motion the final state renders flat.
 */
const dataPoints = [
  { label: "Método", value: "MRV-Manguezal" },
  { label: "Amostra", value: "obs. quinzenais" },
  { label: "Cobertura", value: "—" },
  { label: "Permanência buffer", value: "—" },
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
  // Each cell crossfades across an 18% window of the pinned scroll, in order.
  const start = 0.12 + index * 0.18;
  const opacity = useTransform(progress, [start, start + 0.16], [0, 1]);
  const y = useTransform(progress, [start, start + 0.16], [24, 0]);
  return (
    <motion.div style={{ opacity, y }} className="bg-background p-6">
      <dt className="text-label font-semibold tracking-[0.12em] text-foreground/60 uppercase">
        {label}
      </dt>
      <dd className="mt-3 font-mono text-data text-k-bright">{value}</dd>
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

  const note = (
    <p className="mt-6 font-mono text-data text-foreground/55">
      Valores marcados com "—" aguardam dado de campo verificado.
    </p>
  );

  if (reduce) {
    return (
      <Section id="metodologia" surface="carbon">
        {header}
        <dl className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {dataPoints.map((d) => (
            <div key={d.label} className="bg-background p-6">
              <dt className="text-label font-semibold tracking-[0.12em] text-foreground/60 uppercase">
                {d.label}
              </dt>
              <dd className="mt-3 font-mono text-data text-k-bright">{d.value}</dd>
            </div>
          ))}
        </dl>
        {note}
      </Section>
    );
  }

  return (
    <Section id="metodologia" surface="carbon">
      <div ref={ref} className="relative min-h-[180vh]">
        <div className="sticky top-0 flex min-h-screen flex-col justify-center py-20">
          {header}
          <dl className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
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
          <motion.div {...reveal} variants={stagger}>
            <motion.p variants={fadeUp} className="mt-6 font-mono text-data text-foreground/55">
              Valores marcados com "—" aguardam dado de campo verificado.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
