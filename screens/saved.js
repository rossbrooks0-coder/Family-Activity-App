// Saved: favourites, lists, been there
function renderSaved(tab = "favourites") {
  const tabs = [
    { id: "favourites", label: "❤️ Favourites" },
    { id: "lists", label: "📋 Lists" },
    { id: "been", label: "🏅 Been there" },
  ];
  let body = "";

  if (tab === "favourites") {
    const saved = Store.s.saved.map(byId).filter(Boolean);
    body = saved.length
      ? `<div class="card-list">${saved.map((a) => cardHTML(a)).join("")}</div>`
      : emptyHTML("🤍", "Nothing saved yet", "Tap “Save” on any place to keep it here for later.", `<a class="btn btn-primary" href="#/explore">Find places</a>`);
  }

  if (tab === "lists") {
    const lists = Store.s.lists;
    body = `
      <form class="new-list" id="new-list">
        <input class="input" id="new-list-name" placeholder="New list, e.g. Grandma's visit" maxlength="40" aria-label="New list name" />
        <button class="btn btn-primary" type="submit">Create</button>
      </form>
      ${lists.length
        ? `<div class="menu">${lists.map((l) => {
            const first = byId(l.items[0]);
            return `<a class="menu-row" href="#/list/${l.id}">
              <span class="list-thumb" style="--c:${first ? first.colour : "#cfd8d3"}">${first ? first.emoji : "📋"}</span>
              <span class="menu-text"><strong>${esc(l.name)}</strong><small>${l.items.length} place${l.items.length === 1 ? "" : "s"}</small></span>
              <span class="chev">›</span></a>`;
          }).join("")}</div>`
        : emptyHTML("📋", "No lists yet", "Make lists for trips, holidays or rainy days, then add places to them.")}`;
  }

  if (tab === "been") {
    const visits = Store.s.visits;
    const earned = earnedBadges().map((b) => b.id);
    const history = [...visits].reverse();
    body = `
      <div class="stat-row">
        <div class="stat"><strong>${visits.length}</strong><span>visits</span></div>
        <div class="stat"><strong>${new Set(visits.map((v) => v.id)).size}</strong><span>places</span></div>
        <div class="stat"><strong>${earned.length}/${BADGES.length}</strong><span>badges</span></div>
      </div>
      <h2 class="section-title">Badges</h2>
      <div class="badge-grid">
        ${BADGES.map((b) => `<div class="badge-tile ${earned.includes(b.id) ? "earned" : ""}">
          <span class="badge-icon">${b.icon}</span><strong>${b.name}</strong><small>${b.desc}</small></div>`).join("")}
      </div>
      <h2 class="section-title">Your adventures</h2>
      ${history.length
        ? `<div class="menu">${history.map((v) => {
            const a = byId(v.id);
            if (!a) return "";
            return `<div class="menu-row">
              <a class="menu-link" href="#/activity/${a.id}">
                <span class="list-thumb" style="--c:${a.colour}">${a.emoji}</span>
                <span class="menu-text"><strong>${esc(a.name)}</strong><small>${new Date(v.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</small></span>
              </a>
              <button class="icon-btn small" data-unvisit="${v.date}" aria-label="Remove visit">✕</button></div>`;
          }).join("")}</div>`
        : emptyHTML("🥾", "No adventures yet", "When you visit a place, tap “We've been here!” on its page to collect badges.")}`;
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
    top: UI.backBar(esc(list.name), "#/saved/lists", `<button class="icon-btn" id="list-menu" aria-label="List options">⋯</button>`),
    html: items.length
      ? `<div class="card-list">${items.map((a) => `<div class="removable">${cardHTML(a)}<button class="remove-x" data-remove="${a.id}" aria-label="Remove ${esc(a.name)} from list">✕</button></div>`).join("")}</div>`
      : emptyHTML("📋", "This list is empty", "Open any place and tap “Add to list”.", `<a class="btn btn-primary" href="#/explore">Find places</a>`),
  });
  $$("[data-remove]").forEach((b) => b.addEventListener("click", () => {
    Store.update((s) => { const l = s.lists.find((x) => x.id === id); l.items = l.items.filter((x) => x !== b.dataset.remove); });
    renderList(id);
  }));
  $("#list-menu").addEventListener("click", () => {
    openSheet("List options", `
      <div class="menu">
        <button class="menu-row" id="rename"><span class="menu-text"><strong>✏️ Rename list</strong></span></button>
        <button class="menu-row" id="share-list"><span class="menu-text"><strong>📤 Share list</strong></span></button>
        <button class="menu-row danger" id="delete"><span class="menu-text"><strong>🗑️ Delete list</strong></span></button>
      </div>`, (sheet) => {
      $("#rename", sheet).addEventListener("click", () => {
        const name = prompt("New name", list.name);
        if (name && name.trim()) { Store.update((s) => { s.lists.find((x) => x.id === id).name = name.trim(); }); closeSheet(); renderList(id); }
      });
      $("#share-list", sheet).addEventListener("click", async () => {
        const text = `${list.name}:\n` + items.map((a) => `• ${a.name} (${a.location})`).join("\n");
        closeSheet();
        if (navigator.share) { try { await navigator.share({ title: list.name, text }); } catch {} }
        else { try { await navigator.clipboard.writeText(text); toast("List copied!"); } catch {} }
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
