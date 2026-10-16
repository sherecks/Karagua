import { DragRail } from "@/components/drag-rail";
import { Section, SectionHeader } from "@/components/lp/section";

// Selo só com número e cor oficial da ONU (sem os ícones oficiais). A cor do
// número é a de maior contraste em cada fundo: branco em 8/13/17 (≥4,9:1),
// carbono em 14/15, onde o branco falha (3,26:1 e 2,34:1).
const objetivos = [
  {
    n: 13,
    nome: "Ação contra a mudança global do clima",
    cor: "#3f7e44",
    tinta: "#ffffff",
    texto:
      "Manguezais estocam mais carbono por hectare que muitas florestas tropicais. Vamos certificar esse estoque pela metodologia VM0033 da Verra.",
    metas: "13.1 · 13.2",
  },
  {
    n: 14,
    nome: "Vida na água",
    cor: "#0a97d9",
    tinta: "#1a2332",
    texto:
      "O manguezal é o berçário do estuário e abriga espécies ameaçadas como a toninha, o boto-cinza, a tartaruga-verde e o mero.",
    metas: "14.2 · 14.5",
  },
  {
    n: 15,
    nome: "Vida terrestre",
    cor: "#56c02b",
    tinta: "#1a2332",
    texto:
      "O Karaguá Vivo recupera manguezais degradados com plantio, manutenção de mudas e retirada de resíduos.",
    metas: "15.1 · 15.5",
  },
  {
    n: 8,
    nome: "Trabalho decente e crescimento econômico",
    cor: "#a21942",
    tinta: "#ffffff",
    texto:
      "Pelo PSA municipal, pescadores, maricultores e moradores são remunerados por monitorar e restaurar o manguezal. Meta: mais de 400 famílias até 2030.",
    metas: "8.3 · 8.5",
  },
  {
    n: 17,
    nome: "Parcerias e meios de implementação",
    cor: "#19486a",
    tinta: "#ffffff",
    texto:
      "Um modelo desenhado para unir prefeitura, IFC, Univille, comunidades e empresas. A receita dos créditos será repartida com o fundo municipal de PSA e a comunidade.",
    metas: "17.16 · 17.17",
  },
];

export function Ods() {
  return (
    <Section id="ods" surface="fog" theme="light">
      <SectionHeader size="display" eyebrow="Carbono azul" title="Objetivos de Desenvolvimento">
        Cada crédito nasce de um manguezal monitorado e restaurado por pescadores, maricultores e
        moradores. No piloto de 200 hectares em São Francisco do Sul, o trabalho contribui para
        cinco ODS da ONU.
      </SectionHeader>

      <DragRail className="mt-10 md:mt-20">
        {objetivos.map((o) => (
          <article
            key={o.n}
            // relative: segura o sr-only do h3 dentro do trilho (sem ele o texto
            // escapa do overflow-hidden e alarga a página na horizontal).
            className="relative mr-5 flex w-[78vw] shrink-0 flex-col gap-5 bg-k-shell p-6 select-none sm:w-[22rem] md:mr-6 md:p-8"
          >
            <div
              aria-hidden="true"
              className="flex size-16 flex-col items-center justify-center rounded font-mono leading-none"
              style={{ backgroundColor: o.cor, color: o.tinta }}
            >
              <span className="text-[0.6875rem] font-semibold tracking-[0.12em]">ODS</span>
              <span className="mt-1 text-title font-semibold tabular-nums">{o.n}</span>
            </div>
            <h3 className="text-title font-semibold text-k-ink">
              <span className="sr-only">ODS {o.n}: </span>
              {o.nome}
            </h3>
            <p className="text-body text-k-ink-soft">{o.texto}</p>
            <p className="mt-auto font-mono text-data text-k-ink-soft">Metas {o.metas}</p>
          </article>
        ))}
        {/* Cartão-pista: convida ao arraste, como na seção Equipe. */}
        <div className="mr-5 flex w-[60vw] shrink-0 items-end p-6 sm:w-[16rem]">
          <span className="font-mono text-data text-k-ink-soft">arraste →</span>
        </div>
      </DragRail>

      <p className="measure mt-10 text-data text-k-ink-soft md:mt-14">
        Alinhamento declarado com base nos impactos esperados do projeto. Os indicadores serão
        publicados ao longo da implementação.
      </p>
    </Section>
  );
}
