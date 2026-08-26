// Reading a bank export and guessing which lines are recurring spending.
// Pure logic, no React and no DOM — the review UI does nothing but display what this returns.
//
// Detection is a heuristic on someone's real statement, so nothing here creates anything:
// every row it produces is shown, with the evidence it found, and only ticked rows become
// expenses.
import { matchCategory } from "./format.js";

/* ------------------------------------------------------------------ */
/*  Parsing                                                            */
/* ------------------------------------------------------------------ */
/* A CSV parser rather than a split(",") — statement descriptions routinely contain commas
   ("SQ *BLUE BOTTLE, SEATTLE") and banks quote them. Handles the doubled-quote escape and
   both line endings. */
export function parseCSV(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  const s = String(text || "");
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { pushField(); if (row.some((c) => c.trim() !== "")) rows.push(row); row = []; };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") pushField();
    else if (c === "\n") pushRow();
    else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length) pushRow();
  return rows;
}

/* Statements write money a dozen ways: "$1,200.00", "(45.30)" for a debit, "45.30-".
   Anything that isn't a number at all comes back null so the row can be skipped. */
export function parseAmount(v) {
  let s = String(v == null ? "" : v).trim();
  if (!s) return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (/-\s*$/.test(s)) { neg = true; s = s.replace(/-\s*$/, ""); }
  s = s.replace(/[$£€\s,]/g, "");
  if (s.startsWith("-")) { neg = true; s = s.slice(1); }
  if (!/^\d*\.?\d+$/.test(s)) return null;
  const n = Number(s);
  if (!isFinite(n)) return null;
  return neg ? -n : n;
}

/* ISO first, then the slash forms. Two-digit years are read as 2000s — a bank export of
   1998 transactions isn't the case worth handling. Ambiguous D/M vs M/D is resolved the
   only way it can be without a locale: anything over 12 in the first slot is the day. */
export function parseCsvDate(v) {
  const s = String(v == null ? "" : v).trim();
  if (!s) return null;
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4})/.exec(s);
  if (m) {
    let [, a, b, y] = m; a = +a; b = +b; y = +y;
    if (y < 100) y += 2000;
    const [mo, d] = a > 12 ? [b, a] : [a, b];
    return iso(y, mo, d);
  }
  const d = new Date(s);
  return isFinite(d.getTime()) ? iso(d.getFullYear(), d.getMonth() + 1, d.getDate()) : null;
}
const pad = (n) => String(n).padStart(2, "0");
function iso(y, mo, d) {
  if (!(mo >= 1 && mo <= 12) || !(d >= 1 && d <= 31)) return null;
  return `${y}-${pad(mo)}-${pad(d)}`;
}

const HEAD = {
  date: /^(transaction |posting |post |value |booking )?date$/i,
  desc: /descri|payee|merchant|memo|details|narrative|name|reference/i,
  amount: /^amount|^amt|value$/i,
  debit: /debit|withdraw|money out|paid out/i,
  credit: /credit|deposit|money in|paid in/i,
};
/* Two shapes in the wild: one signed Amount column, or separate Debit and Credit columns.
   Both are supported, and a file with no header row is read positionally instead — the
   column that parses as a date, the one that parses as money, the longest text. */
export function detectColumns(rows) {
  if (!rows.length) return null;
  const head = rows[0].map((h) => String(h || "").trim());
  const find = (re) => head.findIndex((h) => re.test(h));
  const date = find(HEAD.date) >= 0 ? find(HEAD.date) : head.findIndex((h) => /date/i.test(h));
  const desc = find(HEAD.desc);
  const amount = find(HEAD.amount);
  const debit = find(HEAD.debit), credit = find(HEAD.credit);
  if (date >= 0 && desc >= 0 && (amount >= 0 || debit >= 0)) {
    return { date, desc, amount, debit, credit, skip: 1 };
  }
  return positional(rows);
}
function positional(rows) {
  const body = rows.filter((r) => r.some((c) => parseCsvDate(c)));
  if (!body.length) return null;
  const width = body[0].length;
  const score = (test) => {
    const counts = [];
    for (let i = 0; i < width; i++) counts[i] = body.filter((r) => test(r[i])).length;
    let best = -1, at = -1;
    counts.forEach((c, i) => { if (c > best) { best = c; at = i; } });
    return best > body.length / 2 ? at : -1;
  };
  const date = score((c) => !!parseCsvDate(c));
  const amount = score((c) => parseAmount(c) != null && !parseCsvDate(c));
  if (date < 0 || amount < 0) return null;
  let desc = -1, longest = 0;
  for (let i = 0; i < width; i++) {
    if (i === date || i === amount) continue;
    const len = body.reduce((a, r) => a + String(r[i] || "").length, 0) / body.length;
    if (len > longest) { longest = len; desc = i; }
  }
  if (desc < 0) return null;
  /* no header to skip — the first row is already data if it parsed as a date */
  return { date, desc, amount, debit: -1, credit: -1, skip: rows.length - body.length };
}

/* Spending only, as positive numbers. A signed Amount column has debits negative in every
   export I've seen; a file where they're positive is caught by `flip`. Credits — refunds,
   paychecks, transfers in — are dropped, because this creates expenses. */
export function readTransactions(text) {
  const rows = parseCSV(text);
  const cols = detectColumns(rows);
  if (!cols) return { txns: [], cols: null, skipped: rows.length };
  const out = [];
  let skipped = 0;
  const body = rows.slice(cols.skip);
  for (const r of body) {
    const date = parseCsvDate(r[cols.date]);
    const desc = String(r[cols.desc] == null ? "" : r[cols.desc]).trim();
    let amt = null;
    if (cols.debit >= 0 && parseAmount(r[cols.debit]) != null) amt = -Math.abs(parseAmount(r[cols.debit]));
    else if (cols.credit >= 0 && parseAmount(r[cols.credit]) != null) amt = Math.abs(parseAmount(r[cols.credit]));
    else if (cols.amount >= 0) amt = parseAmount(r[cols.amount]);
    if (!date || !desc || amt == null || amt === 0) { skipped++; continue; }
    out.push({ date, desc, amount: amt });
  }
  /* an export with every row positive is using positives for debits — flip it rather than
     reporting that the file contains no spending */
  const flip = out.length > 0 && out.every((t) => t.amount > 0);
  const txns = out.filter((t) => (flip ? t.amount > 0 : t.amount < 0)).map((t) => ({ ...t, amount: Math.abs(t.amount) }));
  return { txns, cols, skipped, flipped: flip };
}

/* ------------------------------------------------------------------ */
/*  Grouping and recurrence                                            */
/* ------------------------------------------------------------------ */
const NOISE = /\b(?:POS|ACH|EFT|DEBIT|CREDIT|CARD|PURCHASE|PMT|PAYMENT|RECUR|RECURRING|WEB|ONLINE|ID|REF|TRANSACTION|TRANSFER|WITHDRAWAL|AUTOPAY|AUT|CHECKCARD|VISA|MASTERCARD|XX+)\b/g;
/* A merchant is written a different way every time it appears — "SQ *BLUE BOTTLE #4471
   0412 SEATTLE WA" and "SQ *BLUE BOTTLE #0912 SEATTLE WA" are one coffee shop. Strip the
   parts that change (store numbers, dates, reference ids) and keep the first few words,
   which is what's left of the name. */
export function normMerchant(desc) {
  let t = String(desc || "").toUpperCase();
  t = t.replace(/\b(?:SQ|TST|SP|PY|PP|PAYPAL|IC)\s*\*/g, " "); /* payment-processor prefixes */
  t = t.replace(/\d{1,2}[\/-]\d{1,2}([\/-]\d{2,4})?/g, " ");   /* embedded dates */
  t = t.replace(NOISE, " ");
  t = t.replace(/\S*\d\S*/g, " ");                             /* store numbers, ref ids */
  t = t.replace(/[^A-Z& ]+/g, " ").replace(/\s+/g, " ").trim();
  const words = t.split(" ").filter((w) => w.length > 1);
  if (!words.length) return String(desc || "").trim().toUpperCase().slice(0, 24) || "UNKNOWN";
  return words.slice(0, 3).join(" ");
}
export const titleCase = (s) => String(s || "").toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

const FREQ = [
  { v: "weekly", days: 7 }, { v: "biweekly", days: 14 }, { v: "semimonthly", days: 15.22 },
  { v: "monthly", days: 30.44 }, { v: "quarterly", days: 91.31 }, { v: "yearly", days: 365.25 },
];
const DAY_MS = 86400000;
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/* The spacing of a merchant's dates is the whole signal. Take the median gap, find the
   frequency it's nearest, and score how tightly the gaps actually hold to it — a rent
   charge on the 1st of four months is unmistakable, while five coffees at random intervals
   in a fortnight are not a weekly commitment however close the average lands. */
export function inferRecurrence(dates) {
  const t = [...new Set(dates)].sort().map((d) => new Date(d + "T00:00:00").getTime());
  if (t.length < 2) return { recur: "once", confidence: 0, gap: null };
  const gaps = [];
  for (let i = 1; i < t.length; i++) gaps.push((t[i] - t[i - 1]) / DAY_MS);
  const gap = median(gaps);
  if (!(gap > 0)) return { recur: "once", confidence: 0, gap: null };
  let best = null;
  for (const f of FREQ) {
    const err = Math.abs(gap - f.days) / f.days;
    if (!best || err < best.err) best = { ...f, err };
  }
  if (best.err > 0.25) return { recur: "once", confidence: 0, gap };
  /* how far each gap strays from the frequency, not just the median — this is what
     separates a standing order from a merchant you happen to visit a lot */
  const spread = gaps.reduce((a, g) => a + Math.abs(g - best.days), 0) / gaps.length / best.days;
  const tightness = Math.max(0, 1 - spread / 0.3);
  const evidence = Math.min(1, gaps.length / 3);      /* three gaps (four charges) is a pattern */
  const confidence = Math.round(tightness * evidence * 100) / 100;
  return { recur: best.v, confidence, gap };
}
export const confidenceLevel = (c) => (c >= 0.7 ? "high" : c >= 0.4 ? "medium" : "low");

/* Charges grouped by merchant, each with what the file says about it: how often, the
   typical amount (median, so one unusual month doesn't set it), and how sure the spacing
   makes us. Sorted by what it costs a year, since that's the order worth reviewing in. */
export function detectRecurring(txns) {
  const groups = new Map();
  for (const t of txns || []) {
    const key = normMerchant(t.desc);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }
  const OPY = { once: 0, weekly: 52.1775, biweekly: 26.0888, semimonthly: 24, monthly: 12, quarterly: 4, yearly: 1 };
  const out = [];
  for (const [key, list] of groups) {
    const dates = list.map((t) => t.date).sort();
    const amounts = list.map((t) => t.amount);
    const { recur, confidence, gap } = inferRecurrence(dates);
    const amount = Math.round(median(amounts) * 100) / 100;
    const spread = amounts.length > 1 && amount > 0
      ? amounts.reduce((a, x) => a + Math.abs(x - amount), 0) / amounts.length / amount : 0;
    out.push({
      key, label: titleCase(key), category: matchCategory(list[0].desc), recur, confidence,
      level: confidenceLevel(confidence), amount, count: list.length,
      first: dates[0], last: dates[dates.length - 1], gap,
      varies: spread > 0.25,                 /* groceries, not a subscription */
      annual: Math.round(amount * (OPY[recur] || 0)),
      total: Math.round(amounts.reduce((a, b) => a + b, 0) * 100) / 100,
      sample: list[0].desc,
    });
  }
  return out.sort((a, b) => b.annual - a.annual || b.total - a.total);
}

/* One call for the UI: text in, review rows out. Rows are pre-ticked only where the file
   makes a decent case — a one-off or a weak pattern is still listed, just not by default. */
export function suggestExpenses(text) {
  const { txns, cols, flipped } = readTransactions(text);
  const rows = detectRecurring(txns);
  return {
    ok: !!cols && txns.length > 0,
    txns: txns.length,
    flipped: !!flipped,
    rows: rows.map((r) => ({ ...r, pick: r.recur !== "once" && r.confidence >= 0.4 })),
  };
}

/* The next date the merchant is due, so a created expense starts on its own schedule
   rather than today. */
export function nextDue(row, todayISO) {
  if (!row || !row.last || !row.gap) return todayISO;
  let t = new Date(row.last + "T00:00:00").getTime();
  const now = new Date(todayISO + "T00:00:00").getTime();
  const step = Math.max(1, Math.round(row.gap)) * DAY_MS;
  let guard = 0;
  while (t <= now && guard++ < 600) t += step;
  const d = new Date(t);
  return iso(d.getFullYear(), d.getMonth() + 1, d.getDate()) || todayISO;
}

export const toExpense = (row, fromAcct, todayISO, id) => ({
  id, label: row.label, category: row.category, amount: row.amount,
  date: nextDue(row, todayISO), recur: row.recur === "once" ? "once" : row.recur, fromAcct,
});
