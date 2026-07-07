import { motion } from "motion/react";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

// Tripé do diferencial: pioneirismo (qualificado), tecnologia (lastro, em
// implantação) e comunidade (PSA + partilha). Tags curtas (1 linha).
const pillars = [
  {
    n: "01",
    label: "Pioneirismo",
    title: "Estruturação regional inédita",
    tag: "Primeiro projeto de carbono azul de manguezal estruturado no Sul do Brasil.",
  },
  {
    n: "02",
    label: "Tecnologia",
    title: "Lastro georreferenciado",
    tag: "Monitoramento georreferenciado e auditável, em implantação no piloto.",
  },
  {
    n: "03",
    label: "Comunidade",
    title: "Receita compartilhada",
    tag: "PSA às comunidades e partilha de receita com os municípios.",
  },
];

/**
 * Diferencial — linhas-índice interativas (referência BASIC/DEPT: listas com
 * numeral gigante e estado de hover que enfatiza a linha). Cada linha tem uma
 * hairline superior, um número grande que desliza no hover e a tag que ganha
 * cor. Tom institucional: deslocamentos curtos, transições calmas; o transform
 * de hover é suprimido sob reduced-motion (motion-reduce).
 */
export function Diferencial() {
  return (
    // Seção escura da costura 2→3 (Spec/02 §7): superfície do wrapper, texto em
    // currentColor para animar junto com a transição de tema.
    <Section id="diferencial" surface="inherit" theme="dark">
      <SectionHeader
        tone="inherit"
        eyebrow="O diferencial"
        title="Tecnologia e comunidade no mesmo modelo."
      />

      <motion.div {...reveal} variants={stagger} className="mt-10 flex flex-col md:mt-20">
        {pillars.map((p) => (
          <motion.div
            key={p.title}
            variants={fadeUp}
            className="group grid grid-cols-[auto_1fr] items-center gap-x-6 py-8 transition-colors duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:bg-current/5 md:grid-cols-[8rem_1fr_minmax(0,28rem)] md:gap-x-10 md:py-12"
          >
            <span className="font-mono text-[clamp(2.5rem,6vw,4.5rem)] leading-none font-thin text-current/30 tabular-nums transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:text-k-bright motion-safe:group-hover:translate-x-2">
              {p.n}
            </span>

            <div className="col-start-2 flex flex-col gap-1.5">
              <span className="font-mono text-data text-k-bright">{p.label}</span>
              <h3 className="text-[clamp(1.25rem,2.6vw,2.125rem)] leading-tight font-semibold">
                {p.title}
              </h3>
            </div>

            <p className="col-span-2 mt-3 max-w-prose text-body text-current/70 transition-colors duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:text-current md:col-span-1 md:col-start-3 md:mt-0">
              {p.tag}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
