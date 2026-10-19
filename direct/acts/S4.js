/*
 * S4 · Ofertas (15,0–20,8). Do close no celular, a câmera recua: o notebook volta em destaque com o
 * formulário "Nova oferta". O cursor clica em "Publicar"; o voucher se descola da tela como um cartão de
 * vidro, viaja pela linha holográfica e pousa no app do cliente ("Oferta para você"). A câmera termina
 * no close do celular (emenda com S5 em 20,8: phoneHero + appOffer).
 */
SAIB.act("S4", {
  css: `
  [data-act="S4"] .s4-card { position:absolute; left:0; top:0; transform-origin:50% 50%; will-change:transform; }
  [data-act="S4"] .s4-glow { position:absolute; left:0; top:0; width:560px; height:560px; margin:-280px 0 0 -280px; border-radius:50%;
    background:radial-gradient(closest-side, rgba(201,182,255,0.55), rgba(124,58,237,0.18) 55%, rgba(124,58,237,0)); pointer-events:none; }
  `,
  build(root, ctx) {
    const { h } = SAIB.fx;
    const ui = SAIB.ui, sc = SAIB.scene, S = SAIB.screens, st = ctx.state;
    st.rig = sc.rig(root, { phone: true, laptop: true, line: true });
    st.sent = S.appSent();
    st.offer = S.appOffer();
    st.newOffer = S.portalNewOffer();
    st.offers = S.portalOffers();
    st.cur = ui.cursor({ size: 50 });
    st.rig.laptop.overlay.append(st.cur.el);
    // cartão que viaja (2D, acima de tudo)
    st.glow = h("div", { class: "s4-glow" });
    st.card = S.voucherMini();
    st.card.classList.add("s4-card");
    root.append(st.glow, st.card);
    st.t1 = sc.title(root, "Você programa\na *oferta.*", { top: 214, size: 100 });
    st.t2 = sc.title(root, "Ela aparece no app\ndo *seu cliente.*", { top: 214, size: 92 });
  },
  update(t, ctx) {
    const { tw, ease, prog, lerp, clamp, spring } = SAIB.fx;
    const ui = SAIB.ui, sc = SAIB.scene, P = ui.POSES, st = ctx.state, r = st.rig;
    const T = ctx.start + t;
    const ph = r.phone, lp = r.laptop;
    const LF = { x: 600, y: 1300, z: 0, rx: 62, ry: 0, rz: 22, s: 0.7 };

    // ---- câmera: close → split (notebook em destaque) → close no celular
    const out1 = ease.inOutQuart(prog(t, 0.0, 1.3));
    const in2 = ease.inOutQuart(prog(t, 3.55, 4.65));
    let PP = ui.lerpPose(P.phoneHero, P.phoneSplit, out1);
    PP = ui.lerpPose(PP, P.phoneHero, in2);
    sc.place(ph, PP, T);
    ph.glare(prog(t, 4.2, 5.2));

    const lin = tw(t, 0.25, 1.25, ease.signature);
    const lout = ease.inCubic(prog(t, 3.5, 4.3));
    const Lfrom = Object.assign({}, LF, { x: LF.x + 360, y: LF.y + 260, s: LF.s * 0.85 });
    const Lto = Object.assign({}, LF, { x: LF.x + 300, y: LF.y + 420, s: LF.s * 0.9 });
    r.show(r.sL, prog(t, 0.25, 0.7) * (1 - prog(t, 3.6, 4.25)));
    sc.place(lp, ui.lerpPose(ui.lerpPose(Lfrom, LF, lin), Lto, lout), T);
    lp.setLid(ui.LID.split);
    lp.glare(prog(t, 1.0, 1.9));

    // ---- telas
    const cf = prog(t, 0.85, 1.25);
    if (cf <= 0) ph.setScreen(st.sent);
    else if (cf >= 1) ph.setScreen(st.offer);
    else ph.setScreen([st.sent, st.offer]);
    sc.fade(st.offer, cf);
    // cartão "Oferta para você" no app: aparece quando o voucher pousa (3,35)
    const oc = st.offer.refs.offer;
    const la = t - 3.35;
    if (la <= 0) {
      oc.style.opacity = "0";
      oc.style.transform = "scale(0.9)";
    } else if (la < 1.2) {
      oc.style.opacity = prog(la, 0, 0.18).toFixed(3);
      oc.style.transform = `scale(${lerp(0.9, 1, Math.min(1.04, spring(la, { freq: 2.4, damping: 0.55 }))).toFixed(4)})`;
    } else {
      oc.style.opacity = "";
      oc.style.transform = "";
    }
    const sw = prog(t, 3.0, 3.4);
    if (sw <= 0) lp.setScreen(st.newOffer);
    else if (sw >= 1) lp.setScreen(st.offers);
    else lp.setScreen([st.newOffer, st.offers]);
    sc.fade(st.offers, sw);

    // ---- cursor no portal: entra, vai até "Publicar" e clica (1,95)
    const pub = ui.offsetIn(st.newOffer.refs.publish, lp.content);
    const cp = ease.inOutCubic(prog(t, 1.15, 1.9));
    st.cur.el.style.display = t > 1.0 && t < 2.9 ? "block" : "none";
    st.cur.el.style.opacity = (prog(t, 1.0, 1.2) * (1 - prog(t, 2.5, 2.8))).toFixed(3);
    st.cur.at(lerp(860, pub.x + pub.w * 0.62, cp), lerp(560, pub.y + pub.h * 0.62, cp));
    st.cur.click(prog(t, 1.95, 2.15));
    st.newOffer.refs.publish.style.transform = `scale(${ui.press(t, 1.95, 0.05).toFixed(4)})`;

    // ---- linha holográfica
    const lineOp = prog(t, 0.8, 1.1) * (1 - prog(t, 3.5, 3.9));
    if (lineOp > 0) {
      r.line.el.style.display = "block";
      ui.connectSplit(r.line, ph, lp).draw(ease.inOutCubic(prog(t, 0.9, 1.5))).opacity(lineOp);
    } else r.line.el.style.display = "none";

    // ---- o voucher se descola do portal e viaja até o celular (2,15–3,35)
    const v = st.newOffer.refs.voucher;
    const lift = tw(t, 2.15, 0.45, ease.signature);
    const trav = ease.inOutCubic(prog(t, 2.55, 3.35));
    const show = t > 2.15 && t < 3.55;
    v.style.opacity = t > 2.15 && sw < 1 ? "0" : "";
    st.card.style.display = show ? "block" : "none";
    st.glow.style.display = show ? "block" : "none";
    if (show) {
      const vr = ui.rectOf(v);
      // origem: posição do voucher na tela do notebook (escala aproximada pelo tamanho projetado)
      const s0 = vr.w / 300;
      const x0 = vr.cx, y0 = vr.cy - lift * 150;
      const s1 = lerp(s0, 1.25, lift);
      // destino: o cartão de oferta na tela do celular
      const tgt = ph.proj(0.5, 0.25);
      const end = ui.rectOf(ph.screen).w / 520 * 0.95;
      let x = x0, y = y0, s = s1, rot = 0;
      if (trav > 0) {
        // percorre a linha do fim (notebook) ao começo (celular); nas pontas, mistura com origem/destino
        const pt = r.line.along(1 - trav);
        const wA = 1 - prog(trav, 0, 0.25), wB = prog(trav, 0.75, 1);
        x = lerp(lerp(pt.x, x0, wA), tgt.x, wB);
        y = lerp(lerp(pt.y, y0, wA), tgt.y, wB);
        s = lerp(s1, end, ease.inOutCubic(trav));
        rot = Math.sin(trav * Math.PI) * -8;
      }
      const fadeOut = 1 - prog(t, 3.3, 3.5);
      st.card.style.transform = `translate(${(x - 150).toFixed(2)}px, ${(y - 85).toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(4)})`;
      st.card.style.opacity = (prog(t, 2.15, 2.3) * fadeOut).toFixed(3);
      st.glow.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${(s * 0.8).toFixed(3)})`;
      st.glow.style.opacity = (0.8 * lift * fadeOut).toFixed(3);
      ui.chromatic(st.card, Math.sin(trav * Math.PI) * 2);
      r.line.pulse(trav > 0 && trav < 1 ? 1 - trav : 0, { len: 220 });
    } else r.line.pulse(0);

    // ---- títulos (fora antes de 20,5 = t 5,5)
    st.t1.update(t, 0.45, 2.45);
    st.t2.update(t, 3.45, 5.0);
  },
});
