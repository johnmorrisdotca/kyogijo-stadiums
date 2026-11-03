// The playground's surface picker: a row of kinds, then the sports of the kind A to Z, then a sport's own surfaces; the address names the
// surface and brings its kind and sport back; arrow keys move along each row; a surface with an example game is marked.
import { expect, test } from "@playwright/test";

import { at, chosenSurface, noSidewaysScroll, open, serve, svg } from "./demo.mjs";

const kinds = (page) => page.locator(at("surface-kinds"));
const sports = (page) => page.locator(at("surface-sports"));
const variants = (page) => page.locator(at("surface-variants"));
const shown = (row) => row.locator('[role="radio"]:visible');
/** The names of a row's shown chips, without the words a screen reader hears for the mark. */
const names = (row) => row.locator('[role="radio"]:visible > span[data-say]').allTextContents();
const marked = (page) => page.locator(`${at("sport")} [role="radio"]:has(${at("surface-game")}:not([hidden]))`);

test("a kind shows its sports, A to Z, and a sport of it draws its surface", async ({ page }) => {
  const errors = await open(page, "?lang=en&help=off");
  await expect(kinds(page).locator('[aria-checked="true"]')).toHaveAttribute("data-kind", "ice");
  expect(await names(sports(page))).toEqual(["Curling", "Ice hockey", "Ice skating"]);
  // Looking at another kind changes nothing that is drawn, and keeps a mark on the kind of the surface on show.
  await kinds(page).locator('[data-kind="court"]').click();
  await expect(kinds(page).locator('[aria-checked="true"]')).toHaveAttribute("data-kind", "court");
  await expect(kinds(page).locator('[data-kind="ice"]')).toHaveAttribute("data-current", "true");
  const court = await names(sports(page));
  expect(court).toHaveLength(14);
  expect(court).toEqual([...court].sort(new Intl.Collator("en", { sensitivity: "base" }).compare));
  await expect(sports(page).locator('[aria-checked="true"]:visible')).toHaveCount(0);
  await expect(svg(page)).toHaveAttribute("data-sport", "nhl");
  expect(new URL(page.url()).searchParams.get("sport")).toBe("nhl");
  // A sport of the kind is chosen, drawn and written in the address.
  await sports(page).locator('[data-value="tennis"]').click();
  await expect(svg(page)).toHaveAttribute("data-sport", "tennis");
  expect(new URL(page.url()).searchParams.get("sport")).toBe("tennis");
  await expect(chosenSurface(page)).toHaveAttribute("data-value", "tennis");
  await expect(kinds(page).locator('[data-kind="court"]')).toHaveAttribute("data-current", "true");
  expect(errors).toEqual([]);
});

test("the football fields are one sport, with the NFL's, the CFL's and the IFAF's fields under it, and the address keeps each", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  await expect(variants(page)).toBeHidden();
  await kinds(page).locator('[data-kind="field"]').click();
  // Not three peers of Soccer: one chip, and the league names only in the row under it.
  expect(await names(sports(page))).toEqual(["Australian football", "Baseball", "Cricket", "Field hockey", "Gaelic games", "Gridiron football", "Lacrosse", "Rugby", "Soccer"]);
  await sports(page).locator('[data-chip="football"]').click();
  await expect(svg(page)).toHaveAttribute("data-sport", "nfl");
  await expect(variants(page)).toBeVisible();
  expect(await names(variants(page))).toEqual(["NFL", "CFL", "IFAF"]);
  await variants(page).locator('[data-value="cfl"]').click();
  await expect(svg(page)).toHaveAttribute("data-sport", "cfl");
  expect(new URL(page.url()).searchParams.get("sport")).toBe("cfl");
  await expect(chosenSurface(page)).toHaveAttribute("data-value", "cfl");
  // Pressing the sport again keeps the field on show.
  await sports(page).locator('[data-chip="football"]').click();
  await expect(svg(page)).toHaveAttribute("data-sport", "cfl");
});

for (const [sport, kind, chip] of [["cfl", "field", "football"], ["ifaf", "field", "football"], ["nhl", "ice", "nhl"], ["kyudo", "budo", "kyudo"], ["dojo", "budo", "dojo"], ["athletics", "track", "athletics"], ["tabletennis", "court", "tabletennis"], ["handball", "court", "handball"], ["waterpolo", "pool", "waterpolo"], ["prowrestling", "ring", "prowrestling"]]) {
  test(`the address ?sport=${sport} brings back its kind and its sport`, async ({ page }) => {
    await open(page, `?sport=${sport}&lang=en&help=off`);
    await expect(svg(page)).toHaveAttribute("data-sport", sport);
    await expect(kinds(page).locator('[aria-checked="true"]')).toHaveAttribute("data-kind", kind);
    await expect(sports(page).locator('[aria-checked="true"]')).toHaveAttribute("data-chip", chip);
    await expect(sports(page).locator('[aria-checked="true"]')).toBeVisible();
    await expect(chosenSurface(page)).toHaveAttribute("data-value", sport);
    await expect(variants(page)).toBeVisible({ visible: chip === "football" });
    // Every shown chip is of that kind, and the tab stop of each row is its chosen one.
    for (const value of await shown(sports(page)).evaluateAll((all) => all.map((b) => b.dataset.kind))) expect(value).toBe(kind);
    await expect(sports(page).locator('[tabindex="0"]')).toHaveAttribute("data-chip", chip);
    expect(new URL(page.url()).searchParams.get("sport")).toBe(sport);
  });
}

test("the arrow keys move along each row, and Space and Enter choose", async ({ page, browserName }, testInfo) => {
  test.skip(testInfo.project.use.hasTouch === true, "keys are a keyboard's");
  test.skip(browserName !== "chromium", "one engine is enough for the keys");
  await open(page, "?lang=en&help=off");
  const focused = () => page.evaluate(() => document.activeElement?.dataset.chip ?? document.activeElement?.dataset.kind ?? null);
  await kinds(page).locator('[aria-checked="true"]').focus();
  await page.keyboard.press("ArrowRight");
  expect(await focused()).toBe("pool");
  // Moving is not choosing.
  await expect(kinds(page).locator('[aria-checked="true"]')).toHaveAttribute("data-kind", "ice");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  expect(await focused()).toBe("court");
  await page.keyboard.press("Home");
  expect(await focused()).toBe("field");
  await page.keyboard.press("ArrowLeft");
  expect(await focused()).toBe("ring");
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowRight");
  expect(await focused()).toBe("field");
  // Each row is one stop of the Tab key: the next stop is the sports of the kind.
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press(" ");
  await expect(kinds(page).locator('[aria-checked="true"]')).toHaveAttribute("data-kind", "court");
  await expect(kinds(page).locator('[tabindex="0"]')).toHaveAttribute("data-kind", "court");
  await page.keyboard.press("Tab");
  expect(await focused()).toBe("badminton");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  expect(await focused()).toBe("handball");
  await expect(svg(page)).toHaveAttribute("data-sport", "nhl");
  await page.keyboard.press("Enter");
  await expect(svg(page)).toHaveAttribute("data-sport", "handball");
  expect(new URL(page.url()).searchParams.get("sport")).toBe("handball");
  // A focus ring shows on the chip the keys are on.
  expect(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)).toBe("solid");
});

test("a surface is marked when the games' index has a game on it", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  await expect(page.locator(at("sport"))).toHaveAttribute("data-games", "ready");
  await expect(marked(page)).toHaveCount(1);
  await expect(marked(page)).toHaveAttribute("data-value", "nhl");
  // The mark is a play sign for the eye and words for a screen reader.
  await expect(page.getByRole("radio", { name: "Ice hockey Has an example game" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Curling", exact: true })).toBeVisible();
});

test("the marks follow the index the page fetches, not a list of their own", async ({ page }) => {
  await serve(page);
  // An index with a game on a tennis court and one on the CFL's field, and none on the ice.
  const game = (id, sport) => ({ id, sport, file: `${id}.json`, frame: "nhl-api", title: { en: id, ja: id } });
  await page.route("http://kyogijo.test/examples/games/index.json", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ kind: "kyogijo-games", version: 1, games: [game("a-tennis-game", "tennis"), game("a-cfl-game", "cfl")] }) }));
  await page.goto("http://kyogijo.test/?lang=en&help=off&sport=cfl");
  await page.waitForSelector(`${at("stage")}[data-ready="true"] svg.kyogijo`);
  await expect(page.locator(at("sport"))).toHaveAttribute("data-games", "ready");
  expect(await marked(page).evaluateAll((all) => all.map((b) => b.dataset.chip ?? b.dataset.value).sort())).toEqual(["cfl", "football", "tennis"]);
  await expect(variants(page).locator('[data-value="nfl"] [data-testid="surface-game"]')).toBeHidden();
});

test("the rows fit a phone: they wrap inside the panel and the page does not scroll sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "?lang=en&help=off&sport=ifaf");
  for (const kind of ["court", "field"]) {
    await kinds(page).locator(`[data-kind="${kind}"]`).click();
    await noSidewaysScroll(page);
    const width = page.viewportSize().width;
    for (const button of await page.locator(`${at("sport")} [role="radio"]:visible`).all()) {
      const box = await button.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      // A finger's size.
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  }
});

test("in Japanese the kinds and sports say their Japanese names, the sports in gojūon order", async ({ page }) => {
  await open(page, "?lang=ja&help=off&sport=judo");
  await expect(kinds(page).locator('[aria-checked="true"]')).toHaveText("武道");
  expect(await names(sports(page))).toEqual(["空手", "弓道", "剣道", "柔道", "相撲", "道場"]);
  await expect(kinds(page)).toHaveAttribute("aria-label", "競技場の種類");
  await kinds(page).locator('[data-kind="ice"]').click();
  expect(await names(sports(page))).toEqual(["アイスホッケー", "カーリング", "スケート"]);
  await expect(page.getByRole("radio", { name: "アイスホッケー 再生できる架空の試合あり" })).toBeVisible();
  // Back in English, the order is the English one again.
  await page.locator('[data-lang="en"]').first().click();
  expect(await names(sports(page))).toEqual(["Curling", "Ice hockey", "Ice skating"]);
});
