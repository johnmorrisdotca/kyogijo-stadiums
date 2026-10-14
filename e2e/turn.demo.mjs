// The 3D view in the demo: a surface that turns by the pointer, the keys and four viewpoints, with what stands on it, drawn by one matrix to an element so that no 3D
// context of the browser's is needed, with controls a finger can hit, in both languages.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open, tap } from "./demo.mjs";

const STAGE = at("stage");
const turn = (page) => page.locator(`${STAGE} .ky-turn`);
const floorMatrix = (page) => page.locator(`${STAGE} .ky-turn-floor`).evaluate((el) => el.style.transform);
const SPORTS = ["nfl", "cfl", "ifaf", "nhl", "nba", "mlb", "soccer", "curling", "tennis", "volleyball", "badminton", "pickleball", "tabletennis", "lacrosse", "rugby", "afl", "gaelic", "cricket", "fieldhockey", "handball", "padel", "squash", "racquetball", "sepaktakraw", "teqball", "roundnet", "netball"];

test("opens in 3D from the address, with the flat drawing for a floor and the net standing on it", async ({ page }) => {
  const errors = await open(page, "?sport=volleyball&view=3d&lang=en&help=off");
  expect(errors).toEqual([]);
  await expect(turn(page)).toHaveAttribute("data-mode", "3d");
  const view = page.locator(`${STAGE} .ky-turn-view`);
  await expect(view).toHaveAttribute("role", "group");
  await expect(view).toHaveAttribute("aria-roledescription", "3D view");
  await expect(view).toHaveAccessibleName(/Harbour City Gulls 2, Prairie Ridge Bison 1/);
  expect(await view.getAttribute("aria-describedby")).toBeTruthy();
  await expect(page.locator(`${STAGE} .ky-turn-floor svg.kyogijo`)).toHaveAttribute("role", "img");
  await expect(page.locator(`${STAGE} [data-part="net"]`)).toHaveCount(1);
  expect(await page.locator(`${STAGE} .ky-up`).count()).toBeGreaterThan(5);
  // Nothing of it needs the browser's own 3D context.
  const nested = await page.locator(`${STAGE}, ${STAGE} *`).evaluateAll((all) => all.filter((el) => getComputedStyle(el).transformStyle === "preserve-3d").length);
  expect(nested).toBe(0);
  await noSidewaysScroll(page);
});

test("the view switch goes to 3D and back, and the address follows", async ({ page }, testInfo) => {
  await open(page, "?sport=nhl&lang=en&help=off");
  await expect(turn(page)).toHaveCount(0);
  await tap(page, page.locator(`${at("view")} button[data-value="3d"]`), testInfo);
  await expect(turn(page)).toHaveAttribute("data-mode", "3d");
  expect(new URL(page.url()).searchParams.get("view")).toBe("3d");
  await expect(page.locator(`${STAGE} [data-part="goal-left-back"]`)).toHaveCount(1);
  await tap(page, page.locator(`${at("view")} button[data-value="flat"]`), testInfo);
  await expect(turn(page)).toHaveCount(0);
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveCount(1);
  expect(new URL(page.url()).searchParams.get("view")).toBeNull();
});

test("a viewpoint is a button, and moves the scene", async ({ page }, testInfo) => {
  await open(page, "?sport=basketball&view=3d&lang=en&help=off".replace("basketball", "nba"));
  const bar = page.locator(`${STAGE} .ky-turn-controls`);
  await expect(bar.getByRole("group", { name: "Viewpoint" })).toBeVisible();
  const first = await floorMatrix(page);
  await tap(page, bar.getByRole("button", { name: "End-on" }), testInfo);
  await expect(turn(page)).toHaveAttribute("data-preset", "end");
  await expect(bar.getByRole("button", { name: "End-on" })).toHaveAttribute("aria-pressed", "true");
  expect(await floorMatrix(page)).not.toBe(first);
  expect(new URL(page.url()).searchParams.get("viewpoint")).toBe("end");
  await expect(page.locator(`${STAGE} .ky-turn-live`)).toHaveText("End-on view");
  await tap(page, bar.getByRole("button", { name: "Overhead" }), testInfo);
  await expect(turn(page)).toHaveAttribute("data-preset", "overhead");
  // Straight overhead the floor is a flat rectangle: no tipping in its matrix.
  expect(await floorMatrix(page)).toMatch(/^matrix3d\(/);
  await tap(page, bar.getByRole("button", { name: "Reset the view" }), testInfo);
  await expect(turn(page)).toHaveAttribute("data-preset", "corner");
  await expect(page.locator(`${STAGE} .ky-turn-live`)).toHaveText("Reset the view");
});

test("every control is a finger wide and no wider than the page", async ({ page }) => {
  await open(page, "?sport=tennis&view=3d&lang=en&help=off");
  const sizes = await page.locator(`${STAGE} .ky-turn-controls button`).evaluateAll((all) => all.map((b) => [Math.round(b.getBoundingClientRect().width), Math.round(b.getBoundingClientRect().height)]));
  expect(sizes.length).toBe(11);
  for (const [w, h] of sizes) {
    expect(w).toBeGreaterThanOrEqual(44);
    expect(h).toBeGreaterThanOrEqual(44);
  }
  await noSidewaysScroll(page);
});

test("turns by the keys: arrows turn and tip, plus and minus zoom, a number picks a viewpoint, zero puts it back", async ({ page }) => {
  await open(page, "?sport=volleyball&view=3d&lang=en&help=off");
  const view = page.locator(`${STAGE} .ky-turn-view`);
  await view.focus();
  const at0 = await floorMatrix(page);
  await page.keyboard.press("ArrowRight");
  const right = await floorMatrix(page);
  expect(right).not.toBe(at0);
  await page.keyboard.press("ArrowLeft");
  expect(await floorMatrix(page)).toBe(at0);
  await page.keyboard.press("ArrowUp");
  expect(await floorMatrix(page)).not.toBe(at0);
  await page.keyboard.press("ArrowDown");
  expect(await floorMatrix(page)).toBe(at0);
  await page.keyboard.press("+");
  expect(await floorMatrix(page)).not.toBe(at0);
  await page.keyboard.press("-");
  expect(await floorMatrix(page)).toBe(at0);
  await page.keyboard.press("2");
  await expect(turn(page)).toHaveAttribute("data-preset", "broadcast");
  await page.keyboard.press("ArrowRight");
  await expect(turn(page)).toHaveAttribute("data-preset", "custom");
  await page.keyboard.press("0");
  await expect(turn(page)).toHaveAttribute("data-preset", "corner");
  await expect(page.locator(`${STAGE} .ky-turn-live`)).toHaveText("Reset the view");
});

test("turns by a drag of the pointer, and a plain wheel leaves the page to scroll", async ({ page }) => {
  await open(page, "?sport=nhl&view=3d&lang=en&help=off");
  const view = page.locator(`${STAGE} .ky-turn-view`);
  await view.scrollIntoViewIfNeeded();
  const box = await view.boundingBox();
  const before = await floorMatrix(page);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 3);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 90, box.y + box.height / 3 + 20, { steps: 6 });
  await page.mouse.up();
  expect(await floorMatrix(page)).not.toBe(before);
  await expect(turn(page)).toHaveAttribute("data-preset", "custom");
  // Not focused: the wheel is the page's.
  await page.evaluate(() => document.activeElement?.blur?.());
  const stopped = await page.evaluate(() => {
    const event = new window.WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true });
    document.querySelector('[data-testid="stage"] .ky-turn-view').dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(stopped).toBe(false);
  // Ctrl and the wheel is a zoom.
  const zoomed = await page.evaluate(() => {
    const event = new window.WheelEvent("wheel", { deltaY: -120, ctrlKey: true, bubbles: true, cancelable: true });
    document.querySelector('[data-testid="stage"] .ky-turn-view').dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(zoomed).toBe(true);
});

test("a sideways touch turns the view and leaves a vertical swipe to the page", async ({ page }) => {
  await open(page, "?sport=nhl&view=3d&lang=en&help=off");
  const view = page.locator(`${STAGE} .ky-turn-view`);
  await expect(view).toHaveCSS("touch-action", "pan-y");
  await expect(turn(page)).toHaveAttribute("data-touch", "scroll");
});

test("stacks the parts far to near: the floor under everything, each part its own place", async ({ page }) => {
  await open(page, "?sport=volleyball&view=3d&lang=en&help=off");
  const stacks = await page.locator(`${STAGE} .ky-turn-floor, ${STAGE} .ky-up`).evaluateAll((all) => all.map((el) => Number(el.style.zIndex)));
  expect(stacks[0]).toBe(1);
  expect(new Set(stacks.slice(1)).size).toBe(stacks.length - 1);
  expect(Math.min(...stacks.slice(1))).toBeGreaterThan(1);
});

for (const sport of SPORTS) {
  test(`${sport} stands up in 3D with no complaint from the page`, async ({ page }) => {
    const errors = await open(page, `?sport=${sport}&view=3d&lang=en&help=off`);
    expect(errors).toEqual([]);
    await expect(turn(page)).toHaveAttribute("data-mode", "3d");
    const parts = await page.locator(`${STAGE} .ky-up`).count();
    // A curling sheet is flat: only its scoreboard stands up.
    if (sport === "curling") expect(parts).toBe(1);
    else expect(parts).toBeGreaterThan(4);
    const box = await page.locator(`${STAGE} .ky-turn-view`).boundingBox();
    expect(box.width).toBeGreaterThan(200);
    expect(box.height).toBeGreaterThan(200);
  });
}

test("speaks Japanese, and says what stands on the surface in it", async ({ page }) => {
  await open(page, "?sport=volleyball&view=3d&lang=ja&help=off");
  const bar = page.locator(`${STAGE} .ky-turn-controls`);
  for (const name of ["真上", "中継カメラ", "エンド側から", "低い角度から", "元に戻す"]) await expect(bar.getByRole("button", { name })).toBeVisible();
  expect(await page.locator(`${STAGE} .ky-turn-help`).textContent()).toContain("ネット 2.43 m");
  await expect(page.locator(`${STAGE} .ky-turn-view`)).toHaveAttribute("aria-roledescription", "3D表示");
});

test("keeps the score, the teams and the layers on the floor", async ({ page }) => {
  await open(page, "?sport=nhl&view=3d&lang=en&help=off");
  expect(await page.locator(`${STAGE} .ky-turn-floor svg text`).allTextContents()).toContain("NORTHERN OWLS");
  // The score is hung up as a scoreboard, not laid on the floor.
  await expect(page.locator(`${STAGE} .ky-turn-floor .ky-plate`)).toHaveCount(0);
  await expect(page.locator(`${STAGE} [data-part="scoreboard"]`)).toHaveCount(1);
  expect(await page.locator(`${STAGE} [data-part="scoreboard"] text`).allTextContents()).toContain("NOW");
});

test("the element turns with the `turn` attribute, takes a viewpoint by `turn-view`, and gives the flat drawing back", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  const out = await page.evaluate(async () => {
    const el = document.createElement("kyogijo-field");
    el.setAttribute("sport", "tennis");
    el.setAttribute("turn", "");
    el.setAttribute("turn-view", "end");
    el.setAttribute("turn-controls", "false");
    document.body.append(el);
    await new Promise((resolve) => setTimeout(resolve, 200));
    const root = el.shadowRoot;
    const first = { turning: root.querySelector(".ky-turn") !== null, parts: root.querySelectorAll(".ky-up").length, preset: root.querySelector(".ky-turn").dataset.preset, controls: root.querySelector(".ky-turn-controls") !== null, handle: el.turn?.mode };
    el.setAttribute("turn-view", "overhead");
    const next = root.querySelector(".ky-turn").dataset.preset;
    el.removeAttribute("turn");
    await new Promise((resolve) => setTimeout(resolve, 100));
    const flat = { turning: root.querySelector(".ky-turn") !== null, svg: root.querySelector("svg.kyogijo") !== null, handle: el.turn };
    el.remove();
    return { first, next, flat };
  });
  expect(out.first).toEqual({ turning: true, parts: 5, preset: "end", controls: false, handle: "3d" });
  expect(out.next).toBe("overhead");
  expect(out.flat).toEqual({ turning: false, svg: true });
});

test("keeps the flat drawing, and says why, where the browser cannot draw the planes", async ({ page }) => {
  await page.addInitScript(() => {
    window.CSS.supports = () => false;
  });
  const errors = await open(page, "?sport=volleyball&view=3d&lang=en&help=off");
  expect(errors).toEqual([]);
  await expect(turn(page)).toHaveAttribute("data-mode", "flat");
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} .ky-turn-flat`)).toHaveText("This browser cannot draw the 3D view, so the flat drawing is shown.");
  await expect(page.locator(`${STAGE} .ky-up`)).toHaveCount(0);
  await expect(page.locator(`${STAGE} .ky-turn-controls`)).toHaveCount(0);
});

test.describe("with motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("glides to a viewpoint in a short run of frames and arrives", async ({ page }, testInfo) => {
    await open(page, "?sport=soccer&view=3d&lang=en&help=off");
    const bar = page.locator(`${STAGE} .ky-turn-controls`);
    const before = await floorMatrix(page);
    await tap(page, bar.getByRole("button", { name: "Overhead" }), testInfo);
    await expect.poll(async () => await floorMatrix(page), { timeout: 3000 }).not.toBe(before);
    await page.waitForTimeout(900);
    const settled = await floorMatrix(page);
    await page.waitForTimeout(300);
    expect(await floorMatrix(page)).toBe(settled);
    await expect(turn(page)).toHaveAttribute("data-preset", "overhead");
  });
});
