// The first paint: the page is whole before its script runs (the drawing and every word are in the HTML), and it does not
// jump when the script takes over (layout shift, as the browser measures it).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

import { at, serve } from "./demo.mjs";

const site = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };
// The URL the owner saw jump (Chrome, dark mode), and the page as it opens with nothing asked.
const JOHN = "?sport=nba&league=gleague&place=mazda-stadium-hiroshima";

/**
 * Serve `site/` slowly, as a network does: the page and its stylesheets at once, every script after a pause, so that the
 * browser paints what the HTML holds before the script can change anything.
 */
async function serveSlowly(page, delay = 400) {
  await page.route("http://kyogijo.test/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    const file = join(site, pathname.endsWith("/") ? `${pathname}index.html` : pathname);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
    const type = TYPES[file.slice(file.lastIndexOf("."))] ?? "application/octet-stream";
    if (type === "text/javascript") await new Promise((done) => setTimeout(done, delay));
    return route.fulfill({ body: readFileSync(file), contentType: type });
  });
}

/** Add up the layout shifts of the page from its first byte, as the browser reports them (a shift that follows the reader's own input does not count). */
async function watchShifts(page) {
  await page.addInitScript(() => {
    window.__shift = 0;
    window.__shifts = [];
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput) continue;
          window.__shift += entry.value;
          window.__shifts.push({ value: entry.value, at: Math.round(entry.startTime), sources: entry.sources.map((s) => `${s.node?.nodeName}#${s.node?.id ?? ""}.${s.node?.className?.baseVal ?? s.node?.className ?? ""}`) });
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      window.__shift = null;
    }
  });
}

for (const [name, query] of [["by default", ""], ["at the address the owner used", JOHN]]) {
  test(`does not jump when the script takes over, ${name}`, async ({ page, browserName }, testInfo) => {
    test.skip(browserName !== "chromium", "only Chromium reports layout shifts");
    await page.emulateMedia({ colorScheme: "dark" });
    await watchShifts(page);
    await serveSlowly(page);
    await page.goto(`http://kyogijo.test/${query}`);
    await page.waitForSelector(`${at("stage")}[data-ready="true"] svg.kyogijo`);
    // The map, the examples and the rest come in after the first view; give them time to land.
    await page.waitForFunction(() => document.querySelectorAll("#atlas-list li").length > 0, null, { timeout: 15000 });
    await page.waitForTimeout(1500);
    const [total, shifts] = await page.evaluate(() => [window.__shift, window.__shifts]);
    testInfo.annotations.push({ type: "cls", description: `${total}` });
    console.log(`${testInfo.project.name} ${name}: CLS ${total?.toFixed(4)} ${JSON.stringify(shifts)}`);
    expect(total).toBeLessThan(0.05);
  });
}

for (const path of ["docs/", "docs/getting-started.html", "docs/gallery-fields.html", "api.html"]) {
  test(`${path} does not jump when its script runs`, async ({ page, browserName }, testInfo) => {
    test.skip(browserName !== "chromium", "only Chromium reports layout shifts");
    await page.emulateMedia({ colorScheme: "dark" });
    await watchShifts(page);
    await serveSlowly(page, 250);
    await page.goto(`http://kyogijo.test/${path}`);
    await page.waitForLoadState("load");
    await page.waitForTimeout(1500);
    const [total, shifts] = await page.evaluate(() => [window.__shift, window.__shifts]);
    console.log(`${testInfo.project.name} ${path}: CLS ${total?.toFixed(4)} ${JSON.stringify(shifts)}`);
    expect(total).toBeLessThan(0.05);
  });
}

// ----- Before the script runs, the page is whole: the drawing is in it, and so is every word.

test.describe("with JavaScript off", () => {
  test.use({ javaScriptEnabled: false });

  test("the demo has its drawing, its words and its controls", async ({ page }) => {
    await serve(page);
    await page.goto("http://kyogijo.test/");
    // The drawing: the rink, with both teams and the score, in a box that has not collapsed.
    const drawing = page.locator(`${at("stage")} svg.kyogijo`);
    await expect(drawing).toHaveAttribute("data-sport", "nhl");
    expect(await drawing.locator("title").textContent()).toContain("Northern Owls 3, Lakeshore Anchors 2");
    expect(await page.locator(`${at("stage")} svg *`).count()).toBeGreaterThan(40);
    const box = await page.locator(at("stage")).boundingBox();
    expect(box.height).toBeGreaterThan(150);
    expect(box.width).toBeGreaterThan(200);
    const drawn = await drawing.boundingBox();
    expect(Math.abs(drawn.height - box.height)).toBeLessThanOrEqual(1);
    // The words: nothing the page says is left to its script.
    const empty = await page.evaluate(() => [...document.querySelectorAll("[data-say]")].filter((el) => el.textContent.trim() === "").map((el) => el.dataset.say));
    expect(empty).toEqual([]);
    const unlabelled = await page.evaluate(() => [...document.querySelectorAll("[data-say-label]")].filter((el) => !el.getAttribute("aria-label")).map((el) => el.id || el.dataset.sayLabel));
    expect(unlabelled).toEqual([]);
    await expect(page.locator("h1")).toContainText("Kyogijo");
    await expect(page.locator("#try-title")).toHaveText("Try it");
    await expect(page.locator("details.group > summary").first()).toHaveText("Surface");
    await expect(page.locator("footer")).toContainText("Every dimension is from a rulebook");
    // The controls: every choice has its buttons, the one that is on is pressed, and the fields hold their values.
    await expect(page.locator(`${at("sport")} button`)).toHaveCount(24);
    await expect(page.locator(`${at("sport")} button[aria-pressed="true"]`)).toHaveText("NHL");
    await expect(page.locator(`${at("orientation")} button[aria-pressed="true"]`)).toHaveText("Fit the box");
    await expect(page.locator(`${at("size")} button[aria-pressed="true"]`)).toHaveText("On the surface");
    await expect(page.locator(at("away-name"))).toHaveValue("Northern Owls");
    await expect(page.locator(at("home-score"))).toHaveValue("2");
    await expect(page.locator(at("away-color"))).toHaveValue("#3a2d6b");
    await expect(page.locator(`${at("status")} button[aria-pressed="true"]`)).toHaveText("Final/OT");
    await expect(page.locator(at("stripes"))).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(at("stripes"))).toHaveText("Mown stripes");
    // The rows that belong to other sports are not shown.
    await expect(page.locator("#park-row")).toBeHidden();
    await expect(page.locator("#court-group")).toBeHidden();
    await expect(page.locator("#soccer-group")).toBeHidden();
    await expect(page.locator("#era-group")).toBeVisible();
    // Every section has its heading and its line, though the examples under them are drawn by the script.
    for (const section of ["atlas", "embed", "gallery", "badges", "replay", "elements"]) await expect(page.locator(`#${section} h2`)).not.toBeEmpty();
  });

  test("the parks and the grounds have their filters, their count and their first cards", async ({ page }) => {
    await serve(page);
    await page.goto("http://kyogijo.test/");
    // The default views, drawn into the page: the MLB parks in use today and the grounds of the World Cup finals.
    await expect(page.locator("#parks-body .park")).toHaveCount(30);
    await expect(page.locator("#grounds-body .park")).toHaveCount(28);
    // The cards a desk shows are drawn in the page; the rest are boxes with their names, which the script draws when the grid comes near the screen.
    expect(await page.locator("#parks-body .park svg.kyogijo").count()).toBe(16);
    expect(await page.locator("#grounds-body .park svg.kyogijo").count()).toBe(16);
    expect(await page.locator("#parks-body .park .pf-img[data-late]").count()).toBe(14);
    expect(await page.locator("#grounds-body .park .pf-img[data-late]").count()).toBe(12);
    await expect(page.locator(at("parks-count"))).toHaveText("30 of 94 parks");
    await expect(page.locator(at("grounds-count"))).toHaveText("28 of 64 grounds");
    await expect(page.locator(`${at("parks-league")} button[aria-pressed="true"]`)).toHaveText("MLB");
    await expect(page.locator(`${at("parks-status")} button[aria-pressed="true"]`)).toHaveText("Today");
    await expect(page.locator(`${at("grounds-group")} button[aria-pressed="true"]`)).toHaveText("Finals");
    await expect(page.locator(at("parks-search"))).toHaveAttribute("placeholder", "Name, nickname, city or team");
    await expect(page.locator(at("parks-more"))).toHaveText("Show all 30 parks");
    await expect(page.locator(at("grounds-more"))).toHaveText("Show all 28 grounds");
    await expect(page.locator('[data-field="era"]')).toBeHidden();
    await expect(page.locator(at("parks-reset"))).toBeHidden();
    await expect(page.locator(at("grounds-country"))).toHaveValue("all");
    expect(await page.locator(`${at("grounds-country")} option`).count()).toBe(24);
    // A section's own words and no empty ones.
    await expect(page.locator("#parks h2")).toHaveText("Ballparks");
    await expect(page.locator("#grounds h2")).toHaveText("Soccer grounds");
    // The page is short already: the rest of the cards are shut away by the stylesheet, not by the script.
    const shut = await page.locator("#parks-body .park").evaluateAll((all) => all.filter((el) => getComputedStyle(el).display === "none").length);
    expect(shut === 0 || shut === 14 || shut === 22).toBe(true);
    expect((await page.locator("#parks").boundingBox()).height).toBeLessThan(page.viewportSize().width < 560 ? 700 : 760);
  });

  test("the sports and the pitches have their chips, their count and their first cards", async ({ page }) => {
    await serve(page);
    await page.goto("http://kyogijo.test/");
    // Every card is in the page, with its name; the six a desk shows first are drawn, and each of the others is a box of the same size.
    await expect(page.locator("#gallery-body figure.card")).toHaveCount(24);
    await expect(page.locator("#pitches-body figure.card")).toHaveCount(16);
    expect(await page.locator("#gallery-body figure svg.kyogijo").count()).toBe(6);
    expect(await page.locator("#pitches-body figure svg.kyogijo").count()).toBe(6);
    expect(await page.locator("#gallery-body figure .pf-img[data-late]").count()).toBe(18);
    expect(await page.locator("#pitches-body figure .pf-img[data-late]").count()).toBe(10);
    const boxes = await page.locator("#gallery-body figure .card-stage").evaluateAll((all) => new Set(all.filter((el) => el.getClientRects().length > 0).map((el) => `${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`)).size);
    expect(boxes).toBe(1);
    await expect(page.locator(at("gallery-count"))).toHaveText("24 of 24 sports");
    await expect(page.locator(at("pitches-count"))).toHaveText("16 of 16 pitches");
    await expect(page.locator(`${at("gallery-family")} button`)).toHaveCount(10);
    await expect(page.locator(`${at("gallery-family")} button[aria-pressed="true"]`)).toHaveText("All");
    await expect(page.locator(`${at("pitches-group")} button`)).toHaveCount(7);
    await expect(page.locator(at("gallery-more"))).toHaveText("Show all 24 sports");
    await expect(page.locator(at("pitches-more"))).toHaveText("Show all 16 pitches");
    await expect(page.locator(at("gallery-reset"))).toBeHidden();
    await expect(page.locator("#gallery h2")).toHaveText("Every sport");
    await expect(page.locator("#pitches h2")).toHaveText("The soccer pitch");
    // The page is short already: the stylesheet shuts the rest of the cards away, not the script (a phone's row scrolls sideways, so shuts none).
    const shut = (id) => page.locator(`#${id}-body figure.card`).evaluateAll((all) => all.filter((el) => getComputedStyle(el).display === "none").length);
    const phone = page.viewportSize().width < 560;
    expect([await shut("gallery"), await shut("pitches")]).toEqual(phone ? [0, 0] : [18, 10]);
    for (const id of ["gallery", "pitches"]) expect((await page.locator(`#${id}`).boundingBox()).height).toBeLessThan(phone ? 700 : 900);
  });

  for (const path of ["docs/", "docs/getting-started.html", "docs/gallery-fields.html", "api.html"]) {
    test(`${path} has its header, its words and its footer`, async ({ page }) => {
      await serve(page);
      await page.goto(`http://kyogijo.test/${path}`);
      const empty = await page.evaluate(() => [...document.querySelectorAll("[data-say]")].filter((el) => el.textContent.trim() === "" && el.dataset.say !== "name").map((el) => el.dataset.say));
      expect(empty).toEqual([]);
      await expect(page.locator("header .intro p").first()).not.toBeEmpty();
      await expect(page.locator("header nav a").first()).not.toBeEmpty();
      await expect(page.locator("footer")).toContainText("Made from the package's own");
      await expect(page.locator("main h1, main h2").first()).not.toBeEmpty();
      if (path.includes("gallery-")) expect(await page.locator("main svg.kyogijo").count()).toBeGreaterThan(5);
    });
  }
});

// ----- When the script runs it takes the page over, and moves nothing.

for (const [name, query] of [["by default", ""], ["at the address the owner used", JOHN]]) {
  test(`keeps the stage's box and the drawing in it, ${name}`, async ({ page }) => {
    await serveSlowly(page, 700);
    await page.goto(`http://kyogijo.test/${query}`, { waitUntil: "commit" });
    await page.waitForSelector("#atlas", { state: "attached" });
    expect(await page.locator(at("stage")).getAttribute("data-ready")).toBe("false");
    const before = await page.locator(at("stage")).boundingBox();
    const hadDrawing = await page.evaluate(() => {
      const svg = document.querySelector("#stage svg");
      if (svg === null || getComputedStyle(svg).visibility === "hidden") return false;
      svg.firstDrawing = true;
      return true;
    });
    await page.waitForSelector(`${at("stage")}[data-ready="true"] svg.kyogijo`);
    const after = await page.locator(at("stage")).boundingBox();
    // The box is the one the script's drawing fills: not a pixel taller or shorter, wherever the page was opened.
    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
    // The default drawing is the very one in the page; another is made by the script, and the wrong one was never shown.
    expect(hadDrawing).toBe(query === "");
    expect(await page.evaluate(() => document.querySelector("#stage svg").firstDrawing === true)).toBe(query === "");
    await expect(page.locator(at("stage"))).not.toHaveAttribute("data-pending", "");
  });
}

// The sports, the pitches, the parks and the grounds: the script takes over the cards that are in the page, draws the ones that were boxes, and moves
// nothing. The rest of the page is put aside (the sections above them are drawn by the script, so with the reader down at the Ballparks they would push
// them about and hide whether the sections themselves moved), and the four sections sit at the top of the screen where a shift is one the browser counts.
const SECTIONS = ["gallery", "pitches", "parks", "grounds"];
async function onlyThePlaces(page, delay) {
  await serveSlowly(page, delay);
  await page.goto("http://kyogijo.test/", { waitUntil: "commit" });
  await page.waitForSelector("#grounds-body .park", { state: "attached" });
  await page.addStyleTag({ content: `main > :not(${SECTIONS.map((id) => `#${id}`).join("):not(")}) { display: none !important; }` });
  // Putting the rest aside moved the two sections itself: count from here.
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => { window.__shift = 0; window.__shifts = []; done(); }))));
}

test("the sports, pitches, parks and grounds keep their box and their cards when the script takes over", async ({ page }) => {
  await onlyThePlaces(page, 700);
  expect(await page.locator("#parks-body").getAttribute("data-ready")).toBeNull();
  const boxes = async () => {
    const all = await Promise.all(SECTIONS.map((id) => page.locator(`#${id}`).boundingBox()));
    return { heights: all.map((box) => Math.round(box.height)), gaps: all.map((box) => Math.round(box.y - all[0].y)) };
  };
  const before = await boxes();
  const grids = ["gallery-cards", "pitch-cards", "park-grid", "ground-grid"];
  await page.evaluate((ids) => { for (const id of ids) document.getElementById(id).firstElementChild.firstDrawing = true; }, grids);
  for (const id of SECTIONS) await page.waitForSelector(`#${id}-body[data-ready="true"]`);
  expect(await boxes()).toEqual(before);
  // The cards are the ones that were in the page, not drawn again; and the script has taken them over.
  expect(await page.evaluate((ids) => ids.map((id) => document.getElementById(id).firstElementChild.firstDrawing === true), grids)).toEqual([true, true, true, true]);
  // The cards that were boxes are drawn when their grid comes within a screen of the window, in the boxes they had: the lower ones wait for the reader to come down.
  for (const id of ["pitch-cards", "park-grid", "ground-grid"]) await page.locator(at(id)).scrollIntoViewIfNeeded();
  await expect(page.locator("#gallery-body figure svg.kyogijo")).toHaveCount(24);
  await expect(page.locator("#pitches-body figure svg.kyogijo")).toHaveCount(16);
  await expect(page.locator("#parks-body .park svg.kyogijo")).toHaveCount(30);
  await expect(page.locator("#grounds-body .park svg.kyogijo")).toHaveCount(28);
  expect(await page.locator("[data-late]").count()).toBe(0);
  expect(await boxes()).toEqual(before);
  await page.locator(at("parks-more")).click();
  await expect(page.locator(at("parks-more"))).toHaveText("Show fewer");
});

test("the sports, pitches, parks and grounds do not jump when the script runs", async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== "chromium", "only Chromium reports layout shifts");
  await page.emulateMedia({ colorScheme: "dark" });
  await watchShifts(page);
  await onlyThePlaces(page, 700);
  await page.waitForSelector('#grounds-body[data-ready="true"]');
  await page.waitForTimeout(1200);
  const [total, shifts] = await page.evaluate(() => [window.__shift, window.__shifts]);
  console.log(`${testInfo.project.name} sports, pitches, parks and grounds: CLS ${total?.toFixed(4)} ${JSON.stringify(shifts)}`);
  expect(total).toBeLessThan(0.01);
});

// ----- A reader of Japanese is not shown English first.

for (const [name, setup, query] of [
  ["asked for in the address", () => {}, "?lang=ja"],
  ["kept on the device", () => window.localStorage.setItem("kyogijo-stadiums.page.lang", "ja"), ""],
]) {
  test(`a page in Japanese is held back, then shown in Japanese, with no jump: ${name}`, async ({ page, browserName }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    if (browserName === "chromium") await watchShifts(page);
    await page.addInitScript(setup);
    await serveSlowly(page, 500);
    await page.goto(`http://kyogijo.test/${query}`, { waitUntil: "commit" });
    await page.waitForSelector("#atlas", { state: "attached" });
    // The language is known before anything is drawn, and the English the page is written in is not shown.
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    expect(await page.evaluate(() => getComputedStyle(document.body).visibility)).toBe("hidden");
    await page.waitForSelector(`${at("stage")}[data-ready="true"] svg.kyogijo`);
    expect(await page.evaluate(() => getComputedStyle(document.body).visibility)).toBe("visible");
    await expect(page.locator("html")).not.toHaveAttribute("data-first", /./);
    await expect(page.locator("#try-title")).toHaveText("試してみる");
    if (browserName === "chromium") {
      await page.waitForTimeout(800);
      expect(await page.evaluate(() => window.__shift)).toBeLessThan(0.05);
    }
  });
}

test("a page whose script never comes is shown after three seconds, in English", async ({ page }) => {
  await serve(page);
  await page.route("**/demo.js", (route) => route.abort());
  await page.goto("http://kyogijo.test/?lang=ja");
  expect(await page.evaluate(() => getComputedStyle(document.body).visibility)).toBe("hidden");
  await page.waitForFunction(() => getComputedStyle(document.body).visibility === "visible", null, { timeout: 6000 });
  await expect(page.locator("#try-title")).toHaveText("Try it");
});
