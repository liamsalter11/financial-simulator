// Packages the app into one self-contained HTML file, so a branch can be looked at without
// checking it out. `.github/workflows/preview.yml` runs this on every pull request and
// publishes the result; `npm run preview` does the same thing locally.
//
// Dev tooling, like build.mjs — never shipped to the browser as part of the app.
//
// There is no bundler here and none is needed. Nothing about the modules is rewritten:
// each one becomes a blob URL, and the import specifiers inside it are repointed at the
// blob URLs of the modules it depends on. Module semantics stay the browser's own, so a
// preview cannot quietly differ from the real page in the way a hand-rolled bundler would.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const ENTRY = join(ROOT, "src/main.js");
const VENDOR = [
  "vendor/react.production.min.js",
  "vendor/react-dom.production.min.js",
  "vendor/prop-types.min.js",
  "vendor/recharts.js",
];

/* `from "./x.js"` — the only import form the app uses, in every module */
const SPEC = /(\bfrom\s*)(["'])(\.[^"']+)\2/g;

export function moduleGraph(entry = ENTRY, root = ROOT) {
  const seen = new Map();
  const order = [];
  const walk = (abs) => {
    if (seen.has(abs)) return;
    const src = readFileSync(abs, "utf8");
    const deps = [...src.matchAll(SPEC)].map((m) => resolve(dirname(abs), m[3]));
    seen.set(abs, true);
    for (const d of deps) walk(d);
    order.push({ id: relative(root, abs), src });   /* after its deps — topological */
  };
  walk(entry);
  return order;
}

export function buildPreview({ label = "", vendorBase = "", noindex = true } = {}) {
  const modules = moduleGraph();

  /* Inlining the vendored libraries costs ~640 KB a build, which is most of the file and
     all of the growth in whatever repo the previews are committed to. When the branch
     hasn't touched vendor/, point at the copies already on the site instead; when it has,
     inline them, because then the preview is exactly about that change. */
  const vendorTags = vendorBase
    ? VENDOR.map((v) => `<script src="${vendorBase.replace(/\/$/, "")}/${v}"></script>`).join("\n")
    : VENDOR.map((v) => `<script>${readFileSync(join(ROOT, v), "utf8")}\n</script>`).join("\n");

  /* the pre-mount styles from index.html, so the page paints its theme the same way */
  const indexHtml = readFileSync(join(ROOT, "index.html"), "utf8");
  const preStyles = (/<style>([\s\S]*?)<\/style>/.exec(indexHtml) || [, ""])[1]
    .replace(/#back-link[^}]*\}/g, "");   /* the link back to the site has nowhere to go here */

  /* Served as a bare .html rather than through the app's index.html, so it has to declare
     its own charset — without it every "·" in the UI arrives as mojibake. */
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Financial Simulator preview</title>
${noindex ? '<meta name="robots" content="noindex, nofollow">\n' : ""}<style>${preStyles}
  /* Deliberately fixed rather than theme-aware: this bar is scaffolding, not part of the
     app, and should read that way in either theme. Amber on brown is the app's own
     .tabbtn.active pairing, so it belongs to the same world without posing as UI. */
  .prevbar{position:fixed;left:0;right:0;bottom:0;z-index:200;display:flex;gap:8px;align-items:center;
    justify-content:center;flex-wrap:wrap;padding:7px 14px;letter-spacing:.04em;
    font:600 11px/1.5 ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;
    background:#F5A623;color:#1A1206;}
  .prevbar b{font-weight:700;}
  .prevbar span{opacity:.74;}
  @media print{.prevbar{display:none;}}
</style>
<div id="root"><div id="loading">loading…</div></div>
<div class="prevbar">
  PREVIEW${label ? ` · <b>${label}</b>` : ""}
  <span>· saves to its own storage, not the live site's</span>
  <span>· the projection runs on the main thread here, so typing lags a little more than it will in production</span>
</div>
${vendorTags}
<script>
/* the theme is stamped before the app mounts, exactly as index.html does it */
try { var t = localStorage.getItem("fin3:theme"); if (t === "light" || t === "dark") document.documentElement.dataset.theme = t; } catch (e) { }
</script>
<script>
const MODULES = ${JSON.stringify(modules)};
const urls = {};
for (const m of MODULES) {
  const src = m.src.replace(/(\\bfrom\\s*)(["'])(\\.[^"']+)\\2/g, (full, kw, q, spec) => {
    const id = new URL(spec, "file:///" + m.id).pathname.slice(1);
    return urls[id] ? kw + q + urls[id] + q : full;
  });
  urls[m.id] = URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
}
import(urls["src/main.js"]).catch((e) => {
  document.getElementById("root").innerHTML =
    '<pre style="color:#E8695B;font:12px ui-monospace,monospace;padding:20px;white-space:pre-wrap">Preview failed to boot:\\n' + (e && e.message) + '</pre>';
});
</script>
`;
}

/* run directly: node preview.mjs [--out path] [--label text] [--vendor-base url] */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = (name, fb) => {
    const i = process.argv.indexOf("--" + name);
    return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fb;
  };
  const out = arg("out", join(ROOT, "preview.html"));
  const html = buildPreview({ label: arg("label", ""), vendorBase: arg("vendor-base", "") });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log(`Wrote ${out} — ${moduleGraph().length} modules, ${(html.length / 1024).toFixed(0)} KB`);
}
