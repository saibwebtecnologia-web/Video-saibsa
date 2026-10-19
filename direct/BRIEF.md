# Bíblia criativa: "SAIB Direct: um app, dois lados"

Reels 9:16 (1080 × 1920, ~41 s) da **SaibWeb Tecnologia** (Goiânia, 40 anos, desde 1986; software para indústrias
e distribuidoras de bebidas, água mineral e alimentos). Produto: **SAIB Direct**.
Público: dono e gerente comercial de distribuidora. O vídeo explica o produto de forma MUITO clara.

Padrão de qualidade: vídeo de lançamento de software de primeira linha (Apple, Stripe, Linear). Profissional,
limpo, calmo e preciso. **NADA infantil**: sem confete, sem bonequinhos, sem emoji na arte, sem bounce de desenho
animado, sem granulado pesado.

---

## 1. Conceito

"Um app, dois lados." O mesmo pedido percorre os dois lados do produto:
- **Lado do cliente** (mercearia, bar, padaria): o **app** (celular) onde ele faz o pedido sozinho.
- **Lado da distribuidora** ("Você"): o **portal web** (notebook), onde ela programa ofertas, aprova pedidos e
  acompanha as vendas.
- Uma **linha holográfica** liga os dois aparelhos: é por ela que o pedido e a oferta "viajam".

O contraste é com o jeito manual (pedido por WhatsApp, ligação, planilha), **nunca** com concorrentes.

## 2. O que PODE ser afirmado (confirmado pela SaibWeb). Nada além disso.

1. Portal web + aplicativo B2B para iOS e Android.
2. O cliente faz o pedido sozinho pelo app, a qualquer hora.
3. "Replica o último pedido em um toque."
4. Vouchers/ofertas que a distribuidora programa aparecem para o cliente no app.
5. De manhã, o pedido já está no painel; a distribuidora aprova pelo portal web.
6. A distribuidora acompanha as vendas em tempo real, por rota, cidade e faixa horária.
7. O cliente acompanha cada etapa do pedido: realizado, aprovado, em transporte, entregue.

**Proibido inventar** função, número de resultado, preço real, prazo, depoimento, integração, notificação push,
pagamento no app, chat etc. Dados de exemplo são fictícios e genéricos (produtos sem marca, cliente
"Mercearia do Bairro", valores de exemplo). Nada de logo de WhatsApp, Apple, Google ou qualquer marca real.
"WhatsApp" aparece só como **palavra** no gancho. Sem superlativos ("o melhor", "líder", "nº 1").
Se uma cena precisar de algo fora da lista, **não invente**: use texto neutro e registre no relatório
como `[CONFIRMAR COM PRODUTO]`.

## 3. Cores (tokens em `direct/core/styles.css`)

Fundo roxo profundo, mas **luminoso** (o cliente pediu cores claras e vivas no vídeo anterior): nada de quase preto.
As telas do app e do portal são **claras** (UI branca realista), e isso é o que mais ilumina o quadro.

| token | cor | uso |
|---|---|---|
| `--p950` | #12063a | fundo mais escuro (bordas) |
| `--p900` | #1f0b5c | fundo |
| `--p800` | #2e1080 | fundo claro, painéis escuros |
| `--p700` | #4c1d95 | roxo profundo |
| `--p600` | #5b21b6 | **roxo SaibWeb** (botões, marca) |
| `--p500` | #7c3aed | **roxo SaibWeb vivo** (destaques, CTA) |
| `--p400` | #a78bfa | apoio |
| `--p300` | #c4b5fd | texto de apoio sobre escuro |
| `--p100` | #ede9fe | fundos claros de UI |
| `--cyan` | #5ee7ff | acento holográfico |
| `--pink` | #ff7ad9 | acento holográfico |
| `--lilac` | #c9b6ff | acento holográfico |
| `--ok` | #16a34a / `--ok-soft` #dcfce7 | status "aprovado/entregue" **dentro da UI** (cor funcional de app, discreta) |

- **Holográfico** = gradiente iridescente ciano → lilás → rosa (`--holo`), usado em linhas de luz, bordas de vidro,
  reflexos e brilhos. É acento, não fundo inteiro.
- Texto principal sobre o fundo: **branco**. Palavra-chave em destaque: `.holo-text` (gradiente) ou peso maior.

## 4. Tipografia

- **Inter** variável com eixo óptico (opsz 14–32). Com `font-optical-sizing: auto` o Chrome usa o desenho
  **Inter Display** nos tamanhos grandes. Família: `"Inter"` (`--font`).
- Títulos de cena: 84–132 px, peso 700–800, `letter-spacing: -0.035em`, `line-height: 1.0`.
- Frases de apoio: 44–56 px, peso 500–600.
- **Dentro das telas** (app/portal): texto **≥ 28 px na escala em que aparece no quadro** quando a tela é o foco
  da cena. Botões e títulos de tela maiores (34–44 px).
- Rótulos técnicos pequenos (ex.: "TEMPO REAL", "ROTA 03"): Inter 600, caixa alta, `letter-spacing: 0.14em`,
  ≥ 24 px; JetBrains Mono só se fizer sentido para números de HUD.
- Números: `font-variant-numeric: tabular-nums`.

## 5. As três linguagens visuais

1. **Tipografia cinética**: palavras entram com ritmo (por palavra ou letra, stagger 35–70 ms), **máscaras**
   (texto sobe de dentro de uma linha com `overflow:hidden`), **desfoque → nítido**, **peso que muda**
   (anime `font-variation-settings: "wght"` de 300 a 800 na palavra-chave) e palavras-chave em destaque holográfico.
2. **Holográfico**: superfícies de **vidro** (fundo branco 6–10 % + borda iridescente fina + reflexo diagonal que
   passa devagar), **linhas de luz** (SVG com gradiente `--holo` e brilho), leve **scanline** e
   **aberração cromática** sutil (só em momentos de transição/glitch, 1–3 px), **partículas de luz discretas**.
3. **Isométrico**: celular, notebook e gráficos em **perspectiva 3D isométrica** (CSS 3D: `perspective`,
   `preserve-3d`, `rotateX/rotateZ`), com **câmera girando devagar** (a pose sempre deriva alguns graus, nunca congela).

## 6. Linguagem de movimento

- Curvas: entrada `ease.signature` (expo suave) 0,6–0,9 s; saída `inCubic` 0,35–0,5 s; câmera `inOutCubic`/`inOutQuart`.
  Nada linear, exceto deriva contínua lenta.
- Ação sobreposta e stagger; nada chega tudo junto.
- Toque na tela (sem mão, sem dedo): **anel de toque** (círculo que expande e some) + botão afunda 3 % e volta com mola.
- Cursor no portal: seta do sistema elegante (ícone `mouse-pointer-2`), desliza com `inOutCubic` e "clica" (escala 0,9).
- Legibilidade: cada frase importante fica **parada e legível por pelo menos 1,2 s + 0,04 s por caractere**.
- Movimento secundário sempre vivo e sutil: câmera derivando, reflexo no vidro, partículas.
- Requinte: sombra de contato suave sob os aparelhos, brilho (glow) roxo atrás deles, reflexos.
- Evite: lens flare em tudo, giros 3D gratuitos, tremedeira, cortes secos sem motivo.

## 7. Áreas seguras (Instagram)

- Quadro 1080 × 1920. **Nada importante abaixo de y = 1580** (legenda) **nem em x > 960 na metade de baixo**
  (y > 960, botões). Topo: evite texto importante acima de y = 200.
- Zona de conteúdo recomendada: **x 80–960, y 220–1560**; na metade de baixo, x 80–940.
- Decoração (glows, linhas, partículas, fundo) pode sair dessas áreas.
- `--safe` no stills mostra as guias.

## 8. Linha do tempo (`direct/manifest.js`) e emendas

Transição do motor: **fusão** (`transitionMode: "dissolve"`, meia-janela 0,25 s). Na fronteira `b`, o ato que
entra vai de opacidade 0 a 1 por cima do que sai, em [b − 0,25, b + 0,25].
**Regra de emenda:** nas fronteiras marcadas "emenda", os dois atos desenham **exatamente o mesmo quadro**
(mesmos aparelhos na mesma pose e com a mesma tela) durante a janela, então a fusão fica invisível e o vídeo
parece um plano contínuo. Use as **poses nomeadas** de `SAIB.ui.POSES` e as **telas de emenda** de
`SAIB.screens`. Nessa janela, a câmera "deriva" usando a função compartilhada `SAIB.ui.drift(T)` (tempo GLOBAL),
para os dois atos derivarem igual.

| cena | ato | tempo global | conteúdo |
|---|---|---|---|
| 1 Gancho | `S1` | 0,0–3,4 | "Seu cliente ainda pede por WhatsApp?" → a frase se desmonta e vira o app |
| 2 Um app, dois lados | `S2` | 3,4–7,4 | celular e notebook isométricos se separam, linha holográfica, "Seu cliente" / "Você" |
| 3 Cliente pede | `S3` | 7,4–14,2 | close no app: catálogo, carrinho, "Repetir último pedido", "Pedido enviado" |
| 4 Ofertas | `S4` | 14,2–19,4 | portal cria um voucher → viaja pela linha → aparece no app |
| 5 Aprovação | `S5` | 19,4–25,2 | de manhã, o pedido está no painel; "Aprovar" |
| 6 Painel | `S6` | 25,2–31,0 | gráficos holográficos isométricos: rota, cidade, faixa horária |
| 7 Cliente acompanha | `S7` | 31,0–35,4 | timeline Realizado → Aprovado → Em transporte → Entregue |
| 8 Fechamento | `S8` | 35,4–41,0 | "SAIB Direct. Seu cliente pede. Você vende." + CTA + selo 40 anos + logo |

Emendas (pose e tela no instante da fronteira):

| fronteira | tipo | estado compartilhado |
|---|---|---|
| 3,4 (S1→S2) | emenda | só o celular, `POSES.phoneFront`, tela `screens.splash` |
| 7,4 (S2→S3) | emenda | `POSES.phoneSplit` + `POSES.laptopSplit` + linha holográfica; telas `screens.appCatalog` e `screens.portalHome` |
| 14,2 (S3→S4) | emenda | só o celular, `POSES.phoneHero`, tela `screens.appSent` |
| 19,4 (S4→S5) | emenda | `POSES.phoneSplit` + `POSES.laptopSplit` + linha; telas `screens.appOffer` e `screens.portalOffers` |
| 25,2 (S5→S6) | emenda | só o notebook, `POSES.laptopHero`, tela `screens.portalApproved` |
| 31,0 (S6→S7) | livre | S6 termina com a composição dos gráficos assentada; S7 entra com o celular surgindo |
| 35,4 (S7→S8) | emenda | só o celular, `POSES.phoneHero`, tela `screens.appDelivered` |

Textos (títulos cinéticos) **não** precisam emendar: saem antes da fronteira (até b − 0,3) e os novos entram
depois (a partir de b + 0,1). Só aparelhos/telas emendam.

## 9. Roteiro detalhado (cópia oficial; pode quebrar linhas, não mude o sentido)

### S1 · Gancho (0,0–3,4)
- Quadro 0 já tem composição forte (é a miniatura): "Seu cliente" já visível/entrando.
- Tipografia cinética gigante: **"Seu cliente ainda pede por WhatsApp?"** "WhatsApp?" em destaque (peso que muda,
  ou riscado depois?). Atrás, discretos: balões de conversa genéricos cinza (sem logo, sem verde do WhatsApp),
  um "áudio 0:42", "manda 3 fardos…", ícone de telefone, uma planilha; tudo desfocado e fugaz (o jeito manual).
- A pergunta inteira fica legível ≥ 1,6 s.
- Por volta de 2,4 s **a frase se desmonta** (letras/palavras se soltam e voam/encolhem) e **viram o app**:
  os fragmentos convergem e formam o celular (`POSES.phoneFront`) com a tela `screens.splash`
  ("SAIB Direct"). Termina parado nessa pose até 3,4.

### S2 · Um app, dois lados (3,4–7,4)
- Do celular frontal, a câmera gira para o **isométrico**; o celular vai para a esquerda-cima e um notebook
  surge à direita-baixo (`POSES.phoneSplit` / `POSES.laptopSplit`). Uma **linha holográfica** se desenha
  ligando os dois.
- Título cinético: **"Um app, dois lados."**
- Rótulos ligados aos aparelhos: **"Seu cliente"** (celular, com apoio "app para iOS e Android") e **"Você"**
  (notebook, com apoio "portal web").
- A tela do celular troca de splash para `screens.appCatalog`; a do notebook liga em `screens.portalHome`.

### S3 · O cliente pede (7,4–14,2)
- Câmera mergulha no celular até `POSES.phoneHero` (celular grande, quase frontal, levemente inclinado, centralizado
  um pouco abaixo do meio); o notebook sai de quadro.
- Título por cima: **"Seu cliente pede sozinho."** e depois **"A qualquer hora."** (relógio da barra de status
  mostra um horário noturno de exemplo, ex. 22:14).
- Tela: catálogo ("Mercearia do Bairro"), produto entra no carrinho; depois destaque para o botão
  **"Repetir último pedido"** → toque → o carrinho se enche de uma vez (itens entrando em cascata) →
  texto **"O último pedido em um toque."** → botão "Enviar pedido" → **"Pedido enviado"** (`screens.appSent`).

### S4 · Ofertas (14,2–19,4)
- Do `phoneHero`, a câmera recua para o split; o notebook volta. Foco no portal: tela **"Nova oferta"**
  (`screens.portalOffers`): a distribuidora cria um voucher (ex.: "Água mineral 20 L · 10% off", dado fictício) e
  clica em "Publicar".
- O voucher se descola da tela do notebook como um **cartão de vidro holográfico**, **viaja pela linha
  holográfica** e pousa no app do cliente (`screens.appOffer`: "Oferta para você").
- Textos: **"Você programa a oferta."** → **"Ela aparece no app do seu cliente."**

### S5 · Aprovação (19,4–25,2)
- Clima "de manhã": um indicador de hora (ex.: "07:30" com ícone de nascer do sol) e uma luz levemente mais quente/clara
  no fundo (sem sair da paleta).
- Câmera vai para o notebook (`POSES.laptopHero`). Portal: **"Pedidos para aprovar"**; o pedido da Mercearia do
  Bairro (enviado à noite) está lá. Cursor clica em **"Aprovar"** → status "Aprovado" (`screens.portalApproved`).
- Textos: **"De manhã, o pedido já está no painel."** → **"Você aprova pelo portal."**

### S6 · Painel em tempo real (25,2–31,0)
- Da tela do notebook sobem, em isométrico, **gráficos holográficos** (vidro + linhas de luz): vendas **por rota**
  (barras 3D), **por cidade** (barras ou blocos) e **por faixa horária** (linha/área). Dados fictícios.
  Um selo "TEMPO REAL" com ponto pulsando. Câmera girando devagar.
- Títulos: **"Vendas em tempo real"** + **"por rota · cidade · faixa horária"**.

### S7 · O cliente acompanha (31,0–35,4)
- Celular em `POSES.phoneHero`. Tela de pedido com **timeline**: **Realizado → Aprovado → Em transporte →
  Entregue**, cada etapa acendendo em sequência (linha de progresso preenchendo, ícones `check`, `truck`, `package-check`).
- Título: **"Seu cliente acompanha cada etapa."**
- Termina em `screens.appDelivered` ("Entregue").

### S8 · Fechamento (35,4–41,0)
- O celular recua, o notebook reaparece e os dois se encontram ligados pela linha (eco do conceito), depois
  recuam/esmaecem para o fundo.
- Tipografia final: **"SAIB Direct."** (grande) → **"Seu cliente pede. Você vende."**
- Pílula/CTA: **"Agende uma demonstração gratuita · link da bio"**.
- **Selo oficial dos 40 anos** (`../assets/brand/selo-40-anos.png`) e **logo saib** (`../assets/brand/logo-saib-white.png`
  ou `logo-saib-light.png`). Composição final parada (com deriva sutil) de ~2 s até 41,0, porque o Reels repete.

## 10. Contrato técnico de um ato

Arquivo `direct/acts/<ID>.js` (ID = S1…S8). Mesmo contrato do motor do projeto:

```js
SAIB.act("S3", {
  css: `[data-act="S3"] ...`,
  build(root, ctx) { ... },          // monta o DOM uma vez
  update(t, ctx) { ... },            // t = tempo LOCAL (pode ser < 0 ou > dur na fusão). Tempo global = ctx.start + t
});
```
1. `update(t)` é **função pura de t**. Proibido: CSS transition/animation/@keyframes, requestAnimationFrame,
   setTimeout, Date, Math.random (use `SAIB.fx.rng(seed)` no build ou `SAIB.fx.hash/noise`). Sem estado acumulado.
2. Edite só os arquivos do seu ato (`direct/acts/<ID>.js`, opcionalmente `direct/acts/<ID>/`). Não mexa em
   `direct/core/*`, `src/core/*`, `manifest.js`, `index.html` nem `render/*`. Precisa de algo do kit? Faça local no
   ato e cite no relatório.
3. Assets relativos a `direct/index.html`: `../assets/brand/selo-40-anos.png`.
4. Desempenho: < ~250 ms por quadro no stills. Prefira transform/opacity. `filter: blur` só em elementos pequenos
   e médios. Sem `backdrop-filter`. Camadas 3D: mantenha poucas.
5. Português do Brasil impecável, com acentos.
6. O ato precisa cobrir a janela de fusão: entre t = −0,25 e 0 e entre dur e dur + 0,25 mantenha a composição na
   tela (nunca vazio).

## 11. Ferramentas

```bash
node render/stills.mjs --dir direct --act S3 --sheet 0.2 --only S3 --out out/direct/S3/sheet
node render/stills.mjs --dir direct --act S3 --local 1,3.5,6 --only S3 --out out/direct/S3/full
node render/stills.mjs --dir direct --act S3 --local 3 --only S3 --safe --out out/direct/S3/safe
node render/stills.mjs --dir direct --from 13.9 --to 14.5 --sheet 0.05 --out out/direct/emenda-14   # emenda (sem --only)
node render/render.mjs --dir direct --from 7.2 --to 14.4 --fps 30 --jpeg --scale 0.5 --out out/direct/prev-S3.mp4
```
Olhe os PNGs (ferramenta Read) e critique como diretor de arte. Código de saída 2 = erro na página.
