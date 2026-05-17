import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

const stats = [
  { value: "60", label: "Voluntários no SOS Manguezal" },
  { value: "UDESC", label: "Participação acadêmica" },
  { value: "Mudas", label: "Produção para restauração" },
];

export function Eventos() {
  return (
    <Section id="eventos" surface="shell">
      <SectionHeader eyebrow="Em campo" title="SOS Manguezal: a comunidade já está mobilizada." />

      <motion.div
        {...reveal}
        variants={stagger}
        className="mt-14 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3"
      >
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeUp} className="bg-k-elevated p-8">
            <p className="font-mono text-headline text-k-deep">{s.value}</p>
            <p className="mt-3 text-body text-k-ink-soft">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
