import { describe, expect, it } from "vitest";
import { SPORTS, drawKyogijo } from "./draw.ts";
import { LOOK_NAMES } from "./look.ts";
import type { ScoreOptions, Sport, SurfaceOptions } from "./types.ts";
import { parseXml, withClass, type Node } from "./xml.fixture.ts";

/**
 * Document order is paint order in SVG. Whatever a drawing lays over its surface (a team's round mark and name, the data layers, a lineup, a situation's
 * widgets, the annotations, a pageant's words, the score's panel) must come after every marking of the surface itself: no faceoff circle, red line, crease,
 * court line, yard line or base line may be painted over a logo, a name or the score. The check reads the order of the drawing's leaves.
 */

/** The groups that are laid over the surface. */
const OVERLAY = new Set(["ky-banner", "ky-layers", "ky-an", "ky-pg", "ky-pg-words", "ky-pg-emblem", "ky-plate", "ky-fold-data"]);
/** A situation's tints (the attacking zone, the red zone) lie under the lines; everything else of it (a drive's arrows, a lit base, the widgets) lies over them. */
const isOverlay = (c: string): boolean => OVERLAY.has(c) || (c.startsWith("ky-sit-") && !c.startsWith("ky-sit-zone") && c !== "ky-sit-red");
/** What is not a drawn thing: definitions, titles and the clip shapes they hold. */
const NOT_DRAWN = new Set(["defs", "clipPath", "mask", "pattern", "linearGradient", "radialGradient", "symbol", "title", "desc", "style", "filter"]);
const LEAVES = new Set(["path", "rect", "circle", "ellipse", "line", "polygon", "polyline", "text", "image", "use"]);

const classesOf = (n: Node): string[] => (n.attrs.class ?? "").split(/\s+/);

interface Leaf {
  node: Node;
  overlay: boolean;
  carpet: boolean;
}

/** The leaves of the surface group in document order, each marked as overlay or not. */
export function leavesOf(svg: string): Leaf[] {
  const group = withClass(parseXml(svg), "ky-surface-group")[0];
  const out: Leaf[] = [];
  const visit = (n: Node, overlay: boolean, carpet: boolean): void => {
    if (NOT_DRAWN.has(n.name)) return;
    const cls = classesOf(n);
    const over = overlay || cls.some(isOverlay);
    // A pageant's carpets are the one thing laid over the surface that the `lines` option puts under the lines or over them.
    const rug = carpet || cls.includes("ky-pageant");
    if (LEAVES.has(n.name)) out.push({ node: n, overlay: over, carpet: rug });
    for (const child of n.children) visit(child, over, rug);
  };
  visit(group, false, false);
  return out;
}

/** The markings among these leaves that come after the first overlay leaf. */
export function after(leaves: Leaf[]): string[] {
  const first = leaves.findIndex((l) => l.overlay && !l.carpet);
  if (first < 0) return [];
  return leaves.slice(first + 1).filter((l) => !l.overlay && !l.carpet).map((l) => `${l.node.name}.${l.node.attrs.class ?? ""}`);
}

/** The markings of a drawing that come after the first overlay leaf: none, when the order is right. */
export const paintedOver = (svg: string): string[] => after(leavesOf(svg));

const away = { name: "Carolina", abbr: "CAR", score: 1, color: "#b5121b", logo: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Ccircle cx='5' cy='5' r='4'/%3E%3C/svg%3E" };
const home = { name: "Vegas", abbr: "VGK", score: 2, color: "#b4975a" };
const game = { away, home, status: "final" } as const;

const reasons = (sport: Sport, o: SurfaceOptions): string => `${sport} ${JSON.stringify({ ...o, away: undefined, home: undefined, layers: undefined })}`;

describe("what is laid over a surface comes after its markings", () => {
  it("holds for every sport, in a score and bare, wide and tall, with the score's panel and without", () => {
    for (const sport of SPORTS) {
      const variants: ScoreOptions[] = [
        { sport, ...game },
        { sport, ...game, size: "full", score: "centre", markShape: "round" },
        { sport, ...game, orientation: "portrait" },
        { sport, ...game, plate: false },
        { sport, ...game, size: "compact" },
      ];
      for (const o of variants) expect(paintedOver(drawKyogijo(o)), reasons(sport, o)).toEqual([]);
    }
  });

  it("holds in every look", () => {
    for (const sport of SPORTS) for (const look of LOOK_NAMES) {
      const o: ScoreOptions = { sport, ...game, look, markShape: "round" };
      expect(paintedOver(drawKyogijo(o)), reasons(sport, o)).toEqual([]);
    }
  });

  it("has overlay in the drawings it is checked on: a hockey game's marks and names are overlay, and so is its score", () => {
    const leaves = leavesOf(drawKyogijo({ sport: "nhl", ...game, markShape: "round" }));
    expect(leaves.filter((l) => l.overlay).length).toBeGreaterThan(4);
    expect(leaves.some((l) => l.node.name === "image" && l.overlay)).toBe(true);
    expect(leaves.some((l) => l.node.name === "text" && l.overlay)).toBe(true);
    expect(leaves.filter((l) => !l.overlay).length).toBeGreaterThan(20);
  });

  it("holds with data layers, a lineup, a situation, landmarks and a crowd", () => {
    const layers = [{ kind: "points" as const, data: [{ x: 10, y: 5 }] }, { kind: "text" as const, data: [{ x: 12, y: 8, text: 7 }] }];
    const lineup = [{ kind: "lineup" as const, side: "home" as const, players: [{ pos: "GK", number: 1 }] }];
    const cases: ScoreOptions[] = [
      ...SPORTS.map((sport): ScoreOptions => ({ sport, ...game, layers })),
      ...SPORTS.map((sport): ScoreOptions => ({ sport, ...game, landmarks: true })),
      { sport: "soccer", ...game, layers: lineup },
      { sport: "nhl", ...game, situation: { awaySkaters: 4, homeSkaters: 5 } },
      { sport: "nfl", ...game, situation: { ballOn: 88, down: 3, toGo: 7, possession: "away", drive: [{ from: 25, to: 48, result: "punt" }] } },
      { sport: "mlb", ...game, situation: { bases: [true, false, true], outs: 1, inning: 7, half: "top" } },
      { sport: "nhl", ...game, crowd: true },
      { sport: "nba", ...game, crowd: true },
      { sport: "soccer", ...game, crowd: true },
      { sport: "mlb", ...game, park: "wrigley-field", crowd: true },
      { sport: "nhl", ...game, host: { park: "wrigley-field" } },
    ];
    for (const o of cases) expect(paintedOver(drawKyogijo(o)), reasons(o.sport, o)).toEqual([]);
    // The cases do draw what they name.
    expect(leavesOf(drawKyogijo(cases.find((o) => o.sport === "nfl" && o.situation !== undefined) as ScoreOptions)).some((l) => (l.node.attrs.class ?? "").includes("ky-sit-los") && l.overlay)).toBe(true);
    expect(leavesOf(drawKyogijo(cases.find((o) => o.sport === "mlb" && o.situation !== undefined) as ScoreOptions)).some((l) => (l.node.attrs.class ?? "").includes("ky-sit-lit") && l.overlay)).toBe(true);
  });

  it("holds on a pageant: the pictures lie where `lines` puts them, and the names, the emblem and the score are over everything", () => {
    for (const sport of ["nhl", "nba", "nfl", "mlb", "soccer"] as const) {
      for (const pageant of ["carpet" as const, "stage" as const, { style: "carpet" as const, lines: "under" as const }, { style: "carpet" as const, lines: "through" as const }]) {
        const o: ScoreOptions = { sport, ...game, size: "full", pageant };
        expect(paintedOver(drawKyogijo(o)), reasons(sport, o)).toEqual([]);
      }
    }
  });

  it("finds a marking painted over a mark: the check does fail on the order it guards against", () => {
    const leaves = leavesOf(drawKyogijo({ sport: "nhl", ...game, markShape: "round" }));
    expect(after(leaves)).toEqual([]);
    // The marks and the names first, the markings after them: the order of version 0.10.1, where the lines ran across the marks.
    const wrong = [...leaves.filter((l) => l.overlay), ...leaves.filter((l) => !l.overlay)];
    expect(after(wrong).length).toBeGreaterThan(20);
    expect(after(wrong)).toContain("path.ky-red");
    expect(after(wrong)).toContain("circle.ky-red-fill");
  });
});
