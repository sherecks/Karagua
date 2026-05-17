import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal } from "@/lib/motion";

export function Problema() {
  return (
    <Section id="problema" surface="shell">
      <SectionHeader eyebrow="O desafio" title="O mangue está sob pressão.">
        Resíduos sólidos (plástico, garrafas e sacolas) entram continuamente nos manguezais pelos
        canais de drenagem. O ecossistema que mais sequestra carbono no litoral perde capacidade ano
        após ano.
      </SectionHeader>

      <motion.div
        {...reveal}
        variants={fadeUp}
        className="mt-14 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2"
      >
        <div className="bg-k-elevated p-8">
          <p className="font-mono text-display text-k-deep">5×</p>
          <p className="mt-3 text-body text-k-ink-soft">
            O manguezal sequestra até cinco vezes mais carbono que florestas terrestres (carbono
            azul).
          </p>
        </div>
        <div className="bg-k-elevated p-8">
          <p className="font-mono text-display text-k-deep">365</p>
          <p className="mt-3 text-body text-k-ink-soft">
            Dias por ano de entrada de resíduos pelos canais. O problema não tem pausa, a proteção
            também não pode ter.
          </p>
        </div>
      </motion.div>
    </Section>
  );
}
