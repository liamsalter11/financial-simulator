// Invest tab: portfolio growth, the FI target, and the "no field for equity" note.
const {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} = Recharts;
import { Stat, NumField, Tip } from "../components.js";
import { fmtMoney, fmtBig, fmtDate, n0 } from "../format.js";
import { sampleRange } from "../useScope.js";

export function InvestTab({ D, chart, scInv, fireN, settings, setS, accounts, defaultOverflow }) {
  const { ranges, ZHINT, axisProps, yProps, w2date, start, maxW } = chart;
            const last = D.sim.series[Math.min(maxW, D.sim.series.length - 1)];
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
                      <ComposedChart data={sampleRange(D.sim.series, scInv.lo, scInv.hi, 320).map((s) => ({ w: s.w, value: s.invest, basis: s.basis }))} margin={{ top: 16, right: 12, bottom: 0, left: 6 }}>
                        <defs><linearGradient id="ivFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5CCB8B" stopOpacity={0.24} /><stop offset="100%" stopColor="#5CCB8B" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" />
                        <XAxis {...axisProps(scInv)} />
                        <YAxis {...yProps} />
                        <Tooltip content={(p) => <Tip {...p} start={start} rows={[{ key: "value", name: "Value", color: "var(--green)" }, { key: "basis", name: "You put in", color: "var(--cyan)" }]} />} cursor={{ stroke: "var(--line2)" }} />
                        {fireN > 0 && D.sim.fire != null && <ReferenceLine y={fireN} stroke="var(--amber)" strokeDasharray="3 3" label={{ value: "FI " + fmtBig(fireN), position: "insideTopRight", fill: "var(--amber)", fontSize: 9.5, fontFamily: "var(--mono)" }} />}
                        <Area type="monotone" dataKey="value" stroke="var(--green)" strokeWidth={2.6} fill="url(#ivFill)" dot={false} activeDot={{ r: 4, fill: "var(--green)", stroke: "none" }} isAnimationActive={false} />
                        <Line type="monotone" dataKey="basis" stroke="var(--cyan)" strokeWidth={1.6} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  {ZHINT}
                  <div className="assume">The green line is driven by the transfers and income splits you've set in Cash flow — {fmtMoney(D.mTr)}/mo of transfers plus any share of your paycheck routed straight into an investment account. The gap above the dashed line is compound growth.</div>
                </div>

                <div className="panel rise">
                  <div className="phead"><div className="ptitle">Independence target</div></div>
                  <div className="fields3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <NumField label="Safe withdrawal rate" suffix="%" value={settings.withdrawalRate} onChange={(v) => setS("withdrawalRate", n0(v))} />
                    <NumField label="FI target" prefix="$" value={Math.round(fireN)} readOnly />
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
