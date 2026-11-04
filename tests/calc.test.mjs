// Jalankan: node --test tests/calc.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../pelan-2030.html", import.meta.url), "utf8");
const src = html.split("// @logic-start")[1].split("// @logic-end")[0];
const L = new Function(src.replace(/^.*\n/, "") + "\nreturn { normalize, calc, monthsToPay, upcoming, savCalc, trend, cardCalc, buildICS, emergencyCalc, merge3, mergePlan, stable, sameData, monthOut, yearSummary, monthFlow, trendMonths };")();

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
  assert.equal(o.v, 4);
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
  assert.equal(o.v, 4);
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
  assert.equal(o.v, 4);
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

test("yearSummary: tapis tahun; pendapatan ikut bulan direkod", () => {
  const S = L.normalize({
    incomes: [{ id: "g", amount: 4782 }],
    commitments: [{ id: "c", amount: 900, day: 28 }],
    tx: [
      { date: "2026-10-03", type: "out", cat: "Minyak", amount: 150 },
      { date: "2026-11-01", type: "out", cat: "U-MOBILE", amount: 72 },
      { date: "2026-10-25", type: "in", cat: "Gaji", amount: 5000 },
      { date: "2026-11-06", type: "out", cat: "Kad kredit", amount: 500 },
      { date: "2027-01-05", type: "out", cat: "Makan", amount: 30 }
    ],
    cardTx: [{ cardId: "k", date: "2026-09-10", type: "belanja", amount: 60, cat: "Minyak" }]
  });
  const y = L.yearSummary(S, 2026, new Date(2026, 10, 10));
  assert.equal(y.months, 3);                    // Sep, Okt, Nov
  assert.equal(y.income, 4782 + 5000 + 4782);  // Okt guna jumlah sebenar diterima
  assert.equal(y.spent, 150 + 72 + 60);         // bayaran bil kad tidak dikira
  assert.equal(y.pending, 900);
  assert.deepEqual(y.byCat, { Minyak: 210, "U-MOBILE": 72 });
  const y27 = L.yearSummary(S, 2027, new Date(2026, 10, 10));
  assert.equal(y27.spent, 30);
  assert.equal(y27.income, 4782);
  assert.equal(y27.pending, 0);
  const sem = L.yearSummary(S, 0, new Date(2026, 10, 10));   // semua tahun
  assert.equal(sem.months, 4);
  assert.equal(sem.spent, 150 + 72 + 60 + 30);
  assert.equal(sem.income, 4782 + 5000 + 4782 + 4782);
  assert.equal(sem.pending, 900);
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
