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
import { AlertTriangle, Plus, Trash2 } from "../icons.js";
import { Stat, LoanCard, Seg, Tip } from "../components.js";
import { fmtMoney, fmtBig, fmtDate, fmtDur, n0 } from "../format.js";
import { sampleRange } from "../useScope.js";
export function DebtTab({
  D,
  chart,
  scDebt,
  settings,
  setS,
  ask,
  runBreakeven,
  debts,
  debtPayments,
  payments,
  hasPay,
  upDebtField,
  upDebtBal,
  rmDebt,
  addDebt,
  logLoan,
  setLogLoan,
  logAmt,
  setLogAmt,
  logDate,
  setLogDate,
  addPayment,
  rmPayment,
  nameOf
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
  const noDebt = D.totalLoans <= 0;
  const covers = D.mDp > D.monthlyInterest + 1e-9;
  const snowball = settings.payoffOrder === "snowball";
  const rankBy = snowball ? (a, b) => n0(a.balance) - n0(b.balance) || n0(b.apr) - n0(a.apr) : (a, b) => n0(b.apr) - n0(a.apr) || n0(a.balance) - n0(b.balance);
  const rankMap = {};
  D.loans.filter(l => n0(l.balance) > 0).sort(rankBy).forEach((l, i) => rankMap[l.id] = i + 1);
  const origTotal = debts.reduce((s, l) => s + Math.max(n0(l.originalBalance), n0(l.balance)), 0);
  const paidDown = Math.max(0, origTotal - D.totalDebt);
  const pct = origTotal > 0 ? Math.min(100, paidDown / origTotal * 100) : 0;
  const paidToDate = payments.reduce((s, p) => s + n0(p.amount), 0);
  const w2m = w => Math.round(w / 4.348);
  return React.createElement(React.Fragment, null, !noDebt && React.createElement("div", {
    className: "sgrid rise",
    style: {
      marginBottom: 16
    }
  }, React.createElement(Stat, {
    k: "Debt-free<br/>date",
    v: D.sim.debtFree != null ? fmtDate(w2date(D.sim.debtFree)) : "40y+",
    accent: "amber"
  }), React.createElement(Stat, {
    k: "Total interest<br/>you'll pay",
    v: fmtBig(D.sim.interest)
  }), React.createElement(Stat, {
    k: "Interest saved<br/>vs minimums",
    v: fmtBig(D.interestSaved),
    accent: "green"
  }), React.createElement(Stat, {
    k: "Time saved<br/>vs minimums",
    v: fmtDur(w2m(D.wksSaved)),
    accent: "green"
  })), noDebt && React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "empty",
    style: {
      color: "var(--green)",
      fontSize: 14
    }
  }, "No active debt \u2014 nicely done.", React.createElement("br", null), "Add a loan below to model one.")), !covers && !noDebt && React.createElement("div", {
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
  }, "Payments don't cover interest"), React.createElement("div", {
    className: "wb"
  }, "You're paying ", fmtMoney(D.mDp), "/mo against ", fmtMoney(D.monthlyInterest), "/mo of interest, so balances grow. Raise a payment in Cash flow."))), !noDebt && React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Balance decay"), ranges(scDebt, maxW)), React.createElement("div", _extends({
    className: "scope-wrap",
    ref: scDebt.ref
  }, scDebt.handlers), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 278
  }, React.createElement(ComposedChart, {
    data: sampleRange(D.debtCurve, scDebt.lo, scDebt.hi, 320),
    margin: {
      top: 14,
      right: 12,
      bottom: 0,
      left: 6
    }
  }, React.createElement("defs", null, React.createElement("linearGradient", {
    id: "planFill",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, React.createElement("stop", {
    offset: "0%",
    stopColor: "#F5A623",
    stopOpacity: 0.28
  }), React.createElement("stop", {
    offset: "100%",
    stopColor: "#F5A623",
    stopOpacity: 0
  }))), React.createElement(CartesianGrid, {
    stroke: "var(--line)",
    strokeDasharray: "2 4"
  }), React.createElement(XAxis, axisProps(scDebt)), React.createElement(YAxis, yProps), React.createElement(Tooltip, {
    content: p => React.createElement(Tip, _extends({}, p, {
      start: start,
      rows: [{
        key: "plan",
        name: "Your payments",
        color: "var(--amber)"
      }, {
        key: "min",
        name: "Minimums only",
        color: "var(--cyan)"
      }]
    })),
    cursor: {
      stroke: "var(--line2)"
    }
  }), D.sim.debtFree != null && React.createElement(ReferenceLine, {
    x: D.sim.debtFree,
    stroke: "var(--amber)",
    strokeDasharray: "3 3",
    label: {
      value: "DEBT-FREE",
      position: "top",
      fill: "var(--amber)",
      fontSize: 9.5,
      fontFamily: "var(--mono)"
    }
  }), React.createElement(Area, {
    type: "monotone",
    dataKey: "plan",
    stroke: "var(--amber)",
    strokeWidth: 2.5,
    fill: "url(#planFill)",
    dot: false,
    activeDot: {
      r: 4,
      fill: "var(--amber)",
      stroke: "none"
    },
    isAnimationActive: false
  }), React.createElement(Line, {
    type: "monotone",
    dataKey: "min",
    stroke: "var(--cyan)",
    strokeWidth: 1.6,
    strokeDasharray: "5 4",
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
      borderTopColor: "var(--amber)",
      borderTopWidth: 3
    }
  }), "Your actual payments"), React.createElement("span", {
    className: "lg"
  }, React.createElement("span", {
    className: "swatch",
    style: {
      borderTopColor: "var(--cyan)",
      borderTopStyle: "dashed"
    }
  }), "Minimums only")), React.createElement("div", {
    className: "assume"
  }, "The amber line is driven by the payments you've set in Cash flow, extrapolated forward \u2014 ", fmtMoney(D.mDp), "/mo across ", debtPayments.length, " payment", debtPayments.length === 1 ? "" : "s", ". Change them there and this moves.")), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Loans \xB7 payoff order"), React.createElement(Seg, {
    value: snowball ? "snowball" : "avalanche",
    options: [{
      v: "avalanche",
      label: "Highest rate"
    }, {
      v: "snowball",
      label: "Smallest first"
    }],
    onChange: v => setS("payoffOrder", v)
  })), React.createElement("div", {
    className: "caphint",
    style: {
      marginBottom: 10
    }
  }, snowball ? "Snowball: whatever a payment doesn't need rolls to your smallest remaining balance, so loans disappear one by one." : "Avalanche: whatever a payment doesn't need rolls to your highest-rate remaining loan, which costs the least interest overall.", D.strategy && (() => {
    const s = D.strategy,
      other = s.other === "snowball" ? "smallest-balance-first" : "highest-rate-first";
    const bits = [];
    if (Math.abs(s.interestDelta) > 1) bits.push(`${s.interestDelta > 0 ? "cost" : "save"} ${fmtMoney(Math.abs(s.interestDelta))} in interest`);
    if (Math.abs(s.firstDelta) >= 4) bits.push(`clear your first loan ${fmtDur(w2m(Math.abs(s.firstDelta)))} ${s.firstDelta > 0 ? "later" : "sooner"}`);
    if (Math.abs(s.freeDelta) >= 4) bits.push(`finish everything ${fmtDur(w2m(Math.abs(s.freeDelta)))} ${s.freeDelta > 0 ? "later" : "sooner"}`);
    return bits.length ? React.createElement(React.Fragment, null, " Switching to ", other, " would ", bits.join(", "), ".") : React.createElement(React.Fragment, null, " Switching to ", other, " would make no meaningful difference to your plan.");
  })()), D.loans.map(l => React.createElement(LoanCard, {
    key: l.id,
    loan: l,
    rank: rankMap[l.id],
    payoffMonth: D.sim.payoffWeek[l.id] != null ? w2m(D.sim.payoffWeek[l.id]) : null,
    start: start,
    hasPayments: hasPay(l.id),
    onField: upDebtField,
    onBalance: upDebtBal,
    onRemove: rmDebt
  })), React.createElement("button", {
    className: "btn btn-add",
    onClick: addDebt
  }, React.createElement(Plus, {
    size: 15
  }), "Add a loan"), React.createElement("div", {
    className: "assume"
  }, "Describe a loan either way \u2014 type the minimum payment and it shows how long that takes, or switch to \"by term\" and the payment is worked out for you. Either way the minimum here only draws the \"minimums only\" comparison line; what you actually pay is set in Cash flow.", D.cards.length > 0 ? " Credit cards are managed in Cash flow — they still count against your net worth." : "", " For a loan in deferment, set \"interest starts\" to when it kicks in \u2014 subsidised loans don't accrue while you're enrolled, unsubsidised ones do, so leave those blank.")), !noDebt && React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Next $200: debt or investing?"), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => runBreakeven(200),
    disabled: ask.running
  }, ask.running ? "Working…" : ask.breakeven ? "Re-run" : "Compare")), ask.breakeven ? (() => {
    const b = ask.breakeven;
    const debtWins = b.debtNw >= b.investNw;
    const gap = Math.abs(b.debtNw - b.investNw);
    const wash = gap < Math.max(b.debtNw, b.investNw) * 0.01;
    const sooner = b.debtFreeWithDebt != null && b.debtFreeWithInvest != null ? b.debtFreeWithInvest - b.debtFreeWithDebt : 0;
    return React.createElement(React.Fragment, null, React.createElement("div", {
      className: "caphint"
    }, React.createElement("b", {
      style: {
        color: "var(--amber)"
      }
    }, b.loanName, " costs ", b.loanApr.toFixed(2), "% "), "\u2014 ", b.realApr.toFixed(2), "% after inflation \u2014 against ", React.createElement("b", {
      style: {
        color: "var(--green)"
      }
    }, b.realReturn.toFixed(2), "%"), " real from investing. On rates alone, ", b.realApr > b.realReturn ? "the debt wins" : "investing wins", "."), React.createElement("div", {
      className: "caphint",
      style: {
        marginTop: 8
      }
    }, "Run both ways through the actual plan, ", fmtMoney(b.amount), "/mo for the whole projection: paying the debt leaves ", React.createElement("b", null, fmtBig(b.debtNw)), ", investing leaves ", React.createElement("b", null, fmtBig(b.investNw)), " by ", fmtDate(w2date(b.week)), ".", " ", wash ? React.createElement("b", null, "That's within a percent of each other \u2014 on this plan it's a wash, so pick on how you'd rather feel about it.") : React.createElement("b", {
      style: {
        color: debtWins ? "var(--amber)" : "var(--green)"
      }
    }, debtWins ? "Paying the debt" : "Investing", " comes out ", fmtMoney(gap), " ahead."), sooner > 1 ? ` Paying the debt also clears it ${fmtDur(w2m(sooner))} sooner, which the net worth figure doesn't capture.` : ""), React.createElement("div", {
      className: "assume"
    }, "Rates are the argument; the two projections are the evidence, and they can disagree \u2014 freeing a payment early changes what the rest of the plan has to work with. Neither prices the part nobody can model: being rid of a payment is worth something on its own, and a guaranteed ", b.loanApr.toFixed(2), "% return is certain in a way a market one isn't."));
  })() : React.createElement("div", {
    className: "caphint"
  }, "Compares sending the same ", fmtMoney(200), "/mo to your highest-rate loan against investing it, by running the whole plan both ways. Two full projections, so it runs on demand.")), !noDebt && React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Progress")), React.createElement("div", {
    className: "prog-nums"
  }, React.createElement("div", {
    className: "prog-pct"
  }, pct.toFixed(1), "%"), React.createElement("div", {
    className: "prog-rem"
  }, fmtMoney(paidDown), " paid down", React.createElement("br", null), React.createElement("b", null, fmtMoney(D.totalDebt)), " to go")), React.createElement("div", {
    className: "track"
  }, React.createElement("div", {
    className: "fill",
    style: {
      width: pct + "%"
    }
  })), React.createElement("div", {
    className: "budget",
    style: {
      marginTop: 10
    }
  }, "Logged payments to date: ", React.createElement("b", {
    style: {
      color: "var(--green)"
    }
  }, fmtMoney(paidToDate))), React.createElement("div", {
    className: "modal-row"
  }, React.createElement("select", {
    value: logLoan,
    onChange: e => setLogLoan(e.target.value),
    style: {
      flex: "1 1 100%"
    },
    "aria-label": "Loan"
  }, React.createElement("option", {
    value: ""
  }, "Which loan?"), debts.map(l => React.createElement("option", {
    key: l.id,
    value: l.id
  }, l.name))), React.createElement("input", {
    type: "number",
    inputMode: "decimal",
    placeholder: "$ amount",
    value: logAmt,
    onChange: e => setLogAmt(e.target.value),
    "aria-label": "Amount",
    style: {
      flex: 1,
      minWidth: 110
    }
  }), React.createElement("input", {
    type: "date",
    value: logDate,
    onChange: e => setLogDate(e.target.value),
    "aria-label": "Date"
  }), React.createElement("button", {
    className: "btn btn-amber",
    style: {
      flex: "1 1 100%",
      justifyContent: "center"
    },
    onClick: addPayment
  }, React.createElement(Plus, {
    size: 15
  }), "Log payment")), React.createElement("div", {
    style: {
      marginTop: 14,
      display: "flex",
      flexDirection: "column",
      gap: 2,
      maxHeight: 200,
      overflow: "auto"
    }
  }, payments.length === 0 ? React.createElement("div", {
    className: "empty"
  }, "No payments logged yet.", React.createElement("br", null), "Update each loan's balance from your statement to keep the forecast sharp.") : payments.slice(0, 40).map(p => React.createElement("div", {
    key: p.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 4px",
      borderBottom: "1px solid var(--line)",
      fontFamily: "var(--mono)",
      fontSize: 12.5
    }
  }, React.createElement("span", {
    style: {
      color: "var(--faint)",
      fontSize: 11,
      width: 52
    }
  }, p.date?.slice(5)), React.createElement("span", {
    style: {
      color: "var(--muted)",
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, nameOf(p.loanId)), React.createElement("span", {
    style: {
      color: "var(--green)",
      fontWeight: 600
    }
  }, fmtMoney(p.amount)), React.createElement("button", {
    className: "icon-btn",
    onClick: () => rmPayment(p.id),
    "aria-label": "Delete"
  }, React.createElement(Trash2, {
    size: 13
  })))))));
}