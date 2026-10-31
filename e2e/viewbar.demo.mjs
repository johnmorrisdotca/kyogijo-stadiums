// The controls of every 3D demo are on the view: the bar over it, the view and the view's own buttons (viewpoints, turn, tilt, zoom, Play) are in the first screen on a desk and on a phone, each 44 pixels or more,
// and a toggle pressed while the view turns neither stops it nor sends it back. The venues page has its own tests of the same (venues.demo.mjs); the home page's featured arena is here for its bar.
import { expect, test } from "@playwright/test";

import { noSidewaysScroll, serve } from "./demo.mjs";

/** The pages that turn something, with the bar over the view, what to press while it turns, and a query that opens each on its 3D view. */
const PAGES = [
  { name: "stadiums", path: "stadiums.html?view=3d&stadium=bc-place&roof=1&walls=1", bar: "#bar", toggles: ["walls", "roof", "open", "boards", "walls", "boards", "open", "roof"], picks: [["lighting", "night"], ["lighting", "off"], ["theme", "dark"], ["theme", "light"]] },
  { name: "halls", path: "halls.html?preset=tabletennis-4&view=3d&stadium=on", bar: "#bar", toggles: ["roof", "boards", "labels", "labels", "boards", "roof"], picks: [["lighting", "game"], ["lighting", "off"], ["theme", "dark"], ["theme", "light"]] },
  { name: "district", path: "district.html?venues=bc-place:cfl,rogers-arena&view=3d", bar: "#bar", toggles: ["walls", "roof", "roofopen", "boards", "labels", "context", "gates", "gates", "context", "labels", "boards", "roofopen", "roof", "walls"], picks: [["lighting", "night"], ["lighting", "off"], ["theme", "dark"], ["theme", "light"]] },
  { name: "judging", path: "judging.html?view=3d&mat=1", bar: "#bar", toggles: ["seatnames", "seatnames"], picks: [["focus", "bench"], ["focus", "mat"], ["theme", "dark"], ["theme", "light"]] },
  { name: "boards", path: "boards.html?view=3d", bar: "#bar", toggles: ["cover", "cover"], picks: [["position", "bottom"], ["position", "top"], ["theme", "dark"], ["theme", "light"]] },
];
const FIRST_SCREEN = [...PAGES.map((one) => ({ ...one })), { name: "judging, the broadcast", path: "judging.html?view=broadcast&mat=1", bar: "#bar" }, { name: "flythrough", path: "flythrough.html", bar: "#bar" }, { name: "venues", path: "venues.html?view=3d&venue=climate-pledge-arena", bar: "#bar" }];

async function open(page, path) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  await page.goto(`http://kyogijo.test/${path}`);
  await page.waitForSelector('body[data-ready="true"]');
  await page.waitForSelector(".ky-turn[data-mode=\"3d\"], .kf");
  return errors;
}

/** The turn of the scene, in degrees, read from the browser's own drawing of the floor (the first axis of its matrix, so a tilt does not matter). */
const angle = (page) => page.locator(".ky-turn-floor").first().evaluate((floor) => {
  const m = getComputedStyle(floor).transform.split("(")[1].split(")")[0].split(",").map(Number);
  return (Math.atan2(m[1], m[0]) * 180) / Math.PI;
});
/** How far apart two angles are, round the circle. */
const apart = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

for (const one of FIRST_SCREEN) {
  test(`${one.name}: the bar, the view and the view's own buttons are in the first screen, each 44 pixels or more`, async ({ page }) => {
    const errors = await open(page, one.path);
    // The flight and the page's own fitting are worked out at the first paint; give them the moment they take.
    await page.waitForTimeout(500);
    const screen = page.viewportSize();
    const bar = page.locator(one.bar);
    const box = await bar.boundingBox();
    expect(box.y, "the bar's top").toBeGreaterThanOrEqual(0);
    expect(box.y + box.height, "the bar's bottom").toBeLessThanOrEqual(screen.height);
    // Every control of the bar that is shown is as wide and as high as a finger needs.
    const small = await bar.evaluate((el) => [...el.querySelectorAll("button, select, label.check")].filter((c) => c.getBoundingClientRect().height > 0).map((c) => [c.textContent.trim().slice(0, 24), c.getBoundingClientRect()]).filter(([, r]) => r.height < 44 || r.width < 44).map(([name, r]) => `${name} ${Math.round(r.width)}x${Math.round(r.height)}`));
    expect(small).toEqual([]);
    const controls = one.name === "flythrough" ? page.locator(".kf-controls") : page.locator(".ky-turn-controls");
    const view = one.name === "flythrough" ? page.locator(".kf-stage") : page.locator(".ky-turn-view");
    for (const [what, target] of [["the view", view], ["the buttons under it", controls]]) {
      const at = await target.last().boundingBox();
      expect(at.y, `${what}: top`).toBeGreaterThanOrEqual(0);
      expect(at.y + at.height, `${what}: bottom`).toBeLessThanOrEqual(screen.height);
    }
    if (one.name !== "flythrough") {
      const play = await page.locator('.ky-turn-controls button[data-act="play"]').boundingBox();
      expect(play.y + play.height, "Play").toBeLessThanOrEqual(screen.height);
    }
    await noSidewaysScroll(page);
    expect(errors).toEqual([]);
  });
}

for (const one of PAGES) {
  test(`${one.name}: a toggle, a list and the light pressed while the view turns neither stop it nor send it back`, async ({ page }) => {
    const errors = await open(page, one.path);
    const play = page.locator('.ky-turn-controls button[data-act="play"]');
    await play.click();
    await expect(play).toHaveAttribute("aria-pressed", "true");
    // The scene is marked, so that a mount again would show: it is the same one at the end.
    await page.locator(".ky-turn").first().evaluate((root) => { root.dataset.same = "yes"; });
    const moving = async (label) => {
      const a = await angle(page);
      await page.waitForTimeout(350);
      const b = await angle(page);
      expect(apart(a, b), `${label}: it turns`).toBeGreaterThan(0.2);
      expect(apart(a, b), `${label}: it does not jump`).toBeLessThan(12);
      await expect(play, `${label}: Play stays pressed`).toHaveAttribute("aria-pressed", "true");
    };
    await moving("before");
    for (const id of one.toggles) {
      const label = page.locator(`${one.bar} label:has(#${id})`);
      if ((await label.count()) === 0 || !(await label.isVisible())) continue;
      const before = await angle(page);
      await label.click();
      const after = await angle(page);
      // The press itself costs a moment, and the turn is 6 degrees a second: far from a jump back to the start.
      expect(apart(before, after), `${id}: no jump`).toBeLessThan(15);
      await moving(id);
    }
    for (const [id, value] of one.picks) {
      const pick = page.locator(`${one.bar} select#${id}`);
      if ((await pick.count()) === 0 || !(await pick.isVisible())) continue;
      const before = await angle(page);
      await pick.selectOption(value);
      expect(apart(before, await angle(page)), `${id}: no jump`).toBeLessThan(15);
      await moving(`${id} ${value}`);
    }
    await expect(page.locator(".ky-turn").first()).toHaveAttribute("data-same", "yes");
    expect(errors).toEqual([]);
  });
}

test("flythrough: the roof pressed while it flies goes on from the same moment, still playing", async ({ page }) => {
  const errors = await open(page, "flythrough.html");
  await page.evaluate(() => window.flythrough.play());
  await page.waitForTimeout(900);
  const before = await page.evaluate(() => ({ time: window.flythrough.time, playing: window.flythrough.playing }));
  expect(before.playing).toBe(true);
  expect(before.time).toBeGreaterThan(0);
  await page.locator("#bar label:has(#roof)").click();
  await page.waitForTimeout(100);
  const after = await page.evaluate(() => ({ time: window.flythrough.time, playing: window.flythrough.playing }));
  expect(after.playing, "still playing").toBe(true);
  expect(after.time, "not sent back").toBeGreaterThanOrEqual(before.time);
  expect(after.time - before.time, "not sent on").toBeLessThan(2);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.flythrough.time)).toBeGreaterThan(after.time);
  expect(errors).toEqual([]);
});

test("the home page: the featured arena's bar and the playground's bar press while the view turns, and neither stops it", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await serve(page);
  await page.goto("http://kyogijo.test/?fv=climate-pledge-arena&fspin=on");
  await page.waitForSelector('#feature-stage .ky-turn[data-mode="3d"]');
  const screen = page.viewportSize();
  const bar = await page.locator("#feature-bar").boundingBox();
  expect(bar.y + bar.height, "the featured arena's bar is in the first screen").toBeLessThanOrEqual(screen.height);
  const play = page.locator('#feature-stage .ky-turn-controls button[data-act="play"]');
  await expect(play).toHaveAttribute("aria-pressed", "true");
  const turning = async () => {
    const read = () => page.locator("#feature-stage .ky-turn-floor").first().evaluate((floor) => getComputedStyle(floor).transform);
    const first = await read();
    await expect.poll(read).not.toBe(first);
  };
  await turning();
  for (const part of ["boards", "walls", "roof", "stands", "boards", "walls", "roof", "stands"]) {
    await page.locator(`#feature-bar [data-testid="part-${part}"]`).click();
    await expect(play).toHaveAttribute("aria-pressed", "true");
  }
  await turning();
  // The playground's own: the crowd and its roof on the 3D view.
  await page.goto("http://kyogijo.test/?view=3d&sport=nhl");
  await page.waitForSelector('#stage .ky-turn[data-mode="3d"]');
  await page.locator("#stage-bar").scrollIntoViewIfNeeded();
  const pplay = page.locator('#stage .ky-turn-controls button[data-act="play"]');
  await pplay.click();
  await expect(pplay).toHaveAttribute("aria-pressed", "true");
  await page.locator("#stage .ky-turn").evaluate((root) => { root.dataset.same = "yes"; });
  await expect(page.locator('#stage-bar [data-testid="bar-roof"]')).toBeHidden();
  for (const id of ["bar-crowd", "bar-roof", "bar-roof", "bar-dark", "bar-dark", "bar-crowd"]) {
    const button = page.locator(`#stage-bar [data-testid="${id}"]`);
    if (!(await button.isVisible())) continue;
    await button.click();
    await expect(pplay).toHaveAttribute("aria-pressed", "true");
  }
  await expect(page.locator("#stage .ky-turn")).toHaveAttribute("data-same", "yes");
  expect(errors).toEqual([]);
});
