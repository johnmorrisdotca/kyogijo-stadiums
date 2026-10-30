// The district page stays quick to turn: the 3D view of a district is a few thousand elements, each moved by the browser at every step of a turn, so its cost grows with their number. This holds the numbers that
// decide it (how many planes the view has, how many of them are drawn at once, how many elements the page holds, what a step of a turn costs the page's own script) to a budget a little above where they are, so that
// a change that doubles them is found by the test and not by a reader's laptop. The counts are exact; the time is a loose ceiling (a quarter of what a step cost on a slow runner would still pass a change of tenfold).
/* global PointerEvent, performance */
import { expect, test } from "@playwright/test";

import { serve } from "./demo.mjs";

const STAGE = '[data-testid="stage"]';

// planes: the `.ky-up` elements; drawn: those not left out because they face away from the eye; nodes: every element of the page.
const BUDGETS = [
  { name: "Rogers Arena alone", query: "venues=rogers-arena", planes: 600, drawn: 500, nodes: 2800 },
  { name: "Seattle, three venues", query: "venues=t-mobile-park:mlb,lumen-field:nfl,climate-pledge-arena&mode=city", planes: 2300, drawn: 1900, nodes: 8400 },
  { name: "Tokyo Dome City with the Kodokan", query: "venues=tokyo-dome:mlb,korakuen-hall:boxing,kodokan", planes: 2400, drawn: 1950, nodes: 8400 },
];

// What each lower tier holds the same views to (`quality=` in the address): the planes drawn, which are what a step of the turn costs.
const TIER_BUDGETS = [
  { name: "Rogers Arena alone", query: "venues=rogers-arena", medium: 480, low: 320 },
  { name: "Seattle, three venues", query: "venues=t-mobile-park:mlb,lumen-field:nfl,climate-pledge-arena&mode=city", medium: 320, low: 120 },
  { name: "Tokyo Dome City with the Kodokan", query: "venues=tokyo-dome:mlb,korakuen-hall:boxing,kodokan", medium: 950, low: 120 },
];

for (const budget of TIER_BUDGETS) {
  test(`${budget.name}: each lower tier holds the view to fewer planes`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    await serve(page);
    const planes = {};
    for (const tier of ["high", "medium", "low"]) {
      await page.goto(`http://kyogijo.test/district.html?${budget.query}&view=3d&viewpoint=broadcast&quality=${tier}`);
      await page.waitForSelector('body[data-ready="true"]');
      await page.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
      planes[tier] = await page.evaluate((stage) => document.querySelectorAll(`${stage} .ky-up`).length, STAGE);
    }
    expect(planes.medium, `medium ${JSON.stringify(planes)}`).toBeLessThanOrEqual(budget.medium);
    expect(planes.low, `low ${JSON.stringify(planes)}`).toBeLessThanOrEqual(budget.low);
    expect(planes.medium).toBeLessThan(planes.high);
    expect(planes.low).toBeLessThan(planes.medium);
    expect(errors).toEqual([]);
  });
}

for (const budget of BUDGETS) {
  test(`${budget.name}: the 3D view stays inside its budget of planes and a step of the turn is quick`, async ({ page }, info) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    await serve(page);
    await page.goto(`http://kyogijo.test/district.html?${budget.query}&view=3d&viewpoint=broadcast`);
    await page.waitForSelector('body[data-ready="true"]');
    await page.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
    const counts = await page.evaluate((stage) => {
      const planes = [...document.querySelectorAll(`${stage} .ky-up`)];
      return { planes: planes.length, drawn: planes.filter((el) => el.style.display !== "none").length, nodes: document.querySelectorAll("*").length };
    }, STAGE);
    expect(counts.planes, "planes").toBeLessThanOrEqual(budget.planes);
    expect(counts.drawn, "planes drawn at the opening view").toBeLessThanOrEqual(budget.drawn);
    expect(counts.nodes, "elements in the page").toBeLessThanOrEqual(budget.nodes);
    // The faces that turn away are not drawn: some are left out, and they come back when the view goes round to them.
    const hiddenAt = async () => page.evaluate((stage) => [...document.querySelectorAll(`${stage} .ky-up`)].filter((el) => el.style.display === "none").length, STAGE);
    const before = await hiddenAt();
    const cost = await page.evaluate(async (stage) => {
      const view = document.querySelector(`${stage} .ky-turn-view`);
      const box = view.getBoundingClientRect();
      const fire = (type, x, y) => view.dispatchEvent(new PointerEvent(type, { pointerId: 5, pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y, bubbles: true }));
      const frame = () => new Promise((done) => requestAnimationFrame(() => setTimeout(done, 0)));
      fire("pointerdown", box.left + box.width / 2, box.top + 40);
      const times = [];
      for (let i = 0; i < 40; i += 1) {
        const start = performance.now();
        fire("pointermove", box.left + box.width / 2 + (i + 1) * 12, box.top + 40 + (i % 4));
        times.push(performance.now() - start);
        await frame();
      }
      fire("pointerup", box.left + box.width / 2 + 500, box.top + 40);
      times.sort((a, b) => a - b);
      return times[Math.floor(times.length / 2)];
    }, STAGE);
    expect(before).toBeGreaterThan(0);
    expect(await hiddenAt(), "faces left out after half a turn").toBeGreaterThan(0);
    // The page's own work at a step: about 6 ms for the biggest district on a fast machine; the ceiling is for a runner several times slower.
    if (info.project.name === "chromium-desk") expect(cost, "median ms of script per step").toBeLessThan(60);
    expect(errors).toEqual([]);
  });
}

test("every page of the demo that has a script of modules asks for them all from its head, so that the files come together", async ({ page }) => {
  await serve(page);
  for (const name of ["district.html", "stadiums.html", "venues.html", "halls.html"]) {
    await page.goto(`http://kyogijo.test/${name}`);
    const links = await page.evaluate(() => [...document.querySelectorAll('head link[rel="modulepreload"]')].map((link) => link.getAttribute("href")));
    expect(links.length, name).toBeGreaterThan(100);
    expect(new Set(links).size, `${name} lists a file twice`).toBe(links.length);
    // The files it names are there to be had.
    const statuses = await page.evaluate((list) => Promise.all(list.slice(0, 6).map((href) => fetch(href).then((response) => response.status))), links);
    expect(statuses, name).toEqual(statuses.map(() => 200));
  }
});
