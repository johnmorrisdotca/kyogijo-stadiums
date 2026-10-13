import { courtGeometry, courtSize, sideReach, type CourtPlan, type Fixture, type Rect } from "../court.ts";
import { el, num } from "../format.ts";
import { quarterTurn, type BuildOptions, type Surface } from "./surface.ts";

/** A rectangle as a closed sub-path. */
const box = (r: Rect): string => `M${num(r[0])} ${num(r[1])}H${num(r[2])}V${num(r[3])}H${num(r[0])}Z`;

/** A mark as an element: a square or a circle. */
function mark(f: Fixture, cls: string): string {
  const half = f.size / 2;
  return f.shape === "round" ? el("circle", { class: cls, cx: f.x, cy: f.y, r: half }) : el("rect", { class: cls, x: f.x - half, y: f.y - half, width: f.size, height: f.size });
}

/**
 * A net sport's court lying wide: the ground, the free zone, the court, its painted areas, its lines, the net with its posts (and, in volleyball, its antennae)
 * and, on a score, the place for the board. Every length that is a rulebook's figure comes from the league (leagues/courts.ts) through `courtGeometry`.
 */
export function netCourt(o: BuildOptions, plan: CourtPlan): Surface {
  const geometry = courtGeometry(plan);
  const { length: L, width: W } = courtSize(plan);
  const full = o.detail === "full";
  const cx = L / 2;
  const cy = W / 2;
  const zone = plan.zone;
  // The ground drawn: the free zone where the rulebook gives one, or the reach of the posts; and a little more round it.
  const side = Math.max(zone?.side ?? 0, sideReach(geometry));
  const end = zone?.end ?? 0;
  const m = o.margin ?? L * 0.035;
  const view0 = { x: -end - m, y: -side - m, w: L + 2 * (end + m), h: W + 2 * (side + m) };
  // Lines are drawn a little thicker than painted, as the other surfaces' are, unless asked for the true widths: the thin dimension of a line is raised to a least.
  const least = o.exact ? 0 : L * 0.0026;
  const thick = (r: Rect): Rect => {
    const w = r[2] - r[0];
    const h = r[3] - r[1];
    if (Math.min(w, h) >= least) return r;
    return w < h ? [(r[0] + r[2]) / 2 - least / 2, r[1], (r[0] + r[2]) / 2 + least / 2, r[3]] : [r[0], (r[1] + r[3]) / 2 - least / 2, r[2], (r[1] + r[3]) / 2 + least / 2];
  };

  let base = el("rect", { class: "ky-apron", x: view0.x, y: view0.y, width: view0.w, height: view0.h });
  if (zone !== null) base += el("rect", { class: "ky-free", x: -end, y: -side, width: L + 2 * end, height: W + 2 * side });
  base += el("rect", { class: "ky-surface", x: 0, y: 0, width: L, height: W });
  if (geometry.areas.length > 0) base += el("path", { class: "ky-area", d: geometry.areas.map(box).join("") });

  const lineRects = [...geometry.lines, ...(full ? geometry.small : [])].map(thick);
  let lines = el("path", { class: "ky-fill-line", d: lineRects.map(box).join("") });
  // The net: a line across the court at its middle, from post to post; its posts and, in volleyball, the antennae at the side lines.
  const nw = Math.max(L * 0.004, 0.02);
  const net = geometry.net;
  lines += el("rect", { class: "ky-nt-line", x: net.x - nw / 2, y: net.y0, width: nw, height: net.y1 - net.y0 });
  for (const post of geometry.posts) lines += mark(post, "ky-nt-post");
  if (full) {
    for (const stick of geometry.sticks) lines += mark(stick, "ky-nt-post");
    for (const antenna of geometry.antennae) lines += mark(antenna, "ky-red-fill");
  }

  // The teams' names are not painted on these courts: the board names the teams. The board lies over the net, between the lines it needs.
  const turned = o.portrait;
  const spot = turned ? { cx, cy, w: W * 0.88, h: L * 0.5 } : { cx, cy, w: L * 0.58, h: W * 0.66 };
  const surface: Surface = {
    sport: plan.sport,
    view: view0,
    base,
    lines,
    defs: "",
    left: { cx: L * 0.2, cy, w: L * 0.2, h: W * 0.4, rot: 0 },
    right: { cx: L * 0.8, cy, w: L * 0.2, h: W * 0.4, rot: 0 },
    plate: spot,
    turned,
  };
  if (turned) {
    const tt = quarterTurn(view0);
    surface.view = tt.view;
    surface.turn = tt.turn;
  }
  return surface;
}
