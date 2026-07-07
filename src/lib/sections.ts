export type NavSection = {
  id: string;
  label: string;
};

/** Single source of truth for in-page navigation (ScrollRail + Sidebar). */
export const NAV_SECTIONS: NavSection[] = [
  { id: "problema", label: "Problema" },
  { id: "diferencial", label: "Diferencial" },
  { id: "como-funciona", label: "Modelo" },
  { id: "impacto", label: "Impacto" },
  { id: "equipe", label: "Equipe" },
  { id: "pioneirismo", label: "Pioneirismo" },
  { id: "contato", label: "Contato" },
];
