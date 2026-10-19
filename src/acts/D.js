/*
 * ATO D — "Mãos à obra" · 29,4–36,2 s (dur 6,8)
 *
 * Ideia central: a LISTA vira o CHECKLIST. As linhas da lista de trabalho (avatar + nome + botões) deslizam
 * e se transformam nos passos: o avatar quadrado vira o disco numerado, o nome dá lugar ao texto do passo.
 * Depois um scanner local (o conceito "raio-X" da série) desce pelo checklist e marca cada passo quando passa.
 *
 * Coreografia (tempos locais, s):
 *  -0.38  eyebrow "MÃOS À OBRA" decodifica (o scan do motor revela já em movimento)
 *  -0.30  "Quem não comprou" por palavra · -0.06 "vira lista." ("lista." em âmbar) · 0.55 sublinhado âmbar
 *  -0.16  cartão de vidro ("app") sobe · 0.00 cabeçalho "LISTA DE TRABALHO · ESTE MÊS"
 *   0.15  "clientes para ligar, visitar / e entender o motivo" por palavra (35 ms)
 *   0.35–1.25  contador 0→180 (outCubic; último dígito rola como slot) → pop de mola exatamente no 180
 *   1.35  origem do 180 por palavra: "= 600 ativos − 420 que compraram" (liga com a conta do ato B)
 *   0.40  2 linhas da lista entram · 0.55 prazo "antes do fim do mês" + trilha 1–30
 *   1.05  "HOJE · 18" / "DIA 30" entram com o preenchimento âmbar 18→30 (1.15–1.95)
 *   1.30  linha fantasma "+ 178 clientes" (eco do 180)
 *   1.00–2.00  flick da lista (inOutCubic, depois do 180 assentar)
 *   2.05  linha em foco âmbar · 2.20 botão de ligar em mola · 2.30–2.90 anel
 *   ~1.3–3.2  D1 parado e legível
 *   3.20  prazo, 180 e rótulo saem; título sai por palavra (escala 1→0.96)
 *   3.30–4.20  TRANSFORMAÇÃO: 5 linhas da lista deslizam para as posições dos passos (45 ms de stagger);
 *              avatar → disco (raio 18→32, fundo some, contorno lilás, ícone → número);
 *              nome/etiqueta/botões saem, texto do passo entra na mesma linha
 *   3.42  cabeçalho decodifica "LISTA DE TRABALHO" → "CHECKLIST", "ESTE MÊS" → "0 / 5 PASSOS"
 *   3.55  "Para salvar" por letra (escala 1.04→1) com o marcador desenhando a partir da ponta
 *   3.94–5.18  linha de scan local desce pelo checklist; cada passo marca quando a linha cruza o disco;
 *              a "espinha" neon liga os discos à medida que o scan passa
 *   5.25  CLÍMAX: marcador em mola + anel, "5" do cabeçalho pisca, onda de brilho nos discos,
 *         "quem não comprou" ganha o âmbar de "lista." (eco narrativo), brilho atravessa o cartão
 *   5.3–7.25  composição final viva (ponto de luz descendo a espinha, discos respirando, push-in) até o scan
 */
(function () {
  const W = 1080;
  const CX = 540;
  const CARD = { x: 130, w: 820, y: 638, h1: 842 }; // h2 medido
  const PAD = 40;
  const HEAD_H = 68;
  const ROW_H = 86;
  const WIN = { left: 32, top: 448, w: 756, h: 2 * ROW_H + 8 }; // janela da lista (coordenadas do cartão)
  const GHOST_T = WIN.top + WIN.h; // linha fantasma "+ 178 clientes"
  const NUM = { top: 72, h: 184, fs: 212 };
  const ORG_T = 286; // origem do 180: "= 600 ativos − 420 que compraram"
  const LABEL_T = 346;
  const DL_T = 694;
  const BAR = { x0: PAD + 4, x1: 820 - PAD - 11, y: 774 };
  const BL_T = 792;
  const STEPS_T = HEAD_H + 20; // topo da lista de passos no cartão
  const COS_T = 16; // topo do "figurino de linha de lista" dentro do passo (centro do avatar = centro do disco)
  const dayX = (d) => BAR.x0 + ((d - 1) / 29) * (BAR.x1 - BAR.x0);

  const T = {
    eyebrow: -0.38,
    title1: -0.3,
    title2: -0.06,
    uline: 0.55,
    card: -0.16,
    header: 0.0,
    num: 0.12,
    count: 0.35,
    countEnd: 1.25,
    origin: 1.35,
    label: 0.15,
    list: 0.4,
    dead: 0.55,
    fill: 1.15,
    barLab: 1.05,
    chip: 1.3,
    flick0: 1.0,
    flick1: 2.0,
    focus: 2.05,
    phone: 2.2,
    ring: 2.3,
    out: 3.2,
    morph: 3.3,
    morphDur: 0.72,
    mStag: 0.045,
    decode: 3.42,
    title3: 3.55,
    scan0: 3.94,
    scanDur: 1.24,
    done: 5.25,
  };

  const PDVS = [
    "Mercado São Jorge",
    "Bar do Tião",
    "Empório Bom Preço",
    "Conveniência Avenida",
    "Adega Central",
    "Mercearia Dona Rosa",
    "Padaria Pão Nosso",
    "Lanchonete Ponto Certo",
    "Supermercado Bela Vista",
    "Bar da Esquina",
  ];
  const FOCUS = 4; // linha em foco depois do flick (e primeira linha que vira passo)

  const STEPS = [
    "Conte os ativos.",
    "Conte quem comprou.",
    "Divida.",
    "Abra por vendedor e por rota.",
    'Trabalhe a lista de <span class="qc">quem não comprou</span>.',
  ];

  // ---------- ícones (24×24, traço)
  const ico = (d) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const I = {
    store: ico(
      '<path d="M3.5 9.5 5 4.5h14l1.5 5"/><path d="M3.5 9.5a2.83 2.83 0 0 0 5.67 0 2.83 2.83 0 0 0 5.66 0 2.83 2.83 0 0 0 5.67 0"/><path d="M5 12.6V20h14v-7.4"/><path d="M10 20v-4.6h4V20"/>'
    ),
    phone: ico(
      '<path d="M21 16.4v2.7a1.8 1.8 0 0 1-2 1.8 17.8 17.8 0 0 1-7.8-2.8 17.5 17.5 0 0 1-5.4-5.4A17.8 17.8 0 0 1 3 4.9 1.8 1.8 0 0 1 4.8 3h2.7a1.8 1.8 0 0 1 1.8 1.5c.1.9.3 1.7.6 2.5a1.8 1.8 0 0 1-.4 1.9L8.3 10.1a14.4 14.4 0 0 0 5.4 5.4l1.2-1.2a1.8 1.8 0 0 1 1.9-.4c.8.3 1.6.5 2.5.6a1.8 1.8 0 0 1 1.5 1.9z"/>'
    ),
    pin: ico('<path d="M12 21.5s-6.6-5.6-6.6-11.1a6.6 6.6 0 0 1 13.2 0c0 5.5-6.6 11.1-6.6 11.1z"/><circle cx="12" cy="10.3" r="2.4"/>'),
    list: ico('<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.6" cy="6.5" r="1.1"/><circle cx="4.6" cy="12" r="1.1"/><circle cx="4.6" cy="17.5" r="1.1"/>'),
    cal: ico('<rect x="3.5" y="5" width="17" height="15.5" rx="2.6"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="m13.6 14.2 1.4 1.4 2.6-2.8"/>'),
    checks: ico('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="m8 12.4 2.7 2.7L16.2 9.4"/>'),
  };

  const css = `
[data-act="D"] .d-world { position:absolute; inset:0; width:${W}px; height:1920px; }
[data-act="D"] .d-abs { position:absolute; }
[data-act="D"] .d-glow { border-radius:50%; }
[data-act="D"] .d-eyebrow { left:0; width:${W}px; top:386px; display:flex; justify-content:center; align-items:center; gap:22px;
  font-family:var(--font-mono); font-weight:600; font-size:30px; letter-spacing:0.32em; color:var(--lilac); }
[data-act="D"] .d-eyebrow .ln { width:36px; height:2px; background:linear-gradient(90deg, rgba(220,194,255,0), rgba(220,194,255,0.7)); }
[data-act="D"] .d-eyebrow .ln.r { background:linear-gradient(90deg, rgba(220,194,255,0.7), rgba(220,194,255,0)); }
[data-act="D"] .d-eyebrow .dot { width:10px; height:10px; border-radius:50%; background:var(--neon); box-shadow:0 0 12px 3px rgba(180,108,255,0.8); }
[data-act="D"] .d-eyebrow .tx { padding-left:0.32em; }

[data-act="D"] .d-title { left:0; width:${W}px; top:440px; text-align:center; font-family:var(--font-display); font-weight:800;
  font-size:88px; line-height:1.0; letter-spacing:-0.012em; white-space:nowrap; }
[data-act="D"] .d-title .fx-word { padding:0 0.02em; }
[data-act="D"] .d-title .sv { background:linear-gradient(180deg, #ffffff 0%, #e9e7f2 44%, #aaa7b9 100%);
  -webkit-background-clip:text; background-clip:text; color:transparent; }
[data-act="D"] .d-title .am { background:linear-gradient(180deg, #ffe2b0 0%, #ffbf5e 46%, #f08a32 100%);
  -webkit-background-clip:text; background-clip:text; color:transparent; }
[data-act="D"] .d-uline { height:6px; border-radius:6px; background:linear-gradient(90deg, rgba(255,181,71,0), #ffb547 18%, #ffd28a 60%, rgba(255,181,71,0.0));
  box-shadow:0 0 16px rgba(255,181,71,0.55); transform-origin:0 50%; }

[data-act="D"] .d-t2 { left:0; width:${W}px; top:442px; height:130px; display:flex; justify-content:center; align-items:center; gap:30px; }
[data-act="D"] .d-t2 .txt { font-family:var(--font-display); font-weight:800; font-size:108px; line-height:1; letter-spacing:-0.015em; white-space:nowrap; }
[data-act="D"] .d-t2 .fx-char { background:linear-gradient(180deg, #ffffff 0%, #e9e7f2 44%, #aaa7b9 100%);
  -webkit-background-clip:text; background-clip:text; color:transparent; padding:0 0.008em; }
[data-act="D"] .d-bmw { position:relative; width:78px; height:100px; flex:none; margin-top:6px; }
[data-act="D"] .d-bmw svg { position:absolute; left:0; top:0; width:78px; height:100px; overflow:visible; }
[data-act="D"] .d-bmw .rg { position:absolute; left:-11px; top:-1px; width:100px; height:100px; border-radius:50%;
  border:2.5px solid #dcc2ff; box-shadow:0 0 18px rgba(180,108,255,0.7), inset 0 0 14px rgba(180,108,255,0.45); opacity:0; }

[data-act="D"] .d-cardbg { left:${CARD.x}px; top:${CARD.y}px; width:${CARD.w}px; border-radius:42px; overflow:hidden;
  background:linear-gradient(180deg, rgba(255,255,255,0.082), rgba(255,255,255,0.028) 60%, rgba(255,255,255,0.04));
  border:1.5px solid rgba(255,255,255,0.13);
  box-shadow: inset 0 1.5px 0 rgba(255,255,255,0.16), 0 0 60px -10px rgba(139,43,217,0.38), 0 40px 80px -30px rgba(0,0,0,0.7); }
[data-act="D"] .d-cardbg .sheen { position:absolute; top:-160px; left:0; width:360px; height:1300px;
  background:linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0) 100%); }
[data-act="D"] .d-cardbg .rim { position:absolute; left:0; right:0; top:0; height:2px;
  background:linear-gradient(90deg, rgba(220,194,255,0), rgba(220,194,255,0.75) 50%, rgba(220,194,255,0)); }
[data-act="D"] .d-layer { left:${CARD.x}px; width:${CARD.w}px; top:${CARD.y}px; height:0; }

[data-act="D"] .d-head { left:0; width:${CARD.w}px; top:0; height:${HEAD_H}px; padding:0 ${PAD}px; display:flex; align-items:center; justify-content:space-between;
  font-family:var(--font-mono); font-weight:600; font-size:28px; letter-spacing:0.2em; color:rgba(220,194,255,0.86); white-space:nowrap; }
[data-act="D"] .d-head .l { display:flex; align-items:center; gap:14px; }
[data-act="D"] .d-head .ic { position:relative; width:30px; height:30px; color:var(--lilac); }
[data-act="D"] .d-head .ic svg { position:absolute; inset:0; width:30px; height:30px; }
[data-act="D"] .d-head .r { display:flex; align-items:center; gap:12px; }
[data-act="D"] .d-head .r i { width:9px; height:9px; border-radius:50%; background:var(--lilac); box-shadow:0 0 10px 2px rgba(180,108,255,0.7); }
[data-act="D"] .d-head .r .cs { display:flex; }
[data-act="D"] .d-head .r .cs span { display:inline-block; white-space:pre; }
[data-act="D"] .d-head .r .cs span.nn { color:#d4aeff; text-shadow:0 0 12px rgba(180,108,255,0.85); }
[data-act="D"] .d-head .r .cs span.hi { color:#ece0ff; }
[data-act="D"] .d-hair { left:${PAD}px; width:${CARD.w - 2 * PAD}px; top:${HEAD_H}px; height:1.5px; background:rgba(255,255,255,0.12); }

[data-act="D"] .d-num { left:0; width:${CARD.w}px; top:${NUM.top}px; height:${NUM.h}px; text-align:center; font-family:var(--font-display);
  font-weight:900; font-size:${NUM.fs}px; line-height:${NUM.h}px; letter-spacing:-0.02em; font-variant-numeric:tabular-nums; white-space:nowrap; }
[data-act="D"] .d-num span { display:inline-block; background:linear-gradient(180deg, #ffffff 0%, #efedf6 40%, #a9a6b8 100%);
  -webkit-background-clip:text; background-clip:text; color:transparent; }
[data-act="D"] .d-numglow { left:${CARD.w / 2 - 320}px; top:${NUM.top - 20}px; width:640px; height:260px;
  background:radial-gradient(closest-side, rgba(180,108,255,0.20), rgba(180,108,255,0.06) 60%, rgba(180,108,255,0)); }
[data-act="D"] .d-brk { left:0; top:0; width:${CARD.w}px; height:400px; overflow:visible; }

[data-act="D"] .d-label { left:0; width:${CARD.w}px; top:${LABEL_T}px; text-align:center; font-family:var(--font-text); font-weight:500;
  font-size:44px; line-height:1.08; color:var(--silver-2); letter-spacing:-0.005em; }
[data-act="D"] .d-label .w { display:inline-block; white-space:nowrap; }
[data-act="D"] .d-label .k { color:#ffffff; font-weight:750; }

[data-act="D"] .d-orgw { left:0; width:${CARD.w}px; top:${ORG_T}px; height:46px; display:flex; justify-content:center; }
[data-act="D"] .d-org { position:relative; height:46px; padding:0 26px; display:flex; align-items:baseline; gap:11px; border-radius:23px;
  background:rgba(139,43,217,0.16); border:1.5px solid rgba(220,194,255,0.24); box-shadow:inset 0 1px 0 rgba(255,255,255,0.07);
  font-family:var(--font-text); font-weight:500; font-size:34px; line-height:43px; color:var(--silver-2); white-space:nowrap; letter-spacing:-0.005em; }
[data-act="D"] .d-org .w { display:inline-block; }
[data-act="D"] .d-org .op { font-weight:600; color:var(--lilac); }
[data-act="D"] .d-org .n { color:#ffffff; font-weight:750; font-variant-numeric:tabular-nums; }
[data-act="D"] .d-org .n.ne { color:#d9b8ff; text-shadow:0 0 14px rgba(180,108,255,0.75); }

[data-act="D"] .d-winbg { left:${WIN.left}px; width:${WIN.w}px; top:${WIN.top}px; height:${WIN.h + 52}px; border-radius:24px;
  background:linear-gradient(180deg, rgba(8,2,18,0.34), rgba(8,2,18,0.12)); box-shadow:inset 0 1px 0 rgba(255,255,255,0.06); }
[data-act="D"] .d-win { left:${WIN.left}px; width:${WIN.w}px; top:${WIN.top}px; height:${WIN.h}px; overflow:hidden;
  -webkit-mask-image:linear-gradient(180deg, transparent 0, #000 3px, #000 calc(100% - 3px), transparent 100%);
  mask-image:linear-gradient(180deg, transparent 0, #000 3px, #000 calc(100% - 3px), transparent 100%); }
[data-act="D"] .d-strip { position:absolute; left:0; top:0; width:100%; }

/* linha de lista (usada na lista rolando E como "figurino" dos passos durante a transformação) */
[data-act="D"] .d-lr { position:absolute; left:0; width:${WIN.w}px; height:${ROW_H}px; }
[data-act="D"] .d-lr .bgf { position:absolute; inset:3px 0; border-radius:20px; background:rgba(255,181,71,0.075);
  border:1.5px solid rgba(255,181,71,0.34); opacity:0; }
[data-act="D"] .d-lr .sp { position:absolute; left:24px; right:24px; bottom:0; height:1px; background:rgba(255,255,255,0.075); }
[data-act="D"] .d-lr .av { position:absolute; left:10px; top:13px; width:60px; height:60px; border-radius:18px;
  background:rgba(58,47,76,0.65); border:1.5px solid rgba(255,255,255,0.10); color:#b8b3c9; display:flex; align-items:center; justify-content:center; }
[data-act="D"] .d-lr .av svg { width:32px; height:32px; }
[data-act="D"] .d-lr .av i, [data-act="D"] .d-box .dt { position:absolute; right:-4px; top:-4px; width:14px; height:14px; border-radius:50%; background:#4a3c60;
  border:3px solid #1a0b29; }
[data-act="D"] .d-lr .nm { position:absolute; left:102px; top:8px; font-family:var(--font-text); font-weight:600; font-size:34px;
  color:#f3f2f8; white-space:nowrap; letter-spacing:-0.005em; }
[data-act="D"] .d-lr .tag { position:absolute; left:102px; top:49px; font-family:var(--font-mono); font-weight:600; font-size:28px; letter-spacing:0.14em;
  color:rgba(200,198,212,0.78); padding:0 10px 0 12px; border-radius:7px; border:1px solid rgba(255,255,255,0.14); background:rgba(255,255,255,0.03);
  line-height:30px; white-space:nowrap; }
[data-act="D"] .d-lr .bt { position:absolute; top:15px; width:56px; height:56px; border-radius:50%; display:flex; align-items:center; justify-content:center;
  border:1.5px solid rgba(220,194,255,0.26); background:rgba(139,43,217,0.12); color:var(--lilac); }
[data-act="D"] .d-lr .bt svg { width:26px; height:26px; }
[data-act="D"] .d-lr .bt.ph { right:16px; }
[data-act="D"] .d-lr .bt.pn { right:86px; }
[data-act="D"] .d-lr .bt.ph.lit { background:linear-gradient(180deg, #ffc56a, #f0902f); color:#2a1206; border-color:rgba(255,210,140,0.9);
  box-shadow:0 0 22px rgba(255,181,71,0.6); }
[data-act="D"] .d-lr .ring { position:absolute; right:16px; top:15px; width:56px; height:56px; border-radius:50%; border:2px solid var(--amber); opacity:0; }

[data-act="D"] .d-ghost { left:${WIN.left}px; width:${WIN.w}px; top:${GHOST_T}px; height:52px; display:flex; align-items:center; gap:18px; padding-left:14px; }
[data-act="D"] .d-ghost .st { display:flex; }
[data-act="D"] .d-ghost .st b { width:36px; height:36px; border-radius:50%; border:1.5px solid rgba(220,194,255,0.22); background:#2a1e3a;
  box-shadow:0 0 0 3px #1d0f2d; margin-right:-10px; }
[data-act="D"] .d-ghost .st b:nth-child(2) { opacity:0.75; } [data-act="D"] .d-ghost .st b:nth-child(3) { opacity:0.5; }
[data-act="D"] .d-ghost .cp { margin-left:14px; font-family:var(--font-text); font-weight:500; font-size:30px; color:var(--silver-2); white-space:nowrap; }
[data-act="D"] .d-ghost .cp b { color:#fff; font-weight:750; }
[data-act="D"] .d-ghost .dl { flex:1; height:1px; margin-right:24px; background:linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0)); }

[data-act="D"] .d-dl { left:${PAD}px; width:${CARD.w - 2 * PAD}px; top:${DL_T}px; height:52px; display:flex; align-items:center; gap:16px;
  font-family:var(--font-text); font-weight:600; font-size:44px; color:#ffffff; white-space:nowrap; }
[data-act="D"] .d-dl svg { width:42px; height:42px; color:var(--lilac); }
[data-act="D"] svg.d-bar { left:0; top:0; width:${CARD.w}px; height:840px; overflow:visible; }
[data-act="D"] .d-bl { top:${BL_T}px; font-family:var(--font-mono); font-weight:600; font-size:30px; letter-spacing:0.14em; white-space:nowrap; line-height:34px; }

[data-act="D"] .d-steps { left:0; width:${CARD.w}px; top:${STEPS_T}px; padding:0 ${PAD}px; display:flex; flex-direction:column; }
[data-act="D"] .d-step { position:relative; display:flex; align-items:flex-start; gap:30px; padding:27px 0 27px 0; }
[data-act="D"] .d-step .cos { top:${COS_T}px; left:-8px; }
[data-act="D"] .d-step > .sep { position:absolute; left:94px; right:0; bottom:0; height:1px; background:rgba(255,255,255,0.08); }
[data-act="D"] .d-step:last-child > .sep { display:none; }
[data-act="D"] .d-step .sl { position:absolute; left:94px; bottom:-0.5px; width:150px; height:2px; opacity:0;
  background:radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(180,108,255,0.7) 45%, rgba(180,108,255,0)); }
[data-act="D"] .d-box { position:relative; flex:none; width:64px; height:64px; }
[data-act="D"] .d-box .o { position:absolute; inset:0; border-radius:32px; border:2px solid rgba(220,194,255,0.34); }
[data-act="D"] .d-box .ic { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#b8b3c9; }
[data-act="D"] .d-box .ic svg { width:34px; height:34px; }
[data-act="D"] .d-box .f { position:absolute; inset:0; border-radius:50%;
  background:radial-gradient(circle at 34% 28%, #e8d6ff 0%, #b46cff 38%, #7d22c9 100%);
  box-shadow:0 0 26px 2px rgba(180,108,255,0.7), inset 0 1px 0 rgba(255,255,255,0.5); }
[data-act="D"] .d-box .n { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  font-family:var(--font-mono); font-weight:600; font-size:28px; color:var(--lilac); }
[data-act="D"] .d-box svg.ck { position:absolute; inset:0; width:64px; height:64px; overflow:visible; }
[data-act="D"] .d-box .wave { position:absolute; inset:0; border-radius:50%; border:2px solid #dcc2ff; opacity:0; }
[data-act="D"] .d-step .tx { position:relative; flex:1; padding-top:2px; font-family:var(--font-text); font-weight:600; font-size:46px;
  line-height:1.2; letter-spacing:-0.01em; color:rgba(243,242,248,0.6); text-wrap:balance; }
[data-act="D"] .d-spine { left:${PAD + 30.75}px; width:2.5px; border-radius:2px; transform-origin:50% 0;
  background:linear-gradient(180deg, #dcc2ff, #b46cff); box-shadow:0 0 8px 1px rgba(180,108,255,1), 0 0 22px 2px rgba(139,43,217,0.75); }
[data-act="D"] .d-sdot { left:${PAD + 32 - 9}px; width:18px; height:18px; border-radius:50%;
  background:radial-gradient(closest-side, #ffffff, rgba(220,194,255,0.8) 40%, rgba(180,108,255,0)); }
[data-act="D"] .d-scan { left:14px; width:${CARD.w - 28}px; height:0; }
[data-act="D"] .d-scan .tr { position:absolute; left:0; right:0; top:-90px; height:90px;
  background:linear-gradient(180deg, rgba(180,108,255,0) 0%, rgba(180,108,255,0.07) 60%, rgba(220,194,255,0.22) 100%);
  -webkit-mask-image:linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
  mask-image:linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent); }
[data-act="D"] .d-scan .ln { position:absolute; left:0; right:0; top:-1px; height:2px;
  background:linear-gradient(90deg, rgba(180,108,255,0) 0%, #b46cff 10%, #ffffff 30%, #ffffff 55%, #b46cff 88%, rgba(180,108,255,0) 100%);
  box-shadow:0 0 18px rgba(180,108,255,0.9), 0 0 40px rgba(139,43,217,0.55); }
[data-act="D"] .d-scan .rd { position:absolute; right:26px; top:-34px; font-family:var(--font-mono); font-weight:600; font-size:22px; letter-spacing:0.22em;
  color:var(--lilac); text-shadow:0 0 10px rgba(180,108,255,0.9); }
`;

  // partes de uma linha de lista (avatar opcional: no figurino, o próprio disco faz o papel do avatar)
  function listRow(h, name, { avatar = true, lit = false } = {}) {
    const el = h("div", { class: "d-lr" });
    const bgf = h("div", { class: "bgf" });
    const av = avatar ? h("div", { class: "av", html: I.store + "<i></i>" }) : null;
    const nm = h("div", { class: "nm", text: name });
    const tag = h("div", { class: "tag", text: "NÃO COMPROU" });
    const pn = h("div", { class: "bt pn", html: I.pin });
    const ph = h("div", { class: "bt ph" + (lit ? " lit" : ""), html: I.phone });
    const ring = h("div", { class: "ring" });
    const sp = h("div", { class: "sp" });
    el.append(bgf, ...(av ? [av] : []), nm, tag, pn, ph, ring, sp);
    return { el, bgf, nm, tag, pn, ph, ring, sp };
  }

  const GL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#+";

  SAIB.act("D", {
    css,
    build(root, ctx) {
      const { h, split } = SAIB.fx;
      const S = ctx.state;
      const world = (S.world = h("div", { class: "d-world" }));
      root.append(world);

      // ---------- glows locais
      S.glowA = h("div", {
        class: "d-abs d-glow",
        style: {
          left: CX - 560 + "px", top: 1050 - 560 + "px", width: "1120px", height: "1120px",
          background: "radial-gradient(closest-side, rgba(139,43,217,0.26), rgba(139,43,217,0.09) 55%, rgba(139,43,217,0))",
        },
      });
      S.glowB = h("div", {
        class: "d-abs d-glow",
        style: {
          left: CX - 420 + "px", top: 1010 - 420 + "px", width: "840px", height: "840px",
          background: "radial-gradient(closest-side, rgba(180,108,255,0.24), rgba(180,108,255,0.07) 55%, rgba(180,108,255,0))",
        },
      });
      world.append(S.glowA, S.glowB);

      // ---------- eyebrow
      S.eyebrow = h("div", { class: "d-abs d-eyebrow" }, [
        (S.ebL = h("span", { class: "ln" })),
        (S.ebDot = h("span", { class: "dot" })),
        (S.ebTx = h("span", { class: "tx", text: "MÃOS À OBRA" })),
        (S.ebR = h("span", { class: "ln r" })),
      ]);
      S.ebChars = split(S.ebTx).chars;
      world.append(S.eyebrow);

      // ---------- título D1
      S.title = h("div", { class: "d-abs d-title" });
      const l1 = h("div", { text: "Quem não comprou" });
      const l2 = h("div", { text: "vira lista." });
      S.title.append(l1, l2);
      S.w1 = split(l1).words;
      S.w2 = split(l2).words;
      S.w1.forEach((w) => w.classList.add("sv"));
      S.w2[0].classList.add("sv");
      S.w2[1].classList.add("am");
      S.uline = h("div", { class: "d-abs d-uline" });
      world.append(S.title, S.uline);

      // ---------- título D2: marcador + "Para salvar"
      S.t2 = h("div", { class: "d-abs d-t2" });
      S.bmw = h("div", { class: "d-bmw" });
      const bm = h("svg", { viewBox: "0 0 78 100" });
      const defs = h("defs", {}, [
        h("linearGradient", { id: "dBmG", x1: "0", y1: "0", x2: "0", y2: "1" }, [
          h("stop", { offset: "0", "stop-color": "#efe2ff" }),
          h("stop", { offset: "0.5", "stop-color": "#b46cff" }),
          h("stop", { offset: "1", "stop-color": "#7d22c9" }),
        ]),
      ]);
      const bmFillD = "M14 8 H64 a6 6 0 0 1 6 6 V90 L39 70 L8 90 V14 a6 6 0 0 1 6-6 Z";
      // contorno começa na ponta interna (39,70) para desenhar "crescendo" junto do texto
      const bmLineD = "M39 70 L8 90 V14 a6 6 0 0 1 6-6 H39";
      const bmLineD2 = "M39 70 L70 90 V14 a6 6 0 0 0 -6-6 H39";
      S.bmGlow = h("path", { d: bmFillD, fill: "none", stroke: "rgba(180,108,255,0.45)", "stroke-width": "14", "stroke-linejoin": "round" });
      S.bmFill = h("path", { d: bmFillD, fill: "url(#dBmG)" });
      S.bmLine = h("path", { d: bmLineD, fill: "none", stroke: "#f3eaff", "stroke-width": "5", "stroke-linejoin": "round", "stroke-linecap": "butt" });
      S.bmLine2 = h("path", { d: bmLineD2, fill: "none", stroke: "#f3eaff", "stroke-width": "5", "stroke-linejoin": "round", "stroke-linecap": "butt" });
      S.bmTick = h("path", { d: "M26 40 L36 50 L54 31", fill: "none", stroke: "#ffffff", "stroke-width": "6", "stroke-linecap": "round", "stroke-linejoin": "round" });
      bm.append(defs, S.bmGlow, S.bmFill, S.bmLine, S.bmLine2, S.bmTick);
      S.bmRing = h("div", { class: "rg" });
      S.bmw.append(S.bmRing, bm);
      S.bm = bm;
      S.t2txt = h("div", { class: "txt", text: "Para salvar" });
      S.t2chars = split(S.t2txt).chars;
      S.t2.append(S.bmw, S.t2txt);
      world.append(S.t2);

      // ---------- cartão (fundo de vidro que se transforma)
      S.cardbg = h("div", { class: "d-abs d-cardbg" }, [(S.sheen = h("div", { class: "sheen" })), (S.rim = h("div", { class: "rim" }))]);
      world.append(S.cardbg);

      // ---------- camada de conteúdo do cartão
      const L = (S.L = h("div", { class: "d-abs d-layer" }));
      world.append(L);

      // cabeçalho compartilhado (decodifica de "LISTA DE TRABALHO" para "CHECKLIST")
      S.head = h("div", { class: "d-abs d-head" });
      const hl = h("div", { class: "l" });
      S.hIc = h("div", { class: "ic" });
      S.hIcA = h("div", { html: I.list, style: { position: "absolute", inset: 0 } });
      S.hIcB = h("div", { html: I.checks, style: { position: "absolute", inset: 0, opacity: 0 } });
      S.hIc.append(S.hIcA, S.hIcB);
      S.hL = h("span", { text: "LISTA DE TRABALHO" });
      hl.append(S.hIc, S.hL);
      const hr = h("div", { class: "r" });
      S.hDot = h("i");
      S.hRc = h("div", { class: "cs" });
      S.hRs = [];
      for (let i = 0; i < 12; i++) {
        const s = h("span");
        S.hRc.append(s);
        S.hRs.push(s);
      }
      hr.append(S.hDot, S.hRc);
      S.head.append(hl, hr);
      S.hair = h("div", { class: "d-abs d-hair" });
      L.append(S.head, S.hair);

      // =========== D1
      const L1 = (S.L1 = h("div", { class: "d-abs", style: { left: 0, top: 0, width: CARD.w + "px", height: 0 } }));
      S.numGlow = h("div", { class: "d-abs d-glow d-numglow" });
      S.num = h("div", { class: "d-abs d-num" }, [
        (S.numSpan = h("span")),
      ]);
      S.numA = h("span", { style: { display: "inline-block" } });
      S.numB = h("span", { style: { display: "inline-block" } });
      S.numSpan.append(S.numA, S.numB);
      S.brkSvg = h("svg", { class: "d-abs d-brk", viewBox: `0 0 ${CARD.w} 400` });
      S.brk = [0, 1, 2, 3].map(() => {
        const p = h("path", { fill: "none", stroke: "rgba(220,194,255,0.55)", "stroke-width": "2.5", "stroke-linecap": "square" });
        S.brkSvg.append(p);
        return p;
      });
      S.label = h("div", { class: "d-abs d-label" });
      S.labWords = [];
      [
        [["clientes"], ["para"], ["ligar,", "k"], ["visitar", "k"]],
        [["e"], ["entender", "k"], ["o", "k"], ["motivo", "k"]],
      ].forEach((ln) => {
        const row = h("div");
        ln.forEach(([wd, k], j) => {
          const w = h("span", { class: "w" + (k ? " " + k : ""), text: wd });
          S.labWords.push(w);
          row.append(w);
          if (j < ln.length - 1) row.append(document.createTextNode(" "));
        });
        S.label.append(row);
      });
      // origem do 180 (liga com a conta do ato B): "= 600 ativos − 420 que compraram"
      S.org = h("div", { class: "d-org" });
      S.orgW = h("div", { class: "d-abs d-orgw" }, [S.org]);
      S.orgWords = [
        ["=", "op"], ["600", "n"], ["ativos"], ["−", "op"], ["420", "n ne"], ["que compraram"],
      ].map(([wd, k]) => {
        const w = h("span", { class: "w" + (k ? " " + k : ""), text: wd });
        S.org.append(w);
        return w;
      });
      // lista rolando
      S.winbg = h("div", { class: "d-abs d-winbg" });
      S.win = h("div", { class: "d-abs d-win" });
      S.strip = h("div", { class: "d-strip" });
      S.rows = PDVS.map((name, i) => {
        const r = listRow(h, name);
        r.el.style.top = 4 + i * ROW_H + "px";
        S.strip.append(r.el);
        return r;
      });
      S.win.append(S.strip);
      // linha fantasma
      S.ghost = h("div", {
        class: "d-abs d-ghost",
        html: `<div class="st"><b></b><b></b><b></b></div><div class="cp"><b>+ 178</b> clientes</div><div class="dl"></div>`,
      });
      // prazo
      S.dl = h("div", { class: "d-abs d-dl", html: `${I.cal}<span>antes do fim do mês</span>` });
      const bar = (S.barSvg = h("svg", { class: "d-abs d-bar", viewBox: `0 0 ${CARD.w} 840` }));
      const bdefs = h("defs", {}, [
        h("linearGradient", { id: "dAmG", x1: String(dayX(18)), y1: "0", x2: String(dayX(30)), y2: "0", gradientUnits: "userSpaceOnUse" }, [
          h("stop", { offset: "0", "stop-color": "#ff9a3d" }),
          h("stop", { offset: "1", "stop-color": "#ffd28a" }),
        ]),
        h("radialGradient", { id: "dTipG" }, [
          h("stop", { offset: "0", "stop-color": "#fff4dd", "stop-opacity": "0.95" }),
          h("stop", { offset: "0.35", "stop-color": "#ffb547", "stop-opacity": "0.5" }),
          h("stop", { offset: "1", "stop-color": "#ffb547", "stop-opacity": "0" }),
        ]),
      ]);
      const ln = (a) => h("line", Object.assign({ "stroke-linecap": "round" }, a));
      S.track = ln({ x1: BAR.x0, y1: BAR.y, x2: BAR.x1, y2: BAR.y, stroke: "rgba(255,255,255,0.13)", "stroke-width": "8" });
      S.past = ln({ x1: BAR.x0, y1: BAR.y, x2: dayX(18), y2: BAR.y, stroke: "rgba(220,194,255,0.42)", "stroke-width": "8" });
      S.fillH = ln({ x1: dayX(18), y1: BAR.y, x2: dayX(18), y2: BAR.y, stroke: "rgba(255,181,71,0.26)", "stroke-width": "22" });
      S.fill = ln({ x1: dayX(18), y1: BAR.y, x2: dayX(18), y2: BAR.y, stroke: "url(#dAmG)", "stroke-width": "8" });
      S.dayTicks = [];
      const tg = h("g");
      for (let d = 1; d <= 30; d++) {
        const big = d === 1 || d % 5 === 0;
        const tk = ln({ x1: dayX(d), x2: dayX(d), y1: BAR.y - (big ? 20 : 14), y2: BAR.y - 10, "stroke-width": big ? "2.5" : "2", stroke: "rgba(220,194,255,0.35)" });
        tg.append(tk);
        S.dayTicks.push({ el: tk, d });
      }
      S.tipG = h("circle", { cx: dayX(18), cy: BAR.y, r: "30", fill: "url(#dTipG)" });
      S.flag = h("circle", { cx: dayX(30), cy: BAR.y, r: "11", fill: "#1a0b29", stroke: "#ffb547", "stroke-width": "4" });
      S.mkRing = h("circle", { cx: dayX(18), cy: BAR.y, r: "15", fill: "none", stroke: "rgba(220,194,255,0.55)", "stroke-width": "2" });
      S.mk = h("circle", { cx: dayX(18), cy: BAR.y, r: "10", fill: "#ffffff" });
      bar.append(bdefs, S.track, S.past, tg, S.fillH, S.fill, S.tipG, S.flag, S.mkRing, S.mk);
      S.blToday = h("div", { class: "d-abs d-bl", html: 'HOJE · <b style="color:#fff">18</b>', style: { color: "var(--lilac)" } });
      S.blEnd = h("div", { class: "d-abs d-bl", text: "DIA 30", style: { color: "#f3eaff" } });
      L1.append(S.numGlow, S.brkSvg, S.num, S.orgW, S.label, S.winbg, S.win, S.ghost, S.dl, bar, S.blToday, S.blEnd);
      L.append(L1);

      // =========== D2: checklist (cada passo nasce "vestido" de linha de lista)
      const L2 = (S.L2 = h("div", { class: "d-abs", style: { left: 0, top: 0, width: CARD.w + "px", height: 0 } }));
      S.stepsBox = h("div", { class: "d-abs d-steps" });
      S.spines = [0, 1, 2, 3].map(() => h("div", { class: "d-abs d-spine", style: { top: "0px", height: "0px" } }));
      S.sdot = h("div", { class: "d-abs d-sdot" });
      S.stepsBox.append(...S.spines, S.sdot);
      S.steps = STEPS.map((txt, i) => {
        const row = h("div", { class: "d-step" });
        const cos = listRow(h, PDVS[FOCUS + i], { avatar: false, lit: i === 0 });
        cos.el.classList.add("cos");
        const sl = h("div", { class: "sl" });
        const box = h("div", { class: "d-box" });
        const o = h("div", { class: "o" });
        const ic = h("div", { class: "ic", html: I.store });
        const dt = h("div", { class: "dt" });
        const f = h("div", { class: "f" });
        const n = h("div", { class: "n", text: String(i + 1) });
        const wave = h("div", { class: "wave" });
        const svg = h("svg", { class: "ck", viewBox: "0 0 64 64" });
        const ck = h("path", { d: "M19 33.5 L28 42.5 L45.5 23.5", fill: "none", stroke: "#ffffff", "stroke-width": "5.5", "stroke-linecap": "round", "stroke-linejoin": "round" });
        svg.append(ck);
        box.append(wave, o, ic, dt, f, n, svg);
        const tx = h("div", { class: "tx", html: txt });
        const sep = h("div", { class: "sep" });
        row.append(cos.el, sl, box, tx, sep);
        S.stepsBox.append(row);
        return { row, cos, sl, box, o, ic, dt, f, n, wave, ck, tx, sep, qc: tx.querySelector(".qc"), lastC: "" };
      });
      // scanner local
      S.lscan = h("div", { class: "d-abs d-scan" }, [h("div", { class: "tr" }), h("div", { class: "ln" })]);
      L2.append(S.stepsBox, S.lscan);
      L.append(L2);
      S.measured = false;
    },

    update(t, ctx) {
      const { enterState, exitState, tw, ease, set, lerp, prog, clamp, spring, noise, hash } = SAIB.fx;
      const S = ctx.state;
      const dur = ctx.dur;

      // ---------- medições (uma vez, com fontes carregadas)
      if (!S.measured) {
        S.measured = true;
        S.drawCk = S.steps.map((s) => SAIB.fx.drawable(s.ck));
        S.drawBm = SAIB.fx.drawable(S.bmLine);
        S.drawBm2 = SAIB.fx.drawable(S.bmLine2);
        S.drawBmTick = SAIB.fx.drawable(S.bmTick);
        // layout final do checklist (sem transformações)
        S.L2.style.display = "block";
        S.stepTops = S.steps.map((s) => s.row.offsetTop);
        S.stepH = S.steps.map((s) => s.row.offsetHeight);
        S.rowW = S.steps[0].row.offsetWidth;
        S.h2 = Math.round(STEPS_T + S.stepsBox.offsetHeight + 24);
        S.discC = S.stepTops.map((y) => y + 27 + 32); // centro do disco (coordenadas do bloco de passos)
        // deslocamento inicial de cada passo: alinhado com a linha FOCUS+i da lista
        S.dy0 = S.steps.map((s, i) => WIN.top + 4 + i * ROW_H - (STEPS_T + S.stepTops[i] + COS_T));
        // scanner: do topo do 1º passo até abaixo do último disco; marca quando cruza o centro do disco
        S.scY0 = S.stepTops[0] - 18;
        S.scY1 = S.discC[4] + 46;
        const inv = (p) => {
          let a = 0, b = 1;
          for (let k = 0; k < 40; k++) {
            const m = (a + b) / 2;
            if (ease.inOutQuad(m) < p) a = m;
            else b = m;
          }
          return (a + b) / 2;
        };
        S.chk = S.discC.map((c) => T.scan0 + T.scanDur * inv((c - S.scY0) / (S.scY1 - S.scY0)));
        // espinha: segmentos entre discos
        S.spines.forEach((sp, i) => {
          sp.style.top = S.discC[i] + 34 + "px";
          sp.style.height = S.discC[i + 1] - S.discC[i] - 68 + "px";
        });
        // sublinhado sob "lista."
        const wl = S.w2[1];
        S.ulX = wl.offsetLeft + 4;
        S.ulW = wl.offsetWidth - 22;
        S.ulY = 440 + wl.offsetTop + wl.offsetHeight - 4;
        Object.assign(S.uline.style, { left: S.ulX + "px", top: S.ulY + "px", width: S.ulW + "px" });
        // rótulos da barra
        S.blToday.style.left = dayX(18) - S.blToday.offsetWidth / 2 + "px";
        S.blEnd.style.left = BAR.x1 + 11 - S.blEnd.offsetWidth + 3 + "px"; // letter-spacing final
        // caixa de tinta do "180" (cantos de mira com respiro igual)
        S.numA.textContent = "18";
        S.numB.textContent = "0";
        const cv = document.createElement("canvas").getContext("2d");
        cv.font = `900 ${NUM.fs}px "Exo 2"`;
        const mt = cv.measureText("180");
        const fa = mt.fontBoundingBoxAscent || NUM.fs * 0.95, fd = mt.fontBoundingBoxDescent || NUM.fs * 0.25;
        const base = NUM.top + NUM.h / 2 + (fa - fd) / 2;
        S.ink = {
          // tabular-nums não existe no canvas: largura de tinta do "180" medida no quadro (≈1,758 em, centrada)
          x0: CARD.w / 2 + 2 - 0.879 * NUM.fs,
          x1: CARD.w / 2 + 2 + 0.879 * NUM.fs,
          y0: base - mt.actualBoundingBoxAscent,
          y1: base + mt.actualBoundingBoxDescent,
        };
        S.L2.style.display = "none";
      }

      // ---------- vida: drift + push-in final
      const push = lerp(1, 1.02, ease.inOutQuad(prog(t, T.done - 0.2, dur + 0.45)));
      set(S.world, { x: noise(t * 0.33, 11) * 3, y: noise(t * 0.29, 5) * 4, scale: push, origin: `${CX}px 1000px` });

      const O = T.out;
      const mpCard = ease.inOutCubic(prog(t, T.morph + 0.12, T.morph + 0.95));
      const doneP = prog(t, T.done - 0.1, T.done + 0.8);

      // glows
      set(S.glowA, { opacity: tw(t, -0.2, 1.2, ease.outCubic) * (0.86 + 0.14 * Math.sin(t * 1.6)), y: lerp(0, -20, mpCard) });
      set(S.glowB, {
        opacity: (0.25 + 0.5 * tw(t, T.morph, 1.0, ease.outCubic) + 0.35 * Math.sin(Math.PI * doneP)) * (0.9 + 0.1 * Math.sin(t * 2.3 + 1)),
        scale: lerp(0.9, 1.05, doneP),
      });

      // ---------- eyebrow (fica no ato todo)
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

      // ---------- título D1 por palavra (sai encolhendo levemente para o título D2)
      {
        const words = [...S.w1, ...S.w2];
        const d1T = t < O + 0.8;
        S.title.style.display = d1T ? "block" : "none";
        if (d1T) {
          words.forEach((w, i) => {
            const a = i < S.w1.length ? T.title1 + i * 0.07 : T.title2 + (i - S.w1.length) * 0.08;
            const st = enterState(t, a, { y: 70, blur: 14, dur: 0.8 });
            const ex = exitState(t, O + i * 0.02, { y: -40, blur: 12, dur: 0.3 });
            set(w, { y: st.y + ex.y, opacity: st.opacity * ex.opacity, blur: st.blur + ex.blur });
          });
          set(S.title, { scale: lerp(1, 0.96, tw(t, O, 0.42, ease.inCubic)), origin: "50% 50%" });
          const p = tw(t, T.uline, 0.7, ease.inOutCubic);
          const ex = exitState(t, O + 0.06, { y: -40, blur: 10, dur: 0.28 });
          set(S.uline, { sx: p, sy: 1, opacity: prog(t, T.uline - 0.02, T.uline + 0.08) * ex.opacity * (0.85 + 0.15 * Math.sin(t * 2.6)), y: ex.y, blur: ex.blur });
        } else {
          set(S.uline, { opacity: 0 });
        }
      }

      // ---------- título D2: marcador + "Para salvar"
      {
        const on = t > T.title3 - 0.05;
        S.t2.style.display = on ? "flex" : "none";
        if (on) {
          set(S.t2, { scale: lerp(1.04, 1, tw(t, T.title3, 0.9, ease.outCubic)), origin: "50% 50%" });
          let pOp = 0;
          S.t2chars.forEach((c, i) => {
            const a = T.title3 + i * 0.038;
            const s2 = enterState(t, a, { y: 64, blur: 14, dur: 0.8 });
            set(c, { y: s2.y, opacity: s2.opacity, blur: s2.blur });
            if (i === 0) pOp = s2.opacity;
          });
          // marcador: opacidade presa à entrada do "P"; contorno desenha a partir da ponta interna
          const st = enterState(t, T.title3, { y: 64, blur: 10, dur: 0.8 });
          const dt = t - T.done;
          const sp = spring(dt, { freq: 2.4, damping: 0.45 });
          const bump = dt > 0 ? 1 + 0.22 * Math.sin(Math.PI * clamp(dt / 0.42)) * (dt < 0.42 ? 1 : 0) + (dt >= 0.42 ? (sp - 1) * 0.5 : 0) : 1;
          set(S.bm, { y: st.y, opacity: pOp, blur: st.blur, scale: bump, origin: "50% 60%" });
          const bdp = tw(t, T.title3 + 0.04, 0.8, ease.inOutCubic);
          S.drawBm(bdp);
          S.drawBm2(bdp);
          const fp = tw(t, T.done, 0.35, ease.outCubic);
          S.bmFill.style.opacity = fp.toFixed(3);
          S.bmGlow.style.opacity = (fp * (0.6 + 0.4 * Math.sin(t * 2.4))).toFixed(3);
          const tp = tw(t, T.done + 0.12, 0.38, ease.outCubic);
          S.drawBmTick(tp);
          S.bmTick.style.opacity = tp > 0.02 ? "1" : "0";
          S.bmLine.setAttribute("stroke", fp > 0.5 ? "#ffffff" : "#f3eaff");
          S.bmLine2.setAttribute("stroke", fp > 0.5 ? "#ffffff" : "#f3eaff");
          const rp = prog(t, T.done + 0.02, T.done + 0.62);
          set(S.bmRing, { opacity: rp > 0 && rp < 1 ? 0.7 * Math.pow(1 - rp, 1.6) : 0, scale: lerp(0.7, 1.8, ease.outCubic(rp)) });
        }
      }

      // ---------- cartão: entrada + transformação de altura
      {
        const st = enterState(t, T.card, { y: 80, blur: 0, dur: 0.9, scale: 0.96 });
        const hh = lerp(CARD.h1, S.h2, mpCard);
        const squeeze = Math.sin(Math.PI * mpCard) * 0.01;
        set(S.cardbg, { y: st.y, opacity: st.opacity, sx: st.scale - squeeze, sy: st.scale, origin: "50% 0%", height: hh });
        const s1 = tw(t, 0.0, 1.3, ease.inOutCubic);
        const s2 = tw(t, T.done + 0.05, 1.1, ease.inOutCubic);
        const sx = s2 > 0 ? lerp(-420, CARD.w + 80, s2) : lerp(-420, CARD.w + 80, s1);
        set(S.sheen, { x: sx, rot: 18, opacity: s2 > 0 ? 1.4 * Math.sin(Math.PI * s2) : 0.8 * Math.sin(Math.PI * s1) });
        set(S.rim, { opacity: 0.25 + 0.5 * Math.sin(Math.PI * s1) + 0.6 * Math.sin(Math.PI * s2) + 0.35 * Math.sin(Math.PI * mpCard), sx: 1, sy: 1 });
        set(S.L, { y: st.y });
      }

      // ---------- cabeçalho (decodificação de papel)
      {
        const hs = enterState(t, T.header, { y: 24, blur: 8, dur: 0.7 });
        set(S.head, hs);
        set(S.hair, { sx: tw(t, T.header + 0.05, 0.8, ease.inOutCubic), sy: 1, origin: "50% 50%" });
        const dec = (from, to, t0, per) => {
          const n = Math.max(from.length, to.length);
          let s = "";
          const out = [];
          for (let i = 0; i < n; i++) {
            const ti = i < to.length ? t0 + i * per : t0 + (n - 1 - i) * per * 0.6;
            const tc = to[i] || "", fc = from[i] || "";
            let ch;
            if (t < ti) ch = fc;
            else if (t < ti + 0.12) ch = tc === " " || (!tc && !fc) ? tc : GL[Math.floor(hash(i * 7 + 3 + Math.floor(t * 30) * 13) * GL.length)];
            else ch = tc;
            out.push({ ch, done: t >= ti + 0.12 });
            s += ch;
          }
          return { s, out };
        };
        const L = dec("LISTA DE TRABALHO", "CHECKLIST", T.decode, 0.03);
        const lk = L.s.replace(/\s+$/, "");
        if (S.lastHL !== lk) {
          S.hL.textContent = lk;
          S.lastHL = lk;
        }
        const ip = tw(t, T.decode, 0.35, ease.inOutCubic);
        S.hIcA.style.opacity = (1 - ip).toFixed(3);
        S.hIcB.style.opacity = ip.toFixed(3);
        set(S.hIc, { scale: 1 - 0.18 * Math.sin(Math.PI * ip) });
        // direita: "ESTE MÊS" → "n / 5 PASSOS"
        const nStr = String(S.chk.filter((c) => t > c + 0.12).length);
        const R = dec("ESTE MÊS", nStr + " / 5 PASSOS", T.decode + 0.08, 0.03);
        R.out.forEach((o, i) => {
          const sEl = S.hRs[i];
          const cls = o.done ? (i === 0 ? "nn" : i <= 4 ? "hi" : "") : "";
          const key = o.ch + "|" + cls;
          if (sEl._k !== key) {
            sEl._k = key;
            sEl.textContent = o.ch;
            sEl.className = cls;
          }
        });
        S.hDot.style.opacity = (1 - prog(t, T.decode, T.decode + 0.15)).toFixed(3);
        S.hDot.style.display = t > T.decode + 0.2 ? "none" : "";
        // pop do "5" no clímax
        const dp = t - T.done;
        const pop = dp > 0 ? 1 + 0.45 * Math.exp(-6 * dp) * Math.sin(Math.min(Math.PI, dp * 2 * Math.PI * 1.6)) * (dp < 0.31 ? 1 : 0) + (dp >= 0.31 ? 0.0 : 0) : 1;
        set(S.hRs[0], { scale: Math.max(1, pop), brightness: 1 + 0.6 * Math.sin(Math.PI * prog(t, T.done, T.done + 0.5)) });
      }

      // =================== D1 ===================
      const d1On = t < O + 0.7;
      S.L1.style.display = d1On ? "block" : "none";
      if (d1On) {
        const outEl = (el, at, inState, o = {}) => {
          const ex = exitState(t, at, Object.assign({ y: -36, blur: 12, dur: 0.32 }, o));
          set(el, { x: inState.x || 0, y: inState.y + ex.y, opacity: inState.opacity * ex.opacity, blur: inState.blur + ex.blur, scale: inState.scale });
          return ex;
        };
        // número 180 (conta até o último dígito e "pousa" exatamente no 180)
        {
          const st = enterState(t, T.num, { y: 56, blur: 16, dur: 0.8, scale: 0.9 });
          const cp = ease.outCubic(prog(t, T.count, T.countEnd));
          const raw = 180 * cp;
          const vi = Math.min(180, Math.floor(raw + 1e-6));
          const v = String(vi);
          if (S.lastNum !== v) {
            S.numA.textContent = v.length > 1 ? v.slice(0, -1) : "";
            S.numB.textContent = v.slice(-1);
            S.lastNum = v;
          }
          // rolagem tipo slot do último dígito (só quando a contagem já está lenta)
          const rate = (180 * 3 * Math.pow(1 - prog(t, T.count, T.countEnd), 2)) / (T.countEnd - T.count);
          const amp = t < T.countEnd && t > T.count ? clamp(1 - rate / 70) : 0;
          const fr = raw - Math.floor(raw);
          const roll = amp * (1 - ease.outCubic(clamp(fr * 2.2)));
          set(S.numB, { y: -22 * roll, blur: 3 * roll, opacity: 1 - 0.5 * roll });
          const land = T.countEnd;
          const dl = t - land;
          const sp = dl > 0 ? 1 + 0.05 * Math.exp(-5 * dl) * Math.sin(Math.PI * 2 * 2.2 * dl) : 1;
          const flash = Math.sin(Math.PI * prog(t, land - 0.03, land + 0.45));
          st.scale *= sp;
          outEl(S.num, O + 0.04, st, { blur: 6, scale: 0.94, dur: 0.3 });
          set(S.num, { brightness: 1 + 0.28 * flash });
          const ex = exitState(t, O + 0.04, { y: -36, blur: 0, dur: 0.3 });
          set(S.numGlow, { y: ex.y, opacity: (0.5 + 0.5 * flash + 0.1 * Math.sin(t * 2)) * st.opacity * ex.opacity, scale: 0.9 + 0.12 * flash });
          // cantos de mira com respiro igual (26 px) em volta dos dígitos
          const ap = tw(t, T.num + 0.2, 0.9, ease.outQuart);
          const arm = 34 * ap;
          const g = lerp(30, 0, ap);
          const P_ = 26;
          const X0 = S.ink.x0 - P_ - g, X1 = S.ink.x1 + P_ + g, Y0 = S.ink.y0 - 22 - g, Y1 = S.ink.y1 + 22 + g;
          const ds = [
            `M${X0} ${Y0 + arm}L${X0} ${Y0}L${X0 + arm} ${Y0}`,
            `M${X1 - arm} ${Y0}L${X1} ${Y0}L${X1} ${Y0 + arm}`,
            `M${X1} ${Y1 - arm}L${X1} ${Y1}L${X1 - arm} ${Y1}`,
            `M${X0 + arm} ${Y1}L${X0} ${Y1}L${X0} ${Y1 - arm}`,
          ];
          S.brk.forEach((p, i) => p.setAttribute("d", ap > 0.001 ? ds[i] : "M0 0"));
          set(S.brkSvg, { y: ex.y, opacity: prog(t, T.num + 0.2, T.num + 0.45) * ex.opacity * (0.7 + 0.3 * Math.sin(t * 2.4)) });
        }
        // origem do 180, por palavra (50 ms), logo depois do número pousar; sai junto com o 180
        {
          const ex = exitState(t, O + 0.05, { y: -36, blur: 10, dur: 0.3 });
          const pe = enterState(t, T.origin - 0.05, { y: 24, blur: 6, dur: 0.6, scale: 0.94 });
          set(S.orgW, { y: ex.y, opacity: ex.opacity, blur: ex.blur });
          set(S.org, { y: pe.y, opacity: pe.opacity, blur: pe.blur, scale: pe.scale });
          S.orgWords.forEach((w, i) => {
            const a = T.origin + i * 0.05;
            const st = enterState(t, a, { y: 30, blur: 10, dur: 0.7 });
            set(w, { y: st.y, opacity: st.opacity, blur: st.blur });
          });
        }
        // rótulo por palavra (35 ms)
        {
          const ex = exitState(t, O + 0.06, { y: -36, blur: 10, dur: 0.3 });
          set(S.label, { y: ex.y, opacity: ex.opacity, blur: ex.blur });
          S.labWords.forEach((w, i) => {
            const a = T.label + i * 0.035;
            const st = enterState(t, a, { y: 36, blur: 10, dur: 0.7 });
            set(w, { y: st.y, opacity: st.opacity, blur: st.blur });
          });
        }
        // lista rolando (some no início da transformação: os passos assumem as linhas)
        {
          const listOn = t < T.morph;
          S.win.style.display = listOn ? "block" : "none";
          const wb = enterState(t, T.list, { y: 50, blur: 0, dur: 0.8 });
          const wbx = 1 - tw(t, T.morph, 0.45, ease.inOutCubic);
          set(S.winbg, { y: wb.y, opacity: wb.opacity * wbx });
          if (listOn) {
            const fp0 = ease.inOutCubic(prog(t, T.flick0, T.flick1));
            const off = FOCUS * ROW_H * fp0;
            set(S.strip, { y: -off });
            S.rows.forEach((r, i) => {
              const y = 4 + i * ROW_H - off;
              const vis = y > -ROW_H && y < WIN.h;
              r.el.style.display = vis ? "block" : "none";
              if (!vis) return;
              const st = enterState(t, T.list + Math.min(i, 2) * 0.08, { y: 40, blur: 10, dur: 0.75 });
              set(r.el, { y: st.y, opacity: st.opacity, blur: st.blur });
            });
            // linha em foco
            const R = S.rows[FOCUS];
            const fp = tw(t, T.focus, 0.4, ease.outCubic);
            set(R.bgf, { opacity: fp, sx: lerp(0.97, 1, fp), sy: 1 });
            const rp = prog(t, T.ring, T.ring + 0.6);
            set(R.ring, { opacity: rp > 0 && rp < 1 ? 0.8 * (1 - rp) : 0, scale: lerp(1, 1.7, ease.outCubic(rp)) });
            const pp = spring(t - T.phone, { freq: 2.6, damping: 0.45 });
            set(R.ph, { scale: t > T.phone ? lerp(0.8, 1, pp) : 1 });
            const lit = t > T.phone;
            if (S.lit !== lit) {
              S.lit = lit;
              R.ph.classList.toggle("lit", lit);
            }
          }
        }
        // linha fantasma "+ 178 clientes"
        {
          const st = enterState(t, T.chip, { x: -24, y: 0, blur: 8, dur: 0.7 });
          outEl(S.ghost, T.morph - 0.04, st, { y: -10, dur: 0.28 });
        }
        // prazo
        {
          const st = enterState(t, T.dead, { y: 40, blur: 10, dur: 0.75 });
          outEl(S.dl, O, st);
          const ex = exitState(t, O + 0.02, { y: -36, blur: 10, dur: 0.3 });
          const bo = prog(t, T.dead + 0.05, T.dead + 0.3) * ex.opacity;
          set(S.barSvg, { y: ex.y, opacity: bo, blur: ex.blur });
          const tp = tw(t, T.dead + 0.05, 0.8, ease.inOutCubic);
          S.track.setAttribute("x2", lerp(BAR.x0, BAR.x1, tp).toFixed(1));
          const pp = tw(t, T.dead + 0.2, 0.6, ease.outCubic);
          S.past.setAttribute("x2", lerp(BAR.x0, dayX(18), pp).toFixed(1));
          S.dayTicks.forEach(({ el, d }) => {
            const a = T.dead + 0.08 + d * 0.022;
            el.style.opacity = prog(t, a, a + 0.15).toFixed(3);
          });
          const mk = spring(t - (T.dead + 0.4), { freq: 2.4, damping: 0.5 });
          S.mk.setAttribute("r", (10 * clamp(mk, 0, 1.4)).toFixed(2));
          S.mkRing.setAttribute("r", (15 + 4 * Math.sin(t * 3)).toFixed(2));
          S.mkRing.style.opacity = (prog(t, T.dead + 0.5, T.dead + 0.7) * (0.5 + 0.4 * Math.sin(t * 3))).toFixed(3);
          const fp = ease.inOutCubic(prog(t, T.fill, T.fill + 0.8));
          const fx = lerp(dayX(18), dayX(30), fp);
          S.fill.setAttribute("x2", fx.toFixed(1));
          S.fillH.setAttribute("x2", fx.toFixed(1));
          S.fill.style.opacity = prog(t, T.fill, T.fill + 0.05).toFixed(3);
          S.fillH.style.opacity = (prog(t, T.fill, T.fill + 0.1) * (0.6 + 0.4 * Math.sin(t * 2.2))).toFixed(3);
          S.tipG.setAttribute("cx", fx.toFixed(1));
          S.tipG.style.opacity = Math.sin(Math.PI * prog(t, T.fill - 0.05, T.fill + 1.05)).toFixed(3);
          const fl = spring(t - (T.fill + 0.72), { freq: 2.6, damping: 0.45 });
          S.flag.setAttribute("r", (11 * clamp(fl, 0, 1.5)).toFixed(2));
          const lt = enterState(t, T.barLab, { y: 14, blur: 6, dur: 0.6 });
          set(S.blToday, { y: ex.y + lt.y, opacity: lt.opacity * ex.opacity, blur: lt.blur + ex.blur });
          const le = enterState(t, T.barLab + 0.06, { y: 14, blur: 6, dur: 0.6 });
          set(S.blEnd, { y: ex.y + le.y, opacity: le.opacity * ex.opacity, blur: le.blur + ex.blur });
        }
      }

      // =================== D2 ===================
      const d2On = t >= T.morph;
      S.L2.style.display = d2On ? "block" : "none";
      if (d2On) {
        S.steps.forEach((s, i) => {
          const m0 = T.morph + i * T.mStag;
          const mp = ease.inOutQuad(prog(t, m0, m0 + T.morphDur));
          const lin = prog(t, m0, m0 + T.morphDur);
          // posição: da linha de lista até o passo
          set(s.row, { y: lerp(S.dy0[i], 0, mp), opacity: i < 2 ? 1 : prog(lin, 0.04, 0.36) });
          // figurino de linha de lista: fica nítido na primeira parte do trajeto (lê-se "a lista está andando"),
          // depois o nome cede lugar ao texto do passo numa troca curta e nítida
          const c = s.cos;
          const np = prog(lin, 0.36, 0.58);
          set(c.nm, { opacity: 1 - np, blur: 3 * np, y: -5 * np });
          const tg = prog(lin, 0.16, 0.38);
          set(c.tag, { opacity: 1 - tg, blur: 3 * tg, y: -4 * tg });
          set(c.bgf, { opacity: i === 0 ? 1 - prog(lin, 0.1, 0.5) : 0 });
          set(c.sp, { opacity: 1 - prog(lin, 0, 0.3) });
          const bs = 1 - ease.inBack(prog(t, m0 + 0.08, m0 + 0.33));
          set(c.pn, { scale: Math.max(0, bs), opacity: bs > 0.01 ? 1 : 0 });
          const bs2 = 1 - ease.inBack(prog(t, m0 + 0.12, m0 + 0.37));
          set(c.ph, { scale: Math.max(0, bs2), opacity: bs2 > 0.01 ? 1 : 0 });
          c.el.style.display = lin < 0.6 ? "block" : "none";
          // avatar → disco
          const dp = ease.inOutCubic(prog(lin, 0.25, 0.9));
          set(s.box, { scale: lerp(60 / 64, 1, dp) });
          const rad = lerp(19.2, 32, dp);
          const key = rad.toFixed(1);
          if (s.lastR !== key) {
            s.lastR = key;
            s.o.style.borderRadius = key + "px";
            s.o.style.background = `rgba(58,47,76,${(0.65 * (1 - dp)).toFixed(3)})`;
            s.o.style.borderWidth = lerp(1.6, 2, dp).toFixed(2) + "px";
            s.o.style.borderColor = `rgba(${Math.round(lerp(255, 220, dp))},${Math.round(lerp(255, 194, dp))},255,${lerp(0.1, 0.34, dp).toFixed(3)})`;
          }
          set(s.ic, { opacity: 1 - prog(lin, 0.3, 0.5), scale: lerp(1, 0.6, prog(lin, 0.3, 0.5)) });
          set(s.dt, { opacity: 1 - prog(lin, 0.2, 0.4), scale: 1 - prog(lin, 0.2, 0.4) });
          // texto do passo entra na mesma linha
          const tp = prog(lin, 0.48, 0.86);
          const te = ease.outCubic(tp);
          // marcação pelo scanner local
          const ct = S.chk[i];
          const nIn = prog(lin, 0.5, 0.85);
          const nOut = prog(t, ct - 0.02, ct + 0.12);
          set(s.n, { opacity: nIn * (1 - nOut), scale: lerp(0.6, 1, ease.outCubic(nIn)) * lerp(1, 0.4, ease.inCubic(nOut)) });
          const spg = spring(t - ct, { freq: 2.5, damping: 0.5 });
          // onda de brilho no clímax (40 ms por disco) + respiração defasada
          const wv = Math.sin(Math.PI * prog(t, T.done + i * 0.04, T.done + i * 0.04 + 0.42));
          const breath = t > T.done + 0.5 ? 0.06 * Math.sin(((t - i * 0.15) * 2 * Math.PI) / 1.8) * prog(t, T.done + 0.5, T.done + 1.0) : 0;
          set(s.f, { scale: t > ct ? spg * (1 + 0.05 * wv) : 0, opacity: t > ct ? 1 : 0, brightness: 1 + 0.35 * wv + breath });
          set(s.o, { opacity: 1 - prog(t, ct, ct + 0.2) });
          S.drawCk[i](tw(t, ct + 0.08, 0.34, ease.outCubic));
          s.ck.style.opacity = t > ct + 0.08 ? "1" : "0";
          const wp = prog(t, ct + 0.04, ct + 0.7);
          set(s.wave, { opacity: wp > 0 && wp < 1 ? 0.7 * Math.pow(1 - wp, 2) : 0, scale: lerp(1, 1.65, ease.outCubic(wp)) });
          // texto: entra apagado, acende ao marcar
          const lp = tw(t, ct + 0.02, 0.4, ease.outCubic);
          set(s.tx, { opacity: te, blur: 4 * (1 - te), y: lerp(7, 0, te) });
          const col = `rgba(255,255,255,${lerp(0.62, 1, lp).toFixed(3)})`;
          if (s.lastC !== col) {
            s.tx.style.color = col;
            s.lastC = col;
          }
          // separador do passo + luz correndo sobre ele
          set(s.sep, { opacity: prog(lin, 0.5, 1) });
          const ls = prog(t, ct + 0.04, ct + 0.7);
          set(s.sl, { x: lerp(-40, S.rowW - 94 - 110, ease.inOutCubic(ls)), opacity: Math.sin(Math.PI * ls) });
          // eco narrativo: "quem não comprou" ganha o âmbar de "lista."
          if (s.qc) {
            const qp = tw(t, T.done + 0.3, 0.45, ease.outCubic);
            const k = qp.toFixed(3);
            if (s.lastQ !== k) {
              s.lastQ = k;
              s.qc.style.color = qp > 0.001 ? `rgb(255,${Math.round(lerp(255, 192, qp))},${Math.round(lerp(255, 98, qp))})` : "";
              s.qc.style.textShadow = qp > 0.01 ? `0 0 18px rgba(255,170,60,${(0.35 * qp).toFixed(3)})` : "none";
            }
          }
        });
        // espinha neon: segmentos se desenham conforme o scanner passa
        const sy = S.scY0 + (S.scY1 - S.scY0) * ease.inOutQuad(prog(t, T.scan0, T.scan0 + T.scanDur));
        S.spines.forEach((sp, i) => {
          const a = S.discC[i] + 34, b = S.discC[i + 1] - 34;
          const p = clamp((sy - a) / (b - a));
          const wv = Math.sin(Math.PI * prog(t, T.done + i * 0.04 + 0.02, T.done + i * 0.04 + 0.44));
          set(sp, { sx: 1, sy: p, opacity: (p > 0 ? 0.85 : 0) + 0.15 * wv, brightness: 1 + 0.4 * wv });
        });
        // scanner local
        {
          const vis = t > T.scan0 - 0.12 && t < T.scan0 + T.scanDur + 0.25;
          S.lscan.style.display = vis ? "block" : "none";
          if (vis) {
            const op = prog(t, T.scan0 - 0.12, T.scan0 + 0.1) * (1 - prog(t, T.scan0 + T.scanDur - 0.05, T.scan0 + T.scanDur + 0.25));
            set(S.lscan, { y: STEPS_T + sy, opacity: op });
          }
        }
        // ponto de luz descendo a espinha (movimento secundário da composição final)
        {
          const lt = t - (T.done + 0.6);
          if (lt > 0) {
            const f = (lt / 2.4) % 1;
            const y = lerp(S.discC[0], S.discC[4], ease.inOutQuad(f));
            set(S.sdot, { y: y - 9, opacity: 0.55 * Math.sin(Math.PI * f) * prog(lt, 0, 0.3) });
          } else set(S.sdot, { opacity: 0 });
        }
      }
    },
  });
})();
