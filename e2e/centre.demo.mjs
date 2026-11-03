// Getting a stadium back to the middle, with real pointers.
// The 3D view here is the package's own (`mountKyogijoTurn`), which turns, tips and zooms about the middle of the view and has no pan: a drag turns, it never moves the stadium, so it cannot be dragged out of
// sight and there is no Centre button to add. What brings a turned and zoomed view back is Reset (and the 0 and Home keys), which these tests hold.
// The family's drag rule (kazoku-ui docs/drag-rule.md) is held in turn.demo.mjs by the position of the nearest part of the surface, not by kazoku-ui's shared e2e/ground.mjs: that helper slides the middle of a picture
// over the next one, and a stadium turns about its own middle, so the ground there does not move.
import { expect, test } from "@playwright/test";

import { at, open } from "./demo.mjs";

const STAGE = at("stage");
const VIEW = `${STAGE} .ky-turn-view`;
const floorMatrix = (page) => page.locator(`${STAGE} .ky-turn-floor`).evaluate((el) => el.style.transform);
const reset = (page) => page.locator(`${STAGE} .ky-turn-controls button[data-act="reset"]`);
/** Whether the middle of the view is over the floor's box: a view that only turns, tips and zooms about its middle keeps the stadium there, however it is dragged. */
const overMiddle = (page) =>
  page.evaluate(() => {
    const view = document.querySelector('[data-testid="stage"] .ky-turn-view').getBoundingClientRect();
    const floor = document.querySelector('[data-testid="stage"] .ky-turn-floor').getBoundingClientRect();
    const x = view.left + view.width / 2;
    const y = view.top + view.height / 2;
    return floor.left <= x && x <= floor.right && floor.top <= y && y <= floor.bottom;
  });
const dragFar = async (page, dx, dy) => {
  const view = page.locator(VIEW);
  await view.scrollIntoViewIfNeeded();
  const box = await view.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 3;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(x + (dx * i) / 8, y + (dy * i) / 8);
  await page.mouse.up();
};

test("a drag cannot take the stadium out of the view, and Reset and the Home key put the view back as it opened", async ({ page }, testInfo) => {
  test.skip(testInfo.project.use.hasTouch === true, "a mouse drags: the touch tests are in turn.demo.mjs");
  await open(page, "?sport=nhl&view=3d&lang=en&help=off");
  const opened = await floorMatrix(page);
  expect(await overMiddle(page)).toBe(true);
  for (let i = 0; i < 6; i++) await page.locator(`${STAGE} .ky-turn-controls button[data-act="zoom-in"]`).click();
  for (const [dx, dy] of [[4000, 0], [-8000, 0], [0, 4000], [0, -8000], [5000, 5000]]) {
    await dragFar(page, dx, dy);
    // Turning and tipping move nothing sideways: the middle of the view stays over the stadium.
    expect(await overMiddle(page), `after a drag of ${dx},${dy} the middle of the view is still over the stadium`).toBe(true);
  }
  expect(await floorMatrix(page)).not.toBe(opened);
  await reset(page).click();
  await expect.poll(() => floorMatrix(page)).toBe(opened);
  // The same with the key.
  await page.locator(`${STAGE} .ky-turn-controls button[data-act="turn-right"]`).click();
  await page.locator(`${STAGE} .ky-turn-controls button[data-act="zoom-in"]`).click();
  await expect.poll(() => floorMatrix(page)).not.toBe(opened);
  await page.locator(VIEW).focus();
  await page.keyboard.press("Home");
  await expect.poll(() => floorMatrix(page)).toBe(opened);
});
