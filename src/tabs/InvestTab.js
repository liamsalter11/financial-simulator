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
import { fmtMoney, fmtBig, fmtDate, fmtDur, n0, addDays } from "../format.js";
import { sampleRange } from "../useScope.js";
const McTip = ({
  active,
  payload,
  label,
  start
}) => {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;
  const d = addDays(start, label * 7);
  return React.createElement("div", {
    className: "tt"
  }, React.createElement("div", {
    className: "tt-m"
  }, d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })), React.createElement("div", {
    className: "tt-row"
  }, React.createElement("span", {
    className: "dot",
    style: {
      background: "var(--green)"
    }
  }), "Median", React.createElement("b", null, fmtMoney(row.p50))), React.createElement("div", {
    className: "tt-row"
  }, React.createElement("span", {
    className: "dot",
    style: {
      background: "var(--muted)"
    }
  }), "Middle 50%", React.createElement("b", null, fmtMoney(row.p25), " \u2013 ", fmtMoney(row.p75))), React.createElement("div", {
    className: "tt-row"
  }, React.createElement("span", {
    className: "dot",
    style: {
      background: "var(--faint)"
    }
  }), "Middle 80%", React.createElement("b", null, fmtMoney(row.p10), " \u2013 ", fmtMoney(row.p90))));
};
export function InvestTab({
  D,
  chart,
  scInv,
  scMC,
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
  const mcData = D.mc.bands.map(b => ({
    w: b.w,
    p10: b.p10,
    p25: b.p25,
    p50: b.p50,
    p75: b.p75,
    p90: b.p90,
    fi: fireN * D.nomAt(b.w),
    p10to25: Math.max(0, b.p25 - b.p10),
    p25to75: Math.max(0, b.p75 - b.p25),
    p75to90: Math.max(0, b.p90 - b.p75)
  }));
  const mcEnd = D.mc.bands[D.mc.bands.length - 1];
  const retires = !!D.mc.retires;
  const mcMax = Math.max(maxW, D.horizonWeeks || 0);
  const last = D.viewSeries[Math.min(maxW, D.viewSeries.length - 1)];
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
    data: sampleRange(D.viewSeries, scInv.lo, scInv.hi, 320).map(s => ({
      w: s.w,
      value: s.invest,
      basis: s.basis,
      fi: s.fi
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
  }), fireN > 0 && D.sim.fire != null && !D.fiSloped && React.createElement(ReferenceLine, {
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
  }), fireN > 0 && D.fiSloped && React.createElement(Line, {
    type: "monotone",
    dataKey: "fi",
    stroke: "var(--amber)",
    strokeWidth: 1.2,
    strokeDasharray: "3 3",
    dot: false,
    isAnimationActive: false
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
  }, "Monte Carlo: does the money last?"), ranges(scMC, mcMax)), React.createElement("div", {
    className: "sgrid",
    style: {
      marginBottom: 14
    }
  }, retires ? React.createElement(Stat, {
    k: "Chance the money lasts<br/>to " + fmtDate(w2date(D.horizonWeeks)),
    v: Math.round(D.mc.survivalProb * 100) + "%",
    accent: D.mc.survivalProb >= 0.8 ? "green" : D.mc.survivalProb >= 0.5 ? "amber" : "red"
  }) : React.createElement(Stat, {
    k: "Chance investments alone<br/>hit your FI number",
    v: Math.round(D.mc.successProb * 100) + "%",
    accent: D.mc.successProb >= 0.5 ? "green" : "red"
  }), React.createElement(Stat, {
    k: "Median value by<br/>" + fmtDate(w2date(mcMax)),
    v: fmtBig(mcEnd.p50),
    accent: "cyan"
  })), React.createElement("div", {
    className: "fields3",
    style: {
      gridTemplateColumns: "1fr 1fr 1fr"
    }
  }, React.createElement(NumField, {
    label: "Return volatility (annual)",
    suffix: "%",
    value: settings.mcVolatility,
    onChange: v => setS("mcVolatility", n0(v))
  }), React.createElement("div", {
    className: "field"
  }, React.createElement("label", null, "Retire on (blank = your FI date)"), React.createElement("input", {
    type: "date",
    value: settings.mcRetireDate || "",
    onChange: e => setS("mcRetireDate", e.target.value),
    "aria-label": "Retirement date",
    title: "When contributions stop and withdrawals begin. Leave blank to use the projection's own independence date."
  })), n0(settings.birthYear) > 0 ? React.createElement(NumField, {
    label: "Money must last to age",
    value: settings.mcEndAge,
    onChange: v => setS("mcEndAge", n0(v))
  }) : React.createElement(NumField, {
    label: "Years it must last",
    suffix: "yr",
    value: settings.mcYears,
    onChange: v => setS("mcYears", n0(v))
  })), retires && React.createElement("div", {
    className: "caphint" + (D.mc.survivalProb < 0.8 ? " warn-txt" : ""),
    style: {
      marginTop: 8
    }
  }, "Retiring ", fmtDate(w2date(D.retireWeek)), ": contributions stop and the portfolio starts paying out ", fmtMoney(D.mc.monthlySpend), "/mo, held constant in today's dollars.", D.mc.investShare < 0.999 ? ` That's its ${Math.round(D.mc.investShare * 100)}% share of your ${fmtMoney(D.sim.annualExpNet / 12)}/mo of long-run spending — cash, savings and paid-down debt cover the rest.` : "", D.mc.medianDepletionWeek != null ? ` The money runs out in ${Math.round((1 - D.mc.survivalProb) * D.mc.trials)} of ${D.mc.trials} runs, around ${fmtDate(w2date(D.mc.medianDepletionWeek))} in the median failure.` : " No simulated run ran out."), React.createElement("div", _extends({
    className: "scope-wrap",
    ref: scMC.ref
  }, scMC.handlers, {
    style: {
      marginTop: 12
    }
  }), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 286
  }, React.createElement(ComposedChart, {
    data: mcData,
    margin: {
      top: 16,
      right: 12,
      bottom: 0,
      left: 6
    }
  }, React.createElement(CartesianGrid, {
    stroke: "var(--line)",
    strokeDasharray: "2 4"
  }), React.createElement(XAxis, axisProps(scMC)), React.createElement(YAxis, yProps), React.createElement(Tooltip, {
    content: p => React.createElement(McTip, _extends({}, p, {
      start: start
    })),
    cursor: {
      stroke: "var(--line2)"
    }
  }), fireN > 0 && !D.fiSloped && React.createElement(ReferenceLine, {
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
  }), fireN > 0 && D.fiSloped && React.createElement(Line, {
    type: "monotone",
    dataKey: "fi",
    stroke: "var(--amber)",
    strokeWidth: 1.2,
    strokeDasharray: "3 3",
    dot: false,
    isAnimationActive: false
  }), retires && React.createElement(ReferenceLine, {
    x: D.retireWeek,
    stroke: "var(--cyan)",
    strokeDasharray: "2 3",
    strokeOpacity: 0.7,
    label: {
      value: "RETIRE",
      position: "top",
      fill: "var(--cyan)",
      fontSize: 9,
      fontFamily: "var(--mono)"
    }
  }), React.createElement(Area, {
    dataKey: "p10",
    stackId: "mc",
    stroke: "none",
    fill: "transparent",
    isAnimationActive: false
  }), React.createElement(Area, {
    dataKey: "p10to25",
    stackId: "mc",
    stroke: "none",
    fill: "rgba(92,203,139,0.10)",
    isAnimationActive: false
  }), React.createElement(Area, {
    dataKey: "p25to75",
    stackId: "mc",
    stroke: "none",
    fill: "rgba(92,203,139,0.22)",
    isAnimationActive: false
  }), React.createElement(Area, {
    dataKey: "p75to90",
    stackId: "mc",
    stroke: "none",
    fill: "rgba(92,203,139,0.10)",
    isAnimationActive: false
  }), React.createElement(Line, {
    type: "monotone",
    dataKey: "p50",
    stroke: "var(--green)",
    strokeWidth: 2.2,
    dot: false,
    isAnimationActive: false
  })))), ZHINT, React.createElement("div", {
    className: "legend",
    style: {
      marginTop: 8
    }
  }, React.createElement("span", {
    className: "lg"
  }, React.createElement("span", {
    className: "swatch",
    style: {
      borderTopColor: "var(--green)",
      borderTopWidth: 3
    }
  }), "Median"), React.createElement("span", {
    className: "lg"
  }, React.createElement("span", {
    className: "dot",
    style: {
      background: "rgba(92,203,139,0.5)"
    }
  }), "Middle 50% / 80% of outcomes")), React.createElement("div", {
    className: "assume"
  }, "Same contributions as the chart above until the retirement date, then they stop and withdrawals begin \u2014 only the returns are randomized, ", D.mc.trials, " times, as one blended portfolio at your accounts' balance-weighted expected return, after inflation (", (D.mcReturn * 100).toFixed(2), "% real).", React.createElement("br", null), React.createElement("br", null), retires ? React.createElement(React.Fragment, null, "This is the sequence-of-returns question, and it's the one the deterministic chart above can't answer: two portfolios with the same average return can end very differently depending on ", React.createElement("i", null, "when"), " the bad years land. A crash early in retirement is withdrawn from as well as fallen through, and it may never recover. That's why raising volatility cuts the survival number far more than it moves the median line \u2014 the median barely notices, and the plans that fail are the ones that met a bad decade first.") : React.createElement(React.Fragment, null, "No retirement falls inside this horizon yet, so nothing is being withdrawn and the percentage above is the older question \u2014 whether the invested portfolio alone ever reaches the FI number. Set a retirement date, or reach independence inside 40 years, and this becomes a test of whether the money lasts."), React.createElement("br", null), React.createElement("br", null), "Withdrawals are held constant in today's dollars, which is the assumption behind the 4% rule and the one your withdrawal rate already implies. It models no spending flexibility \u2014 a real retiree cuts back after a bad year, and that alone rescues many of the runs counted as failures here. Treat the number as a stress test, not a verdict.")), React.createElement("div", {
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
    label: "FI target (today's dollars)",
    prefix: "$",
    value: Math.round(fireN),
    readOnly: true
  })), React.createElement("div", {
    className: "assume"
  }, "Based on ", fmtMoney(D.sim.annualExp / 12), "/mo of long-run living expenses \u2014 ", fmtBig(D.sim.annualExp), " a year. Only expenses count here, not transfers or debt payments.", D.sim.endingSoon.length > 0 && React.createElement(React.Fragment, null, " Excluded because they end before then: ", D.sim.endingSoon.map(e => e.category).join(", "), " \u2014 worth ", fmtBig((D.sim.annualExpNow - D.sim.annualExp) * (100 / (n0(settings.withdrawalRate) || 4))), " off the target."), D.sim.guaranteedAnnual > 0 && React.createElement(React.Fragment, null, " Your guaranteed retirement income covers ", fmtBig(D.sim.guaranteedAnnual), " of that a year, leaving ", fmtBig(D.sim.annualExpNet), " for the portfolio \u2014 which is why the target line slopes: until that income starts, the target also carries the capital to cover the gap yourself.")), React.createElement("div", {
    className: "fields3",
    style: {
      gridTemplateColumns: "1fr 1fr 1fr",
      marginTop: 14
    }
  }, React.createElement(NumField, {
    label: "Tax drag on taxable investing",
    suffix: "%/yr",
    value: settings.taxDrag,
    onChange: v => setS("taxDrag", n0(v))
  }), React.createElement(NumField, {
    label: "Tax rate on withdrawals",
    suffix: "%",
    value: settings.retireTaxRate,
    onChange: v => setS("retireTaxRate", n0(v))
  }), React.createElement(NumField, {
    label: "Birth year (optional)",
    value: settings.birthYear,
    onChange: v => setS("birthYear", v)
  })), React.createElement("div", {
    className: "caphint"
  }, "The independence date is measured against what your balance sheet is worth ", React.createElement("i", null, "to spend"), ": a tax-deferred dollar is docked ", n0(settings.retireTaxRate), "% because the withdrawal is taxed, and taxable investments lose ", n0(settings.taxDrag), "%/yr of return to tax on distributions. Set each account's treatment on the Accounts tab. A birth year is only used to work out when retirement accounts open up \u2014 leave it blank and every account is treated as reachable."), D.bridge && React.createElement("div", {
    className: "caphint" + (D.bridge.gap > 0 ? " warn-txt" : ""),
    style: {
      marginTop: 8
    }
  }, D.bridge.gap > 0 ? React.createElement(React.Fragment, null, "Bridge gap: independence lands about ", fmtDur(Math.round(D.bridge.years * 12)), " before your retirement accounts open at 59\xBD. Living on ", fmtBig(D.sim.annualExpNet), "/yr until then needs ", fmtBig(D.bridge.need), " you can actually reach, and only ", fmtBig(D.bridge.reachable), " of your money is reachable that early \u2014 ", React.createElement("b", null, fmtBig(D.bridge.gap), " short"), ". Taxable investing, a Roth contribution ladder or a later date all close it.") : React.createElement(React.Fragment, null, "Bridge covered: independence lands about ", fmtDur(Math.round(D.bridge.years * 12)), " before 59\xBD, and the ", fmtBig(D.bridge.reachable), " outside your retirement accounts covers the ", fmtBig(D.bridge.need), " of spending until they open.")), React.createElement("label", {
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