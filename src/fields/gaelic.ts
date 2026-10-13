// The Gaelic games' field plan: GAA Rule 1 (football and hurling share the field), in the frame of a drawing lying wide: x from the left end line, y from the top sideline, in feet.
import { METRE, arc, at, box, dashesAlongY, dot, endZones, line, middlePlate, poly, sizeIn } from "../fields.kit.ts";
import type { FieldPlan, Shape } from "../fields.types.ts";
import { gaelicInFeet, type GaelicLeague } from "../leagues/gaelic.ts";
import type { Mark } from "../surfaces/surface.ts";
import type { FieldStyle } from "../types.ts";
import type { Unit } from "../units.ts";

const DEG = 180 / Math.PI;

/**
 * The plan of the field of a code at the size asked for (or the greatest the rules allow). Lines across at 13, 20, 45 (and, in hurling, 65) m from each end line; the 10 m midline, with dashes of 5 m marked out from its
 * ends at intervals of 5 m to the sidelines; the two rectangles in front of each goal; a 13 m arc on each 20 m line; in football, the 40 m arc round the middle of the goal line outside the 20 m line and the penalty point.
 * The dashes start where the midline ends: the rule says they are "marked out from the 10m midline, at intervals of 5m", and does not say whether a gap comes first.
 */
export function gaelicPlan(league: GaelicLeague, field: FieldStyle | undefined, askedUnit: Unit, full: boolean): FieldPlan {
  const s = gaelicInFeet(league.dimensions, league.unit);
  const L = sizeIn(s.length, field?.length, askedUnit, league.unit, "The length");
  const W = sizeIn(s.width, field?.width, askedUnit, league.unit, "The width");
  const cx = L / 2;
  const cy = W / 2;
  const w = s.lineWidth;
  const shapes: Shape[] = [box("boundary", "boundary", 0, 0, L, W, { w })];
  const ends = [{ x0: 0, sign: 1 }, { x0: L, sign: -1 }] as const;
  const half = s.postsApart / 2;
  for (const e of ends) {
    for (const d of s.lines) {
      shapes.push(line("distance-line", "distance-lines", e.x0 + e.sign * d, 0, e.x0 + e.sign * d, W, { w }));
      if (full) for (const y of [0, W]) shapes.push(dot("flag", "flags", e.x0 + e.sign * d, y, 0.4, "post"));
    }
    for (const side of [-1, 1]) shapes.push(dot("goalpost", "posts", e.x0, cy + side * half, 0.45, "post"));
    for (const [name, r] of [["small-rectangle", s.small], ["large-rectangle", s.large]] as const) {
      const y = half + r.outside;
      shapes.push(poly(name, "rectangles", [[e.x0, cy - y], [e.x0 + e.sign * r.depth, cy - y], [e.x0 + e.sign * r.depth, cy + y], [e.x0, cy + y]], { w }));
    }
    const d20 = s.lines[1];
    const centre = e.x0 + e.sign * d20;
    shapes.push(arc("thirteen-metre-arc", "arcs", centre, cy, s.arc, e.sign === 1 ? -90 : 270, e.sign === 1 ? 90 : 90, { w }));
    if (s.footballArc !== null) {
      const t = Math.acos(d20 / s.footballArc) * DEG;
      shapes.push(arc("forty-metre-arc", "arcs", e.x0, cy, s.footballArc, e.sign === 1 ? -t : 180 + t, e.sign === 1 ? t : 180 - t, { w }));
    }
    if (s.penaltyPoint !== null) shapes.push(dot("penalty-point", "penalty-points", e.x0 + e.sign * s.penaltyPoint, cy, 0.3));
  }
  // The half-way line: a solid midline in the middle, and dashes marked out from its ends.
  shapes.push(line("midline", "midline", cx, cy - s.midline / 2, cx, cy + s.midline / 2, { w }));
  const dashes = dashesAlongY("midline-dash", "midline", cx, cy + s.midline / 2, W, s.dash, s.dash, { w });
  shapes.push(...dashes, ...dashes.map((d) => line("midline-dash", "midline", cx, W - d.y1, cx, W - d.y0, { w })));
  const lr = s.large.outside + half;
  const zones = endZones(L, W, s.lines[1], W * 0.5);
  const d20 = s.lines[1];
  const marks: Mark[] = [
    { id: "end-line", x: w / 2, y: W * 0.15, side: "top" },
    { id: "sideline", x: L * 0.3, y: 0, side: "top" },
    { id: "distance-line", x: s.lines[0], y: W, side: "bottom" },
    { id: "distance-line", x: d20, y: 0, side: "top" },
    { id: "distance-line", x: s.lines[2], y: W, side: "bottom" },
    { id: "large-rectangle", x: s.large.depth / 2, y: cy - lr, side: "top" },
    { id: "small-rectangle", x: s.small.depth / 2, y: cy + half + s.small.outside, side: "bottom" },
    { id: "thirteen-metre-arc", x: d20 + s.arc, y: cy, side: "top" },
    { id: "halfway-line", x: cx, y: 0, side: "top" },
    { id: "goal-posts", x: 0, y: cy - half, side: "top" },
  ];
  if (s.footballArc !== null) marks.push({ id: "forty-metre-arc", x: s.footballArc, y: cy + 0.4 * s.footballArc, side: "bottom" }, { id: "penalty-point", x: s.penaltyPoint as number, y: cy, side: "bottom" });
  return {
    sport: "gaelic",
    league: league.id,
    length: L,
    width: W,
    outline: { kind: "rect" },
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
      "large-rectangle": { left: at(0, cy - lr, s.large.depth, cy + lr), right: at(L - s.large.depth, cy - lr, L, cy + lr) },
    },
    marks,
  };
}
