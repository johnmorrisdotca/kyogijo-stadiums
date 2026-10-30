// The documentation pages of the demo site (site/docs/): the contents, the pager and the links between pages, the search box over the titles and
// headings, the gallery with its code and copy buttons, the frames and the comparison, in English and Japanese, light and dark, at a phone's
// width and a desk's. Each test opens the built site without a port, as the demo's tests do.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, open, serve } from "./demo.mjs";

/** Open a page of the docs and collect what it complains of. */
async function docs(page, path = "", query = "lang=en&help=off") {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  const [base, hash] = path.split("#");
  await page.goto(`http://kyogijo.test/docs/${base}?${query}${hash ? `#${hash}` : ""}`);
  await page.waitForSelector(at("docs-article"));
  return errors;
}

const isPhone = (page) => page.viewportSize().width < 900;

/** On a phone the contents is shut behind a button; on a desk it is open. Make it open either way. */
async function openContents(page) {
  const nav = page.locator(at("docs-nav"));
  if (!(await nav.isVisible())) await page.locator(at("docs-menu-toggle")).click();
  await expect(nav).toBeVisible();
}

test("the docs open on the overview, with a contents of every page and no complaint, and the contents is shut on a phone and open on a desk", async ({ page }) => {
  const errors = await docs(page);
  expect(errors).toEqual([]);
  expect(await page.title()).toContain("documentation");
  await expect(page.locator("h1").nth(1)).toHaveText("Documentation");
  if (isPhone(page)) {
    await expect(page.locator(at("docs-nav"))).toBeHidden();
    await expect(page.locator(at("docs-menu-toggle"))).toBeVisible();
    await openContents(page);
  } else {
    await expect(page.locator(at("docs-nav"))).toBeVisible();
    await expect(page.locator(at("docs-menu-toggle"))).toBeHidden();
  }
  expect(await page.locator(`${at("docs-nav")} li > a`).count()).toBeGreaterThanOrEqual(30);
  for (const name of ["Getting started", "Soccer", "Coordinate frames", "Gallery: surfaces and scores", "How it compares", "Limits"]) await expect(page.locator(`${at("docs-nav")} a`, { hasText: name }).first()).toBeAttached();
  await noSidewaysScroll(page);
});

test("the contents leads to a page, the page's own headings are listed under it, and the pager goes on and back", async ({ page }) => {
  await docs(page);
  await openContents(page);
  await page.locator(`${at("docs-nav")} a[href="getting-started.html"]`).click();
  await expect(page).toHaveURL(/getting-started\.html/);
  await expect(page.locator(`${at("docs-article")} h1`)).toHaveText("Getting started");
  await openContents(page);
  await expect(page.locator(`${at("docs-nav")} a[aria-current="page"]`)).toHaveText("Getting started");
  await expect(page.locator(`${at("docs-nav")} a[href="#install"]`)).toBeAttached();
  const next = page.locator('.docs-pager a[rel="next"]');
  await next.scrollIntoViewIfNeeded();
  await expect(next).toContainText("Recipes");
  await next.click();
  await expect(page).toHaveURL(/examples\.html/);
  const prev = page.locator('.docs-pager a[rel="prev"]');
  await prev.scrollIntoViewIfNeeded();
  await prev.click();
  await expect(page).toHaveURL(/getting-started\.html/);
});

test("a link in a page goes to the page and the heading it names", async ({ page }) => {
  await docs(page, "soccer.html");
  const link = page.locator(`${at("docs-article")} a[href="frames.html"]`).first();
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await expect(page).toHaveURL(/frames\.html/);
  await expect(page.locator(`${at("docs-article")} h1`)).toHaveText("Coordinate frames");
  await docs(page, "grounds.html#the-world-cups");
  await expect(page.locator("#the-world-cups")).toBeInViewport();
});

test("the search finds a page by its title first and a heading by its words, and follows a result to its heading", async ({ page }) => {
  await docs(page);
  const box = page.locator(at("docs-search"));
  await box.fill("coordinate frames");
  const results = page.locator(`${at("docs-results")} a`);
  await expect(results.first()).toHaveText("Coordinate frames");
  await box.fill("heat");
  expect(await results.count()).toBeGreaterThan(1);
  for (const text of await results.allTextContents()) expect(text.toLowerCase()).toContain("heat");
  await box.press("ArrowDown");
  await expect(results.first()).toHaveAttribute("aria-selected", "true");
  await box.press("ArrowDown");
  await expect(results.nth(1)).toHaveAttribute("aria-selected", "true");
  await box.press("Enter");
  await expect(page).toHaveURL(/\.html#?/);
  await expect(page.locator(at("docs-article"))).toBeVisible();
  const hash = new URL(page.url()).hash.slice(1);
  if (hash !== "") await expect(page.locator(`[id="${hash}"]`)).toBeAttached();
});

test("the search says so when nothing matches, clears on Escape, and the slash key starts it", async ({ page }) => {
  await docs(page);
  const box = page.locator(at("docs-search"));
  await page.locator("h1").nth(1).click();
  await page.keyboard.press("/");
  await expect(box).toBeFocused();
  await box.fill("zzzqqq");
  await expect(page.locator(`${at("docs-results")} .docs-none`)).toContainText("zzzqqq");
  await box.press("Escape");
  await expect(box).toHaveValue("");
  await expect(page.locator(at("docs-results"))).toBeHidden();
});

test("in Japanese the contents and the search are in Japanese, and the page says its body is English", async ({ page }) => {
  await docs(page, "", "lang=ja&help=off");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await openContents(page);
  await expect(page.locator(`${at("docs-nav")} a[href="frames.html"]`)).toHaveText("座標系");
  await expect(page.locator(".docs-english")).toBeVisible();
  const box = page.locator(at("docs-search"));
  await box.fill("座標");
  await expect(page.locator(`${at("docs-results")} a`).first()).toContainText("座標系");
  await page.locator("[data-lang=en]").click();
  await expect(page.locator(`${at("docs-nav")} a[href="frames.html"]`)).toHaveText("Coordinate frames");
  await expect(page.locator(".docs-english")).toBeHidden();
});

/** Stand in for the clipboard, to read what a button copied: through `navigator.clipboard`, or through `execCommand("copy")` when there is none. */
const watchClipboard = (page, how) =>
  page.addInitScript((mode) => {
    window.__copied = null;
    if (mode === "api") Object.defineProperty(navigator, "clipboard", { value: { writeText: async (text) => { window.__copied = text; } }, configurable: true });
    else {
      Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
      document.execCommand = () => { window.__copied = document.activeElement.value; return true; };
    }
  }, how);

for (const how of ["api", "fallback"]) {
  test(`a block of code has a copy button that copies its code (${how}) and says it copied`, async ({ page }) => {
    await watchClipboard(page, how);
    await docs(page, "getting-started.html");
    const button = page.locator(".docs-code .docs-copy").first();
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await expect(button).toHaveText("Copied");
    expect(await page.evaluate(() => window.__copied)).toBe(await page.locator(".docs-code pre").first().evaluate((pre) => pre.textContent.replace(/\n$/, "")));
    expect(await page.evaluate(() => window.__copied)).toContain("npm install @johnmorrisdotca/kyogijo-stadiums");
    await expect(button).toHaveText("Copy");
  });
}

test("the gallery draws every picture with its code and a copy button, and the code is what drew it", async ({ page }) => {
  await watchClipboard(page, "api");
  const errors = await docs(page, "gallery-surfaces.html");
  expect(errors).toEqual([]);
  const items = page.locator(at("gallery-item"));
  expect(await items.count()).toBeGreaterThanOrEqual(30);
  // A picture is drawn when it comes near the screen: scroll to it, and it arrives from its own file.
  for (const [i, item] of (await items.all()).entries()) {
    if (i % 6 !== 0) continue;
    await item.scrollIntoViewIfNeeded();
    await expect(item.locator("svg").first(), `item ${i} has its drawing`).toBeAttached();
    expect(await item.locator("pre").count(), `item ${i} has its code`).toBe(1);
    expect(await item.locator(at("gallery-copy")).count(), `item ${i} has its button`).toBe(1);
  }
  const nfl = page.locator("#bare-nfl");
  await nfl.scrollIntoViewIfNeeded();
  await expect(nfl.locator("svg.kyogijo")).toHaveAttribute("data-sport", "nfl");
  // The code is beside the picture, not behind a button.
  await expect(nfl.locator("pre")).toBeVisible();
  await expect(nfl.locator("pre")).toContainText('drawKyogijo({ sport: "nfl" })');
  await nfl.locator(at("gallery-copy")).click();
  await expect(nfl.locator(".g-status")).toHaveText("Copied to the clipboard.");
  expect(await page.evaluate(() => window.__copied)).toBe('import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";\n\nconst svg = drawKyogijo({ sport: "nfl" });');
  // The picture of a tall rink is tall, and the one of a league is that league's.
  await page.locator("#tall-nhl").scrollIntoViewIfNeeded();
  await expect(page.locator("#tall-nhl svg")).toHaveAttribute("data-orientation", "portrait");
  await noSidewaysScroll(page);
});

test("every other gallery page has its pictures and its code", async ({ page }) => {
  for (const [path, first] of [["gallery-soccer.html", "#pitch-fifa"], ["gallery-leagues.html", "#league-nba-wnba"], ["gallery-years.html", "#year-nhl-1930"], ["gallery-places.html", "#park-fenway-park"], ["gallery-special.html", "#event-winter-classic-2009"], ["gallery-data.html", "#heatmap"]]) {
    const errors = await docs(page, path);
    expect(errors, path).toEqual([]);
    await page.locator(first).scrollIntoViewIfNeeded();
    await expect(page.locator(`${first} svg`).first(), path).toBeAttached();
    await expect(page.locator(`${first} pre`), path).toHaveCount(1);
    expect(await page.locator(at("gallery-item")).count(), path).toBeGreaterThanOrEqual(5);
    await noSidewaysScroll(page);
  }
  // The heat map is drawn: cells in its colours, and a legend.
  await page.goto("http://kyogijo.test/docs/gallery-data.html?lang=en&help=off");
  await page.locator("#heatmap").scrollIntoViewIfNeeded();
  await expect(page.locator("#heatmap svg path").first()).toBeAttached();
  await page.locator("#chart-nba").scrollIntoViewIfNeeded();
  await expect(page.locator("#chart-nba svg")).toBeAttached();
});

test("the layouts page draws grids and grounds, and every item has a download and a page that draws it from the published package", async ({ page }) => {
  const errors = await docs(page, "gallery-layouts.html");
  expect(errors).toEqual([]);
  // Each picture is drawn when it comes near: go to it first.
  await page.locator("#grid-card").scrollIntoViewIfNeeded();
  await expect(page.locator("#grid-card svg.kyogijo-grid")).toHaveAttribute("viewBox", "0 0 1200 675");
  await page.locator("#grid-phone").scrollIntoViewIfNeeded();
  await expect(page.locator("#grid-phone svg.kyogijo-grid")).toHaveAttribute("data-columns", "1");
  await page.locator("#bg-felt").scrollIntoViewIfNeeded();
  await expect(page.locator("#bg-felt svg pattern")).toHaveCount(1);
  await page.locator("#photo-drawing").scrollIntoViewIfNeeded();
  await expect(page.locator("#photo-drawing svg image.ky-bg-img")).toHaveCount(1);
  // A grid's drawings are drawn, each with its own title.
  await page.locator("#grid-card").scrollIntoViewIfNeeded();
  await expect(page.locator("#grid-card svg [role=img]")).toHaveCount(4);
  const item = page.locator("#grid-card");
  await expect(item.locator(at("gallery-download"))).toHaveAttribute("href", "gallery/grid-card.svg");
  await expect(item.locator(at("gallery-download"))).toHaveAttribute("download", "grid-card.svg");
  await expect(page.locator(".g-published").first()).toContainText("only released versions");
  const svg = await page.evaluate(async () => (await window.fetch("gallery/grid-card.svg")).text());
  expect(svg.startsWith("<svg")).toBe(true);
  expect(svg).toContain("Four surfaces");
  await noSidewaysScroll(page);
  // Japanese words on the buttons.
  await page.goto("http://kyogijo.test/docs/gallery-layouts.html?lang=ja&help=off");
  await expect(page.locator("#grid-card").locator(at("gallery-download"))).toHaveText("SVGを保存");
  await expect(page.locator("#grid-card").locator(at("gallery-open"))).toHaveText("ページで開く");
});

test("the page of an item draws it again with the package from jsDelivr, and keeps the build's picture when jsDelivr has none", async ({ page }) => {
  await serve(page);
  // The CDN answers with a module that stands for the published package.
  await page.route("https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo-stadiums@0/layouts/+esm", (route) =>
    route.fulfill({ contentType: "text/javascript", body: `export const drawGrid = () => "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10' data-from='cdn'></svg>";` }),
  );
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto("http://kyogijo.test/docs/gallery/grid-card.html");
  await expect(page.locator("#art svg")).toHaveAttribute("data-from", "cdn");
  await expect(page.locator("#status")).toContainText("published package");
  expect(errors).toEqual([]);
  // An entry the published package does not have: the picture stays and the page says why.
  await page.unroute("https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo-stadiums@0/layouts/+esm");
  await page.route("https://cdn.jsdelivr.net/**", (route) => route.fulfill({ status: 404, body: "" }));
  await page.goto("http://kyogijo.test/docs/gallery/grid-card.html");
  await expect(page.locator("#status")).toContainText("could not draw this");
  await expect(page.locator("#art svg.kyogijo-grid")).toHaveAttribute("viewBox", "0 0 1200 675");
});

test("the frames page has a row for each frame and a drawing of the same spot in each, with a link to the demo's converter", async ({ page }) => {
  await docs(page, "frames.html");
  expect(await page.locator(`${at("docs-article")} .docs-table tbody tr`).first().count()).toBe(1);
  await expect(page.locator(`${at("docs-article")} .docs-table`).first().locator("tbody tr")).toHaveCount(48);
  await expect(page.locator(`${at("frames-gallery")} figure`)).toHaveCount(48);
  const header = await page.locator(`${at("docs-article")} .docs-table`).first().locator("th").allTextContents();
  for (const column of ["Frame", "Unit", "Range of x and y", "Origin", "y grows", "Size", "Source"]) expect(header).toContain(column);
  await expect(page.locator(`${at("docs-article")} a[href="../#providers"]`)).toBeAttached();
  await noSidewaysScroll(page);
});

test("the comparison has its table of projects and rows, wide inside its own scroll, with a link to each project", async ({ page }) => {
  await docs(page, "compare.html");
  const table = page.locator(`${at("docs-article")} .docs-table`).first();
  expect(await table.locator("thead th").count()).toBe(11);
  expect(await table.locator("tbody tr").count()).toBeGreaterThanOrEqual(16);
  for (const project of ["sportypy", "sportyR", "hockey_rink", "mplsoccer", "ggsoccer", "GeomMLBStadiums", "thestadi.com"]) await expect(table.locator("thead a", { hasText: project })).toBeAttached();
  await expect(table.locator("tbody tr", { hasText: "Animation" }).locator("td").nth(1)).toContainText("a replay of tracking data");
  const scrolls = await table.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(scrolls).toBe(true);
  await noSidewaysScroll(page);
});

test("the pages are light or dark with the device", async ({ page }) => {
  const shade = () => page.evaluate(() => { const [r, g, b] = getComputedStyle(document.body).backgroundColor.match(/\d+/g).map(Number); return r + g + b; });
  await page.emulateMedia({ colorScheme: "light" });
  await docs(page, "gallery-surfaces.html");
  expect(await shade()).toBeGreaterThan(600);
  await page.emulateMedia({ colorScheme: "dark" });
  expect(await shade()).toBeLessThan(200);
  await page.locator("#bare-nhl").scrollIntoViewIfNeeded();
  const drawing = page.locator("#bare-nhl svg.kyogijo");
  await expect(drawing).toBeAttached();
  // The drawing is in the page, under the page's stylesheet, so it follows the device too: its ink is the dark set's.
  expect(await drawing.evaluate((el) => getComputedStyle(el).getPropertyValue("--ky-ink").trim())).toBe("#ece8dc");
});

test("the demo and the API reference link to the docs", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  await expect(page.locator('header a[href="docs/"]')).toHaveText("Docs");
  await serve(page);
  await page.goto("http://kyogijo.test/api.html?lang=en&help=off");
  await expect(page.locator('header a[href="docs/"]')).toHaveText("Docs");
  await page.locator('header a[href="docs/"]').click();
  await expect(page).toHaveURL(/\/docs\/$/);
  await expect(page.locator(at("docs-article"))).toBeVisible();
});

test("the home page leads with a tile for each sport and each place, by task and by sport, and the pictures of the places are real pictures", async ({ page }) => {
  const errors = await docs(page);
  expect(errors).toEqual([]);
  expect(await page.locator(at("sport-tile")).count()).toBeGreaterThanOrEqual(13);
  expect(await page.locator(at("place-tile")).count()).toBeGreaterThanOrEqual(10);
  for (const name of ["New York", "Montreal", "The Saddledome", "The roof switch", "Quality levels"]) await expect(page.locator(`${at("place-tile")} h3`, { hasText: name })).toBeAttached();
  // A picture of a place is a file that loads, not a link to a page.
  const tile = page.locator(at("place-tile")).first();
  await tile.scrollIntoViewIfNeeded();
  await expect.poll(() => tile.locator("img").first().evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  // A sport's picture is drawn from the gallery's file when the tile comes near.
  const sport = page.locator(at("sport-tile")).first();
  await sport.scrollIntoViewIfNeeded();
  await expect(sport.locator("svg.kyogijo")).toBeAttached();
  await noSidewaysScroll(page);
});

test("the contents has two views, by task and by sport, and the choice is kept", async ({ page }) => {
  await docs(page, "soccer.html");
  await openContents(page);
  await expect(page.locator(`${at("docs-nav")} [data-view="task"][role=tabpanel]`)).toBeVisible();
  await page.locator('.docs-views [data-view="sport"]').click();
  await expect(page.locator(`${at("docs-nav")} [data-view="sport"][role=tabpanel]`)).toBeVisible();
  await expect(page.locator(`${at("docs-nav")} [data-view="task"][role=tabpanel]`)).toBeHidden();
  // Each sport leads to its guide and its pictures; the one being read is open.
  for (const name of ["Hockey", "Basketball", "Baseball", "Football", "Soccer", "Curling", "Budō"]) await expect(page.locator(`${at("docs-nav")} [data-view="sport"] summary`, { hasText: name })).toBeAttached();
  await expect(page.locator(`${at("docs-nav")} [data-view="sport"] details[open] a[data-current]`).first()).toHaveText("Soccer");
  await page.reload();
  await openContents(page);
  await expect(page.locator(`${at("docs-nav")} [data-view="sport"][role=tabpanel]`)).toBeVisible();
});

test("the gallery's index shows live pictures for every group, draws only those near the screen, and filters by name", async ({ page }) => {
  const errors = await docs(page, "gallery.html");
  expect(errors).toEqual([]);
  const tiles = page.locator(at("gallery-tile"));
  expect(await tiles.count()).toBeGreaterThanOrEqual(100);
  // Not every drawing at once: at the top of the page only the ones near it are drawn.
  await page.locator("#venues").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const drawn = await page.locator(`${at("gallery-tile")} svg.kyogijo`).count();
  expect(drawn).toBeGreaterThan(0);
  expect(drawn).toBeLessThan(40);
  // The filter narrows the tiles by their words, and says how many are shown.
  await page.locator(at("gallery-filter")).fill("saddledome");
  await expect(page.locator(`${at("gallery-tile")}:not([hidden])`).first()).toBeVisible();
  const shown = await page.locator(`${at("gallery-tile")}:not([hidden])`).count();
  expect(shown).toBeGreaterThan(0);
  expect(shown).toBeLessThan(10);
  await page.locator(at("gallery-filter")).fill("zzzqqq");
  await expect(page.locator("#g-none")).toBeVisible();
  await page.locator(at("gallery-filter")).fill("");
  // A tile copies the code that drew it.
  await page.evaluate(() => { window.__copied = null; Object.defineProperty(navigator, "clipboard", { value: { writeText: async (text) => { window.__copied = text; } }, configurable: true }); });
  const first = page.locator(`${at("gallery-tile")} ${at("tile-copy")}`).first();
  await first.scrollIntoViewIfNeeded();
  await first.click();
  expect(await page.evaluate(() => window.__copied)).toContain("drawKyogijo");
  await noSidewaysScroll(page);
});

test("a picture in a page of the docs is a file that loads, light and dark", async ({ page }) => {
  for (const scheme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: scheme });
    await docs(page, "district.html");
    const img = page.locator(`${at("docs-article")} img`).first();
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
    const src = await img.evaluate((el) => el.currentSrc);
    expect(src).toContain(scheme === "dark" ? "-dark." : "-light.");
  }
});

test("every control of the docs is at least 48 px to the touch, and none is left in the browser's own style", async ({ page }) => {
  for (const path of ["index.html", "gallery.html", "gallery-venues.html", "soccer.html"]) {
    await docs(page, path);
    await openContents(page);
    await page.locator("details.docs-group").evaluateAll((all) => all.forEach((d) => { d.open = true; }));
    const small = await page.evaluate(() => {
      const found = [];
      for (const el of document.querySelectorAll("button, input, select, summary, .docs-article a.hub-main, .g-links a, .hub-links a, .docs-pager a, .g-chips a")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0 || getComputedStyle(el).visibility === "hidden") continue;
        if (r.height < 47.5 && !el.closest("[hidden]")) found.push(`${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""} ${el.textContent.trim().slice(0, 24)} ${Math.round(r.height)}`);
      }
      return found;
    });
    expect(small, path).toEqual([]);
  }
});
