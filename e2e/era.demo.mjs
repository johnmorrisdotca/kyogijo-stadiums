// The season control: a surface as it was in a past season, with the markings the rules put on it then.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open, svg } from "./demo.mjs";

const past = (page) => page.locator(`${at("era")} button[data-value="past"]`).click();
const season = async (page, year) => {
  await page.locator(at("era-year")).fill(String(year));
  await expect(page.locator(at("era-season"))).not.toHaveText("");
};
const count = (page, cls) => page.locator(`${at("stage")} .${cls}`).count();

test("the season control is for the sports that have a history, and starts on today", async ({ page }) => {
  await open(page, "?sport=nhl&lang=en&help=off");
  await expect(page.locator(at("era-year"))).toBeHidden();
  await expect(page.locator(`${at("era")} button[data-value="today"]`)).toHaveAttribute("aria-pressed", "true");
  await page.locator(`${at("sport")} button[data-value="ifaf"]`).click();
  await expect(page.locator(at("era"))).toBeHidden();
  await page.locator(`${at("sport")} button[data-value="nba"]`).click();
  await expect(page.locator(at("era"))).toBeVisible();
});

test("the rink has no centre red line before 1943–44 and has one from then on, and the address follows", async ({ page }) => {
  await open(page, "?sport=nhl&lang=en&help=off");
  expect(await count(page, "ky-dash")).toBe(1);
  await past(page);
  await expect(page.locator(at("era-year"))).toBeVisible();
  await season(page, 1942);
  await expect(page.locator(at("era-season"))).toHaveText("1942–43");
  expect(await count(page, "ky-dash")).toBe(0);
  expect(new URL(page.url()).searchParams.get("year")).toBe("1942");
  expect(await svg(page).locator("desc").textContent()).toContain("1942–43");
  await expect(page.locator(at("era-notes"))).toContainText("No centre red line");
  await season(page, 1943);
  expect(await count(page, "ky-dash")).toBe(1);
  await page.locator(`${at("era")} button[data-value="today"]`).click();
  expect(new URL(page.url()).searchParams.has("year")).toBe(false);
  await expect(page.locator(at("era-notes"))).toBeHidden();
});

test("a year in the address opens on that season, and the court has no three-point line before 1979–80", async ({ page }) => {
  await open(page, "?sport=nba&lang=en&help=off&year=1978");
  await expect(page.locator(at("era-season"))).toHaveText("1978–79");
  const arcs = (page_) => page_.locator(`${at("stage")} svg path.ky-line`).evaluateAll((all) => all.filter((n) => /^M0 3H/.test(n.getAttribute("d"))).length);
  expect(await arcs(page)).toBe(0);
  await season(page, 1979);
  expect(await arcs(page)).toBe(1);
});

test("a planned change is drawn only for its season, and says so", async ({ page }) => {
  await open(page, "?sport=cfl&lang=en&help=off&orientation=landscape");
  await past(page);
  await season(page, 2027);
  await expect(page.locator(at("era-notes"))).toContainText("not yet played");
  const box = await svg(page).evaluate((n) => n.viewBox.baseVal.width);
  await season(page, 2026);
  const today = await svg(page).evaluate((n) => n.viewBox.baseVal.width);
  expect(box).toBeLessThan(today);
});

test("the notes are in Japanese in Japanese, and the code to copy carries the year", async ({ page }) => {
  await open(page, "?sport=nfl&lang=ja&help=off&year=1960");
  await expect(page.locator(at("era-notes"))).toContainText("ハッシュマーク");
  await expect(page.locator(at("era-season"))).toHaveText("1960");
  expect(await svg(page).locator("desc").textContent()).toContain("1960シーズン");
  expect(await page.locator(at("embed-code")).textContent()).toContain('"year": 1960');
  await noSidewaysScroll(page);
});

test("every sport with a history draws at both ends of its range without a complaint", async ({ page }) => {
  for (const [sport, year] of [["nfl", 1920], ["cfl", 1958], ["nhl", 1917], ["nba", 1946], ["mlb", 1871], ["mlb", 1893]]) {
    const errors = await open(page, `?sport=${sport}&lang=en&help=off&year=${year}`);
    expect(errors).toEqual([]);
    expect(await page.locator(`${at("stage")} svg *`).count()).toBeGreaterThan(40);
  }
});
