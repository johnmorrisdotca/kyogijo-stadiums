// How the demo looks and holds still: no sideways scroll, finger-sized buttons, light and dark, tall and wide.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open, openGroups, svg } from "./demo.mjs";

const SPORTS = ["nfl", "cfl", "ifaf", "nhl", "nba", "mlb", "soccer", "curling", "tennis", "volleyball", "badminton", "pickleball", "tabletennis", "lacrosse", "rugby", "afl", "gaelic", "cricket", "fieldhockey", "handball"];

for (const sport of SPORTS) {
  test(`${sport} fits the page in every size and layout without a sideways scroll`, async ({ page }) => {
    await open(page, `?sport=${sport}&lang=en&help=off`);
    await noSidewaysScroll(page);
    for (const size of ["full", "compact", "badge", "surface"]) {
      await page.locator(`${at("size")} button[data-value="${size}"]`).click();
      await noSidewaysScroll(page);
      const box = await svg(page).boundingBox();
      expect(box.width, `${sport} ${size}`).toBeLessThanOrEqual(page.viewportSize().width);
    }
    for (const orientation of ["landscape", "portrait", "auto"]) {
      await page.locator(`${at("orientation")} button[data-value="${orientation}"]`).click();
      await noSidewaysScroll(page);
    }
  });
}

test("the whole page, with every park and ground shown, does not scroll sideways, in English and in Japanese", async ({ page }) => {
  test.setTimeout(90_000);
  await open(page, "?lang=en&help=off&parkleague=all&parkstatus=all&parkall=1&groundgroup=all&groundall=1");
  await page.locator(at("park-grid")).scrollIntoViewIfNeeded();
  await expect(page.locator(`${at("park-grid")} .park`)).toHaveCount(94);
  await expect(page.locator(`${at("ground-grid")} .park`)).toHaveCount(64);
  await noSidewaysScroll(page);
  await page.locator('[data-lang="ja"]').click();
  await expect(page.locator(at("parks-count"))).toHaveText("94球場中94球場");
  await noSidewaysScroll(page);
});

test("tall turns the surface a quarter and keeps every word upright", async ({ page }) => {
  await open(page, "?sport=nfl&lang=en&help=off&orientation=portrait");
  const box = await svg(page).boundingBox();
  expect(box.height).toBeGreaterThan(box.width * 1.5);
  // Every text element is turned back by the quarter, so its drawn direction is horizontal: its box is wider than it is tall.
  const sideways = await page.locator(`${at("stage")} svg text`).evaluateAll((nodes) =>
    nodes.filter((n) => {
      const r = n.getBoundingClientRect();
      return n.textContent.trim().length > 3 && r.height > r.width;
    }).map((n) => n.textContent),
  );
  expect(sideways).toEqual([]);
  await page.locator(`${at("orientation")} button[data-value="landscape"]`).click();
  const wide = await svg(page).boundingBox();
  expect(wide.width).toBeGreaterThan(wide.height);
});

test("light and dark differ, and each is drawn in its own colours", async ({ page }) => {
  await open(page, "?sport=nhl&lang=en&help=off&theme=light");
  const fill = () => page.locator(`${at("stage")} .ky-surface`).first().evaluate((el) => getComputedStyle(el).fill);
  const plate = () => page.locator(`${at("stage")} .ky-plate-bg`).evaluate((el) => getComputedStyle(el).fill);
  const light = [await fill(), await plate()];
  const lightShot = await page.locator(at("stage")).screenshot();
  await page.locator(`${at("theme")} button[data-value="dark"]`).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const dark = [await fill(), await plate()];
  const darkShot = await page.locator(at("stage")).screenshot();
  expect(dark[0]).not.toBe(light[0]);
  expect(Buffer.compare(lightShot, darkShot)).not.toBe(0);
  await page.locator(`${at("theme")} button[data-value="auto"]`).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
});

test("every sport's surface differs from every other's", async ({ page }) => {
  await open(page, "?lang=en&help=off&orientation=landscape&size=surface");
  const shots = [];
  for (const sport of SPORTS) {
    await page.locator(`${at("sport")} button[data-value="${sport}"]`).click();
    await expect(svg(page)).toHaveAttribute("data-sport", sport);
    shots.push((await page.locator(at("stage")).screenshot()).toString("base64"));
  }
  expect(new Set(shots).size).toBe(SPORTS.length);
});

test("nothing on the drawing can be selected by accident, every control is a finger wide", async ({ page }) => {
  await open(page, "?sport=nhl&lang=en&help=off");
  const small = await page.evaluate(() =>
    [...document.querySelectorAll(".fam-seg button, .fam-chip, .fam-button, .fam-tabs button, .lang button")]
      .filter((one) => one.offsetParent !== null)
      .map((one) => ({ name: one.textContent.trim() || one.id, ...one.getBoundingClientRect().toJSON() }))
      .filter((one) => one.width < 43.5 || one.height < 43.5),
  );
  expect(small).toEqual([]);
});

test("the controls' groups open and close, and the first two are open", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  const open_ = await page.locator("details.group").evaluateAll((all) => all.map((d) => d.open));
  expect(open_).toEqual([true, true, false, false]);
});

test("a curling sheet has its own choice of the top house, the bottom house or folded, every button a finger wide, and folded fills a square", async ({ page }) => {
  const errors = await open(page, "?sport=curling&lang=en&help=off&orientation=portrait");
  expect(errors).toEqual([]);
  await openGroups(page);
  await expect(page.locator("#curling-group")).toBeVisible();
  const small = await page.evaluate(() =>
    [...document.querySelectorAll("#curling-group .fam-seg button")]
      .filter((one) => one.offsetParent !== null)
      .map((one) => ({ name: one.textContent.trim(), ...one.getBoundingClientRect().toJSON() }))
      .filter((one) => one.width < 43.5 || one.height < 43.5),
  );
  expect(small).toEqual([]);
  await expect(page.locator(`${at("sheet")} button`)).toHaveText(["Whole sheet", "Top house", "Bottom house", "Folded"]);
  const whole = await svg(page).getAttribute("viewBox");
  // Choosing a part turns the teams off (a score shows the whole sheet), and the choice is in the address.
  await page.locator(`${at("sheet")} button[data-value="top"]`).click();
  await expect(page.locator(`${at("size")} button[data-value="surface"]`)).toHaveAttribute("aria-pressed", "true");
  expect(await svg(page).getAttribute("viewBox")).not.toBe(whole);
  expect(new URL(page.url()).searchParams.get("sheet")).toBe("top");
  await page.locator(`${at("sheet")} button[data-value="folded"]`).click();
  await expect(page.locator(`${at("stage")} .ky-fold-frame`)).toHaveCount(2);
  const [, , w, h] = (await svg(page).getAttribute("viewBox")).split(" ").map(Number);
  expect(w / h).toBeCloseTo(1, 1);
  const box = await svg(page).boundingBox();
  expect(box.width).toBeLessThanOrEqual(page.viewportSize().width);
  expect(Math.abs(box.width - box.height)).toBeLessThan(2);
  await noSidewaysScroll(page);
  // Wide, the same drawing lies the other way and keeps its shape; the words are Japanese too.
  await page.locator(`${at("orientation")} button[data-value="landscape"]`).click();
  const wide = await svg(page).getAttribute("viewBox");
  expect(wide.split(" ").slice(2)).toEqual([String(w), String(h)]);
  await page.locator('[data-lang="ja"]').click();
  await expect(page.locator(`${at("sheet")} button`)).toHaveText(["シート全体", "上のハウス", "下のハウス", "折りたたみ"]);
  // Another sport has no such choice.
  await page.locator(`${at("sport")} button[data-value="nhl"]`).click();
  await expect(page.locator("#curling-group")).toBeHidden();
  expect(new URL(page.url()).searchParams.has("sheet")).toBe(false);
});
