// Little Explorers – decides which screen to show.
// Screens are chosen by the part of the web address after "#",
// e.g. #/activity/lochside-loop or #/saved/lists

function route() {
  closeSheet();
  const t = document.getElementById("toast");
  if (t) t.classList.remove("show");
  // remember that we've moved within the app, so Back buttons work nicely
  if (!history.state || !history.state.inApp) {
    if (routedOnce) history.replaceState({ inApp: true }, "");
  }
  routedOnce = true;

  const path = location.hash.replace(/^#\/?/, "");
  const [page = "", id, sub] = path.split("/").map(decodeURIComponent);

  // First visit: show the welcome screens
  if (!Store.s.onboarded && page === "") return renderWelcome(0);

  switch (page) {
    case "": renderHome(); break;
    case "welcome": renderWelcome(0); break;
    case "explore": renderExplore(); break;
    case "activity": renderDetail(id); break;
    case "saved": renderSaved(["favourites", "lists", "been"].includes(id) ? id : "favourites"); break;
    case "list": renderList(id); break;
    case "suggest":
      if (id === "thanks") renderSuggestThanks();
      else if (id === "mine") renderMySuggestions();
      else renderSuggest();
      break;
    case "profile":
      if (id === "children") renderProfileChildren();
      else if (id === "needs") renderProfileNeeds();
      else if (id === "area") renderProfileArea();
      else renderProfile();
      break;
    case "help": renderHelp(); break;
    case "about": renderAbout(); break;
    default: renderNotFound();
  }
  window.scrollTo(0, 0);
}

let routedOnce = false;
window.addEventListener("hashchange", route);
route();

// ---------- Offline support / installability ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
