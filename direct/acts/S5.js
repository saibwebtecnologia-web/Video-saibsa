/*
 * S5 · Aprovação (20,8–26,2). "De manhã": o fundo esquenta levemente (SAIB.bg warm) e um relógio 07:30 com
 * nascer do sol aparece. O celular sai, o notebook assume (POSES.laptopHero) com "Pedidos para aprovar":
 * o pedido da Mercearia do Bairro (feito às 22:14) está lá. O cursor clica em "Aprovar" → "Aprovado".
 * Emenda com S6 em 26,2: laptopHero + portalApproved.
 */
SAIB.act("S5", {
  css: `
  [data-act="S5"] .s5-rowglow { position:absolute; inset:-4px; border-radius:14px; pointer-events:none;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.75), 0 0 30px rgba(124,58,237,0.35); }
  `,
  build(root, ctx) {
    const { h, tw, prog } = SAIB.fx;
    const ui = SAIB.ui, sc = SAIB.scene, S = SAIB.screens, st = ctx.state;
    st.rig = sc.rig(root, { phone: true, laptop: true });
    st.offer = S.appOffer();
    st.rig.phone.setScreen(st.offer);
    st.orders = S.portalOrders(0);
    st.rig.laptop.setScreen(st.orders.el);
    st.cur = ui.cursor({ size: 50 });
    st.rig.laptop.overlay.append(st.cur.el);
    st.rowGlow = h("div", { class: "s5-rowglow" });
    st.orders.el.refs.mainRow.append(st.rowGlow);
    st.t1 = sc.title(root, "De manhã, o pedido\njá está no *painel.*", { top: 214, size: 88 });
    st.t2 = sc.title(root, "Você aprova\npelo *portal.*", { top: 214, size: 100 });
    st.chip = sc.pill("07:30 · de manhã", { icon: "sunrise", size: 32 });
    st.chip.style.left = "80px";
    st.chip.style.top = "440px";
    root.append(st.chip);
    // manhã: fundo um pouco mais quente e claro durante a cena
    SAIB.bg.drive((T) => (T > 20.6 && T < 26.6 ? { warm: tw(T, 21.0, 1.4) * (1 - prog(T, 25.5, 26.4)) } : null));
  },
  update(t, ctx) {
    const { tw, ease, prog, lerp, inOut } = SAIB.fx;
    const ui = SAIB.ui, sc = SAIB.scene, P = ui.POSES, st = ctx.state, r = st.rig;
    const T = ctx.start + t;
    const lp = r.laptop;

    // ---- celular sai para cima/esquerda; notebook sobe para o close
    const po = ease.inOutCubic(prog(t, 0.0, 1.15));
    r.show(r.sP, 1 - prog(t, 0.35, 1.0));
    if (po < 1) sc.place(r.phone, ui.lerpPose(P.phoneHero, { x: 230, y: 520, z: 0, rx: 40, ry: 0, rz: 24, s: 0.42 }, po), T);
    const li = tw(t, 0.2, 1.3, ease.signature);
    r.show(r.sL, prog(t, 0.15, 0.55));
    sc.place(lp, ui.lerpPose(Object.assign({}, P.laptopHero, { y: P.laptopHero.y + 640, rx: 80, s: P.laptopHero.s * 0.82 }), P.laptopHero, li), T);
    lp.setLid(lerp(55, ui.LID.hero, ease.inOutCubic(prog(t, 0.25, 1.35))));
    lp.glare(prog(t, 1.2, 2.2));

    // ---- linha do pedido recebido à noite em destaque; cursor aprova
    st.rowGlow.style.opacity = (Math.sin(Math.PI * prog(t, 1.3, 2.7)) * 0.9).toFixed(3);
    const ap = ui.offsetIn(st.orders.el.refs.approve, lp.content);
    const cp = ease.inOutCubic(prog(t, 2.05, 2.9));
    st.cur.el.style.display = t > 1.9 && t < 4.7 ? "block" : "none";
    st.cur.el.style.opacity = (prog(t, 1.9, 2.1) * (1 - prog(t, 4.1, 4.5))).toFixed(3);
    st.cur.at(lerp(900, ap.x + ap.w * 0.55, cp), lerp(560, ap.y + ap.h * 0.62, cp) + prog(t, 3.5, 4.5) * 60);
    st.cur.click(prog(t, 3.0, 3.2));
    st.orders.el.refs.approve.style.transform = t < 3.6 ? `scale(${ui.press(t, 3.0, 0.06).toFixed(4)})` : "";
    st.orders.set(ease.inOutCubic(prog(t, 3.12, 3.45)));

    // ---- textos (fora antes de 25,9 = t 5,1)
    st.t1.update(t, 0.35, 2.7);
    inOut(st.chip, t, 0.75, 2.65, { in: { y: 30, blur: 8 }, out: { y: -20 } });
    st.t2.update(t, 3.35, 4.55);
  },
});
