import { motion } from "motion/react";
import { Section } from "@/components/lp/section";
import { Button } from "@/components/ui/button";
import { fadeUp, reveal, stagger } from "@/lib/motion";
import { SITE_EMAIL } from "@/lib/site";

export function CtaFinal() {
  return (
    <Section id="contato" surface="shell">
      <motion.div {...reveal} variants={stagger} className="flex flex-col">
        <motion.p
          variants={fadeUp}
          className="text-label font-semibold tracking-[0.12em] text-k-ink-soft uppercase"
        >
          Contato
        </motion.p>

        <h2 className="mt-10 max-w-[24ch] overflow-hidden text-[clamp(2.5rem,5vw,5rem)] leading-[1] font-thin text-k-ink">
          <motion.span variants={fadeUp} className="block">
            Pronto para transformar preservação em{" "}
            <span className="font-bold text-k-bright">valor?</span>
          </motion.span>
        </h2>

        <motion.div variants={fadeUp} className="mt-12 flex flex-wrap items-center gap-4">
          <Button asChild size="lg">
            <a href={`mailto:${SITE_EMAIL}?subject=Contato%20Karagu%C3%A1%20Ecotech`}>
              Entrar em contato
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#solucao">Conhecer a solução</a>
          </Button>
        </motion.div>

        <motion.p variants={fadeUp} className="mt-16 font-mono text-data text-k-ink-soft">
          Balneário Barra do Sul · Santa Catarina · Brasil
        </motion.p>
      </motion.div>
    </Section>
  );
}
