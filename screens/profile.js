// Profile & settings
function renderProfile() {
  const s = Store.s;
  const kids = s.children.length
    ? s.children.map((k) => `${esc(k.name || "Child")} (${ageLabel(k.age)})`).join(", ")
    : "Not added yet";
  const needs = s.needs.length ? s.needs.map((n) => FACILITIES[n].label).join(", ") : "None chosen";
  const row = (href, icon, title, sub = "") =>
    `<a class="menu-row" href="${href}"><span class="menu-icon">${icon}</span><span class="menu-text"><strong>${title}</strong>${sub ? `<small>${sub}</small>` : ""}</span><span class="chev">›</span></a>`;

  UI.screen({
    tab: "profile",
    top: UI.title("Profile"),
    html: `
      <div class="family-card">
        <span class="family-emoji">👨‍👩‍👧‍👦</span>
        <div>
          <strong>Your family</strong>
          <p>${s.children.length ? `${s.children.length} explorer${s.children.length > 1 ? "s" : ""} · ${s.visits.length} adventure${s.visits.length === 1 ? "" : "s"} · ${earnedBadges().length} badge${earnedBadges().length === 1 ? "" : "s"}` : "Add your children to get personalised ideas"}</p>
        </div>
      </div>

      <h2 class="section-title">Your family</h2>
      <div class="menu">
        ${row("#/profile/children", "🧒", "Children", kids)}
        ${row("#/profile/needs", "✅", "What matters to you", needs)}
      </div>

      <h2 class="section-title">Settings</h2>
      <div class="menu">
        ${row("#/profile/area", "📍", "Your area", esc(areaName()))}
        <div class="menu-row static">
          <span class="menu-icon">📏</span><span class="menu-text"><strong>Distances in</strong></span>
          <div class="segmented small" role="group" aria-label="Distance units">
            <button data-units="miles" aria-pressed="${s.units === "miles"}">Miles</button>
            <button data-units="km" aria-pressed="${s.units === "km"}">Km</button>
          </div>
        </div>
      </div>

      <h2 class="section-title">More</h2>
      <div class="menu">
        ${row("#/suggest/mine", "📬", "Your suggestions", `${s.suggestions.length} sent`)}
        ${row("#/help", "❓", "Help & questions")}
        <button class="menu-row" id="feedback"><span class="menu-icon">💬</span><span class="menu-text"><strong>Send feedback</strong></span><span class="chev">›</span></button>
        ${row("#/about", "🌿", `About ${CONFIG.appName}`)}
        <button class="menu-row danger" id="reset"><span class="menu-icon">🗑️</span><span class="menu-text"><strong>Clear all my data</strong><small>Removes everything saved on this phone</small></span></button>
      </div>
      <p class="muted center small-text">Version 0.2 · Placeholder content</p>`,
  });

  $$("[data-units]").forEach((b) => b.addEventListener("click", () => {
    Store.update((st) => { st.units = b.dataset.units; });
    $$("[data-units]").forEach((x) => x.setAttribute("aria-pressed", x === b));
  }));
  $("#feedback").addEventListener("click", () => {
    if (CONFIG.feedbackEmail) location.href = `mailto:${CONFIG.feedbackEmail}?subject=${encodeURIComponent(CONFIG.appName + " feedback")}`;
    else toast("Feedback is coming soon 💬");
  });
  $("#reset").addEventListener("click", () => {
    if (!confirm("This will remove your children, saved places, lists, visits and badges from this phone. Continue?")) return;
    Store.reset();
    location.hash = "#/welcome";
  });
}

function renderProfileChildren() {
  UI.screen({
    tab: "profile",
    top: UI.backBar("Children", "#/profile"),
    html: `<p class="muted">We use your children's ages to pick places that suit them.</p><div id="kids">${childrenEditorHTML()}</div>`,
  });
  bindChildrenEditor($("#kids"), renderProfileChildren);
}

function renderProfileNeeds() {
  UI.screen({
    tab: "profile",
    top: UI.backBar("What matters to you", "#/profile"),
    html: `<p class="muted">We'll show places with these first.</p><div id="needs">${needsPickerHTML()}</div>`,
  });
  bindNeedsPicker($("#needs"), (vals) => Store.update((s) => { s.needs = vals; }));
}

function renderProfileArea() {
  UI.screen({
    tab: "profile",
    top: UI.backBar("Your area", "#/profile"),
    html: `<p class="muted">We'll show places near you first and work out distances.</p><div id="area">${areaPickerHTML()}</div>`,
  });
  bindAreaPicker($("#area"), renderProfileArea);
}

function renderHelp() {
  UI.screen({
    tab: "profile",
    top: UI.backBar("Help & questions", "#/profile"),
    html: `<div class="faq">${FAQ.map((f) => `<details class="faq-item"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div>`,
  });
}

function renderAbout() {
  UI.screen({
    tab: "profile",
    top: UI.backBar("About", "#/profile"),
    html: `
      <section class="welcome-hero small">
        <img src="icons/icon.svg" alt="" width="88" height="88" />
        <h2>${CONFIG.appName}</h2>
        <p>Helping parents and caregivers across Scotland find family-friendly walks, trails, parks and gardens for children aged 0–12.</p>
        <p class="muted small-text">Always check conditions, opening times and weather before you head out. Places in this early version are examples only.</p>
      </section>`,
  });
}

function renderNotFound() {
  UI.screen({
    top: UI.title("Oops"),
    html: emptyHTML("🙈", "We couldn't find that", "It may have been moved or removed.", `<a class="btn btn-primary" href="#/">Back to home</a>`),
  });
}
