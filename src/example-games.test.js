// The index of the examples' games (examples/games/index.json): each entry names a file beside it, played on the surface the file says, in the frame its timeline is in; and the demo's reader of it
// keeps only whole entries, so that a page offers Play a game on exactly the surfaces that have one.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SPORTS } from "./index.ts";
import { FRAMES } from "./frames-entry.ts";
import { gamesFor, readIndex } from "../demo/game.js";

const raw = JSON.parse(readFileSync("examples/games/index.json", "utf8"));
const games = readIndex(raw);

describe("the index of the example games", () => {
  it("reads every entry of the file, and each names a game of its own surface and frame", () => {
    expect(games.length).toBe(raw.games.length);
    expect(games.length).toBeGreaterThan(0);
    for (const entry of games) {
      expect(SPORTS).toContain(entry.sport);
      const path = `examples/games/${entry.file}`;
      expect(existsSync(path)).toBe(true);
      const game = JSON.parse(readFileSync(path, "utf8"));
      expect(game.kind).toBe("kyogijo-game");
      expect(game.sport).toBe(entry.sport);
      expect(game.timeline.from).toBe(entry.frame);
      expect(FRAMES[entry.frame]?.sport).toBe(entry.sport);
    }
  });

  it("lists every file of the folder", () => {
    const listed = games.map((g) => g.file).sort();
    expect(readdirSync("examples/games").filter((name) => name.endsWith(".json") && name !== "index.json").sort()).toEqual(listed);
  });

  it("finds the games of a surface: the rink has one today, and a line for another surface is all it takes to give it one", () => {
    expect(gamesFor(games, "nhl").map((g) => g.id)).toEqual(["canada-japan"]);
    expect(gamesFor(games, "tennis")).toEqual([]);
    const more = readIndex({ ...raw, games: [...raw.games, { id: "a-rally", sport: "tennis", file: "a-rally.json", frame: "tennis-feet", title: { en: "A rally", ja: "ラリー" } }] });
    expect(gamesFor(more, "tennis").map((g) => g.id)).toEqual(["a-rally"]);
  });

  it("leaves out an entry that is not whole, a second of one id, and anything that is not an index", () => {
    const good = raw.games[0];
    const read = readIndex({
      ...raw,
      games: [good, { ...good }, { ...good, id: "x", file: "../secret.json" }, { ...good, id: "y", title: { en: "Only English" } }, { ...good, id: "z", sport: "NHL" }, null, "canada-japan"],
    });
    expect(read.map((g) => g.id)).toEqual(["canada-japan"]);
    for (const wrong of [null, [], {}, { ...raw, kind: "kyogijo-game" }, { ...raw, version: 2 }, { ...raw, games: {} }]) expect(readIndex(wrong)).toEqual([]);
  });
});
