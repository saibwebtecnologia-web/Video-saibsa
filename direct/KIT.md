# Kit SAIB Direct: referência da API (direct/core/*)

Teste do kit: `node direct/kit-test.mjs` (PNGs em `out/direct/kit/`; `--ov '{"phoneSplit":{"s":0.5}}'`, `--bench 8`, `--safe`).
Exemplos bons: `out/direct/kit/k1.50.png` (split + linha), `k2.50.png` (phoneHero + catálogo), `k3.50.png` (laptopHero + pedidos).
Leia o código de `direct/core/ui.js` e `direct/core/screens.js` quando precisar de detalhe.

## Camadas globais
- Fundo: base radial violeta viva (#6d28d9 → #1f0b5c), orbes, grade isométrica de piso (alinhada às poses split), partículas.
- Overlay: scanlines 3 % + vinheta (estático).
- Controle do fundo: o motor atualiza camadas ANTES dos atos, então não atribua `SAIB.bg.warm` dentro de `update()`.
  Registre no `build()` uma função pura do tempo GLOBAL:
  `SAIB.bg.drive(T => (T > 19.2 && T < 25.5 ? { warm: SAIB.fx.tw(T, 19.4, 1.2) } : null))`
  Retorna `{warm?, energy?, grid?}` ou null; o último driver registrado que não retornar null vence.
  `warm` 0..1 = manhã (S5), `energy` 0..2 = intensidade dos orbes, `grid` 0..1 = opacidade da grade.

## CSS (styles.css)
- Fonte "InterV" (wght 100–900, opsz 14–32, optical sizing auto). `--font`.
- Tokens `--p950…--p100`, `--cyan`, `--pink`, `--lilac`, `--ok`, `--ok-soft`, `--holo`, `--ui-ink`, `--ui-muted`, `--ui-line`, `--ui-tint`.
- Classes: `.title` (104 px / 760 / −0.035em), `.subtitle` (48 px / 540), `.holo-text`, `.label` (24 px caps 0.14em), `.tnum`, `.mono`, `.glass`.
- Guias de área segura com `--safe`.

## Aparelhos e câmera (SAIB.ui)
Cada aparelho vai num `ui.stage3d()` próprio (tela cheia, perspective 3600, origem 540/960) e é montado com
`ui.mount(stage, dev)` (que põe também a sombra/brilho por baixo). Para esmaecer um aparelho, use opacidade no
**stage3d**, nunca em `dev.el` (opacity/filter/overflow em `dev.el` achatam o 3D). Chame `ui.pose(dev, P)` a cada quadro.

- `phone()` → `{el, front, shadow, screen, content, overlay, island, W:560, H:1180, SW:520, SH:1140, T:22,
  setScreen(node|[nodes]), glare(p), point(u,v), proj(u,v), projLocal(x,y,z)}`.
  `setScreen` MOVE o nó (um nó não pode estar em dois aparelhos); passe array para fazer crossfade você mesmo.
  `overlay` fica acima da tela, em px nativos da tela, nunca é limpo: anéis de toque, toasts.
  `glare(p)`: reflexo diagonal iridescente para 0<p<1 (fora disso, oculto).
- `laptop()` → `{el, lid, deck, face, shadow, lidGlow, screen, content, overlay, W:1040, D:700, LH:672, SW:1000, SH:625,
  setScreen, setLid(deg), glare(p), point(u,v), proj(u,v), projLocal(x,y,z) (base), projLid(x,y,z) (tampa)}`.
  `el` = plano da base/teclado; a tampa articula na borda de trás. `setLid`: 0 fechado, 90 em pé.
  Use `ui.LID.split` (108) e `ui.LID.hero` (103) nas emendas e faça lerp entre eles quando mudar de pose.
- `pose(dev|el, {x,y,z,rx,ry,rz,s})`: x,y = âncora no quadro (celular = centro; notebook = centro da dobradiça:
  tampa sobe acima, base desce abaixo). Ordem translate → rotateX → rotateY → rotateZ → scale3d.
- `lerpPose(a,b,p)`, `addPose(P, D)` (soma; `s` multiplica), `drift(T, amp=1)` → `{rx±1.5°, ry±2.4°, rz±0.7°, y±7px}`
  pelo tempo GLOBAL. Uso: `ui.pose(phone, ui.addPose(ui.lerpPose(A,B,p), ui.drift(ctx.start + t)))`.
- Medidas: `dev.proj(u,v)` = ponto exato no quadro da tela em frações u,v (analítico, barato; supõe stage3d na
  origem sem pais transformados). `dev.point(u,v)` = idem via marcador DOM (força layout).
  `rectOf(el)` → caixa projetada `{x,y,w,h,cx,cy,left,top,right,bottom}`.
  `offsetIn(el, ancestor)` → px nativos de um elemento de UI dentro da tela (ex.: `offsetIn(refs.approve, laptop.content)` para mirar o cursor).

### POSES (caixas no quadro, ±10 px de deriva)
| Pose | Valores | Aparelho no quadro | Tela no quadro | Notas |
|---|---|---|---|---|
| `phoneFront` | x540 y900 s0.85 frontal | 301,400 → 778,1404 | 318,417 → 761,1387 | |
| `phoneHero` | x540 y1062 rx7 ry−9 rz1.2 s1.1 | 222,422 → 855,1735 | 244,444 → 833,1711 | nativo→quadro ≈1.1×; título cabe em y230–400. Nativo y≈1012 (base da barra do carrinho) cai em ≈1556. A tab bar (nativo y>1028) fica sob a legenda do Instagram (decorativa). |
| `phoneSplit` | x366 y645 rx52 rz36 s0.47 | 82,489 → 632,828 | 96,496 → 620,820 | deitado no piso iso, topo para cima-direita |
| `laptopSplit` | x600 y1170 rx58 rz36 s0.54 + LID.split | tampa 379,746 → 918,1273; base 138,1079 → 839,1485 | 390,758 → 906,1254 | tela voltada para baixo-esquerda |
| `laptopHero` | x530 y1225 rx72 rz−4 s0.88 + LID.hero | tampa 44,618 → 983,1243; base 31,1208 → 1119,1541 | 63,635 → 965,1217 (≈902 larg.) | nativo→quadro ≈0.9×; título em y230–590 |

Layout split: título em y230–440; rótulo "Seu cliente" em x600–960 / y480–660 (cuidado: não sobrepor o celular); "Você" em x80–400 / y1400–1540.

## Linhas, toques, cursor, efeitos
- `holoPath(d?, {width=3, glow=1})` → `{el (SVG 1080×1920 em px de quadro; ponha no root do ato), setD(d), connect(a,b,bend),
  draw(p), pulse(p,{len=150,opacity}), along(p) → {x,y,angle}, dot(p,op), opacity(v), length}`. `curve(a,b,bend)`.
- `connectSplit(line, phone, laptop)`: a linha padrão das emendas (tela do celular (1.0, 0.62) → tampa (700, 0), bend −150,
  `ui.SPLIT_LINE`). **Use em 7,4 e 19,4 para os dois atos desenharem a mesma linha.**
- `tapRing({size=132, color:"124,58,237"})` → elemento com `.at(x,y)`; ponha em `phone.overlay`. `tap(ring, t, at, {dur=0.6})`.
- `press(t, at, depth=0.03)` → fator de escala (afunda 3 % e volta com mola).
- `cursor({size=44})` → `{el, at(x,y) (ponta), click(p)}`; ponha em `laptop.overlay`.
- `chromatic(el, px)` RGB split ciano/rosa (0 remove).
- `glassCard({w,h,radius=28,pad=28})` → `.glass` com `.content` e `.sheen(p)` (só sobre roxo; some sobre UI branca).
- `icon(name,{size=48,stroke=2,color,fill})`, `productArt(kind)` com kind `galao|pet|lata|garrafa`.

## App (ui.app.*, tema claro, texto 25–48 px nativo)
`statusBar(time,{dark})`, `header(title, subtitle, {avatar, showWordmark})`, `searchBar(text)`, `chips(list, i)`,
`section(title, action)`, `productRow({name, detail, price, oldPrice, qty, art, iconName, tag})` (`.setQty(n)`,
`.refs{thumb, add, stepper, qty, price}`), `button(label,{variant: primary|secondary|ghost, icon, iconRight})`,
`cartBar({items,total,cta})` (`.set(n,total)`), `tabBar("inicio"|"pedidos"|"ofertas"|"conta")`,
`badge(text, tone: brand|ok|pending|info|neutral, icon)`, `toast(text, icon)`, `nav(title,{close})`, `card(children, style)`, `wordmark()`.

## Portal (ui.portal.*, 22 px nativo, chave 26 px)
`frame(active,{counts:{pedidos:n}})` → `{el, content, side, top, nav}` (Início, Pedidos, Ofertas, Vendas, Clientes;
topo "Portal SAIB Direct" + "Distribuidora Exemplo"), `pageTitle(title, sub, right)`, `kpi(label, value)`, `kpis([[l,v]])`,
`card(title,right,rows)`, `tableRow(cols,{big,hl})`, `badge(text, pending|ok|info|neutral|brand)`,
`button(label, variant, {icon, big})`, `input(label, value, {icon, focus})`, `avatar(initials, size)`.

## Telas (SAIB.screens) — cada builder devolve um nó NOVO e idêntico, com `.refs`
Celular 520×1140; portal 1000×625. Dados fictícios em `SAIB.screens.DATA` (Mercearia do Bairro, pedido nº 4821 às 22:14;
último pedido 3× Água 20 L + 2× Refrigerante 2 L + 1× Cerveja lata = 6 itens, R$ 206,40; oferta "Água mineral 20 L · 10% off",
"Válida até sexta", R$ 17,01; etapas Realizado/Aprovado/Em transporte/Entregue).

| builder | conteúdo | refs |
|---|---|---|
| `splash()` | wordmark com "Direct" holo, "App B2B de pedidos", logo saib branco embaixo | mark, rings, logo |
| `appCatalog({qty, cart})` | sem opções = tela da emenda S2→S3 | body (translateY p/ rolar), list, rows.{agua,refri,cerveja,gas}, repeatBtn, cartSlot, cartBar |
| `appSent()` | "Pedido enviado" | check, title, badge, card, button, lines |
| `appOffer()` | catálogo com cartão "Oferta para você" no topo | offer + refs do catálogo |
| `offerCard()`, `voucherMini()` | visuais do voucher que viaja em S4 | |
| `appTracking(p)` | `{el, set(p)}`, p 0..4 (etapa k acende no fim de [k, k+1]) | |
| `appDelivered()` | = `appTracking(4).el` | |
| `portalHome()` | visão geral | |
| `portalNewOffer()` | formulário "Nova oferta" | publish, voucher, form |
| `portalOffers()` | lista de ofertas com "Publicada" | offerRow, newBtn, preview |
| `portalOrders(p)` | `{el, set(p)}`, p 0→1 vira a linha da Mercearia de "Aguardando"+"Aprovar" para "Aprovado" (contador 4→3) | approve, mainRow |
| `portalApproved()` | = `portalOrders(1).el` | |
| `portalSales()` | extra para S6: "Vendas em tempo real", KPIs, barras por rota | bars[{bar,value}], live |

## Ressalvas
- Custo: split ≈160 ms acima do quadro vazio; um aparelho ≈100–130 ms. Cada camada 3D custa 10–20 ms: use poucas.
- Não mude a perspective do stage3d (quebra `proj()`); mantenha 3600.
- Rótulos/valores de exemplo escolhidos pelo kit (genéricos): splash "App B2B de pedidos"; abas Início/Pedidos/Ofertas/Conta;
  horários 18:30 (oferta) e 15:40 (acompanhamento); números do painel (38 pedidos, R$ 12.480, 126 clientes).
