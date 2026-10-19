/*
 * SAIB.fx — utilitários de animação. TUDO aqui é função pura do tempo:
 * nada de CSS transitions/animations, requestAnimationFrame, Date ou Math.random.
 * O renderizador chama SAIB.seek(T) para cada quadro, em qualquer ordem.
 */
(function () {
  const SAIB = (window.SAIB = window.SAIB || {});

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const invlerp = (a, b, v) => (b === a ? (v >= b ? 1 : 0) : (v - a) / (b - a));
  // progresso 0..1 de t entre a e b (com clamp)
  const prog = (t, a, b) => clamp(invlerp(a, b, t));
  const remap = (v, a, b, c, d) => lerp(c, d, prog(v, a, b));

  const ease = {
    linear: (p) => p,
    inQuad: (p) => p * p,
    outQuad: (p) => 1 - (1 - p) * (1 - p),
    inOutQuad: (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
    inCubic: (p) => p * p * p,
    outCubic: (p) => 1 - Math.pow(1 - p, 3),
    inOutCubic: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    outQuart: (p) => 1 - Math.pow(1 - p, 4),
    inOutQuart: (p) => (p < 0.5 ? 8 * p ** 4 : 1 - Math.pow(-2 * p + 2, 4) / 2),
    outQuint: (p) => 1 - Math.pow(1 - p, 5),
    inOutQuint: (p) => (p < 0.5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2),
    inExpo: (p) => (p === 0 ? 0 : Math.pow(2, 10 * p - 10)),
    outExpo: (p) => (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)),
    inOutExpo: (p) =>
      p === 0 ? 0 : p === 1 ? 1 : p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2,
    outCirc: (p) => Math.sqrt(1 - Math.pow(p - 1, 2)),
    inOutCirc: (p) =>
      p < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * p, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * p + 2, 2)) + 1) / 2,
    outBack: (p, s = 1.70158) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2),
    inBack: (p, s = 1.70158) => (s + 1) * p * p * p - s * p * p,
    outElastic: (p) =>
      p === 0 ? 0 : p === 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
    // "expo suave" — curva de assinatura do vídeo (entradas)
    signature: (p) => 1 - Math.pow(1 - p, 4.2),
    inOutSine: (p) => -(Math.cos(Math.PI * p) - 1) / 2,
  };

  // Mola analítica (sub-amortecida). t em segundos desde o disparo; retorna ~0 -> 1 com overshoot.
  function spring(t, { freq = 2.2, damping = 0.55 } = {}) {
    if (t <= 0) return 0;
    const w = 2 * Math.PI * freq;
    const z = clamp(damping, 0.01, 0.999);
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  }

  // tween: valor eased entre `at` e `at+dur`
  const tw = (t, at, dur, e = ease.signature) => e(prog(t, at, at + dur));

  // RNG determinístico (mulberry32)
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hash = (n) => rng(n * 9301 + 49297)();
  // ruído 1D suave (value noise) — para derivas orgânicas
  function noise(x, seed = 0) {
    const i = Math.floor(x), f = x - i;
    const a = hash(i + seed * 1013), b = hash(i + 1 + seed * 1013);
    const u = f * f * (3 - 2 * f);
    return lerp(a, b, u) * 2 - 1;
  }

  /*
   * set(el, props) — aplica estado visual de uma vez.
   * props: x, y (px), z, scale, sx, sy, rot (graus), rotX, rotY, skewX, opacity,
   *        blur (px), brightness, origin, clip (string clip-path), display, color, bg, width, height
   */
  function set(el, p) {
    if (!el) return;
    const s = el.style;
    const tr = [];
    if (p.x !== undefined || p.y !== undefined || p.z !== undefined)
      tr.push(`translate3d(${(p.x || 0).toFixed(2)}px, ${(p.y || 0).toFixed(2)}px, ${(p.z || 0).toFixed(2)}px)`);
    if (p.rotX !== undefined) tr.push(`rotateX(${p.rotX}deg)`);
    if (p.rotY !== undefined) tr.push(`rotateY(${p.rotY}deg)`);
    if (p.rot !== undefined) tr.push(`rotate(${p.rot}deg)`);
    if (p.skewX !== undefined) tr.push(`skewX(${p.skewX}deg)`);
    if (p.scale !== undefined) tr.push(`scale(${p.scale})`);
    if (p.sx !== undefined || p.sy !== undefined) tr.push(`scale(${p.sx ?? 1}, ${p.sy ?? 1})`);
    if (tr.length) s.transform = tr.join(" ");
    if (p.origin !== undefined) s.transformOrigin = p.origin;
    if (p.opacity !== undefined) s.opacity = clamp(p.opacity).toFixed(4);
    const f = [];
    if (p.blur !== undefined && p.blur > 0.05) f.push(`blur(${p.blur.toFixed(2)}px)`);
    if (p.brightness !== undefined && p.brightness !== 1) f.push(`brightness(${p.brightness})`);
    if (p.blur !== undefined || p.brightness !== undefined) s.filter = f.length ? f.join(" ") : "none";
    if (p.clip !== undefined) s.clipPath = p.clip;
    if (p.display !== undefined) s.display = p.display;
    if (p.color !== undefined) s.color = p.color;
    if (p.bg !== undefined) s.background = p.bg;
    if (p.width !== undefined) s.width = typeof p.width === "number" ? p.width + "px" : p.width;
    if (p.height !== undefined) s.height = typeof p.height === "number" ? p.height + "px" : p.height;
  }

  /*
   * Linguagem de movimento padrão do vídeo (use para manter coerência entre atos):
   *  - ENTRADA: sobe de +y com blur -> 0, opacidade 0 -> 1, curva `signature`, ~0.7s
   *  - SAÍDA:   sobe -y*0.6 com blur, opacidade -> 0, curva inCubic, ~0.45s
   * enter() / exit() / inOut() retornam {x,y,opacity,blur,scale} e aplicam se `el` for passado.
   */
  function enterState(t, at, o = {}) {
    const { dur = 0.75, y = 70, x = 0, blur = 14, scale = 1, e = ease.signature } = o;
    const p = tw(t, at, dur, e);
    return {
      x: lerp(x, 0, p),
      y: lerp(y, 0, p),
      opacity: clamp(prog(t, at, at + dur * 0.55)),
      blur: lerp(blur, 0, p),
      scale: lerp(scale, 1, p),
    };
  }
  function exitState(t, at, o = {}) {
    const { dur = 0.45, y = -42, x = 0, blur = 12, scale = 1, e = ease.inCubic } = o;
    const p = tw(t, at, dur, e);
    return { x: lerp(0, x, p), y: lerp(0, y, p), opacity: 1 - p, blur: lerp(0, blur, p), scale: lerp(1, scale, p) };
  }
  function inOut(el, t, inAt, outAt, o = {}) {
    const a = enterState(t, inAt, o.in || o);
    let st = a;
    if (outAt !== undefined && outAt !== null && t >= outAt) {
      const b = exitState(t, outAt, o.out || {});
      st = { x: a.x + b.x, y: a.y + b.y, opacity: a.opacity * b.opacity, blur: a.blur + b.blur, scale: a.scale * b.scale };
    }
    if (el) set(el, st);
    return st;
  }
  const enter = (el, t, at, o) => inOut(el, t, at, null, { in: o });
  const exit = (el, t, at, o) => {
    const st = exitState(t, at, o);
    if (el) set(el, st);
    return st;
  };

  // atraso escalonado
  const stagger = (i, each = 0.06, from = 0) => from + i * each;

  // DOM
  function h(tag, attrs = {}, children = []) {
    const svgTags = /^(svg|g|path|circle|rect|line|polyline|polygon|ellipse|defs|linearGradient|radialGradient|stop|filter|fe[A-Z]\w*|mask|clipPath|text|tspan|use|pattern|symbol)$/;
    const el = svgTags.test(tag)
      ? document.createElementNS("http://www.w3.org/2000/svg", tag)
      : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") el.setAttribute("class", v);
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k === "html") el.innerHTML = v;
      else if (k === "text") el.textContent = v;
      else el.setAttribute(k, v);
    }
    for (const c of [].concat(children)) if (c != null) el.append(c);
    return el;
  }

  // Divide texto em palavras e letras (spans). Retorna {words:[], chars:[]}.
  // Mantém espaços normais; cada palavra é inline-block (não quebra no meio).
  function split(el) {
    const text = el.textContent;
    el.textContent = "";
    const words = [], chars = [];
    text.split(/(\s+)/).forEach((tok) => {
      if (/^\s+$/.test(tok)) {
        el.append(document.createTextNode(" "));
        return;
      }
      if (!tok) return;
      const w = h("span", { class: "fx-word", style: { display: "inline-block", whiteSpace: "nowrap" } });
      for (const ch of tok) {
        const c = h("span", { class: "fx-char", style: { display: "inline-block" } });
        c.textContent = ch;
        w.append(c);
        chars.push(c);
      }
      el.append(w);
      words.push(w);
    });
    return { words, chars };
  }

  // número no formato pt-BR
  const fmt = (n, dec = 0) =>
    n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });

  // SVG draw-on: prepara um path e retorna função (p 0..1) que desenha
  function drawable(path) {
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len} ${len}`;
    return (p) => (path.style.strokeDashoffset = ((1 - clamp(p)) * len).toFixed(2));
  }

  SAIB.fx = { clamp, lerp, invlerp, prog, remap, ease, spring, tw, rng, hash, noise, set, enterState, exitState, enter, exit, inOut, stagger, h, split, fmt, drawable };
})();
