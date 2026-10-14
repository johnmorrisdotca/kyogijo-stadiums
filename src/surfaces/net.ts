import { bandReach, courtGeometry, courtSize, sideReach, type Band, type CourtPlan, type Fixture, type Rect, type Ring, type Solid } from "../court.ts";
import { el, num } from "../format.ts";
import { atEnds, edges, ft, quarterTurn, type BuildOptions, type Mark, type Surface } from "./surface.ts";

/** A rectangle as a closed sub-path. */
const box = (r: Rect): string => `M${num(r[0])} ${num(r[1])}H${num(r[2])}V${num(r[3])}H${num(r[0])}Z`;

/** A mark as an element: a square or a circle. */
function mark(f: Fixture, cls: string): string {
  const half = f.size / 2;
  return f.shape === "round" ? el("circle", { class: cls, cx: f.x, cy: f.y, r: half }) : el("rect", { class: cls, x: f.x - half, y: f.y - half, width: f.size, height: f.size });
}

/**
 * A ring or an arc as a stroked line: a circle element for a whole circle, else a path from `a0` to `a1` in pieces of at most a quarter turn (an arc of exactly half a circle,
 * drawn in one piece with rounded numbers, can lose its centre). The line's outer edge is at the radius, so its middle is half a width inside it.
 */
function ringMarkup(o: BuildOptions, ring: Ring): string {
  const { cx, cy, w } = ring;
  const r = Math.max(0.001, ring.r - w / 2);
  const cls = ft(o, "lines", "ky-line");
  if (ring.a0 === undefined || ring.a1 === undefined) return el("circle", { class: cls, cx, cy, r, "stroke-width": w });
  const turns = Math.max(1, Math.ceil((ring.a1 - ring.a0) / (Math.PI / 2) - 1e-9));
  const at = (a: number): string => `${num(cx + r * Math.cos(a))} ${num(cy + r * Math.sin(a))}`;
  let d = `M${at(ring.a0)}`;
  for (let i = 1; i <= turns; i += 1) d += `A${num(r)} ${num(r)} 0 0 1 ${at(ring.a0 + ((ring.a1 - ring.a0) * i) / turns)}`;
  return el("path", { class: cls, d, "stroke-width": w });
}

/** What each kind of band is drawn with: the class and the feature it belongs to. */
const BAND: Readonly<Record<Band["kind"], readonly [feature: string, cls: string]>> = { wall: ["walls", "ky-wall"], mesh: ["fence", "ky-mesh"], face: ["wall-face", "ky-face"], tin: ["tin", "ky-tin"] };

/** A solid on the court: a table is a rectangle, a roundnet set a rim round a net. */
function solid(o: BuildOptions, s: Solid): string {
  if (s.kind === "table") return el("path", { class: ft(o, "table", "ky-table"), d: box(s.rect) });
  return el("circle", { class: ft(o, "net", "ky-nt-post"), cx: s.cx, cy: s.cy, r: s.r }) + el("circle", { class: ft(o, "net", "ky-set-net"), cx: s.cx, cy: s.cy, r: s.r * 0.84 });
}

/**
 * A net sport's court lying wide: the ground, the free zone, the court, its painted areas, its lines, the net with its posts (and, in volleyball, its antennae)
 * and, on a score, the place for the board. Every length that is a rulebook's figure comes from the league (leagues/courts.ts) through `courtGeometry`. The courts of
 * the sports added after the first five may also have walls, rings (circles and arcs), a table or a set, and no net.
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
  // Walls and the like stand beyond the court's edges, and may make the ground wider on one side than on the other.
  const beyond = bandReach(geometry);
  const [left, right, top, bottom] = [Math.max(end, beyond.left), Math.max(end, beyond.right), Math.max(side, beyond.top), Math.max(side, beyond.bottom)];
  const view0 = { x: -left - m, y: -top - m, w: L + left + right + 2 * m, h: W + top + bottom + 2 * m };
  // Lines are drawn a little thicker than painted, as the other surfaces' are, unless asked for the true widths: the thin dimension of a line is raised to a least.
  const least = o.exact ? 0 : L * 0.0026;
  const thick = (r: Rect): Rect => {
    const w = r[2] - r[0];
    const h = r[3] - r[1];
    if (Math.min(w, h) >= least) return r;
    return w < h ? [(r[0] + r[2]) / 2 - least / 2, r[1], (r[0] + r[2]) / 2 + least / 2, r[3]] : [r[0], (r[1] + r[3]) / 2 - least / 2, r[2], (r[1] + r[3]) / 2 + least / 2];
  };

  let base = el("rect", { class: ft(o, "apron", "ky-apron"), x: view0.x, y: view0.y, width: view0.w, height: view0.h });
  if (zone !== null) base += el("rect", { class: ft(o, "free-zone", "ky-free"), x: -end, y: -side, width: L + 2 * end, height: W + 2 * side });
  base += el("rect", { class: ft(o, "court", "ky-surface"), x: 0, y: 0, width: L, height: W });
  if (geometry.areas.length > 0) base += el("path", { class: ft(o, "areas", "ky-area"), d: geometry.areas.map(box).join("") });
  for (const band of geometry.bands) {
    const [feature, cls] = BAND[band.kind];
    base += el("path", { class: ft(o, feature, cls), d: box(band.rect) });
  }

  const lineRects = [...geometry.lines, ...(full ? geometry.small : [])].map(thick);
  let lines = el("path", { class: ft(o, "lines", "ky-fill-line"), d: lineRects.map(box).join("") });
  // Circles and arcs are lines too, drawn at least as thick as the others.
  for (const ring of geometry.rings) lines += ringMarkup(o, { ...ring, w: Math.max(ring.w, least) });
  for (const s of geometry.solids) lines += solid(o, s);
  // The net: a line across the court at its middle, from post to post; its posts and, in volleyball, the antennae at the side lines. A court without a net has none.
  const net = geometry.net;
  // Over a centre line (volleyball's, sepak takraw's) the net is drawn a little wider than the line, so that the line shows between its edges.
  const under = geometry.underNet;
  const nw = under === null ? Math.max(L * 0.004, 0.02) : Math.max(under, least) * 2.4;
  if (net !== null) lines += el("rect", { class: ft(o, "net", "ky-nt-line"), x: net.x - nw / 2, y: net.y0, width: nw, height: net.y1 - net.y0 });
  // The centre line runs under the net (volleyball Rule 1.3.3): the net is drawn over it, so the line is drawn again over the net, in a narrower stroke, to show through.
  if (net !== null && under !== null) {
    const core = Math.max(under, least);
    lines += el("rect", { class: ft(o, "lines", "ky-fill-line"), x: net.x - core / 2, y: 0, width: core, height: W });
  }
  for (const post of geometry.posts) lines += mark(post, ft(o, "posts", "ky-nt-post"));
  if (full) {
    for (const stick of geometry.sticks) lines += mark(stick, ft(o, "posts", "ky-nt-post"));
    for (const antenna of geometry.antennae) lines += mark(antenna, ft(o, "antennae", "ky-red-fill"));
  }

  // The teams' names are not painted on these courts: the board names the teams. The board lies over the net, between the lines it needs.
  // A roundnet court is square, with no sides: it lies the same wherever it is turned.
  const turned = o.portrait && plan.sport !== "roundnet";
  // The board lies over the net, between the lines it needs; on a roundnet court that is the set, so it lies on the ground below the circles.
  const room = plan.sport === "roundnet" ? W / 2 - plan.figures.servingRadius : 0;
  const clear = plan.sport === "roundnet" ? { cx, cy: cy + plan.figures.servingRadius + room / 2, w: L * 0.9, h: room * 0.9 } : undefined;
  // Netball's board has no net to lie over: it lies in the centre third, and the teams' names are painted in the goal thirds.
  const centred = plan.sport === "netball" ? (turned ? { cx, cy, w: W * 0.88, h: L * 0.36 } : { cx, cy, w: L * 0.4, h: W * 0.66 }) : undefined;
  const spot = clear ?? centred ?? (turned ? { cx, cy, w: W * 0.88, h: L * 0.5 } : { cx, cy, w: L * 0.58, h: W * 0.66 });
  const places = plan.sport === "netball" ? { left: { cx: L * 0.15, cy, w: L * 0.2, h: W * 0.4, rot: 0 }, right: { cx: L * 0.85, cy, w: L * 0.2, h: W * 0.4, rot: 0 } } : { left: { cx: L * 0.2, cy, w: L * 0.2, h: W * 0.4, rot: 0 }, right: { cx: L * 0.8, cy, w: L * 0.2, h: W * 0.4, rot: 0 } };
  const surface: Surface = {
    sport: plan.sport,
    view: view0,
    base,
    lines,
    defs: "",
    left: places.left,
    right: places.right,
    plate: spot,
    turned,
  };
  surface.box = { x: 0, y: 0, w: L, h: W };
  // One side of the net.
  const middle = net === null ? cx : net.x;
  surface.ranges = { "half-court": atEnds((end) => (end === "left" ? edges(0, 0, middle, W) : edges(middle, 0, L, W))) };
  surface.lineRef = { width: plan.sport === "tabletennis" ? plan.figures.edgeLine : plan.figures.lineWidth, feet: 1 };
  if (o.landmarks === true) surface.marks = netMarks(plan, L, W);
  if (turned) {
    const tt = quarterTurn(view0);
    surface.view = tt.view;
    surface.turn = tt.turn;
  }
  return surface;
}

/** The parts of a net sport's court to name, from the league's figures (feet): the lines across and along the court, the zones either side of the net and the net. */
function netMarks(plan: CourtPlan, L: number, W: number): Mark[] {
  const cx = L / 2;
  const cy = W / 2;
  const net: Mark = { id: "court-net", x: cx, y: 0, side: "top" };
  switch (plan.sport) {
    case "tennis": {
      const f = plan.figures;
      const inset = (W - f.widthSingles) / 2;
      return [
        { id: "baseline", x: f.lineWidth / 2, y: W * 0.8, side: "bottom" },
        { id: "sideline", x: L * 0.12, y: 0, side: "top" },
        { id: "singles-sideline", x: L * 0.12, y: W - inset, side: "bottom" },
        { id: "service-line", x: cx - f.serviceLine + f.lineWidth / 2, y: inset + f.widthSingles * 0.2, side: "top" },
        { id: "centre-service-line", x: cx - f.serviceLine / 2, y: cy, side: "bottom" },
        { id: "centre-mark", x: f.lineWidth + f.centreMark.length / 2, y: cy, side: "top" },
        net,
      ];
    }
    case "volleyball": {
      const f = plan.figures;
      const marks: Mark[] = [
        { id: "end-line", x: f.lineWidth / 2, y: W * 0.8, side: "bottom" },
        { id: "sideline", x: L * 0.12, y: 0, side: "top" },
        net,
      ];
      if (f.attackLine !== null) {
        marks.push({ id: "attack-line", x: cx - f.attackLine + f.lineWidth / 2, y: W * 0.3, side: "top" });
        marks.push({ id: "centre-line", x: cx, y: W * 0.8, side: "bottom" });
      }
      marks.push({ id: "antenna", x: cx, y: W, side: "bottom" });
      return marks;
    }
    case "badminton": {
      const f = plan.figures;
      return [
        // The back boundary line is the singles long service line too (Diagram A); the line inside it is the doubles long service line.
        { id: "back-boundary-line", x: f.lineWidth / 2, y: W * 0.8, side: "bottom" },
        { id: "sideline", x: L * 0.12, y: 0, side: "top" },
        { id: "singles-sideline", x: L * 0.12, y: W - f.singlesInset, side: "bottom" },
        { id: "doubles-long-service-line", x: f.doublesLongServiceInset + f.lineWidth / 2, y: W * 0.2, side: "top" },
        { id: "short-service-line", x: cx - f.shortServiceLine - f.lineWidth / 2, y: W * 0.3, side: "bottom" },
        { id: "centre-line", x: L * 0.2, y: cy, side: "bottom" },
        net,
      ];
    }
    case "pickleball": {
      const f = plan.figures;
      return [
        { id: "baseline", x: f.lineWidth / 2, y: W * 0.8, side: "bottom" },
        { id: "sideline", x: L * 0.12, y: 0, side: "top" },
        { id: "non-volley-line", x: cx - f.nonVolley + f.lineWidth / 2, y: W * 0.2, side: "top" },
        { id: "non-volley-zone", x: cx - f.nonVolley / 2, y: W * 0.7, side: "bottom" },
        { id: "centre-line", x: L * 0.15, y: cy, side: "bottom" },
        net,
      ];
    }
    case "tabletennis": {
      const f = plan.figures;
      return [
        { id: "end-line", x: f.edgeLine / 2, y: W * 0.8, side: "bottom" },
        { id: "end-line", x: L - f.edgeLine / 2, y: W * 0.2, side: "top" },
        { id: "sideline", x: L * 0.12, y: 0, side: "top" },
        { id: "sideline", x: L * 0.88, y: W, side: "bottom" },
        { id: "centre-line", x: L * 0.2, y: cy, side: "bottom" },
        net,
      ];
    }
    case "padel": {
      const f = plan.figures;
      return [
        { id: "back-wall", x: 0, y: W * 0.8, side: "bottom" },
        { id: "side-wall", x: f.enclosure.sideWall / 2, y: 0, side: "top" },
        { id: "metal-fence", x: L * 0.3, y: W, side: "bottom" },
        { id: "service-line", x: cx - f.serviceLine + f.lineWidth / 2, y: W * 0.25, side: "top" },
        { id: "centre-service-line", x: cx - f.serviceLine / 2, y: cy, side: "bottom" },
        net,
      ];
    }
    case "squash": {
      const f = plan.figures;
      const near = L - f.shortLine;
      return [
        { id: "tin", x: -f.wall.tin / 2, y: W * 0.15, side: "top" },
        { id: "wall-service-line", x: -f.wall.serviceLine - f.lineWidth / 2, y: W * 0.45, side: "bottom" },
        { id: "front-wall-line", x: -f.wall.frontWallLine - f.lineWidth / 2, y: W * 0.15, side: "top" },
        { id: "short-line", x: near - f.lineWidth / 2, y: W * 0.3, side: "top" },
        { id: "squash-half-court-line", x: L - f.shortLine / 2, y: cy, side: "bottom" },
        { id: "service-box", x: near + f.serviceBox / 2, y: f.serviceBox / 2, side: "top" },
        { id: "back-wall", x: L, y: W * 0.7, side: "bottom" },
      ];
    }
    case "racquetball": {
      const f = plan.figures;
      const back = L - f.shortLine;
      const front = back - f.serviceLine;
      return [
        { id: "front-wall", x: 0, y: W * 0.3, side: "top" },
        { id: "service-line", x: front + f.lineWidth / 2, y: W * 0.7, side: "bottom" },
        { id: "service-zone", x: (front + back) / 2, y: cy, side: "top" },
        { id: "service-box", x: (front + back) / 2, y: W - f.serviceBox / 2, side: "bottom" },
        { id: "drive-serve-line", x: (front + back) / 2, y: f.driveServe - f.lineWidth / 2, side: "top" },
        { id: "short-line", x: back - f.lineWidth / 2, y: W * 0.15, side: "top" },
        { id: "safety-zone", x: back + f.receiving.behind / 2, y: cy, side: "bottom" },
        { id: "receiving-line", x: back + f.receiving.behind - f.lineWidth / 2, y: W * 0.8, side: "bottom" },
        { id: "back-wall", x: L, y: cy, side: "bottom" },
      ];
    }
    case "sepaktakraw": {
      const f = plan.figures;
      const k = Math.SQRT1_2 * f.quarterCircle;
      return [
        { id: "back-line", x: f.lineWidth / 2, y: W * 0.8, side: "bottom" },
        { id: "sideline", x: L * 0.12, y: 0, side: "top" },
        { id: "centre-line", x: cx + f.centreLine, y: W * 0.8, side: "bottom" },
        { id: "quarter-circle", x: cx - k, y: k, side: "top" },
        { id: "service-circle", x: f.serviceCircle.fromBack, y: cy - f.serviceCircle.radius, side: "top" },
        net,
      ];
    }
    case "teqball": {
      const f = plan.figures;
      return [
        { id: "court-surround", x: 0, y: W * 0.8, side: "bottom" },
        { id: "halfway-line", x: cx, y: W * 0.15, side: "top" },
        { id: "service-line", x: cx - f.serviceLine, y: W * 0.7, side: "bottom" },
        { id: "service-line", x: cx + f.serviceLine, y: W * 0.3, side: "top" },
        { id: "table", x: cx + f.table.length * 0.3, y: cy + f.table.width * 0.3, side: "bottom" },
        { id: "court-net", x: cx, y: cy - f.net.width / 2, side: "top" },
      ];
    }
    case "roundnet": {
      const f = plan.figures;
      const k = Math.SQRT1_2;
      return [
        { id: "roundnet-set", x: cx - f.set.diameter * 0.25, y: cy + f.set.diameter * 0.1, side: "bottom" },
        { id: "no-hit-zone", x: cx + f.noHitRadius * k, y: cy - f.noHitRadius * k, side: "top" },
        { id: "service-circle", x: cx - f.servingRadius * k, y: cy - f.servingRadius * k, side: "top" },
        { id: "service-position", x: cx + f.servingRadius, y: cy, side: "bottom" },
        { id: "service-position", x: cx - f.servingRadius, y: cy, side: "bottom" },
        { id: "service-position", x: cx, y: cy - f.servingRadius, side: "top" },
      ];
    }
    default: {
      const f = plan.figures;
      const k = Math.SQRT1_2 * f.goalCircle;
      return [
        { id: "goal-line", x: f.lineWidth / 2, y: W * 0.8, side: "bottom" },
        { id: "sideline", x: L * 0.12, y: 0, side: "top" },
        { id: "transverse-line", x: L / 3, y: 0, side: "top" },
        { id: "centre-circle", x: cx + f.centreCircle / 2, y: cy, side: "bottom" },
        { id: "goal-circle", x: k, y: cy - k, side: "top" },
        { id: "goalpost", x: f.post.poleDiameter / 2, y: cy, side: "bottom" },
        { id: "goal-ring", x: L - f.post.poleDiameter - f.post.ring.bar - f.post.ring.inside / 2, y: cy, side: "top" },
      ];
    }
  }
}
