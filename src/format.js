// Money/date formatting, recurrence-frequency lookups, and small shared constants.
// Pure JS, no React dependency — safe to import from anywhere, including Node tests.
export const n0 = (v) => { const x = Number(v); return isFinite(x) && x > 0 ? x : 0; };
export const num = (v) => { const x = Number(v); return isFinite(x) ? x : 0; };
export const uid = () => Math.random().toString(36).slice(2, 9);
export const r2 = (n) => Math.round(n * 100) / 100;
export const parse = (s, f) => { try { return s ? JSON.parse(s) : f; } catch { return f; } };
export const DAY = 86400000;
/* date-only strings parse as UTC in JS, which shifts items a day in western timezones — parse as local */
export function parseDate(s) {
  if (s instanceof Date) return s;
  if (!s) return new Date(NaN);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s).trim());
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  return new Date(s);
}
export function addMonths(d, m) { const x = new Date(d); x.setMonth(x.getMonth() + m); return x; }
export const addDays = (d, n) => new Date(d.getTime() + n * DAY);
export const isoDate = (d) => d.toISOString().slice(0, 10);
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const nextFirstISO = () => { const d = new Date(); return isoDate(new Date(d.getFullYear(), d.getMonth() + 1, 1)); };
export const firstOfYear = () => { const d = new Date(); return new Date(d.getFullYear(), 0, 1); };
export const fmtMoney = (n) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");
export function fmtBig(n) { const s = n < 0 ? "-" : ""; n = Math.abs(Math.round(n)); if (n >= 1e6) return s + "$" + (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M"; if (n >= 1e3) return s + "$" + Math.round(n / 1e3) + "k"; return s + "$" + n; }
export const fmtC = (n) => { n = Math.round(n); if (Math.abs(n) >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M"; if (Math.abs(n) >= 1e3) return "$" + Math.round(n / 1e3) + "k"; return "$" + n; };
export const fmtDate = (d) => d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
export const weekTick = (start) => (w) => { const d = addDays(start, w * 7); return d.toLocaleDateString("en-US", { month: "short" }) + " '" + String(d.getFullYear()).slice(2); };
export function fmtDur(m) { if (m <= 0) return "0 mo"; const y = Math.floor(m / 12), mo = m % 12; if (y && mo) return `${y}y ${mo}mo`; if (y) return `${y}y`; return `${mo} mo`; }

export const WPY = 52.1775; /* weeks in a year — the engine's clock */
/* Every rate the user types is nominal. The projection works in today's dollars, so a
   nominal rate is converted to a real one before it compounds: 7% growth with 2.5%
   inflation buys 4.39% more, not 7%. Deflating rather than inflating spending keeps every
   figure on screen in money you can recognise today. */
export const toReal = (nominalPct, inflPct) => (((1 + num(nominalPct) / 100) / (1 + num(inflPct) / 100)) - 1) * 100;
/* how much a dollar today is worth in week w's money (>1 forward, <1 before today) */
export const inflFactor = (inflPct, weeks) => Math.pow(1 + num(inflPct) / 100, weeks / WPY);

export const OPY = { once: 0, weekly: 52.1775, biweekly: 26.0888, semimonthly: 24, monthly: 12, quarterly: 4, yearly: 1 };
export const RECUR = [
  { v: "once", label: "One-time" }, { v: "weekly", label: "Weekly" }, { v: "biweekly", label: "Every 2 weeks" },
  { v: "semimonthly", label: "1st & 15th" }, { v: "monthly", label: "Monthly" },
  { v: "quarterly", label: "Quarterly" }, { v: "yearly", label: "Yearly" },
];
export const recurLabel = (v) => (RECUR.find((r) => r.v === v) || {}).label || v;
export const ACCT_TYPES = [
  { v: "checking", label: "Checking", rate: 0 }, { v: "savings", label: "Savings / HYSA", rate: 4 },
  { v: "brokerage", label: "Brokerage", rate: 7 }, { v: "retirement", label: "Retirement", rate: 7 },
  { v: "cash", label: "Cash", rate: 0 }, { v: "other", label: "Other asset", rate: 0 },
];
export const isInvest = (t) => t === "brokerage" || t === "retirement";
export const isSav = (t) => t === "savings";
export const isCash = (t) => t === "checking" || t === "cash" || t === "other";
export const BUCKET_COLOR = { Investments: "#5CCB8B", Savings: "#38BDD0", Cash: "#F5A623" };
export const PAL = ["#F5A623", "#38BDD0", "#5CCB8B", "#B98CE8", "#E8B84B", "#5B9BD5", "#4FC3B0", "#D98BB0", "#8A9AAB", "#E0885B"];
export const ACCT_PAL = ["#38BDD0", "#5CCB8B", "#B98CE8", "#E8B84B", "#5B9BD5", "#4FC3B0", "#7FB2E8", "#C9A0DC"];
export const DEBT_PAL = ["#E8695B", "#D9776B", "#C86A5E", "#E88070"];
export const acctColor = (i) => ACCT_PAL[i % ACCT_PAL.length];
export const debtColor = (i) => DEBT_PAL[i % DEBT_PAL.length];
