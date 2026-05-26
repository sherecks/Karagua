import { cn } from "@/lib/utils";
import { EASE_OUT_QUART } from "@/lib/motion";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
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
  /** Fontes citáveis exibidas no popover. Pelo menos uma. */
  sources: Source[];
  /** Texto curto descrevendo o que o número significa, para o aria-label do trigger. */
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
 * ao entrar no viewport e abre um popover com a citação ao hover/focus.
 */
export function DataPoint({
  value,
  display,
  suffix,
  sources,
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
  const [open, setOpen] = useState(false);
  const hoverTimer = useRef<number | null>(null);

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

  function handleEnter() {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    setOpen(true);
  }
  function handleLeave() {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setOpen(false), 120);
  }

  return (
    <span ref={ref} className="relative inline-flex flex-col">
      <button
        type="button"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
        aria-label={`${ariaLabel} — ver fontes`}
        aria-expanded={open}
        className={cn(
          "group/dp relative inline-flex w-fit cursor-help items-baseline gap-1 rounded-sm text-left",
          "after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:scale-x-0 after:bg-current after:opacity-30 after:transition-transform after:duration-200 after:ease-[cubic-bezier(0.25,1,0.5,1)] after:content-['']",
          "hover:after:scale-x-100 focus-visible:after:scale-x-100",
          className,
        )}
      >
        <span className={cn("font-mono text-k-deep tabular-nums", sizeClass, numberClassName)}>
          {text}
        </span>
        {suffix ? (
          <span className={cn("font-mono text-k-deep", suffixSizeClass)}>{suffix}</span>
        ) : null}
      </button>

      <motion.span
        role="tooltip"
        aria-hidden={!open}
        initial={false}
        animate={{
          opacity: open ? 1 : 0,
          y: open ? 0 : -4,
          pointerEvents: open ? "auto" : "none",
        }}
        transition={{ duration: 0.18, ease: EASE_OUT_QUART }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className="absolute top-full left-0 z-30 mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-md border border-border bg-k-elevated p-3 text-left shadow-[0_8px_24px_-12px_rgb(26_35_50/0.18)]"
      >
        <span className="block text-label text-k-ink-soft">Fonte</span>
        <ul className="mt-2 space-y-1.5">
          {sources.map((s, i) => (
            <li key={i} className="text-sm leading-snug text-k-ink">
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline decoration-k-deep/40 decoration-1 underline-offset-2 hover:decoration-k-deep"
                >
                  {s.label}
                </a>
              ) : (
                <span>{s.label}</span>
              )}
            </li>
          ))}
        </ul>
      </motion.span>
    </span>
  );
}
