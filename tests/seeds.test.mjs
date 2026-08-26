// Unit tests for src/seeds.js — the normalization layer that backfills missing fields when
// older saved data (or an imported file) is loaded. This app has no backend and no
// migration history: whatever a returning visitor has in localStorage is fed straight
// through these functions, so they are the only thing standing between data saved by an
// earlier version and a broken projection. Pure JS, no browser, imported directly.
import { test } from "node:test";
import assert from "node:assert/strict";
import { normDist, normDebts, normIncome, normExpenses, pickIds, isCard, seedDebtPays, seedExpenses } from "../src/seeds.js";
import { isCategory, matchCategory } from "../src/format.js";
import { todayISO } from "../src/format.js";
import { salaryAt } from "../src/payroll.js";

/* ---------- normDist: how a paycheck is split across accounts ---------- */

test("normDist migrates a legacy `pct` split to the current mode/value shape", () => {
  const migrated = normDist([{ acctId: "a" }, { acctId: "b", pct: 20 }], "fallback");
  assert.deepEqual(migrated, [
    { acctId: "a" },
    { acctId: "b", mode: "pct", value: 20 },
  ], "an old percentage split should keep its 20% rather than silently becoming zero");
});

test("normDist defaults a split with neither value nor pct to zero rather than undefined", () => {
  const [, split] = normDist([{ acctId: "a" }, { acctId: "b" }], "fallback");
  assert.equal(split.value, 0);
  assert.equal(split.mode, "pct", "mode should default rather than be left missing");
});

test("normDist falls back to a single destination account when the list is missing or empty", () => {
  for (const input of [null, undefined, [], "not an array"]) {
    assert.deepEqual(normDist(input, "fallback"), [{ acctId: "fallback" }], `${JSON.stringify(input)} should produce the fallback destination`);
  }
});

test("normDist leaves the first entry as a bare destination — it takes whatever is left over", () => {
  const [first] = normDist([{ acctId: "a", mode: "pct", value: 90 }, { acctId: "b", mode: "pct", value: 10 }], "fallback");
  assert.deepEqual(first, { acctId: "a" }, "the remainder account carries no percentage of its own");
});

/* ---------- normDebts ---------- */

test("normDebts coerces any unrecognised kind to a loan, preserving only real cards", () => {
  const [odd, card] = normDebts([
    { id: "x", kind: "mortgage", balance: 5 },
    { id: "y", kind: "card", balance: 1, interestFrom: "2020-01-01" },
  ]);
  assert.equal(odd.kind, "loan", "an unknown kind should behave as a loan, not fall through the card branch");
  assert.equal(card.kind, "card");
});

test("normDebts backfills a missing 'interest starts' date to today, and keeps an existing one", () => {
  const [missing, existing] = normDebts([
    { id: "x", balance: 5 },
    { id: "y", balance: 5, interestFrom: "2020-01-01" },
  ]);
  assert.equal(missing.interestFrom, todayISO(), "a loan with no deferment date should start accruing now");
  assert.equal(existing.interestFrom, "2020-01-01", "an explicit deferment date must survive normalization");
});

test("normDebts tolerates a missing list", () => {
  assert.deepEqual(normDebts(null), []);
  assert.deepEqual(normDebts(undefined), []);
});

/* ---------- normIncome ---------- */

test("normIncome migrates a legacy pre-tax `amount` to `value` so the deduction keeps applying", () => {
  const [inc] = normIncome([{ id: "i", gross: 1000, recur: "monthly", preTax: [{ amount: 120 }] }], "CHK", "RET");
  assert.equal(inc.preTax[0].value, 120, "the old field's amount should carry over, not reset to zero");
  assert.equal(inc.preTax[0].mode, "amt", "a legacy dollar amount is a flat deduction");
  assert.equal(inc.preTax[0].toAcct, "RET", "an unrouted deduction should default to the retirement account");
  assert.equal(inc.preTax[0].counts, true, "deductions count toward the employer match unless told otherwise");
  assert.ok(inc.preTax[0].id, "every row needs an id for React keys and later edits");
});

test("normIncome preserves an explicit `counts: false` on a deduction", () => {
  const [inc] = normIncome([{ id: "i", gross: 1000, recur: "monthly", preTax: [{ mode: "pct", value: 5, counts: false }] }], "CHK", "RET");
  assert.equal(inc.preTax[0].counts, false, "a deduction excluded from the match must stay excluded");
});

test("normIncome fills in employer-match defaults but leaves an absent match null", () => {
  const [withMatch] = normIncome([{ id: "i", gross: 1000, recur: "monthly", match: {} }], "CHK", "RET");
  assert.deepEqual(withMatch.match, { rate: 100, limit: 3, toAcct: "RET" }, "a match with no detail should get the common 100%-up-to-3% shape");

  const [withoutMatch] = normIncome([{ id: "i", gross: 1000, recur: "monthly" }], "CHK", "RET");
  assert.equal(withoutMatch.match, null, "no match configured must stay no match, not become a default one");
});

test("normIncome fills in bonus defaults but leaves an absent bonus null", () => {
  const [withBonus] = normIncome([{ id: "i", gross: 1000, recur: "monthly", bonus: {} }], "CHK", "RET");
  assert.equal(withBonus.bonus.mode, "pct");
  assert.equal(withBonus.bonus.value, 0);
  assert.equal(withBonus.bonus.withhold, 30);
  assert.equal(withBonus.bonus.preTaxApplies, true);

  const [withoutBonus] = normIncome([{ id: "i", gross: 1000, recur: "monthly" }], "CHK", "RET");
  assert.equal(withoutBonus.bonus, null);
});

test("normIncome defaults weekdayAdj on, and grossMode to a per-paycheck figure", () => {
  const [defaulted] = normIncome([{ id: "i", gross: 1000, recur: "monthly" }], "CHK", "RET");
  assert.equal(defaulted.weekdayAdj, true, "pay dates shift off weekends unless the user turned that off");
  assert.equal(defaulted.grossMode, "paycheck");

  const [explicit] = normIncome([{ id: "i", gross: 1000, recur: "monthly", weekdayAdj: false, grossMode: "year" }], "CHK", "RET");
  assert.equal(explicit.weekdayAdj, false, "an explicit false must not be overwritten by the default");
  assert.equal(explicit.grossMode, "year");
});

test("normIncome backfills promotion fields, defaulting the tax rate from a legacy take-home", () => {
  // The counterpart of the engine test that checks the derived take-home still matches:
  // here we're checking the surrounding fields don't come back undefined.
  const [inc] = normIncome([{
    id: "i", gross: 4000, grossMode: "paycheck", recur: "biweekly", amount: 2800,
    changes: [{ gross: 5000, amount: 3400 }],
  }], "CHK", "RET");
  const [change] = inc.changes;
  assert.ok(change.id, "a migrated promotion needs an id");
  assert.equal(change.date, todayISO(), "a promotion with no date defaults to today rather than an invalid date");
  assert.equal(change.label, "Promotion");
  assert.equal(change.grossMode, "paycheck", "the promotion inherits the income's gross mode");
  assert.ok(change.taxRate > 0, "a tax rate should have been derived from the legacy take-home figure");
});

test("normIncome leaves an already-current promotion's tax rate untouched", () => {
  const [inc] = normIncome([{
    id: "i", gross: 4000, grossMode: "paycheck", recur: "biweekly",
    changes: [{ id: "c1", date: "2027-01-01", gross: 5000, grossMode: "paycheck", taxRate: 22 }],
  }], "CHK", "RET");
  assert.equal(inc.changes[0].taxRate, 22, "re-normalizing current data must be a no-op, not a re-derivation");
});

test("normalizing twice is stable — loading, saving and reloading can't drift the data", () => {
  // Every page load runs saved data back through normIncome, so it has to be idempotent.
  const raw = [{
    id: "i", gross: 4000, grossMode: "paycheck", recur: "biweekly", amount: 2800,
    preTax: [{ amount: 120 }], match: {}, bonus: {},
    dist: [{ acctId: "a" }, { acctId: "b", pct: 20 }],
    changes: [{ id: "c1", date: "2027-01-01", gross: 5000, amount: 3400 }],
  }];
  const once = normIncome(raw, "CHK", "RET");
  const twice = normIncome(once, "CHK", "RET");
  // preTax ids are generated when missing, so compare everything else structurally.
  assert.deepEqual(
    { ...twice[0], preTax: twice[0].preTax.map(({ id, ...r }) => r) },
    { ...once[0], preTax: once[0].preTax.map(({ id, ...r }) => r) },
    "a second pass should change nothing",
  );
  assert.equal(
    salaryAt(twice[0], new Date(2028, 0, 1)).amount,
    salaryAt(once[0], new Date(2028, 0, 1)).amount,
    "and the projected salary must not drift between loads",
  );
});

test("normIncome tolerates a missing list", () => {
  assert.deepEqual(normIncome(null, "CHK", "RET"), []);
});

/* ---------- pickIds: the fallback chain for default account routing ---------- */

test("pickIds falls back through account types when the preferred one is absent", () => {
  const noChecking = pickIds([{ id: "s", type: "savings" }, { id: "b", type: "brokerage" }], []);
  assert.equal(noChecking.chk, "s", "with no checking account, the first account stands in");
  assert.equal(noChecking.sav, "s");
  assert.equal(noChecking.brk, "b");
  assert.equal(noChecking.ret, "b", "with no retirement account, the brokerage stands in");

  const onlyChecking = pickIds([{ id: "c", type: "checking" }], []);
  assert.deepEqual(onlyChecking, { chk: "c", sav: "c", brk: "c", ret: "c", hiDebt: undefined },
    "a single checking account has to serve every role");
});

test("pickIds picks the highest-APR loan with a balance as the extra-payment target", () => {
  const ids = pickIds([{ id: "c", type: "checking" }], [
    { id: "lo", kind: "loan", balance: 100, apr: 3 },
    { id: "hi", kind: "loan", balance: 100, apr: 9 },
    { id: "cc", kind: "card", balance: 999, apr: 24 },
  ]);
  assert.equal(ids.hiDebt, "hi", "cards are excluded, so the 24% card must not win over the 9% loan");
});

test("pickIds ignores paid-off loans when choosing a payoff target, but still names one", () => {
  const ids = pickIds([{ id: "c", type: "checking" }], [
    { id: "cleared", kind: "loan", balance: 0, apr: 20 },
    { id: "live", kind: "loan", balance: 500, apr: 4 },
  ]);
  assert.equal(ids.hiDebt, "live", "a cleared loan shouldn't attract extra payments");
});

test("pickIds on empty inputs yields undefined ids rather than throwing", () => {
  // Worth pinning: a user who deletes every account reaches this, and the ids flow
  // straight into seeded income/expenses as `fromAcct`/`toAcct`.
  const ids = pickIds([], []);
  assert.deepEqual(ids, { chk: undefined, sav: undefined, brk: undefined, ret: undefined, hiDebt: undefined });
});

/* ---------- small helpers ---------- */

test("isCard is safe on missing debts", () => {
  assert.equal(isCard({ kind: "card" }), true);
  assert.equal(isCard({ kind: "loan" }), false);
  assert.equal(isCard(null), false);
  assert.equal(isCard(undefined), false);
});

test("seedDebtPays skips cards and cleared loans, and only adds an extra payment when there's a target", () => {
  const none = seedDebtPays({ chk: "C", hiDebt: null }, [{ id: "z", kind: "loan", balance: 0, minPayment: 10, name: "Z" }]);
  assert.deepEqual(none, [], "nothing to pay means no seeded payments at all");

  const seeded = seedDebtPays({ chk: "C", hiDebt: "l" }, [
    { id: "l", kind: "loan", balance: 1000, minPayment: 50, name: "Loan" },
    { id: "cc", kind: "card", balance: 500, minPayment: 25, name: "Card" },
  ]);
  assert.equal(seeded.length, 2, "one minimum payment for the loan, plus the extra-toward-payoff row");
  assert.equal(seeded[0].toDebt, "l");
  assert.equal(seeded[0].amount, 50);
  assert.equal(seeded[1].name, "Extra toward payoff");
  assert.ok(!seeded.some((p) => p.toDebt === "cc"), "cards get a pay-in-full payment elsewhere, not a seeded minimum");
});

/* ---------- expense categories ---------- */

test("the old free-text category becomes the row's name, and a fixed category is matched from it", () => {
  const [rent, groceries, car] = normExpenses([
    { id: "1", category: "Rent", amount: 1500 },
    { id: "2", category: "Groceries", amount: 110 },
    { id: "3", category: "Car insurance", amount: 180 },
  ]);
  assert.equal(rent.label, "Rent");
  assert.equal(rent.category, "housing");
  assert.equal(groceries.label, "Groceries");
  assert.equal(groceries.category, "food");
  assert.equal(car.label, "Car insurance");
  assert.equal(car.category, "insurance", "insurance beats transport for a car policy");
});

test("a category the list doesn't recognise lands in Other rather than being dropped", () => {
  const [e] = normExpenses([{ id: "1", category: "Alpaca boarding", amount: 90 }]);
  assert.equal(e.label, "Alpaca boarding", "what was typed is never lost");
  assert.equal(e.category, "other");
});

test("normalizing is idempotent — a migrated expense survives a second pass unchanged", () => {
  const once = normExpenses([{ id: "1", category: "Rent", amount: 1500 }]);
  assert.deepEqual(normExpenses(once), once);
});

test("an expense with neither label nor category still gets both", () => {
  const [e] = normExpenses([{ id: "1", amount: 40 }]);
  assert.equal(e.label, "Expense");
  assert.equal(e.category, "other");
  assert.ok(isCategory(e.category));
});

test("every seeded expense already carries a fixed category", () => {
  for (const e of seedExpenses({ chk: "C" })) {
    assert.ok(isCategory(e.category), `${e.label} has category ${e.category}`);
    assert.ok(e.label, "and a name of its own");
  }
});

test("matchCategory resolves the words that belong to two buckets", () => {
  assert.equal(matchCategory("Gas bill"), "housing");
  assert.equal(matchCategory("Shell gas station"), "transport");
  assert.equal(matchCategory("Renters insurance"), "insurance");
  assert.equal(matchCategory(""), "other");
  assert.equal(matchCategory(null), "other");
});
