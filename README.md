# Vídeos SAIB: motion graphics por código

Reels da **SAIB Web Tecnologia** feitos em HTML/JS e renderizados quadro a quadro no Chromium, com saída em MP4 pelo ffmpeg.

Vídeo atual: **Raio-X do distribuidor #1 · Positivação**, em 1080 × 1920 e 41,6 s, com trilha original e efeitos sonoros sintetizados por código (`audio/sound.py`).

Arquivos em `videos/`:
- `raio-x-01-positivacao.mp4`: versão principal para postar (30 fps, música + efeitos, −14 LUFS)
- `raio-x-01-positivacao-60fps.mp4`: a mesma, a 60 fps
- `raio-x-01-positivacao-so-efeitos.mp4`: só os efeitos, para usar com uma música em alta do Instagram
- `raio-x-01-positivacao-capa.png`: capa do Reels

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

# trilha (gera audio/out/mix.wav e sfx.wav) e masterização em -14 LUFS
python3 audio/sound.py
ffmpeg -i audio/out/mix.wav -af loudnorm=I=-14:TP=-1:LRA=11 audio/out/mix-master.wav

# prévia rápida
node render/render.mjs --fps 30 --jpeg --out out/preview.mp4

# folha de contato de um ato
node render/stills.mjs --act B --sheet 0.2 --only B
```

Para fazer outro vídeo da série, copie o projeto, troque o roteiro no `docs/BRIEF.md` e os tempos em `src/manifest.js`, e reescreva os atos em `src/acts/`.
