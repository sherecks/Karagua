import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal } from "@/lib/motion";

export function Mapa() {
  return (
    <Section id="mapa" surface="shell">
      <SectionHeader eyebrow="Transparência" title="Cada ecobarreira, no mapa e em público.">
        O georreferenciamento de todas as instalações fica aberto. Aqui entra o mapa interativo,
        alimentado pelos dados de campo dos Guardiões.
      </SectionHeader>

      <motion.div
        {...reveal}
        variants={fadeUp}
        className="mt-14 grid place-items-center rounded-md border border-border border-dashed bg-k-elevated p-16"
      >
        <p className="font-mono text-data text-k-ink-soft">
          [ mapa interativo — integração pendente ]
        </p>
      </motion.div>
    </Section>
  );
}
