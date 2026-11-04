// Ujian fungsi Vercel api/notif.js (fetch ke Supabase ditiru)
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const handler = require("../api/notif.js");
const TOK = "c".repeat(48), URL = "https://abcd.supabase.co";
function call(method, query, body) {
  return new Promise(resolve => {
    const res = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, send(b) { resolve({ code: this.code, body: b }); } };
    handler({ method, query, body }, res);
  });
}
let sent;
globalThis.fetch = async (u, opt) => { sent = { u, opt, body: JSON.parse(opt.body) }; return { ok: true, text: async () => '"ok"' }; };

test("teks biasa (MacroDroid) dihantar ke add_notif", async () => {
  const r = await call("POST", { t: TOK, u: URL, k: "sb_publishable_X", a: "MAE" }, "You've spent RM12.50 at PETRONAS");
  assert.equal(r.code, 200);
  assert.equal(sent.u, URL + "/rest/v1/rpc/add_notif");
  assert.equal(sent.opt.headers.apikey, "sb_publishable_X");
  assert.equal(sent.opt.headers.Authorization, undefined);
  assert.deepEqual(sent.body, { p_token: TOK, p_text: "You've spent RM12.50 at PETRONAS", p_app: "MAE" });
});
test("JSON / borang dengan medan text & app; kunci JWT dapat Authorization", async () => {
  await call("POST", { t: TOK, u: URL, k: "eyJabc" }, { text: "You've received RM50.00 from ALI", app: "CIMB OCTO" });
  assert.equal(sent.body.p_text, "You've received RM50.00 from ALI");
  assert.equal(sent.body.p_app, "CIMB OCTO");
  assert.equal(sent.opt.headers.Authorization, "Bearer eyJabc");
});
test("keselamatan & ralat", async () => {
  assert.equal((await call("GET", { t: TOK, u: URL, k: "x" }, "a")).code, 405);
  assert.equal((await call("POST", { t: TOK, u: "https://evil.example.com", k: "x" }, "a")).code, 400);   // bukan supabase.co
  assert.equal((await call("POST", { t: "pendek", u: URL, k: "x" }, "a")).code, 400);
  assert.equal((await call("POST", { t: TOK, u: URL, k: "x" }, "   ")).code, 400);
  globalThis.fetch = async () => ({ ok: false, text: async () => '{"message":"token tidak sah"}' });
  const r = await call("POST", { t: TOK, u: URL, k: "x" }, "teks");
  assert.equal(r.code, 502); assert.match(r.body, /token tidak sah/);
});
