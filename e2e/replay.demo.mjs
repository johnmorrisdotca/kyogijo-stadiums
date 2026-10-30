// The demo's Replay section: a made-up play on the rink and on the pitch, with the controls, the keyboard, the live region and the care for the
// reader that the replay promises, in a real browser. The suite runs with reduced motion on (the config's default), so a test of playing says it wants motion.
import { expect, test } from "@playwright/test";

import { replayPlay } from "../demo/replay-data.js";
import { at, noSidewaysScroll, open, serve } from "./demo.mjs";

const RINK = '[data-testid="replay-rink"]';
const PITCH = '[data-testid="replay-pitch"]';
const rink = replayPlay("hockey", { seconds: 14 });
const goal = rink.events.find((event) => event.kind === "goal");

/** The marks of a layer of the replay: its children, but for the title and the description. */
const marks = (host, name) => `${host} [id$="replay-${name}"] > :not(title):not(desc)`;
const stage = (page, host = RINK) => page.locator(`${host} .ky-stage`);
const position = (page, host = RINK) => page.locator(`${host} .ky-position`).evaluate((el) => Number(el.value));
const clock = (page, host = RINK) => page.locator(`${host} .ky-clock`).textContent();
const state = (page, host = RINK) => page.locator(`${host} .ky-replay`).getAttribute("data-state");
const seek = (page, seconds, host = RINK) =>
  page.locator(`${host} .ky-position`).evaluate((el, value) => {
    el.value = String(value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, seconds);
/** Where the puck is on the page: the middle of its mark. */
const puck = (page, host = RINK) =>
  page.locator(marks(host, "ball")).first().evaluate((el) => {
    const box = el.getBoundingClientRect();
    return `${Math.round((box.x + box.width / 2) * 10)},${Math.round((box.y + box.height / 2) * 10)}`;
  });
const live = (page, host = RINK) => page.locator(`${host} .ky-live`).textContent();

async function openReplay(page, query = "?lang=en&help=off") {
  const errors = await open(page, query);
  await page.locator(RINK).scrollIntoViewIfNeeded();
  return errors;
}

test.describe("with reduced motion, which is how the suite runs", () => {
  test("nothing plays by itself, the controls are steps, and space moves one step", async ({ page }) => {
    const errors = await openReplay(page);
    await expect(page.locator(`${RINK} .ky-replay`)).toHaveAttribute("data-motion", "step");
    await expect(page.locator(`${RINK} .ky-replay`)).toHaveAttribute("data-state", "paused");
    for (const hidden of [".ky-play", ".ky-speed", ".ky-loop"]) await expect(page.locator(`${RINK} ${hidden}`)).toBeHidden();
    await expect(page.getByRole("button", { name: "Back" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Forward" }).first()).toBeVisible();
    await page.waitForTimeout(400);
    expect(await position(page)).toBe(0);
    await page.locator(`${RINK} .ky-forward`).click();
    expect(await position(page)).toBe(1);
    expect(await clock(page)).toBe("0:01 / 0:14");
    await stage(page).focus();
    await page.keyboard.press("Space");
    expect(await position(page)).toBe(2);
    await page.keyboard.press("ArrowLeft");
    expect(await position(page)).toBe(1);
    await page.keyboard.press("Shift+ArrowRight");
    expect(await position(page)).toBe(6);
    await page.keyboard.press("Home");
    expect(await position(page)).toBe(0);
    await page.keyboard.press("End");
    expect(await position(page)).toBe(14);
    expect(await state(page)).toBe("paused");
    expect(errors).toEqual([]);
  });

  test("a step moves the marks, and says the goal when it goes by", async ({ page }) => {
    await openReplay(page);
    const before = await puck(page);
    await seek(page, Math.floor(goal.t) - 1);
    expect(await puck(page)).not.toBe(before);
    expect(await live(page)).toBe("");
    await stage(page).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    expect(await live(page)).toMatch(/^Goal, home, 0:\d\d$/);
  });

  test("is in Japanese too, as steps", async ({ page }) => {
    await openReplay(page, "?lang=ja&help=off");
    await expect(page.locator(RINK).getByRole("button", { name: "前へ" })).toBeVisible();
    await expect(page.locator(RINK).getByRole("button", { name: "次へ" })).toBeVisible();
    await expect(page.locator(RINK).getByRole("button", { name: "再生", exact: true })).toBeHidden();
  });

  test("autoplay is ignored: nothing plays by itself", async ({ page }) => {
    await open(page, "?lang=en&help=off");
    const out = await page.evaluate(async () => {
      const { replayPlay } = await import("./replay-data.js");
      const el = document.createElement("kyogijo-field");
      el.setAttribute("sport", "nhl");
      el.setAttribute("autoplay", "");
      el.timeline = replayPlay("hockey", { seconds: 4 });
      document.body.append(el);
      await new Promise((resolve) => setTimeout(resolve, 400));
      const state = el.replay.state();
      el.remove();
      return state;
    });
    expect(out).toMatchObject({ playing: false, t: 0, motion: "step" });
  });

  test("a reader who changes the setting while the page is open is switched over at once", async ({ page }) => {
    await openReplay(page);
    await expect(page.locator(`${RINK} .ky-replay`)).toHaveAttribute("data-motion", "step");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(page.locator(`${RINK} .ky-replay`)).toHaveAttribute("data-motion", "smooth");
    await expect(page.locator(RINK).getByRole("button", { name: "Play" })).toBeVisible();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(`${RINK} .ky-replay`)).toHaveAttribute("data-motion", "step");
    await expect(page.locator(RINK).getByRole("button", { name: "Play" })).toBeHidden();
  });

  test("a score that changes is highlighted with a fade and no movement", async ({ page }) => {
    await open(page, "?lang=en&help=off");
    await page.locator(at("live-step")).scrollIntoViewIfNeeded();
    await page.locator(at("live-step")).click();
    const keys = await page.locator(`${at("live-stage")} .ky-score`).evaluateAll((all) => all.flatMap((el) => el.getAnimations().map((a) => Object.keys(a.effect.getKeyframes()[0]).filter((k) => !["offset", "computedOffset", "easing", "composite"].includes(k)).join())));
    expect(keys).toEqual(["opacity"]);
  });
});

test.describe("with motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("has the controls of a player, named, and does not start by itself", async ({ page }) => {
    const errors = await openReplay(page);
    await expect(page.locator(`${RINK} .ky-replay`)).toHaveAttribute("data-motion", "smooth");
    await expect(page.getByRole("group", { name: "Replay controls" }).first()).toBeVisible();
    for (const name of ["Previous frame", "Play", "Next frame", "Loop"]) await expect(page.locator(RINK).getByRole("button", { name })).toBeVisible();
    await expect(page.locator(RINK).getByRole("combobox", { name: "Speed" })).toBeVisible();
    const slider = page.locator(RINK).getByRole("slider", { name: "Position" });
    await expect(slider).toHaveAttribute("aria-valuetext", "0:00 of 0:14");
    const keys = stage(page);
    await expect(keys).toHaveAttribute("role", "group");
    await expect(keys).toHaveAccessibleName("Replay");
    await expect(keys).toHaveAttribute("aria-keyshortcuts", /Space/);
    expect(await keys.getAttribute("aria-describedby")).toBeTruthy();
    for (const name of ["Previous frame", "Play", "Next frame"]) expect((await page.locator(RINK).getByRole("button", { name }).boundingBox()).height).toBeGreaterThanOrEqual(44);
    await page.waitForTimeout(500);
    expect(await position(page)).toBe(0);
    expect(await state(page)).toBe("paused");
    await noSidewaysScroll(page);
    expect(errors).toEqual([]);
  });

  test("plays and pauses, and the clock holds still while paused", async ({ page }) => {
    await openReplay(page);
    await page.locator(RINK).getByRole("button", { name: "Play" }).click();
    await expect(page.locator(`${RINK} .ky-replay`)).toHaveAttribute("data-state", "playing");
    await expect(page.locator(RINK).getByRole("button", { name: "Pause" })).toBeVisible();
    await expect.poll(() => position(page)).toBeGreaterThan(0.3);
    await page.locator(RINK).getByRole("button", { name: "Pause" }).click();
    expect(await state(page)).toBe("paused");
    const held = await position(page);
    await page.waitForTimeout(400);
    expect(await position(page)).toBe(held);
    expect(await clock(page)).toMatch(/^0:0\d \/ 0:14$/);
  });

  test("scrubs to a place, and the marks go there", async ({ page }) => {
    await openReplay(page);
    const start = await puck(page);
    await seek(page, 9.32);
    expect(await clock(page)).toBe("0:09 / 0:14");
    expect(await puck(page)).not.toBe(start);
    await expect(page.locator(RINK).getByRole("slider", { name: "Position" })).toHaveAttribute("aria-valuetext", "0:09 of 0:14");
    // Back to the start: the marks are where they were.
    await seek(page, 0);
    expect(await puck(page)).toBe(start);
  });

  test("moves only the marks that move: the surface and the players' marks are the same elements while it plays", async ({ page }) => {
    await openReplay(page);
    await page.locator(`${RINK} svg.kyogijo`).evaluate((svg) => {
      svg.querySelector(".ky-surface").dataset.probe = "surface";
      svg.querySelector('[id$="replay-players"] > circle').dataset.probe = "player";
      window.__outside = [];
      new MutationObserver((list) => {
        for (const m of list) if (!m.target.closest('[id*="-replay-"]') && !m.target.matches("g.ky-layers")) window.__outside.push(m.type + " " + (m.target.getAttribute?.("class") ?? m.target.nodeName));
      }).observe(svg, { attributes: true, childList: true, subtree: true, characterData: true });
    });
    await page.locator(RINK).getByRole("combobox", { name: "Speed" }).selectOption("4");
    await page.locator(RINK).getByRole("button", { name: "Play" }).click();
    await expect.poll(() => position(page)).toBeGreaterThan(2);
    await page.locator(RINK).getByRole("button", { name: "Pause" }).click();
    const outside = await page.evaluate(() => window.__outside);
    expect(outside).toEqual([]);
    const probes = await page.locator(`${RINK} svg.kyogijo`).evaluate((svg) => ({ surface: svg.querySelector('[data-probe="surface"]') !== null, player: svg.querySelector('[data-probe="player"]')?.getAttribute("transform") ?? null }));
    expect(probes.surface).toBe(true);
    expect(probes.player).toMatch(/^translate\(/);
  });

  test("keeps in step with what drawing it again would have drawn: the same places, at any time", async ({ page }) => {
    await openReplay(page);
    for (const t of [0.08, 3.4, 9.32, 12.4, 13.96]) {
      await seek(page, t);
      const [moved, fresh] = await page.evaluate(async (time) => {
        const { drawFrame } = await import("./dist/replay-entry.js");
        const { replayPlay } = await import("./replay-data.js");
        const live = document.querySelector('[data-testid="replay-rink"] svg.kyogijo');
        const host = document.createElement("div");
        host.style.cssText = `position:absolute;left:0;top:0;width:${live.getBoundingClientRect().width}px`;
        document.body.append(host);
        host.innerHTML = drawFrame({ sport: "nhl", style: "none", orientation: "landscape", id: "fresh" }, replayPlay("hockey", { seconds: 14 }), time);
        const places = (svg) => {
          const box = svg.getBoundingClientRect();
          return ["players", "numbers", "ball", "officials", "trails"].map((name) => [...svg.querySelectorAll(`[id$="replay-${name}"] > :not(title):not(desc)`)].map((el) => {
            const r = el.getBoundingClientRect();
            return [(r.x + r.width / 2 - box.x) / box.width, (r.y + r.height / 2 - box.y) / box.height];
          }));
        };
        const result = [places(live), places(host.querySelector("svg"))];
        host.remove();
        return result;
      }, t);
      expect(moved.map((list) => list.length), `at ${t}`).toEqual(fresh.map((list) => list.length));
      moved.forEach((list, group) => list.forEach(([x, y], i) => {
        expect(Math.abs(x - fresh[group][i][0]), `x of ${group}:${i} at ${t}`).toBeLessThan(0.004);
        expect(Math.abs(y - fresh[group][i][1]), `y of ${group}:${i} at ${t}`).toBeLessThan(0.004);
      }));
    }
  });

  test("goes at the speed it is told, and loops or stops at the end", async ({ page }) => {
    await openReplay(page);
    const speed = page.locator(RINK).getByRole("combobox", { name: "Speed" });
    const play = page.locator(RINK).getByRole("button", { name: "Play" });
    await speed.selectOption("0.25");
    await play.click();
    await page.waitForTimeout(600);
    const slow = await position(page);
    await page.locator(RINK).getByRole("button", { name: "Pause" }).click();
    expect(slow).toBeGreaterThan(0);
    expect(slow).toBeLessThan(0.5);
    await seek(page, 0);
    await speed.selectOption("4");
    await play.click();
    await page.waitForTimeout(600);
    expect(await position(page)).toBeGreaterThan(1);
    await page.locator(RINK).getByRole("button", { name: "Pause" }).click();
    // At the end it stops, and play starts again from the start.
    await seek(page, 13.8);
    await play.click();
    await expect(page.locator(`${RINK} .ky-replay`)).toHaveAttribute("data-state", "ended");
    expect(await position(page)).toBe(14);
    await play.click();
    await expect.poll(() => position(page)).toBeLessThan(2);
    await page.locator(RINK).getByRole("button", { name: "Pause" }).click();
    // Looping goes round and plays on.
    const loop = page.locator(RINK).getByRole("button", { name: "Loop" });
    await loop.click();
    await expect(loop).toHaveAttribute("aria-pressed", "true");
    await seek(page, 13.8);
    await play.click();
    await page.waitForTimeout(500);
    expect(await state(page)).toBe("playing");
    expect(await position(page)).toBeLessThan(13);
    await page.locator(RINK).getByRole("button", { name: "Pause" }).click();
  });

  test("answers the keyboard: space, the arrows, shift and the arrows, home and end", async ({ page }) => {
    await openReplay(page);
    await stage(page).focus();
    await page.keyboard.press("Space");
    expect(await state(page)).toBe("playing");
    await page.keyboard.press("Space");
    expect(await state(page)).toBe("paused");
    await seek(page, 0);
    await stage(page).focus();
    await page.keyboard.press("ArrowRight");
    expect(await position(page)).toBeCloseTo(0.04, 5);
    await page.keyboard.press("ArrowRight");
    expect(await position(page)).toBeCloseTo(0.08, 5);
    await page.keyboard.press("ArrowLeft");
    expect(await position(page)).toBeCloseTo(0.04, 5);
    await page.keyboard.press("Shift+ArrowRight");
    expect(await position(page)).toBeCloseTo(5.04, 5);
    await page.keyboard.press("Shift+ArrowLeft");
    expect(await position(page)).toBeCloseTo(0.04, 5);
    await page.keyboard.press("End");
    expect(await position(page)).toBe(14);
    await page.keyboard.press("Home");
    expect(await position(page)).toBe(0);
    // A button keeps its own space; the slider keeps its own arrows.
    await page.locator(`${RINK} .ky-forward`).focus();
    await page.keyboard.press("Space");
    expect(await position(page)).toBeCloseTo(0.04, 5);
    expect(await state(page)).toBe("paused");
  });

  test("pauses when the page is hidden, and does not start again by itself", async ({ page }) => {
    await openReplay(page);
    await page.locator(RINK).getByRole("button", { name: "Play" }).click();
    await expect(page.locator(`${RINK} .ky-replay`)).toHaveAttribute("data-state", "playing");
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(await state(page)).toBe("paused");
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(300);
    expect(await state(page)).toBe("paused");
  });

  test("announces the goal as it goes by while playing, and draws it", async ({ page }) => {
    await openReplay(page);
    await seek(page, Math.floor((goal.t - 0.6) * 25) / 25);
    expect(await live(page)).toBe("");
    await page.locator(RINK).getByRole("button", { name: "Play" }).click();
    await expect.poll(() => live(page), { timeout: 5000 }).toMatch(/Goal, home, 0:\d\d/);
    await expect(page.locator(`${RINK} g[id$="replay-events"] path`)).toHaveCount(1);
    await expect(page.locator(RINK).locator(".ky-live")).toHaveAttribute("aria-live", "polite");
    await expect(page.locator(RINK).locator(".ky-live")).toHaveAttribute("role", "status");
  });

  test("a score that changes swells and settles", async ({ page }) => {
    await open(page, "?lang=en&help=off");
    await page.locator(at("live-step")).scrollIntoViewIfNeeded();
    await page.locator(at("live-step")).click();
    const keys = await page.locator(`${at("live-stage")} .ky-score`).evaluateAll((all) => all.flatMap((el) => el.getAnimations().map((a) => Object.keys(a.effect.getKeyframes()[0]).filter((k) => !["offset", "computedOffset", "easing", "composite"].includes(k)).join())));
    expect(keys).toEqual(["transform"]);
  });

  test("is in Japanese too: the controls, the names and the announcement", async ({ page }) => {
    await openReplay(page, "?lang=ja&help=off");
    expect(await page.locator("#replay-title").textContent()).toBe("リプレイ");
    await expect(stage(page)).toHaveAccessibleName("リプレイ");
    for (const name of ["前のコマ", "再生", "次のコマ", "繰り返し"]) await expect(page.locator(RINK).getByRole("button", { name })).toBeVisible();
    await expect(page.locator(RINK).getByRole("slider", { name: "再生位置" })).toHaveAttribute("aria-valuetext", "14秒中0秒");
    expect(await page.locator(`${RINK} svg.kyogijo > desc`).textContent()).toContain("リプレイ（再生時間14秒）。");
    await seek(page, Math.floor((goal.t - 0.6) * 25) / 25);
    await page.locator(RINK).getByRole("button", { name: "再生" }).click();
    await expect.poll(() => live(page), { timeout: 5000 }).toMatch(/ホームのゴール、\d+秒/);
  });

  test("autoplay plays at once, and controls=\"false\" leaves the bar out and keeps the keyboard", async ({ page }) => {
    await open(page, "?lang=en&help=off");
    const out = await page.evaluate(async () => {
      const { replayPlay } = await import("./replay-data.js");
      const make = (attributes) => {
        const el = document.createElement("kyogijo-field");
        el.setAttribute("sport", "nhl");
        for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
        el.timeline = replayPlay("hockey", { seconds: 4 });
        document.body.append(el);
        return el;
      };
      const playing = make({ autoplay: "" });
      const bare = make({ controls: "false" });
      await new Promise((resolve) => setTimeout(resolve, 500));
      const result = { autoplay: playing.replay.state().playing, moved: playing.replay.state().t > 0.1, hidden: bare.shadowRoot.querySelector(".ky-controls").hidden, shown: playing.shadowRoot.querySelector(".ky-controls").hidden };
      bare.shadowRoot.querySelector(".ky-stage").dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
      result.keyboard = bare.replay.state().playing;
      playing.remove();
      bare.remove();
      return result;
    });
    expect(out).toEqual({ autoplay: true, moved: true, hidden: true, shown: false, keyboard: true });
  });

  test("the element plays too: loop and speed are attributes", async ({ page }) => {
    await open(page, "?lang=en&help=off");
    const element = page.locator(at("replay-element"));
    await element.scrollIntoViewIfNeeded();
    await expect(element.locator(".ky-controls")).toBeVisible();
    const settings = await element.evaluate((el) => ({ speed: el.replay.state().speed, loop: el.replay.state().loop, playing: el.replay.state().playing }));
    expect(settings).toEqual({ speed: 2, loop: true, playing: false });
    await element.evaluate((el) => el.setAttribute("speed", "0.5"));
    expect(await element.evaluate((el) => el.replay.state().speed)).toBe(0.5);
    await element.getByRole("button", { name: "Play" }).click();
    await expect.poll(() => element.evaluate((el) => el.replay.state().t)).toBeGreaterThan(0.1);
    await element.evaluate((el) => el.replay.pause());
  });
});

test("the pitch replays too, and nothing is fetched", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await openReplay(page);
  await page.locator(PITCH).scrollIntoViewIfNeeded();
  expect(await page.locator(marks(PITCH, "players")).count()).toBe(22);
  expect(await page.locator(marks(PITCH, "numbers")).count()).toBe(22);
  expect(await page.locator(marks(PITCH, "officials")).count()).toBe(1);
  // This one runs with reduced motion, so the slider moves in whole seconds.
  await seek(page, 21, PITCH);
  expect(await clock(page, PITCH)).toBe("0:21 / 0:24");
  await expect(page.locator(`${PITCH} g[id$="replay-event-lines"]`)).toHaveCount(1);
  expect(requests.filter((url) => !url.startsWith("http://kyogijo.test/"))).toEqual([]);
  await noSidewaysScroll(page);
});

test("a tall drawing keeps the numbers upright while they move", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  const out = await page.evaluate(async () => {
    const { mountKyogijo } = await import("./dist/mount-entry.js");
    const { replayPlay } = await import("./replay-data.js");
    const host = document.createElement("div");
    host.style.width = "300px";
    document.body.append(host);
    const mount = mountKyogijo(host, { sport: "soccer", orientation: "portrait", style: "none", id: "tall" });
    const replay = mount.replay(replayPlay("soccer", { seconds: 6 }), { motion: "smooth" });
    const before = host.querySelector('[id$="replay-numbers"] > text').getAttribute("transform");
    replay.seek(1.2);
    replay.seek(1.24);
    const after = host.querySelector('[id$="replay-numbers"] > text').getAttribute("transform");
    mount.destroy();
    host.remove();
    return { before, after };
  });
  expect(out.before).toMatch(/^rotate\(-90 /);
  expect(out.after).toMatch(/^translate\([^)]*\) rotate\(-90 /);
});

test("the mount keeps the replay when it is updated, and gives the surface back when the replay is taken away", async ({ page }) => {
  await open(page, "?lang=en&help=off");
  const out = await page.evaluate(async () => {
    const { mountKyogijo } = await import("./dist/mount-entry.js");
    const { replayPlay } = await import("./replay-data.js");
    const host = document.createElement("div");
    document.body.append(host);
    const mount = mountKyogijo(host, { sport: "nhl", style: "none", id: "keep" });
    const replay = mount.replay(replayPlay("hockey", { seconds: 6 }), { motion: "smooth" });
    replay.seek(2);
    host.querySelector(".ky-forward").focus();
    mount.update({ sport: "nhl", style: "none", id: "keep", theme: "dark" });
    const kept = { theme: mount.svg().getAttribute("data-theme"), controls: host.querySelector(".ky-controls") !== null, t: replay.state().t, numbers: host.querySelectorAll('[id$="replay-numbers"] > text').length, focus: document.activeElement === host.querySelector(".ky-forward") };
    replay.destroy();
    const left = { controls: host.querySelector(".ky-controls") !== null, groups: host.querySelectorAll('[id*="-replay-"]').length, svg: mount.svg() !== null };
    mount.destroy();
    host.remove();
    return { kept, left };
  });
  expect(out.kept).toEqual({ theme: "dark", controls: true, t: 2, numbers: 12, focus: true });
  expect(out.left).toEqual({ controls: false, groups: 0, svg: true });
});

test("the docs have a Replay page in the contents, and the gallery draws a frame of a replay from the code beside it", async ({ page }) => {
  await serve(page);
  await page.goto("http://kyogijo.test/docs/replay.html");
  await expect(page.locator("h1#replay")).toHaveText("Replay");
  await expect(page.locator('[data-testid="docs-nav"] a[href="replay.html"]')).toBeAttached();
  await page.goto("http://kyogijo.test/docs/gallery-data.html");
  for (const id of ["replay-rink", "replay-pitch"]) {
    const item = page.locator(`#${id}`);
    await item.scrollIntoViewIfNeeded();
    await expect(item.locator('g[id$="replay-players"]')).toHaveCount(1);
    expect(await item.locator('g[id$="replay-numbers"] text').count()).toBeGreaterThanOrEqual(5);
    expect(await item.locator("pre code").textContent()).toContain('from "@johnmorrisdotca/kyogijo-stadiums/replay"');
  }
  await noSidewaysScroll(page);
});
