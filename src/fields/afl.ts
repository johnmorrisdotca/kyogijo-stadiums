// The Australian football ground's plan, in the frame of a drawing lying wide: x from the left goal line, y from the top, in feet. The ground is the oval of Law 3.2, cut at each end by the straight line of the
// goal line and the behind lines, between the behind posts; the Boundary Line is the arc from one behind post to the other. A ground's length is the Playing Surface's, goal line to goal line.
import { METRE, arc, at, box, dot, endZones, line, middlePlate, path, poly, ring, sizeIn } from "../fields.kit.ts";
import type { FieldPlan, Shape } from "../fields.types.ts";
import { AFL_GROUNDS, aflInFeet, type AflLeague } from "../leagues/aussie.ts";
import type { Mark } from "../surfaces/surface.ts";
import type { FieldStyle } from "../types.ts";
import { convertLength, type Unit } from "../units.ts";
import { num } from "../format.ts";

const DEG = 180 / Math.PI;

/**
 * Where the Fifty Metre Arc meets the Boundary Line: the angle, in degrees from the direction up the ground, at which a circle of `radius` about the middle of a goal line leaves the oval. The oval has semi-axes `a`
 * along the ground and `b` across it, and the circle's centre is at the end of its long axis cut (the middle of the goal line).
 */
export function arcMeetsBoundary(a: number, b: number, length: number, radius: number): number {
  const cx = length / 2;
  const inside = (theta: number): boolean => {
    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);
    return x >= 0 && ((x - cx) / a) ** 2 + (y / b) ** 2 <= 1;
  };
  let lo = 0;
  let hi = Math.PI / 2;
  if (inside(hi)) return 90;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (inside(mid)) lo = mid;
    else hi = mid;
  }
  return lo * DEG;
}

/** A ground of the options: a named ground's size, else the figures'. `length` and `width` of the options win. */
function groundSize(field: FieldStyle | undefined): { length: number; width: number } | undefined {
  if (field?.ground === undefined) return undefined;
  const ground = AFL_GROUNDS.find((one) => one.id === field.ground);
  if (ground === undefined) throw new Error(`Unknown ground "${field.ground}": use one of ${AFL_GROUNDS.map((one) => one.id).join(", ")}`);
  return { length: convertLength(ground.length, "m", "ft"), width: convertLength(ground.width, "m", "ft") };
}

/** The plan of the ground at the size asked for: a named ground's, a size of the options', or the one drawn (the MCG's). */
export function aflPlan(league: AflLeague, field: FieldStyle | undefined, askedUnit: Unit, full: boolean): FieldPlan {
  const s = aflInFeet(league.dimensions, league.unit);
  const named = groundSize(field);
  const L = field?.length !== undefined ? sizeIn(s.length, field.length, askedUnit, league.unit, "The length") : named !== undefined ? sizeIn(s.length, named.length, "ft", league.unit, "The ground's length") : s.length.drawn;
  const W = field?.width !== undefined ? sizeIn(s.width, field.width, askedUnit, league.unit, "The width") : named !== undefined ? sizeIn(s.width, named.width, "ft", league.unit, "The ground's width") : s.width.drawn;
  const cx = L / 2;
  const cy = W / 2;
  const w = s.lineWidth;
  const half = s.goalPosts / 2 + s.behindPosts;
  // The oval: semi-axes a along and b across, such that at the goal line (x = 0) it is `half` either side of the middle.
  const b = W / 2;
  const a = L / 2 / Math.sqrt(1 - (half / b) ** 2);
  const shapes: Shape[] = [];
  const top = `M0 ${num(cy - half)}A${num(a)} ${num(b)} 0 0 1 ${num(L)} ${num(cy - half)}`;
  const bottom = `M${num(L)} ${num(cy + half)}A${num(a)} ${num(b)} 0 0 1 0 ${num(cy + half)}`;
  shapes.push(path("boundary-line", "boundary", top, { w: w * 1.5 }), path("boundary-line", "boundary", bottom, { w: w * 1.5 }));
  const meet = arcMeetsBoundary(a, b, L, s.fiftyArc);
  const marks: Mark[] = [];
  const g = s.goalPosts / 2;
  for (const [x0, sign] of [[0, 1], [L, -1]] as const) {
    shapes.push(line("goal-line", "goal-lines", x0, cy - g, x0, cy + g, { w: w * 1.5 }));
    for (const side of [-1, 1]) {
      shapes.push(line("behind-line", "goal-lines", x0, cy + side * g, x0, cy + side * half, { w: w * 1.5 }));
      if (full) shapes.push(dot("goal-post", "posts", x0, cy + side * g, 0.5, "post"), dot("behind-post", "posts", x0, cy + side * half, 0.4, "post"));
    }
    // The goal square: two lines at right angles to the goal line, 9 m from each goal post, joined by the kick-off line.
    shapes.push(poly("goal-square", "goal-squares", [[x0, cy - g], [x0 + sign * s.goalSquareDepth, cy - g], [x0 + sign * s.goalSquareDepth, cy + g], [x0, cy + g]], { w }));
    shapes.push(arc("fifty-metre-arc", "arcs", x0, cy, s.fiftyArc, sign === 1 ? -meet : 180 + meet, sign === 1 ? meet : 180 - meet, { w }));
  }
  const q = s.centreSquare / 2;
  shapes.push(box("centre-square", "centre-square", cx - q, cy - q, cx + q, cy + q, { w }));
  shapes.push(ring("ten-metre-circle", "centre-circle", cx, cy, s.tenMetreCircle / 2, s.tenMetreCircle / 2, { w }));
  shapes.push(ring("centre-circle", "centre-circle", cx, cy, s.centreCircle / 2, s.centreCircle / 2, { w }));
  shapes.push(line("centre-circle-line", "centre-circle", cx, cy - s.tenMetreCircle / 2, cx, cy + s.tenMetreCircle / 2, { w }));
  marks.push(
    { id: "boundary-line", x: L * 0.3, y: cy - b * Math.sqrt(1 - ((L * 0.3 - cx) / a) ** 2), side: "top" },
    { id: "goal-line", x: 0, y: cy - half, side: "top" },
    { id: "behind-line", x: 0, y: cy + half, side: "bottom" },
    { id: "goal-square", x: s.goalSquareDepth, y: cy + g, side: "bottom" },
    { id: "centre-square", x: cx - q, y: cy - q, side: "top" },
    { id: "centre-circle", x: cx + (s.tenMetreCircle / 2) * 0.7, y: cy + (s.tenMetreCircle / 2) * 0.7, side: "bottom" },
    { id: "fifty-metre-arc", x: s.fiftyArc, y: cy, side: "top" },
    { id: "goal-posts", x: 0, y: cy - g, side: "top" },
    { id: "behind-posts", x: 0, y: cy + half, side: "bottom" },
  );
  const zones = endZones(L, W, L * 0.12, W * 0.5);
  const reach = s.fiftyArc * Math.sin((meet / DEG));
  return {
    sport: "afl",
    league: league.id,
    length: L,
    width: W,
    outline: { kind: "oval", a, half },
    margin: 5 * METRE,
    lineWidth: w,
    drawnLine: Math.max(w, L * 0.0009),
    band: L / 21,
    areas: [],
    shapes,
    goals: [],
    left: zones.left,
    right: zones.right,
    plate: middlePlate(L, W, L * 0.34, L * 0.17),
    ranges: {
      half: { left: at(0, 0, cx, W), right: at(cx, 0, L, W) },
      "forward-fifty": { left: at(0, cy - reach, s.fiftyArc, cy + reach), right: at(L - s.fiftyArc, cy - reach, L, cy + reach) },
      "centre-square": at(cx - q, cy - q, cx + q, cy + q),
    },
    marks,
  };
}
