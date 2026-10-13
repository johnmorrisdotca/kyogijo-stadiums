import { describe, expect, it } from "vitest";
import { SPORTS, drawKyogijo } from "./draw.ts";
import { framesOf, fromSurface, toSurface } from "./frames.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import { layoutOf, soccerSpec } from "./surfaces/soccer-spec.ts";
import type { ScoreOptions, Side, Sport, SurfaceOptions } from "./types.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

const tree = (options: SurfaceOptions | ScoreOptions): Node => parseXml(drawKyogijo({ id: "a", ...options }));
const WITH_ENDS = ["nfl", "cfl", "ifaf", "nhl", "nba", "soccer"] as const satisfies readonly Sport[];

/** A point as the eye sees it: through the group that turns the surface, when it does. */
function screen(root: Node, x: number, y: number): [number, number] {
  const turn = withClass(root, "ky-surface-group")[0].attrs.transform;
  if (turn === undefined) return [x, y];
  const m = /matrix\(([^)]*)\)/.exec(turn);
  const [a, b, c, d, e, f] = m![1].split(" ").map(Number);
  return [a * x + c * y + e, b * x + d * y + f];
}

/** Where an arrow starts and where its head's tip is, in the wide frame. */
function arrowOf(root: Node, who: "h" | "a"): { tail: [number, number]; tip: [number, number] } {
  const line = withClass(root, "ky-an-ar").find((n) => n.attrs.class.split(" ").includes(`ky-an-${who}`))!;
  const head = withClass(root, "ky-an-hd").find((n) => n.attrs.class.split(" ").includes(`ky-an-${who}`))!;
  const tail = /^M(-?[\d.]+) (-?[\d.]+)/.exec(line.attrs.d)!;
  const tip = /^M(-?[\d.]+) (-?[\d.]+)/.exec(head.attrs.d)!;
  return { tail: [Number(tail[1]), Number(tail[2])], tip: [Number(tip[1]), Number(tip[2])] };
}

describe("direction of play", () => {
  for (const sport of WITH_ENDS) {
    for (const orientation of ["landscape", "portrait"] as const) {
      for (const home of ["left", "right"] as Side[]) {
        it(`${sport}, ${orientation}: home attacking the ${home} end points at it as the eye sees the surface, and away's at the other`, () => {
          const away: Side = home === "left" ? "right" : "left";
          const root = tree({ sport, orientation, direction: { home, away } });
          for (const [who, side] of [["h", home], ["a", away]] as const) {
            const { tail, tip } = arrowOf(root, who);
            const [x0, y0] = screen(root, ...tail);
            const [x1, y1] = screen(root, ...tip);
            // Wide, the right end is on the right; tall, the surface is turned a quarter clockwise, so the left end is at the top and the right at the bottom.
            const along = orientation === "landscape" ? x1 - x0 : y1 - y0;
            expect(Math.sign(along), `${who} on ${side}`).toBe(side === "right" ? 1 : -1);
            expect(Math.abs(orientation === "landscape" ? y1 - y0 : x1 - x0)).toBeLessThan(0.01);
          }
        });
      }
    }
  }

  it("writes the words upright: a wide drawing turns none, a tall one turns each back a quarter", () => {
    for (const sport of SPORTS) {
      for (const orientation of ["landscape", "portrait"] as const) {
        const options: SurfaceOptions = { sport, orientation, landmarks: true, axes: {}, ...(WITH_ENDS.includes(sport as never) ? { direction: { home: "right" as const } } : {}) };
        const root = tree(options);
        const words = withClass(root, "ky-an-t");
        expect(words.length, `${sport} ${orientation}`).toBeGreaterThan(4);
        const turned = withClass(root, "ky-surface-group")[0].attrs.transform !== undefined;
        for (const word of words) {
          const rotation = /rotate\((-?\d+)/.exec(word.attrs.transform ?? "");
          expect((rotation === null ? 0 : Number(rotation[1])) + (turned ? 90 : 0), `${sport} ${orientation}: ${word.text}`).toBe(0);
        }
      }
    }
  });

  it("follows the sport's rule for the periods: hockey changes ends after each, football after the first and the third", () => {
    const sideOf = (options: Partial<SurfaceOptions>): number => {
      const root = tree({ sport: "nhl", direction: { home: "right" }, ...options });
      const { tail, tip } = arrowOf(root, "h");
      return Math.sign(tip[0] - tail[0]);
    };
    expect([1, 2, 3].map((period) => sideOf({ direction: { home: "right", period } }))).toEqual([1, -1, 1]);
    const nfl = (period: number): number => {
      const { tail, tip } = arrowOf(tree({ sport: "nfl", direction: { home: "right", period } }), "h");
      return Math.sign(tip[0] - tail[0]);
    };
    expect([1, 2, 3, 4].map(nfl)).toEqual([1, -1, -1, 1]);
    expect(() => drawKyogijo({ sport: "soccer", direction: { home: "right", period: 2 } })).toThrow(/period 2 of soccer/);
    const { tail, tip } = arrowOf(tree({ sport: "soccer", direction: { home: "right", period: 2, changedAfter: [1] } }), "h");
    expect(tip[0]).toBeLessThan(tail[0]);
  });

  it("says each arrow in the description, with the teams' names in a score drawing, and in Japanese", () => {
    const game = { away: { name: "Harbour City Gulls", score: 1, color: "#1f5fa8" }, home: { name: "Prairie Ridge Bison", score: 2, color: "#b5452c" } };
    const svg = drawKyogijo({ sport: "nhl", id: "a", ...game, direction: { home: "right", away: "left" } });
    expect(svg).toContain("Prairie Ridge Bison attacks the right end.");
    expect(svg).toContain("Harbour City Gulls attacks the left end.");
    expect(svg).toContain("Prairie Ridge Bison attacking");
    expect(svg).toContain("--ky-layer-home:#b5452c");
    expect(drawKyogijo({ sport: "nhl", id: "a", language: "ja", direction: { home: "right", period: 2 } })).toContain("第2ピリオド、ホームは左方向へ攻めます。");
    expect(drawKyogijo({ sport: "nhl", id: "a", direction: { home: "right", label: false } })).not.toContain("attacking<");
    expect(drawKyogijo({ sport: "nhl", id: "a", direction: { home: "right", label: "Goal this way" } })).toContain("Goal this way");
  });

  it("is an error for a surface with no ends to attack", () => {
    expect(() => drawKyogijo({ sport: "mlb", direction: { home: "left" } })).toThrow(/no ends to attack/);
    expect(() => drawKyogijo({ sport: "curling", direction: { home: "left" } })).toThrow(/no ends to attack/);
  });
});

describe("axes", () => {
  it("put a tick and a number at every round value of the surface's own numbers, in the rulebook's unit", () => {
    const nfl = tree({ sport: "nfl", axes: { ticks: 10 } });
    const words = withClass(nfl, "ky-an-t").map((n) => n.text);
    expect(words).toContain("0");
    expect(words).toContain("120");
    expect(words).toContain("50");
    expect(drawKyogijo({ sport: "nfl", id: "a", axes: {} })).toContain("Axes in the drawing's own numbers, in yd: x from 0 to 120, y from 0 to 53.33.");
    expect(drawKyogijo({ sport: "nhl", id: "a", axes: {}, units: "m" })).toContain("in m: x from 0 to 60.96");
    expect(withClass(tree({ sport: "nhl", axes: { labels: false } }), "ky-an-t")).toHaveLength(0);
    expect(withClass(tree({ sport: "nhl", axes: { labels: { x: "feet along", y: "feet across" } } }), "ky-an-t").map((n) => n.text)).toEqual(expect.arrayContaining(["feet along", "feet across"]));
  });

  it("take explicit ticks and a step for each axis", () => {
    const words = (axes: NonNullable<SurfaceOptions["axes"]>): string[] => withClass(tree({ sport: "nhl", axes }), "ky-an-t").map((n) => n.text);
    expect(words({ ticks: { x: [0, 100, 200], y: [0] } })).toEqual(["0", "100", "200", "0"]);
    expect(words({ ticks: { x: [0, 100, 200], y: 50 } })).toEqual(["0", "100", "200", "0", "50"]);
  });

  it("put the ticks of a provider's frame where the frame puts them, whichever way its axes run", () => {
    // The NHL API's x runs along the rink from the middle: its 0 is the centre line, and -100 and 100 are the boards.
    const root = tree({ sport: "nhl", axes: { frame: "nhl-api", ticks: { x: [-100, 0, 100], y: [0] } } });
    const group = withClass(root, "ky-an-axes")[0];
    const path = walk(group).find((n) => n.name === "path")!;
    expect(path.attrs.d).toContain("M0 ");
    expect(path.attrs.d).toContain("M100 ");
    expect(path.attrs.d).toContain("M200 ");
    expect(drawKyogijo({ sport: "nhl", id: "a", axes: { frame: "nhl-api" } })).toContain("Axes in the nhl-api frame, in ft:");
    // The NBA stats frame's x runs across the court: its ticks are on the left edge.
    const nba = tree({ sport: "nba", axes: { frame: "nba-stats", ticks: { x: [0], y: [0] } } });
    expect(withClass(nba, "ky-an-axes")).toHaveLength(1);
  });

  it("draws the axes of every frame of every sport that has them, and refuses a frame of another sport", () => {
    for (const sport of SPORTS) {
      for (const frame of framesOf(sport)) {
        const options: SurfaceOptions = frame.sport === "soccer" ? { sport: "soccer", pitchType: frame.name as never, axes: { frame: frame.name } } : { sport, axes: { frame: frame.name } };
        const root = tree(options);
        expect(withClass(root, "ky-an-t").length, `${sport} ${frame.name}`).toBeGreaterThan(3);
      }
    }
    expect(() => drawKyogijo({ sport: "nba", axes: { frame: "nhl-api" } })).toThrow(/is for nhl, not nba/);
    expect(() => drawKyogijo({ sport: "nba", axes: { frame: "nothing" } })).toThrow(/Unknown frame/);
  });
});

describe("landmarks", () => {
  it("label the parts of every surface in English and in Japanese, each with a leader to its place on the surface", () => {
    for (const sport of SPORTS) {
      for (const language of ["en", "ja"] as const) {
        const root = tree({ sport, landmarks: true, language });
        const words = withClass(root, "ky-an-t").map((n) => n.text);
        expect(words.length, `${sport} ${language}`).toBeGreaterThanOrEqual(6);
        const names = KYOGIJO_STRINGS[language].notes.names;
        for (const word of words) expect(Object.values(names), `${sport}: ${word}`).toContain(word);
        const dots = withClass(root, "ky-an-d")[0].children;
        expect(dots).toHaveLength(words.length);
      }
    }
  });

  it("make the margin wide enough for the words, and leave a margin the options fix", () => {
    const view = (svg: string): number[] => /viewBox="([^"]*)"/.exec(svg)![1].split(" ").map(Number);
    for (const sport of SPORTS) {
      const bare = view(drawKyogijo({ sport, id: "a" }));
      const marked = view(drawKyogijo({ sport, id: "a", landmarks: true }));
      expect(marked[2] * marked[3], sport).toBeGreaterThanOrEqual(bare[2] * bare[3]);
      expect(view(drawKyogijo({ sport, id: "a", landmarks: true, margin: 3 })), sport).toEqual(view(drawKyogijo({ sport, id: "a", margin: 3 })));
    }
  });

  it("leave out a part the drawing does not show: half a pitch has one goal", () => {
    const names = (options: SurfaceOptions): string[] => withClass(tree(options), "ky-an-t").map((n) => n.text);
    expect(names({ sport: "soccer", landmarks: true }).filter((n) => n === "Goal")).toHaveLength(1);
    expect(names({ sport: "soccer", landmarks: true, half: "right", goals: "box" })).not.toContain("Goal");
    expect(names({ sport: "soccer", landmarks: true, goals: "none" })).not.toContain("Goal");
  });

  it("list the parts in the description", () => {
    expect(drawKyogijo({ sport: "nhl", id: "a", landmarks: true })).toContain("Labelled parts: Boards, Goal line, Blue line");
    expect(drawKyogijo({ sport: "nhl", id: "a", landmarks: true, language: "ja" })).toContain("名称を表示している部分：ボード、ゴールライン、ブルーライン");
  });
});

describe("turning and mirroring a surface", () => {
  // ggsoccer warns that a pitch drawn with y reversed puts the penalty arcs inside the box. The labels are placed in the wide frame and the surface is
  // turned with its group, so a turned drawing must put every anchor where the wide one does, seen through the turn.
  it("keeps the penalty arc outside the penalty area, on every pitch, turned and not, drawn from either end", () => {
    const spec = soccerSpec(undefined);
    const arcX = layoutOf(spec).spot + spec.arcRadius;
    for (const orientation of ["landscape", "portrait"] as const) {
      const root = tree({ sport: "soccer", orientation, landmarks: true });
      const anchors = withClass(root, "ky-an-d")[0].children.map((c) => [Number(c.attrs.cx), Number(c.attrs.cy)] as const);
      const wanted = arcX * FEET_PER_METRE;
      const arc = anchors.find(([x, y]) => Math.abs(x - wanted) < 0.1 && Math.abs(y - (spec.width / 2) * FEET_PER_METRE) < 0.1);
      expect(arc, `the penalty arc's apex, ${orientation}`).toBeDefined();
      const [sx, sy] = screen(root, arc![0], arc![1]);
      const along = orientation === "landscape" ? sx : sy;
      const origin = screen(root, 0, 0);
      const goalLine = orientation === "landscape" ? origin[0] : origin[1];
      // Its distance from the goal line along the pitch is the arc's, which is more than the box's 16.5 metres.
      expect(Math.abs(along - goalLine)).toBeCloseTo(wanted, 1);
      expect(Math.abs(along - goalLine)).toBeGreaterThan(16.5 * FEET_PER_METRE);
    }
  });

  it("puts the penalty arc beyond the box in every provider's numbers, for both ends", () => {
    const spec = soccerSpec(undefined);
    const L = spec.length * FEET_PER_METRE;
    const cy = (spec.width / 2) * FEET_PER_METRE;
    const box = 16.5 * FEET_PER_METRE;
    const apex = (layoutOf(spec).spot + spec.arcRadius) * FEET_PER_METRE;
    for (const frame of framesOf("soccer")) {
      const size = frame.size === "variable" ? { length: L, width: spec.width * FEET_PER_METRE, unit: "ft" as const } : undefined;
      for (const [goalX, sign] of [[0, 1], [L, -1]] as const) {
        const [goal] = fromSurface([[goalX, cy]], { to: frame, size });
        const [edge] = fromSurface([[goalX + sign * box, cy]], { to: frame, size });
        const [arc] = fromSurface([[goalX + sign * apex, cy]], { to: frame, size });
        // In the frame's own numbers the arc is farther from the goal than the box's edge, along the axis the pitch's length runs on.
        const axis = Math.abs(edge[0] - goal[0]) >= Math.abs(edge[1] - goal[1]) ? 0 : 1;
        expect(Math.abs(arc[axis] - goal[axis]), `${frame.name} at ${goalX}`).toBeGreaterThan(Math.abs(edge[axis] - goal[axis]));
        expect(Math.sign(arc[axis] - goal[axis]), frame.name).toBe(Math.sign(edge[axis] - goal[axis]));
        const back = toSurface([arc], { from: frame, size })[0];
        expect(back[0]).toBeCloseTo(goalX + sign * apex, 3);
      }
    }
  });

  it("keeps every label's anchor on the surface, for every surface, turned and not", () => {
    for (const sport of SPORTS) {
      for (const orientation of ["landscape", "portrait"] as const) {
        const root = tree({ sport, orientation, landmarks: true });
        const [vx, vy, vw, vh] = (root.attrs.viewBox ?? "").split(" ").map(Number);
        for (const dot of withClass(root, "ky-an-d")[0].children) {
          const [sx, sy] = screen(root, Number(dot.attrs.cx), Number(dot.attrs.cy));
          expect(sx, `${sport} ${orientation}`).toBeGreaterThanOrEqual(vx - 0.01);
          expect(sx).toBeLessThanOrEqual(vx + vw + 0.01);
          expect(sy).toBeGreaterThanOrEqual(vy - 0.01);
          expect(sy).toBeLessThanOrEqual(vy + vh + 0.01);
        }
      }
    }
  });
});
