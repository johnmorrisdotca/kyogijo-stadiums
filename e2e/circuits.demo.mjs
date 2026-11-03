// The circuits page: the Las Vegas Strip Circuit in 2D and in 3D, in English and Japanese, its facts, and the code that draws what is shown with a Copy button that copies it. And the freeze rules of its 3D view: nothing is
// drawn while it is idle (no animation frame asked for, no element changed), the auto-turn stops while the page is hidden and while the view is out of sight and does not start again by itself, and turning it adds no element.
import { expect, test } from "@playwright/test";

import { noSidewaysScroll, serve } from "./demo.mjs";

const STAGE = '[data-testid="stage"]';

async function open(page, path) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  await page.goto(`http://kyogijo.test/${path}`);
  await page.waitForSelector('body[data-ready="true"]');
  return errors;
}

const floor = (page) => page.locator(`${STAGE} .ky-turn-floor`).first();
const transform = (page) => floor(page).evaluate((el) => getComputedStyle(el).transform);
async function turning(page) {
  const a = await transform(page);
  await page.waitForTimeout(450);
  return a !== (await transform(page));
}

test("draws the circuit flat with all 17 turns, the facts and the code, in English and Japanese", async ({ page }) => {
  const errors = await open(page, "circuits.html");
  const svg = page.locator(`${STAGE} svg.ky-circuit`);
  await expect(svg).toHaveAttribute("data-circuit", "las-vegas");
  await expect(svg.locator("g.ky-ci-turn")).toHaveCount(17);
  await expect(page.locator('[data-testid="code"]')).toContainText('drawCircuit({ circuit: "las-vegas" })');
  await noSidewaysScroll(page);
  await page.selectOption("#language", "ja");
  await expect(page.locator("#title")).toHaveText("サーキット");
  await expect(svg.locator("text.ky-ci-facts")).toHaveText("全長6.201 km・17コーナー");
  await expect(page.locator('[data-testid="code"]')).toContainText('language: "ja"');
  expect(new URL(page.url()).searchParams.get("lang")).toBe("ja");
  expect(errors).toEqual([]);
});

test("copies the code that draws what is shown", async ({ page }) => {
  await open(page, "circuits.html?view=3d&theme=dark");
  // The page is not a secure context here, so the page copies through a selected text area: what the browser copies is the selection when the copy happens.
  await page.evaluate(() => {
    window.__copied = "";
    document.addEventListener("copy", () => {
      const area = document.activeElement;
      window.__copied = area?.tagName === "TEXTAREA" ? area.value : String(document.getSelection());
    });
  });
  await page.locator('[data-testid="copy"]').click();
  await expect(page.locator("#copied")).not.toBeEmpty();
  const copied = await page.evaluate(() => window.__copied);
  expect(copied).toBe(await page.locator('[data-testid="code"]').textContent());
  expect(copied).toContain("mountCircuitTurn");
  expect(copied).toContain('theme: "dark"');
});

test("turns in 3D with the pit building and every turn's number standing, and keeps the view in the address", async ({ page }) => {
  const errors = await open(page, "circuits.html?view=3d&viewpoint=corner");
  await page.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
  await expect(page.locator(`${STAGE} .ky-up[data-part^="turn-"]:not([data-part$="-post"]):not([data-part$="-post-x"])`)).toHaveCount(17);
  expect(await page.locator(`${STAGE} .ky-up[data-part^="pit-"]`).count()).toBeGreaterThan(4);
  expect(await page.locator(`${STAGE} .ky-up`).count()).toBeLessThanOrEqual(120);
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-preset", "corner");
  expect(new URL(page.url()).searchParams.get("viewpoint")).toBe("corner");
  await noSidewaysScroll(page);
  expect(errors).toEqual([]);
});

test.describe("the 3D view's freeze rules", () => {
  test.beforeEach(async ({ page }) => {
    // Count the animation frames the page asks for, from before it loads.
    await page.addInitScript(() => {
      const ask = window.requestAnimationFrame.bind(window);
      window.__frames = 0;
      window.requestAnimationFrame = (callback) => {
        window.__frames += 1;
        return ask(callback);
      };
    });
  });

  test("draws nothing while it is idle", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await open(page, "circuits.html?view=3d");
    await page.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(800);
    const before = await page.evaluate(() => window.__frames);
    // Watch the view's elements for any change for a second and a half.
    const changed = await page.evaluate(
      (stage) =>
        new Promise((done) => {
          let count = 0;
          const watch = new MutationObserver((list) => { count += list.length; });
          watch.observe(document.querySelector(stage), { subtree: true, attributes: true, childList: true, characterData: true });
          setTimeout(() => { watch.disconnect(); done(count); }, 1500);
        }),
      STAGE,
    );
    expect(changed, "elements changed while idle").toBe(0);
    expect((await page.evaluate(() => window.__frames)) - before, "animation frames asked for while idle").toBe(0);
    expect(await turning(page)).toBe(false);
  });

  test("stops turning while the page is hidden or the view is out of sight, and grows nothing as it turns", async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await open(page, "circuits.html?view=3d");
    await page.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
    const count = () => page.evaluate((stage) => document.querySelector(stage).querySelectorAll("*").length, STAGE);
    const elements = await count();
    const play = page.locator(`${STAGE} .ky-turn-controls button[data-act="play"]`).first();
    await play.scrollIntoViewIfNeeded();
    if (testInfo.project.use.hasTouch === true) await play.tap();
    else await play.click();
    await expect(play).toHaveAttribute("aria-pressed", "true");
    expect(await turning(page)).toBe(true);
    // Hidden: the turn holds, and asks for no frame.
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(200);
    const hiddenFrames = await page.evaluate(() => window.__frames);
    expect(await turning(page), "turning while hidden").toBe(false);
    expect((await page.evaluate(() => window.__frames)) - hiddenFrames, "frames asked for while hidden").toBeLessThanOrEqual(1);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(await turning(page), "turning again when shown").toBe(true);
    // Out of sight: scrolled away, the turn holds.
    await page.evaluate(() => {
      document.body.style.paddingBottom = "4000px";
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(300);
    expect(await turning(page), "turning while out of sight").toBe(false);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    expect(await turning(page), "turning again when back in sight").toBe(true);
    // A whole second of turning made no element.
    await page.waitForTimeout(1000);
    expect(await count()).toBe(elements);
  });
});

test("links each circuit to the district page, where it stands among its surroundings, and that page draws it", async ({ page }) => {
  const errors = await open(page, "circuits.html");
  const href = await page.locator('[data-testid="city"]').getAttribute("href");
  expect(href).toContain("district.html?");
  expect(href).toContain("circuit=las-vegas");
  expect(href).toContain("venues=t-mobile-arena");
  await page.locator('[data-testid="city"]').click();
  await page.waitForSelector('body[data-ready="true"]');
  await expect(page.locator(`${STAGE} g.ky-dist-circuit[data-circuit="las-vegas"]`)).toHaveCount(1);
  expect(errors).toEqual([]);
});
