// The demo's Charts section: a ready-made chart for each sport and the goal-mouth view, each with its key, its title and description, and a table
// that stands for it, in English and Japanese.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open } from "./demo.mjs";

const CARDS = ["nba", "nhl", "mlb", "nfl", "soccer", "goal"];

test("the Charts section draws a chart for each sport, with a key, a title and a description", async ({ page }) => {
  const errors = await open(page, "?lang=en&help=off");
  expect(errors).toEqual([]);
  const cards = page.locator(`${at("chart-cards")} figure.card`);
  await expect(cards).toHaveCount(CARDS.length);
  for (const [index, key] of CARDS.entries()) {
    const card = cards.nth(index);
    await expect(card).toHaveAttribute("data-chart", key);
    const svg = card.locator("svg.kyogijo");
    await svg.scrollIntoViewIfNeeded();
    expect(await svg.locator("title").first().textContent()).not.toBe("");
    expect(await svg.locator("desc").first().textContent()).toContain("Data:");
    const box = await svg.boundingBox();
    expect(box.width).toBeGreaterThan(100);
    expect(box.height).toBeGreaterThan(50);
    if (key !== "goal") {
      // The key is in the drawing, in the margin above the surface, and the marks differ in shape.
      expect(await svg.locator('g.ky-layer[id$="key-marks"] > *').count()).toBeGreaterThanOrEqual(2);
      expect(await svg.locator('g.ky-layer[id$="key-text"] text').count()).toBeGreaterThanOrEqual(2);
    }
  }
  await noSidewaysScroll(page);
});

test("the NBA chart colours its zones, the MLB chart draws balls beyond the fence over the ground, and the goal mouth shows the goal", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  const cards = page.locator(`${at("chart-cards")} figure.card`);
  const nba = cards.nth(0).locator("svg.kyogijo");
  await nba.scrollIntoViewIfNeeded();
  const fills = await nba.locator("g.ky-layer[data-kind='zones'] path[style*='ky-hv']").evaluateAll((all) => all.map((el) => getComputedStyle(el).fill));
  expect(fills.length).toBe(6);
  expect(new Set(fills).size).toBeGreaterThan(2);
  expect(await nba.locator('g[data-kind="legend"]').count()).toBe(1);
  const mlb = cards.nth(2).locator("svg.kyogijo");
  await mlb.scrollIntoViewIfNeeded();
  const beyond = mlb.locator('g.ky-layer[id$="-beyond"]');
  await expect(beyond).toHaveCount(1);
  expect(await beyond.getAttribute("clip-path")).toBeNull();
  const goal = cards.nth(5).locator("svg.kyogijo");
  await goal.scrollIntoViewIfNeeded();
  expect(await goal.locator("path.ky-goal").count()).toBe(1);
  expect(await goal.locator("g.ky-pts > *").count()).toBeGreaterThan(5);
});

test("each chart has a table, shut until asked", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  for (const key of CARDS) {
    const details = page.locator(at(`chart-table-${key}`));
    await details.scrollIntoViewIfNeeded();
    await expect(details.locator("table").first()).toBeHidden();
    await details.locator("summary").click();
    await expect(details.locator("table").first()).toBeVisible();
  }
  const zones = page.locator(at("chart-table-nba"));
  expect(await zones.locator("table[data-kind='zones'] tbody tr").count()).toBe(6);
  expect(await zones.locator("table caption").first().textContent()).toContain("Zone chart of 260 shots");
});

test("the Charts section is in Japanese too", async ({ page }) => {
  await open(page, "?lang=ja&help=off");
  expect(await page.locator("#charts-title").textContent()).toContain("チャート");
  const nba = page.locator(`${at("chart-cards")} svg.kyogijo`).first();
  expect(await nba.locator("title").first().textContent()).toBe("NBAのショットチャート");
  expect(await nba.locator("desc").first().textContent()).toContain("ゾーン別集計");
  await noSidewaysScroll(page);
});
