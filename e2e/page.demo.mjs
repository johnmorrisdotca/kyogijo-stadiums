// The demo page: every sport and every park draws, the controls change the drawing, the words change language, and nothing
// the demo draws is blank.
import { expect, test } from "@playwright/test";

import { at, open, openGroups, svg, tap } from "./demo.mjs";

// A wide court is a strip on a phone, and a court has fewer parts than a ballpark or a pitch.
const NET = ["tennis", "volleyball", "badminton", "pickleball", "tabletennis", "padel", "squash", "racquetball", "sepaktakraw", "teqball", "roundnet", "netball", "athletics", "skating", "lacrosse", "rugby", "afl", "gaelic", "cricket", "fieldhockey", "handball"];
const SPORTS = ["nfl", "cfl", "ifaf", "nhl", "nba", "mlb", "soccer", "curling", "tennis", "volleyball", "badminton", "pickleball", "tabletennis", "padel", "squash", "racquetball", "sepaktakraw", "teqball", "roundnet", "netball"];

test("opens on the rink with no complaint from the page, and says what it shows", async ({ page }) => {
  const errors = await open(page, "?sport=nhl&lang=en&help=off");
  expect(errors).toEqual([]);
  await expect(svg(page)).toHaveAttribute("role", "img");
  await expect(svg(page)).toHaveAttribute("data-sport", "nhl");
  expect(await svg(page).locator("title").textContent()).toContain("Northern Owls 3, Lakeshore Anchors 2");
  expect(await page.locator(`${at("stage")} svg text`).allTextContents()).toContain("NORTHERN OWLS");
  expect(await page.title()).toContain("Kyogijo");
});

for (const sport of SPORTS) {
  test(`${sport} draws, on a surface with both teams and a score, and is not blank`, async ({ page }) => {
    const errors = await open(page, `?sport=${sport}&lang=en&help=off&orientation=landscape`);
    expect(errors).toEqual([]);
    await expect(svg(page)).toHaveAttribute("data-sport", sport);
    const box = await svg(page).boundingBox();
    expect(box.width).toBeGreaterThan(100);
    // A curling sheet is 150 feet by 15: wide, on a phone, it is a strip.
    expect(box.height).toBeGreaterThan(sport === "curling" ? 30 : 50);
    const texts = (await page.locator(`${at("stage")} svg text`).allTextContents()).join(" ");
    expect(texts).toMatch(/VALLEY|HARBOUR|NORTHERN|SUMMIT/);
    expect(await page.locator(`${at("stage")} .ky-plate`).count()).toBe(1);
    // Not blank: the drawing has many parts and its picture is more than a flat colour.
    expect(await page.locator(`${at("stage")} svg *`).count()).toBeGreaterThan(NET.includes(sport) ? 30 : 40);
    const shot = await page.locator(at("stage")).screenshot();
    expect(shot.length).toBeGreaterThan(sport === "curling" || NET.includes(sport) ? 3000 : 8000);
  });
}

test("the sport buttons change the drawing, and the address follows", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  for (const sport of SPORTS) {
    await page.locator(`${at("sport")} button[data-value="${sport}"]`).click();
    await expect(svg(page)).toHaveAttribute("data-sport", sport);
    expect(new URL(page.url()).searchParams.get("sport")).toBe(sport);
  }
});

test("every park is in the picker and draws its own fence", async ({ page }) => {
  await open(page, "?sport=mlb&lang=en&help=off&orientation=landscape");
  const options = await page.locator(`${at("park")} option`).count();
  expect(options).toBe(95);
  const fences = new Set();
  for (const value of ["generic", "fenway-park", "tokyo-dome", "hanshin-koshien-stadium", "oracle-park", "polo-grounds", "ebbets-field"]) {
    await page.locator(at("park")).selectOption(value);
    fences.add(await page.locator(`${at("stage")} .ky-fence`).getAttribute("d"));
  }
  expect(fences.size).toBe(7);
  await page.locator(at("park")).selectOption("tokyo-dome");
  expect(await svg(page).locator("desc").textContent()).toContain("Tokyo Dome");
});

test("the park picker appears for baseball only, and the court's looks for basketball only", async ({ page }) => {
  await open(page, "?sport=nhl&lang=en&help=off");
  await expect(page.locator("#park-row")).toBeHidden();
  await expect(page.locator("#court-group")).toBeHidden();
  await page.locator(`${at("sport")} button[data-value="mlb"]`).click();
  await expect(page.locator("#park-row")).toBeVisible();
  await page.locator(`${at("sport")} button[data-value="nba"]`).click();
  await expect(page.locator("#court-group")).toBeHidden();
  await openGroups(page);
  await expect(page.locator("#court-group")).toBeVisible();
});

test("the court's real hardwood chip is a finger wide, draws the boards and the address can ask for them", async ({ page }, testInfo) => {
  await open(page, "?sport=nba&lang=en&help=off&size=surface&orientation=landscape");
  await openGroups(page);
  const chip = page.locator(at("hardwood"));
  await expect(chip).toHaveText("Real hardwood");
  await expect(chip).toHaveAttribute("aria-pressed", "false");
  await expect(svg(page).locator("pattern")).toHaveCount(0);
  const box = await chip.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(43.5);
  expect(box.height).toBeGreaterThanOrEqual(43.5);
  await tap(page, chip, testInfo);
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect(svg(page).locator("pattern")).toHaveCount(2);
  expect(await svg(page).locator("rect.ky-hw").count()).toBeGreaterThan(5);
  expect(await page.locator(at("embed-code")).textContent()).toContain("hardwood");
  await tap(page, chip, testInfo);
  await expect(svg(page).locator("pattern")).toHaveCount(0);
  // The address can ask for it too.
  await open(page, "?sport=nba&lang=en&help=off&size=surface&hardwood=1");
  await expect(svg(page).locator("pattern")).toHaveCount(2);
});

test("the crowd chip draws the stands on any sport, its slider sets how full they are, both a finger wide, and the address can ask for them", async ({ page }, testInfo) => {
  await open(page, "?sport=soccer&lang=en&help=off&size=surface&orientation=landscape");
  await openGroups(page);
  const chip = page.locator(at("crowd"));
  await expect(chip).toHaveText("Crowd");
  await expect(chip).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#crowd-row")).toBeHidden();
  await expect(svg(page).locator("g.ky-crowd")).toHaveCount(0);
  const box = await chip.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(43.5);
  expect(box.height).toBeGreaterThanOrEqual(43.5);
  await tap(page, chip, testInfo);
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect(svg(page).locator("g.ky-crowd")).toHaveCount(1);
  await expect(page.locator("#crowd-row")).toBeVisible();
  const slider = page.locator(at("crowd-density"));
  expect((await slider.boundingBox()).height).toBeGreaterThanOrEqual(43.5);
  const full = await svg(page).locator("pattern").first().innerHTML();
  await slider.fill("100");
  await expect(page.locator(at("crowd-density-out"))).toHaveText("100%");
  const packed = await svg(page).locator("pattern").first().innerHTML();
  expect(packed).not.toBe(full);
  expect(packed).not.toContain("ky-cr-seat");
  expect(await page.locator(at("embed-code")).textContent()).toContain("crowd");
  // It is for every sport: the rink has stands too.
  await page.locator(`${at("sport")} button[data-value="nhl"]`).click();
  await expect(svg(page).locator("g.ky-crowd")).toHaveCount(1);
  await tap(page, chip, testInfo);
  await expect(svg(page).locator("g.ky-crowd")).toHaveCount(0);
  await open(page, "?sport=mlb&lang=en&help=off&size=surface&crowd=1&crowddensity=40");
  await expect(svg(page).locator("g.ky-crowd")).toHaveCount(1);
  await expect(page.locator(at("crowd-density-out"))).toHaveText("40%");
});

test("editing a team's name, score and colour redraws the drawing", async ({ page }) => {
  await open(page, "?sport=nhl&lang=en&help=off&orientation=landscape");
  await page.locator(at("home-name")).fill("Ice Kings");
  await page.locator(at("home-score")).fill("7");
  await page.locator(at("home-color")).fill("#ff0000");
  expect(await page.locator(`${at("stage")} svg text`).allTextContents()).toContain("ICE KINGS");
  expect(await page.locator(`${at("stage")} svg text`).allTextContents()).toContain("7");
  expect(await svg(page).getAttribute("style")).toContain("--ky-right:#ff0000");
  expect(await svg(page).getAttribute("data-winner")).toBe("home");
});

test("a name of markup stays text", async ({ page }) => {
  const errors = await open(page, "?sport=nhl&lang=en&help=off");
  await page.locator(at("away-name")).fill("<img src=x onerror=alert(1)>");
  await page.locator(at("away-logo")).locator('button[data-value="url"]').click();
  await page.locator(at("away-logo-url")).fill("javascript:alert(1)");
  expect(await page.locator(`${at("stage")} img, ${at("stage")} script`).count()).toBe(0);
  expect(await page.locator(`${at("stage")} image`).count()).toBe(1);
  expect(errors).toEqual([]);
});

test("the status, the size and the swap change what is drawn", async ({ page }) => {
  await open(page, "?sport=nba&lang=en&help=off&orientation=landscape");
  await openGroups(page);
  await page.locator(`${at("status")} button[data-value="live"]`).click();
  expect(await svg(page).getAttribute("data-winner")).toBe("none");
  await page.locator(`${at("size")} button[data-value="badge"]`).click();
  expect(await svg(page).getAttribute("viewBox")).toBe("0 0 440 64");
  await page.locator(`${at("size")} button[data-value="surface"]`).click();
  expect(await page.locator(`${at("stage")} .ky-plate`).count()).toBe(0);
  await page.locator(`${at("size")} button[data-value="full"]`).click();
  const before = await page.locator(`${at("stage")} .ky-banner`).first().getAttribute("data-team");
  await page.locator(at("swap")).click();
  expect(before).toBe("away");
  expect(await page.locator(`${at("away-name")}`).inputValue()).toMatch(/Metro Bolts/);
});

test("the page speaks Japanese when asked, and the drawing with it", async ({ page }) => {
  await open(page, "?sport=nhl&lang=en&help=off");
  await page.locator('[data-lang="ja"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  expect(await svg(page).locator("title").textContent()).toContain("試合終了");
  expect(await page.locator("#try-title").textContent()).toBe("試してみる");
  expect(await page.locator(`${at("away-name")}`).inputValue()).toBe("北国オウルズ");
  await page.locator(`${at("sport")} button[data-value="mlb"]`).click();
  await page.locator(at("park")).selectOption("tokyo-dome");
  expect(await svg(page).locator("desc").textContent()).toContain("東京ドーム");
  await page.locator('[data-lang="en"]').click();
  expect(await page.locator("#try-title").textContent()).toBe("Try it");
});

test("a live score moves when asked", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  const scores = () => page.locator(`${at("live-stage")} .ky-score`).allTextContents();
  expect(await scores()).toEqual(["0", "0"]);
  await page.locator(at("live-step")).click();
  expect(await scores()).toEqual(["1", "0"]);
  for (let i = 0; i < 8; i += 1) await page.locator(at("live-step")).click();
  await expect(page.locator(at("live-step"))).toBeDisabled();
  expect(await page.locator(`${at("live-stage")} svg`).getAttribute("data-winner")).not.toBe("none");
  await page.locator(at("live-new")).click();
  expect(await scores()).toEqual(["0", "0"]);
});

test("the examples are all there: every sport, wide and tall, badges, compact cards, courts and the parks", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  // The sports open short (see compact.demo.mjs for the filters): every card is in the page, drawn when the grid comes near the screen.
  await page.locator(at("gallery-more")).scrollIntoViewIfNeeded();
  await expect(page.locator(`${at("gallery-cards")} svg.kyogijo`)).toHaveCount(33);
  expect(await page.locator(`${at("side-cards")} svg.kyogijo`).count()).toBe(4);
  expect(await page.locator(`${at("badge-list")} svg.kyogijo`).count()).toBe(8);
  expect(await page.locator(`${at("compact-cards")} svg.kyogijo`).count()).toBe(3);
  expect(await page.locator(`${at("court-cards")} svg.kyogijo`).count()).toBe(7);
  // The parks open on the MLB parks in use today (see places.demo.mjs for the filters).
  await page.locator(at("parks-more")).scrollIntoViewIfNeeded();
  await expect(page.locator(`${at("park-grid")} .park`)).toHaveCount(30);
  await page.locator(`${at("park-grid")} .park[data-park="fenway-park"]`).click();
  await expect(svg(page)).toHaveAttribute("data-sport", "mlb");
  expect(await page.locator(at("park")).inputValue()).toBe("fenway-park");
});
