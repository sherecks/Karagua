import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { Badge } from "@/components/ui/badge";
import { fadeUp, reveal, stagger } from "@/lib/motion";

const phases = [
  {
    n: "01",
    phase: "Piloto",
    status: "Em andamento",
    title: "Balneário Barra do Sul, 380 ha",
    body: "Capacitação e remuneração da comunidade para mapear e monitorar a área. Implantação de IoTs, geração dos primeiros créditos de carbono (estimativa de R$1,2M/ano) e estruturação da base legal com o município dentro do marco da Lei 15.133/2010.",
    tags: [
      "Monitoramento comunitário",
      "IoTs de campo",
      "Certificação inicial",
      "UDESC · Univille",
    ],
  },
  {
    n: "02",
    phase: "Manejo",
    status: "Sequencial",
    title: "Restauração ativa do manguezal",
    body: "Seleção de áreas prioritárias para plantio e reflorestamento. Moradores recebem treinamento prático, equipamentos e acompanhamento técnico, remunerados pelo desempenho nas ações de recuperação ambiental.",
    tags: ["Plantio supervisionado", "Rastreabilidade de dados", "Documentação técnica"],
  },
  {
    n: "03",
    phase: "Escala",
    status: "3 anos",
    title: "Baía da Babitonga, até 8.000 ha",
    body: "Replicação do modelo validado ao longo da baía, integrando novos municípios e ampliando a rede comunitária. Meta de R$1,2M/ano em créditos com compartilhamento de receita com os municípios parceiros. Captação estruturada via BNDES Fundo Clima.",
    tags: ["Expansão municipal", "BNDES Fundo Clima", "PSA em escala"],
  },
  {
    n: "04",
    phase: "Plataforma",
    status: "Futura",
    title: "Plataforma digital pública",
    body: "Todos os dados de monitoramento, rastreabilidade das ações e informações dos créditos certificados disponíveis em acesso aberto. Ferramenta de governança territorial para municípios, comunidades e compradores de crédito.",
    tags: ["Dados abertos", "Governança territorial", "Transparência pública"],
  },
];

export function KaraguaVivo() {
  return (
    <Section id="como-funciona" surface="fog">
      <SectionHeader
        eyebrow="Karaguá Vivo"
        title={
          <>
            <span className="font-thin">Quatro fases.</span> Um modelo escalável.
          </>
        }
      >
        Do piloto em Balneário Barra do Sul à cobertura de metade da Baía da Babitonga, com
        plataforma de dados aberta para todos.
      </SectionHeader>

      <motion.ol {...reveal} variants={stagger} className="mt-14 flex flex-col gap-4">
        {phases.map((p) => (
          <motion.li
            key={p.n}
            variants={fadeUp}
            className="grid overflow-hidden rounded-md border border-border bg-k-elevated sm:grid-cols-[9rem_1fr]"
          >
            <div className="flex flex-col items-center justify-center gap-2 border-b border-border px-6 py-6 text-center sm:border-b-0 sm:border-r">
              <span className="font-mono text-label font-semibold tracking-[0.12em] uppercase text-k-ink-soft">
                Fase {p.n}
              </span>
              <span className="text-title font-semibold text-k-ink">{p.phase}</span>
              <Badge variant="outline" className="rounded-full font-mono text-[11px] text-k-deep">
                {p.status}
              </Badge>
            </div>
            <div className="p-6 md:p-8">
              <h3 className="text-title font-semibold text-k-ink">{p.title}</h3>
              <p className="mt-2 text-body text-k-ink-soft">{p.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {p.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="rounded-md font-mono text-k-ink-soft"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.li>
        ))}
      </motion.ol>
    </Section>
  );
}
