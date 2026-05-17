import { EASE_OUT_QUART } from "@/lib/motion";
import type { Variants } from "motion/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo } from "react";

const TITLE = "Karaguá";

const TOPO_SRC = `${import.meta.env.BASE_URL}topo.svg`.replace(/\/+/g, "/");

const LETTER_DELAY_BASE_S = 0.06;
const LETTER_STAGGER_S = 0.055;
const LETTER_REVEAL_DURATION_S = 2;

const TITLE_LEN = Array.from(TITLE).length;

/** Última letra termina em: delay + duração (alinhado com `titleLetterRevealForIndex`). */
export const LOADER_TEXT_PHASE_END_MS = Math.ceil(
  (LETTER_DELAY_BASE_S + Math.max(0, TITLE_LEN - 1) * LETTER_STAGGER_S + LETTER_REVEAL_DURATION_S) *
    1000,
);

/** Texto e topografia sobem juntos: o nevoeiro se dissipa dentro desta janela. */
const TEXT_PHASE_S = LOADER_TEXT_PHASE_END_MS / 1000;

/** Leitura do mapa antes de fechar o overlay. */
const LOADER_HOLD_AFTER_TOPO_S = 0.85;

/** Topo/nevoeiro são concorrentes ao texto, então o fecho = texto + pausa. */
export const LOADER_SESSION_TOTAL_MS =
  LOADER_TEXT_PHASE_END_MS + Math.round(LOADER_HOLD_AFTER_TOPO_S * 1000);

/** Nevoeiro: bolhas borradas na cor do fundo que encolhem revelando o topo. */
const FOG_COUNT = 16;

type FogBlob = {
  leftPct: number;
  topPct: number;
  size: number;
  blur: number;
  opacity: number;
  delay: number;
  duration: number;
};

function makeFog(): FogBlob[] {
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  return Array.from({ length: FOG_COUNT }, () => {
    const delay = rand(0, TEXT_PHASE_S * 0.22);
    const duration = Math.min(TEXT_PHASE_S - delay, rand(TEXT_PHASE_S * 0.5, TEXT_PHASE_S * 0.85));
    return {
      // Posições aleatórias (incluindo fora da borda) para cobrir tudo.
      leftPct: rand(-8, 92),
      topPct: rand(-8, 92),
      size: rand(220, 540),
      blur: rand(50, 120),
      opacity: rand(0.7, 1),
      delay,
      duration,
    };
  });
}

const titleLettersVariants: Variants = {
  hidden: {},
  visible: {},
};

function titleLetterRevealForIndex(index: number): Variants {
  return {
    hidden: {
      y: 100,
      opacity: 0,
      filter: "blur(10px)",
    },
    visible: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        duration: LETTER_REVEAL_DURATION_S,
        ease: EASE_OUT_QUART,
        delay: LETTER_DELAY_BASE_S + index * LETTER_STAGGER_S,
      },
    },
  };
}

export function Loader() {
  const titleChars = useMemo(() => Array.from(TITLE), []);
  const fog = useMemo(() => makeFog(), []);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, []);

  const topoTargetOpacity = reduceMotion ? 0.2 : 0.2;

  return (
    <motion.div
      className="dark fixed inset-0 z-[10001] flex flex-col items-center justify-center text-foreground"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
    >
      <div className="absolute inset-0 z-0 bg-primary" aria-hidden />

      {/* Topografia: surge junto com as letras (sem espera pós-texto). */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.05 }}
        animate={
          reduceMotion ? { opacity: topoTargetOpacity } : { opacity: topoTargetOpacity, scale: 1 }
        }
        transition={{
          duration: reduceMotion ? 0.4 : TEXT_PHASE_S,
          ease: EASE_OUT_QUART,
        }}
      >
        <img
          src={TOPO_SRC}
          alt=""
          width={1600}
          height={800}
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover object-center select-none opacity-90"
        />
      </motion.div>

      {/* Nevoeiro: bolhas bg-primary borradas que encolhem e somem. */}
      {!reduceMotion && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
          {fog.map((b, i) => (
            <motion.span
              key={`${i}`}
              className="absolute rounded-full bg-primary"
              style={{
                left: `${b.leftPct}%`,
                top: `${b.topPct}%`,
                width: b.size,
                height: b.size,
                filter: `blur(${b.blur}px)`,
              }}
              initial={{ scale: 1, opacity: b.opacity }}
              animate={{ scale: 0.12, opacity: 0 }}
              transition={{
                duration: b.duration,
                delay: b.delay,
                ease: EASE_OUT_QUART,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center gap-7">
        <span className="inline-flex flex-col items-center">
          <span className="sr-only">{TITLE}</span>
          <motion.span
            aria-hidden
            className="inline-flex"
            style={{ lineHeight: 1.2 }}
            variants={titleLettersVariants}
            initial="hidden"
            animate="visible"
          >
            {titleChars.map((char, index) => (
              <span
                key={`${index}`}
                className="inline-block text-background overflow-hidden align-baseline"
                style={{
                  paddingBottom: "0.1em",
                  lineHeight: 1.2, // Add more breathing room for descenders
                }}
              >
                <motion.span
                  className="text-[122px] inline-block font-medium"
                  style={{ lineHeight: 1.2 }} // Match or raise line height for the font
                  variants={titleLetterRevealForIndex(index)}
                >
                  {char}
                </motion.span>
              </span>
            ))}
          </motion.span>
        </span>
      </div>
    </motion.div>
  );
}
