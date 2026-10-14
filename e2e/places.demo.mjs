// The Ballparks and Soccer grounds sections: a short default view, filters, a search that reads every name, "show all", and the state in the address.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open, svg, tap } from "./demo.mjs";

const cards = (page, grid) => page.locator(`${at(grid)} .park`);
/** The cards that take room: those the stylesheet has not shut away (a phone's row that scrolls sideways counts every card in it). */
const shown = (page, grid) => page.locator(`${at(grid)} .park`).evaluateAll((all) => all.filter((el) => getComputedStyle(el).display !== "none").length);
const press = async (page, test_id, value, testInfo) => tap(page, `${at(test_id)} button[data-value="${value}"]`, testInfo);
const pressed = (page, test_id) => page.locator(`${at(test_id)} button[aria-pressed="true"]`);
const param = (page, name) => new URL(page.url()).searchParams.get(name);
const height = (page, id) => page.locator(`#${id}`).evaluate((el) => Math.round(el.getBoundingClientRect().height));

test("the parks open short: the MLB parks in use today, a screen or less, with the rest one press away", async ({ page }, testInfo) => {
  await open(page, "?lang=en&help=off");
  const phone = page.viewportSize().width < 560;
  await expect(page.locator(at("parks-count"))).toHaveText("30 of 94 parks");
  await expect(pressed(page, "parks-league")).toHaveText("MLB");
  await expect(pressed(page, "parks-status")).toHaveText("Today");
  await expect(page.locator('[data-field="era"]')).toBeHidden();
  await expect(cards(page, "park-grid")).toHaveCount(30);
  expect(await cards(page, "park-grid").evaluateAll((all) => all.every((el) => /^MLB · /.test(el.querySelector(".park-sub").textContent) && !/\d{4}–/.test(el.textContent)))).toBe(true);
  // The section is about one screen: before this change it was 2200 px on a desk and 6000 px on a phone.
  expect(await height(page, "parks")).toBeLessThan(phone ? 700 : 760);
  // A desk shows two rows of eight and a phone one row that scrolls sideways; the button says how many there are.
  if (phone) {
    expect(await shown(page, "park-grid")).toBe(30);
    const [scroll, client] = await page.locator(at("park-grid")).evaluate((el) => [el.scrollWidth, el.clientWidth]);
    expect(scroll).toBeGreaterThan(client * 3);
    const tops = await cards(page, "park-grid").evaluateAll((all) => new Set(all.map((el) => Math.round(el.getBoundingClientRect().top))).size);
    expect(tops).toBe(1);
  } else {
    expect(await shown(page, "park-grid")).toBe(16);
    const tops = await cards(page, "park-grid").evaluateAll((all) => new Set(all.filter((el) => getComputedStyle(el).display !== "none").map((el) => Math.round(el.getBoundingClientRect().top))).size);
    expect(tops).toBe(2);
  }
  await noSidewaysScroll(page);
  const more = page.locator(at("parks-more"));
  await expect(more).toHaveText("Show all 30 parks");
  await expect(more).toHaveAttribute("aria-expanded", "false");
  // Show all, and show fewer.
  await tap(page, more, testInfo);
  await expect(more).toHaveText("Show fewer");
  await expect(more).toHaveAttribute("aria-expanded", "true");
  expect(await shown(page, "park-grid")).toBe(30);
  expect(param(page, "parkall")).toBe("1");
  expect(await height(page, "parks")).toBeGreaterThan(phone ? 1100 : 800);
  await noSidewaysScroll(page);
  await tap(page, more, testInfo);
  await expect(more).toHaveText("Show all 30 parks");
  expect(param(page, "parkall")).toBeNull();
});

test("the show-all button works from the keyboard", async ({ page, browserName }) => {
  test.skip(browserName === "webkit", "Safari does not tab to buttons by default");
  await open(page, "?lang=en&help=off");
  const more = page.locator(at("parks-more"));
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(more).toHaveText("Show fewer");
  await expect(more).toBeFocused();
  await page.keyboard.press("Space");
  await expect(more).toHaveText("Show all 30 parks");
});

test("league, use and era narrow the parks, and every count is in a polite live region", async ({ page }, testInfo) => {
  await open(page, "?lang=en&help=off");
  const count = page.locator(at("parks-count"));
  await expect(count).toHaveAttribute("aria-live", "polite");
  await press(page, "parks-league", "npb", testInfo);
  await expect(count).toHaveText("14 of 94 parks");
  await expect(cards(page, "park-grid")).toHaveCount(14);
  expect(param(page, "parkleague")).toBe("npb");
  expect(param(page, "parkstatus")).toBeNull();
  await press(page, "parks-status", "past", testInfo);
  await expect(count).toHaveText("6 of 94 parks");
  // The era shows for the past, and keeps the parks that were in use in a decade.
  const era = page.locator(at("parks-era"));
  await expect(era).toBeVisible();
  await era.selectOption("1950");
  await expect(count).toHaveText("6 of 94 parks");
  // A park whose last year no source gives is not shut out of a later decade (the atlas's own rule for a year).
  await era.selectOption("1990");
  await expect(count).toHaveText("5 of 94 parks");
  expect(param(page, "parkera")).toBe("1990");
  await press(page, "parks-league", "all", testInfo);
  await expect(count).toHaveText("27 of 94 parks");
  await era.selectOption("1910");
  await expect(count).toHaveText("15 of 94 parks");
  await press(page, "parks-status", "all", testInfo);
  await expect(count).toHaveText("17 of 94 parks");
  await press(page, "parks-status", "current", testInfo);
  await expect(page.locator('[data-field="era"]')).toBeHidden();
});

test("a search finds a park by any name it has, over every park, in English and in Japanese", async ({ page }, testInfo) => {
  await open(page, "?lang=en&help=off");
  const count = page.locator(at("parks-count"));
  const search = page.locator(at("parks-search"));
  await search.fill("Camden Yards");
  await expect(count).toHaveText("1 of 94 parks match your search");
  await expect(cards(page, "park-grid")).toHaveCount(1);
  await expect(cards(page, "park-grid").first()).toHaveAttribute("data-park", "oriole-park-at-camden-yards");
  expect(param(page, "parkq")).toBe("Camden Yards");
  // The filters are off while a search is typed (it reads every park), and come back when it is cleared.
  await expect(page.locator(`${at("parks-league")} button`).first()).toBeDisabled();
  await expect(page.locator(at("parks-era"))).toBeDisabled();
  // 甲子園 is an NPB park, which the default view (MLB) does not show: the search reaches it anyway.
  await search.fill("甲子園");
  await expect(count).toHaveText("1 of 94 parks match your search");
  await expect(cards(page, "park-grid").first()).toHaveAttribute("data-park", "hanshin-koshien-stadium");
  await expect(cards(page, "park-grid").first()).toContainText("Koshien Stadium");
  // Katakana for hiragana, the long vowel mark and the like do not matter.
  await search.fill("ヤンキースタジアム");
  await expect(cards(page, "park-grid")).toHaveCount(2);
  await search.fill("zzzz");
  await expect(count).toHaveText("0 of 94 parks match your search");
  await expect(page.locator(`${at("park-grid")} .pf-empty`)).toContainText("No park matches");
  await expect(page.locator(at("parks-more"))).toBeHidden();
  await search.fill("");
  await expect(count).toHaveText("30 of 94 parks");
  await expect(page.locator(`${at("parks-league")} button`).first()).toBeEnabled();
  expect(param(page, "parkq")).toBeNull();
  await press(page, "parks-league", "npb", testInfo);
  await expect(page.locator(at("parks-reset"))).toBeVisible();
  await tap(page, at("parks-reset"), testInfo);
  await expect(count).toHaveText("30 of 94 parks");
  await expect(page.locator(at("parks-reset"))).toBeHidden();
  expect(param(page, "parkleague")).toBeNull();
});

test("the filters are in the address, under their own names, and an address restores them", async ({ page }, testInfo) => {
  await open(page, "?lang=en&help=off&sport=nhl&place=wembley");
  await press(page, "parks-league", "npb", testInfo);
  await press(page, "parks-status", "past", testInfo);
  const url = new URL(page.url());
  expect(url.searchParams.get("parkleague")).toBe("npb");
  expect(url.searchParams.get("parkstatus")).toBe("past");
  // Nothing of the playground's or the atlas's is touched.
  expect(url.searchParams.get("sport")).toBe("nhl");
  expect(url.searchParams.get("place")).toBe("wembley");
  expect(url.searchParams.get("lang")).toBe("en");
  // The address opens the same view, and a value the section does not have is the default.
  await open(page, "?lang=en&help=off&parkleague=npb&parkstatus=past&parkera=1950&parkall=1&groundgroup=clubs&groundcountry=GB");
  await expect(page.locator(at("parks-count"))).toHaveText("6 of 94 parks");
  await expect(pressed(page, "parks-league")).toHaveText("NPB");
  await expect(pressed(page, "parks-status")).toHaveText("Past");
  await expect(page.locator(at("parks-era"))).toHaveValue("1950");
  await expect(page.locator(at("parks-more"))).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(at("grounds-count"))).toHaveText("10 of 64 grounds");
  await expect(pressed(page, "grounds-group")).toHaveText("Clubs");
  await expect(page.locator(at("grounds-country"))).toHaveValue("GB");
  await open(page, "?lang=en&help=off&parkleague=xyz&parkera=1066&groundgroup=none");
  await expect(page.locator(at("parks-count"))).toHaveText("30 of 94 parks");
  await expect(page.locator(at("grounds-count"))).toHaveText("28 of 64 grounds");
  await open(page, "?lang=en&help=off&parkq=Fenway");
  await expect(page.locator(at("parks-search"))).toHaveValue("Fenway");
  await expect(page.locator(at("parks-count"))).toHaveText("1 of 94 parks match your search");
});

test("a card opens its park in the playground, and its ground too", async ({ page }, testInfo) => {
  await open(page, "?lang=en&help=off");
  await tap(page, `${at("park-grid")} .park[data-park="fenway-park"]`, testInfo);
  await expect(svg(page)).toHaveAttribute("data-sport", "mlb");
  expect(await page.locator(at("park")).inputValue()).toBe("fenway-park");
  await page.locator(at("ground-grid")).scrollIntoViewIfNeeded();
  await tap(page, `${at("ground-grid")} .park[data-ground="maracana"]`, testInfo);
  await expect(svg(page)).toHaveAttribute("data-sport", "soccer");
  expect(await page.locator(at("ground")).inputValue()).toBe("maracana");
});

test("the soccer grounds open short too: the grounds of the World Cup finals, with group, country and search", async ({ page }, testInfo) => {
  await open(page, "?lang=en&help=off");
  const phone = page.viewportSize().width < 560;
  const count = page.locator(at("grounds-count"));
  await expect(count).toHaveText("28 of 64 grounds");
  await expect(pressed(page, "grounds-group")).toHaveText("Finals");
  await expect(cards(page, "ground-grid")).toHaveCount(28);
  expect(await height(page, "grounds")).toBeLessThan(phone ? 800 : 850);
  expect(await shown(page, "ground-grid")).toBe(phone ? 28 : 16);
  await expect(page.locator(at("grounds-more"))).toHaveText("Show all 28 grounds");
  await press(page, "grounds-group", "2026", testInfo);
  await expect(count).toHaveText("13 of 64 grounds");
  await press(page, "grounds-group", "clubs", testInfo);
  await expect(count).toHaveText("23 of 64 grounds");
  await press(page, "grounds-group", "all", testInfo);
  await expect(count).toHaveText("64 of 64 grounds");
  await page.locator(at("grounds-country")).selectOption("GB");
  await expect(count).toHaveText("11 of 64 grounds");
  expect(param(page, "groundcountry")).toBe("GB");
  await page.locator(at("grounds-country")).selectOption("all");
  // The group is "clubs" and the search is over every ground, accents aside.
  const search = page.locator(at("grounds-search"));
  await search.fill("maracana");
  await expect(count).toHaveText("1 of 64 grounds match your search");
  await expect(cards(page, "ground-grid").first()).toHaveAttribute("data-ground", "maracana");
  await search.fill("ウェンブリー");
  await expect(count).toHaveText("2 of 64 grounds match your search");
  await search.fill("日産");
  await expect(cards(page, "ground-grid").first()).toContainText("Nissan Stadium");
  await search.fill("");
  await tap(page, at("grounds-more"), testInfo);
  expect(await shown(page, "ground-grid")).toBe(64);
  await noSidewaysScroll(page);
});

test("the controls are labelled for a screen reader", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  await expect(page.getByRole("search", { name: "Filter the ballparks" })).toBeVisible();
  const parks = page.getByRole("search", { name: "Filter the ballparks" });
  await expect(parks.getByRole("group", { name: "League" })).toBeVisible();
  await expect(parks.getByRole("group", { name: "In use" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Find a park" })).toBeVisible();
  await expect(page.getByRole("search", { name: "Filter the soccer grounds" })).toBeAttached();
  const grounds = page.getByRole("search", { name: "Filter the soccer grounds" });
  await expect(grounds.getByRole("group", { name: "Group" })).toBeAttached();
  await expect(grounds.getByRole("combobox", { name: "Country" })).toBeAttached();
  await expect(page.getByRole("searchbox", { name: "Find a ground" })).toBeAttached();
  // Every card has one name: the park's, and where it is.
  await expect(page.getByRole("button", { name: "Fenway Park, MLB · Boston" })).toHaveCount(1);
  // The long names of the grounds' groups are the buttons' titles.
  await expect(page.locator(`${at("grounds-group")} button[data-value="2026"]`)).toHaveAttribute("title", "Other 2026 World Cup venues");
});

test("in Japanese the sections say everything in Japanese, and the search reads the Japanese names", async ({ page }, testInfo) => {
  await open(page, "?lang=ja&help=off");
  await expect(page.locator("#parks-title")).toHaveText("球場");
  await expect(page.locator(at("parks-count"))).toHaveText("94球場中30球場");
  await expect(page.locator(at("parks-more"))).toHaveText("全30球場を表示");
  await expect(page.locator(at("grounds-count"))).toHaveText("64会場中28会場");
  await expect(pressed(page, "parks-league")).toHaveText("MLB");
  await expect(pressed(page, "parks-status")).toHaveText("現在");
  await expect(page.getByRole("searchbox", { name: "球場を探す" })).toBeVisible();
  await expect(cards(page, "park-grid").first()).toContainText("オリオール・パーク");
  await page.locator(at("parks-search")).fill("甲子園");
  await expect(cards(page, "park-grid")).toHaveCount(1);
  await expect(page.locator(at("parks-count"))).toHaveText("94球場中1球場が見つかりました");
  await page.locator(at("parks-search")).fill("");
  await press(page, "parks-status", "past", testInfo);
  await expect(page.locator(at("parks-era")).locator("option").nth(1)).toHaveText(/年代$/);
  // A change of language keeps the filters and says them in the new language.
  await page.locator('[data-lang="en"]').click();
  await expect(page.locator(at("parks-count"))).toHaveText("44 of 94 parks");
  await expect(pressed(page, "parks-status")).toHaveText("Past");
});
