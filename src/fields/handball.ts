// The handball court's plan, in the frame of a drawing lying wide: x from the outer edge of the left goal line, y from the outer edge of the top side line, in feet. "All lines on the court are fully part of the area that they
// enclose": the court's 40 by 20 m is to the outer edges of its lines, and the goal-area line's 6 m is to its front edge.
import { METRE, arc, at, box, dot, endZones, line, middlePlate, path, ring, sizeIn } from "../fields.kit.ts";
import type { Area, FieldPlan, GoalPlan, Shape } from "../fields.types.ts";
import { handballInFeet, type HandballLeague } from "../leagues/handball.ts";
import type { Mark } from "../surfaces/surface.ts";
import type { FieldStyle } from "../types.ts";
import type { Unit } from "../units.ts";
import { num } from "../format.ts";

/** The plan of the court. `full` adds the substitution lines' end marks. */
export function handballPlan(league: HandballLeague, field: FieldStyle | undefined, askedUnit: Unit, full: boolean): FieldPlan {
  const s = handballInFeet(league.dimensions, league.unit);
  const L = sizeIn(s.length, field?.length, askedUnit, league.unit, "The length");
  const W = sizeIn(s.width, field?.width, askedUnit, league.unit, "The width");
  const cx = L / 2;
  const cy = W / 2;
  const w = s.lineWidth;
  const h = s.goalWidth / 2;
  const a = s.areaLine / 2;
  const shapes: Shape[] = [box("boundary", "boundary", w / 2, w / 2, L - w / 2, W - w / 2, { w })];
  const areas: Area[] = [];
  const goals: GoalPlan[] = [];
  shapes.push(line("centre-line", "centre-line", cx, 0, cx, W, { w }));
  shapes.push(ring("throw-off-area", "centre-circle", cx, cy, s.throwOff / 2, s.throwOff / 2, { w }));
  const R6 = s.areaDistance - w / 2;
  const R9 = s.areaDistance + s.freeThrowOutside - w / 2;
  for (const [x0, sign, end] of [[0, 1, "left"], [L, -1, "right"]] as const) {
    // The goal-area line: a straight line `areaLine` long, 6 m from the goal line, and quarter circles of 6 m about the posts' rear inner corners.
    shapes.push(line("goal-area-line", "goal-area-line", x0 + sign * R6, cy - a, x0 + sign * R6, cy + a, { w }));
    shapes.push(arc("goal-area-arc", "goal-area-line", x0, cy - a, R6, sign === 1 ? -90 : 180, sign === 1 ? 0 : 270, { w }), arc("goal-area-arc", "goal-area-line", x0, cy + a, R6, sign === 1 ? 0 : 90, sign === 1 ? 90 : 180, { w }));
    areas.push({ id: "goal-area", feature: "goal-areas", cls: "ky-key", d: `M${num(x0)} ${num(cy - a - R6)}A${num(R6)} ${num(R6)} 0 0 ${sign === 1 ? 1 : 0} ${num(x0 + sign * R6)} ${num(cy - a)}V${num(cy + a)}A${num(R6)} ${num(R6)} 0 0 ${sign === 1 ? 1 : 0} ${num(x0)} ${num(cy + a + R6)}Z` });
    // The free-throw line: broken, 3 m outside the goal-area line, segments and spaces of 15 cm, from its middle outwards.
    const dash: [number, number] = [s.freeThrowDash, s.freeThrowDash];
    // The arcs of the free-throw line reach the side lines (the court is 20 m wide, the goal area and the 3 m round it are wider): they stop there.
    const reach = Math.min(1, (cy - a) / R9);
    const ex = x0 + sign * R9 * Math.sqrt(1 - reach * reach);
    const ey = R9 * reach;
    const top = `M${num(x0 + sign * R9)} ${num(cy)}V${num(cy - a)}A${num(R9)} ${num(R9)} 0 0 ${sign === 1 ? 0 : 1} ${num(ex)} ${num(cy - a - ey)}`;
    const bottom = `M${num(x0 + sign * R9)} ${num(cy)}V${num(cy + a)}A${num(R9)} ${num(R9)} 0 0 ${sign === 1 ? 1 : 0} ${num(ex)} ${num(cy + a + ey)}`;
    shapes.push(path("free-throw-line", "free-throw-line", top, { w, dash, least: w }), path("free-throw-line", "free-throw-line", bottom, { w, dash, least: w }));
    shapes.push(line("seven-metre-line", "seven-metre-line", x0 + sign * (s.sevenDistance - w / 2), cy - s.sevenLine / 2, x0 + sign * (s.sevenDistance - w / 2), cy + s.sevenLine / 2, { w }));
    shapes.push(line("four-metre-line", "four-metre-line", x0 + sign * (s.fourDistance - w / 2), cy - s.fourLine / 2, x0 + sign * (s.fourDistance - w / 2), cy + s.fourLine / 2, { w }));
    shapes.push(line("goal-line", "goal-lines", x0 + (sign * s.goalLineWidth) / 2, cy - h, x0 + (sign * s.goalLineWidth) / 2, cy + h, { w: s.goalLineWidth }));
    for (const side of [-1, 1]) shapes.push(dot("goal-post", "goal-posts", x0 + (sign * s.goalLineWidth) / 2, cy + side * h, 0.25, "post"));
    goals.push({ end, x: x0 + (sign * s.goalLineWidth) / 2, y: cy, width: s.goalWidth, depth: s.goalDepth, out: (sign === 1 ? -1 : 1) as 1 | -1 });
  }
  if (full) {
    // The substitution line: a segment of the side line from the centre line to 4.5 m, its end a line across the side line, 15 cm inside it and 15 cm outside.
    for (const sign of [-1, 1]) shapes.push(line("substitution-line", "substitution-lines", cx + sign * s.substitution, W - w - s.substitutionMark, cx + sign * s.substitution, W + s.substitutionMark, { w }));
  }
  const reach = a + R6;
  const zones = endZones(L, W, s.areaDistance, W * 0.5);
  const marks: Mark[] = [
    { id: "sideline", x: L * 0.3, y: 0, side: "top" },
    { id: "goal-line", x: w, y: W * 0.15, side: "top" },
    { id: "centre-line", x: cx, y: W, side: "bottom" },
    { id: "goal-area-line", x: R6, y: cy + a, side: "bottom" },
    { id: "free-throw-line", x: R9, y: cy - a, side: "top" },
    { id: "seven-metre-line", x: s.sevenDistance, y: cy + s.sevenLine / 2, side: "bottom" },
    { id: "four-metre-line", x: s.fourDistance, y: cy - s.fourLine / 2, side: "top" },
    { id: "throw-off-area", x: cx + (s.throwOff / 2) * 0.7, y: cy + (s.throwOff / 2) * 0.7, side: "bottom" },
    { id: "goal", x: 0, y: cy - h, side: "top" },
  ];
  return {
    sport: "handball",
    league: league.id,
    length: L,
    width: W,
    outline: { kind: "rect" },
    margin: 3 * METRE,
    lineWidth: w,
    drawnLine: Math.max(w, L * 0.0017),
    band: 0,
    surfaceFeature: "floor",
    areas,
    shapes,
    goals,
    left: zones.left,
    right: zones.right,
    plate: middlePlate(L, W, L * 0.34, L * 0.17),
    ranges: {
      half: { left: at(0, 0, cx, W), right: at(cx, 0, L, W) },
      "goal-area": { left: at(0, cy - reach, R6 + w / 2, cy + reach), right: at(L - R6 - w / 2, cy - reach, L, cy + reach) },
    },
    marks,
  };
}
