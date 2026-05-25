import { Button } from "@/components/ui/button";
import { fadeUp, stagger } from "@/lib/motion";
import { motion } from "motion/react";

const TOPO_SRC = `${import.meta.env.BASE_URL}topo.svg`.replace(/\/+/g, "/");

const stats = [
  { value: "380 ha", label: "no projeto piloto em Balneário Barra do Sul" },
  { value: "R$1.2M", label: " por ano é a estimativa de receita em créditos de carbono" },
  { value: "8.000 ha", label: "de potencial na Baía da Babitonga" },
  { value: "400+", label: "famílias impactadas até 2035" },
];

export function Hero() {
  return (
    <section
      id="topo"
      className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pt-24 pb-28 md:pt-32 md:pb-36"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden opacity-[0.06]"
      >
        <img
          src={TOPO_SRC}
          alt=""
          width={1600}
          height={800}
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover object-center select-none"
        />
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative flex flex-col"
      >
        {/* Texto — limitado a max-w-2xl, alinhado à esquerda */}
        <div className="flex max-w-2xl flex-col items-start text-left">
          <motion.p
            variants={fadeUp}
            className="text-label font-semibold tracking-[0.12em] uppercase text-k-ink-soft mb-8"
          >
            Carbono Azul · Santa Catarina · Brasil
          </motion.p>

          <h1 className="text-display font-thin">
            O manguezal é um ativo climático.{" "}
            <span className="font-bold text-k-deep">Tratamos ele como tal.</span>
          </h1>

          <p className="measure mt-8 text-body text-k-ink-soft">
            A Karaguá Ecotech estrutura projetos de certificação de créditos de carbono azul em
            manguezais, integrando ciência aplicada, tecnologia de monitoramento e participação
            comunitária remunerada.
          </p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-4">
            <Button asChild size="lg">
              <a href="#empresas">Adquirir créditos de carbono</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#como-funciona">Como funciona</a>
            </Button>
          </motion.div>
        </div>

        {/* Stats — largura total da section */}
        <motion.div
          variants={fadeUp}
          className="mt-16 grid w-full grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4"
        >
          {stats.map((s) => (
            <div key={s.label} className="bg-k-elevated px-6 py-7 text-left">
              <p className="font-mono text-headline font-semibold text-k-deep leading-none">
                {s.value}
              </p>
              <p className="mt-3 text-sm leading-snug text-k-ink-soft">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
