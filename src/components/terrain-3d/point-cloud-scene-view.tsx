import { useEffect, useRef, useState } from "react";
import {
  fetchMangroveBiomass,
  fetchMangroveHeightmap,
  type MangroveBiomass,
  type MangroveHeightmap,
} from "@/lib/api";
import { createPointCloudScene, type PointCloudSceneHandle } from "./point-cloud-scene";

type Bbox = { west: number; south: number; east: number; north: number };

type Status =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: MangroveHeightmap; biomass: MangroveBiomass | null };

// Fatores padrão do IPCC (2006 Guidelines for AFOLU) — os mesmos usados por
// qualquer projeto de carbono florestal, incluindo os de manguezal (VM0033):
// fração de carbono na biomassa seca (~0,47) e razão molecular CO2/C (44/12).
const CARBON_FRACTION = 0.47;
const CO2_PER_CARBON = 44 / 12;
const METERS_PER_DEGREE_LAT = 111_320;

/** Soma a biomassa real célula a célula (não a média × área — a densidade
 *  varia muito ponto a ponto) e converte pra CO2 equivalente com os fatores
 *  padrão do IPCC. É uma estimativa simplificada: a biomassa vem de um
 *  produto florestal geral (ESA CCI), não específico de manguezal, e o
 *  cálculo oficial de um projeto VM0033 tem etapas adicionais (incerteza,
 *  buffer de risco, outros reservatórios de carbono) que este número não
 *  cobre — serve pra dar ordem de grandeza, não pra emitir crédito. */
function totalCo2eTonnes(biomass: MangroveBiomass): number {
  const [west, south, east, north] = biomass.bbox;
  const centerLat = (south + north) / 2;
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos((centerLat * Math.PI) / 180);
  const cellWidthM = ((east - west) / biomass.cols) * metersPerDegreeLng;
  const cellHeightM = ((north - south) / biomass.rows) * METERS_PER_DEGREE_LAT;
  const cellAreaHa = (cellWidthM * cellHeightM) / 10_000;
  const totalAgbTonnes = biomass.agbMgHa.reduce((sum, v) => sum + v * cellAreaHa, 0);
  return totalAgbTonnes * CARBON_FRACTION * CO2_PER_CARBON;
}

export function PointCloudSceneView({ bbox }: { bbox: Bbox }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setStatus({ kind: "loading" });
    // Grade mais fina = células menores = mais variação na altura entre
    // pontos vizinhos (menos "quadrado", mais relevo). 320 já é o teto que o
    // back-end aceita (MANGROVE_GRID_MAX).
    const cols = window.matchMedia("(min-width: 1024px)").matches ? 320 : 160;
    // Biomassa (ESA) é opcional: se falhar, a nuvem de pontos ainda funciona
    // com altura real (NASA) sozinha — nunca bloqueia a visualização.
    void Promise.all([
      fetchMangroveHeightmap({ ...bbox, cols, rows: cols }),
      fetchMangroveBiomass({ ...bbox, cols, rows: cols }),
    ]).then(([heightResult, biomassResult]) => {
      if (cancelled) return;
      if (heightResult.error || !heightResult.data) {
        setStatus({
          kind: "error",
          message: heightResult.error?.message ?? "Sem dados para essa área.",
        });
        return;
      }
      setStatus({ kind: "ready", data: heightResult.data, biomass: biomassResult.data ?? null });
    });
    return () => {
      cancelled = true;
    };
  }, [bbox.west, bbox.south, bbox.east, bbox.north]);

  useEffect(() => {
    if (status.kind !== "ready") return;
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let handle: PointCloudSceneHandle | null = createPointCloudScene(container, status.data, {
      reduceMotion,
      biomass: status.biomass,
    });
    return () => {
      handle?.dispose();
      handle = null;
    };
  }, [status]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {status.kind === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a2332] text-body text-white/70">
          Carregando altura e biomassa reais do manguezal…
        </div>
      )}
      {status.kind === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a2332] px-6 text-center text-body text-white/70">
          {status.message}
        </div>
      )}
      {status.kind === "ready" && (
        <div className="pointer-events-none absolute bottom-4 left-4 flex flex-col gap-1 font-mono text-xs text-white/70 md:bottom-6 md:left-6">
          <span className="text-k-bright">
            Altura do dossel: {status.data.minCm}–{status.data.maxCm} cm
          </span>
          <span>Simard et al. 2024 · TanDEM-X ({status.data.year}) · ORNL DAAC · ~12 m/pixel</span>
          {status.biomass && (
            <>
              <span className="text-k-bright">
                Biomassa acima do solo: {status.biomass.minMgHa}–{status.biomass.maxMgHa} Mg/ha
              </span>
              <span>
                ESA CCI Biomass {status.biomass.year} · floresta em geral, não específico de
                manguezal · ~100 m/pixel
              </span>
              <span className="text-k-bright">
                ≈ {Math.round(totalCo2eTonnes(status.biomass)).toLocaleString("pt-BR")} t CO2e
                estocadas nessa área
              </span>
              <span>
                Fator de carbono IPCC (0,47) · CO2/C = 44/12 — estimativa, não substitui o cálculo
                oficial de crédito
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
