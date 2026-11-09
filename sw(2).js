const C = "musik-v3", OFF = "offline-audio", A = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
const MEDIA = /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|lrc)$/i;
self.addEventListener("install", e => e.waitUntil(caches.open(C).then(c => c.addAll(A.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C && x !== OFF).map(x => caches.delete(x)))).then(() => clients.claim())));

// Musik/Lyrics: zuerst im Offline-Speicher suchen (mit Range-Unterstützung, die iOS für Audio braucht), sonst aus dem Netz
async function media(r) {
  const c = await caches.open(OFF), m = await c.match(r.url);
  if (!m) return fetch(r);
  const rg = r.headers.get("range"), x = rg && /bytes=(\d*)-(\d*)/.exec(rg);
  if (!x) return m;
  const b = await m.blob(), len = b.size; let s, e;
  if (x[1] === "") { s = Math.max(0, len - (+x[2])); e = len - 1; } else { s = +x[1]; e = x[2] === "" ? len - 1 : Math.min(+x[2], len - 1); }
  if (s >= len) return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + len } });
  return new Response(b.slice(s, e + 1), { status: 206, headers: { "Content-Type": m.headers.get("Content-Type") || "audio/mpeg", "Content-Range": "bytes " + s + "-" + e + "/" + len, "Content-Length": String(e - s + 1), "Accept-Ranges": "bytes" } });
}
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  if (u.origin === location.origin && MEDIA.test(u.pathname)) { e.respondWith(media(r)); return; }
  if (u.hostname === "cdnjs.cloudflare.com") {   // Tag-Bibliothek auch offline verfügbar
    e.respondWith(fetch(r).then(x => { const cp = x.clone(); caches.open(C).then(c => c.put(r, cp)); return x; }).catch(() => caches.match(r)));
    return;
  }
  if (u.origin !== location.origin || r.headers.has("range") || /\.json$/i.test(u.pathname)) return;
  e.respondWith(fetch(r, { cache: "no-store" }).then(x => { const cp = x.clone(); caches.open(C).then(c => c.put(r, cp)); return x; })
    .catch(() => caches.match(r).then(m => m || caches.match("index.html"))));
});
