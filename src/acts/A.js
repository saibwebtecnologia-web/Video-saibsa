/*
 * ATO A — "O número" (0,0–9,8 s · dur 9,8)
 *
 * Coreografia (tempo local, s):
 *  -0.40–0.50  HUD do scanner liga: cantos de mira desenham, cruzes de registro nos 10 slots, leituras digitam
 *  -0.35–0.25  "De cada / 10 clientes," entra por palavra (o quadro 0 já tem o gancho quase todo)
 *   0.40–1.55  10 fachadas de PDV entram em mola escalonada (diagonal), com o traço se desenhando
 *   1.20–1.80  "quantos compraram / de você este mês?" por palavra; 1.95 sublinhado neon em "este mês"
 *   1.8–4.3    pergunta parada (leitura) — HUD respira, ícones flutuam sutilmente
 *   3.85–4.35  linha de scan local arma na borda esquerda
 *   4.35–5.95  scan vertical varre a grade: 7 acendem (neon, check, onda), 3 viram fantasma (âmbar)
 *   4.50/4.60  gancho e pergunta saem; 4.62 contador "0 de 10" entra e rola (odômetro) até 7
 *   5.00–5.80  "Faturamento bom pode esconder uma carteira encolhendo." por palavra
 *   5.75–7.10  mini gráfico: faturamento ↑ (prata) × clientes comprando ↓ (âmbar)
 *   6.4–7.8    "encolhendo." encolhe de leve (tipografia cinética)
 *   7.1–10.25  composição final viva (respiração, push-in lento) até o scan do motor passar
 */
(function () {
  const { h, set, tw, ease, prog, lerp, clamp, spring, enterState, exitState, hash } = SAIB.fx;

  // ---------- geometria ----------
  const GX = 124, GY = 690, TS = 144, GAPX = 28, GAPY = 30, COLS = 5;
  const GW = COLS * TS + (COLS - 1) * GAPX; // 832
  const GH = 2 * TS + GAPY; // 318
  const tileX = (c) => GX + c * (TS + GAPX);
  const tileY = (r) => GY + r * (TS + GAPY);
  const BR = { x: GX - 22, y: GY - 22, w: GW + 44, h: GH + 44 }; // colchetes do HUD

  // tempos-chave
  const SCAN_A = 4.35, SCAN_B = 5.95;
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
    ghost: [86, 72, 108],
    neon: [180, 108, 255],
    amber: [255, 181, 71],
    hair: [255, 255, 255],
  };
  const mix = (a, b, p) => a.map((v, i) => Math.round(lerp(v, b[i], p)));
  const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a).toFixed(3)})`;

  // ---------- ícones: fachadas de PDV em linha fina (viewBox 120) ----------
  const AWN = (() => {
    // toldo com 8 gomos e listras alternadas
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
    // 0 · bar: platibanda com bloco, letreiro em pílula, janela com garrafas, porta à direita
    `<path d="M14 24H106M20 24V44M100 24V44"/><path d="M30 24V17H90V24"/><rect x="36" y="29" width="48" height="10" rx="5"/>
     ${WIN(28, 32, `<path d="M28 84H60"/><path d="M35 84v-8M42 84v-10M49 84v-8M54 84v-6"/>`)}${DOOR(70)}`,
    // 1 · mercado: faixa larga com carrinho, duas vitrines e porta central
    `<path d="M14 20H106M20 20V44M100 20V44"/><rect x="28" y="24" width="64" height="16" rx="3"/>
     <path d="M48 27.5h3.5l2.6 7.2h10.4l2.6-5.4H53"/><circle cx="56" cy="37.6" r="1.5"/><circle cx="64.5" cy="37.6" r="1.5"/>
     ${WIN(26, 20, `<path d="M26 80H46"/>`)}${WIN(74, 20, `<path d="M74 80H94"/>`)}${DOOR(50)}`,
    // 2 · adega: frontão triangular com óculo, porta à esquerda, vitrine com garrafas
    `<path d="M14 44L60 12L106 44"/><circle cx="60" cy="31" r="6.5"/><path d="M53.5 31H66.5M60 24.5V37.5"/>
     ${DOOR(30)}${WIN(60, 34, BOTTLES(68))}`,
    // 3 · padaria: platibanda em arco com pão, vitrine larga
    `<path d="M18 44V30Q60 4 102 30V44"/><path d="M47 37a13 9 0 0 1 26 0Z"/><path d="M54 32l3-4M60 31l3-4M66 32l2-3"/>
     ${WIN(26, 36, `<path d="M26 80H62"/><path d="M33 80a4 3 0 0 1 8 0M45 80a4 3 0 0 1 8 0"/>`)}${DOOR(72)}`,
    // 4 · conveniência: letreiro no telhado sobre postes, porta à esquerda, gôndolas
    `<path d="M14 30H106M20 30V44M100 30V44"/><path d="M38 30V23M82 30V23"/><rect x="30" y="11" width="60" height="12" rx="3"/>
     <circle cx="50" cy="17" r="1.6"/><circle cx="60" cy="17" r="1.6"/><circle cx="70" cy="17" r="1.6"/>
     ${DOOR(28)}${WIN(58, 36, `<path d="M58 80H94"/><path d="M64 80v-6M70 80v-8M76 80v-5M82 80v-7M88 80v-5"/>`)}`,
  ];

  // ---------- texto por palavra ----------
  // linhas: array de linhas; cada linha é array de palavras; palavra = string | [ [texto, classe], ... ]
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

  const CSS = `
  [data-act="A"] .cam{position:absolute;inset:0;transform-origin:540px 900px}
  [data-act="A"] .abs{position:absolute}
  [data-act="A"] .wd{display:inline-block;white-space:nowrap;will-change:transform}
  [data-act="A"] .ln{display:block;white-space:nowrap}
  [data-act="A"] .hl{left:${GX}px;top:378px}
  [data-act="A"] .hl .l1{font-family:var(--font-display);font-weight:300;font-size:86px;line-height:1.0;letter-spacing:-0.005em}
  [data-act="A"] .hl .l2{font-family:var(--font-display);font-weight:800;font-size:116px;line-height:1.02;letter-spacing:-0.015em;margin-top:2px}
  [data-act="A"] .soft{color:var(--silver-2)}
  [data-act="A"] .q{left:${GX}px;top:1112px;font-family:var(--font-display);font-weight:800;font-size:84px;line-height:1.08;letter-spacing:-0.012em}
  [data-act="A"] .neonw{position:relative;display:inline-block}
  [data-act="A"] .neonw .tx{background:linear-gradient(180deg,#fbf5ff 0%,#d6a8ff 48%,#a456f5 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
  [data-act="A"] .uline{position:absolute;left:2px;right:2px;bottom:4px;height:6px;border-radius:6px;
    background:linear-gradient(90deg,#8b2bd9,#d9b8ff);box-shadow:0 0 18px 2px rgba(180,108,255,.85);transform-origin:0 50%}
  [data-act="A"] .tile{position:absolute;width:${TS}px;height:${TS}px}
  [data-act="A"] .tile .glow{position:absolute;left:-46px;top:-46px;width:${TS + 92}px;height:${TS + 92}px;border-radius:50%;
    background:radial-gradient(closest-side,rgba(180,108,255,.55),rgba(139,43,217,.22) 55%,transparent 100%)}
  [data-act="A"] .tile .card{position:absolute;inset:0;border-radius:32px;border:1.5px solid rgba(255,255,255,.13);
    background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));overflow:hidden}
  [data-act="A"] .tile .litbg{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 100%,rgba(180,108,255,.38),rgba(98,9,137,.14) 60%,rgba(98,9,137,0) 100%)}
  [data-act="A"] .tile .ghostbg{position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,2,13,.35),rgba(7,2,13,.55))}
  [data-act="A"] .tile .flash{position:absolute;inset:0;background:radial-gradient(closest-side,rgba(255,255,255,.9),rgba(220,194,255,.35) 60%,transparent)}
  [data-act="A"] .tile svg.ic{position:absolute;left:18px;top:16px;width:108px;height:108px;overflow:visible}
  [data-act="A"] .tile svg.ic *{fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
  [data-act="A"] .tile svg.ic .aw-f{fill:currentColor;stroke:none;opacity:.16}
  [data-act="A"] .tile svg.ic .win{fill:url(#A-winGrad);stroke:none;opacity:0}
  [data-act="A"] .tile .ripple{position:absolute;inset:0;border-radius:32px;border:2px solid rgba(214,168,255,.95);opacity:0}
  [data-act="A"] .tile .badge{position:absolute;right:-13px;top:-13px;width:44px;height:44px;opacity:0}
  [data-act="A"] .tile .badge svg{width:44px;height:44px;overflow:visible}
  [data-act="A"] .mono{font-family:var(--font-mono);font-size:22px;letter-spacing:.2em;text-transform:uppercase;white-space:nowrap}
  [data-act="A"] .hudl{left:${BR.x}px;top:${BR.y - 40}px;color:var(--lilac)}
  [data-act="A"] .hudr{right:${1080 - (BR.x + BR.w)}px;top:${BR.y - 40}px;color:var(--lilac);text-align:right}
  [data-act="A"] .dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--neon);box-shadow:0 0 12px 2px rgba(180,108,255,.9);margin-right:14px;vertical-align:2px}
  [data-act="A"] .legend{left:${BR.x}px;top:${BR.y + BR.h + 18}px;color:var(--silver-2);display:flex;gap:40px;align-items:center}
  [data-act="A"] .legend .k{display:flex;align-items:center;gap:14px}
  [data-act="A"] .legend .sw{width:14px;height:14px;border-radius:50%}
  [data-act="A"] .scan{left:0;top:${BR.y - 34}px;width:0;height:${BR.h + 68}px}
  [data-act="A"] .scan .trail{position:absolute;right:0;top:0;width:300px;height:100%;
    background:linear-gradient(90deg,rgba(180,108,255,0),rgba(180,108,255,.08) 55%,rgba(220,194,255,.28) 100%);mix-blend-mode:screen}
  [data-act="A"] .scan .core{position:absolute;left:-1.5px;top:0;width:3px;height:100%;border-radius:3px;
    background:linear-gradient(180deg,rgba(255,255,255,0),#fff 12%,#fff 88%,rgba(255,255,255,0));
    box-shadow:0 0 16px 3px rgba(180,108,255,.95),0 0 60px 12px rgba(139,43,217,.55)}
  [data-act="A"] .scan .cap{position:absolute;left:-7px;width:14px;height:14px;transform:rotate(45deg);border:2px solid #f1e4ff;box-shadow:0 0 12px rgba(180,108,255,.9)}
  [data-act="A"] .ctr{left:${GX - 6}px;top:356px;display:flex;align-items:flex-end;gap:34px}
  [data-act="A"] .num{position:relative;width:196px;height:286px}
  [data-act="A"] .odo{position:absolute;inset:0;overflow:hidden}
  [data-act="A"] .strip{position:absolute;left:0;top:0;width:100%}
  [data-act="A"] .dg{height:286px;line-height:286px;font-family:var(--font-display);font-weight:900;font-size:340px;text-align:center;
    font-variant-numeric:tabular-nums;background:linear-gradient(180deg,#fbf5ff 8%,#cf9bff 50%,#9a45f0 92%);-webkit-background-clip:text;background-clip:text;color:transparent}
  [data-act="A"] .numGlow{position:absolute;inset:-40px;line-height:366px;text-align:center;font-family:var(--font-display);font-weight:900;font-size:340px;
    color:#a456f5;filter:blur(34px)}
  [data-act="A"] .side{padding-bottom:26px}
  [data-act="A"] .de{font-family:var(--font-display);font-weight:800;font-size:128px;line-height:.9;letter-spacing:-0.01em}
  [data-act="A"] .lbl{margin-top:20px;font-family:var(--font-text);font-weight:600;font-size:38px;color:var(--lilac);letter-spacing:.005em}
  [data-act="A"] .ph{left:${GX}px;top:1108px;font-family:var(--font-display);font-weight:800;font-size:68px;line-height:1.07;letter-spacing:-0.012em}
  [data-act="A"] .amb{background:linear-gradient(180deg,#ffe2b0 0%,#ffb547 55%,#ff8a3d 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
  [data-act="A"] .chart{left:${GX}px;top:1350px;width:${GW}px;height:128px}
  [data-act="A"] .chart svg{position:absolute;left:0;top:0;overflow:visible}
  [data-act="A"] .chart .cl{position:absolute;font-family:var(--font-text);font-weight:600;font-size:30px;white-space:nowrap}
  `;

  SAIB.act("A", {
    css: CSS,
    build(root, ctx) {
      const S = ctx.state;
      const cam = h("div", { class: "cam" });
      root.append(cam);
      S.cam = cam;

      // defs SVG compartilhadas (gradiente das vitrines acesas)
      cam.append(
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
          left: "140px", top: "1240px", width: "800px", height: "360px",
          background: "radial-gradient(closest-side, rgba(255,138,61,.10), transparent)",
        },
      });
      cam.append(S.aura, S.auraAmb);

      // ---- gancho
      S.hl = h("div", { class: "abs hl" });
      S.hlWords = buildLines(S.hl, [["De", "cada"]], "soft");
      // segunda linha com outra classe
      const l2 = buildLines(S.hl, [["10", "clientes,"]], "grad-silver");
      S.hl.children[0].classList.add("l1");
      S.hl.children[1].classList.add("l2");
      S.hlWords = S.hlWords.concat(l2);
      cam.append(S.hl);

      // ---- HUD: colchetes, régua, cruzes de registro
      const L = 38;
      const { x: bx, y: by, w: bw, h: bh } = BR;
      const hud = h("svg", {
        class: "abs",
        width: 1080, height: 1920,
        style: { left: 0, top: 0, overflow: "visible" },
      });
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
      S.ticks = h("path", { d: ticks, stroke: "#dcc2ff", "stroke-width": 1.5, opacity: 0.32 });
      S.ticksG = h("g", {}, [S.ticks]);
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
      cam.append(hud);

      S.hudL = h("div", { class: "abs mono hudl" }, [h("span", { class: "dot" }), (S.hudLt = h("span"))]);
      S.hudR = h("div", { class: "abs mono hudr" }, [(S.hudRt = h("span"))]);
      cam.append(S.hudL, S.hudR);

      // ---- grade de PDVs
      S.tiles = [];
      for (let i = 0; i < 10; i++) {
        const c = i % 5, r = Math.floor(i / 5);
        const tile = h("div", { class: "tile", style: { left: `${tileX(c)}px`, top: `${tileY(r)}px` } });
        const glow = h("div", { class: "glow" });
        const card = h("div", { class: "card" });
        const litbg = h("div", { class: "litbg" });
        const ghostbg = h("div", { class: "ghostbg" });
        const flash = h("div", { class: "flash" });
        card.append(litbg, ghostbg, flash);
        const svg = h("svg", { class: "ic", viewBox: "0 0 120 120", html: BASE + AWN + ICON[TYPES[i]] });
        // traço que se desenha
        const strokes = [...svg.querySelectorAll("path:not(.aw-f), rect:not(.win), circle")];
        strokes.forEach((s) => {
          s.setAttribute("pathLength", "1");
          s.style.strokeDasharray = "1 1";
        });
        const wins = [...svg.querySelectorAll(".win")];
        const awf = [...svg.querySelectorAll(".aw-f")];
        const ripple = h("div", { class: "ripple" });
        const ghost = GHOST.has(i);
        const badge = h("div", { class: "badge" });
        badge.innerHTML = ghost
          ? `<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="17" fill="#1a0b26" stroke="#ffb547" stroke-width="2.5"/><path d="M15 22H29" stroke="#ffb547" stroke-width="3" stroke-linecap="round"/></svg>`
          : `<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="#b46cff"/><circle cx="22" cy="22" r="18" fill="none" stroke="#f1e4ff" stroke-width="1.5" opacity=".7"/><path class="chk" d="M14.5 22.5l5 5 10-11" pathLength="1" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 1"/></svg>`;
        tile.append(glow, ripple, card, svg, badge);
        cam.append(tile);
        // instante em que a linha de scan cruza o centro da coluna (bisseção — feito uma vez, determinístico)
        const cx = tileX(c) + TS / 2;
        let lo = SCAN_A, hi = SCAN_B;
        for (let k = 0; k < 40; k++) {
          const m = (lo + hi) / 2;
          if (scanX(m) < cx) lo = m;
          else hi = m;
        }
        S.tiles.push({
          el: tile, glow, card, litbg, ghostbg, flash, svg, strokes, wins, awf, ripple, badge,
          chk: badge.querySelector(".chk"), ghost, c, r,
          at: 0.4 + c * 0.085 + r * 0.13, // entrada
          hit: lo + r * 0.035, // toque do scan
          ph: hash(i + 7) * 6.28,
        });
      }
      // gatilhos do contador
      S.hits = S.tiles.filter((x) => !x.ghost).map((x) => x.hit).sort((a, b) => a - b);

      // ---- scan local
      S.scan = h("div", { class: "abs scan" }, [
        h("div", { class: "trail" }),
        h("div", { class: "core" }),
        h("div", { class: "cap", style: { top: "-7px" } }),
        h("div", { class: "cap", style: { bottom: "-7px" } }),
      ]);
      S.scanTrail = S.scan.children[0];
      cam.append(S.scan);

      // ---- legenda
      S.legend = h("div", { class: "abs mono legend" }, [
        h("div", { class: "k" }, [
          h("span", { class: "sw", style: { background: "#b46cff", boxShadow: "0 0 12px 2px rgba(180,108,255,.85)" } }),
          h("span", { text: "Comprou" }),
        ]),
        h("div", { class: "k" }, [
          h("span", { class: "sw", style: { border: "2.5px solid #ffb547" } }),
          h("span", { text: "Não comprou", style: { color: "#ffd08a" } }),
        ]),
      ]);
      S.legendK = [...S.legend.children];
      cam.append(S.legend);

      // ---- pergunta
      S.q = h("div", { class: "abs q" });
      const neon = h("span", { class: "neonw" }, [h("span", { class: "tx", text: "este mês" }), (S.uline = h("span", { class: "uline" }))]);
      S.qWords = buildLines(S.q, [["quantos", "compraram"], ["de", "você"]], "grad-silver");
      const l2q = S.q.children[1];
      const unit = h("span", { class: "wd" }, [neon, h("span", { class: "grad-silver", text: "?" })]);
      l2q.append(document.createTextNode(" "), unit);
      S.qWords.push(unit);
      cam.append(S.q);

      // ---- contador "7 de 10"
      S.ctr = h("div", { class: "abs ctr" });
      S.num = h("div", { class: "num" });
      S.numGlow = h("div", { class: "numGlow", text: "0" });
      S.strip = h("div", { class: "strip" });
      for (let d = 0; d <= 9; d++) S.strip.append(h("div", { class: "dg", text: String(d) }));
      S.odo = h("div", { class: "odo" }, [S.strip]);
      S.num.append(S.numGlow, S.odo);
      S.de = h("div", { class: "de grad-silver", text: "de 10" });
      S.lbl = h("div", { class: "lbl", text: "compraram este mês" });
      S.side = h("div", { class: "side" }, [S.de, S.lbl]);
      S.ctr.append(S.num, S.side);
      cam.append(S.ctr);

      // ---- frase
      S.ph = h("div", { class: "abs ph" });
      S.phWords = buildLines(
        S.ph,
        [["Faturamento", "bom"], ["pode", "esconder", "uma"], ["carteira", [["encolhendo.", "amb"]]]],
        "grad-silver"
      );
      S.shrink = S.phWords[S.phWords.length - 1].firstChild;
      S.shrink.style.display = "inline-block";
      S.shrink.style.transformOrigin = "0 70%";
      cam.append(S.ph);

      // ---- mini gráfico
      S.chart = h("div", { class: "abs chart" });
      const CH = 128, mid = 64;
      const svg = h("svg", { width: GW, height: CH, viewBox: `0 0 ${GW} ${CH}` });
      const X1 = GW - 14;
      const grid = h("path", {
        d: `M0 ${mid}H${X1}`, stroke: "rgba(220,194,255,.22)", "stroke-width": 1.5, "stroke-dasharray": "3 8", fill: "none",
      });
      const silv = `M0 ${mid} C 140 ${mid - 2}, 240 ${mid - 10}, 360 ${mid - 20} S 600 ${mid - 34}, ${X1} ${mid - 52}`;
      const amb = `M0 ${mid} C 140 ${mid + 2}, 240 ${mid + 10}, 360 ${mid + 20} S 600 ${mid + 34}, ${X1} ${mid + 52}`;
      S.wedge = h("path", {
        d: `${silv} L ${X1} ${mid + 52} C 600 ${mid + 34}, 520 ${mid + 30}, 360 ${mid + 20} S 140 ${mid + 2}, 0 ${mid} Z`,
        fill: "url(#A-wedge)", opacity: 0,
      });
      const wedgeGrad = h("defs", {}, [
        h("linearGradient", { id: "A-wedge", x1: "0", y1: "0", x2: "1", y2: "0" }, [
          h("stop", { offset: "0", "stop-color": "#ffb547", "stop-opacity": 0 }),
          h("stop", { offset: "1", "stop-color": "#ffb547", "stop-opacity": 0.16 }),
        ]),
      ]);
      S.lineS = h("path", { d: silv, pathLength: 1, "stroke-dasharray": "1 1", fill: "none", stroke: "#eeecf6", "stroke-width": 4, "stroke-linecap": "round" });
      S.lineA = h("path", { d: amb, pathLength: 1, "stroke-dasharray": "1 1", fill: "none", stroke: "#ffb547", "stroke-width": 4, "stroke-linecap": "round" });
      S.lineSg = h("path", { d: silv, pathLength: 1, "stroke-dasharray": "1 1", fill: "none", stroke: "rgba(220,194,255,.45)", "stroke-width": 12, "stroke-linecap": "round", style: { filter: "blur(6px)" } });
      S.lineAg = h("path", { d: amb, pathLength: 1, "stroke-dasharray": "1 1", fill: "none", stroke: "rgba(255,181,71,.5)", "stroke-width": 12, "stroke-linecap": "round", style: { filter: "blur(6px)" } });
      S.dotS = h("circle", { cx: X1, cy: mid - 52, r: 8, fill: "#ffffff" });
      S.dotA = h("circle", { cx: X1, cy: mid + 52, r: 8, fill: "#ffb547" });
      S.haloS = h("circle", { cx: X1, cy: mid - 52, r: 8, fill: "none", stroke: "#ffffff", "stroke-width": 2 });
      S.haloA = h("circle", { cx: X1, cy: mid + 52, r: 8, fill: "none", stroke: "#ffb547", "stroke-width": 2 });
      svg.append(wedgeGrad, grid, S.wedge, S.lineSg, S.lineAg, S.lineS, S.lineA, S.haloS, S.haloA, S.dotS, S.dotA);
      S.chartGrid = grid;
      S.labS = h("div", { class: "cl", text: "Faturamento ↑", style: { left: "0px", top: "-8px", color: "#eeecf6" } });
      S.labA = h("div", { class: "cl", text: "Clientes comprando ↓", style: { left: "0px", top: `${CH - 30}px`, color: "#ffc36b" } });
      S.chart.append(svg, S.labS, S.labA);
      cam.append(S.chart);
    },

    update(t, ctx) {
      const S = ctx.state;

      // ---------- câmera: push-in lento + deriva ----------
      const push = ease.inOutQuad(prog(t, -0.45, 10.3));
      set(S.cam, { scale: 1 + 0.022 * push, y: Math.sin(t * 0.45) * 3 });

      // auras
      const lit = tw(t, SCAN_A + 0.3, 1.6, ease.inOutCubic);
      S.aura.style.opacity = (0.55 + 0.45 * lit + 0.06 * Math.sin(t * 1.4)).toFixed(3);
      S.auraAmb.style.opacity = tw(t, 5.8, 1.5, ease.inOutQuad).toFixed(3);

      // ---------- HUD ----------
      S.corners.forEach((c, i) => {
        const p = tw(t, -0.42 + i * 0.07, 0.75, ease.inOutCubic);
        c.style.strokeDashoffset = (1 - p).toFixed(4);
        const pulse = t > SCAN_A - 0.5 && t < SCAN_B + 0.2 ? 1 : 0.72;
        c.setAttribute("opacity", (pulse * (0.85 + 0.15 * Math.sin(t * 2 + i))).toFixed(3));
      });
      const tk = tw(t, -0.1, 0.9, ease.inOutCubic);
      S.ticksG.setAttribute("opacity", tk.toFixed(3));
      S.cross.forEach((g, i) => {
        const tile = S.tiles[i];
        const a = tw(t, -0.35 + i * 0.03, 0.5, ease.outCubic);
        const b = prog(t, tile.at - 0.05, tile.at + 0.25);
        g.setAttribute("opacity", (a * (1 - b)).toFixed(3));
      });
      // leituras
      const nIn = S.tiles.filter((x) => t >= x.at + 0.05).length;
      const lStr = `Carteira · ${pad2(nIn)} PDVs`;
      S.hudLt.textContent = typeOn(lStr, t, -0.2, 40);
      set(S.hudL, { opacity: tw(t, -0.3, 0.4) });
      let rStr;
      if (t < SCAN_A - 0.05) rStr = typeOn("Scan · pronto", t, 0.15, 30);
      else if (t < SCAN_B) rStr = `Scan · ${String(Math.round(scanP(t) * 100)).padStart(3, "0")}%`;
      else rStr = typeOn("Scan · concluído", t, SCAN_B, 40);
      S.hudRt.textContent = rStr;
      const blink = t < SCAN_A ? 0.55 + 0.45 * (Math.sin(t * 5) > -0.2 ? 1 : 0.2) : 1;
      S.hudR.style.opacity = (tw(t, 0.1, 0.4) * blink).toFixed(3);
      S.hudR.style.color = t >= SCAN_B ? "#f1e4ff" : "";

      // ---------- gancho ----------
      S.hlWords.forEach((w, i) => {
        const st = enterState(t, -0.36 + i * 0.09, { dur: 0.8, y: 60, blur: 12 });
        if (t >= 4.5) {
          const o = exitState(t, 4.5 + i * 0.03, { y: -40 });
          st.y += o.y; st.opacity *= o.opacity; st.blur += o.blur;
        }
        set(w, st);
      });

      // ---------- tiles ----------
      S.tiles.forEach((T, i) => {
        const e = spring(t - T.at, { freq: 1.7, damping: 0.52 });
        const op = prog(t, T.at, T.at + 0.22);
        const float = Math.sin(t * 1.25 + T.ph) * 2.4;
        const dt = t - T.hit;
        const L = T.ghost ? 0 : tw(t, T.hit, 0.32, ease.outCubic);
        const G = T.ghost ? tw(t, T.hit, 0.45, ease.outCubic) : 0;
        let sc = lerp(0.62, 1, e) + 0.055 * kick(dt) * (T.ghost ? 0.4 : 1);
        if (T.ghost) sc *= lerp(1, 0.955, G);
        let jx = 0;
        if (T.ghost && dt > 0 && dt < 0.32) jx = (hash(Math.floor(dt * 45) + i * 31) - 0.5) * 9 * (1 - dt / 0.32);
        set(T.el, {
          x: jx, y: (1 - e) * 46 + float, scale: sc, opacity: op,
          blur: (1 - clamp(e)) * 7,
        });
        // traço desenhando
        const d = tw(t, T.at + 0.02, 0.95, ease.inOutCubic);
        const off = (1 - d).toFixed(4);
        T.strokes.forEach((s) => (s.style.strokeDashoffset = off));
        const breath = 0.84 + 0.16 * Math.sin(t * 2.1 + T.ph);
        // cor
        let col = C.neutral;
        if (L > 0) col = mix(C.neutral, C.lit, L);
        if (G > 0) col = mix(C.neutral, C.ghost, G);
        let iconOp = 1;
        if (T.ghost && dt > 0 && dt < 0.3) iconOp = hash(Math.floor(dt * 38) + i * 13) > 0.45 ? 1 : 0.35;
        T.svg.style.color = rgb(col);
        T.svg.style.opacity = iconOp.toFixed(3);
        T.wins.forEach((w) => (w.style.opacity = (0.55 * L * (0.85 + 0.15 * breath)).toFixed(3)));
        T.awf.forEach((w) => (w.style.opacity = (0.16 + 0.24 * L - 0.08 * G).toFixed(3)));
        // cartão
        let border;
        if (T.ghost) border = rgba(mix(C.hair, C.amber, G), lerp(0.13, 0.62 * (0.82 + 0.18 * breath), G));
        else border = rgba(mix(C.hair, C.neon, L), lerp(0.13, 0.9, L));
        T.card.style.borderColor = border;
        T.litbg.style.opacity = (L * (0.8 + 0.2 * breath)).toFixed(3);
        T.ghostbg.style.opacity = G.toFixed(3);
        T.flash.style.opacity = (dt > 0 && !T.ghost ? Math.exp(-dt * 7) * 0.85 : 0).toFixed(3);
        T.glow.style.opacity = (L * breath * 0.95).toFixed(3);
        // onda
        if (!T.ghost && dt > 0 && dt < 0.9) {
          const rp = ease.outCubic(prog(dt, 0, 0.9));
          set(T.ripple, { scale: 1 + 0.32 * rp, opacity: (1 - rp) * 0.9 });
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
        S.scanTrail.style.opacity = (v * Math.sin(Math.PI * scanP(t)) * 1.2 + 0.0).toFixed(3);
      } else S.scan.style.display = "none";

      // ---------- legenda ----------
      S.legendK.forEach((k, i) => set(k, enterState(t, SCAN_B - 0.15 + i * 0.12, { y: 24, blur: 8, dur: 0.6 })));

      // ---------- pergunta ----------
      S.qWords.forEach((w, i) => {
        const st = enterState(t, 1.2 + i * 0.065, { dur: 0.8, y: 64, blur: 13 });
        if (t >= 4.6) {
          const o = exitState(t, 4.6 + i * 0.025, { y: -40 });
          st.y += o.y; st.opacity *= o.opacity; st.blur += o.blur;
        }
        set(w, st);
      });
      set(S.uline, { sx: tw(t, 1.95, 0.55, ease.inOutCubic), sy: 1 });
      S.uline.style.opacity = (0.8 + 0.2 * Math.sin(t * 2.4)).toFixed(3);

      // ---------- contador ----------
      // valor contínuo = soma de passos com mola curta (odômetro)
      let val = 0;
      const valAt = (tt) => S.hits.reduce((s, h0) => s + ease.outCubic(prog(tt, h0, h0 + 0.32)), 0);
      val = valAt(t);
      const vel = (val - valAt(t - 1 / 60)) * 60;
      const ce = enterState(t, 4.62, { dur: 0.85, y: 70, blur: 14 });
      set(S.ctr, { y: ce.y, opacity: ce.opacity, blur: ce.blur });
      set(S.strip, { y: -val * 286 });
      S.odo.style.filter = Math.abs(vel) > 0.5 ? `blur(${Math.min(6, Math.abs(vel) * 0.9).toFixed(2)}px)` : "none";
      const lastHit = S.hits.filter((x) => x <= t).pop();
      const pop = lastHit !== undefined ? kick(t - lastHit, 14, 6) : 0;
      set(S.num, { scale: 1 + 0.07 * pop, origin: "50% 80%" });
      const n = Math.round(val);
      S.numGlow.textContent = String(n);
      const settled = tw(t, S.hits[S.hits.length - 1] + 0.2, 0.6);
      S.numGlow.style.opacity = ((0.35 + 0.35 * Math.max(0, pop) + 0.25 * settled) * (0.85 + 0.15 * Math.sin(t * 2.2))).toFixed(3);
      set(S.de, enterState(t, 4.74, { dur: 0.8, y: 50, blur: 12 }));
      set(S.lbl, enterState(t, 4.86, { dur: 0.8, y: 40, blur: 10 }));

      // ---------- frase ----------
      S.phWords.forEach((w, i) => set(w, enterState(t, 5.0 + i * 0.05, { dur: 0.8, y: 64, blur: 13 })));
      const sq = tw(t, 6.4, 1.4, ease.inOutCubic);
      set(S.shrink, { sx: lerp(1, 0.93, sq), sy: lerp(1, 0.985, sq) });

      // ---------- gráfico ----------
      const cd = tw(t, 5.75, 1.35, ease.inOutCubic);
      [S.lineS, S.lineA, S.lineSg, S.lineAg].forEach((p) => (p.style.strokeDashoffset = (1 - cd).toFixed(4)));
      S.chartGrid.setAttribute("opacity", tw(t, 5.6, 0.6).toFixed(3));
      S.wedge.setAttribute("opacity", tw(t, 6.6, 0.9, ease.inOutQuad).toFixed(3));
      const ds = spring(t - 6.98, { freq: 2.2, damping: 0.5 });
      const dsc = t > 6.98 ? ds : 0;
      [S.dotS, S.dotA].forEach((d) => d.setAttribute("r", (8 * dsc).toFixed(2)));
      const hp = ((t - 7.1) % 1.6 + 1.6) % 1.6 / 1.6;
      [S.haloS, S.haloA].forEach((d) => {
        d.setAttribute("r", (8 + 18 * ease.outCubic(hp)).toFixed(2));
        d.setAttribute("opacity", (t > 7.1 ? (1 - hp) * 0.7 : 0).toFixed(3));
      });
      set(S.labS, enterState(t, 5.85, { dur: 0.7, y: 24, blur: 8 }));
      set(S.labA, enterState(t, 6.0, { dur: 0.7, y: 24, blur: 8 }));
    },
  });
})();
