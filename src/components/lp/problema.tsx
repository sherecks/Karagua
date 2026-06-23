import { motion } from "motion/react";
import { DataPoint } from "@/components/lp/data-point";
import { SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

const PROB_IMG = `${import.meta.env.BASE_URL}images/img3.jpg`.replace(/\/+/g, "/");

const STAT_NUM = "text-[clamp(1.75rem,3vw,3rem)] leading-[0.95]";

// Dados que desceram do hero.
const stats = [
  {
    display: "8.000",
    label: "hectares de potencial na Baía da Babitonga",
    ariaLabel: "8 mil hectares de potencial na Baía da Babitonga",
    sources: [{ label: "Karaguá Ecotech, plano de expansão territorial (estimativa interna)." }],
  },
  {
    display: "R$1,2M",
    label: "de receita anual estimada em créditos de carbono",
    ariaLabel: "1,2 milhão de reais por ano de receita estimada em créditos de carbono",
    sources: [
      { label: "Karaguá Ecotech, projeção de receita do business plan (estimativa interna)." },
    ],
  },
  {
    display: "380",
    label: "hectares no projeto piloto em Balneário Barra do Sul",
    ariaLabel: "380 hectares no projeto piloto em Balneário Barra do Sul",
    sources: [{ label: "Karaguá Ecotech, plano do projeto piloto (estimativa interna)." }],
  },
  {
    display: "+400",
    label: "famílias impactadas pelo projeto até 2035",
    ariaLabel: "mais de 400 famílias impactadas até 2035",
    sources: [
      { label: "Karaguá Ecotech, projeção de impacto socioambiental (estimativa interna)." },
    ],
  },
];

// Todas na coluna lima (direita), em ordem.
const aside = [
  { n: "01", title: "Sem mecanismo de retorno" },
  { n: "02", title: "Comunidades sem remuneração" },
  { n: "03", title: "Municípios sem instrumentos" },
  { n: "04", title: "Mercado com demanda crescente" },
];

const SUBHEAD = "text-[clamp(1rem,2vw,1.625rem)] font-semibold leading-tight";

// Split full-height: foto à esquerda (altura inteira, sem padding); coluna
// lima à direita com heading, 01-04 e os dados.
export function Problema() {
  return (
    <section id="problema" className="grid min-h-screen lg:grid-cols-2">
      {/* Esquerda — foto altura inteira, sem padding */}
      <div className="relative min-h-[45vh] overflow-hidden md:min-h-[60vh] lg:min-h-screen">
        <img
          src={PROB_IMG}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover select-none"
        />
      </div>

      {/* Direita — fundo lima */}
      <div className="surface-primary flex flex-col justify-between gap-10 px-4 py-10 md:gap-16 md:px-10 md:py-24 lg:px-16">
        <div>
          <SectionHeader
            eyebrow="O problema"
            title="Um ativo climático que se degrada sem retorno."
          />
          <motion.div {...reveal} variants={stagger} className="mt-12 flex flex-col gap-6">
            {aside.map((p) => (
              <motion.div key={p.n} variants={fadeUp} className="flex items-baseline gap-5">
                <span className="font-mono text-data text-k-deep">{p.n}</span>
                <h3 className={`${SUBHEAD} text-k-ink`}>{p.title}</h3>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          {...reveal}
          variants={stagger}
          className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-x-10"
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp}>
              <DataPoint
                display={s.display}
                ariaLabel={s.ariaLabel}
                sources={s.sources}
                numberClassName={STAT_NUM}
              />
              <p className="mt-2 max-w-[22ch] text-sm leading-snug text-k-ink-soft">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
