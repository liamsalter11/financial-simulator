// Read-only summary tab: net worth, warnings, and the three headline charts.
const {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} = Recharts;
import { AlertTriangle, Zap } from "../icons.js";
import { Stat, NumField, Seg, Donut, Tip, MultiTip } from "../components.js";
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

/* the goal-seek answer, in a sentence — the number alone doesn't say whether it worked */
function SolveAnswer({ solve, knob, target, fmtWeek }) {
  if (!solve) return null;
  const amount = <b style={{ color: "var(--amber)" }}>{fmtMoney(solve.amount)}/mo</b>;
  const achieved = target.kind === "date" ? fmtWeek(solve.achieved) : `${Math.round(solve.achieved)}%`;
  if (solve.reason === "already") return <>You're already there — this plan meets that without changing {knob.label.toLowerCase()} at all ({achieved}).</>;
  if (solve.reason === "noEffect") return <>Changing {knob.label.toLowerCase()} doesn't move that date at all: the money it frees isn't routed there. Add or grow the payment that would carry it.</>;
  if (solve.reason === "unreachable") return <>No amount inside {fmtMoney(knob.max)}/mo gets there — the best it manages is {achieved}. Try a later date, or a different lever.</>;
  if (solve.reason === "anything") return <>Any amount up to {fmtMoney(knob.max)}/mo still meets that.</>;
  return <>{knob.direction === "min" ? <>You'd need {amount}</> : <>You could go up to {amount}</>} — that lands on {achieved}.</>;
}

export function OverviewTab({ D, accounts, debts, chart, scNW, scBal, fireN, settings, setS, ask, setAsk, runSolve, runTornado, knobs, targets, openScenarios }) {
  const { ranges, ZHINT, axisProps, yProps, w2date, start, maxW } = chart;
  const askKnob = knobs.find((k) => k.v === ask.knob) || knobs[0];
  const askTarget = targets.find((t) => t.v === ask.target) || targets[0];
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
                    <ComposedChart data={sampleRange(D.viewSeries, scNW.lo, scNW.hi, 320).map((s) => ({ w: s.w, nw: s.nw, debt: s.debt, invest: s.invest, fi: s.fi, cmp: s.cmp }))} margin={{ top: 16, right: 12, bottom: 0, left: 6 }}>
                      <defs><linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F5A623" stopOpacity={0.26} /><stop offset="100%" stopColor="#F5A623" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" />
                      <XAxis {...axisProps(scNW)} />
                      <YAxis {...yProps} />
                      <Tooltip content={(p) => <Tip {...p} start={start} rows={[{ key: "nw", name: "Net worth", color: "var(--amber)" }, { key: "invest", name: "Investments", color: "var(--green)" }, { key: "debt", name: "Debt", color: "var(--red)" }]} />} cursor={{ stroke: "var(--line2)" }} />
                      {/* in future dollars the target climbs with everything else, so it's a line rather than a level */}
                      {fireN > 0 && D.sim.fire != null && !D.fiSloped && <ReferenceLine y={fireN} stroke="var(--amber)" strokeDasharray="3 3" label={{ value: "FI " + fmtBig(fireN), position: "insideTopRight", fill: "var(--amber)", fontSize: 9.5, fontFamily: "var(--mono)" }} />}
                      {fireN > 0 && D.fiSloped && <Line type="monotone" dataKey="fi" stroke="var(--amber)" strokeWidth={1.2} strokeDasharray="3 3" dot={false} isAnimationActive={false} />}
                      {D.sim.debtFree != null && <ReferenceLine x={D.sim.debtFree} stroke="var(--red)" strokeDasharray="2 3" strokeOpacity={0.6} label={{ value: "DEBT-FREE", position: "top", fill: "var(--red)", fontSize: 9, fontFamily: "var(--mono)" }} />}
                      <Area type="monotone" dataKey="nw" stroke="var(--amber)" strokeWidth={2.6} fill="url(#nwFill)" dot={false} activeDot={{ r: 4, fill: "var(--amber)", stroke: "none" }} isAnimationActive={false} />
                      <Line type="monotone" dataKey="invest" stroke="var(--green)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="debt" stroke="var(--red)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                      {D.compare && <Line type="monotone" dataKey="cmp" stroke="var(--muted)" strokeWidth={1.6} strokeDasharray="5 4" dot={false} isAnimationActive={false} />}
                      {/* what was actually recorded, as points rather than a line — there
                          are only as many as there are days you've opened the app */}
                      {D.actuals.length > 1 && <Line type="monotone" dataKey="actual" stroke="var(--cyan)" strokeWidth={2} dot={{ r: 2.5, fill: "var(--cyan)", stroke: "none" }} connectNulls isAnimationActive={false} />}
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
                {D.drift && (
                  <div className="caphint" style={{ marginTop: 10 }}>
                    {(() => {
                      const when = fmtDate(new Date(D.drift.at));
                      const bits = [];
                      if (D.drift.nw != null) {
                        const moved = D.netWorth - D.drift.nw;
                        bits.push(<span key="nw">net worth is <b style={{ color: moved >= 0 ? "var(--green)" : "var(--red)" }}>{fmtMoney(Math.abs(moved))} {moved >= 0 ? "up" : "down"}</b></span>);
                      }
                      const shifted = (label, then, now) => {
                        if (!then || !now) return null;
                        const months = Math.round((new Date(then) - new Date(now)) / 86400000 / 30.44);
                        if (Math.abs(months) < 1) return <span key={label}>{label} hasn't moved</span>;
                        return <span key={label}>{label} is <b style={{ color: months > 0 ? "var(--green)" : "var(--red)" }}>{fmtDur(Math.abs(months))} {months > 0 ? "sooner" : "later"}</b></span>;
                      };
                      const fi = shifted("independence", D.drift.fire, D.sim.fire == null ? null : w2date(D.sim.fire).toISOString());
                      const df = shifted("debt-free", D.drift.debtFree, D.sim.debtFree == null ? null : w2date(D.sim.debtFree).toISOString());
                      [fi, df].forEach((x) => x && bits.push(x));
                      if (!bits.length) return null;
                      return <>Since {when}: {bits.map((b, i) => <span key={i}>{i ? ", " : ""}{b}</span>)}. The app keeps a copy of your plan once a day, which is where this comes from — and the cyan points are net worth as it was actually recorded.</>;
                    })()}
                  </div>
                )}
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
                <div className="phead"><div className="ptitle">What would it take?</div><div className="psub">runs your plan, in reverse</div></div>
                <div className="askrow">
                  <Seg value={ask.target} options={targets.map((t) => ({ v: t.v, label: t.label }))} onChange={(v) => setAsk((a) => ({ ...a, target: v, value: "", solve: null }))} />
                </div>
                <div className="askrow" style={{ marginTop: 10 }}>
                  {askTarget.kind === "date"
                    ? <input type="date" value={ask.value} onChange={(e) => setAsk((a) => ({ ...a, value: e.target.value }))} aria-label="Target date" />
                    : <div className="pctbox"><input type="number" inputMode="decimal" value={ask.value} onChange={(e) => setAsk((a) => ({ ...a, value: e.target.value }))} aria-label="Target percentage" placeholder="90" /><span className="u">%</span></div>}
                  <span className="cap">by changing</span>
                  <select value={ask.knob} onChange={(e) => setAsk((a) => ({ ...a, knob: e.target.value, solve: null }))} aria-label="What to change" style={{ minWidth: 150 }}>
                    {knobs.map((k) => <option key={k.v} value={k.v}>{k.label}</option>)}
                  </select>
                  <button className="btn btn-amber" onClick={runSolve} disabled={!ask.value || ask.running}>
                    <Zap size={14} />{ask.running ? "Solving…" : "Solve"}
                  </button>
                </div>
                <div className="caphint" style={{ marginTop: 10 }}>
                  {ask.error
                    ? "That didn't come back with an answer — try a different target."
                    : ask.solve
                      ? <SolveAnswer solve={ask.solve} knob={askKnob} target={askTarget} fmtWeek={(w) => fmtDate(w2date(w))} />
                      : <>Pick a date or a percentage, and this searches for the {askKnob.label.toLowerCase()} that meets it. It re-runs the whole projection twenty-odd times, so give it a moment.</>}
                </div>

                <div className="phead" style={{ marginTop: 18 }}><div className="ptitle">What moves the date</div>
                  <button className="btn btn-ghost" onClick={runTornado} disabled={ask.running}>{ask.running ? "Working…" : ask.tornado ? "Re-run" : "Run sensitivity"}</button>
                </div>
                {ask.tornado ? (() => {
                  const rows = ask.tornado.rows;
                  const worst = Math.max(1, ...rows.map((r) => Math.abs(r.months)));
                  return (<>
                    <div className="tornado">
                      {rows.map((r) => (
                        <div className="tor-row" key={r.v}>
                          <span className="tor-label">{r.label}</span>
                          <span className="tor-track">
                            <span className="tor-bar" style={{
                              width: (Math.abs(r.months) / worst * 50) + "%",
                              marginLeft: r.months < 0 ? (50 - Math.abs(r.months) / worst * 50) + "%" : "50%",
                              background: r.months < 0 ? "var(--green)" : "var(--red)",
                            }} />
                          </span>
                          <span className="tor-val mono">{r.months > 0 ? "+" : ""}{Math.round(r.months)} mo</span>
                        </div>
                      ))}
                    </div>
                    <div className="caphint">Each row is one change on its own, measured against your independence date — green pulls it in, red pushes it out. The ordering is the useful part: it's usually not the one you'd guess.</div>
                  </>);
                })() : <div className="caphint">Nudges each input on its own and reports how far your independence date moves. Seven full projections, so it runs on demand rather than as you type.</div>}
              </div>

              {D.timeline.length > 0 && (
                <div className="panel rise">
                  <div className="phead"><div className="ptitle">What happens when</div><div className="psub">{D.timeline.length} milestones ahead</div></div>
                  <div className="timeline">
                    {D.timeline.map((m, i) => (
                      <div className={"tl-row tl-" + m.kind} key={i}>
                        <span className="tl-date mono">{fmtDate(m.date)}</span>
                        <span className="tl-dot" />
                        <span className="tl-body"><b>{m.label}</b>{m.detail ? <span className="tl-detail"> — {m.detail}</span> : null}</span>
                      </div>
                    ))}
                  </div>
                  <div className="assume">Every date here comes from the same projection as the charts above, so they move together. Dates beyond the 40-year horizon aren't listed at all rather than guessed at.</div>
                </div>
              )}

              {D.compare && (
                <div className="panel rise">
                  <div className="phead"><div className="ptitle">Compared with “{D.compare.name}”</div>
                    <button className="btn btn-ghost" onClick={openScenarios}>Change</button>
                  </div>
                  <div className="caphint" style={{ marginBottom: 10 }}>
                    By {fmtDate(w2date(D.maxW))} this plan is <b style={{ color: D.compare.nwGap >= 0 ? "var(--green)" : "var(--red)" }}>{fmtMoney(Math.abs(D.compare.nwGap))} {D.compare.nwGap >= 0 ? "ahead of" : "behind"}</b> it. The dashed line on the net worth chart is that plan.
                  </div>
                  <div className="timeline">
                    {D.compare.rows.map((r, i) => (
                      <div className="tl-row" key={i}>
                        <span className="tl-date mono">{r.date ? fmtDate(r.date) : "—"}</span>
                        <span className="tl-dot" />
                        <span className="tl-body"><b>{r.label}</b>
                          <span className="tl-detail">
                            {r.deltaWeeks == null
                              ? (r.week == null ? ` — only “${D.compare.name}” gets there, ${fmtDate(r.otherDate)}` : " — only this plan gets there")
                              : Math.abs(r.deltaWeeks) < 2 ? " — the same either way"
                                : ` — ${fmtDur(Math.abs(Math.round(r.deltaMonths)))} ${r.deltaWeeks < 0 ? "sooner" : "later"} than “${D.compare.name}”`}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="panel rise">
                <div className="phead"><div className="ptitle">Asset mix today</div></div>
                <Donut data={D.alloc} center={fmtBig(D.totalAssets)} sub="assets" />
              </div>
            </>
  );
}
