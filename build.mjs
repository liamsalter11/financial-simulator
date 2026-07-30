// Compiles every .jsx source file under src/ to a sibling .js file (same directory,
// same basename) — that sibling .js is what index.html actually loads. Run via
// `npm run build` after editing any .jsx file — see README.md for why the classic
// JSX runtime matters here. Plain .js files under src/ have no JSX and need no build
// step; they're loaded directly.
import babel from "@babel/core";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "src");

function findJsxFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...findJsxFiles(full));
    else if (entry.endsWith(".jsx")) out.push(full);
  }
  return out;
}

let total = 0;
for (const jsxPath of findJsxFiles(srcDir)) {
  const source = readFileSync(jsxPath, "utf8");
  const { code } = babel.transformSync(source, {
    presets: [["@babel/preset-react", { runtime: "classic" }]],
    filename: jsxPath,
    comments: false,
  });
  const jsPath = jsxPath.replace(/\.jsx$/, ".js");
  writeFileSync(jsPath, code);
  console.log(`Wrote ${jsPath.slice(here.length + 1)} (${code.length} bytes)`);
  total++;
}
console.log(`Compiled ${total} file(s).`);
