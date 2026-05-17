import { MotionConfig } from "motion/react";
import { CarbonoAzul } from "@/components/lp/carbono-azul";
import { CtaFinal } from "@/components/lp/cta-final";
import { Eventos } from "@/components/lp/eventos";
import { Guardioes } from "@/components/lp/guardioes";
import { Hero } from "@/components/lp/hero";
import { KaraguaVivo } from "@/components/lp/karagua-vivo";
import { Mapa } from "@/components/lp/mapa";
import { MethodologyBlock } from "@/components/lp/methodology-block";
import { Pillars } from "@/components/lp/pillars";
import { Problema } from "@/components/lp/problema";
import { Roadmap } from "@/components/lp/roadmap";
import { SiteFooter } from "@/components/lp/site-footer";
import { SiteNav } from "@/components/lp/site-nav";

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background">
        <SiteNav />
        <main>
          <Hero />
          <Problema />
          <KaraguaVivo />
          <Pillars />
          <MethodologyBlock />
          <CarbonoAzul />
          <Guardioes />
          <Eventos />
          <Roadmap />
          <Mapa />
          <CtaFinal />
        </main>
        <SiteFooter />
      </div>
    </MotionConfig>
  );
}
