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
import { AlertTriangle, Zap } from "../icons.js";
import { Stat, NumField, Seg, Donut, Tip, MultiTip } from "../components.js";
import { fmtMoney, fmtBig, fmtDate, fmtDur, n0 } from "../format.js";
import { sampleRange } from "../useScope.js";
function milestoneShift(label, weekWith, weekWithout) {
  if (weekWith == null && weekWithout == null) return null;
  if (weekWith != null && weekWithout == null) return `brings ${label} inside 40 years`;
  if (weekWith == null && weekWithout != null) return `pushes ${label} beyond 40 years`;
  const wks = weekWithout - weekWith;
  if (Math.abs(wks) < 1) return null;
  return `${label} ${fmtDur(Math.max(1, Math.round(Math.abs(wks) * 12 / 52.1775)))} ${wks > 0 ? "sooner" : "later"}`;
}
function SolveAnswer({
  solve,
  knob,
  target,
  fmtWeek
}) {
  if (!solve) return null;
  const amount = React.createElement("b", {
    style: {
      color: "var(--amber)"
    }
  }, fmtMoney(solve.amount), "/mo");
  const achieved = target.kind === "date" ? fmtWeek(solve.achieved) : `${Math.round(solve.achieved)}%`;
  if (solve.reason === "already") return React.createElement(React.Fragment, null, "You're already there \u2014 this plan meets that without changing ", knob.label.toLowerCase(), " at all (", achieved, ").");
  if (solve.reason === "noEffect") return React.createElement(React.Fragment, null, "Changing ", knob.label.toLowerCase(), " doesn't move that date at all: the money it frees isn't routed there. Add or grow the payment that would carry it.");
  if (solve.reason === "unreachable") return React.createElement(React.Fragment, null, "No amount inside ", fmtMoney(knob.max), "/mo gets there \u2014 the best it manages is ", achieved, ". Try a later date, or a different lever.");
  if (solve.reason === "anything") return React.createElement(React.Fragment, null, "Any amount up to ", fmtMoney(knob.max), "/mo still meets that.");
  return React.createElement(React.Fragment, null, knob.direction === "min" ? React.createElement(React.Fragment, null, "You'd need ", amount) : React.createElement(React.Fragment, null, "You could go up to ", amount), " \u2014 that lands on ", achieved, ".");
}
export function OverviewTab({
  D,
  accounts,
  debts,
  chart,
  scNW,
  scBal,
  fireN,
  settings,
  setS,
  ask,
  setAsk,
  runSolve,
  runTornado,
  knobs,
  targets,
  openScenarios
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
  const askKnob = knobs.find(k => k.v === ask.knob) || knobs[0];
  const askTarget = targets.find(t => t.v === ask.target) || targets[0];
  const gap = D.hasHypo ? D.nwGapAt(scNW.hi) : 0;
  const shifts = D.hasHypo ? [milestoneShift("financial independence", D.simWith.fire, D.simWithout.fire), milestoneShift("debt-free", D.simWith.debtFree, D.simWithout.debtFree)].filter(Boolean) : [];
  return React.createElement(React.Fragment, null, React.createElement("div", {
    className: "sgrid wide5 rise",
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
    k: "Cash runway<br/>(no income)",
    v: D.runway == null ? "—" : fmtDur(Math.round(D.runway)),
    accent: D.runway != null && D.runway < 3 ? "red" : "cyan"
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
  }, "You're ", fmtMoney(-D.surplus), "/mo in the red before debt or investing. Adjust items in Cash flow."))), D.runway != null && D.runway < 3 && React.createElement("div", {
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
  }, "Thin cash runway"), React.createElement("div", {
    className: "wb"
  }, "Your cash and savings cover ", fmtDur(Math.round(D.runway)), " of spending with no income at all \u2014 ", fmtMoney(D.liquid), " against ", fmtMoney(D.mExp), "/mo. Three to six months is the usual floor before investing harder."))), !(D.surplus < 0) && D.negAcct && React.createElement("div", {
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
    data: sampleRange(D.viewSeries, scNW.lo, scNW.hi, 320).map(s => ({
      w: s.w,
      nw: s.nw,
      debt: s.debt,
      invest: s.invest,
      fi: s.fi,
      cmp: s.cmp
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
  }), D.compare && React.createElement(Line, {
    type: "monotone",
    dataKey: "cmp",
    stroke: "var(--muted)",
    strokeWidth: 1.6,
    strokeDasharray: "5 4",
    dot: false,
    isAnimationActive: false
  }), D.actuals.length > 1 && React.createElement(Line, {
    type: "monotone",
    dataKey: "actual",
    stroke: "var(--cyan)",
    strokeWidth: 2,
    dot: {
      r: 2.5,
      fill: "var(--cyan)",
      stroke: "none"
    },
    connectNulls: true,
    isAnimationActive: false
  })))), ZHINT, React.createElement("div", {
    className: "hypo"
  }, React.createElement("label", {
    className: "switch"
  }, React.createElement("input", {
    type: "checkbox",
    checked: settings.hypotheticals !== false,
    onChange: e => setS("hypotheticals", e.target.checked)
  }), React.createElement("span", {
    className: "swtrack"
  }, React.createElement("span", {
    className: "swknob"
  })), React.createElement("span", {
    className: "sw-label"
  }, "Include future promotions")), D.hasHypo ? React.createElement("div", {
    className: "caphint",
    style: {
      marginTop: 8
    }
  }, gap >= 0 ? "Your planned promotions add " : "Your planned salary changes cost ", React.createElement("b", {
    style: {
      color: gap >= 0 ? "var(--green)" : "var(--red)"
    }
  }, fmtMoney(Math.abs(gap))), " of net worth by ", fmtDate(w2date(scNW.hi)), shifts.length > 0 ? ` · ${shifts.join(" · ")}` : "", ".", " ", settings.hypotheticals !== false ? "Switch them off to see the same plan on today's salary." : "Currently projecting on today's salary, with them excluded.", " ", "Every chart and date on every tab follows this toggle.") : React.createElement("div", {
    className: "caphint",
    style: {
      marginTop: 8
    }
  }, "No promotions planned yet. Add one under Cash flow \u2192 Income \u2192 \u201CPromotions & salary changes\u201D, and this will show what it's worth.")), React.createElement("div", {
    className: "hypo",
    style: {
      marginTop: 14
    }
  }, React.createElement("div", {
    className: "fields3",
    style: {
      gridTemplateColumns: "1fr 1fr"
    }
  }, React.createElement(NumField, {
    label: "Inflation (annual)",
    suffix: "%",
    value: settings.inflation,
    onChange: v => setS("inflation", n0(v))
  })), React.createElement("label", {
    className: "switch"
  }, React.createElement("input", {
    type: "checkbox",
    checked: !!settings.showNominal,
    onChange: e => setS("showNominal", e.target.checked)
  }), React.createElement("span", {
    className: "swtrack"
  }, React.createElement("span", {
    className: "swknob"
  })), React.createElement("span", {
    className: "sw-label"
  }, "Show future dollars instead of today's")), React.createElement("div", {
    className: "caphint",
    style: {
      marginTop: 8
    }
  }, "Every rate you enter is nominal, and the projection runs in today's money: a 7% return against ", n0(settings.inflation), "% inflation compounds at ", ((1.07 / (1 + n0(settings.inflation) / 100) - 1) * 100).toFixed(2), "% here, and your spending stays constant in real terms. Loan payments are the exception \u2014 a fixed payment doesn't rise with prices, so it quietly gets easier to make. The toggle re-labels the charts in the money of the day; it moves no dates, because the independence target inflates alongside the balances.")), D.drift && React.createElement("div", {
    className: "caphint",
    style: {
      marginTop: 10
    }
  }, (() => {
    const when = fmtDate(new Date(D.drift.at));
    const bits = [];
    if (D.drift.nw != null) {
      const moved = D.netWorth - D.drift.nw;
      bits.push(React.createElement("span", {
        key: "nw"
      }, "net worth is ", React.createElement("b", {
        style: {
          color: moved >= 0 ? "var(--green)" : "var(--red)"
        }
      }, fmtMoney(Math.abs(moved)), " ", moved >= 0 ? "up" : "down")));
    }
    const shifted = (label, then, now) => {
      if (!then || !now) return null;
      const months = Math.round((new Date(then) - new Date(now)) / 86400000 / 30.44);
      if (Math.abs(months) < 1) return React.createElement("span", {
        key: label
      }, label, " hasn't moved");
      return React.createElement("span", {
        key: label
      }, label, " is ", React.createElement("b", {
        style: {
          color: months > 0 ? "var(--green)" : "var(--red)"
        }
      }, fmtDur(Math.abs(months)), " ", months > 0 ? "sooner" : "later"));
    };
    const fi = shifted("independence", D.drift.fire, D.sim.fire == null ? null : w2date(D.sim.fire).toISOString());
    const df = shifted("debt-free", D.drift.debtFree, D.sim.debtFree == null ? null : w2date(D.sim.debtFree).toISOString());
    [fi, df].forEach(x => x && bits.push(x));
    if (!bits.length) return null;
    return React.createElement(React.Fragment, null, "Since ", when, ": ", bits.map((b, i) => React.createElement("span", {
      key: i
    }, i ? ", " : "", b)), ". The app keeps a copy of your plan once a day, which is where this comes from \u2014 and the cyan points are net worth as it was actually recorded.");
  })()), React.createElement("div", {
    className: "assume"
  }, "Today's dollars \xB7 returns, rates and spending held constant in real terms \xB7 a projection, not a guarantee or financial advice.")), React.createElement("div", {
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
    data: sampleRange(D.viewSeries, scBal.lo, scBal.hi, 320).map(s => ({
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
  }, "What would it take?"), React.createElement("div", {
    className: "psub"
  }, "runs your plan, in reverse")), React.createElement("div", {
    className: "askrow"
  }, React.createElement(Seg, {
    value: ask.target,
    options: targets.map(t => ({
      v: t.v,
      label: t.label
    })),
    onChange: v => setAsk(a => ({
      ...a,
      target: v,
      value: "",
      solve: null
    }))
  })), React.createElement("div", {
    className: "askrow",
    style: {
      marginTop: 10
    }
  }, askTarget.kind === "date" ? React.createElement("input", {
    type: "date",
    value: ask.value,
    onChange: e => setAsk(a => ({
      ...a,
      value: e.target.value
    })),
    "aria-label": "Target date"
  }) : React.createElement("div", {
    className: "pctbox"
  }, React.createElement("input", {
    type: "number",
    inputMode: "decimal",
    value: ask.value,
    onChange: e => setAsk(a => ({
      ...a,
      value: e.target.value
    })),
    "aria-label": "Target percentage",
    placeholder: "90"
  }), React.createElement("span", {
    className: "u"
  }, "%")), React.createElement("span", {
    className: "cap"
  }, "by changing"), React.createElement("select", {
    value: ask.knob,
    onChange: e => setAsk(a => ({
      ...a,
      knob: e.target.value,
      solve: null
    })),
    "aria-label": "What to change",
    style: {
      minWidth: 150
    }
  }, knobs.map(k => React.createElement("option", {
    key: k.v,
    value: k.v
  }, k.label))), React.createElement("button", {
    className: "btn btn-amber",
    onClick: runSolve,
    disabled: !ask.value || ask.running
  }, React.createElement(Zap, {
    size: 14
  }), ask.running ? "Solving…" : "Solve")), React.createElement("div", {
    className: "caphint",
    style: {
      marginTop: 10
    }
  }, ask.error ? "That didn't come back with an answer — try a different target." : ask.solve ? React.createElement(SolveAnswer, {
    solve: ask.solve,
    knob: askKnob,
    target: askTarget,
    fmtWeek: w => fmtDate(w2date(w))
  }) : React.createElement(React.Fragment, null, "Pick a date or a percentage, and this searches for the ", askKnob.label.toLowerCase(), " that meets it. It re-runs the whole projection twenty-odd times, so give it a moment.")), React.createElement("div", {
    className: "phead",
    style: {
      marginTop: 18
    }
  }, React.createElement("div", {
    className: "ptitle"
  }, "What moves the date"), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: runTornado,
    disabled: ask.running
  }, ask.running ? "Working…" : ask.tornado ? "Re-run" : "Run sensitivity")), ask.tornado ? (() => {
    const rows = ask.tornado.rows;
    const worst = Math.max(1, ...rows.map(r => Math.abs(r.months)));
    return React.createElement(React.Fragment, null, React.createElement("div", {
      className: "tornado"
    }, rows.map(r => React.createElement("div", {
      className: "tor-row",
      key: r.v
    }, React.createElement("span", {
      className: "tor-label"
    }, r.label), React.createElement("span", {
      className: "tor-track"
    }, React.createElement("span", {
      className: "tor-bar",
      style: {
        width: Math.abs(r.months) / worst * 50 + "%",
        marginLeft: r.months < 0 ? 50 - Math.abs(r.months) / worst * 50 + "%" : "50%",
        background: r.months < 0 ? "var(--green)" : "var(--red)"
      }
    })), React.createElement("span", {
      className: "tor-val mono"
    }, r.months > 0 ? "+" : "", Math.round(r.months), " mo")))), React.createElement("div", {
      className: "caphint"
    }, "Each row is one change on its own, measured against your independence date \u2014 green pulls it in, red pushes it out. The ordering is the useful part: it's usually not the one you'd guess."));
  })() : React.createElement("div", {
    className: "caphint"
  }, "Nudges each input on its own and reports how far your independence date moves. Seven full projections, so it runs on demand rather than as you type.")), D.timeline.length > 0 && React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "What happens when"), React.createElement("div", {
    className: "psub"
  }, D.timeline.length, " milestones ahead")), React.createElement("div", {
    className: "timeline"
  }, D.timeline.map((m, i) => React.createElement("div", {
    className: "tl-row tl-" + m.kind,
    key: i
  }, React.createElement("span", {
    className: "tl-date mono"
  }, fmtDate(m.date)), React.createElement("span", {
    className: "tl-dot"
  }), React.createElement("span", {
    className: "tl-body"
  }, React.createElement("b", null, m.label), m.detail ? React.createElement("span", {
    className: "tl-detail"
  }, " \u2014 ", m.detail) : null)))), React.createElement("div", {
    className: "assume"
  }, "Every date here comes from the same projection as the charts above, so they move together. Dates beyond the 40-year horizon aren't listed at all rather than guessed at.")), D.compare && React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Compared with \u201C", D.compare.name, "\u201D"), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: openScenarios
  }, "Change")), React.createElement("div", {
    className: "caphint",
    style: {
      marginBottom: 10
    }
  }, "By ", fmtDate(w2date(D.maxW)), " this plan is ", React.createElement("b", {
    style: {
      color: D.compare.nwGap >= 0 ? "var(--green)" : "var(--red)"
    }
  }, fmtMoney(Math.abs(D.compare.nwGap)), " ", D.compare.nwGap >= 0 ? "ahead of" : "behind"), " it. The dashed line on the net worth chart is that plan."), React.createElement("div", {
    className: "timeline"
  }, D.compare.rows.map((r, i) => React.createElement("div", {
    className: "tl-row",
    key: i
  }, React.createElement("span", {
    className: "tl-date mono"
  }, r.date ? fmtDate(r.date) : "—"), React.createElement("span", {
    className: "tl-dot"
  }), React.createElement("span", {
    className: "tl-body"
  }, React.createElement("b", null, r.label), React.createElement("span", {
    className: "tl-detail"
  }, r.deltaWeeks == null ? r.week == null ? ` — only “${D.compare.name}” gets there, ${fmtDate(r.otherDate)}` : " — only this plan gets there" : Math.abs(r.deltaWeeks) < 2 ? " — the same either way" : ` — ${fmtDur(Math.abs(Math.round(r.deltaMonths)))} ${r.deltaWeeks < 0 ? "sooner" : "later"} than “${D.compare.name}”`)))))), React.createElement("div", {
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