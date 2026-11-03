// Bring your own feed, in the demo's game section: a file and a paste of a made-up feed, and the plain words for one that is not a feed.
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

/** The demo, scrolled to the feed panel, with its list written. */
async function toFeed(page, query = "?lang=en&help=off") {
  const errors = await open(page, query);
  await page.locator(at("feed")).scrollIntoViewIfNeeded();
  await expect(page.locator(at("feed"))).toBeVisible();
  return errors;
}
const status = (page) => page.locator(at("feed-status"));

test.describe("bring your own feed", () => {
  test.use({ reducedMotion: "no-preference" });

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

  test("speaks Japanese", async ({ page }) => {
    await toFeed(page, "?lang=ja&help=off");
    await expect(page.locator(`${at("feed")} h3`)).toHaveText("自分のフィードを再生");
    await page.locator(at("feed-paste-play")).click();
    await expect(status(page)).toHaveText("先にフィードを貼り付けてください。");
  });
});
