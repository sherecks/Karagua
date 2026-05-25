import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { Badge } from "@/components/ui/badge";
import { fadeUp, reveal, stagger } from "@/lib/motion";

const solutions = [
  {
    n: "01",
    label: "Certificação",
    title: "Créditos de carbono azul de alta integridade",
    body: "Medimos, monitoramos e certificamos o carbono estocado e sequestrado em áreas de manguezal. Cada crédito representa uma tonelada de CO₂ equivalente com rastreabilidade completa de dados ambientais.",
    tag: "VM0033 · VM0007 · Verra",
  },
  {
    n: "02",
    label: "Comunidade",
    title: "PSA: moradores e pescadores na cadeia produtiva",
    body: "O mecanismo de Pagamento por Serviços Ambientais (PSA) remunera diretamente quem vive no território. Saber local, presença diária e conhecimento dos ciclos do manguezal são parte da operação.",
    tag: "Lei 15.133/2010 SC · PEPSA",
  },
  {
    n: "03",
    label: "Tecnologia",
    title: "IoTs, dados contínuos e plataforma pública",
    body: "Sensores e dispositivos IoT captam dados da água e do ambiente em campo. Toda a informação gerada será disponibilizada em plataforma digital pública, garantindo transparência para compradores, municípios e comunidades.",
    tag: "Monitoramento contínuo",
  },
];

export function Pillars() {
  return (
    <Section id="solucao" surface="shell">
      <SectionHeader
        eyebrow="A solução"
        title="Carbono Azul com dados verificáveis, comunidade remunerada e escala territorial."
      />

      <motion.div {...reveal} variants={stagger} className="mt-14 grid gap-6 md:grid-cols-3">
        {solutions.map((s) => (
          <motion.div
            key={s.title}
            variants={fadeUp}
            className="flex h-full flex-col rounded-md border border-border bg-k-elevated p-6"
          >
            <span className="font-mono text-data text-k-deep">
              {s.n} — {s.label}
            </span>
            <h3 className="mt-4 text-title font-semibold text-k-ink">{s.title}</h3>
            <p className="mt-3 grow text-body text-k-ink-soft">{s.body}</p>
            <Badge variant="outline" className="mt-6 rounded-md font-mono text-k-deep">
              {s.tag}
            </Badge>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
