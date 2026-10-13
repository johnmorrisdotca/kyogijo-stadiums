// The league picker: a variant of each family, drawn from its own rulebook, and the address that follows it.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open, svg } from "./demo.mjs";

const pick = (page, id) => page.locator(at("league")).selectOption(id);
const width = (page) => svg(page).evaluate((n) => n.viewBox.baseVal.width);

test("the league row is for the sports that have leagues, and starts on the sport's own", async ({ page }) => {
  await open(page, "?sport=nba&lang=en&help=off&orientation=landscape");
  await expect(page.locator(at("league"))).toBeVisible();
  await expect(page.locator(at("league"))).toHaveValue("nba");
  await page.locator(`${at("sport")} button[data-value="soccer"]`).click();
  await expect(page.locator(at("league"))).toBeHidden();
});

test("a basketball league changes the court, the title and the address", async ({ page }) => {
  await open(page, "?sport=nba&lang=en&help=off&orientation=landscape");
  const nba = await width(page);
  await pick(page, "nfhs");
  expect(await width(page)).toBeLessThan(nba);
  await expect(svg(page)).toHaveAttribute("data-league", "nfhs");
  await expect(page.locator(`${at("league")} option:checked`)).toHaveText("High school (NFHS) basketball court");
  expect(new URL(page.url()).searchParams.get("league")).toBe("nfhs");
  await pick(page, "nba");
  expect(new URL(page.url()).searchParams.has("league")).toBe(false);
  await noSidewaysScroll(page);
});

test("a league in the address opens on it, a league the sport has not is left out, and it is drawn in Japanese too", async ({ page }) => {
  await open(page, "?sport=nhl&league=iihf&lang=en&help=off&orientation=landscape");
  await expect(page.locator(at("league"))).toHaveValue("iihf");
  await expect(svg(page)).toHaveAttribute("data-league", "iihf");
  await open(page, "?sport=nhl&league=fiba&lang=en&help=off");
  await expect(page.locator(at("league"))).toHaveValue("nhl");
  await open(page, "?sport=mlb&league=little-league&lang=ja&help=off");
  await expect(page.locator(`${at("league")} option:checked`)).toContainText("リトルリーグ");
  await expect(svg(page).locator("desc")).toContainText("塁間60フィート");
});

test("the season control follows a league that has a history, and hides for one that has none", async ({ page }) => {
  await open(page, "?sport=nba&league=wnba&lang=en&help=off");
  await expect(page.locator(at("era"))).toBeVisible();
  await page.locator(`${at("era")} button[data-value="past"]`).click();
  await page.locator(at("era-year")).fill("2003");
  await expect(page.locator(at("era-notes"))).toContainText("12 feet");
  await pick(page, "fiba");
  await expect(page.locator(at("era"))).toBeHidden();
});
