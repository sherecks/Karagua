import { motion } from "motion/react";
import { SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

const LEGAL_IMG = `${import.meta.env.BASE_URL}images/image03.jpg`.replace(/\/+/g, "/");

const legalItems = [
  { title: "Lei Rouanet", ref: "Lei 8.313/1991" },
  { title: "Mercado regulado de carbono", ref: "Lei nº 15.042/2024" },
  { title: "Metodologias para registro do carbono", ref: "RCGI‑USP" },
  { title: "BNDES Fundo Clima", ref: "R$42,5 bi autorizados (2026)" },
  { title: "Metodologias Verra", ref: "VM0033 · VM0007" },
];

const SUBHEAD = "text-[clamp(1.5rem,2.6vw,2.125rem)] font-semibold leading-tight text-k-ink";

// Section custom (sem o primitivo Section): o padding vive só na coluna de
// texto; a imagem sangra a altura inteira da seção e encosta na borda direita.
export function MethodologyBlock() {
  return (
    <section id="legal" className="bg-k-fog">
      <div className="grid lg:grid-cols-[1fr_38%] lg:items-stretch">
        <div className="flex flex-col justify-center gap-12 px-6 py-24 md:px-10 md:py-28 lg:pl-16 lg:pr-16">
          <SectionHeader
            eyebrow="Base legal e institucional"
            title={
              <>
                Estruturado sobre marcos <span className="font-thin">sólidos.</span>
              </>
            }
          />

          <motion.ul {...reveal} variants={stagger} className="flex flex-col gap-10">
            {legalItems.map((item) => (
              <motion.li
                key={item.title}
                variants={fadeUp}
                className="grid gap-y-1 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-x-10"
              >
                <h3 className={SUBHEAD}>{item.title}</h3>
                <span className="font-mono text-data text-k-deep">{item.ref}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        <div className="relative min-h-[50vh] overflow-hidden lg:min-h-full">
          <img
            src={LEGAL_IMG}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover select-none"
          />
        </div>
      </div>
    </section>
  );
}
