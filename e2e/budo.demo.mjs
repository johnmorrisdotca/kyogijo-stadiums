// The budo in the playground: the six sports, the controls that belong to each (shown for one and hidden for the rest), the drawing that follows them, a finger-wide tap, and the Kodokan in the atlas.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open, openGroups, svg, tap } from "./demo.mjs";

const drawn = (page) => svg(page).evaluate((node) => node.outerHTML.length);

test("each budo sport shows its own controls and hides the others'", async ({ page }) => {
  const errors = await open(page, "?sport=judo&lang=en&help=off");
  await openGroups(page);
  await expect(page.locator(at("budo-look"))).toBeVisible();
  await expect(page.locator(at("budo-areas"))).toBeVisible();
  await expect(page.locator(at("budo-hall"))).toBeVisible();
  await expect(page.locator(at("budo-officials"))).toBeVisible();
  await expect(page.locator(at("dojo-jo"))).toBeHidden();
  await expect(page.locator(at("budo-tassels"))).toBeHidden();
  await page.locator(`${at("sport")} button[data-value="dojo"]`).click();
  await expect(page.locator(at("dojo-jo"))).toBeVisible();
  await expect(page.locator(at("dojo-shinzen"))).toBeVisible();
  await expect(page.locator(at("budo-areas"))).toBeHidden();
  await expect(page.locator(at("budo-hall"))).toBeHidden();
  await page.locator(`${at("sport")} button[data-value="sumo"]`).click();
  await expect(page.locator(at("budo-tassels"))).toBeVisible();
  await expect(page.locator(at("budo-look"))).toBeHidden();
  await page.locator(`${at("sport")} button[data-value="kyudo"]`).click();
  await expect(page.locator(at("budo-chips"))).toBeHidden();
  expect(errors).toEqual([]);
});

test("a tap on a size or a chip redraws the dojo, the address follows, and the buttons are finger-wide", async ({ page }, testInfo) => {
  await open(page, "?sport=dojo&lang=en&help=off");
  await openGroups(page);
  const before = await drawn(page);
  await tap(page, `${at("dojo-jo")} button[data-value="100"]`, testInfo);
  await expect(page.locator(`${at("dojo-jo")} button[data-value="100"]`)).toHaveAttribute("aria-pressed", "true");
  expect(await drawn(page)).not.toBe(before);
  expect(page.url()).toContain("dojojo=100");
  await tap(page, at("dojo-shinzen"), testInfo);
  await expect(page.locator(at("dojo-shinzen"))).toHaveAttribute("aria-pressed", "true");
  expect(await svg(page).evaluate((node) => node.querySelectorAll(".ky-bud-shrine").length)).toBe(1);
  for (const id of ["dojo-shinzen"]) {
    const box = await page.locator(at(id)).boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(36);
  }
  await noSidewaysScroll(page);
});

test("the Kodokan is on the atlas with its floors, and tries its main dojo in the playground", async ({ page }, testInfo) => {
  const errors = await open(page, "?place=kodokan&lang=en&help=off");
  await expect(page.locator(at("atlas-floors"))).toBeVisible();
  await expect(page.locator(`${at("atlas-floors")} li`)).toHaveCount(6);
  await expect(page.locator(at("atlas-try-main-dojo-earlier"))).toBeVisible();
  await tap(page, at("atlas-try"), testInfo);
  await expect(page.locator(`${at("sport")} button[data-value="dojo"]`)).toHaveAttribute("aria-pressed", "true");
  expect(await svg(page).evaluate((node) => node.querySelectorAll(".ky-bud-banner").length)).toBe(1);
  expect(errors).toEqual([]);
});

test("the judo kata area is in the playground: the league in the address draws its three tapes and the judges' seats", async ({ page }) => {
  const errors = await open(page, "?sport=judo&league=ijf-kata&budoofficials=1&size=surface&lang=en&help=off");
  const count = (cls) => svg(page).evaluate((node, c) => node.querySelectorAll(`.${c}`).length, cls);
  // The centre tape and the two starting tapes, all white; the five judges' seats and the coach's chair; no blue tape.
  expect(await count("ky-bud-white-fill")).toBe(3);
  expect(await count("ky-bud-blue-fill")).toBe(0);
  expect(await count("ky-bud-seat")).toBe(6);
  expect(await svg(page).getAttribute("data-league")).toBe("ijf-kata");
  expect(errors).toEqual([]);
});
