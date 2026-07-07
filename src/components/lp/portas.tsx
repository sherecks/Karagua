import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Section, SectionHeader } from "@/components/lp/section";
import { fadeUp, reveal, stagger } from "@/lib/motion";

// Audiências com rótulos declarativos (sem perguntas). Hairline + hover tonal.
const portas = [
  {
    n: "01",
    label: "Investimento",
    title: "Para investidores",
    desc: "Acesso antecipado a um projeto de carbono azul de alta integridade em estruturação.",
    href: "#contato",
  },
  {
    n: "02",
    label: "Poder público",
    title: "Para o poder público",
    desc: "Partilha de receita e conservação com base em marco legal estadual.",
    href: "#contato",
  },
  {
    n: "03",
    label: "Projetos",
    title: "Para desenvolvedores",
    desc: "Parceria técnica em metodologias Verra de carbono azul e monitoramento.",
    href: "#contato",
  },
];

const SEG = 1 / portas.length;

/**
 * Versão fixada (desktop): seção alta + inner sticky + contador de capítulo
 * (referência BASIC/DEPT: case studies fixados com índice 00/05). O painel
 * ativo é dirigido por estado (derivado do scroll) e o crossfade é CSS puro —
 * sem MotionValue ligado a style, robusto e leve.
 */
function PortasPinned() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const i = Math.min(portas.length - 1, Math.max(0, Math.floor(p / SEG + 0.0001)));
    if (i !== active) setActive(i);
  });

  return (
    <div ref={ref} className="relative bg-background" style={{ height: `${portas.length * 100}vh` }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[120rem] grid-cols-[1fr_1.2fr] items-center gap-16 px-6 md:px-10 lg:px-16">
          {/* Coluna-índice: eyebrow + título + contador + capítulos */}
          <div className="flex flex-col">
            <p className="text-label font-semibold tracking-[0.12em] text-k-ink-soft uppercase">
              Como engajar
            </p>
            <h2 className="mt-4 text-headline font-bold text-foreground">Por onde começar.</h2>

            <div className="mt-12 flex items-baseline gap-3 font-mono text-k-deep">
              <span className="text-[clamp(3rem,7vw,6rem)] leading-none font-semibold tabular-nums transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]">
                {portas[active]!.n}
              </span>
              <span className="text-title text-k-ink-soft">/ 0{portas.length}</span>
            </div>

            <ul className="mt-10 flex flex-col gap-3">
              {portas.map((p, i) => (
                <li
                  key={p.label}
                  className={`text-title font-medium transition-colors duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                    i === active ? "text-k-ink" : "text-k-ink-soft/35"
                  }`}
                >
                  {p.title}
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna-palco: painéis empilhados em crossfade dirigido por `active` */}
          <div className="relative h-[60vh] min-h-[20rem]">
            {portas.map((p, i) => (
              <a
                key={p.label}
                href={p.href}
                data-cursor-label="abrir"
                aria-hidden={i !== active}
                tabIndex={i === active ? 0 : -1}
                className={`group absolute inset-0 flex flex-col justify-center gap-6 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  i === active
                    ? "translate-y-0 opacity-100"
                    : i < active
                      ? "pointer-events-none -translate-y-4 opacity-0"
                      : "pointer-events-none translate-y-4 opacity-0"
                }`}
              >
                <span className="font-mono text-data text-k-deep">
                  {p.n} · {p.label}
                </span>
                <h3 className="max-w-[16ch] text-[clamp(2rem,4vw,3.5rem)] leading-[1.02] font-semibold text-k-ink">
                  {p.title}
                </h3>
                <p className="measure text-title text-k-ink-soft">{p.desc}</p>
                <span className="mt-2 inline-flex items-center gap-2 font-mono text-data text-k-deep">
                  Acessar
                  <ArrowRight className="size-4 transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:translate-x-1" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Fallback (mobile / reduced-motion): o grid declarativo de 3 cards. */
function PortasGrid() {
  return (
    <Section id="portas" surface="shell" theme="light">
      <SectionHeader eyebrow="Como engajar" title="Por onde começar." />

      <motion.div
        {...reveal}
        variants={stagger}
        className="mt-10 grid gap-5 md:mt-20 md:grid-cols-3 md:gap-6"
      >
        {portas.map((p) => (
          <motion.a
            key={p.label}
            variants={fadeUp}
            href={p.href}
            data-cursor-label="abrir"
            className="group flex flex-col gap-4 bg-k-elevated p-6 transition-colors duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:bg-k-fog md:p-8"
          >
            <span className="font-mono text-data text-k-deep">
              {p.n} · {p.label}
            </span>
            <h3 className="text-title font-semibold text-k-ink">{p.title}</h3>
            <p className="text-body text-k-ink-soft">{p.desc}</p>
            <span className="mt-auto inline-flex items-center gap-2 pt-4 font-mono text-data text-k-deep">
              Acessar
              <ArrowRight className="size-4 transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:translate-x-1" />
            </span>
          </motion.a>
        ))}
      </motion.div>
    </Section>
  );
}

/**
 * Portas — caminhos de engajamento. No desktop entra em pin com contador de
 * capítulo; abaixo de lg ou sob reduced-motion cai no grid declarativo. O pin
 * só liga após medir o viewport no cliente (primeiro paint estável + base
 * segura no grid).
 */
export function Portas() {
  const reduce = useReducedMotion();
  const [pin, setPin] = useState(false);

  useEffect(() => {
    if (reduce) {
      setPin(false);
      return;
    }
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setPin(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [reduce]);

  if (!pin) return <PortasGrid />;
  return (
    <section id="portas">
      <PortasPinned />
    </section>
  );
}
