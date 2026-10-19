// The tournament layouts page: a preset, a hall, the stadium switched on and off, the fit said in words, light and dark, Japanese, and nothing wider than the screen.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, serve } from "./demo.mjs";

async function open(page, query = "") {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  await page.goto(`http://kyogijo.test/halls.html${query}`);
  await page.waitForSelector('body[data-ready="true"] svg.kyogijo');
  return errors;
}

test("a layout is drawn to scale and the stadium is off until it is switched on", async ({ page }) => {
  const errors = await open(page, "?preset=curling-1x4&venue=nhl-ice-pad");
  const stage = page.locator(at("stage"));
  await expect(stage.locator("svg.kyogijo")).toHaveAttribute("data-layout", "curling-1x4");
  await expect(stage.locator(".ky-crowd")).toHaveCount(0);
  await expect(page.locator("#fit")).toContainText("it fits");
  await page.locator("#stadium").check();
  await expect(stage.locator(".ky-crowd")).toHaveCount(1);
  await expect(stage.locator("svg.kyogijo")).toHaveAttribute("data-stadium", "on");
  await page.locator("#stadium").uncheck();
  await expect(stage.locator(".ky-crowd")).toHaveCount(0);
  expect(errors).toEqual([]);
  await noSidewaysScroll(page);
});

test("a layout that does not fit says so, and the picture shows where it hangs over", async ({ page }) => {
  await open(page, "?preset=pickleball-4x4&venue=copper-box-arena");
  await expect(page.locator("#fit")).toContainText("does not fit");
  await expect(page.locator("#fit")).toHaveAttribute("data-fit", "false");
  await expect(page.locator(`${at("stage")} .ky-mu-over`)).toHaveCount(1);
  await page.locator("#venue").selectOption("");
  await expect(page.locator("#fit")).not.toContainText("does not fit");
});

test("the choices change the grid, the places and the names, and the table says the same", async ({ page }) => {
  await open(page, "?preset=tabletennis-4");
  const stage = page.locator(at("stage"));
  await expect(stage.locator("[data-cell]")).toHaveCount(4);
  await page.locator("#columns").fill("3");
  await page.locator("#columns").dispatchEvent("change");
  await expect(stage.locator("[data-cell]")).toHaveCount(6);
  await page.locator("#slots").uncheck();
  await expect(stage.locator(".ky-mu-slot")).toHaveCount(0);
  await page.locator("#labels").uncheck();
  await expect(stage.locator(".ky-mu-label")).toHaveCount(0);
  await page.locator("details summary").click();
  await expect(page.locator("#table table")).toContainText("Table 6");
});

test("it follows light and dark and speaks Japanese", async ({ page }) => {
  await open(page, "?preset=judo-1x3&lang=ja");
  await expect(page.locator("h1")).toHaveText("大会向けレイアウト");
  await expect(page).toHaveTitle("競技場 Kyogijo Stadiums：大会向けレイアウト");
  await expect(page.locator("#controls")).toHaveAttribute("aria-label", "レイアウトの選択");
  await expect(page.locator("#event")).toContainText("バクー");
  await expect(page.locator(`${at("stage")} svg`)).toContainText("第1試合場");
  await page.locator("#theme").selectOption("dark");
  await expect(page.locator(`${at("stage")} svg.kyogijo`)).toHaveAttribute("data-theme", "dark");
  await page.locator("#language").selectOption("en");
  await expect(page.locator("h1")).toHaveText("Tournament layouts");
  await expect(page).toHaveTitle("Kyogijo Stadiums: tournament layouts");
  await expect(page.locator("#controls")).toHaveAttribute("aria-label", "Layout choices");
});
