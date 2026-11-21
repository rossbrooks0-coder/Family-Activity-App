// Home screen
let homeType = "All";

function renderHome() {
  const season = currentSeason();
  const seasonInfo = {
    spring: { title: "Spring adventures", icon: "🌸" },
    summer: { title: "Summer days out", icon: "☀️" },
    autumn: { title: "Autumn adventures", icon: "🍂" },
    winter: { title: "Winter days out", icon: "❄️" },
  }[season];

  const ranked = [...ACTIVITIES].sort((a, b) => matchScore(b) - matchScore(a));
  const picked = ranked.slice(0, 5);
  const seasonal = ranked.filter((a) => a.seasons.includes(season)).slice(0, 6);
  const rainy = ranked.filter((a) => a.rainy);
  const types = ["All", ...Object.keys(TYPES)];
  const all = ranked.filter((a) => homeType === "All" || a.type === homeType);

  const row = (list, reason) => `<div class="hscroll">${list.map((a) => cardHTML(a, { compact: true, reason: reason ? matchReason(a) : "" })).join("")}</div>`;

  const quick = [
    { id: "short", icon: "⏱️", label: "Under 1 hour" },
    { id: "rainy", icon: "☔", label: "Rainy day" },
    { id: "free", icon: "💷", label: "Free" },
    { id: "pushchair", icon: "👶", label: "Pushchair friendly" },
  ];

  UI.screen({
    tab: "home",
    top: `<h1>🌿 ${CONFIG.appName}</h1><div class="spacer"></div>
          <a class="area-pill" href="#/profile/area" aria-label="Change area">📍 ${esc(areaName())}</a>`,
    html: `
      <div class="quick-grid">
        ${quick.map((q) => `<button class="quick" data-quick="${q.id}"><span>${q.icon}</span>${q.label}</button>`).join("")}
      </div>

      <h2 class="section-title">Picked for you</h2>
      ${!Store.s.children.length ? `<a class="nudge" href="#/profile/children">👶 Add your children's ages for better suggestions →</a>` : ""}
      ${row(picked, true)}

      <h2 class="section-title">${seasonInfo.icon} ${seasonInfo.title}</h2>
      ${row(seasonal)}

      <h2 class="section-title">☔ Rainy day backups</h2>
      ${row(rainy)}

      <h2 class="section-title">Browse all</h2>
      <div class="chips" role="group" aria-label="Filter by type">
        ${types.map((t) => `<button class="chip" data-type="${t}" aria-pressed="${t === homeType}">${TYPES[t] ? TYPES[t] + " " : ""}${t}</button>`).join("")}
      </div>
      <div class="card-list">${all.map((a) => cardHTML(a)).join("") || emptyHTML("🔍", "Nothing here yet", "Try another type.")}</div>`,
  });

  $$("[data-type]").forEach((b) => b.addEventListener("click", () => {
    homeType = b.dataset.type;
    const y = window.scrollY;
    renderHome();
    window.scrollTo(0, y);
  }));
  $$("[data-quick]").forEach((b) => b.addEventListener("click", () => {
    Explore.reset();
    const q = b.dataset.quick;
    if (q === "short") Explore.f.time = "short";
    if (q === "rainy") Explore.f.rainy = true;
    if (q === "free") Explore.f.free = true;
    if (q === "pushchair") Explore.f.facilities = ["pushchair"];
    location.hash = "#/explore";
  }));
}
