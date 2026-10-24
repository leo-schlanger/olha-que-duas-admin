#!/usr/bin/env node
// Cover generator for the Exclusivo programs.
// Usage: node scripts/capas/gerar.mjs scripts/capas/pecas/<slug>.json [--out dir]
// Writes <slug>-capa.jpg (1600x1000, site) and <slug>-og.jpg (1200x630, social).
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { programas } from "./programas.mjs";

const here = dirname(fileURLToPath(import.meta.url));

function loadPlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_CORE,
    join(here, "../../node_modules/playwright-core"),
    resolve(here, "../../../olha-que-duas/node_modules/playwright-core"),
  ].filter(Boolean);
  for (const c of candidates) {
    if (existsSync(c)) return createRequire(import.meta.url)(c);
  }
  throw new Error("playwright-core not found; set PLAYWRIGHT_CORE");
}

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = join(homedir(), ".cache/ms-playwright");
  for (const dir of ["chromium-1243", "chromium-1234", "chromium-1228"]) {
    const p = join(base, dir, "chrome-linux64/chrome");
    if (existsSync(p)) return p;
  }
  return undefined;
}

const esc = (s = "") =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// *word* marks the highlighted part of a headline.
const marked = (s = "") =>
  esc(s)
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/[«»]/g, '<span class="g">$&</span>');

const asUrl = (src, base) => (/^https?:/.test(src) ? src : pathToFileURL(resolve(base, src)).href);

function fontFaces() {
  const f = (file) => pathToFileURL(join(here, "fonts", file)).href;
  return `
@font-face{font-family:Anton;src:url("${f("Anton-Regular.ttf")}")}
@font-face{font-family:Inter;src:url("${f("Inter[opsz,wght].ttf")}");font-weight:100 900}
@font-face{font-family:Cormorant;src:url("${f("CormorantGaramond[wght].ttf")}");font-weight:300 700}
@font-face{font-family:Cormorant;src:url("${f("CormorantGaramond-Italic[wght].ttf")}");font-weight:300 700;font-style:italic}
@font-face{font-family:Playfair;src:url("${f("PlayfairDisplay[wght].ttf")}");font-weight:400 900}
@font-face{font-family:Playfair;src:url("${f("PlayfairDisplay-Italic[wght].ttf")}");font-weight:400 900;font-style:italic}
@font-face{font-family:Fraunces;src:url("${f("Fraunces[SOFT,WONK,opsz,wght].ttf")}");font-weight:100 900}
@font-face{font-family:Fraunces;src:url("${f("Fraunces-Italic[SOFT,WONK,opsz,wght].ttf")}");font-weight:100 900;font-style:italic}`;
}

function page(peca, formato, base) {
  const prog = programas[peca.programa];
  if (!prog) throw new Error(`unknown programa: ${peca.programa}`);
  const [w, h] = formato === "og" ? [1200, 630] : [1600, 1000];
  // The site cover carries no headline unless asked: the H1 sits right above it.
  const comTitulo = formato === "og" || peca.tituloNaCapa === true;
  const data = {
    ...peca,
    foto: asUrl(peca.foto, base),
    foco: peca.foco || "50% 35%",
    kicker: esc(peca.kicker || prog.kicker),
    titulo: comTitulo ? marked(peca.titulo) : "",
    linha: comTitulo ? esc(peca.linha || "") : "",
    autor: esc(prog.autor),
    retrato: prog.retrato ? pathToFileURL(join(here, "assets", prog.retrato)).href : "",
    programa: esc(prog.titulo),
  };
  const logo = pathToFileURL(join(here, "assets/logo.webp")).href;
  return `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><style>
${fontFaces()}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden}
/* u = 1px at 630 tall; every size scales with the canvas height */
.c{--u:${h / 630}px;position:relative;width:${w}px;height:${h}px;overflow:hidden;font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased}
.logo{position:absolute;z-index:20;left:calc(30*var(--u));top:calc(26*var(--u));width:calc(96*var(--u));height:calc(96*var(--u));
  filter:drop-shadow(0 calc(4*var(--u)) calc(10*var(--u)) rgba(0,0,0,.45))}
.ph{position:absolute;inset:0;background-size:cover;background-repeat:no-repeat}
${prog.css}
</style></head><body>
<div class="c ${prog.classe} ${comTitulo ? "com-titulo" : "sem-titulo"}">
${prog.html(data)}
<img class="logo" src="${logo}" alt="">
</div></body></html>`;
}

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => a.endsWith(".json"));
  if (!file) {
    console.error("usage: gerar.mjs pecas/<slug>.json [--out dir] [--so og|capa]");
    process.exit(1);
  }
  const outIdx = args.indexOf("--out");
  const out = outIdx >= 0 ? resolve(args[outIdx + 1]) : join(here, "saida");
  const soIdx = args.indexOf("--so");
  const formatos = soIdx >= 0 ? [args[soIdx + 1]] : ["capa", "og"];
  mkdirSync(out, { recursive: true });

  const peca = JSON.parse(readFileSync(file, "utf8"));
  const slug = peca.slug || basename(file, ".json");
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ executablePath: findChromium() });
  try {
    for (const formato of formatos) {
      const [w, h] = formato === "og" ? [1200, 630] : [1600, 1000];
      const pg = await browser.newPage({ viewport: { width: w, height: h } });
      // Loaded from a file so the local fonts, logo and photos are allowed.
      const html = join(out, `.${slug}-${formato}.html`);
      writeFileSync(html, page(peca, formato, dirname(resolve(file))));
      await pg.goto(pathToFileURL(html).href, { waitUntil: "networkidle" });
      rmSync(html);
      await pg.evaluate(() => document.fonts.ready);
      // CSS backgrounds are not covered by networkidle: decode every image before the shot.
      await pg.evaluate(async () => {
        const urls = [...document.querySelectorAll("[style*='background-image']")]
          .map((el) => getComputedStyle(el).backgroundImage.match(/url\("?(.+?)"?\)/)?.[1])
          .filter(Boolean);
        const imgs = [...document.images].map((i) => i.src);
        await Promise.all(
          [...urls, ...imgs].map(async (src) => {
            const im = new Image();
            im.src = src;
            try {
              await im.decode();
            } catch {
              throw new Error(`image failed to load: ${src}`);
            }
          }),
        );
      });
      await pg.waitForTimeout(200);
      const overflow = await pg.evaluate(() =>
        [...document.querySelectorAll("[data-fit]")].some((el) => el.scrollHeight > el.clientHeight + 1),
      );
      if (overflow) console.warn(`! ${slug} ${formato}: headline does not fit, shorten it`);
      const path = join(out, `${slug}-${formato}.jpg`);
      await pg.screenshot({ path, type: "jpeg", quality: 88 });
      console.log(path);
      await pg.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
