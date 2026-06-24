import { Equal, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/sidebar";
import { EASE_OUT_QUART } from "@/lib/motion";
import { startViewTransition } from "@/lib/view-transition";

const iconTransition = { duration: 0.25, ease: EASE_OUT_QUART } as const;

/** Header padrão do site: logo + toggle do menu (Sidebar). Usado na home e em
 * páginas internas — na home o logo rola para o topo, fora dela navega para "/". */
export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === "/" || pathname === "/v2";

  return (
    <>
      <AnimatePresence>{isOpen && <Sidebar onClose={() => setIsOpen(false)} />}</AnimatePresence>

      <nav
        aria-label="Navegação principal"
        className="flex mx-auto flex-row items-center px-4 py-4 justify-between sticky w-full z-100 md:px-8"
      >
        {isHome ? (
          <a href="#topo" style={{ viewTransitionName: "brand-mark" }}>
            <img src="/logo-1.svg" alt="Karaguá" className="w-auto h-12" />
          </a>
        ) : (
          <Link to="/" style={{ viewTransitionName: "brand-mark" }}>
            <img src="/logo-1.svg" alt="Karaguá" className="w-auto h-12" />
          </Link>
        )}

        <div className="flex items-center gap-4">
          <motion.button
            type="button"
            onClick={() => startViewTransition(() => setIsOpen((v) => !v))}
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isOpen}
            className="relative bg-background cursor-pointer inline-flex size-10 rounded-full items-center justify-center"
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
        </div>
      </nav>
    </>
  );
}
