// Unit tests for the pure simulation-engine functions in src/engine.js and
// src/payroll.js, run without a browser — these are plain ES modules with no React
// dependency, so they're imported directly. These tests construct small, deterministic
// scenarios rather than reusing the app's seed data, which is intentionally relative
// to today's date and would make assertions drift.
import { test } from "node:test";
import assert from "node:assert/strict";
import { simulateWeekly } from "../src/engine.js";
import { payrollOf, bonusOf, salaryAt } from "../src/payroll.js";
import { normIncome } from "../src/seeds.js";

const START = new Date(2026, 0, 1); // a Thursday; dates below are chosen to land on/after it

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
