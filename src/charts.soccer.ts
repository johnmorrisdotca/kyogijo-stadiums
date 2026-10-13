// The soccer shot map and the goal-mouth view. The map is shots on a pitch (all of it, or the half the shots attack) in a data provider's own
// numbers, sized by expected goals; the goal mouth is a small drawing of the goal frame seen from the front, with where each shot crossed the goal line.
// The ideas are those of mplsoccer's shot maps and goal-mouth plots (MIT); no code of it, nor of sportypy or sportyR (GPL), is used.
import { drawingId } from "./common.ts";
import { esc, el, num } from "./format.ts";
import type { Frame, FrameMap } from "./frames.ts";
import { layerTable, renderLayers } from "./layers.ts";
import type { Layer, PointStyle, PointsLayer } from "./layers.types.ts";
import { outlineOf } from "./outline.ts";
import { KYOGIJO_BASE_STYLE } from "./style.ts";
import { fill } from "./strings.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import { SOCCER } from "./surfaces/soccer-spec.ts";
import { VERSION } from "./version.ts";
import type { GoalMouth, GoalMouthOptions, SoccerChart, SoccerShot, SoccerShotOptions, SoccerTotals } from "./charts.types.ts";
import { assemble, clean, countOutcomes, describeCounts, drawingOptions, frameOf, fromOf, hasPlace, isNum, keyItems, keyLayers, languageOf, round, teamTotals, wordsOf, type KeyEntry, type Look } from "./charts.ts";

const LOOKS: Record<string, Look> = {
  goal: { shape: "star", scale: 1.35 },
  saved: { hollow: true },
  missed: { shape: "x", hollow: true },
  blocked: { shape: "triangle", hollow: true },
  post: { shape: "diamond", hollow: true },
};
const ORDER = ["goal", "saved", "post", "missed", "blocked"];

const METRES = { m: 1, yd: 0.9144, ft: 0.3048 } as const;

/** A shot's outcome word: its own, `goal` for a goal, else `shot`. */
const outcomeOf = (s: SoccerShot): string => (s.goal === true ? "goal" : typeof s.outcome === "string" && s.outcome !== "" ? s.outcome.toLowerCase() : "shot");

/** The key's entries for the outcomes present, goals first. */
function entriesOf(counts: ReadonlyMap<string, number>, labels: Record<string, string>): KeyEntry[] {
  const present = [...counts.keys()].filter((k) => k !== "");
  return [...ORDER.filter((k) => present.includes(k)), ...present.filter((k) => !ORDER.includes(k))].map((k) => ({ label: labels[k] ?? k, outcome: k }));
}

/**
 * A shot map for soccer: each shot on the pitch (all of it, or the half the shots attack) in a data provider's own numbers, sized by its expected
 * goals, a goal a filled star and the rest open marks (a save a circle, a miss an x, a block a triangle, the post a diamond), with the expected-goals
 * total, a key and a table. `goalMouth()` of the result is the goal-mouth view of the same shots.
 * @example
 * ```ts
 * import { soccerShotMap } from "@johnmorrisdotca/kyogijo/charts";
 * const chart = soccerShotMap(
 *   [
 *     { x: 104, y: 36, outcome: "goal", xg: 0.31, goalY: -1.2, goalZ: 0.6 },
 *     { x: 98, y: 50, outcome: "saved", xg: 0.08, goalY: 2.4, goalZ: 1.1 },
 *     { x: 90, y: 30, outcome: "missed", xg: 0.04, goalY: 5, goalZ: 0.5 },
 *   ],
 *   { provider: "statsbomb", half: true, goalUnit: "yd" },
 * );
 * console.log(chart.totals.shots, chart.totals.goals, chart.totals.xg, chart.options.half);
 * console.log(chart.goalMouth().svg.startsWith("<svg"), chart.goalMouth().placed);
 * // 3 1 0.43 right
 * // true 3
 * ```
 */
export function soccerShotMap(shots: readonly SoccerShot[], options: SoccerShotOptions = {}): SoccerChart & { key: ReturnType<typeof keyItems> } {
  if (!Array.isArray(shots)) throw new TypeError("shots is a list of shots");
  const language = languageOf(options);
  const all = wordsOf(language);
  const w = all.charts;
  const provider = options.provider ?? "international";
  const frame = frameOf(provider, "international");
  const half = options.half === true ? "right" : options.half === "left" || options.half === "right" ? options.half : undefined;
  const o = drawingOptions("soccer", options, w.titleSoccer, {
    ...(typeof provider === "string" ? { pitchType: provider } : {}),
    ...(half === undefined ? {} : { half }),
    ...(options.pitch === undefined ? {} : { pitch: options.pitch }),
    ...(options.ground === undefined ? {} : { ground: options.ground }),
  });
  const attacking = options.attacking === "left" ? ("left" as const) : undefined;
  const where = clean({ from: fromOf(typeof provider === "object" ? provider : undefined, frame), attacking });
  const data = shots.map((s) => clean({ x: s.x, y: s.y, outcome: outcomeOf(s), value: s.xg, team: s.team, title: s.title }));
  const { counts, placed: count, skipped } = countOutcomes(data);
  const hasXg = data.some((d) => isNum(d.value));
  const sized = options.xg === false ? false : hasXg;
  const xgMax = isNum(options.xgMax) && options.xgMax > 0 ? options.xgMax : 0.8;
  const labels: Record<string, string> = { goal: w.goal, saved: w.saved, missed: w.missedNet, blocked: w.blocked, shot: w.shot, post: w.post };
  const entries = entriesOf(counts, labels);
  const style: PointStyle = { outcomes: LOOKS, opacity: 0.92, ...(sized ? { size: { domain: [0, xgMax] as [number, number], range: [3.2, 13] as [number, number] } } : { scale: 1.5 }) };
  const xg = hasXg ? round(data.reduce((sum, d) => sum + (hasPlace(d) && isNum(d.value) ? d.value : 0), 0), 2) : null;
  const layers: Layer[] = [];
  const description = [describeCounts(entries, counts, all), sized ? w.sizeNote : ""].filter(Boolean).join(all.said.gap);
  layers.push(clean({ kind: "points" as const, id: "shots", name: w.shots, description: description === "" ? undefined : description, ...where, data, style }) as PointsLayer);
  const extras = [...(sized ? [w.sizeXg] : []), ...(xg === null ? [] : [fill(w.xgTotal, { n: xg })])];
  if (options.key !== false) {
    const { box } = outlineOf(o);
    const place = half === undefined ? {} : { x: half === "right" ? box.x + box.w / 2 : box.x, w: box.w / 2 };
    layers.push(...keyLayers(o, entries, LOOKS, all, extras, place));
  }
  const goals = counts.get("goal") ?? 0;
  const totals: SoccerTotals = { shots: count, goals, xg, skipped, teams: teamTotals(data) };
  const summary = xg === null ? fill(w.sumShots, { shots: count, goals }) : fill(w.sumShotsXg, { shots: count, goals, xg });
  const base = assemble(o, layers, { title: w.titleSoccer, summary, totals });
  const chart = {
    ...base,
    key: keyItems(entries, LOOKS),
    goalMouth: (mouth: GoalMouthOptions = {}): GoalMouth => soccerGoalMouth(shots, { language, unit: options.goalUnit, xg: sized, xgMax, theme: options.surface?.theme, style: options.surface?.style, id: options.id === undefined ? undefined : `${options.id}-goal`, ...mouth }),
  };
  return chart;
}

/**
 * The goal-mouth view of soccer shots: a small drawing of the goal frame seen from the front (the shooter's left on the left), with where each shot
 * crossed the goal line, across from the centre of the goal (`goalY`, positive to the shooter's right) and up from the ground (`goalZ`). A shot wide
 * or high of the frame is drawn beside or above it; a block has no place across the goal and is left out, and the count says how many were.
 * @example
 * ```ts
 * import { soccerGoalMouth } from "@johnmorrisdotca/kyogijo/charts";
 * const view = soccerGoalMouth([
 *   { x: 100, y: 40, outcome: "goal", goalY: 0.8, goalZ: 1.9, xg: 0.2 },
 *   { x: 90, y: 40, outcome: "missed", goalY: -4.6, goalZ: 1.2 },
 *   { x: 85, y: 30, outcome: "blocked" },
 * ]);
 * console.log(view.placed, view.skipped, view.svg.includes("Goal mouth"));
 * // 2 1 true
 * ```
 */
export function soccerGoalMouth(shots: readonly SoccerShot[], options: GoalMouthOptions = {}): GoalMouth {
  if (!Array.isArray(shots)) throw new TypeError("shots is a list of shots");
  const language = languageOf(options);
  const all = wordsOf(language);
  const w = all.charts;
  const unit = options.unit === "yd" || options.unit === "ft" ? options.unit : "m";
  const k = METRES[unit];
  const goalW = options.goal !== undefined && options.goal.width > 0 ? options.goal.width : SOCCER.goalWidth;
  const goalH = options.goal !== undefined && options.goal.height > 0 ? options.goal.height : SOCCER.goalHeight;
  // The view, in metres: the goal frame with room beside it, above it and a strip of ground beneath.
  const viewW = goalW * 1.7;
  const ground = goalH * 0.22;
  const viewH = goalH * 2.1;
  const frame: Frame = {
    name: "goal-mouth",
    title: "Goal mouth, seen from the front: across from the centre (positive to the shooter's right) and the height",
    sport: "soccer",
    unit: "m",
    x: [-viewW / 2, viewW / 2],
    y: [0, viewH - ground],
    origin: "the centre of the goal on the ground",
    yDirection: "up",
    size: "variable",
    ends: "none",
    landmarks: ({ length, width }): FrameMap => ({ x: [[-viewW / 2, 0], [viewW / 2, length]], y: [[0, width - ground * FEET_PER_METRE], [viewH - ground, 0]] }),
    source: "Kyogijo",
  };
  const id = options.id === undefined ? undefined : options.id;
  const surface = { sport: "soccer" as const, pitch: { length: viewW, width: viewH, unit: "m" as const }, units: "m" as const, language, ...(id === undefined ? {} : { id }), margin: 0 };
  const rows = shots.map((s) => clean({ x: isNum(s.goalY) ? round(s.goalY * k, 3) : null, y: isNum(s.goalZ) ? round(s.goalZ * k, 3) : null, outcome: outcomeOf(s), value: s.xg, team: s.team, title: s.title }));
  const { counts, placed: placedCount, skipped } = countOutcomes(rows);
  const hasXg = rows.some((r) => isNum(r.value));
  const sized = options.xg === false ? false : options.xg === true || hasXg;
  const xgMax = isNum(options.xgMax) && options.xgMax > 0 ? options.xgMax : 0.8;
  const labels: Record<string, string> = { goal: w.goal, saved: w.saved, missed: w.missedNet, blocked: w.blocked, shot: w.shot, post: w.post };
  const entries = entriesOf(counts, labels);
  const style: PointStyle = { outcomes: LOOKS, opacity: 0.92, ...(sized ? { size: { domain: [0, xgMax] as [number, number], range: [0.25, 0.8] as [number, number] } } : { size: 0.45 }) };
  const layer = clean({ kind: "points" as const, id: "goal-shots", name: w.shots, description: describeCounts(entries, counts, all), from: frame, units: "m" as const, data: rows, style, clip: "none" as const }) as PointsLayer;
  const layers: Layer[] = [layer];
  const rendered = renderLayers(surface, layers, false);
  const F = FEET_PER_METRE;
  const x0 = ((viewW - goalW) / 2) * F;
  const x1 = x0 + goalW * F;
  const yb = (viewH - ground) * F;
  const yt = yb - goalH * F;
  const net: string[] = [];
  const step = 0.45 * F;
  for (let x = x0 + step; x < x1 - 0.01; x += step) net.push(`M${num(x)} ${num(yt)}V${num(yb)}`);
  for (let y = yt + step; y < yb - 0.01; y += step) net.push(`M${num(x0)} ${num(y)}H${num(x1)}`);
  const art =
    el("rect", { class: "ky-surface", x: 0, y: 0, width: viewW * F, height: viewH * F }) +
    el("rect", { class: "ky-zone", x: x0, y: yt, width: goalW * F, height: goalH * F }) +
    el("path", { class: "ky-goal-net", d: net.join(""), "stroke-width": 0.12 }) +
    el("path", { class: "ky-line", d: `M0 ${num(yb)}H${num(viewW * F)}`, "stroke-width": 0.5 }) +
    el("path", { class: "ky-goal", d: `M${num(x0)} ${num(yb)}V${num(yt)}H${num(x1)}V${num(yb)}`, "stroke-width": 0.75, "stroke-linejoin": "round" });
  const gid = drawingId(surface);
  const title = options.title ?? w.titleGoal;
  const description = [fill(w.goalDesc, { w: round(goalW, 2), h: round(goalH, 2) }), rendered.summaries.length === 0 ? "" : `${all.layers.data}${all.said.colon}${rendered.summaries.join(all.said.gap)}`].filter(Boolean).join(all.said.gap);
  const theme = options.theme === "light" || options.theme === "dark" ? options.theme : undefined;
  const svg = el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      class: `kyogijo ky-soccer ky-goal-mouth${options.className === undefined || options.className.replace(/[^\w -]/g, "").trim() === "" ? "" : ` ${options.className.replace(/[^\w -]/g, "").trim()}`}`,
      viewBox: `0 0 ${num(viewW * F)} ${num(viewH * F)}`,
      role: "img",
      "aria-labelledby": `${gid}-t ${gid}-d`,
      "data-sport": "soccer",
      "data-theme": theme,
      "data-version": VERSION,
    },
    `<title id="${gid}-t">${esc(title)}</title><desc id="${gid}-d">${esc(description)}</desc>${options.style === "none" ? "" : `<style>${KYOGIJO_BASE_STYLE}</style>`}${art}${rendered.svg}`,
  );
  return {
    svg,
    layers,
    placed: placedCount,
    skipped,
    table: (tableOptions = {}) => layerTable(layers, { ...tableOptions, language, surface }),
  };
}
