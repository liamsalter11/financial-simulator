// One place that knows what's wrong with a plan.
//
// These conditions used to live inline in whichever tab happened to display them — thirteen
// of them, each its own copy of the test. That has two costs: a problem on a tab you aren't
// looking at is invisible, and the same condition written twice eventually says two
// different things. So the conditions move here, and both the summary list and the inline
// markers read the same array.
//
// Pure logic, no React. It takes the plan and a small, explicit set of facts the projection
// has already worked out — rather than the whole `D` memo — so the dependency is honest and
// a test fixture is a handful of numbers instead of a simulation.
import { n0, num, parseDate } from "./format.js";
import { minPaymentOf, monthsToPayoff } from "./loan.js";

export const LEVELS = { error: 0, warn: 1 };

/**
 * @param {object} plan   - { accounts, debts, income, expenses, transfers, debtPayments, settings }
 * @param {object} facts  - what the projection already knows:
 *   { surplus, leftover, runway, monthlyInterest, monthlyDebtPay, totalLoans,
 *     negAcct, worstMonthOut(id), nextCardPay, loansNoPayment, deferralNotes,
 *     survivalProb, bridge }
 * @returns {Array<{id,level,tab,targetId,title,detail,fix}>} errors first, then warnings
 */
export function runChecks(plan = {}, facts = {}) {
  const accounts = plan.accounts || [], debts = plan.debts || [], income = plan.income || [];
  const expenses = plan.expenses || [], transfers = plan.transfers || [], debtPayments = plan.debtPayments || [];
  const settings = plan.settings || {};
  const out = [];
  const add = (level, tab, targetId, id, title, detail, fix) => out.push({ id, level, tab, targetId, title, detail, fix });

  const acctIds = new Set(accounts.map((a) => a.id));
  const debtIds = new Set(debts.map((d) => d.id));
  const nameOf = (id) => (accounts.find((a) => a.id === id) || debts.find((d) => d.id === id) || {}).name;
  const cards = debts.filter((d) => d.kind === "card");
  const loans = debts.filter((d) => d.kind !== "card");

  /* ---------------------------------------------------------------- */
  /*  Dangling references                                              */
  /* ---------------------------------------------------------------- */
  /* Deleting an account or a debt doesn't cascade, so anything that pointed at it is still
     there pointing at nothing — money that silently stops moving, with no sign on screen. */
  const a = (w) => (/^[aeiou]/i.test(w) ? "an " : "a ") + w;
  const orphan = (row, field, set, kind, tab, what) => {
    const id = row[field];
    if (!id || set.has(id)) return;
    add("error", tab, row.id, `orphan:${row.id}:${field}`,
      `“${row.label || row.name || what}” points at ${a(kind)} that no longer exists`,
      `It was deleted, and this ${what} went with it — the projection can't move money to or from something that isn't there, so it does nothing at all.`,
      `Pick ${a(kind)} for it, or delete the row.`);
  };
  for (const e of expenses) orphan(e, "fromAcct", new Set([...acctIds, ...debts.filter((d) => d.kind === "card").map((d) => d.id)]), "account or card", "cashflow", "expense");
  for (const t of transfers) { orphan(t, "fromAcct", acctIds, "account", "cashflow", "transfer"); orphan(t, "toAcct", acctIds, "account", "cashflow", "transfer"); }
  for (const p of debtPayments) { orphan(p, "fromAcct", acctIds, "account", "cashflow", "payment"); orphan(p, "toDebt", debtIds, "debt", "cashflow", "payment"); }
  for (const inc of income) {
    for (const s of inc.dist || []) {
      if (s.acctId && !acctIds.has(s.acctId)) {
        add("error", "cashflow", inc.id, `orphan:${inc.id}:dist`,
          `“${inc.name || "Income"}” is split into an account that no longer exists`,
          "That share of every paycheck has nowhere to land.",
          "Point the split at an account you still have, or remove it.");
        break;
      }
    }
    for (const p of inc.preTax || []) {
      if (p.toAcct && !acctIds.has(p.toAcct)) {
        add("error", "cashflow", inc.id, `orphan:${inc.id}:pretax:${p.id}`,
          `“${p.name || "Contribution"}” pays into an account that no longer exists`,
          "The contribution still leaves your gross, but never arrives anywhere.",
          "Point it at an account, or remove the deduction.");
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Things that will run out of money                                */
  /* ---------------------------------------------------------------- */
  if (num(facts.surplus) < 0) {
    add("error", "cashflow", null, "surplus",
      "You're spending more than you earn",
      `Living costs run ${fmt(-num(facts.surplus))} a month past take-home, before any debt payment or investing. Every projection below is drawn from that.`,
      "Lower an expense, or raise take-home on the Cash flow tab.");
  } else if (num(facts.leftover) < 0) {
    add("warn", "cashflow", null, "leftover",
      "Debt payments and investing exceed your surplus",
      `They come to ${fmt(-num(facts.leftover))} a month more than is left after living costs, so cash draws down over time.`,
      "Reduce a transfer or an extra payment, or accept the drawdown while it lasts.");
  }
  if (facts.negAcct) {
    add("error", "accounts", facts.negAcctId || null, "negative",
      `“${facts.negAcct}” runs dry`,
      "At some point in the projection this account goes negative — the plan is asking it for money it doesn't have.",
      "Move something that draws on it to another account, or route more of your income here.");
  }
  if (facts.runway != null && num(facts.runway) < 3) {
    add("warn", "overview", null, "runway",
      "Thin cash runway",
      `Cash and savings cover ${Math.round(num(facts.runway) * 10) / 10} months of spending with no income at all. Three to six months is the usual floor before investing harder.`,
      "Build the buffer before increasing what you invest each month.");
  }

  /* ---------------------------------------------------------------- */
  /*  Debt                                                             */
  /* ---------------------------------------------------------------- */
  if (num(facts.totalLoans) > 0 && num(facts.monthlyDebtPay) <= num(facts.monthlyInterest) + 1e-9) {
    add("error", "debt", null, "interest",
      "Your payments don't cover the interest",
      `Loans accrue about ${fmt(num(facts.monthlyInterest))} a month and you're paying ${fmt(num(facts.monthlyDebtPay))}. The balances grow no matter how long you keep this up.`,
      "Raise a payment on the Cash flow tab until it clears the interest.");
  }
  for (const l of loans) {
    if (n0(l.balance) <= 0) continue;
    if ((facts.loansNoPayment || []).some((x) => x.id === l.id)) {
      add("error", "cashflow", l.id, `nopay:${l.id}`,
        `“${l.name}” has no payment`,
        "Nothing on the Cash flow tab sends money at this loan, so it only accrues.",
        "Add a payment for it.");
    } else if (monthsToPayoff(l.balance, l.apr, minPaymentOf(l)) == null) {
      add("warn", "debt", l.id, `never:${l.id}`,
        `“${l.name}” never clears at its minimum`,
        `${fmt(minPaymentOf(l))} a month doesn't cover ${n0(l.apr)}% on ${fmt(n0(l.balance))}. The minimum alone would run forever.`,
        "Raise the minimum, or make sure the payoff order reaches this one.");
    }
  }
  for (const c of cards) {
    if (facts.nextCardPay && facts.nextCardPay[c.id]) continue;
    const charged = (expenses || []).some((e) => e.fromAcct === c.id);
    if (n0(c.balance) > 0 || charged) {
      add("error", "cashflow", c.id, `nocardpay:${c.id}`,
        `“${c.name}” has no payment`,
        n0(c.balance) > 0
          ? `A card with a balance and no payment carries it forever, at ${n0(c.apr)}%.`
          : "Expenses are charged to this card and nothing ever pays it off, so the balance only grows.",
        "Add a payment for it — “pay in full” clears whatever was charged that month.");
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Accounts                                                         */
  /* ---------------------------------------------------------------- */
  for (const a of accounts) {
    const capOn = a.cap !== "" && a.cap != null && n0(a.cap) > 0;
    if (!capOn) continue;
    const need = typeof facts.worstMonthOut === "function" ? num(facts.worstMonthOut(a.id)) : 0;
    if (n0(a.cap) < need) {
      add("warn", "accounts", a.id, `cap:${a.id}`,
        `“${a.name}” is capped below what it has to cover`,
        `Its heaviest month costs ${fmt(need)} and the cap sweeps everything above ${fmt(n0(a.cap))} away, so it will overdraw.`,
        `Raise the cap past ${fmt(need)}, or move something that draws on it elsewhere.`);
    }
    if (!a.spillTo) {
      add("warn", "accounts", a.id, `spill:${a.id}`,
        `“${a.name}” has a cap but nowhere to sweep to`,
        "Money above the cap has no destination, so the cap does nothing.",
        "Pick an account or a debt for the overflow.");
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Income                                                           */
  /* ---------------------------------------------------------------- */
  for (const inc of income) {
    const take = n0(inc.amount);
    const fixed = (inc.dist || []).slice(1).filter((s) => s.mode === "amt").reduce((s, x) => s + n0(x.value), 0);
    if (take > 0 && fixed > take) {
      add("warn", "cashflow", inc.id, `split:${inc.id}`,
        `“${inc.name || "Income"}” is split for more than it pays`,
        `Fixed splits come to ${fmt(fixed)} against ${fmt(take)} of take-home, so the first account receives nothing and the last splits are short.`,
        "Lower a fixed split, or make it a percentage instead.");
    }
    const pct = (inc.dist || []).slice(1).filter((s) => s.mode !== "amt").reduce((s, x) => s + num(x.value), 0);
    if (pct > 100) {
      add("warn", "cashflow", inc.id, `pct:${inc.id}`,
        `“${inc.name || "Income"}” splits more than 100%`,
        `The percentage splits add up to ${Math.round(pct)}%.`,
        "Bring them back under 100 so something is left for the first account.");
    }
  }
  for (const note of facts.deferralNotes || []) {
    if (!note || !note.hit) continue;
    add("warn", "cashflow", note.id, `deferral:${note.id}`,
      `“${note.name || "Income"}” hits the annual contribution limit early`,
      note.forfeited > 0
        ? `Contributions stop partway through the year, and a match paid per paycheck stops with them — about ${fmt(note.forfeited)} of employer match is forfeited unless your plan trues up.`
        : "Contributions stop partway through the year and start again in January.",
      "Spread the contribution across the year, or check whether your plan trues the match up.");
  }
  if (num(settings.deferralLimit) <= 0 && income.some((i) => (i.preTax || []).some((p) => p.capped !== false))) {
    add("warn", "cashflow", null, "nolimit",
      "The annual contribution limit is switched off",
      "Contributions marked as counting toward the limit will run all year without stopping, which no real 401(k) does.",
      "Set the limit on the Cash flow tab, or mark those contributions as not counting.");
  }

  /* ---------------------------------------------------------------- */
  /*  Dates and self-references                                        */
  /* ---------------------------------------------------------------- */
  for (const [rows, tab, kind] of [[expenses, "cashflow", "expense"], [transfers, "cashflow", "transfer"], [debtPayments, "cashflow", "payment"]]) {
    for (const r of rows) {
      if (!r.end) continue;
      const s = parseDate(r.date), e = parseDate(r.end);
      if (!isNaN(s) && !isNaN(e) && e < s) {
        add("warn", tab, r.id, `dates:${r.id}`,
          `“${r.label || r.name || kind}” ends before it starts`,
          "It never fires, so it isn't in the projection at all.",
          "Fix the end date, or clear it to let it run forever.");
      }
    }
  }
  for (const t of transfers) {
    if (t.fromAcct && t.fromAcct === t.toAcct) {
      add("warn", "cashflow", t.id, `loop:${t.id}`,
        `“${t.name || "Transfer"}” moves money to the account it came from`,
        "It cancels itself out.",
        `Pick a different destination${nameOf(t.fromAcct) ? ` than ${nameOf(t.fromAcct)}` : ""}.`);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Retirement                                                       */
  /* ---------------------------------------------------------------- */
  if (facts.survivalProb != null && num(facts.survivalProb) < 0.8) {
    add("warn", "invest", null, "survival",
      "The money runs out in a lot of the runs",
      `Only ${Math.round(num(facts.survivalProb) * 100)}% of the randomized runs finish with anything left. That's sequence-of-returns risk, which the single-line projection can't show.`,
      "Retire later, spend less, or lower the withdrawal rate on the Invest tab.");
  }
  if (facts.bridge && num(facts.bridge.gap) > 0) {
    add("warn", "invest", null, "bridge",
      "Not enough is reachable before 59½",
      `Independence lands before retirement accounts open, and you're ${fmt(num(facts.bridge.gap))} short outside them.`,
      "Move some contributions to a taxable account, or plan to stop later.");
  }

  /* errors first — a dangling reference is silently wrong, a thin runway is only a caution */
  return out.sort((a, b) => LEVELS[a.level] - LEVELS[b.level]);
}

const fmt = (n) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");

/* the two things the UI wants to know without walking the list itself */
export const countByLevel = (checks) => (checks || []).reduce((a, c) => ({ ...a, [c.level]: (a[c.level] || 0) + 1 }), { error: 0, warn: 0 });
export const checksFor = (checks, targetId) => (checks || []).filter((c) => c.targetId === targetId);
