import { cn } from "@/lib/utils";
import { EASE_OUT_QUART } from "@/lib/motion";
import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type Source = {
  label: string;
  url?: string;
};

type DataPointProps = {
  /** Valor numérico final, usado para o count-up. Se omitido (ex.: "5×", "50–66%"), exibe `display` sem contar. */
  value?: number;
  /** Texto exibido no slot do número. Default = formatted `value`. Ex.: "5×", "50–66%", "365". */
  display: string;
  /** Sufixo opcional renderizado pequeno após o número (ex.: "%"). Só usado quando há `value`. */
  suffix?: string;
  /** Fontes citáveis do dado (não exibidas na UI, mantidas para referência). */
  sources: Source[];
  /** Texto curto descrevendo o que o número significa, para o atributo aria-label. */
  ariaLabel: string;
  /** Classes para o slot do número. */
  className?: string;
  /** Override do tamanho do número (ex.: big number impactante). Vence `size` via twMerge. */
  numberClassName?: string;
  /** Tamanho tipográfico. Default 'display'. */
  size?: "display" | "headline";
  /** Duração do count-up em ms. Default 1400. */
  countDurationMs?: number;
};

function formatNumber(n: number, display: string): string {
  // Preserva separadores/decimais ausentes em `display` (ex.: "1.250" em pt-BR).
  // Estratégia: formata com Intl pt-BR.
  if (!Number.isFinite(n)) return display;
  return Math.round(n).toLocaleString("pt-BR");
}

/**
 * Materializa o princípio "cada número tem uma fonte". Conta de 0 ao valor
 * ao entrar no viewport.
 */
export function DataPoint({
  value,
  display,
  suffix,
  ariaLabel,
  className,
  numberClassName,
  size = "display",
  countDurationMs = 1400,
}: DataPointProps) {
  const sizeClass = size === "headline" ? "text-headline" : "text-display";
  const suffixSizeClass = size === "headline" ? "text-title" : "text-headline";
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  const [text, setText] = useState<string>(
    value != null && !reduceMotion ? formatNumber(0, display) : display,
  );

  useEffect(() => {
    if (value == null) return;
    if (!inView) return;
    if (reduceMotion) {
      setText(display);
      return;
    }
    const controls = animate(0, value, {
      duration: countDurationMs / 1000,
      ease: EASE_OUT_QUART,
      onUpdate: (latest) => setText(formatNumber(latest, display)),
      onComplete: () => setText(display),
    });
    return () => controls.stop();
  }, [inView, value, display, reduceMotion, countDurationMs]);

  return (
    <span
      ref={ref}
      aria-label={ariaLabel}
      className={cn("inline-flex w-fit items-baseline gap-1", className)}
    >
      <span className={cn("font-mono text-k-deep tabular-nums", sizeClass, numberClassName)}>
        {text}
      </span>
      {suffix ? (
        <span className={cn("font-mono text-k-deep", suffixSizeClass)}>{suffix}</span>
      ) : null}
    </span>
  );
}
