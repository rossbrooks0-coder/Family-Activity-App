// Suggest a place – parents send in places for review
function renderSuggest() {
  const mine = Store.s.suggestions.length;
  const ageOpts = Array.from({ length: 13 }, (_, i) => `<option value="${i}">${i === 0 ? "Under 1" : i}</option>`).join("");

  UI.screen({
    tab: "",
    top: UI.backBar("Suggest a place", "#/profile"),
    html: `
      <p class="lede">Know a family-friendly place we're missing? Tell us about it. We read every suggestion and add the ones that fit.</p>
      ${mine ? `<a class="hint-row" href="#/suggest/mine">${icon("send", 18)}<span>Your suggestions</span><span class="hint-count">${mine}</span>${icon("chevron-right", 18)}</a>` : ""}

      <form id="suggest-form" class="form" novalidate>
        <label class="field">
          <span class="field-label">Name of the place <em>*</em></span>
          <input class="input" name="name" required maxlength="80" placeholder="e.g. Bluebell Woods" />
        </label>
        <label class="field">
          <span class="field-label">Where is it? <em>*</em></span>
          <input class="input" name="location" required maxlength="120" placeholder="Town, postcode or how to find it" />
        </label>
        <label class="field">
          <span class="field-label">Region</span>
          <span class="select-wrap"><select name="region"><option value="">Not sure</option>${REGIONS.map((r) => `<option value="${r.id}" ${Store.s.region === r.id ? "selected" : ""}>${r.name}</option>`).join("")}</select></span>
        </label>

        <span class="field-label">What kind of place?</span>
        ${chipGroup("type", [...typeOptions(), { value: "Other", label: "Other" }], [], { multi: false })}

        <div class="two-col">
          <label class="field"><span class="field-label">Good from age</span><span class="select-wrap"><select name="ageMin">${ageOpts}</select></span></label>
          <label class="field"><span class="field-label">Up to age</span><span class="select-wrap"><select name="ageMax">${ageOpts.replace('value="12"', 'value="12" selected')}</select></span></label>
        </div>

        <span class="field-label">How long did you spend there?</span>
        ${chipGroup("time", [{ value: "Under 1 hr", label: "Under 1 hr" }, { value: "1–2 hrs", label: "1–2 hrs" }, { value: "Half a day", label: "Half a day" }, { value: "All day", label: "All day" }], [], { multi: false })}

        <span class="field-label">What's there?</span>
        ${chipGroup("facilities", facilityOptions(), [])}

        <label class="field">
          <span class="field-label">Why do you recommend it? <em>*</em></span>
          <textarea class="input" name="why" required rows="4" maxlength="1000" placeholder="What did your kids love? What makes it special?"></textarea>
        </label>
        <label class="field">
          <span class="field-label">Anything else parents should know?</span>
          <textarea class="input" name="tips" rows="3" maxlength="1000" placeholder="Parking, costs, opening times, muddy paths, best time to go"></textarea>
        </label>

        <h3 class="form-section">About you <span class="muted">(optional)</span></h3>
        <label class="field">
          <span class="field-label">Your first name</span>
          <input class="input" name="by" maxlength="40" autocomplete="given-name" />
        </label>
        <label class="field">
          <span class="field-label">Email (only if you're happy for us to contact you about it)</span>
          <input class="input" name="email" type="email" maxlength="120" autocomplete="email" inputmode="email" />
        </label>

        <button class="btn btn-primary full" type="submit">${icon("send", 18)}Send suggestion</button>
        <p class="muted small-text center">By sending, you're happy for us to use these details to add the place to ${CONFIG.appName}</p>
      </form>`,
  });

  const form = $("#suggest-form");
  bindChipGroups(form);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const missing = [["name", "the place name"], ["location", "where it is"], ["why", "why you recommend it"]].find(([k]) => !String(d[k] || "").trim());
    if (missing) {
      toast(`Please add ${missing[1]}`);
      form.elements[missing[0]].focus();
      return;
    }
    if (d.email && !form.elements.email.checkValidity()) { toast("That email doesn't look quite right"); form.elements.email.focus(); return; }
    if (Number(d.ageMax) < Number(d.ageMin)) [d.ageMin, d.ageMax] = [d.ageMax, d.ageMin];

    const suggestion = {
      id: uid(),
      date: new Date().toISOString(),
      status: "Sent for review",
      name: d.name.trim(), location: d.location.trim(), region: d.region,
      type: chipValues(form, "type")[0] || "", time: chipValues(form, "time")[0] || "",
      ageMin: Number(d.ageMin), ageMax: Number(d.ageMax),
      facilities: chipValues(form, "facilities"),
      why: d.why.trim(), tips: d.tips.trim(), by: d.by.trim(), email: d.email.trim(),
    };
    Store.update((s) => { s.suggestions.push(suggestion); });
    sendSuggestion(suggestion);
    location.hash = "#/suggest/thanks";
  });
}

// For now: if an email is set in config.js, open the parent's email app with the details.
function sendSuggestion(sg) {
  if (!CONFIG.suggestionsEmail) return;
  const lines = [
    `Place: ${sg.name}`, `Location: ${sg.location}`, `Region: ${regionById(sg.region)?.name || "Not sure"}`,
    `Type: ${sg.type || "-"}`, `Ages: ${sg.ageMin}–${sg.ageMax}`, `Time spent: ${sg.time || "-"}`,
    `Facilities: ${sg.facilities.map((f) => FACILITIES[f].label).join(", ") || "-"}`,
    ``, `Why: ${sg.why}`, ``, `Tips: ${sg.tips || "-"}`, ``, `From: ${sg.by || "Anonymous"} ${sg.email ? "(" + sg.email + ")" : ""}`,
  ];
  location.href = `mailto:${CONFIG.suggestionsEmail}?subject=${encodeURIComponent("Place suggestion: " + sg.name)}&body=${encodeURIComponent(lines.join("\n"))}`;
}

function renderSuggestThanks() {
  UI.screen({
    tab: "",
    top: UI.backBar("Suggestion sent", "#/profile"),
    html: emptyHTML("circle-check", "Thanks for the suggestion", "We'll take a look and, if it's a good fit, add it to the app for other families to enjoy.",
      `<div class="stack"><a class="btn btn-primary" href="#/suggest">Suggest another place</a><a class="btn btn-secondary" href="#/suggest/mine">See your suggestions</a><a class="btn btn-link" href="#/profile">Back to profile</a></div>`),
  });
}

function renderMySuggestions() {
  const list = [...Store.s.suggestions].reverse();
  UI.screen({
    tab: "",
    top: UI.backBar("Your suggestions", "#/profile"),
    html: list.length
      ? `<div class="list-card">${list.map((sg) => `
          <div class="row">
            ${thumbHTML(TYPES[sg.type] || "lightbulb")}
            <span class="row-text"><strong>${esc(sg.name)}</strong><small>${esc(sg.location)} · ${new Date(sg.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</small></span>
            <span class="status">${esc(sg.status)}</span>
          </div>`).join("")}</div>`
      : emptyHTML("send", "No suggestions yet", "Places you suggest will appear here", `<a class="btn btn-primary" href="#/suggest">Suggest a place</a>`),
  });
}
