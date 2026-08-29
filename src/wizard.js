// A few questions, turned into a plan.
//
// The alternative to editing the seed data. Pure logic, no React — it takes an answer
// sheet and returns exactly the shapes seeds.js produces, which the component then hands
// to the existing `applyPlan`. That's deliberate: applyPlan already runs normAccounts,
// normDebts, normIncome and normExpenses and merges settings onto seedSettings(), so the
// wizard gets every migration and backfill for free and cannot emit a half-normalised
// plan. Nothing here writes to storage or decides anything about the UI.
//
// The form that collects the answers is src/wizard-form.jsx — a separate basename on
// purpose, since a hand-written `foo.js` and a `foo.jsx` would compile over each other.
import { uid, n0, num, todayISO, nextFirstISO, ACCT_TYPES, CATEGORIES } from "./format.js";
import { seedSettings } from "./seeds.js";

const rateOf = (type) => (ACCT_TYPES.find((t) => t.v === type) || {}).rate || 0;

/* The four things it asks about, in order. Exported so the form and its tests agree on the
   sequence rather than each hard-coding it. */
export const STEPS = [
  { v: "you", title: "You", sub: "what you earn, and how you're taxed" },
  { v: "have", title: "What you have", sub: "accounts, and anything you own outright" },
  { v: "owe", title: "What you owe", sub: "loans, cards, a mortgage" },
  { v: "spend", title: "What you spend", sub: "living costs, and what you invest" },
  { v: "review", title: "Review", sub: "what this would create, and what it projects" },
];

/* What kinds of debt the third step offers. `secures` names the asset a debt of that kind
   is a lien against, which is what wires up `securedBy` without asking a second question:
   nobody thinks of "my mortgage" and "the thing my mortgage is secured on" separately. */
export const DEBT_KINDS = [
  { v: "loan", label: "Loan", kind: "loan" },
  { v: "card", label: "Credit card", kind: "card" },
  { v: "mortgage", label: "Mortgage", kind: "loan", secures: "home" },
  { v: "auto", label: "Car loan", kind: "loan", secures: "vehicle" },
];

export const emptyDebt = () => ({ id: uid(), name: "", balance: "", apr: "", minPayment: "", type: "loan" });

/* Everything starts empty rather than pre-filled with plausible figures: a wizard that
   guesses your salary produces a plan you didn't write and can't tell apart from one you
   did. Only the structural choices carry defaults. */
export const emptyAnswers = () => ({
  payMode: "gross", gross: "", takeHome: "", recur: "biweekly",
  filing: "single", stateRate: "", birthYear: "",
  retirePct: "", matchPct: "",
  checking: "", savings: "", brokerage: "", retirement: "",
  home: "", vehicle: "",
  debts: [emptyDebt()],
  spendMode: "total", monthlySpend: "", categories: {},
  investMonthly: "",
});

/* A step is "done" when it has the one figure the projection can't do without. Everything
   else is optional, because a plan with no car loan is a complete plan. */
export function stepReady(step, a) {
  const ans = a || {};
  if (step === "you") return ans.payMode === "gross" ? n0(ans.gross) > 0 : n0(ans.takeHome) > 0;
  if (step === "have") return n0(ans.checking) + n0(ans.savings) + n0(ans.brokerage) + n0(ans.retirement) + n0(ans.home) + n0(ans.vehicle) > 0;
  if (step === "owe") return true;      /* owing nothing is an answer */
  if (step === "spend") return spendRows(ans).length > 0;
  return true;
}

/* The spending answers as concrete rows, whichever way they were given. One shared helper
   so the review count and the built plan can't disagree about how many expenses there are. */
export function spendRows(a) {
  const ans = a || {};
  if (ans.spendMode === "categories") {
    return CATEGORIES
      .map((c) => ({ label: c.label, category: c.v, amount: n0((ans.categories || {})[c.v]) }))
      .filter((r) => r.amount > 0);
  }
  const total = n0(ans.monthlySpend);
  return total > 0 ? [{ label: "Living costs", category: "other", amount: total }] : [];
}

/**
 * Turn an answer sheet into a plan.
 *
 * Emits the same shapes seeds.js does, and nothing more — no scenarios, no snapshots, no
 * payments log. Accounts with no balance are left out entirely rather than created empty,
 * with the one exception of checking: money has to land somewhere, and every expense,
 * transfer and payment below points at it.
 *
 * @param {object} answers - see emptyAnswers()
 * @returns {object} { accounts, debts, income, expenses, transfers, debtPayments, payments, settings }
 */
export function buildPlan(answers) {
  const a = answers || {};
  const accounts = [];
  const push = (name, type, balance, extra) => {
    const id = uid();
    accounts.push({ id, name, type, balance: n0(balance), rate: rateOf(type), ...(extra || {}) });
    return id;
  };

  /* checking always exists, even at zero — it's the account everything else points at */
  const chk = push("Checking", "checking", a.checking);
  const sav = n0(a.savings) > 0 ? push("Savings", "savings", a.savings) : null;
  const brk = n0(a.brokerage) > 0 ? push("Brokerage", "brokerage", a.brokerage) : null;
  const ret = n0(a.retirement) > 0 ? push("Retirement", "retirement", a.retirement) : null;
  const home = n0(a.home) > 0 ? push("Home", "home", a.home) : null;
  const vehicle = n0(a.vehicle) > 0 ? push("Vehicle", "vehicle", a.vehicle) : null;

  /* where each kind of money goes when the account it would prefer doesn't exist */
  const invest = brk || ret || sav || chk;
  const retire = ret || brk || chk;
  const secures = { home, vehicle };

  const debts = [];
  const debtPayments = [];
  for (const row of a.debts || []) {
    const bal = n0(row.balance);
    if (bal <= 0) continue;
    const kind = DEBT_KINDS.find((k) => k.v === row.type) || DEBT_KINDS[0];
    const id = uid();
    const name = String(row.name || "").trim() || kind.label;
    debts.push({
      id, name, kind: kind.kind, balance: bal, originalBalance: bal,
      apr: n0(row.apr), minPayment: n0(row.minPayment),
      interestFrom: todayISO(),
      /* a mortgage with no home entered is just a loan — better than a lien pointing at
         an account that was never created, which checks.js would (rightly) flag */
      securedBy: (kind.secures && secures[kind.secures]) || "",
    });
    const pay = n0(row.minPayment);
    if (pay > 0 || kind.kind === "card") {
      debtPayments.push({
        id: uid(), name: name + " payment",
        /* a card is paid in full by default, which is the only way to owe nothing on one */
        amount: kind.kind === "card" ? 0 : pay, payFull: kind.kind === "card",
        date: nextFirstISO(), recur: "monthly", fromAcct: chk, toDebt: id,
      });
    }
  }

  /* Gross plus a filing status is enough for the bracket tables to work out take-home, so
     that's the mode this offers first — it's also the only mode in which a raise is priced
     correctly, since part of an increase can land in a higher band. Someone who only knows
     what lands in their account can say that instead and nothing is derived. */
  const derived = a.payMode === "gross" && n0(a.gross) > 0;
  const preTax = n0(a.retirePct) > 0
    ? [{ id: uid(), name: "401k contribution", mode: "pct", value: n0(a.retirePct), toAcct: retire, counts: true, capped: true }]
    : [];
  const income = [{
    id: uid(), name: "Take-home pay",
    amount: derived ? 0 : n0(a.takeHome),
    gross: derived ? n0(a.gross) : 0, grossMode: "year",
    taxMode: derived ? "derived" : "typed",
    date: todayISO(), recur: a.recur || "biweekly", raise: 3, weekdayAdj: true,
    dist: [{ acctId: chk }],
    preTax,
    match: n0(a.matchPct) > 0 ? { rate: 100, limit: n0(a.matchPct), toAcct: retire } : null,
  }];

  const expenses = spendRows(a).map((r) => ({
    id: uid(), label: r.label, category: r.category, amount: r.amount,
    date: nextFirstISO(), recur: "monthly", fromAcct: chk,
  }));

  const transfers = n0(a.investMonthly) > 0
    ? [{ id: uid(), name: "Auto-invest", amount: n0(a.investMonthly), date: nextFirstISO(), recur: "monthly", fromAcct: chk, toAcct: invest }]
    : [];

  return {
    accounts, debts, income, expenses, transfers, debtPayments, payments: [],
    settings: {
      ...seedSettings(),
      filing: a.filing || "single",
      stateRate: num(a.stateRate),
      birthYear: n0(a.birthYear) > 0 ? n0(a.birthYear) : "",
      overflowTo: invest,
    },
  };
}

/* What the review step counts up, so it can say what's about to be created before anything
   is. Read off the built plan rather than the answers, so it can't promise a row the
   builder then drops. */
export function summarize(plan) {
  const p = plan || {};
  return [
    [(p.accounts || []).length, "account"],
    [(p.debts || []).length, "debt"],
    [(p.expenses || []).length, "expense"],
    [(p.transfers || []).length, "transfer"],
  ].filter(([n]) => n > 0).map(([n, word]) => `${n} ${word}${n === 1 ? "" : "s"}`);
}
