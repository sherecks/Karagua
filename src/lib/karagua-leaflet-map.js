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
    this._mangroveLayer = null;
    this._mangroveActive = false;
    this._mangroveRequestId = 0;
    this._mangroveExtentLayer = null;
    this._mangroveExtentActive = false;
    this._mangroveExtentRequestId = 0;
    this._gmwExtentLayer = null;
    this._gmwExtentActive = false;
    this._gmwExtentRequestId = 0;
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
      this._map.off("moveend zoomend", this._refreshMangrove, this);
      this._map.off("moveend zoomend", this._refreshMangroveExtent, this);
      this._map.off("moveend zoomend", this._refreshGmwExtent, this);
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
        .section-title {
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6B7B8D;
          margin-bottom: 8px;
        }
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
        #cond-section.loading { opacity: 0.5; }
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
        /* blur amacia os pixels do raster (30m) em manchas, tipo heatmap; o
           filtro SVG #mangrove-heat (definido abaixo) converte a escala de
           cinza (já esticada via renderingRule Stretch/DRA na URL) num
           gradiente azul→verde→amarelo→vermelho por concentração. Sem
           canvas/leitura de pixel, então não depende de CORS. */
        .mangrove-tint {
          filter: blur(6px) url(#mangrove-heat);
        }
        /* Cor já vem pronta do canvas (verde da marca só nas células
           classificadas como manguezal) — o blur só amacia o serrilhado da
           grade categórica, sem precisar de filtro SVG de recorte. */
        .mangrove-extent-tint {
          filter: blur(4px);
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
        <filter id="mangrove-heat" color-interpolation-filters="sRGB">
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
        <div id="cond-section" class="loading">
          <div class="section-title">Condições</div>
          <div class="cond-grid"><span class="cond-label">Carregando...</span></div>
        </div>
        <div class="panel-divider"></div>
        <div id="legend-section">
          <div class="section-title">Legenda</div>
          <div class="legend-item"><img src="./images/icon/Monitoramento.svg" width="20"> Monitoramento</div>
          <div class="legend-item"><img src="./images/icon/Flora.svg" width="20"> Manguezais</div>
          <div class="legend-item"><img src="./images/icon/Fauna.svg" width="20"> Berçários da Fauna</div>
        </div>
        <div class="panel-divider"></div>
        <div id="layers-section">
          <div class="section-title">Camadas</div>
          <label class="layer-toggle">
            <input type="checkbox" id="wind-toggle">
            <span>Vento</span>
          </label>
          <label class="layer-toggle">
            <input type="checkbox" id="mangrove-toggle">
            <span>Cobertura de manguezal</span>
          </label>
          <span class="layer-credit">Altura do dossel · NASA/ORNL DAAC (Simard et al.)</span>
          <label class="layer-toggle">
            <input type="checkbox" id="mangrove-extent-toggle">
            <span>Extensão real do manguezal (MapBiomas)</span>
          </label>
          <span class="layer-credit" id="mangrove-extent-credit">Classificação de uso da terra · MapBiomas Coleção 9 (2023)</span>
          <label class="layer-toggle">
            <input type="checkbox" id="gmw-extent-toggle">
            <span>Extensão real do manguezal (GMW)</span>
          </label>
          <span class="layer-credit" id="gmw-extent-credit">Global Mangrove Watch v4 · Sentinel-2, 10m (2020)</span>
          <button type="button" id="area-select-btn" class="layer-button">Recortar área em 3D →</button>
        </div>
        <div class="panel-divider"></div>
        <div id="points-section">
          <div class="section-title">Pontos de interesse</div>
          <div id="points-scroll"></div>
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

    // Panes próprios abaixo dos marcadores e sem eventos: vento e manguezal
    // nunca bloqueiam o clique nos pontos de interesse. Extensão (MapBiomas)
    // fica abaixo da altura (300) — é uma máscara mais "de base", a altura
    // desenha o calor por cima dela. Manguezal fica abaixo do vento (350)
    // para as partículas desenharem por cima do tint verde.
    const mapbiomasPane = this._map.createPane("mapbiomasPane");
    mapbiomasPane.style.zIndex = 280;
    mapbiomasPane.style.pointerEvents = "none";
    const gmwPane = this._map.createPane("gmwPane");
    gmwPane.style.zIndex = 290;
    gmwPane.style.pointerEvents = "none";
    const mangrovePane = this._map.createPane("mangrovePane");
    mangrovePane.style.zIndex = 300;
    mangrovePane.style.pointerEvents = "none";
    const windPane = this._map.createPane("windPane");
    windPane.style.zIndex = 350;
    windPane.style.pointerEvents = "none";

    this._loadGeoJSONFiles();
    if (this._csvUrl) this._loadCSVData();
    void this._loadConditions();
    this._initSideToggle();
    this._initWindToggle();
    this._initMangroveToggle();
    this._initMangroveExtentToggle();
    this._initGmwExtentToggle();
    this._initAreaSelectTool();

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

  async _loadConditions() {
    const lat = this._centerLat;
    const lng = this._centerLng;
    const panel = this.shadowRoot.getElementById("cond-section");

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
      panel.innerHTML = `<div class="section-title">Condições indisponíveis</div>`;
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
      <div class="section-title">Condições</div>
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

  // Mapa em P&B enquanto vento, altura OU extensão do manguezal estiverem
  // ativos (qualquer um já justifica o contraste); só volta a cor quando
  // todos desligarem.
  _updateBaseFilter() {
    const active =
      this._windActive ||
      this._mangroveActive ||
      this._mangroveExtentActive ||
      this._gmwExtentActive;
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

  // ── Camada de cobertura de manguezal (NASA/ORNL DAAC) ────────────────────
  // ImageServer público (Simard et al., altura de dossel via satélite): sem
  // chave, sem servidor nosso no meio. O exportImage em png32 já devolve alpha
  // real (0 fora de manguezal, 255 dentro) — só recolorimos via CSS filter
  // (.mangrove-tint), sem canvas/pixel read (evita a falta de header CORS).
  // Camada de referência (imagem de satélite, não tempo real); reconsulta a
  // cada moveend/zoomend para acompanhar a área visível.
  _initMangroveToggle() {
    const toggle = this.shadowRoot.getElementById("mangrove-toggle");
    if (!toggle) return;
    toggle.addEventListener("change", () => void this._setMangroveVisible(toggle.checked));
  }

  async _setMangroveVisible(on) {
    this._mangroveActive = on;
    if (!on) {
      this._map.off("moveend zoomend", this._refreshMangrove, this);
      if (this._mangroveLayer) {
        this._map.removeLayer(this._mangroveLayer);
        this._mangroveLayer = null;
      }
      this._updateBaseFilter();
      return;
    }
    this._map.on("moveend zoomend", this._refreshMangrove, this);
    this._updateBaseFilter();
    await this._refreshMangrove();
  }

  // Rendering rule Stretch+DRA: sem isso os valores de altura de dossel na
  // baía ficam espremidos perto do preto (0-135 de 255, testado); com DRA o
  // servidor normaliza pelo min/max REAL do recorte em tela, dando o range
  // cheio (0-255) que o LUT de calor (#mangrove-heat) precisa para variar
  // de azul (baixo) a vermelho (alto).
  static MANGROVE_RENDERING_RULE = encodeURIComponent(
    JSON.stringify({
      rasterFunction: "Stretch",
      rasterFunctionArguments: { StretchType: 6, DRA: true, UseGamma: false },
    }),
  );

  async _refreshMangrove() {
    const b = this._map.getBounds();
    const size = this._map.getSize();
    const maxSide = 1024;
    const scale = Math.min(1, maxSide / Math.max(size.x, size.y));
    const w = Math.round(size.x * scale);
    const h = Math.round(size.y * scale);

    const url =
      "https://gis.earthdata.nasa.gov/image/rest/services/C2389107206-ORNL_CLOUD/CMS_Global_Map_Mangrove_Canopy_1665/ImageServer/exportImage" +
      `?bbox=${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}` +
      `&bboxSR=4326&imageSR=4326&size=${w},${h}&format=png32&f=image` +
      `&renderingRule=${KaraguaLeafletMap.MANGROVE_RENDERING_RULE}`;
    const bounds = [
      [b.getSouth(), b.getWest()],
      [b.getNorth(), b.getEast()],
    ];

    // Pré-carrega a imagem nova ANTES de trocar url/bounds no overlay: sem
    // isso, setBounds redimensiona o <img> pra área nova na hora, mas o
    // conteúdo ainda é o frame antigo — esticado/distorcido até a imagem nova
    // chegar. Guard por requestId: se outro refresh começou nesse meio-tempo
    // (pan/zoom seguinte), descarta este resultado atrasado.
    const requestId = ++this._mangroveRequestId;
    await new Promise((resolve) => {
      const preload = new Image();
      preload.onload = resolve;
      preload.onerror = resolve;
      preload.src = url;
    });
    if (requestId !== this._mangroveRequestId) return;

    if (this._mangroveLayer) {
      this._mangroveLayer.setUrl(url);
      this._mangroveLayer.setBounds(bounds);
    } else {
      this._mangroveLayer = L.imageOverlay(url, bounds, {
        pane: "mangrovePane",
        className: "mangrove-tint",
        opacity: 0.85,
        interactive: false,
      }).addTo(this._map);
    }
  }

  // ── Extensão real do manguezal (MapBiomas) ────────────────────────────────
  // Diferente da altura (NASA): aqui a pergunta é "esse pixel É manguezal ou
  // não" — classificação anual de uso da terra, não um raster de estilo já
  // pronto. Por isso passa pela nossa API (decodifica o GeoTIFF categórico
  // no servidor) e o resultado vira uma máscara pintada em canvas aqui no
  // cliente (verde da marca só nas células classificadas como manguezal),
  // não uma imagem carregada direto de outro serviço como a camada da NASA.
  _initMangroveExtentToggle() {
    const toggle = this.shadowRoot.getElementById("mangrove-extent-toggle");
    if (!toggle) return;
    toggle.addEventListener("change", () => void this._setMangroveExtentVisible(toggle.checked));
  }

  async _setMangroveExtentVisible(on) {
    this._mangroveExtentActive = on;
    if (!on) {
      this._map.off("moveend zoomend", this._refreshMangroveExtent, this);
      if (this._mangroveExtentLayer) {
        this._map.removeLayer(this._mangroveExtentLayer);
        this._mangroveExtentLayer = null;
      }
      this._updateBaseFilter();
      return;
    }
    this._map.on("moveend zoomend", this._refreshMangroveExtent, this);
    this._updateBaseFilter();
    await this._refreshMangroveExtent();
  }

  async _refreshMangroveExtent() {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) return;

    const b = this._map.getBounds();
    const size = this._map.getSize();
    // Máscara categórica: não precisa acompanhar a resolução da tela como a
    // imagem da NASA — uma grade moderada já fica lisa (com o blur do CSS).
    const maxSide = 300;
    const scale = Math.min(1, maxSide / Math.max(size.x, size.y));
    const cols = Math.max(8, Math.round(size.x * scale));
    const rows = Math.max(8, Math.round(size.y * scale));

    const requestId = ++this._mangroveExtentRequestId;
    let data;
    try {
      const res = await fetch(
        `${apiUrl.replace(/\/$/, "")}/mangrove-extent?west=${b.getWest()}&south=${b.getSouth()}&east=${b.getEast()}&north=${b.getNorth()}&cols=${cols}&rows=${rows}`,
      );
      const body = await res.json();
      if (!res.ok || !body.data) throw new Error(body.error ?? `HTTP ${res.status}`);
      data = body.data;
    } catch (e) {
      console.warn("Extensão do manguezal (MapBiomas) indisponível:", e);
      return;
    }
    if (requestId !== this._mangroveExtentRequestId) return;

    // Gerado aqui (canvas → data URI), não baixado de outro serviço: não há
    // frame antigo pra "esticar" enquanto carrega, então dispensa o preload
    // usado na camada da NASA — a troca de url já é instantânea.
    const canvas = document.createElement("canvas");
    canvas.width = data.cols;
    canvas.height = data.rows;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(data.cols, data.rows);
    for (let i = 0; i < data.mangrove.length; i++) {
      if (!data.mangrove[i]) continue;
      const o = i * 4;
      img.data[o] = 130; // k-deep (#828e1a), verde da marca
      img.data[o + 1] = 142;
      img.data[o + 2] = 26;
      img.data[o + 3] = 200;
    }
    ctx.putImageData(img, 0, 0);
    const url = canvas.toDataURL("image/png");

    const bounds = [
      [b.getSouth(), b.getWest()],
      [b.getNorth(), b.getEast()],
    ];
    if (this._mangroveExtentLayer) {
      this._mangroveExtentLayer.setUrl(url);
      this._mangroveExtentLayer.setBounds(bounds);
    } else {
      this._mangroveExtentLayer = L.imageOverlay(url, bounds, {
        pane: "mapbiomasPane",
        className: "mangrove-extent-tint",
        opacity: 0.85,
        interactive: false,
      }).addTo(this._map);
    }

    const credit = this.shadowRoot.getElementById("mangrove-extent-credit");
    if (credit) {
      credit.textContent = `≈ ${data.areaHa.toLocaleString("pt-BR")} ha na área visível · MapBiomas Coleção 9 (${data.year})`;
    }
  }

  // ── Extensão real do manguezal (Global Mangrove Watch v4) ─────────────────
  // Segunda fonte independente de extensão: Sentinel-2 a 10m (o triplo da
  // resolução do MapBiomas), remapeado especificamente pra capturar franja e
  // manguezal ripário em canais estreitos. Mesmo mecanismo da camada
  // MapBiomas (máscara pintada em canvas), cor diferente pra dar pra comparar
  // as duas fontes ligadas ao mesmo tempo sem confundir uma com a outra.
  _initGmwExtentToggle() {
    const toggle = this.shadowRoot.getElementById("gmw-extent-toggle");
    if (!toggle) return;
    toggle.addEventListener("change", () => void this._setGmwExtentVisible(toggle.checked));
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
        `${apiUrl.replace(/\/$/, "")}/mangrove-extent-gmw?west=${b.getWest()}&south=${b.getSouth()}&east=${b.getEast()}&north=${b.getNorth()}&cols=${cols}&rows=${rows}`,
      );
      const body = await res.json();
      if (!res.ok || !body.data) throw new Error(body.error ?? `HTTP ${res.status}`);
      data = body.data;
    } catch (e) {
      console.warn("Extensão do manguezal (GMW) indisponível:", e);
      return;
    }
    if (requestId !== this._gmwExtentRequestId) return;

    const canvas = document.createElement("canvas");
    canvas.width = data.cols;
    canvas.height = data.rows;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(data.cols, data.rows);
    for (let i = 0; i < data.mangrove.length; i++) {
      if (!data.mangrove[i]) continue;
      const o = i * 4;
      img.data[o] = 39; // k-color-positive (#27ae60) — distinto do verde da marca usado no MapBiomas
      img.data[o + 1] = 174;
      img.data[o + 2] = 96;
      img.data[o + 3] = 200;
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
        className: "mangrove-extent-tint",
        opacity: 0.85,
        interactive: false,
      }).addTo(this._map);
    }

    const credit = this.shadowRoot.getElementById("gmw-extent-credit");
    if (credit) {
      credit.textContent = `≈ ${data.areaHa.toLocaleString("pt-BR")} ha na área visível · Global Mangrove Watch v4 (${data.year})`;
    }
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
