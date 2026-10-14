// The demo's Round marks section: a country against a country on a pitch, wide and tall, and in a badge, each flag in a circle with a ring, with a title, a description
// and the words in English and Japanese. Where the words are turned the flag turns with them.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open } from "./demo.mjs";

const MARKS = ["mark_wide", "mark_tall", "mark_badge"];

test("the section draws the round marks on a wide pitch, a tall one and a badge, each with a title and a description", async ({ page }) => {
  const errors = await open(page, "?lang=en&help=off");
  expect(errors).toEqual([]);
  const cards = page.locator(`${at("mark-cards")} figure.card`);
  await expect(cards).toHaveCount(MARKS.length);
  for (const [index, key] of MARKS.entries()) {
    const card = cards.nth(index);
    await expect(card).toHaveAttribute("data-mark", key);
    const svg = card.locator("svg.kyogijo");
    await svg.scrollIntoViewIfNeeded();
    expect(await svg.locator("title").first().textContent()).not.toBe("");
    expect(await svg.locator("desc").first().textContent()).not.toBe("");
    expect(await svg.locator("g.ky-mark").count()).toBe(2);
    const box = await svg.boundingBox();
    expect(box.width).toBeGreaterThan(100);
    expect(box.height).toBeGreaterThan(30);
  }
  await noSidewaysScroll(page);
});

test("the round mark on a pitch clips each flag and turns it with the names where they are turned", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  const wide = page.locator(`${at("mark-cards")} figure[data-mark="mark_wide"] svg.kyogijo`);
  await wide.scrollIntoViewIfNeeded();
  expect(await wide.locator("g.ky-mark").count()).toBe(2);
  // The mark lies in its banner's turn and has none of its own: it turns with the name.
  expect(await wide.locator("g.ky-mark").first().getAttribute("transform")).toBeNull();
  expect(await wide.locator("g.ky-banner").first().getAttribute("transform")).toContain("rotate(-90)");
  expect(await wide.locator("image.ky-logo").count()).toBe(2);
});

test("the section is in Japanese too", async ({ page }) => {
  await open(page, "?lang=ja&help=off");
  expect(await page.locator("#marks-title").textContent()).toBe("丸いマーク");
  const card = page.locator(`${at("mark-cards")} figure[data-mark="mark_wide"] svg.kyogijo`);
  await card.scrollIntoViewIfNeeded();
  expect(await card.locator("g.ky-banner text.ky-name").first().textContent()).toBe("カナダ");
  await noSidewaysScroll(page);
});
