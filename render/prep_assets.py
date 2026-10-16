"""Gera as versões de marca usadas no vídeo a partir dos originais em assets/brand/source."""
import numpy as np
from PIL import Image
from pathlib import Path

root = Path(__file__).resolve().parent.parent
src = root / "assets/brand/source"
dst = root / "assets/brand"

# Logo: o original é JPG sobre fundo branco. Cada pixel é tratado como mistura
# entre o branco e uma das cores da marca; resolve-se o alfa contra a cor mais
# próxima e "desmistura" o branco, preservando o brilho do símbolo.
im = np.asarray(Image.open(src / "logo-saib-original.jpg").convert("RGB")).astype(np.float32)
W = np.array([255, 255, 255], np.float32)
colors = np.array([[98, 9, 138], [157, 155, 156], [140, 80, 175]], np.float32)
d = W - im  # distância do branco
best_a, best_res = None, None
for c in colors:
    v = W - c
    a = np.clip((d @ v) / (v @ v), 0, 1)
    res = np.linalg.norm(d - a[..., None] * v, axis=-1)
    if best_a is None:
        best_a, best_res = a, res
    else:
        m = res < best_res
        best_a = np.where(m, a, best_a)
        best_res = np.where(m, res, best_res)
a = best_a
a = np.where(a < 0.035, 0, a)
safe = np.maximum(a, 1e-3)[..., None]
rgb = np.clip((im - (1 - a[..., None]) * W) / safe, 0, 255)
rgba = np.dstack([rgb, a * 255]).astype(np.uint8)
logo = Image.fromarray(rgba, "RGBA")
logo = logo.crop(logo.getbbox())
logo.save(dst / "logo-saib.png")

# Versão branca (monocromática) para fundos escuros.
arr = np.asarray(logo).copy()
arr[..., :3] = 255
Image.fromarray(arr, "RGBA").save(dst / "logo-saib-white.png")

# Versão "dark-friendly": 'saib' + símbolo roxo viram lilás claro, cinza vira prata claro.
arr = np.asarray(logo).astype(np.float32).copy()
rgb = arr[..., :3]
sat = rgb.max(-1) - rgb.min(-1)
purple = sat > 40
lil = np.array([196, 150, 255], np.float32)
sil = np.array([226, 226, 236], np.float32)
lum = rgb.mean(-1, keepdims=True) / 255
rgb2 = np.where(purple[..., None], lil * (0.85 + 0.6 * lum), sil * (0.75 + 0.4 * lum))
arr[..., :3] = np.clip(rgb2, 0, 255)
Image.fromarray(arr.astype(np.uint8), "RGBA").save(dst / "logo-saib-light.png")

# Selo 40 anos: já tem transparência, só recorta e salva em PNG.
selo = Image.open(src / "selo-40-anos-original.webp").convert("RGBA")
selo = selo.crop(selo.getbbox())
selo.save(dst / "selo-40-anos.png")
print("logo", logo.size, "selo", selo.size)
