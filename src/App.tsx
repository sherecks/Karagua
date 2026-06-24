import { Footer } from "@/components/footer";
import { CarbonoAzul } from "@/components/lp/carbono-azul";
import { CtaFinal } from "@/components/lp/cta-final";
import { Hero } from "@/components/lp/hero";
import { KaraguaVivo } from "@/components/lp/karagua-vivo";
import { MethodologyBlock } from "@/components/lp/methodology-block";
import { Pillars } from "@/components/lp/pillars";
import { Problema } from "@/components/lp/problema";
import { ScrollRail } from "@/components/scroll-rail";
import { MotionConfig } from "motion/react";

import { Cursor } from "@/components/cursor";
import { ProtectedRoute } from "@/components/protected-route";
import { SiteHeader } from "@/components/site-header";
import { AnimatePresence } from "motion/react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Loader, LOADER_SESSION_TOTAL_MS } from "./components/loader";

// Lazy: tira o Leaflet/MapPage do bundle inicial da home (achado P2 do audit).
const MapPage = lazy(() => import("@/pages/MapPage").then((m) => ({ default: m.MapPage })));
const AdminPage = lazy(() => import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const LoginPage = lazy(() => import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const LaboratorioPage = lazy(() =>
  import("@/pages/LaboratorioPage").then((m) => ({ default: m.LaboratorioPage })),
);

function LandingPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), LOADER_SESSION_TOTAL_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <AnimatePresence>{loading && <Loader />}</AnimatePresence>
      <div className="min-h-screen bg-muted">
        {!loading && <ScrollRail />}

        <SiteHeader />

        <main>
          <Cursor />
          <Hero />
          <Problema />
          <KaraguaVivo />
          <Pillars />
          <MethodologyBlock />
          <CarbonoAzul />
          <CtaFinal />
        </main>
        <Footer />
      </div>
    </>
  );
}

// Versão pós-audit: a home dentro do escopo `.v2-surface` (contraste AA, touch
// 44px, DataPoint sem overflow). Fork "só o que muda" via CSS escopado.
function PosAudit() {
  return (
    <div className="v2-surface">
      <LandingPage />
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
            <ProtectedRoute>
              <Suspense fallback={null}>
                <AdminPage />
              </Suspense>
            </ProtectedRoute>
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
        <Route path="/v2" element={<PosAudit />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </MotionConfig>
  );
}
