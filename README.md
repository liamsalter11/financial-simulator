# Financial Simulator

A personal finance projection tool, served as a static page at
[liamsalter.com/financial-simulator/](https://liamsalter.com/financial-simulator/).

Enter your accounts, debts, income and spending, and it simulates them forward
week by week for up to 40 years — projecting net worth, a debt-free date, and a
financial-independence date.

## Files

The app is split into small ES modules under `src/`, loaded natively by the
browser (`index.html` loads `src/main.js` as `<script type="module">`) — no
bundler. Every `.jsx` file has a compiled `.js` sibling of the same name that
the browser actually loads; `.js` files with no JSX (pure logic — no React
needed to read them) are both the source and the shipped file.

| Path | What it is |
| --- | --- |
| `index.html` | The page. Loads the vendored libraries, then `src/main.js`. |
| `src/main.js` | Entry point: mounts `FinancialSimulator` into `#root`. |
| `src/FinancialSimulator.jsx` | The main component — all state and handlers live here; renders whichever tab is active. |
| `src/tabs/*.jsx` | One file per tab (`OverviewTab`, `AccountsTab`, `CashFlowTab`, `DebtTab`, `InvestTab`), each just the rendering for that tab. |
| `src/engine.js` | The simulation engine (`simulateWeekly`, `projectMinWeekly`) — pure logic, no React. |
| `src/montecarlo.js` | Monte Carlo projection for the invested portfolio (`runMonteCarlo`) — pure logic, no React. |
| `src/project.js` | The whole expensive projection behind one pure entry point. |
| `src/worker.js` | The module Web Worker that runs it off the main thread. |
| `src/solve.js` | Goal seek and the sensitivity sweep — the projection, in reverse. |
| `src/milestones.js` | The dated milestone list, and the scenario comparison diff. |
| `src/loan.js` | Amortization: payment ↔ term ↔ months-to-payoff. |
| `src/tax.js` | Federal brackets, the standard deduction and FICA, plus `estimateTax`. |
| `src/payroll.js` | Per-paycheck salary/401k-match/bonus math. |
| `src/recurrence.js` | Expands a recurring event into concrete dates and counts firings per week. |
| `src/format.js` | Money/date formatting, recurrence labels, shared constants. |
| `src/seeds.js` | Example data shown on first load, and normalization for older saved/imported data. |
| `src/store.js` | `localStorage` wrapper. |
| `src/useScope.js` | The pinch-zoom/pan chart-windowing hook. Reads the global `React`, so it only loads in a browser; it re-exports `sampleRange` for the tabs' convenience. |
| `src/sample.js` | `sampleRange`, the chart series downsampler — pure, and kept separate from `useScope.js` so it's importable in Node tests. |
| `src/icons.jsx`, `src/components.jsx` | Inline icon set, and small shared UI pieces (`Stat`, `NumField`, `Modal`, `Donut`, `LoanCard`, ...). |
| `src/help-content.js` | The per-tab Help panel copy. |
| `src/styles.js` | The app's CSS, as a template string injected via a `<style>` tag. |
| `vendor/` | Pinned copies of React, ReactDOM, PropTypes and Recharts. |
| `tests/` | Sync, engine, and end-to-end tests — see [Tests](#tests) below. |
| `package.json`, `build.mjs` | Dev tooling only (rebuilding `.js` from `.jsx`, running tests). Not shipped to the browser. |

## Editing

Each `.jsx` file is the source of truth for its compiled `.js` sibling. After
changing any of them, install the dev dependencies once and recompile:

```bash
npm install
npm run build
```

`build.mjs` walks `src/` and recompiles every `.jsx` file to its sibling
`.js`. The `classic` JSX runtime matters: it compiles JSX to
`React.createElement` calls, which the global `React` from `vendor/`
provides. The default `automatic` runtime emits `import` statements from
`react/jsx-runtime` instead, which isn't one of the vendored globals and
won't resolve in a plain `<script type="module">`. `npm test` (see below)
fails if any compiled `.js` is ever out of sync with its `.jsx` source, so a
forgotten rebuild gets caught before it ships.

Plain `.js` files under `src/` (no matching `.jsx`) have no JSX and need no
build step — edit and reload.

To preview locally, serve the repository root and open
`http://127.0.0.1:8000/financial-simulator/`:

```bash
python3 -m http.server 8000
```

Opening `index.html` directly via `file://` will not work — the browser blocks
the script loads.

## Tests

```bash
npm install
npm test              # every pure-logic test + the .jsx/.js sync guard — fast, no browser
npm run test:cov      # the same suite with a coverage report
npx playwright install --with-deps chromium   # once, before the first e2e run
npm run test:e2e       # browser tests (loads the real page in Chromium)
npm run test:all       # everything
```

- **`tests/sync.test.mjs`** — recompiles every `src/**/*.jsx` file and asserts
  each result is byte-identical to its committed `.js` sibling, plus a
  `node --check` syntax check on each. Catches "edited a `.jsx` file, forgot
  to rebuild."
- **`tests/engine.test.mjs`** — unit tests for the simulation engine
  (`simulateWeekly` and `projectMinWeekly` from `src/engine.js`) against small,
  deterministic scenarios. These are plain ES modules with no React dependency,
  so the tests `import` them directly — no browser, no stubbing. Covers the
  employer-match formula, card interest (charges, the grace period, partial
  payments), the debt rollover under both payoff strategies, account-cap sweeps
  and as-of dates, the real-terms inflation conversion (and that it's the
  identity at 0%), and the annual pre-tax contribution limit.
- **`tests/loan.test.mjs`** — `src/loan.js`: the amortizing payment against a
  textbook figure, payment ↔ term round-trips, and the case where a payment
  never covers the interest.
- **`tests/payroll.test.mjs`**, **`tests/recurrence.test.mjs`**,
  **`tests/seeds.test.mjs`**, **`tests/montecarlo.test.mjs`**,
  **`tests/sample.test.mjs`** — the remaining pure-logic modules: paycheck and
  promotion math, recurrence expansion, seed/normalization of older saved data,
  the Monte Carlo (accumulation and drawdown, including that volatility alone
  sinks plans the average return sustains), and the chart downsampler.
- **`tests/solve.test.mjs`**, **`tests/milestones.test.mjs`** — the goal seeker
  (a solved amount must really hit the target when replayed through the engine,
  and an impossible ask must say so) and the milestone list.
- **`tests/project.test.mjs`** — `src/project.js`, the seam the worker runs
  behind: that it changes nothing the page used to compute inline, and that
  splitting the comparison runs out of the primary result leaves it identical.
- **`tests/e2e.test.mjs`** — Playwright tests against the actual served page:
  the front-page link (skipped unless run inside a site checkout), the help
  panel (closed by default, follows the active tab), `localStorage` persistence
  across a reload, the one-time warning toast when storage writes fail, the
  redirect toggle, export → reset → import round-tripping, the inflation and
  payoff-strategy controls, the Monte Carlo's survival figure, that the
  projection really runs in a Web Worker *and* that the page produces the same
  numbers with `Worker` deleted, and a regression test that edits income and triggers
  every tab's chart tooltip (a past module-split bug — a missing import in a
  shared component — only surfaced once a Tooltip actually rendered, which
  static page-load checks don't trigger).

CI (`.github/workflows/test.yml`) runs the unit suite and the browser tests on
every pull request and every push to `main`. The deploy workflow
(`.github/workflows/sync-to-site.yml`) gates on it, so a failing suite blocks
the sync to the live site.

## Design notes

**No build step, no CDN.** React 18.3.1, ReactDOM 18.3.1, PropTypes 15.8.1 and
Recharts 2.15.4 are vendored in `vendor/` and loaded as plain UMD `<script>`
tags. The JSX is precompiled, so no in-browser transpiler is shipped. The page
works offline and won't break if a CDN changes or disappears.

**Icons are inline.** The original component imported `lucide-react`. Those
icons are now small local SVG components in `src/icons.jsx`, which removes a
dependency without changing how they look.

**Storage is `localStorage`.** The original component called `window.storage`,
a host-provided API that doesn't exist in a normal browser. It's replaced with
a small `store` wrapper over `localStorage`, so entries persist between visits
on the same device and browser. Data is keyed under `fin3:*`.

Everything stays on your device — there is no server, no account, and no
analytics. Use Export to save a portable JSON backup, and Import to restore it
or move it to another device. Clearing site data will erase your entries.

**Everything runs in today's dollars.** Every rate entered is nominal — returns, debt
APRs, annual raises, a promotion's future salary — and each is converted to a real rate
(`(1+r)/(1+i) − 1`) before it compounds, so 7% growth against 2.5% inflation compounds at
4.39%. Spending holds its value in the same terms. The deliberate exception is
nominally-fixed commitments: a loan payment stays the number on the contract while
everything around it gets dearer, so it's deflated week by week and quietly buys less. The
"show future dollars" switch is display only — it re-labels the charts in the money of the
day and moves no dates, because the independence target inflates at exactly the same rate
the balances do. At 0% inflation every conversion is the identity, which is what the older
engine tests assert.

**The projection also runs in reverse.** Goal seek binary-searches one lever — extra toward
debt, monthly investing, monthly spending — against one target: debt-free by a date,
independent by a date, or a survival percentage. It assumes monotonicity, which holds for
every pairing offered, and it reports honestly when it can't deliver: an unreachable target
says so rather than returning the ceiling dressed up as an answer, and a lever that doesn't
move the target at all ("spending less won't clear a loan sooner — the freed money piles up
in checking") says that instead. The sensitivity sweep nudges each input on its own and
ranks how far your independence date moves, which is usually not in the order you'd guess:
on the seed plan a point of inflation costs 18 months while $200/mo more invested buys one.

**Scenarios are the same shape as an export.** Save the plan under a name, pick one to
compare against, and the worker runs it alongside the live one — a ghost line on the net
worth chart and a table of how far apart the two put each milestone.

**The projection runs off the main thread.** Three 40-year simulations plus a Monte Carlo
is roughly 180ms of work, and it reruns on every keystroke. `src/project.js` puts all of it
behind one pure function, `src/worker.js` is a module worker around that — it `import`s the
same modules the page does, so there's still no bundler — and the page keeps rendering the
previous result while the next is in flight. Measured across eight edits in Chromium: 0ms
of main-thread blocking with the worker, ~1000ms without. If a worker can't start, the same
function runs inline instead and produces identical numbers.

**The Monte Carlo spends the portfolio down, not just up.** Past the retirement date
contributions stop and withdrawals begin, held constant in today's dollars — the assumption
behind the 4% rule. The headline figure is the share of runs where the money never ran out,
which is the sequence-of-returns question the deterministic chart cannot answer: two
portfolios with the same average return end very differently depending on *when* the bad
years land. Raising volatility barely moves the median line and cuts survival sharply,
which is the whole point. Withdrawals are charged only the share of spending the invested
pot represents — cash, savings and cleared debt fund the rest.

**Tax is opt-in, then it's everywhere.** An income keeps the take-home figure you typed
unless you switch it to derive one from `src/tax.js` — federal brackets, the standard
deduction, FICA, and a flat state rate. Once derived, a promotion needs no tax rate of its
own, and a raise is taxed at the rate the extra actually lands in rather than at last
year's average. The bracket tables are labelled with their year and held constant across
the projection, which is the consistent choice given everything runs in today's dollars:
real brackets are inflation-indexed, so a salary that keeps its real value keeps its real
rate.

Account tax treatment then decides three separate things — whether growth is docked each
year for tax on distributions, whether a withdrawal is taxed (so a tax-deferred dollar
counts for less toward independence than a Roth one), and whether the money can be reached
before 59½. That last one is what the **bridge** check reports: independence at 47 with
everything locked in a 401(k) isn't independence, and the Invest tab says how short the
reachable pile is.

**Guaranteed retirement income shrinks the target rather than replacing it.** Social
Security or a pension covers part of your spending forever after it starts, so the
portfolio only has to fund the gap — but until it starts, the target also carries the
capital to bridge those years yourself. The result is a target that slopes down toward the
start date instead of stepping, which is why the charts draw it as a line.

**Debt payoff order is a choice.** Surplus from a payment rolls either to the highest-rate
loan (avalanche, the cheapest) or to the smallest balance (snowball, which clears
individual loans soonest). The Debt tab runs the strategy you didn't pick as a second full
projection and prices the difference both ways, because the cheaper plan isn't always the
one someone sticks to.

**Monte Carlo reuses the deterministic contribution schedule.** The Invest
tab's "range of outcomes" chart takes the same week-by-week contributions the
deterministic engine already computed (`simulateWeekly`'s `basis` series) and
randomizes only the *returns* on top of them — a few hundred simulated paths
using a fixed-seed PRNG (`src/montecarlo.js`), so results are reproducible
rather than reshuffling on every unrelated edit. Returns are modeled as one
blended portfolio (your invested accounts' balance-weighted rate), not
per-account, since treating each account as an independent random walk would
overstate diversification that may not really be there. It steps monthly, not
weekly — the standard resolution for this kind of tool, and considerably
cheaper to recompute on every keystroke.

## Caveats

The deterministic projection holds returns, rates and spending constant in real
terms and works in today's dollars. Inflation is modelled only as a single
constant rate applied to every return, APR and raise; there is no tax on gains,
no volatility, and no sequence-of-returns risk. It's a directional tool for
comparing decisions against each other, not a forecast — and not financial advice.

The annual pre-tax contribution limit counts from today rather than from January,
so a mid-year start doesn't know what has already gone in this calendar year, and
it's applied per income source rather than per person — model two jobs for one
person and each gets its own allowance, which the IRS would not.

The retirement test models no spending flexibility: a real retiree cuts back after a
bad year, and that alone rescues many of the runs counted here as failures. It also
holds the withdrawal constant in real terms for the whole horizon, ignores fees, and
uses one blended return for the whole portfolio rather than an asset mix that shifts
as you age. Treat the survival percentage as a stress test, not a verdict.

The tax model is an estimate, not a return. Bracket tables are for the year named
in `src/tax.js` and go stale every January; state tax is a single flat rate rather
than real state brackets; there are no itemised deductions, credits, or
self-employment tax; and bonus withholding stays the flat rate you set, since
supplemental wages are withheld under a different regime. Withdrawals are docked a
single flat retirement rate rather than run back through the brackets, and the
59½ access date is inferred from a birth year alone, so it's accurate to within a
year either way.

The Monte Carlo chart relaxes the volatility assumption only, and only for
the invested portion of your net worth — cash, savings, and debt payoff still
move deterministically underneath it. It doesn't model sequence-of-returns
risk during retirement withdrawals, fees, taxes on gains, or inflation, and a
"chance of reaching your FI number" there is a narrower question than the
"Financial independence" date shown elsewhere (which counts your whole net
worth, not just what's invested) — see the in-app Help panel on that tab for
more.
