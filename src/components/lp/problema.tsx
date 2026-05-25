import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

const cards = [
  {
    title: "Sem mecanismo de retorno",
    body: "A conservação do manguezal nunca foi convertida em renda para os territórios onde eles existem. Não há incentivo econômico para manter essas áreas intactas.",
  },
  {
    title: "Comunidades sem remuneração",
    body: "Pescadores e moradores que monitoram informalmente o manguezal não são reconhecidos nem remunerados por esse papel. Seu saber territorial fica de fora da cadeia produtiva.",
  },
  {
    title: "Municípios sem instrumentos",
    body: "Prefeituras litorâneas não dispõem de ferramentas financeiras para manter a conservação quando há pressão por uso do solo, urbanização ou descarte irregular.",
  },
  {
    title: "Mercado com demanda crescente",
    body: "Créditos de alta qualidade subiram de US$14 para US$26/tCO₂e em 2025 (Sylvera). A oferta de carbono azul certificado ainda é limitada. A janela é agora.",
  },
];

export function Problema() {
  return (
    <Section id="problema" surface="shell">
      <SectionHeader eyebrow="O problema" title="Um ativo climático que se degrada sem retorno.">
        O Brasil concentra 7,4% dos manguezais do planeta, são 1,4 milhão de hectares com capacidade
        de sequestro de carbono superior, por hectare, à de muitas florestas tropicais em terra
        firme.
      </SectionHeader>

      <motion.div {...reveal} variants={stagger} className="mt-14 grid gap-6 sm:grid-cols-2">
        {cards.map((c) => (
          <motion.div
            key={c.title}
            variants={fadeUp}
            className="rounded-md border border-border bg-k-elevated p-6"
          >
            <h3 className="text-title font-semibold text-k-ink">{c.title}</h3>
            <p className="mt-3 text-body text-k-ink-soft">{c.body}</p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
