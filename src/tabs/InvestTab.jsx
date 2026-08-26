// Invest tab: portfolio growth, the FI target, and the "no field for equity" note.
const {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} = Recharts;
import { Stat, NumField, Tip } from "../components.js";
import { fmtMoney, fmtBig, fmtDate, n0, addDays } from "../format.js";
import { sampleRange } from "../useScope.js";

const McTip = ({ active, payload, label, start }) => {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;
  const d = addDays(start, label * 7);
  return (<div className="tt"><div className="tt-m">{d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
    <div className="tt-row"><span className="dot" style={{ background: "var(--green)" }} />Median<b>{fmtMoney(row.p50)}</b></div>
    <div className="tt-row"><span className="dot" style={{ background: "var(--muted)" }} />Middle 50%<b>{fmtMoney(row.p25)} – {fmtMoney(row.p75)}</b></div>
    <div className="tt-row"><span className="dot" style={{ background: "var(--faint)" }} />Middle 80%<b>{fmtMoney(row.p10)} – {fmtMoney(row.p90)}</b></div>
  </div>);
};

export function InvestTab({ D, chart, scInv, scMC, fireN, settings, setS, accounts, defaultOverflow }) {
  const { ranges, ZHINT, axisProps, yProps, w2date, start, maxW } = chart;
  const mcData = D.mc.bands.map((b) => ({
    w: b.w, p10: b.p10, p25: b.p25, p50: b.p50, p75: b.p75, p90: b.p90, fi: fireN * D.nomAt(b.w),
    p10to25: Math.max(0, b.p25 - b.p10), p25to75: Math.max(0, b.p75 - b.p25), p75to90: Math.max(0, b.p90 - b.p75),
  }));
  const mcEnd = D.mc.bands[D.mc.bands.length - 1];
            const last = D.viewSeries[Math.min(maxW, D.viewSeries.length - 1)];
            const endVal = last.invest, endBasis = last.basis, growth = Math.max(0, endVal - endBasis);
            return (
              <>
                <div className="sgrid rise" style={{ marginBottom: 16 }}>
                  <Stat k="Invested<br/>today" v={fmtBig(D.bInv)} accent="green" />
                  <Stat k={"Value by<br/>" + fmtDate(w2date(maxW))} v={fmtBig(endVal)} accent="green" />
                  <Stat k="Growth<br/>(returns)" v={fmtBig(growth)} accent="cyan" />
                  <Stat k="Financial<br/>independence" v={D.sim.fire != null ? fmtDate(w2date(D.sim.fire)) : "40y+"} accent="amber" />
                </div>

                <div className="panel rise">
                  <div className="phead"><div className="ptitle">Portfolio growth</div>{ranges(scInv, maxW)}</div>
                  <div className="scope-wrap" ref={scInv.ref} {...scInv.handlers}>
                    <ResponsiveContainer width="100%" height={286}>
                      <ComposedChart data={sampleRange(D.viewSeries, scInv.lo, scInv.hi, 320).map((s) => ({ w: s.w, value: s.invest, basis: s.basis, fi: s.fi }))} margin={{ top: 16, right: 12, bottom: 0, left: 6 }}>
                        <defs><linearGradient id="ivFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5CCB8B" stopOpacity={0.24} /><stop offset="100%" stopColor="#5CCB8B" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" />
                        <XAxis {...axisProps(scInv)} />
                        <YAxis {...yProps} />
                        <Tooltip content={(p) => <Tip {...p} start={start} rows={[{ key: "value", name: "Value", color: "var(--green)" }, { key: "basis", name: "You put in", color: "var(--cyan)" }]} />} cursor={{ stroke: "var(--line2)" }} />
                        {fireN > 0 && D.sim.fire != null && !D.showNom && <ReferenceLine y={fireN} stroke="var(--amber)" strokeDasharray="3 3" label={{ value: "FI " + fmtBig(fireN), position: "insideTopRight", fill: "var(--amber)", fontSize: 9.5, fontFamily: "var(--mono)" }} />}
                        {fireN > 0 && D.showNom && <Line type="monotone" dataKey="fi" stroke="var(--amber)" strokeWidth={1.2} strokeDasharray="3 3" dot={false} isAnimationActive={false} />}
                        <Area type="monotone" dataKey="value" stroke="var(--green)" strokeWidth={2.6} fill="url(#ivFill)" dot={false} activeDot={{ r: 4, fill: "var(--green)", stroke: "none" }} isAnimationActive={false} />
                        <Line type="monotone" dataKey="basis" stroke="var(--cyan)" strokeWidth={1.6} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  {ZHINT}
                  <div className="assume">The green line is driven by the transfers and income splits you've set in Cash flow — {fmtMoney(D.mTr)}/mo of transfers plus any share of your paycheck routed straight into an investment account. The gap above the dashed line is compound growth.</div>
                </div>

                <div className="panel rise">
                  <div className="phead"><div className="ptitle">Monte Carlo: range of outcomes</div>{ranges(scMC, maxW)}</div>
                  <div className="sgrid" style={{ marginBottom: 14 }}>
                    <Stat k="Chance investments alone<br/>hit your FI number" v={Math.round(D.mc.successProb * 100) + "%"} accent={D.mc.successProb >= 0.5 ? "green" : "red"} />
                    <Stat k={"Median value by<br/>" + fmtDate(w2date(maxW))} v={fmtBig(mcEnd.p50)} accent="cyan" />
                  </div>
                  <div className="fields3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <NumField label="Return volatility (annual)" suffix="%" value={settings.mcVolatility} onChange={(v) => setS("mcVolatility", n0(v))} />
                  </div>
                  <div className="scope-wrap" ref={scMC.ref} {...scMC.handlers} style={{ marginTop: 12 }}>
                    <ResponsiveContainer width="100%" height={286}>
                      <ComposedChart data={mcData} margin={{ top: 16, right: 12, bottom: 0, left: 6 }}>
                        <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" />
                        <XAxis {...axisProps(scMC)} />
                        <YAxis {...yProps} />
                        <Tooltip content={(p) => <McTip {...p} start={start} />} cursor={{ stroke: "var(--line2)" }} />
                        {fireN > 0 && !D.showNom && <ReferenceLine y={fireN} stroke="var(--amber)" strokeDasharray="3 3" label={{ value: "FI " + fmtBig(fireN), position: "insideTopRight", fill: "var(--amber)", fontSize: 9.5, fontFamily: "var(--mono)" }} />}
                        {fireN > 0 && D.showNom && <Line type="monotone" dataKey="fi" stroke="var(--amber)" strokeWidth={1.2} strokeDasharray="3 3" dot={false} isAnimationActive={false} />}
                        <Area dataKey="p10" stackId="mc" stroke="none" fill="transparent" isAnimationActive={false} />
                        <Area dataKey="p10to25" stackId="mc" stroke="none" fill="rgba(92,203,139,0.10)" isAnimationActive={false} />
                        <Area dataKey="p25to75" stackId="mc" stroke="none" fill="rgba(92,203,139,0.22)" isAnimationActive={false} />
                        <Area dataKey="p75to90" stackId="mc" stroke="none" fill="rgba(92,203,139,0.10)" isAnimationActive={false} />
                        <Line type="monotone" dataKey="p50" stroke="var(--green)" strokeWidth={2.2} dot={false} isAnimationActive={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  {ZHINT}
                  <div className="legend" style={{ marginTop: 8 }}>
                    <span className="lg"><span className="swatch" style={{ borderTopColor: "var(--green)", borderTopWidth: 3 }} />Median</span>
                    <span className="lg"><span className="dot" style={{ background: "rgba(92,203,139,0.5)" }} />Middle 50% / 80% of outcomes</span>
                  </div>
                  <div className="assume">Same contributions as the chart above — only the returns are randomized, {D.mc.trials} times, as one blended portfolio at your accounts' balance-weighted expected return, after inflation ({(D.mcReturn * 100).toFixed(2)}% real). Higher volatility widens the shaded range without changing the median much; it's a measure of how much a real market could disagree with the average, not a prediction of which path you'll get.
                    <br /><br />
                    The percentage checks your invested portfolio's own value against the FI number, same as this chart's line — a narrower question than the "Financial independence" date above, which also counts cash, savings, and paid-down debt. A lower number here doesn't contradict a nearer date up there; it means the rest of your net worth is doing some of that work too.</div>
                </div>

                <div className="panel rise">
                  <div className="phead"><div className="ptitle">Independence target</div></div>
                  <div className="fields3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <NumField label="Safe withdrawal rate" suffix="%" value={settings.withdrawalRate} onChange={(v) => setS("withdrawalRate", n0(v))} />
                    <NumField label="FI target (today's dollars)" prefix="$" value={Math.round(fireN)} readOnly />
                  </div>
                  <div className="assume">Based on {fmtMoney(D.sim.annualExp / 12)}/mo of long-run living expenses — {fmtBig(D.sim.annualExp)} a year. Only expenses count here, not transfers or debt payments.
                    {D.sim.endingSoon.length > 0 && <> Excluded because they end before then: {D.sim.endingSoon.map((e) => e.category).join(", ")} — worth {fmtBig((D.sim.annualExpNow - D.sim.annualExp) * (100 / (n0(settings.withdrawalRate) || 4)))} off the target.</>}
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={!!settings.redirect} onChange={(e) => setS("redirect", e.target.checked)} />
                    <span className="swtrack"><span className="swknob" /></span>
                    <span className="sw-label">Once every loan is cleared, redirect those payments into investing</span>
                  </label>
                  <div className="capline" style={{ marginTop: 14 }}>
                    <div className="field" style={{ flex: 1, minWidth: 160 }}>
                      <label>When there's no debt left, money goes to</label>
                      <select value={settings.overflowTo || ""} onChange={(e) => setS("overflowTo", e.target.value)} aria-label="Overflow destination">
                        <option value="">{defaultOverflow ? defaultOverflow.name + " (first investment account)" : "— no investment account —"}</option>
                        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div className="caphint">
                      This catches both: freed-up loan payments after payoff, and anything a capped account sweeps once its target loan is gone. Until then a sweep aimed at a loan pays that loan, then rolls to your highest-rate remaining loan — only after every loan is clear does it land here.
                    </div>
                  </div>
                </div>

                <div className="panel rise">
                  <div className="phead"><div className="ptitle">Illiquid equity — options, RSUs, private stock</div></div>
                  <div className="assume" style={{ fontSize: 11.5, marginTop: 0 }}>
                    There's deliberately no field for this, because any number you'd enter would be wrong in a way that flatters the projection. Private-company options aren't an asset that compounds at 7% — they're a claim that pays either nothing or a lot, on a date nobody controls, and this tool has no way to express that.
                    <br /><br />
                    What is real and worth modelling: the <b>cash you spend exercising</b>. That's a dated outflow from a real account — put it in Cash flow as a one-time expense on the date you plan to exercise, and the tax bill the following April as another. Both hit your runway whether or not the equity is ever worth anything.
                    <br /><br />
                    If you want the shares on the balance sheet anyway, add an account of type "Other asset" at <b>0% return</b>, holding only what you actually paid in strike price. That's the one defensible number — it's cost, not a valuation. Leaving it out entirely is the more conservative read, and keeps your FI date honest: reaching independence on salary alone, with the equity as pure upside rather than load-bearing.
                  </div>
                </div>
              </>
  );
}
