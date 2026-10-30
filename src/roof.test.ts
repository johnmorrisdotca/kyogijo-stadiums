import { describe, expect, it } from "vitest";
import { STADIUMS, STADIUM_IDS, stadiumConfigs, stadiumKind } from "./stadiums.ts";
import { VENUE_IDS } from "./venues.ts";
import { CUTAWAY, fadeOf, type Plane } from "./turn.kit.ts";
import { buildTurn } from "./turn-entry.ts";

const roofPlane = (extra: Partial<Plane> = {}): Plane => ({ id: "roof-0", kind: "roof", o: [0, 0, 20], u: [10, 0, 0], v: [0, 10, 0], svg: "", cut: true, ...extra });

describe("a roof is cut away from above and whole from the street (Plane.cut)", () => {
  it("is cut away to its own least from straight above, whole at the main camera's tilt, and whole again at the lowest eye the view allows", () => {
    const roof = roofPlane({ fadeTo: 0.1 });
    expect(fadeOf(roof, 0, 0)).toBeCloseTo(0.1, 3);
    expect(fadeOf(roof, 0, CUTAWAY.low)).toBeCloseTo(0.1, 3);
    expect(fadeOf(roof, 0, CUTAWAY.high)).toBe(1);
    expect(fadeOf(roof, 0, 62)).toBe(1);
    expect(fadeOf(roof, 0, 84)).toBe(1);
    // It is a smooth way from one to the other, never a step.
    let last = fadeOf(roof, 0, 0);
    for (let pitch = 1; pitch <= CUTAWAY.high; pitch += 1) {
      const now = fadeOf(roof, 0, pitch);
      expect(now).toBeGreaterThanOrEqual(last);
      expect(now - last).toBeLessThan(0.1);
      last = now;
    }
  });

  it("gives way by its side as a wall does between, and is whole from the street whatever its side", () => {
    const roof = roofPlane({ shy: [0, 1], fadeTo: 0.05 });
    // The eye is on the roof's side (yaw 0 looks from +y): cut at a low-ish pitch; far side whole.
    expect(fadeOf(roof, 0, 66)).toBeLessThan(1);
    expect(fadeOf(roof, 180, 66)).toBe(1);
    expect(fadeOf(roof, 0, 84)).toBe(1);
    expect(fadeOf(roof, 0, CUTAWAY.streetFrom)).toBeLessThanOrEqual(fadeOf(roof, 0, 80));
  });

  it("is a roof only: a plane that is not marked is what it was", () => {
    const wall: Plane = { ...roofPlane(), kind: "wall", cut: undefined };
    expect(fadeOf(wall, 0, 0)).toBe(1);
  });
});

/** Every real venue the package draws, with the options that draw it. */
const venues: { id: string; open?: boolean; options: Record<string, unknown> }[] = [
  ...VENUE_IDS.map((id) => ({ id, options: { sport: "nhl", arena: id, crowd: { real: true } } })),
  ...STADIUM_IDS.flatMap((id) => stadiumConfigs(STADIUMS[id]).map((config) => ({ id: `${id}:${config}`, open: STADIUMS[id].roof.kind === "open", options: { sport: config, ...(stadiumKind(STADIUMS[id]) === "park" ? { park: id } : { stadium: id }), crowd: { real: true } } }))),
];

describe("every real venue draws with its roof on and off, at every detail", () => {
  for (const detail of ["low", "auto", "high"] as const) {
    it(`at ${detail} detail: a roof of numbers that are numbers, every plane of it cut away from above; none when it is off, the walls standing`, () => {
      for (const { id, open, options } of venues) {
        const on = buildTurn(options as never, { venue: { roof: true, walls: true, detail } });
        const off = buildTurn(options as never, { venue: { roof: false, walls: true, detail } });
        const roofs = on.planes.filter((p) => p.kind === "roof");
        // A ballpark or stadium open to the air has no roof to show (Koshien's, Yankee Stadium's); every other has one.
        if (open) expect(roofs.length, id).toBe(0);
        else expect(roofs.length, id).toBeGreaterThan(0);
        for (const p of roofs) {
          expect(p.cut, `${id} ${p.id}`).toBe(true);
          for (const v of [...p.o, ...p.u, ...p.v]) expect(Number.isFinite(v), `${id} ${p.id}`).toBe(true);
        }
        expect(off.planes.filter((p) => p.kind === "roof"), id).toHaveLength(0);
        // The walls (or the stands) stand either way.
        expect(off.planes.length, id).toBeGreaterThan(50);
        expect(on.planes.length, id).toBeGreaterThan(off.planes.length - 1);
      }
    });
  }
});
