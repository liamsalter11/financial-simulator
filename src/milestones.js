// The dates the projection already knows, as a list rather than a chart. No simulation
// happens here — every entry is read off a result that has already been computed, which is
// why this is a cheap main-thread derivation rather than another worker round trip.
import { n0, addDays, parseDate, WPY } from "./format.js";

/* the round numbers people actually notice passing */
export const CROSSINGS = [100000, 250000, 500000, 1000000, 2000000];

const firstWeekWhere = (series, pred, from = 0) => {
  for (let w = from; w < series.length; w++) if (pred(series[w])) return series[w].w;
  return null;
};

/**
 * @param {object} result - a project() result
 * @param {object} opts - { start, debts, income, settings, horizon }
 * @returns {Array<{week, date, kind, label, detail}>} sorted by date, past ones dropped
 */
export function milestones(result, opts = {}) {
  const { sim, retireWeek } = result;
  const { start, debts = [], income = [], settings = {} } = opts;
  if (!sim || !sim.series || !sim.series.length) return [];
  const out = [];
  const at = (week, kind, label, detail) => {
    if (week == null || !isFinite(week) || week < 0 || week >= sim.series.length) return;
    out.push({ week, date: addDays(start, week * 7), kind, label, detail });
  };

  /* every loan clearing, named — the moment a payment frees up is worth seeing */
  for (const d of debts) {
    if (d.kind === "card") continue;
    const w = sim.payoffWeek ? sim.payoffWeek[d.id] : null;
    if (w != null && n0(d.balance) > 0) at(w, "debt", `${d.name} paid off`, "that payment is free from here");
  }
  at(sim.debtFree, "debtFree", "Debt-free", "every loan cleared");

  /* net worth passing a round number */
  let from = 0;
  for (const level of CROSSINGS) {
    const w = firstWeekWhere(sim.series, (s) => s.nw >= level, from);
    if (w == null) break;
    from = w;
    at(w, "networth", `Net worth passes $${level >= 1e6 ? `${level / 1e6}m` : `${level / 1000}k`}`, null);
  }

  /* the plan's own headline dates */
  at(sim.fire, "fi", "Financial independence", "the portfolio covers your long-run spending");
  if (retireWeek != null && retireWeek !== sim.fire) at(retireWeek, "retire", "Retirement modelled", "contributions stop, withdrawals begin");

  /* dates the app inferred rather than the user entering directly */
  /* Dated events snap to the week that *contains or follows* them, never the week before:
     the list should not say a retirement account is open, or a pension is paying, days
     before it actually is. */
  const weekFrom = (date) => Math.ceil((date - start) / 86400000 / 7);
  const birthYear = n0(settings.birthYear);
  if (birthYear > 0) {
    at(weekFrom(new Date(birthYear + 60, 0, 1)), "access", "Retirement accounts open", "penalty-free withdrawals from about here");
  }
  for (const inc of income) {
    if (!inc.guaranteed) continue;
    const d = parseDate(inc.date);
    if (isNaN(d)) continue;
    at(weekFrom(d), "income", `${inc.name || "Guaranteed income"} starts`, "the independence target stops carrying it");
  }
  if (sim.capInfo) {
    for (const inc of income) {
      const ci = sim.capInfo[inc.id];
      if (ci) at(ci.week, "cap", `${inc.name || "Income"} hits the contribution cap`, "contributions pause until January");
    }
  }

  out.sort((a, b) => a.week - b.week || a.kind.localeCompare(b.kind));
  return out;
}

/* how far apart two plans put the same milestone — the comparison table's whole job */
export function milestoneDiff(a, b) {
  const key = (m) => `${m.kind}:${m.label}`;
  const bByKey = new Map(b.map((m) => [key(m), m]));
  const rows = [];
  for (const m of a) {
    const other = bByKey.get(key(m));
    rows.push({
      kind: m.kind, label: m.label, week: m.week, date: m.date,
      otherWeek: other ? other.week : null,
      otherDate: other ? other.date : null,
      /* negative means this plan gets there sooner than the one compared against */
      deltaWeeks: other ? m.week - other.week : null,
      deltaMonths: other ? (m.week - other.week) / (WPY / 12) : null,
    });
  }
  /* milestones the other plan reaches and this one doesn't are worth showing too */
  const aKeys = new Set(a.map(key));
  for (const m of b) {
    if (aKeys.has(key(m))) continue;
    rows.push({ kind: m.kind, label: m.label, week: null, date: null, otherWeek: m.week, otherDate: m.date, deltaWeeks: null, deltaMonths: null });
  }
  rows.sort((x, y) => (x.week == null ? Infinity : x.week) - (y.week == null ? Infinity : y.week));
  return rows;
}
