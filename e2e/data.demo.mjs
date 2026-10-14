// The demo's Data section: a shot map on the rink, a pass map on the field and a spray chart on a ballpark, drawn from made-up
// data, clipped to the surface, with a table that stands for each.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open } from "./demo.mjs";

const CARDS = [["shots", "nhl", 44], ["passes", "nfl", 20], ["spray", "mlb", 64], ["heat", "nhl", 0], ["zones", "nba", 0], ["positional", "soccer", 0], ["density", "mlb", 0]];

test("the Data section draws a map on each surface, with its marks, its title and its description", async ({ page }) => {
  const errors = await open(page, "?lang=en&help=off");
  expect(errors).toEqual([]);
  const cards = page.locator(`${at("data-cards")} figure.card`);
  await expect(cards).toHaveCount(CARDS.length);
  for (const [index, [, sport, count]] of CARDS.entries()) {
    const svg = cards.nth(index).locator("svg.kyogijo");
    await svg.scrollIntoViewIfNeeded();
    await expect(svg).toHaveAttribute("data-sport", sport);
    const layers = svg.locator("g.ky-layer");
    expect(await layers.count()).toBeGreaterThanOrEqual(1);
    expect(await svg.locator("desc").first().textContent()).toContain("Data:");
    if (index === 0) {
      expect(await svg.locator("g.ky-pts > circle, g.ky-pts > path").count()).toBe(count);
      expect(await svg.locator("g.ky-pts > title").textContent()).toBe("44 shots");
    }
    // Not blank: the marks have a drawn size.
    const box = await svg.locator("g.ky-layers").boundingBox();
    expect(box.width).toBeGreaterThan(50);
  }
});

test("a hollow mark is hollow and a filled one is filled, in the colours of the page", async ({ page }) => {
  await open(page, "?lang=en&help=off&theme=light");
  const svg = page.locator(`${at("data-cards")} svg.kyogijo`).first();
  await svg.scrollIntoViewIfNeeded();
  const look = (selector) => svg.locator(selector).first().evaluate((el) => { const s = getComputedStyle(el); return { fill: s.fill, stroke: s.stroke }; });
  const solid = await look("g.ky-pts > .ky-h:not(.ky-hol)");
  const hollow = await look("g.ky-pts > .ky-hol");
  expect(solid.fill).toBe("rgb(31, 95, 168)");
  expect(hollow.fill).not.toBe(solid.fill);
  expect(hollow.stroke).not.toBe("none");
});

test("every layer is cut to the surface: the rink's layer points at the clip of its own drawing", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  const svg = page.locator(`${at("data-cards")} svg.kyogijo`).first();
  const clip = await svg.locator("g.ky-layer").first().getAttribute("clip-path");
  const id = /url\(#([^)]+)\)/.exec(clip)[1];
  expect(await svg.locator(`clipPath[id="${id}"]`).count()).toBe(1);
  // The ids of the drawings do not collide.
  const ids = await page.locator(`${at("data-cards")} [id]`).evaluateAll((all) => all.map((n) => n.id));
  expect(new Set(ids).size).toBe(ids.length);
});

test("each drawing has a table of its data, shut until asked, and the page does not scroll sideways", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  const table = page.locator(`${at("data-table-shots")}`);
  await table.scrollIntoViewIfNeeded();
  await expect(table.locator("table")).toBeHidden();
  await table.locator("summary").click();
  await expect(table.locator("table")).toBeVisible();
  expect(await table.locator("caption").textContent()).toContain("44 shots");
  expect(await table.locator("tbody tr").count()).toBe(44);
  await noSidewaysScroll(page);
});

test("the Data section is in Japanese too", async ({ page }) => {
  await open(page, "?lang=ja&help=off");
  expect(await page.locator("#data-title").textContent()).toContain("データ");
  expect(await page.locator(`${at("data-cards")} svg.kyogijo desc`).first().textContent()).toContain("データ");
  await noSidewaysScroll(page);
});

test("the heat charts draw cells, zones and bands in a ramp, with a legend that is not cut to the surface and a table of their numbers", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  const cards = page.locator(`${at("data-cards")} figure.card`);
  const kinds = [[3, "heatmap"], [4, "zones"], [5, "zones"], [6, "contour"]];
  for (const [index, kind] of kinds) {
    const svg = cards.nth(index).locator("svg.kyogijo");
    await svg.scrollIntoViewIfNeeded();
    const layer = svg.locator(`g.ky-layer[data-kind="${kind}"]`).first();
    await expect(layer).toHaveAttribute("clip-path", /url\(#/);
    // Something is drawn, with a fill that is a colour and not none.
    const fills = await layer.locator("path[style*='fill:var(--ky-hv']").evaluateAll((all) => all.map((el) => getComputedStyle(el).fill));
    expect(fills.length).toBeGreaterThan(2);
    for (const fill of fills.filter((f) => f !== "none")) expect(fill).toMatch(/^rgb\(/);
    expect(new Set(fills).size).toBeGreaterThan(1);
    const legend = svg.locator('g[data-kind="legend"]');
    await expect(legend).toHaveCount(1);
    expect(await legend.getAttribute("clip-path")).toBeNull();
    expect(await legend.locator("text").count()).toBeGreaterThan(2);
    const box = await layer.boundingBox();
    expect(box.width).toBeGreaterThan(50);
  }
  // The zone chart's table has a row for each of the six zones, and the heat map's lists its hottest cells.
  const zones = page.locator(`${at("data-table-zones")}`);
  await zones.scrollIntoViewIfNeeded();
  await zones.locator("summary").click();
  expect(await zones.locator("tbody tr").count()).toBe(6);
  expect(await zones.locator("caption").textContent()).toContain("Zone chart of 520 shots");
  const heat = page.locator(`${at("data-table-heat")}`);
  await heat.locator("summary").click();
  expect(await heat.locator("tbody tr").count()).toBe(60);
  expect(await heat.locator("caption small").textContent()).toMatch(/The first 60 of \d+ rows/);
  await noSidewaysScroll(page);
});

test("the heat ramps change with the page's colour scheme: the same cells are lighter on a dark page", async ({ page }) => {
  await open(page, "?lang=en&help=off&theme=light");
  const first = page.locator(`${at("data-cards")} svg.kyogijo`).nth(3);
  await first.scrollIntoViewIfNeeded();
  const cell = first.locator("g.ky-layer[data-kind='heatmap'] path[style*='ky-hv']").last();
  const light = await cell.evaluate((el) => getComputedStyle(el).fill);
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  const dark = await cell.evaluate((el) => getComputedStyle(el).fill);
  expect(light).not.toBe(dark);
  const lum = (rgb) => rgb.match(/\d+/g).slice(0, 3).map(Number).reduce((a, b) => a + b, 0);
  // The most there is: dark ink on a light page, bright light on a dark one.
  expect(lum(dark)).toBeGreaterThan(lum(light));
});

test("the Data section's heat charts are in Japanese too", async ({ page }) => {
  await open(page, "?lang=ja&help=off");
  const svg = page.locator(`${at("data-cards")} svg.kyogijo`).nth(4);
  await svg.scrollIntoViewIfNeeded();
  expect(await svg.locator("desc").first().textContent()).toContain("ゾーン別集計");
  await noSidewaysScroll(page);
});
