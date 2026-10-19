// Renderiza quadros do banco de testes do kit (direct/kit-test.html) em out/direct/kit/.
//   node direct/kit-test.mjs                    # t = 0.5, 1.5, ... 5.5 (imprime os retângulos no quadro)
//   node direct/kit-test.mjs --times 1.2,3.5 --safe --scale 0.5 --out out/direct/kit/x
//   --ov '{"phoneSplit":{"s":0.5}}'  sobrepõe poses · --lid '{"hero":100}' · --warm 1 · --empty (só fundo)
//   --bench 8  custo por quadro (seek + captura JPEG) · --mut "js"  roda JS na página antes · --flags disable-gpu
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { serve, parseArgs, ROOT } from "../render/lib.mjs";

const a = parseArgs(process.argv.slice(2));
const times = a.times ? String(a.times).split(",").map(Number) : [0.5, 1.5, 2.5, 3.5, 4.5, 5.5];
const out = path.resolve(ROOT, a.out || "out/direct/kit");
fs.mkdirSync(out, { recursive: true });
const require = createRequire(import.meta.url);
let pw;
for (const p of ["playwright", "/opt/node-tools/node_modules/playwright"]) {
  try {
    pw = require(p);
    break;
  } catch {}
}
const { srv, port } = await serve();
const extra = a.flags ? String(a.flags).split(",").map((f) => "--" + f) : [];
const browser = await pw.chromium.launch({ args: ["--disable-gpu-vsync", "--disable-frame-rate-limit", "--font-render-hinting=none", "--force-color-profile=srgb", ...extra] });
const context = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: Number(a.scale || 1) });
const page = await context.newPage();
const logs = [];
page.on("console", (m) => m.type() === "error" && logs.push(m.text()));
page.on("pageerror", (e) => logs.push("pageerror: " + e.message));
const qs = new URLSearchParams();
if (a.safe) qs.set("safe", "1");
if (a.ov) qs.set("ov", a.ov);
if (a.lid) qs.set("lid", a.lid);
if (a.empty) qs.set("empty", "1");
if (a.warm !== undefined) qs.set("warm", a.warm);
await page.goto(`http://127.0.0.1:${port}/direct/kit-test.html?${qs}`);
await page.waitForFunction(() => window.SAIB && window.SAIB.ready === true, null, { timeout: 30000 });
if (a.mut) await page.evaluate(a.mut);
const cdp = await context.newCDPSession(page);
const shot = async () => Buffer.from((await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true })).data, "base64");
// aquecimento
await page.evaluate(() => SAIB.seek(0.1));
await shot();
const t0 = Date.now();
let seekMs = 0;
for (const t of times) {
  seekMs += await page.evaluate((t) => {
    const s = performance.now();
    SAIB.seek(t);
    document.body.getBoundingClientRect();
    return performance.now() - s;
  }, t);
  fs.writeFileSync(path.join(out, `k${t.toFixed(2)}.png`), await shot());
  const R = await page.evaluate(() => SAIB.kitRects);
  console.log(t.toFixed(2), JSON.stringify(R));
}
const per = (Date.now() - t0) / times.length;
// --bench: custo por quadro (seek + captura JPEG) por composição, com pequenas variações de tempo
if (a.bench) {
  const jpg = async () => (await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 80, optimizeForSpeed: true })).data.length;
  for (const t of times) {
    const n = Number(a.bench) || 8;
    const s0 = Date.now();
    for (let i = 0; i < n; i++) {
      await page.evaluate((t) => SAIB.seek(t), t + i * Number(a.step ?? 0.011));
      await jpg();
    }
    console.log(`bench t=${t}: ${((Date.now() - s0) / n).toFixed(0)} ms/quadro (jpeg)`);
  }
}
const errs = [...new Set([...(await page.evaluate(() => SAIB.errors)), ...logs])];
await browser.close();
srv.close();
console.log(`quadros em ${out}`);
console.log(`médio por quadro: ${per.toFixed(0)} ms (seek JS ${(seekMs / times.length).toFixed(1)} ms)`);
if (errs.length) {
  console.log("ERROS:\n  " + errs.join("\n  "));
  process.exitCode = 2;
}
