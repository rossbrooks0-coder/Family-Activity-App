// Profile & settings
function renderProfile() {
  const s = Store.s;
  const kids = s.children.length
    ? s.children.map((k) => `${esc(k.name || "Child")} (${ageLabel(k.age)})`).join(", ")
    : "Not added yet";
  const needs = s.needs.length ? s.needs.map((n) => FACILITIES[n].label).join(", ") : "None chosen";
  const row = (href, ic, title, sub = "") =>
    `<a class="row link-row" href="${href}">${icon(ic, 18)}<span class="row-text"><strong>${title}</strong>${sub ? `<small>${sub}</small>` : ""}</span>${icon("chevron-right", 18, "chev")}</a>`;

  const badges = earnedBadges().length;
  UI.screen({
    tab: "",
    top: UI.backBar("Profile", "#/"),
    html: `
      <div class="family-card">
        <button class="family-photo" id="photo" aria-label="${s.photo ? "Change family photo" : "Add a family photo"}">
          ${avatarHTML(72)}<span class="photo-edit" aria-hidden="true">${icon("camera", 16)}</span>
        </button>
        <div class="family-info">
          <button class="family-name" id="family-name">
            ${s.familyName ? `<strong>${esc(s.familyName)}</strong>` : `<strong class="placeholder">Add your family name</strong>`}
            <span class="pencil" aria-hidden="true">${icon("pencil", 16)}</span><span class="sr-only">Edit family name</span>
          </button>
          <p>${s.children.length ? `${s.children.length} explorer${s.children.length > 1 ? "s" : ""} · ${s.visits.length} adventure${s.visits.length === 1 ? "" : "s"} · ${badges} badge${badges === 1 ? "" : "s"}` : "Add your children to get personalised ideas"}</p>
        </div>
      </div>

      <a class="suggest-card" href="#/suggest">
        ${thumbHTML("lightbulb")}
        <span class="row-text"><strong>Suggest a place</strong><small>Know a great family spot? Tell us about it</small></span>
        ${icon("chevron-right", 18, "chev")}
      </a>

      ${trailTitle("Your family")}
      <div class="list-card">
        ${row("#/profile/children", "users", "Children", kids)}
        ${row("#/profile/needs", "list-checks", "What matters to you", needs)}
      </div>

      ${trailTitle("Settings")}
      <div class="list-card">
        ${row("#/profile/area", "map-pin", "Location", s.coords ? "Using your location" : "Off")}
        <div class="row">
          ${icon("ruler", 18)}<span class="row-text"><strong>Distances in</strong></span>
          <div class="segmented small" role="group" aria-label="Distance units">
            <button data-units="miles" aria-pressed="${s.units === "miles"}">Miles</button>
            <button data-units="km" aria-pressed="${s.units === "km"}">Km</button>
          </div>
        </div>
      </div>

      ${trailTitle("More")}
      <div class="list-card">
        ${row("#/suggest/mine", "send", "Your suggestions", `${s.suggestions.length} sent`)}
        ${row("#/help", "circle-help", "Help and questions")}
        <button class="row link-row" id="feedback">${icon("message-circle", 18)}<span class="row-text"><strong>Send feedback</strong></span>${icon("chevron-right", 18, "chev")}</button>
        ${row("#/about", "info", `About ${CONFIG.appName}`)}
      </div>
      <div class="list-card spaced">
        <button class="row link-row danger" id="reset">${icon("trash-2", 18)}<span class="row-text"><strong>Clear all my data</strong><small>Removes everything saved on this phone</small></span></button>
      </div>
      <p class="muted center small-text version">Version 0.4 · Placeholder content</p>`,
  });

  $("#photo").addEventListener("click", () => {
    if (!Store.s.photo) return pickPhoto(renderProfile);
    openSheet("Family photo", `
      <div class="list-card">
        <button class="row link-row" id="ph-change">${icon("camera", 18)}<span class="row-text"><strong>Choose a new photo</strong></span></button>
        <button class="row link-row danger" id="ph-clear">${icon("x", 18)}<span class="row-text"><strong>Take photo away</strong></span></button>
      </div>`, (sheet) => {
      $("#ph-change", sheet).addEventListener("click", () => { closeSheet(); pickPhoto(renderProfile); });
      $("#ph-clear", sheet).addEventListener("click", () => { Store.update((st) => { st.photo = null; }); closeSheet(); renderProfile(); });
    });
  });
  $("#family-name").addEventListener("click", () => {
    openSheet("Your family name", `
      <form id="name-form" class="form">
        <label class="field">
          <span class="field-label">What should we call your family?</span>
          <input class="input" id="name-input" maxlength="40" placeholder="e.g. The Campbells" value="${esc(Store.s.familyName)}" autocomplete="off" />
        </label>
        <button class="btn btn-primary full" type="submit">Save</button>
      </form>`, (sheet) => {
      const input = $("#name-input", sheet);
      setTimeout(() => input.focus(), 260);
      $("#name-form", sheet).addEventListener("submit", (e) => {
        e.preventDefault();
        Store.update((st) => { st.familyName = input.value.trim(); });
        closeSheet();
        renderProfile();
      });
    });
  });
  $$("[data-units]").forEach((b) => b.addEventListener("click", () => {
    Store.update((st) => { st.units = b.dataset.units; });
    $$("[data-units]").forEach((x) => x.setAttribute("aria-pressed", x === b));
  }));
  $("#feedback").addEventListener("click", () => {
    if (CONFIG.feedbackEmail) location.href = `mailto:${CONFIG.feedbackEmail}?subject=${encodeURIComponent(CONFIG.appName + " feedback")}`;
    else toast("Feedback is coming soon");
  });
  $("#reset").addEventListener("click", () => {
    if (!confirm("This will remove your family name, photo, children, saved places, lists, visits and badges from this phone. Continue?")) return;
    Store.reset();
    location.hash = "#/welcome";
  });
}

function renderProfileChildren() {
  UI.screen({
    tab: "",
    top: UI.backBar("Children", "#/profile"),
    html: `<p class="lede">We use your children's ages to pick places that suit them</p><div id="kids">${childrenEditorHTML()}</div>`,
  });
  bindChildrenEditor($("#kids"), renderProfileChildren);
}

function renderProfileNeeds() {
  UI.screen({
    tab: "",
    top: UI.backBar("What matters to you", "#/profile"),
    html: `<p class="lede">We'll show places with these first</p><div id="needs">${needsPickerHTML()}</div>`,
  });
  bindNeedsPicker($("#needs"), (vals) => Store.update((s) => { s.needs = vals; }));
}

function renderProfileArea() {
  UI.screen({
    tab: "",
    top: UI.backBar("Location", "#/profile"),
    html: `<p class="lede">We'll show places near you first and work out distances</p><div id="area">${areaPickerHTML()}</div>`,
  });
  bindAreaPicker($("#area"), renderProfileArea);
}

function renderHelp() {
  UI.screen({
    tab: "",
    top: UI.backBar("Help and questions", "#/profile"),
    html: `<div class="faq">${FAQ.map((f) => `<details class="faq-item"><summary>${esc(f.q)}${icon("chevron-down", 18)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div>`,
  });
}

function renderAbout() {
  UI.screen({
    tab: "",
    top: UI.backBar("About", "#/profile"),
    html: `
      <section class="welcome-hero small">
        <img src="icons/icon.svg" alt="" width="88" height="88" />
        <h2>${CONFIG.appName}</h2>
        <p>Helping parents and caregivers across Scotland find family-friendly walks, trails, parks and gardens for children aged 0 to 12</p>
        <p class="muted small-text">Always check conditions, opening times and weather before you head out. Places in this early version are examples only.</p>
      </section>`,
  });
}

function renderNotFound() {
  UI.screen({
    top: UI.backBar("", "#/"),
    html: emptyHTML("telescope", "We couldn't find that page", "It may have been moved or removed.", `<a class="btn btn-primary" href="#/">Back to home</a>`),
  });
}
