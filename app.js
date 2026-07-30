const {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback
} = React;
const {
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} = Recharts;
function IconBase({
  size,
  color,
  style,
  children
}) {
  return React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size || 24,
    height: size || 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color || "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: style
  }, children);
}
const Plus = p => React.createElement(IconBase, p, React.createElement("path", {
  d: "M5 12h14"
}), React.createElement("path", {
  d: "M12 5v14"
}));
const Trash2 = p => React.createElement(IconBase, p, React.createElement("path", {
  d: "M10 11v6"
}), React.createElement("path", {
  d: "M14 11v6"
}), React.createElement("path", {
  d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
}), React.createElement("path", {
  d: "M3 6h18"
}), React.createElement("path", {
  d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
}));
const RotateCcw = p => React.createElement(IconBase, p, React.createElement("path", {
  d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
}), React.createElement("path", {
  d: "M3 3v5h5"
}));
const LayoutGrid = p => React.createElement(IconBase, p, React.createElement("rect", {
  width: "7",
  height: "7",
  x: "3",
  y: "3",
  rx: "1"
}), React.createElement("rect", {
  width: "7",
  height: "7",
  x: "14",
  y: "3",
  rx: "1"
}), React.createElement("rect", {
  width: "7",
  height: "7",
  x: "14",
  y: "14",
  rx: "1"
}), React.createElement("rect", {
  width: "7",
  height: "7",
  x: "3",
  y: "14",
  rx: "1"
}));
const Wallet = p => React.createElement(IconBase, p, React.createElement("path", {
  d: "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"
}), React.createElement("path", {
  d: "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"
}));
const Receipt = p => React.createElement(IconBase, p, React.createElement("path", {
  d: "M12 17V7"
}), React.createElement("path", {
  d: "M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8"
}), React.createElement("path", {
  d: "M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"
}));
const TrendingDown = p => React.createElement(IconBase, p, React.createElement("path", {
  d: "M16 17h6v-6"
}), React.createElement("path", {
  d: "m22 17-8.5-8.5-5 5L2 7"
}));
const InvestIcon = p => React.createElement(IconBase, p, React.createElement("path", {
  d: "M3 3v16a2 2 0 0 0 2 2h16"
}), React.createElement("path", {
  d: "m19 9-5 5-4-4-3 3"
}));
const AlertTriangle = p => React.createElement(IconBase, p, React.createElement("path", {
  d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
}), React.createElement("path", {
  d: "M12 9v4"
}), React.createElement("path", {
  d: "M12 17h.01"
}));
const Check = p => React.createElement(IconBase, p, React.createElement("path", {
  d: "M20 6 9 17l-5-5"
}));
const Zap = p => React.createElement(IconBase, p, React.createElement("path", {
  d: "M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"
}));
const Upload = p => React.createElement(IconBase, p, React.createElement("path", {
  d: "M12 3v12"
}), React.createElement("path", {
  d: "m17 8-5-5-5 5"
}), React.createElement("path", {
  d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
}));
const Download = p => React.createElement(IconBase, p, React.createElement("path", {
  d: "M12 15V3"
}), React.createElement("path", {
  d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
}), React.createElement("path", {
  d: "m7 10 5 5 5-5"
}));
const X = p => React.createElement(IconBase, p, React.createElement("path", {
  d: "M18 6 6 18"
}), React.createElement("path", {
  d: "m6 6 12 12"
}));
const ArrowRight = p => React.createElement(IconBase, p, React.createElement("path", {
  d: "M5 12h14"
}), React.createElement("path", {
  d: "m12 5 7 7-7 7"
}));
const HelpCircle = p => React.createElement(IconBase, p, React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "10"
}), React.createElement("path", {
  d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
}), React.createElement("path", {
  d: "M12 17h.01"
}));
const n0 = v => {
  const x = Number(v);
  return isFinite(x) && x > 0 ? x : 0;
};
const num = v => {
  const x = Number(v);
  return isFinite(x) ? x : 0;
};
const uid = () => Math.random().toString(36).slice(2, 9);
const r2 = n => Math.round(n * 100) / 100;
const parse = (s, f) => {
  try {
    return s ? JSON.parse(s) : f;
  } catch {
    return f;
  }
};
const DAY = 86400000;
function parseDate(s) {
  if (s instanceof Date) return s;
  if (!s) return new Date(NaN);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s).trim());
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  return new Date(s);
}
function addMonths(d, m) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
}
const addDays = (d, n) => new Date(d.getTime() + n * DAY);
const isoDate = d => d.toISOString().slice(0, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const nextFirstISO = () => {
  const d = new Date();
  return isoDate(new Date(d.getFullYear(), d.getMonth() + 1, 1));
};
const firstOfYear = () => {
  const d = new Date();
  return new Date(d.getFullYear(), 0, 1);
};
const fmtMoney = n => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");
function fmtBig(n) {
  const s = n < 0 ? "-" : "";
  n = Math.abs(Math.round(n));
  if (n >= 1e6) return s + "$" + (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (n >= 1e3) return s + "$" + Math.round(n / 1e3) + "k";
  return s + "$" + n;
}
const fmtC = n => {
  n = Math.round(n);
  if (Math.abs(n) >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (Math.abs(n) >= 1e3) return "$" + Math.round(n / 1e3) + "k";
  return "$" + n;
};
const fmtDate = d => d.toLocaleDateString("en-US", {
  month: "short",
  year: "numeric"
});
const weekTick = start => w => {
  const d = addDays(start, w * 7);
  return d.toLocaleDateString("en-US", {
    month: "short"
  }) + " '" + String(d.getFullYear()).slice(2);
};
function fmtDur(m) {
  if (m <= 0) return "0 mo";
  const y = Math.floor(m / 12),
    mo = m % 12;
  if (y && mo) return `${y}y ${mo}mo`;
  if (y) return `${y}y`;
  return `${mo} mo`;
}
const OPY = {
  once: 0,
  weekly: 52.1775,
  biweekly: 26.0888,
  semimonthly: 24,
  monthly: 12,
  quarterly: 4,
  yearly: 1
};
const RECUR = [{
  v: "once",
  label: "One-time"
}, {
  v: "weekly",
  label: "Weekly"
}, {
  v: "biweekly",
  label: "Every 2 weeks"
}, {
  v: "semimonthly",
  label: "1st & 15th"
}, {
  v: "monthly",
  label: "Monthly"
}, {
  v: "quarterly",
  label: "Quarterly"
}, {
  v: "yearly",
  label: "Yearly"
}];
const recurLabel = v => (RECUR.find(r => r.v === v) || {}).label || v;
const ACCT_TYPES = [{
  v: "checking",
  label: "Checking",
  rate: 0
}, {
  v: "savings",
  label: "Savings / HYSA",
  rate: 4
}, {
  v: "brokerage",
  label: "Brokerage",
  rate: 7
}, {
  v: "retirement",
  label: "Retirement",
  rate: 7
}, {
  v: "cash",
  label: "Cash",
  rate: 0
}, {
  v: "other",
  label: "Other asset",
  rate: 0
}];
const isInvest = t => t === "brokerage" || t === "retirement";
const isSav = t => t === "savings";
const isCash = t => t === "checking" || t === "cash" || t === "other";
const BUCKET_COLOR = {
  Investments: "#5CCB8B",
  Savings: "#38BDD0",
  Cash: "#F5A623"
};
const PAL = ["#F5A623", "#38BDD0", "#5CCB8B", "#B98CE8", "#E8B84B", "#5B9BD5", "#4FC3B0", "#D98BB0", "#8A9AAB", "#E0885B"];
const ACCT_PAL = ["#38BDD0", "#5CCB8B", "#B98CE8", "#E8B84B", "#5B9BD5", "#4FC3B0", "#7FB2E8", "#C9A0DC"];
const DEBT_PAL = ["#E8695B", "#D9776B", "#C86A5E", "#E88070"];
const acctColor = i => ACCT_PAL[i % ACCT_PAL.length];
const debtColor = i => DEBT_PAL[i % DEBT_PAL.length];
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
function monthIdxRange(from, to) {
  const a = from.getFullYear() * 12 + from.getMonth();
  const l = new Date(to.getTime() - 1);
  const b = l.getFullYear() * 12 + l.getMonth();
  const o = [];
  for (let i = a; i <= b; i++) o.push(i);
  return o;
}
function nominalDates(ev, from, to) {
  const start = parseDate(ev.date);
  if (isNaN(start)) return [];
  const end = ev.end ? parseDate(ev.end) : null;
  const out = [];
  const push = d => {
    if (d >= from && d < to && d >= start && (!end || d <= end)) out.push(d);
  };
  switch (ev.recur) {
    case "once":
      push(start);
      break;
    case "weekly":
    case "biweekly":
      {
        const st = ev.recur === "weekly" ? 7 : 14;
        const k = Math.max(0, Math.floor((from - start) / (st * DAY)));
        for (let i = k; i < k + 4; i++) {
          const d = new Date(start.getTime() + i * st * DAY);
          if (d >= to) break;
          push(d);
        }
        break;
      }
    case "semimonthly":
      {
        for (const idx of monthIdxRange(from, to)) {
          const y = Math.floor(idx / 12),
            m = idx % 12;
          push(new Date(y, m, 1));
          push(new Date(y, m, 15));
        }
        break;
      }
    case "monthly":
    case "quarterly":
    case "yearly":
      {
        const st = ev.recur === "monthly" ? 1 : ev.recur === "quarterly" ? 3 : 12;
        for (const idx of monthIdxRange(from, to)) {
          const y = Math.floor(idx / 12),
            m = idx % 12;
          const ms = (y - start.getFullYear()) * 12 + (m - start.getMonth());
          if (ms < 0 || ms % st !== 0) continue;
          push(new Date(y, m, Math.min(start.getDate(), daysInMonth(y, m))));
        }
        break;
      }
  }
  return out;
}
const adjWeekday = d => {
  const g = d.getDay();
  if (g === 6) return addDays(d, -1);
  if (g === 0) return addDays(d, -2);
  return d;
};
function firesInWeek(ev, ws, we) {
  const pad = ev.weekdayAdj ? 2 : 0;
  const cands = nominalDates(ev, ws, addDays(we, pad));
  let n = 0;
  for (const d of cands) {
    const a = ev.weekdayAdj ? adjWeekday(d) : d;
    if (a >= ws && a < we) n++;
  }
  return n;
}
const perCheck = (gross, mode, recur) => {
  const g = n0(gross);
  if (mode !== "year") return g;
  const per = OPY[recur] || 0;
  return per > 0 ? g / per : g;
};
const grossPerCheck = inc => perCheck(inc.gross, inc.grossMode, inc.recur);
function salaryAt(inc, at) {
  let amount = n0(inc.amount),
    gross = grossPerCheck(inc),
    anchor = parseDate(inc.date),
    label = null;
  const list = (inc.changes || []).slice().sort((a, b) => parseDate(a.date) - parseDate(b.date));
  for (const ch of list) {
    const d = parseDate(ch.date);
    if (isNaN(d) || d > at) continue;
    amount = n0(ch.amount);
    gross = perCheck(ch.gross, ch.grossMode || inc.grossMode, inc.recur);
    anchor = d;
    label = ch.label || "Promotion";
  }
  return {
    amount,
    gross,
    anchor,
    label
  };
}
function payrollOf(inc, grossOverride) {
  const gross = grossOverride != null ? grossOverride : grossPerCheck(inc);
  const rows = (inc.preTax || []).map(pt => {
    const amount = pt.mode === "pct" ? gross * num(pt.value) / 100 : n0(pt.value);
    return {
      ...pt,
      amount
    };
  });
  const matchable = rows.reduce((s, r) => s + (r.counts !== false ? r.amount : 0), 0);
  const employee = rows.reduce((s, r) => s + r.amount, 0);
  let match = 0;
  const mt = inc.match;
  if (mt && gross > 0 && n0(mt.rate) > 0 && matchable > 0) {
    match = Math.min(matchable, gross * num(mt.limit) / 100) * n0(mt.rate) / 100;
  }
  return {
    gross,
    rows,
    employee,
    match,
    total: employee + match,
    matchable
  };
}
function bonusOf(inc, growth, grossOverride) {
  const bn = inc && inc.bonus;
  if (!bn || !(n0(bn.value) > 0)) return null;
  const g = growth == null ? 1 : growth;
  const base = grossOverride != null ? grossOverride : grossPerCheck(inc);
  const annualGross = base * (OPY[inc.recur] || 0) * g;
  const gross = bn.mode === "amt" ? n0(bn.value) * g : annualGross * num(bn.value) / 100;
  let deferral = 0,
    matchable = 0;
  if (bn.preTaxApplies !== false) {
    for (const pt of inc.preTax || []) {
      if (pt.mode !== "pct") continue;
      const p = gross * num(pt.value) / 100;
      deferral += p;
      if (pt.counts !== false) matchable += p;
    }
  }
  let match = 0;
  const mt = inc.match;
  if (mt && gross > 0 && n0(mt.rate) > 0 && matchable > 0) {
    match = Math.min(matchable, gross * num(mt.limit) / 100) * n0(mt.rate) / 100;
  }
  const withheld = gross * num(bn.withhold) / 100;
  const net = Math.max(0, gross - withheld - deferral);
  return {
    gross,
    deferral,
    match,
    withheld,
    net
  };
}
function projectMinWeekly(debts, start, weeks) {
  const d = debts.filter(x => x.kind !== "card" && n0(x.balance) > 0).map(x => ({
    apr: n0(x.apr),
    min: n0(x.minPayment),
    bal: n0(x.balance)
  }));
  const series = new Array(weeks + 1);
  let prevMonth = start.getFullYear() * 12 + start.getMonth();
  let interest = 0,
    clearedWeek = null;
  for (let w = 0; w <= weeks; w++) {
    const tot = d.reduce((s, x) => s + Math.max(0, x.bal), 0);
    series[w] = r2(tot);
    if (clearedWeek === null && d.length && tot <= 0.5) clearedWeek = w;
    if (w === weeks) break;
    const ws = addDays(start, w * 7),
      we = addDays(ws, 7);
    const cm = we.getFullYear() * 12 + we.getMonth();
    if (cm !== prevMonth) {
      prevMonth = cm;
      for (const x of d) {
        if (x.bal <= 0) continue;
        const i = x.bal * (x.apr / 1200);
        x.bal += i;
        interest += i;
        const p = Math.min(x.min, x.bal);
        x.bal -= p;
        if (x.bal <= 0.005) x.bal = 0;
      }
    }
  }
  return {
    series,
    interest,
    clearedWeek
  };
}
function simulateWeekly(cfg) {
  const {
    accounts,
    debts,
    income,
    expenses,
    transfers,
    debtPayments,
    settings,
    start,
    weeks
  } = cfg;
  const A = accounts.map(a => ({
    id: a.id,
    type: a.type,
    bal: n0(a.balance),
    wr: Math.pow(1 + num(a.rate) / 100, 1 / 52.1775) - 1,
    cap: a.cap === "" || a.cap == null ? null : n0(a.cap),
    spillTo: a.spillTo || "",
    spillEvery: a.spillEvery === "weekly" ? "weekly" : "monthly"
  }));
  const byId = Object.fromEntries(A.map(a => [a.id, a]));
  const fallback = A.find(a => a.type === "checking") || A[0];
  const investAcct = A.find(a => isInvest(a.type)) || fallback;
  const overflowAcct = byId[settings.overflowTo] || investAcct;
  const d = debts.map(x => ({
    id: x.id,
    apr: n0(x.apr),
    bal: n0(x.balance),
    kind: x.kind === "card" ? "card" : "loan",
    carried: n0(x.balance),
    interestFrom: x.interestFrom || ""
  }));
  const dById = Object.fromEntries(d.map(x => [x.id, x]));
  const hasLoans = d.some(x => x.kind !== "card" && x.bal > 0);
  const longRunAt = new Date(start.getTime() + 10 * 365.25 * DAY);
  const recurring = expenses.filter(e => e.recur !== "once");
  const annualExpNow = recurring.reduce((s, e) => s + n0(e.amount) * OPY[e.recur], 0);
  const endingSoon = recurring.filter(e => {
    if (!e.end) return false;
    const ed = parseDate(e.end);
    return !isNaN(ed) && ed < longRunAt;
  });
  const annualExp = recurring.reduce((s, e) => {
    if (e.end) {
      const ed = parseDate(e.end);
      if (!isNaN(ed) && ed < longRunAt) return s;
    }
    return s + n0(e.amount) * OPY[e.recur];
  }, 0);
  const fireNumber = n0(settings.withdrawalRate) > 0 ? annualExp * (100 / n0(settings.withdrawalRate)) : 0;
  let basis = A.filter(a => isInvest(a.type)).reduce((s, a) => s + a.bal, 0);
  const series = [];
  const payoffWeek = {};
  let debtFree = null,
    fire = null,
    interest = 0,
    cardInterest = 0;
  let prevMonth = start.getFullYear() * 12 + start.getMonth();
  if (!A.length) return {
    series: [{
      w: 0,
      nw: 0,
      debt: 0,
      loanDebt: 0,
      invest: 0,
      basis: 0,
      acct: {},
      dbt: {},
      inflow: 0,
      outflow: 0,
      charged: 0,
      pretax: 0
    }],
    debtFree: null,
    fire: null,
    fireNumber,
    annualExp,
    annualExpNow,
    endingSoon,
    payoffWeek,
    interest: 0,
    cardInterest: 0
  };
  for (let w = 0; w <= weeks; w++) {
    const ws = addDays(start, w * 7),
      we = addDays(ws, 7);
    const debtTotal = d.reduce((s, x) => s + Math.max(0, x.bal), 0);
    const loanTotal = d.reduce((s, x) => s + (x.kind === "card" ? 0 : Math.max(0, x.bal)), 0);
    const acct = {};
    for (const a of A) acct[a.id] = r2(a.bal);
    const dbt = {};
    for (const x of d) dbt[x.id] = r2(Math.max(0, x.bal));
    for (const x of d) if (x.kind !== "card" && x.bal <= 0.005 && payoffWeek[x.id] == null) payoffWeek[x.id] = w;
    const invest = A.filter(a => isInvest(a.type)).reduce((s, a) => s + a.bal, 0);
    const nw = A.reduce((s, a) => s + a.bal, 0) - debtTotal;
    const snap = {
      w,
      nw: r2(nw),
      debt: r2(debtTotal),
      loanDebt: r2(loanTotal),
      invest: r2(invest),
      basis: r2(basis),
      acct,
      dbt,
      inflow: 0,
      outflow: 0,
      charged: 0,
      swept: 0,
      pretax: 0
    };
    series.push(snap);
    if (debtFree === null && hasLoans && loanTotal <= 0.5) debtFree = w;
    if (fire === null && fireNumber > 0 && nw >= fireNumber) fire = w;
    if (w === weeks) break;
    for (const a of A) a.bal *= 1 + a.wr;
    const cm = we.getFullYear() * 12 + we.getMonth();
    const monthTurn = cm !== prevMonth;
    if (monthTurn) {
      prevMonth = cm;
      for (const x of d) {
        if (x.interestFrom) {
          const f = parseDate(x.interestFrom);
          if (!isNaN(f) && ws < f) continue;
        }
        const base = x.kind === "card" ? Math.max(0, x.carried) : x.bal;
        if (base <= 0.005) continue;
        const i = base * (x.apr / 1200);
        x.bal += i;
        x.carried += i;
        interest += i;
        if (x.kind === "card") cardInterest += i;
      }
    }
    let inflow = 0,
      outflow = 0,
      charged = 0,
      pretax = 0;
    for (const inc of income) {
      const sal = salaryAt(inc, ws);
      const yrs = Math.max(0, Math.floor((ws - sal.anchor) / (365.25 * DAY)));
      const growth = Math.pow(1 + num(inc.raise) / 100, yrs);
      const payTo = (dist, total) => {
        const list = dist && dist.length ? dist : [{
          acctId: fallback.id
        }];
        let used = 0;
        for (let i = 1; i < list.length; i++) {
          const sp = list[i];
          const want = sp.mode === "amt" ? n0(sp.value) : total * num(sp.value) / 100;
          const give = Math.min(want, Math.max(0, total - used));
          const t = byId[sp.acctId] || fallback;
          t.bal += give;
          if (isInvest(t.type)) basis += give;
          used += give;
        }
        const t0 = byId[list[0].acctId] || fallback;
        const restAmt = Math.max(0, total - used);
        t0.bal += restAmt;
        if (isInvest(t0.type)) basis += restAmt;
      };
      const n = firesInWeek(inc, ws, we);
      if (n) {
        const amt = sal.amount * growth * n;
        const list = inc.dist && inc.dist.length ? inc.dist : [{
          acctId: fallback.id
        }];
        let used = 0;
        for (let i = 1; i < list.length; i++) {
          const sp = list[i];
          const want = sp.mode === "amt" ? n0(sp.value) * n : amt * num(sp.value) / 100;
          const give = Math.min(want, Math.max(0, amt - used));
          const t = byId[sp.acctId] || fallback;
          t.bal += give;
          if (isInvest(t.type)) basis += give;
          used += give;
        }
        const rest = Math.max(0, amt - used);
        const t0 = byId[list[0].acctId] || fallback;
        t0.bal += rest;
        if (isInvest(t0.type)) basis += rest;
        inflow += amt;
        const gross = sal.gross * growth * n;
        let matchable = 0;
        for (const pt of inc.preTax || []) {
          const p = pt.mode === "pct" ? gross * num(pt.value) / 100 : n0(pt.value) * growth * n;
          if (p <= 0) continue;
          const t = byId[pt.toAcct] || investAcct;
          t.bal += p;
          if (isInvest(t.type)) basis += p;
          pretax += p;
          if (pt.counts !== false) matchable += p;
        }
        const mt = inc.match;
        if (mt && gross > 0 && n0(mt.rate) > 0 && matchable > 0) {
          const ceiling = gross * num(mt.limit) / 100;
          const m = Math.min(matchable, ceiling) * n0(mt.rate) / 100;
          if (m > 0) {
            const t = byId[mt.toAcct] || investAcct;
            t.bal += m;
            if (isInvest(t.type)) basis += m;
            pretax += m;
          }
        }
      }
      const bn = inc.bonus;
      if (bn && n0(bn.value) > 0 && bn.date) {
        const hits = firesInWeek({
          date: bn.date,
          recur: "yearly",
          end: inc.end,
          weekdayAdj: inc.weekdayAdj
        }, ws, we);
        if (hits) {
          const b = bonusOf(inc, growth, sal.gross);
          if (b) {
            payTo(inc.dist, b.net * hits);
            inflow += b.net * hits;
            if (b.deferral > 0) {
              const t = byId[((inc.preTax || [])[0] || {}).toAcct] || investAcct;
              t.bal += b.deferral * hits;
              if (isInvest(t.type)) basis += b.deferral * hits;
              pretax += b.deferral * hits;
            }
            if (b.match > 0) {
              const t = byId[(inc.match || {}).toAcct] || investAcct;
              t.bal += b.match * hits;
              if (isInvest(t.type)) basis += b.match * hits;
              pretax += b.match * hits;
            }
          }
        }
      }
    }
    for (const ex of expenses) {
      const n = firesInWeek(ex, ws, we);
      if (!n) continue;
      const amt = n0(ex.amount) * n;
      const card = dById[ex.fromAcct];
      if (card && card.kind === "card") {
        card.bal += amt;
        charged += amt;
      } else {
        (byId[ex.fromAcct] || fallback).bal -= amt;
        outflow += amt;
      }
    }
    for (const tr of transfers) {
      const n = firesInWeek(tr, ws, we);
      if (!n) continue;
      const amt = n0(tr.amount) * n;
      (byId[tr.fromAcct] || fallback).bal -= amt;
      const t = byId[tr.toAcct] || investAcct;
      t.bal += amt;
      if (isInvest(t.type)) basis += amt;
    }
    for (const dp of debtPayments) {
      const n = firesInWeek(dp, ws, we);
      if (!n) continue;
      const target = dById[dp.toDebt];
      const cardTarget = !!(target && target.kind === "card");
      let rem = dp.payFull && target ? Math.max(0, target.bal) : n0(dp.amount) * n;
      const total = rem;
      const src = byId[dp.fromAcct] || fallback;
      if (target && target.bal > 0.005) {
        const p = Math.min(target.bal, rem);
        target.bal -= p;
        rem -= p;
      }
      if (!cardTarget) {
        while (rem > 0.005) {
          const nx = d.filter(x => x.kind !== "card" && x.bal > 0.005).sort((a, b) => b.apr - a.apr)[0];
          if (!nx) break;
          const p = Math.min(nx.bal, rem);
          nx.bal -= p;
          rem -= p;
        }
      }
      if (cardTarget) target.carried = Math.max(0, target.bal);
      const applied = total - rem;
      src.bal -= applied;
      outflow += applied;
      if (rem > 0.005 && settings.redirect && !cardTarget) {
        src.bal -= rem;
        overflowAcct.bal += rem;
        if (isInvest(overflowAcct.type)) basis += rem;
      }
    }
    let swept = 0;
    const monthEndWeek = addDays(ws, 7).getMonth() !== ws.getMonth();
    for (const a of A) {
      if (a.cap == null || !a.spillTo) continue;
      if (a.spillEvery === "monthly" && !monthEndWeek) continue;
      const over = a.bal - a.cap;
      if (over <= 0.005) continue;
      const tDebt = dById[a.spillTo];
      const tAcct = byId[a.spillTo];
      if (tDebt) {
        let rem = over;
        if (tDebt.bal > 0.005) {
          const p = Math.min(tDebt.bal, rem);
          tDebt.bal -= p;
          rem -= p;
          if (tDebt.kind === "card") tDebt.carried = Math.max(0, tDebt.bal);
        }
        if (tDebt.kind !== "card") {
          while (rem > 0.005) {
            const nx = d.filter(x => x.kind !== "card" && x.bal > 0.005).sort((p, q) => q.apr - p.apr)[0];
            if (!nx) break;
            const p = Math.min(nx.bal, rem);
            nx.bal -= p;
            rem -= p;
          }
        }
        const applied = over - rem;
        if (applied > 0) {
          a.bal -= applied;
          outflow += applied;
          swept += applied;
        }
        if (rem > 0.005 && settings.redirect && overflowAcct && overflowAcct !== a) {
          a.bal -= rem;
          overflowAcct.bal += rem;
          if (isInvest(overflowAcct.type)) basis += rem;
          swept += rem;
        }
      } else if (tAcct && tAcct !== a) {
        a.bal -= over;
        tAcct.bal += over;
        if (isInvest(tAcct.type)) basis += over;
        swept += over;
      }
    }
    snap.inflow = r2(inflow);
    snap.outflow = r2(outflow);
    snap.charged = r2(charged);
    snap.swept = r2(swept);
    snap.pretax = r2(pretax);
  }
  return {
    series,
    debtFree,
    fire,
    fireNumber,
    annualExp,
    annualExpNow,
    endingSoon,
    payoffWeek,
    interest,
    cardInterest
  };
}
const A_CHK = uid(),
  A_SAV = uid(),
  A_BRK = uid(),
  A_RET = uid();
const D_EAR = uid(),
  D_MOH = uid();
const SEED_ACCOUNTS = () => [{
  id: A_CHK,
  name: "Checking",
  type: "checking",
  balance: 6000,
  rate: 0
}, {
  id: A_SAV,
  name: "HYSA",
  type: "savings",
  balance: 15000,
  rate: 4
}, {
  id: A_BRK,
  name: "Brokerage",
  type: "brokerage",
  balance: 40000,
  rate: 7
}, {
  id: A_RET,
  name: "Roth + 401k",
  type: "retirement",
  balance: 55000,
  rate: 7
}];
const SEED_DEBTS = () => [{
  id: D_EAR,
  name: "Earnest (private)",
  kind: "loan",
  balance: 18500,
  originalBalance: 18500,
  apr: 7.75,
  minPayment: 235,
  interestFrom: todayISO()
}, {
  id: D_MOH,
  name: "MOHELA (federal)",
  kind: "loan",
  balance: 24200,
  originalBalance: 24200,
  apr: 5.5,
  minPayment: 255,
  interestFrom: todayISO()
}];
const normDebts = list => (list || []).map(x => ({
  ...x,
  kind: x.kind === "card" ? "card" : "loan",
  interestFrom: x.interestFrom || todayISO()
}));
const normDist = (dist, fb) => {
  if (!Array.isArray(dist) || !dist.length) return [{
    acctId: fb
  }];
  return dist.map((s, i) => i === 0 ? {
    acctId: s.acctId
  } : {
    acctId: s.acctId,
    mode: s.mode || "pct",
    value: s.value != null ? s.value : s.pct != null ? s.pct : 0
  });
};
const normIncome = (list, fbAcct, retAcct) => (list || []).map(x => ({
  ...x,
  weekdayAdj: x.weekdayAdj != null ? x.weekdayAdj : true,
  grossMode: x.grossMode || "paycheck",
  dist: normDist(x.dist, fbAcct),
  preTax: (x.preTax || []).map(p => ({
    id: p.id || uid(),
    name: p.name || "Contribution",
    mode: p.mode || "amt",
    value: p.value != null ? p.value : p.amount != null ? p.amount : 0,
    toAcct: p.toAcct || retAcct,
    counts: p.counts !== false
  })),
  match: x.match ? {
    rate: x.match.rate != null ? x.match.rate : 100,
    limit: x.match.limit != null ? x.match.limit : 3,
    toAcct: x.match.toAcct || retAcct
  } : null,
  changes: (x.changes || []).map(c => ({
    id: c.id || uid(),
    date: c.date || todayISO(),
    label: c.label || "Promotion",
    amount: c.amount != null ? c.amount : 0,
    gross: c.gross != null ? c.gross : 0,
    grossMode: c.grossMode || x.grossMode || "year"
  })),
  bonus: x.bonus ? {
    mode: x.bonus.mode || "pct",
    value: x.bonus.value != null ? x.bonus.value : 0,
    date: x.bonus.date || todayISO(),
    withhold: x.bonus.withhold != null ? x.bonus.withhold : 30,
    preTaxApplies: x.bonus.preTaxApplies !== false
  } : null
}));
const isCard = x => !!x && x.kind === "card";
function pickIds(accts, dbts) {
  const chk = accts.find(a => a.type === "checking") || accts[0] || {};
  const sav = accts.find(a => isSav(a.type)) || chk;
  const brk = accts.find(a => isInvest(a.type)) || chk;
  const ret = accts.find(a => a.type === "retirement") || brk;
  const loans = (dbts || []).filter(x => !isCard(x));
  const hi = [...loans].filter(x => n0(x.balance) > 0).sort((a, b) => n0(b.apr) - n0(a.apr))[0] || loans[0] || {};
  return {
    chk: chk.id,
    sav: sav.id,
    brk: brk.id,
    ret: ret.id,
    hiDebt: hi.id
  };
}
const seedIncome = id => [{
  id: uid(),
  name: "Take-home pay",
  amount: 3000,
  gross: 109200,
  grossMode: "year",
  date: todayISO(),
  recur: "biweekly",
  raise: 4,
  weekdayAdj: true,
  dist: [{
    acctId: id.chk
  }, {
    acctId: id.sav,
    mode: "pct",
    value: 15
  }],
  preTax: [{
    id: uid(),
    name: "401k contribution",
    mode: "pct",
    value: 6,
    toAcct: id.ret,
    counts: true
  }],
  match: {
    rate: 100,
    limit: 3,
    toAcct: id.ret
  }
}];
const seedExpenses = id => [{
  id: uid(),
  category: "Rent",
  amount: 1500,
  date: nextFirstISO(),
  recur: "monthly",
  fromAcct: id.chk
}, {
  id: uid(),
  category: "Groceries",
  amount: 110,
  date: todayISO(),
  recur: "weekly",
  fromAcct: id.chk
}, {
  id: uid(),
  category: "Dining out",
  amount: 60,
  date: todayISO(),
  recur: "weekly",
  fromAcct: id.chk
}, {
  id: uid(),
  category: "Utilities",
  amount: 140,
  date: nextFirstISO(),
  recur: "monthly",
  fromAcct: id.chk
}, {
  id: uid(),
  category: "Phone + internet",
  amount: 90,
  date: nextFirstISO(),
  recur: "monthly",
  fromAcct: id.chk
}, {
  id: uid(),
  category: "Car insurance",
  amount: 180,
  date: nextFirstISO(),
  recur: "quarterly",
  fromAcct: id.chk
}, {
  id: uid(),
  category: "Everything else",
  amount: 300,
  date: nextFirstISO(),
  recur: "monthly",
  fromAcct: id.chk
}];
const seedTransfers = id => [{
  id: uid(),
  name: "Auto-invest",
  amount: 800,
  date: nextFirstISO(),
  recur: "monthly",
  fromAcct: id.chk,
  toAcct: id.brk
}];
const seedDebtPays = (id, dbts) => {
  const list = (dbts || []).filter(x => !isCard(x) && n0(x.balance) > 0).map(x => ({
    id: uid(),
    name: x.name + " payment",
    amount: n0(x.minPayment),
    date: nextFirstISO(),
    recur: "monthly",
    fromAcct: id.chk,
    toDebt: x.id
  }));
  if (id.hiDebt) list.push({
    id: uid(),
    name: "Extra toward payoff",
    amount: 400,
    date: nextFirstISO(),
    recur: "monthly",
    fromAcct: id.chk,
    toDebt: id.hiDebt
  });
  return list;
};
const seedSettings = () => ({
  withdrawalRate: 4,
  redirect: true
});
const store = {
  async get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  async set(k, v) {
    try {
      localStorage.setItem(k, v);
      return true;
    } catch {
      return false;
    }
  }
};
function useScope(maxW, defSpan) {
  const [win, setWin] = useState({
    lo: 0,
    hi: Math.max(8, Math.min(defSpan, maxW))
  });
  const nodeRef = useRef(null);
  const ptrs = useRef(new Map());
  const last = useRef(null);
  const maxRef = useRef(maxW);
  maxRef.current = maxW;
  const clampTo = (lo, hi) => {
    const M = maxRef.current;
    const span = Math.max(6, Math.min(hi - lo, M));
    if (lo < 0) lo = 0;
    if (lo + span > M) lo = Math.max(0, M - span);
    return {
      lo,
      hi: lo + span
    };
  };
  const zoomAt = (frac, factor) => setWin(cur => {
    const span = cur.hi - cur.lo;
    const anchor = cur.lo + span * frac;
    const ns = Math.max(6, Math.min(span * factor, maxRef.current));
    return clampTo(anchor - ns * frac, anchor - ns * frac + ns);
  });
  const zoomRef = useRef(zoomAt);
  zoomRef.current = zoomAt;
  const snap = span => setWin(clampTo(0, Math.min(span, maxRef.current)));
  useEffect(() => {
    setWin(w => clampTo(w.lo, w.hi));
  }, [maxW]);
  const setNode = useCallback(el => {
    const prev = nodeRef.current;
    if (prev && prev.__finWheel) {
      prev.removeEventListener("wheel", prev.__finWheel);
      prev.__finWheel = null;
    }
    nodeRef.current = el;
    if (el) {
      const h = e => {
        e.preventDefault();
        const r = el.getBoundingClientRect();
        const f = Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
        zoomRef.current(f, e.deltaY > 0 ? 1.2 : 1 / 1.2);
      };
      el.addEventListener("wheel", h, {
        passive: false
      });
      el.__finWheel = h;
    }
  }, []);
  const onPointerDown = e => {
    ptrs.current.set(e.pointerId, e.clientX);
    last.current = null;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };
  const onPointerMove = e => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, e.clientX);
    const el = nodeRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const xs = [...ptrs.current.values()];
    if (xs.length === 1) {
      const x = xs[0];
      if (last.current && last.current.mode === "pan") {
        const dx = x - last.current.x;
        setWin(cur => {
          const span = cur.hi - cur.lo;
          const sh = -dx / Math.max(1, r.width) * span;
          return clampTo(cur.lo + sh, cur.hi + sh);
        });
      }
      last.current = {
        mode: "pan",
        x
      };
    } else {
      const a = Math.min(...xs),
        b = Math.max(...xs);
      const dist = Math.max(12, b - a),
        mid = (a + b) / 2;
      if (last.current && last.current.mode === "pinch") {
        const f = Math.max(0, Math.min(1, (mid - r.left) / Math.max(1, r.width)));
        zoomAt(f, last.current.dist / dist);
      }
      last.current = {
        mode: "pinch",
        dist,
        mid
      };
    }
  };
  const onPointerUp = e => {
    ptrs.current.delete(e.pointerId);
    last.current = null;
  };
  return {
    lo: win.lo,
    hi: win.hi,
    snap,
    ref: setNode,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onPointerLeave: onPointerUp
    }
  };
}
function sampleRange(series, lo, hi, maxPts) {
  const a = Math.max(0, Math.floor(lo)),
    b = Math.min(series.length - 1, Math.ceil(hi));
  const step = Math.max(1, Math.ceil((b - a) / (maxPts || 300)));
  const out = [];
  for (let w = a; w <= b; w += step) out.push(series[w]);
  if (out.length && out[out.length - 1].w !== series[b].w) out.push(series[b]);
  return out;
}
const CSS = `
.fin{
  --bg:#0C131C; --panel:#111B27; --panel2:#16222F; --panel3:#0A121B;
  --line:rgba(126,148,171,0.14); --line2:rgba(126,148,171,0.26);
  --text:#E9EFF5; --muted:#8496A8; --faint:#5E7183;
  --amber:#F5A623; --amber-soft:rgba(245,166,35,0.13);
  --cyan:#38BDD0; --green:#5CCB8B; --red:#E8695B; --violet:#B98CE8;
  --mono:ui-monospace,'SF Mono','JetBrains Mono','Cascadia Code',Menlo,Consolas,monospace;
  --sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  font-family:var(--sans); color:var(--text); background:var(--bg);
  background-image:radial-gradient(rgba(126,148,171,0.05) 1px,transparent 1px);
  background-size:22px 22px; min-height:100vh; padding:22px 16px 64px; box-sizing:border-box; -webkit-font-smoothing:antialiased;
}
.fin *{box-sizing:border-box;}
/* every control is dark by default — :where() keeps this a zero-specificity safety net */
.fin :where(input:not([type=range]):not([type=checkbox]), select, textarea){
  background:var(--bg); color:var(--text); font-family:var(--mono); color-scheme:dark;}
.fin .wrap{max-width:1060px;margin:0 auto;}
.fin .mono{font-family:var(--mono);font-variant-numeric:tabular-nums;}
.fin .eyebrow{font-family:var(--mono);text-transform:uppercase;letter-spacing:.16em;font-size:11px;color:var(--faint);}
.fin .topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px;}
.fin .nwbig{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:clamp(34px,9vw,52px);line-height:.96;font-weight:600;letter-spacing:-0.03em;margin-top:5px;}
.fin .nwsub{font-family:var(--mono);font-size:12px;color:var(--faint);margin-top:8px;}
.fin .nwsub b{color:var(--muted);font-weight:600;}
.fin .toolbar{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end;}
.fin .tbtn{display:inline-flex;align-items:center;gap:6px;font-family:var(--sans);font-size:12px;font-weight:600;color:var(--muted);background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:8px 11px;cursor:pointer;transition:color .15s,border-color .15s;}
.fin .tbtn:hover{color:var(--text);border-color:var(--faint);}
.fin .tabs{display:flex;gap:6px;overflow-x:auto;margin-bottom:18px;padding-bottom:4px;scrollbar-width:none;-ms-overflow-style:none;}
.fin .tabs::-webkit-scrollbar{display:none;}
.fin .tabbtn{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;flex:none;font-family:var(--sans);font-size:13px;font-weight:600;color:var(--muted);background:var(--panel);border:1px solid var(--line);border-radius:11px;padding:9px 14px;cursor:pointer;transition:color .15s,border-color .15s,background .15s;}
.fin .tabbtn:hover{color:var(--text);}
.fin .tabbtn.active{color:#1A1206;background:var(--amber);border-color:var(--amber);}
.fin .panel{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px;margin-bottom:16px;}
.fin .phead{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:12px;flex-wrap:wrap;}
.fin .ptitle{font-size:12.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:600;}
.fin .psub{font-family:var(--mono);font-size:11px;color:var(--faint);}
.fin .sgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
@media(min-width:680px){.fin .sgrid{grid-template-columns:repeat(4,1fr);}}
.fin .stat{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:13px 15px;}
.fin .stat .k{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--faint);margin-bottom:8px;line-height:1.35;min-height:26px;}
.fin .stat .v{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:20px;font-weight:600;letter-spacing:-0.01em;}
.fin .v.green{color:var(--green);} .fin .v.amber{color:var(--amber);} .fin .v.red{color:var(--red);} .fin .v.cyan{color:var(--cyan);}
.fin .legend{display:flex;gap:12px;align-items:center;flex-wrap:wrap;}
.fin .lg{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;}
.fin .swatch{width:14px;height:0;border-top-width:2px;border-top-style:solid;border-radius:2px;}
.fin .dot{width:9px;height:9px;border-radius:50%;flex:none;}
.fin .scope-wrap{margin:2px -4px 0;touch-action:pan-y;cursor:grab;user-select:none;}
.fin .scope-wrap:active{cursor:grabbing;}
.fin .zhint{font-family:var(--mono);font-size:10px;color:var(--faint);text-align:right;margin-top:6px;opacity:.75;}
.fin .tt{background:var(--panel3);border:1px solid var(--line2);border-radius:10px;padding:10px 12px;font-family:var(--mono);box-shadow:0 8px 24px rgba(0,0,0,.45);max-width:230px;}
.fin .tt .tt-m{font-size:10px;color:var(--faint);text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;}
.fin .tt-row{display:flex;align-items:center;gap:8px;font-size:12px;margin-top:3px;color:var(--text);}
.fin .tt-row b{margin-left:auto;font-weight:600;}
.fin .field label{display:block;font-family:var(--mono);font-size:9.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--faint);margin-bottom:5px;}
.fin .inp{display:flex;align-items:center;background:var(--bg);border:1px solid var(--line2);border-radius:9px;padding:7px 9px;transition:border-color .15s;}
.fin .inp:focus-within{border-color:var(--amber);}
.fin .inp .u{color:var(--faint);font-family:var(--mono);font-size:13px;}
.fin .inp input{width:100%;background:transparent;border:none;color:var(--text);font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:14.5px;outline:none;min-width:0;-moz-appearance:textfield;}
.fin input[type=number]::-webkit-outer-spin-button,.fin input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
.fin .row{display:flex;align-items:center;gap:10px;background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:11px 13px;margin-bottom:9px;}
.fin .rname{flex:1;background:transparent;border:none;border-bottom:1px solid transparent;color:var(--text);font-size:14.5px;font-weight:600;font-family:var(--sans);padding:2px 0;outline:none;min-width:0;}
.fin .rname:focus{border-bottom-color:var(--line2);}
.fin .ramt{width:104px;flex:none;}
.fin .rrate{width:70px;flex:none;}
.fin .row.acct{flex-direction:column;align-items:stretch;gap:11px;}
.fin .acct-top{display:flex;align-items:center;gap:10px;}
.fin .acct-fields{display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;}
.fin select{border:1px solid var(--line2);border-radius:8px;color:var(--muted);font-size:11.5px;padding:7px 8px;outline:none;max-width:100%;}
.fin select:focus{border-color:var(--amber);}
.fin .acct-fields select{flex:1;height:34px;align-self:flex-end;}
.fin .capline{display:flex;align-items:flex-end;gap:9px;flex-wrap:wrap;padding-top:11px;border-top:1px solid var(--line);}
.fin .capline .field{flex:none;}
.fin .capline select{flex:1;min-width:130px;height:34px;align-self:flex-end;}
.fin .caphint{font-family:var(--mono);font-size:10.5px;color:var(--faint);width:100%;line-height:1.55;}
.fin .caphint.warn-txt{color:var(--red);}
.fin .icon-btn{background:transparent;border:none;color:var(--faint);cursor:pointer;padding:5px;border-radius:7px;display:inline-flex;transition:color .15s,background .15s;flex:none;}
.fin .icon-btn:hover{color:var(--red);background:rgba(232,105,91,.1);}
.fin .loan{background:var(--panel2);border:1px solid var(--line);border-radius:13px;padding:14px;margin-bottom:12px;}
.fin .loan.done{opacity:.6;}
.fin .loan-top{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
.fin .rank{font-family:var(--mono);font-size:11px;font-weight:700;color:var(--amber);background:var(--amber-soft);border:1px solid rgba(245,166,35,.3);border-radius:7px;padding:3px 8px;flex:none;}
.fin .rank.paid{color:var(--green);background:rgba(92,203,139,.12);border-color:rgba(92,203,139,.32);}
.fin .fields3{display:grid;grid-template-columns:1.3fr .8fr 1fr;gap:10px;}
.fin .loan-foot{display:flex;align-items:center;justify-content:space-between;margin-top:12px;font-family:var(--mono);font-size:11.5px;color:var(--faint);gap:10px;flex-wrap:wrap;}
.fin .payoff-badge b{color:var(--amber);font-weight:600;} .fin .payoff-badge.paid b{color:var(--green);}
.fin .num-box{display:flex;align-items:center;gap:6px;background:var(--panel2);border:1px solid var(--line2);border-radius:10px;padding:8px 12px;}
.fin .num-box.sm{padding:6px 10px;}
.fin .num-box .pfx{color:var(--faint);font-family:var(--mono);font-size:13px;}
.fin .num-input{width:92px;background:transparent;border:none;color:var(--amber);font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:19px;font-weight:600;outline:none;}
.fin .num-box.sm .num-input{font-size:15px;width:66px;}
.fin .budget{font-family:var(--mono);font-size:12px;color:var(--faint);margin-top:12px;}
.fin .budget b{color:var(--text);font-weight:600;}
.fin .donut-wrap{position:relative;}
.fin .donut-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;}
.fin .dc-v{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:19px;font-weight:600;color:var(--text);}
.fin .dc-s{font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--faint);margin-top:3px;}
.fin .dlegend{display:flex;flex-direction:column;gap:8px;}
.fin .dl-row{display:flex;align-items:center;gap:9px;font-family:var(--mono);font-size:12.5px;}
.fin .dl-row .nm{color:var(--muted);flex:1;}
.fin .dl-row .vl{color:var(--text);font-weight:600;} .fin .dl-row .pc{color:var(--faint);width:42px;text-align:right;}
.fin .split{display:grid;grid-template-columns:1fr;gap:16px;align-items:center;}
@media(min-width:620px){.fin .split{grid-template-columns:200px 1fr;}}
.fin .catrow{margin-bottom:11px;}
.fin .cattop{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;font-family:var(--mono);font-size:12.5px;}
.fin .cattop .cn{color:var(--muted);} .fin .cattop .cv{color:var(--text);font-weight:600;} .fin .cattop .cp{color:var(--faint);font-size:11px;margin-left:8px;}
.fin .catbar{height:8px;background:var(--bg);border-radius:20px;overflow:hidden;}
.fin .catfill{height:100%;border-radius:20px;transition:width .4s ease;}
.fin .flowbar{display:flex;height:26px;border-radius:8px;overflow:hidden;margin:4px 0 12px;border:1px solid var(--line);}
.fin .flowseg{height:100%;}
.fin .flowkey{display:flex;flex-wrap:wrap;gap:14px;}
.fin .fk{display:flex;align-items:center;gap:7px;font-family:var(--mono);font-size:12px;color:var(--muted);}
.fin .fk b{color:var(--text);font-weight:600;}
.fin .prog-nums{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;}
.fin .prog-pct{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:30px;font-weight:600;color:var(--amber);letter-spacing:-0.02em;}
.fin .prog-rem{font-family:var(--mono);font-size:12px;color:var(--faint);text-align:right;}
.fin .prog-rem b{color:var(--text);font-weight:600;}
.fin .track{height:10px;background:var(--bg);border:1px solid var(--line);border-radius:20px;overflow:hidden;}
.fin .fill{height:100%;background:linear-gradient(90deg,#B5760F,var(--amber));border-radius:20px;transition:width .5s ease;}
.fin .btn{display:inline-flex;align-items:center;gap:7px;font-family:var(--sans);font-size:13px;font-weight:600;border-radius:10px;padding:9px 14px;cursor:pointer;border:1px solid transparent;transition:filter .15s,background .15s;}
.fin .btn-amber{background:var(--amber);color:#1A1206;} .fin .btn-amber:hover{filter:brightness(1.08);}
.fin .btn-ghost{background:transparent;border-color:var(--line2);color:var(--muted);} .fin .btn-ghost:hover{color:var(--text);border-color:var(--faint);}
.fin .btn-add{width:100%;justify-content:center;background:transparent;border:1px dashed var(--line2);color:var(--muted);padding:11px;}
.fin .btn-add:hover{border-color:var(--amber);color:var(--amber);}
.fin .empty{font-family:var(--mono);font-size:12px;color:var(--faint);text-align:center;padding:18px 0;line-height:1.6;}
.fin .warn{display:flex;gap:12px;align-items:flex-start;background:rgba(232,105,91,.08);border:1px solid rgba(232,105,91,.3);border-radius:12px;padding:14px 16px;margin-bottom:16px;}
.fin .warn .wt{font-size:13px;font-weight:600;color:var(--red);margin-bottom:3px;}
.fin .warn .wb{font-size:12.5px;color:var(--muted);line-height:1.5;}
.fin .tbtn.on{color:var(--amber);border-color:rgba(245,166,35,.45);background:var(--amber-soft);}
.fin .panel.help{border-color:rgba(245,166,35,.28);}
.fin .help .phead{margin-bottom:10px;}
.fin .help .ptitle{color:var(--amber);text-transform:none;letter-spacing:.02em;font-size:13px;}
.fin .help-intro{font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:14px;}
.fin .help-list{margin:0;display:grid;grid-template-columns:1fr;gap:11px;}
@media(min-width:780px){.fin .help-list{grid-template-columns:1fr 1fr;gap:11px 18px;}}
.fin .help-item{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:11px 13px;}
.fin .help-item dt{font-size:12.5px;font-weight:600;color:var(--text);margin-bottom:4px;}
.fin .help-item dd{margin:0;font-size:12.5px;color:var(--muted);line-height:1.6;}
.fin .help-foot{font-family:var(--mono);font-size:10.5px;color:var(--faint);margin-top:12px;}
.fin .notice{display:flex;align-items:center;gap:10px;font-family:var(--mono);font-size:11.5px;color:var(--faint);margin-bottom:14px;background:var(--amber-soft);border:1px solid rgba(245,166,35,.22);border-radius:10px;padding:9px 12px;}
.fin .notice button{margin-left:auto;background:none;border:none;color:var(--faint);cursor:pointer;font-size:15px;line-height:1;padding:2px 6px;}
.fin .notice button:hover{color:var(--text);}
.fin .modal{position:fixed;inset:0;background:rgba(6,10,16,.74);display:flex;align-items:center;justify-content:center;z-index:60;padding:18px;}
.fin .modal-card{background:var(--panel);border:1px solid var(--line2);border-radius:16px;padding:20px;width:min(580px,94vw);max-height:88vh;overflow:auto;}
.fin .modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.fin .modal-head span{font-size:14px;font-weight:600;}
.fin .jsonbox{width:100%;height:180px;background:var(--panel3);border:1px solid var(--line2);border-radius:10px;color:var(--muted);font-size:11px;padding:11px;outline:none;resize:vertical;line-height:1.5;}
.fin .modal-row{display:flex;gap:9px;margin-top:12px;flex-wrap:wrap;align-items:center;}
.fin .filebtn{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--muted);background:transparent;border:1px dashed var(--line2);border-radius:10px;padding:10px 14px;cursor:pointer;}
.fin .filebtn:hover{border-color:var(--amber);color:var(--amber);}
.fin .mnote{font-family:var(--mono);font-size:11px;color:var(--faint);line-height:1.6;margin:6px 0 2px;}
.fin input[type=date],.fin input[type=text],.fin input[type=number]{border:1px solid var(--line2);border-radius:9px;font-size:12.5px;padding:8px 9px;outline:none;}
.fin input[type=date]:focus,.fin input[type=text]:focus,.fin input[type=number]:focus{border-color:var(--amber);}
.fin .inp input[type=number],.fin .num-box .num-input,.fin .pctbox input[type=number]{border:none;padding:0;background:transparent;}
.fin .seg{display:inline-flex;background:var(--bg);border:1px solid var(--line2);border-radius:9px;overflow:hidden;flex:none;}
.fin .seg button{background:transparent;border:none;color:var(--faint);font-family:var(--mono);font-size:11.5px;padding:7px 11px;cursor:pointer;transition:background .15s,color .15s;}
.fin .seg button.on{color:#1A1206;background:var(--amber);}
.fin .card{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:10px;}
.fin .card-r1{display:flex;align-items:center;gap:9px;margin-bottom:10px;}
.fin .card-r2{display:flex;align-items:center;gap:9px;flex-wrap:wrap;}
.fin .cap{font-family:var(--mono);font-size:11px;color:var(--faint);}
.fin .dist{margin-top:11px;padding-top:11px;border-top:1px solid var(--line);}
.fin .dist-lbl{font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--faint);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:8px;}
.fin .dist-row{display:flex;align-items:center;gap:7px;margin-bottom:7px;}
.fin .dist-row select{flex:1;min-width:0;}
.fin .pctbox{display:flex;align-items:center;background:var(--bg);border:1px solid var(--line2);border-radius:8px;padding:5px 8px;width:74px;flex:none;}
.fin .pctbox input{width:100%;background:transparent;color:var(--text);font-size:13px;outline:none;text-align:right;-moz-appearance:textfield;}
.fin .pctbox .u{color:var(--faint);font-family:var(--mono);font-size:12px;margin-left:3px;}
.fin .remain{font-family:var(--mono);font-size:12px;color:var(--green);font-weight:600;flex:none;width:74px;text-align:right;}
.fin .dist-add{background:transparent;border:1px dashed var(--line2);color:var(--muted);border-radius:8px;padding:7px;font-size:12px;cursor:pointer;width:100%;font-family:var(--sans);font-weight:600;}
.fin .dist-add:hover{border-color:var(--amber);color:var(--amber);}
.fin .arrow{color:var(--faint);display:inline-flex;padding:0 1px;}
.fin .chk{display:inline-flex;align-items:center;gap:8px;cursor:pointer;user-select:none;font-family:var(--mono);font-size:11px;color:var(--muted);}
.fin .chk input{width:15px;height:15px;accent-color:var(--amber);cursor:pointer;}
.fin .switch{display:flex;align-items:center;gap:11px;cursor:pointer;user-select:none;margin-top:14px;}
.fin .switch input{position:absolute;opacity:0;width:0;height:0;}
.fin .swtrack{width:40px;height:22px;background:var(--panel2);border:1px solid var(--line2);border-radius:20px;position:relative;transition:background .15s,border-color .15s;flex:none;}
.fin .swknob{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--faint);transition:transform .15s,background .15s;}
.fin .switch input:checked+.swtrack{background:var(--amber-soft);border-color:var(--amber);}
.fin .switch input:checked+.swtrack .swknob{transform:translateX(18px);background:var(--amber);}
.fin .sw-label{font-size:13px;color:var(--muted);}
.fin .assume{font-family:var(--mono);font-size:10.5px;color:var(--faint);line-height:1.6;margin-top:8px;}
.fin .endwrap{display:inline-flex;align-items:center;gap:6px;}
.fin .endwrap .cap{white-space:nowrap;}
.fin .endwrap input[type=date]{font-size:11.5px;padding:6px 8px;}
.fin .endwrap.off input[type=date]{opacity:.45;}
.fin .cardrow{display:flex;align-items:center;gap:9px;background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:11px 13px;margin-bottom:9px;flex-wrap:wrap;}
.fin .cardbal{font-family:var(--mono);font-size:12px;color:var(--faint);width:100%;display:flex;justify-content:space-between;gap:10px;padding-top:4px;border-top:1px solid var(--line);margin-top:2px;}
.fin .cardbal b{color:var(--violet);font-weight:600;}
.fin .badge{font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--violet);
  background:rgba(185,140,232,.13);border:1px solid rgba(185,140,232,.32);border-radius:6px;padding:2px 6px;flex:none;}
.fin .toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:90;display:flex;align-items:center;gap:9px;
  background:var(--panel3);border:1px solid var(--line2);border-radius:11px;padding:11px 16px;font-family:var(--mono);font-size:12.5px;
  color:var(--text);box-shadow:0 10px 30px rgba(0,0,0,.5);animation:toastIn .22s cubic-bezier(.2,.7,.3,1) both;max-width:88vw;}
.fin .toast.err{border-color:rgba(232,105,91,.5);}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
@media(prefers-reduced-motion:reduce){.fin .toast{animation:none;}}
.fin .rise{animation:rise .45s cubic-bezier(.2,.7,.3,1) both;}
@keyframes rise{from{opacity:0;transform:translateY(9px);}to{opacity:1;transform:none;}}
.fin :focus-visible{outline:2px solid var(--amber);outline-offset:2px;}
@media(prefers-reduced-motion:reduce){.fin .rise{animation:none;}.fin .fill,.fin .catfill{transition:none;}}
`;
const Stat = ({
  k,
  v,
  accent
}) => React.createElement("div", {
  className: "stat"
}, React.createElement("div", {
  className: "k",
  dangerouslySetInnerHTML: {
    __html: k
  }
}), React.createElement("div", {
  className: "v mono " + (accent || "")
}, v));
function NumField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  cls,
  readOnly
}) {
  return React.createElement("div", {
    className: "field " + (cls || "")
  }, React.createElement("label", null, label), React.createElement("div", {
    className: "inp"
  }, prefix && React.createElement("span", {
    className: "u"
  }, prefix), React.createElement("input", {
    type: "number",
    inputMode: "decimal",
    value: value,
    readOnly: readOnly,
    onChange: e => onChange && onChange(e.target.value)
  }), suffix && React.createElement("span", {
    className: "u"
  }, suffix)));
}
const Seg = ({
  value,
  options,
  onChange,
  cls
}) => React.createElement("div", {
  className: "seg " + (cls || "")
}, options.map(o => React.createElement("button", {
  key: o.v,
  className: value === o.v ? "on" : "",
  onClick: () => onChange(o.v)
}, o.label)));
function Modal({
  title,
  onClose,
  children
}) {
  return React.createElement("div", {
    className: "modal",
    onClick: onClose
  }, React.createElement("div", {
    className: "modal-card",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "modal-head"
  }, React.createElement("span", null, title), React.createElement("button", {
    className: "icon-btn",
    onClick: onClose,
    "aria-label": "Close"
  }, React.createElement(X, {
    size: 18
  }))), children));
}
function Donut({
  data,
  center,
  sub
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return React.createElement("div", {
    className: "split"
  }, React.createElement("div", {
    className: "donut-wrap"
  }, React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 186
  }, React.createElement(PieChart, null, React.createElement(Pie, {
    data: data.length ? data : [{
      name: "—",
      value: 1,
      color: "#1B2735"
    }],
    dataKey: "value",
    nameKey: "name",
    innerRadius: 58,
    outerRadius: 82,
    paddingAngle: data.length > 1 ? 2 : 0,
    stroke: "none",
    isAnimationActive: false
  }, (data.length ? data : [{
    color: "#1B2735"
  }]).map((d, i) => React.createElement(Cell, {
    key: i,
    fill: d.color
  }))))), React.createElement("div", {
    className: "donut-center"
  }, React.createElement("div", {
    className: "dc-v"
  }, center), React.createElement("div", {
    className: "dc-s"
  }, sub))), React.createElement("div", {
    className: "dlegend"
  }, data.map((d, i) => React.createElement("div", {
    className: "dl-row",
    key: i
  }, React.createElement("span", {
    className: "dot",
    style: {
      background: d.color
    }
  }), React.createElement("span", {
    className: "nm"
  }, d.name), React.createElement("span", {
    className: "vl"
  }, fmtBig(d.value)), React.createElement("span", {
    className: "pc"
  }, Math.round(d.value / total * 100), "%")))));
}
function LoanCard({
  loan,
  rank,
  payoffMonth,
  start,
  hasPayments,
  onField,
  onBalance,
  onRemove
}) {
  const paid = n0(loan.balance) <= 0;
  const iFrom = loan.interestFrom ? parseDate(loan.interestFrom) : null;
  const deferred = iFrom && !isNaN(iFrom) && iFrom > start;
  return React.createElement("div", {
    className: "loan" + (paid ? " done" : "")
  }, React.createElement("div", {
    className: "loan-top"
  }, React.createElement("span", {
    className: "rank" + (paid ? " paid" : "")
  }, paid ? "PAID" : "#" + (rank || "—")), React.createElement("input", {
    className: "rname",
    value: loan.name,
    onChange: e => onField(loan.id, "name", e.target.value),
    "aria-label": "Loan name"
  }), React.createElement("button", {
    className: "icon-btn",
    onClick: () => onRemove(loan.id),
    "aria-label": "Remove"
  }, React.createElement(Trash2, {
    size: 16
  }))), React.createElement("div", {
    className: "fields3"
  }, React.createElement(NumField, {
    label: "Balance",
    prefix: "$",
    value: loan.balance,
    onChange: v => onBalance(loan.id, v)
  }), React.createElement(NumField, {
    label: "Rate",
    suffix: "%",
    value: loan.apr,
    onChange: v => onField(loan.id, "apr", v)
  }), React.createElement(NumField, {
    label: "Min / mo",
    prefix: "$",
    value: loan.minPayment,
    onChange: v => onField(loan.id, "minPayment", v)
  })), React.createElement("div", {
    className: "loan-foot"
  }, paid ? React.createElement("span", {
    className: "payoff-badge paid"
  }, React.createElement(Check, {
    size: 12,
    style: {
      verticalAlign: -2,
      marginRight: 4
    }
  }), "Cleared") : payoffMonth != null ? React.createElement("span", {
    className: "payoff-badge"
  }, "Clears ", React.createElement("b", null, fmtDate(addMonths(start, payoffMonth)))) : React.createElement("span", {
    className: "payoff-badge"
  }, "Not cleared in 40 years"), React.createElement("span", {
    className: "endwrap",
    style: {
      marginLeft: "auto"
    }
  }, React.createElement("span", {
    className: "cap"
  }, deferred ? "deferred until" : "interest from"), React.createElement("input", {
    type: "date",
    value: loan.interestFrom || "",
    onChange: e => onField(loan.id, "interestFrom", e.target.value),
    "aria-label": "Interest starts",
    title: "Interest accrues from this date. Push it forward for a subsidised loan in deferment."
  }), deferred ? React.createElement("span", {
    className: "badge"
  }, "no interest yet") : null), hasPayments && React.createElement("span", null, "from $", Math.round(n0(loan.originalBalance)).toLocaleString())));
}
const EndDate = ({
  value,
  onChange
}) => React.createElement("span", {
  className: "endwrap" + (value ? "" : " off")
}, React.createElement("span", {
  className: "cap"
}, "ends"), React.createElement("input", {
  type: "date",
  value: value || "",
  onChange: e => onChange(e.target.value),
  "aria-label": "Ends (optional)",
  title: "Optional — leave blank to run forever"
}), value ? React.createElement("button", {
  className: "icon-btn",
  onClick: () => onChange(""),
  "aria-label": "Clear end date"
}, React.createElement(X, {
  size: 13
})) : null);
const Tip = ({
  active,
  payload,
  label,
  start,
  rows
}) => {
  if (!active || !payload || !payload.length) return null;
  const d = addDays(start, label * 7);
  return React.createElement("div", {
    className: "tt"
  }, React.createElement("div", {
    className: "tt-m"
  }, d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })), rows.map((r, i) => {
    const p = payload.find(x => x.dataKey === r.key);
    return p ? React.createElement("div", {
      className: "tt-row",
      key: i
    }, React.createElement("span", {
      className: "dot",
      style: {
        background: r.color
      }
    }), r.name, React.createElement("b", null, fmtMoney(p.value))) : null;
  }));
};
const MultiTip = ({
  active,
  payload,
  label,
  start,
  names
}) => {
  if (!active || !payload || !payload.length) return null;
  const d = addDays(start, label * 7);
  const sorted = [...payload].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 8);
  return React.createElement("div", {
    className: "tt"
  }, React.createElement("div", {
    className: "tt-m"
  }, d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })), sorted.map((p, i) => React.createElement("div", {
    className: "tt-row",
    key: i
  }, React.createElement("span", {
    className: "dot",
    style: {
      background: p.stroke || p.color
    }
  }), names[p.dataKey] || p.dataKey, React.createElement("b", null, fmtBig(p.value)))));
};
const WEEKS = 2080;
const HELP = {
  overview: {
    title: "Overview",
    intro: "A read-only summary. Nothing here is editable — every number is driven by what you enter on the other tabs.",
    points: [["The four stat cards", "Net worth is assets minus debts today. Monthly surplus is income minus living costs, before debt payments and investing. The debt-free and independence dates come from the projection below."], ["Net worth projection", "Simulates your accounts, debts, income and spending forward week by week for up to 40 years. Amber is net worth, green is investments, red is total debt."], ["Reading the chart", "Scroll or pinch to zoom, drag to pan, or use the 1Y / 5Y / Max buttons. Hover any point for exact figures on that date."], ["Every account & debt over time", "The same simulation, but with one line per account and a dashed line per debt, so you can see which account is doing the work — or running dry."], ["Warnings", "A red banner appears if you're spending more than you earn, or if any single account goes negative at some point in the projection."]]
  },
  accounts: {
    title: "Accounts",
    intro: "Your balance sheet — everything you own. This is where you set starting balances and expected returns.",
    points: [["Add your accounts", "Give each one a name, a type, today's balance, and an expected annual return. Picking a type fills in a sensible default rate, which you can then override."], ["Types matter", "Brokerage and Retirement count as 'invested' for the asset mix and the independence target. Savings, Checking, Cash and Other asset don't."], ["Returns are nominal and constant", "The projection applies the rate you set every week, forever. It does not model volatility, crashes, inflation or tax on gains."], ["Caps and sweeping (optional)", "Set a cap to stop cash idling in an account. Anything above the cap is swept to the destination you pick — another account, or a debt to pay down."], ["Watch the cap warning", "The hint under each cap tells you what that account's heaviest month costs. A cap below that number will overdraw the account, and it turns red to say so."]]
  },
  cashflow: {
    title: "Cash flow",
    intro: "Everything that moves money, with dates. This tab drives almost the entire projection, so it's worth getting right.",
    points: [["Income", "Enter take-home pay per paycheck and how often it arrives. Enter gross separately — as an annual salary or per paycheck — since percentage-based deductions are calculated off gross."], ["Pre-tax deductions and match", "401k contributions never reach take-home, so they're added on top and sent straight to the account you choose. An employer match of '100% up to 3%' means every dollar matched, capped at the first 3% of gross."], ["Raises, promotions and bonuses", "A raise compounds annually. A promotion is a step change to a new salary on a date. A bonus lands once a year on its own date and can be a flat amount or a percentage of salary."], ["Splitting a paycheck", "Route a percentage or fixed amount to other accounts. The first row in the list receives whatever is left over."], ["Expenses", "Set an amount, how often, and which account or credit card it comes from. Add an end date for anything temporary — tuition, a lease — so it doesn't inflate your long-run independence target."], ["Payments and transfers", "Payments reduce debt; transfers move money between your own accounts. A card payment can be set to 'pay in full' so it clears whatever was charged that month."]]
  },
  debt: {
    title: "Debt",
    intro: "Loans and cards, and how fast your plan clears them. Balances are edited here; the payments that clear them live on the Cash flow tab.",
    points: [["Balance decay", "Amber is your actual plan. Cyan is what would happen paying only the minimums. The gap between them is what your extra payments are buying you."], ["Interest saved and time saved", "Both stat cards compare your plan against that minimums-only path."], ["Payoff order", "Loans are ranked highest rate first. When a payment more than clears its target, the surplus rolls to your highest-rate remaining loan automatically."], ["Interest start date", "Interest accrues from this date. Push it into the future for a subsidised loan sitting in deferment, and it won't accrue until then."], ["Credit cards behave differently", "A card only charges interest on a balance you carry. Pay it in full each month and it costs nothing — so cards are excluded from the debt-free date calculation."], ["Changing the plan", "To pay debt down faster, edit or add a payment on the Cash flow tab. This tab shows the result."]]
  },
  invest: {
    title: "Invest",
    intro: "Long-run growth and what it would take to stop needing a salary.",
    points: [["Portfolio growth", "Splits your projected investment balance into money you contributed versus returns earned on top of it."], ["Independence target", "Your annual recurring spending divided by your withdrawal rate. At the default 4%, that's 25× your yearly costs."], ["Expenses that end don't count", "Anything with an end date inside the next ten years is treated as temporary and left out of the target, since it isn't a forever cost."], ["Adjust the withdrawal rate", "Lower it for a more conservative target that needs a bigger portfolio; raise it for the opposite."], ["A projection, not advice", "Constant returns, today's dollars, no inflation, tax, volatility or sequence-of-returns risk. Treat the dates as a direction of travel, not a promise."]]
  }
};
function FinancialSimulator() {
  const [accounts, setAccounts] = useState(null);
  const [debts, setDebts] = useState([]);
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [debtPayments, setDebtPayments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState(seedSettings());
  const [tab, setTab] = useState("overview");
  const [ready, setReady] = useState(false);
  const [seedNote, setSeedNote] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [modal, setModal] = useState(null);
  const [importText, setImportText] = useState("");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = (msg, isErr, ms) => {
    setToast({
      msg,
      isErr: !!isErr
    });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), ms || 2600);
  };
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);
  const storageWarnedRef = useRef(false);
  const persist = (key, value) => {
    store.set(key, value).then(ok => {
      if (ok || storageWarnedRef.current) return;
      storageWarnedRef.current = true;
      showToast("Your browser is blocking saved data — changes here won't be kept once you leave this page", true, 6000);
    });
  };
  const [logLoan, setLogLoan] = useState("");
  const [logAmt, setLogAmt] = useState("");
  const [logDate, setLogDate] = useState(todayISO());
  const start = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);
  useEffect(() => {
    (async () => {
      const K = ["fin3:accounts", "fin3:debts", "fin3:income", "fin3:expenses", "fin3:transfers", "fin3:debtPayments", "fin3:payments", "fin3:settings", "fin3:seedNote"];
      const O = ["fin2:accounts", "fin2:debts", "fin2:income", "fin2:expenses", "fin2:contributions", "fin2:payments", "fin2:settings"];
      const [a3, d3, i3, e3, t3, dp3, p3, s3, note, a2, d2, i2, e2, c2, p2, s2] = await Promise.all([...K, ...O].map(k => store.get(k)));
      const accts = a3 ? parse(a3, SEED_ACCOUNTS()) : a2 ? parse(a2, SEED_ACCOUNTS()) : SEED_ACCOUNTS();
      const dbts = d3 ? parse(d3, SEED_DEBTS()) : d2 ? parse(d2, SEED_DEBTS()) : SEED_DEBTS();
      const id = pickIds(accts, dbts);
      setAccounts(accts);
      setDebts(normDebts(dbts));
      const rawInc = i3 ? parse(i3, null) : i2 ? parse(i2, null) : null;
      setIncome(rawInc ? normIncome(rawInc, id.chk, id.ret) : seedIncome(id));
      setExpenses(e3 ? parse(e3, seedExpenses(id)) : e2 ? parse(e2, seedExpenses(id)) : seedExpenses(id));
      setTransfers(t3 ? parse(t3, seedTransfers(id)) : c2 ? parse(c2, seedTransfers(id)) : seedTransfers(id));
      const oldS = parse(s2, {});
      if (dp3) setDebtPayments(parse(dp3, []));else {
        const base = seedDebtPays(id, dbts).filter(x => x.amount > 0);
        if (oldS.extraDebt != null) {
          const ex = base.find(x => x.name === "Extra toward payoff");
          if (ex) ex.amount = n0(oldS.extraDebt);
        }
        if (oldS.debtFromAcct) base.forEach(x => {
          x.fromAcct = oldS.debtFromAcct;
        });
        setDebtPayments(base);
      }
      setPayments(p3 ? parse(p3, []) : p2 ? parse(p2, []) : []);
      setSettings(s3 ? parse(s3, seedSettings()) : {
        ...seedSettings(),
        ...(oldS.withdrawalRate != null ? {
          withdrawalRate: Number(oldS.withdrawalRate)
        } : {}),
        ...(oldS.redirect != null ? {
          redirect: !!oldS.redirect
        } : {})
      });
      const fresh = !a3 && !a2;
      if (note === "1" || fresh) {
        setSeedNote(true);
        if (fresh) store.set("fin3:seedNote", "1");
      }
      setReady(true);
    })();
  }, []);
  useEffect(() => {
    if (ready && accounts) persist("fin3:accounts", JSON.stringify(accounts));
  }, [accounts, ready]);
  useEffect(() => {
    if (ready) persist("fin3:debts", JSON.stringify(debts));
  }, [debts, ready]);
  useEffect(() => {
    if (ready) persist("fin3:income", JSON.stringify(income));
  }, [income, ready]);
  useEffect(() => {
    if (ready) persist("fin3:expenses", JSON.stringify(expenses));
  }, [expenses, ready]);
  useEffect(() => {
    if (ready) persist("fin3:transfers", JSON.stringify(transfers));
  }, [transfers, ready]);
  useEffect(() => {
    if (ready) persist("fin3:debtPayments", JSON.stringify(debtPayments));
  }, [debtPayments, ready]);
  useEffect(() => {
    if (ready) persist("fin3:payments", JSON.stringify(payments));
  }, [payments, ready]);
  useEffect(() => {
    if (ready) persist("fin3:settings", JSON.stringify(settings));
  }, [settings, ready]);
  const setS = (k, v) => setSettings(p => ({
    ...p,
    [k]: v
  }));
  const hasPay = id => payments.some(p => p.loanId === id);
  const upAcct = (id, k, v) => setAccounts(p => p.map(a => a.id === id ? {
    ...a,
    [k]: v
  } : a));
  const upAcctType = (id, t) => setAccounts(p => p.map(a => a.id === id ? {
    ...a,
    type: t,
    rate: ACCT_TYPES.find(x => x.v === t)?.rate ?? a.rate
  } : a));
  const addAcct = () => setAccounts(p => [...p, {
    id: uid(),
    name: "New account",
    type: "checking",
    balance: 0,
    rate: 0
  }]);
  const rmAcct = id => setAccounts(p => p.filter(a => a.id !== id));
  const upDebtField = (id, k, v) => setDebts(p => p.map(l => l.id === id ? {
    ...l,
    [k]: v
  } : l));
  const upDebtBal = (id, v) => setDebts(p => p.map(l => l.id === id ? {
    ...l,
    balance: v,
    originalBalance: hasPay(id) ? l.originalBalance : v
  } : l));
  const addDebt = () => setDebts(p => [...p, {
    id: uid(),
    name: "New loan",
    kind: "loan",
    balance: 0,
    originalBalance: 0,
    apr: 0,
    minPayment: 0,
    interestFrom: todayISO()
  }]);
  const addCard = () => {
    const nid = uid();
    setDebts(p => [...p, {
      id: nid,
      name: "New card",
      kind: "card",
      balance: 0,
      originalBalance: 0,
      apr: 22.99,
      minPayment: 0,
      interestFrom: todayISO()
    }]);
    return nid;
  };
  const addCardWithPayment = () => {
    const nid = uid();
    const ids = pickIds(accounts, debts);
    setDebts(p => [...p, {
      id: nid,
      name: "New card",
      kind: "card",
      balance: 0,
      originalBalance: 0,
      apr: 22.99,
      minPayment: 0,
      interestFrom: todayISO()
    }]);
    setDebtPayments(p => [...p, {
      id: uid(),
      name: "New card payment",
      amount: 0,
      date: nextFirstISO(),
      recur: "monthly",
      fromAcct: ids.chk,
      toDebt: nid,
      payFull: true
    }]);
  };
  const rmDebt = id => {
    setDebts(p => p.filter(l => l.id !== id));
    setDebtPayments(p => p.filter(x => x.toDebt !== id));
  };
  const upInc = (id, k, v) => setIncome(p => p.map(x => x.id === id ? {
    ...x,
    [k]: v
  } : x));
  const addInc = () => setIncome(p => [...p, {
    id: uid(),
    name: "New income",
    amount: 0,
    gross: 0,
    grossMode: "year",
    date: todayISO(),
    recur: "monthly",
    raise: 0,
    weekdayAdj: true,
    dist: [{
      acctId: (accounts[0] || {}).id
    }]
  }]);
  const rmInc = id => setIncome(p => p.filter(x => x.id !== id));
  const addSplit = iid => setIncome(p => p.map(x => x.id === iid ? {
    ...x,
    dist: [...(x.dist || []), {
      acctId: (accounts[0] || {}).id,
      mode: "pct",
      value: 10
    }]
  } : x));
  const upSplit = (iid, idx, k, v) => setIncome(p => p.map(x => x.id === iid ? {
    ...x,
    dist: x.dist.map((s, i) => i === idx ? {
      ...s,
      [k]: v
    } : s)
  } : x));
  const rmSplit = (iid, idx) => setIncome(p => p.map(x => x.id === iid ? {
    ...x,
    dist: x.dist.filter((_, i) => i !== idx)
  } : x));
  const addPreTax = iid => {
    const ids = pickIds(accounts, debts);
    setIncome(p => p.map(x => x.id === iid ? {
      ...x,
      preTax: [...(x.preTax || []), {
        id: uid(),
        name: "401k contribution",
        mode: "pct",
        value: 3,
        toAcct: ids.ret,
        counts: true
      }]
    } : x));
  };
  const upPreTax = (iid, pid, k, v) => setIncome(p => p.map(x => x.id === iid ? {
    ...x,
    preTax: (x.preTax || []).map(t => t.id === pid ? {
      ...t,
      [k]: v
    } : t)
  } : x));
  const rmPreTax = (iid, pid) => setIncome(p => p.map(x => x.id === iid ? {
    ...x,
    preTax: (x.preTax || []).filter(t => t.id !== pid)
  } : x));
  const setMatch = (iid, on) => {
    const ids = pickIds(accounts, debts);
    setIncome(p => p.map(x => x.id === iid ? {
      ...x,
      match: on ? {
        rate: 100,
        limit: 3,
        toAcct: ids.ret
      } : null
    } : x));
  };
  const upMatch = (iid, k, v) => setIncome(p => p.map(x => x.id === iid ? {
    ...x,
    match: {
      ...(x.match || {
        rate: 100,
        limit: 3
      }),
      [k]: v
    }
  } : x));
  const setBonus = (iid, on) => setIncome(p => p.map(x => x.id === iid ? {
    ...x,
    bonus: on ? {
      mode: "pct",
      value: 10,
      date: isoDate(addMonths(firstOfYear(), 14)),
      withhold: 30,
      preTaxApplies: true
    } : null
  } : x));
  const upBonus = (iid, k, v) => setIncome(p => p.map(x => x.id === iid ? {
    ...x,
    bonus: {
      ...(x.bonus || {
        mode: "pct",
        value: 10,
        withhold: 30,
        preTaxApplies: true
      }),
      [k]: v
    }
  } : x));
  const addChange = iid => setIncome(p => p.map(x => {
    if (x.id !== iid) return x;
    const last = (x.changes || []).slice().sort((a, b) => parseDate(a.date) - parseDate(b.date)).pop();
    return {
      ...x,
      changes: [...(x.changes || []), {
        id: uid(),
        date: isoDate(addMonths(new Date(), 12)),
        label: "Promotion",
        amount: last ? last.amount : x.amount,
        gross: last ? last.gross : x.gross,
        grossMode: x.grossMode || "year"
      }]
    };
  }));
  const upChange = (iid, cid, k, v) => setIncome(p => p.map(x => x.id === iid ? {
    ...x,
    changes: (x.changes || []).map(c => c.id === cid ? {
      ...c,
      [k]: v
    } : c)
  } : x));
  const rmChange = (iid, cid) => setIncome(p => p.map(x => x.id === iid ? {
    ...x,
    changes: (x.changes || []).filter(c => c.id !== cid)
  } : x));
  const upExp = (id, k, v) => setExpenses(p => p.map(x => x.id === id ? {
    ...x,
    [k]: v
  } : x));
  const addExp = () => setExpenses(p => [...p, {
    id: uid(),
    category: "New expense",
    amount: 0,
    date: todayISO(),
    recur: "monthly",
    fromAcct: pickIds(accounts, debts).chk
  }]);
  const rmExp = id => setExpenses(p => p.filter(x => x.id !== id));
  const upTr = (id, k, v) => setTransfers(p => p.map(x => x.id === id ? {
    ...x,
    [k]: v
  } : x));
  const addTr = () => {
    const id = pickIds(accounts, debts);
    setTransfers(p => [...p, {
      id: uid(),
      name: "New transfer",
      amount: 0,
      date: todayISO(),
      recur: "monthly",
      fromAcct: id.chk,
      toAcct: id.brk
    }]);
  };
  const rmTr = id => setTransfers(p => p.filter(x => x.id !== id));
  const upDp = (id, k, v) => setDebtPayments(p => p.map(x => x.id === id ? {
    ...x,
    [k]: v
  } : x));
  const addDp = recur => {
    const id = pickIds(accounts, debts);
    setDebtPayments(p => [...p, {
      id: uid(),
      name: recur === "once" ? "Extra payment" : "New payment",
      amount: 0,
      date: recur === "once" ? todayISO() : nextFirstISO(),
      recur,
      fromAcct: id.chk,
      toDebt: id.hiDebt
    }]);
  };
  const rmDp = id => setDebtPayments(p => p.filter(x => x.id !== id));
  const addPayment = () => {
    const amt = n0(logAmt);
    if (!logLoan || amt <= 0) return;
    setPayments(p => [{
      id: uid(),
      loanId: logLoan,
      amount: amt,
      date: logDate
    }, ...p]);
    setLogAmt("");
  };
  const rmPayment = id => setPayments(p => p.filter(x => x.id !== id));
  const dismissNote = () => {
    setSeedNote(false);
    store.set("fin3:seedNote", "0");
  };
  const resetAll = () => {
    if (!window.confirm("Reset everything back to the starting example?")) return;
    const accts = SEED_ACCOUNTS(),
      dbts = SEED_DEBTS(),
      id = pickIds(accts, dbts);
    setAccounts(accts);
    setDebts(normDebts(dbts));
    setIncome(seedIncome(id));
    setExpenses(seedExpenses(id));
    setTransfers(seedTransfers(id));
    setDebtPayments(seedDebtPays(id, dbts));
    setPayments([]);
    setSettings(seedSettings());
    setSeedNote(true);
    store.set("fin3:seedNote", "1");
  };
  const buildDump = () => JSON.stringify({
    app: "fin-sim",
    version: 5,
    exportedAt: new Date().toISOString(),
    accounts,
    debts,
    income,
    expenses,
    transfers,
    debtPayments,
    payments,
    settings
  }, null, 2);
  const openExport = () => {
    setImportText(buildDump());
    setModal("export");
  };
  const copyText = async text => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  };
  const doCopy = async () => {
    const ok = await copyText(buildDump());
    showToast(ok ? "Copied to clipboard" : "Couldn't copy — select the text and copy manually", !ok);
  };
  const doDownload = async () => {
    const text = buildDump();
    const fname = "financial-simulator-" + todayISO() + ".json";
    if (window.showSaveFilePicker) {
      try {
        const h = await window.showSaveFilePicker({
          suggestedName: fname,
          types: [{
            description: "JSON file",
            accept: {
              "application/json": [".json"]
            }
          }]
        });
        const w = await h.createWritable();
        await w.write(text);
        await w.close();
        showToast("Saved " + fname);
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return;
      }
    }
    try {
      const blob = new Blob([text], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fname;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast("Download started — if nothing lands, use Copy");
      return;
    } catch {}
    const ok = await copyText(text);
    showToast(ok ? "Download blocked here — copied to clipboard instead" : "Couldn't save — select the text and copy manually", true);
  };
  const applyImport = text => {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      alert("That doesn't look like valid saved data.");
      return;
    }
    const accts = Array.isArray(data.accounts) ? data.accounts : accounts;
    const dbts = Array.isArray(data.debts) ? data.debts : debts;
    const id = pickIds(accts, dbts);
    if (Array.isArray(data.accounts)) setAccounts(data.accounts);
    if (Array.isArray(data.debts)) setDebts(normDebts(data.debts));
    if (Array.isArray(data.income)) setIncome(normIncome(data.income, id.chk, id.ret));
    if (Array.isArray(data.expenses)) setExpenses(data.expenses);
    if (Array.isArray(data.transfers)) setTransfers(data.transfers);else if (Array.isArray(data.contributions)) setTransfers(data.contributions);
    if (Array.isArray(data.debtPayments)) setDebtPayments(data.debtPayments);
    if (Array.isArray(data.payments)) setPayments(data.payments);
    if (data.settings && typeof data.settings === "object") setSettings({
      ...seedSettings(),
      ...data.settings
    });
    setModal(null);
    setSeedNote(false);
    store.set("fin3:seedNote", "0");
  };
  const onJsonFile = e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => setImportText(String(rd.result || ""));
    rd.readAsText(f);
    e.target.value = "";
  };
  const D = useMemo(() => {
    if (!accounts) return null;
    const per = (list, key) => list.reduce((s, x) => s + n0(x[key || "amount"]) * OPY[x.recur] / 12, 0);
    const loans = debts.filter(x => !isCard(x));
    const cards = debts.filter(x => isCard(x));
    const totalAssets = accounts.reduce((s, a) => s + n0(a.balance), 0);
    const totalDebt = debts.reduce((s, l) => s + n0(l.balance), 0);
    const totalLoans = loans.reduce((s, l) => s + n0(l.balance), 0);
    const netWorth = totalAssets - totalDebt;
    const mExp = per(expenses),
      mTr = per(transfers);
    const mBonusNet = income.reduce((s, i) => {
      const b = bonusOf(i, 1);
      return s + (b ? b.net / 12 : 0);
    }, 0);
    const mBonusPre = income.reduce((s, i) => {
      const b = bonusOf(i, 1);
      return s + (b ? (b.deferral + b.match) / 12 : 0);
    }, 0);
    const mPreTax = income.reduce((s, i) => s + payrollOf(i).total * OPY[i.recur] / 12, 0) + mBonusPre;
    const mInc = per(income) + mBonusNet;
    const cardIds = new Set(cards.map(c => c.id));
    const chargedTo = cid => expenses.filter(e => e.fromAcct === cid).reduce((s, e) => s + n0(e.amount) * OPY[e.recur] / 12, 0);
    const mDp = debtPayments.reduce((s, p) => s + (p.payFull && cardIds.has(p.toDebt) ? chargedTo(p.toDebt) : n0(p.amount) * OPY[p.recur] / 12), 0);
    const surplus = mInc - mExp;
    const savingsRate = mInc + mPreTax > 0 ? (surplus + mPreTax) / (mInc + mPreTax) * 100 : 0;
    const leftover = surplus - mTr - mDp;
    const monthlyInterest = loans.reduce((s, l) => s + n0(l.balance) * n0(l.apr) / 1200, 0);
    const sim = simulateWeekly({
      accounts,
      debts,
      income,
      expenses,
      transfers,
      debtPayments,
      settings,
      start,
      weeks: WEEKS
    });
    const minW = projectMinWeekly(debts, start, WEEKS);
    const maxW = Math.min(WEEKS, Math.max(sim.fire || 520, (sim.debtFree || 260) + 130, 260) + 60);
    const interestSaved = Math.max(0, minW.interest - sim.interest);
    const wksSaved = Math.max(0, (minW.clearedWeek == null ? WEEKS : minW.clearedWeek) - (sim.debtFree == null ? WEEKS : sim.debtFree));
    const nextCardPay = {};
    for (const c of cards) {
      const pays = debtPayments.filter(p => p.toDebt === c.id);
      if (!pays.length) continue;
      for (let w = 0; w < Math.min(sim.series.length - 1, 60); w++) {
        const ws = addDays(start, w * 7),
          we = addDays(ws, 7);
        const hit = pays.find(p => firesInWeek(p, ws, we));
        if (hit) {
          nextCardPay[c.id] = {
            week: w,
            date: ws,
            amount: hit.payFull ? sim.series[w].dbt[c.id] || 0 : n0(hit.amount),
            full: !!hit.payFull
          };
          break;
        }
      }
    }
    const loansNoPayment = loans.filter(l => n0(l.balance) > 0 && !debtPayments.some(p => p.toDebt === l.id));
    const worstMonthOut = aid => {
      const items = [...expenses.filter(e => e.fromAcct === aid), ...debtPayments.filter(p => p.fromAcct === aid), ...transfers.filter(t => t.fromAcct === aid)];
      let s = 0;
      for (const it of items) {
        if (it.recur === "once") continue;
        const amt = it.payFull && cardIds.has(it.toDebt) ? chargedTo(it.toDebt) : n0(it.amount);
        if (it.recur === "weekly") s += amt * 5;else if (it.recur === "biweekly") s += amt * 3;else if (it.recur === "semimonthly") s += amt * 2;else s += amt;
      }
      return s;
    };
    let sweepSum = 0;
    const sweepWks = Math.min(sim.series.length - 1, 156);
    for (let w = 0; w < sweepWks; w++) sweepSum += sim.series[w].swept || 0;
    const avgSweep = sweepWks > 0 ? sweepSum / (sweepWks / 52.1775) / 12 : 0;
    const capped = accounts.filter(a => a.cap != null && a.cap !== "" && a.spillTo);
    const acctColors = {},
      names = {};
    accounts.forEach((a, i) => {
      acctColors[a.id] = acctColor(i);
      names[a.id] = a.name;
    });
    const debtColors = {};
    debts.forEach((l, i) => {
      debtColors[l.id] = debtColor(i);
      names[l.id] = l.name;
    });
    names.nw = "Net worth";
    const cf = [];
    const cfMax = Math.min(sim.series.length - 1, 312);
    for (let w = 0; w <= cfMax; w++) {
      const s = sim.series[w];
      cf.push({
        w,
        income: s.inflow,
        spend: s.outflow,
        net: r2(s.inflow - s.outflow)
      });
    }
    for (let i = 0; i < cf.length; i++) {
      let sum = 0,
        cnt = 0;
      for (let j = i - 2; j <= i + 2; j++) if (j >= 0 && j < cf.length) {
        sum += cf[j].net;
        cnt++;
      }
      cf[i].smooth = r2(sum / cnt);
    }
    const debtCurve = sim.series.map(s => ({
      w: s.w,
      plan: s.loanDebt,
      min: minW.series[s.w]
    }));
    const bInv = accounts.filter(a => isInvest(a.type)).reduce((s, a) => s + n0(a.balance), 0);
    const bSav = accounts.filter(a => isSav(a.type)).reduce((s, a) => s + n0(a.balance), 0);
    const bCash = accounts.filter(a => isCash(a.type)).reduce((s, a) => s + n0(a.balance), 0);
    const alloc = [{
      name: "Investments",
      value: bInv,
      color: BUCKET_COLOR.Investments
    }, {
      name: "Savings",
      value: bSav,
      color: BUCKET_COLOR.Savings
    }, {
      name: "Cash",
      value: bCash,
      color: BUCKET_COLOR.Cash
    }].filter(x => x.value > 0);
    const spend = expenses.map(e => ({
      ...e,
      monthly: n0(e.amount) * OPY[e.recur] / 12
    })).filter(e => e.monthly > 0).sort((a, b) => b.monthly - a.monthly).map((e, i) => ({
      ...e,
      color: PAL[i % PAL.length]
    }));
    let negAcct = null;
    for (let w = 0; w < Math.min(sim.series.length, 312) && !negAcct; w++) {
      const m = sim.series[w].acct;
      for (const a of accounts) if (m[a.id] < -1) {
        negAcct = a.name;
        break;
      }
    }
    return {
      totalAssets,
      totalDebt,
      totalLoans,
      netWorth,
      loans,
      cards,
      mInc,
      mExp,
      mTr,
      mDp,
      mPreTax,
      mBonusNet,
      surplus,
      savingsRate,
      leftover,
      monthlyInterest,
      sim,
      minW,
      maxW,
      interestSaved,
      wksSaved,
      acctColors,
      debtColors,
      names,
      cf,
      debtCurve,
      alloc,
      spend,
      bInv,
      negAcct,
      nextCardPay,
      loansNoPayment,
      chargedTo,
      worstMonthOut,
      avgSweep,
      capped
    };
  }, [accounts, debts, income, expenses, transfers, debtPayments, settings, start]);
  const maxW = D ? D.maxW : 520;
  const scNW = useScope(maxW, 260);
  const scBal = useScope(maxW, 260);
  const scCF = useScope(Math.min(maxW, 312), 52);
  const scDebt = useScope(maxW, 260);
  const scInv = useScope(maxW, 260);
  if (!accounts || !D) return React.createElement(React.Fragment, null, React.createElement("style", null, CSS), React.createElement("div", {
    className: "fin"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "eyebrow"
  }, "loading…"))));
  const TABS = [{
    id: "overview",
    label: "Overview",
    Icon: LayoutGrid
  }, {
    id: "accounts",
    label: "Accounts",
    Icon: Wallet
  }, {
    id: "cashflow",
    label: "Cash flow",
    Icon: Receipt
  }, {
    id: "debt",
    label: "Debt",
    Icon: TrendingDown
  }, {
    id: "invest",
    label: "Invest",
    Icon: InvestIcon
  }];
  const nameOf = id => debts.find(l => l.id === id)?.name || "—";
  const w2date = w => addDays(start, w * 7);
  const fireN = D.sim.fireNumber;
  const defaultOverflow = accounts.find(a => isInvest(a.type)) || accounts.find(a => a.type === "checking") || accounts[0];
  const near = (a, b) => Math.abs(a - b) < 4;
  const ranges = (sc, mx) => {
    const span = sc.hi - sc.lo;
    return React.createElement("div", {
      className: "seg"
    }, React.createElement("button", {
      className: near(span, 52) ? "on" : "",
      onClick: () => sc.snap(52)
    }, "1Y"), React.createElement("button", {
      className: near(span, 260) ? "on" : "",
      onClick: () => sc.snap(260)
    }, "5Y"), React.createElement("button", {
      className: span >= mx - 4 ? "on" : "",
      onClick: () => sc.snap(mx)
    }, "Max"));
  };
  const ZHINT = React.createElement("div", {
    className: "zhint"
  }, "scroll or pinch to zoom · drag to pan");
  const axisProps = sc => ({
    dataKey: "w",
    type: "number",
    domain: [sc.lo, sc.hi],
    allowDataOverflow: true,
    tickFormatter: weekTick(start),
    tickLine: false,
    stroke: "var(--line2)",
    minTickGap: 28,
    tick: {
      fill: "var(--faint)",
      fontSize: 10,
      fontFamily: "var(--mono)"
    }
  });
  const yProps = {
    tickFormatter: fmtC,
    tickLine: false,
    axisLine: false,
    width: 48,
    tick: {
      fill: "var(--faint)",
      fontSize: 10,
      fontFamily: "var(--mono)"
    }
  };
  return React.createElement(React.Fragment, null, React.createElement("style", null, CSS), React.createElement("div", {
    className: "fin"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "topbar rise"
  }, React.createElement("div", null, React.createElement("div", {
    className: "eyebrow"
  }, "Net worth"), React.createElement("div", {
    className: "nwbig mono",
    style: {
      color: D.netWorth >= 0 ? "var(--text)" : "var(--red)"
    }
  }, fmtMoney(D.netWorth)), React.createElement("div", {
    className: "nwsub"
  }, "assets ", React.createElement("b", null, fmtBig(D.totalAssets)), " · debts ", React.createElement("b", null, fmtBig(D.totalDebt)), " · surplus ", React.createElement("b", null, fmtMoney(D.surplus)), "/mo")), React.createElement("div", {
    className: "toolbar"
  }, React.createElement("button", {
    className: "tbtn" + (showHelp ? " on" : ""),
    onClick: () => setShowHelp(v => !v),
    "aria-expanded": showHelp,
    "aria-controls": "help-panel"
  }, React.createElement(HelpCircle, {
    size: 13
  }), "Help"), React.createElement("button", {
    className: "tbtn",
    onClick: () => {
      setImportText("");
      setModal("import");
    }
  }, React.createElement(Upload, {
    size: 13
  }), "Import"), React.createElement("button", {
    className: "tbtn",
    onClick: openExport
  }, React.createElement(Download, {
    size: 13
  }), "Export"), React.createElement("button", {
    className: "tbtn",
    onClick: resetAll
  }, React.createElement(RotateCcw, {
    size: 13
  }), "Reset"))), React.createElement("div", {
    className: "tabs rise"
  }, TABS.map(({
    id,
    label,
    Icon
  }) => React.createElement("button", {
    key: id,
    className: "tabbtn" + (tab === id ? " active" : ""),
    onClick: () => setTab(id)
  }, React.createElement(Icon, {
    size: 15
  }), label))), showHelp && (() => {
    const h = HELP[tab] || HELP.overview;
    return React.createElement("div", {
      className: "panel help rise",
      id: "help-panel"
    }, React.createElement("div", {
      className: "phead"
    }, React.createElement("div", {
      className: "ptitle"
    }, React.createElement(HelpCircle, {
      size: 13,
      style: {
        verticalAlign: -2,
        marginRight: 6
      }
    }), "How to use · ", h.title), React.createElement("button", {
      className: "icon-btn",
      onClick: () => setShowHelp(false),
      "aria-label": "Close help"
    }, React.createElement(X, {
      size: 16
    }))), React.createElement("div", {
      className: "help-intro"
    }, h.intro), React.createElement("dl", {
      className: "help-list"
    }, h.points.map(([term, body], i) => React.createElement("div", {
      className: "help-item",
      key: i
    }, React.createElement("dt", null, term), React.createElement("dd", null, body)))), React.createElement("div", {
      className: "help-foot"
    }, "Switch tabs with the help open and these notes follow along."));
  })(), seedNote && React.createElement("div", {
    className: "notice rise"
  }, React.createElement(Zap, {
    size: 14,
    color: "var(--amber)"
  }), "Everything is an editable example — replace with your real numbers. It all saves automatically.", React.createElement("button", {
    onClick: dismissNote,
    "aria-label": "Dismiss"
  }, "×")), toast && React.createElement("div", {
    className: "toast" + (toast.isErr ? " err" : "")
  }, toast.isErr ? React.createElement(AlertTriangle, {
    size: 14,
    color: "var(--red)"
  }) : React.createElement(Check, {
    size: 14,
    color: "var(--green)"
  }), toast.msg), modal === "export" && React.createElement(Modal, {
    title: "Save your data to a file",
    onClose: () => setModal(null)
  }, React.createElement("div", {
    className: "mnote"
  }, "Your work saves automatically between sessions. This gives you a portable file you own — a backup, or to move to another device, then load with Import."), React.createElement("textarea", {
    className: "jsonbox",
    readOnly: true,
    value: importText,
    onClick: e => e.target.select()
  }), React.createElement("div", {
    className: "modal-row"
  }, React.createElement("button", {
    className: "btn btn-amber",
    onClick: doDownload
  }, React.createElement(Download, {
    size: 15
  }), "Download .json"), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: doCopy
  }, "Copy to clipboard"))), modal === "import" && React.createElement(Modal, {
    title: "Load saved data",
    onClose: () => setModal(null)
  }, React.createElement("div", {
    className: "mnote"
  }, "Load a file you exported earlier. This replaces what's currently here."), React.createElement("label", {
    className: "filebtn"
  }, React.createElement(Upload, {
    size: 15
  }), "Choose a .json file", React.createElement("input", {
    type: "file",
    accept: ".json,application/json",
    hidden: true,
    onChange: onJsonFile
  })), React.createElement("div", {
    className: "mnote",
    style: {
      marginTop: 12
    }
  }, "…or paste the JSON here:"), React.createElement("textarea", {
    className: "jsonbox",
    value: importText,
    onChange: e => setImportText(e.target.value),
    placeholder: "Paste exported data"
  }), React.createElement("div", {
    className: "modal-row"
  }, React.createElement("button", {
    className: "btn btn-amber",
    onClick: () => applyImport(importText)
  }, React.createElement(Check, {
    size: 15
  }), "Load data"), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => setModal(null)
  }, "Cancel"))), tab === "overview" && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "sgrid rise",
    style: {
      marginBottom: 16
    }
  }, React.createElement(Stat, {
    k: "Net worth<br/>today",
    v: fmtBig(D.netWorth),
    accent: D.netWorth >= 0 ? "green" : "red"
  }), React.createElement(Stat, {
    k: "Monthly<br/>surplus",
    v: fmtMoney(D.surplus),
    accent: D.surplus >= 0 ? "" : "red"
  }), React.createElement(Stat, {
    k: "Debt-free<br/>date",
    v: D.totalDebt > 0 ? D.sim.debtFree != null ? fmtDate(w2date(D.sim.debtFree)) : "40y+" : "Clear",
    accent: "amber"
  }), React.createElement(Stat, {
    k: "Financial indep.<br/>(25× expenses)",
    v: D.sim.fire != null ? fmtDate(w2date(D.sim.fire)) : "40y+",
    accent: "green"
  })), D.surplus < 0 && React.createElement("div", {
    className: "warn rise"
  }, React.createElement(AlertTriangle, {
    size: 18,
    color: "var(--red)",
    style: {
      flex: "none",
      marginTop: 1
    }
  }), React.createElement("div", null, React.createElement("div", {
    className: "wt"
  }, "Spending exceeds income"), React.createElement("div", {
    className: "wb"
  }, "You're ", fmtMoney(-D.surplus), "/mo in the red before debt or investing. Adjust items in Cash flow."))), !(D.surplus < 0) && D.negAcct && React.createElement("div", {
    className: "warn rise"
  }, React.createElement(AlertTriangle, {
    size: 18,
    color: "var(--red)",
    style: {
      flex: "none",
      marginTop: 1
    }
  }), React.createElement("div", null, React.createElement("div", {
    className: "wt"
  }, D.negAcct, " runs dry"), React.createElement("div", {
    className: "wb"
  }, "With these dated flows, ", D.negAcct, " goes negative at some point. Route more income into it, or draw some expenses or payments from another account."))), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Net worth projection"), ranges(scNW, maxW)), React.createElement("div", {
    className: "scope-wrap",
    ref: scNW.ref,
    ...scNW.handlers
  }, React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 286
  }, React.createElement(ComposedChart, {
    data: sampleRange(D.sim.series, scNW.lo, scNW.hi, 320).map(s => ({
      w: s.w,
      nw: s.nw,
      debt: s.debt,
      invest: s.invest
    })),
    margin: {
      top: 16,
      right: 12,
      bottom: 0,
      left: 6
    }
  }, React.createElement("defs", null, React.createElement("linearGradient", {
    id: "nwFill",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, React.createElement("stop", {
    offset: "0%",
    stopColor: "#F5A623",
    stopOpacity: 0.26
  }), React.createElement("stop", {
    offset: "100%",
    stopColor: "#F5A623",
    stopOpacity: 0
  }))), React.createElement(CartesianGrid, {
    stroke: "var(--line)",
    strokeDasharray: "2 4"
  }), React.createElement(XAxis, axisProps(scNW)), React.createElement(YAxis, yProps), React.createElement(Tooltip, {
    content: p => React.createElement(Tip, {
      ...p,
      start: start,
      rows: [{
        key: "nw",
        name: "Net worth",
        color: "var(--amber)"
      }, {
        key: "invest",
        name: "Investments",
        color: "var(--green)"
      }, {
        key: "debt",
        name: "Debt",
        color: "var(--red)"
      }]
    }),
    cursor: {
      stroke: "var(--line2)"
    }
  }), fireN > 0 && D.sim.fire != null && React.createElement(ReferenceLine, {
    y: fireN,
    stroke: "var(--amber)",
    strokeDasharray: "3 3",
    label: {
      value: "FI " + fmtBig(fireN),
      position: "insideTopRight",
      fill: "var(--amber)",
      fontSize: 9.5,
      fontFamily: "var(--mono)"
    }
  }), D.sim.debtFree != null && React.createElement(ReferenceLine, {
    x: D.sim.debtFree,
    stroke: "var(--red)",
    strokeDasharray: "2 3",
    strokeOpacity: 0.6,
    label: {
      value: "DEBT-FREE",
      position: "top",
      fill: "var(--red)",
      fontSize: 9,
      fontFamily: "var(--mono)"
    }
  }), React.createElement(Area, {
    type: "monotone",
    dataKey: "nw",
    stroke: "var(--amber)",
    strokeWidth: 2.6,
    fill: "url(#nwFill)",
    dot: false,
    activeDot: {
      r: 4,
      fill: "var(--amber)",
      stroke: "none"
    },
    isAnimationActive: false
  }), React.createElement(Line, {
    type: "monotone",
    dataKey: "invest",
    stroke: "var(--green)",
    strokeWidth: 1.5,
    dot: false,
    isAnimationActive: false
  }), React.createElement(Line, {
    type: "monotone",
    dataKey: "debt",
    stroke: "var(--red)",
    strokeWidth: 1.5,
    dot: false,
    isAnimationActive: false
  })))), ZHINT, React.createElement("div", {
    className: "assume"
  }, "Today's dollars · returns and rates held constant · a projection, not a guarantee or financial advice.")), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Every account & debt over time"), ranges(scBal, maxW)), React.createElement("div", {
    className: "scope-wrap",
    ref: scBal.ref,
    ...scBal.handlers
  }, React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 300
  }, React.createElement(ComposedChart, {
    data: sampleRange(D.sim.series, scBal.lo, scBal.hi, 320).map(s => ({
      w: s.w,
      nw: s.nw,
      ...s.acct,
      ...s.dbt
    })),
    margin: {
      top: 14,
      right: 12,
      bottom: 0,
      left: 6
    }
  }, React.createElement(CartesianGrid, {
    stroke: "var(--line)",
    strokeDasharray: "2 4"
  }), React.createElement(XAxis, axisProps(scBal)), React.createElement(YAxis, yProps), React.createElement(Tooltip, {
    content: p => React.createElement(MultiTip, {
      ...p,
      start: start,
      names: D.names
    }),
    cursor: {
      stroke: "var(--line2)"
    }
  }), accounts.map(a => React.createElement(Line, {
    key: a.id,
    type: "monotone",
    dataKey: a.id,
    stroke: D.acctColors[a.id],
    strokeWidth: 1.5,
    dot: false,
    isAnimationActive: false
  })), debts.map(l => React.createElement(Line, {
    key: l.id,
    type: "monotone",
    dataKey: l.id,
    stroke: D.debtColors[l.id],
    strokeWidth: 1.4,
    strokeDasharray: "4 3",
    dot: false,
    isAnimationActive: false
  })), React.createElement(Line, {
    type: "monotone",
    dataKey: "nw",
    stroke: "var(--amber)",
    strokeWidth: 2.6,
    dot: false,
    isAnimationActive: false
  })))), ZHINT, React.createElement("div", {
    className: "legend",
    style: {
      marginTop: 10
    }
  }, React.createElement("span", {
    className: "lg"
  }, React.createElement("span", {
    className: "swatch",
    style: {
      borderTopColor: "var(--amber)",
      borderTopWidth: 3
    }
  }), "Net worth"), accounts.map(a => React.createElement("span", {
    className: "lg",
    key: a.id
  }, React.createElement("span", {
    className: "swatch",
    style: {
      borderTopColor: D.acctColors[a.id]
    }
  }), a.name)), debts.map(l => React.createElement("span", {
    className: "lg",
    key: l.id
  }, React.createElement("span", {
    className: "swatch",
    style: {
      borderTopColor: D.debtColors[l.id],
      borderTopStyle: "dashed"
    }
  }), l.name)))), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Asset mix today")), React.createElement(Donut, {
    data: D.alloc,
    center: fmtBig(D.totalAssets),
    sub: "assets"
  }))), tab === "accounts" && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "sgrid rise",
    style: {
      marginBottom: 16
    }
  }, React.createElement(Stat, {
    k: "Total<br/>assets",
    v: fmtBig(D.totalAssets),
    accent: "green"
  }), React.createElement(Stat, {
    k: "Total<br/>debt",
    v: fmtBig(D.totalDebt),
    accent: "red"
  }), React.createElement(Stat, {
    k: "Net<br/>worth",
    v: fmtBig(D.netWorth),
    accent: D.netWorth >= 0 ? "" : "red"
  }), React.createElement(Stat, {
    k: "Invested<br/>share",
    v: D.totalAssets > 0 ? Math.round(D.bInv / D.totalAssets * 100) + "%" : "0%",
    accent: "cyan"
  })), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Accounts"), React.createElement("div", {
    className: "psub"
  }, "balance + expected annual return")), accounts.map(a => {
    const capOn = a.cap != null && a.cap !== "";
    const need = D.worstMonthOut(a.id);
    const tight = capOn && n0(a.cap) < need;
    const dest = a.spillTo ? D.names[a.spillTo] || "—" : null;
    return React.createElement("div", {
      className: "row acct",
      key: a.id
    }, React.createElement("div", {
      className: "acct-top"
    }, React.createElement("input", {
      className: "rname",
      value: a.name,
      onChange: e => upAcct(a.id, "name", e.target.value),
      "aria-label": "Account name"
    }), React.createElement("button", {
      className: "icon-btn",
      onClick: () => rmAcct(a.id),
      "aria-label": "Remove"
    }, React.createElement(Trash2, {
      size: 16
    }))), React.createElement("div", {
      className: "acct-fields"
    }, React.createElement("select", {
      value: a.type,
      onChange: e => upAcctType(a.id, e.target.value),
      "aria-label": "Type"
    }, ACCT_TYPES.map(t => React.createElement("option", {
      key: t.v,
      value: t.v
    }, t.label))), React.createElement(NumField, {
      cls: "ramt",
      label: "Balance",
      prefix: "$",
      value: a.balance,
      onChange: v => upAcct(a.id, "balance", v)
    }), React.createElement(NumField, {
      cls: "rrate",
      label: "Return",
      suffix: "%",
      value: a.rate,
      onChange: v => upAcct(a.id, "rate", v)
    })), React.createElement("div", {
      className: "capline"
    }, React.createElement(NumField, {
      cls: "ramt",
      label: "Cap at",
      prefix: "$",
      value: a.cap == null ? "" : a.cap,
      onChange: v => upAcct(a.id, "cap", v)
    }), capOn && React.createElement(React.Fragment, null, React.createElement("div", {
      className: "field",
      style: {
        flex: 1,
        minWidth: 130
      }
    }, React.createElement("label", null, "Sweep the excess to"), React.createElement("select", {
      value: a.spillTo || "",
      onChange: e => upAcct(a.id, "spillTo", e.target.value),
      "aria-label": "Sweep destination"
    }, React.createElement("option", {
      value: ""
    }, "— nowhere (just piles up) —"), D.loans.length > 0 && React.createElement("optgroup", {
      label: "Loans"
    }, D.loans.map(l => React.createElement("option", {
      key: l.id,
      value: l.id
    }, l.name))), D.cards.length > 0 && React.createElement("optgroup", {
      label: "Credit cards"
    }, D.cards.map(c => React.createElement("option", {
      key: c.id,
      value: c.id
    }, c.name))), React.createElement("optgroup", {
      label: "Accounts"
    }, accounts.filter(x => x.id !== a.id).map(x => React.createElement("option", {
      key: x.id,
      value: x.id
    }, x.name))))), React.createElement(Seg, {
      value: a.spillEvery === "weekly" ? "weekly" : "monthly",
      options: [{
        v: "monthly",
        label: "Monthly"
      }, {
        v: "weekly",
        label: "Weekly"
      }],
      onChange: v => upAcct(a.id, "spillEvery", v)
    })), capOn && a.spillTo ? React.createElement("div", {
      className: "caphint" + (tight ? " warn-txt" : "")
    }, "Anything over ", fmtMoney(n0(a.cap)), " moves to ", dest, " at each ", a.spillEvery === "weekly" ? "week" : "month", " end.", D.loans.some(l => l.id === a.spillTo) ? ` Once ${dest} is paid off it rolls to your highest-rate remaining loan, then to ${(accounts.find(x => x.id === settings.overflowTo) || defaultOverflow || {}).name || "investments"} when every loan is clear.` : "", tight ? ` A heavy month draws about ${fmtMoney(need)} from here — a cap below that will overdraw it.` : ` Its heaviest month draws about ${fmtMoney(need)}, so the buffer holds.`) : capOn ? React.createElement("div", {
      className: "caphint"
    }, "Pick a destination or the cap does nothing.") : React.createElement("div", {
      className: "caphint"
    }, "Leave blank for no cap. Set one to stop cash idling here — the excess gets swept somewhere it earns or saves you more.")));
  }), React.createElement("button", {
    className: "btn btn-add",
    onClick: addAcct
  }, React.createElement(Plus, {
    size: 15
  }), "Add an account"), React.createElement("div", {
    className: "assume"
  }, "Debts are accounts too — they live in the Debt tab. All money movement between them is set up in Cash flow.", D.capped.length > 0 && D.avgSweep > 0 && React.createElement(React.Fragment, null, " Your caps are moving about ", React.createElement("b", {
    style: {
      color: "var(--amber)"
    }
  }, fmtMoney(D.avgSweep), "/mo"), " out of idle cash on average over the next three years."))), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Asset mix")), React.createElement(Donut, {
    data: D.alloc,
    center: fmtBig(D.totalAssets),
    sub: "assets"
  }))), tab === "cashflow" && (() => {
    const dp = Math.max(0, D.mDp),
      iv = Math.max(0, D.mTr),
      lo = Math.max(0, D.leftover);
    const segs = [{
      name: "Living costs",
      value: D.mExp,
      color: "#E8695B"
    }, {
      name: "Debt payments",
      value: dp,
      color: "#B98CE8"
    }, {
      name: "Investing",
      value: iv,
      color: "#5CCB8B"
    }, {
      name: "Left in cash",
      value: lo,
      color: "#F5A623"
    }].filter(s => s.value > 0);
    const denom = Math.max(D.mInc, D.mExp + dp + iv + lo) || 1;
    return React.createElement(React.Fragment, null, React.createElement("div", {
      className: "sgrid rise",
      style: {
        marginBottom: 16
      }
    }, React.createElement(Stat, {
      k: "Take-home<br/>per month",
      v: fmtMoney(D.mInc),
      accent: "green"
    }), React.createElement(Stat, {
      k: "Living<br/>expenses",
      v: fmtMoney(D.mExp),
      accent: "red"
    }), React.createElement(Stat, {
      k: D.mPreTax > 0 ? "401k in<br/>(incl. match)" : "Surplus after<br/>living costs",
      v: D.mPreTax > 0 ? fmtMoney(D.mPreTax) : fmtMoney(D.surplus),
      accent: D.mPreTax > 0 ? "cyan" : D.surplus >= 0 ? "amber" : "red"
    }), React.createElement(Stat, {
      k: "Savings<br/>rate",
      v: Math.round(D.savingsRate) + "%",
      accent: "cyan"
    })), React.createElement("div", {
      className: "panel rise"
    }, React.createElement("div", {
      className: "phead"
    }, React.createElement("div", {
      className: "ptitle"
    }, "Cash flow, week by week"), ranges(scCF, Math.min(maxW, 312))), React.createElement("div", {
      className: "scope-wrap",
      ref: scCF.ref,
      ...scCF.handlers
    }, React.createElement(ResponsiveContainer, {
      width: "100%",
      height: 272
    }, React.createElement(ComposedChart, {
      data: sampleRange(D.cf, scCF.lo, scCF.hi, 320),
      margin: {
        top: 14,
        right: 12,
        bottom: 0,
        left: 6
      }
    }, React.createElement(CartesianGrid, {
      stroke: "var(--line)",
      strokeDasharray: "2 4"
    }), React.createElement(XAxis, axisProps(scCF)), React.createElement(YAxis, yProps), React.createElement(Tooltip, {
      content: p => React.createElement(Tip, {
        ...p,
        start: start,
        rows: [{
          key: "income",
          name: "In",
          color: "var(--green)"
        }, {
          key: "spend",
          name: "Out",
          color: "var(--red)"
        }, {
          key: "net",
          name: "Net",
          color: "var(--violet)"
        }, {
          key: "smooth",
          name: "Monthly avg",
          color: "var(--amber)"
        }]
      }),
      cursor: {
        fill: "rgba(126,148,171,0.06)"
      }
    }), React.createElement(ReferenceLine, {
      y: 0,
      stroke: "var(--line2)"
    }), React.createElement(Bar, {
      dataKey: "net",
      radius: [2, 2, 0, 0],
      isAnimationActive: false
    }, sampleRange(D.cf, scCF.lo, scCF.hi, 320).map((e, i) => React.createElement(Cell, {
      key: i,
      fill: e.net >= 0 ? "rgba(185,140,232,0.42)" : "rgba(232,105,91,0.5)"
    }))), React.createElement(Line, {
      type: "monotone",
      dataKey: "income",
      stroke: "var(--green)",
      strokeWidth: 1.4,
      dot: false,
      isAnimationActive: false
    }), React.createElement(Line, {
      type: "monotone",
      dataKey: "spend",
      stroke: "var(--red)",
      strokeWidth: 1.3,
      dot: false,
      isAnimationActive: false
    }), React.createElement(Line, {
      type: "monotone",
      dataKey: "smooth",
      stroke: "var(--amber)",
      strokeWidth: 2.4,
      dot: false,
      isAnimationActive: false
    })))), ZHINT, React.createElement("div", {
      className: "legend",
      style: {
        marginTop: 8
      }
    }, React.createElement("span", {
      className: "lg"
    }, React.createElement("span", {
      className: "swatch",
      style: {
        borderTopColor: "var(--green)"
      }
    }), "In"), React.createElement("span", {
      className: "lg"
    }, React.createElement("span", {
      className: "swatch",
      style: {
        borderTopColor: "var(--red)"
      }
    }), "Out"), React.createElement("span", {
      className: "lg"
    }, React.createElement("span", {
      className: "dot",
      style: {
        background: "rgba(185,140,232,.7)"
      }
    }), "Weekly net"), React.createElement("span", {
      className: "lg"
    }, React.createElement("span", {
      className: "swatch",
      style: {
        borderTopColor: "var(--amber)",
        borderTopWidth: 3
      }
    }), "Monthly average")), React.createElement("div", {
      className: "assume"
    }, "The amber line smooths the weekly spikes into a rolling monthly average — the trend underneath the paycheck-and-rent sawtooth.")), React.createElement("div", {
      className: "panel rise"
    }, React.createElement("div", {
      className: "phead"
    }, React.createElement("div", {
      className: "ptitle"
    }, "Where every dollar goes"), React.createElement("div", {
      className: "psub"
    }, "typical month")), React.createElement("div", {
      className: "flowbar"
    }, segs.map((s, i) => React.createElement("div", {
      key: i,
      className: "flowseg",
      style: {
        width: s.value / denom * 100 + "%",
        background: s.color
      },
      title: s.name
    }))), React.createElement("div", {
      className: "flowkey"
    }, segs.map((s, i) => React.createElement("span", {
      className: "fk",
      key: i
    }, React.createElement("span", {
      className: "dot",
      style: {
        background: s.color
      }
    }), s.name, " ", React.createElement("b", null, fmtMoney(s.value)), " (", Math.round(s.value / denom * 100), "%)"))), D.leftover < 0 && React.createElement("div", {
      className: "assume",
      style: {
        color: "var(--red)"
      }
    }, "Debt payments + investing exceed your surplus by ", fmtMoney(-D.leftover), "/mo — cash will draw down over time.")), React.createElement("div", {
      className: "panel rise"
    }, React.createElement("div", {
      className: "phead"
    }, React.createElement("div", {
      className: "ptitle"
    }, "Spending by category"), React.createElement("div", {
      className: "psub"
    }, fmtMoney(D.mExp), "/mo")), D.spend.length === 0 ? React.createElement("div", {
      className: "empty"
    }, "No expenses yet.") : D.spend.map(e => React.createElement("div", {
      className: "catrow",
      key: e.id
    }, React.createElement("div", {
      className: "cattop"
    }, React.createElement("span", {
      className: "cn"
    }, e.category, React.createElement("span", {
      className: "cp"
    }, recurLabel(e.recur).toLowerCase())), React.createElement("span", {
      className: "cv"
    }, fmtMoney(e.monthly), "/mo")), React.createElement("div", {
      className: "catbar"
    }, React.createElement("div", {
      className: "catfill",
      style: {
        width: (D.mExp > 0 ? e.monthly / D.mExp * 100 : 0) + "%",
        background: e.color
      }
    }))))), React.createElement("div", {
      className: "panel rise"
    }, React.createElement("div", {
      className: "phead"
    }, React.createElement("div", {
      className: "ptitle"
    }, "Income"), React.createElement("div", {
      className: "psub"
    }, "dated · split across accounts")), income.map(inc => {
      const amt = n0(inc.amount);
      const dist = inc.dist || [];
      let used = 0;
      for (let i = 1; i < dist.length; i++) {
        const sp = dist[i];
        const want = sp.mode === "amt" ? n0(sp.value) : amt * num(sp.value) / 100;
        used += Math.min(want, Math.max(0, amt - used));
      }
      const rest = Math.max(0, amt - used);
      return React.createElement("div", {
        className: "card",
        key: inc.id
      }, React.createElement("div", {
        className: "card-r1"
      }, React.createElement("input", {
        className: "rname",
        value: inc.name,
        onChange: e => upInc(inc.id, "name", e.target.value),
        "aria-label": "Income name"
      }), React.createElement("div", {
        className: "num-box sm"
      }, React.createElement("span", {
        className: "pfx"
      }, "$"), React.createElement("input", {
        className: "num-input",
        type: "number",
        inputMode: "decimal",
        value: inc.amount,
        onChange: e => upInc(inc.id, "amount", e.target.value),
        "aria-label": "Amount",
        style: {
          color: "var(--green)"
        }
      })), React.createElement("button", {
        className: "icon-btn",
        onClick: () => rmInc(inc.id),
        "aria-label": "Remove"
      }, React.createElement(Trash2, {
        size: 16
      }))), React.createElement("div", {
        className: "card-r2"
      }, React.createElement("input", {
        type: "date",
        value: inc.date,
        onChange: e => upInc(inc.id, "date", e.target.value),
        "aria-label": "Date"
      }), React.createElement("select", {
        value: inc.recur,
        onChange: e => upInc(inc.id, "recur", e.target.value),
        "aria-label": "Recurrence"
      }, RECUR.map(r => React.createElement("option", {
        key: r.v,
        value: r.v
      }, r.label))), React.createElement("div", {
        className: "num-box sm"
      }, React.createElement("span", {
        className: "pfx",
        style: {
          fontSize: 11
        }
      }, "raise"), React.createElement("input", {
        className: "num-input",
        type: "number",
        inputMode: "decimal",
        value: inc.raise,
        onChange: e => upInc(inc.id, "raise", e.target.value),
        "aria-label": "Annual raise",
        style: {
          width: 42,
          color: "var(--text)"
        }
      }), React.createElement("span", {
        className: "pfx",
        style: {
          fontSize: 11
        }
      }, "%/yr")), inc.recur !== "once" && React.createElement(EndDate, {
        value: inc.end,
        onChange: v => upInc(inc.id, "end", v)
      })), React.createElement("label", {
        className: "chk",
        style: {
          marginTop: 10
        }
      }, React.createElement("input", {
        type: "checkbox",
        checked: !!inc.weekdayAdj,
        onChange: e => upInc(inc.id, "weekdayAdj", e.target.checked)
      }), "If payday lands on a weekend, pay the weekday before"), React.createElement("div", {
        className: "dist"
      }, React.createElement("div", {
        className: "dist-lbl"
      }, React.createElement("span", null, "Distribute into"), React.createElement("span", null, dist.length > 1 ? fmtMoney(used) + " assigned" : "all of it")), dist.map((sp, idx) => React.createElement("div", {
        className: "dist-row",
        key: idx
      }, React.createElement("select", {
        value: sp.acctId,
        onChange: e => upSplit(inc.id, idx, "acctId", e.target.value),
        "aria-label": "Account"
      }, accounts.map(a => React.createElement("option", {
        key: a.id,
        value: a.id
      }, a.name))), idx === 0 ? React.createElement(React.Fragment, null, React.createElement("span", {
        className: "cap"
      }, "remainder"), React.createElement("span", {
        className: "remain"
      }, fmtMoney(rest)), React.createElement("span", {
        style: {
          width: 24
        }
      })) : React.createElement(React.Fragment, null, React.createElement(Seg, {
        value: sp.mode || "pct",
        options: [{
          v: "pct",
          label: "%"
        }, {
          v: "amt",
          label: "$"
        }],
        onChange: v => upSplit(inc.id, idx, "mode", v)
      }), React.createElement("div", {
        className: "pctbox"
      }, React.createElement("input", {
        type: "number",
        inputMode: "decimal",
        value: sp.value,
        onChange: e => upSplit(inc.id, idx, "value", e.target.value),
        "aria-label": "Value"
      }), React.createElement("span", {
        className: "u"
      }, sp.mode === "amt" ? "$" : "%")), React.createElement("button", {
        className: "icon-btn",
        onClick: () => rmSplit(inc.id, idx),
        "aria-label": "Remove split"
      }, React.createElement(Trash2, {
        size: 14
      }))))), React.createElement("button", {
        className: "dist-add",
        onClick: () => addSplit(inc.id)
      }, "+ Send a cut to another account")), React.createElement("div", {
        className: "dist"
      }, (() => {
        const pay = payrollOf(inc);
        const perYear = OPY[inc.recur] || 0;
        const withheld = pay.gross > 0 ? pay.gross - n0(inc.amount) - pay.employee : 0;
        const effRate = pay.gross > 0 ? withheld / pay.gross * 100 : 0;
        return React.createElement(React.Fragment, null, React.createElement("div", {
          className: "dist-lbl"
        }, React.createElement("span", null, "Payroll deductions (not in take-home)"), React.createElement("span", null, fmtMoney(pay.total), " / paycheck")), React.createElement("div", {
          className: "dist-row"
        }, React.createElement("span", {
          className: "cap",
          style: {
            flex: 1,
            minWidth: 80
          }
        }, "Gross salary"), React.createElement(Seg, {
          value: inc.grossMode === "paycheck" ? "paycheck" : "year",
          options: [{
            v: "year",
            label: "per year"
          }, {
            v: "paycheck",
            label: "per check"
          }],
          onChange: v => upInc(inc.id, "grossMode", v)
        }), React.createElement("div", {
          className: "pctbox",
          style: {
            width: 112
          }
        }, React.createElement("span", {
          className: "u",
          style: {
            marginLeft: 0,
            marginRight: 3
          }
        }, "$"), React.createElement("input", {
          type: "number",
          inputMode: "decimal",
          value: inc.gross == null ? "" : inc.gross,
          onChange: e => upInc(inc.id, "gross", e.target.value),
          "aria-label": "Gross salary"
        }))), pay.gross > 0 && React.createElement("div", {
          className: "caphint",
          style: {
            marginTop: -2,
            marginBottom: 8
          }
        }, fmtMoney(pay.gross * perYear), "/yr gross = ", fmtMoney(pay.gross), " per paycheck across ", Math.round(perYear), " paychecks · take-home ", fmtMoney(n0(inc.amount) * perYear), "/yr", withheld > 0 ? ` · implies ${fmtMoney(withheld)}/paycheck withheld for tax and benefits (${effRate.toFixed(0)}%)` : "", withheld < 0 ? " · take-home plus deductions exceeds gross — one of these numbers is off" : ""), pay.rows.map(pt => React.createElement("div", {
          className: "dist-row",
          key: pt.id
        }, React.createElement("input", {
          type: "text",
          value: pt.name,
          onChange: e => upPreTax(inc.id, pt.id, "name", e.target.value),
          "aria-label": "Deduction name",
          style: {
            flex: 1,
            minWidth: 90
          }
        }), React.createElement(Seg, {
          value: pt.mode,
          options: [{
            v: "pct",
            label: "%"
          }, {
            v: "amt",
            label: "$"
          }],
          onChange: v => upPreTax(inc.id, pt.id, "mode", v)
        }), React.createElement("div", {
          className: "pctbox"
        }, React.createElement("input", {
          type: "number",
          inputMode: "decimal",
          value: pt.value,
          onChange: e => upPreTax(inc.id, pt.id, "value", e.target.value),
          "aria-label": "Value"
        }), React.createElement("span", {
          className: "u"
        }, pt.mode === "pct" ? "%" : "$")), React.createElement("select", {
          value: pt.toAcct,
          onChange: e => upPreTax(inc.id, pt.id, "toAcct", e.target.value),
          "aria-label": "Into account",
          style: {
            flex: 1,
            minWidth: 90
          }
        }, accounts.map(a => React.createElement("option", {
          key: a.id,
          value: a.id
        }, a.name))), React.createElement("button", {
          className: "icon-btn",
          onClick: () => rmPreTax(inc.id, pt.id),
          "aria-label": "Remove"
        }, React.createElement(Trash2, {
          size: 14
        })), pt.mode === "pct" && pay.gross > 0 && React.createElement("div", {
          className: "caphint"
        }, num(pt.value), "% of ", fmtMoney(pay.gross), " = ", React.createElement("b", {
          style: {
            color: "var(--green)"
          }
        }, fmtMoney(pt.amount)), " per paycheck, ", fmtMoney(pt.amount * perYear), "/yr"))), React.createElement("button", {
          className: "dist-add",
          onClick: () => addPreTax(inc.id)
        }, "+ Add a contribution"), React.createElement("div", {
          className: "dist-lbl",
          style: {
            marginTop: 12
          }
        }, React.createElement("span", null, "Employer match"), React.createElement("label", {
          className: "chk"
        }, React.createElement("input", {
          type: "checkbox",
          checked: !!inc.match,
          onChange: e => setMatch(inc.id, e.target.checked)
        }), "offered")), inc.match && React.createElement(React.Fragment, null, React.createElement("div", {
          className: "dist-row"
        }, React.createElement("div", {
          className: "pctbox"
        }, React.createElement("input", {
          type: "number",
          inputMode: "decimal",
          value: inc.match.rate,
          onChange: e => upMatch(inc.id, "rate", e.target.value),
          "aria-label": "Match rate"
        }), React.createElement("span", {
          className: "u"
        }, "%")), React.createElement("span", {
          className: "cap"
        }, "of what you put in, up to"), React.createElement("div", {
          className: "pctbox"
        }, React.createElement("input", {
          type: "number",
          inputMode: "decimal",
          value: inc.match.limit,
          onChange: e => upMatch(inc.id, "limit", e.target.value),
          "aria-label": "Match limit"
        }), React.createElement("span", {
          className: "u"
        }, "%")), React.createElement("span", {
          className: "cap"
        }, "of gross")), React.createElement("div", {
          className: "dist-row"
        }, React.createElement("span", {
          className: "cap",
          style: {
            flex: 1
          }
        }, "Match lands in"), React.createElement("select", {
          value: inc.match.toAcct,
          onChange: e => upMatch(inc.id, "toAcct", e.target.value),
          "aria-label": "Match account",
          style: {
            flex: 1,
            minWidth: 110
          }
        }, accounts.map(a => React.createElement("option", {
          key: a.id,
          value: a.id
        }, a.name)))), React.createElement("div", {
          className: "caphint" + (pay.gross > 0 && pay.matchable < pay.gross * num(inc.match.limit) / 100 - 0.01 ? " warn-txt" : "")
        }, (() => {
          if (!(pay.gross > 0)) return "Enter gross pay above for the match to compute.";
          const ceiling = pay.gross * num(inc.match.limit) / 100;
          const unclaimed = Math.max(0, ceiling - pay.matchable) * n0(inc.match.rate) / 100;
          return React.createElement(React.Fragment, null, "Adds ", React.createElement("b", {
            style: {
              color: "var(--green)"
            }
          }, fmtMoney(pay.match)), " per paycheck (", fmtMoney(pay.match * perYear), "/yr).", unclaimed > 0.01 ? ` You're contributing below the ${num(inc.match.limit)}% threshold — that leaves ${fmtMoney(unclaimed * perYear)}/yr of match unclaimed.` : ` You're contributing enough to capture the full match.`);
        })())), React.createElement("div", {
          className: "caphint",
          style: {
            marginTop: 8
          }
        }, "Money withheld from gross never shows up in take-home, so it belongs here rather than as a transfer. Percentages track your salary as the raise above compounds."), React.createElement("div", {
          className: "dist-lbl",
          style: {
            marginTop: 14
          }
        }, React.createElement("span", null, "Annual bonus"), React.createElement("label", {
          className: "chk"
        }, React.createElement("input", {
          type: "checkbox",
          checked: !!inc.bonus,
          onChange: e => setBonus(inc.id, e.target.checked)
        }), "paid")), inc.bonus && (() => {
          const b = bonusOf(inc, 1);
          return React.createElement(React.Fragment, null, React.createElement("div", {
            className: "dist-row"
          }, React.createElement(Seg, {
            value: inc.bonus.mode === "amt" ? "amt" : "pct",
            options: [{
              v: "pct",
              label: "% of salary"
            }, {
              v: "amt",
              label: "$"
            }],
            onChange: v => upBonus(inc.id, "mode", v)
          }), React.createElement("div", {
            className: "pctbox"
          }, React.createElement("input", {
            type: "number",
            inputMode: "decimal",
            value: inc.bonus.value,
            onChange: e => upBonus(inc.id, "value", e.target.value),
            "aria-label": "Bonus value"
          }), React.createElement("span", {
            className: "u"
          }, inc.bonus.mode === "amt" ? "$" : "%")), React.createElement("span", {
            className: "cap"
          }, "paid each"), React.createElement("input", {
            type: "date",
            value: inc.bonus.date,
            onChange: e => upBonus(inc.id, "date", e.target.value),
            "aria-label": "Bonus date"
          })), React.createElement("div", {
            className: "dist-row"
          }, React.createElement("span", {
            className: "cap",
            style: {
              flex: 1,
              minWidth: 80
            }
          }, "Withheld for tax"), React.createElement("div", {
            className: "pctbox"
          }, React.createElement("input", {
            type: "number",
            inputMode: "decimal",
            value: inc.bonus.withhold,
            onChange: e => upBonus(inc.id, "withhold", e.target.value),
            "aria-label": "Bonus withholding"
          }), React.createElement("span", {
            className: "u"
          }, "%")), React.createElement("label", {
            className: "chk"
          }, React.createElement("input", {
            type: "checkbox",
            checked: inc.bonus.preTaxApplies !== false,
            onChange: e => upBonus(inc.id, "preTaxApplies", e.target.checked)
          }), "401k applies")), b && b.gross > 0 && React.createElement("div", {
            className: "caphint"
          }, inc.bonus.mode === "pct" ? `${num(inc.bonus.value)}% of ${fmtMoney(pay.gross * perYear)} = ` : "", React.createElement("b", {
            style: {
              color: "var(--green)"
            }
          }, fmtMoney(b.gross)), " gross each year", b.deferral > 0 ? ` · ${fmtMoney(b.deferral)} to 401k${b.match > 0 ? ` + ${fmtMoney(b.match)} matched` : ""}` : "", b.withheld > 0 ? ` · ${fmtMoney(b.withheld)} withheld` : "", ` · `, React.createElement("b", {
            style: {
              color: "var(--amber)"
            }
          }, fmtMoney(b.net)), " lands in your account"), React.createElement("div", {
            className: "caphint"
          }, "Grows with your raise, since it's a share of salary. Bonuses are usually withheld at a flat supplemental rate plus payroll tax rather than your normal rate — check a past stub and adjust. It arrives through the same account split as your paycheck, so a cap on that account will sweep the excess onward."));
        })(), React.createElement("div", {
          className: "dist-lbl",
          style: {
            marginTop: 14
          }
        }, React.createElement("span", null, "Promotions & salary changes"), React.createElement("span", null, (inc.changes || []).length ? (inc.changes || []).length + " planned" : "none")), (inc.changes || []).slice().sort((a, b) => parseDate(a.date) - parseDate(b.date)).map(ch => {
          const gpc = perCheck(ch.gross, ch.grossMode || inc.grossMode, inc.recur);
          const takeHome = n0(ch.amount) * perYear;
          const annual = gpc * perYear;
          const defer = (inc.preTax || []).reduce((s, pt) => s + (pt.mode === "pct" ? gpc * num(pt.value) / 100 : n0(pt.value)), 0) * perYear;
          const held = annual - takeHome - defer;
          const rate = annual > 0 ? held / annual * 100 : 0;
          const curRate = pay.gross > 0 ? withheld * perYear / (pay.gross * perYear) * 100 : 0;
          const odd = annual > 0 && (rate < curRate - 6 || rate > curRate + 12);
          return React.createElement("div", {
            className: "card",
            key: ch.id,
            style: {
              background: "var(--bg)",
              marginBottom: 8
            }
          }, React.createElement("div", {
            className: "card-r2"
          }, React.createElement("input", {
            type: "text",
            value: ch.label,
            onChange: e => upChange(inc.id, ch.id, "label", e.target.value),
            "aria-label": "Label",
            style: {
              flex: 1,
              minWidth: 90
            }
          }), React.createElement("span", {
            className: "cap"
          }, "from"), React.createElement("input", {
            type: "date",
            value: ch.date,
            onChange: e => upChange(inc.id, ch.id, "date", e.target.value),
            "aria-label": "Effective date"
          }), React.createElement("button", {
            className: "icon-btn",
            onClick: () => rmChange(inc.id, ch.id),
            "aria-label": "Remove"
          }, React.createElement(Trash2, {
            size: 14
          }))), React.createElement("div", {
            className: "card-r2",
            style: {
              marginTop: 8
            }
          }, React.createElement("span", {
            className: "cap"
          }, "salary"), React.createElement("div", {
            className: "pctbox",
            style: {
              width: 108
            }
          }, React.createElement("span", {
            className: "u",
            style: {
              marginLeft: 0,
              marginRight: 3
            }
          }, "$"), React.createElement("input", {
            type: "number",
            inputMode: "decimal",
            value: ch.gross,
            onChange: e => upChange(inc.id, ch.id, "gross", e.target.value),
            "aria-label": "New salary"
          })), React.createElement("span", {
            className: "cap"
          }, "take-home / check"), React.createElement("div", {
            className: "pctbox",
            style: {
              width: 96
            }
          }, React.createElement("span", {
            className: "u",
            style: {
              marginLeft: 0,
              marginRight: 3
            }
          }, "$"), React.createElement("input", {
            type: "number",
            inputMode: "decimal",
            value: ch.amount,
            onChange: e => upChange(inc.id, ch.id, "amount", e.target.value),
            "aria-label": "New take-home"
          }))), annual > 0 && React.createElement("div", {
            className: "caphint" + (odd ? " warn-txt" : "")
          }, fmtMoney(annual), "/yr gross → ", fmtMoney(gpc), "/check · take-home ", fmtMoney(n0(ch.amount)), "/check (", fmtMoney(takeHome), "/yr) · implies ", rate.toFixed(1), "% withheld", odd ? ` — your current rate is ${curRate.toFixed(1)}%, so double-check the take-home figure.` : ` vs ${curRate.toFixed(1)}% today, which tracks.`));
        }), React.createElement("button", {
          className: "dist-add",
          onClick: () => addChange(inc.id)
        }, "+ Add a promotion or salary change"), React.createElement("div", {
          className: "caphint"
        }, "Salary steps to the new figure on that date and the raise percentage compounds from there. Your baseline stays intact, so you can compare with the change removed."));
      })()));
    }), React.createElement("button", {
      className: "btn btn-add",
      onClick: addInc
    }, React.createElement(Plus, {
      size: 15
    }), "Add income source"), React.createElement("div", {
      className: "assume"
    }, "The top account is the remainder — it receives whatever the others don't take.")), React.createElement("div", {
      className: "panel rise"
    }, React.createElement("div", {
      className: "phead"
    }, React.createElement("div", {
      className: "ptitle"
    }, "Expenses"), React.createElement("div", {
      className: "psub"
    }, "dated · drawn from an account")), expenses.map(ex => React.createElement("div", {
      className: "card",
      key: ex.id
    }, React.createElement("div", {
      className: "card-r1"
    }, React.createElement("input", {
      className: "rname",
      value: ex.category,
      onChange: e => upExp(ex.id, "category", e.target.value),
      "aria-label": "Category"
    }), React.createElement("div", {
      className: "num-box sm"
    }, React.createElement("span", {
      className: "pfx"
    }, "$"), React.createElement("input", {
      className: "num-input",
      type: "number",
      inputMode: "decimal",
      value: ex.amount,
      onChange: e => upExp(ex.id, "amount", e.target.value),
      "aria-label": "Amount",
      style: {
        color: "var(--red)"
      }
    })), React.createElement("button", {
      className: "icon-btn",
      onClick: () => rmExp(ex.id),
      "aria-label": "Remove"
    }, React.createElement(Trash2, {
      size: 16
    }))), React.createElement("div", {
      className: "card-r2"
    }, React.createElement("input", {
      type: "date",
      value: ex.date,
      onChange: e => upExp(ex.id, "date", e.target.value),
      "aria-label": "Date"
    }), React.createElement("select", {
      value: ex.recur,
      onChange: e => upExp(ex.id, "recur", e.target.value),
      "aria-label": "Recurrence"
    }, RECUR.map(r => React.createElement("option", {
      key: r.v,
      value: r.v
    }, r.label))), React.createElement("span", {
      className: "cap"
    }, "paid with"), React.createElement("select", {
      value: ex.fromAcct,
      onChange: e => upExp(ex.id, "fromAcct", e.target.value),
      "aria-label": "Paid with"
    }, React.createElement("optgroup", {
      label: "Accounts"
    }, accounts.map(a => React.createElement("option", {
      key: a.id,
      value: a.id
    }, a.name))), D.cards.length > 0 && React.createElement("optgroup", {
      label: "Credit cards"
    }, D.cards.map(c => React.createElement("option", {
      key: c.id,
      value: c.id
    }, c.name)))), ex.recur !== "once" && React.createElement(EndDate, {
      value: ex.end,
      onChange: v => upExp(ex.id, "end", v)
    })))), React.createElement("button", {
      className: "btn btn-add",
      onClick: addExp
    }, React.createElement(Plus, {
      size: 15
    }), "Add expense")), React.createElement("div", {
      className: "panel rise"
    }, React.createElement("div", {
      className: "phead"
    }, React.createElement("div", {
      className: "ptitle"
    }, "Credit cards"), React.createElement("div", {
      className: "psub"
    }, "charges land here, payments clear them")), D.cards.length === 0 && React.createElement("div", {
      className: "empty"
    }, "No cards yet.", React.createElement("br", null), "Add one, then set individual purchases to \"paid with\" that card."), D.cards.map(c => {
      const np = D.nextCardPay[c.id];
      const monthlyCharges = D.chargedTo(c.id);
      return React.createElement("div", {
        className: "cardrow",
        key: c.id
      }, React.createElement("span", {
        className: "badge"
      }, "Card"), React.createElement("input", {
        className: "rname",
        value: c.name,
        onChange: e => upDebtField(c.id, "name", e.target.value),
        "aria-label": "Card name"
      }), React.createElement(NumField, {
        cls: "ramt",
        label: "Balance owed",
        prefix: "$",
        value: c.balance,
        onChange: v => upDebtBal(c.id, v)
      }), React.createElement(NumField, {
        cls: "rrate",
        label: "APR",
        suffix: "%",
        value: c.apr,
        onChange: v => upDebtField(c.id, "apr", v)
      }), React.createElement("button", {
        className: "icon-btn",
        onClick: () => rmDebt(c.id),
        "aria-label": "Remove"
      }, React.createElement(Trash2, {
        size: 16
      })), React.createElement("div", {
        className: "cardbal"
      }, React.createElement("span", null, fmtMoney(monthlyCharges), "/mo charged to it"), np ? React.createElement("span", null, "next payment ", np.date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      }), " · ", React.createElement("b", null, fmtMoney(np.amount)), np.full ? " (in full)" : "") : React.createElement("span", {
        style: {
          color: "var(--red)"
        }
      }, "no payment set — this balance will just grow")));
    }), React.createElement("button", {
      className: "btn btn-add",
      onClick: addCardWithPayment
    }, React.createElement(Plus, {
      size: 15
    }), "Add a credit card"), React.createElement("div", {
      className: "assume"
    }, "Interest only applies to a balance you carry past a payment — pay in full and the card costs nothing. Charges show up in \"Spending by category\" above, so itemising a card gets your whole picture in one place.")), React.createElement("div", {
      className: "panel rise"
    }, React.createElement("div", {
      className: "phead"
    }, React.createElement("div", {
      className: "ptitle"
    }, "Payments into debt & cards"), React.createElement("div", {
      className: "psub"
    }, fmtMoney(D.mDp), "/mo")), debtPayments.length === 0 && React.createElement("div", {
      className: "empty"
    }, "No payments yet.", React.createElement("br", null), "Add your regular monthly payments below."), debtPayments.map(p => {
      const tgt = debts.find(x => x.id === p.toDebt);
      const cardTarget = isCard(tgt);
      return React.createElement("div", {
        className: "card",
        key: p.id
      }, React.createElement("div", {
        className: "card-r1"
      }, React.createElement("input", {
        className: "rname",
        value: p.name,
        onChange: e => upDp(p.id, "name", e.target.value),
        "aria-label": "Payment name"
      }), cardTarget && p.payFull ? React.createElement("span", {
        className: "cap",
        style: {
          color: "var(--violet)"
        }
      }, "statement in full") : React.createElement("div", {
        className: "num-box sm"
      }, React.createElement("span", {
        className: "pfx"
      }, "$"), React.createElement("input", {
        className: "num-input",
        type: "number",
        inputMode: "decimal",
        value: p.amount,
        onChange: e => upDp(p.id, "amount", e.target.value),
        "aria-label": "Amount",
        style: {
          color: "var(--violet)"
        }
      })), React.createElement("button", {
        className: "icon-btn",
        onClick: () => rmDp(p.id),
        "aria-label": "Remove"
      }, React.createElement(Trash2, {
        size: 16
      }))), React.createElement("div", {
        className: "card-r2"
      }, React.createElement("input", {
        type: "date",
        value: p.date,
        onChange: e => upDp(p.id, "date", e.target.value),
        "aria-label": "Date"
      }), React.createElement("select", {
        value: p.recur,
        onChange: e => upDp(p.id, "recur", e.target.value),
        "aria-label": "Recurrence"
      }, RECUR.map(r => React.createElement("option", {
        key: r.v,
        value: r.v
      }, r.label))), React.createElement("select", {
        value: p.fromAcct,
        onChange: e => upDp(p.id, "fromAcct", e.target.value),
        "aria-label": "From account"
      }, accounts.map(a => React.createElement("option", {
        key: a.id,
        value: a.id
      }, a.name))), React.createElement("span", {
        className: "arrow"
      }, React.createElement(ArrowRight, {
        size: 14
      })), React.createElement("select", {
        value: p.toDebt,
        onChange: e => upDp(p.id, "toDebt", e.target.value),
        "aria-label": "To debt"
      }, D.loans.length > 0 && React.createElement("optgroup", {
        label: "Loans"
      }, D.loans.map(l => React.createElement("option", {
        key: l.id,
        value: l.id
      }, l.name))), D.cards.length > 0 && React.createElement("optgroup", {
        label: "Credit cards"
      }, D.cards.map(c => React.createElement("option", {
        key: c.id,
        value: c.id
      }, c.name)))), p.recur !== "once" && React.createElement(EndDate, {
        value: p.end,
        onChange: v => upDp(p.id, "end", v)
      })), cardTarget && React.createElement("label", {
        className: "chk",
        style: {
          marginTop: 10
        }
      }, React.createElement("input", {
        type: "checkbox",
        checked: !!p.payFull,
        onChange: e => upDp(p.id, "payFull", e.target.checked)
      }), "Pay the whole balance every time (no interest)"));
    }), React.createElement("div", {
      className: "modal-row",
      style: {
        marginTop: 4
      }
    }, React.createElement("button", {
      className: "btn btn-add",
      style: {
        flex: 1
      },
      onClick: () => addDp("monthly")
    }, React.createElement(Plus, {
      size: 15
    }), "Recurring payment"), React.createElement("button", {
      className: "btn btn-add",
      style: {
        flex: 1
      },
      onClick: () => addDp("once")
    }, React.createElement(Plus, {
      size: 15
    }), "One-time extra")), D.loansNoPayment.length > 0 && React.createElement("div", {
      className: "assume",
      style: {
        color: "var(--red)"
      }
    }, "No payment is set for: ", D.loansNoPayment.map(l => l.name).join(", "), ". Those balances just accrue interest until another loan clears and the rollover reaches them."), React.createElement("div", {
      className: "assume"
    }, "Once a loan is cleared, anything still aimed at it rolls onto your highest-rate remaining loan automatically. Card payments never roll over.")), React.createElement("div", {
      className: "panel rise"
    }, React.createElement("div", {
      className: "phead"
    }, React.createElement("div", {
      className: "ptitle"
    }, "Transfers between accounts"), React.createElement("div", {
      className: "psub"
    }, fmtMoney(D.mTr), "/mo")), transfers.length === 0 && React.createElement("div", {
      className: "empty"
    }, "No transfers yet.", React.createElement("br", null), "Add one to route cash into savings or investments."), transfers.map(tr => React.createElement("div", {
      className: "card",
      key: tr.id
    }, React.createElement("div", {
      className: "card-r1"
    }, React.createElement("input", {
      className: "rname",
      value: tr.name,
      onChange: e => upTr(tr.id, "name", e.target.value),
      "aria-label": "Transfer name"
    }), React.createElement("div", {
      className: "num-box sm"
    }, React.createElement("span", {
      className: "pfx"
    }, "$"), React.createElement("input", {
      className: "num-input",
      type: "number",
      inputMode: "decimal",
      value: tr.amount,
      onChange: e => upTr(tr.id, "amount", e.target.value),
      "aria-label": "Amount",
      style: {
        color: "var(--green)"
      }
    })), React.createElement("button", {
      className: "icon-btn",
      onClick: () => rmTr(tr.id),
      "aria-label": "Remove"
    }, React.createElement(Trash2, {
      size: 16
    }))), React.createElement("div", {
      className: "card-r2"
    }, React.createElement("input", {
      type: "date",
      value: tr.date,
      onChange: e => upTr(tr.id, "date", e.target.value),
      "aria-label": "Date"
    }), React.createElement("select", {
      value: tr.recur,
      onChange: e => upTr(tr.id, "recur", e.target.value),
      "aria-label": "Recurrence"
    }, RECUR.map(r => React.createElement("option", {
      key: r.v,
      value: r.v
    }, r.label))), React.createElement("select", {
      value: tr.fromAcct,
      onChange: e => upTr(tr.id, "fromAcct", e.target.value),
      "aria-label": "From"
    }, accounts.map(a => React.createElement("option", {
      key: a.id,
      value: a.id
    }, a.name))), React.createElement("span", {
      className: "arrow"
    }, React.createElement(ArrowRight, {
      size: 14
    })), React.createElement("select", {
      value: tr.toAcct,
      onChange: e => upTr(tr.id, "toAcct", e.target.value),
      "aria-label": "To"
    }, accounts.map(a => React.createElement("option", {
      key: a.id,
      value: a.id
    }, a.name))), tr.recur !== "once" && React.createElement(EndDate, {
      value: tr.end,
      onChange: v => upTr(tr.id, "end", v)
    })))), React.createElement("button", {
      className: "btn btn-add",
      onClick: addTr
    }, React.createElement(Plus, {
      size: 15
    }), "Add a transfer")));
  })(), tab === "debt" && (() => {
    const noDebt = D.totalLoans <= 0;
    const covers = D.mDp > D.monthlyInterest + 1e-9;
    const rankMap = {};
    D.loans.filter(l => n0(l.balance) > 0).sort((a, b) => n0(b.apr) - n0(a.apr) || n0(a.balance) - n0(b.balance)).forEach((l, i) => rankMap[l.id] = i + 1);
    const origTotal = debts.reduce((s, l) => s + Math.max(n0(l.originalBalance), n0(l.balance)), 0);
    const paidDown = Math.max(0, origTotal - D.totalDebt);
    const pct = origTotal > 0 ? Math.min(100, paidDown / origTotal * 100) : 0;
    const paidToDate = payments.reduce((s, p) => s + n0(p.amount), 0);
    const w2m = w => Math.round(w / 4.348);
    return React.createElement(React.Fragment, null, !noDebt && React.createElement("div", {
      className: "sgrid rise",
      style: {
        marginBottom: 16
      }
    }, React.createElement(Stat, {
      k: "Debt-free<br/>date",
      v: D.sim.debtFree != null ? fmtDate(w2date(D.sim.debtFree)) : "40y+",
      accent: "amber"
    }), React.createElement(Stat, {
      k: "Total interest<br/>you'll pay",
      v: fmtBig(D.sim.interest)
    }), React.createElement(Stat, {
      k: "Interest saved<br/>vs minimums",
      v: fmtBig(D.interestSaved),
      accent: "green"
    }), React.createElement(Stat, {
      k: "Time saved<br/>vs minimums",
      v: fmtDur(w2m(D.wksSaved)),
      accent: "green"
    })), noDebt && React.createElement("div", {
      className: "panel rise"
    }, React.createElement("div", {
      className: "empty",
      style: {
        color: "var(--green)",
        fontSize: 14
      }
    }, "No active debt — nicely done.", React.createElement("br", null), "Add a loan below to model one.")), !covers && !noDebt && React.createElement("div", {
      className: "warn rise"
    }, React.createElement(AlertTriangle, {
      size: 18,
      color: "var(--red)",
      style: {
        flex: "none",
        marginTop: 1
      }
    }), React.createElement("div", null, React.createElement("div", {
      className: "wt"
    }, "Payments don't cover interest"), React.createElement("div", {
      className: "wb"
    }, "You're paying ", fmtMoney(D.mDp), "/mo against ", fmtMoney(D.monthlyInterest), "/mo of interest, so balances grow. Raise a payment in Cash flow."))), !noDebt && React.createElement("div", {
      className: "panel rise"
    }, React.createElement("div", {
      className: "phead"
    }, React.createElement("div", {
      className: "ptitle"
    }, "Balance decay"), ranges(scDebt, maxW)), React.createElement("div", {
      className: "scope-wrap",
      ref: scDebt.ref,
      ...scDebt.handlers
    }, React.createElement(ResponsiveContainer, {
      width: "100%",
      height: 278
    }, React.createElement(ComposedChart, {
      data: sampleRange(D.debtCurve, scDebt.lo, scDebt.hi, 320),
      margin: {
        top: 14,
        right: 12,
        bottom: 0,
        left: 6
      }
    }, React.createElement("defs", null, React.createElement("linearGradient", {
      id: "planFill",
      x1: "0",
      y1: "0",
      x2: "0",
      y2: "1"
    }, React.createElement("stop", {
      offset: "0%",
      stopColor: "#F5A623",
      stopOpacity: 0.28
    }), React.createElement("stop", {
      offset: "100%",
      stopColor: "#F5A623",
      stopOpacity: 0
    }))), React.createElement(CartesianGrid, {
      stroke: "var(--line)",
      strokeDasharray: "2 4"
    }), React.createElement(XAxis, axisProps(scDebt)), React.createElement(YAxis, yProps), React.createElement(Tooltip, {
      content: p => React.createElement(Tip, {
        ...p,
        start: start,
        rows: [{
          key: "plan",
          name: "Your payments",
          color: "var(--amber)"
        }, {
          key: "min",
          name: "Minimums only",
          color: "var(--cyan)"
        }]
      }),
      cursor: {
        stroke: "var(--line2)"
      }
    }), D.sim.debtFree != null && React.createElement(ReferenceLine, {
      x: D.sim.debtFree,
      stroke: "var(--amber)",
      strokeDasharray: "3 3",
      label: {
        value: "DEBT-FREE",
        position: "top",
        fill: "var(--amber)",
        fontSize: 9.5,
        fontFamily: "var(--mono)"
      }
    }), React.createElement(Area, {
      type: "monotone",
      dataKey: "plan",
      stroke: "var(--amber)",
      strokeWidth: 2.5,
      fill: "url(#planFill)",
      dot: false,
      activeDot: {
        r: 4,
        fill: "var(--amber)",
        stroke: "none"
      },
      isAnimationActive: false
    }), React.createElement(Line, {
      type: "monotone",
      dataKey: "min",
      stroke: "var(--cyan)",
      strokeWidth: 1.6,
      strokeDasharray: "5 4",
      dot: false,
      isAnimationActive: false
    })))), ZHINT, React.createElement("div", {
      className: "legend",
      style: {
        marginTop: 8
      }
    }, React.createElement("span", {
      className: "lg"
    }, React.createElement("span", {
      className: "swatch",
      style: {
        borderTopColor: "var(--amber)",
        borderTopWidth: 3
      }
    }), "Your actual payments"), React.createElement("span", {
      className: "lg"
    }, React.createElement("span", {
      className: "swatch",
      style: {
        borderTopColor: "var(--cyan)",
        borderTopStyle: "dashed"
      }
    }), "Minimums only")), React.createElement("div", {
      className: "assume"
    }, "The amber line is driven by the payments you've set in Cash flow, extrapolated forward — ", fmtMoney(D.mDp), "/mo across ", debtPayments.length, " payment", debtPayments.length === 1 ? "" : "s", ". Change them there and this moves.")), React.createElement("div", {
      className: "panel rise"
    }, React.createElement("div", {
      className: "phead"
    }, React.createElement("div", {
      className: "ptitle"
    }, "Loans · payoff order"), React.createElement("div", {
      className: "psub"
    }, "highest rate first")), D.loans.map(l => React.createElement(LoanCard, {
      key: l.id,
      loan: l,
      rank: rankMap[l.id],
      payoffMonth: D.sim.payoffWeek[l.id] != null ? w2m(D.sim.payoffWeek[l.id]) : null,
      start: start,
      hasPayments: hasPay(l.id),
      onField: upDebtField,
      onBalance: upDebtBal,
      onRemove: rmDebt
    })), React.createElement("button", {
      className: "btn btn-add",
      onClick: addDebt
    }, React.createElement(Plus, {
      size: 15
    }), "Add a loan"), React.createElement("div", {
      className: "assume"
    }, "Minimum payment here is only used to draw the \"minimums only\" comparison line. What you actually pay is set in Cash flow.", D.cards.length > 0 ? " Credit cards are managed in Cash flow — they still count against your net worth." : "", " For a loan in deferment, set \"interest starts\" to when it kicks in — subsidised loans don't accrue while you're enrolled, unsubsidised ones do, so leave those blank.")), !noDebt && React.createElement("div", {
      className: "panel rise"
    }, React.createElement("div", {
      className: "phead"
    }, React.createElement("div", {
      className: "ptitle"
    }, "Progress")), React.createElement("div", {
      className: "prog-nums"
    }, React.createElement("div", {
      className: "prog-pct"
    }, pct.toFixed(1), "%"), React.createElement("div", {
      className: "prog-rem"
    }, fmtMoney(paidDown), " paid down", React.createElement("br", null), React.createElement("b", null, fmtMoney(D.totalDebt)), " to go")), React.createElement("div", {
      className: "track"
    }, React.createElement("div", {
      className: "fill",
      style: {
        width: pct + "%"
      }
    })), React.createElement("div", {
      className: "budget",
      style: {
        marginTop: 10
      }
    }, "Logged payments to date: ", React.createElement("b", {
      style: {
        color: "var(--green)"
      }
    }, fmtMoney(paidToDate))), React.createElement("div", {
      className: "modal-row"
    }, React.createElement("select", {
      value: logLoan,
      onChange: e => setLogLoan(e.target.value),
      style: {
        flex: "1 1 100%"
      },
      "aria-label": "Loan"
    }, React.createElement("option", {
      value: ""
    }, "Which loan?"), debts.map(l => React.createElement("option", {
      key: l.id,
      value: l.id
    }, l.name))), React.createElement("input", {
      type: "number",
      inputMode: "decimal",
      placeholder: "$ amount",
      value: logAmt,
      onChange: e => setLogAmt(e.target.value),
      "aria-label": "Amount",
      style: {
        flex: 1,
        minWidth: 110
      }
    }), React.createElement("input", {
      type: "date",
      value: logDate,
      onChange: e => setLogDate(e.target.value),
      "aria-label": "Date"
    }), React.createElement("button", {
      className: "btn btn-amber",
      style: {
        flex: "1 1 100%",
        justifyContent: "center"
      },
      onClick: addPayment
    }, React.createElement(Plus, {
      size: 15
    }), "Log payment")), React.createElement("div", {
      style: {
        marginTop: 14,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        maxHeight: 200,
        overflow: "auto"
      }
    }, payments.length === 0 ? React.createElement("div", {
      className: "empty"
    }, "No payments logged yet.", React.createElement("br", null), "Update each loan's balance from your statement to keep the forecast sharp.") : payments.slice(0, 40).map(p => React.createElement("div", {
      key: p.id,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 4px",
        borderBottom: "1px solid var(--line)",
        fontFamily: "var(--mono)",
        fontSize: 12.5
      }
    }, React.createElement("span", {
      style: {
        color: "var(--faint)",
        fontSize: 11,
        width: 52
      }
    }, p.date?.slice(5)), React.createElement("span", {
      style: {
        color: "var(--muted)",
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, nameOf(p.loanId)), React.createElement("span", {
      style: {
        color: "var(--green)",
        fontWeight: 600
      }
    }, fmtMoney(p.amount)), React.createElement("button", {
      className: "icon-btn",
      onClick: () => rmPayment(p.id),
      "aria-label": "Delete"
    }, React.createElement(Trash2, {
      size: 13
    })))))));
  })(), tab === "invest" && (() => {
    const last = D.sim.series[Math.min(maxW, D.sim.series.length - 1)];
    const endVal = last.invest,
      endBasis = last.basis,
      growth = Math.max(0, endVal - endBasis);
    return React.createElement(React.Fragment, null, React.createElement("div", {
      className: "sgrid rise",
      style: {
        marginBottom: 16
      }
    }, React.createElement(Stat, {
      k: "Invested<br/>today",
      v: fmtBig(D.bInv),
      accent: "green"
    }), React.createElement(Stat, {
      k: "Value by<br/>" + fmtDate(w2date(maxW)),
      v: fmtBig(endVal),
      accent: "green"
    }), React.createElement(Stat, {
      k: "Growth<br/>(returns)",
      v: fmtBig(growth),
      accent: "cyan"
    }), React.createElement(Stat, {
      k: "Financial<br/>independence",
      v: D.sim.fire != null ? fmtDate(w2date(D.sim.fire)) : "40y+",
      accent: "amber"
    })), React.createElement("div", {
      className: "panel rise"
    }, React.createElement("div", {
      className: "phead"
    }, React.createElement("div", {
      className: "ptitle"
    }, "Portfolio growth"), ranges(scInv, maxW)), React.createElement("div", {
      className: "scope-wrap",
      ref: scInv.ref,
      ...scInv.handlers
    }, React.createElement(ResponsiveContainer, {
      width: "100%",
      height: 286
    }, React.createElement(ComposedChart, {
      data: sampleRange(D.sim.series, scInv.lo, scInv.hi, 320).map(s => ({
        w: s.w,
        value: s.invest,
        basis: s.basis
      })),
      margin: {
        top: 16,
        right: 12,
        bottom: 0,
        left: 6
      }
    }, React.createElement("defs", null, React.createElement("linearGradient", {
      id: "ivFill",
      x1: "0",
      y1: "0",
      x2: "0",
      y2: "1"
    }, React.createElement("stop", {
      offset: "0%",
      stopColor: "#5CCB8B",
      stopOpacity: 0.24
    }), React.createElement("stop", {
      offset: "100%",
      stopColor: "#5CCB8B",
      stopOpacity: 0
    }))), React.createElement(CartesianGrid, {
      stroke: "var(--line)",
      strokeDasharray: "2 4"
    }), React.createElement(XAxis, axisProps(scInv)), React.createElement(YAxis, yProps), React.createElement(Tooltip, {
      content: p => React.createElement(Tip, {
        ...p,
        start: start,
        rows: [{
          key: "value",
          name: "Value",
          color: "var(--green)"
        }, {
          key: "basis",
          name: "You put in",
          color: "var(--cyan)"
        }]
      }),
      cursor: {
        stroke: "var(--line2)"
      }
    }), fireN > 0 && D.sim.fire != null && React.createElement(ReferenceLine, {
      y: fireN,
      stroke: "var(--amber)",
      strokeDasharray: "3 3",
      label: {
        value: "FI " + fmtBig(fireN),
        position: "insideTopRight",
        fill: "var(--amber)",
        fontSize: 9.5,
        fontFamily: "var(--mono)"
      }
    }), React.createElement(Area, {
      type: "monotone",
      dataKey: "value",
      stroke: "var(--green)",
      strokeWidth: 2.6,
      fill: "url(#ivFill)",
      dot: false,
      activeDot: {
        r: 4,
        fill: "var(--green)",
        stroke: "none"
      },
      isAnimationActive: false
    }), React.createElement(Line, {
      type: "monotone",
      dataKey: "basis",
      stroke: "var(--cyan)",
      strokeWidth: 1.6,
      strokeDasharray: "5 4",
      dot: false,
      isAnimationActive: false
    })))), ZHINT, React.createElement("div", {
      className: "assume"
    }, "The green line is driven by the transfers and income splits you've set in Cash flow — ", fmtMoney(D.mTr), "/mo of transfers plus any share of your paycheck routed straight into an investment account. The gap above the dashed line is compound growth.")), React.createElement("div", {
      className: "panel rise"
    }, React.createElement("div", {
      className: "phead"
    }, React.createElement("div", {
      className: "ptitle"
    }, "Independence target")), React.createElement("div", {
      className: "fields3",
      style: {
        gridTemplateColumns: "1fr 1fr"
      }
    }, React.createElement(NumField, {
      label: "Safe withdrawal rate",
      suffix: "%",
      value: settings.withdrawalRate,
      onChange: v => setS("withdrawalRate", n0(v))
    }), React.createElement(NumField, {
      label: "FI target",
      prefix: "$",
      value: Math.round(fireN),
      readOnly: true
    })), React.createElement("div", {
      className: "assume"
    }, "Based on ", fmtMoney(D.sim.annualExp / 12), "/mo of long-run living expenses — ", fmtBig(D.sim.annualExp), " a year. Only expenses count here, not transfers or debt payments.", D.sim.endingSoon.length > 0 && React.createElement(React.Fragment, null, " Excluded because they end before then: ", D.sim.endingSoon.map(e => e.category).join(", "), " — worth ", fmtBig((D.sim.annualExpNow - D.sim.annualExp) * (100 / (n0(settings.withdrawalRate) || 4))), " off the target.")), React.createElement("label", {
      className: "switch"
    }, React.createElement("input", {
      type: "checkbox",
      checked: !!settings.redirect,
      onChange: e => setS("redirect", e.target.checked)
    }), React.createElement("span", {
      className: "swtrack"
    }, React.createElement("span", {
      className: "swknob"
    })), React.createElement("span", {
      className: "sw-label"
    }, "Once every loan is cleared, redirect those payments into investing")), React.createElement("div", {
      className: "capline",
      style: {
        marginTop: 14
      }
    }, React.createElement("div", {
      className: "field",
      style: {
        flex: 1,
        minWidth: 160
      }
    }, React.createElement("label", null, "When there's no debt left, money goes to"), React.createElement("select", {
      value: settings.overflowTo || "",
      onChange: e => setS("overflowTo", e.target.value),
      "aria-label": "Overflow destination"
    }, React.createElement("option", {
      value: ""
    }, defaultOverflow ? defaultOverflow.name + " (first investment account)" : "— no investment account —"), accounts.map(a => React.createElement("option", {
      key: a.id,
      value: a.id
    }, a.name)))), React.createElement("div", {
      className: "caphint"
    }, "This catches both: freed-up loan payments after payoff, and anything a capped account sweeps once its target loan is gone. Until then a sweep aimed at a loan pays that loan, then rolls to your highest-rate remaining loan — only after every loan is clear does it land here."))), React.createElement("div", {
      className: "panel rise"
    }, React.createElement("div", {
      className: "phead"
    }, React.createElement("div", {
      className: "ptitle"
    }, "Illiquid equity — options, RSUs, private stock")), React.createElement("div", {
      className: "assume",
      style: {
        fontSize: 11.5,
        marginTop: 0
      }
    }, "There's deliberately no field for this, because any number you'd enter would be wrong in a way that flatters the projection. Private-company options aren't an asset that compounds at 7% — they're a claim that pays either nothing or a lot, on a date nobody controls, and this tool has no way to express that.", React.createElement("br", null), React.createElement("br", null), "What is real and worth modelling: the ", React.createElement("b", null, "cash you spend exercising"), ". That's a dated outflow from a real account — put it in Cash flow as a one-time expense on the date you plan to exercise, and the tax bill the following April as another. Both hit your runway whether or not the equity is ever worth anything.", React.createElement("br", null), React.createElement("br", null), "If you want the shares on the balance sheet anyway, add an account of type \"Other asset\" at ", React.createElement("b", null, "0% return"), ", holding only what you actually paid in strike price. That's the one defensible number — it's cost, not a valuation. Leaving it out entirely is the more conservative read, and keeps your FI date honest: reaching independence on salary alone, with the equity as pure upside rather than load-bearing.")));
  })())));
}
const rootEl = document.getElementById("root");
ReactDOM.createRoot(rootEl).render(React.createElement(FinancialSimulator, null));