// The district page: BC Place and Rogers Arena on one plan at their real positions, in 2D and in 3D, in a real browser: each venue in its place, one north arrow, the distance between them, the choice of venues, the fit and the
// turn kept in the address, English and Japanese, nothing sent anywhere and nothing wider than the screen.
import { expect, test } from "@playwright/test";

import { noSidewaysScroll, serve } from "./demo.mjs";

const STAGE = '[data-testid="stage"]';

async function open(page, query = "") {
  const errors = [];
  const outside = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("request", (request) => !request.url().startsWith("http://kyogijo.test/") && !request.url().startsWith("data:") && outside.push(request.url()));
  await serve(page);
  await page.goto(`http://kyogijo.test/district.html${query}`);
  await page.waitForSelector('body[data-ready="true"]');
  return { errors, outside };
}

test("opens on BC Place and Rogers Arena side by side, each in its place, with one arrow, nothing sent anywhere and nothing wider than the screen", async ({ page }) => {
  const { errors, outside } = await open(page);
  await expect(page.locator(`${STAGE} svg.ky-district`)).toHaveAttribute("data-sport", "district");
  await expect(page.locator(`${STAGE} [data-venue]`)).toHaveCount(2);
  await expect(page.locator(`${STAGE} .ky-cr-shell`)).toHaveCount(2);
  await expect(page.locator(`${STAGE} .ky-dist-north`)).toHaveCount(1);
  await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText("BC Place and Rogers Arena");
  await expect(page.locator('[data-testid="between"]')).toContainText("are 264 metres apart");
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
  await noSidewaysScroll(page);
});

test("lists the venues with their seats and how each field lies, and the credit", async ({ page }) => {
  await open(page);
  const facts = page.locator('[data-testid="facts"]');
  await expect(facts).toContainText("BC Place");
  await expect(facts).toContainText("54,500");
  await expect(facts).toContainText("Rogers Arena");
  await expect(facts).toContainText("18,871");
  await expect(page.locator('[data-testid="credit"]')).toContainText("(c) OpenStreetMap contributors, ODbL 1.0");
});

test("changes the venues by a preset or by the boxes, keeps them in the address, and refuses an empty choice", async ({ page }) => {
  await open(page);
  await page.locator('#tabs button[data-preset="soccer"]').click();
  await expect(page.locator(`${STAGE} [data-venue="bc-place:soccer"]`)).toHaveCount(1);
  expect(page.url()).toContain("venues=bc-place%3Asoccer%2Crogers-arena");
  // A stadium is in a district once: choosing its other configuration takes the first away.
  await page.locator('input[data-key="bc-place:cfl"]').check();
  await expect(page.locator(`${STAGE} [data-venue="bc-place:cfl"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} [data-venue="bc-place:soccer"]`)).toHaveCount(0);
  await page.locator('input[data-key="bc-place:cfl"]').uncheck();
  await page.locator('input[data-key="rogers-arena"]').uncheck();
  await expect(page.locator("#error")).toBeVisible();
  await page.locator('input[data-key="rogers-arena"]').check();
  await expect(page.locator("#error")).toBeHidden();
  await expect(page.locator(`${STAGE} [data-venue]`)).toHaveCount(1);
});

test("fits as neighbours or as a city, with the names beside the venues in a city, and turns the map to lie across the page", async ({ page }) => {
  await open(page);
  expect(await page.locator(`${STAGE} svg.ky-district text`).allTextContents()).not.toContain("Rogers Arena");
  await page.locator("#mode").selectOption("city");
  await expect(page.locator(`${STAGE} svg.ky-district`)).toHaveAttribute("data-mode", "city");
  expect(await page.locator(`${STAGE} svg.ky-district text`).allTextContents()).toContain("Rogers Arena");
  const before = await page.locator(`${STAGE} svg.ky-district`).getAttribute("viewBox");
  await page.locator("#turn").selectOption("auto");
  expect(await page.locator(`${STAGE} svg.ky-district`).getAttribute("viewBox")).not.toBe(before);
  expect(page.url()).toContain("mode=city");
  expect(page.url()).toContain("turn=auto");
});

test("turns in 3D with both buildings on one ground: the stands and walls of each, a roof on each, signs with the names", async ({ page }) => {
  const { errors } = await open(page, "?view=3d&labels=1");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(1);
  expect(await page.locator(`${STAGE} [data-part^="m0-"]`).count()).toBeGreaterThan(300);
  expect(await page.locator(`${STAGE} [data-part^="m1-"]`).count()).toBeGreaterThan(150);
  await expect(page.locator(`${STAGE} .ky-up-sign`)).toHaveCount(2);
  expect(await page.locator(`${STAGE} [data-part^="m0-roof-"]`).count()).toBeGreaterThan(20);
  await page.locator("#roof").uncheck();
  await expect(page.locator(`${STAGE} [data-part^="m0-roof-"]`)).toHaveCount(0);
  await page.locator("#viewpoint").selectOption("overhead");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-preset", "overhead");
  expect(errors).toEqual([]);
  await page.locator("#view").selectOption("2d");
  await expect(page.locator(`${STAGE} svg.ky-district`)).toHaveCount(1);
});

test("is in Japanese on request, the title, the facts and the drawing's own description, and dark on request", async ({ page }) => {
  await open(page, "?lang=ja&theme=dark&labels=1");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("#title")).toContainText("実在の会場の地区");
  await expect(page.locator('[data-testid="between"]')).toContainText("m離れています");
  await expect(page.locator(`${STAGE} svg.ky-district desc`)).toContainText("OpenStreetMap");
  expect(await page.locator(`${STAGE} svg.ky-district text`).allTextContents()).toContain("BCプレイス");
  await noSidewaysScroll(page);
});

test("shows Seattle: the two SoDo stadiums as neighbours, then the three venues as a city at their real distances, with names", async ({ page }) => {
  const { errors } = await open(page);
  await page.locator('#tabs button[data-preset="sodo"]').click();
  await expect(page.locator(`${STAGE} [data-venue]`)).toHaveCount(2);
  await expect(page.locator(`${STAGE} [data-venue="t-mobile-park:mlb"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} [data-venue="lumen-field:nfl"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} svg.ky-district`)).toHaveAttribute("data-mode", "neighbours");
  await expect(page.locator('[data-testid="between"]')).toContainText("459 metres apart");
  await page.locator('#tabs button[data-preset="seattle"]').click();
  await expect(page.locator(`${STAGE} [data-venue]`)).toHaveCount(3);
  await expect(page.locator(`${STAGE} svg.ky-district`)).toHaveAttribute("data-mode", "city");
  expect(await page.locator(`${STAGE} svg.ky-district text`).allTextContents()).toEqual(expect.arrayContaining(["T-Mobile Park", "Lumen Field", "Climate Pledge Arena"]));
  await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText("Seattle city: all three venues");
  expect(page.url()).toContain("mode=city");
  await page.locator("#view").selectOption("3d");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(1);
  expect(await page.locator(`${STAGE} [data-part^="m2-"]`).count()).toBeGreaterThan(100);
  expect(errors).toEqual([]);
  await noSidewaysScroll(page);
});

test("puts LED boards on every venue of the district in 3D on request, kept in the address, without mounting the view again", async ({ page }) => {
  const { errors } = await open(page, "?view=3d");
  await expect(page.locator("#boards-row")).toBeVisible();
  await expect(page.locator(`${STAGE} .ky-up-ribbon`)).toHaveCount(0);
  await page.locator(`${STAGE} .ky-turn`).evaluate((root) => { root.dataset.same = "yes"; });
  await page.locator("#boards").check();
  await expect(page.locator(`${STAGE} [data-part^="m0-"].ky-up-ribbon`).first()).toBeAttached();
  await expect(page.locator(`${STAGE} [data-part^="m1-"].ky-up-ribbon`).first()).toBeAttached();
  await expect(page.locator(`${STAGE} [data-part$="centre-board-south"]`)).toHaveCount(2);
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-same", "yes");
  expect(new URL(page.url()).searchParams.get("boards")).toBe("1");
  await page.locator("#boards").uncheck();
  await expect(page.locator(`${STAGE} .ky-up-ribbon`)).toHaveCount(0);
  expect(new URL(page.url()).searchParams.get("boards")).toBeNull();
  expect(errors).toEqual([]);
});

test("lights the district with a preset in 3D on request, with a colour of light on each surface, kept in the address, without mounting the view again", async ({ page }) => {
  const { errors } = await open(page, "?view=3d");
  await expect(page.locator("#lighting-row")).toBeVisible();
  await page.locator(`${STAGE} .ky-turn`).evaluate((root) => { root.dataset.same = "yes"; });
  await page.locator("#lighting").selectOption("night");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-lighting", "night");
  await expect(page.locator(`${STAGE} [data-part$="night-pool"]`)).toHaveCount(2);
  await page.locator("#lighting").selectOption("lightsDown");
  await page.locator("#wash").selectOption("purple");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-lighting", "lightsDown");
  await expect(page.locator(`${STAGE} [data-part$="light-wash"]`)).toHaveCount(2);
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-same", "yes");
  const params = new URL(page.url()).searchParams;
  expect([params.get("lighting"), params.get("wash")]).toEqual(["lightsDown", "purple"]);
  await page.locator("#lighting").selectOption("off");
  await expect(page.locator(`${STAGE} .ky-turn`)).not.toHaveAttribute("data-lighting", /.*/);
  expect(errors).toEqual([]);
});

test("shows Tokyo Dome City: the ballpark and the hall as neighbours, one arrow, in 3D with the dome's roof", async ({ page }) => {
  const { errors } = await open(page);
  await page.locator('#tabs button[data-preset="tokyo"]').click();
  await expect(page.locator(`${STAGE} [data-venue]`)).toHaveCount(2);
  await expect(page.locator(`${STAGE} [data-venue="tokyo-dome:mlb"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} [data-venue="korakuen-hall:boxing"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} svg.ky-district`)).toHaveAttribute("data-mode", "neighbours");
  await expect(page.locator(`${STAGE} .ky-dist-north`)).toHaveCount(1);
  await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText("Tokyo Dome City: Tokyo Dome and Korakuen Hall");
  await expect(page.locator('[data-testid="facts"]')).toContainText("not known, fitted to the building");
  await page.locator("#view").selectOption("3d");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(1);
  expect(await page.locator(`${STAGE} [data-part^="m0-roof-0-"]`).count()).toBeGreaterThan(40);
  expect(errors).toEqual([]);
  await noSidewaysScroll(page);
});

/** How many pixels of a canvas have any ink: the people on it. */
const inked = (page, selector) =>
  page.locator(selector).evaluate((canvas) => {
    const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let n = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n += 1;
    return n;
  });

test("offers the crowd outside for Vancouver, in view before the plan, five levels, and for no other district", async ({ page }) => {
  const { errors } = await open(page);
  const bar = page.locator('[data-testid="outside"]');
  await expect(bar).toBeVisible();
  await expect(bar.locator("button")).toHaveText(["0%", "25%", "50%", "75%", "100%"]);
  await expect(bar.locator('button[aria-pressed="true"]')).toHaveText("0%");
  // In the first screen: the bar ends above the fold, the plan under it.
  const box = await bar.boundingBox();
  const height = page.viewportSize().height;
  expect(box.y + box.height).toBeLessThan(height);
  await expect(page.locator('[data-testid="outside-count"]')).toContainText("Nobody outside");
  await page.locator('#tabs button[data-preset="sodo"]').click();
  await expect(bar).toBeHidden();
  await expect(page.locator('[data-testid="outside-note"]')).toContainText("BC Place and Rogers Arena");
  await page.locator('#tabs button[data-preset="pair"]').click();
  await expect(bar).toBeVisible();
  expect(errors).toEqual([]);
});

test("puts the crowd outside on one canvas over the plan, a level at a time, kept in the address, the plan where it was", async ({ page }) => {
  const { errors } = await open(page);
  const CANVAS = `${STAGE} canvas.ky-district-outside`;
  const plan = page.locator(`${STAGE} svg.ky-district`);
  const viewBox = await plan.getAttribute("viewBox");
  const elements = await page.locator(`${STAGE} *`).count();
  await expect(page.locator(CANVAS)).toHaveCount(1);
  expect(await page.locator(CANVAS).getAttribute("width")).toBe("1");
  const painted = {};
  for (const level of [25, 50, 75, 100]) {
    await page.locator(`[data-testid="outside"] button[data-level="${level}"]`).click();
    await expect(page.locator(CANVAS)).toHaveAttribute("data-outside", String(level));
    await expect(page.locator('[data-testid="outside"] button[aria-pressed="true"]')).toHaveText(`${level}%`);
    expect(new URL(page.url()).searchParams.get("outside")).toBe(String(level));
    // The plan is the same text at every level, and nothing was added to it for a person: one canvas is all there is.
    expect(await plan.getAttribute("viewBox")).toBe(viewBox);
    expect(await page.locator(`${STAGE} *`).count()).toBe(elements);
    painted[level] = await inked(page, CANVAS);
  }
  // More people cover more pixels, level by level.
  expect(painted[25]).toBeGreaterThan(1000);
  expect(painted[50]).toBeGreaterThan(painted[25]);
  expect(painted[75]).toBeGreaterThan(painted[50]);
  expect(painted[100]).toBeGreaterThan(painted[75]);
  await expect(page.locator('[data-testid="outside-count"]')).toContainText("73,371 people outside, 100% of the 73,371 seats");
  // The canvas lies over the plan's drawing and no further.
  const [svg, canvas] = [await plan.boundingBox(), await page.locator(CANVAS).boundingBox()];
  expect(canvas.x).toBeGreaterThanOrEqual(svg.x - 1);
  expect(canvas.x + canvas.width).toBeLessThanOrEqual(svg.x + svg.width + 1);
  expect(canvas.y).toBeGreaterThanOrEqual(svg.y - 1);
  expect(canvas.y + canvas.height).toBeLessThanOrEqual(svg.y + svg.height + 1);
  await page.locator('[data-testid="outside"] button[data-level="0"]').click();
  expect(await page.locator(CANVAS).getAttribute("width")).toBe("1");
  expect(new URL(page.url()).searchParams.get("outside")).toBeNull();
  expect(errors).toEqual([]);
});

test("opens on a level from the address, in 2D and in 3D, and says it in Japanese on request", async ({ page }) => {
  const { errors } = await open(page, "?outside=50");
  await expect(page.locator('[data-testid="outside"] button[aria-pressed="true"]')).toHaveText("50%");
  await expect(page.locator(`${STAGE} canvas.ky-district-outside`)).toHaveAttribute("data-outside", "50");
  expect(await inked(page, `${STAGE} canvas.ky-district-outside`)).toBeGreaterThan(1000);
  await page.locator("#view").selectOption("3d");
  await expect(page.locator(`${STAGE} .ky-turn-floor canvas.ky-turn-outside`)).toHaveAttribute("data-outside", "50");
  expect(await inked(page, `${STAGE} canvas.ky-turn-outside`)).toBeGreaterThan(1000);
  expect(new URL(page.url()).searchParams.get("outside")).toBe("50");
  await page.locator("#language").selectOption("ja");
  await expect(page.locator("#l-outside")).toHaveText("会場の外の人出");
  await expect(page.locator('[data-testid="outside-count"]')).toContainText("会場の外に36,686人（73,371席の50％）");
  await expect(page.locator(`${STAGE} .ky-turn-outside`)).toHaveAttribute("data-outside", "50");
  expect(errors).toEqual([]);
  await noSidewaysScroll(page);
});

test("stands the crowd on the floor of the 3D view, a level at a time, without mounting the view again, and paints nothing while it turns", async ({ page }) => {
  await page.addInitScript(() => {
    window.__puts = 0;
    const put = CanvasRenderingContext2D.prototype.putImageData;
    CanvasRenderingContext2D.prototype.putImageData = function (...args) {
      window.__puts += 1;
      return put.apply(this, args);
    };
  });
  const { errors } = await open(page, "?view=3d");
  const CANVAS = `${STAGE} .ky-turn-floor > canvas.ky-turn-outside`;
  await expect(page.locator(CANVAS)).toHaveCount(1);
  expect(await page.locator(CANVAS).getAttribute("width")).toBe("1");
  const planes = await page.locator(`${STAGE} .ky-up`).count();
  await page.locator(`${STAGE} .ky-turn`).evaluate((root) => { root.dataset.same = "yes"; });
  await page.locator('[data-testid="outside"] button[data-level="100"]').click();
  await expect(page.locator(CANVAS)).toHaveAttribute("data-outside", "100");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-same", "yes");
  // One canvas and no plane more: the people are not elements of the scene.
  expect(await page.locator(`${STAGE} .ky-up`).count()).toBe(planes);
  expect(await inked(page, CANVAS)).toBeGreaterThan(5000);
  // The cost of the paint, written on the bar, is the one-off a level costs.
  const cost = Number(await page.locator('[data-testid="outside"]').getAttribute("data-cost-ms"));
  expect(cost).toBeGreaterThan(0);
  expect(cost).toBeLessThan(400);
  await expect(page.locator('[data-testid="outside"]')).toHaveAttribute("data-people", "73371");
  // Turn it: the floor's matrix moves with each frame and the canvas is not painted again.
  const floor = page.locator(`${STAGE} .ky-turn-floor`);
  const before = await floor.getAttribute("style");
  const puts = await page.evaluate(() => window.__puts);
  await page.locator('button[data-act="play"]').click();
  await page.waitForTimeout(900);
  expect(await floor.getAttribute("style")).not.toBe(before);
  expect(await page.evaluate(() => window.__puts)).toBe(puts);
  // A level changed while it turns keeps it turning: the view's angle goes on from where it was, and the view is the same one.
  const turning = await floor.getAttribute("style");
  await page.locator('[data-testid="outside"] button[data-level="25"]').click();
  await page.waitForTimeout(600);
  expect(await floor.getAttribute("style")).not.toBe(turning);
  await expect(page.locator('button[data-act="play"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-same", "yes");
  expect(await page.evaluate(() => window.__puts)).toBe(puts + 1);
  expect(errors).toEqual([]);
});

test("paints the crowd in the colour of the theme: light on the dark ground and dark on the light, and again when the theme changes", async ({ page }) => {
  await open(page, "?outside=100&theme=light");
  const CANVAS = `${STAGE} canvas.ky-district-outside`;
  const colour = () => page.locator(CANVAS).evaluate((canvas) => {
    const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return [data[i - 3], data[i - 2], data[i - 1]];
    return [];
  });
  const light = await colour();
  await page.locator("#theme").selectOption("dark");
  await expect.poll(colour).not.toEqual(light);
  expect(Math.max(...(await colour()))).toBeGreaterThan(200);
  expect(Math.max(...light)).toBeLessThan(220);
});

test("puts Tokyo Dome City among its buildings from Project PLATEAU, flat in 2D and standing in 3D, with its credit, and kept in the address", async ({ page }) => {
  const { errors, outside } = await open(page, "?venues=hanshin-koshien-stadium");
  // The choice is there only where the venues have surroundings to show.
  await expect(page.locator("#context-row")).toBeHidden();
  await page.locator('#tabs button[data-preset="tokyo"]').click();
  await expect(page.locator("#context-row")).toBeVisible();
  await expect(page.locator('[data-testid="context"]')).toBeChecked();
  await expect(page.locator(`${STAGE} .ky-dist-context .ky-dist-block`)).toHaveCount(5);
  await expect(page.locator(`${STAGE} .ky-dist-ghost`)).toHaveCount(1);
  await expect(page.locator('[data-testid="credit"]')).toContainText("Project PLATEAU");
  await expect(page.locator('[data-testid="credit"]')).toContainText("not made by MLIT");
  await page.locator("#view").selectOption("3d");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(1);
  expect(await page.locator(`${STAGE} [data-part^="c-"]`).count()).toBeGreaterThan(500);
  expect(await page.locator(`${STAGE} .ky-up-block .u-block-roof`).count()).toBeGreaterThan(50);
  // The venues are as they were: the dome's roof is still its own.
  expect(await page.locator(`${STAGE} [data-part^="m0-roof-0-"]`).count()).toBeGreaterThan(40);
  await page.locator('[data-testid="context"]').uncheck();
  await expect(page.locator(`${STAGE} [data-part^="c-"]`)).toHaveCount(0);
  expect(new URL(page.url()).searchParams.get("context")).toBe("0");
  await page.locator('[data-testid="context"]').check();
  await expect(page.locator(`${STAGE} [data-part^="c-"]`).first()).toBeAttached();
  expect(new URL(page.url()).searchParams.has("context")).toBe(false);
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
  await noSidewaysScroll(page);
});

test("says the credit of the buildings in Japanese, and keeps the choice off from an address that says context=0", async ({ page }) => {
  await open(page, "?venues=tokyo-dome,korakuen-hall&lang=ja");
  await expect(page.locator('[data-testid="credit"]')).toContainText("国土交通省");
  await expect(page.locator(`${STAGE} .ky-dist-context`)).toHaveCount(1);
  await open(page, "?venues=tokyo-dome,korakuen-hall&context=0");
  await expect(page.locator(`${STAGE} .ky-dist-context`)).toHaveCount(0);
  await expect(page.locator('[data-testid="context"]')).not.toBeChecked();
});

test("puts the Kodokan's main dojo in the air in its building: a choice in the Tokyo district, a preset, the building's three states in the address", async ({ page }) => {
  const { errors, outside } = await open(page);
  await expect(page.locator("#kodokan-row")).toBeHidden();
  await page.locator('#tabs button[data-preset="tokyokodokan"]').click();
  await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText("Tokyo Dome City and the Kodokan");
  await expect(page.locator('[data-testid="kodokan"]')).toBeChecked();
  await expect(page.locator(`${STAGE} [data-venue="kodokan"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} [data-shell="kodokan"].ky-dist-ghost`)).toHaveCount(1);
  await expect(page.locator('[data-testid="facts"]')).toContainText("Kodokan");
  await expect(page.locator('[data-testid="facts"]')).toContainText("main dojo, 7th floor (420 jō)");
  await expect(page.locator('[data-testid="facts"]')).toContainText("900");
  await expect(page.locator('[data-testid="credit"]')).toContainText("Project PLATEAU");
  expect(new URL(page.url()).searchParams.get("venues")).toContain("kodokan");
  await page.locator("#view").selectOption("3d");
  await expect(page.locator('[data-testid="building"]')).toBeVisible();
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(1);
  // The floor is in the air as a plane of its own, the room's planes round it, the building's walls over them.
  await expect(page.locator(`${STAGE} [data-part="m2-floor"]`)).toHaveCount(1);
  expect(await page.locator(`${STAGE} [data-part^="m2-shell-"]`).count()).toBeGreaterThan(10);
  expect(await page.locator(`${STAGE} [data-part^="m2-"]`).count()).toBeGreaterThan(60);
  await page.locator('[data-testid="building"]').selectOption("solid");
  expect(new URL(page.url()).searchParams.get("building")).toBe("solid");
  expect(await page.locator(`${STAGE} [data-part^="m2-shell-"]`).count()).toBeGreaterThan(10);
  await page.locator('[data-testid="building"]').selectOption("none");
  expect(new URL(page.url()).searchParams.get("building")).toBe("none");
  await expect(page.locator(`${STAGE} [data-part^="m2-shell-"]`)).toHaveCount(0);
  await expect(page.locator(`${STAGE} [data-part="m2-floor"]`)).toHaveCount(1);
  await page.locator('[data-testid="building"]').selectOption("xray");
  expect(new URL(page.url()).searchParams.has("building")).toBe(false);
  // Off: the venue goes and the choice of building with it.
  await page.locator('[data-testid="kodokan"]').uncheck();
  await expect(page.locator(`${STAGE} [data-part^="m2-"]`)).toHaveCount(0);
  await expect(page.locator('[data-testid="building"]')).toBeHidden();
  expect(new URL(page.url()).searchParams.get("venues")).not.toContain("kodokan");
  await page.locator('[data-testid="kodokan"]').check();
  await expect(page.locator(`${STAGE} [data-part="m2-floor"]`)).toHaveCount(1);
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
  await noSidewaysScroll(page);
});

test("opens the Kodokan from the address in 2D and in Japanese, with its building left out when the address says so, and an exact opening view", async ({ page }) => {
  const { errors } = await open(page, "?venues=kodokan&lang=ja&building=none");
  await expect(page.locator(`${STAGE} [data-venue="kodokan"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} [data-shell]`)).toHaveCount(0);
  await expect(page.locator('[data-testid="building"]')).toHaveValue("none");
  await expect(page.locator('[data-testid="facts"]')).toContainText("講道館");
  await expect(page.locator('[data-testid="facts"]')).toContainText("大道場（7階、420畳）");
  await expect(page.locator('[data-testid="credit"]')).toContainText("国土交通省");
  await open(page, "?venues=tokyo-dome,korakuen-hall,kodokan&view=3d&yaw=150&pitch=55");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} [data-part="m2-floor"]`)).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("shows downtown Vancouver's streets and buildings round BC Place and Rogers Arena, from OpenStreetMap, and takes them away on request", async ({ page }) => {
  const { errors } = await open(page);
  await expect(page.locator('[data-testid="context"]')).toBeChecked();
  await expect(page.locator(`${STAGE} svg.ky-district .ky-dist-streets`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} svg.ky-district .ky-dist-context`)).toHaveCount(1);
  await expect(page.locator('[data-testid="credit"]')).toContainText("Buildings and streets: (c) OpenStreetMap contributors");
  await page.locator('[data-testid="context"]').uncheck();
  await expect(page.locator(`${STAGE} svg.ky-district .ky-dist-streets`)).toHaveCount(0);
  expect(new URL(page.url()).searchParams.get("context")).toBe("0");
  await page.locator('[data-testid="context"]').check();
  expect(new URL(page.url()).searchParams.get("context")).toBeNull();
  // A venue with none (Koshien Stadium) has no choice.
  await page.locator('input[data-key="rogers-arena"]').uncheck();
  await page.locator('input[data-key="bc-place:cfl"]').uncheck();
  await page.locator('input[data-key="hanshin-koshien-stadium:mlb"]').check();
  await expect(page.locator('[data-testid="context"]')).toBeHidden();
  await expect(page.locator(`${STAGE} svg.ky-district .ky-dist-streets`)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("stands the towers of downtown Vancouver round the two venues in 3D, thirty-six masts on BC Place's roof, and a skylight on Rogers Arena's", async ({ page }) => {
  const { errors } = await open(page, "?view=3d");
  expect(await page.locator(`${STAGE} [data-part^="c-vancouver-"]`).count()).toBeGreaterThan(100);
  await expect(page.locator(`${STAGE} [data-part^="m0-mast-"]`)).toHaveCount(72);
  await expect(page.locator(`${STAGE} [data-part="m1-skylight"]`)).toHaveCount(1);
  await page.locator("#roof").uncheck();
  await expect(page.locator(`${STAGE} [data-part^="m0-mast-"]`)).toHaveCount(0);
  await expect(page.locator(`${STAGE} [data-part="m1-skylight"]`)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("opens and closes BC Place's retractable roof in 3D, kept in the address, without mounting the view again, and offers it for no other district but Seattle's ballpark", async ({ page }) => {
  const { errors } = await open(page, "?view=3d");
  await expect(page.locator("#roofopen-row")).toBeVisible();
  expect(await page.locator(`${STAGE} [data-part^="m0-fabric-"]`).count()).toBeGreaterThan(20);
  await page.locator(`${STAGE} .ky-turn`).evaluate((root) => { root.dataset.same = "yes"; });
  await page.locator("#roofopen").check();
  await expect(page.locator(`${STAGE} [data-part^="m0-fabric-"]`)).toHaveCount(0);
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-same", "yes");
  expect(new URL(page.url()).searchParams.get("roofopen")).toBe("1");
  await page.locator("#roofopen").uncheck();
  expect(await page.locator(`${STAGE} [data-part^="m0-fabric-"]`).count()).toBeGreaterThan(20);
  expect(new URL(page.url()).searchParams.get("roofopen")).toBeNull();
  await page.locator('#tabs button[data-preset="tokyo"]').click();
  await expect(page.locator("#roofopen-row")).toBeHidden();
  expect(errors).toEqual([]);
});

test("marks the gates of BC Place and Rogers Arena on the plan and the 3D floor on request: twelve, one of them named by a source, kept in the address", async ({ page }) => {
  const { errors } = await open(page);
  await expect(page.locator(`${STAGE} [data-gate]`)).toHaveCount(0);
  await page.locator('[data-testid="gates"]').check();
  await expect(page.locator(`${STAGE} [data-gate]`)).toHaveCount(12);
  await expect(page.locator(`${STAGE} .ky-dist-gate-documented`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} [data-gate="bc-place:south"]`)).toHaveCount(1);
  expect(new URL(page.url()).searchParams.get("gates")).toBe("1");
  await page.locator("#view").selectOption("3d");
  await expect(page.locator(`${STAGE} .ky-turn-floor [data-gate]`)).toHaveCount(12);
  await page.locator('#tabs button[data-preset="sodo"]').click();
  await expect(page.locator('[data-testid="gates"]')).toBeHidden();
  await expect(page.locator(`${STAGE} [data-gate]`)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("puts Vancouver's water, green and trees under its streets and buildings, credited, flat in 2D and on the floor in 3D, and off with the choice", async ({ page }) => {
  const { errors, outside } = await open(page);
  await expect(page.locator('[data-testid="context"]')).toBeChecked();
  const plan = `${STAGE} svg.ky-district`;
  expect(await page.locator(`${plan} .ky-dist-street`).count()).toBeGreaterThanOrEqual(3);
  expect(await page.locator(`${plan} .ky-dist-tree`).count()).toBeGreaterThanOrEqual(2);
  // (The water of False Creek lies beyond the frame, which is the venues' with 150 metres of ground.)
  await expect(page.locator(`${plan} .ky-dist-green`)).toHaveCount(1);
  const credit = page.locator('[data-testid="credit"]');
  await expect(credit).toContainText("Buildings and streets: (c) OpenStreetMap contributors");
  await expect(credit).toContainText("Land cover made with VoxCity (MIT) from OpenStreetMap");
  await expect(credit).toContainText("Trees: City of Vancouver open data, Public trees, under the Open Government Licence - Vancouver");
  await expect(credit).toContainText("simplified and edited by Kyogijo Stadiums");
  // The green, the streets and the trees lie under the venues, the green lowest and the trees over the streets.
  const order = await page.locator(plan).evaluate((svg) => {
    const after = (a, b) => (svg.querySelector(a).compareDocumentPosition(svg.querySelector(b)) & 4) > 0;
    return [after(".ky-dist-green", ".ky-dist-street"), after(".ky-dist-street", ".ky-dist-tree"), after(".ky-dist-tree", ".ky-dist-block"), after(".ky-dist-tree", "[data-venue]")];
  });
  expect(order).toEqual([true, true, true, true]);
  await page.locator("#view").selectOption("3d");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(1);
  expect(await page.locator(`${STAGE} .ky-turn-floor .ky-dist-tree`).count()).toBeGreaterThanOrEqual(2);
  await page.locator('[data-testid="context"]').uncheck();
  await expect(page.locator(`${STAGE} .ky-turn-floor .ky-dist-tree`)).toHaveCount(0);
  await expect(page.locator(`${STAGE} .ky-turn-floor .ky-dist-green`)).toHaveCount(0);
  await page.locator('[data-testid="context"]').check();
  await expect(page.locator(`${STAGE} .ky-turn-floor .ky-dist-tree`).first()).toBeAttached();
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
  await noSidewaysScroll(page);
});

test("puts Seattle's three venues in the city between them, and Seattle Center and SoDo each among their own streets, with the City's credit in English and in Japanese", async ({ page }) => {
  const { errors } = await open(page);
  const credit = page.locator('[data-testid="credit"]');
  await page.locator('#tabs button[data-preset="seattle"]').click();
  await expect(page.locator(`${STAGE} [data-venue]`)).toHaveCount(3);
  await expect(page.locator(`${STAGE} .ky-dist-street`).first()).toBeAttached();
  await expect(page.locator(`${STAGE} .ky-dist-water`)).toHaveCount(1);
  expect(await page.locator(`${STAGE} .ky-dist-context`).evaluate((g) => g.querySelector(".ky-dist-b3") !== null)).toBe(true);
  await expect(credit).toContainText("City of Seattle, Building Outlines 2015");
  await expect(credit).toContainText("USGS 3D Elevation Program");
  await expect(credit).toContainText("no warranty");
  await expect(credit).not.toContainText("Vancouver");
  // The city's own view has no single trees (it is too wide to show them).
  await expect(page.locator(`${STAGE} .ky-dist-tree`)).toHaveCount(0);
  await page.locator('#tabs button[data-preset="seattlecenter"]').click();
  await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText("Seattle Center");
  expect(await page.locator(`${STAGE} .ky-dist-tree`).count()).toBeGreaterThanOrEqual(2);
  await expect(credit).toContainText("City of Seattle, Combined Tree Point");
  await page.locator('#tabs button[data-preset="sodo"]').click();
  await expect(page.locator(`${STAGE} [data-venue]`)).toHaveCount(2);
  await expect(page.locator(`${STAGE} .ky-dist-street`).first()).toBeAttached();
  await page.locator("#language").selectOption("ja");
  await expect(credit).toContainText("シアトル市");
  await expect(credit).toContainText("© OpenStreetMap contributors");
  await expect(credit).toContainText("加工して作成");
  expect(errors).toEqual([]);
});

test("chooses a floor of the Kodokan's building: all of them or one, the plate of the floor picked out in 3D, its rooms listed, kept in the address", async ({ page }) => {
  const { errors, outside } = await open(page, "?venues=kodokan&view=3d");
  const floor = page.locator('[data-testid="floor"]');
  await expect(floor).toBeVisible();
  await expect(floor.locator("option")).toHaveCount(10);
  await expect(floor.locator("option").nth(1)).toContainText("8F: spectators' gallery");
  await expect(floor.locator("option").nth(3)).toContainText("6F: school dojo (240 jō), international dojo (192 jō)");
  await expect(page.locator('[data-testid="floors"] tr')).toHaveCount(9);
  await expect(page.locator(`${STAGE} [data-part="m0-plate"]`)).toHaveCount(0);
  // Every floor is a slab with an edge: the great dojo's floor has four sides, the other storeys are faint slabs.
  await expect(page.locator(`${STAGE} [data-part^="m0-slab-s"]`)).toHaveCount(4);
  expect(await page.locator(`${STAGE} [data-part^="m0-plate-f"]`).count()).toBeGreaterThan(60);
  await floor.selectOption("6");
  await expect(page.locator(`${STAGE} [data-part^="m0-plate-s"]`)).toHaveCount(10);
  expect(new URL(page.url()).searchParams.get("floor")).toBe("6");
  await expect(page.locator(`${STAGE} [data-part="m0-plate"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} [data-part="m0-floor"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} [data-part="m0p1-floor"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} [data-part="m0p2-floor"]`)).toHaveCount(0);
  expect(await page.locator(`${STAGE} [data-part^="m0-shell-"]`).count()).toBeGreaterThan(10);
  await expect(page.locator('[data-testid="floors"] tr[aria-current="true"]')).toContainText("6F");
  await expect(page.locator('[data-testid="floors"] tr[aria-current="true"]')).toContainText("school dojo (240 jō)");
  // The 5th floor has three dojos; a floor of plain rooms has a plate and no dojo; the basement is under the ground.
  await floor.selectOption("5");
  await expect(page.locator(`${STAGE} [data-part="m0p2-floor"]`)).toHaveCount(1);
  await floor.selectOption("3");
  await expect(page.locator(`${STAGE} [data-part="m0-plate"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} [data-part$="-floor"]`)).toHaveCount(0);
  await floor.selectOption("0");
  expect(new URL(page.url()).searchParams.get("floor")).toBe("b1");
  await expect(page.locator(`${STAGE} [data-part$="-plate"]`)).toHaveCount(0);
  await expect(page.locator('[data-testid="floors"] tr[aria-current="true"]')).toContainText("B1");
  // The seventh floor is the great dojo and the eighth its gallery.
  await floor.selectOption("7");
  await expect(page.locator(`${STAGE} [data-part="m0-floor"]`)).toHaveCount(1);
  await floor.selectOption("8");
  await expect(page.locator(`${STAGE} [data-part="m0-plate"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} [data-part="m0-floor"]`)).toHaveCount(0);
  // All floors again: the address forgets it and the great dojo stands as it did.
  await floor.selectOption("all");
  expect(new URL(page.url()).searchParams.has("floor")).toBe(false);
  await expect(page.locator(`${STAGE} [data-part="m0-plate"]`)).toHaveCount(0);
  await expect(page.locator(`${STAGE} [data-part="m0-floor"]`)).toHaveCount(1);
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
});

test("opens a floor of the Kodokan from the address, in 2D and in Japanese, and hides the choice for a district without it", async ({ page }) => {
  const { errors } = await open(page, "?venues=kodokan&floor=b1&lang=ja");
  await expect(page.locator('[data-testid="floor"]')).toHaveValue("0");
  await expect(page.locator('[data-testid="floor"] option').nth(3)).toContainText("6階：学校道場（240畳）、国際部道場（192畳）");
  await expect(page.locator(`${STAGE} [data-shell="kodokan"][data-floor]`)).toHaveCount(0);
  await open(page, "?venues=kodokan&floor=6");
  await expect(page.locator(`${STAGE} [data-venue="kodokan"]`)).toHaveCount(2);
  await expect(page.locator(`${STAGE} [data-shell="kodokan"][data-floor="6"]`)).toHaveCount(1);
  await open(page, "?floor=6");
  await expect(page.locator("#floor-row")).toBeHidden();
  await expect(page.locator('[data-testid="floors"]')).toBeHidden();
  expect(errors).toEqual([]);
});
