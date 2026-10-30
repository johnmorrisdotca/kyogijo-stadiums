// Measures the district page and its 3D view in a real browser: how long the page takes to its first paint, what it weighs, how many elements and 3D planes it
// holds, what a turn step costs, and how much memory the composited layers take at a device pixel ratio. Used to find where the page's time goes, and to show what a change did to it; `e2e/perf.demo.mjs` holds the counts that decide it.
//
//   node scripts/perf-district.mjs [--site site] [--port 6960] [--browsers chromium,webkit] [--profiles desk,desk2,phone] [--throttle 1,4] [--presets a,b] [--steps 60] [--quality high,medium,low,auto] [--settle 20000] [--out file.json]
//
// It serves the built site (`pnpm site`) on 127.0.0.1 itself. A turn step is one pointer move on the 3D view, as a drag makes it; the time is taken to the end of the
// frame it causes. The throttle slows the CPU (Chromium only). `--quality` measures each tier (`?quality=`); `auto` first turns the view for up to `--settle` milliseconds, until the tier has not changed for four seconds, and the row says the tier it
// settled on (`tier`) and the steps it took. Nothing here is part of the package.
/* global window, performance, PointerEvent, requestAnimationFrame, MessageChannel, PerformanceObserver, MutationObserver */
import { createServer } from "node:http";
import { readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import process from "node:process";
import { chromium, webkit } from "@playwright/test";

const arg = (name, fallback) => {
  const at = process.argv.indexOf(`--${name}`);
  return at < 0 ? fallback : process.argv[at + 1];
};
const SITE = resolve(arg("site", "site"));
const PORT = Number(arg("port", "6960"));
const BROWSERS = arg("browsers", "chromium,webkit").split(",");
const PROFILES = arg("profiles", "desk,phone").split(",");
const THROTTLES = arg("throttle", "1,4").split(",").map(Number);
const STEPS = Number(arg("steps", "60"));
const OUT = arg("out", "");
const QUALITIES = arg("quality", "").split(",").filter(Boolean);
const SETTLE = Number(arg("settle", "20000"));

export const PRESETS = {
  alone: "venues=rogers-arena",
  pair: "",
  soccer: "venues=bc-place:soccer,rogers-arena",
  seattlecenter: "venues=climate-pledge-arena",
  sodo: "venues=t-mobile-park:mlb,lumen-field:nfl",
  seattle: "venues=t-mobile-park:mlb,lumen-field:nfl,climate-pledge-arena&mode=city",
  tokyo: "venues=tokyo-dome:mlb,korakuen-hall:boxing",
  tokyokodokan: "venues=tokyo-dome:mlb,korakuen-hall:boxing,kodokan",
  kodokan: "venues=kodokan&context=0",
};
const wanted = arg("presets", Object.keys(PRESETS).join(",")).split(",");

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon", ".md": "text/plain" };
const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, "http://x").pathname);
  let file = join(SITE, path);
  if (!file.startsWith(SITE)) return void response.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) return void response.writeHead(404).end();
  response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
  response.end(readFileSync(file));
});
await new Promise((done) => server.listen(PORT, "127.0.0.1", done));

const PROFILE = {
  desk: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
  desk2: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true },
};

const median = (list) => { const s = [...list].sort((a, b) => a - b); return s.length === 0 ? 0 : s[Math.floor(s.length / 2)]; };
const pct = (list, p) => { const s = [...list].sort((a, b) => a - b); return s.length === 0 ? 0 : s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

async function measure(browserName, profileName, throttle, name, baseQuery, quality) {
  const query = `${baseQuery}${quality === "" ? "" : `${baseQuery === "" ? "" : "&"}quality=${quality}`}`;
  const browser = await (browserName === "webkit" ? webkit : chromium).launch();
  const context = await browser.newContext({ ...PROFILE[profileName], locale: "en-US", reducedMotion: "no-preference" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  let cdp;
  if (browserName === "chromium") {
    cdp = await context.newCDPSession(page);
    await cdp.send("Performance.enable");
    if (throttle > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  }
  let bytes = 0;
  let gzip = 0;
  let files = 0;
  const bodies = [];
  page.on("response", (response) => {
    if (/\.(js|mjs)(\?|$)/.test(response.url())) bodies.push(response.body().then((b) => { bytes += b.length; gzip += gzipSync(b).length; files += 1; }, () => {}));
  });
  await page.addInitScript(() => {
    window.__ready = 0;
    window.__painted = 0;
    new MutationObserver(() => {
      if (!window.__ready && document.body?.dataset.ready === "true") {
        window.__ready = performance.now();
        requestAnimationFrame(() => { const c = new MessageChannel(); c.port1.onmessage = () => { window.__painted = performance.now(); }; c.port2.postMessage(0); });
      }
    }).observe(document, { attributes: true, subtree: true, attributeFilter: ["data-ready"] });
  });
  const url = `http://127.0.0.1:${PORT}/district.html?${query}${query ? "&" : ""}view=3d&viewpoint=broadcast`;
  await page.goto(url, { waitUntil: "load" });
  await page.waitForSelector('body[data-ready="true"]', { timeout: 120000 });
  await page.waitForTimeout(500);
  await Promise.all(bodies);
  const load = await page.evaluate(() => {
    const paints = Object.fromEntries(performance.getEntriesByType("paint").map((p) => [p.name, p.startTime]));
    const nav = performance.getEntriesByType("navigation")[0];
    return {
      fp: paints["first-paint"] ?? 0,
      fcp: paints["first-contentful-paint"] ?? 0,
      ready: window.__ready,
      painted: window.__painted,
      domContentLoaded: nav.domContentLoadedEventEnd,
      load: nav.loadEventEnd,
      nodes: document.querySelectorAll("*").length,
      planes: document.querySelectorAll(".ky-turn-floor, .ky-up").length,
      svgNodes: document.querySelectorAll("svg *").length,
      htmlBytes: document.documentElement.outerHTML.length,
      heap: performance.memory?.usedJSHeapSize ?? 0,
    };
  });
  // The composited layers' memory (Chromium): every element with a 3D transform is a layer; its backing store is width x height x ratio squared x 4 bytes.
  let layers;
  {
    layers = await page.evaluate(() => {
      const dpr = window.devicePixelRatio;
      let count = 0;
      let px = 0;
      let biggest = 0;
      for (const el of document.querySelectorAll(".ky-turn-floor, .ky-up")) {
        const r = el.getBoundingClientRect();
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        // The layer is the element's own size (before the transform), clipped to nothing: that is what the compositor allocates.
        const area = w * h * dpr * dpr;
        count += 1;
        px += area;
        if (area > biggest) biggest = area;
        void r;
      }
      return { count, megapixels: px / 1e6, megabytes: (px * 4) / 1048576, biggestMegapixels: biggest / 1e6 };
    });
  }
  // `auto`: turn the view until the tier has stood still for four seconds, noting each step it took.
  let settled;
  if (quality === "auto") {
    settled = await page.evaluate(async (limit) => {
      const stage = document.querySelector(".ky-turn-view");
      const root = document.querySelector(".ky-turn");
      const box = stage.getBoundingClientRect();
      const fire = (type, x, y) => stage.dispatchEvent(new PointerEvent(type, { pointerId: 9, pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y, bubbles: true }));
      const frame = () => new Promise((done) => requestAnimationFrame(() => { const c = new MessageChannel(); c.port1.onmessage = () => done(); c.port2.postMessage(0); }));
      const steps = [];
      let last = root.dataset.tier;
      let changedAt = performance.now();
      const start = performance.now();
      let x = box.left + box.width / 2;
      fire("pointerdown", x, box.top + 100);
      for (let i = 0; performance.now() - start < limit; i += 1) {
        x += i % 20 < 10 ? 6 : -6;
        fire("pointermove", x, box.top + 100 + (i % 8));
        await frame();
        if (root.dataset.tier !== last) { last = root.dataset.tier; changedAt = performance.now(); steps.push([Math.round(performance.now() - start), last]); }
        if (performance.now() - changedAt > 4000 && performance.now() - start > 6000) break;
      }
      fire("pointerup", x, box.top + 100);
      return { tier: root.dataset.tier, steps, ms: Math.round(performance.now() - start) };
    }, SETTLE);
  }
  // The turn: STEPS pointer moves on the view, each timed to the end of the frame it causes.
  const turn = await page.evaluate(async (steps) => {
    const stage = document.querySelector(".ky-turn-view");
    if (!stage) return null;
    const box = stage.getBoundingClientRect();
    const x0 = box.left + box.width / 2;
    const y0 = box.top + box.height / 2;
    const fire = (type, x, y) => stage.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y, bubbles: true }));
    const frame = () => new Promise((done) => requestAnimationFrame(() => { const c = new MessageChannel(); c.port1.onmessage = () => done(); c.port2.postMessage(0); }));
    const longTasks = [];
    try { new PerformanceObserver((list) => { for (const e of list.getEntries()) longTasks.push(e.duration); }).observe({ entryTypes: ["longtask"] }); } catch { /* not everywhere */ }
    fire("pointerdown", x0, y0);
    await frame();
    const script = [];
    const total = [];
    let x = x0;
    for (let i = 0; i < steps; i += 1) {
      x += i % 20 < 10 ? 6 : -6;
      const t0 = performance.now();
      fire("pointermove", x, y0 + (i % 8));
      const t1 = performance.now();
      await frame();
      script.push(t1 - t0);
      total.push(performance.now() - t0);
    }
    fire("pointerup", x, y0);
    return { script, total, longTasks };
  }, STEPS);
  let metrics;
  if (cdp) {
    const take = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
    const before = await take();
    await page.evaluate(async () => {
      const stage = document.querySelector(".ky-turn-view");
      const box = stage.getBoundingClientRect();
      const fire = (type, x, y) => stage.dispatchEvent(new PointerEvent(type, { pointerId: 8, pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y, bubbles: true }));
      const frame = () => new Promise((done) => requestAnimationFrame(() => { const c = new MessageChannel(); c.port1.onmessage = () => done(); c.port2.postMessage(0); }));
      let x = box.left + box.width / 2;
      fire("pointerdown", x, box.top + 100);
      for (let i = 0; i < 30; i += 1) { x += i % 20 < 10 ? 6 : -6; fire("pointermove", x, box.top + 100); await frame(); }
      fire("pointerup", x, box.top + 100);
    });
    const after = await take();
    metrics = Object.fromEntries(["ScriptDuration", "LayoutDuration", "RecalcStyleDuration", "TaskDuration"].map((k) => [k, round(((after[k] - before[k]) * 1000) / 30, 2)]));
  }
  const tierNow = await page.evaluate(() => document.querySelector(".ky-turn")?.dataset.tier ?? null);
  await browser.close();
  return {
    browser: browserName, profile: profileName, throttle, preset: name, quality: quality === "" ? "default" : quality, tier: tierNow, settled,
    fpMs: round(load.fp), fcpMs: round(load.fcp), readyMs: round(load.ready), paintedMs: round(load.painted), loadMs: round(load.load),
    jsKB: round(bytes / 1024, 0), jsGzipKB: round(gzip / 1024, 0), jsFiles: files,
    nodes: load.nodes, svgNodes: load.svgNodes, planes: load.planes, htmlKB: round(load.htmlBytes / 1024, 0), heapMB: round(load.heap / 1048576, 1),
    layers,
    stepJsMs: turn ? round(median(turn.script), 2) : null,
    stepFrameMs: turn ? round(median(turn.total), 1) : null,
    stepFrameP95: turn ? round(pct(turn.total, 0.95), 1) : null,
    fps: turn ? round(1000 / median(turn.total), 0) : null,
    longTasks: turn ? turn.longTasks.length : null,
    perStepMs: metrics,
    errors,
  };
}

const rows = [];
for (const browserName of BROWSERS) {
  for (const profileName of PROFILES) {
    for (const throttle of browserName === "chromium" ? THROTTLES : [1]) {
      for (const name of wanted) {
        for (const quality of QUALITIES.length === 0 ? [""] : QUALITIES) {
          const row = await measure(browserName, profileName, throttle, name, PRESETS[name], quality);
          rows.push(row);
          console.log(JSON.stringify(row));
        }
      }
    }
  }
}
if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 1));
server.close();
