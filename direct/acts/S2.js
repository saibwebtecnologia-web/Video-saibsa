/*
 * S2 · Um app, dois lados (3,6–7,4). Do celular frontal, a câmera gira para o isométrico: o celular deita no
 * piso (POSES.phoneSplit) e o notebook sobe e abre a tampa (POSES.laptopSplit). A linha holográfica liga os
 * dois. Rótulos "Seu cliente" / "Você". Emendas: 3,6 (phoneFront + splash) e 7,4 (split + catálogo + portal).
 */
SAIB.act("S2", {
  css: `
  [data-act="S2"] .s2-lab { position:absolute; font-family:var(--font); color:#fff; }
  [data-act="S2"] .s2-lab b { display:block; font-size:62px; font-weight:740; letter-spacing:-0.035em; line-height:1; }
  [data-act="S2"] .s2-lab span { display:flex; align-items:center; gap:10px; margin-bottom:14px; font-size:28px; font-weight:560; color:var(--p300); letter-spacing:-0.005em; }
  `,
  build(root, ctx) {
    const { h } = SAIB.fx;
    const ui = SAIB.ui, sc = SAIB.scene, S = SAIB.screens, st = ctx.state;
    st.rig = sc.rig(root, { phone: true, laptop: true, line: true });
    st.splash = S.splash();
    st.cat = S.appCatalog();
    st.home = S.portalHome();
    st.rig.laptop.setScreen(st.home);
    st.title = sc.title(root, "Um app, *dois lados.*", { top: 236, size: 108 });
    const lab = (top, left, sup, icon, name) => {
      const el = h("div", { class: "s2-lab", style: { left: left + "px", top: top + "px" } }, [
        h("span", {}, [ui.icon(icon, { size: 30, stroke: 2.2 }), document.createTextNode(sup)]),
        h("b", { text: name }),
      ]);
      root.append(el);
      return el;
    };
    st.labP = lab(560, 664, "App iOS e Android", "smartphone", "Seu cliente");
    st.labL = lab(1404, 88, "Portal web", "monitor", "Você");
  },
  update(t, ctx) {
    const { tw, ease, prog, lerp, inOut } = SAIB.fx;
    const ui = SAIB.ui, sc = SAIB.scene, P = ui.POSES, st = ctx.state, r = st.rig;
    const T = ctx.start + t;

    // celular: frontal → isométrico
    const pp = ease.inOutCubic(prog(t, 0.05, 1.5));
    sc.place(r.phone, ui.lerpPose(P.phoneFront, P.phoneSplit, pp), T);
    r.phone.glare(prog(t, 0.6, 1.6));

    // telas do celular: abertura → catálogo
    const cf = prog(t, 1.0, 1.45);
    if (cf <= 0) r.phone.setScreen(st.splash);
    else if (cf >= 1) r.phone.setScreen(st.cat);
    else {
      r.phone.setScreen([st.splash, st.cat]);
      sc.fade(st.cat, cf);
    }
    if (cf >= 1) sc.fade(st.cat, 1);

    // notebook: sobe de baixo e abre a tampa
    const lp = tw(t, 0.35, 1.35, ease.signature);
    r.show(r.sL, prog(t, 0.35, 0.8));
    const Lin = Object.assign({}, P.laptopSplit, { y: P.laptopSplit.y + 380, x: P.laptopSplit.x + 120, s: P.laptopSplit.s * 0.86 });
    sc.place(r.laptop, ui.lerpPose(Lin, P.laptopSplit, lp), T);
    r.laptop.setLid(lerp(4, ui.LID.split, ease.inOutCubic(prog(t, 0.6, 1.9))));
    sc.fade(st.home, prog(t, 1.45, 1.95));
    r.laptop.glare(prog(t, 1.7, 2.7));

    // linha holográfica entre os dois lados
    if (t > 1.55) {
      r.line.el.style.display = "block";
      ui.connectSplit(r.line, r.phone, r.laptop).draw(ease.inOutCubic(prog(t, 1.6, 2.35)));
      r.line.pulse(prog(t, 2.35, 3.25));
      r.line.dot(1, 0);
    } else r.line.el.style.display = "none";

    // textos (fora antes da emenda de 7,4 = t 3,8)
    st.title.update(t, 0.45, 3.0);
    inOut(st.labP, t, 1.85, 2.95, { in: { y: 40, blur: 10 }, out: { y: -24 } });
    inOut(st.labL, t, 2.1, 2.95, { in: { y: 40, blur: 10 }, out: { y: -24 } });
  },
});
