// The projection, off the main thread. A module worker, so it can `import` the pure
// modules directly exactly as main.js does — no bundler, no duplicated code, no build step.
//
// Three kinds of request:
//   "project"  the projection itself, answered in stages so the charts paint before the
//              two what-if comparisons and any saved scenario finish
//   "solve"    a goal seek — user-initiated, seconds long, one answer
//   "tornado"  a sensitivity sweep — likewise
//
// Every reply carries the request id it belongs to; the page drops any that isn't the
// newest of its kind, which is what makes fast typing safe.
import { project, projectComparisons, payoffVsInvest } from "./project.js";
import { goalSeek, tornado } from "./solve.js";

const handlers = {
  project(id, payload) {
    const input = payload;
    const primary = project(input);
    self.postMessage({ id, kind: "project", stage: "primary", result: primary });
    self.postMessage({ id, kind: "project", stage: "extras", result: projectComparisons(input, primary.sim) });
    /* a saved scenario to compare against, run as its own projection so the Overview can
       draw it alongside — same shape in, same shape out */
    if (input.compare) {
      const cmp = project({ ...input.compare, start: input.start, weeks: input.weeks });
      self.postMessage({ id, kind: "project", stage: "compare", result: { compare: { sim: cmp.sim, maxW: cmp.maxW, retireWeek: cmp.retireWeek } } });
    }
  },
  /* these two take the solver's own argument bundle: { input, knob, target, value } */
  solve(id, payload) {
    self.postMessage({ id, kind: "solve", result: goalSeek(payload) });
  },
  tornado(id, payload) {
    self.postMessage({ id, kind: "tornado", result: tornado(payload) });
  },
  breakeven(id, payload) {
    self.postMessage({ id, kind: "breakeven", result: payoffVsInvest(payload.input, payload.amount) });
  },
};

self.onmessage = (e) => {
  const { id, kind = "project", payload } = e.data || {};
  if (!payload) return;
  const run = handlers[kind];
  if (!run) return;
  try {
    run(id, payload);
  } catch (err) {
    /* a thrown worker is a silent worker, so report it back and let the page fall back to
       computing on the main thread rather than leaving the charts frozen on stale data */
    self.postMessage({ id, kind, stage: "error", message: String((err && err.message) || err) });
  }
};
