// Home screen
let homeType = "All";

const RADIUS_OPTIONS = [5, 10, 20, 30, 50];

function renderHome() {
  const season = currentSeason();
  const seasonTitle = {
    spring: "Spring days out",
    summer: "Summer days out",
    autumn: "Autumn days out",
    winter: "Winter days out",
  }[season];

  // Everything on the home page is limited to the chosen type and range
  const ranked = ACTIVITIES
    .filter((a) => homeType === "All" || a.type === homeType)
    .filter(withinHomeRange)
    .sort((a, b) => matchScore(b) - matchScore(a));
  const picked = ranked.slice(0, 5);
  const seasonal = ranked.filter((a) => a.seasons.includes(season)).slice(0, 6);
  const types = ["All", ...Object.keys(TYPES)];

  const row = (list, reason) => `<div class="hscroll">${list.map((a) => cardHTML(a, { compact: true, reason: reason ? matchReason(a) : "" })).join("")}</div>`;
  const heading = (text, extra = "") => `<h2 class="trail-title"><span>${text}</span>${extra}</h2>`;

  const hasRef = !!refPoint();
  const r = Store.s.homeRadius;
  const rangeLabel = !hasRef ? "Set your area" : r ? `Within ${r} ${unitShort()}` : "Any distance";
  const plural = homeType === "All" ? "places" : pluralType(homeType).toLowerCase();

  let body;
  if (!ranked.length) {
    body = emptyHTML("telescope", `No ${plural} nearby yet`,
      r ? `Nothing within ${r} ${unitShort()} so far. Try a wider range.` : "Try another type of place",
      r ? `<button class="btn btn-primary" id="widen">Show further away</button>` : "");
  } else {
    body = `
      ${heading("Picked for you")}
      ${!Store.s.children.length ? `<a class="hint-row" href="#/profile/children">${icon("baby", 18)}<span>Add your children's ages for better picks</span>${icon("chevron-right", 18)}</a>` : ""}
      ${row(picked, true)}

      ${seasonal.length ? heading(seasonTitle) + row(seasonal) : ""}

      ${heading("All places", `<span class="count">${ranked.length}</span>`)}
      <div class="card-list">${ranked.map((a) => cardHTML(a)).join("")}</div>`;
  }

  UI.screen({
    tab: "home",
    top: `<a class="avatar-link" href="#/profile" aria-label="Your profile">${avatarHTML(40)}</a>
          <div class="spacer"></div>
          <button class="range-btn" id="range">${icon("map-pin", 16)}<span>${rangeLabel}</span>${icon("chevron-down", 16)}</button>`,
    html: `
      <div class="type-row" role="group" aria-label="Type of place">
        ${types.map((t) => `<button class="type-chip" data-type="${t}" aria-pressed="${t === homeType}">${t === "All" ? "All" : pluralType(t)}</button>`).join("")}
      </div>
      ${body}`,
  });

  $$("[data-type]").forEach((b) => b.addEventListener("click", () => {
    homeType = b.dataset.type;
    renderHome();
  }));
  $("#range").addEventListener("click", () => (hasRef ? openRangePicker() : (location.hash = "#/profile/area")));
  const widen = $("#widen");
  if (widen) widen.addEventListener("click", () => { Store.update((s) => { s.homeRadius = null; }); renderHome(); });
}

function openRangePicker() {
  const unit = unitShort();
  const current = Store.s.homeRadius ? String(Store.s.homeRadius) : "any";
  openSheet("Show places within", `
    <p class="sheet-note">Measured from ${esc(areaName())} · <a class="link" href="#/profile/area">Change</a></p>
    <div class="choice-list">
      ${[...RADIUS_OPTIONS.map((r) => ({ v: String(r), label: `${r} ${unit}` })), { v: "any", label: "Any distance" }]
        .map((o) => `<button type="button" class="choice" data-r="${o.v}" aria-pressed="${o.v === current}"><span>${o.label}</span>${icon("check", 18)}</button>`).join("")}
    </div>`, (sheet) => {
    $$("[data-r]", sheet).forEach((b) => b.addEventListener("click", () => {
      Store.update((s) => { s.homeRadius = b.dataset.r === "any" ? null : Number(b.dataset.r); });
      closeSheet();
      renderHome();
    }));
  });
}
