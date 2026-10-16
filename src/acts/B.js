/*
 * ATO B — "A conta" · 9,8–20,0 s (dur 10,2)
 *
 * Coreografia (tempos locais) — rodada de correção 1:
 *  -0.40  HUD: eyebrow "A CONTA" acende; vidros dos chips, cantos de mira e régua tracejada já
 *         surgem como "esqueleto" (o scan do motor revela a fórmula se montando)
 *  -0.25  "Positivação =" entra por letra (o "=" é glifo lilás na linha do título)
 *   0.15  numerador (vidro + palavras, "compraram" em neon)
 *   0.35  barra da fração desenha-se do centro para fora com cabeças de luz
 *   0.55  denominador ("ativos" em branco)
 *   1.00  pontos do "÷" saltam (mola): a barra É o sinal de divisão
 *  ~1.5   fórmula completa; leitura parada até 4.5 com vida: push-in lento, paralaxe entre
 *         chips e título, segundo brilho no vidro, pontos respirando, leitura HUD rodando
 *   4.10  carimbo "EXEMPLO" (âmbar) bate no canto (causa)
 *   4.50  feixe de raio-X varre os chips (efeito): faixa "radiografada" à frente do feixe,
 *         borda do vidro acende onde passa, texto vira número
 *   4.75  600 conta · 4.90 420 conta (fim 5.75, ~0.7 s parado)
 *   6.35  rótulos HUD saem; 6.45 colapso: título sobe, vidros achatam e viram a barra,
 *         números levantam para "420 ÷ 600" (com "compraram"/"ativos" embaixo) e o "="
 *         do título desce para baixo da linha, apontando para o resultado
 *   6.75  a barra CURVA-SE e fecha num anel ainda luminoso (depois esfria para a trilha)
 *   6.95  "70%" entra · 7.00 arco neon 0→70% · 7.15 régua · 7.45 "de positivação"
 *   7.90  70% assenta: pulso de luz, "LEITURA CONCLUÍDA"; composição viva até 10.65
 */
(function () {
  const W = 1080;
  // ---- geometria
  const CX = 540;
  const BAR_Y = 950; // barra da fração (B1)
  const BAR_L = 820;
  const R = 290; // raio do anel
  const RING_CY = 1000;
  const RING_TOP = RING_CY - R; // 710
  const CHIP = { x: 120, w: 840, h: 200 };
  const NUM_TOP = 700; // chip numerador: 700–900
  const DEN_TOP = 1000; // chip denominador: 1000–1200
  const ROW_Y = 490; // linha "420 ÷ 600"
  const ROWLAB_Y = ROW_Y + 52; // rótulos pequenos sob a linha
  const EQ_Y = 612; // "=" sob a linha, apontando para o anel
  const NUMBOX = { left: 18, w: 400 }; // caixa do número dentro do chip (alinhada à direita)
  const NUM_SCALE = 0.6;
  // bordas direitas finais (coordenadas da tela) na linha do resultado (grupo centrado em 540)
  const ROW = { r420: 488, div: 540, r600: 754 };
  const ROWW = 162; // largura aproximada de 3 dígitos na escala final

  const T = {
    eyebrow: -0.4,
    title: -0.25,
    brackets: -0.2,
    numChip: 0.15,
    bar: 0.35,
    barDur: 0.7,
    denChip: 0.55,
    dots: 1.0,
    hud1: 2.0,
    stamp: 4.1,
    sweep: 4.5,
    sweepDur: 0.8,
    count600: 4.75,
    count420: 4.9,
    countDur: 0.85,
    collapse: 6.45,
    bend: 6.75,
    bendDur: 0.8,
    ticks: 7.15,
    prog: 7.0,
    progDur: 0.9,
    pct: 6.95,
    label: 7.45,
    settle: 7.9,
  };

  const css = `
[data-act="B"] .b-world { position:absolute; inset:0; width:${W}px; height:1920px; }
[data-act="B"] .b-abs { position:absolute; }
[data-act="B"] .b-eyebrow { left:0; width:${W}px; top:386px; display:flex; justify-content:center; align-items:center; gap:22px;
  font-family:var(--font-mono); font-weight:600; font-size:30px; letter-spacing:0.32em; color:var(--lilac); }
[data-act="B"] .b-eyebrow .ln { width:36px; height:2px; background:linear-gradient(90deg, rgba(220,194,255,0), rgba(220,194,255,0.7)); }
[data-act="B"] .b-eyebrow .ln.r { background:linear-gradient(90deg, rgba(220,194,255,0.7), rgba(220,194,255,0)); }
[data-act="B"] .b-eyebrow .dot { width:10px; height:10px; border-radius:50%; background:var(--neon); box-shadow:0 0 12px 3px rgba(180,108,255,0.8); }
[data-act="B"] .b-eyebrow .tx { padding-left:0.32em; }
[data-act="B"] .b-title { left:0; width:${W}px; top:436px; display:flex; justify-content:center; align-items:baseline;
  font-size:118px; white-space:nowrap; }
[data-act="B"] .b-title .fx-char { background:linear-gradient(180deg, #ffffff 0%, #e9e7f2 42%, #a9a6b8 100%);
  -webkit-background-clip:text; background-clip:text; color:transparent; padding:0 0.01em; }
[data-act="B"] .b-eqg { display:inline-block; margin-left:0.26em; font-family:var(--font-display); font-weight:800;
  color:#dcc2ff; text-shadow:0 0 18px rgba(180,108,255,0.55); }
[data-act="B"] .b-chip { left:${CHIP.x}px; width:${CHIP.w}px; height:${CHIP.h}px; border-radius:30px;
  background:linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.03));
  border:1.5px solid rgba(255,255,255,0.13);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 30px 60px -20px rgba(0,0,0,0.55); overflow:hidden; }
[data-act="B"] .b-chip.num { border-color:rgba(180,108,255,0.42);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 0 40px -6px rgba(139,43,217,0.45), 0 30px 60px -20px rgba(0,0,0,0.55); }
[data-act="B"] .b-chip .sheen { position:absolute; top:-20px; left:0; width:220px; height:${CHIP.h + 40}px;
  background:linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0) 100%); }
[data-act="B"] .b-tag { left:${CHIP.x + 26}px; font-family:var(--font-mono); font-size:22px; white-space:nowrap;
  letter-spacing:0.22em; color:rgba(220,194,255,0.5); }
[data-act="B"] .b-tag .v { color:rgba(220,194,255,0.36); }
[data-act="B"] .b-edge { left:${CHIP.x}px; width:${CHIP.w}px; height:${CHIP.h}px; border-radius:30px;
  border:2.5px solid #d6b4ff; box-shadow:0 0 26px rgba(180,108,255,0.85), inset 0 0 22px rgba(180,108,255,0.45); }
[data-act="B"] .b-box { left:${CHIP.x}px; width:${CHIP.w}px; height:${CHIP.h}px; }
[data-act="B"] .b-text { position:absolute; left:0; top:0; width:100%; height:100%; display:flex; flex-direction:column;
  justify-content:center; align-items:center; font-family:var(--font-text); font-weight:500; font-size:54px;
  line-height:1.16; color:var(--silver-1); letter-spacing:-0.01em; padding-top:34px; }
[data-act="B"] .b-text .w { display:inline-block; white-space:nowrap; }
[data-act="B"] .b-text .k-neon { color:#c99bff; font-weight:800; text-shadow:0 0 22px rgba(180,108,255,0.7); }
[data-act="B"] .b-text .k-silver { color:#ffffff; font-weight:800; text-shadow:0 0 18px rgba(255,255,255,0.28); }
[data-act="B"] .b-xray .b-text { transform:skewX(-6deg); }
[data-act="B"] .b-xray .b-text, [data-act="B"] .b-xray .b-text .w { color:#dcc2ff; text-shadow:0 0 14px rgba(180,108,255,0.95); }
[data-act="B"] .b-num { position:absolute; left:${NUMBOX.left}px; width:${NUMBOX.w}px; top:${(CHIP.h - 170) / 2 + 12}px; height:170px;
  text-align:right; font-family:var(--font-display); font-weight:800; font-size:150px; line-height:170px;
  font-variant-numeric:tabular-nums; letter-spacing:-0.01em; transform-origin:100% 50%; white-space:nowrap; }
[data-act="B"] .b-num span { display:inline-block; }
[data-act="B"] .b-num.neon span { background:linear-gradient(180deg, #f6edff 0%, #cf9dff 48%, #9a45f0 100%);
  -webkit-background-clip:text; background-clip:text; color:transparent; }
[data-act="B"] .b-num.silver span { background:linear-gradient(180deg, #ffffff 0%, #e4e2ee 45%, #a9a6b8 100%);
  -webkit-background-clip:text; background-clip:text; color:transparent; }
[data-act="B"] .b-numglow { position:absolute; left:${NUMBOX.left + 60}px; top:20px; width:${NUMBOX.w - 40}px; height:${CHIP.h - 40}px;
  border-radius:50%; background:radial-gradient(closest-side, rgba(180,108,255,0.38), rgba(180,108,255,0)); }
[data-act="B"] .b-lab { position:absolute; left:${NUMBOX.left + NUMBOX.w + 34}px; top:0; height:${CHIP.h}px; display:flex;
  flex-direction:column; justify-content:center; font-family:var(--font-text); font-weight:600; font-size:44px;
  line-height:1.08; color:var(--silver-2); padding-top:46px; }
[data-act="B"] .b-lab b { color:#ffffff; font-weight:800; }
[data-act="B"] .b-lab b.n { color:#c99bff; text-shadow:0 0 18px rgba(180,108,255,0.6); }
[data-act="B"] .b-sweep { top:660px; width:0; height:580px; }
[data-act="B"] .b-sweep .core { position:absolute; left:-2px; top:0; width:4px; height:100%; border-radius:2px;
  background:linear-gradient(180deg, rgba(255,255,255,0), #ffffff 16%, #ffffff 84%, rgba(255,255,255,0)); }
[data-act="B"] .b-sweep .halo { position:absolute; left:-60px; top:0; width:120px; height:100%;
  background:radial-gradient(closest-side, rgba(200,150,255,0.85), rgba(139,43,217,0.35) 45%, rgba(139,43,217,0));
  -webkit-mask-image:linear-gradient(180deg, transparent, #000 14%, #000 86%, transparent); mask-image:linear-gradient(180deg, transparent, #000 14%, #000 86%, transparent); }
[data-act="B"] .b-sweep .trail { position:absolute; right:0; top:8%; width:260px; height:84%;
  background:linear-gradient(90deg, rgba(180,108,255,0), rgba(180,108,255,0.16));
  -webkit-mask-image:linear-gradient(180deg, transparent, #000 25%, #000 75%, transparent); mask-image:linear-gradient(180deg, transparent, #000 25%, #000 75%, transparent); }
[data-act="B"] .b-sweep .fore { position:absolute; left:2px; top:10%; width:76px; height:80%;
  background:linear-gradient(90deg, rgba(220,194,255,0.14), rgba(220,194,255,0));
  -webkit-mask-image:linear-gradient(180deg, transparent, #000 25%, #000 75%, transparent); mask-image:linear-gradient(180deg, transparent, #000 25%, #000 75%, transparent); }
[data-act="B"] .b-stamp { left:0; top:0; padding:10px 20px 10px 24px; border:3px solid var(--amber); border-radius:11px;
  font-family:var(--font-mono); font-weight:600; font-size:26px; letter-spacing:0.22em; color:var(--amber);
  background:rgba(255,181,71,0.07); white-space:nowrap; text-shadow:0 0 14px rgba(255,181,71,0.45); }
[data-act="B"] .b-stamp::after { content:""; position:absolute; inset:5px; border:1.5px solid rgba(255,181,71,0.55); border-radius:7px; }
[data-act="B"] .b-stamp-ring { left:0; top:0; border:2px solid var(--amber); border-radius:13px; }
[data-act="B"] .b-rowsym { top:${ROW_Y - 60}px; width:80px; margin-left:-40px; height:120px; text-align:center;
  font-family:var(--font-display); font-weight:600; font-size:84px; line-height:120px; color:var(--lilac);
  text-shadow:0 0 16px rgba(180,108,255,0.45); }
[data-act="B"] .b-rowlab { top:${ROWLAB_Y}px; width:300px; margin-left:-150px; text-align:center; font-family:var(--font-text);
  font-weight:600; font-size:32px; letter-spacing:0.01em; white-space:nowrap; }
[data-act="B"] .b-rowlab.n { color:#c99bff; text-shadow:0 0 14px rgba(180,108,255,0.55); }
[data-act="B"] .b-rowlab.s { color:var(--silver-2); }
[data-act="B"] .b-pct { left:0; width:${W}px; top:${RING_CY - 172}px; height:280px; display:flex; justify-content:center;
  align-items:baseline; font-family:var(--font-display); font-weight:900; line-height:280px; white-space:nowrap; }
[data-act="B"] .b-pct .n { font-size:264px; letter-spacing:-0.035em; font-variant-numeric:tabular-nums; display:inline-block;
  min-width:1.16em; text-align:center;
  background:linear-gradient(180deg, #ffffff 0%, #ecebf4 40%, #a9a6b8 100%); -webkit-background-clip:text; background-clip:text; color:transparent; }
[data-act="B"] .b-pct .p { font-size:128px; margin-left:6px; display:inline-block;
  background:linear-gradient(180deg, #f1e4ff 0%, #c48bff 50%, #9a45f0 100%); -webkit-background-clip:text; background-clip:text; color:transparent; }
[data-act="B"] .b-pctlab { left:0; width:${W}px; top:${RING_CY + 108}px; text-align:center; font-family:var(--font-text);
  font-weight:500; font-size:44px; color:var(--silver-2); letter-spacing:0.005em; }
[data-act="B"] .b-glow { border-radius:50%; }
[data-act="B"] .b-hud { left:0; width:${W}px; text-align:center; font-family:var(--font-mono); font-size:22px; letter-spacing:0.24em;
  color:rgba(220,194,255,0.62); white-space:nowrap; }
[data-act="B"] .b-hud .d { display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--neon);
  box-shadow:0 0 10px 2px rgba(180,108,255,0.8); margin-right:16px; vertical-align:middle; position:relative; top:-2px; }
[data-act="B"] svg.b-svg { position:absolute; left:0; top:0; width:${W}px; height:1920px; overflow:visible; }
`;

  // --------------------------------------------------------------------------------------------
  // curva que vai da barra reta (m=0) ao anel fechado (m=1)
  function geom(m) {
    const L = SAIB.fx.lerp(BAR_L, 2 * Math.PI * R, m);
    const th = m * 2 * Math.PI;
    const midY = SAIB.fx.lerp(BAR_Y, RING_TOP, m);
    if (th < 1e-4) return { L, pt: (s) => [CX + s, midY] };
    const r = L / th;
    return { L, pt: (s) => [CX + r * Math.sin(s / r), midY + r - r * Math.cos(s / r)] };
  }
  function pathD(g, a, b, n) {
    if (b - a < 0.01) return "M0 0";
    let d = "";
    for (let i = 0; i <= n; i++) {
      const [x, y] = g.pt(a + ((b - a) * i) / n);
      d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }
    return d;
  }
  // dígitos HUD "rodando" (determinístico por quadro)
  const rollDigits = (t, seed) => {
    const k = Math.floor(t * 11);
    return String(Math.floor(SAIB.fx.hash(k * 7 + seed) * 900) + 100);
  };

  SAIB.act("B", {
    css,
    build(root, ctx) {
      const { h, split } = SAIB.fx;
      const S = ctx.state;
      const world = (S.world = h("div", { class: "b-world" }));
      root.append(world);

      // brilhos locais (sem blur, só gradientes)
      S.glowA = h("div", {
        class: "b-abs b-glow",
        style: {
          left: CX - 520 + "px", top: BAR_Y - 520 + "px", width: "1040px", height: "1040px",
          background: "radial-gradient(closest-side, rgba(139,43,217,0.24), rgba(139,43,217,0.08) 55%, rgba(139,43,217,0))",
        },
      });
      S.glowB = h("div", {
        class: "b-abs b-glow",
        style: {
          left: CX - 460 + "px", top: RING_CY - 460 + "px", width: "920px", height: "920px",
          background: "radial-gradient(closest-side, rgba(180,108,255,0.30), rgba(139,43,217,0.12) 50%, rgba(139,43,217,0))",
        },
      });
      world.append(S.glowA, S.glowB);

      // eyebrow
      S.eyebrow = h("div", { class: "b-abs b-eyebrow" }, [
        (S.ebL = h("span", { class: "ln" })),
        (S.ebDot = h("span", { class: "dot" })),
        (S.ebTx = h("span", { class: "tx", text: "A CONTA" })),
        (S.ebR = h("span", { class: "ln r" })),
      ]);
      S.ebChars = split(S.ebTx).chars;
      world.append(S.eyebrow);

      // título "Positivação =" (o "=" é um glifo na mesma linha; depois desce para baixo da conta)
      S.title = h("div", { class: "b-abs b-title display" });
      S.titleTx = h("span", { text: "Positivação" });
      S.eqG = h("span", { class: "b-eqg", text: "=" });
      S.title.append(S.titleTx, S.eqG);
      S.titleChars = split(S.titleTx).chars;
      world.append(S.title);

      // SVG: barra/anel, régua, arco, brilhos
      const svg = h("svg", { class: "b-svg", viewBox: `0 0 ${W} 1920` });
      const defs = h("defs", {}, [
        h("linearGradient", { id: "bBarG", x1: "130", y1: "0", x2: "950", y2: "0", gradientUnits: "userSpaceOnUse" }, [
          h("stop", { offset: "0", "stop-color": "#b46cff", "stop-opacity": "0.25" }),
          h("stop", { offset: "0.3", "stop-color": "#e9dcff" }),
          h("stop", { offset: "0.5", "stop-color": "#ffffff" }),
          h("stop", { offset: "0.7", "stop-color": "#e9dcff" }),
          h("stop", { offset: "1", "stop-color": "#b46cff", "stop-opacity": "0.25" }),
        ]),
        h("linearGradient", { id: "bArcG", x1: String(CX + R), y1: String(RING_CY - R), x2: String(CX - R), y2: String(RING_CY + R), gradientUnits: "userSpaceOnUse" }, [
          h("stop", { offset: "0", "stop-color": "#efe2ff" }),
          h("stop", { offset: "0.45", "stop-color": "#c48bff" }),
          h("stop", { offset: "1", "stop-color": "#8b2bd9" }),
        ]),
        h("radialGradient", { id: "bTipG" }, [
          h("stop", { offset: "0", "stop-color": "#ffffff", "stop-opacity": "0.95" }),
          h("stop", { offset: "0.25", "stop-color": "#dcc2ff", "stop-opacity": "0.7" }),
          h("stop", { offset: "0.6", "stop-color": "#b46cff", "stop-opacity": "0.22" }),
          h("stop", { offset: "1", "stop-color": "#b46cff", "stop-opacity": "0" }),
        ]),
      ]);
      svg.append(defs);
      const P = (attrs) => h("path", Object.assign({ fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, attrs));
      S.inner = h("circle", { cx: CX, cy: RING_CY, r: R - 38, fill: "none", stroke: "rgba(220,194,255,0.30)", "stroke-width": "2", "stroke-dasharray": "2 14" });
      S.innerHair = h("circle", { cx: CX, cy: RING_CY, r: R - 62, fill: "none", stroke: "rgba(220,194,255,0.10)", "stroke-width": "1.5" });
      // régua fantasma da barra (o scan do motor já encontra o "esqueleto" da fração)
      S.ghostBar = h("line", { x1: CX - BAR_L / 2, y1: BAR_Y, x2: CX + BAR_L / 2, y2: BAR_Y, stroke: "rgba(220,194,255,0.34)", "stroke-width": "2", "stroke-dasharray": "3 11" });
      S.track = P({ stroke: "#3a2f4c", "stroke-width": "16" });
      S.trackHi = P({ stroke: "rgba(220,194,255,0.10)", "stroke-width": "2" });
      S.barHalo = P({ stroke: "rgba(180,108,255,0.30)", "stroke-width": "20" });
      S.barCore = P({ stroke: "url(#bBarG)", "stroke-width": "5" });
      S.arcH1 = P({ stroke: "rgba(180,108,255,0.10)", "stroke-width": "52" });
      S.arcH2 = P({ stroke: "rgba(180,108,255,0.22)", "stroke-width": "30" });
      S.arc = P({ stroke: "url(#bArcG)", "stroke-width": "16" });
      S.headA = h("circle", { r: "34", fill: "url(#bTipG)" });
      S.headB = h("circle", { r: "34", fill: "url(#bTipG)" });
      S.shim = h("ellipse", { rx: "70", ry: "16", fill: "url(#bTipG)" });
      S.dot1 = h("circle", { cx: CX, cy: BAR_Y - 23, r: "7", fill: "#f3f2f8" });
      S.dot2 = h("circle", { cx: CX, cy: BAR_Y + 23, r: "7", fill: "#f3f2f8" });
      S.tipGlow = h("circle", { r: "58", fill: "url(#bTipG)" });
      S.tip = h("circle", { r: "8", fill: "#ffffff" });
      S.pulse = h("circle", { cx: CX, cy: RING_CY, r: R, fill: "none", stroke: "#dcc2ff", "stroke-width": "3" });
      // régua 0–100
      S.ticks = [];
      const tg = h("g");
      for (let i = 0; i < 100; i++) {
        const major = i % 10 === 0;
        const ln = h("line", { "stroke-linecap": "round", "stroke-width": major ? "3" : "2" });
        S.ticks.push({ el: ln, major, a: (i / 100) * Math.PI * 2, i, key: "" });
        tg.append(ln);
      }
      // sem rótulo "0": o início às 12h fica implícito (desafoga o topo)
      S.tickLabels = [25, 50, 75].map((v) => {
        const a = (v / 100) * Math.PI * 2;
        const rr = R + 86;
        const el = h("text", {
          x: (CX + rr * Math.sin(a)).toFixed(1),
          y: (RING_CY - rr * Math.cos(a) + 8).toFixed(1),
          "text-anchor": "middle",
          "font-family": "JetBrains Mono, monospace",
          "font-size": "22",
          "letter-spacing": "2",
          fill: "rgba(220,194,255,0.6)",
        });
        el.textContent = String(v);
        return { el, v };
      });
      svg.append(S.inner, S.innerHair, tg, ...S.tickLabels.map((x) => x.el), S.ghostBar, S.track, S.trackHi, S.barHalo, S.barCore,
        S.arcH1, S.arcH2, S.arc, S.pulse, S.shim, S.headA, S.headB, S.dot1, S.dot2, S.tipGlow, S.tip);
      S.svg = svg;

      // cantos de mira (HUD)
      S.brk = [0, 1, 2, 3].map(() => P({ stroke: "rgba(220,194,255,0.55)", "stroke-width": "2.5", "stroke-linecap": "square" }));
      svg.append(...S.brk);
      world.append(svg);

      // chips
      const mkChip = (top, cls, tag, lines, numCls, labHtml, seed) => {
        const bg = h("div", { class: `b-abs b-chip ${cls}`, style: { top: top + "px" } });
        const sheen = h("div", { class: "sheen" });
        bg.append(sheen);
        const tagEl = h("div", { class: "b-abs b-tag", style: { top: top + 18 + "px" } }, [
          h("span", { text: tag + " · Σ " }),
        ]);
        const tagV = h("span", { class: "v", text: "000" });
        tagEl.append(tagV);
        const edge = h("div", { class: "b-abs b-edge", style: { top: top + "px" } });
        const box = h("div", { class: "b-abs b-box", style: { top: top + "px" } });
        const text = h("div", { class: "b-text" });
        const words = [];
        lines.forEach((ln) => {
          const row = h("div");
          ln.forEach(([wd, k], j) => {
            const w = h("span", { class: "w" + (k ? " " + k : ""), text: wd });
            words.push(w);
            row.append(w);
            if (j < ln.length - 1) row.append(document.createTextNode(" "));
          });
          text.append(row);
        });
        box.append(text);
        // versão "radiografada" do texto (aparece numa faixa logo à frente do feixe)
        const xbox = h("div", { class: "b-abs b-box b-xray", style: { top: top + "px" } });
        xbox.append(text.cloneNode(true));
        const nbox = h("div", { class: "b-abs b-box", style: { top: top + "px" } });
        const glow = h("div", { class: "b-numglow" });
        const num = h("div", { class: "b-num " + numCls }, [h("span", { text: "0" })]);
        const lab = h("div", { class: "b-lab", html: labHtml });
        nbox.append(glow, num, lab);
        world.append(bg, tagEl, box, xbox, nbox, edge);
        return { top, bg, sheen, tagEl, tagV, edge, box, xbox, text, words, nbox, glow, num, numSpan: num.firstChild, lab, last: "", tagLast: "", seed };
      };
      S.num = mkChip(NUM_TOP, "num", "NUMERADOR",
        [[["clientes"], ["que"], ["compraram", "k-neon"]], [["no"], ["período"]]],
        "neon", '<div><b class="n">compraram</b></div><div>no mês</div>', 11);
      S.den = mkChip(DEN_TOP, "den", "DENOMINADOR",
        [[["clientes"], ["ativos", "k-silver"]], [["da"], ["carteira"]]],
        "silver", "<div>clientes</div><div><b>ativos</b></div>", 23);
      S.den.glow.style.background = "radial-gradient(closest-side, rgba(220,194,255,0.18), rgba(220,194,255,0))";

      // feixe de varredura
      S.sweep = h("div", { class: "b-abs b-sweep" }, [h("div", { class: "trail" }), h("div", { class: "fore" }), h("div", { class: "halo" }), h("div", { class: "core" })]);
      world.append(S.sweep);

      // linha do resultado: "÷", rótulos pequenos e o "=" que aponta para o anel
      S.rowDiv = h("div", { class: "b-abs b-rowsym", text: "÷", style: { left: ROW.div + "px" } });
      S.rowLab420 = h("div", { class: "b-abs b-rowlab n", text: "compraram", style: { left: ROW.r420 - ROWW / 2 + "px" } });
      S.rowLab600 = h("div", { class: "b-abs b-rowlab s", text: "ativos", style: { left: ROW.r600 - ROWW / 2 + "px" } });
      world.append(S.rowDiv, S.rowLab420, S.rowLab600);

      // 70%
      S.pct = h("div", { class: "b-abs b-pct" }, [(S.pctN = h("span", { class: "n", text: "0" })), h("span", { class: "p", text: "%" })]);
      S.pctLab = h("div", { class: "b-abs b-pctlab", text: "de positivação" });
      world.append(S.pct, S.pctLab);

      // HUD inferior
      S.hud1 = h("div", { class: "b-abs b-hud", style: { top: "1252px", color: "rgba(220,194,255,0.5)" }, html: "Σ COMPRARAM ÷ Σ ATIVOS" });
      S.hud2 = h("div", { class: "b-abs b-hud", style: { top: "1446px" }, html: '<span class="d"></span>LEITURA CONCLUÍDA' });
      world.append(S.hud1, S.hud2);

      // carimbo EXEMPLO (no canto superior direito, com respiro do eyebrow, do título e do cromo)
      S.stamp = h("div", { class: "b-abs b-stamp", text: "EXEMPLO" });
      S.stampRing = h("div", { class: "b-abs b-stamp-ring" });
      root.append(S.stampRing, S.stamp);
      S.stampCx = 852;
      S.stampCy = 372;
      S.lastPct = "";
    },

    update(t, ctx) {
      const { inOut, enterState, exitState, tw, ease, set, lerp, prog, clamp, spring, noise, hash } = SAIB.fx;
      const S = ctx.state;
      const C = T.collapse;

      // medidas de layout (memoização idempotente, uma vez)
      if (!S.stampW) {
        S.stampW = S.stamp.offsetWidth;
        S.stampH = S.stamp.offsetHeight;
        S.stamp.style.left = S.stampCx - S.stampW / 2 + "px";
        S.stamp.style.top = S.stampCy - S.stampH / 2 + "px";
        Object.assign(S.stampRing.style, {
          left: S.stampCx - S.stampW / 2 - 4 + "px", top: S.stampCy - S.stampH / 2 - 4 + "px",
          width: S.stampW + 8 + "px", height: S.stampH + 8 + "px",
        });
        // centro natural do glifo "=" na linha do título
        S.eqX = S.eqG.offsetLeft + S.eqG.offsetWidth / 2;
        S.eqY = 436 + S.eqG.offsetTop + S.eqG.offsetHeight / 2;
      }

      // ---------- vida: push-in lento na leitura da fórmula, volta no colapso; push-in final
      const pushA = 0.022 * ease.inOutQuad(prog(t, 1.6, 4.5)) * (1 - ease.inOutCubic(prog(t, C - 0.1, C + 0.9)));
      const pushB = lerp(1, 1.018, ease.inOutQuad(prog(t, T.settle - 0.3, ctx.dur + 0.45)));
      // transform 2D (sem translate3d): o mundo não vira camada composta, então o Chrome
      // rasteriza na escala exata de cada quadro (determinístico em qualquer ordem de seek)
      S.world.style.transformOrigin = `${CX}px 940px`;
      S.world.style.transform = `translate(${(noise(t * 0.35, 3) * 3).toFixed(2)}px, ${(noise(t * 0.3, 7) * 4).toFixed(2)}px) scale(${((1 + pushA) * pushB).toFixed(5)})`;

      const bendP = ease.inOutCubic(prog(t, T.bend, T.bend + T.bendDur));
      const pp = ease.inOutCubic(prog(t, T.prog, T.prog + T.progDur));
      // paralaxe sutil entre planos durante a leitura (some antes do colapso, sem saltos)
      const parM = prog(t, 1.0, 1.8) * (1 - prog(t, C - 0.35, C));

      // ---------- glows locais
      set(S.glowA, {
        opacity: 0.9 * tw(t, -0.3, 1.4, ease.outCubic) * (1 - tw(t, C, 0.9, ease.inOutQuad)) * (0.85 + 0.15 * Math.sin(t * 1.7)),
      });
      set(S.glowB, {
        opacity: tw(t, T.bend + 0.1, 1.2, ease.outCubic) * (0.55 + 0.45 * pp) * (0.88 + 0.12 * Math.sin(t * 2.1 + 1)),
        scale: lerp(0.85, 1, tw(t, T.bend - 0.2, 1.6, ease.outCubic)),
      });

      // ---------- eyebrow (caracteres "decodificando")
      {
        const st = enterState(t, T.eyebrow, { y: 26, blur: 8, dur: 0.7 });
        set(S.eyebrow, { y: st.y, opacity: st.opacity, blur: st.blur });
        S.ebChars.forEach((c, i) => {
          const a = T.eyebrow + 0.12 + i * 0.045;
          set(c, { opacity: prog(t, a, a + 0.12), y: lerp(10, 0, tw(t, a, 0.35)) });
        });
        const lp = tw(t, T.eyebrow + 0.1, 0.8, ease.outCubic);
        set(S.ebL, { sx: lp, sy: 1, origin: "100% 50%" });
        set(S.ebR, { sx: lp, sy: 1, origin: "0% 50%" });
        set(S.ebDot, { scale: spring(t - T.eyebrow - 0.05, { freq: 2.4, damping: 0.5 }), opacity: 0.7 + 0.3 * Math.sin(t * 3.2) });
      }

      // ---------- título por letra (contra-movimento lento); sai no colapso
      {
        const counter = -0.8 * clamp(t - 1.6, 0, C - 1.6);
        set(S.title, { y: counter * (1 - prog(t, C, C + 0.3)) });
        S.titleChars.forEach((c, i) => {
          const a = T.title + i * 0.04;
          const st = enterState(t, a, { y: 64, blur: 14, dur: 0.8 });
          // sai antes de os números chegarem na linha (nada atravessa o título)
          const ex = exitState(t, C - 0.15 + i * 0.01, { y: -46, blur: 12, dur: 0.35 });
          set(c, { y: st.y + ex.y, opacity: st.opacity * ex.opacity, blur: st.blur + ex.blur });
        });
      }

      // ---------- "=" do título: entra como última letra; no colapso desce para baixo da conta
      {
        const a = T.title + S.titleChars.length * 0.04 + 0.04;
        const st = enterState(t, a, { y: 64, blur: 14, dur: 0.8, scale: 0.7 });
        // desce primeiro (pela direita, por baixo da linha) e depois desliza até o eixo do "÷"
        const mv = ease.inOutQuart(prog(t, C + 0.05, C + 0.95));
        const mvy = ease.inOutCubic(prog(t, C - 0.05, C + 0.55));
        const mvx = ease.inOutCubic(prog(t, C + 0.25, C + 0.95));
        const dx = (CX - S.eqX) * mvx;
        const dy = (EQ_Y - S.eqY) * mvy;
        const glowK = 0.55 + 0.25 * Math.sin(t * 2.3);
        set(S.eqG, {
          x: dx, y: st.y + dy, scale: st.scale * lerp(1, 0.62, mv),
          opacity: st.opacity, blur: st.blur + 6 * Math.sin(Math.PI * mv),
          origin: "50% 55%",
        });
        S.eqG.style.textShadow = `0 0 ${(18 + 10 * glowK).toFixed(1)}px rgba(180,108,255,${(0.35 + 0.3 * glowK).toFixed(3)})`;
      }

      // ---------- cantos de mira: caixa da fórmula -> caixa do anel (dentro da régua)
      {
        const bp = ease.inOutQuart(prog(t, T.bend - 0.1, T.bend + T.bendDur + 0.1));
        const BR = 372;
        const x0 = lerp(96, CX - BR, bp), x1 = lerp(984, CX + BR, bp);
        const y0 = lerp(NUM_TOP - 24, RING_CY - BR, bp), y1 = lerp(DEN_TOP + CHIP.h + 24, RING_CY + BR, bp);
        const ap = tw(t, T.brackets, 0.9, ease.outQuart);
        const arm = 46 * ap;
        const grow = lerp(26, 0, ap);
        const X0 = x0 - grow, X1 = x1 + grow, Y0 = y0 - grow, Y1 = y1 + grow;
        const ds = [
          `M${X0} ${Y0 + arm}L${X0} ${Y0}L${X0 + arm} ${Y0}`,
          `M${X1 - arm} ${Y0}L${X1} ${Y0}L${X1} ${Y0 + arm}`,
          `M${X1} ${Y1 - arm}L${X1} ${Y1}L${X1 - arm} ${Y1}`,
          `M${X0 + arm} ${Y1}L${X0} ${Y1}L${X0} ${Y1 - arm}`,
        ];
        const op = prog(t, T.brackets, T.brackets + 0.3) * (0.75 + 0.25 * Math.sin(t * 2.4));
        S.brk.forEach((p, i) => {
          p.setAttribute("d", ap > 0.001 ? ds[i] : "M0 0");
          p.style.opacity = op.toFixed(3);
        });
      }

      // ---------- chips (B1: texto) -> (B2: números)
      const sweepP = ease.inOutCubic(prog(t, T.sweep, T.sweep + T.sweepDur));
      const sweepX = lerp(CHIP.x - 30, CHIP.x + CHIP.w + 30, sweepP);
      const sweepOn = t > T.sweep - 0.05 && t < T.sweep + T.sweepDur + 0.12;
      const sweepVis = clamp(Math.sin(Math.PI * clamp(prog(t, T.sweep - 0.05, T.sweep + T.sweepDur + 0.1))) * 1.3);
      set(S.sweep, { x: sweepX, opacity: sweepVis, display: sweepOn ? "block" : "none" });
      const cut = clamp(sweepX - CHIP.x, 0, CHIP.w);
      const XB = 72; // faixa radiografada à frente do feixe

      const chip = (c, inAt, countAt, target, rowRight, rowDy, sheen2, toBar) => {
        const par = noise(t * 0.4, c.seed) * 5 * parM;
        // fundo de vidro: esqueleto fantasma sob o scan, depois vidro pleno
        const ghost = 0.32 * prog(t, inAt - 0.5, inAt - 0.2);
        const st = enterState(t, inAt, { y: 0, blur: 0, dur: 0.85 });
        const drift = tw(t, inAt - 0.5, 1.4, ease.outCubic);
        // colapso: o vidro achata em direção à barra e "vira" a barra
        const cp0 = ease.inCubic(prog(t, C, C + 0.35));
        const cOp = 1 - prog(t, C + 0.18, C + 0.4);
        set(c.bg, {
          y: lerp(40, 0, drift) + par + toBar * 46 * cp0,
          opacity: Math.max(ghost, st.opacity) * cOp,
          scale: lerp(0.95, 1, drift),
          sx: lerp(1, 0.97, cp0), sy: lerp(1, 0.04, cp0),
          origin: toBar > 0 ? "50% 100%" : "50% 0%",
        });
        // brilho no vidro: 1º passe na entrada, 2º passe na leitura
        const sx = t < sheen2
          ? lerp(-260, CHIP.w + 60, tw(t, inAt + 0.35, 1.1, ease.inOutCubic))
          : lerp(-260, CHIP.w + 60, tw(t, sheen2, 0.9, ease.inOutCubic));
        set(c.sheen, { x: sx });
        // tag HUD (decorativa): dígitos rodam até o feixe passar, então travam no valor
        {
          const tst = enterState(t, inAt + 0.25, { y: 10, blur: 6, dur: 0.6 });
          const tex = exitState(t, C - 0.1, { y: -10, blur: 6, dur: 0.25 });
          set(c.tagEl, { y: tst.y + tex.y + par, opacity: tst.opacity * tex.opacity, blur: tst.blur + tex.blur });
          const locked = cut > 400;
          const s = locked ? String(target) : rollDigits(t, c.seed);
          if (c.tagLast !== s) {
            c.tagV.textContent = s;
            c.tagLast = s;
          }
          c.tagV.style.color = locked ? "rgba(220,194,255,0.75)" : "";
        }
        // palavras
        c.words.forEach((w, i) => {
          const a = inAt + 0.1 + i * 0.06;
          const s2 = enterState(t, a, { y: 40, blur: 12, dur: 0.75 });
          set(w, { y: s2.y, opacity: s2.opacity, blur: s2.blur });
        });
        set(c.box, { y: par });
        set(c.xbox, { y: par });
        set(c.nbox, { y: par });
        // recorte pelo feixe: [0,cut) número · [cut,cut+XB) texto radiografado · [cut+XB,…) texto
        const txtOn = cut + XB < CHIP.w - 0.5;
        c.box.style.display = txtOn ? "block" : "none";
        c.box.style.clipPath = cut > 0.5 ? `inset(-40px -40px -40px ${(cut + XB).toFixed(1)}px)` : "none";
        const xOn = cut > 0.5 && cut < CHIP.w - 0.5;
        c.xbox.style.display = xOn ? "block" : "none";
        if (xOn) {
          c.xbox.style.clipPath = `inset(-40px ${Math.max(0, CHIP.w - cut - XB).toFixed(1)}px -40px ${cut.toFixed(1)}px)`;
          c.xbox.style.opacity = (0.75 * sweepVis).toFixed(3);
        }
        // borda do vidro acende onde o feixe passa
        const eOn = sweepOn && cut > 0.5;
        c.edge.style.display = eOn ? "block" : "none";
        if (eOn) {
          set(c.edge, { y: par, opacity: sweepVis });
          c.edge.style.clipPath = `inset(-40px ${Math.max(-40, CHIP.w - cut - 14).toFixed(1)}px -40px ${Math.max(-40, cut - 130).toFixed(1)}px)`;
        }
        const numOn = cut > 0.5;
        c.nbox.style.display = numOn ? "block" : "none";
        if (!numOn) return;
        c.nbox.style.clipPath = cut < CHIP.w - 0.5 ? `inset(-60px ${(CHIP.w - cut).toFixed(1)}px -60px -60px)` : "none";
        // contagem (com 2–3 quadros de dígitos embaralhados no início)
        const cp = ease.outQuart(prog(t, countAt, countAt + T.countDur));
        let s;
        if (t >= countAt && t < countAt + 0.07) s = String(Math.floor(hash(Math.floor(t * 60) * 3 + c.seed) * (target - 100)) + 100);
        else s = String(Math.round(target * cp));
        if (c.last !== s) {
          c.numSpan.textContent = s;
          c.last = s;
        }
        const done = prog(t, countAt + T.countDur - 0.25, countAt + T.countDur + 0.35);
        const flash = Math.sin(Math.PI * done);
        // voo para a linha do resultado: levanta rápido (y) e desliza (x)
        // trajetória quase reta: 420 e 600 abrem distância em x enquanto sobem (nunca se cruzam)
        const my = ease.inOutCubic(prog(t, C, C + 0.65));
        const mx = ease.inOutCubic(prog(t, C + 0.02, C + 0.7));
        const ms = ease.inOutCubic(prog(t, C, C + 0.7));
        const rightNow = CHIP.x + NUMBOX.left + NUMBOX.w;
        set(c.num, {
          x: (rowRight - rightNow) * mx,
          y: (rowDy - par) * my + lerp(18, 0, tw(t, T.sweep, 0.7)),
          scale: lerp(1, NUM_SCALE, ms),
        });
        // brilho de "conta fechou": drop-shadow lilás (sem brightness sobre o gradiente roxo)
        c.num.style.filter = flash > 0.01
          ? `drop-shadow(0 0 ${(28 * flash).toFixed(1)}px rgba(220,194,255,${(0.75 * flash).toFixed(3)}))`
          : "none";
        const ex = tw(t, C, 0.4, ease.inCubic);
        set(c.glow, { opacity: (0.35 + 0.65 * flash) * (1 - ex), scale: 0.9 + 0.2 * flash });
        // rótulo: acompanha o número no início do voo e se dissolve (renasce sob a linha)
        const ls = enterState(t, T.sweep + 0.4, { y: 0, x: -24, blur: 8, dur: 0.6 });
        const le = tw(t, C, 0.32, ease.inCubic);
        set(c.lab, {
          x: ls.x + (rowRight - rightNow) * mx * 0.6,
          y: (rowDy - par) * my * 0.8,
          opacity: ls.opacity * (1 - le), blur: ls.blur + 10 * le,
        });
      };
      chip(S.num, T.numChip, T.count420, 420, ROW.r420, ROW_Y - (NUM_TOP + CHIP.h / 2), 2.9, 1);
      chip(S.den, T.denChip, T.count600, 600, ROW.r600, ROW_Y - (DEN_TOP + CHIP.h / 2), 3.15, -1);

      // ---------- barra da fração -> anel
      const g = geom(bendP);
      {
        const dp = ease.inOutCubic(prog(t, T.bar, T.bar + T.barDur));
        const half = (g.L / 2) * (bendP > 0 ? 1 : dp);
        const n = bendP > 0 && bendP < 1 ? 140 : 90;
        const d = pathD(g, -half, half, n);
        S.barHalo.setAttribute("d", d);
        S.barCore.setAttribute("d", d);
        S.track.setAttribute("d", d);
        S.trackHi.setAttribute("d", d);
        // o anel nasce ainda luminoso e só depois esfria para a trilha dim
        const cool = 1 - tw(t, T.bend + T.bendDur - 0.15, 0.6, ease.inOutQuad);
        const bright = lerp(1, 0.4, bendP) * cool;
        const breathe = 0.85 + 0.15 * Math.sin(t * 2.2);
        S.barHalo.style.opacity = (bright * breathe * prog(t, T.bar, T.bar + 0.2)).toFixed(3);
        S.barCore.style.opacity = (bright * prog(t, T.bar, T.bar + 0.1)).toFixed(3);
        S.track.style.opacity = (0.9 * bendP).toFixed(3);
        S.track.setAttribute("stroke-width", lerp(5, 16, bendP).toFixed(2));
        S.trackHi.style.opacity = bendP.toFixed(3);
        // régua fantasma (antes da barra desenhar)
        S.ghostBar.style.opacity = (prog(t, -0.3, 0.0) * (1 - prog(t, T.bar + 0.2, T.bar + 0.7))).toFixed(3);
        // cabeças de luz enquanto desenha
        const hOn = Math.sin(Math.PI * prog(t, T.bar, T.bar + T.barDur + 0.25));
        if (hOn > 0.01 && bendP === 0) {
          const [ax, ay] = g.pt(-half), [bx, by] = g.pt(half);
          S.headA.setAttribute("cx", ax.toFixed(1)); S.headA.setAttribute("cy", ay.toFixed(1));
          S.headB.setAttribute("cx", bx.toFixed(1)); S.headB.setAttribute("cy", by.toFixed(1));
          S.headA.style.opacity = S.headB.style.opacity = hOn.toFixed(3);
          S.headA.style.display = S.headB.style.display = "";
        } else {
          S.headA.style.display = S.headB.style.display = "none";
        }
        // brilho que percorre a barra durante a leitura (movimento secundário)
        const sp = prog(t, 2.3, 3.5);
        if (sp > 0 && sp < 1 && bendP === 0) {
          const sx = lerp(-BAR_L / 2 + 30, BAR_L / 2 - 30, ease.inOutCubic(sp));
          S.shim.style.display = "";
          S.shim.setAttribute("cx", (CX + sx).toFixed(1));
          S.shim.setAttribute("cy", String(BAR_Y));
          S.shim.style.opacity = (0.85 * Math.sin(Math.PI * sp)).toFixed(3);
        } else S.shim.style.display = "none";
        // pontos do ÷ (respiram durante a leitura)
        const d1 = spring(t - T.dots, { freq: 2.6, damping: 0.48 });
        const d2 = spring(t - T.dots - 0.08, { freq: 2.6, damping: 0.48 });
        const dOut = 1 - tw(t, C, 0.3, ease.inCubic);
        const br = 1 + (0.07 + 0.07 * Math.sin(t * 2.6)) * prog(t, T.dots + 0.6, T.dots + 1.0);
        S.dot1.setAttribute("r", Math.max(0, 7 * br * d1 * dOut).toFixed(2));
        S.dot2.setAttribute("r", Math.max(0, 7 * br * d2 * dOut).toFixed(2));
        S.dot1.setAttribute("cy", (BAR_Y - 23 - 8 * (1 - dOut)).toFixed(1));
        S.dot2.setAttribute("cy", (BAR_Y + 23 + 8 * (1 - dOut)).toFixed(1));
      }

      // ---------- "÷" e rótulos da linha
      {
        const st = enterState(t, C + 0.45, { y: 30, blur: 10, dur: 0.6 });
        set(S.rowDiv, { y: st.y, opacity: st.opacity, blur: st.blur });
        const l1 = enterState(t, C + 0.62, { y: 18, blur: 8, dur: 0.6 });
        const l2 = enterState(t, C + 0.7, { y: 18, blur: 8, dur: 0.6 });
        set(S.rowLab420, { y: l1.y, opacity: l1.opacity, blur: l1.blur });
        set(S.rowLab600, { y: l2.y, opacity: l2.opacity, blur: l2.blur });
      }

      // ---------- régua 0–100 (memoiza o estado de cada marca: só toca o DOM quando muda)
      S.ticks.forEach((k) => {
        const a = T.ticks + (k.i / 100) * 0.7;
        const p = tw(t, a, 0.5, ease.outCubic);
        if (p <= 0.001) {
          if (k.key !== "off") {
            k.el.style.display = "none";
            k.key = "off";
          }
          return;
        }
        const lit = pp > 0 && k.i / 100 <= 0.7 * pp;
        const key = p.toFixed(3) + (lit ? "L" : "d");
        if (k.key === key) return;
        k.key = key;
        k.el.style.display = "";
        const r0 = R + (k.major ? 26 : 30);
        const r1 = R + (k.major ? 52 : 40);
        const rr0 = lerp(r1 + 20, r0, p), rr1 = lerp(r1 + 20, r1, p);
        const sn = Math.sin(k.a), cs = Math.cos(k.a);
        k.el.setAttribute("x1", (CX + rr0 * sn).toFixed(1));
        k.el.setAttribute("y1", (RING_CY - rr0 * cs).toFixed(1));
        k.el.setAttribute("x2", (CX + rr1 * sn).toFixed(1));
        k.el.setAttribute("y2", (RING_CY - rr1 * cs).toFixed(1));
        k.el.setAttribute("stroke", lit ? (k.major ? "#f3e9ff" : "#c48bff") : k.major ? "rgba(220,194,255,0.42)" : "rgba(220,194,255,0.2)");
        k.el.style.opacity = p.toFixed(3);
      });
      S.tickLabels.forEach((L, i) => {
        const p = tw(t, T.ticks + 0.2 + i * 0.12, 0.5, ease.outCubic);
        L.el.style.opacity = p.toFixed(3);
        L.el.setAttribute("fill", L.v / 100 <= 0.7 * pp && pp > 0 ? "rgba(243,233,255,0.9)" : "rgba(220,194,255,0.5)");
      });
      {
        const ip = tw(t, T.bend + 0.4, 0.9, ease.outCubic);
        S.inner.style.opacity = (0.9 * ip).toFixed(3);
        S.innerHair.style.opacity = ip.toFixed(3);
        S.inner.setAttribute("transform", `rotate(${(t * 6).toFixed(2)} ${CX} ${RING_CY})`);
      }

      // ---------- arco de progresso 0 -> 70%
      {
        const frac = 0.7 * pp;
        const Sx = frac * g.L;
        if (Sx < 0.5) {
          S.arc.setAttribute("d", "M0 0");
          S.arcH1.setAttribute("d", "M0 0");
          S.arcH2.setAttribute("d", "M0 0");
          S.tip.style.display = S.tipGlow.style.display = "none";
        } else {
          const closed = bendP > 0.999;
          const n = Math.max(4, Math.ceil(140 * (Sx / g.L)));
          let d = "";
          for (let i = 0; i <= n; i++) {
            let s = (Sx * i) / n;
            if (s > g.L / 2) s = closed ? s - g.L : g.L / 2;
            const [x, y] = g.pt(s);
            d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
          }
          S.arc.setAttribute("d", d);
          S.arcH1.setAttribute("d", d);
          S.arcH2.setAttribute("d", d);
          let se = Sx;
          if (se > g.L / 2) se = closed ? se - g.L : g.L / 2;
          const [tx, ty] = g.pt(se);
          S.tip.style.display = S.tipGlow.style.display = "";
          S.tip.setAttribute("cx", tx.toFixed(1)); S.tip.setAttribute("cy", ty.toFixed(1));
          S.tipGlow.setAttribute("cx", tx.toFixed(1)); S.tipGlow.setAttribute("cy", ty.toFixed(1));
          const settle = prog(t, T.settle - 0.1, T.settle + 0.5);
          const breath = 0.8 + 0.2 * Math.sin(t * 3.4);
          S.tipGlow.setAttribute("r", (lerp(64, 50, settle) * (settle > 0 ? breath : 1)).toFixed(1));
          const hb = 0.85 + 0.15 * Math.sin(t * 2.6 + 0.5);
          S.arcH1.style.opacity = hb.toFixed(3);
          S.arcH2.style.opacity = hb.toFixed(3);
        }
        // pulso ao assentar
        const pu = prog(t, T.settle - 0.05, T.settle + 0.85);
        if (pu > 0 && pu < 1) {
          S.pulse.style.display = "";
          S.pulse.setAttribute("r", (R + ease.outCubic(pu) * 120).toFixed(1));
          S.pulse.style.opacity = (0.75 * Math.pow(1 - pu, 1.6)).toFixed(3);
          S.pulse.setAttribute("stroke-width", lerp(6, 1, pu).toFixed(2));
        } else S.pulse.style.display = "none";
      }

      // ---------- 70%
      {
        const st = enterState(t, T.pct, { y: 40, blur: 16, dur: 0.8, scale: 0.86 });
        // nunca mostra 1 dígito (o grupo não "pula"): começa em 10 ainda sob o desfoque da entrada
        const v = String(Math.max(10, Math.round(70 * pp)));
        if (S.lastPct !== v) {
          S.pctN.textContent = v;
          S.lastPct = v;
        }
        const hit = Math.sin(Math.PI * prog(t, T.settle - 0.08, T.settle + 0.5));
        set(S.pct, {
          y: st.y,
          opacity: st.opacity,
          scale: st.scale * (1 + 0.05 * hit),
          origin: "50% 60%",
        });
        const f = [];
        if (st.blur > 0.05) f.push(`blur(${st.blur.toFixed(2)}px)`);
        if (hit > 0.01) f.push(`drop-shadow(0 0 ${(34 * hit).toFixed(1)}px rgba(220,194,255,${(0.6 * hit).toFixed(3)}))`);
        S.pct.style.filter = f.length ? f.join(" ") : "none";
        inOut(S.pctLab, t, T.label, null, { y: 30, blur: 10, dur: 0.7 });
      }

      // ---------- HUD
      {
        const a = enterState(t, T.hud1, { y: 16, blur: 6, dur: 0.7 });
        const b = exitState(t, C - 0.1, { y: -20, blur: 8, dur: 0.3 });
        set(S.hud1, { y: a.y + b.y, opacity: a.opacity * b.opacity, blur: a.blur + b.blur });
        const c = enterState(t, T.settle + 0.15, { y: 16, blur: 6, dur: 0.7 });
        set(S.hud2, { y: c.y, opacity: c.opacity });
      }

      // ---------- carimbo EXEMPLO
      {
        const a = T.stamp;
        const fall = prog(t, a - 0.17, a);
        let sc, rot, op, blur, sh;
        if (t < a) {
          const f = ease.inQuad(fall);
          sc = lerp(1.6, 0.94, f);
          rot = lerp(-17, -7, f);
          op = clamp(fall * 2.2);
          blur = lerp(6, 0, f);
          sh = lerp(1, 0, f);
        } else {
          const sp = spring(t - a, { freq: 3.2, damping: 0.45 });
          sc = 0.94 + 0.06 * sp;
          rot = -7 + 0.8 * (1 - sp);
          op = 1;
          blur = 0;
          sh = 0;
        }
        // transform 2D (sem camada composta): rasterização exata em qualquer ordem de seek
        set(S.stamp, { opacity: op, blur, origin: "50% 50%" });
        S.stamp.style.transform = `rotate(${rot.toFixed(3)}deg) scale(${sc.toFixed(4)})`;
        const shadow = `0 ${lerp(6, 34, sh).toFixed(1)}px ${lerp(14, 50, sh).toFixed(1)}px rgba(0,0,0,${lerp(0.45, 0.25, sh).toFixed(2)}), 0 0 ${(22 + 18 * Math.max(0, 1 - (t - a) / 0.6)).toFixed(1)}px rgba(255,181,71,${(0.18 + 0.3 * Math.max(0, 1 - Math.abs(t - a) / 0.5)).toFixed(3)})`;
        S.stamp.style.boxShadow = shadow;
        const rp = prog(t, a, a + 0.55);
        if (rp > 0 && rp < 1) {
          S.stampRing.style.display = "";
          set(S.stampRing, { opacity: 0.6 * Math.pow(1 - rp, 2), origin: "50% 50%" });
          S.stampRing.style.transform = `rotate(-7deg) scale(${lerp(1, 1.3, ease.outCubic(rp)).toFixed(4)})`;
        } else S.stampRing.style.display = "none";
      }
    },
  });
})();
