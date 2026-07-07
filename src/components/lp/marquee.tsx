import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

/**
 * Marquee institucional — faixa fina de claims qualificados em loop lento, no
 * ritmo de assinatura de marca (referência: BASIC/DEPT), mas com vocabulário
 * sóbrio e higiene factual do PRD: pioneirismo SEMPRE qualificado (créditos +
 * manguezal + Sul + estruturado) e nota de validação Verra. Pausa no hover.
 * Sob prefers-reduced-motion vira faixa estática (sem translação).
 */
const ITEMS = [
  "Carbono azul de manguezal",
  "Sul do Brasil",
  "Lastro georreferenciado, auditável",
  "Comunidade remunerada via PSA",
  "Primeiro projeto estruturado no Sul do Brasil",
  "Validação Verra em curso",
];

const DURATION_S = 38; // lento e calmo — institucional, não publicitário

function Track() {
  return (
    <div className="flex shrink-0 items-center" aria-hidden="true">
      {ITEMS.map((t) => (
        <span key={t} className="flex items-center">
          <span className="px-8 text-label font-medium tracking-[0.08em] text-foreground/70 uppercase whitespace-nowrap">
            {t}
          </span>
          <span className="size-1 rounded-full bg-k-bright/70" />
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);

  return (
    <div
      className="surface-primary overflow-hidden py-4"
      role="marquee"
      aria-label="Princípios da Karaguá: carbono azul de manguezal estruturado no Sul do Brasil, com lastro auditável, comunidade remunerada e validação Verra em curso."
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      {reduce ? (
        <div className="flex justify-center">
          <Track />
        </div>
      ) : (
        <motion.div
          className="flex w-max"
          animate={{ x: paused ? undefined : ["0%", "-50%"] }}
          transition={{ duration: DURATION_S, ease: "linear", repeat: Infinity }}
        >
          <Track />
          <Track />
        </motion.div>
      )}
    </div>
  );
}
