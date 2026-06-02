import { fadeUp, maskRise, stagger } from "@/lib/motion";
import { motion } from "motion/react";

/**
 * Hero — eyebrow + headline display, texto mínimo. Acento do h1 em lima.
 * Os dados (big numbers) foram para a próxima seção.
 */
export function Hero() {
  return (
    <section
      id="topo"
      className="relative flex min-h-screen w-full flex-col justify-center px-4 pt-20 pb-16 md:px-10 md:pt-28 lg:px-16 lg:pt-32"
    >
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="mx-auto w-full max-w-[120rem]"
      >
        <motion.p
          variants={fadeUp}
          className="text-label font-semibold tracking-[0.12em] text-k-ink-soft uppercase"
        >
          Carbono Azul · Santa Catarina
        </motion.p>
        <h1 className="mt-10 max-w-[20ch] overflow-hidden text-display font-thin text-k-ink">
          <motion.span variants={maskRise} className="block">
            O manguezal é um ativo climático.{" "}
            <span className="font-bold text-k-bright">Tratamos ele como tal.</span>
          </motion.span>
        </h1>
      </motion.div>
    </section>
  );
}
