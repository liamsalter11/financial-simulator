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
| `src/loan.js` | Amortization: payment ↔ term ↔ months-to-payoff. |
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
  the Monte Carlo bands, and the chart downsampler.
- **`tests/e2e.test.mjs`** — Playwright tests against the actual served page:
  the front-page link (skipped unless run inside a site checkout), the help
  panel (closed by default, follows the active tab), `localStorage` persistence
  across a reload, the one-time warning toast when storage writes fail, the
  redirect toggle, export → reset → import round-tripping, the inflation and
  payoff-strategy controls, and a regression test that edits income and triggers
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

The Monte Carlo chart relaxes the volatility assumption only, and only for
the invested portion of your net worth — cash, savings, and debt payoff still
move deterministically underneath it. It doesn't model sequence-of-returns
risk during retirement withdrawals, fees, taxes on gains, or inflation, and a
"chance of reaching your FI number" there is a narrower question than the
"Financial independence" date shown elsewhere (which counts your whole net
worth, not just what's invested) — see the in-app Help panel on that tab for
more.
