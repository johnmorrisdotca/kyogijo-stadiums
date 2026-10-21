// The featured real arena at the head of the home page: it turns by itself, its buttons are on it and work while it turns without stopping it or sending it back, what is chosen is in the address, and the
// links lead on to the venues, the tournament layouts in 3D and the judging page.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, serve } from "./demo.mjs";

const STAGE = at("feature-stage");
const chip = (page, part) => page.locator(`${at("feature-bar")} ${at(`part-${part}`)}`);

async function open(page, query = "", motion = "no-preference") {
  await page.emulateMedia({ reducedMotion: motion });
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  await page.goto(`http://kyogijo.test/${query}`);
  await page.waitForSelector(`${STAGE} .ky-turn`);
  return errors;
}

test("leads the page with a real arena that turns by itself, and a reader who prefers reduced motion gets it still", async ({ page }) => {
  const errors = await open(page);
  const play = page.locator(`${STAGE} .ky-turn-controls button[data-act="play"]`);
  await expect(play).toHaveAttribute("aria-pressed", "true");
  const turn = () => page.locator(`${STAGE} .ky-turn-floor`).evaluate((floor) => getComputedStyle(floor).transform);
  const first = await turn();
  await expect.poll(turn).not.toBe(first);
  // The arena comes before the try-it section, with its arena chosen in a list of all the real ones.
  const [feature, tryIt] = await Promise.all([page.locator("#feature").boundingBox(), page.locator("#try").boundingBox()]);
  expect(feature.y).toBeLessThan(tryIt.y);
  await expect(page.locator(at("feature-venue"))).toHaveValue("climate-pledge-arena");
  expect(await page.locator(`${at("feature-venue")} option`).count()).toBe(32);
  expect(errors).toEqual([]);
  await noSidewaysScroll(page);
  const still = await page.context().newPage();
  await open(still, "", "reduce");
  await expect(still.locator(`${STAGE} .ky-turn-controls button[data-act="play"]`)).toHaveAttribute("aria-pressed", "false");
});

test("has its buttons on the view, and a button pressed while it turns neither stops it nor sends it back", async ({ page }) => {
  const errors = await open(page);
  const play = page.locator(`${STAGE} .ky-turn-controls button[data-act="play"]`);
  await expect(play).toHaveAttribute("aria-pressed", "true");
  await page.locator(`${STAGE} .ky-turn`).evaluate((root) => { root.dataset.same = "yes"; });
  for (const part of ["stands", "walls", "roof", "building", "markings", "labels"]) {
    await chip(page, part).click();
    await expect(play).toHaveAttribute("aria-pressed", "true");
  }
  await expect(page.locator(`${STAGE} [data-part^="shell-"]`).first()).toBeAttached();
  await expect(page.locator(STAGE)).toHaveAttribute("data-hide", "building markings labels");
  await page.locator(at("feature-venue")).selectOption("united-center");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-same", "yes");
  await expect(play).toHaveAttribute("aria-pressed", "true");
  // What was chosen is in the address, under the page's own prefix, and comes back on a load.
  const url = page.url();
  for (const piece of ["fv=united-center", "fstands=0", "fwalls=1", "froof=1", "fbuilding=0", "fmarkings=0", "flabels=0"]) expect(url).toContain(piece);
  expect(errors).toEqual([]);
  await page.goto(url);
  await page.waitForSelector(`${STAGE} .ky-turn`);
  await expect(chip(page, "stands")).toHaveAttribute("aria-pressed", "false");
  await expect(chip(page, "roof")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(at("feature-venue"))).toHaveValue("united-center");
});

test("has the view and its buttons in sight at a laptop's size, and the links to the venues, the tournament layouts and the judging page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  for (const target of [page.locator(at("feature-bar")), page.locator(`${STAGE} .ky-turn-view`)]) {
    const box = await target.boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(800);
  }
  const hrefs = await page.locator(".feature-links a").evaluateAll((all) => all.map((a) => a.getAttribute("href")));
  expect(hrefs).toEqual(["venues.html", "halls.html?preset=tabletennis-4&view=3d", "judging.html?mat=1&view=broadcast"]);
});

test("is in Japanese on request: the title, the buttons and the arena's names", async ({ page }) => {
  await open(page, "?lang=ja", "reduce");
  await expect(page.locator("#feature-title")).toContainText("実在のアリーナ");
  await expect(chip(page, "stands")).toHaveText("客席");
  await expect(page.locator(at("feature-venue"))).toContainText("クライメット");
});
