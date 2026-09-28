// map-floating-windows.js — janelas flutuantes do mapa (/mapa)
//
// Só comportamento: a marcação vive no shadow DOM do <karagua-leaflet-map>.
// Cada botão do menu aponta para uma janela por data-fw-open="<id>"
// e cada janela é um <section data-fw="<id>">. As janelas moram numa camada
// irmã do #map (não dentro dele), então arrastar ou rolar dentro de uma
// janela nunca chega no Leaflet — o mapa não se mexe junto.
//
// Desktop: várias janelas abertas ao mesmo tempo, arrastáveis pelo cabeçalho
// (mouse, toque ou setas do teclado com o título em foco), presas dentro da
// área do mapa; a posição de cada uma fica salva no navegador. Celular
// (abaixo de 768px): uma janela por vez, centralizada, sem arrastar.

const STORAGE_KEY = "karagua-map-windows";
const MOBILE_QUERY = "(max-width: 767px)";
const EDGE_GAP = 12; // folga mínima entre a janela e a borda do mapa
const TOP_GAP = 80; // abaixo do cabeçalho da página (logo e links ficam por cima do mapa)
const KEY_STEP = 16; // px por seta; Shift multiplica por 4

export const FLOATING_WINDOWS_CSS = `
  /* Menu horizontal no topo, alinhado ao centro do logo do cabeçalho da
     página (MapPage: py-4 + logo h-12 = centro a 40px; menu com 48px de
     altura, então top 16px) e à mesma margem direita (px-10). */
  .fw-rail {
    position: absolute;
    top: 16px;
    right: 40px;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px;
    background: #FFFFFF;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.18);
  }
  .fw-rail-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #2C3E50;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .fw-rail-btn:hover { background: #F2EFE8; }
  .fw-rail-sep {
    width: 1px;
    height: 24px;
    margin: 0 6px;
    background: #E8E4DC;
  }
  /* Links que a página injeta (Adicionar/Voltar) — o estilo interno de cada
     link vem da própria página; aqui só o encaixe no menu. */
  ::slotted([slot="menu-extra"]) {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .fw-rail-btn[aria-expanded="true"] { background: #1A2332; color: #FFFFFF; }
  .fw-rail-btn:focus-visible,
  .fw-close:focus-visible,
  .fw-title:focus-visible {
    outline: 3px solid rgba(199,217,38,0.4);
    outline-offset: 2px;
  }
  .fw-layer {
    position: absolute;
    inset: 0;
    z-index: 10;
    pointer-events: none;
    overflow: hidden;
  }
  .fw-window {
    position: absolute;
    display: flex;
    flex-direction: column;
    width: 320px;
    max-height: min(60vh, 540px);
    background: #FFFFFF;
    border: 1px solid #E8E4DC;
    border-radius: 12px;
    box-shadow: 0 8px 28px rgba(0,0,0,0.2);
    color: #2C3E50;
    font-family: 'Aileron', sans-serif;
    pointer-events: auto;
    animation: fw-in 180ms cubic-bezier(0.25, 1, 0.5, 1);
  }
  .fw-window[hidden] { display: none; }
  .fw-window:focus { outline: none; }
  .fw-header {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 8px 6px 14px;
    border-bottom: 1px solid #E8E4DC;
    cursor: grab;
    touch-action: none;
    user-select: none;
  }
  .fw-window.dragging .fw-header { cursor: grabbing; }
  .fw-title {
    margin: 0;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6B7B8D;
  }
  .fw-close {
    width: 32px;
    height: 32px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: none;
    color: #6B7B8D;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
  }
  .fw-close:hover { background: #F2EFE8; color: #2C3E50; }
  .fw-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 10px 14px 14px;
    overscroll-behavior: contain;
  }
  @keyframes fw-in {
    from { opacity: 0; transform: scale(0.97); }
    to { opacity: 1; transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .fw-window { animation: none; }
    .fw-rail-btn { transition: none; }
  }
  @media ${MOBILE_QUERY} {
    /* Sem espaço ao lado do logo: vira barra de rodapé, só ícones, acima
       da atribuição do Leaflet (que precisa continuar visível). */
    .fw-rail {
      top: auto;
      bottom: 26px;
      left: 12px;
      right: 12px;
      justify-content: space-between;
    }
    .fw-rail-sep { margin: 0; }
    /* Centralizada, a janela cruza a barra: fica por cima dela, senão a
       barra cobre o × de fechar. */
    .fw-layer { z-index: 30; }
    .fw-rail-btn { width: 44px; height: 44px; }
    /* Centralizada sem transform (a animação de entrada já usa transform):
       inset 0 + margin auto + altura pelo conteúdo. */
    .fw-window {
      inset: 0;
      margin: auto;
      width: min(92vw, 380px);
      height: fit-content;
      max-height: 70vh;
    }
    .fw-header { cursor: default; }
  }
`;

export class FloatingWindows {
  /**
   * @param {ShadowRoot} root   onde estão a barra e as janelas
   * @param {HTMLElement} layer camada que contém as janelas (define os limites)
   * @param {{ onOpen?: (id: string) => void }} [options]
   */
  constructor(root, layer, { onOpen } = {}) {
    this._root = root;
    this._layer = layer;
    this._onOpen = onOpen;
    this._zTop = 1;
    this._openCount = 0; // para a cascata de posição inicial
    this._positions = this._readPositions();
    this._mobile = window.matchMedia(MOBILE_QUERY);

    this._windows = new Map(); // id -> { el, button, header, title }
    root.querySelectorAll("[data-fw]").forEach((el) => {
      const id = el.dataset.fw;
      const button = root.querySelector(`[data-fw-open="${id}"]`);
      const header = el.querySelector(".fw-header");
      const title = el.querySelector(".fw-title");
      this._windows.set(id, { el, button, header, title });

      button?.addEventListener("click", () => this.toggle(id));
      el.querySelector(".fw-close")?.addEventListener("click", () => this.close(id));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          this.close(id);
        }
      });
      el.addEventListener("pointerdown", () => this._bringToFront(el));
      el.addEventListener("focusin", () => this._bringToFront(el));
      if (header) this._initDrag(id, el, header);
      title?.addEventListener("keydown", (e) => this._onTitleKey(e, id));
    });

    this._onResize = () => {
      for (const [id, w] of this._windows) if (!w.el.hidden) this._place(id);
    };
    window.addEventListener("resize", this._onResize);
  }

  destroy() {
    window.removeEventListener("resize", this._onResize);
  }

  isOpen(id) {
    return this._windows.get(id)?.el.hidden === false;
  }

  toggle(id) {
    if (this.isOpen(id)) this.close(id);
    else this.open(id);
  }

  open(id) {
    const w = this._windows.get(id);
    if (!w) return;
    if (this._mobile.matches) {
      // Centralizadas se sobrepõem por completo: uma por vez no celular.
      for (const other of this._windows.keys()) if (other !== id) this.close(other, false);
    }
    const wasOpen = !w.el.hidden;
    w.el.hidden = false;
    w.button?.setAttribute("aria-expanded", "true");
    this._bringToFront(w.el);
    if (!wasOpen) {
      this._openCount++;
      this._place(id);
      // Foco na janela (tabindex=-1), não no título: leitor de tela anuncia o
      // diálogo e o anel de foco não aparece num clique de mouse.
      w.el.focus({ preventScroll: true });
      this._onOpen?.(id);
    }
  }

  close(id, restoreFocus = true) {
    const w = this._windows.get(id);
    if (!w || w.el.hidden) return;
    w.el.hidden = true;
    w.button?.setAttribute("aria-expanded", "false");
    if (restoreFocus) w.button?.focus({ preventScroll: true });
  }

  _bringToFront(el) {
    el.style.zIndex = String(++this._zTop);
  }

  // Posição salva (se ainda couber) ou cascata ao lado da barra. No celular
  // o CSS centraliza — limpa left/top pra não brigar com ele.
  _place(id) {
    const { el } = this._windows.get(id);
    if (this._mobile.matches) {
      el.style.left = "";
      el.style.top = "";
      return;
    }
    const saved = this._positions[id];
    if (saved) {
      this._moveTo(id, saved.x, saved.y, false);
      return;
    }
    const bounds = this._layer.getBoundingClientRect();
    const rightMargin = 40; // mesma margem direita do menu
    const step = ((this._openCount - 1) % 6) * 28;
    const x = bounds.width - rightMargin - el.offsetWidth - step;
    const y = TOP_GAP + 8 + step;
    this._moveTo(id, x, y, false);
  }

  _moveTo(id, x, y, persist) {
    const { el } = this._windows.get(id);
    const bounds = this._layer.getBoundingClientRect();
    const maxX = Math.max(EDGE_GAP, bounds.width - el.offsetWidth - EDGE_GAP);
    const maxY = Math.max(TOP_GAP, bounds.height - el.offsetHeight - EDGE_GAP);
    const cx = Math.round(Math.min(maxX, Math.max(EDGE_GAP, x)));
    const cy = Math.round(Math.min(maxY, Math.max(TOP_GAP, y)));
    el.style.left = `${cx}px`;
    el.style.top = `${cy}px`;
    if (persist) {
      this._positions[id] = { x: cx, y: cy };
      this._writePositions();
    }
  }

  _initDrag(id, el, header) {
    let start = null;
    header.addEventListener("pointerdown", (e) => {
      if (this._mobile.matches || e.button !== 0) return;
      if (e.target.closest("button")) return; // o × não inicia arraste
      start = { px: e.clientX, py: e.clientY, x: el.offsetLeft, y: el.offsetTop };
      header.setPointerCapture(e.pointerId);
      el.classList.add("dragging");
      e.preventDefault();
    });
    header.addEventListener("pointermove", (e) => {
      if (!start) return;
      this._moveTo(id, start.x + e.clientX - start.px, start.y + e.clientY - start.py, false);
    });
    const end = () => {
      if (!start) return;
      start = null;
      el.classList.remove("dragging");
      this._moveTo(id, el.offsetLeft, el.offsetTop, true);
    };
    header.addEventListener("pointerup", end);
    header.addEventListener("pointercancel", end);
  }

  // Alternativa ao arraste para quem usa teclado: setas movem a janela
  // enquanto o título (tabindex=0) está em foco.
  _onTitleKey(e, id) {
    if (this._mobile.matches) return;
    const delta = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[e.key];
    if (!delta) return;
    e.preventDefault();
    const { el } = this._windows.get(id);
    const step = e.shiftKey ? KEY_STEP * 4 : KEY_STEP;
    this._moveTo(id, el.offsetLeft + delta[0] * step, el.offsetTop + delta[1] * step, true);
  }

  _readPositions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") ?? {};
    } catch {
      return {};
    }
  }

  _writePositions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._positions));
    } catch {
      // Sem storage (aba privada, bloqueio de site data): a posição só não persiste.
    }
  }
}
