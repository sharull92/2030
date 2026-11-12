# Pelan 2030 — Nota serahan untuk Claude Code

## Tentang projek
App perancangan peribadi hingga 31 Dis 2030 untuk seorang HR bahagian Pengurusan Pekerja Asing (kepakaran: passport, permit PLKS, CIDB). Matlamat pengguna: ambil TTT, daftar jurulatih HRD Corp, bina app/produk AI, dan bina pendapatan pasif di samping gaji.

Bahasa antara muka: **Bahasa Melayu**. Mata wang: **RM** (`ms-MY`).

## Fail
- `pelan-2030.html` — app lengkap dalam satu fail (HTML + CSS + JS vanila, tiada build step). Buka terus dalam pelayar.

## Ciri sedia ada (nav bawah: Ringkasan, Kewangan, Hutang/Kad, Pelan 2030, Lagi → Niaga & Tetapan; reka bentuk baru pengguna 5 Nov 2026 — guna token `--bg/--surface/--pos/--neg/--accent`)
1. **Ringkasan** — hero "cop passport" 2026–2030 + kiraan hari; **Ringkasan ikut tahun** (pilih tahun atau "Semua tahun" = `yearSummary(S, 0, …)`; `yearSummary`: pendapatan = transaksi "Masuk" sebenar SAHAJA (jangan campur pendapatan dirancang — pengguna nampak berganda); jika bulan semasa belum ada Masuk, pendapatan dirancang ditunjuk sebagai "dijangka" + "Dijangka hujung bulan"; duit keluar = tx keluar kecuali "Kad kredit" + belanja kad; komitmen bulan semasa belum "Dah bayar" → baki dijangka; pecahan ikut kategori; kotak **Baki tunai** = Masuk − tx Keluar yang bukan belian kad (termasuk bayaran bil kad "Kad kredit"), belanja kad belum bayar TIDAK ditolak; kotak **Guna kad kredit** = belanja `cardTx` + tx `isCardTx` (cth. baris akaun "Kad Kredit" dari import audit, ditanda `card: true`) dengan "Belum bayar sekarang" = jumlah baki semua kad), DSR (<40% sihat, 40–60% berhati-hati, >60% tinggi); campuran pendapatan aktif/sampingan/pasif; kemajuan sasaran pasif; peringatan tarikh bayar 14 hari (butang "Dah bayar" auto-rekod transaksi); graf trend: 6 atau 12 bulan terakhir atau Jan–Dis tahun dipilih (`trendMonths` + `monthFlow`: keluar termasuk belanja kad, kecuali bayaran bil kad), dengan jumlah tempoh (SVG inline); ringkasan emas & dana kecemasan; langkah seterusnya.
2. **Kewangan** — **Bajet bulanan** (`budgetStatus`/`spendByCat`: kategori dipadan `catKey` tanpa kira huruf besar; belanja = tx Keluar kecuali "Kad kredit" + belanja kad; ≥80% hampir, >100% lebih; belanja tanpa bajet + butang tambah cepat; `budgetWarn` toast selepas rekod; kad ringkas di Ringkasan; bahagian dalam PDF & helaian Excel "Bajet"); **Laporan & eksport**: **Excel** (`excelSheets` data tulen → 5 helaian Ringkasan/Transaksi/Kad kredit/Simpanan/Komitmen & hutang; SheetJS `xlsx@0.18.5` dimuat dari jsDelivr hanya bila diklik; tarikh = tarikh Excel, RM `#,##0.00`, gram `0.000`; bulan dipilih atau semua data; luar talian → CSV transaksi dengan BOM); **PDF** (`monthReport` data tulen + `reportHTML` ke `#printArea`, `@media print` A4, `window.print()` → "Simpan sebagai PDF"; `document.title` = nama fail); sumber pendapatan; rekod transaksi ikut bulan atau "Semua bulan" (`monthSelect` + tajuk bulan `withMonthHeads`; sama untuk rekod kad); penapis cara bayar `txPay` Semua/Tunai/Kad kredit (kad = belanja `cardTx` + tx `isCardTx`; Tunai tolak bayaran bil kad → "Baki tunai" sama logik Ringkasan; Kad tunjuk "Belanja kad" + "Belum bayar" ikut `cardAlloc().owed`); **rekod simpanan sikit-sikit** untuk emas (beli/jual, gram 3 perpuluhan, harga dibayar) dan ASB/Tabung Haji (simpan/keluarkan) — jumlah = baki awal + rekod (`depTotal`, `goldHave`, `asbHave`, `thHave`; JANGAN baca `.have` terus); pilihan "Tolak dari baki duit" cipta tx Keluar berpaut `link: "dep:<id>"` (padam rekod → tx ikut ke tong sampah, Undo pulih kedua-dua); sasaran emas (gram); dana kecemasan berperingkat: Stage 1 ASB RM15,000 → Stage 2 Tabung Haji RM15,000 (`emergencyCalc`), % dihadkan per stage, tunjuk berapa bulan komitmen+hutang boleh ditampung (termasuk `savings` = simpanan tunai lain).
3. **Hutang/Kad** — kad kredit (borang Transaksi ada "Bayar guna" Tunai/debit atau kad → belanja kad masuk `cardTx` dan dipapar dalam senarai Transaksi dengan 💳; status setiap belanja kad "Sudah bayar / Separa / Belum bayar" ikut `cardAlloc` (bayaran tutup belanja paling lama dahulu); `cardDueLine` + `nextDue` tunjuk baki belum bayar & tarikh akhir di Hutang/Kad dan kad "Kad kredit" di Ringkasan; bayaran bil kad (tx kategori "Kad kredit") dipapar tetapi tidak dikira dalam Keluar; had, baki, % penggunaan <30% sihat, belanja bulan ikut kategori, bayaran minimum ≈5%/RM50, rekod belanja & bayaran; bayaran kad juga direkod dalam `tx`); komitmen bulanan (tarikh bayar); hutang disusun ikut faedah tertinggi (avalanche) dengan anggaran tarikh selesai.
4. **Pelan 2030** — disusun ikut PDF pengguna "Pelan Tindakan 2026–2030": `PLAN_YEARS` (tema setiap tahun: Asas Kemahiran & Kelulusan → Pelaksanaan & Kelayakan Trainer → Mula Menjadi Trainer → Rangkaian & Pendapatan Pasif → Kestabilan Kewangan), `PLAN_TPL` (21 tindakan ikut suku tahun, `tpl` pt01–pt21; 2030 ada `metric` pasif/gaji/simpanan/emas dengan kemajuan automatik `planMetrics`). Butang "Susun ikut Pelan Tindakan" → `applyPlan()` (ganti templat lama belum selesai `OLD_TPL_TITLES`, kekal matlamat sendiri, tetapkan pasif 5,000, gaji 6,000, ASB 15k menjelang 2028-11, TH 15k menjelang 2030-12, emas 30 g menjelang 2030-12; Undo salinan penuh). Peta perjalanan 5 tahun; Sasaran 2030 dengan "minimum sebulan" (`planMinimum`: baki ÷ bulan hingga Dis 2030 untuk simpanan & emas (+RM ikut harga emas), % kenaikan gaji setahun, tambahan pasif sebulan; dikira dari baki AWAL bulan supaya tetap sepanjang bulan; juga kad "Minimum sebulan" di Ringkasan dengan simpanan bulan ini vs minimum); simpanan bulanan RM625 + 0.6–0.7 g mulai Dis 2026 (`monthlySaving`); semakan setiap Jun & Disember (`nextReview`, `S.reviews`); 4 pelarasan dicadangkan. Tema tahun semasa di hero Ringkasan.
5. **Niaga** — projek dengan peringkat Idea → Validasi → Bina → Lancar → Skala + senarai langkah proses; templat idea.
6. **Tetapan** — penyegerakan awan (atas); nama, sasaran pasif; **Item terpadam** (tong sampah 30 hari + "Cari item terpadam" dalam salinan lama: sandaran-sebelum-kongsi, jadual `plans` lama, `plan_history`); notifikasi tarikh bayar (N hari sebelum); eksport kalendar .ics; pasang app; penyegerakan awan; sandaran/pulih JSON, padam semua.

## Bulan kewangan (26hb–25hb)
- `settings.monthStart` (1–28, lalai 26 dipasang sekali semasa mula jika tiada). 26 → "Jan 2026" = 26 Dis 2025 – 25 Jan 2026; "Tahun 2026" = 26 Dis 2025 – 25 Dis 2026. Ubah di Tetapan → Profil → "Bulan kewangan bermula hari" (1 = bulan kalendar).
- Logik: `mStart(S)`, `periodOf(date, start)`, `pk(S, date)` (kunci "YYYY-MM" tempoh), `pkNow(S, today)`, `periodRange(S, key)` → `{from, to}`. SEMUA pengumpulan ikut bulan (Ringkasan, `yearSummary`, `monthFlow`/trend, `cardCalc`, `spendByCat`/bajet, `monthReport`/PDF, `excelSheets`, `monthlySaving`, `planMinimum`, pratonton import audit, senarai transaksi/kad) guna `pk()` — bukan `date.slice(0,7)`.
- Kekal ikut kalendar: tarikh bayar komitmen/hutang/kad, kunci `paid` (`monthOut`), notifikasi, .ics, `nextReview`, gabungan hibah audit.
- Ringkasan: pilih tahun + pilih bulan (`sumMonth`, "Sepanjang tahun" atau 12 bulan; hanya bila tahun dipilih) → `yearSummary(S, year, today, month)`; julat tarikh dipapar di bawah tajuk.

## Model data (satu objek `S`)
```js
{
  v: 8,
  updatedAt: Number,   // ms, untuk penyegerakan awan (v2)
  settings: { name, targetPassive, emergencyMonths, notify, notifyDays, monthStart },
  savings: Number,
  incomes:     [{ id, name, type: "aktif"|"sampingan"|"pasif", amount }],
  commitments: [{ id, name, amount, day }],
  debts:       [{ id, name, balance, rate, payment, day }],
  tx:          [{ id, date: "YYYY-MM-DD", type: "in"|"out", cat, amount, note, link? }],
  goals:       [{ id, year, area, title, done, when?, tpl?, metric?, ord? }],
  reviews:     [{ id, ym, notes, at }],   // v8: semakan 6 bulan
  settings.targetSalary                   // v8: sasaran gaji (6000)
  ventures:    [{ id, name, kind, target, stage: 0-4, steps: [{ t, done }] }],
  cards:       [{ id, name, limit, dueDay, rate }],                       // v3
  cardTx:      [{ id, cardId, date, type: "belanja"|"bayar"|"awal", amount, cat, note }],  // v3
  budgets:     [{ id, cat, amount }],   // v7: bajet bulanan berulang ikut kategori
  deposits:    [{ id, kind: "emas"|"asb"|"th", dir: "in"|"out", date, amount, grams?, note }],  // v6: rekod simpanan
  trash:       { "<id>": { list, item, at, cardTx?, ventureId?, index? } },  // v5: tong sampah 30 hari
  paid:        { "<itemId>:<YYYY-MM>": true },   // peringatan yang sudah dibayar
  gold: { have, target: 30, price, by: "YYYY-MM" },   // have/asb.have/th.have = BAKI AWAL sebelum rekod; jumlah sebenar = goldHave(S)/asbHave(S)/thHave(S)
  asb:  { have, s1: 15000, s1by },            // dana kecemasan stage 1 (ASB); asb.s2/s2by lama dikekalkan tetapi tidak digunakan
  th:   { have, target: 15000, by }           // v4: dana kecemasan stage 2 (Tabung Haji)
}
```
`normalize()` menggabungkan data lama dengan nilai lalai — kekalkan apabila menambah medan baru.

## Padam & pulih
- Semua padam (`del`, `delstep`) melalui `trashItem` / `trashStep` → `S.trash` (kad bawa rekod `cardTx`nya). `toastUndo()` 8 s; `restoreItem()`. "Padam semua" ada Undo (salinan penuh). Tong sampah disegerak antara telefon (objek ber-id → `merge3`).
- Supabase `plan_history`: trigger `save_plan_history` simpan salinan lama bila item berkurang (padam) atau salinan terakhir > 5 minit; 300 terbaru/pelan; hanya boleh dibaca (RLS `can_access_plan`).

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

## Guna di telefon
- Butang terapung ＋ (`#fab`) di semua tab → panel SKRIN PENUH `#sheet` (tajuk + ✕, `.qbody` boleh skrol jika skrin kecil, `.qfoot` Batal/Simpan sentiasa di bawah, cip kategori berbilang baris) (`openQuick`/`renderQuick`, keadaan `Q`): Keluar/Masuk, jumlah (papan kekunci nombor, fokus automatik), cip kategori (`quickCats`: bajet + paling kerap 90 hari + lalai), cara bayar (Tunai/kad), nota, tarikh. Simpan guna `recordTx()` — fungsi yang sama dengan borang Kewangan.
- Pintasan manifest (tekan lama ikon app): `?tambah=keluar` / `?tambah=masuk` buka sheet terus.

## Auto catat duit masuk dari e-mel
- `google-apps-script/duit-masuk.gs`: skrip Google Apps Script dalam akaun Gmail pengguna; semak e-mel bank setiap 5 minit (`pasang()` cipta trigger), `kesanDuitMasuk()` kesan notifikasi masuk & jumlah (abaikan baki, bayaran keluar, TAC, belian kad, penyata). Panggil RPC `add_incoming(token, …)` (anon + kunci awam). Ujian: `tests/emel.test.mjs`.
- App (Tetapan → "Auto catat duit masuk"): `makeEmailToken` (48 hex, jadual `plan_tokens`), `copyEmailScript` (fetch fail .gs, isi `__URL__`/`__KEY__`/`__TOKEN__`), `revokeEmailToken`. `importIncoming()` selepas segerak & Realtime INSERT `incoming` → tx Masuk id tetap `inc-<id>` (tiada berganda antara telefon), kategori "Gaji" jika nota ada gaji/salary, lain "Duit masuk"; tanda `imported`.
- Supabase: `plan_tokens`, `incoming` (unik `plan_id,msg_id`), fungsi `add_incoming`/`check_token` (security definer). Token hanya boleh menambah, tidak membaca.

## Auto catat dari notifikasi telefon (Android)
- MacroDroid (Notifikasi Diterima → Permintaan HTTP POST text/plain) → `api/notif.js` (fungsi Vercel; hanya terima URL `*.supabase.co`; `?t=token&u=url&k=kunci awam`) → RPC `add_notif(token, text, app)` → jadual `notif_inbox` (teks mentah; pendua dalam minit sama ditolak).
- App: `importNotif()` (selepas segerak & Realtime INSERT) → `kesanTransaksi()` (logik tulen: masuk/keluar, jumlah, kedai, teka kategori `N_KATEGORI`; abaikan OTP/promo/reload/baki/gagal/akaun sendiri) → tx id `ntf-<id>`; `isDupAuto()` elak pendua dengan e-mel (`inc-`) — jenis+jumlah+tarikh sama dari sumber lain. Tanda `processed` + `result` (dicatat/pendua/abaikan); log 8 terkini di Tetapan; "Hantar ujian" hantar teks bukan transaksi.
- Token sama dengan auto e-mel (`plan_tokens`). iPhone tidak benarkan baca notifikasi app lain.
- Ujian: `tests/notif.test.mjs`, `tests/api-notif.test.mjs`.

## Bahasa (BM / English) & tema
- Teks UI ditulis dalam BM. Mod English: `i18n/en.js` (`window.I18N_EN = { exact, phrases }`) + `trS()` dalam pelan-2030.html. MutationObserver menterjemah setiap nod teks & atribut (placeholder/aria-label/title) yang ditambah; `exact` dipadan selepas nombor → `{n}` dan bulan (BM/EN) → `{m}`; `phrases` sandaran (dalam DOM hanya frasa berbilang perkataan / ada tanda baca; toast & confirm guna `trS(msg, true)` = semua frasa). Elemen `[data-noi18n]`, textarea & skrip dilangkau. `BULAN` & `LOC()` ikut bahasa; Excel (sel & nama helaian) dan nama fail PDF turut diterjemah. Kategori/nota pengguna tidak diterjemah (kecuali sama dengan label UI, cth. "Gaji").
- **Bila menambah teks UI baru:** tambah terjemahan dalam `i18n/en.js` (kunci = teks BM dengan nombor → `{n}`, bulan → `{m}`).
- Tema: `document.documentElement.dataset.theme` = light/dark (tiada = ikut sistem), disimpan `localStorage["pelan2030:theme"]`; bahasa `localStorage["pelan2030:lang"]` — kedua-dua ikut peranti, dipasang awal dalam `<head>` (tiada kelipan). Butang BM/EN & ☀️/🌙 di hero Ringkasan (`prefButtons`) + kad "Paparan" di Tetapan. Tukar ke BM = muat semula halaman.

## Import audit Excel (Tetapan → "Import audit (Excel)")
- Format pengguna: helaian "Transaksi" (Tarikh, Bulan Penyata, Akaun, Penerangan, Butiran, Debit, Kredit, Amaun (+/−), Jenis, Kategori, Kumpulan, Dikira Dalam Audit). `parseAudit()` (nombor siri Excel → tarikh, lajur dicari ikut nama) → `planAuditImport()` (langkau "Dikira = Tidak" kecuali dipilih, potong sebelum tarikh rekod manual pertama `manualStart()`, pilihan `excludeThirdParty` (kumpulan "Pihak ketiga …"), hibah digabung sebulan/akaun, id tetap `aud-<fnv>` dengan indeks pendua sah, kategori audit dikekalkan, nota = butiran pendek · akaun). Pratonton ikut bulan; Undo selepas import. SheetJS dimuat dari jsDelivr.
- JANGAN commit fail audit / data kewangan pengguna — repo awam. Ujian guna data rekaan sahaja.
- Audit Jan–Okt 2026 pengguna: ±2,400 transaksi ≈ 350 KB; `plan_history` dihadkan 100 salinan.

## Sembunyi / tunjuk bahagian
- `enhanceCollapsibles()` dipanggil dalam `render()` (sebelum terjemahan): setiap `section.card` (kecuali `.hero`) dengan `h2` dapat butang ▾/▸ (`.colbtn`, data-act `collapse`) dalam `.colhead`; setiap `h3` anak langsung kad menjadi sub-bahagian (menyembunyikan adik-beradik hingga sub-tajuk seterusnya). Kunci `colKey()` = tab + tajuk tanpa nombor/bulan (stabil antara tahun/bulan). Disimpan ikut peranti `localStorage["pelan2030:hidden"]`; Tetapan → Paparan → "Tunjuk semua bahagian".
- Elak teks terkeluar (skrin 360px): `html,body{overflow-x:clip}`; anak `.row/.grid2/.grid3/.colhead/.list li` `min-width:0`; `.pill` nowrap + tidak mengecil dalam `.row` (turun baris jika perlu); `escW()` = `esc()` + `<wbr>` selepas "/" untuk nama kategori panjang; peta perjalanan `minmax(0,1fr)`; cip panel Rekod boleh berbilang baris; baris bajet: nama + input + ✕, kemudian jumlah + pil, kemudian bar. Semak dengan skrip pengesan limpahan (Playwright: setiap tab × 360/390/412px × BM/EN, lapor elemen melepasi kad/skrin).
- Nilai `.stat b` guna container query (`11.5cqw`) supaya nombor panjang mengecil, bukan terpotong.

## Format nombor
- Wang: `RM()` sentiasa 2 tempat perpuluhan (RM 4,782.00), dibundar ke sen. Semua input wang `step="0.01" inputmode="decimal"`.
- Emas: `fmtG()` hingga 3 tempat perpuluhan (1.025 g); input gram `step="0.001"`.

## Gaya reka bentuk
- Fon: Bricolage Grotesque (tajuk), IBM Plex Sans (teks).
- Warna (token pada `:root`, ada mod gelap): kertas `#ECF0ED`, dakwat `#17263A`, merah passport `#7A1F2B`, teal `#2C6B66`, amber `#A86A12`, emas `#B8892B`.
- Mobile-first, safe-area insets, fokus papan kekunci jelas, hormati reduced-motion.

## Cadangan kerja seterusnya
- Pecahkan kepada projek (cth. Vite + vanilla/React) atau kekalkan satu fail — tanya pengguna.
- Web Push sebenar (Supabase Edge Function + cron + VAPID) jika notifikasi latar belakang tidak cukup.
- Ujian: `node --test tests/*.test.mjs`.

## Peraturan
- Teks UI dalam Bahasa Melayu, ayat biasa (bukan huruf besar semua).
- Jangan buang data pengguna semasa migrasi skema — naikkan `v` dan tambah migrasi dalam `normalize()`.
