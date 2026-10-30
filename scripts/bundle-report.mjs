// What each page of the demo loads, and how soon it paints: the bytes of script and of data a page fetches (raw and gzipped, from a real browser's network log), its first contentful paint and the moment it has
// drawn, at full speed and with the CPU slowed 4 times, each with the machine's load at the time (a loaded machine makes a time worthless: run again when it is quiet). The budget (`bundle-budget.json`) is held by
// `e2e/bundles.demo.mjs`; this prints the table for the changelog.
//
//   node scripts/bundle-report.mjs [--site site] [--port 6961] [--pages home,venues,district:alone] [--throttle 1,4] [--runs 3] [--no-paint] [--files] [--markdown] [--out file.json] [--budget [--write scripts/bundle-budget.json]]
//
// `--budget` prints a new `bundle-budget.json` (each page's bytes rounded up a few percent) instead of the table; with `--write` it writes the file.
import { loadavg } from "node:os";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";

import { PAGES, loadPage, serveSite } from "./bundle-lib.mjs";

const arg = (name, fallback) => {
  const at = process.argv.indexOf(`--${name}`);
  return at < 0 ? fallback : process.argv[at + 1];
};
const flag = (name) => process.argv.includes(`--${name}`);
const SITE = resolve(arg("site", "site"));
const PORT = Number(arg("port", "6961"));
const ONLY = arg("pages", "").split(",").filter(Boolean);
const THROTTLES = flag("no-paint") ? [] : arg("throttle", "1,4").split(",").map(Number);
const RUNS = Number(arg("runs", "3"));
const OUT = arg("out", "");

const median = (list) => { const s = [...list].sort((a, b) => a - b); return s.length === 0 ? 0 : s[Math.floor(s.length / 2)]; };
const pages = PAGES.filter((page) => ONLY.length === 0 || ONLY.includes(page.name));
const server = await serveSite(SITE, PORT);
const browser = await chromium.launch();
const rows = [];
try {
  for (const page of pages) {
    const url = `http://127.0.0.1:${PORT}/${page.path}`;
    // The bytes are the same on every load; the first load (full speed, nothing else asked of it) reports them.
    const first = await loadPage(browser, url, { paint: false });
    const row = { page: page.name, jsKB: first.jsKB, jsGzipKB: first.jsGzipKB, jsFiles: first.jsFiles, dataKB: first.dataKB, dataGzipKB: first.dataGzipKB, dataFiles: first.dataFiles, errors: first.errors, paint: {} };
    if (flag("files")) row.files = first.files;
    for (const throttle of THROTTLES) {
      const runs = [];
      for (let i = 0; i < RUNS; i += 1) {
        const load = loadavg()[0];
        const one = await loadPage(browser, url, { throttle });
        runs.push({ fcp: one.fcp, ready: one.ready, painted: one.painted, load: Math.round(load * 10) / 10 });
      }
      row.paint[`${throttle}x`] = { fcp: median(runs.map((r) => r.fcp)), painted: median(runs.map((r) => r.painted)), load: Math.round(median(runs.map((r) => r.load)) * 10) / 10, runs };
    }
    rows.push(row);
    console.error(`${page.name}: ${row.jsKB} KB script (${row.jsGzipKB} gzip), ${row.dataKB} KB data (${row.dataGzipKB} gzip)${row.errors.length > 0 ? `, ERRORS ${row.errors.join(" | ")}` : ""}`);
  }
} finally {
  await browser.close();
  server.close();
}

if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 1));
if (flag("budget")) {
  const room = (kb) => Math.ceil((kb * 1.05 + 2) / 5) * 5;
  const budget = Object.fromEntries(rows.map((row) => [row.page, { totalKB: room(row.jsKB + row.dataKB), totalGzipKB: room(row.jsGzipKB + row.dataGzipKB), dataKB: room(row.dataKB) }]));
  if (arg("write", "") === "") console.log(JSON.stringify(budget, null, 2));
  else writeFileSync(arg("write", ""), `${JSON.stringify(budget, null, 2)}\n`);
} else {
  const t = (row, key) => (row.paint[key] === undefined ? "" : `${row.paint[key].fcp} / ${row.paint[key].painted}`);
  const head = ["page", "script KB (gzip)", "data KB (gzip)", "files", ...THROTTLES.map((x) => `fcp / drawn ms at ${x}x`), "load at 1x / 4x"];
  const lines = rows.map((row) => [row.page, `${row.jsKB} (${row.jsGzipKB})`, `${row.dataKB} (${row.dataGzipKB})`, `${row.jsFiles} + ${row.dataFiles}`, ...THROTTLES.map((x) => t(row, `${x}x`)), THROTTLES.length === 0 ? "" : THROTTLES.map((x) => row.paint[`${x}x`].load).join(" / ")]);
  if (flag("markdown")) console.log([head, head.map(() => "---"), ...lines].map((cells) => `| ${cells.join(" | ")} |`).join("\n"));
  else for (const cells of [head, ...lines]) console.log(cells.join("\t"));
}
