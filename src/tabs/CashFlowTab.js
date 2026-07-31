function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} = Recharts;
import { Plus, Trash2, ArrowRight } from "../icons.js";
import { Stat, NumField, Seg, EndDate, Tip } from "../components.js";
import { fmtMoney, n0, num, OPY, parseDate, RECUR, recurLabel } from "../format.js";
import { payrollOf, bonusOf, perCheck, effectiveTaxRate } from "../payroll.js";
import { isCard } from "../seeds.js";
import { sampleRange } from "../useScope.js";
export function CashFlowTab({
  D,
  chart,
  scCF,
  income,
  accounts,
  expenses,
  debts,
  debtPayments,
  transfers,
  upInc,
  rmInc,
  addInc,
  addSplit,
  upSplit,
  rmSplit,
  addPreTax,
  upPreTax,
  rmPreTax,
  setMatch,
  upMatch,
  setBonus,
  upBonus,
  addChange,
  upChange,
  rmChange,
  upExp,
  rmExp,
  addExp,
  upDebtField,
  upDebtBal,
  rmDebt,
  addCardWithPayment,
  upDp,
  rmDp,
  addDp,
  upTr,
  rmTr,
  addTr
}) {
  const {
    ranges,
    ZHINT,
    axisProps,
    yProps,
    start,
    maxW
  } = chart;
  const dp = Math.max(0, D.mDp),
    iv = Math.max(0, D.mTr),
    lo = Math.max(0, D.leftover);
  const segs = [{
    name: "Living costs",
    value: D.mExp,
    color: "#E8695B"
  }, {
    name: "Debt payments",
    value: dp,
    color: "#B98CE8"
  }, {
    name: "Investing",
    value: iv,
    color: "#5CCB8B"
  }, {
    name: "Left in cash",
    value: lo,
    color: "#F5A623"
  }].filter(s => s.value > 0);
  const denom = Math.max(D.mInc, D.mExp + dp + iv + lo) || 1;
  return React.createElement(React.Fragment, null, React.createElement("div", {
    className: "sgrid rise",
    style: {
      marginBottom: 16
    }
  }, React.createElement(Stat, {
    k: "Take-home<br/>per month",
    v: fmtMoney(D.mInc),
    accent: "green"
  }), React.createElement(Stat, {
    k: "Living<br/>expenses",
    v: fmtMoney(D.mExp),
    accent: "red"
  }), React.createElement(Stat, {
    k: D.mPreTax > 0 ? "401k in<br/>(incl. match)" : "Surplus after<br/>living costs",
    v: D.mPreTax > 0 ? fmtMoney(D.mPreTax) : fmtMoney(D.surplus),
    accent: D.mPreTax > 0 ? "cyan" : D.surplus >= 0 ? "amber" : "red"
  }), React.createElement(Stat, {
    k: "Savings<br/>rate",
    v: Math.round(D.savingsRate) + "%",
    accent: "cyan"
  })), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Cash flow, week by week"), ranges(scCF, Math.min(maxW, 312))), React.createElement("div", _extends({
    className: "scope-wrap",
    ref: scCF.ref
  }, scCF.handlers), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 272
  }, React.createElement(ComposedChart, {
    data: sampleRange(D.cf, scCF.lo, scCF.hi, 320),
    margin: {
      top: 14,
      right: 12,
      bottom: 0,
      left: 6
    }
  }, React.createElement(CartesianGrid, {
    stroke: "var(--line)",
    strokeDasharray: "2 4"
  }), React.createElement(XAxis, axisProps(scCF)), React.createElement(YAxis, yProps), React.createElement(Tooltip, {
    content: p => React.createElement(Tip, _extends({}, p, {
      start: start,
      rows: [{
        key: "income",
        name: "In",
        color: "var(--green)"
      }, {
        key: "spend",
        name: "Out",
        color: "var(--red)"
      }, {
        key: "net",
        name: "Net",
        color: "var(--violet)"
      }, {
        key: "smooth",
        name: "Monthly avg",
        color: "var(--amber)"
      }]
    })),
    cursor: {
      fill: "rgba(126,148,171,0.06)"
    }
  }), React.createElement(ReferenceLine, {
    y: 0,
    stroke: "var(--line2)"
  }), React.createElement(Bar, {
    dataKey: "net",
    radius: [2, 2, 0, 0],
    isAnimationActive: false
  }, sampleRange(D.cf, scCF.lo, scCF.hi, 320).map((e, i) => React.createElement(Cell, {
    key: i,
    fill: e.net >= 0 ? "rgba(185,140,232,0.42)" : "rgba(232,105,91,0.5)"
  }))), React.createElement(Line, {
    type: "monotone",
    dataKey: "income",
    stroke: "var(--green)",
    strokeWidth: 1.4,
    dot: false,
    isAnimationActive: false
  }), React.createElement(Line, {
    type: "monotone",
    dataKey: "spend",
    stroke: "var(--red)",
    strokeWidth: 1.3,
    dot: false,
    isAnimationActive: false
  }), React.createElement(Line, {
    type: "monotone",
    dataKey: "smooth",
    stroke: "var(--amber)",
    strokeWidth: 2.4,
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
      borderTopColor: "var(--green)"
    }
  }), "In"), React.createElement("span", {
    className: "lg"
  }, React.createElement("span", {
    className: "swatch",
    style: {
      borderTopColor: "var(--red)"
    }
  }), "Out"), React.createElement("span", {
    className: "lg"
  }, React.createElement("span", {
    className: "dot",
    style: {
      background: "rgba(185,140,232,.7)"
    }
  }), "Weekly net"), React.createElement("span", {
    className: "lg"
  }, React.createElement("span", {
    className: "swatch",
    style: {
      borderTopColor: "var(--amber)",
      borderTopWidth: 3
    }
  }), "Monthly average")), React.createElement("div", {
    className: "assume"
  }, "The amber line smooths the weekly spikes into a rolling monthly average \u2014 the trend underneath the paycheck-and-rent sawtooth.")), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Where every dollar goes"), React.createElement("div", {
    className: "psub"
  }, "typical month")), React.createElement("div", {
    className: "flowbar"
  }, segs.map((s, i) => React.createElement("div", {
    key: i,
    className: "flowseg",
    style: {
      width: s.value / denom * 100 + "%",
      background: s.color
    },
    title: s.name
  }))), React.createElement("div", {
    className: "flowkey"
  }, segs.map((s, i) => React.createElement("span", {
    className: "fk",
    key: i
  }, React.createElement("span", {
    className: "dot",
    style: {
      background: s.color
    }
  }), s.name, " ", React.createElement("b", null, fmtMoney(s.value)), " (", Math.round(s.value / denom * 100), "%)"))), D.leftover < 0 && React.createElement("div", {
    className: "assume",
    style: {
      color: "var(--red)"
    }
  }, "Debt payments + investing exceed your surplus by ", fmtMoney(-D.leftover), "/mo \u2014 cash will draw down over time.")), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Spending by category"), React.createElement("div", {
    className: "psub"
  }, fmtMoney(D.mExp), "/mo")), D.spend.length === 0 ? React.createElement("div", {
    className: "empty"
  }, "No expenses yet.") : D.spend.map(e => React.createElement("div", {
    className: "catrow",
    key: e.id
  }, React.createElement("div", {
    className: "cattop"
  }, React.createElement("span", {
    className: "cn"
  }, e.category, React.createElement("span", {
    className: "cp"
  }, recurLabel(e.recur).toLowerCase())), React.createElement("span", {
    className: "cv"
  }, fmtMoney(e.monthly), "/mo")), React.createElement("div", {
    className: "catbar"
  }, React.createElement("div", {
    className: "catfill",
    style: {
      width: (D.mExp > 0 ? e.monthly / D.mExp * 100 : 0) + "%",
      background: e.color
    }
  }))))), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Income"), React.createElement("div", {
    className: "psub"
  }, "dated \xB7 split across accounts")), income.map(inc => {
    const amt = n0(inc.amount);
    const dist = inc.dist || [];
    let used = 0;
    for (let i = 1; i < dist.length; i++) {
      const sp = dist[i];
      const want = sp.mode === "amt" ? n0(sp.value) : amt * num(sp.value) / 100;
      used += Math.min(want, Math.max(0, amt - used));
    }
    const rest = Math.max(0, amt - used);
    return React.createElement("div", {
      className: "card",
      key: inc.id
    }, React.createElement("div", {
      className: "card-r1"
    }, React.createElement("input", {
      className: "rname",
      value: inc.name,
      onChange: e => upInc(inc.id, "name", e.target.value),
      "aria-label": "Income name"
    }), React.createElement("div", {
      className: "num-box sm"
    }, React.createElement("span", {
      className: "pfx"
    }, "$"), React.createElement("input", {
      className: "num-input",
      type: "number",
      inputMode: "decimal",
      value: inc.amount,
      onChange: e => upInc(inc.id, "amount", e.target.value),
      "aria-label": "Amount",
      style: {
        color: "var(--green)"
      }
    })), React.createElement("button", {
      className: "icon-btn",
      onClick: () => rmInc(inc.id),
      "aria-label": "Remove"
    }, React.createElement(Trash2, {
      size: 16
    }))), React.createElement("div", {
      className: "card-r2"
    }, React.createElement("input", {
      type: "date",
      value: inc.date,
      onChange: e => upInc(inc.id, "date", e.target.value),
      "aria-label": "Date"
    }), React.createElement("select", {
      value: inc.recur,
      onChange: e => upInc(inc.id, "recur", e.target.value),
      "aria-label": "Recurrence"
    }, RECUR.map(r => React.createElement("option", {
      key: r.v,
      value: r.v
    }, r.label))), React.createElement("div", {
      className: "num-box sm"
    }, React.createElement("span", {
      className: "pfx",
      style: {
        fontSize: 11
      }
    }, "raise"), React.createElement("input", {
      className: "num-input",
      type: "number",
      inputMode: "decimal",
      value: inc.raise,
      onChange: e => upInc(inc.id, "raise", e.target.value),
      "aria-label": "Annual raise",
      style: {
        width: 42,
        color: "var(--text)"
      }
    }), React.createElement("span", {
      className: "pfx",
      style: {
        fontSize: 11
      }
    }, "%/yr")), inc.recur !== "once" && React.createElement(EndDate, {
      value: inc.end,
      onChange: v => upInc(inc.id, "end", v)
    })), React.createElement("label", {
      className: "chk",
      style: {
        marginTop: 10
      }
    }, React.createElement("input", {
      type: "checkbox",
      checked: !!inc.weekdayAdj,
      onChange: e => upInc(inc.id, "weekdayAdj", e.target.checked)
    }), "If payday lands on a weekend, pay the weekday before"), React.createElement("div", {
      className: "dist"
    }, React.createElement("div", {
      className: "dist-lbl"
    }, React.createElement("span", null, "Distribute into"), React.createElement("span", null, dist.length > 1 ? fmtMoney(used) + " assigned" : "all of it")), dist.map((sp, idx) => React.createElement("div", {
      className: "dist-row",
      key: idx
    }, React.createElement("select", {
      value: sp.acctId,
      onChange: e => upSplit(inc.id, idx, "acctId", e.target.value),
      "aria-label": "Account"
    }, accounts.map(a => React.createElement("option", {
      key: a.id,
      value: a.id
    }, a.name))), idx === 0 ? React.createElement(React.Fragment, null, React.createElement("span", {
      className: "cap"
    }, "remainder"), React.createElement("span", {
      className: "remain"
    }, fmtMoney(rest)), React.createElement("span", {
      style: {
        width: 24
      }
    })) : React.createElement(React.Fragment, null, React.createElement(Seg, {
      value: sp.mode || "pct",
      options: [{
        v: "pct",
        label: "%"
      }, {
        v: "amt",
        label: "$"
      }],
      onChange: v => upSplit(inc.id, idx, "mode", v)
    }), React.createElement("div", {
      className: "pctbox"
    }, React.createElement("input", {
      type: "number",
      inputMode: "decimal",
      value: sp.value,
      onChange: e => upSplit(inc.id, idx, "value", e.target.value),
      "aria-label": "Value"
    }), React.createElement("span", {
      className: "u"
    }, sp.mode === "amt" ? "$" : "%")), React.createElement("button", {
      className: "icon-btn",
      onClick: () => rmSplit(inc.id, idx),
      "aria-label": "Remove split"
    }, React.createElement(Trash2, {
      size: 14
    }))))), React.createElement("button", {
      className: "dist-add",
      onClick: () => addSplit(inc.id)
    }, "+ Send a cut to another account")), React.createElement("div", {
      className: "dist"
    }, (() => {
      const pay = payrollOf(inc);
      const perYear = OPY[inc.recur] || 0;
      const withheld = pay.gross > 0 ? pay.gross - n0(inc.amount) - pay.employee : 0;
      const effRate = effectiveTaxRate(inc);
      return React.createElement(React.Fragment, null, React.createElement("div", {
        className: "dist-lbl"
      }, React.createElement("span", null, "Payroll deductions (not in take-home)"), React.createElement("span", null, fmtMoney(pay.total), " / paycheck")), React.createElement("div", {
        className: "dist-row"
      }, React.createElement("span", {
        className: "cap",
        style: {
          flex: 1,
          minWidth: 80
        }
      }, "Gross salary"), React.createElement(Seg, {
        value: inc.grossMode === "paycheck" ? "paycheck" : "year",
        options: [{
          v: "year",
          label: "per year"
        }, {
          v: "paycheck",
          label: "per check"
        }],
        onChange: v => upInc(inc.id, "grossMode", v)
      }), React.createElement("div", {
        className: "pctbox",
        style: {
          width: 112
        }
      }, React.createElement("span", {
        className: "u",
        style: {
          marginLeft: 0,
          marginRight: 3
        }
      }, "$"), React.createElement("input", {
        type: "number",
        inputMode: "decimal",
        value: inc.gross == null ? "" : inc.gross,
        onChange: e => upInc(inc.id, "gross", e.target.value),
        "aria-label": "Gross salary"
      }))), pay.gross > 0 && React.createElement("div", {
        className: "caphint",
        style: {
          marginTop: -2,
          marginBottom: 8
        }
      }, fmtMoney(pay.gross * perYear), "/yr gross = ", fmtMoney(pay.gross), " per paycheck across ", Math.round(perYear), " paychecks \xB7 take-home ", fmtMoney(n0(inc.amount) * perYear), "/yr", withheld > 0 ? ` · implies ${fmtMoney(withheld)}/paycheck withheld for tax and benefits (${effRate.toFixed(0)}%)` : "", withheld < 0 ? " · take-home plus deductions exceeds gross — one of these numbers is off" : ""), pay.rows.map(pt => React.createElement("div", {
        className: "dist-row",
        key: pt.id
      }, React.createElement("input", {
        type: "text",
        value: pt.name,
        onChange: e => upPreTax(inc.id, pt.id, "name", e.target.value),
        "aria-label": "Deduction name",
        style: {
          flex: 1,
          minWidth: 90
        }
      }), React.createElement(Seg, {
        value: pt.mode,
        options: [{
          v: "pct",
          label: "%"
        }, {
          v: "amt",
          label: "$"
        }],
        onChange: v => upPreTax(inc.id, pt.id, "mode", v)
      }), React.createElement("div", {
        className: "pctbox"
      }, React.createElement("input", {
        type: "number",
        inputMode: "decimal",
        value: pt.value,
        onChange: e => upPreTax(inc.id, pt.id, "value", e.target.value),
        "aria-label": "Value"
      }), React.createElement("span", {
        className: "u"
      }, pt.mode === "pct" ? "%" : "$")), React.createElement("select", {
        value: pt.toAcct,
        onChange: e => upPreTax(inc.id, pt.id, "toAcct", e.target.value),
        "aria-label": "Into account",
        style: {
          flex: 1,
          minWidth: 90
        }
      }, accounts.map(a => React.createElement("option", {
        key: a.id,
        value: a.id
      }, a.name))), React.createElement("button", {
        className: "icon-btn",
        onClick: () => rmPreTax(inc.id, pt.id),
        "aria-label": "Remove"
      }, React.createElement(Trash2, {
        size: 14
      })), pt.mode === "pct" && pay.gross > 0 && React.createElement("div", {
        className: "caphint"
      }, num(pt.value), "% of ", fmtMoney(pay.gross), " = ", React.createElement("b", {
        style: {
          color: "var(--green)"
        }
      }, fmtMoney(pt.amount)), " per paycheck, ", fmtMoney(pt.amount * perYear), "/yr"))), React.createElement("button", {
        className: "dist-add",
        onClick: () => addPreTax(inc.id)
      }, "+ Add a contribution"), React.createElement("div", {
        className: "dist-lbl",
        style: {
          marginTop: 12
        }
      }, React.createElement("span", null, "Employer match"), React.createElement("label", {
        className: "chk"
      }, React.createElement("input", {
        type: "checkbox",
        checked: !!inc.match,
        onChange: e => setMatch(inc.id, e.target.checked)
      }), "offered")), inc.match && React.createElement(React.Fragment, null, React.createElement("div", {
        className: "dist-row"
      }, React.createElement("div", {
        className: "pctbox"
      }, React.createElement("input", {
        type: "number",
        inputMode: "decimal",
        value: inc.match.rate,
        onChange: e => upMatch(inc.id, "rate", e.target.value),
        "aria-label": "Match rate"
      }), React.createElement("span", {
        className: "u"
      }, "%")), React.createElement("span", {
        className: "cap"
      }, "of what you put in, up to"), React.createElement("div", {
        className: "pctbox"
      }, React.createElement("input", {
        type: "number",
        inputMode: "decimal",
        value: inc.match.limit,
        onChange: e => upMatch(inc.id, "limit", e.target.value),
        "aria-label": "Match limit"
      }), React.createElement("span", {
        className: "u"
      }, "%")), React.createElement("span", {
        className: "cap"
      }, "of gross")), React.createElement("div", {
        className: "dist-row"
      }, React.createElement("span", {
        className: "cap",
        style: {
          flex: 1
        }
      }, "Match lands in"), React.createElement("select", {
        value: inc.match.toAcct,
        onChange: e => upMatch(inc.id, "toAcct", e.target.value),
        "aria-label": "Match account",
        style: {
          flex: 1,
          minWidth: 110
        }
      }, accounts.map(a => React.createElement("option", {
        key: a.id,
        value: a.id
      }, a.name)))), React.createElement("div", {
        className: "caphint" + (pay.gross > 0 && pay.matchable < pay.gross * num(inc.match.limit) / 100 - 0.01 ? " warn-txt" : "")
      }, (() => {
        if (!(pay.gross > 0)) return "Enter gross pay above for the match to compute.";
        const ceiling = pay.gross * num(inc.match.limit) / 100;
        const unclaimed = Math.max(0, ceiling - pay.matchable) * n0(inc.match.rate) / 100;
        return React.createElement(React.Fragment, null, "Adds ", React.createElement("b", {
          style: {
            color: "var(--green)"
          }
        }, fmtMoney(pay.match)), " per paycheck (", fmtMoney(pay.match * perYear), "/yr).", unclaimed > 0.01 ? ` You're contributing below the ${num(inc.match.limit)}% threshold — that leaves ${fmtMoney(unclaimed * perYear)}/yr of match unclaimed.` : ` You're contributing enough to capture the full match.`);
      })())), React.createElement("div", {
        className: "caphint",
        style: {
          marginTop: 8
        }
      }, "Money withheld from gross never shows up in take-home, so it belongs here rather than as a transfer. Percentages track your salary as the raise above compounds."), React.createElement("div", {
        className: "dist-lbl",
        style: {
          marginTop: 14
        }
      }, React.createElement("span", null, "Annual bonus"), React.createElement("label", {
        className: "chk"
      }, React.createElement("input", {
        type: "checkbox",
        checked: !!inc.bonus,
        onChange: e => setBonus(inc.id, e.target.checked)
      }), "paid")), inc.bonus && (() => {
        const b = bonusOf(inc, 1);
        return React.createElement(React.Fragment, null, React.createElement("div", {
          className: "dist-row"
        }, React.createElement(Seg, {
          value: inc.bonus.mode === "amt" ? "amt" : "pct",
          options: [{
            v: "pct",
            label: "% of salary"
          }, {
            v: "amt",
            label: "$"
          }],
          onChange: v => upBonus(inc.id, "mode", v)
        }), React.createElement("div", {
          className: "pctbox"
        }, React.createElement("input", {
          type: "number",
          inputMode: "decimal",
          value: inc.bonus.value,
          onChange: e => upBonus(inc.id, "value", e.target.value),
          "aria-label": "Bonus value"
        }), React.createElement("span", {
          className: "u"
        }, inc.bonus.mode === "amt" ? "$" : "%")), React.createElement("span", {
          className: "cap"
        }, "paid each"), React.createElement("input", {
          type: "date",
          value: inc.bonus.date,
          onChange: e => upBonus(inc.id, "date", e.target.value),
          "aria-label": "Bonus date"
        })), React.createElement("div", {
          className: "dist-row"
        }, React.createElement("span", {
          className: "cap",
          style: {
            flex: 1,
            minWidth: 80
          }
        }, "Withheld for tax"), React.createElement("div", {
          className: "pctbox"
        }, React.createElement("input", {
          type: "number",
          inputMode: "decimal",
          value: inc.bonus.withhold,
          onChange: e => upBonus(inc.id, "withhold", e.target.value),
          "aria-label": "Bonus withholding"
        }), React.createElement("span", {
          className: "u"
        }, "%")), React.createElement("label", {
          className: "chk"
        }, React.createElement("input", {
          type: "checkbox",
          checked: inc.bonus.preTaxApplies !== false,
          onChange: e => upBonus(inc.id, "preTaxApplies", e.target.checked)
        }), "401k applies")), b && b.gross > 0 && React.createElement("div", {
          className: "caphint"
        }, inc.bonus.mode === "pct" ? `${num(inc.bonus.value)}% of ${fmtMoney(pay.gross * perYear)} = ` : "", React.createElement("b", {
          style: {
            color: "var(--green)"
          }
        }, fmtMoney(b.gross)), " gross each year", b.deferral > 0 ? ` · ${fmtMoney(b.deferral)} to 401k${b.match > 0 ? ` + ${fmtMoney(b.match)} matched` : ""}` : "", b.withheld > 0 ? ` · ${fmtMoney(b.withheld)} withheld` : "", ` · `, React.createElement("b", {
          style: {
            color: "var(--amber)"
          }
        }, fmtMoney(b.net)), " lands in your account"), React.createElement("div", {
          className: "caphint"
        }, "Grows with your raise, since it's a share of salary. Bonuses are usually withheld at a flat supplemental rate plus payroll tax rather than your normal rate \u2014 check a past stub and adjust. It arrives through the same account split as your paycheck, so a cap on that account will sweep the excess onward."));
      })(), React.createElement("div", {
        className: "dist-lbl",
        style: {
          marginTop: 14
        }
      }, React.createElement("span", null, "Promotions & salary changes"), React.createElement("span", null, (inc.changes || []).length ? (inc.changes || []).length + " planned" : "none")), (inc.changes || []).slice().sort((a, b) => parseDate(a.date) - parseDate(b.date)).map(ch => {
        const gpc = perCheck(ch.gross, ch.grossMode || inc.grossMode, inc.recur);
        const annual = gpc * perYear;
        const employee = gpc > 0 ? payrollOf(inc, gpc).employee : 0;
        const takeHomePerCheck = Math.max(0, gpc * (1 - num(ch.taxRate) / 100) - employee);
        const takeHome = takeHomePerCheck * perYear;
        return React.createElement("div", {
          className: "card",
          key: ch.id,
          style: {
            background: "var(--bg)",
            marginBottom: 8
          }
        }, React.createElement("div", {
          className: "card-r2"
        }, React.createElement("input", {
          type: "text",
          value: ch.label,
          onChange: e => upChange(inc.id, ch.id, "label", e.target.value),
          "aria-label": "Label",
          style: {
            flex: 1,
            minWidth: 90
          }
        }), React.createElement("span", {
          className: "cap"
        }, "from"), React.createElement("input", {
          type: "date",
          value: ch.date,
          onChange: e => upChange(inc.id, ch.id, "date", e.target.value),
          "aria-label": "Effective date"
        }), React.createElement("button", {
          className: "icon-btn",
          onClick: () => rmChange(inc.id, ch.id),
          "aria-label": "Remove"
        }, React.createElement(Trash2, {
          size: 14
        }))), React.createElement("div", {
          className: "card-r2",
          style: {
            marginTop: 8
          }
        }, React.createElement("span", {
          className: "cap"
        }, "salary"), React.createElement("div", {
          className: "pctbox",
          style: {
            width: 108
          }
        }, React.createElement("span", {
          className: "u",
          style: {
            marginLeft: 0,
            marginRight: 3
          }
        }, "$"), React.createElement("input", {
          type: "number",
          inputMode: "decimal",
          value: ch.gross,
          onChange: e => upChange(inc.id, ch.id, "gross", e.target.value),
          "aria-label": "New salary"
        })), React.createElement("span", {
          className: "cap"
        }, "tax rate"), React.createElement("div", {
          className: "pctbox",
          style: {
            width: 80
          }
        }, React.createElement("input", {
          type: "number",
          inputMode: "decimal",
          value: ch.taxRate,
          onChange: e => upChange(inc.id, ch.id, "taxRate", e.target.value),
          "aria-label": "Tax rate"
        }), React.createElement("span", {
          className: "u"
        }, "%"))), annual > 0 && React.createElement("div", {
          className: "caphint"
        }, fmtMoney(annual), "/yr gross \u2192 ", fmtMoney(gpc), "/check \xB7 ", num(ch.taxRate).toFixed(1), "% withheld (today's rate is ", effRate.toFixed(1), "%) \u2192 take-home ", fmtMoney(takeHomePerCheck), "/check (", fmtMoney(takeHome), "/yr)"));
      }), React.createElement("button", {
        className: "dist-add",
        onClick: () => addChange(inc.id)
      }, "+ Add a promotion or salary change"), React.createElement("div", {
        className: "caphint"
      }, "Salary steps to the new figure on that date and the raise percentage compounds from there. Take-home is worked out from the tax rate, prefilled from today's rate \u2014 adjust it if the raise pushes you into a new bracket. Your baseline stays intact, so you can compare with the change removed."));
    })()));
  }), React.createElement("button", {
    className: "btn btn-add",
    onClick: addInc
  }, React.createElement(Plus, {
    size: 15
  }), "Add income source"), React.createElement("div", {
    className: "assume"
  }, "The top account is the remainder \u2014 it receives whatever the others don't take.")), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Expenses"), React.createElement("div", {
    className: "psub"
  }, "dated \xB7 drawn from an account")), expenses.map(ex => React.createElement("div", {
    className: "card",
    key: ex.id
  }, React.createElement("div", {
    className: "card-r1"
  }, React.createElement("input", {
    className: "rname",
    value: ex.category,
    onChange: e => upExp(ex.id, "category", e.target.value),
    "aria-label": "Category"
  }), React.createElement("div", {
    className: "num-box sm"
  }, React.createElement("span", {
    className: "pfx"
  }, "$"), React.createElement("input", {
    className: "num-input",
    type: "number",
    inputMode: "decimal",
    value: ex.amount,
    onChange: e => upExp(ex.id, "amount", e.target.value),
    "aria-label": "Amount",
    style: {
      color: "var(--red)"
    }
  })), React.createElement("button", {
    className: "icon-btn",
    onClick: () => rmExp(ex.id),
    "aria-label": "Remove"
  }, React.createElement(Trash2, {
    size: 16
  }))), React.createElement("div", {
    className: "card-r2"
  }, React.createElement("input", {
    type: "date",
    value: ex.date,
    onChange: e => upExp(ex.id, "date", e.target.value),
    "aria-label": "Date"
  }), React.createElement("select", {
    value: ex.recur,
    onChange: e => upExp(ex.id, "recur", e.target.value),
    "aria-label": "Recurrence"
  }, RECUR.map(r => React.createElement("option", {
    key: r.v,
    value: r.v
  }, r.label))), React.createElement("span", {
    className: "cap"
  }, "paid with"), React.createElement("select", {
    value: ex.fromAcct,
    onChange: e => upExp(ex.id, "fromAcct", e.target.value),
    "aria-label": "Paid with"
  }, React.createElement("optgroup", {
    label: "Accounts"
  }, accounts.map(a => React.createElement("option", {
    key: a.id,
    value: a.id
  }, a.name))), D.cards.length > 0 && React.createElement("optgroup", {
    label: "Credit cards"
  }, D.cards.map(c => React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.name)))), ex.recur !== "once" && React.createElement(EndDate, {
    value: ex.end,
    onChange: v => upExp(ex.id, "end", v)
  })))), React.createElement("button", {
    className: "btn btn-add",
    onClick: addExp
  }, React.createElement(Plus, {
    size: 15
  }), "Add expense")), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Credit cards"), React.createElement("div", {
    className: "psub"
  }, "charges land here, payments clear them")), D.cards.length === 0 && React.createElement("div", {
    className: "empty"
  }, "No cards yet.", React.createElement("br", null), "Add one, then set individual purchases to \"paid with\" that card."), D.cards.map(c => {
    const np = D.nextCardPay[c.id];
    const monthlyCharges = D.chargedTo(c.id);
    return React.createElement("div", {
      className: "cardrow",
      key: c.id
    }, React.createElement("span", {
      className: "badge"
    }, "Card"), React.createElement("input", {
      className: "rname",
      value: c.name,
      onChange: e => upDebtField(c.id, "name", e.target.value),
      "aria-label": "Card name"
    }), React.createElement(NumField, {
      cls: "ramt",
      label: "Balance owed",
      prefix: "$",
      value: c.balance,
      onChange: v => upDebtBal(c.id, v)
    }), React.createElement(NumField, {
      cls: "rrate",
      label: "APR",
      suffix: "%",
      value: c.apr,
      onChange: v => upDebtField(c.id, "apr", v)
    }), React.createElement("button", {
      className: "icon-btn",
      onClick: () => rmDebt(c.id),
      "aria-label": "Remove"
    }, React.createElement(Trash2, {
      size: 16
    })), React.createElement("div", {
      className: "cardbal"
    }, React.createElement("span", null, fmtMoney(monthlyCharges), "/mo charged to it"), np ? React.createElement("span", null, "next payment ", np.date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    }), " \xB7 ", React.createElement("b", null, fmtMoney(np.amount)), np.full ? " (in full)" : "") : React.createElement("span", {
      style: {
        color: "var(--red)"
      }
    }, "no payment set \u2014 this balance will just grow")));
  }), React.createElement("button", {
    className: "btn btn-add",
    onClick: addCardWithPayment
  }, React.createElement(Plus, {
    size: 15
  }), "Add a credit card"), React.createElement("div", {
    className: "assume"
  }, "Interest only applies to a balance you carry past a payment \u2014 pay in full and the card costs nothing. Charges show up in \"Spending by category\" above, so itemising a card gets your whole picture in one place.")), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Payments into debt & cards"), React.createElement("div", {
    className: "psub"
  }, fmtMoney(D.mDp), "/mo")), debtPayments.length === 0 && React.createElement("div", {
    className: "empty"
  }, "No payments yet.", React.createElement("br", null), "Add your regular monthly payments below."), debtPayments.map(p => {
    const tgt = debts.find(x => x.id === p.toDebt);
    const cardTarget = isCard(tgt);
    return React.createElement("div", {
      className: "card",
      key: p.id
    }, React.createElement("div", {
      className: "card-r1"
    }, React.createElement("input", {
      className: "rname",
      value: p.name,
      onChange: e => upDp(p.id, "name", e.target.value),
      "aria-label": "Payment name"
    }), cardTarget && p.payFull ? React.createElement("span", {
      className: "cap",
      style: {
        color: "var(--violet)"
      }
    }, "statement in full") : React.createElement("div", {
      className: "num-box sm"
    }, React.createElement("span", {
      className: "pfx"
    }, "$"), React.createElement("input", {
      className: "num-input",
      type: "number",
      inputMode: "decimal",
      value: p.amount,
      onChange: e => upDp(p.id, "amount", e.target.value),
      "aria-label": "Amount",
      style: {
        color: "var(--violet)"
      }
    })), React.createElement("button", {
      className: "icon-btn",
      onClick: () => rmDp(p.id),
      "aria-label": "Remove"
    }, React.createElement(Trash2, {
      size: 16
    }))), React.createElement("div", {
      className: "card-r2"
    }, React.createElement("input", {
      type: "date",
      value: p.date,
      onChange: e => upDp(p.id, "date", e.target.value),
      "aria-label": "Date"
    }), React.createElement("select", {
      value: p.recur,
      onChange: e => upDp(p.id, "recur", e.target.value),
      "aria-label": "Recurrence"
    }, RECUR.map(r => React.createElement("option", {
      key: r.v,
      value: r.v
    }, r.label))), React.createElement("select", {
      value: p.fromAcct,
      onChange: e => upDp(p.id, "fromAcct", e.target.value),
      "aria-label": "From account"
    }, accounts.map(a => React.createElement("option", {
      key: a.id,
      value: a.id
    }, a.name))), React.createElement("span", {
      className: "arrow"
    }, React.createElement(ArrowRight, {
      size: 14
    })), React.createElement("select", {
      value: p.toDebt,
      onChange: e => upDp(p.id, "toDebt", e.target.value),
      "aria-label": "To debt"
    }, D.loans.length > 0 && React.createElement("optgroup", {
      label: "Loans"
    }, D.loans.map(l => React.createElement("option", {
      key: l.id,
      value: l.id
    }, l.name))), D.cards.length > 0 && React.createElement("optgroup", {
      label: "Credit cards"
    }, D.cards.map(c => React.createElement("option", {
      key: c.id,
      value: c.id
    }, c.name)))), p.recur !== "once" && React.createElement(EndDate, {
      value: p.end,
      onChange: v => upDp(p.id, "end", v)
    })), cardTarget && React.createElement("label", {
      className: "chk",
      style: {
        marginTop: 10
      }
    }, React.createElement("input", {
      type: "checkbox",
      checked: !!p.payFull,
      onChange: e => upDp(p.id, "payFull", e.target.checked)
    }), "Pay the whole balance every time (no interest)"));
  }), React.createElement("div", {
    className: "modal-row",
    style: {
      marginTop: 4
    }
  }, React.createElement("button", {
    className: "btn btn-add",
    style: {
      flex: 1
    },
    onClick: () => addDp("monthly")
  }, React.createElement(Plus, {
    size: 15
  }), "Recurring payment"), React.createElement("button", {
    className: "btn btn-add",
    style: {
      flex: 1
    },
    onClick: () => addDp("once")
  }, React.createElement(Plus, {
    size: 15
  }), "One-time extra")), D.loansNoPayment.length > 0 && React.createElement("div", {
    className: "assume",
    style: {
      color: "var(--red)"
    }
  }, "No payment is set for: ", D.loansNoPayment.map(l => l.name).join(", "), ". Those balances just accrue interest until another loan clears and the rollover reaches them."), React.createElement("div", {
    className: "assume"
  }, "Once a loan is cleared, anything still aimed at it rolls onto your highest-rate remaining loan automatically. Card payments never roll over.")), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Transfers between accounts"), React.createElement("div", {
    className: "psub"
  }, fmtMoney(D.mTr), "/mo")), transfers.length === 0 && React.createElement("div", {
    className: "empty"
  }, "No transfers yet.", React.createElement("br", null), "Add one to route cash into savings or investments."), transfers.map(tr => React.createElement("div", {
    className: "card",
    key: tr.id
  }, React.createElement("div", {
    className: "card-r1"
  }, React.createElement("input", {
    className: "rname",
    value: tr.name,
    onChange: e => upTr(tr.id, "name", e.target.value),
    "aria-label": "Transfer name"
  }), React.createElement("div", {
    className: "num-box sm"
  }, React.createElement("span", {
    className: "pfx"
  }, "$"), React.createElement("input", {
    className: "num-input",
    type: "number",
    inputMode: "decimal",
    value: tr.amount,
    onChange: e => upTr(tr.id, "amount", e.target.value),
    "aria-label": "Amount",
    style: {
      color: "var(--green)"
    }
  })), React.createElement("button", {
    className: "icon-btn",
    onClick: () => rmTr(tr.id),
    "aria-label": "Remove"
  }, React.createElement(Trash2, {
    size: 16
  }))), React.createElement("div", {
    className: "card-r2"
  }, React.createElement("input", {
    type: "date",
    value: tr.date,
    onChange: e => upTr(tr.id, "date", e.target.value),
    "aria-label": "Date"
  }), React.createElement("select", {
    value: tr.recur,
    onChange: e => upTr(tr.id, "recur", e.target.value),
    "aria-label": "Recurrence"
  }, RECUR.map(r => React.createElement("option", {
    key: r.v,
    value: r.v
  }, r.label))), React.createElement("select", {
    value: tr.fromAcct,
    onChange: e => upTr(tr.id, "fromAcct", e.target.value),
    "aria-label": "From"
  }, accounts.map(a => React.createElement("option", {
    key: a.id,
    value: a.id
  }, a.name))), React.createElement("span", {
    className: "arrow"
  }, React.createElement(ArrowRight, {
    size: 14
  })), React.createElement("select", {
    value: tr.toAcct,
    onChange: e => upTr(tr.id, "toAcct", e.target.value),
    "aria-label": "To"
  }, accounts.map(a => React.createElement("option", {
    key: a.id,
    value: a.id
  }, a.name))), tr.recur !== "once" && React.createElement(EndDate, {
    value: tr.end,
    onChange: v => upTr(tr.id, "end", v)
  })))), React.createElement("button", {
    className: "btn btn-add",
    onClick: addTr
  }, React.createElement(Plus, {
    size: 15
  }), "Add a transfer")));
}