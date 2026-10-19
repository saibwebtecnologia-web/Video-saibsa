/*
 * Utilitários de cena compartilhados pelos atos S1–S8: título cinético (palavras sobem de dentro de
 * uma máscara, desfoque → nítido, palavra-chave com peso que muda), pílula de vidro e o "rig" de aparelhos
 * (celular + notebook + linha holográfica, cada aparelho no seu stage3d).
 */
(function () {
  const { h, tw, ease, prog, lerp, clamp } = SAIB.fx;
  const ui = SAIB.ui;

  /*
   * title(parent, texto, o) → { el, words, update(t, at, out) }
   * Quebra de linha com "\n"; *palavra* = destaque holográfico com peso que cresce (o.hlFrom → o.weight).
   * update: entra em `at` (palavra a palavra, o.stag), sai em `out` (null = não sai).
   */
  function title(parent, text, o = {}) {
    const { top = 230, left = 80, width = 920, size = 104, weight = 760, lh = 1.02, align = "left", stag = 0.065, hlFrom = 320, color = "#fff", ls = -0.035 } = o;
    const el = h("div", {
      class: "kt",
      style: {
        position: "absolute", left: left + "px", top: top + "px", width: width + "px", fontSize: size + "px",
        fontFamily: "var(--font)", fontOpticalSizing: "auto", fontWeight: weight, lineHeight: lh, letterSpacing: ls + "em", textAlign: align, color,
      },
    });
    const words = [];
    text.split("\n").forEach((line) => {
      const ln = h("div", { style: { whiteSpace: "nowrap" } });
      line.split(" ").forEach((w, i) => {
        const hl = /^\*.+\*[.,!?:]*$/.test(w);
        const txt = w.replace(/\*/g, "");
        const inner = h("span", { class: hl ? "holo-text" : "", text: txt, style: { display: "inline-block", willChange: "transform" } });
        const mask = h("span", {
          style: { display: "inline-block", overflow: "hidden", padding: "0.1em 0.06em 0.16em", margin: "-0.1em -0.06em -0.16em", verticalAlign: "top" },
        }, [inner]);
        if (i) ln.append(document.createTextNode(" "));
        ln.append(mask);
        words.push({ inner, hl });
      });
      el.append(ln);
    });
    parent.append(el);
    function update(t, at, out = null, u = {}) {
      const s = u.stag ?? stag;
      const last = at + (words.length - 1) * s;
      if (t < at - 0.05 || (out !== null && t > out + 0.42 + words.length * 0.025)) {
        el.style.display = "none";
        return;
      }
      el.style.display = "block";
      words.forEach((w, i) => {
        const a = at + i * s;
        const p = tw(t, a, 0.85, ease.signature);
        let y = (1 - p) * 108, op = prog(t, a, a + 0.32), bl = (1 - p) * 9, dy = 0;
        if (out !== null) {
          const q = tw(t, out + i * 0.025, 0.42, ease.inCubic);
          dy = -q * 0.5 * size;
          op *= 1 - q;
          bl += q * 10;
        }
        w.inner.style.transform = `translate3d(0, calc(${y.toFixed(2)}% + ${dy.toFixed(2)}px), 0)`;
        w.inner.style.opacity = op.toFixed(4);
        w.inner.style.filter = bl > 0.15 ? `blur(${bl.toFixed(2)}px)` : "none";
        if (w.hl) w.inner.style.fontWeight = Math.round(lerp(hlFrom, weight + 60, ease.inOutCubic(prog(t, a + 0.15, a + 1.0))));
      });
      return last;
    }
    return { el, words, update };
  }

  // pílula de vidro com ícone opcional
  function pill(text, o = {}) {
    const { icon, size = 30, pad = "16px 26px", weight = 600 } = o;
    const el = h("div", {
      class: "glass sc-pill",
      style: { position: "absolute", display: "flex", alignItems: "center", gap: "14px", padding: pad, borderRadius: "999px", fontSize: size + "px", fontWeight: weight, whiteSpace: "nowrap", letterSpacing: "-0.01em" },
    });
    if (icon) el.append(ui.icon(icon, { size: size * 1.15, stroke: 2.2 }));
    el.append(h("span", { text, style: { position: "relative" } }));
    return el;
  }

  /*
   * rig(root, {phone, laptop, line}) → { phone, laptop, line, sP, sL, show(stage, op) }
   * Ordem de pintura: notebook, linha, celular (o celular fica à frente).
   */
  function rig(root, o = {}) {
    const r = {};
    if (o.laptop) {
      r.sL = ui.stage3d();
      r.laptop = ui.laptop();
      ui.mount(r.sL, r.laptop);
      root.append(r.sL);
    }
    if (o.line) {
      r.line = ui.holoPath();
      root.append(r.line.el);
    }
    if (o.phone) {
      r.sP = ui.stage3d();
      r.phone = ui.phone();
      ui.mount(r.sP, r.phone);
      root.append(r.sP);
    }
    r.show = (stage, op) => {
      op = clamp(op);
      stage.style.display = op <= 0.001 ? "none" : "block";
      stage.style.opacity = op.toFixed(4);
    };
    return r;
  }

  // aplica uma pose + deriva global
  const place = (dev, P, T, amp = 1) => ui.pose(dev, ui.addPose(P, ui.drift(T, amp)));

  // opacidade de um nó de tela (para crossfades com setScreen([a, b]))
  const fade = (el, op) => {
    el.style.opacity = clamp(op).toFixed(4);
    el.style.visibility = op <= 0.001 ? "hidden" : "visible";
  };

  SAIB.scene = { title, pill, rig, place, fade };
})();
