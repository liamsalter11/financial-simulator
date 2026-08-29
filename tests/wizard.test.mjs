// Unit tests for src/wizard.js — the answer sheet turned into a plan.
//
// The real assurance here isn't the shape of the object. It's that the plan the wizard
// emits is one the rest of the app can actually run: `simulateWeekly` produces a usable
// series from it, and `runChecks` finds nothing wrong with it. A wizard that emits a plan
// with a dangling id, or a card nothing pays, would have handed someone a broken projection
// on their very first screen — which is worse than the seed data it replaced.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPlan, emptyAnswers, spendRows, stepReady, summarize, STEPS, DEBT_KINDS } from "../src/wizard.js";
import { simulateWeekly } from "../src/engine.js";
import { runChecks } from "../src/checks.js";
import { normAccounts, normDebts, normIncome, normExpenses, pickIds } from "../src/seeds.js";
import { takeHomeOf } from "../src/payroll.js";
import { isIlliquid } from "../src/format.js";

const START = new Date(2026, 0, 1);

/* A full answer sheet — one of everything, so a single run exercises every branch. */
const filled = (over = {}) => ({
  ...emptyAnswers(),
  payMode: "gross", gross: 110000, recur: "biweekly", filing: "single", stateRate: 5, birthYear: 1990,
  retirePct: 6, matchPct: 3,
  checking: 6000, savings: 15000, brokerage: 40000, retirement: 55000, home: 480000, vehicle: 28000,
  debts: [
    { id: "d1", name: "Student loan", balance: 18500, apr: 7.75, minPayment: 235, type: "loan" },
    { id: "d2", name: "Mortgage", balance: 355000, apr: 6.25, minPayment: 2300, type: "mortgage" },
    { id: "d3", name: "Car loan", balance: 21000, apr: 7.9, minPayment: 480, type: "auto" },
    { id: "d4", name: "Visa", balance: 0, apr: 22.99, minPayment: 0, type: "card" },
  ],
  spendMode: "total", monthlySpend: 4200, investMonthly: 800,
  ...over,
});

/* Whatever `applyPlan` would do to it on the way in, so these tests exercise the same plan
   the app actually runs rather than a rawer one. */
const normalized = (p) => {
  const accounts = normAccounts(p.accounts), debts = normDebts(p.debts);
  const id = pickIds(accounts, debts);
  return {
    accounts, debts,
    income: normIncome(p.income, id.chk, id.ret),
    expenses: normExpenses(p.expenses),
    transfers: p.transfers, debtPayments: p.debtPayments, settings: p.settings,
  };
};
const run = (p, weeks = 520) => simulateWeekly({ ...normalized(p), start: START, weeks });

/* The subset of `D` that checks.js reads, worked out from the plan rather than a
   projection — enough for the conditions that are about the plan's own consistency. */
const factsFor = (p) => ({
  surplus: 1, leftover: 1, runway: 12, monthlyInterest: 0, monthlyDebtPay: 1, totalLoans: 0,
  negAcct: null, worstMonthOut: () => 0, loansNoPayment: [], deferralNotes: [],
  survivalProb: 1, bridge: null,
  nextCardPay: Object.fromEntries((p.debtPayments || []).map((x) => [x.toDebt, true])),
});

test("the plan it builds is one the engine can actually run", () => {
  const sim = run(buildPlan(filled()));
  assert.equal(sim.series.length, 521);
  for (const w of [0, 100, 520]) {
    assert.ok(Number.isFinite(sim.series[w].nw), `week ${w} produced ${sim.series[w].nw}`);
  }
  assert.ok(sim.series[0].nw > 0, "this answer sheet is solvent");
  assert.ok(sim.series[520].nw > sim.series[0].nw, "and saving something should get somewhere");
});

test("runChecks finds nothing wrong with a plan the wizard built", () => {
  const p = buildPlan(filled());
  assert.deepEqual(runChecks(p, factsFor(p)), []);
});

test("every id the plan refers to is an id the plan contains", () => {
  /* the failure this guards is silent: a row pointing at nothing simply stops moving money */
  const p = buildPlan(filled());
  const accts = new Set(p.accounts.map((a) => a.id));
  const debts = new Set(p.debts.map((d) => d.id));
  const ok = (id, set, what) => assert.ok(!id || set.has(id), `${what} points at ${id}, which isn't in the plan`);

  for (const e of p.expenses) ok(e.fromAcct, accts, "an expense");
  for (const t of p.transfers) { ok(t.fromAcct, accts, "a transfer"); ok(t.toAcct, accts, "a transfer"); }
  for (const x of p.debtPayments) { ok(x.fromAcct, accts, "a payment"); ok(x.toDebt, debts, "a payment"); }
  for (const d of p.debts) ok(d.securedBy, accts, "a lien");
  for (const inc of p.income) {
    for (const s of inc.dist) ok(s.acctId, accts, "a paycheck split");
    for (const pt of inc.preTax) ok(pt.toAcct, accts, "a contribution");
    if (inc.match) ok(inc.match.toAcct, accts, "an employer match");
  }
  ok(p.settings.overflowTo, accts, "the overflow destination");
});

test("a mortgage and a car loan come out secured on what they're secured on", () => {
  const p = buildPlan(filled());
  const by = (name) => p.debts.find((d) => d.name === name);
  const acct = (id) => p.accounts.find((a) => a.id === id);
  assert.equal(acct(by("Mortgage").securedBy).type, "home");
  assert.equal(acct(by("Car loan").securedBy).type, "vehicle");
  assert.equal(by("Student loan").securedBy, "", "an ordinary loan is a lien on nothing");
  /* and that link is what keeps them out of the debt-free date */
  const sim = run(p, 2080);
  assert.ok(sim.series[0].securedDebt > 0 && sim.series[0].unsecuredDebt > 0);
});

test("a mortgage with no home entered is just a loan, not a lien on nothing", () => {
  /* the alternative is a securedBy pointing at an account that was never created, which
     checks.js would (correctly) report as an error on a plan the app itself just built */
  const p = buildPlan(filled({ home: "", vehicle: "" }));
  assert.ok(!p.accounts.some((a) => isIlliquid(a.type)));
  for (const d of p.debts) assert.equal(d.securedBy, "");
  assert.deepEqual(runChecks(p, factsFor(p)), []);
});

test("a gross salary derives take-home from the brackets, and it's a real figure", () => {
  const p = buildPlan(filled());
  const inc = p.income[0];
  assert.equal(inc.taxMode, "derived");
  const net = takeHomeOf(inc, { filing: p.settings.filing, stateRate: p.settings.stateRate });
  assert.ok(net > 0, "a derived take-home has to actually come out positive");
  assert.ok(net < inc.gross / 26, "and it has to be less than gross, or nothing was taxed");
});

test("someone who only knows their take-home gets exactly that, untaxed", () => {
  const p = buildPlan(filled({ payMode: "take", gross: "", takeHome: 2600 }));
  assert.equal(p.income[0].taxMode, "typed");
  assert.equal(p.income[0].amount, 2600);
  assert.ok(Number.isFinite(run(p).series[100].nw));
});

test("one monthly total becomes one expense; per-category answers become several", () => {
  const one = buildPlan(filled());
  assert.equal(one.expenses.length, 1);
  assert.equal(one.expenses[0].amount, 4200);

  const many = buildPlan(filled({
    spendMode: "categories", monthlySpend: "",
    categories: { housing: 1800, food: 700, transport: 300, fun: 0 },
  }));
  assert.deepEqual(many.expenses.map((e) => e.category), ["housing", "food", "transport"]);
  assert.ok(!many.expenses.some((e) => e.amount === 0), "a category left blank creates nothing");
  /* and the two routes agree about how many rows there are before anything is built */
  assert.equal(spendRows(filled({ spendMode: "categories", categories: { housing: 1800 } })).length, 1);
});

test("accounts you don't have aren't created, but checking always is", () => {
  const bare = buildPlan({ ...emptyAnswers(), payMode: "take", takeHome: 2000, checking: 500, monthlySpend: 1500 });
  assert.deepEqual(bare.accounts.map((a) => a.type), ["checking"]);
  assert.equal(bare.debts.length, 0);
  assert.equal(bare.transfers.length, 0);
  /* with nowhere better to put it, everything still points somewhere real */
  assert.equal(bare.settings.overflowTo, bare.accounts[0].id);
  assert.equal(bare.income[0].dist[0].acctId, bare.accounts[0].id);
  assert.ok(Number.isFinite(run(bare).series[200].nw));
});

test("a card is paid in full rather than left to carry a balance", () => {
  const p = buildPlan(filled({
    debts: [{ id: "c", name: "Visa", balance: 400, apr: 22.99, minPayment: 0, type: "card" }],
  }));
  assert.equal(p.debts[0].kind, "card");
  const pay = p.debtPayments.find((x) => x.toDebt === p.debts[0].id);
  assert.ok(pay && pay.payFull, "a card with no payment is the one thing checks.js calls an error");
  assert.deepEqual(runChecks(p, factsFor(p)), []);
});

test("an answer sheet of zeros produces a plan the engine accepts rather than throwing", () => {
  const p = buildPlan(emptyAnswers());
  assert.equal(p.accounts.length, 1, "still somewhere for money to land");
  assert.equal(p.expenses.length, 0);
  assert.doesNotThrow(() => run(p, 60));
  assert.equal(run(p, 60).series[60].nw, 0);
  /* and buildPlan defends against being handed nothing at all */
  assert.doesNotThrow(() => buildPlan());
  assert.doesNotThrow(() => buildPlan({ debts: null, categories: null }));
});

test("each step knows when it has what it needs", () => {
  const a = emptyAnswers();
  assert.equal(stepReady("you", a), false);
  assert.equal(stepReady("you", { ...a, gross: 90000 }), true);
  assert.equal(stepReady("you", { ...a, payMode: "take", gross: 90000 }), false, "the wrong figure doesn't count");
  assert.equal(stepReady("you", { ...a, payMode: "take", takeHome: 2000 }), true);
  assert.equal(stepReady("have", a), false);
  assert.equal(stepReady("have", { ...a, vehicle: 9000 }), true, "a car alone is something you have");
  assert.equal(stepReady("owe", a), true, "owing nothing is an answer");
  assert.equal(stepReady("spend", a), false);
  assert.equal(stepReady("spend", { ...a, monthlySpend: 100 }), true);
  assert.equal(stepReady("review", a), true);
});

test("the review counts what will actually be created, not what was typed", () => {
  /* read off the built plan, so it can't promise a row the builder then drops */
  const p = buildPlan(filled({ investMonthly: "" }));
  const said = summarize(p);
  assert.ok(said.some((x) => x === `${p.accounts.length} accounts`));
  assert.ok(said.some((x) => x === `${p.debts.length} debts`));
  assert.ok(!said.some((x) => /transfer/.test(x)), "no transfer was asked for, so none is promised");
  assert.equal(summarize(buildPlan(filled({ debts: [] }))).some((x) => /debt/.test(x)), false);
  assert.deepEqual(summarize({}), []);
});

test("the steps and the debt kinds are the fixed lists the form walks", () => {
  assert.deepEqual(STEPS.map((s) => s.v), ["you", "have", "owe", "spend", "review"]);
  for (const s of STEPS) assert.ok(s.title && s.sub, `${s.v} needs a title and a subtitle`);
  for (const k of DEBT_KINDS) assert.ok(k.kind === "loan" || k.kind === "card", `${k.v} has kind ${k.kind}`);
  assert.deepEqual(DEBT_KINDS.filter((k) => k.secures).map((k) => k.secures), ["home", "vehicle"]);
});
