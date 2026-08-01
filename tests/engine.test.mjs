// Unit tests for the pure simulation-engine functions in src/engine.js and
// src/payroll.js, run without a browser — these are plain ES modules with no React
// dependency, so they're imported directly. These tests construct small, deterministic
// scenarios rather than reusing the app's seed data, which is intentionally relative
// to today's date and would make assertions drift.
import { test } from "node:test";
import assert from "node:assert/strict";
import { simulateWeekly, projectMinWeekly } from "../src/engine.js";
import { payrollOf, bonusOf, salaryAt, hasPromotions, withoutPromotions } from "../src/payroll.js";
import { normIncome } from "../src/seeds.js";

const START = new Date(2026, 0, 1); // a Thursday; dates below are chosen to land on/after it

/* the settings every scenario needs, and the empty lists simulateWeekly always destructures —
   spread this and override only the part the test is actually about */
const BASE = {
  accounts: [], debts: [], income: [], expenses: [], transfers: [], debtPayments: [],
  settings: { withdrawalRate: 4, redirect: true }, start: START,
};
const sim = (cfg) => simulateWeekly({ ...BASE, ...cfg });

test("cap-sweep overflow respects settings.redirect, matching the scheduled debt-payment overflow", () => {
  // Regression test for the bug where the account-cap sweep always redirected leftover
  // cash into investing once the target debt cleared, ignoring the user's toggle — even
  // though the scheduled debt-payment overflow a few lines above already respected it.
  const scenario = (redirect) => {
    const accounts = [
      { id: "chk", type: "checking", balance: 0, rate: 0, cap: 500, spillTo: "ln", spillEvery: "weekly" },
      { id: "inv", type: "brokerage", balance: 0, rate: 0 },
    ];
    const debts = [{ id: "ln", apr: 5, balance: 200, kind: "loan", interestFrom: "2020-01-01" }];
    const income = [{
      id: "inc", name: "pay", amount: 1000, gross: 1000, grossMode: "paycheck",
      date: "2026-01-02", recur: "weekly", raise: 0, weekdayAdj: false, dist: [{ acctId: "chk" }],
    }];
    const settings = { withdrawalRate: 4, redirect, overflowTo: "inv" };
    return simulateWeekly({ accounts, debts, income, expenses: [], transfers: [], debtPayments: [], settings, start: START, weeks: 40 });
  };

  const withRedirect = scenario(true);
  const withoutRedirect = scenario(false);
  const lastWeek = 40;

  // Both scenarios clear the tiny $200 loan from the very first sweep, so the redirect
  // toggle is the only variable that should affect where the ongoing weekly excess lands.
  assert.equal(withRedirect.debtFree, withoutRedirect.debtFree, "loan payoff timing shouldn't depend on the redirect toggle");

  const withAcct = withRedirect.series[lastWeek].acct;
  const withoutAcct = withoutRedirect.series[lastWeek].acct;

  assert.equal(withAcct.chk, 500, "with redirect on, checking should sit at its cap");
  assert.ok(withAcct.inv > 30000, "with redirect on, the swept excess should have accumulated in investing");

  assert.ok(withoutAcct.chk > 30000, "with redirect off, the excess should stay in checking instead of being swept");
  assert.equal(withoutAcct.inv, 0, "with redirect off, nothing should have been swept into investing");
});

test("employer match applies the matched rate only up to the capped percentage of gross", () => {
  // "100% match up to 3% of gross" on a $4,000 gross paycheck: employee puts in 6% ($240),
  // but only the first 3% ($120) is matchable, so the match should be $120, not $240.
  const inc = {
    gross: 4000, grossMode: "paycheck", recur: "biweekly",
    preTax: [{ mode: "pct", value: 6, toAcct: "ret", counts: true }],
    match: { rate: 100, limit: 3, toAcct: "ret" },
  };
  const result = payrollOf(inc);
  assert.equal(result.employee, 240, "employee 401k contribution should be 6% of gross");
  assert.equal(result.match, 120, "match should cap at 3% of gross, not the full contribution");
  assert.equal(result.total, 360, "total to retirement is the employee contribution plus the capped match");
});

test("employer match does not apply beyond what the employee actually contributes", () => {
  // Employee contributes only 1% while the match covers up to 3% — match should track the
  // employee's smaller contribution, not the full matchable ceiling.
  const inc = {
    gross: 4000, grossMode: "paycheck", recur: "biweekly",
    preTax: [{ mode: "pct", value: 1, toAcct: "ret", counts: true }],
    match: { rate: 100, limit: 3, toAcct: "ret" },
  };
  const result = payrollOf(inc);
  assert.equal(result.employee, 40, "employee contribution should be 1% of gross");
  assert.equal(result.match, 40, "match should mirror the smaller employee contribution, not the 3% ceiling");
});

test("a percentage bonus tracks the salary it's quoted against, net of withholding", () => {
  const inc = {
    gross: 5000, grossMode: "paycheck", recur: "monthly",
    bonus: { mode: "pct", value: 10, withhold: 30, preTaxApplies: true },
  };
  // annual gross = 5000 * 12 = 60000; bonus = 10% of that = 6000; withheld 30% = 1800
  const b = bonusOf(inc, 1);
  assert.equal(b.gross, 6000, "bonus gross should be 10% of annualized salary");
  assert.equal(b.withheld, 1800, "withholding should be 30% of the bonus gross");
  assert.equal(b.net, 4200, "net bonus should be gross minus withholding (no pre-tax deductions configured here)");
});

test("a credit card carrying no balance accrues no interest, even at a high APR", () => {
  const accounts = [{ id: "chk", type: "checking", balance: 5000, rate: 0 }];
  const debts = [{ id: "cc", apr: 24, balance: 0, kind: "card", interestFrom: "2020-01-01" }];
  const settings = { withdrawalRate: 4, redirect: true };
  const result = simulateWeekly({ accounts, debts, income: [], expenses: [], transfers: [], debtPayments: [], settings, start: START, weeks: 12 });
  const finalCardBalance = result.series[12].dbt.cc;
  assert.equal(finalCardBalance, 0, "a card paid to zero should not accrue interest on a balance it isn't carrying");
  assert.equal(result.cardInterest, 0, "no card interest should have been charged across the whole run");
});

test("extra debt payments roll to the highest-APR remaining loan once the named target clears", () => {
  // A $1000 weekly payment targets "low" ($50 balance), which it clears immediately —
  // the $950 leftover should roll onto "high" (the higher-APR loan), not just sit unused.
  const accounts = [{ id: "chk", type: "checking", balance: 0, rate: 0 }];
  const debts = [
    { id: "low", apr: 3, balance: 50, kind: "loan", interestFrom: "2020-01-01" },
    { id: "high", apr: 20, balance: 5000, kind: "loan", interestFrom: "2020-01-01" },
  ];
  const income = [{
    id: "inc", name: "pay", amount: 5000, gross: 5000, grossMode: "paycheck",
    date: "2026-01-02", recur: "weekly", raise: 0, weekdayAdj: false, dist: [{ acctId: "chk" }],
  }];
  const debtPayments = [{ id: "dp", amount: 1000, date: "2026-01-02", recur: "weekly", fromAcct: "chk", toDebt: "low" }];
  const settings = { withdrawalRate: 4, redirect: true };
  const result = simulateWeekly({ accounts, debts, income, expenses: [], transfers: [], debtPayments, settings, start: START, weeks: 1 });

  const afterWeek1 = result.series[1].dbt;
  assert.equal(afterWeek1.low, 0, "the named target should be paid off first");
  assert.equal(afterWeek1.high, 4050, "the $950 leftover after clearing the named target should roll onto the higher-APR loan");
});

test("a promotion derives take-home from the new salary and a tax rate, not a typed net figure", () => {
  const accounts = [
    { id: "chk", type: "checking", balance: 0, rate: 0 },
    { id: "ret", type: "retirement", balance: 0, rate: 0 },
  ];
  const income = [{
    id: "inc", name: "pay", amount: 1000, gross: 4000, grossMode: "paycheck",
    date: "2026-01-01", recur: "weekly", raise: 0, weekdayAdj: false,
    dist: [{ acctId: "chk" }],
    preTax: [{ mode: "pct", value: 6, toAcct: "ret", counts: true }],
    match: { rate: 100, limit: 3, toAcct: "ret" },
    changes: [{ id: "c1", date: "2026-01-08", label: "Promotion", gross: 5000, grossMode: "paycheck", taxRate: 25 }],
  }];
  const settings = { withdrawalRate: 4, redirect: true };
  const result = simulateWeekly({ accounts, debts: [], income, expenses: [], transfers: [], debtPayments: [], settings, start: START, weeks: 2 });

  // week 1's snapshot is taken before that week's paycheck lands, so it still reflects
  // the baseline salary; week 2's snapshot reflects the promoted paycheck from week 1.
  const before = result.series[1].acct, after = result.series[2].acct;
  const employee = 5000 * 0.06; // 300 — 6% of the new gross
  const takeHome = 5000 * (1 - 0.25) - employee; // 3450
  const match = Math.min(employee, 5000 * 0.03); // 150 — 100% match up to 3% of gross

  assert.equal(after.chk - before.chk, takeHome, "take-home should be derived from the new gross and tax rate, matching a manual withholding calc");
  assert.equal(after.ret - before.ret, employee + match, "the 401k contribution and employer match should track the promoted gross");
});

test("normIncome back-derives a tax rate from a legacy take-home figure so old saved data keeps its projection", () => {
  const legacy = {
    gross: 4000, grossMode: "paycheck", recur: "biweekly", amount: 2800,
    preTax: [{ mode: "pct", value: 6, toAcct: "ret", counts: true }],
    changes: [{ id: "c1", date: "2026-06-01", label: "Promotion", gross: 5000, grossMode: "paycheck", amount: 3400 }],
  };
  const [normalized] = normIncome([legacy], "chk", "ret");
  const sal = salaryAt(normalized, new Date(2026, 6, 1));
  assert.ok(Math.abs(sal.amount - 3400) < 0.01, "the migrated promotion's derived take-home should match the legacy typed-in figure");
});

test("a future account as-of date freezes the account until then", () => {
  const accounts = [{ id: "chk", type: "checking", balance: 1000, rate: 0, asOf: "2026-01-22" }];
  const expenses = [{ id: "e1", category: "rent", amount: 100, date: "2026-01-01", recur: "weekly", weekdayAdj: false, fromAcct: "chk" }];
  const settings = { withdrawalRate: 4, redirect: true };
  const result = simulateWeekly({ accounts, debts: [], income: [], expenses, transfers: [], debtPayments: [], settings, start: START, weeks: 5 });

  // 2026-01-22 is exactly 3 weeks after START (2026-01-01), so weeks 0-3 should show the
  // account exactly as entered, untouched by the weekly expense.
  for (let w = 0; w <= 3; w++) {
    assert.equal(result.series[w].acct.chk, 1000, `week ${w} should still show the entered balance, before the as-of date`);
  }
  assert.equal(result.series[4].acct.chk, 900, "the first expense at or after the as-of date should apply");
  assert.equal(result.series[5].acct.chk, 800, "expenses continue applying normally once the account is active");
});

test("a past account as-of date catches the account up to today, without touching debt balances", () => {
  const accounts = [{ id: "chk", type: "checking", balance: 1000, rate: 0, asOf: "2025-12-11" }];
  const debts = [{ id: "ln", apr: 5, balance: 500, kind: "loan", interestFrom: "2020-01-01" }];
  // 2025-12-11 is exactly 3 weeks before START (2026-01-01)
  const expenses = [{ id: "e1", category: "rent", amount: 100, date: "2025-12-11", recur: "weekly", weekdayAdj: false, fromAcct: "chk" }];
  const debtPayments = [{ id: "dp", amount: 50, date: "2025-12-11", recur: "weekly", weekdayAdj: false, fromAcct: "chk", toDebt: "ln" }];
  const settings = { withdrawalRate: 4, redirect: true };
  const result = simulateWeekly({ accounts, debts, income: [], expenses, transfers: [], debtPayments, settings, start: START, weeks: 2 });

  assert.equal(result.series[0].acct.chk, 1000 - 3 * 100 - 3 * 50, "today's checking balance should already reflect the three historical weeks of expenses and payments");
  assert.equal(result.series[0].dbt.ln, 500, "the loan's entered balance is today's truth — historical payments during catch-up shouldn't pay it down");
});

test("a blank account as-of date behaves identically to an account with no as-of field at all", () => {
  const base = () => ({
    debts: [{ id: "ln", apr: 6, balance: 1000, kind: "loan", interestFrom: "2020-01-01" }],
    income: [{ id: "inc", name: "pay", amount: 500, gross: 500, grossMode: "paycheck", date: "2026-01-01", recur: "weekly", raise: 0, weekdayAdj: false, dist: [{ acctId: "chk" }] }],
    expenses: [{ id: "e1", category: "rent", amount: 80, date: "2026-01-01", recur: "weekly", weekdayAdj: false, fromAcct: "chk" }],
    transfers: [],
    debtPayments: [{ id: "dp", amount: 40, date: "2026-01-01", recur: "weekly", weekdayAdj: false, fromAcct: "chk", toDebt: "ln" }],
    settings: { withdrawalRate: 4, redirect: true },
    start: START, weeks: 20,
  });
  const withoutField = simulateWeekly({ ...base(), accounts: [{ id: "chk", type: "checking", balance: 2000, rate: 3 }] });
  const withBlank = simulateWeekly({ ...base(), accounts: [{ id: "chk", type: "checking", balance: 2000, rate: 3, asOf: "" }] });
  assert.deepEqual(withBlank.series, withoutField.series, "a blank as-of string should simulate identically to an account with no as-of field");
});

test("withoutPromotions strips only the promotions, leaving every other income field intact", () => {
  const income = [
    {
      id: "a", name: "pay", amount: 1000, gross: 4000, grossMode: "paycheck", recur: "weekly", raise: 3,
      dist: [{ acctId: "chk" }], preTax: [{ mode: "pct", value: 6, toAcct: "ret", counts: true }],
      match: { rate: 100, limit: 3, toAcct: "ret" }, bonus: { mode: "pct", value: 10, withhold: 30 },
      changes: [{ id: "c1", date: "2027-01-01", gross: 6000, grossMode: "paycheck", taxRate: 25 }],
    },
    { id: "b", name: "side gig", amount: 200, gross: 200, grossMode: "paycheck", recur: "monthly", raise: 0 },
  ];
  assert.equal(hasPromotions(income), true, "an income carrying a change should report as having promotions");

  const stripped = withoutPromotions(income);
  assert.deepEqual(stripped[0].changes, [], "the promotion list should be emptied");
  assert.equal(hasPromotions(stripped), false, "the stripped list should report no promotions");
  assert.equal(stripped[0].raise, 3, "the annual raise should survive — only promotions are hypothetical here");
  assert.deepEqual(stripped[0].bonus, income[0].bonus, "the bonus should survive untouched");
  assert.deepEqual(stripped[0].match, income[0].match, "the employer match should survive untouched");
  assert.deepEqual(stripped[0].preTax, income[0].preTax, "pre-tax deductions should survive untouched");
  assert.equal(stripped[0].amount, 1000, "today's take-home should be unchanged");
  assert.deepEqual(stripped[1], income[1], "an income with no promotions should pass through by reference-equal value");
  assert.deepEqual(income[0].changes.length, 1, "the original income list must not be mutated");
});

test("switching promotions off projects a strictly lower net worth, and the gap is the promotion's worth", () => {
  const accounts = [{ id: "chk", type: "checking", balance: 0, rate: 0 }];
  const income = [{
    id: "inc", name: "pay", amount: 1000, gross: 1000, grossMode: "paycheck",
    date: "2026-01-01", recur: "weekly", raise: 0, weekdayAdj: false, dist: [{ acctId: "chk" }],
    changes: [{ id: "c1", date: "2026-01-15", label: "Promotion", gross: 2000, grossMode: "paycheck", taxRate: 0 }],
  }];
  const settings = { withdrawalRate: 4, redirect: true };
  const cfg = { accounts, debts: [], expenses: [], transfers: [], debtPayments: [], settings, start: START, weeks: 10 };

  const withHypo = simulateWeekly({ ...cfg, income });
  const noHypo = simulateWeekly({ ...cfg, income: withoutPromotions(income) });

  // The promotion doubles the weekly paycheck from 2026-01-15, which is week 2.
  assert.equal(noHypo.series[10].acct.chk, 10 * 1000, "without the promotion, pay stays flat at the original salary");
  assert.equal(withHypo.series[10].acct.chk, 2 * 1000 + 8 * 2000, "with the promotion, every paycheck from its date onward is at the new salary");
  assert.equal(withHypo.series[10].nw - noHypo.series[10].nw, 8000, "the net worth gap is exactly what the promotion is worth over the run");
});

test("with no promotions configured, both scenarios are identical", () => {
  const accounts = [{ id: "chk", type: "checking", balance: 500, rate: 2 }];
  const income = [{ id: "inc", name: "pay", amount: 900, gross: 900, grossMode: "paycheck", date: "2026-01-01", recur: "weekly", raise: 2, weekdayAdj: false, dist: [{ acctId: "chk" }] }];
  const settings = { withdrawalRate: 4, redirect: true };
  const cfg = { accounts, debts: [], income, expenses: [], transfers: [], debtPayments: [], settings, start: START, weeks: 30 };

  assert.equal(hasPromotions(income), false, "this fixture has no promotions");
  assert.deepEqual(
    simulateWeekly({ ...cfg, income: withoutPromotions(income) }).series,
    simulateWeekly(cfg).series,
    "with nothing to strip, the toggle can't change the projection",
  );
});

/* ================================================================== */
/*  Credit cards: charges, the grace period, and carried interest      */
/* ================================================================== */

test("a card that is never paid accrues interest on the spending it accumulates", () => {
  // Regression test. `carried` (the balance interest is charged on) was only ever updated
  // when a payment touched the card, so a card that started at zero and simply collected
  // charges reported a growing balance and *no interest at all* — $6,000 owed at 24% APR
  // for a year, $0 charged. Give the same card a $1 opening balance and it charged $0.24.
  const cfg = (balance) => ({
    accounts: [{ id: "chk", type: "checking", balance: 100000, rate: 0 }],
    debts: [{ id: "cc", kind: "card", balance, apr: 24, interestFrom: "2020-01-01" }],
    expenses: [{ id: "e", amount: 500, date: "2026-01-15", recur: "monthly", fromAcct: "cc" }],
    weeks: 52,
  });

  const fromZero = sim(cfg(0));
  assert.ok(fromZero.cardInterest > 500, `a year of unpaid spending at 24% should charge real interest, got ${fromZero.cardInterest}`);
  assert.ok(fromZero.series[52].dbt.cc > 6000, "the balance should exceed the $6,000 charged, because interest compounds on top");

  // A $1 difference in opening balance must not swing the interest charged — it did before.
  const fromOne = sim(cfg(1));
  assert.ok(Math.abs(fromOne.cardInterest - fromZero.cardInterest) < 1, "opening balance shouldn't discontinuously change how spending accrues");
});

test("paying a card in full charges no interest, whichever day of the month the payment lands", () => {
  // The grace period: purchases made during a cycle only become interest-bearing at the
  // statement close, so a card cleared every month costs nothing to carry. This must hold
  // regardless of whether the payment falls before or after the month's charges.
  const cfg = (payDate) => ({
    accounts: [{ id: "chk", type: "checking", balance: 100000, rate: 0 }],
    debts: [{ id: "cc", kind: "card", balance: 0, apr: 24, interestFrom: "2020-01-01" }],
    expenses: [{ id: "e", amount: 500, date: "2026-01-15", recur: "monthly", fromAcct: "cc" }],
    debtPayments: [{ id: "dp", amount: 0, date: payDate, recur: "monthly", fromAcct: "chk", toDebt: "cc", payFull: true }],
    weeks: 52,
  });

  for (const payDate of ["2026-01-20", "2026-02-01"]) {
    const r = sim(cfg(payDate));
    assert.equal(r.cardInterest, 0, `paying in full on ${payDate} should never accrue card interest`);
  }
});

test("a partly-paid card accrues interest on the portion left unpaid", () => {
  const r = sim({
    accounts: [{ id: "chk", type: "checking", balance: 100000, rate: 0 }],
    debts: [{ id: "cc", kind: "card", balance: 0, apr: 24, interestFrom: "2020-01-01" }],
    expenses: [{ id: "e", amount: 500, date: "2026-01-15", recur: "monthly", fromAcct: "cc" }],
    debtPayments: [{ id: "dp", amount: 100, date: "2026-01-20", recur: "monthly", fromAcct: "chk", toDebt: "cc" }],
    weeks: 52,
  });
  assert.ok(r.cardInterest > 0, "underpaying a card should cost interest");
  assert.ok(r.series[52].dbt.cc > 5000, "paying $100 against $500/mo of spending should leave a growing balance");
});

test("charges to a card are reported as `charged`, not as cash outflow", () => {
  // Money put on a card hasn't left an account yet — the distinction the Cash flow tab draws.
  const r = sim({
    accounts: [{ id: "chk", type: "checking", balance: 1000, rate: 0 }],
    debts: [{ id: "cc", kind: "card", balance: 0, apr: 24, interestFrom: "2020-01-01" }],
    expenses: [{ id: "e", amount: 300, date: "2026-01-01", recur: "weekly", fromAcct: "cc" }],
    weeks: 3,
  });
  assert.equal(r.series[0].charged, 300, "the week's card spending should be reported as charged");
  assert.equal(r.series[0].outflow, 0, "card spending is not cash leaving an account");
  assert.equal(r.series[3].acct.chk, 1000, "checking should be untouched by card spending");
  assert.equal(r.series[3].dbt.cc, 900, "three weeks of $300 should sit on the card");
});

/* ================================================================== */
/*  projectMinWeekly — the minimum-payments-only comparison path       */
/* ================================================================== */

test("projectMinWeekly amortises loans monthly and reports when they clear", () => {
  // This drives the Debt tab's "interest saved" and "years saved" headline stats.
  const r = projectMinWeekly([{ id: "l", kind: "loan", balance: 1000, apr: 12, minPayment: 100 }], START, 60);
  assert.equal(r.series[0], 1000, "week 0 should show the entered balance");
  assert.equal(r.clearedWeek, 48, "$1,000 at 12% with $100/mo should clear in the 11th payment's week");
  assert.equal(r.series[60], 0, "the loan should stay cleared afterwards");
  assert.ok(r.interest > 0 && r.interest < 100, `interest should be a plausible ~$59, got ${r.interest}`);
});

test("projectMinWeekly ignores credit cards — it is a loan-only comparison", () => {
  const withCard = projectMinWeekly([
    { id: "l", kind: "loan", balance: 1000, apr: 12, minPayment: 100 },
    { id: "c", kind: "card", balance: 5000, apr: 24, minPayment: 200 },
  ], START, 60);
  const loanOnly = projectMinWeekly([{ id: "l", kind: "loan", balance: 1000, apr: 12, minPayment: 100 }], START, 60);
  assert.deepEqual(withCard.series, loanOnly.series, "a card shouldn't appear in the minimum-payment loan curve");
  assert.equal(withCard.interest, loanOnly.interest, "nor contribute interest to it");
});

test("projectMinWeekly never clears a loan with no minimum payment, and its interest compounds", () => {
  // Worth pinning: `interestSaved` on the Debt tab is minW.interest minus the plan's
  // interest, so a loan with a zero minimum makes that comparison grow without bound.
  const r = projectMinWeekly([{ id: "l", kind: "loan", balance: 1000, apr: 6, minPayment: 0 }], START, 260);
  assert.equal(r.clearedWeek, null, "a loan nothing is paid against never clears");
  assert.ok(r.series[260] > 1000, "its balance should grow with accrued interest");
  assert.ok(r.interest > 0, "and that interest is counted");
});

test("projectMinWeekly on an empty debt list reports a flat zero curve and no payoff week", () => {
  const r = projectMinWeekly([], START, 10);
  assert.deepEqual(r.series, new Array(11).fill(0));
  assert.equal(r.interest, 0);
  assert.equal(r.clearedWeek, null, "with no debts there is no payoff to report");
});

/* ================================================================== */
/*  Transfers                                                          */
/* ================================================================== */

test("a recurring transfer moves money between accounts and counts toward invested basis", () => {
  const r = sim({
    accounts: [
      { id: "chk", type: "checking", balance: 1000, rate: 0 },
      { id: "brk", type: "brokerage", balance: 0, rate: 0 },
    ],
    transfers: [{ id: "t", amount: 100, date: "2026-01-01", recur: "weekly", fromAcct: "chk", toAcct: "brk" }],
    weeks: 4,
  });
  assert.deepEqual(r.series[4].acct, { chk: 600, brk: 400 }, "four weekly $100 transfers should have moved $400");
  assert.equal(r.series[4].basis, 400, "money transferred into an invested account is contributed basis, not growth");
});

test("a transfer out of an account whose as-of date hasn't arrived is skipped entirely", () => {
  const r = sim({
    accounts: [
      { id: "chk", type: "checking", balance: 1000, rate: 0, asOf: "2026-01-22" },
      { id: "brk", type: "brokerage", balance: 0, rate: 0 },
    ],
    transfers: [{ id: "t", amount: 100, date: "2026-01-01", recur: "weekly", fromAcct: "chk", toAcct: "brk" }],
    weeks: 5,
  });
  // 2026-01-22 is exactly 3 weeks after START, so weeks 0-3 are frozen.
  assert.equal(r.series[3].acct.chk, 1000, "the frozen source should be untouched");
  assert.equal(r.series[3].acct.brk, 0, "and the destination must not be credited from a frozen source");
  assert.equal(r.series[5].acct.brk, 200, "transfers resume once the as-of date has arrived");
});

/* ================================================================== */
/*  Income splits across accounts                                      */
/* ================================================================== */

test("a percentage split routes part of each paycheck to a second account", () => {
  // The shipped example data sends 15% of pay to savings, so this is the default path.
  const r = sim({
    accounts: [
      { id: "chk", type: "checking", balance: 0, rate: 0 },
      { id: "sav", type: "savings", balance: 0, rate: 0 },
    ],
    income: [{
      id: "i", amount: 1000, gross: 1000, grossMode: "paycheck", date: "2026-01-01",
      recur: "weekly", raise: 0, dist: [{ acctId: "chk" }, { acctId: "sav", mode: "pct", value: 15 }],
    }],
    weeks: 4,
  });
  assert.deepEqual(r.series[4].acct, { chk: 3400, sav: 600 }, "15% of $4,000 should land in savings, the remainder in checking");
});

test("a fixed-dollar split takes its amount per paycheck, and can't take more than the paycheck holds", () => {
  const withAmt = sim({
    accounts: [{ id: "chk", type: "checking", balance: 0, rate: 0 }, { id: "sav", type: "savings", balance: 0, rate: 0 }],
    income: [{
      id: "i", amount: 1000, gross: 1000, grossMode: "paycheck", date: "2026-01-01",
      recur: "weekly", raise: 0, dist: [{ acctId: "chk" }, { acctId: "sav", mode: "amt", value: 250 }],
    }],
    weeks: 4,
  });
  assert.deepEqual(withAmt.series[4].acct, { chk: 3000, sav: 1000 }, "$250 per weekly paycheck should accumulate in savings");

  const oversized = sim({
    accounts: [{ id: "chk", type: "checking", balance: 0, rate: 0 }, { id: "sav", type: "savings", balance: 0, rate: 0 }],
    income: [{
      id: "i", amount: 1000, gross: 1000, grossMode: "paycheck", date: "2026-01-01",
      recur: "weekly", raise: 0, dist: [{ acctId: "chk" }, { acctId: "sav", mode: "amt", value: 5000 }],
    }],
    weeks: 2,
  });
  assert.deepEqual(oversized.series[2].acct, { chk: 0, sav: 2000 }, "a split larger than the paycheck takes all of it, and never invents money");
});

/* ================================================================== */
/*  Bonuses through the engine                                         */
/* ================================================================== */

test("a bonus lands on its own date, with its deferral and match going to retirement", () => {
  const r = sim({
    accounts: [
      { id: "chk", type: "checking", balance: 0, rate: 0 },
      { id: "ret", type: "retirement", balance: 0, rate: 0 },
    ],
    income: [{
      id: "i", amount: 0, gross: 5000, grossMode: "paycheck", date: "2026-01-01", recur: "monthly", raise: 0,
      dist: [{ acctId: "chk" }],
      preTax: [{ mode: "pct", value: 10, toAcct: "ret", counts: true }],
      match: { rate: 100, limit: 3, toAcct: "ret" },
      bonus: { mode: "pct", value: 10, date: "2026-03-15", withhold: 30, preTaxApplies: true },
    }],
    weeks: 20,
  });

  // annual gross 5000*12 = 60,000; bonus 10% = 6,000; 10% deferral = 600; withheld 30% = 1,800
  assert.equal(r.series[20].acct.chk, 3600, "take-home bonus is gross less withholding and the deferral");
  // 5 monthly paychecks x (500 deferral + 150 capped match) = 3,250, plus the bonus's 600 + 180
  assert.equal(r.series[20].acct.ret, 4030, "the bonus's own deferral and match should reach retirement on top of the paychecks");

  const beforeBonus = r.series[10].acct.chk; // week 10 is mid-March, before the 15th
  assert.equal(beforeBonus, 0, "nothing should arrive in checking before the bonus date — take-home pay here is zero");
});

test("a bonus follows the income's account split rather than always landing in checking", () => {
  const r = sim({
    accounts: [
      { id: "chk", type: "checking", balance: 0, rate: 0 },
      { id: "sav", type: "savings", balance: 0, rate: 0 },
    ],
    income: [{
      id: "i", amount: 0, gross: 5000, grossMode: "paycheck", date: "2026-01-01", recur: "monthly", raise: 0,
      dist: [{ acctId: "chk" }, { acctId: "sav", mode: "pct", value: 25 }],
      bonus: { mode: "amt", value: 4000, date: "2026-02-10", withhold: 0, preTaxApplies: false },
    }],
    weeks: 20,
  });
  assert.equal(r.series[20].acct.sav, 1000, "25% of the $4,000 bonus should follow the split into savings");
  assert.equal(r.series[20].acct.chk, 3000, "the remainder goes to the first account in the split");
});

/* ================================================================== */
/*  The financial-independence target                                  */
/* ================================================================== */

test("spending that ends within ten years does not inflate the FI target", () => {
  // Tuition or a car loan isn't a forever cost, so it shouldn't be capitalised into the
  // number you need to retire on — but it should still show up in today's spending.
  const withEnd = (end) => sim({
    accounts: [{ id: "chk", type: "checking", balance: 0, rate: 0 }],
    expenses: [
      { id: "rent", amount: 1000, date: "2026-01-01", recur: "monthly", fromAcct: "chk" },
      { id: "tuition", amount: 500, date: "2026-01-01", recur: "monthly", end, fromAcct: "chk" },
    ],
    weeks: 4,
  });

  const ending = withEnd("2029-01-01");
  assert.equal(ending.annualExpNow, 18000, "today's spending includes the tuition");
  assert.equal(ending.annualExp, 12000, "the long-run figure drops it, because it ends inside ten years");
  assert.equal(ending.fireNumber, 300000, "at a 4% withdrawal rate the target is 25x the long-run spend");
  assert.equal(ending.endingSoon.length, 1, "the expense that was excluded should be reported so the UI can explain the gap");
  assert.equal(ending.endingSoon[0].id, "tuition");

  const perpetual = withEnd("2099-01-01");
  assert.equal(perpetual.fireNumber, 450000, "an end date beyond ten years is treated as a forever cost");
  assert.equal(perpetual.endingSoon.length, 0);
});

test("a zero withdrawal rate disables the FI target rather than dividing by zero", () => {
  const r = sim({
    accounts: [{ id: "chk", type: "checking", balance: 0, rate: 0 }],
    expenses: [{ id: "rent", amount: 1000, date: "2026-01-01", recur: "monthly", fromAcct: "chk" }],
    settings: { withdrawalRate: 0, redirect: true },
    weeks: 4,
  });
  assert.equal(r.fireNumber, 0);
  assert.equal(r.fire, null, "with no target there is no independence date to reach");
});

test("one-off expenses are excluded from the FI target, which is built from recurring spend", () => {
  const r = sim({
    accounts: [{ id: "chk", type: "checking", balance: 0, rate: 0 }],
    expenses: [
      { id: "rent", amount: 1000, date: "2026-01-01", recur: "monthly", fromAcct: "chk" },
      { id: "sofa", amount: 5000, date: "2026-02-01", recur: "once", fromAcct: "chk" },
    ],
    weeks: 4,
  });
  assert.equal(r.annualExp, 12000, "a one-time purchase isn't an ongoing cost to fund forever");
});

/* ================================================================== */
/*  Loan interest deferment                                            */
/* ================================================================== */

test("a loan does not accrue interest before its 'interest starts' date", () => {
  const r = sim({
    accounts: [{ id: "chk", type: "checking", balance: 0, rate: 0 }],
    debts: [{ id: "l", kind: "loan", balance: 10000, apr: 12, interestFrom: "2027-01-01" }],
    weeks: 104,
  });
  assert.equal(r.series[26].dbt.l, 10000, "a deferred loan holds its balance while interest is held off");
  assert.ok(r.series[104].dbt.l > 10000, "and starts accruing once the date passes");
  // roughly a year of 12% on $10,000 — enough to confirm only one year accrued, not two
  assert.ok(r.series[104].dbt.l < 11500, `only the post-deferment period should have accrued, got ${r.series[104].dbt.l}`);
});

/* ================================================================== */
/*  Account cap sweeps                                                 */
/* ================================================================== */

test("a cap sweep can spill into another account, not just at debt", () => {
  const r = sim({
    accounts: [
      { id: "chk", type: "checking", balance: 0, rate: 0, cap: 1000, spillTo: "sav", spillEvery: "weekly" },
      { id: "sav", type: "savings", balance: 0, rate: 0 },
    ],
    income: [{ id: "i", amount: 600, gross: 600, grossMode: "paycheck", date: "2026-01-01", recur: "weekly", raise: 0, dist: [{ acctId: "chk" }] }],
    weeks: 6,
  });
  assert.equal(r.series[6].acct.chk, 1000, "checking should be held at its cap");
  assert.equal(r.series[6].acct.sav, 2600, "everything above the cap should have spilled into savings");
});

test("a monthly cap sweep waits for the month's final week instead of spilling every week", () => {
  const cfg = (spillEvery) => ({
    accounts: [
      { id: "chk", type: "checking", balance: 0, rate: 0, cap: 1000, spillTo: "sav", spillEvery },
      { id: "sav", type: "savings", balance: 0, rate: 0 },
    ],
    income: [{ id: "i", amount: 600, gross: 600, grossMode: "paycheck", date: "2026-01-01", recur: "weekly", raise: 0, dist: [{ acctId: "chk" }] }],
    weeks: 4,
  });
  const monthly = sim(cfg("monthly"));
  const weekly = sim(cfg("weekly"));

  // Week 3 is still mid-January, so a monthly sweep hasn't fired yet but a weekly one has.
  assert.equal(monthly.series[3].acct.chk, 1800, "a monthly sweep lets the buffer build up during the month");
  assert.equal(monthly.series[3].swept, 0, "and doesn't spill mid-month");
  assert.equal(weekly.series[3].acct.chk, 1000, "a weekly sweep holds the cap continuously");
  assert.ok(weekly.series[3].acct.sav > 0, "spilling as it goes");
});

/* ================================================================== */
/*  Degenerate inputs                                                  */
/* ================================================================== */

test("a projection with no accounts returns a single empty snapshot rather than throwing", () => {
  const r = sim({ accounts: [], weeks: 5 });
  assert.equal(r.series.length, 1, "there's nothing to project without an account");
  assert.equal(r.series[0].nw, 0);
  assert.equal(r.debtFree, null);
  assert.equal(r.fire, null);
});

/* ================================================================== */
/*  Inflation — the projection runs in today's dollars                 */
/* ================================================================== */

test("inflation is a no-op at zero, so every projection without it is unchanged", () => {
  const accounts = [{ id: "chk", type: "checking", balance: 1000, rate: 1 }, { id: "inv", type: "brokerage", balance: 5000, rate: 7 }];
  const debts = [{ id: "ln", apr: 6, balance: 3000, kind: "loan", interestFrom: "2020-01-01" }];
  const income = [{ id: "inc", name: "pay", amount: 800, gross: 1000, grossMode: "paycheck", date: "2026-01-01", recur: "weekly", raise: 3, weekdayAdj: false, dist: [{ acctId: "chk" }] }];
  const debtPayments = [{ id: "p", name: "loan", amount: 300, date: "2026-01-01", recur: "monthly", fromAcct: "chk", toDebt: "ln" }];
  const cfg = { accounts, debts, income, expenses: [], transfers: [], debtPayments, start: START, weeks: 60 };

  const bare = simulateWeekly({ ...cfg, settings: { withdrawalRate: 4 } });
  const zero = simulateWeekly({ ...cfg, settings: { withdrawalRate: 4, inflation: 0 } });
  assert.deepEqual(zero.series, bare.series, "an explicit 0% inflation must match saved data that has no inflation field at all");
});

test("a nominal return equal to inflation buys nothing in real terms", () => {
  const accounts = [{ id: "inv", type: "brokerage", balance: 10000, rate: 3 }];
  const cfg = { accounts, debts: [], income: [], expenses: [], transfers: [], debtPayments: [], start: START, weeks: 520 };

  const nominal = simulateWeekly({ ...cfg, settings: { withdrawalRate: 4, inflation: 0 } });
  const real = simulateWeekly({ ...cfg, settings: { withdrawalRate: 4, inflation: 3 } });

  assert.ok(nominal.series[520].invest > 13000, "at 3% nominal with no inflation the balance should grow over ten years");
  assert.ok(Math.abs(real.series[520].invest - 10000) < 1, `3% growth against 3% inflation should stand still, got ${real.series[520].invest}`);
});

test("a loan payment fixed in nominal dollars loses ground to inflation", () => {
  // $12,000 at 0% with $200/mo clears in exactly 60 months when money holds its value.
  // The same $200 buys less every year, so under inflation it must take longer.
  const accounts = [{ id: "chk", type: "checking", balance: 100000, rate: 0 }];
  const debts = [{ id: "ln", apr: 0, balance: 12000, kind: "loan", interestFrom: "2020-01-01" }];
  const debtPayments = [{ id: "p", name: "loan", amount: 200, date: "2026-01-01", recur: "monthly", fromAcct: "chk", toDebt: "ln" }];
  const cfg = { accounts, debts, income: [], expenses: [], transfers: [], debtPayments, start: START, weeks: 520 };

  const flat = simulateWeekly({ ...cfg, settings: { withdrawalRate: 4, inflation: 0 } });
  const rising = simulateWeekly({ ...cfg, settings: { withdrawalRate: 4, inflation: 5 } });

  assert.ok(flat.debtFree != null && rising.debtFree != null, "both scenarios should clear the loan inside the horizon");
  assert.ok(rising.debtFree > flat.debtFree, `inflation should push payoff out, got ${rising.debtFree} vs ${flat.debtFree}`);
});

test("a promotion's salary is quoted in the money of its own year", () => {
  const inc = normIncome([{
    id: "inc", name: "pay", amount: 1000, gross: 2000, grossMode: "paycheck", date: "2026-01-01", recur: "weekly", raise: 0,
    changes: [{ id: "c", date: "2028-01-01", label: "Promotion", gross: 2420, grossMode: "paycheck", taxRate: 0 }],
  }], "chk", "ret")[0];

  const plain = salaryAt(inc, new Date(2028, 5, 1));
  const deflated = salaryAt(inc, new Date(2028, 5, 1), { inflation: 10, start: START });
  assert.equal(plain.gross, 2420, "with no inflation the figure is taken at face value");
  // two years of 10% inflation: 2420 / 1.1^2 = 2000 in today's money
  assert.ok(Math.abs(deflated.gross - 2000) < 5, `expected ~2000 in today's dollars, got ${deflated.gross.toFixed(2)}`);
});

test("the display-only nominal toggle never reaches the engine", () => {
  const accounts = [{ id: "inv", type: "brokerage", balance: 1000, rate: 6 }];
  const cfg = { accounts, debts: [], income: [], expenses: [], transfers: [], debtPayments: [], start: START, weeks: 120 };
  assert.deepEqual(
    simulateWeekly({ ...cfg, settings: { withdrawalRate: 4, inflation: 2.5, showNominal: true } }).series,
    simulateWeekly({ ...cfg, settings: { withdrawalRate: 4, inflation: 2.5, showNominal: false } }).series,
    "showNominal re-labels charts; it must not change what's simulated",
  );
});

/* ================================================================== */
/*  Payoff strategy — avalanche vs snowball                            */
/* ================================================================== */

test("avalanche and snowball roll a surplus payment to different loans", () => {
  // Target is cleared in the first month; where the leftover goes is the whole question.
  // "Big" is the expensive one, "small" is the quick win — the two strategies disagree.
  const scenario = (payoffOrder) => {
    const accounts = [{ id: "chk", type: "checking", balance: 200000, rate: 0 }];
    const debts = [
      { id: "target", apr: 1, balance: 400, kind: "loan", interestFrom: "2020-01-01" },
      { id: "big", apr: 20, balance: 6000, kind: "loan", interestFrom: "2020-01-01" },
      { id: "small", apr: 4, balance: 1500, kind: "loan", interestFrom: "2020-01-01" },
    ];
    const debtPayments = [{ id: "p", name: "plan", amount: 900, date: "2026-01-01", recur: "monthly", fromAcct: "chk", toDebt: "target" }];
    return simulateWeekly({ accounts, debts, income: [], expenses: [], transfers: [], debtPayments, settings: { withdrawalRate: 4, payoffOrder }, start: START, weeks: 260 });
  };

  const avalanche = scenario("avalanche");
  const snowball = scenario("snowball");

  assert.ok(avalanche.payoffWeek.big < avalanche.payoffWeek.small, "avalanche clears the 20% loan before the 4% one");
  assert.ok(snowball.payoffWeek.small < snowball.payoffWeek.big, "snowball clears the smaller balance first");
  assert.ok(avalanche.interest < snowball.interest, `avalanche should cost less interest (${avalanche.interest.toFixed(2)} vs ${snowball.interest.toFixed(2)})`);
  assert.equal(avalanche.debtFree, snowball.debtFree, "the same money clears the same debts by the same date either way");
});

test("payoff order defaults to avalanche for saved data that predates the setting", () => {
  const accounts = [{ id: "chk", type: "checking", balance: 50000, rate: 0 }];
  const debts = [
    { id: "target", apr: 1, balance: 200, kind: "loan", interestFrom: "2020-01-01" },
    { id: "big", apr: 18, balance: 3000, kind: "loan", interestFrom: "2020-01-01" },
    { id: "small", apr: 3, balance: 900, kind: "loan", interestFrom: "2020-01-01" },
  ];
  const debtPayments = [{ id: "p", name: "plan", amount: 600, date: "2026-01-01", recur: "monthly", fromAcct: "chk", toDebt: "target" }];
  const cfg = { accounts, debts, income: [], expenses: [], transfers: [], debtPayments, start: START, weeks: 160 };

  assert.deepEqual(
    simulateWeekly({ ...cfg, settings: { withdrawalRate: 4 } }).payoffWeek,
    simulateWeekly({ ...cfg, settings: { withdrawalRate: 4, payoffOrder: "avalanche" } }).payoffWeek,
    "no setting must behave exactly like the old hardcoded highest-rate-first",
  );
});

/* ================================================================== */
/*  Annual pre-tax contribution limit                                  */
/* ================================================================== */

const yearlyPretax = (sim, year) => sim.series.reduce((s, snap) => {
  const d = new Date(START.getTime() + snap.w * 7 * 86400000);
  return d.getFullYear() === year ? s + snap.pretax : s;
}, 0);

test("pre-tax contributions stop at the annual limit and resume in January", () => {
  const accounts = [{ id: "chk", type: "checking", balance: 0, rate: 0 }, { id: "ret", type: "retirement", balance: 0, rate: 0 }];
  const income = [{
    id: "inc", name: "pay", amount: 2000, gross: 10000, grossMode: "paycheck", date: "2026-01-01", recur: "weekly", raise: 0,
    weekdayAdj: false, dist: [{ acctId: "chk" }], preTax: [{ id: "d", name: "401k", mode: "pct", value: 50, toAcct: "ret", counts: true, capped: true }],
  }];
  const cfg = { accounts, debts: [], income, expenses: [], transfers: [], debtPayments: [], start: START, weeks: 104 };

  const capped = simulateWeekly({ ...cfg, settings: { withdrawalRate: 4, deferralLimit: 24500 } });
  const uncapped = simulateWeekly({ ...cfg, settings: { withdrawalRate: 4, deferralLimit: 0 } });

  assert.ok(Math.abs(yearlyPretax(capped, 2026) - 24500) < 1, `2026 contributions should stop at the limit, got ${yearlyPretax(capped, 2026).toFixed(2)}`);
  assert.ok(Math.abs(yearlyPretax(capped, 2027) - 24500) < 1, "the allowance resets with the calendar year");
  assert.ok(yearlyPretax(uncapped, 2026) > 24500 * 4, "with no limit set, nothing is held back");

  assert.ok(capped.capInfo.inc, "the income that hit the cap should be reported");
  const hitDate = new Date(START.getTime() + capped.capInfo.inc.week * 7 * 86400000);
  assert.equal(hitDate.getFullYear(), 2026, "the reported week is when it first bit");
  assert.ok(hitDate.getMonth() <= 2, "at 50% of a $10k weekly gross the cap arrives within the first quarter");
});

test("a deduction marked as outside the limit is left alone", () => {
  const accounts = [{ id: "chk", type: "checking", balance: 0, rate: 0 }, { id: "ret", type: "retirement", balance: 0, rate: 0 }];
  const income = [{
    id: "inc", name: "pay", amount: 2000, gross: 10000, grossMode: "paycheck", date: "2026-01-01", recur: "weekly", raise: 0,
    weekdayAdj: false, dist: [{ acctId: "chk" }], preTax: [{ id: "h", name: "HSA", mode: "pct", value: 50, toAcct: "ret", counts: true, capped: false }],
  }];
  const sim = simulateWeekly({ accounts, debts: [], income, expenses: [], transfers: [], debtPayments: [], settings: { withdrawalRate: 4, deferralLimit: 24500 }, start: START, weeks: 60 });

  assert.ok(yearlyPretax(sim, 2026) > 24500 * 4, "an uncapped deduction shouldn't be trimmed by the 401k limit");
  assert.equal(sim.capInfo.inc, undefined, "and nothing should be reported as capped");
});

test("hitting the cap early costs the match that rides on later paychecks", () => {
  const accounts = [{ id: "chk", type: "checking", balance: 0, rate: 0 }, { id: "ret", type: "retirement", balance: 0, rate: 0 }];
  const income = [{
    id: "inc", name: "pay", amount: 2000, gross: 10000, grossMode: "paycheck", date: "2026-01-01", recur: "weekly", raise: 0,
    weekdayAdj: false, dist: [{ acctId: "chk" }],
    preTax: [{ id: "d", name: "401k", mode: "pct", value: 50, toAcct: "ret", counts: true, capped: true }],
    match: { rate: 100, limit: 3, toAcct: "ret" },
  }];
  const sim = simulateWeekly({ accounts, debts: [], income, expenses: [], transfers: [], debtPayments: [], settings: { withdrawalRate: 4, deferralLimit: 24500 }, start: START, weeks: 60 });

  // Once contributions stop, so does a per-paycheck match of 100% up to 3% of $10,000.
  assert.ok(sim.capInfo.inc.lostMatch > 10000, `front-loading should forfeit most of the year's match, got ${sim.capInfo.inc.lostMatch.toFixed(2)}`);
});

/* ================================================================== */
/*  Account tax treatment, and what a balance is worth to spend        */
/* ================================================================== */

/* Expenses are funded by matching income, so the portfolio compounds instead of being
   drawn down: what's under test is the independence target, not the cash flow. */
const fiScenario = (account, settings) => simulateWeekly({
  accounts: [
    { id: "chk", type: "checking", balance: 0, rate: 0, taxTreatment: "taxable" },
    { id: "inv", type: "retirement", balance: 200000, rate: 5, ...account },
  ],
  debts: [], transfers: [], debtPayments: [],
  income: [{ id: "pay", name: "pay", amount: 1000, gross: 1000, grossMode: "paycheck", date: "2026-01-01", recur: "monthly", raise: 0, weekdayAdj: false, dist: [{ acctId: "chk" }] }],
  expenses: [{ id: "e", amount: 1000, date: "2026-01-01", recur: "monthly", fromAcct: "chk" }],
  settings: { withdrawalRate: 4, ...settings }, start: START, weeks: 1560,
});

test("a tax-deferred balance is worth less than the same balance in a Roth", () => {
  // $12k/yr of spending is a $300k target. A Roth $200k compounding at 5% reaches it in
  // about eight years; the same balance taxed at 20% on the way out has to reach $375k
  // of face value first, which takes about thirteen.
  const traditional = fiScenario({ taxTreatment: "traditional" }, { retireTaxRate: 20 });
  const roth = fiScenario({ taxTreatment: "roth" }, { retireTaxRate: 20 });

  assert.equal(roth.series[0].spendable, roth.series[0].nw, "a Roth dollar is worth a dollar");
  assert.ok(traditional.series[0].spendable < traditional.series[0].nw, "a traditional dollar isn't");
  assert.ok(Math.abs(traditional.series[0].spendable - (traditional.series[0].nw - 200000 * 0.2)) < 1);
  assert.ok(traditional.fire != null && roth.fire != null, "both should reach independence inside the run");
  assert.ok(traditional.fire > roth.fire, "so independence arrives later on tax-deferred money");
});

test("tax drag slows a taxable investment account and leaves the others alone", () => {
  const run = (taxTreatment) => simulateWeekly({
    accounts: [{ id: "inv", type: "brokerage", balance: 100000, rate: 7, taxTreatment }],
    debts: [], income: [], expenses: [], transfers: [], debtPayments: [],
    settings: { withdrawalRate: 4, taxDrag: 1 }, start: START, weeks: 520,
  });
  const taxable = run("taxable");
  const roth = run("roth");
  assert.ok(taxable.series[520].invest < roth.series[520].invest, "drag should cost the taxable account growth");
  assert.ok(roth.series[520].invest / taxable.series[520].invest > 1.05, "and over ten years it should be visible");
});

test("with no tax settings, treatment defaults leave a projection untouched", () => {
  const cfg = {
    accounts: [{ id: "chk", type: "checking", balance: 5000, rate: 0 }, { id: "brk", type: "brokerage", balance: 20000, rate: 6 }],
    debts: [], income: [], expenses: [{ id: "e", amount: 900, date: "2026-01-01", recur: "monthly", fromAcct: "chk" }],
    transfers: [], debtPayments: [], start: START, weeks: 260,
  };
  const bare = simulateWeekly({ ...cfg, settings: { withdrawalRate: 4 } });
  const explicit = simulateWeekly({ ...cfg, settings: { withdrawalRate: 4, taxDrag: 0, retireTaxRate: 0, filing: "single", stateRate: 0 } });
  assert.deepEqual(explicit.series, bare.series, "saved data with no tax fields must project exactly as before");
  assert.equal(bare.series[0].spendable, bare.series[0].nw, "with nothing tax-deferred, spendable is just net worth");
});

/* ================================================================== */
/*  Guaranteed retirement income and the sloping target                */
/* ================================================================== */

test("guaranteed income lowers the independence target and slopes it toward its start date", () => {
  const pay = { id: "pay", name: "pay", amount: 4000, gross: 4000, grossMode: "paycheck", date: "2026-01-01", recur: "monthly", raise: 0, weekdayAdj: false, dist: [{ acctId: "chk" }] };
  const base = {
    accounts: [
      { id: "chk", type: "checking", balance: 0, rate: 0, taxTreatment: "taxable" },
      { id: "brk", type: "brokerage", balance: 300000, rate: 5, taxTreatment: "taxable" },
    ],
    debts: [], transfers: [], debtPayments: [],
    expenses: [{ id: "e", amount: 4000, date: "2026-01-01", recur: "monthly", fromAcct: "chk" }],
    settings: { withdrawalRate: 4 }, start: START, weeks: 1560,
  };
  const without = simulateWeekly({ ...base, income: [pay] });
  const withSS = simulateWeekly({
    ...base,
    income: [pay, { id: "ss", name: "Social Security", amount: 2000, recur: "monthly", date: "2046-01-01", raise: 0, weekdayAdj: false, guaranteed: true, dist: [{ acctId: "brk" }] }],
  });

  assert.equal(without.series[0].fi, without.fireNumber, "with no guaranteed income the target is a flat 25×");
  assert.equal(without.series[520].fi, without.series[0].fi, "and it doesn't move");

  assert.ok(withSS.series[0].fi > withSS.series[1040].fi, "with income ahead of you the target falls as it approaches");
  assert.ok(withSS.series[1040].fi < without.series[1040].fi, "and settles below the ignore-it figure");
  // $24k/yr covered at a 4% rate is $600k less portfolio needed in the steady state
  assert.ok(Math.abs(withSS.annualExpNet - (48000 - 24000)) < 1, "the steady-state need is expenses minus guaranteed income");
  assert.ok(withSS.fire != null && (without.fire == null || withSS.fire < without.fire), "so independence arrives sooner");
});

test("the FI target curve falls monotonically until the income starts, then holds", () => {
  const sim = simulateWeekly({
    accounts: [{ id: "brk", type: "brokerage", balance: 1000, rate: 0, taxTreatment: "taxable" }],
    debts: [], income: [{ id: "p", name: "Pension", amount: 1000, recur: "monthly", date: "2036-01-01", raise: 0, weekdayAdj: false, guaranteed: true, dist: [{ acctId: "brk" }] }],
    expenses: [{ id: "e", amount: 3000, date: "2026-01-01", recur: "monthly", fromAcct: "brk" }],
    transfers: [], debtPayments: [], settings: { withdrawalRate: 4 }, start: START, weeks: 780,
  });
  for (let w = 1; w < 520; w++) {
    assert.ok(sim.series[w].fi <= sim.series[w - 1].fi + 0.01, `target should never rise (week ${w})`);
  }
  const afterStart = sim.series[600].fi;
  assert.ok(Math.abs(sim.series[780].fi - afterStart) < 0.01, "once the income has started the target is flat again");
});

/* ================================================================== */
/*  The 59½ bridge                                                     */
/* ================================================================== */

test("money locked in retirement accounts is reported as a bridge gap, not silently counted", () => {
  const cfg = (birthYear) => simulateWeekly({
    accounts: [
      { id: "ret", type: "retirement", balance: 900000, rate: 4, taxTreatment: "roth" },
      { id: "chk", type: "checking", balance: 20000, rate: 0, taxTreatment: "taxable" },
    ],
    debts: [], income: [], transfers: [], debtPayments: [],
    expenses: [{ id: "e", amount: 2000, date: "2026-01-01", recur: "monthly", fromAcct: "chk" }],
    settings: { withdrawalRate: 4, birthYear }, start: START, weeks: 520,
  });

  const noAge = cfg("");
  assert.equal(noAge.bridge, null, "with no birth year the app makes no claim about age");
  assert.equal(noAge.series[0].reach, 920000, "and treats every account as reachable");

  const young = cfg(1990); // 59½ lands around 2050, long after this plan reaches its target
  assert.ok(young.fire != null, "the plan still reaches independence");
  assert.equal(young.series[0].reach, 20000, "but only the taxable account is reachable now");
  assert.ok(young.bridge && young.bridge.gap > 0, "so the bridge to 59½ is short");
  assert.ok(young.bridge.need > young.bridge.reachable);
});
