// Renders the v2 collage: node render.mjs  -> ../*.jpg
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(import.meta.url)("/mnt/d/Projetos/olha-que-duas/node_modules/playwright-core");
const jobs = [
  ["capa", 1, "capa-com-foto", 1600, 1000], ["capa", 0, "capa-sem-foto", 1600, 1000],
  ["og", 1, "og-com-foto", 1200, 630], ["og", 0, "og-sem-foto", 1200, 630],
  ["c1", 1, "corpo-1", 1200, 470], ["c2", 1, "corpo-2", 1200, 450],
];
const only = process.argv[2];
const b = await chromium.launch({ executablePath: join(homedir(), ".cache/ms-playwright/chromium-1243/chrome-linux64/chrome") });
for (const [f, z, name, w, h] of jobs) {
  if (only && !name.includes(only)) continue;
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(pathToFileURL(join(here, "colagem.html")).href + `?f=${f}&z=${z}`, { waitUntil: "networkidle" });
  await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode())); });
  const fams = await p.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family));
  await p.waitForTimeout(300);
  await p.screenshot({ path: join(here, "..", name + ".jpg"), type: "jpeg", quality: 88 });
  console.log(name, w + "x" + h, "fonts:", [...new Set(fams)].join(","));
  await p.close();
}
await b.close();
