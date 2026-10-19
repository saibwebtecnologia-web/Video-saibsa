/*
 * Fundo global contínuo (atrás de todos os atos): gradiente profundo, orbes de luz
 * que derivam devagar, grade de pontos "de dados" e vinheta.
 * Os orbes são desenhados num canvas de baixa resolução (1/4) ampliado — idêntico
 * visualmente (é tudo desfoque) e muito mais barato de rasterizar a cada quadro.
 * (A granulação de filme é aplicada no ffmpeg, no render final.)
 *
 * Atos podem ajustar o clima com SAIB.bg.energy (0..2, padrão 1) — opcional.
 */
(function () {
  const { h, set, noise, lerp, clamp } = SAIB.fx;
  const els = {};
  SAIB.bg = { energy: 1 };
  const CW = 270, CH = 480, K = 1080 / CW;

  SAIB.layer({
    build(stage) {
      const root = h("div", { class: "layer", id: "bg", style: { zIndex: 0 } });
      els.canvas = h("canvas", {
        width: CW,
        height: CH,
        style: { position: "absolute", left: 0, top: 0, width: "1080px", height: "1920px" },
      });
      els.ctx = els.canvas.getContext("2d");
      root.append(els.canvas);

      // grade de pontos: elemento maior que a tela, deslocado via transform (composto, sem re-raster)
      const gridMask = h("div", {
        class: "layer",
        style: {
          maskImage: "radial-gradient(75% 60% at 50% 45%, black 0%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(75% 60% at 50% 45%, black 0%, transparent 100%)",
          opacity: 0.55,
        },
      });
      els.grid = h("div", {
        style: {
          position: "absolute",
          left: "-108px",
          top: "-108px",
          width: "1296px",
          height: "2136px",
          backgroundImage: "radial-gradient(circle, rgba(230,210,255,0.2) 1.4px, transparent 2px)",
          backgroundSize: "54px 54px",
          willChange: "transform",
        },
      });
      gridMask.append(els.grid);
      root.append(gridMask);
      root.append(
        h("div", {
          class: "layer",
          style: { background: "radial-gradient(90% 70% at 50% 48%, transparent 45%, rgba(8,0,20,0.38) 100%)" },
        })
      );
      stage.append(root);
    },
    update(T) {
      const e = clamp(SAIB.bg.energy ?? 1, 0, 2);
      const c = els.ctx;
      const g0 = c.createRadialGradient(CW / 2, 0, 0, CW / 2, 0, CH * 1.05);
      g0.addColorStop(0, "#4a1784");
      g0.addColorStop(0.45, "#2c0c55");
      g0.addColorStop(1, "#160530");
      c.globalCompositeOperation = "source-over";
      c.fillStyle = g0;
      c.fillRect(0, 0, CW, CH);
      const orbs = [
        // cx, cy, ampX, ampY, freq, raio, cor
        [540, 520, 380, 260, 0.05, 780, [150, 60, 230, 0.62]],
        [300, 1350, 340, 300, 0.04, 880, [120, 24, 170, 0.75]],
        [820, 1000, 300, 380, 0.06, 600, [190, 125, 255, 0.34]],
        [560, 1700, 420, 200, 0.035, 740, [80, 36, 190, 0.45]],
      ];
      c.globalCompositeOperation = "screen";
      orbs.forEach(([cx, cy, ax, ay, f, r, col], i) => {
        const x = (cx + noise(T * f * 6 + i * 3.1, i) * ax) / K;
        const y = (cy + noise(T * f * 6 + 17 + i * 1.7, i + 9) * ay) / K;
        const rr = (r * (1 + 0.12 * noise(T * 0.3 + i, 40 + i))) / K;
        const a = col[3] * lerp(0.75, 1, (noise(T * 0.4 + i * 5, 77) + 1) / 2) * (0.7 + 0.3 * e);
        const g = c.createRadialGradient(x, y, 0, x, y, rr);
        const rgb = `${col[0]},${col[1]},${col[2]}`;
        g.addColorStop(0, `rgba(${rgb},${a})`);
        g.addColorStop(0.35, `rgba(${rgb},${a * 0.55})`);
        g.addColorStop(0.68, `rgba(${rgb},${a * 0.12})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        c.fillStyle = g;
        c.fillRect(0, 0, CW, CH);
      });
      c.globalCompositeOperation = "source-over";
      set(els.grid, { x: (T * 3) % 54, y: -((T * 9) % 54) });
    },
  });
})();
