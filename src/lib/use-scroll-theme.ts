import { useEffect, type RefObject } from "react";

export function useScrollTheme(wrapperRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const sections = Array.from(wrapper.querySelectorAll<HTMLElement>("[data-section-theme]"));
    if (sections.length === 0) return;

    const update = () => {
      const mid = window.innerHeight / 2;
      for (let i = sections.length - 1; i >= 0; i--) {
        const rect = sections[i].getBoundingClientRect();
        if (rect.top <= mid) {
          const theme = sections[i].dataset.sectionTheme;
          if (theme && wrapper.dataset.theme !== theme) {
            wrapper.dataset.theme = theme;
          }
          return;
        }
      }
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [wrapperRef]);
}
