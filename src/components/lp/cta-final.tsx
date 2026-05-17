import { motion } from "motion/react";
import { Section } from "@/components/lp/section";
import { Button } from "@/components/ui/button";
import { fadeUp, reveal, stagger } from "@/lib/motion";

export function CtaFinal() {
  return (
    <Section id="investir" surface="carbon">
      <motion.div {...reveal} variants={stagger} className="mx-auto max-w-3xl text-center">
        <motion.h2 variants={fadeUp} className="text-headline font-thin text-foreground">
          Proteger o mangue é um <span className="font-bold text-k-bright">ativo</span>, não um
          custo.
        </motion.h2>
        <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-xl text-body text-foreground/75">
          Invista em carbono azul de alta integridade ou seja parceiro do Karaguá Vivo no
          território.
        </motion.p>
        <motion.div variants={fadeUp} className="mt-10 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <a href="mailto:contato@karagua.com.br?subject=Investir%20na%20Karagu%C3%A1">
              Investir na Karaguá
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="mailto:contato@karagua.com.br?subject=Parceria%20Karagu%C3%A1%20Vivo">
              Ser parceiro
            </a>
          </Button>
        </motion.div>
      </motion.div>
    </Section>
  );
}
