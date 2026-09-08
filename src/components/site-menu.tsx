import { Equal, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { EASE_OUT_QUART } from "@/lib/motion";
import { startViewTransition } from "@/lib/view-transition";

const iconTransition = { duration: 0.25, ease: EASE_OUT_QUART } as const;

// Botão hamburguer + Sidebar, num só lugar. Antes SiteHeader e LoginPage
// tinham cada um sua própria cópia — já haviam divergido (só uma delas
// envolvia o toggle em startViewTransition, então a viewTransitionName
// "menu-toggle" da outra nunca disparava de verdade).
export function SiteMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AnimatePresence>{isOpen && <Sidebar onClose={() => setIsOpen(false)} />}</AnimatePresence>
      <motion.button
        type="button"
        onClick={() => startViewTransition(() => setIsOpen((v) => !v))}
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isOpen}
        className="relative bg-background cursor-pointer inline-flex size-10 rounded-full items-center justify-center border border-border shadow-md"
        style={{ viewTransitionName: "menu-toggle" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ opacity: 0, rotate: -90, scale: 0.85 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.85 }}
              transition={iconTransition}
              className="absolute inset-0 inline-flex items-center justify-center"
            >
              <X aria-hidden className="size-5" />
            </motion.span>
          ) : (
            <motion.span
              key="menu"
              initial={{ opacity: 0, rotate: 90, scale: 0.85 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.85 }}
              transition={iconTransition}
              className="absolute inset-0 inline-flex items-center justify-center"
            >
              <Equal aria-hidden className="size-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
