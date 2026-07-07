import { PixelBeamBackground } from "@/components/lp/pixel-beam-background";
import { maskRise } from "@/lib/motion";
import { motion } from "motion/react";

/**
 * Hero — claim-mestre do site: pioneirismo + diferencial tecnologia & comunidade.
 * Split com headline display à esquerda e pixel-beam à direita. Decisão DT3
 * (PRD v2 §4): só o H1; sem eyebrow, corpo, nota ou botões. A navegação é o scroll.
 */
export function HeroV3() {
  return (
    <section id="topo" className="grid min-h-screen w-full lg:grid-cols-2 lg:gap-12">
      <div className="relative flex flex-col justify-center px-4 pt-20 pb-16 md:px-10 md:pt-28 lg:px-16 lg:pt-0">
        <div className="mx-auto w-full max-w-[60rem] lg:mx-0">
          {/* Sem cor própria: o H1 herda `--ink` do wrapper e inverte junto com o tema. */}
          <h1 className="max-w-[18ch] overflow-hidden text-[clamp(2.5rem,5.2vw,5.75rem)] leading-[0.95] -tracking-[0.03em] font-thin">
            <motion.span variants={maskRise} initial="hidden" animate="visible" className="block">
              Transformamos o manguezal em ativo climático{" "}
              <span className="font-bold text-k-bright">com tecnologia e comunidade.</span>
            </motion.span>
          </h1>
        </div>
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        <PixelBeamBackground logoSrc="/logo-sm-1.svg" />
      </div>
    </section>
  );
}
