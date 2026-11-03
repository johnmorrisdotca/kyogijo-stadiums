// The NHL adapter on an answer in the raw shape of the public gamecenter/<id>/play-by-play, as a reader's saved file has it: src/feeds.nhl.stub.json, invented from end to end (teams, players, ids, places,
// result). No real answer is read, and nothing is fetched. Plain JavaScript, so that reading files needs no Node types.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { NHL_OVERTIME, NHL_PERIOD } from "./feeds.nhl.ts";
import { readFeedText } from "./feeds.ts";
import { replayBoard } from "./replay.board.ts";

const text = readFileSync("src/feeds.nhl.stub.json", "utf8");
const raw = JSON.parse(text);
const game = readFeedText(text);

describe("an NHL play-by-play file as it comes", () => {
  it("is told apart by itself and read whole: the sides, the state, the players", () => {
    expect(game.format).toBe("nhl");
    expect(game.sport).toBe("nhl");
    expect(game.ended).toBe(true);
    expect(game.teams).toEqual({ home: { abbr: "LKM", name: "Moths" }, away: { abbr: "HRO", name: "Owls" } });
    expect(Object.keys(game.players)).toHaveLength(raw.rosterSpots.length);
    expect(game.players.p8101).toEqual({ side: "home", number: 11, name: "Ada Quill" });
  });

  it("puts every play with a time on the game's clock, three periods of twenty minutes and a regular-season overtime of five", () => {
    expect(game.timeline.periods).toEqual([
      { number: 1, start: 0, end: NHL_PERIOD },
      { number: 2, start: NHL_PERIOD, end: 2 * NHL_PERIOD },
      { number: 3, start: 2 * NHL_PERIOD, end: 3 * NHL_PERIOD },
      { number: 4, start: 3 * NHL_PERIOD, end: 3 * NHL_PERIOD + NHL_OVERTIME },
    ]);
    const kinds = (key) => raw.plays.filter((p) => p.typeDescKey === key).length;
    const events = game.timeline.events;
    expect(events.filter((e) => e.kind === "goal")).toHaveLength(kinds("goal"));
    expect(events.filter((e) => e.kind === "shot")).toHaveLength(kinds("shot-on-goal") + kinds("missed-shot") + kinds("blocked-shot"));
    expect(events.filter((e) => e.kind === "whistle")).toHaveLength(kinds("stoppage") + kinds("penalty"));
    // Every place on the ice, in the frame the file is in (feet from centre ice).
    expect(game.timeline.from).toBe("nhl-api");
    for (const f of game.timeline.frames) {
      expect(Math.abs(f.objects[0].x)).toBeLessThanOrEqual(100);
      expect(Math.abs(f.objects[0].y)).toBeLessThanOrEqual(42.5);
    }
  });

  it("scores as the file does: the board at the end is its final score, and at each goal the score the play says", () => {
    const end = game.timeline.periods.at(-1).end;
    expect(replayBoard(game.timeline, end).score).toEqual([raw.homeTeam.score, raw.awayTeam.score]);
    for (const play of raw.plays.filter((p) => p.typeDescKey === "goal")) {
      const [m, s] = play.timeInPeriod.split(":").map(Number);
      const t = (play.periodDescriptor.number - 1) * NHL_PERIOD + m * 60 + s;
      expect(replayBoard(game.timeline, t).score, play.timeInPeriod).toEqual([play.details.homeScore, play.details.awayScore]);
    }
    expect(replayBoard(game.timeline, 3 * NHL_PERIOD + 60)).toMatchObject({ period: 4, clock: "4:00" });
  });
});
