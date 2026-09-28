import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "@/lib/karagua-leaflet-map.js";
import { listPontos } from "@/lib/api";
import { ArrowLeft, Plus } from "lucide-react";

// Mesma altura e cores dos botões de janela do menu (map-floating-windows.js).
const MENU_LINK =
  "flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-[#2C3E50] transition-colors hover:bg-[#F2EFE8] focus-visible:outline-[length:3px] focus-visible:outline-offset-2 focus-visible:outline-[rgba(199,217,38,0.4)] md:h-10 md:min-w-10 md:px-3";

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
      const { data, error } = await listPontos("asc");
      if (error) {
        console.error("Karaguá API:", error.message);
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
      {/* pointer-events-none: o cabeçalho cobre a faixa do topo inteira, mas
          o menu do mapa (dentro do componente, alinhado ao logo) precisa
          receber os cliques ali — só o logo volta a ser clicável. */}
      <header className="pointer-events-none absolute top-0 inset-x-0 z-[1000] flex items-center gap-6 px-4 py-3 md:px-10 md:py-4">
        <Link to="/" style={{ viewTransitionName: "brand-mark" }} className="pointer-events-auto">
          <img src="/logo-2.svg" alt="Karaguá" className="h-10 w-auto md:h-12" />
        </Link>
        <span className="hidden md:inline text-label font-semibold tracking-[0.12em] uppercase text-white">
          Mapa de Transparência
        </span>
      </header>

      <div className="absolute inset-0">
        <karagua-leaflet-map
          ref={mapRef}
          center-lat="-26.2600"
          center-lng="-48.6900"
          zoom="11"
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          {/* Entra no menu do mapa, depois dos botões das janelas. */}
          <div slot="menu-extra">
            <Link to="/admin" className={MENU_LINK} aria-label="Adicionar ponto">
              <Plus size={18} aria-hidden="true" />
              <span className="hidden md:inline">Adicionar</span>
            </Link>
            <Link to="/" className={MENU_LINK} aria-label="Voltar ao site">
              <ArrowLeft size={18} aria-hidden="true" />
              <span className="hidden md:inline">Voltar</span>
            </Link>
          </div>
        </karagua-leaflet-map>
      </div>
    </div>
  );
}
