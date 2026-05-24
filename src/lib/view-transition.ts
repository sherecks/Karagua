/**
 * Thin wrapper para document.startViewTransition. Faz fallback gracioso em
 * navegadores que ainda não suportam (Firefox, Safari < 18.2): apenas executa
 * o callback sem animar. Sempre respeita `prefers-reduced-motion`.
 */
type StartViewTransition = (cb: () => void | Promise<void>) => {
  finished: Promise<void>;
};

export function startViewTransition(update: () => void | Promise<void>): void {
  if (typeof document === "undefined") {
    void update();
    return;
  }
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const doc = document as Document & { startViewTransition?: StartViewTransition };

  if (reduce || typeof doc.startViewTransition !== "function") {
    void update();
    return;
  }
  doc.startViewTransition(() => update());
}
