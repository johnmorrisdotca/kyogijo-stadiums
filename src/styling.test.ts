import { describe, expect, it } from "vitest";
import { SPORTS, drawKyogijo } from "./draw.ts";
import { FEATURES, FEATURE_INFO, KYOGIJO_FEATURE_STYLE } from "./features.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { KYOGIJO_STYLE } from "./style.ts";
import { LOOK_NAMES } from "./look.ts";
import { isFieldSport } from "./fields.ts";
import { LEAGUES } from "./leagues.ts";
import type { GoalInfo, SurfaceOptions } from "./types.ts";
import { parseXml, withClass, type Node } from "./xml.fixture.ts";

const root = (svg: string): Node => parseXml(svg);
const FOOTBALL = ["nfl", "cfl", "ifaf"] as const;

describe("named looks", () => {
  it("write data-palette and the look's own stylesheet after the base one, and leave every other drawing alone", () => {
    for (const look of LOOK_NAMES) {
      const svg = drawKyogijo({ sport: "nhl", look, id: "l" });
      expect(svg).toContain(`data-palette="${look}"`);
      expect(svg).toContain(`:where(.kyogijo[data-palette=${look}])`);
      expect(svg.indexOf(`data-palette=${look}`)).toBeGreaterThan(svg.indexOf(".ky-apron{"));
      root(svg);
    }
    expect(drawKyogijo({ sport: "nhl", id: "l" })).not.toContain("data-palette");
    expect(drawKyogijo({ sport: "nhl", id: "l", look: "nope" as never })).toBe(drawKyogijo({ sport: "nhl", id: "l" }));
  });

  it("leave the stylesheet to the page with style none, and the page has every look", () => {
    const svg = drawKyogijo({ sport: "nba", look: "print", style: "none", id: "l" });
    expect(svg).not.toContain("<style>");
    expect(KYOGIJO_STYLE).toContain("[data-palette=blueprint]");
  });

  it("are overridden by colors, which are inline on the drawing", () => {
    expect(drawKyogijo({ sport: "nhl", look: "night", colors: { line: "#ff0" }, id: "l" })).toContain('style="--ky-line:#ff0"');
  });
});

describe("feature colours", () => {
  const extras: Record<string, Partial<SurfaceOptions>> = {
    nba: { court: { paintThreePoint: true, baselineText: "HARBOUR" } },
    curling: { sheet: { pebble: true, guardZone: true }, league: "wcf" },
    mlb: {},
  };
  for (const sport of SPORTS) {
    const names = FEATURES[sport] ?? [];
    it(`${sport}: every feature (${names.length}) is on an element of a drawing, and its colour is on the drawing`, () => {
      if (names.length === 0) return;
      const featureColors = Object.fromEntries(names.map((name, i) => [name, `#0${i % 10}0${(i + 3) % 10}0${(i + 5) % 10}`]));
      const svg = drawKyogijo({ sport, id: "f", featureColors, ...(extras[sport] ?? {}) });
      // A field sport's leagues mark different things (union and league, the box and the field): a feature is on an element of one of its drawings, bare or with a score.
      const game = { away: { name: "Away", score: 1 }, home: { name: "Home", score: 2 } };
      const drawn = isFieldSport(sport) ? LEAGUES[sport].flatMap((league) => [drawKyogijo({ sport, league: league.id, id: "f", featureColors }), drawKyogijo({ sport, league: league.id, id: "f", featureColors, ...game })]).map(root) : [root(svg)];
      const missing = names.filter((name) => drawn.every((tree) => withClass(tree, `ky-f-${name}`).length === 0));
      // A feature a drawing may not have by default: the curling hack lines and courtesy lines belong to World Curling's sheet and the crease marks to some rinks.
      const optional = new Set(["courtesy-lines", "crease-marks", "trapezoid", "referee-crease", "running-lane", "batters-boxes", "centre-dashes", "hash-marks", "areas", "antennae", "free-zone"]);
      expect(missing.filter((name) => !optional.has(name)), `${sport} has no element for`).toEqual([]);
      for (const name of names) expect(svg, name).toContain(`--ky-f-${name}:`);
      expect(svg).toContain(".ky-f-");
    });
  }

  it("give each feature's part its colour through the property the part is painted with", () => {
    const svg = drawKyogijo({ sport: "nhl", id: "f", featureColors: { "blue-lines": "#00aa00" } });
    expect(svg).toContain("--ky-f-blue-lines:#00aa00");
    expect(svg).toContain(".kyogijo .ky-f-blue-lines{--ky-blue:var(--ky-f-blue-lines)}");
    expect(withClass(root(svg), "ky-f-blue-lines")).toHaveLength(1);
    // The rim is painted in a colour that is no property, so its rule sets stroke.
    expect(drawKyogijo({ sport: "nba", id: "f", featureColors: { rims: "#00f" } })).toContain(".kyogijo .ky-f-rims{stroke:var(--ky-f-rims)}");
  });

  it("name a feature once for each of the three football fields, which share their list", () => {
    for (const sport of FOOTBALL) expect(FEATURES[sport]).toEqual(FEATURES.nfl);
  });

  it("refuse a name the sport does not have, naming the ones it has, and ignore a colour that is not safe", () => {
    expect(() => drawKyogijo({ sport: "nhl", featureColors: { "blue-line": "#000" } })).toThrow(/Unknown feature "blue-line" for nhl: use one of apron, boards, ice/);
    expect(drawKyogijo({ sport: "nhl", id: "f", featureColors: { ice: "red;fill:url(x)" } })).not.toContain("--ky-f-ice");
  });

  it("have a rule in the page's stylesheet for each feature of each sport", () => {
    for (const [sport, list] of Object.entries(FEATURE_INFO)) for (const feature of list) expect(KYOGIJO_FEATURE_STYLE, `${sport} ${feature.name}`).toContain(`[data-sport=${sport}] .ky-f-${feature.name}`);
  });

  it("change nothing for a name that is not asked", () => {
    expect(drawKyogijo({ sport: "nhl", id: "f", featureColors: {} })).toBe(drawKyogijo({ sport: "nhl", id: "f" }));
  });
});

describe("the width, the dashes and the opacity of the lines", () => {
  const widths = (svg: string, cls: string): number[] => withClass(root(svg), cls).map((n) => Number(n.attrs["stroke-width"]));

  it("scale every painted line by a multiple, or set the ordinary line to an absolute width", () => {
    const base = widths(drawKyogijo({ sport: "nhl", id: "w" }), "ky-blue");
    expect(widths(drawKyogijo({ sport: "nhl", id: "w", lineWidth: 2 }), "ky-blue")).toEqual(base.map((w) => Math.round(w * 2 * 100) / 100));
    expect(widths(drawKyogijo({ sport: "nhl", id: "w", lineWidth: { scale: 2 } }), "ky-blue")).toEqual(widths(drawKyogijo({ sport: "nhl", id: "w", lineWidth: 2 }), "ky-blue"));
    // The circles of the rink are drawn 0.45 foot wide: asking for 0.9 foot is a scale of 2.
    expect(widths(drawKyogijo({ sport: "nhl", id: "w", lineWidth: { width: 0.9 } }), "ky-red")).toEqual(widths(drawKyogijo({ sport: "nhl", id: "w", lineWidth: 2 }), "ky-red"));
    // In `units`: 0.9 foot is 0.2743 metre.
    expect(widths(drawKyogijo({ sport: "nhl", id: "w", units: "m", lineWidth: { width: 0.274321 } }), "ky-red")).toEqual(widths(drawKyogijo({ sport: "nhl", id: "w", lineWidth: 2 }), "ky-red"));
  });

  it("scale a soccer pitch's lines, which are in metres, as much", () => {
    const base = widths(drawKyogijo({ sport: "soccer", id: "w" }), "ky-line");
    expect(widths(drawKyogijo({ sport: "soccer", id: "w", lineWidth: 3 }), "ky-line")).toEqual(base.map((w) => Math.round(w * 3 * 100) / 100));
  });

  it("dash the lines, by name or by lengths, and keep a dash the rules gave", () => {
    const dashed = drawKyogijo({ sport: "nba", id: "d", lineDash: "dashed" });
    const lines = withClass(root(dashed), "ky-line");
    expect(lines.length).toBeGreaterThan(5);
    expect(lines.every((n) => n.attrs["stroke-dasharray"] !== undefined)).toBe(true);
    expect(drawKyogijo({ sport: "nba", id: "d", lineDash: [2, 1] })).toContain('stroke-dasharray="2 1"');
    expect(drawKyogijo({ sport: "nba", id: "d", lineDash: [1, 0.5], units: "yd" })).toContain('stroke-dasharray="3 1.5"');
    expect(dashed).toContain('stroke-dasharray="1.6 1.2"');
    expect(drawKyogijo({ sport: "nba", id: "d", lineDash: "solid" })).toBe(drawKyogijo({ sport: "nba", id: "d" }));
    expect(drawKyogijo({ sport: "nhl", id: "d", lineDash: "dotted" })).toContain("stroke-dasharray");
    expect(drawKyogijo({ sport: "nhl", id: "d", lineDash: "dash-dot" })).toMatch(/stroke-dasharray="[\d. ]+ [\d. ]+ [\d. ]+ [\d. ]+"/);
  });

  it("make the lines and the spots on them translucent", () => {
    const svg = drawKyogijo({ sport: "nhl", id: "o", lineOpacity: 0.5 });
    expect(withClass(root(svg), "ky-blue").every((n) => n.attrs["stroke-opacity"] === "0.5")).toBe(true);
    expect(withClass(root(svg), "ky-red-fill").every((n) => n.attrs["fill-opacity"] === "0.5")).toBe(true);
    expect(drawKyogijo({ sport: "nhl", id: "o", lineOpacity: 1 })).toBe(drawKyogijo({ sport: "nhl", id: "o" }));
  });

  it("leave the fixtures alone: posts, rims and nets keep their widths", () => {
    const plain = drawKyogijo({ sport: "nba", id: "o" });
    const wide = drawKyogijo({ sport: "nba", id: "o", lineWidth: 3 });
    expect(widths(wide, "ky-rim")).toEqual(widths(plain, "ky-rim"));
    expect(widths(wide, "ky-board")).toEqual(widths(plain, "ky-board"));
  });

  it("ignore what cannot be read, and an ordinary width", () => {
    const plain = drawKyogijo({ sport: "nfl", id: "o" });
    for (const lineWidth of [0, -1, Number.NaN, "x" as never, { scale: -1 } as never, 1]) expect(drawKyogijo({ sport: "nfl", id: "o", lineWidth })).toBe(plain);
    expect(drawKyogijo({ sport: "nfl", id: "o", lineDash: [1, -1] as never, lineOpacity: Number.NaN })).toBe(plain);
  });
});

describe("goals", () => {
  const goalsOf = (sport: SurfaceOptions["sport"], options: Partial<SurfaceOptions> = {}): GoalInfo[] => {
    const seen: GoalInfo[] = [];
    drawKyogijo({ sport, id: "g", ...options, goalMarkup: (goal) => (seen.push(goal), `<circle class="mine" cx="${goal.x}" cy="${goal.y}" r="1"/>`) });
    return seen;
  };

  it("give a function of the caller's where each goal stands, once for each end, for every sport that has goals", () => {
    for (const sport of ["nfl", "cfl", "ifaf", "nhl", "nba", "soccer"] as const) {
      const seen = goalsOf(sport);
      expect(seen.map((goal) => goal.end), sport).toEqual(["left", "right"]);
      expect(seen[0].sport).toBe(sport);
      expect(seen[0].width).toBeGreaterThan(0);
      expect(seen[0].y).toBeCloseTo(seen[1].y, 5);
      expect(seen[1].x).toBeGreaterThan(seen[0].x);
      expect(seen[0].out === -seen[1].out).toBe(true);
    }
  });

  it("draw what the function returns, in place of the built-in goal, in the drawing's own frame", () => {
    for (const sport of ["nhl", "nba", "soccer", "nfl"] as const) {
      const svg = drawKyogijo({ sport, id: "g", goalMarkup: () => `<circle class="mine" cx="1" cy="2" r="3"/>` });
      expect(withClass(root(svg), "mine"), sport).toHaveLength(2);
    }
    expect(withClass(root(drawKyogijo({ sport: "nhl", id: "g", goalMarkup: () => "" })), "ky-net")).toHaveLength(0);
    const nhl = goalsOf("nhl")[0];
    expect(nhl.width).toBeCloseTo(6, 1);
    expect(goalsOf("soccer")[0].width).toBeCloseTo(7.32 * 3.2808, 2);
  });

  it("style a hockey net, a basket and a field's posts like a soccer goal: box (the usual), line, strip, none", () => {
    const count = (svg: string, cls: string): number => withClass(root(svg), cls).length;
    expect(drawKyogijo({ sport: "nhl", id: "g", goals: "box" })).toBe(drawKyogijo({ sport: "nhl", id: "g" }));
    expect(count(drawKyogijo({ sport: "nhl", id: "g", goals: "none" }), "ky-net")).toBe(0);
    expect(count(drawKyogijo({ sport: "nhl", id: "g", goals: "line" }), "ky-net")).toBe(2);
    expect(count(drawKyogijo({ sport: "nhl", id: "g", goals: "strip" }), "ky-net")).toBe(0);
    expect(drawKyogijo({ sport: "nhl", id: "g", goals: "strip" })).not.toBe(drawKyogijo({ sport: "nhl", id: "g" }));
    expect(drawKyogijo({ sport: "nba", id: "g", goals: "box" })).toBe(drawKyogijo({ sport: "nba", id: "g" }));
    expect(count(drawKyogijo({ sport: "nba", id: "g", goals: "none" }), "ky-rim")).toBe(0);
    expect(count(drawKyogijo({ sport: "nba", id: "g", goals: "line" }), "ky-rim")).toBe(0);
    expect(count(drawKyogijo({ sport: "nba", id: "g", goals: "line" }), "ky-board")).toBe(2);
    expect(count(drawKyogijo({ sport: "nba", id: "g", goals: "strip" }), "ky-rim")).toBe(2);
    expect(count(drawKyogijo({ sport: "nfl", id: "g", goals: "none" }), "ky-post")).toBe(0);
    expect(count(drawKyogijo({ sport: "nfl", id: "g", goals: "line" }), "ky-post-end")).toBe(0);
    expect(count(drawKyogijo({ sport: "nfl", id: "g", goals: "strip" }), "ky-post-end")).toBe(4);
    expect(count(drawKyogijo({ sport: "nfl", id: "g" }), "ky-post-end")).toBe(4);
  });
});

describe("mowing patterns", () => {
  const patterns = ["bands", "wide", "narrow", "lengthwise", "checks", "diagonal", "circles", "rings", "fan", "none"] as const;
  const stripe = (svg: string): Node | undefined => withClass(root(svg), "ky-stripe")[0] ?? withClass(root(svg), "ky-ring")[0];

  it("mow a football field in every pattern, the usual one by default and for `bands`", () => {
    expect(drawKyogijo({ sport: "nfl", id: "m", stripePattern: "bands" })).toBe(drawKyogijo({ sport: "nfl", id: "m" }));
    const paths = new Set<string>();
    for (const pattern of ["wide", "narrow", "lengthwise", "checks", "diagonal", "circles"] as const) {
      const node = stripe(drawKyogijo({ sport: "nfl", id: "m", stripePattern: pattern }));
      expect(node, pattern).toBeDefined();
      paths.add(node!.attrs.d);
    }
    expect(paths.size).toBe(6);
    expect(stripe(drawKyogijo({ sport: "nfl", id: "m", stripePattern: "none" }))).toBeUndefined();
    expect(stripe(drawKyogijo({ sport: "nfl", id: "m", stripePattern: "circles" }))!.attrs["clip-path"]).toBe("url(#m-turf)");
  });

  it("mow a ballpark in rings by default and in the other patterns, cut to the fair ground", () => {
    expect(drawKyogijo({ sport: "mlb", id: "m", stripePattern: "rings" })).toBe(drawKyogijo({ sport: "mlb", id: "m" }));
    expect(drawKyogijo({ sport: "mlb", id: "m", stripePattern: "circles" })).toBe(drawKyogijo({ sport: "mlb", id: "m" }));
    const paths = new Set<string>();
    for (const pattern of ["bands", "wide", "narrow", "lengthwise", "checks", "diagonal", "fan"] as const) {
      const node = withClass(root(drawKyogijo({ sport: "mlb", id: "m", stripePattern: pattern })), "ky-stripe")[0];
      expect(node, pattern).toBeDefined();
      expect(node.attrs["clip-path"]).toBe("url(#m-fair)");
      paths.add(node.attrs.d);
    }
    expect(paths.size).toBe(7);
    expect(withClass(root(drawKyogijo({ sport: "mlb", id: "m", stripePattern: "none" })), "ky-ring")).toHaveLength(0);
  });

  it("mow a soccer pitch in rings, cut to the pitch, with the rings cut out of each other", () => {
    const node = withClass(root(drawKyogijo({ sport: "soccer", id: "m", stripePattern: "circles" })), "ky-stripe")[0];
    expect(node.attrs["fill-rule"]).toBe("evenodd");
    expect(node.attrs["clip-path"]).toBe("url(#m-turf)");
  });

  it("take every pattern on every grass surface without an error, and ignore it on ice and wood", () => {
    for (const sport of ["nfl", "cfl", "ifaf", "mlb", "soccer", "nhl", "nba", "curling"] as const) for (const stripePattern of patterns) root(drawKyogijo({ sport, id: "m", stripePattern }));
    expect(drawKyogijo({ sport: "nhl", id: "m", stripePattern: "checks" })).toBe(drawKyogijo({ sport: "nhl", id: "m" }));
  });
});

describe("the words of the annotations", () => {
  it("have the same parts in English and in Japanese, and Japanese for each", () => {
    const en = Object.keys(KYOGIJO_STRINGS.en.notes.names).sort();
    expect(Object.keys(KYOGIJO_STRINGS.ja.notes.names).sort()).toEqual(en);
    for (const id of en) expect(KYOGIJO_STRINGS.ja.notes.names[id], id).toMatch(/[぀-ヿ一-鿿]/u);
  });
});
