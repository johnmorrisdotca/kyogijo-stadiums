import { describe, expect, it } from "vitest";
import { drawKyogijo } from "./draw.ts";

import { FRAMES } from "./frames.ts";
import { clientPointToField, clientPointToFrames, fieldPointToClient } from "./pointer-entry.ts";
import { pageOf } from "./pointer.fixture.ts";
import type { Sport, SurfaceOptions } from "./types.ts";

/** A drawing that says where its surface is, as `clientPointToField` asks. */
const field = (o: SurfaceOptions | Record<string, unknown>): string => drawKyogijo({ ...o, pointer: true } as SurfaceOptions);

const near = (actual: readonly number[], expected: readonly number[], digits = 5): void => {
  expect(actual).toHaveLength(expected.length);
  expected.forEach((value, i) => expect(actual[i]).toBeCloseTo(value, digits));
};

const frames = Object.values(FRAMES);
const sports = [...new Set(frames.map((f) => f.sport))] as Sport[];

/** A point well inside each frame's range, and one near each corner of it. */
const samples = (f: (typeof frames)[number]): [number, number][] => {
  const [x0, x1] = f.x;
  const [y0, y1] = f.y;
  const at = (u: number, v: number): [number, number] => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * v];
  return [at(0.5, 0.5), at(0.1, 0.2), at(0.9, 0.3), at(0.25, 0.9), at(0.8, 0.8)];
};

const boxes = [
  { left: 0, top: 0, width: 800, height: 400 },
  { left: 120, top: 60, width: 300, height: 900 },
  { left: -40, top: 15, width: 640, height: 640 },
];

describe("a click on a drawing, in every frame the package has", () => {
  it("covers every frame there is", () => {
    expect(frames.length).toBeGreaterThanOrEqual(42);
    expect(sports.length).toBeGreaterThan(20);
  });

  for (const sport of sports) {
    for (const orientation of ["landscape", "portrait"] as const) {
      it(`${sport}, ${orientation}: a place goes to the page and back in each of its frames`, () => {
        const svg = field({ sport, orientation } as SurfaceOptions);
        for (const box of boxes) {
          const page = pageOf(svg, box);
          for (const frame of frames.filter((f) => f.sport === sport)) {
            for (const p of samples(frame)) {
              const client = fieldPointToClient(page, p, { provider: frame.name });
              expect(client, frame.name).not.toBeNull();
              const back = clientPointToField(page, client!.x, client!.y, { provider: frame.name });
              expect(back, frame.name).not.toBeNull();
              near([back!.x, back!.y], p, 4);
              expect(back!.provider).toBe(frame.name);
            }
          }
        }
      });
    }
  }
});

describe("what a click is on the surface", () => {
  it("is centre ice at the middle of a rink, wide or tall", () => {
    for (const orientation of ["landscape", "portrait"] as const) {
      const page = pageOf(field({ sport: "nhl", orientation }), { left: 10, top: 20, width: 700, height: 700 });
      const centre = fieldPointToClient(page, [0, 0], { provider: "nhl-api" })!;
      const at = clientPointToField(page, centre.x, centre.y, { provider: "nhl-api" })!;
      near([at.x, at.y], [0, 0]);
      near([at.surface.x, at.surface.y], [100, 42.5]);
      expect(at.inBounds).toBe(true);
      expect(at.zone).toBe("neutral-zone");
    }
  });

  it("turns a tall drawing's quarter: the right end zone is at the bottom (or the top) of the page, and the same place either way", () => {
    const wide = pageOf(field({ sport: "nhl", orientation: "landscape" }), { left: 0, top: 0, width: 600, height: 300 });
    const tall = pageOf(field({ sport: "nhl", orientation: "portrait" }), { left: 0, top: 0, width: 300, height: 600 });
    const a = fieldPointToClient(wide, [69, 22], { provider: "nhl-api" })!;
    const b = fieldPointToClient(tall, [69, 22], { provider: "nhl-api" })!;
    // On the wide page the dot is right of the middle; on the tall page it is not right of it, but above or below.
    expect(a.x).toBeGreaterThan(300);
    expect(Math.abs(b.x - 150)).toBeLessThan(150);
    expect(b.y).not.toBeCloseTo(300, 0);
    for (const [page, c] of [[wide, a], [tall, b]] as const) near([clientPointToField(page, c.x, c.y)!.surface.x, clientPointToField(page, c.x, c.y)!.surface.y], [169, 20.5], 3);
  });

  it("is off the surface on the apron and in the stands", () => {
    const page = pageOf(field({ sport: "nhl" }), { left: 0, top: 0, width: 800, height: 400 });
    const corner = clientPointToField(page, 2, 2)!;
    expect(corner.inBounds).toBe(false);
    expect(corner.zone).toBeUndefined();
    expect(corner.zones).toEqual([]);
  });

  it("follows a range: the numbers stay the whole surface's, whatever part is shown", () => {
    const whole = field({ sport: "nhl" });
    const cropped = field({ sport: "nhl", range: "offensive-zone" });
    expect(cropped).not.toBe(whole);
    const page = pageOf(cropped, { left: 0, top: 0, width: 500, height: 500 });
    const spot = fieldPointToClient(page, [69, 22], { provider: "nhl-api" })!;
    expect(spot.x).toBeGreaterThan(0);
    expect(spot.x).toBeLessThan(500);
    expect(spot.y).toBeGreaterThan(0);
    expect(spot.y).toBeLessThan(500);
    const back = clientPointToField(page, spot.x, spot.y, { provider: "nhl-api" })!;
    near([back.x, back.y], [69, 22]);
    expect(back.zone).toBe("offensive-zone");
    expect(back.zones).toContain("faceoff-circle");
  });

  it("follows the viewBox's padding (margin) and a cropped, scrolled page", () => {
    const a = pageOf(field({ sport: "nba", margin: 30 }), { left: 0, top: 0, width: 500, height: 300 });
    const b = pageOf(field({ sport: "nba", margin: 0 }), { left: 0, top: 0, width: 500, height: 300 });
    const pa = fieldPointToClient(a, [0, 0], { provider: "nba-stats" })!;
    const pb = fieldPointToClient(b, [0, 0], { provider: "nba-stats" })!;
    expect(pa.x).not.toBeCloseTo(pb.x, 0);
    for (const [page, p] of [[a, pa], [b, pb]] as const) near([clientPointToField(page, p.x, p.y, { provider: "nba-stats" })!.x, clientPointToField(page, p.x, p.y, { provider: "nba-stats" })!.y], [0, 0], 4);
  });

  it("turns a team's numbers when it attacks the left", () => {
    const page = pageOf(field({ sport: "nhl" }));
    const right = fieldPointToClient(page, [69, 22], { provider: "nhl-api" })!;
    // The numbers of a team that attacks the left: x = 69 is its own end, and x = -69 the one it attacks; both are turned so that the team attacks the right.
    const left = fieldPointToClient(page, [69, 22], { provider: "nhl-api", attacking: "left" })!;
    expect(left.x).toBeLessThan(right.x);
    const back = clientPointToField(page, left.x, left.y, { provider: "nhl-api", attacking: "left" })!;
    near([back.x, back.y], [69, 22]);
    expect(back.zone).toBe("defensive-zone");
    const theirs = fieldPointToClient(page, [-69, 22], { provider: "nhl-api", attacking: "left" })!;
    expect(clientPointToField(page, theirs.x, theirs.y)!.zone).toBe("offensive-zone");
  });

  it("answers in the surface's own numbers, in any unit", () => {
    const page = pageOf(field({ sport: "soccer" }));
    const middle = fieldPointToClient(page, [52.5, 34], { units: "m" })!;
    const at = clientPointToField(page, middle.x, middle.y, { units: "m" })!;
    near([at.x, at.y], [52.5, 34], 3);
    expect(at.provider).toBe("surface");
    expect(at.zone).toBe("middle-third");
  });

  it("names a zone in Japanese when asked", () => {
    const page = pageOf(field({ sport: "nhl" }));
    const c = fieldPointToClient(page, [0, 0], { provider: "nhl-api" })!;
    expect(clientPointToField(page, c.x, c.y, { language: "ja" })!.names["neutral-zone"]).toBe("ニュートラルゾーン");
  });

  it("gives every provider's numbers for one click, and the zone", () => {
    const page = pageOf(field({ sport: "soccer" }));
    const c = fieldPointToClient(page, [83, 50], { provider: "opta" })!;
    const all = clientPointToFrames(page, c.x, c.y)!;
    const byName = Object.fromEntries(all.points.map((p) => [p.provider, p]));
    near([byName.opta.x, byName.opta.y], [83, 50], 3);
    // Opta's penalty line (83, 50) is StatsBomb's (102, 40).
    near([byName.statsbomb.x, byName.statsbomb.y], [102, 40], 3);
    expect(all.points.length).toBe(frames.filter((f) => f.sport === "soccer").length);
    expect(all.zone).toBeDefined();
  });

  it("is null where there is nothing to ask, and refuses a frame of another sport", () => {
    expect(clientPointToField(pageOf(field({ sport: "nhl", away: { name: "A", score: 1 }, home: { name: "B", score: 2 }, size: "badge" } as never)), 5, 5)).toBeNull();
    const page = pageOf(field({ sport: "nhl" }));
    page.hidden = true;
    expect(clientPointToField(page, 5, 5)).toBeNull();
    expect(fieldPointToClient(page, [0, 0])).toBeNull();
    page.hidden = false;
    expect(() => clientPointToField(page, 5, 5, { provider: "opta" })).toThrow(/for soccer/);
    expect(() => clientPointToField(page, Number.NaN, 5)).toThrow(/numbers/);
    expect(() => fieldPointToClient(page, [Number.NaN, 0])).toThrow(/finite/);
    const inTurn = { ...page, closest: () => ({}) };
    expect(clientPointToField(inTurn as never, 5, 5)).toBeNull();
    expect(clientPointToField({ getAttribute: () => null, querySelector: () => null } as never, 5, 5)).toBeNull();
  });

  it("holds for a ballpark in its own park, a league's rink and a pitch of a size", () => {
    for (const options of [{ sport: "mlb", park: "fenway-park" }, { sport: "nhl", league: "iihf" }, { sport: "soccer", pitch: { length: 100, width: 64, unit: "m" } }] as SurfaceOptions[]) {
      const page = pageOf(field(options));
      const frame = frames.find((f) => f.sport === options.sport)!;
      const p = samples(frame)[1];
      const c = fieldPointToClient(page, p, { provider: frame.name })!;
      const back = clientPointToField(page, c.x, c.y, { provider: frame.name })!;
      near([back.x, back.y], p, 4);
    }
  });
});
