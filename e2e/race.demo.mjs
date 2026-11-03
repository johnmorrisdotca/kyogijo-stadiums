/* global EventTarget, Node */
// The simulated race on the circuits page: the dots, the race clock and the timing board move together at 1×, 10× and 60×, the slider goes anywhere in the race, the board says the leader and the gaps, and the
// address keeps the race, its speed and where it was left. And its freeze and leak rules: no frame asked for while it is paused, hidden or out of sight; nothing made as it plays; destroy leaves nothing.
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
  await page.waitForSelector(path.includes("race=1") ? `${STAGE} .ky-race` : `${STAGE} svg.kyogijo`);
  return errors;
}

const press = async (page, locator, testInfo) => {
  await locator.scrollIntoViewIfNeeded();
  if (testInfo.project.use.hasTouch === true) await locator.tap();
  else await locator.click();
};
const dot = (page, id) => page.locator(`${STAGE} .ky-ci-car[data-car="${id}"]`);
const clock = (page) => page.locator(`${STAGE} .ky-race .ky-clock`);
const seconds = (text) => text.split(":").reduce((sum, part) => sum * 60 + Number(part), 0);

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

test("puts twenty made-up cars on the grid with the clock and the board, and says it is a simulation", async ({ page }) => {
  const errors = await open(page, "circuits.html?race=1");
  await expect(page.locator(`${STAGE} .ky-ci-car`)).toHaveCount(20);
  await expect(clock(page)).toHaveText("0:00");
  await expect(page.locator(`${STAGE} .ky-race .ky-clock-line`)).toHaveText("On the grid");
  await expect(page.locator(`${STAGE} .ky-race-board tbody tr`)).toHaveCount(20);
  await expect(page.locator(`${STAGE} .ky-race-note`)).toContainText("simulated race");
  await expect(page.locator('[data-testid="code"]')).toContainText("mountCircuitRace");
  await noSidewaysScroll(page);
  expect(errors).toEqual([]);
});

test("plays: the dots, the clock and the board move together, faster at 60×, and the slider goes anywhere", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors = await open(page, "circuits.html?race=1");
  const leader = await page.locator(`${STAGE} .ky-race-board tbody tr`).first().getAttribute("data-car");
  const before = await dot(page, leader).getAttribute("transform");
  await press(page, page.locator(`${STAGE} .ky-race .ky-speed[data-speed="60"]`), testInfo);
  await press(page, page.locator(`${STAGE} .ky-race .ky-play`), testInfo);
  await expect(page.locator(`${STAGE} .ky-race`)).toHaveAttribute("data-state", "playing");
  await page.waitForTimeout(1500);
  expect(seconds(await clock(page).textContent())).toBeGreaterThan(30);
  expect(await dot(page, leader).getAttribute("transform")).not.toBe(before);
  await expect(page.locator(`${STAGE} .ky-race-board tbody tr`).nth(1).locator('[data-col="gap"]')).toHaveText(/^\+\d/);
  await press(page, page.locator(`${STAGE} .ky-race .ky-play`), testInfo);
  await expect(page.locator(`${STAGE} .ky-race`)).toHaveAttribute("data-state", "paused");
  // The slider: half way through the race, the lap and the board follow.
  await page.locator(`${STAGE} .ky-race .ky-position`).evaluate((range) => {
    range.value = String(Math.round(Number(range.max) / 2));
    range.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator(`${STAGE} .ky-race .ky-clock-line`)).toHaveText(/^Lap 2[0-9] \/ 50$/);
  await expect(page.locator(`${STAGE} .ky-race-board tbody tr`).first().locator('[data-col="gap"]')).toHaveText("Leader");
  await expect.poll(() => new URL(page.url()).searchParams.get("speed")).toBe("60");
  expect(Number(new URL(page.url()).searchParams.get("t"))).toBeGreaterThan(2000);
  expect(errors).toEqual([]);
});

test("comes back to where it was left, in Japanese, and finishes with the chequered flag", async ({ page }) => {
  const errors = await open(page, "circuits.html?race=1&lang=ja&t=99999");
  await expect(page.locator(`${STAGE} .ky-race .ky-clock-line`)).toHaveText("チェッカーフラッグ");
  await expect(page.locator(`${STAGE} .ky-race-board caption`)).toHaveText("タイミングボード");
  await expect(page.locator(`${STAGE} .ky-race-board tbody tr`).first().locator('[data-col="gap"]')).toHaveText("トップ");
  await expect(page.locator(`${STAGE} .ky-race`)).toHaveAttribute("data-state", "paused");
  expect(errors).toEqual([]);
});

test("in 3D the cars stand on the circuit as discs and move with the clock", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors = await open(page, "circuits.html?race=1&view=3d&speed=60");
  await page.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
  const discs = page.locator(`${STAGE} .ky-up[data-part^="car-"]`);
  await expect(discs).toHaveCount(20);
  const first = discs.first();
  const before = await first.evaluate((el) => el.style.transform);
  await press(page, page.locator(`${STAGE} .ky-race .ky-play`), testInfo);
  await page.waitForTimeout(1200);
  expect(await first.evaluate((el) => el.style.transform)).not.toBe(before);
  expect(await page.locator(`${STAGE} .ky-up`).count()).toBeLessThanOrEqual(120);
  expect(errors).toEqual([]);
});

test("with reduced motion nothing plays by itself: play goes to the leader's next lap", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "circuits.html?race=1");
  // Nothing plays by itself: play, the speeds and loop are not shown, and the step on is the next lap.
  for (const hidden of [".ky-play", ".ky-speeds", ".ky-loop"]) await expect(page.locator(`${STAGE} .ky-race ${hidden}`)).toBeHidden();
  const next = page.locator(`${STAGE} .ky-race .ky-forward`);
  await expect(next).toHaveAttribute("aria-label", "Next lap");
  await press(page, next, testInfo);
  await expect(page.locator(`${STAGE} .ky-race .ky-clock-line`)).toHaveText("Lap 2 / 50");
  await expect(page.locator(`${STAGE} .ky-race`)).toHaveAttribute("data-state", "paused");
  const frames = await page.evaluate(() => window.__frames);
  await page.waitForTimeout(500);
  expect((await page.evaluate(() => window.__frames)) - frames).toBe(0);
});

test("Markers: the turn numbers are on with no race, off while a race plays, a button brings them back, the address keeps it, and the map's credit always stays", async ({ page }, testInfo) => {
  const pins = (view) => (view === "3d" ? page.locator(`${STAGE} .ky-up[data-part^="turn-"]`) : page.locator(`${STAGE} .ky-ci-turn`));
  const credit = page.locator(`${STAGE} svg.kyogijo text.ky-ci-credit`);
  const creditText = /OpenStreetMap contributors/;
  // No race: the pins stand, and Markers is pressed in.
  await open(page, "circuits.html");
  await expect(pins("flat")).toHaveCount(17);
  await expect(page.locator('[data-testid="markers"]')).toBeChecked();
  await expect(credit.first()).toHaveText(creditText);
  // The race: off, unless the address says.
  await open(page, "circuits.html?race=1");
  await expect(pins("flat")).toHaveCount(0);
  await expect(page.locator('[data-testid="markers"]')).not.toBeChecked();
  await expect(credit.first()).toHaveText(creditText);
  await expect(page.locator(`${STAGE} .ky-ci-car`)).toHaveCount(20);
  expect(new URL(page.url()).searchParams.get("markers")).toBeNull();
  // Pressed in, they come back over the race, and the address says so; pressed out, they go and it says that.
  await press(page, page.locator('[data-testid="markers"]').locator(".."), testInfo);
  await expect(pins("flat")).toHaveCount(17);
  await expect(page.locator(`${STAGE} .ky-ci-car`)).toHaveCount(20);
  await expect.poll(() => new URL(page.url()).searchParams.get("markers")).toBe("1");
  await press(page, page.locator('[data-testid="markers"]').locator(".."), testInfo);
  await expect(pins("flat")).toHaveCount(0);
  await expect.poll(() => new URL(page.url()).searchParams.get("markers")).toBe("0");
  await expect(credit.first()).toHaveText(creditText);
  // The address brings it back, flat and in 3D (a view with no pin stands none; the pit building stays).
  await open(page, "circuits.html?race=1&markers=1");
  await expect(pins("flat")).toHaveCount(17);
  await open(page, "circuits.html?race=1&view=3d");
  await page.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
  await expect(pins("3d")).toHaveCount(0);
  await expect(page.locator(`${STAGE} .ky-up[data-part^="pit-"]`).first()).toBeAttached();
  await open(page, "circuits.html?race=1&view=3d&markers=1");
  await page.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
  expect(await pins("3d").count()).toBeGreaterThanOrEqual(17);
  await expect(credit.first()).toHaveText(creditText);
});

test("Car labels: the position numbers on the dots go and come back, and the address keeps it", async ({ page }, testInfo) => {
  await open(page, "circuits.html?race=1");
  const number = page.locator(`${STAGE} .ky-ci-car-n`).first();
  await expect(number).toBeVisible();
  await press(page, page.locator('[data-testid="carlabels"]').locator(".."), testInfo);
  await expect(number).toBeHidden();
  await expect(page.locator(`${STAGE} .ky-ci-car`)).toHaveCount(20);
  await expect.poll(() => new URL(page.url()).searchParams.get("labels")).toBe("0");
  await open(page, "circuits.html?race=1&labels=0");
  await expect(page.locator(`${STAGE} .ky-ci-car-n`).first()).toBeHidden();
  await expect(page.locator('[data-testid="carlabels"]')).not.toBeChecked();
  // The leader's mark is there with the numbers off.
  await expect(page.locator(`${STAGE} .ky-ci-lead`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} .ky-ci-lead-p`)).toBeVisible();
});

test("the leader's mark: one ring and a P1 tag on the first car, moving with it, handed on at a pass, and on whatever Markers and Car labels say", async ({ page }) => {
  await open(page, "circuits.html?race=1&labels=0&speed=60");
  const mark = page.locator(`${STAGE} .ky-ci-lead`);
  await expect(mark).toHaveCount(1);
  const first = () => page.locator(`${STAGE} .ky-race-board tbody tr`).first().getAttribute("data-car");
  const onLeader = async () => {
    const id = await first();
    expect(await mark.getAttribute("data-car")).toBe(id);
    expect(await mark.getAttribute("transform")).toBe(await dot(page, id).getAttribute("transform"));
    return id;
  };
  await onLeader();
  // The board's first row is the highlighted one.
  expect(await page.locator(`${STAGE} .ky-race-board tbody tr`).first().evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
  expect(await page.locator(`${STAGE} .ky-race-board tbody tr`).nth(1).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
  // Through the race: at every moment sampled the mark is on the first car, and it was handed on at least once.
  const leaders = new Set();
  for (const fraction of [0.05, 0.12, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]) {
    await page.locator(`${STAGE} .ky-race .ky-position`).evaluate((range, f) => {
      range.value = String(Math.round(Number(range.max) * f));
      range.dispatchEvent(new Event("input", { bubbles: true }));
    }, fraction);
    leaders.add(await onLeader());
  }
  expect(leaders.size).toBeGreaterThan(1);
  // The ring and the tag are drawn (a ring, a halo, a tag and its word) and are not hidden by the other cars: nothing is drawn after the mark.
  expect(await mark.locator(".ky-ci-lead-halo, .ky-ci-lead-ring, .ky-ci-lead-tag, .ky-ci-lead-p").count()).toBe(4);
  expect(await page.locator(`${STAGE} svg.kyogijo > g:last-child`).evaluate((el) => el.classList.contains("ky-ci-lead"))).toBe(true);
});

test("the leader's mark in 3D: a ring and a tag stand with the first car's disc and move with it", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "circuits.html?race=1&view=3d&speed=60&labels=0");
  await page.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
  const ring = page.locator(`${STAGE} .ky-up[data-part="lead-ring"]`);
  const tag = page.locator(`${STAGE} .ky-up[data-part="lead-tag"]`);
  await expect(ring).toHaveCount(1);
  await expect(tag).toHaveCount(1);
  const before = await ring.evaluate((el) => el.style.transform);
  await press(page, page.locator(`${STAGE} .ky-race .ky-play`), testInfo);
  await page.waitForTimeout(1200);
  expect(await ring.evaluate((el) => el.style.transform)).not.toBe(before);
  expect(await tag.evaluate((el) => el.style.transform)).not.toBe("");
  await expect(tag.locator("text")).toHaveText("P1");
});

/** Move the race's slider to a share of the race (a seek: everything is written at once). */
const seekTo = (page, fraction) =>
  page.locator(`${STAGE} .ky-race .ky-position`).evaluate((range, f) => {
    range.value = String(Math.round(Number(range.max) * f));
    range.dispatchEvent(new Event("input", { bubbles: true }));
  }, fraction);
const boardRows = (page) => page.locator(`${STAGE} .ky-race-board tbody tr`);
const towerRows = (page, scope) => page.locator(`${scope} .ky-tw-row:not([display="none"])`);

test.describe("the racing scoreboard", () => {
  test("the timing tower beside the straight says what the timing board says, at every moment sampled", async ({ page }) => {
    await open(page, "circuits.html?race=1&overlay=1");
    await expect(page.locator(`${STAGE} .ky-ci-tower`)).toHaveCount(1);
    await expect(page.locator(`${STAGE} .ky-race-overlay .ky-tw`)).toBeVisible();
    for (const fraction of [0, 0.03, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.97]) {
      await seekTo(page, fraction);
      const board = await boardRows(page).evaluateAll((rows) => rows.slice(0, 10).map((r) => ({ id: r.dataset.car, code: r.querySelector(".ky-race-code").textContent, gap: r.querySelector('[data-col="gap"]').textContent, status: r.dataset.status })));
      for (const scope of [`${STAGE} .ky-ci-tower`, `${STAGE} .ky-race-overlay`]) {
        const rows = await towerRows(page, scope).evaluateAll((els) => els.map((r) => ({ pos: r.querySelector('[data-t="pos"]').textContent, code: r.querySelector('[data-t="code"]').textContent, gap: r.querySelector('[data-t="gap"]').textContent })));
        expect(rows.map((r) => r.code), `${scope} at ${fraction}`).toEqual(board.map((b) => b.code));
        expect(rows.map((r) => r.pos)).toEqual(board.map((_, i) => String(i + 1)));
        // The gap is the board's, but for the pit lane (PIT) and for the winner once it has the flag (its race time).
        rows.forEach((r, i) => {
          if (board[i].status === "pit") expect(r.gap).toBe("PIT");
          else if (i === 0 && board[i].status === "finished") expect(r.gap).toMatch(/^\d+:\d\d(:\d\d)?\.\d{3}$/);
          else expect(r.gap).toBe(board[i].gap);
        });
      }
    }
    await expect(page.locator(`${STAGE} .ky-ci-tower .ky-tw-stage`)).toHaveText(/^Lap \d+ \/ 50/);
  });

  test("the tower has its flag and its fastest lap, and the winner's tag turns into the chequered flag at the flag", async ({ page }) => {
    await open(page, "circuits.html?race=1");
    await seekTo(page, 0);
    await expect(page.locator(`${STAGE} .ky-ci-tower .ky-tw`)).toHaveAttribute("data-flag", "grid");
    await expect(page.locator(`${STAGE} .ky-ci-lead`)).toHaveAttribute("data-flag", "false");
    await seekTo(page, 0.4);
    await expect(page.locator(`${STAGE} .ky-ci-tower .ky-tw`)).toHaveAttribute("data-flag", "green");
    await expect(page.locator(`${STAGE} .ky-ci-tower .ky-tw-fast`)).toHaveText(/^FL [A-Z]{3} \d:\d\d\.\d{3} L\d+$/);
    await expect(page.locator(`${STAGE} .ky-ci-lead-p`)).toBeVisible();
    await expect(page.locator(`${STAGE} .ky-ci-lead-chq`)).toBeHidden();
    await seekTo(page, 1);
    await expect(page.locator(`${STAGE} .ky-ci-tower .ky-tw`)).toHaveAttribute("data-flag", "chequered");
    await expect(page.locator(`${STAGE} .ky-ci-tower .ky-tw-stage`)).toHaveText("Chequered flag");
    await expect(page.locator(`${STAGE} .ky-ci-lead`)).toHaveAttribute("data-flag", "true");
    await expect(page.locator(`${STAGE} .ky-ci-lead-chq`)).toBeVisible();
    await expect(page.locator(`${STAGE} .ky-ci-lead-p`)).toBeHidden();
  });

  test("the overlay is off until asked, comes back from its button and the address, and the scene's tower can be left out", async ({ page }, testInfo) => {
    await open(page, "circuits.html?race=1");
    await expect(page.locator(`${STAGE} .ky-race-overlay`)).toBeHidden();
    await expect(page.locator('[data-testid="overlay"]')).not.toBeChecked();
    expect(new URL(page.url()).searchParams.get("overlay")).toBeNull();
    await press(page, page.locator('[data-testid="overlay"]').locator(".."), testInfo);
    await expect(page.locator(`${STAGE} .ky-race-overlay .ky-tw`)).toBeVisible();
    await expect.poll(() => new URL(page.url()).searchParams.get("overlay")).toBe("1");
    await open(page, "circuits.html?race=1&overlay=1");
    await expect(page.locator(`${STAGE} .ky-race-overlay`)).toBeVisible();
    await expect(page.locator('[data-testid="overlay"]')).toBeChecked();
  });

  test("the podium comes at the flag with the first three in the finishing order and the fastest lap, closes, comes back from its button, and is taken back with the race", async ({ page }, testInfo) => {
    await open(page, "circuits.html?race=1");
    const card = page.locator(`${STAGE} .ky-race-podium`);
    const button = page.locator(`${STAGE} .ky-race-podium-button`);
    await seekTo(page, 0.5);
    await expect(card).toBeHidden();
    await expect(button).toBeHidden();
    await seekTo(page, 1);
    await expect(card).toBeVisible();
    await expect(button).toBeVisible();
    // Exactly the board's first three, in order: the names and teams, the winner's time and the gaps.
    const board = await boardRows(page).evaluateAll((rows) => rows.slice(0, 3).map((r) => ({ name: r.querySelector(".ky-race-name").textContent, team: r.querySelector('[data-col="team"]').textContent, gap: r.querySelector('[data-col="gap"]').textContent })));
    const lines = await card.locator("li").evaluateAll((els) => els.map((li) => ({ name: li.querySelector("b").textContent, team: li.querySelector("small").textContent, time: li.querySelector(".ky-podium-time").textContent })));
    expect(lines.map((l) => l.name)).toEqual(board.map((b) => b.name));
    expect(lines.map((l) => l.team)).toEqual(board.map((b) => b.team));
    expect(lines[0].time).toMatch(/^\d:\d\d:\d\d\.\d{3}$/);
    expect(lines[1].time).toBe(board[1].gap);
    expect(lines[2].time).toBe(board[2].gap);
    await expect(card.locator(".ky-podium-fast")).toHaveText(/^Fastest lap: [A-Z]{3} \S+, \d:\d\d\.\d{3}, lap \d+$/);
    await expect(card).toHaveAttribute("data-final", "true");
    // Closed, it stays away while the race goes round after the flag; the button brings it back.
    await press(page, card.locator(".ky-podium-close"), testInfo);
    await expect(card).toBeHidden();
    await seekTo(page, 0.999);
    await expect(card).toBeHidden();
    await press(page, button, testInfo);
    await expect(card).toBeVisible();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    // Taken back before the flag it goes, and the button with it; at the flag again it comes by itself, closed or not.
    await press(page, card.locator(".ky-podium-close"), testInfo);
    await seekTo(page, 0.5);
    await expect(button).toBeHidden();
    await seekTo(page, 1);
    await expect(card).toBeVisible();
  });

  test("the podium is in Japanese too, and the tower says its words", async ({ page }) => {
    await open(page, "circuits.html?race=1&lang=ja&t=99999");
    await expect(page.locator(`${STAGE} .ky-race-podium .ky-podium-title`)).toHaveText("チェッカーフラッグ");
    await expect(page.locator(`${STAGE} .ky-race-podium-button`)).toHaveText("表彰台");
    await expect(page.locator(`${STAGE} .ky-race-podium .ky-podium-fast`)).toContainText("ファステストラップ");
    await expect(page.locator(`${STAGE} .ky-ci-tower .ky-tw-stage`)).toHaveText("チェッカーフラッグ");
  });

  test("in 3D the tower stands on a post by the straight, and its words and flag follow the race", async ({ page }) => {
    await open(page, "circuits.html?race=1&view=3d&overlay=1&t=99999");
    await page.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
    const tower = page.locator(`${STAGE} .ky-up[data-part="tower"]`);
    await expect(tower).toHaveCount(1);
    await expect(page.locator(`${STAGE} .ky-up[data-part="tower-post"], ${STAGE} .ky-up[data-part^="tower-post"]`).first()).toBeAttached();
    await expect(tower.locator(".ky-tw")).toHaveAttribute("data-flag", "chequered");
    await expect(tower.locator(".ky-tw-stage")).toHaveText("Chequered flag");
    await expect(page.locator(`${STAGE} .ky-up[data-part="lead-tag"]`)).toHaveAttribute("data-flag", "true");
    await seekTo(page, 0.4);
    await expect(tower.locator(".ky-tw")).toHaveAttribute("data-flag", "green");
    await expect(tower.locator(".ky-tw-stage")).toHaveText(/^Lap \d+ \/ 50$/);
    await expect(page.locator(`${STAGE} .ky-race-podium`)).toBeHidden();
  });

  test("the tower writes nothing while the race is paused and only a few times a second while it plays", async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await open(page, "circuits.html?race=1&overlay=1&speed=60");
    await page.evaluate(() => {
      window.__writes = 0;
      const watch = new MutationObserver((records) => { window.__writes += records.length; });
      for (const root of document.querySelectorAll(".ky-ci-tower, .ky-race-overlay")) watch.observe(root, { subtree: true, characterData: true, childList: true, attributes: true });
    });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => window.__writes), "writes while paused").toBe(0);
    await press(page, page.locator(`${STAGE} .ky-race .ky-play`), testInfo);
    await page.evaluate(() => { window.__writes = 0; });
    await page.waitForTimeout(2000);
    const playing = await page.evaluate(() => window.__writes);
    expect(playing, "the tower is written while it plays").toBeGreaterThan(0);
    // Two towers (the scene's and the overlay), each at most four times a second, each write a handful of changed texts: far fewer than a frame at a time.
    expect(playing).toBeLessThan(2 * 4 * 2 * 24);
    await press(page, page.locator(`${STAGE} .ky-race .ky-play`), testInfo);
    await page.evaluate(() => { window.__writes = 0; });
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.__writes), "writes after it paused").toBe(0);
  });
});

/** The viewBox of the flat race's drawing, as numbers, and where the leader's mark is in it. */
const viewBoxOf = (page) => page.locator(`${STAGE} svg.kyogijo`).first().evaluate((el) => el.getAttribute("viewBox").split(/\s+/).map(Number));
const leaderIn = (page) =>
  page.evaluate((stage) => {
    const svg = document.querySelector(`${stage} svg.kyogijo`);
    const [x, y, w, h] = svg.getAttribute("viewBox").split(/\s+/).map(Number);
    const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(svg.querySelector(".ky-ci-lead").getAttribute("transform"));
    const [px, py] = [Number(m[1]), Number(m[2])];
    return { inside: px >= x && px <= x + w && py >= y && py <= y + h, w };
  }, STAGE);

test.describe("the race's camera", () => {
  test.use({ reducedMotion: "no-preference" });

  test("follows the leader: close in on them with the credit in sight, the leader in the frame, and the whole circuit again when it is let go", async ({ page }, testInfo) => {
    await open(page, "circuits.html?race=1&t=900");
    const whole = await viewBoxOf(page);
    await expect(page.locator(`${STAGE} .ky-race-credit`)).toBeHidden();
    await open(page, "circuits.html?race=1&t=900&follow=leader");
    await expect(page.locator(`${STAGE} .ky-race .ky-follow-leader`)).toHaveAttribute("aria-pressed", "true");
    const close = await viewBoxOf(page);
    expect(close[2]).toBeLessThan(whole[2] / 3);
    expect(close[2] / close[3]).toBeCloseTo(whole[2] / whole[3], 1);
    expect((await leaderIn(page)).inside).toBe(true);
    // The map's credit is text outside the drawing while the drawing's own is out of the frame.
    await expect(page.locator(`${STAGE} .ky-race-credit`)).toBeVisible();
    await expect(page.locator(`${STAGE} .ky-race-credit`)).toContainText("OpenStreetMap contributors");
    // The pack: a wider frame than the leader alone.
    await press(page, page.locator(`${STAGE} .ky-race .ky-follow-pack`), testInfo);
    await expect(page.locator(`${STAGE} .ky-race .ky-follow-pack`)).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => new URL(page.url()).searchParams.get("follow")).toBe("pack");
    const pack = await viewBoxOf(page);
    expect(pack[2]).toBeGreaterThanOrEqual(close[2] - 1e-6);
    expect(pack[2]).toBeLessThan(whole[2]);
    // Pressed again, it lets go: the whole circuit, the credit back in the drawing, and nothing in the address.
    await press(page, page.locator(`${STAGE} .ky-race .ky-follow-pack`), testInfo);
    await expect.poll(() => viewBoxOf(page)).toEqual(whole);
    await expect(page.locator(`${STAGE} .ky-race-credit`)).toBeHidden();
    await expect.poll(() => new URL(page.url()).searchParams.get("follow")).toBeNull();
  });

  test("zooms in slowly while the race plays, and keeps the leader in view through it at 60 times", async ({ page }, testInfo) => {
    await open(page, "circuits.html?race=1&t=300&speed=60");
    const whole = await viewBoxOf(page);
    await press(page, page.locator(`${STAGE} .ky-race .ky-play`), testInfo);
    await press(page, page.locator(`${STAGE} .ky-race .ky-follow-leader`), testInfo);
    const widths = [];
    for (let i = 0; i < 10; i += 1) {
      await page.waitForTimeout(450);
      const seen = await leaderIn(page);
      expect(seen.inside, `the leader in view at sample ${i}`).toBe(true);
      widths.push(seen.w);
    }
    // Slowly: not the whole circuit and not the close shot at the first sample, and always closer.
    expect(widths[0]).toBeLessThan(whole[2]);
    expect(widths[0]).toBeGreaterThan(widths[widths.length - 1]);
    expect(widths[widths.length - 1]).toBeLessThan(whole[2] / 2);
    for (let i = 1; i < widths.length; i += 1) expect(widths[i]).toBeLessThanOrEqual(widths[i - 1] * 1.02);
  });

  test("in 3D Auto-follow stands right after Auto-turn in the view's buttons, looks the same, and both can be on at once", async ({ page }, testInfo) => {
    await open(page, "circuits.html?race=1&view=3d&t=900&speed=10");
    await page.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
    const next = page.locator(`${STAGE} .ky-turn-controls [data-act="play"] + [data-act="follow"]`);
    await expect(next).toHaveCount(1);
    await expect(next).toHaveText("Auto-follow");
    await expect(next).toHaveAttribute("aria-pressed", "false");
    // The same pill: the same height, radius and font as Auto-turn.
    const look = (loc) => loc.evaluate((el) => { const c = getComputedStyle(el); return [c.height, c.borderRadius, c.fontSize, c.fontWeight, c.paddingLeft]; });
    expect(await look(next)).toEqual(await look(page.locator(`${STAGE} .ky-turn-controls [data-act="play"]`)));
    await press(page, next, testInfo);
    await expect(next).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => new URL(page.url()).searchParams.get("follow")).toBe("leader");
    await expect(page.locator(`${STAGE} .ky-race .ky-follow-leader`)).toHaveAttribute("aria-pressed", "true");
    // Auto-turn on as well: both pressed, the view turning and the camera on the leader (the leader's ring stays inside the view).
    await press(page, page.locator(`${STAGE} .ky-turn-controls [data-act="play"]`), testInfo);
    await expect(page.locator(`${STAGE} .ky-turn-controls [data-act="play"]`)).toHaveAttribute("aria-pressed", "true");
    await expect(next).toHaveAttribute("aria-pressed", "true");
    await press(page, page.locator(`${STAGE} .ky-race .ky-play`), testInfo);
    const yaw = () => page.locator(`${STAGE} .ky-up[data-part="lead-ring"]`).evaluate((el) => el.style.transform);
    const before = await yaw();
    for (let i = 0; i < 5; i += 1) {
      await page.waitForTimeout(400);
      const inView = await page.evaluate((stage) => {
        const ring = document.querySelector(`${stage} .ky-up[data-part="lead-ring"]`).getBoundingClientRect();
        const view = document.querySelector(`${stage} .ky-turn-view`).getBoundingClientRect();
        return ring.left >= view.left - 1 && ring.right <= view.right + 1 && ring.top >= view.top - 1 && ring.bottom <= view.bottom + 1;
      }, STAGE);
      expect(inView, `the leader in the 3D view at sample ${i}`).toBe(true);
    }
    expect(await yaw()).not.toBe(before);
    // Pressed again, it lets go, and the address says nothing.
    await press(page, next, testInfo);
    await expect(next).toHaveAttribute("aria-pressed", "false");
    await expect.poll(() => new URL(page.url()).searchParams.get("follow")).toBeNull();
  });

  test("in 3D the reader's own turn holds the camera until Resume, and a viewpoint takes it back to the whole circuit", async ({ page }, testInfo) => {
    await open(page, "circuits.html?race=1&view=3d&t=900&follow=leader");
    await page.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
    const resume = page.locator(`${STAGE} .ky-race .ky-follow-resume`);
    await expect(resume).toBeHidden();
    await press(page, page.locator(`${STAGE} .ky-turn-controls [data-act="turn-left"]`), testInfo);
    await expect(resume).toBeVisible();
    await press(page, resume, testInfo);
    await expect(resume).toBeHidden();
    await press(page, page.locator(`${STAGE} .ky-turn-controls [data-preset="overhead"]`), testInfo);
    await expect(resume).toBeVisible();
  });

  test("with reduced motion the camera steps: it goes to the leader at once at each step and nothing glides", async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "circuits.html?race=1&t=900&follow=leader");
    const frames = await page.evaluate(() => window.__frames);
    expect((await leaderIn(page)).inside).toBe(true);
    await press(page, page.locator(`${STAGE} .ky-race .ky-forward`), testInfo);
    expect((await leaderIn(page)).inside).toBe(true);
    await page.waitForTimeout(400);
    expect((await page.evaluate(() => window.__frames)) - frames).toBe(0);
  });
});

test.describe("the race's freeze and leak rules", () => {
  for (const [view, follow] of [["flat", "off"], ["3d", "off"], ["flat", "leader"], ["3d", "leader"]]) {
    test(`${view}, camera ${follow}: asks for no frame while paused, hidden or out of sight, makes nothing as it plays, and leaves nothing when it goes`, async ({ page }, testInfo) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await open(page, `circuits.html?race=1&speed=60${view === "3d" ? "&view=3d" : ""}${follow === "off" ? "" : `&follow=${follow}`}`);
      if (view === "3d") await page.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
      await page.mouse.move(0, 0);
      const count = () => page.evaluate((stage) => document.querySelector(stage).querySelectorAll("*").length, STAGE);
      const frames = () => page.evaluate(() => window.__frames);
      // Paused: nothing asked for, nothing changed.
      await page.waitForTimeout(400);
      let at = await frames();
      await page.waitForTimeout(800);
      expect((await frames()) - at, "frames while paused").toBe(0);
      const elements = await count();
      const play = page.locator(`${STAGE} .ky-race .ky-play`);
      await press(page, play, testInfo);
      await page.waitForTimeout(1000);
      expect(await count(), "elements made while it plays").toBe(elements);
      // Hidden: the race stops, and asks for no frame.
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
        Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await expect(page.locator(`${STAGE} .ky-race`)).toHaveAttribute("data-state", "paused");
      at = await frames();
      await page.waitForTimeout(600);
      expect((await frames()) - at, "frames while hidden").toBeLessThanOrEqual(1);
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
        Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      // Out of sight: playing, but scrolled away, it asks for no frame and the clock holds; back in sight it goes on.
      await press(page, play, testInfo);
      await expect(page.locator(`${STAGE} .ky-race`)).toHaveAttribute("data-state", "playing");
      await page.evaluate(() => {
        document.body.style.paddingBottom = "6000px";
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(400);
      const held = await clock(page).textContent();
      at = await frames();
      await page.waitForTimeout(700);
      expect((await frames()) - at, "frames while out of sight").toBeLessThanOrEqual(1);
      expect(await clock(page).textContent()).toBe(held);
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.poll(async () => seconds(await clock(page).textContent())).toBeGreaterThan(seconds(held));
      expect(await count(), "elements after it played again").toBe(elements);
      // Gone: the race turned off leaves no element of its own and asks for no frame.
      await page.locator("#race").evaluate((box) => {
        box.checked = false;
        box.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await expect(page.locator(`${STAGE} .ky-race`)).toHaveCount(0);
      // (The plain view that takes its place settles its own drawing first, and turns while the pointer rests on it: the pointer is moved away.)
      await page.mouse.move(0, 0);
      await page.waitForTimeout(1500);
      at = await frames();
      await page.waitForTimeout(600);
      expect((await frames()) - at, "frames after it went").toBe(0);
    });
  }
});

/**
 * Counts the page keeps from its first line (as the 3D replay's budgets do): every animation frame asked for and how many were asked within one frame, the requests still waiting, and the listeners that can still be
 * called (on the window, the document, a media query or an element still in the page).
 */
const COUNTERS = () => {
  const ask = window.requestAnimationFrame.bind(window);
  const drop = window.cancelAnimationFrame.bind(window);
  const pending = new Set();
  window.__counts = { asked: 0, most: 0, now: undefined, frame: undefined, inNow: 0 };
  window.requestAnimationFrame = (callback) => {
    const f = window.__counts;
    f.asked += 1;
    if (f.now !== undefined) {
      f.inNow += 1;
      f.most = Math.max(f.most, f.inNow);
    }
    const id = ask((stamp) => {
      pending.delete(id);
      // Every callback of one frame has the same time: the requests made in them all are counted together.
      if (f.frame !== stamp) [f.frame, f.inNow] = [stamp, 0];
      f.now = stamp;
      try {
        callback(stamp);
      } finally {
        f.now = undefined;
      }
    });
    pending.add(id);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    pending.delete(id);
    drop(id);
  };
  window.__pending = () => pending.size;
  const add = EventTarget.prototype.addEventListener;
  const remove = EventTarget.prototype.removeEventListener;
  const live = new Map();
  const keys = new WeakMap();
  const names = new Map();
  window.__listening = () => [...live.entries()].filter(([, ref]) => { const t = ref.deref(); return t !== undefined && (!(t instanceof Node) || t === document || t.isConnected); }).map(([id]) => names.get(id));
  window.__listeners = () => {
    let n = 0;
    for (const ref of live.values()) {
      const target = ref.deref();
      if (target !== undefined && (!(target instanceof Node) || target === document || target.isConnected)) n += 1;
    }
    return n;
  };
  const key = (target, type, listener, options) => {
    const capture = typeof options === "boolean" ? options : options?.capture === true;
    let ids = keys.get(target);
    if (ids === undefined) keys.set(target, (ids = new Map()));
    const name = `${type}|${capture}`;
    let byListener = ids.get(name);
    if (byListener === undefined) ids.set(name, (byListener = new Map()));
    return byListener;
  };
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (listener !== null && listener !== undefined) {
      const byListener = key(this, type, listener, options);
      if (!byListener.has(listener)) {
        const id = Symbol(type);
        byListener.set(listener, id);
        live.set(id, new WeakRef(this));
        names.set(id, `${type} on ${this === window ? "window" : this === document ? "document" : this.constructor?.name}`);
      }
    }
    return add.call(this, type, listener, options);
  };
  EventTarget.prototype.removeEventListener = function (type, listener, options) {
    const byListener = key(this, type, listener, options);
    const id = byListener.get(listener);
    if (id !== undefined) {
      live.delete(id);
      byListener.delete(listener);
    }
    return remove.call(this, type, listener, options);
  };
};

/** A page with nothing on it but the package and a box for the race: on the circuit's own drawing, or on a district's ground (`mountDistrictRace`, the Strip Circuit beside T-Mobile Arena). */
async function bare(page, ground = "circuit") {
  await page.addInitScript(COUNTERS);
  await serve(page);
  await page.route("http://kyogijo.test/bare.html", (route) => route.fulfill({ contentType: "text/html", body: '<!doctype html><meta charset="utf-8"><body style="margin:0"><div id="race" style="width:900px"></div></body>' }));
  await page.goto("http://kyogijo.test/bare.html");
  await page.evaluate(async (on) => {
    const race = { circuit: "las-vegas", laps: 3, cars: 8, seed: 4 };
    const mount =
      on === "district"
        ? ((m) => (host, settings) => m.mountDistrictRace(host, { venues: ["t-mobile-arena"], labels: true, ...race }, settings))(await import("./dist/district-entry.js"))
        : ((m) => (host, settings) => m.mountCircuitRace(host, race, settings))(await import("./dist/circuits-entry.js"));
    window.__mount = (settings = {}) => {
      window.__race = mount(document.querySelector("#race"), { motion: "smooth", speed: 600, ...settings });
      return window.__race.state().duration;
    };
  }, ground);
}

test.describe("the race on a bare page: its budgets", () => {
  test.use({ reducedMotion: "no-preference" });

  for (const [ground, view, follow] of [["circuit", "flat", "off"], ["circuit", "3d", "off"], ["circuit", "flat", "leader"], ["circuit", "3d", "leader"], ["circuit", "3d", "pack"], ["district", "flat", "off"], ["district", "3d", "off"], ["district", "flat", "leader"], ["district", "3d", "leader"]]) {
    const on = ground === "district" ? "on a district's ground, " : "";
    test(`${on}${view}, camera ${follow}: grows nothing over ten races, the same elements and the same listeners`, async ({ page, browserName }) => {
      test.setTimeout(120_000);
      await bare(page, ground);
      const cdp = browserName === "chromium" ? await page.context().newCDPSession(page) : undefined;
      const heap = async () => {
        if (cdp === undefined) return 0;
        await cdp.send("HeapProfiler.collectGarbage");
        return (await cdp.send("Runtime.getHeapUsage")).usedSize;
      };
      await page.evaluate(([v, f]) => window.__mount({ view: v, follow: f }), [view, follow]);
      if (view === "3d") await page.waitForSelector('#race .ky-turn[data-mode="3d"]');
      const once = () =>
        page.evaluate(
          () =>
            new Promise((done) => {
              const race = window.__race;
              race.seek(0);
              race.play();
              const wait = () => (race.state().ended ? done({ nodes: document.querySelector("#race").querySelectorAll("*").length, listeners: window.__listeners() }) : setTimeout(wait, 50));
              wait();
            }),
        );
      const first = await once();
      const before = await heap();
      let last = first;
      for (let i = 0; i < 9; i += 1) last = await once();
      const after = await heap();
      expect(last).toEqual(first);
      if (cdp !== undefined) expect(after).toBeLessThan(before * 1.15 + 2_000_000);
    });

    test(`${on}${view}, camera ${follow}: asks for one frame a frame while it plays, with the 3D view's auto-turn too, and none once it is paused`, async ({ page }) => {
      await bare(page, ground);
      await page.evaluate(([v, f]) => window.__mount({ view: v, speed: f === "off" ? 1 : 60, follow: f }), [view, follow]);
      if (view === "3d") await page.waitForSelector('#race .ky-turn[data-mode="3d"]');
      await page.waitForTimeout(1200);
      await page.evaluate(() => {
        window.__race.play();
        window.__race.turn?.play();
        window.__counts.most = 0;
      });
      await page.waitForTimeout(800);
      expect(await page.evaluate(() => window.__counts.most)).toBeLessThanOrEqual(1);
      await page.evaluate(() => {
        window.__race.pause();
        window.__race.turn?.pause();
      });
      await page.waitForTimeout(400);
      const asked = await page.evaluate(() => window.__counts.asked);
      await page.waitForTimeout(600);
      expect((await page.evaluate(() => window.__counts.asked)) - asked).toBe(0);
    });

    test(`${on}${view}, camera ${follow}: destroy takes everything away, playing or not`, async ({ page }) => {
      await bare(page, ground);
      // (The test's own tool listens on the window once it first waits for an element: it does so before the count is taken.)
      await page.waitForSelector("#race", { state: "attached" });
      const empty = await page.evaluate(() => window.__listening());
      await page.evaluate(([v, f]) => window.__mount({ view: v, speed: 60, follow: f }), [view, follow]);
      if (view === "3d") await page.waitForSelector('#race .ky-turn[data-mode="3d"]');
      await page.evaluate(() => {
        window.__race.play();
        window.__race.turn?.play();
      });
      await page.waitForTimeout(300);
      await page.evaluate(() => window.__race.destroy());
      expect(await page.evaluate(() => document.querySelector("#race").childElementCount)).toBe(0);
      expect(await page.evaluate(() => window.__listening())).toEqual(empty);
      await page.waitForTimeout(100);
      const asked = await page.evaluate(() => window.__counts.asked);
      await page.waitForTimeout(500);
      expect((await page.evaluate(() => window.__counts.asked)) - asked).toBe(0);
      expect(await page.evaluate(() => window.__pending())).toBe(0);
    });
  }
});
