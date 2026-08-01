// One entry point for everything expensive: the projection, the minimums-only comparison,
// the two what-if runs, and the Monte Carlo. Pure JS, no React and no DOM — which is what
// lets the same code run on the main thread, inside src/worker.js, and in a Node test.
//
// Nothing here decides anything the derived-state memo used to decide differently; this is
// a seam, not a behaviour change. Everything cheap (colours, monthly averages, formatting)
// deliberately stays on the main thread, because most of it is closures that could never
// cross a postMessage boundary anyway.
import { n0, toReal, isInvest, WPY, parseDate, DAY } from "./format.js";
import { simulateWeekly, projectMinWeekly, WEEKS } from "./engine.js";
import { runMonteCarlo } from "./montecarlo.js";
import { hasPromotions, withoutPromotions } from "./payroll.js";

/* when each strategy clears its first loan — snowball's whole appeal is that this comes
   sooner, which total interest alone never shows */
const firstClear = (s) => {
  const ws = Object.values(s.payoffWeek).filter((w) => w != null);
  return ws.length ? Math.min(...ws) : null;
};

/* The blended expected return for the Monte Carlo: one figure across invested accounts,
   weighted by today's balance, since modeling each account as an independent random walk
   would overstate diversification that may not really be there. Real, like everything the
   engine produces — the contributions it rides on are already in today's dollars. */
export function blendedReturn(accounts, inflation) {
  const invested = accounts.filter((a) => isInvest(a.type));
  const total = invested.reduce((s, a) => s + n0(a.balance), 0);
  const nominal = total > 0
    ? invested.reduce((s, a) => s + n0(a.rate) * n0(a.balance), 0) / total
    : 7;
  return toReal(nominal, inflation) / 100;
}

/* The week retirement starts in the Monte Carlo, and the week the test ends.
   `mcRetireDate` overrides the projection's own FI date; the horizon runs to `mcEndAge`
   when a birth year is on file and `mcYears` otherwise. */
export function retirementWindow(settings, start, fireWeek) {
  const weekOf = (date) => (parseDate(date) - start) / DAY / 7;
  let retireWeek = fireWeek == null ? null : fireWeek;
  if (settings.mcRetireDate) {
    const w = weekOf(settings.mcRetireDate);
    if (isFinite(w)) retireWeek = Math.max(0, Math.round(w));
  }
  const birthYear = n0(settings.birthYear);
  const years = birthYear > 0
    ? Math.max(1, (birthYear + (n0(settings.mcEndAge) || 95)) - start.getFullYear())
    : (retireWeek == null ? 0 : retireWeek / WPY) + (n0(settings.mcYears) || 30);
  return { retireWeek, horizonWeeks: Math.min(WEEKS, Math.round(years * WPY)) };
}

const cfgOf = (input) => {
  const { accounts, debts, expenses, transfers, debtPayments, settings, weeks } = input;
  const start = input.start instanceof Date ? input.start : new Date(input.start);
  return { accounts, debts, expenses, transfers, debtPayments, settings, start, weeks: weeks || WEEKS };
};

/**
 * The primary projection — the one every chart draws — plus the minimums-only comparison
 * and the Monte Carlo. This is what a first paint after a keystroke needs; the two what-if
 * runs are deliberately not here (see projectComparisons).
 * @param {object} input - the whole projection input, all structured-cloneable
 */
export function project(input) {
  const { accounts, debts, income, settings } = input;
  const { start, weeks } = cfgOf(input);
  const horizon = weeks;
  const simCfg = cfgOf(input);

  const hasHypo = hasPromotions(income);
  const hypoOn = settings.hypotheticals !== false;
  /* the projection every chart draws: promotions included unless the toggle says otherwise */
  const sim = simulateWeekly({ ...simCfg, income: hypoOn ? income : withoutPromotions(income) });
  const minW = projectMinWeekly(debts, start, horizon, settings.inflation);
  const maxW = Math.min(horizon, Math.max(sim.fire || 520, (sim.debtFree || 260) + 130, 260) + 60);

  const { retireWeek, horizonWeeks } = retirementWindow(settings, start, sim.fire);
  /* The Monte Carlo models the invested portfolio, not the whole balance sheet, so it can't
     fairly be charged the whole retirement. Cash, savings and paid-down debt do part of the
     work — the invested pot covers the share of spending it represents at the retirement
     date, and the rest is assumed to come from the rest, pro rata. Charging it everything
     would report a scary survival number for a plan that is actually fine. */
  const atRetire = sim.series[Math.max(0, Math.min(retireWeek == null ? 0 : retireWeek, sim.series.length - 1))];
  const spendableThen = atRetire ? n0(atRetire.spendable) : 0;
  const investShare = spendableThen > 0 ? Math.min(1, n0(atRetire.invest) / spendableThen) : 1;
  const mcReturn = blendedReturn(accounts, settings.inflation);
  const mc = runMonteCarlo({
    series: sim.series,
    weeks: Math.max(maxW, horizonWeeks),
    annualReturn: mcReturn,
    annualVolatility: n0(settings.mcVolatility) / 100,
    fireNumber: sim.fireNumber,
    retireWeek,
    annualSpend: sim.annualExpNet * investShare,
    horizonWeeks,
    /* the goal seeker searches at reduced trials and confirms the winner at full fidelity */
    ...(n0(settings.mcTrials) > 0 ? { trials: n0(settings.mcTrials) } : {}),
  });
  mc.investShare = investShare;

  return {
    sim, minW, mc, mcReturn, maxW, hasHypo, hypoOn, retireWeek, horizonWeeks,
    interestSaved: Math.max(0, minW.interest - sim.interest),
    wksSaved: Math.max(0, (minW.clearedWeek == null ? horizon : minW.clearedWeek) - (sim.debtFree == null ? horizon : sim.debtFree)),
  };
}

/**
 * The two what-if runs, given the primary projection that's already been computed: one
 * drops planned promotions so the Overview can price them, the other flips the payoff
 * strategy so the Debt tab can. Split out because they're two more full simulations and
 * nothing on a first paint reads them.
 */
export function projectComparisons(input, sim) {
  const { income, settings, debts } = input;
  const simCfg = cfgOf(input);
  const horizon = simCfg.weeks;
  const hasHypo = hasPromotions(income);
  const hypoOn = settings.hypotheticals !== false;

  const simWith = hypoOn ? sim : simulateWeekly({ ...simCfg, income });
  const simWithout = hasHypo ? (hypoOn ? simulateWeekly({ ...simCfg, income: withoutPromotions(income) }) : sim) : simWith;

  const otherOrder = settings.payoffOrder === "snowball" ? "avalanche" : "snowball";
  const canCompare = debts.filter((x) => x.kind !== "card" && n0(x.balance) > 0).length > 1;
  let strategy = null;
  if (canCompare) {
    const simAlt = simulateWeekly({
      ...simCfg,
      income: hypoOn ? income : withoutPromotions(income),
      settings: { ...settings, payoffOrder: otherOrder },
    });
    strategy = {
      order: settings.payoffOrder, other: otherOrder,
      interestDelta: simAlt.interest - sim.interest,          /* >0: this plan is cheaper */
      freeDelta: (simAlt.debtFree == null ? horizon : simAlt.debtFree) - (sim.debtFree == null ? horizon : sim.debtFree),
      firstDelta: (firstClear(simAlt) == null ? horizon : firstClear(simAlt)) - (firstClear(sim) == null ? horizon : firstClear(sim)),
    };
  }
  return { simWith, simWithout, strategy };
}

/**
 * The oldest question in personal finance, answered with the plan rather than a rule of
 * thumb: send the same monthly amount to debt, or to investing, and see which balance sheet
 * is bigger at the end. Two extra projections, so it runs on the Debt tab's own request.
 */
export function payoffVsInvest(input, amount = 200) {
  const start = input.start instanceof Date ? input.start : new Date(input.start);
  const base = project(input);
  const at = (r) => r.sim.series[Math.min(base.maxW, r.sim.series.length - 1)];
  const from = (input.accounts || []).find((a) => a.type === "checking") || (input.accounts || [])[0] || {};
  const loan = (input.debts || []).filter((d) => d.kind !== "card" && n0(d.balance) > 0)
    .sort((a, b) => n0(b.apr) - n0(a.apr))[0];
  const invested = (input.accounts || []).find((a) => isInvest(a.type));
  if (!loan || !invested) return null;

  const iso = new Date(start.getTime()).toISOString().slice(0, 10);
  const toDebt = project({
    ...input,
    debtPayments: [...(input.debtPayments || []), { id: "cmp-debt", name: "Comparison extra", amount, date: iso, recur: "monthly", fromAcct: from.id, toDebt: loan.id }],
  });
  const toInvest = project({
    ...input,
    transfers: [...(input.transfers || []), { id: "cmp-inv", name: "Comparison investing", amount, date: iso, recur: "monthly", fromAcct: from.id, toAcct: invested.id }],
  });
  return {
    amount, week: base.maxW,
    loanName: loan.name, loanApr: n0(loan.apr), realApr: toReal(n0(loan.apr), input.settings.inflation),
    realReturn: blendedReturn(input.accounts, input.settings.inflation) * 100,
    debtNw: at(toDebt).nw, investNw: at(toInvest).nw,
    debtFreeWithDebt: toDebt.sim.debtFree, debtFreeWithInvest: toInvest.sim.debtFree,
  };
}

/* everything at once — the synchronous path, used when Workers aren't available */
export function projectAll(input) {
  const primary = project(input);
  const out = { ...primary, ...projectComparisons(input, primary.sim) };
  if (input.compare) {
    const cmp = project({ ...input.compare, start: input.start, weeks: input.weeks });
    out.compare = { sim: cmp.sim, maxW: cmp.maxW, retireWeek: cmp.retireWeek };
  }
  return out;
}
