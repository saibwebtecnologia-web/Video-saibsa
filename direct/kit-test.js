/*
 * Banco de testes do kit (direct/kit-test.html). Um "ato" K de 6 s, um segundo por composição:
 *  0 phoneFront + splash · 1 split + linha (catálogo / portal) · 2 phoneHero + catálogo
 *  3 laptopHero + portalOrders(0,5) · 4 phoneHero + oferta · 5 phoneHero + entregue
 */
SAIB.manifest = Object.assign({}, SAIB.manifest, {
  duration: 6,
  acts: [{ id: "K", start: 0, end: 6, title: "Kit" }],
});

// ?ov={"phoneSplit":{"s":0.5}} sobrepõe poses (ajuste fino); ?lid={"split":108}
{
  const q = new URLSearchParams(location.search);
  const ov = q.get("ov"), lid = q.get("lid");
  if (ov) for (const [k, v] of Object.entries(JSON.parse(ov))) Object.assign(SAIB.ui.POSES[k], v);
  if (lid) Object.assign(SAIB.ui.LID, JSON.parse(lid));
}

SAIB.act("K", {
  css: `
  [data-act="K"] .kt-title { position:absolute; left:80px; right:80px; top:230px; text-align:left; }
  [data-act="K"] .kt-lab { position:absolute; display:flex; flex-direction:column; gap:10px; }
  [data-act="K"] .kt-lab b { font-size:56px; font-weight:720; letter-spacing:-0.03em; line-height:1; }
  `,
  build(root, ctx) {
    const ui = SAIB.ui, S = SAIB.screens, { h } = SAIB.fx;
    const st = ctx.state;
    st.sL = ui.stage3d();
    st.sP = ui.stage3d();
    st.phone = ui.phone();
    st.laptop = ui.laptop();
    ui.mount(st.sP, st.phone);
    ui.mount(st.sL, st.laptop);
    st.line = ui.holoPath();
    root.append(st.sL, st.line.el, st.sP);
    st.scr = {
      splash: S.splash(),
      catalog: S.appCatalog(),
      catalog2: S.appCatalog(),
      offer: S.appOffer(),
      delivered: S.appDelivered(),
      home: S.portalHome(),
      orders: S.portalOrders(0.5),
    };
    const wq = new URLSearchParams(location.search).get("warm");
    SAIB.bg.drive((T) => ({ warm: wq !== null ? Number(wq) : T >= 3 && T < 4 ? 1 : 0 }));
    st.title = h("div", { class: "kt-title title", style: { fontSize: "92px" } });
    root.append(st.title);
    st.labP = h("div", { class: "kt-lab", style: { left: "600px", top: "560px" } }, [h("span", { class: "label", text: "app para iOS e Android" }), h("b", { text: "Seu cliente" })]);
    st.labL = h("div", { class: "kt-lab", style: { left: "90px", top: "1430px" } }, [h("span", { class: "label", text: "portal web" }), h("b", { text: "Você" })]);
    root.append(st.labP, st.labL);
    st.ring = ui.tapRing();
    st.phone.overlay.append(st.ring);
    st.cur = ui.cursor();
    st.laptop.overlay.append(st.cur.el);
    st.card = ui.glassCard({ w: 400, h: 150, radius: 26, pad: 26 });
    st.card.content.append(h("div", { class: "label", text: "Oferta para você" }), h("div", { text: "Água mineral 20 L · 10% off", style: { marginTop: "16px", fontSize: "28px", fontWeight: 650, whiteSpace: "nowrap" } }));
    st.card.style.position = "absolute";
    st.card.style.left = "560px";
    st.card.style.top = "1420px";
    root.append(st.card);
  },
  update(t, ctx) {
    const ui = SAIB.ui, S = SAIB.screens, st = ctx.state, P = ui.POSES;
    const T = ctx.start + t;
    if (location.search.includes("empty")) return void (ctx.root.style.visibility = "hidden");
    const seg = Math.max(0, Math.min(5, Math.floor(t)));
    const D = ui.drift(T);
    const showP = seg !== 3, showL = seg === 1 || seg === 3;
    st.sP.style.display = showP ? "block" : "none";
    st.sL.style.display = showL ? "block" : "none";
    st.line.el.style.display = seg === 1 ? "block" : "none";
    st.labP.style.display = st.labL.style.display = seg === 1 ? "flex" : "none";
    st.card.style.display = seg === 4 ? "block" : "none";
    SAIB.ui.chromatic(st.title, seg === 4 ? 2 : 0);
    st.title.textContent = ["", "Um app, dois lados.", "Seu cliente pede sozinho.", "Você aprova pelo portal.", "Ela aparece no app do seu cliente.", "Seu cliente acompanha cada etapa."][seg];
    const frac = t - seg;
    st.phone.glare(frac);
    st.laptop.glare(frac);
    if (seg === 0) {
      ui.pose(st.phone, ui.addPose(P.phoneFront, D));
      st.phone.setScreen(st.scr.splash);
    } else if (seg === 1) {
      ui.pose(st.phone, ui.addPose(P.phoneSplit, D));
      ui.pose(st.laptop, ui.addPose(P.laptopSplit, D));
      st.laptop.setLid(ui.LID.split);
      st.phone.setScreen(st.scr.catalog);
      st.laptop.setScreen(st.scr.home);
      ui.connectSplit(st.line, st.phone, st.laptop).draw(1).pulse(frac);
      st.line.dot(frac, 1);
    } else if (seg === 2) {
      ui.pose(st.phone, ui.addPose(P.phoneHero, D));
      st.phone.setScreen(st.scr.catalog2);
      const r = ui.offsetIn(st.scr.catalog2.refs.repeatBtn, st.phone.content);
      st.ring.at(r.cx, r.cy);
      ui.tap(st.ring, t, 2.3);
      st.scr.catalog2.refs.repeatBtn.style.transform = `scale(${ui.press(t, 2.3)})`;
    } else if (seg === 3) {
      ui.pose(st.laptop, ui.addPose(P.laptopHero, D));
      st.laptop.setLid(ui.LID.hero);
      st.laptop.setScreen(st.scr.orders.el);
      const r = ui.offsetIn(st.scr.orders.el.refs.approve, st.laptop.content);
      st.cur.at(r.x + r.w * 0.6, r.y + r.h * 0.65);
      st.cur.click(SAIB.fx.prog(t, 3.4, 3.6));
    } else if (seg === 4) {
      ui.pose(st.phone, ui.addPose(P.phoneHero, D));
      st.phone.setScreen(st.scr.offer);
      st.card.sheen(frac);
    } else {
      ui.pose(st.phone, ui.addPose(P.phoneHero, D));
      st.phone.setScreen(st.scr.delivered);
    }
    if (seg !== 2) ui.tap(st.ring, -1, 0);
    // medidas no quadro (lidas pelo kit-test.mjs)
    const R = (el) => { const r = ui.rectOf(el); return [r.left, r.top, r.right, r.bottom].map(Math.round); };
    SAIB.kitRects = {
      seg,
      phone: showP ? R(st.phone.front) : null,
      phoneScreen: showP ? R(st.phone.screen) : null,
      lid: showL ? R(st.laptop.lid.lastChild) : null,
      deck: showL ? R(st.laptop.deck) : null,
      laptopScreen: showL ? R(st.laptop.screen) : null,
      chk: showP ? [st.phone.point(0, 0), st.phone.proj(0, 0), st.phone.point(1, 1), st.phone.proj(1, 1)].map((p) => [Math.round(p.x), Math.round(p.y)]) : null,
      chkL: showL ? [st.laptop.point(0, 0), st.laptop.proj(0, 0), st.laptop.point(1, 1), st.laptop.proj(1, 1)].map((p) => [Math.round(p.x), Math.round(p.y)]) : null,
    };
  },
});
