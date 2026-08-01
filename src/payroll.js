// Per-paycheck gross/net math: salary at a point in time (accounting for raises and
// promotions), 401k/employer-match resolution, and bonus withholding.
import { n0, num, OPY, parseDate, inflFactor, DAY } from "./format.js";
import { estimateTax } from "./tax.js";

/* people know their annual salary, not their per-paycheck gross — accept either */
export const perCheck = (gross, mode, recur) => {
  const g = n0(gross);
  if (mode !== "year") return g;
  const per = OPY[recur] || 0;
  return per > 0 ? g / per : g;
};
export const grossPerCheck = (inc) => perCheck(inc.gross, inc.grossMode, inc.recur);

/* An income either carries a take-home figure the user typed, or derives one from its
   gross through the bracket tables. Typed stays the default so no saved projection moves
   on its own; `isDerived` is the single place that decision is read. */
export const isDerived = (inc) => !!inc && inc.taxMode === "derived";

/* The full annual picture behind one paycheck, for the engine and the income card alike.
   Pre-tax deductions are resolved first (they cut income tax but not payroll tax), then
   the whole thing is annualised, taxed, and divided back down to a per-paycheck figure. */
export function taxBreakdown(inc, opts, grossOverride) {
  const per = OPY[inc.recur] || 0;
  const gpc = grossOverride != null ? n0(grossOverride) : grossPerCheck(inc);
  if (!(per > 0) || gpc <= 0) return null;
  const employee = payrollOf(inc, gpc).employee;
  const est = estimateTax({
    grossAnnual: gpc * per,
    filing: (opts && opts.filing) || "single",
    preTaxAnnual: employee * per,
    stateRatePct: num(opts && opts.stateRate),
  });
  return { ...est, per, grossPerCheck: gpc, netPerCheck: est.net / per, employeePerCheck: employee };
}

/* take-home per paycheck under the bracket model — 0 when there's nothing to compute */
export function takeHomeOf(inc, opts, grossOverride) {
  const b = taxBreakdown(inc, opts, grossOverride);
  return b ? b.netPerCheck : 0;
}

/* a promotion is a step change: new salary from a date, with the annual raise
   compounding from there rather than from the original start date. Take-home is derived
   from the new gross and a tax rate rather than typed by hand — nobody knows their new
   take-home the moment they're told a new salary.

   `opts.inflation` (with `opts.start` as today) deflates a promotion's salary back into
   today's dollars: "the next level pays $140k" is a figure quoted in the money of the year
   it happens, and the projection runs in today's money. Omit both and nothing is deflated,
   which is what every caller outside the engine wants. */
export function salaryAt(inc, at, opts) {
  const infl = num(opts && opts.inflation);
  const start = opts && opts.start;
  const derived = isDerived(inc);
  let amount = derived ? takeHomeOf(inc, opts) : n0(inc.amount);
  let gross = grossPerCheck(inc), anchor = parseDate(inc.date), label = null;
  const list = (inc.changes || []).slice().sort((a, b) => parseDate(a.date) - parseDate(b.date));
  for (const ch of list) {
    const d = parseDate(ch.date);
    if (isNaN(d) || d > at) continue;
    gross = perCheck(ch.gross, ch.grossMode || inc.grossMode, inc.recur);
    if (infl && start) gross /= inflFactor(infl, Math.max(0, (d - start) / DAY / 7));
    if (derived) {
      /* a promoted salary needs no tax rate of its own — the brackets already know what
         a bigger gross costs, including the part of it that lands in a higher band */
      amount = takeHomeOf(inc, opts, gross);
    } else {
      const employee = payrollOf(inc, gross).employee;
      const rate = ch.taxRate != null ? num(ch.taxRate) : effectiveTaxRate(inc);
      amount = Math.max(0, gross * (1 - rate / 100) - employee);
    }
    anchor = d; label = ch.label || "Promotion";
  }
  return { amount, gross, anchor, label };
}

/* the same income list with every planned promotion removed, for projecting the "if
   nothing improves" baseline alongside the real one. Everything else about each income
   — salary today, raise, bonus, deductions, splits — is left exactly as it is. */
export const hasPromotions = (income) => (income || []).some((x) => (x.changes || []).length > 0);
export const withoutPromotions = (income) => (income || []).map((x) => ((x.changes || []).length ? { ...x, changes: [] } : x));

/* one place that resolves a paycheck's deductions, so the engine and the UI can't disagree */
export function payrollOf(inc, grossOverride) {
  const gross = grossOverride != null ? grossOverride : grossPerCheck(inc);
  const rows = (inc.preTax || []).map((pt) => {
    const amount = pt.mode === "pct" ? gross * num(pt.value) / 100 : n0(pt.value);
    return { ...pt, amount };
  });
  const matchable = rows.reduce((s, r) => s + (r.counts !== false ? r.amount : 0), 0);
  const employee = rows.reduce((s, r) => s + r.amount, 0);
  let match = 0;
  const mt = inc.match;
  if (mt && gross > 0 && n0(mt.rate) > 0 && matchable > 0) {
    match = Math.min(matchable, gross * num(mt.limit) / 100) * n0(mt.rate) / 100;
  }
  return { gross, rows, employee, match, total: employee + match, matchable };
}

/* the withholding rate implied by today's gross and take-home — used to prefill a new
   promotion's tax rate, since it's the best guess for what a raise will withhold too */
export function effectiveTaxRate(inc) {
  const pay = payrollOf(inc);
  if (!(pay.gross > 0)) return 0;
  return ((pay.gross - n0(inc.amount) - pay.employee) / pay.gross) * 100;
}

/* a bonus quoted as "10% of salary" should track the salary, including its raises.
   Percentage 401k elections apply to it; flat-dollar deductions don't. */
export function bonusOf(inc, growth, grossOverride) {
  const bn = inc && inc.bonus;
  if (!bn || !(n0(bn.value) > 0)) return null;
  const g = growth == null ? 1 : growth;
  const base = grossOverride != null ? grossOverride : grossPerCheck(inc);
  const annualGross = base * (OPY[inc.recur] || 0) * g;
  const gross = bn.mode === "amt" ? n0(bn.value) * g : annualGross * num(bn.value) / 100;
  let deferral = 0, matchable = 0;
  if (bn.preTaxApplies !== false) {
    for (const pt of (inc.preTax || [])) {
      if (pt.mode !== "pct") continue;
      const p = gross * num(pt.value) / 100;
      deferral += p;
      if (pt.counts !== false) matchable += p;
    }
  }
  let match = 0;
  const mt = inc.match;
  if (mt && gross > 0 && n0(mt.rate) > 0 && matchable > 0) {
    match = Math.min(matchable, gross * num(mt.limit) / 100) * n0(mt.rate) / 100;
  }
  const withheld = gross * num(bn.withhold) / 100;
  const net = Math.max(0, gross - withheld - deferral);
  return { gross, deferral, match, withheld, net };
}

