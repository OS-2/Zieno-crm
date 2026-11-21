// Service worker: يخلي التطبيق يفتح من غير نت. غيّر رقم النسخة لما تعدل الملفات.
const P = "zieno-crm-";
const V = P + "v11";
const CDN = P + "cdn-v1";
const SHELL = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./logo.png", "./logo-dark.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith(P) && k !== V && k !== CDN).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    if (r.mode === "navigate") {
      e.respondWith(
        fetch(r)
          .then((res) => { const cp = res.clone(); caches.open(V).then((c) => c.put("./index.html", cp)); return res; })
          .catch(() => caches.match("./index.html"))
      );
      return;
    }
    e.respondWith(
      caches.match(r).then((hit) => {
        const net = fetch(r)
          .then((res) => { if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); } return res; })
          .catch(() => hit);
        return hit || net;
      })
    );
    return;
  }
  if (/(^|\.)(jsdelivr\.net|cloudflare\.com|googleapis\.com|gstatic\.com)$/.test(u.hostname)) {
    e.respondWith(
      caches.open(CDN).then((c) =>
        c.match(r).then((hit) => {
          const net = fetch(r)
            .then((res) => { if (res.ok || res.type === "opaque") c.put(r, res.clone()); return res; })
            .catch(() => hit);
          return hit || net;
        })
      )
    );
  }
});
