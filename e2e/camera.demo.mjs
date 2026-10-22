// The camera a reader has chosen stays when the page changes what it shows: another venue or district, another stadium or configuration, another layout of halls, the roof, and flat and back. The turn,
// tilt and zoom (and whether it turns) go on from where they were, and the turn made by hand is in the address as yaw, pitch and zoom.
import { expect, test } from "@playwright/test";

import { serve } from "./demo.mjs";

const STAGE = '[data-testid="stage"]';
const VIEW = `${STAGE} .ky-turn-view`;

async function open(page, path, query = "") {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  await page.goto(`http://kyogijo.test/${path}${query}`);
  await page.waitForSelector('body[data-ready="true"]');
  await page.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
  return errors;
}

/** The turn the reader gave the view with the view's own buttons: round, tipped and in. */
async function turnIt(page) {
  for (const act of ["turn-right", "turn-right", "turn-right", "raise", "zoom-in", "zoom-in"]) await page.locator(`.ky-turn-controls button[data-act="${act}"]`).click();
  await expect(page.locator(".ky-turn")).toHaveAttribute("data-preset", "custom");
}

/** Where the view is: the address's numbers, and the directions the floor's two sides have on the screen, as the browser drew them (a different venue is a different size, so the lengths are not compared). */
async function camera(page) {
  const params = new URL(page.url()).searchParams;
  const sides = await page.locator(`${STAGE} .ky-turn-floor`).evaluate((el) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    const unit = (a, b, c) => { const l = Math.hypot(a, b, c) || 1; return [a / l, b / l, c / l]; };
    return [...unit(m.m11, m.m12, m.m13), ...unit(m.m21, m.m22, m.m23)];
  });
  return { yaw: params.get("yaw"), pitch: params.get("pitch"), zoom: params.get("zoom"), sides };
}

function same(a, b) {
  expect(b.yaw).toBe(a.yaw);
  expect(b.pitch).toBe(a.pitch);
  expect(b.zoom).toBe(a.zoom);
  a.sides.forEach((value, i) => expect(Math.abs(b.sides[i] - value)).toBeLessThan(0.03));
}

test("a district keeps the camera when the venues change, and when it goes flat and back", async ({ page }) => {
  const errors = await open(page, "district.html", "?view=3d");
  await turnIt(page);
  const before = await camera(page);
  expect(before.yaw).not.toBeNull();
  expect(before.zoom).not.toBeNull();
  const venues = new URL(page.url()).searchParams.get("venues");
  await page.locator('#tabs button[data-preset="alone"]').click();
  await expect.poll(() => new URL(page.url()).searchParams.get("venues")).not.toBe(venues);
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(1);
  same(before, await camera(page));
  // The roof is a setting of the mount, so it draws the scene again: the camera stays.
  await page.locator("#roof").uncheck();
  same(before, await camera(page));
  // A box that is not the viewpoint does not move it either.
  await page.locator("#labels").check();
  same(before, await camera(page));
  await page.locator("#view").selectOption("2d");
  await expect(page.locator(`${STAGE} svg.ky-district`)).toHaveCount(1);
  await page.locator("#view").selectOption("3d");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(1);
  same(before, await camera(page));
  // A viewpoint chosen from the list does move it, and takes the numbers out of the address.
  await page.locator("#viewpoint").selectOption("end");
  expect(new URL(page.url()).searchParams.get("yaw")).toBeNull();
  expect(new URL(page.url()).searchParams.get("viewpoint")).toBe("end");
  expect(errors).toEqual([]);
});

test("a district opens on the camera the address names, and keeps the auto-turn going across a change of venues", async ({ page }) => {
  // The auto-turn is not started for a reader who prefers reduced motion, so this one does not.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors = await open(page, "district.html", "?view=3d&yaw=40&pitch=50&zoom=1.5");
  const opened = await camera(page);
  expect(opened.yaw).toBe("40");
  expect(opened.zoom).toBe("1.5");
  // Where the page was opened is where the next view is opened.
  await page.locator('#tabs button[data-preset="alone"]').click();
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(1);
  same(opened, await camera(page));
  // Turning on: Play stays pressed across the change.
  await page.locator('button[data-act="play"]').click();
  await expect(page.locator('button[data-act="play"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator('#tabs button[data-preset="pair"]').click();
  await expect(page.locator('button[data-act="play"]')).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

test("the stadiums page keeps the camera for another stadium, another configuration and the roof", async ({ page }) => {
  const errors = await open(page, "stadiums.html", "?view=3d");
  await turnIt(page);
  const before = await camera(page);
  expect(before.yaw).not.toBeNull();
  await page.locator('#stadium-tabs button[data-stadium="lumen-field"]').click();
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(1);
  expect(new URL(page.url()).searchParams.get("stadium")).toBe("lumen-field");
  same(before, await camera(page));
  await page.locator('#tabs button[data-config="soccer"]').click();
  expect(new URL(page.url()).searchParams.get("config")).toBe("soccer");
  same(before, await camera(page));
  await page.locator("#roof").check();
  same(before, await camera(page));
  // A change of the boards or the theme draws the same view again and leaves the camera.
  await page.locator("#boards").check();
  same(before, await camera(page));
  expect(errors).toEqual([]);
});

test("the venues page keeps the camera for another venue and across the flat view", async ({ page }) => {
  const errors = await open(page, "venues.html", "?view=3d");
  await turnIt(page);
  const before = await camera(page);
  expect(before.yaw).not.toBeNull();
  const first = await page.locator("#tabs button[data-venue]").nth(1).getAttribute("data-venue");
  await page.locator("#tabs button[data-venue]").nth(1).click();
  await expect(page.locator(`#tabs button[data-venue="${first}"]`)).toHaveAttribute("aria-selected", "true");
  same(before, await camera(page));
  await page.locator('[data-testid="view-2d"]').click();
  await page.locator('[data-testid="view-3d"]').click();
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(1);
  same(before, await camera(page));
  expect(errors).toEqual([]);
});

test("the halls page keeps the camera for another layout and across the flat view", async ({ page }) => {
  const errors = await open(page, "halls.html", "?preset=badminton-1x4&view=3d");
  await turnIt(page);
  const before = await camera(page);
  expect(before.yaw).not.toBeNull();
  await page.locator("#preset").selectOption("tabletennis-4");
  await expect(page.locator(VIEW)).toHaveCount(1);
  expect(new URL(page.url()).searchParams.get("preset")).toBe("tabletennis-4");
  same(before, await camera(page));
  await page.locator("#view").selectOption("flat");
  await page.locator("#view").selectOption("3d");
  await expect(page.locator(VIEW)).toHaveCount(1);
  same(before, await camera(page));
  expect(errors).toEqual([]);
});
