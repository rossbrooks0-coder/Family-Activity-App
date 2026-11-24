// Explore: search, type bar, sort and filters
const Explore = {
  q: "",
  type: "All",
  sort: "best",
  typeScroll: 0,
  f: null,
  reset() {
    this.f = { age: "any", time: "any", distance: "any", facilities: [], free: false, rainy: false };
  },
  activeCount() {
    const f = this.f;
    return f.facilities.length + (f.age !== "any") + (f.time !== "any") + (f.distance !== "any") + f.free + f.rainy;
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
  { value: "best",     label: "Suits my kids", icon: "users" },
  { value: "nearest",  label: "Closest",       icon: "map-pin" },
  { value: "shortest", label: "Shortest",      icon: "clock" },
  { value: "popular",  label: "Most popular",  icon: "star" },
  { value: "newest",   label: "Newly added",   icon: "calendar" },
];

function exploreResults() {
  const { q, f, sort, type } = Explore;
  const term = q.trim().toLowerCase();
  let list = ACTIVITIES.filter((a) => {
    if (term) {
      const hay = [a.name, a.location, a.type, a.description, ...a.highlights].join(" ").toLowerCase();
      if (!term.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    if (type !== "All" && a.type !== type) return false;
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
    // places are listed in data.js oldest first, so later ones are newer
    newest: (a, b) => ACTIVITIES.indexOf(b) - ACTIVITIES.indexOf(a),
  };
  return list.sort(sorters[sort]);
}

function renderExplore() {
  UI.screen({
    tab: "explore",
    html: `
      <div class="search-row">
        <a class="avatar-link" href="#/profile" aria-label="Your profile">${avatarHTML(52)}</a>
        <div class="search-wrap">
          <span class="search-icon">${icon("search", 18)}</span>
          <input id="search" class="input search" type="search" placeholder="Search" value="${esc(Explore.q)}" autocomplete="off" enterkeyhint="search" aria-label="Search" />
          <button class="search-filter" id="open-filters" aria-label="Filters">${icon("list-filter", 20)}<span id="filter-count" class="count-badge"></span></button>
        </div>
      </div>
      ${typeRowHTML(Explore.type)}
      <div id="result-line"></div>
      <div id="results" aria-live="polite"></div>`,
  });

  $("#search").addEventListener("input", (e) => { Explore.q = e.target.value; drawResults(); });
  $("#search").addEventListener("keydown", (e) => { if (e.key === "Enter") e.target.blur(); });
  $("#open-filters").addEventListener("click", openFilters);

  // Type bar: only the results redraw, so the bar stays where it's scrolled to
  const typeRow = $(".type-row");
  typeRow.scrollLeft = Explore.typeScroll;
  typeRow.addEventListener("scroll", () => { Explore.typeScroll = typeRow.scrollLeft; }, { passive: true });
  $$("[data-type]").forEach((b) => b.addEventListener("click", () => {
    Explore.type = b.dataset.type;
    $$("[data-type]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    drawResults();
  }));
  drawResults();
}

function drawResults() {
  const list = exploreResults();
  const n = Explore.activeCount();
  const sort = SORT_OPTIONS.find((o) => o.value === Explore.sort);
  const noun = Explore.type === "All" ? (list.length === 1 ? "place" : "places") : (list.length === 1 ? Explore.type : pluralType(Explore.type)).toLowerCase();
  $("#filter-count").textContent = n ? String(n) : "";
  $("#open-filters").classList.toggle("on", n > 0);
  $("#result-line").innerHTML = `
    <div class="result-line">
      <span class="result-count">${list.length} ${noun}${n ? ` · <button class="btn-link inline" id="clear-filters">Clear filters</button>` : ""}</span>
      <button class="sort-btn" id="open-sort" aria-haspopup="dialog">${sort.label}${icon("chevron-down", 16)}</button>
    </div>`;
  $("#open-sort").addEventListener("click", openSort);
  const clear = $("#clear-filters");
  if (clear) clear.addEventListener("click", () => { Explore.reset(); drawResults(); });

  const box = $("#results");
  box.innerHTML = list.length
    ? `<div class="card-list">${list.map((a) => cardHTML(a)).join("")}</div>`
    : emptyHTML("search", "No places match", "Try another type, remove a filter or search for something else.");
}

// ---------- Sort panel ----------
function openSort() {
  const noLocation = !refPoint();
  openSheet("Sort", `
    <div class="sort-list">
      ${SORT_OPTIONS.map((o) => `<button type="button" class="sort-option" data-sort="${o.value}" aria-pressed="${o.value === Explore.sort}">
        ${icon(o.icon, 22)}<span>${o.label}${o.value === "nearest" && noLocation ? `<small>Turn on your location in Profile to use this</small>` : ""}</span>
      </button>`).join("")}
    </div>`, (sheet) => {
    $$("[data-sort]", sheet).forEach((b) => b.addEventListener("click", () => {
      Explore.sort = b.dataset.sort;
      closeSheet();
      drawResults();
    }));
  });
}

// ---------- Filters panel ----------
function openFilters() {
  const f = Explore.f;
  const unit = Store.s.units === "miles" ? "miles" : "km";
  const hasRef = !!refPoint();
  const body = `
    <h3 class="field-label">Suitable for age</h3>
    ${chipGroup("age", AGE_GROUPS.map((g) => ({ value: g.id, label: g.label })), [f.age], { multi: false })}

    <h3 class="field-label">How long</h3>
    ${chipGroup("time", TIME_OPTIONS, [f.time], { multi: false })}

    <h3 class="field-label">Distance</h3>
    ${hasRef
      ? chipGroup("distance", [{ value: "any", label: "Any" }, ...[5, 10, 25, 50].map((d) => ({ value: String(d), label: `Within ${d} ${unit}` }))], [f.distance], { multi: false })
      : `<p class="muted small-text">Turn on your location in Profile to filter by distance</p>`}

    <h3 class="field-label">Facilities</h3>
    ${chipGroup("facilities", facilityOptions(), f.facilities)}

    <h3 class="field-label">Other</h3>
    ${chipGroup("other", [{ value: "free", label: "Free only" }, { value: "rainy", label: "Good on rainy days", icon: "cloud-rain" }], [f.free && "free", f.rainy && "rainy"].filter(Boolean))}

    <div class="sheet-actions">
      <button class="btn btn-secondary" id="f-reset">Reset</button>
      <button class="btn btn-primary" id="f-apply">Show results</button>
    </div>`;

  openSheet("Filters", body, (sheet) => {
    bindChipGroups(sheet);
    $("#f-reset", sheet).addEventListener("click", () => { Explore.reset(); closeSheet(); drawResults(); });
    $("#f-apply", sheet).addEventListener("click", () => {
      const other = chipValues(sheet, "other");
      Explore.f = {
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
