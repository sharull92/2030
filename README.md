# Pelan 2030

App perancangan kewangan dan kerjaya peribadi hingga 31 Disember 2030. Satu fail HTML, tiada build step. Data disimpan dalam pelayar anda (`localStorage`).

## Cara guna
- **Terus:** buka `pelan-2030.html` dalam pelayar.
- **Di telefon (boleh pasang sebagai app):** hidupkan GitHub Pages (Settings → Pages → Deploy from branch → `main` / root), kemudian buka `https://<nama-pengguna>.github.io/2030/` dan pilih "Tambah ke skrin utama".

## Tab
1. **Ringkasan** — kiraan hari, pendapatan, komitmen, baki, DSR, campuran pendapatan, peringatan bayaran 14 hari, trend 6/12 bulan, emas & ASB, langkah seterusnya.
2. **Kewangan** — sumber pendapatan, transaksi ikut bulan, sasaran emas, ASB stage 1/2, dana kecemasan.
3. **Hutang** — komitmen bulanan dan hutang (kaedah avalanche) dengan anggaran tarikh selesai.
4. **Pelan 2030** — matlamat ikut tahun + templat (TTT → HRD Corp → modul pematuhan → app AI → pasif).
5. **Niaga** — projek: Idea → Validasi → Bina → Lancar → Skala.
6. **Tetapan** — profil, sandaran/pulih JSON, padam semua.

## Ujian
```
node --test tests/calc.test.mjs
```

## Sandaran
Data hanya ada dalam pelayar yang anda guna. Tekan **Tetapan → Muat turun sandaran** secara berkala, dan **Pulihkan sandaran** untuk pindah ke peranti lain.
