import { ValueMapBackground } from "@/components/lp/value-map-background";
import { fadeUp, maskRise, stagger } from "@/lib/motion";
import { motion } from "motion/react";

/**
 * Hero — eyebrow + headline display à esquerda, painel decorativo (mapa de
 * valor) à direita em telas grandes, espelhando o split das demais seções.
 */
export function Hero() {
  return (
    <section id="topo" className="grid min-h-screen w-full lg:grid-cols-2 lg:gap-12">
      <div className="relative flex flex-col justify-center px-4 pt-20 pb-16 md:px-10 md:pt-28 lg:px-16 lg:pt-0">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mx-auto w-full max-w-[60rem] lg:mx-0"
        >
          <motion.p
            variants={fadeUp}
            className="text-label font-semibold tracking-[0.12em] text-k-ink-soft uppercase"
          >
            Carbono Azul · Santa Catarina
          </motion.p>
          <h1 className="mt-10 max-w-[20ch] overflow-hidden text-[clamp(2.75rem,5.6vw,6.25rem)] leading-[0.95] -tracking-[0.03em] font-thin text-k-ink">
            <motion.span variants={maskRise} className="block">
              O manguezal é um ativo climático.{" "}
              <span className="font-bold text-k-bright">Tratamos ele como tal.</span>
            </motion.span>
          </h1>
        </motion.div>
      </div>

      <div className="relative hidden overflow-hidden rounded-xl lg:block">
        <ValueMapBackground />
      </div>
    </section>
  );
}
