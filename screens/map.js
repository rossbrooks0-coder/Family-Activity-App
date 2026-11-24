// Map: a real street map (OpenStreetMap, drawn with Leaflet) with a pin for each place
const MapView = { type: "All", center: null, zoom: null, selected: null, typeScroll: 0 };
let leafletMap = null;

// Leaflet 1.9.4 (vendor/leaflet) is only loaded the first time the map is opened, so the rest of the app stays fast
let leafletLoading = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve();
  if (leafletLoading) return leafletLoading;
  leafletLoading = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "vendor/leaflet/leaflet.css";
    document.head.appendChild(css);
    const js = document.createElement("script");
    js.src = "vendor/leaflet/leaflet.js";
    js.onload = resolve;
    js.onerror = () => { leafletLoading = null; js.remove(); reject(); };
    document.head.appendChild(js);
  });
  return leafletLoading;
}

function renderMap() {
  UI.screen({
    tab: "map",
    html: `
      <div class="map-page">
        <div id="leaflet" class="leaflet-host" aria-label="Map of places"></div>
        <div class="map-top">${typeRowHTML(MapView.type)}</div>
        <button class="map-locate" id="locate" aria-label="Show my location">${icon("locate-fixed", 20)}</button>
        <div class="map-card" id="map-card"></div>
        <div class="map-status" id="map-status">Loading map…</div>
      </div>`,
  });
  document.body.classList.add("map-mode");

  const typeRow = $(".map-top .type-row");
  typeRow.scrollLeft = MapView.typeScroll;
  typeRow.addEventListener("scroll", () => { MapView.typeScroll = typeRow.scrollLeft; }, { passive: true });
  $$("[data-type]").forEach((b) => b.addEventListener("click", () => {
    MapView.type = b.dataset.type;
    $$("[data-type]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    if (MapView.selected && !mapPlaces().some((a) => a.id === MapView.selected)) selectPlace(null);
    drawPins();
  }));

  $("#locate").addEventListener("click", () => {
    const go = () => leafletMap && Store.s.coords && leafletMap.setView([Store.s.coords.lat, Store.s.coords.lng], 11);
    if (Store.s.coords) return go();
    toast("Finding your location…");
    getPosition(
      (coords) => { Store.update((s) => { s.coords = coords; }); drawPins(); go(); },
      () => toast("Couldn't get your location. Allow location for this app in your phone's settings, then try again.")
    );
  });

  loadLeaflet()
    .then(() => { if ($("#leaflet")) setUpMap(); })
    .catch(() => { const s = $("#map-status"); if (s) s.textContent = "The map needs an internet connection. Try again when you're back online."; });
}

function mapPlaces() {
  return ACTIVITIES.filter((a) => MapView.type === "All" || a.type === MapView.type);
}

let pinLayer = null;
function setUpMap() {
  if (leafletMap) { leafletMap.remove(); leafletMap = null; }
  $("#map-status").hidden = true;
  leafletMap = L.map("leaflet", { zoomControl: false });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(leafletMap);
  pinLayer = L.layerGroup().addTo(leafletMap);

  const me = Store.s.coords;
  if (MapView.center) leafletMap.setView(MapView.center, MapView.zoom);
  else if (me) leafletMap.setView([me.lat, me.lng], 9);
  else leafletMap.fitBounds(L.latLngBounds(ACTIVITIES.map((a) => [a.lat, a.lng])), { padding: [40, 40] });

  leafletMap.on("moveend", () => { MapView.center = leafletMap.getCenter(); MapView.zoom = leafletMap.getZoom(); });
  leafletMap.on("click", () => selectPlace(null));
  drawPins();
  selectPlace(MapView.selected);
}

function drawPins() {
  if (!leafletMap || !pinLayer) return;
  pinLayer.clearLayers();
  const me = Store.s.coords;
  if (me) {
    L.circleMarker([me.lat, me.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#2f6c8c", fillOpacity: 1, interactive: false }).addTo(pinLayer);
  }
  mapPlaces().forEach((a) => {
    const on = a.id === MapView.selected;
    L.marker([a.lat, a.lng], {
      title: a.name,
      zIndexOffset: on ? 1000 : 0,
      icon: L.divIcon({ className: `map-pin${on ? " on" : ""}`, html: icon(TYPES[a.type], 18), iconSize: [36, 36], iconAnchor: [18, 18] }),
    }).on("click", (e) => { L.DomEvent.stopPropagation(e); selectPlace(a.id); }).addTo(pinLayer);
  });
}

function selectPlace(id) {
  MapView.selected = id;
  const box = $("#map-card");
  if (!box) return;
  const a = id && byId(id);
  if (!a) { box.innerHTML = ""; box.classList.remove("show"); drawPins(); return; }
  const dist = formatDistance(distanceKm(a));
  box.innerHTML = `
    <a class="map-place" href="#/activity/${a.id}">
      ${thumbHTML(TYPES[a.type])}
      <span class="row-text">
        <small>${esc(a.type)}</small>
        <strong>${esc(a.name)}</strong>
        <small>${esc(a.location)}${dist ? ` · ${dist}` : ""} · ${esc(a.duration)}</small>
      </span>
      ${icon("chevron-right", 18, "chev")}
    </a>`;
  box.classList.add("show");
  drawPins();
}
