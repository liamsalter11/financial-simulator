// Guards against editing a src/**/*.jsx file and forgetting to regenerate its sibling
// .js — the file the browser actually loads. See README.md for why the classic JSX
// runtime is required.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";
import { execFileSync } from "node:child_process";
import babel from "@babel/core";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const srcFiles = walk(join(root, "src"));
const jsxFiles = srcFiles.filter((p) => p.endsWith(".jsx"));

test("every src/**/*.jsx file has at least one compiled counterpart to check", () => {
  assert.ok(jsxFiles.length > 0, "expected to find .jsx source files under src/");
});

for (const jsxPath of jsxFiles) {
  const label = relative(root, jsxPath);
  const jsPath = jsxPath.replace(/\.jsx$/, ".js");

  test(`${label} compiles to exactly what's committed`, () => {
    const source = readFileSync(jsxPath, "utf8");
    const shipped = readFileSync(jsPath, "utf8");

    const { code } = babel.transformSync(source, {
      presets: [["@babel/preset-react", { runtime: "classic" }]],
      filename: label,
      comments: false,
    });

    assert.equal(
      shipped,
      code,
      `${jsPath} is out of sync with ${label} — run \`npm run build\` and commit the result`,
    );
  });

  test(`${label}'s compiled output is syntactically valid standalone JavaScript`, () => {
    // node --check parses without executing, so this doesn't need the React/DOM
    // globals the file expects at runtime.
    assert.doesNotThrow(() => {
      execFileSync(process.execPath, ["--check", jsPath]);
    });
  });
}

/* The pairs above cover every file the build writes. The hand-written `.js` modules — the
   pure-logic ones, and `styles.js`, which is a stylesheet inside a template literal — are
   never compiled, so nothing else parses them until a browser does. `styles.js` in
   particular is a JS file that mostly isn't JS: a stray backtick in a CSS comment ends the
   template and turns the next line into an expression, and the page dies on load with the
   whole suite of unit tests still green. */
const plainJs = srcFiles.filter((p) => p.endsWith(".js") && !jsxFiles.includes(p.replace(/\.js$/, ".jsx")));

for (const jsPath of plainJs) {
  test(`${relative(root, jsPath)} is syntactically valid JavaScript`, () => {
    assert.doesNotThrow(() => execFileSync(process.execPath, ["--check", jsPath]));
  });
}
