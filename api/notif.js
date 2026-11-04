// Penerima notifikasi telefon (cth. MacroDroid "HTTP Request").
// POST /api/notif?t=<token>&u=<supabase url>&k=<kunci awam>&a=<nama app>
// Badan: teks biasa notifikasi (text/plain), atau JSON/borang dengan medan "text" (+ "app").
// Fungsi ini hanya memanjangkan ke RPC add_notif — tiada kunci rahsia di sini.
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).send("Guna POST");
  const q = req.query || {};
  const env = process.env;
  const url = String(q.u || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = String(q.k || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "");
  // Hanya ke projek Supabase (elak digunakan sebagai proksi terbuka).
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) return res.status(400).send("URL Supabase tidak sah");
  if (!q.t || String(q.t).length < 32 || !key) return res.status(400).send("Token / kunci tiada");
  let body = req.body, text = "", app = String(q.a || "");
  if (typeof body === "string") text = body;
  else if (Buffer.isBuffer(body)) text = body.toString("utf8");
  else if (body && typeof body === "object") { text = String(body.text || body.notification || body.body || ""); app = app || String(body.app || ""); if (!text) text = JSON.stringify(body); }
  text = text.slice(0, 1000).trim();
  if (!text) return res.status(400).send("Teks notifikasi kosong");
  const headers = { apikey: key, "Content-Type": "application/json" };
  if (/^eyJ/.test(key)) headers.Authorization = "Bearer " + key;
  try {
    const r = await fetch(url + "/rest/v1/rpc/add_notif", { method: "POST", headers, body: JSON.stringify({ p_token: String(q.t), p_text: text, p_app: app.slice(0, 80) || null }) });
    const out = await r.text();
    return res.status(r.ok ? 200 : 502).send(r.ok ? "ok" : "Supabase: " + out.slice(0, 200));
  } catch (e) {
    return res.status(502).send("Gagal hubungi Supabase");
  }
};
