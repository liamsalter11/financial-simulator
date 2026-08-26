// Read-only summary tab: net worth, warnings, and the three headline charts.
const {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} = Recharts;
import { AlertTriangle } from "../icons.js";
import { Stat, NumField, Donut, Tip, MultiTip } from "../components.js";
import { fmtMoney, fmtBig, fmtDate, fmtDur, n0 } from "../format.js";
import { sampleRange } from "../useScope.js";

/* "3y 2mo sooner" / "5mo later" for a milestone that moves between the two scenarios.
   Either side can be null, meaning the milestone never arrives inside the 40-year run. */
function milestoneShift(label, weekWith, weekWithout) {
  if (weekWith == null && weekWithout == null) return null;
  if (weekWith != null && weekWithout == null) return `brings ${label} inside 40 years`;
  if (weekWith == null && weekWithout != null) return `pushes ${label} beyond 40 years`;
  const wks = weekWithout - weekWith;
  if (Math.abs(wks) < 1) return null;
  return `${label} ${fmtDur(Math.max(1, Math.round(Math.abs(wks) * 12 / 52.1775)))} ${wks > 0 ? "sooner" : "later"}`;
}

export function OverviewTab({ D, accounts, debts, chart, scNW, scBal, fireN, settings, setS }) {
  const { ranges, ZHINT, axisProps, yProps, w2date, start, maxW } = chart;
  const gap = D.hasHypo ? D.nwGapAt(scNW.hi) : 0;
  const shifts = D.hasHypo ? [
    milestoneShift("financial independence", D.simWith.fire, D.simWithout.fire),
    milestoneShift("debt-free", D.simWith.debtFree, D.simWithout.debtFree),
  ].filter(Boolean) : [];
  return (
            <>
              <div className="sgrid wide5 rise" style={{ marginBottom: 16 }}>
                <Stat k="Net worth<br/>today" v={fmtBig(D.netWorth)} accent={D.netWorth >= 0 ? "green" : "red"} />
                <Stat k="Monthly<br/>surplus" v={fmtMoney(D.surplus)} accent={D.surplus >= 0 ? "" : "red"} />
                <Stat k="Cash runway<br/>(no income)" v={D.runway == null ? "—" : fmtDur(Math.round(D.runway))} accent={D.runway != null && D.runway < 3 ? "red" : "cyan"} />
                <Stat k="Debt-free<br/>date" v={D.totalDebt > 0 ? (D.sim.debtFree != null ? fmtDate(w2date(D.sim.debtFree)) : "40y+") : "Clear"} accent="amber" />
                <Stat k="Financial indep.<br/>(25× expenses)" v={D.sim.fire != null ? fmtDate(w2date(D.sim.fire)) : "40y+"} accent="green" />
              </div>

              {D.surplus < 0 && (
                <div className="warn rise"><AlertTriangle size={18} color="var(--red)" style={{ flex: "none", marginTop: 1 }} />
                  <div><div className="wt">Spending exceeds income</div><div className="wb">You're {fmtMoney(-D.surplus)}/mo in the red before debt or investing. Adjust items in Cash flow.</div></div></div>
              )}
              {D.runway != null && D.runway < 3 && (
                <div className="warn rise"><AlertTriangle size={18} color="var(--red)" style={{ flex: "none", marginTop: 1 }} />
                  <div><div className="wt">Thin cash runway</div><div className="wb">Your cash and savings cover {fmtDur(Math.round(D.runway))} of spending with no income at all — {fmtMoney(D.liquid)} against {fmtMoney(D.mExp)}/mo. Three to six months is the usual floor before investing harder.</div></div></div>
              )}
              {!(D.surplus < 0) && D.negAcct && (
                <div className="warn rise"><AlertTriangle size={18} color="var(--red)" style={{ flex: "none", marginTop: 1 }} />
                  <div><div className="wt">{D.negAcct} runs dry</div><div className="wb">With these dated flows, {D.negAcct} goes negative at some point. Route more income into it, or draw some expenses or payments from another account.</div></div></div>
              )}

              <div className="panel rise">
                <div className="phead"><div className="ptitle">Net worth projection</div>{ranges(scNW, maxW)}</div>
                <div className="scope-wrap" ref={scNW.ref} {...scNW.handlers}>
                  <ResponsiveContainer width="100%" height={286}>
                    <ComposedChart data={sampleRange(D.viewSeries, scNW.lo, scNW.hi, 320).map((s) => ({ w: s.w, nw: s.nw, debt: s.debt, invest: s.invest, fi: s.fi }))} margin={{ top: 16, right: 12, bottom: 0, left: 6 }}>
                      <defs><linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F5A623" stopOpacity={0.26} /><stop offset="100%" stopColor="#F5A623" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" />
                      <XAxis {...axisProps(scNW)} />
                      <YAxis {...yProps} />
                      <Tooltip content={(p) => <Tip {...p} start={start} rows={[{ key: "nw", name: "Net worth", color: "var(--amber)" }, { key: "invest", name: "Investments", color: "var(--green)" }, { key: "debt", name: "Debt", color: "var(--red)" }]} />} cursor={{ stroke: "var(--line2)" }} />
                      {/* in future dollars the target climbs with everything else, so it's a line rather than a level */}
                      {fireN > 0 && D.sim.fire != null && !D.showNom && <ReferenceLine y={fireN} stroke="var(--amber)" strokeDasharray="3 3" label={{ value: "FI " + fmtBig(fireN), position: "insideTopRight", fill: "var(--amber)", fontSize: 9.5, fontFamily: "var(--mono)" }} />}
                      {fireN > 0 && D.showNom && <Line type="monotone" dataKey="fi" stroke="var(--amber)" strokeWidth={1.2} strokeDasharray="3 3" dot={false} isAnimationActive={false} />}
                      {D.sim.debtFree != null && <ReferenceLine x={D.sim.debtFree} stroke="var(--red)" strokeDasharray="2 3" strokeOpacity={0.6} label={{ value: "DEBT-FREE", position: "top", fill: "var(--red)", fontSize: 9, fontFamily: "var(--mono)" }} />}
                      <Area type="monotone" dataKey="nw" stroke="var(--amber)" strokeWidth={2.6} fill="url(#nwFill)" dot={false} activeDot={{ r: 4, fill: "var(--amber)", stroke: "none" }} isAnimationActive={false} />
                      <Line type="monotone" dataKey="invest" stroke="var(--green)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="debt" stroke="var(--red)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                {ZHINT}
                <div className="hypo">
                  <label className="switch">
                    <input type="checkbox" checked={settings.hypotheticals !== false} onChange={(e) => setS("hypotheticals", e.target.checked)} />
                    <span className="swtrack"><span className="swknob" /></span>
                    <span className="sw-label">Include future promotions</span>
                  </label>
                  {D.hasHypo ? (
                    <div className="caphint" style={{ marginTop: 8 }}>
                      {gap >= 0 ? "Your planned promotions add " : "Your planned salary changes cost "}
                      <b style={{ color: gap >= 0 ? "var(--green)" : "var(--red)" }}>{fmtMoney(Math.abs(gap))}</b> of net worth by {fmtDate(w2date(scNW.hi))}
                      {shifts.length > 0 ? ` · ${shifts.join(" · ")}` : ""}.
                      {" "}{settings.hypotheticals !== false
                        ? "Switch them off to see the same plan on today's salary."
                        : "Currently projecting on today's salary, with them excluded."}
                      {" "}Every chart and date on every tab follows this toggle.
                    </div>
                  ) : (
                    <div className="caphint" style={{ marginTop: 8 }}>
                      No promotions planned yet. Add one under Cash flow → Income → “Promotions &amp; salary changes”, and this will show what it's worth.
                    </div>
                  )}
                </div>
                <div className="hypo" style={{ marginTop: 14 }}>
                  <div className="fields3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <NumField label="Inflation (annual)" suffix="%" value={settings.inflation} onChange={(v) => setS("inflation", n0(v))} />
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={!!settings.showNominal} onChange={(e) => setS("showNominal", e.target.checked)} />
                    <span className="swtrack"><span className="swknob" /></span>
                    <span className="sw-label">Show future dollars instead of today's</span>
                  </label>
                  <div className="caphint" style={{ marginTop: 8 }}>
                    Every rate you enter is nominal, and the projection runs in today's money: a 7% return against {n0(settings.inflation)}% inflation compounds at {(((1.07) / (1 + n0(settings.inflation) / 100) - 1) * 100).toFixed(2)}% here, and your spending stays constant in real terms. Loan payments are the exception — a fixed payment doesn't rise with prices, so it quietly gets easier to make. The toggle re-labels the charts in the money of the day; it moves no dates, because the independence target inflates alongside the balances.
                  </div>
                </div>
                <div className="assume">Today's dollars · returns, rates and spending held constant in real terms · a projection, not a guarantee or financial advice.</div>
              </div>

              <div className="panel rise">
                <div className="phead"><div className="ptitle">Every account & debt over time</div>{ranges(scBal, maxW)}</div>
                <div className="scope-wrap" ref={scBal.ref} {...scBal.handlers}>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={sampleRange(D.viewSeries, scBal.lo, scBal.hi, 320).map((s) => ({ w: s.w, nw: s.nw, ...s.acct, ...s.dbt }))} margin={{ top: 14, right: 12, bottom: 0, left: 6 }}>
                      <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" />
                      <XAxis {...axisProps(scBal)} />
                      <YAxis {...yProps} />
                      <Tooltip content={(p) => <MultiTip {...p} start={start} names={D.names} />} cursor={{ stroke: "var(--line2)" }} />
                      {accounts.map((a) => <Line key={a.id} type="monotone" dataKey={a.id} stroke={D.acctColors[a.id]} strokeWidth={1.5} dot={false} isAnimationActive={false} />)}
                      {debts.map((l) => <Line key={l.id} type="monotone" dataKey={l.id} stroke={D.debtColors[l.id]} strokeWidth={1.4} strokeDasharray="4 3" dot={false} isAnimationActive={false} />)}
                      <Line type="monotone" dataKey="nw" stroke="var(--amber)" strokeWidth={2.6} dot={false} isAnimationActive={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                {ZHINT}
                <div className="legend" style={{ marginTop: 10 }}>
                  <span className="lg"><span className="swatch" style={{ borderTopColor: "var(--amber)", borderTopWidth: 3 }} />Net worth</span>
                  {accounts.map((a) => <span className="lg" key={a.id}><span className="swatch" style={{ borderTopColor: D.acctColors[a.id] }} />{a.name}</span>)}
                  {debts.map((l) => <span className="lg" key={l.id}><span className="swatch" style={{ borderTopColor: D.debtColors[l.id], borderTopStyle: "dashed" }} />{l.name}</span>)}
                </div>
              </div>

              <div className="panel rise">
                <div className="phead"><div className="ptitle">Asset mix today</div></div>
                <Donut data={D.alloc} center={fmtBig(D.totalAssets)} sub="assets" />
              </div>
            </>
  );
}
