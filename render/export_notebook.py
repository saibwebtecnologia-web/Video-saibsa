"""
Exporta o notebook 3D do SAIB Direct como um único HTML independente (abre em qualquer navegador, sem servidor).

Junta o código real do vídeo (src/core/fx.js, direct/core/ui.js, screens.js, styles.css, ícones Lucide e a fonte
Inter embutida em base64) e acrescenta uma demonstração interativa: arrastar gira o notebook, o controle abre e
fecha a tampa e os botões trocam a tela do portal.

Uso: python3 render/export_notebook.py  →  direct/export/notebook-saib-direct.html
"""
import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
D = ROOT / "direct"
OUT = D / "export" / "notebook-saib-direct.html"


def read(p):
    return (ROOT / p).read_text(encoding="utf-8")


def font_url(name):
    b = (D / "assets" / "fonts" / name).read_bytes()
    return "data:font/woff2;base64," + base64.b64encode(b).decode()


css = read("direct/core/styles.css")
css = css.replace("url(../assets/fonts/InterVar-opsz-latin-ext.woff2)", f"url({font_url('InterVar-opsz-latin-ext.woff2')})")
css = css.replace("url(../assets/fonts/InterVar-opsz-latin.woff2)", f"url({font_url('InterVar-opsz-latin.woff2')})")
# a página da demo não é um quadro fixo de 1080 × 1920: libera o html/body
css = re.sub(r"html,\s*body\s*\{[^}]*\}", "", css, count=1)

DEMO_CSS = """
html, body { margin:0; height:100%; background:#1f0b5c; overflow:hidden; font-family:var(--font); }
#wrap { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; }
#frame { position:relative; width:1080px; height:1920px; flex:none; transform-origin:50% 50%;
  background: radial-gradient(80% 55% at 50% 45%, #7c3aed 0%, #5b21b6 35%, #2e1080 70%, #1f0b5c 100%); cursor:grab; }
#frame:active { cursor:grabbing; }
#ui { position:fixed; left:50%; bottom:20px; transform:translateX(-50%); display:flex; flex-wrap:wrap; gap:8px; align-items:center; justify-content:center;
  padding:10px 14px; border-radius:16px; background:rgba(18,6,58,0.72); color:#fff; font:500 14px/1 var(--font); max-width:calc(100vw - 32px); }
#ui button { font:600 14px var(--font); color:#fff; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); border-radius:999px; padding:8px 14px; cursor:pointer; }
#ui button.on { background:#7c3aed; border-color:#a78bfa; }
#ui label { display:flex; align-items:center; gap:8px; }
"""

DEMO_JS = """
(function () {
  const ui = SAIB.ui, S = SAIB.screens;
  const frame = document.getElementById("frame");
  const stage = ui.stage3d();
  const lap = ui.laptop();
  ui.mount(stage, lap);
  frame.append(stage);
  const screens = {
    "Início": S.portalHome(), "Pedidos": S.portalOrders(0).el, "Aprovado": S.portalApproved(),
    "Ofertas": S.portalOffers(), "Nova oferta": S.portalNewOffer(), "Vendas": S.portalSales(),
  };
  const bar = document.getElementById("ui");
  const btns = {};
  const show = (k) => { lap.setScreen(screens[k]); for (const b in btns) btns[b].classList.toggle("on", b === k); };
  for (const k in screens) {
    const b = document.createElement("button");
    b.textContent = k;
    b.onclick = () => show(k);
    bar.append(b);
    btns[k] = b;
  }
  const lidIn = Object.assign(document.createElement("input"), { type: "range", min: 0, max: 130, value: ui.LID.hero });
  const lab = document.createElement("label");
  lab.append("Tampa", lidIn);
  bar.append(lab);
  show("Início");

  // pose base (notebook centralizado com folga para girar); arrastar gira (rz) e inclina (rx)
  const base = { x: 540, y: 1080, z: 0, rx: 62, ry: 0, rz: -18, s: 0.72 };
  let rz = base.rz, rx = base.rx, drag = null;
  frame.addEventListener("pointerdown", (e) => (drag = { x: e.clientX, y: e.clientY, rz, rx }));
  addEventListener("pointerup", () => (drag = null));
  addEventListener("pointermove", (e) => {
    if (!drag) return;
    const k = 0.25 / scale;
    rz = drag.rz + (e.clientX - drag.x) * k;
    rx = Math.max(20, Math.min(85, drag.rx + (e.clientY - drag.y) * k));
  });

  let scale = 1;
  const fit = () => {
    scale = Math.min(innerWidth / 1080, (innerHeight - 70) / 1920);
    frame.style.transform = `scale(${scale})`;
  };
  addEventListener("resize", fit);
  fit();

  const t0 = performance.now();
  (function loop(now) {
    const T = (now - t0) / 1000;
    lap.setLid(Number(lidIn.value));
    ui.pose(lap, ui.addPose(Object.assign({}, base, { rz, rx }), ui.drift(T)));
    lap.glare(((T % 6) / 6) * 1.6 - 0.3);
    requestAnimationFrame(loop);
  })(t0);
})();
"""

parts = [read("src/core/fx.js"), read("direct/core/lucide-nodes.js"), read("direct/core/ui.js"), read("direct/core/screens.js"), DEMO_JS]
html = f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Notebook 3D · SAIB Direct</title>
<style>{css}
{DEMO_CSS}</style>
</head>
<body>
<div id="wrap"><div id="frame"></div></div>
<div id="ui"></div>
""" + "\n".join(f"<script>\n{p}\n</script>" for p in parts) + "\n</body>\n</html>\n"
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html, encoding="utf-8")
print("ok", OUT, f"{len(html) / 1024:.0f} KB")
