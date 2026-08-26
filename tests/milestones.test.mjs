// Unit tests for src/milestones.js — a read over an already-computed projection, so what
// matters is that it agrees with the projection it's reading and never invents a date.
import { test } from "node:test";
import assert from "node:assert/strict";
import { milestones, milestoneDiff, CROSSINGS } from "../src/milestones.js";
import { project } from "../src/project.js";

const START = new Date(2026, 0, 1);

const plan = (over = {}) => ({
  accounts: [
    { id: "chk", type: "checking", balance: 5000, rate: 0, taxTreatment: "taxable" },
    { id: "brk", type: "brokerage", balance: 60000, rate: 6, taxTreatment: "taxable" },
  ],
  debts: [
    { id: "big", name: "Big loan", kind: "loan", balance: 15000, apr: 7, minPayment: 200, interestFrom: "2020-01-01" },
    { id: "small", name: "Small loan", kind: "loan", balance: 3000, apr: 4, minPayment: 80, interestFrom: "2020-01-01" },
  ],
  income: [{ id: "pay", name: "pay", amount: 4500, gross: 6000, grossMode: "paycheck", date: "2026-01-01", recur: "monthly", raise: 0, weekdayAdj: false, dist: [{ acctId: "chk" }] }],
  expenses: [{ id: "e", amount: 2000, date: "2026-01-01", recur: "monthly", fromAcct: "chk" }],
  transfers: [{ id: "t", name: "invest", amount: 800, date: "2026-01-01", recur: "monthly", fromAcct: "chk", toAcct: "brk" }],
  debtPayments: [
    { id: "p1", name: "big payment", amount: 400, date: "2026-01-01", recur: "monthly", fromAcct: "chk", toDebt: "big" },
    { id: "p2", name: "small payment", amount: 150, date: "2026-01-01", recur: "monthly", fromAcct: "chk", toDebt: "small" },
  ],
  settings: { withdrawalRate: 4, redirect: true, mcVolatility: 15, inflation: 2.5 },
  start: START, weeks: 2080, ...over,
});

const run = (input) => milestones(project(input), { start: START, debts: input.debts, income: input.income, settings: input.settings });

test("milestones come out in date order, with a date on every entry", () => {
  const list = run(plan());
  assert.ok(list.length > 3, "this plan should reach several milestones");
  for (let i = 1; i < list.length; i++) {
    assert.ok(list[i].week >= list[i - 1].week, "entries must be sorted by week");
  }
  for (const m of list) {
    assert.ok(m.date instanceof Date && !isNaN(m.date), `${m.label} needs a real date`);
    assert.ok(m.label && m.kind);
  }
});

test("each loan's payoff matches the projection's own figure", () => {
  const input = plan();
  const result = project(input);
  const list = milestones(result, { start: START, debts: input.debts, income: input.income, settings: input.settings });
  for (const d of input.debts) {
    const entry = list.find((m) => m.kind === "debt" && m.label.startsWith(d.name));
    assert.ok(entry, `${d.name} should appear`);
    assert.equal(entry.week, result.sim.payoffWeek[d.id], "and at the week the engine cleared it");
  }
  const debtFree = list.find((m) => m.kind === "debtFree");
  assert.equal(debtFree.week, result.sim.debtFree);
});

test("net-worth crossings appear in order and only once each", () => {
  const list = run(plan()).filter((m) => m.kind === "networth");
  assert.ok(list.length > 0);
  const labels = list.map((m) => m.label);
  assert.equal(new Set(labels).size, labels.length, "no crossing should be listed twice");
  for (let i = 1; i < list.length; i++) {
    assert.ok(list[i].week >= list[i - 1].week, "a bigger number can't be crossed earlier");
  }
  assert.ok(CROSSINGS.length > 0);
});

test("a milestone the plan never reaches is left out rather than dated wrongly", () => {
  // No income and heavy spending: net worth falls, so no crossing and no independence.
  const broke = plan({
    income: [], transfers: [],
    expenses: [{ id: "e", amount: 3000, date: "2026-01-01", recur: "monthly", fromAcct: "chk" }],
  });
  const list = run(broke);
  assert.equal(list.filter((m) => m.kind === "fi").length, 0, "independence never arrives, so it isn't listed");
  assert.equal(list.filter((m) => m.label.includes("$1m")).length, 0);
});

test("an age-based access date only appears when a birth year is set", () => {
  const without = run(plan());
  assert.equal(without.filter((m) => m.kind === "access").length, 0, "no birth year, no claim about your age");

  const withAge = run(plan({ settings: { ...plan().settings, birthYear: 1990 } }));
  const access = withAge.find((m) => m.kind === "access");
  assert.ok(access, "with one, the accounts-open date is worth knowing");
  assert.equal(access.date.getFullYear(), 2050, "born 1990 → the year they turn 60");
});

test("guaranteed income shows up on the date it starts", () => {
  const input = plan();
  input.income = [...input.income, { id: "ss", name: "Social Security", amount: 2000, recur: "monthly", date: "2046-01-01", raise: 0, weekdayAdj: false, guaranteed: true, dist: [{ acctId: "chk" }] }];
  const entry = run(input).find((m) => m.kind === "income");
  assert.ok(entry, "a guaranteed income start is a milestone");
  assert.equal(entry.date.getFullYear(), 2046);
});

test("the diff pairs milestones by name and reports how far each moved", () => {
  const a = run(plan());
  const b = run(plan({ transfers: [{ id: "t", name: "invest", amount: 1600, date: "2026-01-01", recur: "monthly", fromAcct: "chk", toAcct: "brk" }] }));
  const rows = milestoneDiff(a, b);

  const fi = rows.find((r) => r.kind === "fi");
  assert.ok(fi && fi.deltaWeeks != null, "both plans reach independence, so it's comparable");
  assert.ok(fi.deltaWeeks > 0, "the plan investing half as much should get there later");
  assert.ok(Math.abs(fi.deltaMonths - fi.deltaWeeks / (52.1775 / 12)) < 0.01);

  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1].week == null ? Infinity : rows[i - 1].week;
    const cur = rows[i].week == null ? Infinity : rows[i].week;
    assert.ok(cur >= prev, "diff rows stay in date order, with unreached ones last");
  }
});

test("a milestone only one plan reaches is still listed", () => {
  const rich = run(plan());
  const poor = run(plan({ transfers: [], income: [] }));
  const rows = milestoneDiff(poor, rich);
  const onlyRich = rows.filter((r) => r.week == null && r.otherWeek != null);
  assert.ok(onlyRich.length > 0, "what the other plan reaches and this one doesn't is the point of comparing");
  assert.ok(onlyRich.every((r) => r.deltaWeeks == null), "and there's no delta to report for those");
});

test("an empty or missing projection returns an empty list rather than throwing", () => {
  assert.deepEqual(milestones({}, { start: START }), []);
  assert.deepEqual(milestones({ sim: { series: [] } }, { start: START }), []);
  assert.deepEqual(milestoneDiff([], []), []);
});
