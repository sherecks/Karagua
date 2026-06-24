import { motion } from "motion/react";
import { useEffect } from "react";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, maskRise, reveal, stagger } from "@/lib/motion";

const LAB_IMG = `${import.meta.env.BASE_URL}images/img4.jpg`.replace(/\/+/g, "/");
const POR_QUE_IMG = `${import.meta.env.BASE_URL}images/img5.jpeg`.replace(/\/+/g, "/");

const cycleSteps = [
  "Modelagem digital",
  "Impressão 3D",
  "Protótipo de ecobarreira",
  "Preservação do mangue",
];

const howItWorks = [
  {
    lead: "12 oficinas gratuitas e abertas",
    rest: "1 dia a cada dois meses, 72 horas/aula de formação tecnológica e cultural.",
  },
  {
    lead: "Laboratório em operação contínua",
    rest: "de segunda a sexta, das 13h às 18h, com acesso aberto à comunidade.",
  },
  {
    lead: "6 bolsas de pesquisa",
    rest: "para jovens do território e estudantes da Udesc e da Univille.",
  },
  {
    lead: "Desenvolvimento e validação de protótipos de ecobarreira",
    rest: "com orientação técnica da equipe ambiental da Karaguá Ecotech.",
  },
  {
    lead: "4 mostras culturais de resultados",
    rest: "abertas ao público, com os protótipos e impactos do território.",
  },
  {
    lead: "1 documentário cultural",
    rest: "registro contínuo dos 24 meses, disponível gratuitamente no YouTube.",
  },
];

const accessItems = [
  { bold: "gratuitas e abertas", text: "Todas as oficinas e atividades são " },
  {
    text: "Parceria com ",
    bold: "escolas públicas",
    rest: " do município, com visitas e participação direta dos alunos.",
  },
  {
    text: "Espaço com adequações de ",
    bold: "acessibilidade arquitetônica",
    rest: " (rampa, circulação, sanitário acessível).",
  },
  {
    text: "Materiais didáticos em linguagem simples e monitoria inclusiva, com atenção a participantes com deficiência intelectual ou TEA.",
  },
  {
    text: "Documentário com ",
    bold: "legendas e audiodescrição",
    rest: ", e materiais de divulgação em formatos acessíveis.",
  },
];

const legacy = [
  {
    label: "Antes",
    text: "a fabricação digital era uma tecnologia distante da realidade de quem vive do manguezal, restrita a centros urbanos e universidades.",
  },
  {
    label: "Depois",
    text: "moradores de Balneário Barra do Sul projetam, imprimem e validam suas próprias soluções para o território onde vivem, com um equipamento cultural permanente em funcionamento todos os dias.",
  },
  {
    label: "A ponte",
    text: "o Laboratório Karaguá Vivo, com seus equipamentos audiovisuais e de impressão, permanece na comunidade ao final dos 24 meses como infraestrutura cultural própria.",
  },
];

const fundingTable = [
  {
    frente: "Coordenação e gestão",
    cobre: "Equipe responsável pela operação do laboratório e dos protótipos",
  },
  {
    frente: "Infraestrutura",
    cobre: "Impressoras 3D, computadores, insumos e adequação do espaço",
  },
  {
    frente: "Formação cultural",
    cobre: "12 oficinas, materiais didáticos e 6 bolsas de pesquisa",
  },
  {
    frente: "Desenvolvimento de protótipo",
    cobre: "Pesquisa, modelagem e validação da ecobarreira",
  },
  {
    frente: "Documentário cultural",
    cobre: "Registro audiovisual contínuo de todo o processo",
  },
];

export function LaboratorioPage() {
  useEffect(() => {
    document.title = "Laboratório Karaguá Vivo · Karaguá";
    return () => {
      document.title = "Karaguá · Preservando os manguezais";
    };
  }, []);

  return (
    <div className="min-h-screen bg-muted">
      <SiteHeader />

      {/* Hero: só texto, alinhado à esquerda como as demais seções. */}
      <section className="relative flex min-h-[80vh] flex-col justify-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mx-auto w-full max-w-[120rem] px-6 md:px-10 lg:px-16"
        >
          <motion.p
            variants={fadeUp}
            className="text-label font-semibold tracking-[0.12em] text-k-ink-soft uppercase"
          >
            Lei Rouanet · Balneário Barra do Sul (SC)
          </motion.p>
          <h1 className="mt-4 max-w-[26ch] overflow-hidden text-[clamp(2.1rem,4.6vw,4.5rem)] leading-[1.02] -tracking-[0.02em] font-thin text-k-ink">
            <motion.span variants={maskRise} className="block">
              Um laboratório de impressão 3D feito pela{" "}
              <span className="font-bold text-k-bright">comunidade que vive do manguezal</span>
            </motion.span>
          </h1>
          <motion.p
            variants={fadeUp}
            className="measure mt-6 max-w-[46ch] text-body text-k-ink-soft"
          >
            O Laboratório Karaguá Vivo leva cultura digital e fabricação 3D para Balneário Barra do
            Sul (SC), formando moradores e transformando esse conhecimento em soluções reais de
            preservação costeira. Tudo gratuito, tudo aberto à comunidade.
          </motion.p>

          <motion.p variants={fadeUp} className="mt-8 text-sm text-k-ink-soft">
            72 horas de formação gratuita · 6 bolsas de pesquisa · 1 documentário cultural
          </motion.p>
        </motion.div>
      </section>

      {/* O que é: imagem à esquerda, texto à direita. */}
      <section id="o-que-e" className="bg-k-fog">
        <div className="grid lg:grid-cols-[38%_1fr] lg:items-stretch">
          <div className="relative min-h-[40vh] overflow-hidden md:min-h-[50vh] lg:min-h-full">
            <img
              src={LAB_IMG}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover select-none"
            />
          </div>
          <div className="flex flex-col justify-center gap-8 px-4 py-12 md:px-10 md:py-24 lg:pr-16 lg:pl-16 lg:py-28">
            <SectionHeader
              eyebrow="O laboratório"
              title={
                <>
                  Um espaço cultural comunitário de <span className="font-thin">impressão 3D.</span>
                </>
              }
            />
            <motion.div {...reveal} variants={stagger} className="measure flex flex-col gap-5">
              <motion.p variants={fadeUp} className="text-body text-k-ink-soft">
                Balneário Barra do Sul vive em relação direta com o manguezal. Pescadores
                artesanais, marisqueiras e moradores constroem seus modos de criar e viver a partir
                da Baía da Babitonga.
              </motion.p>
              <motion.p variants={fadeUp} className="text-body text-k-ink-soft">
                O Laboratório Karaguá Vivo nasce para tornar a tecnologia parte desse modo de vida:
                um espaço de impressão 3D e fabricação digital, gratuito, contínuo e aberto, onde
                moradores aprendem a projetar e fabricar soluções para o território em que vivem.
              </motion.p>
              <motion.p variants={fadeUp} className="text-body text-k-ink-soft">
                É o braço cultural da Karaguá Ecotech. O mesmo território monitorado para a
                certificação de créditos de carbono azul é onde a cultura de preservação é ensinada,
                praticada e transmitida, agora com a impressão 3D como ferramenta.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <Section id="como-funciona" surface="shell">
        <SectionHeader
          eyebrow="Como funciona"
          title={
            <>
              Um ciclo contínuo de <span className="font-thin">aprendizado e fabricação.</span>
            </>
          }
        />

        <motion.div
          {...reveal}
          variants={fadeUp}
          className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-2 font-mono text-data text-k-deep"
        >
          {cycleSteps.map((step, i) => (
            <span key={step} className="inline-flex items-baseline gap-3">
              {step}
              {i < cycleSteps.length - 1 ? (
                <span aria-hidden className="text-k-ink-soft">
                  →
                </span>
              ) : null}
            </span>
          ))}
        </motion.div>

        <motion.ol
          {...reveal}
          variants={stagger}
          className="mt-12 flex flex-col gap-6 md:mt-16 md:gap-8"
        >
          {howItWorks.map((item, i) => (
            <motion.li
              key={item.lead}
              variants={fadeUp}
              className="grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-1"
            >
              <span className="font-mono text-data text-k-deep">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-body text-k-ink-soft">
                <span className="font-semibold text-k-ink">{item.lead}</span> {item.rest}
              </p>
            </motion.li>
          ))}
        </motion.ol>
      </Section>

      {/* Por que isso importa */}
      {/* Por que isso importa: texto à esquerda, imagem à direita. */}
      <section id="por-que-importa" className="bg-k-fog">
        <div className="grid lg:grid-cols-[1fr_38%] lg:items-stretch">
          <div className="flex flex-col justify-center gap-8 px-4 py-12 md:px-10 md:py-24 lg:py-28 lg:pr-16 lg:pl-16">
            <SectionHeader
              eyebrow="Por que isso importa"
              title={
                <>
                  Tecnologia como <span className="font-thin">instrumento cultural.</span>
                </>
              }
            />
            <motion.div {...reveal} variants={stagger} className="measure flex flex-col gap-5">
              <motion.p variants={fadeUp} className="text-body text-k-ink-soft">
                A conservação de um manguezal não depende só de monitoramento e restauração. Depende
                de uma cultura de pertencimento e cuidado, construída e transmitida pela própria
                comunidade.
              </motion.p>
              <motion.p variants={fadeUp} className="text-body text-k-ink-soft">
                Quando ensinada e praticada no território, a tecnologia se torna um instrumento
                cultural: amplia a capacidade de quem vive ali de compreender, proteger e
                protagonizar o futuro do lugar onde mora.
              </motion.p>
              <motion.p variants={fadeUp} className="text-body text-k-ink-soft">
                Levar a impressão 3D, até então restrita a centros urbanos e ambientes acadêmicos,
                para Balneário Barra do Sul democratiza o acesso à inovação e conecta esse acesso à
                realidade do território costeiro.
              </motion.p>
            </motion.div>
          </div>
          <div className="relative min-h-[40vh] overflow-hidden md:min-h-[50vh] lg:min-h-full">
            <img
              src={POR_QUE_IMG}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover select-none"
            />
          </div>
        </div>
      </section>

      {/* Acesso aberto a todos */}
      <Section id="acesso" surface="shell">
        <SectionHeader
          eyebrow="Acesso aberto a todos"
          title={
            <>
              Pensado para ser de <span className="font-thin">toda a comunidade.</span>
            </>
          }
        />
        <motion.ul {...reveal} variants={stagger} className="mt-10 flex flex-col gap-5 md:mt-14">
          {accessItems.map((item) => (
            <motion.li
              key={item.text + (item.bold ?? "")}
              variants={fadeUp}
              className="flex gap-4 text-body text-k-ink-soft"
            >
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-k-bright" />
              <p className="measure">
                {item.text}
                {item.bold ? (
                  <strong className="font-semibold text-k-ink">{item.bold}</strong>
                ) : null}
                {item.rest ?? (item.bold ? "." : "")}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </Section>

      {/* O legado que fica no território */}
      <Section id="legado" surface="fog">
        <SectionHeader
          eyebrow="O legado"
          title={
            <>
              O que fica no <span className="font-thin">território.</span>
            </>
          }
        />
        <motion.div
          {...reveal}
          variants={stagger}
          className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8 md:mt-16"
        >
          {legacy.map((item) => (
            <motion.div key={item.label} variants={fadeUp} className="flex flex-col gap-3">
              <span className="font-mono text-data tracking-[0.1em] text-k-deep uppercase">
                {item.label}
              </span>
              <p className="text-body text-k-ink-soft">{item.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* Apoie via Lei Rouanet: esquerda pitch + CTA, direita detalhamento. */}
      <Section id="apoie" surface="primary">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col">
            <SectionHeader
              eyebrow="Apoie via Lei Rouanet"
              title={
                <>
                  Estruturado via <span className="font-thin">incentivo fiscal cultural.</span>
                </>
              }
            >
              Este projeto capta recursos pelo mecanismo de incentivo fiscal da Lei Rouanet (Lei nº
              8.313/1991), via Salic/Ministério da Cultura. Sua empresa pode destinar parte do
              imposto de renda devido para viabilizar o laboratório, sem custo adicional, dentro do
              que já seria pago em impostos.
            </SectionHeader>

            <motion.p
              {...reveal}
              variants={fadeUp}
              className="measure mt-8 text-body text-k-ink-soft"
            >
              Se sua empresa já trabalha com agenda ESG ou descarbonização, inclusive se já compra
              créditos de carbono azul da Karaguá Ecotech, apoiar o Laboratório Karaguá Vivo é uma
              extensão natural desse compromisso: mesmo território, agora também investindo em
              cultura e tecnologia comunitária.
            </motion.p>
          </div>

          <div className="flex flex-col">
            <motion.p
              {...reveal}
              variants={fadeUp}
              className="text-label font-semibold tracking-[0.1em] uppercase text-k-ink-soft"
            >
              O que esse apoio viabiliza, em 24 meses de operação contínua
            </motion.p>

            <motion.div {...reveal} variants={stagger} className="mt-8 flex flex-col gap-6">
              {fundingTable.map((row) => (
                <motion.div
                  key={row.frente}
                  variants={fadeUp}
                  className="border-t border-border pt-6"
                >
                  <h3 className="font-semibold text-k-ink">{row.frente}</h3>
                  <p className="mt-1 text-body text-k-ink-soft">{row.cobre}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </Section>

      {/* CTA final */}
      <Section id="cta-final" surface="fog">
        <motion.div {...reveal} variants={stagger} className="flex flex-col">
          <h2 className="max-w-[24ch] overflow-hidden text-[clamp(2rem,5vw,4.5rem)] leading-[1] font-thin text-k-ink">
            <motion.span variants={fadeUp} className="block">
              Cultura, tecnologia e{" "}
              <span className="font-bold text-k-bright">manguezal andando juntos.</span>
            </motion.span>
          </h2>
          <motion.p variants={fadeUp} className="measure mt-6 text-body text-k-ink-soft">
            Apoie o Laboratório Karaguá Vivo e ajude a colocar inovação nas mãos de quem protege a
            Baía da Babitonga todos os dias.
          </motion.p>
        </motion.div>
      </Section>

      <Footer />
    </div>
  );
}
