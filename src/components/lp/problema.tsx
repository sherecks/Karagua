import { motion } from "motion/react";
import { DataPoint } from "@/components/lp/data-point";
import { SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

const PROB_IMG_BASE = `${import.meta.env.BASE_URL}images/img2`.replace(/\/+/g, "/");

const STAT_NUM = "text-[clamp(1.5rem,2.4vw,2.25rem)] leading-[1.05] whitespace-nowrap";

const stats = [
  {
    display: "8.000 ha",
    label: "de manguezal estimados na Baía da Babitonga",
    ariaLabel: "até 8 mil hectares de manguezal estimados na Baía da Babitonga",
    sources: [
      { label: "Grupo Pro Babitonga, dados do ecossistema da Baía da Babitonga." },
      { label: "Revista CEPSUL/ICMBio, Os manguezais e marismas da Baía Babitonga: uma síntese." },
    ],
  },
  {
    display: "380 ha",
    label: "área do piloto em Balneário Barra do Sul",
    ariaLabel: "380 hectares de área do projeto piloto em Balneário Barra do Sul",
    sources: [{ label: "Karaguá Ecotech, plano do projeto piloto." }],
  },
  {
    display: "VM0033",
    label: "metodologia Verra de referência",
    ariaLabel: "VM0033, a metodologia Verra de referência para carbono azul",
    sources: [{ label: "Verra, VM0033: Tidal Wetland and Seagrass Restoration." }],
  },
];

const items = [
  {
    n: "01",
    title: "Manguezais sequestram carbono acima das florestas, mas raramente contabilizados.",
  },
  { n: "02", title: "Sem metodologia certificada, o carbono azul não vira ativo transacionável." },
  { n: "03", title: "As comunidades que conservam o ecossistema ficam fora da cadeia do carbono." },
];

const SUBHEAD = "text-[clamp(1rem,2vw,1.625rem)] font-semibold leading-tight";

export function Problema() {
  return (
    <section id="problema" data-section-theme="light" className="grid min-h-screen lg:grid-cols-2">
      <div className="relative min-h-[45vh] overflow-hidden md:min-h-[60vh] lg:min-h-screen">
        <picture>
          <source
            type="image/webp"
            srcSet={`${PROB_IMG_BASE}-960.webp 960w, ${PROB_IMG_BASE}-1280.webp 1280w`}
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
          <img
            src={`${PROB_IMG_BASE}-fallback.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover select-none"
          />
        </picture>
        {/* Overlay escuro, igual ao scrim do vídeo do hero: mesma continuidade
            de humor entre as duas primeiras seções, sem mexer na cor da foto. */}
        <div aria-hidden="true" className="absolute inset-0 bg-black/45" />
      </div>

      <div className="surface-primary flex flex-col justify-between gap-10 px-4 py-10 md:gap-16 md:px-10 md:py-24 lg:px-16">
        <div>
          <SectionHeader
            size="display"
            eyebrow="O contexto"
            title="O manguezal estoca carbono. Falta lastro verificável."
          />
          <motion.div {...reveal} variants={stagger} className="mt-12 flex flex-col">
            {items.map((p) => (
              <motion.div
                key={p.n}
                variants={fadeUp}
                className="group flex items-baseline gap-5 border-t border-k-ink/15 py-6 transition-colors duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] last:border-b hover:bg-k-ink/5"
              >
                <span className="font-mono text-data text-k-deep transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:group-hover:translate-x-1">
                  {p.n}
                </span>
                <h3 className={`${SUBHEAD} text-k-ink`}>{p.title}</h3>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          {...reveal}
          variants={stagger}
          className="grid grid-cols-1 gap-y-8 sm:grid-cols-3 sm:gap-x-8"
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
