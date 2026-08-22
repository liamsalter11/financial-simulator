// A static guard over the colour layer, in the same spirit as tests/sync.test.mjs.
//
// Chart colours are handed to Recharts as strings like "var(--cyan)" so that a theme can
// reach them without every tab knowing which theme is on. That works — SVG resolves var()
// exactly as CSS does — but it fails *silently*: a mistyped token paints nothing, and the
// line simply isn't there. Nothing else in the suite would catch it, and neither would a
// glance at the page unless you happened to be looking at that series in that theme.
//
// So: every token referenced from JS must exist in both palettes, and no raw colour may
// creep back into the files that are supposed to be theme-agnostic.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PAL, ACCT_PAL, DEBT_PAL, BUCKET_COLOR, CATEGORIES, catColor } from "../src/format.js";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const styles = read("../src/styles.js");
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/* the dark palette is the `.fin{…}` block; the light one is the LIGHT constant */
function block(name) {
  if (name === "light") {
    const m = /const LIGHT = `([\s\S]*?)`;/.exec(styles);
    assert.ok(m, "expected a LIGHT palette constant in styles.js");
    return m[1];
  }
  const m = /export const CSS = `\s*\.fin\{([\s\S]*?)\n\}/.exec(styles);
  assert.ok(m, "expected a .fin{…} block in styles.js");
  return m[1];
}
const defined = (name) => new Set([...stripComments(block(name)).matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

const DARK = defined("dark"), LIGHT = defined("light");
const tokensIn = (v) => [...String(v).matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]);

test("every colour the JS palettes name is defined in both themes", () => {
  const used = new Set([
    ...PAL, ...ACCT_PAL, ...DEBT_PAL, ...Object.values(BUCKET_COLOR),
    ...CATEGORIES.map((c) => c.color), catColor("nope"),
  ].flatMap(tokensIn));
  assert.ok(used.size >= 14, `expected the palettes to be tokenised, found ${used.size}`);
  for (const t of used) {
    assert.ok(DARK.has(t), `${t} is used by a chart palette but never defined`);
    assert.ok(LIGHT.has(t), `${t} has no light-theme value — the chart would keep its dark colour on white`);
  }
});

test("every colour token the stylesheet and the JSX reference is defined in both themes", () => {
  const sources = ["../src/styles.js", "../src/format.js", "../src/print.jsx", "../src/components.jsx",
    "../src/FinancialSimulator.jsx", "../src/tabs/OverviewTab.jsx", "../src/tabs/AccountsTab.jsx",
    "../src/tabs/CashFlowTab.jsx", "../src/tabs/DebtTab.jsx", "../src/tabs/InvestTab.jsx"];
  const skip = new Set(["--mono", "--sans"]);   /* fonts, not colours — one definition is enough */
  for (const src of sources) {
    for (const t of new Set(tokensIn(stripComments(read(src))))) {
      if (skip.has(t)) continue;
      assert.ok(DARK.has(t), `${t} (referenced in ${src}) is not defined in the dark palette`);
      assert.ok(LIGHT.has(t), `${t} (referenced in ${src}) is not defined in the light palette`);
    }
  }
});

test("the light palette overrides every colour the dark one sets, and adds none of its own", () => {
  const colours = (set) => [...set].filter((t) => !["--mono", "--sans"].includes(t)).sort();
  assert.deepEqual(colours(LIGHT), colours(DARK),
    "a token defined in one theme and not the other keeps its other-theme value — which is the bug this catches");
});

test("no raw colour literal survives outside the two palettes", () => {
  const literal = /#[0-9A-Fa-f]{3,8}\b|\brgba?\(/;
  /* format.js hands its strings to SVG, so a hex there can't follow the theme at all */
  assert.ok(!literal.test(stripComments(read("../src/format.js"))), "src/format.js should name tokens, not colours");
  for (const src of ["../src/print.jsx", "../src/components.jsx", "../src/tabs/OverviewTab.jsx",
    "../src/tabs/AccountsTab.jsx", "../src/tabs/CashFlowTab.jsx", "../src/tabs/DebtTab.jsx", "../src/tabs/InvestTab.jsx"]) {
    const body = stripComments(read(src)).replace(/"#" \+/g, "");   /* the loan card's "#3" rank label */
    assert.ok(!literal.test(body), `${src} should take its colours from tokens`);
  }
  /* and in the stylesheet, only the palette blocks may hold literals */
  const rules = stripComments(styles).split(".fin *{box-sizing:border-box;}")[1];
  assert.ok(!literal.test(rules), "styles.js rules should reference tokens, not literals");
});

test("print borrows the light palette rather than restating it", () => {
  assert.match(styles, /@media print\{[\s\S]*?\$\{LIGHT\}/,
    "the print block should interpolate LIGHT, so paper can't drift from the light theme");
});

test("the theme selectors cover all three states", () => {
  assert.match(styles, /\.fin\[data-theme="light"\]\{\$\{LIGHT\}\}/, "an explicit light choice");
  assert.match(styles, /@media\(prefers-color-scheme:light\)\{\.fin\[data-theme="auto"\]\{\$\{LIGHT\}\}\}/,
    "the OS preference, but only while the choice is auto");
  assert.match(block("dark"), /color-scheme:dark/, "dark is the base, so it declares its own color-scheme");
  assert.match(block("light"), /color-scheme:light/, "and light overrides it, or native controls stay dark");
});
