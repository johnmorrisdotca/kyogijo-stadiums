import { describe, expect, it, vi } from "vitest";
import { drawKyogijo } from "./index.ts";
import { luminance, rgbOf } from "./colour.ts";
import { drawMulti } from "./multi-entry.ts";
import { buildMultiTurn } from "./multi.turn.ts";
import { buildDistrictTurn } from "./district.turn.ts";
import { STADIUMS, STADIUM_IDS, stadiumKind } from "./stadiums.ts";
import { buildTurn, KYOGIJO_TURN_STYLE, turnMarkupOf, type TurnModel } from "./turn-entry.ts";
import { LIGHTING_PRESETS, LIGHT_COLORS, LIGHT_PRESETS, POOL, WASH, resolveLighting } from "./venue.lighting.ts";
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
    expect(LIGHTING_PRESETS).toEqual(["night", "game", "lightsDown", "intro", "concert"]);
    expect(resolveLighting(undefined)).toBeUndefined();
    expect(resolveLighting(false)).toBeUndefined();
    expect(resolveLighting("night")?.preset).toBe("night");
    expect(resolveLighting(true)?.preset).toBe("night");
    expect(resolveLighting({})?.preset).toBe("night");
    expect(resolveLighting({ preset: "night" })?.preset).toBe("night");
    expect(resolveLighting("lightsDown")?.preset).toBe("lightsDown");
    expect(resolveLighting({ preset: "lightsDown" })?.preset).toBe("lightsDown");
    expect(resolveLighting("disco" as never)).toBeUndefined();
    expect(resolveLighting({ preset: "disco" } as never)).toBeUndefined();
  });

  it("takes the colour of the beams and of the wash by name or as a CSS colour, white beams and no wash where it is not said, and ignores what is not a colour", () => {
    expect(resolveLighting("lightsDown")).toMatchObject({ preset: "lightsDown", beam: LIGHT_COLORS.white, wash: undefined });
    expect(resolveLighting({ preset: "lightsDown", aisles: "amber", wash: "purple" })).toMatchObject({ preset: "lightsDown", beam: LIGHT_COLORS.amber, wash: LIGHT_COLORS.purple });
    expect(resolveLighting({ preset: "lightsDown", aisles: "#c8102e", wash: "rgb(10, 20, 30)" })).toMatchObject({ beam: "#c8102e", wash: "rgb(10, 20, 30)" });
    expect(resolveLighting({ preset: "lightsDown", aisles: '"><script>', wash: "url(#x)" })).toMatchObject({ beam: LIGHT_COLORS.white, wash: undefined });
    for (const name of ["white", "amber", "purple", "magenta", "blue", "cyan"]) expect(LIGHT_COLORS).toHaveProperty(name);
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
    const rule = /\.ky-turn\[data-lighting\]\{([^}]*)\}/.exec(KYOGIJO_TURN_STYLE)![1];
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

describe("the lights down", () => {
  const td = { sport: "nhl", arena: "td-garden", crowd: { real: true } } as SurfaceOptions;
  const down = (extra: object = {}) => ({ preset: "lightsDown" as const, ...extra });

  it("puts a beam in every stair aisle of every arena and stadium, in the plane of the seats so that it follows the rake, with the step edges lit and the dark aisle lines gone", () => {
    for (const [id, options] of REAL) {
      const model = build(options, { lighting: down({ aisles: "amber" }) });
      expect(model.lighting, id).toBe("lightsDown");
      const raked = seats(model).filter((p) => p.svg.includes("u-beam"));
      expect(raked.length, id).toBeGreaterThan(0);
      for (const p of raked) {
        expect(p.svg, `${id} ${p.id}`).toContain(`stroke="${LIGHT_COLORS.amber}"`);
        expect(p.svg, `${id} ${p.id}`).toContain("u-edge");
        expect(p.svg, `${id} ${p.id}`).toContain("u-veil-down");
        expect(p.svg, `${id} ${p.id}`).not.toContain('class="ky-cr-aisle');
      }
      // A beam on a tier lies on its slope: some plane that has one is not level.
      expect(raked.some((p) => Math.abs(p.v[2]) + Math.abs(p.u[2]) > 0.5), id).toBe(true);
    }
  });

  it("has no pool of light and no wash unless a wash is asked for, and then one flat wash plane over the surface, weak enough that the markings stay", () => {
    const plain = buildTurn(td, { venue: { lighting: down() } });
    expect(night(plain)).toHaveLength(0);
    expect(plain.planes.filter((p) => p.id === "light-wash")).toHaveLength(0);
    const washed = buildTurn(td, { venue: { lighting: down({ wash: "purple" }) } });
    const wash = washed.planes.filter((p) => p.id === "light-wash");
    expect(wash).toHaveLength(1);
    expect(washed.planes.length).toBe(plain.planes.length + 1);
    expect(WASH.middle).toBeLessThanOrEqual(0.5);
    expect(WASH.edge).toBeLessThan(WASH.middle);
    expect(wash[0].svg).toContain(LIGHT_COLORS.purple);
    expect(wash[0].svg).toContain(`stop-opacity="${WASH.middle}"`);
    // It is flat, over the surface's box and no further.
    expect(wash[0].u[2]).toBe(0);
    expect(wash[0].v[2]).toBe(0);
    expect(wash[0].o[2]).toBeGreaterThan(0);
    expect(wash[0].o[2]).toBeLessThan(0.5);
  });

  it("takes a wash on the night too, with the pool of light tinted by it, and no wash on a venue without lighting", () => {
    const m = buildTurn(td, { venue: { lighting: { preset: "night", wash: "blue" } } });
    expect(m.planes.some((p) => p.id === "light-wash")).toBe(true);
    expect(night(m)[0].svg).toContain(LIGHT_COLORS.blue);
    expect(buildTurn(td, {}).planes.some((p) => p.id === "light-wash")).toBe(false);
  });

  it("is on the view's root as lightsDown, and the stylesheet makes the house darker than at night", () => {
    expect(turnMarkupOf(buildTurn(td, { venue: { lighting: "lightsDown" } }), {})).toContain('data-lighting="lightsDown"');
    expect(KYOGIJO_TURN_STYLE).toMatch(/\.ky-turn:is\(\[data-lighting=lightsDown\],\[data-lighting=intro\],\[data-lighting=concert\]\)\{--ky-cr-bed:#0a0d11/);
    expect(KYOGIJO_TURN_STYLE).toContain(".ky-turn .u-veil-down{fill-opacity:.8}");
  });

  it("is the same in the plan: beams and edges, the stands under a heavier veil, a wash over the surface, in every venue", () => {
    const options = (lighting: unknown) => ({ ...td, id: "t", crowd: { real: true, lighting } }) as SurfaceOptions;
    const svg = drawKyogijo(options(down({ aisles: "amber", wash: "magenta" })));
    for (const word of ['class="ky-crowd ky-night ky-down"', "ky-cr-beam", 'class="ky-cr-edge"', 'class="ky-cr-veil ky-cr-veil-down"', 'class="ky-cr-wash"', "<radialGradient"]) expect(svg).toContain(word);
    expect(svg).not.toContain('class="ky-cr-aisle"');
    expect(svg).toContain(LIGHT_COLORS.magenta);
    expect(drawKyogijo(options(down()))).not.toContain('class="ky-cr-wash"');
    for (const [id, o] of REAL) expect(drawKyogijo({ ...o, crowd: { ...(o.crowd as object), lighting: down({ wash: "blue" }) } } as SurfaceOptions), id).toContain("ky-cr-beam");
    // The night's wash is in the plan too.
    expect(drawKyogijo(options({ preset: "night", wash: "blue" }))).toContain('class="ky-cr-wash"');
  });

  it("is lit in a district, a hall and the usual stands, with the same presets", () => {
    expect(buildDistrictTurn({ venues: ["bc-place", "rogers-arena"] } as never, { venue: { lighting: "lightsDown" } }).lighting).toBe("lightsDown");
    expect(buildMultiTurn({ preset: "tabletennis-4", stadium: { lighting: { preset: "lightsDown", wash: "white" } } } as never).lighting).toBe("lightsDown");
    expect(buildTurn({ sport: "nba", crowd: true } as SurfaceOptions, { venue: { lighting: down({ wash: "cyan" }) } }).planes.some((p) => p.id === "light-wash")).toBe(true);
  });
});

describe("the named presets", () => {
  const td = { sport: "nhl", arena: "td-garden", crowd: { real: true } } as SurfaceOptions;
  const scored = (extra: object = {}) => ({ ...td, home: { name: "Home", score: 3, color: "#c8102e" }, away: { name: "Away", score: 2, color: "#13294b" }, ...extra }) as unknown as SurfaceOptions;
  const washOf = (m: TurnModel) => m.planes.find((p) => p.id === "light-wash")?.svg ?? "";
  const beamsOf = (m: TurnModel) => seats(m).map((p) => p.svg).join("");

  it("are a table of constants: each preset's house, aisles, pool of light and colours", () => {
    expect(Object.keys(LIGHT_PRESETS)).toEqual([...LIGHTING_PRESETS]);
    expect(LIGHT_PRESETS.night).toMatchObject({ house: "dim", aisles: "dots", pool: true });
    expect(LIGHT_PRESETS.game).toMatchObject({ house: "half", aisles: "none", pool: true });
    expect(LIGHT_PRESETS.lightsDown).toMatchObject({ house: "dark", aisles: "beams", pool: false });
    expect(LIGHT_PRESETS.intro).toMatchObject({ house: "dark", aisles: "beams", wash: "home", beam: "away" });
    expect(LIGHT_PRESETS.concert).toMatchObject({ house: "dark", aisles: "beams", wash: "purple", beam: "amber" });
  });

  it("take their colours, in order, from wash and aisles, from colors, from the teams, from the preset's own", () => {
    const own = resolveLighting("intro")!;
    expect([own.wash, own.beam]).toEqual([LIGHT_COLORS.blue, LIGHT_COLORS.amber]);
    const team = { home: "#c8102e", away: "#13294b" };
    expect(resolveLighting("intro", team)).toMatchObject({ wash: "#c8102e", beam: "#13294b" });
    expect(resolveLighting({ preset: "intro", colors: ["magenta", "#ffffff"] }, team)).toMatchObject({ wash: LIGHT_COLORS.magenta, beam: "#ffffff" });
    expect(resolveLighting({ preset: "intro", colors: ["magenta"] }, team)).toMatchObject({ wash: LIGHT_COLORS.magenta, beam: "#13294b" });
    expect(resolveLighting({ preset: "intro", colors: ["magenta", "cyan"], wash: "white", aisles: "blue" }, team)).toMatchObject({ wash: LIGHT_COLORS.white, beam: LIGHT_COLORS.blue });
    expect(resolveLighting({ preset: "intro", colors: ['"><x', "javascript:1"] }, team)).toMatchObject({ wash: "#c8102e", beam: "#13294b" });
    expect(resolveLighting("concert", team)).toMatchObject({ wash: LIGHT_COLORS.purple, beam: LIGHT_COLORS.amber });
    expect(resolveLighting({ preset: "concert", wash: "blue" })).toMatchObject({ wash: LIGHT_COLORS.blue, beam: LIGHT_COLORS.amber });
    expect(resolveLighting("game")).toMatchObject({ wash: undefined, beam: LIGHT_COLORS.white });
  });

  it("show the home team's colour on the surface and the visitors' in the beams, where the score has them", () => {
    const model = buildTurn(scored(), { venue: { lighting: "intro" } });
    expect(model.lighting).toBe("intro");
    expect(washOf(model)).toContain("#c8102e");
    expect(beamsOf(model)).toContain('stroke="#13294b"');
    expect(night(model)).toHaveLength(0);
    // The crowd's own home and away win over the teams'.
    const crowd = buildTurn(scored({ crowd: { real: true, home: "#00ff00", away: "#0000ff" } }), { venue: { lighting: "intro" } });
    expect(washOf(crowd)).toContain("#00ff00");
    expect(beamsOf(crowd)).toContain('stroke="#0000ff"');
    // Without any team the preset's own colours stand; passed colours stand for the teams.
    const bare = buildTurn(td, { venue: { lighting: "intro" } });
    expect(washOf(bare)).toContain(LIGHT_COLORS.blue);
    expect(beamsOf(bare)).toContain(`stroke="${LIGHT_COLORS.amber}"`);
    const passed = buildTurn(scored(), { venue: { lighting: { preset: "intro", colors: ["#7a00ff", "#00ffaa"] } } });
    expect(washOf(passed)).toContain("#7a00ff");
    expect(beamsOf(passed)).toContain('stroke="#00ffaa"');
  });

  it("make the concert's surface purple and its beams amber, and the game's house half lit in white light with no beams and a pool of light", () => {
    const concert = buildTurn(td, { venue: { lighting: "concert" } });
    expect(washOf(concert)).toContain(LIGHT_COLORS.purple);
    expect(beamsOf(concert)).toContain(`stroke="${LIGHT_COLORS.amber}"`);
    const game = buildTurn(td, { venue: { lighting: "game", boards: true } });
    expect(game.lighting).toBe("game");
    expect(night(game)).toHaveLength(1);
    expect(game.planes.some((p) => p.id === "light-wash")).toBe(false);
    const svg = beamsOf(game);
    expect(svg).toContain("u-veil-half");
    expect(svg).not.toContain("u-veil-down");
    expect(svg).not.toContain("u-beam");
    expect(svg).not.toContain("ky-cr-vom");
    expect(game.planes.some((p) => p.svg.includes("u-led-glow"))).toBe(true);
    expect(turnMarkupOf(game, {})).toContain('data-lighting="game"');
  });

  it("build in every real venue and in a district, a hall and the usual stands, for every preset", () => {
    for (const preset of ["intro", "concert"] as const) {
      for (const [id, options] of REAL) {
        const m = build(options, { lighting: preset });
        expect(m.lighting, `${preset} ${id}`).toBe(preset);
        expect(m.planes.some((p) => p.id === "light-wash"), `${preset} ${id}`).toBe(true);
      }
    }
    for (const preset of ["game", "night"] as const) for (const [id, options] of REAL.slice(0, 40).filter((_, i) => i % 5 === 0)) expect(build(options, { lighting: preset }).lighting, `${preset} ${id}`).toBe(preset);
    for (const preset of LIGHTING_PRESETS) {
      expect(buildDistrictTurn({ venues: ["bc-place", "rogers-arena"] } as never, { venue: { lighting: preset } }).lighting).toBe(preset);
      expect(buildMultiTurn({ preset: "tabletennis-4", stadium: { lighting: preset } } as never).lighting).toBe(preset);
      expect(buildTurn({ sport: "nba", crowd: true } as SurfaceOptions, { venue: { lighting: preset } }).lighting).toBe(preset);
    }
  });

  it("are in the plan too: the game's half-lit house, the intro's team colours and the concert's purple", () => {
    const plan = (lighting: unknown, o: object = {}) => drawKyogijo({ ...scored(o), id: "t", crowd: { real: true, lighting, ...((o as { crowd?: object }).crowd ?? {}) } } as SurfaceOptions);
    const game = plan("game");
    expect(game).toContain('class="ky-crowd ky-night ky-half"');
    expect(game).toContain("ky-cr-veil-half");
    expect(game).toContain('class="ky-cr-pool"');
    expect(game).not.toContain('class="ky-cr-beam"');
    const intro = plan("intro");
    expect(intro).toContain('class="ky-crowd ky-night ky-down"');
    expect(intro).toContain('class="ky-cr-wash"');
    expect(intro).toContain("#c8102e");
    expect(intro).toContain('stroke="#13294b"');
    expect(plan("intro", { home: { name: "H", score: 1 }, away: { name: "A", score: 0 } })).toContain(LIGHT_COLORS.blue);
    const concert = plan("concert");
    expect(concert).toContain(LIGHT_COLORS.purple);
    expect(concert).toContain(`stroke="${LIGHT_COLORS.amber}"`);
    expect(drawKyogijo({ ...td, id: "t", crowd: { real: true, lighting: { preset: "intro", colors: ["#7a00ff", "#00ffaa"] } } } as SurfaceOptions)).toContain("#7a00ff");
  });

  it("have a stylesheet for the game's half-lit house that is lighter than the night's", () => {
    const rule = /\.ky-turn\[data-lighting=game\]\{([^}]*)\}/.exec(KYOGIJO_TURN_STYLE)![1];
    const bed = /--ky-cr-bed:(#[0-9a-f]{6})/.exec(rule)![1];
    expect(luminance(rgbOf(bed)!)).toBeGreaterThan(luminance(rgbOf("#11151a")!));
    expect(KYOGIJO_TURN_STYLE).toContain(".ky-turn .u-veil-half{fill-opacity:.3}");
  });
});
