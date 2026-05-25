import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { Button } from "@/components/ui/button";
import { fadeUp, reveal, stagger } from "@/lib/motion";
import { SITE_EMAIL } from "@/lib/site";

const benefits = [
  {
    title: "Alta integridade climática",
    body: "Créditos gerados por metodologias reconhecidas internacionalmente (VM0033 e VM0007 da Verra), com dados verificáveis e rastreabilidade completa do processo.",
  },
  {
    title: "Co-benefícios socioambientais",
    body: "Cada crédito adquirido financia diretamente a remuneração de comunidades costeiras, a conservação de ecossistemas e a geração de dados ambientais públicos.",
  },
  {
    title: "Alinhamento com metas ESG e net zero",
    body: "Estratégia de descarbonização e compensação complementar com impacto documentado, compatível com compromissos públicos de sustentabilidade e relatórios GRI/SASB.",
  },
  {
    title: "Posicionamento de marca",
    body: "Associação a um projeto de referência em Carbono Azul no litoral catarinense, com respaldo científico, base legal sólida e visibilidade crescente no mercado regulado brasileiro.",
  },
];

const features = [
  "Créditos certificados por metodologia Verra",
  "Rastreabilidade de dados ambiental completa",
  "Visitas técnicas e relatórios de impacto",
  "Compartilhamento de receita com comunidade e municípios",
  "Acesso à plataforma de dados públicos",
];

export function Guardioes() {
  return (
    <Section id="empresas" surface="fog">
      <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
        <div>
          <SectionHeader
            eyebrow="Para empresas"
            title="Créditos de carbono com co-benefícios verificáveis."
          >
            Créditos de Carbono Azul vinculados a manguezais têm valor diferenciado no mercado
            porque combinam sequestro de carbono de alta qualidade com benefícios socioambientais
            mensuráveis.
          </SectionHeader>

          <motion.ul {...reveal} variants={stagger} className="mt-10 flex flex-col gap-6">
            {benefits.map((b) => (
              <motion.li key={b.title} variants={fadeUp} className="flex gap-4">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-k-deep" />
                <div>
                  <h4 className="font-semibold text-k-ink">{b.title}</h4>
                  <p className="mt-1 text-body text-k-ink-soft">{b.body}</p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          {...reveal}
          variants={fadeUp}
          className="rounded-md border border-border bg-k-elevated p-8"
        >
          <p className="text-label font-semibold tracking-[0.12em] uppercase text-k-deep mb-5">
            Parceria comercial
          </p>
          <h3 className="text-title font-semibold text-k-ink mb-4">
            Torne-se comprador de créditos ou apoiador institucional
          </h3>
          <p className="text-body text-k-ink-soft mb-8">
            Conectamos sua empresa a um ativo climático de alta qualidade, com impacto real e
            mensurável no litoral de Santa Catarina.
          </p>
          <ul className="mb-8 flex flex-col divide-y divide-border">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3 py-3 text-body text-k-ink">
                <span className="font-bold text-k-deep">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="w-full">
            <a href={`mailto:${SITE_EMAIL}?subject=Parceria%20Karagu%C3%A1%20Ecotech`}>
              Iniciar conversa
            </a>
          </Button>
        </motion.div>
      </div>
    </Section>
  );
}
