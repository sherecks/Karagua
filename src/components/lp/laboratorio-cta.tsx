import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Section } from "@/components/lp/section";
import { clipWipe, fadeUp, reveal, stagger, underlineDraw } from "@/lib/motion";

const LAB_ROUTE = "/laboratorio-karagua-vivo";

// Fatos-âncora do laboratório (Lei Rouanet): formação gratuita + bolsas +
// registro cultural. Linha curta, sem prometer além do PRD.
const facts = [
  { n: "12", label: "oficinas gratuitas e abertas" },
  { n: "6", label: "bolsas de pesquisa no território" },
  { n: "24", label: "meses de registro em documentário" },
];

/**
 * Convite ao Laboratório Karaguá Vivo — surface fog (clara), distinta da seção
 * escura anterior (Pioneirismo). Acentos em k-deep (regra do DS: o lima k-bright
 * só lê em fundo escuro). Headline em clipWipe com sublinhado que se desenha,
 * fatos em mono e um Link-linha com ArrowUpRight. Navegação SPA via <Link>.
 */
export function LaboratorioCta() {
  return (
    <Section id="laboratorio" surface="fog" theme="light">
      <motion.div {...reveal} variants={stagger} className="flex flex-col">
        <motion.p
          variants={fadeUp}
          className="text-label font-semibold tracking-[0.12em] text-k-deep uppercase"
        >
          Laboratório Karaguá Vivo
        </motion.p>

        <h2 className="mt-6 max-w-[20ch] text-[clamp(2.25rem,5.5vw,5.25rem)] leading-[0.98] font-thin text-k-ink md:mt-10">
          <motion.span variants={clipWipe} className="block">
            A comunidade do manguezal{" "}
            <span className="relative inline-block font-bold text-k-deep">
              projeta o próprio futuro.
              <motion.span
                aria-hidden="true"
                variants={underlineDraw}
                className="absolute -bottom-1 left-0 h-[3px] w-full origin-left bg-k-deep/50"
              />
            </span>
          </motion.span>
        </h2>

        <motion.p variants={fadeUp} className="measure mt-8 text-body text-k-ink-soft">
          Um laboratório de impressão 3D em Balneário Barra do Sul, aberto e gratuito, onde moradores
          projetam, imprimem e validam protótipos de ecobarreira para o território onde vivem.
        </motion.p>

        {/* Fatos-âncora */}
        <div className="mt-12 grid gap-8 sm:grid-cols-3 md:mt-16">
          {facts.map((f) => (
            <motion.div
              key={f.label}
              variants={fadeUp}
              className="flex flex-col gap-2 pt-5"
            >
              <span className="font-mono text-[clamp(1.75rem,3.5vw,2.75rem)] leading-none font-semibold text-k-deep tabular-nums">
                {f.n}
              </span>
              <span className="text-body text-k-ink-soft">{f.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Chamada para a página do laboratório */}
        <motion.div variants={fadeUp} className="mt-14 md:mt-20">
          <Link
            to={LAB_ROUTE}
            data-cursor-label="conhecer"
            className="group inline-flex items-center gap-4 py-6 transition-colors duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:bg-k-fog"
          >
            <span className="text-title font-semibold text-k-ink md:text-[1.75rem]">
              Conhecer o laboratório
            </span>
            <ArrowUpRight className="size-7 shrink-0 text-k-deep transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </motion.div>
    </Section>
  );
}
