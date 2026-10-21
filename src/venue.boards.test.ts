import { describe, expect, it, vi } from "vitest";
import { drawKyogijo } from "./index.ts";
import { drawMulti } from "./multi-entry.ts";
import { buildMultiTurn } from "./multi.turn.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { STADIUMS, STADIUM_IDS, stadiumKind } from "./stadiums.ts";
import { buildTurn, describeUprights, type TurnModel } from "./turn-entry.ts";
import type { Plane, V3 } from "./turn.kit.ts";
import { BOARD, BOARD_COLORS, BOARD_PATTERNS, boardSize, centreBoard, hallBoards, hangsOver, ledStrip, resolveBoards, ribbonHigh, ribbonShare, safeColor, type Boards } from "./venue.boards.ts";
import { VENUE_IDS } from "./venues.ts";
import type { SurfaceOptions } from "./types.ts";

// Every real venue is built, with and without the boards: on a slow machine that takes longer than the 30 seconds of the config.
vi.setConfig({ testTimeout: 300_000 });

/** The options of each real venue: an arena of the NHL, or a stadium, a ballpark, a hall. */
const REAL: readonly (readonly [string, SurfaceOptions])[] = [
  ...VENUE_IDS.map((id): [string, SurfaceOptions] => [id, { sport: "nhl", arena: id, crowd: { real: true } } as SurfaceOptions]),
  ...STADIUM_IDS.map((id): [string, SurfaceOptions] => {
    const v = STADIUMS[id];
    const kind = stadiumKind(v);
    const sport = kind === "park" ? "mlb" : kind === "hall" ? "boxing" : Object.keys(v.configs)[0];
    return [id, (kind === "park" ? { sport, park: v.park, crowd: { real: true } } : { sport, stadium: id, crowd: { real: true } }) as SurfaceOptions];
  }),
];
const BOARDED = new Map<string, TurnModel>();
const PLAIN = new Map<string, TurnModel>();
const modelOf = (id: string, options: SurfaceOptions, boards: boolean): TurnModel => {
  const cache = boards ? BOARDED : PLAIN;
  let m = cache.get(id);
  if (m === undefined) {
    m = buildTurn(options, { venue: { roof: false, walls: false, ...(boards ? { boards: true } : {}) } });
    cache.set(id, m);
  }
  return m;
};
const ofKind = (model: TurnModel, kind: string): Plane[] => model.planes.filter((p) => p.kind === kind);
const itemsOf = (model: TurnModel, kind: string) => model.uprights.items.filter((i) => i.kind === kind);
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

const LOOK: Boards = { ribbon: true, scoreboard: true, colors: ["#ff0000", "#00ff00", "#0000ff"], pattern: "bands", score: [3, 2], glow: false };

describe("what the boards option asks for", () => {
  it("is nothing by default and when it is false, and both boards with the package's colours for true", () => {
    expect(resolveBoards(undefined)).toBeUndefined();
    expect(resolveBoards(false)).toBeUndefined();
    expect(resolveBoards({ ribbon: false, scoreboard: false })).toBeUndefined();
    expect(resolveBoards(true)).toEqual({ ribbon: true, scoreboard: true, colors: [...BOARD_COLORS], pattern: "bands", score: [0, 0], glow: false });
    expect(resolveBoards({ ribbon: false })).toMatchObject({ ribbon: false, scoreboard: true });
  });

  it("takes the asker's colours, else the crowd's home and away, and fills the third with white or the first", () => {
    expect(resolveBoards({ colors: ["#c8102e", "rgb(0, 40, 104)", "gold"] })?.colors).toEqual(["#c8102e", "rgb(0, 40, 104)", "gold"]);
    expect(resolveBoards({ colors: ["#c8102e"] })?.colors).toEqual(["#c8102e", BOARD_COLORS[2], "#c8102e"]);
    expect(resolveBoards(true, { home: "#13294b", away: "#ffffff" })?.colors).toEqual(["#13294b", "#ffffff", "#13294b"]);
    expect(resolveBoards({ colors: [] }, { home: "#13294b" })?.colors).toEqual(BOARD_COLORS);
  });

  it("never writes a colour that is not a colour into a drawing", () => {
    expect(safeColor('"><script>alert(1)</script>')).toBeUndefined();
    expect(safeColor("red; fill:url(x)")).toBeUndefined();
    expect(safeColor("url(#x)")).toBeUndefined();
    expect(safeColor("#abc")).toBe("#abc");
    const hostile = resolveBoards({ colors: ['"><script>', "javascript:1", "#fff"] })!;
    expect(hostile.colors).toEqual(["#fff", BOARD_COLORS[2], "#fff"]);
    const svg = drawKyogijo({ sport: "nhl", arena: "td-garden", crowd: { real: true, boards: { colors: ['" onload="x'] } } } as SurfaceOptions);
    expect(svg).not.toContain("onload");
  });

  it("holds the pattern to the four and the score to whole numbers 0 to 99", () => {
    expect(BOARD_PATTERNS).toEqual(["bands", "blocks", "chevrons", "waves"]);
    expect(resolveBoards({ pattern: "sparkle" as never })?.pattern).toBe("bands");
    expect(resolveBoards({ pattern: "waves" })?.pattern).toBe("waves");
    expect(resolveBoards({ score: [120, -4] })?.score).toEqual([99, 0]);
    expect(resolveBoards({ score: [3.9, Number.NaN] })?.score).toEqual([3, 0]);
  });

  it("is a hall's ribbons without the scoreboard (a layout has its own)", () => {
    expect(hallBoards(undefined)).toBeUndefined();
    expect(hallBoards(false)).toBeUndefined();
    expect(hallBoards(true)).toEqual({ scoreboard: false });
    expect(hallBoards({ pattern: "waves", scoreboard: true })).toEqual({ pattern: "waves", scoreboard: false });
  });
});

describe("a ribbon", () => {
  const quad: [number, number][] = [[0, 0], [60, 0], [60, 4], [0, 4]];

  it("is a dark housing with panels of light in it, a panel to every few feet, in the pattern asked", () => {
    for (const pattern of BOARD_PATTERNS) {
      const svg = ledStrip(quad, { ...LOOK, pattern });
      expect(svg, pattern).toContain("u-led-bed");
      expect(svg, pattern).toContain('class="u-led"');
      expect(svg, pattern).not.toContain("<text");
    }
    // Blocks: one block to each of the 7 panels (60 / 9, rounded), and the colours take turns.
    const blocks = ledStrip(quad, { ...LOOK, pattern: "blocks" });
    const cells = (blocks.match(/M[^MZ]+Z/g) ?? []).length - 1;
    expect(cells).toBe(Math.round(60 / BOARD.panel));
    expect(blocks).toContain('fill="#ff0000"');
    expect(blocks).toContain('fill="#00ff00"');
    expect(blocks).toContain('fill="#0000ff"');
    expect(ledStrip(quad, { ...LOOK, pattern: "waves" })).toContain("stroke-linecap");
    expect(ledStrip(quad, { ...LOOK, pattern: "chevrons" })).toContain('class="u-led"');
  });

  it("carries on in the colour it was where the last piece ended, and is the housing alone where a piece is no quad", () => {
    const one = ledStrip([[0, 0], [9, 0], [9, 4], [0, 4]], { ...LOOK, pattern: "blocks" }, 0);
    const next = ledStrip([[0, 0], [9, 0], [9, 4], [0, 4]], { ...LOOK, pattern: "blocks" }, 9);
    expect(one).toContain('fill="#ff0000"');
    expect(next).toContain('fill="#00ff00"');
    const odd = ledStrip([[0, 0], [10, 0], [5, 4]], LOOK);
    expect(odd).toContain("u-led-bed");
    expect(odd).not.toContain('class="u-led"');
  });

  it("takes a share of a steep plane and none of a flat one", () => {
    expect(ribbonShare(20, 2)).toBeGreaterThan(0.06);
    expect(ribbonShare(20, 2)).toBeLessThan(0.4);
    expect(ribbonShare(20, 0.1)).toBe(0);
    expect(ribbonShare(1, 2)).toBe(0);
    expect(ribbonHigh(40)).toBe(BOARD.ribbon);
    expect(ribbonHigh(4)).toBeCloseTo(2.4, 5);
  });
});

describe("the scoreboard over a surface", () => {
  it("is sized by the surface, between its least and its most, and hangs a share of the surface's longer side over it", () => {
    const rink = boardSize(200, 85);
    expect(rink.w).toBeGreaterThanOrEqual(BOARD.wide[0]);
    expect(rink.w).toBeLessThanOrEqual(BOARD.wide[1]);
    expect(rink.d).toBeGreaterThanOrEqual(BOARD.deep[0]);
    expect(rink.d).toBeLessThanOrEqual(BOARD.deep[1]);
    expect(rink.hang).toBeCloseTo(40, 5);
    const field = boardSize(360, 160);
    expect(field.w).toBe(BOARD.wide[1] > 360 * BOARD.share.w ? 360 * BOARD.share.w : BOARD.wide[1]);
    expect(field.hang).toBe(BOARD.hang.most > 72 ? 72 : BOARD.hang.most);
    // A small surface (a boxing ring) gets a board that does not cover it.
    const ring = boardSize(24, 24);
    expect(ring.w).toBeLessThan(24);
    expect(ring.d).toBeLessThan(24);
  });

  it("has no board over a ballpark", () => {
    expect(hangsOver("mlb")).toBe(false);
    expect(hangsOver("nhl")).toBe(true);
    expect(hangsOver("cfl")).toBe(true);
  });

  it("is four faces looking outwards, a ring of display under each, a cap and a strut, over the surface and clear of it", () => {
    const box = { x: 10, y: 20, w: 200, h: 85 };
    const planes = centreBoard("board", box, 0, LOOK);
    const size = boardSize(200, 85);
    const faces = planes.filter((p) => /^board-(south|north|east|west)$/.test(p.id));
    expect(faces).toHaveLength(4);
    expect(planes.filter((p) => p.id.endsWith("-ring"))).toHaveLength(4);
    expect(planes.some((p) => p.id === "board-cap")).toBe(true);
    expect(planes.some((p) => p.id.startsWith("board-strut"))).toBe(true);
    const [cx, cy] = [box.x + box.w / 2, box.y + box.h / 2];
    for (const f of faces) {
      // The face's front (u x v) points away from the board's middle, so that an eye outside reads it the right way round.
      const front = cross(f.u, f.v);
      const mid = [f.o[0] + (f.u[0] + f.v[0]) / 2 - cx, f.o[1] + (f.u[1] + f.v[1]) / 2 - cy];
      expect(front[0] * mid[0] + front[1] * mid[1], f.id).toBeGreaterThan(0);
      expect(f.o[2], f.id).toBeGreaterThan(size.hang);
      expect(f.svg, f.id).toContain("u-led-screen");
    }
    const lowest = Math.min(...planes.flatMap((p) => [p.o[2], p.o[2] + p.v[2]]));
    expect(lowest).toBeCloseTo(size.hang, 5);
    // The score is drawn in segments: no text.
    expect(faces.every((f) => !f.svg.includes("<text"))).toBe(true);
    // 3 - 2 is three lit segments less than 8 - 8: different numbers are drawn differently.
    const other = centreBoard("board", box, 0, { ...LOOK, score: [8, 8] }).find((p) => p.id === "board-south")!;
    expect(other.svg).not.toBe(faces.find((p) => p.id === "board-south")!.svg);
    // It stands over the surface as the surface stands: a lifted surface lifts it.
    expect(Math.min(...centreBoard("board", box, 3, LOOK).flatMap((p) => [p.o[2], p.o[2] + p.v[2]]))).toBeCloseTo(size.hang + 3, 5);
  });
});

describe("a real venue without the boards", () => {
  it("is as it was: no ribbon, no hung board, and the same planes as with them, less the boards", () => {
    for (const [id, options] of REAL) {
      const plain = modelOf(id, options, false);
      expect(ofKind(plain, "ribbon"), id).toHaveLength(0);
      expect(ofKind(plain, "hung-board"), id).toHaveLength(0);
      expect(itemsOf(plain, "ribbon-boards"), id).toHaveLength(0);
      expect(itemsOf(plain, "hung-board"), id).toHaveLength(0);
      const boarded = modelOf(id, options, true);
      const rest = (m: TurnModel): number => m.planes.filter((p) => p.kind !== "ribbon" && p.kind !== "hung-board" && p.kind !== "frame").length;
      expect(rest(boarded), id).toBe(rest(plain) - 0);
      const same = (defs: string): string => defs.replace(/ky-turn-\w+/g, "ID");
      expect(same(boarded.defs), id).toBe(same(plain.defs));
    }
  });

  it("draws the same flat plan, and the boards add to it only when asked", () => {
    for (const [id, options] of REAL.slice(0, 4)) {
      const plain = drawKyogijo({ ...options, id: "t" } as SurfaceOptions);
      expect(plain, id).not.toContain("ky-cr-ribbon");
      expect(plain, id).not.toContain("ky-cr-board");
      const boarded = drawKyogijo({ ...options, id: "t", crowd: { ...(options.crowd as object), boards: false } } as SurfaceOptions);
      expect(boarded, id).toBe(plain);
    }
  });
});

describe("the boards in every real venue's 3D view", () => {
  it("run along the fascia between the levels of every arena, stadium and hall, in pieces with a ribbon each, light and dark alike", () => {
    for (const [id, options] of REAL) {
      const model = modelOf(id, options, true);
      const ribbons = ofKind(model, "ribbon");
      expect(ribbons.length, id).toBeGreaterThan(0);
      expect(itemsOf(model, "ribbon-boards"), id).toHaveLength(1);
      for (const p of ribbons) {
        expect(p.svg, `${id} ${p.id}`).toContain("u-led-bed");
        expect(p.svg, `${id} ${p.id}`).not.toContain("<text");
        for (const v of [...p.o, ...p.u, ...p.v]) expect(Number.isFinite(v), `${id} ${p.id}`).toBe(true);
        // A ribbon is a strip, not a sheet: a few feet tall.
        expect(Math.hypot(...p.v), `${id} ${p.id}`).toBeLessThanOrEqual(BOARD.ribbon * 4);
        expect(p.shy, `${id} ${p.id}`).toBeDefined();
      }
      // The walk below a ribbon is still the suite wall: no bare shelf is left.
      for (const w of ofKind(model, "concourse")) expect(w.svg, `${id} ${w.id}`).toContain("u-suite");
    }
  });

  it("hang a scoreboard over the middle of every arena and stadium, and none over a ballpark", () => {
    for (const [id, options] of REAL) {
      const model = modelOf(id, options, true);
      const park = (options as { sport: string }).sport === "mlb";
      expect(ofKind(model, "hung-board").length > 0, id).toBe(!park);
      expect(itemsOf(model, "hung-board").length, id).toBe(park ? 0 : 1);
    }
  });

  it("keep the hung board over the surface, clear of the bowl's roof edge and within the scene's box", () => {
    for (const [id, options] of REAL.filter(([, o]) => (o as { sport: string }).sport !== "mlb")) {
      const model = modelOf(id, options, true);
      const board = ofKind(model, "hung-board");
      const [x0, x1] = [Math.min(...board.map((p) => p.o[0])), Math.max(...board.map((p) => p.o[0] + p.u[0] + p.v[0]))];
      const [mx, my] = [model.centre[0], model.centre[1]];
      expect(x0, id).toBeLessThan(mx);
      expect(x1, id).toBeGreaterThan(mx);
      const top = Math.max(...board.flatMap((p) => [p.o[2], p.o[2] + p.v[2]]));
      expect(top * model.scale, id).toBeLessThanOrEqual(model.box.z1 + 1e-6);
      expect(Number.isFinite(my), id).toBe(true);
    }
  });
});

describe("the options of the boards", () => {
  const nhl = { sport: "nhl", arena: "td-garden", crowd: { real: true } } as SurfaceOptions;

  it("turn the ribbon and the scoreboard off one from the other", () => {
    const onlyRibbon = buildTurn(nhl, { venue: { boards: { scoreboard: false } } });
    expect(ofKind(onlyRibbon, "ribbon").length).toBeGreaterThan(0);
    expect(ofKind(onlyRibbon, "hung-board")).toHaveLength(0);
    const onlyBoard = buildTurn(nhl, { venue: { boards: { ribbon: false } } });
    expect(ofKind(onlyBoard, "ribbon")).toHaveLength(0);
    expect(ofKind(onlyBoard, "hung-board").length).toBeGreaterThan(0);
    // With the ribbon off the walk is whole again.
    const plain = buildTurn(nhl, {});
    expect(ofKind(onlyBoard, "concourse")).toHaveLength(ofKind(plain, "concourse").length);
  });

  it("read the crowd's boards in 3D, and the venue's wins, and false turns them off", () => {
    const viaCrowd = buildTurn({ ...nhl, crowd: { real: true, boards: true } } as SurfaceOptions, {});
    expect(ofKind(viaCrowd, "ribbon").length).toBeGreaterThan(0);
    expect(ofKind(viaCrowd, "hung-board").length).toBeGreaterThan(0);
    const off = buildTurn({ ...nhl, crowd: { real: true, boards: true } } as SurfaceOptions, { venue: { boards: false } });
    expect(ofKind(off, "ribbon")).toHaveLength(0);
    expect(ofKind(off, "hung-board")).toHaveLength(0);
    // The floor of the 3D view carries none of it: the boards are raised.
    expect(viaCrowd.floor).not.toContain("ky-cr-ribbon");
  });

  it("take the crowd's home and away colours where the boards name none", () => {
    const model = buildTurn({ ...nhl, crowd: { real: true, home: "#13294b", away: "#c8102e", boards: true } } as SurfaceOptions, {});
    const ribbon = ofKind(model, "ribbon").map((p) => p.svg).join("");
    expect(ribbon).toContain("#13294b");
    expect(ribbon).toContain("#c8102e");
    expect(ribbon).not.toContain(BOARD_COLORS[0]);
  });

  it("show the score given on all four faces of the board", () => {
    const model = buildTurn(nhl, { venue: { boards: { score: [10, 4], scoreboard: true } } });
    const faces = ofKind(model, "hung-board").filter((p) => /centre-board-(south|north|east|west)$/.test(p.id));
    expect(faces).toHaveLength(4);
    const first = faces[0].svg;
    expect(first).toContain("u-led");
    const zero = buildTurn(nhl, { venue: { boards: true } });
    expect(ofKind(zero, "hung-board").find((p) => p.id.endsWith("-south"))!.svg).not.toBe(faces.find((p) => p.id.endsWith("-south"))!.svg);
  });

  it("leave the venue's scoreboard out where the score is already hung up", () => {
    const scored = buildTurn({ ...nhl, home: { name: "Home", score: 3 }, away: { name: "Away", score: 2 } } as unknown as SurfaceOptions, { venue: { boards: true } });
    expect(ofKind(scored, "hung-board")).toHaveLength(0);
    expect(scored.planes.some((p) => p.id === "scoreboard")).toBe(true);
    expect(ofKind(scored, "ribbon").length).toBeGreaterThan(0);
    const floor = buildTurn({ ...nhl, home: { name: "Home", score: 3 }, away: { name: "Away", score: 2 } } as unknown as SurfaceOptions, { venue: { boards: true }, score: "floor" });
    expect(ofKind(floor, "hung-board").length).toBeGreaterThan(0);
  });

  it("are said in words, in English and Japanese, for a reader who cannot see the 3D view", () => {
    const model = buildTurn(nhl, { venue: { boards: true } });
    expect(model.standing).toContain(KYOGIJO_STRINGS.en.turn.parts["ribbon-boards"]);
    expect(model.standing).toContain(KYOGIJO_STRINGS.en.turn.parts["hung-board"]);
    const ja = describeUprights(nhl, model.uprights, "ja");
    expect(ja).toContain(KYOGIJO_STRINGS.ja.turn.parts["ribbon-boards"]);
    expect(ja).toContain(KYOGIJO_STRINGS.ja.turn.parts["hung-board"]);
  });

  it("are kept when the 3D view shows the floor alone", () => {
    const model = buildTurn(nhl, { uprights: false, venue: { boards: true } });
    expect(ofKind(model, "ribbon").length).toBeGreaterThan(0);
  });

  it("give a venue of the usual stands (no real building) its boards too", () => {
    const model = buildTurn({ sport: "nhl", crowd: { boards: true } } as SurfaceOptions, {});
    expect(ofKind(model, "ribbon").length).toBeGreaterThan(0);
    expect(ofKind(model, "hung-board").length).toBeGreaterThan(0);
    // One level of stands: the ribbon is on the front of it.
    const single = buildTurn({ sport: "soccer", crowd: { boards: { scoreboard: false } } } as SurfaceOptions, {});
    expect(ofKind(single, "ribbon").length).toBeGreaterThan(0);
  });
});

describe("the boards in the flat plan", () => {
  const nhl = { sport: "nhl", arena: "td-garden", crowd: { real: true, boards: true } } as SurfaceOptions;

  it("draw a lit line along the front of the upper tiers and a scoreboard over the middle, in the colours asked", () => {
    const svg = drawKyogijo({ ...nhl, crowd: { real: true, boards: { colors: ["#c8102e"], score: [3, 2] } } } as SurfaceOptions);
    expect(svg).toContain("ky-cr-ribbon");
    expect(svg).toContain("ky-cr-board");
    expect(svg).toContain("ky-cr-led-bed");
    expect(svg).toContain('stroke="#c8102e"');
    expect(svg).not.toContain("<text");
  });

  it("draw the one or the other alone, and no scoreboard for a ballpark", () => {
    expect(drawKyogijo({ ...nhl, crowd: { real: true, boards: { scoreboard: false } } } as SurfaceOptions)).not.toContain("ky-cr-board");
    expect(drawKyogijo({ ...nhl, crowd: { real: true, boards: { ribbon: false } } } as SurfaceOptions)).not.toContain("ky-cr-ribbon");
    const park = drawKyogijo({ sport: "mlb", park: "hanshin-koshien-stadium", crowd: { real: true, boards: true } } as SurfaceOptions);
    expect(park).not.toContain("ky-cr-board");
  });

  it("draw in every real venue, flat: a ribbon (a ballpark's stands are not tiers with a front to run along, so it has none in the plan) and, but for a ballpark, a scoreboard", () => {
    for (const [id, options] of REAL) {
      const svg = drawKyogijo({ ...options, crowd: { ...(options.crowd as object), boards: true } } as SurfaceOptions);
      const park = (options as { sport: string }).sport === "mlb";
      expect(svg.includes("ky-cr-ribbon"), id).toBe(!park);
      expect(svg.includes("ky-cr-board"), id).toBe(!park);
    }
  });

  it("are left out where the seats are (a building alone has no tiers to run along)", () => {
    const svg = drawKyogijo({ ...nhl, crowd: { real: true, stands: false, boards: true } } as SurfaceOptions);
    expect(svg).not.toContain("ky-cr-ribbon");
  });
});

describe("a tournament hall's boards", () => {
  it("are ribbons round the stadium, in the plan and in 3D, and no scoreboard over the middle: the layout has its own", () => {
    const options = { preset: "tabletennis-4", stadium: { boards: true } } as never;
    const flat = drawMulti(options);
    expect(flat).toContain("ky-cr-ribbon");
    expect(flat).not.toContain("ky-cr-board");
    const model = buildMultiTurn(options);
    expect(ofKind(model, "ribbon").length).toBeGreaterThan(0);
    expect(ofKind(model, "hung-board")).toHaveLength(0);
    // The venue setting of the 3D view asks the same, with the same rule.
    const viaVenue = buildMultiTurn({ preset: "tabletennis-4", stadium: true } as never, { venue: { boards: true } });
    expect(ofKind(viaVenue, "ribbon").length).toBeGreaterThan(0);
    expect(ofKind(viaVenue, "hung-board")).toHaveLength(0);
    // Without it the hall is as it was.
    const plain = buildMultiTurn({ preset: "tabletennis-4", stadium: true } as never);
    expect(ofKind(plain, "ribbon")).toHaveLength(0);
    expect(drawMulti({ preset: "tabletennis-4", stadium: true } as never)).not.toContain("ky-cr-ribbon");
  });
});
