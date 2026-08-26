// Unit tests for src/tax.js. These assert structure and behaviour — bands are monotonic,
// the marginal rate exceeds the effective one, FICA stops at the wage base, pre-tax money
// reduces income tax but not payroll tax — rather than pinning exact IRS dollar figures.
// The tables go stale every January; a corrected table should not fail the suite.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FED_BRACKETS, STD_DEDUCTION, FICA, FILING, TAX_YEAR,
  federalTax, federalMarginalRate, ficaTax, estimateTax,
} from "../src/tax.js";

test("every filing status has a usable, ordered bracket table", () => {
  assert.ok(TAX_YEAR >= 2025, "the tables should be labelled with the year they came from");
  for (const { v } of FILING) {
    const bands = FED_BRACKETS[v];
    assert.ok(Array.isArray(bands) && bands.length > 1, `${v} needs a bracket table`);
    assert.equal(bands[0][0], 0, `${v}'s first band must start at zero`);
    assert.ok(STD_DEDUCTION[v] > 0, `${v} needs a standard deduction`);
    for (let i = 1; i < bands.length; i++) {
      assert.ok(bands[i][0] > bands[i - 1][0], `${v} band ${i} must start above the one before`);
      assert.ok(bands[i][1] > bands[i - 1][1], `${v} band ${i} must be taxed higher than the one before`);
    }
  }
});

test("federal tax is continuous across a bracket boundary", () => {
  // A dollar either side of a threshold must not produce a jump — only the dollar above
  // the line is taxed at the higher rate, which is the whole point of marginal brackets.
  const [, [threshold]] = FED_BRACKETS.single;
  const below = federalTax(threshold - 1, "single");
  const at = federalTax(threshold, "single");
  const above = federalTax(threshold + 1, "single");
  assert.ok(at - below < 1, "crossing a bracket must not step the bill");
  assert.ok(above - at < 1, "and the dollar above it is taxed at the new rate, not the whole income");
});

test("tax rises with income, and the marginal rate is never below the effective one", () => {
  let last = -1;
  for (const income of [0, 15000, 45000, 90000, 150000, 400000, 1200000]) {
    const t = federalTax(income, "single");
    assert.ok(t >= last, "more income should never mean less tax");
    last = t;
    if (income > 0) {
      const effective = (t / income) * 100;
      assert.ok(federalMarginalRate(income, "single") >= effective, `marginal < effective at ${income}`);
    }
  }
});

test("married brackets are wider, so the same income is taxed less", () => {
  assert.ok(federalTax(120000, "married") < federalTax(120000, "single"));
});

test("Social Security stops at the wage base while Medicare keeps going", () => {
  const atBase = ficaTax(FICA.ssWageBase, "single");
  const wellAbove = ficaTax(FICA.ssWageBase * 2, "single");
  const extra = wellAbove - atBase;
  const medicareOnExtra = FICA.ssWageBase * FICA.medicareRate / 100;
  // above the base only Medicare (plus the additional Medicare surtax) accrues
  assert.ok(extra >= medicareOnExtra, "Medicare should continue above the Social Security cap");
  assert.ok(extra < medicareOnExtra + FICA.ssWageBase * (FICA.ssRate + FICA.addlMedicareRate) / 100,
    "but Social Security itself should not");
});

test("pre-tax contributions cut income tax without touching payroll tax", () => {
  const base = { grossAnnual: 120000, filing: "single", stateRatePct: 0 };
  const none = estimateTax({ ...base, preTaxAnnual: 0 });
  const deferred = estimateTax({ ...base, preTaxAnnual: 20000 });

  assert.ok(deferred.federal < none.federal, "deferring should reduce federal tax");
  assert.equal(deferred.fica, none.fica, "FICA is charged on gross wages, deferral or not");
  assert.ok(deferred.net < none.net, "take-home still drops — the money went to the 401k, not the bank");
  assert.ok(deferred.net + deferred.preTax > none.net, "but gross-less-tax is higher, which is the tax break");
});

test("a flat state rate lands on the same base as federal", () => {
  const noState = estimateTax({ grossAnnual: 100000, filing: "single", preTaxAnnual: 0, stateRatePct: 0 });
  const withState = estimateTax({ grossAnnual: 100000, filing: "single", preTaxAnnual: 0, stateRatePct: 5 });
  assert.equal(withState.state, noState.taxable * 0.05);
  assert.ok(withState.net < noState.net);
  assert.equal(withState.marginalRate, noState.marginalRate + 5, "state adds to the marginal rate");
});

test("the standard deduction means a small income owes no federal tax", () => {
  const r = estimateTax({ grossAnnual: STD_DEDUCTION.single - 1000, filing: "single", preTaxAnnual: 0, stateRatePct: 0 });
  assert.equal(r.federal, 0, "below the deduction there's nothing to tax");
  assert.ok(r.fica > 0, "payroll tax applies from the first dollar, though");
});

test("degenerate inputs return zeroes rather than NaN", () => {
  for (const gross of [0, -5000, "", null, undefined, "abc"]) {
    const r = estimateTax({ grossAnnual: gross, filing: "single", preTaxAnnual: 0, stateRatePct: 0 });
    assert.equal(r.total, 0);
    assert.equal(r.net, 0);
    assert.equal(r.effectiveRate, 0);
  }
  assert.equal(federalTax(50000, "nonsense-filing-status"), federalTax(50000, "single"), "an unknown status falls back to single");
  const capped = estimateTax({ grossAnnual: 1000, filing: "single", preTaxAnnual: 99999, stateRatePct: 0 });
  assert.ok(capped.net >= 0, "deferring more than you earn must not produce negative take-home");
});
