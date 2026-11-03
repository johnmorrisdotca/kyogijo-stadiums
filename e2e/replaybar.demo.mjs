// The one replay bar: a game's replay on the flat surface, a game's on the 3D view and a race (flat and 3D) are made from the same bar, so that they have the same buttons in the same order, the same keys and the same
// speeds as buttons (no dropdown), loop, back to the start and a step, and the places for the buttons other features add.
import { expect, test } from "@playwright/test";

import { serve } from "./demo.mjs";

test.use({ reducedMotion: "no-preference" });

async function bare(page) {
  await serve(page);
  await page.route("http://kyogijo.test/bare.html", (route) =>
    route.fulfill({ contentType: "text/html", body: '<!doctype html><meta charset="utf-8"><body style="margin:0"><div id="flat" style="width:900px"></div><div id="rink" style="width:900px"></div><div id="race" style="width:900px"></div><div id="race3" style="width:900px"></div></body>' }),
  );
  await page.goto("http://kyogijo.test/bare.html");
  await page.evaluate(async () => {
    const { mountKyogijo } = await import("./dist/mount-entry.js");
    const { mountKyogijoTurn } = await import("./dist/turn-entry.js");
    const { mountCircuitRace } = await import("./dist/circuits-entry.js");
    const game = await (await fetch("./examples/games/canada-japan.json")).json();
    const timeline = { ...game.timeline, frames: game.timeline.frames.filter((f) => f.t <= 16), events: game.timeline.events.filter((e) => e.t <= 16) };
    window.__flat = mountKyogijo(document.querySelector("#flat"), { sport: "nhl" }).replay(timeline, { motion: "smooth" });
    window.__view = mountKyogijoTurn(document.querySelector("#rink"), { sport: "nhl", style: "none" }, { preset: "broadcast" });
    window.__game3d = window.__view.replay(timeline, { motion: "smooth" });
    const race = { circuit: "las-vegas", laps: 3, cars: 6, seed: 4 };
    window.__race = mountCircuitRace(document.querySelector("#race"), race, { motion: "smooth", speed: 10 });
    window.__race3d = mountCircuitRace(document.querySelector("#race3"), race, { motion: "smooth", view: "3d", speed: 10 });
  });
  await page.waitForSelector('#race3 .ky-turn[data-mode="3d"]');
}

const HOSTS = { flat: "#flat", game3d: "#rink", race: "#race", race3d: "#race3" };
const bar = (host) => `${host} .ky-controls`;

test("every replay and the race have the same bar: the same buttons in the same order, the speeds as buttons and no dropdown", async ({ page }) => {
  await bare(page);
  const shape = (host) =>
    page.locator(bar(host)).evaluate((el) => ({
      tags: [...el.children].map((c) => `${c.localName}.${c.className.replace(/ ky-step/, "")}`),
      buttons: [...el.querySelectorAll(":scope > button")].map((b) => b.className.replace(/ ky-step/, "")),
      select: el.querySelectorAll("select").length,
      speeds: [...el.querySelectorAll(".ky-speeds button")].map((b) => b.dataset.speed),
      pressed: [...el.querySelectorAll(".ky-speeds button[aria-pressed=true]")].map((b) => b.dataset.speed),
      slots: [...el.querySelectorAll(".ky-slot")].map((s) => s.dataset.slot),
      clock: el.querySelectorAll(".ky-readout > output.ky-clock").length,
      range: el.querySelectorAll("input[type=range].ky-position").length,
    }));
  const flat = await shape(HOSTS.flat);
  expect(flat.tags).toEqual(["button.ky-start", "button.ky-back", "button.ky-play", "button.ky-forward", "span.ky-speeds", "button.ky-loop", "span.ky-slot ky-slot-follow", "span.ky-slot ky-slot-sound", "span.ky-slot ky-slot-extra", "input.ky-position", "span.ky-readout"]);
  expect(flat.select).toBe(0);
  expect(flat.slots).toEqual(["follow", "sound", "extra"]);
  for (const [name, host] of Object.entries(HOSTS)) {
    const own = await shape(host);
    expect(own.tags, name).toEqual(flat.tags);
    expect(own.select, name).toBe(0);
    expect(own.clock, name).toBe(1);
    expect(own.range, name).toBe(1);
    expect(own.pressed, name).toHaveLength(1);
  }
  // Each gives its own speeds.
  expect((await shape(HOSTS.game3d)).speeds).toEqual(["0.25", "0.5", "1", "2", "4"]);
  expect((await shape(HOSTS.race)).speeds).toEqual(["1", "10", "60"]);
  expect((await shape(HOSTS.race)).pressed).toEqual(["10"]);
  // The slots show only while they hold something.
  for (const host of Object.values(HOSTS)) await expect(page.locator(`${bar(host)} .ky-slot`).first()).toBeHidden();
  await page.evaluate(() => {
    const b = document.createElement("button");
    b.className = "mine";
    b.textContent = "Mine";
    window.__race.slots.follow.append(b);
  });
  await expect(page.locator("#race .ky-slot-follow .mine")).toBeVisible();
  // Another language makes the buttons again, and what is in a slot stays.
  await page.evaluate(() => window.__race.update({ circuit: "las-vegas", language: "ja" }));
  await expect(page.locator("#race .ky-slot-follow .mine")).toBeVisible();
  await expect(page.locator("#race .ky-start")).toHaveAttribute("aria-label", "最初に戻る");
});

test("loop, back to the start, a step and a speed button do the same in a game's replay and in the race", async ({ page }) => {
  await bare(page);
  const read = (host) => page.evaluate((h) => {
    const s = (h === "#race" ? window.__race : window.__flat).state();
    return { t: s.t - (s.start ?? 0), playing: s.playing, speed: s.speed, loop: s.loop };
  }, host);
  // The speed buttons set the speed, and press in.
  await page.locator("#flat .ky-speed[data-speed=\"2\"]").click();
  await page.locator("#race .ky-speed[data-speed=\"60\"]").click();
  expect((await read("#flat")).speed).toBe(2);
  expect((await read("#race")).speed).toBe(60);
  await expect(page.locator("#flat .ky-speed[data-speed=\"2\"]")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#race .ky-speed[data-speed=\"60\"]")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#race .ky-speed[data-speed=\"10\"]")).toHaveAttribute("aria-pressed", "false");
  // Loop presses in and out.
  for (const host of ["#flat", "#race"]) {
    await page.locator(`${host} .ky-loop`).click();
    await expect(page.locator(`${host} .ky-loop`)).toHaveAttribute("aria-pressed", "true");
    expect((await read(host)).loop).toBe(true);
    await page.locator(`${host} .ky-loop`).click();
    expect((await read(host)).loop).toBe(false);
  }
  // A step goes on and back; the start goes to 0.
  await page.locator("#flat .ky-forward").click();
  expect((await read("#flat")).t).toBeGreaterThan(0);
  await page.locator("#flat .ky-start").click();
  expect((await read("#flat")).t).toBe(0);
  await page.locator("#race .ky-forward").click();
  const lap = (await read("#race")).t;
  expect(lap).toBeGreaterThan(30);
  await expect(page.locator("#race .ky-clock-line")).toHaveText("Lap 2 / 3");
  await page.locator("#race .ky-forward").click();
  expect((await read("#race")).t).toBeGreaterThan(lap);
  await page.locator("#race .ky-back").click();
  expect((await read("#race")).t).toBe(lap);
  await page.locator("#race .ky-start").click();
  expect((await read("#race")).t).toBe(0);
  await expect(page.locator("#race .ky-clock")).toHaveText("0:00");
});

test("the keys are the same: Space, the arrows or comma and full stop, Shift for a bigger step, Home and End", async ({ page }) => {
  await bare(page);
  const t = (name) => page.evaluate((n) => window[n].state().t, name);
  const playing = (name) => page.evaluate((n) => window[n].state().playing, name);
  // On the bar: a button is focused, and the arrows go by a step.
  await page.locator("#race .ky-forward").focus();
  await page.keyboard.press("ArrowRight");
  const one = await t("__race");
  expect(one).toBeGreaterThan(30);
  await page.keyboard.press("ArrowRight");
  expect(await t("__race")).toBeGreaterThan(one);
  await page.keyboard.press("ArrowLeft");
  expect(await t("__race")).toBe(one);
  await page.keyboard.press("Shift+ArrowRight");
  expect(await t("__race")).toBe(one + 60);
  await page.keyboard.press("Home");
  expect(await t("__race")).toBe(0);
  await page.keyboard.press("End");
  expect(await t("__race")).toBe(await page.evaluate(() => window.__race.state().duration));
  // The 3D race: Space plays the race (the view's own Space is the auto-turn), comma and full stop step, the arrows stay the view's.
  await page.evaluate(() => window.__race3d.seek(0));
  await page.locator("#race3 .ky-turn-view").focus();
  await page.keyboard.press("Space");
  expect(await playing("__race3d")).toBe(true);
  await page.keyboard.press("Space");
  expect(await playing("__race3d")).toBe(false);
  await page.keyboard.press("Period");
  const lap = await t("__race3d");
  expect(lap).toBeGreaterThan(30);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(200);
  expect(await t("__race3d")).toBe(lap);
  await page.keyboard.press("Comma");
  expect(await t("__race3d")).toBe(0);
});
