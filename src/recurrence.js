// Expands a recurring event (weekly/biweekly/monthly/...) into concrete calendar dates,
// and counts how many times it fires inside a given [ws, we) week window.
import { DAY, addDays, parseDate } from "./format.js";

/* ---------- recurrence at weekly resolution ---------- */
export const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
export function monthIdxRange(from, to) {
  const a = from.getFullYear() * 12 + from.getMonth();
  const l = new Date(to.getTime() - 1);
  const b = l.getFullYear() * 12 + l.getMonth();
  const o = []; for (let i = a; i <= b; i++) o.push(i); return o;
}
export function nominalDates(ev, from, to) {
  const start = parseDate(ev.date); if (isNaN(start)) return [];
  const end = ev.end ? parseDate(ev.end) : null; const out = [];
  const push = (d) => { if (d >= from && d < to && d >= start && (!end || d <= end)) out.push(d); };
  switch (ev.recur) {
    case "once": push(start); break;
    case "weekly": case "biweekly": {
      const st = ev.recur === "weekly" ? 7 : 14;
      const k = Math.max(0, Math.floor((from - start) / (st * DAY)));
      for (let i = k; i < k + 4; i++) { const d = new Date(start.getTime() + i * st * DAY); if (d >= to) break; push(d); }
      break;
    }
    case "semimonthly": {
      for (const idx of monthIdxRange(from, to)) { const y = Math.floor(idx / 12), m = idx % 12; push(new Date(y, m, 1)); push(new Date(y, m, 15)); }
      break;
    }
    case "monthly": case "quarterly": case "yearly": {
      const st = ev.recur === "monthly" ? 1 : ev.recur === "quarterly" ? 3 : 12;
      for (const idx of monthIdxRange(from, to)) {
        const y = Math.floor(idx / 12), m = idx % 12;
        const ms = (y - start.getFullYear()) * 12 + (m - start.getMonth());
        if (ms < 0 || ms % st !== 0) continue;
        push(new Date(y, m, Math.min(start.getDate(), daysInMonth(y, m))));
      }
      break;
    }
  }
  return out;
}
export const adjWeekday = (d) => { const g = d.getDay(); if (g === 6) return addDays(d, -1); if (g === 0) return addDays(d, -2); return d; };
export function firesInWeek(ev, ws, we) {
  const pad = ev.weekdayAdj ? 2 : 0;
  const cands = nominalDates(ev, ws, addDays(we, pad));
  let n = 0;
  for (const d of cands) { const a = ev.weekdayAdj ? adjWeekday(d) : d; if (a >= ws && a < we) n++; }
  return n;
}
