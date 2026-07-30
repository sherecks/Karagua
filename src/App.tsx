import { Footer } from "@/components/footer";
import { CtaFinal } from "@/components/lp/cta-final";
import { Diferencial } from "@/components/lp/diferencial";
import { Equipe } from "@/components/lp/equipe";
import { HeroV3 } from "@/components/lp/hero-v3";
import { ImpactoComunidade } from "@/components/lp/impacto-comunidade";
import { KaraguaVivo } from "@/components/lp/karagua-vivo";
import { LaboratorioCta } from "@/components/lp/laboratorio-cta";
import { Marquee } from "@/components/lp/marquee";
import { Pioneirismo } from "@/components/lp/pioneirismo";
// Portas ("Como engajar") fora da home a pedido do dono; componente preservado
// em @/components/lp/portas para reuso futuro.
import { Problema } from "@/components/lp/problema";
import { ScrollRail } from "@/components/scroll-rail";
import { MotionConfig } from "motion/react";

import { Cursor } from "@/components/cursor";
import { SiteHeader } from "@/components/site-header";
import { AnimatePresence } from "motion/react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Loader, LOADER_SESSION_TOTAL_MS } from "./components/loader";
import { useScrollTheme } from "@/lib/use-scroll-theme";

// Lazy: tira o Leaflet/MapPage do bundle inicial da home (achado P2 do audit).
const ProtectedRoute = lazy(() =>
  import("@/components/protected-route").then((m) => ({ default: m.ProtectedRoute })),
);
const MapPage = lazy(() => import("@/pages/MapPage").then((m) => ({ default: m.MapPage })));
const AdminPage = lazy(() => import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const LoginPage = lazy(() => import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const LaboratorioPage = lazy(() =>
  import("@/pages/LaboratorioPage").then((m) => ({ default: m.LaboratorioPage })),
);
// Three.js fica isolado no próprio chunk: nem o /mapa (que já carrega o
// Leaflet) nem a home devem baixar as duas libs pesadas juntas.
const Mapa3DPage = lazy(() =>
  import("@/pages/Mapa3DPage").then((m) => ({ default: m.Mapa3DPage })),
);

/**
 * Home — site institucional multi-página (tom startup). Claim-mestre:
 * pioneirismo + diferencial tecnologia & comunidade. Dupla+ audiência (público,
 * comunidade, município, investidor). Escopo `.v2-surface` aplica contraste AA e
 * touch 44px. Estrutura: hero → problema → diferencial → modelo → impacto &
 * comunidade → equipe → pioneirismo → portas → contato.
 */
/** Loader toca em todo carregamento; só é pulado sob reduced-motion (RF09). */
function shouldShowLoader(): boolean {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function LandingPage() {
  const [loading, setLoading] = useState(shouldShowLoader);
  const themeRef = useRef<HTMLDivElement>(null);
  useScrollTheme(themeRef);

  useEffect(() => {
    if (!loading) return;
    const t = window.setTimeout(() => setLoading(false), LOADER_SESSION_TOTAL_MS);
    return () => clearTimeout(t);
  }, [loading]);

  return (
    <div className="v2-surface">
      <AnimatePresence>{loading && <Loader />}</AnimatePresence>
      {/* Dono único da superfície: nasce claro; a inversão acontece nas costuras
          entre seções que declaram data-section-theme (Spec/02 §7). */}
      <div ref={themeRef} data-theme="light" className="theme-surface min-h-screen">
        {!loading && <ScrollRail />}

        <SiteHeader />

        <main>
          <Cursor />
          <HeroV3 />
          <Problema />
          <Diferencial />
          <KaraguaVivo />
          <ImpactoComunidade />
          <Equipe />
          <Pioneirismo />
          <Marquee />
          <LaboratorioCta />
          <CtaFinal />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Routes>
        <Route
          path="/mapa"
          element={
            <Suspense fallback={null}>
              <MapPage />
            </Suspense>
          }
        />
        <Route
          path="/login"
          element={
            <Suspense fallback={null}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={null}>
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/laboratorio-karagua-vivo"
          element={
            <Suspense fallback={null}>
              <LaboratorioPage />
            </Suspense>
          }
        />
        <Route
          path="/mapa-3d"
          element={
            <Suspense fallback={null}>
              <Mapa3DPage />
            </Suspense>
          }
        />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </MotionConfig>
  );
}
