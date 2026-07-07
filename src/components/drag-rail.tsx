import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * DragRail — trilho horizontal arrastável (referência BASIC/DEPT: galerias
 * "drag"). Mede o overflow real e limita o arraste a ele; inércia curta e
 * institucional (sem catapulta). Marca o cursor contextual como "arraste".
 * Sob reduced-motion vira scroll horizontal nativo (sem física de arraste).
 */
export function DragRail({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [constraint, setConstraint] = useState(0);

  useEffect(() => {
    const measure = () => {
      const vp = viewportRef.current;
      const tr = trackRef.current;
      if (!vp || !tr) return;
      setConstraint(Math.min(0, vp.offsetWidth - tr.scrollWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, []);

  if (reduce) {
    return (
      <div className={`-mx-4 overflow-x-auto px-4 [scrollbar-width:none] ${className ?? ""}`}>
        <div ref={trackRef} className="flex w-max">
          {children}
        </div>
      </div>
    );
  }

  const draggable = constraint < 0;

  return (
    <div
      ref={viewportRef}
      className={`overflow-hidden ${className ?? ""}`}
      data-cursor-label={draggable ? "arraste" : undefined}
    >
      <motion.div
        ref={trackRef}
        drag={draggable ? "x" : false}
        dragConstraints={{ left: constraint, right: 0 }}
        dragElastic={0.08}
        dragTransition={{ power: 0.2, timeConstant: 180, bounceStiffness: 300, bounceDamping: 40 }}
        className={`flex w-max ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
