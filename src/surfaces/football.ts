import { el, num } from "../format.ts";
import { GOALPOST_WIDTH, HASH_LENGTH, footballLength, type FootballSpec } from "../geometry.ts";
import { mowTurf } from "../mow.ts";
import { ft, quarterTurn, textOn, type BuildOptions, type Mark, type Surface } from "./surface.ts";

const DIGIT_HEIGHT = 6;
/** A font size whose capital digits are six feet tall. */
const DIGIT_FONT = DIGIT_HEIGHT / 0.72;

/** Segments of one path: a `d` made of many short strokes. */
const segments = (parts: string[]): string => parts.join("");

/** What a season changes in a football field beyond its spec: whether it had hash marks, and the shape of its goal posts. */
export interface FootballMarks {
  hashMarks: boolean;
  postShape: "h" | "slingshot";
}

/**
 * A football field of the NFL, the CFL or the IFAF: the field, the end zones, the lines, the marks, the numbers and the posts.
 * The spec is the field of a season (`footballIn`); `marks` says what else that season had, and is today's by default.
 */
export function football(spec: FootballSpec, o: BuildOptions, marks: FootballMarks = { hashMarks: true, postShape: "slingshot" }): Surface {
  const L = footballLength(spec);
  const W = spec.width;
  const e = spec.endZone;
  const m = o.margin ?? 12;
  const view0 = { x: -m, y: -m, w: L + 2 * m, h: W + 2 * m };
  const band = o.exact ? spec.boundary : Math.max(spec.boundary, 1.2);
  const lw = o.exact ? 1 / 3 : 0.8;
  const goal = o.exact ? 1 / 3 : 1.1;
  const mark = o.exact ? 1 / 3 : 0.6;
  const yards = spec.length / spec.yardLine;
  const turned = o.portrait;
  const full = o.detail === "full";

  // Base: the ground, the turf, the mown stripes, the end zones.
  let base = el("rect", { class: ft(o, "apron", "ky-apron"), x: view0.x, y: view0.y, width: view0.w, height: view0.h });
  base += el("rect", { class: ft(o, "turf", "ky-surface"), x: 0, y: 0, width: L, height: W });
  let defs = "";
  if (o.stripes && (o.mow === undefined || o.mow === "bands" || o.mow === "rings" || o.mow === "fan")) {
    const stripes: string[] = [];
    for (let k = 1; k < yards; k += 2) stripes.push(`M${num(e + spec.yardLine * k)} 0h${num(spec.yardLine)}v${num(W)}h${num(-spec.yardLine)}z`);
    base += el("path", { class: ft(o, "mowing", "ky-stripe"), d: segments(stripes) });
  } else if (o.stripes && o.mow !== "none") {
    // Another pattern, mown on the field of play between the goal lines; the end zones are mown as the field is.
    const mown = mowTurf(o.mow as NonNullable<BuildOptions["mow"]>, { x: e, y: 0, w: spec.length, h: W }, spec.yardLine);
    if (mown.path !== "") {
      if (mown.clip) defs = `<clipPath id="${o.id}-turf"><rect x="${num(e)}" y="0" width="${num(spec.length)}" height="${num(W)}"/></clipPath>`;
      base += el("path", { class: ft(o, "mowing", "ky-stripe"), d: mown.path, "fill-rule": mown.evenodd ? "evenodd" : undefined, "clip-path": mown.clip ? `url(#${o.id}-turf)` : undefined });
    }
  }
  base += el("rect", { class: ft(o, "end-zone-left", "ky-zone ky-zone-left"), x: 0, y: 0, width: e, height: W });
  base += el("rect", { class: ft(o, "end-zone-right", "ky-zone ky-zone-right"), x: L - e, y: 0, width: e, height: W });

  // Lines: the boundary band, the yard lines, the goal lines.
  let lines = el("rect", { class: ft(o, "boundary", "ky-line ky-band"), x: -band / 2, y: -band / 2, width: L + band, height: W + band, "stroke-width": band, fill: "none" });
  const yardPath: string[] = [];
  for (let i = 1; i < yards; i += 1) yardPath.push(`M${num(e + spec.yardLine * i)} 0V${num(W)}`);
  lines += el("path", { class: ft(o, "yard-lines", "ky-line"), d: segments(yardPath), "stroke-width": lw });
  lines += el("path", { class: ft(o, "goal-lines", "ky-line"), d: `M${num(e)} 0V${num(W)}M${num(L - e)} 0V${num(W)}`, "stroke-width": goal });

  if (full) {
    // Hash marks at each yard, 2 feet long and the width of the hash-mark lines from each sideline, in the field of play only.
    const hashes: string[] = [];
    const ticks: string[] = [];
    const feetPerYard = 3;
    const inset = 1 / 3;
    for (let k = 1; k < spec.length / feetPerYard; k += 1) {
      if ((k * feetPerYard) % spec.yardLine === 0) continue;
      const x = e + feetPerYard * k;
      if (marks.hashMarks) hashes.push(`M${num(x)} ${num(spec.hash - HASH_LENGTH)}v${HASH_LENGTH}M${num(x)} ${num(W - spec.hash)}v${HASH_LENGTH}`);
      if (spec.id !== "cfl") ticks.push(`M${num(x)} ${num(inset)}v${HASH_LENGTH}M${num(x)} ${num(W - inset - HASH_LENGTH)}v${HASH_LENGTH}`);
    }
    // At the five-yard lines the hash marks cross the line: a short stripe along the sideline's direction.
    for (let i = 1; marks.hashMarks && i < yards; i += 1) {
      const x = e + spec.yardLine * i;
      hashes.push(`M${num(x - 1)} ${num(spec.hash - 1)}h2M${num(x - 1)} ${num(W - spec.hash + 1)}h2`);
    }
    if (hashes.length > 0) lines += el("path", { class: ft(o, "hash-marks", "ky-line"), d: segments(hashes), "stroke-width": mark });
    if (ticks.length > 0) lines += el("path", { class: ft(o, "hash-marks", "ky-line"), d: segments(ticks), "stroke-width": mark });
  }

  // Numbers: each ten yards, upright on the near side and upside down on the far one, with an arrow to the nearest goal line.
  const size = DIGIT_FONT;
  const numCls = ft(o, "numbers", "ky-num");
  const [near, far] = spec.numbers;
  const numbered = spec.noNumbers !== true;
  const centreY = (near + far) / 2;
  const yardsLong = spec.length / 3;
  const positions: { x: number; label: string; pos: number }[] = [];
  for (let p = 10; numbered && p < yardsLong; p += 10) {
    const label = String(Math.min(p, yardsLong - p));
    positions.push({ x: e + p * 3, label, pos: p });
  }
  // The CFL marks its centre C; on a field whose middle is a ten-yard line (the 100 yards planned for 2027) the line is a 50, as the NFL's.
  if (numbered && spec.id === "cfl" && (yardsLong / 2) % 10 !== 0) positions.push({ x: e + (yardsLong / 2) * 3, label: spec.centre, pos: yardsLong / 2 });
  let numbers = "";
  for (const side of ["near", "far"] as const) {
    const y = side === "near" ? W - centreY : centreY;
    for (const p of positions) {
      const nearGoalLeft = p.pos < yardsLong / 2;
      const centre = p.label === spec.centre || p.pos === yardsLong / 2;
      const digits = [...p.label];
      const flip = side === "far";
      if (digits.length === 1) numbers += textOn(turned, p.x, y + DIGIT_HEIGHT / 2, p.label, { size, anchor: "middle", cls: numCls, flip, weight: 700 });
      else {
        const dx = 3.4;
        if (turned) {
          // Turned a quarter, the digits stand side by side on the screen, which is along the field's width.
          numbers += textOn(turned, p.x, y + dx + DIGIT_HEIGHT / 2, digits[0], { size, anchor: "middle", cls: numCls, weight: 700 });
          numbers += textOn(turned, p.x, y - dx + DIGIT_HEIGHT / 2, digits[1], { size, anchor: "middle", cls: numCls, weight: 700 });
        } else {
          // Seen from the far sideline a number reads the other way round along the field: its digits swap places.
          numbers += textOn(turned, p.x - dx, y + DIGIT_HEIGHT / 2, flip ? digits[1] : digits[0], { size, anchor: "middle", cls: numCls, flip, weight: 700 });
          numbers += textOn(turned, p.x + dx, y + DIGIT_HEIGHT / 2, flip ? digits[0] : digits[1], { size, anchor: "middle", cls: numCls, flip, weight: 700 });
        }
      }
      if (full && !centre && Number(p.label) < 50) {
        const ax = nearGoalLeft ? p.x - 8.4 : p.x + 8.4;
        const dir = nearGoalLeft ? -1 : 1;
        numbers += el("path", { class: ft(o, "numbers", "ky-fill-line"), d: `M${num(ax + dir * 1.5)} ${num(y)}L${num(ax - dir * 1.5)} ${num(y - 1.6)}V${num(y + 1.6)}Z` });
      }
    }
  }
  if (numbered) lines += el("g", { class: "ky-numbers" }, numbers);

  // Goal posts, seen from above: the crossbar, the uprights' ends and the stem.
  if (full) {
    const postX = spec.posts === "end-line" ? [-band / 2, L + band / 2] : [e, L - e];
    const outward = spec.posts === "end-line" ? [-1, 1] : [-1, 1];
    let posts = "";
    postX.forEach((x, i) => {
      const dir = outward[i];
      const h = (spec.postWidth ?? GOALPOST_WIDTH) / 2;
      if (o.goalMarkup !== undefined) {
        posts += o.goalMarkup({ sport: spec.id, end: i === 0 ? "left" : "right", x, y: W / 2, width: 2 * h, depth: marks.postShape === "slingshot" ? 4 : 0, out: dir as 1 | -1, line: lw });
        return;
      }
      if (o.goals === "none") return;
      // A slingshot post has one support behind the crossbar, drawn as a stem; an H has two poles, which are the ends.
      const stem = marks.postShape === "slingshot" && o.goals !== "line" ? `M${num(x)} ${num(W / 2)}h${num(dir * 4)}` : "";
      const bold = o.goals === "strip";
      posts += el("path", { class: ft(o, "posts", "ky-post"), d: `M${num(x)} ${num(W / 2 - h)}V${num(W / 2 + h)}${stem}`, fill: "none", "stroke-width": bold ? 1.8 : 0.9 });
      if (o.goals === "line") return;
      posts += el("circle", { class: ft(o, "posts", "ky-post-end"), cx: x, cy: W / 2 - h, r: bold ? 1.6 : 1.1 });
      posts += el("circle", { class: ft(o, "posts", "ky-post-end"), cx: x, cy: W / 2 + h, r: bold ? 1.6 : 1.1 });
    });
    if (posts !== "") lines += el("g", { class: "ky-posts" }, posts);
    // Pylons at the corners of the goal lines and the end lines.
    const corners = [[e, 0, 1, 1], [e, W, 1, -1], [L - e, 0, -1, 1], [L - e, W, -1, -1], [0, 0, 1, 1], [0, W, 1, -1], [L, 0, -1, 1], [L, W, -1, -1]];
    if (spec.pylons !== false) lines += el("g", { class: "ky-pylons" }, corners.map(([x, y, sx, sy]) => el("rect", { class: ft(o, "pylons", "ky-pylon"), x: x + (sx > 0 ? 0 : -1.6), y: y + (sy > 0 ? 0 : -1.6), width: 1.6, height: 1.6 })).join(""));
  }

  const long = Math.min(W * 0.86, 142);
  const short = Math.min(e * 0.84, 44);
  const surface: Surface = {
    sport: spec.id,
    view: view0,
    base,
    lines,
    defs,
    left: { cx: e / 2, cy: W / 2, w: long, h: short, rot: -90 },
    right: { cx: L - e / 2, cy: W / 2, w: long, h: short, rot: 90 },
    plate: { cx: L / 2, cy: W / 2, w: Math.min(L * 0.36, 150), h: 70 },
    turned,
  };
  surface.lineRef = { width: lw, feet: 1 };
  surface.box = { x: 0, y: 0, w: L, h: W };
  if (o.landmarks === true) {
    const marks: Mark[] = [
      { id: "end-zone", x: e / 2, y: 0, side: "top" },
      { id: "goal-line", x: e, y: 0, side: "top" },
      { id: "yard-line", x: e + spec.yardLine * 2, y: 0, side: "top" },
      { id: "midfield", x: L / 2, y: 0, side: "top" },
      { id: "end-line", x: 0, y: W * 0.8, side: "bottom" },
      { id: "sideline", x: L * 0.3, y: W, side: "bottom" },
      { id: "hash-marks", x: e + spec.yardLine * 5.5, y: W - spec.hash, side: "bottom" },
    ];
    if (numbered) marks.push({ id: "yard-numbers", x: e + 30 * 3, y: centreY, side: "top" });
    if (full) {
      marks.push({ id: "goal-posts", x: spec.posts === "end-line" ? -band / 2 : e, y: W / 2 - (spec.postWidth ?? GOALPOST_WIDTH) / 2, side: "top" });
      if (spec.pylons !== false) marks.push({ id: "pylon", x: L - e, y: W, side: "bottom" });
    }
    surface.marks = marks;
  }
  if (turned) {
    const t = quarterTurn(view0);
    surface.view = t.view;
    surface.turn = t.turn;
  }
  return surface;
}

