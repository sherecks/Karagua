import { motion } from "motion/react";
import { DataPoint } from "@/components/lp/data-point";
import { SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

const PROB_IMG = `${import.meta.env.BASE_URL}images/image05.png`.replace(/\/+/g, "/");

const STAT_NUM = "text-[clamp(1.75rem,3vw,3rem)] leading-[0.95]";

// Dados que desceram do hero.
const stats = [
  {
    display: "8.000",
    label: "ha de potencial na Babitonga",
    ariaLabel: "8 mil hectares de potencial na Baía da Babitonga",
    sources: [{ label: "Karaguá Ecotech, plano de expansão territorial (estimativa interna)." }],
  },
  {
    display: "R$1,2M",
    label: "receita anual estimada em créditos",
    ariaLabel: "1,2 milhão de reais por ano de receita estimada em créditos de carbono",
    sources: [
      { label: "Karaguá Ecotech, projeção de receita do business plan (estimativa interna)." },
    ],
  },
  {
    display: "380",
    label: "ha no piloto, Balneário Barra do Sul",
    ariaLabel: "380 hectares no projeto piloto em Balneário Barra do Sul",
    sources: [{ label: "Karaguá Ecotech, plano do projeto piloto (estimativa interna)." }],
  },
  {
    display: "400+",
    label: "famílias impactadas até 2035",
    ariaLabel: "mais de 400 famílias impactadas até 2035",
    sources: [
      { label: "Karaguá Ecotech, projeção de impacto socioambiental (estimativa interna)." },
    ],
  },
];

// 01 e 02 sobre a imagem (esquerda, invert); 03 e 04 na coluna lima (direita).
const overImage = [
  { n: "01", title: "Sem mecanismo de retorno" },
  { n: "02", title: "Comunidades sem remuneração" },
];
const aside = [
  { n: "03", title: "Municípios sem instrumentos" },
  { n: "04", title: "Mercado com demanda crescente" },
];

const SUBHEAD = "text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold leading-tight";

// Split full-height: foto à esquerda (altura inteira, sem padding) + 01/02 em
// invert; coluna lima à direita com heading, 03/04 e os dados.
export function Problema() {
  return (
    <section id="problema" className="grid min-h-screen lg:grid-cols-2">
      {/* Esquerda — foto altura inteira, sem padding */}
      <div className="relative min-h-[60vh] overflow-hidden lg:min-h-screen">
        <img
          src={PROB_IMG}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover select-none"
        />
        {/* Scrim sutil na faixa do texto: estabiliza o invert sem matar a foto. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/10"
        />
        <div className="relative flex h-full flex-col justify-center gap-14 p-8 md:p-12 lg:p-16">
          {overImage.map((p) => (
            <div key={p.n} className="flex items-baseline gap-5 text-white">
              <span className="font-mono text-data">{p.n}</span>
              <h3 className={SUBHEAD}>{p.title}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Direita — fundo lima */}
      <div className="surface-primary flex flex-col justify-between gap-16 px-6 py-20 md:px-10 md:py-24 lg:px-16">
        <div>
          <SectionHeader
            eyebrow="O problema"
            title="Um ativo climático que se degrada sem retorno."
          />
          <motion.div {...reveal} variants={stagger} className="mt-12 flex flex-col gap-8">
            {aside.map((p) => (
              <motion.div key={p.n} variants={fadeUp} className="flex items-baseline gap-5">
                <span className="font-mono text-data text-k-deep">{p.n}</span>
                <h3 className={`${SUBHEAD} text-k-ink`}>{p.title}</h3>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div {...reveal} variants={stagger} className="grid grid-cols-2 gap-x-10 gap-y-8">
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
