// The sound in the demo, in a real browser with a stand-in for the audio (e2e/fake-audio.mjs), so that nothing is heard: off when a page opens and nothing fetched or made until the reader
// turns it on; then only the recordings the surface uses, one audio context, the crowd's levels as buttons that the surface offers, all of it in the address; and quiet while the page is
// hidden or the view is out of sight.
import { expect, test } from "@playwright/test";

import { serve } from "./demo.mjs";
import { fakeAudio } from "./fake-audio.mjs";

const at = (id) => `[data-testid="${id}"]`;
const audio = (page) => page.evaluate(() => ({ ...window.__audio }));

/** Open a page of the demo with the stand-in audio, and keep the addresses of the recordings it fetches. */
async function open(page, path) {
  const errors = [];
  const sounds = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("request", (request) => request.url().includes("/sounds/") && sounds.push(new URL(request.url()).pathname.replace(/^\/sounds\//, "")));
  await page.addInitScript(fakeAudio);
  await serve(page);
  await page.goto(`http://kyogijo.test/${path}`);
  return { errors, sounds };
}

test.describe("the crowd of a real arena (venues.html)", () => {
  test("is off when the page opens, and nothing is fetched or made until Sound is pressed", async ({ page }) => {
    const code = [];
    page.on("request", (request) => /\/dist\/sound(-entry|\.dom|\.mix|\.synth)\.js$/.test(request.url()) && code.push(request.url().split("/").pop()));
    const { errors, sounds } = await open(page, "venues.html");
    await page.waitForSelector('body[data-ready="true"]');
    const bar = page.locator(at("sound-bar"));
    await expect(bar).toBeVisible();
    await expect(page.locator(at("sound-toggle"))).toHaveAttribute("aria-pressed", "false");
    // Off, the bar is the button alone: no volume, no levels, and the sound's code not loaded.
    await expect(page.locator(at("sound-levels"))).toBeHidden();
    await expect(page.locator(at("sound-volume"))).toBeHidden();
    expect((await audio(page)).contexts).toBe(0);
    expect(sounds).toEqual([]);
    expect(code).toEqual([]);

    await page.locator(at("sound-toggle")).click();
    await expect(page.locator(at("sound-toggle"))).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(`${at("sound-levels")} button`)).toHaveText(["Quiet", "Murmur", "Engaged", "Loud", "Roar"]);
    expect(code).toEqual(["sound-entry.js", "sound.dom.js", "sound.mix.js", "sound.synth.js"].filter((f) => code.includes(f)));
    expect(code).toContain("sound.dom.js");
    await expect.poll(() => audio(page).then((a) => a.state)).toBe("running");
    // An arena's bed is the murmur and the applause; hockey's cues use the "ooh" and the whistle. Opus where the browser decodes it, else AAC; never the pool's water or the ring's bell.
    await expect.poll(() => sounds.map((s) => s.replace(/\.(ogg|m4a)$/, "")).sort()).toEqual(["applause", "murmur", "ooh", "whistle"]);
    const a = await audio(page);
    expect(a.contexts).toBe(1);
    // The room, the murmur, the applause, the roar and the roar's swell, looping.
    expect(a.running).toBe(5);
    await expect(page).toHaveURL(/[?&]sound=on/);
    expect(errors).toEqual([]);
  });

  test("keeps the level and the volume in the address, and an address with them opens with them", async ({ page }) => {
    await open(page, "venues.html");
    await page.waitForSelector('body[data-ready="true"]');
    await page.locator(at("sound-toggle")).click();
    await page.locator(at("sound-level-loud")).click();
    await expect(page.locator(at("sound-level-loud"))).toHaveAttribute("aria-pressed", "true");
    await page.locator(at("sound-volume")).fill("30");
    await expect(page).toHaveURL(/[?&]level=loud/);
    await expect(page).toHaveURL(/[?&]volume=30/);

    const again = await page.context().newPage();
    await open(again, "venues.html?sound=on&level=roar&volume=20");
    await again.waitForSelector('body[data-ready="true"]');
    await expect(again.locator(at("sound-toggle"))).toHaveAttribute("aria-pressed", "true");
    // A browser lets audio start only after a press: nothing is made until the reader's first press on the page.
    expect((await audio(again)).contexts).toBe(0);
    await again.locator("h1").click();
    await expect.poll(() => audio(again).then((a) => a.state)).toBe("running");
    await expect(again.locator(at("sound-level-roar"))).toHaveAttribute("aria-pressed", "true");
    await expect(again.locator(at("sound-volume"))).toHaveValue("20");
  });

  test("goes quiet while the page is hidden and while the view is out of sight, and stops its loops", async ({ page }) => {
    await open(page, "venues.html");
    await page.waitForSelector('body[data-ready="true"]');
    await page.locator(at("sound-toggle")).click();
    await expect.poll(() => audio(page).then((a) => a.state)).toBe("running");
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect.poll(() => audio(page).then((a) => `${a.state} ${a.running}`)).toBe("suspended 0");
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect.poll(() => audio(page).then((a) => `${a.state} ${a.running}`)).toBe("running 5");
    // The view out of sight: a tall space under the page, and the page scrolled down past the view.
    await page.evaluate(() => {
      document.body.style.paddingBottom = "4000px";
      window.scrollTo(0, document.body.scrollHeight);
    });
    await expect.poll(() => audio(page).then((a) => `${a.state} ${a.running}`)).toBe("suspended 0");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => audio(page).then((a) => a.state)).toBe("running");
  });

  test("turned off, stops and suspends, and on again plays without fetching again", async ({ page }) => {
    const { sounds } = await open(page, "venues.html");
    await page.waitForSelector('body[data-ready="true"]');
    await page.locator(at("sound-toggle")).click();
    await expect.poll(() => sounds.length).toBe(4);
    await page.locator(at("sound-toggle")).click();
    await expect.poll(() => audio(page).then((a) => `${a.state} ${a.running}`)).toBe("suspended 0");
    await page.locator(at("sound-toggle")).click();
    await expect.poll(() => audio(page).then((a) => `${a.state} ${a.running}`)).toBe("running 5");
    expect(sounds.length).toBe(4);
    expect((await audio(page)).contexts).toBe(1);
  });

  test("names its controls in Japanese", async ({ page }) => {
    await open(page, "venues.html?lang=ja");
    await page.waitForSelector('body[data-ready="true"]');
    await expect(page.locator(at("sound-toggle"))).toHaveText("サウンド");
    await page.locator(at("sound-toggle")).click();
    await expect(page.locator(`${at("sound-levels")} button`)).toHaveText(["静か", "ざわめき", "盛り上がり", "歓声", "大歓声"]);
  });
});

test.describe("the surface's sound in Try it (index.html)", () => {
  test("offers the levels of each surface's venue: five for a rink, two for kyudo, none with the crowd off", async ({ page }) => {
    const { errors } = await open(page, "?sport=nhl&crowd=1");
    await page.waitForSelector(`${at("stage")}[data-ready="true"] svg.kyogijo`);
    const levels = page.locator(`${at("try-sound-levels")} button`);
    await expect(page.locator(at("try-sound"))).toBeVisible();
    await page.locator(at("try-sound-toggle")).click();
    await expect(levels).toHaveText(["Quiet", "Murmur", "Engaged", "Loud", "Roar"]);
    await page.goto("http://kyogijo.test/?sport=kyudo&crowd=1");
    await page.waitForSelector(`${at("stage")}[data-ready="true"] svg.kyogijo`);
    await page.locator(at("try-sound-toggle")).click();
    await expect(levels).toHaveText(["Quiet", "Murmur"]);
    await page.goto("http://kyogijo.test/?sport=soccer&crowd=0");
    await page.waitForSelector(`${at("stage")}[data-ready="true"] svg.kyogijo`);
    await page.locator(at("try-sound-toggle")).click();
    await expect(page.locator(at("try-sound-volume"))).toBeVisible();
    await expect(page.locator(at("try-sound-levels"))).toBeHidden();
    await expect(page.locator(at("try-sound-toggle"))).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("changes its bed with the surface: a pool fetches the water and the cheer", async ({ page }) => {
    const { sounds } = await open(page, "?sport=swimming&crowd=1");
    await page.waitForSelector(`${at("stage")}[data-ready="true"] svg.kyogijo`);
    await page.locator(at("try-sound-toggle")).click();
    // On a phone the bar's buttons may leave the surface below the screen, and out of sight the sound waits: bring it into view.
    await page.locator(at("stage")).scrollIntoViewIfNeeded();
    await expect.poll(() => sounds.map((s) => s.replace(/\.(ogg|m4a)$/, "")).sort()).toEqual(["applause", "cheer", "murmur", "water", "whistle"]);
    await expect.poll(() => audio(page).then((a) => a.running)).toBe(6);
    expect((await audio(page)).contexts).toBe(1);
  });
});

test.describe("the game's sound", () => {
  test("the hero's arena: its crowd on its own, then Follow the game while Play a game plays", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const { errors } = await open(page, "");
    await page.waitForSelector(`${at("feature-stage")} .ky-turn`);
    await page.locator(at("feature-sound-toggle")).click();
    await expect.poll(() => audio(page).then((a) => a.state)).toBe("running");
    await expect(page.locator(`${at("feature-sound-levels")} button`)).toHaveText(["Quiet", "Murmur", "Engaged", "Loud", "Roar"]);
    await page.locator(at("feature-game")).click();
    await expect(page.locator(at("feature-sound-level-auto"))).toHaveText("Follow the game");
    await expect(page.locator(at("feature-sound-level-auto"))).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(/[?&]fsound=on/);
    // Play a game off: no game to follow.
    await page.locator(at("feature-game")).click();
    await expect(page.locator(at("feature-sound-level-auto"))).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("the game section: the horn at a goal while it plays, nothing while it is paused, nothing on a seek past a goal", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const { errors } = await open(page, "");
    const bar = page.locator(at("game-sound"));
    await page.locator("#game").scrollIntoViewIfNeeded();
    await expect(page.locator("#game-stage .ky-turn-replay")).toBeVisible();
    const play = page.locator("#game-stage").getByRole("button", { name: "Play" });
    const pause = page.locator("#game-stage").getByRole("button", { name: "Pause" });
    await page.locator(at("game-sound-toggle")).click();
    await expect(page.locator(at("game-sound-level-auto"))).toHaveAttribute("aria-pressed", "true");
    // Paused: the game's sound waits.
    await expect.poll(() => audio(page).then((a) => a.contexts)).toBe(1);
    expect((await audio(page)).state).not.toBe("running");
    // A seek past the first goal (122.54 s: the game clock stops at a stoppage, so the replay's clock runs past it) calls no cue.
    await page.locator(`${at("game-stage")} .ky-position`).fill("128");
    expect(await bar.getAttribute("data-cues")).toBeNull();
    // Just before it, played: the horn (three low saws and one a little apart) and the crowd's swell.
    await page.locator(`${at("game-stage")} .ky-position`).fill("121.5");
    await play.click();
    await expect.poll(() => audio(page).then((a) => a.state)).toBe("running");
    await expect.poll(() => bar.getAttribute("data-cue"), { timeout: 10_000 }).toBe("swell");
    expect((await audio(page)).tones.filter((f) => f > 97 && f < 150).length).toBeGreaterThanOrEqual(4);
    await pause.click();
    await expect.poll(() => audio(page).then((a) => `${a.state} ${a.running}`)).toBe("suspended 0");
    expect(errors).toEqual([]);
  });
});

test.describe("live events", () => {
  test("the live score: each goal pushed as it comes plays the horn and the swell, and Follow the game is offered", async ({ page }) => {
    const { errors } = await open(page, "");
    await page.locator("#live").scrollIntoViewIfNeeded();
    const bar = page.locator(at("live-sound"));
    await expect(page.locator(at("live-sound-level-auto"))).toHaveCount(0);
    await page.locator(at("live-sound-toggle")).click();
    await expect.poll(() => audio(page).then((a) => a.state)).toBe("running");
    await page.locator(at("live-step")).click();
    await expect(bar).toHaveAttribute("data-cue", "swell");
    expect((await audio(page)).tones.filter((f) => f > 97 && f < 150).length).toBeGreaterThanOrEqual(4);
    await expect(page.locator(at("live-sound-level-auto"))).toHaveAttribute("aria-pressed", "true");
    // Turned off, a goal plays nothing.
    await page.locator(at("live-sound-toggle")).click();
    const cues = await bar.getAttribute("data-cues");
    await page.locator(at("live-step")).click();
    expect(await bar.getAttribute("data-cues")).toBe(cues);
    expect(errors).toEqual([]);
  });
});

test.describe("what is made", () => {
  test("renders offline (no speaker): never silent, never clipped, louder level by level, and a goal over the crowd", async ({ page, browserName }) => {
    // An OfflineAudioContext renders the samples into memory and plays nothing; Chromium's is the one held here.
    test.skip(browserName !== "chromium", "rendered in Chromium");
    await serve(page);
    await page.goto("http://kyogijo.test/venues.html");
    const out = await page.evaluate(async () => {
      const { createKyogijoSound } = await import("./dist/sound-entry.js");
      const files = Object.fromEntries(["murmur", "applause", "water", "whistle", "bell", "ooh", "cheer"].map((n) => [n, `sounds/${n}.ogg`]));
      const render = async (sport, level, cues = [], withFiles = true) => {
        const ctx = new window.OfflineAudioContext(2, 48000 * 3, 48000);
        ctx.resume = () => Promise.resolve();
        ctx.suspend = () => Promise.resolve();
        const sound = createKyogijoSound({ sport, level, volume: 1, files: withFiles ? files : {}, audio: () => ctx });
        await sound.enable();
        await new Promise((done) => setTimeout(done, 200));
        for (const kind of cues) sound.cue({ kind });
        const samples = (await ctx.startRendering()).getChannelData(0);
        sound.destroy();
        let sum = 0;
        let peak = 0;
        let bad = 0;
        for (const v of samples) {
          if (!Number.isFinite(v)) bad++;
          sum += v * v;
          peak = Math.max(peak, Math.abs(v));
        }
        return { rms: 10 * Math.log10(sum / samples.length), peak: 20 * Math.log10(peak), bad };
      };
      const levels = {};
      for (const level of ["quiet", "murmur", "engaged", "loud", "roar"]) levels[level] = await render("nhl", level);
      return { levels, goal: await render("nhl", "engaged", ["goal"]), made: await render("soccer", "loud", ["whistle"], false), pool: await render("swimming", "engaged", ["start"]), ring: await render("boxing", "quiet", ["round-start"]) };
    });
    const all = [...Object.values(out.levels), out.goal, out.made, out.pool, out.ring];
    for (const r of all) {
      expect(r.bad).toBe(0);
      expect(r.rms).toBeGreaterThan(-45);
      expect(r.peak).toBeLessThan(-1);
    }
    const order = ["quiet", "murmur", "engaged", "loud", "roar"].map((l) => out.levels[l].rms);
    for (let i = 1; i < order.length; i++) expect(order[i], `level ${i}`).toBeGreaterThan(order[i - 1]);
    expect(out.goal.rms).toBeGreaterThan(out.levels.engaged.rms + 3);
  });
});
