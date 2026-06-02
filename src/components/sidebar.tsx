import { EASE_OUT_QUART } from "@/lib/motion";
import { NAV_SECTIONS } from "@/lib/sections";
import { startViewTransition } from "@/lib/view-transition";
import { motion } from "motion/react";
import { Link, useLocation } from "react-router-dom";

type SidebarProps = {
  onClose: () => void;
};

export function Sidebar({ onClose }: SidebarProps) {
  const itens = NAV_SECTIONS;
  const { pathname } = useLocation();
  const isHome = pathname === "/" || pathname === "/v2";

  function handleNavigate(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    startViewTransition(onClose);
  }

  return (
    <motion.div
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
      className="fixed top-0 justify-center items-center right-0 z-10 bottom-0 left-0 bg-foreground w-full h-full"
    >
      <motion.ul
        transition={{
          type: "tween",
          delay: 1,
          duration: 0.64,
          inherit: true,
          ease: "easeInOut",
        }}
        className="flex flex-col gap-4 p-6 max-w-xl h-screen mx-auto justify-center items-center md:p-10"
      >
        {isHome
          ? itens.map((item, index) => (
              <li key={item.id}>
                <motion.a
                  href={`#${item.id}`}
                  onClick={(e) => handleNavigate(e, item.id)}
                  className="text-4xl font-semibold text-white transition-colors hover:text-k-bright sm:text-5xl md:text-6xl"
                  initial={{ opacity: 0, x: "100%" }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: "100%" }}
                  transition={{
                    type: "tween",
                    delay: (index + 1) * 0.3,
                    duration: 0.64,
                    inherit: true,
                    ease: "circInOut",
                  }}
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
                  initial={{ opacity: 0, x: "100%" }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: "100%" }}
                  transition={{
                    type: "tween",
                    delay: (index + 1) * 0.3,
                    duration: 0.64,
                    inherit: true,
                    ease: "circInOut",
                  }}
                >
                  <Link
                    to={item.to}
                    onClick={() => startViewTransition(onClose)}
                    className="text-4xl font-semibold text-white transition-colors hover:text-k-bright sm:text-5xl md:text-6xl"
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
        <li>
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{
              type: "tween",
              delay: (isHome ? itens.length + 1 : 2) * 0.3,
              duration: 0.64,
              inherit: true,
              ease: "circInOut",
            }}
          >
            <Link
              to="/mapa"
              onClick={() => startViewTransition(onClose)}
              className="text-4xl font-semibold text-white transition-colors hover:text-k-bright sm:text-5xl md:text-6xl"
            >
              <motion.span
                className="inline-block origin-left"
                style={{ fontStyle: "normal" }}
                whileHover={{ scale: 1.02, fontStyle: "italic", x: 10 }}
                transition={{ type: "tween", duration: 0.6, ease: EASE_OUT_QUART }}
              >
                Mapa
              </motion.span>
            </Link>
          </motion.div>
        </li>
      </motion.ul>
      <motion.div className="flex h-24 flex-col gap-2 bottom-2 left-6 z-100 absolute">
        <motion.span
          className="inline-block text-white mix-blend-difference"
          whileHover={{
            scale: 1.02,
            fontStyle: "italic",
            x: 10,
          }}
        >
          karaguaecotech@gmail.com
        </motion.span>
        <motion.span
          className="inline-block text-white mix-blend-difference"
          whileHover={{
            scale: 1.02,
            fontStyle: "italic",
            x: 10,
          }}
        >
          (47) 99692-3664
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
