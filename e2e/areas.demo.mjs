// The district page loads the data of the area it shows and no other: each preset's network log names its own area's file or files (Vancouver's, Seattle's, Tokyo's) and none of the others', the head does not preload any of
// them, a choice of other venues asks for the new area's file when it is chosen, and turning the surroundings off asks for none. Every preset draws in 3D and in 2D without a page error.
import { expect, test } from "@playwright/test";

import { serve } from "./demo.mjs";

const AREA_FILE = /\/dist\/(?:osm\.context|plateau|cityctx\.[a-z-]+)\.data\.js$/;
const VANCOUVER = ["osm.context.data.js", "cityctx.vancouver-nature.data.js"];
// The query of each preset (the same as scripts/perf-district.mjs) and the area files its page may ask for.
const PRESETS = [
  { name: "BC Place and Rogers Arena", query: "", files: VANCOUVER },
  { name: "Rogers Arena alone", query: "venues=rogers-arena", files: VANCOUVER },
  { name: "BC Place (soccer) and Rogers Arena", query: "venues=bc-place:soccer,rogers-arena", files: VANCOUVER },
  { name: "Seattle Center", query: "venues=climate-pledge-arena", files: ["cityctx.seattle-center.data.js"] },
  { name: "SoDo", query: "venues=t-mobile-park:mlb,lumen-field:nfl", files: ["cityctx.seattle-sodo.data.js"] },
  { name: "Seattle, three venues", query: "venues=t-mobile-park:mlb,lumen-field:nfl,climate-pledge-arena&mode=city", files: ["cityctx.seattle-city.data.js"] },
  { name: "Tokyo Dome City", query: "venues=tokyo-dome:mlb,korakuen-hall:boxing", files: ["plateau.data.js"] },
  { name: "Tokyo Dome City with the Kodokan", query: "venues=tokyo-dome:mlb,korakuen-hall:boxing,kodokan", files: ["plateau.data.js"] },
  { name: "the Kodokan alone, with no surroundings", query: "venues=kodokan&context=0", files: [] },
];

/** Open the page and keep a log of the area files it asks for and of what it complains of. */
async function watch(page, query, view = "3d") {
  const asked = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("request", (request) => AREA_FILE.test(new URL(request.url()).pathname) && asked.push(new URL(request.url()).pathname.split("/").pop()));
  await serve(page);
  await page.goto(`http://kyogijo.test/district.html?${query}${query === "" ? "" : "&"}view=${view}&viewpoint=broadcast`);
  await page.waitForSelector('body[data-ready="true"]');
  if (view === "3d") await page.waitForSelector('[data-testid="stage"] .ky-turn[data-mode="3d"]');
  return { asked, errors };
}

for (const preset of PRESETS) {
  test(`${preset.name}: asks for its own area's file and no other, and draws without a page error`, async ({ page }) => {
    const { asked, errors } = await watch(page, preset.query);
    expect([...asked].sort()).toEqual([...preset.files].sort());
    if (preset.files.length > 0) {
      // The area is on the page: the credit names its source.
      await expect(page.locator('[data-testid="credit"]')).toContainText(/OpenStreetMap|PLATEAU/);
    }
    expect(errors).toEqual([]);
  });
}

test("the head preloads no area's file, so that a page does not fetch the areas it does not show", async ({ page }) => {
  await serve(page);
  await page.goto("http://kyogijo.test/district.html");
  const links = await page.evaluate(() => [...document.querySelectorAll('head link[rel="modulepreload"]')].map((link) => link.getAttribute("href")));
  expect(links.length).toBeGreaterThan(100);
  expect(links.filter((href) => AREA_FILE.test(href.replace(/^\./, "")))).toEqual([]);
});

test("choosing another preset asks for the new area's file at that moment, once, and a second choice of it asks for nothing", async ({ page }) => {
  const { asked, errors } = await watch(page, "venues=rogers-arena");
  expect([...asked].sort()).toEqual([...VANCOUVER].sort());
  asked.length = 0;
  await page.locator('#tabs button[data-preset="sodo"]').click();
  await page.waitForSelector('body[data-ready="true"]');
  await expect.poll(() => asked.join()).toBe("cityctx.seattle-sodo.data.js");
  await page.locator('#tabs button[data-preset="seattle"]').click();
  await page.waitForSelector('body[data-ready="true"]');
  await expect.poll(() => asked.join()).toBe("cityctx.seattle-sodo.data.js,cityctx.seattle-city.data.js");
  await page.locator('#tabs button[data-preset="sodo"]').click();
  await page.waitForSelector('body[data-ready="true"]');
  await expect(page.locator('[data-testid="stage"] .ky-turn[data-mode="3d"]')).toBeVisible();
  expect(asked).toEqual(["cityctx.seattle-sodo.data.js", "cityctx.seattle-city.data.js"]);
  expect(errors).toEqual([]);
});

test("turning the surroundings off asks for no area at all, and on again asks for it", async ({ page }) => {
  const { asked, errors } = await watch(page, "venues=climate-pledge-arena&context=0");
  expect(asked).toEqual([]);
  await page.locator('[data-testid="context"]').check({ force: true });
  await expect.poll(() => asked.join()).toBe("cityctx.seattle-center.data.js");
  await expect(page.locator('[data-testid="credit"]')).toContainText("OpenStreetMap");
  expect(errors).toEqual([]);
});

test("the 2D plan draws the area too, from its own file", async ({ page }) => {
  const { asked, errors } = await watch(page, "venues=t-mobile-park:mlb,lumen-field:nfl", "2d");
  expect(asked).toEqual(["cityctx.seattle-sodo.data.js"]);
  await expect(page.locator('[data-testid="stage"] svg.ky-district')).toHaveCount(1);
  expect(errors).toEqual([]);
});
