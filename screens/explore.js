// Explore: search, filters, sort, list or map
const Explore = {
  q: "",
  sort: "best",
  view: "list",
  f: null,
  selectedPin: null,
  reset() {
    this.q = "";
    this.f = { types: [], age: "any", time: "any", distance: "any", facilities: [], free: false, rainy: false };
  },
  activeCount() {
    const f = this.f;
    return f.types.length + f.facilities.length + (f.age !== "any") + (f.time !== "any") + (f.distance !== "any") + f.free + f.rainy;
  },
};
Explore.reset();

const TIME_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "short", label: "Under 1 hr" },
  { value: "medium", label: "1–2 hrs" },
  { value: "long", label: "2 hrs +" },
];
const SORT_OPTIONS = [
  { value: "best", label: "Best match" },
  { value: "nearest", label: "Nearest" },
  { value: "shortest", label: "Shortest" },
  { value: "popular", label: "Most popular" },
];

function exploreResults() {
  const { q, f, sort } = Explore;
  const term = q.trim().toLowerCase();
  let list = ACTIVITIES.filter((a) => {
    if (term) {
      const hay = [a.name, a.location, a.type, a.description, regionById(a.region)?.name, ...a.highlights].join(" ").toLowerCase();
      if (!term.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    if (f.types.length && !f.types.includes(a.type)) return false;
    if (f.age !== "any") {
      const g = AGE_GROUPS.find((x) => x.id === f.age);
      if (a.ageMax < g.min || a.ageMin > g.max) return false;
    }
    if (f.time === "short" && a.durationMins >= 60) return false;
    if (f.time === "medium" && (a.durationMins < 60 || a.durationMins > 120)) return false;
    if (f.time === "long" && a.durationMins < 120) return false;
    if (f.distance !== "any") {
      const km = distanceKm(a);
      if (km != null && km > unitToKm(Number(f.distance))) return false;
    }
    if (f.facilities.some((x) => !a.facilities.includes(x))) return false;
    if (f.free && !a.free) return false;
    if (f.rainy && !a.rainy) return false;
    return true;
  });
  const sorters = {
    best: (a, b) => matchScore(b) - matchScore(a),
    nearest: (a, b) => (distanceKm(a) ?? 0) - (distanceKm(b) ?? 0),
    shortest: (a, b) => a.durationMins - b.durationMins,
    popular: (a, b) => b.popularity - a.popularity,
  };
  return list.sort(sorters[sort]);
}

function renderExplore() {
  UI.screen({
    tab: "explore",
    top: UI.title("Explore"),
    html: `
      <div class="search-wrap">
        <span class="search-icon" aria-hidden="true">🔍</span>
        <input id="search" class="input search" type="search" placeholder="Search places, towns, regions…" value="${esc(Explore.q)}" autocomplete="off" enterkeyhint="search" aria-label="Search" />
      </div>
      <div class="toolbar">
        <button class="btn btn-secondary small" id="open-filters">⚙️ Filters<span id="filter-count"></span></button>
        <label class="select-wrap small">
          <span class="sr-only">Sort by</span>
          <select id="sort">${SORT_OPTIONS.map((o) => `<option value="${o.value}" ${o.value === Explore.sort ? "selected" : ""}>${o.label}</option>`).join("")}</select>
        </label>
        <div class="segmented small" role="group" aria-label="View">
          <button data-view="list" aria-pressed="${Explore.view === "list"}">☰ List</button>
          <button data-view="map" aria-pressed="${Explore.view === "map"}">🗺️ Map</button>
        </div>
      </div>
      <div id="active-filters"></div>
      <div id="results" aria-live="polite"></div>`,
  });

  $("#search").addEventListener("input", (e) => { Explore.q = e.target.value; drawResults(); });
  $("#search").addEventListener("keydown", (e) => { if (e.key === "Enter") e.target.blur(); });
  $("#sort").addEventListener("change", (e) => { Explore.sort = e.target.value; drawResults(); });
  $$("[data-view]").forEach((b) => b.addEventListener("click", () => {
    Explore.view = b.dataset.view;
    $$("[data-view]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    drawResults();
  }));
  $("#open-filters").addEventListener("click", openFilters);
  drawResults();
}

function drawResults() {
  const list = exploreResults();
  const n = Explore.activeCount();
  $("#filter-count").textContent = n ? ` (${n})` : "";
  $("#active-filters").innerHTML = n
    ? `<div class="result-line"><span>${list.length} place${list.length === 1 ? "" : "s"} found</span><button class="btn-link" id="clear-filters">Clear filters</button></div>`
    : `<div class="result-line"><span>${list.length} place${list.length === 1 ? "" : "s"} in ${esc(areaName())}</span></div>`;
  const clear = $("#clear-filters");
  if (clear) clear.addEventListener("click", () => { const q = Explore.q; Explore.reset(); Explore.q = q; drawResults(); });

  const box = $("#results");
  if (!list.length) {
    box.innerHTML = emptyHTML("🔍", "No places match", "Try removing a filter or searching for something else.");
    return;
  }
  if (Explore.view === "list") {
    box.innerHTML = `<div class="card-list">${list.map((a) => cardHTML(a)).join("")}</div>`;
  } else {
    box.innerHTML = mapHTML(list);
    bindMap(list);
  }
}

// ---------- Placeholder map ----------
const MAP_BOUNDS = { north: 58.9, south: 54.6, west: -7.2, east: -1.5 };
function mapPos(lat, lng) {
  const x = ((lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * 100;
  const y = ((MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * 100;
  return `left:${x.toFixed(1)}%;top:${y.toFixed(1)}%`;
}
function mapHTML(list) {
  const me = refPoint();
  const sel = list.find((a) => a.id === Explore.selectedPin) || null;
  return `
    <div class="map" role="region" aria-label="Map of places (preview)">
      <span class="map-note">Map preview – a real map is coming soon</span>
      ${me ? `<span class="map-me" style="${mapPos(me.lat, me.lng)}" title="You"></span>` : ""}
      ${list.map((a) => `<button class="pin${sel && sel.id === a.id ? " on" : ""}" data-pin="${a.id}" style="${mapPos(a.lat, a.lng)}" aria-label="${esc(a.name)}">${a.emoji}</button>`).join("")}
    </div>
    <div id="pin-card">${sel ? cardHTML(sel) : `<p class="muted center">Tap a pin to see the place.</p>`}</div>`;
}
function bindMap(list) {
  $$("[data-pin]").forEach((b) => b.addEventListener("click", () => {
    Explore.selectedPin = b.dataset.pin;
    $$("[data-pin]").forEach((x) => x.classList.toggle("on", x === b));
    $("#pin-card").innerHTML = cardHTML(byId(b.dataset.pin));
  }));
}

// ---------- Filters panel ----------
function openFilters() {
  const f = Explore.f;
  const unit = Store.s.units === "miles" ? "miles" : "km";
  const hasRef = !!refPoint();
  const body = `
    <h3 class="field-label">Type of place</h3>
    ${chipGroup("types", Object.keys(TYPES).map((t) => ({ value: t, label: `${TYPES[t]} ${t}` })), f.types)}

    <h3 class="field-label">Suitable for age</h3>
    ${chipGroup("age", AGE_GROUPS.map((g) => ({ value: g.id, label: g.label })), [f.age], { multi: false })}

    <h3 class="field-label">How long</h3>
    ${chipGroup("time", TIME_OPTIONS, [f.time], { multi: false })}

    <h3 class="field-label">Distance</h3>
    ${hasRef
      ? chipGroup("distance", [{ value: "any", label: "Any" }, ...[5, 10, 25, 50].map((d) => ({ value: String(d), label: `Within ${d} ${unit}` }))], [f.distance], { multi: false })
      : `<p class="muted small-text">Set your area in Profile to filter by distance.</p>`}

    <h3 class="field-label">Facilities</h3>
    ${chipGroup("facilities", Object.keys(FACILITIES).map((k) => ({ value: k, label: `${FACILITIES[k].icon} ${FACILITIES[k].label}` })), f.facilities)}

    <h3 class="field-label">Other</h3>
    ${chipGroup("other", [{ value: "free", label: "💷 Free only" }, { value: "rainy", label: "☔ Good on rainy days" }], [f.free && "free", f.rainy && "rainy"].filter(Boolean))}

    <div class="sheet-actions">
      <button class="btn btn-secondary" id="f-reset">Reset</button>
      <button class="btn btn-primary" id="f-apply">Show results</button>
    </div>`;

  openSheet("Filters", body, (sheet) => {
    bindChipGroups(sheet);
    $("#f-reset", sheet).addEventListener("click", () => { const q = Explore.q; Explore.reset(); Explore.q = q; closeSheet(); drawResults(); });
    $("#f-apply", sheet).addEventListener("click", () => {
      const other = chipValues(sheet, "other");
      Explore.f = {
        types: chipValues(sheet, "types"),
        age: chipValues(sheet, "age")[0] || "any",
        time: chipValues(sheet, "time")[0] || "any",
        distance: hasRef ? chipValues(sheet, "distance")[0] || "any" : "any",
        facilities: chipValues(sheet, "facilities"),
        free: other.includes("free"),
        rainy: other.includes("rainy"),
      };
      closeSheet();
      drawResults();
    });
  });
}
