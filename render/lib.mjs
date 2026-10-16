// Infra compartilhada: servidor estático do repositório + abertura da página no Chromium.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  for (const p of ["playwright", "/opt/node-tools/node_modules/playwright"]) {
    try {
      return require(p);
    } catch {}
  }
  throw new Error("playwright não encontrado (npm i -D playwright)");
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

export function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
      const f = path.join(ROOT, u);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream", "cache-control": "no-store" });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, "127.0.0.1", () => resolve({ srv, port: srv.address().port }));
  });
}

export async function openPage({ port, scale = 1, only = null, safe = false }) {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({
    args: ["--disable-gpu-vsync", "--disable-frame-rate-limit", "--font-render-hinting=none", "--force-color-profile=srgb"],
  });
  const context = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: scale });
  const page = await context.newPage();
  const logs = [];
  page.on("console", (m) => m.type() === "error" && logs.push(m.text()));
  page.on("pageerror", (e) => logs.push("pageerror: " + e.message));
  const q = new URLSearchParams();
  if (only) q.set("only", only);
  if (safe) q.set("safe", "1");
  await page.goto(`http://127.0.0.1:${port}/src/index.html?${q}`);
  await page.waitForFunction(() => window.SAIB && window.SAIB.ready === true, null, { timeout: 30000 });
  const seek = async (t) => {
    await page.evaluate((t) => SAIB.seek(t), t);
  };
  // captura via CDP (bem mais rápida que page.screenshot)
  const cdp = await context.newCDPSession(page);
  const shot = async ({ format = "png", quality = 92 } = {}) => {
    const r = await cdp.send("Page.captureScreenshot", {
      format,
      ...(format === "jpeg" ? { quality } : {}),
      optimizeForSpeed: true,
      captureBeyondViewport: false,
    });
    return Buffer.from(r.data, "base64");
  };
  const errors = async () => [...new Set([...(await page.evaluate(() => SAIB.errors)), ...logs])];
  return { browser, page, seek, shot, errors };
}

export function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const k = argv[i].slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      a[k] = v;
    }
  }
  return a;
}

export function manifest() {
  const src = fs.readFileSync(path.join(ROOT, "src/manifest.js"), "utf8");
  const win = { SAIB: {} };
  new Function("window", "SAIB", src)(win, win.SAIB);
  return win.SAIB.manifest;
}
