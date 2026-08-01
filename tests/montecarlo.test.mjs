// Unit tests for the Monte Carlo engine in src/montecarlo.js — pure JS, no browser,
// no React dependency, imported directly like the deterministic engine tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runMonteCarlo } from "../src/montecarlo.js";

// A synthetic weekly series: starts at $10,000 invested, $50/week of new contributions.
function makeSeries(weeks, startInvest = 10000, weeklyDeposit = 50) {
  const series = [];
  let basis = startInvest;
  for (let w = 0; w <= weeks; w++) {
    if (w > 0) basis += weeklyDeposit;
    series.push({ invest: basis, basis });
  }
  return series;
}

test("zero volatility collapses every percentile to the same value at every week", () => {
  const series = makeSeries(500);
  const r = runMonteCarlo({ series, weeks: 500, annualReturn: 0.07, annualVolatility: 0, fireNumber: 0, trials: 50 });
  assert.ok(r.bands.length > 1, "expected multiple sampled months");
  for (const b of r.bands) {
    assert.equal(b.p10, b.p50, `week ${b.w}: p10 should equal p50 with zero volatility`);
    assert.equal(b.p50, b.p90, `week ${b.w}: p50 should equal p90 with zero volatility`);
  }
});

test("percentiles are properly ordered at every sampled week when volatility is nonzero", () => {
  const series = makeSeries(1500);
  const r = runMonteCarlo({ series, weeks: 1500, annualReturn: 0.07, annualVolatility: 0.15, fireNumber: 0, trials: 250 });
  for (const b of r.bands) {
    assert.ok(b.p10 <= b.p25, `week ${b.w}: p10 (${b.p10}) should be <= p25 (${b.p25})`);
    assert.ok(b.p25 <= b.p50, `week ${b.w}: p25 (${b.p25}) should be <= p50 (${b.p50})`);
    assert.ok(b.p50 <= b.p75, `week ${b.w}: p50 (${b.p50}) should be <= p75 (${b.p75})`);
    assert.ok(b.p75 <= b.p90, `week ${b.w}: p75 (${b.p75}) should be <= p90 (${b.p90})`);
  }
});

test("the first band starts at the series' opening invested balance", () => {
  const series = makeSeries(200, 12345);
  const r = runMonteCarlo({ series, weeks: 200, annualReturn: 0.07, annualVolatility: 0.1, fireNumber: 0, trials: 50 });
  assert.equal(r.bands[0].w, 0);
  assert.equal(r.bands[0].p50, 12345, "with no elapsed time every trial should still be at the starting balance");
});

test("results are reproducible: identical inputs always produce identical bands", () => {
  const series = makeSeries(800);
  const a = runMonteCarlo({ series, weeks: 800, annualReturn: 0.07, annualVolatility: 0.15, fireNumber: 0, trials: 100 });
  const b = runMonteCarlo({ series, weeks: 800, annualReturn: 0.07, annualVolatility: 0.15, fireNumber: 0, trials: 100 });
  assert.deepEqual(a.bands, b.bands, "same seed and inputs should give byte-identical output, not fresh randomness each call");
});

test("higher volatility widens the range between p10 and p90 without collapsing the median", () => {
  const series = makeSeries(1500);
  const low = runMonteCarlo({ series, weeks: 1500, annualReturn: 0.07, annualVolatility: 0.05, fireNumber: 0, trials: 250 });
  const high = runMonteCarlo({ series, weeks: 1500, annualReturn: 0.07, annualVolatility: 0.30, fireNumber: 0, trials: 250 });
  const lowEnd = low.bands[low.bands.length - 1];
  const highEnd = high.bands[high.bands.length - 1];
  assert.ok((highEnd.p90 - highEnd.p10) > (lowEnd.p90 - lowEnd.p10), "30% volatility should produce a wider band than 5% volatility");
});

test("success probability is a fraction between 0 and 1, and 0 when there's no target", () => {
  const series = makeSeries(1500);
  const noTarget = runMonteCarlo({ series, weeks: 1500, annualReturn: 0.07, annualVolatility: 0.15, fireNumber: 0, trials: 100 });
  assert.equal(noTarget.successProb, 0);
  assert.equal(noTarget.medianSuccessWeek, null);

  const withTarget = runMonteCarlo({ series, weeks: 1500, annualReturn: 0.07, annualVolatility: 0.15, fireNumber: 50000, trials: 250 });
  assert.ok(withTarget.successProb >= 0 && withTarget.successProb <= 1);
});

test("an unreachable target within the horizon yields zero success probability", () => {
  const series = makeSeries(100, 1000, 1); // tiny balance, tiny contributions, short horizon
  const r = runMonteCarlo({ series, weeks: 100, annualReturn: 0.07, annualVolatility: 0.1, fireNumber: 10000000, trials: 100 });
  assert.equal(r.successProb, 0);
  assert.equal(r.medianSuccessWeek, null);
});

test("a trivially reachable target (already met at week 0) yields 100% success", () => {
  const series = makeSeries(200, 50000);
  const r = runMonteCarlo({ series, weeks: 200, annualReturn: 0.07, annualVolatility: 0.15, fireNumber: 1, trials: 100 });
  assert.equal(r.successProb, 1);
  assert.equal(r.medianSuccessWeek, 0);
});

/* ================================================================== */
/*  Decumulation: does the money last?                                 */
/* ================================================================== */

/* a flat series — no contributions, a fixed starting balance — so the only thing moving
   the number is the withdrawal logic under test */
const flat = (weeks, invest) => Array.from({ length: weeks + 1 }, (_, w) => ({ w, invest, basis: invest }));

test("with zero volatility and no growth, a withdrawal run is exact arithmetic", () => {
  // $120,000 paying out $12,000/yr with no returns lasts exactly ten years and no longer.
  const r = runMonteCarlo({
    series: flat(1040, 120000), weeks: 1040, annualReturn: 0, annualVolatility: 0,
    fireNumber: 0, retireWeek: 0, annualSpend: 12000, horizonWeeks: 1040, trials: 20,
  });
  assert.equal(r.survivalProb, 0, "ten years of spending can't cover twenty");
  const yearsLasted = r.medianDepletionWeek / 52.1775;
  assert.ok(Math.abs(yearsLasted - 10) < 0.3, `expected the money to run out at ~10 years, got ${yearsLasted.toFixed(2)}`);
});

test("a portfolio that outearns its withdrawals never runs out", () => {
  const r = runMonteCarlo({
    series: flat(1040, 500000), weeks: 1040, annualReturn: 0.05, annualVolatility: 0,
    fireNumber: 0, retireWeek: 0, annualSpend: 10000, horizonWeeks: 1040, trials: 20,
  });
  assert.equal(r.survivalProb, 1);
  assert.equal(r.medianDepletionWeek, null, "nothing depleted, so there's no depletion date to report");
});

test("survival falls as spending rises", () => {
  const run = (annualSpend) => runMonteCarlo({
    series: flat(1560, 400000), weeks: 1560, annualReturn: 0.05, annualVolatility: 0.15,
    fireNumber: 0, retireWeek: 0, annualSpend, horizonWeeks: 1560, trials: 200,
  }).survivalProb;
  const low = run(12000), mid = run(20000), high = run(32000);
  assert.ok(low >= mid && mid >= high, `survival should decrease with spending: ${low}, ${mid}, ${high}`);
  assert.ok(low > high, "and the ends should differ, not just tie");
});

test("volatility alone can sink a plan the average return would sustain", () => {
  // This is sequence-of-returns risk, and the whole reason the panel exists: same expected
  // return, same withdrawal, different odds — because *when* the bad years land matters.
  const run = (annualVolatility) => runMonteCarlo({
    series: flat(1560, 400000), weeks: 1560, annualReturn: 0.05, annualVolatility,
    fireNumber: 0, retireWeek: 0, annualSpend: 20000, horizonWeeks: 1560, trials: 300,
  }).survivalProb;
  assert.equal(run(0), 1, "with no volatility this plan is comfortably sustainable");
  assert.ok(run(0.25) < 0.95, "with volatility, some paths still fail");
  assert.ok(run(0.25) < run(0.1), "and more of them fail the rougher the ride");
});

test("contributions stop at retirement", () => {
  // A series whose basis keeps climbing: before the retirement week the Monte Carlo should
  // follow those deposits, after it should ignore them entirely.
  const series = Array.from({ length: 1041 }, (_, w) => ({ w, invest: 10000 + w * 100, basis: 10000 + w * 100 }));
  const early = runMonteCarlo({
    series, weeks: 1040, annualReturn: 0, annualVolatility: 0, fireNumber: 0,
    retireWeek: 520, annualSpend: 1200, horizonWeeks: 1040, trials: 5,
  });
  const never = runMonteCarlo({
    series, weeks: 1040, annualReturn: 0, annualVolatility: 0, fireNumber: 0, trials: 5,
  });
  const end = (r) => r.bands[r.bands.length - 1].p50;
  assert.ok(end(early) < end(never), "deposits after the retirement week must not be counted");
  /* deposits run for the first half only (10,000 + 520 weeks × 100), then ten years of
     $1,200 a year comes back out of it */
  const expected = 10000 + 520 * 100 - 12000;
  assert.ok(Math.abs(end(early) - expected) < 2000, `expected ~${expected}, got ${end(early).toFixed(0)}`);
});

test("without a retirement in the horizon, nothing is withdrawn and survival is total", () => {
  const r = runMonteCarlo({
    series: flat(520, 100000), weeks: 520, annualReturn: 0.05, annualVolatility: 0.15,
    fireNumber: 200000, retireWeek: 900, annualSpend: 40000, horizonWeeks: 520, trials: 50,
  });
  assert.equal(r.retires, false, "a retirement beyond the horizon isn't a retirement this run can test");
  assert.equal(r.survivalProb, 1);
  assert.equal(r.monthlySpend, 0);
  assert.ok(r.successProb >= 0 && r.successProb <= 1, "and the older reach-the-target question still answers");
});

test("a retirement with nothing to spend is not a retirement", () => {
  const r = runMonteCarlo({
    series: flat(520, 100000), weeks: 520, annualReturn: 0.05, annualVolatility: 0.1,
    fireNumber: 0, retireWeek: 0, annualSpend: 0, horizonWeeks: 520, trials: 10,
  });
  assert.equal(r.retires, false, "zero spending means there's nothing to outlive");
  assert.equal(r.survivalProb, 1);
});
