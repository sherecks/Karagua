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
    if (this._map) this._map.remove();
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

    this._loadGeoJSONFiles();
    if (this._csvUrl) this._loadCSVData();
    void this._loadConditions();
    this._initSideToggle();

    this.dispatchEvent(
      new CustomEvent("map-ready", {
        detail: { map: this._map },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _loadGeoJSONFiles() {
    // Apenas arquivos que existem em public/ (mangue/map.geojson davam 404 em todo load).
    const defaults = [
      { file: "mapuc.geojson", color: "#4E8748" },
      { file: "costeira.geojson", color: "#4E8748" },
    ];

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
    let tideExtremes = null;

    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation&wind_speed_unit=kmh&timezone=America%2FSao_Paulo`,
      );
      meteo = await res.json();
    } catch (e) {
      console.warn("Open-Meteo indisponível:", e);
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

    panel.innerHTML = `
      <div class="section-title">Condições</div>
      <div class="cond-grid">
        <span class="cond-label">Temperatura</span>
        <span class="cond-value">${cur.temperature_2m}°C</span>
        <span class="cond-label">Vento</span>
        <span class="cond-value">${Math.round(cur.wind_speed_10m)} km/h ${windDir}</span>
        <span class="cond-label">Chuva</span>
        <span class="cond-value">${cur.precipitation} mm</span>
        ${tideHtml}
      </div>
    `;
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
