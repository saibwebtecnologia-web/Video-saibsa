/*
 * Capa do Reels (1080 × 1920). O título fica no centro, dentro da área 1080 × 1350 (y 285–1635) que aparece
 * no grid do perfil. Os dois lados (celular + notebook) ligados pela linha holográfica.
 */
SAIB.act("C", {
  css: `
  [data-act="C"] .cv-top { position:absolute; left:0; width:1080px; top:716px; display:flex; justify-content:center; align-items:center; gap:22px;
    font-family:var(--font); font-size:40px; font-weight:700; letter-spacing:-0.02em; color:#fff; }
  [data-act="C"] .cv-top img { height:52px; }
  [data-act="C"] .cv-top i { width:2px; height:44px; background:rgba(255,255,255,0.4); }
  [data-act="C"] .cv-title { position:absolute; left:0; width:1080px; top:796px; text-align:center; font-family:var(--font); font-optical-sizing:auto;
    font-size:150px; font-weight:800; letter-spacing:-0.045em; line-height:0.98; color:#fff; }
  [data-act="C"] .cv-selo { position:absolute; right:64px; top:330px; width:200px; height:200px; object-fit:contain; }
  `,
  build(root, ctx) {
    const { h } = SAIB.fx;
    const sc = SAIB.scene, S = SAIB.screens, st = ctx.state;
    st.rig = sc.rig(root, { phone: true, laptop: true, line: true });
    st.rig.phone.setScreen(S.appOffer());
    st.rig.laptop.setScreen(S.portalHome());
    root.append(
      h("div", { class: "cv-top" }, [h("img", { src: "../../assets/brand/logo-saib-white.png" }), h("i"), h("span", { html: 'SAIB <span class="holo-text">Direct</span>' })]),
      h("div", { class: "cv-title", html: 'Um app,<br><span class="holo-text">dois lados.</span>' }),
      h("img", { class: "cv-selo", src: "../../assets/brand/selo-40-anos.png" })
    );
  },
  update(t, ctx) {
    const ui = SAIB.ui, P = ui.POSES, st = ctx.state, r = st.rig;
    ui.pose(r.phone, ui.addPose(P.phoneSplit, { x: 70, y: -150, s: 0.92 }));
    ui.pose(r.laptop, ui.addPose(P.laptopSplit, { x: -10, y: 400, s: 0.86 }));
    r.laptop.setLid(ui.LID.split);
    ui.connectSplit(r.line, r.phone, r.laptop).draw(1);
    r.line.dot(0.5, 1);
    r.line.el.style.opacity = 0.9;
    // a linha passa por trás do título: some na faixa do texto
    const m = "linear-gradient(180deg, #000 0px, #000 640px, transparent 700px, transparent 1100px, #000 1170px)";
    r.line.el.style.webkitMaskImage = r.line.el.style.maskImage = m;
  },
});
