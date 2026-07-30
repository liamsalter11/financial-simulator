// Minimal static file server for e2e tests — serves the repo root so both "/" (the
// front page) and "/financial-simulator/" resolve exactly as they do on GitHub Pages.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = join(here, "..", "..", "..");

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
