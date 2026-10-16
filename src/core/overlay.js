/*
 * Camada de "cromo" sobre os atos: selo da série no topo, progresso por ato,
 * mini logo, e o feixe de scan (raio-X) que faz a transição entre atos.
 */
(function () {
  const { h, set, prog, ease, lerp, clamp, tw } = SAIB.fx;
  const els = {};

  SAIB.layer({
    build(stage) {
      const m = SAIB.manifest;
      const root = h("div", { class: "layer", id: "overlay", style: { zIndex: 40, pointerEvents: "none" } });

      // ---- topo: série + progresso
      els.top = h("div", {
        style: { position: "absolute", left: "80px", top: "236px", display: "flex", flexDirection: "column", gap: "14px" },
      });
      els.pill = h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "12px 22px 12px 18px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.14)",
            fontFamily: "var(--font-mono)",
            fontSize: "21px",
            letterSpacing: "0.2em",
            color: "var(--silver-1)",
            fontWeight: 600,
          },
        },
        [
          (els.dot = h("span", {
            style: {
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "var(--neon)",
              boxShadow: "0 0 14px 3px rgba(180,108,255,0.85)",
            },
          })),
          h("span", { text: "RAIO-X DO DISTRIBUIDOR" }),
          h("span", { text: "#1", style: { color: "var(--neon)" } }),
        ]
      );
      els.segs = [];
      const bar = h("div", { style: { display: "flex", gap: "8px", paddingLeft: "6px" } });
      m.acts.forEach(() => {
        const s = h("div", {
          style: { width: "64px", height: "4px", borderRadius: "4px", background: "rgba(255,255,255,0.14)", overflow: "hidden" },
        });
        const fill = h("div", {
          style: {
            width: "100%",
            height: "100%",
            background: "linear-gradient(90deg, #8b2bd9, #dcc2ff)",
            transformOrigin: "0 50%",
            boxShadow: "0 0 10px rgba(180,108,255,0.9)",
          },
        });
        s.append(fill);
        bar.append(s);
        els.segs.push(fill);
      });
      els.top.append(els.pill, bar);
      root.append(els.top);

      // ---- mini logo (canto superior direito)
      els.logo = h("img", {
        src: "../assets/brand/logo-saib-white.png",
        style: { position: "absolute", right: "80px", top: "240px", height: "50px", opacity: 0.92 },
      });
      root.append(els.logo);

      // ---- feixe de scan
      els.scan = h("div", { style: { position: "absolute", left: 0, top: 0, width: "1080px", height: "0px" } });
      els.trail = h("div", {
        style: {
          position: "absolute",
          left: 0,
          width: "1080px",
          height: "340px",
          top: "-340px",
          background:
            "linear-gradient(180deg, rgba(180,108,255,0) 0%, rgba(180,108,255,0.10) 60%, rgba(220,194,255,0.35) 100%)",
          mixBlendMode: "screen",
        },
      });
      els.xray = h("div", {
        style: {
          position: "absolute",
          left: 0,
          width: "1080px",
          height: "120px",
          top: "-120px",
          backdropFilter: "brightness(1.5) saturate(1.5) hue-rotate(-12deg)",
          WebkitBackdropFilter: "brightness(1.5) saturate(1.5) hue-rotate(-12deg)",
          maskImage: "linear-gradient(180deg, transparent, black)",
          WebkitMaskImage: "linear-gradient(180deg, transparent, black)",
        },
      });
      els.core = h("div", {
        style: {
          position: "absolute",
          left: 0,
          width: "1080px",
          height: "3px",
          top: "-1.5px",
          background: "linear-gradient(90deg, rgba(220,194,255,0) 0%, #fff 30%, #fff 70%, rgba(220,194,255,0) 100%)",
          boxShadow: "0 0 18px 4px rgba(180,108,255,0.95), 0 0 70px 16px rgba(139,43,217,0.6)",
        },
      });
      els.flare = h("div", {
        style: {
          position: "absolute",
          width: "520px",
          height: "40px",
          top: "-20px",
          left: "0px",
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(180,108,255,0.35) 55%, transparent)",
          mixBlendMode: "screen",
        },
      });
      els.readout = h("div", {
        style: {
          position: "absolute",
          right: "80px",
          top: "-46px",
          fontFamily: "var(--font-mono)",
          fontSize: "20px",
          letterSpacing: "0.24em",
          color: "var(--lilac)",
          textShadow: "0 0 10px rgba(180,108,255,0.9)",
        },
      });
      els.scan.append(els.trail, els.xray, els.core, els.flare, els.readout);
      root.append(els.scan);
      stage.append(root);
    },
    update(T) {
      const m = SAIB.manifest;
      const last = m.acts[m.acts.length - 1];
      // cromo do topo: entra em ~1s, sai antes do ato final
      const vin = tw(T, 1.0, 0.8);
      const vout = 1 - tw(T, last.start - 0.35, 0.5, ease.inCubic);
      set(els.top, { opacity: vin * vout, y: lerp(-18, 0, vin), blur: (1 - vin) * 8 });
      set(els.logo, { opacity: 0.92 * vin * vout, y: lerp(-18, 0, vin) });
      const pulse = 0.55 + 0.45 * Math.pow(Math.sin(T * Math.PI * 1.6) * 0.5 + 0.5, 2);
      els.dot.style.opacity = pulse.toFixed(3);
      m.acts.forEach((a, i) => {
        set(els.segs[i], { sx: clamp(prog(T, a.start, a.end)), sy: 1 });
      });

      // scan nas fronteiras
      let y = null, idx = 0;
      for (let i = 1; i < m.acts.length; i++) {
        const v = SAIB.scanY(T, m.acts[i].start);
        if (v !== null) {
          y = v;
          idx = i;
        }
      }
      if (y === null) {
        els.scan.style.display = "none";
      } else {
        els.scan.style.display = "block";
        set(els.scan, { y });
        const b = m.acts[idx].start;
        const p = prog(T, b - m.transition, b + m.transition);
        const fade = Math.sin(Math.PI * p);
        els.scan.style.opacity = clamp(fade * 1.6).toFixed(3);
        set(els.flare, { x: lerp(-120, 680, ease.inOutQuad(p)) });
        els.readout.textContent = `SCAN ${String(idx + 1).padStart(2, "0")}/${String(m.acts.length).padStart(2, "0")}`;
      }
    },
  });
})();
