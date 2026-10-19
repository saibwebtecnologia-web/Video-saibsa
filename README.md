# Vídeos SAIB: motion graphics por código

Reels da **SAIB Web Tecnologia** feitos em HTML/JS e renderizados quadro a quadro no Chromium, com saída em MP4 pelo ffmpeg.

Vídeos:
- **SAIB Direct: um app, dois lados** (pasta `direct/`, 41 s): `videos/saib-direct.mp4` (30 fps, H.264 High 4.2, BT.709, 3,5 Mbps, AAC 48 kHz), `videos/saib-direct-so-efeitos.mp4`, `videos/saib-direct-capa.png` e `videos/saib-direct-legenda.txt`. Roteiro técnico em `direct/BRIEF.md`; kit visual em `direct/KIT.md`; licenças dos ícones Lucide (ISC) e da fonte Inter (OFL) em `direct/assets/licenses/`.
- **Raio-X do distribuidor #1 · Positivação**, em 1080 × 1920 e 41,6 s, com trilha original e efeitos sonoros sintetizados por código (`audio/sound.py`).

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

# SAIB Direct: 60 fps com motion blur entregue a 30 fps, trilha e capa
node render/render.mjs --dir direct --fps 30 --mb 2 --shutter 0.5 --grain 2 --out out/direct/saib-direct-video.mp4
python3 direct/audio/sound.py
node render/stills.mjs --dir direct/cover --times 0.5 --out out/direct/cover

# prévia rápida
node render/render.mjs --fps 30 --jpeg --out out/preview.mp4

# folha de contato de um ato
node render/stills.mjs --act B --sheet 0.2 --only B
```

Para fazer outro vídeo da série, copie o projeto, troque o roteiro no `docs/BRIEF.md` e os tempos em `src/manifest.js`, e reescreva os atos em `src/acts/`.
