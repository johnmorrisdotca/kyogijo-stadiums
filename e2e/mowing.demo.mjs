// The mowing pattern of the demo: a football field, a ballpark and a soccer pitch choose it, and the ballpark's diamonds (the crosshatch of an outfield) are drawn, kept in the address and in the code.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open, openGroups } from "./demo.mjs";

test("a ballpark, a football field and a soccer pitch have the mowing choice, and a surface with no grass does not", async ({ page }) => {
  const errors = await open(page, "?sport=mlb&park=t-mobile-park&lang=en&help=off&orientation=landscape");
  expect(errors).toEqual([]);
  await openGroups(page);
  await expect(page.locator("#mow-group")).toBeVisible();
  await expect(page.locator("#pattern button[data-value='diamonds']")).toHaveText("Diamonds");
  await expect(page.locator("#soccer-group")).toBeHidden();
  for (const sport of ["nfl", "soccer"]) {
    await page.locator(`${at("sport")} button[data-value="${sport}"]`).click();
    await expect(page.locator("#mow-group")).toBeVisible();
  }
  await page.locator(`${at("sport")} button[data-value="nhl"]`).click();
  await expect(page.locator("#mow-group")).toBeHidden();
});

test("the diamonds mow a ballpark with squares along the foul lines, cut to the fair ground, and the address and the code say so", async ({ page }) => {
  await open(page, "?sport=mlb&park=t-mobile-park&lang=en&help=off&orientation=landscape");
  await openGroups(page);
  const rings = await page.locator(`${at("stage")} svg.kyogijo .ky-ring`).count();
  expect(rings).toBe(1);
  await page.locator("#pattern button[data-value='diamonds']").click();
  const stripe = page.locator(`${at("stage")} svg.kyogijo path.ky-stripe`);
  await expect(stripe).toHaveCount(1);
  await expect(stripe).toHaveAttribute("clip-path", /url\(#.*-fair\)/);
  const d = await stripe.getAttribute("d");
  expect(d.split("z").length).toBeGreaterThan(40);
  expect(new URL(page.url()).searchParams.get("pattern")).toBe("diamonds");
  await page.reload();
  await page.waitForSelector(`${at("stage")} svg.kyogijo path.ky-stripe`);
  expect(await page.locator(`${at("stage")} svg.kyogijo path.ky-stripe`).getAttribute("d")).toBe(d);
  await expect(page.locator("#pattern button[data-value='diamonds']")).toHaveAttribute("aria-pressed", "true");
  await noSidewaysScroll(page);
});

test("the diamonds are Japanese in Japanese", async ({ page }) => {
  await open(page, "?sport=mlb&lang=ja&help=off&orientation=landscape");
  await openGroups(page);
  await expect(page.locator("#pattern button[data-value='diamonds']")).toHaveText("菱形");
});
