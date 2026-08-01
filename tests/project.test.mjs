// Unit tests for src/project.js — the seam the Web Worker runs behind. The point of these
// is that the seam is behaviour-free: whatever the page used to compute inline, project()
// computes identically, and splitting the comparison runs out of the primary result
// doesn't disturb it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { project, projectComparisons, projectAll, blendedReturn, retirementWindow } from "../src/project.js";
import { simulateWeekly, WEEKS } from "../src/engine.js";

const START = new Date(2026, 0, 1);

const input = (settings = {}, over = {}) => ({
  accounts: [
    { id: "chk", type: "checking", balance: 4000, rate: 0, taxTreatment: "taxable" },
    { id: "brk", type: "brokerage", balance: 60000, rate: 6, taxTreatment: "taxable" },
  ],
  debts: [
    { id: "big", kind: "loan", balance: 9000, apr: 18, minPayment: 200, interestFrom: "2020-01-01" },
    { id: "small", kind: "loan", balance: 2000, apr: 4, minPayment: 60, interestFrom: "2020-01-01" },
  ],
  income: [{ id: "pay", name: "pay", amount: 2500, gross: 3500, grossMode: "paycheck", date: "2026-01-01", recur: "monthly", raise: 0, weekdayAdj: false, dist: [{ acctId: "chk" }] }],
  expenses: [{ id: "e", amount: 1800, date: "2026-01-01", recur: "monthly", fromAcct: "chk" }],
  transfers: [{ id: "t", amount: 300, date: "2026-01-01", recur: "monthly", fromAcct: "chk", toAcct: "brk" }],
  debtPayments: [{ id: "p", name: "plan", amount: 500, date: "2026-01-01", recur: "monthly", fromAcct: "chk", toDebt: "big" }],
  settings: { withdrawalRate: 4, redirect: true, mcVolatility: 15, ...settings },
  start: START, weeks: 520, ...over,
});

test("the primary projection matches calling the engine directly", () => {
  const inp = input();
  const direct = simulateWeekly({
    accounts: inp.accounts, debts: inp.debts, income: inp.income, expenses: inp.expenses,
    transfers: inp.transfers, debtPayments: inp.debtPayments, settings: inp.settings,
    start: START, weeks: 520,
  });
  const out = project(inp);
  assert.deepEqual(out.sim.series, direct.series, "the seam must not change a single week");
  assert.equal(out.sim.debtFree, direct.debtFree);
  assert.equal(out.sim.fire, direct.fire);
});

test("the primary result carries no comparison runs, and projectAll adds them", () => {
  const inp = input();
  const primary = project(inp);
  assert.equal(primary.simWith, undefined, "a first paint shouldn't pay for the what-ifs");
  assert.equal(primary.strategy, undefined);

  const all = projectAll(inp);
  assert.deepEqual(all.sim.series, primary.sim.series, "adding them must not disturb the projection");
  assert.ok(all.simWith && all.simWithout, "both promotion scenarios should be present");
  assert.ok(all.strategy, "two loans means a payoff-strategy comparison is worth running");
  assert.equal(all.strategy.other, "snowball", "avalanche's counterpart is snowball");
});

test("comparisons computed separately match computing everything at once", () => {
  const inp = input();
  const primary = project(inp);
  const extras = projectComparisons(inp, primary.sim);
  const all = projectAll(inp);
  assert.deepEqual(extras.strategy, all.strategy, "the two-stage worker protocol must agree with the one-shot path");
  assert.deepEqual(extras.simWithout.series, all.simWithout.series);
});

test("a single loan isn't worth a payoff-strategy comparison", () => {
  const inp = input();
  inp.debts = [inp.debts[0]];
  assert.equal(projectAll(inp).strategy, null, "with one loan there's no order to choose");
});

test("a plain object start date works, since a worker may hand back a string", () => {
  const inp = input({}, { start: "2026-01-01" });
  const out = project(inp);
  assert.ok(out.sim.series.length > 0);
  assert.deepEqual(out.sim.series[0].acct, project(input()).sim.series[0].acct);
});

test("blendedReturn weights by balance and converts to a real rate", () => {
  const accounts = [
    { type: "brokerage", balance: 100000, rate: 8 },
    { type: "retirement", balance: 100000, rate: 4 },
    { type: "checking", balance: 500000, rate: 0 },  /* not invested — must not dilute */
  ];
  assert.ok(Math.abs(blendedReturn(accounts, 0) - 0.06) < 1e-9, "6% nominal blended across the invested half");
  assert.ok(blendedReturn(accounts, 3) < blendedReturn(accounts, 0), "inflation cuts the real rate");
  assert.ok(Math.abs(blendedReturn([], 0) - 0.07) < 1e-9, "with nothing invested it falls back to 7%");
});

test("the retirement window follows the FI date unless overridden", () => {
  const base = { withdrawalRate: 4 };
  assert.equal(retirementWindow(base, START, 520).retireWeek, 520, "no override means the projection's own FI date");
  assert.equal(retirementWindow(base, START, null).retireWeek, null, "and no FI date means no retirement to test");

  const override = retirementWindow({ ...base, mcRetireDate: "2031-01-01" }, START, 520);
  assert.ok(Math.abs(override.retireWeek - 261) <= 1, "an explicit date wins over the FI date");

  const byYears = retirementWindow({ ...base, mcYears: 25 }, START, 520);
  assert.ok(Math.abs(byYears.horizonWeeks - (520 + 25 * 52.1775)) <= 2, "without a birth year the horizon is N years past retirement");

  /* born 1990, money must last to 70 → the year 2060, which is 34 years from this start */
  const byAge = retirementWindow({ ...base, birthYear: 1990, mcEndAge: 70 }, START, 520);
  assert.ok(Math.abs(byAge.horizonWeeks - 34 * 52.1775) <= 2, "with a birth year, it runs to the age given");
  /* to 95 would be 2085 — past the engine's own 40-year horizon, so it clamps rather than
     reporting a projection that doesn't exist */
  assert.equal(retirementWindow({ ...base, birthYear: 1990, mcEndAge: 95 }, START, 520).horizonWeeks, WEEKS);
  assert.ok(retirementWindow({ ...base, birthYear: 1900 }, START, 520).horizonWeeks <= WEEKS, "and never past it");
});
