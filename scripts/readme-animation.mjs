/* global Blob, OffscreenCanvas, atob, createImageBitmap, FileReader, requestAnimationFrame, Event */
// Makes the README's moving picture: a real arena turning once round in 3D, as an animated WebP in a light and a dark variant (`pnpm screenshots:animation`, which builds the demo first).
// Like the still pictures (readme-pictures.mjs) it is the demo's own venues page, served to Chromium from site/ without a port and never fetched from the live site, with motion reduced so that a key's step
// is taken at once. The page is turned by the key its 3D view answers to (ArrowLeft, one step of 6 degrees), a frame is taken after each step, and the frames are the browser's own lossy WebP
// frames, put in one animated WebP file by the few lines of RIFF below: no tool beyond Playwright is needed. Nothing waits on a clock.
//
//   node scripts/readme-animation.mjs              (the README's moving pictures; ONLY=turning-hall-desk takes one, SCHEME=light one variant)
//
// Output: docs/images/<subject>-<light|dark>.webp, or docs/pictures/ for a docs page's own.
import { Buffer } from "node:buffer";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

import { animated } from "./webp-animated.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const steps = Number(process.env.STEPS ?? 60);
const frameMs = Number(process.env.FRAME_MS ?? 200);
const width = Number(process.env.WIDTH ?? 640);
const quality = Number(process.env.QUALITY ?? 0.7);
/** The moving pictures: a page of the demo and what to show on it (the scheme is added). `zoomOut` is the steps back (the "-" key, 1.2 times each; the "+" key for a negative one) so that the floor fills the picture and keeps inside it all the way round. */
const SHOTS = [
  // A real arena, in the outline of its building, from a low corner.
  { subject: "turning-venue-desk", url: "/venues.html?venue=climate-pledge-arena&view=3d&viewpoint=corner&roof=0", zoomOut: 0 },
  // A tournament layout: four table tennis areas under one scoreboard.
  { subject: "turning-hall-desk", url: "/halls.html?preset=tabletennis-4&view=3d&viewpoint=corner", zoomOut: 0 },
  // A game on the ice (the home page's game section): the view turns while the game plays on, a third of a second of the game to each step, from a few seconds before a goal. For docs/replay.md
  // only (`docs`: it goes to docs/pictures), since the README's moving pictures are held to 3 MB.
  {
    subject: "turning-game-desk",
    docs: true,
    url: "/?help=off",
    zoomOut: -1,
    ready: '[data-testid="stage"][data-ready="true"]',
    target: "#game-stage .ky-turn-view",
    motion: "no-preference",
    prepare: async (page) => {
      await page.locator("#game").scrollIntoViewIfNeeded();
      await page.waitForSelector("#game-stage .ky-turn-replay");
      await page.mouse.move(0, 0);
    },
    each: (page, i) =>
      page.locator("#game-stage .ky-position").evaluate((el, value) => {
        el.value = String(value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }, 255 + i / 3),
  },
];
const BUDGET = 1.5 * 1024 * 1024;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".md": "text/markdown" };
const STEP_DEGREES = 6;
if (steps * STEP_DEGREES !== 360) throw new Error(`${steps} steps of ${STEP_DEGREES} degrees are not one turn: STEPS must be ${360 / STEP_DEGREES}`);

if (!existsSync(join(root, "site", "index.html"))) throw new Error("site/ is not built: run `pnpm screenshots:animation`");
const out = join(root, "docs", "images");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
try {
  for (const { subject, url, zoomOut, ready, target: where, motion, prepare, each, docs } of SHOTS) for (const scheme of ["light", "dark"]) {
    if ((process.env.ONLY !== undefined && process.env.ONLY !== subject) || (process.env.SCHEME !== undefined && process.env.SCHEME !== scheme)) continue;
    const context = await browser.newContext({ viewport: { width: width + 50, height: 900 }, deviceScaleFactor: 1, reducedMotion: motion ?? "reduce", colorScheme: scheme });
    const page = await context.newPage();
    await page.route("http://kyogijo-stadiums.test/**", (route) => {
      const { pathname } = new URL(route.request().url());
      const file = join(root, "site", pathname === "/" ? "index.html" : decodeURIComponent(pathname).slice(1));
      if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
      return route.fulfill({ body: readFileSync(file), contentType: TYPES[extname(file)] ?? "application/octet-stream" });
    });
    await page.goto(`http://kyogijo-stadiums.test${url}&theme=${scheme}&lang=en`);
    await page.waitForSelector(ready ?? 'body[data-ready="true"] #stage .ky-turn');
    if (prepare !== undefined) await prepare(page);
    const target = page.locator(where ?? "#stage .ky-turn-view").first();
    await target.focus();
    for (let i = 0; i < Math.abs(zoomOut); i += 1) await page.keyboard.press(zoomOut > 0 ? "-" : "+");
    const png = [];
    for (let i = 0; i < steps; i += 1) {
      if (each !== undefined) await each(page, i);
      png.push(await target.screenshot({ animations: "disabled" }));
      await page.keyboard.press("ArrowLeft");
      // A view that glides (motion not reduced) has taken the step when its glide is over.
      if (motion !== undefined) await page.waitForTimeout(160);
      // The step is taken at once (motion is reduced); two frames let the browser draw it.
      await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
    }
    const box = await target.boundingBox();
    const frames = [];
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
      frames.push({ webp: Buffer.from(encoded.data, "base64"), w: encoded.w, h: encoded.h });
    }
    const file = animated(frames.map((f) => f.webp), frames[0].w, frames[0].h, frameMs);
    const name = `${subject}-${scheme}.webp`;
    writeFileSync(join(docs ? join(root, "docs", "pictures") : out, name), file);
    console.log(`${name.padEnd(32)} ${frames.length} frames of ${frames[0].w} x ${frames[0].h} (the page's ${Math.round(box.width)} x ${Math.round(box.height)}), ${(file.length / 1024).toFixed(0)} KB`);
    if (file.length > BUDGET) {
      console.error(`${name} is over the ${BUDGET / 1024} KB budget`);
      process.exitCode = 1;
    }
    await context.close();
  }
} finally {
  await browser.close();
}
