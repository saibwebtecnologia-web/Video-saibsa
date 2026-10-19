/*
 * ATO E — "Vem aí" · 36,2–41,6 s (dur 5,4) · o último quadro encerra o vídeo
 *
 * Ideia central: o símbolo da saib É um olho. Ele nasce sobre um dashboard de BI "fantasma"
 * (que se monta em linhas finas atrás de um véu, varrido por um scanner que nunca revela tudo),
 * pisca ("Fique de olho.") e depois viaja até virar o símbolo do logo da assinatura final.
 *
 * Coreografia (tempos locais, s) — rodada de correção 1:
 *  -0.42  moldura do dashboard começa a se desenhar (o scan do motor revela já em movimento)
 *  -0.40  "Vem aí o novo BI / da SaibWeb." por palavra (legível ≈0,10→2,32) · "EM BREVE" vira HUD discreto
 *  -0.20…1.50  dashboard fantasma (bem velado) se constrói; só a faixa sob o feixe do scanner fica nítida
 *   0.05  tarja "NOME" entra; letras embaralham sem nunca resolver (hash do tempo)
 *   0.40  "Fique de olho." (legível ≈0,76→2,40) · 0.48 pálpebras se encontram · 0.68 íris-lente dilata
 *   1.15  a lente olha para o lado com uma linha de varredura · 1.85 piscada real (o símbolo fecha numa
 *         linha em 0,08 s, segura 2 quadros, reabre em mola com flash e pulso de escala)
 *   2.30  dashboard colapsa para o centro do selo · 2.32 título sai por linha (linha 2 primeiro)
 *   2.40  "Fique de olho." sai · o olho viaja (0,66 s) até virar o símbolo do logo
 *   2.60  selo 40 anos nasce de onde o dashboard colapsou · 2.68 CTA (legível ≈3,0→5,4)
 *   2.86  "saib" revela-se a partir do símbolo · 2.94 pílula · 3.08 linha de apoio ("Com o SAIB Vendas,
 *         a base dessa conta já está no sistema.", 2 linhas, 35 px)
 *   3.45  brilho no logo · 3.50 pulso da pílula (período 1 s) · 3.62 feixe no selo
 *   4.24–5.40  hold estável: régua do selo girando a 0,6 rpm, 4.70 última passada de luz no olho
 */
(function () {
  const ASSET = "../assets/brand/";
  const OWN = "acts/E/";
  // logo em unidades naturais do PNG (1824 × 664)
  const LOGO = { w: 1824, h: 664, s: 700 / 1824, x: 190, y: 380 };
  const EYE = { cx: 300, cy: 220 }; // centro da íris no recorte do símbolo (625 × 440, topo em y=100 do logo)
  const EYE_E1 = { x: 540, y: 1020, k: 1.5 }; // posição/escala do olho em E1 (tela)
  const CARD = { x: 120, y: 770, w: 840, h: 500 };
  const SELO = { w: 336, x: 540 - 168, y: 690 }; // 336 (era 360): abre espaço para a linha de apoio em 2 linhas
  const SELO_K = SELO.w / 360; // escala dos anéis decorativos desenhados para o selo de 360

  // Orçamento de leitura (regra 1,2 s + 0,05 s/caractere): título legível ≈0,10→2,40 · "Fique de olho."
  // ≈0,76→2,46 · CTA ≈2,95→5,40 (o ato tem só 5,4 s; as frases se sobrepõem em vez de se suceder).
  const T = {
    dash: -0.42,
    eyebrow: -0.36,
    title: -0.4,
    tag: 0.05,
    scan0: 0.0,
    fique: 0.4,
    eye: 0.48,
    iris: 0.68,
    look: 1.15,
    blink: 1.85,
    out1: 2.32, // linha 2 do título (linha 1 sai +0,05)
    dashOut: 2.3,
    fiqueOut: 2.4,
    travel: 2.4,
    travelDur: 0.66,
    cta: 2.68,
    selo: 2.6,
    word: 2.86,
    tagline: 2.98,
    pill: 2.94,
    support: 3.08,
    glint: 3.45,
    sheen: 3.62,
    ring: 3.5, // primeiro pulso da pílula (período 1,0 s → no último quadro q ≈ 0,9)
    eyeShine: 4.7,
  };

  const css = `
  [data-act="E"] .abs { position:absolute; left:0; top:0; }
  [data-act="E"] .center-x { left:0; width:1080px; text-align:center; }
  [data-act="E"] .w { display:inline-block; white-space:nowrap; }
  [data-act="E"] .eyebrow-row { display:flex; align-items:center; justify-content:center; gap:22px; }
  [data-act="E"] .eyebrow-row .ln { width:56px; height:2px; background:linear-gradient(90deg, rgba(220,194,255,0), rgba(220,194,255,.7)); }
  [data-act="E"] .eyebrow-row .ln.r { background:linear-gradient(90deg, rgba(220,194,255,.7), rgba(220,194,255,0)); }
  [data-act="E"] .eyebrow-row .dot { width:12px; height:12px; border-radius:50%; background:var(--neon); box-shadow:0 0 14px 3px rgba(180,108,255,.85); }
  [data-act="E"] .eb { font-family:var(--font-mono); font-weight:600; font-size:22px; letter-spacing:.34em; color:var(--lilac); padding-left:.34em; }
  [data-act="E"] .title { font-family:var(--font-display); font-weight:800; font-size:100px; line-height:1.04; letter-spacing:-0.012em; }
  [data-act="E"] .title .w { padding:0 0.02em; }
  [data-act="E"] .glow-neon { filter: drop-shadow(0 0 22px rgba(180,108,255,.55)); }
  [data-act="E"] .tagbox { display:inline-flex; align-items:center; gap:16px; height:72px; padding:0 14px 0 24px; border-radius:20px;
      background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.14);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 18px 40px rgba(0,0,0,.35); }
  [data-act="E"] .tag-label { font-family:var(--font-mono); font-weight:600; font-size:30px; letter-spacing:.24em; color:var(--lilac); }
  [data-act="E"] .tarja { position:relative; height:48px; padding:0 18px; border-radius:10px; display:flex; align-items:center; gap:6px; overflow:hidden;
      background: repeating-linear-gradient(135deg, rgba(180,108,255,.14) 0 6px, rgba(180,108,255,0) 6px 14px), #0c0316;
      border:1px solid rgba(180,108,255,.45); box-shadow: 0 0 22px rgba(139,43,217,.35); }
  [data-act="E"] .slot { width:26px; height:34px; display:flex; align-items:center; justify-content:center;
      font-family:var(--font-mono); font-weight:600; font-size:30px; color:#e9dbff; }
  [data-act="E"] .slot i { display:block; width:22px; height:26px; border-radius:3px; background:linear-gradient(180deg,#c99bff,#7a2fd0); }
  [data-act="E"] .tarja .sweep { position:absolute; top:0; bottom:0; width:90px; left:0;
      background:linear-gradient(90deg, rgba(220,194,255,0), rgba(220,194,255,.28), rgba(220,194,255,0)); }
  [data-act="E"] .card-bg { border-radius:28px; background:linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.015)); }
  [data-act="E"] .veil { border-radius:28px;
      background: repeating-linear-gradient(0deg, rgba(220,194,255,.035) 0 2px, rgba(0,0,0,0) 2px 7px),
                  radial-gradient(70% 70% at 50% 50%, rgba(10,3,18,.25), rgba(10,3,18,.6)); }
  [data-act="E"] .corner { position:absolute; width:46px; height:46px; border-color:rgba(220,194,255,.75); border-style:solid; border-width:0; }
  [data-act="E"] .hud { font-family:var(--font-mono); font-weight:600; font-size:22px; letter-spacing:.22em; color:var(--lilac); white-space:nowrap;
      padding:4px 10px 4px 12px; border-radius:6px; background:rgba(12,3,22,.78); border:1px solid rgba(180,108,255,.35); }
  [data-act="E"] .scanline { height:3px; border-radius:3px;
      background:linear-gradient(90deg, rgba(220,194,255,0), #fff 18%, #fff 82%, rgba(220,194,255,0));
      box-shadow: 0 0 16px 3px rgba(180,108,255,.9), 0 0 50px 10px rgba(139,43,217,.45); }
  [data-act="E"] .fique { font-family:var(--font-display); font-weight:800; font-size:92px; line-height:1.0; letter-spacing:-0.01em; }
  [data-act="E"] .piece { position:absolute; display:block; }
  [data-act="E"] .cta1 { font-family:var(--font-display); font-weight:700; font-size:64px; line-height:1.08; letter-spacing:-0.005em; }
  [data-act="E"] .cta2 { font-family:var(--font-display); font-weight:900; font-style:italic; font-size:112px; line-height:1.0; letter-spacing:-0.01em; }
  [data-act="E"] .cta2 .w { padding:0 0.06em 0.04em; }
  /* "gratuita": base do gradiente neon mais clara (a cor original some no fundo roxo no celular) */
  [data-act="E"] .cta2 .grad-neon { background-image:linear-gradient(180deg, #fbf6ff 0%, #dcb9ff 50%, #b77cff 100%); }
  [data-act="E"] .cta2.glow-neon { filter: drop-shadow(0 4px 10px rgba(16,0,34,.45)) drop-shadow(0 0 22px rgba(180,108,255,.5)); }
  [data-act="E"] .pill { position:relative; display:inline-flex; align-items:center; gap:16px; height:88px; padding:0 48px 0 40px; border-radius:999px;
      background:linear-gradient(100deg, #7a1fc9 0%, #9d4cf0 55%, #c08cff 100%);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.45), inset 0 -2px 0 rgba(0,0,0,.18), 0 14px 40px rgba(139,43,217,.55), 0 0 60px rgba(180,108,255,.35);
      font-family:var(--font-text); font-weight:700; font-size:40px; color:#fff; letter-spacing:.005em; overflow:hidden; }
  [data-act="E"] .pill > span:not(.shine), [data-act="E"] .pill > svg { position:relative; }
  [data-act="E"] .pill .shine { position:absolute; top:0; bottom:0; width:120px; left:0;
      background:linear-gradient(100deg, rgba(255,255,255,0), rgba(255,255,255,.55), rgba(255,255,255,0)); }
  [data-act="E"] .ring { position:absolute; border-radius:999px; border:2px solid rgba(220,194,255,.9); }
  [data-act="E"] .support { display:inline-block; font-family:var(--font-text); font-weight:500; font-size:35px; line-height:1.24; letter-spacing:.005em; color:var(--silver-1); text-align:center; }
  [data-act="E"] .support > div { white-space:nowrap; }
  [data-act="E"] .support b { font-weight:700; color:#fff; }
  [data-act="E"] .support .hl { font-weight:700; color:var(--lilac); text-shadow:0 0 14px rgba(180,108,255,.55); }
  [data-act="E"] .hair { height:2px; width:52px; flex:none; }
  `;

  // ---------- helpers ----------
  const { h, set, prog, lerp, clamp, ease, tw, spring, hash, noise } = SAIB.fx;
  const px = (v) => v.toFixed(2) + "px";
  // troca translate3d por translate 2D: evita promover o símbolo a camada 3D com escala de raster
  // "grudada" (o mesmo t dava bordas levemente diferentes conforme a ordem de render)
  const flat = (el) => {
    const tr = el.style.transform;
    if (tr) el.style.transform = tr.replace(/translate3d\(([^,]+), ([^,]+), [^)]+\)/, "translate($1, $2)");
  };

  function words(text, cls = {}) {
    // cria spans por palavra (sem dividir por letra, para manter o gradiente de texto por palavra)
    const ws = [];
    const frag = [];
    text.split(" ").forEach((tok, i, arr) => {
      const w = h("span", { class: "w " + (cls[tok] || cls._ || "") , text: tok });
      ws.push(w);
      frag.push(w);
      if (i < arr.length - 1) frag.push(document.createTextNode(" "));
    });
    return { ws, frag };
  }

  // retângulo arredondado como path (para desenhar o contorno)
  const rr = (x, y, w, hh, r) =>
    `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + hh - r} A${r},${r} 0 0 1 ${x + w - r},${y + hh} H${x + r} A${r},${r} 0 0 1 ${x},${y + hh - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;

  // ---------- dashboard fantasma (definição única, renderizada em 2 cópias: véu e nítida) ----------
  function dashParts() {
    const P = [];
    const W = CARD.w, H = CARD.h;
    const add = (o) => P.push(o);
    // moldura + topo
    add({ k: "path", d: rr(2, 2, W - 4, H - 4, 26), at: T.dash, dur: 0.95, w: 2.2 });
    add({ k: "path", d: `M28,64 H${W - 28}`, at: -0.24, dur: 0.7, faint: true });
    [0, 1, 2].forEach((i) => add({ k: "dot", cx: 40 + i * 22, cy: 34, r: 6, at: -0.22 + i * 0.05 }));
    add({ k: "bar", x: 120, y: 28, w: 190, hh: 12, at: -0.1, dur: 0.55 });
    add({ k: "bar", x: W - 200, y: 26, w: 70, hh: 16, at: 0.0, dur: 0.45, r: 8 });
    add({ k: "bar", x: W - 118, y: 26, w: 90, hh: 16, at: 0.06, dur: 0.45, r: 8, hot: true });
    // KPIs
    const kw = (W - 56 - 32) / 3;
    const KV = [
      { v: 2.4, f: (n) => "R$ " + SAIB.fx.fmt(n, 1) + "M" },
      { v: 1284, f: (n) => SAIB.fx.fmt(Math.round(n)) },
      { v: 70, f: (n) => Math.round(n) + "%" }, // eco do 70% do ato B
    ];
    for (let i = 0; i < 3; i++) {
      const x = 28 + i * (kw + 16), y = 82;
      const at = -0.16 + i * 0.1;
      add({ k: "path", d: rr(x, y, kw, 108, 16), at, dur: 0.7 });
      add({ k: "bar", x: x + 18, y: y + 18, w: 96, hh: 9, at: at + 0.25, dur: 0.45 });
      add({ k: "num", x: x + 18, y: y + 74, at: at + 0.25, dur: 1.1, val: KV[i] });
      const sp = [];
      for (let j = 0; j < 7; j++) sp.push([x + kw - 92 + j * 13, y + 82 - (8 + 26 * (0.5 + 0.5 * Math.sin(j * 1.3 + i * 2)) * (j / 6 + 0.3))]);
      add({ k: "path", d: "M" + sp.map((p) => p.join(",")).join(" L"), at: at + 0.45, dur: 0.8, hot: true });
    }
    // gráfico de linha
    const L = { x: 28, y: 206, w: 516, h: 156 };
    add({ k: "path", d: rr(L.x, L.y, L.w, L.h, 16), at: 0.12, dur: 0.7 });
    [0, 1, 2].forEach((j) => add({ k: "path", d: `M${L.x + 18},${L.y + 40 + j * 36} H${L.x + L.w - 18}`, at: 0.24 + j * 0.06, dur: 0.6, faint: true }));
    const pts = [];
    for (let j = 0; j <= 10; j++) {
      const xx = L.x + 22 + j * ((L.w - 44) / 10);
      const yy = L.y + L.h - 26 - (j / 10) * 78 - 18 * Math.sin(j * 1.1) - 8 * Math.cos(j * 2.3);
      pts.push([xx, yy]);
    }
    const lineD = "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" L");
    add({ k: "area", d: lineD + ` L${pts[10][0]},${L.y + L.h - 14} L${pts[0][0]},${L.y + L.h - 14} Z`, at: 0.6, dur: 0.8 });
    add({ k: "path", d: lineD, at: 0.38, dur: 1.0, hot: true, w: 3 });
    add({ k: "dot", cx: pts[10][0], cy: pts[10][1], r: 7, at: 1.3, hot: true });
    // donut
    const D = { x: 560, y: 206, w: 252, h: 156 };
    add({ k: "path", d: rr(D.x, D.y, D.w, D.h, 16), at: 0.18, dur: 0.7 });
    const dc = { x: D.x + 78, y: D.y + 78, r: 46 };
    add({ k: "ring", ...dc, a0: 0, a1: 1, at: 0.24, dur: 0.6, faint: true, w: 12 });
    [[0, 0.46, 0.45], [0.49, 0.74, 0.72], [0.77, 0.97, 0.92]].forEach(([a0, a1, at], j) =>
      add({ k: "ring", ...dc, a0, a1, at, dur: 0.5, hot: j === 0, w: 12 })
    );
    [0, 1, 2].forEach((j) => add({ k: "bar", x: D.x + 152, y: D.y + 46 + j * 28, w: 70 - j * 14, hh: 9, at: 0.6 + j * 0.08, dur: 0.4 }));
    // barras
    const B = { x: 28, y: 378, w: 516, h: 100 };
    add({ k: "path", d: rr(B.x, B.y, B.w, B.h, 16), at: 0.28, dur: 0.7 });
    for (let j = 0; j < 14; j++) {
      const bh = 18 + 54 * (0.5 + 0.5 * Math.sin(j * 0.9 + 0.6)) * (0.55 + j / 30);
      add({ k: "vbar", x: B.x + 24 + j * 34.5, base: B.y + B.h - 16, w: 18, hh: Math.min(68, bh), at: 0.42 + j * 0.04, dur: 0.55, hot: j % 4 === 1 });
    }
    // mapa de rotas
    const M = { x: 560, y: 378, w: 252, h: 100 };
    add({ k: "path", d: rr(M.x, M.y, M.w, M.h, 16), at: 0.32, dur: 0.7 });
    const routes = [
      [[18, 74], [62, 52], [104, 62], [150, 30], [226, 24]],
      [[22, 30], [72, 34], [118, 22], [170, 58], [230, 70]],
      [[40, 86], [96, 82], [138, 70], [192, 84]],
    ];
    routes.forEach((r, j) => {
      const d = "M" + r.map(([a, b]) => `${M.x + a},${M.y + b}`).join(" L");
      add({ k: "path", d, at: 0.55 + j * 0.14, dur: 0.8, hot: j === 0, faint: j === 2 });
      const e = r[r.length - 1];
      add({ k: "dot", cx: M.x + e[0], cy: M.y + e[1], r: 5, at: 1.25 + j * 0.1, hot: j === 0 });
    });
    return P;
  }

  function buildDash(parts, crisp) {
    const W = CARD.w, H = CARD.h;
    const svg = h("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: { position: "absolute", left: 0, top: 0, overflow: "visible" } });
    const S = crisp
      ? { line: "#efe4ff", faint: "rgba(239,228,255,.55)", hot: "#d6b3ff", fill: "rgba(200,150,255,.85)", hotFill: "#e2c8ff", area: "rgba(180,108,255,.32)", text: "#ffffff" }
      : { line: "rgba(220,194,255,.30)", faint: "rgba(220,194,255,.10)", hot: "rgba(190,140,255,.40)", fill: "rgba(220,194,255,.15)", hotFill: "rgba(180,108,255,.32)", area: "rgba(180,108,255,.07)", text: "rgba(232,218,255,.24)" };
    const hs = [];
    for (const p of parts) {
      let el, fn;
      const stroke = p.hot ? S.hot : p.faint ? S.faint : S.line;
      const sw = (p.w || 2) * (crisp ? 1.15 : 1);
      if (p.k === "path") {
        // versão nítida: brilho falso (traço largo translúcido por baixo) no lugar de filter: drop-shadow (desempenho)
        const gl = crisp ? h("path", { d: p.d, fill: "none", stroke: "rgba(180,108,255,.32)", "stroke-width": sw * 5, "stroke-linecap": "round", "stroke-linejoin": "round" }) : null;
        el = h("path", { d: p.d, fill: "none", stroke, "stroke-width": sw, "stroke-linecap": "round", "stroke-linejoin": "round" });
        if (gl) svg.append(gl);
        svg.append(el);
        const draw = SAIB.fx.drawable(el);
        const drawG = gl ? SAIB.fx.drawable(gl) : null;
        fn = (t) => {
          const q = tw(t, p.at, p.dur, ease.inOutCubic);
          draw(q);
          el.style.opacity = q > 0 ? "1" : "0";
          if (drawG) {
            drawG(q);
            gl.style.opacity = el.style.opacity;
          }
        };
      } else if (p.k === "area") {
        el = h("path", { d: p.d, fill: S.area, stroke: "none" });
        svg.append(el);
        fn = (t) => (el.style.opacity = tw(t, p.at, p.dur).toFixed(3));
      } else if (p.k === "dot") {
        el = h("circle", { cx: p.cx, cy: p.cy, r: p.r, fill: p.hot ? S.hotFill : S.fill });
        el.style.transformBox = "fill-box";
        el.style.transformOrigin = "50% 50%";
        svg.append(el);
        fn = (t) => {
          const q = spring(t - p.at, { freq: 2.4, damping: 0.5 });
          el.style.transform = `scale(${Math.max(0, q).toFixed(3)})`;
        };
      } else if (p.k === "bar") {
        el = h("rect", { x: p.x, y: p.y, width: p.w, height: p.hh, rx: p.r ?? p.hh / 2, fill: p.hot ? S.hotFill : S.fill });
        el.style.transformBox = "fill-box";
        el.style.transformOrigin = "0% 50%";
        svg.append(el);
        fn = (t) => {
          const q = tw(t, p.at, p.dur);
          el.style.transform = `scaleX(${q.toFixed(4)})`;
          el.style.opacity = clamp(q * 3).toFixed(3);
        };
      } else if (p.k === "vbar") {
        el = h("rect", { x: p.x, y: p.base - p.hh, width: p.w, height: p.hh, rx: 4, fill: p.hot ? S.hotFill : S.fill });
        el.style.transformBox = "fill-box";
        el.style.transformOrigin = "50% 100%";
        svg.append(el);
        fn = (t) => {
          const q = Math.max(0, spring(t - p.at, { freq: 1.9, damping: 0.62 }));
          el.style.transform = `scaleY(${q.toFixed(4)})`;
        };
      } else if (p.k === "ring") {
        const C = 2 * Math.PI * p.r;
        el = h("circle", { cx: p.x, cy: p.y, r: p.r, fill: "none", stroke, "stroke-width": p.w, transform: `rotate(-90 ${p.x} ${p.y})` });
        svg.append(el);
        const L0 = (p.a1 - p.a0) * C;
        fn = (t) => {
          const q = tw(t, p.at, p.dur, ease.inOutCubic);
          el.setAttribute("stroke-dasharray", `${(L0 * q).toFixed(2)} ${C.toFixed(2)}`);
          el.setAttribute("stroke-dashoffset", (-p.a0 * C).toFixed(2));
        };
      } else if (p.k === "num") {
        el = h("text", { x: p.x, y: p.y, fill: S.text, "font-family": "Exo 2", "font-weight": 800, "font-size": 42 });
        svg.append(el);
        fn = (t) => {
          const q = tw(t, p.at, p.dur, ease.outQuart);
          el.textContent = p.val.f(p.val.v * q);
          el.style.opacity = clamp(prog(t, p.at, p.at + 0.25)).toFixed(3);
        };
      }
      hs.push(fn);
    }
    return { svg, update: (t) => hs.forEach((f) => f(t)) };
  }

  // ícones
  const lockIcon = () =>
    h("svg", { width: 26, height: 30, viewBox: "0 0 26 30" }, [
      h("rect", { x: 2, y: 13, width: 22, height: 15, rx: 4, fill: "none", stroke: "#dcc2ff", "stroke-width": 2.4 }),
      h("path", { d: "M7,13 V9 a6,6 0 0 1 12,0 V13", fill: "none", stroke: "#dcc2ff", "stroke-width": 2.4 }),
      h("circle", { cx: 13, cy: 20.5, r: 2.4, fill: "#b46cff" }),
    ]);
  const linkIcon = () =>
    h("svg", { width: 40, height: 40, viewBox: "0 0 24 24", fill: "none", stroke: "#fff", "stroke-width": 2.3, "stroke-linecap": "round", "stroke-linejoin": "round" }, [
      h("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }),
      h("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }),
    ]);

  const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&?";

  SAIB.act("E", {
    css,
    build(root, ctx) {
      const S = ctx.state;
      const div = (style, cls = "", kids = []) => h("div", { class: cls, style }, kids);

      // ---------- glows locais ----------
      S.glow1 = div({ position: "absolute", left: "40px", top: "520px", width: "1000px", height: "1000px", borderRadius: "50%",
        background: "radial-gradient(closest-side, rgba(139,43,217,.34), rgba(139,43,217,.10) 55%, rgba(139,43,217,0))" });
      S.glow2 = div({ position: "absolute", left: "90px", top: "380px", width: "900px", height: "900px", borderRadius: "50%",
        background: "radial-gradient(closest-side, rgba(150,60,230,.42), rgba(120,30,200,.12) 55%, rgba(120,30,200,0))" });
      root.append(S.glow1, S.glow2);

      // ---------- E1: eyebrow ----------
      // eyebrow rebaixado a HUD decorativo (22 px, opacidade baixa): o olho lê o título primeiro
      const ebText = h("span", { class: "eb", text: "EM BREVE" });
      S.ebL = h("span", { class: "ln" });
      S.ebR = h("span", { class: "ln r" });
      S.ebDot = h("span", { class: "dot" });
      S.eyebrow = div({ position: "absolute", top: "380px" }, "center-x eyebrow-row", [S.ebL, S.ebDot, ebText, S.ebR]);
      root.append(S.eyebrow);

      // ---------- título ----------
      const l1 = words("Vem aí o novo BI", { _: "grad-silver", BI: "grad-neon" });
      const l2 = words("da SaibWeb.", { _: "grad-silver" });
      S.titleWords = [...l1.ws, ...l2.ws];
      S.titleL1 = l1.ws;
      S.titleL2 = l2.ws;
      S.biWord = l1.ws[4];
      S.title = div({ position: "absolute", top: "428px" }, "center-x title", [
        h("div", {}, l1.frag),
        h("div", {}, l2.frag),
      ]);
      root.append(S.title);

      // ---------- tarja com o nome censurado ----------
      S.slots = [];
      const tarja = h("div", { class: "tarja" });
      for (let i = 0; i < 9; i++) {
        const sl = h("span", { class: "slot" });
        tarja.append(sl);
        S.slots.push({ el: sl, mode: -1, ch: "" });
      }
      S.sweep = h("span", { class: "sweep" });
      tarja.append(S.sweep);
      S.tarja = tarja;
      S.tagLabel = h("span", { class: "tag-label", text: "NOME" });
      S.tagbox = h("div", { class: "tagbox" }, [lockIcon(), S.tagLabel, tarja]);
      S.tag = div({ position: "absolute", top: "662px" }, "center-x", [S.tagbox]);
      root.append(S.tag);

      // ---------- dashboard ----------
      S.dash = div({ position: "absolute", left: CARD.x + "px", top: CARD.y + "px", width: CARD.w + "px", height: CARD.h + "px" });
      S.cardBg = div({ position: "absolute", inset: 0 }, "card-bg");
      const parts = dashParts();
      S.ghost = buildDash(parts, false);
      S.crisp = buildDash(parts, true);
      S.ghostWrap = div({ position: "absolute", inset: 0 }, "", [S.ghost.svg]);
      S.veil = div({ position: "absolute", inset: 0 }, "veil");
      S.crispWrap = div({ position: "absolute", inset: 0 }, "", [S.crisp.svg]);
      S.scan = div({ position: "absolute", left: "-30px", width: CARD.w + 60 + "px", top: 0 }, "scanline");
      S.scanTrail = div({ position: "absolute", left: "0px", width: CARD.w + "px", top: 0, height: "120px", borderRadius: "6px" });
      S.hud = div({ position: "absolute", right: "24px", top: 0 }, "hud");
      S.corners = [];
      const co = 16, cw = 3;
      [
        { left: -co + "px", top: -co + "px", borderLeftWidth: cw + "px", borderTopWidth: cw + "px", borderTopLeftRadius: "14px" },
        { right: -co + "px", top: -co + "px", borderRightWidth: cw + "px", borderTopWidth: cw + "px", borderTopRightRadius: "14px" },
        { left: -co + "px", bottom: -co + "px", borderLeftWidth: cw + "px", borderBottomWidth: cw + "px", borderBottomLeftRadius: "14px" },
        { right: -co + "px", bottom: -co + "px", borderRightWidth: cw + "px", borderBottomWidth: cw + "px", borderBottomRightRadius: "14px" },
      ].forEach((st, i) => {
        const c = h("div", { class: "corner", style: st });
        S.corners.push(c);
      });
      S.dash.append(S.cardBg, S.ghostWrap, S.veil, S.scanTrail, S.crispWrap, S.scan, S.hud, ...S.corners);
      root.append(S.dash);

      // halo escuro + neon atrás do olho (separa o olho do dashboard)
      S.halo = div({ position: "absolute", left: EYE_E1.x - 300 + "px", top: EYE_E1.y - 235 + "px", width: "600px", height: "470px", borderRadius: "50%",
        background: "radial-gradient(closest-side, rgba(9,2,16,.70) 0%, rgba(9,2,16,.52) 60%, rgba(9,2,16,0) 100%)" });
      S.haloGlow = div({ position: "absolute", left: EYE_E1.x - 260 + "px", top: EYE_E1.y - 220 + "px", width: "520px", height: "440px", borderRadius: "50%",
        background: "radial-gradient(closest-side, rgba(180,108,255,.42), rgba(139,43,217,.14) 60%, rgba(139,43,217,0))" });
      root.append(S.halo, S.haloGlow);

      // ---------- "Fique de olho." ----------
      const fq = words("Fique de olho.", { _: "grad-silver", "olho.": "grad-neon" });
      S.fiqueWords = fq.ws;
      S.olho = fq.ws[2];
      S.fique = div({ position: "absolute", top: "1312px" }, "center-x fique", fq.frag);
      root.append(S.fique);

      // ---------- E2: fundo (partículas) ----------
      const R = SAIB.fx.rng(4040);
      S.motes = [];
      for (let i = 0; i < 18; i++) {
        const a = R() * Math.PI * 2, rad = 250 + R() * 260;
        const m = div({ position: "absolute", left: 0, top: 0, width: "6px", height: "6px", borderRadius: "50%",
          background: i % 3 ? "#dcc2ff" : "#b46cff", boxShadow: "0 0 10px 2px rgba(180,108,255,.8)" });
        S.motes.push({ el: m, x: 540 + Math.cos(a) * rad * 0.95, y: 900 + Math.sin(a) * rad * 0.9, s: 0.5 + R() * 0.9, ph: R() * 10, d: R() * 0.6 });
        root.append(m);
      }

      // ---------- selo 40 anos ----------
      const seloH = (SELO.w * 1146) / 1218;
      S.seloH = seloH;
      S.seloGlow = div({ position: "absolute", left: 540 - 300 + "px", top: SELO.y + seloH / 2 - 300 + "px", width: "600px", height: "600px", borderRadius: "50%",
        background: "radial-gradient(closest-side, rgba(180,108,255,.5), rgba(139,43,217,.18) 55%, rgba(139,43,217,0))" });
      S.seloImg = h("img", { src: ASSET + "selo-40-anos.png", style: { position: "absolute", left: 0, top: 0, width: SELO.w + "px", height: seloH + "px" } });
      const maskSelo = `url(${ASSET}selo-40-anos.png)`;
      S.seloSheen = div({ position: "absolute", left: 0, top: 0, width: SELO.w + "px", height: seloH + "px",
        maskImage: maskSelo, WebkitMaskImage: maskSelo, maskSize: "100% 100%", WebkitMaskSize: "100% 100%",
        background: "linear-gradient(115deg, rgba(255,255,255,0) 38%, rgba(255,255,255,.08) 44%, rgba(255,255,255,.62) 50%, rgba(255,255,255,.08) 56%, rgba(255,255,255,0) 62%)",
        backgroundSize: "300% 100%", backgroundRepeat: "no-repeat", mixBlendMode: "screen" });
      S.ringFx = div({ position: "absolute", left: SELO.w / 2 - 180 + "px", top: seloH / 2 - 180 + "px", width: "360px", height: "360px", borderRadius: "50%",
        border: "2px solid rgba(220,194,255,.8)", boxShadow: "0 0 24px rgba(180,108,255,.8), inset 0 0 24px rgba(180,108,255,.5)" });
      // anel de régua finíssimo em volta do selo (gira devagar no hold final)
      let sticks = "";
      for (let i = 0; i < 72; i++) {
        const an = (i * 5 * Math.PI) / 180, r0 = i % 6 ? 206 : 198;
        sticks += `M${(Math.cos(an) * r0).toFixed(2)},${(Math.sin(an) * r0).toFixed(2)} L${(Math.cos(an) * 212).toFixed(2)},${(Math.sin(an) * 212).toFixed(2)} `;
      }
      S.seloHair = h("svg", { width: 440, height: 440, viewBox: "-220 -220 440 440",
        style: { position: "absolute", left: SELO.w / 2 - 220 + "px", top: seloH / 2 - 220 + "px", overflow: "visible", transformOrigin: "50% 50%" } }, [
        h("circle", { r: 216, fill: "none", stroke: "rgba(220,194,255,1)", "stroke-width": 1, "stroke-dasharray": "2 7" }),
        h("path", { d: sticks, stroke: "rgba(220,194,255,1)", "stroke-width": 1 }),
      ]);
      S.selo = div({ position: "absolute", left: SELO.x + "px", top: SELO.y + "px", width: SELO.w + "px", height: seloH + "px" }, "", [S.seloHair, S.ringFx, S.seloImg, S.seloSheen]);
      root.append(S.seloGlow, S.selo);

      // ---------- logo (unidades naturais do PNG, escalado) ----------
      S.logo = div({ position: "absolute", left: 0, top: 0, width: LOGO.w + "px", height: LOGO.h + "px", transformOrigin: "0 0" });
      S.wordWrap = div({ position: "absolute", left: "625px", top: "0px", width: "1199px", height: "510px" });
      S.word = h("img", { class: "piece", src: OWN + "word.png", style: { left: 0, top: 0, width: "1199px", height: "510px" } });
      const maskWord = `url(${OWN}word.png)`;
      S.wordGlint = div({ position: "absolute", left: 0, top: 0, width: "1199px", height: "510px",
        maskImage: maskWord, WebkitMaskImage: maskWord, maskSize: "100% 100%", WebkitMaskSize: "100% 100%",
        background: "linear-gradient(105deg, rgba(255,255,255,0) 40%, rgba(255,255,255,.7) 50%, rgba(255,255,255,0) 60%)",
        backgroundSize: "300% 100%", backgroundRepeat: "no-repeat" });
      S.wordWrap.append(S.word, S.wordGlint);
      S.tagWrap = div({ position: "absolute", left: "625px", top: "510px", width: "1199px", height: "154px" });
      S.tagline = h("img", { class: "piece", src: OWN + "tag.png", style: { left: 0, top: 0, width: "1199px", height: "154px" } });
      S.tagWrap.append(S.tagline);
      // olho = símbolo (2 pálpebras) + íris
      S.eye = div({ position: "absolute", left: "0px", top: "100px", width: "625px", height: "440px", transformOrigin: `${EYE.cx}px ${EYE.cy}px` });
      S.lidTop = h("img", { class: "piece", src: OWN + "lid-top.png", style: { left: 0, top: 0, width: "625px", height: "440px", transformOrigin: `${EYE.cx}px ${EYE.cy}px` } });
      S.lidBot = h("img", { class: "piece", src: OWN + "lid-bot.png", style: { left: 0, top: 0, width: "625px", height: "440px", transformOrigin: `${EYE.cx}px ${EYE.cy}px` } });
      // íris = lente de scanner (SVG 260×260 centrado no furo do símbolo): anéis concêntricos, régua
      // girando ao contrário, pupila vazada com ponto neon e uma linha de varredura recortada no disco
      const IR = 130;
      S.irisWrap = div({ position: "absolute", left: EYE.cx - IR + "px", top: EYE.cy - IR + "px", width: IR * 2 + "px", height: IR * 2 + "px", transformOrigin: "50% 50%" });
      let ticks = "";
      for (let i = 0; i < 24; i++) {
        const an = (i * 15 * Math.PI) / 180, r0 = i % 2 ? 104 : 100, r1 = 113;
        ticks += `M${(Math.cos(an) * r0).toFixed(2)},${(Math.sin(an) * r0).toFixed(2)} L${(Math.cos(an) * r1).toFixed(2)},${(Math.sin(an) * r1).toFixed(2)} `;
      }
      const ir = h("svg", { width: IR * 2, height: IR * 2, viewBox: "-130 -130 260 260", style: { overflow: "visible" } }, [
        h("defs", {}, [
          h("radialGradient", { id: "eIris", cx: "0.5", cy: "0.5", r: "0.5" }, [
            h("stop", { offset: "0", "stop-color": "#b46cff", "stop-opacity": "0.9" }),
            h("stop", { offset: "0.55", "stop-color": "#7a22c4", "stop-opacity": "0.85" }),
            h("stop", { offset: "1", "stop-color": "#4a0a70", "stop-opacity": "0.85" }),
          ]),
          h("radialGradient", { id: "eGlow", cx: "0.5", cy: "0.5", r: "0.5" }, [
            h("stop", { offset: "0", "stop-color": "rgba(180,108,255,.6)" }),
            h("stop", { offset: "1", "stop-color": "rgba(180,108,255,0)" }),
          ]),
          h("clipPath", { id: "eIrisClip" }, [h("circle", { r: 69 })]),
        ]),
        (S.irisGlow = h("circle", { r: 128, fill: "url(#eGlow)" })),
        (S.irisTicks = h("g", {}, [
          h("circle", { r: 108, fill: "none", stroke: "rgba(220,194,255,.3)", "stroke-width": 1.5 }),
          h("path", { d: ticks, stroke: "rgba(220,194,255,.42)", "stroke-width": 2, "stroke-linecap": "round" }),
        ])),
        (S.irisRing = h("circle", { r: 90, fill: "none", stroke: "rgba(220,194,255,.72)", "stroke-width": 2.5, "stroke-dasharray": "14 10", "stroke-linecap": "round" })),
        h("circle", { r: 70, fill: "url(#eIris)" }),
        h("g", { "clip-path": "url(#eIrisClip)" }, [
          h("circle", { r: 48, fill: "none", stroke: "rgba(220,194,255,.22)", "stroke-width": 1 }),
          h("path", { d: "M-70,0 H-34 M34,0 H70 M0,-70 V-34 M0,34 V70", stroke: "rgba(220,194,255,.28)", "stroke-width": 1 }),
          (S.irisScan = h("g", {}, [
            h("rect", { x: -70, y: -16, width: 140, height: 16, fill: "rgba(220,194,255,.16)" }),
            h("rect", { x: -70, y: -0.75, width: 140, height: 1.5, fill: "#f3e9ff" }),
          ])),
        ]),
        h("circle", { r: 70, fill: "none", stroke: "#b46cff", "stroke-width": 2.5 }),
        (S.pupil = h("circle", { r: 24, fill: "#12031f", stroke: "#dcc2ff", "stroke-width": 3 })),
        (S.pupilDot = h("circle", { r: 4, fill: "#d9b8ff" })),
      ]);
      S.irisWrap.append(ir);
      const maskLids = `url(${OWN}lid-top.png), url(${OWN}lid-bot.png)`;
      S.eyeShine = div({ position: "absolute", left: 0, top: 0, width: "625px", height: "440px",
        maskImage: maskLids, WebkitMaskImage: maskLids, maskSize: "100% 100%, 100% 100%", WebkitMaskSize: "100% 100%, 100% 100%",
        background: "linear-gradient(110deg, rgba(255,255,255,0) 40%, rgba(255,255,255,.75) 50%, rgba(255,255,255,0) 60%)",
        backgroundSize: "300% 100%", backgroundRepeat: "no-repeat", opacity: 0 });
      S.eye.append(S.irisWrap, S.lidBot, S.lidTop, S.eyeShine);
      S.logo.append(S.wordWrap, S.tagWrap, S.eye);
      root.append(S.logo);

      // ---------- CTA ----------
      const c1 = words("Agende uma demonstração", { _: "grad-silver" });
      const c2 = words("gratuita", { _: "grad-neon" });
      S.cta1Words = c1.ws;
      S.cta2Word = c2.ws[0];
      S.cta1 = div({ position: "absolute", top: "1046px" }, "center-x cta1", c1.frag);
      S.cta2 = div({ position: "absolute", top: "1112px" }, "center-x cta2 glow-neon", c2.frag);
      root.append(S.cta1, S.cta2);

      // ---------- pílula ----------
      S.pillShine = h("span", { class: "shine" });
      // brilho passa POR BAIXO do texto (o "link na bio" nunca fica lavado)
      S.pill = h("div", { class: "pill" }, [S.pillShine, linkIcon(), h("span", { text: "link na bio" })]);
      // o anel de pulso mora dentro da linha da pílula: herda a mola, a escala e o desfoque dela
      S.ring1 = h("div", { class: "ring", style: { left: 0, top: 0, opacity: 0 } });
      S.pillRow = div({ position: "absolute", top: "1264px", height: "88px" }, "center-x", [S.ring1, S.pill]);
      root.append(S.pillRow);

      // ---------- linha de apoio ----------
      S.hairL = h("span", { class: "hair", style: { background: "linear-gradient(90deg, rgba(220,194,255,0), rgba(220,194,255,.6))" } });
      S.hairR = h("span", { class: "hair", style: { background: "linear-gradient(90deg, rgba(220,194,255,.6), rgba(220,194,255,0))" } });
      // conecta o produto à conta do vídeo (ativos, quem comprou, positivação)
      S.supText = h("span", { class: "support", html: '<div>Com o <b>SAIB Vendas</b>, a base dessa conta</div><div><span class="hl">já está no sistema.</span></div>' });
      S.support = div({ position: "absolute", top: "1384px", display: "flex", alignItems: "center", justifyContent: "center", gap: "20px" }, "center-x", [S.supText]); // sem filetes laterais: com 2 linhas eles cortavam o bloco ao meio
      root.append(S.support);
    },

    update(t, ctx) {
      const S = ctx.state;
      // medição preguiçosa (layout real, depois das fontes; offset* ignora transforms → independe do quadro)
      if (!S.meas) {
        S.meas = { pill: { x: S.pill.offsetLeft, w: S.pill.offsetWidth, h: S.pill.offsetHeight } };
        const P = S.meas.pill;
        set(S.ring1, { width: P.w, height: P.h });
        S.ring1.style.left = P.x + "px";
        S.ring1.style.transformOrigin = "50% 50%";
      }
      const { inOut, enterState } = SAIB.fx;

      // ===================== glows =====================
      const g1 = tw(t, -0.4, 0.8) * (1 - tw(t, 2.4, 0.6, ease.inOutQuad));
      set(S.glow1, { opacity: g1 * (0.85 + 0.15 * Math.sin(t * 2.1)), scale: 1 + 0.03 * Math.sin(t * 1.3) });
      const g2 = tw(t, 2.55, 1.0, ease.inOutQuad);
      set(S.glow2, { opacity: g2 * (0.88 + 0.12 * Math.sin(t * 1.7)), scale: 0.96 + 0.04 * g2 });

      // ===================== E1: eyebrow (HUD decorativo) =====================
      {
        const vis = inOut(null, t, T.eyebrow, T.out1 + 0.04, { in: { dur: 0.6, y: 24 }, out: { dur: 0.4 } });
        set(S.eyebrow, { ...vis, opacity: vis.opacity * 0.55 });
        const lp = tw(t, T.eyebrow + 0.1, 0.7);
        set(S.ebL, { sx: lp, sy: 1, origin: "100% 50%" });
        set(S.ebR, { sx: lp, sy: 1, origin: "0% 50%" });
        set(S.ebDot, { scale: Math.max(0, spring(t - T.eyebrow - 0.05, { freq: 2.2, damping: 0.5 })), opacity: 0.6 + 0.4 * Math.pow(0.5 + 0.5 * Math.sin(t * 5), 2) });
      }

      // ===================== E1: título =====================
      // entra por palavra; sai por linha (linha 2 primeiro), convergindo para o centro enquanto o olho sobe
      const titleOut = { dur: 0.3, y: -34, scale: 0.96, blur: 12, e: ease.inOutQuad };
      const titleSt = (i) => {
        const inL2 = i >= S.titleL1.length;
        const j = inL2 ? i - S.titleL1.length : i;
        const outAt = inL2 ? T.out1 + j * 0.02 : T.out1 + 0.05 + j * 0.02;
        return inOut(null, t, T.title + i * 0.045, outAt, { in: { dur: 0.62 }, out: titleOut });
      };
      S.titleWords.forEach((w, i) => {
        if (w === S.biWord) return;
        set(w, titleSt(i));
      });
      // "BI" respira em neon
      {
        const st = titleSt(4);
        set(S.biWord, { x: st.x, y: st.y, opacity: st.opacity, scale: st.scale });
        const glowR = 14 + 8 * Math.sin(t * 3);
        S.biWord.style.filter = (st.blur > 0.05 ? `blur(${st.blur.toFixed(2)}px) ` : "") + `drop-shadow(0 0 ${glowR.toFixed(1)}px rgba(180,108,255,.7))`;
      }

      // ===================== E1: tarja =====================
      {
        const a = tw(t, T.tag, 0.7);
        const st = inOut(null, t, T.tag, T.out1 - 0.02, { in: { dur: 0.7, y: 40 }, out: { dur: 0.36, y: -30, scale: 0.96, e: ease.inOutQuad } });
        set(S.tag, st);
        // a tarja "abre" do centro
        const open = tw(t, T.tag + 0.12, 0.6, ease.inOutCubic);
        S.tarja.style.clipPath = `inset(0 ${((1 - open) * 50).toFixed(2)}% 0 ${((1 - open) * 50).toFixed(2)}% round 10px)`;
        const step = Math.floor(t * 13);
        const glitch = hash(step * 3 + 7) > 0.82;
        S.slots.forEach((s, i) => {
          const r = hash(step * 17 + i * 131);
          const mode = r < 0.3 ? 1 : 0;
          const ch = GLYPHS[Math.floor(hash(step * 7 + i * 53 + 11) * GLYPHS.length)];
          if (mode !== s.mode || (mode === 0 && ch !== s.ch)) {
            if (mode === 1) s.el.innerHTML = "<i></i>";
            else s.el.textContent = ch;
            s.mode = mode;
            s.ch = ch;
          }
          const fl = 0.55 + 0.45 * hash(step * 29 + i * 5);
          s.el.style.opacity = (fl * a).toFixed(3);
          s.el.style.textShadow = glitch ? "2px 0 0 rgba(180,108,255,.9), -2px 0 0 rgba(120,220,255,.35)" : "0 0 10px rgba(180,108,255,.8)";
          s.el.style.transform = glitch && hash(i * 9 + step) > 0.6 ? `translateX(${((hash(i + step * 5) - 0.5) * 8).toFixed(1)}px)` : "none";
        });
        const sw = (((t - T.tag) % 1.1) + 1.1) % 1.1 / 1.1;
        set(S.sweep, { x: lerp(-100, 420, ease.inOutQuad(clamp(sw))) });
        // rótulo NOME: leitura estável, só um leve pulso de cursor
        S.tagLabel.style.opacity = (0.925 + 0.075 * Math.sin(t * 6)).toFixed(3);
      }

      // ===================== E1: dashboard =====================
      {
        S.ghost.update(t);
        S.crisp.update(t);
        const eyeOn = tw(t, T.eye, 0.9, ease.inOutCubic);
        // saída: o dashboard "colapsa" para o centro do selo (que nasce dali), em vez de só sumir
        const col = tw(t, T.dashOut, 0.55, ease.inOutCubic);
        const gone = tw(t, T.dashOut + 0.05, 0.36, ease.inQuad);
        const seloCy = SELO.y + S.seloH / 2;
        set(S.dash, {
          opacity: 1 - gone,
          scale: lerp(1, 0.42, col) * (1 + 0.012 * tw(t, -0.4, 2.6, ease.inOutQuad)),
          blur: gone * 8,
          y: lerp(0, -10, tw(t, -0.4, 2.6, ease.inOutQuad)) + (seloCy - (CARD.y + CARD.h / 2)) * col,
          origin: "50% 50%",
        });
        set(S.cardBg, { opacity: tw(t, -0.3, 0.8) });
        set(S.ghostWrap, { opacity: lerp(1, 0.7, eyeOn), blur: lerp(2.4, 3.2, eyeOn) });
        set(S.veil, { opacity: lerp(0.6, 1, eyeOn) * tw(t, -0.2, 0.8) });
        // scanner local vai e volta: só a faixa sob o feixe aparece nítida
        const t0 = T.scan0, half = 1.15;
        const ph = Math.max(0, t - t0);
        const yy = (CARD.h * (1 - Math.cos((Math.PI * ph) / half))) / 2;
        const vel = Math.sin((Math.PI * ph) / half); // >0 descendo
        const vis = tw(t, t0 - 0.05, 0.3) * (1 - tw(t, 2.22, 0.24, ease.inCubic));
        const trail = 22 + 92 * Math.abs(vel);
        const down = vel >= 0;
        const a0 = down ? yy - trail : yy - 6;
        const a1 = down ? yy + 6 : yy + trail;
        const mask = down
          ? `linear-gradient(180deg, transparent ${a0.toFixed(1)}px, rgba(0,0,0,.95) ${(yy - 4).toFixed(1)}px, black ${yy.toFixed(1)}px, transparent ${a1.toFixed(1)}px)`
          : `linear-gradient(180deg, transparent ${a0.toFixed(1)}px, black ${yy.toFixed(1)}px, rgba(0,0,0,.95) ${(yy + 4).toFixed(1)}px, transparent ${a1.toFixed(1)}px)`;
        S.crispWrap.style.maskImage = mask;
        S.crispWrap.style.webkitMaskImage = mask;
        S.crispWrap.style.opacity = vis.toFixed(3);
        set(S.scan, { y: yy - 1.5, opacity: vis });
        set(S.scanTrail, { y: down ? yy - trail : yy, height: trail, opacity: vis * 0.9 });
        S.scanTrail.style.background = down
          ? "linear-gradient(180deg, rgba(180,108,255,0), rgba(180,108,255,.16))"
          : "linear-gradient(0deg, rgba(180,108,255,0), rgba(180,108,255,.16))";
        // leitura HUD: chip escuro preso à linha, na borda direita do cartão, sempre dentro dele
        const hy = clamp(down ? yy - 40 : yy + 12, 10, CARD.h - 44);
        set(S.hud, { y: hy, opacity: vis * 0.92 * (1 - eyeOn) });
        const pct = Math.round(37 * clamp(ph / (half * 2)) + 4 * Math.abs(Math.sin(ph * 3)));
        const txt = `RESTRITO · ${String(pct).padStart(2, "0")}%`;
        if (S.hud.textContent !== txt) S.hud.textContent = txt;
        // cantos de mira
        S.corners.forEach((c, i) => {
          const q = tw(t, -0.28 + i * 0.05, 0.7);
          const dx = (i % 2 ? 1 : -1) * lerp(26, 0, q), dy = (i < 2 ? -1 : 1) * lerp(26, 0, q);
          set(c, { x: dx, y: dy, opacity: q * (0.75 + 0.25 * Math.sin(t * 4 + i)) * (1 - col) });
        });
      }

      // piscada: fecha rápido (0,08 s), segura 2 quadros, reabre em mola com leve overshoot
      const bClose = T.blink + 0.08, bOpen = bClose + 0.035;
      const bl =
        t < T.blink ? 0 : t < bClose ? ease.inQuad(prog(t, T.blink, bClose)) : t < bOpen ? 1 : 1 - spring(t - bOpen, { freq: 2.6, damping: 0.5 });
      const flashAt = T.blink + 0.14;
      const flash = Math.exp(-Math.pow((t - flashAt) / 0.12, 2));

      // ===================== halo do olho =====================
      {
        const on = tw(t, T.eye - 0.1, 0.7) * (1 - tw(t, T.travel, 0.4, ease.inQuad));
        set(S.halo, { opacity: on });
        const pulse = 0.85 + 0.15 * Math.sin(t * 3.4);
        set(S.haloGlow, { opacity: on * (pulse + 0.7 * flash), scale: 1 + 0.15 * flash });
      }

      // ===================== olho / logo =====================
      {
        const s = LOGO.s;
        // drift final sutil (empurrão lento + respiração)
        const push = tw(t, 2.9, 3.0, ease.outQuad);
        const ls = s * (1 + 0.012 * push);
        const lw = LOGO.w * ls;
        const lx = 540 - lw / 2;
        const ly = LOGO.y - 4 * push + 1.5 * Math.sin(t * 1.1) * push;
        S.logo.style.transform = `translate(${lx.toFixed(2)}px, ${ly.toFixed(2)}px) scale(${ls.toFixed(5)})`;
        // centro final do olho (tela) e deslocamento natural até a posição de E1
        const fx = lx + EYE.cx * ls, fy = ly + (100 + EYE.cy) * ls;
        const tp = ease.inOutQuart(prog(t, T.travel, T.travel + T.travelDur));
        // arco: x anda um pouco antes de y (trajetória curva)
        const tpx = ease.inOutCubic(prog(t, T.travel - 0.04, T.travel + T.travelDur - 0.06));
        const sx = lerp(EYE_E1.x, fx, tpx);
        const sy = lerp(EYE_E1.y, fy, tp) - 60 * Math.sin(Math.PI * tp);
        const k = lerp(EYE_E1.k, 1, ease.inOutCubic(prog(t, T.travel, T.travel + T.travelDur)));
        const drift = 1 - tp;
        const ex = (sx - fx) / ls + (6 * Math.sin(t * 1.4) * drift) / ls;
        const ey = (sy - fy) / ls + (8 * Math.sin(t * 1.9) * drift) / ls;
        const ent = tw(t, T.eye, 0.8);
        const eBlur = (1 - ent) * 16 + Math.sin(Math.PI * tp) * 3;
        const bPulse = 1 + 0.04 * Math.sin(Math.PI * prog(t, bOpen, bOpen + 0.25));
        set(S.eye, { x: ex, y: ey, scale: k * lerp(0.82, 1, ent) * bPulse, sx: 1 + 0.06 * bl, sy: 1 - 0.84 * bl, opacity: clamp(prog(t, T.eye, T.eye + 0.35)), blur: eBlur / (ls * k) });
        flat(S.eye);
        // pálpebras se encontram (mola) + piscada de verdade
        const sp = spring(t - T.eye, { freq: 1.5, damping: 0.62 });
        const lidGap = (1 - sp) * 170;
        set(S.lidTop, { x: -(1 - sp) * 60, y: -lidGap + bl * 34, rot: -(1 - sp) * 16 });
        flat(S.lidTop);
        set(S.lidBot, { x: (1 - sp) * 60, y: lidGap - bl * 34, rot: -(1 - sp) * 16 });
        flat(S.lidBot);
        // íris (lente)
        const ip = Math.max(0, spring(t - T.iris, { freq: 1.8, damping: 0.55 }));
        const look = -26 * tw(t, T.look, 0.22, ease.inOutCubic) + 26 * tw(t, T.look + 0.34, 0.24, ease.inOutCubic);
        const irisOut = tw(t, T.travel + 0.05, 0.35, ease.inQuad);
        const irisSy = 1 - 0.96 * clamp(bl);
        set(S.irisWrap, { x: look, sx: ip * (1 - 0.2 * irisOut), sy: ip * irisSy * (1 - 0.2 * irisOut), opacity: 1 - irisOut });
        flat(S.irisWrap);
        S.irisRing.setAttribute("transform", `rotate(${(t * 40).toFixed(2)})`);
        S.irisTicks.setAttribute("transform", `rotate(${(-t * 22).toFixed(2)})`);
        // linha de varredura atravessa a íris quando o olho "olha para o lado"
        const scp = prog(t, T.look - 0.05, T.look + 0.6);
        const scy = lerp(-78, 78, ease.inOutCubic(scp));
        S.irisScan.setAttribute("transform", `translate(0 ${scy.toFixed(2)})`);
        S.irisScan.style.opacity = scp > 0 && scp < 1 ? "1" : "0";
        S.irisGlow.setAttribute("r", (108 + 16 * Math.sin(t * 3.4) + 40 * flash).toFixed(1));
        S.pupil.setAttribute("r", (24 - 7 * flash + 2.5 * Math.sin(t * 2.2)).toFixed(2));
        // segunda passada de luz no símbolo durante o hold final
        const esp = prog(t, T.eyeShine, T.eyeShine + 0.5);
        S.eyeShine.style.backgroundPosition = `${lerp(100, 0, ease.inOutCubic(esp)).toFixed(2)}% 0`;
        S.eyeShine.style.opacity = esp > 0 && esp < 1 ? "0.35" : "0";
        // wordmark e tagline revelam a partir do símbolo (o olho ainda chegando "puxa" o saib)
        const wp = tw(t, T.word, 0.62, ease.outQuart);
        const featherMask = (q, w, f) => {
          const x = q * (w + f);
          return `linear-gradient(90deg, black ${(x - f).toFixed(1)}px, transparent ${x.toFixed(1)}px)`;
        };
        const mw = featherMask(wp, 1199, 220);
        S.wordWrap.style.maskImage = mw;
        S.wordWrap.style.webkitMaskImage = mw;
        set(S.wordWrap, { x: lerp(-90, 0, wp), opacity: clamp(wp * 2.2), blur: (1 - wp) * 18 });
        const tg = tw(t, T.tagline, 0.7, ease.outQuart);
        const mt = featherMask(tg, 1199, 220);
        S.tagWrap.style.maskImage = mt;
        S.tagWrap.style.webkitMaskImage = mt;
        set(S.tagWrap, { x: lerp(-60, 0, tg), opacity: clamp(tg * 2), blur: (1 - tg) * 14 });
        // brilho atravessando o "saib"
        const gp = prog(t, T.glint, T.glint + 0.6);
        S.wordGlint.style.backgroundPosition = `${lerp(100, 0, ease.inOutCubic(gp)).toFixed(2)}% 0`;
        S.wordGlint.style.opacity = (gp > 0 && gp < 1 ? 1 : 0).toString();
      }

      // ===================== "Fique de olho." =====================
      const fqSt = (i) => inOut(null, t, T.fique + i * 0.05, T.fiqueOut + i * 0.03, { in: { dur: 0.72 }, out: { dur: 0.28, y: -30, blur: 10, e: ease.inOutQuad } });
      S.fiqueWords.forEach((w, i) => {
        if (w === S.olho) return;
        set(w, fqSt(i));
      });
      {
        const st = fqSt(2);
        set(S.olho, { x: st.x, y: st.y, opacity: st.opacity, scale: st.scale });
        S.olho.style.filter =
          (st.blur > 0.05 ? `blur(${st.blur.toFixed(2)}px) ` : "") +
          `drop-shadow(0 0 ${(12 + 26 * flash + 4 * Math.sin(t * 3)).toFixed(1)}px rgba(180,108,255,${(0.6 + 0.4 * flash).toFixed(2)}))`;
      }

      // ===================== E2: partículas =====================
      {
        const on = tw(t, 2.75, 1.0);
        S.motes.forEach((m, i) => {
          const x = m.x + noise(t * 0.35 + m.ph, i) * 30;
          const y = m.y + noise(t * 0.3 + m.ph, i + 50) * 30 - (t - 3) * 10 * m.s;
          const tw2 = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * (1.2 + m.d) + m.ph));
          // zona do CTA (texto + pílula + apoio, y ≳ 1010): partícula some antes de chegar lá
          const keep = 1 - clamp((y - 960) / 50);
          set(m.el, { x, y, scale: m.s, opacity: on * tw2 * 0.55 * keep });
        });
      }

      // ===================== E2: selo (nasce de onde o dashboard colapsou) =====================
      {
        const sp = spring(t - T.selo, { freq: 1.35, damping: 0.66 });
        const vis = clamp(prog(t, T.selo, T.selo + 0.35));
        const push = tw(t, 3.0, 2.9, ease.outQuad);
        set(S.selo, {
          scale: lerp(0.6, 1, sp) * (1 + 0.012 * push),
          rot: lerp(-10, 0, Math.min(1.05, sp)),
          y: lerp(30, 0, tw(t, T.selo, 0.8)) + 1.2 * Math.sin(t * 1.3 + 1) * push,
          opacity: vis,
          blur: (1 - tw(t, T.selo, 0.6)) * 12,
          origin: "50% 50%",
        });
        set(S.seloGlow, { opacity: vis * (0.8 + 0.2 * Math.sin(t * 1.8)), scale: lerp(0.7, 1, tw(t, T.selo, 1)) });
        // anel de luz que se expande ao chegar (rastro)
        const rp = prog(t, T.selo + 0.12, T.selo + 1.0);
        set(S.ringFx, { scale: SELO_K * lerp(0.8, 1.3, ease.outCubic(rp)), opacity: rp > 0 && rp < 1 ? (1 - rp) * 0.8 : 0 });
        // régua finíssima girando a 0,6 rpm
        set(S.seloHair, { rot: t * 3.6, scale: SELO_K, opacity: 0.18 * tw(t, T.selo + 0.5, 0.8) });
        // feixe de brilho
        const shp = prog(t, T.sheen, T.sheen + 0.62);
        S.seloSheen.style.backgroundPosition = `${lerp(100, 0, ease.inOutCubic(shp)).toFixed(2)}% 0`;
        S.seloSheen.style.opacity = (shp > 0 && shp < 1 ? 1 : 0).toString();
      }

      // ===================== E2: CTA =====================
      S.cta1Words.forEach((w, i) => inOut(w, t, T.cta + i * 0.05, null, { in: { dur: 0.72 } }));
      {
        const st = enterState(t, T.cta + 0.1, { dur: 0.7, y: 50, scale: 0.92 });
        set(S.cta2Word, { x: st.x, y: st.y, opacity: st.opacity, scale: st.scale, origin: "50% 60%" });
        const br = 0.9 + 0.1 * Math.sin(t * 2.2);
        S.cta2Word.style.filter = (st.blur > 0.05 ? `blur(${st.blur.toFixed(2)}px) ` : "") + `brightness(${br.toFixed(3)})`;
      }

      // ===================== E2: pílula =====================
      {
        const sp = spring(t - T.pill, { freq: 1.6, damping: 0.55 });
        const vis = clamp(prog(t, T.pill, T.pill + 0.3));
        const breathe = 1 + 0.012 * Math.sin((t - 3.6) * 4.2) * tw(t, 3.6, 0.4);
        set(S.pillRow, { scale: lerp(0.7, 1, sp) * breathe, opacity: vis, y: lerp(30, 0, tw(t, T.pill, 0.6)), blur: (1 - tw(t, T.pill, 0.5)) * 10, origin: "50% 50%" });
        const shp = prog(t, T.pill + 0.45, T.pill + 1.05);
        set(S.pillShine, { x: lerp(-140, (S.meas.pill.w || 400) + 20, ease.inOutCubic(shp)) });
        // pulso: só depois que a pílula assenta; período 1,0 s, no último quadro (5,4) q ≈ 0,9
        const per = 1.0, tt = t - T.ring;
        if (tt < 0) set(S.ring1, { opacity: 0 });
        else {
          const q = (tt % per) / per;
          set(S.ring1, { scale: lerp(1, 1.28, ease.outCubic(q)), opacity: Math.pow(1 - q, 1.5) * 0.6 * tw(t, T.ring, 0.3) });
        }
      }

      // ===================== E2: linha de apoio =====================
      {
        const st = enterState(t, T.support, { dur: 0.6, y: 30 });
        set(S.supText, st);
        const lp = tw(t, T.support + 0.2, 0.7);
        set(S.hairL, { sx: lp, sy: 1, origin: "100% 50%", opacity: lp });
        set(S.hairR, { sx: lp, sy: 1, origin: "0% 50%", opacity: lp });
      }

      // ===================== culling: tira do layout o que está invisível (desempenho) =====================
      const cull = (el, on) => {
        if (el._d0 === undefined) el._d0 = el.style.display === "none" ? "" : el.style.display; // preserva display original (ex.: flex)
        const d = on ? el._d0 : "none";
        if (el.style.display !== d) el.style.display = d;
      };
      cull(S.dash, t < T.dashOut + 0.55);
      cull(S.crispWrap, t > T.scan0 - 0.1 && t < 2.5);
      cull(S.halo, t < T.travel + 0.45);
      cull(S.haloGlow, t < T.travel + 0.45);
      cull(S.glow1, t < 3.05);
      cull(S.glow2, t > 2.5);
      cull(S.eyebrow, t < T.out1 + 0.5);
      cull(S.title, t < T.out1 + 0.65);
      cull(S.tag, t < T.out1 + 0.45);
      cull(S.fique, t < T.fiqueOut + 0.45);
      cull(S.selo, t > T.selo - 0.02);
      cull(S.seloGlow, t > T.selo - 0.02);
      cull(S.wordWrap, t > T.word - 0.02);
      cull(S.tagWrap, t > T.tagline - 0.02);
      cull(S.cta1, t > T.cta - 0.02);
      cull(S.cta2, t > T.cta + 0.08);
      cull(S.pillRow, t > T.pill - 0.02);
      cull(S.support, t > T.support - 0.02);
      S.motes.forEach((m) => cull(m.el, t > 2.75));
    },
  });
})();
