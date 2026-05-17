import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { Badge } from "@/components/ui/badge";
import { fadeUp, reveal, stagger } from "@/lib/motion";

const pillars = [
  {
    title: "Economia Circular",
    body: "Coletamos o PET descartado nos próprios manguezais e o transformamos em filamento para impressão 3D das ecobarreiras.",
    tag: "Redução de custo 50–66%",
  },
  {
    title: "Monitoramento",
    body: "Guardiões do Mangue, membros da comunidade treinados, realizam observações quinzenais em campo.",
    tag: "CONAMA 357/2005",
  },
  {
    title: "Georreferenciamento",
    body: "GPS e aplicativos registram cada ecobarreira. Todo dado coletado é público e acessível.",
    tag: "Dados públicos",
  },
  {
    title: "Impacto Social",
    body: "Pagamento por Serviços Ambientais transforma cuidado ambiental em oportunidade econômica justa.",
    tag: "PSA",
  },
];

export function Pillars() {
  return (
    <Section id="pilares" surface="shell">
      <SectionHeader eyebrow="A tecnologia" title="Quatro frentes, um manguezal protegido." />

      <motion.div
        {...reveal}
        variants={stagger}
        className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {pillars.map((p) => (
          <motion.div
            key={p.title}
            variants={fadeUp}
            className="flex h-full flex-col rounded-md border border-border bg-k-elevated p-6"
          >
            <h3 className="text-title font-semibold text-k-ink">{p.title}</h3>
            <p className="mt-3 grow text-body text-k-ink-soft">{p.body}</p>
            <Badge variant="outline" className="mt-6 rounded-md font-mono text-k-deep">
              {p.tag}
            </Badge>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
