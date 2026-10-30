// The roof choice on every page that has a 3D view of a venue: a pill in the demo's own style (not a browser checkbox), kept in the address under the name `roof`, off or on as that page's reader expects
// (off while looking at the field, on among a district's streets), and restored from the address.
import { expect, test } from "@playwright/test";

import { serve } from "./demo.mjs";

async function open(page, path) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  await page.goto(`http://kyogijo.test/${path}`);
  await page.waitForSelector(".ky-turn, .kf-3d .ky-turn", { state: "attached", timeout: 15000 });
  return errors;
}

const roofParam = (page) => new URL(page.url()).searchParams.get("roof");
const roofs = (page) => page.locator(".ky-turn .ky-up-roof").count();

/** A pill, not a browser checkbox: the control is a label with a border, a rounded shape and a ground of its own, at least 48 px high. */
async function isPill(label) {
  const look = await label.evaluate((el) => {
    const s = getComputedStyle(el);
    return { radius: parseFloat(s.borderTopLeftRadius), border: parseFloat(s.borderTopWidth), height: el.getBoundingClientRect().height };
  });
  expect(look.radius).toBeGreaterThan(20);
  expect(look.border).toBeGreaterThanOrEqual(2);
  expect(look.height).toBeGreaterThanOrEqual(47);
}

test("the stadiums page: Roof is a pill, off by default, in the address, and raises the walls it stands on", async ({ page }) => {
  const errors = await open(page, "stadiums.html?view=3d");
  await isPill(page.locator("#roof-row"));
  await expect(page.locator("#roof")).not.toBeChecked();
  expect(await roofs(page)).toBe(0);
  await page.locator("#roof").check();
  await expect.poll(() => roofs(page)).toBeGreaterThan(0);
  await expect(page.locator("#walls")).toBeChecked();
  expect(roofParam(page)).toBe("1");
  // Walls off leaves the roof alone; the address says so.
  await page.locator("#walls").uncheck();
  await expect.poll(() => new URL(page.url()).searchParams.get("walls")).toBe("0");
  expect(await roofs(page)).toBeGreaterThan(0);
  await page.locator("#roof").uncheck();
  await expect.poll(() => roofs(page)).toBe(0);
  expect(roofParam(page)).toBeNull();
  expect(errors).toEqual([]);
});

test("the stadiums page reads the address: roof=1 alone is the roof and the walls, roof=1&walls=0 the roof alone", async ({ page }) => {
  await open(page, "stadiums.html?view=3d&roof=1");
  await expect(page.locator("#walls")).toBeChecked();
  await page.goto("http://kyogijo.test/stadiums.html?view=3d&roof=1&walls=0");
  await page.waitForSelector(".ky-turn");
  await expect(page.locator("#walls")).not.toBeChecked();
  await expect(page.locator("#roof")).toBeChecked();
});

test("the district page: Roofs and Walls are pills, both on among the streets, and the address says what is off", async ({ page }) => {
  const errors = await open(page, "district.html?view=3d");
  await isPill(page.locator("#roof-row"));
  await isPill(page.locator("#walls-row"));
  await expect(page.locator("#roof")).toBeChecked();
  await expect(page.locator("#walls")).toBeChecked();
  expect(await roofs(page)).toBeGreaterThan(0);
  expect(roofParam(page)).toBeNull();
  await page.locator("#roof").uncheck();
  await expect.poll(() => roofs(page)).toBe(0);
  expect(roofParam(page)).toBe("0");
  // The walls stand without the roof.
  expect(await page.locator('.ky-turn [data-part*="-shell-"]').count()).toBeGreaterThan(0);
  await page.locator("#walls").uncheck();
  await expect.poll(() => new URL(page.url()).searchParams.get("walls")).toBe("0");
  expect(errors).toEqual([]);
});

test("the halls page: Roof is a pill that is there for the stadium round the floor", async ({ page }) => {
  await open(page, "halls.html?preset=tabletennis-4&view=3d&stadium=on");
  await isPill(page.locator("#roof-row"));
  await expect(page.locator("#roof")).not.toBeChecked();
  await page.locator("#roof").check();
  await expect.poll(() => roofs(page)).toBeGreaterThan(0);
  expect(roofParam(page)).toBe("1");
});

test("the venues page and the home page's featured arena: a Roof chip, off by default, in the address under each one's own name", async ({ page }) => {
  await open(page, "venues.html?view=3d");
  const chip = page.locator('[data-testid="part-roof"]');
  await expect(chip).toHaveAttribute("aria-pressed", "false");
  await chip.click();
  await expect.poll(() => roofParam(page)).toBe("1");
  await expect.poll(() => roofs(page)).toBeGreaterThan(0);
  await page.goto("http://kyogijo.test/?fview=3d");
  await page.waitForSelector("#feature-stage .ky-turn");
  const featured = page.locator('#feature-bar [data-testid="part-roof"]');
  await expect(featured).toHaveAttribute("aria-pressed", "false");
  await featured.click();
  await expect.poll(() => new URL(page.url()).searchParams.get("froof")).toBe("1");
});

test("the fly-through page: Roof is a pill, on as the path flies it, off for the whole flight with roof=0, and in the address", async ({ page }) => {
  const errors = await open(page, "flythrough.html");
  await isPill(page.locator("#roof-row"));
  await expect(page.locator("#roof")).toBeChecked();
  expect(roofParam(page)).toBeNull();
  await page.evaluate(() => window.flythrough.goTo("arena"));
  await expect(page.locator(".kf-3d")).toHaveAttribute("data-roof", "1");
  await page.locator("#roof").uncheck();
  await expect.poll(() => roofParam(page)).toBe("0");
  await page.evaluate(() => window.flythrough.goTo("arena"));
  await expect(page.locator(".kf-3d")).toHaveAttribute("data-roof", "0");
  // From the address.
  await page.goto("http://kyogijo.test/flythrough.html?roof=0");
  await page.waitForSelector('body[data-ready="true"]');
  await expect(page.locator("#roof")).not.toBeChecked();
  expect(errors).toEqual([]);
});
