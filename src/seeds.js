// Default/example data shown on first load, and normalization helpers that backfill
// missing fields when loading older saved data or an imported JSON file.
import { n0, uid, todayISO, nextFirstISO, isSav, isInvest } from "./format.js";
import { perCheck, payrollOf } from "./payroll.js";

export const A_CHK = uid(), A_SAV = uid(), A_BRK = uid(), A_RET = uid();
export const D_EAR = uid(), D_MOH = uid();
export const SEED_ACCOUNTS = () => [
  { id: A_CHK, name: "Checking", type: "checking", balance: 6000, rate: 0 },
  { id: A_SAV, name: "HYSA", type: "savings", balance: 15000, rate: 4 },
  { id: A_BRK, name: "Brokerage", type: "brokerage", balance: 40000, rate: 7 },
  { id: A_RET, name: "Roth + 401k", type: "retirement", balance: 55000, rate: 7 },
];
export const SEED_DEBTS = () => [
  { id: D_EAR, name: "Earnest (private)", kind: "loan", balance: 18500, originalBalance: 18500, apr: 7.75, minPayment: 235, interestFrom: todayISO() },
  { id: D_MOH, name: "MOHELA (federal)", kind: "loan", balance: 24200, originalBalance: 24200, apr: 5.5, minPayment: 255, interestFrom: todayISO() },
];
/* interest accrues from the day you add a loan unless you push the date out for a deferment */
export const normDebts = (list) => (list || []).map((x) => ({ ...x, kind: x.kind === "card" ? "card" : "loan", interestFrom: x.interestFrom || todayISO() }));

export const normDist = (dist, fb) => {
  if (!Array.isArray(dist) || !dist.length) return [{ acctId: fb }];
  return dist.map((s, i) => i === 0 ? { acctId: s.acctId } : { acctId: s.acctId, mode: s.mode || "pct", value: s.value != null ? s.value : (s.pct != null ? s.pct : 0) });
};

export const normIncome = (list, fbAcct, retAcct) => (list || []).map((x) => ({
  ...x,
  weekdayAdj: x.weekdayAdj != null ? x.weekdayAdj : true,
  grossMode: x.grossMode || "paycheck",
  dist: normDist(x.dist, fbAcct),
  preTax: (x.preTax || []).map((p) => ({
    id: p.id || uid(),
    name: p.name || "Contribution",
    mode: p.mode || "amt",
    value: p.value != null ? p.value : (p.amount != null ? p.amount : 0),
    toAcct: p.toAcct || retAcct,
    counts: p.counts !== false,
  })),
  match: x.match ? { rate: x.match.rate != null ? x.match.rate : 100, limit: x.match.limit != null ? x.match.limit : 3, toAcct: x.match.toAcct || retAcct } : null,
  /* older saved data has a hand-typed "amount" (take-home) instead of a tax rate — back
     out the rate it implied so the projection doesn't change under existing users */
  changes: (x.changes || []).map((c) => {
    const grossMode = c.grossMode || x.grossMode || "year";
    let taxRate = c.taxRate;
    if (taxRate == null) {
      const gpc = perCheck(c.gross, grossMode, x.recur);
      const employee = gpc > 0 ? payrollOf(x, gpc).employee : 0;
      taxRate = gpc > 0 ? ((gpc - n0(c.amount) - employee) / gpc) * 100 : 0;
    }
    return { id: c.id || uid(), date: c.date || todayISO(), label: c.label || "Promotion", gross: c.gross != null ? c.gross : 0, grossMode, taxRate };
  }),
  bonus: x.bonus ? {
    mode: x.bonus.mode || "pct",
    value: x.bonus.value != null ? x.bonus.value : 0,
    date: x.bonus.date || todayISO(),
    withhold: x.bonus.withhold != null ? x.bonus.withhold : 30,
    preTaxApplies: x.bonus.preTaxApplies !== false,
  } : null,
}));
export const isCard = (x) => !!x && x.kind === "card";
export function pickIds(accts, dbts) {
  const chk = accts.find((a) => a.type === "checking") || accts[0] || {};
  const sav = accts.find((a) => isSav(a.type)) || chk;
  const brk = accts.find((a) => isInvest(a.type)) || chk;
  const ret = accts.find((a) => a.type === "retirement") || brk;
  const loans = (dbts || []).filter((x) => !isCard(x));
  const hi = [...loans].filter((x) => n0(x.balance) > 0).sort((a, b) => n0(b.apr) - n0(a.apr))[0] || loans[0] || {};
  return { chk: chk.id, sav: sav.id, brk: brk.id, ret: ret.id, hiDebt: hi.id };
}
export const seedIncome = (id) => [{
  id: uid(), name: "Take-home pay", amount: 3000, gross: 109200, grossMode: "year", date: todayISO(), recur: "biweekly", raise: 4, weekdayAdj: true,
  dist: [{ acctId: id.chk }, { acctId: id.sav, mode: "pct", value: 15 }],
  preTax: [{ id: uid(), name: "401k contribution", mode: "pct", value: 6, toAcct: id.ret, counts: true }],
  match: { rate: 100, limit: 3, toAcct: id.ret },
}];
export const seedExpenses = (id) => [
  { id: uid(), category: "Rent", amount: 1500, date: nextFirstISO(), recur: "monthly", fromAcct: id.chk },
  { id: uid(), category: "Groceries", amount: 110, date: todayISO(), recur: "weekly", fromAcct: id.chk },
  { id: uid(), category: "Dining out", amount: 60, date: todayISO(), recur: "weekly", fromAcct: id.chk },
  { id: uid(), category: "Utilities", amount: 140, date: nextFirstISO(), recur: "monthly", fromAcct: id.chk },
  { id: uid(), category: "Phone + internet", amount: 90, date: nextFirstISO(), recur: "monthly", fromAcct: id.chk },
  { id: uid(), category: "Car insurance", amount: 180, date: nextFirstISO(), recur: "quarterly", fromAcct: id.chk },
  { id: uid(), category: "Everything else", amount: 300, date: nextFirstISO(), recur: "monthly", fromAcct: id.chk },
];
export const seedTransfers = (id) => [{ id: uid(), name: "Auto-invest", amount: 800, date: nextFirstISO(), recur: "monthly", fromAcct: id.chk, toAcct: id.brk }];
export const seedDebtPays = (id, dbts) => {
  const list = (dbts || []).filter((x) => !isCard(x) && n0(x.balance) > 0).map((x) => ({
    id: uid(), name: x.name + " payment", amount: n0(x.minPayment), date: nextFirstISO(), recur: "monthly", fromAcct: id.chk, toDebt: x.id,
  }));
  if (id.hiDebt) list.push({ id: uid(), name: "Extra toward payoff", amount: 400, date: nextFirstISO(), recur: "monthly", fromAcct: id.chk, toDebt: id.hiDebt });
  return list;
};
export const seedSettings = () => ({ withdrawalRate: 4, redirect: true, mcVolatility: 15 });
