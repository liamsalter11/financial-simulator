// Debt tab: payoff progress, balance-decay projection, and manual payment log.
const {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} = Recharts;
import { AlertTriangle, Plus, Trash2 } from "../icons.js";
import { Stat, LoanCard, Tip } from "../components.js";
import { fmtMoney, fmtBig, fmtDate, fmtDur, n0 } from "../format.js";
import { sampleRange } from "../useScope.js";

export function DebtTab({
  D, chart, scDebt, debts, debtPayments, payments,
  hasPay, upDebtField, upDebtBal, rmDebt, addDebt,
  logLoan, setLogLoan, logAmt, setLogAmt, logDate, setLogDate, addPayment, rmPayment, nameOf,
}) {
  const { ranges, ZHINT, axisProps, yProps, w2date, start, maxW } = chart;
            const noDebt = D.totalLoans <= 0;
            const covers = D.mDp > D.monthlyInterest + 1e-9;
            const rankMap = {}; D.loans.filter((l) => n0(l.balance) > 0).sort((a, b) => n0(b.apr) - n0(a.apr) || n0(a.balance) - n0(b.balance)).forEach((l, i) => rankMap[l.id] = i + 1);
            const origTotal = debts.reduce((s, l) => s + Math.max(n0(l.originalBalance), n0(l.balance)), 0);
            const paidDown = Math.max(0, origTotal - D.totalDebt);
            const pct = origTotal > 0 ? Math.min(100, paidDown / origTotal * 100) : 0;
            const paidToDate = payments.reduce((s, p) => s + n0(p.amount), 0);
            const w2m = (w) => Math.round(w / 4.348);
            return (
              <>
                {!noDebt && (
                  <div className="sgrid rise" style={{ marginBottom: 16 }}>
                    <Stat k="Debt-free<br/>date" v={D.sim.debtFree != null ? fmtDate(w2date(D.sim.debtFree)) : "40y+"} accent="amber" />
                    <Stat k="Total interest<br/>you'll pay" v={fmtBig(D.sim.interest)} />
                    <Stat k="Interest saved<br/>vs minimums" v={fmtBig(D.interestSaved)} accent="green" />
                    <Stat k="Time saved<br/>vs minimums" v={fmtDur(w2m(D.wksSaved))} accent="green" />
                  </div>
                )}
                {noDebt && <div className="panel rise"><div className="empty" style={{ color: "var(--green)", fontSize: 14 }}>No active debt — nicely done.<br />Add a loan below to model one.</div></div>}

                {!covers && !noDebt && (
                  <div className="warn rise"><AlertTriangle size={18} color="var(--red)" style={{ flex: "none", marginTop: 1 }} />
                    <div><div className="wt">Payments don't cover interest</div><div className="wb">You're paying {fmtMoney(D.mDp)}/mo against {fmtMoney(D.monthlyInterest)}/mo of interest, so balances grow. Raise a payment in Cash flow.</div></div></div>
                )}

                {!noDebt && (
                  <div className="panel rise">
                    <div className="phead"><div className="ptitle">Balance decay</div>{ranges(scDebt, maxW)}</div>
                    <div className="scope-wrap" ref={scDebt.ref} {...scDebt.handlers}>
                      <ResponsiveContainer width="100%" height={278}>
                        <ComposedChart data={sampleRange(D.debtCurve, scDebt.lo, scDebt.hi, 320)} margin={{ top: 14, right: 12, bottom: 0, left: 6 }}>
                          <defs><linearGradient id="planFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F5A623" stopOpacity={0.28} /><stop offset="100%" stopColor="#F5A623" stopOpacity={0} /></linearGradient></defs>
                          <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" />
                          <XAxis {...axisProps(scDebt)} />
                          <YAxis {...yProps} />
                          <Tooltip content={(p) => <Tip {...p} start={start} rows={[{ key: "plan", name: "Your payments", color: "var(--amber)" }, { key: "min", name: "Minimums only", color: "var(--cyan)" }]} />} cursor={{ stroke: "var(--line2)" }} />
                          {D.sim.debtFree != null && <ReferenceLine x={D.sim.debtFree} stroke="var(--amber)" strokeDasharray="3 3" label={{ value: "DEBT-FREE", position: "top", fill: "var(--amber)", fontSize: 9.5, fontFamily: "var(--mono)" }} />}
                          <Area type="monotone" dataKey="plan" stroke="var(--amber)" strokeWidth={2.5} fill="url(#planFill)" dot={false} activeDot={{ r: 4, fill: "var(--amber)", stroke: "none" }} isAnimationActive={false} />
                          <Line type="monotone" dataKey="min" stroke="var(--cyan)" strokeWidth={1.6} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    {ZHINT}
                    <div className="legend" style={{ marginTop: 8 }}>
                      <span className="lg"><span className="swatch" style={{ borderTopColor: "var(--amber)", borderTopWidth: 3 }} />Your actual payments</span>
                      <span className="lg"><span className="swatch" style={{ borderTopColor: "var(--cyan)", borderTopStyle: "dashed" }} />Minimums only</span>
                    </div>
                    <div className="assume">The amber line is driven by the payments you've set in Cash flow, extrapolated forward — {fmtMoney(D.mDp)}/mo across {debtPayments.length} payment{debtPayments.length === 1 ? "" : "s"}. Change them there and this moves.</div>
                  </div>
                )}

                <div className="panel rise">
                  <div className="phead"><div className="ptitle">Loans · payoff order</div><div className="psub">highest rate first</div></div>
                  {D.loans.map((l) => <LoanCard key={l.id} loan={l} rank={rankMap[l.id]} payoffMonth={D.sim.payoffWeek[l.id] != null ? w2m(D.sim.payoffWeek[l.id]) : null} start={start} hasPayments={hasPay(l.id)} onField={upDebtField} onBalance={upDebtBal} onRemove={rmDebt} />)}
                  <button className="btn btn-add" onClick={addDebt}><Plus size={15} />Add a loan</button>
                  <div className="assume">Minimum payment here is only used to draw the "minimums only" comparison line. What you actually pay is set in Cash flow.{D.cards.length > 0 ? " Credit cards are managed in Cash flow — they still count against your net worth." : ""} For a loan in deferment, set "interest starts" to when it kicks in — subsidised loans don't accrue while you're enrolled, unsubsidised ones do, so leave those blank.</div>
                </div>

                {!noDebt && (
                  <div className="panel rise">
                    <div className="phead"><div className="ptitle">Progress</div></div>
                    <div className="prog-nums"><div className="prog-pct">{pct.toFixed(1)}%</div><div className="prog-rem">{fmtMoney(paidDown)} paid down<br /><b>{fmtMoney(D.totalDebt)}</b> to go</div></div>
                    <div className="track"><div className="fill" style={{ width: pct + "%" }} /></div>
                    <div className="budget" style={{ marginTop: 10 }}>Logged payments to date: <b style={{ color: "var(--green)" }}>{fmtMoney(paidToDate)}</b></div>
                    <div className="modal-row">
                      <select value={logLoan} onChange={(e) => setLogLoan(e.target.value)} style={{ flex: "1 1 100%" }} aria-label="Loan"><option value="">Which loan?</option>{debts.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
                      <input type="number" inputMode="decimal" placeholder="$ amount" value={logAmt} onChange={(e) => setLogAmt(e.target.value)} aria-label="Amount" style={{ flex: 1, minWidth: 110 }} />
                      <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} aria-label="Date" />
                      <button className="btn btn-amber" style={{ flex: "1 1 100%", justifyContent: "center" }} onClick={addPayment}><Plus size={15} />Log payment</button>
                    </div>
                    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 2, maxHeight: 200, overflow: "auto" }}>
                      {payments.length === 0 ? <div className="empty">No payments logged yet.<br />Update each loan's balance from your statement to keep the forecast sharp.</div>
                        : payments.slice(0, 40).map((p) => (<div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", borderBottom: "1px solid var(--line)", fontFamily: "var(--mono)", fontSize: 12.5 }}>
                          <span style={{ color: "var(--faint)", fontSize: 11, width: 52 }}>{p.date?.slice(5)}</span><span style={{ color: "var(--muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nameOf(p.loanId)}</span>
                          <span style={{ color: "var(--green)", fontWeight: 600 }}>{fmtMoney(p.amount)}</span><button className="icon-btn" onClick={() => rmPayment(p.id)} aria-label="Delete"><Trash2 size={13} /></button></div>))}
                    </div>
                  </div>
                )}
              </>
  );
}
