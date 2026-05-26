import { createClient } from "@supabase/supabase-js";

export type PontoInteresse = {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  dados: string;
  tipo: "fauna" | "flora" | "monitoramento";
  created_at: string;
};

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
);
