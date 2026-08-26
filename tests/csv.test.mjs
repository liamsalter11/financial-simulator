import test from "node:test";
import assert from "node:assert/strict";
import {
  parseCSV, parseAmount, parseCsvDate, detectColumns, readTransactions,
  normMerchant, inferRecurrence, detectRecurring, suggestExpenses, nextDue, toExpense,
} from "../src/csv.js";

/* ------------------------------------------------------------------ */
/*  Parsing                                                            */
/* ------------------------------------------------------------------ */
test("quoted fields and embedded commas parse", () => {
  const rows = parseCSV('Date,Description,Amount\n2026-01-02,"SQ *BLUE BOTTLE, SEATTLE WA",-6.25\n');
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[1], ["2026-01-02", "SQ *BLUE BOTTLE, SEATTLE WA", "-6.25"]);
});

test("doubled quotes and CRLF are handled, blank lines dropped", () => {
  const rows = parseCSV('a,b\r\n"He said ""hi""",2\r\n\r\n');
  assert.deepEqual(rows, [["a", "b"], ['He said "hi"', "2"]]);
});

test("amounts parse in every shape a statement writes them", () => {
  assert.equal(parseAmount("$1,200.00"), 1200);
  assert.equal(parseAmount("(45.30)"), -45.3);
  assert.equal(parseAmount("45.30-"), -45.3);
  assert.equal(parseAmount("-6.25"), -6.25);
  assert.equal(parseAmount(".5"), 0.5);
  assert.equal(parseAmount("PENDING"), null);
  assert.equal(parseAmount(""), null);
});

test("dates parse ISO and both slash orders", () => {
  assert.equal(parseCsvDate("2026-01-02"), "2026-01-02");
  assert.equal(parseCsvDate("01/02/2026"), "2026-01-02");
  assert.equal(parseCsvDate("2/1/26"), "2026-02-01");
  assert.equal(parseCsvDate("13/01/2026"), "2026-01-13", "a first field over 12 must be the day");
  assert.equal(parseCsvDate("not a date"), null);
});

/* ------------------------------------------------------------------ */
/*  Column detection                                                   */
/* ------------------------------------------------------------------ */
test("separate Debit and Credit columns are read, and credits dropped", () => {
  const csv = [
    "Transaction Date,Description,Debit,Credit",
    "01/05/2026,RENT PAYMENT,1500.00,",
    "01/06/2026,PAYROLL DEPOSIT,,3000.00",
  ].join("\n");
  const { txns, cols } = readTransactions(csv);
  assert.equal(cols.debit, 2);
  assert.deepEqual(txns, [{ date: "2026-01-05", desc: "RENT PAYMENT", amount: 1500 }]);
});

test("a file with no header row is read positionally", () => {
  const csv = ["2026-01-05,RENT,-1500.00", "2026-02-05,RENT,-1500.00"].join("\n");
  const { txns, cols } = readTransactions(csv);
  assert.equal(cols.skip, 0);
  assert.equal(txns.length, 2);
});

test("an export using positive numbers for debits is flipped, not read as empty", () => {
  const csv = ["Date,Description,Amount", "2026-01-05,RENT,1500.00", "2026-02-05,RENT,1500.00"].join("\n");
  const { txns, flipped } = readTransactions(csv);
  assert.equal(flipped, true);
  assert.equal(txns.length, 2);
  assert.equal(txns[0].amount, 1500);
});

test("malformed rows are skipped rather than failing the file", () => {
  const csv = [
    "Date,Description,Amount",
    "2026-01-05,RENT,-1500.00",
    "garbage,,,",
    ",MISSING DATE,-10.00",
    "2026-01-07,PENDING CHARGE,PENDING",
    "2026-02-05,RENT,-1500.00",
  ].join("\n");
  const { txns, skipped } = readTransactions(csv);
  assert.equal(txns.length, 2);
  assert.ok(skipped >= 3, `expected the bad rows counted, got ${skipped}`);
});

test("a file that isn't a statement reports failure instead of inventing rows", () => {
  const r = suggestExpenses("hello\nworld\n");
  assert.equal(r.ok, false);
  assert.deepEqual(r.rows, []);
});

/* ------------------------------------------------------------------ */
/*  Merchant normalization                                             */
/* ------------------------------------------------------------------ */
test("one merchant written several ways groups as one", () => {
  const a = normMerchant("SQ *BLUE BOTTLE #4471 0412 SEATTLE WA");
  const b = normMerchant("SQ *BLUE BOTTLE #0912 SEATTLE WA");
  assert.equal(a, b);
  assert.equal(a, "BLUE BOTTLE SEATTLE", "the processor prefix and store number are noise");
});

test("normalization never returns an empty key", () => {
  assert.ok(normMerchant("1234 5678").length > 0);
  assert.ok(normMerchant("").length > 0);
});

/* ------------------------------------------------------------------ */
/*  Recurrence                                                         */
/* ------------------------------------------------------------------ */
const monthly = (n, day = 5) => Array.from({ length: n }, (_, i) => `2026-${String(i + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);

test("a monthly merchant is detected as monthly, with high confidence", () => {
  const r = inferRecurrence(monthly(6));
  assert.equal(r.recur, "monthly");
  assert.equal(r.level ?? "", "");
  assert.ok(r.confidence >= 0.7, `expected confident, got ${r.confidence}`);
});

test("a weekly merchant is detected as weekly", () => {
  const dates = ["2026-01-05", "2026-01-12", "2026-01-19", "2026-01-26", "2026-02-02"];
  assert.equal(inferRecurrence(dates).recur, "weekly");
});

test("a one-off is not offered as recurring", () => {
  assert.equal(inferRecurrence(["2026-01-05"]).recur, "once");
  assert.equal(inferRecurrence(["2026-01-05"]).confidence, 0);
});

test("two charges five months apart match nothing and stay a one-off", () => {
  assert.equal(inferRecurrence(["2026-01-05", "2026-06-05"]).recur, "once");
});

test("irregular spacing reports low confidence even when it lands on a frequency", () => {
  const tight = inferRecurrence(["2026-01-01", "2026-01-08", "2026-01-15", "2026-01-22", "2026-01-29"]);
  const loose = inferRecurrence(["2026-01-01", "2026-01-03", "2026-01-14", "2026-01-16", "2026-01-29"]);
  assert.equal(loose.recur, "weekly");
  assert.ok(loose.confidence < tight.confidence, `${loose.confidence} should be under ${tight.confidence}`);
  assert.ok(loose.confidence < 0.4, `expected low, got ${loose.confidence}`);
});

test("fewer charges means less confidence for the same spacing", () => {
  const two = inferRecurrence(monthly(2));
  const six = inferRecurrence(monthly(6));
  assert.equal(two.recur, "monthly");
  assert.ok(two.confidence < six.confidence);
});

/* ------------------------------------------------------------------ */
/*  End to end                                                         */
/* ------------------------------------------------------------------ */
const statement = () => {
  const rows = ["Date,Description,Amount"];
  for (const d of monthly(5, 1)) rows.push(`${d},RENT PAYMENT LANDLORD LLC,-1500.00`);
  let day = new Date("2026-01-06T00:00:00");
  for (let i = 0; i < 12; i++) {
    rows.push(`${day.toISOString().slice(0, 10)},SQ *BLUE BOTTLE COFFEE #${1000 + i} SEATTLE WA,-6.25`);
    day = new Date(day.getTime() + 7 * 86400000);
  }
  rows.push("2026-02-14,DELTA AIR LINES 0067788221,-412.80");
  rows.push("2026-01-20,PAYROLL DEPOSIT ACME CORP,3000.00");
  return rows.join("\n");
};

test("a statement yields the recurring merchants ticked and the one-off not", () => {
  const r = suggestExpenses(statement());
  assert.equal(r.ok, true);
  const by = (frag) => r.rows.find((x) => x.label.toUpperCase().includes(frag));
  const rent = by("RENT"), coffee = by("BLUE BOTTLE"), flight = by("DELTA");
  assert.equal(rent.recur, "monthly");
  assert.equal(rent.amount, 1500);
  assert.equal(rent.category, "housing");
  assert.equal(rent.pick, true);
  assert.equal(coffee.recur, "weekly");
  assert.equal(coffee.category, "food");
  assert.equal(coffee.pick, true);
  assert.equal(flight.recur, "once");
  assert.equal(flight.pick, false, "a single charge must not be pre-ticked");
  assert.ok(!r.rows.some((x) => x.label.toUpperCase().includes("PAYROLL")), "a deposit isn't an expense");
});

test("rows are ordered by what they cost a year", () => {
  const r = suggestExpenses(statement());
  const annual = r.rows.map((x) => x.annual);
  assert.deepEqual(annual, [...annual].sort((a, b) => b - a));
  assert.equal(r.rows[0].annual, 18000);
});

test("a merchant with swinging amounts is flagged as varying", () => {
  const rows = ["Date,Description,Amount"];
  const dates = ["2026-01-04", "2026-01-11", "2026-01-18", "2026-01-25"];
  const amts = [42, 180, 65, 210];
  dates.forEach((d, i) => rows.push(`${d},SAFEWAY STORE 1288,-${amts[i]}.00`));
  const row = suggestExpenses(rows.join("\n")).rows[0];
  assert.equal(row.varies, true);
  assert.equal(row.amount, 122.5, "the typical amount is the median, not the largest");
});

test("nextDue puts a created expense on its own schedule, in the future", () => {
  const row = { last: "2026-01-05", gap: 30.44 };
  const due = nextDue(row, "2026-03-01");
  assert.ok(due > "2026-03-01", due);
  assert.equal(nextDue({ last: "", gap: null }, "2026-03-01"), "2026-03-01");
});

test("toExpense produces a row the app can store", () => {
  const row = detectRecurring([
    { date: "2026-01-05", desc: "RENT PAYMENT", amount: 1500 },
    { date: "2026-02-05", desc: "RENT PAYMENT", amount: 1500 },
    { date: "2026-03-05", desc: "RENT PAYMENT", amount: 1500 },
  ])[0];
  const e = toExpense(row, "acct1", "2026-03-20", "x1");
  assert.deepEqual(Object.keys(e).sort(), ["amount", "category", "date", "fromAcct", "id", "label", "recur"]);
  assert.equal(e.category, "housing");
  assert.equal(e.recur, "monthly");
  assert.equal(e.fromAcct, "acct1");
  assert.ok(e.date > "2026-03-20");
});
