// The four ways in: the snippets the page writes, the custom element it shows, and the frame.
import { expect, test } from "@playwright/test";

import { at, open, serve, svg } from "./demo.mjs";

test("the snippet for each way in says what is on the stage", async ({ page }) => {
  await open(page, "?sport=nhl&lang=en&help=off");
  const code = () => page.locator(at("embed-code")).textContent();
  await page.locator('#embed-tabs button[data-tab="module"]').click();
  expect(await code()).toContain('import { drawKyogijo, useFlags } from "https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo-stadiums@0/+esm"');
  // The teams are countries drawn by their flag codes, which a page needs Hata for: the snippet loads the flags first and plugs a lookup in.
  expect(await code()).toContain('"flag": "US"');
  expect(await code()).toContain('import { flag } from "@johnmorrisdotca/hata/load";');
  expect(await code()).toContain("useFlags((code, { shape }) => loaded[shape]?.[code.toUpperCase()]);");
  expect(await code()).toContain('"sport": "nhl"');
  await page.locator('#embed-tabs button[data-tab="element"]').click();
  expect(await code()).toContain("<kyogijo-field");
  expect(await code()).toContain('home="Canada"');
  expect(await code()).toContain('home-flag="CA"');
  expect(await code()).toContain("element-define.js");
  await page.locator('#embed-tabs button[data-tab="iframe"]').click();
  expect(await code()).toMatch(/src="https:\/\/johnmorrisdotca\.github\.io\/kyogijo-stadiums\/embed\.html\?sport=nhl/);
  expect(await code()).toContain("aspect-ratio");
  await page.locator('#embed-tabs button[data-tab="svg"]').click();
  expect((await code()).startsWith("<svg")).toBe(true);
  await expect(page.locator(at("embed-download"))).toBeVisible();
});

test("the snippet follows the controls, and copying says so", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
  await open(page, "?sport=nba&lang=en&help=off");
  await page.locator('#embed-tabs button[data-tab="element"]').click();
  await page.locator(at("home-name")).fill("Hoop Dreams");
  expect(await page.locator(at("embed-code")).textContent()).toContain('home="Hoop Dreams"');
  await page.locator(at("embed-copy")).click();
  await expect(page.locator("#embed-status")).not.toHaveText("");
});

test("the element in the page draws in a shadow root, with named parts, and follows its attributes", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  const nhl = page.locator(at("element-nhl"));
  await nhl.scrollIntoViewIfNeeded();
  const svgIn = nhl.locator("svg.kyogijo");
  await expect(svgIn).toHaveAttribute("part", "svg");
  expect(await nhl.locator(".ky-plate").getAttribute("part")).toBe("plate");
  expect(await nhl.locator("title").textContent()).toContain("USA 3, Canada 2");
  await nhl.evaluate((el) => el.setAttribute("away-score", "9"));
  expect(await nhl.locator("title").textContent()).toContain("USA 9");
  expect(await nhl.locator(".ky-score").allTextContents()).toEqual(["9", "2"]);
  const nba = page.locator(at("element-nba"));
  expect(await nba.locator("svg.kyogijo").getAttribute("data-size")).toBe("compact");
  expect(await nba.locator(".ky-score").allTextContents()).toEqual(["108", "112"]);
  const badge = page.locator(at("element-mlb"));
  expect(await badge.locator("svg.kyogijo").getAttribute("viewBox")).toBe("0 0 440 64");
});

test("the element's drawing follows the page's theme", async ({ page }) => {
  await open(page, "?lang=en&help=off&theme=light");
  const nhl = page.locator(at("element-nhl"));
  await nhl.scrollIntoViewIfNeeded();
  const fill = () => nhl.locator(".ky-surface").first().evaluate((el) => getComputedStyle(el).fill);
  const light = await fill();
  await page.locator(`${at("theme")} button[data-value="dark"]`).click();
  await expect.poll(fill).not.toBe(light);
});

test("the frame draws what its address says, and fits its box", async ({ page }) => {
  await serve(page);
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("http://kyogijo.test/embed.html?sport=nhl&away=USA&aflag=US&home=Canada&hflag=CA&ascore=3&hscore=2&acolor=1c3f7a&hcolor=d52b1e&status=final-ot&competition=Cup+Final%2C+Game+7");
  await page.waitForSelector('#frame[data-ready="true"] svg.kyogijo');
  expect(await page.locator("svg title").textContent()).toBe("USA 3, Canada 2, Final/OT");
  // The frame plugs Hata's flags in, so each flag code in the address is a picture on its side.
  expect(await page.locator("svg image.ky-logo").count()).toBe(2);
  expect(await page.locator("svg style").count()).toBe(1);
  const size = page.viewportSize();
  const box = await page.locator("svg.kyogijo").boundingBox();
  expect(box.width).toBeLessThanOrEqual(size.width + 1);
  expect(box.height).toBeLessThanOrEqual(size.height + 1);
  expect(errors).toEqual([]);
});

test("the frame turns tall in a tall box, and keeps hostile addresses as text", async ({ page }) => {
  await serve(page);
  await page.setViewportSize({ width: 300, height: 600 });
  await page.goto("http://kyogijo.test/embed.html?sport=nfl&away=%3Cscript%3Ealert(1)%3C/script%3E&home=B&acolor=red%3Bfill%3Aurl(x)&alogo=javascript%3Aalert(1)");
  await page.waitForSelector('#frame[data-ready="true"] svg.kyogijo');
  await expect(page.locator("#frame")).toHaveAttribute("data-orientation", "portrait");
  expect(await page.locator("script:not([type])").count()).toBe(0);
  expect(await page.locator("#frame svg script").count()).toBe(0);
  expect(await page.locator("#frame svg image").count()).toBe(0);
  expect(await page.locator("svg.kyogijo").getAttribute("style") ?? "").not.toContain("url(");
});

test("the container helper lays a tall box out tall and a wide box wide, and draws again on resize", async ({ page }) => {
  await open(page, "?lang=en&help=off&sport=nhl&orientation=auto");
  const stage = page.locator(at("stage"));
  const wide = page.viewportSize().width >= 700;
  await expect(stage).toHaveAttribute("data-orientation", wide ? "landscape" : "portrait");
  await expect(svg(page)).toHaveAttribute("data-orientation", wide ? "landscape" : "portrait");
});
