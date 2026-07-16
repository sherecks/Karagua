import { DragRail } from "@/components/drag-rail";
import { Section, SectionHeader } from "@/components/lp/section";

// Avatar por iniciais (placeholder até as fotos com autorização LGPD).
const members = [
  {
    nome: "João Pedro",
    papel: "Co-founder",
    credencial: "Líder de tecnologia, operações e estruturação.",
  },
  {
    nome: "Lucas Melo",
    papel: "Co-founder",
    credencial: "Liderança da visão e da estratégia institucional.",
  },
  {
    nome: "Gabriela",
    papel: "Coordenadora Técnica",
    credencial: "Caracterização ambiental e supervisão do monitoramento georreferenciado.",
  },
  {
    nome: "Carol",
    papel: "Análises técnicas",
    credencial: "Análises técnicas que sustentam a certificação Verra.",
  },
  {
    nome: "Sabrina",
    papel: "Levantamentos de campo",
    credencial: "Levantamentos de campo e mapeamento de áreas prioritárias de restauração.",
  },
  {
    nome: "Daniela Póvoa",
    papel: "Captadora de Recursos",
    credencial: "Estruturação de parcerias e mobilização de capital para lastrear os projetos em campo.",
  },
];

function initials(nome: string) {
  const clean = nome.replace(/[[\]]/g, "").trim();
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Equipe() {
  return (
    // Seção clara da costura Impacto→Equipe (Spec/02 §7): o azul carbon do
    // Impacto funde para o claro aqui. Texto em currentColor anima na costura.
    <Section id="equipe" surface="inherit" theme="light">
      <SectionHeader tone="inherit" eyebrow="Quem conduz" title="Uma equipe técnica multidisciplinar.">
        Capacidade reunida em torno de caracterização ambiental, monitoramento e do rigor técnico
        exigido pela certificação Verra.
      </SectionHeader>

      <DragRail className="mt-10 md:mt-20">
        {members.map((m) => (
          <article
            key={m.nome}
            className="mr-5 flex w-[78vw] shrink-0 flex-col gap-5 bg-current/10 p-6 select-none sm:w-[22rem] md:mr-6 md:p-8"
          >
            <div
              aria-hidden="true"
              className="flex size-16 items-center justify-center rounded-lg bg-k-deep/10 font-mono text-title font-semibold text-k-deep"
            >
              {initials(m.nome)}
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-title font-semibold">{m.nome}</h3>
              <span className="font-mono text-data text-k-deep">{m.papel}</span>
            </div>
            <p className="text-body text-current/70">{m.credencial}</p>
          </article>
        ))}
        {/* Cartão-pista: convida ao arraste e segura o lugar das fotos (LGPD). */}
        <div className="mr-5 flex w-[60vw] shrink-0 items-end p-6 sm:w-[16rem]">
          <span className="font-mono text-data text-current/50">arraste →</span>
        </div>
      </DragRail>
    </Section>
  );
}
