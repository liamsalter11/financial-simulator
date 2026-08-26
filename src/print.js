const {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine
} = Recharts;
import { fmtMoney, fmtBig, fmtDate, fmtDur, fmtC, n0, weekTick, addDays, catLabel, isInvest, isSav } from "./format.js";
import { minPaymentOf } from "./loan.js";
const CHART_W = 720,
  CHART_H = 180;
const Row = ({
  k,
  v,
  sub
}) => React.createElement("div", {
  className: "pr-row"
}, React.createElement("span", {
  className: "pr-k"
}, k), React.createElement("span", {
  className: "pr-v"
}, v, sub ? React.createElement("em", null, " ", sub) : null));
export function PrintSheet({
  D,
  accounts,
  debts,
  settings,
  start,
  fireN
}) {
  const today = new Date();
  const w2date = w => addDays(start, w * 7);
  const series = D.sim.series;
  const span = Math.min(series.length - 1, D.maxW);
  const step = Math.max(1, Math.round(span / 160));
  const data = [];
  for (let w = 0; w <= span; w += step) data.push({
    w,
    nw: series[w].nw,
    invest: series[w].invest,
    debt: series[w].debt
  });
  if (data[data.length - 1].w !== span) data.push({
    w: span,
    nw: series[span].nw,
    invest: series[span].invest,
    debt: series[span].debt
  });
  const loans = debts.filter(d => d.kind !== "card" && n0(d.balance) > 0);
  const cards = debts.filter(d => d.kind === "card");
  const invested = accounts.filter(a => isInvest(a.type)).reduce((s, a) => s + n0(a.balance), 0);
  const savings = accounts.filter(a => isSav(a.type)).reduce((s, a) => s + n0(a.balance), 0);
  const cash = D.totalAssets - invested - savings;
  return React.createElement("div", {
    className: "printsheet",
    id: "printsheet"
  }, React.createElement("div", {
    className: "pr-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "pr-title"
  }, "Financial plan"), React.createElement("div", {
    className: "pr-sub"
  }, "Projected ", today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }), " \xB7 today's dollars \xB7 ", n0(settings.inflation), "% inflation")), React.createElement("div", {
    className: "pr-nw"
  }, React.createElement("span", null, "Net worth"), React.createElement("b", null, fmtMoney(D.netWorth)))), React.createElement("div", {
    className: "pr-stats"
  }, React.createElement("div", null, React.createElement("span", null, "Assets"), React.createElement("b", null, fmtBig(D.totalAssets))), React.createElement("div", null, React.createElement("span", null, "Debts"), React.createElement("b", null, fmtBig(D.totalDebt))), React.createElement("div", null, React.createElement("span", null, "Surplus / mo"), React.createElement("b", null, fmtMoney(D.surplus))), React.createElement("div", null, React.createElement("span", null, "Cash runway"), React.createElement("b", null, D.runway == null ? "—" : fmtDur(Math.round(D.runway)))), React.createElement("div", null, React.createElement("span", null, "Debt-free"), React.createElement("b", null, D.sim.debtFree != null ? fmtDate(w2date(D.sim.debtFree)) : "—")), React.createElement("div", null, React.createElement("span", null, "Independent"), React.createElement("b", null, D.sim.fire != null ? fmtDate(w2date(D.sim.fire)) : "—"))), React.createElement("div", {
    className: "pr-block"
  }, React.createElement("h3", null, "Net worth, ", Math.round(span / 52.1775), " years out"), React.createElement(ComposedChart, {
    width: CHART_W,
    height: CHART_H,
    data: data,
    margin: {
      top: 8,
      right: 10,
      bottom: 0,
      left: 0
    }
  }, React.createElement("defs", null, React.createElement("linearGradient", {
    id: "prFill",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, React.createElement("stop", {
    offset: "0%",
    stopColor: "var(--amber)",
    stopOpacity: 0.24
  }), React.createElement("stop", {
    offset: "100%",
    stopColor: "var(--amber)",
    stopOpacity: 0
  }))), React.createElement(CartesianGrid, {
    stroke: "var(--line)",
    strokeDasharray: "2 4"
  }), React.createElement(XAxis, {
    dataKey: "w",
    type: "number",
    domain: [0, span],
    tickFormatter: weekTick(start),
    tickLine: false,
    stroke: "var(--line2)",
    minTickGap: 40,
    tick: {
      fill: "var(--faint)",
      fontSize: 9,
      fontFamily: "var(--mono)"
    }
  }), React.createElement(YAxis, {
    tickFormatter: fmtC,
    tickLine: false,
    axisLine: false,
    width: 46,
    tick: {
      fill: "var(--faint)",
      fontSize: 9,
      fontFamily: "var(--mono)"
    }
  }), React.createElement(Area, {
    type: "monotone",
    dataKey: "nw",
    stroke: "var(--amber)",
    strokeWidth: 2,
    fill: "url(#prFill)",
    isAnimationActive: false
  }), React.createElement(Line, {
    type: "monotone",
    dataKey: "invest",
    stroke: "var(--green)",
    strokeWidth: 1.3,
    strokeDasharray: "5 3",
    dot: false,
    isAnimationActive: false
  }), React.createElement(Line, {
    type: "monotone",
    dataKey: "debt",
    stroke: "var(--red)",
    strokeWidth: 1.3,
    strokeDasharray: "2 3",
    dot: false,
    isAnimationActive: false
  }), fireN > 0 && React.createElement(ReferenceLine, {
    y: fireN,
    stroke: "var(--amber)",
    strokeDasharray: "3 3"
  })), React.createElement("div", {
    className: "pr-legend"
  }, React.createElement("span", null, React.createElement("i", {
    className: "s-nw"
  }), "Net worth"), React.createElement("span", null, React.createElement("i", {
    className: "s-inv"
  }), "Invested"), React.createElement("span", null, React.createElement("i", {
    className: "s-debt"
  }), "Debt owed"), fireN > 0 && React.createElement("span", null, React.createElement("i", {
    className: "s-fi"
  }), "Independence at ", fmtBig(fireN)))), React.createElement("div", {
    className: "pr-cols"
  }, React.createElement("div", {
    className: "pr-block"
  }, React.createElement("h3", null, "Where the money is"), React.createElement(Row, {
    k: "Invested",
    v: fmtMoney(invested),
    sub: D.totalAssets > 0 ? `${Math.round(invested / D.totalAssets * 100)}%` : ""
  }), React.createElement(Row, {
    k: "Savings",
    v: fmtMoney(savings),
    sub: D.totalAssets > 0 ? `${Math.round(savings / D.totalAssets * 100)}%` : ""
  }), React.createElement(Row, {
    k: "Cash & other",
    v: fmtMoney(cash),
    sub: D.totalAssets > 0 ? `${Math.round(cash / D.totalAssets * 100)}%` : ""
  })), React.createElement("div", {
    className: "pr-block"
  }, React.createElement("h3", null, "Every month"), React.createElement(Row, {
    k: "Take-home",
    v: fmtMoney(D.mInc)
  }), React.createElement(Row, {
    k: "Living costs",
    v: "−" + fmtMoney(D.mExp)
  }), React.createElement(Row, {
    k: "Debt payments",
    v: "−" + fmtMoney(D.mDp)
  }), React.createElement(Row, {
    k: "Investing",
    v: "−" + fmtMoney(D.mTr)
  }), React.createElement(Row, {
    k: "Left in cash",
    v: fmtMoney(D.leftover)
  }))), D.spendCat.length > 0 && React.createElement("div", {
    className: "pr-block"
  }, React.createElement("h3", null, "Spending by category"), React.createElement("table", {
    className: "pr-table"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    scope: "col"
  }, "Category"), React.createElement("th", {
    scope: "col",
    className: "num"
  }, "Per month"), React.createElement("th", {
    scope: "col",
    className: "num"
  }, "Share"))), React.createElement("tbody", null, D.spendCat.map(c => React.createElement("tr", {
    key: c.v
  }, React.createElement("td", null, catLabel(c.v)), React.createElement("td", {
    className: "num"
  }, fmtMoney(c.monthly)), React.createElement("td", {
    className: "num"
  }, D.mExp > 0 ? Math.round(c.monthly / D.mExp * 100) : 0, "%")))))), (loans.length > 0 || cards.length > 0) && React.createElement("div", {
    className: "pr-block"
  }, React.createElement("h3", null, "Debts"), React.createElement("table", {
    className: "pr-table"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    scope: "col"
  }, "Name"), React.createElement("th", {
    scope: "col",
    className: "num"
  }, "Balance"), React.createElement("th", {
    scope: "col",
    className: "num"
  }, "Rate"), React.createElement("th", {
    scope: "col",
    className: "num"
  }, "Minimum"), React.createElement("th", {
    scope: "col",
    className: "num"
  }, "Clears"))), React.createElement("tbody", null, loans.map(d => {
    const w = D.sim.payoffWeek ? D.sim.payoffWeek[d.id] : null;
    return React.createElement("tr", {
      key: d.id
    }, React.createElement("td", null, d.name), React.createElement("td", {
      className: "num"
    }, fmtMoney(n0(d.balance))), React.createElement("td", {
      className: "num"
    }, n0(d.apr), "%"), React.createElement("td", {
      className: "num"
    }, fmtMoney(minPaymentOf(d))), React.createElement("td", {
      className: "num"
    }, w != null ? fmtDate(w2date(w)) : "not in 40 years"));
  }), cards.map(c => React.createElement("tr", {
    key: c.id
  }, React.createElement("td", null, c.name, " ", React.createElement("em", null, "card")), React.createElement("td", {
    className: "num"
  }, fmtMoney(n0(c.balance))), React.createElement("td", {
    className: "num"
  }, n0(c.apr), "%"), React.createElement("td", {
    className: "num"
  }, "\u2014"), React.createElement("td", {
    className: "num"
  }, "\u2014")))))), D.timeline.length > 0 && React.createElement("div", {
    className: "pr-block"
  }, React.createElement("h3", null, "What happens when"), React.createElement("table", {
    className: "pr-table"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    scope: "col",
    className: "when"
  }, "Date"), React.createElement("th", {
    scope: "col"
  }, "Milestone"))), React.createElement("tbody", null, D.timeline.slice(0, 8).map((m, i) => React.createElement("tr", {
    key: i
  }, React.createElement("td", {
    className: "when"
  }, fmtDate(m.date)), React.createElement("td", null, m.label, m.detail ? React.createElement("em", null, " \u2014 ", m.detail) : null))))), D.timeline.length > 8 && React.createElement("div", {
    className: "pr-more"
  }, "+", D.timeline.length - 8, " more on the Overview tab")), React.createElement("div", {
    className: "pr-foot"
  }, "Assumptions: every rate entered is nominal and converted to real at ", n0(settings.inflation), "% inflation \xB7 independence at ", n0(settings.withdrawalRate), "% withdrawal (", Math.round(100 / (n0(settings.withdrawalRate) || 4)), "\xD7 spending) \xB7", settings.payoffOrder === "snowball" ? " snowball" : " avalanche", " payoff order \xB7 returns held constant, no volatility and no sequence-of-returns risk. A projection, not a guarantee or financial advice."));
}