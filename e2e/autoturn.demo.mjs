// The Auto-turn button is the reader's own and it toggles, on every page that turns a venue: pressed while the view turns it stops it for good, with or without yaw, pitch and zoom in the address, and the pointer coming back over the view
// afterwards does not turn it again. The turn is read from the browser's own drawing of the floor, not from the button.
import { expect, test } from "@playwright/test";

import { serve } from "./demo.mjs";

const STAGE = '[data-testid="stage"]';
const PAGES = [
  ["district, the Kodokan, with yaw, pitch and zoom in the address", "district.html?venues=kodokan&context=0&view=3d&yaw=200&pitch=35&zoom=1.2"],
  ["district, Tokyo, with the buildings", "district.html?venues=tokyo-dome,korakuen-hall,kodokan&view=3d&yaw=150&pitch=55"],
  ["district, the default", "district.html?view=3d"],
  ["venues, with yaw, pitch and zoom in the address", "venues.html?venue=honda-center&view=3d&yaw=30&pitch=40&zoom=1.1"],
  ["stadiums", "stadiums.html?view=3d"],
  ["halls", "halls.html?view=3d"],
];

async function open(page, path) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  await page.goto(`http://kyogijo.test/${path}`);
  await page.waitForSelector('body[data-ready="true"]');
  await page.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
  return errors;
}

const floor = (page) => page.locator(`${STAGE} .ky-turn-floor`).first();
const transform = (page) => floor(page).evaluate((el) => getComputedStyle(el).transform);

/** Whether the view is turning: the floor's matrix is not the same a moment later. */
async function turning(page) {
  const a = await transform(page);
  await page.waitForTimeout(450);
  return a !== (await transform(page));
}

/** Press the button as the project does: a tap on a phone, a click with the mouse. */
async function press(page, button) {
  await button.scrollIntoViewIfNeeded();
  if (test.info().project.use.hasTouch === true) await button.tap();
  else await button.click();
}

for (const [name, path] of PAGES) {
  test(`Auto-turn starts and stops the turn on the ${name}, and stays stopped`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const errors = await open(page, path);
    const button = page.locator(`${STAGE} .ky-turn-controls button[data-act="play"]`).first();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    expect(await turning(page)).toBe(false);
    for (let round = 0; round < 3; round += 1) {
      await press(page, button);
      await expect(button).toHaveAttribute("aria-pressed", "true");
      expect(await turning(page)).toBe(true);
      await press(page, button);
      await expect(button).toHaveAttribute("aria-pressed", "false");
      await page.waitForTimeout(150);
      expect(await turning(page), `round ${round}: it stopped`).toBe(false);
    }
    expect(errors).toEqual([]);
  });

  test(`Auto-turn on the ${name} stays stopped when the pointer goes over the view afterwards, and the Space key toggles it once`, async ({ page }) => {
    test.skip(test.info().project.use.hasTouch === true, "a pointer that hovers");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await open(page, path);
    const view = page.locator(`${STAGE} .ky-turn-view`).first();
    const button = page.locator(`${STAGE} .ky-turn-controls button[data-act="play"]`).first();
    // The pointer over the view turns it; going to the button leaves the view and stops it; pressing the button turns it on, and pressing it again stops it.
    await view.hover();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await button.scrollIntoViewIfNeeded();
    await button.hover();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    // Back over the view: the reader stopped it, so the pointer does not start it.
    await view.hover();
    await page.waitForTimeout(200);
    await expect(button).toHaveAttribute("aria-pressed", "false");
    expect(await turning(page)).toBe(false);
    await page.mouse.move(2, 2);
    // The Space key on the view toggles once, each way.
    await view.focus();
    await page.keyboard.press("Space");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    expect(await turning(page)).toBe(true);
    await page.keyboard.press("Space");
    await expect(button).toHaveAttribute("aria-pressed", "false");
    expect(await turning(page)).toBe(false);
    // And the button, focused, toggles once with Enter and with Space.
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await page.keyboard.press("Space");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Space");
    await expect(button).toHaveAttribute("aria-pressed", "false");
    expect(await turning(page)).toBe(false);
  });
}

test("the district's Auto-turn goes on across a change of choice and stops when pressed, with yaw, pitch and zoom in the address", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors = await open(page, "district.html?venues=kodokan&context=0&view=3d&yaw=200&pitch=35&zoom=1.2");
  const button = page.locator(`${STAGE} .ky-turn-controls button[data-act="play"]`).first();
  await press(page, button);
  expect(await turning(page)).toBe(true);
  // Another choice draws the scene again; the turn goes on and the button still stops it.
  await page.locator("#building").selectOption("solid");
  await expect(button).toHaveAttribute("aria-pressed", "true");
  expect(await turning(page)).toBe(true);
  await press(page, button);
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await page.waitForTimeout(150);
  expect(await turning(page)).toBe(false);
  await page.locator("#building").selectOption("none");
  await page.waitForTimeout(300);
  await expect(page.locator(`${STAGE} .ky-turn-controls button[data-act="play"]`).first()).toHaveAttribute("aria-pressed", "false");
  expect(await turning(page)).toBe(false);
  expect(errors).toEqual([]);
});
