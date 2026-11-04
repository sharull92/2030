# Pelan 2030 — Nota serahan untuk Claude Code

## Tentang projek
App perancangan peribadi hingga 31 Dis 2030 untuk seorang HR bahagian Pengurusan Pekerja Asing (kepakaran: passport, permit PLKS, CIDB). Matlamat pengguna: ambil TTT, daftar jurulatih HRD Corp, bina app/produk AI, dan bina pendapatan pasif di samping gaji.

Bahasa antara muka: **Bahasa Melayu**. Mata wang: **RM** (`ms-MY`).

## Fail
- `pelan-2030.html` — app lengkap dalam satu fail (HTML + CSS + JS vanila, tiada build step). Buka terus dalam pelayar.

## Ciri sedia ada (6 tab, nav bawah)
1. **Ringkasan** — hero "cop passport" 2026–2030 + kiraan hari; **Ringkasan ikut tahun** (pilih tahun; `yearSummary`: pendapatan = "Masuk" sebenar setiap bulan direkod, atau pendapatan dirancang jika tiada; duit keluar = tx keluar kecuali "Kad kredit" + belanja kad; komitmen bulan semasa belum "Dah bayar" → baki dijangka; pecahan ikut kategori), DSR (<40% sihat, 40–60% berhati-hati, >60% tinggi); campuran pendapatan aktif/sampingan/pasif; kemajuan sasaran pasif; peringatan tarikh bayar 14 hari (butang "Dah bayar" auto-rekod transaksi); graf trend 6/12 bulan (SVG inline); ringkasan emas & dana kecemasan; langkah seterusnya.
2. **Kewangan** — sumber pendapatan; rekod transaksi ikut bulan atau "Semua bulan" (`monthSelect` + tajuk bulan `withMonthHeads`; sama untuk rekod kad); sasaran emas (gram); dana kecemasan berperingkat: Stage 1 ASB RM15,000 → Stage 2 Tabung Haji RM15,000 (`emergencyCalc`), % dihadkan per stage, tunjuk berapa bulan komitmen+hutang boleh ditampung (termasuk `savings` = simpanan tunai lain).
3. **Hutang/Kad** — kad kredit (had, baki, % penggunaan <30% sihat, belanja bulan ikut kategori, bayaran minimum ≈5%/RM50, rekod belanja & bayaran; bayaran kad juga direkod dalam `tx`); komitmen bulanan (tarikh bayar); hutang disusun ikut faedah tertinggi (avalanche) dengan anggaran tarikh selesai.
4. **Pelan 2030** — matlamat ikut tahun, templat cadangan (TTT → HRD Corp → modul pematuhan → app AI → pasif).
5. **Niaga** — projek dengan peringkat Idea → Validasi → Bina → Lancar → Skala + senarai langkah proses; templat idea.
6. **Tetapan** — nama, sasaran pasif; notifikasi tarikh bayar (N hari sebelum); eksport kalendar .ics; pasang app; penyegerakan awan; sandaran/pulih JSON, padam semua.

## Model data (satu objek `S`)
```js
{
  v: 4,
  updatedAt: Number,   // ms, untuk penyegerakan awan (v2)
  settings: { name, targetPassive, emergencyMonths, notify, notifyDays },
  savings: Number,
  incomes:     [{ id, name, type: "aktif"|"sampingan"|"pasif", amount }],
  commitments: [{ id, name, amount, day }],
  debts:       [{ id, name, balance, rate, payment, day }],
  tx:          [{ id, date: "YYYY-MM-DD", type: "in"|"out", cat, amount, note, link? }],
  goals:       [{ id, year, area, title, done }],
  ventures:    [{ id, name, kind, target, stage: 0-4, steps: [{ t, done }] }],
  cards:       [{ id, name, limit, dueDay, rate }],                       // v3
  cardTx:      [{ id, cardId, date, type: "belanja"|"bayar"|"awal", amount, cat, note }],  // v3
  paid:        { "<itemId>:<YYYY-MM>": true },   // peringatan yang sudah dibayar
  gold: { have, target: 30, price, by: "YYYY-MM" },
  asb:  { have, s1: 15000, s1by },            // dana kecemasan stage 1 (ASB); asb.s2/s2by lama dikekalkan tetapi tidak digunakan
  th:   { have, target: 15000, by }           // v4: dana kecemasan stage 2 (Tabung Haji)
}
```
`normalize()` menggabungkan data lama dengan nilai lalai — kekalkan apabila menambah medan baru.

## Storan — PENTING
- Utama: `localStorage` (kunci `pelan2030`) — app berfungsi luar talian tanpa akaun.
- Awan (pilihan): Supabase. Tetapan dibaca dari `config.js`; jika kosong, app ambil dari fungsi Vercel `api/supabase-config.js` yang membaca env integrasi Supabase ↔ Vercel (`NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_URL` + kunci publishable/anon sahaja — JANGAN pulangkan service_role/secret). Nama fail sengaja bukan `config.js` kerana workflow segerak mengecualikan semua `config.js`. `config.js` mengandungi `supabaseUrl` + kunci publishable/anon (selamat, dilindungi RLS — jangan sekali-kali letak kunci secret/service_role). Jadual `public.plans (user_id, data jsonb, updated_at)` — skema dalam `supabase/schema.sql`.
- Log masuk dengan **e-mel + kata laluan** (`signUp` / `signInWithPassword`) — e-mel & kata laluan sama di setiap telefon = data sama. Pautan e-mel (OTP) dibuang kerana memerlukan Redirect URL dan terhad kadar e-mel. Disyorkan matikan "Confirm email" di Supabase. Akaun lama dari pautan e-mel tiada kata laluan → "Tetapkan / tukar kata laluan" (`updateUser`) di peranti yang sudah log masuk. Ralat log masuk dipapar kekal dalam `#loginErr` (tanpa render semula supaya input tidak hilang).
- **Pelan dikongsi** (beberapa e-mel, data sama): jadual `shared_plans (id, owner_id, owner_email, data jsonb, version)` + `plan_members (plan_id, email huruf kecil)`; RLS: pemilik atau ahli (ikut e-mel JWT) boleh baca/ubah `data`; hanya pemilik jemput/buang ahli; ahli boleh keluar sendiri; ahli tidak boleh ubah `owner_id` (geran lajur). Polisi `shared_plans` semak `owner_id` terus pada baris (fungsi security definer tidak nampak baris baru dalam `INSERT … RETURNING`).
- `findPlan()` utamakan pelan orang lain (saya dijemput), kemudian pelan sendiri; jika tiada, cipta daripada data peranti / jadual lama `plans` (yang lebih baharu). Peranti baru pada pelan sedia ada (e-mel sama atau dijemput): data awan menjadi rujukan kecuali awan kosong, data lama peranti disimpan di `localStorage["pelan2030:sandaran-sebelum-kongsi"]`.
- Segerak = gabungan tiga hala `mergePlan(base, local, remote)` (`merge3`: senarai ber-`id` digabung ikut item, objek ikut kunci, konflik medan sama → peranti ini, suntingan menang atas pemadaman). `base` = versi terakhir disegerak (`localStorage["pelan2030:base"]`). Tulis dengan kunci versi (`update … eq("version", v)`; ulang jika orang lain tulis dahulu). Bandingan guna `stable()` kerana jsonb menyusun semula kunci.
- Realtime: langgan `postgres_changes` UPDATE pada baris pelan → `syncNow()`. Juga segerak bila tab aktif semula dan 1.2 s selepas setiap `commit()`.
- Sandaran: `Blob` + `<a download>`; pulih melalui fail JSON.
- PWA: ikon PNG 192/512 (any + maskable) dalam `icons/` — wajib supaya Chrome Android pasang sebagai app sebenar (WebAPK) tanpa lencana Chrome. Butang "Pasang app" di Tetapan guna `beforeinstallprompt`.
- Notifikasi: app tulis `upcoming(S, today, 45)` ke Cache `pelan2030-data` → `/__peringatan.json` pada setiap `commit()` dan semasa dibuka; `sw.js` (`semak()`) papar notifikasi bagi item dalam N hari / lewat, sekali sehari setiap item (log `/__dimaklum.json`). Dicetus oleh mesej `semak` dari app dan `periodicsync` (tag `peringatan`, Chrome Android bila dipasang). Tiada server/Web Push.
- Kalendar: `buildICS()` — VEVENT bulanan (RRULE hingga 20301231, hari 29–31 → BYMONTHDAY=-1) dengan VALARM N hari sebelum 9 pagi + pada hari 9 pagi. UID stabil `<id>@pelan2030` supaya import semula mengemas kini.
- Hosting: Vercel (statik, tiada build). `vercel.json` set `no-cache` untuk `sw.js` dan `config.js`. Service worker guna rangkaian dahulu untuk fail sama-asal, dan tidak mengganggu permintaan ke Supabase/CDN.

## Aliran kerja deploy
- Kod dibangunkan di `sharull92/2030` (branch `ccr-e881134b-pdcvan`).
- Repo pengguna `hrsahrulsazly-bit/2030` ada GitHub Action `.github/workflows/segerak.yml` (salinan di `github-sync/segerak.yml`) yang menarik branch ini setiap 15 minit dan commit ke `main` — kecuali `config.js` dan `.github/`. Commit dibuat atas nama `github.actor` (bukan bot) kerana Vercel Hobby tidak deploy commit bot. Vercel deploy daripada `main`. Perubahan pada fail workflow mesti disalin manual oleh pengguna (folder `.github/` dikecualikan).
- Jadi: cukup push ke branch ini; jangan ubah `config.js` dengan kunci sebenar di sini.

## Gaya reka bentuk
- Fon: Bricolage Grotesque (tajuk), IBM Plex Sans (teks).
- Warna (token pada `:root`, ada mod gelap): kertas `#ECF0ED`, dakwat `#17263A`, merah passport `#7A1F2B`, teal `#2C6B66`, amber `#A86A12`, emas `#B8892B`.
- Mobile-first, safe-area insets, fokus papan kekunci jelas, hormati reduced-motion.

## Cadangan kerja seterusnya
- Pecahkan kepada projek (cth. Vite + vanilla/React) atau kekalkan satu fail — tanya pengguna.
- Web Push sebenar (Supabase Edge Function + cron + VAPID) jika notifikasi latar belakang tidak cukup.
- Eksport laporan PDF/Excel bulanan.
- Ujian: `node --test tests/calc.test.mjs` (kiraan, migrasi, .ics, gabungan tiga hala).

## Peraturan
- Teks UI dalam Bahasa Melayu, ayat biasa (bukan huruf besar semua).
- Jangan buang data pengguna semasa migrasi skema — naikkan `v` dan tambah migrasi dalam `normalize()`.
