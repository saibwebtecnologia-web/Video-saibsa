/*
 * SAIB.ui — kit visual compartilhado do vídeo "SAIB Direct: um app, dois lados".
 * Aparelhos em CSS 3D (celular e notebook com espessura real), sistema de poses/câmera,
 * linha holográfica, anel de toque, cursor, vidro holográfico e primitivas de UI do app e do portal.
 *
 * Tudo é determinístico: nada de Math.random, Date, transições/animações CSS ou rAF.
 * Os construtores (phone(), laptop(), app.*, portal.*) só montam DOM; o movimento é aplicado
 * pelos atos em update(t) chamando pose(), glare(), setLid(), draw() etc.
 */
(function () {
  const SAIB = (window.SAIB = window.SAIB || {});
  const { h, lerp, clamp, noise, ease, spring, prog } = SAIB.fx;
  let UID = 0; // ids únicos (gradientes SVG) — determinístico pela ordem de construção
  const uid = (p) => `${p}${++UID}`;

  /* ------------------------------------------------------------------ ícones */
  // Ícone Lucide como <svg>. name: "check", "truck", ... (ver lucide-nodes.js)
  function icon(name, o = {}) {
    const { size = 48, stroke = 2, color = "currentColor", fill = "none" } = o;
    const nodes = (window.LUCIDE && window.LUCIDE[name]) || [];
    if (!nodes.length) console.error("ícone Lucide inexistente: " + name);
    const svg = h("svg", {
      viewBox: "0 0 24 24",
      width: size,
      height: size,
      fill,
      stroke: color,
      "stroke-width": stroke,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      style: { display: "block", flex: "none", overflow: "visible" },
    });
    for (const [tag, attrs] of nodes) svg.append(h(tag, attrs));
    return svg;
  }

  /* ------------------------------------------------------------------ poses e câmera */
  const P0 = { x: 540, y: 960, z: 0, rx: 0, ry: 0, rz: 0, s: 1 };
  const KEYS = ["x", "y", "z", "rx", "ry", "rz", "s"];
  const full = (P) => Object.assign({}, P0, P || {});

  // Palco 3D: contêiner de quadro inteiro com perspectiva. Dica: um stage3d por aparelho,
  // para poder esmaecer cada um (opacity no stage3d NÃO achata o 3D do aparelho).
  function stage3d(o = {}) {
    const el = h("div", { class: "stage3d" });
    if (o.perspective) el.style.perspective = o.perspective + "px";
    return el;
  }

  /*
   * pose(el, P): aplica {x, y, z, rx, ry, rz, s} a um aparelho (phone().el / laptop().el).
   * x, y = posição NO QUADRO (px) do ponto-âncora do aparelho (celular: centro; notebook: centro da dobradiça).
   * Ordem: translate → rotateX → rotateY → rotateZ → scale3d (rz gira o aparelho "sobre a mesa" quando rx inclina).
   */
  function pose(el, P) {
    const d = el && (el._dev || el);
    const node = d.el || el;
    const a = node._anchor || { x: 0, y: 0 };
    const q = full(P);
    node.style.transformOrigin = `${a.x}px ${a.y}px`;
    node.style.transform =
      `translate3d(${(q.x - a.x).toFixed(2)}px, ${(q.y - a.y).toFixed(2)}px, ${q.z.toFixed(2)}px) ` +
      `rotateX(${q.rx.toFixed(3)}deg) rotateY(${q.ry.toFixed(3)}deg) rotateZ(${q.rz.toFixed(3)}deg) ` +
      `scale3d(${q.s.toFixed(4)}, ${q.s.toFixed(4)}, ${q.s.toFixed(4)})`;
    const dev = node._dev;
    if (dev) {
      dev._pose = q;
      if (dev._afterPose) dev._afterPose();
    }
    return q;
  }
  function lerpPose(a, b, p) {
    const A = full(a), B = full(b), o = {};
    for (const k of KEYS) o[k] = lerp(A[k], B[k], p);
    return o;
  }
  // soma offsets (ex.: drift) a uma pose; s é multiplicado
  function addPose(P, D) {
    const o = full(P);
    if (!D) return o;
    for (const k of KEYS) if (D[k] !== undefined) o[k] = k === "s" ? o[k] * D[k] : o[k] + D[k];
    return o;
  }
  /*
   * drift(T): deriva lenta da câmera em função do TEMPO GLOBAL (ctx.start + t).
   * Dois atos que chamam drift com o mesmo T derivam igual (emendas invisíveis).
   * amp escala tudo (1 = alguns graus).
   */
  function drift(T, amp = 1) {
    const n2 = (x, s) => 0.65 * noise(x, s) + 0.35 * noise(x * 2.3 + 7.1, s + 50);
    return {
      rx: 1.5 * amp * n2(T * 0.13 + 3, 11),
      ry: 2.4 * amp * n2(T * 0.11 + 5, 23),
      rz: 0.7 * amp * n2(T * 0.09 + 1, 37),
      y: 7 * amp * n2(T * 0.12 + 2, 51),
    };
  }

  /*
   * POSES nomeadas (ajustadas renderizando). Retângulos aproximados NO QUADRO estão no relatório do kit.
   * celular: âncora = centro do aparelho. notebook: âncora = centro da dobradiça (tampa aberta acima, base abaixo).
   */
  const POSES = {
    phoneFront: { x: 540, y: 900, z: 0, rx: 0, ry: 0, rz: 0, s: 0.85 },
    phoneHero: { x: 540, y: 1062, z: 0, rx: 7, ry: -9, rz: 1.2, s: 1.1 },
    phoneSplit: { x: 366, y: 645, z: 0, rx: 52, ry: 0, rz: 36, s: 0.47 },
    laptopSplit: { x: 600, y: 1170, z: 0, rx: 58, ry: 0, rz: 36, s: 0.54 },
    laptopHero: { x: 530, y: 1225, z: 0, rx: 72, ry: 0, rz: -4, s: 0.88 },
  };
  // ângulo da tampa (graus entre tampa e base) usado nas poses do notebook
  const LID = { split: 108, hero: 103 };

  /* ------------------------------------------------------------------ medidas no quadro */
  // retângulo projetado (eixo alinhado) de qualquer elemento, já com 3D/perspectiva
  function rectOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height, left: r.left, top: r.top, right: r.right, bottom: r.bottom, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  }
  // posição (layout, sem transform) de el dentro de um ancestral posicionado — coordenadas nativas da tela
  function offsetIn(el, ancestor) {
    let x = 0, y = 0, n = el;
    while (n && n !== ancestor) {
      x += n.offsetLeft;
      y += n.offsetTop;
      n = n.offsetParent;
    }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight, cx: x + el.offsetWidth / 2, cy: y + el.offsetHeight / 2 };
  }
  // marcadores 1×1 dentro da tela de um aparelho: ponto projetado exato (u, v em frações da tela)
  function makePointer(host, W, H) {
    const cache = {};
    return function point(u, v) {
      const k = u.toFixed(4) + "," + v.toFixed(4);
      let m = cache[k];
      if (!m) {
        m = cache[k] = h("i", { class: "dv-mark", style: { left: u * W + "px", top: v * H + "px" } });
        host.append(m);
      }
      const r = m.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
  }

  /* ------------------------------------------------------------------ projeção analítica */
  // Mesma matemática do CSS (stage3d: perspective 3600, origem 540/960; pose: translate → rotX → rotY → rotZ → scale).
  const PERSP = { d: 3600, ox: 540, oy: 960 };
  // ponto local do aparelho (px nativos, z) → ponto 3D no mundo, pela pose P e âncora a
  function toWorld(P, a, x, y, z) {
    const q = full(P);
    const R = Math.PI / 180;
    const cx = Math.cos(q.rx * R), sx = Math.sin(q.rx * R);
    const cy = Math.cos(q.ry * R), sy = Math.sin(q.ry * R);
    const cz = Math.cos(q.rz * R), sz = Math.sin(q.rz * R);
    let X = (x - a.x) * q.s, Y = (y - a.y) * q.s, Z = z * q.s;
    let x1 = X * cz - Y * sz, y1 = X * sz + Y * cz;
    let x2 = x1 * cy + Z * sy, z2 = -x1 * sy + Z * cy;
    let y3 = y1 * cx - z2 * sx, z3 = y1 * sx + z2 * cx;
    return [x2 + q.x, y3 + q.y, z3 + q.z];
  }
  function toFrame([X, Y, Z]) {
    const k = PERSP.d / (PERSP.d - Z);
    return { x: PERSP.ox + (X - PERSP.ox) * k, y: PERSP.oy + (Y - PERSP.oy) * k, z: Z };
  }
  // matriz 2D (afim) que leva o retângulo local [x0,x0+w]×[y0,y0+h] (no plano z) ao quadro, aproximando pelo centro
  function planeMatrix(map, x0, y0, w, hh, z) {
    const c = map(x0 + w / 2, y0 + hh / 2, z);
    const r = map(x0 + w, y0 + hh / 2, z), l = map(x0, y0 + hh / 2, z);
    const b = map(x0 + w / 2, y0 + hh, z), t = map(x0 + w / 2, y0, z);
    const A = (r.x - l.x) / w, B = (r.y - l.y) / w, C = (b.x - t.x) / hh, D = (b.y - t.y) / hh;
    const E = c.x - A * (w / 2) - C * (hh / 2), F = c.y - B * (w / 2) - D * (hh / 2);
    return `matrix(${A.toFixed(5)}, ${B.toFixed(5)}, ${C.toFixed(5)}, ${D.toFixed(5)}, ${E.toFixed(2)}, ${F.toFixed(2)})`;
  }
  /*
   * Sombra de contato + brilho roxo: um <canvas> 2D desenhado UMA vez no build e mapeado (afim) para o plano
   * de trás do aparelho a cada pose. Fica FORA do contexto 3D (barato) e por baixo do aparelho.
   * box: área local coberta {x, y, w, h}; shapes: [{x, y, w, h, r, color, blur}] em px locais.
   */
  function softShadow(box, shapes, k = 0.25) {
    const cv = h("canvas", { width: Math.ceil(box.w * k), height: Math.ceil(box.h * k) });
    const c = cv.getContext("2d");
    for (const sh of shapes) {
      c.filter = `blur(${(sh.blur * k).toFixed(2)}px)`;
      c.fillStyle = sh.color;
      c.beginPath();
      c.roundRect((sh.x - box.x) * k, (sh.y - box.y) * k, sh.w * k, sh.h * k, sh.r * k);
      c.fill();
    }
    c.filter = "none";
    Object.assign(cv.style, { position: "absolute", left: 0, top: 0, width: box.w + "px", height: box.h + "px", transformOrigin: "0 0", pointerEvents: "none" });
    cv._box = box;
    return cv;
  }

  /* ------------------------------------------------------------------ metal */
  const METAL_FRONT =
    "linear-gradient(145deg, #fbfbfe 0%, #c9c9d4 16%, #8e8e9d 34%, #e9e9f1 50%, #a3a3b2 68%, #f2f2f8 86%, #b9b9c7 100%)";
  // camada de espessura (silhueta inteira em translateZ): poucas camadas = composição barata.
  // Com deslocamento pequeno entre camadas, a união das silhuetas forma a lateral contínua.
  const slab = (W, H, radius, z, bg) =>
    h("div", { style: { left: 0, top: 0, width: W + "px", height: H + "px", borderRadius: radius, transform: `translateZ(${z.toFixed(2)}px)`, background: bg } });

  /* ------------------------------------------------------------------ CELULAR */
  /*
   * phone() → { el, shadow, screen, content, overlay, setScreen(node|[nodes]), glare(p), point(u,v), proj(u,v), ... }
   * Nativo: aparelho 560 × 1180, tela 520 × 1140 (cantos 60), espessura 22 px (4 camadas em translateZ).
   * - content: onde fica a tela (setScreen troca); overlay: por cima da tela (anéis de toque, toasts); não é limpo.
   * - glare(p): reflexo diagonal do vidro; p 0..1 atravessa (fora disso, escondido). Custa um repaint da face.
   * - shadow: <canvas> com sombra de contato + brilho; é inserido no stage3d pelo mount() e segue a pose.
   * NÃO aplique opacity/filter/overflow no el (achata o 3D): esmaeça o stage3d pai.
   */
  function phone(o = {}) {
    const W = 560, H = 1180, T = 22, R = 84;
    const SW = 520, SH = 1140, SX = 20, SY = 20, SR = 60;
    const el = h("div", { class: "dv dv-phone", style: { width: W + "px", height: H + "px" } });
    el._anchor = { x: W / 2, y: H / 2 };
    const rad = R + "px";

    // sombra/brilho (2D, fora do 3D)
    const M = 400;
    const shadow = softShadow({ x: -M, y: -M, w: W + 2 * M, h: H + 2 * M }, [
      { x: -80, y: -50, w: W + 160, h: H + 140, r: 220, color: "rgba(167,139,250,0.34)", blur: 90 },
      { x: 36, y: 70, w: W - 40, h: H - 40, r: R, color: "rgba(14,4,48,0.6)", blur: 44 },
      { x: 10, y: 20, w: W - 20, h: H - 20, r: R, color: "rgba(14,4,48,0.55)", blur: 12 },
    ]);

    // espessura: tampa traseira (vidro fosco com aro), faixa acetinada e chanfro claro
    el.append(slab(W, H, rad, -T, "linear-gradient(150deg, #d9d9e2 0%, #b3b3c1 55%, #9d9dac 100%)"));
    const mid = slab(W, H, rad, (-T * 2) / 3, "linear-gradient(140deg, #d6d6df 0%, #a9a9b8 45%, #8d8d9c 100%)");
    const cham = slab(W, H, rad, -T / 3, "linear-gradient(140deg, #f4f4f8 0%, #c8c8d3 45%, #a7a7b5 100%)");
    // botões laterais (saem 4 px da borda)
    const btn = (side, top, hh) =>
      h("i", {
        style: {
          position: "absolute", [side]: "-4px", top: top + "px", width: "8px", height: hh + "px", borderRadius: "3px",
          background: "linear-gradient(90deg, #9a9aa9, #ebebf1 50%, #9a9aa9)",
        },
      });
    for (const sl of [mid, cham]) sl.append(btn("left", 236, 54), btn("left", 330, 92), btn("left", 440, 92), btn("right", 370, 150));
    el.append(mid, cham);

    // face frontal: aro de metal → vidro preto → tela
    const front = h("div", {
      style: {
        left: 0, top: 0, width: W + "px", height: H + "px", borderRadius: rad, background: METAL_FRONT,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.75), inset 0 2px 2px rgba(255,255,255,0.8), inset 0 -2px 3px rgba(40,30,70,0.35)",
      },
    });
    const glass = h("div", {
      style: {
        position: "absolute", left: "5px", top: "5px", right: "5px", bottom: "5px", borderRadius: R - 5 + "px",
        background: "#050409", overflow: "hidden",
        boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.10), inset 0 0 0 3px rgba(0,0,0,0.9)",
      },
    });
    const screen = h("div", {
      class: "dv-screen",
      style: {
        position: "absolute", left: SX - 5 + "px", top: SY - 5 + "px", width: SW + "px", height: SH + "px",
        borderRadius: SR + "px", overflow: "hidden", background: "#fff",
      },
    });
    const content = h("div", { style: { position: "absolute", inset: 0 } });
    const overlay = h("div", { style: { position: "absolute", inset: 0, pointerEvents: "none" } });
    const marks = h("div", { style: { position: "absolute", inset: 0, pointerEvents: "none" } });
    // ilha dinâmica (pílula) com lente
    const island = h("div", {
      style: {
        position: "absolute", left: SW / 2 - 64 + "px", top: "18px", width: "128px", height: "38px", borderRadius: "19px",
        background: "#000", boxShadow: "0 0 0 1px rgba(255,255,255,0.04)",
      },
    }, [
      h("i", {
        style: {
          position: "absolute", right: "13px", top: "11px", width: "16px", height: "16px", borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #3b3f6b 0%, #14152a 45%, #050508 70%)",
        },
      }),
    ]);
    screen.append(content, overlay, marks, island);
    // reflexo estático suave + reflexo móvel (iridescente) sobre todo o vidro
    const sheenStatic = h("div", {
      style: {
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 70%, rgba(201,182,255,0.06) 100%)",
      },
    });
    const glareEl = h("div", {
      style: {
        position: "absolute", top: "-30%", height: "160%", left: 0, width: "34%", pointerEvents: "none", display: "none",
        background:
          "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(201,182,255,0.10) 28%, rgba(255,255,255,0.24) 46%, rgba(94,231,255,0.10) 58%, rgba(255,122,217,0.08) 70%, rgba(255,255,255,0) 100%)",
      },
    });
    glass.append(screen, sheenStatic, glareEl);
    front.append(glass);
    el.append(front);

    const dev = {
      kind: "phone", el, front, shadow, screen, content, overlay, island, W, H, SW, SH, T,
      setScreen(node) {
        const list = [].concat(node || []);
        if (list.length === content.childNodes.length && list.every((n, i) => content.childNodes[i] === n)) return;
        content.replaceChildren(...list);
      },
      glare(p) {
        if (p <= 0 || p >= 1) {
          if (glareEl.style.display !== "none") glareEl.style.display = "none";
          return;
        }
        glareEl.style.display = "block";
        glareEl.style.transform = `translateX(${lerp(-170, 330, p).toFixed(2)}%) rotate(16deg)`;
      },
      point: makePointer(marks, SW, SH),
      // ponto da TELA (u, v em frações) projetado no quadro pela última pose (analítico, sem layout)
      proj(u, v, z = 0) {
        return toFrame(toWorld(dev._pose, el._anchor, SX + u * SW, SY + v * SH, z));
      },
      // ponto local qualquer (px nativos do aparelho)
      projLocal(x, y, z = 0) {
        return toFrame(toWorld(dev._pose, el._anchor, x, y, z));
      },
      _pose: full(POSES.phoneFront),
      _afterPose() {
        const b = shadow._box;
        shadow.style.transform = planeMatrix((x, y, z) => dev.projLocal(x, y, z), b.x, b.y, b.w, b.h, -T - 1);
      },
    };
    el._dev = dev;
    return dev;
  }

  /* ------------------------------------------------------------------ NOTEBOOK */
  // teclado em um único SVG (barato): teclas pretas sobre poço de alumínio
  function keyboardSVG() {
    const u = 52, g = 6, kh = 46, pad = 8;
    const rows = [
      { h: 28, keys: Array(14).fill(1) },
      { h: kh, keys: [...Array(13).fill(1), 1.5] },
      { h: kh, keys: [1.5, ...Array(13).fill(1)] },
      { h: kh, keys: [1.75, ...Array(11).fill(1), 1.75] },
      { h: kh, keys: [2.25, ...Array(10).fill(1), 2.25] },
      { h: kh, keys: [1, 1, 1, 1.25, 5, 1.25, 1, "arrows"] },
    ];
    const totalW = 14.5 * u - g;
    const totalH = pad * 2 + rows.reduce((a, r) => a + r.h, 0) + g * (rows.length - 1);
    const gid = uid("kc");
    const svg = h("svg", { width: totalW + pad * 2, height: totalH, viewBox: `0 0 ${totalW + pad * 2} ${totalH}`, style: { display: "block" } });
    svg.append(
      h("defs", {}, [
        h("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, [
          h("stop", { offset: 0, "stop-color": "#34343b" }),
          h("stop", { offset: 1, "stop-color": "#1a1a1f" }),
        ]),
      ])
    );
    let y = pad;
    rows.forEach((r, ri) => {
      let x = pad;
      const fnW = (totalW - 13 * g) / 14;
      r.keys.forEach((k) => {
        if (k === "arrows") {
          const aw = (totalW + pad - x - 2 * g) / 3;
          const hh = (r.h - g / 2) / 2;
          for (let j = 0; j < 3; j++) {
            const ax = x + j * (aw + g);
            if (j === 1) svg.append(h("rect", { x: ax, y, width: aw, height: hh, rx: 5, fill: `url(#${gid})` }));
            svg.append(h("rect", { x: ax, y: y + hh + g / 2, width: aw, height: hh, rx: 5, fill: `url(#${gid})` }));
          }
          return;
        }
        const kw = ri === 0 ? fnW : k * u - g;
        svg.append(h("rect", { x, y, width: kw, height: r.h, rx: 7, fill: `url(#${gid})` }));
        svg.append(h("rect", { x: x + 1, y: y + 0.5, width: kw - 2, height: 1.2, rx: 0.6, fill: "rgba(255,255,255,0.10)" }));
        x += kw + g;
      });
      y += r.h + g;
    });
    return { svg, w: totalW + pad * 2, h: totalH };
  }

  /*
   * laptop() → { el, lid, deck, shadow, screen, content, overlay, setScreen, setLid(deg), glare(p), point(u,v), proj(u,v), ... }
   * Nativo: tampa 1040 × 672 (tela 1000 × 625, cantos 8), base 1040 × 700 com teclado e trackpad.
   * Espessura: base 16 px, tampa 6 px. setLid(deg): ângulo entre tampa e base (0 fechado, 90 em pé, ~105 aberto).
   * Âncora da pose = centro da dobradiça (borda de trás da base). O el é a BASE; a tampa gira na dobradiça.
   */
  function laptop(o = {}) {
    const W = 1040, D = 700, TB = 16;
    const LH = 672, TL = 6;
    const SW = 1000, SH = 625, SX = 20, SY = 18;
    const el = h("div", { class: "dv dv-laptop", style: { width: W + "px", height: D + "px" } });
    el._anchor = { x: W / 2, y: 0 };
    const R = "18px 18px 30px 30px";

    // sombra de contato (plano da mesa) e brilho atrás da tampa — 2D, fora do 3D
    const M = 420;
    const shadow = softShadow({ x: -M, y: -M, w: W + 2 * M, h: D + 2 * M }, [
      { x: -100, y: -160, w: W + 200, h: D + 240, r: 180, color: "rgba(167,139,250,0.30)", blur: 90 },
      { x: 40, y: 60, w: W - 30, h: D - 10, r: 40, color: "rgba(14,4,48,0.66)", blur: 46 },
      { x: 10, y: 12, w: W - 20, h: D - 10, r: 30, color: "rgba(14,4,48,0.6)", blur: 12 },
    ]);
    const MG = 380;
    const lidGlow = softShadow({ x: -MG, y: -MG, w: W + 2 * MG, h: LH + 2 * MG }, [
      { x: -60, y: -50, w: W + 120, h: LH + 90, r: 150, color: "rgba(167,139,250,0.34)", blur: 90 },
    ]);

    el.append(slab(W, D, R, -TB, "linear-gradient(180deg, #a9aab5, #85868f)"));
    el.append(slab(W, D, R, -TB / 2, "linear-gradient(90deg, #d2d3da 0%, #b7b8c2 40%, #a2a3ae 100%)"));
    // tampo do teclado
    const deck = h("div", {
      style: {
        left: 0, top: 0, width: W + "px", height: D + "px", borderRadius: R,
        background: "linear-gradient(180deg, #d9dae1 0%, #cfd0d8 60%, #c7c8d1 100%)",
        boxShadow: "inset 0 -3px 0 rgba(255,255,255,0.75), inset 0 0 0 1px rgba(255,255,255,0.5)",
        overflow: "hidden",
      },
    });
    // dobradiça
    deck.append(
      h("i", {
        style: {
          position: "absolute", left: "70px", right: "70px", top: 0, height: "16px", borderRadius: "0 0 6px 6px",
          background: "linear-gradient(180deg, #121217, #3b3b44 70%, #6e6e78)",
        },
      })
    );
    const kb = keyboardSVG();
    const well = h("div", {
      style: {
        position: "absolute", left: (W - kb.w - 16) / 2 + "px", top: "44px", width: kb.w + 16 + "px", height: kb.h + 16 + "px",
        borderRadius: "16px", padding: "8px", background: "#b6b7c1",
        boxShadow: "inset 0 2px 4px rgba(30,20,60,0.25), inset 0 -1px 0 rgba(255,255,255,0.6)",
      },
    });
    well.append(kb.svg);
    deck.append(well);
    // grades dos alto-falantes
    const grill = (left) =>
      h("i", {
        style: {
          position: "absolute", left: left + "px", top: "52px", width: "66px", height: kb.h + "px", borderRadius: "10px",
          backgroundImage: "radial-gradient(circle, rgba(40,35,70,0.45) 1.3px, transparent 1.8px)", backgroundSize: "9px 9px",
        },
      });
    deck.append(grill(42), grill(W - 42 - 66));
    // trackpad
    const tpTop = 44 + kb.h + 16 + 34;
    deck.append(
      h("i", {
        style: {
          position: "absolute", left: (W - 460) / 2 + "px", top: tpTop + "px", width: "460px", height: D - tpTop - 34 + "px", borderRadius: "18px",
          background: "linear-gradient(180deg, #d3d4dc, #cacbd4)",
          boxShadow: "inset 0 0 0 1.5px rgba(60,50,90,0.14), inset 0 2px 3px rgba(255,255,255,0.6)",
        },
      })
    );
    el.append(deck);

    // tampa (gira em torno da borda inferior = dobradiça)
    const lid = h("div", {
      class: "dv-lid",
      style: { left: 0, top: -LH + "px", width: W + "px", height: LH + "px", transformOrigin: "50% 100%" },
    });
    lid.append(slab(W, LH, "22px 22px 10px 10px", -TL, "linear-gradient(180deg, #e6e7ed, #b4b5c0)"));
    const face = h("div", {
      style: {
        left: 0, top: 0, width: W + "px", height: LH + "px", borderRadius: "22px 22px 10px 10px",
        background: "linear-gradient(180deg, #e8e9ef, #b9bac4)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6)",
      },
    });
    const glassL = h("div", {
      style: {
        position: "absolute", left: "4px", top: "4px", right: "4px", bottom: "4px", borderRadius: "18px 18px 7px 7px",
        background: "#060509", overflow: "hidden", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.07)",
      },
    });
    const screen = h("div", {
      class: "dv-screen",
      style: {
        position: "absolute", left: SX - 4 + "px", top: SY - 4 + "px", width: SW + "px", height: SH + "px",
        borderRadius: "8px", overflow: "hidden", background: "#fff",
      },
    });
    const content = h("div", { style: { position: "absolute", inset: 0 } });
    const overlay = h("div", { style: { position: "absolute", inset: 0, pointerEvents: "none" } });
    const marks = h("div", { style: { position: "absolute", inset: 0, pointerEvents: "none" } });
    screen.append(content, overlay, marks);
    // câmera (sem logotipos)
    const cam = h("i", {
      style: {
        position: "absolute", left: W / 2 - 4 - 4 + "px", top: "5px", width: "8px", height: "8px", borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #3b3f6b, #0a0a12 70%)",
      },
    });
    const sheenStatic = h("div", {
      style: {
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(165deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 72%, rgba(201,182,255,0.05) 100%)",
      },
    });
    const glareEl = h("div", {
      style: {
        position: "absolute", top: "-60%", height: "220%", left: 0, width: "22%", pointerEvents: "none", display: "none",
        background:
          "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(201,182,255,0.08) 28%, rgba(255,255,255,0.22) 46%, rgba(94,231,255,0.09) 58%, rgba(255,122,217,0.07) 70%, rgba(255,255,255,0) 100%)",
      },
    });
    glassL.append(screen, cam, sheenStatic, glareEl);
    face.append(glassL);
    lid.append(face);
    el.append(lid);

    // ponto local da tampa (px nativos da tampa, z) → ponto local da base
    const lidToBase = (x, y, z) => {
      const ph = ((180 - dev._lid) * Math.PI) / 180; // rotateX(-ph)
      const yy = y - LH, zz = z; // relativo à dobradiça (origem 50% 100%)
      const c = Math.cos(-ph), s = Math.sin(-ph);
      return [x, yy * c - zz * s, yy * s + zz * c + 1];
    };
    const dev = {
      kind: "laptop", el, lid, deck, face, shadow, lidGlow, screen, content, overlay, W, D, LH, SW, SH,
      setScreen(node) {
        const list = [].concat(node || []);
        if (list.length === content.childNodes.length && list.every((n, i) => content.childNodes[i] === n)) return;
        content.replaceChildren(...list);
      },
      setLid(deg) {
        dev._lid = deg;
        // rotateX positivo afasta o topo; a tampa precisa subir em direção a +z (para cima da mesa)
        lid.style.transform = `translateZ(1px) rotateX(${(-(180 - deg)).toFixed(3)}deg)`;
        if (dev._posed) dev._afterPose();
      },
      glare(p) {
        if (p <= 0 || p >= 1) {
          if (glareEl.style.display !== "none") glareEl.style.display = "none";
          return;
        }
        glareEl.style.display = "block";
        glareEl.style.transform = `translateX(${lerp(-260, 500, p).toFixed(2)}%) rotate(18deg)`;
      },
      point: makePointer(marks, SW, SH),
      // ponto da TELA (u, v em frações) projetado no quadro (analítico; usa a última pose e ângulo da tampa)
      proj(u, v, z = 0) {
        const [x, y, zz] = lidToBase(SX + u * SW, SY + v * SH, z);
        return toFrame(toWorld(dev._pose, el._anchor, x, y, zz));
      },
      // ponto local da BASE (px nativos: x 0..1040, y 0..700 da dobradiça para a frente; z 0 = tampo)
      projLocal(x, y, z = 0) {
        return toFrame(toWorld(dev._pose, el._anchor, x, y, z));
      },
      // ponto local da TAMPA (x 0..1040, y 0..672 de cima para baixo; z 0 = face da tela)
      projLid(x, y, z = 0) {
        const [bx, by, bz] = lidToBase(x, y, z);
        return toFrame(toWorld(dev._pose, el._anchor, bx, by, bz));
      },
      _pose: full(POSES.laptopHero),
      _lid: 104,
      _afterPose() {
        dev._posed = true;
        const b = shadow._box;
        shadow.style.transform = planeMatrix((x, y, z) => dev.projLocal(x, y, z), b.x, b.y, b.w, b.h, -TB - 1);
        const g = lidGlow._box;
        lidGlow.style.transform = planeMatrix((x, y, z) => dev.projLid(x, y, z), g.x, g.y, g.w, g.h, -TL - 2);
      },
    };
    dev.setLid(o.lid ?? LID.hero);
    el._dev = dev;
    return dev;
  }

  /*
   * mount(stage, dev): põe o aparelho no stage3d com sua sombra/brilho por baixo (ordem certa).
   * Equivale a stage.append(...sombras, dev.el).
   */
  function mount(stage, dev) {
    if (dev.lidGlow) stage.append(dev.lidGlow);
    stage.append(dev.shadow, dev.el);
    return dev;
  }

  /* ------------------------------------------------------------------ linha holográfica */
  // curva suave (quadrática) de a até b; bend = deslocamento perpendicular do ponto de controle (px).
  // Na tela (y para baixo): bend > 0 curva para a DIREITA de quem vai de a para b; bend < 0, para a esquerda.
  function curve(a, b, bend = 0) {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
    const cx = mx + (-dy / L) * bend, cy = my + (dx / L) * bend;
    return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  }
  /*
   * holoPath(d?) → { el (svg de quadro inteiro), setD(d), connect(a, b, bend), draw(p), pulse(p, o), along(p), length }
   * Traço iridescente (ciano → lilás → rosa) com brilho em camadas (sem filtro), pulso de luz que viaja,
   * e ponto brilhante opcional (dot(p)). Coordenadas = px do quadro (1080 × 1920).
   */
  function holoPath(d0, o = {}) {
    const { width = 3, glow = 1 } = o;
    const gid = uid("hg"), pid = uid("hp");
    const svg = h("svg", { class: "holo-svg", viewBox: "0 0 1080 1920", width: 1080, height: 1920 });
    const grad = h("linearGradient", { id: gid, gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: 1080, y2: 0 }, [
      h("stop", { offset: "0", "stop-color": "#5ee7ff" }),
      h("stop", { offset: "0.5", "stop-color": "#c9b6ff" }),
      h("stop", { offset: "1", "stop-color": "#ff7ad9" }),
    ]);
    const gradCore = h("linearGradient", { id: pid, gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: 1080, y2: 0 }, [
      h("stop", { offset: "0", "stop-color": "#c9f7ff" }),
      h("stop", { offset: "0.5", "stop-color": "#f1ebff" }),
      h("stop", { offset: "1", "stop-color": "#ffd0f1" }),
    ]);
    svg.append(h("defs", {}, [grad, gradCore]));
    const mk = (w, op, stroke) =>
      h("path", { fill: "none", stroke, "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: op });
    const layers = [
      mk(width * 10, 0.08 * glow, `url(#${gid})`),
      mk(width * 5, 0.16 * glow, `url(#${gid})`),
      mk(width * 2.4, 0.5, `url(#${gid})`),
      mk(width * 0.9, 1, `url(#${pid})`),
    ];
    const pulseGlow = mk(width * 6, 0, "#ffffff");
    const pulseCore = mk(width * 1.6, 0, "#ffffff");
    const g = h("g", {}, [...layers, pulseGlow, pulseCore]);
    const dotHalo = h("circle", { r: width * 6, fill: `url(#${gid})`, opacity: 0 });
    const dotCore = h("circle", { r: width * 2, fill: "#ffffff", opacity: 0 });
    svg.append(g, dotHalo, dotCore);
    let L = 1, drawP = 1, a0 = null, b0 = null;
    const api = {
      el: svg,
      paths: layers,
      get length() {
        return L;
      },
      setD(d) {
        for (const p of [...layers, pulseGlow, pulseCore]) p.setAttribute("d", d);
        L = layers[0].getTotalLength() || 1;
        const s = layers[0].getPointAtLength(0), e = layers[0].getPointAtLength(L);
        for (const gr of [grad, gradCore]) {
          gr.setAttribute("x1", s.x.toFixed(1));
          gr.setAttribute("y1", s.y.toFixed(1));
          gr.setAttribute("x2", (e.x + (Math.abs(e.x - s.x) + Math.abs(e.y - s.y) < 1 ? 1 : 0)).toFixed(1));
          gr.setAttribute("y2", e.y.toFixed(1));
        }
        api.draw(drawP);
        return api;
      },
      connect(a, b, bend = 0) {
        a0 = a;
        b0 = b;
        return api.setD(curve(a, b, bend));
      },
      // desenha de 0 a p (do início ao fim do traço)
      draw(p) {
        drawP = clamp(p);
        for (const pa of layers) {
          pa.style.strokeDasharray = `${L.toFixed(2)} ${(L + 10).toFixed(2)}`;
          pa.style.strokeDashoffset = ((1 - drawP) * L).toFixed(2);
          pa.style.visibility = drawP <= 0.0005 ? "hidden" : "visible";
        }
        return api;
      },
      // pulso de luz: p 0..1 leva o pulso do início ao fim (fora disso, apagado). o.len = comprimento do pulso (px)
      pulse(p, o2 = {}) {
        const len = o2.len ?? 150, op = o2.opacity ?? 1;
        if (p <= 0 || p >= 1) {
          pulseGlow.setAttribute("opacity", 0);
          pulseCore.setAttribute("opacity", 0);
          return api;
        }
        const head = p * (L + len);
        const fade = Math.min(1, p * 8, (1 - p) * 8) * op;
        for (const pa of [pulseGlow, pulseCore]) {
          pa.style.strokeDasharray = `${len.toFixed(2)} ${(L + len * 2).toFixed(2)}`;
          pa.style.strokeDashoffset = (len - head).toFixed(2);
        }
        pulseGlow.setAttribute("opacity", (0.35 * fade).toFixed(3));
        pulseCore.setAttribute("opacity", (0.95 * fade).toFixed(3));
        return api;
      },
      // ponto no traço (p 0..1) → {x, y, angle (graus)}
      along(p) {
        const q = clamp(p) * L;
        const a = layers[0].getPointAtLength(q);
        const b = layers[0].getPointAtLength(Math.min(L, q + 1));
        const c = layers[0].getPointAtLength(Math.max(0, q - 1));
        return { x: a.x, y: a.y, angle: (Math.atan2(b.y - c.y, b.x - c.x) * 180) / Math.PI };
      },
      // ponto brilhante no traço (p 0..1); op 0 esconde
      dot(p, op = 1) {
        const pt = api.along(p);
        for (const c of [dotHalo, dotCore]) {
          c.setAttribute("cx", pt.x.toFixed(2));
          c.setAttribute("cy", pt.y.toFixed(2));
        }
        dotHalo.setAttribute("opacity", (0.35 * op).toFixed(3));
        dotCore.setAttribute("opacity", op.toFixed(3));
        return pt;
      },
      opacity(v) {
        svg.style.opacity = clamp(v).toFixed(4);
        return api;
      },
    };
    if (d0) api.setD(d0);
    return api;
  }

  /*
   * Linha padrão entre os aparelhos nas poses "split" (emendas 7,4 e 19,4): os dois atos devem usar ESTA
   * ligação para desenhar exatamente a mesma linha. Sai da lateral direita da tela do celular e desce
   * em arco até a borda de cima da tampa do notebook.
   */
  const SPLIT_LINE = { phoneUV: [1.0, 0.62], lidXY: [700, 0], bend: -150 };
  function connectSplit(line, ph, lp) {
    const a = ph.proj(SPLIT_LINE.phoneUV[0], SPLIT_LINE.phoneUV[1]);
    const b = lp.projLid(SPLIT_LINE.lidXY[0], SPLIT_LINE.lidXY[1]);
    return line.connect(a, b, SPLIT_LINE.bend);
  }

  /* ------------------------------------------------------------------ toque e cursor */
  // anel de toque (sem mão/dedo). Posicione com ring.at(x, y) (px do contêiner pai, ex. phone.overlay).
  function tapRing(o = {}) {
    const { size = 132, color = "124,58,237" } = o;
    const ring = h("i", { style: { width: size + "px", height: size + "px", border: `3px solid rgba(${color},0.75)`, boxShadow: `0 0 18px rgba(${color},0.35)` } });
    const dot = h("i", { style: { width: size * 0.5 + "px", height: size * 0.5 + "px", background: `rgba(${color},0.22)` } });
    const el = h("div", { class: "tap-ring", style: { display: "none" } }, [dot, ring]);
    el.ring = ring;
    el.dot = dot;
    el.at = (x, y) => {
      el.style.left = x.toFixed(2) + "px";
      el.style.top = y.toFixed(2) + "px";
      return el;
    };
    return el;
  }
  // tap(ring, t, at): toque começa em `at` (s); dura ~0,6 s
  function tap(el, t, at, o = {}) {
    const dur = o.dur ?? 0.6;
    const u = (t - at) / dur;
    if (u < 0 || u > 1) {
      el.style.display = "none";
      return;
    }
    el.style.display = "block";
    const e = ease.outCubic(u);
    el.ring.style.transform = `translate(-50%, -50%) scale(${lerp(0.35, 1.25, e).toFixed(4)})`;
    el.ring.style.opacity = (Math.min(1, u * 6) * Math.pow(1 - u, 1.4)).toFixed(3);
    el.dot.style.transform = `translate(-50%, -50%) scale(${lerp(0.6, 1.1, e).toFixed(4)})`;
    el.dot.style.opacity = (Math.min(1, u * 8) * Math.pow(1 - clamp(u * 1.6), 2)).toFixed(3);
  }
  // escala do botão ao ser tocado: afunda 3 % e volta com mola
  function press(t, at, depth = 0.03) {
    const d = t - at;
    if (d <= 0) return 1;
    if (d < 0.08) return 1 - depth * ease.outQuad(d / 0.08);
    return 1 - depth * (1 - spring(d - 0.08, { freq: 3.2, damping: 0.42 }));
  }
  /*
   * cursor() → { el, at(x, y), click(p) }  seta elegante (mouse-pointer-2) branca com sombra suave.
   * at(x, y) põe a PONTA da seta em (x, y) do contêiner pai (ex. laptop.overlay, coordenadas nativas da tela).
   * click(p): p 0..1 durante o clique (escala 1 → 0,9 → 1).
   */
  function cursor(o = {}) {
    const size = o.size ?? 44;
    const svg = icon("mouse-pointer-2", { size, stroke: 1.6, color: "#1b1236", fill: "#ffffff" });
    svg.style.filter = "drop-shadow(0 4px 6px rgba(20,8,50,0.35))";
    const el = h("div", { class: "ui-cursor", style: { width: size + "px", height: size + "px" } }, [svg]);
    const tip = (4 / 24) * size;
    el.style.transformOrigin = `${tip}px ${tip}px`;
    let x = 0, y = 0, sc = 1;
    const apply = () => (el.style.transform = `translate(${(x - tip).toFixed(2)}px, ${(y - tip).toFixed(2)}px) scale(${sc.toFixed(4)})`);
    return {
      el,
      at(nx, ny) {
        x = nx;
        y = ny;
        apply();
      },
      click(p) {
        sc = p <= 0 || p >= 1 ? 1 : 1 - 0.1 * Math.sin(Math.PI * p);
        apply();
      },
    };
  }

  /* ------------------------------------------------------------------ efeitos */
  // aberração cromática sutil (text-shadow ciano/rosa); amount em px, 0 remove
  function chromatic(el, amount) {
    if (!amount || Math.abs(amount) < 0.05) {
      el.style.textShadow = "";
      return;
    }
    const a = amount.toFixed(2);
    el.style.textShadow = `${-a}px 0 rgba(94,231,255,0.75), ${a}px 0 rgba(255,122,217,0.75)`;
  }
  /*
   * glassCard({w, h, radius, pad}) → elemento .glass (vidro holográfico) com:
   *   el.content (onde pôr o conteúdo) e el.sheen(p) (reflexo diagonal atravessando, p 0..1)
   */
  function glassCard(o = {}) {
    const { w = 400, h: hh = 240, radius = 28, pad = 28 } = o;
    const sheen = h("div", { class: "glass-sheen" });
    const content = h("div", { style: { position: "relative", padding: pad + "px", height: "100%" } });
    const el = h("div", { class: "glass", style: { width: w + "px", height: hh + "px", borderRadius: radius + "px" } }, [sheen, content]);
    el.content = content;
    el.sheen = (p) => sheen.style.setProperty("--sheen", lerp(-60, 130, clamp(p)).toFixed(2) + "%");
    return el;
  }

  /* ------------------------------------------------------------------ ilustrações de produto (genéricas, sem marca) */
  // art: "galao" (água 20 L), "pet" (refrigerante 2 L, fardo), "lata" (cerveja lata, fardo), "garrafa" (água com gás 500 ml, fardo)
  const ART = {
    galao: { tint: "#e7f1ff" },
    pet: { tint: "#fff1e3" },
    lata: { tint: "#fdf6dc" },
    garrafa: { tint: "#e3f7f1" },
  };
  function productArt(kind, size = 92) {
    const id = uid("pa");
    const s = h("svg", { viewBox: "0 0 92 92", width: size, height: size });
    const defs = h("defs");
    s.append(defs);
    const lg = (gid, c, vertical = false) =>
      h("linearGradient", vertical ? { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 } : { id: gid, x1: 0, y1: 0, x2: 1, y2: 0 },
        c.map(([o, col]) => h("stop", { offset: o, "stop-color": col })));
    if (kind === "galao") {
      defs.append(lg(id + "b", [[0, "#cfe6ff"], [0.45, "#9fd0fb"], [1, "#6fb2ec"]]), lg(id + "w", [[0, "#7cc0f5"], [1, "#3f93df"]], true));
      s.append(
        h("rect", { x: 39, y: 9, width: 14, height: 8, rx: 2.5, fill: "#2563eb" }),
        h("rect", { x: 41, y: 16, width: 10, height: 7, fill: "#b9dcfa" }),
        h("path", { d: "M27 30 Q27 22 36 22 L56 22 Q65 22 65 30 L67 76 Q67 83 60 83 L32 83 Q25 83 25 76 Z", fill: `url(#${id}b)` }),
        h("path", { d: "M25.6 50 L66.4 50 L67 76 Q67 83 60 83 L32 83 Q25 83 25 76 Z", fill: `url(#${id}w)`, opacity: 0.55 }),
        h("path", { d: "M27 44 H65 M26.4 62 H66", stroke: "rgba(255,255,255,0.55)", "stroke-width": 1.6, fill: "none" }),
        h("rect", { x: 31, y: 28, width: 5, height: 48, rx: 2.5, fill: "rgba(255,255,255,0.65)" })
      );
    } else if (kind === "pet") {
      defs.append(lg(id + "l", [[0, "#f59e0b"], [0.5, "#d97706"], [1, "#9a4a06"]]));
      const bottle = (x, y, sc, op = 1) =>
        h("g", { transform: `translate(${x} ${y}) scale(${sc})`, opacity: op }, [
          h("rect", { x: -4.5, y: 0, width: 9, height: 6, rx: 1.5, fill: "#7c3aed" }),
          h("path", { d: "M-3.5 6 L3.5 6 L4 11 Q12 16 12 26 L12 66 Q12 72 6 72 L-6 72 Q-12 72 -12 66 L-12 26 Q-12 16 -4 11 Z", fill: `url(#${id}l)` }),
          h("rect", { x: -12, y: 36, width: 24, height: 16, fill: "#ffffff", opacity: 0.92 }),
          h("rect", { x: -12, y: 41, width: 24, height: 5, fill: "#a78bfa" }),
          h("rect", { x: -8, y: 18, width: 3, height: 46, rx: 1.5, fill: "rgba(255,255,255,0.45)" }),
        ]);
      s.append(bottle(28, 16, 0.86, 0.9), bottle(64, 16, 0.86, 0.9), bottle(46, 10, 1));
    } else if (kind === "lata") {
      defs.append(lg(id + "c", [[0, "#b98a12"], [0.3, "#f6d46a"], [0.55, "#e8b830"], [1, "#a8780c"]]), lg(id + "t", [[0, "#9aa0ad"], [0.5, "#eef0f4"], [1, "#9aa0ad"]]));
      const can = (x, y, sc) =>
        h("g", { transform: `translate(${x} ${y}) scale(${sc})` }, [
          h("rect", { x: -13, y: 4, width: 26, height: 50, rx: 4, fill: `url(#${id}c)` }),
          h("ellipse", { cx: 0, cy: 4.5, rx: 12, ry: 3.4, fill: `url(#${id}t)` }),
          h("rect", { x: -13, y: 22, width: 26, height: 12, fill: "#ffffff", opacity: 0.85 }),
          h("rect", { x: -13, y: 25.5, width: 26, height: 3, fill: "#7c3aed", opacity: 0.85 }),
          h("rect", { x: -13, y: 51, width: 26, height: 4, rx: 2, fill: "#b3b8c4" }),
        ]);
      s.append(can(27, 26, 0.95), can(65, 26, 0.95), can(46, 20, 1.08));
    } else {
      defs.append(lg(id + "g", [[0, "#7dd3c0"], [0.5, "#2fb39a"], [1, "#16806d"]]));
      const b = (x, y, sc) =>
        h("g", { transform: `translate(${x} ${y}) scale(${sc})` }, [
          h("rect", { x: -4, y: 0, width: 8, height: 5, rx: 1.4, fill: "#0f766e" }),
          h("path", { d: "M-3 5 L3 5 L3.5 10 Q9 14 9 22 L9 58 Q9 63 4 63 L-4 63 Q-9 63 -9 58 L-9 22 Q-9 14 -3.5 10 Z", fill: `url(#${id}g)`, opacity: 0.92 }),
          h("rect", { x: -9, y: 32, width: 18, height: 12, fill: "#ffffff", opacity: 0.9 }),
          h("circle", { cx: 3, cy: 52, r: 1.6, fill: "rgba(255,255,255,0.75)" }),
          h("circle", { cx: -2, cy: 24, r: 1.3, fill: "rgba(255,255,255,0.75)" }),
          h("circle", { cx: 4, cy: 27, r: 1, fill: "rgba(255,255,255,0.75)" }),
          h("rect", { x: -6, y: 15, width: 2.4, height: 42, rx: 1.2, fill: "rgba(255,255,255,0.45)" }),
        ]);
      s.append(b(30, 18, 0.9), b(62, 18, 0.9), b(46, 12, 1.02));
    }
    return s;
  }

  /* ------------------------------------------------------------------ APP (tema claro) */
  const T = (tag, cls, text) => h(tag, cls ? { class: cls, text } : { text });
  const wordmark = (cls = "") => h("span", { class: "app-wordmark " + cls, html: "SAIB <b>Direct</b>" });

  const app = {
    wordmark,
    // barra de status (hora de exemplo). dark=true → texto branco (telas escuras/splash)
    statusBar(time = "22:14", o = {}) {
      const bars = h("span", { style: { display: "flex", alignItems: "flex-end", gap: "3px", height: "18px" } },
        [7, 10, 13, 17].map((hh) => h("i", { style: { width: "5px", height: hh + "px", borderRadius: "1.5px", background: "currentColor" } })));
      return h("div", { class: "app-status", style: o.dark ? { color: "#fff" } : { color: "var(--ui-ink)" } }, [
        h("span", { text: time }),
        h("span", { class: "sb-icons" }, [bars, icon("wifi", { size: 26, stroke: 2.6 }), h("span", { class: "sb-batt" })]),
      ]);
    },
    // cabeçalho: linha com wordmark + avatar, título (40–48 px) e subtítulo
    header(title, subtitle, o = {}) {
      const { avatar = "MB", showWordmark = true } = o;
      const el = h("div", { class: "app-header" }, [
        h("div", { class: "hd-top" }, [showWordmark ? wordmark() : h("span"), avatar ? h("div", { class: "app-avatar", text: avatar }) : null]),
        title ? T("h1", "", title) : null,
        subtitle ? T("p", "", subtitle) : null,
      ]);
      return el;
    },
    searchBar(text = "Buscar produtos") {
      return h("div", { class: "app-search" }, [icon("search", { size: 30, stroke: 2.2, color: "#8e8aa3" }), h("span", { text })]);
    },
    chips(list, active = 0) {
      return h("div", { class: "app-chips" }, list.map((c, i) => h("div", { class: "app-chip" + (i === active ? " on" : ""), text: c })));
    },
    section(title, action) {
      return h("div", { class: "app-section" }, [h("b", { text: title, style: { fontWeight: 700 } }), action ? h("span", { text: action }) : null]);
    },
    thumb(art, iconName) {
      const tint = (ART[art] && ART[art].tint) || "#f1ecff";
      const t = h("div", { class: "app-thumb", style: { background: tint } });
      if (ART[art]) t.append(productArt(art, 92));
      else t.append(icon(iconName || "package", { size: 44, stroke: 1.8, color: "#7c3aed" }));
      return t;
    },
    /*
     * productRow({name, detail, price, oldPrice, qty, art, iconName, tag}) → el (el.refs = {thumb, add, stepper, qty, price})
     * qty > 0 mostra o seletor de quantidade; senão, o botão "+".
     */
    productRow(o) {
      const { name, detail, price, oldPrice, qty = 0, art, iconName, tag } = o;
      const add = h("div", { class: "app-add" }, [icon("plus", { size: 30, stroke: 2.6 })]);
      const qtyEl = h("b", { text: String(qty) });
      const stepper = h("div", { class: "app-stepper" }, [h("i", {}, [icon("minus", { size: 24, stroke: 2.8 })]), qtyEl, h("i", {}, [icon("plus", { size: 24, stroke: 2.8 })])]);
      const priceEl = h("span", { class: "rw-price" }, [document.createTextNode(price || "")]);
      if (oldPrice) priceEl.append(h("s", { text: oldPrice }));
      const right = h("div", { style: { position: "relative", height: "56px", minWidth: "56px" } }, [qty > 0 ? stepper : add]);
      const nameEl = h("div", { class: "rw-name" }, [document.createTextNode(name)]);
      if (tag) nameEl.append(h("span", { class: "app-badge tone-brand", text: tag, style: { height: "34px", fontSize: "20px", padding: "0 11px", marginLeft: "10px", verticalAlign: "3px" } }));
      const thumbEl = app.thumb(art, iconName);
      const el = h("div", { class: "app-row" }, [
        thumbEl,
        h("div", { class: "rw-main" }, [nameEl, detail ? h("div", { class: "rw-detail", text: detail }) : null, h("div", { class: "rw-foot" }, [priceEl, right])]),
      ]);
      el.refs = { thumb: thumbEl, add, stepper, qty: qtyEl, price: priceEl, right, name: nameEl };
      // troca "+" ↔ seletor (n = quantidade; 0 volta ao "+")
      el.setQty = (n) => {
        qtyEl.textContent = String(n);
        const want = n > 0 ? stepper : add;
        if (right.firstChild !== want) right.replaceChildren(want);
      };
      return el;
    },
    // botão: variant "primary" | "secondary" | "ghost"; icon (Lucide) à esquerda; iconRight à direita
    button(label, o = {}) {
      const { variant = "primary", icon: ic, iconRight, height } = o;
      const el = h("div", { class: "app-btn " + variant });
      if (height) el.style.height = height + "px";
      if (ic) el.append(icon(ic, { size: 34, stroke: 2.4 }));
      el.append(h("span", { text: label }));
      if (iconRight) el.append(icon(iconRight, { size: 30, stroke: 2.4 }));
      return el;
    },
    // barra do carrinho: {items, total, cta} → el (el.refs = {count, total, go})
    cartBar(o = {}) {
      const { items = 0, total = "R$ 0,00", cta = "Ver carrinho" } = o;
      const count = h("span", { class: "cb-count", text: String(items) });
      const totalEl = h("b", { text: total });
      const label = h("small", { text: items === 1 ? "1 item" : `${items} itens` });
      const go = h("div", { class: "cb-go" }, [h("span", { text: cta }), icon("chevron-right", { size: 28, stroke: 2.6 })]);
      const el = h("div", { class: "app-cartbar" }, [
        h("div", { class: "cb-icon" }, [icon("shopping-cart", { size: 34, stroke: 2.2 }), count]),
        h("div", { class: "cb-text" }, [label, totalEl]),
        go,
      ]);
      el.refs = { count, total: totalEl, label, go };
      el.set = (n, tot) => {
        count.textContent = String(n);
        label.textContent = n === 1 ? "1 item" : `${n} itens`;
        if (tot !== undefined) totalEl.textContent = tot;
      };
      return el;
    },
    // barra de abas: "inicio" | "pedidos" | "ofertas" | "conta"
    tabBar(active = "inicio") {
      const tabs = [
        ["inicio", "house", "Início"],
        ["pedidos", "clipboard-list", "Pedidos"],
        ["ofertas", "ticket-percent", "Ofertas"],
        ["conta", "user-round", "Conta"],
      ];
      return h("div", { class: "app-tabbar" }, tabs.map(([k, ic, lb]) =>
        h("div", { class: "tb" + (k === active ? " on" : "") }, [icon(ic, { size: 36, stroke: k === active ? 2.4 : 2 }), h("span", { text: lb })])));
    },
    // selo: tone "brand" | "ok" | "pending" | "info" | "neutral"
    badge(text, tone = "brand", ic) {
      const el = h("span", { class: "app-badge tone-" + tone });
      if (ic) el.append(icon(ic, { size: 24, stroke: 2.6 }));
      el.append(h("span", { text }));
      return el;
    },
    toast(text, ic = "circle-check") {
      return h("div", { class: "app-toast" }, [h("div", { class: "tt-ic" }, [icon(ic, { size: 32, stroke: 2.3 })]), h("span", { text })]);
    },
    // barra de navegação de tela interna (voltar + título)
    nav(title, o = {}) {
      return h("div", { class: "app-nav" }, [
        h("div", { class: "nv-back" }, [icon(o.close ? "x" : "chevron-left", { size: 32, stroke: 2.4 })]),
        h("div", { class: "nv-title", text: title }),
      ]);
    },
    card(children, style) {
      return h("div", { class: "app-card", style: style || {} }, children);
    },
  };

  /* ------------------------------------------------------------------ PORTAL (painel web claro) */
  const portal = {
    wordmark,
    /*
     * frame(active, o) → { el, content, side, top, nav }  barra lateral + barra superior.
     * active: "inicio" | "pedidos" | "ofertas" | "vendas" | "clientes". o.counts = {pedidos: 3}
     */
    frame(active = "inicio", o = {}) {
      const counts = o.counts || {};
      const items = [
        ["inicio", "layout-dashboard", "Início"],
        ["pedidos", "clipboard-list", "Pedidos"],
        ["ofertas", "ticket-percent", "Ofertas"],
        ["vendas", "chart-column", "Vendas"],
        ["clientes", "users", "Clientes"],
      ];
      const nav = {};
      const side = h("div", { class: "pt-side" }, [wordmark()]);
      for (const [k, ic, lb] of items) {
        const it = h("div", { class: "pt-nav" + (k === active ? " on" : "") }, [icon(ic, { size: 24, stroke: 2 }), h("span", { text: lb })]);
        if (counts[k] !== undefined) {
          const c = h("span", { class: "pn-count", text: String(counts[k]) });
          it.append(c);
          it.count = c;
        }
        nav[k] = it;
        side.append(it);
      }
      const top = h("div", { class: "pt-top" }, [
        h("span", { class: "tp-title", text: "Portal SAIB Direct" }),
        h("span", { class: "tp-org" }, [h("span", { text: "Distribuidora Exemplo" }), h("i", { text: "DE" })]),
      ]);
      const content = h("div", { class: "pt-content" });
      const el = h("div", { class: "pt" }, [side, h("div", { class: "pt-main" }, [top, content])]);
      return { el, content, side, top, nav };
    },
    // título da página (+ subtítulo) e, opcionalmente, um elemento à direita (botão)
    pageTitle(title, sub, right) {
      return h("div", { class: "pt-h1" }, [h("div", {}, [h("h2", { text: title }), sub ? h("p", { text: sub }) : null]), right || null]);
    },
    kpi(label, value) {
      const v = h("div", { class: "kp-value", text: value });
      const el = h("div", { class: "pt-kpi" }, [h("div", { class: "kp-label", text: label }), v]);
      el.value = v;
      return el;
    },
    kpis(list) {
      return h("div", { class: "pt-kpis" }, list.map(([l, v]) => portal.kpi(l, v)));
    },
    card(title, right, rows = []) {
      const el = h("div", { class: "pt-card" }, [h("div", { class: "pt-card-h" }, [h("span", { text: title }), right || null]), ...rows]);
      return el;
    },
    /*
     * tableRow(cols, {big, hl}) → el (el.cells = [...])
     * cols: string | Node | {text|node, w (px), grow, cls, align}
     */
    tableRow(cols, o = {}) {
      const el = h("div", { class: "pt-row" + (o.big ? " big" : "") + (o.hl ? " hl" : "") });
      el.cells = cols.map((c) => {
        const spec = typeof c === "string" || c instanceof Node ? { [typeof c === "string" ? "text" : "node"]: c } : c;
        const cell = h("span", { class: (spec.grow ? "grow " : "") + (spec.cls || "") });
        if (spec.w) cell.style.width = spec.w + "px";
        if (spec.align) cell.style.textAlign = spec.align;
        if (spec.node) cell.append(spec.node);
        else cell.textContent = spec.text ?? "";
        el.append(cell);
        return cell;
      });
      return el;
    },
    // selo: "pending" (Aguardando) | "ok" (Aprovado/Publicada) | "info" | "neutral" | "brand"
    badge(text, tone = "info") {
      return h("span", { class: "pt-badge tone-" + tone, text });
    },
    button(label, variant = "primary", o = {}) {
      const el = h("div", { class: "pt-btn " + variant + (o.big ? " big" : "") });
      if (o.icon) el.append(icon(o.icon, { size: o.big ? 26 : 22, stroke: 2.4 }));
      el.append(h("span", { text: label }));
      return el;
    },
    input(label, value, o = {}) {
      const box = h("div", { class: "ip-box" });
      if (o.icon) box.append(icon(o.icon, { size: 24, stroke: 2, color: "#77738c" }));
      const val = h("span", { text: value });
      box.append(val);
      const el = h("div", { class: "pt-input" + (o.focus ? " focus" : "") }, [h("label", { text: label }), box]);
      el.value = val;
      el.box = box;
      return el;
    },
    avatar(initials, size = 44) {
      return h("span", {
        text: initials,
        style: {
          display: "inline-grid", placeItems: "center", width: size + "px", height: size + "px", borderRadius: "50%",
          fontSize: Math.round(size * 0.38) + "px", fontWeight: 720, color: "#5b21b6", background: "linear-gradient(140deg, #efe8ff, #e0d5ff)",
        },
      });
    },
  };

  SAIB.ui = {
    icon, stage3d, pose, lerpPose, addPose, drift, POSES, LID,
    rectOf, offsetIn, phone, laptop, mount, toWorld, toFrame,
    curve, holoPath, SPLIT_LINE, connectSplit, tapRing, tap, press, cursor, chromatic, glassCard,
    productArt, app, portal,
  };
})();
