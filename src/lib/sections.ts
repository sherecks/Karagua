export type NavSection = {
  id: string;
  label: string;
};

/** Single source of truth for in-page navigation (ScrollRail + Sidebar). */
export const NAV_SECTIONS: NavSection[] = [
  { id: "problema", label: "Problema" },
  { id: "como-funciona", label: "Como funciona" },
  { id: "solucao", label: "Solução" },
  { id: "legal", label: "Base legal" },
  { id: "impacto", label: "Impacto" },
  { id: "contato", label: "Contato" },
];
