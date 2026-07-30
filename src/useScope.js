// Pinch-zoom / drag-to-pan windowing for the interactive charts, plus the series
// downsampler that keeps chart data points bounded regardless of zoom level.
const { useState, useEffect, useRef, useCallback } = React;

export function useScope(maxW, defSpan) {
  const [win, setWin] = useState({ lo: 0, hi: Math.max(8, Math.min(defSpan, maxW)) });
  const nodeRef = useRef(null);
  const ptrs = useRef(new Map());
  const last = useRef(null);
  const maxRef = useRef(maxW);
  maxRef.current = maxW;
  const clampTo = (lo, hi) => {
    const M = maxRef.current;
    const span = Math.max(6, Math.min(hi - lo, M));
    if (lo < 0) lo = 0;
    if (lo + span > M) lo = Math.max(0, M - span);
    return { lo, hi: lo + span };
  };
  const zoomAt = (frac, factor) => setWin((cur) => {
    const span = cur.hi - cur.lo;
    const anchor = cur.lo + span * frac;
    const ns = Math.max(6, Math.min(span * factor, maxRef.current));
    return clampTo(anchor - ns * frac, anchor - ns * frac + ns);
  });
  const zoomRef = useRef(zoomAt); zoomRef.current = zoomAt;
  const snap = (span) => setWin(clampTo(0, Math.min(span, maxRef.current)));
  useEffect(() => { setWin((w) => clampTo(w.lo, w.hi)); }, [maxW]);
  /* callback ref: binds whenever the chart actually mounts, including on later tabs */
  const setNode = useCallback((el) => {
    const prev = nodeRef.current;
    if (prev && prev.__finWheel) { prev.removeEventListener("wheel", prev.__finWheel); prev.__finWheel = null; }
    nodeRef.current = el;
    if (el) {
      const h = (e) => {
        e.preventDefault();
        const r = el.getBoundingClientRect();
        const f = Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
        zoomRef.current(f, e.deltaY > 0 ? 1.2 : 1 / 1.2);
      };
      el.addEventListener("wheel", h, { passive: false });
      el.__finWheel = h;
    }
  }, []);
  const onPointerDown = (e) => { ptrs.current.set(e.pointerId, e.clientX); last.current = null; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { } };
  const onPointerMove = (e) => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, e.clientX);
    const el = nodeRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const xs = [...ptrs.current.values()];
    if (xs.length === 1) {
      const x = xs[0];
      if (last.current && last.current.mode === "pan") {
        const dx = x - last.current.x;
        setWin((cur) => { const span = cur.hi - cur.lo; const sh = -dx / Math.max(1, r.width) * span; return clampTo(cur.lo + sh, cur.hi + sh); });
      }
      last.current = { mode: "pan", x };
    } else {
      const a = Math.min(...xs), b = Math.max(...xs);
      const dist = Math.max(12, b - a), mid = (a + b) / 2;
      if (last.current && last.current.mode === "pinch") {
        const f = Math.max(0, Math.min(1, (mid - r.left) / Math.max(1, r.width)));
        zoomAt(f, last.current.dist / dist);
      }
      last.current = { mode: "pinch", dist, mid };
    }
  };
  const onPointerUp = (e) => { ptrs.current.delete(e.pointerId); last.current = null; };
  return { lo: win.lo, hi: win.hi, snap, ref: setNode, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onPointerLeave: onPointerUp } };
}
export function sampleRange(series, lo, hi, maxPts) {
  const a = Math.max(0, Math.floor(lo)), b = Math.min(series.length - 1, Math.ceil(hi));
  const step = Math.max(1, Math.ceil((b - a) / (maxPts || 300)));
  const out = [];
  for (let w = a; w <= b; w += step) out.push(series[w]);
  if (out.length && out[out.length - 1].w !== series[b].w) out.push(series[b]);
  return out;
}
