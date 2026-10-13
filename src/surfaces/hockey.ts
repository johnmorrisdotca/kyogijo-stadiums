import { el, num } from "../format.ts";
import { rulesFor, type NhlRules } from "../eras.ts";
import { NHL } from "../geometry.ts";
import { NHL_RINK, type RinkSpec } from "../leagues/hockey.ts";
import { ft, quarterTurn, roundedRect, type BuildOptions, type Mark, type Surface } from "./surface.ts";

/** Where the boards' curve is at a distance x from the end: the y at which it meets a line across the rink. The corner's radius is the NHL's unless given. */
export function boardsY(x: number, radius: number = NHL.cornerRadius): number {
  const r = radius;
  if (x >= r) return 0;
  return r - Math.sqrt(r * r - (r - x) * (r - x));
}

/**
 * An ice rink: the ice, the boards, the lines, the circles, the creases and the nets. By default the NHL's, as the rules of a
 * season (today's by default) marked it; with a `rink` (leagues.ts), that league's, in feet.
 */
export function hockey(o: BuildOptions, era?: NhlRules, rink: RinkSpec = NHL_RINK): Surface {
  // The NHL's rink has a history of its own (eras.ts); a league's, if it has one, is already in its `rink`.
  const nhl = rink === NHL_RINK ? (era ?? rulesFor("nhl").rules) : undefined;
  const { length: L, width: W, cornerRadius: r } = rink;
  const g = nhl?.goalLine ?? rink.goalLine;
  const blueLine = nhl?.blueLine ?? rink.blueLine;
  const trapezoid = nhl === undefined ? rink.trapezoid : nhl.trapezoid;
  const hashApart = nhl?.hashApart ?? rink.hash?.apart ?? 0;
  const m = o.margin ?? 8;
  const view0 = { x: -m, y: -m, w: L + 2 * m, h: W + 2 * m };
  const cy = W / 2;
  const bw = 2.4;
  const full = o.detail === "full";
  const thin = o.exact ? rink.lineWidths.minor : 0.45;
  const wide = o.exact ? rink.lineWidths.major : 1.1;

  let base = el("rect", { class: ft(o, "apron", "ky-apron"), x: view0.x, y: view0.y, width: view0.w, height: view0.h });
  base += el("path", { class: ft(o, "boards", "ky-boards"), "fill-rule": "evenodd", d: `${roundedRect(-bw, -bw, L + 2 * bw, W + 2 * bw, r + bw)}${roundedRect(0, 0, L, W, r)}` });
  base += el("path", { class: ft(o, "ice", "ky-surface"), d: roundedRect(0, 0, L, W, r) });

  // The ice's lines are drawn from end to end of the straight part of the boards.
  const gy = boardsY(g, r);
  let lines = "";
  // The centre line (red, with its white dashes) and the blue lines.
  if (nhl?.centreLine ?? true) {
    lines += el("path", { class: ft(o, "centre-line", "ky-red"), d: `M${num(L / 2)} 0V${num(W)}`, "stroke-width": wide, fill: "none" });
    lines += el("path", { class: ft(o, "centre-dashes", "ky-dash"), d: `M${num(L / 2)} 0V${num(W)}`, "stroke-width": wide * 0.45, fill: "none", "stroke-dasharray": "2.4 1.6" });
  }
  lines += el("path", { class: ft(o, "blue-lines", "ky-blue"), d: `M${num(blueLine)} 0V${num(W)}M${num(L - blueLine)} 0V${num(W)}`, "stroke-width": wide, fill: "none" });
  // The goal lines.
  lines += el("path", { class: ft(o, "goal-lines", "ky-red"), d: `M${num(g)} ${num(gy)}V${num(W - gy)}M${num(L - g)} ${num(gy)}V${num(W - gy)}`, "stroke-width": o.exact ? rink.lineWidths.goal : 0.5, fill: "none" });

  // Face-off circles and spots.
  lines += el("circle", { class: ft(o, "centre-circle", "ky-blue"), cx: L / 2, cy, r: rink.circleRadius, "stroke-width": thin, fill: "none" });
  lines += el("circle", { class: ft(o, "centre-dot", "ky-blue-fill"), cx: L / 2, cy, r: rink.centreSpotRadius });
  const endX = g + rink.endSpotFromGoalLine;
  const spots: [number, number][] = [
    [endX, cy - rink.spotOffset],
    [endX, cy + rink.spotOffset],
    [L - endX, cy - rink.spotOffset],
    [L - endX, cy + rink.spotOffset],
  ];
  const circles: string[] = [];
  const hashes: string[] = [];
  for (const [x, y] of spots) {
    circles.push(el("circle", { class: ft(o, "face-off-circles", "ky-red"), cx: x, cy: y, r: rink.circleRadius, "stroke-width": thin, fill: "none" }));
    circles.push(el("circle", { class: ft(o, "face-off-dots", "ky-red-fill"), cx: x, cy: y, r: rink.spotRadius }));
    if (full && rink.hash !== null) {
      // Two hash marks each side of a circle, parallel to the end boards.
      for (const sx of [-1, 1]) {
        for (const sy of [-1, 1]) {
          const hx = x + sx * (rink.circleRadius + 0.2);
          const y0 = y + sy * (hashApart / 2);
          hashes.push(`M${num(hx)} ${num(y0)}V${num(y0 + sy * rink.hash.length)}`);
        }
      }
    }
  }
  lines += circles.join("");
  if (hashes.length > 0) lines += el("path", { class: ft(o, "hash-marks", "ky-red"), d: hashes.join(""), "stroke-width": thin * 1.3, fill: "none" });
  const neutral = [blueLine + rink.neutralSpotFromBlue, L - blueLine - rink.neutralSpotFromBlue];
  lines += neutral.flatMap((x) => [cy - rink.spotOffset, cy + rink.spotOffset].map((y) => el("circle", { class: ft(o, "face-off-dots", "ky-red-fill"), cx: x, cy: y, r: rink.spotRadius }))).join("");

  // Creases, nets and the goalkeeper's trapezoid, at both ends.
  const { crease, net: net_ } = rink;
  const reach = Math.sqrt(crease.radius * crease.radius - crease.halfWidth * crease.halfWidth);
  // A net, seen from above: an open frame behind the goal line (the usual), the mouth alone, a filled net, or none; or a function of the caller's.
  const net = (end: 0 | 1, gx: number, s: 1 | -1): string => {
    if (o.goalMarkup !== undefined) return o.goalMarkup({ sport: "nhl", end: end === 0 ? "left" : "right", x: gx, y: cy, width: net_.width, depth: net_.depth, out: (-s) as 1 | -1, line: thin });
    const cls = ft(o, "nets", "ky-net");
    switch (o.goals) {
      case "none":
        return "";
      case "line":
        return el("path", { class: cls, d: `M${num(gx)} ${num(cy - net_.width / 2)}V${num(cy + net_.width / 2)}`, "stroke-width": thin * 3, fill: "none" });
      case "strip":
        return el("path", { class: ft(o, "nets", "ky-red-fill"), d: `M${num(gx)} ${num(cy - net_.width / 2)}h${num(-s * net_.depth)}v${num(net_.width)}h${num(s * net_.depth)}z` });
      default:
        return el("path", { class: cls, d: `M${num(gx)} ${num(cy - net_.width / 2)}h${num(-s * net_.depth)}v${num(net_.width)}h${num(s * net_.depth)}`, "stroke-width": thin * 1.5, fill: "none" });
    }
  };
  for (const end of [0, 1] as const) {
    const s = end === 0 ? 1 : -1;
    const gx = end === 0 ? g : L - g;
    const edge = (dx: number): number => gx + s * dx;
    lines += el("path", {
      class: ft(o, "crease", "ky-crease"),
      d: `M${num(gx)} ${num(cy - crease.halfWidth)}H${num(edge(reach))}A${num(crease.radius)} ${num(crease.radius)} 0 0 ${s === 1 ? 1 : 0} ${num(edge(reach))} ${num(cy + crease.halfWidth)}H${num(gx)}Z`,
      "stroke-width": thin * 1.2,
    });
    if (full) {
      if (crease.mark !== null) lines += el("path", { class: ft(o, "crease-marks", "ky-red"), d: `M${num(edge(crease.mark))} ${num(cy - crease.halfWidth)}v0.42M${num(edge(crease.mark))} ${num(cy + crease.halfWidth)}v-0.42`, "stroke-width": thin * 1.3, fill: "none" });
      if (trapezoid !== null) lines += el("path", { class: ft(o, "trapezoid", "ky-red"), d: `M${num(gx)} ${num(cy - trapezoid.atGoalLine / 2)}L${num(end === 0 ? 0 : L)} ${num(cy - trapezoid.atBoards / 2)}M${num(gx)} ${num(cy + trapezoid.atGoalLine / 2)}L${num(end === 0 ? 0 : L)} ${num(cy + trapezoid.atBoards / 2)}`, "stroke-width": thin * 1.3, fill: "none" });
    }
    lines += net(end, gx, s);
  }
  if (full && rink.refereeCrease !== null) lines += el("path", { class: ft(o, "referee-crease", "ky-red"), d: `M${num(L / 2 - rink.refereeCrease)} ${num(W)}A${num(rink.refereeCrease)} ${num(rink.refereeCrease)} 0 0 1 ${num(L / 2 + rink.refereeCrease)} ${num(W)}`, "stroke-width": thin * 1.3, fill: "none" });

  // The teams' places and the score's panel, in proportion to the rink (the NHL's is 200 feet by 85).
  const kx = L / NHL_RINK.length;
  const ky = W / NHL_RINK.width;
  const surface: Surface = {
    sport: "nhl",
    view: view0,
    base,
    lines,
    defs: "",
    left: { cx: 43 * kx, cy, w: 56 * kx, h: 34 * ky, rot: 0 },
    right: { cx: L - 43 * kx, cy, w: 56 * kx, h: 34 * ky, rot: 0 },
    plate: { cx: L / 2, cy, w: 46 * kx, h: 27 * ky },
    turned: o.portrait,
  };
  surface.lineRef = { width: thin, feet: 1 };
  surface.box = { x: 0, y: 0, w: L, h: W };
  if (o.landmarks === true) {
    // The parts to name: the lines across the ice on the top margin, the rest below.
    const marks: Mark[] = [
      { id: "boards", x: L * 0.42, y: 0, side: "top" },
      { id: "goal-line", x: g, y: gy, side: "top" },
      { id: "goal-line", x: L - g, y: gy, side: "top" },
      { id: "blue-line", x: blueLine, y: 0, side: "top" },
      { id: "blue-line", x: L - blueLine, y: 0, side: "top" },
      { id: "face-off-circle", x: g + rink.endSpotFromGoalLine, y: cy + rink.spotOffset + rink.circleRadius, side: "bottom" },
      { id: "crease", x: g + reach * 0.5, y: cy + crease.halfWidth, side: "bottom" },
      { id: "net", x: g - net_.depth / 2, y: cy + net_.width / 2, side: "bottom" },
      { id: "centre-circle", x: L / 2, y: cy + rink.circleRadius, side: "bottom" },
    ];
    if (nhl?.centreLine ?? true) marks.push({ id: "centre-red-line", x: L / 2, y: 0, side: "top" });
    if (full && trapezoid !== null) marks.push({ id: "trapezoid", x: g * 0.5, y: cy - (trapezoid.atGoalLine + trapezoid.atBoards) / 4, side: "top" });
    if (full && rink.refereeCrease !== null) marks.push({ id: "referee-crease", x: L / 2 + rink.refereeCrease * 0.5, y: W - rink.refereeCrease * 0.8, side: "bottom" });
    surface.marks = marks;
  }
  if (o.portrait) {
    const t = quarterTurn(view0);
    surface.view = t.view;
    surface.turn = t.turn;
  }
  return surface;
}
