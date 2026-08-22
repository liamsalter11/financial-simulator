import { fmtMoney, fmtDate, addDays, WPY } from "./format.js";
export const VIEWS = [{
  v: "networth",
  label: "Net worth",
  from: "viewSeries",
  cols: [{
    k: "nw",
    label: "Net worth"
  }, {
    k: "invest",
    label: "Invested"
  }, {
    k: "debt",
    label: "Debt"
  }, {
    k: "fi",
    label: "Independence target"
  }]
}, {
  v: "cashflow",
  label: "Cash flow",
  from: "cf",
  cols: [{
    k: "income",
    label: "In"
  }, {
    k: "spend",
    label: "Out"
  }, {
    k: "net",
    label: "Net"
  }, {
    k: "smooth",
    label: "Monthly average"
  }]
}, {
  v: "debt",
  label: "Debt",
  from: "debtCurve",
  cols: [{
    k: "plan",
    label: "Your plan"
  }, {
    k: "min",
    label: "Minimums only"
  }]
}, {
  v: "portfolio",
  label: "Portfolio",
  from: "viewSeries",
  cols: [{
    k: "invest",
    label: "Value"
  }, {
    k: "basis",
    label: "Contributed"
  }]
}];
export const GRAINS = [{
  v: "monthly",
  label: "Monthly",
  weeks: WPY / 12
}, {
  v: "quarterly",
  label: "Quarterly",
  weeks: WPY / 4
}, {
  v: "yearly",
  label: "Yearly",
  weeks: WPY
}];
export function tableRows(series, grain, maxRows = 60) {
  if (!series || !series.length) return [];
  const step = Math.max(1, Math.round((GRAINS.find(g => g.v === grain) || GRAINS[2]).weeks));
  const last = series.length - 1;
  const out = [];
  for (let w = 0; w <= last; w += step) out.push(series[w]);
  if (out[out.length - 1] !== series[last]) out.push(series[last]);
  if (out.length <= maxRows) return out;
  const keep = [];
  const stride = (out.length - 1) / (maxRows - 1);
  for (let i = 0; i < maxRows - 1; i++) keep.push(out[Math.round(i * stride)]);
  keep.push(out[out.length - 1]);
  return keep;
}
export const toCsv = (view, rows, start) => [["Date", ...view.cols.map(c => c.label)].join(","), ...rows.map(r => [addDays(start, r.w * 7).toISOString().slice(0, 10), ...view.cols.map(c => Math.round(r[c.k] ?? 0))].join(","))].join("\n");
export function DataTable({
  D,
  start,
  view,
  setView,
  grain,
  setGrain,
  onCopy
}) {
  const v = VIEWS.find(x => x.v === view) || VIEWS[0];
  const rows = tableRows(D[v.from], grain);
  const w2date = w => addDays(start, w * 7);
  return React.createElement(React.Fragment, null, React.createElement("div", {
    className: "modal-row"
  }, React.createElement("select", {
    value: view,
    onChange: e => setView(e.target.value),
    "aria-label": "Which numbers"
  }, VIEWS.map(x => React.createElement("option", {
    key: x.v,
    value: x.v
  }, x.label))), React.createElement("select", {
    value: grain,
    onChange: e => setGrain(e.target.value),
    "aria-label": "How often"
  }, GRAINS.map(g => React.createElement("option", {
    key: g.v,
    value: g.v
  }, g.label))), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => onCopy(toCsv(v, rows, start))
  }, "Copy as CSV")), React.createElement("div", {
    className: "datawrap"
  }, React.createElement("table", {
    className: "datatable",
    "data-testid": "data-table"
  }, React.createElement("caption", {
    className: "sr-only"
  }, v.label, ", ", grain, ", from today to the end of the projection \u2014 the same figures the charts are drawn from."), React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    scope: "col"
  }, "Date"), v.cols.map(c => React.createElement("th", {
    scope: "col",
    key: c.k,
    className: "num"
  }, c.label)))), React.createElement("tbody", null, rows.map(r => React.createElement("tr", {
    key: r.w
  }, React.createElement("th", {
    scope: "row"
  }, fmtDate(w2date(r.w))), v.cols.map(c => React.createElement("td", {
    key: c.k,
    className: "num"
  }, r[c.k] == null ? "—" : fmtMoney(r[c.k])))))))));
}