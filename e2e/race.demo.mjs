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
  await page.waitForSelector(`${STAGE} .ky-race`);
  return errors;
}

const press = async (page, locator, testInfo) => {
  await locator.scrollIntoViewIfNeeded();
  if (testInfo.project.use.hasTouch === true) await locator.tap();
  else await locator.click();
};
const dot = (page, id) => page.locator(`${STAGE} .ky-ci-car[data-car="${id}"]`);
const clock = (page) => page.locator(`${STAGE} .ky-race-time`);
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
  await expect(page.locator(`${STAGE} .ky-race-stage`)).toHaveText("On the grid");
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
  await press(page, page.locator(`${STAGE} .ky-race-bar button[data-speed="60"]`), testInfo);
  await press(page, page.locator(`${STAGE} .ky-race-play`), testInfo);
  await expect(page.locator(`${STAGE} .ky-race`)).toHaveAttribute("data-state", "playing");
  await page.waitForTimeout(1500);
  expect(seconds(await clock(page).textContent())).toBeGreaterThan(30);
  expect(await dot(page, leader).getAttribute("transform")).not.toBe(before);
  await expect(page.locator(`${STAGE} .ky-race-board tbody tr`).nth(1).locator('[data-col="gap"]')).toHaveText(/^\+\d/);
  await press(page, page.locator(`${STAGE} .ky-race-play`), testInfo);
  await expect(page.locator(`${STAGE} .ky-race`)).toHaveAttribute("data-state", "paused");
  // The slider: half way through the race, the lap and the board follow.
  await page.locator(`${STAGE} .ky-race-position`).evaluate((range) => {
    range.value = String(Math.round(Number(range.max) / 2));
    range.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator(`${STAGE} .ky-race-stage`)).toHaveText(/^Lap 2[0-9] \/ 50$/);
  await expect(page.locator(`${STAGE} .ky-race-board tbody tr`).first().locator('[data-col="gap"]')).toHaveText("Leader");
  await expect.poll(() => new URL(page.url()).searchParams.get("speed")).toBe("60");
  expect(Number(new URL(page.url()).searchParams.get("t"))).toBeGreaterThan(2000);
  expect(errors).toEqual([]);
});

test("comes back to where it was left, in Japanese, and finishes with the chequered flag", async ({ page }) => {
  const errors = await open(page, "circuits.html?race=1&lang=ja&t=99999");
  await expect(page.locator(`${STAGE} .ky-race-stage`)).toHaveText("チェッカーフラッグ");
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
  await press(page, page.locator(`${STAGE} .ky-race-play`), testInfo);
  await page.waitForTimeout(1200);
  expect(await first.evaluate((el) => el.style.transform)).not.toBe(before);
  expect(await page.locator(`${STAGE} .ky-up`).count()).toBeLessThanOrEqual(120);
  expect(errors).toEqual([]);
});

test("with reduced motion nothing plays by itself: play goes to the leader's next lap", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "circuits.html?race=1");
  const play = page.locator(`${STAGE} .ky-race-play`);
  await expect(play).toHaveAttribute("aria-label", "Next lap");
  await press(page, play, testInfo);
  await expect(page.locator(`${STAGE} .ky-race-stage`)).toHaveText("Lap 2 / 50");
  await expect(page.locator(`${STAGE} .ky-race`)).toHaveAttribute("data-state", "paused");
  const frames = await page.evaluate(() => window.__frames);
  await page.waitForTimeout(500);
  expect((await page.evaluate(() => window.__frames)) - frames).toBe(0);
});

test.describe("the race's freeze and leak rules", () => {
  for (const view of ["flat", "3d"]) {
    test(`${view}: asks for no frame while paused, hidden or out of sight, makes nothing as it plays, and leaves nothing when it goes`, async ({ page }, testInfo) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await open(page, `circuits.html?race=1&speed=60${view === "3d" ? "&view=3d" : ""}`);
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
      const play = page.locator(`${STAGE} .ky-race-play`);
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

/** A page with nothing on it but the package and a box for the race. */
async function bare(page) {
  await page.addInitScript(COUNTERS);
  await serve(page);
  await page.route("http://kyogijo.test/bare.html", (route) => route.fulfill({ contentType: "text/html", body: '<!doctype html><meta charset="utf-8"><body style="margin:0"><div id="race" style="width:900px"></div></body>' }));
  await page.goto("http://kyogijo.test/bare.html");
  await page.evaluate(async () => {
    const { mountCircuitRace } = await import("./dist/circuits-entry.js");
    window.__mount = (settings = {}) => {
      window.__race = mountCircuitRace(document.querySelector("#race"), { circuit: "las-vegas", laps: 3, cars: 8, seed: 4 }, { motion: "smooth", speed: 600, ...settings });
      return window.__race.state().duration;
    };
  });
}

test.describe("the race on a bare page: its budgets", () => {
  test.use({ reducedMotion: "no-preference" });

  for (const view of ["flat", "3d"]) {
    test(`${view}: grows nothing over ten races, the same elements and the same listeners`, async ({ page, browserName }) => {
      test.setTimeout(120_000);
      await bare(page);
      const cdp = browserName === "chromium" ? await page.context().newCDPSession(page) : undefined;
      const heap = async () => {
        if (cdp === undefined) return 0;
        await cdp.send("HeapProfiler.collectGarbage");
        return (await cdp.send("Runtime.getHeapUsage")).usedSize;
      };
      await page.evaluate((v) => window.__mount({ view: v }), view);
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

    test(`${view}: asks for one frame a frame while it plays, with the 3D view's auto-turn too, and none once it is paused`, async ({ page }) => {
      await bare(page);
      await page.evaluate((v) => window.__mount({ view: v, speed: 1 }), view);
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

    test(`${view}: destroy takes everything away, playing or not`, async ({ page }) => {
      await bare(page);
      // (The test's own tool listens on the window once it first waits for an element: it does so before the count is taken.)
      await page.waitForSelector("#race", { state: "attached" });
      const empty = await page.evaluate(() => window.__listening());
      await page.evaluate((v) => window.__mount({ view: v, speed: 60 }), view);
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
