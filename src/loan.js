// Amortization math: the two directions of the same equation, so a loan can be described
// either by what you pay each month or by how long you want it to take. Pure JS, no React
// dependency — tests/loan.test.mjs imports this directly.
import { n0, num } from "./format.js";

/* the standard amortizing payment: P = B·r / (1 − (1+r)^−n) */
export function amortPayment(balance, apr, months) {
  const b = n0(balance), n = Math.round(num(months));
  if (b <= 0 || n <= 0) return 0;
  const r = num(apr) / 1200;
  if (r <= 0.0000001) return b / n;
  return b * r / (1 - Math.pow(1 + r, -n));
}

/* the same equation solved for n. Returns null when the payment never clears the balance —
   a payment at or below the monthly interest leaves the principal untouched forever, which
   is worth saying out loud rather than reporting as a very large number of months. */
export function monthsToPayoff(balance, apr, payment) {
  const b = n0(balance), p = n0(payment);
  if (b <= 0) return 0;
  if (p <= 0) return null;
  const r = num(apr) / 1200;
  if (r <= 0.0000001) return Math.ceil(b / p);
  if (p <= b * r + 0.005) return null;
  return Math.ceil(-Math.log(1 - (b * r) / p) / Math.log(1 + r));
}

/* the minimum payment a loan is actually working to: typed in directly, or derived from a
   term when the loan is described that way. One place for it, so the engine's
   "minimums only" comparison line and the loan card can't disagree. */
export function minPaymentOf(loan) {
  if (!loan) return 0;
  if (loan.payMode === "term" && n0(loan.termMonths) > 0) {
    return amortPayment(loan.balance, loan.apr, loan.termMonths);
  }
  return n0(loan.minPayment);
}
