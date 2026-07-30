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
import { Stat, NumField, Tip } from "../components.js";
import { fmtMoney, fmtBig, fmtDate, n0 } from "../format.js";
import { sampleRange } from "../useScope.js";
export function InvestTab({
  D,
  chart,
  scInv,
  fireN,
  settings,
  setS,
  accounts,
  defaultOverflow
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
  const last = D.sim.series[Math.min(maxW, D.sim.series.length - 1)];
  const endVal = last.invest,
    endBasis = last.basis,
    growth = Math.max(0, endVal - endBasis);
  return React.createElement(React.Fragment, null, React.createElement("div", {
    className: "sgrid rise",
    style: {
      marginBottom: 16
    }
  }, React.createElement(Stat, {
    k: "Invested<br/>today",
    v: fmtBig(D.bInv),
    accent: "green"
  }), React.createElement(Stat, {
    k: "Value by<br/>" + fmtDate(w2date(maxW)),
    v: fmtBig(endVal),
    accent: "green"
  }), React.createElement(Stat, {
    k: "Growth<br/>(returns)",
    v: fmtBig(growth),
    accent: "cyan"
  }), React.createElement(Stat, {
    k: "Financial<br/>independence",
    v: D.sim.fire != null ? fmtDate(w2date(D.sim.fire)) : "40y+",
    accent: "amber"
  })), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Portfolio growth"), ranges(scInv, maxW)), React.createElement("div", _extends({
    className: "scope-wrap",
    ref: scInv.ref
  }, scInv.handlers), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 286
  }, React.createElement(ComposedChart, {
    data: sampleRange(D.sim.series, scInv.lo, scInv.hi, 320).map(s => ({
      w: s.w,
      value: s.invest,
      basis: s.basis
    })),
    margin: {
      top: 16,
      right: 12,
      bottom: 0,
      left: 6
    }
  }, React.createElement("defs", null, React.createElement("linearGradient", {
    id: "ivFill",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, React.createElement("stop", {
    offset: "0%",
    stopColor: "#5CCB8B",
    stopOpacity: 0.24
  }), React.createElement("stop", {
    offset: "100%",
    stopColor: "#5CCB8B",
    stopOpacity: 0
  }))), React.createElement(CartesianGrid, {
    stroke: "var(--line)",
    strokeDasharray: "2 4"
  }), React.createElement(XAxis, axisProps(scInv)), React.createElement(YAxis, yProps), React.createElement(Tooltip, {
    content: p => React.createElement(Tip, _extends({}, p, {
      start: start,
      rows: [{
        key: "value",
        name: "Value",
        color: "var(--green)"
      }, {
        key: "basis",
        name: "You put in",
        color: "var(--cyan)"
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
  }), React.createElement(Area, {
    type: "monotone",
    dataKey: "value",
    stroke: "var(--green)",
    strokeWidth: 2.6,
    fill: "url(#ivFill)",
    dot: false,
    activeDot: {
      r: 4,
      fill: "var(--green)",
      stroke: "none"
    },
    isAnimationActive: false
  }), React.createElement(Line, {
    type: "monotone",
    dataKey: "basis",
    stroke: "var(--cyan)",
    strokeWidth: 1.6,
    strokeDasharray: "5 4",
    dot: false,
    isAnimationActive: false
  })))), ZHINT, React.createElement("div", {
    className: "assume"
  }, "The green line is driven by the transfers and income splits you've set in Cash flow \u2014 ", fmtMoney(D.mTr), "/mo of transfers plus any share of your paycheck routed straight into an investment account. The gap above the dashed line is compound growth.")), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Independence target")), React.createElement("div", {
    className: "fields3",
    style: {
      gridTemplateColumns: "1fr 1fr"
    }
  }, React.createElement(NumField, {
    label: "Safe withdrawal rate",
    suffix: "%",
    value: settings.withdrawalRate,
    onChange: v => setS("withdrawalRate", n0(v))
  }), React.createElement(NumField, {
    label: "FI target",
    prefix: "$",
    value: Math.round(fireN),
    readOnly: true
  })), React.createElement("div", {
    className: "assume"
  }, "Based on ", fmtMoney(D.sim.annualExp / 12), "/mo of long-run living expenses \u2014 ", fmtBig(D.sim.annualExp), " a year. Only expenses count here, not transfers or debt payments.", D.sim.endingSoon.length > 0 && React.createElement(React.Fragment, null, " Excluded because they end before then: ", D.sim.endingSoon.map(e => e.category).join(", "), " \u2014 worth ", fmtBig((D.sim.annualExpNow - D.sim.annualExp) * (100 / (n0(settings.withdrawalRate) || 4))), " off the target.")), React.createElement("label", {
    className: "switch"
  }, React.createElement("input", {
    type: "checkbox",
    checked: !!settings.redirect,
    onChange: e => setS("redirect", e.target.checked)
  }), React.createElement("span", {
    className: "swtrack"
  }, React.createElement("span", {
    className: "swknob"
  })), React.createElement("span", {
    className: "sw-label"
  }, "Once every loan is cleared, redirect those payments into investing")), React.createElement("div", {
    className: "capline",
    style: {
      marginTop: 14
    }
  }, React.createElement("div", {
    className: "field",
    style: {
      flex: 1,
      minWidth: 160
    }
  }, React.createElement("label", null, "When there's no debt left, money goes to"), React.createElement("select", {
    value: settings.overflowTo || "",
    onChange: e => setS("overflowTo", e.target.value),
    "aria-label": "Overflow destination"
  }, React.createElement("option", {
    value: ""
  }, defaultOverflow ? defaultOverflow.name + " (first investment account)" : "— no investment account —"), accounts.map(a => React.createElement("option", {
    key: a.id,
    value: a.id
  }, a.name)))), React.createElement("div", {
    className: "caphint"
  }, "This catches both: freed-up loan payments after payoff, and anything a capped account sweeps once its target loan is gone. Until then a sweep aimed at a loan pays that loan, then rolls to your highest-rate remaining loan \u2014 only after every loan is clear does it land here."))), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Illiquid equity \u2014 options, RSUs, private stock")), React.createElement("div", {
    className: "assume",
    style: {
      fontSize: 11.5,
      marginTop: 0
    }
  }, "There's deliberately no field for this, because any number you'd enter would be wrong in a way that flatters the projection. Private-company options aren't an asset that compounds at 7% \u2014 they're a claim that pays either nothing or a lot, on a date nobody controls, and this tool has no way to express that.", React.createElement("br", null), React.createElement("br", null), "What is real and worth modelling: the ", React.createElement("b", null, "cash you spend exercising"), ". That's a dated outflow from a real account \u2014 put it in Cash flow as a one-time expense on the date you plan to exercise, and the tax bill the following April as another. Both hit your runway whether or not the equity is ever worth anything.", React.createElement("br", null), React.createElement("br", null), "If you want the shares on the balance sheet anyway, add an account of type \"Other asset\" at ", React.createElement("b", null, "0% return"), ", holding only what you actually paid in strike price. That's the one defensible number \u2014 it's cost, not a valuation. Leaving it out entirely is the more conservative read, and keeps your FI date honest: reaching independence on salary alone, with the equity as pure upside rather than load-bearing.")));
}