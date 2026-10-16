// Renderiza quadros avulsos e (opcional) uma folha de contato para revisão visual.
//
// Exemplos:
//   node render/stills.mjs --times 0.5,1.2,3                      # tempos globais
//   node render/stills.mjs --act B --local 0,0.5,1,2              # tempos locais do ato B
//   node render/stills.mjs --act B --sheet 0.25                   # folha de contato do ato inteiro a cada 0.25 s
//   node render/stills.mjs --from 9 --to 11 --sheet 0.1 --only B  # folha de um trecho, carregando só o ato B
//   opções: --scale 0.5 (padrão p/ folhas) --safe (guias) --out out/stills/x --cols 6
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { serve, openPage, parseArgs, manifest, ROOT } from "./lib.mjs";

const a = parseArgs(process.argv.slice(2));
const m = manifest();
let times = [];
let label = "stills";
const act = a.act ? m.acts.find((x) => x.id === a.act) : null;
if (a.act && !act) throw new Error("ato desconhecido " + a.act);

if (a.times) times = String(a.times).split(",").map(Number);
if (a.local && act) times = String(a.local).split(",").map((t) => act.start + Number(t));
if (a.sheet) {
  const step = Number(a.sheet);
  const from = a.from !== undefined ? Number(a.from) : act ? act.start - m.transition : 0;
  const to = a.to !== undefined ? Number(a.to) : act ? act.end + m.transition : m.duration;
  for (let t = from; t <= to + 1e-6; t += step) times.push(Math.round(t * 1000) / 1000);
}
if (!times.length) throw new Error("passe --times, --local ou --sheet");
label = a.act ? `act${a.act}` : "range";

const out = path.resolve(ROOT, a.out || `out/stills/${label}`);
fs.mkdirSync(out, { recursive: true });
const scale = Number(a.scale || (a.sheet ? 0.5 : 1));
const { srv, port } = await serve();
const P = await openPage({ port, scale, only: a.only || null, safe: !!a.safe });
const files = [];
const tStart = Date.now();
for (const t of times) {
  await P.seek(t);
  const f = path.join(out, `t${t.toFixed(3).padStart(8, "0")}.png`);
  fs.writeFileSync(f, await P.shot());
  files.push({ t, f });
}
const msPer = (Date.now() - tStart) / times.length;
const errs = await P.errors();
await P.browser.close();
srv.close();

if (a.sheet) {
  const sheet = path.join(out, "_sheet.png");
  const cols = String(a.cols || 6);
  execFileSync("python3", [path.join(ROOT, "render/sheet.py"), sheet, cols, ...files.flatMap((x) => [String(x.t), x.f])], {
    stdio: "inherit",
  });
  console.log("SHEET " + sheet);
}
for (const x of files) console.log(`${x.t.toFixed(3)}s  ${x.f}`);
console.log(`tempo médio por quadro (seek+captura, escala ${scale}): ${msPer.toFixed(0)} ms`);
if (errs.length) {
  console.log("ERROS NA PÁGINA:");
  errs.forEach((e) => console.log("  " + e));
  process.exitCode = 2;
}
