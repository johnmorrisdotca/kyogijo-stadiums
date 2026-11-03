// The circuits page's race from a feed: the sample feed (made up) first among the suggestions, a feed at an address the reader types, pasted text, a source that will not let the page read it (said in words), and a
// race followed while it is live, only while the page is visible. Every address is a made-up stub on a host that does not exist: no test makes a real request, and one that tried would fail the test.
import { expect, test } from "@playwright/test";

import { serve } from "./demo.mjs";

const STAGE = '[data-testid="stage"]';
const STUB = {
  kind: "kyogijo-race",
  version: 1,
  laps: 3,
  cars: [{ id: "a", code: "AAA", name: "Made-up A", team: "Made-up Team", colour: "#3366cc" }, { id: "b", code: "BBB", name: "<b>B</b>" }],
  crossings: [{ car: "a", lap: 1, t: 100 }, { car: "b", lap: 1, t: 101 }, { car: "a", lap: 2, t: 197 }, { car: "b", lap: 2, t: 220 }, { car: "a", lap: 3, t: 294 }, { car: "b", lap: 3, t: 318 }],
  pits: [{ car: "b", in: 195, out: 218, stop: 2.4 }],
};

/** Open the page with every request outside the demo's own host refused and counted, and the stubs answered. */
async function open(page, path, stubs = {}) {
  const errors = [];
  const outside = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.route(/^https?:\/\/(?!kyogijo\.test\/)/, (route) => {
    const url = route.request().url();
    const stub = stubs[url];
    if (stub === undefined) {
      outside.push(url);
      return route.abort();
    }
    return stub(route);
  });
  await serve(page);
  await page.goto(`http://kyogijo.test/${path}`);
  await page.waitForSelector('body[data-ready="true"]');
  await page.waitForSelector(`${STAGE} .ky-race`);
  return { errors, outside };
}
const json = (value) => (route) => route.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(value) });
const press = async (locator, testInfo) => {
  await locator.scrollIntoViewIfNeeded();
  if (testInfo.project.use.hasTouch === true) await locator.tap();
  else await locator.click();
};

test("lists the simulation, the sample feed (made up) first and the public sources, and plays the sample", async ({ page }, testInfo) => {
  const { errors, outside } = await open(page, "circuits.html?race=1");
  const picks = page.locator('[data-testid="feed-pick"] button');
  await expect(picks.first()).toHaveText("Simulation");
  await expect(picks.nth(1)).toHaveText("Sample feed (made up)");
  await expect(picks.filter({ hasText: "OpenF1" })).toHaveCount(1);
  // A suggestion fills the address and says what it gives, with its docs and terms: nothing is asked of it.
  await press(picks.filter({ hasText: "OpenF1" }), testInfo);
  await expect(page.locator('[data-testid="feed-url"]')).toHaveValue("https://api.openf1.org/v1/laps?session_key=9644");
  await expect(page.locator('[data-testid="feed-gives"]')).toContainText("session_key");
  await expect(page.locator('[data-testid="feed-gives"] a').last()).toHaveAttribute("href", "https://openf1.org/");
  await press(picks.nth(1), testInfo);
  await expect(page.locator('[data-testid="feed-status"]')).toHaveText("Playing 20 cars over 50 laps from the feed.");
  await expect(page.locator(`${STAGE} .ky-race-note`)).toContainText("A race from a feed you chose");
  await expect(page.locator(`${STAGE} .ky-race-board tbody tr`)).toHaveCount(20);
  await expect.poll(() => new URL(page.url()).searchParams.get("feed")).toBe("sample");
  expect(outside).toEqual([]);
  expect(errors).toEqual([]);
});

test("plays a feed from an address the reader types, the names as text, and keeps the address", async ({ page }, testInfo) => {
  const address = "https://feed.example.test/race.json";
  const { errors, outside } = await open(page, "circuits.html?race=1", { [address]: json(STUB) });
  await page.locator('[data-testid="feed-url"]').fill(address);
  await press(page.locator('[data-testid="feed-load"]'), testInfo);
  await expect(page.locator('[data-testid="feed-status"]')).toHaveText("Playing 2 cars over 3 laps from the feed.");
  await page.locator(`${STAGE} .ky-race-position`).evaluate((range) => {
    range.value = range.max;
    range.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const rows = page.locator(`${STAGE} .ky-race-board tbody tr`);
  await expect(rows.first().locator(".ky-race-code")).toHaveText("AAA");
  await expect(rows.nth(1).locator(".ky-race-name")).toHaveText("<b>B</b>");
  await expect(rows.nth(1).locator('[data-col="gap"]')).toHaveText("+24.000");
  await expect.poll(() => new URL(page.url()).searchParams.get("feed")).toBe(address);
  expect(outside).toEqual([]);
  expect(errors).toEqual([]);
});

test("says so in words when a source will not let the page read it, and plays pasted text instead", async ({ page }, testInfo) => {
  const address = "https://closed.example.test/race.json";
  // (A browser refuses a cross-site answer without the source's leave as a failed request, with no reason a page may read: the stub fails it the same way.)
  const { outside } = await open(page, "circuits.html?race=1", { [address]: (route) => route.abort("failed") });
  await page.locator('[data-testid="feed-url"]').fill(address);
  await press(page.locator('[data-testid="feed-load"]'), testInfo);
  await expect(page.locator('[data-testid="feed-status"]')).toContainText("CORS");
  await expect(page.locator('[data-testid="feed-status"]')).toHaveAttribute("data-kind", "error");
  await page.locator("#feed-more summary").click();
  await page.locator('[data-testid="feed-text"]').fill(JSON.stringify(STUB));
  await press(page.locator('[data-testid="feed-paste"]'), testInfo);
  await expect(page.locator('[data-testid="feed-status"]')).toHaveText("Playing 2 cars over 3 laps from the feed.");
  await page.locator('[data-testid="feed-text"]').fill("{ not json");
  await press(page.locator('[data-testid="feed-paste"]'), testInfo);
  await expect(page.locator('[data-testid="feed-status"]')).toHaveText("This is not JSON.");
  expect(outside).toEqual([]);
});

test("follows a live race every 15 seconds while the page is visible, and stops when it is over", async ({ page }, testInfo) => {
  await page.clock.install();
  const address = "https://live.example.test/race.json";
  let asked = 0;
  let live = true;
  const { outside } = await open(page, "circuits.html?race=1", {
    [address]: (route) => {
      asked += 1;
      return json({ ...STUB, live })(route);
    },
  });
  await page.locator('[data-testid="feed-follow"]').check();
  await page.locator('[data-testid="feed-url"]').fill(address);
  await press(page.locator('[data-testid="feed-load"]'), testInfo);
  await expect(page.locator('[data-testid="feed-status"]')).toHaveText("Following: asked again every 15 seconds while this page is visible.");
  await expect.poll(() => asked).toBe(2);
  await page.clock.runFor(14_000);
  expect(asked).toBe(2);
  await page.clock.runFor(1_500);
  await expect.poll(() => asked).toBe(3);
  // Hidden: nothing is asked.
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(60_000);
  expect(asked).toBe(3);
  live = false;
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => asked).toBe(4);
  await expect(page.locator('[data-testid="feed-status"]')).toHaveText("The race is over: no longer following.");
  await page.clock.runFor(60_000);
  expect(asked).toBe(4);
  expect(outside).toEqual([]);
});
