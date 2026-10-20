// The stadiums page: BC Place for football and for soccer, in the outline of its building, in 2D and in 3D, in a real browser: the arrow that says where north is, the facts listed under the picture, the roof closed or open in 3D,
// English and Japanese, nothing sent anywhere and nothing wider than the screen.
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
  await page.goto(`http://kyogijo.test/stadiums.html${query}`);
  await page.waitForSelector('body[data-ready="true"]');
  await page.waitForSelector(`${STAGE} svg.kyogijo, ${STAGE} .ky-turn`);
  return { errors, outside };
}

test("opens on BC Place's football field in the outline of its building, with the two configurations as tabs, nothing sent anywhere and nothing wider than the screen", async ({ page }) => {
  const { errors, outside } = await open(page);
  await expect(page.locator("#tabs button")).toHaveText(["Football field", "Soccer pitch"]);
  await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText("Football field");
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-shell`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-north`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveAttribute("data-sport", "cfl");
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
  await noSidewaysScroll(page);
});

test("lists what the drawing is made from under it: the seats of the configuration, the bowls, the roof and its opening, how the field lies, the outline and the credit", async ({ page }) => {
  await open(page);
  const facts = page.locator('[data-testid="facts"]');
  await expect(facts).toContainText("54,500");
  await expect(facts).toContainText("2 (a source says so); the lower bowl 27,695");
  await expect(facts).toContainText("retractable, supported by cables (a source says so)");
  await expect(facts).toContainText("100 by 85 metres");
  await expect(facts).toContainText("from the roof's opening, which is the field's size");
  await expect(facts).toContainText("OpenStreetMap way/24705904");
  await expect(page.locator('[data-testid="credit"]')).toContainText("(c) OpenStreetMap contributors, ODbL 1.0");
  await page.locator('#tabs button[data-config="soccer"]').click();
  await expect(facts).toContainText("52,497");
  await expect(facts).toContainText("105 by 68 metres");
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveAttribute("data-sport", "soccer");
  expect(page.url()).toContain("config=soccer");
});

test("turns in 3D: the bowls stand on the floor, the walls and the cable roof only with the roof asked for, and the fabric gathers into its pod when the roof is open", async ({ page }) => {
  const { errors } = await open(page, "?view=3d");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} .ky-up-seats`).first()).toBeAttached();
  await expect(page.locator(`${STAGE} [data-part^="roof-"]`)).toHaveCount(0);
  await expect(page.locator("#open-row")).toBeHidden();
  await page.locator("#roof").check();
  await expect(page.locator(`${STAGE} [data-part^="roof-"]`).first()).toBeAttached();
  expect(await page.locator(`${STAGE} [data-part^="shell-"]`).count()).toBeGreaterThanOrEqual(40);
  expect(await page.locator(`${STAGE} [data-part^="fabric-"]`).count()).toBeGreaterThanOrEqual(28);
  await expect(page.locator("#open-row")).toBeVisible();
  await page.locator("#open").check();
  await expect(page.locator(`${STAGE} [data-part^="fabric-"]`)).toHaveCount(0);
  await expect(page.locator(`${STAGE} [data-part^="pod-"]`).first()).toBeAttached();
  await page.locator("#viewpoint").selectOption("overhead");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-preset", "overhead");
  expect(page.url()).toContain("open=1");
  expect(errors).toEqual([]);
  await page.locator("#view").selectOption("2d");
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveCount(1);
  await expect(page.locator("#viewpoint-row")).toBeHidden();
});

test("is in Japanese on request, the title, the facts and the drawing's own description, dark on request, and links to the district beside Rogers Arena", async ({ page }) => {
  await open(page, "?lang=ja&theme=dark&config=soccer");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("#title")).toContainText("BCプレイス");
  await expect(page.locator('[data-testid="facts"]')).toContainText("52,497席");
  await expect(page.locator(`${STAGE} svg.kyogijo desc`)).toContainText("OpenStreetMap");
  await expect(page.locator('[data-testid="district"]')).toHaveAttribute("href", /district\.html\?venues=bc-place:soccer,rogers-arena&lang=ja/);
  await noSidewaysScroll(page);
});
