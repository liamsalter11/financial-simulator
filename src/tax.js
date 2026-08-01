// Income tax estimation: federal brackets, FICA, and a single flat state rate. Pure JS,
// no React dependency — tests/tax.test.mjs imports this directly.
//
// Everything here is annual. The engine works in today's dollars, and real brackets are
// indexed to inflation every year, so holding one year's table constant across the whole
// projection is the *consistent* choice rather than an omission: a salary that keeps its
// real value keeps its real tax rate.
//
// These figures go stale every January. TAX_YEAR is shown in the UI so a stale table is
// visible rather than silent, and the state rate is left as a single number the user types
// — shipping fifty bracket tables would rot faster and be wrong in more places.
import { n0, num } from "./format.js";

export const TAX_YEAR = 2026;

export const FILING = [
  { v: "single", label: "Single" },
  { v: "married", label: "Married, filing jointly" },
  { v: "head", label: "Head of household" },
];

/* [lower bound of the band, rate %] — each band's rate applies only to income above its
   own floor, which is what makes the marginal rate different from the effective one. */
export const FED_BRACKETS = {
  single: [[0, 10], [12400, 12], [50400, 22], [105700, 24], [201775, 32], [256225, 35], [640600, 37]],
  married: [[0, 10], [24800, 12], [100800, 22], [211400, 24], [403550, 32], [512450, 35], [768700, 37]],
  head: [[0, 10], [17700, 12], [67450, 22], [105700, 24], [201750, 32], [256200, 35], [664200, 37]],
};

export const STD_DEDUCTION = { single: 16100, married: 32200, head: 24150 };

export const FICA = {
  ssRate: 6.2,
  ssWageBase: 184500,   /* Social Security stops above this; Medicare never does */
  medicareRate: 1.45,
  addlMedicareRate: 0.9,
  addlMedicareFrom: { single: 200000, married: 250000, head: 200000 },
};

const table = (filing) => FED_BRACKETS[filing] || FED_BRACKETS.single;

/* federal income tax on an already-deducted (taxable) figure */
export function federalTax(taxableAnnual, filing) {
  const income = n0(taxableAnnual);
  if (income <= 0) return 0;
  const bands = table(filing);
  let tax = 0;
  for (let i = 0; i < bands.length; i++) {
    const [floor, rate] = bands[i];
    if (income <= floor) break;
    const ceiling = i + 1 < bands.length ? bands[i + 1][0] : Infinity;
    tax += (Math.min(income, ceiling) - floor) * rate / 100;
  }
  return tax;
}

/* the rate the next dollar of taxable income would be taxed at */
export function federalMarginalRate(taxableAnnual, filing) {
  const income = n0(taxableAnnual);
  const bands = table(filing);
  let rate = bands[0][1];
  for (const [floor, r] of bands) if (income > floor) rate = r;
  return rate;
}

/* Payroll tax. Pre-tax 401k deferrals don't reduce it — that's the point of the
   distinction between `wages` here and `taxable` above. */
export function ficaTax(wagesAnnual, filing) {
  const w = n0(wagesAnnual);
  if (w <= 0) return 0;
  const ss = Math.min(w, FICA.ssWageBase) * FICA.ssRate / 100;
  const medicare = w * FICA.medicareRate / 100;
  const from = FICA.addlMedicareFrom[filing] || FICA.addlMedicareFrom.single;
  const addl = Math.max(0, w - from) * FICA.addlMedicareRate / 100;
  return ss + medicare + addl;
}

/**
 * Annual take-home from an annual gross.
 * @param {number} grossAnnual   gross wages before anything comes out
 * @param {string} filing        one of FILING's `v` values
 * @param {number} preTaxAnnual  401k/HSA-style deductions: reduce income tax, not FICA
 * @param {number} stateRatePct  flat state rate, applied to the same base as federal
 */
export function estimateTax({ grossAnnual, filing, preTaxAnnual, stateRatePct }) {
  const gross = n0(grossAnnual);
  const preTax = Math.min(n0(preTaxAnnual), gross);
  const f = FILING.some((x) => x.v === filing) ? filing : "single";
  const taxable = Math.max(0, gross - preTax - (STD_DEDUCTION[f] || 0));
  const federal = federalTax(taxable, f);
  const state = taxable * Math.max(0, num(stateRatePct)) / 100;
  const fica = ficaTax(gross, f);
  const total = federal + state + fica;
  /* net is what reaches the bank: gross less tax less what was diverted pre-tax */
  const net = Math.max(0, gross - total - preTax);
  return {
    gross, preTax, taxable, federal, state, fica, total, net,
    effectiveRate: gross > 0 ? (total / gross) * 100 : 0,
    marginalRate: federalMarginalRate(taxable, f) + Math.max(0, num(stateRatePct)),
  };
}
