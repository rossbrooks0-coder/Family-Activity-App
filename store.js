// Everything the app remembers is stored here, on this phone only.
const Store = (() => {
  const KEY = "little-explorers-v1";
  const defaults = () => ({
    onboarded: false,
    children: [],          // [{ id, name, age }]
    needs: [],             // facility ids that matter, e.g. ["pushchair", "toilets"]
    region: null,          // region id
    coords: null,          // { lat, lng } if location was shared
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
const regionById = (id) => REGIONS.find((r) => r.id === id);

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

// Where distances are measured from: shared location, else chosen region
function refPoint() {
  if (Store.s.coords) return Store.s.coords;
  const r = regionById(Store.s.region);
  return r ? { lat: r.lat, lng: r.lng } : null;
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

// Short reasons shown on "Picked for you" cards
function matchReason(a) {
  const s = Store.s;
  const okKids = s.children.filter((c) => ageOk(a, c.age));
  if (s.children.length && okKids.length === s.children.length) return s.children.length > 1 ? "Great for all your kids" : "Great for your child's age";
  const need = s.needs.find((n) => a.facilities.includes(n));
  if (need) return FACILITIES[need].label;
  return "Popular with families";
}
