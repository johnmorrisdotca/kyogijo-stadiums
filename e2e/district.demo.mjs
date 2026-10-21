// The district page: BC Place and Rogers Arena on one plan at their real positions, in 2D and in 3D, in a real browser: each venue in its place, one north arrow, the distance between them, the choice of venues, the fit and the
// turn kept in the address, English and Japanese, nothing sent anywhere and nothing wider than the screen.
import { expect, test } from "@playwright/test";

import { noSidewaysScroll, serve } from "./demo.mjs";

const STAGE = '[data-testid="stage"]';

async function open(page, query = "") {
  const errors = [];
  const outside = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("request", (request) => !request.url().startsWith("http://kyogijo.test/") && !request.url().startsWith("data:") && outside.push(request.url()));
  await serve(page);
  await page.goto(`http://kyogijo.test/district.html${query}`);
  await page.waitForSelector('body[data-ready="true"]');
  return { errors, outside };
}

test("opens on BC Place and Rogers Arena side by side, each in its place, with one arrow, nothing sent anywhere and nothing wider than the screen", async ({ page }) => {
  const { errors, outside } = await open(page);
  await expect(page.locator(`${STAGE} svg.ky-district`)).toHaveAttribute("data-sport", "district");
  await expect(page.locator(`${STAGE} [data-venue]`)).toHaveCount(2);
  await expect(page.locator(`${STAGE} .ky-cr-shell`)).toHaveCount(2);
  await expect(page.locator(`${STAGE} .ky-dist-north`)).toHaveCount(1);
  await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText("BC Place and Rogers Arena");
  await expect(page.locator('[data-testid="between"]')).toContainText("are 264 metres apart");
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
  await noSidewaysScroll(page);
});

test("lists the venues with their seats and how each field lies, and the credit", async ({ page }) => {
  await open(page);
  const facts = page.locator('[data-testid="facts"]');
  await expect(facts).toContainText("BC Place");
  await expect(facts).toContainText("54,500");
  await expect(facts).toContainText("Rogers Arena");
  await expect(facts).toContainText("18,871");
  await expect(page.locator('[data-testid="credit"]')).toContainText("(c) OpenStreetMap contributors, ODbL 1.0");
});

test("changes the venues by a preset or by the boxes, keeps them in the address, and refuses an empty choice", async ({ page }) => {
  await open(page);
  await page.locator('#tabs button[data-preset="soccer"]').click();
  await expect(page.locator(`${STAGE} [data-venue="bc-place:soccer"]`)).toHaveCount(1);
  expect(page.url()).toContain("venues=bc-place%3Asoccer%2Crogers-arena");
  // A stadium is in a district once: choosing its other configuration takes the first away.
  await page.locator('input[data-key="bc-place:cfl"]').check();
  await expect(page.locator(`${STAGE} [data-venue="bc-place:cfl"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} [data-venue="bc-place:soccer"]`)).toHaveCount(0);
  await page.locator('input[data-key="bc-place:cfl"]').uncheck();
  await page.locator('input[data-key="rogers-arena"]').uncheck();
  await expect(page.locator("#error")).toBeVisible();
  await page.locator('input[data-key="rogers-arena"]').check();
  await expect(page.locator("#error")).toBeHidden();
  await expect(page.locator(`${STAGE} [data-venue]`)).toHaveCount(1);
});

test("fits as neighbours or as a city, with the names beside the venues in a city, and turns the map to lie across the page", async ({ page }) => {
  await open(page);
  expect(await page.locator(`${STAGE} svg.ky-district text`).allTextContents()).not.toContain("Rogers Arena");
  await page.locator("#mode").selectOption("city");
  await expect(page.locator(`${STAGE} svg.ky-district`)).toHaveAttribute("data-mode", "city");
  expect(await page.locator(`${STAGE} svg.ky-district text`).allTextContents()).toContain("Rogers Arena");
  const before = await page.locator(`${STAGE} svg.ky-district`).getAttribute("viewBox");
  await page.locator("#turn").selectOption("auto");
  expect(await page.locator(`${STAGE} svg.ky-district`).getAttribute("viewBox")).not.toBe(before);
  expect(page.url()).toContain("mode=city");
  expect(page.url()).toContain("turn=auto");
});

test("turns in 3D with both buildings on one ground: the stands and walls of each, a roof on each, signs with the names", async ({ page }) => {
  const { errors } = await open(page, "?view=3d&labels=1");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(1);
  expect(await page.locator(`${STAGE} [data-part^="m0-"]`).count()).toBeGreaterThan(300);
  expect(await page.locator(`${STAGE} [data-part^="m1-"]`).count()).toBeGreaterThan(150);
  await expect(page.locator(`${STAGE} .ky-up-sign`)).toHaveCount(2);
  expect(await page.locator(`${STAGE} [data-part^="m0-roof-"]`).count()).toBeGreaterThan(20);
  await page.locator("#roof").uncheck();
  await expect(page.locator(`${STAGE} [data-part^="m0-roof-"]`)).toHaveCount(0);
  await page.locator("#viewpoint").selectOption("overhead");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-preset", "overhead");
  expect(errors).toEqual([]);
  await page.locator("#view").selectOption("2d");
  await expect(page.locator(`${STAGE} svg.ky-district`)).toHaveCount(1);
});

test("is in Japanese on request, the title, the facts and the drawing's own description, and dark on request", async ({ page }) => {
  await open(page, "?lang=ja&theme=dark&labels=1");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("#title")).toContainText("実在の会場の地区");
  await expect(page.locator('[data-testid="between"]')).toContainText("m離れています");
  await expect(page.locator(`${STAGE} svg.ky-district desc`)).toContainText("OpenStreetMap");
  expect(await page.locator(`${STAGE} svg.ky-district text`).allTextContents()).toContain("BCプレイス");
  await noSidewaysScroll(page);
});

test("shows Seattle: the two SoDo stadiums as neighbours, then the three venues as a city at their real distances, with names", async ({ page }) => {
  const { errors } = await open(page);
  await page.locator('#tabs button[data-preset="sodo"]').click();
  await expect(page.locator(`${STAGE} [data-venue]`)).toHaveCount(2);
  await expect(page.locator(`${STAGE} [data-venue="t-mobile-park:mlb"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} [data-venue="lumen-field:nfl"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} svg.ky-district`)).toHaveAttribute("data-mode", "neighbours");
  await expect(page.locator('[data-testid="between"]')).toContainText("459 metres apart");
  await page.locator('#tabs button[data-preset="seattle"]').click();
  await expect(page.locator(`${STAGE} [data-venue]`)).toHaveCount(3);
  await expect(page.locator(`${STAGE} svg.ky-district`)).toHaveAttribute("data-mode", "city");
  expect(await page.locator(`${STAGE} svg.ky-district text`).allTextContents()).toEqual(expect.arrayContaining(["T-Mobile Park", "Lumen Field", "Climate Pledge Arena"]));
  await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText("Seattle city: all three venues");
  expect(page.url()).toContain("mode=city");
  await page.locator("#view").selectOption("3d");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(1);
  expect(await page.locator(`${STAGE} [data-part^="m2-"]`).count()).toBeGreaterThan(100);
  expect(errors).toEqual([]);
  await noSidewaysScroll(page);
});

test("puts LED boards on every venue of the district in 3D on request, kept in the address, without mounting the view again", async ({ page }) => {
  const { errors } = await open(page, "?view=3d");
  await expect(page.locator("#boards-row")).toBeVisible();
  await expect(page.locator(`${STAGE} .ky-up-ribbon`)).toHaveCount(0);
  await page.locator(`${STAGE} .ky-turn`).evaluate((root) => { root.dataset.same = "yes"; });
  await page.locator("#boards").check();
  await expect(page.locator(`${STAGE} [data-part^="m0-"].ky-up-ribbon`).first()).toBeAttached();
  await expect(page.locator(`${STAGE} [data-part^="m1-"].ky-up-ribbon`).first()).toBeAttached();
  await expect(page.locator(`${STAGE} [data-part$="centre-board-south"]`)).toHaveCount(2);
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-same", "yes");
  expect(new URL(page.url()).searchParams.get("boards")).toBe("1");
  await page.locator("#boards").uncheck();
  await expect(page.locator(`${STAGE} .ky-up-ribbon`)).toHaveCount(0);
  expect(new URL(page.url()).searchParams.get("boards")).toBeNull();
  expect(errors).toEqual([]);
});

test("lights the district with a preset in 3D on request, with a colour of light on each surface, kept in the address, without mounting the view again", async ({ page }) => {
  const { errors } = await open(page, "?view=3d");
  await expect(page.locator("#lighting-row")).toBeVisible();
  await page.locator(`${STAGE} .ky-turn`).evaluate((root) => { root.dataset.same = "yes"; });
  await page.locator("#lighting").selectOption("night");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-lighting", "night");
  await expect(page.locator(`${STAGE} [data-part$="night-pool"]`)).toHaveCount(2);
  await page.locator("#lighting").selectOption("lightsDown");
  await page.locator("#wash").selectOption("purple");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-lighting", "lightsDown");
  await expect(page.locator(`${STAGE} [data-part$="light-wash"]`)).toHaveCount(2);
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-same", "yes");
  const params = new URL(page.url()).searchParams;
  expect([params.get("lighting"), params.get("wash")]).toEqual(["lightsDown", "purple"]);
  await page.locator("#lighting").selectOption("off");
  await expect(page.locator(`${STAGE} .ky-turn`)).not.toHaveAttribute("data-lighting", /.*/);
  expect(errors).toEqual([]);
});

test("shows Tokyo Dome City: the ballpark and the hall as neighbours, one arrow, in 3D with the dome's roof", async ({ page }) => {
  const { errors } = await open(page);
  await page.locator('#tabs button[data-preset="tokyo"]').click();
  await expect(page.locator(`${STAGE} [data-venue]`)).toHaveCount(2);
  await expect(page.locator(`${STAGE} [data-venue="tokyo-dome:mlb"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} [data-venue="korakuen-hall:boxing"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} svg.ky-district`)).toHaveAttribute("data-mode", "neighbours");
  await expect(page.locator(`${STAGE} .ky-dist-north`)).toHaveCount(1);
  await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText("Tokyo Dome City: Tokyo Dome and Korakuen Hall");
  await expect(page.locator('[data-testid="facts"]')).toContainText("not known, fitted to the building");
  await page.locator("#view").selectOption("3d");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(1);
  expect(await page.locator(`${STAGE} [data-part^="m0-roof-0-"]`).count()).toBeGreaterThan(40);
  expect(errors).toEqual([]);
  await noSidewaysScroll(page);
});
