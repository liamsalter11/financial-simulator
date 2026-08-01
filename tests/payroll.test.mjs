// Unit tests for src/payroll.js — per-paycheck gross/net math, 401k and employer-match
// resolution, promotions, and bonus withholding. Pure JS, no browser, imported directly.
//
// tests/engine.test.mjs already covers the employer-match cap and a plain percentage bonus
// through the engine; this file covers the surrounding paths that the engine tests don't
// reach — annualised salaries, the derived tax rate, multiple promotions, and the rules
// governing which deductions a bonus is subject to.
import { test } from "node:test";
import assert from "node:assert/strict";
import { perCheck, grossPerCheck, salaryAt, payrollOf, effectiveTaxRate, bonusOf, hasPromotions, withoutPromotions } from "../src/payroll.js";

const near = (a, b, tol = 0.01) => Math.abs(a - b) < tol;

/* ---------- perCheck: people know their annual salary, not their paycheck ---------- */

test("perCheck divides an annual salary by that frequency's paychecks per year", () => {
  assert.ok(near(perCheck(52000, "year", "biweekly"), 52000 / 26.0888), "biweekly is 26.0888 paychecks a year, not 26");
  assert.ok(near(perCheck(52000, "year", "monthly"), 52000 / 12));
  assert.ok(near(perCheck(52000, "year", "semimonthly"), 52000 / 24));
  assert.ok(near(perCheck(52000, "year", "weekly"), 52000 / 52.1775));
});

test("perCheck passes a per-paycheck figure through untouched", () => {
  assert.equal(perCheck(2000, "paycheck", "monthly"), 2000);
  assert.equal(perCheck(2000, undefined, "monthly"), 2000, "anything that isn't 'year' is already per-paycheck");
});

test("perCheck leaves an annual figure alone when the frequency has no paychecks per year", () => {
  // "once" has an OPY of 0 — dividing would be a division by zero.
  assert.equal(perCheck(52000, "year", "once"), 52000);
});

test("perCheck treats negative or unparseable pay as zero", () => {
  assert.equal(perCheck(-5000, "year", "monthly"), 0);
  assert.equal(perCheck("abc", "paycheck", "monthly"), 0);
});

test("grossPerCheck reads the mode off the income itself", () => {
  assert.ok(near(grossPerCheck({ gross: 104200, grossMode: "year", recur: "biweekly" }), 104200 / 26.0888));
  assert.equal(grossPerCheck({ gross: 4000, grossMode: "paycheck", recur: "biweekly" }), 4000);
});

/* ---------- payrollOf ---------- */

test("payrollOf reports each deduction's resolved dollar amount alongside the totals", () => {
  const pay = payrollOf({
    gross: 4000, grossMode: "paycheck", recur: "monthly",
    preTax: [{ mode: "pct", value: 6 }, { mode: "amt", value: 150 }],
    match: { rate: 100, limit: 3 },
  });
  assert.equal(pay.rows[0].amount, 240, "6% of $4,000");
  assert.equal(pay.rows[1].amount, 150, "a flat deduction stays flat");
  assert.equal(pay.employee, 390, "the employee's total contribution");
  assert.equal(pay.match, 120, "the match is still capped at 3% of gross");
  assert.equal(pay.total, 510);
});

test("payrollOf excludes a deduction marked as not counting toward the match", () => {
  const pay = payrollOf({
    gross: 4000, grossMode: "paycheck", recur: "monthly",
    preTax: [{ mode: "pct", value: 6, counts: false }],
    match: { rate: 100, limit: 3 },
  });
  assert.equal(pay.employee, 240, "the deduction still comes out of pay");
  assert.equal(pay.matchable, 0, "but nothing about it is matchable");
  assert.equal(pay.match, 0, "so no match is earned — an after-tax or HSA-style contribution");
});

test("payrollOf applies a partial match rate", () => {
  // "50% of the first 6%" — the other common employer formula.
  const pay = payrollOf({
    gross: 4000, grossMode: "paycheck", recur: "monthly",
    preTax: [{ mode: "pct", value: 6 }],
    match: { rate: 50, limit: 6 },
  });
  assert.equal(pay.employee, 240);
  assert.equal(pay.match, 120, "half of the matched 6%");
});

test("payrollOf accepts an explicit gross, so a promoted salary can be costed", () => {
  const inc = { gross: 4000, grossMode: "paycheck", recur: "monthly", preTax: [{ mode: "pct", value: 10 }] };
  assert.equal(payrollOf(inc, 6000).employee, 600, "the override should drive the percentage, not the stored gross");
  assert.equal(payrollOf(inc).employee, 400, "with no override the stored gross applies");
});

test("payrollOf on an income with no deductions reports zeroes rather than undefined", () => {
  const pay = payrollOf({ gross: 4000, grossMode: "paycheck", recur: "monthly" });
  assert.deepEqual(pay.rows, []);
  assert.equal(pay.employee, 0);
  assert.equal(pay.match, 0);
  assert.equal(pay.total, 0);
});

/* ---------- effectiveTaxRate ---------- */

test("effectiveTaxRate backs out the withholding implied by gross, take-home and deductions", () => {
  // $4,000 gross, $240 of 401k, $2,800 landing in the bank => $960 withheld => 24%.
  const rate = effectiveTaxRate({
    gross: 4000, grossMode: "paycheck", recur: "biweekly", amount: 2800,
    preTax: [{ mode: "pct", value: 6, counts: true }],
  });
  assert.ok(near(rate, 24), `expected ~24%, got ${rate}`);
});

test("effectiveTaxRate round-trips: applying the derived rate reproduces the take-home", () => {
  // This is the property the promotion prefill depends on — the rate it suggests must
  // reproduce today's paycheck if the salary doesn't actually change.
  const inc = { gross: 5200, grossMode: "paycheck", recur: "monthly", amount: 3500, preTax: [{ mode: "pct", value: 8 }] };
  const rate = effectiveTaxRate(inc);
  const { employee } = payrollOf(inc);
  assert.ok(near(5200 * (1 - rate / 100) - employee, 3500), "the derived rate should reconstruct the entered take-home");
});

test("effectiveTaxRate returns zero rather than dividing by zero when there's no gross", () => {
  assert.equal(effectiveTaxRate({}), 0);
  assert.equal(effectiveTaxRate({ gross: 0, grossMode: "year", recur: "biweekly" }), 0);
});

/* ---------- salaryAt: promotions ---------- */

test("salaryAt applies promotions in date order however they're stored", () => {
  const inc = {
    amount: 1000, gross: 1000, grossMode: "paycheck", recur: "weekly", date: "2026-01-01", raise: 0,
    changes: [
      { date: "2029-01-01", gross: 3000, grossMode: "paycheck", taxRate: 0 },
      { date: "2027-01-01", gross: 2000, grossMode: "paycheck", taxRate: 0 },
    ],
  };
  assert.equal(salaryAt(inc, new Date(2026, 5, 1)).gross, 1000, "before any promotion");
  assert.equal(salaryAt(inc, new Date(2027, 5, 1)).gross, 2000, "the earlier promotion applies first, despite being listed second");
  assert.equal(salaryAt(inc, new Date(2028, 5, 1)).gross, 2000, "and holds until the next one");
  assert.equal(salaryAt(inc, new Date(2029, 5, 1)).gross, 3000, "then the later promotion takes over");
});

test("a promotion re-anchors the annual raise to its own date", () => {
  // Documented behaviour: the raise compounds from the promotion, not from the original
  // start date, so a promotion doesn't retroactively inflate the years before it.
  const inc = {
    amount: 1000, gross: 1000, grossMode: "paycheck", recur: "weekly", date: "2026-01-01", raise: 10,
    changes: [{ date: "2028-01-01", gross: 2000, grossMode: "paycheck", taxRate: 0 }],
  };
  assert.equal(salaryAt(inc, new Date(2030, 0, 1)).anchor.getFullYear(), 2028, "the raise clock restarts at the promotion");
  assert.equal(salaryAt(inc, new Date(2027, 0, 1)).anchor.getFullYear(), 2026, "before the promotion it's still the original start date");
});

test("salaryAt derives take-home from the promoted gross, its tax rate and its deductions", () => {
  const inc = {
    amount: 1000, gross: 4000, grossMode: "paycheck", recur: "monthly", date: "2026-01-01", raise: 0,
    preTax: [{ mode: "pct", value: 10, counts: true }],
    changes: [{ date: "2027-01-01", gross: 6000, grossMode: "paycheck", taxRate: 25 }],
  };
  const after = salaryAt(inc, new Date(2027, 5, 1));
  assert.equal(after.gross, 6000);
  assert.equal(after.amount, 6000 * 0.75 - 600, "take-home is gross less tax less the 10% deduction on the new salary");
  assert.equal(after.label, "Promotion");
});

test("a promotion can raise a salary quoted annually while the paycheck stays biweekly", () => {
  const inc = {
    amount: 2000, gross: 78000, grossMode: "year", recur: "biweekly", date: "2026-01-01", raise: 0,
    changes: [{ date: "2027-01-01", gross: 104000, taxRate: 0 }],
  };
  const after = salaryAt(inc, new Date(2027, 5, 1));
  assert.ok(near(after.gross, 104000 / 26.0888), "the promoted annual figure should be divided into paychecks too");
});

test("salaryAt ignores a promotion with an unparseable date instead of throwing", () => {
  const inc = {
    amount: 1000, gross: 1000, grossMode: "paycheck", recur: "weekly", date: "2026-01-01", raise: 0,
    changes: [{ date: "", gross: 9999, grossMode: "paycheck", taxRate: 0 }],
  };
  assert.equal(salaryAt(inc, new Date(2030, 0, 1)).gross, 1000);
});

test("hasPromotions and withoutPromotions agree about what counts as a promotion", () => {
  assert.equal(hasPromotions([]), false);
  assert.equal(hasPromotions(null), false, "an absent income list has no promotions");
  assert.equal(hasPromotions([{ changes: [] }]), false, "an empty changes list isn't a promotion");
  assert.equal(hasPromotions([{ changes: [{ date: "2027-01-01" }] }]), true);
  assert.equal(hasPromotions(withoutPromotions([{ changes: [{ date: "2027-01-01" }] }])), false);
});

/* ---------- bonusOf ---------- */

test("a bonus quoted as a percentage tracks the annualised salary and its raises", () => {
  const inc = { gross: 5000, grossMode: "paycheck", recur: "monthly", bonus: { mode: "pct", value: 10, withhold: 0 } };
  assert.equal(bonusOf(inc, 1).gross, 6000, "10% of $60,000");
  assert.equal(bonusOf(inc, 2).gross, 12000, "a doubled salary doubles the bonus it's quoted against");
});

test("a flat-dollar bonus is grown by the raise factor but ignores the salary", () => {
  const inc = { gross: 1000, grossMode: "paycheck", recur: "monthly", bonus: { mode: "amt", value: 1000, withhold: 0 } };
  assert.equal(bonusOf(inc, 1).gross, 1000);
  assert.equal(bonusOf(inc, 2).gross, 2000);
});

test("percentage 401k elections apply to a bonus, and earn a match on it", () => {
  const b = bonusOf({
    gross: 5000, grossMode: "paycheck", recur: "monthly",
    preTax: [{ mode: "pct", value: 10, counts: true }],
    match: { rate: 50, limit: 6 },
    bonus: { mode: "pct", value: 10, withhold: 22, preTaxApplies: true },
  }, 1);
  assert.equal(b.gross, 6000);
  assert.equal(b.deferral, 600, "10% of the bonus is deferred");
  assert.equal(b.match, 180, "50% of the matched 6% of the bonus");
  assert.equal(b.withheld, 1320, "22% withholding");
  assert.equal(b.net, 4080, "what actually reaches the bank is gross less withholding less the deferral");
});

test("flat-dollar deductions do not come out of a bonus", () => {
  // Documented rule: a fixed per-paycheck deduction is tied to the paycheck, so a bonus
  // isn't subject to it — only percentage elections follow the money.
  const b = bonusOf({
    gross: 5000, grossMode: "paycheck", recur: "monthly",
    preTax: [{ mode: "amt", value: 500, counts: true }],
    match: { rate: 100, limit: 3 },
    bonus: { mode: "amt", value: 10000, withhold: 0 },
  }, 1);
  assert.equal(b.deferral, 0, "the $500 flat deduction must not be taken out of the bonus");
  assert.equal(b.match, 0, "and with nothing deferred there's nothing to match");
  assert.equal(b.net, 10000);
});

test("preTaxApplies:false exempts a bonus from deductions entirely", () => {
  const b = bonusOf({
    gross: 5000, grossMode: "paycheck", recur: "monthly",
    preTax: [{ mode: "pct", value: 10, counts: true }],
    match: { rate: 100, limit: 3 },
    bonus: { mode: "pct", value: 10, withhold: 22, preTaxApplies: false },
  }, 1);
  assert.equal(b.deferral, 0, "no 401k comes out of a bonus the election doesn't cover");
  assert.equal(b.match, 0);
  assert.equal(b.net, 4680, "so more of it reaches the bank");
});

test("a bonus never nets below zero, however heavy the withholding and deferral", () => {
  const b = bonusOf({
    gross: 5000, grossMode: "paycheck", recur: "monthly",
    preTax: [{ mode: "pct", value: 60, counts: true }],
    bonus: { mode: "pct", value: 10, withhold: 90, preTaxApplies: true },
  }, 1);
  assert.equal(b.net, 0, "over-withholding should floor at zero rather than hand back a negative paycheck");
});

test("bonusOf returns null when there is no bonus to pay", () => {
  assert.equal(bonusOf({ gross: 1000 }, 1), null, "no bonus configured");
  assert.equal(bonusOf({ bonus: { value: 0 } }, 1), null, "a zero bonus is no bonus");
  assert.equal(bonusOf(null, 1), null);
  assert.equal(bonusOf(undefined, 1), null);
});

test("bonusOf defaults the growth factor to 1 when it isn't supplied", () => {
  const inc = { gross: 5000, grossMode: "paycheck", recur: "monthly", bonus: { mode: "pct", value: 10, withhold: 0 } };
  assert.equal(bonusOf(inc).gross, bonusOf(inc, 1).gross);
});
