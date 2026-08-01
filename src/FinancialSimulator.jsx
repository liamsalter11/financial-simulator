/* The main component: all state and handlers live here; each tab's rendering is
   delegated to src/tabs/*.jsx, which receive whatever slice of state/handlers they need. */
const { useState, useEffect, useMemo, useRef, useDeferredValue } = React;
import {
  HelpCircle, Upload, Download, RotateCcw, Zap, AlertTriangle, Check, X,
  LayoutGrid, Wallet, Receipt, TrendingDown, InvestIcon,
} from "./icons.js";
import { Modal } from "./components.js";
import {
  n0, num, uid, todayISO, nextFirstISO, firstOfYear, isoDate, addMonths, parseDate, addDays,
  fmtMoney, fmtBig, fmtC, weekTick, r2, parse, OPY, ACCT_TYPES,
  isInvest, isSav, isCash, BUCKET_COLOR, PAL, acctColor, debtColor, inflFactor,
} from "./format.js";
import { firesInWeek } from "./recurrence.js";
import { payrollOf, bonusOf, effectiveTaxRate, isDerived, takeHomeOf } from "./payroll.js";
import { WEEKS } from "./engine.js";
import { projectAll } from "./project.js";
import {
  SEED_ACCOUNTS, SEED_DEBTS, normDebts, normIncome, normAccounts, isCard, pickIds,
  seedIncome, seedExpenses, seedTransfers, seedDebtPays, seedSettings,
} from "./seeds.js";
import { store } from "./store.js";
import { useScope } from "./useScope.js";
import { HELP } from "./help-content.js";
import { CSS } from "./styles.js";
import { OverviewTab } from "./tabs/OverviewTab.js";
import { AccountsTab } from "./tabs/AccountsTab.js";
import { CashFlowTab } from "./tabs/CashFlowTab.js";
import { DebtTab } from "./tabs/DebtTab.js";
import { InvestTab } from "./tabs/InvestTab.js";

export function FinancialSimulator() {
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
  const [showHelp, setShowHelp] = useState(false); /* closed by default */
  const [modal, setModal] = useState(null);
  const [importText, setImportText] = useState("");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = (msg, isErr, ms) => {
    setToast({ msg, isErr: !!isErr });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), ms || 2600);
  };
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  /* localStorage can silently fail (private browsing, full quota) — warn once, not on every keystroke */
  const storageWarnedRef = useRef(false);
  const persist = (key, value) => {
    store.set(key, value).then((ok) => {
      if (ok || storageWarnedRef.current) return;
      storageWarnedRef.current = true;
      showToast("Your browser is blocking saved data — changes here won't be kept once you leave this page", true, 6000);
    });
  };
  const [logLoan, setLogLoan] = useState(""); const [logAmt, setLogAmt] = useState(""); const [logDate, setLogDate] = useState(todayISO());

  const start = useMemo(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }, []);

  useEffect(() => {
    (async () => {
      const K = ["fin3:accounts", "fin3:debts", "fin3:income", "fin3:expenses", "fin3:transfers", "fin3:debtPayments", "fin3:payments", "fin3:settings", "fin3:seedNote"];
      const O = ["fin2:accounts", "fin2:debts", "fin2:income", "fin2:expenses", "fin2:contributions", "fin2:payments", "fin2:settings"];
      const [a3, d3, i3, e3, t3, dp3, p3, s3, note, a2, d2, i2, e2, c2, p2, s2] = await Promise.all([...K, ...O].map((k) => store.get(k)));
      const accts = a3 ? parse(a3, SEED_ACCOUNTS()) : (a2 ? parse(a2, SEED_ACCOUNTS()) : SEED_ACCOUNTS());
      const dbts = d3 ? parse(d3, SEED_DEBTS()) : (d2 ? parse(d2, SEED_DEBTS()) : SEED_DEBTS());
      const id = pickIds(accts, dbts);
      setAccounts(normAccounts(accts)); setDebts(normDebts(dbts));
      const rawInc = i3 ? parse(i3, null) : (i2 ? parse(i2, null) : null);
      setIncome(rawInc ? normIncome(rawInc, id.chk, id.ret) : seedIncome(id));
      setExpenses(e3 ? parse(e3, seedExpenses(id)) : (e2 ? parse(e2, seedExpenses(id)) : seedExpenses(id)));
      setTransfers(t3 ? parse(t3, seedTransfers(id)) : (c2 ? parse(c2, seedTransfers(id)) : seedTransfers(id)));
      const oldS = parse(s2, {});
      if (dp3) setDebtPayments(parse(dp3, []));
      else {
        const base = seedDebtPays(id, dbts).filter((x) => x.amount > 0);
        if (oldS.extraDebt != null) { const ex = base.find((x) => x.name === "Extra toward payoff"); if (ex) ex.amount = n0(oldS.extraDebt); }
        if (oldS.debtFromAcct) base.forEach((x) => { x.fromAcct = oldS.debtFromAcct; });
        setDebtPayments(base);
      }
      setPayments(p3 ? parse(p3, []) : (p2 ? parse(p2, []) : []));
      /* merge onto defaults, not replace — so a setting added after a user's last save (e.g. mcVolatility) gets a sane value instead of undefined */
      setSettings(s3 ? { ...seedSettings(), ...parse(s3, {}) } : { ...seedSettings(), ...(oldS.withdrawalRate != null ? { withdrawalRate: Number(oldS.withdrawalRate) } : {}), ...(oldS.redirect != null ? { redirect: !!oldS.redirect } : {}) });
      const fresh = !a3 && !a2;
      if (note === "1" || fresh) { setSeedNote(true); if (fresh) store.set("fin3:seedNote", "1"); }
      setReady(true);
    })();
  }, []);
  useEffect(() => { if (ready && accounts) persist("fin3:accounts", JSON.stringify(accounts)); }, [accounts, ready]);
  useEffect(() => { if (ready) persist("fin3:debts", JSON.stringify(debts)); }, [debts, ready]);
  useEffect(() => { if (ready) persist("fin3:income", JSON.stringify(income)); }, [income, ready]);
  useEffect(() => { if (ready) persist("fin3:expenses", JSON.stringify(expenses)); }, [expenses, ready]);
  useEffect(() => { if (ready) persist("fin3:transfers", JSON.stringify(transfers)); }, [transfers, ready]);
  useEffect(() => { if (ready) persist("fin3:debtPayments", JSON.stringify(debtPayments)); }, [debtPayments, ready]);
  useEffect(() => { if (ready) persist("fin3:payments", JSON.stringify(payments)); }, [payments, ready]);
  useEffect(() => { if (ready) persist("fin3:settings", JSON.stringify(settings)); }, [settings, ready]);

  /* setters */
  const setS = (k, v) => setSettings((p) => ({ ...p, [k]: v }));
  const hasPay = (id) => payments.some((p) => p.loanId === id);
  const upAcct = (id, k, v) => setAccounts((p) => p.map((a) => a.id === id ? { ...a, [k]: v } : a));
  const upAcctType = (id, t) => setAccounts((p) => p.map((a) => a.id === id ? { ...a, type: t, rate: (ACCT_TYPES.find((x) => x.v === t)?.rate ?? a.rate) } : a));
  const addAcct = () => setAccounts((p) => [...p, { id: uid(), name: "New account", type: "checking", balance: 0, rate: 0, taxTreatment: "taxable" }]);
  const rmAcct = (id) => setAccounts((p) => p.filter((a) => a.id !== id));
  const upDebtField = (id, k, v) => setDebts((p) => p.map((l) => l.id === id ? { ...l, [k]: v } : l));
  const upDebtBal = (id, v) => setDebts((p) => p.map((l) => l.id === id ? { ...l, balance: v, originalBalance: hasPay(id) ? l.originalBalance : v } : l));
  const addDebt = () => setDebts((p) => [...p, { id: uid(), name: "New loan", kind: "loan", balance: 0, originalBalance: 0, apr: 0, minPayment: 0, interestFrom: todayISO() }]);
  const addCard = () => { const nid = uid(); setDebts((p) => [...p, { id: nid, name: "New card", kind: "card", balance: 0, originalBalance: 0, apr: 22.99, minPayment: 0, interestFrom: todayISO() }]); return nid; };
  const addCardWithPayment = () => {
    const nid = uid(); const ids = pickIds(accounts, debts);
    setDebts((p) => [...p, { id: nid, name: "New card", kind: "card", balance: 0, originalBalance: 0, apr: 22.99, minPayment: 0, interestFrom: todayISO() }]);
    setDebtPayments((p) => [...p, { id: uid(), name: "New card payment", amount: 0, date: nextFirstISO(), recur: "monthly", fromAcct: ids.chk, toDebt: nid, payFull: true }]);
  };
  const rmDebt = (id) => { setDebts((p) => p.filter((l) => l.id !== id)); setDebtPayments((p) => p.filter((x) => x.toDebt !== id)); };
  const upInc = (id, k, v) => setIncome((p) => p.map((x) => x.id === id ? { ...x, [k]: v } : x));
  const addInc = () => setIncome((p) => [...p, { id: uid(), name: "New income", amount: 0, gross: 0, grossMode: "year", date: todayISO(), recur: "monthly", raise: 0, weekdayAdj: true, dist: [{ acctId: (accounts[0] || {}).id }] }]);
  const rmInc = (id) => setIncome((p) => p.filter((x) => x.id !== id));
  /* Social Security or a pension: ordinary income in the projection, but flagged so the
     independence target knows part of the bill will be covered without a portfolio. It
     starts at 67 when a birth year is on file, which is the full-benefit age for anyone
     using this today; otherwise 20 years out, which is at least obviously a placeholder. */
  const addGuaranteed = () => {
    const by = n0(settings.birthYear);
    const startDate = by > 0 ? isoDate(new Date(by + 67, 0, 1)) : isoDate(addMonths(new Date(), 240));
    setIncome((p) => [...p, {
      id: uid(), name: "Social Security", amount: 0, gross: 0, grossMode: "year", date: startDate,
      recur: "monthly", raise: 0, weekdayAdj: false, guaranteed: true, taxMode: "typed",
      dist: [{ acctId: pickIds(accounts, debts).chk }],
    }]);
  };
  const addSplit = (iid) => setIncome((p) => p.map((x) => x.id === iid ? { ...x, dist: [...(x.dist || []), { acctId: (accounts[0] || {}).id, mode: "pct", value: 10 }] } : x));
  const upSplit = (iid, idx, k, v) => setIncome((p) => p.map((x) => x.id === iid ? { ...x, dist: x.dist.map((s, i) => i === idx ? { ...s, [k]: v } : s) } : x));
  const rmSplit = (iid, idx) => setIncome((p) => p.map((x) => x.id === iid ? { ...x, dist: x.dist.filter((_, i) => i !== idx) } : x));
  const addPreTax = (iid) => { const ids = pickIds(accounts, debts); setIncome((p) => p.map((x) => x.id === iid ? { ...x, preTax: [...(x.preTax || []), { id: uid(), name: "401k contribution", mode: "pct", value: 3, toAcct: ids.ret, counts: true }] } : x)); };
  const upPreTax = (iid, pid, k, v) => setIncome((p) => p.map((x) => x.id === iid ? { ...x, preTax: (x.preTax || []).map((t) => t.id === pid ? { ...t, [k]: v } : t) } : x));
  const rmPreTax = (iid, pid) => setIncome((p) => p.map((x) => x.id === iid ? { ...x, preTax: (x.preTax || []).filter((t) => t.id !== pid) } : x));
  const setMatch = (iid, on) => { const ids = pickIds(accounts, debts); setIncome((p) => p.map((x) => x.id === iid ? { ...x, match: on ? { rate: 100, limit: 3, toAcct: ids.ret } : null } : x)); };
  const upMatch = (iid, k, v) => setIncome((p) => p.map((x) => x.id === iid ? { ...x, match: { ...(x.match || { rate: 100, limit: 3 }), [k]: v } } : x));
  const setBonus = (iid, on) => setIncome((p) => p.map((x) => x.id === iid ? { ...x, bonus: on ? { mode: "pct", value: 10, date: isoDate(addMonths(firstOfYear(), 14)), withhold: 30, preTaxApplies: true } : null } : x));
  const upBonus = (iid, k, v) => setIncome((p) => p.map((x) => x.id === iid ? { ...x, bonus: { ...(x.bonus || { mode: "pct", value: 10, withhold: 30, preTaxApplies: true }), [k]: v } } : x));
  const addChange = (iid) => setIncome((p) => p.map((x) => {
    if (x.id !== iid) return x;
    const last = (x.changes || []).slice().sort((a, b) => parseDate(a.date) - parseDate(b.date)).pop();
    return { ...x, changes: [...(x.changes || []), { id: uid(), date: isoDate(addMonths(new Date(), 12)), label: "Promotion", gross: last ? last.gross : x.gross, grossMode: x.grossMode || "year", taxRate: last ? last.taxRate : effectiveTaxRate(x) }] };
  }));
  const upChange = (iid, cid, k, v) => setIncome((p) => p.map((x) => x.id === iid ? { ...x, changes: (x.changes || []).map((c) => c.id === cid ? { ...c, [k]: v } : c) } : x));
  const rmChange = (iid, cid) => setIncome((p) => p.map((x) => x.id === iid ? { ...x, changes: (x.changes || []).filter((c) => c.id !== cid) } : x));
  const upExp = (id, k, v) => setExpenses((p) => p.map((x) => x.id === id ? { ...x, [k]: v } : x));
  const addExp = () => setExpenses((p) => [...p, { id: uid(), category: "New expense", amount: 0, date: todayISO(), recur: "monthly", fromAcct: pickIds(accounts, debts).chk }]);
  const rmExp = (id) => setExpenses((p) => p.filter((x) => x.id !== id));
  const upTr = (id, k, v) => setTransfers((p) => p.map((x) => x.id === id ? { ...x, [k]: v } : x));
  const addTr = () => { const id = pickIds(accounts, debts); setTransfers((p) => [...p, { id: uid(), name: "New transfer", amount: 0, date: todayISO(), recur: "monthly", fromAcct: id.chk, toAcct: id.brk }]); };
  const rmTr = (id) => setTransfers((p) => p.filter((x) => x.id !== id));
  const upDp = (id, k, v) => setDebtPayments((p) => p.map((x) => x.id === id ? { ...x, [k]: v } : x));
  const addDp = (recur) => { const id = pickIds(accounts, debts, settings.payoffOrder); setDebtPayments((p) => [...p, { id: uid(), name: recur === "once" ? "Extra payment" : "New payment", amount: 0, date: recur === "once" ? todayISO() : nextFirstISO(), recur, fromAcct: id.chk, toDebt: id.hiDebt }]); };
  const rmDp = (id) => setDebtPayments((p) => p.filter((x) => x.id !== id));
  const addPayment = () => { const amt = n0(logAmt); if (!logLoan || amt <= 0) return; setPayments((p) => [{ id: uid(), loanId: logLoan, amount: amt, date: logDate }, ...p]); setLogAmt(""); };
  const rmPayment = (id) => setPayments((p) => p.filter((x) => x.id !== id));
  const dismissNote = () => { setSeedNote(false); store.set("fin3:seedNote", "0"); };
  const resetAll = () => {
    if (!window.confirm("Reset everything back to the starting example?")) return;
    const accts = SEED_ACCOUNTS(), dbts = SEED_DEBTS(), id = pickIds(accts, dbts);
    setAccounts(normAccounts(accts)); setDebts(normDebts(dbts)); setIncome(seedIncome(id)); setExpenses(seedExpenses(id));
    setTransfers(seedTransfers(id)); setDebtPayments(seedDebtPays(id, dbts)); setPayments([]); setSettings(seedSettings());
    setSeedNote(true); store.set("fin3:seedNote", "1");
  };

  const buildDump = () => JSON.stringify({ app: "fin-sim", version: 6, exportedAt: new Date().toISOString(), accounts, debts, income, expenses, transfers, debtPayments, payments, settings }, null, 2);
  const openExport = () => { setImportText(buildDump()); setModal("export"); };
  const copyText = async (text) => {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch { }
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", "");
      ta.style.position = "fixed"; ta.style.top = "0"; ta.style.left = "0"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      const ok = document.execCommand("copy"); ta.remove(); return ok;
    } catch { return false; }
  };
  const doCopy = async () => {
    const ok = await copyText(buildDump());
    showToast(ok ? "Copied to clipboard" : "Couldn't copy — select the text and copy manually", !ok);
  };
  const doDownload = async () => {
    const text = buildDump();
    const fname = "financial-simulator-" + todayISO() + ".json";
    /* 1) real save dialog — the path that survives a sandboxed frame */
    if (window.showSaveFilePicker) {
      try {
        const h = await window.showSaveFilePicker({ suggestedName: fname, types: [{ description: "JSON file", accept: { "application/json": [".json"] } }] });
        const w = await h.createWritable(); await w.write(text); await w.close();
        showToast("Saved " + fname); return;
      } catch (e) { if (e && e.name === "AbortError") return; }
    }
    /* 2) classic blob download */
    try {
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fname; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast("Download started — if nothing lands, use Copy"); return;
    } catch { }
    /* 3) clipboard */
    const ok = await copyText(text);
    showToast(ok ? "Download blocked here — copied to clipboard instead" : "Couldn't save — select the text and copy manually", true);
  };
  const applyImport = (text) => {
    let data; try { data = JSON.parse(text); } catch { alert("That doesn't look like valid saved data."); return; }
    const accts = Array.isArray(data.accounts) ? data.accounts : accounts;
    const dbts = Array.isArray(data.debts) ? data.debts : debts;
    const id = pickIds(accts, dbts);
    if (Array.isArray(data.accounts)) setAccounts(normAccounts(data.accounts));
    if (Array.isArray(data.debts)) setDebts(normDebts(data.debts));
    if (Array.isArray(data.income)) setIncome(normIncome(data.income, id.chk, id.ret));
    if (Array.isArray(data.expenses)) setExpenses(data.expenses);
    if (Array.isArray(data.transfers)) setTransfers(data.transfers);
    else if (Array.isArray(data.contributions)) setTransfers(data.contributions);
    if (Array.isArray(data.debtPayments)) setDebtPayments(data.debtPayments);
    if (Array.isArray(data.payments)) setPayments(data.payments);
    if (data.settings && typeof data.settings === "object") setSettings({ ...seedSettings(), ...data.settings });
    setModal(null); setSeedNote(false); store.set("fin3:seedNote", "0");
  };
  const onJsonFile = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => setImportText(String(rd.result || "")); rd.readAsText(f); e.target.value = ""; };

  /* ================================================================== */
  /*  The projection, off the main thread                                */
  /* ================================================================== */
  /* Three full 40-year simulations plus a Monte Carlo is ~180ms of work, and it reruns on
     every keystroke. Run it in a module worker and keep rendering the previous result while
     the next one is in flight: the input stays responsive and the charts catch up. */
  const [P, setP] = useState(null);
  const [busy, setBusy] = useState(true);
  const workerRef = useRef(null);
  const reqRef = useRef(0);
  const inputRef = useRef(null);
  /* a worker that fails — blocked, wrong MIME type, thrown — must never leave the page
     staring at stale charts, so every failure path recomputes here instead */
  const fallback = () => {
    workerRef.current = null;
    if (inputRef.current) setP(projectAll(inputRef.current));
    setBusy(false);
  };

  useEffect(() => {
    if (typeof Worker === "undefined") return undefined;
    let w = null;
    try { w = new Worker(new URL("./worker.js", import.meta.url), { type: "module" }); } catch { return undefined; }
    w.onmessage = (e) => {
      const { id, stage, result } = e.data || {};
      if (id !== reqRef.current) return; /* a reply to a keystroke that's already stale */
      if (stage === "error") { w.terminate(); fallback(); return; }
      /* merge rather than replace, so the comparison panels keep their last numbers for the
         moment between a primary result and the extras that follow it */
      setP((prev) => ({ ...(prev || {}), ...result }));
      if (stage !== "primary") setBusy(false);
    };
    w.onerror = () => { w.terminate(); fallback(); };
    workerRef.current = w;
    return () => { w.terminate(); workerRef.current = null; };
  }, []);

  /* what the projection actually depends on — deferred, so a burst of typing queues one
     run rather than one per character */
  const projectionInput = useMemo(
    () => ({ accounts, debts, income, expenses, transfers, debtPayments, settings, start, weeks: WEEKS }),
    [accounts, debts, income, expenses, transfers, debtPayments, settings, start],
  );
  const deferredInput = useDeferredValue(projectionInput);

  useEffect(() => {
    /* the guard is on the deferred input, not on `accounts`: one render after loading
       finishes, `accounts` is populated but the deferred copy can still be the empty
       pre-load state, and projecting that throws */
    if (!ready || !deferredInput.accounts) return;
    inputRef.current = deferredInput;
    const id = ++reqRef.current;
    setBusy(true);
    const w = workerRef.current;
    if (w) { w.postMessage({ id, input: deferredInput }); return; }
    /* no worker (or it failed): same code, same results, just on this thread */
    setP(projectAll(deferredInput));
    setBusy(false);
  }, [deferredInput, ready]);

  /* derived */
  const D = useMemo(() => {
    if (!accounts || !P || !P.sim) return null;
    const per = (list, key) => list.reduce((s, x) => s + n0(x[key || "amount"]) * OPY[x.recur] / 12, 0);
    /* "this month" figures should only count income that has actually started: Social
       Security thirty years out is real money, but it isn't part of today's surplus. */
    const flowing = (x) => {
      const d = parseDate(x.date);
      if (!isNaN(d) && d > start) return false;
      if (x.end) { const e = parseDate(x.end); if (!isNaN(e) && e < start) return false; }
      return true;
    };
    const incomeNow = income.filter(flowing);
    const loans = debts.filter((x) => !isCard(x));
    const cards = debts.filter((x) => isCard(x));
    const totalAssets = accounts.reduce((s, a) => s + n0(a.balance), 0);
    const totalDebt = debts.reduce((s, l) => s + n0(l.balance), 0);
    const totalLoans = loans.reduce((s, l) => s + n0(l.balance), 0);
    const netWorth = totalAssets - totalDebt;
    const mExp = per(expenses), mTr = per(transfers);
    const mBonusNet = incomeNow.reduce((s, i) => { const b = bonusOf(i, 1); return s + (b ? b.net / 12 : 0); }, 0);
    const mBonusPre = incomeNow.reduce((s, i) => { const b = bonusOf(i, 1); return s + (b ? (b.deferral + b.match) / 12 : 0); }, 0);
    const mPreTax = incomeNow.reduce((s, i) => s + payrollOf(i).total * OPY[i.recur] / 12, 0) + mBonusPre;
    const mInc = incomeNow.reduce((s, i) => s + (isDerived(i) ? takeHomeOf(i, { filing: settings.filing, stateRate: settings.stateRate }) : n0(i.amount)) * OPY[i.recur] / 12, 0) + mBonusNet;
    /* a "pay in full" card payment has no fixed amount — use what actually gets charged to that card */
    const cardIds = new Set(cards.map((c) => c.id));
    const chargedTo = (cid) => expenses.filter((e) => e.fromAcct === cid).reduce((s, e) => s + n0(e.amount) * OPY[e.recur] / 12, 0);
    const mDp = debtPayments.reduce((s, p) => s + (p.payFull && cardIds.has(p.toDebt) ? chargedTo(p.toDebt) : n0(p.amount) * OPY[p.recur] / 12), 0);
    const surplus = mInc - mExp;
    /* money into a 401k is saved money — it belongs in the rate even though it skips take-home */
    const savingsRate = (mInc + mPreTax) > 0 ? ((surplus + mPreTax) / (mInc + mPreTax)) * 100 : 0;
    const leftover = surplus - mTr - mDp;
    const monthlyInterest = loans.reduce((s, l) => s + n0(l.balance) * n0(l.apr) / 1200, 0);

    /* Everything expensive comes from src/project.js, computed in the worker (or inline
       when there isn't one). The comparison runs arrive a beat after the primary result,
       so fall back to the primary projection until they do. */
    const { sim, minW, mc, mcReturn, maxW, hypoOn, interestSaved, wksSaved, retireWeek, horizonWeeks } = P;
    const hasHypo = P.hasHypo;
    const simWith = P.simWith || sim;
    const simWithout = P.simWithout || sim;
    const strategy = P.strategy || null;
    /* net-worth gap at a given week — the Overview reads this at the chart's zoom edge */
    const nwGapAt = (w) => {
      const i = Math.max(0, Math.min(Math.round(w), simWith.series.length - 1, simWithout.series.length - 1));
      return simWith.series[i].nw - simWithout.series[i].nw;
    };

    /* next projected payment per card: find the next week a payment for it fires */
    const nextCardPay = {};
    for (const c of cards) {
      const pays = debtPayments.filter((p) => p.toDebt === c.id);
      if (!pays.length) continue;
      for (let w = 0; w < Math.min(sim.series.length - 1, 60); w++) {
        const ws = addDays(start, w * 7), we = addDays(ws, 7);
        const hit = pays.find((p) => firesInWeek(p, ws, we));
        if (hit) { nextCardPay[c.id] = { week: w, date: ws, amount: hit.payFull ? (sim.series[w].dbt[c.id] || 0) : n0(hit.amount), full: !!hit.payFull }; break; }
      }
    }
    const loansNoPayment = loans.filter((l) => n0(l.balance) > 0 && !debtPayments.some((p) => p.toDebt === l.id));

    /* worst realistic month of outflow from an account — the floor any cap has to clear.
       Monthly, quarterly and yearly items can all land in the same month, so count them full. */
    const worstMonthOut = (aid) => {
      const items = [...expenses.filter((e) => e.fromAcct === aid), ...debtPayments.filter((p) => p.fromAcct === aid), ...transfers.filter((t) => t.fromAcct === aid)];
      let s = 0;
      for (const it of items) {
        if (it.recur === "once") continue;
        const amt = (it.payFull && cardIds.has(it.toDebt)) ? chargedTo(it.toDebt) : n0(it.amount);
        if (it.recur === "weekly") s += amt * 5;
        else if (it.recur === "biweekly") s += amt * 3;
        else if (it.recur === "semimonthly") s += amt * 2;
        else s += amt;
      }
      return s;
    };
    let sweepSum = 0; const sweepWks = Math.min(sim.series.length - 1, 156);
    for (let w = 0; w < sweepWks; w++) sweepSum += sim.series[w].swept || 0;
    const avgSweep = sweepWks > 0 ? sweepSum / (sweepWks / 52.1775) / 12 : 0;
    const capped = accounts.filter((a) => a.cap != null && a.cap !== "" && a.spillTo);

    const acctColors = {}, names = {};
    accounts.forEach((a, i) => { acctColors[a.id] = acctColor(i); names[a.id] = a.name; });
    const debtColors = {}; debts.forEach((l, i) => { debtColors[l.id] = debtColor(i); names[l.id] = l.name; });
    names.nw = "Net worth";

    /* Display only. The simulation is entirely in today's dollars; this scales what's drawn
       back up into the money of the week it lands in, for anyone who'd rather see the
       number their statement will actually show. Milestone dates don't move — the FI target
       inflates at exactly the same rate the balances do, so the crossing point is identical,
       which is why the target is drawn as a rising line rather than a flat one here. */
    const infl = num(settings.inflation);
    const showNom = !!settings.showNominal && infl !== 0;
    const nomAt = (w) => (showNom ? inflFactor(infl, w) : 1);
    const scaleSnap = (s) => {
      const f = nomAt(s.w);
      const acct = {}; for (const k in s.acct) acct[k] = r2(s.acct[k] * f);
      const dbt = {}; for (const k in s.dbt) dbt[k] = r2(s.dbt[k] * f);
      return { ...s, nw: r2(s.nw * f), debt: r2(s.debt * f), loanDebt: r2(s.loanDebt * f), invest: r2(s.invest * f), basis: r2(s.basis * f), spendable: r2(s.spendable * f), reach: r2(s.reach * f), fi: r2(s.fi * f), acct, dbt };
    };
    const viewSeries = showNom ? sim.series.map(scaleSnap) : sim.series;

    const cf = [];
    const cfMax = Math.min(sim.series.length - 1, 312);
    for (let w = 0; w <= cfMax; w++) { const s = sim.series[w], f = nomAt(w); cf.push({ w, income: r2(s.inflow * f), spend: r2(s.outflow * f), net: r2((s.inflow - s.outflow) * f) }); }
    for (let i = 0; i < cf.length; i++) {
      let sum = 0, cnt = 0;
      for (let j = i - 2; j <= i + 2; j++) if (j >= 0 && j < cf.length) { sum += cf[j].net; cnt++; }
      cf[i].smooth = r2(sum / cnt);
    }
    const debtCurve = sim.series.map((s) => { const f = nomAt(s.w); return { w: s.w, plan: r2(s.loanDebt * f), min: r2(minW.series[s.w] * f) }; });

    const bInv = accounts.filter((a) => isInvest(a.type)).reduce((s, a) => s + n0(a.balance), 0);
    const bSav = accounts.filter((a) => isSav(a.type)).reduce((s, a) => s + n0(a.balance), 0);
    const bCash = accounts.filter((a) => isCash(a.type)).reduce((s, a) => s + n0(a.balance), 0);
    const alloc = [
      { name: "Investments", value: bInv, color: BUCKET_COLOR.Investments },
      { name: "Savings", value: bSav, color: BUCKET_COLOR.Savings },
      { name: "Cash", value: bCash, color: BUCKET_COLOR.Cash },
    ].filter((x) => x.value > 0);
    const spend = expenses.map((e) => ({ ...e, monthly: n0(e.amount) * OPY[e.recur] / 12 })).filter((e) => e.monthly > 0).sort((a, b) => b.monthly - a.monthly).map((e, i) => ({ ...e, color: PAL[i % PAL.length] }));

    let negAcct = null;
    for (let w = 0; w < Math.min(sim.series.length, 312) && !negAcct; w++) { const m = sim.series[w].acct; for (const a of accounts) if (m[a.id] < -1) { negAcct = a.name; break; } }

    /* how long the money you can actually reach this week would last with no income at all */
    const liquid = bCash + bSav;
    const runway = mExp > 0 ? liquid / mExp : null;

    /* which income sources run into the annual deferral cap, and what it costs them */
    const deferralNotes = income.map((inc) => {
      const ci = sim.capInfo && sim.capInfo[inc.id];
      return ci ? { id: inc.id, name: inc.name, date: addDays(start, ci.week * 7), lostMatch: ci.lostMatch } : null;
    }).filter(Boolean);

    const mcView = showNom ? { ...mc, bands: mc.bands.map((b) => { const f = nomAt(b.w); return { ...b, p10: b.p10 * f, p25: b.p25 * f, p50: b.p50 * f, p75: b.p75 * f, p90: b.p90 * f }; }) } : mc;

    /* the FI target stops being a single level once it moves: in future dollars it climbs
       with everything else, and with guaranteed income ahead of you it falls toward the
       date that income starts. Either way the charts draw a line rather than a level. */
    const fiSloped = showNom || sim.guaranteedAnnual > 0;

    return { totalAssets, totalDebt, totalLoans, netWorth, loans, cards, mInc, mExp, mTr, mDp, mPreTax, mBonusNet, surplus, savingsRate, leftover, monthlyInterest, sim, simWith, simWithout, hasHypo, hypoOn, nwGapAt, minW, maxW, mc: mcView, mcReturn, interestSaved, wksSaved, acctColors, debtColors, names, cf, debtCurve, alloc, spend, bInv, negAcct, nextCardPay, loansNoPayment, chargedTo, worstMonthOut, avgSweep, capped, infl, showNom, nomAt, viewSeries, strategy, liquid, runway, deferralNotes, fiSloped, bridge: sim.bridge, retireWeek, horizonWeeks, busy };
  }, [accounts, debts, income, expenses, transfers, debtPayments, settings, start, P, busy]);

  const maxW = D ? D.maxW : 520;
  const scNW = useScope(maxW, 260);
  const scBal = useScope(maxW, 260);
  const scCF = useScope(Math.min(maxW, 312), 52);
  const scDebt = useScope(maxW, 260);
  const scInv = useScope(maxW, 260);
  const scMC = useScope(maxW, 260);

  if (!accounts || !D) return (<><style>{CSS}</style><div className="fin"><div className="wrap"><div className="eyebrow">loading…</div></div></div></>);

  const TABS = [
    { id: "overview", label: "Overview", Icon: LayoutGrid },
    { id: "accounts", label: "Accounts", Icon: Wallet },
    { id: "cashflow", label: "Cash flow", Icon: Receipt },
    { id: "debt", label: "Debt", Icon: TrendingDown },
    { id: "invest", label: "Invest", Icon: InvestIcon },
  ];
  const nameOf = (id) => (debts.find((l) => l.id === id)?.name) || "—";
  const w2date = (w) => addDays(start, w * 7);
  const fireN = D.sim.fireNumber;
  const defaultOverflow = accounts.find((a) => isInvest(a.type)) || accounts.find((a) => a.type === "checking") || accounts[0];
  const near = (a, b) => Math.abs(a - b) < 4;
  const ranges = (sc, mx) => {
    const span = sc.hi - sc.lo;
    return (<div className="seg">
      <button className={near(span, 52) ? "on" : ""} onClick={() => sc.snap(52)}>1Y</button>
      <button className={near(span, 260) ? "on" : ""} onClick={() => sc.snap(260)}>5Y</button>
      <button className={span >= mx - 4 ? "on" : ""} onClick={() => sc.snap(mx)}>Max</button>
    </div>);
  };
  const ZHINT = <div className="zhint">scroll or pinch to zoom · drag to pan</div>;
  const axisProps = (sc) => ({
    dataKey: "w", type: "number", domain: [sc.lo, sc.hi], allowDataOverflow: true,
    tickFormatter: weekTick(start), tickLine: false, stroke: "var(--line2)", minTickGap: 28,
    tick: { fill: "var(--faint)", fontSize: 10, fontFamily: "var(--mono)" },
  });
  const yProps = { tickFormatter: fmtC, tickLine: false, axisLine: false, width: 48, tick: { fill: "var(--faint)", fontSize: 10, fontFamily: "var(--mono)" } };
  const chartProps = { ranges, ZHINT, axisProps, yProps, w2date, start, maxW };

  return (
    <>
      <style>{CSS}</style>
      <div className="fin">
        <div className="wrap">

          <div className="topbar rise">
            <div>
              <div className="eyebrow">Net worth</div>
              <div className="nwbig mono" style={{ color: D.netWorth >= 0 ? "var(--text)" : "var(--red)" }}>{fmtMoney(D.netWorth)}</div>
              <div className="nwsub">assets <b>{fmtBig(D.totalAssets)}</b> · debts <b>{fmtBig(D.totalDebt)}</b> · surplus <b>{fmtMoney(D.surplus)}</b>/mo
                {D.busy && <span className="recalc"> · recalculating</span>}</div>
            </div>
            <div className="toolbar">
              <button className={"tbtn" + (showHelp ? " on" : "")} onClick={() => setShowHelp((v) => !v)}
                aria-expanded={showHelp} aria-controls="help-panel"><HelpCircle size={13} />Help</button>
              <button className="tbtn" onClick={() => { setImportText(""); setModal("import"); }}><Upload size={13} />Import</button>
              <button className="tbtn" onClick={openExport}><Download size={13} />Export</button>
              <button className="tbtn" onClick={resetAll}><RotateCcw size={13} />Reset</button>
            </div>
          </div>

          <div className="tabs rise">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} className={"tabbtn" + (tab === id ? " active" : "")} onClick={() => setTab(id)}><Icon size={15} />{label}</button>
            ))}
          </div>

          {showHelp && (() => {
            const h = HELP[tab] || HELP.overview;
            return (
              <div className="panel help rise" id="help-panel">
                <div className="phead">
                  <div className="ptitle"><HelpCircle size={13} style={{ verticalAlign: -2, marginRight: 6 }} />How to use · {h.title}</div>
                  <button className="icon-btn" onClick={() => setShowHelp(false)} aria-label="Close help"><X size={16} /></button>
                </div>
                <div className="help-intro">{h.intro}</div>
                <dl className="help-list">
                  {h.points.map(([term, body], i) => (
                    <div className="help-item" key={i}><dt>{term}</dt><dd>{body}</dd></div>
                  ))}
                </dl>
                <div className="help-foot">Switch tabs with the help open and these notes follow along.</div>
              </div>
            );
          })()}

          {seedNote && (
            <div className="notice rise"><Zap size={14} color="var(--amber)" />
              Everything is an editable example — replace with your real numbers. It all saves automatically.
              <button onClick={dismissNote} aria-label="Dismiss">×</button></div>
          )}

          {toast && <div className={"toast" + (toast.isErr ? " err" : "")}>{toast.isErr ? <AlertTriangle size={14} color="var(--red)" /> : <Check size={14} color="var(--green)" />}{toast.msg}</div>}

          {modal === "export" && (
            <Modal title="Save your data to a file" onClose={() => setModal(null)}>
              <div className="mnote">Your work saves automatically between sessions. This gives you a portable file you own — a backup, or to move to another device, then load with Import.</div>
              <textarea className="jsonbox" readOnly value={importText} onClick={(e) => e.target.select()} />
              <div className="modal-row"><button className="btn btn-amber" onClick={doDownload}><Download size={15} />Download .json</button>
                <button className="btn btn-ghost" onClick={doCopy}>Copy to clipboard</button></div>
            </Modal>
          )}
          {modal === "import" && (
            <Modal title="Load saved data" onClose={() => setModal(null)}>
              <div className="mnote">Load a file you exported earlier. This replaces what's currently here.</div>
              <label className="filebtn"><Upload size={15} />Choose a .json file<input type="file" accept=".json,application/json" hidden onChange={onJsonFile} /></label>
              <div className="mnote" style={{ marginTop: 12 }}>…or paste the JSON here:</div>
              <textarea className="jsonbox" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste exported data" />
              <div className="modal-row"><button className="btn btn-amber" onClick={() => applyImport(importText)}><Check size={15} />Load data</button>
                <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button></div>
            </Modal>
          )}


          {/* ============================ OVERVIEW ============================ */}
          {tab === "overview" && (
            <OverviewTab D={D} accounts={accounts} debts={debts} chart={chartProps} scNW={scNW} scBal={scBal} fireN={fireN} settings={settings} setS={setS} />
          )}

          {/* ============================ ACCOUNTS ============================ */}
          {tab === "accounts" && (
            <AccountsTab D={D} accounts={accounts} settings={settings} defaultOverflow={defaultOverflow}
              upAcct={upAcct} upAcctType={upAcctType} addAcct={addAcct} rmAcct={rmAcct} />
          )}

          {/* ============================ CASH FLOW ============================ */}
          {tab === "cashflow" && (
            <CashFlowTab D={D} chart={chartProps} scCF={scCF} settings={settings} setS={setS}
              income={income} accounts={accounts} expenses={expenses} debts={debts} debtPayments={debtPayments} transfers={transfers}
              upInc={upInc} rmInc={rmInc} addInc={addInc} addGuaranteed={addGuaranteed} addSplit={addSplit} upSplit={upSplit} rmSplit={rmSplit}
              addPreTax={addPreTax} upPreTax={upPreTax} rmPreTax={rmPreTax}
              setMatch={setMatch} upMatch={upMatch} setBonus={setBonus} upBonus={upBonus}
              addChange={addChange} upChange={upChange} rmChange={rmChange}
              upExp={upExp} rmExp={rmExp} addExp={addExp}
              upDebtField={upDebtField} upDebtBal={upDebtBal} rmDebt={rmDebt} addCardWithPayment={addCardWithPayment}
              upDp={upDp} rmDp={rmDp} addDp={addDp} upTr={upTr} rmTr={rmTr} addTr={addTr} />
          )}

          {/* ============================ DEBT ============================ */}
          {tab === "debt" && (
            <DebtTab D={D} chart={chartProps} scDebt={scDebt} settings={settings} setS={setS}
              debts={debts} debtPayments={debtPayments} payments={payments}
              hasPay={hasPay} upDebtField={upDebtField} upDebtBal={upDebtBal} rmDebt={rmDebt} addDebt={addDebt}
              logLoan={logLoan} setLogLoan={setLogLoan} logAmt={logAmt} setLogAmt={setLogAmt}
              logDate={logDate} setLogDate={setLogDate} addPayment={addPayment} rmPayment={rmPayment} nameOf={nameOf} />
          )}

          {/* ============================ INVEST ============================ */}
          {tab === "invest" && (
            <InvestTab D={D} chart={chartProps} scInv={scInv} scMC={scMC} fireN={fireN}
              settings={settings} setS={setS} accounts={accounts} defaultOverflow={defaultOverflow} />
          )}

        </div>
      </div>
    </>
  );
}
