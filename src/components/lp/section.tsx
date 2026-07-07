import { motion } from "motion/react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fadeUp, maskRise, reveal, stagger } from "@/lib/motion";

type Surface = "shell" | "fog" | "elevated" | "carbon" | "primary" | "inherit";

const surfaceClass: Record<Surface, string> = {
  // DS: depth is tonal, not shadow, and not borders. Separation is the surface
  // change itself: shell -> fog -> elevated -> carbon. No divider lines.
  shell: "bg-background",
  fog: "bg-k-fog",
  elevated: "bg-k-elevated",
  // Carbon inverts the whole shadcn semantic layer via `.dark`.
  carbon: "dark bg-background text-foreground",
  // Primary: fundo da cor primary + texto branco (ver .surface-primary no CSS).
  primary: "surface-primary",
  // Inherit: transparente; a cor é do wrapper `.theme-surface` (Spec/02 §7).
  // Use com a prop `theme` para a seção participar da inversão por scroll.
  inherit: "bg-transparent",
};

/**
 * Section primitive. Default `fullHeight` makes each section take the full
 * viewport. O scroll-fade global (opacity/y por progresso) foi REVOGADO pela
 * emenda Spec/02 §7.6: brigava com a transição de superfície entre seções e
 * nunca constou em spec.
 */
export function Section({
  id,
  surface = "shell",
  theme,
  className,
  fullHeight = true,
  children,
}: {
  id?: string;
  surface?: Surface;
  /** Tema que a seção impõe ao wrapper quando cruza a linha central (Spec/02 §7). */
  theme?: "light" | "dark";
  className?: string;
  fullHeight?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-section-theme={theme}
      className={cn(
        surfaceClass[surface],
        fullHeight ? "flex min-h-screen flex-col justify-center py-24 md:py-28" : "py-24 md:py-28",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-[120rem] px-6 md:px-10 lg:px-16">{children}</div>
    </section>
  );
}

/**
 * Eyebrow (text-label, uppercase) + headline (text-headline, Bold).
 * Hierarchy is weight contrast, never a third family. Eyebrow accent is
 * k-ink-soft on light surfaces, k-bright on carbon.
 */
export function SectionHeader({
  eyebrow,
  title,
  children,
  className,
  tone = "token",
  size = "headline",
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
  /** "inherit": cores via currentColor, para seções `surface="inherit"` que
   *  invertem com o wrapper (o texto anima junto com a transição de tema). */
  tone?: "token" | "inherit";
  /** "display": manchete grande (escala display), alinha com Hero/CTA. */
  size?: "headline" | "display";
}) {
  const inherit = tone === "inherit";
  const titleSize =
    size === "display"
      ? "text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.0] -tracking-[0.02em] font-thin"
      : "text-headline font-bold";
  return (
    <motion.div {...reveal} variants={stagger} className={cn("max-w-3xl", className)}>
      <motion.p
        variants={fadeUp}
        className={cn(
          "text-label font-semibold tracking-[0.12em] uppercase",
          inherit ? "text-current/70" : "text-k-ink-soft dark:text-k-bright",
        )}
      >
        {eyebrow}
      </motion.p>
      <h2
        className={cn(
          "mt-4 overflow-hidden",
          titleSize,
          inherit ? "" : "text-foreground",
        )}
      >
        <motion.span variants={maskRise} className="block">
          {title}
        </motion.span>
      </h2>
      {children ? (
        <motion.div
          variants={fadeUp}
          className={cn(
            "measure mt-6 text-body",
            inherit ? "text-current/70" : "text-k-ink-soft dark:text-foreground/75",
          )}
        >
          {children}
        </motion.div>
      ) : null}
    </motion.div>
  );
}
