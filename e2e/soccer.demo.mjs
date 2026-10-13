// The soccer part of the demo: the pitch's controls, the pitches and the providers' pitches, and the converter between them.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open, openGroups, svg } from "./demo.mjs";

test("soccer shows its own controls, and the other sports hide them", async ({ page }) => {
  const errors = await open(page, "?sport=soccer&lang=en&help=off&orientation=landscape");
  expect(errors).toEqual([]);
  await openGroups(page);
  await expect(page.locator(at("pitch"))).toBeVisible();
  await expect(page.locator(at("pitch-type"))).toBeVisible();
  await expect(page.locator("#soccer-group")).toBeVisible();
  await expect(page.locator(at("away-pens"))).toBeVisible();
  expect(await page.locator(`${at("pitch")} option`).count()).toBe(10);
  await expect(page.locator(at("ground"))).toBeVisible();
  expect(await page.locator(`${at("pitch-type")} option`).count()).toBe(11);
  await page.locator(`${at("sport")} button[data-value="nhl"]`).click();
  await expect(page.locator(at("pitch"))).toBeHidden();
  await expect(page.locator(at("ground"))).toBeHidden();
  await expect(page.locator("#soccer-group")).toBeHidden();
  await expect(page.locator(at("away-pens"))).toBeHidden();
});

test("the pitch picker, the mowing and the goals change the drawing", async ({ page }) => {
  await open(page, "?sport=soccer&lang=en&help=off&orientation=landscape");
  await openGroups(page);
  const box = async () => (await svg(page).getAttribute("viewBox")).split(" ").map(Number);
  const before = await box();
  await page.locator(at("pitch")).selectOption("futsal");
  await expect(page.locator(`${at("stage")} .ky-pitch-futsal`)).toHaveCount(1);
  expect((await box())[2]).toBeLessThan(before[2]);
  expect(new URL(page.url()).searchParams.get("pitch")).toBe("futsal");
  await page.locator(at("pitch")).selectOption("fifa");
  const stripes = await page.locator(`${at("stage")} .ky-stripe`).getAttribute("d");
  await page.locator("#pattern button[data-value='checks']").click();
  expect(await page.locator(`${at("stage")} .ky-stripe`).getAttribute("d")).not.toBe(stripes);
  await page.locator("#goals button[data-value='none']").click();
  await expect(page.locator(`${at("stage")} .ky-goal`)).toHaveCount(0);
  await page.locator("#flags").click();
  await expect(page.locator(`${at("stage")} .ky-flag`)).toHaveCount(0);
});

test("the ground picker has the grounds in three groups, and a ground sets the pitch's size and name", async ({ page }) => {
  await open(page, "?sport=soccer&lang=en&help=off&orientation=landscape&size=surface");
  await openGroups(page);
  expect(await page.locator(`${at("ground")} option`).count()).toBe(65);
  expect(await page.locator(`${at("ground")} optgroup`).evaluateAll((all) => all.map((g) => [g.label, g.children.length]))).toEqual([["World Cup finals", 28], ["Other 2026 World Cup venues", 13], ["Club and other grounds", 23]]);
  const width = async () => (await svg(page).getAttribute("viewBox")).split(" ").map(Number)[2];
  const before = await width();
  await page.locator(at("ground")).selectOption("anfield");
  // Anfield's 101 by 68 m is shorter than the international 105.
  expect(await width()).toBeLessThan(before);
  expect(new URL(page.url()).searchParams.get("ground")).toBe("anfield");
  await expect(svg(page).locator("title")).toHaveText("Anfield, soccer pitch");
  expect(await page.locator(at("embed-code")).textContent()).toContain('"ground": "anfield"');
  await page.locator(`${at("embed-tabs")} button[data-tab="element"]`).click();
  expect(await page.locator(at("embed-code")).textContent()).toContain('ground="anfield"');
  // A ground with no published size is drawn at the international pitch.
  await page.locator(at("ground")).selectOption("lusail");
  expect(await width()).toBe(before);
  await page.locator(at("ground")).selectOption("none");
  await expect(svg(page).locator("title")).toHaveText("Soccer pitch");
  await noSidewaysScroll(page);
});

test("the ground picker reads ?ground= and speaks Japanese", async ({ page }) => {
  await open(page, "?sport=soccer&ground=maracana&lang=ja&help=off&size=surface");
  await expect(page.locator(at("ground"))).toHaveValue("maracana");
  await expect(page.locator(`${at("ground")} option[value="maracana"]`)).toHaveText("エスタジオ・ド・マラカナン");
  await expect(svg(page).locator("title")).toHaveText("エスタジオ・ド・マラカナンのピッチ");
  await noSidewaysScroll(page);
});

test("a game on penalties shows the shoot-out, and the code the demo writes carries it", async ({ page }) => {
  await open(page, "?sport=soccer&lang=en&help=off&orientation=landscape");
  expect(await page.locator(`${at("stage")} svg text`).allTextContents()).toContain("Final · 4-2 pens · May 24");
  await openGroups(page);
  await page.locator(at("home-pens")).fill("5");
  expect(await page.locator(`${at("stage")} svg text`).allTextContents()).toContain("Final · 4-5 pens · May 24");
  expect(await page.locator(at("embed-code")).textContent()).toContain('"penalties": 5');
  await page.locator(`${at("embed-tabs")} button[data-tab="element"]`).click();
  expect(await page.locator(at("embed-code")).textContent()).toContain('home-penalties="5"');
});

test("a pitch in a provider's frame has its empty data group", async ({ page }) => {
  await open(page, "?sport=soccer&pitchtype=statsbomb&lang=en&help=off&orientation=landscape&size=surface");
  const group = page.locator(`${at("stage")} .ky-data`);
  await expect(group).toHaveAttribute("data-frame", "statsbomb");
  await expect(group).toHaveAttribute("transform", "matrix(0.875 0 0 0.85 0 0)");
});

test("each provider's pitch is drawn, and the converter keeps a point on its line", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  await page.locator(at("provider-grid")).scrollIntoViewIfNeeded();
  await expect(page.locator(`${at("provider-grid")} .provider`)).toHaveCount(10);
  const frames = await page.locator(`${at("provider-grid")} .ky-data`).evaluateAll((all) => all.map((n) => n.getAttribute("data-frame")));
  expect(new Set(frames).size).toBe(10);
  // Opta's penalty line (83, 50) is StatsBomb's (102, 40).
  await expect(page.locator(at("conv-out"))).toHaveText("102, 40");
  await page.locator(at("conv-to")).selectOption("wyscout");
  await expect(page.locator(at("conv-out"))).toHaveText("84, 50");
  await page.locator(at("conv-x")).fill("not a number");
  await expect(page.locator(at("conv-out"))).toContainText("number");
  await page.locator(at("conv-spot")).click();
  await expect(page.locator(at("conv-x"))).toHaveValue("88.5");
  await expect(page.locator(at("conv-out"))).toHaveText("90, 50");
  await noSidewaysScroll(page);
});

test("the soccer pitches section draws and does not scroll sideways, in Japanese too", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  await page.locator(at("pitch-cards")).scrollIntoViewIfNeeded();
  await expect(page.locator(`${at("pitch-cards")} svg.kyogijo`)).toHaveCount(8);
  await expect(page.locator(`${at("pattern-cards")} svg.kyogijo`)).toHaveCount(6);
  await noSidewaysScroll(page);
  await page.locator('[data-lang="ja"]').click();
  await expect(page.locator("#pitches-title")).toContainText("サッカー");
  await noSidewaysScroll(page);
});

test("soccer fits a phone: wide, tall and as a badge", async ({ page }) => {
  await open(page, "?sport=soccer&lang=en&help=off");
  for (const orientation of ["landscape", "portrait"]) {
    await page.locator(`${at("orientation")} button[data-value="${orientation}"]`).click();
    await expect(page.locator(at("stage"))).toHaveAttribute("data-orientation", orientation);
    await noSidewaysScroll(page);
  }
});
