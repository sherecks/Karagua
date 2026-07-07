import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

// Estágio honesto (pré-operacional): caracterização → pré-PDD → piloto →
// certificação (meta). Sem prometer crédito iminente.
const phases = [
  {
    n: "01",
    phase: "Caracterização",
    status: "Em curso",
    title: "Levantamento de campo e caracterização ambiental das áreas prioritárias.",
  },
  {
    n: "02",
    phase: "Pré-PDD",
    status: "Em preparação",
    title: "Estruturação técnica e documental que antecede o registro Verra (VM0033).",
  },
  {
    n: "03",
    phase: "Piloto",
    status: "Planejado",
    title: "Implantação do monitoramento georreferenciado nos 380 ha do piloto.",
  },
  {
    n: "04",
    phase: "Certificação",
    status: "Meta",
    title: "Validação, verificação e emissão dos primeiros créditos de carbono azul.",
  },
];

const SUBHEAD = "text-[clamp(1.25rem,2.8vw,2.25rem)] font-semibold leading-tight text-k-ink";

export function KaraguaVivo() {
  return (
    <Section id="como-funciona" surface="fog" theme="light">
      <SectionHeader
        size="display"
        eyebrow="Onde estamos"
        title={
          <>
            A Karaguá <span className="font-bold">em construção</span>
          </>
        }
      />

      <div className="relative mt-10 md:mt-20">
        {/* Linha do tempo que se desenha conforme a seção entra em tela. */}
        <motion.span
          aria-hidden="true"
          className="absolute top-2 bottom-2 -left-[0.65rem] hidden w-px origin-top -translate-x-1/2 bg-k-deep/30 sm:block"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, amount: 0.2, margin: "0px 0px -15% 0px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />

        <motion.ol {...reveal} variants={stagger} className="flex flex-col gap-6 md:gap-9">
          {phases.map((p) => (
            <motion.li
              key={p.n}
              variants={fadeUp}
              className="group grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-1 sm:grid-cols-[3.5rem_11rem_11rem_1fr] sm:gap-x-8"
            >
              <span className="relative font-mono text-data text-k-deep">
                <span className="absolute top-1/2 -left-[0.65rem] hidden size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-k-deep/30 ring-4 ring-k-fog transition-colors duration-300 group-hover:bg-k-deep sm:block" />
                {p.n}
              </span>
              <span className="text-title font-semibold text-k-ink">{p.phase}</span>
              <span className="col-start-2 font-mono text-data text-k-ink-soft sm:col-start-3">
                {p.status}
              </span>
              <h3 className={`${SUBHEAD} col-span-2 sm:col-span-1 sm:col-start-4`}>{p.title}</h3>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </Section>
  );
}
