/* global performance */
// The camera that follows the play: in the flat replay (its viewBox) and on the 3D view (a point of the floor and a zoom over the view's), it eases (no jump between two frames), the reader's
// own drag holds it until Resume, it asks for no frame of its own (none while paused, hidden or out of sight; one a frame with the auto-turn too), it grows nothing over ten loops and leaves
// nothing after destroy; with reduced motion it steps. And the demo keeps the choice in its address.
import { expect, test } from "@playwright/test";

import { at, open, serve } from "./demo.mjs";
import { COUNTERS, framesOver } from "./budget.lib.mjs";

/** A page with nothing on it but the package, the examples' game and a box for the view, below `offset` pixels of nothing. */
async function bare(page, offset = 0) {
  await page.addInitScript(COUNTERS);
  await serve(page);
  await page.route("http://kyogijo.test/bare.html", (route) => route.fulfill({ contentType: "text/html", body: `<!doctype html><meta charset="utf-8"><body style="margin:0"><div style="height:${offset}px"></div><div id="rink" style="width:900px"></div></body>` }));
  await page.goto("http://kyogijo.test/bare.html");
  await page.evaluate(async () => {
    const { mountKyogijoTurn } = await import("./dist/turn-entry.js");
    const { mountKyogijo } = await import("./dist/mount-entry.js");
    const game = await (await fetch("./examples/games/canada-japan.json")).json();
    // A short loop of the game: its first eight seconds.
    window.__short = { ...game.timeline, frames: game.timeline.frames.filter((f) => f.t <= 8), events: game.timeline.events.filter((e) => e.t <= 8) };
    window.__game = game;
    window.__mount = (kind, settings = {}, timeline = game.timeline) => {
      const host = document.querySelector("#rink");
      window.__view = kind === "3d" ? mountKyogijoTurn(host, { sport: "nhl" }, { preset: "broadcast", ...settings.view }) : mountKyogijo(host, { sport: "nhl" });
      window.__replay = window.__view.replay(timeline, { motion: "smooth", follow: "action", ...settings.replay });
    };
    /** Where the camera is at each frame for `ms` milliseconds: the flat drawing's viewBox, or the floor's box on the screen. */
    window.__track = (ms) =>
      new Promise((done) => {
        const seen = [];
        const start = performance.now();
        const look = () => {
          const svg = document.querySelector("#rink .ky-replay .ky-stage svg.kyogijo");
          if (svg !== null) {
            const [x, y, w, h] = svg.getAttribute("viewBox").split(" ").map(Number);
            // In screen pixels: the drawing is as wide as the box.
            const k = svg.getBoundingClientRect().width / w;
            seen.push({ cx: (x + w / 2) * k, cy: (y + h / 2) * k, size: w * k });
          } else {
            const r = document.querySelector("#rink .ky-turn-floor").getBoundingClientRect();
            seen.push({ cx: r.x + r.width / 2, cy: r.y + r.height / 2, size: r.width });
          }
          if (performance.now() - start < ms) requestAnimationFrame(look);
          else done(seen);
        };
        requestAnimationFrame(look);
      });
  });
}

/** The largest move of the camera between two frames, in screen pixels (the middle, and the size relative to it). */
const largestStep = (seen) => {
  let most = 0;
  for (let i = 1; i < seen.length; i += 1) most = Math.max(most, Math.hypot(seen[i].cx - seen[i - 1].cx, seen[i].cy - seen[i - 1].cy), Math.abs(seen[i].size - seen[i - 1].size) / 2);
  return most;
};
const travelled = (seen) => Math.hypot(seen.at(-1).cx - seen[0].cx, seen.at(-1).cy - seen[0].cy) + Math.abs(seen.at(-1).size - seen[0].size);

test.describe("the follow camera", () => {
  test.use({ reducedMotion: "no-preference" });

  for (const kind of ["flat", "3d"]) {
    test(`${kind}: eases from the whole surface into the action, with no jump between two frames`, async ({ page }) => {
      await bare(page);
      await page.evaluate((k) => window.__mount(k, { replay: { follow: "off" } }), kind);
      await page.evaluate(() => window.__replay.seek(18));
      const whole = await page.evaluate(() => window.__track(50));
      // Turned on while it plays: the camera glides from the whole surface; and on, as the play goes.
      await page.evaluate(() => {
        window.__replay.play();
        window.__replay.setFollow("action");
      });
      const seen = await page.evaluate(() => window.__track(2500));
      expect(travelled([whole[0], ...seen])).toBeGreaterThan(80);
      expect(largestStep([whole[0], ...seen])).toBeLessThan(kind === "flat" ? 40 : 30);
      // Turned off, it glides back to the whole surface and stops there.
      await page.evaluate(() => window.__replay.setFollow("off"));
      const back = await page.evaluate(() => window.__track(3500));
      expect(largestStep(back)).toBeLessThan(kind === "flat" ? 40 : 30);
      if (kind === "flat") expect(await page.locator("#rink svg.kyogijo").getAttribute("viewBox")).toBe("-8 -8 216 101");
      else expect(Math.abs(back.at(-1).size - whole[0].size)).toBeLessThan(1);
    });
  }

  test("3d: a drag of the reader's holds it until Resume, and a viewpoint takes it back to the whole surface", async ({ page }) => {
    await bare(page);
    await page.evaluate(() => {
      window.__mount("3d");
      window.__replay.seek(18);
      window.__replay.play();
    });
    const bar = page.locator("#rink .ky-turn-replay");
    await expect(bar.getByRole("button", { name: "Follow the action: close in on the puck or ball and those nearest it" })).toHaveAttribute("aria-pressed", "true");
    await expect(bar.locator(".ky-follow-resume")).toBeHidden();
    await page.waitForTimeout(1500);
    const stage = page.locator("#rink .ky-turn-view");
    const box = await stage.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 4 });
    await page.mouse.up();
    expect(await page.evaluate(() => [window.__replay.state().follow, window.__replay.state().followHeld])).toEqual(["action", true]);
    await expect(bar.locator(".ky-follow-resume")).toBeVisible();
    // Held: the game plays on, and the camera stays where the reader left it.
    const held = await page.evaluate(() => document.querySelector("#rink .ky-turn-floor").style.transform);
    const t = await page.evaluate(() => window.__replay.state().t);
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => window.__replay.state().t)).toBeGreaterThan(t);
    expect(await page.evaluate(() => document.querySelector("#rink .ky-turn-floor").style.transform)).toBe(held);
    // Resume: it follows again.
    await bar.locator(".ky-follow-resume").click();
    await expect(bar.locator(".ky-follow-resume")).toBeHidden();
    await expect.poll(() => page.evaluate(() => document.querySelector("#rink .ky-turn-floor").style.transform)).not.toBe(held);
    // A viewpoint holds it too, and the view glides to the viewpoint with the whole surface in it.
    const plain = await page.evaluate(async () => {
      const { mountKyogijoTurn } = await import("./dist/turn-entry.js");
      const scratch = document.createElement("div");
      scratch.style.width = "900px";
      document.body.append(scratch);
      const view = mountKyogijoTurn(scratch, { sport: "nhl" }, { preset: "overhead" });
      const floor = scratch.querySelector(".ky-turn-floor").style.transform;
      view.destroy();
      scratch.remove();
      return floor;
    });
    await page.locator('#rink button[data-preset="overhead"]').click();
    await expect(bar.locator(".ky-follow-resume")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.querySelector("#rink .ky-turn-floor").style.transform)).toBe(plain);
  });

  test("3d: follows with the auto-turn running, one frame a frame, and asks for none while paused, hidden or out of sight", async ({ page }) => {
    await bare(page, 3000);
    await page.locator("#rink").scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      window.__mount("3d");
      window.__replay.seek(18);
    });
    // Paused with the camera on: nothing.
    await page.waitForTimeout(200);
    expect((await framesOver(page, 600)).asked).toBe(0);
    await page.evaluate(() => {
      window.__view.play();
      window.__replay.play();
    });
    const together = await framesOver(page, 800);
    expect(together.asked).toBeGreaterThan(10);
    expect(together.most).toBe(1);
    expect(await page.evaluate(() => [window.__view.playing, window.__replay.state().playing, window.__replay.state().follow])).toEqual([true, true, "action"]);
    // Out of sight.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    expect((await framesOver(page, 600)).asked).toBe(0);
    await page.locator("#rink").scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    expect((await framesOver(page, 400)).asked).toBeGreaterThan(3);
    // Hidden.
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(100);
    expect((await framesOver(page, 600)).asked).toBe(0);
    expect(await page.evaluate(() => window.__pending())).toBe(0);
  });

  test("flat: asks for no frame while paused, and a seek moves the camera at once", async ({ page }) => {
    await bare(page);
    await page.evaluate(() => window.__mount("flat"));
    const svg = page.locator("#rink svg.kyogijo");
    await page.waitForTimeout(200);
    expect((await framesOver(page, 500)).asked).toBe(0);
    await page.evaluate(() => window.__replay.seek(18));
    const there = await svg.getAttribute("viewBox");
    expect(there).not.toBe("-8 -8 216 101");
    expect((await framesOver(page, 500)).asked).toBe(0);
    expect(await svg.getAttribute("viewBox")).toBe(there);
  });

  test("with reduced motion it steps: the camera jumps with each step and asks for no frame", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await bare(page);
    await page.evaluate(() => window.__mount("flat", { replay: { motion: "auto" } }));
    const svg = page.locator("#rink svg.kyogijo");
    expect(await page.evaluate(() => window.__replay.state().motion)).toBe("step");
    const first = await svg.getAttribute("viewBox");
    const seen = new Set([first]);
    for (let i = 0; i < 12; i += 1) {
      await page.locator("#rink").getByRole("button", { name: "Forward" }).click();
      seen.add(await svg.getAttribute("viewBox"));
    }
    expect(seen.size).toBeGreaterThan(2);
    expect((await framesOver(page, 500)).asked).toBe(0);
  });

  test("grows nothing over ten loops with the camera following and the auto-turn running, and destroy leaves nothing", async ({ page, browserName }) => {
    test.setTimeout(120_000);
    await bare(page);
    const empty = await page.evaluate(() => window.__listeners());
    await page.evaluate(() => {
      window.__mount("3d", { replay: { loop: true, speed: 4 } }, window.__short);
      window.__view.play();
      window.__replay.play();
      window.__loops = 0;
      window.__replay.subscribe((change) => {
        if (change.reason === "tick" && change.state.t < window.__last) window.__loops += 1;
        window.__last = change.state.t;
      });
    });
    const count = () =>
      page.evaluate(() => {
        window.__replay.pause();
        window.__replay.seek(window.__replay.state().start + 6);
        const out = { nodes: document.querySelector("#rink").querySelectorAll("*").length, listeners: window.__listeners() };
        window.__replay.play();
        return out;
      });
    await expect.poll(() => page.evaluate(() => window.__loops), { timeout: 20_000 }).toBeGreaterThanOrEqual(1);
    const first = await count();
    await expect.poll(() => page.evaluate(() => window.__loops), { timeout: 60_000 }).toBeGreaterThanOrEqual(10);
    expect(await count()).toEqual(first);
    // The replay's destroy gives the view back as it was: no aim on the floor (the floor of a view turned the same way with no replay on it).
    await page.evaluate(() => window.__view.pause());
    const plain = await page.evaluate(async () => {
      const { mountKyogijoTurn } = await import("./dist/turn-entry.js");
      const scratch = document.createElement("div");
      scratch.style.width = "900px";
      document.body.append(scratch);
      const view = mountKyogijoTurn(scratch, { sport: "nhl" }, { preset: "broadcast" });
      view.set(window.__view.view(), false);
      const floor = scratch.querySelector(".ky-turn-floor").style.transform;
      view.destroy();
      scratch.remove();
      return floor;
    });
    await page.evaluate(() => window.__replay.destroy());
    expect(await page.evaluate(() => document.querySelector("#rink .ky-turn-floor").style.transform)).toBe(plain);
    await page.evaluate(() => window.__view.destroy());
    expect(await page.evaluate(() => document.querySelector("#rink").childElementCount)).toBe(0);
    expect(await page.evaluate(() => window.__listeners())).toBe(empty);
    await page.waitForTimeout(50);
    expect((await framesOver(page, 400)).asked).toBe(0);
    expect(await page.evaluate(() => window.__pending())).toBe(0);
    expect(browserName).toBeTruthy();
  });

  test("the element follows by its attribute", async ({ page }) => {
    await bare(page);
    const out = await page.evaluate(async () => {
      await import("./dist/element-define.js");
      const el = document.createElement("kyogijo-field");
      el.setAttribute("sport", "nhl");
      el.setAttribute("follow", "puck");
      el.timeline = window.__short;
      document.body.append(el);
      const first = el.replay.state().follow;
      el.setAttribute("follow", "off");
      const result = { first, then: el.replay.state().follow, buttons: el.shadowRoot.querySelectorAll(".ky-follow button").length };
      el.remove();
      return result;
    });
    expect(out).toEqual({ first: "puck", then: "off", buttons: 3 });
  });
});

test.describe("the demo keeps the follow camera in its address", () => {
  test.use({ reducedMotion: "no-preference" });

  test("the game section: Action writes follow=action, pressing it again takes it away, and an address with follow=puck opens following the puck", async ({ page }) => {
    const errors = await open(page, "?lang=en&help=off");
    await page.locator("#game").scrollIntoViewIfNeeded();
    const bar = page.locator("#game-stage .ky-turn-replay");
    await expect(bar).toBeVisible();
    const action = bar.locator(".ky-follow-action");
    await expect(action).toHaveAttribute("aria-pressed", "false");
    await action.click();
    await expect(action).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => new URL(page.url()).searchParams.get("follow")).toBe("action");
    await action.click();
    await expect.poll(() => new URL(page.url()).searchParams.get("follow")).toBeNull();
    expect(errors).toEqual([]);
    await open(page, "?lang=ja&help=off&follow=puck");
    await page.locator("#game").scrollIntoViewIfNeeded();
    await expect(page.locator("#game-stage .ky-turn-replay .ky-follow-puck")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#game-stage .ky-turn-replay .ky-follow-puck")).toHaveText("パック");
    // Flat, from the same address.
    await page.locator(at("game-flat")).click();
    await expect(page.locator("#game-stage .ky-replay .ky-follow-puck")).toHaveAttribute("aria-pressed", "true");
  });

  test("the hero's Play a game starts following when the address says so", async ({ page }) => {
    const errors = await open(page, "?lang=en&help=off&follow=action");
    await page.locator(at("feature-game")).click();
    const bar = page.locator("#feature-stage .ky-turn-replay");
    await expect(bar).toBeVisible();
    await expect(bar.locator(".ky-follow-action")).toHaveAttribute("aria-pressed", "true");
    await bar.locator(".ky-follow-puck").click();
    await expect.poll(() => new URL(page.url()).searchParams.get("follow")).toBe("puck");
    expect(errors).toEqual([]);
  });
});
