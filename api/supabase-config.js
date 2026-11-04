// Fungsi Vercel: pulangkan URL + kunci AWAM Supabase daripada pemboleh ubah persekitaran
// (diisi automatik oleh integrasi Supabase ↔ Vercel, atau ditambah manual).
// HANYA kunci publishable/anon — kunci ini memang direka untuk pelayar dan dilindungi RLS.
// JANGAN sekali-kali pulangkan SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY di sini.
module.exports = (req, res) => {
  const env = process.env;
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "";
  const supabaseKey =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).send(JSON.stringify({ supabaseUrl, supabaseKey }));
};
