// The lacrosse plans: the box floor of the NLL and of World Lacrosse (boards, the crease, the restraining lines, the face-off circle) and the fields of World Lacrosse, the NCAA and the PLL, in the frame of a
// drawing lying wide: x from the left end line (the end boards, on a floor), y from the top, in feet. Every figure is the league's (leagues/lacrosse.ts); the lines of the women's game follow the rule that
// draws them, and the arcs are solved from the distances the rules give.
import { METRE, arc, at, box, dot, endZones, line, middlePlate, poly, ring, sizeIn } from "../fields.kit.ts";
import type { Area, FieldPlan, GoalPlan, Shape } from "../fields.types.ts";
import type { LacrosseLeague } from "../leagues/lacrosse.ts";
import { lacrosseInFeet } from "../leagues/lacrosse.ts";
import type { Mark } from "../surfaces/surface.ts";
import type { FieldStyle } from "../types.ts";
import type { Unit } from "../units.ts";

const DEG = 180 / Math.PI;

/**
 * Where a ray from a point on the goal line extended (at distance `start` from the middle of the goal line) at 45 degrees to that line meets the circle of radius `radius` about the middle of the goal line: the
 * distance along the ray, and the angle of the meeting point from the middle, in degrees from the direction up the field. The women's game's arc (the NCAA's 8 m arc, World Lacrosse's 11 m marking area) ends there.
 */
export function fortyFiveMeeting(start: number, radius: number): { along: number; angle: number } {
  const c = Math.SQRT1_2;
  // |(t c, start + t c)| = radius.
  const b = 2 * start * c;
  const along = (-b + Math.sqrt(b * b - 4 * (start * start - radius * radius))) / 2;
  return { along, angle: Math.atan2(start + along * c, along * c) * DEG };
}

/** The box floor's goal: the poles of 4 ft 6 in run back from the posts' bases until they meet, so the net is as deep as the apex of that triangle. */
const apexDepth = (pole: number, apart: number): number => Math.sqrt(pole * pole - (apart / 2) ** 2);

/**
 * The plan of a lacrosse surface of a league, at the size asked for (or the one drawn). The goals stand at `goalLine` from each end; the rest follows from the figures of the league's kind: a floor with boards and
 * a crease cut by a flat; the men's fields' crease circle, goal mouth and attack-area lines; the women's goal circle, marking areas and fans; the PLL's two-point arc.
 */
export function lacrossePlan(league: LacrosseLeague, field: FieldStyle | undefined, askedUnit: Unit, full: boolean): FieldPlan {
  const s = lacrosseInFeet(league.dimensions, league.unit);
  const L = sizeIn(s.length, field?.length, askedUnit, league.unit, "The length");
  const W = sizeIn(s.width, field?.width, askedUnit, league.unit, "The width");
  const cx = L / 2;
  const cy = W / 2;
  const w = s.lineWidth;
  const centreW = 2 * w;
  const gl = s.goalLine;
  const isBox = s.kind === "box";
  const goalDepth = isBox ? apexDepth(s.netDepth, s.goalWidth) : s.netDepth;
  const shapes: Shape[] = [];
  const areas: Area[] = [];
  const goals: GoalPlan[] = [];
  const marks: Mark[] = [];
  // One end at a time, drawn at the left (`sign` 1, x measured from the end line) and the right (`sign` -1).
  const ends = [{ end: "left" as const, sign: 1, x0: 0 }, { end: "right" as const, sign: -1, x0: L }];
  const X = (e: { sign: number; x0: number }, d: number): number => e.x0 + e.sign * d;
  const angle = (e: { sign: number }, a: number): number => (e.sign === 1 ? a : 180 - a);

  // A floor is bounded by its boards, drawn as a frame; a field by its lines.
  if (!isBox) shapes.push(box("boundary", "boundary", 0, 0, L, W, { w }));
  shapes.push(line("centre-line", "centre-line", cx, 0, cx, W, { w: centreW }));
  for (const e of ends) {
    const gx = X(e, gl);
    shapes.push(line("goal-line", "goal-lines", gx, cy - s.goalWidth / 2, gx, cy + s.goalWidth / 2, { w }));
    for (const sign of [-1, 1]) shapes.push(dot("goal-post", "goal-posts", gx, cy + (sign * s.goalWidth) / 2, Math.max(w * 1.2, 0.18), "post"));
    goals.push({ end: e.end, x: gx, y: cy, width: s.goalWidth, depth: goalDepth, out: (e.sign === 1 ? -1 : 1) as 1 | -1 });
    if (s.crease !== null && isBox) {
      // The crease: a circle about the middle of the goal line, cut by a flat one foot behind the apex of the goal's poles.
      const flat = goalDepth + (s.creaseFlat as number);
      const half = Math.acos(-flat / s.crease) * DEG;
      const cw = s.creaseLine as number;
      shapes.push(arc("crease", "crease", gx, cy, s.crease - cw / 2, angle(e, -half), angle(e, half), { w: cw }));
      const fy = Math.sqrt(s.crease * s.crease - flat * flat);
      shapes.push(line("crease-flat", "crease", gx - e.sign * flat, cy - fy, gx - e.sign * flat, cy + fy, { w: cw }));
    } else if (s.crease !== null) shapes.push(ring("crease", "crease", gx, cy, s.crease, s.crease, { w }));
    if (s.goalMouth !== null) shapes.push(arc("goal-mouth", "crease", gx, cy, s.goalMouth, angle(e, -90), angle(e, 90), { w }));
    if (s.goalCircle !== null) shapes.push(ring("goal-circle", "crease", gx, cy, s.goalCircle, s.goalCircle, { w }));
    if (s.restraining !== null) shapes.push(line("restraining-line", "restraining-lines", X(e, gl + s.restraining), 0, X(e, gl + s.restraining), W, { w }));
    if (s.restrainingFromCentre !== null) shapes.push(line("restraining-line", "restraining-lines", cx - e.sign * s.restrainingFromCentre, 0, cx - e.sign * s.restrainingFromCentre, W, { w }));
    if (s.attackHalf !== null && s.attackFrom !== null) {
      const ax = X(e, gl + s.attackFrom);
      for (const sign of [-1, 1]) shapes.push(line("attack-area-line", "restraining-lines", ax, cy + sign * s.attackHalf, e.x0, cy + sign * s.attackHalf, { w }));
    }
    if (s.semicircle !== null) shapes.push(arc("marking-area", "arcs", gx, cy, s.semicircle, angle(e, -90), angle(e, 90), { w }));
    if (s.arcFan !== null && s.goalCircle !== null) {
      // From where the goal line extended meets the goal circle, a line at 45 degrees to it out to the arc, which runs between the two meeting points.
      const meet = fortyFiveMeeting(s.goalCircle, s.arcFan);
      for (const sign of [-1, 1]) {
        const ex = gx + e.sign * meet.along * Math.SQRT1_2;
        shapes.push(line("forty-five-line", "arcs", gx, cy + sign * s.goalCircle, ex, cy + sign * (s.goalCircle + meet.along * Math.SQRT1_2), { w }));
      }
      shapes.push(arc("fan", "arcs", gx, cy, s.arcFan, angle(e, -meet.angle), angle(e, meet.angle), { w }));
      // World Lacrosse marks the goal line extended from the goal circle to the marking area.
      if (league.id === "world-women") for (const sign of [-1, 1]) shapes.push(line("goal-line-extended", "arcs", gx, cy + sign * s.goalCircle, gx, cy + sign * (s.semicircle as number), { w }));
    }
    if (s.twoPoint !== null) {
      // The two-point arc: from the goal line extended, 13 yards from the middle of the goal line, parallel to the sideline until it is 15 yards from the middle, then an arc of 15 yards across the field; and a line from each end of it to the end line.
      const g = s.twoPoint.gle;
      const r = s.twoPoint.radius;
      const dx = Math.sqrt(r * r - g * g);
      const phi = Math.asin(g / r) * DEG;
      for (const sign of [-1, 1]) {
        shapes.push(line("two-point-line", "arcs", e.x0, cy + sign * g, X(e, gl + dx), cy + sign * g, { w: centreW }));
      }
      shapes.push(arc("two-point-arc", "arcs", gx, cy, r, angle(e, -phi), angle(e, phi), { w: centreW }));
    }
    if (isBox) {
      // The corner face-off spots: 5 yards from the boards and 5 yards inside the restraining lines.
      const sx = cx - e.sign * ((s.restrainingFromCentre as number) + (s.cornerSpotInside as number));
      if (full) for (const y of [s.cornerSpotWall as number, W - (s.cornerSpotWall as number)]) shapes.push(dot("face-off-spot", "face-off-spots", sx, y, 0.35));
    }
  }
  if (isBox) {
    shapes.push(ring("face-off-circle", "face-off-circles", cx, cy, s.faceOffOuter as number, s.faceOffOuter as number, { w }));
    if (full) shapes.push(ring("face-off-dotted-circle", "face-off-circles", cx, cy, s.faceOffInner as number, s.faceOffInner as number, { w: w, dash: [0.12, 0.12] }));
    areas.push({ id: "boards", feature: "boards", cls: "ky-boards", frame: { x0: 0, y0: 0, x1: L, y1: W, radius: s.cornerRadius as number, thick: 1.5 } });
  }
  if (s.wings !== null) for (const sign of [-1, 1]) shapes.push(line("wing-line", "wing-lines", cx - s.wings.half, cy + sign * s.wings.from, cx + s.wings.half, cy + sign * s.wings.from, { w }));
  if (s.centreCircle !== null) shapes.push(ring("centre-circle", "centre-circle", cx, cy, s.centreCircle, s.centreCircle, { w }));
  if (s.centreLine !== null) shapes.push(line("centre-mark-line", "centre-line", cx, cy - s.centreLine / 2, cx, cy + s.centreLine / 2, { w: centreW }));
  if (s.kind === "men") {
    // The centre: an X (World Lacrosse) or a 4-inch square, drawn small.
    const k = 0.35;
    shapes.push(poly("centre-x", "centre-line", [[cx - k, cy - k], [cx + k, cy + k]], { w }), poly("centre-x", "centre-line", [[cx - k, cy + k], [cx + k, cy - k]], { w }));
  }

  const depth = Math.max(gl + (s.restraining ?? 0) * 0.5, L * 0.1);
  const zones = endZones(L, W, depth, W * 0.8);
  marks.push(
    { id: "end-line", x: w / 2, y: W * 0.2, side: "top" },
    { id: "sideline", x: L * 0.3, y: 0, side: "top" },
    { id: "centre-line", x: cx, y: W, side: "bottom" },
    { id: "goal", x: gl, y: cy - s.goalWidth / 2, side: "top" },
    { id: "crease", x: gl + (s.crease ?? s.goalCircle ?? 0) * 0.7, y: cy + (s.crease ?? s.goalCircle ?? 0) * 0.7, side: "bottom" },
  );
  if (s.restraining !== null) marks.push({ id: "restraining-line", x: gl + s.restraining, y: W, side: "bottom" });
  if (s.restrainingFromCentre !== null) marks.push({ id: "restraining-line", x: cx - s.restrainingFromCentre, y: W, side: "bottom" });
  if (isBox) marks.push({ id: "boards", x: L * 0.12, y: W, side: "bottom" }, { id: "face-off-circle", x: cx + (s.faceOffOuter as number) * 0.7, y: cy - (s.faceOffOuter as number) * 0.7, side: "top" });
  if (s.wings !== null) marks.push({ id: "wing-line", x: cx, y: cy - s.wings.from, side: "top" });
  if (s.twoPoint !== null) marks.push({ id: "two-point-arc", x: gl + s.twoPoint.radius, y: cy, side: "top" });
  if (s.semicircle !== null) marks.push({ id: "marking-area", x: gl + s.semicircle, y: cy, side: "top" });
  if (s.centreCircle !== null) marks.push({ id: "centre-circle", x: cx + s.centreCircle * 0.7, y: cy + s.centreCircle * 0.7, side: "bottom" });
  const crease = Math.max(s.crease ?? 0, s.goalCircle ?? 0, s.goalMouth ?? 0);
  return {
    sport: "lacrosse",
    league: league.id,
    length: L,
    width: W,
    outline: { kind: "rect", radius: isBox ? (s.cornerRadius as number) : undefined },
    margin: isBox ? 6 : 5 * METRE,
    lineWidth: w,
    drawnLine: Math.max(w, L * 0.0009),
    band: isBox ? 0 : L / 20,
    areas,
    shapes,
    goals,
    left: zones.left,
    right: zones.right,
    plate: middlePlate(L, W, L * 0.34, L * 0.17),
    ranges: {
      half: { left: at(0, 0, cx, W), right: at(cx, 0, L, W) },
      crease: { left: at(0, cy - crease - 1, gl + crease + 1, cy + crease + 1), right: at(L - gl - crease - 1, cy - crease - 1, L, cy + crease + 1) },
    },
    marks,
  };
}
