/*
 * Camada global por cima de tudo: scanlines holográficas extremamente sutis (~3 %) e vinheta suave.
 * Estática (sem custo por quadro além da composição). Nada além disso.
 */
(function () {
  const { h } = SAIB.fx;
  SAIB.layer({
    build(stage) {
      const root = h("div", { class: "layer", id: "overlay", style: { zIndex: 40, pointerEvents: "none" } });
      root.append(
        h("div", {
          class: "layer",
          style: {
            opacity: 0.03,
            backgroundImage: "repeating-linear-gradient(180deg, rgba(255,255,255,1) 0px, rgba(255,255,255,1) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 4px)",
          },
        }),
        h("div", {
          class: "layer",
          style: { background: "radial-gradient(95% 72% at 50% 48%, rgba(18,6,58,0) 55%, rgba(18,6,58,0.42) 100%)" },
        })
      );
      stage.append(root);
    },
  });
})();
