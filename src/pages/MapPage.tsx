import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "@/lib/karagua-leaflet-map.js";
import { supabase } from "@/lib/supabase";

export function MapPage() {
  const mapRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.title = "Mapa de Transparência · Karaguá";
    return () => {
      document.title = "Karaguá · Preservando os manguezais";
    };
  }, []);

  useEffect(() => {
    const mapEl = mapRef.current;
    if (!mapEl) return;

    async function loadPoints() {
      const { data, error } = await supabase
        .from("pontos_interesse")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) {
        console.error("Supabase:", error);
        return;
      }
      if (data) (mapEl as any).setPoints(data);
    }

    // Se o mapa já inicializou (ex: navegando de volta), carrega direto
    if ((mapEl as any).mapReady) {
      void loadPoints();
    } else {
      mapEl.addEventListener("map-ready", loadPoints, { once: true });
    }
  }, []);

  return (
    <div className="relative h-screen overflow-hidden">
      <header className="absolute top-0 inset-x-0 z-[1000] flex items-center justify-between px-10 py-4">
        <Link to="/" style={{ viewTransitionName: "brand-mark" }}>
          <img src="/logo-2.svg" alt="Karaguá" className="h-12 w-auto" />
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-label font-semibold tracking-[0.12em] uppercase text-white">
            Mapa de Transparência
          </span>
          <Link
            to="/admin"
            className="text-label uppercase font-semibold text-white px-3 py-1.5 rounded-md transition-colors"
          >
            Adicionar
          </Link>
          <Link to="/" className="text-sm text-white transition-colors hover:text-k-ink-soft">
            ← Voltar
          </Link>
        </div>
      </header>

      <div className="absolute inset-0">
        <karagua-leaflet-map
          ref={mapRef}
          center-lat="-26.3900"
          center-lng="-48.6260"
          zoom="14"
          style={{ display: "block", width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
