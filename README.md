# Financial Simulator

A personal finance projection tool, served as a static page at
[liamsalter.com/financial-simulator/](https://liamsalter.com/financial-simulator/).

Enter your accounts, debts, income and spending, and it simulates them forward
week by week for up to 40 years — projecting net worth, a debt-free date, and a
financial-independence date.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The page. Loads the vendored libraries, then `app.js`. |
| `app.jsx` | **The source you edit.** React components and the simulation engine. |
| `app.js` | Compiled output of `app.jsx`. This is what the browser runs — do not edit by hand. |
| `vendor/` | Pinned copies of React, ReactDOM, PropTypes and Recharts. |

## Editing

`app.jsx` is the source of truth. After changing it, recompile to `app.js`:

```bash
npx --yes -p @babel/core@7 -p @babel/preset-react@7 node -e "
const babel = require('@babel/core'), fs = require('fs');
const out = babel.transformSync(fs.readFileSync('app.jsx','utf8'), {
  presets: [['@babel/preset-react', { runtime: 'classic' }]],
  filename: 'app.jsx', comments: false,
});
fs.writeFileSync('app.js', out.code);
"
```

The `classic` runtime matters: it compiles JSX to `React.createElement` calls,
which the global `React` from `vendor/` provides. The default `automatic`
runtime emits `import` statements instead, which won't run from a plain
`<script>` tag.

To preview locally, serve the repository root and open
`http://127.0.0.1:8000/financial-simulator/`:

```bash
python3 -m http.server 8000
```

Opening `index.html` directly via `file://` will not work — the browser blocks
the script loads.

## Design notes

**No build step, no CDN.** React 18.3.1, ReactDOM 18.3.1, PropTypes 15.8.1 and
Recharts 2.15.4 are vendored in `vendor/` and loaded as plain UMD `<script>`
tags. The JSX is precompiled, so no in-browser transpiler is shipped. The page
works offline and won't break if a CDN changes or disappears.

**Icons are inline.** The original component imported `lucide-react`. Those
icons are now small local SVG components at the top of `app.jsx`, which removes
a dependency without changing how they look.

**Storage is `localStorage`.** The original component called `window.storage`,
a host-provided API that doesn't exist in a normal browser. It's replaced with
a small `store` wrapper over `localStorage`, so entries persist between visits
on the same device and browser. Data is keyed under `fin3:*`.

Everything stays on your device — there is no server, no account, and no
analytics. Use Export to save a portable JSON backup, and Import to restore it
or move it to another device. Clearing site data will erase your entries.

## Caveats

The projection holds returns, rates and spending constant, works in today's
dollars, and models no inflation, tax on gains, volatility or
sequence-of-returns risk. It's a directional tool for comparing decisions
against each other, not a forecast — and not financial advice.
