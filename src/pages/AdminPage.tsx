import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, type PontoInteresse } from "@/lib/supabase";

const TIPOS = ["monitoramento", "flora", "fauna"] as const;

const empty = { nome: "", latitude: "", longitude: "", dados: "", tipo: "monitoramento" as const };

export function AdminPage() {
  const [pontos, setPontos] = useState<PontoInteresse[]>([]);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  async function fetchPontos() {
    const { data } = await supabase
      .from("pontos_interesse")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPontos(data as PontoInteresse[]);
  }

  useEffect(() => {
    void fetchPontos();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      setErro("Latitude e longitude precisam ser números.");
      return;
    }

    setSaving(true);
    const payload: Omit<PontoInteresse, "id" | "created_at"> = {
      nome: form.nome,
      latitude: lat,
      longitude: lng,
      dados: form.dados,
      tipo: form.tipo,
    };
    const { error } = await supabase.from("pontos_interesse").insert(payload);
    setSaving(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setForm(empty);
    void fetchPontos();
  }

  async function handleDelete(id: string) {
    await supabase.from("pontos_interesse").delete().eq("id", id);
    void fetchPontos();
  }

  return (
    <div className="min-h-screen bg-k-shell">
      <header className="flex items-center justify-between px-8 py-4 border-b border-border bg-background">
        <Link to="/" style={{ viewTransitionName: "brand-mark" }}>
          <img src="/logo-1.svg" alt="Karaguá" className="h-10 w-auto" />
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-label font-semibold tracking-[0.12em] uppercase text-k-ink-soft">
            Admin · Pontos de Interesse
          </span>
          <Link to="/mapa" className="text-sm text-k-ink-soft hover:text-k-ink transition-colors">
            Ver mapa →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-12 flex flex-col gap-12">
        {/* Formulário */}
        <section>
          <h2 className="text-title font-semibold text-k-ink mb-6">Novo ponto</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-label text-k-ink-soft uppercase tracking-wide">Nome</span>
                <input
                  required
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Berçário dos Aratus"
                  className="border border-border rounded-md px-3 py-2 text-body bg-background text-k-ink focus:outline-none focus:ring-2 focus:ring-k-deep"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-label text-k-ink-soft uppercase tracking-wide">Tipo</span>
                <select
                  value={form.tipo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tipo: e.target.value as typeof form.tipo }))
                  }
                  className="border border-border rounded-md px-3 py-2 text-body bg-background text-k-ink focus:outline-none focus:ring-2 focus:ring-k-deep"
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-label text-k-ink-soft uppercase tracking-wide">Latitude</span>
                <input
                  required
                  value={form.latitude}
                  onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                  placeholder="-26.3900"
                  className="border border-border rounded-md px-3 py-2 font-mono text-body bg-background text-k-ink focus:outline-none focus:ring-2 focus:ring-k-deep"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-label text-k-ink-soft uppercase tracking-wide">
                  Longitude
                </span>
                <input
                  required
                  value={form.longitude}
                  onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                  placeholder="-48.6260"
                  className="border border-border rounded-md px-3 py-2 font-mono text-body bg-background text-k-ink focus:outline-none focus:ring-2 focus:ring-k-deep"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-label text-k-ink-soft uppercase tracking-wide">Descrição</span>
              <textarea
                value={form.dados}
                onChange={(e) => setForm((f) => ({ ...f, dados: e.target.value }))}
                rows={3}
                placeholder="Descrição do ponto de interesse..."
                className="border border-border rounded-md px-3 py-2 text-body bg-background text-k-ink resize-none focus:outline-none focus:ring-2 focus:ring-k-deep"
              />
            </label>
            {erro && <p className="text-sm text-k-coral">{erro}</p>}
            <div>
              <button
                type="submit"
                disabled={saving}
                className="bg-k-deep text-white px-6 py-2 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Adicionar ponto"}
              </button>
            </div>
          </form>
        </section>

        {/* Lista */}
        <section>
          <h2 className="text-title font-semibold text-k-ink mb-6">
            Pontos cadastrados{" "}
            <span className="text-k-ink-soft font-normal text-body">({pontos.length})</span>
          </h2>
          {pontos.length === 0 ? (
            <p className="text-body text-k-ink-soft">Nenhum ponto cadastrado ainda.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {pontos.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start justify-between gap-4 bg-background border border-border rounded-md px-4 py-3"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-k-ink text-sm truncate">{p.nome}</span>
                      <span className="text-label uppercase tracking-wide text-k-ink-soft bg-k-fog px-2 py-0.5 rounded-md shrink-0">
                        {p.tipo}
                      </span>
                    </div>
                    <span className="font-mono text-data text-k-ink-soft">
                      {p.latitude}, {p.longitude}
                    </span>
                    {p.dados && <p className="text-sm text-k-ink-soft truncate">{p.dados}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-k-ink-soft hover:text-k-coral transition-colors text-sm shrink-0"
                    aria-label="Remover ponto"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
