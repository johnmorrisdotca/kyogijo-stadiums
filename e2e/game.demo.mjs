// Play a game, wherever a view can play one: the real arenas' page in 3D and the home page's Try it surface, flat and in 3D. The index of the games decides where the button is (a fake index
// with a game for another surface gives that surface the button, with no other change); the game loads on the first press only; the moment is kept across a change of arena, of view, of crowd
// and of theme; another surface or the flat arena stops it and leaves nothing; and the freeze and leak budgets of the replay hold on these pages too.
import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { at, open, pickSurface, serve } from "./demo.mjs";
import { COUNTERS, framesOver } from "./budget.lib.mjs";

const GAME = "canada-japan.json";
const asked = (page) => {
  const urls = [];
  page.on("request", (request) => urls.push(request.url()));
  return () => urls.filter((url) => url.endsWith(GAME)).length;
};

/** The real arenas' page, with the counters from its first line. */
async function venues(page, query = "") {
  await page.addInitScript(COUNTERS);
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await serve(page);
  await page.goto(`http://kyogijo.test/venues.html${query}`);
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
  return errors;
}

/** The replay's slider in a box: where the game is, and to put it somewhere. */
const position = (page, box) => page.locator(`${box} .ky-position`);
const timeIn = (page, box) => position(page, box).evaluate((el) => Number(el.value));
const seek = (page, box, value) =>
  position(page, box).evaluate((el, to) => {
    el.value = String(to);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
/** Whether the replay in a box plays (`playing`, `paused` or `ended`), and to pause or play it with its own button. */
const replayState = (page, box) => page.locator(`${box} .ky-replay[data-state]`).getAttribute("data-state");
const pause = async (page, box) => {
  if ((await replayState(page, box)) === "playing") await page.locator(`${box} .ky-replay .ky-play`).click();
  await expect.poll(() => replayState(page, box)).not.toBe("playing");
};
const play = async (page, box) => {
  if ((await replayState(page, box)) !== "playing") await page.locator(`${box} .ky-replay .ky-play`).click();
  await expect.poll(() => replayState(page, box)).toBe("playing");
};

test.describe("Play a game on the real arenas", () => {
  test.use({ reducedMotion: "no-preference" });

  test("is hidden flat, comes after Labels in 3D, loads the game on the first press only, plays it with its controls and note, and is in the address", async ({ page }) => {
    const count = asked(page);
    const errors = await venues(page, "?venue=rogers-place&lang=en");
    const button = page.locator(at("game"));
    await expect(button).toBeHidden();
    await page.locator(at("view-3d")).click();
    await expect(button).toBeVisible();
    await expect(button).toHaveText("Play a game");
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(button).toHaveAttribute("title", /Canada v Japan/);
    // Beside the other toggles, after Labels.
    expect(await page.locator(`${at("bar")} > *:not([hidden])`).evaluateAll((all) => all.map((el) => el.dataset.testid))).toEqual(expect.arrayContaining(["part-labels", "game"]));
    expect(await page.locator(at("bar")).evaluate((bar) => [...bar.children].findIndex((el) => el.dataset.testid === "game") - [...bar.children].findIndex((el) => el.dataset.testid === "part-labels"))).toBe(1);
    await expect(page.locator("#stage .ky-up-player")).toHaveCount(0);
    expect(count()).toBe(0);
    await button.click();
    await expect(page.locator("#stage .ky-turn-replay")).toBeVisible();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    expect(await page.locator("#stage .ky-up-player").count()).toBeGreaterThan(20);
    await expect(page.locator(at("game-note"))).toHaveText("A made-up game, shaped from a public NHL play-by-play; teams and players are invented.");
    await expect(page).toHaveURL(/[?&]game=1(&|$)/);
    expect(count()).toBe(1);
    // Again: the empty ice, and nothing of the game's left on it.
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("#stage .ky-turn-replay")).toHaveCount(0);
    await expect(page.locator("#stage .ky-up-player")).toHaveCount(0);
    await expect(page.locator(at("game-note"))).toBeHidden();
    await expect(page).not.toHaveURL(/game=1/);
    // And once more: the game is not fetched again.
    await button.click();
    await expect(page.locator("#stage .ky-turn-replay")).toBeVisible();
    expect(count()).toBe(1);
    expect(errors).toEqual([]);
  });

  test("a shared link plays, in Japanese too, and another arena keeps the game at the same moment", async ({ page }) => {
    await venues(page, "?venue=rogers-place&view=3d&game=1&lang=ja");
    const button = page.locator(at("game"));
    await expect(button).toHaveText("試合を再生");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#stage .ky-turn-replay")).toBeVisible();
    await expect(page.locator(at("game-note"))).toContainText("架空の試合");
    await pause(page, "#stage");
    await seek(page, "#stage", 300);
    const before = await timeIn(page, "#stage");
    await page.locator('#tabs button[data-venue="scotiabank-saddledome"]').click();
    await expect(page).toHaveURL(/venue=scotiabank-saddledome/);
    await expect(page.locator("#stage .ky-turn-replay")).toHaveCount(1);
    expect(await timeIn(page, "#stage")).toBe(before);
    expect(await page.locator("#stage .ky-up-player").count()).toBeGreaterThan(20);
    await expect(button).toHaveAttribute("aria-pressed", "true");
  });

  test("the scoreboard over the ice follows the game here too, and goes back to its own when the game stops", async ({ page }) => {
    await venues(page, "?venue=rogers-place&view=3d&boards=1");
    const face = page.locator('#stage [data-part="centre-board-south"]');
    await expect(face).toHaveCount(1);
    expect(await face.getAttribute("data-score")).toBeNull();
    await page.locator(at("game")).click();
    await expect(page.locator("#stage .ky-turn-replay")).toBeVisible();
    await pause(page, "#stage");
    await seek(page, "#stage", 120);
    await expect(face).toHaveAttribute("data-score", "1-1");
    await expect(face).toHaveAttribute("data-period", "1");
    await page.locator(at("game")).click();
    await expect(page.locator("#stage .ky-turn-replay")).toHaveCount(0);
    expect(await face.getAttribute("data-score")).toBeNull();
  });

  test("the flat arena stops it and frees everything: the same listeners as when it never played, and no frame asked for", async ({ page }) => {
    await venues(page, "?venue=rogers-place");
    // Into 3D and back, with no game: what the page listens to then.
    await page.locator(at("view-3d")).click();
    await expect(page.locator("#stage .ky-turn")).toBeVisible();
    await page.locator(at("view-2d")).click();
    await page.waitForTimeout(200);
    const flat = await page.evaluate(() => window.__listeners());
    await page.locator(at("view-3d")).click();
    await page.locator(at("game")).click();
    await expect(page.locator("#stage .ky-turn-replay")).toBeVisible();
    await page.locator(at("view-2d")).click();
    await expect(page.locator(at("game"))).toBeHidden();
    await expect(page.locator(at("game"))).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("#stage .ky-turn-replay, #stage .ky-replay")).toHaveCount(0);
    await expect(page.locator(at("game-note"))).toBeHidden();
    await expect(page).not.toHaveURL(/game=1/);
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.__listeners())).toBe(flat);
    expect((await framesOver(page, 500)).asked).toBe(0);
    expect(await page.evaluate(() => window.__pending())).toBe(0);
  });

  test("the budgets: no frame while paused, hidden or out of sight; one a frame with the auto-turn; the same elements and listeners after ten times round", async ({ page }) => {
    test.setTimeout(150_000);
    await venues(page, "?venue=rogers-place&view=3d&game=1");
    const box = "#stage";
    await expect(page.locator(`${box} .ky-turn-replay`)).toBeVisible();
    await page.mouse.move(0, 0);
    // Paused: nothing.
    await pause(page, box);
    await page.waitForTimeout(100);
    expect((await framesOver(page, 600)).asked).toBe(0);
    // Playing with the auto-turn: one frame a frame.
    await page.locator(`${box} .ky-turn-replay .ky-loop`).click();
    await page.locator(`${box} .ky-turn-replay .ky-speed`).selectOption("4");
    await play(page, box);
    await page.locator(`${box} .ky-turn-controls [data-act="play"]`).first().click();
    await page.mouse.move(0, 0);
    const playing = await framesOver(page, 600);
    expect(playing.asked).toBeGreaterThan(5);
    expect(playing.most).toBe(1);
    // Ten times round the end of the game: nothing grows (counted at the same moment each time).
    const end = await position(page, box).evaluate((el) => Number(el.max));
    const count = async () => {
      await seek(page, box, 100);
      return page.evaluate(() => ({ nodes: document.querySelector("#stage").querySelectorAll("*").length, listeners: window.__listeners() }));
    };
    await seek(page, box, end - 0.4);
    await page.waitForTimeout(400);
    const first = await count();
    for (let loop = 0; loop < 10; loop += 1) {
      await seek(page, box, end - 0.4);
      await expect.poll(() => timeIn(page, box)).toBeLessThan(end - 1);
    }
    expect(await count()).toEqual(first);
    // Out of sight: the page made long, and the view scrolled away.
    await page.evaluate(() => {
      document.body.style.paddingBottom = "4000px";
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(300);
    expect((await framesOver(page, 600)).asked).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(async () => (await framesOver(page, 200)).asked).toBeGreaterThan(0);
    // Hidden: nothing, and the replay waits paused.
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(100);
    expect((await framesOver(page, 600)).asked).toBe(0);
    expect(await replayState(page, box)).not.toBe("playing");
  });
});

test.describe("Play a game on the Try it surface", () => {
  test.use({ reducedMotion: "no-preference" });
  const box = "#stage";
  const names = (page) => page.locator(`${box} svg.kyogijo`).first().evaluate((svg) => svg.getAttribute("aria-label") ?? svg.querySelector("title")?.textContent ?? "");

  test("plays flat with the game's sides, keeps the moment into 3D and through Crowd and Dark, shows the replay in the code, and gives the reader's own teams back exactly", async ({ page }) => {
    const count = asked(page);
    const errors = await open(page, "?lang=en&help=off");
    const button = page.locator(at("bar-game"));
    await expect(button).toBeVisible();
    await expect(button).toHaveText("Play a game");
    const own = await page.locator(`${box} svg.kyogijo`).first().evaluate((svg) => svg.outerHTML);
    const ownCode = await page.locator(at("embed-code")).textContent();
    expect(count()).toBe(0);
    await button.click();
    await expect(page.locator(`${box} .ky-replay .ky-controls`)).toBeVisible();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(/[?&]game=1(&|$)/);
    await expect(page.locator(at("try-game-note"))).toBeVisible();
    await expect.poll(() => names(page)).toContain("Canada 0, Japan 0");
    await expect(page.locator(at("embed-code"))).toContainText("mount.replay(game.timeline)");
    await expect(page.locator(at("embed-code"))).toContainText(`examples/games/${GAME}`);
    // A goal later, the board says it.
    await pause(page, box);
    await seek(page, box, 400);
    await expect.poll(() => names(page)).not.toContain("Canada 0, Japan 0");
    const moment = await timeIn(page, box);
    // Into 3D, from the same moment, and the code follows.
    await page.locator(at("bar-3d")).click();
    await expect(page.locator(`${box} .ky-turn-replay`)).toBeVisible();
    expect(await timeIn(page, box)).toBe(moment);
    expect(await page.locator(`${box} .ky-up-player`).count()).toBeGreaterThan(20);
    await expect(page.locator(at("embed-code"))).toContainText("view.replay(game.timeline)");
    // The crowd and the dark theme: the same moment, the same replay.
    await page.locator(at("bar-crowd")).click();
    await page.locator(at("bar-dark")).click();
    await expect(page.locator(`${box} .ky-turn-replay`)).toHaveCount(1);
    expect(await timeIn(page, box)).toBe(moment);
    await page.locator(at("bar-dark")).click();
    await page.locator(at("bar-crowd")).click();
    // Back to flat, then off: the reader's own drawing, as it was, and their code.
    await page.locator(at("bar-flat")).click();
    await expect(page.locator(`${box} .ky-replay .ky-controls`)).toBeVisible();
    expect(await timeIn(page, box)).toBe(moment);
    await button.click();
    await expect(page.locator(`${box} .ky-replay`)).toHaveCount(0);
    await expect(page.locator(at("try-game-note"))).toBeHidden();
    await expect(page).not.toHaveURL(/game=1/);
    expect(await page.locator(`${box} svg.kyogijo`).first().evaluate((svg) => svg.outerHTML)).toBe(own);
    expect(await page.locator(at("embed-code")).textContent()).toBe(ownCode);
    expect(count()).toBe(1);
    expect(errors).toEqual([]);
  });

  test("another surface stops it, hides the button and leaves nothing running; the rink offers it again", async ({ page }) => {
    await page.addInitScript(COUNTERS);
    await open(page, "?lang=en&help=off&sport=tennis");
    // Into 3D and back with no game, so that what is counted is what a game leaves, and not what a 3D view does.
    await page.locator(at("bar-3d")).click();
    await expect(page.locator(`${box} .ky-turn`)).toBeVisible();
    await page.locator(at("bar-flat")).click();
    await page.waitForTimeout(200);
    const empty = await page.evaluate(() => window.__listeners());
    const button = page.locator(at("bar-game"));
    await expect(button).toBeHidden();
    await pickSurface(page, "nhl");
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.locator(`${box} .ky-replay .ky-controls`)).toBeVisible();
    // Played in 3D too, then flat again.
    await page.locator(at("bar-3d")).click();
    await expect(page.locator(`${box} .ky-turn-replay`)).toBeVisible();
    await page.locator(at("bar-flat")).click();
    await expect(page.locator(`${box} .ky-replay .ky-controls`)).toBeVisible();
    await pickSurface(page, "tennis");
    await expect(button).toBeHidden();
    await expect(page.locator(`${box} .ky-replay`)).toHaveCount(0);
    await expect(page).not.toHaveURL(/game=1/);
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.__listeners())).toBe(empty);
    expect((await framesOver(page, 500)).asked).toBe(0);
    await pickSurface(page, "nhl");
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("aria-pressed", "false");
  });

  test("a shared link plays; paused it asks for no frame, and in 3D the auto-turn and the game share one", async ({ page }) => {
    await page.addInitScript(COUNTERS);
    await open(page, "?lang=en&help=off&view=3d&game=1");
    await page.locator("#try").scrollIntoViewIfNeeded();
    await expect(page.locator(`${box} .ky-turn-replay`)).toBeVisible();
    await expect(page.locator(at("bar-game"))).toHaveAttribute("aria-pressed", "true");
    await page.mouse.move(0, 0);
    await play(page, box);
    await page.locator(`${box} .ky-turn-controls [data-act="play"]`).first().click();
    await page.mouse.move(0, 0);
    const together = await framesOver(page, 600);
    expect(together.asked).toBeGreaterThan(5);
    expect(together.most).toBe(1);
    await page.locator(`${box} .ky-turn-controls [data-act="play"]`).first().click();
    await pause(page, box);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(700);
    expect((await framesOver(page, 600)).asked).toBe(0);
  });
});

test.describe("Play a game follows the index of the games", () => {
  test.use({ reducedMotion: "no-preference" });

  test("a line for another surface, and its file, give that surface the button, with no other change", async ({ page }) => {
    const rally = {
      kind: "kyogijo-game",
      version: 1,
      sport: "tennis",
      note: { en: "A made-up rally.", ja: "架空のラリーです。" },
      teams: { home: { name: { en: "North", ja: "北" }, abbr: "NOR", flag: "CA", color: "#d52b1e" }, away: { name: { en: "South", ja: "南" }, abbr: "SOU", flag: "JP", color: "#1d3f8f" } },
      rosters: { home: [{ id: "n1", number: 1, name: { en: "Ann North", ja: "北アン" }, position: "F" }], away: [{ id: "s1", number: 1, name: { en: "Sue South", ja: "南スー" }, position: "F" }] },
      score: { home: 0, away: 0, byPeriod: [[0, 0]] },
      periods: [{ number: 1, start: 0, end: 8 }],
      timeline: {
        from: "tennis",
        frames: [0, 2, 4, 6, 8].map((t) => ({ t, objects: [{ id: "n1", team: "home", number: 1, x: -36, y: t - 4 }, { id: "s1", team: "away", number: 1, x: 36, y: 4 - t }, { id: "ball", team: "ball", x: -30 + t * 7, y: 0 }] })),
        events: [{ t: 4, kind: "shot", team: "home", by: "n1", x: 0, y: 0, x2: 30, y2: 4 }],
      },
    };
    await serve(page);
    const index = JSON.parse(readFileSync("site/examples/games/index.json", "utf8"));
    index.games.push({ id: "a-rally", sport: "tennis", file: "a-rally.json", frame: "tennis", title: { en: "A made-up rally", ja: "架空のラリー" } });
    await page.route("http://kyogijo.test/examples/games/index.json", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(index) }));
    await page.route("http://kyogijo.test/examples/games/a-rally.json", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(rally) }));
    await page.goto("http://kyogijo.test/?lang=en&help=off&sport=tennis");
    const button = page.locator(at("bar-game"));
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("title", /A made-up rally/);
    await button.click();
    await expect(page.locator("#stage .ky-replay .ky-controls")).toBeVisible();
    await expect(page.locator(at("try-game-note"))).toHaveText("A made-up rally.");
    await expect(page.locator(at("embed-code"))).toContainText("examples/games/a-rally.json");
    // The rink still has its own game.
    await pickSurface(page, "nhl");
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("title", /Canada v Japan/);
  });

  test("an index with no game for the rink takes the button away everywhere it was", async ({ page }) => {
    await serve(page);
    await page.route("http://kyogijo.test/examples/games/index.json", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ kind: "kyogijo-games", version: 1, games: [] }) }));
    await page.goto("http://kyogijo.test/?lang=en&help=off");
    await expect(page.locator(at("bar-game"))).toBeHidden();
    await expect(page.locator(at("feature-game"))).toBeHidden();
    await page.goto("http://kyogijo.test/venues.html?view=3d");
    await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
    await page.waitForTimeout(300);
    await expect(page.locator(at("game"))).toBeHidden();
  });
});
