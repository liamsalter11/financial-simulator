// The projection, off the main thread. A module worker, so it can `import` the pure
// modules directly exactly as main.js does — no bundler, no duplicated code, no build step.
//
// It answers each request twice: the primary projection first, so the charts can paint,
// then the two what-if comparisons that only the Overview and Debt panels read. Every reply
// carries the request id it belongs to; the page drops any that isn't the newest, which is
// what makes fast typing safe.
import { project, projectComparisons } from "./project.js";

self.onmessage = (e) => {
  const { id, input } = e.data || {};
  if (!input) return;
  try {
    const primary = project(input);
    self.postMessage({ id, stage: "primary", result: primary });
    self.postMessage({ id, stage: "extras", result: projectComparisons(input, primary.sim) });
  } catch (err) {
    /* a thrown worker is a silent worker, so report it back and let the page fall back to
       computing on the main thread rather than leaving the charts frozen on stale data */
    self.postMessage({ id, stage: "error", message: String((err && err.message) || err) });
  }
};
