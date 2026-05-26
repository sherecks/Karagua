import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { Button } from "@/components/ui/button";
import { fadeUp, reveal, stagger } from "@/lib/motion";
import { SITE_EMAIL } from "@/lib/site";

const benefits = [
  "Alta integridade climática",
  "Co-benefícios socioambientais",
  "Alinhamento com metas ESG e net zero",
  "Posicionamento de marca",
];

const SUBHEAD = "text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold leading-tight text-k-ink";

export function Guardioes() {
  return (
    <Section id="empresas" surface="fog">
      <SectionHeader
        eyebrow="Para empresas"
        title="Créditos de carbono com co-benefícios verificáveis."
      />

      <motion.ul {...reveal} variants={stagger} className="mt-20 grid gap-x-16 gap-y-12 sm:grid-cols-2">
        {benefits.map((b) => (
          <motion.li key={b} variants={fadeUp}>
            <h3 className={SUBHEAD}>{b}</h3>
          </motion.li>
        ))}
      </motion.ul>

      <motion.div {...reveal} variants={fadeUp} className="mt-16">
        <Button asChild size="lg">
          <a href={`mailto:${SITE_EMAIL}?subject=Parceria%20Karagu%C3%A1%20Ecotech`}>
            Iniciar conversa
          </a>
        </Button>
      </motion.div>
    </Section>
  );
}
