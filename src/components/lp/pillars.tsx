import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { Badge } from "@/components/ui/badge";
import { fadeUp, reveal, stagger } from "@/lib/motion";

const pillars = [
  {
    title: "Economia Circular",
    body: "PET descartado dentro do mangue vira filamento de impressão 3D para as ecobarreiras. Insumo coletado no próprio território, com custo até 66% menor que a alternativa convencional.",
    tag: "Redução de custo 50–66%",
  },
  {
    title: "Monitoramento (MRV)",
    body: "Monitoramento, Relato e Verificação. Guardiões do Mangue, treinados na comunidade, fazem observações quinzenais em campo seguindo a Resolução CONAMA 357/2005. Dado de origem, com cadeia de custódia.",
    tag: "CONAMA 357/2005",
  },
  {
    title: "Georreferenciamento",
    body: "GPS e aplicativos registram cada ecobarreira instalada. O dataset completo é aberto: qualquer comprador pode reauditar do ponto.",
    tag: "Dados públicos",
  },
  {
    title: "Pagamento por Serviços Ambientais",
    body: "PSA paga quem vive no território para proteger e monitorar. Impacto social mensurável que compõe a integridade do crédito.",
    tag: "PSA",
  },
];

export function Pillars() {
  return (
    <Section id="pilares" surface="shell">
      <SectionHeader eyebrow="A tecnologia" title="Quatro frentes, um ativo de alta integridade." />

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
