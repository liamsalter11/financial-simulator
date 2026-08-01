// Unit tests for src/loan.js — the amortization math behind describing a loan either by
// its payment or by its term. Pure functions, no browser, no fixtures.
import { test } from "node:test";
import assert from "node:assert/strict";
import { amortPayment, monthsToPayoff, minPaymentOf } from "../src/loan.js";

test("the amortizing payment matches the textbook figure", () => {
  // $200,000 at 6% over 360 months is $1,199.10 — the standard worked example.
  const p = amortPayment(200000, 6, 360);
  assert.ok(Math.abs(p - 1199.10) < 0.01, `expected ~1199.10, got ${p.toFixed(2)}`);
});

test("a 0% loan is just the balance split evenly across the term", () => {
  assert.equal(amortPayment(12000, 0, 60), 200);
  assert.equal(monthsToPayoff(12000, 0, 200), 60);
});

test("payment and term are the same equation from either end", () => {
  for (const [bal, apr, months] of [[18500, 7.75, 120], [4200, 22.99, 24], [95000, 3.25, 300]]) {
    const pay = amortPayment(bal, apr, months);
    const back = monthsToPayoff(bal, apr, pay);
    assert.ok(Math.abs(back - months) <= 1, `${bal} at ${apr}% over ${months}mo round-tripped to ${back}mo`);
  }
});

test("a payment that doesn't cover the interest never clears the balance", () => {
  // $10,000 at 24% accrues $200 a month, so $200 and $150 are both hopeless.
  assert.equal(monthsToPayoff(10000, 24, 200), null);
  assert.equal(monthsToPayoff(10000, 24, 150), null);
  assert.ok(monthsToPayoff(10000, 24, 250) > 0, "a payment above the interest should clear eventually");
});

test("degenerate inputs don't produce nonsense", () => {
  assert.equal(amortPayment(0, 5, 60), 0, "no balance, no payment");
  assert.equal(amortPayment(1000, 5, 0), 0, "no term, no payment");
  assert.equal(monthsToPayoff(0, 5, 100), 0, "a cleared balance takes no months");
  assert.equal(monthsToPayoff(1000, 5, 0), null, "paying nothing never clears anything");
});

test("minPaymentOf derives from the term only when the loan is described that way", () => {
  const byPayment = { balance: 12000, apr: 0, minPayment: 250, termMonths: 60, payMode: "payment" };
  const byTerm = { balance: 12000, apr: 0, minPayment: 250, termMonths: 60, payMode: "term" };
  assert.equal(minPaymentOf(byPayment), 250, "payment mode uses the typed payment");
  assert.equal(minPaymentOf(byTerm), 200, "term mode derives the payment from the term");
  assert.equal(minPaymentOf({ balance: 12000, apr: 0, minPayment: 250 }), 250, "older data with no mode keeps its payment");
  assert.equal(minPaymentOf({ balance: 12000, apr: 0, minPayment: 250, payMode: "term" }), 250, "term mode with no term falls back to the payment");
});
