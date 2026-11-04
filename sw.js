// Service worker: rangkaian dahulu untuk fail app (sentiasa versi terkini),
// cache sebagai sandaran apabila luar talian. Permintaan ke domain lain (Supabase, CDN) tidak diganggu.
// Juga: notifikasi tarikh bayar (semak bila app dibuka + Periodic Background Sync).
const CACHE = "pelan2030-v4";
const DATA = "pelan2030-data"; // senarai peringatan dari app + log notifikasi — jangan dipadam
const ASSETS = ["./", "index.html", "pelan-2030.html", "config.js", "manifest.webmanifest", "icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== DATA).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/__")) return;
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});

/* ---------- notifikasi ---------- */
const BULAN = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];
const pad = n => String(n).padStart(2, "0");

async function semak() {
  if (self.Notification && Notification.permission !== "granted") return;
  const c = await caches.open(DATA);
  const r = await c.match("/__peringatan.json");
  if (!r) return;
  const { on, days, items } = await r.json();
  if (!on) return;
  const lr = await c.match("/__dimaklum.json");
  const log = lr ? await lr.json() : {};
  const t = new Date();
  const hariIni = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
  const t0 = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
  const keys = new Set();
  for (const it of items) {
    keys.add(it.key);
    const [y, m, d] = it.due.split("-").map(Number);
    const diff = Math.round((Date.UTC(y, m - 1, d) - t0) / 86400000);
    if (diff > days || diff < -31 || log[it.key] === hariIni) continue;
    const bila = diff < 0 ? `lewat ${-diff} hari` : diff === 0 ? "hari ini" : diff === 1 ? "esok" : `dalam ${diff} hari`;
    await self.registration.showNotification(`Bayar ${it.name} ${bila}`, {
      body: `RM ${Math.round(it.amount).toLocaleString("ms-MY")} · tarikh ${d} ${BULAN[m - 1]} ${y}`,
      icon: "icons/icon-192.png", badge: "icons/icon-192.png", tag: it.key, data: { url: "pelan-2030.html" }
    });
    log[it.key] = hariIni;
  }
  for (const k of Object.keys(log)) if (!keys.has(k)) delete log[k];
  await c.put("/__dimaklum.json", new Response(JSON.stringify(log), { headers: { "content-type": "application/json" } }));
}

self.addEventListener("message", e => { if (e.data && e.data.type === "semak") e.waitUntil(semak()); });
self.addEventListener("periodicsync", e => { if (e.tag === "peringatan") e.waitUntil(semak()); });
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const w of list) if ("focus" in w) return w.focus();
    return self.clients.openWindow((e.notification.data && e.notification.data.url) || "pelan-2030.html");
  }));
});
