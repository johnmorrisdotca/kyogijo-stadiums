// The combat sports in the playground: the MMA cage shows its own controls (the look and the width) and hides the budō's, the drawing follows them, the address says it, and the cage stands up in 3D with its solid platform
// and its mesh fence.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open, openGroups, svg, tap } from "./demo.mjs";

const drawn = (page) => svg(page).evaluate((node) => node.outerHTML.length);

test("the cage shows the look and the width, and hides the controls of the other budo sports", async ({ page }) => {
  const errors = await open(page, "?sport=mma&lang=en&help=off");
  await openGroups(page);
  await expect(page.locator(at("budo-look"))).toBeVisible();
  await expect(page.locator(at("cage-size"))).toBeVisible();
  await expect(page.locator(at("budo-areas"))).toBeHidden();
  await expect(page.locator(at("budo-hall"))).toBeHidden();
  await expect(page.locator(at("budo-tassels"))).toBeHidden();
  await expect(page.locator(at("dojo-jo"))).toBeHidden();
  await page.locator(`${at("sport")} button[data-value="judo"]`).click();
  await expect(page.locator(at("cage-size"))).toBeHidden();
  await expect(page.locator(at("budo-areas"))).toBeVisible();
  expect(errors).toEqual([]);
});

test("a tap on a width redraws the cage, the address follows, and the buttons are finger-wide", async ({ page }, testInfo) => {
  await open(page, "?sport=mma&lang=en&help=off");
  await openGroups(page);
  expect(await svg(page).evaluate((node) => node.querySelectorAll(".ky-bud-pad").length)).toBe(8);
  const before = await drawn(page);
  await tap(page, `${at("cage-size")} button[data-value="25"]`, testInfo);
  await expect(page.locator(`${at("cage-size")} button[data-value="25"]`)).toHaveAttribute("aria-pressed", "true");
  expect(await drawn(page)).not.toBe(before);
  expect(page.url()).toContain("cagesize=25");
  expect(await svg(page).getAttribute("viewBox")).not.toBeNull();
  const box = await page.locator(`${at("cage-size")} button[data-value="25"]`).boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(36);
  await tap(page, `${at("budo-look")} button[data-value="black"]`, testInfo);
  expect(await svg(page).getAttribute("data-look")).toBe("black");
  await noSidewaysScroll(page);
});

test("the cage has its description in Japanese and the demo says it in both languages", async ({ page }) => {
  await open(page, "?sport=mma&lang=ja&help=off");
  expect(await svg(page).locator("desc").textContent()).toContain("総合格闘技のケージ");
  await open(page, "?sport=mma&lang=en&help=off");
  expect(await svg(page).locator("desc").textContent()).toContain("an eight-sided fenced area");
});

test("the cage stands up in 3D: a solid platform, eight padded posts and a fence of mesh, and the address keeps the width", async ({ page }) => {
  const errors = await open(page, "?sport=mma&view=3d&cagesize=25&lang=en&help=off");
  const stage = '[data-testid="stage"]';
  await expect(page.locator(`${stage} [data-part="deck-top"]`)).toHaveCount(1);
  await expect(page.locator(`${stage} [data-part^="deck-"]`)).toHaveCount(5);
  await expect(page.locator(`${stage} .ky-up-post`)).toHaveCount(16);
  expect(await page.locator(`${stage} .ky-up-net`).count()).toBe(12);
  expect(await page.locator(`${stage} .u-mesh`).count()).toBeGreaterThan(8);
  await noSidewaysScroll(page);
  expect(errors).toEqual([]);
});

test("the ring shows the look and the league, and draws its ropes and four corners; in 3D it has a solid platform, four posts and the ropes", async ({ page }) => {
  const errors = await open(page, "?sport=boxing&lang=en&help=off");
  await openGroups(page);
  await expect(page.locator(at("budo-look"))).toBeVisible();
  await expect(page.locator(at("cage-size"))).toBeHidden();
  await expect(page.locator(at("budo-areas"))).toBeHidden();
  expect(await svg(page).evaluate((node) => ["red", "blue", "white"].map((c) => node.querySelectorAll(`.ky-bud-corner-${c}`).length))).toEqual([1, 1, 2]);
  expect(await svg(page).evaluate((node) => node.querySelectorAll(".ky-bud-rope").length)).toBeGreaterThan(0);
  await open(page, "?sport=boxing&league=wbc-amateur&view=3d&lang=en&help=off");
  const stage = '[data-testid="stage"]';
  await expect(page.locator(`${stage} [data-part="deck-top"]`)).toHaveCount(1);
  await expect(page.locator(`${stage} .ky-up-post`)).toHaveCount(8);
  expect(await page.locator(`${stage} .ky-up-rail`).count()).toBeGreaterThan(60);
  await noSidewaysScroll(page);
  expect(errors).toEqual([]);
});
