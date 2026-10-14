import { describe, expect, it } from "vitest";
import { KYOGIJO_ATTRIBUTES, turnSettingsFromAttributes, turnWanted } from "./element-entry.ts";
import { SPORTS, drawKyogijo } from "./index.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import {
  CURLING_PRESETS,
  LONG_PRESETS,
  NET_PRESETS,
  PITCH_MAX,
  TURN_PRESETS,
  TURN_PRESET_NAMES,
  ZOOM_MAX,
  ZOOM_MIN,
  buildTurn,
  cameraMatrix,
  clampView,
  describeUprights,
  drag,
  eyeDistance,
  fit,
  layoutOf,
  nudge,
  planeMatrix,
  planesOf,
  presetOf,
  presetView,
  project,
  step,
  turnMarkup,
  uprightsFor,
} from "./turn-entry.ts";
import { nearest, wrap } from "./turn.camera.ts";
import { facing, fadeOf } from "./turn.kit.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import type { Upright } from "./turn.kit.ts";
import type { SurfaceOptions } from "./types.ts";

const M = FEET_PER_METRE;
const metres = (feet: number): number => Math.round((feet / M) * 1000) / 1000;
const find = (sport: SurfaceOptions["sport"], extra: Partial<SurfaceOptions> = {}, settings = {}) => {
  const u = uprightsFor({ sport, ...extra }, settings);
  const by = (id: string): Upright => {
    const item = u.items.find((one) => one.id === id);
    if (item === undefined) throw new Error(`${sport} has no ${id}: ${u.items.map((one) => one.id).join(", ")}`);
    return item;
  };
  return { u, by };
};
/** The highest and the lowest point of an item, in feet. */
const heights = (item: Upright): [number, number] => {
  const zs = item.planes.flatMap((p) => [p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2], p.o[2] + p.u[2] + p.v[2]]);
  return [Math.min(...zs), Math.max(...zs)];
};

describe("what stands on the courts of the net sports", () => {
  it("hangs a volleyball net at 2.43 m for men and 2.24 m for women, on posts 2.55 m high, with antennae 80 cm over the net", () => {
    const { by } = find("volleyball");
    expect(metres(by("net").height)).toBe(2.43);
    expect(metres(heights(by("net"))[1])).toBe(2.43);
    // The net is a strip a metre wide: its lower edge is 1.43 m up.
    expect(metres(heights(by("net"))[0])).toBe(1.43);
    expect(metres(heights(by("posts"))[1])).toBe(2.55);
    expect(metres(heights(by("antennae"))[1])).toBe(3.23);
    expect(metres(heights(by("antennae"))[0])).toBe(1.43);
    const women = find("volleyball", {}, { netHeight: "women" });
    expect(metres(women.by("net").height)).toBe(2.24);
    expect(metres(heights(women.by("antennae"))[1])).toBe(3.04);
  });

  it("hangs the net of beach volleyball at the same heights, across an 8 m court", () => {
    const { by, u } = find("volleyball", { league: "fivb-beach" });
    expect(metres(by("net").height)).toBe(2.43);
    expect(u.items.map((item) => item.kind)).toContain("antennae");
  });

  it("puts the net in the middle of the court, across it, between its posts", () => {
    for (const sport of ["tennis", "volleyball", "badminton", "pickleball", "tabletennis", "padel", "sepaktakraw"] as const) {
      const { by } = find(sport);
      const net = by("net").planes[0];
      // A net stands over one line across the court: its length runs along y and its x is constant.
      expect(net.u[0]).toBe(0);
      expect(net.u[1]).toBeGreaterThan(0);
      const posts = by(sport === "tabletennis" ? "clamps" : "posts").planes;
      for (const post of posts) expect(post.o[0]).toBeCloseTo(net.o[0], 0);
    }
  });

  it("gives tennis posts 3 ft 6 in and a net 3 ft at the centre, and singles sticks when asked", () => {
    const { by, u } = find("tennis");
    expect(by("net").height).toBeCloseTo(3.5, 5);
    expect(by("net").low).toBeCloseTo(3, 5);
    expect(u.items.some((item) => item.id === "sticks")).toBe(false);
    const sticks = find("tennis", { net: { sticks: true } });
    expect(sticks.by("sticks").planes.length).toBe(4);
  });

  it("gives badminton posts 1.55 m and a net 1.524 m at the centre, 76 cm deep", () => {
    const { by } = find("badminton");
    expect(metres(by("posts").height)).toBe(1.55);
    expect(metres(by("net").low ?? 0)).toBe(1.524);
    const net = by("net").planes[0];
    // The plane reaches from the top at the posts (1.55 m) to the net's lower edge at the centre (1.524 - 0.76 m).
    expect(metres(Math.abs(net.v[2]))).toBeCloseTo(1.55 - (1.524 - 0.76), 2);
  });

  it("gives pickleball a net of 36 in at the posts and 34 in at the centre", () => {
    const { by } = find("pickleball");
    expect(by("net").height).toBeCloseTo(3, 5);
    expect(by("net").low).toBeCloseTo(34 / 12, 5);
  });

  it("lifts a table tennis table 76 cm and hangs the net 15.25 cm over it, on legs that reach the floor", () => {
    const { u, by } = find("tabletennis");
    expect(metres(u.lift)).toBe(0.76);
    expect(metres(heights(by("net"))[1] - u.lift)).toBe(0.153);
    expect(heights(by("table"))[0]).toBeCloseTo(0, 5);
    expect(heights(by("table"))[1]).toBeCloseTo(u.lift, 5);
  });

  it("hangs a padel net 0.92 m at the ends and 0.88 m at the centre on posts 1.05 m high, inside walls of 4 m at the ends and 3 m at the sides", () => {
    const { by } = find("padel");
    expect(metres(by("net").height)).toBe(0.92);
    expect(metres(by("net").low ?? 0)).toBe(0.88);
    expect(metres(heights(by("posts"))[1])).toBe(1.05);
    expect(metres(by("walls").height)).toBe(4);
    const tops = by("walls").planes.map((p) => metres(Math.max(p.o[2], p.o[2] + p.v[2])));
    expect(Math.max(...tops)).toBe(4);
    expect(tops).toContain(3);
    expect(find("padel", {}, { boards: false }).u.items.some((i) => i.kind === "walls")).toBe(false);
  });

  it("stands squash and racquetball in walls: the out lines of a squash court, 20 ft round a racquetball court", () => {
    const squash = find("squash");
    const front = squash.by("walls").planes.find((p) => p.id === "wall-front")!;
    expect(metres(front.o[2])).toBe(4.57);
    expect(metres(squash.by("walls").planes.find((p) => p.id === "wall-back")!.o[2])).toBe(2.13);
    expect(squash.u.items.map((i) => i.kind)).toEqual(["walls"]);
    const racquetball = find("racquetball");
    expect(racquetball.by("walls").height).toBe(20);
    expect(racquetball.by("walls").planes).toHaveLength(4);
  });

  it("hangs a sepak takraw net 1.52 m high at the centre (men) or 1.42 m (women), on posts of 1.55 m or 1.45 m", () => {
    const men = find("sepaktakraw");
    expect(metres(men.by("net").low ?? 0)).toBe(1.52);
    expect(metres(men.by("net").height)).toBe(1.55);
    expect(metres(heights(men.by("posts"))[1])).toBe(1.55);
    const women = find("sepaktakraw", {}, { netHeight: "women" });
    expect(metres(women.by("net").low ?? 0)).toBe(1.42);
    expect(metres(heights(women.by("posts"))[1])).toBe(1.45);
    // The net is 0.7 m wide.
    const net = men.by("net").planes[0];
    expect(metres(Math.abs(net.v[2]) - 0.03)).toBeGreaterThan(0.6);
  });

  it("stands a sitting volleyball net 1.15 m high (1.05 m for women), 80 cm wide, with antennae 1.6 m long", () => {
    const men = find("volleyball", { league: "wpv-sitting" });
    expect(metres(men.by("net").height)).toBe(1.15);
    expect(metres(heights(men.by("net"))[0])).toBe(0.35);
    expect(metres(heights(men.by("antennae"))[1] - heights(men.by("antennae"))[0])).toBe(1.6);
    expect(metres(heights(men.by("posts"))[1])).toBe(1.27);
    expect(metres(find("volleyball", { league: "wpv-sitting" }, { netHeight: "women" }).by("net").height)).toBe(1.05);
  });

  it("stands a teqball table 76 cm up on its legs, with the net 14 cm over it, on a floor that is not raised", () => {
    const { u, by } = find("teqball");
    expect(u.lift).toBe(0);
    expect(metres(by("table").height)).toBe(0.76);
    expect(metres(by("net").height)).toBe(0.9);
    expect(heights(by("table"))[0]).toBeCloseTo(0, 5);
    expect(by("table").planes.some((p) => p.id === "table-top")).toBe(true);
  });

  it("stands a roundnet set 20.3 cm high and 91.4 cm across, and a netball goalpost 3.05 m high with its ring", () => {
    const set = find("roundnet").by("net");
    expect(metres(set.height)).toBe(0.203);
    expect(metres(Math.hypot(...set.planes[0].u))).toBe(0.914);
    const posts = find("netball").by("goalposts");
    expect(metres(posts.height)).toBe(3.05);
    expect(posts.planes.filter((p) => p.kind === "rim")).toHaveLength(2);
  });
});

describe("what stands on a rink, a court and a pitch", () => {
  it("stands the NBA's baskets with the ring's top 10 ft up, in front of a board 3 1/2 ft tall whose lower edge is 150 mm under the ring's top, with a stanchion 2 m behind each baseline", () => {
    const { by, u } = find("nba");
    for (const end of ["left", "right"]) {
      const hoop = by(`hoop-${end}`);
      expect(hoop.height).toBe(10);
      const board = hoop.planes.find((p) => p.id.endsWith("backboard"))!;
      expect(board.o[2] + board.v[2]).toBeCloseTo(10 - 0.15 * M, 5);
      expect(Math.abs(board.v[2])).toBe(3.5);
      expect(hoop.planes.find((p) => p.id.endsWith("net-a"))!.v[2]).toBe(-1.5);
      const rim = hoop.planes.find((p) => p.id.endsWith("rim"))!;
      expect(rim.o[2]).toBe(10);
      expect(rim.u[0]).toBeCloseTo(1.5, 5);
    }
    const left = by("hoop-left").planes.find((p) => p.id.endsWith("pad"))!;
    const right = by("hoop-right").planes.find((p) => p.id.endsWith("pad"))!;
    // The front of the padding is 2 m behind the end line (FIBA 1.4.3).
    expect(left.o[0] + left.v[0] / 2 + Math.hypot(...left.v) / 2).toBeCloseTo(-2 * M, 3);
    expect(right.o[0] + right.v[0] / 2 - Math.hypot(...right.v) / 2).toBeCloseTo(94 + 2 * M, 3);
    expect(u.items).toHaveLength(2);
  });

  it("draws FIBA's board 1.80 by 1.05 m with its ring at 3.05 m and the board's lower edge at 2.90 m, 1.20 m in from the end line", () => {
    const { by } = find("nba", { league: "fiba" });
    const hoop = by("hoop-left");
    const board = hoop.planes.find((p) => p.id.endsWith("backboard"))!;
    expect(metres(Math.hypot(...board.u))).toBe(1.8);
    expect(metres(Math.abs(board.v[2]))).toBe(1.05);
    expect(metres(board.o[2] + board.v[2])).toBe(2.9);
    expect(metres(hoop.height)).toBe(3.05);
    expect(metres(board.o[0])).toBe(1.2);
  });

  it("puts the NHL's boards 42 in high with glass 8 ft over them at the ends and 6 ft along the sides, and a goal 6 ft wide and 4 ft high on each goal line", () => {
    const { by } = find("nhl");
    expect(by("boards").height).toBe(3.5);
    expect(by("boards").low).toBe(11.5);
    expect(heights(by("boards"))[1]).toBe(11.5);
    const tops = by("boards").planes.map((p) => p.o[2]);
    expect(new Set(tops)).toEqual(new Set([9.5, 11.5]));
    // The straight sides carry the lower glass, the end boards and the corners the higher.
    const side = by("boards").planes.find((p) => p.u[1] === 0 && p.u[0] > 100 && p.o[1] === 0)!;
    expect(side.o[2]).toBe(9.5);
    const end = by("boards").planes.find((p) => p.u[0] === 0 && p.u[1] > 20)!;
    expect(end.o[2]).toBe(11.5);
    const goal = by("goal-left");
    expect(goal.height).toBe(4);
    expect(goal.at[0]).toBe(11);
    const posts = goal.planes.filter((p) => p.kind === "post" && p.id.includes("post"));
    expect(Math.abs(posts[0].o[1] - posts[2].o[1])).toBeCloseTo(6, 5);
    expect(by("goal-right").at[0]).toBe(189);
  });

  it("leaves the boards out of a rink when asked", () => {
    expect(find("nhl", {}, { boards: false }).u.items.map((item) => item.kind)).toEqual(["goal", "goal"]);
  });

  it("stands a soccer goal 7.32 by 2.44 m on each goal line, and a 1.5 m flag at each corner, until the flags are turned off", () => {
    const { by, u } = find("soccer");
    expect(metres(by("goal-left").height)).toBe(2.44);
    const bar = by("goal-left").planes.find((p) => p.id === "goal-left-bar")!;
    expect(metres(Math.hypot(...bar.u))).toBe(7.32);
    expect(by("goal-left").at[0]).toBe(0);
    expect(by("goal-right").at[0]).toBeCloseTo(105 * M, 3);
    expect(metres(by("flags").height)).toBe(1.5);
    expect(by("flags").planes.filter((p) => p.kind === "pole")).toHaveLength(8);
    expect(find("soccer", { cornerFlags: false }).u.items.some((item) => item.kind === "flags")).toBe(false);
    expect(u.thin).toBeGreaterThan(0);
  });

  it("stands football's posts with a crossbar 10 ft up and uprights 18 ft 6 in apart: 35 ft over it in the NFL, 40 ft above the ground in the CFL, at least 30 in the NCAA", () => {
    const nfl = find("nfl").by("posts-left");
    expect(nfl.low).toBe(10);
    expect(nfl.height).toBe(45);
    const bar = nfl.planes.find((p) => p.id === "posts-left-bar")!;
    expect(Math.hypot(...bar.u)).toBeCloseTo(18.5, 5);
    expect(nfl.at[0]).toBe(0);
    expect(find("cfl").by("posts-left").height).toBe(40);
    expect(find("ifaf").by("posts-left").height).toBe(30);
    // The CFL's posts are on the goal line, 20 yards... 60 feet from the end line.
    expect(find("cfl").by("posts-left").at[0]).toBe(60);
    expect(find("nfl").u.items.find((item) => item.kind === "pylons")!.planes).toHaveLength(16);
  });

  it("stands a baseball park's fence as high as its walls, with a foul pole at each line and a backstop", () => {
    const { by } = find("mlb", { park: "fenway-park" });
    expect(by("fence").low).toBeGreaterThanOrEqual(37);
    expect(by("fence").height).toBeLessThan(by("fence").low!);
    expect(by("foul-poles").planes.filter((p) => p.kind === "pole")).toHaveLength(4);
    expect(by("backstop").height).toBe(20);
    expect(find("mlb").by("fence").height).toBe(8);
  });

  it("stands nothing on a curling sheet", () => {
    expect(find("curling").u.items).toEqual([]);
    expect(describeUprights({ sport: "curling" }, find("curling").u)).toBe("");
  });
});

describe("what stands on the other fields", () => {
  it("puts rugby league's posts 16 m high, and rugby union's crossbar 3 m up with the uprights 3.4 m over it, 5.6 m apart on each try line", () => {
    expect(metres(find("rugby", { league: "nrl" }).by("posts-left").height)).toBe(16);
    const left = find("rugby").by("posts-left");
    expect(metres(left.low ?? 0)).toBe(3);
    expect(metres(left.height)).toBe(6.4);
    const bar = left.planes.find((p) => p.id === "posts-left-bar")!;
    expect(metres(Math.hypot(...bar.u))).toBeCloseTo(5.6, 1);
  });

  it("puts Gaelic football's crossbar 2.5 m up and its posts 7 m high, 6.5 m apart", () => {
    const left = find("gaelic").by("posts-left");
    expect(metres(left.low ?? 0)).toBe(2.5);
    expect(metres(left.height)).toBe(7);
    expect(metres(Math.hypot(...left.planes.find((p) => p.id === "posts-left-bar")!.u))).toBeCloseTo(6.5, 1);
  });

  it("puts two goal posts 6 m high and two behind posts 3 m high at each end of an Australian football ground", () => {
    const left = find("afl").by("posts-left");
    expect(left.planes.filter((p) => p.id.startsWith("goal-post"))).toHaveLength(4);
    expect(left.planes.filter((p) => p.id.startsWith("behind-post"))).toHaveLength(4);
    expect(metres(left.height)).toBe(6);
    expect(metres(left.low ?? 0)).toBe(3);
  });

  it("puts three stumps 28 in high at each end of a cricket pitch", () => {
    const left = find("cricket").by("stumps-left");
    expect(left.height).toBeCloseTo(28 / 12, 5);
    expect(left.planes.filter((p) => p.kind === "stump" && !p.id.endsWith("-x"))).toHaveLength(3);
  });

  it("gives handball a goal 3 by 2 m, field hockey 3.66 by 2.14 m and lacrosse 6 by 6 ft (4 by 4 in a box)", () => {
    expect(metres(find("handball").by("goal-left").height)).toBe(2);
    expect(metres(find("fieldhockey").by("goal-left").height)).toBe(2.14);
    expect(find("lacrosse").by("goal-left").height).toBe(6);
    expect(find("lacrosse", { league: "nll" }).by("goal-left").height).toBe(4);
  });

  it("stands every sport's uprights inside the world: above the floor, and no plane with no size", () => {
    for (const sport of SPORTS) {
      const u = uprightsFor({ sport });
      for (const p of planesOf(u)) {
        const long = Math.hypot(...p.u);
        const wide = Math.hypot(...p.v);
        expect(long, `${sport} ${p.id}`).toBeGreaterThan(0);
        expect(wide, `${sport} ${p.id}`).toBeGreaterThan(0);
        for (const [a, b] of [[0, 0], [1, 1]] as const) expect(p.o[2] + a * p.u[2] + b * p.v[2], `${sport} ${p.id}`).toBeGreaterThanOrEqual(-1e-9);
        expect(p.svg.length).toBeGreaterThan(0);
        expect(p.svg, `${sport} ${p.id}`).not.toMatch(/NaN|undefined|Infinity/);
      }
    }
  });

  it("keeps each sport's planes few: a scene is a handful of elements, not a model", () => {
    for (const sport of SPORTS) expect(planesOf(uprightsFor({ sport })).length, sport).toBeLessThan(80);
  });

  it("says what stands on the surface, with heights in the rulebook's own unit, in English and Japanese", () => {
    const vb = { sport: "volleyball" } as const;
    expect(describeUprights(vb, uprightsFor(vb))).toBe("Standing on it, in the 3D view: net 2.43 metres, net posts 2.55 metres, antennae 3.23 metres.");
    expect(describeUprights(vb, uprightsFor(vb), "ja")).toContain("ネット 2.43 m");
    const nfl = { sport: "nfl" } as const;
    expect(describeUprights(nfl, uprightsFor(nfl))).toContain("posts 45 feet");
    const tennis = { sport: "tennis" } as const;
    expect(describeUprights(tennis, uprightsFor(tennis))).toContain("net 3.5 feet at the posts, 3 feet at the middle");
    // The options' own unit wins.
    expect(describeUprights({ sport: "nba", units: "m" }, uprightsFor({ sport: "nba", units: "m" }))).toContain("3.05 metres");
  });

  it("can leave the uprights out, or keep only some kinds", () => {
    expect(uprightsFor({ sport: "volleyball" }, { only: ["net"] }).items.map((i) => i.kind)).toEqual(["net"]);
  });
});

describe("what stands on the pools", () => {
  it("stands a block 0.7 m high in each lane at each end of a swimming pool, numbered, with a flagged rope 1.8 m up five metres from each wall and the false start rope 1.2 m up at 15 m", () => {
    const { by, u } = find("swimming");
    expect(by("starting-blocks").planes.filter((p) => p.id.endsWith("-top"))).toHaveLength(16);
    expect(metres(by("starting-blocks").height)).toBe(0.7);
    expect(by("starting-blocks").planes[0].svg).toMatch(/>\d<\/text>/);
    expect(metres(by("backstroke-flags").height)).toBe(1.8);
    const flags = by("backstroke-flags").planes.filter((p) => p.id.startsWith("flags-") && p.kind === "tape");
    expect(flags.map((p) => Math.round(p.o[0] / M))).toEqual([5, 45]);
    expect(metres(by("false-start-rope").height)).toBe(1.2);
    expect(Math.round(by("false-start-rope").planes[0].o[0] / M)).toBe(15);
    expect(u.items.map((i) => i.kind)).toEqual(["starting-blocks", "backstroke-flags", "false-start-rope"]);
  });

  it("leaves the blocks, the flags and the rope off a warm-up pool and a natatorium", () => {
    expect(find("swimming", { pool: { kind: "warm-up" } }).u.items).toHaveLength(0);
    expect(find("swimming", { pool: { venue: "natatorium" } }).u.items).toHaveLength(0);
  });

  it("stands the springboards at 1 m and 3 m and the platforms at 5, 7.5 and 10 m of a diving well, each on a stand that reaches the deck", () => {
    const { by } = find("diving");
    expect(metres(by("springboards").height)).toBe(3);
    expect(metres(by("platforms").height)).toBe(10);
    const tops = (id: string): number[] => [...new Set(by(id).planes.filter((p) => p.id.endsWith("-top")).map((p) => metres(p.o[2])))].sort((a, b) => a - b);
    expect(tops("springboards")).toEqual([1, 3]);
    expect(tops("platforms")).toEqual([5, 7.5, 10]);
    expect(heights(by("platforms"))[0]).toBeCloseTo(0, 5);
    expect(heights(by("springboards"))[0]).toBeCloseTo(0, 5);
    expect(find("diving", { pool: { platforms: [1, 3] } }).by("platforms").height).toBeCloseTo(3 * M, 5);
    expect(find("diving", { pool: { springboards: false } }).u.items.map((i) => i.kind)).toEqual(["platforms"]);
  });

  it("stands a floating goal on each goal line of a water polo field, 3 m wide, the underside of the bar 0.9 m over the water", () => {
    const { u } = find("waterpolo");
    expect(u.items.map((i) => i.id)).toEqual(["goal-left", "goal-right"]);
    expect(metres(u.items[0].height)).toBe(0.9);
    const post = u.items[0].planes.filter((p) => p.id.includes("post-"));
    const ys = [...new Set(post.map((p) => Math.round(((p.o[1] + p.u[1] * 0) / M) * 100) / 100))];
    expect(Math.abs(Math.max(...ys) - Math.min(...ys) - 3.08)).toBeLessThan(0.2);
  });

  it("stands the judges' platform 0.6 m and the starting platform 0.7 m high at an artistic swimming area, and says them in words", () => {
    const { by } = find("artisticswimming");
    expect(metres(by("judges-stand").height)).toBe(0.6);
    expect(metres(by("starting-platform").height)).toBe(0.7);
    const o = { sport: "diving" } as const;
    expect(describeUprights(o, uprightsFor(o))).toContain("springboards 3 metres, platforms 10 metres");
    expect(describeUprights(o, uprightsFor(o), "ja")).toContain("飛板 3 m");
    expect(describeUprights({ sport: "swimming" }, uprightsFor({ sport: "swimming" }), "ja")).toContain("スタート台 0.7 m");
  });
});

describe("what stands in an athletics stadium and at a skating rink", () => {
  it("stands the high jump's uprights 4.02 m apart and the pole vault's 5.20 m, each pair with its bar, and the discus and hammer cage with its netting 4 m high and 6 m at the front", () => {
    const { by } = find("athletics");
    expect(by("high-jump").planes.filter((p) => p.id.includes("-upright-") && !p.id.endsWith("-x"))).toHaveLength(4);
    // Two runways, a box and a mat at each end of each: four vaults.
    expect(by("pole-vault").planes.filter((p) => p.id.includes("-upright-") && !p.id.endsWith("-x"))).toHaveLength(8);
    const apart = (id: string, n: number): number => {
      const ps = by(id).planes.filter((p) => p.id.includes("-upright-a") && !p.id.endsWith("-x")).slice(0, n);
      const bs = by(id).planes.filter((p) => p.id.includes("-upright-b") && !p.id.endsWith("-x")).slice(0, n);
      return Math.hypot(ps[0].o[0] - bs[0].o[0], ps[0].o[1] - bs[0].o[1]);
    };
    expect(Math.abs(apart("high-jump", 1) / M - 4.02)).toBeLessThan(0.2);
    expect(Math.abs(apart("pole-vault", 1) / M - 5.2)).toBeLessThan(0.2);
    expect(metres(by("high-jump").height)).toBe(2);
    expect(metres(by("pole-vault").height)).toBe(5);
    const tops = by("cage").planes.map((p) => metres(p.o[2]));
    expect(Math.max(...tops)).toBe(6);
    expect(tops).toContain(4);
    expect(by("cage").planes.filter((p) => metres(p.o[2]) === 6)).toHaveLength(2);
  });

  it("stands hurdles of the height of the race in every lane of the races a drawing marks, and the steeplechase's five barriers and water jump", () => {
    const sprint = find("athletics", { athletics: { races: ["110m-hurdles"] } });
    expect(sprint.by("hurdles").planes).toHaveLength(80);
    expect(metres(sprint.by("hurdles").height)).toBe(1.067);
    expect(metres(find("athletics", { athletics: { races: ["100m-hurdles"] } }).by("hurdles").height)).toBe(0.838);
    expect(metres(find("athletics", { athletics: { races: ["400m-hurdles"] } }).by("hurdles").height)).toBe(0.914);
    const chase = find("athletics", { athletics: { races: ["3000m-steeplechase"] } }).by("steeplechase");
    expect(chase.planes.filter((p) => p.id.includes("barrier"))).toHaveLength(5);
    expect(chase.planes.some((p) => p.id === "water-pit")).toBe(true);
    expect(metres(chase.height)).toBe(0.914);
    expect(find("athletics").u.items.map((i) => i.kind)).not.toContain("hurdles");
  });

  it("puts the padding 0.80 m high round a long or a short track, and a figure skating rink's boards as high as a hockey rink's, with no glass", () => {
    for (const league of [undefined, "isu-short-track"] as const) {
      const { by } = find("skating", league === undefined ? {} : { league });
      expect(metres(by("padding").height)).toBe(0.8);
      expect(by("padding").planes.every((p) => p.shy !== undefined)).toBe(true);
    }
    const figure = find("skating", { league: "isu-figure" }).by("rink-boards");
    expect(figure.height).toBeCloseTo(3.5, 5);
    expect(figure.planes.some((p) => p.kind === "glass")).toBe(false);
    expect(find("skating", { skating: { padding: false } }).u.items).toHaveLength(0);
  });
});

describe("walls that give way to the eye", () => {
  const wallOf = (u: ReturnType<typeof uprightsFor>, id: string) => planesOf(u).find((p) => p.id === id)!;

  it("marks the walls of padel, squash, racquetball and a rink with the way they face out of the surface", () => {
    const squash = uprightsFor({ sport: "squash" });
    const out = (id: string): number[] => wallOf(squash, id).shy!.map((v) => v + 0);
    expect(out("wall-front")).toEqual([-1, 0]);
    expect(out("wall-back")).toEqual([1, 0]);
    expect(out("wall-side-a")).toEqual([0, -1]);
    expect(out("wall-side-b")).toEqual([0, 1]);
    for (const sport of ["padel", "racquetball", "nhl"] as const) expect(planesOf(uprightsFor({ sport })).filter((p) => p.kind === "wall" || p.kind === "glass").every((p) => p.shy !== undefined), sport).toBe(true);
    expect(wallOf(uprightsFor({ sport: "racquetball" }), "wall-front").shy!.map((v) => v + 0)).toEqual([-1, 0]);
  });

  it("cuts away the wall on the eye's side, more the lower the eye, and none from straight above or on the far side", () => {
    const wall = { shy: [1, 0] as const };
    // The eye is on the side a view of yaw 90 looks from: (sin 90, cos 90) = (1, 0).
    expect(fadeOf(wall, 90, 60)).toBeLessThan(0.2);
    expect(fadeOf(wall, 90, 20)).toBeGreaterThan(fadeOf(wall, 90, 60));
    expect(fadeOf(wall, 90, 0)).toBe(1);
    expect(fadeOf(wall, -90, 60)).toBe(1);
    expect(fadeOf({}, 90, 60)).toBe(1);
  });

  it("writes the fade into the layout and the markup of a view, and leaves a floor and a plain plane whole", () => {
    const model = buildTurn({ sport: "squash" }, {});
    const near = layoutOf(model, { yaw: 90, pitch: 60, zoom: 1 }, 960, 600);
    const far = layoutOf(model, { yaw: -90, pitch: 60, zoom: 1 }, 960, 600);
    expect(near.fade[0]).toBe(1);
    expect(Math.min(...near.fade)).toBeLessThan(0.2);
    expect(Math.min(...far.fade.slice(1))).toBeLessThan(1);
    expect(near.fade.length).toBe(model.planes.length + 1);
    expect(turnMarkup({ sport: "squash" }, { preset: "end" })).toMatch(/opacity:/);
  });
});

describe("a crowd and a pageant under the 3D view", () => {
  const game = { home: { name: "Prairie Ridge Bison", abbr: "PRB", score: 2, color: "#a8452c" }, away: { name: "Northern Owls", abbr: "NOW", score: 3, color: "#3a2d6b" }, status: "final" } as const;

  it("draws a drawing with a crowd and a pageant as its floor, with the goals still standing on it", () => {
    const html = turnMarkup({ sport: "soccer", ...game, crowd: true, pageant: "carpet" } as SurfaceOptions);
    expect(html).toContain("ky-crowd");
    expect(html).toContain("data-pageant");
    expect(html).toContain("ky-up");
    expect(uprightsFor({ sport: "soccer", ...game, crowd: true }).items.map((i) => i.kind)).toEqual(expect.arrayContaining(["goal", "flags"]));
  });
});

describe("the score, stood up", () => {
  const game = { home: { name: "Prairie Ridge Bison", abbr: "PRB", score: 2, color: "#a8452c" }, away: { name: "Northern Owls", abbr: "NOW", score: 3, color: "#3a2d6b" }, status: "final" } as const;

  it("hangs a board over the middle of a court or a rink, and stands one behind an end of a field", () => {
    for (const sport of ["nba", "nhl", "volleyball", "tennis"] as const) {
      const board = uprightsFor({ sport, ...game }).items.find((item) => item.kind === "scoreboard")!;
      expect(board, sport).toBeDefined();
      expect(board.at[1], sport).toBeCloseTo(uprightsFor({ sport }).area!.y1 / 2, 3);
      expect(board.height, sport).toBeGreaterThan(10);
    }
    const nfl = uprightsFor({ sport: "nfl", ...game });
    const board = nfl.items.find((item) => item.kind === "scoreboard")!;
    expect(board.at[0]).toBeGreaterThan(nfl.area!.x1);
    // Behind centre field in a ballpark: past the far fence.
    expect(uprightsFor({ sport: "mlb", ...game }).items.find((item) => item.kind === "scoreboard")!.at[1]).toBeLessThan(-300);
  });

  it("is the badge of the score on a plane that turns to face the eye", () => {
    const model = buildTurn({ sport: "nba", ...game }, { preset: "broadcast" });
    const plane = model.planes.find((p) => p.id === "scoreboard")!;
    expect(plane.billboard).toBe(true);
    expect(plane.svg).toContain("NOW");
    expect(plane.svg).toContain("PRB");
    const at0 = layoutOf(model, { yaw: 0, pitch: 60, zoom: 1 }, 900, 560).transforms;
    const at90 = layoutOf(model, { yaw: 90, pitch: 60, zoom: 1 }, 900, 560).transforms;
    const i = model.planes.indexOf(plane) + 1;
    // It faces the eye and hangs over the middle of the court, so a turn moves nothing of it: it is drawn the same at both angles (the scale is one for the whole turn).
    expect(at0[i]).toBe(at90[i]);
    // Faced to the eye, its width runs along the screen's x: (cos yaw, -sin yaw, 0).
    const faced = facing(plane, 90);
    expect(faced.u[0]).toBeCloseTo(0, 5);
    expect(faced.u[1]).toBeCloseTo(-Math.hypot(...plane.u), 5);
    expect(Math.hypot(...faced.u)).toBeCloseTo(Math.hypot(...plane.u), 5);
    expect(faced.v).toEqual(plane.v);
    expect(facing({ ...plane, billboard: undefined }, 90)).toEqual({ ...plane, billboard: undefined });
  });

  it("takes the score's panel off the floor, and leaves it there with `score: \"floor\"`, in a drawing with no score and where there is no board to hang", () => {
    const board = buildTurn({ sport: "nhl", ...game });
    const plate = /class="ky-plate/;
    expect(board.floor).not.toMatch(plate);
    expect(board.floor).toContain("NORTHERN");
    const floor = buildTurn({ sport: "nhl", ...game }, { score: "floor" });
    expect(floor.floor).toMatch(plate);
    expect(floor.planes.some((p) => p.id === "scoreboard")).toBe(false);
    expect(buildTurn({ sport: "nhl" }).planes.some((p) => p.id === "scoreboard")).toBe(false);
    expect(buildTurn({ sport: "nhl", ...game }, { uprights: false }).floor).toMatch(plate);
    // A compact card's strip is the board now.
    expect(buildTurn({ sport: "nhl", ...game, size: "compact" }).floor).not.toMatch(/class="ky-strip/);
  });

  it("is said in the view's description, and a board is not in the way of the fit: it is inside the scene's box", () => {
    expect(describeUprights({ sport: "nba", ...game }, uprightsFor({ sport: "nba", ...game }))).toContain("scoreboard (lower edge)");
    const model = buildTurn({ sport: "nfl", ...game });
    const board = model.planes.find((p) => p.id === "scoreboard")!;
    expect(board.o[0] * model.scale - model.centre[0] * model.scale).toBeLessThanOrEqual(model.box.x1 + 1e-6);
    expect(model.box.z1 / model.scale).toBeGreaterThanOrEqual(Math.max(...[board.o[2]]) - 1e-6);
  });

  it("has a board for a curling sheet too, behind its end", () => {
    expect(uprightsFor({ sport: "curling", ...game }).items.map((i) => i.kind)).toEqual(["scoreboard"]);
  });
});

describe("the eye", () => {
  it("has four named viewpoints, the net sports' lower and from the end, and a sport that is not one gets the usual", () => {
    expect(TURN_PRESET_NAMES).toEqual(["overhead", "broadcast", "end", "corner"]);
    expect(TURN_PRESETS.overhead.pitch).toBe(0);
    expect(presetView("broadcast", "volleyball")).toEqual(NET_PRESETS.broadcast);
    expect(presetView("broadcast", "soccer")).toEqual(TURN_PRESETS.broadcast);
    expect(presetView("broadcast", "nhl")).toEqual(LONG_PRESETS.broadcast);
    expect(LONG_PRESETS.broadcast.yaw).toBeGreaterThan(TURN_PRESETS.broadcast.yaw);
    expect(presetView("broadcast", "curling")).toEqual(CURLING_PRESETS.broadcast);
    // The end and corner views look from the side the score stands on the far side of.
    expect(TURN_PRESETS.end.yaw).toBe(-90);
    expect(TURN_PRESETS.corner.yaw).toBeLessThan(0);
    expect(presetView("nonsense")).toBeUndefined();
    for (const name of TURN_PRESET_NAMES) expect(presetOf(presetView(name, "tennis")!, "tennis")).toBe(name);
    expect(presetOf({ yaw: 12, pitch: 33, zoom: 1 })).toBeUndefined();
  });

  it("holds a view to what the controls allow, and wraps a turn to the nearest way round", () => {
    expect(clampView({ yaw: 190, pitch: 120, zoom: 9 })).toEqual({ yaw: -170, pitch: PITCH_MAX, zoom: ZOOM_MAX });
    expect(clampView({ yaw: 0, pitch: -5, zoom: 0.1 })).toEqual({ yaw: 0, pitch: 0, zoom: ZOOM_MIN });
    expect(clampView({ yaw: Number.NaN, pitch: Number.NaN, zoom: Number.NaN }, { yaw: 10, pitch: 20, zoom: 1 })).toEqual({ yaw: 10, pitch: 20, zoom: 1 });
    expect(wrap(540)).toBe(-180);
    expect(nearest(170, -170)).toBe(190);
    expect(nearest(-170, 170)).toBe(-190);
  });

  it("a drag takes hold of what it moves: right carries the near side right and a drag down brings the near edge down the screen", () => {
    const at = { k: 1, tx: 0, ty: 0 };
    const top: [number, number, number] = [0, 0, 100];
    for (const view of [{ yaw: -38, pitch: 70, zoom: 1 }, { yaw: 0, pitch: 50, zoom: 1 }, { yaw: 120, pitch: 30, zoom: 1 }]) {
      // The point of the floor that faces the eye in this view, straight below the middle of the screen.
      const a = (view.yaw * Math.PI) / 180;
      const near: [number, number, number] = [100 * Math.sin(a), 100 * Math.cos(a), 0];
      const [x0, y0] = project(near, view, at, 2000);
      const right = drag(view, 20, 0);
      expect(project(near, right, at, 2000)[0]).toBeGreaterThan(x0);
      expect(project(near, drag(view, -20, 0), at, 2000)[0]).toBeLessThan(x0);
      const down = drag(view, 0, 20);
      expect(project(near, down, at, 2000)[1]).toBeGreaterThan(y0);
      // The top of a post leans toward the eye: it comes down the screen too.
      expect(project(top, down, at, 2000)[1]).toBeGreaterThan(project(top, view, at, 2000)[1]);
    }
  });

  it("a key and a button toward a side take the view the way a drag toward that side does", () => {
    const v = { yaw: 0, pitch: 50, zoom: 1 };
    const sign = (n: number): number => Math.sign(Math.round(n * 1e6) / 1e6);
    // The deltas of one drag toward each side, and of one step toward it: the same sign, whatever the size.
    const dragged = { left: drag(v, -30, 0), right: drag(v, 30, 0), up: drag(v, 0, -30), down: drag(v, 0, 30) };
    for (const toward of ["left", "right", "up", "down"] as const) {
      const moved = nudge(v, toward, 6);
      expect(sign(moved.yaw - v.yaw), `${toward} yaw`).toBe(sign(dragged[toward].yaw - v.yaw));
      expect(sign(moved.pitch - v.pitch), `${toward} pitch`).toBe(sign(dragged[toward].pitch - v.pitch));
    }
    // And a step toward one side undoes a step toward the other.
    expect(nudge(nudge(v, "left", 6), "right", 6)).toEqual(v);
    expect(nudge(nudge(v, "up", 4), "down", 4)).toEqual(v);
  });

  it("turns with a drag and steps with a key: across turns it, up and down tips it, and a touch that only turns leaves the tip", () => {
    const v = { yaw: 0, pitch: 50, zoom: 1 };
    // The surface is taken hold of: a drag to the right carries the near side to the right, which is a fall of the yaw (project() turns the scene by +yaw clockwise from above).
    expect(drag(v, 100, 0).yaw).toBeCloseTo(-40, 5);
    expect(drag(v, -100, 0).yaw).toBeCloseTo(40, 5);
    expect(drag(v, 0, -40).pitch).toBeGreaterThan(50);
    expect(drag(v, 0, 40).pitch).toBeLessThan(50);
    expect(drag(v, 50, 50, false).pitch).toBe(50);
    expect(step(v, { zoom: 1.2 }).zoom).toBeCloseTo(1.2, 5);
    expect(step(v, { pitch: 100 }).pitch).toBe(PITCH_MAX);
  });

  it("works out one matrix that agrees with the projection of a point", () => {
    const box = { x0: -300, x1: 300, y0: -200, y1: 200, z0: 0, z1: 80 };
    const view = { yaw: 38, pitch: 70, zoom: 1.3 };
    const at = fit(box, { ...view, zoom: 1 }, 900, 560, eyeDistance(900, 560));
    const d = eyeDistance(900, 560);
    const m = cameraMatrix(view, at, d);
    for (const p of [[0, 0, 0], [120, -80, 40], [-300, 200, 80]] as const) {
      const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
      const x = (m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12]) / w;
      const y = (m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13]) / w;
      const [px, py] = project(p, view, at, d);
      expect(x).toBeCloseTo(px, 3);
      expect(y).toBeCloseTo(py, 3);
    }
  });

  it("fits the scene in the box at every viewpoint and every turn, centred over the whole turn", () => {
    const box = { x0: -400, x1: 400, y0: -150, y1: 150, z0: 0, z1: 300 };
    for (const name of TURN_PRESET_NAMES) {
      const d = eyeDistance(800, 500);
      const xs: number[] = [];
      const ys: number[] = [];
      for (const yaw of [0, 33, 90, 135, 180, 270]) {
        const view = { ...TURN_PRESETS[name], yaw };
        const at = fit(box, view, 800, 500, d);
        const corners = [-400, 400].flatMap((x) => [-150, 150].flatMap((y) => [0, 300].map((z) => project([x, y, z], view, at, d))));
        // At every angle the scene is inside the container ...
        expect(Math.max(...corners.map((c) => c[0])) - Math.min(...corners.map((c) => c[0])), `${name} ${yaw}`).toBeLessThanOrEqual(800 + 1);
        expect(Math.max(...corners.map((c) => c[1])) - Math.min(...corners.map((c) => c[1])), `${name} ${yaw}`).toBeLessThanOrEqual(500 + 1);
        xs.push(...corners.map((c) => c[0]));
        ys.push(...corners.map((c) => c[1]));
      }
      // ... and the placement is the one that centres the scene over all of them.
      expect((Math.max(...xs) + Math.min(...xs)) / 2, name).toBeCloseTo(0, -1);
      expect(Math.max(...xs) - Math.min(...xs), name).toBeLessThanOrEqual(800 + 1);
    }
  });
});

describe("the markup", () => {
  const html = turnMarkup({ sport: "volleyball", home: { name: "Harbour City Gulls", score: 3 }, away: { name: "Prairie Ridge Bison", score: 2 }, status: "final" }, { preset: "end", score: "floor" });

  it("holds the flat drawing for a floor and a plane for every part, each with its whole place in one matrix", () => {
    expect(html).toContain('class="ky-turn-floor"');
    expect(html).toContain("<svg");
    expect(html).toContain('data-part="net"');
    expect(html).toContain('data-part="post-a"');
    const model = buildTurn({ sport: "volleyball", home: { name: "Harbour City Gulls", score: 3 }, away: { name: "Prairie Ridge Bison", score: 2 }, status: "final" }, { preset: "end", score: "floor" });
    expect((html.match(/class="ky-up /g) ?? []).length).toBe(model.planes.length);
    expect((html.match(/transform:matrix3d\(/g) ?? []).length).toBe(model.planes.length + 1);
  });

  it("asks nothing of the browser's 3D context: no preserve-3d, no perspective on a parent, and the elements stacked by z-index", () => {
    expect(html).not.toContain("preserve-3d");
    expect(html).not.toMatch(/style="[^"]*perspective:/);
    const stacks = [...html.matchAll(/z-index:(\d+)/g)].map((m) => Number(m[1]));
    expect(stacks[0]).toBe(1);
    const planes = stacks.slice(1);
    expect(new Set(planes).size).toBe(planes.length);
  });

  it("is a group with a name, a role description, keys and a way to hear what stands on it", () => {
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-roledescription="3D view"');
    expect(html).toContain("aria-keyshortcuts=");
    expect(html).toContain('tabindex="0"');
    expect(html).toMatch(/aria-describedby="[^"]+-help"/);
    expect(html).toContain("Standing on it, in the 3D view: net 2.43 metres");
    expect(html).toContain('role="status" aria-live="polite"');
    // The planes are decoration: the drawing under them carries the name and the description.
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('role="img"');
  });

  it("has a button for each viewpoint, one of them pressed, and the controls a finger can hit, and can leave them out", () => {
    for (const word of ["Overhead", "Broadcast", "End-on", "Low corner", "Reset the view", "Zoom in", "Tip the surface away"]) expect(html).toContain(word);
    expect(html).toContain('data-preset="end" aria-pressed="true"');
    expect(html).toContain('data-preset="corner" aria-pressed="false"');
    expect(turnMarkup({ sport: "nhl" }, { controls: false })).not.toContain('class="ky-turn-controls"');
  });

  it("speaks Japanese when asked, and the same options always give the same text", () => {
    const ja = turnMarkup({ sport: "nba", language: "ja" });
    expect(ja).toContain(KYOGIJO_STRINGS.ja.turn.broadcast);
    expect(ja).toContain('lang="ja"');
    expect(turnMarkup({ sport: "nba" })).toBe(turnMarkup({ sport: "nba" }));
  });

  it("is the drawing alone for a badge and when the uprights are off, and draws the whole surface whatever range was asked", () => {
    expect(buildTurn({ sport: "nhl", home: { name: "A", score: 1 }, away: { name: "B", score: 2 }, size: "badge" }).planes).toEqual([]);
    expect(buildTurn({ sport: "nhl", home: { name: "A", score: 1 }, away: { name: "B", score: 2 }, size: "badge" }).turnable).toBe(false);
    expect(buildTurn({ sport: "nhl" }, { uprights: false }).planes).toEqual([]);
    const cropped = buildTurn({ sport: "nhl", range: "left-zone" as never });
    expect(cropped.floor).toBe(drawKyogijo({ sport: "nhl", orientation: "landscape" }));
  });

  it("lays the stack out far to near for the view: from the end the far goal is behind the near one", () => {
    const model = buildTurn({ sport: "nhl" }, { preset: "end" });
    const layout = layoutOf(model, model.view, 900, 560);
    const rank = (prefix: string): number => layout.stack[model.planes.findIndex((p) => p.id.startsWith(prefix)) + 1];
    // Yaw -90 turns the left end of the rink to the near side.
    expect(model.view.yaw).toBe(-90);
    expect(rank("goal-left-post")).toBeGreaterThan(rank("goal-right-post"));
    const other = layoutOf(model, { ...model.view, yaw: 90 }, 900, 560);
    const rank2 = (prefix: string): number => other.stack[model.planes.findIndex((p) => p.id.startsWith(prefix)) + 1];
    expect(rank2("goal-right-post")).toBeGreaterThan(rank2("goal-left-post"));
  });

  it("keeps the floor under everything and a hall's ground under the floor", () => {
    const model = buildTurn({ sport: "tabletennis" });
    const layout = layoutOf(model, model.view, 900, 560);
    const ground = model.planes.findIndex((p) => p.kind === "ground");
    expect(layout.stack[ground + 1]).toBe(0);
    expect(layout.stack[0]).toBe(1);
    expect(Math.min(...layout.stack.filter((_, i) => i !== 0 && i !== ground + 1))).toBeGreaterThan(1);
    expect(planeMatrix(model.planes[0], 2)).toHaveLength(16);
  });
});

describe("the element's 3D attributes", () => {
  const read = (attrs: Record<string, string>) => (name: string): string | null => attrs[name] ?? null;
  it("asks for the view by `turn`, and names its viewpoint, buttons, uprights and touch", () => {
    expect(turnWanted(read({ turn: "" }))).toBe(true);
    expect(turnWanted(read({ turn: "false" }))).toBe(false);
    expect(turnWanted(read({}))).toBe(false);
    expect(turnSettingsFromAttributes(read({ "turn-view": "end", "turn-controls": "false", "turn-uprights": "false", "turn-score": "floor", "turn-touch": "turn" }))).toEqual({ preset: "end", controls: false, uprights: false, score: "floor", touch: "turn" });
    expect(turnSettingsFromAttributes(read({ "turn-view": "sideways" }))).toEqual({});
    expect(turnSettingsFromAttributes(read({ "turn-view": "end" }), { motion: "none" })).toEqual({ preset: "end", motion: "none" });
  });

  it("lists the attributes once each", () => {
    for (const name of ["turn", "turn-view", "turn-controls", "turn-uprights", "turn-score", "turn-touch"]) expect(KYOGIJO_ATTRIBUTES).toContain(name);
    expect(new Set(KYOGIJO_ATTRIBUTES).size).toBe(KYOGIJO_ATTRIBUTES.length);
  });
});
