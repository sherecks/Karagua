import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErro("Email ou senha incorretos.");
      return;
    }
    void navigate("/admin");
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4 relative overflow-hidden">
      <img
        src="/topo.svg"
        aria-hidden
        className="absolute bottom-0 left-0 w-full opacity-60 pointer-events-none select-none"
      />
      <div className="w-full max-w-sm bg-background border border-border rounded-lg p-8 flex flex-col gap-6 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo-1.svg" alt="Karaguá" className="h-10 w-auto" />
          <p className="text-label text-k-ink-soft uppercase tracking-widest">Admin</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-label text-k-ink-soft tracking-wide">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="border border-border rounded-md px-3 py-2 text-body bg-k-shell text-k-ink focus:outline-none focus:ring-2 focus:ring-k-deep"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-label text-k-ink-soft tracking-wide">Senha</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="border border-border rounded-md px-3 py-2 text-body bg-k-shell text-k-ink focus:outline-none focus:ring-2 focus:ring-k-deep"
            />
          </label>
          {erro && <p className="text-sm text-k-coral">{erro}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-[#1A2332] text-white px-6 py-2 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
