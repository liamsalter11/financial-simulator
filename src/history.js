// Undo/redo and the daily auto-save, as plain data operations over plan snapshots. Pure
// JS, no React — the component owns the state, this owns the rules, and Node tests can
// drive the rules without rendering anything.
//
// A "plan" here is whatever planNow() returns in FinancialSimulator: the same shape Export
// writes and scenarios store, so undo, snapshot restore and scenario load all move the same
// object through the same applyPlan().

export const UNDO_LIMIT = 60;
export const SNAPSHOT_LIMIT = 12;
/* two edits closer together than this are treated as one gesture */
export const COALESCE_MS = 600;

/* A fingerprint of the plan's *shape* — how many of each thing, and which ids. Two states
   with the same shape differ only in values someone was typing; a different shape means a
   row was added or removed, which is always its own undo step however fast it happened. */
export function shapeOf(plan) {
  if (!plan) return "";
  const ids = (list) => (Array.isArray(list) ? list.map((x) => x && x.id).join(",") : "");
  return [
    ids(plan.accounts), ids(plan.debts), ids(plan.income), ids(plan.expenses),
    ids(plan.transfers), ids(plan.debtPayments), ids(plan.payments),
  ].join("|");
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Add a plan to the undo stack, coalescing a burst of edits into one entry.
 *
 * Typing "1500" into a field fires a state update per character; four undo steps for one
 * edit makes undo useless, so a push that lands within COALESCE_MS of the last one and
 * leaves the plan's shape unchanged replaces the top of the stack instead of growing it.
 *
 * @param {Array<{plan, at, shape}>} stack - oldest first
 * @returns {{stack: Array, coalesced: boolean, changed: boolean}}
 */
export function pushUndo(stack, plan, at = Date.now(), limit = UNDO_LIMIT) {
  const list = Array.isArray(stack) ? stack : [];
  const top = list[list.length - 1];
  if (top && same(top.plan, plan)) return { stack: list, coalesced: false, changed: false };

  const shape = shapeOf(plan);
  const entry = { plan, at, shape };
  if (top && at - top.at < COALESCE_MS && top.shape === shape) {
    /* same gesture, still in progress — replace rather than append */
    return { stack: [...list.slice(0, -1), entry], coalesced: true, changed: true };
  }
  const grown = [...list, entry];
  return { stack: grown.length > limit ? grown.slice(grown.length - limit) : grown, coalesced: false, changed: true };
}

/**
 * The daily auto-save: one entry per calendar day, newest first, capped.
 *
 * Same-day writes replace that day's entry rather than piling up, so the list is a history
 * of days rather than of keystrokes — which is what makes it useful to look back along.
 *
 * @param {Array} list - existing snapshots, newest first
 * @param {{at: string, plan: object}} entry - `at` is an ISO timestamp
 */
export function dailySnapshots(list, entry, limit = SNAPSHOT_LIMIT) {
  const existing = Array.isArray(list) ? list : [];
  if (!entry || !entry.at || !entry.plan) return existing;
  const day = String(entry.at).slice(0, 10);
  const rest = existing.filter((s) => String(s.at || "").slice(0, 10) !== day);
  return [entry, ...rest].slice(0, limit);
}

/* the newest snapshot from a day before today — "what this looked like last time", which is
   what the drift note compares against */
export function previousSnapshot(list, todayISO) {
  const today = String(todayISO || "").slice(0, 10);
  return (Array.isArray(list) ? list : []).find((s) => String(s.at || "").slice(0, 10) < today) || null;
}

/* Recorded net worth over time, oldest first, for the trailing line on the chart. Only
   entries that actually carry a figure count — older snapshots written before the field
   existed would otherwise draw a line to zero. */
export function actualSeries(list, start) {
  return (Array.isArray(list) ? list : [])
    .filter((s) => s && typeof s.nw === "number" && s.at)
    .map((s) => ({ at: s.at, nw: s.nw, week: Math.round((new Date(String(s.at).slice(0, 10)) - start) / 86400000 / 7) }))
    .filter((s) => isFinite(s.week))
    .sort((a, b) => a.week - b.week);
}
