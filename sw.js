const C = "musik-v2", A = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => e.waitUntil(caches.open(C).then(c => c.addAll(A.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => clients.claim())));
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || r.headers.has("range") || /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|lrc|json)$/i.test(u.pathname)) return;
  e.respondWith(fetch(r, { cache: "no-store" }).then(x => { const cp = x.clone(); caches.open(C).then(c => c.put(r, cp)); return x; })
    .catch(() => caches.match(r).then(m => m || caches.match("index.html"))));
});
