// What each page of the demo loads, and how soon it paints: the bytes of script and of data a page fetches (raw and gzipped, from a real browser's network log), its first contentful paint and the moment it has
// drawn, at full speed and with the CPU slowed 4 times, each with the machine's load at the time (a loaded machine makes a time worthless: run again when it is quiet). The budget (`bundle-budget.json`) is held by
// `e2e/bundles.demo.mjs`; this prints the table for the changelog.
//
//   node scripts/bundle-report.mjs [--site site] [--base other-site] [--port 6961] [--pages home,venues,district:alone] [--throttle 1,4] [--runs 3] [--no-paint] [--files] [--markdown] [--out file.json]
//                                  [--budget [--write scripts/bundle-budget.json]]
//
// `--base` is another build of the demo (an earlier release's `site/`): each page is measured on both, a run of one and then a run of the other, so that the load of the machine falls on both alike, and the table shows
// before and after. `--budget` prints a new `bundle-budget.json` (each page's bytes rounded up a few percent) instead of the table; with `--write` it writes the file.
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
const PORT = Number(arg("port", "6961"));
const SITES = [{ label: "after", dir: resolve(arg("site", "site")), port: PORT }, ...(arg("base", "") === "" ? [] : [{ label: "before", dir: resolve(arg("base", "")), port: PORT + 1 }])];
const ONLY = arg("pages", "").split(",").filter(Boolean);
const THROTTLES = flag("no-paint") ? [] : arg("throttle", "1,4").split(",").map(Number);
const RUNS = Number(arg("runs", "3"));
const OUT = arg("out", "");

const median = (list) => { const s = [...list].sort((a, b) => a - b); return s.length === 0 ? 0 : s[Math.floor(s.length / 2)]; };
const round1 = (x) => Math.round(x * 10) / 10;
const pages = PAGES.filter((page) => ONLY.length === 0 || ONLY.includes(page.name));
const servers = await Promise.all(SITES.map((site) => serveSite(site.dir, site.port)));
const browser = await chromium.launch();
const rows = [];
try {
  for (const page of pages) {
    const row = { page: page.name };
    for (const site of SITES) {
      const url = `http://127.0.0.1:${site.port}/${page.path}`;
      // The bytes are the same on every load; the first load (full speed, nothing else asked of it) reports them.
      const first = await loadPage(browser, url, { paint: false });
      row[site.label] = { jsKB: first.jsKB, jsGzipKB: first.jsGzipKB, jsFiles: first.jsFiles, dataKB: first.dataKB, dataGzipKB: first.dataGzipKB, dataFiles: first.dataFiles, errors: first.errors, paint: {} };
      if (flag("files")) row[site.label].files = first.files;
    }
    for (const throttle of THROTTLES) {
      const runs = Object.fromEntries(SITES.map((site) => [site.label, []]));
      // One run of each site in turn, so that a loaded machine is loaded for both.
      for (let i = 0; i < RUNS; i += 1) {
        for (const site of SITES) {
          const load = loadavg()[0];
          const one = await loadPage(browser, `http://127.0.0.1:${site.port}/${page.path}`, { throttle });
          runs[site.label].push({ fcp: one.fcp, ready: one.ready, painted: one.painted, load: round1(load) });
        }
      }
      for (const site of SITES) {
        const list = runs[site.label];
        row[site.label].paint[`${throttle}x`] = { fcp: median(list.map((r) => r.fcp)), painted: median(list.map((r) => r.painted)), load: round1(median(list.map((r) => r.load))), runs: list };
      }
    }
    rows.push(row);
    const now = row.after;
    console.error(`${page.name}: ${now.jsKB} KB script (${now.jsGzipKB} gzip), ${now.dataKB} KB data (${now.dataGzipKB} gzip)${now.errors.length > 0 ? `, ERRORS ${now.errors.join(" | ")}` : ""}`);
  }
} finally {
  await browser.close();
  for (const server of servers) server.close();
}

if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 1));
if (flag("budget")) {
  const room = (kb) => Math.ceil((kb * 1.05 + 2) / 5) * 5;
  const budget = Object.fromEntries(rows.map((row) => [row.page, { totalKB: room(row.after.jsKB + row.after.dataKB), totalGzipKB: room(row.after.jsGzipKB + row.after.dataGzipKB), dataKB: room(row.after.dataKB) }]));
  if (arg("write", "") === "") console.log(JSON.stringify(budget, null, 2));
  else writeFileSync(arg("write", ""), `${JSON.stringify(budget, null, 2)}\n`);
} else {
  const both = SITES.length > 1;
  const total = (r, key) => round1(r[`js${key}`] + r[`data${key}`]);
  const bytes = (r) => `${total(r, "KB")} (${total(r, "GzipKB")})`;
  const paint = (row, key) => {
    const after = row.after.paint[key];
    const text = (p) => `${p.fcp} / ${p.painted}`;
    return both ? `${text(row.before.paint[key])} -> ${text(after)}` : text(after);
  };
  const head = ["page", both ? "KB (gzip) before -> after" : "KB (gzip)", "script / data KB after", ...THROTTLES.map((x) => `fcp / drawn ms at ${x}x`), ...(THROTTLES.length > 0 ? ["load at 1x / 4x"] : [])];
  const lines = rows.map((row) => [
    row.page,
    both ? `${bytes(row.before)} -> ${bytes(row.after)}` : bytes(row.after),
    `${row.after.jsKB} / ${row.after.dataKB}`,
    ...THROTTLES.map((x) => paint(row, `${x}x`)),
    ...(THROTTLES.length > 0 ? [THROTTLES.map((x) => (both ? `${row.before.paint[`${x}x`].load}, ${row.after.paint[`${x}x`].load}` : row.after.paint[`${x}x`].load)).join(" / ")] : []),
  ]);
  if (flag("markdown")) console.log([head, head.map(() => "---"), ...lines].map((cells) => `| ${cells.join(" | ")} |`).join("\n"));
  else for (const cells of [head, ...lines]) console.log(cells.join("\t"));
}
