import { motion } from "motion/react";
import { DataPoint } from "@/components/lp/data-point";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal } from "@/lib/motion";

export function Problema() {
  return (
    <Section id="problema" surface="shell">
      <SectionHeader
        eyebrow="O desafio"
        title="O sumidouro de carbono mais denso do litoral está sob pressão."
      >
        Resíduos sólidos (plástico, garrafas e sacolas) entram continuamente nos manguezais pelos
        canais de drenagem. O ecossistema que mais sequestra carbono na costa perde capacidade ano
        após ano, e com ele um estoque de carbono azul difícil de recuperar.
      </SectionHeader>

      <motion.div
        {...reveal}
        variants={fadeUp}
        className="mt-14 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2"
      >
        <div className="relative bg-k-elevated p-8">
          <DataPoint
            display="5×"
            ariaLabel="Cinco vezes mais carbono que florestas terrestres"
            sources={[
              {
                label:
                  "Donato et al. (2011) — Mangroves among the most carbon-rich forests in the tropics. Nature Geoscience.",
                url: "https://doi.org/10.1038/ngeo1123",
              },
              {
                label: "Blue Carbon Initiative — About Blue Carbon.",
                url: "https://www.thebluecarboninitiative.org/about-blue-carbon",
              },
            ]}
          />
          <p className="mt-3 text-body text-k-ink-soft">
            O manguezal sequestra até cinco vezes mais carbono que florestas terrestres (carbono
            azul).
          </p>
        </div>
        <div className="relative bg-k-elevated p-8">
          <DataPoint
            value={365}
            display="365"
            ariaLabel="365 dias por ano de entrada de resíduos"
            sources={[
              {
                label:
                  "Observação operacional Karaguá — Guardiões do Mangue, monitoramento contínuo dos canais de drenagem em Balneário Barra do Sul (SC).",
              },
            ]}
          />
          <p className="mt-3 text-body text-k-ink-soft">
            Dias por ano de entrada de resíduos pelos canais. O problema não tem pausa, a proteção
            também não pode ter.
          </p>
        </div>
      </motion.div>
    </Section>
  );
}
