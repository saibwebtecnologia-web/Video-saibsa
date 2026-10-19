/*
 * Fundo global contínuo (atrás de todos os atos): roxo profundo porém LUMINOSO (centro #7c3aed/#5b21b6,
 * bordas ~#1f0b5c, nunca quase preto), orbes de luz que derivam devagar, uma grade de piso ISOMÉTRICA
 * bem sutil (mesma projeção das poses "split") e partículas de luz discretas.
 *
 * Desempenho: orbes num canvas de 1/4 de resolução ampliado (é tudo desfoque); grade + partículas
 * num canvas de 1/2 resolução (linhas finas ficam suaves, como devem ser).
 *
 * SAIB.bg.warm   0..1  clima "de manhã" (S5): luz mais rosada/lilás e um pouco mais clara (dentro da paleta)
 * SAIB.bg.energy 0..2  intensidade dos orbes (padrão 1)
 * SAIB.bg.grid   0..1  opacidade da grade (padrão 1)
 *
 * IMPORTANTE: o motor atualiza as camadas globais ANTES dos atos. Para controlar o fundo de forma
 * determinística, registre no build() do ato uma função pura do tempo GLOBAL:
 *   SAIB.bg.drive((T) => (T >= 19.0 && T <= 25.6 ? { warm: ... } : null));
 * Cada condutor devolve {warm?, energy?, grid?} ou null; os valores devolvidos substituem os padrões
 * (o último condutor registrado vence). Atribuir SAIB.bg.warm direto no update() chegaria um quadro atrasado.
 */
(function () {
  const { h, noise, lerp, clamp, hash, rng } = SAIB.fx;
  const els = {};
  const drivers = [];
  SAIB.bg = { warm: 0, energy: 1, grid: 1, drive: (fn) => drivers.push(fn) };
  const DEF = { warm: 0, energy: 1, grid: 1 };
  function params(T) {
    const o = { warm: SAIB.bg.warm ?? DEF.warm, energy: SAIB.bg.energy ?? DEF.energy, grid: SAIB.bg.grid ?? DEF.grid };
    for (const fn of drivers) {
      const r = fn(T);
      if (r) for (const k of ["warm", "energy", "grid"]) if (r[k] !== undefined) o[k] = r[k];
    }
    return o;
  }
  const CW = 270, CH = 480, K = 1080 / CW; // orbes
  const GW = 540, GH = 960, G = 1080 / GW; // grade + partículas

  // projeção do piso (igual ao CSS: perspective 2400, origem 540/960, rotateX → rotateZ)
  const FLOOR = { cx: 540, cy: 1230, rx: 60, rz: 36, d: 3600, cell: 132, ext: 14 };
  function proj(u, v) {
    const a = (FLOOR.rz * Math.PI) / 180, b = (FLOOR.rx * Math.PI) / 180;
    const x = u * Math.cos(a) - v * Math.sin(a);
    const y0 = u * Math.sin(a) + v * Math.cos(a);
    const y = y0 * Math.cos(b), z = y0 * Math.sin(b);
    const X = FLOOR.cx + x, Y = FLOOR.cy + y;
    const k = FLOOR.d / (FLOOR.d - z);
    return [540 + (X - 540) * k, 960 + (Y - 960) * k];
  }

  // partículas determinísticas
  const PARTS = [];
  {
    const r = rng(20261019);
    for (let i = 0; i < 54; i++) {
      PARTS.push({
        x: r() * 1080, y: r() * 1920, vy: -(6 + r() * 16), vx: (r() - 0.5) * 6,
        size: 2 + Math.pow(r(), 2.2) * 7, a: 0.25 + r() * 0.55, tw: 0.3 + r() * 0.8, ph: r() * 10, col: Math.floor(r() * 3),
      });
    }
  }
  function sprite(rgb) {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, `rgba(255,255,255,1)`);
    g.addColorStop(0.18, `rgba(${rgb},0.9)`);
    g.addColorStop(0.5, `rgba(${rgb},0.25)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g;
    x.fillRect(0, 0, 32, 32);
    return c;
  }

  SAIB.layer({
    build(stage) {
      const root = h("div", { class: "layer", id: "bg", style: { zIndex: 0 } });
      els.canvas = h("canvas", { width: CW, height: CH, style: { position: "absolute", left: 0, top: 0, width: "1080px", height: "1920px" } });
      els.ctx = els.canvas.getContext("2d");
      els.grid = h("canvas", { width: GW, height: GH, style: { position: "absolute", left: 0, top: 0, width: "1080px", height: "1920px" } });
      els.gctx = els.grid.getContext("2d");
      els.sprites = [sprite("255,255,255"), sprite("201,182,255"), sprite("94,231,255")];
      root.append(els.canvas, els.grid);
      stage.append(root);
    },
    update(T) {
      const prm = params(T);
      const e = clamp(prm.energy, 0, 2);
      const w = clamp(prm.warm);
      const c = els.ctx;

      // --- base: brilho central violeta → bordas p900
      c.globalCompositeOperation = "source-over";
      const g0 = c.createRadialGradient(CW * 0.5, CH * 0.42, 0, CW * 0.5, CH * 0.45, CH * 0.78);
      g0.addColorStop(0, w ? mix("#6d28d9", "#9346e0", w) : "#6d28d9");
      g0.addColorStop(0.42, w ? mix("#4c1d95", "#6a2aa8", w) : "#4c1d95");
      g0.addColorStop(0.78, w ? mix("#2e1080", "#43158a", w) : "#2e1080");
      g0.addColorStop(1, w ? mix("#1f0b5c", "#2e0f68", w) : "#1f0b5c");
      c.fillStyle = g0;
      c.fillRect(0, 0, CW, CH);

      // --- orbes (screen)
      const orbs = [
        // cx, cy, ampX, ampY, freq, raio, [r,g,b,a]
        [540, 760, 260, 220, 0.05, 880, [124, 58, 237, 0.62]],
        [230, 1380, 300, 260, 0.04, 720, [168, 85, 247, 0.34]],
        [880, 460, 220, 260, 0.06, 560, [255, 122, 217, 0.16 + 0.2 * w]],
        [170, 380, 200, 220, 0.045, 480, [94, 231, 255, 0.1]],
        [720, 1640, 360, 200, 0.035, 820, [79, 70, 229, 0.34]],
        [600, 160, 300, 120, 0.03, 980, [255, 160, 220, 0.3 * w]],
        [300, 520, 200, 160, 0.04, 620, [255, 190, 175, 0.1 * w]],
      ];
      c.globalCompositeOperation = "screen";
      orbs.forEach(([cx, cy, ax, ay, f, r, col], i) => {
        if (col[3] <= 0.001) return;
        const x = (cx + noise(T * f * 6 + i * 3.1, i) * ax) / K;
        const y = (cy + noise(T * f * 6 + 17 + i * 1.7, i + 9) * ay) / K;
        const rr = (r * (1 + 0.1 * noise(T * 0.3 + i, 40 + i))) / K;
        const a = col[3] * lerp(0.8, 1, (noise(T * 0.4 + i * 5, 77) + 1) / 2) * (0.6 + 0.4 * e);
        const g = c.createRadialGradient(x, y, 0, x, y, rr);
        const rgb = `${col[0]},${col[1]},${col[2]}`;
        g.addColorStop(0, `rgba(${rgb},${a})`);
        g.addColorStop(0.35, `rgba(${rgb},${a * 0.55})`);
        g.addColorStop(0.68, `rgba(${rgb},${a * 0.13})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        c.fillStyle = g;
        c.fillRect(0, 0, CW, CH);
      });
      c.globalCompositeOperation = "source-over";

      // --- grade isométrica do piso (deriva lenta) + partículas
      const gc = els.gctx;
      gc.setTransform(1, 0, 0, 1, 0, 0);
      gc.clearRect(0, 0, GW, GH);
      const ga = clamp(prm.grid);
      if (ga > 0.001) {
        gc.setTransform(1 / G, 0, 0, 1 / G, 0, 0); // desenha em px do quadro
        const cell = FLOOR.cell, ext = FLOOR.ext;
        const du = (T * 7) % cell, dv = (T * 11) % cell;
        gc.lineWidth = 2.2;
        gc.strokeStyle = `rgba(214,198,255,${(0.16 * ga).toFixed(3)})`;
        gc.beginPath();
        for (let i = -ext; i <= ext; i++) {
          const u = i * cell + du;
          for (let j = -ext; j < ext; j += 2) {
            const [x1, y1] = proj(u, j * cell), [x2, y2] = proj(u, (j + 2) * cell);
            gc.moveTo(x1, y1);
            gc.lineTo(x2, y2);
          }
          const v = i * cell + dv;
          for (let j = -ext; j < ext; j += 2) {
            const [x1, y1] = proj(j * cell, v), [x2, y2] = proj((j + 2) * cell, v);
            gc.moveTo(x1, y1);
            gc.lineTo(x2, y2);
          }
        }
        gc.stroke();
        // esmaece longe do centro do piso (máscara radial)
        gc.globalCompositeOperation = "destination-in";
        const fm = gc.createRadialGradient(540, 1240, 0, 540, 1240, 1000);
        fm.addColorStop(0, "rgba(0,0,0,1)");
        fm.addColorStop(0.45, "rgba(0,0,0,0.75)");
        fm.addColorStop(1, "rgba(0,0,0,0)");
        gc.fillStyle = fm;
        gc.fillRect(0, 0, 1080, 1920);
        gc.globalCompositeOperation = "source-over";
      }
      // partículas (por cima da grade)
      gc.setTransform(1 / G, 0, 0, 1 / G, 0, 0);
      for (let i = 0; i < PARTS.length; i++) {
        const p = PARTS[i];
        const y = (((p.y + p.vy * T) % 2020) + 2020) % 2020 - 50;
        const x = p.x + p.vx * T + 18 * noise(T * 0.15 + p.ph, i);
        const tw = 0.55 + 0.45 * Math.sin(T * p.tw * 2 + p.ph * 6.28);
        gc.globalAlpha = clamp(p.a * tw * (0.85 + 0.15 * e));
        const s = p.size * 3.2;
        gc.drawImage(els.sprites[p.col], x - s / 2, y - s / 2, s, s);
      }
      gc.globalAlpha = 1;
    },
  });

  // mistura hexadecimal simples (#rrggbb)
  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (s) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, t));
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }
})();
