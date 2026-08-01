// Unit tests for src/sample.js — the chart downsampler shared by all four chart tabs.
// It runs on every render at every zoom level, and a mistake here shows up as a chart
// whose right-hand edge doesn't reach the value the stats next to it report.
import { test } from "node:test";
import assert from "node:assert/strict";
import { sampleRange } from "../src/sample.js";

/* a week-indexed series shaped like the engine's: each point carries its own `w` */
const series = (n) => Array.from({ length: n }, (_, w) => ({ w, v: w * 10 }));
const weeks = (rows) => rows.map((r) => r.w);

test("a series already under the point limit is returned in full", () => {
  assert.deepEqual(weeks(sampleRange(series(11), 0, 10, 300)), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test("a long series is strided down to about the requested number of points", () => {
  const out = sampleRange(series(1001), 0, 1000, 100);
  assert.ok(out.length <= 101, `expected roughly 100 points, got ${out.length}`);
  assert.equal(out[0].w, 0, "the window's first point is always kept");
  assert.equal(out[out.length - 1].w, 1000, "and so is its last");
});

test("the window's final point is appended even when the stride would overshoot it", () => {
  // 100 points strided by 10 lands on 90, leaving 99 out — the chart would stop short of
  // the value every stat beside it is quoting.
  const out = sampleRange(series(100), 0, 99, 10);
  assert.equal(out[out.length - 1].w, 99, "the true last point must close the series");
  assert.equal(out[out.length - 2].w, 90, "appended after the strided points, not replacing one");
});

test("no duplicate final point when the stride already lands on the last week", () => {
  const out = sampleRange(series(101), 0, 100, 10);
  assert.equal(out[out.length - 1].w, 100);
  assert.notEqual(out[out.length - 2].w, 100, "the closing point shouldn't be emitted twice");
});

test("only the requested window is sampled, not the whole series", () => {
  const out = sampleRange(series(101), 20, 30, 5);
  assert.equal(out[0].w, 20, "sampling starts at the window's left edge");
  assert.equal(out[out.length - 1].w, 30, "and ends at its right edge");
  assert.ok(out.every((r) => r.w >= 20 && r.w <= 30), "nothing outside the window should appear");
});

test("fractional zoom bounds widen outward to whole weeks", () => {
  // The zoom hook produces fractional edges while panning; the chart should cover them
  // rather than clip inside them.
  assert.deepEqual(weeks(sampleRange(series(101), 2.7, 8.2, 300)), [2, 3, 4, 5, 6, 7, 8, 9],
    "the window floors its start and ceils its end");
});

test("bounds beyond the series are clamped to what exists", () => {
  assert.deepEqual(weeks(sampleRange(series(5), 0, 999, 300)), [0, 1, 2, 3, 4], "a zoom past the horizon can't read off the end");
  assert.deepEqual(weeks(sampleRange(series(5), -99, 4, 300)), [0, 1, 2, 3, 4], "nor before the start");
});

test("degenerate inputs return an empty result instead of throwing", () => {
  assert.deepEqual(sampleRange([], 0, 10, 300), [], "an empty series has nothing to sample");
  assert.deepEqual(sampleRange(series(10), 8, 3, 300), [], "an inverted window yields nothing rather than reading backwards");
});

test("a single-point series survives sampling", () => {
  assert.deepEqual(weeks(sampleRange(series(1), 0, 0, 300)), [0]);
});

test("maxPts defaults to 300 when it isn't supplied", () => {
  const out = sampleRange(series(1000), 0, 999);
  assert.ok(out.length > 250 && out.length <= 302, `expected roughly 300 points, got ${out.length}`);
});

test("sampled points are the original objects, not copies", () => {
  // The tabs map over the result and read fields like `.acct` and `.dbt` off each point.
  const input = series(50);
  const out = sampleRange(input, 0, 49, 10);
  assert.equal(out[0], input[0], "points should pass through by reference");
  assert.equal(out[0].v, 0);
});
