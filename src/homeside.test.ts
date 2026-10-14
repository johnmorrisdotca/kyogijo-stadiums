import { describe, expect, it } from "vitest";
import { drawBadge, drawKyogijo, describe as describeDrawing, SPORTS } from "./draw.ts";
import { HOME_FIRST, HOME_FIRST_LEAGUES, homeSideFor, resolveHomeSide } from "./homeside.ts";
import type { ScoreOptions, Sport } from "./types.ts";
import { parseXml, walk } from "./xml.fixture.ts";

const away = { name: "Aurelia", abbr: "AUR", score: 2 };
const home = { name: "Calvara", abbr: "CAL", score: 1 };
const game = (sport: Sport, more: Partial<ScoreOptions> = {}): ScoreOptions => ({ sport, away, home, status: "final", id: "hs", ...more });

const abbrs = (svg: string): string[] => walk(parseXml(svg)).filter((n) => n.name === "text" && (n.attrs.class ?? "").includes("ky-name")).map((n) => n.text);

const LEFT: Sport[] = ["soccer", "rugby", "afl", "gaelic", "fieldhockey", "handball", "cricket"];
const RIGHT: Sport[] = ["nfl", "cfl", "ifaf", "nhl", "nba", "mlb", "curling", "lacrosse", "tennis", "volleyball", "badminton", "pickleball", "tabletennis", "athletics"];

describe("which side the home team is on by default", () => {
  it("is home first for soccer and the world codes, away first for the North American leagues and the net sports", () => {
    for (const sport of LEFT) expect(homeSideFor(sport), sport).toBe("left");
    for (const sport of RIGHT) expect(homeSideFor(sport), sport).toBe("right");
    expect(Object.keys(HOME_FIRST).sort()).toEqual([...SPORTS].sort());
    expect([...LEFT, ...RIGHT].sort()).toEqual([...SPORTS].sort());
  });

  it("follows a league only where the league's convention differs from its sport's", () => {
    expect(HOME_FIRST_LEAGUES.lacrosse).toEqual({ "world-men": true, "world-women": true, "world-box": true });
    for (const league of ["world-men", "world-women", "world-box"]) expect(homeSideFor("lacrosse", league), league).toBe("left");
    for (const league of ["ncaa-men", "ncaa-women", "pll", "nll"]) expect(homeSideFor("lacrosse", league), league).toBe("right");
    expect(homeSideFor("nhl", "iihf")).toBe("right");
    expect(homeSideFor("soccer", "anything")).toBe("left");
  });

  it("is overridden by an explicit homeSide, either way", () => {
    expect(resolveHomeSide({ sport: "soccer", homeSide: "right" })).toBe("right");
    expect(resolveHomeSide({ sport: "nhl", homeSide: "left" })).toBe("left");
    expect(resolveHomeSide({ sport: "soccer" })).toBe("left");
    expect(resolveHomeSide({ sport: "nhl" })).toBe("right");
    expect(resolveHomeSide({})).toBe("right");
  });
});

describe("the default in a drawing", () => {
  it("puts the home team on the left in the full drawing, the badge and the compact strip for the home-first sports", () => {
    for (const sport of LEFT) {
      const full = walk(parseXml(drawKyogijo(game(sport)))).filter((n) => n.name === "text" && (n.attrs.class ?? "").includes("ky-abbr"));
      if (sport !== "cricket") expect(full.map((n) => n.text), sport).toEqual(["CAL", "AUR"]);
      expect(abbrs(drawBadge(game(sport))), sport).toEqual(["CAL", "AUR"]);
      expect(abbrs(drawKyogijo(game(sport, { size: "compact" }))).slice(-2), sport).toEqual(["CAL", "AUR"]);
      expect(drawKyogijo(game(sport))).toContain('data-winner="away"');
    }
  });

  it("keeps the away team on the left for the North American leagues and the net sports", () => {
    for (const sport of RIGHT.filter((s) => s !== "lacrosse")) expect(abbrs(drawBadge(game(sport))), sport).toEqual(["AUR", "CAL"]);
    expect(abbrs(drawBadge(game("lacrosse")))).toEqual(["AUR", "CAL"]);
    expect(abbrs(drawBadge(game("lacrosse", { league: "world-men" })))).toEqual(["CAL", "AUR"]);
    expect(abbrs(drawBadge(game("lacrosse", { league: "pll" })))).toEqual(["AUR", "CAL"]);
  });

  it("lets an explicit homeSide win over the sport", () => {
    expect(abbrs(drawBadge(game("soccer", { homeSide: "right" })))).toEqual(["AUR", "CAL"]);
    expect(abbrs(drawBadge(game("nhl", { homeSide: "left" })))).toEqual(["CAL", "AUR"]);
    expect(abbrs(drawBadge(game("soccer", { homeSide: "left" })))).toEqual(["CAL", "AUR"]);
  });

  it("takes the default of a league that is a sport of its own", () => {
    expect(abbrs(drawBadge(game("nfl", { league: "cfl" })))).toEqual(["AUR", "CAL"]);
  });

  it("names the teams in the title and the description in the order of the drawing, in English and Japanese", () => {
    expect(describeDrawing(game("soccer")).title).toBe("Calvara 1, Aurelia 2, Final");
    expect(describeDrawing(game("soccer")).description.startsWith("Final. Calvara 1, Aurelia 2.")).toBe(true);
    expect(describeDrawing(game("nhl")).title).toBe("Aurelia 2, Calvara 1, Final");
    expect(describeDrawing(game("soccer", { homeSide: "right" })).title).toBe("Aurelia 2, Calvara 1, Final");
    const ja = describeDrawing(game("soccer", { language: "ja" }));
    expect(ja.title.startsWith("Calvara 1、Aurelia 2")).toBe(true);
    expect(describeDrawing(game("nhl", { language: "ja" })).title.startsWith("Aurelia 2、Calvara 1")).toBe(true);
    // The aria text of the drawing is the same as describe.
    expect(drawKyogijo(game("soccer"))).toContain("Calvara 1, Aurelia 2, Final");
  });

  it("writes the shoot-out in the order of the sides", () => {
    const pens = { status: "final-pens" as const, away: { ...away, score: 2, penalties: 4 }, home: { ...home, score: 2, penalties: 2 } };
    expect(drawKyogijo(game("soccer", pens))).toContain("Final · 2-4 pens");
    expect(drawKyogijo(game("soccer", { ...pens, homeSide: "right" }))).toContain("Final · 4-2 pens");
  });

  it("is a different drawing only for the sports whose default flipped", () => {
    for (const sport of SPORTS) {
      const same = drawKyogijo(game(sport)) === drawKyogijo(game(sport, { homeSide: "right" }));
      expect(same, sport).toBe(!LEFT.includes(sport));
    }
  });
});
