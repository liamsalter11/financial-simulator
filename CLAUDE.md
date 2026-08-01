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
| `src/montecarlo.js` | Monte Carlo projection for the invested portfolio (`runMonteCarlo`), accumulation and drawdown — pure logic, no React. |
| `src/project.js` | `project` / `projectComparisons` / `projectAll` — the whole expensive projection behind one pure entry point. |
| `src/worker.js` | The module Web Worker that runs `project.js` off the main thread. |
| `src/solve.js` | Goal seek and the sensitivity sweep — the projection run in reverse. |
| `src/milestones.js` | The dated list the Overview shows, plus the scenario diff. |
| `src/history.js` | Undo/redo coalescing rules and the daily snapshot list — pure data operations over plan snapshots. |
| `src/share.js` | A plan packed into a URL fragment: `deflate-raw` + base64url, plus the `#plan=` reader/stripper — pure logic, no React. |
| `src/csv.js` | Bank-export parsing, merchant normalization and recurrence inference — pure logic, no React. |
| `src/loan.js` | Amortization: `amortPayment`, `monthsToPayoff`, and `minPaymentOf` (a loan's effective minimum, whether it's described by payment or by term). |
| `src/tax.js` | Federal bracket tables, the standard deduction and FICA, plus `estimateTax` — annual figures, labelled with `TAX_YEAR`. |
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

The pure-logic modules (`engine.js`, `project.js`, `solve.js`, `milestones.js`, `history.js`, `montecarlo.js`, `loan.js`, `tax.js`, `payroll.js`, `recurrence.js`, `format.js`, `seeds.js`, `store.js`, `sample.js`) have no React dependency and are `import`ed directly in tests — no browser or stubbing needed.

## Key domain logic to know before changing simulation behavior

- **Credit cards charge interest only on a carried balance, resolved at a monthly statement close.** Purchases raise the balance during a cycle but don't become interest-bearing until that month's close, so a card paid in full never costs anything — while a card that just accumulates spending does accrue. Paying a card down (scheduled payment or cap sweep) resets what's carried.
- **The projection runs in a Web Worker, and the page must survive without one.** Everything expensive lives behind `project()` (`src/project.js`); `src/worker.js` is a thin module worker around it, and `FinancialSimulator.jsx` falls back to `projectAll()` inline whenever `Worker` is missing, the script fails to load, or the worker throws. Both paths must produce identical results — an e2e test asserts exactly that, and it's the reason the orchestration lives in a pure module instead of the component. The worker answers each request **twice** (primary projection, then the two comparison runs), and replies carrying a stale request id are dropped. The input is `useDeferredValue`d, so the projection lags a burst of typing by design: figures computed on the main thread (monthly averages, the asset mix) can be a beat ahead of the charts, which is the trade that keeps input responsive.
- **The worker takes three kinds of request, and the answers have different lifetimes.** `project` (per keystroke, answered in `primary` → `extras` → `compare` stages), and `solve` / `tornado` / `breakeven` (user-initiated, seconds long). The two have **separate request counters** — `reqRef` and `askRef` in `FinancialSimulator.jsx` — because a keystroke landing mid-solve must not invalidate the solve.
- **Goal seek assumes monotonicity and reports when it can't deliver.** `src/solve.js` binary-searches a knob against a target; `reason` distinguishes solved / already / unreachable / noEffect / anything, and the UI writes a different sentence for each. `noEffect` is the interesting one: cutting spending doesn't clear a loan sooner, because the freed money piles up in checking rather than being routed at the debt. Date targets search on a trimmed horizon (~9ms/run at 260 weeks vs ~87ms at 2080) and the winner is re-run at full fidelity before it's reported.
- **Undo coalesces a gesture, but never a structural change.** `src/history.js` folds pushes that land within ~600ms into one entry *only while the plan's shape is unchanged* (`shapeOf`: the ids in every list). Typing "1500" is one undo step; deleting a row always starts a new one, so undo can't silently skip past a deletion. The stack lives in refs, not state — every edit touches it and re-rendering on that would be waste — with one `histTick` counter so the toolbar buttons can enable themselves. `applyingRef` is what stops an applied undo from being recorded as a fresh edit.
- **The daily snapshot carries more than the plan.** Each entry under `fin3:snapshots` also stores that day's net worth and the `debtFree`/`fire` dates the projection produced, because they're already in `D` when it's written. That's what lets the Overview show drift ("independence is 3 months sooner than a month ago") without re-running an old projection, and what feeds the actuals line.
- **A share link offers, it never applies.** `src/share.js` packs the plan (and only the plan — not scenarios or snapshots) through `CompressionStream("deflate-raw")` into `#plan=`, ~1.4 KB for the seed data, with an uncompressed base64 fallback where `CompressionStream` is missing. On load *and* on `hashchange` the fragment is decoded and held in `offered` state; `localStorage` is not touched until the visitor picks "Load the shared plan", and the bare URL behaves exactly as it always did. Accepting goes through `applyPlan` without the `applyingRef` guard, so it lands on the undo stack like any other edit. `decodePlan` returns `null` rather than throwing on anything it can't read, and refuses a payload with no accounts.
- **CSV import is a guess, so it never creates anything unsighted.** `src/csv.js` detects the date/description/amount columns (or falls back to reading them positionally when there's no header), normalizes merchant descriptors, groups by merchant and infers a frequency from the *median gap* between dates. Confidence is how tightly the individual gaps hold to that frequency, scaled by how many there are — which is what separates a standing order from a merchant you happen to visit often. Everything is surfaced in a review table with amount, frequency and category editable; only ticked rows become expenses. Credits are dropped, and a file that writes debits as positives is detected and flipped rather than reported as empty.
- **An expense has a free-text `label` and a fixed `category`.** The category used to be whatever was typed, so nothing could be rolled up. `normExpenses` (`src/seeds.js`) moves the old text to `label` — it was the row's *name*, not a category — and matches a fixed `CATEGORIES` value from that same text via `matchCategory` (`src/format.js`), so a "Rent" expense becomes label "Rent" in Housing. `matchCategory`'s keyword list is **ordered**, because some words belong to two buckets: insurance is checked before transport so a car policy isn't transport, and "gas bill" is matched under housing before bare "gas" reaches transport. The migration is idempotent, which matters because it runs on every load.
- **A scenario is exactly what Export writes**, minus the file metadata, stored under `fin3:scenarios`. The *comparison* selection lives in its own key rather than in `settings`, because settings are part of a saved plan — putting it there would nest a scenario inside a scenario.
- **Monte Carlo reuses the deterministic contribution schedule.** The Invest tab's "range of outcomes" chart takes the same week-by-week contributions the deterministic engine already computed (`simulateWeekly`'s `basis` series) and randomizes only the *returns* on top, using a fixed-seed PRNG so results are reproducible rather than reshuffling on every unrelated edit. Returns are modeled as one blended portfolio (balance-weighted rate across invested accounts), not per-account. It steps monthly, not weekly.
- **The Monte Carlo also spends the portfolio down.** Past `retireWeek` contributions stop and `annualSpend` is withdrawn, constant in today's dollars — no inflation term is needed because the engine is already real. `survivalProb` (never ran out) is a different question from `successProb` (ever reached the target) and both are returned; the Invest tab leads with survival when a retirement falls inside the horizon. Withdrawals are charged only the *share* of spending the invested pot represents at the retirement date (`mc.investShare`), because cash, savings and cleared debt fund the rest — charging it everything reports a frightening number for a plan that is fine.
- **Everything is computed in today's dollars, from nominal inputs.** Every rate a user enters is nominal; `simulateWeekly` converts each one to a real rate via `toReal` (`src/format.js`) before it compounds — account returns, debt APRs, the annual raise, and a promotion's future salary (deflated back from its own date in `salaryAt`). Nominally-fixed commitments are the deliberate exception: debt payments and loan minimums are multiplied by a running deflator, so a fixed payment correctly buys less each year. `settings.showNominal` is **display only** — the tabs re-inflate what they draw and nothing else; an engine test asserts it never changes a simulation. At `inflation: 0` every conversion is the identity, which is what the pre-existing engine tests rely on.
- **Debt payoff order is a setting**, `settings.payoffOrder`: avalanche (highest APR first, the default and the old hardcoded behavior) or snowball (smallest balance first). Both rollover sites in `simulateWeekly` share one comparator, `payoffSort`. The Debt tab runs the *other* strategy as a second full projection to price the difference, the same way the promotions toggle runs a with/without pair.
- **Pre-tax contributions stop at an annual limit.** `settings.deferralLimit` caps per-income calendar-year deferrals (entries opt out with `capped: false`); the engine tracks year-to-date per income source and reports back through `capInfo` — the week the cap bit and the employer match forfeited, since a per-paycheck match stops when the contribution it rides on stops. The count starts at the simulation start date, so a mid-year run doesn't know what was contributed earlier that year.
- **Take-home is typed by default, derived on request.** `income[].taxMode` is `"typed"` unless a user opts in, so no saved plan re-projects itself. In `"derived"` mode `salaryAt` (and the engine, per paycheck, at the grown gross) routes through `takeHomeOf` → `estimateTax`, and a promotion's own `taxRate` is ignored because the brackets already price the raise. Bonus withholding stays a flat user-set rate — supplemental wages are withheld under a different regime.
- **An account's `taxTreatment` decides three separate things**: taxable investments lose `settings.taxDrag` of return each year; a `traditional` balance is docked `settings.retireTaxRate` in the `spendable` figure the FI crossing is tested against (raw `nw` still drives the charts); and only taxable money counts as reachable before 59½, which is what the `bridge` result reports. It defaults from the account type via `defaultTreatment` in `seeds.js`.
- **The FI target is a function of the week, not a constant.** `targetAt(w)` = the steady-state need after guaranteed income, plus `guaranteed × years until it starts` of bridge capital. With no guaranteed income both terms collapse to the old flat 25×-expenses figure. Each snapshot carries its own `fi`, which is what the charts draw — as a line when it slopes (`D.fiSloped`: guaranteed income, or future-dollars mode), as a flat `ReferenceLine` otherwise.
- The deterministic projection holds returns, rates, and spending constant in real terms, and models no volatility or sequence-of-returns risk — it's a directional comparison tool, not a forecast.

## Tests

- `tests/sync.test.mjs` — the `.jsx`/`.js` sync guard described above.
- `tests/engine.test.mjs` — `simulateWeekly` and `projectMinWeekly` (`src/engine.js`) against small deterministic scenarios: the employer-match formula, card interest (charges, the grace period, partial payments), debt rollover under both payoff strategies, transfers, multi-account paycheck splits, bonuses, the FI target's exclusion of spending that ends within ten years, loan-interest deferment, account-cap sweeps, account as-of dates, the real-terms inflation conversion (including that it's the identity at 0% and that `showNominal` never reaches the engine), and the annual pre-tax contribution limit.
- `tests/loan.test.mjs` — `src/loan.js`: the amortizing payment against a textbook figure, payment ↔ term round-trips, and the payment that never covers the interest.
- `tests/project.test.mjs` — `src/project.js`: that the seam is behaviour-free (the primary result matches calling `simulateWeekly` directly), that the two-stage worker protocol agrees with the one-shot path, and the retirement-window rules.
- `tests/share.test.mjs` — `src/share.js`: a plan survives encode → decode unchanged, the payload really is compressed, only plan keys travel, the uncompressed fallback round-trips, a corrupt or foreign fragment returns `null` rather than throwing, and `readHash`/`stripHash` compose with other fragment entries.
- `tests/csv.test.mjs` — `src/csv.js`: quoted fields and embedded commas, every shape a statement writes an amount in, both slash date orders, separate Debit/Credit columns, headerless files read positionally, malformed rows skipped rather than failing the file, one merchant written several ways grouping as one, monthly/weekly detection, a one-off staying a one-off, and irregular spacing scoring below tight spacing.
- `tests/history.test.mjs` — `src/history.js`: that a burst of edits coalesces to one undo entry while a row added or removed always starts a new one, the stack and snapshot caps, and one snapshot per calendar day.
- `tests/solve.test.mjs` — `src/solve.js`: that a solved amount really hits the target when replayed through the engine, that an impossible ask says so rather than returning the ceiling, that horizon trimming doesn't change the answer, and that every knob × target pairing returns a usable shape.
- `tests/milestones.test.mjs` — `src/milestones.js`: ordering, agreement with `sim.payoffWeek`, milestones outside the horizon omitted rather than dated wrongly, and the scenario diff pairing.
- `tests/tax.test.mjs` — `src/tax.js`. Asserts structure and behaviour (ordered bands, continuity across a boundary, marginal ≥ effective, FICA stopping at the wage base, deferrals cutting income tax but not payroll tax) rather than exact IRS dollar figures, so correcting a stale table doesn't fail the suite.
- `tests/payroll.test.mjs` — `src/payroll.js`: annualised vs per-paycheck gross, deduction and match resolution, the derived effective tax rate, promotions (ordering, and the raise re-anchoring to the promotion date), and which deductions a bonus is subject to.
- `tests/recurrence.test.mjs` — `src/recurrence.js`. Beyond per-frequency cases, it checks the engine's weekly windows against an **independent calendar enumeration** across a year of simulation start dates, which is what would catch a firing dropped or double-counted at a window seam (month lengths, leap days, DST).
- `tests/seeds.test.mjs` — `src/seeds.js` normalization: the migrations that keep older saved data working, plus `pickIds`' fallback chain and the expense label/category migration (known names mapped, the typed text kept as the label, an unrecognised one landing in Other, and the whole thing idempotent). With no backend, these run on every load and are the only thing between a returning visitor and a broken projection.
- `tests/montecarlo.test.mjs` — `runMonteCarlo`, accumulation and drawdown: a zero-volatility withdrawal run is exact arithmetic, survival falls as spending rises, volatility alone sinks plans the average return sustains (sequence risk), and contributions stop at the retirement week.
- `tests/sample.test.mjs` — `sampleRange` (`src/sample.js`), the chart downsampler.
- `tests/e2e.test.mjs` — Playwright tests against the real served page: the app boots without console errors, the help panel (closed by default, follows the active tab), `localStorage` persistence across reload, the one-time warning toast when storage writes fail, the redirect toggle, the Monte Carlo panel, the export→reset→import round trip, undo/redo and daily snapshots, a `#plan=` link that offers rather than applies (and leaves `localStorage` untouched when declined), a CSV statement becoming a review table where only ticked rows are created, and a regression test that edits income and triggers every tab's chart tooltip (a past bug — a missing import in a shared component — only surfaced once a Tooltip actually rendered).

`tests/helpers/staticServer.mjs` serves the **parent** of this repo, so `/` and `/financial-simulator/` resolve as they do on GitHub Pages. That layout only exists when this repo is checked out inside a clone of `liamsalter11.github.io`; in a standalone clone the one test that needs the site's front page skips itself rather than failing.

CI: `.github/workflows/test.yml` runs the full suite on pull requests and pushes to `main`. `.github/workflows/sync-to-site.yml` rsyncs the repo contents into the `liamsalter11.github.io` site repo on pushes to `main` (excluding `.git`, `.github`, `node_modules`, `test-results`, `playwright-report`) — its `sync` job now `needs` a `test` job, so a failing suite blocks the deploy.

## Conventions

- **No new runtime dependencies without vendoring.** The app intentionally has zero CDN dependencies and no bundler; if a feature needs a library, either vendor a UMD build into `vendor/` and add a `<script>` tag in `index.html`, or write it inline (as was done for icons — see `src/icons.jsx`, replacing a `lucide-react` import with small local SVG components).
- `package.json`/`build.mjs`/`playwright` are dev tooling only — never shipped to the browser.
