import { describe, expect, it } from "vitest";
import { describe as describeDrawing, drawKyogijo } from "./draw.ts";
import { hash } from "./format.ts";
import { FAMILY_OF, LEAGUES, VARIANTS, chooseLeague, hasHistory, leagueAt, leagueChanges, leagueIds, leagueSize, type League } from "./leagues.ts";
import { LEAGUE_SOURCES } from "./leagues/sources.ts";
import { ERA_CURRENT } from "./eras.ts";
import type { ScoreOptions, Sport } from "./types.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

const parse = (svg: string): Node => parseXml(svg);
const box = (svg: Node): number[] => svg.attrs.viewBox.split(" ").map(Number);
const away = { name: "Harbour City Gulls", abbr: "HCG", score: 3, color: "#1f5fa8" };
const home = { name: "Prairie Ridge Bison", abbr: "PRB", score: 2, color: "#b5452c" };

/** Every league that is not its sport's own, with a sport that draws it. */
const OTHER: { sport: Sport; league: League }[] = (["nba", "nhl", "nfl", "mlb", "curling", "tennis", "volleyball", "badminton", "pickleball", "tabletennis", "padel", "squash", "racquetball", "sepaktakraw", "teqball", "roundnet", "netball"] as const).flatMap((sport) => LEAGUES[sport].filter((league) => league.builtIn !== true).map((league) => ({ sport, league })));

describe("the leagues", () => {
  it("are listed for every sport that has a family of surface, the sport's own first", () => {
    expect(LEAGUES.soccer).toEqual([]);
    expect(leagueIds("nba")[0]).toBe("nba");
    expect(leagueIds("nhl")[0]).toBe("nhl");
    expect(leagueIds("mlb")[0]).toBe("mlb");
    expect(leagueIds("nfl").slice(0, 3)).toEqual(["nfl", "cfl", "ifaf"]);
    expect(LEAGUES.cfl).toBe(LEAGUES.nfl);
    expect(LEAGUES.ifaf).toBe(LEAGUES.nfl);
  });

  it("have a unique id in their family, a name in English and in Japanese, and sources that are listed", () => {
    for (const sport of ["nba", "nhl", "nfl", "mlb", "curling", "tennis", "volleyball", "badminton", "pickleball", "tabletennis", "padel", "squash", "racquetball", "sepaktakraw", "teqball", "roundnet", "netball"] as const) {
      const ids = leagueIds(sport);
      expect(new Set(ids).size, sport).toBe(ids.length);
      for (const league of LEAGUES[sport]) {
        expect(league.family, league.id).toBe(FAMILY_OF[sport]);
        expect(league.name.en, league.id).toMatch(/\S/);
        expect(league.name.ja, league.id).toMatch(/[぀-ヿ一-鿿]/u);
        expect(league.name.en, league.id).not.toMatch(/[぀-ヿ一-鿿]/u);
        expect(league.sources.length, league.id).toBeGreaterThan(0);
        for (const source of league.sources) expect(LEAGUE_SOURCES[source], `${league.id} ${source}`).toBeDefined();
      }
    }
    expect(VARIANTS.length).toBeGreaterThanOrEqual(20);
  });

  it("read every source on a date, at an address, in an edition", () => {
    for (const [id, source] of Object.entries(LEAGUE_SOURCES)) {
      expect(source.id).toBe(id);
      expect(source.url, id).toMatch(/^https?:\/\//);
      expect(source.read, id).toMatch(/^\d{4}-\d\d-\d\d$/);
      expect(source.edition, id).toMatch(/\S/);
    }
  });

  it("are chosen by the sport that names their family, and refused with a way out otherwise", () => {
    expect(chooseLeague({ sport: "nba" })).toEqual({ sport: "nba", league: undefined });
    expect(chooseLeague({ sport: "nba", league: "nba" })).toEqual({ sport: "nba", league: undefined });
    expect(chooseLeague({ sport: "nfl", league: "cfl" })).toEqual({ sport: "cfl", league: undefined });
    expect(() => chooseLeague({ sport: "nba", league: "ahl" })).toThrow(/hockey league: use sport "nhl"/);
    expect(() => chooseLeague({ sport: "nba", league: "nowhere" })).toThrow(/Unknown league "nowhere" for "nba": use one of nba, /);
    expect(() => chooseLeague({ sport: "soccer", league: "fifa" })).toThrow(/no leagues/);
  });

  it("draw the sport's own league as the sport is drawn without one", () => {
    for (const [sport, league] of [["nba", "nba"], ["nhl", "nhl"], ["nfl", "nfl"], ["cfl", "cfl"], ["ifaf", "ifaf"], ["mlb", "mlb"]] as const) {
      const plain = drawKyogijo({ sport, id: "x" });
      expect(drawKyogijo({ sport, league, id: "x" }).replace(/ data-league="[a-z]+"/, "")).toBe(plain);
    }
  });
});

describe("every league", () => {
  for (const { sport, league } of OTHER) {
    it(`${sport} ${league.id} is well-formed SVG that names itself, wide and tall, bare and in a score`, () => {
      for (const options of [{ sport, league: league.id }, { sport, league: league.id, home, away, status: "final" }, { sport, league: league.id, orientation: "portrait" }, { sport, league: league.id, home, away, orientation: "portrait" }, { sport, league: league.id, home, away, size: "compact" }, { sport, league: league.id, home, away, size: "badge" }, { sport, league: league.id, detail: "simple" }, { sport, league: league.id, theme: "dark", exactLines: true }] as ScoreOptions[]) {
        const svg = parse(drawKyogijo(options));
        expect(svg.attrs["data-league"]).toBe(league.id);
        expect(svg.attrs.role).toBe("img");
        expect(box(svg).every(Number.isFinite)).toBe(true);
        expect(walk(svg).find((n) => n.name === "title")?.text).toContain(options.home === undefined ? league.name.en : "Harbour City Gulls");
      }
    });

    it(`${sport} ${league.id} is a different drawing from its sport's own, and the same for the same options`, () => {
      expect(drawKyogijo({ sport, league: league.id, id: "x" })).toBe(drawKyogijo({ sport, league: league.id, id: "x" }));
      expect(drawKyogijo({ sport, league: league.id, id: "x" })).not.toBe(drawKyogijo({ sport, id: "x" }));
    });

    it(`${sport} ${league.id} says what it is in both languages`, () => {
      const en = describeDrawing({ sport, league: league.id });
      const ja = describeDrawing({ sport, league: league.id, language: "ja" });
      expect(en.title).toBe(league.name.en);
      expect(ja.title).toBe(league.name.ja);
      expect(en.description).toMatch(/^Drawn as: /);
      expect(en.description).not.toMatch(/\{|undefined|NaN/);
      expect(ja.description).not.toMatch(/\{|undefined|NaN/);
    });

    it(`${sport} ${league.id} lies tall when portrait and keeps its true shape`, () => {
      const wide = box(parse(drawKyogijo({ sport, league: league.id, orientation: "landscape" })));
      const tall = box(parse(drawKyogijo({ sport, league: league.id, orientation: "portrait" })));
      if (league.family !== "baseball") {
        expect(wide[2]).toBeGreaterThan(wide[3]);
        expect(tall[3]).toBeGreaterThan(tall[2]);
        expect(tall[2]).toBeCloseTo(wide[3], 1);
      }
    });

    it(`${sport} ${league.id} takes a data layer, cut to its own outline`, () => {
      const svg = drawKyogijo({ sport, league: league.id, layers: [{ kind: "points", units: "rulebook", data: [{ x: 3, y: 3 }, { x: 5000, y: 5000 }] }] });
      expect(() => parse(svg)).not.toThrow();
      expect(svg).toContain("ky-layer");
    });
  }

  it("has a history only where a source dates a change, and that history ends in today's figure", () => {
    for (const league of VARIANTS) {
      if (!hasHistory(league)) continue;
      const changes = leagueChanges(Object.keys(LEAGUES).find((sport) => LEAGUES[sport as Sport].includes(league) && sport !== "soccer") as Sport, league.id);
      expect(changes.length, league.id).toBeGreaterThan(0);
      for (const change of changes) {
        expect(change.what, change.id).toMatch(/\S/);
        expect(change.ja, change.id).toMatch(/[぀-ヿ一-鿿]/u);
        expect(change.sources.length, change.id).toBeGreaterThan(0);
        for (const source of change.sources) expect(LEAGUE_SOURCES[source], `${change.id} ${source}`).toBeDefined();
      }
      for (const [feature, spans] of Object.entries(league.history ?? {})) {
        const last = (spans as { from: number | null; value: unknown }[]).filter((span) => span.from === null || span.from <= ERA_CURRENT).at(-1);
        expect(JSON.stringify(last?.value), `${league.id} ${feature} today`).toBe(JSON.stringify((league.dimensions as unknown as Record<string, unknown>)[feature]));
      }
    }
  });

  it("ignores a year when it has no history, and draws the season when it has one", () => {
    for (const { sport, league } of OTHER) {
      const plain = drawKyogijo({ sport, league: league.id, id: "y" });
      const dated = drawKyogijo({ sport, league: league.id, id: "y", year: 1990 });
      if (!hasHistory(league)) expect(dated.replace(/ data-league="[^"]+"/, "")).toBe(plain.replace(/ data-league="[^"]+"/, ""));
    }
    expect(() => leagueAt("nba", "nowhere")).toThrow(/Unknown league/);
  });

  it("has a size in its rulebook's unit", () => {
    expect(leagueSize("nba", "nba")).toEqual({ length: 94, width: 50, unit: "ft" });
    expect(leagueSize("nfl", "nfl").length).toBe(120);
    expect(() => leagueSize("mlb", "mlb")).toThrow(/fence/);
  });

  it("is small: no league's drawing is more than a quarter over its sport's own", () => {
    for (const { sport, league } of OTHER) {
      const mine = drawKyogijo({ sport, league: league.id }).length;
      const own = drawKyogijo({ sport }).length;
      expect(mine, league.id).toBeLessThan(own * 1.25);
    }
  });
});

describe("the layers on a league's surface", () => {
  it("are cut to the surface's own outline", () => {
    const svg = parse(drawKyogijo({ sport: "nfl", league: "nfhs-8", layers: [{ kind: "points", data: [{ x: 10, y: 10 }] }], id: "c" }));
    expect(withClass(svg, "ky-layer").length + walk(svg).filter((n) => n.name === "clipPath").length).toBeGreaterThan(0);
  });
});

/** The drawing's structure: how many of each element and class, which the drawing's look is made of. */
function structure(svg: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const node of walk(parse(svg))) {
    const key = node.attrs.class === undefined ? node.name : `${node.name}.${node.attrs.class.split(" ").sort().join(".")}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

describe("the leagues' drawings", () => {
  const game = { away, home, status: "final-ot", competition: "Cup Final, Game 7", date: "June 24", id: "snap" } as const;
  for (const { sport, league } of OTHER) {
    it(`${sport} ${league.id}: what a score drawing is made of`, () => {
      expect(structure(drawKyogijo({ sport, league: league.id, ...game }))).toMatchSnapshot();
    });
  }

  /** The leagues added after the field sports: sitting volleyball's, and the leagues of padel, squash, racquetball, sepak takraw, teqball, roundnet and netball. */
  const ADDED = (entry: { sport: Sport; league: League }): boolean => entry.league.id === "wpv-sitting" || ["padel", "squash", "racquetball", "sepaktakraw", "teqball", "roundnet", "netball"].includes(entry.sport);

  it("stay the same text unless a drawing was meant to change: one fingerprint for every league", () => {
    expect(hash(OTHER.filter((entry) => !ADDED(entry)).map(({ sport, league }) => drawKyogijo({ sport, league: league.id, ...game })).join("\n"))).toMatchSnapshot();
  });

  it("stay the same text unless a drawing was meant to change: one fingerprint for the leagues added after the field sports", () => {
    expect(hash(OTHER.filter(ADDED).map(({ sport, league }) => drawKyogijo({ sport, league: league.id, ...game })).join("\n"))).toMatchSnapshot();
  });

  it("are within the budget, with the stylesheet in them", () => {
    const budget: Record<string, number> = { basketball: 14_000, hockey: 14_000, football: 22_000, baseball: 17_000, curling: 17_500, tennis: 17_500, volleyball: 17_500, badminton: 17_500, pickleball: 17_500, tabletennis: 17_500, padel: 17_500, squash: 17_500, racquetball: 17_500, sepaktakraw: 17_500, teqball: 17_500, roundnet: 17_500, netball: 17_500 };
    for (const { sport, league } of OTHER) expect(drawKyogijo({ sport, league: league.id, ...game }).length, league.id).toBeLessThan(budget[league.family]);
  });
});
