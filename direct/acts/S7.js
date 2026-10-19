/*
 * S7 · O cliente acompanha (31,4–35,8). O celular sobe para o close (POSES.phoneHero) com a tela de
 * acompanhamento: Realizado → Aprovado → Em transporte → Entregue acendem em sequência.
 * Emenda com S8 em 35,8: phoneHero + appDelivered (= appTracking(4)).
 */
SAIB.act("S7", {
  build(root, ctx) {
    const sc = SAIB.scene, S = SAIB.screens, st = ctx.state;
    st.rig = sc.rig(root, { phone: true });
    st.track = S.appTracking(0);
    st.rig.phone.setScreen(st.track.el);
    st.title = sc.title(root, "Seu cliente acompanha\n*cada etapa.*", { top: 214, size: 84 });
  },
  update(t, ctx) {
    const { tw, ease, prog, lerp } = SAIB.fx;
    const ui = SAIB.ui, sc = SAIB.scene, P = ui.POSES, st = ctx.state, r = st.rig;
    const T = ctx.start + t;
    // celular sobe de baixo para o close
    const pin = tw(t, -0.25, 1.15, ease.signature);
    sc.place(r.phone, ui.lerpPose(Object.assign({}, P.phoneHero, { y: P.phoneHero.y + 820, rx: 22, s: P.phoneHero.s * 0.92 }), P.phoneHero, pin), T);
    r.phone.glare(prog(t, 0.6, 1.6));
    // etapas: cada uma acende em ~0,65 s
    const ks = [0.3, 0.95, 1.6, 2.25, 2.9];
    let p = 0;
    for (let k = 0; k < 4; k++) p += ease.inOutCubic(prog(t, ks[k], ks[k + 1]));
    st.track.set(p);
    st.title.update(t, 0.25, 3.6);
  },
});
