import { useEffect } from "react";
import { Link } from "react-router-dom";
import "@/lib/karagua-leaflet-map.js";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQV5a1ea9CzLibmBwZH8ZlHOu9KX9Ui1__CEumXAkc-Olo4y8Jfxy1G9DqrYI1J-ZbKxrB_wXVOjTVB/pub?output=csv";

export function MapPage() {
  useEffect(() => {
    document.title = "Mapa de Transparência · Karaguá";
    return () => {
      document.title = "Karaguá · Preservando os manguezais";
    };
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between px-8 py-4 bg-background/90 backdrop-blur-md border-b border-border">
        <Link to="/" style={{ viewTransitionName: "brand-mark" }}>
          <img src="/logo-1.svg" alt="Karaguá" className="h-12 w-auto" />
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-label font-semibold tracking-[0.12em] uppercase text-k-ink-soft">
            Mapa de Transparência
          </span>
          <Link to="/" className="text-sm text-k-ink-soft transition-colors hover:text-k-ink">
            ← Voltar
          </Link>
        </div>
      </header>

      {/* Mapa fullscreen */}
      <div className="flex-1 overflow-hidden">
        <karagua-leaflet-map
          center-lat="-26.3900"
          center-lng="-48.6260"
          zoom="14"
          csv-url={CSV_URL}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
