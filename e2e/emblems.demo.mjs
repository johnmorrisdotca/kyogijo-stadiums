// The pickers of ready-made emblems (Dougu Sports, plugged in with useEmblems): a team's mark and the middle of a pageant. Tiles a finger wide, each the emblem itself, named for a screen reader; a tap changes the drawing and the code.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open, openGroups, svg } from "./demo.mjs";

/** The documents of the images in the drawing, decoded. */
const images = (page) =>
  svg(page).locator("image").evaluateAll((nodes) => nodes.map((n) => decodeURIComponent((n.getAttribute("href") ?? "").slice((n.getAttribute("href") ?? "").indexOf(",") + 1))));

test("a team's mark can be a ready-made emblem: its tiles are a finger wide, a tap draws it, and the code says its id", async ({ page }) => {
  await open(page, "?sport=nhl&lang=en&help=off&size=full");
  await openGroups(page);
  await expect(page.locator(at("away-mark"))).toBeHidden();
  await page.locator(`${at("away-logo")} button[data-value="ready"]`).click();
  await expect(page.locator(at("away-mark"))).toBeVisible();
  await expect(page.locator(at("home-mark"))).toBeHidden();
  await expect(page.locator(`${at("away-mark")} button`)).toHaveCount(166);
  await page.locator(`${at("away-mark")} button[data-value="crest:diamond"]`).scrollIntoViewIfNeeded();
  await page.locator(`${at("away-mark")} button[data-value="crest:diamond"]`).click();
  await expect(page.locator(`${at("away-mark")} button[data-value="crest:diamond"]`)).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => (await images(page)).some((doc) => doc.includes("<title>Diamond crest</title>") && doc.includes(">NOW<"))).toBe(true);
  await page.locator(`${at("away-mark")} button[data-value="sport:curling"]`).scrollIntoViewIfNeeded();
  await page.locator(`${at("away-mark")} button[data-value="sport:curling"]`).click();
  await expect.poll(async () => (await images(page)).some((doc) => doc.includes("<title>Curling stone</title>"))).toBe(true);
  // The code the page shows is the id.
  await page.locator(`${at("embed-tabs")} button`).first().click();
  await expect(page.locator(at("embed-code"))).toContainText('"logo": "sport:curling"');
  // And the code plugs Dougu Sports in, which a page needs to do once.
  await expect(page.locator(at("embed-code"))).toContainText("useEmblems(renderEmblem);");
  await expect(page.locator(at("embed-code"))).toContainText("@johnmorrisdotca/dougu-sports/emblems");
  const small = await page.evaluate(() =>
    [...document.querySelectorAll("#away-mark button, #away-logo button")].filter((one) => one.offsetParent !== null).map((one) => ({ name: one.getAttribute("aria-label") || one.textContent.trim(), ...one.getBoundingClientRect().toJSON() })).filter((one) => one.width < 43.5 || one.height < 43.5),
  );
  expect(small).toEqual([]);
  await noSidewaysScroll(page);
});

test("every tile has a name for a screen reader, in the page's language", async ({ page }) => {
  await open(page, "?sport=nhl&lang=en&help=off&size=full");
  await openGroups(page);
  await page.locator(`${at("home-logo")} button[data-value="ready"]`).click();
  const names = await page.locator(`${at("home-mark")} button`).evaluateAll((all) => all.map((b) => b.getAttribute("aria-label")));
  expect(names).toHaveLength(166);
  expect(names.every((name) => name.length > 2)).toBe(true);
  // Dougu Sports names a few emblems alike (two kinds of ball in the same picture): the names are not unique, but none is empty.
  expect(new Set(names).size).toBeGreaterThan(130);
  await page.locator('[data-lang="ja"]').click();
  const ja = await page.locator(`${at("home-mark")} button`).evaluateAll((all) => all.map((b) => b.getAttribute("aria-label")));
  expect(ja.every((name) => /[぀-ヿ一-鿿]/.test(name))).toBe(true);
  await expect(page.locator(`${at("home-logo")} button[data-value="ready"]`)).toHaveText("プリセット");
});

test("the middle of a pageant is a ready-made trophy, in the metal or the line style", async ({ page }) => {
  await open(page, "?sport=soccer&lang=en&help=off");
  await openGroups(page);
  await expect(page.locator(at("pageant-emblem-id"))).toBeHidden();
  await page.locator(`${at("pageant")} button[data-value="stage"]`).click();
  await expect(page.locator(at("pageant-emblem-id"))).toBeHidden();
  await page.locator(at("pageant-emblem")).click();
  await expect(page.locator(at("pageant-emblem-id"))).toBeVisible();
  await expect(page.locator(`${at("pageant-emblem-id")} button`)).toHaveCount(82);
  await page.locator(`${at("pageant-emblem-id")} button[data-value="trophy:hockey-cup"]`).scrollIntoViewIfNeeded();
  await page.locator(`${at("pageant-emblem-id")} button[data-value="trophy:hockey-cup"]`).click();
  await expect.poll(async () => (await images(page)).some((doc) => doc.includes("<title>Banded silver cup</title>") && doc.includes("linearGradient"))).toBe(true);
  expect(page.url()).toContain("emblemid=trophy%3Ahockey-cup");
  await expect(page.locator(at("emblem-line"))).toBeVisible();
  await page.locator(at("emblem-line")).click();
  await expect.poll(async () => (await images(page)).some((doc) => doc.includes("<title>Banded silver cup</title>") && !doc.includes("linearGradient"))).toBe(true);
  expect(page.url()).toContain("emblemline=1");
  await page.locator(at("embed-tabs")).locator("button").first().click();
  await expect(page.locator(at("embed-code"))).toContainText('"emblem": "trophy:hockey-cup/line"');
  const small = await page.evaluate(() => [...document.querySelectorAll("#pageant-emblem-id button, #emblem-line")].filter((one) => one.offsetParent !== null).map((one) => one.getBoundingClientRect().toJSON()).filter((one) => one.width < 43.5 || one.height < 43.5));
  expect(small).toEqual([]);
  await noSidewaysScroll(page);
});

test("the emblem and its style are in the address and come back from it", async ({ page }) => {
  await open(page, "?sport=nhl&lang=en&help=off&pageant=stage&emblem=1&emblemid=medal%3Agold&emblemline=1");
  await expect.poll(async () => (await images(page)).some((doc) => doc.includes("<title>Gold medal</title>") && !doc.includes("linearGradient"))).toBe(true);
  await openGroups(page);
  await expect(page.locator(`${at("pageant-emblem-id")} button[data-value="medal:gold"]`)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(at("emblem-line"))).toHaveAttribute("aria-pressed", "true");
});
