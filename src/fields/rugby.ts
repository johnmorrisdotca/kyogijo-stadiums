// The rugby field's plan: World Rugby's Law 1 (union) and the NRL's and the IRL's playing field (league), in the frame of a drawing lying wide: x from the left dead-ball line, y from the top touchline, in feet.
// Where a size is asked for inside the range the rules allow, the lines that "reduce accordingly" (Law 1.3 c and d) are reduced in proportion: the Law says that they are, not by how much.
import { METRE, at, box, dashesAlongX, dot, endZones, line, middlePlate, sizeIn } from "../fields.kit.ts";
import type { FieldPlan, Shape } from "../fields.types.ts";
import { rugbyInFeet, type RugbyLeague } from "../leagues/rugby.ts";
import type { Mark } from "../surfaces/surface.ts";
import type { FieldStyle } from "../types.ts";
import type { Unit } from "../units.ts";

/**
 * The plan of a rugby field of a league, at the size asked for (or the one drawn). `full` adds the flag posts. Union: the half-way line, the 22-metre lines, the 10-metre dash lines, the dash lines 5 and
 * 15 m from the touchlines and 5 m from the try lines (each dash 5 m, set where Law 1's ground diagram puts them), the half-way mark and the goal posts. League: a line across the field at every 10 m, the 20 m and 40 m
 * lines red where the league has them, the scrum lines, and the goal posts.
 */
export function rugbyPlan(league: RugbyLeague, field: FieldStyle | undefined, askedUnit: Unit, full: boolean): FieldPlan {
  const s = rugbyInFeet(league.dimensions, league.unit);
  const len = sizeIn(s.length, field?.length, askedUnit, league.unit, "The length");
  const wid = sizeIn(s.width, field?.width, askedUnit, league.unit, "The width");
  const ing = sizeIn(s.inGoal, field?.inGoal, askedUnit, league.unit, "The in-goal depth");
  const L = len + 2 * ing;
  const W = wid;
  const cx = L / 2;
  const cy = W / 2;
  const t0 = ing;
  const t1 = ing + len;
  const w = s.lineWidth;
  const shapes: Shape[] = [box("dead-ball-line", "boundary", 0, 0, L, W, { w })];
  for (const x of [t0, t1]) for (const sign of [-1, 1]) shapes.push(dot("goal-post", "posts", x, cy + (sign * s.postsApart) / 2, Math.max(w * 0.9, 0.2), "post"));
  for (const x of [t0, t1]) shapes.push(line("try-line", "try-lines", x, 0, x, W, { w }));
  let marks: Mark[];
  let twenty: number;

  if (s.code === "union") {
    const lengthRatio = len / s.length.max;
    const widthRatio = wid / s.width.max;
    const d22 = (s.twentyTwo as number) * lengthRatio;
    const d10 = (s.tenFromHalfway as number) * lengthRatio;
    const dash = s.dash as number;
    const t5 = s.dashFromTry as number;
    const [a5, a15] = s.dashFromTouch;
    const near15 = a15 * widthRatio;
    twenty = d22;
    shapes.push(line("halfway-line", "halfway-line", cx, 0, cx, W, { w }));
    for (const x of [t0 + d22, t1 - d22]) shapes.push(line("twenty-two-line", "twenty-two-lines", x, 0, x, W, { w }));
    // The dash lines across the field are dashes of `dash` set 5 m, 10 m and 20 m apart by the diagram: at the 10-metre lines at the middle, 10 m either side of it and over the 5 m and 15 m lines; 5 m from the try lines 5 m either side of
    // the middle and over the 5 m and 15 m lines.
    const across = (x: number, offsets: readonly number[], id: string): Shape[] => offsets.map((o) => line(id, "dash-lines", x, cy + o - dash / 2, x, cy + o + dash / 2, { w }));
    const offs15 = [wid / 2 - near15, wid / 2 - a5];
    const tenOffsets = [0, 10 * METRE, -10 * METRE, ...offs15, ...offs15.map((o) => -o)];
    const tryOffsets = [5 * METRE, -5 * METRE, ...offs15, ...offs15.map((o) => -o)];
    for (const x of [cx - d10, cx + d10]) shapes.push(...across(x, tenOffsets, "ten-metre-line"));
    for (const x of [t0 + t5, t1 - t5]) shapes.push(...across(x, tryOffsets, "five-metre-line"));
    // The dash lines along the field, 5 m and 15 m from each touchline: from the 5 m line a dash, then one over each 22-metre line, 10-metre line and the half-way line, and a last dash 5 m from the far try line.
    const centres = [t0 + d22, cx - d10, cx, cx + d10, t1 - d22];
    for (const y of [a5, near15, wid - near15, wid - a5]) {
      shapes.push(line("dash-line", "dash-lines", t0 + t5, y, t0 + t5 + dash, y, { w }));
      for (const x of centres) shapes.push(line("dash-line", "dash-lines", x - dash / 2, y, x + dash / 2, y, { w }));
      shapes.push(line("dash-line", "dash-lines", t1 - t5 - dash, y, t1 - t5, y, { w }));
    }
    shapes.push(line("halfway-mark", "halfway-line", cx - (s.halfwayMark as number) / 2, cy, cx + (s.halfwayMark as number) / 2, cy, { w }));
    if (full) for (const [x, y] of [[t0, 0], [t0, W], [t1, 0], [t1, W], [0, 0], [0, W], [L, 0], [L, W], ...[t0 + d22, cx, t1 - d22].flatMap((x) => [[x, -(s.flagsOutside as number)], [x, W + (s.flagsOutside as number)]])]) shapes.push(dot("flag-post", "flags", x, y, 0.35, "post"));
    marks = [
      { id: "try-line", x: t0 - 0, y: W * 0.2, side: "top" },
      { id: "dead-ball-line", x: w / 2, y: W * 0.8, side: "bottom" },
      { id: "touchline", x: L * 0.3, y: 0, side: "top" },
      { id: "twenty-two-line", x: t0 + d22, y: W, side: "bottom" },
      { id: "ten-metre-line", x: cx - d10, y: 0, side: "top" },
      { id: "halfway-line", x: cx, y: W, side: "bottom" },
      { id: "in-goal", x: ing / 2, y: cy, side: "top" },
      { id: "goal-posts", x: t0, y: cy - s.postsApart / 2, side: "top" },
    ];
  } else {
    const step = s.step as number;
    twenty = 2 * step;
    shapes.push(line("halfway-line", "halfway-line", cx, 0, cx, W, { w }));
    for (let k = 1; k * step < len / 2 - 1e-6; k += 1) {
      const red = s.red.some((r) => Math.abs(r - k * step) < 1e-6);
      for (const x of [t0 + k * step, t1 - k * step]) shapes.push(line(red ? "red-line" : "ten-metre-line", red ? "red-lines" : "ten-metre-lines", x, 0, x, W, { w, cls: red ? "ky-red" : "ky-line" }));
    }
    for (const d of s.scrum) for (const y of [d, W - d]) shapes.push(...dashesAlongX("scrum-line", "scrum-lines", y, t0, t1, METRE, METRE, { w: s.scrumWidth ?? w }));
    if (full) for (const [x, y] of [[t0, 0], [t0, W], [t1, 0], [t1, W]]) shapes.push(dot("corner-post", "flags", x, y, 0.35, "post"));
    marks = [
      { id: "goal-line", x: t0, y: W * 0.2, side: "top" },
      { id: "dead-ball-line", x: w / 2, y: W * 0.8, side: "bottom" },
      { id: "touchline", x: L * 0.3, y: 0, side: "top" },
      { id: "ten-metre-line", x: t0 + step, y: W, side: "bottom" },
      { id: "halfway-line", x: cx, y: W, side: "bottom" },
      { id: "in-goal", x: ing / 2, y: cy, side: "top" },
      { id: "goal-posts", x: t0, y: cy - s.postsApart / 2, side: "top" },
    ];
    if (s.red.length > 0) marks.push({ id: "forty-metre-line", x: t0 + (s.red[s.red.length - 1] ?? 40 * METRE), y: 0, side: "top" });
  }
  const zones = endZones(L, W, ing, W);
  const plate = middlePlate(L, W, L * 0.34, L * 0.17);
  return {
    sport: "rugby",
    league: league.id,
    length: L,
    width: W,
    outline: { kind: "rect" },
    margin: 5 * METRE,
    lineWidth: w,
    drawnLine: Math.max(w, L * 0.0009),
    band: len / 20,
    areas: [],
    shapes,
    goals: [],
    left: zones.left,
    right: zones.right,
    plate,
    ends: { left: at(0, 0, ing, W), right: at(L - ing, 0, L, W) },
    endFeature: "in-goal",
    ranges: {
      half: { left: at(0, 0, cx, W), right: at(cx, 0, L, W) },
      [s.code === "union" ? "twenty-two" : "twenty"]: { left: at(t0, 0, t0 + twenty, W), right: at(t1 - twenty, 0, t1, W) },
      "in-goal": { left: at(0, 0, ing, W), right: at(L - ing, 0, L, W) },
    },
    marks,
  };
}
