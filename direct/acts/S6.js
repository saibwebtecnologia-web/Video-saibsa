/*
 * S6 · Painel em tempo real (26,2–31,4). O notebook desce e da tela sobem, em isométrico, gráficos
 * holográficos: vendas por rota (barras 3D), por cidade (blocos) e por faixa horária (área em plano vertical).
 * Dados fictícios (somam R$ 12.480, o mesmo total do portal). Depois os números "respiram" (tempo real).
 * Fronteira livre com S7 (31,4): a composição fica assentada até o fim.
 */
SAIB.act("S6", {
  css: `
  [data-act="S6"] .s6-lab { position:absolute; font-family:var(--font); color:#fff; white-space:nowrap; transform:translate(-50%,-100%); }
  [data-act="S6"] .s6-cap { position:absolute; font-family:var(--font); font-size:26px; font-weight:650; letter-spacing:0.14em; text-transform:uppercase; color:var(--p100); white-space:nowrap; }
  [data-act="S6"] .s6-val { font-size:27px; font-weight:700; letter-spacing:-0.01em; font-variant-numeric:tabular-nums; text-shadow:0 2px 12px rgba(30,8,80,0.6); }
  [data-act="S6"] .s6-name { font-size:24px; font-weight:560; color:var(--p200, #ddd6fe); }
  [data-act="S6"] .s6-live { position:absolute; display:flex; align-items:center; gap:12px; font-family:var(--font); font-size:26px; font-weight:650;
    letter-spacing:0.14em; color:#fff; padding:12px 22px; border-radius:999px; background:rgba(22,163,74,0.22); box-shadow: inset 0 0 0 1.5px rgba(134,239,172,0.55); }
  [data-act="S6"] .s6-live i { width:14px; height:14px; border-radius:50%; background:#4ade80; box-shadow:0 0 12px #4ade80; }
  [data-act="S6"] .s6-beam { position:absolute; left:140px; width:800px; top:700px; height:800px; pointer-events:none;
    background:linear-gradient(0deg, rgba(201,182,255,0.32) 0%, rgba(124,58,237,0.12) 45%, rgba(124,58,237,0) 100%);
    -webkit-mask:radial-gradient(60% 100% at 50% 100%, #000 30%, transparent 75%); mask:radial-gradient(60% 100% at 50% 100%, #000 30%, transparent 75%); }
  `,
  build(root, ctx) {
    const { h } = SAIB.fx;
    const ui = SAIB.ui, sc = SAIB.scene, S = SAIB.screens, st = ctx.state;
    st.rig = sc.rig(root, { laptop: true });
    st.approved = S.portalApproved();
    st.sales = S.portalSales();
    st.beam = h("div", { class: "s6-beam" });
    root.append(st.beam);

    // ---- SVG dos gráficos (px de quadro)
    const svg = h("svg", { viewBox: "0 0 1080 1920", width: 1080, height: 1920, style: { position: "absolute", left: 0, top: 0, overflow: "visible" } });
    const lg = (id, a, b, x2 = 0, y2 = 1) => h("linearGradient", { id, x1: 0, y1: 0, x2, y2 }, [h("stop", { offset: 0, "stop-color": a }), h("stop", { offset: 1, "stop-color": b })]);
    svg.append(h("defs", {}, [
      lg("s6top", "rgba(220,240,255,0.95)", "rgba(201,182,255,0.85)", 1, 1),
      lg("s6l", "rgba(139,92,246,0.85)", "rgba(91,33,182,0.55)"),
      lg("s6r", "rgba(94,231,255,0.55)", "rgba(76,29,149,0.45)"),
      lg("s6topP", "rgba(255,230,248,0.95)", "rgba(255,170,230,0.85)", 1, 1),
      lg("s6lP", "rgba(236,72,153,0.7)", "rgba(124,58,237,0.5)"),
      lg("s6rP", "rgba(255,122,217,0.5)", "rgba(91,33,182,0.45)"),
      lg("s6area", "rgba(94,231,255,0.55)", "rgba(124,58,237,0.04)"),
      lg("s6stroke", "#5ee7ff", "#ff7ad9", 1, 0),
    ]));
    root.append(svg);
    st.svg = svg;
    const P = (tag, a) => {
      const e = h(tag, a);
      svg.append(e);
      return e;
    };

    // projeção oblíqua (gabinete): X para a direita, Y = profundidade (sobe para a direita), Z = altura
    st.iso = (O, k, kx = k) => (X, Y, Z) => [O[0] + X * kx + Y * k * 0.55, O[1] - Y * k * 0.32 - Z * k];
    const mkBars = (O, k, data, pink, w, step, depth = 0.8) => {
      const iso = st.iso(O, k);
      const n = data.length, len = (n - 1) * step + w;
      const plate = P("polygon", { fill: "rgba(255,255,255,0.06)", stroke: "rgba(201,182,255,0.5)", "stroke-width": 1.5 });
      const pts = [iso(-0.3, -0.25, 0), iso(len + 0.3, -0.25, 0), iso(len + 0.3, depth + 0.25, 0), iso(-0.3, depth + 0.25, 0)];
      plate.setAttribute("points", pts.map((p) => p.join(",")).join(" "));
      const sfx = pink ? "P" : "";
      const bars = data.map((d, i) => {
        const g = { r: P("polygon", { fill: `url(#s6r${sfx})` }), t: P("polygon", { fill: `url(#s6top${sfx})`, stroke: "rgba(255,255,255,0.85)", "stroke-width": 1.2 }), l: P("polygon", { fill: `url(#s6l${sfx})`, stroke: "rgba(255,255,255,0.35)", "stroke-width": 1 }) };
        const lab = h("div", { class: "s6-lab", style: { textAlign: "center" } }, [h("div", { class: "s6-val", text: d[2] })]);
        const name = h("div", { class: "s6-lab s6-name", text: d[0], style: { transform: "translate(-50%, 0)" } });
        root.append(lab, name);
        return { X: i * step, v: d[1], g, lab, name };
      });
      return { iso, bars, plate, w, depth, k };
    };
    // por rota (esquerda) e por cidade (direita)
    st.A = mkBars([104, 905], 58, [["Rota 01", 0.62, "3.120"], ["Rota 02", 0.88, "4.410"], ["Rota 03", 0.47, "2.350"], ["Rota 04", 0.52, "2.600"]], false, 1.0, 1.78);
    st.B = mkBars([600, 905], 58, [["Goiânia", 0.92, "5.840"], ["Anápolis", 0.56, "3.560"], ["Aparecida", 0.49, "3.080"]], true, 1.1, 2.02);

    // por faixa horária: área em faixa 3D (frente + espessura), eixo X = horas
    st.hours = [0.16, 0.5, 0.82, 0.58, 0.38, 0.62, 0.74, 0.46, 0.28];
    st.C = { iso: st.iso([110, 1330], 58, 100), k: 58 };
    st.C.base = P("polygon", { fill: "rgba(255,255,255,0.05)", stroke: "rgba(201,182,255,0.5)", "stroke-width": 1.5 });
    st.C.top = P("polygon", { fill: "rgba(201,182,255,0.28)", stroke: "rgba(255,255,255,0.5)", "stroke-width": 1 });
    st.C.area = P("polygon", { fill: "url(#s6area)" });
    st.C.glow = P("polyline", { fill: "none", stroke: "url(#s6stroke)", "stroke-width": 16, opacity: 0.2, "stroke-linejoin": "round", "stroke-linecap": "round" });
    st.C.line = P("polyline", { fill: "none", stroke: "url(#s6stroke)", "stroke-width": 5, "stroke-linejoin": "round", "stroke-linecap": "round" });
    st.C.dot = P("circle", { r: 9, fill: "#fff" });
    st.C.ticks = ["06h", "10h", "14h", "18h", "22h"].map((s) => {
      const e = h("div", { class: "s6-lab s6-name", text: s, style: { transform: "translate(-50%, 0)" } });
      root.append(e);
      return e;
    });

    // legendas dos gráficos
    st.capA = h("div", { class: "s6-cap", text: "Por rota · R$" });
    st.capB = h("div", { class: "s6-cap", text: "Por cidade · R$" });
    st.capC = h("div", { class: "s6-cap", text: "Por faixa horária" });
    root.append(st.capA, st.capB, st.capC);

    st.live = h("div", { class: "s6-live" }, [h("i"), h("span", { text: "TEMPO REAL" })]);
    st.live.style.left = "640px";
    st.live.style.top = "262px";
    root.append(st.live);
    st.title = sc.title(root, "Vendas em\n*tempo real.*", { top: 214, size: 100 });
    st.sub = h("div", { class: "subtitle", text: "por rota · cidade · faixa horária", style: { position: "absolute", left: "82px", top: "450px", fontSize: "40px", color: "#fff", fontWeight: 560 } });
    root.append(st.sub);
  },
  update(t, ctx) {
    const { tw, ease, prog, lerp, clamp, noise, inOut, set } = SAIB.fx;
    const ui = SAIB.ui, sc = SAIB.scene, PO = ui.POSES, st = ctx.state, r = st.rig;
    const T = ctx.start + t;
    const lp = r.laptop;

    // ---- notebook desce e fica de base; a tela troca para "Vendas"
    const ld = ease.inOutCubic(prog(t, 0.05, 1.2));
    sc.place(lp, ui.lerpPose(PO.laptopHero, { x: 540, y: 1760, z: 0, rx: 64, ry: 0, rz: 0, s: 0.5 }, ld), T);
    lp.setLid(lerp(ui.LID.hero, 112, ld));
    const sw = prog(t, 0.35, 0.75);
    if (sw <= 0) lp.setScreen(st.approved);
    else if (sw >= 1) lp.setScreen(st.sales);
    else lp.setScreen([st.approved, st.sales]);
    sc.fade(st.sales, sw);
    st.sales.refs.bars.forEach((b, i) => (b.bar.style.transform = `scaleY(${tw(t, 0.7 + i * 0.08, 0.6).toFixed(4)})`));
    st.beam.style.opacity = (0.9 * Math.sin(Math.PI * prog(t, 0.6, 2.4)) + 0.25 * prog(t, 1.5, 2.4)).toFixed(3);

    // ---- câmera "gira" de leve: o conjunto de gráficos deriva
    const D = ui.drift(T, 1.2);
    const ox = D.ry * 6, oy = D.y * 1.4;
    st.svg.style.transform = `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px)`;
    const place2 = (el, x, y, op) => {
      el.style.left = (x + ox).toFixed(2) + "px";
      el.style.top = (y + oy).toFixed(2) + "px";
      el.style.opacity = clamp(op).toFixed(3);
    };

    // ---- barras isométricas (crescem em sequência; depois "respiram")
    const drawBars = (C, t0, maxH) => {
      C.plate.style.opacity = prog(t, t0 - 0.2, t0 + 0.2).toFixed(3);
      C.bars.forEach((b, i) => {
        const a = t0 + i * 0.12;
        const g = ease.signature(prog(t, a, a + 0.85));
        const live = 1 + 0.035 * noise(T * 0.9 + i * 3.3, i + 20) * prog(t, a + 1.0, a + 1.6);
        const Hh = Math.max(0.02, b.v * maxH * g * live);
        const X0 = b.X, X1 = b.X + C.w, Y0 = 0, Y1 = C.depth;
        const p = (X, Y, Z) => C.iso(X, Y, Z).map((v) => v.toFixed(1)).join(",");
        b.g.l.setAttribute("points", [p(X0, Y0, 0), p(X1, Y0, 0), p(X1, Y0, Hh), p(X0, Y0, Hh)].join(" "));
        b.g.r.setAttribute("points", [p(X1, Y0, 0), p(X1, Y1, 0), p(X1, Y1, Hh), p(X1, Y0, Hh)].join(" "));
        b.g.t.setAttribute("points", [p(X0, Y0, Hh), p(X1, Y0, Hh), p(X1, Y1, Hh), p(X0, Y1, Hh)].join(" "));
        const op = prog(t, a, a + 0.2);
        for (const k of ["l", "r", "t"]) b.g[k].style.opacity = op.toFixed(3);
        const top = C.iso(X0 + C.w / 2, Y1 / 2, Hh);
        place2(b.lab, top[0], top[1] - 18, prog(t, a + 0.45, a + 0.75));
        const bot = C.iso(X0 + C.w / 2, 0, 0);
        place2(b.name, bot[0], bot[1] + 16, prog(t, a + 0.3, a + 0.6));
      });
    };
    drawBars(st.A, 1.0, 3.0);
    drawBars(st.B, 1.35, 3.0);

    // ---- área por faixa horária (desenha da esquerda para a direita)
    const C = st.C, n = st.hours.length;
    const cp = ease.inOutCubic(prog(t, 1.7, 2.7));
    const pts = [];
    const span = 8 * 1.0;
    for (let i = 0; i < n; i++) {
      const X = (i / (n - 1)) * span;
      const live = 1 + 0.05 * noise(T * 0.8 + i * 2.1, 60 + i) * prog(t, 2.8, 3.4);
      pts.push([X, st.hours[i] * 3.3 * live]);
    }
    const shown = [];
    const head = cp * (n - 1);
    for (let i = 0; i <= Math.floor(head); i++) shown.push(pts[i]);
    if (head < n - 1 && head > 0) {
      const i = Math.floor(head), f = head - i;
      shown.push([lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]);
    }
    const DEP = 0.7;
    const toS = ([X, Z], Y = 0) => C.iso(X, Y, Z).map((v) => v.toFixed(1)).join(",");
    C.base.setAttribute("points", [toS([0, 0]), toS([span, 0]), toS([span, 0], DEP), toS([0, 0], DEP)].join(" "));
    C.base.style.opacity = prog(t, 1.5, 1.8).toFixed(3);
    if (shown.length > 1) {
      const line = shown.map((q) => toS(q)).join(" ");
      C.line.setAttribute("points", line);
      C.glow.setAttribute("points", line);
      const last = shown[shown.length - 1];
      C.area.setAttribute("points", line + " " + toS([last[0], 0]) + " " + toS([0, 0]));
      // espessura: a linha repetida em profundidade, ligada à da frente
      C.top.setAttribute("points", shown.map((q) => toS(q)).join(" ") + " " + shown.slice().reverse().map((q) => toS(q, DEP)).join(" "));
      const d = C.iso(last[0], 0, last[1]);
      C.dot.setAttribute("cx", d[0].toFixed(1));
      C.dot.setAttribute("cy", d[1].toFixed(1));
      for (const e of [C.line, C.glow, C.area, C.dot, C.top]) e.style.display = "";
    } else for (const e of [C.line, C.glow, C.area, C.dot, C.top]) e.style.display = "none";
    C.ticks.forEach((e, i) => {
      const p = C.iso((i / 4) * span, 0, 0);
      place2(e, p[0], p[1] + 14, prog(t, 1.75 + i * 0.12, 2.0 + i * 0.12));
    });

    // ---- legendas
    place2(st.capA, 92, 590, prog(t, 0.95, 1.3));
    place2(st.capB, 590, 590, prog(t, 1.3, 1.65));
    place2(st.capC, 92, 1075, prog(t, 1.65, 2.0));

    // ---- títulos
    st.title.update(t, 0.3, null);
    inOut(st.live, t, 0.8, null, { y: 24, blur: 8 });
    inOut(st.sub, t, 0.95, null, { y: 24, blur: 8 });
    const pulse = 0.55 + 0.45 * Math.cos(T * Math.PI * 2 * 0.9);
    st.live.firstChild.style.opacity = pulse.toFixed(3);
    // saída (fronteira livre com S7): o conjunto esmaece e sobe um pouco
    if (t > ctx.dur - 0.6) {
      const q = ease.inCubic(prog(t, ctx.dur - 0.45, ctx.dur + 0.2));
      ctx.root.style.opacity = (1 - q).toFixed(4);
      ctx.root.style.transform = q > 0 ? `translateY(${(-40 * q).toFixed(2)}px) scale(${(1 - 0.03 * q).toFixed(4)})` : "";
    } else ctx.root.style.transform = "";
  },
});
