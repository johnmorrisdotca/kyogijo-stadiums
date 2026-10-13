import { el, num } from "../format.ts";
import { NHL } from "../geometry.ts";
import { quarterTurn, roundedRect, type BuildOptions, type Surface } from "./surface.ts";

/** Where the boards' curve is at a distance x from the end: the y at which it meets a line across the rink. */
export function boardsY(x: number): number {
  const r = NHL.cornerRadius;
  if (x >= r) return 0;
  return r - Math.sqrt(r * r - (r - x) * (r - x));
}

/** The NHL rink: the ice, the boards, the lines, the circles, the creases and the nets. */
export function hockey(o: BuildOptions): Surface {
  const { length: L, width: W, cornerRadius: r, goalLine: g } = NHL;
  const m = o.margin ?? 8;
  const view0 = { x: -m, y: -m, w: L + 2 * m, h: W + 2 * m };
  const cy = W / 2;
  const bw = 2.4;
  const full = o.detail === "full";
  const thin = o.exact ? 1 / 6 : 0.45;
  const wide = o.exact ? 1 : 1.1;

  let base = el("rect", { class: "ky-apron", x: view0.x, y: view0.y, width: view0.w, height: view0.h });
  base += el("path", { class: "ky-boards", "fill-rule": "evenodd", d: `${roundedRect(-bw, -bw, L + 2 * bw, W + 2 * bw, r + bw)}${roundedRect(0, 0, L, W, r)}` });
  base += el("path", { class: "ky-surface", d: roundedRect(0, 0, L, W, r) });

  // The ice's lines are drawn from end to end of the straight part of the boards.
  const gy = boardsY(g);
  let lines = "";
  // The centre line (red, with its white dashes) and the blue lines.
  lines += el("path", { class: "ky-red", d: `M${num(L / 2)} 0V${num(W)}`, "stroke-width": wide, fill: "none" });
  lines += el("path", { class: "ky-dash", d: `M${num(L / 2)} 0V${num(W)}`, "stroke-width": wide * 0.45, fill: "none", "stroke-dasharray": "2.4 1.6" });
  lines += el("path", { class: "ky-blue", d: `M${NHL.blueLine} 0V${W}M${L - NHL.blueLine} 0V${W}`, "stroke-width": wide, fill: "none" });
  // The goal lines.
  lines += el("path", { class: "ky-red", d: `M${g} ${num(gy)}V${num(W - gy)}M${L - g} ${num(gy)}V${num(W - gy)}`, "stroke-width": o.exact ? NHL.goalLineWidth : 0.5, fill: "none" });

  // Face-off circles and spots.
  lines += el("circle", { class: "ky-blue", cx: L / 2, cy, r: NHL.circleRadius, "stroke-width": thin, fill: "none" });
  lines += el("circle", { class: "ky-blue-fill", cx: L / 2, cy, r: NHL.centreSpotRadius });
  const endX = g + NHL.endSpotFromGoalLine;
  const spots: [number, number][] = [
    [endX, cy - NHL.spotOffset],
    [endX, cy + NHL.spotOffset],
    [L - endX, cy - NHL.spotOffset],
    [L - endX, cy + NHL.spotOffset],
  ];
  const circles: string[] = [];
  const hashes: string[] = [];
  for (const [x, y] of spots) {
    circles.push(el("circle", { class: "ky-red", cx: x, cy: y, r: NHL.circleRadius, "stroke-width": thin, fill: "none" }));
    circles.push(el("circle", { class: "ky-red-fill", cx: x, cy: y, r: NHL.spotRadius }));
    if (full) {
      // Two hash marks each side of a circle, parallel to the end boards, 2 feet long, 5 feet 11 inches apart.
      for (const sx of [-1, 1]) {
        for (const sy of [-1, 1]) {
          const hx = x + sx * (NHL.circleRadius + 0.2);
          const y0 = y + sy * (NHL.hashApart / 2);
          hashes.push(`M${num(hx)} ${num(y0)}V${num(y0 + sy * NHL.hashLength)}`);
        }
      }
    }
  }
  lines += circles.join("");
  if (hashes.length > 0) lines += el("path", { class: "ky-red", d: hashes.join(""), "stroke-width": thin * 1.3, fill: "none" });
  const neutral = [NHL.blueLine + NHL.neutralSpotFromBlue, L - NHL.blueLine - NHL.neutralSpotFromBlue];
  lines += neutral.flatMap((x) => [cy - NHL.spotOffset, cy + NHL.spotOffset].map((y) => el("circle", { class: "ky-red-fill", cx: x, cy: y, r: NHL.spotRadius }))).join("");

  // Creases, nets and the goalkeeper's trapezoid, at both ends.
  const { crease, net, trapezoid } = NHL;
  const reach = Math.sqrt(crease.radius * crease.radius - crease.halfWidth * crease.halfWidth);
  for (const end of [0, 1] as const) {
    const s = end === 0 ? 1 : -1;
    const gx = end === 0 ? g : L - g;
    const edge = (dx: number): number => gx + s * dx;
    lines += el("path", {
      class: "ky-crease",
      d: `M${num(gx)} ${num(cy - crease.halfWidth)}H${num(edge(reach))}A${crease.radius} ${crease.radius} 0 0 ${s === 1 ? 1 : 0} ${num(edge(reach))} ${num(cy + crease.halfWidth)}H${num(gx)}Z`,
      "stroke-width": thin * 1.2,
    });
    if (full) {
      lines += el("path", { class: "ky-red", d: `M${num(edge(4))} ${num(cy - crease.halfWidth)}v0.42M${num(edge(4))} ${num(cy + crease.halfWidth)}v-0.42`, "stroke-width": thin * 1.3, fill: "none" });
      lines += el("path", { class: "ky-red", d: `M${num(gx)} ${num(cy - trapezoid.atGoalLine / 2)}L${num(end === 0 ? 0 : L)} ${num(cy - trapezoid.atBoards / 2)}M${num(gx)} ${num(cy + trapezoid.atGoalLine / 2)}L${num(end === 0 ? 0 : L)} ${num(cy + trapezoid.atBoards / 2)}`, "stroke-width": thin * 1.3, fill: "none" });
    }
    lines += el("path", { class: "ky-net", d: `M${num(gx)} ${num(cy - net.width / 2)}h${num(-s * net.depth)}v${net.width}h${num(s * net.depth)}`, "stroke-width": thin * 1.5, fill: "none" });
  }
  if (full) lines += el("path", { class: "ky-red", d: `M${L / 2 - NHL.refereeCrease} ${W}A${NHL.refereeCrease} ${NHL.refereeCrease} 0 0 1 ${L / 2 + NHL.refereeCrease} ${W}`, "stroke-width": thin * 1.3, fill: "none" });

  const surface: Surface = {
    sport: "nhl",
    view: view0,
    base,
    lines,
    defs: "",
    left: { cx: 43, cy, w: 56, h: 34, rot: 0 },
    right: { cx: L - 43, cy, w: 56, h: 34, rot: 0 },
    plate: { cx: L / 2, cy, w: 46, h: 27 },
    turned: o.portrait,
  };
  if (o.portrait) {
    const t = quarterTurn(view0);
    surface.view = t.view;
    surface.turn = t.turn;
  }
  return surface;
}
