// The demo's Data section: a shot map on the rink, a pass map on the field and a spray chart on a ballpark, drawn from made-up
// data, clipped to the surface, with a table that stands for each.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open } from "./demo.mjs";

const CARDS = [["shots", "nhl", 44], ["passes", "nfl", 20], ["spray", "mlb", 64]];

test("the Data section draws a map on each surface, with its marks, its title and its description", async ({ page }) => {
  const errors = await open(page, "?lang=en&help=off");
  expect(errors).toEqual([]);
  const cards = page.locator(`${at("data-cards")} figure.card`);
  await expect(cards).toHaveCount(3);
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
  // The ids of the three drawings do not collide.
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
