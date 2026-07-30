import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge não conhece a escala de tipo do DS (`--text-display`,
 * `--text-headline`, ...), então classificava `text-headline` como cor e a
 * descartava quando vinha junto de `text-foreground`/`text-k-ink-soft` — o
 * título caía para o tamanho herdado (17px). Registrar o grupo font-size com
 * os tokens do tema faz o conflito ser resolvido no grupo certo.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "headline", "title", "body", "label", "data"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
