import type { Variants } from "motion/react";

/**
 * Karaguá motion primitives.
 * Princípio: motion sutil e com leveza. Anima só transform/opacity, ease-out
 * (sem bounce/spring), e nada de cascata disparando no instante em que o
 * elemento toca a borda inferior. Reduced motion é honrado globalmente via
 * <MotionConfig reducedMotion="user">.
 */
export const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const;
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Entrada de bloco: deslocamento pequeno (sutil) e duração gentil (leveza). */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT_QUART },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.45, ease: EASE_OUT_QUART },
  },
};

/**
 * Orquestra filhos com respiro: um pequeno delay antes do primeiro e um
 * espaçamento maior entre eles, para a seção entrar em sequência calma em vez
 * de tudo de uma vez.
 */
export const stagger: Variants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.12, staggerChildren: 0.12 } },
};

/** Inner element of a MaskReveal: rises from behind an overflow-hidden clip. */
export const maskRise: Variants = {
  hidden: { y: "110%" },
  visible: {
    y: "0%",
    transition: { duration: 0.6, ease: EASE_OUT_QUART },
  },
};

/**
 * Reveal-on-scroll calmo. A `margin` negativa na base do viewport puxa a linha
 * de disparo para cima: o reveal só acontece quando o elemento já está
 * confortavelmente em tela (não na borda inferior), o que evita a sensação de
 * ansiedade. `once` garante que não re-anima ao voltar.
 */
export const reveal = {
  initial: "hidden",
  whileInView: "visible",
  viewport: { once: true, amount: 0.35, margin: "0px 0px -18% 0px" },
} as const;
