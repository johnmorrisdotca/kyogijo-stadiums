// The Atlas of the demo: the map with a marker on every place, the filters, the list, and the surface drawn for the chosen place.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, serve, tap } from "./demo.mjs";

/** Open the demo and wait until the atlas has drawn its markers; returns what the page complains of. */
async function openAtlas(page, query = "?lang=en&help=off") {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  await page.goto(`http://kyogijo.test/${query}`);
  await page.waitForSelector(`${at("atlas-map")}[data-atlas="ready"] .atlas-mark`);
  return errors;
}
const marks = (page, selector = "") => page.locator(`${at("atlas-map")} .atlas-overlay .atlas-mark${selector}`);
const items = (page) => page.locator(`${at("atlas-list")} .atlas-item`);
const detailName = (page) => page.locator(`${at("atlas-detail")} .atlas-name`);

test("the atlas puts every place on the map and in the list", async ({ page }) => {
  const errors = await openAtlas(page);
  expect(errors).toEqual([]);
  await expect(page.locator(at("atlas-count"))).toHaveText("158 of 158 places");
  await expect(items(page)).toHaveCount(158);
  // The whole world is one copy of the canvas, so each place has one marker.
  await expect(marks(page)).toHaveCount(158);
  await expect(page.locator(`${at("atlas-map")} .czm-stage svg:not(.atlas-overlay) .cz-land`).first()).toBeAttached();
  // Credits for the map and the coordinates.
  await expect(page.locator("#atlas .atlas-credits")).toContainText("Natural Earth");
  await expect(page.locator("#atlas .atlas-credits")).toContainText("chizu");
  await expect(page.locator("#atlas .atlas-credits")).toContainText("Wikidata");
  await noSidewaysScroll(page);
});

test("a place in use is a circle and one of the past is a diamond, so that colour is not all that tells them apart", async ({ page }) => {
  await openAtlas(page);
  expect(await marks(page, ".am-current .am-body").evaluateAll((all) => all.every((n) => n.tagName === "circle"))).toBe(true);
  expect(await marks(page, ".am-past .am-body").evaluateAll((all) => all.every((n) => n.tagName === "path"))).toBe(true);
  expect(await marks(page, ".am-current").count()).toBeGreaterThan(80);
  expect(await marks(page, ".am-past").count()).toBeGreaterThan(40);
  // A soccer ground has a dot in its middle, a baseball park has none.
  expect(await marks(page, ".am-soccer").evaluateAll((all) => all.every((n) => n.querySelector(".am-dot") !== null))).toBe(true);
  expect(await marks(page, ".am-baseball").evaluateAll((all) => all.every((n) => n.querySelector(".am-dot") === null))).toBe(true);
  // The key says so too.
  await expect(page.locator(at("atlas-key"))).toContainText("circle");
  await expect(page.locator(at("atlas-key"))).toContainText("diamond");
});

test("the filters narrow the markers and the list together, and reset brings them all back", async ({ page }) => {
  await openAtlas(page);
  await page.locator(`${at("atlas-sport")} button[data-value="soccer"]`).click();
  await expect(page.locator(at("atlas-count"))).toHaveText("64 of 158 places");
  await expect(marks(page)).toHaveCount(64);
  await expect(marks(page, ".am-baseball")).toHaveCount(0);
  await page.locator(`${at("atlas-sport")} button[data-value="all"]`).click();
  await page.locator(at("atlas-league")).selectOption("NPB");
  await expect(page.locator(at("atlas-count"))).toHaveText("20 of 158 places");
  await page.locator(`${at("atlas-status")} button[data-value="past"]`).click();
  await expect(page.locator(at("atlas-count"))).toHaveText("6 of 158 places");
  expect(await marks(page).evaluateAll((all) => all.every((n) => n.classList.contains("am-past")))).toBe(true);
  await page.locator(at("atlas-reset")).click();
  await expect(page.locator(at("atlas-count"))).toHaveText("158 of 158 places");
  await page.locator(at("atlas-country")).selectOption("JP");
  await expect(page.locator(at("atlas-count"))).toHaveText("24 of 158 places");
  await page.locator(at("atlas-search")).fill("koshien");
  await expect(page.locator(at("atlas-count"))).toHaveText("1 of 158 places");
  await expect(items(page).first()).toContainText("Hanshin Koshien Stadium");
  await page.locator(at("atlas-search")).fill("nowhere at all");
  await expect(items(page)).toHaveCount(0);
  await expect(page.locator(at("atlas-list"))).toContainText("No place matches");
});

test("the year keeps the places that were in use then", async ({ page }) => {
  await openAtlas(page);
  await expect(page.locator(at("atlas-year"))).toBeDisabled();
  await page.locator(at("atlas-year-on")).click();
  await expect(page.locator(at("atlas-year"))).toBeEnabled();
  await page.locator(at("atlas-year")).fill("1950");
  await expect(page.locator(at("atlas-year-out"))).toHaveText("1950");
  await expect(page.locator(`${at("atlas-list")} .atlas-item[data-id="polo-grounds"]`)).toHaveCount(1);
  await expect(page.locator(`${at("atlas-list")} .atlas-item[data-id="ebbets-field"]`)).toHaveCount(1);
  await expect(page.locator(`${at("atlas-list")} .atlas-item[data-id="citi-field"]`)).toHaveCount(0);
  await expect(page.locator(`${at("atlas-list")} .atlas-item[data-id="tokyo-dome"]`)).toHaveCount(0);
  await expect(marks(page, '[data-id="polo-grounds"]')).toHaveCount(1);
  await page.locator(at("atlas-year")).fill("2020");
  await expect(page.locator(`${at("atlas-list")} .atlas-item[data-id="polo-grounds"]`)).toHaveCount(0);
  await expect(page.locator(`${at("atlas-list")} .atlas-item[data-id="citi-field"]`)).toHaveCount(1);
  await page.locator(at("atlas-year-on")).click();
  await expect(page.locator(at("atlas-count"))).toHaveText("158 of 158 places");
});

test("choosing a place in the list draws its surface beside the map", async ({ page }, testInfo) => {
  await openAtlas(page);
  await expect(detailName(page)).toHaveText("Fenway Park");
  await tap(page, `${at("atlas-list")} .atlas-item[data-id="polo-grounds"]`, testInfo);
  await expect(detailName(page)).toHaveText("Polo Grounds");
  await expect(page.locator(`${at("atlas-surface")} svg.kyogijo`)).toHaveCount(1);
  await expect(page.locator(at("atlas-detail"))).toContainText("1891–1963");
  await expect(page.locator(at("atlas-detail"))).toContainText("Wikidata Q");
  expect(new URL(page.url()).searchParams.get("place")).toBe("polo-grounds");
  await expect(page.locator(`${at("atlas-list")} .atlas-item[data-id="polo-grounds"]`)).toHaveAttribute("aria-pressed", "true");
  await expect(marks(page, ".am-selected")).toHaveCount(1);
  // A ground is drawn as a pitch, at its own size.
  await tap(page, `${at("atlas-list")} .atlas-item[data-id="anfield"]`, testInfo);
  await expect(detailName(page)).toHaveText("Anfield");
  await expect(page.locator(`${at("atlas-surface")} svg.kyogijo .ky-pitch`).first()).toBeAttached();
  await expect(page.locator(at("atlas-detail"))).toContainText("101 × 68 m");
  await expect(page.locator(at("atlas-detail"))).toContainText("53.4308° N, 2.9608° W");
});

test("a press on a marker on the map chooses it, and a drag does not", async ({ page }) => {
  await openAtlas(page);
  const stage = page.locator(`${at("atlas-map")} .czm-stage`);
  await stage.scrollIntoViewIfNeeded();
  const spot = async (id) => {
    const box = await marks(page, `[data-id="${id}"]`).first().boundingBox();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  // Frame Mexico, whose three grounds stand well apart (in Tokyo they would share a few pixels).
  await page.locator(`${at("atlas-country")}`).selectOption("MX");
  await expect(marks(page, '[data-id="estadio-azteca"]')).toHaveCount(1);
  await page.waitForTimeout(200);
  const before = await spot("estadio-azteca");
  await page.mouse.move(before.x, before.y);
  await page.mouse.down();
  await page.mouse.move(before.x + 40, before.y + 10, { steps: 4 });
  await page.mouse.up();
  await expect(detailName(page)).toHaveText("Fenway Park");
  const after = await spot("estadio-azteca");
  expect(after.x).not.toBeCloseTo(before.x, 0);
  await page.mouse.click(after.x, after.y);
  await expect(detailName(page)).toHaveText("Estadio Azteca");
  expect(new URL(page.url()).searchParams.get("place")).toBe("estadio-azteca");
});

test("the markers follow the map when it is zoomed", async ({ page }) => {
  await openAtlas(page);
  const box = async () => (await marks(page, '[data-id="fenway-park"]').first().boundingBox());
  const before = await box();
  await page.locator(`${at("atlas-map")} [data-action="zoom-in"]`).click();
  await expect(page.locator(`${at("atlas-map")} .czm-zoom`)).toContainText("2");
  await expect(marks(page, '[data-id="fenway-park"]').first()).toBeAttached();
  const after = await box();
  // Zoomed in about the middle of the map, the marker of the east coast of America moves out toward the right and a marker keeps its size.
  expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeGreaterThan(5);
  expect(Math.abs(after.width - before.width)).toBeLessThan(3);
});

test("the list is a keyboard's way to everything the markers do", async ({ page }) => {
  await openAtlas(page);
  await page.locator(`${at("atlas-list")} .atlas-item[data-id="fenway-park"]`).focus();
  await page.keyboard.press("ArrowDown");
  const second = await page.evaluate(() => document.activeElement.dataset.id);
  expect(second).not.toBe("fenway-park");
  await page.keyboard.press("Enter");
  await expect(page.locator(`${at("atlas-list")} .atlas-item[data-id="${second}"]`)).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("End");
  expect(await page.evaluate(() => document.activeElement.dataset.id)).toBe(await items(page).last().getAttribute("data-id"));
  await page.keyboard.press("Home");
  expect(await page.evaluate(() => document.activeElement.dataset.id)).toBe(await items(page).first().getAttribute("data-id"));
  // The map itself takes the arrow keys and plus and minus, as chizu's does.
  const zoom = async () => Number(await page.locator(`${at("atlas-map")} .czm-stage`).getAttribute("data-zoom"));
  const was = await zoom();
  await page.locator(`${at("atlas-map")} .czm-stage`).focus();
  await page.keyboard.press("-");
  await expect.poll(zoom).toBeLessThan(was);
  // The markers are not in the tab order: the list is.
  expect(await page.locator(`${at("atlas-map")} .atlas-overlay[aria-hidden="true"]`).count()).toBe(1);
});

test("the chosen place can be tried in the playground above", async ({ page }, testInfo) => {
  await openAtlas(page);
  await tap(page, `${at("atlas-list")} .atlas-item[data-id="maracana"]`, testInfo);
  await tap(page, at("atlas-try"), testInfo);
  await expect(page.locator(at("ground"))).toHaveValue("maracana");
  await expect(page.locator('[data-testid="sport"] [aria-pressed="true"]')).toHaveText("Soccer");
  await tap(page, `${at("atlas-list")} .atlas-item[data-id="polo-grounds"]`, testInfo);
  await tap(page, at("atlas-try"), testInfo);
  await expect(page.locator(at("park"))).toHaveValue("polo-grounds");
});

test("the atlas opens on the place the address names, and speaks Japanese", async ({ page }) => {
  await openAtlas(page, "?lang=ja&help=off&place=tokyo-dome");
  await expect(page.locator("#atlas-title")).toHaveText("球場・スタジアムマップ");
  await expect(detailName(page)).toHaveText("東京ドーム");
  await expect(page.locator(at("atlas-count"))).toHaveText("158か所中158か所");
  await expect(page.locator(`${at("atlas-list")} .atlas-item[data-id="maracana"] .atlas-item-name`)).toHaveText("エスタジオ・ド・マラカナン");
  await expect(page.locator(at("atlas-detail"))).toContainText("日本");
  await page.locator(at("atlas-year-on")).click();
  await page.locator(at("atlas-year")).fill("1950");
  await expect(page.locator(`${at("atlas-list")} .atlas-item[data-id="polo-grounds"] .atlas-item-sub`)).toContainText("1891年〜1963年");
  await noSidewaysScroll(page);
});

test("the markers take the page's light and dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await openAtlas(page, "?lang=en&help=off&theme=light");
  const fill = () => marks(page, ".am-baseball.am-current .am-body").first().evaluate((n) => getComputedStyle(n).fill);
  const light = await fill();
  await page.locator('[data-testid="theme"] button[data-value="dark"]').click();
  await expect.poll(fill).not.toBe(light);
});
