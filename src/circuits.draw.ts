// A circuit drawn: the plan of `circuits.ts` as one SVG string. The ground of the circuit and its pit building, the lap as a ribbon of the track's width with its white edges, the pit lane, the start line and the
// chequered finish line across the track, arrows that show which way the lap runs, each turn's number beside its bend, a north arrow and a scale bar, the name and the credit of the map's data. Nothing of a race's,
// a series' or a team's: no logo, no sponsor, no mark. The same options always give the same string.
import type { Pt } from "./crowd.ts";
import { pointAlong } from "./circuits.geo.ts";
import { circuitOf, circuitPlan, CIRCUIT_ATTRIBUTION, type CircuitPlan, type PlanTurn } from "./circuits.ts";
import { KYOGIJO_CIRCUIT_STYLE } from "./circuits.style.ts";
import type { CircuitOptions } from "./circuits.types.ts";
import { CIRCUIT_WORDS } from "./circuits.words.ts";
import { metaMarkup, safeClass } from "./common.ts";
import { el, esc, hash, num } from "./format.ts";
import { FEET_PER_METRE as FT } from "./geometry.ts";
import { fill } from "./strings.core.ts";
import type { Language } from "./types.ts";
import { VERSION } from "./version.ts";

/** A drawing of a circuit and what was worked out to make it. */
export interface CircuitDrawing {
  svg: string;
  plan: CircuitPlan;
  /** The viewBox, in feet. */
  viewBox: { x: number; y: number; w: number; h: number };
  /** The size of the drawing's type and marks: a thousandth of its longer side, in feet. */
  k: number;
  /** Where each turn's number is drawn (its badge's middle), in feet, or would be when `turns` is `false`. */
  badges: { n: number; at: Pt; r: number }[];
  title: string;
  description: string;
}

const path = (points: readonly Pt[], closed: boolean): string => `M${points.map(([x, y]) => `${num(x)} ${num(y)}`).join("L")}${closed ? "Z" : ""}`;
const right = ([dx, dy]: Pt): Pt => [-dy, dx];
const add = (a: Pt, b: Pt, k = 1): Pt => [a[0] + b[0] * k, a[1] + b[1] * k];

/** The metres of a length in the words' own way: one decimal of a kilometre. */
const km = (metres: number, language: Language): string => (metres / 1000).toLocaleString(language === "ja" ? "ja-JP" : "en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

/** The words of a circuit's drawing: its title and its description, sentence by sentence. */
export function circuitText(plan: CircuitPlan, language: Language, standing?: string): { title: string; description: string } {
  const c = plan.circuit;
  const w = CIRCUIT_WORDS[language];
  const name = c.names[language];
  const gap = language === "ja" ? "" : " ";
  const parts = [
    fill(w.lap, { name, km: km(c.length.value, language), measured: km(plan.measured, language) }),
    c.direction.value === "counterclockwise" ? w.counterclockwise : w.clockwise,
    fill(w.turns, { turns: c.corners.value }),
    w.pit,
    ...(plan.building === undefined ? [] : [w.building]),
    ...(c.width.basis === "plausible" ? [fill(w.width, { width: c.width.value })] : []),
    ...(standing === undefined || standing === "" ? [] : [standing]),
    fill(w.credit, { credit: CIRCUIT_ATTRIBUTION }),
  ];
  return { title: fill(w.title, { name }), description: parts.join(gap) };
}

/** The badges of the turns' numbers: each beside the outside of its bend, then pushed apart where two would touch, in the same few steps every time. */
function badgesOf(plan: CircuitPlan, r: number, k: number): { n: number; at: Pt; r: number; from: Pt }[] {
  const middle: Pt = [(plan.box.x0 + plan.box.x1) / 2, (plan.box.y0 + plan.box.y1) / 2];
  const reach = plan.width / 2 + r + 4 * k;
  const placed = plan.turns.map((t: PlanTurn) => {
    let normal = right(t.dir);
    if (t.side === 1) normal = right(t.dir);
    else if (t.side === -1) normal = [-normal[0], -normal[1]];
    else if ((t.at[0] - middle[0]) * normal[0] + (t.at[1] - middle[1]) * normal[1] < 0) normal = [-normal[0], -normal[1]];
    return { n: t.n, at: add(t.at, normal, reach), r, from: t.at };
  });
  // Two badges that would touch are pushed apart along the line between them; a badge that would lie on the track is pushed off it.
  for (let round = 0; round < 40; round += 1) {
    let moved = false;
    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        const [a, b] = [placed[i], placed[j]];
        const dx = b.at[0] - a.at[0];
        const dy = b.at[1] - a.at[1];
        const d = Math.hypot(dx, dy);
        const want = 2 * r + 2 * k;
        if (d >= want) continue;
        const [ux, uy] = d < 1e-6 ? [1, 0] : [dx / d, dy / d];
        const push = (want - d) / 2 + 0.01;
        a.at = [a.at[0] - ux * push, a.at[1] - uy * push];
        b.at = [b.at[0] + ux * push, b.at[1] + uy * push];
        moved = true;
      }
    }
    for (const b of placed) {
      for (let i = 0; i < plan.lap.length; i += 1) {
        const p = plan.lap[i];
        const q = plan.lap[(i + 1) % plan.lap.length];
        const ex = q[0] - p[0];
        const ey = q[1] - p[1];
        const len2 = ex * ex + ey * ey || 1;
        const t = Math.min(1, Math.max(0, ((b.at[0] - p[0]) * ex + (b.at[1] - p[1]) * ey) / len2));
        const near: Pt = [p[0] + t * ex, p[1] + t * ey];
        const d = Math.hypot(b.at[0] - near[0], b.at[1] - near[1]);
        const want = plan.width / 2 + r + k;
        if (d >= want || d < 1e-6) continue;
        b.at = add(near, [(b.at[0] - near[0]) / d, (b.at[1] - near[1]) / d], want + 0.01);
        moved = true;
      }
    }
    if (!moved) break;
  }
  return placed;
}

/** The finish line: two rows of squares across the track, black and white in turn, along the way the lap runs. */
function chequer(at: Pt, dir: Pt, width: number): string {
  const cells = 6;
  const s = width / cells;
  const across = right(dir);
  let out = "";
  for (let row = 0; row < 2; row += 1) {
    for (let i = 0; i < cells; i += 1) {
      const o = add(add(at, across, -width / 2 + i * s), dir, (row - 1) * s);
      const corners = [o, add(o, across, s), add(add(o, across, s), dir, s), add(o, dir, s)];
      out += el("path", { class: (i + row) % 2 === 0 ? "ky-ci-check-a" : "ky-ci-check-b", d: path(corners, true) });
    }
  }
  return el("g", { class: "ky-ci-finish" }, out);
}

/** The north arrow at `at`, pointing `north` degrees clockwise from the top of the page, `size` long, with an N drawn as strokes (no font). */
function northArrow(at: Pt, north: number, size: number, label: string): string {
  const a = (north * Math.PI) / 180;
  const u: Pt = [Math.sin(a), -Math.cos(a)];
  const v = right(u);
  const p = (along: number, side = 0): string => {
    const q = add(add(at, u, along * size), v, side * size);
    return `${num(q[0])} ${num(q[1])}`;
  };
  const arrow = el("path", { class: "ky-ci-north", d: `M${p(-0.5)}L${p(0.5)}M${p(0.5)}L${p(0.18, 0.16)}L${p(0.18, -0.16)}Z`, "stroke-width": num(size * 0.06) });
  // The N stands upright beside the arrow's tail, whichever way the arrow points.
  const n = add(at, u, -0.5 * size - 0.32 * size);
  const h = size * 0.16;
  const letter = el("path", { class: "ky-ci-north-n", d: `M${num(n[0] - h * 0.75)} ${num(n[1] + h)}V${num(n[1] - h)}L${num(n[0] + h * 0.75)} ${num(n[1] + h)}V${num(n[1] - h)}`, "stroke-width": num(size * 0.055) });
  return el("g", { class: "ky-ci-compass", "aria-label": label, role: "img" }, arrow + letter);
}

/** A scale bar of a round number of metres that is about a fifth of the drawing's width, at `at` (its left end), with its numbers. */
function scaleBar(at: Pt, width: number, k: number, unit: string): string {
  const steps = [100, 200, 250, 500, 1000, 2000];
  const metres = steps.reduce((best, s) => (Math.abs(s * FT - width / 5) < Math.abs(best * FT - width / 5) ? s : best), steps[0]);
  const long = metres * FT;
  const h = 5 * k;
  const text = 15 * k;
  let out = el("rect", { class: "ky-ci-scale-fill", x: at[0], y: at[1] - h, width: long / 2, height: h });
  out += el("rect", { class: "ky-ci-scale", x: at[0], y: at[1] - h, width: long, height: h, "stroke-width": num(1.4 * k) });
  for (const [x, label] of [[0, "0"], [long / 2, String(metres / 2)], [long, `${metres} ${unit}`]] as const) {
    out += el("text", { class: "ky-ci-scale-text", x: at[0] + x, y: at[1] - h - 5 * k, "font-size": num(text), "text-anchor": x === 0 ? "start" : x === long ? "end" : "middle" }, esc(label));
  }
  return el("g", { class: "ky-ci-scalebar", "data-metres": metres }, out);
}

/** The arrows along the lap: a few, evenly round it, each pointing the way the lap runs. */
function arrows(plan: CircuitPlan, k: number): string {
  const count = 8;
  const total = plan.lap.reduce((sum, p, i) => sum + Math.hypot(plan.lap[(i + 1) % plan.lap.length][0] - p[0], plan.lap[(i + 1) % plan.lap.length][1] - p[1]), 0);
  const size = Math.max(plan.width * 1.2, 15 * k);
  let out = "";
  for (let i = 0; i < count; i += 1) {
    // Halfway between two of the evenly spaced places, so that none sits on the start.
    const { at, dir } = pointAlong(plan.lap, plan.start.along + ((i + 0.5) * total) / count);
    const side = right(dir);
    const tip = add(at, dir, size * 0.6);
    const back = add(at, dir, -size * 0.5);
    out += el("path", { class: "ky-ci-arrow", d: path([tip, add(back, side, size * 0.45), add(at, dir, -size * 0.15), add(back, side, -size * 0.45)], true), "stroke-width": num(k * 0.8) });
  }
  return el("g", { class: "ky-ci-arrows" }, out);
}

/** A circuit's drawing and what was worked out to make it. */
export function circuitDrawing(options: CircuitOptions): CircuitDrawing {
  const circuit = circuitOf(options.circuit);
  const language: Language = options.language === "ja" ? "ja" : "en";
  const words = CIRCUIT_WORDS[language];
  const plan = circuitPlan(circuit);
  const label = options.label !== false;
  const showTurns = options.turns !== false;
  const base = Math.max(plan.box.x1 - plan.box.x0, plan.box.y1 - plan.box.y0);
  const k = base / 1000;
  const pad = 46 * k;
  const head = label ? 70 * k : 0;
  const foot = 44 * k;
  const viewBox = { x: plan.box.x0 - pad, y: plan.box.y0 - pad - head, w: plan.box.x1 - plan.box.x0 + 2 * pad, h: plan.box.y1 - plan.box.y0 + 2 * pad + head + foot };
  const gid = safeClass(options.id).replace(/ /g, "-") || `ky-ci-${hash(JSON.stringify([options, VERSION]))}`;
  const { title, description } = circuitText(plan, language);
  const r = 13 * k;
  const placed = badgesOf(plan, r, k);

  const framed = options.frame !== false;
  let body = framed ? el("rect", { class: "ky-ci-ground", x: viewBox.x, y: viewBox.y, width: viewBox.w, height: viewBox.h }) : "";
  body += el("path", { class: "ky-ci-area", d: path(plan.area, true), "stroke-width": num(1.2 * k) });
  if (plan.building !== undefined) body += el("path", { class: "ky-ci-building", d: path(plan.building.ring, true), "stroke-width": num(1.2 * k), "data-height": num(plan.building.height / FT) });
  const lapD = path(plan.lap, true);
  const pitD = path(plan.pitLane, false);
  const edge = Math.max(plan.width * 0.14, 1.1 * k);
  body += el("path", { class: "ky-ci-halo", d: lapD, "stroke-width": num(plan.width + 9 * k) });
  body += el("path", { class: "ky-ci-edge ky-ci-pit-edge", d: pitD, "stroke-width": num(plan.pitWidth + 2 * edge) });
  body += el("path", { class: "ky-ci-pit", d: pitD, "stroke-width": num(plan.pitWidth), "data-part": "pit-lane" });
  body += el("path", { class: "ky-ci-edge", d: lapD, "stroke-width": num(plan.width + 2 * edge) });
  body += el("path", { class: "ky-ci-track", d: lapD, "stroke-width": num(plan.width), "data-part": "lap" });
  if (options.arrows !== false) body += arrows(plan, k);
  // The start line: one white line across the track; the finish: a chequered band across it.
  const across = right(plan.start.dir);
  const s0 = add(plan.start.at, across, -plan.width / 2);
  const s1 = add(plan.start.at, across, plan.width / 2);
  body += el("path", { class: "ky-ci-start", d: path([s0, s1], false), "stroke-width": num(Math.max(1.6 * FT, 1.2 * k)), "data-part": "start" });
  body += chequer(plan.finish.at, plan.finish.dir, plan.width);
  // The turns' numbers, each with a thin line to its bend.
  let turns = "";
  for (const b of showTurns ? placed : []) {
    const toward = Math.hypot(b.at[0] - b.from[0], b.at[1] - b.from[1]);
    const lead = toward < 1e-6 ? b.from : add(b.from, [(b.at[0] - b.from[0]) / toward, (b.at[1] - b.from[1]) / toward], plan.width / 2);
    let inner = el("path", { class: "ky-ci-leader", d: path([lead, b.at], false), "stroke-width": num(1.1 * k) });
    inner += el("circle", { class: "ky-ci-badge", cx: b.at[0], cy: b.at[1], r: b.r, "stroke-width": num(1.4 * k) });
    inner += el("text", { class: "ky-ci-badge-n", x: b.at[0], y: b.at[1] + b.r * 0.4, "font-size": num(b.r * (b.n >= 10 ? 1.05 : 1.25)) }, String(b.n));
    turns += el("g", { class: "ky-ci-turn", "data-turn": b.n, "aria-label": fill(words.turn, { n: b.n }) }, inner);
  }
  body += el("g", { class: "ky-ci-turns" }, turns);
  // The name and the facts in the top left; the north arrow in the top right; the scale bar and the credit along the foot.
  if (label) {
    body += el("text", { class: "ky-ci-name", x: viewBox.x + pad * 0.6, y: viewBox.y + 36 * k, "font-size": num(26 * k) }, esc(circuit.names[language]));
    body += el("text", { class: "ky-ci-facts", x: viewBox.x + pad * 0.6, y: viewBox.y + 60 * k, "font-size": num(16 * k) }, esc(fill(words.facts, { km: km(circuit.length.value, language), turns: circuit.corners.value })));
  }
  if (framed) {
    body += northArrow([viewBox.x + viewBox.w - pad * 0.6 - 20 * k, viewBox.y + (label ? 44 * k : pad)], plan.north, 40 * k, words.northArrow);
    body += scaleBar([viewBox.x + pad * 0.6, viewBox.y + viewBox.h - 14 * k], viewBox.w, k, words.metres);
    body += el("text", { class: "ky-ci-credit", x: viewBox.x + viewBox.w - pad * 0.6, y: viewBox.y + viewBox.h - 14 * k, "font-size": num(11 * k), "text-anchor": "end" }, esc(CIRCUIT_ATTRIBUTION));
  }

  const titleId = `${gid}-t`;
  const descId = `${gid}-d`;
  const css = options.css === "none" ? "" : `<style>${KYOGIJO_CIRCUIT_STYLE}</style>`;
  const svg = el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      class: `kyogijo ky-circuit${safeClass(options.className) === "" ? "" : ` ${safeClass(options.className)}`}`,
      viewBox: `${num(viewBox.x)} ${num(viewBox.y)} ${num(viewBox.w)} ${num(viewBox.h)}`,
      role: "img",
      "aria-labelledby": `${titleId} ${descId}`,
      "data-circuit": circuit.id,
      "data-direction": circuit.direction.value,
      "data-theme": options.theme === "light" || options.theme === "dark" ? options.theme : undefined,
      "data-version": VERSION,
    },
    metaMarkup(titleId, title, descId, description) + css + body,
  );
  return { svg, plan, viewBox, k, badges: placed.map(({ n, at, r: radius }) => ({ n, at, r: radius })), title, description };
}

/**
 * A circuit as one SVG string: the lap as a ribbon of the track's width on the ways OpenStreetMap maps for it, the pit lane and the circuit's ground with its pit building, the start and the chequered finish across the
 * track, arrows the way the lap runs, each turn's number beside its bend where OpenStreetMap numbers it, a north arrow, a scale bar and the credit of the map's data. Light and dark follow the page.
 * @example
 * ```ts
 * import { drawCircuit } from "@johnmorrisdotca/kyogijo-stadiums/circuits";
 * const svg = drawCircuit({ circuit: "las-vegas" });
 * console.log(svg.startsWith("<svg"), svg.includes('data-turn="17"'), svg.includes("OpenStreetMap"));
 * // true true true
 * ```
 */
export function drawCircuit(options: CircuitOptions): string {
  return circuitDrawing(options).svg;
}

/**
 * A circuit's facts as a table, each with its basis (a source's, or ours) and the length the drawn line measures: for a reader who cannot see the drawing, and for a page that wants the data.
 * @example
 * ```ts
 * import { circuitTable } from "@johnmorrisdotca/kyogijo-stadiums/circuits";
 * const table = circuitTable({ circuit: "las-vegas" });
 * console.log(table.startsWith("<table"), table.includes("6.201 km"));
 * // true true
 * ```
 */
export function circuitTable(options: CircuitOptions): string {
  const language: Language = options.language === "ja" ? "ja" : "en";
  const w = CIRCUIT_WORDS[language].table;
  const plan = circuitPlan(circuitOf(options.circuit));
  const c = plan.circuit;
  const basis = (b: "documented" | "plausible"): string => (b === "documented" ? w.documented : w.plausible);
  const rows: [string, string, string][] = [
    [w.length, `${km(c.length.value, language)} km`, basis(c.length.basis)],
    [w.measured, `${km(plan.measured, language)} km`, "OpenStreetMap"],
    [w.corners, String(c.corners.value), basis(c.corners.basis)],
    [w.direction, c.direction.value === "counterclockwise" ? w.counterclockwise : w.clockwise, basis(c.direction.basis)],
    [w.opened, c.opened.value, basis(c.opened.basis)],
    [w.width, `${c.width.value} m`, basis(c.width.basis)],
    [w.pitLaneWidth, `${c.pitLaneWidth.value} m`, basis(c.pitLaneWidth.basis)],
    [w.wikidata, c.wikidata, "Wikidata"],
  ];
  const head = `<thead><tr><th scope="col">${esc(w.fact)}</th><th scope="col">${esc(w.value)}</th><th scope="col">${esc(w.basis)}</th></tr></thead>`;
  const body = rows.map(([a, b, d]) => `<tr><th scope="row">${esc(a)}</th><td>${esc(b)}</td><td>${esc(d)}</td></tr>`).join("");
  return `<table class="ky-table" data-kind="circuit"><caption>${esc(fill(w.caption, { name: c.names[language] }))}</caption>${head}<tbody>${body}</tbody></table>`;
}
