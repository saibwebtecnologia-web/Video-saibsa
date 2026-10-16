"""Monta uma folha de contato: sheet.py OUT COLS t1 f1 t2 f2 ...  (cada quadro rotulado com o tempo)."""
import sys
from PIL import Image, ImageDraw, ImageFont

out, cols = sys.argv[1], int(sys.argv[2])
pairs = list(zip(sys.argv[3::2], sys.argv[4::2]))
thumb_w = 270
ims = []
for t, f in pairs:
    im = Image.open(f).convert("RGB")
    h = round(im.height * thumb_w / im.width)
    ims.append((t, im.resize((thumb_w, h), Image.LANCZOS)))
th = ims[0][1].height
rows = (len(ims) + cols - 1) // cols
pad = 6
sheet = Image.new("RGB", (cols * (thumb_w + pad) + pad, rows * (th + pad + 22) + pad), (30, 30, 30))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 16)
except Exception:
    font = ImageFont.load_default()
for i, (t, im) in enumerate(ims):
    x = pad + (i % cols) * (thumb_w + pad)
    y = pad + (i // cols) * (th + pad + 22)
    sheet.paste(im, (x, y + 22))
    d.text((x + 2, y + 2), f"{float(t):.2f}s", fill=(255, 220, 90), font=font)
sheet.save(out)
