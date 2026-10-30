// The quality of the 3D view: every tier draws every preset of the district page without a page error, the choice is kept in the address and shown (the one asked for and the one drawn) in the page's own controls, a press changes it
// without moving the camera or stopping the turn, and `auto` steps down when the frames run over budget and back up when they are steady again. Every control is a finger wide, in light and dark, and none is in the browser's own style.
/* global PointerEvent, performance */
import { expect, test } from "@playwright/test";

import { serve } from "./demo.mjs";

const STAGE = '[data-testid="stage"]';
const BAR = '[data-testid="quality"]';
const NOW = '[data-testid="quality-now"]';
const TIERS = ["high", "medium", "low"];

const PRESETS = {
  alone: "venues=rogers-arena",
  pair: "",
  soccer: "venues=bc-place:soccer,rogers-arena",
  seattlecenter: "venues=climate-pledge-arena",
  sodo: "venues=t-mobile-park:mlb,lumen-field:nfl",
  seattle: "venues=t-mobile-park:mlb,lumen-field:nfl,climate-pledge-arena&mode=city",
  tokyo: "venues=tokyo-dome:mlb,korakuen-hall:boxing",
  tokyokodokan: "venues=tokyo-dome:mlb,korakuen-hall:boxing,kodokan",
  kodokan: "venues=kodokan&context=0",
};

async function open(page, query, tune) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  // A page lets a test set how the frames are judged (the real defaults wait seconds): nothing else about the page changes.
  if (tune !== undefined) await page.addInitScript((value) => { window.__kyogijoQualityTuning = value; }, tune);
  await serve(page);
  await page.goto(`http://kyogijo.test/district.html?${query}`);
  await page.waitForSelector('body[data-ready="true"]');
  await page.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
  return errors;
}

const root = (page) => page.locator(`${STAGE} .ky-turn`);
const query = (page) => new URL(page.url()).searchParams;
const floorMatrix = (page) => page.locator(`${STAGE} .ky-turn-floor`).first().evaluate((el) => getComputedStyle(el).transform);
/** Where the floor is in the view: the box of its drawing, the same at every tier whatever the size its layer is made at. */
const floorBox = (page) => page.locator(`${STAGE} .ky-turn-floor`).first().evaluate((el) => { const r = el.getBoundingClientRect(); const v = el.closest(".ky-turn-view").getBoundingClientRect(); return [r.left - v.left, r.top - v.top, r.width, r.height]; });
const sameBox = (a, b, message) => a.forEach((n, i) => expect(Math.abs(n - b[i]), `${message} (${i}: ${n} / ${b[i]})`).toBeLessThan(0.75));
const press = async (page, button) => {
  if (test.info().project.use.hasTouch === true) await button.tap();
  else await button.click();
};

for (const tier of TIERS) {
  test(`every preset of the district page draws at ${tier} without a page error, with planes on the floor`, async ({ page }) => {
    test.setTimeout(120_000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    await serve(page);
    for (const [name, preset] of Object.entries(PRESETS)) {
      await page.goto(`http://kyogijo.test/district.html?${preset}${preset === "" ? "" : "&"}view=3d&viewpoint=broadcast&quality=${tier}`);
      await page.waitForSelector('body[data-ready="true"]');
      await page.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
      await expect(root(page), name).toHaveAttribute("data-tier", tier);
      await expect(root(page), name).toHaveAttribute("data-quality", tier);
      expect(await page.locator(`${STAGE} .ky-up`).count(), `${name} has planes`).toBeGreaterThan(5);
      await expect(page.locator(`${BAR} button[aria-pressed="true"]`), name).toHaveAttribute("data-quality", tier);
      expect(errors, name).toEqual([]);
    }
  });
}

test("the page draws at `auto` by default, starting on high, keeps no `quality` in the address for it and keeps one for a tier", async ({ page }) => {
  await open(page, "view=3d&viewpoint=broadcast");
  await expect(root(page)).toHaveAttribute("data-quality", "auto");
  await expect(root(page)).toHaveAttribute("data-tier", "high");
  await expect(page.locator(`${BAR} button[aria-pressed="true"]`)).toHaveAttribute("data-quality", "auto");
  expect(query(page).has("quality")).toBe(false);
  await press(page, page.locator(`${BAR} button[data-quality="medium"]`));
  await expect(root(page)).toHaveAttribute("data-tier", "medium");
  expect(query(page).get("quality")).toBe("medium");
  await press(page, page.locator(`${BAR} button[data-quality="auto"]`));
  expect(query(page).has("quality")).toBe(false);
  // A bad value is the default.
  await page.goto("http://kyogijo.test/district.html?view=3d&quality=ultra");
  await page.waitForSelector('body[data-ready="true"]');
  await expect(root(page)).toHaveAttribute("data-quality", "auto");
});

test("the quality bar says what was asked for and what is drawn, in English and in Japanese, and is hidden in the 2D plan", async ({ page }) => {
  await open(page, "view=3d&quality=low");
  await expect(page.locator(NOW)).toHaveText("Held at Low.");
  await expect(page.locator(`${BAR} .label`)).toHaveText("Quality");
  await press(page, page.locator(`${BAR} button[data-quality="auto"]`));
  await expect(page.locator(NOW)).toHaveText(/Auto: drawn at (High|Medium|Low) for now\./);
  await page.goto("http://kyogijo.test/district.html?view=3d&quality=medium&lang=ja");
  await page.waitForSelector('body[data-ready="true"]');
  await expect(page.locator(`${BAR} .label`)).toHaveText("画質");
  await expect(page.locator(NOW)).toHaveText("画質を中に固定しています。");
  await expect(page.locator(`${BAR} button[data-quality="auto"]`)).toHaveText("自動");
  await page.goto("http://kyogijo.test/district.html?view=2d");
  await page.waitForSelector('body[data-ready="true"]');
  await expect(page.locator(BAR)).toBeHidden();
});

test("a press changes the tier without moving the camera, and the view goes on turning", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "view=3d&viewpoint=broadcast");
  const play = page.locator(`${STAGE} .ky-turn-controls button[data-act="play"]`).first();
  await press(page, play);
  await expect(play).toHaveAttribute("aria-pressed", "true");
  // Whether the view is turning: the floor's matrix is not the same a moment later (up to two seconds on a slow runner).
  const turning = async () => {
    const a = await floorMatrix(page);
    for (let i = 0; i < 8; i += 1) {
      await page.waitForTimeout(250);
      if (a !== (await floorMatrix(page))) return true;
    }
    return false;
  };
  expect(await turning()).toBe(true);
  for (const tier of ["low", "medium", "auto", "high"]) {
    await press(page, page.locator(`${BAR} button[data-quality="${tier}"]`));
    await expect(play).toHaveAttribute("aria-pressed", "true");
    expect(await turning(), `still turning after ${tier}`).toBe(true);
  }
  // Stopped, the camera is the same across tiers: the floor is in the same place on the screen at every tier.
  await press(page, play);
  await expect(play).toHaveAttribute("aria-pressed", "false");
  await page.waitForTimeout(200);
  const before = await floorBox(page);
  const view = await page.evaluate(() => document.querySelector(".ky-turn").dataset.preset);
  for (const tier of ["low", "medium", "high"]) {
    await press(page, page.locator(`${BAR} button[data-quality="${tier}"]`));
    sameBox(await floorBox(page), before, `the camera is where it was at ${tier}`);
    expect(await page.evaluate(() => document.querySelector(".ky-turn").dataset.preset)).toBe(view);
  }
});

test("a drag that has turned the view is kept across a change of tier", async ({ page }, info) => {
  test.skip(info.project.use.hasTouch === true, "the drag is the mouse's");
  await open(page, "view=3d&viewpoint=broadcast");
  const stage = page.locator(`${STAGE} .ky-turn-view`);
  const box = await stage.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 160, box.y + box.height / 2 + 40, { steps: 8 });
  await page.mouse.up();
  const before = await floorBox(page);
  for (const tier of ["low", "medium", "high"]) {
    await press(page, page.locator(`${BAR} button[data-quality="${tier}"]`));
    sameBox(await floorBox(page), before, tier);
  }
});

test("the quality controls are a finger wide, in the page's own style, in light and dark, and are on the page's first screen", async ({ page }) => {
  for (const scheme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: scheme });
    await open(page, "view=3d&viewpoint=broadcast");
    const buttons = page.locator(`${BAR} button`);
    await expect(buttons).toHaveCount(4);
    for (let i = 0; i < 4; i += 1) {
      const box = await buttons.nth(i).boundingBox();
      expect(box.height, `${scheme} button ${i}`).toBeGreaterThanOrEqual(48);
      expect(box.width, `${scheme} button ${i}`).toBeGreaterThanOrEqual(48);
    }
    const bar = await page.locator(BAR).boundingBox();
    expect(bar.y, "the bar is on the first screen").toBeLessThan(page.viewportSize().height);
    // The look: a border, a ground and corners of its own (not the browser's), and a pressed one is told from the rest by its ground.
    const look = (index) => buttons.nth(index).evaluate((el) => { const s = getComputedStyle(el); return [s.borderTopStyle, s.borderTopWidth, s.backgroundColor, s.borderTopLeftRadius, s.fontWeight].join("|"); });
    expect(await look(0)).not.toBe(await look(1));
    expect((await look(0)).split("|")[4]).toBe("800");
    expect((await look(1)).split("|")[3]).not.toBe("0px");
    // It is not wider than the page.
    const wide = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(wide).toBe(true);
  }
});

/**
 * A turn made of pointer moves, one to a frame, kept going for `ms` or until `until` (`"settled"`: the tier has stood still for three seconds off `high`; `"high"`: it is back on it for two); it gives the tiers it went through, the mean
 * frame interval of its last 1.5 seconds and the tier it ends on. With `burn` (milliseconds a tier costs a frame, a pointer move spends that long) the machine is made as slow as a test says, whatever it is.
 */
const turnView = (page, ms, until, burn) =>
  page.evaluate(async ({ ms, until, burn }) => {
    const stage = document.querySelector(".ky-turn-view");
    const rootEl = document.querySelector(".ky-turn");
    const box = stage.getBoundingClientRect();
    const fire = (type, x, y) => stage.dispatchEvent(new PointerEvent(type, { pointerId: 11, pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y, bubbles: true }));
    const frame = () => new Promise((done) => requestAnimationFrame(() => done(performance.now())));
    const spend = () => {
      const cost = burn?.[rootEl.dataset.tier] ?? 0;
      for (const begin = performance.now(); performance.now() - begin < cost; );
    };
    stage.addEventListener("pointermove", spend);
    const tiers = [];
    let changedAt = performance.now();
    let x = box.left + box.width / 2;
    let last = await frame();
    const start = last;
    const stamps = [];
    fire("pointerdown", x, box.top + 100);
    for (let i = 0; performance.now() - start < ms; i += 1) {
      x += i % 20 < 10 ? 6 : -6;
      fire("pointermove", x, box.top + 100 + (i % 8));
      const now = await frame();
      stamps.push([now, now - last]);
      last = now;
      if (tiers.at(-1) !== rootEl.dataset.tier) {
        tiers.push(rootEl.dataset.tier);
        changedAt = now;
      }
      if (until === "settled" && rootEl.dataset.tier !== "high" && now - changedAt > 3000) break;
      if (until === "high" && rootEl.dataset.tier === "high" && now - changedAt > 2000) break;
    }
    fire("pointerup", x, box.top + 100);
    stage.removeEventListener("pointermove", spend);
    const recent = stamps.filter(([t]) => t > last - 1500).map(([, d]) => d);
    return { tiers, mean: recent.reduce((sum, d) => sum + d, 0) / Math.max(1, recent.length), tier: rootEl.dataset.tier };
  }, { ms, until, burn });

const TUNE = { frames: 14, minFrames: 8, settleMs: 450, warmMs: 500, quietMs: 350, upAfterMs: 7000 };

test("`auto` steps down when each frame costs more than its budget, on any machine, and keeps a tier whose frames are within it", async ({ page }, info) => {
  // (WebKit on the shared runner takes seconds to a frame of this view, so that no window of frames is ever complete; its tiers are measured by `scripts/perf-district.mjs`.)
  test.skip(info.project.name === "webkit-phone", "WebKit on the shared runner is too slow to judge frames");
  test.setTimeout(120_000);
  // Each tier is given the cost of a device: high 80 ms a frame, medium 45, low 4 (on top of what the machine itself spends).
  const errors = await open(page, "view=3d&viewpoint=broadcast", TUNE);
  await expect(root(page)).toHaveAttribute("data-tier", "high");
  const down = await turnView(page, 60_000, "settled", { high: 80, medium: 45, low: 4 });
  expect(down.tiers.length, JSON.stringify(down)).toBeGreaterThan(1);
  expect(down.tier, JSON.stringify(down)).toBe("low");
  await expect(root(page)).toHaveAttribute("data-quality", "auto");
  await expect(page.locator(NOW)).toHaveText("Auto: drawn at Low for now.");
  expect(query(page).has("quality")).toBe(false);
  expect(errors).toEqual([]);
});

test("`auto` steps down under a slow processor and back up when the processor is quick again, on a machine that holds 60 frames a second", async ({ page }, info) => {
  test.skip(info.project.name !== "chromium-desk", "the processor is slowed through the Chrome DevTools protocol");
  test.setTimeout(150_000);
  // (The wait before a try upward is longer than the time the test holds a tier for, so that the frames it reads are the tier's own.)
  // (BC Place and Rogers Arena: at full speed every tier holds 60 frames a second here on a machine that can, so the way back up ends on high; Seattle's high is 45.)
  const errors = await open(page, "view=3d&viewpoint=broadcast", TUNE);
  const cdp = await page.context().newCDPSession(page);
  // A machine that cannot hold 60 frames a second at `high` (a shared runner several times slower than a desk) has no way back up to judge: the other test is what it runs.
  const probe = await turnView(page, 2500);
  test.skip(probe.mean > 18, `this machine does not hold 60 frames a second at high (${probe.mean.toFixed(1)} ms a frame)`);
  await expect(root(page)).toHaveAttribute("data-tier", "high");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  const down = await turnView(page, 60_000, "settled");
  // It stepped down (to medium or straight to low) and did not stay on high.
  expect(down.tiers.length, JSON.stringify(down)).toBeGreaterThan(1);
  expect(down.tier).not.toBe("high");
  // Held there, the frames are within 30 a second (33 ms), whichever tier it is on.
  const held = await turnView(page, 2000);
  expect(held.mean, JSON.stringify(held)).toBeLessThan(40);
  // The processor is quick again: after the wait it tries the tier above, and in the end is on high.
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  const up = await turnView(page, 90_000, "high");
  expect(up.tier, JSON.stringify(up)).toBe("high");
  // The address and the bar say what is drawn.
  await expect(page.locator(NOW)).toHaveText(/Auto: drawn at High/);
  expect(query(page).has("quality")).toBe(false);
  expect(errors).toEqual([]);
});

test("a tier held by name is never changed by the frames", async ({ page }, info) => {
  test.skip(info.project.name !== "chromium-desk", "the processor is slowed through the Chrome DevTools protocol");
  test.setTimeout(60_000);
  await open(page, "venues=t-mobile-park:mlb,lumen-field:nfl,climate-pledge-arena&mode=city&view=3d&viewpoint=broadcast&quality=high", { frames: 14, settleMs: 450, warmMs: 500, quietMs: 350, upAfterMs: 1800 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  await page.evaluate(async () => {
    const stage = document.querySelector(".ky-turn-view");
    const box = stage.getBoundingClientRect();
    const fire = (type, x, y) => stage.dispatchEvent(new PointerEvent(type, { pointerId: 12, pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y, bubbles: true }));
    const frame = () => new Promise((done) => requestAnimationFrame(() => done()));
    let x = box.left + box.width / 2;
    fire("pointerdown", x, box.top + 100);
    for (let i = 0; i < 60; i += 1) {
      x += i % 20 < 10 ? 6 : -6;
      fire("pointermove", x, box.top + 100);
      await frame();
    }
    fire("pointerup", x, box.top + 100);
  });
  await expect(root(page)).toHaveAttribute("data-tier", "high");
});

/** The memory the layers of the 3D view are counted at: every plane's box, times the device's pixel ratio squared, four bytes a pixel, in megabytes (what `scripts/perf-district.mjs` reports). */
const layerMegabytes = (page) => page.evaluate(() => {
  const dpr = window.devicePixelRatio;
  let pixels = 0;
  for (const el of document.querySelectorAll(".ky-turn-floor, .ky-up")) pixels += el.offsetWidth * el.offsetHeight * dpr * dpr;
  return (pixels * 4) / 1048576;
});
const share = async (page) => Number(await root(page).getAttribute("data-share"));

test("the layers are made as fine as the screen shows them and no finer, finer again after a zoom, and the picture does not move", async ({ page }, info) => {
  test.setTimeout(90_000);
  const errors = await open(page, "venues=kodokan&context=0&view=3d&viewpoint=broadcast&quality=high");
  await expect(root(page)).toHaveAttribute("data-tier", "high");
  const first = await share(page);
  const phone = info.project.name !== "chromium-desk";
  // On a phone the whole scene is a sixth of its own size: the layers are a quarter as wide, a sixteenth of the pixels (the Kodokan's 713 megabytes at a ratio of 3 were 45).
  if (phone) expect(first, "share on a phone").toBeLessThanOrEqual(0.4);
  expect(first).toBeLessThanOrEqual(1);
  const small = await layerMegabytes(page);
  if (phone) expect(small, "layers on a phone").toBeLessThan(120);
  // (A wide screen needs the whole of them: nothing to make coarser there, and no finer to ask for.)
  if (first < 1) {
    const before = await floorBox(page);
    // Zoomed in, the view needs a finer share: it is drawn again at it a moment after the zoom stops, and the floor is where the zoom puts it.
    for (let i = 0; i < 7; i += 1) await press(page, page.locator(`${STAGE} button[data-act="zoom-in"]`));
    await expect.poll(() => share(page), { timeout: 5000 }).toBeGreaterThan(first);
    const zoomed = await floorBox(page);
    expect(zoomed[2]).toBeGreaterThan(before[2] * 2);
    await expect.poll(() => layerMegabytes(page), { timeout: 5000 }).toBeGreaterThan(small);
    // Back out, and after a while at rest the layers are made coarser again, the floor where it was.
    for (let i = 0; i < 7; i += 1) await press(page, page.locator(`${STAGE} button[data-act="zoom-out"]`));
    await expect.poll(() => share(page), { timeout: 8000 }).toBe(first);
    sameBox(await floorBox(page), before, "the floor after a zoom in and out");
  }
  expect(errors).toEqual([]);
});
