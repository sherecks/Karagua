import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

const phases = [
  {
    n: "01",
    phase: "Piloto",
    status: "Em andamento",
    title: "Balneário Barra do Sul, 380 hectares",
  },
  { n: "02", phase: "Manejo", status: "Sequencial", title: "Restauração ativa do manguezal" },
  { n: "03", phase: "Escala", status: "3 anos", title: "Baía da Babitonga, até 8.000 hectares" },
  { n: "04", phase: "Plataforma", status: "Futura", title: "Plataforma digital pública" },
];

const SUBHEAD = "text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold leading-tight text-k-ink";

export function KaraguaVivo() {
  return (
    <Section id="como-funciona" surface="fog">
      <SectionHeader
        eyebrow="Karaguá Vivo"
        title={
          <>
            <span className="font-thin">Quatro fases.</span> Um modelo escalável.
          </>
        }
      />

      {/* Tabela borderless: colunas fixas alinham entre as linhas. */}
      <motion.ol {...reveal} variants={stagger} className="mt-20 flex flex-col gap-9">
        {phases.map((p) => (
          <motion.li
            key={p.n}
            variants={fadeUp}
            className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-1 sm:grid-cols-[3.5rem_11rem_9rem_1fr] sm:gap-x-8"
          >
            <span className="font-mono text-data text-k-deep">{p.n}</span>
            <span className="text-title font-semibold text-k-ink">{p.phase}</span>
            <span className="col-start-2 font-mono text-data text-k-ink-soft sm:col-start-3">
              {p.status}
            </span>
            <h3 className={`${SUBHEAD} col-span-2 sm:col-span-1 sm:col-start-4`}>{p.title}</h3>
          </motion.li>
        ))}
      </motion.ol>
    </Section>
  );
}
