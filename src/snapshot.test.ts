import { describe, expect, it } from "vitest";
import { SPORTS, drawKyogijo } from "./draw.ts";
import { hash } from "./format.ts";
import type { ScoreOptions } from "./types.ts";
import { parseXml, walk } from "./xml.fixture.ts";

const game: Omit<ScoreOptions, "sport"> = {
  away: { name: "Harbour City Gulls", abbr: "HCG", score: 3, color: "#1f5fa8" },
  home: { name: "Prairie Ridge Bison", abbr: "PRB", score: 2, color: "#b5452c" },
  status: "final-ot",
  competition: "Cup Final, Game 7",
  date: "June 24",
  id: "snap",
};

/** The drawing's structure: how many of each element and class, which the drawing's look is made of. */
function structure(svg: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const node of walk(parseXml(svg))) {
    const key = node.attrs.class === undefined ? node.name : `${node.name}.${node.attrs.class.split(" ").sort().join(".")}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

describe("the drawings' structure", () => {
  for (const sport of SPORTS) {
    it(`${sport}: what a score drawing is made of`, () => {
      expect(structure(drawKyogijo({ sport, ...game }))).toMatchSnapshot();
    });
    it(`${sport}: what a tall bare surface is made of`, () => {
      expect(structure(drawKyogijo({ sport, orientation: "portrait", id: "snap" }))).toMatchSnapshot();
    });
  }

  it("the badge, written out", () => {
    expect(drawKyogijo({ sport: "nhl", ...game, size: "badge", style: "none" })).toMatchSnapshot();
  });

  it("stays the same text unless a drawing was meant to change: one fingerprint for every sport", () => {
    const all = SPORTS.map((sport) => drawKyogijo({ sport, ...game })).join("\n");
    expect(hash(all)).toMatchSnapshot();
  });
});

describe("the size of a drawing", () => {
  it("is within the budget, with the stylesheet in it", () => {
    const budget: Record<string, number> = { nfl: 21_000, cfl: 20_000, ifaf: 21_000, nhl: 13_000, nba: 13_000, mlb: 16_000 };
    for (const sport of SPORTS) expect(drawKyogijo({ sport, ...game }).length, sport).toBeLessThan(budget[sport]);
  });
});
