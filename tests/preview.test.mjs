// The preview packager (preview.mjs) turns the module graph into blob URLs rather than
// rewriting anything, which makes it robust — but only for the import forms it knows about.
// Add a default import, a namespace import or a bare side-effect import to a module and the
// specifier would survive unrewritten into the output, where it resolves against a blob URL
// and the preview boots to a blank page. Nothing else in the suite would notice, because
// the app itself is fine; only the preview breaks.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPreview, moduleGraph } from "../preview.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const walk = (dir) => readdirSync(dir).flatMap((e) => {
  const full = join(dir, e);
  return statSync(full).isDirectory() ? walk(full) : [full];
});

test("the packager reaches every module the app actually loads", () => {
  const packed = new Set(moduleGraph().map((m) => m.id.replace(/\\/g, "/")));
  assert.ok(packed.has("src/main.js"), "the entry point");
  assert.ok(packed.size > 10, `expected the whole graph, got ${packed.size}`);

  /* every shipped .js under src/ should be reachable from main.js — except worker.js, which
     the app loads with `new Worker`, not with an import (and which a bundled preview
     deliberately falls back from). */
  const shipped = walk(join(ROOT, "src"))
    .filter((f) => f.endsWith(".js"))
    .map((f) => f.slice(ROOT.length).replace(/\\/g, "/"))
    .filter((f) => f !== "src/worker.js");
  for (const f of shipped) assert.ok(packed.has(f), `${f} is shipped but the preview never packs it`);
});

test("every import in every packed module resolves to another packed module", () => {
  /* The specifiers are still in the payload by design — the bootstrap repoints them at blob
     URLs in the browser, at load time. What has to hold is that each one *can* be repointed:
     a specifier whose target the graph never collected is left untouched, resolves against a
     blob URL, and the preview boots blank. */
  const modules = moduleGraph();
  const ids = new Set(modules.map((m) => m.id.replace(/\\/g, "/")));
  for (const m of modules) {
    const from = m.id.replace(/\\/g, "/");
    for (const match of m.src.matchAll(/\bfrom\s*(["'])(\.[^"']+)\1/g)) {
      const target = new URL(match[2], "file:///" + from).pathname.slice(1);
      assert.ok(ids.has(target), `${from} imports ${match[2]} → ${target}, which the preview never packs`);
    }
  }
});

test("the app only uses the one import form the packager rewrites", () => {
  /* `import { … } from "…"` is the only form in the codebase. A default import, a namespace
     import or a bare side-effect import would slip past the rewrite untouched. */
  for (const m of moduleGraph()) {
    for (const line of m.src.split("\n")) {
      if (!/^\s*import\b/.test(line)) continue;
      assert.match(line, /^\s*import\s*\{[^}]*\}\s*from\s*["']/,
        `${m.id} uses an import form the preview packager doesn't rewrite: ${line.trim()}`);
    }
  }
});

test("the page carries what a bare .html needs to render correctly", () => {
  const html = buildPreview({ label: "PR #1" });
  assert.match(html, /<meta charset="utf-8">/, "without a charset every · arrives as mojibake");
  assert.match(html, /<meta name="viewport"/);
  assert.match(html, /<meta name="robots" content="noindex/, "previews must not be indexed");
  assert.match(html, /<div id="root">/);
  assert.match(html, /PREVIEW/, "and must say it isn't the real thing");
  assert.match(html, /PR #1/);
});

test("vendor can be linked instead of inlined, and that is the whole size difference", () => {
  const inlined = buildPreview({});
  const linked = buildPreview({ vendorBase: "/financial-simulator" });
  assert.ok(!/<script src=/.test(inlined), "inlined builds carry the libraries themselves");
  assert.match(linked, /<script src="\/financial-simulator\/vendor\/recharts\.js"><\/script>/);
  assert.ok(linked.length < inlined.length / 2,
    `linking vendor should more than halve the file: ${linked.length} vs ${inlined.length}`);
});
