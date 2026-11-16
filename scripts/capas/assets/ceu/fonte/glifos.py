# Replace the AI-garbled zodiac glyphs on the 3:4 frame with the 12 correct ones (Carneiro at the top, clockwise),
# and erase the faint garbled glyphs on the big background wheel.
import math, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
G = "/home/leosc/.cache/ceu-capas/grok/"
a = cv2.cvtColor(cv2.imread(G + "arte-programa-900x1200.jpg"), cv2.COLOR_BGR2RGB)
gray = cv2.GaussianBlur(cv2.cvtColor(a, cv2.COLOR_RGB2GRAY), (3, 3), 0)
CX, CY = 448, 796
guess = [-90, -61, -34, 0, 32, 61, 90, 120, 148, 180, -146, -119]  # measured by eye, clockwise from the top
centres = []
for ang in guess:
    gx, gy = CX + 205 * math.cos(math.radians(ang)), CY + 205 * math.sin(math.radians(ang))
    x0, y0 = int(gx) - 40, int(gy) - 40
    win = gray[y0:y0 + 80, x0:x0 + 80]
    cs = cv2.HoughCircles(win, cv2.HOUGH_GRADIENT, dp=1, minDist=5, param1=80, param2=12, minRadius=19, maxRadius=27)
    best = (gx, gy)
    if cs is not None:
        c = min(cs[0], key=lambda c: math.hypot(c[0] + x0 - gx, c[1] + y0 - gy))
        if math.hypot(c[0] + x0 - gx, c[1] + y0 - gy) < 14:
            best = (c[0] + x0, c[1] + y0)
    centres.append(best)
centres[7] = (353, 977)  # Hough lands on the filigree here; set by eye
# inpaint the old glyphs (bright pixels inside each roundel's dark centre)
yy, xx = np.mgrid[:a.shape[0], :a.shape[1]]
mask = np.zeros(a.shape[:2], np.uint8)
g = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY).astype(int)
for x, y in centres:
    inside = np.hypot(xx - x, yy - y) < 18
    mask[inside & (g > 38)] = 255
# faint glyphs on the background wheel (annulus 282..335), skipping the cards' area
rr = np.hypot(xx - CX, yy - CY)
med = cv2.medianBlur(g.astype(np.uint8), 21).astype(int)
ann = (rr > 282) & (rr < 340) & ~((yy > 740) & ((xx < 300) | (xx > 595)))
mask[ann & (g > med + 10)] = 255
mask = cv2.dilate(mask, np.ones((3, 3), np.uint8))
a = cv2.inpaint(a, mask, 5, cv2.INPAINT_TELEA)
im = Image.fromarray(a).convert("RGBA")
# draw the correct glyphs, engraved gold, supersampled
S = 4
font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 23 * S)
for k, (x, y) in enumerate(centres):
    ch = chr(0x2648 + k) + "︎"
    t = Image.new("RGBA", (40 * S, 40 * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(t)
    d.text((20 * S + S, 20 * S + S), ch, font=font, anchor="mm", fill=(10, 6, 20, 200))  # shadow
    d.text((20 * S, 20 * S), ch, font=font, anchor="mm", fill=(222, 190, 122, 255))
    t = t.resize((40, 40), Image.LANCZOS)
    im.alpha_composite(t, (int(round(x)) - 20, int(round(y)) - 20))
im.convert("RGB").save(G + "arte-programa-900x1200-v2.jpg", quality=94)
print([(round(x), round(y)) for x, y in centres])
