/* global DataTransfer, File, DragEvent, Storage, DOMException */
// Bring your own feed, in the demo's game section: our made-up sample from the list, an address the reader gives (answered here by a made-up server, never a real one), a file, a paste, the plain words for a
// refusal, and a live follow that asks again every 15 seconds only while the page is shown and stops when the game is over or the server says no.
import { expect, test } from "@playwright/test";

import { at, open } from "./demo.mjs";

/** A made-up NHL-style play-by-play: invented sides and players, a few plays. */
const stub = (state = "LIVE", plays = 4) => ({
  gameState: state,
  gameType: 2,
  homeTeam: { id: 1, abbrev: "MTH", commonName: { default: "Moths" } },
  awayTeam: { id: 2, abbrev: "OWL", commonName: { default: "Owls" } },
  rosterSpots: [{ teamId: 1, playerId: 7, sweaterNumber: 17, firstName: { default: "Ada" }, lastName: { default: "Example" } }],
  plays: [
    { periodDescriptor: { number: 1, periodType: "REG" }, timeInPeriod: "00:00", typeDescKey: "faceoff", sortOrder: 1, details: { xCoord: 0, yCoord: 0 } },
    { periodDescriptor: { number: 1, periodType: "REG" }, timeInPeriod: "01:30", typeDescKey: "shot-on-goal", sortOrder: 2, details: { xCoord: 70, yCoord: -10, eventOwnerTeamId: 1, shootingPlayerId: 7 } },
    { periodDescriptor: { number: 1, periodType: "REG" }, timeInPeriod: "02:10", typeDescKey: "goal", sortOrder: 3, details: { xCoord: 82, yCoord: 3, eventOwnerTeamId: 1, scoringPlayerId: 7 } },
    { periodDescriptor: { number: 2, periodType: "REG" }, timeInPeriod: "03:00", typeDescKey: "goal", sortOrder: 4, details: { xCoord: -80, yCoord: 2, eventOwnerTeamId: 2 } },
    { periodDescriptor: { number: 2, periodType: "REG" }, timeInPeriod: "06:00", typeDescKey: "shot-on-goal", sortOrder: 5, details: { xCoord: -60, yCoord: 5, eventOwnerTeamId: 2 } },
  ].slice(0, plays),
});

const FEED = "http://feeds.test/pbp.json";
/** The made-up feed server: what it answers (or that it refuses the page), and what it was asked. */
async function feedServer(page, answer) {
  const asked = [];
  await page.route("http://feeds.test/**", async (route) => {
    asked.push(route.request().url());
    const { status = 200, body = "", refused = false } = await answer(asked.length);
    // A server that does not let another site's page read it: to the page that is a request that failed (the browser says no more), as here.
    if (refused) await route.abort("failed");
    else await route.fulfill({ status, body, contentType: "application/json", headers: { "access-control-allow-origin": "*" } });
  });
  return asked;
}

/** The demo, scrolled to the feed panel, with its list written. */
async function toFeed(page, query = "?lang=en&help=off") {
  const errors = await open(page, query);
  await page.locator(at("feed")).scrollIntoViewIfNeeded();
  await expect(page.locator(`${at("feed-sources")} li`).first()).toBeVisible();
  return errors;
}
const status = (page) => page.locator(at("feed-status"));

test.describe("bring your own feed", () => {
  test.use({ reducedMotion: "no-preference" });

  test("lists our made-up sample first; Use fills the field and it plays, and nothing else is asked for", async ({ page }) => {
    const asked = [];
    page.on("request", (request) => asked.push(request.url()));
    const errors = await toFeed(page);
    await expect(page.locator(`${at("feed-sources")} li`).first()).toHaveAttribute("data-source", "sample-canada-japan");
    await expect(page.locator(`${at("feed-sources")} li`).first()).toContainText("Sample feed (made up)");
    await expect(page.locator(at("feed-sources"))).toContainText("NHL play-by-play (public)");
    await expect(page.locator(at("feed-note"))).toContainText("You are responsible for the terms of the source you enter");
    // Use on the public feed only fills the field: nothing is fetched until the reader asks.
    await page.locator(at("feed-use-nhl-play-by-play")).click();
    await expect(page.locator(at("feed-url"))).toHaveValue(/^https:\/\/api-web\.nhle\.com\//);
    await page.locator(at("feed-use-sample-canada-japan")).click();
    await expect(page.locator(at("feed-url"))).toHaveValue("examples/games/canada-japan.json");
    await page.locator(at("feed-load")).click();
    await expect(status(page)).toHaveText(/^Playing CAN – JPN: \d+ events\.$/);
    await expect(page.locator("#game-stage .ky-turn-replay")).toBeVisible();
    expect(asked.filter((url) => !url.startsWith("http://kyogijo.test/"))).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("plays a feed from an address the reader gives, named by the feed: the sides, the periods and the score", async ({ page }) => {
    const asked = await feedServer(page, () => ({ body: JSON.stringify(stub("OFF", 5)) }));
    await toFeed(page);
    await page.locator(at("feed-url")).fill(FEED);
    await page.locator(at("feed-load")).click();
    await expect(status(page)).toHaveText("Playing MTH – OWL: 4 events.");
    await expect(page.locator(at("game-note"))).toHaveText("A feed you chose: the names and results are the source's.");
    await expect(page.locator("#game-periods button")).toHaveText(["Period 1", "Period 2"]);
    await page.locator("#game-periods button").nth(1).click();
    await expect(page.locator(at("game-score"))).toHaveText("Moths 1 – 0 Owls");
    expect(asked).toEqual([FEED]);
  });

  test("says plainly why an address could not be played: a refusal of the browser (CORS), a status, an answer that is not a feed, an address that is not one", async ({ page }) => {
    let mode = "cors";
    await feedServer(page, () => (mode === "cors" ? { refused: true } : mode === "403" ? { status: 403 } : { body: JSON.stringify({ hello: "world" }) }));
    await toFeed(page);
    await page.locator(at("feed-url")).fill(FEED);
    await page.locator(at("feed-load")).click();
    await expect(status(page)).toContainText("does not let a page of another site read it (CORS)");
    mode = "403";
    await page.locator(at("feed-load")).click();
    await expect(status(page)).toHaveText("The server answered 403.");
    mode = "junk";
    await page.locator(at("feed-load")).click();
    await expect(status(page)).toHaveText("That is not a feed this page reads: a kyogijo timeline or an NHL-style play-by-play.");
    await page.locator(at("feed-url")).fill("javascript:alert(1)");
    await page.locator(at("feed-load")).click();
    await expect(status(page)).toHaveText("That is not an address this page can read: give one that starts with https://.");
  });

  test("plays a pasted feed and a feed from a file", async ({ page }) => {
    await toFeed(page);
    await page.locator(at("feed-paste")).fill(JSON.stringify(stub("OFF", 3)));
    await page.locator(at("feed-paste-play")).click();
    await expect(status(page)).toHaveText("Playing MTH – OWL: 2 events.");
    await page.locator(at("feed-file")).setInputFiles({ name: "game.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(stub("OFF", 5))) });
    await expect(status(page)).toHaveText("Playing MTH – OWL: 4 events.");
    await page.locator(at("feed-paste")).fill("{ not json");
    await page.locator(at("feed-paste-play")).click();
    await expect(status(page)).toContainText("That is not a feed this page reads");
  });

  test("follows live: asks every 15 seconds while the page is shown, none while hidden, and stops when the game is over", async ({ page }) => {
    await page.clock.install();
    let plays = 3;
    const asked = await feedServer(page, () => ({ body: JSON.stringify(stub(plays >= 5 ? "OFF" : "LIVE", plays)) }));
    await toFeed(page);
    await page.locator(at("feed-url")).fill(FEED);
    await page.locator(at("feed-live")).click();
    await expect(page.locator(at("feed-live"))).toHaveAttribute("aria-pressed", "true");
    await expect(status(page)).toHaveText("Live: MTH – OWL, 2 events. Asked again every 15 seconds while this page is shown.");
    await page.clock.runFor(14_000);
    expect(asked).toHaveLength(1);
    plays = 4;
    await page.clock.runFor(1_500);
    await expect.poll(() => asked.length).toBe(2);
    await expect(status(page)).toHaveText("Live: MTH – OWL, 3 events. Asked again every 15 seconds while this page is shown.");
    // Hidden: nothing is asked, however long; shown again, it asks at once.
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.clock.runFor(120_000);
    expect(asked).toHaveLength(2);
    plays = 5;
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect.poll(() => asked.length).toBe(3);
    await expect(status(page)).toHaveText("The game is over: following stopped.");
    await expect(page.locator(at("feed-live"))).toHaveAttribute("aria-pressed", "false");
    await page.clock.runFor(120_000);
    expect(asked).toHaveLength(3);
  });

  test("stops following when the server says no (429), and when the reader presses Follow live again", async ({ page }) => {
    await page.clock.install();
    let refuse = false;
    const asked = await feedServer(page, () => (refuse ? { status: 429 } : { body: JSON.stringify(stub("LIVE", 3)) }));
    await toFeed(page);
    await page.locator(at("feed-url")).fill(FEED);
    await page.locator(at("feed-live")).click();
    await expect(status(page)).toContainText("Live: MTH – OWL");
    refuse = true;
    await page.clock.runFor(15_500);
    await expect(status(page)).toHaveText("The server asked us to stop (403 or 429): following stopped.");
    await page.clock.runFor(300_000);
    expect(asked).toHaveLength(2);
    refuse = false;
    await page.locator(at("feed-live")).click();
    await expect(status(page)).toContainText("Live: MTH – OWL");
    await page.locator(at("feed-live")).click();
    await expect(status(page)).toHaveText("Stopped following.");
    await page.clock.runFor(60_000);
    expect(asked).toHaveLength(3);
  });

  test("speaks Japanese", async ({ page }) => {
    await toFeed(page, "?lang=ja&help=off");
    await expect(page.locator(`${at("feed")} h3`)).toHaveText("自分のフィードの再生");
    await expect(page.locator(`${at("feed-sources")} li`).first()).toContainText("サンプルフィード（架空）");
    await page.locator(at("feed-load")).click();
    await expect(status(page)).toHaveText("先にフィードのアドレスを入力するか、下の一覧から選んでください。");
  });
});

/** Drop files on an element as a reader dragging them from Finder would: a synthetic drop event carrying the files. */
const drop = (page, selector, files) =>
  page.locator(selector).evaluate((el, list) => {
    const data = new DataTransfer();
    for (const f of list) data.items.add(new File([f.text], f.name, { type: "application/json" }));
    el.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: data }));
    el.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: data }));
  }, files);
const kept = (page) => page.locator(`${at("feed-kept")} li`);

test.describe("feed files dropped on the demo", () => {
  test.use({ reducedMotion: "no-preference" });

  test("plays the first, keeps every feed with its game, refuses what is not a feed in words, and keeps them after a reload", async ({ page }) => {
    const errors = await toFeed(page);
    await expect(page.locator(at("feed-kept-note"))).toContainText("Nothing kept yet");
    await drop(page, at("feed"), [
      { name: "2099020001.json", text: JSON.stringify(stub("OFF", 5)) },
      { name: "notes.txt", text: "hello" },
      { name: "made-up.json", text: JSON.stringify({ from: "nhl-api", frames: [{ t: 0, objects: [{ id: "puck", team: "puck", x: 0, y: 0 }] }, { t: 30, objects: [{ id: "puck", team: "puck", x: 50, y: 0 }] }], teams: { home: { abbr: "AAA" }, away: { abbr: "BBB" } } }) },
    ]);
    await expect(status(page)).toHaveText("Playing MTH – OWL: 4 events. Not a feed this page reads, so not kept: notes.txt.");
    await expect(page.locator("#game-stage .ky-turn-replay")).toBeVisible();
    await expect(kept(page)).toHaveCount(2);
    await expect(kept(page).nth(1)).toContainText("MTH – OWL");
    await expect(kept(page).nth(0)).toContainText("AAA – BBB");
    await expect(page.locator(at("feed-kept-note"))).toHaveText(/^2 kept, \d+ KB in all, in this browser only\.$/);
    // A drop on the view itself is taken too.
    await drop(page, "#game-stage", [{ name: "again.json", text: JSON.stringify(stub("OFF", 3)) }]);
    await expect(kept(page)).toHaveCount(3);
    await page.reload();
    await page.locator(at("feed")).scrollIntoViewIfNeeded();
    await expect(kept(page)).toHaveCount(3);
    await kept(page).filter({ hasText: "2099020001.json" }).getByRole("button", { name: /^Play/ }).click();
    await expect(status(page)).toHaveText("Playing MTH – OWL: 4 events.");
    expect(errors).toEqual([]);
  });

  test("refuses more than 200 files at once, in words, and reads none of them", async ({ page }) => {
    await toFeed(page);
    const files = Array.from({ length: 201 }, (_, i) => ({ name: `g${i}.json`, text: JSON.stringify(stub("OFF", 3)) }));
    await drop(page, at("feed"), files);
    await expect(status(page)).toHaveText("Drop or choose at most 200 files at once: this was 201. Nothing was read.");
    await expect(kept(page)).toHaveCount(0);
  });

  test("reads a folder's worth one at a time: forty files dropped together are all kept, and the first plays", async ({ page }) => {
    await toFeed(page);
    const files = Array.from({ length: 40 }, (_, i) => ({ name: `2099020${String(i).padStart(3, "0")}.json`, text: JSON.stringify(stub("OFF", 3 + (i % 3))) }));
    await drop(page, at("feed"), files);
    await expect(kept(page)).toHaveCount(40);
    await expect(status(page)).toHaveText("Playing MTH – OWL: 2 events.");
    await expect(page.locator(at("feed-kept-note"))).toHaveText(/^40 kept, /);
  });

  test("removes one, and then all", async ({ page }) => {
    await toFeed(page);
    await drop(page, at("feed"), [{ name: "a.json", text: JSON.stringify(stub("OFF", 3)) }, { name: "b.json", text: JSON.stringify(stub("OFF", 4)) }]);
    await expect(kept(page)).toHaveCount(2);
    await kept(page).filter({ hasText: "a.json" }).getByRole("button", { name: /^Remove/ }).click();
    await expect(kept(page)).toHaveCount(1);
    await expect(status(page)).toHaveText("Removed a.json from this browser.");
    await page.locator(at("feed-remove-all")).click();
    await expect(kept(page)).toHaveCount(0);
    await expect(page.locator(at("feed-remove-all"))).toBeHidden();
    await page.reload();
    await page.locator(at("feed")).scrollIntoViewIfNeeded();
    await expect(page.locator(at("feed-kept-note"))).toContainText("Nothing kept yet");
    expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("kyogijo.feed")))).toEqual(["kyogijo.feeds"]);
  });

  test("keeps the feeds past about 4 MB in all in IndexedDB, not localStorage, and still plays them after a reload", async ({ page }) => {
    await toFeed(page);
    // Made-up feeds made large by a long note: three of 1.6 MB.
    const big = (n) => ({ name: `big-${n}.json`, text: JSON.stringify({ ...stub("OFF", 5), note: "x".repeat(1_600_000) }) });
    await drop(page, at("feed"), [big(1), big(2), big(3)]);
    await expect(kept(page)).toHaveCount(3);
    const where = await page.evaluate(() => JSON.parse(localStorage.getItem("kyogijo.feeds")).map((f) => f.where).sort());
    expect(where).toEqual(["db", "local", "local"]);
    await page.reload();
    await page.locator(at("feed")).scrollIntoViewIfNeeded();
    await kept(page).filter({ hasText: "big-3.json" }).getByRole("button", { name: /^Play/ }).click();
    await expect(status(page)).toHaveText("Playing MTH – OWL: 4 events.");
  });

  test("plays a dropped feed where the browser keeps nothing, and says it was not kept", async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException("blocked", "SecurityError");
      };
      Object.defineProperty(window, "indexedDB", { get: () => undefined });
    });
    const errors = await toFeed(page);
    await drop(page, at("feed"), [{ name: "a.json", text: JSON.stringify(stub("OFF", 3)) }]);
    await expect(status(page)).toHaveText("Playing MTH – OWL: 2 events. This browser could not keep it (storage is off or full): it plays now only.");
    await expect(kept(page)).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});
