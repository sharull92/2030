# Pelan 2030 — Nota serahan untuk Claude Code

## Tentang projek
App perancangan peribadi hingga 31 Dis 2030 untuk seorang HR bahagian Pengurusan Pekerja Asing (kepakaran: passport, permit PLKS, CIDB). Matlamat pengguna: ambil TTT, daftar jurulatih HRD Corp, bina app/produk AI, dan bina pendapatan pasif di samping gaji.

Bahasa antara muka: **Bahasa Melayu**. Mata wang: **RM** (`ms-MY`).

## Fail
- `pelan-2030.html` — app lengkap dalam satu fail (HTML + CSS + JS vanila, tiada build step). Buka terus dalam pelayar.

## Ciri sedia ada (6 tab, nav bawah)
1. **Ringkasan** — hero "cop passport" 2026–2030 + kiraan hari; pendapatan, komitmen + hutang, baki, DSR (<40% sihat, 40–60% berhati-hati, >60% tinggi); campuran pendapatan aktif/sampingan/pasif; kemajuan sasaran pasif; peringatan tarikh bayar 14 hari (butang "Dah bayar" auto-rekod transaksi); graf trend 6/12 bulan (SVG inline); ringkasan emas & ASB; langkah seterusnya.
2. **Kewangan** — sumber pendapatan; rekod transaksi ikut bulan; sasaran emas (gram) & ASB (stage 1/2); dana kecemasan.
3. **Hutang** — komitmen bulanan (tarikh bayar); hutang disusun ikut faedah tertinggi (avalanche) dengan anggaran tarikh selesai.
4. **Pelan 2030** — matlamat ikut tahun, templat cadangan (TTT → HRD Corp → modul pematuhan → app AI → pasif).
5. **Niaga** — projek dengan peringkat Idea → Validasi → Bina → Lancar → Skala + senarai langkah proses; templat idea.
6. **Tetapan** — nama, sasaran pasif, sandaran/pulih JSON, padam semua.

## Model data (satu objek `S`)
```js
{
  v: 2,
  updatedAt: Number,   // ms, untuk penyegerakan awan (v2)
  settings: { name, targetPassive, emergencyMonths },
  savings: Number,
  incomes:     [{ id, name, type: "aktif"|"sampingan"|"pasif", amount }],
  commitments: [{ id, name, amount, day }],
  debts:       [{ id, name, balance, rate, payment, day }],
  tx:          [{ id, date: "YYYY-MM-DD", type: "in"|"out", cat, amount, note, link? }],
  goals:       [{ id, year, area, title, done }],
  ventures:    [{ id, name, kind, target, stage: 0-4, steps: [{ t, done }] }],
  paid:        { "<itemId>:<YYYY-MM>": true },   // peringatan yang sudah dibayar
  gold: { have, target: 30, price, by: "YYYY-MM" },
  asb:  { have, s1: 15000, s2: 30000, s1by, s2by }
}
```
`normalize()` menggabungkan data lama dengan nilai lalai — kekalkan apabila menambah medan baru.

## Storan — PENTING
- Utama: `localStorage` (kunci `pelan2030`) — app berfungsi luar talian tanpa akaun.
- Awan (pilihan): Supabase. `config.js` mengandungi `supabaseUrl` + kunci publishable/anon (selamat, dilindungi RLS — jangan sekali-kali letak kunci secret/service_role). Jadual `public.plans (user_id, data jsonb, updated_at)` — skema dalam `supabase/schema.sql`.
- Log masuk melalui pautan e-mel (`signInWithOtp`). Selepas log masuk, app tarik data awan; versi dengan `updatedAt` lebih baharu menang (keseluruhan dokumen). Setiap `commit()` menolak ke awan (debounce 1.2 s). Data ditarik semula apabila tab kembali aktif.
- Sandaran: `Blob` + `<a download>`; pulih melalui fail JSON.
- PWA: ikon PNG 192/512 (any + maskable) dalam `icons/` — wajib supaya Chrome Android pasang sebagai app sebenar (WebAPK) tanpa lencana Chrome. Butang "Pasang app" di Tetapan guna `beforeinstallprompt`.
- Hosting: Vercel (statik, tiada build). `vercel.json` set `no-cache` untuk `sw.js` dan `config.js`. Service worker guna rangkaian dahulu untuk fail sama-asal, dan tidak mengganggu permintaan ke Supabase/CDN.

## Gaya reka bentuk
- Fon: Bricolage Grotesque (tajuk), IBM Plex Sans (teks).
- Warna (token pada `:root`, ada mod gelap): kertas `#ECF0ED`, dakwat `#17263A`, merah passport `#7A1F2B`, teal `#2C6B66`, amber `#A86A12`, emas `#B8892B`.
- Mobile-first, safe-area insets, fokus papan kekunci jelas, hormati reduced-motion.

## Cadangan kerja seterusnya
- Pecahkan kepada projek (cth. Vite + vanilla/React) atau kekalkan satu fail — tanya pengguna.
- Notifikasi tarikh bayar (Notification API / kalendar .ics eksport).
- Eksport laporan PDF/Excel bulanan.
- Ujian untuk fungsi kira: `monthsToPay`, `upcoming`, `savCalc`, `calc`.

## Peraturan
- Teks UI dalam Bahasa Melayu, ayat biasa (bukan huruf besar semua).
- Jangan buang data pengguna semasa migrasi skema — naikkan `v` dan tambah migrasi dalam `normalize()`.
