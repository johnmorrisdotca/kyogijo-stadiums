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

/** The height of a football post's crossbar, 10 feet, and how far the uprights reach over it: the NFL's 35 feet, the others' 20 (the rules give the least). */
export const FOOTBALL_CROSSBAR = 10;

/** A football field's uprights: the post at each end and the eight pylons. `shape` is the post of the season, `above` how far the uprights reach over the crossbar. */
export function footballUprights(spec: FootballSpec, shape: "h" | "slingshot", above: number, thin: number): Upright[] {
  const L = footballLength(spec);
  const W = spec.width;
  const e = spec.endZone;
  const items: Upright[] = [];
  const post = Math.max(thin * 2.6, 0.8);
  for (const end of ["left", "right"] as const) {
    const left = end === "left";
    const x = spec.posts === "end-line" ? (left ? 0 : L) : left ? e : L - e;
    items.push(postPair({ id: `posts-${end}`, x, y: W / 2, out: left ? -1 : 1, gap: spec.postWidth ?? 18.5, crossbar: FOOTBALL_CROSSBAR, top: FOOTBALL_CROSSBAR + above, post, support: shape === "slingshot" ? "slingshot" : "centre", stem: 4, cls: "u-yellow" }));
  }
  if (spec.pylons !== false) {
    // Eight pylons, 18 inches high and 4 across: at the four corners of each end zone.
    const corners: [number, number][] = [[e, 0], [e, W], [L - e, 0], [L - e, W], [0, 0], [0, W], [L, 0], [L, W]];
    const side = Math.max(thin * 1.6, 0.33);
    items.push({ id: "pylons", kind: "pylons", at: [L / 2, W / 2], height: 1.5, planes: corners.flatMap(([x, y], i) => pole(`pylon-${i}`, "pylon", x, y, 0, 1.5, side, "u-orange")) });
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
    // A corner flag is at least 1.5 metres high.
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
      // The crossbar is 3 metres over the ground and the uprights reach at least 3.4 metres over it.
      for (const p of pairs(dots(plan, "goal-post"))) items.push(postPair({ id: p.x < midX ? "posts-left" : "posts-right", x: p.x, y: p.y, out: outOf(p.x), gap: p.gap, crossbar: 3 * M, top: 3 * M + 3.4 * M, post, support: "none", cls: "u-white" }));
      flags(dots(plan, "flag-post", "corner-post"), 1.2 * M, "flags");
      break;
    }
    case "gaelic": {
      // The crossbar is 2.5 metres over the ground; the posts are at least 7 metres high.
      for (const p of pairs(dots(plan, "goalpost"))) items.push(postPair({ id: p.x < midX ? "posts-left" : "posts-right", x: p.x, y: p.y, out: outOf(p.x), gap: p.gap, crossbar: 2.5 * M, top: 7 * M, post, support: "none", cls: "u-white" }));
      flags(dots(plan, "flag"), 1.5 * M, "flags");
      break;
    }
    case "afl": {
      // Two goal posts at least 6 metres high, and a behind post at least 3 metres high either side of them.
      const goals = dots(plan, "goal-post");
      const behinds = dots(plan, "behind-post");
      for (const end of ["left", "right"] as const) {
        const left = end === "left";
        const mine = (p: { x: number }): boolean => (p.x < midX) === left;
        const planes: Plane[] = [
          ...goals.filter(mine).flatMap((p, i) => pole(`goal-post-${i}`, "post", p.x, p.y, 0, 6 * M, post, "u-white")),
          ...behinds.filter(mine).flatMap((p, i) => pole(`behind-post-${i}`, "post", p.x, p.y, 0, 3 * M, post, "u-white")),
        ];
        items.push({ id: `posts-${end}`, kind: "posts", at: [left ? 0 : plan.length, plan.width / 2], height: 6 * M, low: 3 * M, planes });
      }
      break;
    }
    case "cricket": {
      // Three stumps, 28 inches high, across a wicket 9 inches wide.
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
      // The goal: lacrosse 6 by 6 feet on a field and 4 high in a box; field hockey 3.66 by 2.14 metres; handball 3 by 2.
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

/** A ballpark's uprights: the fence, the two foul poles where the foul lines meet it, and the backstop behind home plate. */
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
