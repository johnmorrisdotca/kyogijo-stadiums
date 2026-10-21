import { describe, expect, it, vi } from "vitest";
import { drawKyogijo } from "./index.ts";
import { luminance, rgbOf } from "./colour.ts";
import { drawMulti } from "./multi-entry.ts";
import { buildMultiTurn } from "./multi.turn.ts";
import { buildDistrictTurn } from "./district.turn.ts";
import { STADIUMS, STADIUM_IDS, stadiumKind } from "./stadiums.ts";
import { buildTurn, KYOGIJO_TURN_STYLE, turnMarkupOf, type TurnModel } from "./turn-entry.ts";
import { LIGHTING_PRESETS, POOL, resolveLighting } from "./venue.lighting.ts";
import { VENUE_IDS } from "./venues.ts";
import type { SurfaceOptions } from "./types.ts";

// Every real venue is built, lit and not: on a slow machine that takes longer than the 30 seconds of the config.
vi.setConfig({ testTimeout: 300_000 });

const REAL: readonly (readonly [string, SurfaceOptions])[] = [
  ...VENUE_IDS.map((id): [string, SurfaceOptions] => [id, { sport: "nhl", arena: id, crowd: { real: true } } as SurfaceOptions]),
  ...STADIUM_IDS.map((id): [string, SurfaceOptions] => {
    const v = STADIUMS[id];
    const kind = stadiumKind(v);
    const sport = kind === "park" ? "mlb" : kind === "hall" ? "boxing" : Object.keys(v.configs)[0];
    return [id, (kind === "park" ? { sport, park: v.park, crowd: { real: true } } : { sport, stadium: id, crowd: { real: true } }) as SurfaceOptions];
  }),
];
const build = (options: SurfaceOptions, venue: object = {}): TurnModel => buildTurn(options, { id: "t", venue: { roof: false, walls: false, ...venue } });
const night = (m: TurnModel) => m.planes.filter((p) => p.id === "night-pool");
const seats = (m: TurnModel) => m.planes.filter((p) => p.kind === "seats");

describe("what the lighting option asks for", () => {
  it("is nothing by default and when false, night for night, true and { preset: night }, and nothing for a name it does not know", () => {
    expect(LIGHTING_PRESETS).toEqual(["night"]);
    expect(resolveLighting(undefined)).toBeUndefined();
    expect(resolveLighting(false)).toBeUndefined();
    expect(resolveLighting("night")).toBe("night");
    expect(resolveLighting(true)).toBe("night");
    expect(resolveLighting({})).toBe("night");
    expect(resolveLighting({ preset: "night" })).toBe("night");
    expect(resolveLighting("disco" as never)).toBeUndefined();
    expect(resolveLighting({ preset: "disco" } as never)).toBeUndefined();
  });
});

describe("a real venue without lighting", () => {
  it("is as it was: no veil, no pool of light, no lit exits, no halo, nothing on the view's root, in every arena, stadium and park", () => {
    for (const [id, options] of REAL) {
      const model = build(options, { boards: true });
      expect(model.lighting, id).toBeUndefined();
      expect(night(model), id).toHaveLength(0);
      const svg = model.planes.map((p) => p.svg).join("");
      expect(svg, id).not.toContain("u-veil");
      expect(svg, id).not.toContain("ky-cr-vom");
      expect(svg, id).not.toContain("u-led-glow");
      expect(turnMarkupOf(model, {}), id).not.toContain('data-lighting="');
    }
  });
});

describe("a real venue at night", () => {
  it("dims every plane of seats under a veil, lights the surface with one pool of light, and adds nothing else to the scene's planes", () => {
    for (const [id, options] of REAL) {
      const plain = build(options, { boards: true });
      const lit = build(options, { boards: true, lighting: "night" });
      expect(lit.lighting, id).toBe("night");
      expect(night(lit), id).toHaveLength(1);
      expect(lit.planes.length, id).toBe(plain.planes.length + 1);
      expect(lit.planes.filter((p) => p.id !== "night-pool").map((p) => p.id), id).toEqual(plain.planes.map((p) => p.id));
      for (const p of seats(lit)) expect(p.svg, `${id} ${p.id}`).toContain("u-veil");
      // The pool lies on the floor, round the surface, and is clear over the middle so that the markings stay as drawn.
      const pool = night(lit)[0];
      expect(pool.o[2], id).toBeGreaterThan(0);
      expect(pool.o[2], id).toBeLessThan(0.5);
      expect(pool.svg, id).toContain("radialGradient");
      expect(pool.svg, id).toContain('stop-opacity="0"');
      expect(Math.hypot(...pool.u), id).toBeGreaterThan(2 * POOL.reach);
    }
  });

  it("shows the exits and the aisles as lights of their own, and the boards with a halo", () => {
    const model = build({ sport: "nhl", arena: "td-garden", crowd: { real: true } } as SurfaceOptions, { boards: true, lighting: "night" });
    const svg = seats(model).map((p) => p.svg).join("");
    expect(svg).toContain("ky-cr-vom");
    expect(svg).toContain("ky-cr-aisle");
    const boards = model.planes.filter((p) => p.kind === "ribbon" || p.kind === "hung-board");
    expect(boards.length).toBeGreaterThan(0);
    expect(boards.every((p) => p.svg.includes("u-led-glow") || p.id.endsWith("-cap") || p.id.includes("strut"))).toBe(true);
    expect(boards.some((p) => p.svg.includes("u-led-glow"))).toBe(true);
    // The boards are still the boards: the same lit shapes, with the glow added under them.
    expect(boards.some((p) => p.svg.includes('class="u-led"'))).toBe(true);
  });

  it("is an attribute of the view's root, for the stylesheet", () => {
    const model = build({ sport: "nhl", arena: "td-garden", crowd: { real: true } } as SurfaceOptions, { lighting: "night" });
    expect(turnMarkupOf(model, {})).toContain('data-lighting="night"');
  });

  it("has a stylesheet that goes dark in either theme and keeps the lights readable on the dark", () => {
    const rule = /\.ky-turn\[data-lighting=night\]\{([^}]*)\}/.exec(KYOGIJO_TURN_STYLE)![1];
    const get = (name: string): string => new RegExp(`--${name}:(#[0-9a-f]{6})`).exec(rule)![1];
    const lum = (hex: string): number => luminance(rgbOf(hex)!);
    const ratio = (a: string, b: string): number => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    for (const light of ["ky-night-aisle", "ky-night-exit", "ky-night-rim"]) expect(ratio(get(light), get("ky-cr-bed")), light).toBeGreaterThan(7);
    // The house is dark whichever theme the page is in: the night rule sets the venue's colours itself, with more weight than the themes' zero-weight rules.
    expect(lum(get("ky-cr-bed"))).toBeLessThan(0.02);
    expect(KYOGIJO_TURN_STYLE).toContain(":where(html[data-theme=dark] .ky-turn");
    expect(rule).toContain("--ky-cr-dim:1");
  });
});

describe("where the lighting is said", () => {
  const td = { sport: "nhl", arena: "td-garden", crowd: { real: true } } as SurfaceOptions;

  it("is read from the crowd in 3D, and the venue's own setting wins, false turning it off", () => {
    const viaCrowd = buildTurn({ ...td, crowd: { real: true, lighting: "night" } } as SurfaceOptions, {});
    expect(viaCrowd.lighting).toBe("night");
    expect(night(viaCrowd)).toHaveLength(1);
    expect(buildTurn({ ...td, crowd: { real: true, lighting: "night" } } as SurfaceOptions, { venue: { lighting: false } }).lighting).toBeUndefined();
    expect(buildTurn(td, { venue: { lighting: true } }).lighting).toBe("night");
    expect(buildTurn(td, { venue: false }).lighting).toBeUndefined();
  });

  it("is the same for the usual stands of any sport, not only a real building", () => {
    const model = buildTurn({ sport: "soccer", crowd: true } as SurfaceOptions, { venue: { lighting: "night" } });
    expect(model.lighting).toBe("night");
    expect(night(model)).toHaveLength(1);
  });

  it("is set for a district's 3D view and a tournament hall's, which have no crowd of their own to read it from", () => {
    const district = buildDistrictTurn({ venues: ["bc-place", "rogers-arena"] } as never, { venue: { lighting: "night" } });
    expect(district.lighting).toBe("night");
    expect(buildDistrictTurn({ venues: ["bc-place", "rogers-arena"] } as never, {}).lighting).toBeUndefined();
    const hall = buildMultiTurn({ preset: "tabletennis-4", stadium: { lighting: "night" } } as never);
    expect(hall.lighting).toBe("night");
    expect(night(hall)).toHaveLength(1);
    const viaVenue = buildMultiTurn({ preset: "tabletennis-4", stadium: true } as never, { venue: { lighting: "night" } });
    expect(viaVenue.lighting).toBe("night");
    expect(buildMultiTurn({ preset: "tabletennis-4", stadium: true } as never).lighting).toBeUndefined();
    expect(buildMultiTurn({ preset: "tabletennis-4" } as never, { venue: { lighting: "night" } }).lighting).toBeUndefined();
  });
});

describe("the flat plan at night", () => {
  const options = (lighting?: unknown, extra: object = {}) => ({ sport: "nhl", arena: "td-garden", id: "t", crowd: { real: true, ...(lighting === undefined ? {} : { lighting }), ...extra } }) as SurfaceOptions;

  it("is as it was without it, and dims the stands under a veil with the aisles and exits lit, the surface in a pool of light, with it", () => {
    const plain = drawKyogijo(options());
    for (const word of ["class=\"ky-crowd ky-night\"", "class=\"ky-cr-veil\"", "class=\"ky-cr-pool\"", "ky-cr-aisle ky-cr-vom", "<radialGradient"]) expect(plain).not.toContain(word);
    expect(drawKyogijo(options(false))).toBe(plain);
    const lit = drawKyogijo(options("night"));
    for (const word of ["class=\"ky-crowd ky-night\"", "class=\"ky-cr-veil\"", "class=\"ky-cr-pool\"", "ky-cr-aisle ky-cr-vom", "<radialGradient"]) expect(lit).toContain(word);
    expect(lit).not.toContain("<text");
  });

  it("lights the boards with a halo, and keeps them out from under the veil", () => {
    const lit = drawKyogijo(options("night", { boards: true }));
    expect(lit).toContain("ky-cr-led-glow");
    expect(drawKyogijo(options(undefined, { boards: true }))).not.toContain("ky-cr-led-glow");
    // The ribbon is a group of its own, after the crowd's: the crowd's dark colours and veil do not reach it.
    expect(lit.indexOf("ky-cr-ribbon")).toBeGreaterThan(lit.indexOf('class="ky-crowd ky-night"'));
    const group = /<g class="ky-crowd ky-night">([\s\S]*?)<\/g><g class="ky-cr-ribbon">/.exec(lit);
    expect(group).not.toBeNull();
  });

  it("draws in every real venue and in a tournament hall", () => {
    for (const [id, o] of REAL) expect(drawKyogijo({ ...o, crowd: { ...(o.crowd as object), lighting: "night" } } as SurfaceOptions), id).toContain('class="ky-crowd ky-night"');
    expect(drawMulti({ preset: "tabletennis-4", stadium: { lighting: "night" } } as never)).toContain('class="ky-crowd ky-night"');
    expect(drawMulti({ preset: "tabletennis-4", stadium: true } as never)).not.toContain('class="ky-crowd ky-night"');
  });
});
