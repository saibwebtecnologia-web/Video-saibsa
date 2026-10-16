// Renderiza o vídeo: quadros determinísticos do Chromium -> ffmpeg (H.264).
//
//   node render/render.mjs                                  # vídeo completo, 60 fps -> out/video.mp4
//   node render/render.mjs --from 9 --to 21 --fps 30 --scale 0.5 --out out/preview-B.mp4
//   opções: --workers 3  --mb 4 (sub-quadros de motion blur)  --shutter 0.5  --crf 14  --only B
//           --grain 6 (granulação de filme no ffmpeg; 0 desliga)  --jpeg (captura mais rápida p/ prévias)
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, execFileSync } from "node:child_process";
import { serve, openPage, parseArgs, manifest, ROOT } from "./lib.mjs";

const a = parseArgs(process.argv.slice(2));
const m = manifest();
const fps = Number(a.fps || m.fps);
const from = Number(a.from || 0);
const to = Number(a.to || m.duration);
const scale = Number(a.scale || 1);
const mb = Math.max(1, Number(a.mb || 1));
const shutter = Number(a.shutter || 0.5);
const crf = String(a.crf || 14);
const grain = Number(a.grain ?? 6);
const fmt = a.jpeg ? "jpeg" : "png";
const workers = Number(a.workers || Math.max(1, Math.min(4, os.cpus().length - 1)));
const out = path.resolve(ROOT, a.out || "out/video.mp4");
const nFrames = Math.round((to - from) * fps);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "saib-render-"));
fs.mkdirSync(path.dirname(out), { recursive: true });

const { srv, port } = await serve();
const t0 = Date.now();
let done = 0;

async function renderChunk(w, i0, i1) {
  const P = await openPage({ port, scale, only: a.only || null });
  const seg = path.join(tmp, `seg${String(w).padStart(2, "0")}.mp4`);
  // sub-quadros entram a fps*mb e o tmix faz a média -> motion blur de obturador `shutter`
  const vf = [];
  if (mb > 1) vf.push(`tmix=frames=${mb}`, `select='not(mod(n\\,${mb}))'`, `setpts=N/(${fps}*TB)`);
  if (grain > 0) vf.push(`noise=c0s=${grain}:c0f=t+u:c1s=0:c2s=0`);
  vf.push("format=yuv420p");
  const ff = spawn(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps * mb), "-i", "-",
     "-vf", vf.join(","), "-r", String(fps), "-c:v", "libx264", "-preset", "slow", "-crf", crf,
     "-tune", "animation", "-x264-params", "keyint=" + fps * 2, "-pix_fmt", "yuv420p", seg],
    { stdio: ["pipe", "inherit", "inherit"] }
  );
  const write = (buf) => new Promise((res) => (ff.stdin.write(buf) ? res() : ff.stdin.once("drain", res)));
  for (let i = i0; i < i1; i++) {
    for (let k = 0; k < mb; k++) {
      // sub-quadros distribuídos na janela do obturador, terminando no instante do quadro
      const off = mb > 1 ? ((k - (mb - 1)) / (mb - 1)) * (shutter / fps) : 0;
      await P.seek(from + i / fps + off);
      await write(await P.shot({ format: fmt, quality: 95 }));
    }
    done++;
    if (done % 60 === 0) {
      const el = (Date.now() - t0) / 1000;
      process.stdout.write(`\r${done}/${nFrames} quadros  ${(done / el).toFixed(1)} q/s  ETA ${((nFrames - done) / (done / el)).toFixed(0)}s   `);
    }
  }
  const errs = await P.errors();
  await P.browser.close();
  ff.stdin.end();
  await new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg " + c)))));
  return { seg, errs };
}

const per = Math.ceil(nFrames / workers);
const jobs = [];
for (let w = 0; w < workers; w++) {
  const i0 = w * per, i1 = Math.min(nFrames, (w + 1) * per);
  if (i0 < i1) jobs.push(renderChunk(w, i0, i1));
}
const res = await Promise.all(jobs);
srv.close();
const list = path.join(tmp, "list.txt");
fs.writeFileSync(list, res.map((r) => `file '${r.seg}'`).join("\n"));
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", out]);
fs.rmSync(tmp, { recursive: true, force: true });
const errs = [...new Set(res.flatMap((r) => r.errs))];
console.log(`\nOK ${out}  (${nFrames} quadros, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
if (errs.length) {
  console.log("ERROS NA PÁGINA:");
  errs.forEach((e) => console.log("  " + e));
  process.exitCode = 2;
}
