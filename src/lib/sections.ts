export type NavSection = {
  id: string;
  label: string;
};

/** Single source of truth for in-page navigation (ScrollRail + Sidebar). */
export const NAV_SECTIONS: NavSection[] = [
  { id: "topo", label: "Início" },
  { id: "problema", label: "Problema" },
  { id: "solucao", label: "Solução" },
  { id: "impacto", label: "Impacto" },
  { id: "como-funciona", label: "Como funciona" },
  { id: "empresas", label: "Para empresas" },
  { id: "legal", label: "Base legal" },
  { id: "contato", label: "Contato" },
];
