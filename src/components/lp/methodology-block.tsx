import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

const legalItems = [
  {
    title: "ProManguezal, Decreto nº 12.045/2024",
    body: "Programa nacional de conservação, recuperação e uso sustentável de manguezais, instituído em 2024 e que reforça a relevância institucional do setor.",
  },
  {
    title: "Mercado regulado de carbono, Lei nº 15.042/2024",
    body: "Marco regulatório do mercado brasileiro de carbono, ampliando o horizonte de comercialização de créditos no país.",
  },
  {
    title: "PEPSA, Lei Estadual nº 15.133/2010 (SC)",
    body: "Política Estadual de Serviços Ambientais de Santa Catarina. Reconhece o PSA como ferramenta de desenvolvimento sustentável e permite remunerar atividades de conservação e restauração.",
  },
  {
    title: "BNDES Fundo Clima, R$42,5 bilhões autorizados (2026)",
    body: "Linha de financiamento com custo de 1% ao ano para projetos de PSA, recomposição de cobertura vegetal e manejo sustentável. Perfil alinhado à operação da Karaguá.",
  },
  {
    title: "Metodologias Verra, VM0033 e VM0007",
    body: "Padrões internacionalmente reconhecidos para certificação de créditos de carbono azul (VM0033) e REDD+ (VM0007), com auditoria independente e verificação periódica.",
  },
];

export function MethodologyBlock() {
  return (
    <Section id="legal" surface="shell" fullHeight={false}>
      <SectionHeader
        eyebrow="Base legal e institucional"
        title={
          <>
            Estruturado sobre marcos <span className="font-thin">sólidos.</span>
          </>
        }
      >
        O projeto não depende de legislação futura. Os marcos que sustentam o modelo já existem e
        estão em vigor.
      </SectionHeader>

      <motion.div
        {...reveal}
        variants={stagger}
        className="mt-12 flex flex-col gap-px overflow-hidden rounded-md border border-border bg-border"
      >
        {legalItems.map((item) => (
          <motion.div
            key={item.title}
            variants={fadeUp}
            className="flex gap-4 bg-k-elevated px-6 py-5"
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-k-deep" />
            <div>
              <p className="font-semibold text-k-ink">{item.title}</p>
              <p className="mt-1 text-body text-k-ink-soft">{item.body}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
