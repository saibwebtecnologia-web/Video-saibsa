/*
 * S3 · O cliente pede (7,4–15,0). A câmera mergulha no celular (split → POSES.phoneHero). O cliente põe um item
 * no carrinho, às 22:14 ("a qualquer hora"), toca em "Repetir último pedido" e o carrinho se enche de uma vez;
 * "Enviar pedido" → "Pedido enviado" (emenda com S4 em 15,0: phoneHero + appSent).
 */
SAIB.act("S3", {
  css: `
  [data-act="S3"] .s3-clock { position:absolute; border-radius:999px; pointer-events:none;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.9), 0 0 26px rgba(124,58,237,0.55), inset 0 0 0 999px rgba(124,58,237,0.10); }
  [data-act="S3"] .s3-sweep { position:absolute; inset:0; border-radius:inherit; overflow:hidden; pointer-events:none; }
  [data-act="S3"] .s3-sweep i { position:absolute; top:-20%; bottom:-20%; width:42%; transform:skewX(-18deg);
    background:linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(94,231,255,0.35) 35%, rgba(255,255,255,0.75) 50%, rgba(255,122,217,0.35) 65%, rgba(255,255,255,0) 100%); }
  [data-act="S3"] .s3-flash { position:absolute; inset:0; border-radius:20px; background:rgba(124,58,237,0.10); box-shadow: inset 0 0 0 2px rgba(124,58,237,0.35); pointer-events:none; }
  `,
  build(root, ctx) {
    const { h } = SAIB.fx;
    const ui = SAIB.ui, sc = SAIB.scene, S = SAIB.screens, st = ctx.state;
    st.rig = sc.rig(root, { phone: true, laptop: true, line: true });
    st.home = S.portalHome();
    st.rig.laptop.setScreen(st.home);
    st.cat = S.appCatalog();
    st.sent = S.appSent();
    const R = st.cat.refs;
    // barra do carrinho (fica oculta até o primeiro item: a emenda usa o catálogo vazio)
    st.cb = ui.app.cartBar({ items: 1, total: "R$ 18,90", cta: "Enviar pedido" });
    R.cartSlot.append(st.cb);
    // reflexo holográfico no botão "Repetir último pedido"
    st.sweep = h("div", { class: "s3-sweep" }, [h("i")]);
    R.repeatBtn.append(st.sweep);
    // realce das linhas que recebem o último pedido
    st.flash = {};
    for (const k of ["agua", "refri", "cerveja"]) {
      const f = h("div", { class: "s3-flash" });
      R.rows[k].prepend(f);
      st.flash[k] = f;
    }
    // anel de toque + destaque do relógio (no overlay da tela, px nativos)
    st.ring = ui.tapRing();
    st.clock = h("div", { class: "s3-clock" });
    st.rig.phone.overlay.append(st.clock, st.ring);
    st.timeEl = st.cat.querySelector(".app-status > span");
    // o corpo rola por baixo do cabeçalho (como num app de verdade)
    for (const el of [st.cat.querySelector(".app-status"), st.cat.querySelector(".app-header")]) {
      el.style.zIndex = 2;
      el.style.background = "var(--ui-bg)";
    }
    st.hdr = st.cat.querySelector(".app-header");

    st.t1 = sc.title(root, "Seu cliente pede\n*sozinho.*", { top: 214, size: 100 });
    st.t2 = sc.title(root, "A *qualquer hora.*", { top: 262, size: 100 });
    st.t3 = sc.title(root, "O último pedido\nem *um toque.*", { top: 214, size: 100 });
  },
  update(t, ctx) {
    const { tw, ease, prog, lerp, clamp, spring } = SAIB.fx;
    const ui = SAIB.ui, sc = SAIB.scene, P = ui.POSES, st = ctx.state, r = st.rig, R = st.cat.refs;
    const T = ctx.start + t;
    const ph = r.phone;

    // ---- câmera: split → close no celular; notebook e linha saem
    const cp = ease.inOutQuart(prog(t, 0.0, 1.35));
    sc.place(ph, ui.lerpPose(P.phoneSplit, P.phoneHero, cp), T);
    const lo = 1 - prog(t, 0.05, 0.7);
    r.show(r.sL, lo);
    if (lo > 0) {
      const Lout = Object.assign({}, P.laptopSplit, { x: P.laptopSplit.x + 260, y: P.laptopSplit.y + 420, s: P.laptopSplit.s * 0.9 });
      sc.place(r.laptop, ui.lerpPose(P.laptopSplit, Lout, ease.inCubic(prog(t, 0, 0.7))), T);
      r.laptop.setLid(ui.LID.split);
    }
    const lineOp = 1 - prog(t, 0.0, 0.35);
    if (lineOp > 0) {
      r.line.el.style.display = "block";
      ui.connectSplit(r.line, ph, r.laptop).draw(1).opacity(lineOp);
    } else r.line.el.style.display = "none";
    ph.glare(prog(t, 0.9, 1.9) || prog(t, 5.0, 5.9));

    // ---- tela: catálogo → (6,25–6,65) pedido enviado
    const sw = prog(t, 6.25, 6.65);
    if (sw <= 0) ph.setScreen(st.cat);
    else if (sw >= 1) ph.setScreen(st.sent);
    else ph.setScreen([st.cat, st.sent]);
    sc.fade(st.sent, sw >= 1 ? 1 : ease.outCubic(sw));
    st.sent.style.transform = sw >= 1 ? "" : `translateY(${((1 - ease.outCubic(sw)) * 60).toFixed(2)}px)`;
    sc.fade(st.cat, 1 - ease.inCubic(sw));
    // check do "Pedido enviado" entra com mola e assenta antes da emenda
    const ck = t - 6.38;
    const cks = ck <= 0 ? 0.4 : Math.min(1.12, spring(ck, { freq: 2.2, damping: 0.5 }));
    st.sent.refs.check.style.transform = ck > 0.8 ? "" : `scale(${lerp(0.4, 1, cks).toFixed(4)})`;

    // ---- item no carrinho (1,55): toque no "+" da água
    const off = (el) => ui.offsetIn(el, ph.content);
    const SCROLL = -178;
    let ring = null;
    if (t < 2.4) {
      const a = off(R.rows.agua.refs.right);
      ring = [a.cx, a.cy, 1.55];
    } else if (t < 5.0) {
      const b = off(R.repeatBtn);
      ring = [b.cx, b.cy + SCROLL, 4.0];
    } else {
      const c = off(st.cb), go = st.cb.refs.go;
      ring = [c.x + go.offsetLeft + go.offsetWidth / 2, c.y + c.h / 2, 6.0];
    }
    st.ring.at(ring[0], ring[1]);
    ui.tap(st.ring, t, ring[2]);

    const qA = t < 1.65 ? 0 : t < 4.15 ? 1 : 3;
    R.rows.agua.setQty(qA);
    R.rows.refri.setQty(t < 4.3 ? 0 : 2);
    R.rows.cerveja.setQty(t < 4.45 ? 0 : 1);
    R.rows.agua.refs.right.style.transform = `scale(${ui.press(t, 1.55, 0.08).toFixed(4)})`;
    // realce das linhas que recebem o último pedido
    [["agua", 4.15], ["refri", 4.3], ["cerveja", 4.45]].forEach(([k, at]) => {
      const f = Math.sin(Math.PI * prog(t, at - 0.05, at + 0.6));
      st.flash[k].style.opacity = f.toFixed(3);
    });

    // barra do carrinho sobe no primeiro item e conta os itens do último pedido
    const cbp = tw(t, 1.7, 0.5, ease.signature);
    st.cb.style.display = cbp > 0 && sw < 1 ? "flex" : "none";
    const [n, tot] = t < 4.15 ? [1, "R$ 18,90"] : t < 4.3 ? [3, "R$ 56,70"] : t < 4.45 ? [5, "R$ 151,50"] : [6, "R$ 206,40"];
    st.cb.set(n, tot);
    const bump = Math.max(ui.press(t, 4.15, -0.04), ui.press(t, 4.3, -0.04), ui.press(t, 4.45, -0.05));
    st.cb.style.transform = `translateY(${((1 - cbp) * 150).toFixed(2)}px) scale(${(bump * ui.press(t, 6.0, 0.04)).toFixed(4)})`;
    st.cb.style.opacity = prog(t, 1.7, 1.95).toFixed(3);
    // rola o catálogo para a barra do carrinho não cobrir a cerveja
    st.hdr.style.boxShadow = t < 1.75 ? "" : `0 1.5px 0 rgba(30,20,60,${(0.08 * prog(t, 1.75, 2.35)).toFixed(3)})`;
    R.body.style.transform = t < 1.75 ? "" : `translateY(${SCROLL * ease.inOutCubic(prog(t, 1.75, 2.35))}px)`;

    // botão "Repetir último pedido": reflexo (3,55) + toque (4,0)
    const swp = prog(t, 3.5, 4.0);
    st.sweep.firstChild.style.left = lerp(-50, 120, ease.inOutCubic(swp)).toFixed(2) + "%";
    st.sweep.style.opacity = swp > 0 && swp < 1 ? "1" : "0";
    R.repeatBtn.style.transform = `scale(${ui.press(t, 4.0, 0.035).toFixed(4)})`;
    R.repeatBtn.style.boxShadow = t > 3.4 && t < 4.6 ? `inset 0 0 0 2px rgba(124,58,237,${(0.6 * Math.sin(Math.PI * prog(t, 3.4, 4.6))).toFixed(3)}), 0 0 ${(30 * Math.sin(Math.PI * prog(t, 3.4, 4.6))).toFixed(1)}px rgba(124,58,237,0.35)` : "";

    // destaque do relógio 22:14 durante "A qualquer hora."
    const ckp = prog(t, 2.95, 3.35) * (1 - prog(t, 4.2, 4.5));
    if (ckp > 0 && sw <= 0) {
      const c = off(st.timeEl);
      st.clock.style.display = "block";
      const pad = 12;
      Object.assign(st.clock.style, { left: c.x - pad * 1.6 + "px", top: c.y - pad + "px", width: c.w + pad * 3.2 + "px", height: c.h + pad * 2 + "px" });
      st.clock.style.opacity = ckp.toFixed(3);
      st.clock.style.transform = `scale(${lerp(1.4, 1, ease.outCubic(prog(t, 2.95, 3.4))).toFixed(4)})`;
      st.timeEl.style.color = "var(--p600)";
    } else {
      st.clock.style.display = "none";
      st.timeEl.style.color = "";
    }

    // ---- títulos (todos fora antes de 14,7 = t 7,3)
    st.t1.update(t, 0.55, 2.7);
    st.t2.update(t, 2.95, 4.35);
    st.t3.update(t, 4.6, 6.6);
  },
});
