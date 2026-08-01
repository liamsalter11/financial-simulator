// Unit tests for src/recurrence.js — the scheduling layer the whole simulation is built
// on. Every paycheck, expense, transfer and debt payment reaches the engine through
// firesInWeek(), so a miscount here silently shifts every projected number. Pure JS, no
// browser, imported directly.
//
// The engine works in fixed 7-day windows built with millisecond arithmetic, while
// recurrence dates are calendar dates parsed at local midnight. Several tests below sweep
// across a whole year of start dates precisely because that mismatch is where a drift bug
// would hide (month lengths, leap days, daylight-saving transitions).
import { test } from "node:test";
import assert from "node:assert/strict";
import { nominalDates, monthIdxRange, daysInMonth, adjWeekday, firesInWeek } from "../src/recurrence.js";
import { addDays, parseDate, DAY } from "../src/format.js";

const iso = (d) => d.toISOString().slice(0, 10);
const local = (s) => new Date(s + "T00:00:00");

/* count how many times an event fires across `weeks` consecutive engine windows */
function countWeeks(ev, start, weeks) {
  let total = 0;
  for (let w = 0; w < weeks; w++) {
    const ws = addDays(start, w * 7);
    total += firesInWeek(ev, ws, addDays(ws, 7));
  }
  return total;
}

/* An independent oracle: enumerate an event's occurrences directly over a span, without
   going through nominalDates/firesInWeek at all. Deliberately written the long, obvious
   way — its whole value is that it shares no code with the implementation it checks. */
function occurrencesInSpan(ev, from, to) {
  const start = parseDate(ev.date);
  const end = ev.end ? parseDate(ev.end) : null;
  const out = [];
  const push = (d) => { if (d >= start && (!end || d <= end)) out.push(d); };

  if (ev.recur === "once") {
    push(start);
  } else if (ev.recur === "weekly" || ev.recur === "biweekly") {
    const step = ev.recur === "weekly" ? 7 : 14;
    for (let d = new Date(start); d < addDays(to, 20); d = new Date(d.getTime() + step * DAY)) push(d);
  } else if (ev.recur === "semimonthly") {
    for (let y = from.getFullYear() - 1; y <= to.getFullYear() + 1; y++) {
      for (let m = 0; m < 12; m++) { push(new Date(y, m, 1)); push(new Date(y, m, 15)); }
    }
  } else {
    const step = ev.recur === "monthly" ? 1 : ev.recur === "quarterly" ? 3 : 12;
    for (let y = from.getFullYear() - 1; y <= to.getFullYear() + 1; y++) {
      for (let m = 0; m < 12; m++) {
        const months = (y - start.getFullYear()) * 12 + (m - start.getMonth());
        if (months < 0 || months % step !== 0) continue;
        push(new Date(y, m, Math.min(start.getDate(), daysInMonth(y, m))));
      }
    }
  }
  return out
    .map((d) => (ev.weekdayAdj ? adjWeekday(d) : d))
    .filter((d) => d >= from && d < to)
    .length;
}

/* ---------- calendar helpers ---------- */

test("daysInMonth handles short months and leap years", () => {
  assert.equal(daysInMonth(2026, 1), 28, "February 2026");
  assert.equal(daysInMonth(2028, 1), 29, "February 2028 is a leap year");
  assert.equal(daysInMonth(2026, 3), 30, "April");
  assert.equal(daysInMonth(2026, 0), 31, "January");
});

test("monthIdxRange covers every month the window touches, and no more", () => {
  const idx = monthIdxRange(new Date(2026, 0, 1), new Date(2026, 2, 1));
  assert.deepEqual(idx.map((i) => `${Math.floor(i / 12)}-${i % 12}`), ["2026-0", "2026-1"],
    "an exclusive end on 1 March must not pull March in");

  const single = monthIdxRange(new Date(2026, 0, 5), new Date(2026, 0, 12));
  assert.equal(single.length, 1, "a week inside one month spans one month index");

  const crossYear = monthIdxRange(new Date(2026, 11, 20), new Date(2027, 0, 10));
  assert.equal(crossYear.length, 2, "December to January spans two months across a year boundary");
});

/* ---------- nominalDates, per frequency ---------- */

test("a one-time event fires only if its date is inside the window", () => {
  assert.deepEqual(nominalDates({ date: "2026-01-10", recur: "once" }, new Date(2026, 0, 1), new Date(2026, 1, 1)).map(iso), ["2026-01-10"]);
  assert.deepEqual(nominalDates({ date: "2026-06-01", recur: "once" }, new Date(2026, 0, 1), new Date(2026, 1, 1)), []);
});

test("semimonthly fires on the 1st and the 15th regardless of the start date's day", () => {
  const dates = nominalDates({ date: "2026-01-07", recur: "semimonthly" }, new Date(2026, 0, 1), new Date(2026, 1, 1));
  assert.deepEqual(dates.map(iso), ["2026-01-15"], "the 1st precedes the start date, so only the 15th qualifies");

  const full = nominalDates({ date: "2026-01-01", recur: "semimonthly" }, new Date(2026, 0, 1), new Date(2026, 1, 1));
  assert.deepEqual(full.map(iso), ["2026-01-01", "2026-01-15"]);
});

test("a monthly event dated the 31st clamps to the last day of shorter months", () => {
  const dates = nominalDates({ date: "2026-01-31", recur: "monthly" }, new Date(2026, 0, 1), new Date(2026, 4, 1));
  assert.deepEqual(dates.map(iso), ["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"],
    "rent due on the 31st should land on the 28th in February, not skip the month or spill into March");
});

test("quarterly steps three months from its own start month, not from January", () => {
  const dates = nominalDates({ date: "2026-02-15", recur: "quarterly" }, new Date(2026, 0, 1), new Date(2027, 0, 1));
  assert.deepEqual(dates.map(iso), ["2026-02-15", "2026-05-15", "2026-08-15", "2026-11-15"]);
});

test("yearly fires once per year on its anniversary", () => {
  const dates = nominalDates({ date: "2026-05-05", recur: "yearly" }, new Date(2026, 0, 1), new Date(2029, 0, 1));
  assert.deepEqual(dates.map(iso), ["2026-05-05", "2027-05-05", "2028-05-05"]);
});

test("nominalDates never returns a date before the event's own start", () => {
  const dates = nominalDates({ date: "2026-03-01", recur: "monthly" }, new Date(2026, 0, 1), new Date(2026, 5, 1));
  assert.deepEqual(dates.map(iso), ["2026-03-01", "2026-04-01", "2026-05-01"],
    "a bill that starts in March must not be back-dated into January and February");
});

test("an end date stops the series, inclusively", () => {
  const dates = nominalDates({ date: "2026-01-01", recur: "monthly", end: "2026-03-01" }, new Date(2026, 0, 1), new Date(2026, 5, 1));
  assert.deepEqual(dates.map(iso), ["2026-01-01", "2026-02-01", "2026-03-01"], "the end date itself still fires");
});

test("an unparseable date or unknown frequency yields nothing instead of throwing", () => {
  assert.deepEqual(nominalDates({ date: "not a date", recur: "monthly" }, new Date(2026, 0, 1), new Date(2026, 5, 1)), []);
  assert.deepEqual(nominalDates({ date: "", recur: "monthly" }, new Date(2026, 0, 1), new Date(2026, 5, 1)), []);
  assert.deepEqual(nominalDates({ date: "2026-01-01", recur: "fortnightly" }, new Date(2026, 0, 1), new Date(2026, 5, 1)), []);
});

/* ---------- firesInWeek: counts across a full year ---------- */

test("each frequency fires the expected number of times across a year of engine weeks", () => {
  const start = new Date(2026, 0, 1);
  const expected = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12, quarterly: 4, yearly: 1 };
  for (const [recur, want] of Object.entries(expected)) {
    assert.equal(countWeeks({ date: "2026-01-01", recur }, start, 52), want, `${recur} should fire ${want} times in 52 weeks`);
  }
});

test("a weekly event fires exactly once per week from every possible start date in a year", () => {
  // The guard against calendar drift. Engine weeks are built as `start + w * 7 days` in
  // raw milliseconds (see addDays in format.js), so a daylight-saving transition shifts a
  // window's boundary by an hour relative to the local-midnight dates being matched
  // against it. If that ever caused a firing to be dropped or double-counted, this
  // catches it — a single fixed start date would not.
  const offenders = [];
  for (let d = 0; d < 365; d++) {
    const start = addDays(new Date(2026, 0, 1), d);
    const count = countWeeks({ date: "2026-01-01", recur: "weekly" }, start, 52);
    if (count !== 52) offenders.push(`${iso(start)} -> ${count}`);
  }
  assert.deepEqual(offenders, [], "every 52-week span should contain exactly 52 weekly firings");
});

test("every frequency's weekly counts agree with an independently enumerated calendar", () => {
  // The strongest guard available: for each of a year's worth of simulation start dates,
  // the engine's per-week counts must sum to the number of occurrences an independent
  // enumeration finds in the same span. This catches a firing dropped at a window seam or
  // counted in two windows, without hard-coding a total — a 52-week span is 364 days, so
  // the correct monthly total is legitimately 11 or 12 depending on where it starts.
  const patterns = [
    ["weekly", { date: "2026-01-01", recur: "weekly" }],
    ["biweekly", { date: "2026-01-01", recur: "biweekly" }],
    ["semimonthly", { date: "2026-01-01", recur: "semimonthly" }],
    ["monthly mid-month", { date: "2026-01-12", recur: "monthly" }],
    ["monthly on the 31st", { date: "2026-01-31", recur: "monthly" }],
    ["monthly, weekend-adjusted", { date: "2026-01-01", recur: "monthly", weekdayAdj: true }],
    ["biweekly, weekend-adjusted", { date: "2026-01-03", recur: "biweekly", weekdayAdj: true }],
    ["quarterly", { date: "2026-02-15", recur: "quarterly" }],
    ["yearly", { date: "2026-05-05", recur: "yearly" }],
    ["weekly with an end date", { date: "2026-01-01", recur: "weekly", end: "2026-06-30" }],
  ];

  const offenders = [];
  for (const [name, ev] of patterns) {
    for (let d = 0; d < 365; d++) {
      const start = addDays(new Date(2026, 0, 1), d);
      const counted = countWeeks(ev, start, 52);
      const expected = occurrencesInSpan(ev, start, addDays(start, 364));
      if (counted !== expected) offenders.push(`${name} from ${iso(start)}: counted ${counted}, expected ${expected}`);
    }
  }
  assert.deepEqual(offenders.slice(0, 5), [], `${offenders.length} start dates disagreed with the calendar`);
});

test("a monthly event fires 11 or 12 times across a 364-day span, never zero or thirteen", () => {
  // 52 engine weeks is 364 days — one or two days short of a year — so which of the two
  // totals is correct depends on the start date. Both are fine; anything else is not.
  const seen = new Set();
  for (let d = 0; d < 365; d++) {
    const start = addDays(new Date(2026, 0, 1), d);
    seen.add(countWeeks({ date: "2026-01-12", recur: "monthly" }, start, 52));
  }
  assert.deepEqual([...seen].sort(), [11, 12], "no start date should skip a month or double-count one");
});

test("a biweekly event keeps its own cadence when the simulation starts mid-cycle", () => {
  assert.equal(countWeeks({ date: "2026-01-01", recur: "biweekly" }, new Date(2026, 0, 2), 52), 26,
    "starting a day after the pay date must not drop or duplicate a paycheck");
});

test("an event fires nothing after its end date passes", () => {
  const count = countWeeks({ date: "2026-01-01", recur: "monthly", end: "2026-03-01" }, new Date(2026, 0, 1), 52);
  assert.equal(count, 3, "January, February and March only");
});

/* ---------- weekend adjustment ---------- */

test("adjWeekday pulls weekend dates back to the preceding Friday", () => {
  assert.equal(iso(adjWeekday(local("2026-01-03"))), "2026-01-02", "Saturday moves back one day");
  assert.equal(iso(adjWeekday(local("2026-01-04"))), "2026-01-02", "Sunday moves back two days");
  assert.equal(iso(adjWeekday(local("2026-01-05"))), "2026-01-05", "a weekday is left alone");
});

test("weekend adjustment can pull a payment into the previous month", () => {
  // 1 August 2026 is a Saturday, so pay lands on 31 July.
  assert.equal(iso(adjWeekday(local("2026-08-01"))), "2026-07-31");
  // 1 March 2026 is a Sunday, so pay lands on 27 February.
  assert.equal(iso(adjWeekday(local("2026-03-01"))), "2026-02-27");
});

test("weekend adjustment doesn't change how many times an event fires, only when", () => {
  // firesInWeek widens its candidate window by two days when weekdayAdj is on, then
  // filters by the adjusted date — the risk being that a date pulled backwards lands in
  // the previous window while still being counted in this one. Comparing adjusted against
  // unadjusted totals over a long horizon isolates that: shifting a date off a weekend
  // must never create or destroy a payment.
  const start = new Date(2026, 0, 1);
  for (const date of ["2026-01-01", "2026-01-03", "2026-01-04", "2026-01-31"]) {
    for (const recur of ["weekly", "biweekly", "semimonthly", "monthly", "quarterly"]) {
      const plain = countWeeks({ date, recur }, start, 520);
      const adjusted = countWeeks({ date, recur, weekdayAdj: true }, start, 520);
      assert.equal(adjusted, plain, `${recur} from ${date}: weekend adjustment changed the firing count`);
    }
  }
});

test("weekend adjustment leaves the count unchanged for a weekly event", () => {
  assert.equal(countWeeks({ date: "2026-01-03", recur: "weekly", weekdayAdj: true }, new Date(2026, 0, 1), 52), 52,
    "a Saturday-dated weekly event shifted to Friday should still fire once a week");
});

test("weekdayAdj off leaves weekend dates where they fall", () => {
  const ws = local("2026-01-03"); // the Saturday itself
  assert.equal(firesInWeek({ date: "2026-01-03", recur: "once" }, ws, addDays(ws, 7)), 1,
    "without adjustment the event stays on its Saturday");
  assert.equal(firesInWeek({ date: "2026-01-03", recur: "once", weekdayAdj: true }, ws, addDays(ws, 7)), 0,
    "with adjustment it moves back to the Friday, which is in the previous window");
});

/* ---------- a constraint worth knowing before reusing nominalDates ---------- */

test("nominalDates only enumerates a short window for weekly and biweekly frequencies", () => {
  // It generates at most four candidates ahead of `from`, which is ample for the one-week
  // windows firesInWeek asks for but silently truncates over a longer range. Anyone
  // reaching for nominalDates to build a long schedule needs to know this.
  const oneWeek = nominalDates({ date: "2026-01-01", recur: "weekly" }, new Date(2026, 0, 1), new Date(2026, 0, 8));
  assert.deepEqual(oneWeek.map(iso), ["2026-01-01"], "a one-week window is exact");

  const oneYear = nominalDates({ date: "2026-01-01", recur: "weekly" }, new Date(2026, 0, 1), new Date(2027, 0, 1));
  assert.equal(oneYear.length, 4, "a year-long window still yields only four dates — a cap, not a full schedule");

  // Calendar-driven frequencies have no such cap, because they enumerate by month.
  const monthlyYear = nominalDates({ date: "2026-01-01", recur: "monthly" }, new Date(2026, 0, 1), new Date(2027, 0, 1));
  assert.equal(monthlyYear.length, 12, "monthly enumerates the whole range");
});
