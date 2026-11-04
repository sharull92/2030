// Ujian pengesan notifikasi telefon (kesanTransaksi dalam pelan-2030.html)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html = readFileSync(new URL("../pelan-2030.html", import.meta.url), "utf8");
const src = html.split("// @logic-start")[1].split("// @logic-end")[0];
const L = new Function(src.replace(/^.*\n/, "") + "\nreturn { kesanTransaksi, isDupAuto, normalize };")();
const k = L.kesanTransaksi;

test("duit KELUAR dikesan: jumlah, kedai & kategori", () => {
  const kes = [
    ["MAE: You've spent RM12.50 at PETRONAS JLN AMPANG.", 12.5, "PETRONAS JLN AMPANG", "Minyak"],
    ["Touch 'n Go eWallet: Payment successful. RM8.90 paid to 7-Eleven Bangsar.", 8.9, "", "Barang dapur"],
    ["CIMB: Your card ending 1234 was charged RM150.75 at LOTUS'S KAJANG on 04/11.", 150.75, "LOTUS'S KAJANG", "Barang dapur"],
    ["Maybank2u: DuitNow Transfer of RM200.00 to SITI AISYAH is successful.", 200, "SITI AISYAH", "Lain-lain"],
    ["Pembayaran berjaya RM72.00 kepada U MOBILE SDN BHD", 72, "U MOBILE SDN BHD", "Bil"],
    ["Boost: You have paid RM15.40 to MARRY BROWN SEREMBAN", 15.4, "MARRY BROWN SEREMBAN", "Makan"],
    ["GrabPay: Payment of RM23.00 to Grab for your ride", 23, "Grab for your ride", "Pengangkutan"]
  ];
  for (const [t, amt, merch, cat] of kes) {
    const r = k(t);
    assert.ok(r, t);
    assert.equal(r.type, "out", t); assert.equal(r.amount, amt, t); assert.equal(r.cat, cat, t);
    if (merch) assert.equal(r.merchant, merch, t);
  }
});

test("duit MASUK dikesan", () => {
  const kes = [
    ["MAE: You've received RM50.00 from AHMAD BIN ALI.", 50, "Duit masuk", "AHMAD BIN ALI"],
    ["DuitNow: Akaun anda telah dikreditkan sebanyak RM 4,782.00 daripada SYARIKAT XYZ - GAJI NOV", 4782, "Gaji", "SYARIKAT XYZ - GAJI NOV"],
    ["TNG eWallet: Siti sent you RM20.00. Balance RM 120.00", 20, "Duit masuk", ""],
    ["Shopee: Refund of RM39.90 has been credited to your ShopeePay", 39.9, "Duit masuk", ""]
  ];
  for (const [t, amt, cat, from] of kes) {
    const r = k(t);
    assert.ok(r, t); assert.equal(r.type, "in", t); assert.equal(r.amount, amt, t); assert.equal(r.cat, cat, t);
    if (from) assert.equal(r.merchant, from, t);
  }
});

test("bukan transaksi / tidak pasti → diabaikan", () => {
  const kes = [
    "Your TAC is 123456 for DuitNow transfer of RM500.00",
    "Jom dapatkan cashback RM10 bila belanja RM50!",
    "Reload successful: RM50.00 added to your eWallet",
    "Your available balance is RM 1,234.56",
    "Transfer of RM300.00 to own account successful",
    "Payment of RM88.00 failed. Please try again.",
    "Reminder: your credit card payment RM1,000.00 is due on 15/11",
    "Your statement is ready",
    "Selamat pagi! Semak tawaran terbaru kami.",
    ""
  ];
  for (const t of kes) assert.equal(k(t), null, t);
});

test("isDupAuto: e-mel & notifikasi transaksi sama → pendua", () => {
  const S = L.normalize({ tx: [{ id: "inc-1", type: "in", amount: 4782, date: "2026-11-25" }, { id: "x", type: "in", amount: 50, date: "2026-11-25" }] });
  assert.equal(L.isDupAuto(S, "in", 4782, "2026-11-25", "ntf-"), true);    // sudah dari e-mel
  assert.equal(L.isDupAuto(S, "in", 4782, "2026-11-25", "inc-"), false);   // sumber sama tidak dikira
  assert.equal(L.isDupAuto(S, "in", 50, "2026-11-25", "ntf-"), false);     // rekod manual tidak dikira
  assert.equal(L.isDupAuto(S, "in", 4782, "2026-11-26", "ntf-"), false);
});
