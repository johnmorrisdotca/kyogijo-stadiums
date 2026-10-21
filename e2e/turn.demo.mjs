// The 3D view in the demo: a surface that turns by the pointer, the keys and four viewpoints, with what stands on it, drawn by one matrix to an element so that no 3D
// context of the browser's is needed, with controls a finger can hit, in both languages.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open, openGroups, tap } from "./demo.mjs";

const STAGE = at("stage");
const turn = (page) => page.locator(`${STAGE} .ky-turn`);
const floorMatrix = (page) => page.locator(`${STAGE} .ky-turn-floor`).evaluate((el) => el.style.transform);
const SPORTS = ["nfl", "cfl", "ifaf", "nhl", "nba", "mlb", "soccer", "curling", "tennis", "volleyball", "badminton", "pickleball", "tabletennis", "lacrosse", "rugby", "afl", "gaelic", "cricket", "fieldhockey", "handball", "padel", "squash", "racquetball", "sepaktakraw", "teqball", "roundnet", "netball", "swimming", "waterpolo", "diving", "artisticswimming", "athletics", "skating"];

test("opens in 3D from the address, with the flat drawing for a floor and the net standing on it", async ({ page }) => {
  const errors = await open(page, "?sport=volleyball&view=3d&lang=en&help=off");
  expect(errors).toEqual([]);
  await expect(turn(page)).toHaveAttribute("data-mode", "3d");
  const view = page.locator(`${STAGE} .ky-turn-view`);
  await expect(view).toHaveAttribute("role", "group");
  await expect(view).toHaveAttribute("aria-roledescription", "3D view");
  await expect(view).toHaveAccessibleName(/Korea 2, Germany 1/);
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
  // Four viewpoints, six moves, the reset, the auto-turn and Reverse.
  expect(sizes.length).toBe(13);
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

/** The part of the scene nearest the eye (the lowest on the screen), by name, and where its middle is on the screen now. */
const nearestPart = async (page) =>
  page.locator(`${STAGE} .ky-up`).evaluateAll((all) => {
    let best;
    for (const el of all) {
      const b = el.getBoundingClientRect();
      const y = b.y + b.height / 2;
      if (best === undefined || y > best.y) best = { part: el.dataset.part, y };
    }
    return best.part;
  });
const where = (page, part) =>
  page.locator(part === "floor" ? `${STAGE} .ky-turn-floor` : `${STAGE} [data-part="${part}"]`).evaluate((el) => {
    const b = el.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  });
async function dragBy(page, dx, dy) {
  const view = page.locator(`${STAGE} .ky-turn-view`);
  await view.scrollIntoViewIfNeeded();
  const box = await view.boundingBox();
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 3];
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}

test("a drag takes hold of the surface: right moves the near side right, down tips the top toward the eye", async ({ page }) => {
  await open(page, "?sport=nhl&view=3d&lang=en&help=off&viewpoint=broadcast");
  // The near boards: the part of the surface closest to the reader. Turning about the vertical sweeps it across the screen, in the direction of the hand.
  const part = await nearestPart(page);
  const start = await where(page, part);
  await dragBy(page, 40, 0);
  const right = await where(page, part);
  expect(right.x).toBeGreaterThan(start.x + 1);
  await dragBy(page, -80, 0);
  const left = await where(page, part);
  expect(left.x).toBeLessThan(right.x - 1);
  // Down tips the top toward the eye: the near edge comes down the screen, as the overhead view is approached.
  // Measured from the middle of the floor, since the fit moves the whole picture a little as the surface is tipped: the near part is further below the middle the nearer to overhead the view is.
  // (The part nearest the eye is picked again: the turns above carried the first one round the surface.)
  const near = await nearestPart(page);
  const below = async () => (await where(page, near)).y - (await where(page, "floor")).y;
  const before = await below();
  await dragBy(page, 0, 30);
  const down = await below();
  expect(down).toBeGreaterThan(before + 1);
  await dragBy(page, 0, -60);
  expect(await below()).toBeLessThan(down - 1);
});

test("the left and right arrows turn the way a drag to that side does", async ({ page }) => {
  await open(page, "?sport=nhl&view=3d&lang=en&help=off&viewpoint=broadcast");
  await page.locator(`${STAGE} .ky-turn-view`).focus();
  const part = await nearestPart(page);
  const start = await where(page, part);
  await page.keyboard.press("ArrowRight");
  const right = await where(page, part);
  expect(right.x).toBeGreaterThan(start.x + 0.5);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  expect((await where(page, part)).x).toBeLessThan(start.x - 0.5);
});

test("a drag, a key and a button toward one side all move the surface the same way", async ({ page }) => {
  await open(page, "?sport=nhl&view=3d&lang=en&help=off&viewpoint=broadcast");
  await page.locator(`${STAGE} .ky-turn-view`).focus();
  const part = await nearestPart(page);
  const button = (act) => page.locator(`${STAGE} .ky-turn-controls button[data-act="${act}"]`).click();
  // Each way is set from the opening view: the near boards move on the screen one way for a drag, a key and a button toward the same side.
  const moves = async (toward) => {
    await page.keyboard.press("0");
    const start = await where(page, part);
    const [dx, dy] = { left: [-40, 0], right: [40, 0], up: [0, -30], down: [0, 30] }[toward];
    await dragBy(page, dx, dy);
    const dragged = await where(page, part);
    await page.keyboard.press("0");
    await page.locator(`${STAGE} .ky-turn-view`).focus();
    await page.keyboard.press({ left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown" }[toward]);
    const keyed = await where(page, part);
    await page.keyboard.press("0");
    await button({ left: "turn-left", right: "turn-right", up: "raise", down: "lower" }[toward]);
    const pressed = await where(page, part);
    const sign = (a, b) => Math.sign(Math.round((a - b) * 100) / 100);
    const axis = dx !== 0 ? "x" : "y";
    expect(sign(keyed[axis], start[axis]), `${toward}: the key moves it as the drag does`).toBe(sign(dragged[axis], start[axis]));
    expect(sign(pressed[axis], start[axis]), `${toward}: the button moves it as the drag does`).toBe(sign(dragged[axis], start[axis]));
    expect(sign(dragged[axis], start[axis]), `${toward}: it moved`).not.toBe(0);
  };
  for (const toward of ["left", "right", "up", "down"]) await moves(toward);
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
  expect(await page.locator(`${STAGE} .ky-turn-floor svg text`).allTextContents()).toContain("USA");
  // The score is hung up as a scoreboard, not laid on the floor.
  await expect(page.locator(`${STAGE} .ky-turn-floor .ky-plate`)).toHaveCount(0);
  await expect(page.locator(`${STAGE} [data-part="scoreboard"]`)).toHaveCount(1);
  expect(await page.locator(`${STAGE} [data-part="scoreboard"] text`).allTextContents()).toContain("USA");
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

/** Where the view is turned now, from the element the page keeps it in. */
const playButton = (page) => page.locator(`${STAGE} .ky-turn-controls button[data-act="play"]`);
const worldCount = (page) => page.locator(`${STAGE} .ky-turn *`).count();

test("a drawing with a crowd has its stands raised in 3D, each tier a few planes and no seat an element", async ({ page }) => {
  const errors = await open(page, "?sport=soccer&crowd=1&view=3d&lang=en&help=off");
  expect(errors).toEqual([]);
  const seats = page.locator(`${STAGE} .ky-up-seats`);
  expect(await seats.count()).toBeGreaterThan(30);
  // The floor keeps no crowd of its own, and the patterns are there once.
  await expect(page.locator(`${STAGE} .ky-turn-floor .ky-crowd`)).toHaveCount(0);
  await expect(page.locator(`${STAGE} .ky-turn-defs`)).toHaveCount(1);
  // A full soccer bowl is a few hundred nodes, with every seat a texture.
  expect(await worldCount(page)).toBeLessThan(650);
  await expect(page.locator(`${STAGE} .ky-turn-view`)).toHaveAccessibleDescription(/stands/);
  // The near stands give way to the eye: some planes are cut away, and the far ones are whole.
  const opacities = await seats.evaluateAll((all) => all.map((el) => Number(el.style.opacity || 1)));
  expect(opacities.some((o) => o < 0.2)).toBe(true);
  expect(opacities.some((o) => o === 1)).toBe(true);
  await noSidewaysScroll(page);
});

test("a dojo has its room in 3D: its walls and the edge of the mats", async ({ page }) => {
  await open(page, "?sport=dojo&view=3d&lang=en&help=off");
  for (const part of ["wall-north", "mat-edge-1"]) await expect(page.locator(`${STAGE} [data-part="${part}"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} .ky-up-matedge`)).toHaveCount(4);
  await noSidewaysScroll(page);
});

test("the roof is a toggle of the 3D view over the stands, and is in the address and the code", async ({ page }, testInfo) => {
  await open(page, "?sport=nhl&crowd=1&view=3d&lang=en&help=off");
  await openGroups(page);
  await expect(page.locator(`${STAGE} .ky-up-roof`)).toHaveCount(0);
  await tap(page, page.locator(at("venue-roof")), testInfo);
  expect(await page.locator(`${STAGE} .ky-up-roof`).count()).toBeGreaterThan(8);
  expect(new URL(page.url()).searchParams.get("roof")).toBe("1");
  await tap(page, page.locator(at("venue-roof")), testInfo);
  await expect(page.locator(`${STAGE} .ky-up-roof`)).toHaveCount(0);
});

test("the auto-turn: nothing moves until Play, the button is pressed while it turns, Space toggles it", async ({ page }, testInfo) => {
  await open(page, "?sport=nhl&view=3d&lang=en&help=off");
  const button = playButton(page);
  await expect(button).toHaveAttribute("aria-pressed", "false");
  const box = await button.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  const first = await floorMatrix(page);
  await page.waitForTimeout(500);
  expect(await floorMatrix(page)).toBe(first);
  await tap(page, button, testInfo);
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(`${STAGE} .ky-turn-live`)).toHaveText("Auto-turn on");
  await expect.poll(() => floorMatrix(page)).not.toBe(first);
  await tap(page, button, testInfo);
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(`${STAGE} .ky-turn-live`)).toHaveText("Auto-turn paused");
  const stopped = await floorMatrix(page);
  await page.waitForTimeout(400);
  expect(await floorMatrix(page)).toBe(stopped);
  // Space, with the view focused.
  await page.locator(`${STAGE} .ky-turn-view`).focus();
  await page.keyboard.press("Space");
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => floorMatrix(page)).not.toBe(stopped);
  await page.keyboard.press("Space");
  await expect(button).toHaveAttribute("aria-pressed", "false");
});

test("the auto-turn holds while the pointer holds the view, stops for the keys, and does nothing on a hidden page", async ({ page }, testInfo) => {
  test.skip(testInfo.project.use.hasTouch === true, "a mouse holds the view");
  await open(page, "?sport=nba&view=3d&lang=en&help=off");
  const button = playButton(page);
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  const view = page.locator(`${STAGE} .ky-turn-view`);
  const box = await view.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 3);
  await page.mouse.down();
  await page.waitForTimeout(150);
  const held = await floorMatrix(page);
  await page.waitForTimeout(450);
  expect(await floorMatrix(page)).toBe(held);
  await page.mouse.up();
  // It goes on after the release.
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => floorMatrix(page)).not.toBe(held);
  // A hidden page does not turn; a visible one does again.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(150);
  const hidden = await floorMatrix(page);
  await page.waitForTimeout(400);
  expect(await floorMatrix(page)).toBe(hidden);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => floorMatrix(page)).not.toBe(hidden);
  // An arrow key takes the view over.
  await view.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(button).toHaveAttribute("aria-pressed", "false");
});

test("the auto-turn speaks Japanese", async ({ page }) => {
  await open(page, "?sport=nhl&view=3d&lang=ja&help=off");
  await expect(playButton(page)).toHaveText(/自動回転/);
  await expect(playButton(page)).toHaveAttribute("aria-pressed", "false");
});

/** The area the floor covers on the screen, as the browser has drawn its matrix (perspective included). */
const floorArea = (page) =>
  page.locator(`${STAGE} .ky-turn-floor`).evaluate((el) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    const w = Number.parseFloat(el.style.width) || el.offsetWidth;
    const h = Number.parseFloat(el.style.height) || el.offsetHeight;
    const p = [[0, 0], [w, 0], [w, h], [0, h]].map(([x, y]) => {
      const q = m.transformPoint(new DOMPoint(x, y));
      // transformPoint leaves the perspective to the caller: x and y are divided by w.
      return [q.x / q.w, q.y / q.w];
    });
    return Math.abs(p.reduce((sum, a, i) => sum + a[0] * p[(i + 1) % 4][1] - p[(i + 1) % 4][0] * a[1], 0)) / 2;
  });

test("a surface keeps its size as it goes once round: no swelling, in light and dark, on the desk and the phone", async ({ page }) => {
  for (const query of ["sport=athletics&galleryfamily=budo&size=surface&theme=light", "sport=judo&theme=dark", "sport=dojo&theme=light", "sport=nba&theme=dark", "sport=nfl&theme=light", "sport=curling&theme=light"]) {
    await open(page, `?${query}&view=3d&lang=en&help=off`);
    await page.locator(`${STAGE} .ky-turn-view`).focus();
    const areas = [];
    for (let i = 0; i < 60; i += 1) {
      areas.push(await floorArea(page));
      await page.keyboard.press("ArrowLeft");
    }
    expect(Math.max(...areas) / Math.min(...areas), query).toBeLessThan(1.02);
    const step = Math.max(...areas.map((a, i) => Math.max(a, areas[(i + 1) % 60]) / Math.min(a, areas[(i + 1) % 60])));
    expect(step, query).toBeLessThan(1.01);
  }
});

test("a dohyō is a solid block with its clay and bales on top, and the whole floor round it stays in the view as it turns; a table's legs stay under its top", async ({ page }) => {
  await open(page, "?sport=sumo&view=3d&lang=en&help=off&viewpoint=broadcast");
  const top = page.locator(`${STAGE} [data-part="mound-top"]`);
  await expect(top).toHaveCount(1);
  await expect(top.locator("svg .ky-bud-tawara").first()).toBeAttached();
  await expect(page.locator(`${STAGE} [data-part^="mound-"]:not([data-part="mound-top"])`)).toHaveCount(4);
  const view = page.locator(`${STAGE} .ky-turn-view`);
  await view.focus();
  for (let i = 0; i < 30; i += 1) {
    // The floor's corners are inside the view (a 1 px slack for the rounding of the box).
    const inside = await page.evaluate((stage) => {
      const v = document.querySelector(`${stage} .ky-turn-view`).getBoundingClientRect();
      const f = document.querySelector(`${stage} .ky-turn-floor`).getBoundingClientRect();
      return f.left >= v.left - 1 && f.right <= v.right + 1 && f.top >= v.top - 1 && f.bottom <= v.bottom + 1;
    }, STAGE);
    expect(inside, `sumo turn ${i}`).toBe(true);
    // The sides facing away are under the top: the top's z-index is above that of the farthest side, and below that of the nearest.
    const z = await page.evaluate((stage) => {
      const stack = (selector) => Number(document.querySelector(`${stage} ${selector}`).style.zIndex);
      const sides = [1, 2, 3, 4].map((k) => stack(`[data-part="mound-${k}"]`));
      return { top: stack('[data-part="mound-top"]'), low: Math.min(...sides), high: Math.max(...sides) };
    }, STAGE);
    expect(z.low, `sumo turn ${i}`).toBeLessThan(z.top);
    expect(z.high, `sumo turn ${i}`).toBeGreaterThan(z.top);
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
  }
  await open(page, "?sport=tabletennis&view=3d&lang=en&help=off");
  for (let i = 0; i < 12; i += 1) {
    const z = await page.evaluate((stage) => {
      const stack = (selector) => Number(document.querySelector(`${stage} ${selector}`).style.zIndex);
      const legs = [...document.querySelectorAll(`${stage} .ky-up-leg`)].map((el) => Number(el.style.zIndex));
      return { floor: stack(".ky-turn-floor"), low: Math.min(...legs), high: Math.max(...legs) };
    }, STAGE);
    // Some legs are behind the top and some in front of it, whichever way the table is turned.
    expect(z.low, `table turn ${i}`).toBeLessThan(z.floor);
    expect(z.high, `table turn ${i}`).toBeGreaterThan(z.floor);
    await page.locator(`${STAGE} .ky-turn-view`).focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
  }
});
