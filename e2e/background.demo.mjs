// The demo's Background menu: none by default, the family's twenty-five when asked, in the page's light or dark, and presentation only: the surface the package draws is the same string with or without one.
import { expect, test } from "@playwright/test";

import { at, open, svg } from "./demo.mjs";

const felt = (page) => page.locator("#felt").evaluate((node) => node.style.backgroundImage);

test("the menu lists None and the family's twenty-five, and no background is drawn, or loaded, until one is chosen", async ({ page }) => {
  const asked = [];
  page.on("request", (request) => asked.push(new URL(request.url()).pathname));
  const errors = await open(page, "?sport=nhl&lang=en&help=off");
  expect(await felt(page)).toBe("");
  expect(asked).not.toContain("/family-backgrounds.js");
  const names = await page.locator(`${at("background")} option`).evaluateAll((all) => all.map((o) => o.value));
  const served = await page.evaluate(async () => (await import("/family-backgrounds.js")).BACKGROUND_PRESETS);
  expect(served).toHaveLength(25);
  expect(names).toEqual(["", ...served]);
  expect(errors).toEqual([]);
});

test("a chosen background is a picture behind the stage in the page's look, and the drawing's SVG is the same string with it and without it", async ({ page }) => {
  const errors = await open(page, "?sport=nhl&lang=en&help=off&orientation=landscape&theme=light");
  const plain = await svg(page).evaluate((node) => node.outerHTML);
  await page.locator(at("background")).selectOption("ice");
  await expect.poll(() => felt(page)).toContain("data:image/svg+xml");
  expect(new URL(page.url()).searchParams.get("background")).toBe("ice");
  const light = await felt(page);
  expect(await svg(page).evaluate((node) => node.outerHTML)).toBe(plain);
  // The look: dark is another picture, and the stage's text takes the ink of the background.
  const ink = await page.locator("#felt").evaluate((node) => node.style.color);
  await page.locator(`${at("theme")} button[data-value="dark"]`).click();
  await expect.poll(() => felt(page)).not.toBe(light);
  expect(await page.locator("#felt").evaluate((node) => node.style.color)).not.toBe(ink);
  expect(await svg(page).evaluate((node) => node.outerHTML)).toBe(plain);
  // Another background: still only a picture behind.
  await page.locator(at("background")).selectOption("floodlights");
  await expect.poll(() => page.locator("#felt").getAttribute("data-background")).toBe("floodlights");
  expect(await svg(page).evaluate((node) => node.outerHTML)).toBe(plain);
  // None takes it away again, and the address with it.
  await page.locator(at("background")).selectOption("");
  await expect.poll(() => felt(page)).toBe("");
  expect(new URL(page.url()).searchParams.has("background")).toBe(false);
  expect(await svg(page).evaluate((node) => node.outerHTML)).toBe(plain);
  expect(errors).toEqual([]);
});

test("the address names the background, and a name the menu does not have is none", async ({ page }) => {
  const errors = await open(page, "?sport=nba&lang=en&help=off&background=glow&theme=dark");
  await expect(page.locator(at("background"))).toHaveValue("glow");
  await expect.poll(() => felt(page)).toContain("data:image/svg+xml");
  await page.goto("http://kyogijo.test/?lang=en&help=off&background=nope");
  await page.waitForSelector(`${at("stage")}[data-ready="true"] svg.kyogijo`);
  await expect(page.locator(at("background"))).toHaveValue("");
  expect(await felt(page)).toBe("");
  expect(errors).toEqual([]);
});
