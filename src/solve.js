// Running the projection in reverse: goal seek ("what would it take?") and sensitivity
// ("what actually moves the answer?"). Both are the same shape — build a modified input,
// run it, read one number — so they share a module. Pure JS, no React and no DOM, so this
// runs in src/worker.js, inline as a fallback, and directly in Node tests.
import { n0, num, OPY, WPY, isoDate, parseDate, DAY } from "./format.js";
import { WEEKS } from "./engine.js";
import { project } from "./project.js";

const startOf = (input) => (input.start instanceof Date ? input.start : new Date(input.start));
const monthly = (x) => n0(x.amount) * (OPY[x.recur] || 0) / 12;

/* spread a monthly change across items in proportion to what each already costs, so
   "spend $200/mo less" doesn't zero the smallest line and leave the rest untouched */
const scaleBy = (list, factor) => (list || []).map((x) => ({ ...x, amount: Math.max(0, n0(x.amount) * factor) }));

/* ================================================================== */
/*  What you can change                                                */
/* ================================================================== */

/* `apply` returns a modified copy, never a mutation — the solver reuses the original input
   on every iteration. `direction` is what the search is looking for: the *least* you'd have
   to put in, or the *most* you could get away with. */
export const KNOBS = [
  {
    v: "extraDebt", label: "Extra toward debt", unit: "$/mo", max: 20000, direction: "min",
    current: (input) => (input.debtPayments || []).filter((p) => /extra/i.test(p.name || "")).reduce((s, p) => s + monthly(p), 0),
    apply: (input, amount) => {
      const list = input.debtPayments || [];
      const extra = list.find((p) => /extra/i.test(p.name || ""));
      if (extra) return { ...input, debtPayments: list.map((p) => (p === extra ? { ...p, amount, recur: "monthly" } : p)) };
      /* no "extra" line to grow, so add one aimed at the first loan the plan is paying */
      const target = (input.debts || []).filter((d) => d.kind !== "card" && n0(d.balance) > 0)[0];
      if (!target) return input;
      const from = (input.accounts || []).find((a) => a.type === "checking") || (input.accounts || [])[0] || {};
      return {
        ...input,
        debtPayments: [...list, { id: "solve-extra", name: "Extra toward payoff", amount, date: isoDate(startOf(input)), recur: "monthly", fromAcct: from.id, toDebt: target.id }],
      };
    },
  },
  {
    v: "invest", label: "Monthly investing", unit: "$/mo", max: 20000, direction: "min",
    current: (input) => (input.transfers || []).reduce((s, t) => s + monthly(t), 0),
    apply: (input, amount) => {
      const list = input.transfers || [];
      if (!list.length) {
        const from = (input.accounts || []).find((a) => a.type === "checking") || (input.accounts || [])[0] || {};
        const to = (input.accounts || []).find((a) => a.type === "brokerage" || a.type === "retirement");
        if (!to) return input;
        return { ...input, transfers: [{ id: "solve-invest", name: "Investing", amount, date: isoDate(startOf(input)), recur: "monthly", fromAcct: from.id, toAcct: to.id }] };
      }
      const total = list.reduce((s, t) => s + monthly(t), 0);
      return { ...input, transfers: total > 0 ? scaleBy(list, amount / total) : list.map((t, i) => (i === 0 ? { ...t, amount, recur: "monthly" } : t)) };
    },
  },
  {
    v: "spend", label: "Monthly spending", unit: "$/mo", max: 40000, direction: "max",
    /* Not zero: with no spending at all the independence target is $0, so there is nothing
       to be independent *of* and the projection reports no FI date — a degenerate lower
       bound that would make every search look unreachable. A tenth of today's spending is
       a floor no real plan goes below. */
    min: (input) => Math.max(200, (input.expenses || []).reduce((s, e) => s + monthly(e), 0) * 0.1),
    current: (input) => (input.expenses || []).reduce((s, e) => s + monthly(e), 0),
    apply: (input, amount) => {
      const list = input.expenses || [];
      const total = list.reduce((s, e) => s + monthly(e), 0);
      return { ...input, expenses: total > 0 ? scaleBy(list, amount / total) : list };
    },
  },
];

/* ================================================================== */
/*  What you can aim at                                                */
/* ================================================================== */

/* `atMost` says which side of the goal counts as meeting it: a date you want to arrive on
   or before, a percentage you want to be at or above. */
/* `tol` is how close the confirmation run has to land to count as solved: a week for a
   date, and a percentage point for survival — which is well inside the sampling noise of a
   few hundred Monte Carlo trials, so demanding more would be false precision. */
export const TARGETS = [
  { v: "debtFree", label: "Debt-free by", kind: "date", atMost: true, tol: 1, measure: (r) => (r.sim.debtFree == null ? Infinity : r.sim.debtFree) },
  { v: "fi", label: "Financially independent by", kind: "date", atMost: true, tol: 1, measure: (r) => (r.sim.fire == null ? Infinity : r.sim.fire) },
  { v: "survival", label: "Chance the money lasts", kind: "percent", atMost: false, tol: 1, measure: (r) => (r.mc ? r.mc.survivalProb * 100 : 0) },
];

export const knobOf = (v) => KNOBS.find((k) => k.v === v) || KNOBS[0];
export const targetOf = (v) => TARGETS.find((t) => t.v === v) || TARGETS[0];
export const weekOf = (date, start) => Math.max(0, Math.round((parseDate(date) - start) / DAY / 7));

/* ================================================================== */
/*  Goal seek                                                          */
/* ================================================================== */

/**
 * Binary-search a knob for the amount that meets a target.
 *
 * Monotonicity is assumed: more toward debt never delays debt-free, more invested never
 * delays independence, more spending never improves survival. Where a pairing doesn't move
 * the answer at all — investing more won't clear a loan sooner — the search says so through
 * `hit` and `reason` rather than returning a bound dressed up as an answer.
 *
 * @returns {{amount:number, achieved:number, hit:boolean, runs:number, reason:string}}
 */
export function goalSeek({ input, knob, target, value, iterations = 18, searchTrials = 80 }) {
  const k = typeof knob === "string" ? knobOf(knob) : knob;
  const t = typeof target === "string" ? targetOf(target) : target;
  const start = startOf(input);
  const goal = t.kind === "date" ? weekOf(value, start) : num(value);

  /* A date target only needs a horizon a little past the date asked about, and trimming it
     is worth far more than shaving iterations: a run costs ~9ms at 260 weeks against ~87ms
     at the full 2080. Survival needs the whole horizon, and the Monte Carlo with it. */
  const horizon = t.kind === "date" ? Math.min(WEEKS, Math.max(104, Math.round(goal * 1.35) + 52)) : WEEKS;
  const needsMc = t.v === "survival";

  let runs = 0;
  const measure = (amount) => {
    runs++;
    const modified = k.apply(input, amount);
    return t.measure(project({
      ...modified,
      weeks: horizon,
      /* fewer trials while searching; the winner is re-run at full fidelity below */
      settings: needsMc ? { ...modified.settings, mcTrials: searchTrials } : modified.settings,
    }));
  };
  const meets = (m) => (t.atMost ? m <= goal : m >= goal);
  const done = (amount, achieved, hit, reason) => ({ amount, achieved, hit, runs, reason, horizon });

  const floor = typeof k.min === "function" ? k.min(input) : n0(k.min);
  const atFloor = measure(floor);
  const atMax = measure(k.max);

  /* Some pairings simply don't interact: cutting spending doesn't clear a loan sooner,
     because the money it frees piles up in checking rather than going to the debt. Saying
     so is far more useful than reporting the bound as if it were an answer.

     When both ends land on "never", though, the trimmed horizon has hidden the difference
     between a knob that does nothing and a goal that's merely too early — so that one case
     re-measures both ends on the full run to tell them apart. */
  if (atFloor === atMax) {
    if (isFinite(atFloor)) return done(floor, atFloor, false, "noEffect");
    const full = (amount) => { runs++; return t.measure(project(k.apply(input, amount))); };
    const fullFloor = full(floor), fullMax = full(k.max);
    if (fullFloor === fullMax) return done(floor, fullFloor, false, "noEffect");
    return done(k.max, fullMax, false, "unreachable");
  }

  let lo = floor, hi = k.max;
  if (k.direction === "min") {
    /* the least you'd have to put in */
    if (meets(atFloor)) return done(floor, atFloor, true, "already");
    if (!meets(atMax)) return done(k.max, atMax, false, "unreachable");
    for (let i = 0; i < iterations; i++) {
      const mid = (lo + hi) / 2;
      if (meets(measure(mid))) hi = mid; else lo = mid;
    }
    return confirm(k, t, input, hi, goal, runs, horizon);
  }
  /* the most you could get away with */
  if (!meets(atFloor)) return done(floor, atFloor, false, "unreachable");
  if (meets(atMax)) return done(k.max, atMax, true, "anything");
  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    if (meets(measure(mid))) lo = mid; else hi = mid;
  }
  return confirm(k, t, input, lo, goal, runs, horizon);
}

/* re-run the answer on the real settings — full horizon, full Monte Carlo — because the
   search may have run trimmed or at reduced trials */
function confirm(k, t, input, amount, goal, runs, horizon) {
  const achieved = t.measure(project(k.apply(input, amount)));
  const tol = t.tol == null ? 1 : t.tol;
  const hit = t.atMost ? achieved <= goal + tol : achieved >= goal - tol;
  return { amount, achieved, hit, runs: runs + 1, reason: hit ? "solved" : "approximate", horizon };
}

/* ================================================================== */
/*  Sensitivity                                                        */
/* ================================================================== */

/* One step of each input, in the direction a user would think of as an improvement,
   measured against the independence date. The point is the ordering: which of these is
   worth arguing about, and which isn't. */
export const FACTORS = [
  { v: "return", label: "Investment return +1pt", apply: (i) => ({ ...i, accounts: i.accounts.map((a) => ({ ...a, rate: n0(a.rate) > 0 ? n0(a.rate) + 1 : a.rate })) }) },
  { v: "inflation", label: "Inflation +1pt", apply: (i) => ({ ...i, settings: { ...i.settings, inflation: num(i.settings.inflation) + 1 } }) },
  { v: "spend", label: "Spending −$200/mo", apply: (i) => knobOf("spend").apply(i, Math.max(0, knobOf("spend").current(i) - 200)) },
  { v: "invest", label: "Investing +$200/mo", apply: (i) => knobOf("invest").apply(i, knobOf("invest").current(i) + 200) },
  { v: "raise", label: "Annual raise +1pt", apply: (i) => ({ ...i, income: i.income.map((x) => ({ ...x, raise: num(x.raise) + 1 })) }) },
  { v: "withdrawal", label: "Withdrawal rate +0.5pt", apply: (i) => ({ ...i, settings: { ...i.settings, withdrawalRate: num(i.settings.withdrawalRate) + 0.5 } }) },
  { v: "debt", label: "Extra $200/mo toward debt", apply: (i) => knobOf("extraDebt").apply(i, knobOf("extraDebt").current(i) + 200) },
];

/**
 * @returns {{rows: Array<{v,label,weeks,months,fire,reached}>, baseFire, baseReached}}
 *   `weeks` is how far the independence date moves — negative is sooner, which is better.
 */
export function tornado({ input, factors = FACTORS }) {
  const base = project(input);
  const baseFire = base.sim.fire;
  const cap = (w) => (w == null ? WEEKS : w);
  const rows = factors.map((f) => {
    const r = project(f.apply(input));
    const weeks = cap(r.sim.fire) - cap(baseFire);
    return { v: f.v, label: f.label, weeks, months: weeks / (WPY / 12), fire: r.sim.fire, reached: r.sim.fire != null };
  });
  rows.sort((a, b) => Math.abs(b.weeks) - Math.abs(a.weeks));
  return { rows, baseFire, baseReached: baseFire != null };
}
