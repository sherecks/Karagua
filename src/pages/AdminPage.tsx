import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, type PontoInteresse } from "@/lib/supabase";

const TIPOS = ["monitoramento", "flora", "fauna"] as const;
type Tipo = (typeof TIPOS)[number];

const TIPO_LABELS: Record<Tipo, string> = {
  monitoramento: "Monitoramento",
  flora: "Flora",
  fauna: "Fauna",
};

const TIPO_COLORS: Record<Tipo, string> = {
  monitoramento: "bg-[#1A2332] text-white",
  flora: "bg-[#4E8748] text-white",
  fauna: "bg-[#1a6a8a] text-white",
};

const empty = { nome: "", latitude: "", longitude: "", dados: "", tipo: "monitoramento" as Tipo };

type EditState = {
  id: string;
  nome: string;
  latitude: string;
  longitude: string;
  dados: string;
  tipo: Tipo;
};

export function AdminPage() {
  const navigate = useNavigate();
  const [pontos, setPontos] = useState<PontoInteresse[]>([]);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [editing, setEditing] = useState<EditState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [erroEdit, setErroEdit] = useState("");

  async function fetchPontos() {
    const { data, error } = await supabase
      .from("pontos_interesse")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setErro(`Falha ao carregar pontos: ${error.message}`);
      return;
    }
    setPontos((data ?? []) as PontoInteresse[]);
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
    if (!window.confirm("Excluir este ponto? A ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("pontos_interesse").delete().eq("id", id);
    if (error) {
      setErro(`Falha ao excluir: ${error.message}`);
      return;
    }
    void fetchPontos();
  }

  function startEdit(p: PontoInteresse) {
    setEditing({
      id: p.id,
      nome: p.nome,
      latitude: String(p.latitude),
      longitude: String(p.longitude),
      dados: p.dados,
      tipo: p.tipo,
    });
    setErroEdit("");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setErroEdit("");
    const lat = parseFloat(editing.latitude);
    const lng = parseFloat(editing.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      setErroEdit("Latitude e longitude precisam ser números.");
      return;
    }
    setSavingEdit(true);
    const { error } = await supabase
      .from("pontos_interesse")
      .update({
        nome: editing.nome,
        latitude: lat,
        longitude: lng,
        dados: editing.dados,
        tipo: editing.tipo,
      })
      .eq("id", editing.id);
    setSavingEdit(false);
    if (error) {
      setErroEdit(error.message);
      return;
    }
    setEditing(null);
    void fetchPontos();
  }

  const byTipo = TIPOS.map((tipo) => ({
    tipo,
    items: pontos.filter((p) => p.tipo === tipo),
  }));

  return (
    <div className="min-h-screen bg-k-shell">
      <header className="flex items-center justify-between px-4 py-4 border-b border-border bg-background md:px-8">
        <Link to="/" style={{ viewTransitionName: "brand-mark" }}>
          <img src="/logo-1.svg" alt="Karaguá" className="h-10 w-auto" />
        </Link>
        <div className="flex items-center gap-3 md:gap-6">
          <span className="hidden md:inline text-label font-semibold tracking-[0.12em] uppercase text-k-ink-soft">
            Admin · Pontos de Interesse
          </span>
          <Link
            to="/mapa"
            className="text-sm text-k-ink-soft hover:text-k-ink transition-colors py-2 px-1 min-h-[44px] inline-flex items-center"
          >
            Ver mapa →
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              void navigate("/login");
            }}
            className="text-sm text-k-ink-soft hover:text-k-coral transition-colors py-2 px-1 min-h-[44px] inline-flex items-center"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-12 flex flex-col gap-12">
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
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as Tipo }))}
                  className="border border-border rounded-md px-3 py-2 text-body bg-background text-k-ink focus:outline-none focus:ring-2 focus:ring-k-deep"
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {TIPO_LABELS[t]}
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

        {/* Modal de edição */}
        {editing && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setEditing(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditing(null);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Editar ponto"
              className="bg-background rounded-lg shadow-xl w-full max-w-lg p-6 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-title font-semibold text-k-ink">Editar ponto</h3>
                <button
                  onClick={() => setEditing(null)}
                  className="text-k-ink-soft hover:text-k-ink transition-colors text-xl leading-none"
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-label text-k-ink-soft uppercase tracking-wide">Nome</span>
                    <input
                      required
                      value={editing.nome}
                      onChange={(e) => setEditing((ed) => ed && { ...ed, nome: e.target.value })}
                      className="border border-border rounded-md px-3 py-2 text-body bg-k-shell text-k-ink focus:outline-none focus:ring-2 focus:ring-k-deep"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-label text-k-ink-soft uppercase tracking-wide">Tipo</span>
                    <select
                      value={editing.tipo}
                      onChange={(e) =>
                        setEditing((ed) => ed && { ...ed, tipo: e.target.value as Tipo })
                      }
                      className="border border-border rounded-md px-3 py-2 text-body bg-k-shell text-k-ink focus:outline-none focus:ring-2 focus:ring-k-deep"
                    >
                      {TIPOS.map((t) => (
                        <option key={t} value={t}>
                          {TIPO_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-label text-k-ink-soft uppercase tracking-wide">
                      Latitude
                    </span>
                    <input
                      required
                      value={editing.latitude}
                      onChange={(e) =>
                        setEditing((ed) => ed && { ...ed, latitude: e.target.value })
                      }
                      className="border border-border rounded-md px-3 py-2 font-mono text-body bg-k-shell text-k-ink focus:outline-none focus:ring-2 focus:ring-k-deep"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-label text-k-ink-soft uppercase tracking-wide">
                      Longitude
                    </span>
                    <input
                      required
                      value={editing.longitude}
                      onChange={(e) =>
                        setEditing((ed) => ed && { ...ed, longitude: e.target.value })
                      }
                      className="border border-border rounded-md px-3 py-2 font-mono text-body bg-k-shell text-k-ink focus:outline-none focus:ring-2 focus:ring-k-deep"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-label text-k-ink-soft uppercase tracking-wide">
                    Descrição
                  </span>
                  <textarea
                    value={editing.dados}
                    onChange={(e) => setEditing((ed) => ed && { ...ed, dados: e.target.value })}
                    rows={3}
                    className="border border-border rounded-md px-3 py-2 text-body bg-k-shell text-k-ink resize-none focus:outline-none focus:ring-2 focus:ring-k-deep"
                  />
                </label>
                {erroEdit && <p className="text-sm text-k-coral">{erroEdit}</p>}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="bg-k-deep text-white px-6 py-2 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {savingEdit ? "Salvando..." : "Salvar alterações"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="text-sm text-k-ink-soft hover:text-k-ink transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Grid por tipo */}
        <section>
          <h2 className="text-title font-semibold text-k-ink mb-6">
            Pontos cadastrados{" "}
            <span className="text-k-ink-soft font-normal text-body">({pontos.length})</span>
          </h2>
          {pontos.length === 0 ? (
            <p className="text-body text-k-ink-soft">Nenhum ponto cadastrado ainda.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {byTipo.map(({ tipo, items }) => (
                <div key={tipo} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-label font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md ${TIPO_COLORS[tipo]}`}
                    >
                      {TIPO_LABELS[tipo]}
                    </span>
                    <span className="text-label text-k-ink-soft">{items.length}</span>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-sm text-k-ink-soft italic">Nenhum ponto</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {items.map((p) => (
                        <li
                          key={p.id}
                          className="flex flex-col gap-1.5 bg-background border border-border rounded-md px-4 py-3"
                        >
                          <span className="font-semibold text-k-ink text-sm leading-snug">
                            {p.nome}
                          </span>
                          <span className="font-mono text-data text-k-ink-soft">
                            {p.latitude}, {p.longitude}
                          </span>
                          {p.dados && (
                            <p className="text-sm text-k-ink-soft line-clamp-2">{p.dados}</p>
                          )}
                          <div className="flex items-center gap-3 pt-1">
                            <button
                              onClick={() => startEdit(p)}
                              className="text-xs text-k-deep font-semibold hover:opacity-70 transition-opacity"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="text-xs text-k-ink-soft hover:text-k-coral transition-colors"
                              aria-label="Remover ponto"
                            >
                              Remover
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
