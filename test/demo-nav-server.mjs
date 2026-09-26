// 只服务 dist-demos，在非根路径检验发布链接；不允许退回作者源码。
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
const root = resolve("dist-demos");
const mime = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (pathname === "/favicon.ico") { response.writeHead(204).end(); return; }
    if (!pathname.startsWith("/preview/")) { response.writeHead(404).end(); return; }
    const relative = pathname.slice("/preview/".length);
    const file = resolve(root, relative + (relative.endsWith("/") ? "index.html" : ""));
    if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    const bytes = await readFile(file);
    response.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" }).end(bytes);
  } catch { response.writeHead(404).end(); }
}).listen(5190, "127.0.0.1", () => console.log("Demo artifacts: http://127.0.0.1:5190/preview/demos/index.html"));
