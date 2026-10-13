// Annotations for a surface: the way each team attacks (an arrow in the margin), axes with ticks along its edges (in its own numbers or a provider's frame),
// and the names of its parts (blue lines, the three-point arc, hog lines...) with a leader to each. They are drawn in the surface's wide frame, inside the
// group that turns the surface, in the margin the surface leaves round it (which is made wide enough), with the words upright whichever way it lies.
// The idea of a direction label comes from ggsoccer's `direction_label` and of axes and labels from mplsoccer's pitch `axis` and `label`; the code is our own.
import { attackingIn, frameByName, toSurface, type Frame } from "./frames.ts";
import { el, num } from "./format.ts";
import { frameSizeOf } from "./outline.ts";
import { fill, type KyogijoWords } from "./strings.ts";
import { textWidth } from "./text.ts";
import { textOn, type Mark, type Surface } from "./surfaces/surface.ts";
import type { DirectionOptions, ScoreOptions, Side, Sport, SurfaceOptions } from "./types.ts";
import { FEET_PER, SURFACE_UNITS, isUnit, type Unit } from "./units.ts";

/** The margin each surface has when the options give none (the builders' own defaults), in feet. */
export const DEFAULT_MARGIN: Readonly<Record<string, number>> = { nfl: 12, cfl: 12, ifaf: 12, nhl: 8, nba: 7, mlb: 14, soccer: 15, curling: 3 };

/** What the annotations are drawn against. */
export interface NoteEnv {
  o: SurfaceOptions | ScoreOptions;
  surface: Surface;
  turned: boolean;
  /** The language's words. */
  words: KyogijoWords;
  /** The teams' names for a label, in a score drawing. */
  teams: { home?: string; away?: string };
}

/** How far out from the surface's edge, in feet, something reaches on the top and the bottom as it lies wide. */
interface Reach {
  top: number;
  bottom: number;
}

/** What the annotations made. */
export interface Notes {
  /** SVG for the surface's group, in its wide frame. */
  svg: string;
  /** Sentences for the description. */
  summaries: string[];
  /** The margin, in feet, that the annotations need all round: the drawing is made at least this wide. */
  need: number;
}

/** What one kind of annotation made, and how far out it reaches: the next kind starts beyond it. */
interface Part extends Notes {
  reach: Reach;
}

const NONE: Part = { svg: "", summaries: [], need: 0, reach: { top: 0, bottom: 0 } };

/** The surface's wide frame view: the drawing's viewBox as the surface lies wide, which for a turned surface is found again from its turn. */
export function wideView(surface: Surface): { x: number; y: number; w: number; h: number } {
  if (surface.turn === undefined) return surface.view;
  const m = /matrix\(0 1 -1 0 (-?[\d.]+) (-?[\d.]+)\)/.exec(surface.turn);
  if (m === null) return surface.view;
  const w = surface.view.h;
  const h = surface.view.w;
  return { x: -Number(m[2]), y: Number(m[1]) - h, w, h };
}

/**
 * The font size of the annotations, in feet. A wide drawing is scaled to its longest side, so the size follows that; a tall one is scaled to its narrow side,
 * so it follows that. Either way it is held between what can be read and what would crowd the surface.
 */
const sizeOf = (box: { w: number; h: number }, turned: boolean): number => (turned ? Math.min(9, Math.max(0.15, 0.045 * Math.min(box.h, box.w))) : Math.min(12, Math.max(0.15, 0.02 * Math.max(box.h, box.w))));

type P = readonly [number, number];

/** What every part of the annotations shares. */
interface Ground {
  s: number;
  box: { x: number; y: number; w: number; h: number };
  view: { x: number; y: number; w: number; h: number };
  turned: boolean;
}

/** Where a direction in the wide frame points on the screen: a quarter turn clockwise sends `(dx, dy)` to `(-dy, dx)`. */
export const onScreen = (turned: boolean, [dx, dy]: P): P => (turned ? [-dy, dx] : [dx, dy]);

/** The text anchor that makes a word run away from a point in a direction: along the screen's x it starts or ends there, up or down it is centred. */
function anchorFor(turned: boolean, outward: P): "start" | "middle" | "end" {
  const [sx, sy] = onScreen(turned, outward);
  if (Math.abs(sx) > Math.abs(sy)) return sx > 0 ? "start" : "end";
  return "middle";
}

/** Text whose cap-height middle line passes through `(x, y)` in the wide frame: the baseline sits 0.36 of the size lower, as `textOn` pivots on the capitals' middle. */
const word = (g: Ground, x: number, y: number, text: string, anchor: "start" | "middle" | "end"): string => textOn(g.turned, x, y + g.s * 0.36, text, { size: g.s, anchor, cls: "ky-an-t", weight: 600 });

const stroke = (d: string, width: number, cls = "ky-an-l"): string => el("path", { class: cls, d, "stroke-width": width, fill: "none", "stroke-linecap": "round" });

// ---- Direction. ----

/** The sports whose teams attack an end. */
const ENDS: ReadonlySet<string> = new Set(["nfl", "cfl", "ifaf", "nhl", "nba", "soccer"]);

/** The side a team attacks in the period asked for. */
function sideIn(sport: Sport, d: DirectionOptions, first: Side): Side {
  return d.period === undefined ? first : attackingIn(sport, d.period, first, d.changedAfter);
}

/** One team's arrow, in the margin below the surface (the home team's) or above it (the away team's), and its label. Returns the markup and the margin it needs. */
function arrow(g: Ground, role: "home" | "away", side: Side, label: string | undefined, off: number): { svg: string; need: number } {
  const { s, box } = g;
  const bottom = role === "home";
  const length = Math.min(box.w * 0.35, 12 * s);
  const cx = box.x + box.w / 2;
  const dir = side === "right" ? 1 : -1;
  const out = bottom ? 1 : -1;
  const edge = bottom ? box.y + box.h : box.y;
  const y = edge + out * (off + 1.4 * s);
  const head = 0.9 * s;
  const colour = role === "home" ? "ky-an-h" : "ky-an-a";
  const x1 = cx + (dir * length) / 2;
  let svg = stroke(`M${num(cx - (dir * length) / 2)} ${num(y)}H${num(x1 - dir * head * 0.6)}`, s * 0.28, `ky-an-ar ${colour}`);
  svg += el("path", { class: `ky-an-hd ${colour}`, d: `M${num(x1)} ${num(y)}L${num(x1 - dir * head)} ${num(y - 0.6 * s)}V${num(y + 0.6 * s)}Z` });
  let need = off + 2.4 * s;
  if (label !== undefined) {
    // The label stands beyond the arrow: below or above it on a wide drawing, to the side of it (away from the surface) on a tall one.
    const width = textWidth(label) * s;
    if (g.turned) {
      svg += word(g, cx, edge + out * (off + 2.6 * s), label, anchorFor(true, [0, out]));
      need = off + 2.6 * s + width + 0.5 * s;
    } else {
      svg += word(g, cx, edge + out * (off + 3.2 * s), label, "middle");
      need = off + 4.4 * s;
    }
  }
  return { svg, need };
}

function directionNotes(env: NoteEnv, g: Ground, off: Reach): Part {
  const d = env.o.direction;
  if (d === undefined || d === null || typeof d !== "object") return NONE;
  if (!ENDS.has(env.o.sport)) throw new RangeError(`The ${env.o.sport} surface has no ends to attack: direction is for ${[...ENDS].join(", ")}`);
  const words = env.words.notes;
  let svg = "";
  const summaries: string[] = [];
  let need = 0;
  const reach: Reach = { ...off };
  for (const role of ["home", "away"] as const) {
    const first = d[role];
    if (first !== "left" && first !== "right") continue;
    const side = sideIn(env.o.sport, d, first);
    const team = env.teams[role] ?? (role === "home" ? words.home : words.away);
    const given = typeof d.label === "string" ? d.label : typeof d.label === "object" && d.label !== null ? d.label[role] : undefined;
    const text = d.label === false ? undefined : (given ?? fill(words.attacking, { team }));
    const drawn = arrow(g, role, side, text, role === "home" ? off.bottom : off.top);
    svg += drawn.svg;
    need = Math.max(need, drawn.need);
    reach[role === "home" ? "bottom" : "top"] = drawn.need;
    const sideWord = side === "left" ? words.left : words.right;
    summaries.push(d.period === undefined ? fill(words.attacks, { team, side: sideWord }) : fill(words.attacksIn, { team, side: sideWord, n: d.period }));
  }
  return { svg: svg === "" ? "" : el("g", { class: "ky-an ky-an-dir" }, svg), summaries, need, reach };
}

// ---- Axes. ----

/** A round step that gives about `count` ticks over a span. */
export function niceStep(span: number, count = 8): number {
  const raw = Math.abs(span) / count;
  if (!(raw > 0) || !Number.isFinite(raw)) return 1;
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / power;
  return (unit < 1.5 ? 1 : unit < 3.5 ? 2 : unit < 7.5 ? 5 : 10) * power;
}

/** The values in `[lo, hi]` that are multiples of a step, or the list given. */
function tickValues(given: number | readonly number[] | undefined, lo: number, hi: number): number[] {
  if (Array.isArray(given)) return given.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const step = typeof given === "number" && given > 0 ? given : niceStep(hi - lo);
  const out: number[] = [];
  for (let k = Math.ceil(lo / step - 1e-9); k * step <= hi + 1e-9 && out.length < 400; k += 1) out.push(Math.round(k * step * 1e6) / 1e6);
  return out;
}

const tickLabel = (v: number): string => String(Math.round(v * 100) / 100);

/** One axis: along the surface's length (its bottom edge) or its width (its left edge), with the ticks' values and where each falls, in feet. */
interface Axis {
  name: "x" | "y";
  along: "length" | "width";
  ticks: { value: number; at: number }[];
}

/** The two axes of the surface's own numbers (the options' `units`, else the rulebook's), or of a frame of the sport. */
function axesOf(env: NoteEnv, g: Ground): { axes: Axis[]; ranges: [[number, number], [number, number]]; unit: string; frame: string | undefined } {
  const a = env.o.axes!;
  const { box } = g;
  const per = (axis: "x" | "y"): number | readonly number[] | undefined => {
    const ticks = a.ticks;
    if (typeof ticks === "object" && ticks !== null && !Array.isArray(ticks)) return (ticks as { x?: number | readonly number[]; y?: number | readonly number[] })[axis];
    return ticks as number | readonly number[] | undefined;
  };
  if (a.frame === undefined) {
    const unit: Unit = env.o.units !== undefined && isUnit(env.o.units) ? env.o.units : (SURFACE_UNITS[env.o.sport] ?? "ft");
    const k = FEET_PER[unit];
    const ranges: [[number, number], [number, number]] = [[box.x / k, (box.x + box.w) / k], [box.y / k, (box.y + box.h) / k]];
    return {
      axes: [
        { name: "x", along: "length", ticks: tickValues(per("x"), ranges[0][0], ranges[0][1]).map((value) => ({ value, at: value * k })) },
        { name: "y", along: "width", ticks: tickValues(per("y"), ranges[1][0], ranges[1][1]).map((value) => ({ value, at: value * k })) },
      ],
      ranges,
      unit,
      frame: undefined,
    };
  }
  const frame: Frame = typeof a.frame === "string" ? frameByName(a.frame) : a.frame;
  if (frame.sport !== env.o.sport) throw new RangeError(`The frame "${frame.name}" is for ${frame.sport}, not ${env.o.sport}`);
  const ranges: [[number, number], [number, number]] = [[Math.min(...frame.x), Math.max(...frame.x)], [Math.min(...frame.y), Math.max(...frame.y)]];
  // A frame is fitted to the whole surface, not to the part of it that is shown.
  const size = frameSizeOf(env.o, env.surface.whole ?? box);
  const placed = (point: [number, number]): [number, number] => toSurface([point], { from: frame, units: "ft", size })[0];
  const mid: [number, number] = [(ranges[0][0] + ranges[0][1]) / 2, (ranges[1][0] + ranges[1][1]) / 2];
  // Which way each axis of the frame runs on the surface: nudge it and see where the point moves.
  const there = placed(mid);
  const nx = placed([mid[0] + 1, mid[1]]);
  const ny = placed([mid[0], mid[1] + 1]);
  const xAlong: "length" | "width" = Math.abs(nx[0] - there[0]) >= Math.abs(nx[1] - there[1]) ? "length" : "width";
  const yAlong: "length" | "width" = Math.abs(ny[0] - there[0]) >= Math.abs(ny[1] - there[1]) ? "length" : "width";
  const slack = Math.max(box.w, box.h) * 1e-6;
  const ticksOf = (name: "x" | "y", along: "length" | "width"): Axis => {
    const [lo, hi] = name === "x" ? ranges[0] : ranges[1];
    const edge = along === "length" ? [box.x, box.x + box.w] : [box.y, box.y + box.h];
    const ticks = tickValues(per(name), lo, hi)
      .map((value) => {
        const p = placed(name === "x" ? [value, mid[1]] : [mid[0], value]);
        return { value, at: along === "length" ? p[0] : p[1] };
      })
      .filter((tick) => tick.at >= edge[0] - slack && tick.at <= edge[1] + slack);
    return { name, along, ticks };
  };
  return { axes: [ticksOf("x", xAlong), ticksOf("y", yAlong)], ranges, unit: String(frame.unit), frame: frame.name };
}

function axesNotes(env: NoteEnv, g: Ground): Part {
  const a = env.o.axes;
  if (a === undefined || a === null || typeof a !== "object") return NONE;
  const { s, box, turned } = g;
  const words = env.words.notes;
  const { axes, ranges, unit, frame } = axesOf(env, g);
  const titles = typeof a.labels === "object" && a.labels !== null ? a.labels : {};
  const numbered = a.labels !== false;
  let svg = "";
  let need = 0;
  const reach: Reach = { top: 0, bottom: 0 };
  const pad = 0.6 * s;
  const tick = 0.5 * s;
  const base = pad + tick + 0.45 * s;
  for (const axis of axes) {
    if (axis.ticks.length === 0) continue;
    const bottom = axis.along === "length";
    // The bottom edge for an axis along the length, the left edge for one along the width.
    const edge = bottom ? box.y + box.h : box.x;
    const n: P = bottom ? [0, 1] : [-1, 0];
    const at = (t: number, out: number): P => (bottom ? [t, edge + out] : [edge - out, t]);
    const ts = axis.ticks.map((one) => one.at);
    const lo = Math.min(...ts);
    const hi = Math.max(...ts);
    const p0 = at(lo, pad);
    const p1 = at(hi, pad);
    let d = `M${num(p0[0])} ${num(p0[1])}L${num(p1[0])} ${num(p1[1])}`;
    for (const one of axis.ticks) {
      const a0 = at(one.at, pad);
      const a1 = at(one.at, pad + tick);
      d += `M${num(a0[0])} ${num(a0[1])}L${num(a1[0])} ${num(a1[1])}`;
    }
    svg += stroke(d, s * 0.1);
    // The words stand beside the axis on a screen's side (they run away from it, so they start or end at the tick) or above and below it (centred).
    const anchor = anchorFor(turned, n);
    const across = anchor !== "middle";
    const lift = across ? 0 : 0.6 * s;
    let widest = 0;
    if (numbered) {
      for (const one of axis.ticks) {
        const text = tickLabel(one.value);
        widest = Math.max(widest, textWidth(text) * s);
        const [wx, wy] = at(one.at, base + lift);
        svg += word(g, wx, wy, text, anchor);
      }
    }
    const title = axis.name === "x" ? titles.x : titles.y;
    const hasTitle = typeof title === "string" && title !== "";
    if (hasTitle) {
      const [wx, wy] = at((lo + hi) / 2, base + (across ? widest + 1 * s : 2 * s + lift));
      svg += word(g, wx, wy, title, anchor);
    }
    const titleWidth = hasTitle ? textWidth(title) * s : 0;
    const reachOf = across ? base + (numbered ? widest : 0) + (hasTitle ? 1 * s + titleWidth : 0) + 0.3 * s : base + (hasTitle ? 3.3 * s : numbered ? 1.3 * s : 0.3 * s);
    need = Math.max(need, reachOf);
    if (bottom) reach.bottom = reachOf;
  }
  const x0 = tickLabel(ranges[0][0]);
  const x1 = tickLabel(ranges[0][1]);
  const y0 = tickLabel(ranges[1][0]);
  const y1 = tickLabel(ranges[1][1]);
  const summary = frame === undefined ? fill(words.axesSurface, { unit, x0, x1, y0, y1 }) : fill(words.axesFrame, { frame, unit, x0, x1, y0, y1 });
  return { svg: svg === "" ? "" : el("g", { class: "ky-an ky-an-axes" }, svg), summaries: [summary], need, reach };
}

// ---- Landmarks. ----

function landmarkNotes(env: NoteEnv, g: Ground, off: Reach): Part {
  const marks: readonly Mark[] | undefined = env.surface.marks;
  if (env.o.landmarks !== true || marks === undefined) return NONE;
  const { s, box, view, turned } = g;
  const names = env.words.notes.names;
  // A part outside what the drawing shows (one end of a half-pitch) is left out.
  // Cropped to a range, the ground the annotations have beyond the cut is not part of what is shown.
  const area = env.surface.cut ?? view;
  const shown = marks.filter((mark) => mark.x >= area.x && mark.x <= area.x + area.w && mark.y >= area.y && mark.y <= area.y + area.h && names[mark.id] !== undefined);
  let svg = "";
  let dots = "";
  let need = 0;
  const reach: Reach = { ...off };
  const gap = 1.0 * s;
  const pitch = 1.55 * s;
  const height = 1.25 * s;
  for (const side of ["top", "bottom"] as const) {
    const out = side === "top" ? -1 : 1;
    const n: P = [0, out];
    const edge = side === "top" ? box.y : box.y + box.h;
    const start = gap + off[side];
    const list = shown.filter((mark) => mark.side === side).sort((a, b) => a.x - b.x);
    if (list.length === 0) continue;
    if (!turned) {
      // A wide drawing: each word stands in the margin above or below its part, in the first row where it clears the others and no leader runs through a word.
      const rows: { lo: number; hi: number }[][] = [];
      let used = 0;
      for (const mark of list) {
        const text = names[mark.id];
        const w = textWidth(text) * s + 0.9 * s;
        const centre = Math.min(Math.max(mark.x, view.x + w / 2), view.x + view.w - w / 2);
        const lo = centre - w / 2;
        const hi = centre + w / 2;
        // The first row where the word clears its neighbours and no leader runs through a word; failing that, the first row where it clears them.
        const fits = (row: number, keepClear: boolean): boolean =>
          (rows[row] ??= []).every((iv) => iv.hi <= lo || iv.lo >= hi) && (!keepClear || rows.slice(0, row).every((r) => r.every((iv) => mark.x < iv.lo - 0.3 * s || mark.x > iv.hi + 0.3 * s)));
        const row = [0, 1, 2, 3, 4].find((r) => fits(r, true)) ?? [0, 1, 2, 3, 4].find((r) => fits(r, false)) ?? 4;
        (rows[row] ??= []).push({ lo, hi });
        used = Math.max(used, row + 1);
        const near = edge + out * (start + row * pitch);
        svg += stroke(`M${num(mark.x)} ${num(mark.y)}L${num(centre)} ${num(near)}`, s * 0.1);
        svg += word(g, centre, near + out * (height / 2), text, "middle");
        dots += el("circle", { cx: mark.x, cy: mark.y, r: s * 0.3, "stroke-width": s * 0.12 });
      }
      reach[side] = start + height + (used - 1) * pitch + 0.2 * s;
      need = Math.max(need, reach[side]);
    } else {
      // A tall drawing: each word runs out sideways from the margin's edge, one under another, pushed apart where their parts are close.
      const slot = 1.4 * s;
      const at = list.map((mark) => mark.x);
      for (let i = 1; i < at.length; i += 1) at[i] = Math.max(at[i], at[i - 1] + slot);
      at[at.length - 1] = Math.min(at[at.length - 1], view.x + view.w - 0.7 * s);
      for (let i = at.length - 2; i >= 0; i -= 1) at[i] = Math.min(at[i], at[i + 1] - slot);
      for (let i = 0; i < at.length; i += 1) at[i] = Math.max(at[i], view.x + 0.7 * s);
      const anchor = anchorFor(true, n);
      list.forEach((mark, i) => {
        const text = names[mark.id];
        const near = edge + out * start;
        svg += stroke(`M${num(mark.x)} ${num(mark.y)}L${num(at[i])} ${num(near)}`, s * 0.1);
        svg += word(g, at[i], near + out * 0.3 * s, text, anchor);
        dots += el("circle", { cx: mark.x, cy: mark.y, r: s * 0.3, "stroke-width": s * 0.12 });
        reach[side] = Math.max(reach[side], start + 0.3 * s + textWidth(text) * s + 0.5 * s);
        need = Math.max(need, reach[side]);
      });
    }
  }
  const unique = [...new Set(shown.map((mark) => names[mark.id]))];
  return {
    svg: svg === "" ? "" : el("g", { class: "ky-an ky-an-marks" }, `${svg}${el("g", { class: "ky-an-d" }, dots)}`),
    summaries: unique.length === 0 ? [] : [fill(env.words.notes.labelled, { list: unique.join(env.words.layers.listSep) })],
    need,
    reach,
  };
}

/** True when the options ask for any annotation. */
export const annotated = (o: SurfaceOptions | ScoreOptions): boolean => o.direction !== undefined || o.axes !== undefined || o.landmarks === true;

/**
 * The annotations of a drawing: their SVG in the surface's wide frame, a sentence for each for the description, and the margin they need. `need` is
 * measured from the surface's edge, so a caller who finds it larger than the margin the surface has draws the surface again with it.
 */
export function annotate(env: NoteEnv): Notes {
  const box = env.surface.box;
  if (box === undefined || !annotated(env.o)) return NONE;
  const g: Ground = { s: sizeOf(box, env.turned), box, view: wideView(env.surface), turned: env.turned };
  // From the surface outwards: the axes, then the labels of its parts, then the arrows.
  const axes = axesNotes(env, g);
  const marks = landmarkNotes(env, g, axes.reach);
  const direction = directionNotes(env, g, marks.reach);
  const parts = [direction, axes, marks];
  return {
    svg: parts.map((part) => part.svg).join(""),
    summaries: parts.flatMap((part) => part.summaries),
    need: Math.max(...parts.map((part) => part.need)),
  };
}
