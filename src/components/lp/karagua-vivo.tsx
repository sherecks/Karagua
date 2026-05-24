import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

const steps = [
  {
    n: "01",
    t: "Coleta no próprio mangue",
    d: "PET descartado é recolhido dentro dos manguezais pela comunidade.",
  },
  {
    n: "02",
    t: "Filamento para impressão 3D",
    d: "O plástico recuperado vira filamento, insumo da fabricação local.",
  },
  {
    n: "03",
    t: "Ecobarreiras impressas",
    d: "Barreiras 3D bloqueiam a entrada de resíduos pelos canais de drenagem.",
  },
];

export function KaraguaVivo() {
  return (
    <Section id="karagua-vivo" surface="fog">
      <SectionHeader
        eyebrow="O programa"
        title={
          <>
            <span className="font-thin">Karaguá</span> Vivo
          </>
        }
      >
        Programa de Pagamento por Serviços Ambientais focado em proteção, monitoramento e
        restauração de manguezais. No centro está a ecobarreira: o resíduo que ameaça o mangue vira
        a infraestrutura que o protege e o ativo que se compra.
      </SectionHeader>

      <motion.ol {...reveal} variants={stagger} className="mt-14 grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <motion.li
            key={s.n}
            variants={fadeUp}
            className="rounded-md border border-border bg-k-elevated p-6"
          >
            <span className="font-mono text-data text-k-deep">{s.n}</span>
            <h3 className="mt-4 text-title font-semibold text-k-ink">{s.t}</h3>
            <p className="mt-2 text-body text-k-ink-soft">{s.d}</p>
          </motion.li>
        ))}
      </motion.ol>
    </Section>
  );
}
