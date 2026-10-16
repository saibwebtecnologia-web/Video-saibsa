/* Ato A — placeholder (será substituído) */
SAIB.act("A", {
  build(root, ctx) {
    root.innerHTML = '<div class="display grad-silver" style="position:absolute;top:820px;width:100%;text-align:center;font-size:160px">ATO A</div>';
    ctx.state.t = root.firstChild;
  },
  update(t, ctx) {
    SAIB.fx.inOut(ctx.state.t, t, 0.1, ctx.dur - 0.5);
  },
});
