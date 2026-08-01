// Small, reusable presentational pieces shared across tabs.
const { PieChart, Pie, Cell, ResponsiveContainer } = Recharts;
import { X, Trash2, Check } from "./icons.js";
import { fmtBig, fmtMoney, fmtDate, fmtDur, n0, parseDate, addMonths, addDays } from "./format.js";
import { minPaymentOf, monthsToPayoff } from "./loan.js";

export const Stat = ({ k, v, accent }) => (<div className="stat"><div className="k" dangerouslySetInnerHTML={{ __html: k }} /><div className={"v mono " + (accent || "")}>{v}</div></div>);
export function NumField({ label, value, onChange, prefix, suffix, cls, readOnly }) {
  return (<div className={"field " + (cls || "")}><label>{label}</label>
    <div className="inp">{prefix && <span className="u">{prefix}</span>}
      <input type="number" inputMode="decimal" value={value} readOnly={readOnly} onChange={(e) => onChange && onChange(e.target.value)} />
      {suffix && <span className="u">{suffix}</span>}</div></div>);
}
export const Seg = ({ value, options, onChange, cls }) => (
  <div className={"seg " + (cls || "")}>{options.map((o) => <button key={o.v} className={value === o.v ? "on" : ""} onClick={() => onChange(o.v)}>{o.label}</button>)}</div>
);
export function Modal({ title, onClose, children }) {
  return (<div className="modal" onClick={onClose}><div className="modal-card" onClick={(e) => e.stopPropagation()}>
    <div className="modal-head"><span>{title}</span><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
    {children}</div></div>);
}
export function Donut({ data, center, sub }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (<div className="split">
    <div className="donut-wrap">
      <ResponsiveContainer width="100%" height={186}>
        <PieChart><Pie data={data.length ? data : [{ name: "—", value: 1, color: "#1B2735" }]} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={data.length > 1 ? 2 : 0} stroke="none" isAnimationActive={false}>
          {(data.length ? data : [{ color: "#1B2735" }]).map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie></PieChart>
      </ResponsiveContainer>
      <div className="donut-center"><div className="dc-v">{center}</div><div className="dc-s">{sub}</div></div>
    </div>
    <div className="dlegend">{data.map((d, i) => (<div className="dl-row" key={i}>
      <span className="dot" style={{ background: d.color }} /><span className="nm">{d.name}</span>
      <span className="vl">{fmtBig(d.value)}</span><span className="pc">{Math.round((d.value / total) * 100)}%</span></div>))}
    </div></div>);
}
export function LoanCard({ loan, rank, payoffMonth, start, hasPayments, onField, onBalance, onRemove }) {
  const paid = n0(loan.balance) <= 0;
  const iFrom = loan.interestFrom ? parseDate(loan.interestFrom) : null;
  const deferred = iFrom && !isNaN(iFrom) && iFrom > start;
  /* a loan can be described by what it costs a month or by how long it runs — the two are
     the same equation from either end, so entering one shows the other */
  const termMode = loan.payMode === "term";
  const derived = minPaymentOf(loan);
  const implied = monthsToPayoff(loan.balance, loan.apr, derived);
  return (<div className={"loan" + (paid ? " done" : "")}>
    <div className="loan-top"><span className={"rank" + (paid ? " paid" : "")}>{paid ? "PAID" : "#" + (rank || "—")}</span>
      <input className="rname" value={loan.name} onChange={(e) => onField(loan.id, "name", e.target.value)} aria-label="Loan name" />
      <button className="icon-btn" onClick={() => onRemove(loan.id)} aria-label="Remove"><Trash2 size={16} /></button></div>
    <div className="fields3">
      <NumField label="Balance" prefix="$" value={loan.balance} onChange={(v) => onBalance(loan.id, v)} />
      <NumField label="Rate" suffix="%" value={loan.apr} onChange={(v) => onField(loan.id, "apr", v)} />
      {termMode
        ? <NumField label="Term" suffix="mo" value={loan.termMonths} onChange={(v) => onField(loan.id, "termMonths", v)} />
        : <NumField label="Min / mo" prefix="$" value={loan.minPayment} onChange={(v) => onField(loan.id, "minPayment", v)} />}</div>
    {!paid && (<div className="loan-foot">
      <Seg value={termMode ? "term" : "payment"} options={[{ v: "payment", label: "by payment" }, { v: "term", label: "by term" }]} onChange={(v) => onField(loan.id, "payMode", v)} />
      {termMode
        ? <span className="payoff-badge">minimum <b>{fmtMoney(derived)}</b>/mo</span>
        : implied == null
          ? <span className="payoff-badge" style={{ color: "var(--red)" }}>never clears at this minimum</span>
          : <span className="payoff-badge">runs <b>{fmtDur(implied)}</b> at this minimum</span>}
    </div>)}
    <div className="loan-foot">
      {paid ? <span className="payoff-badge paid"><Check size={12} style={{ verticalAlign: -2, marginRight: 4 }} />Cleared</span>
        : payoffMonth != null ? <span className="payoff-badge">Clears <b>{fmtDate(addMonths(start, payoffMonth))}</b></span>
          : <span className="payoff-badge">Not cleared in 40 years</span>}
      <span className="endwrap" style={{ marginLeft: "auto" }}>
        <span className="cap">{deferred ? "deferred until" : "interest from"}</span>
        <input type="date" value={loan.interestFrom || ""} onChange={(e) => onField(loan.id, "interestFrom", e.target.value)}
          aria-label="Interest starts" title="Interest accrues from this date. Push it forward for a subsidised loan in deferment." />
        {deferred ? <span className="badge">no interest yet</span> : null}
      </span>
      {hasPayments && <span>from ${Math.round(n0(loan.originalBalance)).toLocaleString()}</span>}</div></div>);
}
export const EndDate = ({ value, onChange }) => (
  <span className={"endwrap" + (value ? "" : " off")}>
    <span className="cap">ends</span>
    <input type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} aria-label="Ends (optional)" title="Optional — leave blank to run forever" />
    {value ? <button className="icon-btn" onClick={() => onChange("")} aria-label="Clear end date"><X size={13} /></button> : null}
  </span>
);
export const Tip = ({ active, payload, label, start, rows }) => {
  if (!active || !payload || !payload.length) return null;
  const d = addDays(start, label * 7);
  return (<div className="tt"><div className="tt-m">{d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
    {rows.map((r, i) => { const p = payload.find((x) => x.dataKey === r.key); return p ? (
      <div className="tt-row" key={i}><span className="dot" style={{ background: r.color }} />{r.name}<b>{fmtMoney(p.value)}</b></div>) : null; })}</div>);
};
export const MultiTip = ({ active, payload, label, start, names }) => {
  if (!active || !payload || !payload.length) return null;
  const d = addDays(start, label * 7);
  const sorted = [...payload].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 8);
  return (<div className="tt"><div className="tt-m">{d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
    {sorted.map((p, i) => (<div className="tt-row" key={i}><span className="dot" style={{ background: p.stroke || p.color }} />{names[p.dataKey] || p.dataKey}<b>{fmtBig(p.value)}</b></div>))}</div>);
};
