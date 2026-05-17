import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

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

export function CarbonoAzul() {
  return (
    <Section id="carbono-azul" surface="shell">
      <SectionHeader eyebrow="Carbono azul" title="Um ativo ambiental de alta integridade.">
        O manguezal é um dos sumidouros de carbono mais densos do planeta. Karaguá transforma essa
        captura em um ativo verificável, com lastro que o investidor pode conferir, não apenas
        confiar.
      </SectionHeader>

      <motion.div {...reveal} variants={stagger} className="mt-14 grid gap-6 md:grid-cols-3">
        {traits.map((x) => (
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
