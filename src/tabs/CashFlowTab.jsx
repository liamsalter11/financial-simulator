// Cash flow tab: income, expenses, credit cards, debt payments, and transfers — the
// dated flows that drive nearly the entire simulation.
const {
  ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} = Recharts;
import { Plus, Trash2, ArrowRight } from "../icons.js";
import { Stat, NumField, Seg, EndDate, Tip } from "../components.js";
import { fmtMoney, n0, num, OPY, parseDate, RECUR, recurLabel } from "../format.js";
import { payrollOf, bonusOf, perCheck } from "../payroll.js";
import { isCard } from "../seeds.js";
import { sampleRange } from "../useScope.js";

export function CashFlowTab({
  D, chart, scCF, income, accounts, expenses, debts, debtPayments, transfers,
  upInc, rmInc, addInc, addSplit, upSplit, rmSplit, addPreTax, upPreTax, rmPreTax,
  setMatch, upMatch, setBonus, upBonus, addChange, upChange, rmChange,
  upExp, rmExp, addExp, upDebtField, upDebtBal, rmDebt, addCardWithPayment,
  upDp, rmDp, addDp, upTr, rmTr, addTr,
}) {
  const { ranges, ZHINT, axisProps, yProps, start, maxW } = chart;
            const dp = Math.max(0, D.mDp), iv = Math.max(0, D.mTr), lo = Math.max(0, D.leftover);
            const segs = [
              { name: "Living costs", value: D.mExp, color: "#E8695B" },
              { name: "Debt payments", value: dp, color: "#B98CE8" },
              { name: "Investing", value: iv, color: "#5CCB8B" },
              { name: "Left in cash", value: lo, color: "#F5A623" },
            ].filter((s) => s.value > 0);
            const denom = Math.max(D.mInc, D.mExp + dp + iv + lo) || 1;
            return (
              <>
                <div className="sgrid rise" style={{ marginBottom: 16 }}>
                  <Stat k="Take-home<br/>per month" v={fmtMoney(D.mInc)} accent="green" />
                  <Stat k="Living<br/>expenses" v={fmtMoney(D.mExp)} accent="red" />
                  <Stat k={D.mPreTax > 0 ? "401k in<br/>(incl. match)" : "Surplus after<br/>living costs"} v={D.mPreTax > 0 ? fmtMoney(D.mPreTax) : fmtMoney(D.surplus)} accent={D.mPreTax > 0 ? "cyan" : (D.surplus >= 0 ? "amber" : "red")} />
                  <Stat k="Savings<br/>rate" v={Math.round(D.savingsRate) + "%"} accent="cyan" />
                </div>

                <div className="panel rise">
                  <div className="phead"><div className="ptitle">Cash flow, week by week</div>{ranges(scCF, Math.min(maxW, 312))}</div>
                  <div className="scope-wrap" ref={scCF.ref} {...scCF.handlers}>
                    <ResponsiveContainer width="100%" height={272}>
                      <ComposedChart data={sampleRange(D.cf, scCF.lo, scCF.hi, 320)} margin={{ top: 14, right: 12, bottom: 0, left: 6 }}>
                        <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" />
                        <XAxis {...axisProps(scCF)} />
                        <YAxis {...yProps} />
                        <Tooltip content={(p) => <Tip {...p} start={start} rows={[{ key: "income", name: "In", color: "var(--green)" }, { key: "spend", name: "Out", color: "var(--red)" }, { key: "net", name: "Net", color: "var(--violet)" }, { key: "smooth", name: "Monthly avg", color: "var(--amber)" }]} />} cursor={{ fill: "rgba(126,148,171,0.06)" }} />
                        <ReferenceLine y={0} stroke="var(--line2)" />
                        <Bar dataKey="net" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                          {sampleRange(D.cf, scCF.lo, scCF.hi, 320).map((e, i) => <Cell key={i} fill={e.net >= 0 ? "rgba(185,140,232,0.42)" : "rgba(232,105,91,0.5)"} />)}
                        </Bar>
                        <Line type="monotone" dataKey="income" stroke="var(--green)" strokeWidth={1.4} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="spend" stroke="var(--red)" strokeWidth={1.3} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="smooth" stroke="var(--amber)" strokeWidth={2.4} dot={false} isAnimationActive={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  {ZHINT}
                  <div className="legend" style={{ marginTop: 8 }}>
                    <span className="lg"><span className="swatch" style={{ borderTopColor: "var(--green)" }} />In</span>
                    <span className="lg"><span className="swatch" style={{ borderTopColor: "var(--red)" }} />Out</span>
                    <span className="lg"><span className="dot" style={{ background: "rgba(185,140,232,.7)" }} />Weekly net</span>
                    <span className="lg"><span className="swatch" style={{ borderTopColor: "var(--amber)", borderTopWidth: 3 }} />Monthly average</span>
                  </div>
                  <div className="assume">The amber line smooths the weekly spikes into a rolling monthly average — the trend underneath the paycheck-and-rent sawtooth.</div>
                </div>

                <div className="panel rise">
                  <div className="phead"><div className="ptitle">Where every dollar goes</div><div className="psub">typical month</div></div>
                  <div className="flowbar">{segs.map((s, i) => <div key={i} className="flowseg" style={{ width: (s.value / denom * 100) + "%", background: s.color }} title={s.name} />)}</div>
                  <div className="flowkey">{segs.map((s, i) => <span className="fk" key={i}><span className="dot" style={{ background: s.color }} />{s.name} <b>{fmtMoney(s.value)}</b> ({Math.round(s.value / denom * 100)}%)</span>)}</div>
                  {D.leftover < 0 && <div className="assume" style={{ color: "var(--red)" }}>Debt payments + investing exceed your surplus by {fmtMoney(-D.leftover)}/mo — cash will draw down over time.</div>}
                </div>

                <div className="panel rise">
                  <div className="phead"><div className="ptitle">Spending by category</div><div className="psub">{fmtMoney(D.mExp)}/mo</div></div>
                  {D.spend.length === 0 ? <div className="empty">No expenses yet.</div> : D.spend.map((e) => (
                    <div className="catrow" key={e.id}>
                      <div className="cattop"><span className="cn">{e.category}<span className="cp">{recurLabel(e.recur).toLowerCase()}</span></span><span className="cv">{fmtMoney(e.monthly)}/mo</span></div>
                      <div className="catbar"><div className="catfill" style={{ width: (D.mExp > 0 ? e.monthly / D.mExp * 100 : 0) + "%", background: e.color }} /></div>
                    </div>
                  ))}
                </div>

                <div className="panel rise">
                  <div className="phead"><div className="ptitle">Income</div><div className="psub">dated · split across accounts</div></div>
                  {income.map((inc) => {
                    const amt = n0(inc.amount); const dist = inc.dist || [];
                    let used = 0;
                    for (let i = 1; i < dist.length; i++) { const sp = dist[i]; const want = sp.mode === "amt" ? n0(sp.value) : amt * num(sp.value) / 100; used += Math.min(want, Math.max(0, amt - used)); }
                    const rest = Math.max(0, amt - used);
                    return (
                      <div className="card" key={inc.id}>
                        <div className="card-r1">
                          <input className="rname" value={inc.name} onChange={(e) => upInc(inc.id, "name", e.target.value)} aria-label="Income name" />
                          <div className="num-box sm"><span className="pfx">$</span><input className="num-input" type="number" inputMode="decimal" value={inc.amount} onChange={(e) => upInc(inc.id, "amount", e.target.value)} aria-label="Amount" style={{ color: "var(--green)" }} /></div>
                          <button className="icon-btn" onClick={() => rmInc(inc.id)} aria-label="Remove"><Trash2 size={16} /></button>
                        </div>
                        <div className="card-r2">
                          <input type="date" value={inc.date} onChange={(e) => upInc(inc.id, "date", e.target.value)} aria-label="Date" />
                          <select value={inc.recur} onChange={(e) => upInc(inc.id, "recur", e.target.value)} aria-label="Recurrence">{RECUR.map((r) => <option key={r.v} value={r.v}>{r.label}</option>)}</select>
                          <div className="num-box sm"><span className="pfx" style={{ fontSize: 11 }}>raise</span><input className="num-input" type="number" inputMode="decimal" value={inc.raise} onChange={(e) => upInc(inc.id, "raise", e.target.value)} aria-label="Annual raise" style={{ width: 42, color: "var(--text)" }} /><span className="pfx" style={{ fontSize: 11 }}>%/yr</span></div>
                          {inc.recur !== "once" && <EndDate value={inc.end} onChange={(v) => upInc(inc.id, "end", v)} />}
                        </div>
                        <label className="chk" style={{ marginTop: 10 }}>
                          <input type="checkbox" checked={!!inc.weekdayAdj} onChange={(e) => upInc(inc.id, "weekdayAdj", e.target.checked)} />
                          If payday lands on a weekend, pay the weekday before
                        </label>
                        <div className="dist">
                          <div className="dist-lbl"><span>Distribute into</span><span>{dist.length > 1 ? fmtMoney(used) + " assigned" : "all of it"}</span></div>
                          {dist.map((sp, idx) => (
                            <div className="dist-row" key={idx}>
                              <select value={sp.acctId} onChange={(e) => upSplit(inc.id, idx, "acctId", e.target.value)} aria-label="Account">{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                              {idx === 0 ? (<>
                                <span className="cap">remainder</span>
                                <span className="remain">{fmtMoney(rest)}</span>
                                <span style={{ width: 24 }} />
                              </>) : (<>
                                <Seg value={sp.mode || "pct"} options={[{ v: "pct", label: "%" }, { v: "amt", label: "$" }]} onChange={(v) => upSplit(inc.id, idx, "mode", v)} />
                                <div className="pctbox"><input type="number" inputMode="decimal" value={sp.value} onChange={(e) => upSplit(inc.id, idx, "value", e.target.value)} aria-label="Value" /><span className="u">{sp.mode === "amt" ? "$" : "%"}</span></div>
                                <button className="icon-btn" onClick={() => rmSplit(inc.id, idx)} aria-label="Remove split"><Trash2 size={14} /></button>
                              </>)}
                            </div>
                          ))}
                          <button className="dist-add" onClick={() => addSplit(inc.id)}>+ Send a cut to another account</button>
                        </div>
                        <div className="dist">
                          {(() => {
                            const pay = payrollOf(inc);
                            const perYear = OPY[inc.recur] || 0;
                            const withheld = pay.gross > 0 ? pay.gross - n0(inc.amount) - pay.employee : 0;
                            const effRate = pay.gross > 0 ? (withheld / pay.gross) * 100 : 0;
                            return (<>
                              <div className="dist-lbl"><span>Payroll deductions (not in take-home)</span><span>{fmtMoney(pay.total)} / paycheck</span></div>
                              <div className="dist-row">
                                <span className="cap" style={{ flex: 1, minWidth: 80 }}>Gross salary</span>
                                <Seg value={inc.grossMode === "paycheck" ? "paycheck" : "year"} options={[{ v: "year", label: "per year" }, { v: "paycheck", label: "per check" }]} onChange={(v) => upInc(inc.id, "grossMode", v)} />
                                <div className="pctbox" style={{ width: 112 }}><span className="u" style={{ marginLeft: 0, marginRight: 3 }}>$</span><input type="number" inputMode="decimal" value={inc.gross == null ? "" : inc.gross} onChange={(e) => upInc(inc.id, "gross", e.target.value)} aria-label="Gross salary" /></div>
                              </div>
                              {pay.gross > 0 && <div className="caphint" style={{ marginTop: -2, marginBottom: 8 }}>
                                {fmtMoney(pay.gross * perYear)}/yr gross = {fmtMoney(pay.gross)} per paycheck across {Math.round(perYear)} paychecks · take-home {fmtMoney(n0(inc.amount) * perYear)}/yr
                                {withheld > 0 ? ` · implies ${fmtMoney(withheld)}/paycheck withheld for tax and benefits (${effRate.toFixed(0)}%)` : ""}
                                {withheld < 0 ? " · take-home plus deductions exceeds gross — one of these numbers is off" : ""}
                              </div>}
                              {pay.rows.map((pt) => (
                                <div className="dist-row" key={pt.id}>
                                  <input type="text" value={pt.name} onChange={(e) => upPreTax(inc.id, pt.id, "name", e.target.value)} aria-label="Deduction name" style={{ flex: 1, minWidth: 90 }} />
                                  <Seg value={pt.mode} options={[{ v: "pct", label: "%" }, { v: "amt", label: "$" }]} onChange={(v) => upPreTax(inc.id, pt.id, "mode", v)} />
                                  <div className="pctbox"><input type="number" inputMode="decimal" value={pt.value} onChange={(e) => upPreTax(inc.id, pt.id, "value", e.target.value)} aria-label="Value" /><span className="u">{pt.mode === "pct" ? "%" : "$"}</span></div>
                                  <select value={pt.toAcct} onChange={(e) => upPreTax(inc.id, pt.id, "toAcct", e.target.value)} aria-label="Into account" style={{ flex: 1, minWidth: 90 }}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                                  <button className="icon-btn" onClick={() => rmPreTax(inc.id, pt.id)} aria-label="Remove"><Trash2 size={14} /></button>
                                  {pt.mode === "pct" && pay.gross > 0 && <div className="caphint">{num(pt.value)}% of {fmtMoney(pay.gross)} = <b style={{ color: "var(--green)" }}>{fmtMoney(pt.amount)}</b> per paycheck, {fmtMoney(pt.amount * perYear)}/yr</div>}
                                </div>
                              ))}
                              <button className="dist-add" onClick={() => addPreTax(inc.id)}>+ Add a contribution</button>

                              <div className="dist-lbl" style={{ marginTop: 12 }}><span>Employer match</span>
                                <label className="chk"><input type="checkbox" checked={!!inc.match} onChange={(e) => setMatch(inc.id, e.target.checked)} />offered</label>
                              </div>
                              {inc.match && (<>
                                <div className="dist-row">
                                  <div className="pctbox"><input type="number" inputMode="decimal" value={inc.match.rate} onChange={(e) => upMatch(inc.id, "rate", e.target.value)} aria-label="Match rate" /><span className="u">%</span></div>
                                  <span className="cap">of what you put in, up to</span>
                                  <div className="pctbox"><input type="number" inputMode="decimal" value={inc.match.limit} onChange={(e) => upMatch(inc.id, "limit", e.target.value)} aria-label="Match limit" /><span className="u">%</span></div>
                                  <span className="cap">of gross</span>
                                </div>
                                <div className="dist-row">
                                  <span className="cap" style={{ flex: 1 }}>Match lands in</span>
                                  <select value={inc.match.toAcct} onChange={(e) => upMatch(inc.id, "toAcct", e.target.value)} aria-label="Match account" style={{ flex: 1, minWidth: 110 }}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                                </div>
                                <div className={"caphint" + (pay.gross > 0 && pay.matchable < pay.gross * num(inc.match.limit) / 100 - 0.01 ? " warn-txt" : "")}>
                                  {(() => {
                                    if (!(pay.gross > 0)) return "Enter gross pay above for the match to compute.";
                                    const ceiling = pay.gross * num(inc.match.limit) / 100;
                                    const unclaimed = Math.max(0, ceiling - pay.matchable) * n0(inc.match.rate) / 100;
                                    return (<>Adds <b style={{ color: "var(--green)" }}>{fmtMoney(pay.match)}</b> per paycheck ({fmtMoney(pay.match * perYear)}/yr).
                                      {unclaimed > 0.01
                                        ? ` You're contributing below the ${num(inc.match.limit)}% threshold — that leaves ${fmtMoney(unclaimed * perYear)}/yr of match unclaimed.`
                                        : ` You're contributing enough to capture the full match.`}</>);
                                  })()}
                                </div>
                              </>)}
                              <div className="caphint" style={{ marginTop: 8 }}>Money withheld from gross never shows up in take-home, so it belongs here rather than as a transfer. Percentages track your salary as the raise above compounds.</div>

                              <div className="dist-lbl" style={{ marginTop: 14 }}><span>Annual bonus</span>
                                <label className="chk"><input type="checkbox" checked={!!inc.bonus} onChange={(e) => setBonus(inc.id, e.target.checked)} />paid</label>
                              </div>
                              {inc.bonus && (() => {
                                const b = bonusOf(inc, 1);
                                return (<>
                                  <div className="dist-row">
                                    <Seg value={inc.bonus.mode === "amt" ? "amt" : "pct"} options={[{ v: "pct", label: "% of salary" }, { v: "amt", label: "$" }]} onChange={(v) => upBonus(inc.id, "mode", v)} />
                                    <div className="pctbox"><input type="number" inputMode="decimal" value={inc.bonus.value} onChange={(e) => upBonus(inc.id, "value", e.target.value)} aria-label="Bonus value" /><span className="u">{inc.bonus.mode === "amt" ? "$" : "%"}</span></div>
                                    <span className="cap">paid each</span>
                                    <input type="date" value={inc.bonus.date} onChange={(e) => upBonus(inc.id, "date", e.target.value)} aria-label="Bonus date" />
                                  </div>
                                  <div className="dist-row">
                                    <span className="cap" style={{ flex: 1, minWidth: 80 }}>Withheld for tax</span>
                                    <div className="pctbox"><input type="number" inputMode="decimal" value={inc.bonus.withhold} onChange={(e) => upBonus(inc.id, "withhold", e.target.value)} aria-label="Bonus withholding" /><span className="u">%</span></div>
                                    <label className="chk"><input type="checkbox" checked={inc.bonus.preTaxApplies !== false} onChange={(e) => upBonus(inc.id, "preTaxApplies", e.target.checked)} />401k applies</label>
                                  </div>
                                  {b && b.gross > 0 && <div className="caphint">
                                    {inc.bonus.mode === "pct" ? `${num(inc.bonus.value)}% of ${fmtMoney(pay.gross * perYear)} = ` : ""}<b style={{ color: "var(--green)" }}>{fmtMoney(b.gross)}</b> gross each year
                                    {b.deferral > 0 ? ` · ${fmtMoney(b.deferral)} to 401k${b.match > 0 ? ` + ${fmtMoney(b.match)} matched` : ""}` : ""}
                                    {b.withheld > 0 ? ` · ${fmtMoney(b.withheld)} withheld` : ""}
                                    {` · `}<b style={{ color: "var(--amber)" }}>{fmtMoney(b.net)}</b> lands in your account
                                  </div>}
                                  <div className="caphint">Grows with your raise, since it's a share of salary. Bonuses are usually withheld at a flat supplemental rate plus payroll tax rather than your normal rate — check a past stub and adjust. It arrives through the same account split as your paycheck, so a cap on that account will sweep the excess onward.</div>
                                </>);
                              })()}

                              <div className="dist-lbl" style={{ marginTop: 14 }}><span>Promotions & salary changes</span>
                                <span>{(inc.changes || []).length ? (inc.changes || []).length + " planned" : "none"}</span>
                              </div>
                              {(inc.changes || []).slice().sort((a, b) => parseDate(a.date) - parseDate(b.date)).map((ch) => {
                                const gpc = perCheck(ch.gross, ch.grossMode || inc.grossMode, inc.recur);
                                const takeHome = n0(ch.amount) * perYear;
                                const annual = gpc * perYear;
                                const defer = (inc.preTax || []).reduce((s, pt) => s + (pt.mode === "pct" ? gpc * num(pt.value) / 100 : n0(pt.value)), 0) * perYear;
                                const held = annual - takeHome - defer;
                                const rate = annual > 0 ? (held / annual) * 100 : 0;
                                const curRate = pay.gross > 0 ? withheld * perYear / (pay.gross * perYear) * 100 : 0;
                                const odd = annual > 0 && (rate < curRate - 6 || rate > curRate + 12);
                                return (
                                  <div className="card" key={ch.id} style={{ background: "var(--bg)", marginBottom: 8 }}>
                                    <div className="card-r2">
                                      <input type="text" value={ch.label} onChange={(e) => upChange(inc.id, ch.id, "label", e.target.value)} aria-label="Label" style={{ flex: 1, minWidth: 90 }} />
                                      <span className="cap">from</span>
                                      <input type="date" value={ch.date} onChange={(e) => upChange(inc.id, ch.id, "date", e.target.value)} aria-label="Effective date" />
                                      <button className="icon-btn" onClick={() => rmChange(inc.id, ch.id)} aria-label="Remove"><Trash2 size={14} /></button>
                                    </div>
                                    <div className="card-r2" style={{ marginTop: 8 }}>
                                      <span className="cap">salary</span>
                                      <div className="pctbox" style={{ width: 108 }}><span className="u" style={{ marginLeft: 0, marginRight: 3 }}>$</span><input type="number" inputMode="decimal" value={ch.gross} onChange={(e) => upChange(inc.id, ch.id, "gross", e.target.value)} aria-label="New salary" /></div>
                                      <span className="cap">take-home / check</span>
                                      <div className="pctbox" style={{ width: 96 }}><span className="u" style={{ marginLeft: 0, marginRight: 3 }}>$</span><input type="number" inputMode="decimal" value={ch.amount} onChange={(e) => upChange(inc.id, ch.id, "amount", e.target.value)} aria-label="New take-home" /></div>
                                    </div>
                                    {annual > 0 && <div className={"caphint" + (odd ? " warn-txt" : "")}>
                                      {fmtMoney(annual)}/yr gross → {fmtMoney(gpc)}/check · take-home {fmtMoney(n0(ch.amount))}/check ({fmtMoney(takeHome)}/yr) · implies {rate.toFixed(1)}% withheld
                                      {odd ? ` — your current rate is ${curRate.toFixed(1)}%, so double-check the take-home figure.` : ` vs ${curRate.toFixed(1)}% today, which tracks.`}
                                    </div>}
                                  </div>
                                );
                              })}
                              <button className="dist-add" onClick={() => addChange(inc.id)}>+ Add a promotion or salary change</button>
                              <div className="caphint">Salary steps to the new figure on that date and the raise percentage compounds from there. Your baseline stays intact, so you can compare with the change removed.</div>
                            </>);
                          })()}
                        </div>
                      </div>
                    );
                  })}
                  <button className="btn btn-add" onClick={addInc}><Plus size={15} />Add income source</button>
                  <div className="assume">The top account is the remainder — it receives whatever the others don't take.</div>
                </div>

                <div className="panel rise">
                  <div className="phead"><div className="ptitle">Expenses</div><div className="psub">dated · drawn from an account</div></div>
                  {expenses.map((ex) => (
                    <div className="card" key={ex.id}>
                      <div className="card-r1">
                        <input className="rname" value={ex.category} onChange={(e) => upExp(ex.id, "category", e.target.value)} aria-label="Category" />
                        <div className="num-box sm"><span className="pfx">$</span><input className="num-input" type="number" inputMode="decimal" value={ex.amount} onChange={(e) => upExp(ex.id, "amount", e.target.value)} aria-label="Amount" style={{ color: "var(--red)" }} /></div>
                        <button className="icon-btn" onClick={() => rmExp(ex.id)} aria-label="Remove"><Trash2 size={16} /></button>
                      </div>
                      <div className="card-r2">
                        <input type="date" value={ex.date} onChange={(e) => upExp(ex.id, "date", e.target.value)} aria-label="Date" />
                        <select value={ex.recur} onChange={(e) => upExp(ex.id, "recur", e.target.value)} aria-label="Recurrence">{RECUR.map((r) => <option key={r.v} value={r.v}>{r.label}</option>)}</select>
                        <span className="cap">paid with</span>
                        <select value={ex.fromAcct} onChange={(e) => upExp(ex.id, "fromAcct", e.target.value)} aria-label="Paid with">
                          <optgroup label="Accounts">{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>
                          {D.cards.length > 0 && <optgroup label="Credit cards">{D.cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>}
                        </select>
                        {ex.recur !== "once" && <EndDate value={ex.end} onChange={(v) => upExp(ex.id, "end", v)} />}
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-add" onClick={addExp}><Plus size={15} />Add expense</button>
                </div>

                <div className="panel rise">
                  <div className="phead"><div className="ptitle">Credit cards</div><div className="psub">charges land here, payments clear them</div></div>
                  {D.cards.length === 0 && <div className="empty">No cards yet.<br />Add one, then set individual purchases to "paid with" that card.</div>}
                  {D.cards.map((c) => {
                    const np = D.nextCardPay[c.id];
                    const monthlyCharges = D.chargedTo(c.id);
                    return (
                      <div className="cardrow" key={c.id}>
                        <span className="badge">Card</span>
                        <input className="rname" value={c.name} onChange={(e) => upDebtField(c.id, "name", e.target.value)} aria-label="Card name" />
                        <NumField cls="ramt" label="Balance owed" prefix="$" value={c.balance} onChange={(v) => upDebtBal(c.id, v)} />
                        <NumField cls="rrate" label="APR" suffix="%" value={c.apr} onChange={(v) => upDebtField(c.id, "apr", v)} />
                        <button className="icon-btn" onClick={() => rmDebt(c.id)} aria-label="Remove"><Trash2 size={16} /></button>
                        <div className="cardbal">
                          <span>{fmtMoney(monthlyCharges)}/mo charged to it</span>
                          {np ? <span>next payment {np.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · <b>{fmtMoney(np.amount)}</b>{np.full ? " (in full)" : ""}</span>
                            : <span style={{ color: "var(--red)" }}>no payment set — this balance will just grow</span>}
                        </div>
                      </div>
                    );
                  })}
                  <button className="btn btn-add" onClick={addCardWithPayment}><Plus size={15} />Add a credit card</button>
                  <div className="assume">Interest only applies to a balance you carry past a payment — pay in full and the card costs nothing. Charges show up in "Spending by category" above, so itemising a card gets your whole picture in one place.</div>
                </div>

                <div className="panel rise">
                  <div className="phead"><div className="ptitle">Payments into debt & cards</div><div className="psub">{fmtMoney(D.mDp)}/mo</div></div>
                  {debtPayments.length === 0 && <div className="empty">No payments yet.<br />Add your regular monthly payments below.</div>}
                  {debtPayments.map((p) => {
                    const tgt = debts.find((x) => x.id === p.toDebt);
                    const cardTarget = isCard(tgt);
                    return (
                      <div className="card" key={p.id}>
                        <div className="card-r1">
                          <input className="rname" value={p.name} onChange={(e) => upDp(p.id, "name", e.target.value)} aria-label="Payment name" />
                          {cardTarget && p.payFull
                            ? <span className="cap" style={{ color: "var(--violet)" }}>statement in full</span>
                            : <div className="num-box sm"><span className="pfx">$</span><input className="num-input" type="number" inputMode="decimal" value={p.amount} onChange={(e) => upDp(p.id, "amount", e.target.value)} aria-label="Amount" style={{ color: "var(--violet)" }} /></div>}
                          <button className="icon-btn" onClick={() => rmDp(p.id)} aria-label="Remove"><Trash2 size={16} /></button>
                        </div>
                        <div className="card-r2">
                          <input type="date" value={p.date} onChange={(e) => upDp(p.id, "date", e.target.value)} aria-label="Date" />
                          <select value={p.recur} onChange={(e) => upDp(p.id, "recur", e.target.value)} aria-label="Recurrence">{RECUR.map((r) => <option key={r.v} value={r.v}>{r.label}</option>)}</select>
                          <select value={p.fromAcct} onChange={(e) => upDp(p.id, "fromAcct", e.target.value)} aria-label="From account">{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                          <span className="arrow"><ArrowRight size={14} /></span>
                          <select value={p.toDebt} onChange={(e) => upDp(p.id, "toDebt", e.target.value)} aria-label="To debt">
                            {D.loans.length > 0 && <optgroup label="Loans">{D.loans.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</optgroup>}
                            {D.cards.length > 0 && <optgroup label="Credit cards">{D.cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>}
                          </select>
                          {p.recur !== "once" && <EndDate value={p.end} onChange={(v) => upDp(p.id, "end", v)} />}
                        </div>
                        {cardTarget && (
                          <label className="chk" style={{ marginTop: 10 }}>
                            <input type="checkbox" checked={!!p.payFull} onChange={(e) => upDp(p.id, "payFull", e.target.checked)} />
                            Pay the whole balance every time (no interest)
                          </label>
                        )}
                      </div>
                    );
                  })}
                  <div className="modal-row" style={{ marginTop: 4 }}>
                    <button className="btn btn-add" style={{ flex: 1 }} onClick={() => addDp("monthly")}><Plus size={15} />Recurring payment</button>
                    <button className="btn btn-add" style={{ flex: 1 }} onClick={() => addDp("once")}><Plus size={15} />One-time extra</button>
                  </div>
                  {D.loansNoPayment.length > 0 && (
                    <div className="assume" style={{ color: "var(--red)" }}>
                      No payment is set for: {D.loansNoPayment.map((l) => l.name).join(", ")}. Those balances just accrue interest until another loan clears and the rollover reaches them.
                    </div>
                  )}
                  <div className="assume">Once a loan is cleared, anything still aimed at it rolls onto your highest-rate remaining loan automatically. Card payments never roll over.</div>
                </div>

                <div className="panel rise">
                  <div className="phead"><div className="ptitle">Transfers between accounts</div><div className="psub">{fmtMoney(D.mTr)}/mo</div></div>
                  {transfers.length === 0 && <div className="empty">No transfers yet.<br />Add one to route cash into savings or investments.</div>}
                  {transfers.map((tr) => (
                    <div className="card" key={tr.id}>
                      <div className="card-r1">
                        <input className="rname" value={tr.name} onChange={(e) => upTr(tr.id, "name", e.target.value)} aria-label="Transfer name" />
                        <div className="num-box sm"><span className="pfx">$</span><input className="num-input" type="number" inputMode="decimal" value={tr.amount} onChange={(e) => upTr(tr.id, "amount", e.target.value)} aria-label="Amount" style={{ color: "var(--green)" }} /></div>
                        <button className="icon-btn" onClick={() => rmTr(tr.id)} aria-label="Remove"><Trash2 size={16} /></button>
                      </div>
                      <div className="card-r2">
                        <input type="date" value={tr.date} onChange={(e) => upTr(tr.id, "date", e.target.value)} aria-label="Date" />
                        <select value={tr.recur} onChange={(e) => upTr(tr.id, "recur", e.target.value)} aria-label="Recurrence">{RECUR.map((r) => <option key={r.v} value={r.v}>{r.label}</option>)}</select>
                        <select value={tr.fromAcct} onChange={(e) => upTr(tr.id, "fromAcct", e.target.value)} aria-label="From">{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                        <span className="arrow"><ArrowRight size={14} /></span>
                        <select value={tr.toAcct} onChange={(e) => upTr(tr.id, "toAcct", e.target.value)} aria-label="To">{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                        {tr.recur !== "once" && <EndDate value={tr.end} onChange={(v) => upTr(tr.id, "end", v)} />}
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-add" onClick={addTr}><Plus size={15} />Add a transfer</button>
                </div>
              </>
  );
}
