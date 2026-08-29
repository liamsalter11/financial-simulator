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
/* Depreciation is just a negative rate — the growth line compounds whatever is here, so a
   car falling 12%/yr needs no new machinery. What the two property types really add is a
   *classification*: they're worth something and they are not money (see isIlliquid). */
export const ACCT_TYPES = [
  { v: "checking", label: "Checking", rate: 0 }, { v: "savings", label: "Savings / HYSA", rate: 4 },
  { v: "brokerage", label: "Brokerage", rate: 7 }, { v: "retirement", label: "Retirement", rate: 7 },
  { v: "cash", label: "Cash", rate: 0 }, { v: "other", label: "Other asset", rate: 0 },
  { v: "home", label: "Home / property", rate: 3 }, { v: "vehicle", label: "Vehicle", rate: -12 },
];
/* Expense categories are a fixed list rather than free text, because free text can't be
   rolled up — two people writing "Groceries" and "groceries" are two categories, and one
   person writing "Rent" and "Mortgage" never see them as the same kind of cost. What was
   typed survives as the expense's own `label`; this is only the bucket it counts toward.
   The colours are CSS custom properties, not hex — see the note on PAL below. */
export const CATEGORIES = [
  { v: "housing", label: "Housing", color: "var(--amber)" },
  { v: "food", label: "Food", color: "var(--green)" },
  { v: "transport", label: "Transport", color: "var(--cyan)" },
  { v: "health", label: "Health", color: "var(--violet)" },
  { v: "insurance", label: "Insurance", color: "var(--blue)" },
  { v: "debt", label: "Debt", color: "var(--red)" },
  { v: "fun", label: "Fun", color: "var(--gold)" },
  { v: "other", label: "Other", color: "var(--slate)" },
];
export const isCategory = (v) => CATEGORIES.some((c) => c.v === v);
export const catLabel = (v) => (CATEGORIES.find((c) => c.v === v) || {}).label || "Other";
export const catColor = (v) => (CATEGORIES.find((c) => c.v === v) || {}).color || "var(--slate)";
/* Ordered, because the first match wins and some words belong to two buckets: "car
   insurance" is insurance, not transport, and "gas bill" is housing while "gas" alone is
   a filling station. */
const CAT_WORDS = [
  ["insurance", ["insur", "premium", "geico", "progressive", "state farm", "allstate", "policy"]],
  ["housing", ["rent", "mortgage", "hoa", "utilit", "electric", "water bill", "gas bill", "natural gas", "internet", "wifi", "phone", "cable", "comcast", "verizon", "at&t", "t-mobile", "landlord", "storage", "furniture", "home depot", "property tax"]],
  ["food", ["grocer", "food", "dining", "restaurant", "coffee", "cafe", "starbucks", "trader joe", "whole foods", "safeway", "kroger", "aldi", "costco", "doordash", "uber eats", "ubereats", "grubhub", "instacart", "takeout", "lunch", "dinner"]],
  ["transport", ["car", "auto", "fuel", "gas", "shell", "chevron", "exxon", "bp ", "transit", "metro", "subway", "bus ", "train", "uber", "lyft", "parking", "toll", "bike", "dmv", "registration"]],
  ["health", ["health", "medical", "doctor", "dentist", "dental", "pharmacy", "cvs", "walgreens", "gym", "fitness", "therapy", "vision", "clinic", "hospital"]],
  ["debt", ["loan", "student", "credit card", "mohela", "earnest", "nelnet", "sallie", "interest", "minimum payment"]],
  ["fun", ["netflix", "spotify", "hulu", "disney", "hbo", "max ", "youtube", "apple music", "prime video", "game", "steam", "movie", "cinema", "theater", "travel", "vacation", "flight", "airbnb", "hotel", "hobby", "bar ", "pub ", "brewery", "concert", "entertain", "subscription"]],
];
/* Used both to migrate a free-text category and to guess one for an imported merchant.
   A guess is only ever a default — every row is shown before it's created. */
export function matchCategory(text) {
  const s = String(text || "").toLowerCase();
  if (!s.trim()) return "other";
  for (const [cat, words] of CAT_WORDS) if (words.some((w) => s.includes(w))) return cat;
  return "other";
}

export const isInvest = (t) => t === "brokerage" || t === "retirement";
export const isSav = (t) => t === "savings";
export const isCash = (t) => t === "checking" || t === "cash" || t === "other";
/* An asset that counts toward net worth but can't be spent: you can't eat a house, and
   selling it is a life decision rather than a withdrawal. That distinction is what keeps a
   home out of the cash runway and out of the independence test.
   `other` is deliberately NOT here — it's ambiguous (someone's I-bonds live there), and
   silently reclassifying it would move the runway figure under existing users. */
export const isIlliquid = (t) => t === "home" || t === "vehicle";
/* Every chart colour is a CSS variable rather than a hex, because these strings are handed
   straight to Recharts as `stroke`/`fill` and SVG resolves `var()` the same way CSS does.
   That's what lets a theme reach the charts at all: the light palette darkens every hue
   (the dark amber on white is a contrast failure), and no tab needs to know which theme is on.
   Both palettes live together in src/styles.js; tests/tokens.test.mjs asserts every name
   used here is defined in both. */
export const BUCKET_COLOR = { Investments: "var(--green)", Savings: "var(--cyan)", Cash: "var(--amber)", Property: "var(--clay)" };
export const PAL = ["var(--amber)", "var(--cyan)", "var(--green)", "var(--violet)", "var(--gold)", "var(--blue)", "var(--teal)", "var(--pink)", "var(--slate)", "var(--clay)"];
export const ACCT_PAL = ["var(--cyan)", "var(--green)", "var(--violet)", "var(--gold)", "var(--blue)", "var(--teal)", "var(--sky)", "var(--lilac)"];
export const DEBT_PAL = ["var(--red)", "var(--red2)", "var(--red3)", "var(--red4)"];
/* A second axis alongside the palette, so a chart doesn't rely on hue alone. It matters
   most past the eighth account, where ACCT_PAL starts repeating and the dash is the only
   thing telling two lines apart — but it helps at two lines too, for anyone who can't
   separate the hues in the first place. */
export const DASHES = ["", "5 3", "2 3", "8 3 2 3", "1 3"];
export const dashFor = (i) => DASHES[Math.floor(i / ACCT_PAL.length) % DASHES.length] || undefined;
export const acctColor = (i) => ACCT_PAL[i % ACCT_PAL.length];
export const debtColor = (i) => DEBT_PAL[i % DEBT_PAL.length];
