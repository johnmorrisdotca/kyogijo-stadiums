// A tournament layout laid out: several of the package's own surfaces on one floor, to scale, where each stands and what it leaves free; the floor the layout needs; and whether it fits a hall's floor. The
// figures are in multi.data.ts (a rulebook's, with its source); this file only adds them up. Nothing here draws SVG (multi.draw.ts does), and every function returns new values.
import { inOctagon } from "./budo/plan.ts";
import { fill } from "./strings.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import { IJF_CONTEST, WKF_KUMITE } from "./leagues/budo.ts";
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
    // Each surface has two places for a mark at its ends (the ITTF's rule allows up to 6 advertisements on the floor of an area) and one for words above it.
    for (const cell of cells) {
      const along = (cell.bay.w - cell.w) / 2;
      const across = (cell.bay.h - cell.h) / 2;
      const room = Math.min(along, cell.bay.h * 0.5);
      if (room >= 3) {
        const m = room * 0.6;
        out.push({ id: `logo-${cell.n}-start`, kind: "floor-logo", onMat: false, x: cell.x - room / 2 - m / 2, y: cell.y + cell.h / 2 - m / 2, w: m, h: m });
        out.push({ id: `logo-${cell.n}-end`, kind: "floor-logo", onMat: false, x: cell.x + cell.w + room / 2 - m / 2, y: cell.y + cell.h / 2 - m / 2, w: m, h: m });
      }
      if (across >= 4) {
        const h = Math.min(across * 0.4, 3.5);
        const w = cell.bay.w * 0.55;
        // The words go on the side of the surface that the officials' chair is not on.
        const y = spec.parts.officials === true ? cell.y + cell.h + across / 2 - h / 2 : cell.y - across / 2 - h / 2;
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
    // The contest area, the safety area, the common safe zone between areas and the free zone, in metres: judo's from the IJF's figures (or the options'), karate's from the WKF's kumite area.
    const karate = spec.sport === "karate";
    const opts = spec.surface.budo ?? {};
    const c = karate ? WKF_KUMITE.area : opts.size ?? IJF_CONTEST.contest.drawn;
    const s = karate ? WKF_KUMITE.safety : opts.safety ?? IJF_CONTEST.safety.drawn;
    const gap = karate ? WKF_KUMITE.between : Math.max(IJF_CONTEST.common, s);
    const free = karate ? 0 : IJF_CONTEST.freeZone;
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
        cells.push({ n: cells.length + 1, label: name(cells.length + 1), row: j, column: i, x, y, w, h: w, bay: { x: x - b, y: y - b, w: w + 2 * b, h: w + 2 * b } });
      }
    }
  } else {
    const box = outlineOf(spec.surface).box;
    const sw = box.w;
    const sh = box.h;
    const bay = spec.bay === undefined ? { length: sw, width: sh } : size(spec.bay);
    const edge = spec.edge === undefined ? { length: (bay.length - sw) / 2, width: (bay.width - sh) / 2 } : size(spec.edge);
    const shift = spec.stagger === undefined ? 0 : spec.stagger * bay.length;
    for (let j = 0; j < spec.rows; j += 1) {
      for (let i = 0; i < spec.columns; i += 1) {
        const x = edge.length + i * bay.length + (j % 2 === 1 ? shift : 0);
        const y = edge.width + j * bay.width;
        const mx = (bay.length - sw) / 2;
        const my = (bay.width - sh) / 2;
        cells.push({ n: cells.length + 1, label: name(cells.length + 1), row: j, column: i, x, y, w: sw, h: sh, bay: { x: x - mx, y: y - my, w: bay.length, h: bay.width } });
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
 * const six = multiFit(multiLayout({ preset: "curling-1x4", rows: 6 }), "nhl-ice-pad");
 * console.log(four.fits, four.turned, six.fits);
 * // true false false
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
    return spare.area >= 0 ? fill(w.maybe, { need: fit.needs.area, have: fit.floor.area }) : fill(w.tooSmall, { need: fit.needs.area, have: fit.floor.area });
  }
  const spare = fit.spare as { length: number; width: number };
  if (fit.fits === true) return fill(w.fits, { length: spare.length, width: spare.width, turned });
  return fill(w.short, { length: round(Math.max(0, -spare.length)), width: round(Math.max(0, -spare.width)), turned });
}

/** The size of a layout as words, in a language: `28 by 14 metres`. */
export const needsSentence = (needs: MultiNeeds, language: Language = "en"): string => (language === "ja" ? `${needs.length}m×${needs.width}m（${needs.area}平方メートル）` : `${needs.length} by ${needs.width} metres (${needs.area} square metres)`);
