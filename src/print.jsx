// The one-page summary the Print button produces. Rendered on screen first, inside the
// preview modal, and only then handed to the printer — which is not a nicety: a
// ResponsiveContainer measures its parent, so a chart that exists only inside `@media print`
// measures zero and prints nothing at all. Showing it first is what makes it printable.
//
// Everything here is read off `D`; nothing is recomputed, so the sheet cannot disagree with
// the tabs it summarises.
const { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } = Recharts;
import { fmtMoney, fmtBig, fmtDate, fmtDur, fmtC, n0, weekTick, addDays, catLabel, isInvest, isSav, isIlliquid } from "./format.js";
import { minPaymentOf } from "./loan.js";

/* Fixed pixel dimensions rather than ResponsiveContainer: the sheet is a known width in the
   preview and a known width on paper, and a chart that re-measures between the two would
   print at whatever size the modal happened to be. */
const CHART_W = 720, CHART_H = 180;

const Row = ({ k, v, sub }) => (
  <div className="pr-row"><span className="pr-k">{k}</span><span className="pr-v">{v}{sub ? <em> {sub}</em> : null}</span></div>
);

export function PrintSheet({ D, accounts, debts, settings, start, fireN }) {
  const today = new Date();
  const w2date = (w) => addDays(start, w * 7);
  const series = D.sim.series;
  /* one point a quarter over the first ten years, then yearly — enough shape for a page */
  const span = Math.min(series.length - 1, D.maxW);
  const step = Math.max(1, Math.round(span / 160));
  const data = [];
  for (let w = 0; w <= span; w += step) data.push({ w, nw: series[w].nw, invest: series[w].invest, debt: series[w].debt });
  if (data[data.length - 1].w !== span) data.push({ w: span, nw: series[span].nw, invest: series[span].invest, debt: series[span].debt });

  const loans = debts.filter((d) => d.kind !== "card" && n0(d.balance) > 0);
  const cards = debts.filter((d) => d.kind === "card");
  const invested = accounts.filter((a) => isInvest(a.type)).reduce((s, a) => s + n0(a.balance), 0);
  const savings = accounts.filter((a) => isSav(a.type)).reduce((s, a) => s + n0(a.balance), 0);
  /* cash is the remainder, so property has to come out of it explicitly — otherwise a
     house prints as "cash & other", which is the one place on paper it would go unnoticed */
  const property = accounts.filter((a) => isIlliquid(a.type)).reduce((s, a) => s + n0(a.balance), 0);
  const cash = D.totalAssets - invested - savings - property;

  return (
    <div className="printsheet" id="printsheet">
      <div className="pr-head">
        <div>
          <div className="pr-title">Financial plan</div>
          <div className="pr-sub">Projected {today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · today's dollars · {n0(settings.inflation)}% inflation</div>
        </div>
        <div className="pr-nw"><span>Net worth</span><b>{fmtMoney(D.netWorth)}</b></div>
      </div>

      <div className="pr-stats">
        <div><span>Assets</span><b>{fmtBig(D.totalAssets)}</b></div>
        <div><span>Debts</span><b>{fmtBig(D.totalDebt)}</b></div>
        <div><span>Surplus / mo</span><b>{fmtMoney(D.surplus)}</b></div>
        <div><span>Cash runway</span><b>{D.runway == null ? "—" : fmtDur(Math.round(D.runway))}</b></div>
        <div><span>Debt-free</span><b>{D.sim.debtFree != null ? fmtDate(w2date(D.sim.debtFree)) : "—"}</b></div>
        <div><span>Independent</span><b>{D.sim.fire != null ? fmtDate(w2date(D.sim.fire)) : "—"}</b></div>
      </div>

      <div className="pr-block">
        <h3>Net worth, {Math.round(span / 52.1775)} years out</h3>
        <ComposedChart width={CHART_W} height={CHART_H} data={data} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
          <defs><linearGradient id="prFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--amber)" stopOpacity={0.24} /><stop offset="100%" stopColor="var(--amber)" stopOpacity={0} />
          </linearGradient></defs>
          <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" />
          <XAxis dataKey="w" type="number" domain={[0, span]} tickFormatter={weekTick(start)} tickLine={false}
            stroke="var(--line2)" minTickGap={40} tick={{ fill: "var(--faint)", fontSize: 9, fontFamily: "var(--mono)" }} />
          <YAxis tickFormatter={fmtC} tickLine={false} axisLine={false} width={46}
            tick={{ fill: "var(--faint)", fontSize: 9, fontFamily: "var(--mono)" }} />
          <Area type="monotone" dataKey="nw" stroke="var(--amber)" strokeWidth={2} fill="url(#prFill)" isAnimationActive={false} />
          <Line type="monotone" dataKey="invest" stroke="var(--green)" strokeWidth={1.3} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="debt" stroke="var(--red)" strokeWidth={1.3} strokeDasharray="2 3" dot={false} isAnimationActive={false} />
          {fireN > 0 && <ReferenceLine y={fireN} stroke="var(--amber)" strokeDasharray="3 3" />}
        </ComposedChart>
        <div className="pr-legend">
          <span><i className="s-nw" />Net worth</span><span><i className="s-inv" />Invested</span>
          <span><i className="s-debt" />Debt owed</span>{fireN > 0 && <span><i className="s-fi" />Independence at {fmtBig(fireN)}</span>}
        </div>
      </div>

      <div className="pr-cols">
        <div className="pr-block">
          <h3>Where the money is</h3>
          <Row k="Invested" v={fmtMoney(invested)} sub={D.totalAssets > 0 ? `${Math.round(invested / D.totalAssets * 100)}%` : ""} />
          <Row k="Savings" v={fmtMoney(savings)} sub={D.totalAssets > 0 ? `${Math.round(savings / D.totalAssets * 100)}%` : ""} />
          <Row k="Cash & other" v={fmtMoney(cash)} sub={D.totalAssets > 0 ? `${Math.round(cash / D.totalAssets * 100)}%` : ""} />
          {property > 0 && <Row k="Property" v={fmtMoney(property)} sub={D.totalAssets > 0 ? `${Math.round(property / D.totalAssets * 100)}%` : ""} />}
        </div>
        <div className="pr-block">
          <h3>Every month</h3>
          <Row k="Take-home" v={fmtMoney(D.mInc)} />
          <Row k="Living costs" v={"−" + fmtMoney(D.mExp)} />
          <Row k="Debt payments" v={"−" + fmtMoney(D.mDp)} />
          <Row k="Investing" v={"−" + fmtMoney(D.mTr)} />
          <Row k="Left in cash" v={fmtMoney(D.leftover)} />
        </div>
      </div>

      {D.spendCat.length > 0 && (
        <div className="pr-block">
          <h3>Spending by category</h3>
          <table className="pr-table">
            <thead><tr><th scope="col">Category</th><th scope="col" className="num">Per month</th><th scope="col" className="num">Share</th></tr></thead>
            <tbody>{D.spendCat.map((c) => (
              <tr key={c.v}><td>{catLabel(c.v)}</td><td className="num">{fmtMoney(c.monthly)}</td>
                <td className="num">{D.mExp > 0 ? Math.round(c.monthly / D.mExp * 100) : 0}%</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {(loans.length > 0 || cards.length > 0) && (
        <div className="pr-block">
          <h3>Debts</h3>
          <table className="pr-table">
            <thead><tr><th scope="col">Name</th><th scope="col" className="num">Balance</th><th scope="col" className="num">Rate</th><th scope="col" className="num">Minimum</th><th scope="col" className="num">Clears</th></tr></thead>
            <tbody>
              {loans.map((d) => {
                const w = D.sim.payoffWeek ? D.sim.payoffWeek[d.id] : null;
                return (<tr key={d.id}><td>{d.name}</td><td className="num">{fmtMoney(n0(d.balance))}</td>
                  <td className="num">{n0(d.apr)}%</td><td className="num">{fmtMoney(minPaymentOf(d))}</td>
                  <td className="num">{w != null ? fmtDate(w2date(w)) : "not in 40 years"}</td></tr>);
              })}
              {cards.map((c) => (
                <tr key={c.id}><td>{c.name} <em>card</em></td><td className="num">{fmtMoney(n0(c.balance))}</td>
                  <td className="num">{n0(c.apr)}%</td><td className="num">—</td><td className="num">—</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {D.timeline.length > 0 && (
        <div className="pr-block">
          <h3>What happens when</h3>
          <table className="pr-table">
            <thead><tr><th scope="col" className="when">Date</th><th scope="col">Milestone</th></tr></thead>
            <tbody>{D.timeline.slice(0, 8).map((m, i) => (
              <tr key={i}><td className="when">{fmtDate(m.date)}</td><td>{m.label}{m.detail ? <em> — {m.detail}</em> : null}</td></tr>
            ))}</tbody>
          </table>
          {D.timeline.length > 8 && <div className="pr-more">+{D.timeline.length - 8} more on the Overview tab</div>}
        </div>
      )}

      <div className="pr-foot">
        Assumptions: every rate entered is nominal and converted to real at {n0(settings.inflation)}% inflation ·
        independence at {n0(settings.withdrawalRate)}% withdrawal ({Math.round(100 / (n0(settings.withdrawalRate) || 4))}× spending) ·
        {settings.payoffOrder === "snowball" ? " snowball" : " avalanche"} payoff order ·
        returns held constant, no volatility and no sequence-of-returns risk.
        A projection, not a guarantee or financial advice.
      </div>
    </div>
  );
}
