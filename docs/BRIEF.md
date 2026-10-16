# Bíblia criativa: "Raio-X do distribuidor #1 · Positivação"

Reels 9:16 (1080 × 1920, 60 fps, 41,6 s) da **SAIB Web Tecnologia** (SaibWeb, 40 anos, desde 1986).
Pilar: *Gestão que dá lucro · SAIB Vendas + BI*. Público: gerente comercial / dono de **distribuidora de bebidas**.

Objetivo de qualidade: motion graphics de nível de estúdio. Quem assistir deve achar que foi feito em After Effects
por um motion designer sênior. Elegante, com ritmo, legível e coerente do primeiro ao último quadro.

---

## 1. Conceito visual: "Raio-X"

O vídeo é um **exame de raio-X da carteira de clientes**. O motivo visual recorrente é o **scanner**: linhas de luz que
varrem e revelam, leituras de HUD (rótulos monoespaçados pequenos, marcas de régua, cantos de mira), dados que
"acendem" quando o scan passa.

- **Comprou** = acende em **neon violeta** (`--neon` #B46CFF), com brilho.
- **Não comprou** = vira "fantasma": cinza escuro (`--dim` #3A2F4C) e contorno fino; quando vira tarefa ou alerta, ganha **âmbar** (`--amber` #FFB547).
- Âmbar é o único acento quente. Use com parcimônia: alerta, "não comprou", lista de trabalho, selo "Exemplo".
- O resto é roxo profundo (fundo), violeta e prata/branco. O selo dos 40 anos é prata escovada com roxo neon,
  e o vídeo inteiro conversa com essa estética: prata + neon violeta sobre roxo quase preto.

## 2. Tokens (já em `src/core/styles.css`)

| token | cor | uso |
|---|---|---|
| `--brand` | #620989 | roxo oficial do logo |
| `--violet` | #8B2BD9 | preenchimentos, gradientes |
| `--neon` | #B46CFF | dado positivo / destaque luminoso |
| `--lilac` | #DCC2FF | textos de apoio, eyebrows |
| `--silver-1/2` | #F3F2F8 / #C8C6D4 | títulos (gradiente prata `.grad-silver`) |
| `--grey` | #9D9B9C | cinza oficial do logo |
| `--muted` | #7A7090 | legendas secundárias |
| `--dim` | #3A2F4C | inativo |
| `--amber` | #FFB547 | alerta (pouco!) |

Classes prontas: `.display` (Exo 2 800), `.eyebrow` (mono, caixa alta, espaçado), `.tnum`, `.grad-silver`, `.grad-neon`.

**Tipografia**
- Display/títulos/números grandes: **Exo 2** (300–900, itálico 700–900). Números grandes em 800–900.
- Texto corrido/rótulos: **Inter** (300–900).
- HUD/eyebrows/leituras técnicas: **JetBrains Mono** (400/600), caixa alta, `letter-spacing` 0.2em.
- Tamanhos mínimos (o vídeo é visto no celular): corpo ≥ 44 px, rótulo ≥ 30 px, HUD ≥ 22 px (só decorativo).
  Título de cena 84–120 px. Número herói 220–380 px.

## 3. Linguagem de movimento (coerência entre atos)

- **Entrada padrão:** sobe ~70 px, desfoque 14→0, opacidade 0→1, curva `ease.signature` (expo suave), 0,7–0,8 s.
  Use `SAIB.fx.inOut/enter`. Texto entra **por palavra ou por letra** (`SAIB.fx.split`) com stagger de 30–60 ms.
- **Saída padrão:** sobe ~40 px com desfoque, `inCubic`, 0,45 s. Entre sub-cenas de um mesmo ato, prefira
  **transformar** elementos (o mesmo objeto muda de papel: chip vira número, ícone vira linha de lista) a cortar.
- **Nada linear.** Tudo tem curva, com antecipação e assentamento (mola `SAIB.fx.spring` para "pops").
- **Ação sobreposta:** elementos não chegam todos juntos; stagger e camadas com velocidades diferentes (parallax).
- **Movimento secundário:** sempre algo vivo e sutil (drift lento, brilho que pulsa, partículas, HUD com números
  correndo), mas sem distrair do texto principal.
- **Ritmo um pouco mais calmo** (pedido do cliente): cada frase precisa ficar **totalmente legível parada por
  pelo menos 1,2 s + ~0,05 s por caractere** antes de sair. Leitura confortável vem antes de "mais efeitos".
- **Contraste:** texto principal sempre branco/prata sobre fundo escuro, nunca texto pequeno em violeta escuro.
- Requinte: luz (glow em `box-shadow`/`text-shadow`), profundidade (escala/blur para planos de fundo), vidro
  (`--glass` com borda `--hairline`), linhas finas desenhando (SVG `SAIB.fx.drawable`), números contando com
  `tabular-nums` e `SAIB.fx.fmt`.
- Evite: clichês baratos (lens flare em tudo, rotação 3D gratuita, bounce exagerado), excesso de elementos,
  texto que treme, cortes secos sem motivo.

## 4. Layout e áreas seguras

- Quadro 1080 × 1920. A UI do Instagram cobre o topo (~0–220 px), a base (~1500–1920 px: legenda e botões) e a
  lateral direita inferior (botões ~ x>960, y>1100).
- **Conteúdo importante:** x 80–960 e y **360–1480** (o topo 230–320 já tem o cromo da série).
- Elementos decorativos (glows, linhas, partículas) podem sair dessas áreas.
- Centro óptico das composições: y ≈ 820–960.
- `?safe=1` (ou `--safe` no stills) mostra a área segura.

## 5. Já existe no motor (não recrie)

- Fundo global animado (orbes, grade de pontos, vinheta) atrás de tudo. O ato **não precisa de fundo**
  (fundo transparente). Pode pôr glows locais.
- Cromo do topo (A–D): pílula "RAIO-X DO DISTRIBUIDOR #1", 5 segmentos de progresso e mini logo saib branco
  no canto superior direito (y 236–310). Some sozinho antes do ato E.
- **Transição entre atos**: o motor faz um **scan de raio-X**, uma linha de luz que desce a tela em
  [fronteira − 0,45 s, fronteira + 0,45 s]. Acima da linha já aparece o ato novo, abaixo ainda o antigo. Portanto:
  - o ato **entra** com t local de **−0,45** (já parcialmente revelado). Comece as animações de entrada por
    volta de t ≈ −0,3…0,1, para o scan revelar coisas já em movimento. Nunca deixe o ato vazio nesse trecho
    (exceto o ato A, que começa em t=0: **o quadro 0 já precisa ter algo bonito na tela**, porque é a miniatura/autoplay).
  - o ato **sai** até t = dur + 0,45: **mantenha a composição final na tela** (com drift sutil) até lá.
    Não esvazie o ato antes do scan passar.
- Granulação de filme e motion blur são aplicados no render final (ffmpeg). Não implemente.

## 6. Contrato técnico de um ato

Arquivo: `src/acts/<ID>.js`. Assets próprios opcionais em `src/acts/<ID>/` (SVGs etc.).

```js
SAIB.act("B", {
  css: `...`,                 // CSS do ato (opcional). Prefixe seletores com [data-act="B"]
  build(root, ctx) {          // monta o DOM uma vez. root = div 1080x1920 transparente
    ctx.state.title = ...;    // guarde referências em ctx.state
  },
  update(t, ctx) {            // chamado a CADA quadro, t = segundos locais (pode ser negativo/além de dur)
    const { inOut, tw, ease, set, lerp, prog } = SAIB.fx;
    ...
  },
});
```

Regras obrigatórias:
1. `update(t)` é **função pura de t**: o mesmo t precisa dar sempre o mesmo quadro, em qualquer ordem
   (o renderizador pula e paraleliza). Proibido: CSS `transition`/`animation`/`@keyframes`, `requestAnimationFrame`,
   `setTimeout`, `Date`, `Math.random` (use `SAIB.fx.rng(seed)` no build ou `SAIB.fx.hash`). Estado
   acumulado entre quadros também é proibido.
2. Edite **somente** `src/acts/<SEU_ID>.js` (e `src/acts/<SEU_ID>/`). Não mexa em `src/core/*`, `manifest.js`,
   `index.html`, `render/*` nem em outros atos. Se precisar de algo do motor, faça localmente no seu ato e cite no
   relatório.
3. Caminhos de assets são relativos a `src/index.html`: `../assets/brand/logo-saib-light.png`.
4. Desempenho: o quadro inteiro deve renderizar em < ~250 ms (o stills imprime a média). Prefira
   transform/opacity. Use `filter: blur` em elementos pequenos e médios, e evite blur em camadas de tela cheia
   e `backdrop-filter`. SVG simples é ótimo.
5. Texto em **português do Brasil impecável**, com acentos (é "Positivação", "período", "mês", "não").
   Copie a cópia exatamente como no roteiro. Dados fictícios de exemplo podem aparecer (nomes de PDVs genéricos).

## 7. Ferramentas de verificação (use muito)

```bash
node render/stills.mjs --act B --sheet 0.2 --only B          # folha de contato do ato inteiro (vê o ritmo)
node render/stills.mjs --act B --local 0.5,2,4.4 --only B    # quadros em resolução cheia (vê tipografia)
node render/stills.mjs --act B --local 3 --only B --safe     # com guias de área segura
node render/stills.mjs --from 9.2 --to 10.4 --sheet 0.1      # transição entre atos (sem --only)
node render/render.mjs --from 9.3 --to 20.5 --fps 30 --jpeg --out out/preview-B.mp4   # prévia em vídeo
```
Abra os PNGs com a ferramenta Read para ver. A folha de contato mostra o movimento ao longo do tempo. Olhe de
verdade e critique como diretor de arte, sem presumir que ficou bom. O comando sai com código 2 e imprime
"ERROS NA PÁGINA" se o seu ato lançar exceção.

---

## 8. Roteiro por ato (tempos globais / locais)

Cópia oficial (não altere o sentido, pode quebrar linhas):

### ATO A, "O número" · 0,0–9,8 s (dur 9,8)
**A1 (local 0–4,8): gancho.**
- Quadro 0 já com composição viva (ex.: primeira palavra entrando, ícones surgindo, HUD de scanner ligando).
- Texto: **"De cada 10 clientes,"** → aparecem **10 ícones de cliente** (PDVs: fachadas de bar/mercado
  estilizadas em linha fina, ou avatares; escolha o que ficar mais elegante) em grade 5×2 com entrada em mola
  escalonada → **"quantos compraram de você este mês?"** ("este mês" em destaque neon).
- A pergunta completa precisa estar legível por pelo menos ~2 s.

**A2 (local 4,8–9,8): o raio-X da carteira.**
- Um scanner local varre os 10 ícones: **7 acendem** (neon, "comprou") e **3 viram fantasma** (âmbar fino/dim).
- Leitura grande: **"7 de 10"** (ou contador) e rótulo "compraram este mês".
- Frase: **"Faturamento bom pode esconder uma carteira encolhendo."** Pode vir com um mini gráfico: linha de
  faturamento subindo (prata) e clientes comprando caindo (âmbar). Opcional, se couber com elegância.
- Mantém a composição final até o scan do motor passar (t ≈ 10,25).

### ATO B, "A conta" · 9,8–20,0 s (dur 10,2)
**B1 (local 0–4,5): a fórmula.**
- Eyebrow "A CONTA" (mono). Título **"Positivação"** (grande, prata).
- Fórmula montada peça por peça: **Positivação = clientes que compraram no período ÷ clientes ativos da carteira**.
  Sugestão: fração empilhada; numerador "clientes que **compraram** no período" (neon), barra da fração que
  se desenha, denominador "clientes **ativos** da carteira" (prata). O "÷" pode ser a própria barra.

**B2 (local 4,5–10,2): o exemplo.**
- Selo **"EXEMPLO"** no canto (carimbo/etiqueta âmbar ou prata, entra com um "stamp" elegante).
- Os termos da fórmula **viram números** (continuidade): denominador conta 0→**600** "clientes ativos";
  numerador conta 0→**420** "compraram no mês".
- **420 ÷ 600 = 70%**: a conta resolve num **anel/gauge** que preenche até 70% (neon), com os 30% restantes dim.
  "**70%**" gigante no centro, rótulo "de positivação". Segure o 70% ≥ 2 s.

### ATO C, "Abra o número" · 20,0–29,4 s (dur 9,4)
**C1 (local 0–4,7): por vendedor.**
- Eyebrow "ABRA O NÚMERO". Título **"Por vendedor"**.
- Dois cartões de vidro: **Vendedor A · 85%** (barra neon) e **Vendedor B · 55%** (barra âmbar), barras crescendo,
  percentuais contando. Selo pequeno "Exemplo".
- Fecho: **"A conversa com cada um muda."**

**C2 (local 4,7–9,4): por rota.**
- Título **"Por rota"**. Mapa estilizado (linhas finas, sem mapa real): 3–4 rotas desenhando-se (polylines com
  paradas), com rótulos de positivação (ex.: Rota 1 · 82%, Rota 2 · 74%, Rota 3 · 48%). A rota fraca pulsa âmbar.
- Frase: **"Rota que positiva pouco pode ser:"** + 3 motivos que surgem como callouts:
  **"dia de visita errado"**, **"mix curto"**, **"cliente que trocou de fornecedor"**.

### ATO D, "Mãos à obra" · 29,4–36,2 s (dur 6,8)
**D1 (local 0–3,6): a lista.**
- **"Quem não comprou vira lista."**
- Contador grande **180** "clientes para ligar, visitar e entender o motivo", com uma lista estilizada de app
  rolando (linhas com nome fictício de PDV, ícones de telefone/pin) e prazo **"antes do fim do mês"**
  (ex.: mini calendário/barra até o dia 30).

**D2 (local 3,6–6,8): checklist "Para salvar".**
- Eyebrow/título **"Para salvar"** + ícone de salvar (marcador).
- 5 passos que se marcam em sequência:
  1. Conte os ativos. 2. Conte quem comprou. 3. Divida. 4. Abra por vendedor e por rota.
  5. Trabalhe a lista de quem não comprou.
- Todos os 5 visíveis e marcados por pelo menos ~1,2 s antes do scan.

### ATO E, "Vem aí" · 36,2–41,6 s (dur 5,4, o último quadro é o fim do vídeo)
**E1 (local 0–2,6): teaser do BI.**
- Um dashboard de BI "fantasma" se monta em linhas finas (KPIs, gráfico, mapa), meio velado/desfocado, sem
  revelar tudo. Texto: **"Vem aí o novo BI da SaibWeb."** O nome do BI aparece **censurado/embaralhado**
  (glitch de letras que não resolve, ou tarja), porque é surpresa. Depois **"Fique de olho."**
  O símbolo da saib lembra um olho: use isso ("fique de olho" com o símbolo).

**E2 (local 2,6–5,4): CTA e assinatura.**
- Logo saib (`logo-saib-light.png` ou `logo-saib-white.png`) em destaque, com o selo **40 anos**
  (`selo-40-anos.png`) ao lado ou abaixo, com um brilho de luz passando.
- **"Agende uma demonstração gratuita"** + botão/pílula **"link na bio"** (pulso sutil).
- Linha de apoio pequena: "SAIB Vendas + BI · Gestão que dá lucro".
- Os últimos ~1,2 s ficam estáveis (bom como último quadro), só com brilho sutil.

## 9. Assets
- `assets/brand/logo-saib.png`: logo colorido original (roxo + cinza), transparente. Bom sobre claro.
- `assets/brand/logo-saib-light.png`: versão lilás + prata para fundo escuro.
- `assets/brand/logo-saib-white.png`: versão branca.
- `assets/brand/selo-40-anos.png`: selo 40 anos (1218×1146, transparente).
