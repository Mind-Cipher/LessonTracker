/* Lesson tracker — offline support.
   Network first: when online you always get the latest upload; offline, the last copy is used. */
const CACHE = "lessons-v1";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  e.respondWith(
    fetch(req).then(res => {
      if(res && (res.ok || res.type === "opaque")){
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() =>
      caches.match(req).then(hit => hit || (req.mode === "navigate" ? caches.match("index.html") : undefined))
    )
  );
});
