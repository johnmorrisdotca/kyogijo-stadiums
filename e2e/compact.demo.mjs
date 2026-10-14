// The Every sport and The soccer pitch sections: they open short (about one screen), with chips for the family of sport or the kind of pitch,
// a count that a screen reader hears, a "show all", a sideways row on a phone, and the state in the address.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open, tap } from "./demo.mjs";

const SECTIONS = {
  gallery: { grid: "gallery-cards", chips: "gallery-family", card: "figure.card", total: 24, noun: "sports", param: "galleryfamily", all: "galleryall" },
  pitches: { grid: "pitch-cards", chips: "pitches-group", card: "figure.card", total: 16, noun: "pitches", param: "pitchesgroup", all: "pitchesall" },
};
const FAMILIES = { football: 3, hockey: 1, basketball: 1, baseball: 1, soccer: 1, curling: 1, net: 5, pool: 4, field: 7 };
const GROUPS = { presets: 2, small: 3, futsal: 1, grounds: 2, layouts: 2, mowing: 6 };

const cards = (page, name) => page.locator(`${at(SECTIONS[name].grid)} ${SECTIONS[name].card}`);
/** The cards that take room: those the stylesheet has not shut away (a phone's row that scrolls sideways counts every card in it). */
const shown = (page, name) => cards(page, name).evaluateAll((all) => all.filter((el) => getComputedStyle(el).display !== "none").length);
const press = (page, name, value, testInfo) => tap(page, `${at(SECTIONS[name].chips)} button[data-value="${value}"]`, testInfo);
const pressed = (page, name) => page.locator(`${at(SECTIONS[name].chips)} button[aria-pressed="true"]`);
const param = (page, key) => new URL(page.url()).searchParams.get(key);
const height = (page, id) => page.locator(`#${id}`).evaluate((el) => Math.round(el.getBoundingClientRect().height));
const isPhone = (page) => page.viewportSize().width < 560;
/** The most cards that show before "show all": two rows of three on a desk, and a phone's one row holds four before the button offers the rest. */
const cap = (page) => (isPhone(page) ? 4 : 6);

for (const name of ["gallery", "pitches"]) {
  const one = SECTIONS[name];
  const id = name;

  test(`${name}: opens short, a screen or less, with the rest one press away`, async ({ page }, testInfo) => {
    await open(page, "?lang=en&help=off");
    const phone = isPhone(page);
    await expect(page.locator(at(`${name}-count`))).toHaveText(`${one.total} of ${one.total} ${one.noun}`);
    await expect(pressed(page, name)).toHaveText("All");
    await expect(cards(page, name)).toHaveCount(one.total);
    // Before this change the sports were 4,451 px on a desk and 11,941 px on a phone, and the pitches 3,236 and 8,455.
    expect(await height(page, id)).toBeLessThan(phone ? 600 : 820);
    if (phone) {
      // One row that scrolls sideways, with the next card peeking in at the edge.
      expect(await shown(page, name)).toBe(one.total);
      const tops = await cards(page, name).evaluateAll((all) => new Set(all.map((el) => Math.round(el.getBoundingClientRect().top))).size);
      expect(tops).toBe(1);
      const [scroll, client] = await page.locator(at(one.grid)).evaluate((el) => [el.scrollWidth, el.clientWidth]);
      expect(scroll).toBeGreaterThan(client * 3);
      const edge = await page.locator(at(one.grid)).evaluate((el) => {
        const [first, second] = el.children;
        const box = el.getBoundingClientRect();
        return { firstWhole: first.getBoundingClientRect().right <= box.right, secondStarts: second.getBoundingClientRect().left < box.right - 24, secondCut: second.getBoundingClientRect().right > box.right };
      });
      expect(edge).toEqual({ firstWhole: true, secondStarts: true, secondCut: true });
    } else {
      // Two rows of three.
      expect(await shown(page, name)).toBe(6);
      const tops = await cards(page, name).evaluateAll((all) => new Set(all.filter((el) => getComputedStyle(el).display !== "none").map((el) => Math.round(el.getBoundingClientRect().top))).size);
      expect(tops).toBe(2);
    }
    await noSidewaysScroll(page);
    const more = page.locator(at(`${name}-more`));
    await expect(more).toHaveText(`Show all ${one.total} ${one.noun}`);
    await expect(more).toHaveAttribute("aria-expanded", "false");
    // Show all, and show fewer.
    await tap(page, more, testInfo);
    await expect(more).toHaveText("Show fewer");
    await expect(more).toHaveAttribute("aria-expanded", "true");
    expect(await shown(page, name)).toBe(one.total);
    expect(param(page, one.all)).toBe("1");
    // Every card is drawn once the rest is open.
    await expect(page.locator(`${at(one.grid)} svg.kyogijo`)).toHaveCount(one.total);
    await expect(page.locator(`${at(one.grid)} [data-late]`)).toHaveCount(0);
    expect(await height(page, id)).toBeGreaterThan(phone ? 1400 : 1500);
    await noSidewaysScroll(page);
    await tap(page, more, testInfo);
    await expect(more).toHaveText(`Show all ${one.total} ${one.noun}`);
    expect(param(page, one.all)).toBeNull();
  });
}

test("the sports narrow to a family, every count is in a polite live region, and a family that fits shows no 'show all'", async ({ page }, testInfo) => {
  await open(page, "?lang=en&help=off");
  const count = page.locator(at("gallery-count"));
  await expect(count).toHaveAttribute("aria-live", "polite");
  for (const [family, n] of Object.entries(FAMILIES)) {
    await press(page, "gallery", family, testInfo);
    await expect(count).toHaveText(`${n} of 24 sports`);
    await expect(cards(page, "gallery")).toHaveCount(n);
    expect(param(page, "galleryfamily")).toBe(family);
    // The cards are drawn at once when they are asked for.
    await expect(page.locator(`${at("gallery-cards")} svg.kyogijo`)).toHaveCount(n);
    if (n <= cap(page)) await expect(page.locator(at("gallery-more"))).toBeHidden();
    else await expect(page.locator(at("gallery-more"))).toHaveText(`Show all ${n} sports`);
    await expect(page.locator(at("gallery-reset"))).toBeVisible();
  }
  // The families name the sports they hold.
  await press(page, "gallery", "net", testInfo);
  expect(await page.locator(`${at("gallery-cards")} figure`).evaluateAll((all) => all.map((el) => el.dataset.sport))).toEqual(["tennis", "volleyball", "badminton", "pickleball", "tabletennis"]);
  await press(page, "gallery", "football", testInfo);
  expect(await page.locator(`${at("gallery-cards")} figcaption`).allTextContents()).toEqual(["NFL", "CFL", "IFAF"]);
  await tap(page, at("gallery-reset"), testInfo);
  await expect(count).toHaveText("24 of 24 sports");
  await expect(pressed(page, "gallery")).toHaveText("All");
  await expect(page.locator(at("gallery-reset"))).toBeHidden();
  expect(param(page, "galleryfamily")).toBeNull();
});

test("the pitches narrow to a kind", async ({ page }, testInfo) => {
  await open(page, "?lang=en&help=off");
  const count = page.locator(at("pitches-count"));
  await expect(count).toHaveAttribute("aria-live", "polite");
  for (const [group, n] of Object.entries(GROUPS)) {
    await press(page, "pitches", group, testInfo);
    await expect(count).toHaveText(`${n} of 16 pitches`);
    await expect(cards(page, "pitches")).toHaveCount(n);
    expect(param(page, "pitchesgroup")).toBe(group);
    await expect(page.locator(`${at("pitch-cards")} svg.kyogijo`)).toHaveCount(n);
    if (n <= cap(page)) await expect(page.locator(at("pitches-more"))).toBeHidden();
    else await expect(page.locator(at("pitches-more"))).toBeVisible();
  }
  await press(page, "pitches", "small", testInfo);
  await expect(page.locator(`${at("pitch-cards")} figcaption`)).toHaveText(["9-a-side (FA), 80 × 50 yd", "7-a-side (FA), 60 × 40 yd", "5-a-side (FA), 40 × 30 yd"]);
  await press(page, "pitches", "grounds", testInfo);
  await expect(page.locator(`${at("pitch-cards")} figcaption`)).toHaveText(["Anfield · 101 × 68 m", "Maracanã Stadium · 105 × 68 m"]);
  await press(page, "pitches", "all", testInfo);
  await expect(count).toHaveText("16 of 16 pitches");
  expect(param(page, "pitchesgroup")).toBeNull();
});

test("the chips are in the address under names of their own, and an address restores them", async ({ page }, testInfo) => {
  await open(page, "?lang=en&help=off&sport=nhl&place=wembley&pitch=futsal");
  await press(page, "gallery", "field", testInfo);
  await press(page, "pitches", "mowing", testInfo);
  let url = new URL(page.url());
  expect(url.searchParams.get("galleryfamily")).toBe("field");
  expect(url.searchParams.get("pitchesgroup")).toBe("mowing");
  // Nothing of the playground's or the atlas's is touched, and nothing is written that is the default.
  expect(url.searchParams.get("sport")).toBe("nhl");
  expect(url.searchParams.get("place")).toBe("wembley");
  expect(url.searchParams.get("pitch")).toBe("futsal");
  expect(url.searchParams.get("lang")).toBe("en");
  expect(url.searchParams.get("galleryall")).toBeNull();
  expect(url.searchParams.get("pitchesall")).toBeNull();
  expect(url.searchParams.get("parkleague")).toBeNull();
  // The address opens the same view, show all included.
  await open(page, "?lang=en&help=off&galleryfamily=field&galleryall=1&pitchesgroup=small");
  await expect(page.locator(at("gallery-count"))).toHaveText("7 of 24 sports");
  await expect(pressed(page, "gallery")).toHaveText("Field sports");
  await expect(page.locator(at("gallery-more"))).toHaveAttribute("aria-expanded", "true");
  await expect(cards(page, "gallery")).toHaveCount(7);
  await expect(page.locator(`${at("gallery-cards")} svg.kyogijo`)).toHaveCount(7);
  await expect(page.locator(at("pitches-count"))).toHaveText("3 of 16 pitches");
  await expect(pressed(page, "pitches")).toHaveText("Small-sided");
  // The chip that is on is in sight, however far along the row it is.
  await open(page, "?lang=en&help=off&galleryfamily=field");
  const inSight = await page.locator(`${at("gallery-family")} button[aria-pressed="true"]`).evaluate((el) => {
    const bar = el.parentElement.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    return box.left >= bar.left - 1 && box.right <= bar.right + 1;
  });
  expect(inSight).toBe(true);
  // A value the section does not have is the default, and the other section is not touched.
  await open(page, "?lang=en&help=off&galleryfamily=rugby&pitchesgroup=none&galleryall=2");
  await expect(page.locator(at("gallery-count"))).toHaveText("24 of 24 sports");
  await expect(page.locator(at("pitches-count"))).toHaveText("16 of 16 pitches");
  await expect(page.locator(at("gallery-more"))).toHaveAttribute("aria-expanded", "false");
  url = new URL(page.url());
  expect(url.searchParams.get("galleryfamily")).toBe("rugby");
});

test("the chips and the show-all button work from the keyboard", async ({ page, browserName }) => {
  test.skip(browserName === "webkit", "Safari does not tab to buttons by default");
  await open(page, "?lang=en&help=off");
  // A chip: focus, press with Enter, and it is on; the next with Space.
  const hockey = page.locator(`${at("gallery-family")} button[data-value="hockey"]`);
  await hockey.focus();
  await page.keyboard.press("Enter");
  await expect(hockey).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(at("gallery-count"))).toHaveText("1 of 24 sports");
  await expect(hockey).toBeFocused();
  const net = page.locator(`${at("gallery-family")} button[data-value="net"]`);
  await page.keyboard.press("Tab");
  await net.focus();
  await page.keyboard.press("Space");
  await expect(net).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(at("gallery-count"))).toHaveText("5 of 24 sports");
  // Show all, and show fewer.
  const pitches = page.locator(at("pitches-more"));
  await pitches.focus();
  await page.keyboard.press("Enter");
  await expect(pitches).toHaveText("Show fewer");
  await expect(pitches).toBeFocused();
  await page.keyboard.press("Space");
  await expect(pitches).toHaveText("Show all 16 pitches");
});

test("the row that scrolls sideways on a phone can be reached from the keyboard", async ({ page, browserName }) => {
  test.skip(browserName === "webkit", "Safari does not tab to the row by default");
  test.skip(!isPhone(page), "a desk has no row that scrolls");
  await open(page, "?lang=en&help=off");
  const grid = page.locator(at("gallery-cards"));
  await expect(grid).toHaveAttribute("tabindex", "0");
  await expect(page.getByRole("group", { name: "Every sport" })).toBeAttached();
  await grid.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => grid.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
});

test("a desk's grid is not a tab stop", async ({ page }) => {
  test.skip(isPhone(page), "a phone's row scrolls, so it is reachable");
  await open(page, "?lang=en&help=off");
  await expect(page.locator(at("gallery-cards"))).not.toHaveAttribute("tabindex", /./);
});

test("the controls are labelled for a screen reader", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  const gallery = page.getByRole("search", { name: "Filter the sports" });
  await expect(gallery).toBeAttached();
  await expect(gallery.getByRole("group", { name: "Family" })).toBeAttached();
  await expect(gallery.getByRole("button", { name: "Net sports" })).toBeAttached();
  const pitches = page.getByRole("search", { name: "Filter the pitches" });
  await expect(pitches).toBeAttached();
  await expect(pitches.getByRole("group", { name: "Kind" })).toBeAttached();
  await expect(pitches.getByRole("button", { name: "Small-sided" })).toBeAttached();
  // Each card is a figure with its name, and a drawing that says what it shows.
  await expect(page.locator(`${at("gallery-cards")} figure`).first()).toContainText("NFL");
});

test("in Japanese the sections say everything in Japanese, and a change of language keeps the chips", async ({ page }, testInfo) => {
  await open(page, "?lang=ja&help=off");
  await expect(page.locator("#gallery-title")).toHaveText("すべての競技");
  await expect(page.locator(at("gallery-count"))).toHaveText("24競技中24競技");
  await expect(page.locator(at("gallery-more"))).toHaveText("全24競技を表示");
  await expect(page.locator("#pitches-title")).toHaveText("サッカーのピッチ");
  await expect(page.locator(at("pitches-count"))).toHaveText("16種中16種");
  await expect(page.locator(at("pitches-more"))).toHaveText("全16種を表示");
  await expect(pressed(page, "gallery")).toHaveText("すべて");
  await expect(page.getByRole("search", { name: "競技の絞り込み" })).toBeAttached();
  await expect(page.getByRole("search", { name: "ピッチの絞り込み" })).toBeAttached();
  expect(await page.locator(`${at("gallery-family")} button`).allTextContents()).toEqual(["すべて", "アメリカンフットボール", "アイスホッケー", "バスケットボール", "野球", "サッカー", "カーリング", "ネット球技", "プール", "フィールド球技"]);
  expect(await page.locator(`${at("pitches-group")} button`).allTextContents()).toEqual(["すべて", "規格", "5・7・9人制", "フットサル", "有名なスタジアム", "表示形式", "芝の模様とゴール"]);
  // The cards are drawn in Japanese, and the grounds' names too.
  await expect(page.locator(`${at("gallery-cards")} figcaption`).first()).toHaveText("NFL");
  await press(page, "pitches", "grounds", testInfo);
  await expect(page.locator(`${at("pitch-cards")} figcaption`).first()).toContainText("アンフィールド");
  expect(await page.locator(`${at("pitch-cards")} svg.kyogijo`).first().locator("title").textContent()).toMatch(/[぀-ヿ一-鿿]/);
  await press(page, "gallery", "net", testInfo);
  await expect(page.locator(at("gallery-count"))).toHaveText("24競技中5競技");
  await page.locator('[data-lang="en"]').click();
  await expect(page.locator(at("gallery-count"))).toHaveText("5 of 24 sports");
  await expect(pressed(page, "gallery")).toHaveText("Net sports");
  await expect(pressed(page, "pitches")).toHaveText("Famous grounds");
  await noSidewaysScroll(page);
});
