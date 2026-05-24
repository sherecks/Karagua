import { motion } from "motion/react";
import { Section } from "@/components/lp/section";
import { Button } from "@/components/ui/button";
import { fadeUp, reveal, stagger } from "@/lib/motion";
import { SITE_EMAIL } from "@/lib/site";

export function CtaFinal() {
  return (
    <Section id="investir" surface="fog">
      <motion.div {...reveal} variants={stagger} className="mx-auto max-w-3xl text-center">
        <motion.h2 variants={fadeUp} className="text-headline font-thin text-k-ink">
          Proteger o mangue é um <span className="font-bold text-k-deep">ativo</span>, não um custo.
        </motion.h2>
        <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-xl text-body text-k-ink-soft">
          Compre carbono azul de alta integridade com lastro georreferenciado, ou entre como
          parceiro do Karaguá Vivo no território. Respondemos com documentação técnica e calendário
          de auditoria.
        </motion.p>
        <motion.div variants={fadeUp} className="mt-10 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <a href={`mailto:${SITE_EMAIL}?subject=Compra%20de%20carbono%20azul%2C%20Karagu%C3%A1`}>
              Comprar carbono azul
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={`mailto:${SITE_EMAIL}?subject=Parceria%20Karagu%C3%A1%20Vivo`}>
              Falar sobre parceria
            </a>
          </Button>
        </motion.div>
      </motion.div>
    </Section>
  );
}
