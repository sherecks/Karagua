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

export function PointCloudSceneView({ bbox }: { bbox: Bbox }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setStatus({ kind: "loading" });
    const cols = window.matchMedia("(min-width: 1024px)").matches ? 192 : 96;
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
          <span>Simard et al. 2019 · NASA/ORNL DAAC · ~31 m/pixel</span>
          {status.biomass && (
            <>
              <span className="text-k-bright">
                Biomassa acima do solo: {status.biomass.minMgHa}–{status.biomass.maxMgHa} Mg/ha
              </span>
              <span>
                ESA CCI Biomass {status.biomass.year} · floresta em geral, não específico de
                manguezal · ~100 m/pixel
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
