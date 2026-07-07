import { motion } from "motion/react";
import { ScrollRevealText } from "@/components/lp/scroll-reveal-text";
import { Section } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

// Claim único, qualificado (créditos + carbono azul + manguezal + Sul +
// estruturado). É o centro da seção; nada mais deve reformulá-lo.
const CLAIM =
  "Estruturamos o primeiro projeto de créditos de carbono azul em manguezais no Sul do Brasil.";

// Aterrissagem geográfica: contexto que sustenta o pioneirismo sem repetir o
// tripé tecnologia/comunidade (esse já é a seção Diferencial). Fonte:
// karagua-context/context/06 (piloto 380 ha; Babitonga = maior estuário de SC).
const facts = [
  {
    label: "Piloto",
    value: "Balneário Barra do Sul",
    desc: "380 ha de manguezal onde o modelo é validado antes de escalar.",
  },
  {
    label: "Escala",
    value: "Baía da Babitonga",
    desc: "Maior estuário de Santa Catarina, com cerca de 75% dos manguezais do estado.",
  },
];

export function Pioneirismo() {
  return (
    // Seção azul da costura Equipe↔Pioneirismo (Spec/02 §7): superfície do
    // wrapper, texto em currentColor para animar o azul→branco nos dois sentidos.
    <Section id="pioneirismo" surface="inherit" theme="dark">
      <motion.p
        {...reveal}
        variants={fadeUp}
        className="text-label font-semibold tracking-[0.12em] text-current/70 uppercase"
      >
        Pioneirismo
      </motion.p>

      <ScrollRevealText
        text={CLAIM}
        className="mt-8 max-w-[20ch] text-[clamp(2.25rem,5vw,4.5rem)] leading-[1.02] -tracking-[0.02em] font-medium md:mt-12"
      />

      <motion.div
        {...reveal}
        variants={stagger}
        className="mt-14 grid gap-y-10 sm:grid-cols-2 sm:gap-x-16 md:mt-24"
      >
        {facts.map((f) => (
          <motion.div key={f.label} variants={fadeUp} className="flex flex-col gap-2">
            <span className="font-mono text-data text-k-bright">{f.label}</span>
            <p className="text-[clamp(1.5rem,3vw,2.25rem)] leading-tight font-semibold">
              {f.value}
            </p>
            <p className="mt-1 max-w-[32ch] text-body text-current/70">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
