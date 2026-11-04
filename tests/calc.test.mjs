// Jalankan: node --test tests/calc.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../pelan-2030.html", import.meta.url), "utf8");
const src = html.split("// @logic-start")[1].split("// @logic-end")[0];
const L = new Function(src.replace(/^.*\n/, "") + "\nreturn { normalize, calc, monthsToPay, upcoming, savCalc, trend, cardCalc, buildICS, emergencyCalc, merge3, mergePlan, stable, sameData, monthOut, yearSummary, monthFlow, trendMonths, trashItem, trashStep, restoreItem, findLost, purgeTrash, cardAlloc, nextDue, monthReport, depTotal, goldHave, asbHave, thHave, excelSheets };")();

test("monthsToPay", () => {
  assert.equal(L.monthsToPay(0, 10, 100), 0);
  assert.equal(L.monthsToPay(1200, 0, 100), 12);
  assert.equal(L.monthsToPay(1000, 12, 10), Infinity); // faedah RM10 = bayaran
  assert.equal(L.monthsToPay(1000, 10, 0), Infinity);
  assert.equal(L.monthsToPay(10000, 18, 500), 24);
});

test("calc: DSR dan campuran", () => {
  const S = L.normalize({
    incomes: [{ amount: 4000, type: "aktif" }, { amount: 1000, type: "pasif" }],
    commitments: [{ amount: 1000 }], debts: [{ balance: 5000, payment: 1000 }],
    settings: { targetPassive: 2000 }
  });
  const c = L.calc(S);
  assert.equal(c.income, 5000);
  assert.equal(c.out, 2000);
  assert.equal(c.balance, 3000);
  assert.equal(c.dsr, 40);
  assert.equal(c.dsrLevel, "berhati-hati");
  assert.equal(c.passivePct, 50);
  assert.equal(c.emergencyTarget, 30000);
  assert.equal(c.emergencyMonths, 0);
  assert.equal(L.calc(L.normalize({ incomes: [{ amount: 1000 }], commitments: [{ amount: 300 }] })).dsrLevel, "sihat");
  assert.equal(L.calc(L.normalize({ incomes: [{ amount: 1000 }], commitments: [{ amount: 700 }] })).dsrLevel, "tinggi");
});

test("upcoming: tertunggak, dalam 14 hari, dan sudah bayar", () => {
  const today = new Date(2026, 10, 20); // 20 Nov 2026
  const S = L.normalize({
    commitments: [
      { id: "a", name: "Sewa", amount: 800, day: 25 },
      { id: "b", name: "Telefon", amount: 80, day: 10 },
      { id: "c", name: "Insurans", amount: 200, day: 2 },
      { id: "d", name: "Gym", amount: 100, day: 15 }
    ],
    paid: { "d:2026-11": true }
  });
  const u = L.upcoming(S, today);
  const keys = u.map(x => x.key);
  assert.deepEqual(keys, ["c:2026-11", "b:2026-11", "a:2026-11", "c:2026-12"]);
  assert.equal(u[0].diff, -18);
});

test("upcoming: hari 31 dalam bulan pendek", () => {
  const S = L.normalize({ commitments: [{ id: "x", name: "X", amount: 1, day: 31 }] });
  const u = L.upcoming(S, new Date(2027, 1, 20)); // 20 Feb 2027
  assert.equal(u[0].due, "2027-02-28");
});

test("savCalc", () => {
  const r = L.savCalc(5000, 15000, "2027-10", new Date(2026, 10, 3));
  assert.equal(r.months, 12);
  assert.equal(r.need, 10000);
  assert.ok(Math.abs(r.perMonth - 833.33) < 0.01);
  assert.equal(L.savCalc(20, 10, "2027-01", new Date()).perMonth, 0);
  assert.equal(L.savCalc(0, 10, "2020-01", new Date(2026, 0, 1)).perMonth, Infinity);
});

test("normalize kekalkan data lama dan isi lalai", () => {
  const o = L.normalize({ settings: { name: "Ali" }, gold: { have: 5 }, tx: "rosak" });
  assert.equal(o.settings.name, "Ali");
  assert.equal(o.settings.targetPassive, 3000);
  assert.equal(o.gold.have, 5);
  assert.equal(o.gold.target, 30);
  assert.deepEqual(o.tx, []);
  assert.equal(o.v, 6);
  assert.deepEqual(o.cards, []);
  assert.deepEqual(o.cardTx, []);
  assert.equal(o.updatedAt, 0);
});

test("trend", () => {
  const t = L.trend([{ date: "2026-11-02", type: "in", amount: 100 }, { date: "2026-10-05", type: "out", amount: 40 }], new Date(2026, 10, 3), 2);
  assert.deepEqual(t, [{ m: "2026-10", in: 0, out: 40 }, { m: "2026-11", in: 100, out: 0 }]);
});

test("cardCalc: baki, penggunaan dan kategori bulan ini", () => {
  const S = L.normalize({
    cards: [{ id: "k", name: "Visa", limit: 5000, dueDay: 20 }],
    cardTx: [
      { cardId: "k", date: "2026-10-10", type: "belanja", amount: 1000, cat: "Bil" },
      { cardId: "k", date: "2026-11-01", type: "awal", amount: 100, cat: "Baki awal" },
      { cardId: "k", date: "2026-11-01", type: "belanja", amount: 300, cat: "Minyak" },
      { cardId: "k", date: "2026-11-02", type: "belanja", amount: 200, cat: "Minyak" },
      { cardId: "k", date: "2026-11-03", type: "bayar", amount: 1000 },
      { cardId: "lain", date: "2026-11-03", type: "belanja", amount: 999 }
    ]
  });
  const k = L.cardCalc(S, S.cards[0], new Date(2026, 10, 4));
  assert.equal(k.balance, 600);
  assert.equal(k.util, 12);
  assert.equal(k.level, "sihat");
  assert.equal(k.monthSpend, 500);
  assert.deepEqual(k.byCat, { Minyak: 500 });
  assert.equal(k.minPay, 50);
  assert.equal(k.available, 4400);
});

test("upcoming: kad kredit dengan baki muncul, tanpa baki tidak", () => {
  const S = L.normalize({
    cards: [{ id: "k", name: "Visa", limit: 5000, dueDay: 10 }, { id: "z", name: "Kosong", limit: 1000, dueDay: 10 }],
    cardTx: [{ cardId: "k", date: "2026-11-01", type: "belanja", amount: 250 }]
  });
  const u = L.upcoming(S, new Date(2026, 10, 4));
  assert.equal(u.length, 1);
  assert.equal(u[0].kind, "kad");
  assert.equal(u[0].amount, 250);
});

test("normalize: data v2 dinaik taraf ke v3 tanpa hilang data", () => {
  const o = L.normalize({ v: 2, updatedAt: 5, incomes: [{ id: "a", amount: 1 }] });
  assert.equal(o.v, 6);
  assert.equal(o.updatedAt, 5);
  assert.equal(o.incomes.length, 1);
});

test("buildICS: acara bulanan berulang dengan peringatan", () => {
  const S = L.normalize({
    commitments: [{ id: "a", name: "Sewa, rumah", amount: 900, day: 5 }, { id: "b", name: "Tiada hari", amount: 1 }],
    debts: [{ id: "d", name: "PTPTN", balance: 0, payment: 200, day: 10 }],
    cards: [{ id: "k", name: "Visa", limit: 5000, dueDay: 31 }]
  });
  const ics = L.buildICS(S, new Date(2026, 10, 4), 3);
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n"));
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2); // hutang selesai & tanpa hari diabaikan
  assert.ok(ics.includes("SUMMARY:Bayar Sewa\\, rumah — RM900"));
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20261105"));
  assert.ok(ics.includes("RRULE:FREQ=MONTHLY;BYMONTHDAY=5;UNTIL=20301231"));
  assert.ok(ics.includes("RRULE:FREQ=MONTHLY;BYMONTHDAY=-1;UNTIL=20301231"));
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20261130"));
  assert.ok(ics.includes("TRIGGER:-P2DT15H"));
  assert.equal((ics.match(/BEGIN:VALARM/g) || []).length, 4);
  assert.equal((L.buildICS(S, new Date(2026, 10, 4), 0).match(/BEGIN:VALARM/g) || []).length, 2);
});

test("dana kecemasan: stage 1 ASB → stage 2 Tabung Haji", () => {
  const t = new Date(2026, 10, 4);
  let S = L.normalize({ asb: { have: 6000 }, th: { have: 0 }, commitments: [{ amount: 1500 }] });
  let e = L.emergencyCalc(S, t), c = L.calc(S);
  assert.equal(e.stage, 1);
  assert.equal(e.s1.need, 9000);
  assert.equal(c.emergencyTarget, 30000);
  assert.equal(c.emergencyPct, 20);
  assert.equal(c.emergencyMonths, 4);
  // lebihan ASB tidak menutup Tabung Haji
  S = L.normalize({ asb: { have: 25000 }, th: { have: 3000 } });
  e = L.emergencyCalc(S, t); c = L.calc(S);
  assert.equal(e.stage, 2);
  assert.equal(e.s2.need, 12000);
  assert.equal(c.emergencyPct, 60);
  assert.equal(L.emergencyCalc(L.normalize({ asb: { have: 15000 }, th: { have: 15000 } }), t).stage, 3);
});

test("migrasi v3 → v4: data ASB lama dikekalkan, tarikh stage 2 dibawa ke Tabung Haji", () => {
  const o = L.normalize({ v: 3, asb: { have: 7000, s1: 15000, s2: 30000, s1by: "2027-06", s2by: "2029-12" }, savings: 2000 });
  assert.equal(o.v, 6);
  assert.equal(o.asb.have, 7000);
  assert.equal(o.asb.s1by, "2027-06");
  assert.equal(o.asb.s2, 30000);
  assert.equal(o.th.by, "2029-12");
  assert.equal(o.th.target, 15000);
  assert.equal(o.savings, 2000);
});

test("stable: susunan kunci tidak penting (jsonb)", () => {
  assert.equal(L.stable({ b: 1, a: [{ y: 2, x: 1 }] }), L.stable({ a: [{ x: 1, y: 2 }], b: 1 }));
});

test("merge3: dua telefon tambah item berbeza — kedua-duanya kekal", () => {
  const b = { tx: [{ id: "1", amount: 10 }] };
  const l = { tx: [{ id: "1", amount: 10 }, { id: "A", amount: 5 }] };
  const r = { tx: [{ id: "1", amount: 10 }, { id: "B", amount: 7 }] };
  assert.deepEqual(L.merge3(b, l, r).tx.map(x => x.id), ["1", "A", "B"]);
});

test("merge3: padam di satu telefon, tidak berubah di satu lagi — kekal dipadam", () => {
  const b = { goals: [{ id: "g1", done: false }, { id: "g2", done: false }] };
  const l = { goals: [{ id: "g1", done: false }] };
  assert.deepEqual(L.merge3(b, l, b).goals.map(x => x.id), ["g1"]);
  assert.deepEqual(L.merge3(b, b, l).goals.map(x => x.id), ["g1"]);
});

test("merge3: suntingan menang ke atas pemadaman", () => {
  const b = { debts: [{ id: "d", balance: 100 }] };
  const l = { debts: [] };
  const r = { debts: [{ id: "d", balance: 80 }] };
  assert.deepEqual(L.merge3(b, l, r).debts, [{ id: "d", balance: 80 }]);
});

test("merge3: medan berbeza dalam item sama digabung; konflik medan sama → peranti ini", () => {
  const b = { debts: [{ id: "d", balance: 100, rate: 5, name: "A" }] };
  const l = { debts: [{ id: "d", balance: 90, rate: 5, name: "A" }] };
  const r = { debts: [{ id: "d", balance: 100, rate: 6, name: "B" }] };
  assert.deepEqual(L.merge3(b, l, r).debts[0], { id: "d", balance: 90, rate: 6, name: "B" });
  const r2 = { debts: [{ id: "d", balance: 70, rate: 5, name: "A" }] };
  assert.equal(L.merge3(b, l, r2).debts[0].balance, 90);
});

test("merge3: objek paid & tetapan digabung ikut kunci", () => {
  const b = { paid: {}, asb: { have: 0, s1: 15000 }, th: { have: 0 } };
  const l = { paid: { "a:2026-11": true }, asb: { have: 500, s1: 15000 }, th: { have: 0 } };
  const r = { paid: { "b:2026-11": true }, asb: { have: 0, s1: 15000 }, th: { have: 300 } };
  assert.deepEqual(L.merge3(b, l, r), { paid: { "a:2026-11": true, "b:2026-11": true }, asb: { have: 500, s1: 15000 }, th: { have: 300 } });
});

test("mergePlan: updatedAt ambil yang terbaru; tiada perubahan → sama", () => {
  const S = L.normalize({ updatedAt: 5, incomes: [{ id: "i", amount: 1 }] });
  const R = L.normalize({ updatedAt: 9, incomes: [{ id: "i", amount: 1 }] });
  const m = L.mergePlan(S, S, R);
  assert.equal(m.updatedAt, 9);
  assert.ok(L.sameData(m, S));
});

test("monthOut: semua duit keluar bulan ini tanpa kira dua kali", () => {
  const S = L.normalize({
    commitments: [{ id: "sewa", amount: 900, day: 5 }, { id: "net", amount: 120, day: 20 }],
    debts: [{ id: "kereta", balance: 20000, payment: 800, day: 7 }, { id: "habis", balance: 0, payment: 300, day: 1 }],
    paid: { "sewa:2026-11": true },
    tx: [
      { date: "2026-11-01", type: "out", cat: "U-MOBILE", amount: 72 },
      { date: "2026-11-05", type: "out", cat: "Komitmen", amount: 900 },
      { date: "2026-11-06", type: "out", cat: "Kad kredit", amount: 500 },
      { date: "2026-11-02", type: "in", cat: "Gaji", amount: 4782 },
      { date: "2026-10-30", type: "out", cat: "Makan", amount: 99 }
    ],
    cardTx: [
      { cardId: "k", date: "2026-11-03", type: "belanja", amount: 60, cat: "Minyak" },
      { cardId: "k", date: "2026-11-01", type: "awal", amount: 1000, cat: "Baki awal" },
      { cardId: "k", date: "2026-11-06", type: "bayar", amount: 500 }
    ]
  });
  const m = L.monthOut(S, new Date(2026, 10, 10));
  assert.equal(m.spent, 72 + 900 + 60);       // bayaran bil kad & baki awal tidak dikira
  assert.equal(m.pending, 120 + 800);          // sewa sudah dibayar; hutang selesai diabaikan
  assert.equal(m.total, 1952);
  assert.equal(m.received, 4782);
  assert.deepEqual(m.byCat, { "U-MOBILE": 72, Komitmen: 900, Minyak: 60 });
});

test("yearSummary: pendapatan = Masuk sebenar sahaja; dijangka ditunjuk berasingan", () => {
  // Senario sebenar: gaji Okt direkod sebagai Masuk; Nov belum terima gaji.
  const S = L.normalize({
    incomes: [{ id: "g", amount: 4782 }],
    commitments: [{ id: "c", amount: 900, day: 28 }],
    tx: [
      { date: "2026-10-27", type: "in", cat: "Gaji", amount: 4782 },
      { date: "2026-10-27", type: "out", cat: "RUMAH", amount: 1950 },
      { date: "2026-10-27", type: "out", cat: "WIFE", amount: 850 },
      { date: "2026-11-01", type: "out", cat: "U-MOBILE", amount: 72 },
      { date: "2026-11-06", type: "out", cat: "Kad kredit", amount: 500 },
      { date: "2027-01-05", type: "out", cat: "Makan", amount: 30 }
    ],
    cardTx: [{ cardId: "k", date: "2026-09-10", type: "belanja", amount: 60, cat: "Minyak" }]
  });
  const t = new Date(2026, 10, 10);
  const y = L.yearSummary(S, 2026, t);
  assert.equal(y.income, 4782);                    // TIDAK berganda
  assert.equal(y.expected, 4782);                  // gaji Nov dijangka, belum diterima
  assert.equal(y.spent, 1950 + 850 + 72 + 60);     // bayaran bil kad tidak dikira
  assert.equal(y.balance, 4782 - 2932);
  assert.equal(y.pending, 900);
  assert.equal(y.projected, 4782 - 2932 + 4782 - 900);
  assert.equal(y.months, 3);
  // selepas gaji Nov direkod → tiada lagi "dijangka"
  S.tx.push({ date: "2026-11-25", type: "in", cat: "Gaji", amount: 4782 });
  const y2 = L.yearSummary(S, 2026, t);
  assert.equal(y2.income, 9564); assert.equal(y2.expected, 0);
  const y27 = L.yearSummary(S, 2027, t);
  assert.equal(y27.income, 0); assert.equal(y27.expected, 0); assert.equal(y27.spent, 30); assert.equal(y27.pending, 0);
  const sem = L.yearSummary(S, 0, t);
  assert.equal(sem.spent, 2932 + 30); assert.equal(sem.income, 9564);
});

test("trend: tapis tahun dan bulan terakhir; keluar termasuk belanja kad", () => {
  const t = new Date(2026, 10, 10);
  assert.deepEqual(L.trendMonths("6", t), ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"]);
  assert.equal(L.trendMonths("12", t)[0], "2025-12");
  const y = L.trendMonths("2027", t);
  assert.equal(y.length, 12); assert.equal(y[0], "2027-01"); assert.equal(y[11], "2027-12");
  const S = L.normalize({
    tx: [{ date: "2026-11-01", type: "out", cat: "U-MOBILE", amount: 72 }, { date: "2026-11-06", type: "out", cat: "Kad kredit", amount: 500 }, { date: "2026-11-25", type: "in", cat: "Gaji", amount: 4782 }],
    cardTx: [{ cardId: "k", date: "2026-11-03", type: "belanja", amount: 60 }, { cardId: "k", date: "2026-11-01", type: "awal", amount: 999 }]
  });
  assert.deepEqual(L.monthFlow(S, "2026-11"), { m: "2026-11", in: 4782, out: 132 });
});

test("tong sampah: padam → pulih (kad bersama rekodnya, langkah projek)", () => {
  const S = L.normalize({
    tx: [{ id: "t1", cat: "Makan", amount: 10 }, { id: "t2", cat: "Minyak", amount: 50 }],
    cards: [{ id: "k", name: "Visa" }], cardTx: [{ id: "c1", cardId: "k", amount: 5 }, { id: "c2", cardId: "x", amount: 7 }],
    ventures: [{ id: "v", name: "Projek", steps: [{ t: "A" }, { t: "B" }, { t: "C" }] }]
  });
  L.trashItem(S, "tx", "t2", 1000);
  assert.deepEqual(S.tx.map(x => x.id), ["t1"]);
  assert.ok(S.trash.t2);
  assert.ok(L.restoreItem(S, "t2"));
  assert.deepEqual(S.tx.map(x => x.id).sort(), ["t1", "t2"]);
  assert.equal(S.trash.t2, undefined);
  L.trashItem(S, "cards", "k", 1000);
  assert.deepEqual(S.cardTx.map(x => x.id), ["c2"]);
  L.restoreItem(S, "k");
  assert.deepEqual(S.cards.map(x => x.id), ["k"]); assert.deepEqual(S.cardTx.map(x => x.id).sort(), ["c1", "c2"]);
  L.trashStep(S, "v", 1, "s1", 1000);
  assert.deepEqual(S.ventures[0].steps.map(x => x.t), ["A", "C"]);
  L.restoreItem(S, "s1");
  assert.deepEqual(S.ventures[0].steps.map(x => x.t), ["A", "B", "C"]);
  assert.equal(L.restoreItem(S, "tiada"), false);
});

test("tong sampah: dibuang selepas 30 hari; data v4 dapat trash kosong", () => {
  const S = L.normalize({ v: 4, tx: [{ id: "a" }, { id: "b" }] });
  assert.equal(S.v, 6); assert.deepEqual(S.trash, {});
  L.trashItem(S, "tx", "a", 0);
  L.trashItem(S, "tx", "b", 31 * 864e5);   // purge berlaku semasa padam kedua
  assert.deepEqual(Object.keys(S.trash), ["b"]);
});

test("findLost: cari item yang hilang dalam salinan lama", () => {
  const S = L.normalize({ tx: [{ id: "ada" }], goals: [{ id: "g1" }], trash: { dlmTong: { list: "tx", item: { id: "dlmTong" }, at: 1 } } });
  const lost = L.findLost(S, [
    { label: "lama", data: { tx: [{ id: "ada" }, { id: "hilang1" }, { id: "dlmTong" }], debts: [{ id: "hilang2", name: "PTPTN" }] } },
    { label: "lebih lama", data: { tx: [{ id: "hilang1" }, { id: "hilang3" }] } }
  ]);
  assert.deepEqual(lost.map(x => x.item.id).sort(), ["hilang1", "hilang2", "hilang3"]);
  const by = Object.fromEntries(lost.map(x => [x.item.id, x]));
  assert.equal(by.hilang1.source, "lama");          // salinan pertama diutamakan
  assert.equal(by.hilang2.list, "debts");
});

test("cardAlloc: bayaran kad tutup belanja paling lama dahulu", () => {
  const S = L.normalize({ cardTx: [
    { id: "b2", cardId: "k", date: "2026-11-03", type: "belanja", amount: 100 },
    { id: "b1", cardId: "k", date: "2026-11-01", type: "belanja", amount: 60 },
    { id: "b3", cardId: "k", date: "2026-11-05", type: "belanja", amount: 40 },
    { id: "p1", cardId: "k", date: "2026-11-10", type: "bayar", amount: 120 },
    { id: "z", cardId: "lain", date: "2026-11-01", type: "belanja", amount: 999 }
  ] });
  const a = L.cardAlloc(S, "k");
  assert.equal(a.b1.status, "dibayar");
  assert.equal(a.b2.status, "separa"); assert.equal(a.b2.owed, 40);
  assert.equal(a.b3.status, "belum");
  assert.equal(a.z, undefined);
  S.cardTx.push({ id: "p2", cardId: "k", date: "2026-11-12", type: "bayar", amount: 80 });
  assert.ok(Object.values(L.cardAlloc(S, "k")).every(x => x.status === "dibayar"));
});

test("nextDue: tarikh akhir seterusnya", () => {
  assert.deepEqual(L.nextDue(15, new Date(2026, 10, 4)), { date: "2026-11-15", diff: 11 });
  assert.deepEqual(L.nextDue(4, new Date(2026, 10, 4)), { date: "2026-11-04", diff: 0 });
  assert.deepEqual(L.nextDue(3, new Date(2026, 10, 4)), { date: "2026-12-03", diff: 29 });
  assert.equal(L.nextDue(31, new Date(2027, 1, 10)).date, "2027-02-28");
  assert.equal(L.nextDue(null, new Date()), null);
});

test("monthReport: data laporan bulanan", () => {
  const S = L.normalize({
    incomes: [{ id: "g", amount: 4782 }],
    commitments: [{ id: "c1", name: "Sewa", amount: 900, day: 5 }, { id: "c2", name: "Internet", amount: 120, day: 20 }],
    paid: { "c1:2026-11": true },
    cards: [{ id: "k", name: "Visa", limit: 5000, dueDay: 15 }],
    tx: [
      { date: "2026-11-27", type: "in", cat: "Gaji", amount: 4782 },
      { date: "2026-11-02", type: "out", cat: "DOBI", amount: 63 },
      { date: "2026-11-10", type: "out", cat: "Kad kredit", amount: 100 },
      { date: "2026-10-31", type: "out", cat: "Makan", amount: 6 }
    ],
    cardTx: [{ cardId: "k", date: "2026-11-05", type: "belanja", amount: 150, cat: "Minyak" }, { cardId: "k", date: "2026-11-10", type: "bayar", amount: 100 }]
  });
  const r = L.monthReport(S, "2026-11", new Date(2026, 10, 30));
  assert.equal(r.in, 4782); assert.equal(r.out, 213); assert.equal(r.net, 4569);
  assert.deepEqual(r.byCat.map(c => c.cat), ["Minyak", "DOBI"]);
  assert.deepEqual(r.rows.map(x => x.cat), ["DOBI", "Minyak", "Kad kredit", "Gaji"]);   // ikut tarikh
  assert.equal(r.rows.find(x => x.cat === "Minyak").via, "Kad Visa");
  assert.equal(r.rows.find(x => x.cat === "Kad kredit").bill, true);
  assert.deepEqual(r.commitments.map(c => c.paid), [true, false]);
  assert.deepEqual(r.cards[0], { name: "Visa", spend: 150, paid: 100, balance: 50, limit: 5000, util: 1 });
});

test("rekod simpanan: jumlah = baki awal + rekod (emas gram 3 perpuluhan)", () => {
  const S = L.normalize({ v: 5, gold: { have: 2 }, asb: { have: 8500, s1: 15000 }, th: { have: 1000, target: 15000 },
    deposits: [
      { id: "e1", kind: "emas", dir: "in", date: "2026-11-01", grams: 1.025, amount: 405.39 },
      { id: "e2", kind: "emas", dir: "in", date: "2026-11-15", grams: 0.5, amount: 200 },
      { id: "e3", kind: "emas", dir: "out", date: "2026-11-20", grams: 0.25 },
      { id: "a1", kind: "asb", dir: "in", date: "2026-11-02", amount: 100 },
      { id: "a2", kind: "asb", dir: "in", date: "2026-11-25", amount: 150.5 },
      { id: "t1", kind: "th", dir: "in", date: "2026-11-03", amount: 50 },
      { id: "t2", kind: "th", dir: "out", date: "2026-11-04", amount: 20 }
    ] });
  assert.equal(S.v, 6);
  assert.equal(L.goldHave(S), 3.275);            // 2 + 1.025 + 0.5 − 0.25
  assert.equal(L.asbHave(S), 8750.5);
  assert.equal(L.thHave(S), 1030);
  const e = L.emergencyCalc(S, new Date(2026, 10, 30));
  assert.equal(e.s1.need, 15000 - 8750.5);
  assert.equal(L.calc(S).emergencyHave, 9780.5);
  const r = L.monthReport(S, "2026-11", new Date(2026, 10, 30));
  assert.equal(r.gold.have, 3.275);
  assert.equal(r.deposits.length, 7);
  assert.equal(r.deposits[0].id, "e1");          // ikut tarikh
});

test("rekod simpanan: data v5 lama dapat deposits kosong, baki lama kekal", () => {
  const o = L.normalize({ v: 5, gold: { have: 3.5 }, asb: { have: 8500 } });
  assert.deepEqual(o.deposits, []);
  assert.equal(L.goldHave(o), 3.5);
  assert.equal(L.asbHave(o), 8500);
});

test("excelSheets: helaian Excel bulan dipilih & semua data", () => {
  const S = L.normalize({ settings: { name: "Sahrul" },
    cards: [{ id: "k", name: "Visa", limit: 5000, dueDay: 15 }],
    commitments: [{ id: "c", name: "Sewa", amount: 900.5, day: 5 }], paid: { "c:2026-11": true },
    tx: [{ date: "2026-11-01", type: "in", cat: "Gaji", amount: 4782 }, { date: "2026-11-02", type: "out", cat: "DOBI", amount: 63.2 },
         { date: "2026-11-10", type: "out", cat: "Kad kredit", amount: 100 }, { date: "2026-10-05", type: "out", cat: "Makan", amount: 6 }],
    cardTx: [{ id: "k1", cardId: "k", date: "2026-11-03", type: "belanja", amount: 150, cat: "Minyak" }, { id: "k2", cardId: "k", date: "2026-11-10", type: "bayar", amount: 100 }],
    deposits: [{ id: "e", kind: "emas", dir: "in", date: "2026-11-04", grams: 1.025, amount: 405.39 }] });
  const t = new Date(2026, 10, 30);
  const sh = Object.fromEntries(L.excelSheets(S, "2026-11", t).map(x => [x.name, x.rows]));
  assert.deepEqual(Object.keys(sh), ["Ringkasan", "Transaksi", "Kad kredit", "Simpanan", "Komitmen & hutang"]);
  assert.deepEqual(sh.Ringkasan[0], ["Laporan kewangan", "Nov 2026"]);
  assert.deepEqual(sh.Ringkasan[4], ["Keluar (RM)", 213.2]);           // 63.20 + 150 (bil kad tidak dikira)
  assert.equal(sh.Transaksi.length, 1 + 4);                            // Okt dikecualikan
  assert.deepEqual(sh.Transaksi[3], ["2026-11-03", "Keluar", "Minyak", "", "Kad Visa", 150, "Ya"]);
  assert.equal(sh.Transaksi.find(r => r[2] === "Kad kredit")[6], "Tidak");
  assert.deepEqual(sh["Kad kredit"][1].slice(6), ["Separa", 50]);
  assert.deepEqual(sh.Simpanan[1], ["2026-11-04", "Emas", "Beli", 1.025, 405.39, ""]);
  assert.equal(sh["Komitmen & hutang"][1][6], "Sudah bayar");
  const all = Object.fromEntries(L.excelSheets(S, "", t).map(x => [x.name, x.rows]));
  assert.equal(all.Ringkasan[0][1], "Semua data");
  assert.equal(all.Transaksi.length, 1 + 5);
});
