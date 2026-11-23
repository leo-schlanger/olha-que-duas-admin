# Prepares the raster pieces for the v2 cover collage.
# Comments: avatar/name covered with solid colour, then blurred (irreversible);
# time, "Editado", heart and like count painted out with the page white.
import sys
from pathlib import Path
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).parent / "img"
DRIVE = Path("/mnt/c/Users/leosc/Desktop/video/projetos/pimenta-zaza/fonte/drive")
ZAZA = Path("/mnt/e/Projetos/olha-que-duas-admin/supabase/rascunhos/francisco-monteiro-desiste-big-brother-all-stars-fotos/1.jpg")
ALEX = Path("/mnt/c/Users/leosc/Desktop/video/ferramentas/marca/alexandra-serra-real.png")
COVER = (190, 172, 160)


def redact(src, crop, avatar, name, wipes, out):
    im = Image.open(src).convert("RGB")
    d = ImageDraw.Draw(im)
    blur_mask = Image.new("L", im.size, 0)
    bm = ImageDraw.Draw(blur_mask)
    # avatar: solid disk, then blur
    d.ellipse(avatar, fill=COVER)
    bm.ellipse([avatar[0] - 10, avatar[1] - 10, avatar[2] + 10, avatar[3] + 10], fill=255)
    # name: solid pill, then blur
    d.rounded_rectangle(name, radius=12, fill=COVER)
    bm.rounded_rectangle([name[0] - 10, name[1] - 10, name[2] + 10, name[3] + 10], radius=16, fill=255)
    for w in wipes:
        d.rectangle(w, fill=(255, 255, 255))
    blurred = im.filter(ImageFilter.GaussianBlur(9))
    im = Image.composite(blurred, im, blur_mask.filter(ImageFilter.GaussianBlur(3)))
    im.crop(crop).save(OUT / out)


redact(DRIVE / "IMG-20261115-WA0001.jpg", (20, 1258, 900, 1490),
       avatar=(33, 1275, 118, 1360), name=(144, 1271, 274, 1303),
       wipes=[(278, 1266, 480, 1308), (828, 1288, 892, 1378)], out="comentario-1.png")
redact(DRIVE / "IMG-20261115-WA0002.jpg", (20, 765, 900, 990),
       avatar=(33, 776, 118, 861), name=(143, 772, 304, 806),
       wipes=[(308, 768, 380, 808), (828, 790, 892, 878)], out="comentario-2.png")

# Zaza: face only, above the TV lower third and inside the channel logos.
Image.open(ZAZA).convert("RGB").crop((360, 0, 660, 425)).save(OUT / "zaza-ecra.jpg", quality=95)

# Alexandra: cut out from the plain wall with GrabCut, white sticker border.
src = Image.open(ALEX).convert("RGB").crop((0, 150, 1400, 1940))
src.thumbnail((900, 1200))
a = np.array(src)
h, w = a.shape[:2]
mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
mask[:8, :] = mask[:, :6] = mask[:, -6:] = cv2.GC_BGD
lab = cv2.cvtColor(a, cv2.COLOR_RGB2LAB).astype(np.float32)
bg = np.median(np.concatenate([lab[:40, :].reshape(-1, 3), lab[:300, :30].reshape(-1, 3)]), 0)
dist = np.linalg.norm(lab - bg, axis=2)
mask[dist > 28] = cv2.GC_PR_FGD
mask[int(h * .30):int(h * .75), int(w * .30):int(w * .70)] = cv2.GC_FGD  # face
mask[int(h * .80):, int(w * .10):int(w * .90)] = cv2.GC_FGD            # scarf
bgd = np.zeros((1, 65), np.float64); fgd = np.zeros((1, 65), np.float64)
cv2.grabCut(a, mask, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
# drop the white top / wall bits at the bottom (low chroma, light) so only the scarf remains
L, A_, B_ = lab[..., 0], lab[..., 1] - 128, lab[..., 2] - 128
pale = (L > 165) & (np.hypot(A_, B_) < 12)
fg[int(h * .74):][pale[int(h * .74):]] = 0
fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
# keep largest component, fill holes
n, lbl, st, _ = cv2.connectedComponentsWithStats(fg)
k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); fg = np.where(lbl == k, 255, 0).astype(np.uint8)
fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
inv = (fg == 0).astype(np.uint8)
n2, l2, _, _ = cv2.connectedComponentsWithStats(inv)
edge = set(np.unique(np.concatenate([l2[0], l2[:, 0], l2[:, -1]])))  # bottom is cut flat, not background
for i in range(1, n2):
    if i not in edge: fg[l2 == i] = 255
fg = cv2.GaussianBlur(fg, (5, 5), 0)
pad = 40
A = np.zeros((h + pad, w + 2 * pad, 4), np.uint8)
m = np.zeros((h + pad, w + 2 * pad), np.uint8); m[pad:, pad:pad + w] = fg
border = cv2.dilate((m > 127).astype(np.uint8) * 255, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (37, 37)))
border = cv2.GaussianBlur(border, (3, 3), 0)
A[..., :3] = 255; A[..., 3] = border
photo = np.zeros_like(A); photo[pad:, pad:pad + w, :3] = a; photo[..., 3] = m
P = Image.alpha_composite(Image.fromarray(A), Image.fromarray(photo))
P.save(OUT / "alexandra-recorte.png")
print("ok", P.size)
