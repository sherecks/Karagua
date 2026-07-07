import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { Section } from "@/components/lp/section";
import { clipWipe, fadeUp, reveal, stagger, underlineDraw } from "@/lib/motion";
import { SITE_EMAIL } from "@/lib/site";

// Canais segmentados por audiência (PRD: trilhas distintas investidor × poder
// público × parceiros). Cada um abre o e-mail com assunto próprio — base para
// rotear o lead por origem.
const channels = [
  { n: "01", label: "Investimento", title: "Para investidores", subject: "Investimento: Karaguá Ecotech" },
  { n: "02", label: "Poder público", title: "Para o poder público", subject: "Poder público: Karaguá Ecotech" },
  { n: "03", label: "Parcerias", title: "Para parceiros técnicos", subject: "Parceria técnica: Karaguá Ecotech" },
];

const mailto = (subject: string) =>
  `mailto:${SITE_EMAIL}?subject=${encodeURIComponent(subject)}`;

export function CtaFinal() {
  return (
    <Section id="contato" surface="shell" theme="light">
      <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-20">
        {/* Coluna-declaração */}
        <motion.div {...reveal} variants={stagger} className="flex flex-col">
          <motion.p
            variants={fadeUp}
            className="text-label font-semibold tracking-[0.12em] text-k-ink-soft uppercase"
          >
            Contato
          </motion.p>

          <h2 className="mt-6 max-w-[18ch] text-[clamp(2.25rem,5.5vw,5.25rem)] leading-[0.98] font-thin text-k-ink md:mt-10">
            <motion.span variants={clipWipe} className="block">
              Construa carbono azul{" "}
              <span className="relative inline-block font-bold text-k-bright">
                com lastro.
                <motion.span
                  aria-hidden="true"
                  variants={underlineDraw}
                  className="absolute -bottom-1 left-0 h-[3px] w-full origin-left bg-k-bright/60"
                />
              </span>
            </motion.span>
          </h2>

          <motion.p variants={fadeUp} className="measure mt-8 text-body text-k-ink-soft">
            Investidores, poder público e parceiros institucionais: vamos estruturar conservação
            verificável e remunerada.
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="mt-12 font-mono text-data text-k-ink-soft md:mt-16"
          >
            Balneário Barra do Sul · Santa Catarina · Brasil
          </motion.p>
        </motion.div>

        {/* Coluna-canais: trilhas segmentadas como linhas interativas */}
        <motion.div {...reveal} variants={stagger} className="flex flex-col">
          <motion.p
            variants={fadeUp}
            className="text-label font-semibold tracking-[0.12em] text-k-ink-soft uppercase"
          >
            Escolha por onde falar
          </motion.p>

          <div className="mt-6 flex flex-col">
            {channels.map((c) => (
              <motion.a
                key={c.n}
                variants={fadeUp}
                href={mailto(c.subject)}
                data-cursor-label="escrever"
                className="group flex items-center justify-between gap-6 py-6 transition-colors duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:bg-k-fog"
              >
                <span className="flex flex-col gap-1">
                  <span className="font-mono text-data text-k-deep">
                    {c.n} · {c.label}
                  </span>
                  <span className="text-title font-semibold text-k-ink">{c.title}</span>
                </span>
                <ArrowUpRight className="size-6 shrink-0 text-k-deep transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:translate-x-1" />
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
