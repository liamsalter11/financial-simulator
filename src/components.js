const {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} = Recharts;
import { X, Trash2, Check } from "./icons.js";
import { fmtBig, fmtMoney, fmtDate, n0, parseDate, addMonths, addDays } from "./format.js";
export const Stat = ({
  k,
  v,
  accent
}) => React.createElement("div", {
  className: "stat"
}, React.createElement("div", {
  className: "k",
  dangerouslySetInnerHTML: {
    __html: k
  }
}), React.createElement("div", {
  className: "v mono " + (accent || "")
}, v));
export function NumField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  cls,
  readOnly
}) {
  return React.createElement("div", {
    className: "field " + (cls || "")
  }, React.createElement("label", null, label), React.createElement("div", {
    className: "inp"
  }, prefix && React.createElement("span", {
    className: "u"
  }, prefix), React.createElement("input", {
    type: "number",
    inputMode: "decimal",
    value: value,
    readOnly: readOnly,
    onChange: e => onChange && onChange(e.target.value)
  }), suffix && React.createElement("span", {
    className: "u"
  }, suffix)));
}
export const Seg = ({
  value,
  options,
  onChange,
  cls
}) => React.createElement("div", {
  className: "seg " + (cls || "")
}, options.map(o => React.createElement("button", {
  key: o.v,
  className: value === o.v ? "on" : "",
  onClick: () => onChange(o.v)
}, o.label)));
export function Modal({
  title,
  onClose,
  children
}) {
  return React.createElement("div", {
    className: "modal",
    onClick: onClose
  }, React.createElement("div", {
    className: "modal-card",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "modal-head"
  }, React.createElement("span", null, title), React.createElement("button", {
    className: "icon-btn",
    onClick: onClose,
    "aria-label": "Close"
  }, React.createElement(X, {
    size: 18
  }))), children));
}
export function Donut({
  data,
  center,
  sub
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return React.createElement("div", {
    className: "split"
  }, React.createElement("div", {
    className: "donut-wrap"
  }, React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 186
  }, React.createElement(PieChart, null, React.createElement(Pie, {
    data: data.length ? data : [{
      name: "—",
      value: 1,
      color: "#1B2735"
    }],
    dataKey: "value",
    nameKey: "name",
    innerRadius: 58,
    outerRadius: 82,
    paddingAngle: data.length > 1 ? 2 : 0,
    stroke: "none",
    isAnimationActive: false
  }, (data.length ? data : [{
    color: "#1B2735"
  }]).map((d, i) => React.createElement(Cell, {
    key: i,
    fill: d.color
  }))))), React.createElement("div", {
    className: "donut-center"
  }, React.createElement("div", {
    className: "dc-v"
  }, center), React.createElement("div", {
    className: "dc-s"
  }, sub))), React.createElement("div", {
    className: "dlegend"
  }, data.map((d, i) => React.createElement("div", {
    className: "dl-row",
    key: i
  }, React.createElement("span", {
    className: "dot",
    style: {
      background: d.color
    }
  }), React.createElement("span", {
    className: "nm"
  }, d.name), React.createElement("span", {
    className: "vl"
  }, fmtBig(d.value)), React.createElement("span", {
    className: "pc"
  }, Math.round(d.value / total * 100), "%")))));
}
export function LoanCard({
  loan,
  rank,
  payoffMonth,
  start,
  hasPayments,
  onField,
  onBalance,
  onRemove
}) {
  const paid = n0(loan.balance) <= 0;
  const iFrom = loan.interestFrom ? parseDate(loan.interestFrom) : null;
  const deferred = iFrom && !isNaN(iFrom) && iFrom > start;
  return React.createElement("div", {
    className: "loan" + (paid ? " done" : "")
  }, React.createElement("div", {
    className: "loan-top"
  }, React.createElement("span", {
    className: "rank" + (paid ? " paid" : "")
  }, paid ? "PAID" : "#" + (rank || "—")), React.createElement("input", {
    className: "rname",
    value: loan.name,
    onChange: e => onField(loan.id, "name", e.target.value),
    "aria-label": "Loan name"
  }), React.createElement("button", {
    className: "icon-btn",
    onClick: () => onRemove(loan.id),
    "aria-label": "Remove"
  }, React.createElement(Trash2, {
    size: 16
  }))), React.createElement("div", {
    className: "fields3"
  }, React.createElement(NumField, {
    label: "Balance",
    prefix: "$",
    value: loan.balance,
    onChange: v => onBalance(loan.id, v)
  }), React.createElement(NumField, {
    label: "Rate",
    suffix: "%",
    value: loan.apr,
    onChange: v => onField(loan.id, "apr", v)
  }), React.createElement(NumField, {
    label: "Min / mo",
    prefix: "$",
    value: loan.minPayment,
    onChange: v => onField(loan.id, "minPayment", v)
  })), React.createElement("div", {
    className: "loan-foot"
  }, paid ? React.createElement("span", {
    className: "payoff-badge paid"
  }, React.createElement(Check, {
    size: 12,
    style: {
      verticalAlign: -2,
      marginRight: 4
    }
  }), "Cleared") : payoffMonth != null ? React.createElement("span", {
    className: "payoff-badge"
  }, "Clears ", React.createElement("b", null, fmtDate(addMonths(start, payoffMonth)))) : React.createElement("span", {
    className: "payoff-badge"
  }, "Not cleared in 40 years"), React.createElement("span", {
    className: "endwrap",
    style: {
      marginLeft: "auto"
    }
  }, React.createElement("span", {
    className: "cap"
  }, deferred ? "deferred until" : "interest from"), React.createElement("input", {
    type: "date",
    value: loan.interestFrom || "",
    onChange: e => onField(loan.id, "interestFrom", e.target.value),
    "aria-label": "Interest starts",
    title: "Interest accrues from this date. Push it forward for a subsidised loan in deferment."
  }), deferred ? React.createElement("span", {
    className: "badge"
  }, "no interest yet") : null), hasPayments && React.createElement("span", null, "from $", Math.round(n0(loan.originalBalance)).toLocaleString())));
}
export const EndDate = ({
  value,
  onChange
}) => React.createElement("span", {
  className: "endwrap" + (value ? "" : " off")
}, React.createElement("span", {
  className: "cap"
}, "ends"), React.createElement("input", {
  type: "date",
  value: value || "",
  onChange: e => onChange(e.target.value),
  "aria-label": "Ends (optional)",
  title: "Optional \u2014 leave blank to run forever"
}), value ? React.createElement("button", {
  className: "icon-btn",
  onClick: () => onChange(""),
  "aria-label": "Clear end date"
}, React.createElement(X, {
  size: 13
})) : null);
export const Tip = ({
  active,
  payload,
  label,
  start,
  rows
}) => {
  if (!active || !payload || !payload.length) return null;
  const d = addDays(start, label * 7);
  return React.createElement("div", {
    className: "tt"
  }, React.createElement("div", {
    className: "tt-m"
  }, d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })), rows.map((r, i) => {
    const p = payload.find(x => x.dataKey === r.key);
    return p ? React.createElement("div", {
      className: "tt-row",
      key: i
    }, React.createElement("span", {
      className: "dot",
      style: {
        background: r.color
      }
    }), r.name, React.createElement("b", null, fmtMoney(p.value))) : null;
  }));
};
export const MultiTip = ({
  active,
  payload,
  label,
  start,
  names
}) => {
  if (!active || !payload || !payload.length) return null;
  const d = addDays(start, label * 7);
  const sorted = [...payload].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 8);
  return React.createElement("div", {
    className: "tt"
  }, React.createElement("div", {
    className: "tt-m"
  }, d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })), sorted.map((p, i) => React.createElement("div", {
    className: "tt-row",
    key: i
  }, React.createElement("span", {
    className: "dot",
    style: {
      background: p.stroke || p.color
    }
  }), names[p.dataKey] || p.dataKey, React.createElement("b", null, fmtBig(p.value)))));
};