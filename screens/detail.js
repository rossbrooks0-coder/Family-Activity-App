// Activity detail page
function renderDetail(id) {
  const a = byId(id);
  if (!a) return renderNotFound();
  const region = regionById(a.region);
  const dist = formatDistance(distanceKm(a));
  const avg = a.reviews.reduce((t, r) => t + r.rating, 0) / (a.reviews.length || 1);
  const ticked = Store.s.checklists[a.id] || [];
  const ageText = a.ageMin === 0 && a.ageMax === 12 ? "All ages (0–12)" : `${a.ageMin === 0 ? "Under 1" : a.ageMin}–${a.ageMax} years`;
  const seasonIcons = { spring: "🌸 Spring", summer: "☀️ Summer", autumn: "🍂 Autumn", winter: "❄️ Winter" };
  const kidsFit = Store.s.children.length
    ? Store.s.children.map((c) => `<span class="fit ${ageOk(a, c.age) ? "ok" : "no"}">${ageOk(a, c.age) ? "✓" : "✕"} ${esc(c.name || "Child")} (${ageLabel(c.age)})</span>`).join("")
    : "";

  UI.screen({
    tab: "",
    top: UI.backBar("", "#/", `<button class="icon-btn" id="share" aria-label="Share">📤</button>`),
    html: `
      <article class="detail">
        <div class="gallery" aria-label="Photos">
          ${[0, 1, 2].map((i) => `<div class="photo" style="--c:${a.colour};filter:hue-rotate(${i * 18}deg)" role="img" aria-label="Photo placeholder ${i + 1}">
             <span class="photo-emoji">${a.emoji}</span><span class="label">Photo ${i + 1} of 3 · coming soon</span></div>`).join("")}
        </div>

        <span class="type-pill">${TYPES[a.type]} ${a.type}</span>
        <h2>${esc(a.name)}</h2>
        <p class="location">📍 ${esc(a.location)}, ${esc(region?.name || "")}${dist ? ` · ${dist} away` : ""}</p>
        <p class="rating"><span class="stars" aria-hidden="true">${stars(avg)}</span> ${avg.toFixed(1)} · ${a.reviews.length} review${a.reviews.length === 1 ? "" : "s"}</p>

        <div class="facts">
          <div class="fact"><div class="k">Time</div><div class="v">${esc(a.duration)}</div></div>
          <div class="fact"><div class="k">Distance</div><div class="v">${esc(a.distance)}</div></div>
          <div class="fact"><div class="k">Cost</div><div class="v">${a.free ? "Free" : "Paid"}</div></div>
        </div>

        <div class="actions three">
          <button class="btn btn-secondary" id="save" aria-pressed="${isSaved(a.id)}"></button>
          <button class="btn btn-secondary" id="add-list">📋 Add to list</button>
          <a class="btn btn-primary" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.name + ", " + a.location + ", Scotland")}" target="_blank" rel="noopener">🗺️ Directions</a>
        </div>

        <h3>About</h3>
        <p>${esc(a.description)}</p>

        <h3>Kids will love</h3>
        <ul class="bullets">${a.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>

        <h3>Good for</h3>
        <div class="info-card">
          <div class="info-row"><span>🧒</span><div><strong>${ageText}</strong>${kidsFit ? `<div class="fits">${kidsFit}</div>` : ""}</div></div>
          <div class="info-row"><span>📅</span><div><strong>Best seasons</strong><div class="muted">${a.seasons.map((s) => seasonIcons[s]).join(" · ")}</div></div></div>
          <div class="info-row"><span>☔</span><div><strong>${a.rainy ? "Good on rainy days" : "Best on dry days"}</strong></div></div>
        </div>

        <h3>Facilities</h3>
        <div class="facility-grid">
          ${Object.keys(FACILITIES).map((k) => {
            const has = a.facilities.includes(k);
            return `<div class="facility ${has ? "" : "missing"}"><span>${FACILITIES[k].icon}</span>${FACILITIES[k].label}<span class="sr-only">${has ? " available" : " not available"}</span></div>`;
          }).join("")}
        </div>

        <h3>The path</h3>
        <div class="info-card">
          <div class="info-row"><span>🛤️</span><div><strong>Surface</strong><div class="muted">${esc(a.terrain.surface)}</div></div></div>
          <div class="info-row"><span>📈</span><div><strong>Steepness</strong><div class="muted">${esc(a.terrain.steepness)}</div></div></div>
          <div class="info-row"><span>👶</span><div><strong>Best with</strong><div class="muted">${esc(a.terrain.best)}</div></div></div>
        </div>

        <h3>Opening times & cost</h3>
        <div class="info-card">
          <div class="info-row"><span>🕘</span><div><strong>Opening</strong><div class="muted">${esc(a.opening)}</div></div></div>
          <div class="info-row"><span>💷</span><div><strong>Cost</strong><div class="muted">${esc(a.price)}</div></div></div>
        </div>

        <h3>Getting there</h3>
        <div class="info-card">
          <div class="info-row"><span>🅿️</span><div><strong>Parking</strong><div class="muted">${esc(a.gettingThere.parking)}</div></div></div>
          <div class="info-row"><span>🚌</span><div><strong>Public transport</strong><div class="muted">${esc(a.gettingThere.transport)}</div></div></div>
        </div>

        <h3>What to bring</h3>
        <div class="checklist" id="checklist">
          ${a.bring.map((b, i) => `<label class="check-row"><input type="checkbox" data-i="${i}" ${ticked.includes(i) ? "checked" : ""}/><span>${esc(b)}</span></label>`).join("")}
        </div>

        <h3>Parents say</h3>
        <div class="reviews">
          ${a.reviews.map((r) => `
            <div class="review">
              <div class="review-head"><strong>${esc(r.name)}</strong><span class="stars" aria-label="${r.rating} out of 5">${stars(r.rating)}</span></div>
              <div class="muted small-text">${esc(r.family)} · ${esc(r.date)}</div>
              <p>${esc(r.text)}</p>
            </div>`).join("")}
          <button class="btn btn-secondary full" id="write-review">✍️ Write a review</button>
        </div>

        <div class="been-box">
          <div id="visit-info"></div>
          <button class="btn btn-primary full big" id="been">🎉 We've been here!</button>
        </div>
      </article>`,
  });

  // Save button
  const saveBtn = $("#save");
  const drawSave = () => {
    const on = isSaved(a.id);
    saveBtn.setAttribute("aria-pressed", on);
    saveBtn.textContent = on ? "❤️ Saved" : "🤍 Save";
  };
  drawSave();
  saveBtn.addEventListener("click", () => { const on = toggleSaved(a.id); drawSave(); toast(on ? "Saved ❤️" : "Removed from saved"); });

  // Share
  $("#share").addEventListener("click", async () => {
    const data = { title: a.name, text: `${a.name} – ${a.location}. Found on ${CONFIG.appName}`, url: location.href };
    if (navigator.share) { try { await navigator.share(data); } catch {} }
    else { try { await navigator.clipboard.writeText(location.href); toast("Link copied!"); } catch { toast("Couldn't share on this device"); } }
  });

  // Lists
  $("#add-list").addEventListener("click", () => openListPicker(a.id));

  // Checklist
  $("#checklist").addEventListener("change", (e) => {
    const i = Number(e.target.dataset.i);
    Store.update((s) => {
      const set = new Set(s.checklists[a.id] || []);
      e.target.checked ? set.add(i) : set.delete(i);
      s.checklists[a.id] = [...set];
    });
  });

  $("#write-review").addEventListener("click", () => toast("Writing reviews is coming soon ✍️"));

  // Visits & badges
  const drawVisits = () => {
    const v = visitsFor(a.id);
    $("#visit-info").innerHTML = v.length
      ? `<p class="visited">✅ You've been here ${v.length === 1 ? "once" : v.length + " times"} · last on ${new Date(v[v.length - 1].date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>`
      : `<p class="muted center">Been here? Tap below to collect badges!</p>`;
  };
  drawVisits();
  $("#been").addEventListener("click", () => {
    const before = earnedBadges().map((b) => b.id);
    Store.update((s) => { s.visits.push({ id: a.id, date: new Date().toISOString() }); });
    const fresh = earnedBadges().filter((b) => !before.includes(b.id));
    drawVisits();
    if (fresh.length) showBadgeCelebration(fresh);
    else toast("Visit added 🎉");
  });
}

function showBadgeCelebration(badges) {
  openSheet("New badge!", `
    <div class="celebrate">
      ${badges.map((b) => `<div class="badge-big"><span>${b.icon}</span><strong>${b.name}</strong><small>${b.desc}</small></div>`).join("")}
      <p class="muted">See all your badges in Saved → Been there.</p>
      <button class="btn btn-primary full" data-close-sheet>Yay! 🎉</button>
    </div>`, (sheet) => $("[data-close-sheet]", sheet).addEventListener("click", closeSheet));
}

// Add-to-list panel (also used elsewhere)
function openListPicker(activityId) {
  const draw = () => {
    const lists = Store.s.lists;
    return `
      ${lists.length ? `<div class="radio-list">${lists.map((l) => `
        <button type="button" class="radio-row" data-list="${l.id}" aria-pressed="${l.items.includes(activityId)}">
          <span>📋 ${esc(l.name)} <small class="muted">(${l.items.length})</small></span><span class="tick">✓</span>
        </button>`).join("")}</div>` : `<p class="muted">You haven't made any lists yet.</p>`}
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
        toast(`Added to “${esc(name)}”`);
        box.innerHTML = draw(); bind();
      });
    };
    bind();
  });
}
