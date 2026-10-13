// The field hockey pitch's plan, in the frame of a drawing lying wide: x from the outer edge of the left back-line, y from the outer edge of the top side-line, in feet. The FIH measures the pitch to the outer edges
// of the back-lines and side-lines (the lines are part of the field), the 22.90 m lines "between the furthest edges", and the circle to its outside edge, so each line is set that far from the edge, by half its width.
import { METRE, arc, at, box, dot, endZones, line, middlePlate, path, sizeIn } from "../fields.kit.ts";
import type { FieldPlan, GoalPlan, Shape } from "../fields.types.ts";
import { fieldHockeyInFeet, type FieldHockeyLeague } from "../leagues/fieldhockey.ts";
import type { Mark } from "../surfaces/surface.ts";
import type { FieldStyle } from "../types.ts";
import type { Unit } from "../units.ts";
import { num } from "../format.ts";

/** The plan of the pitch. `full` adds the broken lines outside the circles, the marks outside the pitch and the flag-posts. */
export function fieldHockeyPlan(league: FieldHockeyLeague, field: FieldStyle | undefined, askedUnit: Unit, full: boolean): FieldPlan {
  const s = fieldHockeyInFeet(league.dimensions, league.unit);
  const L = sizeIn(s.length, field?.length, askedUnit, league.unit, "The length");
  const W = sizeIn(s.width, field?.width, askedUnit, league.unit, "The width");
  const cx = L / 2;
  const cy = W / 2;
  const w = s.lineWidth;
  const h = s.goalWidth / 2;
  const shapes: Shape[] = [box("boundary", "boundary", w / 2, w / 2, L - w / 2, W - w / 2, { w })];
  shapes.push(line("centre-line", "centre-line", cx, 0, cx, W, { w }));
  const goals: GoalPlan[] = [];
  const R = s.circleRadius - w / 2;
  for (const [x0, sign, end] of [[0, 1, "left"], [L, -1, "right"]] as const) {
    shapes.push(line("twenty-three-line", "twenty-three-lines", x0 + sign * (s.twentyThree - w / 2), 0, x0 + sign * (s.twentyThree - w / 2), W, { w }));
    // The circle: a line `circleLine` long whose outside edge is 14.63 m from the back-line, and quarter-circles about the inside front corners of the posts to the back-line.
    shapes.push(line("circle-line", "circle-lines", x0 + sign * R, cy - s.circleLine / 2, x0 + sign * R, cy + s.circleLine / 2, { w }));
    shapes.push(arc("circle-arc", "circle-lines", x0, cy - h, R, sign === 1 ? -90 : 180, sign === 1 ? 0 : 270, { w }), arc("circle-arc", "circle-lines", x0, cy + h, R, sign === 1 ? 0 : 90, sign === 1 ? 90 : 180, { w }));
    shapes.push(dot("penalty-spot", "penalty-spots", x0 + sign * (w + s.spotFrom), cy, s.spot / 2));
    if (full) {
      // The broken line 5 m outside the circle, from the top centre of the circle line: solid sections of 300 mm, gaps of 3 m, run on through the arcs to the back-line.
      const B = s.circleRadius + s.broken.outside - w / 2;
      const dash: [number, number] = [s.broken.solid, s.broken.gap];
      const x = x0 + sign * B;
      const sw = sign === 1 ? 1 : 0;
      shapes.push(path("broken-circle-line", "broken-circle-lines", `M${num(x)} ${num(cy)}V${num(cy - h)}A${num(B)} ${num(B)} 0 0 ${sw ? 0 : 1} ${num(x0)} ${num(cy - h - B)}`, { w, dash, least: w }));
      shapes.push(path("broken-circle-line", "broken-circle-lines", `M${num(x)} ${num(cy)}V${num(cy + h)}A${num(B)} ${num(B)} 0 0 ${sw} ${num(x0)} ${num(cy + h + B)}`, { w, dash, least: w }));
      // Marks outside the pitch: on each side-line at the circle's distance, and on each back-line 5 and 10 m from the nearer goal-post.
      const m = s.mark;
      for (const y of [0, W]) shapes.push(line("side-line-mark", "outside-marks", x0 + sign * (s.circleRadius - w / 2), y - (y === 0 ? m : -m), x0 + sign * (s.circleRadius - w / 2), y, { w }));
      for (const d of s.cornerMarks) for (const side of [-1, 1]) shapes.push(line("back-line-mark", "outside-marks", x0 - sign * m, cy + side * (h + 0.164 + d - w / 2), x0, cy + side * (h + 0.164 + d - w / 2), { w }));
      for (const y of [0, W]) shapes.push(dot("flag-post", "flags", x0, y, 0.3, "post"));
    }
    goals.push({ end, x: x0, y: cy, width: s.goalWidth, depth: s.goalDepth, out: (sign === 1 ? -1 : 1) as 1 | -1 });
  }
  const zones = endZones(L, W, s.twentyThree * 0.45, W * 0.55);
  const marks: Mark[] = [
    { id: "back-line", x: w / 2, y: W * 0.2, side: "top" },
    { id: "sideline", x: L * 0.3, y: 0, side: "top" },
    { id: "centre-line", x: cx, y: W, side: "bottom" },
    { id: "twenty-three-line", x: s.twentyThree - w / 2, y: W, side: "bottom" },
    { id: "shooting-circle", x: R * 0.7, y: cy - h - R * 0.7, side: "top" },
    { id: "penalty-spot", x: w + s.spotFrom, y: cy, side: "bottom" },
    { id: "goal", x: -s.goalDepth / 2, y: cy - h, side: "top" },
  ];
  if (full) marks.push({ id: "broken-circle-line", x: s.circleRadius + s.broken.outside, y: cy, side: "bottom" });
  const reach = h + s.circleRadius;
  return {
    sport: "fieldhockey",
    league: league.id,
    length: L,
    width: W,
    outline: { kind: "rect" },
    margin: 5 * METRE,
    lineWidth: w,
    drawnLine: Math.max(w, L * 0.0009),
    band: L / 20,
    areas: [],
    shapes,
    goals,
    left: zones.left,
    right: zones.right,
    plate: middlePlate(L, W, L * 0.34, L * 0.17),
    ranges: {
      half: { left: at(0, 0, cx, W), right: at(cx, 0, L, W) },
      circle: { left: at(0, cy - reach, s.circleRadius, cy + reach), right: at(L - s.circleRadius, cy - reach, L, cy + reach) },
      "twenty-three": { left: at(0, 0, s.twentyThree, W), right: at(L - s.twentyThree, 0, L, W) },
    },
    marks,
  };
}
