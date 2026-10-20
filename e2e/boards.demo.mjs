// The boards page: a results board, a bout presentation and a medal table laid over a pool, a mat and an oval, in 2D and in 3D, in a real browser: placed off the middle of the surface, in the board's own shape (nothing stretched),
// and, in 3D, a layer that stays where it is when the view turns, tips and zooms.
import { expect, test } from "@playwright/test";

import { noSidewaysScroll, serve } from "./demo.mjs";

const STAGE = '[data-testid="stage"]';
const CLEAR = 0.34;

async function open(page, query = "") {
  const errors = [];
  const outside = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("request", (request) => !request.url().startsWith("http://kyogijo.test/") && !request.url().startsWith("data:") && outside.push(request.url()));
  await serve(page);
  await page.goto(`http://kyogijo.test/boards.html${query}`);
  await page.waitForSelector('body[data-ready="true"]');
  await page.waitForSelector(`${STAGE} svg.kyogijo, ${STAGE} .ky-turn`);
  return { errors, outside };
}

/** A box's place relative to the 3D view it is in (a click may scroll the page, and both move). */
const inView = (page, selector) => page.locator(selector).first().evaluate((node) => {
  const view = node.closest(".ky-turn-view").getBoundingClientRect();
  const { x, y, width, height } = node.getBoundingClientRect();
  return { x: x - view.x, y: y - view.y, w: width, h: height };
});
const rect = (page, selector) => page.locator(selector).first().evaluate((node) => {
  const { x, y, width, height } = node.getBoundingClientRect();
  return { x, y, w: width, h: height };
});
/** Where the drawing's own picture lies in its box: the box may be taller than the picture is (a height limit), which then sits in the middle of it. */
const picture = (page, selector) => page.locator(selector).first().evaluate((node) => {
  const { x, y, width, height } = node.getBoundingClientRect();
  const [, , vw, vh] = node.getAttribute("viewBox").split(" ").map(Number);
  const scale = Math.min(width / vw, height / vh);
  return { x: x + (width - vw * scale) / 2, y: y + (height - vh * scale) / 2, w: vw * scale, h: vh * scale };
});
const intersects = (a, b) => a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
const middle = (box) => ({ x: box.x + box.w * (0.5 - CLEAR / 2), y: box.y + box.h * (0.5 - CLEAR / 2), w: box.w * CLEAR, h: box.h * CLEAR });
/** The shape the board's picture has on its own: the picture's natural size. */
const natural = (page, selector) => page.locator(selector).first().evaluate(async (node) => {
  const image = new Image();
  image.src = node.getAttribute("href") ?? node.getAttribute("src");
  await image.decode();
  return image.naturalWidth / image.naturalHeight;
});

test("opens on the swimming final over the pool, one image, nothing sent anywhere and nothing wider than the screen", async ({ page }) => {
  const { errors, outside } = await open(page);
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveAttribute("data-board", "top");
  await expect(page.locator(`${STAGE} image.ky-board-img`)).toHaveCount(1);
  await expect(page.locator("#tabs button")).toHaveText(["Swimming final", "Judo bout", "100 m final", "Speed skating", "Medal table"]);
  await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText("Swimming final");
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
  await noSidewaysScroll(page);
});

test("every board over every surface stays inside the drawing and off the middle, and is drawn in its own shape", async ({ page }) => {
  await open(page);
  for (const example of ["swimming", "judo", "athletics", "skating", "medals"]) {
    await page.locator(`#tabs button[data-example="${example}"]`).click();
    for (const position of ["top", "bottom", "side", "left", "corner", "top-left", "top-right", "bottom-left", "bottom-right"]) {
      await page.selectOption("#position", position);
      const surface = await picture(page, `${STAGE} svg.kyogijo`);
      const board = await rect(page, `${STAGE} image.ky-board-img`);
      const label = `${example} ${position}`;
      expect(board.x, label).toBeGreaterThanOrEqual(surface.x - 1);
      expect(board.y, label).toBeGreaterThanOrEqual(surface.y - 1);
      expect(board.x + board.w, label).toBeLessThanOrEqual(surface.x + surface.w + 1);
      expect(board.y + board.h, label).toBeLessThanOrEqual(surface.y + surface.h + 1);
      expect(intersects(board, middle(surface)), label).toBe(false);
      // The image box has the board's own shape, to the pixel: nothing is stretched.
      const ratio = await natural(page, `${STAGE} image.ky-board-img`);
      expect(Math.abs(board.w / board.h - ratio) / ratio, label).toBeLessThan(0.01);
    }
  }
});

test("a point of your own may cover the middle, and so may a position that is told to", async ({ page }) => {
  await open(page, "?position=custom&x=50&y=50");
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveAttribute("data-board", "custom");
  expect(intersects(await rect(page, `${STAGE} image.ky-board-img`), middle(await picture(page, `${STAGE} svg.kyogijo`)))).toBe(true);
  await page.selectOption("#position", "top");
  await page.check("#cover");
  await page.locator("#share").fill("90");
  const surface = await picture(page, `${STAGE} svg.kyogijo`);
  const board = await rect(page, `${STAGE} image.ky-board-img`);
  expect(board.w / surface.w).toBeGreaterThan(0.6);
  expect(intersects(board, middle(surface))).toBe(true);
});

test("the opacity and the share are read from the controls and kept in the address", async ({ page }) => {
  await open(page);
  const before = await rect(page, `${STAGE} image.ky-board-img`);
  await page.locator("#share").fill("20");
  const after = await rect(page, `${STAGE} image.ky-board-img`);
  const drawn = await picture(page, `${STAGE} svg.kyogijo`);
  expect(after.w).toBeLessThan(before.w);
  expect(after.w / drawn.w).toBeCloseTo(0.2, 1);
  await page.locator("#opacity").fill("50");
  await expect(page.locator(`${STAGE} g.ky-board`)).toHaveAttribute("opacity", "0.5");
  expect(page.url()).toContain("share=20");
  expect(page.url()).toContain("opacity=50");
});

test("in 3D the board is a layer over the view: it is where it was after every viewpoint, a drag and a zoom, off the middle, and in its own shape", async ({ page }) => {
  await open(page, "?example=judo&view=3d");
  const view = page.locator(`${STAGE} .ky-turn-view`);
  await view.scrollIntoViewIfNeeded();
  const board = `${STAGE} .ky-turn-board-img`;
  await expect(page.locator(`${STAGE} .ky-turn-board`)).toHaveCount(1);
  // It is inside the view, after the scene, and not in the scene: nothing it sits in carries a transform.
  const clean = await page.locator(board).evaluate((node) => {
    for (let at = node; at !== null && !at.classList.contains("ky-turn-view"); at = at.parentElement) if (getComputedStyle(at).transform !== "none") return false;
    return node.closest(".ky-turn-world") === null;
  });
  expect(clean).toBe(true);
  const first = await inView(page, board);
  const stage = { ...(await rect(page, `${STAGE} .ky-turn-view`)), x: 0, y: 0 };
  expect(intersects(first, middle(stage))).toBe(false);
  const ratio = await natural(page, board);
  expect(Math.abs(first.w / first.h - ratio) / ratio).toBeLessThan(0.01);
  const floor = () => page.locator(`${STAGE} .ky-turn-floor`).evaluate((node) => node.style.transform);
  const start = await floor();
  for (const preset of ["overhead", "broadcast", "end", "corner"]) {
    await page.locator(`${STAGE} [data-preset="${preset}"]`).click();
    expect(await inView(page, board), preset).toEqual(first);
  }
  expect(await floor()).not.toBe("");
  // A drag that starts on the board turns the view (the board does not take the pointer) and leaves the board alone.
  const before = await floor();
  await view.evaluate((node) => node.scrollIntoView({ block: "start" }));
  const now = await rect(page, board);
  await page.mouse.move(now.x + now.w / 2, now.y + now.h / 2);
  await page.mouse.down();
  await page.mouse.move(now.x + now.w / 2 + 120, now.y + now.h / 2 + 30, { steps: 6 });
  await page.mouse.up();
  expect(await floor()).not.toBe(before);
  expect(await inView(page, board)).toEqual(first);
  await page.locator(`${STAGE} [data-act="zoom-in"]`).click();
  await page.locator(`${STAGE} [data-act="zoom-in"]`).click();
  expect(await inView(page, board)).toEqual(first);
  expect(start).not.toBe("");
  // The floor in the scene has no board of its own.
  await expect(page.locator(`${STAGE} .ky-turn-floor image.ky-board-img`)).toHaveCount(0);
});

test("in 3D a change of position moves the layer and a change of board replaces it, and the view keeps its turn", async ({ page }) => {
  await open(page, "?view=3d");
  const board = `${STAGE} .ky-turn-board-img`;
  await page.locator(`${STAGE} [data-preset="end"]`).click();
  const floorBefore = await page.locator(`${STAGE} .ky-turn-floor`).evaluate((node) => node.style.transform);
  const top = await inView(page, board);
  await page.selectOption("#position", "bottom-right");
  const corner = await inView(page, board);
  expect(corner.x).toBeGreaterThan(top.x);
  expect(corner.y).toBeGreaterThan(top.y);
  expect(await page.locator(`${STAGE} .ky-turn-floor`).evaluate((node) => node.style.transform)).toBe(floorBefore);
  await expect(page.locator(`${STAGE} .ky-turn-board`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} .ky-turn-board`)).toHaveAttribute("data-position", "bottom-right");
});

test("on a phone the board stays inside the view and off its middle, in 2D and in 3D", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "?example=athletics");
  let surface = await picture(page, `${STAGE} svg.kyogijo`);
  let board = await rect(page, `${STAGE} image.ky-board-img`);
  expect(intersects(board, middle(surface))).toBe(false);
  await page.selectOption("#view", "3d");
  await page.waitForSelector(`${STAGE} .ky-turn-board-img`);
  surface = { ...(await rect(page, `${STAGE} .ky-turn-view`)), x: 0, y: 0 };
  board = await inView(page, `${STAGE} .ky-turn-board-img`);
  expect(board.x).toBeGreaterThanOrEqual(-1);
  expect(board.x + board.w).toBeLessThanOrEqual(surface.w + 1);
  expect(intersects(board, middle(surface))).toBe(false);
  await noSidewaysScroll(page);
});

test("speaks Japanese when asked, in the address, and the board is still the same picture", async ({ page }) => {
  await open(page, "?lang=ja");
  await expect(page.locator("#title")).toHaveText("競技面に重ねるボード");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText("競泳の決勝");
  await expect(page.locator(`${STAGE} image.ky-board-img`)).toHaveCount(1);
  await expect(page.locator("#back")).toHaveAttribute("href", /lang=ja/);
});
