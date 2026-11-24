// First-time welcome: children → what matters → area
function renderWelcome(step = 0) {
  const steps = 3;
  const go = (n) => renderWelcome(n);
  const finish = () => {
    Store.update((s) => { s.onboarded = true; });
    // If the address is already #/ setting it again does nothing, so show home directly
    if (location.hash === "#/") route();
    else location.hash = "#/";
  };

  if (step === 0) {
    UI.screen({
      nav: false,
      html: `
        <section class="welcome-hero">
          <img src="icons/icon.svg" alt="" width="88" height="88" />
          <h2>${CONFIG.appName}</h2>
          <p>Walks, trails, parks and gardens across Scotland, picked for your children's ages</p>
        </section>
        <div class="sticky-cta">
          <button class="btn btn-primary full" id="start">Get started</button>
          <button class="btn btn-link full" id="skip">Skip for now</button>
        </div>`,
    });
    $("#start").addEventListener("click", () => go(1));
    $("#skip").addEventListener("click", finish);
    return;
  }

  const content = {
    1: { title: "Who's exploring?", sub: "Add your children so we can suggest places that suit their ages", body: childrenEditorHTML() },
    2: { title: "What matters to you?", sub: "Pick anything that's important when you're out and about", body: needsPickerHTML() },
    3: { title: "Where are you?", sub: "We'll show places near you first", body: areaPickerHTML() },
  }[step];

  // Progress shown as a dotted trail with a stop for each step
  const trail = `<div class="trail-progress" role="progressbar" aria-valuemin="1" aria-valuemax="${steps}" aria-valuenow="${step}" aria-label="Step ${step} of ${steps}">
    ${Array.from({ length: steps }, (_, i) => `<span class="stop ${i < step ? "done" : ""}"></span>`).join(`<span class="path"></span>`)}
  </div>`;

  UI.screen({
    nav: false,
    top: `<button class="icon-btn" id="wback" aria-label="Back">${icon("arrow-left", 20)}</button><div class="spacer"></div>${trail}<div class="spacer"></div><button class="btn-link" id="wskip">Skip</button>`,
    html: `
      <section class="welcome-step">
        <h2>${content.title}</h2>
        <p class="lede">${content.sub}</p>
        <div id="step-body">${content.body}</div>
      </section>
      <div class="sticky-cta"><button class="btn btn-primary full" id="next">${step === steps ? "Start exploring" : "Next"}</button></div>`,
  });

  const root = $("#step-body");
  $("#wback").addEventListener("click", () => go(step - 1));
  $("#wskip").addEventListener("click", () => (step === steps ? finish() : go(step + 1)));
  $("#next").addEventListener("click", () => (step === steps ? finish() : go(step + 1)));

  if (step === 1) bindChildrenEditor(root, () => go(1));
  if (step === 2) bindNeedsPicker(root, (vals) => Store.update((s) => { s.needs = vals; }));
  if (step === 3) bindAreaPicker(root, () => go(3));
}
