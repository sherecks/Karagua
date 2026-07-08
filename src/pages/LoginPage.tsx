import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Equal, X } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { EASE_OUT_QUART } from "@/lib/motion";
import { startViewTransition } from "@/lib/view-transition";
import { login } from "@/lib/api";

const iconTransition = { duration: 0.25, ease: EASE_OUT_QUART } as const;

export function LoginPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    const { error } = await login(email, password);
    setLoading(false);
    if (error) {
      setErro("Email ou senha incorretos.");
      return;
    }
    void navigate("/admin");
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col relative overflow-hidden">
      <img
        src="/topo.svg"
        aria-hidden
        className="absolute bottom-0 left-0 w-full opacity-60 pointer-events-none select-none"
      />

      <AnimatePresence>{isOpen && <Sidebar onClose={() => setIsOpen(false)} />}</AnimatePresence>

      <header className="relative z-[11] flex items-center justify-between px-8 py-4">
        <Link to="/" style={{ viewTransitionName: "brand-mark" }}>
          <img src="/logo-2.svg" alt="Karaguá" className="h-12 w-auto" />
        </Link>
        <motion.button
          type="button"
          onClick={() => startViewTransition(() => setIsOpen((v) => !v))}
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={isOpen}
          className="relative bg-background cursor-pointer inline-flex size-10 rounded-full items-center justify-center"
          style={{ viewTransitionName: "menu-toggle" }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.span
                key="close"
                initial={{ opacity: 0, rotate: -90, scale: 0.85 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.85 }}
                transition={iconTransition}
                className="absolute inset-0 inline-flex items-center justify-center"
              >
                <X aria-hidden className="size-5" />
              </motion.span>
            ) : (
              <motion.span
                key="menu"
                initial={{ opacity: 0, rotate: 90, scale: 0.85 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -90, scale: 0.85 }}
                transition={iconTransition}
                className="absolute inset-0 inline-flex items-center justify-center"
              >
                <Equal aria-hidden className="size-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </header>

      <div className="relative flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-background border border-border rounded-lg p-8 flex flex-col gap-6 shadow-sm">
          <div className="flex flex-col items-center gap-3">
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
    </div>
  );
}
