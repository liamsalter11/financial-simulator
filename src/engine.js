// The simulation engine: projects account balances, debt payoff, and net worth forward
// week by week. Pure JS, no React dependency — this is what tests/engine.test.mjs
// imports directly.
import { n0, num, r2, addDays, parseDate, DAY, isInvest, OPY, toReal, inflFactor, WPY } from "./format.js";
import { firesInWeek } from "./recurrence.js";
import { salaryAt, bonusOf } from "./payroll.js";
import { minPaymentOf } from "./loan.js";

export const WEEKS = 2080; // ~40 years — the simulation horizon

/* Which loan a spare dollar goes to once its own target is clear. Avalanche (highest rate
   first) costs the least interest; snowball (smallest balance first) clears individual
   loans sooner, which is the point of it. Both are offered because the cheaper plan isn't
   always the one someone actually sticks to. */
export const payoffSort = (order) => (order === "snowball"
  ? (a, b) => a.bal - b.bal || b.apr - a.apr
  : (a, b) => b.apr - a.apr || a.bal - b.bal);

/* ================================================================== */
/*  Engines                                                            */
/* ================================================================== */
/* minimum-payments-only debt path, weekly resolution */
export function projectMinWeekly(debts, start, weeks, inflation) {
  const infl = num(inflation);
  const d = debts.filter((x) => x.kind !== "card" && n0(x.balance) > 0).map((x) => ({ apr: toReal(n0(x.apr), infl), min: minPaymentOf(x), bal: n0(x.balance) }));
  const series = new Array(weeks + 1);
  let prevMonth = start.getFullYear() * 12 + start.getMonth();
  let interest = 0, clearedWeek = null;
  for (let w = 0; w <= weeks; w++) {
    const tot = d.reduce((s, x) => s + Math.max(0, x.bal), 0);
    series[w] = r2(tot);
    if (clearedWeek === null && d.length && tot <= 0.5) clearedWeek = w;
    if (w === weeks) break;
    const ws = addDays(start, w * 7), we = addDays(ws, 7);
    const cm = we.getFullYear() * 12 + we.getMonth();
    if (cm !== prevMonth) {
      prevMonth = cm;
      /* a loan payment is fixed in nominal dollars, so in today's money it shrinks */
      const defl = 1 / inflFactor(infl, w);
      for (const x of d) {
        if (x.bal <= 0) continue;
        const i = x.bal * (x.apr / 1200); x.bal += i; interest += i;
        const p = Math.min(x.min * defl, x.bal); x.bal -= p; if (x.bal <= 0.005) x.bal = 0;
      }
    }
  }
  return { series, interest, clearedWeek };
}

/* full weekly account-level simulation */
export function simulateWeekly(cfg) {
  const { accounts, debts, income, expenses, transfers, debtPayments, settings, start, weeks } = cfg;
  /* Everything below runs in today's dollars, so every nominal rate the user entered —
     account returns, debt APRs, annual raises, promotion salaries — is converted to a real
     one first, and cash flows fixed in nominal terms (loan payments) lose value as they go.
     At 0% inflation every conversion is the identity, which is what the older tests assert. */
  const infl = num(settings.inflation);
  const nextLoan = payoffSort(settings.payoffOrder);
  const dLimit = n0(settings.deferralLimit); /* annual pre-tax deferral cap; 0 = no cap */
  const A = accounts.map((a) => {
    let asOf = start;
    if (a.asOf) { const d2 = parseDate(a.asOf); if (!isNaN(d2)) asOf = d2; }
    return {
      id: a.id, type: a.type, bal: n0(a.balance), wr: Math.pow(1 + toReal(num(a.rate), infl) / 100, 1 / WPY) - 1,
      cap: (a.cap === "" || a.cap == null) ? null : n0(a.cap),
      spillTo: a.spillTo || "", spillEvery: a.spillEvery === "weekly" ? "weekly" : "monthly",
      asOf,
    };
  });
  const byId = Object.fromEntries(A.map((a) => [a.id, a]));
  const fallback = A.find((a) => a.type === "checking") || A[0];
  const investAcct = A.find((a) => isInvest(a.type)) || fallback;
  /* where money lands once there's no debt left to throw it at — explicit, not list order */
  const overflowAcct = byId[settings.overflowTo] || investAcct;
  const d = debts.map((x) => ({ id: x.id, apr: toReal(n0(x.apr), infl), bal: n0(x.balance), kind: x.kind === "card" ? "card" : "loan", carried: n0(x.balance), interestFrom: x.interestFrom || "" }));
  const dById = Object.fromEntries(d.map((x) => [x.id, x]));
  const hasLoans = d.some((x) => x.kind !== "card" && x.bal > 0);
  /* FI target is built from long-run spending: anything with an end date inside the
     horizon (tuition, a car loan) isn't a forever cost, so it shouldn't inflate the target. */
  const longRunAt = new Date(start.getTime() + 10 * 365.25 * DAY);
  const recurring = expenses.filter((e) => e.recur !== "once");
  const annualExpNow = recurring.reduce((s, e) => s + n0(e.amount) * OPY[e.recur], 0);
  const endingSoon = recurring.filter((e) => { if (!e.end) return false; const ed = parseDate(e.end); return !isNaN(ed) && ed < longRunAt; });
  const annualExp = recurring.reduce((s, e) => {
    if (e.end) { const ed = parseDate(e.end); if (!isNaN(ed) && ed < longRunAt) return s; }
    return s + n0(e.amount) * OPY[e.recur];
  }, 0);
  const fireNumber = n0(settings.withdrawalRate) > 0 ? annualExp * (100 / n0(settings.withdrawalRate)) : 0;

  let basis = A.filter((a) => isInvest(a.type)).reduce((s, a) => s + a.bal, 0);
  const series = []; const payoffWeek = {};
  /* per-income deferral tracking: how much has gone in this calendar year, and — the part
     worth telling someone about — when the cap bit and what employer match that cost */
  const ytd = {}; const capInfo = {};
  const noteCap = (id, week, year, lostMatch) => {
    const ci = capInfo[id] || (capInfo[id] = { week, year, lostMatch: 0 });
    if (ci.year === year) ci.lostMatch += Math.max(0, lostMatch);
  };
  let debtFree = null, fire = null, interest = 0, cardInterest = 0;
  if (!A.length) return { series: [{ w: 0, nw: 0, debt: 0, loanDebt: 0, invest: 0, basis: 0, acct: {}, dbt: {}, inflow: 0, outflow: 0, charged: 0, pretax: 0 }], debtFree: null, fire: null, fireNumber, annualExp, annualExpNow, endingSoon, payoffWeek, interest: 0, cardInterest: 0, capInfo };

  /* an account balance dated in the past gets caught up to today first: this pre-roll
     re-runs ordinary cash flow from the earliest as-of date up to today, but only for
     the account(s) whose as-of date has arrived — every other account (default: valid
     as of today) stays frozen at its entered balance throughout. Debts are never rolled
     back; the entered debt balance is always taken as true as of today, so no interest,
     paydown or card charges happen during the pre-roll. */
  const earliestAsOf = A.reduce((min, a) => (a.asOf < min ? a.asOf : min), start);
  const preWeeks = Math.min(260, Math.max(0, Math.ceil((start - earliestAsOf) / (7 * DAY))));
  const origin = addDays(start, -preWeeks * 7);
  let prevMonth = origin.getFullYear() * 12 + origin.getMonth();
  let prevYear = origin.getFullYear();

  for (let w = 0; w <= preWeeks + weeks; w++) {
    const isPreRoll = w < preWeeks;
    const ws = addDays(origin, w * 7), we = addDays(ws, 7);
    /* what a nominally-fixed dollar in this week is worth in today's money */
    const defl = 1 / inflFactor(infl, w - preWeeks);
    const year = ws.getFullYear();
    if (year !== prevYear) { prevYear = year; for (const k in ytd) ytd[k] = 0; }
    /* an account whose as-of date hasn't arrived yet (still in the future relative to
       this week) is frozen — these two helpers are the single place that's enforced,
       and both report back how much actually landed so the week's totals stay honest */
    const credit = (t, amt) => { if (amt && ws >= t.asOf) { t.bal += amt; if (isInvest(t.type)) basis += amt; return amt; } return 0; };
    const debit = (t, amt) => { if (amt && ws >= t.asOf) { t.bal -= amt; return amt; } return 0; };

    let snap = null;
    if (!isPreRoll) {
      const debtTotal = d.reduce((s, x) => s + Math.max(0, x.bal), 0);
      const loanTotal = d.reduce((s, x) => s + (x.kind === "card" ? 0 : Math.max(0, x.bal)), 0);
      const acct = {}; for (const a of A) acct[a.id] = r2(a.bal);
      const dbt = {}; for (const x of d) dbt[x.id] = r2(Math.max(0, x.bal));
      for (const x of d) if (x.kind !== "card" && x.bal <= 0.005 && payoffWeek[x.id] == null) payoffWeek[x.id] = w - preWeeks;
      const invest = A.filter((a) => isInvest(a.type)).reduce((s, a) => s + a.bal, 0);
      const nw = A.reduce((s, a) => s + a.bal, 0) - debtTotal;
      snap = { w: w - preWeeks, nw: r2(nw), debt: r2(debtTotal), loanDebt: r2(loanTotal), invest: r2(invest), basis: r2(basis), acct, dbt, inflow: 0, outflow: 0, charged: 0, swept: 0, pretax: 0 };
      series.push(snap);
      if (debtFree === null && hasLoans && loanTotal <= 0.5) debtFree = w - preWeeks;
      if (fire === null && fireNumber > 0 && nw >= fireNumber) fire = w - preWeeks;
    }
    if (w === preWeeks + weeks) break;

    for (const a of A) if (ws >= a.asOf) a.bal *= (1 + a.wr);
    const cm = we.getFullYear() * 12 + we.getMonth();
    const monthTurn = cm !== prevMonth;
    if (monthTurn) {
      prevMonth = cm;
      if (!isPreRoll) {
        for (const x of d) {
          /* a subsidised loan in deferment doesn't accrue — "interest starts" holds it off */
          if (x.interestFrom) { const f = parseDate(x.interestFrom); if (!isNaN(f) && ws < f) continue; }
          /* cards only charge interest on a carried balance — pay in full and there's none */
          const base = x.kind === "card" ? Math.max(0, x.carried) : x.bal;
          if (base > 0.005) {
            const i = base * (x.apr / 1200);
            x.bal += i; x.carried += i; interest += i;
            if (x.kind === "card") cardInterest += i;
          }
          /* statement close: whatever is on the card now is what next month's interest is
             charged on, unless a payment clears it first (both the scheduled-payment and
             cap-sweep paths reset `carried` when they pay a card down). Purchases made
             during the coming cycle don't join it until the next close — that grace period
             is what makes "pay the statement in full, owe nothing" come out right, while
             still charging a card that simply accumulates spending and is never paid. */
          if (x.kind === "card") x.carried = Math.max(0, x.bal);
        }
      }
    }

    let inflow = 0, outflow = 0, charged = 0, pretax = 0;
    for (const inc of income) {
      const sal = salaryAt(inc, ws, { inflation: infl, start });
      const yrs = Math.max(0, Math.floor((ws - sal.anchor) / (365.25 * DAY)));
      const growth = Math.pow(1 + toReal(num(inc.raise), infl) / 100, yrs);
      const payTo = (dist, total) => {
        const list = (dist && dist.length) ? dist : [{ acctId: fallback.id }];
        let used = 0, applied = 0;
        for (let i = 1; i < list.length; i++) {
          const sp = list[i];
          const want = sp.mode === "amt" ? n0(sp.value) : total * num(sp.value) / 100;
          const give = Math.min(want, Math.max(0, total - used));
          applied += credit(byId[sp.acctId] || fallback, give);
          used += give;
        }
        const restAmt = Math.max(0, total - used);
        applied += credit(byId[list[0].acctId] || fallback, restAmt);
        return applied;
      };
      const n = firesInWeek(inc, ws, we);
      if (n) {
        const amt = sal.amount * growth * n;
        const list = (inc.dist && inc.dist.length) ? inc.dist : [{ acctId: fallback.id }];
        let used = 0, applied = 0;
        for (let i = 1; i < list.length; i++) {
          const sp = list[i];
          const want = sp.mode === "amt" ? n0(sp.value) * n : amt * num(sp.value) / 100;
          const give = Math.min(want, Math.max(0, amt - used));
          applied += credit(byId[sp.acctId] || fallback, give);
          used += give;
        }
        const rest = Math.max(0, amt - used);
        applied += credit(byId[list[0].acctId] || fallback, rest);
        inflow += applied;
        /* payroll deductions never reach take-home, so they're added on top and land
           straight in their account. Percentages are of gross, which is why gross is asked for. */
        const gross = sal.gross * growth * n;
        let matchable = 0, matchableFull = 0, capped = false;
        for (const pt of (inc.preTax || [])) {
          let p = pt.mode === "pct" ? gross * num(pt.value) / 100 : n0(pt.value) * growth * n;
          if (p <= 0) continue;
          const full = p;
          /* the annual deferral cap stops the contribution mid-year. The limit is a real
             figure — the IRS raises it with inflation — so it isn't deflated here. */
          if (dLimit > 0 && pt.capped !== false) {
            const room = Math.max(0, dLimit - n0(ytd[inc.id]));
            if (p > room) { p = room; capped = true; }
            ytd[inc.id] = n0(ytd[inc.id]) + p;
          }
          if (p > 0) pretax += credit(byId[pt.toAcct] || investAcct, p);
          if (pt.counts !== false) { matchable += p; matchableFull += full; }
        }
        /* "100% up to 3%" = match every dollar you put in, but only on the first 3% of gross */
        const mt = inc.match;
        const hitCap = capped && !isPreRoll;
        if (mt && gross > 0 && n0(mt.rate) > 0) {
          const ceiling = gross * num(mt.limit) / 100;
          const m = matchable > 0 ? Math.min(matchable, ceiling) * n0(mt.rate) / 100 : 0;
          if (m > 0) pretax += credit(byId[mt.toAcct] || investAcct, m);
          /* a match paid per paycheck stops when the deferral it rides on stops — that
             lost match is what front-loading into the cap actually costs */
          if (hitCap) {
            const mFull = matchableFull > 0 ? Math.min(matchableFull, ceiling) * n0(mt.rate) / 100 : 0;
            noteCap(inc.id, w - preWeeks, year, mFull - m);
          }
        } else if (hitCap) noteCap(inc.id, w - preWeeks, year, 0);
      }
      /* the bonus lands once a year on its own date, not with a paycheck */
      const bn = inc.bonus;
      if (bn && n0(bn.value) > 0 && bn.date) {
        const hits = firesInWeek({ date: bn.date, recur: "yearly", end: inc.end, weekdayAdj: inc.weekdayAdj }, ws, we);
        if (hits) {
          const b = bonusOf(inc, growth, sal.gross);
          if (b) {
            inflow += payTo(inc.dist, b.net * hits);
            let def = b.deferral * hits, mtch = b.match * hits;
            if (def > 0 && dLimit > 0) {
              const room = Math.max(0, dLimit - n0(ytd[inc.id]));
              if (def > room) {
                /* the match rides on the deferral, so it's trimmed in the same proportion */
                const kept = room / def;
                if (!isPreRoll) noteCap(inc.id, w - preWeeks, year, mtch * (1 - kept));
                mtch *= kept; def = room;
              }
              ytd[inc.id] = n0(ytd[inc.id]) + def;
            }
            if (def > 0) pretax += credit(byId[((inc.preTax || [])[0] || {}).toAcct] || investAcct, def);
            if (mtch > 0) pretax += credit(byId[(inc.match || {}).toAcct] || investAcct, mtch);
          }
        }
      }
    }
    for (const ex of expenses) {
      const n = firesInWeek(ex, ws, we); if (!n) continue;
      const amt = n0(ex.amount) * n;
      const card = dById[ex.fromAcct];
      if (card && card.kind === "card") { if (!isPreRoll) { card.bal += amt; charged += amt; } }
      else { outflow += debit(byId[ex.fromAcct] || fallback, amt); }
    }
    for (const tr of transfers) {
      const n = firesInWeek(tr, ws, we); if (!n) continue; const amt = n0(tr.amount) * n;
      const src = byId[tr.fromAcct] || fallback;
      if (ws < src.asOf) continue; // a frozen account can't fund a transfer
      debit(src, amt);
      credit(byId[tr.toAcct] || investAcct, amt);
    }
    for (const dp of debtPayments) {
      const n = firesInWeek(dp, ws, we); if (!n) continue;
      const src = byId[dp.fromAcct] || fallback;
      if (ws < src.asOf) continue; // a frozen account can't fund a payment
      const target = dById[dp.toDebt];
      const cardTarget = !!(target && target.kind === "card");
      if (isPreRoll) {
        /* the debt's current balance is already known, so a historical payment doesn't
           pay it down here — but the cash genuinely left the paying account */
        if (dp.payFull && cardTarget) continue;
        outflow += debit(src, n0(dp.amount) * n * defl);
        continue;
      }
      /* a debt payment is a nominal commitment: $400/mo stays $400/mo while everything
         around it gets more expensive, so in today's dollars it shrinks year by year */
      let rem = (dp.payFull && target) ? Math.max(0, target.bal) : n0(dp.amount) * n * defl;
      const total = rem;
      if (target && target.bal > 0.005) { const p = Math.min(target.bal, rem); target.bal -= p; rem -= p; }
      if (!cardTarget) {
        while (rem > 0.005) {
          const nx = d.filter((x) => x.kind !== "card" && x.bal > 0.005).sort(nextLoan)[0];
          if (!nx) break; const p = Math.min(nx.bal, rem); nx.bal -= p; rem -= p;
        }
      }
      if (cardTarget) target.carried = Math.max(0, target.bal);
      const applied = total - rem;
      outflow += debit(src, applied);
      if (rem > 0.005 && settings.redirect && !cardTarget && ws >= overflowAcct.asOf) { debit(src, rem); credit(overflowAcct, rem); }
    }
    /* sweep: anything above an account's cap gets pushed on to where it does more good.
       Runs last, and monthly sweeps wait for the final week of the month so the month's
       bills have already come out of the buffer before the excess is judged. Skipped
       during the pre-roll — caps are a forward-looking planning tool, not something
       worth reconstructing for a historical catch-up window. */
    let swept = 0;
    if (!isPreRoll) {
      const monthEndWeek = addDays(ws, 7).getMonth() !== ws.getMonth();
      for (const a of A) {
        if (a.cap == null || !a.spillTo || ws < a.asOf) continue;
        if (a.spillEvery === "monthly" && !monthEndWeek) continue;
        const over = a.bal - a.cap;
        if (over <= 0.005) continue;
        const tDebt = dById[a.spillTo];
        const tAcct = byId[a.spillTo];
        if (tDebt) {
          let rem = over;
          if (tDebt.bal > 0.005) { const p = Math.min(tDebt.bal, rem); tDebt.bal -= p; rem -= p; if (tDebt.kind === "card") tDebt.carried = Math.max(0, tDebt.bal); }
          if (tDebt.kind !== "card") {
            while (rem > 0.005) {
              const nx = d.filter((x) => x.kind !== "card" && x.bal > 0.005).sort(nextLoan)[0];
              if (!nx) break; const p = Math.min(nx.bal, rem); nx.bal -= p; rem -= p;
            }
          }
          const applied = over - rem;
          if (applied > 0) { a.bal -= applied; outflow += applied; swept += applied; }
          /* nothing left to pay down — park the rest where you've said overflow should go,
             same "once debt is clear" gate the debt-payment overflow above respects */
          if (rem > 0.005 && settings.redirect && overflowAcct && overflowAcct !== a && ws >= overflowAcct.asOf) { a.bal -= rem; credit(overflowAcct, rem); swept += rem; }
        } else if (tAcct && tAcct !== a && ws >= tAcct.asOf) {
          a.bal -= over; credit(tAcct, over); swept += over;
        }
      }
    }
    if (snap) { snap.inflow = r2(inflow); snap.outflow = r2(outflow); snap.charged = r2(charged); snap.swept = r2(swept); snap.pretax = r2(pretax); }
  }
  return { series, debtFree, fire, fireNumber, annualExp, annualExpNow, endingSoon, payoffWeek, interest, cardInterest, capInfo };
}

