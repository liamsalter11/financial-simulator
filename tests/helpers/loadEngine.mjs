// Loads the pure simulation-engine functions out of app.js without needing a browser.
// app.js is a plain script (not an ES module) that expects React/ReactDOM/Recharts/
// PropTypes as globals and ends by mounting a component — none of that matters for the
// engine functions, which are plain `function` declarations evaluated before the
// component. Running the whole file in a throwaway vm context and then reading those
// declarations back off the context object is far simpler than trying to `import` a
// script that was never written to be imported.
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const appJsPath = join(here, "..", "..", "app.js");

export function loadEngine() {
  const code = readFileSync(appJsPath, "utf8");

  // Every property access/call on these stand-ins returns another stand-in, which is
  // all the icon/component definitions and the final ReactDOM.createRoot(...).render(...)
  // call need to execute to completion without throwing.
  const inert = () => new Proxy(() => inert(), { get: () => inert() });
  const sandbox = {
    React: inert(),
    ReactDOM: { createRoot: () => ({ render: () => {} }) },
    Recharts: inert(),
    PropTypes: inert(),
    document: { getElementById: () => ({}) },
    window: {},
    localStorage: { getItem: () => null, setItem: () => {} },
    console,
  };
  sandbox.window.localStorage = sandbox.localStorage;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "app.js" });

  const {
    simulateWeekly,
    projectMinWeekly,
    payrollOf,
    bonusOf,
    salaryAt,
    firesInWeek,
  } = sandbox;

  return { simulateWeekly, projectMinWeekly, payrollOf, bonusOf, salaryAt, firesInWeek };
}
