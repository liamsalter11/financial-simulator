import test from "node:test";
import assert from "node:assert/strict";
import { encodePlan, decodePlan, planOnly, readHash, stripHash, shareUrl, PLAN_KEYS } from "../src/share.js";

const plan = () => ({
  accounts: [{ id: "a", name: "Checking", type: "checking", balance: 6000, rate: 0 }],
  debts: [{ id: "d", name: "Loan", kind: "loan", balance: 18500, apr: 7.75, minPayment: 235 }],
  income: [{ id: "i", name: "Take-home pay", amount: 3000, recur: "biweekly", dist: [{ acctId: "a" }] }],
  expenses: [{ id: "e", label: "Rent", category: "Housing", amount: 1500, recur: "monthly", fromAcct: "a" }],
  transfers: [], debtPayments: [], payments: [],
  settings: { withdrawalRate: 4, inflation: 2.5 },
});

test("a plan survives encode → decode unchanged", async () => {
  const p = plan();
  const back = await decodePlan(await encodePlan(p));
  assert.deepEqual(back, p);
});

test("encoding compresses — a link is far shorter than the JSON", async () => {
  const p = plan();
  /* pad it out so there's something to compress, the way a real plan has repeated keys */
  p.expenses = Array.from({ length: 40 }, (_, i) => ({ id: "e" + i, label: "Groceries", category: "Food", amount: 110, recur: "weekly", fromAcct: "a" }));
  const payload = await encodePlan(p);
  assert.equal(payload[0], "1", "should have taken the deflate path");
  assert.ok(payload.length < JSON.stringify(p).length / 2, `expected real compression, got ${payload.length} vs ${JSON.stringify(p).length}`);
  assert.deepEqual(await decodePlan(payload), p);
});

test("only the plan travels — scenarios and snapshots are local history", async () => {
  const p = { ...plan(), scenarios: [{ id: "s", name: "Aggressive" }], snapshots: [{ at: "2026-01-01" }] };
  const back = await decodePlan(await encodePlan(p));
  assert.equal(back.scenarios, undefined);
  assert.equal(back.snapshots, undefined);
  assert.deepEqual(Object.keys(back).sort(), PLAN_KEYS.slice().sort());
});

test("the uncompressed fallback round-trips too", async () => {
  /* what encodePlan emits where CompressionStream is missing — decode still has to read it */
  const p = plan();
  const plain = Buffer.from(JSON.stringify(planOnly(p)), "utf8").toString("base64url");
  assert.deepEqual(await decodePlan("0" + plain), p);
});

test("a corrupt or foreign fragment decodes to null rather than throwing", async () => {
  for (const bad of ["", "1", "x", "9abc", "1!!!!", "0eyJh", "1" + "AAAA", null, undefined]) {
    assert.equal(await decodePlan(bad), null, `expected null for ${JSON.stringify(bad)}`);
  }
});

test("a payload with no accounts is refused, not offered as an empty plan", async () => {
  const empty = Buffer.from(JSON.stringify({ accounts: [], settings: {} }), "utf8").toString("base64url");
  assert.equal(await decodePlan("0" + empty), null);
  const notAPlan = Buffer.from(JSON.stringify([1, 2, 3]), "utf8").toString("base64url");
  assert.equal(await decodePlan("0" + notAPlan), null);
});

test("readHash finds the plan among other fragment entries", () => {
  assert.equal(readHash("#plan=abc"), "abc");
  assert.equal(readHash("plan=abc"), "abc");
  assert.equal(readHash("#tab=debt&plan=abc"), "abc");
  assert.equal(readHash("#planner=abc"), null);
  assert.equal(readHash("#section"), null);
  assert.equal(readHash(""), null);
});

test("stripHash removes only the plan", () => {
  assert.equal(stripHash("#plan=abc"), "");
  assert.equal(stripHash("#tab=debt&plan=abc"), "#tab=debt");
  assert.equal(stripHash("#tab=debt"), "#tab=debt");
});

test("shareUrl replaces an existing fragment rather than appending to it", () => {
  assert.equal(shareUrl("https://x.test/app/", "AA"), "https://x.test/app/#plan=AA");
  assert.equal(shareUrl("https://x.test/app/#plan=OLD", "AA"), "https://x.test/app/#plan=AA");
});
