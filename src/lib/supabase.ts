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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Supabase client requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY at build time",
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
