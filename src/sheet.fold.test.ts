// The folded curling sheet (`sheet.show: "folded"`): the whole sheet as a strip with its two houses enlarged beside it, tall and wide, with data in the strip and in the panels, the
// ends read as top and bottom, the words in both languages, and every other curling drawing left as it was.
import { describe, expect, it } from "vitest";
import { curlingStones } from "./charts.curling.ts";
import { describe as describeDrawing, drawKyogijo } from "./draw.ts";
import { sceneOf } from "./scene.ts";
import { sceneToGeoJSON } from "./geojson.ts";
import { sheetFor } from "./sheet.ts";
import type { ScoreOptions, SurfaceOptions } from "./types.ts";
import { parseXml, walk } from "./xml.fixture.ts";

const folded = (more: Partial<SurfaceOptions> = {}, sheet: NonNullable<SurfaceOptions["sheet"]> = {}): string => drawKyogijo({ sport: "curling", id: "f", ...more, sheet: { show: "folded", ...sheet } } as SurfaceOptions);
const view = (svg: string): number[] => parseXml(svg).attrs.viewBox.split(" ").map(Number);
const stones = [
  { x: 0.4, y: 0.3, team: "home", number: 8 },
  { x: -1.2, y: -0.8, team: "home", number: 6 },
  { x: 1.9, y: 1.1, team: "away", number: 7 },
  { x: 0.2, y: -9, team: "away", number: 3 },
] as const;

describe("a folded sheet", () => {
  it("fills a square, tall and wide, and holds the whole sheet between its panels", () => {
    for (const orientation of ["portrait", "landscape"] as const) {
      const [, , w, h] = view(folded({ orientation }));
      expect(w / h, orientation).toBeCloseTo(1, 2);
      // The strip is the sheet at its own scale and the panels are larger: the drawing is taller than the tall sheet's own, which is 156 feet.
      expect(Math.max(w, h)).toBeGreaterThan(150);
    }
    expect(view(folded({ orientation: "portrait" })).slice(2)).toEqual(view(folded({ orientation: "landscape" })).slice(2));
  });

  it("is shaped by `fit`, and a fit outside 0.5 to 2 is an error that says the range", () => {
    const [, , w, h] = view(folded({}, { fit: 1.2 }));
    expect(w / h).toBeCloseTo(1.2, 1);
    const [, , tw, th] = view(folded({ orientation: "landscape" }, { fit: 0.8, panels: "house" }));
    expect(tw / th).toBeCloseTo(0.8, 1);
    // A panel is never longer than the strip, so a frame wider than the panels can fill is as wide as they can.
    const [, , ww, wh] = view(folded({}, { fit: 2 }));
    expect(ww / wh).toBeLessThan(2);
    expect(() => folded({}, { fit: 3 })).toThrow(/0\.5 to 2/);
  });

  it("holds the half of each end, or only the house, and the house is the smaller part", () => {
    const half = sheetFor({ sport: "curling", sheet: { show: "folded" } });
    const house = sheetFor({ sport: "curling", sheet: { show: "folded", panels: "house" } });
    expect(half.panels).toBe("half");
    expect(house.panels).toBe("house");
    const clipsOf = (svg: string): number[] => walk(parseXml(svg)).filter((n) => n.name === "rect" && n.attrs.width !== undefined && n.attrs.height !== undefined).map((n) => Number(n.attrs.width));
    expect(Math.max(...clipsOf(folded({}, { panels: "house" })))).toBeLessThan(200);
    expect(folded({}, { panels: "house" })).not.toBe(folded());
  });

  it("labels each panel as the sheet lies, and joins it to the part of the strip it enlarges", () => {
    const texts = (svg: string): string[] => walk(parseXml(svg)).filter((n) => (n.attrs.class ?? "").includes("ky-fold-t")).map((n) => n.text);
    expect(texts(folded({ orientation: "portrait" }))).toEqual(["Top house", "Bottom house"]);
    expect(texts(folded({ orientation: "landscape" }))).toEqual(["Left house", "Right house"]);
    expect(texts(folded({ language: "ja" }))).toEqual(["上のハウス", "下のハウス"]);
    const svg = folded();
    for (const cls of ["ky-fold-link", "ky-fold-edge", "ky-fold-hl", "ky-fold-frame"]) expect(walk(parseXml(svg)).filter((n) => n.attrs.class === cls), cls).toHaveLength(2);
    // The rules of the fan are written in with the drawing, and only a folded sheet carries them.
    expect(svg).toContain(".ky-fold-link");
    expect(drawKyogijo({ sport: "curling" })).not.toContain("ky-fold");
  });

  it("says in its description what is enlarged and where, in both languages", () => {
    expect(describeDrawing({ sport: "curling", sheet: { show: "folded" } }).description).toContain("top house enlarged on the left and its bottom house enlarged on the right");
    expect(describeDrawing({ sport: "curling", orientation: "landscape", sheet: { show: "folded" } }).description).toContain("left house enlarged above it and its right house enlarged below it");
    expect(describeDrawing({ sport: "curling", sheet: { show: "folded", panels: "house" } }).description).toContain("Each enlarged part is the house.");
    expect(describeDrawing({ sport: "curling", sheet: { show: "folded" } }).description).toContain("hog line to the back line");
    expect(describeDrawing({ sport: "curling", language: "ja", sheet: { show: "folded" } }).description).toContain("折りたたみ表示です");
    expect(describeDrawing({ sport: "curling", sheet: { show: "folded" }, layers: [{ kind: "points", data: [] }] }).description).toContain("Data is drawn in the enlarged parts as well.");
  });

  it("is also `range: \"folded\"`, which wins over the sheet's own show", () => {
    const ranged = (more: Partial<SurfaceOptions> = {}): string => drawKyogijo({ sport: "curling", range: "folded", id: "f", ...more }).replace(' data-range="folded"', "");
    expect(ranged()).toBe(folded());
    expect(ranged({ sheet: { show: "house" } })).toBe(folded());
    expect(drawKyogijo({ sport: "curling", range: "folded", id: "f" })).toContain('data-range="folded"');
  });

  it("is well formed, with every id once, whatever it holds", () => {
    const layers = [{ kind: "heatmap", data: [{ x: 0, y: 0 }, { x: 1, y: 2 }, { x: -2, y: 3 }], legend: true }, { kind: "points", data: [{ x: 0, y: 1 }], style: { gradient: true } }, { kind: "lines", data: [{ from: [0, 0], to: [2, 3] }] }];
    for (const orientation of ["portrait", "landscape"] as const) {
      const svg = folded({ orientation, layers: layers as never, pebble: undefined } as never, { pebble: true, guardZone: true });
      const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
      expect(new Set(ids).size, orientation).toBe(ids.length);
      parseXml(svg);
    }
  });

  it("draws the data in the strip and again, larger, in each panel, with the copies hidden from a reader", () => {
    const svg = folded({ layers: [{ kind: "points", from: "curling", attacking: "left", units: "ft", data: stones.map((s) => ({ x: s.x, y: s.y })) }] });
    const root = parseXml(svg);
    const copies = walk(root).filter((n) => n.attrs.class === "ky-fold-data");
    expect(copies).toHaveLength(2);
    expect(copies.every((n) => n.attrs["aria-hidden"] === "true" && n.attrs.transform.startsWith("matrix(") && /^url\(#f-fold-(left|right)\)$/.test(n.attrs["clip-path"]))).toBe(true);
    // The strip's own layer is read out once, and the marks are in all three places.
    expect(walk(root).filter((n) => n.name === "title" && n.text.startsWith("4 ")).length).toBe(3);
    const marks = (n: ReturnType<typeof parseXml>): number => walk(n).filter((m) => m.name === "circle" || m.name === "path").length;
    expect(marks(copies[0])).toBe(marks(copies[1]));
    // A colour bar is drawn in each copy too, with ids of its own: one sized against the whole sheet falls outside a panel's part of it and is cut away there.
    const heat = folded({ layers: [{ kind: "heatmap", id: "h", data: [{ x: 0, y: 0 }] }, { kind: "legend", for: "h" }] as never });
    expect(heat.match(/data-kind="legend"/g)).toHaveLength(3);
    const legendIds = [...heat.matchAll(/<g id="([^"]*-lg|[^"]*-l1)"/g)].map((m) => m[1]);
    expect(new Set(legendIds).size).toBe(legendIds.length);
  });

  it("puts the stones of a chart in the strip and in the enlarged house at their end, and the key above the whole", () => {
    const chart = curlingStones(stones as never, { show: "folded", end: 4, id: "c", surface: { orientation: "landscape" } });
    expect(chart.options.sheet?.show ?? chart.options.sheet).toBeDefined();
    const svg = chart.draw();
    const root = parseXml(svg);
    expect(walk(root).filter((n) => n.attrs.class === "ky-fold-data")).toHaveLength(2);
    expect(svg).toContain("Left house");
    // The stones are the same drawn once more beside the strip.
    expect(chart.totals.points).toBe(2);
    // A tall drawing leaves the key out, as every chart's does.
    expect(chart.draw({ orientation: "portrait" })).not.toContain("key-marks");
    // The chart's own show is the default, and the surface's sheet wins over it.
    expect(curlingStones(stones as never, { show: "folded", surface: { sheet: { show: "house" } } }).draw()).not.toContain("ky-fold");
  });

  it("is read by every renderer as the whole drawing", () => {
    const options = { sport: "curling", id: "r", sheet: { show: "folded" }, layers: [{ kind: "points", from: "curling", data: [{ x: 1, y: 1 }] }] } as SurfaceOptions;
    const scene = sceneOf(options);
    expect(scene.items.length).toBeGreaterThan(sceneOf({ sport: "curling", id: "r" }).items.length);
    const features = sceneToGeoJSON(scene).features;
    expect(features.length).toBeGreaterThan(0);
  });

  it("shows a score the whole sheet, and leaves the annotations out", () => {
    const team = (name: string): ScoreOptions["home"] => ({ name, abbr: name.slice(0, 3).toUpperCase(), score: 4, color: "#1d4f91", ends: [1, 0, 3] });
    const game = { sport: "curling", home: team("Prairie"), away: team("Harbour"), status: "final", id: "g" } as ScoreOptions;
    expect(drawKyogijo({ ...game, sheet: { show: "folded" } })).toBe(drawKyogijo(game));
    expect(() => folded({ landmarks: true, axes: {}, direction: { home: "right" } } as never)).not.toThrow();
    expect(folded({ landmarks: true })).not.toContain("ky-an-t");
  });

  it("changes no other curling drawing", () => {
    for (const sheet of [undefined, { show: "sheet" as const }, { show: "half" as const }, { show: "house" as const, end: "right" as const }]) {
      const svg = drawKyogijo({ sport: "curling", id: "x", ...(sheet === undefined ? {} : { sheet }) });
      expect(svg).not.toContain("ky-fold");
    }
  });
});

describe("the ends of a sheet as a tall sheet reads them", () => {
  it("are `top` and `bottom`, the left end and the right, in the sheet and in a range", () => {
    expect(sheetFor({ sport: "curling", sheet: { show: "half", end: "top" } }).end).toBe("left");
    expect(sheetFor({ sport: "curling", sheet: { show: "half", end: "bottom" } }).end).toBe("right");
    expect(drawKyogijo({ sport: "curling", id: "e", sheet: { show: "house", end: "bottom" } })).toBe(drawKyogijo({ sport: "curling", id: "e", sheet: { show: "house", end: "right" } }));
    expect(drawKyogijo({ sport: "curling", id: "e", sheet: { show: "house", end: "top" } })).toBe(drawKyogijo({ sport: "curling", id: "e", sheet: { show: "house" } }));
    expect(drawKyogijo({ sport: "curling", id: "e", range: { name: "half", end: "bottom" } })).toBe(drawKyogijo({ sport: "curling", id: "e", range: { name: "half", end: "right" } }));
    expect(sheetFor({ sport: "curling", range: { name: "house", end: "bottom" } }).end).toBe("right");
  });

  it("are not other sports' ends", () => {
    expect(() => drawKyogijo({ sport: "nhl", range: { name: "half", end: "top" as never } })).toThrow(/"left" or "right"/);
  });
});
