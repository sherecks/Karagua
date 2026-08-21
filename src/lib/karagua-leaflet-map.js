// karagua-leaflet-map.js — Web Component

class KaraguaLeafletMap extends HTMLElement {
  static get observedAttributes() {
    return ["center-lat", "center-lng", "zoom", "geojson-files", "csv-url", "dark-mode"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._map = null;
    this._markers = [];
    this._windLayer = null;
    this._windField = null;
    this._windFetchedAt = 0;
    this._windCanvas = null;
    this._windRaf = 0;
    this._windParticles = null;
    this._windActive = false;
    this._gmwExtentLayer = null;
    this._gmwExtentActive = false;
    this._gmwExtentYear = 2020;
    this._gmwYearDebounce = 0;
    this._historyLoaded = false;
    this._gmwExtentRequestId = 0;
    this._socLayer = null;
    this._socActive = false;
    this._socRequestId = 0;
    this._areaSelectActive = false;
    this._areaSelectFirstCorner = null;
    this._areaSelectRect = null;

    this._centerLat = -26.39;
    this._centerLng = -48.626;
    this._zoom = 14;
    this._geojsonFiles = [];
    this._csvUrl = "";
    this._darkMode = false;
  }

  connectedCallback() {
    this._loadAttributes();
    this._render();
    this._loadLeaflet();
  }

  disconnectedCallback() {
    this._stopWindAnimation();
    if (this._map) {
      this._map.off("moveend zoomend", this._refreshGmwExtent, this);
      this._map.off("moveend zoomend", this._refreshSoc, this);
      this._map.remove();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    switch (name) {
      case "center-lat":
        this._centerLat = parseFloat(newValue) || this._centerLat;
        break;
      case "center-lng":
        this._centerLng = parseFloat(newValue) || this._centerLng;
        break;
      case "zoom":
        this._zoom = parseInt(newValue) || this._zoom;
        break;
      case "geojson-files":
        this._geojsonFiles = newValue ? newValue.split(",").map((f) => f.trim()) : [];
        break;
      case "csv-url":
        this._csvUrl = newValue || "";
        break;
      case "dark-mode":
        this._darkMode = newValue !== "false";
        break;
    }
    if (this._map) this._updateMap();
  }

  _loadAttributes() {
    if (this.hasAttribute("center-lat"))
      this._centerLat = parseFloat(this.getAttribute("center-lat"));
    if (this.hasAttribute("center-lng"))
      this._centerLng = parseFloat(this.getAttribute("center-lng"));
    if (this.hasAttribute("zoom")) this._zoom = parseInt(this.getAttribute("zoom"));
    if (this.hasAttribute("geojson-files"))
      this._geojsonFiles = this.getAttribute("geojson-files")
        .split(",")
        .map((f) => f.trim());
    if (this.hasAttribute("csv-url")) this._csvUrl = this.getAttribute("csv-url");
    if (this.hasAttribute("dark-mode")) this._darkMode = this.getAttribute("dark-mode") !== "false";
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H"
        crossorigin="anonymous" />
      <style>
        @font-face {
          font-family: 'Aileron';
          src: url('/fonts/aileron-regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
        }
        @font-face {
          font-family: 'Aileron';
          src: url('/fonts/aileron-semibold.woff2') format('woff2');
          font-weight: 600;
          font-style: normal;
        }

        :host { display: block; width: 100%; height: 100%; }
        #map { width: 100%; height: 100%; min-height: 400px; }

        /* Zoom controls */
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: none !important;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .leaflet-control-zoom-in,
        .leaflet-control-zoom-out {
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          color: #2C3E50 !important;
          border-radius: 6px !important;
          font-family: 'Aileron', sans-serif !important;
          font-size: 18px !important;
          font-weight: 400 !important;
          text-decoration: none !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: background 0.15s, color 0.15s;
        }
        .leaflet-control-zoom-in:hover,
        .leaflet-control-zoom-out:hover {
          color: #2C3E50 !important;
        }
        .leaflet-control-zoom-in:focus,
        .leaflet-control-zoom-out:focus {
          outline: 3px solid rgba(199,217,38,0.4);
          outline-offset: 2px;
        }

        #panel-toggle {
          position: absolute;
          top: 80px;
          right: 38px;
          z-index: 1001;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #FBF9F4;
          border: 1px solid #E8E4DC;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          transition: background 0.15s;
        }
        #panel-toggle:hover { background: #EDE9E0; }
        #side-panel {
          position: absolute;
          top: 80px;
          right: 88px;
          z-index: 1000;
          background: #FBF9F4;
          border: 1px solid #E8E4DC;
          border-radius: 6px;
          padding: 14px 16px;
          width: 230px;
          max-height: calc(100vh - 100px);
          overflow-y: auto;
          font-family: 'Aileron', sans-serif;
          color: #2C3E50;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        #side-panel.hidden {
          opacity: 0;
          pointer-events: none;
          transform: translateX(8px);
        }
        /* Seções recolhíveis: título vira botão (com chevron) que
           esconde/mostra o corpo — resolve o painel ficando alto demais com
           tantas camadas, sem esconder nada de vez (o usuário escolhe o que
           ver). */
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
          margin: 0 0 8px;
          padding: 0;
          border: none;
          background: none;
          font: inherit;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6B7B8D;
          cursor: pointer;
        }
        .section-header:hover { color: #2C3E50; }
        .section-header:focus-visible {
          outline: 3px solid rgba(199,217,38,0.4);
          outline-offset: 2px;
        }
        .chevron {
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        .side-section.collapsed .section-header { margin-bottom: 0; }
        .side-section.collapsed .chevron { transform: rotate(-90deg); }
        .side-section.collapsed .section-body { display: none; }
        .panel-divider {
          height: 1px;
          background: #E8E4DC;
          margin: 12px 0;
        }
        .cond-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px 8px;
        }
        .cond-label { color: #6B7B8D; font-size: 12px; }
        .cond-value { font-weight: 600; font-size: 13px; font-variant-numeric: tabular-nums; }
        .cond-divider { grid-column: 1 / -1; height: 1px; background: #E8E4DC; margin: 4px 0; }
        #cond-body.loading { opacity: 0.5; }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          line-height: 2.2;
        }
        .layer-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          line-height: 2.2;
          cursor: pointer;
          user-select: none;
        }
        .layer-toggle input {
          accent-color: #4E8748;
          width: 15px;
          height: 15px;
          cursor: pointer;
        }
        .wind-arrow { pointer-events: none; }
        .wind-arrow svg {
          display: block;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
        }
        .wind-canvas { pointer-events: none; }
        /* Mapa de calor de concentração (GMW): a densidade já vem calculada
           em JS (_gmwDensity, tabela de somas) como cinza+alfa por célula —
           o blur aqui só amacia o serrilhado da grade (a densidade em si já
           é o gradiente, blur sozinho numa máscara binária não bastava: o
           miolo de qualquer mancha mais larga que o raio do blur saturava
           sempre em vermelho, sem variar). O filtro SVG #concentration-heat
           converte essa intensidade num gradiente azul→verde→amarelo→
           vermelho: vermelho/amarelo = concentração alta, azul = baixa. */
        .gmw-heat-tint {
          filter: blur(3px) url(#concentration-heat);
        }
        /* Carbono orgânico do solo: valor já é contínuo por célula (t C/ha),
           não uma máscara binária — não precisa da densidade por vizinhança
           do GMW acima, só normaliza direto e reusa o mesmo gradiente de
           calor pra manter a leitura visual consistente entre as camadas. */
        .soc-heat-tint {
          filter: blur(2px) url(#concentration-heat);
        }
        .layer-credit {
          display: block;
          font-size: 10px;
          color: #6B7B8D;
          margin: 4px 0 0 23px;
          line-height: 1.4;
        }
        .layer-button {
          display: block;
          margin-top: 10px;
          padding: 8px 12px;
          border: 1px solid #E8E4DC;
          border-radius: 6px;
          background: #FBF9F4;
          color: #2C3E50;
          font-family: 'Aileron', sans-serif;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .layer-button:hover { background: #EDE9E0; }
        .layer-button.active {
          background: #1A2332;
          color: #fff;
          border-color: #1A2332;
        }
        .gmw-year-row {
          margin: 6px 0 0 23px;
        }
        .gmw-year-row-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .gmw-year-label { font-size: 11px; color: #6B7B8D; }
        .gmw-year-value {
          font-size: 13px;
          font-weight: 700;
          color: #2C3E50;
          font-variant-numeric: tabular-nums;
        }
        .gmw-year-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: #E8E4DC;
          cursor: pointer;
          outline: none;
        }
        .gmw-year-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: #4E8748;
          border: 2px solid #FBF9F4;
          box-shadow: 0 0 0 1px #4E8748;
          cursor: pointer;
        }
        .gmw-year-slider::-moz-range-thumb {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: #4E8748;
          border: 2px solid #FBF9F4;
          box-shadow: 0 0 0 1px #4E8748;
          cursor: pointer;
        }
        .gmw-year-slider:focus-visible {
          outline: 3px solid rgba(199,217,38,0.4);
          outline-offset: 2px;
        }
        .gmw-year-ticks {
          display: flex;
          justify-content: space-between;
          margin-top: 2px;
        }
        .gmw-year-ticks span { font-size: 9px; color: #A8A296; }
        .history-hint { font-size: 11px; color: #6B7B8D; margin: 0 0 8px; line-height: 1.4; }
        .history-chart { display: block; overflow: visible; }
        .history-chart rect { transition: opacity 0.15s; }
        .history-chart rect:hover { opacity: 0.75; }
        .history-loading { font-size: 12px; color: #6B7B8D; padding: 8px 0; }
        .history-error { font-size: 12px; color: #b23b3b; padding: 8px 0; }
        #map.area-select-mode { cursor: crosshair; }
        #points-section { margin-top: 0; }
        .points-group-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 2px 6px;
          border-radius: 3px;
          margin: 8px 0 4px;
          display: inline-block;
        }
        .points-group-label.monitoramento { background: #1A2332; color: #fff; }
        .points-group-label.flora        { background: #4E8748; color: #fff; }
        .points-group-label.fauna        { background: #1a6a8a; color: #fff; }
        .point-item {
          font-size: 12px;
          padding: 4px 6px;
          border-radius: 4px;
          cursor: pointer;
          color: #2C3E50;
          transition: background 0.12s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .point-item:hover { background: #EDE9E0; }
        .point-item.active { background: #EDE9E0; font-weight: 600; }
        #points-scroll {
          max-height: 200px;
          overflow-y: auto;
          margin-top: 2px;
        }
        #points-scroll::-webkit-scrollbar { width: 4px; }
        #points-scroll::-webkit-scrollbar-thumb { background: #D4CEBC; border-radius: 2px; }

        #info-panel {
          display: none;
          position: absolute;
          bottom: 40px;
          left: 40px;
          z-index: 1000;
          background: #FBF9F4;
          border: 1px solid #E8E4DC;
          border-radius: 6px;
          padding: 12px 16px;
          width: 260px;
          font-family: 'Aileron', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #2C3E50;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }
        #info-panel.visible { display: block; }
        #info-panel .info-title {
          font-weight: 600;
          font-size: 15px;
          margin-bottom: 6px;
          padding-right: 20px;
        }
        #info-panel .info-body {
          font-size: 13px;
          color: #6B7B8D;
          line-height: 1.5;
        }
        #info-panel .info-close {
          position: absolute;
          top: 8px;
          right: 10px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          color: #6B7B8D;
          line-height: 1;
          padding: 0;
        }
        #info-panel .info-close:hover { color: #2C3E50; }

        @media (max-width: 480px) {
          #panel-toggle {
            top: 68px;
            right: 12px;
          }
          #side-panel {
            top: 68px;
            right: 62px;
            width: min(220px, calc(100vw - 80px));
          }
          #points-scroll {
            max-height: 140px;
          }
          #info-panel {
            left: 12px;
            right: 12px;
            width: auto;
            bottom: 24px;
          }
        }
      </style>
      <svg width="0" height="0" style="position:absolute">
        <filter id="concentration-heat" color-interpolation-filters="sRGB">
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.08 0.08 0.16 0.82 0.90 0.78"/>
            <feFuncG type="table" tableValues="0.24 0.55 0.71 0.82 0.47 0.12"/>
            <feFuncB type="table" tableValues="0.47 0.71 0.31 0.16 0.12 0.12"/>
          </feComponentTransfer>
        </filter>
      </svg>
      <div id="map"></div>
      <button id="panel-toggle" aria-label="Abrir painel">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2C3E50" stroke-width="2" stroke-linecap="round">
          <line x1="5" y1="9" x2="19" y2="9"/><line x1="5" y1="15" x2="19" y2="15"/>
        </svg>
      </button>
      <div id="side-panel">
        <div id="side-content">
        <div class="side-section collapsed" id="cond-section" data-section="cond">
          <button type="button" class="section-header" aria-expanded="false">
            <span>Condições</span>
            <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="section-body loading" id="cond-body">
            <div class="cond-grid"><span class="cond-label">Carregando...</span></div>
          </div>
        </div>
        <div class="panel-divider"></div>
        <div class="side-section collapsed" id="legend-section" data-section="legend">
          <button type="button" class="section-header" aria-expanded="false">
            <span>Legenda</span>
            <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="section-body">
            <div class="legend-item"><img src="./images/icon/Monitoramento.svg" width="20"> Monitoramento</div>
            <div class="legend-item"><img src="./images/icon/Flora.svg" width="20"> Manguezais</div>
            <div class="legend-item"><img src="./images/icon/Fauna.svg" width="20"> Berçários da Fauna</div>
          </div>
        </div>
        <div class="panel-divider"></div>
        <div class="side-section collapsed" id="layers-section" data-section="layers">
          <button type="button" class="section-header" aria-expanded="false">
            <span>Camadas</span>
            <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="section-body">
            <label class="layer-toggle">
              <input type="checkbox" id="wind-toggle">
              <span>Vento</span>
            </label>
            <label class="layer-toggle">
              <input type="checkbox" id="gmw-extent-toggle">
              <span>Concentração de manguezal</span>
            </label>
            <div class="gmw-year-row" id="gmw-year-row" hidden>
              <div class="gmw-year-row-top">
                <span class="gmw-year-label">Ano</span>
                <span class="gmw-year-value" id="gmw-year-value">2020</span>
              </div>
              <input
                type="range"
                id="gmw-year-slider"
                class="gmw-year-slider"
                min="0"
                max="10"
                step="1"
                value="10"
                aria-label="Ano da camada de manguezal"
              >
              <div class="gmw-year-ticks"><span>1996</span><span>2020</span></div>
            </div>
            <span class="layer-credit" id="gmw-extent-credit">Global Mangrove Watch v4 · Sentinel-2, 10m</span>
            <label class="layer-toggle">
              <input type="checkbox" id="soc-toggle">
              <span>Carbono orgânico do solo</span>
            </label>
            <span class="layer-credit" id="soc-credit">Sanderman et al. 2018 (atualização 2023) · 30m</span>
            <button type="button" id="area-select-btn" class="layer-button">Recortar área em 3D</button>
          </div>
        </div>
        <div class="panel-divider"></div>
        <div class="side-section collapsed" id="history-section" data-section="history">
          <button type="button" class="section-header" aria-expanded="false">
            <span>Histórico do manguezal</span>
            <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="section-body" id="history-body">
            <p class="history-hint">Área de manguezal (ha) em todo o município de Balneário Barra do Sul, por ano.</p>
            <div id="history-chart-wrap"></div>
            <button type="button" id="history-refresh-btn" class="layer-button">Recalcular</button>
            <span class="layer-credit" id="history-credit"></span>
          </div>
        </div>
        <div class="panel-divider"></div>
        <div class="side-section collapsed" id="points-section" data-section="points">
          <button type="button" class="section-header" aria-expanded="false">
            <span>Pontos de interesse</span>
            <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="section-body">
            <div id="points-scroll"></div>
          </div>
        </div>
        </div>
      </div>
      <div id="info-panel">
        <button class="info-close">×</button>
        <div class="info-title"></div>
        <div class="info-body"></div>
      </div>
    `;
  }

  _loadLeaflet() {
    if (window.L) {
      this._initMap();
    } else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH";
      script.crossOrigin = "anonymous";
      script.onload = () => this._initMap();
      script.onerror = () => console.error("Falha ao carregar Leaflet do CDN");
      document.head.appendChild(script);
    }
  }

  _initMap() {
    const mapDiv = this.shadowRoot.getElementById("map");
    this._map = L.map(mapDiv, { zoomControl: false }).setView(
      [this._centerLat, this._centerLng],
      this._zoom,
    );

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: '© <a href="https://www.esri.com/">Esri</a> | Karaguá',
        maxZoom: 19,
      },
    ).addTo(this._map);

    // Panes próprios abaixo dos marcadores e sem eventos: vento e a camada de
    // concentração nunca bloqueiam o clique nos pontos de interesse.
    const gmwPane = this._map.createPane("gmwPane");
    gmwPane.style.zIndex = 290;
    gmwPane.style.pointerEvents = "none";
    const socPane = this._map.createPane("socPane");
    socPane.style.zIndex = 291;
    socPane.style.pointerEvents = "none";
    const windPane = this._map.createPane("windPane");
    windPane.style.zIndex = 350;
    windPane.style.pointerEvents = "none";

    this._loadGeoJSONFiles();
    if (this._csvUrl) this._loadCSVData();
    void this._loadConditions();
    this._initSideToggle();
    this._initSectionToggles();
    this._initWindToggle();
    this._initGmwExtentToggle();
    this._initSocToggle();
    this._initAreaSelectTool();
    this._initHistorySection();

    this.dispatchEvent(
      new CustomEvent("map-ready", {
        detail: { map: this._map },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _loadGeoJSONFiles() {
    // Sem overlays por padrão (mangue e UC removidos a pedido do dono); o
    // atributo geojson-files segue funcionando para reativar camadas.
    const defaults = [];

    const filesToLoad =
      this._geojsonFiles.length > 0
        ? this._geojsonFiles.map((file) => ({ file, color: "#4E8748" }))
        : defaults;

    filesToLoad.forEach((cfg) => {
      fetch(cfg.file)
        .then((r) => r.json())
        .then((data) => {
          L.geoJSON(data, {
            style: {
              color: cfg.color,
              weight: 2,
              fillColor: cfg.fillColor,
              fillOpacity: cfg.fillOpacity ?? 0,
            },
          }).addTo(this._map);
        })
        .catch((err) => console.error(`Erro ao carregar ${cfg.file}:`, err));
    });
  }

  _parseCSVLine(line) {
    const cols = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());
    return cols;
  }

  _parseCoord(val) {
    const n = parseFloat((val || "").replace(",", "."));
    if (isNaN(n)) return NaN;
    // Corrige coordenadas com ponto decimal deslocado (ex: -263.717 → -26.3717)
    if (Math.abs(n) > 90 && Math.abs(n) <= 900) return n / 10;
    return n;
  }

  _loadCSVData() {
    const iconBase = { iconSize: [32, 40], iconAnchor: [16, 40] };
    const monitoramentoIcon = L.icon({ iconUrl: "./images/icon/Monitoramento.svg", ...iconBase });
    const floraIcon = L.icon({ iconUrl: "./images/icon/Flora.svg", ...iconBase });
    const faunaIcon = L.icon({ iconUrl: "./images/icon/Fauna.svg", ...iconBase });

    fetch(this._csvUrl)
      .then((r) => r.text())
      .then((csv) => {
        csv
          .trim()
          .split("\n")
          .slice(1)
          .forEach((linha) => {
            const col = this._parseCSVLine(linha);
            if (col.length < 5) return;
            const nome = col[0];
            const lat = this._parseCoord(col[1]);
            const lng = this._parseCoord(col[2]);
            const dados = col[3];
            const tipo = col[4].toLowerCase();
            let icon = monitoramentoIcon;
            if (tipo === "flora") icon = floraIcon;
            if (tipo === "fauna") icon = faunaIcon;
            if (!isNaN(lat) && !isNaN(lng)) {
              const marker = L.marker([lat, lng], { icon }).addTo(this._map);
              marker.on("click", () => this._showInfo(nome, dados));
              this._markers.push(marker);
            }
          });
      })
      .catch((err) => console.error("Erro ao carregar CSV:", err));

    const panel = this.shadowRoot.getElementById("info-panel");
    panel.querySelector(".info-close").addEventListener("click", () => {
      panel.classList.remove("visible");
    });
  }

  _showInfo(titulo, corpo) {
    const panel = this.shadowRoot.getElementById("info-panel");
    panel.querySelector(".info-title").textContent = titulo;
    panel.querySelector(".info-body").textContent = corpo;
    panel.classList.add("visible");
  }

  _makeIcons() {
    const iconBase = { iconSize: [32, 40], iconAnchor: [16, 40] };
    return {
      monitoramento: L.icon({ iconUrl: "./images/icon/Monitoramento.svg", ...iconBase }),
      flora: L.icon({ iconUrl: "./images/icon/Flora.svg", ...iconBase }),
      fauna: L.icon({ iconUrl: "./images/icon/Fauna.svg", ...iconBase }),
    };
  }

  setPoints(points) {
    this.clearMarkers();
    const icons = this._makeIcons();
    const markerMap = new Map();

    points.forEach((p) => {
      const icon = icons[p.tipo] ?? icons.monitoramento;
      const marker = L.marker([p.latitude, p.longitude], { icon }).addTo(this._map);
      marker.on("click", () => this._selectPoint(p.id, p.nome, p.dados));
      this._markers.push(marker);
      markerMap.set(p.id, marker);
    });

    this._renderPointsList(points, markerMap);
  }

  _renderPointsList(points, markerMap) {
    const scroll = this.shadowRoot.getElementById("points-scroll");
    if (!scroll) return;
    if (points.length === 0) {
      scroll.innerHTML = `<span class="cond-label">Nenhum ponto cadastrado.</span>`;
      return;
    }
    const tipos = ["monitoramento", "flora", "fauna"];
    // Nome/dados vêm da API: montar via DOM (textContent) para não interpretar HTML.
    scroll.textContent = "";
    tipos.forEach((tipo) => {
      const grupo = points.filter((p) => p.tipo === tipo);
      if (!grupo.length) return;
      const label = document.createElement("span");
      label.className = `points-group-label ${tipo}`;
      label.textContent = tipo;
      scroll.appendChild(label);
      grupo.forEach((p) => {
        const item = document.createElement("div");
        item.className = "point-item";
        item.dataset.id = p.id;
        item.title = p.dados || p.nome;
        item.textContent = p.nome;
        scroll.appendChild(item);
      });
    });

    scroll.querySelectorAll(".point-item").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.dataset.id;
        const p = points.find((x) => x.id === id);
        if (!p) return;
        this._map.setView([p.latitude, p.longitude], 16, { animate: true });
        this._selectPoint(p.id, p.nome, p.dados);
      });
    });

    this._markerMap = markerMap;
    this._pointsData = points;
  }

  _selectPoint(id, nome, dados) {
    this.shadowRoot.querySelectorAll(".point-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.id === id);
    });
    this._showInfo(nome, dados);
  }

  get mapReady() {
    return !!this._map;
  }

  _initSideToggle() {
    const panel = this.shadowRoot.getElementById("side-panel");
    const btn = this.shadowRoot.getElementById("panel-toggle");
    const iconOpen = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2C3E50" stroke-width="2" stroke-linecap="round"><line x1="5" y1="9" x2="19" y2="9"/><line x1="5" y1="15" x2="19" y2="15"/></svg>`;
    const iconClose = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2C3E50" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

    btn.addEventListener("click", () => {
      const hidden = panel.classList.toggle("hidden");
      btn.innerHTML = hidden ? iconOpen : iconClose;
      btn.setAttribute("aria-label", hidden ? "Abrir painel" : "Fechar painel");
    });
  }

  // Cada seção do painel (Condições, Legenda, Camadas, Pontos de interesse)
  // abre/fecha independente — todas entram FECHADAS: com todas abertas o
  // painel passava do fim da tela (a lista de "Pontos de interesse" em
  // particular pode ter dezenas de itens). O usuário abre só a seção que
  // quer ver.
  _initSectionToggles() {
    this.shadowRoot.querySelectorAll(".side-section > .section-header").forEach((header) => {
      header.addEventListener("click", () => {
        const section = header.closest(".side-section");
        const collapsed = section.classList.toggle("collapsed");
        header.setAttribute("aria-expanded", String(!collapsed));
      });
    });
  }

  async _loadConditions() {
    const lat = this._centerLat;
    const lng = this._centerLng;
    const panel = this.shadowRoot.getElementById("cond-body");

    let meteo = null;
    let marine = null;
    let tideExtremes = null;

    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,precipitation&wind_speed_unit=kmh&timezone=America%2FSao_Paulo`,
      );
      meteo = await res.json();
    } catch (e) {
      console.warn("Open-Meteo indisponível:", e);
    }

    // Água e ondas via Open-Meteo Marine (mesma fonte da maré, sem chave).
    try {
      const res = await fetch(
        `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=sea_surface_temperature,wave_height,wave_period&timezone=America%2FSao_Paulo`,
      );
      const data = await res.json();
      if (data.current) marine = data.current;
    } catch (e) {
      console.warn("Open-Meteo Marine indisponível:", e);
    }

    // Maré via Karaguá API (Open-Meteo Marine server-side, com cache).
    // Sem API configurada a seção de maré é simplesmente omitida.
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      try {
        const res = await fetch(`${apiUrl.replace(/\/$/, "")}/tide-extremes?lat=${lat}&lng=${lng}`);
        if (res.ok) {
          const data = await res.json();
          if (data.data) tideExtremes = data.data;
        } else {
          console.warn("tide-extremes respondeu", res.status);
        }
      } catch (e) {
        console.warn("Maré indisponível:", e);
      }
    }

    panel.classList.remove("loading");

    if (!meteo) {
      panel.innerHTML = `<span class="cond-label">Condições indisponíveis</span>`;
      return;
    }

    const cur = meteo.current;
    const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
    const windDir = dirs[Math.round(cur.wind_direction_10m / 45) % 8];

    const nextHigh = tideExtremes?.find((e) => e.type === "high");
    const nextLow = tideExtremes?.find((e) => e.type === "low");
    const fmt = (iso) =>
      iso
        ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        : "--";

    const tideHtml = tideExtremes
      ? `<div class="cond-divider"></div>
         <span class="cond-label">Próx. alta</span>
         <span class="cond-value">${fmt(nextHigh?.time)}${nextHigh ? ` · ${nextHigh.height?.toFixed(1)}m` : ""}</span>
         <span class="cond-label">Próx. baixa</span>
         <span class="cond-value">${fmt(nextLow?.time)}${nextLow ? ` · ${nextLow.height?.toFixed(1)}m` : ""}</span>`
      : "";

    const marineHtml = marine
      ? `<span class="cond-label">Água</span>
         <span class="cond-value">${marine.sea_surface_temperature}°C</span>
         <span class="cond-label">Ondas</span>
         <span class="cond-value">${marine.wave_height?.toFixed(1)} m · ${Math.round(marine.wave_period)} s</span>`
      : "";

    panel.innerHTML = `
      <div class="cond-grid">
        <span class="cond-label">Temperatura</span>
        <span class="cond-value">${cur.temperature_2m}°C</span>
        ${marineHtml}
        <span class="cond-label">Vento</span>
        <span class="cond-value">${Math.round(cur.wind_speed_10m)} km/h ${windDir}</span>
        <span class="cond-label">Chuva</span>
        <span class="cond-value">${cur.precipitation} mm</span>
        <span class="cond-label">Umidade</span>
        <span class="cond-value">${cur.relative_humidity_2m}%</span>
        <span class="cond-label">Pressão</span>
        <span class="cond-value">${Math.round(cur.surface_pressure)} hPa</span>
        ${tideHtml}
      </div>
    `;
  }

  // ── Camada de vento estilo Windy ──────────────────────────────────────────
  // 1 chamada em lote (grade 6×5) ao Open-Meteo → campo u/v interpolado
  // bilinearmente → partículas animadas em canvas na cor da marca, com o mapa
  // em preto e branco enquanto a camada está ativa. Sob prefers-reduced-motion
  // a animação é substituída por setas estáticas (Spec/02). Dados: 30 min.
  _initWindToggle() {
    const toggle = this.shadowRoot.getElementById("wind-toggle");
    if (!toggle) return;
    toggle.addEventListener("change", () => void this._setWindVisible(toggle.checked));
  }

  // Mapa em P&B enquanto vento OU concentração de manguezal estiverem
  // ativos (qualquer um já justifica o contraste); só volta a cor quando
  // os dois desligarem.
  _updateBaseFilter() {
    const active = this._windActive || this._gmwExtentActive;
    this._map.getPane("tilePane").style.filter = active ? "grayscale(1) contrast(0.95)" : "";
  }

  async _setWindVisible(on) {
    this._windActive = on;
    if (!on) {
      this._stopWindAnimation();
      if (this._windLayer) this._map.removeLayer(this._windLayer);
      this._updateBaseFilter();
      return;
    }
    const STALE_MS = 30 * 60 * 1000;
    if (!this._windField || Date.now() - this._windFetchedAt > STALE_MS) {
      this._windField = await this._fetchWindField();
      this._windFetchedAt = Date.now();
      if (this._windLayer) {
        this._map.removeLayer(this._windLayer);
        this._windLayer = null;
      }
    }
    if (!this._windField) return;

    this._updateBaseFilter();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      if (!this._windLayer) this._windLayer = this._buildWindArrows(this._windField.points);
      this._windLayer.addTo(this._map);
    } else {
      this._startWindAnimation();
    }
  }

  async _fetchWindField() {
    const b = this._map.getBounds().pad(0.35);
    const COLS = 6;
    const ROWS = 5;
    const lats = [];
    const lngs = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        lats.push((b.getSouth() + ((r + 0.5) / ROWS) * (b.getNorth() - b.getSouth())).toFixed(4));
        lngs.push((b.getWest() + ((c + 0.5) / COLS) * (b.getEast() - b.getWest())).toFixed(4));
      }
    }
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lats.join(",")}&longitude=${lngs.join(",")}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh`,
      );
      const body = await res.json();
      const list = Array.isArray(body) ? body : [body];
      const points = [];
      const u = new Float32Array(COLS * ROWS);
      const v = new Float32Array(COLS * ROWS);
      list.forEach((loc, i) => {
        const speed = loc.current?.wind_speed_10m;
        const dir = loc.current?.wind_direction_10m;
        if (typeof speed !== "number" || typeof dir !== "number") return;
        // Direção meteorológica = de onde vem; componente u/v = para onde vai.
        const to = ((dir + 180) % 360) * (Math.PI / 180);
        u[i] = speed * Math.sin(to);
        v[i] = speed * Math.cos(to);
        points.push({ lat: Number(lats[i]), lng: Number(lngs[i]), speed, dir });
      });
      if (!points.length) return null;
      return {
        south: b.getSouth(),
        north: b.getNorth(),
        west: b.getWest(),
        east: b.getEast(),
        cols: COLS,
        rows: ROWS,
        u,
        v,
        points,
      };
    } catch (e) {
      console.warn("Vento indisponível:", e);
      return null;
    }
  }

  /** Interpolação bilinear do campo u/v em uma coordenada geográfica. */
  _sampleWind(lat, lng) {
    const f = this._windField;
    const fr = Math.min(
      f.rows - 1,
      Math.max(0, ((lat - f.south) / (f.north - f.south)) * f.rows - 0.5),
    );
    const fc = Math.min(
      f.cols - 1,
      Math.max(0, ((lng - f.west) / (f.east - f.west)) * f.cols - 0.5),
    );
    const r0 = Math.floor(fr);
    const c0 = Math.floor(fc);
    const r1 = Math.min(f.rows - 1, r0 + 1);
    const c1 = Math.min(f.cols - 1, c0 + 1);
    const tr = fr - r0;
    const tc = fc - c0;
    const mix = (arr) => {
      const a = arr[r0 * f.cols + c0] * (1 - tc) + arr[r0 * f.cols + c1] * tc;
      const bV = arr[r1 * f.cols + c0] * (1 - tc) + arr[r1 * f.cols + c1] * tc;
      return a * (1 - tr) + bV * tr;
    };
    return { u: mix(f.u), v: mix(f.v) };
  }

  _startWindAnimation() {
    if (this._windRaf) return; // já rodando

    if (!this._windCanvas) {
      const canvas = document.createElement("canvas");
      canvas.className = "wind-canvas leaflet-zoom-hide";
      this._map.getPane("windPane").appendChild(canvas);
      this._windCanvas = canvas;
      this._map.on("moveend zoomend resize", this._resizeWindCanvas, this);
    }
    this._resizeWindCanvas();

    const size = this._map.getSize();
    const count = Math.round(Math.min(350, Math.max(150, (size.x * size.y) / 3500)));
    this._windParticles = Array.from({ length: count }, () => ({
      x: Math.random() * size.x,
      y: Math.random() * size.y,
      age: Math.random() * 80,
    }));

    const GREEN = "#c7d926";
    const SPEED_SCALE = 0.07; // km/h → px por frame
    const MAX_AGE = 80;

    const frame = () => {
      const map = this._map;
      const canvas = this._windCanvas;
      if (!map || !canvas) return;
      const ctx = canvas.getContext("2d");
      const { x: w, y: h } = map.getSize();

      // Fade do rastro: mantém 92% do alpha do quadro anterior.
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = "rgba(0, 0, 0, 0.92)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();

      for (const p of this._windParticles) {
        p.age += 1;
        if (p.age > MAX_AGE || p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.age = 0;
          continue;
        }
        const ll = map.containerPointToLatLng([p.x, p.y]);
        const { u, v } = this._sampleWind(ll.lat, ll.lng);
        const nx = p.x + u * SPEED_SCALE;
        const ny = p.y - v * SPEED_SCALE; // norte = para cima na tela
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        p.x = nx;
        p.y = ny;
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      this._windRaf = requestAnimationFrame(frame);
    };
    this._windRaf = requestAnimationFrame(frame);
  }

  _stopWindAnimation() {
    if (this._windRaf) {
      cancelAnimationFrame(this._windRaf);
      this._windRaf = 0;
    }
    if (this._windCanvas) {
      this._map.off("moveend zoomend resize", this._resizeWindCanvas, this);
      this._windCanvas.remove();
      this._windCanvas = null;
    }
    this._windParticles = null;
  }

  _resizeWindCanvas() {
    const canvas = this._windCanvas;
    if (!canvas) return;
    const size = this._map.getSize();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = size.x * dpr;
    canvas.height = size.y * dpr;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;
    canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    // O pane transforma junto com o mapa; reancora o canvas no viewport atual.
    L.DomUtil.setPosition(canvas, this._map.containerPointToLayerPoint([0, 0]));
  }

  /** Fallback estático (prefers-reduced-motion): setas verdes fixas. */
  _buildWindArrows(points) {
    const group = L.layerGroup();
    for (const p of points) {
      const len = Math.round(Math.min(34, 16 + p.speed * 0.7));
      const opacity = Math.min(0.9, 0.4 + p.speed / 40).toFixed(2);
      const rot = Math.round((p.dir + 180) % 360);
      const html = `
        <div class="wind-arrow" style="opacity:${opacity};transform:rotate(${rot}deg)">
          <svg width="${len}" height="${len}" viewBox="0 0 24 24" fill="none"
               stroke="#c7d926" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="20" x2="12" y2="5"/>
            <polyline points="6,11 12,4 18,11"/>
          </svg>
        </div>`;
      group.addLayer(
        L.marker([p.lat, p.lng], {
          pane: "windPane",
          interactive: false,
          keyboard: false,
          icon: L.divIcon({
            className: "",
            html,
            iconSize: [len, len],
            iconAnchor: [len / 2, len / 2],
          }),
        }),
      );
    }
    return group;
  }

  // ── Mapa de calor de concentração de manguezal (Global Mangrove Watch v4) ─
  // Sentinel-2 a 10m, remapeado especificamente pra capturar franja e
  // manguezal ripário em canais estreitos. Passa pela nossa API (decodifica
  // o GeoTIFF categórico no servidor) e o resultado (máscara binária: é/não é
  // manguezal) vira densidade local por vizinhança (_gmwDensity) pintada em
  // canvas aqui no cliente — o filtro #concentration-heat (.gmw-heat-tint)
  // então converte essa densidade num gradiente de calor de verdade, não um
  // preenchimento sólido de uma cor só.
  // Anos com dado real disponível (mesma lista do back-end,
  // GMW_HISTORY_YEARS em api/index.js) — o slider anda por ÍNDICE nessa
  // lista, não pelo ano em si, porque os anos não são igualmente espaçados
  // (pula de 2010 pra 2015, por exemplo).
  static _GMW_YEARS = [1996, 2007, 2008, 2009, 2010, 2015, 2016, 2017, 2018, 2019, 2020];

  _initGmwExtentToggle() {
    const toggle = this.shadowRoot.getElementById("gmw-extent-toggle");
    const yearRow = this.shadowRoot.getElementById("gmw-year-row");
    const yearSlider = this.shadowRoot.getElementById("gmw-year-slider");
    const yearValue = this.shadowRoot.getElementById("gmw-year-value");
    if (!toggle) return;
    toggle.addEventListener("change", () => {
      if (yearRow) yearRow.hidden = !toggle.checked;
      void this._setGmwExtentVisible(toggle.checked);
    });
    // Barra de arrastar: anda por índice (0-10) na lista de anos disponíveis
    // acima. "input" dispara continuamente enquanto arrasta (não só ao
    // soltar) — o número do ano atualiza na hora, e o fetch/redesenho do
    // overlay é debounced (250ms sem mexer) pra não disparar um request por
    // pixel arrastado enquanto o dedo/mouse ainda está em movimento.
    if (yearSlider && yearValue) {
      yearSlider.addEventListener("input", () => {
        const year = KaraguaLeafletMap._GMW_YEARS[Number(yearSlider.value)];
        yearValue.textContent = String(year);
        this._gmwExtentYear = year;
        clearTimeout(this._gmwYearDebounce);
        this._gmwYearDebounce = setTimeout(() => {
          if (this._gmwExtentActive) void this._refreshGmwExtent();
        }, 250);
      });
    }
  }

  async _setGmwExtentVisible(on) {
    this._gmwExtentActive = on;
    if (!on) {
      this._map.off("moveend zoomend", this._refreshGmwExtent, this);
      if (this._gmwExtentLayer) {
        this._map.removeLayer(this._gmwExtentLayer);
        this._gmwExtentLayer = null;
      }
      this._updateBaseFilter();
      return;
    }
    this._map.on("moveend zoomend", this._refreshGmwExtent, this);
    this._updateBaseFilter();
    await this._refreshGmwExtent();
  }

  async _refreshGmwExtent() {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) return;

    const b = this._map.getBounds();
    const size = this._map.getSize();
    const maxSide = 300;
    const scale = Math.min(1, maxSide / Math.max(size.x, size.y));
    const cols = Math.max(8, Math.round(size.x * scale));
    const rows = Math.max(8, Math.round(size.y * scale));

    const requestId = ++this._gmwExtentRequestId;
    let data;
    try {
      const res = await fetch(
        `${apiUrl.replace(/\/$/, "")}/mangrove-extent-gmw?west=${b.getWest()}&south=${b.getSouth()}&east=${b.getEast()}&north=${b.getNorth()}&cols=${cols}&rows=${rows}&year=${this._gmwExtentYear}`,
      );
      const body = await res.json();
      if (!res.ok || !body.data) throw new Error(body.error ?? `HTTP ${res.status}`);
      data = body.data;
    } catch (e) {
      console.warn("Extensão do manguezal (GMW) indisponível:", e);
      return;
    }
    if (requestId !== this._gmwExtentRequestId) return;

    // Densidade local (0-1) por célula via tabela de somas — não é só "tem
    // manguezal aqui", é "que fração da vizinhança tem manguezal": célula
    // isolada tem vizinhança majoritariamente vazia (densidade baixa), célula
    // no meio de uma mancha grande tem vizinhança quase toda ligada
    // (densidade alta). Testado: pintar a máscara binária opaca e só confiar
    // no blur do CSS não funciona — qualquer mancha mais larga que o raio do
    // blur fica com o miolo inteiro saturado (sempre vermelho, sem gradiente).
    // A densidade calculada aqui já é o gradiente; o blur do CSS só amacia o
    // serrilhado da grade.
    const density = KaraguaLeafletMap._gmwDensity(data.mangrove, data.cols, data.rows);

    const canvas = document.createElement("canvas");
    canvas.width = data.cols;
    canvas.height = data.rows;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(data.cols, data.rows);
    for (let i = 0; i < density.length; i++) {
      const t = density[i];
      if (t <= 0) continue;
      const o = i * 4;
      const gray = Math.round(t * 255);
      img.data[o] = gray;
      img.data[o + 1] = gray;
      img.data[o + 2] = gray;
      img.data[o + 3] = Math.min(255, Math.round(25 + t * 230));
    }
    ctx.putImageData(img, 0, 0);
    const url = canvas.toDataURL("image/png");

    const bounds = [
      [b.getSouth(), b.getWest()],
      [b.getNorth(), b.getEast()],
    ];
    if (this._gmwExtentLayer) {
      this._gmwExtentLayer.setUrl(url);
      this._gmwExtentLayer.setBounds(bounds);
    } else {
      this._gmwExtentLayer = L.imageOverlay(url, bounds, {
        pane: "gmwPane",
        className: "gmw-heat-tint",
        opacity: 0.85,
        interactive: false,
      }).addTo(this._map);
    }

    const credit = this.shadowRoot.getElementById("gmw-extent-credit");
    if (credit) {
      // 2020 usa o produto v4 (Sentinel-2, 10m); os outros anos vêm do v3
      // (JAXA/Landsat, 25m) — resolução mais baixa, então a mancha de anos
      // anteriores a 2020 é menos detalhada, não necessariamente "menor de
      // verdade".
      const source =
        data.year === 2020
          ? "Global Mangrove Watch v4 · Sentinel-2, 10m"
          : "Global Mangrove Watch v3 · JAXA/Landsat, 25m";
      credit.textContent = `≈ ${data.areaHa.toLocaleString("pt-BR")} ha na área visível · ${source} (${data.year})`;
    }
  }

  // ── Carbono orgânico do solo (Sanderman et al. 2018, atualização 2023) ───
  // Mesmo padrão da camada de concentração acima (fetch na área visível,
  // redesenha em moveend/zoomend), mas o valor já vem contínuo por célula
  // (t C/ha) — não precisa da densidade por vizinhança do GMW, só normaliza
  // direto. Referência de cor fixa (não o mín/máx da área visível): senão a
  // mesma cor significaria coisas diferentes dependendo de pra onde você
  // arrastou o mapa. 600 t/ha cobre com folga a faixa observada aqui (~50-
  // 480) e a faixa publicada no paper original (86-729 Mg C/ha).
  static _SOC_COLOR_MAX_THA = 600;

  _initSocToggle() {
    const toggle = this.shadowRoot.getElementById("soc-toggle");
    if (!toggle) return;
    toggle.addEventListener("change", () => void this._setSocVisible(toggle.checked));
  }

  async _setSocVisible(on) {
    this._socActive = on;
    if (!on) {
      this._map.off("moveend zoomend", this._refreshSoc, this);
      if (this._socLayer) {
        this._map.removeLayer(this._socLayer);
        this._socLayer = null;
      }
      return;
    }
    this._map.on("moveend zoomend", this._refreshSoc, this);
    await this._refreshSoc();
  }

  async _refreshSoc() {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) return;

    const b = this._map.getBounds();
    const size = this._map.getSize();
    const maxSide = 300;
    const scale = Math.min(1, maxSide / Math.max(size.x, size.y));
    const cols = Math.max(8, Math.round(size.x * scale));
    const rows = Math.max(8, Math.round(size.y * scale));

    const requestId = ++this._socRequestId;
    let data;
    try {
      const res = await fetch(
        `${apiUrl.replace(/\/$/, "")}/mangrove-soc?west=${b.getWest()}&south=${b.getSouth()}&east=${b.getEast()}&north=${b.getNorth()}&cols=${cols}&rows=${rows}`,
      );
      const body = await res.json();
      if (!res.ok || !body.data) throw new Error(body.error ?? `HTTP ${res.status}`);
      data = body.data;
    } catch (e) {
      console.warn("Carbono orgânico do solo indisponível:", e);
      return;
    }
    if (requestId !== this._socRequestId) return;

    const colorMax = KaraguaLeafletMap._SOC_COLOR_MAX_THA;
    const canvas = document.createElement("canvas");
    canvas.width = data.cols;
    canvas.height = data.rows;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(data.cols, data.rows);
    for (let i = 0; i < data.socTha.length; i++) {
      const tha = data.socTha[i];
      if (tha <= 0) continue;
      const t = Math.min(1, tha / colorMax);
      const o = i * 4;
      const gray = Math.round(t * 255);
      img.data[o] = gray;
      img.data[o + 1] = gray;
      img.data[o + 2] = gray;
      img.data[o + 3] = Math.min(255, Math.round(40 + t * 215));
    }
    ctx.putImageData(img, 0, 0);
    const url = canvas.toDataURL("image/png");

    const bounds = [
      [b.getSouth(), b.getWest()],
      [b.getNorth(), b.getEast()],
    ];
    if (this._socLayer) {
      this._socLayer.setUrl(url);
      this._socLayer.setBounds(bounds);
    } else {
      this._socLayer = L.imageOverlay(url, bounds, {
        pane: "socPane",
        className: "soc-heat-tint",
        opacity: 0.85,
        interactive: false,
      }).addTo(this._map);
    }

    const credit = this.shadowRoot.getElementById("soc-credit");
    if (credit) {
      credit.textContent =
        data.maxTha > 0
          ? `≈ ${data.minTha}-${data.maxTha} t C/ha na área visível · Sanderman et al. 2018, atual. 2023 · 0-100cm, 30m (${data.period})`
          : `Sem manguezal mapeado nessa área · Sanderman et al. 2018, atual. 2023 · 0-100cm, 30m`;
    }
  }

  // Histórico: mesma ideia da camada de concentração acima, mas em vez de UM
  // ano só, busca a área de manguezal (ha) pra 11 anos (1996-2020) na mesma
  // região visível, de uma vez — dá pra ver o número mudando ano a ano, não
  // só a mancha num instante. Carrega sob demanda (só quando a seção abre
  // pela 1ª vez, ou quando o usuário pede pra recalcular) porque é um
  // request bem mais pesado que os outros (11 anos × tiles).
  _initHistorySection() {
    const section = this.shadowRoot.getElementById("history-section");
    const header = section?.querySelector(".section-header");
    const refreshBtn = this.shadowRoot.getElementById("history-refresh-btn");
    if (header) {
      header.addEventListener("click", () => {
        if (!section.classList.contains("collapsed") && !this._historyLoaded) {
          void this._loadHistory();
        }
      });
    }
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => void this._loadHistory());
    }
  }

  async _loadHistory() {
    const apiUrl = import.meta.env.VITE_API_URL;
    const wrap = this.shadowRoot.getElementById("history-chart-wrap");
    const credit = this.shadowRoot.getElementById("history-credit");
    if (!apiUrl || !wrap) return;
    this._historyLoaded = true;
    wrap.innerHTML = `<div class="history-loading">Calculando área por ano (1996-2020)...</div>`;

    // Sem bbox: o back-end sempre calcula pro município inteiro (limite
    // oficial do IBGE), não pra área visível do mapa — ver o comentário de
    // getMunicipioPolygon na API pra entender por quê.
    try {
      const res = await fetch(`${apiUrl.replace(/\/$/, "")}/mangrove-extent-history`);
      const body = await res.json();
      if (!res.ok || !body.data) throw new Error(body.error ?? `HTTP ${res.status}`);
      wrap.innerHTML = KaraguaLeafletMap._renderHistoryChart(body.data.years);
      if (credit) {
        credit.textContent =
          "Global Mangrove Watch v3 (1996-2019, 25m) + v4 (2020, 10m) · limite oficial do município (IBGE)";
      }
    } catch (e) {
      wrap.innerHTML = `<div class="history-error">Histórico indisponível: ${e.message}</div>`;
    }
  }

  // Gráfico de barras em SVG puro (sem lib de gráfico) — mesmo espírito dos
  // ícones do painel inteiro, já todos SVG à mão.
  static _renderHistoryChart(years) {
    if (!years?.length) return `<div class="history-error">Sem dados pra essa área.</div>`;
    const w = 198;
    const h = 108;
    const padBottom = 16;
    const padTop = 6;
    const maxHa = Math.max(...years.map((y) => y.areaHa), 1);
    const barGap = 2;
    const barW = w / years.length;
    const bars = years
      .map((y, i) => {
        const barH = Math.max(2, ((h - padBottom - padTop) * y.areaHa) / maxHa);
        const x = i * barW + barGap / 2;
        const barWidth = barW - barGap;
        const yPos = h - padBottom - barH;
        const label = String(y.year).slice(2);
        return `<rect x="${x.toFixed(1)}" y="${yPos.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barH.toFixed(1)}" fill="#4E8748" rx="1"><title>${y.year}: ${y.areaHa.toLocaleString("pt-BR")} ha</title></rect><text x="${(x + barWidth / 2).toFixed(1)}" y="${h - 4}" font-size="8" text-anchor="middle" fill="#6B7B8D">'${label}</text>`;
      })
      .join("");
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" class="history-chart">${bars}</svg>`;
  }

  // Densidade local por tabela de somas (summed-area table): soma numa janela
  // qualquer em O(1) depois de um pré-cálculo O(n), então dá pra fazer a
  // "vizinhança" de cada célula sem reprocessar tudo por célula (importante:
  // roda a cada moveend/zoomend, grade de até 300×300). Raio fixo em células
  // (não em metros) — a grade já encolhe/cresce com o zoom, então o raio
  // acompanha a escala visível automaticamente.
  static _GMW_DENSITY_RADIUS = 5;
  static _gmwDensity(mask, cols, rows) {
    const radius = KaraguaLeafletMap._GMW_DENSITY_RADIUS;
    const stride = cols + 1;
    const sum = new Float64Array(stride * (rows + 1));
    for (let r = 0; r < rows; r++) {
      let rowSum = 0;
      for (let c = 0; c < cols; c++) {
        rowSum += mask[r * cols + c];
        sum[(r + 1) * stride + (c + 1)] = sum[r * stride + (c + 1)] + rowSum;
      }
    }
    const density = new Float32Array(cols * rows);
    for (let r = 0; r < rows; r++) {
      const r0 = Math.max(0, r - radius);
      const r1 = Math.min(rows - 1, r + radius);
      for (let c = 0; c < cols; c++) {
        const c0 = Math.max(0, c - radius);
        const c1 = Math.min(cols - 1, c + radius);
        const total =
          sum[(r1 + 1) * stride + (c1 + 1)] -
          sum[r0 * stride + (c1 + 1)] -
          sum[(r1 + 1) * stride + c0] +
          sum[r0 * stride + c0];
        const area = (r1 - r0 + 1) * (c1 - c0 + 1);
        density[r * cols + c] = total / area;
      }
    }
    return density;
  }

  // ── Recorte de área para o terreno 3D ─────────────────────────────────────
  // Clique-clique (sem plugin de desenho): primeiro clique marca um canto,
  // o mouse arrasta um retângulo de prévia ao vivo, segundo clique fecha e
  // navega pra /mapa-3d com o bbox escolhido. Esc cancela.
  _initAreaSelectTool() {
    const btn = this.shadowRoot.getElementById("area-select-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (this._areaSelectActive) this._cancelAreaSelect();
      else this._startAreaSelect();
    });
  }

  _startAreaSelect() {
    this._areaSelectActive = true;
    this._areaSelectFirstCorner = null;
    const btn = this.shadowRoot.getElementById("area-select-btn");
    if (btn) {
      btn.textContent = "Cancelar recorte (Esc)";
      btn.classList.add("active");
    }
    this._map.getContainer().classList.add("area-select-mode");
    this._map.dragging.disable();
    this._map.on("click", this._handleAreaSelectClick, this);
    this._map.on("mousemove", this._handleAreaSelectMove, this);
    this._areaSelectKeyHandler = (e) => {
      if (e.key === "Escape") this._cancelAreaSelect();
    };
    window.addEventListener("keydown", this._areaSelectKeyHandler);
  }

  _cancelAreaSelect() {
    this._areaSelectActive = false;
    this._areaSelectFirstCorner = null;
    if (this._areaSelectRect) {
      this._map.removeLayer(this._areaSelectRect);
      this._areaSelectRect = null;
    }
    const btn = this.shadowRoot.getElementById("area-select-btn");
    if (btn) {
      btn.textContent = "Recortar área em 3D →";
      btn.classList.remove("active");
    }
    this._map.getContainer().classList.remove("area-select-mode");
    this._map.dragging.enable();
    this._map.off("click", this._handleAreaSelectClick, this);
    this._map.off("mousemove", this._handleAreaSelectMove, this);
    if (this._areaSelectKeyHandler) {
      window.removeEventListener("keydown", this._areaSelectKeyHandler);
      this._areaSelectKeyHandler = null;
    }
  }

  _handleAreaSelectMove(e) {
    if (!this._areaSelectFirstCorner) return;
    const bounds = L.latLngBounds(this._areaSelectFirstCorner, e.latlng);
    if (this._areaSelectRect) {
      this._areaSelectRect.setBounds(bounds);
    } else {
      this._areaSelectRect = L.rectangle(bounds, {
        color: "#c7d926",
        weight: 2,
        fillOpacity: 0.1,
        interactive: false,
      }).addTo(this._map);
    }
  }

  _handleAreaSelectClick(e) {
    if (!this._areaSelectFirstCorner) {
      this._areaSelectFirstCorner = e.latlng;
      return;
    }
    const bounds = L.latLngBounds(this._areaSelectFirstCorner, e.latlng);
    this._cancelAreaSelect();

    const w = bounds.getWest();
    const s = bounds.getSouth();
    const eLng = bounds.getEast();
    const n = bounds.getNorth();
    // Área mínima: recorte quase de um ponto só viraria uma grade sem sentido.
    if (Math.abs(eLng - w) < 0.001 || Math.abs(n - s) < 0.001) return;

    const params = new URLSearchParams({
      w: w.toFixed(5),
      s: s.toFixed(5),
      e: eLng.toFixed(5),
      n: n.toFixed(5),
    });
    window.location.href = `/mapa-3d?${params.toString()}`;
  }

  _updateMap() {
    this._map?.setView([this._centerLat, this._centerLng], this._zoom);
  }

  getMap() {
    return this._map;
  }
  addMarker(lat, lng, options = {}) {
    const marker = L.marker([lat, lng], options).addTo(this._map);
    this._markers.push(marker);
    return marker;
  }
  clearMarkers() {
    this._markers.forEach((m) => this._map.removeLayer(m));
    this._markers = [];
  }
}

if (!customElements.get("karagua-leaflet-map")) {
  customElements.define("karagua-leaflet-map", KaraguaLeafletMap);
}

export { KaraguaLeafletMap };
