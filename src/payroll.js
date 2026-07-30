// Per-paycheck gross/net math: salary at a point in time (accounting for raises and
// promotions), 401k/employer-match resolution, and bonus withholding.
import { n0, num, OPY, parseDate } from "./format.js";

/* people know their annual salary, not their per-paycheck gross — accept either */
export const perCheck = (gross, mode, recur) => {
  const g = n0(gross);
  if (mode !== "year") return g;
  const per = OPY[recur] || 0;
  return per > 0 ? g / per : g;
};
export const grossPerCheck = (inc) => perCheck(inc.gross, inc.grossMode, inc.recur);

/* a promotion is a step change: new salary from a date, with the annual raise
   compounding from there rather than from the original start date */
export function salaryAt(inc, at) {
  let amount = n0(inc.amount), gross = grossPerCheck(inc), anchor = parseDate(inc.date), label = null;
  const list = (inc.changes || []).slice().sort((a, b) => parseDate(a.date) - parseDate(b.date));
  for (const ch of list) {
    const d = parseDate(ch.date);
    if (isNaN(d) || d > at) continue;
    amount = n0(ch.amount);
    gross = perCheck(ch.gross, ch.grossMode || inc.grossMode, inc.recur);
    anchor = d; label = ch.label || "Promotion";
  }
  return { amount, gross, anchor, label };
}

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

