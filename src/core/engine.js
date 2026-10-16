/*
 * Motor de linha do tempo. Cada ato registra build/update; o motor decide
 * visibilidade, aplica a transição de scan entre atos e chama update(t local).
 *
 * URL params úteis:
 *   ?only=A     carrega/mostra só o ato A (os outros nem são construídos)
 *   ?safe=1     mostra guias da área segura do Reels
 *   ?t=3.2      já abre no tempo 3.2 (para inspecionar no navegador)
 */
(function () {
  const SAIB = (window.SAIB = window.SAIB || {});
  const { prog, ease } = SAIB.fx;
  const params = new URLSearchParams(location.search);
  const ONLY = params.get("only");
  const registry = {};
  const layers = []; // camadas globais {z, update(T)}
  SAIB.errors = [];

  SAIB.act = (id, def) => (registry[id] = def);
  SAIB.layer = (def) => layers.push(def);

  let acts = [];
  let stage;

  function report(where, e) {
    const msg = `${where}: ${e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e}`;
    if (!SAIB.errors.includes(msg)) SAIB.errors.push(msg);
    console.error(msg);
  }

  SAIB.boot = async function () {
    const m = SAIB.manifest;
    stage = document.getElementById("stage");
    SAIB.stage = stage;
    for (const L of layers) {
      if (L.build) {
        try {
          L.build(stage);
        } catch (e) {
          report("layer build", e);
        }
      }
    }
    const actHost = document.getElementById("acts");
    acts = m.acts.map((a, i) => {
      const root = document.createElement("div");
      root.className = "act";
      root.dataset.act = a.id;
      actHost.append(root);
      const def = registry[a.id];
      const ctx = { id: a.id, start: a.start, end: a.end, dur: a.end - a.start, root, index: i, state: {} };
      const skip = ONLY && ONLY !== a.id;
      if (def && !skip) {
        try {
          if (def.css) {
            const st = document.createElement("style");
            st.textContent = def.css;
            document.head.append(st);
          }
          def.build && def.build(root, ctx);
        } catch (e) {
          report(`act ${a.id} build`, e);
        }
      }
      return { ...a, def: skip ? null : def, ctx, root };
    });
    if (params.get("safe")) document.body.classList.add("show-safe");
    // carrega todas as faces de fonte antes do primeiro quadro (evita fallback no início)
    await Promise.all([...document.fonts].map((f) => f.load().catch(() => {})));
    await document.fonts.ready;
    // garante que todas as imagens decodificaram
    await Promise.all(
      [...document.images].map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()))
    );
    SAIB.ready = true;
    SAIB.seek(parseFloat(params.get("t") || "0"));
  };

  // Posição do scan (px, de cima) na fronteira b no tempo T, ou null fora da janela.
  SAIB.scanY = function (T, b) {
    const m = SAIB.manifest;
    const tw = m.transition;
    if (T < b - tw || T > b + tw) return null;
    const p = ease.inOutCubic(prog(T, b - tw, b + tw));
    return -60 + p * (m.height + 120);
  };

  SAIB.seek = function (T) {
    const m = SAIB.manifest;
    const tw = m.transition;
    SAIB.T = T;
    for (const L of layers) {
      try {
        L.update && L.update(T);
      } catch (e) {
        report("layer update", e);
      }
    }
    acts.forEach((a, i) => {
      const first = i === 0, last = i === acts.length - 1;
      const from = first ? -Infinity : a.start - tw;
      const to = last ? Infinity : a.end + tw;
      const visible = T >= from && T <= to;
      a.root.style.display = visible ? "block" : "none";
      if (!visible) return;
      // recorte do scan: ato que sai mostra só abaixo da linha; ato que entra, só acima
      let clip = "none";
      const yIn = first ? null : SAIB.scanY(T, a.start);
      const yOut = last ? null : SAIB.scanY(T, a.end);
      if (yIn !== null) clip = `inset(0 0 ${Math.max(0, m.height - yIn).toFixed(1)}px 0)`;
      else if (yOut !== null) clip = `inset(${Math.max(0, yOut).toFixed(1)}px 0 0 0)`;
      a.root.style.clipPath = clip;
      if (a.def && a.def.update) {
        try {
          a.def.update(T - a.start, a.ctx);
        } catch (e) {
          report(`act ${a.id} update@${T.toFixed(2)}`, e);
        }
      }
    });
    return true;
  };
})();
