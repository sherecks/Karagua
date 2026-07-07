import { ValueMapBackground } from "@/components/lp/value-map-background";
import { maskRise } from "@/lib/motion";
import { motion } from "motion/react";

export function HeroV3() {
  return (
    <section id="topo" className="grid min-h-screen w-full lg:grid-cols-2 lg:gap-12">
      <div className="relative flex flex-col justify-center px-4 pt-20 pb-16 md:px-10 md:pt-28 lg:px-16 lg:pt-0">
        <div className="mx-auto w-full max-w-[60rem] lg:mx-0">
          <h1 className="max-w-[18ch] overflow-hidden text-[clamp(2.5rem,5.2vw,5.75rem)] leading-[0.95] -tracking-[0.03em] font-thin">
            <motion.span variants={maskRise} initial="hidden" animate="visible" className="block">
              Transformamos o manguezal em ativo climático{" "}
              <span className="font-bold text-k-bright">com tecnologia e comunidade.</span>
            </motion.span>
          </h1>
        </div>
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        <ValueMapBackground />
      </div>
    </section>
  );
}
