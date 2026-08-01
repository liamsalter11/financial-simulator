# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal finance projection tool: enter accounts, debts, income and spending, and it simulates them forward week by week for up to 40 years, projecting net worth, a debt-free date, and a financial-independence date. Served as a static page (no server, no build step at runtime) at liamsalter.com/financial-simulator/. All data lives in the visitor's `localStorage` — no backend, no accounts, no analytics.

## Commands

```bash
npm install
npm run build          # recompile all src/**/*.jsx to their sibling .js
npm test                # all pure-logic tests + the .jsx/.js sync guard — fast, no browser
npm run test:cov        # the same suite with a coverage report
npx playwright install --with-deps chromium   # once, before the first e2e run
npm run test:e2e        # browser tests (loads the real page in Chromium)
npm run test:all        # everything
```

Run a single test file directly, e.g. `node --test tests/engine.test.mjs`. Node's test runner also supports `--test-name-pattern` to filter by test name within a file.

To preview locally, serve the repo root and open `http://127.0.0.1:8000/`:

```bash
python3 -m http.server 8000
```

Opening `index.html` via `file://` does not work — the browser blocks the module script loads.

## Architecture: the .jsx/.js split

There is no bundler and no in-browser transpiler. `index.html` loads `src/main.js` directly as `<script type="module">`, and React/ReactDOM/PropTypes/Recharts come from vendored UMD globals in `vendor/` (pinned so the page works offline with no CDN dependency).

- Every `.jsx` file has a compiled `.js` sibling of the same name **committed alongside it** — that sibling is what the browser actually loads.
- `.jsx` is always the source of truth. **Never hand-edit a compiled `.js` file that has a `.jsx` sibling** — edit the `.jsx` and run `npm run build`.
- Plain `.js` files with no `.jsx` sibling (pure logic, no React needed) are both the source and the shipped file — edit directly.
- The build uses the **classic** JSX runtime (`React.createElement` calls), not the default `automatic` runtime — automatic emits `import` statements from `react/jsx-runtime`, which isn't one of the vendored globals and won't resolve in a plain `<script type="module">`.
- `tests/sync.test.mjs` recompiles every `.jsx` and asserts byte-identical output against its committed `.js` sibling (plus a `node --check` syntax check). **Forgetting to rebuild after editing a `.jsx` file fails `npm test`.** Always run `npm run build` before committing `.jsx` changes.

## Code structure

| Path | What it is |
| --- | --- |
| `src/main.js` | Entry point: mounts `FinancialSimulator` into `#root`. |
| `src/FinancialSimulator.jsx` | The main component — all state and handlers live here; renders whichever tab is active. |
| `src/tabs/*.jsx` | One file per tab (`OverviewTab`, `AccountsTab`, `CashFlowTab`, `DebtTab`, `InvestTab`) — just the rendering for that tab. |
| `src/engine.js` | The simulation engine (`simulateWeekly`, `projectMinWeekly`) — pure logic, no React. |
| `src/montecarlo.js` | Monte Carlo projection for the invested portfolio (`runMonteCarlo`) — pure logic, no React. |
| `src/payroll.js` | Per-paycheck salary/401k-match/bonus math. |
| `src/recurrence.js` | Expands a recurring event into concrete dates and counts firings per week. |
| `src/format.js` | Money/date formatting, recurrence labels, shared constants. |
| `src/seeds.js` | Example data shown on first load, and normalization for older saved/imported data. |
| `src/store.js` | `localStorage` wrapper; entries are keyed under `fin3:*`. |
| `src/useScope.js` | The pinch-zoom/pan chart-windowing hook. Reads the global `React`, so it only loads in a browser; it re-exports `sampleRange` for the tabs' convenience. |
| `src/sample.js` | `sampleRange`, the chart series downsampler — pure, and kept separate from `useScope.js` so it's importable in Node tests. |
| `src/icons.jsx`, `src/components.jsx` | Inline icon set, and small shared UI pieces (`Stat`, `NumField`, `Modal`, `Donut`, `LoanCard`, ...). |
| `src/help-content.js` | The per-tab Help panel copy. |
| `src/styles.js` | The app's CSS, as a template string injected via a `<style>` tag. |
| `vendor/` | Pinned copies of React, ReactDOM, PropTypes and Recharts (UMD builds). |

The pure-logic modules (`engine.js`, `montecarlo.js`, `payroll.js`, `recurrence.js`, `format.js`, `seeds.js`, `store.js`, `sample.js`) have no React dependency and are `import`ed directly in tests — no browser or stubbing needed.

## Key domain logic to know before changing simulation behavior

- **Credit cards charge interest only on a carried balance, resolved at a monthly statement close.** Purchases raise the balance during a cycle but don't become interest-bearing until that month's close, so a card paid in full never costs anything — while a card that just accumulates spending does accrue. Paying a card down (scheduled payment or cap sweep) resets what's carried.
- **Monte Carlo reuses the deterministic contribution schedule.** The Invest tab's "range of outcomes" chart takes the same week-by-week contributions the deterministic engine already computed (`simulateWeekly`'s `basis` series) and randomizes only the *returns* on top, using a fixed-seed PRNG so results are reproducible rather than reshuffling on every unrelated edit. Returns are modeled as one blended portfolio (balance-weighted rate across invested accounts), not per-account. It steps monthly, not weekly.
- **Debt payoff rolls over highest-APR-first**, and card interest only accrues on a carried balance.
- The deterministic projection holds returns, rates, and spending constant, works in today's dollars, and models no inflation, tax on gains, volatility, or sequence-of-returns risk — it's a directional comparison tool, not a forecast.

## Tests

- `tests/sync.test.mjs` — the `.jsx`/`.js` sync guard described above.
- `tests/engine.test.mjs` — `simulateWeekly` and `projectMinWeekly` (`src/engine.js`) against small deterministic scenarios: the employer-match formula, card interest (charges, the grace period, partial payments), highest-APR-first debt rollover, transfers, multi-account paycheck splits, bonuses, the FI target's exclusion of spending that ends within ten years, loan-interest deferment, account-cap sweeps, and account as-of dates.
- `tests/payroll.test.mjs` — `src/payroll.js`: annualised vs per-paycheck gross, deduction and match resolution, the derived effective tax rate, promotions (ordering, and the raise re-anchoring to the promotion date), and which deductions a bonus is subject to.
- `tests/recurrence.test.mjs` — `src/recurrence.js`. Beyond per-frequency cases, it checks the engine's weekly windows against an **independent calendar enumeration** across a year of simulation start dates, which is what would catch a firing dropped or double-counted at a window seam (month lengths, leap days, DST).
- `tests/seeds.test.mjs` — `src/seeds.js` normalization: the migrations that keep older saved data working, plus `pickIds`' fallback chain. With no backend, these run on every load and are the only thing between a returning visitor and a broken projection.
- `tests/montecarlo.test.mjs` — unit tests for `runMonteCarlo`.
- `tests/sample.test.mjs` — `sampleRange` (`src/sample.js`), the chart downsampler.
- `tests/e2e.test.mjs` — Playwright tests against the real served page: the app boots without console errors, the help panel (closed by default, follows the active tab), `localStorage` persistence across reload, the one-time warning toast when storage writes fail, the redirect toggle, the Monte Carlo panel, the export→reset→import round trip, and a regression test that edits income and triggers every tab's chart tooltip (a past bug — a missing import in a shared component — only surfaced once a Tooltip actually rendered).

`tests/helpers/staticServer.mjs` serves the **parent** of this repo, so `/` and `/financial-simulator/` resolve as they do on GitHub Pages. That layout only exists when this repo is checked out inside a clone of `liamsalter11.github.io`; in a standalone clone the one test that needs the site's front page skips itself rather than failing.

CI: `.github/workflows/test.yml` runs the full suite on pull requests and pushes to `main`. `.github/workflows/sync-to-site.yml` rsyncs the repo contents into the `liamsalter11.github.io` site repo on pushes to `main` (excluding `.git`, `.github`, `node_modules`, `test-results`, `playwright-report`) — its `sync` job now `needs` a `test` job, so a failing suite blocks the deploy.

## Conventions

- **No new runtime dependencies without vendoring.** The app intentionally has zero CDN dependencies and no bundler; if a feature needs a library, either vendor a UMD build into `vendor/` and add a `<script>` tag in `index.html`, or write it inline (as was done for icons — see `src/icons.jsx`, replacing a `lucide-react` import with small local SVG components).
- `package.json`/`build.mjs`/`playwright` are dev tooling only — never shipped to the browser.
