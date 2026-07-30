import { EASE_OUT_QUART } from "@/lib/motion";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";

const VIDEO_SRC = `${import.meta.env.BASE_URL}images/mangue4k.mp4`.replace(/\/+/g, "/");
const POSTER_SRC = `${import.meta.env.BASE_URL}images/mangue-poster.jpg`.replace(/\/+/g, "/");

/**
 * Headline editorial: 4 linhas com corpos e pesos contrastantes (Thin ↔ Bold,
 * DS: duas famílias, hierarquia = peso), cada uma subindo do próprio clip com
 * um pequeno atraso incremental. Os clamps mantêm a hierarquia no mobile.
 * Cores claras (texto sobre o vídeo/scrim escuro, convenção de superfície
 * escura do DS): k-bright só entra no destaque final, como nas demais seções
 * dark do site.
 */
const rise = {
  hidden: { y: "110%" },
  visible: (i: number) => ({
    y: "0%",
    transition: { duration: 0.65, ease: EASE_OUT_QUART, delay: 0.1 + i * 0.09 },
  }),
};

const LINES = [
  {
    text: "Transformamos o",
    className: "text-[clamp(1.375rem,2vw,2rem)] leading-[1.05] font-thin text-white/70",
    wrapClassName: "",
  },
  {
    text: "manguezal",
    // pb no span interno: com leading 0.9 a caixa é menor que o glifo e o
    // overflow-hidden do wrapper decepava o descendente do "g"; o -mb do
    // wrapper devolve a altura extra ao layout (ritmo entre linhas intacto).
    className:
      "text-[clamp(4rem,7.6vw,7.5rem)] leading-[0.9] font-bold -tracking-[0.03em] pb-[0.15em] text-white",
    // -mt compensa o ar interno da fonte acima das minúsculas (cresce com o corpo).
    // O text-[...] repete o corpo do filho para o -mb em `em` compensar o pb na
    // mesma escala (senão resolveria contra o font-size herdado de ~16px).
    // -mb devolve só parte do pb: sobra ~0.09em de respiro entre a perna do "g"
    // e a linha de baixo.
    wrapClassName: "-mt-2 -mb-[0.06em] text-[clamp(4rem,7.6vw,7.5rem)] md:-mt-3 lg:-mt-4",
  },
  {
    text: "em ativo climático",
    className:
      "text-[clamp(2.2rem,4.2vw,4.25rem)] leading-[1.05] font-thin -tracking-[0.02em] text-white/90",
    wrapClassName: "",
  },
  {
    text: "com tecnologia e comunidade.",
    // Mesmo ajuste da linha "manguezal": pb dá respiro à perna do "g" de
    // "tecnologia" (overflow-hidden do wrapper cortava), -mb devolve quase
    // tudo (mantém o espaçamento visual entre as linhas).
    className:
      "text-[clamp(1.65rem,2.8vw,2.875rem)] leading-[1.1] font-bold text-k-bright pb-[0.12em]",
    wrapClassName: "-mb-[0.04em] text-[clamp(1.65rem,2.8vw,2.875rem)]",
  },
];

export function HeroV3() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Sob reduced-motion, mostra só o poster (frame estático): sem autoplay,
    // sem loop de vídeo em segundo plano (Spec/02 + WCAG 2.2.2).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.muted = true; // garante a propriedade (não só o atributo) antes do play, exigido por autoplay policies
    void video.play().catch(() => {});
  }, []);

  return (
    <section id="topo" className="relative flex min-h-screen w-full items-center overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={VIDEO_SRC}
        poster={POSTER_SRC}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
      />
      {/* Scrim: escuro à esquerda (onde o texto fica) e some pra direita —
          garante contraste do texto claro sobre qualquer trecho do vídeo. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10"
      />

      <div className="relative z-10 w-full px-4 py-24 md:px-10 md:py-28 lg:px-16">
        <div className="mx-auto w-full max-w-[60rem] lg:mx-0">
          <h1 className="flex flex-col gap-1 md:gap-2">
            {LINES.map((l, i) => (
              <span key={l.text} className={`block overflow-hidden ${l.wrapClassName}`}>
                <motion.span
                  custom={i}
                  variants={rise}
                  initial="hidden"
                  animate="visible"
                  className={`block ${l.className}`}
                >
                  {l.text}
                </motion.span>
              </span>
            ))}
          </h1>
        </div>
      </div>
    </section>
  );
}
