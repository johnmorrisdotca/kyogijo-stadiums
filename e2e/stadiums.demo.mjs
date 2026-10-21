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
  await expect(page.locator("#title")).toContainText("実在のスタジアムと球場");
  await expect(page.locator('#stadium-tabs button[aria-selected="true"]')).toHaveText("BCプレイス");
  await expect(page.locator('[data-testid="facts"]')).toContainText("52,497席");
  await expect(page.locator(`${STAGE} svg.kyogijo desc`)).toContainText("OpenStreetMap");
  await expect(page.locator('[data-testid="district"]')).toHaveAttribute("href", /district\.html\?venues=bc-place:soccer,rogers-arena&lang=ja/);
  await noSidewaysScroll(page);
});

test("has the six stadiums as tabs, each with its own configurations, facts and roof: Lumen Field's canopies, T-Mobile Park's sections", async ({ page }) => {
  const { errors } = await open(page);
  await expect(page.locator("#stadium-tabs button")).toHaveText(["BC Place", "Lumen Field", "T-Mobile Park", "Tokyo Dome", "Korakuen Hall", "Koshien Stadium"]);
  await page.locator('#stadium-tabs button[data-stadium="lumen-field"]').click();
  await expect(page.locator("#tabs button")).toHaveText(["Football field", "Soccer pitch"]);
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveAttribute("data-sport", "nfl");
  const facts = page.locator('[data-testid="facts"]');
  await expect(facts).toContainText("68,740");
  await expect(facts).toContainText("a canopy over some of the stands (a source says so)");
  await expect(facts).toContainText("covers 70 percent of the seats");
  await expect(facts).toContainText("as OpenStreetMap maps the pitch");
  expect(page.url()).toContain("stadium=lumen-field");
  await page.locator('#tabs button[data-config="soccer"]').click();
  await expect(facts).toContainText("37,722");
  await expect(facts).toContainText("the bowl holds 68,740, the rest closed");
  await page.locator('#stadium-tabs button[data-stadium="t-mobile-park"]').click();
  await expect(page.locator("#tabs button")).toHaveText(["Baseball field"]);
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveAttribute("data-sport", "mlb");
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-shell`)).toHaveCount(1);
  await expect(facts).toContainText("47,368");
  await expect(facts).toContainText("217 feet");
  await expect(facts).toContainText("home plate to centre field 49.4 degrees from north");
  expect(errors).toEqual([]);
});

test("raises Lumen Field's canopies and T-Mobile Park's roof in 3D, the sections resting to the east when the roof is open", async ({ page }) => {
  const { errors } = await open(page, "?stadium=lumen-field&view=3d&roof=1");
  expect(await page.locator(`${STAGE} [data-part^="roof-c0-"]`).count()).toBeGreaterThan(20);
  expect(await page.locator(`${STAGE} [data-part^="roof-c1-"]`).count()).toBeGreaterThan(20);
  await expect(page.locator("#open-row")).toBeHidden();
  await page.locator('#stadium-tabs button[data-stadium="t-mobile-park"]').click();
  expect(await page.locator(`${STAGE} [data-part^="fabric-"]`).count()).toBeGreaterThanOrEqual(28);
  await expect(page.locator("#open-row")).toBeVisible();
  await page.locator("#open").check();
  await expect(page.locator(`${STAGE} [data-part^="fabric-"]`)).toHaveCount(0);
  await expect(page.locator(`${STAGE} [data-part^="parked-"]`).first()).toBeAttached();
  expect(page.url()).toContain("stadium=t-mobile-park");
  expect(errors).toEqual([]);
});

test("draws Tokyo Dome with no arrow to north, since nothing says how its field lies, and says so; Korakuen Hall with its ring and Koshien Stadium with its ivy walls and dirt infield", async ({ page }) => {
  const { errors, outside } = await open(page, "?stadium=tokyo-dome");
  const facts = page.locator('[data-testid="facts"]');
  await expect(page.locator("#tabs button")).toHaveText(["Baseball field"]);
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-shell`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-north`)).toHaveCount(0);
  await expect(facts).toContainText("45,600");
  await expect(facts).toContainText("an air-supported dome (a source says so)");
  await expect(facts).toContainText("not known: the field is drawn the way that fits the building, with no arrow to north");
  await expect(page.locator('[data-testid="district"]')).toHaveAttribute("href", /district\.html\?venues=tokyo-dome,korakuen-hall/);
  await page.locator('#stadium-tabs button[data-stadium="korakuen-hall"]').click();
  await expect(page.locator("#tabs button")).toHaveText(["Boxing ring"]);
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveAttribute("data-sport", "boxing");
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-shell`)).toHaveCount(1);
  await expect(facts).toContainText("1,403");
  await expect(facts).toContainText("the bowl holds 2,005, the rest closed");
  await page.locator('#stadium-tabs button[data-stadium="hanshin-koshien-stadium"]').click();
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-ivy`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-infield`)).toHaveCount(0);
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-north`)).toHaveCount(1);
  await expect(facts).toContainText("47,400");
  await expect(facts).toContainText("fitted to the published fence");
  await expect(page.locator('[data-testid="district"]')).toBeHidden();
  expect(page.url()).toContain("stadium=hanshin-koshien-stadium");
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
  await noSidewaysScroll(page);
});

test("raises Tokyo Dome's air-supported roof in 3D, which has no open state, and Koshien Stadium's walls without a roof", async ({ page }) => {
  const { errors } = await open(page, "?stadium=tokyo-dome&view=3d&roof=1");
  expect(await page.locator(`${STAGE} [data-part^="roof-0-"]`).count()).toBeGreaterThan(40);
  await expect(page.locator("#open-row")).toBeHidden();
  await page.locator('#stadium-tabs button[data-stadium="hanshin-koshien-stadium"]').click();
  await expect(page.locator(`${STAGE} [data-part^="roof-"]`)).toHaveCount(0);
  expect(await page.locator(`${STAGE} .u-ivy`).count()).toBeGreaterThan(20);
  expect(errors).toEqual([]);
});

test("shows the LED boards of a stadium or of Korakuen Hall on request, in the plan and in 3D, and keeps the choice in the address", async ({ page }) => {
  const { errors } = await open(page, "?stadium=korakuen-hall");
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-ribbon`)).toHaveCount(0);
  await page.locator("#boards").check();
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-ribbon`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-board`)).toHaveCount(1);
  expect(new URL(page.url()).searchParams.get("boards")).toBe("1");
  await page.goto("http://kyogijo.test/stadiums.html?stadium=lumen-field&view=3d&boards=1");
  await page.waitForSelector(`${STAGE} .ky-turn`);
  await expect(page.locator("#boards")).toBeChecked();
  await expect(page.locator(`${STAGE} .ky-up-ribbon`).first()).toBeAttached();
  await expect(page.locator(`${STAGE} .ky-up-hung-board`).first()).toBeAttached();
  await page.locator("#boards").uncheck();
  await expect(page.locator(`${STAGE} .ky-up-ribbon`)).toHaveCount(0);
  await expect(page.locator(`${STAGE} .ky-up-hung-board`)).toHaveCount(0);
  expect(new URL(page.url()).searchParams.get("boards")).toBeNull();
  // A ballpark has ribbons in 3D and no scoreboard over the field.
  await page.locator('#stadium-tabs button[data-stadium="t-mobile-park"]').click();
  await page.locator("#boards").check();
  await expect(page.locator(`${STAGE} .ky-up-hung-board`)).toHaveCount(0);
  expect(errors).toEqual([]);
});
