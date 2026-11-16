#!/usr/bin/env python3
"""Céu de Cada Mês: put Teresa's medallion inside the empty gold frame of each Grok artwork.

Writes assets/ceu/<name>-capa.jpg (1600x1000), <name>-og.jpg (1200x630) and programa-900x1200.jpg.
The frame's inner disc is found by flood fill from its centre, so cards lying over the frame stay on top.
Usage: python3 scripts/capas/ceu-compor.py
"""
import pathlib
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

D = pathlib.Path(__file__).parent / "assets/ceu"
MED = Image.open(D / "medalhao-esrgan.png").convert("RGBA")  # ESRGAN x4 of the 128 px original, cleaned
GOLD = (227, 194, 126)
FILL = 0.92  # medallion diameter / inner disc diameter


def frame(img, seed):
    """Centre and inner diameter of the frame: walk from the seed to the first bright pixel (gold ring)."""
    g = np.asarray(img.convert("L")).astype(int)
    cx, cy = seed
    for _ in range(3):
        def edge(v, c, d):
            i = c
            while 0 < i < len(v) - 1 and v[i] < 70:
                i += d
            return i
        l, r = edge(g[cy], cx, -1), edge(g[cy], cx, 1)
        t, b = edge(g[:, cx], cy, -1), edge(g[:, cx], cy, 1)
        cx, cy = (l + r) // 2, (t + b) // 2
    return cx, cy, max(r - l, b - t)


def disc_mask(img, cx, cy, diam):
    """Inner disc minus anything lying over it (cards): flood fill inside the circle only."""
    a = cv2.GaussianBlur(np.asarray(img.convert("RGB")), (9, 9), 0)
    h, w = a.shape[:2]
    yy, xx = np.mgrid[: h + 2, : w + 2]
    m = ((np.hypot(xx - 1 - cx, yy - 1 - cy) > diam / 2 + 2) * 1).astype(np.uint8)  # blocked outside
    cv2.floodFill(a.copy(), m, (cx, cy), 0, (7, 7, 7), (7, 7, 7), cv2.FLOODFILL_MASK_ONLY | (255 << 8) | 8)
    m = ((m[1:-1, 1:-1] == 255) * 255).astype(np.uint8)
    return cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))  # fill stars


def place(img, seed):
    cx, cy, diam = frame(img, seed)
    m = disc_mask(img, cx, cy, diam)
    d = int(round(diam * FILL))
    med = MED.resize((d, d), Image.LANCZOS)
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    x0, y0 = int(round(cx - d / 2)), int(round(cy - d / 2))
    layer.alpha_composite(med, (x0, y0))
    ring = ImageDraw.Draw(layer)
    s = max(2, round(d / 160))
    ring.ellipse((x0 - s, y0 - s, x0 + d + s, y0 + d + s), outline=GOLD + (255,), width=s)
    # only inside the frame's disc (cards over the frame stay in front)
    keep = Image.fromarray(cv2.dilate(m, np.ones((3, 3), np.uint8))).filter(ImageFilter.GaussianBlur(1))
    alpha = Image.fromarray(np.minimum(np.asarray(layer.getchannel("A")), np.asarray(keep)))
    layer.putalpha(alpha)
    out = img.convert("RGBA")
    out.alpha_composite(layer)
    return out.convert("RGB"), (cx, cy, diam)


def episodio(name, seed):
    src = Image.open(D / f"grok-{name}.jpg").convert("RGB")  # 1280x720
    comp, (cx, cy, _) = place(src, seed)
    # site cover 1600x1000: height-fit, frame centre near x=1052
    s = 1000 / src.height
    big = comp.resize((round(src.width * s), 1000), Image.LANCZOS)
    x0 = int(min(max(cx * s - 1052, 0), big.width - 1600))
    big.crop((x0, 0, x0 + 1600, 1000)).save(D / f"{name}-capa.jpg", quality=92)
    # og 1200x630: width-fit, vertical crop around the frame
    s = 1200 / src.width
    og = comp.resize((1200, round(src.height * s)), Image.LANCZOS)
    y0 = int(min(max(cy * s - 315, 0), og.height - 630))
    og.crop((0, y0, 1200, y0 + 630)).save(D / f"{name}-og.jpg", quality=92)
    print(name, "frame", round(cx), round(cy))


if __name__ == "__main__":
    for name, seed in [("2026-04", (849, 362)), ("2026-05", (882, 325)), ("2026-10", (892, 364)), ("2026-11", (885, 349))]:
        episodio(name, seed)
    prog, _ = place(Image.open(D / "grok-programa-900x1200.jpg").convert("RGB"), (448, 796))
    prog.save(D / "programa-900x1200.jpg", quality=93)
    print("programa ok")
