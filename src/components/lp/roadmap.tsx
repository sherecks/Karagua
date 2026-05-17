import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

// PLACEHOLDER: fases reais do projeto a definir com a equipe Karaguá.
const phases = [
  {
    phase: "Fase 1",
    title: "Validação em campo",
    body: "Instalação das primeiras ecobarreiras e linha de base de monitoramento.",
  },
  {
    phase: "Fase 2",
    title: "Escala da fabricação",
    body: "Aumento da produção 3D a partir do PET coletado e expansão dos pontos.",
  },
  {
    phase: "Fase 3",
    title: "Lastro de carbono",
    body: "Emissão verificada de carbono azul com registro independente.",
  },
];

export function Roadmap() {
  return (
    <Section id="roadmap" surface="carbon">
      <SectionHeader eyebrow="Roadmap" title="Para onde o Karaguá vai.">
        Estrutura provisória. As fases e marcos definitivos serão preenchidos com a equipe Karaguá.
      </SectionHeader>

      <motion.ol
        {...reveal}
        variants={stagger}
        className="mt-14 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-3"
      >
        {phases.map((p) => (
          <motion.li key={p.phase} variants={fadeUp} className="bg-background p-8">
            <span className="font-mono text-data text-k-bright">{p.phase}</span>
            <h3 className="mt-4 text-title font-semibold text-foreground">{p.title}</h3>
            <p className="mt-2 text-body text-foreground/70">{p.body}</p>
          </motion.li>
        ))}
      </motion.ol>
    </Section>
  );
}
