import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PointCloudSceneView } from "@/components/terrain-3d/point-cloud-scene-view";

// Recorte padrão (baía da Babitonga) usado quando a página é aberta sem vir
// do "Recortar área em 3D" do mapa 2D (ex: link direto/compartilhado) —
// testado e com relevo real visível (~28 células com manguezal, até 546cm).
const DEFAULT_BBOX = { west: -48.75, south: -26.55, east: -48.5, north: -26.3 };

function parseBbox(params: URLSearchParams) {
  const west = Number(params.get("w"));
  const south = Number(params.get("s"));
  const east = Number(params.get("e"));
  const north = Number(params.get("n"));
  if ([west, south, east, north].every(Number.isFinite) && east > west && north > south) {
    return { west, south, east, north };
  }
  return DEFAULT_BBOX;
}

// Só geometria do bbox (não depende do fetch de altura/biomassa) — mesma
// projeção plana local usada no resto do terreno 3D (point-cloud-scene.ts),
// então a área bate exatamente com o relevo desenhado. Km² a partir de
// 100 ha: abaixo disso hectare é mais legível, acima km² compara melhor.
const METERS_PER_DEGREE_LAT = 111_320;
function formatBboxArea(bbox: {
  west: number;
  south: number;
  east: number;
  north: number;
}): string {
  const centerLat = (bbox.south + bbox.north) / 2;
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos((centerLat * Math.PI) / 180);
  const widthM = (bbox.east - bbox.west) * metersPerDegreeLng;
  const heightM = (bbox.north - bbox.south) * METERS_PER_DEGREE_LAT;
  const areaHa = (widthM * heightM) / 10_000;
  if (areaHa >= 100) {
    const km2 = areaHa / 100;
    return `${km2.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km² (${Math.round(areaHa).toLocaleString("pt-BR")} ha)`;
  }
  return `${areaHa.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ha`;
}

export function Mapa3DPage() {
  const [searchParams] = useSearchParams();
  const bbox = parseBbox(searchParams);
  const areaLabel = formatBboxArea(bbox);

  useEffect(() => {
    document.title = "Terreno 3D do manguezal · Karaguá";
    return () => {
      document.title = "Karaguá · Preservando os manguezais";
    };
  }, []);

  return (
    <div className="relative h-screen overflow-hidden bg-[#1a2332]">
      <header className="absolute top-0 inset-x-0 z-[1000] flex items-center justify-between px-4 py-3 md:px-10 md:py-4">
        <Link to="/" style={{ viewTransitionName: "brand-mark" }}>
          <img src="/logo-2.svg" alt="Karaguá" className="h-10 w-auto md:h-12" />
        </Link>
        <div className="flex items-center gap-3 md:gap-6">
          <span className="text-label font-semibold tracking-[0.12em] uppercase text-white">
            Terreno 3D · {areaLabel}
          </span>
          <span className="hidden md:inline text-label font-semibold tracking-[0.12em] uppercase text-white/50">
            Altura e biomassa
          </span>
          <Link
            to="/mapa"
            className="text-sm text-white transition-colors hover:text-k-bright px-2 py-2 min-h-[44px] inline-flex items-center"
          >
            ← Voltar ao mapa
          </Link>
        </div>
      </header>

      <div className="absolute inset-0">
        <PointCloudSceneView bbox={bbox} />
      </div>
    </div>
  );
}
