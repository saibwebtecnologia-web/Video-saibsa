/*
 * S1 · Gancho (0,0–3,6). "Seu cliente ainda pede por WhatsApp?" em tipografia gigante sobre fragmentos
 * do jeito manual (balões genéricos, áudio, ligação perdida, planilha). "WhatsApp?" ganha peso e é riscado
 * por uma linha holográfica; a frase se desmonta, as letras voam para dentro do contorno do celular, que se
 * materializa em POSES.phoneFront com a tela de abertura (emenda com S2 em 3,6).
 */
SAIB.act("S1", {
  css: `
  [data-act="S1"] .s1-title { position:absolute; left:80px; top:610px; width:940px; font-family:var(--font); font-optical-sizing:auto;
    font-size:124px; font-weight:800; line-height:1.0; letter-spacing:-0.045em; color:#fff; }
  [data-act="S1"] .s1-line { white-space:nowrap; }
  [data-act="S1"] .s1-line .fx-char { will-change:transform; }
  [data-act="S1"] .s1-frag { position:absolute; font-family:var(--font); color:rgba(255,255,255,0.92); }
  [data-act="S1"] .s1-bub { padding:22px 30px; border-radius:30px 30px 30px 8px; background:rgba(255,255,255,0.13);
    box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.16); font-size:34px; font-weight:520; white-space:nowrap; }
  [data-act="S1"] .s1-bub.r { border-radius:30px 30px 8px 30px; background:rgba(255,255,255,0.18); }
  [data-act="S1"] .s1-bub small { display:block; margin-top:8px; font-size:22px; color:rgba(255,255,255,0.55); text-align:right; }
  [data-act="S1"] .s1-audio { display:flex; align-items:center; gap:18px; }
  [data-act="S1"] .s1-audio i { display:inline-block; width:6px; border-radius:3px; background:rgba(255,255,255,0.75); margin-right:5px; }
  [data-act="S1"] .s1-call { display:flex; align-items:center; gap:16px; padding:18px 28px; border-radius:999px; background:rgba(255,255,255,0.12);
    box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.14); font-size:30px; font-weight:560; }
  [data-act="S1"] .s1-sheet { border-radius:18px; overflow:hidden; background:rgba(255,255,255,0.1); box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.14); }
  [data-act="S1"] .s1-sheet div { display:flex; }
  [data-act="S1"] .s1-sheet span { width:150px; padding:12px 16px; font-size:24px; border-right:1px solid rgba(255,255,255,0.12); border-bottom:1px solid rgba(255,255,255,0.12); white-space:nowrap; }
  [data-act="S1"] .s1-sheet .hd span { background:rgba(255,255,255,0.12); font-weight:650; }
  `,
  build(root, ctx) {
    const { h, split, rng } = SAIB.fx;
    const ui = SAIB.ui, sc = SAIB.scene, st = ctx.state;

    // fragmentos do jeito manual (atrás do texto, desfocados e fugazes)
    const waves = [14, 26, 38, 22, 46, 30, 18, 40, 28, 16, 34, 24, 12, 30, 20];
    const frags = [
      { x: 90, y: 300, el: h("div", { class: "s1-bub" }, [document.createTextNode("manda 3 fardos de água"), h("small", { text: "21:58" })]) },
      { x: 560, y: 430, el: h("div", { class: "s1-bub r s1-audio" }, [ui.icon("play", { size: 34, fill: "rgba(255,255,255,0.85)", stroke: 0 }), h("span", {}, waves.map((v) => h("i", { style: { height: v + "px" } }))), h("span", { text: "0:42", style: { fontSize: "26px" } })]) },
      { x: 600, y: 1090, el: h("div", { class: "s1-bub r" }, [document.createTextNode("e 2 de refri também"), h("small", { text: "22:03" })]) },
      { x: 110, y: 1180, el: h("div", { class: "s1-call" }, [ui.icon("phone-missed", { size: 36, stroke: 2.2 }), h("span", { text: "Ligação perdida" })]) },
      {
        x: 420, y: 1320,
        el: h("div", { class: "s1-sheet" }, [
          h("div", { class: "hd" }, ["Cliente", "Produto", "Qtd"].map((s) => h("span", { text: s }))),
          h("div", {}, ["Mercearia", "Água 20 L", "3"].map((s) => h("span", { text: s }))),
          h("div", {}, ["Bar", "Refri 2 L", "2?"].map((s) => h("span", { text: s }))),
        ]),
      },
    ];
    for (const f of frags) {
      f.el.classList.add("s1-frag");
      f.el.style.left = f.x + "px";
      f.el.style.top = f.y + "px";
      root.append(f.el);
    }
    st.frags = frags;

    // título em letras
    const title = h("div", { class: "s1-title" });
    const lines = ["Seu cliente", "ainda pede", "por WhatsApp?"].map((s) => h("div", { class: "s1-line", text: s }));
    title.append(...lines);
    root.append(title);
    st.title = title;
    st.lines = lines.map((l) => split(l));
    // "WhatsApp?" = última palavra
    st.hlWord = st.lines[2].words[1];
    st.hlChars = [...st.hlWord.querySelectorAll(".fx-char")];
    st.hlChars.forEach((c) => c.classList.add("holo-text"));
    st.allChars = st.lines.flatMap((l) => l.chars);
    const R = rng(1986);
    st.cj = st.allChars.map(() => ({ a: R(), b: R(), c: R(), d: R() }));

    // risco holográfico sobre "WhatsApp?"
    st.strike = ui.holoPath(null, { width: 4, glow: 1.2 });
    root.append(st.strike.el);

    // contorno do celular que se desenha antes do aparelho surgir (caixa de POSES.phoneFront)
    st.outline = h("svg", { viewBox: "0 0 1080 1920", width: 1080, height: 1920, style: { position: "absolute", left: 0, top: 0 } });
    const g = h("linearGradient", { id: "s1og", x1: 0, y1: 0, x2: 1, y2: 1 }, [
      h("stop", { offset: "0", "stop-color": "#5ee7ff" }), h("stop", { offset: "0.5", "stop-color": "#c9b6ff" }), h("stop", { offset: "1", "stop-color": "#ff7ad9" }),
    ]);
    st.outline.append(h("defs", {}, [g]));
    st.oPaths = [10, 4, 1.6].map((w, i) =>
      h("rect", { x: 302, y: 401, width: 476, height: 1002, rx: 62, fill: "none", stroke: i === 2 ? "#f4efff" : "url(#s1og)", "stroke-width": w, opacity: [0.12, 0.35, 1][i] })
    );
    st.outline.append(...st.oPaths);
    root.append(st.outline);
    st.oLen = 2 * (476 + 1002) - (8 - 2 * Math.PI) * 62;

    // celular
    st.rig = sc.rig(root, { phone: true });
    st.splash = SAIB.screens.splash();
    st.rig.phone.setScreen(st.splash);
    st.geo = null;
  },
  update(t, ctx) {
    const { tw, ease, prog, lerp, clamp, noise, set } = SAIB.fx;
    const ui = SAIB.ui, sc = SAIB.scene, st = ctx.state;
    const T = ctx.start + t;

    // geometria natural das letras (medida uma vez, com fontes já carregadas)
    if (!st.geo) {
      st.title.style.display = "block";
      st.allChars.forEach((c) => (c.style.transform = "none"));
      st.geo = st.allChars.map((c) => {
        const r = c.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      const wr = st.hlWord.getBoundingClientRect();
      st.hlBox = { l: wr.left, r: wr.right, y: wr.top + wr.height * 0.56 };
    }

    // ---- fragmentos: já presentes no quadro 0, derivam e somem antes da montagem
    st.frags.forEach((f, i) => {
      const inP = tw(t, -0.6 + i * 0.12, 0.9);
      const outP = tw(t, 2.05 + i * 0.05, 0.55, ease.inCubic);
      const dx = noise(T * 0.35 + i * 4, i) * 14, dy = -T * 10 + noise(T * 0.3 + i * 7, i + 9) * 10;
      set(f.el, { x: dx, y: dy + (1 - inP) * 40, scale: lerp(0.94, 1, inP) * lerp(1, 0.9, outP), opacity: 0.62 * inP * (1 - outP), blur: 2.6 + (1 - inP) * 6 + outP * 8 });
    });

    // ---- título: letras entram por linha (máscara de baixo para cima + desfoque), depois se desmontam
    const starts = [-0.42, 0.02, 0.38];
    const center = { x: 540, y: 900 };
    let idx = 0;
    st.lines.forEach((L, li) => {
      L.chars.forEach((c, ci) => {
        const k = idx++;
        const j = st.cj[k];
        const a = starts[li] + ci * 0.028;
        const p = tw(t, a, 0.8, ease.signature);
        let x = 0, y = (1 - p) * 120, sc2 = lerp(1.08, 1, p), rot = (1 - p) * -6, op = prog(t, a, a + 0.3), bl = (1 - p) * 12;
        // desmontagem: cada letra voa para dentro da tela do celular, encolhendo
        const d0 = 2.38 + j.a * 0.32 + (li === 2 ? 0.08 : 0);
        const q = tw(t, d0, 0.62, ease.inOutCubic);
        if (q > 0) {
          const g = st.geo[k];
          const tx = center.x + (j.b - 0.5) * 260 - g.x, ty = center.y + (j.c - 0.5) * 380 - g.y;
          // arco: sai um pouco para fora antes de convergir
          const lift = Math.sin(q * Math.PI) * (j.d - 0.5) * 160;
          x += tx * q + lift;
          y += ty * q - Math.sin(q * Math.PI) * 60;
          sc2 *= lerp(1, 0.16, q);
          rot += (j.a - 0.5) * 120 * q;
          op *= 1 - ease.inQuad(prog(q, 0.55, 1));
          bl += q * 5;
        }
        c.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${sc2.toFixed(4)})`;
        c.style.opacity = clamp(op).toFixed(4);
        c.style.filter = bl > 0.2 ? `blur(${bl.toFixed(2)}px)` : "none";
      });
    });
    st.title.style.display = t > 3.2 ? "none" : "block";
    // "WhatsApp?" ganha peso (fino → pesado)
    const wq = ease.inOutCubic(prog(t, 0.55, 1.35));
    st.hlWord.style.fontWeight = Math.round(lerp(300, 860, wq));
    // aberração cromática no instante em que a frase "quebra"
    const ca = Math.sin(Math.PI * prog(t, 2.2, 2.7)) * 3.2;
    ui.chromatic(st.title, ca);

    // ---- risco holográfico sobre "WhatsApp?" (1,6–2,0) e some com a desmontagem
    const sp = tw(t, 1.6, 0.42, ease.inOutCubic);
    if (sp > 0 && t < 2.9) {
      const b = st.hlBox;
      st.strike.setD(`M ${b.l - 14} ${b.y} L ${b.r + 14} ${b.y - 4}`).draw(sp).opacity(1 - prog(t, 2.3, 2.6));
      st.strike.el.style.display = "block";
    } else st.strike.el.style.display = "none";

    // ---- contorno do celular se desenha (2,45–3,05) e cede lugar ao aparelho
    const op2 = tw(t, 2.45, 0.6, ease.inOutCubic);
    const fadeO = 1 - prog(t, 3.0, 3.3);
    if (op2 > 0 && fadeO > 0) {
      st.outline.style.display = "block";
      st.oPaths.forEach((p) => {
        p.style.strokeDasharray = `${st.oLen} ${st.oLen + 10}`;
        p.style.strokeDashoffset = ((1 - op2) * st.oLen).toFixed(2);
      });
      st.outline.style.opacity = fadeO.toFixed(4);
      const D = ui.drift(T);
      st.outline.style.transform = `translateY(${D.y.toFixed(2)}px)`;
    } else st.outline.style.display = "none";

    // ---- celular materializa (2,75–3,2) já na pose da emenda
    const ph = tw(t, 2.72, 0.5, ease.signature);
    st.rig.show(st.rig.sP, ph);
    if (ph > 0) {
      const P = Object.assign({}, ui.POSES.phoneFront, { s: ui.POSES.phoneFront.s * lerp(0.94, 1, ph) });
      sc.place(st.rig.phone, P, T);
      st.rig.phone.glare(prog(t, 2.85, 3.3));
    }
  },
});
