# Clean the ESRGAN x4 medallion: repaint the garbled "com Teresa" line, light sharpening, circular crop inside the glyph ring.
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
E = "/home/leosc/.cache/ceu-capas/esrgan/"
F = "/mnt/e/Projetos/olha-que-duas-admin/scripts/capas/fonts/"
im = Image.open(E + "RealESRGAN_x4plus-4x.png").convert("RGB")
a = np.asarray(im).copy()
x0, y0, x1, y1 = 172, 424, 344, 464
box = a[y0:y1, x0:x1]
mask = np.zeros(a.shape[:2], np.uint8)
lum = box.astype(int).sum(2)
mask[y0:y1, x0:x1] = ((lum > 150) * 255).astype(np.uint8)
mask = cv2.dilate(mask, np.ones((5, 5), np.uint8))
a = cv2.inpaint(a, mask, 7, cv2.INPAINT_TELEA)
# remove the garbled ring glyphs in the band we keep (r 213..233), except behind the title letters
yy, xx = np.mgrid[:512, :512]
rr = np.hypot(xx - 256, yy - 256)
band = (rr > 213) & (rr < 233) & ~((yy > 330) & (yy < 405))
g = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY).astype(int)
med = cv2.medianBlur(g.astype(np.uint8), 15).astype(int)
m2 = (band & (g > med + 18)).astype(np.uint8) * 255
m2 = cv2.dilate(m2, np.ones((5, 5), np.uint8))
a = cv2.inpaint(a, m2, 6, cv2.INPAINT_TELEA)
im = Image.fromarray(a)
# redraw the line at 4x then downsample for clean antialiasing
S = 4
W, H = (x1 - x0) * S, (y1 - y0) * S
layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(layer)
fc = ImageFont.truetype(F + "CormorantGaramond-Italic[wght].ttf", 19 * S)
ft = ImageFont.truetype(F + "Cinzel[wght].ttf", 25 * S)
try:
    ft.set_variation_by_axes([600]); fc.set_variation_by_axes([600])
except Exception:
    pass
col = (232, 222, 196, 255)
wc = d.textlength("com", font=fc); wt = d.textlength("TERESA", font=ft); gap = 7 * S
xs = (W - (wc + gap + wt)) / 2
base = H * 0.72
d.text((xs, base), "com", font=fc, fill=col, anchor="ls")
d.text((xs + wc + gap, base), "TERESA", font=ft, fill=col, anchor="ls")
layer = layer.resize((x1 - x0, y1 - y0), Image.LANCZOS)
im.paste(layer, (x0, y0), layer)
im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
im.save(E + "medalhao-limpo-512.png")
# circular crop inside the outer gold ring (r=232 around the centre)
r = 232
c = im.crop((256 - r, 256 - r, 256 + r, 256 + r)).convert("RGBA")
m = Image.new("L", (r * 8, r * 8), 0); ImageDraw.Draw(m).ellipse((0, 0, r * 8 - 1, r * 8 - 1), 255)
c.putalpha(m.resize((2 * r, 2 * r), Image.LANCZOS))
c.save("/mnt/e/Projetos/olha-que-duas-admin/scripts/capas/assets/ceu/medalhao-esrgan.png")
print("ok", c.size)
