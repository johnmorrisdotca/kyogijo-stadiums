import { describe, expect, it } from "vitest";
import { SPORTS, drawKyogijo } from "./draw.ts";
import { isFieldSport } from "./fields.ts";
import { isPoolSport } from "./pool.ts";
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
    // The sports that were there before the field sports and the pools: their drawings are the same text as before, whatever was added after.
    const all = SPORTS.filter((sport) => !isFieldSport(sport) && !isPoolSport(sport)).map((sport) => drawKyogijo({ sport, ...game })).join("\n");
    expect(hash(all)).toMatchSnapshot();
  });
});

describe("the size of a drawing", () => {
  it("is within the budget, with the stylesheet in it", () => {
    const budget: Record<string, number> = { nfl: 22_000, cfl: 21_000, ifaf: 22_000, nhl: 14_000, nba: 14_000, mlb: 17_000, soccer: 15_000, curling: 17_500, tennis: 17_500, volleyball: 17_500, badminton: 17_500, pickleball: 17_500, tabletennis: 17_500, lacrosse: 17_500, rugby: 17_500, afl: 17_500, gaelic: 17_500, cricket: 17_500, fieldhockey: 17_500, handball: 17_500, swimming: 19_000, waterpolo: 17_500, diving: 15_500, artisticswimming: 14_000 };
    for (const sport of SPORTS) expect(drawKyogijo({ sport, ...game }).length, sport).toBeLessThan(budget[sport]);
  });
});

describe("the soccer pitches' structure", () => {
  const pitches = ["fifa", "mls", "law-max", "9-a-side", "7-a-side", "5-a-side", "futsal"] as const;
  for (const pitch of pitches) {
    it(`${pitch}: what a score drawing is made of`, () => {
      expect(structure(drawKyogijo({ sport: "soccer", pitch, ...game }))).toMatchSnapshot();
    });
  }
  for (const pitchType of ["opta", "statsbomb", "wyscout", "tracab", "metrica", "impect"] as const) {
    it(`${pitchType}: what a pitch drawn in its own frame is made of`, () => {
      expect(structure(drawKyogijo({ sport: "soccer", pitchType, id: "snap" }))).toMatchSnapshot();
    });
  }
  for (const [name, options] of [["half", { half: "left" }], ["checks", { stripePattern: "checks" }], ["diagonal", { stripePattern: "diagonal" }], ["line goals", { goals: "line" }], ["strip goals", { goals: "strip" }], ["no goals, no flags", { goals: "none", cornerFlags: false }], ["simple", { detail: "simple" }]] as const) {
    it(`${name}: what a bare pitch is made of`, () => {
      expect(structure(drawKyogijo({ sport: "soccer", id: "snap", ...options }))).toMatchSnapshot();
    });
  }
  it("a bare pitch, written out", () => {
    expect(drawKyogijo({ sport: "soccer", id: "snap", style: "none", margin: 0, exactLines: true })).toMatchSnapshot();
  });
  it("is within its size budget, bare, in each pitch and with its frame", () => {
    for (const pitch of pitches) expect(drawKyogijo({ sport: "soccer", pitch }).length, pitch).toBeLessThan(13_500);
    expect(drawKyogijo({ sport: "soccer", pitchType: "opta", stripePattern: "checks" }).length).toBeLessThan(15_500);
  });
});
