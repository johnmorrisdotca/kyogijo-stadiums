// How kyogijo takes a country's flag wherever it takes a logo, with a small renderer of its own making: the plug-in, the shapes it is asked for, and every place that carries a country code. No flag art is in
// this package; the real set (Hata's, a development dependency) is tried in flags.hata.test.ts.
import { afterEach, describe, expect, it } from "vitest";
import { laneDraw } from "./charts.athletics.ts";
import { skatingGrid } from "./charts.skating.ts";
import { drawKyogijo } from "./draw.ts";
import { optionsFromAttributes } from "./element-entry.ts";
import { flagDocument, useFlags, withFlags, type FlagRenderer, type FlagRequest } from "./flags-source.ts";
import { flagPicture } from "./logo.ts";
import { drawLayers } from "./layers.ts";
import type { ScoreOptions } from "./types.ts";
import { parseXml, walk, withClass } from "./xml.fixture.ts";

const calls: Array<[string, FlagRequest]> = [];
const SHAPES = { round: "R", square: "S", rect: "W" } as const;
const KNOWN = ["CA", "US", "JP", "GB-ENG"];

/** A renderer the way a lookup over Hata's flags is: a code and a request; an unknown code gives nothing. The marker in its title says which shape it was asked for. */
const fake: FlagRenderer = (code, request) => {
  calls.push([code, request]);
  if (!KNOWN.includes(code.toUpperCase())) return null;
  const ratio = request.shape === "rect" ? 'viewBox="0 0 60 30"' : 'viewBox="0 0 30 30"';
  return `<svg xmlns="http://www.w3.org/2000/svg" ${ratio}><title>${code.toUpperCase()} ${SHAPES[request.shape]} ${request.theme}</title><rect width="60" height="30" fill="#d52b1e"/></svg>`;
};

const decode = (href: string): string => decodeURIComponent(href.slice(href.indexOf(",") + 1));
const hrefs = (svg: string): string[] => walk(parseXml(svg)).filter((n) => n.name === "image").map((n) => decode(n.attrs.href ?? ""));
/** The titles of the pictures in a drawing, in alphabetical order (which side a team is on is the sport's). */
const titles = (svg: string): string[] => hrefs(svg).flatMap((doc) => /<title>([^<]*)<\/title>/.exec(doc)?.[1] ?? []).sort();
const game = (extra: Partial<ScoreOptions> = {}): ScoreOptions => ({
  sport: "soccer",
  away: { name: "Canada", abbr: "CAN", score: 2, color: "#d52b1e", flag: "CA" },
  home: { name: "Japan", abbr: "JPN", score: 1, color: "#bc002d", flag: "jp" },
  status: "final",
  id: "f",
  ...extra,
});
const NONE = /<image/;

afterEach(() => {
  useFlags(undefined);
  calls.length = 0;
});

describe("without a renderer", () => {
  it("a team's flag code is ignored: the drawing is the one the team without it has", () => {
    const withCode = drawKyogijo(game());
    const without = drawKyogijo(game({ away: { ...game().away, flag: undefined }, home: { ...game().home, flag: undefined } }));
    expect(withCode).toBe(without);
    expect(withCode).not.toMatch(NONE);
  });

  it("a logo stays the team's mark", () => {
    const logo = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><title>own</title></svg>';
    expect(titles(drawKyogijo(game({ away: { ...game().away, logo } })))).toEqual(["own"]);
  });

  it("asks nothing, and flagDocument and flagPicture are undefined", () => {
    expect(flagDocument("CA", { shape: "round", size: 48, theme: "inherit" })).toBeUndefined();
    expect(flagPicture("CA", "round", 48)).toBeUndefined();
    expect(calls).toHaveLength(0);
  });
});

describe("the renderer plugged in with useFlags", () => {
  it("draws a team's flag as its logo, in its own proportions on a plain mark", () => {
    useFlags(fake);
    expect(titles(drawKyogijo(game()))).toEqual(["CA W inherit", "JP W inherit"]);
    // The code is passed as given (`jp`), and the renderer is asked for the shape and a nominal size.
    expect(calls.find(([code]) => code === "jp")?.[1]).toEqual({ shape: "rect", size: 48, theme: "inherit" });
  });

  it("is asked for a round flag in a round mark, by the score's `markShape` and by a team's own `mark`", () => {
    useFlags(fake);
    expect(titles(drawKyogijo(game({ markShape: "round" })))).toEqual(["CA R inherit", "JP R inherit"]);
    expect(titles(drawKyogijo(game({ away: { ...game().away, mark: "round" } })))).toEqual(["CA R inherit", "JP W inherit"]);
  });

  it("is told the theme of the drawing", () => {
    useFlags(fake);
    expect(titles(drawKyogijo(game({ theme: "dark" })))).toEqual(["CA W dark", "JP W dark"]);
    expect(titles(drawKyogijo(game({ theme: "light", markShape: "round" })))).toEqual(["CA R light", "JP R light"]);
    expect(titles(drawKyogijo(game({ theme: "auto" })))).toEqual(["CA W inherit", "JP W inherit"]);
  });

  it("wins over the team's logo where it has a flag for the code, and gives way to it where it has none", () => {
    useFlags(fake);
    const logo = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><title>own</title></svg>';
    expect(titles(drawKyogijo(game({ away: { ...game().away, logo }, home: { ...game().home, logo, flag: "XX" } })))).toEqual(["CA W inherit", "own"]);
  });

  it("serves the compact card, the badge and the banner of every sport that has a place for the teams", () => {
    useFlags(fake);
    for (const extra of [{ size: "compact" as const }, { size: "badge" as const }, { size: "compact" as const, markShape: "round" as const }, { sport: "nhl" as const }, { sport: "nba" as const }, { sport: "nfl" as const }]) {
      expect(hrefs(drawKyogijo(game(extra))).length, JSON.stringify(extra)).toBeGreaterThanOrEqual(2);
    }
  });

  it("turns a round flag with its team's name, as a logo does: along a pitch's ends and in a tall drawing", () => {
    useFlags(fake);
    for (const orientation of ["landscape", "portrait"] as const) {
      const doc = parseXml(drawKyogijo(game({ markShape: "round", orientation })));
      const banners = withClass(doc, "ky-banner");
      expect(banners).toHaveLength(2);
      for (const banner of banners) {
        const mark = withClass(banner, "ky-mark")[0];
        expect(mark).toBeDefined();
        // The mark lies in its banner's turn and has none of its own: it turns with the name.
        expect(mark.attrs.transform).toBeUndefined();
        expect(walk(mark).some((n) => n.name === "image")).toBe(true);
      }
    }
  });

  it("is a carpet's flag in its own proportions, and a stage's round one", () => {
    useFlags(fake);
    // (The strip under the pictures carries the teams' own marks too, in their own proportions.)
    const carpet = new Set(titles(drawKyogijo(game({ pageant: "carpet" }))));
    expect([...carpet]).toEqual(["CA W inherit", "JP W inherit"]);
    const stage = new Set(titles(drawKyogijo(game({ pageant: "stage" }))));
    expect(stage.has("CA R inherit") && stage.has("JP R inherit")).toBe(true);
    // The carpet takes the ratio of the flag the renderer gave: 2 to 1 and a square (a carpet is never taller than it is wide) are different carpets.
    const carpetOf = (viewBox: string): string => drawKyogijo(game({ pageant: "carpet", flags: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><rect width="60" height="30"/></svg>` }));
    expect(carpetOf("0 0 60 20")).not.toBe(carpetOf("0 0 20 20"));
  });

  it("is the flag of a mark in a layer: a team's logo for a point of the shape `logo`", () => {
    useFlags(fake);
    const layers = drawLayers({ ...game(), sport: "soccer" }, [{ kind: "points", id: "p", name: "Shots", data: [{ x: 10, y: 10, shape: "logo", team: "away" }, { x: 20, y: 20, shape: "logo", team: "home" }] }]);
    expect(layers).toContain(encodeURIComponent("<title>CA W inherit</title>"));
    expect(layers).toContain(encodeURIComponent("<title>JP W inherit</title>"));
  });

  it("can be unplugged", () => {
    useFlags(fake);
    expect(drawKyogijo(game())).toMatch(NONE);
    useFlags(undefined);
    expect(drawKyogijo(game())).not.toMatch(NONE);
  });
});

describe("what a renderer may give back", () => {
  it("is held to an SVG document: a renderer that gives nothing, text, a number or throws draws the team as it was", () => {
    const plain = drawKyogijo(game({ away: { ...game().away, flag: undefined }, home: { ...game().home, flag: undefined } }));
    for (const render of [() => null, () => undefined, () => "not an svg", (() => 4) as unknown as FlagRenderer, () => { throw new Error("no"); }]) {
      useFlags(render);
      expect(drawKyogijo(game())).toBe(plain);
    }
  });

  it("is asked only for what looks like a code", () => {
    useFlags(fake);
    for (const bad of ["", " ", "x", "javascript:alert(1)", 'CA"onload="x', "a b", 4, null, undefined, "ABCDEFGHIJ"]) expect(flagDocument(bad, { shape: "round", size: 48, theme: "inherit" }), String(bad)).toBeUndefined();
    expect(calls).toHaveLength(0);
    for (const ok of ["CA", "ca", " us ", "GB-ENG", "JP-13", "USA"]) flagDocument(ok, { shape: "round", size: 48, theme: "inherit" });
    expect(calls.map(([code]) => code)).toEqual(["CA", "ca", "us", "GB-ENG", "JP-13", "USA"]);
  });

  it("is written into the drawing as an image, which cannot run anything", () => {
    useFlags(() => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><script>alert(1)</script><rect onload="x()" width="30" height="20"/></svg>');
    const svg = drawKyogijo(game());
    expect(svg).not.toContain("<script");
    expect(svg).toContain("data:image/svg+xml");
  });
});

describe("the flags option of one drawing", () => {
  it("plugs a renderer in for that drawing alone, and the page's own is back after", () => {
    expect(titles(drawKyogijo(game({ flags: fake })))).toEqual(["CA W inherit", "JP W inherit"]);
    expect(drawKyogijo(game())).not.toMatch(NONE);
  });

  it("goes before the page's, and puts it back, even when the drawing fails", () => {
    const other: FlagRenderer = (code, request) => fake(code, request)?.replace("<title>", "<title>Other ");
    useFlags(other);
    expect(titles(drawKyogijo(game({ flags: fake })))).toEqual(["CA W inherit", "JP W inherit"]);
    expect(titles(drawKyogijo(game()))).toEqual(["Other CA W inherit", "Other JP W inherit"]);
    expect(() => drawKyogijo({ sport: "nope" as never, flags: fake })).toThrow();
    expect(titles(drawKyogijo(game()))).toEqual(["Other CA W inherit", "Other JP W inherit"]);
  });

  it("withFlags runs a function with none given as it is", () => {
    expect(withFlags(undefined, () => 7)).toBe(7);
  });
});

describe("everywhere a country has a flag", () => {
  it("a swimmer's `country`, where it has no `flag` of its own", () => {
    const pool = { race: { event: "200 m", distance: 200, swimmers: [{ lane: 1, name: "A", abbr: "CAN", country: "CA", time: 110 }, { lane: 2, name: "B", abbr: "USA", country: "US", time: 111 }, { lane: 3, name: "C", abbr: "OWN", flag: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><title>own</title></svg>', country: "JP", time: 112 }] } };
    expect(titles(drawKyogijo({ sport: "swimming", pool, id: "p" }))).toEqual(["own"]);
    useFlags(fake);
    expect(titles(drawKyogijo({ sport: "swimming", pool, id: "p" })).sort()).toEqual(["CA W inherit", "US W inherit", "own"]);
  });

  it("a lineup player's `country`", () => {
    const players = [{ pos: "GK", name: "A", number: 1, country: "CA" }, { pos: "ST", name: "B", number: 9, country: "JP" }];
    const layers = [{ kind: "lineup" as const, side: "home" as const, players }];
    expect(titles(drawKyogijo({ sport: "soccer", id: "l", layers }))).toEqual([]);
    useFlags(fake);
    expect(titles(drawKyogijo({ sport: "soccer", id: "l", layers })).sort()).toEqual(["CA W inherit", "JP W inherit"]);
  });

  it("an athlete's or a skater's `country`, drawn beside the name only when there is a flag for it", () => {
    const entries = [{ lane: 4, name: "A", country: "CA" }, { lane: 5, name: "B", country: "Nowhere" }];
    const bare = laneDraw(entries, { race: "100m" }).draw();
    expect(titles(bare)).toEqual([]);
    useFlags(fake);
    expect(titles(laneDraw(entries, { race: "100m" }).draw())).toEqual(["CA W inherit"]);
    // The chart's own `surface.flags` is the one for this chart.
    useFlags(undefined);
    expect(titles(laneDraw(entries, { race: "100m", surface: { flags: fake } }).draw())).toEqual(["CA W inherit"]);
    expect(titles(skatingGrid([{ position: 1, name: "A", country: "JP" }], { race: "500m", surface: { flags: fake } }).draw())).toEqual(["JP W inherit"]);
  });

  it("the custom element's `home-flag` and `away-flag` attributes", () => {
    const read = (attrs: Record<string, string>) => (name: string): string | null => attrs[name] ?? null;
    const o = optionsFromAttributes(read({ sport: "nhl", home: "Canada", away: "USA", "home-flag": "CA", "away-flag": "US", score: "2-3" })) as ScoreOptions;
    expect(o.home.flag).toBe("CA");
    expect(o.away.flag).toBe("US");
    useFlags(fake);
    expect(titles(drawKyogijo(o))).toEqual(["CA W inherit", "US W inherit"]);
  });
});
