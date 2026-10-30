// What each page of the demo carries. A page loads the scripts and the data it shows and no more: this holds each page to a budget of bytes (raw and gzipped, from the network log of a real browser; `scripts/bundle-budget.json`,
// made by `pnpm bundles:budget`), holds each district preset to the records of the venues it shows (and to no table of every venue, and no layers), and plays every preset at every quality tier without a page error.
// The budget is a little above where the pages are, so that a change that adds a table to every page is found by the test; a change that makes a page smaller is welcome to lower it.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { expect, test } from "@playwright/test";

import { serve } from "./demo.mjs";
import { DISTRICT_PRESETS, PAGES, isData } from "../scripts/bundle-lib.mjs";

const BUDGET = JSON.parse(readFileSync(new URL("../scripts/bundle-budget.json", import.meta.url), "utf8"));
const STAGE = '[data-testid="stage"]';
const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;

/** Open `path` and collect what the page fetched (scripts and data) and what it complains of; waits until the page says it is drawn. */
async function watch(page, path) {
  const files = [];
  const errors = [];
  const bodies = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("response", (response) => {
    if (/\.(?:js|mjs|json)(?:\?|$)/.test(response.url())) bodies.push(response.body().then((body) => files.push({ url: new URL(response.url()).pathname, bytes: body.length, gzip: gzipSync(body).length, data: isData(response.url()) }), () => {}));
  });
  await serve(page);
  await page.goto(`http://kyogijo.test/${path}`);
  await page.waitForSelector('[data-ready="true"]');
  // A page that sits still after it is drawn fetches nothing more; a short wait lets the last file land.
  await page.waitForTimeout(400);
  await Promise.all(bodies);
  return { files, errors };
}

for (const one of PAGES) {
  test(`${one.name}: stays inside its budget of bytes`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desk", "the bytes are the same in every browser: measured once");
    const budget = BUDGET[one.name];
    expect(budget, `scripts/bundle-budget.json has no budget for ${one.name}: run pnpm bundles:budget`).toBeDefined();
    const { files, errors } = await watch(page, one.path);
    expect(errors).toEqual([]);
    const sum = (list, key) => list.reduce((total, file) => total + file[key], 0);
    const [raw, gzip, data] = [sum(files, "bytes"), sum(files, "gzip"), sum(files.filter((file) => file.data), "bytes")];
    const biggest = [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 5).map((file) => `${file.url} ${kb(file.bytes)}`).join(", ");
    expect(kb(raw), `${one.name} carries ${kb(raw)} KB (${kb(gzip)} gzipped, ${kb(data)} of it data) against ${budget.totalKB}; the biggest files: ${biggest}`).toBeLessThanOrEqual(budget.totalKB);
    expect(kb(gzip), `${one.name} carries ${kb(gzip)} KB gzipped against ${budget.totalGzipKB}`).toBeLessThanOrEqual(budget.totalGzipKB);
    expect(kb(data), `${one.name} carries ${kb(data)} KB of data against ${budget.dataKB}`).toBeLessThanOrEqual(budget.dataKB);
  });
}

// The records each district preset reads: the venues it shows, one file each, and no list of every venue.
const RECORDS = {
  pair: ["arenas/rogers-arena", "grounds/bc-place"],
  alone: ["arenas/rogers-arena"],
  soccer: ["arenas/rogers-arena", "grounds/bc-place"],
  seattlecenter: ["arenas/climate-pledge-arena"],
  sodo: ["grounds/lumen-field", "parks/t-mobile-park"],
  seattle: ["arenas/climate-pledge-arena", "grounds/lumen-field", "parks/t-mobile-park"],
  tokyo: ["parks/tokyo-dome"],
  tokyokodokan: ["parks/tokyo-dome"],
  kodokan: [],
};
const RECORD_FILE = /\/dist\/(?:arenas|parks|grounds)\/[a-z0-9-]+\.data\.js$/;
const TABLES = /\/dist\/(?:arenas|parks|grounds|walk|venues|venues\.osm)\.data\.js$|\/dist\/(?:layers|heat|heat\.zones|full|walk\.full|venues\.all)\.js$/;
// An arena of the NHL also has a real venue: two files, the facts and the outline (OpenStreetMap's, kept apart), and no table of every venue.
const VENUE_FILE = /\/dist\/venues\/[a-z0-9-]+\.(?:osm\.)?data\.js$/;
const VENUES_OF = { pair: ["rogers-arena"], alone: ["rogers-arena"], soccer: ["rogers-arena"], seattlecenter: ["climate-pledge-arena"], seattle: ["climate-pledge-arena"] };
// The walkable ground of the crowd outside is read for the presets that have venues of Vancouver's and for no other: one file, the district's, and never the table of every district.
const WALK_FILE = /\/dist\/walk\/[a-z0-9-]+\.data\.js$/;
// The words are one file for each language, and a page reads the language it shows (and the other only when it is chosen): never the file of every language, never the Japanese on an English page.
const WORDS_FILE = /\/dist\/strings(?:\.[a-z]+)?\.js$/;
const WALKS = { pair: ["walk/vancouver"], alone: ["walk/vancouver"], soccer: ["walk/vancouver"] };

for (const [preset, query] of Object.entries(DISTRICT_PRESETS)) {
  test(`${preset}: reads the records of the venues it shows and no other, at every quality tier`, async ({ page }) => {
    test.setTimeout(120_000);
    let first;
    for (const tier of ["high", "medium", "low"]) {
      // A new page for each tier, so that nothing of the last is kept in the page's memory.
      const tierPage = await page.context().newPage();
      const { files, errors } = await watch(tierPage, `district.html?${query}${query === "" ? "" : "&"}view=3d&viewpoint=broadcast&quality=${tier}`);
      await tierPage.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
      const records = files.map((file) => file.url).filter((url) => RECORD_FILE.test(url)).map((url) => url.replace(/^\/dist\//, "").replace(/\.data\.js$/, "")).sort();
      expect(errors, `${preset} at ${tier}`).toEqual([]);
      expect(records, `${preset} at ${tier}`).toEqual([...RECORDS[preset]].sort());
      expect(files.map((file) => file.url).filter((url) => TABLES.test(url)), `${preset} at ${tier} carries a table of every venue, of every district's walkable ground, or the layers`).toEqual([]);
      expect(files.map((file) => file.url).filter((url) => VENUE_FILE.test(url)).map((url) => url.replace(/^\/dist\/venues\//, "")).sort(), `${preset} at ${tier} reads the real venues of ${(VENUES_OF[preset] ?? []).join(", ") || "no arena"}`).toEqual((VENUES_OF[preset] ?? []).flatMap((id) => [`${id}.data.js`, `${id}.osm.data.js`]).sort());
      expect(files.map((file) => file.url).filter((url) => WORDS_FILE.test(url)).filter((url) => /strings\.(?:en|ja)\.js$/.test(url)), `${preset} at ${tier} reads the English words and not the Japanese`).toEqual(["/dist/strings.en.js"]);
      expect(files.map((file) => file.url).filter((url) => /\/dist\/strings\.js$/.test(url)), `${preset} at ${tier} carries the file that holds both languages`).toEqual([]);
      expect(files.map((file) => file.url).filter((url) => WALK_FILE.test(url)).map((url) => url.replace(/^\/dist\/|\.data\.js$/g, "")), `${preset} at ${tier} reads the walkable ground of ${WALKS[preset] === undefined ? "no district" : WALKS[preset].join(", ")}`).toEqual(WALKS[preset] ?? []);
      // The tiers differ in what they draw, not in what they load.
      const loaded = files.map((file) => file.url).sort();
      first ??= loaded;
      expect(loaded, `${preset} at ${tier} loads other files than at high`).toEqual(first);
      await tierPage.close();
    }
  });
}

test("the district page in 2D reads the same records and draws without a page error", async ({ page }) => {
  const { files, errors } = await watch(page, "district.html?venues=t-mobile-park:mlb,lumen-field:nfl");
  expect(errors).toEqual([]);
  expect(files.map((file) => file.url).filter((url) => RECORD_FILE.test(url)).sort()).toEqual(["/dist/grounds/lumen-field.data.js", "/dist/parks/t-mobile-park.data.js"]);
});

test("choosing other venues reads their records then, once, and choosing them again reads nothing", async ({ page }) => {
  const asked = [];
  page.on("request", (request) => RECORD_FILE.test(new URL(request.url()).pathname) && asked.push(new URL(request.url()).pathname.replace(/^\/dist\/|\.data\.js$/g, "")));
  const { errors } = await watch(page, "district.html?venues=rogers-arena");
  expect(asked).toEqual(["arenas/rogers-arena"]);
  asked.length = 0;
  await page.locator('#tabs button[data-preset="sodo"]').click();
  await page.waitForSelector('body[data-ready="true"]');
  await page.waitForFunction(() => document.querySelector('#tabs button[data-preset="sodo"]')?.getAttribute("aria-selected") === "true");
  expect([...asked].sort()).toEqual(["grounds/lumen-field", "parks/t-mobile-park"]);
  asked.length = 0;
  await page.locator('#tabs button[data-preset="alone"]').click();
  await page.waitForFunction(() => document.querySelector('#tabs button[data-preset="alone"]')?.getAttribute("aria-selected") === "true");
  await page.locator('#tabs button[data-preset="sodo"]').click();
  await page.waitForFunction(() => document.querySelector('#tabs button[data-preset="sodo"]')?.getAttribute("aria-selected") === "true");
  await page.waitForSelector('body[data-ready="true"]');
  expect(asked).toEqual([]);
  expect(errors).toEqual([]);
});

test("the walkable ground of the crowd outside is read when venues with a crowd are chosen, once, and never for the others", async ({ page }) => {
  const asked = [];
  page.on("request", (request) => WALK_FILE.test(new URL(request.url()).pathname) && asked.push(new URL(request.url()).pathname));
  const { errors } = await watch(page, "district.html?venues=t-mobile-park:mlb,lumen-field:nfl");
  expect(asked).toEqual([]);
  const choose = async (preset) => {
    await page.locator(`#tabs button[data-preset="${preset}"]`).click();
    await page.waitForFunction((name) => document.querySelector(`#tabs button[data-preset="${name}"]`)?.getAttribute("aria-selected") === "true", preset);
    await page.waitForSelector('body[data-ready="true"]');
  };
  await choose("pair");
  await page.waitForSelector('[data-testid="outside"]:not([hidden])');
  expect(asked).toEqual(["/dist/walk/vancouver.data.js"]);
  await choose("sodo");
  await choose("pair");
  await choose("tokyo");
  expect(asked).toEqual(["/dist/walk/vancouver.data.js"]);
  expect(errors).toEqual([]);
});

test("the words of a Japanese page are the Japanese file alone, and choosing the other language reads its file then, once", async ({ page }) => {
  const asked = [];
  page.on("request", (request) => /\/dist\/strings\.(?:en|ja)\.js$/.test(new URL(request.url()).pathname) && asked.push(new URL(request.url()).pathname));
  const { errors } = await watch(page, "district.html?venues=rogers-arena&lang=ja");
  expect(asked).toEqual(["/dist/strings.ja.js"]);
  const stage = page.locator('[data-testid="stage"]');
  const japanese = await stage.innerHTML();
  expect(japanese).toContain("ロジャーズ");
  const choose = async (language) => {
    await page.locator("#language").selectOption(language);
    await page.waitForSelector('body[data-ready="true"]');
    await page.waitForFunction((value) => document.documentElement.lang === value, language);
  };
  await choose("en");
  expect(asked).toEqual(["/dist/strings.ja.js", "/dist/strings.en.js"]);
  expect(await stage.innerHTML()).toContain("Rogers Arena");
  await choose("ja");
  await choose("en");
  expect(asked).toEqual(["/dist/strings.ja.js", "/dist/strings.en.js"]);
  expect(errors).toEqual([]);
});

test("every venue the page lists has its name without its record, and a chosen one has its record", async ({ page }) => {
  const { errors } = await watch(page, "district.html?venues=rogers-arena");
  const names = await page.locator("#picks label").allTextContents();
  expect(names.length).toBeGreaterThan(38);
  expect(names).toContain("BC Place (football field)");
  expect(names).toContain("Climate Pledge Arena");
  expect(errors).toEqual([]);
});
