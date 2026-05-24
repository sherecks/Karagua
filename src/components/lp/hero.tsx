import { Button } from "@/components/ui/button";
import { fadeUp, stagger } from "@/lib/motion";
import { motion } from "motion/react";

const TOPO_SRC = `${import.meta.env.BASE_URL}topo.svg`.replace(/\/+/g, "/");

/**
 * Hero — Display type (Aileron Thin), shell surface. Brand color stays
 * under 3%: a single accented word, nothing flooded. A faint topo layer
 * persists from the loader as a visual continuity cue.
 */
export function Hero() {
  return (
    <section
      id="topo"
      className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pt-24 pb-28 md:pt-32 md:pb-36"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden opacity-[0.06]"
      >
        <img
          src={TOPO_SRC}
          alt=""
          width={1600}
          height={800}
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover object-center select-none"
        />
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative mx-auto flex max-w-4xl flex-col items-center text-center"
      >
        <h1 className="text-display font-thin">
          Carbono azul de manguezal, com lastro{" "}
          <span className="font-bold text-k-deep">auditável</span>.
        </h1>

        <p className="measure mt-8 text-body text-k-ink-soft">
          Restauramos manguezais em Balneário Barra do Sul (SC) e transformamos a captura em ativo
          verificável. Cada ecobarreira tem coordenada, data e responsável; cada número tem fonte
          pública. Para compradores que precisam confiar e auditar.
        </p>

        <motion.div
          variants={fadeUp}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Button asChild size="lg">
            <a href="#investir">Comprar carbono azul</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#metodologia">Ver a metodologia</a>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
