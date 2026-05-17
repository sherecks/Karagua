import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { fadeUp, maskRise, stagger } from "@/lib/motion";

/**
 * Hero — Display type (Aileron Thin), shell surface. Brand color stays
 * under 3%: a single accented word, nothing flooded.
 */
export function Hero() {
  return (
    <section id="topo" className="relative mx-auto max-w-6xl px-6 pt-24 pb-28 md:pt-32 md:pb-36">
      <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-4xl">
        <motion.p
          variants={fadeUp}
          className="text-label font-semibold tracking-[0.12em] text-k-ink-soft uppercase"
        >
          Balneário Barra do Sul, Santa Catarina
        </motion.p>

        <h1 className="mt-6 overflow-hidden text-display font-thin text-k-ink">
          <motion.span variants={maskRise} className="block">
            Preservando os <span className="font-bold text-k-deep">manguezais</span>.
          </motion.span>
        </h1>

        <motion.p variants={fadeUp} className="measure mt-8 text-body text-k-ink-soft">
          Economia circular e protagonismo comunitário para proteger, monitorar e restaurar o
          mangue. Cada ecobarreira instalada vira um número, e cada número tem uma fonte pública.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-4">
          <Button asChild size="lg">
            <a href="#investir">Investir na Karaguá</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#karagua-vivo">Conhecer o Karaguá Vivo</a>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
