import { EASE_OUT_QUART } from "@/lib/motion";
import { NAV_SECTIONS } from "@/lib/sections";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

type SidebarProps = {
  onClose: () => void;
};

// Entrada com stagger (delay cresce por índice, efeito cascata); saída sempre
// rápida e uniforme (sem o delay escalonado) — senão fechar o menu com muitos
// itens demora vários segundos (o último item "espera a vez" pra sumir).
function itemVariants(enterDelay: number) {
  return {
    hidden: { opacity: 0, x: "100%" },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "tween", delay: enterDelay, duration: 0.64, ease: "circInOut" },
    },
    exit: {
      opacity: 0,
      x: "100%",
      transition: { type: "tween", duration: 0.3, ease: "circInOut" },
    },
  } as const;
}

// Orçamento fixo de cascata: distribui os delays de entrada dentro de um
// total constante, em vez de um incremento fixo por item (que fazia o último
// link demorar ~2.7s pra aparecer com 9 itens — cresce sem limite conforme
// NAV_SECTIONS cresce). `total` é a contagem real de itens renderizados.
const STAGGER_BASE_DELAY = 0.15;
const STAGGER_SPREAD = 0.6;
function enterDelayFor(index: number, total: number) {
  if (total <= 1) return STAGGER_BASE_DELAY;
  return STAGGER_BASE_DELAY + (index / (total - 1)) * STAGGER_SPREAD;
}

function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
}

// Links fixos, sempre visíveis independente da página (home ou não).
// `external: true` abre em nova aba (rota fora do domínio, não faz sentido
// navegar via react-router).
const FIXED_LINKS: { to: string; label: string; external?: boolean }[] = [
  { to: "/laboratorio-karagua-vivo", label: "Laboratório Karaguá" },
  { to: "/mapa", label: "Mapa do Projeto" },
];

export function Sidebar({ onClose }: SidebarProps) {
  const itens = NAV_SECTIONS;
  const { pathname } = useLocation();
  const isHome = pathname === "/" || pathname === "/v2";
  // Não lista o link para a página em que o usuário já está.
  const fixedLinks = FIXED_LINKS.filter((link) => link.to !== pathname);
  const rootRef = useRef<HTMLDivElement>(null);

  // Semântica de diálogo: Escape fecha, scroll da página trava, foco entra no
  // menu e fica preso nele (Tab/Shift+Tab não escapam pro conteúdo por trás —
  // role="dialog" aria-modal="true" sozinho não impede isso, só o trap real faz).
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    rootRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = getFocusable(rootRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function handleNavigate(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    onClose();
  }

  const firstBlockCount = isHome ? itens.length : 1;
  const totalItems = firstBlockCount + fixedLinks.length;

  return (
    <motion.div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navegação"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{
        type: "tween",
        delay: 0.25,
        duration: 0.64,
        inherit: true,

        ease: "circInOut",
      }}
      className="fixed top-0 justify-center items-center right-0 z-50 bottom-0 left-0 bg-foreground w-full h-full"
    >
      <motion.ul className="flex flex-col gap-3 p-6 max-w-xl h-screen mx-auto justify-center items-center sm:gap-4 md:p-10">
        {isHome
          ? itens.map((item, index) => (
              <li key={item.id}>
                <motion.a
                  href={`#${item.id}`}
                  onClick={(e) => handleNavigate(e, item.id)}
                  className="text-2xl font-semibold text-white transition-colors hover:text-k-bright sm:text-4xl md:text-5xl"
                  variants={itemVariants(enterDelayFor(index, totalItems))}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.span
                    className="inline-block origin-left"
                    style={{ fontStyle: "normal" }}
                    whileHover={{ scale: 1.02, fontStyle: "italic", x: 10 }}
                    transition={{ type: "tween", duration: 0.6, ease: EASE_OUT_QUART }}
                  >
                    {item.label}
                  </motion.span>
                </motion.a>
              </li>
            ))
          : [{ label: "Início", to: "/" }].map((item, index) => (
              <li key={item.to}>
                <motion.div
                  variants={itemVariants(enterDelayFor(index, totalItems))}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Link
                    to={item.to}
                    onClick={onClose}
                    className="text-2xl font-semibold text-white transition-colors hover:text-k-bright sm:text-4xl md:text-5xl"
                  >
                    <motion.span
                      className="inline-block origin-left"
                      style={{ fontStyle: "normal" }}
                      whileHover={{ scale: 1.02, fontStyle: "italic", x: 10 }}
                      transition={{ type: "tween", duration: 0.6, ease: EASE_OUT_QUART }}
                    >
                      {item.label}
                    </motion.span>
                  </Link>
                </motion.div>
              </li>
            ))}
        {fixedLinks.map((link, index) => (
          <li key={link.to}>
            <motion.div
              variants={itemVariants(enterDelayFor(firstBlockCount + index, totalItems))}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {link.external ? (
                <a
                  href={link.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="text-2xl font-semibold text-white transition-colors hover:text-k-bright sm:text-4xl md:text-5xl"
                >
                  <motion.span
                    className="inline-block origin-left"
                    style={{ fontStyle: "normal" }}
                    whileHover={{ scale: 1.02, fontStyle: "italic", x: 10 }}
                    transition={{ type: "tween", duration: 0.6, ease: EASE_OUT_QUART }}
                  >
                    {link.label}
                  </motion.span>
                </a>
              ) : (
                <Link
                  to={link.to}
                  onClick={onClose}
                  className="text-2xl font-semibold text-white transition-colors hover:text-k-bright sm:text-4xl md:text-5xl"
                >
                  <motion.span
                    className="inline-block origin-left"
                    style={{ fontStyle: "normal" }}
                    whileHover={{ scale: 1.02, fontStyle: "italic", x: 10 }}
                    transition={{ type: "tween", duration: 0.6, ease: EASE_OUT_QUART }}
                  >
                    {link.label}
                  </motion.span>
                </Link>
              )}
            </motion.div>
          </li>
        ))}
      </motion.ul>
    </motion.div>
  );
}
