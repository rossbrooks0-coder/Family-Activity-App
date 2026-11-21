// First-time welcome: children → what matters → area
function renderWelcome(step = 0) {
  const steps = 3;
  const dots = (n) => `<div class="dots">${Array.from({ length: steps }, (_, i) => `<span class="${i < n ? "on" : ""}"></span>`).join("")}</div>`;
  const go = (n) => renderWelcome(n);
  const finish = () => { Store.update((s) => { s.onboarded = true; }); location.hash = "#/"; };

  if (step === 0) {
    UI.screen({
      nav: false,
      html: `
        <section class="welcome-hero">
          <img src="icons/icon.svg" alt="" width="104" height="104" />
          <h2>Welcome to ${CONFIG.appName}</h2>
          <p>Find family-friendly walks, trails, parks and gardens across Scotland, picked for your children's ages.</p>
          <button class="btn btn-primary full" id="start">Get started</button>
          <button class="btn btn-link full" id="skip">Skip for now</button>
        </section>`,
    });
    $("#start").addEventListener("click", () => go(1));
    $("#skip").addEventListener("click", finish);
    return;
  }

  const content = {
    1: { title: "Who's exploring?", sub: "Add your children so we can suggest places that suit their ages.", body: childrenEditorHTML() },
    2: { title: "What matters to you?", sub: "Pick anything that's important when you're out and about.", body: needsPickerHTML() },
    3: { title: "Where are you?", sub: "We'll show places near you first.", body: areaPickerHTML() },
  }[step];

  UI.screen({
    nav: false,
    top: `<button class="icon-btn" id="wback" aria-label="Back">←</button><div class="spacer"></div>${dots(step)}<div class="spacer"></div><button class="btn-link" id="wskip">Skip</button>`,
    html: `
      <section class="welcome-step">
        <h2>${content.title}</h2>
        <p class="muted">${content.sub}</p>
        <div id="step-body">${content.body}</div>
      </section>
      <div class="sticky-cta"><button class="btn btn-primary full" id="next">${step === steps ? "Let's go! 🎉" : "Next"}</button></div>`,
  });

  const root = $("#step-body");
  $("#wback").addEventListener("click", () => go(step - 1));
  $("#wskip").addEventListener("click", () => (step === steps ? finish() : go(step + 1)));
  $("#next").addEventListener("click", () => (step === steps ? finish() : go(step + 1)));

  if (step === 1) bindChildrenEditor(root, () => go(1));
  if (step === 2) bindNeedsPicker(root, (vals) => Store.update((s) => { s.needs = vals; }));
  if (step === 3) bindAreaPicker(root, () => go(3));
}
