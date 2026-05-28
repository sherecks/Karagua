import { motion } from "motion/react";
import { DataPoint } from "@/components/lp/data-point";
import { SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

const IMP_IMG = `${import.meta.env.BASE_URL}images/image01.png`.replace(/\/+/g, "/");

// Big number gigante e branco (override do text-k-deep do DataPoint via twMerge).
const BIG_NUMBER = "text-[clamp(2.2rem,8vw,8rem)] leading-[0.85] text-white";

const stats = [
  {
    display: "US$50B",
    label: "essa é a projeção para o mercado brasileiro de carbono até 2030.",
    ariaLabel: "50 bilhões de dólares de mercado global de carbono até 2030.",
    sources: [
      {
        label: "McKinsey & Company, A blueprint for scaling voluntary carbon markets, 2021.",
        url: "https://www.mckinsey.com/capabilities/sustainability/our-insights/a-blueprint-for-scaling-voluntary-carbon-markets-to-meet-the-climate-challenge",
      },
    ],
  },
  {
    display: "4.000ha",
    label: "é a meta de cobertura da Karaguá é 50% da Baia da Babitonga até 2036.",
    ariaLabel: "4 mil hectares de meta de cobertura e 50% da Babitonga até 2036.",
    sources: [{ label: "Karaguá Ecotech, plano estratégico de expansão territorial, 2026." }],
  },
];

// Section custom: heading em banda lima; abaixo, foto full-bleed com os dois big
// numbers em composição assimétrica (visual e artística).
export function CarbonoAzul() {
  return (
    <section id="impacto" className="flex min-h-screen flex-col bg-background">
      <div className="surface-primary">
        <div className="mx-auto w-full max-w-[120rem] px-6 py-16 md:px-10 md:py-20 lg:px-16">
          <SectionHeader eyebrow="Impacto" title="O que está em jogo." />
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-k-carbon">
        <img
          src={IMP_IMG}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover select-none"
        />
        {/* Scrim para legibilidade do branco sobre a foto. */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/30 to-black/90" />

        <motion.div
          {...reveal}
          variants={stagger}
          className="relative mx-auto flex h-full min-h-[64vh] w-full max-w-[120rem] flex-col justify-between gap-12 px-8 py-16 md:px-10 md:py-20 lg:px-16"
        >
          <motion.div variants={fadeUp} className="max-w-[42ch]">
            <DataPoint
              display={stats[0].display}
              ariaLabel={stats[0].ariaLabel}
              sources={stats[0].sources}
              numberClassName={BIG_NUMBER}
            />
            <p className="mt-4 text-body text-white">{stats[0].label}</p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="flex max-w-[42ch] flex-col items-end self-end text-right"
          >
            <DataPoint
              display={stats[1].display}
              ariaLabel={stats[1].ariaLabel}
              sources={stats[1].sources}
              numberClassName={BIG_NUMBER}
            />
            <p className="mt-4 text-body text-white">{stats[1].label}</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
