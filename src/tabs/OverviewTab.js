function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} = Recharts;
import { AlertTriangle } from "../icons.js";
import { Stat, Donut, Tip, MultiTip } from "../components.js";
import { fmtMoney, fmtBig, fmtDate } from "../format.js";
import { sampleRange } from "../useScope.js";
export function OverviewTab({
  D,
  accounts,
  debts,
  chart,
  scNW,
  scBal,
  fireN
}) {
  const {
    ranges,
    ZHINT,
    axisProps,
    yProps,
    w2date,
    start,
    maxW
  } = chart;
  return React.createElement(React.Fragment, null, React.createElement("div", {
    className: "sgrid rise",
    style: {
      marginBottom: 16
    }
  }, React.createElement(Stat, {
    k: "Net worth<br/>today",
    v: fmtBig(D.netWorth),
    accent: D.netWorth >= 0 ? "green" : "red"
  }), React.createElement(Stat, {
    k: "Monthly<br/>surplus",
    v: fmtMoney(D.surplus),
    accent: D.surplus >= 0 ? "" : "red"
  }), React.createElement(Stat, {
    k: "Debt-free<br/>date",
    v: D.totalDebt > 0 ? D.sim.debtFree != null ? fmtDate(w2date(D.sim.debtFree)) : "40y+" : "Clear",
    accent: "amber"
  }), React.createElement(Stat, {
    k: "Financial indep.<br/>(25\xD7 expenses)",
    v: D.sim.fire != null ? fmtDate(w2date(D.sim.fire)) : "40y+",
    accent: "green"
  })), D.surplus < 0 && React.createElement("div", {
    className: "warn rise"
  }, React.createElement(AlertTriangle, {
    size: 18,
    color: "var(--red)",
    style: {
      flex: "none",
      marginTop: 1
    }
  }), React.createElement("div", null, React.createElement("div", {
    className: "wt"
  }, "Spending exceeds income"), React.createElement("div", {
    className: "wb"
  }, "You're ", fmtMoney(-D.surplus), "/mo in the red before debt or investing. Adjust items in Cash flow."))), !(D.surplus < 0) && D.negAcct && React.createElement("div", {
    className: "warn rise"
  }, React.createElement(AlertTriangle, {
    size: 18,
    color: "var(--red)",
    style: {
      flex: "none",
      marginTop: 1
    }
  }), React.createElement("div", null, React.createElement("div", {
    className: "wt"
  }, D.negAcct, " runs dry"), React.createElement("div", {
    className: "wb"
  }, "With these dated flows, ", D.negAcct, " goes negative at some point. Route more income into it, or draw some expenses or payments from another account."))), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Net worth projection"), ranges(scNW, maxW)), React.createElement("div", _extends({
    className: "scope-wrap",
    ref: scNW.ref
  }, scNW.handlers), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 286
  }, React.createElement(ComposedChart, {
    data: sampleRange(D.sim.series, scNW.lo, scNW.hi, 320).map(s => ({
      w: s.w,
      nw: s.nw,
      debt: s.debt,
      invest: s.invest
    })),
    margin: {
      top: 16,
      right: 12,
      bottom: 0,
      left: 6
    }
  }, React.createElement("defs", null, React.createElement("linearGradient", {
    id: "nwFill",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, React.createElement("stop", {
    offset: "0%",
    stopColor: "#F5A623",
    stopOpacity: 0.26
  }), React.createElement("stop", {
    offset: "100%",
    stopColor: "#F5A623",
    stopOpacity: 0
  }))), React.createElement(CartesianGrid, {
    stroke: "var(--line)",
    strokeDasharray: "2 4"
  }), React.createElement(XAxis, axisProps(scNW)), React.createElement(YAxis, yProps), React.createElement(Tooltip, {
    content: p => React.createElement(Tip, _extends({}, p, {
      start: start,
      rows: [{
        key: "nw",
        name: "Net worth",
        color: "var(--amber)"
      }, {
        key: "invest",
        name: "Investments",
        color: "var(--green)"
      }, {
        key: "debt",
        name: "Debt",
        color: "var(--red)"
      }]
    })),
    cursor: {
      stroke: "var(--line2)"
    }
  }), fireN > 0 && D.sim.fire != null && React.createElement(ReferenceLine, {
    y: fireN,
    stroke: "var(--amber)",
    strokeDasharray: "3 3",
    label: {
      value: "FI " + fmtBig(fireN),
      position: "insideTopRight",
      fill: "var(--amber)",
      fontSize: 9.5,
      fontFamily: "var(--mono)"
    }
  }), D.sim.debtFree != null && React.createElement(ReferenceLine, {
    x: D.sim.debtFree,
    stroke: "var(--red)",
    strokeDasharray: "2 3",
    strokeOpacity: 0.6,
    label: {
      value: "DEBT-FREE",
      position: "top",
      fill: "var(--red)",
      fontSize: 9,
      fontFamily: "var(--mono)"
    }
  }), React.createElement(Area, {
    type: "monotone",
    dataKey: "nw",
    stroke: "var(--amber)",
    strokeWidth: 2.6,
    fill: "url(#nwFill)",
    dot: false,
    activeDot: {
      r: 4,
      fill: "var(--amber)",
      stroke: "none"
    },
    isAnimationActive: false
  }), React.createElement(Line, {
    type: "monotone",
    dataKey: "invest",
    stroke: "var(--green)",
    strokeWidth: 1.5,
    dot: false,
    isAnimationActive: false
  }), React.createElement(Line, {
    type: "monotone",
    dataKey: "debt",
    stroke: "var(--red)",
    strokeWidth: 1.5,
    dot: false,
    isAnimationActive: false
  })))), ZHINT, React.createElement("div", {
    className: "assume"
  }, "Today's dollars \xB7 returns and rates held constant \xB7 a projection, not a guarantee or financial advice.")), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Every account & debt over time"), ranges(scBal, maxW)), React.createElement("div", _extends({
    className: "scope-wrap",
    ref: scBal.ref
  }, scBal.handlers), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 300
  }, React.createElement(ComposedChart, {
    data: sampleRange(D.sim.series, scBal.lo, scBal.hi, 320).map(s => ({
      w: s.w,
      nw: s.nw,
      ...s.acct,
      ...s.dbt
    })),
    margin: {
      top: 14,
      right: 12,
      bottom: 0,
      left: 6
    }
  }, React.createElement(CartesianGrid, {
    stroke: "var(--line)",
    strokeDasharray: "2 4"
  }), React.createElement(XAxis, axisProps(scBal)), React.createElement(YAxis, yProps), React.createElement(Tooltip, {
    content: p => React.createElement(MultiTip, _extends({}, p, {
      start: start,
      names: D.names
    })),
    cursor: {
      stroke: "var(--line2)"
    }
  }), accounts.map(a => React.createElement(Line, {
    key: a.id,
    type: "monotone",
    dataKey: a.id,
    stroke: D.acctColors[a.id],
    strokeWidth: 1.5,
    dot: false,
    isAnimationActive: false
  })), debts.map(l => React.createElement(Line, {
    key: l.id,
    type: "monotone",
    dataKey: l.id,
    stroke: D.debtColors[l.id],
    strokeWidth: 1.4,
    strokeDasharray: "4 3",
    dot: false,
    isAnimationActive: false
  })), React.createElement(Line, {
    type: "monotone",
    dataKey: "nw",
    stroke: "var(--amber)",
    strokeWidth: 2.6,
    dot: false,
    isAnimationActive: false
  })))), ZHINT, React.createElement("div", {
    className: "legend",
    style: {
      marginTop: 10
    }
  }, React.createElement("span", {
    className: "lg"
  }, React.createElement("span", {
    className: "swatch",
    style: {
      borderTopColor: "var(--amber)",
      borderTopWidth: 3
    }
  }), "Net worth"), accounts.map(a => React.createElement("span", {
    className: "lg",
    key: a.id
  }, React.createElement("span", {
    className: "swatch",
    style: {
      borderTopColor: D.acctColors[a.id]
    }
  }), a.name)), debts.map(l => React.createElement("span", {
    className: "lg",
    key: l.id
  }, React.createElement("span", {
    className: "swatch",
    style: {
      borderTopColor: D.debtColors[l.id],
      borderTopStyle: "dashed"
    }
  }), l.name)))), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Asset mix today")), React.createElement(Donut, {
    data: D.alloc,
    center: fmtBig(D.totalAssets),
    sub: "assets"
  })));
}