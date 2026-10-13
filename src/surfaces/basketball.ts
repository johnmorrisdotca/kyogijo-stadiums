import { el, num } from "../format.ts";
import { rulesFor, type NbaRules } from "../eras.ts";
import { NBA } from "../geometry.ts";
import { quarterTurn, textOn, type BuildOptions, type Surface } from "./surface.ts";

/** The NBA court: the floor, the keys, the arcs, the circles, the baskets and the small marks, as the rules of a season (today's by default) marked them. */
export function basketball(o: BuildOptions, era: NbaRules = rulesFor("nba").rules): Surface {
  const { length: L, width: W } = NBA;
  const m = o.margin ?? 7;
  const view0 = { x: -m, y: -m, w: L + 2 * m, h: W + 2 * m };
  const cy = W / 2;
  const full = o.detail === "full";
  const bw = 2.6;
  const thin = o.exact ? 1 / 6 : 0.4;
  const turned = o.portrait;
  const half = era.keyWidth / 2;
  // The three-point line: an arc of the season's radius from the basket, meeting the straight lines 3 feet in from the sidelines.
  const t = { ...NBA.threePoint, radius: era.threePoint?.radius ?? NBA.threePoint.radius };
  const J = NBA.basket + Math.sqrt(t.radius * t.radius - t.corner * t.corner);

  let base = el("rect", { class: "ky-apron", x: view0.x, y: view0.y, width: view0.w, height: view0.h });
  base += el("path", { class: "ky-boards", "fill-rule": "evenodd", d: `M${-bw} ${-bw}H${L + bw}V${W + bw}H${-bw}ZM0 0V${W}H${L}V0Z` });
  base += el("rect", { class: "ky-surface", x: 0, y: 0, width: L, height: W });
  if (o.stripes) {
    // The planks run along the court: a second tone on every other board.
    const planks: string[] = [];
    for (let y = 1; y < W; y += 2) planks.push(`M0 ${y}H${L}v1H0z`);
    base += el("path", { class: "ky-stripe", d: planks.join("") });
  }
  // The keys, painted, and the three-point areas when asked.
  const keyW = NBA.freeThrowLine;
  if (o.court?.paintThreePoint && era.threePoint !== null) {
    base += el("path", { class: "ky-key ky-key-left", d: `M0 ${t.sideInset}H${num(J)}A${t.radius} ${t.radius} 0 0 1 ${num(J)} ${W - t.sideInset}H0Z` });
    base += el("path", { class: "ky-key ky-key-right", d: `M${L} ${t.sideInset}H${num(L - J)}A${t.radius} ${t.radius} 0 0 0 ${num(L - J)} ${W - t.sideInset}H${L}Z` });
  }
  base += el("rect", { class: "ky-key ky-key-left", x: 0, y: cy - half, width: keyW, height: era.keyWidth });
  base += el("rect", { class: "ky-key ky-key-right", x: L - keyW, y: cy - half, width: keyW, height: era.keyWidth });
  base += el("circle", { class: "ky-centre", cx: L / 2, cy, r: NBA.centreRadius });

  let lines = el("rect", { class: "ky-line", x: 0, y: 0, width: L, height: W, "stroke-width": thin * 1.25, fill: "none" });
  lines += el("path", { class: "ky-line", d: `M${L / 2} 0V${W}`, "stroke-width": thin, fill: "none" });
  lines += el("circle", { class: "ky-line", cx: L / 2, cy, r: NBA.centreRadius, "stroke-width": thin, fill: "none" });
  if (full) lines += el("circle", { class: "ky-line", cx: L / 2, cy, r: NBA.centreInnerRadius, "stroke-width": thin, fill: "none" });
  // Lane lines, with the free-throw lines across them.
  lines += el("path", { class: "ky-line", d: `M0 ${cy - half}H${keyW}V${cy + half}H0M${L} ${cy - half}H${L - keyW}V${cy + half}H${L}`, "stroke-width": thin, fill: "none" });
  const R = NBA.freeThrowRadius;
  // The free-throw circles: whole outside the key, dashed inside it.
  lines += el("path", { class: "ky-line", d: `M${keyW} ${cy - R}A${R} ${R} 0 0 1 ${keyW} ${cy + R}M${L - keyW} ${cy - R}A${R} ${R} 0 0 0 ${L - keyW} ${cy + R}`, "stroke-width": thin, fill: "none" });
  lines += el("path", { class: "ky-line", d: `M${keyW} ${cy - R}A${R} ${R} 0 0 0 ${keyW} ${cy + R}M${L - keyW} ${cy - R}A${R} ${R} 0 0 1 ${L - keyW} ${cy + R}`, "stroke-width": thin, fill: "none", "stroke-dasharray": "1.6 1.2" });
  // Three-point lines, from the season the league had them.
  if (era.threePoint !== null) {
    lines += el("path", {
      class: "ky-line",
      d: `M0 ${t.sideInset}H${num(J)}A${t.radius} ${t.radius} 0 0 1 ${num(J)} ${W - t.sideInset}H0M${L} ${t.sideInset}H${num(L - J)}A${t.radius} ${t.radius} 0 0 0 ${num(L - J)} ${W - t.sideInset}H${L}`,
      "stroke-width": thin,
      fill: "none",
    });
  }
  // Restricted areas (from 1997), backboards, rims.
  const bx = NBA.basket;
  const back = NBA.backboard.fromBaseline;
  if (era.restrictedArea) {
    lines += el("path", {
      class: "ky-line",
      d: `M${back} ${cy - NBA.restricted}H${bx}A${NBA.restricted} ${NBA.restricted} 0 0 1 ${bx} ${cy + NBA.restricted}H${back}M${L - back} ${cy - NBA.restricted}H${L - bx}A${NBA.restricted} ${NBA.restricted} 0 0 0 ${L - bx} ${cy + NBA.restricted}H${L - back}`,
      "stroke-width": thin,
      fill: "none",
    });
  }
  lines += el("path", { class: "ky-board", d: `M${back} ${cy - NBA.backboard.width / 2}V${cy + NBA.backboard.width / 2}M${L - back} ${cy - NBA.backboard.width / 2}V${cy + NBA.backboard.width / 2}M${back} ${cy}H${bx - NBA.rim}M${L - back} ${cy}H${L - bx + NBA.rim}`, "stroke-width": 0.5, fill: "none" });
  lines += el("circle", { class: "ky-rim", cx: bx, cy, r: NBA.rim, "stroke-width": 0.3, fill: "none" });
  lines += el("circle", { class: "ky-rim", cx: L - bx, cy, r: NBA.rim, "stroke-width": 0.3, fill: "none" });

  if (full) {
    // The marks along the lane (the first is the block), the lower defensive box's marks, the sideline marks and the substitution marks.
    const lane: string[] = [];
    const block: string[] = [];
    NBA.laneMarks.forEach((x, i) => {
      const draw = (px: number): string => `M${num(px)} ${cy - half}v-0.6M${num(px)} ${cy + half}v0.6`;
      (i === 0 ? block : lane).push(draw(x), draw(L - x));
    });
    lines += el("path", { class: "ky-line", d: lane.join(""), "stroke-width": thin, fill: "none" });
    lines += el("path", { class: "ky-line", d: block.join(""), "stroke-width": thin * 2.4, fill: "none" });
    const box = NBA.boxMark;
    const yBox = [cy - half - box.fromLane, cy + half + box.fromLane];
    const marks: string[] = [];
    for (const y of yBox) marks.push(`M0 ${num(y)}h${box.length}M${L} ${num(y)}h${-box.length}M${box.fromBaseline} ${num(y)}v${y < cy ? box.length : -box.length}M${L - box.fromBaseline} ${num(y)}v${y < cy ? box.length : -box.length}`);
    lines += el("path", { class: "ky-line", d: marks.join(""), "stroke-width": thin, fill: "none" });
    const side = NBA.sidelineMark;
    lines += el("path", { class: "ky-line", d: [side.fromBaseline, L - side.fromBaseline].map((x) => `M${num(x)} 0v${side.length}M${num(x)} ${W}v${-side.length}`).join(""), "stroke-width": thin, fill: "none" });
    lines += el("path", { class: "ky-line", d: [L / 2 - NBA.substitution, L / 2 + NBA.substitution].map((x) => `M${num(x)} ${W}v${-side.length}`).join(""), "stroke-width": thin, fill: "none" });
  }

  // The court's own words and logo: the baseline words in the apron, the logo in the centre circle.
  const words = o.court?.baselineText;
  if (words !== undefined) {
    const x = -bw - 1.4;
    lines += textOn(turned, x, cy + 1.1, words[0], { size: 3, anchor: "middle", rot: -90, cls: "ky-baseline", weight: 800, spacing: 0.3 });
    lines += textOn(turned, L - x, cy + 1.1, words[1], { size: 3, anchor: "middle", rot: 90, cls: "ky-baseline", weight: 800, spacing: 0.3 });
  }
  if (o.court?.centreLogo !== undefined) {
    const s = NBA.centreRadius * 1.5;
    lines += el("image", { href: o.court.centreLogo, x: L / 2 - s / 2, y: cy - s / 2, width: s, height: s, preserveAspectRatio: "xMidYMid meet", transform: turned ? `rotate(-90 ${num(L / 2)} ${num(cy)})` : undefined });
  }

  const surface: Surface = {
    sport: "nba",
    view: view0,
    base,
    lines,
    defs: "",
    left: { cx: 16.5, cy, w: 27, h: 25, rot: 0, panel: true },
    right: { cx: L - 16.5, cy, w: 27, h: 25, rot: 0, panel: true },
    plate: { cx: L / 2, cy, w: 34, h: 20 },
    turned,
    bannersOver: true,
  };
  if (turned) {
    const tt = quarterTurn(view0);
    surface.view = tt.view;
    surface.turn = tt.turn;
  }
  return surface;
}
