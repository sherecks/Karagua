import { motion } from "motion/react";
import { DataPoint } from "@/components/lp/data-point";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

type Stat = {
  display: string;
  value?: number;
  label: string;
  ariaLabel: string;
  sources: { label: string; url?: string }[];
};

const stats: Stat[] = [
  {
    display: "60",
    value: 60,
    label: "Voluntários no SOS Manguezal",
    ariaLabel: "Sessenta voluntários no SOS Manguezal",
    sources: [
      {
        label:
          "Mutirão SOS Manguezal — registro operacional Karaguá, edição mais recente em Balneário Barra do Sul (SC).",
      },
    ],
  },
  {
    display: "UDESC",
    label: "Participação acadêmica",
    ariaLabel: "Participação acadêmica da UDESC",
    sources: [
      {
        label:
          "Parceria acadêmica com a Universidade do Estado de Santa Catarina (UDESC), apoio em coleta de campo e validação metodológica.",
        url: "https://www.udesc.br/",
      },
    ],
  },
  {
    display: "Mudas",
    label: "Produção para restauração",
    ariaLabel: "Produção de mudas para restauração",
    sources: [
      {
        label:
          "Viveiro comunitário Karaguá — produção de propágulos de mangue para plantio de enriquecimento nas áreas degradadas.",
      },
    ],
  },
];

export function Eventos() {
  return (
    <Section id="eventos" surface="shell">
      <SectionHeader
        eyebrow="Tração em campo"
        title="A operação já roda. A comunidade já está em campo."
      />

      <motion.div
        {...reveal}
        variants={stagger}
        className="mt-14 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3"
      >
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeUp} className="relative bg-k-elevated p-8">
            <DataPoint
              value={s.value}
              display={s.display}
              ariaLabel={s.ariaLabel}
              sources={s.sources}
              size="headline"
            />
            <p className="mt-3 text-body text-k-ink-soft">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
