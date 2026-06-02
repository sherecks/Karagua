import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { Button } from "@/components/ui/button";
import { fadeUp, reveal, stagger } from "@/lib/motion";
import { SITE_EMAIL } from "@/lib/site";

const benefits = [
  "Alta integridade climática.",
  "Co-benefícios socioambientais.",
  "Alinhamento com metas ESG.",
  "Posicionamento de marca.",
];

const SUBHEAD = "text-[clamp(1.25rem,2.8vw,2.25rem)] font-data leading-tight text-k-ink-soft";

export function Guardioes() {
  return (
    <Section id="empresas" surface="fog">
      <SectionHeader eyebrow="Para empresas" title="Créditos de carbono rastriáveis." />

      <motion.ul
        {...reveal}
        variants={stagger}
        className="mt-10 grid gap-y-8 sm:grid-cols-2 sm:gap-x-10 md:mt-20 md:gap-x-16 md:gap-y-12"
      >
        {benefits.map((b) => (
          <motion.li key={b} variants={fadeUp}>
            <h3 className={SUBHEAD}>{b}</h3>
          </motion.li>
        ))}
      </motion.ul>

      <motion.div {...reveal} variants={fadeUp} className="mt-16">
        <Button asChild size="lg">
          <a href={`mailto:${SITE_EMAIL}?subject=Parceria%20Karagu%C3%A1%20Ecotech`}>
            Rastreabilidade
          </a>
        </Button>
      </motion.div>
    </Section>
  );
}
