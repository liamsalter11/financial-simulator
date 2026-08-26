// Unit tests for src/checks.js — the one place that decides what's wrong with a plan.
// The whole point of the module is that a condition is written once, so these tests are
// what stand behind both the summary list and the inline markers in the tabs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runChecks, countByLevel, checksFor } from "../src/checks.js";

/* A plan with nothing wrong with it. Every test below breaks exactly one thing. */
const clean = () => ({
  accounts: [
    { id: "chk", name: "Checking", type: "checking", balance: 6000, rate: 0 },
    { id: "brk", name: "Brokerage", type: "brokerage", balance: 40000, rate: 7 },
  ],
  debts: [{ id: "l1", name: "Loan", kind: "loan", balance: 18500, apr: 7.75, minPayment: 400 }],
  income: [{ id: "i1", name: "Take-home pay", amount: 3000, recur: "biweekly", dist: [{ acctId: "chk" }], preTax: [] }],
  expenses: [{ id: "e1", label: "Rent", category: "housing", amount: 1500, recur: "monthly", fromAcct: "chk" }],
  transfers: [{ id: "t1", name: "Auto-invest", amount: 800, recur: "monthly", fromAcct: "chk", toAcct: "brk" }],
  debtPayments: [{ id: "p1", name: "Loan payment", amount: 400, recur: "monthly", fromAcct: "chk", toDebt: "l1" }],
  settings: { deferralLimit: 24500 },
});
const facts = (over = {}) => ({
  surplus: 3000, leftover: 1200, runway: 7, monthlyInterest: 120, monthlyDebtPay: 400,
  totalLoans: 18500, negAcct: null, worstMonthOut: () => 2300, nextCardPay: {},
  loansNoPayment: [], deferralNotes: [], survivalProb: 0.95, bridge: null, ...over,
});
const ids = (r) => r.map((c) => c.id);
const has = (r, prefix) => r.some((c) => c.id === prefix || c.id.startsWith(prefix + ":"));

test("a plan with nothing wrong produces nothing", () => {
  assert.deepEqual(runChecks(clean(), facts()), []);
});

test("an empty plan doesn't throw", () => {
  assert.doesNotThrow(() => runChecks());
  assert.doesNotThrow(() => runChecks({}, {}));
});

/* ------------------------------------------------------------------ */
/*  Dangling references — the ones nothing catches today               */
/* ------------------------------------------------------------------ */
test("deleting an account catches everything that pointed at it", () => {
  const p = clean();
  p.accounts = p.accounts.filter((a) => a.id !== "chk");   /* as the UI's delete does: no cascade */
  const r = runChecks(p, facts());
  assert.ok(has(r, "orphan"), "expected the orphaned rows to be reported");
  const orphans = r.filter((c) => c.id.startsWith("orphan:"));
  assert.equal(orphans.length, 4, "the expense, the transfer, the payment and the paycheck split");
  for (const o of orphans) assert.equal(o.level, "error", "money that silently stops moving is an error, not a caution");
});

test("a payment aimed at a deleted debt is caught", () => {
  const p = clean();
  p.debts = [];
  const r = runChecks(p, facts({ totalLoans: 0 }));
  assert.ok(r.some((c) => c.id === "orphan:p1:toDebt"));
});

test("a pre-tax contribution paying into a deleted account is caught", () => {
  const p = clean();
  p.income[0].preTax = [{ id: "pt1", name: "401k", mode: "pct", value: 6, toAcct: "gone" }];
  const r = runChecks(p, facts());
  assert.ok(r.some((c) => c.id === "orphan:i1:pretax:pt1"));
});

test("a row pointing at a card rather than an account is fine", () => {
  const p = clean();
  p.debts.push({ id: "cc", name: "Card", kind: "card", balance: 0, apr: 22.99 });
  p.expenses[0].fromAcct = "cc";
  p.debtPayments.push({ id: "p2", name: "Card payment", payFull: true, recur: "monthly", fromAcct: "chk", toDebt: "cc" });
  const r = runChecks(p, facts({ nextCardPay: { cc: { week: 2 } } }));
  assert.ok(!has(r, "orphan"), `expenses may be charged to a card: ${ids(r)}`);
});

/* ------------------------------------------------------------------ */
/*  Cash flow                                                          */
/* ------------------------------------------------------------------ */
test("spending past income is an error; over-committing what's left is only a warning", () => {
  const over = runChecks(clean(), facts({ surplus: -400 }));
  assert.equal(over.find((c) => c.id === "surplus").level, "error");
  const tight = runChecks(clean(), facts({ leftover: -200 }));
  assert.equal(tight.find((c) => c.id === "leftover").level, "warn");
});

test("the two cash-flow findings don't both fire — the second is a symptom of the first", () => {
  const r = runChecks(clean(), facts({ surplus: -400, leftover: -900 }));
  assert.ok(has(r, "surplus"));
  assert.ok(!has(r, "leftover"));
});

test("fixed splits beyond take-home are caught, and percentage splits over 100 separately", () => {
  const p = clean();
  p.income[0].dist = [{ acctId: "chk" }, { acctId: "brk", mode: "amt", value: 4000 }];
  assert.ok(has(runChecks(p, facts()), "split"));

  const q = clean();
  q.income[0].dist = [{ acctId: "chk" }, { acctId: "brk", mode: "pct", value: 80 }, { acctId: "brk", mode: "pct", value: 40 }];
  const r = runChecks(q, facts());
  assert.ok(has(r, "pct"));
  assert.ok(!has(r, "split"), "a percentage split isn't a fixed one");
});

test("an end date before the start date is caught wherever it appears", () => {
  const p = clean();
  p.expenses[0].date = "2026-06-01"; p.expenses[0].end = "2026-01-01";
  p.transfers[0].date = "2026-06-01"; p.transfers[0].end = "2026-03-01";
  const r = runChecks(p, facts());
  assert.equal(r.filter((c) => c.id.startsWith("dates:")).length, 2);
});

test("a transfer into its own source account is caught", () => {
  const p = clean();
  p.transfers[0].toAcct = "chk";
  assert.ok(has(runChecks(p, facts()), "loop"));
});

/* ------------------------------------------------------------------ */
/*  Debt                                                               */
/* ------------------------------------------------------------------ */
test("a card with a balance and no payment is an error", () => {
  const p = clean();
  p.debts.push({ id: "cc", name: "Card", kind: "card", balance: 900, apr: 22.99 });
  const r = runChecks(p, facts());
  assert.ok(has(r, "nocardpay"));
  assert.equal(r.find((c) => c.id === "nocardpay:cc").level, "error");
});

test("a zero-balance card being charged is caught too — that's how a balance appears", () => {
  const p = clean();
  p.debts.push({ id: "cc", name: "Card", kind: "card", balance: 0, apr: 22.99 });
  p.expenses.push({ id: "e2", label: "Groceries", amount: 400, recur: "monthly", fromAcct: "cc" });
  assert.ok(has(runChecks(p, facts()), "nocardpay"));
});

test("a card that is paid, and an unused empty card, are both left alone", () => {
  const p = clean();
  p.debts.push({ id: "cc", name: "Card", kind: "card", balance: 900, apr: 22.99 });
  assert.ok(!has(runChecks(p, facts({ nextCardPay: { cc: { week: 3 } } })), "nocardpay"));

  const q = clean();
  q.debts.push({ id: "cc", name: "Unused card", kind: "card", balance: 0, apr: 22.99 });
  assert.ok(!has(runChecks(q, facts()), "nocardpay"));
});

test("a loan with no payment, and one whose minimum never clears it", () => {
  const p = clean();
  const r = runChecks(p, facts({ loansNoPayment: [{ id: "l1" }] }));
  assert.ok(has(r, "nopay"));

  const q = clean();
  q.debts[0].minPayment = 10;   /* nowhere near 7.75% of $18,500 */
  const r2 = runChecks(q, facts());
  assert.ok(has(r2, "never"), ids(r2));
});

test("payments below the interest they accrue is an error", () => {
  const r = runChecks(clean(), facts({ monthlyDebtPay: 100, monthlyInterest: 120 }));
  assert.equal(r.find((c) => c.id === "interest").level, "error");
  assert.ok(!has(runChecks(clean(), facts({ totalLoans: 0, monthlyDebtPay: 0, monthlyInterest: 0 })), "interest"),
    "no loans means no finding");
});

/* ------------------------------------------------------------------ */
/*  Accounts                                                           */
/* ------------------------------------------------------------------ */
test("a cap under the account's heaviest month is caught, and a workable one isn't", () => {
  const p = clean();
  p.accounts[0].cap = 1000; p.accounts[0].spillTo = "brk";
  assert.ok(has(runChecks(p, facts()), "cap"), "2300 needed against a 1000 cap");

  p.accounts[0].cap = 4000;
  assert.ok(!has(runChecks(p, facts()), "cap"));
});

test("a cap with nowhere to sweep to is caught", () => {
  const p = clean();
  p.accounts[0].cap = 9000;
  const r = runChecks(p, facts());
  assert.ok(has(r, "spill"));
  assert.ok(!has(r, "cap"), "9000 covers the 2300 it has to");
});

/* ------------------------------------------------------------------ */
/*  Retirement                                                         */
/* ------------------------------------------------------------------ */
test("a low survival probability and an uncovered bridge are reported", () => {
  assert.ok(has(runChecks(clean(), facts({ survivalProb: 0.62 })), "survival"));
  assert.ok(!has(runChecks(clean(), facts({ survivalProb: 0.95 })), "survival"));
  assert.ok(has(runChecks(clean(), facts({ bridge: { gap: 42000 } })), "bridge"));
  assert.ok(!has(runChecks(clean(), facts({ bridge: { gap: 0 } })), "bridge"));
});

test("the deferral limit being switched off is only reported when something would hit it", () => {
  const p = clean();
  p.settings.deferralLimit = 0;
  assert.ok(!has(runChecks(p, facts()), "nolimit"), "no contributions, nothing to cap");
  p.income[0].preTax = [{ id: "pt1", name: "401k", mode: "pct", value: 6, toAcct: "brk", capped: true }];
  assert.ok(has(runChecks(p, facts()), "nolimit"));
});

/* ------------------------------------------------------------------ */
/*  Shape and ordering — what the UI relies on                         */
/* ------------------------------------------------------------------ */
test("errors sort ahead of warnings", () => {
  const p = clean();
  p.accounts[0].cap = 100;                       /* warn */
  p.debts.push({ id: "cc", name: "Card", kind: "card", balance: 900, apr: 22.99 });  /* error */
  const r = runChecks(p, facts({ runway: 1 }));
  const firstWarn = r.findIndex((c) => c.level === "warn");
  const lastError = r.map((c) => c.level).lastIndexOf("error");
  assert.ok(lastError < firstWarn, `errors must come first: ${r.map((c) => c.level).join(",")}`);
});

test("every finding carries a tab and a unique id, and any targetId it names exists", () => {
  const p = clean();
  p.accounts = p.accounts.filter((a) => a.id !== "chk");
  p.debts.push({ id: "cc", name: "Card", kind: "card", balance: 900, apr: 22.99 });
  const r = runChecks(p, facts({ runway: 1, survivalProb: 0.5 }));
  assert.ok(r.length > 4);

  const known = new Set([...p.accounts, ...p.debts, ...p.income, ...p.expenses, ...p.transfers, ...p.debtPayments].map((x) => x.id));
  assert.equal(new Set(r.map((c) => c.id)).size, r.length, "ids must be unique — they key the list");
  for (const c of r) {
    assert.ok(["overview", "accounts", "cashflow", "debt", "invest"].includes(c.tab), `${c.id} has tab ${c.tab}`);
    assert.ok(c.title && c.detail && c.fix, `${c.id} must say what's wrong and what to do`);
    /* "take me there" can't point at a row that isn't in the plan */
    if (c.targetId != null) assert.ok(known.has(c.targetId), `${c.id} targets ${c.targetId}, which isn't in the plan`);
  }
});

test("countByLevel and checksFor give the UI what it needs without walking the list", () => {
  const p = clean();
  p.accounts[0].cap = 100;
  p.debts.push({ id: "cc", name: "Card", kind: "card", balance: 900, apr: 22.99 });
  const r = runChecks(p, facts());
  const n = countByLevel(r);
  assert.equal(n.error + n.warn, r.length);
  assert.ok(n.error >= 1 && n.warn >= 1);
  assert.deepEqual(checksFor(r, "cc").map((c) => c.id), ["nocardpay:cc"]);
  assert.deepEqual(checksFor(r, "nothing-here"), []);
  assert.deepEqual(countByLevel([]), { error: 0, warn: 0 });
});
