// A tournament layout laid out: several of the package's own surfaces on one floor, to scale, where each stands and what it leaves free; the floor the layout needs; and whether it fits a hall's floor. The
// figures are in multi.data.ts (a rulebook's, with its source); this file only adds them up. Nothing here draws SVG (multi.draw.ts does), and every function returns new values.
import { budoLeague, budoPlan, inOctagon } from "./budo/plan.ts";
import { fill } from "./strings.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import { IJF_CONTEST, WKF_KUMITE, type JudoFigures } from "./leagues/budo.ts";
import { MULTI_PRESETS, MULTI_VENUES, multiPreset, multiVenueById } from "./multi.data.ts";
import { MULTI_WORDS } from "./multi.words.ts";
import type { MultiCell, MultiFit, MultiLayout, MultiNeeds, MultiOptions, MultiSize, MultiSlot, MultiSpec, MultiUnit, MultiVenue } from "./multi.types.ts";
import { outlineOf } from "./outline.ts";
import type { Language } from "./types.ts";

/** The most rows or columns a layout takes. */
export const MULTI_MAX = 12;

const feet = (v: number, unit: MultiUnit): number => (unit === "m" ? v * FEET_PER_METRE : v);
const metres = (ft: number): number => ft / FEET_PER_METRE;
const round = (v: number, places = 2): number => {
  const k = 10 ** places;
  return Math.round(v * k) / k;
};
/** A number as a language writes it: thousands separated, two decimals at most (`3,234.5`). */
export const multiNumber = (value: number, language: Language = "en"): string => new Intl.NumberFormat(language === "ja" ? "ja-JP" : "en-US", { maximumFractionDigits: 2 }).format(value);
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** A whole number of 1 to `max`, or an error that says which option it is. */
function count(value: unknown, name: string, max: number): number {
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > max) throw new RangeError(`${name} is a whole number of 1 to ${max}`);
  return value as number;
}

/**
 * The layout the options ask for: a preset or a layout of the caller's own, with the grid and the stagger it is given in place of its own.
 * @throws Error for a preset that is not one, an option that is not a whole number or a share, or neither a preset nor a layout.
 */
export function specOf(o: Pick<MultiOptions, "preset" | "layout" | "rows" | "columns" | "stagger">): MultiSpec {
  const base = o.layout ?? (o.preset === undefined ? undefined : multiPreset(o.preset));
  if (base === undefined) {
    if (o.preset !== undefined && o.layout === undefined) throw new Error(`Unknown preset "${o.preset}": use one of ${MULTI_PRESETS.map((p) => p.id).join(", ")}`);
    throw new TypeError("A tournament layout needs a preset or a layout");
  }
  const budo = base.kind === "budo";
  const rows = o.rows === undefined ? base.rows : count(o.rows, "rows", budo ? 6 : MULTI_MAX);
  const columns = o.columns === undefined ? base.columns : count(o.columns, "columns", budo ? 6 : MULTI_MAX);
  if (o.stagger !== undefined && (!finite(o.stagger) || o.stagger < 0 || o.stagger > 1)) throw new RangeError("stagger is a share from 0 to 1");
  const stagger = o.stagger ?? base.stagger;
  const surface = budo ? { ...base.surface, budo: { ...base.surface.budo, areas: { across: columns, down: rows } } } : base.surface;
  return { ...base, rows, columns, ...(stagger === undefined ? {} : { stagger }), surface };
}

const size = (s: MultiSize): { length: number; width: number } => ({ length: feet(s.length, s.unit), width: feet(s.width, s.unit) });

/** The slots on and round a floor, in feet. */
function slotsFor(spec: MultiSpec, cells: readonly MultiCell[], floor: { w: number; h: number }, tatami?: { x: number; y: number; w: number; h: number; safety: number; gap: number }): MultiSlot[] {
  const out: MultiSlot[] = [];
  const brand = spec.parts.brand ?? "none";
  const boardDepth = 3; // three feet: a board of about 0.9 m
  if (brand === "mat" && tatami !== undefined) {
    // A budō floor is printed on the mats themselves: the event's words in the safety area above and below each contest area, and a mark in the end safety areas and in the common safe zones.
    const { safety: s, gap } = tatami;
    for (const cell of cells) {
      const textW = cell.w * 0.9;
      const textH = s * 0.45;
      // The band between two rows serves both: the words are set under the upper area only.
      if (cell.row === 0) out.push({ id: `text-${cell.n}-top`, kind: "floor-text", onMat: true, x: cell.x + (cell.w - textW) / 2, y: cell.y - s / 2 - textH / 2, w: textW, h: textH });
      out.push({ id: `text-${cell.n}-bottom`, kind: "floor-text", onMat: true, x: cell.x + (cell.w - textW) / 2, y: cell.y + cell.h + s / 2 - textH / 2, w: textW, h: textH });
    }
    const mark = Math.min(s, gap) * 0.7;
    const cy = tatami.y + tatami.h / 2;
    out.push({ id: "logo-start", kind: "floor-logo", onMat: true, x: tatami.x + s / 2 - mark / 2, y: cy - mark / 2, w: mark, h: mark });
    out.push({ id: "logo-end", kind: "floor-logo", onMat: true, x: tatami.x + tatami.w - s / 2 - mark / 2, y: cy - mark / 2, w: mark, h: mark });
    cells.forEach((cell, k) => {
      if (k % Math.max(1, spec.columns) === spec.columns - 1) return;
      const gx = cell.x + cell.w + gap / 2;
      out.push({ id: `logo-common-${cell.n}`, kind: "floor-logo", onMat: true, x: gx - mark / 2, y: cell.y + cell.h / 2 - mark / 2, w: mark, h: mark });
    });
  } else if (brand === "floor") {
    // Each surface has two places for a mark at its ends (the ITTF's rule allows up to 6 advertisements on the floor of an area) and one for words beside it. A surface turned a quarter has its ends above and below it.
    for (const cell of cells) {
      const mx = (cell.bay.w - cell.w) / 2;
      const my = (cell.bay.h - cell.h) / 2;
      if (cell.turn) {
        const room = Math.min(my, cell.bay.w * 0.5);
        if (room >= 3) {
          const m = room * 0.6;
          out.push({ id: `logo-${cell.n}-start`, kind: "floor-logo", onMat: false, x: cell.x + cell.w / 2 - m / 2, y: cell.y - room / 2 - m / 2, w: m, h: m });
          out.push({ id: `logo-${cell.n}-end`, kind: "floor-logo", onMat: false, x: cell.x + cell.w / 2 - m / 2, y: cell.y + cell.h + room / 2 - m / 2, w: m, h: m });
        }
        // The words stand along the left side, the officials' chair being on the right.
        if (mx >= 4) {
          const w = Math.min(mx * 0.4, 3.5);
          const h = cell.bay.h * 0.55;
          out.push({ id: `text-${cell.n}`, kind: "floor-text", onMat: false, x: cell.x - mx / 2 - w / 2, y: cell.y + cell.h / 2 - h / 2, w, h });
        }
        continue;
      }
      const room = Math.min(mx, cell.bay.h * 0.5);
      if (room >= 3) {
        const m = room * 0.6;
        out.push({ id: `logo-${cell.n}-start`, kind: "floor-logo", onMat: false, x: cell.x - room / 2 - m / 2, y: cell.y + cell.h / 2 - m / 2, w: m, h: m });
        out.push({ id: `logo-${cell.n}-end`, kind: "floor-logo", onMat: false, x: cell.x + cell.w + room / 2 - m / 2, y: cell.y + cell.h / 2 - m / 2, w: m, h: m });
      }
      if (my >= 4) {
        const h = Math.min(my * 0.4, 3.5);
        const w = cell.bay.w * 0.55;
        // The words go on the side of the surface that the officials' chair is not on.
        const y = spec.parts.officials === true ? cell.y + cell.h + my / 2 - h / 2 : cell.y - my / 2 - h / 2;
        out.push({ id: `text-${cell.n}`, kind: "floor-text", onMat: false, x: cell.x + cell.w / 2 - w / 2, y, w, h });
      }
    }
  }
  if (spec.parts.boards === true) {
    const gap = 1;
    out.push({ id: "board-top", kind: "board", onMat: false, x: 0, y: -gap - boardDepth, w: floor.w, h: boardDepth });
    out.push({ id: "board-bottom", kind: "board", onMat: false, x: 0, y: floor.h + gap, w: floor.w, h: boardDepth });
    out.push({ id: "board-left", kind: "board", onMat: false, x: -gap - boardDepth, y: 0, w: boardDepth, h: floor.h });
    out.push({ id: "board-right", kind: "board", onMat: false, x: floor.w + gap, y: 0, w: boardDepth, h: floor.h });
  }
  return out;
}

/**
 * A layout laid out: where each surface stands, the floor it needs and the empty places for the event's own words and marks, all in feet from the top left corner of the floor (and the floor's size
 * and what the layout needs in metres).
 * @example
 * ```ts
 * import { multiLayout } from "@johnmorrisdotca/kyogijo-stadiums/multi";
 * const layout = multiLayout({ preset: "tabletennis-4" });
 * console.log(layout.cells.length, layout.needs.length, layout.needs.width);
 * // 4 28 14
 * ```
 */
export function multiLayout(options: Pick<MultiOptions, "preset" | "layout" | "rows" | "columns" | "stagger" | "language"> = {}): MultiLayout {
  const spec = specOf(options);
  const language: Language = options.language === "ja" ? "ja" : "en";
  const words = MULTI_WORDS[language];
  const name = (n: number): string => fill(words.names[spec.word], { n });
  const cells: MultiCell[] = [];
  let floor: { w: number; h: number };
  let tatami: Parameters<typeof slotsFor>[3];
  if (spec.kind === "budo") {
    // The contest area, the safety area, the common safe zone between areas and the free zone, in metres. Judo's are the drawing's own (`budoPlan`), so that the floor is laid where the surface is
    // drawn for every league: the IJF's contest area, its kata area (2 m of safety and common area, not 4) and the AJJF's (sizes made whole numbers of its 91 cm mats). Karate's are its league's.
    const karate = spec.sport === "karate";
    let c: number, s: number, gap: number, free: number;
    if (karate) {
      const dims = budoLeague(spec.surface).dimensions;
      const k = dims.kind === "karate" ? dims : WKF_KUMITE;
      [c, s, gap, free] = [k.area, k.safety, k.between, 0];
    } else {
      const plan = budoPlan(spec.surface);
      const first = plan.judo?.contests[0];
      const fig = plan.figures.kind === "judo" ? (plan.figures as JudoFigures) : IJF_CONTEST;
      if (plan.judo === undefined || first === undefined) throw new Error(`The layout "${spec.id}" is not a judo floor of contest areas`);
      [c, s, gap, free] = [first.x1 - first.x0, first.x0, plan.judo.gap, fig.freeZone];
    }
    const across = spec.columns;
    const down = spec.rows;
    const tw = across * c + (across - 1) * gap + 2 * s;
    const th = down * c + (down - 1) * gap + 2 * s;
    floor = { w: feet(tw + 2 * free, "m"), h: feet(th + 2 * free, "m") };
    tatami = { x: feet(free, "m"), y: feet(free, "m"), w: feet(tw, "m"), h: feet(th, "m"), safety: feet(s, "m"), gap: feet(gap, "m") };
    for (let j = 0; j < down; j += 1) {
      for (let i = 0; i < across; i += 1) {
        const x = feet(free + s + i * (c + gap), "m");
        const y = feet(free + s + j * (c + gap), "m");
        const w = feet(c, "m");
        const b = feet(gap / 2, "m");
        cells.push({ n: cells.length + 1, label: name(cells.length + 1), row: j, column: i, x, y, w, h: w, turn: false, bay: { x: x - b, y: y - b, w: w + 2 * b, h: w + 2 * b } });
      }
    }
  } else {
    const box = outlineOf(spec.surface).box;
    const turn = spec.turn === 90;
    const sw = turn ? box.h : box.w;
    const sh = turn ? box.w : box.h;
    const bay = spec.bay === undefined ? { length: sw, width: sh } : size(spec.bay);
    const edge = spec.edge === undefined ? { length: (bay.length - sw) / 2, width: (bay.width - sh) / 2 } : size(spec.edge);
    const shift = spec.stagger === undefined ? 0 : spec.stagger * bay.length;
    for (let j = 0; j < spec.rows; j += 1) {
      for (let i = 0; i < spec.columns; i += 1) {
        const x = edge.length + i * bay.length + (j % 2 === 1 ? shift : 0);
        const y = edge.width + j * bay.width;
        const mx = (bay.length - sw) / 2;
        const my = (bay.width - sh) / 2;
        cells.push({ n: cells.length + 1, label: name(cells.length + 1), row: j, column: i, x, y, w: sw, h: sh, turn, bay: { x: x - mx, y: y - my, w: bay.length, h: bay.width } });
      }
    }
    floor = { w: 2 * edge.length + (spec.columns - 1) * bay.length + sw + (spec.rows > 1 ? shift : 0), h: 2 * edge.width + (spec.rows - 1) * bay.width + sh };
  }
  const slots = spec.parts.brand === "none" && spec.parts.boards !== true ? [] : slotsFor(spec, cells, floor, tatami);
  const needs: MultiNeeds = { length: round(metres(floor.w)), width: round(metres(floor.h)), area: round(metres(floor.w) * metres(floor.h), 1), surfaces: cells.length };
  const layout: MultiLayout = { spec, cells, slots, floor, needs };
  if (tatami !== undefined) layout.tatami = { x: tatami.x, y: tatami.y, w: tatami.w, h: tatami.h };
  if (spec.parts.scoreboard === "shared") {
    // 12 by 6 feet (ours), wider when there are more than four areas to give a panel each.
    const w = Math.min(Math.max(12, 3 * cells.length), floor.w * 0.5);
    layout.shared = { x: floor.w / 2 - w / 2, y: floor.h / 2 - 3, w, h: 6 };
  }
  return layout;
}

/** A hall as the caller gives it, or a key of `MULTI_VENUES`. @throws Error for a key that is not one, a size that is not positive. */
export function venueOf(venue: MultiOptions["venue"]): MultiVenue | undefined {
  if (venue === undefined) return undefined;
  if (typeof venue === "string") {
    const found = multiVenueById(venue);
    if (found === undefined) throw new Error(`Unknown venue "${venue}": use one of ${MULTI_VENUES.map((v) => v.id).join(", ")}`);
    return found;
  }
  if ("shape" in venue) return venue;
  if (!finite(venue.length) || !finite(venue.width) || venue.length <= 0 || venue.width <= 0) throw new RangeError("A venue of your own needs a length and a width above 0");
  const unit: MultiUnit = venue.unit === "ft" ? "ft" : "m";
  return {
    id: "custom",
    name: { en: "Your floor", ja: "指定した床" },
    shape: "rectangle",
    length: venue.length,
    width: venue.width,
    unit,
    what: { en: `a floor of ${venue.length} by ${venue.width} ${unit === "m" ? "metres" : "feet"}`, ja: `${venue.length}×${venue.width}${unit === "m" ? "m" : "フィート"}の床` },
    standsLike: "badminton",
    sources: [],
  };
}

/**
 * Whether a layout fits a hall's floor. A floor that is a rectangle takes the layout as it is or turned a quarter; an octagon takes it if its corners are inside; a floor of which only the area is published
 * can only be compared by area, and says so (`fits` is `null` when the area is enough, because the shape may still not take it).
 * @example
 * ```ts
 * import { multiFit, multiLayout } from "@johnmorrisdotca/kyogijo-stadiums/multi";
 * const four = multiFit(multiLayout({ preset: "curling-1x4" }), "nhl-ice-pad");
 * const six = multiFit(multiLayout({ preset: "curling-1x4", columns: 6 }), "nhl-ice-pad");
 * console.log(four.fits, four.turned, six.fits);
 * // true true false
 * ```
 */
export function multiFit(layout: MultiLayout, venue: MultiOptions["venue"]): MultiFit {
  const v = venueOf(venue);
  if (v === undefined) throw new TypeError("multiFit needs a venue");
  const needs = layout.needs;
  if (v.shape === "area") {
    const have = v.area ?? 0;
    return { fits: needs.area <= have ? null : false, turned: false, by: "area", needs, spare: { area: round(have - needs.area, 1) }, floor: { area: have } };
  }
  if (v.shape === "octagon") {
    const a = (v.across as number) / 2;
    const L = needs.length;
    const W = needs.width;
    const asIs = inOctagon(0, 0, a, L / 2, W / 2);
    const turned = inOctagon(0, 0, a, W / 2, L / 2);
    const fits = asIs || turned;
    // The spare is the octagon's width across the flats less the layout's, on each axis (the octagon is widest across the flats: its corners are cut).
    return { fits, turned: !asIs && turned, by: "size", needs, spare: { length: round(2 * a - L), width: round(2 * a - W) }, floor: { across: v.across as number, area: v.area ?? round(8 * a * a * (Math.SQRT2 - 1), 1) } };
  }
  const length = v.unit === "m" ? (v.length as number) : metres(v.length as number);
  const width = v.unit === "m" ? (v.width as number) : metres(v.width as number);
  const asIs = needs.length <= length + 1e-9 && needs.width <= width + 1e-9;
  const turned = needs.width <= length + 1e-9 && needs.length <= width + 1e-9;
  const floorArea = round(v.area ?? length * width, 1);
  if (asIs || turned) {
    const useTurn = !asIs;
    return { fits: true, turned: useTurn, by: "size", needs, spare: useTurn ? { length: round(length - needs.width), width: round(width - needs.length) } : { length: round(length - needs.length), width: round(width - needs.width) }, floor: { length: round(length), width: round(width), area: floorArea } };
  }
  const as = { length: round(length - needs.length), width: round(width - needs.width) };
  const tu = { length: round(length - needs.width), width: round(width - needs.length) };
  const shortAs = Math.min(0, as.length) + Math.min(0, as.width);
  const shortTu = Math.min(0, tu.length) + Math.min(0, tu.width);
  const useTurn = shortTu > shortAs;
  return { fits: false, turned: useTurn, by: "size", needs, spare: useTurn ? tu : as, floor: { length: round(length), width: round(width), area: floorArea } };
}

/** The sentence that says how a layout sits in a hall, in a language. */
export function fitSentence(fit: MultiFit, language: Language = "en"): string {
  const w = MULTI_WORDS[language].fit;
  const turned = fit.turned ? w.turned : "";
  if (fit.by === "area") {
    const spare = fit.spare as { area: number };
    const n = (v: number): string => multiNumber(v, language);
    return spare.area >= 0 ? fill(w.maybe, { need: n(fit.needs.area), have: n(fit.floor.area) }) : fill(w.tooSmall, { need: n(fit.needs.area), have: n(fit.floor.area) });
  }
  const spare = fit.spare as { length: number; width: number };
  const n = (v: number): string => multiNumber(v, language);
  if (fit.fits === true) return fill(w.fits, { length: n(spare.length), width: n(spare.width), turned });
  return fill(w.short, { length: n(round(Math.max(0, -spare.length))), width: n(round(Math.max(0, -spare.width))), turned });
}

/** The size of a layout as words, in a language: `28 by 14 metres (392 square metres)`; along the layout first, then across it. */
export const needsSentence = (needs: MultiNeeds, language: Language = "en"): string => {
  const n = (v: number): string => multiNumber(v, language);
  return language === "ja" ? `横${n(needs.length)}m×縦${n(needs.width)}m（${n(needs.area)}平方メートル）` : `${n(needs.length)} by ${n(needs.width)} metres (${n(needs.area)} square metres)`;
};
