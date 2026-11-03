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
  v: 1,
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
- Di claude.ai, app guna `window.claude.use("db")` + `use("user")` untuk simpan ke `data/users/<id>/plan` (peribadi), dan `use("downloads")` untuk sandaran. **API ini hanya wujud dalam paparan artifak claude.ai.**
- Di luar claude.ai, `window.claude` tiada → app automatik guna `localStorage` (kunci `pelan2030`). Jadi fail ini terus berfungsi secara tempatan.
- Butang "Muat turun sandaran" bergantung pada `downloads`; untuk versi tempatan, tukar kepada `Blob` + `<a download>`.
- Data pengguna di claude.ai TIDAK ikut fail ini. Pengguna perlu "Muat turun sandaran" di claude.ai dahulu, kemudian "Pulihkan sandaran" dalam versi baru.

## Gaya reka bentuk
- Fon: Bricolage Grotesque (tajuk), IBM Plex Sans (teks).
- Warna (token pada `:root`, ada mod gelap): kertas `#ECF0ED`, dakwat `#17263A`, merah passport `#7A1F2B`, teal `#2C6B66`, amber `#A86A12`, emas `#B8892B`.
- Mobile-first, safe-area insets, fokus papan kekunci jelas, hormati reduced-motion.

## Cadangan kerja seterusnya
- Pecahkan kepada projek (cth. Vite + vanilla/React) atau kekalkan satu fail — tanya pengguna.
- Jadikan PWA (manifest + service worker) supaya boleh dipasang di telefon dan guna luar talian.
- Notifikasi tarikh bayar (Notification API / kalendar .ics eksport).
- Penyegerakan awan (cth. Supabase) dengan log masuk, menggantikan storan claude.ai.
- Eksport laporan PDF/Excel bulanan.
- Ujian untuk fungsi kira: `monthsToPay`, `upcoming`, `savCalc`, `calc`.

## Peraturan
- Teks UI dalam Bahasa Melayu, ayat biasa (bukan huruf besar semua).
- Jangan buang data pengguna semasa migrasi skema — naikkan `v` dan tambah migrasi dalam `normalize()`.
