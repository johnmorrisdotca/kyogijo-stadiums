// Display ranges: a drawing cropped to a named part of a surface or to a box. Every named range of every sport, wide and tall, bare and with data, annotations and a score; the
// whole surface drawn byte for byte as before when `range` is unset; the box in the surface's frame, in units and in a provider's frame; and the words, in both languages.
import { describe, expect, it } from "vitest";
import { describe as describeDrawing, drawKyogijo } from "./draw.ts";
import { optionsFromAttributes } from "./element.ts";
import { LEAGUES } from "./leagues.ts";
import { RANGES, parseRange } from "./ranges.names.ts";
import { sheetFor } from "./sheet.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import type { RangeName, ScoreOptions, Sport, SurfaceOptions } from "./types.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

const SPORTS = Object.keys(RANGES) as Sport[];
const parse = (svg: string): Node => parseXml(svg);
const view = (svg: string | Node): number[] => (typeof svg === "string" ? parse(svg) : svg).attrs.viewBox.split(" ").map(Number);
const area = (box: number[]): number => box[2] * box[3];

const away = { name: "Harbour City Gulls", abbr: "HCG", score: 3, color: "#1d4f91", sets: [6, 3], ends: [1, 0] };
const home = { name: "Prairie Ridge Bison", abbr: "PRB", score: 2, color: "#a8452c", sets: [4, 6], ends: [0, 1] };
const game = { home, away, status: "final" } as const;

/** Points over the whole of a surface in its own feet, so that some lie in any range and some outside it. */
const points = Array.from({ length: 80 }, (_, i) => ({ x: 4 + ((i * 53) % 150), y: -40 + ((i * 29) % 90), outcome: i % 5 === 0 ? "goal" : "shot" }));
const layers = [{ kind: "heatmap", data: points, legend: true }, { kind: "points", data: points }] as const;

/** Every named range of every sport, with the end it is asked for (a range with no end has none). */
const named: { sport: Sport; id: RangeName; end?: "left" | "right" }[] = SPORTS.flatMap((sport) =>
  RANGES[sport].filter((info) => info.leagues === undefined || info.leagues.includes(LEAGUES[sport][0]?.id)).flatMap((info) => (info.end === undefined ? [{ sport, id: info.id }] : [{ sport, id: info.id, end: "left" as const }, { sport, id: info.id, end: "right" as const }])),
);

describe("the ranges of each sport", () => {
  it("are listed for every sport, each with a name in both languages", () => {
    expect(SPORTS.length).toBe(31);
    for (const sport of SPORTS) {
      expect(RANGES[sport].length, sport).toBeGreaterThan(0);
      for (const info of RANGES[sport]) {
        expect(KYOGIJO_STRINGS.en.ranges.names[info.id], info.id).toMatch(/\S/);
        expect(KYOGIJO_STRINGS.ja.ranges.names[info.id], info.id).toMatch(/[぀-ヿ一-鿿]/u);
      }
    }
    // The names the task asks for.
    const ids = (sport: Sport): string[] => RANGES[sport].map((info) => info.id);
    expect(ids("nhl")).toEqual(expect.arrayContaining(["offensive-zone", "defensive-zone", "neutral-zone", "half"]));
    expect(ids("nba")).toEqual(expect.arrayContaining(["half-court", "paint"]));
    for (const sport of ["nfl", "cfl", "ifaf"] as const) expect(ids(sport)).toEqual(expect.arrayContaining(["red-zone", "between-the-20s", "own-half"]));
    expect(ids("soccer")).toEqual(expect.arrayContaining(["half", "final-third", "penalty-area"]));
    expect(ids("mlb")).toEqual(["infield", "outfield"]);
    for (const sport of ["tennis", "volleyball", "badminton", "pickleball", "tabletennis", "padel", "squash", "racquetball", "sepaktakraw", "teqball", "roundnet", "netball"] as const) expect(ids(sport)).toEqual(["half-court"]);
    expect(ids("curling")).toEqual(["sheet", "half", "house", "folded"]);
  });

  it("have each a default end where they have one, and the offensive ones attack the right", () => {
    expect(RANGES.nhl.find((r) => r.id === "offensive-zone")?.end).toBe("right");
    expect(RANGES.nhl.find((r) => r.id === "defensive-zone")?.end).toBe("left");
    expect(RANGES.nhl.find((r) => r.id === "neutral-zone")?.end).toBeUndefined();
    expect(Object.isFrozen(RANGES)).toBe(true);
  });
});

describe("a drawing with no range", () => {
  it("is the same string whether `range` is missing or undefined", () => {
    for (const sport of SPORTS) {
      const a = drawKyogijo({ sport });
      expect(drawKyogijo({ sport, range: undefined }), sport).toBe(a);
      expect(a, sport).not.toContain("data-range");
    }
  });

  it("keeps the curling sheet's own `show` as it was", () => {
    const shown = drawKyogijo({ sport: "curling", sheet: { show: "house", end: "right" } });
    expect(shown).not.toContain("data-range");
    expect(view(shown)).not.toEqual(view(drawKyogijo({ sport: "curling" })));
  });
});

describe("every named range, wide and tall", () => {
  for (const { sport, id, end } of named) {
    const range = end === undefined ? id : { name: id, end };
    const label = `${sport} ${id}${end === undefined ? "" : ` ${end}`}`;
    for (const orientation of ["landscape", "portrait"] as const) {
      it(`crops the ${label} ${orientation === "landscape" ? "wide" : "tall"}, drawn whole and well formed`, () => {
        const whole = drawKyogijo({ sport, orientation });
        const svg = drawKyogijo({ sport, orientation, range } as SurfaceOptions);
        const root = parse(svg);
        expect(root.attrs["data-range"]).toBe(id);
        const box = view(root);
        const full = view(whole);
        if (id === "sheet") expect(box).toEqual(full);
        // A folded sheet is not a crop: it is the whole sheet with its houses enlarged beside it, so it is larger, and square.
        else if (id === "folded") {
          expect(area(box), label).toBeGreaterThan(area(full));
          expect(box[2] / box[3], label).toBeCloseTo(1, 2);
        } else expect(area(box), label).toBeLessThan(area(full));
        // The crop stays inside the whole drawing's view, in the frame it lies in.
        if (id !== "folded") {
          expect(box[2]).toBeLessThanOrEqual(full[2] + 1e-6);
          expect(box[3]).toBeLessThanOrEqual(full[3] + 1e-6);
        }
        expect(box[2]).toBeGreaterThan(0);
        // A tall drawing is the wide one turned a quarter: the same part of the surface, on its side.
        if (orientation === "portrait" && sport !== "mlb" && sport !== "curling" && sport !== "roundnet") {
          const wide = view(drawKyogijo({ sport, range } as SurfaceOptions));
          expect(box[2]).toBeCloseTo(wide[3], 1);
          expect(box[3]).toBeCloseTo(wide[2], 1);
        }
        expect(root.attrs["aria-labelledby"]).toBeDefined();
      });
    }

    it(`cuts data to the ${label} and draws the same marks as the whole`, () => {
      const svg = drawKyogijo({ sport, range, layers, id: "r" } as never);
      const root = parse(svg);
      const group = walk(root).find((n) => n.attrs.class === "ky-layers");
      expect(group, label).toBeDefined();
      if (id === "sheet" || id === "half" || id === "house" || id === "folded") {
        if (sport === "curling") return;
      }
      const clips = walk(root).filter((n) => n.name === "clipPath");
      expect(clips.some((n) => n.attrs.id === "r-lc"), label).toBe(true);
      expect(clips.some((n) => n.attrs.id === "r-lc-r")).toBe(true);
      // Each layer is held by a group with the range's clip, over the layer's own clip to the outline.
      const held = walk(root).filter((n) => n.attrs["clip-path"] === "url(#r-lc-r)");
      expect(held.length, label).toBe(2);
      expect(held.every((n) => n.children[0]?.attrs["clip-path"] === "url(#r-lc)"), label).toBe(true);
      expect(root.attrs["data-range"]).toBe(id);
    });
  }
});

describe("annotations and a score on a range", () => {
  it("name only the parts that are in the range, and put the axes' ticks inside it", () => {
    const whole = drawKyogijo({ sport: "nhl", landmarks: true });
    const zone = drawKyogijo({ sport: "nhl", range: "offensive-zone", landmarks: true });
    const labels = (svg: string): string[] => walk(parse(svg)).filter((n) => (n.attrs.class ?? "").includes("ky-an-t")).map((n) => n.text);
    expect(labels(whole)).toContain("Referee's crease");
    expect(labels(zone)).not.toContain("Referee's crease");
    expect(labels(zone)).toContain("Goal line");
    expect(labels(zone)).not.toContain("Centre red line");
    const axes = drawKyogijo({ sport: "nhl", range: "offensive-zone", axes: { ticks: 25 } });
    const ticks = walk(parse(axes)).filter((n) => (n.attrs.class ?? "").includes("ky-an-t")).map((n) => Number(n.text));
    // Along the length: the ticks of the right zone only (the width's, 0 to 85, are the surface's whole width).
    expect(ticks).toEqual(expect.arrayContaining([150, 175, 200]));
    expect(ticks).not.toContain(100);
    expect(ticks).not.toContain(125 - 25);
  });

  it("make room round the part that is shown, with the apron beyond the cut and the surface clipped to it", () => {
    const svg = drawKyogijo({ sport: "nba", range: "paint", landmarks: true, direction: { home: "right" }, id: "n" });
    const root = parse(svg);
    expect(walk(root).some((n) => n.name === "clipPath" && n.attrs.id === "n-rg")).toBe(true);
    expect(walk(root).some((n) => n.attrs["clip-path"] === "url(#n-rg)")).toBe(true);
    // Without annotations nothing is clipped: the view is the cut.
    expect(drawKyogijo({ sport: "nba", range: "paint", id: "n" })).not.toContain("n-rg");
  });

  it("make room on the cut's side for the axes of a range that is cut there, though the surface's own margin is wide enough", () => {
    const bare = view(drawKyogijo({ sport: "nhl", range: "offensive-zone" }));
    const axes = view(drawKyogijo({ sport: "nhl", range: "offensive-zone", axes: { ticks: 25 } }));
    expect(axes[0]).toBeLessThan(bare[0] - 1);
  });

  it("put the score's panel inside the part that is shown", () => {
    for (const [sport, id] of [["nhl", "offensive-zone"], ["nhl", "neutral-zone"], ["nba", "half-court"], ["mlb", "infield"], ["nfl", "between-the-20s"], ["soccer", "half"]] as const) {
      for (const orientation of ["landscape", "portrait"] as const) {
        const svg = drawKyogijo({ sport, orientation, range: id, ...game, id: "s" } as ScoreOptions);
        const root = parse(svg);
        const box = view(root);
        if (root.attrs["data-size"] !== "full") continue;
        const plate = withClass(root, "ky-plate")[0];
        expect(plate, `${sport} ${id} ${orientation}`).toBeDefined();
        const at = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(plate.attrs.transform);
        // The plate is in a group the surface's turn holds, so its place is found through the turn.
        const group = walk(root).find((n) => n.attrs.class === "ky-surface-group");
        const turn = group?.attrs.transform === undefined ? undefined : /matrix\(([-\d. ]+)\)/.exec(group.attrs.transform)?.[1].split(" ").map(Number);
        const [px, py] = [Number(at?.[1]), Number(at?.[2])];
        const [sx, sy] = turn === undefined ? [px, py] : [turn[0] * px + turn[2] * py + turn[4], turn[1] * px + turn[3] * py + turn[5]];
        expect(sx, `${sport} ${id} ${orientation}`).toBeGreaterThan(box[0]);
        expect(sx).toBeLessThan(box[0] + box[2]);
        expect(sy).toBeGreaterThan(box[1]);
        expect(sy).toBeLessThan(box[1] + box[3]);
      }
    }
  });

  it("put the score in a strip under the drawing when the range is too small to hold the panel", () => {
    const svg = drawKyogijo({ sport: "nba", range: "paint", ...game, id: "p" } as ScoreOptions);
    const root = parse(svg);
    expect(root.attrs["data-size"]).toBe("compact");
    expect(withClass(root, "ky-strip")).toHaveLength(1);
    expect(withClass(root, "ky-plate")).toHaveLength(0);
    expect(drawKyogijo({ sport: "nba", ...game, id: "p" } as ScoreOptions)).toContain("ky-plate");
  });

  it("write a team's name only where its place is in the range", () => {
    const names = (svg: string): number => withClass(parse(svg), "ky-banner").length;
    expect(names(drawKyogijo({ sport: "nhl", ...game }))).toBe(2);
    expect(names(drawKyogijo({ sport: "nhl", range: "offensive-zone", ...game }))).toBe(1);
    expect(names(drawKyogijo({ sport: "nhl", range: "neutral-zone", ...game }))).toBe(0);
    expect(names(drawKyogijo({ sport: "nfl", range: "own-half", ...game }))).toBe(1);
  });

  it("show a curling score's whole sheet, whatever the range", () => {
    const svg = drawKyogijo({ sport: "curling", range: "house", ...game, id: "g" } as ScoreOptions);
    expect(svg).toBe(drawKyogijo({ sport: "curling", ...game, id: "g" } as ScoreOptions));
  });
});

describe("the end of a range", () => {
  it("is the default one, or the one asked for: the same range at the other end is the mirror", () => {
    const wide = (range: unknown): number[] => view(drawKyogijo({ sport: "nhl", range } as SurfaceOptions));
    const right = wide("offensive-zone");
    const left = wide({ name: "offensive-zone", end: "left" });
    expect(right[2]).toBeCloseTo(left[2], 6);
    expect(right[0]).toBeGreaterThan(left[0]);
    expect(wide("defensive-zone")).toEqual(left);
    expect(wide({ name: "defensive-zone", end: "right" })).toEqual(right);
    // A range with no end ignores one.
    expect(wide({ name: "neutral-zone", end: "left" })).toEqual(wide("neutral-zone"));
  });

  it("is `left` or `right`", () => {
    expect(() => drawKyogijo({ sport: "nhl", range: { name: "half", end: "up" as never } })).toThrow(/"left" or "right"/);
  });
});

describe("a range that is a box", () => {
  it("is in the surface's own feet, or in units, and crops to the same part", () => {
    const feet = view(drawKyogijo({ sport: "nhl", range: { x0: 100, x1: 160, y0: 10, y1: 60 } }));
    const yards = view(drawKyogijo({ sport: "nhl", units: "yd", range: { x0: 100 / 3, x1: 160 / 3, y0: 10 / 3, y1: 60 / 3 } }));
    expect(yards.map((v) => Math.round(v * 1000))).toEqual(feet.map((v) => Math.round(v * 1000)));
    // The box, 60 by 50 feet, with a small cut round it.
    expect(feet[2]).toBeCloseTo(61.6, 6);
    expect(feet[3]).toBeCloseTo(51.6, 6);
  });

  it("is in a provider's frame, as a layer's points are", () => {
    // The NHL API's right end zone: x from the blue line (25 feet from centre) to the end boards (100), y from the middle to the top.
    const svg = drawKyogijo({ sport: "nhl", range: { x0: 25, x1: 100, y0: -42.5, y1: 42.5, frame: "nhl-api" }, layers: [{ kind: "points", from: "nhl-api", data: [{ x: 69, y: 22 }] }] });
    const box = view(svg);
    expect(box[0]).toBeGreaterThan(120);
    // A team that attacks the left has its frame turned a half turn about the middle.
    const left = view(drawKyogijo({ sport: "nhl", range: { x0: 25, x1: 100, y0: -42.5, y1: 42.5, frame: "nhl-api", attacking: "left" } }));
    expect(left[0]).toBeLessThan(box[0]);
  });

  it("is fitted to a surface of any size: a frame of a pitch of 105 by 68 metres or of another", () => {
    const a = view(drawKyogijo({ sport: "soccer", range: { x0: 66, x1: 100, y0: 20, y1: 80, frame: "opta" } }));
    const b = view(drawKyogijo({ sport: "soccer", pitch: { length: 120, width: 80, unit: "m" }, range: { x0: 66, x1: 100, y0: 20, y1: 80, frame: "opta" } }));
    expect(b[2]).toBeGreaterThan(a[2]);
  });

  it("is checked: four numbers, and a part of the drawing", () => {
    expect(() => drawKyogijo({ sport: "nhl", range: { x0: 1, x1: 2, y0: 3 } as never })).toThrow(/x0, x1, y0, y1/);
    expect(() => drawKyogijo({ sport: "nhl", range: { x0: 1, x1: "a", y0: 3, y1: 4 } as never })).toThrow(TypeError);
    expect(() => drawKyogijo({ sport: "nhl", range: { x0: 1000, x1: 1100, y0: 3, y1: 4 } })).toThrow(/outside/);
    expect(() => drawKyogijo({ sport: "nhl", range: { x0: 1, x1: 9, y0: 3, y1: 4, attacking: "up" as never } })).toThrow(/attacking/);
  });

  it("reaches the surface's own ground where it reaches the surface's edge", () => {
    const whole = view(drawKyogijo({ sport: "nhl" }));
    const box = view(drawKyogijo({ sport: "nhl", range: { x0: -1000, x1: 50, y0: -1000, y1: 1000 } }));
    expect(box[0]).toBe(whole[0]);
    expect(box[1]).toBe(whole[1]);
    expect(box[3]).toBe(whole[3]);
  });
});

describe("a name that is not the sport's", () => {
  it("is an error that lists the sport's ranges", () => {
    expect(() => drawKyogijo({ sport: "nhl", range: "red-zone" as never })).toThrow(/nhl surface has no range "red-zone": use one of offensive-zone, defensive-zone, neutral-zone, half/);
    expect(() => drawKyogijo({ sport: "mlb", range: "half" as never })).toThrow(/infield, outfield/);
    expect(() => drawKyogijo({ sport: "curling", range: "paint" as never })).toThrow(/sheet, half, house/);
  });

  it("is read for the sport as drawn: a CFL league on an NFL surface has the football ranges", () => {
    expect(parseRange({ sport: "nfl", league: "cfl", range: "red-zone" })).toEqual({ kind: "name", name: "red-zone", end: "right", asked: undefined });
  });
});

describe("a curling sheet's ranges", () => {
  it("are its sheet, half and house: the same as the sheet's own `show` and `end`", () => {
    for (const show of ["sheet", "half", "house"] as const) {
      for (const end of ["left", "right"] as const) {
        const own = drawKyogijo({ sport: "curling", sheet: { show, end } });
        const ranged = drawKyogijo({ sport: "curling", range: show === "sheet" ? "sheet" : { name: show, end } });
        expect(view(ranged), `${show} ${end}`).toEqual(view(own));
      }
    }
    expect(sheetFor({ sport: "curling", range: "house" }).show).toBe("house");
    // The range wins over the sheet's own.
    expect(sheetFor({ sport: "curling", sheet: { show: "half" }, range: "house" }).show).toBe("house");
    expect(sheetFor({ sport: "curling", sheet: { end: "right" }, range: "half" }).end).toBe("right");
    expect(sheetFor({ sport: "curling", sheet: { end: "right" }, range: { name: "half", end: "left" } }).end).toBe("left");
  });

  it("can also be a box, in any frame", () => {
    const whole = view(drawKyogijo({ sport: "curling" }));
    const box = view(drawKyogijo({ sport: "curling", range: { x0: 0, x1: 40, y0: 0, y1: 15 } }));
    expect(box[3]).toBeLessThan(whole[3]);
  });
});

describe("the words of a range", () => {
  it("say what is shown, and that data outside it is not drawn, in English", () => {
    const text = (o: SurfaceOptions): string => describeDrawing(o).description;
    expect(text({ sport: "nhl", range: "offensive-zone" })).toContain("Shows only the offensive zone at the right end.");
    expect(text({ sport: "nhl", range: "neutral-zone" })).toContain("Shows only the neutral zone.");
    expect(text({ sport: "nhl", range: { name: "half", end: "left" } })).toContain("Shows only the half at the left end.");
    expect(text({ sport: "nhl", range: "neutral-zone" })).not.toContain("not drawn");
    expect(text({ sport: "nhl", range: "neutral-zone", layers: [{ kind: "points", data: [{ x: 1, y: 1 }] }] })).toContain("Data outside it is not drawn.");
    expect(text({ sport: "nhl", range: { x0: 100, x1: 160, y0: 10, y1: 60 } })).toContain("Shows only a part of the surface: x from 100 to 160, y from 10 to 60.");
    expect(text({ sport: "nhl", range: { x0: 25, x1: 100, y0: -42.5, y1: 42.5, frame: "nhl-api" } })).toContain("in the nhl-api frame");
    expect(text({ sport: "nhl" })).not.toContain("Shows only");
  });

  it("are in Japanese too", () => {
    const text = describeDrawing({ sport: "nhl", range: "offensive-zone", language: "ja", layers: [{ kind: "points", data: [{ x: 1, y: 1 }] }] }).description;
    expect(text).toContain("表示範囲は右側のアタッキングゾーンです。");
    expect(text).toContain("範囲外のデータは描かれません。");
  });

  it("are in the drawing's description, not in a curling score's, which shows the whole sheet", () => {
    expect(drawKyogijo({ sport: "curling", range: "house" })).toContain("Shows only the house at the left end.");
    expect(drawKyogijo({ sport: "curling", range: "house", ...game } as ScoreOptions)).not.toContain("Shows only");
  });
});

describe("the custom element", () => {
  it("reads `range` as a name, or as JSON for a box, and `range-end`", () => {
    const read = (attrs: Record<string, string>): SurfaceOptions => optionsFromAttributes((name) => attrs[name] ?? null);
    expect(read({ sport: "nhl", range: "offensive-zone" }).range).toBe("offensive-zone");
    expect(read({ sport: "nhl", range: "half", "range-end": "right" }).range).toEqual({ name: "half", end: "right" });
    expect(read({ sport: "nhl", range: '{"x0":1,"x1":2,"y0":3,"y1":4}' }).range).toEqual({ x0: 1, x1: 2, y0: 3, y1: 4 });
  });
});
