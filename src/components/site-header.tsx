import { Equal, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/sidebar";
import { EASE_OUT_QUART } from "@/lib/motion";
import { startViewTransition } from "@/lib/view-transition";

const iconTransition = { duration: 0.25, ease: EASE_OUT_QUART } as const;

/** Header padrão do site: logo + toggle do menu (Sidebar). Usado na home e em
 * páginas internas — na home o logo rola para o topo, fora dela navega para "/".
 * Scroll-aware: recolhe ao descer, revela ao subir e ganha fundo translúcido +
 * blur quando a página sai do topo. */
export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === "/" || pathname === "/v2";

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      // Só recolhe descendo e bem abaixo do topo; subir revela na hora.
      if (y > last && y > 140) setHidden(true);
      else if (y < last) setHidden(false);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const collapsed = hidden && !isOpen;

  return (
    <>
      <AnimatePresence>{isOpen && <Sidebar onClose={() => setIsOpen(false)} />}</AnimatePresence>

      <nav
        aria-label="Navegação principal"
        className={`sticky top-0 z-100 mx-auto flex w-full flex-row items-center justify-between px-4 py-4 transition-[transform,background-color,backdrop-filter] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] md:px-8 ${
          collapsed ? "-translate-y-full" : "translate-y-0"
        } ${scrolled && !collapsed ? "bg-(--surface)/70 backdrop-blur-md" : "bg-transparent"}`}
      >
        {isHome ? (
          <a href="#topo" style={{ viewTransitionName: "brand-mark" }}>
            <img src="/logo-1.svg" alt="Karaguá" className="site-logo w-auto h-12" />
          </a>
        ) : (
          <Link to="/" style={{ viewTransitionName: "brand-mark" }}>
            <img src="/logo-1.svg" alt="Karaguá" className="site-logo w-auto h-12" />
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
