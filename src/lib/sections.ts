export type NavSection = {
  id: string;
  label: string;
};

/** Single source of truth for in-page navigation (ScrollRail + Sidebar). */
export const NAV_SECTIONS: NavSection[] = [
  { id: "topo", label: "Início" },
  { id: "problema", label: "Desafio" },
  { id: "karagua-vivo", label: "Karaguá Vivo" },
  { id: "pilares", label: "Tecnologia" },
  { id: "metodologia", label: "Metodologia" },
  { id: "carbono-azul", label: "Carbono azul" },
  { id: "guardioes", label: "Guardiões" },
  { id: "eventos", label: "Eventos" },
  { id: "investir", label: "Investir" },
];
