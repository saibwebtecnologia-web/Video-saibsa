/*
 * SAIB.screens — telas de emenda (BRIEF §8). Cada função devolve um nó NOVO e determinístico:
 * dois atos que constroem a mesma tela obtêm DOM idêntico (emenda invisível na fusão).
 *   celular: 520 × 1140 · notebook: 1000 × 625
 * Cada nó traz `refs` com os elementos úteis para animar (botões, linhas, carrinho...).
 *
 * TODOS os dados abaixo são FICTÍCIOS/GENÉRICOS (exemplo): cliente, produtos, preços, nº do pedido,
 * horários, oferta e números do painel. Nada de marcas reais. Nada além do BRIEF §2.
 */
(function () {
  const SAIB = (window.SAIB = window.SAIB || {});
  const { h, clamp, lerp, ease } = SAIB.fx;
  const { icon, app, portal } = SAIB.ui;

  /* ---------------------------------------------------------------- dados de exemplo (fictícios) */
  const DATA = {
    store: "Mercearia do Bairro",
    storeInitials: "MB",
    distributor: "Distribuidora Exemplo",
    orderNo: "4821",
    orderTime: "22:14", // pedido feito à noite (S3)
    approveTime: "07:30", // de manhã (S5)
    products: {
      agua: { name: "Água mineral 20 L", detail: "Galão retornável", price: "R$ 18,90", art: "galao" },
      refri: { name: "Refrigerante 2 L", detail: "Fardo c/ 6", price: "R$ 47,40", art: "pet" },
      cerveja: { name: "Cerveja lata 350 ml", detail: "Fardo c/ 12", price: "R$ 54,90", art: "lata" },
      gas: { name: "Água com gás 500 ml", detail: "Fardo c/ 12", price: "R$ 26,90", art: "garrafa" },
    },
    catalogOrder: ["agua", "refri", "cerveja", "gas"],
    // último pedido (o que "Repetir último pedido" replica): 3 + 2 + 1 = 6 itens
    lastOrder: [
      { key: "agua", qty: 3, total: "R$ 56,70" },
      { key: "refri", qty: 2, total: "R$ 94,80" },
      { key: "cerveja", qty: 1, total: "R$ 54,90" },
    ],
    items: 6,
    total: "R$ 206,40",
    // oferta de exemplo (fictícia): "Água mineral 20 L · 10% off", "Válida até sexta"
    offer: { product: "Água mineral 20 L", discount: "10% off", title: "Água mineral 20 L · 10% off", valid: "Válida até sexta", price: "R$ 17,01", oldPrice: "R$ 18,90" },
    steps: [
      { label: "Realizado", desc: "Pedido recebido", icon: "check" },
      { label: "Aprovado", desc: "Aprovado pela distribuidora", icon: "check" },
      { label: "Em transporte", desc: "A caminho da sua loja", icon: "truck" },
      { label: "Entregue", desc: "Pedido entregue", icon: "package-check" },
    ],
  };

  const abs = (style) => Object.assign({ position: "absolute" }, style);
  const root = (cls = "app") => h("div", { class: cls });

  /* ================================================================ APP */

  // tela de abertura: wordmark sobre o gradiente da marca
  function splash() {
    const el = h("div", {
      class: "app",
      style: { background: "radial-gradient(120% 70% at 50% 38%, #8b5cf6 0%, #6d28d9 38%, #4c1d95 72%, #2e1080 100%)", color: "#fff" },
    });
    el.append(app.statusBar("22:14", { dark: true }));
    // anéis de vidro concêntricos (decoração sutil)
    const rings = h("div", { style: abs({ left: "50%", top: "46%", width: 0, height: 0 }) });
    [300, 440, 600].forEach((d, i) =>
      rings.append(
        h("i", {
          style: abs({
            left: -d / 2 + "px", top: -d / 2 + "px", width: d + "px", height: d + "px", borderRadius: "50%",
            border: `1.5px solid rgba(255,255,255,${(0.16 - i * 0.04).toFixed(2)})`,
          }),
        })
      )
    );
    el.append(rings);
    const mark = h("div", { style: abs({ left: 0, right: 0, top: "46%", transform: "translateY(-50%)", textAlign: "center" }) }, [
      h("div", {
        html: 'SAIB <span class="holo-text" style="font-weight:640">Direct</span>',
        style: { fontSize: "78px", fontWeight: 780, letterSpacing: "-0.04em", lineHeight: 1, whiteSpace: "nowrap" },
      }),
      h("div", {
        text: "App B2B de pedidos",
        style: { marginTop: "20px", fontSize: "26px", fontWeight: 500, letterSpacing: "-0.01em", color: "rgba(255,255,255,0.72)" },
      }),
    ]);
    el.append(mark);
    const logo = h("img", { src: "../assets/brand/logo-saib-white.png", style: abs({ left: "50%", bottom: "70px", height: "52px", transform: "translateX(-50%)", opacity: 0.9 }) });
    el.append(logo);
    el.refs = { mark, rings, logo };
    return el;
  }

  // corpo comum de catálogo (cabeçalho + busca + [extra] + lista); opts.extra = nó entre busca e lista
  function catalogBase(o = {}) {
    const { time = "22:14", qty = {}, extra = null, chips = true, offerPrice = false } = o;
    const el = root();
    el.append(app.statusBar(time));
    el.append(app.header("Catálogo", DATA.store, { avatar: DATA.storeInitials }));
    const body = h("div", {});
    body.append(app.searchBar("Buscar produtos"));
    let chipsEl = null;
    if (chips) body.append((chipsEl = app.chips(["Todos", "Águas", "Refrigerantes", "Cervejas"], 0)));
    if (extra) body.append(extra);
    body.append(app.section("Mais pedidos", "Ver todos"));
    const list = h("div", { class: "app-list" });
    const rows = {};
    for (const k of DATA.catalogOrder) {
      const p = DATA.products[k];
      const isOffer = offerPrice && k === "agua";
      const r = app.productRow({
        name: p.name, detail: p.detail, art: p.art, qty: qty[k] || 0,
        price: isOffer ? DATA.offer.price : p.price, oldPrice: isOffer ? DATA.offer.oldPrice : null, tag: isOffer ? "−10%" : null,
      });
      rows[k] = r;
      list.append(r);
    }
    body.append(list);
    el.append(body);
    // vaga do carrinho (acima da barra de abas) — vazia nas telas de emenda
    const cartSlot = h("div", { style: abs({ left: "20px", right: "20px", bottom: "128px" }) });
    el.append(cartSlot);
    el.append(app.tabBar("inicio"));
    el.refs = { body, list, rows, cartSlot, chips: chipsEl };
    return el;
  }

  /*
   * appCatalog(o) — catálogo da Mercearia do Bairro às 22:14 (emenda S2→S3).
   * refs: body (rolar com translateY), list, rows.{agua,refri,cerveja,gas} (row.setQty(n)), repeatBtn, cartSlot
   * o.qty = {agua: 1}, o.cart = {items, total} (para variações no S3; a emenda usa o padrão vazio)
   */
  function appCatalog(o = {}) {
    const repeatBtn = app.button("Repetir último pedido", { variant: "secondary", icon: "rotate-ccw" });
    repeatBtn.style.margin = "22px 28px 0";
    const el = catalogBase({ ...o, extra: repeatBtn });
    el.refs.repeatBtn = repeatBtn;
    if (o.cart) {
      const cb = app.cartBar(o.cart);
      el.refs.cartSlot.append(cb);
      el.refs.cartBar = cb;
    }
    return el;
  }

  // cartão "Oferta para você" (claro sobre a marca). Exportado para o S4 (o cartão que viaja pode reutilizá-lo)
  function offerCard(o = {}) {
    const el = h("div", {
      style: {
        position: "relative", margin: o.margin ?? "22px 20px 0", height: "212px", borderRadius: "28px", overflow: "hidden", color: "#fff",
        background: "linear-gradient(125deg, #7c3aed 0%, #6d28d9 45%, #4c1d95 100%)",
        boxShadow: "0 16px 34px rgba(91,33,182,0.32), inset 0 1px 0 rgba(255,255,255,0.25)",
      },
    });
    // brilho iridescente e recorte de "ticket"
    el.append(
      h("i", { style: abs({ right: "-80px", top: "-110px", width: "330px", height: "330px", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,122,217,0.55), rgba(255,122,217,0))" }) }),
      h("i", { style: abs({ left: "-60px", bottom: "-140px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(94,231,255,0.35), rgba(94,231,255,0))" }) }),
      h("i", { style: abs({ inset: 0, borderRadius: "28px", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.22)" }) })
    );
    const ic = h("div", {
      style: abs({ left: "26px", top: "26px", width: "64px", height: "64px", borderRadius: "20px", display: "grid", placeItems: "center", background: "rgba(255,255,255,0.16)", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.25)" }),
    }, [icon("ticket-percent", { size: 36, stroke: 2.1 })]);
    const lab = h("div", { text: "Oferta para você", style: abs({ left: "106px", top: "30px", fontSize: "25px", fontWeight: 600, color: "rgba(255,255,255,0.85)", letterSpacing: "-0.005em" }) });
    const valid = h("div", { text: DATA.offer.valid, style: abs({ left: "106px", top: "62px", fontSize: "23px", fontWeight: 500, color: "rgba(255,255,255,0.7)" }) });
    const title = h("div", { text: DATA.offer.product, style: abs({ left: "26px", top: "118px", fontSize: "32px", fontWeight: 720, letterSpacing: "-0.02em" }) });
    const disc = h("div", { text: DATA.offer.discount, style: abs({ left: "26px", top: "158px", fontSize: "30px", fontWeight: 780, letterSpacing: "-0.02em", color: "#ffd6f3" }) });
    const go = h("div", {
      style: abs({ right: "24px", bottom: "26px", width: "60px", height: "60px", borderRadius: "50%", display: "grid", placeItems: "center", color: "#5b21b6", background: "#fff" }),
    }, [icon("arrow-right", { size: 30, stroke: 2.6 })]);
    el.append(ic, lab, valid, title, disc, go);
    el.refs = { icon: ic, label: lab, title, discount: disc, valid, go };
    return el;
  }

  // appOffer — catálogo com o cartão "Oferta para você" no topo (emenda S4→S5)
  function appOffer(o = {}) {
    const card = offerCard();
    const el = catalogBase({ time: o.time || "18:30", chips: false, extra: card, offerPrice: true });
    el.refs.offer = card;
    return el;
  }

  // appSent — confirmação "Pedido enviado" (emenda S3→S4)
  function appSent() {
    const el = root();
    el.append(app.statusBar(DATA.orderTime));
    el.append(app.nav("Pedido", { close: true }));
    // check grande com halo
    const check = h("div", { style: { margin: "34px auto 0", width: "156px", height: "156px", position: "relative" } }, [
      h("i", { style: abs({ inset: "-26px", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(124,58,237,0.16), rgba(124,58,237,0))" }) }),
      h("i", { style: abs({ inset: "-10px", borderRadius: "50%", boxShadow: "inset 0 0 0 2px rgba(124,58,237,0.14)" }) }),
      h("div", {
        style: abs({ inset: 0, borderRadius: "50%", display: "grid", placeItems: "center", color: "#fff", background: "linear-gradient(160deg, #8b5cf6, #5b21b6)", boxShadow: "0 16px 36px rgba(91,33,182,0.35), inset 0 2px 0 rgba(255,255,255,0.3)" }),
      }, [icon("check", { size: 84, stroke: 3 })]),
    ]);
    const title = h("div", { text: "Pedido enviado", style: { marginTop: "30px", textAlign: "center", fontSize: "46px", fontWeight: 760, letterSpacing: "-0.03em" } });
    const sub = h("div", { text: `Pedido nº ${DATA.orderNo} · ${DATA.orderTime}`, style: { marginTop: "10px", textAlign: "center", fontSize: "27px", fontWeight: 500, color: "var(--ui-muted)" } });
    const badge = h("div", { style: { marginTop: "18px", textAlign: "center" } }, [app.badge("Aguardando aprovação", "pending", "clock")]);
    // resumo
    const lines = DATA.lastOrder.map((it) => {
      const p = DATA.products[it.key];
      return h("div", { style: { display: "flex", alignItems: "baseline", gap: "10px", padding: "11px 0", fontSize: "25px", fontVariantNumeric: "tabular-nums" } }, [
        h("span", { text: `${it.qty}×`, style: { width: "40px", fontWeight: 700, color: "var(--p600)" } }),
        h("span", { text: p.name, style: { flex: 1, fontWeight: 540, whiteSpace: "nowrap" } }),
        h("span", { text: it.total, style: { fontWeight: 600, color: "var(--ui-ink-2)", whiteSpace: "nowrap" } }),
      ]);
    });
    const totalRow = h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: "16px", marginTop: "8px", borderTop: "1.5px solid var(--ui-line)" } }, [
      h("span", { text: `Total · ${DATA.items} itens`, style: { fontSize: "26px", fontWeight: 600, color: "var(--ui-ink-2)" } }),
      h("span", { text: DATA.total, style: { fontSize: "34px", fontWeight: 780, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" } }),
    ]);
    const card = app.card(
      [
        h("div", { style: { display: "flex", alignItems: "center", gap: "14px", paddingBottom: "12px", borderBottom: "1.5px solid var(--ui-line)" } }, [
          h("div", { class: "app-avatar", text: DATA.storeInitials, style: { width: "48px", height: "48px", fontSize: "19px" } }),
          h("span", { text: DATA.store, style: { fontSize: "27px", fontWeight: 680, letterSpacing: "-0.02em" } }),
        ]),
        ...lines,
        totalRow,
      ],
      { marginTop: "34px", padding: "20px 24px 22px" }
    );
    const btn = app.button("Acompanhar pedido", { variant: "secondary", iconRight: "chevron-right" });
    btn.style.margin = "24px 20px 0";
    el.append(check, title, sub, badge, card, btn, app.tabBar("pedidos"));
    el.refs = { check, title, sub, badge, card, button: btn, lines };
    return el;
  }

  /*
   * appTracking(p) → { el, set(p) }  acompanhamento do pedido, p 0..4 (etapas acesas).
   * Etapa k acende no fim de [k, k+1]; o trilho até ela enche no começo. set(4) = appDelivered().
   */
  function appTracking(p0 = 0) {
    const el = root();
    el.append(app.statusBar("15:40"));
    el.append(app.nav(`Pedido nº ${DATA.orderNo}`));
    // cartão de status atual
    const heroIc = h("div", {
      style: { width: "84px", height: "84px", borderRadius: "26px", display: "grid", placeItems: "center", color: "#fff", background: "linear-gradient(160deg, #8b5cf6, #5b21b6)", boxShadow: "0 10px 24px rgba(91,33,182,0.3)", flex: "none" },
    });
    const heroLabel = h("div", { text: "Status do pedido", style: { fontSize: "24px", fontWeight: 540, color: "var(--ui-muted)" } });
    const heroStatus = h("div", { style: { marginTop: "4px", fontSize: "40px", fontWeight: 760, letterSpacing: "-0.03em", whiteSpace: "nowrap" } });
    const heroSub = h("div", { text: `${DATA.store} · ${DATA.items} itens`, style: { marginTop: "4px", fontSize: "24px", fontWeight: 500, color: "var(--ui-muted)", whiteSpace: "nowrap" } });
    const hero = app.card([h("div", { style: { display: "flex", alignItems: "center", gap: "22px" } }, [heroIc, h("div", {}, [heroLabel, heroStatus, heroSub])])], { marginTop: "14px", padding: "24px" });
    // linha do tempo
    const tl = app.card([], { marginTop: "20px", padding: "30px 26px 10px" });
    const nodes = [], rails = [], labels = [], descs = [];
    const STEP = 126;
    DATA.steps.forEach((s, k) => {
      const row = h("div", { style: { display: "flex", gap: "24px", height: STEP + "px" } });
      const col = h("div", { style: { width: "60px", flex: "none", position: "relative" } });
      if (k < DATA.steps.length - 1) {
        const track = h("i", { style: abs({ left: "28px", top: "64px", width: "4px", height: STEP - 68 + "px", borderRadius: "2px", background: "#e7e4ef", overflow: "hidden" }) });
        const fill = h("i", { style: abs({ left: 0, top: 0, width: "100%", height: "100%", background: "linear-gradient(180deg, #7c3aed, #a78bfa)", transformOrigin: "50% 0" }) });
        track.append(fill);
        col.append(track);
        rails.push(fill);
      }
      const nodeOff = h("div", { style: abs({ left: 0, top: 0, width: "60px", height: "60px", borderRadius: "50%", display: "grid", placeItems: "center", color: "#b7b3c8", background: "#fff", boxShadow: "inset 0 0 0 3px #e7e4ef" }) }, [icon(s.icon, { size: 30, stroke: 2.4 })]);
      const nodeOn = h("div", { style: abs({ left: 0, top: 0, width: "60px", height: "60px", borderRadius: "50%", display: "grid", placeItems: "center", color: "#fff", background: "linear-gradient(160deg, #8b5cf6, #5b21b6)", boxShadow: "0 8px 18px rgba(91,33,182,0.3)" }) }, [icon(s.icon, { size: 30, stroke: 2.6 })]);
      col.append(nodeOff, nodeOn);
      const lb = h("div", { text: s.label, style: { fontSize: "31px", fontWeight: 680, letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: "4px" } });
      const ds = h("div", { text: s.desc, style: { marginTop: "6px", fontSize: "25px", fontWeight: 480, color: "var(--ui-muted)" } });
      row.append(col, h("div", {}, [lb, ds]));
      tl.append(row);
      nodes.push(nodeOn);
      labels.push(lb);
      descs.push(ds);
    });
    const sum = app.card([
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline" } }, [
        h("span", { text: `Total · ${DATA.items} itens`, style: { fontSize: "26px", fontWeight: 600, color: "var(--ui-ink-2)" } }),
        h("span", { text: DATA.total, style: { fontSize: "32px", fontWeight: 760, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" } }),
      ]),
    ], { marginTop: "20px", padding: "24px 26px" });
    el.append(hero, tl, sum, app.tabBar("pedidos"));
    const heroIcons = DATA.steps.map((s) => icon(s.icon, { size: 44, stroke: 2.4 }));
    let lastIdx = -2;
    function set(p) {
      p = clamp(p, 0, 4);
      let cur = 0;
      DATA.steps.forEach((s, k) => {
        const u = clamp(p - k);
        const on = clamp((u - 0.6) / 0.4);
        const e = ease.outCubic(on);
        nodes[k].style.opacity = e.toFixed(4);
        nodes[k].style.transform = `scale(${lerp(0.6, 1, ease.outBack(on, 2.2)).toFixed(4)})`;
        labels[k].style.color = on > 0.5 ? "var(--ui-ink)" : "#a9a5bb";
        descs[k].style.color = on > 0.5 ? "var(--ui-muted)" : "#c3c0d1";
        if (k >= 1) rails[k - 1].style.transform = `scaleY(${clamp(u / 0.7).toFixed(4)})`;
        if (on >= 0.5) cur = k;
      });
      if (cur !== lastIdx) {
        lastIdx = cur;
        heroStatus.replaceChildren(document.createTextNode(DATA.steps[cur].label));
        heroIc.replaceChildren(heroIcons[cur]);
        heroIc.style.background = cur === 3 ? "linear-gradient(160deg, #22c55e, #15803d)" : "linear-gradient(160deg, #8b5cf6, #5b21b6)";
        heroIc.style.boxShadow = cur === 3 ? "0 10px 24px rgba(21,128,61,0.3)" : "0 10px 24px rgba(91,33,182,0.3)";
        heroStatus.style.color = cur === 3 ? "#15803d" : "var(--ui-ink)";
      }
    }
    set(p0);
    el.refs = { hero, heroStatus, timeline: tl, nodes, rails, labels };
    return { el, set };
  }
  const appDelivered = () => appTracking(4).el;

  /* ================================================================ PORTAL */

  // portalHome — visão geral (emenda S2→S3)
  function portalHome() {
    const f = portal.frame("inicio", { counts: { pedidos: 3 } });
    f.content.append(portal.pageTitle("Visão geral", "Hoje"));
    f.content.append(portal.kpis([["Pedidos hoje", "38"], ["Vendas hoje", "R$ 12.480"], ["Clientes ativos", "126"]]));
    const rows = [
      ["Padaria Pão Quente", "Rota 02", "R$ 312,00", ["Aprovado", "ok"]],
      ["Bar da Esquina", "Rota 01", "R$ 188,50", ["Em transporte", "info"]],
      ["Empório Vila Nova", "Rota 03", "R$ 527,90", ["Aprovado", "ok"]],
      ["Mercadinho São José", "Rota 02", "R$ 96,40", ["Entregue", "neutral"]],
    ].map(([c, r, v, [b, t]]) =>
      portal.tableRow([{ text: c, grow: true, cls: "strong" }, { text: r, w: 100, cls: "muted" }, { text: v, w: 130, align: "right" }, { node: portal.badge(b, t), w: 170, align: "right" }])
    );
    f.content.append(portal.card("Pedidos recentes", h("span", { text: "Ver todos", style: { fontSize: "20px", fontWeight: 600, color: "var(--p500)" } }), rows));
    f.el.refs = { frame: f, rows };
    return f.el;
  }

  // voucher do portal (pré-visualização) — mesmo visual do cartão do app em escala menor
  function voucherMini() {
    const el = h("div", {
      style: {
        position: "relative", width: "300px", height: "170px", borderRadius: "20px", overflow: "hidden", color: "#fff", padding: "20px 22px",
        background: "linear-gradient(125deg, #7c3aed 0%, #6d28d9 45%, #4c1d95 100%)", boxShadow: "0 12px 26px rgba(91,33,182,0.3), inset 0 0 0 1.5px rgba(255,255,255,0.2)",
      },
    }, [
      h("i", { style: abs({ right: "-70px", top: "-90px", width: "240px", height: "240px", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,122,217,0.5), rgba(255,122,217,0))" }) }),
      h("div", { style: { display: "flex", alignItems: "center", gap: "10px", fontSize: "19px", fontWeight: 600, color: "rgba(255,255,255,0.85)" } }, [icon("ticket-percent", { size: 26, stroke: 2.1 }), h("span", { text: "Oferta para você" })]),
      h("div", { text: DATA.offer.product, style: { marginTop: "22px", fontSize: "25px", fontWeight: 720, letterSpacing: "-0.02em" } }),
      h("div", { style: { marginTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "baseline" } }, [
        h("span", { text: DATA.offer.discount, style: { fontSize: "24px", fontWeight: 780, color: "#ffd6f3" } }),
        h("span", { text: DATA.offer.valid, style: { fontSize: "17px", fontWeight: 500, color: "rgba(255,255,255,0.72)" } }),
      ]),
    ]);
    return el;
  }

  // portalNewOffer — formulário "Nova oferta" (S4 cria o voucher e clica em "Publicar"). refs.publish, refs.voucher
  function portalNewOffer() {
    const f = portal.frame("ofertas", { counts: { pedidos: 3 } });
    f.content.append(portal.pageTitle("Nova oferta", "Aparece no app dos seus clientes"));
    const form = h("div", { style: { display: "flex", flexDirection: "column", gap: "16px", width: "380px" } }, [
      portal.input("Produto", DATA.offer.product, { icon: "package" }),
      h("div", { style: { display: "flex", gap: "14px" } }, [
        h("div", { style: { flex: 1 } }, [portal.input("Desconto", "10%", { icon: "percent" })]),
        h("div", { style: { flex: 1.3 } }, [portal.input("Validade", "Até sexta", { icon: "calendar" })]),
      ]),
    ]);
    const voucher = voucherMini();
    const prevLabel = h("div", { text: "Prévia no app", style: { fontSize: "20px", fontWeight: 600, color: "var(--ui-ink-2)", marginBottom: "8px" } });
    const right = h("div", { style: { display: "flex", flexDirection: "column" } }, [prevLabel, voucher]);
    const publish = portal.button("Publicar", "primary", { big: true, icon: "send" });
    const cancel = portal.button("Cancelar", "secondary", { big: true });
    const actions = h("div", { style: { display: "flex", gap: "14px", marginTop: "26px" } }, [publish, cancel]);
    const panel = h("div", { class: "pt-card", style: { padding: "22px 24px 24px" } }, [h("div", { style: { display: "flex", gap: "28px", alignItems: "flex-start" } }, [form, right]), actions]);
    f.content.append(panel);
    f.content.append(h("div", { style: { height: "18px" } }));
    f.content.append(portal.card("Ofertas anteriores", h("span", { text: "2 encerradas", style: { fontSize: "20px", fontWeight: 560, color: "var(--ui-muted)" } }), olderOfferRows()));
    f.el.refs = { frame: f, publish, cancel, voucher, form };
    return f.el;
  }

  const ticketIc = (c) =>
    h("span", { style: { display: "grid", placeItems: "center", width: "44px", height: "44px", borderRadius: "12px", color: c, background: c === "#7c3aed" ? "#efe9ff" : "#f1f0f5" } }, [icon("ticket-percent", { size: 24, stroke: 2 })]);
  // ofertas antigas (fictícias), encerradas
  const olderOfferRows = () =>
    [
      ["Refrigerante 2 L · fardo c/ 6 · 5% off", "Encerrada"],
      ["Cerveja lata 350 ml · fardo c/ 12 · 8% off", "Encerrada"],
    ].map(([t, b]) => portal.tableRow([{ node: ticketIc("#9a96ad") }, { text: t, grow: true, cls: "muted" }, { node: portal.badge(b, "neutral"), w: 150, align: "right" }]));

  // portalOffers — lista de ofertas após publicar (emenda S4→S5): voucher "Publicada"
  function portalOffers() {
    const f = portal.frame("ofertas", { counts: { pedidos: 3 } });
    const newBtn = portal.button("Nova oferta", "primary", { icon: "plus" });
    f.content.append(portal.pageTitle("Ofertas", "Programadas para o app dos clientes", newBtn));
    const main = portal.tableRow(
      [
        { node: ticketIc("#7c3aed") },
        { node: h("span", {}, [h("div", { text: DATA.offer.title, style: { fontWeight: 680 } }), h("div", { text: DATA.offer.valid, style: { fontSize: "21px", color: "var(--ui-muted)", marginTop: "3px" } })]), grow: true },
        { node: portal.badge("Publicada", "ok"), w: 150, align: "right" },
      ],
      { big: true, hl: true }
    );
    f.content.append(portal.card("Ofertas", h("span", { text: "3 ofertas", style: { fontSize: "20px", fontWeight: 560, color: "var(--ui-muted)" } }), [main, ...olderOfferRows()]));
    // prévia: como o cliente vê no app
    const prev = h("div", { class: "pt-card", style: { marginTop: "14px", padding: "12px 20px", display: "flex", alignItems: "center", gap: "22px" } }, [
      h("div", { style: { transform: "scale(0.8)", transformOrigin: "0 50%", width: "240px", height: "136px" } }, [voucherMini()]),
      h("div", {}, [
        h("div", { text: "Prévia no app", style: { fontSize: "22px", fontWeight: 680 } }),
        h("div", { text: "Seus clientes veem a oferta no app.", style: { marginTop: "6px", fontSize: "21px", color: "var(--ui-muted)" } }),
      ]),
    ]);
    f.content.append(prev);
    f.el.refs = { frame: f, offerRow: main, newBtn, preview: prev };
    return f.el;
  }

  /*
   * portalOrders(p) → { el, set(p) }  "Pedidos para aprovar" (S5).
   * p 0 → linha da Mercearia do Bairro "Aguardando" + botão "Aprovar"; p 1 → "Aprovado" (= portalApproved()).
   * refs.approve = botão (alvo do cursor: SAIB.ui.offsetIn(refs.approve, el) dá a posição nativa na tela).
   */
  function portalOrders(p0 = 0) {
    const f = portal.frame("pedidos", { counts: { pedidos: 4 } });
    const countSub = h("p", { text: "4 aguardando aprovação" });
    const title = h("div", { class: "pt-h1" }, [h("div", {}, [h("h2", { text: "Pedidos para aprovar" }), countSub])]);
    f.content.append(title);
    // linha em destaque (texto-chave ≥ 26 px)
    const approve = portal.button("Aprovar", "primary", { big: true, icon: "check" });
    const waitBadge = portal.badge("Aguardando", "pending");
    const okBadge = h("span", { class: "pt-badge tone-ok", style: { height: "48px", fontSize: "26px", padding: "0 20px", gap: "10px" } }, [h("span", { text: "Aprovado" })]);
    okBadge.classList.add("no-dot");
    const okIc = icon("check", { size: 26, stroke: 3 });
    okBadge.prepend(okIc);
    const actionCell = h("span", { style: { position: "relative", display: "block", width: "300px", height: "56px" } });
    const waitWrap = h("span", { style: abs({ right: 0, top: 0, height: "56px", display: "flex", alignItems: "center", gap: "12px" }) }, [waitBadge, approve]);
    const okWrap = h("span", { style: abs({ right: 0, top: 0, height: "56px", display: "flex", alignItems: "center" }) }, [okBadge]);
    actionCell.append(waitWrap, okWrap);
    const flash = h("i", { style: abs({ inset: 0, background: "linear-gradient(90deg, rgba(22,163,74,0.10), rgba(22,163,74,0.03))", opacity: 0 }) });
    const main = portal.tableRow(
      [
        { node: portal.avatar(DATA.storeInitials, 52) },
        {
          node: h("span", {}, [
            h("div", { text: DATA.store, style: { fontWeight: 700, fontSize: "26px", letterSpacing: "-0.02em" } }),
            h("div", { style: { fontSize: "21px", color: "var(--ui-muted)", marginTop: "5px" } }, [
              h("span", { text: `Ontem, ${DATA.orderTime} · ` }),
              h("b", { text: DATA.total, style: { fontWeight: 650, color: "var(--ui-ink-2)" } }),
            ]),
          ]),
          grow: true,
        },
        { node: actionCell },
      ],
      { big: true, hl: true }
    );
    main.style.minHeight = "104px";
    main.prepend(flash);
    const others = [
      ["Padaria Pão Quente", "Hoje, 06:48", "R$ 312,00"],
      ["Bar da Esquina", "Hoje, 06:55", "R$ 188,50"],
      ["Empório Vila Nova", "Hoje, 07:05", "R$ 527,90"],
    ].map(([c, t, v]) =>
      portal.tableRow([{ node: portal.avatar(c.split(" ").filter((w) => w.length > 2).map((w) => w[0]).join("").slice(0, 2), 40) }, { text: c, grow: true, cls: "strong" }, { text: t, w: 124, cls: "muted" }, { text: v, w: 112, align: "right" }, { node: portal.badge("Aguardando", "pending"), w: 150, align: "right" }])
    );
    const foot = h("div", { class: "pt-row", style: { minHeight: "50px", justifyContent: "center", fontSize: "20px", color: "var(--ui-muted)", background: "#fbfaff" } }, [h("span", { text: "Mostrando 4 de 4 pedidos" })]);
    f.content.append(portal.card("Recebidos desde ontem", h("span", { text: "Mais antigos primeiro", style: { fontSize: "20px", fontWeight: 560, color: "var(--ui-muted)" } }), [main, ...others, foot]));
    const navCount = f.nav.pedidos.count;
    let lastHalf = null;
    function set(p) {
      p = clamp(p);
      // 0–0,45: botão some (escala/opacidade); 0,35–0,8: selo "Aprovado" entra com mola suave; brilho verde na linha
      const out = ease.inCubic(clamp(p / 0.45));
      waitWrap.style.opacity = (1 - out).toFixed(4);
      waitWrap.style.transform = `scale(${lerp(1, 0.92, out).toFixed(4)})`;
      const inn = clamp((p - 0.35) / 0.45);
      okWrap.style.opacity = ease.outCubic(inn).toFixed(4);
      okWrap.style.transform = `scale(${lerp(0.85, 1, ease.outBack(inn, 1.6)).toFixed(4)})`;
      flash.style.opacity = ease.outCubic(clamp((p - 0.35) / 0.5)).toFixed(4);
      const half = p >= 0.5;
      if (half !== lastHalf) {
        lastHalf = half;
        countSub.textContent = half ? "3 aguardando aprovação" : "4 aguardando aprovação";
        if (navCount) navCount.textContent = half ? "3" : "4";
      }
    }
    set(p0);
    f.el.refs = { frame: f, approve, mainRow: main, okBadge, waitBadge };
    return { el: f.el, set };
  }
  const portalApproved = () => portalOrders(1).el;

  /*
   * portalSales() — "Vendas" em tempo real (apoio ao S6; não é tela de emenda). Números FICTÍCIOS.
   * refs.bars = [{bar, value}] por rota (anime a altura com transform scaleY), refs.live = selo "TEMPO REAL"
   */
  function portalSales() {
    const f = portal.frame("vendas", { counts: { pedidos: 3 } });
    const live = h("span", { class: "pt-badge tone-ok", text: "TEMPO REAL", style: { letterSpacing: "0.1em", fontSize: "17px" } });
    f.content.append(portal.pageTitle("Vendas em tempo real", "Hoje · por rota, cidade e faixa horária", live));
    f.content.append(portal.kpis([["Vendas hoje", "R$ 12.480"], ["Pedidos", "38"], ["Clientes ativos", "126"]]));
    const data = [["Rota 01", 0.62, "R$ 3.120"], ["Rota 02", 0.88, "R$ 4.410"], ["Rota 03", 0.47, "R$ 2.350"], ["Rota 04", 0.52, "R$ 2.600"]];
    const bars = [];
    const chart = h("div", { style: { display: "flex", alignItems: "flex-end", gap: "26px", height: "200px", padding: "14px 24px 0" } });
    data.forEach(([lb, v, val]) => {
      const bar = h("div", { style: { width: "100%", height: Math.round(v * 150) + "px", borderRadius: "10px 10px 4px 4px", background: "linear-gradient(180deg, #8b5cf6, #5b21b6)", transformOrigin: "50% 100%" } });
      const value = h("div", { text: val, style: { fontSize: "19px", fontWeight: 650, marginBottom: "6px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" } });
      chart.append(h("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center" } }, [value, bar, h("div", { text: lb, style: { marginTop: "8px", fontSize: "19px", color: "var(--ui-muted)", fontWeight: 560 } })]));
      bars.push({ bar, value });
    });
    f.content.append(portal.card("Vendas por rota", h("span", { text: "Atualizado agora", style: { fontSize: "19px", color: "var(--ui-muted)" } }), [chart]));
    f.el.refs = { frame: f, bars, live };
    return f.el;
  }

  SAIB.screens = {
    portalSales,
    DATA, splash, appCatalog, appOffer, offerCard, appSent, appTracking, appDelivered,
    portalHome, portalNewOffer, portalOffers, portalOrders, portalApproved, voucherMini,
  };
})();
