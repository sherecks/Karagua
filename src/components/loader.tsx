import { EASE_OUT_QUART } from "@/lib/motion";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo } from "react";

const TOPO_SRC = `${import.meta.env.BASE_URL}topo.svg`.replace(/\/+/g, "/");

/** Paths da logo (logo-1.svg). 7 primeiros = símbolo (cattails + pernas); 8 restantes = letras de "karaguá". */
const LOGO_PATHS: string[] = [
  // símbolo
  "M85.3034 0C71.1291 9.8381 56.8786 55.5991 85.192 79.2126C112.424 53.7952 98.17 12.7877 85.3034 0Z",
  "M148.373 30.8102C131.742 29.2158 95.4261 53.2131 105.008 87.2762C140.518 85.6892 151.603 47.7577 148.373 30.8102Z",
  "M171.137 82.2657C155.003 74.561 109.689 85.3606 106.823 123.12C143.104 134.554 168.166 100.488 171.137 82.2657Z",
  "M0.00274644 81.0967C-0.32253 98.9725 28.2866 135.736 63.8384 122.694C59.207 84.9368 17.818 76.2477 0.00274644 81.0967Z",
  "M22.0321 30.2018C16.1507 45.8386 29.8328 87.1611 65.2161 86.8062C72.9563 52.1133 39.2351 31.5085 22.0321 30.2018Z",
  "M67.5886 155.881C62.4904 160.244 63.1879 160.332 61.9042 161.712C61.7395 161.889 61.4904 161.96 61.257 161.897C57.2379 160.811 47.8588 156.243 38.7008 145.595C38.2929 145.121 38.676 144.396 39.299 144.452C44.0516 144.882 51.9 145.279 55.2325 144.284C59.9469 142.876 63.4979 141.039 63.8653 140.672C64.2326 140.304 72.3755 135.835 75.9266 129.651C79.4776 123.468 80.0899 119.121 79.9062 111.284C79.7592 105.014 79.845 102.549 79.9062 102.1C80.2939 100.876 81.817 98.4559 85.0986 98.5538L85.1146 147.963C78.7282 147.963 73.0107 151.241 67.5886 155.881Z",
  "M102.606 155.881C107.705 160.244 107.007 160.332 108.291 161.712C108.456 161.889 108.705 161.96 108.938 161.897C112.957 160.811 122.336 156.243 131.494 145.595C131.902 145.121 131.519 144.396 130.896 144.452C126.143 144.882 118.295 145.279 114.962 144.284C110.248 142.876 106.697 141.039 106.33 140.672C105.962 140.304 97.8195 135.835 94.2685 129.651C90.7174 123.468 90.1052 119.121 90.2888 111.284C90.4358 105.014 90.3501 102.549 90.2888 102.1C89.9011 100.876 88.3781 98.4559 85.0964 98.5538L85.0804 147.963C91.4668 147.963 97.1843 151.241 102.606 155.881Z",
  // wordmark "karaguá"
  "M256.414 121.842H243.841L229.732 100.538L222.188 108.781V121.842H211.99V72.2497H222.188V95.8586L242.374 72.2497H255.646L236.786 92.8551L256.414 121.842Z",
  "M285.845 85.2416H294.996V121.842H285.845V117.372C283.424 120.911 279.559 122.68 274.25 122.68C269.082 122.68 264.984 120.864 261.957 117.232C258.93 113.6 257.417 109.037 257.417 103.542C257.417 98.0472 258.93 93.4837 261.957 89.8516C264.984 86.2195 269.082 84.4034 274.25 84.4034C279.559 84.4034 283.424 86.1729 285.845 89.7119V85.2416ZM282.842 111.016C284.518 109.06 285.356 106.569 285.356 103.542C285.356 100.515 284.518 98.0239 282.842 96.0681C281.212 94.1124 279.047 93.1345 276.346 93.1345C273.645 93.1345 271.457 94.1124 269.78 96.0681C268.15 98.0239 267.335 100.515 267.335 103.542C267.335 106.569 268.15 109.06 269.78 111.016C271.457 112.972 273.645 113.949 276.346 113.949C279.047 113.949 281.212 112.972 282.842 111.016Z",
  "M324.735 84.9622V94.2521C324.036 94.1124 323.384 94.0425 322.779 94.0425C319.845 94.0425 317.633 94.8108 316.143 96.3475C314.7 97.8842 313.978 100.306 313.978 103.612V121.842H304.06V85.2416H313.21V89.9913C315.305 86.592 318.751 84.8923 323.547 84.8923L324.735 84.9622Z",
  "M354.671 85.2416H363.821V121.842H354.671V117.372C352.25 120.911 348.385 122.68 343.076 122.68C337.907 122.68 333.809 120.864 330.783 117.232C327.756 113.6 326.242 109.037 326.242 103.542C326.242 98.0472 327.756 93.4837 330.783 89.8516C333.809 86.2195 337.907 84.4034 343.076 84.4034C348.385 84.4034 352.25 86.1729 354.671 89.7119V85.2416ZM351.667 111.016C353.344 109.06 354.182 106.569 354.182 103.542C354.182 100.515 353.344 98.0239 351.667 96.0681C350.038 94.1124 347.872 93.1345 345.171 93.1345C342.471 93.1345 340.282 94.1124 338.606 96.0681C336.976 98.0239 336.161 100.515 336.161 103.542C336.161 106.569 336.976 109.06 338.606 111.016C340.282 112.972 342.471 113.949 345.171 113.949C347.872 113.949 350.038 112.972 351.667 111.016Z",
  "M398.729 89.7119V85.2416H407.879V120.445C407.879 125.335 406.296 129.339 403.13 132.459C399.963 135.579 395.656 137.139 390.208 137.139C385.039 137.139 381.011 135.766 378.124 133.018C375.283 130.271 373.7 127.197 373.374 123.798H383.293C383.944 127.011 386.296 128.618 390.347 128.618C392.815 128.618 394.701 127.989 396.005 126.732C397.309 125.474 397.961 123.728 397.961 121.493V116.394C395.586 119.561 392.024 121.144 387.274 121.144C382.291 121.144 378.263 119.398 375.19 115.905C372.117 112.366 370.58 107.989 370.58 102.774C370.58 97.5582 372.117 93.2043 375.19 89.7119C378.263 86.1729 382.291 84.4034 387.274 84.4034C392.489 84.4034 396.308 86.1729 398.729 89.7119ZM395.795 109.758C397.425 107.989 398.24 105.661 398.24 102.774C398.24 99.8865 397.425 97.5582 395.795 95.7887C394.166 94.0192 392.024 93.1345 389.369 93.1345C386.715 93.1345 384.573 94.0192 382.943 95.7887C381.313 97.5582 380.499 99.8865 380.499 102.774C380.499 105.661 381.313 107.989 382.943 109.758C384.573 111.528 386.715 112.413 389.369 112.413C392.024 112.413 394.166 111.528 395.795 109.758Z",
  "M445.317 118.769C442.523 121.377 438.378 122.68 432.883 122.68C427.389 122.68 423.244 121.377 420.45 118.769C417.656 116.161 416.259 111.97 416.259 106.196V85.2416H426.178V106.336C426.178 111.318 428.413 113.81 432.883 113.81C437.354 113.81 439.589 111.318 439.589 106.336V85.2416H449.508V106.196C449.508 111.97 448.111 116.161 445.317 118.769Z",
  "M484.341 85.2416H493.491V121.842H484.341V117.372C481.92 120.911 478.055 122.68 472.746 122.68C467.578 122.68 463.48 120.864 460.453 117.232C457.426 113.6 455.913 109.037 455.913 103.542C455.913 98.0472 457.426 93.4837 460.453 89.8516C463.48 86.2195 467.578 84.4034 472.746 84.4034C478.055 84.4034 481.92 86.1729 484.341 89.7119V85.2416ZM481.338 111.016C483.014 109.06 483.852 106.569 483.852 103.542C483.852 100.515 483.014 98.0239 481.338 96.0681C479.708 94.1124 477.543 93.1345 474.842 93.1345C472.141 93.1345 469.952 94.1124 468.276 96.0681C466.646 98.0239 465.831 100.515 465.831 103.542C465.831 106.569 466.646 109.06 468.276 111.016C469.952 112.972 472.141 113.949 474.842 113.949C477.543 113.949 479.708 112.972 481.338 111.016ZM476.257 69.7132H484.341L477.451 80.7956H469.669L476.257 69.7132Z",
];

const PATH_COUNT = LOGO_PATHS.length;
const SYMBOL_PATHS_COUNT = 7;

const PATH_DRAW_DURATION_S = 1.4;
const PATH_STAGGER_S = 0.06;
const FILL_DURATION_S = 0.5;
const FILL_OFFSET_S = 0.45;

/** Última animação termina em: stagger total + max(draw, offset+fill). */
const LAST_PATH_DELAY_S = (PATH_COUNT - 1) * PATH_STAGGER_S;
const LAST_PATH_END_S =
  LAST_PATH_DELAY_S + Math.max(PATH_DRAW_DURATION_S, FILL_OFFSET_S + FILL_DURATION_S);

export const LOADER_TEXT_PHASE_END_MS = Math.ceil(LAST_PATH_END_S * 1000);

const TEXT_PHASE_S = LOADER_TEXT_PHASE_END_MS / 1000;

/** Leitura do mapa antes de fechar o overlay. */
const LOADER_HOLD_AFTER_TOPO_S = 0.85;

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

export function Loader() {
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

  const topoTargetOpacity = 0.2;

  return (
    <motion.div
      className="dark fixed inset-0 z-[10001] flex flex-col items-center justify-center text-foreground"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: EASE_OUT_QUART }}
    >
      <motion.div
        className="absolute inset-0 z-0 bg-primary"
        aria-hidden
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
      />

      {/* Topografia: surge junto com as letras. */}
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

      {/* Nevoeiro */}
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

      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        exit={
          reduceMotion
            ? { opacity: 0 }
            : {
                opacity: 0,
                scale: 0.12,
                x: "calc(-50vw + 80px)",
                y: "calc(-50vh + 36px)",
              }
        }
        transition={{ duration: 0.7, ease: EASE_OUT_QUART }}
      >
        <span className="sr-only">Karaguá</span>
        <motion.svg
          aria-hidden
          viewBox="0 0 494 162"
          className="w-[min(72vw,560px)] h-auto"
          fill="none"
        >
          {LOGO_PATHS.map((d, i) => {
            const isSymbol = i < SYMBOL_PATHS_COUNT;
            const delay = i * PATH_STAGGER_S;
            return (
              <motion.path
                key={i}
                d={d}
                stroke="var(--background)"
                strokeWidth={isSymbol ? 0.8 : 0.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="var(--background)"
                initial={
                  reduceMotion
                    ? { pathLength: 1, fillOpacity: 1, opacity: 1 }
                    : { pathLength: 0, fillOpacity: 0, opacity: 1 }
                }
                animate={{ pathLength: 1, fillOpacity: 1 }}
                transition={{
                  pathLength: {
                    duration: reduceMotion ? 0 : PATH_DRAW_DURATION_S,
                    ease: EASE_OUT_QUART,
                    delay: reduceMotion ? 0 : delay,
                  },
                  fillOpacity: {
                    duration: reduceMotion ? 0 : FILL_DURATION_S,
                    ease: EASE_OUT_QUART,
                    delay: reduceMotion ? 0 : delay + FILL_OFFSET_S,
                  },
                }}
              />
            );
          })}
        </motion.svg>
      </motion.div>
    </motion.div>
  );
}
