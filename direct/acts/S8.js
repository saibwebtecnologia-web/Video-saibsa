/*
 * S8 · Fechamento (35,8–41,0). O celular recua, o notebook volta e os dois se ligam pela linha (eco do
 * conceito); depois recuam e somem. "SAIB Direct." → "Seu cliente pede. Você vende." → CTA → selo dos
 * 40 anos + logo saib. Composição final parada (com deriva) até 41,0, porque o Reels repete.
 */
SAIB.act("S8", {
  css: `
  [data-act="S8"] .s8-row { position:absolute; left:0; width:1080px; display:flex; justify-content:center; align-items:center; }
  [data-act="S8"] .s8-sub { font-family:var(--font); font-size:60px; font-weight:620; letter-spacing:-0.03em; color:#fff; white-space:nowrap; }
  [data-act="S8"] .s8-sub b { font-weight:780; }
  [data-act="S8"] .s8-cta { position:relative; }
  [data-act="S8"] .s8-brand { gap:64px; }
  [data-act="S8"] .s8-div { width:2px; height:150px; background:linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.45), rgba(255,255,255,0)); }
  [data-act="S8"] .s8-note { font-family:var(--font); font-size:22px; font-weight:500; color:rgba(255,255,255,0.55); letter-spacing:0.01em; }
  [data-act="S8"] .s8-halo { position:absolute; left:540px; top:700px; width:1100px; height:700px; margin:-350px 0 0 -550px; border-radius:50%;
    background:radial-gradient(closest-side, rgba(167,139,250,0.45), rgba(124,58,237,0.15) 55%, rgba(124,58,237,0)); pointer-events:none; }
  `,
  build(root, ctx) {
    const { h } = SAIB.fx;
    const ui = SAIB.ui, sc = SAIB.scene, S = SAIB.screens, st = ctx.state;
    st.halo = h("div", { class: "s8-halo" });
    root.append(st.halo);
    st.rig = sc.rig(root, { phone: true, laptop: true, line: true });
    st.rig.phone.setScreen(S.appDelivered());
    st.rig.laptop.setScreen(S.portalHome());
    st.title = sc.title(root, "SAIB *Direct.*", { top: 520, size: 172, align: "center", weight: 800, hlFrom: 400, stag: 0.09 });
    st.sub = h("div", { class: "s8-row", style: { top: "760px" } }, [h("div", { class: "s8-sub", html: "Seu cliente pede. <b>Você vende.</b>" })]);
    const cta = sc.pill("Agende uma demonstração gratuita · link da bio", { icon: "calendar-check", size: 32, pad: "20px 32px" });
    cta.classList.add("s8-cta");
    cta.style.position = "relative";
    st.cta = h("div", { class: "s8-row", style: { top: "900px" } }, [cta]);
    st.ctaPill = cta;
    st.selo = h("img", { src: "../assets/brand/selo-40-anos.png", style: { height: "300px", width: "300px", objectFit: "contain" } });
    st.logo = h("img", { src: "../assets/brand/logo-saib-white.png", style: { height: "112px" } });
    st.brand = h("div", { class: "s8-row s8-brand", style: { top: "1110px" } }, [st.selo, h("div", { class: "s8-div" }), st.logo]);
    st.note = h("div", { class: "s8-row", style: { top: "1500px" } }, [h("div", { class: "s8-note", text: "Telas e dados ilustrativos." })]);
    root.append(st.sub, st.cta, st.brand, st.note);
  },
  update(t, ctx) {
    const { tw, ease, prog, lerp, inOut, set } = SAIB.fx;
    const ui = SAIB.ui, sc = SAIB.scene, P = ui.POSES, st = ctx.state, r = st.rig;
    const T = ctx.start + t;

    // ---- celular recua; notebook volta; os dois se ligam; depois recuam e somem
    const sp = ease.inOutQuart(prog(t, 0.0, 1.2));
    const back = ease.inOutCubic(prog(t, 1.55, 2.45));
    const away = { y: -160 * back, s: lerp(1, 0.72, back) };
    sc.place(r.phone, ui.addPose(ui.lerpPose(P.phoneHero, P.phoneSplit, sp), { y: away.y, s: away.s }), T);
    const li = tw(t, 0.25, 1.1, ease.signature);
    sc.place(r.laptop, ui.addPose(ui.lerpPose(Object.assign({}, P.laptopSplit, { x: P.laptopSplit.x + 320, y: P.laptopSplit.y + 300, s: P.laptopSplit.s * 0.85 }), P.laptopSplit, li), { y: away.y * 0.6, s: away.s }), T);
    r.laptop.setLid(lerp(30, ui.LID.split, ease.inOutCubic(prog(t, 0.3, 1.2))));
    const devOp = 1 - prog(t, 1.75, 2.4);
    r.show(r.sP, devOp);
    r.show(r.sL, prog(t, 0.25, 0.6) * devOp);
    const lineOp = prog(t, 0.75, 0.95) * devOp;
    if (lineOp > 0) {
      r.line.el.style.display = "block";
      ui.connectSplit(r.line, r.phone, r.laptop).draw(ease.inOutCubic(prog(t, 0.8, 1.3))).opacity(lineOp);
      r.line.pulse(prog(t, 1.2, 1.9), { len: 200 });
    } else r.line.el.style.display = "none";
    r.phone.glare(prog(t, 0.4, 1.3));

    // ---- marca
    st.halo.style.opacity = (0.9 * ease.outCubic(prog(t, 1.8, 2.8))).toFixed(3);
    st.halo.style.transform = `scale(${lerp(0.7, 1, ease.outCubic(prog(t, 1.8, 3.2))).toFixed(4)})`;
    st.title.update(t, 1.95, null);
    ui.chromatic(st.title.el, Math.sin(Math.PI * prog(t, 1.95, 2.45)) * 3);
    inOut(st.sub, t, 2.55, null, { y: 40, blur: 10 });
    inOut(st.cta, t, 3.05, null, { y: 40, blur: 10 });
    st.ctaPill.querySelector(".glass-sheen") && 0;
    inOut(st.brand, t, 3.4, null, { y: 50, blur: 12, dur: 0.9 });
    inOut(st.note, t, 3.8, null, { y: 20, blur: 6 });
    // deriva sutil da composição final
    const D = ui.drift(T, 0.6);
    st.selo.style.transform = `rotate(${(D.rz * 2).toFixed(3)}deg)`;
  },
});
