// The builder page: the four ways in with a sample of each, the starts by sport, Japanese, the way into the stage's Embed section, and nothing wider than the screen.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, serve, tap } from "./demo.mjs";

async function open(page, query = "") {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  await page.goto(`http://kyogijo.test/builder.html${query}`);
  await page.waitForSelector('body[data-ready="true"]');
  return errors;
}

test("shows a sample of each way in, and the start of a sport leads into the stage's Embed section", async ({ page }, testInfo) => {
  const errors = await open(page);
  await expect(page.locator(`${at("tabs")} button`)).toHaveCount(4);
  await expect(page.locator(at("sample"))).toContainText('import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums"');
  await tap(page, `${at("tabs")} button[data-way="element"]`, testInfo);
  await expect(page.locator(at("sample"))).toContainText("<kyogijo-field");
  await tap(page, `${at("tabs")} button[data-way="frame"]`, testInfo);
  await expect(page.locator(at("sample"))).toContainText("embed.html?sport=nhl");
  await expect(page.locator(`${at("starts")} a`)).toHaveCount(8);
  await expect(page.locator(`${at("starts")} a[data-sport="curling"]`)).toHaveAttribute("href", /\?sport=curling&lang=en&help=off#embed$/);
  expect(errors).toEqual([]);
  await noSidewaysScroll(page);
});

test("reads in Japanese, and the link into the stage keeps the language", async ({ page }) => {
  await open(page, "?lang=ja&sport=nba");
  await expect(page.locator("h1")).toHaveText("図を作って、コードをコピーする");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator(at("go"))).toHaveAttribute("href", /sport=nba&lang=ja&help=off#embed$/);
  await page.locator(at("language")).selectOption("en");
  await expect(page.locator("h1")).toHaveText("Build a drawing, copy the code");
});
