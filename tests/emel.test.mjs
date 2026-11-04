// Ujian pengesan e-mel duit masuk (fungsi dalam google-apps-script/duit-masuk.gs)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src = readFileSync(new URL("../google-apps-script/duit-masuk.gs", import.meta.url), "utf8");
const kesan = new Function(src.slice(src.indexOf("const MASUK"), src.indexOf("function semakDuitMasuk")) + "\nreturn kesanDuitMasuk;")();

test("notifikasi duit masuk dikesan dengan jumlah betul", () => {
  const kes = [
    ["You've received money", "Dear Customer, you have received RM1,250.50 via DuitNow Transfer from AHMAD BIN ALI. Ref: Gaji Nov.", 1250.5],
    ["DuitNow Transfer Received", "You have received a DuitNow transfer of RM 4,782.00 to your account ending 1234. Available balance: RM 9,876.54", 4782],
    ["Fund Transfer", "Your account xxxx5678 has been credited with MYR 300.00 on 04/11/2026. Available Balance MYR 1,000.00", 300],
    ["Pemberitahuan Wang Masuk", "Akaun anda telah dikreditkan sebanyak RM 75.20 daripada SITI.", 75.2],
    ["Pindahan Masuk", "Baki terkini RM 5,000.00. Anda telah menerima pindahan masuk RM 150.00", 150],
    ["Incoming fund transfer", "Amount: RM12,345.67 From: SYARIKAT ABC SDN BHD", 12345.67]
  ];
  for (const [s, b, j] of kes) assert.equal(kesan(s, b), j, s);
});

test("bukan duit masuk → diabaikan", () => {
  const kes = [
    ["Payment Successful", "You have paid RM 72.00 to U MOBILE SDN BHD."],
    ["Card Purchase Alert", "A purchase of RM 150.75 was made with your credit card. You received points."],
    ["Your TAC", "Your TAC is 123456 for transfer of RM 500.00"],
    ["DuitNow Transfer", "You have transferred RM 200.00 to SITI. Funds debited from account."],
    ["Monthly statement", "Your statement is ready. Amount due RM 1,000.00. Payment received last month."],
    ["Promosi", "Dapatkan cashback RM10 bila belanja!"]
  ];
  for (const [s, b] of kes) assert.equal(kesan(s, b), null, s);
});
