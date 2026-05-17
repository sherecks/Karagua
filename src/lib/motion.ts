import type { Variants } from "motion/react";

/**
 * Karaguá motion primitives.
 * ease-out-quart, 150–300ms, transform/opacity only. No bounce/spring.
 * Reduced motion is honored globally via <MotionConfig reducedMotion="user">.
 */
const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_OUT_QUART },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: EASE_OUT_QUART },
  },
};

export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/** Reveal-on-scroll defaults, applied once when 30% in view. */
export const reveal = {
  initial: "hidden",
  whileInView: "visible",
  viewport: { once: true, amount: 0.3 },
} as const;
