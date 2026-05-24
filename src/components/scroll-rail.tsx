import { useEffect, useMemo, useState } from "react";
import { NAV_SECTIONS as SECTIONS } from "@/lib/sections";

function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

/**
 * Discrete vertical rail showing scroll progress + per-section ticks.
 * Right-edge, 2px wide, k-deep fill. Click-jump on ticks. Hidden on mobile
 * (rail real estate too small to be useful below ~lg).
 */
export function ScrollRail() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0]!.id);
  const [tickOffsets, setTickOffsets] = useState<number[]>([]);

  // Compute each section's vertical position as % of total document.
  useEffect(() => {
    function measure() {
      const docHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight <= 0) {
        setTickOffsets(SECTIONS.map((_, i) => i / Math.max(1, SECTIONS.length - 1)));
        return;
      }
      const offsets = SECTIONS.map(({ id }) => {
        const el = document.getElementById(id);
        if (!el) return 0;
        const top = el.getBoundingClientRect().top + window.scrollY;
        return Math.min(1, Math.max(0, top / docHeight));
      });
      setTickOffsets(offsets);
    }
    measure();
    window.addEventListener("resize", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, []);

  // Active section: pick the last section whose top is above viewport midline.
  useEffect(() => {
    function onScroll() {
      const mid = window.scrollY + window.innerHeight * 0.4;
      let current = SECTIONS[0]!.id;
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= mid) current = id;
      }
      setActiveId(current);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const ticks = useMemo(
    () =>
      SECTIONS.map((s, i) => ({
        ...s,
        topPct: (tickOffsets[i] ?? 0) * 100,
      })),
    [tickOffsets],
  );

  return (
    <div className="pointer-events-none fixed top-1/2 right-3 z-50 hidden h-[200px] w-3 -translate-y-1/2 lg:block">
      <div className="relative mx-auto h-full w-px">
        {ticks.map((t) => {
          const isActive = t.id === activeId;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => smoothScrollTo(t.id)}
              aria-label={`Ir para ${t.label}`}
              className="pointer-events-auto group absolute -left-1.5 flex h-3 w-3 -translate-y-1/2 items-center justify-center"
              style={{ top: `${t.topPct}%` }}
            >
              <span
                className={`block h-1.5 w-1.5 rounded-full transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  isActive
                    ? "scale-200 bg-k-deep"
                    : "scale-100 bg-k-ink-soft/40 group-hover:scale-125 group-hover:bg-k-deep"
                }`}
              />
              <span
                className={`pointer-events-none absolute right-5 origin-right whitespace-nowrap text-label opacity-0 transition-opacity duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:opacity-100 group-focus-visible:opacity-100 ${
                  isActive ? "text-k-deep" : "text-k-ink"
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
