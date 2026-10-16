/*
 * ATO A — "O número" (0,0–9,8 s · dur 9,8)
 *
 * Coreografia (tempo local, s) — três tempos claros, um foco por vez:
 *  -1.10–0.00  HUD do scanner já liga antes do quadro 0 (cantos, régua, cruzes, leituras digitadas)
 *  -1.00–0.00  "De cada / 10 clientes," entra por palavra (no quadro 0 já está nítido)
 *  -0.40–1.00  10 fachadas de PDV entram em mola escalonada (diagonal); o ícone é revelado de baixo
 *              para cima por uma linha de luz (mini-scan), sem traço fragmentado
 *   0.85–1.75  "quantos compraram / de você este mês?" por palavra; 1.6 sublinhado neon em "este mês"
 *   1.75–3.45  leitura: brilho especular no vidro dos tiles, HUD "calibrando…" → "pronto"
 *   3.45–4.30  MORPH: "clientes," e "De cada" saem; o "10" do gancho desliza para "de 10";
 *              o "0" do odômetro sobe à esquerda → "0 de 10" legível antes do 1º toque do scan
 *   3.95–5.35  scan local varre a grade: 7 acendem (neon), 3 viram fantasma (âmbar); contador 0→7
 *   4.75–5.23  pergunta sai para cima; 4.85 rótulo "compraram este mês"
 *   5.40       BATIDA: "7" dá pop de mola + bloom, grade pulsa, anéis âmbar nos 3 fantasmas,
 *              leitura do HUD pisca; leitura lateral "Comprou 07 / Não comprou 03"
 *   5.55–5.95  "Faturamento bom pode esconder uma carteira encolhendo." por palavra
 *   6.00–7.30  mini gráfico em tesoura: faturamento ↑ (prata) × clientes comprando ↓ (âmbar)
 *   6.50–7.90  "encolhendo." encolhe (espaçamento + escala uniforme)
 *   5.30–10.25 push-in de 4,5% com parallax por camada; reage ao scan do motor (9.35–10.25)
 */
(function () {
  const { h, set, tw, ease, prog, lerp, clamp, spring, enterState, exitState, hash, noise } = SAIB.fx;

  // ---------- geometria ----------
  const GX = 138, GY = 692, TS = 140, GAPX = 26, GAPY = 30, COLS = 5;
  const GW = COLS * TS + (COLS - 1) * GAPX; // 804
  const GH = 2 * TS + GAPY; // 310
  const tileX = (c) => GX + c * (TS + GAPX);
  const tileY = (r) => GY + r * (TS + GAPY);
  const BR = { x: GX - 14, y: GY - 22, w: GW + 28, h: GH + 44 }; // colchetes do HUD (direita em 956)
  const L0 = 40; // braço dos colchetes

  // tempos-chave
  const SCAN_A = 3.95, SCAN_B = 5.35, BEAT = SCAN_B + 0.05;
  const MORPH = 3.45; // gancho → contador
  const Q_IN = 0.85, Q_OUT = 4.75; // pergunta
  const PH_IN = 5.55; // frase
  const SX0 = GX - 80, SX1 = GX + GW + 80;
  const scanP = (t) => ease.inOutQuad(prog(t, SCAN_A, SCAN_B));
  const scanX = (t) => lerp(SX0, SX1, scanP(t));

  // quem não comprou (índices 0..9, linha a linha)
  const GHOST = new Set([2, 6, 9]);
  const TYPES = [0, 1, 2, 3, 4, 2, 3, 4, 0, 1];

  // ---------- cores ----------
  const C = {
    neutral: [206, 202, 222],
    lit: [246, 238, 255],
    ghost: [120, 104, 140],
    neon: [180, 108, 255],
    amber: [255, 181, 71],
    hair: [255, 255, 255],
  };
  const mix = (a, b, p) => a.map((v, i) => Math.round(lerp(v, b[i], p)));
  const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a).toFixed(3)})`;

  // ---------- ícones: fachadas de PDV em linha fina (viewBox 120) ----------
  const AWN = (() => {
    let d = "M18 44H102L108 56";
    for (let k = 0; k < 8; k++) d += "a6 5 0 0 1 -12 0";
    d += "L18 44Z";
    let lines = "", fills = "";
    for (let k = 1; k < 8; k++) lines += `M${(18 + 10.5 * k).toFixed(1)} 44L${12 + 12 * k} 56`;
    for (let k = 0; k < 8; k += 2) {
      const a = 18 + 10.5 * k, b = 18 + 10.5 * (k + 1);
      fills += `<path class="aw-f" d="M${a} 44H${b}L${12 + 12 * (k + 1)} 56a6 5 0 0 1 -12 0Z"/>`;
    }
    return `${fills}<path d="${d}"/><path d="${lines}"/>`;
  })();
  const DOOR = (x) => `<path d="M${x} 106V76a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v30"/><path d="M${x + 5} 90v3"/>`;
  const WIN = (x, w, inner = "") =>
    `<rect class="win" x="${x}" y="68" width="${w}" height="24" rx="3"/><rect x="${x}" y="68" width="${w}" height="24" rx="3"/>${inner}`;
  const BOTTLES = (x) =>
    `<path d="M${x} 92v-9q0-2 2-3v-5h2v5q2 1 2 3v9"/><path d="M${x + 10} 92v-9q0-2 2-3v-5h2v5q2 1 2 3v9"/>`;
  const BASE = `<path d="M6 106H114"/><path d="M22 58V106M98 58V106"/>`;
  const ICON = [
    `<path d="M14 24H106M20 24V44M100 24V44"/><path d="M30 24V17H90V24"/><rect x="36" y="29" width="48" height="10" rx="5"/>
     ${WIN(28, 32, `<path d="M28 84H60"/><path d="M35 84v-8M42 84v-10M49 84v-8M54 84v-6"/>`)}${DOOR(70)}`,
    `<path d="M14 20H106M20 20V44M100 20V44"/><rect x="28" y="24" width="64" height="16" rx="3"/>
     <path d="M48 27.5h3.5l2.6 7.2h10.4l2.6-5.4H53"/><circle cx="56" cy="37.6" r="1.5"/><circle cx="64.5" cy="37.6" r="1.5"/>
     ${WIN(26, 20, `<path d="M26 80H46"/>`)}${WIN(74, 20, `<path d="M74 80H94"/>`)}${DOOR(50)}`,
    `<path d="M14 44L60 12L106 44"/><circle cx="60" cy="31" r="6.5"/><path d="M53.5 31H66.5M60 24.5V37.5"/>
     ${DOOR(30)}${WIN(60, 34, BOTTLES(68))}`,
    `<path d="M18 44V30Q60 4 102 30V44"/><path d="M47 37a13 9 0 0 1 26 0Z"/><path d="M54 32l3-4M60 31l3-4M66 32l2-3"/>
     ${WIN(26, 36, `<path d="M26 80H62"/><path d="M33 80a4 3 0 0 1 8 0M45 80a4 3 0 0 1 8 0"/>`)}${DOOR(72)}`,
    `<path d="M14 30H106M20 30V44M100 30V44"/><path d="M38 30V23M82 30V23"/><rect x="30" y="11" width="60" height="12" rx="3"/>
     <circle cx="50" cy="17" r="1.6"/><circle cx="60" cy="17" r="1.6"/><circle cx="70" cy="17" r="1.6"/>
     ${DOOR(28)}${WIN(58, 36, `<path d="M58 80H94"/><path d="M64 80v-6M70 80v-8M76 80v-5M82 80v-7M88 80v-5"/>`)}`,
  ];

  // ---------- texto por palavra ----------
  function buildLines(host, lines, wordClass = "") {
    const words = [];
    lines.forEach((ln) => {
      const row = h("div", { class: "ln" });
      ln.forEach((w, i) => {
        const segs = typeof w === "string" ? [[w, wordClass]] : w;
        const wd = h("span", { class: "wd" });
        segs.forEach(([tx, cl]) => wd.append(h("span", { class: cl || wordClass, text: tx })));
        row.append(wd);
        if (i < ln.length - 1) row.append(document.createTextNode(" "));
        words.push(wd);
      });
      host.append(row);
    });
    return words;
  }

  const kick = (dt, f = 15, k = 6.5) => (dt <= 0 ? 0 : Math.exp(-dt * k) * Math.sin(dt * f));
  const typeOn = (str, t, at, cps = 38) => str.slice(0, Math.max(0, Math.floor((t - at) * cps)));
  const pad2 = (n) => String(n).padStart(2, "0");
  const addSt = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, opacity: a.opacity * b.opacity, blur: a.blur + b.blur, scale: a.scale * b.scale });

  const CSS = `
  [data-act="A"] .cam{position:absolute;inset:0}
  [data-act="A"] .lay{position:absolute;inset:0;transform-origin:520px 900px;will-change:transform}
  [data-act="A"] .abs{position:absolute}
  [data-act="A"] .wd{display:inline-block;white-space:nowrap}
  [data-act="A"] .ln{display:block;white-space:nowrap}
  [data-act="A"] .hl{left:${GX}px;top:378px}
  [data-act="A"] .hl .l1{font-family:var(--font-display);font-weight:300;font-size:86px;line-height:1.0;letter-spacing:-0.005em}
  [data-act="A"] .hl .l2{font-family:var(--font-display);font-weight:800;font-size:116px;line-height:1.02;letter-spacing:-0.015em;margin-top:2px}
  [data-act="A"] .soft{color:var(--silver-2)}
  [data-act="A"] .q{left:${GX}px;top:1086px;font-family:var(--font-display);font-weight:800;font-size:84px;line-height:1.08;letter-spacing:-0.012em}
  [data-act="A"] .neonw{position:relative;display:inline-block}
  [data-act="A"] .neonw .tx{background:linear-gradient(180deg,#fbf5ff 0%,#d6a8ff 48%,#a456f5 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
  [data-act="A"] .uline{position:absolute;left:2px;right:2px;bottom:4px;height:6px;border-radius:6px;
    background:linear-gradient(90deg,#8b2bd9,#d9b8ff);box-shadow:0 0 18px 2px rgba(180,108,255,.85);transform-origin:0 50%}
  [data-act="A"] .tile{position:absolute;width:${TS}px;height:${TS}px}
  [data-act="A"] .tile .glow{position:absolute;left:-46px;top:-46px;width:${TS + 92}px;height:${TS + 92}px;border-radius:50%;
    background:radial-gradient(closest-side,rgba(180,108,255,.55),rgba(139,43,217,.22) 55%,transparent 100%)}
  [data-act="A"] .tile .card{position:absolute;inset:0;border-radius:32px;border:1.5px solid rgba(255,255,255,.13);
    background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));overflow:hidden}
  [data-act="A"] .tile .litbg{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 100%,rgba(180,108,255,.40),rgba(98,9,137,.16) 60%,rgba(98,9,137,0) 100%)}
  [data-act="A"] .tile .hi{position:absolute;inset:0;border-radius:30px;background:linear-gradient(180deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,0) 38%);
    box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}
  [data-act="A"] .tile .ghostbg{position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,2,13,.42),rgba(7,2,13,.62))}
  [data-act="A"] .tile .flash{position:absolute;inset:0;background:radial-gradient(closest-side,rgba(255,255,255,.9),rgba(220,194,255,.35) 60%,transparent)}
  [data-act="A"] .tile .sheen{position:absolute;left:0;top:-40px;width:40px;height:${TS + 80}px;
    background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.10) 50%,rgba(255,255,255,0));opacity:0}
  [data-act="A"] .tile svg.ic{position:absolute;left:17px;top:15px;width:106px;height:106px;overflow:visible}
  [data-act="A"] .tile svg.ic *{fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
  [data-act="A"] .tile svg.ic .aw-f{fill:currentColor;stroke:none;opacity:.16}
  [data-act="A"] .tile svg.ic .win{fill:url(#A-winGrad);stroke:none;opacity:0}
  [data-act="A"] .tile .edge{position:absolute;left:10px;top:0;width:${TS - 20}px;height:2px;border-radius:2px;
    background:linear-gradient(90deg,rgba(241,228,255,0),#f1e4ff 30%,#f1e4ff 70%,rgba(241,228,255,0));box-shadow:0 0 10px 2px rgba(180,108,255,.85);opacity:0}
  [data-act="A"] .tile .ripple{position:absolute;inset:0;border-radius:32px;border:1.5px solid rgba(214,168,255,.95);opacity:0}
  [data-act="A"] .tile .ripple.amb{border:2px solid rgba(255,181,71,.95);box-shadow:0 0 14px rgba(255,160,60,.45)}
  [data-act="A"] .tile svg.dash{position:absolute;left:0;top:0;overflow:visible;opacity:0}
  [data-act="A"] .tile .badge{position:absolute;right:-13px;top:-13px;width:44px;height:44px;opacity:0}
  [data-act="A"] .tile .badge svg{width:44px;height:44px;overflow:visible}
  [data-act="A"] .mono{font-family:var(--font-mono);font-size:22px;letter-spacing:.2em;text-transform:uppercase;white-space:nowrap}
  [data-act="A"] .lc{text-transform:none}
  [data-act="A"] .hudl{left:${BR.x}px;top:${BR.y - 40}px;color:var(--lilac)}
  [data-act="A"] .hudr{right:${1080 - (BR.x + BR.w)}px;top:${BR.y - 40}px;color:var(--lilac);text-align:right}
  [data-act="A"] .hudr .dots{display:inline-block;text-align:left}
  [data-act="A"] .dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--neon);box-shadow:0 0 12px 2px rgba(180,108,255,.9);margin-right:14px;vertical-align:2px}
  [data-act="A"] .comet{left:0;top:0;width:120px;height:10px;transform-origin:0 50%}
  [data-act="A"] .comet .tail{position:absolute;left:0;top:4px;width:116px;height:2px;border-radius:2px;
    background:linear-gradient(90deg,rgba(180,108,255,0),rgba(220,194,255,.85))}
  [data-act="A"] .comet .head{position:absolute;right:1px;top:1px;width:8px;height:8px;transform:rotate(45deg);background:#f1e4ff;
    box-shadow:0 0 10px 3px rgba(180,108,255,.9)}
  [data-act="A"] .scan{left:0;top:${BR.y - 10}px;width:0;height:${BR.h + 20}px}
  [data-act="A"] .scan .trail{position:absolute;right:0;top:0;width:300px;height:100%;
    background:linear-gradient(90deg,rgba(180,108,255,0),rgba(180,108,255,.08) 55%,rgba(220,194,255,.28) 100%);mix-blend-mode:screen;-webkit-mask-image:linear-gradient(180deg,transparent,#000 18%,#000 82%,transparent);mask-image:linear-gradient(180deg,transparent,#000 18%,#000 82%,transparent)}
  [data-act="A"] .scan .core{position:absolute;left:-1.5px;top:0;width:3px;height:100%;border-radius:3px;
    background:linear-gradient(180deg,rgba(255,255,255,0),#fff 12%,#fff 88%,rgba(255,255,255,0));
    box-shadow:0 0 16px 3px rgba(180,108,255,.95),0 0 60px 12px rgba(139,43,217,.55)}
  [data-act="A"] .scan .cap{position:absolute;left:-7px;width:14px;height:14px;transform:rotate(45deg);border:2px solid #f1e4ff;box-shadow:0 0 12px rgba(180,108,255,.9)}
  [data-act="A"] .ctr{left:${GX - 10}px;top:345px;display:flex;align-items:flex-end;gap:30px}
  [data-act="A"] .num{position:relative;width:200px;height:300px}
  [data-act="A"] .odo{position:absolute;inset:0;overflow:hidden;-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 11%,#000 89%,transparent 100%);mask-image:linear-gradient(180deg,transparent 0,#000 11%,#000 89%,transparent 100%)}
  [data-act="A"] .strip{position:absolute;left:0;top:-44px;width:100%}
  [data-act="A"] .dg{height:360px;line-height:360px;font-family:var(--font-display);font-weight:900;font-size:300px;text-align:center;
    font-variant-numeric:tabular-nums;background:linear-gradient(180deg,#fbf5ff 8%,#cf9bff 50%,#9a45f0 92%);-webkit-background-clip:text;background-clip:text;color:transparent}
  [data-act="A"] .numGlow{position:absolute;left:-100px;top:-100px;width:400px;height:500px;overflow:hidden;
    -webkit-mask-image:linear-gradient(180deg,transparent 0,#000 24%,#000 76%,transparent 100%);mask-image:linear-gradient(180deg,transparent 0,#000 24%,#000 76%,transparent 100%)}
  [data-act="A"] .gstrip{position:absolute;left:100px;top:56px;width:200px}
  [data-act="A"] .gd{height:360px;line-height:360px;text-align:center;font-family:var(--font-display);font-weight:900;font-size:300px;
    color:transparent;text-shadow:0 0 38px rgba(164,86,245,1),0 0 90px rgba(139,43,217,.7)}
  [data-act="A"] .side{padding-bottom:37px}
  [data-act="A"] .de{font-family:var(--font-display);font-weight:800;font-size:120px;line-height:.9;letter-spacing:-0.01em;white-space:nowrap}
  [data-act="A"] .de .ch{display:inline-block}
  [data-act="A"] .de .ten{display:inline-block;line-height:1.02;visibility:hidden;letter-spacing:-0.015em}
  [data-act="A"] .lbl{margin-top:18px;font-family:var(--font-text);font-weight:600;font-size:38px;color:var(--lilac);letter-spacing:.005em;white-space:nowrap}
  [data-act="A"] .stack{right:${1080 - (BR.x + BR.w)}px;top:384px;display:flex;flex-direction:column;align-items:flex-end;gap:12px;color:var(--silver-2)}
  [data-act="A"] .stack .row{display:flex;align-items:center;gap:14px}
  [data-act="A"] .stack .v{color:#f1e4ff;font-weight:600}
  [data-act="A"] .stack .sw{width:12px;height:12px;border-radius:50%}
  [data-act="A"] .ph{left:${GX}px;top:1072px;font-family:var(--font-display);font-weight:800;font-size:70px;line-height:1.04;letter-spacing:-0.012em}
  [data-act="A"] .amb{background:linear-gradient(180deg,#ffe2b0 0%,#ffb547 55%,#ff8a3d 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
  [data-act="A"] .chart{left:${GX}px;top:1318px;width:${GW}px;height:160px}
  [data-act="A"] .chart svg{position:absolute;left:0;top:0;overflow:visible}
  [data-act="A"] .chart .cl{position:absolute;font-family:var(--font-text);font-weight:600;font-size:30px;white-space:nowrap;line-height:36px}
  `;

  SAIB.act("A", {
    css: CSS,
    build(root, ctx) {
      const S = ctx.state;
      const cam = h("div", { class: "cam" });
      root.append(cam);
      // camadas (parallax): fundo/HUD ×1.0, tiles ×1.15, texto ×0.85
      S.Lback = h("div", { class: "lay" });
      S.Lhud = h("div", { class: "lay" });
      S.Ltile = h("div", { class: "lay" });
      S.Ltext = h("div", { class: "lay" });
      cam.append(S.Lback, S.Lhud, S.Ltile, S.Ltext);

      S.Lback.append(
        h("svg", { width: 0, height: 0, style: { position: "absolute" } }, [
          h("defs", {}, [
            h("linearGradient", { id: "A-winGrad", x1: "0", y1: "0", x2: "0", y2: "1" }, [
              h("stop", { offset: "0", "stop-color": "#f4e8ff" }),
              h("stop", { offset: "1", "stop-color": "#b46cff" }),
            ]),
          ]),
        ])
      );

      // brilho local atrás da grade
      S.aura = h("div", {
        class: "abs",
        style: {
          left: "40px", top: `${GY - 260}px`, width: "1000px", height: `${GH + 520}px`,
          background: "radial-gradient(closest-side, rgba(139,43,217,.34), rgba(98,9,137,.12) 55%, transparent)",
        },
      });
      S.auraAmb = h("div", {
        class: "abs",
        style: {
          left: "300px", top: "1260px", width: "760px", height: "300px",
          background: "radial-gradient(closest-side, rgba(255,138,61,.10), transparent)",
        },
      });
      S.Lback.append(S.aura, S.auraAmb);

      // ---- gancho
      S.hl = h("div", { class: "abs hl" });
      const l1 = buildLines(S.hl, [["De", "cada"]], "soft");
      const l2 = buildLines(S.hl, [["10", "clientes,"]], "grad-silver");
      S.hl.children[0].classList.add("l1");
      S.hl.children[1].classList.add("l2");
      S.hlWords = l1.concat(l2);
      S.ten = l2[0];
      S.ten.style.transformOrigin = "0 0";
      S.Ltext.append(S.hl);

      // ---- HUD: colchetes, régua, cruzes de registro
      const L = L0;
      const { x: bx, y: by, w: bw, h: bh } = BR;
      const hud = h("svg", { class: "abs", width: 1080, height: 1920, style: { left: 0, top: 0, overflow: "visible" } });
      const corner = (d) => h("path", { d, pathLength: 1, fill: "none", stroke: "#dcc2ff", "stroke-width": 2.5, "stroke-linecap": "round", "stroke-dasharray": "1 1" });
      S.corners = [
        corner(`M${bx} ${by + L}V${by}H${bx + L}`),
        corner(`M${bx + bw - L} ${by}H${bx + bw}V${by + L}`),
        corner(`M${bx + bw} ${by + bh - L}V${by + bh}H${bx + bw - L}`),
        corner(`M${bx + L} ${by + bh}H${bx}V${by + bh - L}`),
      ];
      let ticks = "";
      for (let x = bx + L + 18; x < bx + bw - L - 10; x += 24) {
        const big = Math.round((x - bx) / 24) % 5 === 0;
        ticks += `M${x} ${by}v${big ? 10 : 5}M${x} ${by + bh}v${big ? -10 : -5}`;
      }
      S.ticksG = h("g", {}, [h("path", { d: ticks, stroke: "#dcc2ff", "stroke-width": 1.5, opacity: 0.32 })]);
      S.cross = [];
      for (let i = 0; i < 10; i++) {
        const cx = tileX(i % 5) + TS / 2, cy = tileY(Math.floor(i / 5)) + TS / 2;
        const p = h("path", {
          d: `M${cx - 11} ${cy}H${cx + 11}M${cx} ${cy - 11}V${cy + 11}`,
          stroke: "#dcc2ff", "stroke-width": 2, "stroke-linecap": "round", opacity: 0.6,
        });
        const ring = h("rect", {
          x: tileX(i % 5) + 0.75, y: tileY(Math.floor(i / 5)) + 0.75, width: TS - 1.5, height: TS - 1.5, rx: 32,
          fill: "none", stroke: "rgba(220,194,255,.22)", "stroke-width": 1.5, "stroke-dasharray": "4 9",
        });
        const g = h("g", {}, [ring, p]);
        S.cross.push(g);
        hud.append(g);
      }
      S.corners.forEach((c) => hud.append(c));
      hud.append(S.ticksG);
      S.Lhud.append(hud);

      S.hudL = h("div", { class: "abs mono hudl" }, [h("span", { class: "dot" }), (S.hudLt = h("span")), (S.hudLs = h("span", { class: "lc" }))]);
      S.hudR = h("div", { class: "abs mono hudr" }, [(S.hudRt = h("span")), (S.hudRd = h("span", { class: "dots" }))]);
      S.Lhud.append(S.hudL, S.hudR);
      // sondas em forma de cometa que percorrem a régua do HUD
      S.probes = [0, 1].map(() => h("div", { class: "abs comet" }, [h("div", { class: "tail" }), h("div", { class: "head" })]));
      S.probes.forEach((p) => S.Lhud.append(p));

      // ---- grade de PDVs
      S.tiles = [];
      let gk = 0;
      for (let i = 0; i < 10; i++) {
        const c = i % 5, r = Math.floor(i / 5);
        const tile = h("div", { class: "tile", style: { left: `${tileX(c)}px`, top: `${tileY(r)}px` } });
        const glow = h("div", { class: "glow" });
        const card = h("div", { class: "card" });
        const litbg = h("div", { class: "litbg" });
        const hi = h("div", { class: "hi" });
        const ghostbg = h("div", { class: "ghostbg" });
        const flash = h("div", { class: "flash" });
        const sheen = h("div", { class: "sheen" });
        card.append(litbg, hi, ghostbg, flash, sheen);
        const svg = h("svg", { class: "ic", viewBox: "0 0 120 120", html: BASE + AWN + ICON[TYPES[i]] });
        const wins = [...svg.querySelectorAll(".win")];
        const awf = [...svg.querySelectorAll(".aw-f")];
        const edge = h("div", { class: "edge" });
        const ghost = GHOST.has(i);
        const ripple = h("div", { class: ghost ? "ripple amb" : "ripple" });
        const dash = ghost
          ? h("svg", { class: "dash", width: TS, height: TS, viewBox: `0 0 ${TS} ${TS}` }, [
              h("rect", { x: 1, y: 1, width: TS - 2, height: TS - 2, rx: 31, fill: "none", stroke: "#ffb547", "stroke-width": 1.6, "stroke-dasharray": "4 9", "stroke-linecap": "round" }),
            ])
          : null;
        const badge = h("div", { class: "badge" });
        badge.innerHTML = ghost
          ? `<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="17" fill="#1a0b26" stroke="#ffb547" stroke-width="2.5"/><path d="M15 22H29" stroke="#ffb547" stroke-width="3" stroke-linecap="round"/></svg>`
          : `<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="#b46cff"/><circle cx="22" cy="22" r="18" fill="none" stroke="#f1e4ff" stroke-width="1.5" opacity=".7"/><path class="chk" d="M14.5 22.5l5 5 10-11" pathLength="1" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 1"/></svg>`;
        tile.append(glow, ripple, card, svg, edge);
        if (dash) tile.append(dash);
        tile.append(badge);
        S.Ltile.append(tile);
        // instante em que a linha de scan cruza o centro da coluna (bisseção — feito uma vez, determinístico)
        const cx = tileX(c) + TS / 2;
        let lo = SCAN_A, hi2 = SCAN_B;
        for (let k = 0; k < 40; k++) {
          const m = (lo + hi2) / 2;
          if (scanX(m) < cx) lo = m;
          else hi2 = m;
        }
        S.tiles.push({
          el: tile, glow, card, litbg, hi, ghostbg, flash, sheen, svg, wins, awf, edge, ripple, dash, badge,
          chk: badge.querySelector(".chk"), ghost, c, r,
          gk: ghost ? gk++ : -1,
          at: -0.4 + c * 0.085 + r * 0.13, // entrada (o quadro 0 já tem as primeiras fachadas surgindo)
          hit: lo + r * 0.035, // toque do scan
          ph: hash(i + 7) * 6.28,
          cy: tileY(r) + TS / 2,
        });
      }
      S.hits = S.tiles.filter((x) => !x.ghost).map((x) => x.hit).sort((a, b) => a - b);

      // ---- scan local
      S.scan = h("div", { class: "abs scan" }, [
        h("div", { class: "trail" }),
        h("div", { class: "core" }),
        h("div", { class: "cap", style: { top: "-7px" } }),
        h("div", { class: "cap", style: { bottom: "-7px" } }),
      ]);
      S.scanTrail = S.scan.children[0];
      S.Ltile.append(S.scan);

      // ---- pergunta
      S.q = h("div", { class: "abs q" });
      const neon = h("span", { class: "neonw" }, [h("span", { class: "tx", text: "este mês" }), (S.uline = h("span", { class: "uline" }))]);
      S.qWords = buildLines(S.q, [["quantos", "compraram"], ["de", "você"]], "grad-silver");
      const l2q = S.q.children[1];
      const unit = h("span", { class: "wd" }, [neon, h("span", { class: "grad-silver", text: "?" })]);
      l2q.append(document.createTextNode(" "), unit);
      S.qWords.push(unit);
      S.Ltext.append(S.q);

      // ---- contador "7 de 10" (o "10" é o mesmo objeto do gancho; aqui fica só o lugar)
      S.ctr = h("div", { class: "abs ctr" });
      S.num = h("div", { class: "num" });
      S.gstrip = h("div", { class: "gstrip" });
      for (let d = 0; d <= 9; d++) S.gstrip.append(h("div", { class: "gd", text: String(d) }));
      S.numGlow = h("div", { class: "numGlow" }, [S.gstrip]);
      S.strip = h("div", { class: "strip" });
      for (let d = 0; d <= 9; d++) S.strip.append(h("div", { class: "dg", text: String(d) }));
      S.odo = h("div", { class: "odo" }, [S.strip]);
      S.num.append(S.numGlow, S.odo);
      S.deCh = ["d", "e"].map((ch) => h("span", { class: "ch grad-silver", text: ch }));
      S.tenSlot = h("span", { class: "ten", text: "10" });
      S.de = h("div", { class: "de" }, [S.deCh[0], S.deCh[1], document.createTextNode(" "), S.tenSlot]);
      S.lbl = h("div", { class: "lbl" });
      S.lblWords = ["compraram", "este", "mês"].map((w) => h("span", { class: "wd", text: w }));
      S.lblWords.forEach((w, i) => {
        if (i) S.lbl.append(document.createTextNode(" "));
        S.lbl.append(w);
      });
      S.side = h("div", { class: "side" }, [S.de, S.lbl]);
      S.ctr.append(S.num, S.side);
      S.Ltext.append(S.ctr);

      // ---- leitura lateral do resultado (HUD, equilibra o lado direito do contador)
      S.stack = h("div", { class: "abs mono stack" }, [
        h("div", { class: "row" }, [
          h("span", { class: "sw", style: { background: "#b46cff", boxShadow: "0 0 10px 2px rgba(180,108,255,.85)" } }),
          h("span", { text: "Comprou" }),
          h("span", { class: "v", text: "07" }),
        ]),
        h("div", { class: "row" }, [
          h("span", { class: "sw", style: { border: "2px solid #ffb547" } }),
          h("span", { text: "Não comprou" }),
          h("span", { class: "v", text: "03" }),
        ]),
      ]);
      S.stackRows = [...S.stack.children];
      S.Ltext.append(S.stack);

      // ---- frase
      S.ph = h("div", { class: "abs ph" });
      S.phWords = buildLines(
        S.ph,
        [["Faturamento", "bom"], ["pode", "esconder", "uma"], ["carteira", [["encolhendo.", "amb"]]]],
        "grad-silver"
      );
      S.shrink = S.phWords[S.phWords.length - 1].firstChild;
      S.shrink.style.display = "inline-block";
      S.shrink.style.transformOrigin = "0 80%";
      S.Ltext.append(S.ph);

      // ---- mini gráfico em "tesoura": as linhas se cruzam (o "esconder") e abrem
      S.chart = h("div", { class: "abs chart" });
      const CH = 160, mid = 82, X1 = GW - 14, XC = Math.round(X1 * 0.35), A0 = 14, A1 = 26;
      const svg = h("svg", { width: GW, height: CH, viewBox: `0 0 ${GW} ${CH}` });
      const grid = h("path", { d: `M0 ${mid}H${X1}`, stroke: "rgba(220,194,255,.20)", "stroke-width": 1.5, "stroke-dasharray": "3 8", fill: "none" });
      const seg1 = (s) => `M0 ${mid + s * A0} C ${XC * 0.4} ${mid + s * A0}, ${XC * 0.69} ${mid + s * 7}, ${XC} ${mid}`;
      const seg2 = (s) => `C ${2 * XC - XC * 0.69} ${mid - s * 7}, ${X1 * 0.76} ${mid - s * 22}, ${X1} ${mid - s * A1}`;
      const silv = `${seg1(1)} ${seg2(1)}`;
      const amb = `${seg1(-1)} ${seg2(-1)}`;
      S.wedge = h("path", {
        d: `M${XC} ${mid} ${seg2(1)} L ${X1} ${mid + A1} C ${X1 * 0.76} ${mid + 22}, ${2 * XC - XC * 0.69} ${mid + 7}, ${XC} ${mid} Z`,
        fill: "url(#A-wedge)", opacity: 0,
      });
      const wedgeGrad = h("defs", {}, [
        h("linearGradient", { id: "A-wedge", x1: "0", y1: "0", x2: "1", y2: "0" }, [
          h("stop", { offset: "0", "stop-color": "#ffb547", "stop-opacity": 0 }),
          h("stop", { offset: "1", "stop-color": "#ffb547", "stop-opacity": 0.16 }),
        ]),
      ]);
      const ln = (d, stroke, w, extra = {}) => h("path", { d, pathLength: 1, "stroke-dasharray": "1 1", fill: "none", stroke, "stroke-width": w, "stroke-linecap": "round", ...extra });
      S.lineSg = ln(silv, "rgba(220,194,255,.12)", 11);
      S.lineAg = ln(amb, "rgba(255,181,71,.14)", 11);
      S.lineS = ln(silv, "#eeecf6", 5);
      S.lineA = ln(amb, "#ffb547", 5);
      S.xMark = h("path", { d: `M${XC} ${mid - 8}L${XC + 8} ${mid}L${XC} ${mid + 8}L${XC - 8} ${mid}Z`, fill: "#1a0b26", stroke: "#f1e4ff", "stroke-width": 2, opacity: 0, style: { transformBox: "fill-box", transformOrigin: "50% 50%" } });
      S.xRing = h("circle", { cx: XC, cy: mid, r: 8, fill: "none", stroke: "#dcc2ff", "stroke-width": 1.5, opacity: 0 });
      S.dotS = h("circle", { cx: X1, cy: mid - A1, r: 0, fill: "#ffffff" });
      S.dotA = h("circle", { cx: X1, cy: mid + A1, r: 0, fill: "#ffb547" });
      S.haloS = h("circle", { cx: X1, cy: mid - A1, r: 8, fill: "none", stroke: "#ffffff", "stroke-width": 1.5, opacity: 0 });
      S.haloA = h("circle", { cx: X1, cy: mid + A1, r: 8, fill: "none", stroke: "#ffb547", "stroke-width": 1.5, opacity: 0 });
      S.gapLine = h("path", { d: `M${X1} ${mid - A1}V${mid + A1}`, stroke: "rgba(255,213,150,.55)", "stroke-width": 1.5, "stroke-dasharray": "4 6", fill: "none", opacity: 0 });
      svg.append(wedgeGrad, grid, S.wedge, S.gapLine, S.lineSg, S.lineAg, S.lineS, S.lineA, S.xRing, S.xMark, S.haloS, S.haloA, S.dotS, S.dotA);
      S.chartGrid = grid;
      const rightPx = `${GW - X1 - 8}px`;
      S.labS = h("div", { class: "cl", text: "Faturamento ↑", style: { right: rightPx, top: `${mid - A1 - 14 - 36}px`, color: "#eeecf6" } });
      S.labA = h("div", { class: "cl", text: "Clientes comprando ↓", style: { right: rightPx, top: `${mid + A1 + 12}px`, color: "#ffc36b" } });
      S.chart.append(svg, S.labS, S.labA);
      S.Ltext.append(S.chart);
      S.chartY = { top: 1318, mid, A1 };
    },

    update(t, ctx) {
      const S = ctx.state;

      // ---------- medidas de layout (uma vez, independem de t) ----------
      if (!S.meas) {
        const offs = (el, stop) => {
          let x = 0, y = 0;
          for (let e = el; e && e !== stop; e = e.offsetParent) {
            x += e.offsetLeft;
            y += e.offsetTop;
          }
          return { x, y };
        };
        const a = offs(S.ten, S.Ltext), b = offs(S.tenSlot, S.Ltext);
        const fs0 = parseFloat(getComputedStyle(S.ten).fontSize) || 116;
        const fs1 = parseFloat(getComputedStyle(S.tenSlot).fontSize) || 120;
        // instante (local) em que o scan do motor cruza cada y (para o "acender" na saída)
        const crossT = (y) => {
          let lo = ctx.end - 0.45, hi = ctx.end + 0.45;
          for (let k = 0; k < 40; k++) {
            const m = (lo + hi) / 2;
            const v = SAIB.scanY ? SAIB.scanY(m, ctx.end) : null;
            if (v !== null && v < y) lo = m;
            else hi = m;
          }
          return lo - ctx.start;
        };
        S.meas = { dx: b.x - a.x, dy: b.y - a.y, s: fs1 / fs0, crossT };
        S.tiles.forEach((T) => (T.xT = crossT(T.cy)));
        S.numXT = crossT(480);
        S.chartXT = crossT(1400);
      }
      const M = S.meas;
      const xpulse = (tc) => {
        const p = prog(t, tc - 0.2, tc);
        return p * p;
      };

      // ---------- câmera: push-in com parallax por camada + deriva orgânica ----------
      const push = 0.012 * ease.inOutQuad(prog(t, -0.6, 5.3)) + 0.04 * ease.inOutQuad(prog(t, 5.3, 10.3));
      const lay = (el, k, sd) =>
        set(el, {
          x: noise(t * 0.15, sd) * 4 * k,
          y: noise(t * 0.15 + 9.3, sd + 3) * 4 * k + Math.sin(t * 0.45) * 2,
          scale: 1 + push * k,
        });
      lay(S.Lback, 1.0, 11);
      lay(S.Lhud, 1.0, 11);
      lay(S.Ltile, 1.12, 23);
      lay(S.Ltext, 0.85, 37);

      // ---------- batida do resultado ----------
      const bdt = t - BEAT;
      const bump = bdt > 0 && bdt < 0.5 ? Math.sin((Math.PI * bdt) / 0.5) : 0;

      // auras
      const lit = tw(t, SCAN_A + 0.3, 1.4, ease.inOutCubic);
      S.aura.style.opacity = ((0.8 + 0.2 * lit + 0.05 * Math.sin(t * 1.4)) * (1 + 0.35 * bump)).toFixed(3);
      S.auraAmb.style.opacity = (0.5 * tw(t, 6.2, 1.5, ease.inOutQuad)).toFixed(3);

      // ---------- HUD ----------
      S.corners.forEach((c, i) => {
        const p = tw(t, -1.1 + i * 0.07, 0.7, ease.inOutCubic);
        c.style.strokeDashoffset = (1 - p).toFixed(4);
        const pulse = t > SCAN_A - 0.5 && t < SCAN_B + 0.2 ? 1 : 0.72;
        c.setAttribute("opacity", (pulse * (0.85 + 0.15 * Math.sin(t * 2 + i))).toFixed(3));
      });
      S.ticksG.setAttribute("opacity", tw(t, -1.0, 0.7, ease.inOutCubic).toFixed(3));
      S.cross.forEach((g, i) => {
        const tile = S.tiles[i];
        const a = tw(t, -1.0 + i * 0.03, 0.5, ease.outCubic);
        const b = prog(t, tile.at - 0.05, tile.at + 0.25);
        g.setAttribute("opacity", (a * (1 - b)).toFixed(3));
      });
      S.probes.forEach((p, i) => {
        const span = BR.w - 2 * L0 - 120;
        const ph = (((t + i * 1.3) / 2.6) % 1 + 1) % 1;
        const u = ease.inOutQuad(ph);
        const vis = tw(t, 0.6, 0.6) * (1 - tw(t, SCAN_A - 0.4, 0.3)) + tw(t, SCAN_B + 0.6, 0.8) * 0.7;
        const op = 0.6 * vis * Math.sin(Math.PI * ph);
        if (i === 0) set(p, { x: BR.x + L0 + u * span, y: BR.y - 5, opacity: op });
        else set(p, { x: BR.x + BR.w - L0 - u * span, y: BR.y + BR.h - 5, sx: -1, sy: 1, opacity: op });
      });
      // leituras
      const nIn = S.tiles.filter((x) => t >= x.at + 0.3).length;
      const lFull = `Carteira · ${pad2(nIn)} PDVs`;
      const lTyped = typeOn(lFull, t, -0.95, 40);
      S.hudLt.textContent = lTyped.slice(0, lFull.length - 1);
      S.hudLs.textContent = lTyped.length >= lFull.length ? "s" : "";
      set(S.hudL, { opacity: tw(t, -1.0, 0.4) });
      let rStr, dots = "", blink = 1;
      if (t < 2.5) {
        rStr = typeOn("Scan · calibrando", t, -0.9, 34);
        const n = Math.floor(((t + 3) * 3.2) % 4);
        dots = rStr.length >= 17 ? ".".repeat(n) + " ".repeat(3 - n) : "";
      } else if (t < SCAN_A - 0.05) {
        rStr = typeOn("Scan · pronto", t, 2.5, 40);
        blink = 0.55 + 0.45 * (Math.sin(t * 5) > -0.2 ? 1 : 0.2);
      } else if (t < SCAN_B) rStr = `Scan · ${String(Math.round(scanP(t) * 100)).padStart(3, "0")}%`;
      else rStr = typeOn("Scan · concluído", t, SCAN_B, 40);
      S.hudRt.textContent = rStr;
      S.hudRd.textContent = dots;
      S.hudR.style.opacity = (tw(t, -0.95, 0.4) * blink).toFixed(3);
      const rf = bdt > 0 ? Math.exp(-bdt * 4) : 0;
      S.hudR.style.color = t >= SCAN_B ? "#f1e4ff" : "";
      S.hudR.style.textShadow = rf > 0.02 ? `0 0 ${(14 * rf).toFixed(1)}px rgba(241,228,255,${(0.95 * rf).toFixed(3)})` : "none";

      // ---------- gancho → contador (morph) ----------
      S.hlWords.forEach((w, i) => {
        const st = enterState(t, -1.0 + i * 0.08, { dur: 0.85, y: 60, blur: 12 });
        if (w === S.ten) {
          const m = tw(t, MORPH + 0.22, 0.62, ease.inOutCubic);
          const arc = Math.sin(Math.PI * m) * -18; // leve arco no trajeto
          set(w, { x: st.x + M.dx * m, y: st.y + M.dy * m + arc, opacity: st.opacity, blur: st.blur + Math.sin(Math.PI * m) * 1.2, scale: lerp(1, M.s, m) });
          return;
        }
        const k = i < 2 ? i + 1 : 0; // "clientes," sai primeiro, abrindo caminho para o 10
        if (t >= MORPH) {
          const at = MORPH + k * 0.04;
          const ex = exitState(t, at, { y: -40, dur: 0.4 });
          ex.opacity = 1 - tw(t, at, 0.3, ease.outQuad);
          set(w, addSt(st, ex));
        } else set(w, st);
      });
      // "de" entra por letra antes do 10 pousar
      S.deCh.forEach((c, i) => set(c, enterState(t, MORPH + 0.42 + i * 0.05, { dur: 0.7, y: 50, blur: 12 })));
      S.lblWords.forEach((w, i) => set(w, enterState(t, 4.85 + i * 0.06, { dur: 0.75, y: 36, blur: 10 })));

      // ---------- tiles ----------
      S.tiles.forEach((T, i) => {
        const e = spring(t - T.at, { freq: 1.7, damping: 0.52 });
        const op = prog(t, T.at, T.at + 0.22);
        const float = Math.sin(t * 1.25 + T.ph) * 2.4;
        const dt = t - T.hit;
        const Lp = T.ghost ? 0 : tw(t, T.hit, 0.32, ease.outCubic);
        const G = T.ghost ? tw(t, T.hit, 0.45, ease.outCubic) : 0;
        let sc = lerp(0.62, 1, e) + 0.055 * kick(dt) * (T.ghost ? 0.4 : 1);
        if (T.ghost) sc *= lerp(1, 0.955, G);
        let jx = 0;
        if (T.ghost && dt > 0 && dt < 0.32) jx = (hash(Math.floor(dt * 45) + i * 31) - 0.5) * 9 * (1 - dt / 0.32);
        set(T.el, { x: jx, y: (1 - e) * 46 + float, scale: sc, opacity: op, blur: (1 - clamp(e)) * 7 });
        // revelação do ícone: de baixo para cima, com linha de luz (mini-scan)
        const rv = tw(t, T.at + 0.04, 0.62, ease.inOutCubic);
        T.svg.style.clipPath = rv >= 1 ? "none" : `inset(${((1 - rv) * 100).toFixed(2)}% -4% -4% -4%)`;
        set(T.edge, { y: 15 + (1 - rv) * 106 - 1, opacity: rv > 0 && rv < 1 ? Math.sin(Math.PI * rv) * 0.95 : 0 });
        const breath = 0.84 + 0.16 * Math.sin(t * 2.1 + T.ph);
        // cor
        let col = C.neutral;
        if (Lp > 0) col = mix(C.neutral, C.lit, Lp);
        if (G > 0) col = mix(C.neutral, C.ghost, G);
        let iconOp = lerp(1, 0.6, G);
        if (T.ghost && dt > 0 && dt < 0.3) iconOp = hash(Math.floor(dt * 38) + i * 13) > 0.45 ? 1 : 0.35;
        T.svg.style.color = rgb(col);
        T.svg.style.opacity = iconOp.toFixed(3);
        T.svg.style.filter = Lp > 0.02 ? `drop-shadow(0 0 6px rgba(180,108,255,${(0.8 * Lp).toFixed(3)}))` : "none";
        T.wins.forEach((w) => (w.style.opacity = (0.55 * Lp * (0.85 + 0.15 * breath)).toFixed(3)));
        T.awf.forEach((w) => (w.style.opacity = ((0.16 + 0.24 * Lp - 0.08 * G) * prog(rv, 0.3, 1)).toFixed(3)));
        // engine scan (saída): acende ao ser cruzado
        const xp = xpulse(T.xT);
        // cartão
        let border;
        if (T.ghost) border = rgba(mix(C.hair, C.amber, G), lerp(0.13, 0.2, G));
        else border = rgba(mix(C.hair, C.neon, Lp), lerp(0.13, 0.9, Lp));
        T.card.style.borderColor = border;
        T.litbg.style.opacity = (Lp * (0.8 + 0.2 * breath)).toFixed(3);
        T.hi.style.opacity = Lp.toFixed(3);
        T.ghostbg.style.opacity = G.toFixed(3);
        T.flash.style.opacity = ((dt > 0 && !T.ghost ? Math.exp(-dt * 7) * 0.85 : 0) + (T.ghost ? 0 : 0.45 * xp)).toFixed(3);
        T.glow.style.opacity = (Lp * breath * 0.95 * (1 + 0.3 * bump) + (T.ghost ? 0 : 0.4 * xp)).toFixed(3);
        if (T.dash) T.dash.style.opacity = (G * (0.55 + 0.15 * breath) + 0.4 * xp).toFixed(3);
        // brilho especular atravessando o vidro (espera da pergunta)
        let shOp = 0, shX = -60;
        for (const s0 of [1.85, 3.2]) {
          const sp = prog(t, s0 + T.c * 0.12, s0 + T.c * 0.12 + 0.6);
          if (sp > 0 && sp < 1) {
            shX = lerp(-70, TS + 30, ease.inOutQuad(sp));
            shOp = Math.sin(Math.PI * sp);
          }
        }
        set(T.sheen, { x: shX, rot: 18, opacity: shOp });
        // onda (acerto) / anel de foco âmbar (batida, só fantasmas)
        if (!T.ghost && dt > 0 && dt < 0.9) {
          const rp = ease.outCubic(prog(dt, 0, 0.9));
          set(T.ripple, { scale: 1 + 0.14 * rp, opacity: Math.pow(1 - rp, 2.4) * 0.8 });
        } else if (T.ghost) {
          const fd = bdt - T.gk * 0.08;
          if (fd > 0 && fd < 0.7) {
            const rp = ease.outCubic(fd / 0.7);
            set(T.ripple, { scale: 1 + 0.14 * rp, opacity: (1 - rp) * 0.8 });
          } else T.ripple.style.opacity = "0";
        } else T.ripple.style.opacity = "0";
        // selo
        const bt = t - T.hit - 0.1;
        const bs = spring(bt, { freq: 2.3, damping: 0.5 });
        set(T.badge, { scale: bt > 0 ? bs : 0, opacity: prog(bt, 0, 0.12) });
        if (T.chk) T.chk.style.strokeDashoffset = (1 - tw(t, T.hit + 0.18, 0.3, ease.outCubic)).toFixed(4);
      });

      // ---------- scan local ----------
      if (t > SCAN_A - 0.55 && t < SCAN_B + 0.45) {
        const arm = tw(t, SCAN_A - 0.5, 0.5, ease.outCubic);
        const out = tw(t, SCAN_B - 0.05, 0.4, ease.inCubic);
        S.scan.style.display = "block";
        set(S.scan, { x: scanX(t), sy: arm, origin: "0 50%", opacity: (1 - out) * (0.6 + 0.4 * arm) });
        const v = t > SCAN_A && t < SCAN_B ? 1 : 0;
        S.scanTrail.style.opacity = (v * Math.sin(Math.PI * scanP(t)) * 1.2).toFixed(3);
      } else S.scan.style.display = "none";

      // ---------- pergunta ----------
      S.qWords.forEach((w, i) => {
        const st = enterState(t, Q_IN + i * 0.065, { dur: 0.8, y: 64, blur: 13 });
        if (t >= Q_OUT) set(w, addSt(st, exitState(t, Q_OUT + i * 0.02, { y: -40, dur: 0.4 })));
        else set(w, st);
      });
      set(S.uline, { sx: tw(t, 1.6, 0.55, ease.inOutCubic), sy: 1 });
      S.uline.style.opacity = (0.8 + 0.2 * Math.sin(t * 2.4)).toFixed(3);

      // ---------- contador ----------
      const valAt = (tt) => S.hits.reduce((s, h0) => s + ease.outQuart(prog(tt, h0, h0 + 0.2)), 0);
      const val = valAt(t);
      const vel = (val - valAt(t - 1 / 60)) * 60;
      set(S.num, enterState(t, MORPH + 0.3, { dur: 0.75, y: 70, blur: 14 }));
      set(S.strip, { y: -val * 360 });
      set(S.gstrip, { y: -val * 360 });
      S.odo.style.filter = Math.abs(vel) > 0.5 ? `blur(${Math.min(3, Math.abs(vel) * 0.5).toFixed(2)}px)` : "none";
      const lastHit = S.hits.filter((x) => x <= t).pop();
      const hitPop = lastHit !== undefined ? kick(t - lastHit, 14, 6) : 0;
      const beatPop = kick(bdt, 9, 4.2);
      const nsc = 1 + 0.035 * hitPop + 0.155 * beatPop;
      // o pop é aplicado num wrapper interno para não brigar com a entrada
      S.odo.style.transform = S.numGlow.style.transform = `scale(${nsc.toFixed(4)})`;
      S.odo.style.transformOrigin = "50% 80%";
      S.numGlow.style.transformOrigin = "50% 68%";
      let g;
      if (t < BEAT) g = 0.45 + 0.25 * Math.max(0, hitPop);
      else {
        const rise = tw(t, BEAT, 0.12, ease.outCubic);
        g = rise < 1 ? lerp(0.45, 1, rise) : 0.7 + 0.3 * Math.exp(-(bdt - 0.12) * 3);
      }
      S.numGlow.style.opacity = clamp(g * (0.9 + 0.1 * Math.sin(t * 2.2)) + 0.5 * xpulse(S.numXT)).toFixed(3);

      // leitura lateral
      S.stackRows.forEach((r, i) => set(r, enterState(t, BEAT + 0.05 + i * 0.1, { dur: 0.6, y: 20, x: 16, blur: 8 })));

      // ---------- frase ----------
      S.phWords.forEach((w, i) => set(w, enterState(t, PH_IN + i * 0.05, { dur: 0.8, y: 64, blur: 13 })));
      const sq = tw(t, 6.5, 1.4, ease.inOutCubic);
      S.shrink.style.letterSpacing = `${lerp(-0.012, -0.05, sq).toFixed(4)}em`;
      set(S.shrink, { scale: lerp(1, 0.96, sq) });

      // ---------- gráfico ----------
      const cd = tw(t, 6.0, 1.3, ease.inOutCubic);
      [S.lineS, S.lineA, S.lineSg, S.lineAg].forEach((p) => (p.style.strokeDashoffset = (1 - cd).toFixed(4)));
      S.chartGrid.setAttribute("opacity", tw(t, 5.9, 0.6).toFixed(3));
      S.wedge.setAttribute("opacity", tw(t, 6.9, 0.9, ease.inOutQuad).toFixed(3));
      S.gapLine.setAttribute("opacity", tw(t, 7.35, 0.5).toFixed(3));
      // cruzamento: marca em losango quando as linhas se cruzam
      const XT = 6.58;
      const xm = spring(t - XT, { freq: 2.4, damping: 0.5 });
      S.xMark.setAttribute("opacity", (t > XT ? clamp(prog(t, XT, XT + 0.1)) * 0.9 : 0).toFixed(3));
      S.xMark.style.transform = `scale(${(t > XT ? xm : 0).toFixed(3)})`;
      const xr = prog(t, XT, XT + 0.8);
      S.xRing.setAttribute("r", (8 + 22 * ease.outCubic(xr)).toFixed(2));
      S.xRing.setAttribute("opacity", (xr > 0 && xr < 1 ? (1 - xr) * 0.7 : 0).toFixed(3));
      const dsc = t > 7.2 ? spring(t - 7.2, { freq: 2.2, damping: 0.5 }) : 0;
      [S.dotS, S.dotA].forEach((d) => d.setAttribute("r", (8 * dsc).toFixed(2)));
      const hp = ((t - 7.3) % 1.6 + 1.6) % 1.6 / 1.6;
      const cx = xpulse(S.chartXT);
      [S.haloS, S.haloA].forEach((d) => {
        d.setAttribute("r", (8 + 18 * ease.outCubic(hp)).toFixed(2));
        d.setAttribute("opacity", clamp((t > 7.3 ? Math.pow(1 - hp, 2) * 0.6 : 0) + 0.6 * cx).toFixed(3));
      });
      set(S.labS, enterState(t, 7.05, { dur: 0.7, y: 20, blur: 8 }));
      set(S.labA, enterState(t, 7.15, { dur: 0.7, y: -20, blur: 8 }));
    },
  });
})();
