import { Footer } from "@/components/footer";
import { CarbonoAzul } from "@/components/lp/carbono-azul";
import { CtaFinal } from "@/components/lp/cta-final";
import { Guardioes } from "@/components/lp/guardioes";
import { Hero } from "@/components/lp/hero";
import { KaraguaVivo } from "@/components/lp/karagua-vivo";
import { MethodologyBlock } from "@/components/lp/methodology-block";
import { Pillars } from "@/components/lp/pillars";
import { Problema } from "@/components/lp/problema";
import { ScrollRail } from "@/components/scroll-rail";
import { EASE_OUT_QUART } from "@/lib/motion";
import { startViewTransition } from "@/lib/view-transition";
import { MotionConfig } from "motion/react";

import { Cursor } from "@/components/cursor";
import { Sidebar } from "@/components/sidebar";
import { Equal, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Loader, LOADER_SESSION_TOTAL_MS } from "./components/loader";
import { MapPage } from "@/pages/MapPage";

const iconTransition = { duration: 0.25, ease: EASE_OUT_QUART } as const;

function LandingPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), LOADER_SESSION_TOTAL_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <AnimatePresence>{loading && <Loader />}</AnimatePresence>
      <div className="min-h-screen bg-muted">
        <AnimatePresence>{isOpen && <Sidebar onClose={() => setIsOpen(false)} />}</AnimatePresence>
        {!loading && <ScrollRail />}

        <div className="flex mx-auto flex-row items-center px-8 py-4 justify-between sticky w-full z-100">
          <a href="#topo" style={{ viewTransitionName: "brand-mark" }}>
            <img src="/logo-1.svg" alt="Karaguá" className="w-auto h-12" />
          </a>

          <div className="flex items-center gap-4">
            <motion.button
              type="button"
              onClick={() => startViewTransition(() => setIsOpen((v) => !v))}
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
        </div>

        <main>
          <Cursor />
          <Hero />
          <Problema />
          <KaraguaVivo />
          <Pillars />
          <MethodologyBlock />
          <CarbonoAzul />
          <Guardioes />
          <CtaFinal />
        </main>
        <Footer />
      </div>
    </>
  );
}

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Routes>
        <Route path="/mapa" element={<MapPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </MotionConfig>
  );
}
