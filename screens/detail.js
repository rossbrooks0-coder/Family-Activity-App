// Activity detail page
function renderDetail(id) {
  const a = byId(id);
  if (!a) return renderNotFound();
  const dist = formatDistance(distanceKm(a));
  const avg = a.reviews.reduce((t, r) => t + r.rating, 0) / (a.reviews.length || 1);
  const ticked = Store.s.checklists[a.id] || [];
  const ageText = a.ageMin === 0 && a.ageMax === 12 ? "All ages, 0 to 12" : `Ages ${a.ageMin === 0 ? "under 1" : a.ageMin} to ${a.ageMax}`;
  const kidsFit = Store.s.children.length
    ? `<span class="fits">${Store.s.children.map((c) => {
        const ok = ageOk(a, c.age);
        return `<span class="fit ${ok ? "ok" : "no"}">${icon(ok ? "check" : "x", 14)}${esc(c.name || "Child")}, ${ageLabel(c.age).toLowerCase()}</span>`;
      }).join("")}</span>`
    : "";
  const row = (ic, title, text, extra = "") =>
    `<div class="row">${icon(ic, 18)}<span class="row-text"><strong>${title}</strong>${text ? `<small>${text}</small>` : ""}${extra}</span></div>`;

  UI.screen({
    tab: "",
    top: UI.backBar("", "#/", `<button class="icon-btn" id="share" aria-label="Share">${icon("share-2", 20)}</button>`),
    html: `
      <article class="detail">
        <div class="gallery" aria-label="Photos">
          ${[0, 1, 2].map((i) => `<div class="photo-slot" role="img" aria-label="Photo ${i + 1} of ${esc(a.name)} to come">${icon(TYPES[a.type], 32)}</div>`).join("")}
        </div>
        <div class="gallery-dots" aria-hidden="true"><span class="on"></span><span></span><span></span></div>

        <p class="kicker">${esc(a.type)}</p>
        <h2 class="detail-title">${esc(a.name)}</h2>
        <p class="detail-meta">${icon("map-pin", 16)}<span>${esc(a.location)}${dist ? ` · ${dist} away` : ""}</span></p>
        <p class="detail-meta"><span class="stars" aria-hidden="true">${stars(avg)}</span><span>${avg.toFixed(1)} from ${a.reviews.length} review${a.reviews.length === 1 ? "" : "s"}</span></p>

        <dl class="facts">
          <div><dt>Time</dt><dd>${esc(a.duration)}</dd></div>
          <div><dt>Distance</dt><dd>${esc(a.distance)}</dd></div>
          <div><dt>Cost</dt><dd>${a.free ? "Free" : "Paid"}</dd></div>
        </dl>

        <div class="actions">
          <button class="btn btn-secondary" id="save" aria-pressed="${isSaved(a.id)}"></button>
          <button class="btn btn-secondary" id="add-list">${icon("list-plus", 18)}Add to list</button>
          <a class="btn btn-primary wide" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.name + ", " + a.location + ", Scotland")}" target="_blank" rel="noopener">${icon("navigation", 18)}Directions</a>
        </div>

        ${trailTitle("About")}
        <p class="prose">${esc(a.description)}</p>

        ${trailTitle("Kids will love")}
        <ul class="bullets">${a.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>

        ${trailTitle("Good for")}
        <div class="list-card">
          ${row("users", ageText, "", kidsFit)}
          ${row(SEASONS[a.seasons[0]].icon, "Best seasons", a.seasons.map((s) => SEASONS[s].label).join(", "))}
          ${row("cloud-rain", a.rainy ? "Good on rainy days" : "Best on dry days", "")}
        </div>

        ${trailTitle("Facilities")}
        <ul class="facility-list">
          ${Object.keys(FACILITIES).map((k) => {
            const has = a.facilities.includes(k);
            return `<li class="${has ? "" : "missing"}">${icon(FACILITIES[k].icon, 18)}<span>${FACILITIES[k].label}</span><span class="sr-only">${has ? "available" : "not available"}</span></li>`;
          }).join("")}
        </ul>

        ${trailTitle("The path")}
        <div class="list-card">
          ${row("route", "Surface", esc(a.terrain.surface))}
          ${row("mountain", "Steepness", esc(a.terrain.steepness))}
          ${row("baby", "Best with", esc(a.terrain.best))}
        </div>

        ${trailTitle("Opening times and cost")}
        <div class="list-card">
          ${row("clock", "Opening", esc(a.opening))}
          ${row("banknote", "Cost", esc(a.price))}
        </div>

        ${trailTitle("Getting there")}
        <div class="list-card">
          ${row("square-parking", "Parking", esc(a.gettingThere.parking))}
          ${row("bus", "Public transport", esc(a.gettingThere.transport))}
        </div>

        ${trailTitle("What to bring")}
        <div class="list-card checklist" id="checklist">
          ${a.bring.map((b, i) => `<label class="row check-row"><input type="checkbox" data-i="${i}" ${ticked.includes(i) ? "checked" : ""}/><span>${esc(b)}</span></label>`).join("")}
        </div>

        ${trailTitle("Parents say")}
        <div class="reviews">
          ${a.reviews.map((r) => `
            <figure class="review">
              <blockquote>${esc(r.text)}</blockquote>
              <figcaption><span><strong>${esc(r.name)}</strong> · ${esc(r.family)}</span><span class="stars" aria-label="${r.rating} out of 5">${stars(r.rating)}</span></figcaption>
            </figure>`).join("")}
          <button class="btn btn-secondary full" id="write-review">${icon("pencil", 18)}Write a review</button>
        </div>

        <div class="been-box">
          <div id="visit-info"></div>
          <button class="btn btn-primary full" id="been">${icon("circle-check", 18)}We've been here</button>
        </div>
      </article>`,
  });

  // Swipeable gallery dots
  const gallery = $(".gallery");
  gallery.addEventListener("scroll", () => {
    const i = Math.round(gallery.scrollLeft / gallery.clientWidth);
    $$(".gallery-dots span").forEach((d, n) => d.classList.toggle("on", n === i));
  }, { passive: true });

  // Save button
  const saveBtn = $("#save");
  const drawSave = () => {
    const on = isSaved(a.id);
    saveBtn.setAttribute("aria-pressed", on);
    saveBtn.innerHTML = `${icon("heart", 18)}${on ? "Saved" : "Save"}`;
  };
  drawSave();
  saveBtn.addEventListener("click", () => { const on = toggleSaved(a.id); drawSave(); toast(on ? "Saved" : "Removed from saved"); });

  // Share
  $("#share").addEventListener("click", async () => {
    const data = { title: a.name, text: `${a.name}, ${a.location}. Found on ${CONFIG.appName}`, url: location.href };
    if (navigator.share) { try { await navigator.share(data); } catch {} }
    else { try { await navigator.clipboard.writeText(location.href); toast("Link copied"); } catch { toast("Couldn't share on this device"); } }
  });

  $("#add-list").addEventListener("click", () => openListPicker(a.id));

  $("#checklist").addEventListener("change", (e) => {
    const i = Number(e.target.dataset.i);
    Store.update((s) => {
      const set = new Set(s.checklists[a.id] || []);
      e.target.checked ? set.add(i) : set.delete(i);
      s.checklists[a.id] = [...set];
    });
  });

  $("#write-review").addEventListener("click", () => toast("Reviews are coming soon"));

  // Visits & badges
  const drawVisits = () => {
    const v = visitsFor(a.id);
    $("#visit-info").innerHTML = v.length
      ? `<p class="visited">${icon("circle-check", 18)}Visited ${v.length === 1 ? "once" : v.length + " times"}, last on ${new Date(v[v.length - 1].date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>`
      : `<p class="been-note">Been here? Mark your visit to collect badges</p>`;
  };
  drawVisits();
  $("#been").addEventListener("click", () => {
    const before = earnedBadges().map((b) => b.id);
    Store.update((s) => { s.visits.push({ id: a.id, date: new Date().toISOString() }); });
    const fresh = earnedBadges().filter((b) => !before.includes(b.id));
    drawVisits();
    if (fresh.length) showBadgeCelebration(fresh);
    else toast("Visit added");
  });
}

function showBadgeCelebration(badges) {
  openSheet(badges.length > 1 ? "New badges" : "New badge", `
    <div class="celebrate">
      ${badges.map((b) => `<div class="badge-big">${badgeHTML(b, true, 96)}<strong>${b.name}</strong><small>${b.desc}</small></div>`).join("")}
      <p class="muted small-text">See all your badges in Saved, under Been there</p>
      <button class="btn btn-primary full" data-close-sheet>Done</button>
    </div>`, (sheet) => $("[data-close-sheet]", sheet).addEventListener("click", closeSheet));
}

// Add-to-list panel
function openListPicker(activityId) {
  const draw = () => {
    const lists = Store.s.lists;
    return `
      ${lists.length ? `<div class="choice-list">${lists.map((l) => `
        <button type="button" class="choice" data-list="${l.id}" aria-pressed="${l.items.includes(activityId)}">
          <span>${esc(l.name)} <span class="muted">${l.items.length}</span></span>${icon("check", 18)}
        </button>`).join("")}</div>` : `<p class="sheet-note">You haven't made any lists yet</p>`}
      <form class="new-list" id="new-list">
        <input class="input" id="new-list-name" placeholder="New list, e.g. Summer holidays" maxlength="40" aria-label="New list name" />
        <button class="btn btn-primary" type="submit">Create</button>
      </form>`;
  };
  openSheet("Add to a list", `<div id="list-picker">${draw()}</div>`, (sheet) => {
    const box = $("#list-picker", sheet);
    const bind = () => {
      $$("[data-list]", box).forEach((b) => b.addEventListener("click", () => {
        Store.update((s) => {
          const l = s.lists.find((x) => x.id === b.dataset.list);
          l.items = l.items.includes(activityId) ? l.items.filter((x) => x !== activityId) : [...l.items, activityId];
        });
        box.innerHTML = draw(); bind();
      }));
      $("#new-list", box).addEventListener("submit", (e) => {
        e.preventDefault();
        const name = $("#new-list-name", box).value.trim();
        if (!name) return toast("Give your list a name");
        Store.update((s) => { s.lists.push({ id: uid(), name, items: [activityId] }); });
        toast(`Added to ${name}`);
        box.innerHTML = draw(); bind();
      });
    };
    bind();
  });
}
