// Pointing at the field: a click or a drag on a drawing is a place in every provider's numbers, with its zone; in a real browser, where the drawing's matrix is the browser's own.
import { expect, test } from "@playwright/test";

import { at, open } from "./demo.mjs";

const stage = (page) => page.locator(at("point-stage"));
const cell = async (page, row, column) => (await page.locator(`${at("point-table")} tr`).nth(row).locator("td").nth(column).textContent()) ?? "";
const numbers = (text) => text.split(",").map(Number);

test("a click on the rink is centre ice in the NHL API's numbers, and the zone is named", async ({ page }) => {
  const errors = await open(page, "?lang=en&help=off&pointsport=nhl");
  expect(errors).toEqual([]);
  await stage(page).scrollIntoViewIfNeeded();
  const box = await stage(page).boundingBox();
  await stage(page).click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(page.locator(at("point-zone"))).toHaveAttribute("data-zone", "neutral-zone");
  await expect(page.locator(at("point-zone"))).toContainText("Neutral zone");
  await expect(page.locator(at("point-zone"))).toHaveAttribute("data-in-bounds", "true");
  const rows = page.locator(`${at("point-table")} tr`);
  // The surface's own, then the NHL API's and HockeyTech's.
  await expect(rows).toHaveCount(3);
  const [sx, sy] = numbers(await cell(page, 0, 1));
  expect(Math.abs(sx - 100)).toBeLessThan(1.5);
  expect(Math.abs(sy - 42.5)).toBeLessThan(1.5);
  const [nx, ny] = numbers(await cell(page, 1, 1));
  expect(Math.abs(nx)).toBeLessThan(1.5);
  expect(Math.abs(ny)).toBeLessThan(1.5);
  await expect(page.locator(at("point-marker"))).toBeVisible();
});

test("a drag follows the pointer: the marker moves and the zone changes from one end to the other", async ({ page }) => {
  await open(page, "?lang=en&help=off&pointsport=nhl");
  await stage(page).scrollIntoViewIfNeeded();
  const box = await stage(page).boundingBox();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.12, y);
  await page.mouse.down();
  await expect(page.locator(at("point-zone"))).toHaveAttribute("data-zone", "defensive-zone");
  const first = await page.locator(at("point-marker")).boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, y, { steps: 4 });
  await page.mouse.move(box.x + box.width * 0.9, y, { steps: 4 });
  await expect(page.locator(at("point-zone"))).toHaveAttribute("data-zone", "offensive-zone");
  await page.mouse.up();
  const last = await page.locator(at("point-marker")).boundingBox();
  expect(last.x).toBeGreaterThan(first.x + box.width * 0.5);
  // Off the drag, a move does nothing.
  await page.mouse.move(box.x + box.width * 0.2, y);
  expect(Math.abs((await page.locator(at("point-marker")).boundingBox()).x - last.x)).toBeLessThan(1);
});

test("the arrow keys move the place by a foot, ten with Shift", async ({ page }) => {
  await open(page, "?lang=en&help=off&pointsport=nhl");
  await stage(page).scrollIntoViewIfNeeded();
  await stage(page).focus();
  await page.keyboard.press("ArrowRight");
  const [x0] = numbers(await cell(page, 0, 1));
  expect(Math.abs(x0 - 101)).toBeLessThan(0.01);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Shift+ArrowDown");
  const [x1, y1] = numbers(await cell(page, 0, 1));
  expect(Math.abs(x1 - 102)).toBeLessThan(0.01);
  expect(Math.abs(y1 - 52.5)).toBeLessThan(0.01);
});

test("each sport shows each of its providers, and Japanese names the zone in Japanese", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  await page.locator(at("point-sport")).scrollIntoViewIfNeeded();
  await page.locator(at("point-sport")).selectOption("soccer");
  const box = await stage(page).boundingBox();
  await stage(page).click({ position: { x: box.width * 0.95, y: box.height / 2 } });
  // Ten providers and the surface's own.
  await expect(page.locator(`${at("point-table")} tr`)).toHaveCount(11);
  await expect(page.locator(at("point-zone"))).toContainText("Attacking third");
  await page.locator('[data-lang="ja"]').click();
  await expect(page.locator(at("point-zone"))).toContainText("アタッキングサード");
  await page.locator(at("point-sport")).selectOption("nba");
  await stage(page).click({ position: { x: box.width * 0.85, y: box.height / 2 } });
  await expect(page.locator(at("point-zone"))).toHaveAttribute("data-in-bounds", "true");
  await page.locator(at("point-sport")).selectOption("mlb");
  const mlb = await stage(page).boundingBox();
  await stage(page).click({ position: { x: mlb.width / 2, y: mlb.height * 0.9 } });
  await expect(page.locator(at("point-zone"))).toHaveAttribute("data-zone", /infield|foul-territory/);
});

test("in the browser the click lands on the mark under it: wide, tall, with padding and cropped to a range", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  const found = await page.evaluate(async () => {
    const { drawKyogijo } = await import("/dist/index.js");
    const { fieldPointToClient, clientPointToField } = await import("/dist/pointer-entry.js");
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:7px;top:9px;width:420px;z-index:99999;background:#fff";
    document.body.append(host);
    const out = [];
    const layers = [{ kind: "points", from: "nhl-api", data: [{ x: 69, y: 22, id: "dot" }], style: { size: 5 } }];
    for (const options of [{ orientation: "landscape" }, { orientation: "portrait" }, { margin: 30 }, { range: "offensive-zone" }, { orientation: "portrait", margin: 2, theme: "dark" }]) {
      host.style.height = "";
      host.innerHTML = drawKyogijo({ sport: "nhl", pointer: true, layers, ...options });
      const svg = host.querySelector("svg");
      const client = fieldPointToClient(svg, [69, 22], { provider: "nhl-api" });
      const hit = document.elementFromPoint(client.x, client.y);
      const back = clientPointToField(svg, client.x, client.y, { provider: "nhl-api" });
      out.push({ mark: hit?.closest("[data-mark-id]")?.getAttribute("data-mark-id") ?? null, back: [back.x, back.y], zone: back.zone, sub: back.subzone, options: JSON.stringify(options) });
    }
    // A 3D view's floor is laid in CSS 3D, where the browser's flat matrix would answer for another place: it answers nothing.
    const { mountKyogijoTurn } = await import("/dist/turn-entry.js");
    const turnHost = document.createElement("div");
    host.replaceChildren(turnHost);
    const view = mountKyogijoTurn(turnHost, { sport: "nhl", pointer: true });
    const flat = turnHost.querySelector("svg");
    out.push({ turn: flat === null ? "none" : clientPointToField(flat, 50, 50) });
    view.destroy();
    host.remove();
    return out;
  });
  for (const entry of found.slice(0, 5)) {
    expect(entry.mark, entry.options).toBe("dot");
    expect(Math.abs(entry.back[0] - 69), entry.options).toBeLessThan(0.01);
    expect(Math.abs(entry.back[1] - 22), entry.options).toBeLessThan(0.01);
    expect(entry.zone).toBe("offensive-zone");
    expect(entry.sub).toBe("faceoff-circle");
  }
  expect(found[5].turn === null || found[5].turn === "none").toBe(true);
});
