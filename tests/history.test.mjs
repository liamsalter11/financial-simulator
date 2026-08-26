// Unit tests for src/history.js. Undo is only useful if one edit is one step: the
// coalescing rules are the thing worth pinning, along with the daily snapshot list not
// growing without bound.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pushUndo, dailySnapshots, previousSnapshot, actualSeries, shapeOf,
  UNDO_LIMIT, SNAPSHOT_LIMIT, COALESCE_MS,
} from "../src/history.js";

const plan = (over = {}) => ({
  accounts: [{ id: "a1", name: "Checking", balance: 1000 }],
  debts: [], income: [], expenses: [{ id: "e1", category: "Rent", amount: 1500 }],
  transfers: [], debtPayments: [], payments: [], settings: { inflation: 2.5 },
  ...over,
});

test("a burst of edits to the same field collapses into one undo step", () => {
  // "1500" typed one character at a time, each landing inside the coalesce window
  let stack = [];
  let t = 1000;
  for (const amount of [1, 15, 150, 1500]) {
    ({ stack } = pushUndo(stack, plan({ expenses: [{ id: "e1", category: "Rent", amount }] }), t));
    t += 120;
  }
  assert.equal(stack.length, 1, "four keystrokes are one edit");
  assert.equal(stack[0].plan.expenses[0].amount, 1500, "and the entry holds the latest value");
});

test("edits far enough apart are separate steps", () => {
  let stack = [];
  ({ stack } = pushUndo(stack, plan({ settings: { inflation: 1 } }), 1000));
  ({ stack } = pushUndo(stack, plan({ settings: { inflation: 2 } }), 1000 + COALESCE_MS + 50));
  assert.equal(stack.length, 2, "a pause between edits ends the gesture");
});

test("adding or removing a row always starts a new step, however fast", () => {
  // The dangerous case: delete an account and immediately type elsewhere. If that
  // coalesced, one undo would silently skip past the deletion.
  let stack = [];
  ({ stack } = pushUndo(stack, plan(), 1000));
  ({ stack } = pushUndo(stack, plan({ accounts: [] }), 1050));
  assert.equal(stack.length, 2, "a structural change is never folded into the previous edit");
  assert.equal(stack[0].plan.accounts.length, 1, "so undo can restore the deleted row");

  let s2 = [];
  ({ stack: s2 } = pushUndo(s2, plan(), 1000));
  ({ stack: s2 } = pushUndo(s2, plan({ accounts: [{ id: "a1", name: "Checking", balance: 2000 }] }), 1050));
  assert.equal(s2.length, 1, "while a value change at the same shape still coalesces");
});

test("an unchanged plan is not pushed at all", () => {
  let stack = [];
  ({ stack } = pushUndo(stack, plan(), 1000));
  const again = pushUndo(stack, plan(), 5000);
  assert.equal(again.changed, false);
  assert.equal(again.stack.length, 1, "re-rendering with the same data mustn't fill the stack");
});

test("the stack drops the oldest entries at its limit", () => {
  let stack = [];
  for (let i = 0; i < UNDO_LIMIT + 15; i++) {
    ({ stack } = pushUndo(stack, plan({ settings: { inflation: i } }), i * 10000));
  }
  assert.equal(stack.length, UNDO_LIMIT);
  assert.equal(stack[stack.length - 1].plan.settings.inflation, UNDO_LIMIT + 14, "the newest is kept");
  assert.ok(stack[0].plan.settings.inflation > 0, "and the oldest fell off the bottom");
});

test("shapeOf notices structure, not values", () => {
  assert.equal(shapeOf(plan()), shapeOf(plan({ settings: { inflation: 99 } })), "values don't change shape");
  assert.notEqual(shapeOf(plan()), shapeOf(plan({ accounts: [] })), "a removed row does");
  assert.notEqual(shapeOf(plan()), shapeOf(plan({ expenses: [{ id: "e2", amount: 1 }] })), "so does a replaced id");
  assert.equal(shapeOf(null), "", "and a missing plan doesn't throw");
});

/* ================================================================== */
/*  Daily snapshots                                                    */
/* ================================================================== */

test("snapshots keep one entry per day, replacing within the same day", () => {
  let list = [];
  list = dailySnapshots(list, { at: "2026-08-01T09:00:00Z", plan: plan(), nw: 100 });
  list = dailySnapshots(list, { at: "2026-08-01T18:00:00Z", plan: plan(), nw: 150 });
  assert.equal(list.length, 1, "a second edit the same day updates that day");
  assert.equal(list[0].nw, 150, "with the later figure");

  list = dailySnapshots(list, { at: "2026-08-02T09:00:00Z", plan: plan(), nw: 200 });
  assert.equal(list.length, 2);
  assert.equal(list[0].at.slice(0, 10), "2026-08-02", "newest first");
});

test("the snapshot list is capped", () => {
  let list = [];
  for (let d = 1; d <= SNAPSHOT_LIMIT + 6; d++) {
    list = dailySnapshots(list, { at: `2026-08-${String(d).padStart(2, "0")}T09:00:00Z`, plan: plan(), nw: d });
  }
  assert.equal(list.length, SNAPSHOT_LIMIT);
  assert.equal(list[0].nw, SNAPSHOT_LIMIT + 6, "the newest day survives");
  assert.ok(list[list.length - 1].nw > 1, "the oldest days are dropped");
});

test("a malformed entry is ignored rather than stored", () => {
  const list = [{ at: "2026-08-01T09:00:00Z", plan: plan(), nw: 1 }];
  assert.equal(dailySnapshots(list, null).length, 1);
  assert.equal(dailySnapshots(list, { at: "2026-08-02T09:00:00Z" }).length, 1, "no plan, no snapshot");
});

test("previousSnapshot finds the newest entry from an earlier day", () => {
  const list = [
    { at: "2026-08-05T09:00:00Z", plan: plan(), nw: 500 },
    { at: "2026-08-03T09:00:00Z", plan: plan(), nw: 300 },
    { at: "2026-07-30T09:00:00Z", plan: plan(), nw: 100 },
  ];
  assert.equal(previousSnapshot(list, "2026-08-05").nw, 300, "today's own entry doesn't count as history");
  assert.equal(previousSnapshot(list, "2026-08-03").nw, 100);
  assert.equal(previousSnapshot(list, "2026-07-01"), null, "with nothing earlier there's nothing to compare");
});

test("actualSeries turns dated snapshots into week-indexed points", () => {
  const start = new Date(2026, 7, 1); // 1 Aug 2026
  const list = [
    { at: "2026-08-15T09:00:00Z", plan: plan(), nw: 200 },
    { at: "2026-08-01T09:00:00Z", plan: plan(), nw: 100 },
    { at: "2026-08-08T09:00:00Z", plan: plan() },            /* no figure recorded */
  ];
  const series = actualSeries(list, start);
  assert.equal(series.length, 2, "entries with no net worth recorded are skipped, not drawn as zero");
  assert.deepEqual(series.map((s) => s.nw), [100, 200], "oldest first");
  assert.equal(series[0].week, 0);
  assert.equal(series[1].week, 2, "a fortnight later is week 2");
});
