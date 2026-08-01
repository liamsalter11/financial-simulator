// Minimal static file server for e2e tests — serves the *parent* of this repo, so that
// both "/" (the site's front page) and "/financial-simulator/" resolve exactly as they do
// on GitHub Pages. That layout only exists when this repo is checked out inside a clone of
// liamsalter11.github.io; in a standalone clone (CI, or a fresh `git clone`) there is no
// front page to serve, which is what hasFrontPage() reports so those tests can skip
// instead of failing on something the repo doesn't contain.
import http from "node:http";
import { readFile, access } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = join(here, "..", "..", "..");

export async function hasFrontPage() {
  try { await access(join(repoRoot, "index.html")); return true; } catch { return false; }
}

const MIME = {
  ".html": "text/html", ".js": "application/javascript", ".jsx": "text/plain",
  ".css": "text/css", ".json": "application/json", ".md": "text/plain",
};

export function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      let urlPath = decodeURIComponent(req.url.split("?")[0]);
      if (urlPath.endsWith("/")) urlPath += "index.html";
      const filePath = join(repoRoot, urlPath);
      if (!filePath.startsWith(repoRoot)) { res.writeHead(403); res.end(); return; }
      try {
        const body = await readFile(filePath);
        res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
    });
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}
