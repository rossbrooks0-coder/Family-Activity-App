// Shared building blocks used by all the screens.
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const UI = {
  app: document.getElementById("app"),
  topbar: document.getElementById("topbar"),
  nav: document.querySelector(".bottom-nav"),

  // Draw a screen. opts: { tab, top, html, nav }
  screen({ tab = "", top = "", html = "", nav = true }) {
    this.topbar.innerHTML = top;
    this.topbar.hidden = !top;
    this.app.innerHTML = html;
    this.nav.hidden = !nav;
    document.body.classList.toggle("no-nav", !nav);
    $$(".bottom-nav a").forEach((a) => {
      const on = a.dataset.tab === tab;
      a.classList.toggle("active", on);
      on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current");
    });
    this.app.classList.remove("enter");
    void this.app.offsetWidth; // restart the fade-in animation
    this.app.classList.add("enter");
    const back = $("#back", this.topbar);
    if (back) back.addEventListener("click", () => goBack(back.dataset.fallback || "#/"));
  },

  title: (t) => `<h1>${t}</h1>`,
  backBar: (title = "", fallback = "#/", extra = "") =>
    `<button class="icon-btn" id="back" data-fallback="${fallback}" aria-label="Back">${icon("arrow-left", 20)}</button>
     ${title ? `<h1 class="bar-title">${title}</h1>` : ""}<div class="spacer"></div>${extra}`,
};

function goBack(fallback) {
  if (history.state && history.state.inApp) history.back();
  else location.hash = fallback;
}

// Section heading with the dotted trail line (the app's signature detail)
const trailTitle = (text, extra = "") => `<h2 class="trail-title"><span>${text}</span>${extra}</h2>`;

// ---------- Cards ----------
// Quiet photo slot until real photos arrive: a plain surface with the type's icon
function photoSlotHTML(a, size = 28) {
  return `<div class="photo-slot" role="img" aria-label="Photo of ${esc(a.name)} to come">${icon(TYPES[a.type], size)}</div>`;
}

function tagsFor(a, max = 3) {
  const tags = TAG_PRIORITY.filter((f) => a.facilities.includes(f)).slice(0, max).map((f) => FACILITIES[f].label);
  if (a.free) tags.unshift("Free");
  if (a.rainy) tags.push("Rainy day option");
  return tags.slice(0, max + 1);
}

function cardHTML(a, { compact = false, reason = "" } = {}) {
  const dist = formatDistance(distanceKm(a));
  return `
    <a class="card${compact ? " compact" : ""}" href="#/activity/${a.id}">
      ${photoSlotHTML(a, compact ? 24 : 28)}
      ${isSaved(a.id) ? `<span class="saved-mark" aria-label="Saved">${icon("heart", 16)}</span>` : ""}
      <div class="card-body">
        <p class="kicker">${esc(a.type)}${reason ? `<span class="reason">${esc(reason)}</span>` : ""}</p>
        <h3>${esc(a.name)}</h3>
        <p class="meta">
          <span>${icon("map-pin", 16)}${esc(a.location)}${dist ? `<span class="dim"> · ${dist}</span>` : ""}</span>
          <span>${icon("clock", 16)}${esc(a.duration)}</span>
        </p>
        <div class="tags">${tagsFor(a, compact ? 1 : 3).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      </div>
    </a>`;
}

// Small square thumbnail used in lists
const thumbHTML = (iconName) => `<span class="thumb">${icon(iconName, 20)}</span>`;

const stars = (n) => "★★★★★".slice(0, Math.round(n)) + "☆☆☆☆☆".slice(0, 5 - Math.round(n));

function emptyHTML(sym, title, text, button = "") {
  return `<div class="empty"><span class="empty-icon">${icon(sym, 28)}</span><h2>${title}</h2><p>${text}</p>${button}</div>`;
}

// ---------- Badges (stitched patches) ----------
function badgeHTML(b, earned = true, size = 64) {
  return `<span class="patch ${earned ? "earned" : ""}" style="--patch:${b.colour};--size:${size}px">${icon(b.icon, Math.round(size * 0.42))}</span>`;
}

// ---------- Toast (little message at the bottom) ----------
let toastTimer;
function toast(msg) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

// ---------- Bottom sheet (panel that slides up) ----------
function openSheet(title, bodyHTML, onMount) {
  closeSheet();
  const t = $("#toast");
  if (t) t.classList.remove("show");
  const wrap = document.createElement("div");
  wrap.className = "sheet-wrap";
  wrap.innerHTML = `
    <div class="sheet-backdrop"></div>
    <section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-handle"></div>
      <header class="sheet-head"><h2>${title}</h2><button class="icon-btn small" data-close aria-label="Close">${icon("x", 18)}</button></header>
      <div class="sheet-body">${bodyHTML}</div>
    </section>`;
  document.body.appendChild(wrap);
  document.body.classList.add("sheet-open");
  requestAnimationFrame(() => wrap.classList.add("open"));
  wrap.querySelector(".sheet-backdrop").addEventListener("click", closeSheet);
  wrap.querySelector("[data-close]").addEventListener("click", closeSheet);
  if (onMount) onMount(wrap.querySelector(".sheet"));
  return wrap;
}
function closeSheet() {
  const w = $(".sheet-wrap");
  if (!w) return;
  document.body.classList.remove("sheet-open");
  w.classList.remove("open");
  setTimeout(() => w.remove(), 250);
}
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

// ---------- Reusable pickers ----------
const ageLabel = (age) => (age === 0 ? "Under 1" : `${age} yr${age === 1 ? "" : "s"}`);

// Options: [{ value, label, icon? }]
function chipGroup(name, options, selected, { multi = true } = {}) {
  return `<div class="chip-wrap" data-group="${name}" data-multi="${multi}">
    ${options.map((o) => `<button type="button" class="chip" data-value="${esc(o.value)}" aria-pressed="${selected.includes(o.value)}">${o.icon ? icon(o.icon, 16) : ""}${o.label}</button>`).join("")}
  </div>`;
}
function bindChipGroups(root) {
  $$(".chip-wrap", root).forEach((g) => {
    g.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      if (g.dataset.multi === "true") b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true");
      else $$(".chip", g).forEach((c) => c.setAttribute("aria-pressed", c === b));
      g.dispatchEvent(new CustomEvent("change", { bubbles: true }));
    });
  });
}
const chipValues = (root, name) => $$(`.chip-wrap[data-group="${name}"] .chip[aria-pressed="true"]`, root).map((c) => c.dataset.value);
const facilityOptions = () => Object.keys(FACILITIES).map((k) => ({ value: k, label: FACILITIES[k].label, icon: FACILITIES[k].icon }));
const typeOptions = () => Object.keys(TYPES).map((t) => ({ value: t, label: t, icon: TYPES[t] }));

// Children editor (used in welcome screens and profile)
function childrenEditorHTML() {
  const kids = Store.s.children;
  return `
    ${kids.length ? `<div class="list-card">${kids.map((k) => `
        <div class="row">
          <span class="initial">${esc((k.name || "C").charAt(0).toUpperCase())}</span>
          <span class="row-text"><strong>${esc(k.name || "Child")}</strong><small>${ageLabel(k.age)}</small></span>
          <button type="button" class="icon-btn small" data-remove="${k.id}" aria-label="Remove ${esc(k.name || "child")}">${icon("x", 16)}</button>
        </div>`).join("")}</div>` : ""}
    <div class="form-card">
      <label class="field-label" for="kid-name">Name (optional)</label>
      <input id="kid-name" class="input" placeholder="e.g. Isla" maxlength="30" autocomplete="off" />
      <span class="field-label">Age</span>
      ${chipGroup("kid-age", Array.from({ length: 13 }, (_, i) => ({ value: String(i), label: i === 0 ? "Under 1" : String(i) })), [], { multi: false })}
      <button type="button" class="btn btn-secondary full" id="add-kid">${icon("plus", 18)}Add child</button>
    </div>`;
}
function bindChildrenEditor(root, rerender) {
  bindChipGroups(root);
  $$("[data-remove]", root).forEach((b) => b.addEventListener("click", () => {
    Store.update((s) => { s.children = s.children.filter((k) => k.id !== b.dataset.remove); });
    rerender();
  }));
  $("#add-kid", root).addEventListener("click", () => {
    const age = chipValues(root, "kid-age")[0];
    if (age == null) return toast("Pick an age first");
    const name = $("#kid-name", root).value.trim();
    Store.update((s) => { s.children.push({ id: uid(), name, age: Number(age) }); });
    rerender();
  });
}

// Needs picker (big tiles)
const NEED_OPTIONS = ["pushchair", "toilets", "babyChanging", "cafe", "parking", "playground", "dogs", "accessible"];
function needsPickerHTML(selected = Store.s.needs) {
  return `<div class="tiles">
    ${NEED_OPTIONS.map((n) => `<button type="button" class="tile" data-value="${n}" aria-pressed="${selected.includes(n)}">
      ${icon(FACILITIES[n].icon, 24)}<span>${FACILITIES[n].label}</span></button>`).join("")}
  </div>`;
}
function bindNeedsPicker(root, onChange) {
  $$(".tile", root).forEach((t) => t.addEventListener("click", () => {
    t.setAttribute("aria-pressed", t.getAttribute("aria-pressed") !== "true");
    onChange($$(".tile[aria-pressed='true']", root).map((x) => x.dataset.value));
  }));
}

// Area picker
function areaPickerHTML() {
  const s = Store.s;
  return `
    <button type="button" class="btn ${s.coords ? "btn-primary" : "btn-secondary"} full" id="use-location">
      ${icon("locate-fixed", 18)}${s.coords ? "Using your location" : "Use my location"}
    </button>
    <p class="or">or choose a region</p>
    <div class="choice-list">
      ${REGIONS.map((r) => `<button type="button" class="choice" data-region="${r.id}" aria-pressed="${s.region === r.id}">
        <span>${r.name}</span>${icon("check", 18)}</button>`).join("")}
    </div>`;
}
function bindAreaPicker(root, rerender) {
  $$("[data-region]", root).forEach((b) => b.addEventListener("click", () => {
    Store.update((s) => { s.region = b.dataset.region; s.coords = null; });
    rerender();
  }));
  $("#use-location", root).addEventListener("click", () => {
    if (Store.s.coords) { Store.update((s) => { s.coords = null; }); return rerender(); }
    if (!navigator.geolocation) return toast("Location isn't available on this device");
    toast("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        // pick the nearest region too, so we can show its name
        const nearest = REGIONS.reduce((best, r) => {
          const d = (r.lat - lat) ** 2 + (r.lng - lng) ** 2;
          return d < best.d ? { r, d } : best;
        }, { d: Infinity }).r;
        Store.update((s) => { s.coords = { lat, lng }; s.region = nearest.id; });
        toast("Location set");
        rerender();
      },
      () => toast("Couldn't get your location. Pick a region instead."),
      { timeout: 10000, maximumAge: 600000 }
    );
  });
}

function areaName() {
  const r = regionById(Store.s.region);
  if (Store.s.coords) return r ? `Near you (${r.name})` : "Near you";
  return r ? r.name : "All of Scotland";
}

// ---------- Family photo ----------
function avatarHTML(size = 44) {
  const s = Store.s;
  const inner = s.photo
    ? `<img src="${s.photo}" alt="" />`
    : s.familyName
      ? `<span class="avatar-initial">${esc(s.familyName.replace(/^the\s+/i, "").charAt(0).toUpperCase())}</span>`
      : icon("users", Math.round(size * 0.45));
  return `<span class="avatar" style="--size:${size}px">${inner}</span>`;
}

// Let the parent pick a photo, shrink it so it fits on the phone, and save it
function pickPhoto(onDone) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = 240;
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const side = Math.min(img.width, img.height);
      c.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      Store.update((s) => { s.photo = c.toDataURL("image/jpeg", 0.85); });
      onDone();
    };
    img.onerror = () => toast("Sorry, that photo couldn't be used");
    img.src = url;
  });
  input.click();
}

// Fill in the bottom bar icons
$$("[data-icon]").forEach((el) => { el.innerHTML = icon(el.dataset.icon, 24); });
