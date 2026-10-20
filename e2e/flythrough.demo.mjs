// The fly-through page: a map that falls to the city and the real building of an arena, which rises into 3D and turns, in a real browser. It is tested the way it is used: a reader who prefers reduced motion gets each stage as
// a still and steps through them; one who does not gets one smooth camera, which the test walks frame by frame (`seek`) and checks for jumps in what is on the screen; the controls play, pause, step back and skip to a stage; the
// credit is shown, nothing is sent anywhere, no word is stretched, and nothing is wider than the screen.
import { expect, test } from "@playwright/test";

import { noSidewaysScroll, serve } from "./demo.mjs";

const TRIP = '[data-testid="trip"]';
const STAGE = `${TRIP} .kf-stage`;

async function open(page, query = "") {
  const errors = [];
  const outside = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("request", (request) => !request.url().startsWith("http://kyogijo.test/") && !request.url().startsWith("data:") && outside.push(request.url()));
  await serve(page);
  await page.goto(`http://kyogijo.test/flythrough.html${query}`);
  await page.waitForSelector('body[data-ready="true"]');
  await page.waitForSelector(`${STAGE} .kf-map-box svg`, { state: "attached" });
  return { errors, outside };
}

/** What is on the screen of a layer, in pixels: its box. */
const box = (page, selector) => page.locator(selector).evaluate((el) => {
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height, shown: getComputedStyle(el).visibility !== "hidden" };
});

test("opens on the map for a reader who prefers reduced motion, as a still, with the stages as buttons, the credit, nothing sent anywhere and nothing wider than the screen", async ({ page }) => {
  const { errors, outside } = await open(page);
  const root = page.locator(`${TRIP} .kf`);
  await expect(root).toHaveAttribute("data-mode", "stages");
  await expect(root).toHaveAttribute("data-stage", "map");
  await expect(page.locator(`${TRIP} button[data-stage]`)).toHaveText(["1. Map", "2. City", "3. Arena"]);
  await expect(page.locator(`${TRIP} button[data-stage="map"]`)).toHaveAttribute("aria-current", "step");
  await expect(page.locator(`${TRIP} .kf-still`)).toContainText("reduce motion");
  await expect(page.locator(`${TRIP} .kf-credit`)).toContainText("(c) OpenStreetMap contributors, ODbL 1.0");
  await expect(page.locator(`${TRIP} .kf-credit`)).toContainText("Natural Earth");
  await expect(page.locator(`${TRIP} .kf-caption`)).toContainText("Honda Center stands in Anaheim, United States.");
  // The map is the only layer showing, and nothing moves.
  expect((await box(page, `${TRIP} .kf-map`)).shown).toBe(true);
  expect((await box(page, `${TRIP} .kf-site`)).shown).toBe(false);
  expect((await box(page, `${TRIP} .kf-3d`)).shown).toBe(false);
  const before = await page.evaluate(() => window.flythrough.time);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.flythrough.time)).toBe(before);
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
  await noSidewaysScroll(page);
});

test("steps from stage to stage with the buttons and the keys, each a still: the map, the building's plan, then the arena in 3D at the main camera", async ({ page }) => {
  await open(page);
  const root = page.locator(`${TRIP} .kf`);
  await page.locator(`${TRIP} button[data-act="next"]`).click();
  await expect(root).toHaveAttribute("data-stage", "city");
  await expect(page.locator(`${TRIP} .kf-caption`)).toContainText("The building of Honda Center from above, as OpenStreetMap maps it.");
  expect((await box(page, `${TRIP} .kf-map`)).shown).toBe(false);
  expect((await box(page, `${TRIP} .kf-site`)).shown).toBe(true);
  expect((await box(page, `${TRIP} .kf-3d`)).shown).toBe(false);
  await expect(page.locator(`${TRIP} .kf-plan .ky-cr-shell`)).toHaveCount(1);
  await page.locator(`${STAGE}`).focus();
  await page.keyboard.press("ArrowRight");
  await expect(root).toHaveAttribute("data-stage", "arena");
  expect((await box(page, `${TRIP} .kf-3d`)).shown).toBe(true);
  expect((await box(page, `${TRIP} .kf-site`)).shown).toBe(false);
  await expect(page.locator(`${TRIP} .kf-3d .ky-turn[data-mode="3d"]`)).toHaveCount(1);
  await expect(page.locator(`${TRIP} .kf-3d .ky-turn`)).toHaveAttribute("data-preset", "broadcast");
  await expect(page.locator(`${TRIP} .kf-live`)).toContainText("Stage 3 of 3: Arena.");
  // The last stage stays: next does nothing, back goes to the stage before, a number key and a stage button go to any.
  await page.locator(`${TRIP} button[data-act="next"]`).click();
  await expect(root).toHaveAttribute("data-stage", "arena");
  await page.locator(`${TRIP} button[data-act="back"]`).click();
  await expect(root).toHaveAttribute("data-stage", "city");
  await page.locator(`${STAGE}`).focus();
  await page.keyboard.press("1");
  await expect(root).toHaveAttribute("data-stage", "map");
  await page.locator(`${TRIP} button[data-stage="arena"]`).click();
  await expect(root).toHaveAttribute("data-stage", "arena");
  await page.locator(`${STAGE}`).focus();
  await page.keyboard.press("Home");
  await expect(root).toHaveAttribute("data-stage", "map");
});

test("plays by stages for a reader who prefers reduced motion: Play steps to the next still on its own, and stops at the last", async ({ page }) => {
  await open(page, "");
  await page.evaluate(() => { window.flythrough.goTo("city"); });
  await page.locator(`${TRIP} button[data-act="play"]`).click();
  await expect(page.locator(`${TRIP} button[data-act="play"]`)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(`${TRIP} .kf`)).toHaveAttribute("data-stage", "arena", { timeout: 9000 });
  await expect(page.locator(`${TRIP} button[data-act="play"]`)).toHaveAttribute("aria-pressed", "false", { timeout: 7000 });
});

test("flies for a reader who does not prefer reduced motion: one smooth camera, with the plan and the 3D arena the same size where they hand over", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const { errors } = await open(page, "?speed=1");
  await expect(page.locator(`${TRIP} .kf`)).toHaveAttribute("data-mode", "motion");
  const end = await page.evaluate(() => window.flythrough.duration);
  const arenaStart = await page.evaluate(() => {
    const trip = window.flythrough;
    let lo = 0;
    for (let t = 0; t < trip.duration + 1; t += 0.05) { trip.seek(t); if (trip.stage === "arena") { lo = t; break; } }
    return lo;
  });
  expect(arenaStart).toBeGreaterThan(5);
  // Walk it, thirty frames a second, and watch the screen: what is drawn never jumps.
  const trace = await page.evaluate(({ end }) => {
    const trip = window.flythrough;
    const rect = (sel) => { const el = document.querySelector(sel); if (el === null) return null; const r = el.getBoundingClientRect(); return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width, h: r.height }; };
    const out = [];
    for (let t = 0; t <= end + 4; t += 1 / 30) {
      trip.seek(t);
      out.push({ t, stage: trip.stage, cam: trip.camera(), pin: rect(".kf-pin"), plan: rect(".kf-plan .ky-apron"), floor: rect(".kf-3d .ky-turn-floor svg"), bar: document.querySelector(".kf-scale-bar").getBoundingClientRect().width, hidden3d: getComputedStyle(document.querySelector(".kf-3d")).visibility });
    }
    return out;
  }, { end });
  const stages = trace.map((f) => f.stage).filter((s, i, all) => all.indexOf(s) === i);
  expect(stages).toEqual(["map", "city", "arena"]);
  for (let i = 1; i < trace.length; i += 1) {
    const [a, b] = [trace[i - 1], trace[i]];
    // The pin stays where the arena is, within a few pixels a frame; the plan and the 3D floor change size by a few percent a frame, and their middles move little.
    if (a.pin !== null && b.pin !== null) expect(Math.hypot(b.pin.cx - a.pin.cx, b.pin.cy - a.pin.cy), `pin at ${b.t}`).toBeLessThan(12);
    if (a.plan !== null && b.plan !== null && a.cam.site > 0.05 && b.cam.site > 0.05) {
      expect(b.plan.w / a.plan.w, `plan at ${b.t}`).toBeLessThan(1.1);
      expect(b.plan.w / a.plan.w, `plan at ${b.t}`).toBeGreaterThan(1 / 1.1);
      expect(Math.hypot(b.plan.cx - a.plan.cx, b.plan.cy - a.plan.cy), `plan middle at ${b.t}`).toBeLessThan(25);
    }
    if (a.cam.arena > 0.05 && b.cam.arena > 0.05) {
      expect(b.floor.w / a.floor.w, `floor at ${b.t}`).toBeLessThan(1.1);
      expect(b.floor.w / a.floor.w, `floor at ${b.t}`).toBeGreaterThan(1 / 1.1);
      expect(Math.hypot(b.floor.cx - a.floor.cx, b.floor.cy - a.floor.cy), `floor middle at ${b.t}`).toBeLessThan(40);
    }
    expect(Math.abs(b.bar - a.bar), `scale bar at ${b.t}`).toBeLessThan(160);
  }
  // At the hand-over the plan and the 3D arena seen from above are the same size, in the same place: the plan's sheet and the floor's.
  const hand = trace.filter((f) => f.cam.site > 0.5 && f.cam.arena > 0.5 && f.cam.pitch < 0.5).at(0);
  expect(hand).toBeDefined();
  expect(Math.abs(hand.plan.w / hand.floor.w - 1)).toBeLessThan(0.015);
  expect(Math.abs(hand.plan.cx - hand.floor.cx)).toBeLessThan(3);
  expect(Math.abs(hand.plan.cy - hand.floor.cy)).toBeLessThan(3);
  // The arena turns for ever after the end: the turn goes on, and the camera does nothing else.
  const [x, y] = [trace[trace.length - 30].cam, trace[trace.length - 1].cam];
  expect(Math.abs(y.yaw - x.yaw)).toBeGreaterThan(5);
  expect(y.pitch).toBeCloseTo(x.pitch, 9);
  expect(errors).toEqual([]);
});

test("plays and pauses: Play flies, Pause eases to a stop and the clock stays still, Space does the same, and a skip glides to the stage and stays there", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "?speed=4");
  const play = page.locator(`${TRIP} button[data-act="play"]`);
  // It plays on its own when the reader does not prefer reduced motion.
  await expect(play).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.evaluate(() => window.flythrough.time)).toBeGreaterThan(0.5);
  await play.click();
  await expect(play).toHaveAttribute("aria-pressed", "false");
  await page.waitForTimeout(700);
  const held = await page.evaluate(() => window.flythrough.time);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.flythrough.time)).toBe(held);
  await page.locator(STAGE).focus();
  await page.keyboard.press(" ");
  await expect(play).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press(" ");
  await expect(play).toHaveAttribute("aria-pressed", "false");
  // A skip to the arena glides there along the path, and the clock then rests at the stage's start.
  await page.locator(`${TRIP} button[data-stage="arena"]`).click();
  await expect(page.locator(`${TRIP} .kf`)).toHaveAttribute("data-stage", "arena", { timeout: 4000 });
  await page.waitForTimeout(2200);
  const arrived = await page.evaluate(() => ({ time: window.flythrough.time, start: window.flythrough.camera() }));
  expect(arrived.start.arena).toBe(1);
  await page.locator(`${TRIP} button[data-stage="map"]`).click();
  await expect(page.locator(`${TRIP} .kf`)).toHaveAttribute("data-stage", "map", { timeout: 4000 });
  await page.waitForTimeout(2200);
  expect(await page.evaluate(() => window.flythrough.time)).toBe(0);
  expect((await page.evaluate(() => window.flythrough.camera())).map).toBe(1);
});

test("never stretches a word: no text sits in a layer that is scaled or turned, and the map layer holds none", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "");
  for (const t of [0, 6.7, 9, 12]) {
    await page.evaluate((time) => window.flythrough.seek(time), t);
    const stretched = await page.locator(TRIP).evaluate((root) => {
      const bad = [];
      // Text nodes (4 is NodeFilter.SHOW_TEXT), but not what is not drawn (titles, descriptions, styles) and not the 3D scene, whose floor lies flat in perspective by design.
      const walker = document.createTreeWalker(root, 4);
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        if (node.textContent.trim() === "" || ["title", "desc", "style"].includes(node.parentElement.localName) || node.parentElement.closest(".kf-3d") !== null) continue;
        for (let el = node.parentElement; el !== null && el !== root; el = el.parentElement) {
          const transform = getComputedStyle(el).transform;
          if (transform !== "none") bad.push(`${node.textContent.trim().slice(0, 30)} in ${el.className || el.tagName}: ${transform}`);
        }
      }
      return bad;
    });
    expect(stretched, `at ${t}`).toEqual([]);
  }
  expect(await page.locator(`${TRIP} .kf-map text`).count()).toBe(0);
  expect(await page.locator(`${TRIP} .kf-site text`).count()).toBe(0);
});

test("draws light and dark, forced or following the device, with the credit and the controls readable and at least 44 pixels", async ({ page }) => {
  await open(page, "?theme=dark");
  await expect(page.locator(`${TRIP} .kf`)).toHaveAttribute("data-theme", "dark");
  const dark = await page.locator(STAGE).evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.goto("http://kyogijo.test/flythrough.html?theme=light");
  await page.waitForSelector('body[data-ready="true"]');
  const light = await page.locator(STAGE).evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(dark).not.toBe(light);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("http://kyogijo.test/flythrough.html");
  await page.waitForSelector('body[data-ready="true"]');
  expect(await page.locator(STAGE).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(dark);
  for (const button of await page.locator(`${TRIP} button`).all()) {
    const size = await button.boundingBox();
    expect(size.height).toBeGreaterThanOrEqual(43.5);
    expect(size.width).toBeGreaterThanOrEqual(43.5);
  }
  await expect(page.locator(`${TRIP} .kf-credit`)).toBeVisible();
});

test("speaks Japanese with the same stages, and a plain graticule when no map is given", async ({ page }) => {
  const { errors } = await open(page, "?lang=ja&map=plain");
  await expect(page.locator(`${TRIP} button[data-stage]`)).toHaveText(["1. 地図", "2. 都市", "3. アリーナ"]);
  await expect(page.locator(`${TRIP} .kf-credit`)).toContainText("OpenStreetMap contributors");
  await expect(page.locator(`${TRIP} .kf-credit`)).not.toContainText("Natural Earth");
  await expect(page.locator(`${TRIP} .kf-caption`)).toContainText("にあります");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  expect(errors).toEqual([]);
});

test("flies to every arena the package has a venue for, chosen in the address, and says so when it is given one it does not know", async ({ page }) => {
  const { errors } = await open(page, "?arena=scotiabank-saddledome");
  await expect(page.locator('#tabs button[aria-pressed="true"]')).toHaveText("Scotiabank Saddledome");
  await page.locator('#tabs button[data-arena="rogers-arena"]').click();
  await expect(page.locator(`${TRIP} .kf-caption`)).toContainText("Rogers Arena stands in Vancouver, Canada.");
  expect(page.url()).toContain("arena=rogers-arena");
  await page.locator(`${TRIP} button[data-stage="arena"]`).click();
  await expect(page.locator(`${TRIP} .kf .kf-3d .ky-turn`)).toHaveCount(1);
  const error = await page.evaluate(async () => {
    const { mountFlythrough } = await import("./dist/flythrough-entry.js");
    try { mountFlythrough(document.createElement("div"), { arena: "boston-garden" }); return "none"; } catch (e) { return e.message; }
  });
  expect(error).toContain("no real venue");
  expect(errors).toEqual([]);
});

test("keeps the stage inside the screen on a phone and a desk, with the controls under it", async ({ page }) => {
  await open(page, "");
  const stage = await page.locator(STAGE).boundingBox();
  const viewport = page.viewportSize();
  expect(stage.x).toBeGreaterThanOrEqual(0);
  expect(stage.x + stage.width).toBeLessThanOrEqual(viewport.width + 0.5);
  const controls = await page.locator(`${TRIP} .kf-controls`).boundingBox();
  expect(controls.y).toBeGreaterThan(stage.y + stage.height - 1);
  await noSidewaysScroll(page);
});

test("flies the stages asked for, from where the first of them starts, and looks first where the page says: the arena off the middle, then in it", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const { errors } = await open(page, "?stages=city,arena");
  await expect(page.locator(`${TRIP} button[data-stage]`)).toHaveText(["1. City", "2. Arena"]);
  await expect(page.locator(`${TRIP} .kf`)).toHaveAttribute("data-stage", "city");
  expect(await page.evaluate(() => window.flythrough.stages)).toEqual(["city", "arena"]);
  // A page that starts the camera looking elsewhere: the arena stands off the middle at first (Honda Center is south-west of a camera over Calgary), and comes to the middle as the camera falls.
  const seen = await page.evaluate(async () => {
    const { mountFlythrough } = await import("./dist/flythrough-entry.js");
    const { default: WORLD } = await import("./chizu/world-entry.js");
    const { drawChizu } = await import("./chizu/draw-entry.js");
    const { projectPoint } = await import("./chizu/index.js");
    const host = document.createElement("div");
    host.style.width = "900px";
    document.body.append(host);
    const trip = mountFlythrough(host, { arena: "honda-center", start: { map: WORLD, draw: drawChizu, project: projectPoint, centre: [-114, 51] } }, { autoPlay: false, motion: "smooth", id: "off-centre" });
    const stage = host.querySelector(".kf-stage").getBoundingClientRect();
    const at = (sel) => { const r = host.querySelector(sel).getBoundingClientRect(); return { x: r.x + r.width / 2 - stage.x - stage.width / 2, y: r.y + r.height / 2 - stage.y - stage.height / 2 }; };
    trip.seek(0);
    const first = at(".kf-pin");
    trip.seek(trip.duration);
    const camera = trip.camera();
    trip.destroy();
    host.remove();
    return { first, camera };
  });
  expect(seen.first.x).toBeLessThan(-20);
  expect(seen.first.y).toBeGreaterThan(20);
  expect(Math.abs(seen.camera.ax)).toBeLessThan(0.1);
  expect(errors).toEqual([]);
});
