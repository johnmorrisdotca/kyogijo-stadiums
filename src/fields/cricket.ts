// The cricket ground's plan, in the frame of a drawing lying wide: x from the left of the boundary, along the pitch, y from the top, in feet. The pitch lies along the ground through its middle, the boundary is the ellipse
// the options give (a circle when one distance is given), and, where the league has one, the fielding restriction's circle is the two semicircles about the middle stumps joined by two straight lines (28.7.2.1).
import { at, bar, line, path, ring, sizeIn } from "../fields.kit.ts";
import type { Area, FieldPlan, Shape } from "../fields.types.ts";
import { cricketInFeet, type CricketLeague } from "../leagues/cricket.ts";
import type { Mark } from "../surfaces/surface.ts";
import type { FieldStyle } from "../types.ts";
import { num } from "../format.ts";
import type { Unit } from "../units.ts";

/** The boundary's distances from the centre of the pitch, in feet: along the pitch and across it. A number is a circle's radius. */
function boundaryOf(range: { min: number; max: number; drawn: number }, field: FieldStyle | undefined, askedUnit: Unit, reportUnit: Unit): { straight: number; square: number } {
  const b = field?.boundary;
  if (b === undefined) return { straight: range.drawn, square: range.drawn };
  if (typeof b === "number") {
    const r = sizeIn(range, b, askedUnit, reportUnit, "The boundary");
    return { straight: r, square: r };
  }
  return { straight: sizeIn(range, b.straight, askedUnit, reportUnit, "The straight boundary"), square: sizeIn(range, b.square, askedUnit, reportUnit, "The square boundary") };
}

/**
 * The plan of a ground: the boundary (a rope), the circle if the league has one and it is not turned off, the pitch (its length between the bowling creases, which are its ends, and its width), and at each end the
 * bowling crease, the popping crease in front of it, the two return creases and the wickets. The creases are drawn as far as the rules say they are marked at least.
 */
export function cricketPlan(league: CricketLeague, field: FieldStyle | undefined, askedUnit: Unit, full: boolean): FieldPlan {
  const s = cricketInFeet(league.dimensions, league.unit);
  const reach = boundaryOf(s.boundary, field, askedUnit, league.unit);
  const L = 2 * reach.straight;
  const W = 2 * reach.square;
  const cx = L / 2;
  const cy = W / 2;
  const p = s.pitchLength / 2;
  const w = s.lineWidth;
  const thin = 0.18;
  const shapes: Shape[] = [ring("boundary", "boundary", cx, cy, cx, cy, { w: 0.7, least: 0.7 })];
  const areas: Area[] = [{ id: "pitch", feature: "pitch", cls: "ky-dirt", rect: [cx - p, cy - s.pitchWidth / 2, cx + p, cy + s.pitchWidth / 2] }];
  const circle = s.circle !== null && field?.circle !== false ? s.circle : null;
  if (circle !== null) {
    shapes.push(path("circle", "circle", `M${num(cx - p)} ${num(cy - circle)}H${num(cx + p)}A${num(circle)} ${num(circle)} 0 0 1 ${num(cx + p)} ${num(cy + circle)}H${num(cx - p)}A${num(circle)} ${num(circle)} 0 0 1 ${num(cx - p)} ${num(cy - circle)}Z`, { w: 0.5, least: 0.5 }));
  }
  for (const sign of [-1, 1]) {
    // The bowling crease at the end of the pitch; the popping crease `poppingCrease` in front of it (towards the middle); the return creases from the popping crease back past the bowling crease.
    const xb = cx + sign * p;
    const xp = xb - sign * s.poppingCrease;
    shapes.push(line("bowling-crease", "creases", xb, cy - s.bowlingCrease / 2, xb, cy + s.bowlingCrease / 2, { w, least: thin }));
    shapes.push(line("popping-crease", "creases", xp, cy - s.poppingEach, xp, cy + s.poppingEach, { w, least: thin }));
    if (full) for (const side of [-1, 1]) shapes.push(line("return-crease", "creases", xp, cy + side * (s.returnOutside + w / 2), xp + sign * s.returnBehind, cy + side * (s.returnOutside + w / 2), { w, least: thin }));
    shapes.push(bar("wicket", "wickets", xb - 0.12, cy - s.wicket / 2, xb + 0.12, cy + s.wicket / 2));
  }
  const pitchBox = at(cx - p - 9, cy - s.pitchWidth / 2 - 18, cx + p + 9, cy + s.pitchWidth / 2 + 18);
  const marks: Mark[] = [
    { id: "boundary", x: cx + cx * Math.cos(Math.PI / 4) * 0.99, y: cy - cy * Math.sin(Math.PI / 4) * 0.99, side: "top" },
    { id: "pitch", x: cx, y: cy + s.pitchWidth / 2, side: "bottom" },
    { id: "bowling-crease", x: cx - p, y: cy - s.bowlingCrease / 2, side: "top" },
    { id: "popping-crease", x: cx + p - s.poppingCrease, y: cy + s.poppingEach, side: "bottom" },
    { id: "return-crease", x: cx - p + s.poppingCrease - s.returnBehind / 2, y: cy - s.returnOutside, side: "top" },
    { id: "wicket", x: cx + p, y: cy, side: "top" },
  ];
  if (circle !== null) marks.push({ id: "thirty-yard-circle", x: cx, y: cy - circle, side: "top" });
  const ranges: Record<string, ReturnType<typeof at> | { left: ReturnType<typeof at>; right: ReturnType<typeof at> }> = { pitch: pitchBox };
  if (circle !== null) ranges.circle = at(cx - p - circle, cy - circle, cx + p + circle, cy + circle);
  return {
    sport: "cricket",
    league: league.id,
    length: L,
    width: W,
    outline: { kind: "ellipse" },
    margin: 9,
    lineWidth: w,
    drawnLine: Math.max(w, L * 0.0012),
    band: L / 21,
    areas,
    shapes,
    goals: [],
    left: { cx: L * 0.1, cy, w: W * 0.5, h: L * 0.05, rot: -90 },
    right: { cx: L * 0.9, cy, w: W * 0.5, h: L * 0.05, rot: 90 },
    plate: { cx, cy: cy + cy * 0.58, w: Math.min(L * 0.5, cx * 1.1), h: Math.min(W * 0.26, cy * 0.5) },
    ranges,
    marks,
  };
}
