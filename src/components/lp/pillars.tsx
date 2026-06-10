import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

const solutions = [
  {
    n: "01",
    label: "Certificação",
    title: "Créditos de carbono azul de alta integridade",
    tag: "VM0033 · VM0007 · Verra",
  },
  {
    n: "02",
    label: "Comunidade",
    title: "Tornar a tecnologia acessível a todos",
    tag: "Lei 8.313/1991",
  },
  {
    n: "03",
    label: "Tecnologia",
    title: "IoTs, dados contínuos e plataforma pública",
    tag: "Monitoramento contínuo",
  },
];

const SUBHEAD = "text-[clamp(1.25rem,2.6vw,2.125rem)] font-semibold leading-tight text-k-ink";

export function Pillars() {
  return (
    <Section id="solucao" surface="shell">
      <SectionHeader
        eyebrow="A solução"
        title="Carbono Azul com dados verificáveis, comunidade remunerada e escala territorial."
      />

      <motion.div
        {...reveal}
        variants={stagger}
        className="mt-10 grid gap-y-10 sm:grid-cols-2 sm:gap-x-10 md:mt-20 md:grid-cols-3 md:gap-x-16 md:gap-y-14"
      >
        {solutions.map((s) => (
          <motion.div key={s.title} variants={fadeUp} className="flex flex-col gap-4">
            <span className="font-mono text-data text-k-deep">
              {s.n} · {s.label}
            </span>
            <h3 className={SUBHEAD}>{s.title}</h3>
            <span className="mt-auto font-mono text-data text-k-ink-soft">{s.tag}</span>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
