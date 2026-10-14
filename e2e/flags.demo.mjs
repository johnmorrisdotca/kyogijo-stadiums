// The country flags of the demo: real countries drawn with Hata's flags through the package's `useFlags` plug-in, a logo of your own beside them (the maple leaf and the sun disc), and the code that says
// how a page loads the flags and plugs them in.
import { expect, test } from "@playwright/test";
import { at, noSidewaysScroll, open, svg } from "./demo.mjs";

const images = (page) =>
  svg(page).locator("image.ky-logo").evaluateAll((nodes) => nodes.map((n) => decodeURIComponent((n.getAttribute("href") ?? "").slice((n.getAttribute("href") ?? "").indexOf(",") + 1))));

test("the teams are countries drawn with their flags, and a logo of your own is one tap away", async ({ page }) => {
  const errors = await open(page, "?sport=nhl&lang=en&help=off&size=full");
  expect(errors).toEqual([]);
  await expect(page.locator(`${at("away-logo")} button[aria-pressed="true"]`)).toHaveText("Flag");
  await expect(page.locator(`${at("away-name")}`)).toHaveValue("USA");
  // Each flag is Hata's, in its own proportions (a Canadian flag is twice as wide as it is tall).
  const flags = await images(page);
  expect(flags).toHaveLength(2);
  expect(flags[0]).toMatch(/viewBox="0 0 (\d+) (\d+)"/);
  expect(flags[1]).toContain('data-hata="ca"');
  // The home team's own logo, drawn in code: a maple leaf with the word CANADA.
  await page.locator(`${at("home-logo")} button[data-value="emblem"]`).click();
  await expect.poll(async () => (await images(page)).some((doc) => doc.includes("<polygon") && doc.includes(">CANADA<"))).toBe(true);
  // The code says what a page needs: the flag code, Hata loaded first, a lookup plugged in.
  await page.locator(`${at("embed-tabs")} button`).first().click();
  await expect(page.locator(at("embed-code"))).toContainText('"flag": "US"');
  await expect(page.locator(at("embed-code"))).toContainText("useFlags((code, { shape }) => loaded[shape]?.[code.toUpperCase()]);");
  await noSidewaysScroll(page);
});

test("a country without a logo of its own has a roundel of its letters, and the swimmers of the pool are countries too", async ({ page }) => {
  await open(page, "?sport=nhl&lang=en&help=off&size=full&alogo=emblem");
  await expect.poll(async () => (await images(page)).some((doc) => doc.includes(">USA<"))).toBe(true);
  await open(page, "?sport=swimming&lang=en&help=off&poolrace=results");
  const flags = page.locator(`${at("stage")} svg image.ky-logo`);
  await expect(flags).toHaveCount(8);
});

test("the section of round marks is two countries, round flags turned with their names", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  const wide = page.locator(`${at("mark-cards")} figure[data-mark="mark_wide"] svg.kyogijo`);
  await wide.scrollIntoViewIfNeeded();
  expect(await wide.locator("g.ky-banner text.ky-name").allTextContents()).toEqual(["CANADA", "JAPAN"]);
  expect(await wide.locator("image.ky-logo").count()).toBe(2);
});
