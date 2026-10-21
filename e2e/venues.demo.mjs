// The venues page: the arenas of the NHL, by conference and division, each in the outline of its building, in 2D and in 3D, in a real browser: the arrow that says where north is only where the rink's orientation is known, the facts
// listed under the picture, the roof and walls on request in 3D, English and Japanese, nothing sent anywhere and nothing wider than the screen.
import { expect, test } from "@playwright/test";

import { noSidewaysScroll, serve } from "./demo.mjs";

const STAGE = '[data-testid="stage"]';
/** The divisions drawn, with their arenas: a division's tabs are its arenas, in the order of the data. */
const DIVISIONS = {
  pacific: { ids: ["honda-center", "scotiabank-saddledome", "rogers-place", "crypto-com-arena", "sap-center", "climate-pledge-arena", "rogers-arena", "t-mobile-arena"], names: ["Honda Center", "Scotiabank Saddledome", "Rogers Place", "Crypto.com Arena", "SAP Center", "Climate Pledge Arena", "Rogers Arena", "T-Mobile Arena"] },
  central: { ids: ["united-center", "ball-arena", "american-airlines-center", "grand-casino-arena", "bridgestone-arena", "enterprise-center", "delta-center", "canada-life-centre"], names: ["United Center", "Ball Arena", "American Airlines Center", "Grand Casino Arena", "Bridgestone Arena", "Enterprise Center", "Delta Center", "Canada Life Centre"] },
  atlantic: { ids: ["td-garden", "keybank-center", "little-caesars-arena", "amerant-bank-arena", "bell-centre", "canadian-tire-centre", "benchmark-international-arena", "scotiabank-arena"], names: ["TD Garden", "KeyBank Center", "Little Caesars Arena", "Amerant Bank Arena", "Bell Centre", "Canadian Tire Centre", "Benchmark International Arena", "Scotiabank Arena"] },
  metropolitan: { ids: ["lenovo-center", "nationwide-arena", "prudential-center", "ubs-arena", "madison-square-garden", "xfinity-mobile-arena", "ppg-paints-arena", "capital-one-arena"], names: ["Lenovo Center", "Nationwide Arena", "Prudential Center", "UBS Arena", "Madison Square Garden", "Xfinity Mobile Arena", "PPG Paints Arena", "Capital One Arena"] },
};
/** Whether the rink's orientation is known for each (an arrow marks north in the drawing). */
const ARROW = {
  "honda-center": true, "scotiabank-saddledome": false, "rogers-place": true, "crypto-com-arena": false, "sap-center": false, "climate-pledge-arena": true, "rogers-arena": true, "t-mobile-arena": true,
  "united-center": true, "ball-arena": false, "american-airlines-center": true, "grand-casino-arena": true, "bridgestone-arena": true, "enterprise-center": true, "delta-center": true, "canada-life-centre": true,
  "td-garden": true, "keybank-center": true, "little-caesars-arena": true, "amerant-bank-arena": false, "bell-centre": true, "canadian-tire-centre": false, "benchmark-international-arena": false, "scotiabank-arena": false,
  "lenovo-center": false, "nationwide-arena": true, "prudential-center": true, "ubs-arena": true, "madison-square-garden": false, "xfinity-mobile-arena": true, "ppg-paints-arena": true, "capital-one-arena": false,
};

/** The bar's button for a part (`stands`, `walls`, `roof`, `boards`, `building`, `markings`, `labels`) or a view (`view-3d`). */
const chip = (page, name) => page.locator(`#bar [data-testid="${name.startsWith("view-") ? name : `part-${name}`}"]`);

async function open(page, query = "", motion = "reduce") {
  // A reader who prefers reduced motion gets the 3D view still, so that a picture is the same every time; the tests of the auto-turn ask for motion.
  await page.emulateMedia({ reducedMotion: motion });
  const errors = [];
  const outside = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("request", (request) => !request.url().startsWith("http://kyogijo.test/") && !request.url().startsWith("data:") && outside.push(request.url()));
  await serve(page);
  await page.goto(`http://kyogijo.test/venues.html${query}`);
  await page.waitForSelector('body[data-ready="true"]');
  await page.waitForSelector(`${STAGE} svg.kyogijo, ${STAGE} .ky-turn`);
  return { errors, outside };
}

test("opens on the Honda Center in the outline of its building, with the Pacific Division's eight arenas as tabs and the divisions to choose, nothing sent anywhere and nothing wider than the screen", async ({ page }) => {
  const { errors, outside } = await open(page);
  await expect(page.locator("#tabs button")).toHaveText(DIVISIONS.pacific.names);
  // The divisions, by conference: the Western Conference's two, then the Eastern's.
  await expect(page.locator("#divisions button")).toHaveText(["Pacific", "Central", "Atlantic", "Metropolitan"]);
  await expect(page.locator("#divisions .conf-name")).toHaveText(["Western Conference", "Eastern Conference"]);
  await expect(page.locator('#divisions button[aria-pressed="true"]')).toHaveText("Pacific");
  await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText("Honda Center");
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-shell`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-north`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveAttribute("data-sport", "nhl");
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
  await noSidewaysScroll(page);
});

test("lists what the drawing is made from under it: the seats, the tiers, the roof, how the rink lies, the outline and the credit", async ({ page }) => {
  await open(page);
  const facts = page.locator('[data-testid="facts"]');
  await expect(facts).toContainText("17,174");
  await expect(facts).toContainText("2 (ours, plausible)");
  await expect(facts).toContainText("fixed (ours, plausible)");
  await expect(facts).toContainText("inferred from the building's long axis");
  await expect(facts).toContainText("OpenStreetMap way/120623151");
  await expect(page.locator('[data-testid="credit"]')).toContainText("(c) OpenStreetMap contributors, ODbL 1.0");
  await page.locator('#tabs button[data-venue="scotiabank-saddledome"]').click();
  await expect(facts).toContainText("19,289");
  await expect(facts).toContainText("saddle-shaped (a source says so)");
  await expect(facts).toContainText("not known: drawn east-west, north at the top");
});

test("chooses a division, and draws each of its eight, with the arrow only where the rink's orientation is known, and keeps the choice in the address", async ({ page }) => {
  await open(page);
  for (const [division, { ids, names }] of Object.entries(DIVISIONS)) {
    await page.locator(`#divisions button[data-division="${division}"]`).click();
    await expect(page.locator('#divisions button[aria-pressed="true"]')).toHaveCount(1);
    await expect(page.locator("#tabs button")).toHaveText(names);
    // Choosing a division opens its first arena.
    await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText(names[0]);
    for (const [i, id] of ids.entries()) {
      await page.locator(`#tabs button[data-venue="${id}"]`).click();
      await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText(names[i]);
      await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-shell`)).toHaveCount(1);
      await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-north`)).toHaveCount(ARROW[id] ? 1 : 0);
      if (id !== DIVISIONS.pacific.ids[0]) expect(page.url()).toContain(`venue=${id}`);
      // The whole building is in the drawing: the shell's box is inside the picture's.
      const inside = await page.locator(`${STAGE} svg.kyogijo`).evaluate((svg) => {
        const [x, y, w, h] = svg.getAttribute("viewBox").split(" ").map(Number);
        const box = svg.querySelector(".ky-cr-shell").getBBox();
        return box.x >= x - 0.5 && box.y >= y - 0.5 && box.x + box.width <= x + w + 0.5 && box.y + box.height <= y + h + 0.5;
      });
      expect(inside, id).toBe(true);
    }
  }
  await page.goto("http://kyogijo.test/venues.html?venue=rogers-arena");
  await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText("Rogers Arena");
  // An address that names a venue of another division opens on that division; one that names a division opens on its first arena.
  await page.goto("http://kyogijo.test/venues.html?venue=canada-life-centre");
  await expect(page.locator('#divisions button[aria-pressed="true"]')).toHaveText("Central");
  await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText("Canada Life Centre");
  await page.goto("http://kyogijo.test/venues.html?division=central");
  await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText("United Center");
});

test("draws a venue of three tiers, the Grand Casino Arena's, and lists its division, conference and tiers", async ({ page }) => {
  const { errors } = await open(page, "?venue=grand-casino-arena");
  const facts = page.locator('[data-testid="facts"]');
  await expect(facts).toContainText("Central, Western Conference");
  await expect(facts).toContainText("17,954");
  await expect(facts).toContainText("3 (a source says so)");
  await expect(facts).toContainText("OpenStreetMap relation/20658401");
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-shell`)).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("lists the Eastern Conference's venues too: a venue whose ice OpenStreetMap maps, and one whose Wikidata item gives no capacity", async ({ page }) => {
  const { errors } = await open(page, "?venue=td-garden");
  await expect(page.locator('#divisions button[aria-pressed="true"]')).toHaveText("Atlantic");
  const facts = page.locator('[data-testid="facts"]');
  await expect(facts).toContainText("Atlantic, Eastern Conference");
  await expect(facts).toContainText("17,850");
  await expect(facts).toContainText("from the ice OpenStreetMap maps");
  await expect(facts).toContainText("OpenStreetMap way/25123637");
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-north`)).toHaveCount(1);
  await page.locator('#tabs button[data-venue="little-caesars-arena"]').click();
  await expect(facts).toContainText("19,515 (Wikidata gives no capacity)");
  await page.locator('#divisions button[data-division="metropolitan"]').click();
  await expect(page.locator("#tabs button")).toHaveText(DIVISIONS.metropolitan.names);
  expect(errors).toEqual([]);
});

test("turns in 3D: the tiers stand on the floor, the walls and the roof stand apart and only when asked, and the viewpoint is the view's own button", async ({ page }) => {
  const { errors } = await open(page, "?view=3d&venue=scotiabank-saddledome");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} .ky-up-seats`).first()).toBeAttached();
  await expect(page.locator(`${STAGE} [data-part^="shell-"]`)).toHaveCount(0);
  await expect(chip(page, "roof")).toBeVisible();
  await expect(chip(page, "walls")).toHaveAttribute("aria-pressed", "false");
  // The walls alone, then the roof as well, then the roof alone.
  await chip(page, "walls").click();
  expect(await page.locator(`${STAGE} [data-part^="shell-"]`).count()).toBeGreaterThanOrEqual(40);
  await expect(page.locator(`${STAGE} [data-part^="roof-"]`)).toHaveCount(0);
  expect(page.url()).toContain("walls=1");
  await chip(page, "roof").click();
  await expect(page.locator(`${STAGE} [data-part^="roof-"]`).first()).toBeAttached();
  await chip(page, "walls").click();
  await expect(page.locator(`${STAGE} [data-part^="shell-"]`)).toHaveCount(0);
  await expect(page.locator(`${STAGE} [data-part^="roof-"]`).first()).toBeAttached();
  expect(page.url()).toContain("roof=1");
  expect(page.url()).toContain("walls=0");
  await page.locator('.ky-turn-controls button[data-preset="overhead"]').click();
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-preset", "overhead");
  expect(page.url()).toContain("viewpoint=overhead");
  expect(errors).toEqual([]);
  await chip(page, "view-2d").click();
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveCount(1);
  await expect(chip(page, "roof")).toBeHidden();
  await expect(chip(page, "walls")).toBeHidden();
  expect(page.url()).not.toContain("view=3d");
});

test("an old address's roof=1 is the walls and the roof together, and the choices in the address come back as they were", async ({ page }) => {
  await open(page, "?view=3d&roof=1&stands=0&building=0&markings=0&labels=0&viewpoint=end&venue=rogers-place");
  await expect(chip(page, "walls")).toHaveAttribute("aria-pressed", "true");
  await expect(chip(page, "roof")).toHaveAttribute("aria-pressed", "true");
  for (const part of ["stands", "building", "markings", "labels"]) await expect(chip(page, part)).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(STAGE)).toHaveAttribute("data-hide", "building markings labels");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-preset", "end");
  expect(await page.locator(`${STAGE} [data-part^="shell-"]`).count()).toBeGreaterThanOrEqual(40);
});

test("has the controls on the view, in sight without scrolling, and a button pressed while the view turns neither stops it nor sends it back", async ({ page }) => {
  const { errors } = await open(page, "?view=3d&venue=climate-pledge-arena&spin=on", "no-preference");
  const stage = page.locator(`${STAGE} .ky-turn-view`);
  const play = page.locator('.ky-turn-controls button[data-act="play"]');
  // The address asked for the turn (`spin=on`): Play is pressed, and the scene's turn changes from one moment to the next.
  await expect(play).toHaveAttribute("aria-pressed", "true");
  const sceneTurn = () => page.locator(`${STAGE} .ky-turn-floor`).evaluate((floor) => getComputedStyle(floor).transform);
  const first = await sceneTurn();
  await expect.poll(sceneTurn).not.toBe(first);
  // The bar, the view and the view's own buttons (viewpoints, turn, tilt, zoom, Play) are all inside the screen at once, at the size of a laptop.
  for (const target of [page.locator("#bar"), stage, play, page.locator('.ky-turn-controls button[data-preset="overhead"]')]) {
    const box = await target.boundingBox();
    const screen = page.viewportSize();
    expect(box.y, "top").toBeGreaterThanOrEqual(0);
    expect(box.y + box.height, "bottom").toBeLessThanOrEqual(screen.height);
  }
  // The scene is marked, so that a mount again would show: it is the same one at the end.
  await page.locator(`${STAGE} .ky-turn`).evaluate((root) => { root.dataset.same = "yes"; });
  for (const part of ["stands", "walls", "roof", "boards", "building", "markings", "labels", "labels", "markings", "building", "boards", "roof", "walls", "stands"]) {
    await chip(page, part).click();
    await expect(play).toHaveAttribute("aria-pressed", "true");
  }
  await page.locator('#tabs button[data-venue="rogers-arena"]').click();
  await page.locator('#divisions button[data-division="central"]').click();
  await page.locator("#theme").selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-same", "yes");
  await expect(play).toHaveAttribute("aria-pressed", "true");
  const second = await sceneTurn();
  await expect.poll(sceneTurn).not.toBe(second);
  // Play and Pause are the view's, and the address says it is paused (it says `spin=on` only while the reader's own turn goes).
  await play.click();
  await expect(play).toHaveAttribute("aria-pressed", "false");
  expect(page.url()).not.toContain("spin=");
  expect(errors).toEqual([]);
});

test("shows the LED boards on request, in the plan and in 3D, kept in the address, and in 3D without stopping or sending back the turn", async ({ page }) => {
  const { errors } = await open(page, "?venue=td-garden");
  // Off by default: nothing of them in the plan or the address.
  await expect(chip(page, "boards")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-ribbon`)).toHaveCount(0);
  await chip(page, "boards").click();
  await expect(chip(page, "boards")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-ribbon`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-board`)).toHaveCount(1);
  expect(page.url()).toContain("boards=1");
  // The address brings them back, in 3D too: ribbons on the fascia and a scoreboard hung over the ice.
  await page.goto("http://kyogijo.test/venues.html?venue=td-garden&view=3d&boards=1");
  await page.waitForSelector(`${STAGE} .ky-turn`);
  await expect(chip(page, "boards")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(`${STAGE} .ky-up-ribbon`).first()).toBeAttached();
  await expect(page.locator(`${STAGE} .ky-up-hung-board`).first()).toBeAttached();
  await chip(page, "boards").click();
  await expect(page.locator(`${STAGE} .ky-up-ribbon`)).toHaveCount(0);
  await expect(page.locator(`${STAGE} .ky-up-hung-board`)).toHaveCount(0);
  expect(page.url()).not.toContain("boards=");
  expect(errors).toEqual([]);
});

test("switches the LED boards while the view turns: it is the same scene afterwards and it goes on turning", async ({ page }) => {
  const { errors } = await open(page, "?view=3d&venue=td-garden&spin=on", "no-preference");
  const play = page.locator('.ky-turn-controls button[data-act="play"]');
  await expect(play).toHaveAttribute("aria-pressed", "true");
  await page.locator(`${STAGE} .ky-turn`).evaluate((root) => { root.dataset.same = "yes"; });
  await expect(chip(page, "boards")).toBeVisible();
  const box = await chip(page, "boards").boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize().height);
  await chip(page, "boards").click();
  await expect(page.locator(`${STAGE} .ky-up-ribbon`).first()).toBeAttached();
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-same", "yes");
  await expect(play).toHaveAttribute("aria-pressed", "true");
  const sceneTurn = () => page.locator(`${STAGE} .ky-turn-floor`).evaluate((floor) => getComputedStyle(floor).transform);
  const first = await sceneTurn();
  await expect.poll(sceneTurn).not.toBe(first);
  expect(errors).toEqual([]);
});

const lighting = (page) => page.locator('#bar [data-testid="lighting"]');
const wash = (page) => page.locator('#bar [data-testid="wash"]');

test("lights the venue with a preset on request, in the plan and in 3D, kept in the address, with a colour of light over the preset's own", async ({ page }) => {
  const { errors } = await open(page, "?venue=td-garden");
  await expect(lighting(page)).toHaveValue("off");
  await expect(lighting(page).locator("option")).toHaveText(["Lighting: off", "Night", "Game", "Lights down", "Intro", "Concert"]);
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-night`)).toHaveCount(0);
  await lighting(page).selectOption("night");
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-night`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-pool`)).toHaveCount(1);
  expect(page.url()).toContain("lighting=night");
  await lighting(page).selectOption("game");
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-half`)).toHaveCount(1);
  await lighting(page).selectOption("lightsDown");
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-down`)).toHaveCount(1);
  expect(await page.locator(`${STAGE} svg.kyogijo .ky-cr-beam`).count()).toBeGreaterThan(10);
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-wash`)).toHaveCount(0);
  await wash(page).selectOption("purple");
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-wash`)).toHaveCount(1);
  expect(page.url()).toContain("lighting=lightsDown");
  expect(page.url()).toContain("wash=purple");
  // The intro and the concert wash by themselves.
  await wash(page).selectOption("none");
  await lighting(page).selectOption("intro");
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-wash`)).toHaveCount(1);
  await lighting(page).selectOption("concert");
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-wash`)).toHaveCount(1);
  await lighting(page).selectOption("off");
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-night`)).toHaveCount(0);
  expect(page.url()).not.toContain("lighting=");
  expect(page.url()).not.toContain("wash=");
  // The address brings a preset back, in 3D: the preset on the root and, for the concert, the wash a plane of its own; an old address's night=1 and lights=1 too.
  await page.goto("http://kyogijo.test/venues.html?venue=td-garden&view=3d&lighting=concert");
  await page.waitForSelector(`${STAGE} .ky-turn`);
  await expect(lighting(page)).toHaveValue("concert");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-lighting", "concert");
  await expect(page.locator(`${STAGE} [data-part="light-wash"]`)).toHaveCount(1);
  await page.goto("http://kyogijo.test/venues.html?venue=td-garden&view=3d&lights=1&wash=blue");
  await page.waitForSelector(`${STAGE} .ky-turn`);
  await expect(lighting(page)).toHaveValue("lightsDown");
  await expect(wash(page)).toHaveValue("blue");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-lighting", "lightsDown");
  await page.goto("http://kyogijo.test/venues.html?venue=td-garden&view=3d&night=1");
  await page.waitForSelector(`${STAGE} .ky-turn`);
  await expect(lighting(page)).toHaveValue("night");
  expect(errors).toEqual([]);
});

test("changes the lighting while the view turns, the same scene afterwards and still turning, in the light theme and in the dark", async ({ page }) => {
  const { errors } = await open(page, "?view=3d&venue=td-garden&spin=on&boards=1", "no-preference");
  const play = page.locator('.ky-turn-controls button[data-act="play"]');
  await expect(play).toHaveAttribute("aria-pressed", "true");
  await page.locator(`${STAGE} .ky-turn`).evaluate((root) => { root.dataset.same = "yes"; });
  const sceneTurn = () => page.locator(`${STAGE} .ky-turn-floor`).evaluate((floor) => getComputedStyle(floor).transform);
  for (const theme of ["light", "dark"]) {
    await page.locator("#theme").selectOption(theme);
    for (const preset of ["night", "game", "lightsDown", "intro", "concert"]) {
      await lighting(page).selectOption(preset);
      await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-lighting", preset);
      await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-same", "yes");
      await expect(play).toHaveAttribute("aria-pressed", "true");
    }
    await wash(page).selectOption("magenta");
    await expect(page.locator(`${STAGE} [data-part="light-wash"]`)).toHaveCount(1);
    const first = await sceneTurn();
    await expect.poll(sceneTurn).not.toBe(first);
    await wash(page).selectOption("none");
    await lighting(page).selectOption("off");
    await expect(page.locator(`${STAGE} .ky-turn`)).not.toHaveAttribute("data-lighting", /.*/);
  }
  expect(errors).toEqual([]);
});

test("waits still when it opens, turns while the pointer is over it, and stops when it leaves", async ({ page }) => {
  const { errors } = await open(page, "?view=3d&venue=climate-pledge-arena", "no-preference");
  const play = page.locator('.ky-turn-controls button[data-act="play"]');
  const sceneTurn = () => page.locator(`${STAGE} .ky-turn-floor`).evaluate((floor) => getComputedStyle(floor).transform);
  await expect(play).toHaveAttribute("aria-pressed", "false");
  const still = await sceneTurn();
  await page.waitForTimeout(500);
  expect(await sceneTurn()).toBe(still);
  await page.locator(`${STAGE} .ky-turn-view`).hover();
  await expect(play).toHaveAttribute("aria-pressed", "true");
  await expect.poll(sceneTurn).not.toBe(still);
  // The pointer's turn is not the reader's own, so the address does not carry it.
  expect(page.url()).not.toContain("spin=");
  await page.mouse.move(2, 2);
  await expect(play).toHaveAttribute("aria-pressed", "false");
  expect(errors).toEqual([]);
});

test("a tap on the view starts the turn on a phone and a second tap holds it", async ({ page }, testInfo) => {
  test.skip(testInfo.project.use.hasTouch !== true, "a touch screen only: a mouse turns it by hovering");
  await open(page, "?view=3d&venue=climate-pledge-arena", "no-preference");
  const play = page.locator('.ky-turn-controls button[data-act="play"]');
  await expect(play).toHaveAttribute("aria-pressed", "false");
  await page.locator(`${STAGE} .ky-turn-view`).tap();
  await expect(play).toHaveAttribute("aria-pressed", "true");
  await page.locator(`${STAGE} .ky-turn-view`).tap();
  await expect(play).toHaveAttribute("aria-pressed", "false");
});

test("turns either way: Reverse is a button of the view, pressed while it goes clockwise, and the address keeps it as dir=cw", async ({ page }) => {
  await open(page, "?view=3d&venue=climate-pledge-arena&spin=on", "no-preference");
  const reverse = page.locator('.ky-turn-controls button[data-act="reverse"]');
  const angle = () => page.locator(`${STAGE} .ky-turn-floor`).evaluate((floor) => {
    const m = getComputedStyle(floor).transform.slice("matrix3d(".length, -1).split(",").map(Number);
    return Math.atan2(m[1], m[0]);
  });
  const swing = async () => {
    const a = await angle();
    await page.waitForTimeout(700);
    const d = (await angle()) - a;
    return Math.sign(Math.atan2(Math.sin(d), Math.cos(d)));
  };
  await expect(reverse).toHaveAttribute("aria-pressed", "false");
  const way = await swing();
  expect(way).not.toBe(0);
  await reverse.click();
  await expect(reverse).toHaveAttribute("aria-pressed", "true");
  expect(page.url()).toContain("dir=cw");
  expect(await swing()).toBe(-way);
  // A part switched while it turns neither stops it nor changes the way.
  await chip(page, "roof").click();
  await expect(reverse).toHaveAttribute("aria-pressed", "true");
  expect(await swing()).toBe(-way);
  await reverse.click();
  expect(page.url()).not.toContain("dir=");
  expect(await swing()).toBe(way);
});

test("hides the building, the markings and the labels by a style and not by drawing again, and takes the seats away with the stands", async ({ page }) => {
  await open(page);
  for (const [part, selector] of [["building", ".ky-cr-shell"], ["markings", ".ky-surface-group"], ["labels", ".ky-cr-north"]]) {
    const target = page.locator(`${STAGE} svg.kyogijo ${selector}`);
    await expect(target).toBeVisible();
    await chip(page, part).click();
    await expect(target).toBeHidden();
    expect(page.url()).toContain(`${part}=0`);
    await chip(page, part).click();
    await expect(target).toBeVisible();
    expect(page.url()).not.toContain(`${part}=0`);
  }
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-bed`).first()).toBeAttached();
  await chip(page, "stands").click();
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-bed`)).toHaveCount(0);
  await expect(page.locator(`${STAGE} svg.kyogijo .ky-cr-shell`)).toHaveCount(1);
});

test("keeps the bar to one row that scrolls on a phone, with nothing wider than the screen and the view in sight", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "?view=3d");
  const bar = page.locator("#bar");
  expect((await bar.boundingBox()).height).toBeLessThan(70);
  await expect(chip(page, "stands")).toBeVisible();
  const stage = await page.locator(`${STAGE} .ky-turn-view`).boundingBox();
  expect(stage.y + stage.height).toBeLessThanOrEqual(844);
  await noSidewaysScroll(page);
});

test("is in Japanese on request, the title, the facts and the drawing's own description, and dark on request", async ({ page }) => {
  await open(page, "?lang=ja&theme=dark&venue=climate-pledge-arena");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("#title")).toContainText("実在のアリーナ");
  await expect(page.locator('[data-testid="facts"]')).toContainText("17,151席");
  await expect(page.locator(`${STAGE} svg.kyogijo desc`)).toContainText("OpenStreetMap");
  await noSidewaysScroll(page);
});
