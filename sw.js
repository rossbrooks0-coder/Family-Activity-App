// Service worker: keeps a copy of the app so it opens quickly and works offline.
const CACHE = "little-explorers-v2";
const FILES = [
  "./", "index.html", "styles.css", "config.js", "data.js", "store.js", "ui.js", "app.js",
  "screens/welcome.js", "screens/home.js", "screens/explore.js", "screens/detail.js",
  "screens/saved.js", "screens/suggest.js", "screens/profile.js", "manifest.webmanifest",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Try the network first (so updates show up), fall back to the saved copy when offline.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
  );
});
