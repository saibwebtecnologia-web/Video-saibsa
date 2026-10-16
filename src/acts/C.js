/*
 * ATO C — "Abra o número" · 20,0–29,4 s (dur 9,4)
 *
 * Coreografia (tempos locais, s):
 *  C1 · POR VENDEDOR
 *  -0.30  eyebrow "ABRA O NÚMERO" decodifica (o scan do motor já revela em movimento)
 *  -0.25  "Por vendedor" entra por letra (stagger 35 ms) · legível em ~0.6
 *  -0.12  cartões de vidro A/B sobem · conteúdo (avatar, nome, %) já entra sob o scan (-0.02 / 0.08)
 *   0.30  linha ÚNICA da média 70 % desenha de cima a baixo atravessando os dois cartões · "MÉDIA 70%" decodifica
 *   0.38  barras crescem (A→85 % neon, B→55 % âmbar), percentuais contam
 *   0.55  "A conversa com cada um muda." por palavra · legível em ~1.25, parada até 3.88
 *   0.80  selo "EXEMPLO" carimba
 *   1.35  balões: digitando… → ícone (A ↗ crescer · B ? entender)
 *   1.70  A passa da média: clarão neon 70→85 % + "+15 p.p."
 *   1.95  B abaixo da média: hachura âmbar abre 55→70 % + "−15 p.p."
 *   2.70  brilho de vidro inclinado cruza os cartões · 3.20 pulso de luz desce pela linha da média
 *  C1 → C2 (transformação, sem corte)
 *   3.95  cartões "deitam" no plano do mapa (rotX 0→60°, B 0.07 s depois); 0.1 s depois as barras se soltam
 *         e as duas pontas convergem para o CD (cauda atrasada) — viram cometas de luz neon/âmbar
 *   4.10  "vendedor" sai letra a letra no lugar · 4.36 "rota" entra · câmera pousa (66°→47°)
 *   4.50  impacto neon no CD: mola + onda de choque + anel de radar fino revela os quarteirões
 *   4.62  impacto âmbar: a energia do Vendedor B sai pela Rota 3
 *  C2 · POR ROTA
 *   4.56–5.44  quatro rotas se desenham a partir do CD; rótulos "Rota N · xx%" contam ao chegar
 *   5.22  "Rota que positiva pouco / pode ser:" por palavra · 5.44 Rota 3 entra em alerta, fio desce do nó
 *   5.90 / 6.27 / 6.64  três motivos; cada um dispara uma faísca que sobe pelo fio, corre a Rota 3 de volta
 *         e acende "sua" parada fantasma (flash + anel), 0.7 s depois
 *   7.60  selo "EXEMPLO" (prata) carimba ao lado de "pode ser:" · 8.10 brilho percorre os motivos
 *   até 9.85  composição final viva: pacotes de luz, pulso âmbar, deriva lenta da câmera
 */
(function () {
  const W = 1080;
  const CX = 540;

  // ---------- geometria C1
  const CARD = { x: 120, w: 840, h: 224 };
  const CARD_TOP = [656, 924];
  const BAR = { x: 36, w: 768, top: 154, h: 18 };
  const MEDIA = 0.7;
  const BR0 = { x0: 94, y0: 628, x1: 986, y1: 1176 }; // cantos de mira (cartões)
  const AVG_X = CARD.x + BAR.x + BAR.w * MEDIA; // linha única da média (≈ 693.6)
  const AVG_Y = [636, 1168];

  // ---------- geometria C2
  const BR1 = { x0: 52, y0: 592, x1: 1028, y1: 1046 }; // cantos de mira (mapa)
  const PILL_L = 180; // borda esquerda da frase e dos callouts
  const PH2_TOP = 1064;
  const CO_TOP = [1212, 1300, 1388];
  const CO_H = 76;
  const GX = 90, GY = 80; // passo das ruas no plano
  const MAP = { x0: -540, x1: 540, y0: -320, y1: 240 };
  const RMAX = 540; // raio do radar no plano

  const T = {
    eyebrow: -0.3,
    title: -0.25,
    card: [-0.12, 0.0],
    avatar: [-0.02, 0.08],
    avg: 0.3,
    bar: [0.38, 0.5],
    barDur: [1.3, 1.15],
    seal: 0.8,
    ph1: 0.55,
    bubble: [1.35, 1.55],
    typing: 0.75,
    plusA: 1.7,
    gapB: 1.95,
    settle: 2.7,
    avgPulse: 3.2,
    ph1Out: 3.88,
    // C1 -> C2 (cartões deitam no plano do mapa, barras voam para o CD)
    out: 3.95,
    detach: 0.1,
    fly: [0.45, 0.5],
    swap: 4.1,
    rota: 4.36,
    mapIn: 4.0,
    hub: 4.5,
    radar: 4.5,
    // C2
    ph2: 5.22,
    alert: 5.44,
    bus: 5.44,
    co: [5.9, 6.27, 6.64],
    spark: 0.2,
    sparkDur: 0.5,
    reseal: 7.6,
    coSheen: 8.1,
  };

  // rotas no plano (ruas = múltiplos de GX/GY). 0,0 = CD
  const ROUTES = [
    { name: "Rota 1", pct: 82, tone: "neon", at: 4.56, dur: 0.76,
      pts: [[0, 0], [180, 0], [180, -80], [270, -80], [270, -240], [360, -240]],
      lit: [1, 1, 1, 0, 1], lab: { dx: 0, dy: -44, align: "c" } },
    { name: "Rota 2", pct: 74, tone: "neon", at: 4.68, dur: 0.78,
      pts: [[0, 0], [0, -80], [-90, -80], [-90, -160], [-180, -160], [-180, -240], [-360, -240]],
      lit: [1, 0, 1, 1, 0], lab: { dx: 0, dy: -52, align: "c" } },
    { name: "Rota 4", pct: 77, tone: "neon", at: 4.76, dur: 0.76,
      pts: [[0, 0], [0, 80], [90, 80], [90, 160], [270, 160], [270, 80], [360, 80], [360, 160]],
      lit: [1, 1, 0, 1, 1, 1], lab: { dx: 0, dy: 46, align: "c" } },
    // último trecho vertical: libera o lado direito do nó de alerta para o rótulo
    { name: "Rota 3", pct: 48, tone: "amber", at: 4.62, dur: 0.82,
      pts: [[0, 0], [-90, 0], [-90, 80], [-180, 80], [-180, 160], [-270, 160], [-360, 160], [-360, 240]],
      lit: [1, 0, 1, 0, 1, 0], lab: { dx: 34, dy: 0, align: "l" } },
  ];
  // paradas fantasma da Rota 3 (lit = 0) que acendem quando cada motivo chega
  const R3_FLASH = [2, 4, 6];

  const css = `
[data-act="C"] .c-world { position:absolute; inset:0; width:${W}px; height:1920px; }
[data-act="C"] .c-abs { position:absolute; }
[data-act="C"] .c-eyebrow { left:0; width:${W}px; top:386px; display:flex; justify-content:center; align-items:center; gap:22px;
  font-family:var(--font-mono); font-weight:600; font-size:30px; letter-spacing:0.32em; color:var(--lilac); }
[data-act="C"] .c-eyebrow .ln { width:36px; height:2px; background:linear-gradient(90deg, rgba(220,194,255,0), rgba(220,194,255,0.7)); }
[data-act="C"] .c-eyebrow .ln.r { background:linear-gradient(90deg, rgba(220,194,255,0.7), rgba(220,194,255,0)); }
[data-act="C"] .c-eyebrow .dot { width:10px; height:10px; border-radius:50%; background:var(--neon); box-shadow:0 0 12px 3px rgba(180,108,255,0.8); }
[data-act="C"] .c-eyebrow .tx { padding-left:0.32em; white-space:nowrap; }
[data-act="C"] .c-title { left:0; top:430px; height:140px; font-size:124px; white-space:nowrap; }
[data-act="C"] .c-title .tw { position:absolute; left:0; top:0; white-space:nowrap; }
[data-act="C"] .c-title .fx-char { background:linear-gradient(180deg, #ffffff 0%, #e9e7f2 42%, #a9a6b8 100%);
  -webkit-background-clip:text; background-clip:text; color:transparent; padding:0 0.01em; }

/* cartões */
[data-act="C"] .c-card { left:${CARD.x}px; width:${CARD.w}px; height:${CARD.h}px; border-radius:32px;
  background:linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.028));
  border:1.5px solid rgba(255,255,255,0.13);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 30px 60px -20px rgba(0,0,0,0.55); overflow:hidden; }
[data-act="C"] .c-card.neon { border-color:rgba(180,108,255,0.42);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 0 44px -8px rgba(139,43,217,0.5), 0 30px 60px -20px rgba(0,0,0,0.55); }
[data-act="C"] .c-card.amber { border-color:rgba(255,181,71,0.26);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 0 40px -12px rgba(255,160,60,0.30), 0 30px 60px -20px rgba(0,0,0,0.55); }
[data-act="C"] .c-card .sheen { position:absolute; top:-40px; left:0; width:320px; height:${CARD.h + 80}px;
  background:linear-gradient(90deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0) 80%); }
[data-act="C"] .c-av { position:absolute; left:36px; top:30px; width:96px; height:96px; border-radius:50%;
  display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:800; font-size:46px; color:#fff; }
[data-act="C"] .c-av.neon { background:radial-gradient(circle at 35% 30%, #c48bff 0%, #8b2bd9 55%, #4a0f78 100%);
  box-shadow: 0 0 0 2px rgba(220,194,255,0.55), 0 0 30px rgba(180,108,255,0.55); }
[data-act="C"] .c-av.amber { background:radial-gradient(circle at 35% 30%, #ffd08a 0%, #ff9b45 55%, #8a3d10 100%);
  box-shadow: 0 0 0 2px rgba(255,214,150,0.55), 0 0 28px rgba(255,170,70,0.45); color:#2a0d00; }
[data-act="C"] svg.c-avring { position:absolute; left:20px; top:14px; width:128px; height:128px; overflow:visible; }
[data-act="C"] .c-name { position:absolute; left:160px; top:34px; font-family:var(--font-text); font-weight:600; font-size:46px;
  color:var(--silver-1); letter-spacing:-0.01em; white-space:nowrap; }
[data-act="C"] .c-sub { position:absolute; left:162px; top:96px; font-family:var(--font-mono); font-size:28px; letter-spacing:0.2em;
  color:rgba(220,194,255,0.72); white-space:nowrap; }
[data-act="C"] .c-pct { position:absolute; right:36px; top:16px; height:120px; display:flex; align-items:baseline; justify-content:flex-end;
  font-family:var(--font-display); font-weight:800; line-height:120px; white-space:nowrap; }
[data-act="C"] .c-pct .n { font-size:108px; letter-spacing:-0.02em; font-variant-numeric:tabular-nums; display:inline-block; min-width:1.2em; text-align:right;
  background:linear-gradient(180deg, #ffffff 0%, #ecebf4 40%, #a9a6b8 100%); -webkit-background-clip:text; background-clip:text; color:transparent; }
[data-act="C"] .c-pct .p { font-size:56px; margin-left:4px; display:inline-block; }
[data-act="C"] .c-pct.neon .p { background:linear-gradient(180deg, #f1e4ff 0%, #c48bff 50%, #9a45f0 100%); -webkit-background-clip:text; background-clip:text; color:transparent; }
[data-act="C"] .c-pct.amber .p { background:linear-gradient(180deg, #ffe2b0 0%, #ffb547 55%, #ff8a3d 100%); -webkit-background-clip:text; background-clip:text; color:transparent; }
[data-act="C"] .c-track { position:absolute; left:${BAR.x}px; top:${BAR.top}px; width:${BAR.w}px; height:${BAR.h}px; border-radius:${BAR.h / 2}px;
  background:rgba(255,255,255,0.06); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08); }
[data-act="C"] .c-fill { position:absolute; left:0; top:0; width:100%; height:100%; border-radius:${BAR.h / 2}px; }
[data-act="C"] .c-fill.neon { background:linear-gradient(90deg, #5a1496 0%, #8b2bd9 35%, #b46cff 75%, #ecdcff 100%);
  box-shadow: 0 0 18px rgba(180,108,255,0.65); }
[data-act="C"] .c-fill.amber { background:linear-gradient(90deg, #7a3510 0%, #c8642a 30%, #ff9b45 70%, #ffd38f 100%);
  box-shadow: 0 0 16px rgba(255,160,60,0.5); }
[data-act="C"] .c-head { position:absolute; top:${BAR.top + BAR.h / 2 - 26}px; left:0; width:52px; height:52px; border-radius:50%; margin-left:-26px; }
[data-act="C"] .c-head.neon { background:radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(220,194,255,0.6) 30%, rgba(180,108,255,0.18) 65%, rgba(180,108,255,0)); }
[data-act="C"] .c-head.amber { background:radial-gradient(closest-side, rgba(255,250,235,0.95), rgba(255,214,150,0.6) 30%, rgba(255,181,71,0.18) 65%, rgba(255,181,71,0)); }
/* linha única da média (atravessa os dois cartões) */
[data-act="C"] .c-avg { left:${AVG_X - 1}px; top:${AVG_Y[0]}px; width:2px; height:${AVG_Y[1] - AVG_Y[0]}px; border-radius:1px;
  background:linear-gradient(180deg, rgba(243,242,248,0.25), #f3f2f8 8%, #f3f2f8 92%, rgba(243,242,248,0.25));
  box-shadow:0 0 12px rgba(255,255,255,0.6); transform-origin:50% 0; }
[data-act="C"] .c-avgpk { left:${AVG_X - 7}px; top:${AVG_Y[0]}px; width:14px; height:90px; border-radius:7px;
  background:linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.95) 70%, rgba(255,255,255,0));
  box-shadow:0 0 18px rgba(220,194,255,0.8); }
[data-act="C"] .c-avglab { left:0; top:${AVG_Y[1] + 8}px; height:36px; font-family:var(--font-mono); font-weight:600; font-size:26px;
  letter-spacing:0.2em; color:rgba(230,214,255,0.88); white-space:nowrap; line-height:36px; text-shadow:0 0 12px rgba(180,108,255,0.5); }
[data-act="C"] .c-avglab .fx-c { display:inline-block; width:0.62em; text-align:center; margin-right:0.2em; }
[data-act="C"] .c-avglab .fx-c.sp { width:0.3em; }
/* diferença para a média */
[data-act="C"] .c-gap { position:absolute; left:${BAR.w * 0.55}px; top:0; width:${BAR.w * 0.15}px; height:100%; border-radius:0 ${BAR.h / 2}px ${BAR.h / 2}px 0;
  background:repeating-linear-gradient(45deg, rgba(255,181,71,0.42) 0 4px, rgba(255,181,71,0) 4px 10px);
  box-shadow: inset 0 0 0 1.5px rgba(255,181,71,0.55); }
[data-act="C"] .c-over { position:absolute; left:${BAR.w * 0.7}px; top:-3px; width:${BAR.w * 0.15}px; height:${BAR.h + 6}px; border-radius:${BAR.h}px;
  background:linear-gradient(90deg, rgba(255,255,255,0.0), rgba(255,255,255,0.85) 60%, rgba(236,220,255,0.95));
  box-shadow:0 0 26px 4px rgba(196,139,255,0.85); }
[data-act="C"] .c-tag { position:absolute; top:${BAR.top + BAR.h + 6}px; height:36px; line-height:36px; font-family:var(--font-mono); font-weight:600;
  font-size:26px; letter-spacing:0.08em; white-space:nowrap; }
[data-act="C"] .c-tag.neon { color:#e2c8ff; text-shadow:0 0 14px rgba(180,108,255,0.85); }
[data-act="C"] .c-tag.amber { color:#ffc067; text-shadow:0 0 14px rgba(255,170,60,0.55); }
/* barras que se soltam e voam para o CD */
[data-act="C"] .c-streak { left:0; top:0; height:${BAR.h}px; border-radius:${BAR.h / 2}px; transform-origin:50% 50%; }
[data-act="C"] .c-streak.neon { background:linear-gradient(90deg, #5a1496 0%, #8b2bd9 35%, #b46cff 75%, #ecdcff 100%); box-shadow: 0 0 22px rgba(180,108,255,0.8); }
[data-act="C"] .c-streak.amber { background:linear-gradient(90deg, #7a3510 0%, #c8642a 30%, #ff9b45 70%, #ffd38f 100%); box-shadow: 0 0 20px rgba(255,160,60,0.7); }

/* balões */
[data-act="C"] .c-bub { width:112px; height:62px; border-radius:24px; background:#2a1142; transform-origin:12px 62px; }
[data-act="C"] .c-bub.neon { border:2px solid rgba(196,139,255,0.9); box-shadow:0 0 22px rgba(180,108,255,0.45), 0 12px 24px rgba(0,0,0,0.4); }
[data-act="C"] .c-bub.amber { border:2px solid rgba(255,181,71,0.9); box-shadow:0 0 22px rgba(255,160,60,0.35), 0 12px 24px rgba(0,0,0,0.4); }
[data-act="C"] .c-bub .tail { position:absolute; left:10px; bottom:-11px; width:20px; height:20px; background:#2a1142; transform:rotate(45deg) skew(8deg, 8deg); }
[data-act="C"] .c-bub.neon .tail { border-right:2px solid rgba(196,139,255,0.9); border-bottom:2px solid rgba(196,139,255,0.9); }
[data-act="C"] .c-bub.amber .tail { border-right:2px solid rgba(255,181,71,0.9); border-bottom:2px solid rgba(255,181,71,0.9); }
[data-act="C"] .c-bub .dots { position:absolute; left:0; top:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; gap:10px; }
[data-act="C"] .c-bub .dots i { width:11px; height:11px; border-radius:50%; background:#f3f2f8; display:block; }
[data-act="C"] .c-bub .ico { position:absolute; left:0; top:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; }
[data-act="C"] .c-bub .q { font-family:var(--font-display); font-weight:800; font-size:44px; line-height:1; color:#ffc46e; text-shadow:0 0 14px rgba(255,181,71,0.6); }

/* selo */
[data-act="C"] .c-seal { left:0; top:0; padding:8px 14px 8px 18px; border:2px solid var(--amber); border-radius:9px;
  font-family:var(--font-mono); font-weight:600; font-size:26px; letter-spacing:0.24em; color:var(--amber);
  background:rgba(255,181,71,0.07); white-space:nowrap; text-shadow:0 0 12px rgba(255,181,71,0.45); }
[data-act="C"] .c-seal.silver { border-color:#c8c6d4; color:var(--silver-1); background:rgba(255,255,255,0.05);
  text-shadow:0 0 12px rgba(220,194,255,0.45); }

/* frases */
[data-act="C"] .c-ph1 { left:0; width:${W}px; top:1240px; text-align:center; font-family:var(--font-text); font-weight:600; font-size:54px;
  color:var(--silver-1); letter-spacing:-0.012em; white-space:nowrap; }
[data-act="C"] .c-ph1 .w, [data-act="C"] .c-ph2 .w { display:inline-block; white-space:nowrap; }
[data-act="C"] .k-neon { color:#d2abff; font-weight:800; text-shadow:0 0 22px rgba(180,108,255,0.65); }
[data-act="C"] .k-amber { color:#ffc067; font-weight:800; text-shadow:0 0 20px rgba(255,170,60,0.45); }
[data-act="C"] .c-ph2 { left:${PILL_L}px; top:${PH2_TOP}px; font-family:var(--font-text); font-weight:600; font-size:56px; line-height:1.1;
  color:var(--silver-1); letter-spacing:-0.012em; white-space:nowrap; }

/* callouts */
[data-act="C"] .c-co { left:${PILL_L}px; height:${CO_H}px; display:flex; align-items:center; gap:16px; padding:0 24px 0 18px; border-radius:20px;
  background:linear-gradient(90deg, rgba(255,181,71,0.12), rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.035));
  border:1.5px solid rgba(255,181,71,0.34); box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 40px -18px rgba(0,0,0,0.6);
  white-space:nowrap; overflow:hidden; }
[data-act="C"] .c-co .ix { font-family:var(--font-mono); font-weight:600; font-size:24px; letter-spacing:0.12em; color:var(--amber); opacity:0.9; }
[data-act="C"] .c-co .tx { font-family:var(--font-text); font-weight:500; font-size:44px; color:#ffffff; letter-spacing:-0.005em; }
[data-act="C"] .c-co .tx .w { display:inline-block; }
[data-act="C"] .c-co .sh { position:absolute; top:-20px; left:0; width:240px; height:${CO_H + 40}px;
  background:linear-gradient(90deg, rgba(255,230,190,0) 20%, rgba(255,230,190,0.14) 50%, rgba(255,230,190,0) 80%); }

/* rótulos das rotas */
[data-act="C"] .c-lab { left:0; top:0; height:54px; display:flex; align-items:center; gap:12px; padding:0 20px; border-radius:27px;
  background:rgba(22,8,38,0.82); border:1.5px solid rgba(196,139,255,0.5); white-space:nowrap;
  box-shadow:0 10px 26px -8px rgba(0,0,0,0.6), 0 0 18px -4px rgba(180,108,255,0.45); }
[data-act="C"] .c-lab.amber { background:rgba(22,8,30,0.92); border-color:rgba(255,181,71,0.85); box-shadow:0 10px 26px -8px rgba(0,0,0,0.6), 0 0 22px -2px rgba(255,170,60,0.5); }
[data-act="C"] .c-lab .rn { font-family:var(--font-text); font-weight:600; font-size:30px; color:var(--silver-1); }
[data-act="C"] .c-lab .sp { font-family:var(--font-text); font-weight:600; font-size:30px; color:var(--muted); }
[data-act="C"] .c-lab .rp { font-family:var(--font-display); font-weight:800; font-size:34px; font-variant-numeric:tabular-nums; color:#d2abff;
  display:inline-block; min-width:2.05em; text-align:right; }
[data-act="C"] .c-lab.amber .rp { color:#ffc067; }
[data-act="C"] .c-hublab { font-family:var(--font-mono); font-weight:600; font-size:22px; letter-spacing:0.22em; color:rgba(243,233,255,0.85);
  white-space:nowrap; }
[data-act="C"] .c-hud { font-family:var(--font-mono); font-size:22px; letter-spacing:0.24em; color:rgba(220,194,255,0.55); white-space:nowrap; }
[data-act="C"] svg.c-svg { position:absolute; left:0; top:0; width:${W}px; height:1920px; overflow:visible; }
[data-act="C"] .c-glow { border-radius:50%; }
`;

  // ---------- helpers geométricos (plano do mapa)
  function cumul(pts) {
    const c = [0];
    for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return c;
  }
  function pointAt(pts, cum, d) {
    const L = cum[cum.length - 1];
    if (d <= 0) return pts[0];
    if (d >= L) return pts[pts.length - 1];
    let i = 1;
    while (cum[i] < d) i++;
    const f = (d - cum[i - 1]) / (cum[i] - cum[i - 1]);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f];
  }
  function subPts(pts, cum, a, b) {
    const L = cum[cum.length - 1];
    a = Math.max(0, a);
    b = Math.min(L, b);
    if (b - a < 0.5) return null;
    const out = [pointAt(pts, cum, a)];
    for (let i = 1; i < pts.length - 1; i++) if (cum[i] > a && cum[i] < b) out.push(pts[i]);
    out.push(pointAt(pts, cum, b));
    return out;
  }
  // inversa de inOutCubic (para saber quando a cabeça da rota passa por uma parada)
  const invIOC = (y) => (y < 0.5 ? Math.cbrt(y / 4) : 1 - Math.cbrt(2 * (1 - y)) / 2);
  const smooth = (a, b, v) => {
    const x = Math.min(1, Math.max(0, (v - a) / (b - a)));
    return x * x * (3 - 2 * x);
  };

  SAIB.act("C", {
    css,
    build(root, ctx) {
      const { h, split, rng } = SAIB.fx;
      const S = ctx.state;
      const world = (S.world = h("div", { class: "c-world" }));
      root.append(world);

      // ---- brilhos locais
      S.glowCards = h("div", {
        class: "c-abs c-glow",
        style: { left: CX - 560 + "px", top: 880 - 520 + "px", width: "1120px", height: "1040px",
          background: "radial-gradient(closest-side, rgba(139,43,217,0.22), rgba(139,43,217,0.07) 55%, rgba(139,43,217,0))" },
      });
      S.glowMap = h("div", {
        class: "c-abs c-glow",
        style: { left: CX - 520 + "px", top: 800 - 380 + "px", width: "1040px", height: "760px",
          background: "radial-gradient(closest-side, rgba(150,70,240,0.26), rgba(139,43,217,0.08) 55%, rgba(139,43,217,0))" },
      });
      S.glowAmber = h("div", {
        class: "c-abs c-glow",
        style: { left: "0px", top: "0px", width: "420px", height: "420px", marginLeft: "-210px", marginTop: "-210px",
          background: "radial-gradient(closest-side, rgba(255,160,60,0.30), rgba(255,140,50,0.08) 55%, rgba(255,140,50,0))" },
      });
      world.append(S.glowCards, S.glowMap, S.glowAmber);

      // ---- eyebrow
      S.eyebrow = h("div", { class: "c-abs c-eyebrow" }, [
        (S.ebL = h("span", { class: "ln" })),
        (S.ebDot = h("span", { class: "dot" })),
        (S.ebTx = h("span", { class: "tx", text: "ABRA O NÚMERO" })),
        (S.ebR = h("span", { class: "ln r" })),
      ]);
      S.ebChars = split(S.ebTx).chars;
      world.append(S.eyebrow);

      // ---- título com troca de palavra: "Por vendedor" -> "Por rota"
      S.title = h("div", { class: "c-abs c-title display" });
      S.tPor = h("span", { class: "tw", text: "Por" });
      S.tV = h("span", { class: "tw", text: "vendedor" });
      S.tR = h("span", { class: "tw", text: "rota" });
      S.title.append(S.tPor, S.tV, S.tR);
      S.porChars = split(S.tPor).chars;
      S.vChars = split(S.tV).chars;
      S.rChars = split(S.tR).chars;
      world.append(S.title);

      // ---- SVG principal (mapa, cantos de mira, fio dos callouts)
      const svg = (S.svg = h("svg", { class: "c-svg", viewBox: `0 0 ${W} 1920` }));
      const defs = h("defs", {}, [
        h("radialGradient", { id: "cGlowN" }, [
          h("stop", { offset: "0", "stop-color": "#ffffff", "stop-opacity": "0.9" }),
          h("stop", { offset: "0.25", "stop-color": "#dcc2ff", "stop-opacity": "0.6" }),
          h("stop", { offset: "0.6", "stop-color": "#b46cff", "stop-opacity": "0.2" }),
          h("stop", { offset: "1", "stop-color": "#b46cff", "stop-opacity": "0" }),
        ]),
        h("radialGradient", { id: "cGlowA" }, [
          h("stop", { offset: "0", "stop-color": "#fff6e6", "stop-opacity": "0.95" }),
          h("stop", { offset: "0.25", "stop-color": "#ffd08a", "stop-opacity": "0.6" }),
          h("stop", { offset: "0.6", "stop-color": "#ffb547", "stop-opacity": "0.2" }),
          h("stop", { offset: "1", "stop-color": "#ffb547", "stop-opacity": "0" }),
        ]),
        h("radialGradient", { id: "cRadarFade", gradientUnits: "userSpaceOnUse", cx: "540", cy: "822", r: "560",
          gradientTransform: "translate(540 822) scale(1 0.54) translate(-540 -822)" }, [
          h("stop", { offset: "0", "stop-color": "#e6d6ff", "stop-opacity": "1" }),
          h("stop", { offset: "0.6", "stop-color": "#dcc2ff", "stop-opacity": "1" }),
          h("stop", { offset: "1", "stop-color": "#dcc2ff", "stop-opacity": "0" }),
        ]),
        h("linearGradient", { id: "cRouteN", x1: "0", y1: "0", x2: "1", y2: "0" }, [
          h("stop", { offset: "0", "stop-color": "#9a45f0" }),
          h("stop", { offset: "1", "stop-color": "#e6d2ff" }),
        ]),
      ]);
      svg.append(defs);
      const P = (attrs) => h("path", Object.assign({ fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, attrs));

      // quarteirões
      const R = rng(20251);
      S.blocks = [];
      const gBlocks = h("g");
      for (let x = MAP.x0; x < MAP.x1; x += GX) {
        for (let y = MAP.y0; y < MAP.y1; y += GY) {
          const cx = x + GX / 2, cy = y + GY / 2;
          const r = R();
          const kind = r < 0.1 ? 2 : r < 0.3 ? 1 : 0; // 2 = praça (pontilhado), 1 = destaque, 0 = normal
          const el = h("polygon", {
            fill: kind === 1 ? "rgba(180,108,255,0.10)" : kind === 2 ? "rgba(220,194,255,0.02)" : "rgba(220,194,255,0.045)",
            stroke: kind === 1 ? "rgba(196,139,255,0.30)" : "rgba(220,194,255,0.16)",
            "stroke-width": "1.2",
            "stroke-dasharray": kind === 2 ? "3 6" : "none",
            "stroke-linejoin": "round",
          });
          const dist = Math.hypot(cx, cy * 1.25);
          // radar: o anel passa pelo quarteirão quando ease(p)=dist/RMAX
          const p = 1 - Math.cbrt(Math.max(0, 1 - Math.min(1, dist / RMAX)));
          S.blocks.push({ el, cx, cy, at: T.radar + 0.02 + 1.15 * p, jit: R() * 0.12 });
          gBlocks.append(el);
        }
      }
      svg.append(gBlocks);

      // anel de radar
      S.radar = P({ stroke: "url(#cRadarFade)", "stroke-width": "1.5" });
      S.radar2 = P({ stroke: "url(#cRadarFade)", "stroke-width": "1.2" });
      svg.append(S.radar2, S.radar);

      // rotas
      S.routes = ROUTES.map((r) => {
        const cum = cumul(r.pts);
        const L = cum[cum.length - 1];
        const amber = r.tone === "amber";
        const o = {
          ...r, cum, L, amber,
          track: P({ stroke: "rgba(220,194,255,0.16)", "stroke-width": "3", "stroke-dasharray": "2 9" }),
          halo: P({ stroke: amber ? "rgba(255,170,60,0.22)" : "rgba(180,108,255,0.22)", "stroke-width": "18" }),
          core: P({ stroke: amber ? "#ffb547" : "#c48bff", "stroke-width": "5" }),
          hot: P({ stroke: amber ? "#fff1d6" : "#f3e9ff", "stroke-width": "2" }),
          pk: P({ stroke: amber ? "#fff3dc" : "#ffffff", "stroke-width": "5" }),
          pkG: P({ stroke: amber ? "rgba(255,190,100,0.5)" : "rgba(210,170,255,0.5)", "stroke-width": "16" }),
          head: h("circle", { r: "30", fill: amber ? "url(#cGlowA)" : "url(#cGlowN)" }),
          stops: [],
        };
        for (let i = 1; i < r.pts.length; i++) {
          const isEnd = i === r.pts.length - 1;
          const lit = !isEnd ? !!r.lit[i - 1] : amber ? false : true;
          const s = {
            i, d: cum[i], lit, isEnd,
            glow: h("circle", { r: "20", fill: amber && !lit ? "url(#cGlowA)" : "url(#cGlowN)" }),
            core: h("circle", { r: "7" }),
            ring: amber && !lit && !isEnd ? h("circle", { r: "8", fill: "none", stroke: "#ffc46e", "stroke-width": "2", style: "display:none" }) : null,
          };
          o.stops.push(s);
        }
        return o;
      });
      // ordem de pintura: trilhas, halos, núcleos, pacotes, paradas
      S.routes.forEach((o) => svg.append(o.track));
      S.routes.forEach((o) => svg.append(o.halo, o.pkG));
      S.routes.forEach((o) => svg.append(o.core, o.hot, o.pk));
      S.routes.forEach((o) => o.stops.forEach((s) => svg.append(s.glow, s.core)));
      S.routes.forEach((o) => o.stops.forEach((s) => s.ring && svg.append(s.ring)));
      S.routes.forEach((o) => svg.append(o.head));

      // CD (hub)
      S.hubRing = h("circle", { r: "26", fill: "none", stroke: "rgba(220,194,255,0.8)", "stroke-width": "2" });
      S.hubPulse = h("circle", { r: "26", fill: "none", stroke: "#dcc2ff", "stroke-width": "2" });
      S.hubGlow = h("circle", { r: "54", fill: "url(#cGlowN)" });
      S.hub = h("rect", { width: "26", height: "26", rx: "5", fill: "#f3e9ff" });
      S.hubShock = ["#e6d2ff", "#ffc46e"].map((c) => h("circle", { r: "20", fill: "none", stroke: c, "stroke-width": "3" }));
      svg.append(S.hubGlow, S.hubPulse, ...S.hubShock, S.hubRing, S.hub);

      // nó final da Rota 3 (alerta)
      S.alertP1 = h("circle", { r: "14", fill: "none", stroke: "#ffb547", "stroke-width": "2.5" });
      S.alertP2 = h("circle", { r: "14", fill: "none", stroke: "#ffb547", "stroke-width": "2.5" });
      S.alertGlow = h("circle", { r: "46", fill: "url(#cGlowA)" });
      S.alertNode = h("circle", { r: "11", fill: "#1a0d22", stroke: "#ffb547", "stroke-width": "4" });
      S.alertDot = h("circle", { r: "4.5", fill: "#ffd08a" });
      svg.append(S.alertGlow, S.alertP1, S.alertP2, S.alertNode, S.alertDot);

      // fio dos callouts
      S.busG = P({ stroke: "rgba(255,170,60,0.22)", "stroke-width": "10" });
      S.bus = P({ stroke: "#ffb547", "stroke-width": "2.5" });
      S.branches = CO_TOP.map(() => ({
        line: P({ stroke: "#ffb547", "stroke-width": "2.5" }),
        dot: h("circle", { r: "6", fill: "#ffb547" }),
        ring: h("circle", { r: "6", fill: "none", stroke: "#ffb547", "stroke-width": "2" }),
      }));
      svg.append(S.busG, S.bus);
      S.branches.forEach((b) => svg.append(b.line, b.ring, b.dot));
      // faíscas: motivo -> fio -> nó -> parada fantasma
      S.sparks = CO_TOP.map(() => ({
        g: P({ stroke: "rgba(255,190,100,0.55)", "stroke-width": "14" }),
        c: P({ stroke: "#fff3dc", "stroke-width": "4" }),
      }));
      S.sparks.forEach((k) => svg.append(k.g, k.c));

      // cantos de mira
      S.brk = [0, 1, 2, 3].map(() => P({ stroke: "rgba(220,194,255,0.55)", "stroke-width": "2.5", "stroke-linecap": "square" }));
      svg.append(...S.brk);
      world.append(svg);

      // ---- rótulos das rotas (HTML, "outdoor" sobre o mapa)
      S.labs = S.routes.map((o) => {
        const el = h("div", { class: `c-abs c-lab ${o.amber ? "amber" : ""}` }, [
          h("span", { class: "rn", text: o.name }),
          h("span", { class: "sp", text: "·" }),
          h("span", { class: "rp", text: "0%" }),
        ]);
        world.append(el);
        return { el, rp: el.lastChild, last: "" };
      });
      S.hubLab = h("div", { class: "c-abs c-hublab", text: "CD" });
      world.append(S.hubLab);

      // ---- cartões de vendedor
      const mkCard = (id, top, pct, tone) => {
        const card = h("div", { class: `c-abs c-card ${tone}`, style: { top: top + "px" } });
        const sheen = h("div", { class: "sheen" });
        const ring = h("svg", { class: "c-avring", viewBox: "0 0 128 128" });
        const ringC = h("circle", { cx: "64", cy: "64", r: "60", fill: "none", stroke: tone === "neon" ? "rgba(220,194,255,0.55)" : "rgba(255,214,150,0.5)",
          "stroke-width": "2", "stroke-dasharray": "3 9", "stroke-linecap": "round" });
        ring.append(ringC);
        const av = h("div", { class: `c-av ${tone}`, text: id });
        const name = h("div", { class: "c-name", text: `Vendedor ${id}` });
        const sub = h("div", { class: "c-sub", text: "POSITIVAÇÃO" });
        const pn = h("span", { class: "n", text: "0" });
        const pctEl = h("div", { class: `c-pct ${tone}` }, [pn, h("span", { class: "p", text: "%" })]);
        const fill = h("div", { class: `c-fill ${tone}` });
        const track = h("div", { class: "c-track" }, [fill]);
        const head = h("div", { class: `c-head ${tone}` });
        // diferença para a média: B ganha hachura âmbar 55→70 %, A um clarão neon 70→85 %
        const diff = h("div", { class: tone === "amber" ? "c-gap" : "c-over" });
        track.append(diff);
        const gapCx = BAR.x + BAR.w * (tone === "amber" ? 0.625 : 0.775);
        const tag = h("div", { class: `c-tag ${tone}`, text: tone === "amber" ? "−15 p.p." : "+15 p.p." });
        card.append(sheen, track, head, ring, av, name, sub, pctEl, tag);
        world.append(card);
        return { id, top, pct, tone, card, sheen, ring, ringC, av, name, sub, pctEl, pn, fill, head, diff, tag, gapCx, last: "" };
      };
      S.cards = [mkCard("A", CARD_TOP[0], 85, "neon"), mkCard("B", CARD_TOP[1], 55, "amber")];

      // ---- linha única da média + leitura
      S.avg = h("div", { class: "c-abs c-avg" });
      S.avgPk = h("div", { class: "c-abs c-avgpk" });
      S.avgLab = h("div", { class: "c-abs c-avglab" });
      S.avgChars = [];
      for (const ch of "MÉDIA 70%") {
        const c = h("span", { class: "fx-c" + (ch === " " ? " sp" : ""), text: ch === " " ? "\u00a0" : ch });
        c.dataset.ch = ch;
        S.avgLab.append(c);
        S.avgChars.push(c);
      }
      world.append(S.avg, S.avgPk, S.avgLab);

      // ---- barras que se soltam (transição para o mapa)
      S.streaks = S.cards.map((c) => {
        const el = h("div", { class: `c-abs c-streak ${c.tone}`, style: { width: BAR.w * c.pct / 100 + "px" } });
        world.append(el);
        return el;
      });

      // ---- balões de conversa
      const mkBub = (tone, top) => {
        const dots = h("div", { class: "dots" }, [h("i"), h("i"), h("i")]);
        let ico;
        if (tone === "neon") {
          const s = h("svg", { width: "46", height: "46", viewBox: "0 0 46 46" });
          s.append(
            h("path", { d: "M6 34 L17 22 L25 29 L39 13", fill: "none", stroke: "#e6d2ff", "stroke-width": "4.5", "stroke-linecap": "round", "stroke-linejoin": "round" }),
            h("path", { d: "M29 12 H40 V23", fill: "none", stroke: "#e6d2ff", "stroke-width": "4.5", "stroke-linecap": "round", "stroke-linejoin": "round" })
          );
          ico = h("div", { class: "ico" }, [s]);
        } else {
          ico = h("div", { class: "ico" }, [h("span", { class: "q", text: "?" })]);
        }
        const el = h("div", { class: `c-abs c-bub ${tone}`, style: { left: "176px", top: top - 44 + "px" } }, [h("div", { class: "tail" }), dots, ico]);
        world.append(el);
        return { el, dots: [...dots.children], ico };
      };
      S.bubs = [mkBub("neon", CARD_TOP[0]), mkBub("amber", CARD_TOP[1])];

      // ---- frase C1
      const mkWords = (host, spec) => {
        const words = [];
        spec.forEach((line, li) => {
          const row = h("div");
          line.forEach(([wd, k], j) => {
            const w = h("span", { class: "w" + (k ? " " + k : ""), text: wd });
            words.push(w);
            row.append(w);
            if (j < line.length - 1) row.append(document.createTextNode(" "));
          });
          host.append(row);
        });
        return words;
      };
      S.ph1 = h("div", { class: "c-abs c-ph1" });
      S.ph1Words = mkWords(S.ph1, [[["A"], ["conversa"], ["com"], ["cada", "k-neon"], ["um", "k-neon"], ["muda."]]]);
      world.append(S.ph1);

      // ---- frase C2 + callouts
      S.ph2 = h("div", { class: "c-abs c-ph2" });
      S.ph2Words = mkWords(S.ph2, [[["Rota"], ["que"], ["positiva"], ["pouco", "k-amber"]], [["pode"], ["ser:"]]]);
      world.append(S.ph2);
      S.cos = ["dia de visita errado", "mix curto", "cliente que trocou de fornecedor"].map((txt, i) => {
        const tx = h("span", { class: "tx" });
        const words = txt.split(" ").map((w, j, arr) => {
          const s = h("span", { class: "w", text: w });
          tx.append(s);
          if (j < arr.length - 1) tx.append(document.createTextNode(" "));
          return s;
        });
        const sh = h("div", { class: "sh" });
        const el = h("div", { class: "c-abs c-co", style: { top: CO_TOP[i] + "px" } }, [sh, h("span", { class: "ix", text: "0" + (i + 1) }), tx]);
        world.append(el);
        return { el, words, sh };
      });

      // ---- selo EXEMPLO
      S.seal = h("div", { class: "c-abs c-seal", text: "EXEMPLO" });
      world.append(S.seal);
    },

    update(t, ctx) {
      const { enterState, exitState, tw, ease, set, lerp, prog, clamp, spring, noise } = SAIB.fx;
      const S = ctx.state;
      const dur = ctx.dur;

      // ---------- medidas (uma vez; layout independe de t)
      if (!S.meas) {
        S.wPor = S.tPor.offsetWidth;
        S.wV = S.tV.offsetWidth;
        S.wR = S.tR.offsetWidth;
        S.gap = 30;
        S.sealW = S.seal.offsetWidth;
        S.sealH = S.seal.offsetHeight;
        S.labs.forEach((L) => {
          L.w = L.el.offsetWidth;
          L.h = L.el.offsetHeight;
        });
        S.hubLabW = S.hubLab.offsetWidth;
        S.avgW = S.avgLab.offsetWidth;
        S.cards.forEach((c) => (c.tagW = c.tag.offsetWidth));
        S.meas = true;
      }

      // ---------- vida: deriva sutil do mundo
      set(S.world, { x: noise(t * 0.33, 11) * 3, y: noise(t * 0.29, 5) * 4 });

      const OUT = T.out;
      const mapLand = ease.signature(prog(t, T.mapIn, T.mapIn + 1.35));

      // ---------- glows
      set(S.glowCards, {
        opacity: 0.95 * tw(t, -0.2, 1.4, ease.outCubic) * (1 - tw(t, OUT, 0.8, ease.inOutQuad)) * (0.86 + 0.14 * Math.sin(t * 1.6)),
      });
      set(S.glowMap, {
        opacity: tw(t, T.mapIn, 1.2, ease.outCubic) * (0.85 + 0.15 * Math.sin(t * 1.9 + 1)),
        scale: lerp(0.8, 1, mapLand),
      });

      // ---------- eyebrow
      {
        const st = enterState(t, T.eyebrow, { y: 26, blur: 8, dur: 0.7 });
        set(S.eyebrow, { y: st.y, opacity: st.opacity, blur: st.blur });
        S.ebChars.forEach((c, i) => {
          const a = T.eyebrow + 0.1 + i * 0.04;
          set(c, { opacity: prog(t, a, a + 0.12), y: lerp(10, 0, tw(t, a, 0.35)) });
        });
        const lp = tw(t, T.eyebrow + 0.1, 0.8, ease.outCubic);
        set(S.ebL, { sx: lp, sy: 1, origin: "100% 50%" });
        set(S.ebR, { sx: lp, sy: 1, origin: "0% 50%" });
        set(S.ebDot, { scale: spring(t - T.eyebrow - 0.05, { freq: 2.4, damping: 0.5 }), opacity: 0.7 + 0.3 * Math.sin(t * 3.2) });
      }

      // ---------- título: "Por vendedor" -> "Por rota"
      {
        const sw = ease.inOutCubic(prog(t, T.swap + 0.05, T.swap + 0.8));
        const totA = S.wPor + S.gap + S.wV, totB = S.wPor + S.gap + S.wR;
        const x0 = CX - lerp(totA, totB, sw) / 2;
        set(S.tPor, { x: x0 });
        // "vendedor" sai no lugar em que estava (não desliza junto com o recentramento)
        set(S.tV, { x: CX - totA / 2 + S.wPor + S.gap });
        set(S.tR, { x: x0 + S.wPor + S.gap });
        S.porChars.forEach((c, i) => {
          const st = enterState(t, T.title + i * 0.035, { y: 64, blur: 14, dur: 0.8 });
          set(c, { y: st.y, opacity: st.opacity, blur: st.blur });
        });
        S.vChars.forEach((c, i) => {
          const st = enterState(t, T.title + (i + 3) * 0.035, { y: 64, blur: 14, dur: 0.8 });
          const ex = exitState(t, T.swap + i * 0.018, { y: -46, blur: 12, dur: 0.36 });
          set(c, { y: st.y + ex.y, opacity: st.opacity * ex.opacity, blur: st.blur + ex.blur });
        });
        S.rChars.forEach((c, i) => {
          const st = enterState(t, T.rota + i * 0.045, { y: 64, blur: 14, dur: 0.8 });
          set(c, { y: st.y, opacity: st.opacity, blur: st.blur });
        });
      }

      // ---------- cartões
      S.cards.forEach((c, k) => {
        const inAt = T.card[k];
        const st = enterState(t, inAt, { y: 60, blur: 0, dur: 0.9, scale: 0.95 });
        const bob = noise(t * 0.5 + k * 7, 21 + k) * 2.5;
        // saída: o cartão "deita" no plano do mapa (mesma inclinação da câmera)
        const la = OUT + k * 0.07;
        const ld = ease.inOutCubic(prog(t, la, la + 0.55));
        const gone = t > la + 0.58;
        c.card.style.display = gone ? "none" : "block";
        if (gone) return;
        const cy = st.y + bob + 60 * ld;
        const csc = st.scale * lerp(1, 0.88, ld);
        c.card.style.transformOrigin = "50% 100%";
        c.card.style.transform = `translate3d(0px, ${cy.toFixed(2)}px, 0px) perspective(1300px) rotateX(${(60 * ld).toFixed(2)}deg) scale(${csc.toFixed(4)})`;
        set(c.card, { opacity: st.opacity * (1 - ease.inQuad(ld)), blur: 3 * ld });
        // avatar
        const ap = spring(t - T.avatar[k], { freq: 2.3, damping: 0.52 });
        set(c.av, { scale: Math.max(0, ap), opacity: prog(t, T.avatar[k], T.avatar[k] + 0.12) });
        set(c.ring, { rot: t * 22 * (k ? -1 : 1), scale: lerp(0.6, 1, tw(t, T.avatar[k] + 0.05, 0.7)), opacity: 0.9 * prog(t, T.avatar[k] + 0.1, T.avatar[k] + 0.4), origin: "64px 64px" });
        // nome e subtítulo
        const ns = enterState(t, T.avatar[k] + 0.06, { x: -26, y: 0, blur: 10, dur: 0.7 });
        set(c.name, ns);
        const ss = enterState(t, T.avatar[k] + 0.12, { x: -20, y: 0, blur: 8, dur: 0.7 });
        set(c.sub, ss);
        // barra + contagem (a barra se solta do cartão e voa para o CD)
        const det = t >= la + T.detach;
        const bp = ease.inOutCubic(prog(t, T.bar[k], T.bar[k] + T.barDur[k]));
        const frac = (c.pct / 100) * bp;
        const wpx = BAR.w * frac;
        c.fill.style.clipPath = `inset(0 ${(BAR.w - wpx).toFixed(1)}px 0 0 round ${BAR.h / 2}px)`;
        c.fill.style.opacity = bp > 0.002 && !det ? "1" : "0";
        const v = String(Math.round(c.pct * bp));
        if (c.last !== v) {
          c.pn.textContent = v;
          c.last = v;
        }
        const ps = enterState(t, T.bar[k] - 0.3, { y: 24, blur: 10, dur: 0.7 });
        const done = prog(t, T.bar[k] + T.barDur[k] - 0.15, T.bar[k] + T.barDur[k] + 0.5);
        const flash = Math.sin(Math.PI * done);
        set(c.pctEl, { y: ps.y, opacity: ps.opacity, blur: ps.blur, brightness: 1 + 0.3 * flash, scale: 1 + 0.03 * flash, origin: "100% 60%" });
        const headOn = prog(t, T.bar[k], T.bar[k] + 0.15) * (det ? 0 : 1);
        const breathe = 0.75 + 0.25 * Math.sin(t * 3.1 + k * 1.3);
        set(c.head, { x: BAR.x + wpx, opacity: headOn * lerp(1, breathe, done > 0 ? 1 : 0), scale: lerp(1.3, 1, done) });
        // diferença para a média
        if (c.tone === "amber") {
          const gp = ease.outCubic(prog(t, T.gapB, T.gapB + 0.3));
          c.diff.style.clipPath = `inset(0 ${((1 - gp) * 100).toFixed(2)}% 0 0)`;
          c.diff.style.opacity = det || gp <= 0 ? "0" : (0.85 + 0.15 * Math.sin(t * 3.4)).toFixed(3);
          const ts = enterState(t, T.gapB + 0.12, { y: 12, blur: 6, dur: 0.6 });
          set(c.tag, { x: AVG_X - CARD.x - 18 - c.tagW, y: ts.y, opacity: ts.opacity, blur: ts.blur });
        } else {
          const fp = t - T.plusA;
          const op = fp > 0 ? Math.min(1, fp / 0.08) * (0.22 + 0.78 * Math.exp(-fp * 3)) : 0;
          c.diff.style.opacity = det ? "0" : op.toFixed(3);
          const ts = enterState(t, T.plusA + 0.05, { y: 12, blur: 6, dur: 0.6 });
          set(c.tag, { x: AVG_X - CARD.x + 18, y: ts.y, opacity: ts.opacity, blur: ts.blur });
        }
        // brilho de vidro (faixa inclinada, bordas transparentes)
        const shp = ease.inOutQuad(prog(t, T.settle + k * 0.1, T.settle + k * 0.1 + 0.7));
        set(c.sheen, { x: lerp(-380, CARD.w + 60, shp), skewX: -18, opacity: shp > 0 && shp < 1 ? 1 : 0 });
      });

      // ---------- linha única da média (atravessa os dois cartões)
      {
        const dp = ease.outQuart(prog(t, T.avg, T.avg + 0.5));
        const ex = ease.inCubic(prog(t, T.out - 0.05, T.out + 0.3));
        const vis = t > T.avg && ex < 1;
        S.avg.style.display = S.avgLab.style.display = vis ? "" : "none";
        if (vis) {
          set(S.avg, { sx: 1, sy: dp * (1 - ex), opacity: prog(t, T.avg, T.avg + 0.08), origin: ex > 0 ? "50% 100%" : "50% 0%" });
          const ls = enterState(t, T.avg + 0.25, { y: 10, blur: 6, dur: 0.6 });
          set(S.avgLab, { x: AVG_X - S.avgW / 2, y: ls.y + 10 * ex, opacity: ls.opacity * (1 - ex), blur: ls.blur + 6 * ex });
          const G = "0123456789#%/<>";
          S.avgChars.forEach((c, i) => {
            const real = c.dataset.ch;
            if (real === " ") return;
            const show = T.avg + 0.25 + i * 0.03;
            const res = T.avg + 0.42 + i * 0.05;
            let ch = real;
            if (t < res) ch = G[Math.floor(SAIB.fx.hash(Math.floor(t * 24) * 31 + i * 7) * G.length)];
            if (c.textContent !== ch) c.textContent = ch;
            c.style.opacity = (t < show ? 0 : t < res ? 0.55 : 1).toFixed(2);
          });
        }
        // pulso de luz descendo pela linha
        const pp = prog(t, T.avgPulse, T.avgPulse + 0.9);
        if (pp > 0 && pp < 1) {
          S.avgPk.style.display = "";
          const L = AVG_Y[1] - AVG_Y[0];
          set(S.avgPk, { y: lerp(-90, L, ease.inOutQuad(pp)), opacity: Math.sin(Math.PI * pp) });
          S.avgPk.style.clipPath = `inset(${Math.max(0, -lerp(-90, L, ease.inOutQuad(pp))).toFixed(1)}px 0 ${Math.max(0, lerp(-90, L, ease.inOutQuad(pp)) + 90 - L).toFixed(1)}px 0)`;
        } else S.avgPk.style.display = "none";
      }

      // ---------- balões
      S.bubs.forEach((b, k) => {
        const a = T.bubble[k];
        const sp = spring(t - a, { freq: 2.4, damping: 0.5 });
        const ex = exitState(t, OUT - 0.1 + k * 0.05, { y: -26, blur: 10, dur: 0.34 });
        const floatY = noise(t * 0.6 + k * 3, 31 + k) * 3;
        set(b.el, {
          scale: Math.max(0, sp) * ex.scale,
          y: ex.y + floatY + lerp(14, 0, clamp(sp)),
          opacity: prog(t, a, a + 0.1) * ex.opacity,
          blur: ex.blur,
          display: t < a || t > OUT + 0.5 ? "none" : "block",
        });
        if (t < a || t > OUT + 0.5) return;
        const mo = prog(t, a + T.typing, a + T.typing + 0.3); // digitando -> ícone
        b.dots.forEach((d, i) => {
          const ph = (t - a) * 6.5 - i * 0.9;
          const hop = Math.max(0, Math.sin(ph)) * 7;
          const cv = ease.inOutCubic(mo);
          set(d, { x: (1 - i) * 21 * cv, y: -hop * (1 - cv), opacity: lerp(0.55 + 0.45 * Math.max(0, Math.sin(ph)), 0, ease.inQuad(mo)), scale: lerp(1, 0.3, cv) });
        });
        const ia = a + T.typing + 0.24;
        const ip = spring(t - ia, { freq: 2.6, damping: 0.5 });
        set(b.ico, { scale: Math.max(0, ip), opacity: prog(t, ia, ia + 0.12) });
      });

      // ---------- frase C1
      S.ph1Words.forEach((w, i) => {
        const st = enterState(t, T.ph1 + i * 0.05, { y: 44, blur: 12, dur: 0.75 });
        const ex = exitState(t, T.ph1Out + i * 0.02, { y: -34, blur: 10, dur: 0.42 });
        set(w, { y: st.y + ex.y, opacity: st.opacity * ex.opacity, blur: st.blur + ex.blur });
      });

      // ---------- selo EXEMPLO (C1: acima dos cartões; sai com eles e carimba de novo ao lado dos motivos)
      {
        const stamp = (a) => {
          if (t < a) {
            const f = ease.inQuad(prog(t, a - 0.16, a));
            return { sc: lerp(1.5, 0.95, f), op: clamp(prog(t, a - 0.16, a) * 2.2), blur: lerp(5, 0, f), rot: lerp(-14, -5, f) };
          }
          const sp = spring(t - a, { freq: 3.2, damping: 0.45 });
          return { sc: 0.95 + 0.05 * sp, op: 1, blur: 0, rot: -5 + 0.8 * (1 - sp) };
        };
        const second = t >= T.reseal - 0.2;
        const st = stamp(second ? T.reseal : T.seal);
        const cx = second ? 846 : 846;
        const cy = second ? PH2_TOP + 92 : 598;
        S.seal.classList.toggle("silver", second);
        let ex = { y: 0, opacity: 1, blur: 0 };
        if (!second) ex = exitState(t, OUT, { y: -30, blur: 10, dur: 0.4 });
        set(S.seal, {
          x: cx - S.sealW / 2, y: cy - S.sealH / 2 + ex.y, scale: st.sc, rot: st.rot, opacity: st.op * ex.opacity,
          blur: st.blur + ex.blur, origin: "50% 50%", display: !second && t > OUT + 0.45 ? "none" : "block",
        });
      }

      // ---------- cantos de mira: cartões -> mapa
      {
        const bp = ease.inOutQuart(prog(t, OUT + 0.15, OUT + 1.0));
        const x0 = lerp(BR0.x0, BR1.x0, bp), x1 = lerp(BR0.x1, BR1.x1, bp);
        const y0 = lerp(BR0.y0, BR1.y0, bp), y1 = lerp(BR0.y1, BR1.y1, bp);
        const ap = tw(t, -0.05, 0.9, ease.outQuart);
        const arm = lerp(36, 44, bp) * ap;
        const grow = lerp(26, 0, ap);
        const X0 = x0 - grow, X1 = x1 + grow, Y0 = y0 - grow, Y1 = y1 + grow;
        const ds = [
          `M${X0} ${Y0 + arm}L${X0} ${Y0}L${X0 + arm} ${Y0}`,
          `M${X1 - arm} ${Y0}L${X1} ${Y0}L${X1} ${Y0 + arm}`,
          `M${X1} ${Y1 - arm}L${X1} ${Y1}L${X1 - arm} ${Y1}`,
          `M${X0 + arm} ${Y1}L${X0} ${Y1}L${X0} ${Y1 - arm}`,
        ];
        const op = prog(t, -0.05, 0.25) * (0.7 + 0.25 * Math.sin(t * 2.4));
        S.brk.forEach((p, i) => {
          p.setAttribute("d", ap > 0.001 ? ds[i] : "M0 0");
          // no mapa, o canto inferior esquerdo cede lugar ao nó de alerta da Rota 3
          p.style.opacity = (op * (i === 3 ? 1 - bp : 1)).toFixed(3);
        });
      }

      // =====================================================================================
      // C2 · MAPA
      const mapOn = t > T.mapIn - 0.05;
      S.svgMapVis = mapOn;
      // câmera
      const tilt = (lerp(66, 47, mapLand) * Math.PI) / 180;
      const yaw = ((lerp(-10, -1.6, mapLand) + noise(t * 0.12, 61) * 1.2 + (t - T.mapIn) * 0.18) * Math.PI) / 180;
      const zoom = lerp(0.9, 1, mapLand) * lerp(1, 1.025, ease.inOutQuad(prog(t, 6.2, dur + 0.45)));
      const camCY = lerp(862, 822, mapLand) + noise(t * 0.2, 71) * 3;
      const camCX = CX + noise(t * 0.17, 73) * 4;
      const F = 1500;
      const sT = Math.sin(tilt), cT = Math.cos(tilt), sY = Math.sin(yaw), cY = Math.cos(yaw);
      const proj = (x, y) => {
        const xr = x * cY - y * sY, yr = x * sY + y * cY;
        const z = -yr * sT;
        const s = F / (F + z);
        return [camCX + xr * s * zoom, camCY + yr * cT * s * zoom, s * zoom];
      };
      const pathOf = (pts) => {
        let d = "";
        for (let i = 0; i < pts.length; i++) {
          const [x, y] = proj(pts[i][0], pts[i][1]);
          d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
        }
        return d;
      };
      const edgeFade = (sx, sy) => {
        const r = Math.hypot((sx - CX) / 560, (sy - 829) / 300);
        return (1 - smooth(0.62, 1.02, r)) * (1 - smooth(1004, 1062, sy));
      };

      // quarteirões
      S.blocks.forEach((b) => {
        const p = tw(t, b.at + b.jit, 0.55, ease.outCubic);
        if (!mapOn || p <= 0.002) {
          b.el.style.display = "none";
          return;
        }
        const hw = (GX / 2 - 8) * lerp(0.4, 1, p), hh = (GY / 2 - 8) * lerp(0.4, 1, p);
        const c1 = proj(b.cx - hw, b.cy - hh), c2 = proj(b.cx + hw, b.cy - hh), c3 = proj(b.cx + hw, b.cy + hh), c4 = proj(b.cx - hw, b.cy + hh);
        const [sx, sy] = proj(b.cx, b.cy);
        const f = edgeFade(sx, sy);
        if (f < 0.01) {
          b.el.style.display = "none";
          return;
        }
        b.el.style.display = "";
        b.el.setAttribute("points", `${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${c3[0].toFixed(1)},${c3[1].toFixed(1)} ${c4[0].toFixed(1)},${c4[1].toFixed(1)}`);
        // flash quando o radar passa
        const fl = Math.max(0, 1 - Math.abs(t - b.at - 0.08) / 0.25);
        b.el.style.opacity = (f * p * (1 + 1.2 * fl)).toFixed(3);
      });

      // radar
      {
        // dois anéis finos (o segundo 0,12 s atrás), esmaecidos na borda do mapa pelo gradiente
        [[S.radar, 0.02, 0.5], [S.radar2, 0.14, 0.25]].forEach(([el, off, peak]) => {
          const rp = prog(t, T.radar + off, T.radar + off + 1.2);
          if (!(rp > 0 && rp < 1)) {
            el.style.display = "none";
            return;
          }
          const rr = RMAX * ease.outCubic(rp);
          let d = "";
          for (let i = 0; i <= 48; i++) {
            const a = (i / 48) * Math.PI * 2;
            const [x, y] = proj(Math.cos(a) * rr, (Math.sin(a) * rr) / 1.25);
            d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
          }
          el.setAttribute("d", d + "Z");
          el.style.opacity = (peak * Math.min(1, rp * 6) * Math.pow(1 - rp, 1.2)).toFixed(3);
          el.style.display = "";
        });
      }

      // rotas
      let r3End = null;
      S.routes.forEach((o, ri) => {
        const vis = mapOn;
        const els = [o.track, o.halo, o.core, o.hot, o.pk, o.pkG, o.head];
        if (!vis) {
          els.forEach((e) => (e.style.display = "none"));
          o.stops.forEach((s) => {
            s.glow.style.display = s.core.style.display = "none";
            if (s.ring) s.ring.style.display = "none";
          });
          return;
        }
        // trilha planejada (pontilhada)
        o.track.style.display = "";
        o.track.setAttribute("d", pathOf(o.pts));
        o.track.style.opacity = (0.9 * tw(t, T.mapIn + 0.35, 0.6)).toFixed(3);
        const raw = prog(t, o.at, o.at + o.dur);
        const dp = ease.inOutCubic(raw);
        const d = o.L * dp;
        const sp = subPts(o.pts, o.cum, 0, d);
        const done = raw >= 1;
        if (sp) {
          const pd = pathOf(sp);
          [o.halo, o.core, o.hot].forEach((e) => {
            e.style.display = "";
            e.setAttribute("d", pd);
          });
          let haloOp = 0.9;
          let coreOp = 1;
          if (o.amber) {
            const pu = prog(t, T.alert, T.alert + 0.3);
            const beat = 0.5 + 0.5 * Math.sin((t - T.alert) * Math.PI * 2 * 0.8 - Math.PI / 2);
            haloOp = lerp(0.9, 0.55 + 0.9 * beat, pu);
            coreOp = lerp(1, 0.78 + 0.22 * beat, pu);
            o.halo.setAttribute("stroke-width", lerp(18, 16 + 14 * beat, pu).toFixed(1));
          } else {
            haloOp = 0.75 + 0.15 * Math.sin(t * 2 + ri);
          }
          o.halo.style.opacity = haloOp.toFixed(3);
          o.core.style.opacity = coreOp.toFixed(3);
          o.hot.style.opacity = (0.55 * coreOp).toFixed(3);
        } else [o.halo, o.core, o.hot].forEach((e) => (e.style.display = "none"));
        // cabeça
        if (raw > 0 && raw < 1) {
          const [hx, hy] = proj(...pointAt(o.pts, o.cum, d));
          o.head.style.display = "";
          o.head.setAttribute("cx", hx.toFixed(1));
          o.head.setAttribute("cy", hy.toFixed(1));
          o.head.style.opacity = Math.min(1, Math.sin(Math.PI * raw) * 2).toFixed(3);
        } else o.head.style.display = "none";
        // pacotes de luz (depois de desenhada)
        if (done) {
          const period = o.amber ? 1.25 : 2.2 + ri * 0.25;
          const t0 = o.at + o.dur + 0.15 + ri * 0.2;
          const lenP = o.amber ? 70 : 90;
          if (t > t0) {
            const ph = ((t - t0) / period) % 1;
            const c = lerp(-lenP, o.L + lenP, ease.inOutQuad(ph));
            const spk = subPts(o.pts, o.cum, c - lenP, c);
            if (spk) {
              const pd = pathOf(spk);
              o.pk.setAttribute("d", pd);
              o.pkG.setAttribute("d", pd);
              const fo = Math.sin(Math.PI * ph);
              o.pk.style.opacity = (0.9 * fo).toFixed(3);
              o.pkG.style.opacity = (0.8 * fo).toFixed(3);
              o.pk.style.display = o.pkG.style.display = "";
            } else o.pk.style.display = o.pkG.style.display = "none";
          } else o.pk.style.display = o.pkG.style.display = "none";
        } else o.pk.style.display = o.pkG.style.display = "none";

        // paradas
        o.stops.forEach((s) => {
          const [sx, sy, sc] = proj(o.pts[s.i][0], o.pts[s.i][1]);
          if (s.ring) s.ring.style.display = "none"; // reativado abaixo só durante o flash
          if (o.amber && s.isEnd) {
            r3End = [sx, sy, sc];
            s.glow.style.display = s.core.style.display = "none";
            return;
          }
          const tPass = o.at + o.dur * invIOC(s.d / o.L);
          const app = tw(t, T.mapIn + 0.4 + ri * 0.05, 0.5);
          if (app <= 0.001) {
            s.glow.style.display = s.core.style.display = "none";
            return;
          }
          s.core.style.display = "";
          s.core.setAttribute("cx", sx.toFixed(1));
          s.core.setAttribute("cy", sy.toFixed(1));
          const passed = t >= tPass;
          const pop = passed ? spring(t - tPass, { freq: 2.8, damping: 0.45 }) : 0;
          if (s.lit && passed) {
            s.core.setAttribute("r", (7 * sc * (0.6 + 0.4 * pop)).toFixed(2));
            s.core.setAttribute("fill", "#f6eeff");
            s.core.setAttribute("stroke", "none");
            s.glow.style.display = "";
            s.glow.setAttribute("cx", sx.toFixed(1));
            s.glow.setAttribute("cy", sy.toFixed(1));
            const tw2 = 0.8 + 0.2 * Math.sin(t * 2.6 + s.i * 1.7 + ri);
            s.glow.setAttribute("r", (24 * sc * Math.max(0, pop) * tw2).toFixed(2));
            s.core.style.opacity = "1";
            s.glow.style.opacity = "1";
          } else {
            // fantasma (não comprou) — na rota 3 ganha âmbar
            const amberGhost = o.amber && passed;
            s.core.setAttribute("r", (7.5 * sc).toFixed(2));
            s.core.setAttribute("fill", "#140a1e");
            s.core.setAttribute("stroke", amberGhost ? "#ffb547" : passed ? "#6e5a8c" : "rgba(220,194,255,0.35)");
            s.core.setAttribute("stroke-width", (2.5 * sc).toFixed(2));
            s.core.style.opacity = (app * (amberGhost ? 0.95 : 0.85)).toFixed(3);
            // o motivo correspondente chega pela faísca e acende a parada
            const fi = o.amber ? R3_FLASH.indexOf(s.i) : -1;
            const tA = fi >= 0 ? T.co[fi] + T.spark + T.sparkDur : Infinity;
            if (t > tA) {
              const tf = t - tA;
              const fl = 0.62 + 0.38 * Math.exp(-tf * 2.2) + 0.08 * Math.sin(t * 3 + fi);
              s.glow.style.display = "";
              s.glow.setAttribute("cx", sx.toFixed(1));
              s.glow.setAttribute("cy", sy.toFixed(1));
              s.glow.setAttribute("r", (sc * (27 + 30 * Math.exp(-tf * 2.5))).toFixed(2));
              s.glow.style.opacity = clamp(fl).toFixed(3);
              s.core.setAttribute("fill", "#5a330c");
              s.core.setAttribute("r", (sc * (7.5 + 3 * Math.exp(-tf * 4) * Math.max(0, spring(tf, { freq: 3, damping: 0.4 })))).toFixed(2));
              const rg = prog(tf, 0, 0.6);
              if (rg < 1) {
                s.ring.style.display = "";
                s.ring.setAttribute("cx", sx.toFixed(1));
                s.ring.setAttribute("cy", sy.toFixed(1));
                s.ring.setAttribute("r", (sc * lerp(8, 30, ease.outCubic(rg))).toFixed(2));
                s.ring.style.opacity = (0.8 * (1 - rg)).toFixed(3);
              } else s.ring.style.display = "none";
            } else {
              s.glow.style.display = "none";
              if (s.ring) s.ring.style.display = "none";
            }
          }
        });
      });

      // CD
      {
        const [hx, hy, hs] = proj(0, 0);
        const p = spring(t - T.hub, { freq: 2.4, damping: 0.5 });
        const on = mapOn && t > T.hub;
        // antes do impacto: só o anel-alvo, fraco, para onde as barras convergem
        const pre = mapOn && !on && t > T.mapIn + 0.2;
        [S.hub, S.hubGlow, S.hubPulse].forEach((e) => (e.style.display = on ? "" : "none"));
        S.hubRing.style.display = on || pre ? "" : "none";
        if (pre) {
          S.hubRing.setAttribute("cx", hx.toFixed(1));
          S.hubRing.setAttribute("cy", hy.toFixed(1));
          S.hubRing.setAttribute("r", (28 * hs * lerp(1.8, 1, tw(t, T.mapIn + 0.2, 0.3))).toFixed(1));
          S.hubRing.style.opacity = (0.5 * prog(t, T.mapIn + 0.2, T.mapIn + 0.4)).toFixed(3);
        } else S.hubRing.style.opacity = "1";
        // ondas de choque: chegada da barra A (neon) e da B (âmbar)
        S.hubShock.forEach((c, k) => {
          const ti = T.out + k * 0.07 + T.detach + T.fly[k];
          const sp = prog(t, ti, ti + 0.6);
          if (!mapOn || sp <= 0 || sp >= 1) {
            c.style.display = "none";
            return;
          }
          c.style.display = "";
          c.setAttribute("cx", hx.toFixed(1));
          c.setAttribute("cy", hy.toFixed(1));
          c.setAttribute("r", (hs * lerp(18, 120, ease.outCubic(sp))).toFixed(1));
          c.setAttribute("stroke-width", lerp(4, 0.6, sp).toFixed(2));
          c.style.opacity = (0.95 * Math.pow(1 - sp, 1.4)).toFixed(3);
        });
        S.cdPos = [hx, hy];
        if (on) {
          const sz = 26 * hs * Math.max(0, p);
          S.hub.setAttribute("x", (hx - sz / 2).toFixed(1));
          S.hub.setAttribute("y", (hy - sz / 2).toFixed(1));
          S.hub.setAttribute("width", sz.toFixed(1));
          S.hub.setAttribute("height", sz.toFixed(1));
          S.hub.setAttribute("transform", `rotate(45 ${hx.toFixed(1)} ${hy.toFixed(1)})`);
          S.hubRing.setAttribute("cx", hx.toFixed(1));
          S.hubRing.setAttribute("cy", hy.toFixed(1));
          S.hubRing.setAttribute("r", (28 * hs * clamp(p, 0, 1.3)).toFixed(1));
          S.hubGlow.setAttribute("cx", hx.toFixed(1));
          S.hubGlow.setAttribute("cy", hy.toFixed(1));
          S.hubGlow.setAttribute("r", (60 * hs * (0.9 + 0.1 * Math.sin(t * 2.2))).toFixed(1));
          const ph = ((t - T.hub) / 1.8) % 1;
          S.hubPulse.setAttribute("cx", hx.toFixed(1));
          S.hubPulse.setAttribute("cy", hy.toFixed(1));
          S.hubPulse.setAttribute("r", (lerp(28, 70, ease.outCubic(ph)) * hs).toFixed(1));
          S.hubPulse.style.opacity = (0.6 * Math.pow(1 - ph, 1.8)).toFixed(3);
        }
        const ls = enterState(t, T.hub + 0.15, { y: 10, blur: 6, dur: 0.6 });
        set(S.hubLab, { x: hx + 24 * hs, y: hy - 30 * hs - 30 + ls.y, opacity: ls.opacity * (mapOn ? 1 : 0), blur: ls.blur });
      }

      // barras que se soltam dos cartões e viram rastro de luz até o CD:
      // as duas pontas da barra convergem para o CD (a cauda com atraso), então o segmento
      // gira e encurta sozinho até virar um cometa
      S.streaks.forEach((el, k) => {
        const c = S.cards[k];
        const td = T.out + k * 0.07 + T.detach;
        const fd = T.fly[k];
        const LAG = 0.07;
        if (t < td || t > td + fd + LAG + 0.04) {
          el.style.display = "none";
          return;
        }
        el.style.display = "block";
        const w = (BAR.w * c.pct) / 100;
        const bobD = noise(td * 0.5 + k * 7, 21 + k) * 2.5;
        const yb = CARD_TOP[k] + BAR.top + BAR.h / 2 + bobD;
        const xl = CARD.x + BAR.x, xr = xl + w;
        const [hx, hy] = proj(0, 0);
        const ph = ease.inOutCubic(prog(t, td, td + fd));
        const pt = ease.inOutCubic(prog(t, td + LAG, td + fd + LAG));
        const Hx = lerp(xr, hx, ph), Hy = lerp(yb, hy, ph);
        const Tx = lerp(xl, hx, pt), Ty = lerp(yb, hy, pt);
        const len = Math.max(BAR.h, Math.hypot(Hx - Tx, Hy - Ty) + BAR.h * (1 - ph));
        const ang = Hx === Tx && Hy === Ty ? 0 : (Math.atan2(Hy - Ty, Hx - Tx) * 180) / Math.PI;
        const mx = (Hx + Tx) / 2, my = (Hy + Ty) / 2;
        el.style.width = len.toFixed(1) + "px";
        set(el, {
          x: mx - len / 2,
          y: my - BAR.h / 2,
          rot: ang,
          sx: 1,
          sy: lerp(1, 0.7, ph),
          blur: 4 * Math.sin(Math.PI * Math.min(1, ph * 1.2)) + 2 * ph,
          brightness: 1 + 0.7 * ph,
          opacity: 1 - prog(t, td + fd + LAG - 0.05, td + fd + LAG + 0.04),
        });
      });

      // rótulos
      S.routes.forEach((o, ri) => {
        const L = S.labs[ri];
        const end = o.pts[o.pts.length - 1];
        const [nx, ny] = proj(end[0], end[1]);
        const arr = o.at + o.dur - 0.08;
        const st = enterState(t, arr, { y: 16, blur: 8, dur: 0.6, scale: 0.88 });
        let lx;
        if (o.lab.align === "c") lx = nx + o.lab.dx - L.w / 2;
        else if (o.lab.align === "l") lx = nx + o.lab.dx;
        else lx = nx + o.lab.dx - L.w;
        lx = clamp(lx, 96, 956 - L.w);
        const ly = ny + o.lab.dy - L.h / 2;
        set(L.el, { x: lx, y: ly + st.y, opacity: st.opacity * (mapOn ? 1 : 0), blur: st.blur, scale: st.scale, origin: "50% 50%" });
        const v = Math.round(o.pct * ease.outCubic(prog(t, arr, arr + 0.6))) + "%";
        if (L.last !== v) {
          L.rp.textContent = v;
          L.last = v;
        }
      });

      // nó final da Rota 3: alerta âmbar
      {
        const R3 = S.routes[3];
        const arrive = R3.at + R3.dur;
        const on = mapOn && r3End && t > arrive - 0.05;
        [S.alertNode, S.alertDot, S.alertGlow, S.alertP1, S.alertP2].forEach((e) => (e.style.display = on ? "" : "none"));
        if (on) {
          const [ax, ay, as] = r3End;
          const p = spring(t - arrive + 0.05, { freq: 2.6, damping: 0.45 });
          const pu = prog(t, T.alert, T.alert + 0.3);
          const beat = 0.5 + 0.5 * Math.sin((t - T.alert) * Math.PI * 2 * 0.8 - Math.PI / 2);
          S.alertNode.setAttribute("cx", ax.toFixed(1));
          S.alertNode.setAttribute("cy", ay.toFixed(1));
          S.alertNode.setAttribute("r", (12 * as * Math.max(0, p)).toFixed(2));
          S.alertDot.setAttribute("cx", ax.toFixed(1));
          S.alertDot.setAttribute("cy", ay.toFixed(1));
          S.alertDot.setAttribute("r", (4.5 * as * Math.max(0, p) * (0.8 + 0.3 * beat * pu)).toFixed(2));
          S.alertGlow.setAttribute("cx", ax.toFixed(1));
          S.alertGlow.setAttribute("cy", ay.toFixed(1));
          S.alertGlow.setAttribute("r", (lerp(40, 46 + 18 * beat, pu) * as).toFixed(1));
          [S.alertP1, S.alertP2].forEach((c, i) => {
            const ph = (t - T.alert) / 1.25 - i * 0.5;
            if (ph < 0) {
              c.style.display = "none";
              return;
            }
            const f = ph % 1;
            c.setAttribute("cx", ax.toFixed(1));
            c.setAttribute("cy", ay.toFixed(1));
            c.setAttribute("r", (lerp(13, 52, ease.outCubic(f)) * as).toFixed(1));
            c.style.opacity = (0.85 * Math.pow(1 - f, 1.6)).toFixed(3);
            c.setAttribute("stroke-width", lerp(3, 1, f).toFixed(2));
          });
          set(S.glowAmber, { x: ax, y: ay, opacity: pu * (0.7 + 0.3 * beat), scale: 0.9 + 0.15 * beat });
        } else set(S.glowAmber, { opacity: 0 });
      }

      // fio âmbar + callouts
      {
        const yi = CO_TOP.map((y) => y + CO_H / 2);
        const on = mapOn && r3End && t > T.bus;
        S.bus.style.display = S.busG.style.display = on ? "" : "none";
        if (on) {
          const [ax, ay, as] = r3End;
          const y0 = ay + 13 * as;
          // a ponta do fio chega em cada derivação logo antes do callout entrar
          const keys = [[T.bus, y0], [T.co[0] - 0.04, yi[0]], [T.co[1] - 0.04, yi[1]], [T.co[2] - 0.04, yi[2]]];
          let tipY = yi[2];
          for (let k = 1; k < keys.length; k++) {
            if (t <= keys[k][0]) {
              const f = prog(t, keys[k - 1][0], keys[k][0]);
              tipY = lerp(keys[k - 1][1], keys[k][1], k === 1 ? ease.inOutQuad(f) : ease.outQuad(f));
              break;
            }
          }
          const d = `M${ax.toFixed(1)} ${y0.toFixed(1)}L${ax.toFixed(1)} ${tipY.toFixed(1)}`;
          S.bus.setAttribute("d", d);
          S.busG.setAttribute("d", d);
          S.bus.style.opacity = "0.9";
          S.busG.style.opacity = (0.7 + 0.3 * Math.sin(t * 2.4)).toFixed(3);
          S.branches.forEach((b, i) => {
            const a = T.co[i] - 0.05;
            const bp = ease.outCubic(prog(t, a, a + 0.3));
            const show = t > a;
            b.line.style.display = b.dot.style.display = b.ring.style.display = show ? "" : "none";
            if (!show) return;
            const x1 = lerp(ax, PILL_L - 2, bp);
            b.line.setAttribute("d", `M${ax.toFixed(1)} ${yi[i]}L${x1.toFixed(1)} ${yi[i]}`);
            const dp = spring(t - a, { freq: 2.8, damping: 0.5 });
            b.dot.setAttribute("cx", ax.toFixed(1));
            b.dot.setAttribute("cy", String(yi[i]));
            b.dot.setAttribute("r", (5.5 * Math.max(0, dp)).toFixed(2));
            const rp = prog(t, a, a + 0.7);
            b.ring.setAttribute("cx", ax.toFixed(1));
            b.ring.setAttribute("cy", String(yi[i]));
            b.ring.setAttribute("r", lerp(6, 22, ease.outCubic(rp)).toFixed(1));
            b.ring.style.opacity = rp < 1 ? (0.8 * (1 - rp)).toFixed(3) : "0";
          });
        } else S.branches.forEach((b) => (b.line.style.display = b.dot.style.display = b.ring.style.display = "none"));

        // faíscas: cada motivo sobe pelo fio até o nó de alerta e corre a Rota 3 de volta até a sua parada fantasma
        const R3 = S.routes[3];
        S.sparks.forEach((k, i) => {
          const a = T.co[i] + T.spark;
          const sp = prog(t, a, a + T.sparkDur);
          if (!on || sp <= 0 || sp >= 1) {
            k.g.style.display = k.c.style.display = "none";
            return;
          }
          const [ax, ay, as] = r3End;
          const y0 = ay + 13 * as;
          const busLen = yi[i] - y0;
          const SC = 0.85; // px de tela por unidade do plano (aprox.)
          const dStop = R3.cum[R3_FLASH[i]];
          const routeLen = (R3.L - dStop) * SC;
          const tot = busLen + routeLen;
          const u = tot * ease.inOutQuad(sp);
          const ptAt = (v) => {
            v = clamp(v, 0, tot);
            if (v <= busLen) return [ax, yi[i] - v];
            const dd = R3.L - (v - busLen) / SC;
            return proj(...pointAt(R3.pts, R3.cum, dd));
          };
          const SEG = 80;
          let d = "";
          for (let j = 0; j <= 8; j++) {
            const q = ptAt(u - SEG + (SEG * j) / 8);
            d += (j ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1);
          }
          k.g.setAttribute("d", d);
          k.c.setAttribute("d", d);
          const fo = Math.min(1, Math.sin(Math.PI * sp) * 2.2);
          k.g.style.opacity = (0.8 * fo).toFixed(3);
          k.c.style.opacity = fo.toFixed(3);
          k.g.style.display = k.c.style.display = "";
        });
      }

      // frase C2
      S.ph2Words.forEach((w, i) => {
        const st = enterState(t, T.ph2 + i * 0.045, { y: 44, blur: 12, dur: 0.75 });
        set(w, { y: st.y, opacity: st.opacity, blur: st.blur });
      });
      // callouts
      S.cos.forEach((c, i) => {
        const a = T.co[i];
        const st = enterState(t, a, { x: -36, y: 0, blur: 10, dur: 0.7 });
        set(c.el, { x: st.x, opacity: st.opacity, blur: st.blur * 0.6, display: t < a - 0.01 ? "none" : "flex" });
        c.words.forEach((w, j) => {
          const s2 = enterState(t, a + 0.04 + j * 0.025, { y: 22, blur: 8, dur: 0.6 });
          set(w, { y: s2.y, opacity: s2.opacity, blur: s2.blur });
        });
        const shp = ease.inOutQuad(prog(t, T.coSheen + i * 0.14, T.coSheen + i * 0.14 + 0.75));
        set(c.sh, { x: lerp(-280, 840, shp), skewX: -18, opacity: shp > 0 && shp < 1 ? 1 : 0 });
      });
    },
  });
})();
