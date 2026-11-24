// Saved: favourites, lists, been there
function renderSaved(tab = "favourites") {
  const tabs = [
    { id: "favourites", label: "Favourites" },
    { id: "lists", label: "Lists" },
    { id: "been", label: "Been there" },
  ];
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  let body = "";

  if (tab === "favourites") {
    const saved = Store.s.saved.map(byId).filter(Boolean);
    body = saved.length
      ? `<div class="card-list">${saved.map((a) => cardHTML(a)).join("")}</div>`
      : emptyHTML("heart", "Nothing saved yet", "Tap Save on any place to keep it here for later", `<a class="btn btn-primary" href="#/">Find places</a>`);
  }

  if (tab === "lists") {
    const lists = Store.s.lists;
    body = `
      <form class="new-list" id="new-list">
        <input class="input" id="new-list-name" placeholder="New list, e.g. Grandma's visit" maxlength="40" aria-label="New list name" />
        <button class="btn btn-primary" type="submit">Create</button>
      </form>
      ${lists.length
        ? `<div class="list-card">${lists.map((l) => {
            const first = byId(l.items[0]);
            return `<a class="row link-row" href="#/list/${l.id}">
              ${thumbHTML(first ? TYPES[first.type] : "list")}
              <span class="row-text"><strong>${esc(l.name)}</strong><small>${l.items.length} place${l.items.length === 1 ? "" : "s"}</small></span>
              ${icon("chevron-right", 18, "chev")}</a>`;
          }).join("")}</div>`
        : emptyHTML("list", "No lists yet", "Make lists for trips, holidays or rainy days, then add places to them")}`;
  }

  if (tab === "been") {
    const visits = Store.s.visits;
    const earned = earnedBadges().map((b) => b.id);
    const history = [...visits].reverse();
    body = `
      <dl class="stats">
        <div><dt>Visits</dt><dd>${visits.length}</dd></div>
        <div><dt>Places</dt><dd>${new Set(visits.map((v) => v.id)).size}</dd></div>
        <div><dt>Badges</dt><dd>${earned.length}<span class="of"> of ${BADGES.length}</span></dd></div>
      </dl>
      ${trailTitle("Badges")}
      <div class="badge-grid">
        ${BADGES.map((b) => `<div class="badge-tile ${earned.includes(b.id) ? "earned" : ""}">
          ${badgeHTML(b, earned.includes(b.id), 64)}<strong>${b.name}</strong><small>${b.desc}</small></div>`).join("")}
      </div>
      ${trailTitle("Your adventures")}
      ${history.length
        ? `<ol class="timeline">${history.map((v) => {
            const a = byId(v.id);
            if (!a) return "";
            return `<li>
              <a class="timeline-link" href="#/activity/${a.id}">
                <strong>${esc(a.name)}</strong><small>${fmtDate(v.date)}</small>
              </a>
              <button class="icon-btn small" data-unvisit="${v.date}" aria-label="Remove visit">${icon("x", 16)}</button></li>`;
          }).join("")}</ol>`
        : emptyHTML("footprints", "No adventures yet", "When you visit a place, tap We've been here on its page to collect badges")}`;
  }

  UI.screen({
    tab: "saved",
    top: UI.title("Saved"),
    html: `
      <div class="segmented full" role="tablist">
        ${tabs.map((t) => `<a role="tab" href="#/saved/${t.id}" aria-selected="${t.id === tab}" aria-pressed="${t.id === tab}">${t.label}</a>`).join("")}
      </div>
      <div class="tab-body">${body}</div>`,
  });

  const form = $("#new-list");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#new-list-name").value.trim();
    if (!name) return toast("Give your list a name");
    Store.update((s) => { s.lists.push({ id: uid(), name, items: [] }); });
    renderSaved("lists");
  });
  $$("[data-unvisit]").forEach((b) => b.addEventListener("click", () => {
    if (!confirm("Remove this visit?")) return;
    Store.update((s) => { s.visits = s.visits.filter((v) => v.date !== b.dataset.unvisit); });
    renderSaved("been");
  }));
}

function renderList(id) {
  const list = Store.s.lists.find((l) => l.id === id);
  if (!list) return renderNotFound();
  const items = list.items.map(byId).filter(Boolean);
  UI.screen({
    tab: "saved",
    top: UI.backBar(esc(list.name), "#/saved/lists", `<button class="icon-btn" id="list-menu" aria-label="List options">${icon("ellipsis", 20)}</button>`),
    html: items.length
      ? `<div class="card-list">${items.map((a) => `<div class="removable">${cardHTML(a)}<button class="remove-x" data-remove="${a.id}" aria-label="Remove ${esc(a.name)} from list">${icon("x", 16)}</button></div>`).join("")}</div>`
      : emptyHTML("list", "This list is empty", "Open any place and tap Add to list", `<a class="btn btn-primary" href="#/">Find places</a>`),
  });
  $$("[data-remove]").forEach((b) => b.addEventListener("click", () => {
    Store.update((s) => { const l = s.lists.find((x) => x.id === id); l.items = l.items.filter((x) => x !== b.dataset.remove); });
    renderList(id);
  }));
  $("#list-menu").addEventListener("click", () => {
    openSheet("List options", `
      <div class="list-card">
        <button class="row link-row" id="rename">${icon("pencil", 18)}<span class="row-text"><strong>Rename list</strong></span></button>
        <button class="row link-row" id="share-list">${icon("share-2", 18)}<span class="row-text"><strong>Share list</strong></span></button>
        <button class="row link-row danger" id="delete">${icon("trash-2", 18)}<span class="row-text"><strong>Delete list</strong></span></button>
      </div>`, (sheet) => {
      $("#rename", sheet).addEventListener("click", () => {
        const name = prompt("New name", list.name);
        if (name && name.trim()) { Store.update((s) => { s.lists.find((x) => x.id === id).name = name.trim(); }); closeSheet(); renderList(id); }
      });
      $("#share-list", sheet).addEventListener("click", async () => {
        const text = `${list.name}:\n` + items.map((a) => `• ${a.name} (${a.location})`).join("\n");
        closeSheet();
        if (navigator.share) { try { await navigator.share({ title: list.name, text }); } catch {} }
        else { try { await navigator.clipboard.writeText(text); toast("List copied"); } catch {} }
      });
      $("#delete", sheet).addEventListener("click", () => {
        if (!confirm(`Delete “${list.name}”?`)) return;
        Store.update((s) => { s.lists = s.lists.filter((x) => x.id !== id); });
        closeSheet();
        location.hash = "#/saved/lists";
      });
    });
  });
}
