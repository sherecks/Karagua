import { useEffect, type RefObject } from "react";

/**
 * Mecânica da transição de superfície (Spec/02 §7): a seção que contém a
 * linha central do viewport define o tema. Um único IntersectionObserver com
 * rootMargin -50%/-50% (banda de altura zero no centro) seta `data-theme` no
 * wrapper; quem anima é o CSS de `.theme-surface`. Zero leitura de layout por
 * evento de scroll.
 */
export function useScrollTheme(wrapperRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const sections = Array.from(
      wrapper.querySelectorAll<HTMLElement>("[data-section-theme]"),
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const theme = (entry.target as HTMLElement).dataset.sectionTheme;
          if (theme) wrapper.dataset.theme = theme;
        }
      },
      { rootMargin: "-50% 0% -50% 0%", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [wrapperRef]);
}
