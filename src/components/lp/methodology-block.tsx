import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

/**
 * Methodology Block — the signature component. Appears on every page with a
 * quantitative claim: the visual instance of "each number has a source".
 * Carbon surface; footer carries the 4 mandatory data points in JetBrains
 * Mono with a Green Karaguá accent (placeholders until field data lands).
 */
const dataPoints = [
  { label: "Método", value: "MRV-Manguezal" },
  { label: "Amostra", value: "obs. quinzenais" },
  { label: "Cobertura", value: "—" },
  { label: "Permanência buffer", value: "—" },
];

export function MethodologyBlock() {
  return (
    <Section id="metodologia" surface="carbon">
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

      <motion.dl
        {...reveal}
        variants={stagger}
        className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
      >
        {dataPoints.map((d) => (
          <motion.div key={d.label} variants={fadeUp} className="bg-background p-6">
            <dt className="text-label font-semibold tracking-[0.12em] text-foreground/60 uppercase">
              {d.label}
            </dt>
            <dd className="mt-3 font-mono text-data text-k-bright">{d.value}</dd>
          </motion.div>
        ))}
      </motion.dl>

      <motion.p
        {...reveal}
        variants={fadeUp}
        className="mt-6 font-mono text-data text-foreground/55"
      >
        Valores marcados com "—" aguardam dado de campo verificado.
      </motion.p>
    </Section>
  );
}
