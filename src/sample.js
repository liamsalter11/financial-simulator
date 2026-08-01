// Downsamples a week-indexed series to a bounded number of points for charting, so the
// number of SVG nodes stays flat however far out the horizon is zoomed. Pure JS, no React
// dependency — kept out of useScope.js (which reads a global `React` at module scope, and
// so can't be imported outside the browser) precisely so it can be tested directly.
export function sampleRange(series, lo, hi, maxPts) {
  const a = Math.max(0, Math.floor(lo)), b = Math.min(series.length - 1, Math.ceil(hi));
  const step = Math.max(1, Math.ceil((b - a) / (maxPts || 300)));
  const out = [];
  for (let w = a; w <= b; w += step) out.push(series[w]);
  /* the stepping can stop short of the window's last point — append it so a chart's right
     edge always lands on the real final value rather than wherever the stride happened to end */
  if (out.length && out[out.length - 1].w !== series[b].w) out.push(series[b]);
  return out;
}
