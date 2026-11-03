// A replay on the 3D view: the freeze and leak budgets (no frame asked for while paused, hidden or out of sight; one a frame while playing, with the auto-turn too; only what moves written;
// nothing that grows over ten loops; nothing left after destroy), on a page of its own with the package and the examples' game, and the demo's game section and the hero's Play a game.
import { expect, test } from "@playwright/test";

import { at, open, serve } from "./demo.mjs";
import { COUNTERS, framesOver } from "./budget.lib.mjs";

/** A page with nothing on it but the package, the game and a box for the view, below `offset` pixels of nothing. */
async function bare(page, offset = 0) {
  await page.addInitScript(COUNTERS);
  await serve(page);
  await page.route("http://kyogijo.test/bare.html", (route) => route.fulfill({ contentType: "text/html", body: `<!doctype html><meta charset="utf-8"><body style="margin:0"><div style="height:${offset}px"></div><div id="rink" style="width:900px"></div></body>` }));
  await page.goto("http://kyogijo.test/bare.html");
  await page.evaluate(async () => {
    const { mountKyogijoTurn } = await import("./dist/turn-entry.js");
    const game = await (await fetch("./examples/games/canada-japan.json")).json();
    window.__game = game;
    // A short loop of the game: its first sixteen seconds, in which a shot and a whistle are on the ice together, so that a group of marks changes while it is drawn.
    window.__short = { ...game.timeline, frames: game.timeline.frames.filter((f) => f.t <= 16), events: game.timeline.events.filter((e) => e.t <= 16) };
    window.__mount = (timeline = game.timeline, settings = {}) => {
      window.__view = mountKyogijoTurn(document.querySelector("#rink"), { sport: "nhl", style: "none" }, { preset: "broadcast", ...settings.view });
      window.__replay = window.__view.replay(timeline, { motion: "smooth", ...settings.replay });
    };
  });
}

test.describe("a replay on the 3D view: the budgets", () => {
  test.use({ reducedMotion: "no-preference" });

  test("asks for no frame while paused, and none once it stops", async ({ page }) => {
    await bare(page);
    await page.evaluate(() => window.__mount());
    await page.waitForTimeout(300);
    expect((await framesOver(page, 700)).asked).toBe(0);
    await page.evaluate(() => window.__replay.play());
    expect((await framesOver(page, 400)).asked).toBeGreaterThan(3);
    await page.evaluate(() => window.__replay.pause());
    await page.waitForTimeout(50);
    expect((await framesOver(page, 600)).asked).toBe(0);
    expect(await page.evaluate(() => window.__pending())).toBe(0);
  });

  test("asks for one frame a frame while playing, and still one with the auto-turn running too", async ({ page }) => {
    await bare(page);
    await page.evaluate(() => {
      window.__mount();
      window.__replay.play();
    });
    const alone = await framesOver(page, 800);
    expect(alone.asked).toBeGreaterThan(10);
    expect(alone.most).toBe(1);
    await page.evaluate(() => window.__view.play());
    const together = await framesOver(page, 800);
    expect(await page.evaluate(() => [window.__view.playing, window.__replay.state().playing])).toEqual([true, true]);
    expect(together.most).toBe(1);
    expect(together.asked).toBeLessThan(alone.asked * 1.5 + 10);
  });

  test("asks for no frame while the page is hidden, and none while the view is out of sight; goes on when it is back", async ({ page }) => {
    await bare(page, 3000);
    await page.evaluate(() => {
      window.__mount();
      window.__view.play();
      window.__replay.play();
    });
    await page.waitForTimeout(300);
    // Out of sight: the replay holds its clock and the auto-turn its turn.
    const away = await framesOver(page, 600);
    expect(away.asked).toBe(0);
    const held = await page.evaluate(() => window.__replay.state().t);
    await page.locator("#rink").scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => window.__replay.state().t)).toBeGreaterThan(held);
    // Hidden: the replay pauses, and the auto-turn waits.
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(100);
    expect((await framesOver(page, 600)).asked).toBe(0);
    expect(await page.evaluate(() => window.__replay.state().playing)).toBe(false);
  });

  test("writes only what moves: while the camera is still, no part of the view but the discs and the floor's replay marks is written", async ({ page }) => {
    await bare(page);
    await page.evaluate(() => {
      window.__mount();
      const world = document.querySelector("#rink .ky-turn-world");
      window.__writes = [];
      new MutationObserver((list) => {
        for (const m of list) {
          const el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
          if (el.closest(".ky-up-player") !== null || el.closest('[id*="-replay-"]') !== null || (m.type === "attributes" && el.matches("g.ky-layers") && m.attributeName === "data-layers")) continue;
          // A mark of the replay that comes or goes: its own group, put in or taken out of the floor's layers.
          if (m.type === "childList" && el.matches("g.ky-layers") && [...m.addedNodes, ...m.removedNodes].every((node) => node.id?.includes("-replay-"))) continue;
          // A part that stands may move up or down the stack as a player passes it: its z-index, and nothing else of it.
          if (m.type === "attributes" && m.attributeName === "style" && el.matches(".ky-up")) {
            const was = m.oldValue ?? "";
            const strip = (style) => style.replace(/z-index:\s*\d+;?/, "").trim();
            if (strip(was) === strip(el.getAttribute("style") ?? "")) continue;
          }
          window.__writes.push(`${m.type} ${m.attributeName ?? ""} ${el.className?.baseVal ?? el.className}`);
        }
      }).observe(world, { attributes: true, attributeOldValue: true, childList: true, subtree: true, characterData: true });
      window.__replay.setSpeed(4);
      window.__replay.play();
    });
    await expect.poll(() => page.evaluate(() => window.__replay.state().t), { timeout: 10_000 }).toBeGreaterThan(6);
    await page.evaluate(() => window.__replay.pause());
    expect(await page.evaluate(() => window.__writes)).toEqual([]);
  });

  test("grows nothing over ten loops: the same elements, the same listeners and no more memory, with the auto-turn running", async ({ page, browserName }) => {
    test.setTimeout(150_000);
    await bare(page);
    const cdp = browserName === "chromium" ? await page.context().newCDPSession(page) : undefined;
    const heap = async () => {
      if (cdp === undefined) return 0;
      await cdp.send("HeapProfiler.collectGarbage");
      return (await cdp.send("Runtime.getHeapUsage")).usedSize;
    };
    await page.evaluate(() => {
      window.__mount(window.__short, { replay: { loop: true, speed: 4 } });
      window.__view.play();
      window.__replay.play();
      window.__loops = 0;
      window.__replay.subscribe((change) => {
        if (change.reason === "tick" && change.state.t < window.__last) window.__loops += 1;
        window.__last = change.state.t;
      });
    });
    // Counted at the same moment of the game each time (held there, then let go), so that the marks of the events on the ice then are the same.
    const count = () =>
      page.evaluate(() => {
        window.__replay.pause();
        window.__replay.seek(window.__replay.state().start + 13.5);
        const out = { nodes: document.querySelector("#rink").querySelectorAll("*").length, listeners: window.__listeners() };
        window.__replay.play();
        return out;
      });
    await expect.poll(() => page.evaluate(() => window.__loops), { timeout: 20_000 }).toBeGreaterThanOrEqual(1);
    const first = await count();
    const before = await heap();
    await expect.poll(() => page.evaluate(() => window.__loops), { timeout: 80_000 }).toBeGreaterThanOrEqual(10);
    const tenth = await count();
    const after = await heap();
    expect(tenth).toEqual(first);
    if (cdp !== undefined) expect(after).toBeLessThan(before * 1.15 + 2_000_000);
  });

  test("destroy takes everything away: the replay leaves the view as it was, and the view leaves nothing", async ({ page }) => {
    await bare(page);
    const listeners = () => page.evaluate(() => window.__listeners());
    const empty = await listeners();
    await page.evaluate(() => window.__mount());
    const viewOnly = await page.evaluate(() => {
      const listening = window.__listeners();
      window.__replay.destroy();
      return listening;
    });
    expect(await page.evaluate(() => ({ bar: document.querySelectorAll("#rink .ky-turn-replay").length, discs: document.querySelectorAll("#rink .ky-up-player").length, marks: document.querySelectorAll('#rink [id*="-replay-"]').length }))).toEqual({ bar: 0, discs: 0, marks: 0 });
    const afterReplay = await listeners();
    expect(afterReplay).toBeLessThan(viewOnly);
    await page.evaluate(() => {
      window.__replay = window.__view.replay(window.__short, { motion: "smooth" });
      window.__replay.play();
      window.__view.play();
    });
    await page.waitForTimeout(200);
    await page.evaluate(() => window.__view.destroy());
    expect(await page.evaluate(() => document.querySelector("#rink").childElementCount)).toBe(0);
    expect(await listeners()).toBe(empty);
    await page.waitForTimeout(50);
    expect((await framesOver(page, 400)).asked).toBe(0);
    expect(await page.evaluate(() => window.__pending())).toBe(0);
  });
});

test.describe("a replay on the 3D view: playing it", () => {
  test.use({ reducedMotion: "no-preference" });

  test("stands the players up as discs on the rink, moves them with the clock, and keeps the puck on the floor", async ({ page }) => {
    await bare(page);
    const at = (t) =>
      page.evaluate((time) => {
        window.__replay.seek(time);
        const disc = [...document.querySelectorAll("#rink .ky-up-player")].find((el) => el.style.visibility !== "hidden");
        return { transform: disc.style.transform, part: disc.dataset.part, shown: [...document.querySelectorAll("#rink .ky-up-player")].filter((el) => el.style.visibility !== "hidden").length };
      }, t);
    await page.evaluate(() => window.__mount());
    const start = await at(0);
    expect(start.shown).toBe(12);
    const later = await at(3);
    expect(later.part).toBe(start.part);
    expect(later.transform).not.toBe(start.transform);
    expect(await page.locator('#rink .ky-turn-floor [id$="replay-ball"]').count()).toBe(1);
    expect(await page.locator('#rink .ky-turn-floor [id$="replay-players"]').count()).toBe(0);
  });

  test("keeps its keys apart from the view's: space plays, comma and full stop step, the arrows turn the view; on the controls the arrows step", async ({ page }) => {
    await bare(page);
    await page.evaluate(() => window.__mount());
    const state = () => page.evaluate(() => ({ t: window.__replay.state().t, playing: window.__replay.state().playing, yaw: Math.round(window.__view.view().yaw), turning: window.__view.playing }));
    await page.locator("#rink .ky-turn-view").focus();
    const first = await state();
    await page.keyboard.press("Space");
    expect(await state()).toMatchObject({ playing: true, turning: false });
    await page.keyboard.press("Space");
    await page.evaluate(() => window.__replay.seek(5));
    await page.keyboard.press("Period");
    expect((await state()).t).toBeGreaterThan(5);
    await page.keyboard.press("Comma");
    expect((await state()).t).toBe(5);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(300);
    const turned = await state();
    expect(turned.t).toBe(5);
    expect(turned.yaw).not.toBe(first.yaw);
    await page.locator("#rink .ky-turn-replay .ky-forward").focus();
    await page.keyboard.press("ArrowRight");
    const stepped = await state();
    expect(stepped.t).toBeGreaterThan(5);
    expect(stepped.yaw).toBe(turned.yaw);
  });

  test("the element plays a timeline on its 3D view", async ({ page }) => {
    await bare(page);
    const out = await page.evaluate(async () => {
      await import("./dist/element-define.js");
      const el = document.createElement("kyogijo-field");
      el.setAttribute("sport", "nhl");
      el.setAttribute("turn", "");
      el.timeline = window.__short;
      document.body.append(el);
      el.replay.seek(4);
      const result = { discs: el.shadowRoot.querySelectorAll(".ky-up-player").length, bar: el.shadowRoot.querySelector(".ky-turn-replay .ky-controls") !== null, t: el.replay.state().t };
      el.remove();
      return result;
    });
    expect(out).toEqual({ discs: 12, bar: true, t: 4 });
  });
});

test.describe("the demo's game", () => {
  test.use({ reducedMotion: "no-preference" });

  test("loads the game only when the section comes near, and plays it in 3D with the period buttons, the score and the note", async ({ page }) => {
    const asked = [];
    page.on("request", (request) => asked.push(request.url()));
    const errors = await open(page, "?lang=en&help=off");
    expect(asked.filter((url) => url.endsWith("canada-japan.json"))).toEqual([]);
    await page.locator("#game").scrollIntoViewIfNeeded();
    await expect(page.locator("#game-stage .ky-turn-replay")).toBeVisible();
    expect(asked.filter((url) => url.endsWith("canada-japan.json"))).toHaveLength(1);
    await expect(page.locator(at("game-note"))).toHaveText("A made-up game, shaped from a public NHL play-by-play; teams and players are invented.");
    await expect(page.locator(at("game-score"))).toHaveText("Canada 0 – 0 Japan");
    const periods = page.locator("#game-periods button");
    await expect(periods).toHaveText(["Period 1", "Period 2", "Period 3"]);
    await periods.nth(2).click();
    await expect(periods.nth(2)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(at("game-score"))).not.toHaveText("Canada 0 – 0 Japan");
    expect(await page.locator("#game-stage .ky-up-player").count()).toBeGreaterThan(20);
    for (const name of ["Play", "Next frame", "Loop"]) await expect(page.locator("#game-stage").getByRole("button", { name })).toBeVisible();
    await expect(page.locator(at("game-code"))).toContainText("view.replay(game.timeline)");
    expect(errors).toEqual([]);
  });

  test("plays the same game flat, from where it was, and in Japanese", async ({ page }) => {
    await open(page, "?lang=ja&help=off");
    await page.locator("#game").scrollIntoViewIfNeeded();
    await expect(page.locator("#game-stage .ky-turn-replay")).toBeVisible();
    await expect(page.locator("#game-periods button").first()).toHaveText("第1ピリオド");
    await page.locator("#game-periods button").nth(1).click();
    await page.locator(at("game-flat")).click();
    await expect(page.locator("#game-stage .ky-replay .ky-stage svg.kyogijo")).toBeVisible();
    await expect(page.locator("#game-stage .ky-turn")).toHaveCount(0);
    await expect(page.locator("#game-periods button").nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(at("game-code"))).toContainText("mount.replay(game.timeline)");
    await expect(page.locator(at("game-note"))).toContainText("架空の試合");
  });

  test("the hero plays the game in front of its crowd when asked, with the auto-turn, and gives back the empty ice", async ({ page }) => {
    const asked = [];
    page.on("request", (request) => asked.push(request.url()));
    await page.addInitScript(COUNTERS);
    await open(page, "?lang=en&help=off");
    const button = page.locator(at("feature-game"));
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("#feature-stage .ky-up-player")).toHaveCount(0);
    expect(asked.filter((url) => url.endsWith("canada-japan.json"))).toEqual([]);
    await button.click();
    await expect(page.locator("#feature-stage .ky-turn-replay")).toBeVisible();
    await expect(page.locator(at("feature-game-note"))).toBeVisible();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    // The auto-turn and the game together, round the end of the game ten times: nothing grows, and one frame is asked for a frame.
    await page.locator("#feature-stage .ky-turn-replay .ky-loop").click();
    await page.locator("#feature-stage .ky-turn-replay .ky-speed[data-speed=\"4\"]").click();
    await page.locator('#feature-stage [data-act="play"]').click();
    await page.mouse.move(0, 0);
    const end = await page.locator("#feature-stage .ky-position").evaluate((el) => Number(el.max));
    const seekNear = () => page.locator("#feature-stage .ky-position").evaluate((el, value) => {
      el.value = String(value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, end - 0.4);
    // Counted at the same moment of the game each time: the marks on the ice are the same then.
    const count = async () => {
      await page.locator("#feature-stage .ky-position").evaluate((el) => {
        el.value = "100";
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
      return page.evaluate(() => ({ nodes: document.querySelector("#feature-stage").querySelectorAll("*").length, listeners: window.__listeners() }));
    };
    await seekNear();
    await page.waitForTimeout(400);
    const first = await count();
    const per = await framesOver(page, 500);
    expect(per.most).toBe(1);
    for (let loop = 0; loop < 10; loop += 1) {
      await seekNear();
      await expect.poll(() => page.locator("#feature-stage .ky-position").evaluate((el) => Number(el.value))).toBeLessThan(end - 1);
    }
    const tenth = await count();
    expect(tenth).toEqual(first);
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("#feature-stage .ky-up-player")).toHaveCount(0);
    await expect(page.locator("#feature-stage .ky-turn-replay")).toHaveCount(0);
    await expect(page.locator(at("feature-game-note"))).toBeHidden();
  });
  test("the scoreboard hung over the hero's arena shows the game: seek past a goal and the score changes, seek back and it reverts; the clock is written once a second, not every frame", async ({ page }) => {
    await page.addInitScript(COUNTERS);
    const errors = await open(page, "?lang=en&help=off");
    await page.locator('#feature-bar [data-testid="part-boards"]').click();
    const face = page.locator('#feature-stage [data-part="centre-board-south"]');
    await expect(face).toHaveCount(1);
    // With no game, the board keeps today's look: the demo's plain 3 - 2, no clock, nothing written to it.
    expect(await face.getAttribute("data-score")).toBeNull();
    const plain = await face.innerHTML();
    await page.locator(at("feature-game")).click();
    await expect(page.locator("#feature-stage .ky-turn-replay")).toBeVisible();
    const seek = (seconds) => page.locator("#feature-stage .ky-position").evaluate((el, value) => {
      el.value = String(value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, seconds);
    const shows = async () => [await face.getAttribute("data-score"), await face.getAttribute("data-period"), await face.getAttribute("data-clock")];
    // At 0:07 of the game: 0-0, the first period, and a clock that has started.
    await seek(7);
    expect(await shows()).toEqual(["0-0", "1", "19:28"]);
    const early = await face.innerHTML();
    expect(early).not.toBe(plain);
    // Past the first goal (home, 2:02) and past the second (away, 2:35): the score follows at once.
    await seek(133);
    expect((await shows())[0]).toBe("1-0");
    const after = await face.innerHTML();
    expect(after).not.toBe(early);
    await seek(160);
    expect((await shows())[0]).toBe("1-1");
    // The stoppage after the first goal (2:02.89 to 2:11.38): the board's clock stands still from the goal to the drop, the game clock of the timeline.
    for (const t of [123, 127, 131]) {
      await seek(t);
      expect(await shows()).toEqual(["1-0", "1", "12:00"]);
    }
    await seek(133);
    expect(await shows()).toEqual(["1-0", "1", "11:49"]);
    // A power play (KYOGIJO-STADIUMS-48): the away side's minor, called at 1:32.81; five skaters against four, and its clock counting the game clock down.
    await seek(105);
    expect([await face.getAttribute("data-strength"), await face.getAttribute("data-penalties")]).toEqual(["5-4", "away 1:32"]);
    await seek(110);
    expect([await face.getAttribute("data-strength"), await face.getAttribute("data-penalties")]).toEqual(["5-4", "away 0:57"]);
    await seek(7);
    expect([await face.getAttribute("data-strength"), await face.getAttribute("data-penalties")]).toEqual(["5-5", ""]);
    // The second period, and the clock begins again; the third at its start.
    await seek(400);
    expect((await shows()).slice(1)).toEqual(["2", expect.any(String)]);
    await seek(700);
    expect((await shows())[1]).toBe("3");
    // Back before the goals: the score is what it was, and the drawing is the very one from before.
    await seek(7);
    expect(await shows()).toEqual(["0-0", "1", "19:28"]);
    expect(await face.innerHTML()).toBe(early);
    await seek(133);
    expect(await face.innerHTML()).toBe(after);
    // Stepping to the next moment and pausing set it at once too: a step across the goal at 122.54. The hero's game plays by itself, so it is paused first: playing on a slow machine, it could cross the
    // goal between the seek and the first look.
    const pauseButton = page.locator("#feature-stage .ky-turn-replay").getByRole("button", { name: "Pause" });
    if ((await pauseButton.count()) > 0) await pauseButton.click();
    await seek(122.3);
    expect((await shows())[0]).toBe("0-0");
    for (let i = 0; i < 8 && (await shows())[0] === "0-0"; i += 1) await page.locator("#feature-stage").getByRole("button", { name: "Next frame" }).click();
    expect((await shows())[0]).toBe("1-0");
    // Playing at four times speed from 7 s: the clock is written about once a second (the period's clock runs several times faster than the replay's), a frame is not.
    await seek(7);
    await page.locator("#feature-stage .ky-turn-replay .ky-speed[data-speed=\"4\"]").click();
    await page.evaluate(() => {
      const svg = document.querySelector('#feature-stage [data-part="centre-board-south"] > svg');
      window.__boardWrites = 0;
      new MutationObserver((list) => { window.__boardWrites += list.length; }).observe(svg, { childList: true });
    });
    await page.locator("#feature-stage .ky-turn-replay").getByRole("button", { name: "Play" }).click();
    await page.mouse.move(0, 0);
    const before = (await shows())[2];
    const per = await framesOver(page, 3000);
    const writes = await page.evaluate(() => window.__boardWrites);
    expect(per.most).toBe(1);
    expect(per.asked).toBeGreaterThan(20);
    expect(writes).toBeGreaterThanOrEqual(2);
    expect(writes).toBeLessThanOrEqual(5);
    expect((await shows())[2]).not.toBe(before);
    // Paused, nothing is written.
    await page.locator("#feature-stage .ky-turn-replay").getByRole("button", { name: "Pause" }).click();
    await page.waitForTimeout(100);
    const held = await page.evaluate(() => window.__boardWrites);
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.__boardWrites)).toBe(held);
    // Taking the game away gives back the board it had, and the replay leaves nothing on the face.
    await page.locator(at("feature-game")).click();
    await expect(page.locator("#feature-stage .ky-turn-replay")).toHaveCount(0);
    expect(await face.innerHTML()).toBe(plain);
    expect(await face.getAttribute("data-score")).toBeNull();
    expect(errors).toEqual([]);
  });
});
