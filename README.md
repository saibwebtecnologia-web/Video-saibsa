# Vídeos SAIB: motion graphics por código

Reels da **SAIB Web Tecnologia** feitos em HTML/JS e renderizados quadro a quadro no Chromium, com saída em MP4 pelo ffmpeg.

Vídeo atual: **Raio-X do distribuidor #1 · Positivação**, em 1080 × 1920, 60 fps, 41,6 s e sem áudio, para colocar uma trilha em alta direto no Instagram.

## Estrutura

| Caminho | O que é |
|---|---|
| `docs/BRIEF.md` | Bíblia criativa: conceito, cores, tipografia, linguagem de movimento, roteiro por ato e contrato técnico |
| `src/manifest.js` | Tempos de cada ato |
| `src/core/` | Motor determinístico (`fx.js`, `engine.js`), fundo animado, cromo da série e transição de scan |
| `src/acts/A–E.js` | Os 5 atos do vídeo |
| `assets/brand/` | Logo (colorido, lilás/prata, branco) e selo 40 anos, gerados por `render/prep_assets.py` |
| `render/` | Renderizador de vídeo, quadros avulsos e folha de contato |

## Como renderizar

Requisitos: Node 18+, ffmpeg, Python 3 com Pillow e Playwright (`npm i`).

```bash
# vídeo final (60 fps, motion blur, granulação)
node render/render.mjs --mb 4 --out out/saib-positivacao-reels.mp4

# prévia rápida
node render/render.mjs --fps 30 --jpeg --out out/preview.mp4

# folha de contato de um ato
node render/stills.mjs --act B --sheet 0.2 --only B
```

Para fazer outro vídeo da série, copie o projeto, troque o roteiro no `docs/BRIEF.md` e os tempos em `src/manifest.js`, e reescreva os atos em `src/acts/`.
