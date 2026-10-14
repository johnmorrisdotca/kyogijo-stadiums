// What stands on the pitches and fields: football's posts and pylons, a soccer pitch's goals and corner flags, the goals of handball, field hockey and
// lacrosse, the posts of rugby, Australian football and Gaelic games, a cricket ground's stumps, a ballpark's fence, foul poles and backstop. Where a plan
// already says where a post stands (the field sports', in `shapes`), the 3D post stands there; the heights are the rulebooks' and are cited where they are set.
import type { FieldPlan } from "./fields.types.ts";
import { FEET_PER_METRE, fenceAt, footballLength, type FencePoint, type FootballSpec } from "./geometry.ts";
import { fenceOutline } from "./surfaces/baseball.ts";
import type { SoccerSpec } from "./surfaces/soccer-spec.ts";
import { flagPole, goalCage, postPair } from "./uprights.goal.ts";
import type { ParkWall } from "./parks.ts";
import { mesh, n, pole, threads, wall, type Plane, type Upright } from "./turn.kit.ts";

const M = FEET_PER_METRE;

/**
 * The crossbar of a football post is 10 ft over the ground (NFL 2026 Rule 1-3-1: "the top face of which is 10 feet above the ground"; CFL 2026 Rule 1-1-1:
 * "a height of 10 feet"; NCAA 2025 Rule 1-2-5-a: "the top of which is 10 feet above the ground"). The uprights reach 35 ft over the bar in the NFL (Rule 1-3-2: 45 ft
 * in all), 40 ft above the ground in the CFL (Rule 1-1-1: "extend 40 feet above ground level"), and at least 30 ft above the ground in the NCAA (Rule 1-2-5-a), the
 * figure drawn for every other league.
 */
export const FOOTBALL_CROSSBAR = 10;
/** The pylon is 18 in high: the NFL's Rule 1-2-3 names pylons but not their size; BAFA's Appendix D (14) recommends 4 in by 4 in and 18 in. */
export const PYLON_HEIGHT = 1.5;

/** A football field's uprights: the post at each end and the eight pylons. `shape` is the post of the season, `top` the height of the uprights above the ground. */
export function footballUprights(spec: FootballSpec, shape: "h" | "slingshot", top: number, thin: number): Upright[] {
  const L = footballLength(spec);
  const W = spec.width;
  const e = spec.endZone;
  const items: Upright[] = [];
  const post = Math.max(thin * 2.6, 0.8);
  for (const end of ["left", "right"] as const) {
    const left = end === "left";
    const x = spec.posts === "end-line" ? (left ? 0 : L) : left ? e : L - e;
    items.push(postPair({ id: `posts-${end}`, x, y: W / 2, out: left ? -1 : 1, gap: spec.postWidth ?? 18.5, crossbar: FOOTBALL_CROSSBAR, top, post, support: shape === "slingshot" ? "slingshot" : "centre", stem: 4, cls: "u-yellow" }));
  }
  if (spec.pylons !== false) {
    // Eight pylons: at the four corners of the goal lines and two on each end line (NFL Rule 1-2-3), as the drawing puts them.
    const corners: [number, number][] = [[e, 0], [e, W], [L - e, 0], [L - e, W], [0, 0], [0, W], [L, 0], [L, W]];
    const side = Math.max(thin * 1.6, 0.33);
    items.push({ id: "pylons", kind: "pylons", at: [L / 2, W / 2], height: PYLON_HEIGHT, planes: corners.flatMap(([x, y], i) => pole(`pylon-${i}`, "pylon", x, y, 0, PYLON_HEIGHT, side, "u-orange")) });
  }
  return items;
}

/** A soccer pitch's uprights: both goals and, unless the options turn them off, the four corner flags. */
export function soccerUprights(spec: SoccerSpec, flags: boolean, thin: number): Upright[] {
  const L = spec.length * M;
  const W = spec.width * M;
  const items: Upright[] = [];
  const depth = spec.goalDepth * M;
  for (const end of ["left", "right"] as const) {
    const left = end === "left";
    items.push(goalCage({ id: `goal-${end}`, x: left ? 0 : L, y: W / 2, out: left ? -1 : 1, width: spec.goalWidth * M, height: spec.goalHeight * M, depth, top: depth * 0.55, post: Math.max(thin * 1.3, 0.35), cell: Math.max(thin * 6, 0.9), tone: "white" }));
  }
  if (flags) {
    // A corner flagpost is at least 1.5 m (5 ft) high (IFAB Laws of the Game 2025/26, Law 1, section 8); the goal is 7.32 m wide and 2.44 m to the crossbar's lower edge (section 10).
    const planes: Plane[] = [[0, 0], [L, 0], [0, W], [L, W]].flatMap(([x, y], i) => flagPole(`flag-${i}`, x, y, 1.5 * M, Math.max(thin * 0.9, 0.15)));
    items.push({ id: "flags", kind: "flags", at: [L / 2, W / 2], height: 1.5 * M, planes });
  }
  return items;
}

/** The dots of a plan with these ids: the posts, flags and stumps the plan places. */
const dots = (plan: FieldPlan, ...ids: string[]): { x: number; y: number }[] => plan.shapes.flatMap((s) => (s.kind === "dot" && ids.includes(s.id) ? [{ x: s.cx, y: s.cy }] : []));

/** The pairs of posts a plan places by their x: two dots at one x, the uprights of one end. */
function pairs(points: readonly { x: number; y: number }[]): { x: number; y: number; gap: number }[] {
  const by = new Map<string, { x: number; y: number }[]>();
  for (const p of points) by.set(n(p.x), [...(by.get(n(p.x)) ?? []), p]);
  return [...by.values()].filter((list) => list.length === 2).map(([a, b]) => ({ x: a.x, y: (a.y + b.y) / 2, gap: Math.abs(a.y - b.y) }));
}

/** The rugby posts, Gaelic goal posts, Australian football posts and cricket stumps; a goal with a net for the sports that have one. */
export function fieldUprights(plan: FieldPlan, thin: number): Upright[] {
  const items: Upright[] = [];
  const post = Math.max(thin * 1.4, 0.3);
  const midX = plan.length / 2;
  const outOf = (x: number): 1 | -1 => (x < midX ? -1 : 1);
  const flags = (points: { x: number; y: number }[], height: number, id: string): void => {
    if (points.length === 0) return;
    items.push({ id, kind: "flags", at: [midX, plan.width / 2], height, planes: points.flatMap((p, i) => flagPole(`${id}-${i}`, p.x, p.y, height, Math.max(thin * 0.9, 0.15))) });
  };
  switch (plan.sport) {
    case "rugby": {
      // Union (World Rugby 2026 Law 1, goal posts and crossbar): the crossbar's top edge 3 m over the ground, a minimum post height of 3.4 m, which the Law's diagram
      // draws over the bar and is drawn so (6.4 m); the flag posts at least 1.2 m (Law 1, flag posts 8). League (NRL Section 18, IRL Section 1): posts 16 m high.
      const league = plan.league === "nrl" || plan.league === "irl";
      for (const p of pairs(dots(plan, "goal-post"))) items.push(postPair({ id: p.x < midX ? "posts-left" : "posts-right", x: p.x, y: p.y, out: outOf(p.x), gap: p.gap, crossbar: 3 * M, top: league ? 16 * M : 3 * M + 3.4 * M, post, support: "none", cls: "u-white" }));
      flags(dots(plan, "flag-post", "corner-post"), 1.2 * M, "flags");
      break;
    }
    case "gaelic": {
      // GAA Official Guide Part 2 (2026) Rule 1.3 (i), (ii): posts not less than 7 m above the ground and 6.5 m apart, the crossbar 2.5 m above the ground. Rule 1.7 gives
      // the flags no height; 1.5 m is ours.
      for (const p of pairs(dots(plan, "goalpost"))) items.push(postPair({ id: p.x < midX ? "posts-left" : "posts-right", x: p.x, y: p.y, out: outOf(p.x), gap: p.gap, crossbar: 2.5 * M, top: 7 * M, post, support: "none", cls: "u-white" }));
      flags(dots(plan, "flag"), 1.5 * M, "flags");
      break;
    }
    case "afl": {
      // Laws of Australian Football 2026, Law 3.3.1: goal posts 6 to 15 m high and 6.4 m apart, behind posts 3 to 10 m high, 6.4 m either side of them: the least is drawn.
      const goals = dots(plan, "goal-post");
      const behinds = dots(plan, "behind-post");
      for (const end of ["left", "right"] as const) {
        const left = end === "left";
        const mine = (p: { x: number }): boolean => (p.x < midX) === left;
        const planes: Plane[] = [
          ...goals.filter(mine).flatMap((p, i) => pole(`goal-post-${i}`, "post", p.x, p.y, 0, 6 * M, post, "u-white")),
          ...behinds.filter(mine).flatMap((p, i) => pole(`behind-post-${i}`, "post", p.x, p.y, 0, 3 * M, post, "u-white")),
        ];
        items.push({ id: `posts-${end}`, kind: "goalposts", at: [left ? 0 : plan.length, plan.width / 2], height: 6 * M, low: 3 * M, planes });
      }
      break;
    }
    case "cricket": {
      // MCC Laws of Cricket, Law 8.1 and 8.2: three stumps across a wicket 9 in wide, their tops 28 in over the playing surface.
      for (const s of plan.shapes) {
        if (s.kind !== "bar" || s.id !== "wicket") continue;
        const x = (s.x0 + s.x1) / 2;
        const ys = [s.y0, (s.y0 + s.y1) / 2, s.y1];
        items.push({ id: x < midX ? "stumps-left" : "stumps-right", kind: "stumps", at: [x, (s.y0 + s.y1) / 2], height: 28 / 12, planes: ys.flatMap((y, i) => pole(`stump-${i}`, "stump", x, y, 0, 28 / 12, Math.max(thin * 0.9, 0.12), "u-wood")) });
      }
      break;
    }
    case "lacrosse":
    case "fieldhockey":
    case "handball": {
      // The goal: World Lacrosse 6 ft apart and high on a field, 4 ft high in a box; FIH 2.14 m to the crossbar's lower edge; IHF interior height 2 m (docs/sources.md).
      const box = plan.league === "nll" || plan.league === "world-box";
      for (const g of plan.goals) {
        const height = plan.sport === "lacrosse" ? (box ? 4 : 6) : plan.sport === "handball" ? 2 * M : 2.14 * M;
        items.push(goalCage({ id: `goal-${g.end}`, x: g.x, y: g.y, out: g.out, width: g.width, height, depth: g.depth, top: g.depth * (plan.sport === "lacrosse" ? 0.7 : 0.85), post: Math.max(thin * 1.3, 0.3), cell: Math.max(thin * 6, 0.5), tone: "white" }));
      }
      break;
    }
    default:
  }
  return items;
}

/** The fence's height where no wall is listed: 8 feet. */
export const FENCE_HEIGHT = 8;

/** How high the wall stands at an angle from dead centre, the wall that names it or the usual 8 feet. */
export const wallHeightAt = (walls: readonly ParkWall[], angle: number): number => walls.find((w) => angle >= Math.min(w.from, w.to) && angle <= Math.max(w.from, w.to))?.height_ft ?? FENCE_HEIGHT;

/** The planes of a fence: one standing wall over each stretch of its line, as high as the wall there. */
export function fencePlanes(points: readonly FencePoint[], walls: readonly ParkWall[], thin: number): Plane[] {
  const line = fenceOutline(points, 3).map(([u, v]): [number, number] => [u, -v]);
  const planes: Plane[] = [];
  for (let i = 0; i < line.length - 1; i += 1) {
    const [x0, y0] = line[i];
    const [x1, y1] = line[i + 1];
    const run = Math.hypot(x1 - x0, y1 - y0);
    if (run < 1e-6) continue;
    const angle = Math.atan2((x0 + x1) / 2, -(y0 + y1) / 2) * (180 / Math.PI);
    const height = wallHeightAt(walls, angle);
    planes.push(wall(`fence-${i}`, "wall", x0, y0, x1, y1, 0, height, `<rect width="${n(run)}" height="${n(height)}" class="u-wall"/><rect width="${n(run)}" height="${n(Math.max(thin * 0.8, 0.2))}" class="u-cap"/>`));
  }
  return planes;
}

/**
 * A ballpark's uprights: the fence, the two foul poles where the foul lines meet it, and the backstop behind home plate. Official Baseball Rules 2025, 2.01, gives no height
 * for a fence or a foul pole, and only recommends the backstop 60 ft or more from home base: the 8 ft of the fence where no wall is listed, the poles' 30 ft and the
 * screen's 70 ft by 20 ft are ours.
 */
export function ballparkUprights(points: readonly FencePoint[], walls: readonly ParkWall[], thin: number): Upright[] {
  const items: Upright[] = [];
  const fence = fencePlanes(points, walls, thin);
  const tops = fence.map((p) => -p.v[2]);
  items.push({ id: "fence", kind: "fence", at: [0, -400], height: Math.min(...tops), low: Math.max(...tops), planes: fence });
  const poles: Plane[] = [];
  // The foul poles stand where the foul lines meet the fence, 45 degrees either side of dead centre.
  for (const angle of [-45, 45]) {
    const d = fenceAt(points, angle);
    const t = (angle * Math.PI) / 180;
    poles.push(...pole(`foul-pole-${angle < 0 ? "left" : "right"}`, "pole", d * Math.sin(t), -d * Math.cos(t), 0, 30, Math.max(thin * 1.6, 0.5), "u-yellow"));
  }
  items.push({ id: "foul-poles", kind: "foul-poles", at: [0, -330], height: 30, planes: poles });
  // The backstop: the rules put it at least 60 feet behind home plate. A screen 70 feet wide and 20 high.
  items.push({ id: "backstop", kind: "backstop", at: [0, 60], height: 20, planes: [wall("backstop", "screen", -35, 60, 35, 60, 0, 20, `<rect width="70" height="20" class="u-netfill"/>${threads(mesh(70, 20, 3), 3)}`)] });
  return items;
}
