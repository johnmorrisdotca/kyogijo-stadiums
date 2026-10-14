// The address holds every control and restores it; the link button copies it; a click drops a point and reads its place; a lineup is a layer; the pages have an icon file.
import { expect, test } from "@playwright/test";

import { at, open, openGroups, serve, svg, tap } from "./demo.mjs";

const query = (page) => new URL(page.url()).searchParams;

test("every control is in the address, and an address restores the same view", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const errors = await open(page, "?sport=nba&lang=en&help=off");
  await openGroups(page);
  await tap(page, `${at("court")} button[data-value="maple"]`, testInfo);
  await tap(page, at("crowd"), testInfo);
  await tap(page, at("hardwood"), testInfo);
  await tap(page, `${at("pageant")} button[data-value="carpet"]`, testInfo);
  await tap(page, `${at("size")} button[data-value="surface"]`, testInfo);
  await tap(page, `${at("theme")} button[data-value="dark"]`, testInfo);
  await page.locator(at("home-name")).fill("Gulls");
  await page.locator(at("away-score")).fill("77");
  await tap(page, `${at("winner")} button[data-value="home"]`, testInfo);
  await tap(page, `${at("lineup")} button[data-value="jersey"]`, testInfo);
  const q = query(page);
  expect(Object.fromEntries(["sport", "court", "crowd", "hardwood", "pageant", "size", "theme", "hname", "ascore", "winner", "lineup", "lang", "help"].map((key) => [key, q.get(key)]))).toEqual({ sport: "nba", court: "maple", crowd: "1", hardwood: "1", pageant: "carpet", size: "surface", theme: "dark", hname: "Gulls", ascore: "77", winner: "home", lineup: "jersey", lang: "en", help: "off" });
  expect(q.has("aname")).toBe(false);
  const drawn = await page.locator(at("stage")).innerHTML();
  expect(drawn).toContain('data-kind="lineup"');
  // The same address, opened afresh, is the same view: the controls say so and the drawing is the same.
  await open(page, new URL(page.url()).search);
  await expect(page.locator(`${at("court")} button[data-value="maple"]`)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(at("crowd"))).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(`${at("lineup")} button[data-value="jersey"]`)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(at("home-name"))).toHaveValue("Gulls");
  await expect(page.locator(at("away-score"))).toHaveValue("77");
  expect(await page.locator(at("stage")).innerHTML()).toBe(drawn);
  expect(errors).toEqual([]);
});

test("the keys the page has always had keep their names, and a sport's own game is not in the address", async ({ page }, testInfo) => {
  await open(page, "?sport=soccer&lang=en&help=off&pitch=uefa&year=&park=generic");
  await tap(page, `${at("orientation")} button[data-value="portrait"]`, testInfo);
  await tap(page, `${at("view")} button[data-value="3d"]`, testInfo);
  const q = query(page);
  expect([q.get("sport"), q.get("pitch"), q.get("orientation"), q.get("view"), q.get("viewpoint")]).toEqual(["soccer", "uefa", "portrait", "3d", null]);
  for (const key of ["aname", "hname", "ascore", "hscore", "status", "lineup", "drop", "shots", "code", "flags", "stripes"]) expect(q.has(key), key).toBe(false);
});

test("Copy link copies the address of this exact view", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
  await open(page, "?sport=nhl&lang=en&help=off");
  await openGroups(page);
  await tap(page, `${at("lineup")} button[data-value="disc"]`, testInfo);
  await tap(page, at("embed-link"), testInfo);
  await expect(page.locator("#embed-status")).toHaveText("Link copied: it opens this exact view");
  const copied = await page.evaluate(() => navigator.clipboard.readText()).catch(() => undefined);
  if (copied !== undefined) expect(copied).toBe(page.url());
  expect(page.url()).toContain("lineup=disc");
});

test("a lineup is a layer of each side, and has no row where the sport has none", async ({ page }, testInfo) => {
  await open(page, "?sport=soccer&lang=en&help=off&lineup=disc");
  await expect(page.locator(`${at("stage")} svg g[data-kind="lineup"]`)).toHaveCount(2);
  await expect(page.locator(`${at("stage")} svg.kyogijo`)).toContainText("Lineup in 4-2-3-1");
  await openGroups(page);
  await expect(page.locator("#lineup-group")).toBeVisible();
  await tap(page, `${at("sport")} button[data-value="curling"]`, testInfo);
  await expect(page.locator("#lineup-group")).toBeHidden();
  await expect(page.locator(`${at("stage")} svg g[data-kind="lineup"]`)).toHaveCount(0);
});

test("Click to place drops a point where the pointer is, reads its feet and keeps it in the address", async ({ page }, testInfo) => {
  test.skip(testInfo.project.use.hasTouch === true, "a pointer feature: the readout follows a mouse");
  await open(page, "?sport=nhl&lang=en&help=off&size=surface");
  await openGroups(page);
  await page.locator(at("place")).click();
  const box = await svg(page).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator(at("place-out"))).toContainText(/x \d+(\.\d)? ft, y \d+(\.\d)? ft/);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator(`${at("stage")} g[data-kind="points"] circle`)).toHaveCount(1);
  const shots = query(page).get("shots");
  expect(shots).toMatch(/^\d+(\.\d)?,\d+(\.\d)?$/);
  // The middle of an NHL rink, 200 by 85 feet: about 100 across and 42 down.
  const [x, y] = shots.split(",").map(Number);
  expect(Math.abs(x - 100)).toBeLessThan(6);
  expect(Math.abs(y - 42.5)).toBeLessThan(6);
  await open(page, new URL(page.url()).search);
  await expect(page.locator(`${at("stage")} g[data-kind="points"] circle`)).toHaveCount(1);
  await openGroups(page);
  await page.locator(at("place-clear")).click();
  await expect(page.locator(`${at("stage")} g[data-kind="points"] circle`)).toHaveCount(0);
  expect(query(page).has("shots")).toBe(false);
});

test("a click while the toggle is off drops nothing", async ({ page }) => {
  await open(page, "?sport=nhl&lang=en&help=off&size=surface");
  const box = await svg(page).boundingBox();
  await page.mouse.click(box.x + 50, box.y + 50).catch(() => undefined);
  expect(query(page).has("shots")).toBe(false);
});

test("every page has an icon file, and none carries an inline one", async ({ page }) => {
  for (const path of ["", "api.html", "docs/team-shape.html", "docs/gallery.html"]) {
    await serve(page);
    const response = await page.goto(`http://kyogijo.test/${path}`);
    expect(response.status(), path).toBe(200);
    const links = await page.locator('link[rel~="icon"], link[rel="apple-touch-icon"]').evaluateAll((all) => all.map((link) => link.getAttribute("href")));
    expect(links.length, path).toBe(2);
    for (const href of links) {
      expect(href, path).not.toMatch(/^data:|^about:/);
      const status = await page.evaluate(async (url) => (await globalThis.fetch(url)).status, new URL(href, page.url()).href);
      expect(status, `${path} ${href}`).toBe(200);
    }
  }
});
