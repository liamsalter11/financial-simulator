// Guards against editing app.jsx and forgetting to regenerate app.js — the file the
// browser actually loads. See README.md for why the classic JSX runtime is required.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import babel from "@babel/core";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

test("app.js is exactly what compiling app.jsx produces right now", () => {
  const source = readFileSync(join(root, "app.jsx"), "utf8");
  const shipped = readFileSync(join(root, "app.js"), "utf8");

  const { code } = babel.transformSync(source, {
    presets: [["@babel/preset-react", { runtime: "classic" }]],
    filename: "app.jsx",
    comments: false,
  });

  assert.equal(
    shipped,
    code,
    "app.js is out of sync with app.jsx — rebuild it (see README.md's rebuild command) and commit the result",
  );
});

test("app.js is syntactically valid standalone JavaScript", () => {
  // node --check parses without executing, so this doesn't need the React/DOM globals
  // the file expects at runtime.
  assert.doesNotThrow(() => {
    execFileSync(process.execPath, ["--check", join(root, "app.js")]);
  });
});
