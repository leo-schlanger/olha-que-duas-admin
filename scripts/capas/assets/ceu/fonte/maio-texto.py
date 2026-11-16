# Remove the English labels Grok wrote on the May cards (dark ink on the cream cartouches).
import numpy as np, cv2
a = cv2.imread("/home/leosc/.cache/ceu-capas/grok/ceu-mai-16x9.jpg")
g = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY).astype(int)
med = cv2.medianBlur(g.astype(np.uint8), 15).astype(int)
mask = np.zeros(g.shape, np.uint8)
for x0, y0, x1, y1 in [(960, 600, 1030, 640), (1028, 578, 1096, 606), (1098, 596, 1192, 650)]:
    sub = (g[y0:y1, x0:x1] < med[y0:y1, x0:x1] - 30)
    mask[y0:y1, x0:x1][sub] = 255
mask = cv2.dilate(mask, np.ones((3, 3), np.uint8))
a = cv2.inpaint(a, mask, 4, cv2.INPAINT_TELEA)
cv2.imwrite("/mnt/d/Projetos/olha-que-duas-admin/scripts/capas/assets/ceu/grok-2026-05.jpg", a, [cv2.IMWRITE_JPEG_QUALITY, 95])
cv2.imwrite("/home/leosc/.cache/ceu-capas/grok/mai-cards2.png", a[560:680, 940:1210])
