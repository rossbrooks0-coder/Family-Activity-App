// Little Explorers – a tiny app with no frameworks.
// Pages are chosen by the part of the web address after "#", e.g. #/activity/lakeside-loop

const app = document.getElementById("app");
const topbar = document.getElementById("topbar");

// ---------- Saved activities (remembered on this phone only) ----------
function getSaved() {
  try { return JSON.parse(localStorage.getItem("saved") || "[]"); } catch { return []; }
}
function toggleSaved(id) {
  const saved = getSaved();
  const next = saved.includes(id) ? saved.filter((s) => s !== id) : [...saved, id];
  try { localStorage.setItem("saved", JSON.stringify(next)); } catch {}
  return next.includes(id);
}

// ---------- Helpers ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function cardHTML(a) {
  return `
    <a class="card" href="#/activity/${a.id}">
      <div class="photo" style="--c:${a.colour}" role="img" aria-label="Photo placeholder for ${esc(a.name)}">
        <span class="badge">${esc(a.category)}</span>
        ${a.emoji}
        <span class="label">Photo coming soon</span>
      </div>
      <div class="card-body">
        <h3>${esc(a.name)}</h3>
        <div class="meta">
          <span>📍 ${esc(a.location)}</span>
          <span>⏱️ ${esc(a.duration)}</span>
        </div>
        <div class="tags">${a.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      </div>
    </a>`;
}

function setTopbar(html) { topbar.innerHTML = html; }
function setActiveTab(tab) {
  document.querySelectorAll(".bottom-nav a").forEach((a) => {
    const on = a.dataset.tab === tab;
    a.classList.toggle("active", on);
    if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
}

// ---------- Screens ----------
let homeFilter = "All";

function renderHome() {
  setActiveTab("home");
  setTopbar(`<h1>🌿 Little Explorers</h1>`);
  const categories = ["All", ...new Set(ACTIVITIES.map((a) => a.category))];
  const list = homeFilter === "All" ? ACTIVITIES : ACTIVITIES.filter((a) => a.category === homeFilter);

  app.innerHTML = `
    <section class="greeting">
      <h2>Where shall we go today?</h2>
      <p>Family-friendly outdoor adventures for ages 0–12.</p>
    </section>

    <div class="chips" role="group" aria-label="Filter by type">
      ${categories.map((c) => `<button class="chip" data-cat="${esc(c)}" aria-pressed="${c === homeFilter}">${esc(c)}</button>`).join("")}
    </div>

    <h2 class="section-title">Nearby ideas</h2>
    <div class="card-list">${list.map(cardHTML).join("")}</div>`;

  app.querySelectorAll(".chip").forEach((btn) =>
    btn.addEventListener("click", () => { homeFilter = btn.dataset.cat; renderHome(); })
  );
}

function renderDetail(id) {
  const a = ACTIVITIES.find((x) => x.id === id);
  if (!a) return renderNotFound();
  setActiveTab("home");
  const isSaved = getSaved().includes(a.id);

  setTopbar(`
    <button class="icon-btn" id="back" aria-label="Back">←</button>
    <div class="spacer"></div>
    <button class="icon-btn" id="share" aria-label="Share">📤</button>`);

  app.innerHTML = `
    <article class="detail">
      <div class="photo" style="--c:${a.colour}" role="img" aria-label="Photo placeholder for ${esc(a.name)}">
        ${a.emoji}
        <span class="label">Photo coming soon</span>
      </div>
      <h2>${esc(a.name)}</h2>
      <p class="location">📍 ${esc(a.location)}</p>

      <div class="facts">
        <div class="fact"><div class="k">Time</div><div class="v">${esc(a.duration)}</div></div>
        <div class="fact"><div class="k">Distance</div><div class="v">${esc(a.distance)}</div></div>
        <div class="fact"><div class="k">Ages</div><div class="v">${esc(a.ages)}</div></div>
      </div>

      <div class="tags">${a.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>

      <h3>About</h3>
      <p>${esc(a.description)}</p>

      <h3>Kids will love</h3>
      <ul>${a.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>

      <div class="actions">
        <button class="btn btn-secondary" id="save" aria-pressed="${isSaved}">${isSaved ? "❤️ Saved" : "🤍 Save"}</button>
        <a class="btn btn-primary" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.location)}" target="_blank" rel="noopener">🗺️ Directions</a>
      </div>
    </article>`;

  document.getElementById("back").addEventListener("click", () => {
    if (history.length > 1) history.back(); else location.hash = "#/";
  });
  document.getElementById("share").addEventListener("click", async () => {
    const data = { title: a.name, text: `${a.name} – ${a.location}`, url: location.href };
    if (navigator.share) { try { await navigator.share(data); } catch {} }
    else { try { await navigator.clipboard.writeText(location.href); alert("Link copied!"); } catch {} }
  });
  const saveBtn = document.getElementById("save");
  saveBtn.addEventListener("click", () => {
    const on = toggleSaved(a.id);
    saveBtn.setAttribute("aria-pressed", on);
    saveBtn.textContent = on ? "❤️ Saved" : "🤍 Save";
  });
}

function renderSaved() {
  setActiveTab("saved");
  setTopbar(`<h1>Saved</h1>`);
  const saved = ACTIVITIES.filter((a) => getSaved().includes(a.id));
  app.innerHTML = saved.length
    ? `<div class="card-list">${saved.map(cardHTML).join("")}</div>`
    : `<div class="empty"><div class="big">🤍</div><h2>Nothing saved yet</h2><p>Tap “Save” on any activity to keep it here for later.</p></div>`;
}

function renderPlaceholder(tab, title, emoji, text) {
  setActiveTab(tab);
  setTopbar(`<h1>${title}</h1>`);
  app.innerHTML = `<div class="empty"><div class="big">${emoji}</div><h2>Coming soon</h2><p>${text}</p></div>`;
}

function renderNotFound() {
  setActiveTab("");
  setTopbar(`<h1>Oops</h1>`);
  app.innerHTML = `<div class="empty"><div class="big">🙈</div><h2>We couldn’t find that</h2><p><a href="#/" style="color:var(--green-dark);font-weight:700">Back to home</a></p></div>`;
}

// ---------- Router ----------
function route() {
  const path = location.hash.replace(/^#/, "") || "/";
  const [, page, id] = path.split("/");
  if (!page) renderHome();
  else if (page === "activity") renderDetail(decodeURIComponent(id || ""));
  else if (page === "explore") renderPlaceholder("explore", "Explore", "🗺️", "Search and a map of activities near you will live here.");
  else if (page === "saved") renderSaved();
  else if (page === "profile") renderPlaceholder("profile", "Profile", "👨‍👩‍👧", "Add your children’s ages to get personalised ideas.");
  else renderNotFound();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
route();

// ---------- Offline support / installability ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
