// What the bundle report and the bundle test share: the pages of the demo that are measured, a server for the built `site/`, and one page load that
// notes every script and every file of data the page fetched (raw and gzipped bytes) and, in Chromium, how long the first paint and the finished drawing took.
// Nothing here is part of the package.
/* global window, performance, requestAnimationFrame, MessageChannel, MutationObserver */
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { gzipSync } from "node:zlib";

/** The district page's presets, by the query each one is opened with (the same as the presets of `demo/district.html`). */
export const DISTRICT_PRESETS = {
  pair: "",
  alone: "venues=rogers-arena",
  soccer: "venues=bc-place:soccer,rogers-arena",
  seattlecenter: "venues=climate-pledge-arena",
  sodo: "venues=t-mobile-park:mlb,lumen-field:nfl",
  seattle: "venues=t-mobile-park:mlb,lumen-field:nfl,climate-pledge-arena&mode=city",
  tokyo: "venues=tokyo-dome:mlb,korakuen-hall:boxing",
  tokyokodokan: "venues=tokyo-dome:mlb,korakuen-hall:boxing,kodokan",
  kodokan: "venues=kodokan&context=0",
};

/** Every page the report measures: its name, and the address it is opened at (a district in 3D from the broadcast viewpoint, as a reader sees it first on a phone). */
export const PAGES = [
  { name: "home", path: "index.html" },
  { name: "venues", path: "venues.html" },
  ...Object.entries(DISTRICT_PRESETS).map(([preset, query]) => ({ name: `district:${preset}`, path: `district.html?${query}${query === "" ? "" : "&"}view=3d&viewpoint=broadcast` })),
  { name: "stadiums", path: "stadiums.html" },
  { name: "halls", path: "halls.html" },
  { name: "boards", path: "boards.html" },
  { name: "flythrough", path: "flythrough.html" },
  { name: "judging", path: "judging.html" },
];

/** A file of data (a table the page draws from) and not a script: named `*.data.js`, `*-data.js` or `*.json`. */
export const isData = (url) => /(?:\.data\.js|-data\.js|\.json)$/.test(new URL(url).pathname);

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon", ".md": "text/plain" };

/** Serve a built site on 127.0.0.1:`port`; resolves to the server (call `close`). */
export async function serveSite(dir, port) {
  const root = resolve(dir);
  const server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url, "http://x").pathname);
    let file = join(root, path);
    if (!file.startsWith(root)) return void response.writeHead(403).end();
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) return void response.writeHead(404).end();
    response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
    response.end(readFileSync(file));
  });
  await new Promise((done) => server.listen(port, "127.0.0.1", done));
  return server;
}

const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;

/**
 * Open `url` in a new page of `browser`, wait until the page says it is drawn (an element with `data-ready="true"`), and report what it fetched.
 * `throttle` slows the CPU (Chromium only). Returns `{ files: [{ url, bytes, gzip, data }], js, data (totals), fcp, ready, painted, errors }`; times are milliseconds.
 */
export async function loadPage(browser, url, { throttle = 1, viewport = { width: 1280, height: 800 }, paint = true } = {}) {
  const context = await browser.newContext({ viewport, locale: "en-US", reducedMotion: "no-preference" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  if (throttle > 1) {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  }
  const bodies = [];
  const files = [];
  page.on("response", (response) => {
    if (!/\.(?:js|mjs|json)(?:\?|$)/.test(response.url())) return;
    bodies.push(response.body().then((body) => { files.push({ url: new URL(response.url()).pathname, bytes: body.length, gzip: gzipSync(body).length, data: isData(response.url()) }); }, () => {}));
  });
  await page.addInitScript(() => {
    window.__ready = 0;
    window.__painted = 0;
    const seen = () => {
      if (window.__ready || document.querySelector('[data-ready="true"]') === null) return;
      window.__ready = performance.now();
      requestAnimationFrame(() => { const c = new MessageChannel(); c.port1.onmessage = () => { window.__painted = performance.now(); }; c.port2.postMessage(0); });
    };
    new MutationObserver(seen).observe(document, { attributes: true, subtree: true, childList: true, attributeFilter: ["data-ready"] });
  });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForSelector('[data-ready="true"]', { timeout: 180000 });
  await page.waitForTimeout(paint ? 500 : 1500);
  await Promise.all(bodies);
  const timing = await page.evaluate(() => ({ fcp: performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0, ready: window.__ready, painted: window.__painted }));
  await context.close();
  const sum = (list, key) => list.reduce((total, file) => total + file[key], 0);
  const scripts = files.filter((file) => !file.data);
  const data = files.filter((file) => file.data);
  return {
    files: files.sort((a, b) => b.bytes - a.bytes),
    jsKB: kb(sum(scripts, "bytes")), jsGzipKB: kb(sum(scripts, "gzip")), jsFiles: scripts.length,
    dataKB: kb(sum(data, "bytes")), dataGzipKB: kb(sum(data, "gzip")), dataFiles: data.length,
    fcp: Math.round(timing.fcp), ready: Math.round(timing.ready), painted: Math.round(timing.painted),
    errors,
  };
}
