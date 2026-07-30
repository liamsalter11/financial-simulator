// Monte Carlo projection for the invested portion of the portfolio. Reuses the
// deterministic engine's own contribution schedule (the change in `basis` from
// simulateWeekly, aggregated into monthly deposits) so "how much you put in" always
// matches the rest of the app; only the *returns* on top of that schedule are
// randomized, as a single blended portfolio (see FinancialSimulator.jsx for how the
// blended rate is derived from your invested accounts). Pure JS, no React dependency.
//
// Steps monthly rather than weekly: this is the standard resolution for Monte Carlo
// retirement tools, and running trials*weeks GBM steps on every keystroke (this
// recomputes whenever anything else in the projection does) was measurably slow —
// monthly steps cut the dominant loop ~4x with no meaningful loss of realism for a
// probabilistic fan chart.
import { n0 } from "./format.js";

export const MC_TRIALS = 250;
const WEEKS_PER_YEAR = 52.1775;
const WEEKS_PER_MONTH = WEEKS_PER_YEAR / 12;

// mulberry32 — a small, fast, seeded PRNG. Deterministic on purpose: the same
// inputs (return, volatility, contribution schedule) should always produce the
// same bands, so editing an unrelated field doesn't make this chart's shape jitter
// for no reason. It isn't a source of true randomness, and doesn't need to be.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleNormal(rng) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function percentile(sorted, p) {
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * @param {Array} series - the deterministic simulateWeekly() series (needs .invest/.basis per week)
 * @param {number} weeks - how many weeks of `series` to project (the Monte Carlo horizon)
 * @param {number} annualReturn - expected annual return, decimal (0.07 = 7%)
 * @param {number} annualVolatility - annual return volatility, decimal (0.15 = 15%)
 * @param {number} fireNumber - the independence target, for the success-probability stat
 * @param {number} trials - number of simulated paths
 * @param {number} seed - PRNG seed; fixed by default so results are reproducible
 */
export function runMonteCarlo({
  series, weeks, annualReturn, annualVolatility, fireNumber,
  trials = MC_TRIALS, seed = 42,
}) {
  const horizon = Math.max(0, Math.min(weeks, series.length - 1));
  const startValue = n0(series[0] && series[0].invest);
  const totalMonths = Math.max(0, Math.round(horizon / WEEKS_PER_MONTH));

  // one week-index + deposit per month boundary, aggregated from the weekly series
  const monthWeek = new Array(totalMonths + 1);
  const monthDeposit = new Array(totalMonths + 1).fill(0);
  for (let m = 0; m <= totalMonths; m++) monthWeek[m] = Math.min(horizon, Math.round(m * WEEKS_PER_MONTH));
  for (let m = 1; m <= totalMonths; m++) {
    monthDeposit[m] = n0(series[monthWeek[m]].basis) - n0(series[monthWeek[m - 1]].basis);
  }

  const dt = 1 / 12;
  const sigma = Math.max(0, annualVolatility);
  const drift = (annualReturn - 0.5 * sigma * sigma) * dt;
  const volStep = sigma * Math.sqrt(dt);

  // one row of trial values per month, filled in as trials run
  const rows = new Array(totalMonths + 1);
  for (let m = 0; m <= totalMonths; m++) rows[m] = new Array(trials);
  let successes = 0;
  const successWeeks = [];

  const rng = mulberry32(seed);
  for (let t = 0; t < trials; t++) {
    let value = startValue;
    let successWeek = null;
    rows[0][t] = value;
    if (fireNumber > 0 && value >= fireNumber) successWeek = monthWeek[0];
    for (let m = 1; m <= totalMonths; m++) {
      const z = sampleNormal(rng);
      const monthlyReturn = Math.exp(drift + volStep * z) - 1;
      value = Math.max(0, value * (1 + monthlyReturn) + monthDeposit[m]);
      rows[m][t] = value;
      if (successWeek === null && fireNumber > 0 && value >= fireNumber) successWeek = monthWeek[m];
    }
    if (successWeek != null) { successes++; successWeeks.push(successWeek); }
  }

  const bands = monthWeek.map((w, m) => {
    const sorted = rows[m].slice().sort((a, b) => a - b);
    return {
      w,
      p10: percentile(sorted, 0.10),
      p25: percentile(sorted, 0.25),
      p50: percentile(sorted, 0.50),
      p75: percentile(sorted, 0.75),
      p90: percentile(sorted, 0.90),
    };
  });

  successWeeks.sort((a, b) => a - b);
  const medianSuccessWeek = successWeeks.length
    ? successWeeks[Math.floor((successWeeks.length - 1) / 2)]
    : null;

  return {
    bands,
    trials,
    successProb: trials > 0 ? successes / trials : 0,
    medianSuccessWeek,
  };
}
