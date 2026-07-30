// Regenerates app.js from app.jsx. Run via `npm run build` after editing app.jsx —
// see README.md for why the classic JSX runtime matters here.
import babel from "@babel/core";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "app.jsx"), "utf8");

const { code } = babel.transformSync(source, {
  presets: [["@babel/preset-react", { runtime: "classic" }]],
  filename: "app.jsx",
  comments: false,
});

writeFileSync(join(here, "app.js"), code);
console.log(`Wrote app.js (${code.length} bytes)`);
