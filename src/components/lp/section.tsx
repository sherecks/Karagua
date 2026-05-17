import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fadeUp, maskRise, reveal, stagger } from "@/lib/motion";

type Surface = "shell" | "fog" | "elevated" | "carbon";

const surfaceClass: Record<Surface, string> = {
  // DS: depth is tonal, not shadow. Step shell -> fog -> elevated -> carbon.
  shell: "bg-background",
  fog: "bg-k-fog border-y border-border",
  elevated: "bg-k-elevated border-y border-border",
  // Carbon inverts the whole shadcn semantic layer via `.dark`.
  carbon: "dark bg-background text-foreground border-y border-border",
};

export function Section({
  id,
  surface = "shell",
  className,
  children,
}: {
  id?: string;
  surface?: Surface;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn(surfaceClass[surface], "py-24 md:py-28", className)}>
      <div className="mx-auto max-w-6xl px-6">{children}</div>
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
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div {...reveal} variants={stagger} className={cn("max-w-3xl", className)}>
      <motion.p
        variants={fadeUp}
        className="text-label font-semibold tracking-[0.12em] text-k-ink-soft uppercase dark:text-k-bright"
      >
        {eyebrow}
      </motion.p>
      <h2 className="mt-4 overflow-hidden text-headline font-bold text-foreground">
        <motion.span variants={maskRise} className="block">
          {title}
        </motion.span>
      </h2>
      {children ? (
        <motion.div
          variants={fadeUp}
          className="measure mt-6 text-body text-k-ink-soft dark:text-foreground/75"
        >
          {children}
        </motion.div>
      ) : null}
    </motion.div>
  );
}
