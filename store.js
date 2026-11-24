// Everything the app remembers is stored here, on this phone only.
const Store = (() => {
  const KEY = "little-explorers-v1";
  const defaults = () => ({
    onboarded: false,
    familyName: "",        // e.g. "The Campbells"
    photo: null,           // small profile photo (stored as an image text string)
    children: [],          // [{ id, name, age }]
    needs: [],             // facility ids that matter, e.g. ["pushchair", "toilets"]
    coords: null,          // { lat, lng } last known position, refreshed each time the app opens
    units: "miles",
    saved: [],             // activity ids
    lists: [],             // [{ id, name, items: [activity ids] }]
    visits: [],            // [{ id: activity id, date: ISO string }]
    checklists: {},        // { activityId: [ticked item indexes] }
    suggestions: [],       // places this parent has suggested
  });

  function load() {
    let s = defaults();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) s = { ...s, ...JSON.parse(raw) };
      else {
        // carry over favourites from the first version of the app
        const old = JSON.parse(localStorage.getItem("saved") || "[]");
        if (Array.isArray(old)) s.saved = old;
      }
    } catch {}
    return s;
  }

  let state = load();
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

  return {
    get s() { return state; },
    update(fn) { fn(state); persist(); },
    reset() { state = defaults(); persist(); },
  };
})();

// ---------- Small helpers built on the store ----------
const uid = () => Math.random().toString(36).slice(2, 9);
const byId = (id) => ACTIVITIES.find((a) => a.id === id);

function isSaved(id) { return Store.s.saved.includes(id); }
function toggleSaved(id) {
  let on;
  Store.update((s) => {
    on = !s.saved.includes(id);
    s.saved = on ? [...s.saved, id] : s.saved.filter((x) => x !== id);
  });
  return on;
}

function visitsFor(id) { return Store.s.visits.filter((v) => v.id === id); }
function earnedBadges(visits = Store.s.visits) {
  const acts = visits.map((v) => byId(v.id)).filter(Boolean);
  return BADGES.filter((b) => b.test(visits, acts));
}

// Where distances are measured from: the phone's location
function refPoint() {
  return Store.s.coords || null;
}
function distanceKm(a) {
  const p = refPoint();
  if (!p) return null;
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(a.lat - p.lat), dLng = toRad(a.lng - p.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p.lat)) * Math.cos(toRad(a.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function formatDistance(km) {
  if (km == null) return "";
  const v = Store.s.units === "miles" ? km * 0.621 : km;
  const unit = Store.s.units === "miles" ? "mi" : "km";
  return v < 1 ? `< 1 ${unit}` : `${Math.round(v)} ${unit}`;
}
function unitToKm(v) { return Store.s.units === "miles" ? v / 0.621 : v; }


function currentSeason(d = new Date()) {
  const m = d.getMonth();
  return m <= 1 || m === 11 ? "winter" : m <= 4 ? "spring" : m <= 7 ? "summer" : "autumn";
}

const ageOk = (a, age) => age >= a.ageMin && age <= a.ageMax;

// Score how well a place suits this family (higher = better)
function matchScore(a) {
  const s = Store.s;
  let score = a.popularity / 50;
  s.children.forEach((c) => { score += ageOk(a, c.age) ? 3 : -4; });
  s.needs.forEach((n) => { score += a.facilities.includes(n) ? 2 : -1.5; });
  if (a.seasons.includes(currentSeason())) score += 1.5;
  const km = distanceKm(a);
  if (km != null) score += Math.max(0, 4 - km / 25);
  return score;
}

