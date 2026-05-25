import { motion } from "motion/react";
import { Section } from "@/components/lp/section";
import { Button } from "@/components/ui/button";
import { fadeUp, reveal, stagger } from "@/lib/motion";
import { SITE_EMAIL } from "@/lib/site";

export function CtaFinal() {
  return (
    <Section id="contato" surface="fog">
      <motion.div {...reveal} variants={stagger} className="mx-auto max-w-3xl text-center">
        <motion.p
          variants={fadeUp}
          className="text-label font-semibold tracking-[0.12em] uppercase text-k-ink-soft mb-6"
        >
          Contato
        </motion.p>
        <motion.h2 variants={fadeUp} className="text-headline font-thin text-k-ink">
          Pronto para transformar conservação em{" "}
          <span className="font-bold text-k-deep">valor?</span>
        </motion.h2>
        <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-xl text-body text-k-ink-soft">
          Estamos em busca de empresas compradoras de créditos de carbono azul, apoiadores
          institucionais e parceiros estratégicos que queiram participar de um modelo que une
          retorno financeiro, restauração da natureza e impacto social.
        </motion.p>
        <motion.div variants={fadeUp} className="mt-10 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <a href={`mailto:${SITE_EMAIL}?subject=Karagu%C3%A1%20Ecotech%20%E2%80%94%20Contato`}>
              Entrar em contato
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#solucao">Conhecer a solução</a>
          </Button>
        </motion.div>
        <motion.p
          variants={fadeUp}
          className="mt-12 border-t border-border pt-8 text-body text-k-ink-soft"
        >
          Balneário Barra do Sul · Santa Catarina · Brasil
        </motion.p>
      </motion.div>
    </Section>
  );
}
