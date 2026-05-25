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
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        :host { display: block; width: 100%; height: 100%; }
        #map { width: 100%; height: 100%; min-height: 400px; }
        .info.legend {
          padding: 10px 14px;
          background: #FBF9F4;
          border: 1px solid #E8E4DC;
          border-radius: 6px;
          font-family: sans-serif;
          font-size: 13px;
          line-height: 1.8;
          color: #2C3E50;
        }
        .info.legend img { vertical-align: middle; margin-right: 6px; }
      </style>
      <div id="map"></div>
    `;
  }

  _loadLeaflet() {
    if (window.L) {
      this._initMap();
    } else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => this._initMap();
      document.head.appendChild(script);
    }
  }

  _initMap() {
    const mapDiv = this.shadowRoot.getElementById("map");
    this._map = L.map(mapDiv).setView([this._centerLat, this._centerLng], this._zoom);
    this._map.scrollWheelZoom.disable();

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap | Karaguá",
      maxZoom: 18,
    }).addTo(this._map);

    this._loadGeoJSONFiles();
    if (this._csvUrl) this._loadCSVData();
    this._addLegend();

    this.dispatchEvent(
      new CustomEvent("map-ready", {
        detail: { map: this._map },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _loadGeoJSONFiles() {
    const defaults = [
      { file: "mapUC.geojson", color: "#4E8748" },
      { file: "costeira.geojson", color: "#4E8748" },
      { file: "mangue.geojson", color: "#4E8748" },
      { file: "map.geojson", color: "#0062ff", fillColor: "#8fc9ff", fillOpacity: 0.01 },
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

  _loadCSVData() {
    const iconBase = { iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] };
    const monitoramentoIcon = L.icon({ iconUrl: "./images/icon/Monitoramento.png", ...iconBase });
    const floraIcon = L.icon({
      iconUrl: "./images/icon/Flora.png",
      iconSize: [26, 26],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
    const faunaIcon = L.icon({
      iconUrl: "./images/icon/Fauna.png",
      iconSize: [26, 26],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    fetch(this._csvUrl)
      .then((r) => r.text())
      .then((csv) => {
        csv
          .trim()
          .split("\n")
          .slice(1)
          .forEach((linha) => {
            const col = linha.split(",");
            if (col.length < 5) return;
            const nome = col[0]?.trim();
            const lat = parseFloat(col[1]?.replace(",", "."));
            const lng = parseFloat(col[2]?.replace(",", "."));
            const dados = col[3]?.trim();
            const tipo = col[4]?.trim().toLowerCase();
            let icon = monitoramentoIcon;
            if (tipo === "flora") icon = floraIcon;
            if (tipo === "fauna") icon = faunaIcon;
            if (!isNaN(lat) && !isNaN(lng)) {
              const marker = L.marker([lat, lng], { icon })
                .addTo(this._map)
                .bindPopup(`<b>${nome}</b><br>${dados}`);
              this._markers.push(marker);
            }
          });
      })
      .catch((err) => console.error("Erro ao carregar CSV:", err));
  }

  _addLegend() {
    const legenda = L.control({ position: "bottomright" });
    legenda.onAdd = () => {
      const div = L.DomUtil.create("div", "info legend");
      div.innerHTML = `
        <img src="./images/icon/Monitoramento.png" width="20"> Áreas de Monitoramento<br>
        <img src="./images/icon/Flora.png" width="20"> Comunidade/APP<br>
        <img src="./images/icon/Fauna.png" width="20"> Berçários da Fauna Local
      `;
      return div;
    };
    legenda.addTo(this._map);
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
