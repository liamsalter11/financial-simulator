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
