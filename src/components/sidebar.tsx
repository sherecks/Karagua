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

// Links fixos, sempre visíveis independente da página (home ou não).
const FIXED_LINKS = [
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

  // Semântica de diálogo: Escape fecha, scroll da página trava, foco entra no menu.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    rootRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
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
      <motion.ul
        transition={{
          type: "tween",
          delay: 1,
          duration: 0.64,
          inherit: true,
          ease: "easeInOut",
        }}
        className="flex flex-col gap-3 p-6 max-w-xl h-screen mx-auto justify-center items-center sm:gap-4 md:p-10"
      >
        {isHome
          ? itens.map((item, index) => (
              <li key={item.id}>
                <motion.a
                  href={`#${item.id}`}
                  onClick={(e) => handleNavigate(e, item.id)}
                  className="text-2xl font-semibold text-white transition-colors hover:text-k-bright sm:text-4xl md:text-5xl"
                  variants={itemVariants((index + 1) * 0.3)}
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
                  variants={itemVariants((index + 1) * 0.3)}
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
              variants={itemVariants((isHome ? itens.length + 1 + index : 2 + index) * 0.3)}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
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
            </motion.div>
          </li>
        ))}
      </motion.ul>
    </motion.div>
  );
}
