// The numbers behind the charts, as a table.
//
// Seven charts across five tabs and, until now, no way to read a single figure off any of
// them without a mouse and a hover. Rather than a toggle on each one, this is a single view
// over the same series the charts are drawn from — one place to go, reachable from every
// tab, and a real <table> with a caption and column headers so a screen reader can walk it.
//
// It recomputes nothing: the series are the ones already in `D`, sampled by the same
// `sampleRange` the charts use.
import { fmtMoney, fmtDate, addDays, WPY } from "./format.js";

/* Which columns each view shows, and where its rows come from. `pick` reads one row of the
   underlying series, so adding a view is a line rather than a component. */
export const VIEWS = [
  {
    v: "networth", label: "Net worth", from: "viewSeries",
    cols: [
      { k: "nw", label: "Net worth" },
      { k: "invest", label: "Invested" },
      { k: "debt", label: "Debt" },
      { k: "fi", label: "Independence target" },
    ],
  },
  {
    v: "cashflow", label: "Cash flow", from: "cf",
    cols: [
      { k: "income", label: "In" },
      { k: "spend", label: "Out" },
      { k: "net", label: "Net" },
      { k: "smooth", label: "Monthly average" },
    ],
  },
  {
    v: "debt", label: "Debt", from: "debtCurve",
    cols: [
      { k: "plan", label: "Your plan" },
      { k: "min", label: "Minimums only" },
    ],
  },
  {
    v: "portfolio", label: "Portfolio", from: "viewSeries",
    cols: [
      { k: "invest", label: "Value" },
      { k: "basis", label: "Contributed" },
    ],
  },
];

export const GRAINS = [
  { v: "monthly", label: "Monthly", weeks: WPY / 12 },
  { v: "quarterly", label: "Quarterly", weeks: WPY / 4 },
  { v: "yearly", label: "Yearly", weeks: WPY },
];

/* Rows at the requested spacing, always including the last one — a table that stopped three
   months short of the horizon would disagree with the figure on the stat card. */
export function tableRows(series, grain, maxRows = 60) {
  if (!series || !series.length) return [];
  const step = Math.max(1, Math.round((GRAINS.find((g) => g.v === grain) || GRAINS[2]).weeks));
  const last = series.length - 1;
  const out = [];
  for (let w = 0; w <= last; w += step) out.push(series[w]);
  if (out[out.length - 1] !== series[last]) out.push(series[last]);
  /* if the horizon makes that unreadably long, thin it evenly rather than truncating */
  if (out.length <= maxRows) return out;
  const keep = [];
  const stride = (out.length - 1) / (maxRows - 1);
  for (let i = 0; i < maxRows - 1; i++) keep.push(out[Math.round(i * stride)]);
  keep.push(out[out.length - 1]);
  return keep;
}

export const toCsv = (view, rows, start) => [
  ["Date", ...view.cols.map((c) => c.label)].join(","),
  ...rows.map((r) => [addDays(start, r.w * 7).toISOString().slice(0, 10), ...view.cols.map((c) => Math.round(r[c.k] ?? 0))].join(",")),
].join("\n");

export function DataTable({ D, start, view, setView, grain, setGrain, onCopy }) {
  const v = VIEWS.find((x) => x.v === view) || VIEWS[0];
  const rows = tableRows(D[v.from], grain);
  const w2date = (w) => addDays(start, w * 7);

  return (
    <>
      <div className="modal-row">
        <select value={view} onChange={(e) => setView(e.target.value)} aria-label="Which numbers">
          {VIEWS.map((x) => <option key={x.v} value={x.v}>{x.label}</option>)}
        </select>
        <select value={grain} onChange={(e) => setGrain(e.target.value)} aria-label="How often">
          {GRAINS.map((g) => <option key={g.v} value={g.v}>{g.label}</option>)}
        </select>
        <button className="btn btn-ghost" onClick={() => onCopy(toCsv(v, rows, start))}>Copy as CSV</button>
      </div>
      <div className="datawrap">
        <table className="datatable" data-testid="data-table">
          <caption className="sr-only">{v.label}, {grain}, from today to the end of the projection — the same figures the charts are drawn from.</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              {v.cols.map((c) => <th scope="col" key={c.k} className="num">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.w}>
                <th scope="row">{fmtDate(w2date(r.w))}</th>
                {v.cols.map((c) => <td key={c.k} className="num">{r[c.k] == null ? "—" : fmtMoney(r[c.k])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
