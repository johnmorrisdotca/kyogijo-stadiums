import { el, num } from "../format.ts";
import { rulesFor, type NbaRules } from "../eras.ts";
import { NBA_COURT, type CourtSpec } from "../leagues/basketball.ts";
import { atEnds, edges, ft, quarterTurn, textOn, type BuildOptions, type Mark, type Surface } from "./surface.ts";

/**
 * A basketball court: the floor, the keys, the arcs, the circles, the baskets and the small marks. By default the NBA's, as the
 * rules of a season (today's by default) marked it; with a `court` (leagues.ts), that league's, in feet.
 */
export function basketball(o: BuildOptions, era?: NbaRules, court: CourtSpec = NBA_COURT): Surface {
  // The NBA's court has a history of its own (eras.ts); a league's, if it has one, is already in its `court`.
  const nba = court === NBA_COURT ? (era ?? rulesFor("nba").rules) : undefined;
  const { length: L, width: W } = court;
  const m = o.margin ?? 7;
  const view0 = { x: -m, y: -m, w: L + 2 * m, h: W + 2 * m };
  const cy = W / 2;
  const full = o.detail === "full";
  const bw = 2.6;
  const thin = o.exact ? 1 / 6 : 0.4;
  const turned = o.portrait;
  const laneWidth = nba?.keyWidth ?? court.laneWidth;
  const half = laneWidth / 2;
  // The three-point line: an arc of the season's radius from the basket, meeting the straight lines a few feet in from the
  // sidelines (or, with none, running on to the baseline).
  const three = nba === undefined ? court.threePoint : nba.threePoint === null ? null : { radius: nba.threePoint.radius, sideInset: court.threePoint?.sideInset ?? 3 };
  const restricted = nba === undefined ? court.restricted : nba.restrictedArea ? court.restricted : null;
  const bx = court.basket;
  const radius = three?.radius ?? 0;
  const inset = three?.sideInset ?? 0;
  const J = three === null ? 0 : bx + Math.sqrt(radius * radius - (W / 2 - inset) * (W / 2 - inset));
  const threeLeft = (): string => `M0 ${num(inset)}H${num(J)}A${num(radius)} ${num(radius)} 0 0 1 ${num(J)} ${num(W - inset)}H0`;
  const threeRight = (): string => `M${num(L)} ${num(inset)}H${num(L - J)}A${num(radius)} ${num(radius)} 0 0 0 ${num(L - J)} ${num(W - inset)}H${num(L)}`;

  let base = el("rect", { class: ft(o, "apron", "ky-apron"), x: view0.x, y: view0.y, width: view0.w, height: view0.h });
  base += el("path", { class: ft(o, "border", "ky-boards"), "fill-rule": "evenodd", d: `M${-bw} ${-bw}H${num(L + bw)}V${num(W + bw)}H${-bw}ZM0 0V${num(W)}H${num(L)}V0Z` });
  base += el("rect", { class: ft(o, "floor", "ky-surface"), x: 0, y: 0, width: L, height: W });
  if (o.stripes) {
    // The planks run along the court: a second tone on every other board.
    const planks: string[] = [];
    for (let y = 1; y < W; y += 2) planks.push(`M0 ${y}H${num(L)}v1H0z`);
    base += el("path", { class: ft(o, "planks", "ky-stripe"), d: planks.join("") });
  }
  // The keys, painted, and the three-point areas when asked.
  const keyW = court.freeThrowLine;
  const wide = (court.laneEndWidth ?? laneWidth) / 2;
  if (o.court?.paintThreePoint && three !== null) {
    base += el("path", { class: ft(o, "three-point-area", "ky-key ky-key-left"), d: `${threeLeft()}Z` });
    base += el("path", { class: ft(o, "three-point-area", "ky-key ky-key-right"), d: `${threeRight()}Z` });
  }
  // A lane that is a rectangle, or a trapezoid wider at the baseline.
  const lane = (x: number, away: number): string => `M${num(x)} ${num(cy - wide)}L${num(x + away * keyW)} ${num(cy - half)}V${num(cy + half)}L${num(x)} ${num(cy + wide)}`;
  if (court.laneEndWidth === undefined) {
    base += el("rect", { class: ft(o, "key", "ky-key ky-key-left"), x: 0, y: cy - half, width: keyW, height: laneWidth });
    base += el("rect", { class: ft(o, "key", "ky-key ky-key-right"), x: L - keyW, y: cy - half, width: keyW, height: laneWidth });
  } else {
    base += el("path", { class: ft(o, "key", "ky-key ky-key-left"), d: `${lane(0, 1)}Z` });
    base += el("path", { class: ft(o, "key", "ky-key ky-key-right"), d: `${lane(L, -1)}Z` });
  }
  base += el("circle", { class: ft(o, "centre-paint", "ky-centre"), cx: L / 2, cy, r: court.centreRadius });

  let lines = el("rect", { class: ft(o, "boundary", "ky-line"), x: 0, y: 0, width: L, height: W, "stroke-width": thin * 1.25, fill: "none" });
  lines += el("path", { class: ft(o, "halfway-line", "ky-line"), d: `M${num(L / 2)} 0V${num(W)}`, "stroke-width": thin, fill: "none" });
  lines += el("circle", { class: ft(o, "centre-circle", "ky-line"), cx: L / 2, cy, r: court.centreRadius, "stroke-width": thin, fill: "none" });
  if (full && court.centreInnerRadius !== null) lines += el("circle", { class: ft(o, "centre-circle", "ky-line"), cx: L / 2, cy, r: court.centreInnerRadius, "stroke-width": thin, fill: "none" });
  // Lane lines, with the free-throw lines across them.
  lines += el("path", { class: ft(o, "lane-lines", "ky-line"), d: court.laneEndWidth === undefined ? `M0 ${num(cy - half)}H${num(keyW)}V${num(cy + half)}H0M${num(L)} ${num(cy - half)}H${num(L - keyW)}V${num(cy + half)}H${num(L)}` : `${lane(0, 1)}${lane(L, -1)}`, "stroke-width": thin, fill: "none" });
  const R = court.freeThrowRadius;
  // The free-throw circles: whole outside the key, dashed inside it.
  lines += el("path", { class: ft(o, "free-throw-circles", "ky-line"), d: `M${num(keyW)} ${num(cy - R)}A${num(R)} ${num(R)} 0 0 1 ${num(keyW)} ${num(cy + R)}M${num(L - keyW)} ${num(cy - R)}A${num(R)} ${num(R)} 0 0 0 ${num(L - keyW)} ${num(cy + R)}`, "stroke-width": thin, fill: "none" });
  lines += el("path", { class: ft(o, "free-throw-circles", "ky-line"), d: `M${num(keyW)} ${num(cy - R)}A${num(R)} ${num(R)} 0 0 0 ${num(keyW)} ${num(cy + R)}M${num(L - keyW)} ${num(cy - R)}A${num(R)} ${num(R)} 0 0 1 ${num(L - keyW)} ${num(cy + R)}`, "stroke-width": thin, fill: "none", "stroke-dasharray": "1.6 1.2" });
  // Three-point lines, from the season the league had them.
  if (three !== null) lines += el("path", { class: ft(o, "three-point-line", "ky-line"), d: `${threeLeft()}${threeRight()}`, "stroke-width": thin, fill: "none" });
  // Restricted areas (the NBA's from 1997), backboards, rims.
  const back = court.backboard.fromBaseline;
  const board = court.backboard.width / 2;
  if (restricted !== null) {
    lines += el("path", {
      class: ft(o, "restricted-areas", "ky-line"),
      d: `M${num(back)} ${num(cy - restricted)}H${num(bx)}A${num(restricted)} ${num(restricted)} 0 0 1 ${num(bx)} ${num(cy + restricted)}H${num(back)}M${num(L - back)} ${num(cy - restricted)}H${num(L - bx)}A${num(restricted)} ${num(restricted)} 0 0 0 ${num(L - bx)} ${num(cy + restricted)}H${num(L - back)}`,
      "stroke-width": thin,
      fill: "none",
    });
  }
  // The baskets, seen from above: the backboard, its arm and the rim (the usual), the backboard alone, a solid backboard and a filled rim, or none; or a function of the caller's.
  const reachRim = bx - back + court.rim;
  const basket = (end: 0 | 1): string => {
    const sign = end === 0 ? 1 : -1;
    const at = end === 0 ? back : L - back;
    const rimX = end === 0 ? bx : L - bx;
    if (o.goalMarkup !== undefined) return o.goalMarkup({ sport: "nba", end: end === 0 ? "left" : "right", x: at, y: cy, width: court.backboard.width, depth: reachRim, out: sign, line: thin });
    const boardLine = `M${num(at)} ${num(cy - board)}V${num(cy + board)}`;
    const arm = `M${num(at)} ${num(cy)}H${num(rimX - sign * court.rim)}`;
    switch (o.goals) {
      case "none":
        return "";
      case "line":
        return el("path", { class: ft(o, "backboards", "ky-board"), d: boardLine, "stroke-width": 0.5, fill: "none" });
      case "strip":
        return el("path", { class: ft(o, "backboards", "ky-board"), d: `${boardLine}${arm}`, "stroke-width": 1, fill: "none" }) + el("circle", { class: ft(o, "rims", "ky-rim"), cx: rimX, cy, r: court.rim, "stroke-width": 0.3, fill: "#e8591a" });
      default:
        return el("path", { class: ft(o, "backboards", "ky-board"), d: `${boardLine}${arm}`, "stroke-width": 0.5, fill: "none" }) + el("circle", { class: ft(o, "rims", "ky-rim"), cx: rimX, cy, r: court.rim, "stroke-width": 0.3, fill: "none" });
    }
  };
  if (o.goalMarkup === undefined && (o.goals === undefined || o.goals === "box")) {
    lines += el("path", { class: ft(o, "backboards", "ky-board"), d: `M${num(back)} ${num(cy - board)}V${num(cy + board)}M${num(L - back)} ${num(cy - board)}V${num(cy + board)}M${num(back)} ${num(cy)}H${num(bx - court.rim)}M${num(L - back)} ${num(cy)}H${num(L - bx + court.rim)}`, "stroke-width": 0.5, fill: "none" });
    lines += el("circle", { class: ft(o, "rims", "ky-rim"), cx: bx, cy, r: court.rim, "stroke-width": 0.3, fill: "none" });
    lines += el("circle", { class: ft(o, "rims", "ky-rim"), cx: L - bx, cy, r: court.rim, "stroke-width": 0.3, fill: "none" });
  } else lines += basket(0) + basket(1);

  const marks = court.marks;
  if (full && marks !== null) {
    // The marks along the lane (the first is the block), the lower defensive box's marks, the sideline marks and the substitution marks.
    const laneMarks: string[] = [];
    const block: string[] = [];
    marks.lane.forEach((x, i) => {
      const draw = (px: number): string => `M${num(px)} ${num(cy - half)}v-0.6M${num(px)} ${num(cy + half)}v0.6`;
      (i === 0 ? block : laneMarks).push(draw(x), draw(L - x));
    });
    lines += el("path", { class: ft(o, "court-marks", "ky-line"), d: laneMarks.join(""), "stroke-width": thin, fill: "none" });
    lines += el("path", { class: ft(o, "court-marks", "ky-line"), d: block.join(""), "stroke-width": thin * 2.4, fill: "none" });
    const box = marks.box;
    if (box !== null) {
      const yBox = [cy - half - box.fromLane, cy + half + box.fromLane];
      const boxMarks: string[] = [];
      for (const y of yBox) boxMarks.push(`M0 ${num(y)}h${num(box.length)}M${num(L)} ${num(y)}h${num(-box.length)}M${num(box.fromBaseline)} ${num(y)}v${num(y < cy ? box.length : -box.length)}M${num(L - box.fromBaseline)} ${num(y)}v${num(y < cy ? box.length : -box.length)}`);
      lines += el("path", { class: ft(o, "court-marks", "ky-line"), d: boxMarks.join(""), "stroke-width": thin, fill: "none" });
    }
    const side = marks.sideline;
    lines += el("path", { class: ft(o, "court-marks", "ky-line"), d: [side.fromBaseline, L - side.fromBaseline].map((x) => `M${num(x)} 0v${num(side.length)}M${num(x)} ${num(W)}v${num(-side.length)}`).join(""), "stroke-width": thin, fill: "none" });
    if (marks.substitution !== null) lines += el("path", { class: ft(o, "court-marks", "ky-line"), d: [L / 2 - marks.substitution, L / 2 + marks.substitution].map((x) => `M${num(x)} ${num(W)}v${num(-side.length)}`).join(""), "stroke-width": thin, fill: "none" });
  }

  // The court's own words and logo: the baseline words in the apron, the logo in the centre circle.
  const words = o.court?.baselineText;
  if (words !== undefined) {
    const x = -bw - 1.4;
    lines += textOn(turned, x, cy + 1.1, words[0], { size: 3, anchor: "middle", rot: -90, cls: ft(o, "baseline-text", "ky-baseline"), weight: 800, spacing: 0.3 });
    lines += textOn(turned, L - x, cy + 1.1, words[1], { size: 3, anchor: "middle", rot: 90, cls: ft(o, "baseline-text", "ky-baseline"), weight: 800, spacing: 0.3 });
  }
  if (o.court?.centreLogo !== undefined) {
    const s = court.centreRadius * 1.5;
    lines += el("image", { href: o.court.centreLogo, x: L / 2 - s / 2, y: cy - s / 2, width: s, height: s, preserveAspectRatio: "xMidYMid meet", transform: turned ? `rotate(-90 ${num(L / 2)} ${num(cy)})` : undefined });
  }

  // The teams' places and the score's panel, in proportion to the court (the NBA's is 94 feet by 50).
  const kx = L / NBA_COURT.length;
  const ky = W / NBA_COURT.width;
  const surface: Surface = {
    sport: "nba",
    view: view0,
    base,
    lines,
    defs: "",
    left: { cx: 16.5 * kx, cy, w: 27 * kx, h: 25 * ky, rot: 0, panel: true },
    right: { cx: L - 16.5 * kx, cy, w: 27 * kx, h: 25 * ky, rot: 0, panel: true },
    plate: { cx: L / 2, cy, w: 34 * kx, h: 20 * ky },
    turned,
    bannersOver: true,
  };
  surface.lineRef = { width: thin, feet: 1 };
  surface.box = { x: 0, y: 0, w: L, h: W };
  surface.centreRadius = court.centreRadius;
  // The paint: the lane from the baseline to the free-throw line and the circle beyond it, with a little floor round them.
  const paintDeep = keyW + R + 1.5;
  const paintHalf = Math.min(cy, Math.max(half, wide, R) + 2);
  surface.ranges = {
    "half-court": atEnds((end) => (end === "left" ? edges(0, 0, L / 2, W) : edges(L / 2, 0, L, W))),
    paint: atEnds((end) => (end === "left" ? edges(0, cy - paintHalf, paintDeep, cy + paintHalf) : edges(L - paintDeep, cy - paintHalf, L, cy + paintHalf))),
  };
  if (o.landmarks === true) {
    const R = court.freeThrowRadius;
    const cos = Math.cos((40 * Math.PI) / 180);
    const sin = Math.sin((40 * Math.PI) / 180);
    const marks: Mark[] = [
      { id: "sideline", x: L * 0.62, y: 0, side: "top" },
      { id: "baseline", x: 0, y: W * 0.8, side: "bottom" },
      { id: "half-court-line", x: L / 2, y: W, side: "bottom" },
      { id: "centre-circle", x: L / 2 + court.centreRadius * 0.7, y: cy - court.centreRadius * 0.7, side: "top" },
      { id: "key", x: keyW * 0.5, y: cy - half, side: "top" },
      { id: "free-throw-line", x: keyW, y: cy + half, side: "bottom" },
      { id: "free-throw-circle", x: keyW + R * 0.7, y: cy - R * 0.7, side: "top" },
      { id: "backboard", x: back, y: cy - board, side: "top" },
      { id: "basket", x: bx, y: cy + court.rim, side: "bottom" },
    ];
    if (three !== null) marks.push({ id: "three-point-line", x: bx + radius * cos, y: cy + radius * sin, side: "bottom" });
    if (restricted !== null) marks.push({ id: "restricted-area", x: bx + restricted * 0.7, y: cy - restricted * 0.7, side: "top" });
    surface.marks = marks;
  }
  if (turned) {
    const tt = quarterTurn(view0);
    surface.view = tt.view;
    surface.turn = tt.turn;
  }
  return surface;
}
