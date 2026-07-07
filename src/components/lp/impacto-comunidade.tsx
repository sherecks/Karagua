import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { CountUp } from "@/components/lp/count-up";
import { Section, SectionHeader } from "@/components/lp/section";
import { EASE_OUT_QUART } from "@/lib/motion";

// Metas (não tração): rotuladas como metas no PRD. "PSA estadual" é textual.
const ptBR = (n: number) => Math.round(n).toLocaleString("pt-BR");

type Point = {
  n: string;
  label: string;
  count?: number;
  prefix?: string;
  format?: (n: number) => string;
  suffix?: string;
  text?: string;
  desc: string;
};

const points: Point[] = [
  {
    n: "01",
    label: "Famílias",
    count: 400,
    prefix: "+",
    format: (n: number) => Math.round(n).toString(),
    suffix: " famílias",
    desc: "Meta de famílias remuneradas por serviços ambientais até 2035.",
  },
  {
    n: "02",
    label: "Território",
    count: 4000,
    prefix: "~",
    format: ptBR,
    suffix: " ha",
    desc: "Meta de área de manguezal sob conservação e monitoramento.",
  },
  {
    n: "03",
    label: "Marco legal",
    text: "PSA estadual",
    desc: "Pagamento por serviços ambientais com base na Lei estadual 15.133/2010; habilitação em curso.",
  },
];

const NUM = "text-[clamp(3rem,7vw,5.5rem)] leading-[0.92] font-semibold tracking-tight text-k-ink";

/**
 * Impacto — seletor de metas. Índice clicável à esquerda com indicador que
 * desliza (layoutId) e painel de detalhe à direita que faz crossfade e reconta
 * o número (CountUp remonta via key). Mesmo idioma das outras sections
 * (numeral, hairline, tokens lima), mas com seleção persistente em vez de hover.
 * Reduced-motion é honrado globalmente via <MotionConfig reducedMotion="user">.
 */
export function ImpactoComunidade() {
  const [active, setActive] = useState(0);
  const p = points[active]!;

  return (
    <Section id="impacto" surface="primary" theme="light">
      <SectionHeader
        size="display"
        eyebrow="Impacto e comunidade"
        title="Conservação que remunera quem a sustenta."
      >
        O modelo vincula a geração de créditos à remuneração das comunidades locais e à partilha de
        receita com os municípios, sob marco legal estadual.
      </SectionHeader>

      <div className="mt-10 grid gap-x-16 gap-y-10 md:mt-20 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-center">
        {/* Índice selecionável */}
        <ul className="flex flex-col">
          {points.map((item, i) => {
            const on = i === active;
            return (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-current={on}
                  className="group relative flex w-full items-center gap-5 py-6 pl-6 text-left transition-colors duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] md:py-7"
                >
                  {on ? (
                    <motion.span
                      layoutId="impacto-active"
                      className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-k-deep"
                      transition={{ duration: 0.35, ease: EASE_OUT_QUART }}
                    />
                  ) : null}
                  <span
                    className={`font-mono text-title font-thin tabular-nums transition-colors duration-300 ${
                      on ? "text-k-deep" : "text-k-ink-soft/40"
                    }`}
                  >
                    {item.n}
                  </span>
                  <span
                    className={`text-title font-medium transition-colors duration-300 ${
                      on ? "text-k-ink" : "text-k-ink-soft/50 group-hover:text-k-ink-soft"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Painel de detalhe */}
        <div className="min-h-[13rem] md:min-h-[15rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: EASE_OUT_QUART }}
              className="flex flex-col gap-5"
            >
              <span className="font-mono text-data text-k-deep">{p.label}</span>
              <h3 className={NUM}>
                {p.count !== undefined ? (
                  <>
                    {p.prefix}
                    <CountUp key={active} value={p.count} format={p.format} />
                    <span className="text-[0.36em] font-medium text-k-ink-soft">{p.suffix}</span>
                  </>
                ) : (
                  p.text
                )}
              </h3>
              <p className="max-w-prose text-body text-k-ink-soft">{p.desc}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Section>
  );
}
