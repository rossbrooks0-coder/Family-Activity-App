// Home screen
let homeType = "All";

const RADIUS_OPTIONS = [5, 10, 20, 30, 50];

function renderHome() {
  const season = currentSeason();
  const seasonInfo = {
    spring: { title: "Spring adventures", icon: "🌸" },
    summer: { title: "Summer days out", icon: "☀️" },
    autumn: { title: "Autumn adventures", icon: "🍂" },
    winter: { title: "Winter days out", icon: "❄️" },
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

  const hasRef = !!refPoint();
  const r = Store.s.homeRadius;
  const rangeLabel = !hasRef ? "Set your area" : r ? `Within ${r} ${unitShort()}` : "Any distance";

  let body;
  if (!ranked.length) {
    body = emptyHTML("🔭", "Nothing found nearby",
      r ? `There are no ${homeType === "All" ? "places" : homeType.toLowerCase() + "s"} within ${r} ${unitShort()} yet. Try a bigger range.` : "Try another type of place.",
      r ? `<button class="btn btn-primary" id="widen">Show further away</button>` : "");
  } else {
    body = `
      <h2 class="section-title">Picked for you</h2>
      ${!Store.s.children.length ? `<a class="nudge" href="#/profile/children">👶 Add your children's ages for better suggestions →</a>` : ""}
      ${row(picked, true)}

      ${seasonal.length ? `<h2 class="section-title">${seasonInfo.icon} ${seasonInfo.title}</h2>${row(seasonal)}` : ""}

      <h2 class="section-title">Browse all <span class="count">${ranked.length}</span></h2>
      <div class="card-list">${ranked.map((a) => cardHTML(a)).join("")}</div>`;
  }

  UI.screen({
    tab: "home",
    top: `<a class="avatar-link" href="#/profile" aria-label="Your profile">${avatarHTML(48)}</a>
          <div class="spacer"></div>
          <button class="range-pill" id="range">📍 ${rangeLabel} <span aria-hidden="true">▾</span></button>`,
    html: `
      <div class="chips" role="group" aria-label="Type of place">
        ${types.map((t) => `<button class="chip" data-type="${t}" aria-pressed="${t === homeType}">${TYPES[t] ? TYPES[t] + " " : ""}${t}</button>`).join("")}
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
    <p class="muted">Measured from <strong>${esc(areaName())}</strong> · <a class="link" href="#/profile/area">Change</a></p>
    <div class="radio-list">
      ${[...RADIUS_OPTIONS.map((r) => ({ v: String(r), label: `${r} ${unit}` })), { v: "any", label: "Any distance" }]
        .map((o) => `<button type="button" class="radio-row" data-r="${o.v}" aria-pressed="${o.v === current}"><span>${o.label}</span><span class="tick">✓</span></button>`).join("")}
    </div>`, (sheet) => {
    $$("[data-r]", sheet).forEach((b) => b.addEventListener("click", () => {
      Store.update((s) => { s.homeRadius = b.dataset.r === "any" ? null : Number(b.dataset.r); });
      closeSheet();
      renderHome();
    }));
  });
}
