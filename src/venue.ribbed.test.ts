// The Olympic Stadium's ribbed shell: its ribs, its glazed bays and its roof, at every cut, over the stands and under the crown the article gives.
import { describe, expect, it } from "vitest";
import { resolveCrowd } from "./crowd.ts";
import { MLB_DIAMOND } from "./leagues/baseball.ts";
import { fenceFor, parkById } from "./parks.ts";
import { fenceOutline } from "./surfaces/baseball.ts";
import { planPark, stadiumById } from "./stadiums.ts";
import { buildTurn } from "./turn-entry.ts";
import { ribShare, ribbedSurfaceAt, spaced } from "./venue.ribbed.ts";
import { firstHit } from "./venue.real.ts";

const FEET = 3.28084;
const olympic = stadiumById("olympic-stadium-montreal")!;
const parkInput = () => ({ fence: fenceOutline(fenceFor(parkById("olympic-stadium-montreal"), undefined)), backstop: MLB_DIAMOND.backstop, crowd: { ...resolveCrowd({ real: true })!, awayEnd: "none" as const }, seatsOnWalls: [] });
const itemsAt = (detail: "low" | "auto" | "high") => buildTurn({ sport: "mlb", park: "olympic-stadium-montreal", crowd: { real: true } } as never, { venue: { roof: true, detail } }).uprights.items;
const count = (detail: "low" | "auto" | "high", prefix: string, kind: string): number => itemsAt(detail).filter((i) => i.kind === kind).flatMap((i) => i.planes).filter((p) => p.id.startsWith(prefix)).length;

describe("the Olympic Stadium's shell", () => {
  it("is 38 ribs at the finest cut and half of them at the coarsest, with a glazed bay between each pair", () => {
    // Two sides and an outer face to a rib; a bay is one plane, its podium and its glass.
    expect(count("high", "rib-", "walls")).toBe(38 * 3);
    expect(count("high", "bay-", "walls")).toBe(38);
    expect(count("low", "rib-", "walls")).toBe(19 * 3);
    expect(count("low", "bay-", "walls")).toBe(19);
    expect(olympic.roof.ribs).toMatchObject({ count: 38, anchored: 34 });
  });

  it("has no tall plain wall: the walls stand on the outline up to the glazing's top and the ribs sweep in to the ring, which is the shell's whole height", () => {
    const walls = itemsAt("high").find((i) => i.kind === "walls" && i.id === "shell")!;
    expect(walls.planes.some((p) => p.id.startsWith("shell-"))).toBe(false);
    const glass = walls.planes.filter((p) => p.id.startsWith("bay-"));
    const [low, high] = [Math.min(...glass.map((p) => p.o[2])), Math.max(...glass.map((p) => p.o[2] + p.u[2]))];
    const real = planPark(olympic, parkInput()).stands.real!;
    // The glazed stack is under half the ring's height; the roof panels climb the rest of the way.
    expect(high - low).toBeLessThan(0.5 * real.dome!.low);
    const ribs = walls.planes.filter((p) => /^rib-\d+-l$/.test(p.id));
    expect(Math.max(...ribs.map((p) => -p.v[2] + p.o[2] + p.v[2]))).toBeCloseTo(real.dome!.low * 1.05, 0);
  });

  it("is a broad low dome: the crown is the 52 metres over the field the article gives, and nothing in the shell stands higher", () => {
    const roof = itemsAt("high").find((i) => i.kind === "roof")!;
    const top = (p: { o: readonly number[]; u: readonly number[]; v: readonly number[] }): number => Math.max(p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2], p.o[2] + p.u[2] + p.v[2]);
    const crown = roof.planes.find((p) => p.id === "roof-crown")!;
    expect(crown.o[2]).toBeCloseTo(52 * FEET, 0);
    const shell = roof.planes.filter((p) => !p.id.startsWith("tower-"));
    expect(Math.max(...shell.map(top))).toBeCloseTo(52 * FEET, 0);
    // Wide and low: the building is five times as wide as the crown is high.
    const real = planPark(olympic, parkInput()).stands.real!;
    const xs = real.footprint.map((p) => p[0]);
    expect((Math.max(...xs) - Math.min(...xs)) / (52 * FEET)).toBeGreaterThan(4.5);
  });

  it("keeps the stands under the shell: every row's back wall stands under the panels over it", () => {
    const plan = planPark(olympic, parkInput());
    const real = plan.stands.real!;
    const mean = [real.footprint.reduce((t, p) => t + p[0], 0) / real.footprint.length, real.footprint.reduce((t, p) => t + p[1], 0) / real.footprint.length] as [number, number];
    for (const ring of plan.stands.rings) {
      for (const region of [ring.region, ...(ring.more ?? [])]) {
        if (region.kind !== "poly") continue;
        for (const q of region.points) {
          const hit = firstHit(real.footprint, mean, Math.atan2(q[1] - mean[1], q[0] - mean[0]));
          if (hit === undefined) continue;
          const share = Math.hypot(q[0] - mean[0], q[1] - mean[1]) / Math.hypot(hit[0] - mean[0], hit[1] - mean[1]);
          // (The panels' surface over the point is at least the ring's top row and a clearance over it, or the stands are far inside.)
          expect(ribbedSurfaceAt(share, real.dome!.low), `${ring.id} at ${share.toFixed(2)}`).toBeGreaterThan(ring.height[1] + 4);
        }
      }
    }
  });

  it("draws at every cut without a plane that has no size", () => {
    for (const detail of ["low", "auto", "high"] as const) {
      for (const item of itemsAt(detail)) {
        for (const p of item.planes) {
          expect(Number.isFinite(p.o[0] + p.o[1] + p.o[2] + p.u[0] + p.u[1] + p.u[2] + p.v[0] + p.v[1] + p.v[2]), `${detail} ${p.id}`).toBe(true);
          expect(Math.hypot(...p.u) * Math.hypot(...p.v), `${detail} ${p.id}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("keeps the plane budget: the shell, the roof and the tower are no more planes than the drum, the lens and the tower they replaced (346 at the default cut)", () => {
    const planes = itemsAt("auto").filter((i) => i.kind === "walls" || i.kind === "roof").flatMap((i) => i.planes);
    expect(planes.length).toBeLessThanOrEqual(346);
    expect(itemsAt("low").filter((i) => i.kind === "walls" || i.kind === "roof").flatMap((i) => i.planes).length).toBeLessThan(planes.length / 1.6);
  });
});

describe("the ribs' shape", () => {
  it("is a wing: vertical at its foot and sweeping in as it climbs", () => {
    expect(ribShare(0)).toBe(1);
    expect(ribShare(0.15)).toBeGreaterThan(0.97);
    expect(ribShare(1)).toBeCloseTo(0.775, 3);
    expect(ribShare(0.5)).toBeGreaterThan(ribShare(0.75));
  });

  it("spaces its points equally round the outline, the first nearest the tower", () => {
    const square: [number, number][] = [[0, 0], [100, 0], [100, 100], [0, 100]];
    const points = spaced(square, 8, [100, 100]);
    expect(points[0]).toEqual([100, 100]);
    expect(points).toHaveLength(8);
    expect(new Set(points.map((p) => p.join(","))).size).toBe(8);
    expect(points[1]).toEqual([50, 100]);
  });
});
