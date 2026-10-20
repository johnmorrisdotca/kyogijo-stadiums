// The venues page: the eight arenas of the NHL's Pacific Division, each in the outline of its building, in 2D and in 3D, in a real browser: the arrow that says where north is only where the rink's orientation is known, the facts
// listed under the picture, the roof and walls on request in 3D, English and Japanese, nothing sent anywhere and nothing wider than the screen.
import { expect, test } from "@playwright/test";

import { noSidewaysScroll, serve } from "./demo.mjs";

const STAGE = '[data-testid="stage"]';
const IDS = ["honda-center", "scotiabank-saddledome", "rogers-place", "crypto-com-arena", "sap-center", "climate-pledge-arena", "rogers-arena", "t-mobile-arena"];
const NAMES = ["Honda Center", "Scotiabank Saddledome", "Rogers Place", "Crypto.com Arena", "SAP Center", "Climate Pledge Arena", "Rogers Arena", "T-Mobile Arena"];
/** Whether the rink's orientation is known for each (an arrow marks north in the drawing). */
const ARROW = { "honda-center": true, "scotiabank-saddledome": false, "rogers-place": true, "crypto-com-arena": false, "sap-center": false, "climate-pledge-arena": true, "rogers-arena": true, "t-mobile-arena": true };

async function open(page, query = "") {
  const errors = [];
  const outside = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("request", (request) => !request.url().startsWith("http://kyogijo.test/") && !request.url().startsWith("data:") && outside.push(request.url()));
  await serve(page);
  await page.goto(`http://kyogijo.test/venues.html${query}`);
  await page.waitForSelector('body[data-ready="true"]');
  await page.waitForSelector(`${STAGE} svg.kyogijo, ${STAGE} .ky-turn`);
  return { errors, outside };
}

test("opens on the Honda Center in the outline of its building, with the eight arenas as tabs, nothing sent anywhere and nothing wider than the screen", async ({ page }) => {
  const { errors, outside } = await open(page);
  await expect(page.locator("#tabs button")).toHaveText(NAMES);
  await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText("Honda Center");
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-shell`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-north`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveAttribute("data-sport", "nhl");
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
  await noSidewaysScroll(page);
});

test("lists what the drawing is made from under it: the seats, the tiers, the roof, how the rink lies, the outline and the credit", async ({ page }) => {
  await open(page);
  const facts = page.locator('[data-testid="facts"]');
  await expect(facts).toContainText("17,174");
  await expect(facts).toContainText("2 (ours, plausible)");
  await expect(facts).toContainText("fixed (ours, plausible)");
  await expect(facts).toContainText("inferred from the building's long axis");
  await expect(facts).toContainText("OpenStreetMap way/120623151");
  await expect(page.locator('[data-testid="credit"]')).toContainText("(c) OpenStreetMap contributors, ODbL 1.0");
  await page.locator('#tabs button[data-venue="scotiabank-saddledome"]').click();
  await expect(facts).toContainText("19,289");
  await expect(facts).toContainText("saddle-shaped (a source says so)");
  await expect(facts).toContainText("not known: drawn east-west, north at the top");
});

test("draws each of the eight, with the arrow only where the rink's orientation is known, and keeps the choice in the address", async ({ page }) => {
  await open(page);
  for (const [i, id] of IDS.entries()) {
    await page.locator(`#tabs button[data-venue="${id}"]`).click();
    await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText(NAMES[i]);
    await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-shell`)).toHaveCount(1);
    await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-north`)).toHaveCount(ARROW[id] ? 1 : 0);
    if (i > 0) expect(page.url()).toContain(`venue=${id}`);
    // The whole building is in the drawing: the shell's box is inside the picture's.
    const inside = await page.locator(`${STAGE} svg.kyogijo`).evaluate((svg) => {
      const [x, y, w, h] = svg.getAttribute("viewBox").split(" ").map(Number);
      const box = svg.querySelector(".ky-cr-shell").getBBox();
      return box.x >= x - 0.5 && box.y >= y - 0.5 && box.x + box.width <= x + w + 0.5 && box.y + box.height <= y + h + 0.5;
    });
    expect(inside, id).toBe(true);
  }
  await page.goto("http://kyogijo.test/venues.html?venue=rogers-arena");
  await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText("Rogers Arena");
});

test("turns in 3D: the tiers stand on the floor, and the building's walls and roof stand only with the roof asked for", async ({ page }) => {
  const { errors } = await open(page, "?view=3d&venue=scotiabank-saddledome");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} .ky-up-seats`).first()).toBeAttached();
  await expect(page.locator(`${STAGE} [data-part^="shell-"]`)).toHaveCount(0);
  await expect(page.locator("#viewpoint-row")).toBeVisible();
  await page.locator("#roof").check();
  await expect(page.locator(`${STAGE} [data-part^="roof-"]`).first()).toBeAttached();
  expect(await page.locator(`${STAGE} [data-part^="shell-"]`).count()).toBeGreaterThanOrEqual(40);
  await page.locator("#viewpoint").selectOption("overhead");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-preset", "overhead");
  expect(page.url()).toContain("roof=1");
  expect(errors).toEqual([]);
  await page.locator("#view").selectOption("2d");
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveCount(1);
  await expect(page.locator("#viewpoint-row")).toBeHidden();
});

test("is in Japanese on request, the title, the facts and the drawing's own description, and dark on request", async ({ page }) => {
  await open(page, "?lang=ja&theme=dark&venue=climate-pledge-arena");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("#title")).toContainText("実在のアリーナ");
  await expect(page.locator('[data-testid="facts"]')).toContainText("17,151席");
  await expect(page.locator(`${STAGE} svg.kyogijo desc`)).toContainText("OpenStreetMap");
  await noSidewaysScroll(page);
});
