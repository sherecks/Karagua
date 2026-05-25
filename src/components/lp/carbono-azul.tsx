import { motion } from "motion/react";
import { DataPoint } from "@/components/lp/data-point";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

const stats = [
  {
    display: "1,4M ha",
    label: "de manguezais no Brasil",
    detail: "7,4% da área global de manguezais",
    ariaLabel: "1,4 milhão de hectares de manguezais no Brasil",
    sources: [
      {
        label: "MapBiomas — Relatório Anual do Desmatamento no Brasil, 2023.",
        url: "https://mapbiomas.org/",
      },
    ],
  },
  {
    display: "US$50B",
    label: "mercado global de carbono",
    detail: "projeção até 2030 (McKinsey)",
    ariaLabel: "Cinquenta bilhões de dólares de mercado global de carbono até 2030",
    sources: [
      {
        label:
          "McKinsey & Company — A blueprint for scaling voluntary carbon markets to meet the climate challenge, 2021.",
        url: "https://www.mckinsey.com/capabilities/sustainability/our-insights/a-blueprint-for-scaling-voluntary-carbon-markets-to-meet-the-climate-challenge",
      },
    ],
  },
  {
    display: "70%",
    label: "das espécies-alvo da pesca",
    detail: "se reproduzem na Baía da Babitonga",
    ariaLabel: "70% das espécies-alvo da pesca se reproduzem na Baía da Babitonga",
    sources: [
      {
        label:
          "ICMBio — Plano de Manejo da APA da Baleia Franca e estudos sobre a Baía da Babitonga.",
      },
    ],
  },
  {
    display: "4.000 ha",
    label: "meta de cobertura",
    detail: "50% da Baía da Babitonga até 2035",
    ariaLabel: "4 mil hectares de meta de cobertura até 2035",
    sources: [
      {
        label: "Karaguá Ecotech — Plano estratégico de expansão territorial, 2024.",
      },
    ],
  },
];

const dimensions = [
  {
    t: "Climático",
    d: "Créditos de carbono azul certificados pelas metodologias VM0033 e VM0007 da Verra, destinados a empresas com metas de descarbonização e estratégias ESG verificáveis.",
  },
  {
    t: "Ecológico",
    d: "Conservação de berçário marinho, barreira contra erosão costeira e proteção de espécies ameaçadas como toninha, boto-cinza, tartaruga-verde e mero na Baía da Babitonga.",
  },
  {
    t: "Social",
    d: "Mais de 400 famílias impactadas até 2035, com renda gerada diretamente pelo PSA, compartilhamento de receita com municípios e formação de estudantes via UDESC e Univille.",
  },
  {
    t: "Tecnológico",
    d: "Dados ambientais coletados por IoTs, rastreabilidade completa das ações de restauração e transparência pública via plataforma digital aberta, fortalecendo a credibilidade dos créditos no mercado.",
  },
];

export function CarbonoAzul() {
  return (
    <Section id="impacto" surface="shell" fullHeight={false}>
      <SectionHeader eyebrow="Impacto" title="Quatro dimensões de resultado.">
        Climático, ecológico, social e tecnológico. O modelo foi desenhado para que cada dimensão
        sustente as demais.
      </SectionHeader>

      <motion.div
        {...reveal}
        variants={stagger}
        className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeUp} className="relative bg-k-elevated p-6">
            <DataPoint
              display={s.display}
              ariaLabel={s.ariaLabel}
              sources={s.sources}
              size="headline"
            />
            <p className="mt-2 text-body text-k-ink">{s.label}</p>
            <p className="mt-1 text-body text-k-ink-soft">{s.detail}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div {...reveal} variants={stagger} className="mt-6 grid gap-6 sm:grid-cols-2">
        {dimensions.map((x) => (
          <motion.div
            key={x.t}
            variants={fadeUp}
            className="rounded-md border border-border bg-k-elevated p-6"
          >
            <h3 className="text-title font-semibold text-k-ink">{x.t}</h3>
            <p className="mt-3 text-body text-k-ink-soft">{x.d}</p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
