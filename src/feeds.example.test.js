// The example game read as a feed: the file the demo serves as its sample feed is kyogijo's open format, with its sides, periods and players. Plain JavaScript, so that reading files needs no Node types.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { readFeed } from "./feeds.ts";
import { replayBoard } from "./replay.board.ts";

describe("the example game as a feed", () => {
  it("reads with its sides, periods and players, and its score is the file's", () => {
    const file = JSON.parse(readFileSync("examples/games/canada-japan.json", "utf8"));
    const game = readFeed(file);
    expect(game).toMatchObject({ format: "kyogijo", sport: "nhl", ended: true });
    expect(game.timeline.frames).toHaveLength(file.timeline.frames.length);
    expect(game.timeline.events).toHaveLength(file.timeline.events.length);
    expect(game.timeline.periods).toEqual(file.periods);
    expect(game.teams).toEqual({ home: { abbr: "CAN", name: "Canada", color: "#d52b1e" }, away: { abbr: "JPN", name: "Japan", color: "#1d3f8f" } });
    expect(game.players.c30).toEqual({ side: "home", number: 30, name: "Callum Ashdown" });
    expect(replayBoard(game.timeline, game.timeline.periods.at(-1).end).score).toEqual([file.score.home, file.score.away]);
  });
});
