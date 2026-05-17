import { EASE_OUT_QUART } from "@/lib/motion";
import { motion } from "motion/react";

export function Sidebar() {
  const itens = [
    {
      id: "hero",
      label: "Sobre",
    },
    {
      id: "karagua-vivo",
      label: "Karaguá Vivo",
    },
    {
      id: "pilares",
      label: "Tecnologia",
    },
    {
      id: "roadmap",
      label: "Roadmap",
    },
    {
      id: "eventos",
      label: "Eventos",
    },
  ];
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
        className="flex flex-col gap-4 p-10 max-w-xl h-screen mx-auto justify-center items-center"
      >
        {itens.map((item, index) => (
          <li key={item.id}>
            <motion.a
              href={`#${item.id}`}
              className="text-6xl font-semibold text-white transition-colors hover:text-k-bright"
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
                whileHover={{
                  scale: 1.02,
                  fontStyle: "italic",
                  x: 10,
                }}
                transition={{
                  type: "tween",
                  duration: 0.6,
                  ease: EASE_OUT_QUART,
                }}
              >
                {item.label}
              </motion.span>
            </motion.a>
          </li>
        ))}
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
          contato@karagua.com.br
        </motion.span>
        <motion.span
          className="inline-block text-white mix-blend-difference"
          whileHover={{
            scale: 1.02,
            fontStyle: "italic",
            x: 10,
          }}
        >
          (47) 99999-9999
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
