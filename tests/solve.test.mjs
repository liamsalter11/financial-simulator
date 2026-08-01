// Unit tests for src/solve.js. The load-bearing property is that a solved amount actually
// produces the promised result when fed back through the engine — a search that converges
// to a confident wrong number is worse than one that admits it can't get there.
import { test } from "node:test";
import assert from "node:assert/strict";
import { goalSeek, tornado, knobOf, targetOf, weekOf, KNOBS, TARGETS, FACTORS } from "../src/solve.js";
import { project } from "../src/project.js";

const START = new Date(2026, 0, 1);
const iso = (w) => new Date(START.getTime() + w * 7 * 86400000).toISOString().slice(0, 10);

const plan = (over = {}) => ({
  accounts: [
    { id: "chk", type: "checking", balance: 5000, rate: 0, taxTreatment: "taxable" },
    { id: "brk", type: "brokerage", balance: 50000, rate: 6, taxTreatment: "taxable" },
  ],
  debts: [{ id: "ln", kind: "loan", balance: 20000, apr: 7, minPayment: 250, interestFrom: "2020-01-01" }],
  income: [{ id: "pay", name: "pay", amount: 4000, gross: 5500, grossMode: "paycheck", date: "2026-01-01", recur: "monthly", raise: 0, weekdayAdj: false, dist: [{ acctId: "chk" }] }],
  expenses: [{ id: "e", amount: 2000, date: "2026-01-01", recur: "monthly", fromAcct: "chk" }],
  transfers: [{ id: "t", name: "invest", amount: 500, date: "2026-01-01", recur: "monthly", fromAcct: "chk", toAcct: "brk" }],
  debtPayments: [
    { id: "p", name: "loan payment", amount: 250, date: "2026-01-01", recur: "monthly", fromAcct: "chk", toDebt: "ln" },
    { id: "x", name: "Extra toward payoff", amount: 100, date: "2026-01-01", recur: "monthly", fromAcct: "chk", toDebt: "ln" },
  ],
  settings: { withdrawalRate: 4, redirect: true, mcVolatility: 15, inflation: 2.5 },
  start: START, weeks: 2080, ...over,
});

test("the knobs and targets are each internally consistent", () => {
  for (const k of KNOBS) {
    assert.ok(k.v && k.label && k.max > 0, `${k.v} needs a label and a ceiling`);
    assert.ok(k.direction === "min" || k.direction === "max", `${k.v} needs a search direction`);
    assert.equal(typeof k.apply, "function");
    assert.ok(k.current(plan()) >= 0, `${k.v} should report what the plan does today`);
  }
  for (const t of TARGETS) {
    assert.ok(t.v && t.label && typeof t.measure === "function");
    assert.ok(t.kind === "date" || t.kind === "percent");
  }
});

test("a solved amount really does hit the date when fed back to the engine", () => {
  const input = plan();
  const base = project(input).sim.debtFree;
  const target = Math.round(base * 0.7); // ask to be done noticeably sooner
  const r = goalSeek({ input, knob: "extraDebt", target: "debtFree", value: iso(target) });

  assert.equal(r.hit, true, "this is comfortably reachable");
  assert.ok(r.amount > 0);
  const replayed = project(knobOf("extraDebt").apply(input, r.amount)).sim.debtFree;
  assert.ok(Math.abs(replayed - target) <= 2, `solver promised week ${target}, replay gave ${replayed}`);
});

test("asking for more is answered with more", () => {
  const input = plan();
  const base = project(input).sim.debtFree;
  const soon = goalSeek({ input, knob: "extraDebt", target: "debtFree", value: iso(Math.round(base * 0.5)) });
  const later = goalSeek({ input, knob: "extraDebt", target: "debtFree", value: iso(Math.round(base * 0.8)) });
  assert.ok(soon.amount > later.amount, "an earlier date should cost more per month");
});

test("an impossible target says so instead of returning the ceiling as an answer", () => {
  // A $2m loan cannot be cleared inside a year even at the knob's $20k/mo ceiling.
  const input = plan({ debts: [{ id: "ln", kind: "loan", balance: 2000000, apr: 7, minPayment: 250, interestFrom: "2020-01-01" }] });
  const r = goalSeek({ input, knob: "extraDebt", target: "debtFree", value: iso(52) });
  assert.equal(r.hit, false);
  assert.equal(r.reason, "unreachable");
  assert.ok(r.achieved > 52, "and it reports what the ceiling actually achieves");
});

test("a target already met costs nothing", () => {
  const r = goalSeek({ input: plan(), knob: "extraDebt", target: "debtFree", value: iso(2000) });
  assert.equal(r.hit, true);
  assert.equal(r.reason, "already");
  assert.equal(r.amount, 0);
});

test("a knob that can't move the target says so rather than guessing", () => {
  // Spending less doesn't clear a loan sooner: the freed money piles up in checking, it
  // isn't routed to the debt. That's a fact about the plan worth telling the user.
  const r = goalSeek({ input: plan(), knob: "spend", target: "debtFree", value: iso(60) });
  assert.equal(r.reason, "noEffect");
  assert.equal(r.hit, false);
});

test("trimming the horizon doesn't change the answer", () => {
  // Date targets search on a shortened run for speed; the answer has to match the full one.
  const input = plan();
  const target = Math.round(project(input).sim.debtFree * 0.7);
  const trimmed = goalSeek({ input, knob: "extraDebt", target: "debtFree", value: iso(target) });
  assert.ok(trimmed.horizon < 2080, "a near-term date should search on a shorter run");
  const full = goalSeek({ input: { ...input, weeks: 2080 }, knob: "extraDebt", target: "debtFree", value: iso(target), iterations: 18 });
  assert.ok(Math.abs(trimmed.amount - full.amount) < 5, `trimmed ${trimmed.amount} vs full ${full.amount}`);
});

test("the spending knob never searches down to zero", () => {
  // Spending nothing makes the independence target $0, so there's nothing to be
  // independent of and the projection reports no date at all — a degenerate lower bound.
  const input = plan();
  const r = goalSeek({ input, knob: "spend", target: "fi", value: iso(1200) });
  assert.ok(r.amount > 0, "an answer of $0/mo would be a modelling artefact, not advice");
  assert.ok(project(knobOf("spend").apply(input, r.amount)).sim.fireNumber > 0);
});

test("every knob and target pairing returns a usable shape", () => {
  const input = plan();
  for (const k of KNOBS) {
    for (const t of TARGETS) {
      const value = t.kind === "date" ? iso(900) : 80;
      const r = goalSeek({ input, knob: k.v, target: t.v, value, iterations: 6, searchTrials: 40 });
      assert.ok(Number.isFinite(r.amount), `${k.v}/${t.v} returned a non-finite amount`);
      assert.equal(typeof r.hit, "boolean");
      assert.ok(r.reason, `${k.v}/${t.v} should always explain itself`);
      assert.ok(r.runs > 0);
    }
  }
});

test("the tornado ranks factors by how far they move the independence date", () => {
  const { rows, baseFire } = tornado({ input: plan() });
  assert.equal(rows.length, FACTORS.length);
  assert.ok(baseFire != null, "this fixture reaches independence");
  for (let i = 1; i < rows.length; i++) {
    assert.ok(Math.abs(rows[i - 1].weeks) >= Math.abs(rows[i].weeks), "rows should be sorted by impact");
  }
  const byName = Object.fromEntries(rows.map((r) => [r.v, r]));
  assert.ok(byName.inflation.weeks > 0, "more inflation should push independence out");
  assert.ok(byName.spend.weeks < 0, "spending less should pull it in");
  assert.ok(byName.withdrawal.weeks < 0, "a higher withdrawal rate means a smaller target, so it arrives sooner");
});

test("weekOf converts a date to a week index from the start", () => {
  assert.equal(weekOf(iso(0), START), 0);
  assert.equal(weekOf(iso(52), START), 52);
  assert.equal(weekOf("2020-01-01", START), 0, "a date in the past clamps to today rather than going negative");
});

test("knobOf and targetOf fall back rather than returning undefined", () => {
  assert.equal(knobOf("nope").v, KNOBS[0].v);
  assert.equal(targetOf("nope").v, TARGETS[0].v);
});
