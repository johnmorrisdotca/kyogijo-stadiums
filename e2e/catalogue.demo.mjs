// The catalogue page: the leagues' coverage, the three tabs, the sport and group chips, the search, the pages of cards, the pins on the map, Japanese and dark, and nothing wider than the screen.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, serve, tap } from "./demo.mjs";

async function open(page, query = "") {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  await page.goto(`http://kyogijo.test/catalogue.html${query}`);
  await page.waitForSelector('body[data-ready="true"] [data-testid="card"]');
  return errors;
}

test("shows the supported venues a page at a time, the ones drawn in their buildings first, with the leagues' coverage", async ({ page }, testInfo) => {
  const errors = await open(page);
  await expect(page.locator(`${at("coverage")} .cov`)).toHaveCount(5);
  await expect(page.locator(`${at("coverage")} .cov[data-league="nhl"]`)).toContainText("32 / 32");
  await expect(page.locator(at("card"))).toHaveCount(24);
  await expect(page.locator(at("card")).first().locator(".badge")).toHaveText("In its building");
  await expect(page.locator(at("found"))).toContainText("331 venues");
  await tap(page, at("next"), testInfo);
  await expect(page.locator(at("page"))).toContainText("Page 2 of");
  await expect(page).toHaveURL(/page=2/);
  // A supported card links to its drawing.
  await expect(page.locator(`${at("card")} a[data-testid="see"]`).first()).toHaveAttribute("href", /^\.\/(stadiums\.html|venues\.html|\?place=)/);
  await page.waitForSelector(`${at("map")}[data-ready="true"] .cat-overlay circle`);
  expect(errors).toEqual([]);
  await noSidewaysScroll(page);
});

test("the tabs, the chips and the search narrow the cards and the pins together", async ({ page }, testInfo) => {
  await open(page, "?tab=wanted");
  await page.waitForSelector(`${at("map")}[data-ready="true"] .cat-overlay circle`);
  await tap(page, `${at("sports")} button[data-value="motor-racing"]`, testInfo);
  const cards = page.locator(at("card"));
  await expect(cards.first().locator(".badge")).toHaveText("Needs a circuit surface first");
  await expect(page).toHaveURL(/sport=motor-racing/);
  await page.locator(at("search")).fill("suzuka");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Suzuka Circuit");
  await expect(page.locator(`${at("map")} .cat-overlay circle`)).not.toHaveCount(0);
  await page.locator(at("search")).fill("");
  await tap(page, `${at("tabs")} button[data-tab="working-on"]`, testInfo);
  await expect(cards).toHaveCount(10);
  await expect(cards.first()).toContainText("KYOGIJO-STADIUMS-22");
  await expect(page.locator(at("pager"))).toBeHidden();
  // A league's card opens its venues.
  await tap(page, `${at("coverage")} .cov[data-league="nfl"]`, testInfo);
  await expect(page.locator(`${at("tabs")} button[data-tab="wanted"]`)).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(`${at("groups")} button[data-value="nfl"]`)).toHaveAttribute("aria-pressed", "true");
  await expect(cards.first().locator(".badge")).toHaveText("Wanted");
});

test("is in Japanese and dark on request, names and all", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  const errors = await open(page, "?lang=ja&q=lambeau&tab=wanted");
  await expect(page.locator("h1")).toHaveText("会場カタログ");
  await expect(page.locator(at("card"))).toHaveCount(1);
  await expect(page.locator(at("card")).first()).toContainText("ランボー・フィールド");
  await expect(page.locator(at("card")).first()).toContainText("グリーンベイ");
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(background).toBe("rgb(13, 18, 24)");
  expect(errors).toEqual([]);
  await noSidewaysScroll(page);
});
