// The table tennis playing area in the playground: the table in its 14 m by 7 m area, the surrounds, the umpires' chairs, the kinds of event in the address, and the area in 3D with its surrounds standing round it.
import { expect, test } from "@playwright/test";

import { open, svg } from "./demo.mjs";

const STAGE = '[data-testid="stage"]';

test("a table tennis table is drawn in its playing area, with surrounds and the umpires' places", async ({ page }) => {
  const errors = await open(page, "?sport=tabletennis&size=surface&lang=en&help=off");
  const count = (cls) => svg(page).evaluate((node, c) => node.querySelectorAll(`.${c}`).length, cls);
  expect(await count("ky-wall")).toBe(4);
  expect(await count("ky-chair")).toBe(2);
  expect(await count("ky-free")).toBe(1);
  // The area is 14 m by 7 m: twice as long as it is wide.
  const free = await svg(page).evaluate((node) => {
    const rect = node.querySelector("rect.ky-free");
    return { w: Number(rect.getAttribute("width")), h: Number(rect.getAttribute("height")) };
  });
  expect(free.w / free.h).toBeCloseTo(2, 1);
  expect(free.w / 3.28084).toBeCloseTo(14, 1);
  expect(errors).toEqual([]);
});

test("the area has its surrounds standing round it in 3D", async ({ page }) => {
  const errors = await open(page, "?sport=tabletennis&size=surface&view=3d&viewpoint=corner&lang=en&help=off");
  await expect(page.locator(`${STAGE} .ky-turn-view`)).toBeVisible();
  const surrounds = await page.locator(`${STAGE} [data-part^="surround-"]`).count();
  expect(surrounds).toBeGreaterThanOrEqual(4);
  expect(await page.locator(`${STAGE} [data-part^="chair-"]`).count()).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
