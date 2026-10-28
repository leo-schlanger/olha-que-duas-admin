// Render program cover HTML files to 900x1200 JPEG.
// Usage: node render.mjs <file.html> <out.jpg> [more pairs...]
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || resolve("/mnt/d/Projetos/olha-que-duas/node_modules/playwright-core"));
const exe = process.env.CHROMIUM_PATH || join(homedir(), ".cache/ms-playwright/chromium-1243/chrome-linux64/chrome");
const a = process.argv.slice(2);
const b = await chromium.launch({ executablePath: exe });
for (let i = 0; i < a.length; i += 2) {
  const p = await b.newPage({ viewport: { width: 900, height: 1200 } });
  await p.goto(pathToFileURL(resolve(a[i])).href, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForFunction(() => !document.querySelector("[data-fitw]") || document.body.dataset.ready === "1");
  await p.waitForTimeout(250);
  const of = await p.evaluate(() => [...document.querySelectorAll("h1,h2")].filter(e => e.scrollWidth > e.clientWidth + 2).map(e => e.textContent));
  if (of.length) console.warn("overflow:", of);
  await p.screenshot({ path: resolve(a[i + 1]), type: "jpeg", quality: 92 });
  console.log(resolve(a[i + 1]));
  await p.close();
}
await b.close();
