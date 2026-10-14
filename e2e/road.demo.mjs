// The demo's Road to the final section: the two finalists of a made-up tournament in four sizes, a play-off series, and the round mark on a pitch and in a badge,
// each with a title and a description, a table that stands for it, and the words in English and Japanese.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open } from "./demo.mjs";

const ROADS = ["card", "wide", "phone", "series"];
const MARKS = ["mark_wide", "mark_tall", "mark_badge"];

test("the section draws the four roads and the round marks, each with a title and a description", async ({ page }) => {
  const errors = await open(page, "?lang=en&help=off");
  expect(errors).toEqual([]);
  const cards = page.locator(`${at("road-cards")} figure.card`);
  await expect(cards).toHaveCount(ROADS.length + MARKS.length);
  for (const [index, key] of [...ROADS, ...MARKS].entries()) {
    const card = cards.nth(index);
    await expect(card).toHaveAttribute("data-road", key);
    const svg = card.locator("svg.kyogijo");
    await svg.scrollIntoViewIfNeeded();
    expect(await svg.locator("title").first().textContent()).not.toBe("");
    expect(await svg.locator("desc").first().textContent()).not.toBe("");
    const box = await svg.boundingBox();
    expect(box.width).toBeGreaterThan(100);
    expect(box.height).toBeGreaterThan(30);
  }
  await noSidewaysScroll(page);
});

test("a road is round marks with their rings, the score between them, the rounds down the middle and the group at the foot", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  const card = page.locator(`${at("road-cards")} figure[data-road="card"] svg.kyogijo-road`);
  await card.scrollIntoViewIfNeeded();
  expect(await card.getAttribute("data-size")).toBe("card");
  expect(await card.locator("g.ky-mark").count()).toBe(2 + 2 * 8 + 6);
  expect(await card.locator("g.ky-mark image").count()).toBe(2 + 2 * 8 + 6);
  expect(await card.locator("text.ky-r-lab").allTextContents()).toEqual(["Semi-final", "Quarter-final", "Round of 16", "Round of 32", "Group stage"]);
  expect(await card.locator("text.ky-r-sub").allTextContents()).toContain("5-4 pens");
  // The flags are circles: each picture is clipped, and the rings are painted.
  const ring = await card.locator("circle.ky-mark-ring").first().evaluate((el) => getComputedStyle(el).strokeWidth);
  expect(Number.parseFloat(ring)).toBeGreaterThan(0);
  const dim = await card.locator("g.ky-r-dim").first().evaluate((el) => Number(getComputedStyle(el).opacity));
  expect(dim).toBeLessThan(1);
  const phone = page.locator(`${at("road-cards")} figure[data-road="phone"] svg.kyogijo-road`);
  expect(await phone.getAttribute("data-theme")).toBe("dark");
  const ground = await phone.locator("rect.ky-r-bg").evaluate((el) => getComputedStyle(el).fill);
  expect(ground).not.toBe(await card.locator("rect.ky-r-bg").evaluate((el) => getComputedStyle(el).fill));
});

test("the round mark on a pitch clips each flag and keeps it upright where the names are turned", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  const wide = page.locator(`${at("road-cards")} figure[data-road="mark_wide"] svg.kyogijo`);
  await wide.scrollIntoViewIfNeeded();
  expect(await wide.locator("g.ky-mark").count()).toBe(2);
  expect(await wide.locator("g.ky-mark").first().getAttribute("transform")).toContain("rotate(");
  expect(await wide.locator("image.ky-logo").count()).toBe(2);
  const badge = page.locator(`${at("road-cards")} figure[data-road="mark_badge"] svg.kyogijo`);
  await badge.scrollIntoViewIfNeeded();
  expect(await badge.locator("g.ky-mark").count()).toBe(2);
});

test("each road has a table, shut until asked", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  for (const key of ROADS) {
    const details = page.locator(at(`road-table-${key}`));
    await details.scrollIntoViewIfNeeded();
    await expect(details.locator("table").first()).toBeHidden();
    await details.locator("summary").click();
    await expect(details.locator("table").first()).toBeVisible();
  }
  const card = page.locator(at("road-table-card"));
  expect(await card.locator("table[data-kind='road'] tbody tr").count()).toBe(7 + 7 + 1);
  expect(await card.locator("table caption").first().textContent()).toContain("Aurelia and Calvara");
});

test("the section is in Japanese too, from the nations' names to the table", async ({ page }) => {
  await open(page, "?lang=ja&help=off");
  expect(await page.locator("#road-title").textContent()).toBe("決勝への道");
  const card = page.locator(`${at("road-cards")} figure[data-road="card"] svg.kyogijo-road`);
  await card.scrollIntoViewIfNeeded();
  expect(await card.locator("text.ky-r-lab").allTextContents()).toEqual(["準決勝", "準々決勝", "ラウンド16", "ラウンド32", "グループステージ"]);
  expect(await card.locator("text.ky-r-name").first().textContent()).toBe("アウレリア");
  expect(await card.locator("title").first().textContent()).toContain("決勝への道");
  const details = page.locator(at("road-table-card"));
  await details.locator("summary").click();
  expect(await details.locator("th[scope='col']").first().textContent()).toBe("チーム");
  await noSidewaysScroll(page);
});
