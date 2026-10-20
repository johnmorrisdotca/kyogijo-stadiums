/* global Blob, OffscreenCanvas, atob, createImageBitmap, FileReader, window, requestAnimationFrame */
// Makes the README's picture of the fly-through: the whole run from the map to the play on the ice, as an animated WebP in a light and a dark variant (`pnpm screenshots:flythrough`, which builds the demo first).
// Like the other moving picture (readme-animation.mjs) it is the demo's own page (flythrough.html), served to Chromium from site/ without a port and never fetched from the live site. The page's `seek(seconds)` puts the
// camera at a moment of the path at once, so a frame is taken at each of a fixed list of moments and nothing waits on a clock; the frames are the browser's own lossy WebP frames, put in one animated WebP by webp-animated.mjs.
//
//   node scripts/readme-flythrough.mjs              (ONLY=light or ONLY=dark takes one variant)
//
// Output: docs/images/turning-flythrough-desk-<light|dark>.webp.
import { Buffer } from "node:buffer";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

import { animated } from "./webp-animated.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const frames = Number(process.env.FRAMES ?? 40);
const frameMs = Number(process.env.FRAME_MS ?? 130);
const width = Number(process.env.WIDTH ?? 448);
const quality = Number(process.env.QUALITY ?? 0.55);
const BUDGET = 1024 * 1024;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };
if (!existsSync(join(root, "site", "index.html"))) throw new Error("site/ is not built: run `pnpm screenshots:flythrough`");
const out = join(root, "docs", "images");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
try {
  for (const scheme of ["light", "dark"]) {
    if (process.env.ONLY !== undefined && process.env.ONLY !== scheme) continue;
    const context = await browser.newContext({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1, reducedMotion: "no-preference", colorScheme: scheme });
    const page = await context.newPage();
    await page.route("http://kyogijo-stadiums.test/**", (route) => {
      const { pathname } = new URL(route.request().url());
      const file = join(root, "site", pathname === "/" ? "index.html" : decodeURIComponent(pathname).slice(1));
      if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
      return route.fulfill({ body: readFileSync(file), contentType: TYPES[extname(file)] ?? "application/octet-stream" });
    });
    await page.goto(`http://kyogijo-stadiums.test/flythrough.html?arena=climate-pledge-arena&theme=${scheme}&lang=en`);
    await page.waitForSelector('body[data-ready="true"] .kf-stage');
    await page.evaluate(() => window.flythrough.pause());
    const duration = await page.evaluate(() => window.flythrough.duration);
    // From the first moment to a little past the start of the play, so that the last frames have the play in them.
    const last = duration + 8;
    const target = page.locator(".kf-stage");
    const png = [];
    for (let i = 0; i < frames; i += 1) {
      await page.evaluate((t) => window.flythrough.seek(t), (last * i) / (frames - 1));
      await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
      png.push(await target.screenshot({ animations: "disabled" }));
    }
    const box = await target.boundingBox();
    const webp = [];
    for (const shot of png) {
      const encoded = await page.evaluate(async ({ base64, q, w }) => {
        const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
        const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
        const h = Math.round((bitmap.height * w) / bitmap.width);
        const canvas = new OffscreenCanvas(w, h);
        canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
        const blob = await canvas.convertToBlob({ type: "image/webp", quality: q });
        const reader = new FileReader();
        const done = new Promise((resolve) => { reader.onloadend = () => resolve(String(reader.result).split(",")[1]); });
        reader.readAsDataURL(blob);
        return { data: await done, w, h };
      }, { base64: shot.toString("base64"), q: quality, w: width });
      webp.push({ webp: Buffer.from(encoded.data, "base64"), w: encoded.w, h: encoded.h });
    }
    const file = animated(webp.map((f) => f.webp), webp[0].w, webp[0].h, frameMs);
    const name = `turning-flythrough-desk-${scheme}.webp`;
    writeFileSync(join(out, name), file);
    console.log(`${name.padEnd(40)} ${webp.length} frames of ${webp[0].w} x ${webp[0].h} (the stage's ${Math.round(box.width)} x ${Math.round(box.height)}), ${(file.length / 1024).toFixed(0)} KB`);
    if (file.length > BUDGET) {
      console.error(`${name} is over the ${BUDGET / 1024} KB budget`);
      process.exitCode = 1;
    }
    await context.close();
  }
} finally {
  await browser.close();
}
