// The targets seen end-on: the mouth of a goal from the shooter's side (hockey, soccer, handball, water polo, lacrosse, field hockey), the stumps from the bowler's end, and the strike
// zone from the catcher's. Each is a flat elevation, x across (positive to the viewer's right) and z up, drawn to scale from the rulebook's figure, with zones, and the shots, deliveries
// or pitches laid over it as marks that carry `data-mark-id`, `data-index` and `data-zone`. The marks are the data layers' (layers.ts), so they are described, tabled, upright and
// light or dark like any other, and the drawing is one SVG string that every renderer reads. Nothing here is drawn from another package's code; `soccerGoalMouth` of the charts is the
// soccer goal of this, with its own words.
import { drawingId, safeClass } from "./common.ts";
import { safeColour } from "./colour.ts";
import { esc, el, num } from "./format.ts";
import type { Frame, FrameMap } from "./frames.ts";
import { layerTable, renderLayers } from "./layers.ts";
import type { Layer, OutcomeStyle, PointsLayer, TextLayer } from "./layers.types.ts";
import { chooseLeague, lacrosseOf } from "./leagues.ts";
import { KYOGIJO_BASE_STYLE } from "./style.ts";
import { KYOGIJO_STRINGS, fill, type KyogijoWords } from "./strings.core.ts";
import { soccerSpec } from "./surfaces/soccer-spec.ts";
import { NHL, FEET_PER_METRE } from "./geometry.ts";
import { WATER_POLO } from "./pool.figures.ts";
import { IHF_COURT } from "./leagues/handball.ts";
import { FIH_PITCH } from "./leagues/fieldhockey.ts";
import { VERSION } from "./version.ts";
import type { Language, SurfaceOptions } from "./types.ts";

/** The things that have a target seen end-on: the sports with a goal, cricket's stumps and baseball's strike zone. */
export const TARGET_SPORTS = ["nhl", "soccer", "handball", "waterpolo", "lacrosse", "fieldhockey", "cricket", "mlb"] as const;
/** A sport that has a target. */
export type TargetSport = (typeof TARGET_SPORTS)[number];

/** The sports whose target is a goal. */
export const GOAL_SPORTS = ["nhl", "soccer", "handball", "waterpolo", "lacrosse", "fieldhockey"] as const;
export type GoalSport = (typeof GOAL_SPORTS)[number];

/** The unit of a number across a target. */
export type TargetUnit = "m" | "ft" | "in" | "cm" | "yd";
const METRES: Readonly<Record<TargetUnit, number>> = { m: 1, ft: 0.3048, in: 0.0254, cm: 0.01, yd: 0.9144 };

/** A shot, a delivery or a pitch where it crossed the target. */
export interface TargetShot {
  /** Your id for the mark, written on it as `data-mark-id`. */
  id?: string | number;
  /** Across the target from its middle, positive to the viewer's right (the shooter's, the bowler's; the catcher's for a pitch: Statcast's `plate_x`), in the options' `units`. */
  x: number | null;
  /** Up from the ground (Statcast's `plate_z`), in `units`. */
  z: number | null;
  /**
   * What became of it. A goal: `goal`, `saved`, `post`, `crossbar`, `wide`, `high`, `blocked`. A pitch: `ball`, `called-strike`, `swinging-strike`, `foul`, `in-play`, `hit-by-pitch`.
   * A delivery: `wicket`, `runs`, `dot`. Without one, `wide` or `high` if the place is outside the frame, else `shot`.
   */
  outcome?: string;
  /** The pitch type (`FF`, `SL`) a pitch is coloured by when `colorBy` is `type`. */
  type?: string;
  /** The order of a pitch in the at-bat, 1 first: the number written on its mark. The order given is the default. */
  order?: number;
  /** Expected goals (or any value) that sizes a goal's mark when the options ask. */
  value?: number;
  team?: string;
  title?: string;
  /** For a delivery: how far from the batter's stumps it pitched, in the options' `units`: the length zone. */
  length?: number;
}

/** What the target draws. */
export interface TargetOptions {
  /** `nhl`, `soccer`, `handball`, `waterpolo`, `lacrosse` or `fieldhockey` for a goal, `cricket` for the stumps, `mlb` for the strike zone. */
  sport: TargetSport;
  /** The unit of the shots' `x` and `z`, and of `goal`, `top` and `bottom`: the unit the sport's rulebook prints the target in (feet for hockey, lacrosse and baseball, metres for the rest). */
  units?: TargetUnit;
  /** A league of the sport whose rulebook gives another goal (lacrosse: `nll`, the box floor's 4 ft 9 in by 4 ft; `ncaa-men`). */
  league?: string;
  /** A soccer pitch (the goal of a small-sided format is another size). */
  pitch?: SurfaceOptions["pitch"];
  /** A goal of another size, in `units`. */
  goal?: { width: number; height: number };
  /** Draw the zones as cells with their names (`labels`), or leave them out. On by default for a goal's grid, off for the stumps, the strike zone's 9 cells are always drawn. */
  zones?: boolean | "labels";
  /** For the strike zone: the top and the bottom of the batter's zone in `units` (feet): the rulebook's definition depends on the batter (the midpoint between the shoulders and the belt, the hollow under the kneecap). 3.5 and 1.5 by default, a batter of average build and ours, not the rulebook's. */
  top?: number;
  bottom?: number;
  /** The side the batter bats from: `R` (the default) or `L`. The marker stands at his side of the plate. */
  bats?: "L" | "R";
  /** The 13-zone chase grid: the four outside zones round the 9 inside. On by default. */
  chase?: boolean;
  /** Colour the pitches by their `result` (the default) or their `type`. */
  colorBy?: "result" | "type";
  /** Write the order number on each pitch (on by default for the strike zone). */
  numbers?: boolean;
  /** Size the marks by their `value`. */
  sizeBy?: "value";
  language?: Language;
  id?: string;
  title?: string;
  theme?: SurfaceOptions["theme"];
  style?: SurfaceOptions["style"];
  className?: string;
}

/** The target as drawn and as data. */
export interface TargetDrawing {
  /** The drawing as an SVG string. */
  svg: string;
  /** The layers of the marks, in the frame of the target (x across and y up, in `units`), if you want to draw them another way. */
  layers: Layer[];
  /** The shots that had a place and the ones that did not. */
  placed: number;
  skipped: number;
  /** How many marks are in each zone, by id. */
  zones: Record<string, number>;
  /** What the colours and shapes mean: one entry for each result (or type) present. */
  key: { id: string; label: string; shape: string; hollow: boolean; color?: string }[];
  /** The frame of the target: the width and height of the opening and of the view, in `units`. */
  target: TargetFrame;
  /** The table of the marks with their place across the target. */
  table(): string;
}

/** The size of a target and of what is drawn round it, in the unit it is in. */
export interface TargetFrame {
  sport: TargetSport;
  unit: TargetUnit;
  /** The opening: the goal's width and height, the stumps' 9 inches by 28, the strike zone's plate width and the zone's height. */
  width: number;
  height: number;
  /** Where the opening's bottom is: 0 for a goal and the stumps, the bottom of the zone for the strike zone. */
  floor: number;
  /** The view: from `x0` to `x1` across, from `z0` to `z1` up. */
  view: { x0: number; x1: number; z0: number; z1: number };
  /** The rulebook line (or the sentence) the size comes from. */
  source: string;
}

interface Cell {
  id: string;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

// ----- the targets' sizes

/** The width of a home plate across, the same as the strike zone's: 17 inches (OBR 2.02). */
const PLATE = 17 / 12;

/** The size of a goal in its rulebook unit. Hockey: the NHL's net (Rule 2.1) 6 by 4 feet. Soccer: the Laws' 7.32 by 2.44 m, or the format's. Handball: the IHF's 3 by 2 m. Water polo: World Aquatics' 3 m, the crossbar 0.9 m over the water. Lacrosse: 6 by 6 feet (World Lacrosse 1.83 m, NCAA, PLL), the box floor's 4 ft 9 in by 4 ft. Field hockey: the FIH's 3.66 by 2.14 m. */
export function goalSize(sport: GoalSport, options: Pick<TargetOptions, "league" | "pitch"> = {}): { width: number; height: number; unit: "m" | "ft"; source: string } {
  switch (sport) {
    case "nhl":
      return { width: NHL.net.width, height: 4, unit: "ft", source: "NHL Official Rules, Rule 2.1: the goal posts six feet apart and four feet high" };
    case "soccer": {
      const spec = soccerSpec(options.pitch);
      return { width: spec.goalWidth, height: spec.goalHeight, unit: "m", source: "IFAB Laws of the Game, Law 1 (Law 1 for small-sided formats: the format's own goal)" };
    }
    case "handball":
      return { width: IHF_COURT.goalWidth, height: IHF_COURT.goalHeight, unit: "m", source: "IHF Rules of the Game for Indoor Handball, Rule 1:2: 3 m wide and 2 m high" };
    case "waterpolo":
      return { width: WATER_POLO.goal.width, height: WATER_POLO.goal.crossbarHeight, unit: "m", source: "World Aquatics Competition Regulations (February 2026), Part Six Article 21.6 (21.6.3.2 posts, 21.6.4.2 crossbar): 3.0 m between the posts, the crossbar's underside 0.9 m over the water" };
    case "lacrosse": {
      const { league } = chooseLeague({ sport: "lacrosse", league: options.league });
      if (league?.family === "lacrosse") {
        const spec = lacrosseOf(league);
        return { width: spec.goalWidth, height: spec.goalHeight, unit: "ft", source: `${league.id}: the goal ${spec.goalWidth.toFixed(2)} ft by ${spec.goalHeight.toFixed(2)} ft` };
      }
      return { width: 6, height: 6, unit: "ft", source: "World Lacrosse Men's Field Lacrosse Rules 2.1 (1.83 m by 1.83 m), the NCAA's and the PLL's six feet by six feet" };
    }
    case "fieldhockey":
      return { width: FIH_PITCH.goalWidth, height: FIH_PITCH.goalHeight, unit: "m", source: "FIH Rules of Hockey 2026, Field and Equipment Specifications 1.5 (Goals): 3.66 m between the posts, 2.14 m under the crossbar" };
  }
}

const frameOf = (sport: TargetSport, options: TargetOptions): TargetFrame => {
  if (sport === "mlb") {
    const bottom = options.bottom ?? 1.5;
    const top = options.top ?? 3.5;
    if (!(top > bottom)) throw new RangeError("the strike zone's top is above its bottom");
    const h = top - bottom;
    return { sport, unit: "ft", width: PLATE, height: h, floor: bottom, view: { x0: -2.1, x1: 2.1, z0: -0.3, z1: top + h * 0.7 }, source: "Official Baseball Rules, definition of the strike zone, and Rule 2.02 (home plate 17 inches wide)" };
  }
  if (sport === "cricket") {
    return { sport, unit: "m", width: 0.2286, height: 0.7112, floor: 0, view: { x0: -0.7, x1: 0.7, z0: -0.1, z1: 1.35 }, source: "MCC Laws of Cricket, Law 8.1 and 8.2: three stumps across 9 in (22.86 cm), their tops 28 in (71.12 cm) over the ground" };
  }
  const base = goalSize(sport, options);
  const width = options.goal?.width ?? base.width;
  const height = options.goal?.height ?? base.height;
  return { sport, unit: base.unit, width, height, floor: 0, view: { x0: (-width * 1.7) / 2, x1: (width * 1.7) / 2, z0: -height * 0.22, z1: height * 1.88 }, source: base.source };
};

// ----- zones

/** The ids of the 3 by 3 grid across a goal, left to right and top to bottom: the shooter's left first. */
export function goalZoneIds(sport: GoalSport): string[] {
  const ids = ["top-left-corner", "top-centre", "top-right-corner", "mid-left", "centre", "mid-right", "bottom-left-corner", "bottom-centre", "bottom-right-corner"];
  // Hockey's own words for the two middle cells of the top and the bottom row: the top shelf under the crossbar and the five-hole between the pads.
  if (sport === "nhl") return ids.map((id) => (id === "top-centre" ? "top-shelf" : id === "bottom-centre" ? "five-hole" : id));
  return ids;
}

function goalCells(f: TargetFrame): Cell[] {
  const ids = goalZoneIds(f.sport as GoalSport);
  const hw = f.width / 2;
  const out: Cell[] = [];
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      out.push({ id: ids[r * 3 + c], x0: -hw + (f.width * c) / 3, x1: -hw + (f.width * (c + 1)) / 3, z0: f.height - (f.height * (r + 1)) / 3, z1: f.height - (f.height * r) / 3 });
    }
  }
  return out;
}

function strikeCells(f: TargetFrame, chase: boolean): Cell[] {
  const hw = f.width / 2;
  const top = f.floor + f.height;
  const out: Cell[] = [];
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) out.push({ id: `zone-${r * 3 + c + 1}`, x0: -hw + (f.width * c) / 3, x1: -hw + (f.width * (c + 1)) / 3, z0: top - (f.height * (r + 1)) / 3, z1: top - (f.height * r) / 3 });
  }
  if (chase) {
    const ox = f.width / 2;
    const oz = f.height / 2;
    const mid = f.floor + f.height / 2;
    out.push(
      { id: "zone-11", x0: -hw - ox, x1: 0, z0: mid, z1: top + oz },
      { id: "zone-12", x0: 0, x1: hw + ox, z0: mid, z1: top + oz },
      { id: "zone-13", x0: -hw - ox, x1: 0, z0: f.floor - oz, z1: mid },
      { id: "zone-14", x0: 0, x1: hw + ox, z0: f.floor - oz, z1: mid },
    );
  }
  return out;
}

/** The line zones across the stumps: the stumps' own width, then the same width again either side, and wide of that. They are on the screen's left and right of the stumps as the bowler sees them: which is the off side and which the leg depends on the batter's hand, so the ids do not say. */
function stumpCells(f: TargetFrame): Cell[] {
  const hw = f.width / 2;
  const w = f.width;
  const big = 100;
  const top = f.height;
  return [
    { id: "wide-left", x0: -big, x1: -hw - w, z0: -big, z1: big },
    { id: "outside-left", x0: -hw - w, x1: -hw, z0: -big, z1: big },
    { id: "on-stumps", x0: -hw, x1: hw, z0: -big, z1: top },
    { id: "over-stumps", x0: -hw, x1: hw, z0: top, z1: big },
    { id: "outside-right", x0: hw, x1: hw + w, z0: -big, z1: big },
    { id: "wide-right", x0: hw + w, x1: big, z0: -big, z1: big },
  ];
}

function cellsOf(f: TargetFrame, options: TargetOptions): Cell[] {
  return f.sport === "mlb" ? strikeCells(f, options.chase !== false) : f.sport === "cricket" ? stumpCells(f) : goalCells(f);
}

/** The length zones of a delivery by where it pitched, in metres from the batter's stumps (the convention here is ours: broadcasters' bands differ with the bowler's pace). */
export const LENGTH_ZONES: readonly { id: string; to: number }[] = Object.freeze([
  { id: "yorker", to: 2 },
  { id: "full", to: 4 },
  { id: "good-length", to: 6 },
  { id: "short-of-a-length", to: 8 },
  { id: "short", to: Infinity },
]);

/** The length zone of a delivery that pitched this many metres from the batter's stumps. */
export function lengthZoneOf(metres: number): string {
  if (!Number.isFinite(metres) || metres < 0) throw new RangeError("a length is a distance from the stumps, 0 or more");
  return (LENGTH_ZONES.find((zone) => metres < zone.to) ?? LENGTH_ZONES[LENGTH_ZONES.length - 1]).id;
}

/** Where a shot lies across a target: the id of its zone, and whether it is inside the opening, wide of it, over it or on its frame. */
export interface TargetPlace {
  zone: string;
  placement: "in" | "wide" | "high" | "wide-high" | "frame";
}

/**
 * The zone of a place across a goal, the stumps or the strike zone, in the options' units. A goal: its nine cells (the top shelf and the five-hole in hockey), or `wide-left`, `wide-right` and `over-the-bar`
 * outside the opening; the stumps: the line zones; the strike zone: `zone-1` to `zone-9` and the chase zones `zone-11` to `zone-14`, else `outside`.
 * @example
 * ```ts
 * import { targetZoneAt } from "@johnmorrisdotca/kyogijo-stadiums/target";
 * // A hockey net is 6 by 4 feet: a shot 2.5 feet to the right and 3.7 feet up is under the crossbar in the top right corner.
 * console.log(targetZoneAt({ sport: "nhl" }, 2.5, 3.7), targetZoneAt({ sport: "nhl" }, 0, 0.3).zone);
 * // { zone: 'top-right-corner', placement: 'in' } five-hole
 * ```
 */
export function targetZoneAt(options: TargetOptions, x: number, z: number): TargetPlace {
  const f = frameOf(options.sport, options);
  const k = unitScale(options, f);
  return placeIn(f, options, x * k, z * k);
}

const unitScale = (options: TargetOptions, f: TargetFrame): number => METRES[options.units ?? f.unit] / METRES[f.unit];

function placeIn(f: TargetFrame, options: TargetOptions, x: number, z: number): TargetPlace {
  const cells = cellsOf(f, options);
  const hw = f.width / 2;
  if (f.sport === "cricket") {
    const cell = cells.find((c) => x >= c.x0 && x < c.x1 && z >= c.z0 && z < c.z1) ?? cells[0];
    return { zone: cell.id, placement: cell.id === "on-stumps" ? "in" : cell.id.startsWith("wide") ? "wide" : cell.id === "over-stumps" ? "high" : "wide" };
  }
  if (f.sport === "mlb") {
    // The nine cells of the zone first, then the four chase zones; the edge of the zone is inside it (any part of the ball on it is a strike).
    const inner = cells.slice(0, 9).find((c) => x >= c.x0 && x <= c.x1 && z >= c.z0 && z <= c.z1);
    if (inner !== undefined) return { zone: inner.id, placement: "in" };
    const outer = cells.slice(9).find((c) => x >= c.x0 && x <= c.x1 && z >= c.z0 && z <= c.z1);
    return outer === undefined ? { zone: "outside", placement: Math.abs(x) > hw ? "wide" : "high" } : { zone: outer.id, placement: Math.abs(x) > hw ? "wide" : "high" };
  }
  const wide = Math.abs(x) > hw;
  const high = z > f.height;
  if (wide) return { zone: x < 0 ? "wide-left" : "wide-right", placement: high ? "wide-high" : "wide" };
  if (high) return { zone: "over-the-bar", placement: "high" };
  const cell = cells.find((c) => x >= c.x0 && x <= c.x1 && z >= c.z0 && z <= c.z1) ?? cells[4];
  return { zone: cell.id, placement: "in" };
}

// ----- looks

const GOAL_LOOKS: Record<string, OutcomeStyle> = {
  goal: { shape: "star", scale: 1.35 },
  saved: { hollow: true },
  post: { shape: "diamond", hollow: true },
  crossbar: { shape: "square", hollow: true },
  wide: { shape: "x", hollow: true },
  high: { shape: "triangle", hollow: true },
  missed: { shape: "x", hollow: true },
  blocked: { shape: "triangle", hollow: true },
};
const PITCH_LOOKS: Record<string, OutcomeStyle> = {
  ball: { shape: "circle", hollow: true },
  "called-strike": { shape: "square" },
  "swinging-strike": { shape: "x" },
  foul: { shape: "triangle", hollow: true },
  "in-play": { shape: "star", scale: 1.2 },
  "hit-by-pitch": { shape: "diamond" },
};
const CRICKET_LOOKS: Record<string, OutcomeStyle> = { wicket: { shape: "star", scale: 1.35 }, runs: { shape: "circle" }, dot: { shape: "circle", hollow: true } };

/** Colours for the results of a pitch and, in order, the types, readable on both grounds. */
const RESULT_COLOURS: Record<string, string> = { ball: "#4e79a7", "called-strike": "#e15759", "swinging-strike": "#b6222a", foul: "#f28e2b", "in-play": "#59a14f", "hit-by-pitch": "#9c755f" };
const TYPE_COLOURS = ["#e15759", "#4e79a7", "#59a14f", "#f28e2b", "#b07aa1", "#76b7b2", "#edc948", "#9c755f"];

const ORDER: Record<string, string[]> = {
  goal: ["goal", "saved", "post", "crossbar", "wide", "high", "blocked", "shot"],
  mlb: ["ball", "called-strike", "swinging-strike", "foul", "in-play", "hit-by-pitch"],
  cricket: ["wicket", "runs", "dot"],
};

export const KYOGIJO_TARGET_STYLE = `
.kyogijo .ky-tg-bg{fill:var(--ky-surface)}
.kyogijo.ky-target-field .ky-tg-bg{fill:var(--ky-apron)}
.kyogijo .ky-tg-open{fill:var(--ky-zone);opacity:.55}
.kyogijo.ky-target-field .ky-tg-open{fill:var(--ky-surface);opacity:.5}
.kyogijo .ky-tg-cell{fill:none;stroke:var(--ky-line);opacity:.6}
.kyogijo .ky-tg-out{fill:none;stroke:var(--ky-line);opacity:.4}
.kyogijo .ky-tg-cell:hover,.kyogijo .ky-tg-out:hover{opacity:1}
.kyogijo .ky-tg-label{fill:var(--ky-line);font-family:var(--ky-font);font-weight:700;opacity:.85;text-anchor:middle;pointer-events:none}
.kyogijo .ky-tg-frame{fill:none;stroke:var(--ky-line);stroke-linejoin:round;stroke-linecap:round}
.kyogijo .ky-tg-solid{fill:var(--ky-line);stroke:none}
.kyogijo .ky-tg-net{stroke:var(--ky-line);opacity:.3}
.kyogijo .ky-tg-mark{fill:var(--ky-line);font-family:var(--ky-font);font-weight:800;text-anchor:middle;opacity:.9}
.kyogijo .ky-tg-ink.ky-tg-cell,.kyogijo .ky-tg-ink.ky-tg-out,.kyogijo .ky-tg-ink.ky-tg-frame{stroke:var(--ky-ink)}
.kyogijo .ky-tg-ink.ky-tg-solid,.kyogijo .ky-tg-ink.ky-tg-mark{fill:var(--ky-ink)}
`;

// ----- drawing

const words = (language: Language): KyogijoWords => KYOGIJO_STRINGS[language];

function shortNumber(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/** Draw a goal, the stumps or a strike zone with shots laid on it. */
export function drawTarget(shots: readonly TargetShot[], options: TargetOptions): TargetDrawing {
  if (!Array.isArray(shots)) throw new TypeError("shots is a list of shots");
  if (!(TARGET_SPORTS as readonly string[]).includes(options.sport)) throw new RangeError(`Unknown target "${String(options.sport)}": use one of ${TARGET_SPORTS.join(", ")}`);
  const language: Language = options.language === "ja" ? "ja" : "en";
  const all = words(language);
  const t = all.target;
  const f = frameOf(options.sport, options);
  const U = f.unit;
  const k = unitScale(options, f);
  const inputUnit = options.units ?? U;
  const cells = cellsOf(f, options);
  const pitches = f.sport === "mlb";
  const colorBy = options.colorBy === "type" ? "type" : "result";
  const kind = pitches ? "mlb" : f.sport === "cricket" ? "cricket" : "goal";
  const looks = kind === "mlb" ? PITCH_LOOKS : kind === "cricket" ? CRICKET_LOOKS : GOAL_LOOKS;

  // The view and its frame, in the target's unit; the drawing is in feet, as every drawing is.
  const F = U === "ft" ? 1 : FEET_PER_METRE;
  const { x0, x1, z0, z1 } = f.view;
  const viewW = x1 - x0;
  const viewH = z1 - z0;
  const id = options.id !== undefined ? options.id : undefined;
  const surface = { sport: "soccer" as const, pitch: { length: viewW, width: viewH, unit: U }, units: U, language, ...(id === undefined ? {} : { id }), margin: 0 };
  const frame: Frame = {
    name: "target",
    title: "A target seen end-on: across from the middle (positive to the viewer's right) and the height",
    sport: "soccer",
    unit: U,
    x: [x0, x1],
    y: [z0, z1],
    origin: "the middle of the target on the ground",
    yDirection: "up",
    size: "variable",
    ends: "none",
    landmarks: ({ length, width }): FrameMap => ({ x: [[x0, 0], [x1, length]], y: [[z0, width], [z1, 0]] }),
    source: "Kyogijo",
  };

  // The zone of a mark, from its place in the drawing.
  const zoneFeet = (xf: number, yf: number): string | undefined => {
    const x = x0 + xf / F;
    const z = z1 - yf / F;
    return placeIn(f, options, x, z).zone;
  };

  const resultOf = (s: TargetShot): string => {
    if (typeof s.outcome === "string" && s.outcome !== "") return s.outcome.toLowerCase();
    if (kind === "mlb") return "ball";
    if (kind === "cricket") return "dot";
    const x = isFiniteNumber(s.x) ? s.x * k : 0;
    const z = isFiniteNumber(s.z) ? s.z * k : 0;
    const p = placeIn(f, options, x, z).placement;
    return p === "in" ? "shot" : p === "high" ? "high" : "wide";
  };

  const types = [...new Set(shots.map((s) => s.type).filter((v): v is string => typeof v === "string" && v !== ""))].sort();
  const rows = shots.map((s, i) => {
    const outcome = resultOf(s);
    const length = isFiniteNumber(s.length) ? s.length : undefined;
    const lengthZone = kind === "cricket" && length !== undefined ? lengthZoneOf(length * METRES[inputUnit]) : undefined;
    const color = pitches ? (colorBy === "type" && s.type !== undefined ? TYPE_COLOURS[types.indexOf(s.type) % TYPE_COLOURS.length] : colorBy === "result" ? RESULT_COLOURS[outcome] : undefined) : undefined;
    const title = s.title ?? (lengthZone === undefined ? undefined : t.lengths[lengthZone as keyof typeof t.lengths]);
    return {
      id: s.id,
      x: isFiniteNumber(s.x) ? round(s.x * k, 4) : null,
      y: isFiniteNumber(s.z) ? round(s.z * k, 4) : null,
      outcome,
      value: s.value,
      team: s.team,
      title,
      color: color === undefined ? undefined : safeColour(color),
      __order: isFiniteNumber(s.order) ? s.order : i + 1,
    };
  });
  const placedRows = rows.filter((r) => r.x !== null && r.y !== null);
  const counts = new Map<string, number>();
  for (const r of placedRows) counts.set(r.outcome, (counts.get(r.outcome) ?? 0) + 1);
  const zones: Record<string, number> = {};
  for (const r of placedRows) {
    const z = placeIn(f, options, r.x as number, r.y as number).zone;
    zones[z] = (zones[z] ?? 0) + 1;
  }

  const outcomeLabels = t.outcomes as Record<string, string>;
  const present = [...counts.keys()];
  const order = ORDER[kind];
  const entries = [...order.filter((o) => present.includes(o)), ...present.filter((o) => !order.includes(o))];
  const markSize = Math.max(viewW * 0.045, (f.width / (pitches ? 6 : 1)) * (pitches ? 0.55 : 0.09));
  const sized = options.sizeBy === "value" && rows.some((r) => isFiniteNumber(r.value));
  const maxValue = Math.max(0.0001, ...rows.map((r) => (isFiniteNumber(r.value) ? r.value : 0)));
  const style = { outcomes: looks, opacity: 0.95, ...(pitches ? { stroke: "none" as const } : {}), ...(sized ? { size: { domain: [0, maxValue] as [number, number], range: [markSize * 0.5, markSize * 1.6] as [number, number] } } : { size: markSize }) };
  const data = rows;
  const layers: Layer[] = [];
  const listing = entries.length === 0 ? undefined : fill(all.layers.outcomes, { list: entries.map((o) => fill(all.layers.item, { name: outcomeLabels[o] ?? o, n: counts.get(o) ?? 0 })).join(all.layers.listSep) });
  const pointsLayer: PointsLayer = {
    kind: "points",
    id: kind === "mlb" ? "pitches" : kind === "cricket" ? "deliveries" : "goal-shots",
    name: kind === "mlb" ? t.pitches : kind === "cricket" ? t.deliveries : all.charts.shots,
    ...(listing === undefined ? {} : { description: listing }),
    from: frame,
    units: U,
    clip: "none",
    marks: true,
    data: data.map((d) => Object.fromEntries(Object.entries(d).filter(([key, v]) => key !== "__order" && v !== undefined)) as never),
    style,
  };
  layers.push(pointsLayer);
  if (pitches && options.numbers !== false) {
    const labelled: TextLayer = {
      kind: "text",
      id: "pitch-numbers",
      name: t.numbers,
      from: frame,
      units: U,
      clip: "none",
      marks: true,
      data: data.map((r) => ({ x: r.x, y: r.y, text: String(r.__order), id: r.id } as never)).filter((d: { x: number | null }) => d.x !== null),
      style: { size: markSize * 0.62, color: "var(--ky-layer-ink)" },
    };
    layers.push(labelled);
  }
  const rendered = renderLayers(surface, layers, false, undefined, undefined, zoneFeet);

  // The art, in feet.
  const X = (x: number): number => (x - x0) * F;
  const Y = (z: number): number => (z1 - z) * F;
  const art: string[] = [];
  const lw = viewW * F * 0.0035;
  art.push(el("rect", { class: "ky-tg-bg", x: 0, y: 0, width: viewW * F, height: viewH * F }));
  const hw = f.width / 2;
  const top = f.floor + f.height;
  if (kind === "goal") {
    art.push(el("rect", { class: "ky-tg-open", x: X(-hw), y: Y(f.height), width: f.width * F, height: f.height * F }));
    const net: string[] = [];
    const step = f.width / 16;
    for (let x = -hw + step; x < hw - 1e-6; x += step) net.push(`M${num(X(x))} ${num(Y(f.height))}V${num(Y(0))}`);
    for (let z = step; z < f.height - 1e-6; z += step) net.push(`M${num(X(-hw))} ${num(Y(z))}H${num(X(hw))}`);
    art.push(el("path", { class: "ky-tg-net", d: net.join(""), "stroke-width": lw * 0.5 }));
  } else if (pitches) {
    art.push(el("rect", { class: "ky-tg-open", x: X(-hw), y: Y(top), width: f.width * F, height: f.height * F }));
  }
  if (options.zones !== false || pitches) {
    const grid = options.zones !== false || pitches;
    if (grid) {
      const labels = options.zones === "labels" || (pitches && options.zones !== false);
      cells.forEach((c, i) => {
        if (kind === "cricket" && Math.abs(c.x0) > 50) return;
        const cx0 = Math.max(c.x0, x0);
        const cx1 = Math.min(c.x1, x1);
        const cz0 = Math.max(c.z0, z0);
        const cz1 = Math.min(c.z1, z1);
        if (!(cx1 > cx0) || !(cz1 > cz0)) return;
        const outer = pitches && i >= 9;
        const name = t.zones[c.id as keyof typeof t.zones] ?? c.id;
        art.push(el("rect", { class: outer ? "ky-tg-out ky-tg-ink" : kind === "cricket" ? "ky-tg-cell ky-tg-ink" : "ky-tg-cell", "stroke-width": outer ? lw * 0.8 : lw * 0.9, "stroke-dasharray": `${num(lw * 4)} ${num(lw * 3)}`, x: X(cx0), y: Y(cz1), width: (cx1 - cx0) * F, height: (cz1 - cz0) * F, "data-mark-id": c.id, "data-index": i, "data-zone": c.id }, `<title>${esc(name)}</title>`));
        if (labels && !outer && !(kind === "cricket")) {
          const size = Math.min(((cx1 - cx0) * F) / Math.max(4, name.length * 0.62), ((cz1 - cz0) * F) * 0.3);
          art.push(`<text class="ky-tg-label" x="${num(X((cx0 + cx1) / 2))}" y="${num(Y((cz0 + cz1) / 2) + size * 0.35)}" font-size="${num(size)}">${esc(pitches ? c.id.replace("zone-", "") : name)}</text>`);
        }
      });
    }
  }
  if (kind === "goal") {
    art.push(el("path", { class: "ky-tg-frame", d: `M${num(X(-hw))} ${num(Y(0))}V${num(Y(f.height))}H${num(X(hw))}V${num(Y(0))}`, "stroke-width": lw * 2.4 }));
    art.push(el("path", { class: "ky-tg-frame", d: `M0 ${num(Y(0))}H${num(viewW * F)}`, "stroke-width": lw * 1.4 }));
  } else if (pitches) {
    art.push(el("rect", { class: "ky-tg-frame", x: X(-hw), y: Y(top), width: f.width * F, height: f.height * F, "stroke-width": lw * 2.2 }));
    // Home plate seen from the catcher's side: its 17 inches across at the ground, a pentagon's front edge and the two sloping sides.
    const py = Y(0);
    const p = (PLATE / 2) * F;
    art.push(el("path", { class: "ky-tg-solid ky-tg-ink", d: `M${num(X(0) - p)} ${num(py)}H${num(X(0) + p)}L${num(X(0) + p * 0.7)} ${num(py + 0.18 * F)}H${num(X(0) - p * 0.7)}Z`, opacity: 0.8 }));
    const side = options.bats === "L" ? 1 : -1;
    const bx = X(side * (hw + 0.85));
    const by = Y(top - f.height * 0.2);
    art.push(el("path", { class: "ky-tg-frame ky-tg-ink", d: `M${num(bx)} ${num(Y(f.floor - 0.1))}V${num(Y(top + 0.25))}`, "stroke-width": lw * 3, opacity: 0.6 }));
    art.push(`<text class="ky-tg-mark ky-tg-ink" x="${num(bx)}" y="${num(by)}" font-size="${num(0.4 * F)}">${options.bats === "L" ? "L" : "R"}</text>`);
  } else {
    const d = 1.5 / 39.37;
    const gap = (f.width - 3 * d) / 2;
    for (let i = 0; i < 3; i += 1) {
      const cx = -hw + d / 2 + i * (d + gap);
      art.push(el("rect", { class: "ky-tg-solid ky-tg-ink", x: X(cx - d / 2), y: Y(f.height), width: d * F, height: f.height * F }));
    }
    // Two bails, each 4.31 in long and standing 0.5 in over the stumps, across the gaps: the Laws allow no more than that above the stumps.
    const bail = 0.0125;
    for (let i = 0; i < 2; i += 1) {
      const a = -hw + d + i * (d + gap) - d * 0.1;
      art.push(el("rect", { class: "ky-tg-solid ky-tg-ink", x: X(a), y: Y(f.height + bail), width: (gap + d * 0.2) * F, height: bail * F }));
    }
    art.push(el("path", { class: "ky-tg-frame ky-tg-ink", d: `M0 ${num(Y(0))}H${num(viewW * F)}`, "stroke-width": lw * 1.4 }));
  }
  const title = options.title ?? (kind === "mlb" ? t.titleStrike : kind === "cricket" ? t.titleStumps : fill(t.titleGoal, { name: t.sports[f.sport as keyof typeof t.sports] }));
  const unitWord = t.units[U];
  const description = [
    kind === "mlb"
      ? fill(t.descStrike, { w: shortNumber(f.width * 12), bottom: shortNumber(f.floor), top: shortNumber(top), side: options.bats === "L" ? t.right : t.left })
      : kind === "cricket"
        ? t.descStumps
        : fill(t.descGoal, { name: t.sports[f.sport as keyof typeof t.sports], w: shortNumber(f.width), h: shortNumber(f.height), unit: unitWord }),
    rendered.summaries.length === 0 ? "" : `${all.layers.data}${all.said.colon}${rendered.summaries.join(all.said.gap)}`,
  ]
    .filter(Boolean)
    .join(all.said.gap);
  const gid = drawingId(surface as SurfaceOptions);
  const theme = options.theme === "light" || options.theme === "dark" ? options.theme : undefined;
  const cls = safeClass(options.className);
  const svg = el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      class: `kyogijo ky-${f.sport === "mlb" ? "mlb" : f.sport} ky-target ky-target-${kind === "goal" ? "goal" : "field"} ky-${kind === "mlb" ? "strike-zone" : kind === "cricket" ? "stumps" : "goal-mouth"}${cls === "" ? "" : ` ${cls}`}`,
      viewBox: `0 0 ${num(viewW * F)} ${num(viewH * F)}`,
      role: "img",
      "aria-labelledby": `${gid}-t ${gid}-d`,
      "data-sport": f.sport,
      "data-target": kind === "mlb" ? "strike-zone" : kind === "cricket" ? "stumps" : "goal",
      "data-orientation": "landscape",
      "data-theme": theme,
      "data-version": VERSION,
    },
    `<title id="${gid}-t">${esc(title)}</title><desc id="${gid}-d">${esc(description)}</desc>${options.style === "none" ? "" : `<style>${KYOGIJO_BASE_STYLE}${KYOGIJO_TARGET_STYLE}</style>`}<g class="ky-surface-group">${art.join("")}${rendered.svg}</g>`,
  );
  const key = entries.map((o) => ({ id: o, label: outcomeLabels[o] ?? o, shape: looks[o]?.shape ?? "circle", hollow: looks[o]?.hollow === true, ...(pitches && colorBy === "result" && RESULT_COLOURS[o] !== undefined ? { color: RESULT_COLOURS[o] } : {}) }));
  return {
    svg,
    layers,
    placed: placedRows.length,
    skipped: rows.length - placedRows.length,
    zones,
    key,
    target: f,
    table: () => layerTable(layers, { language, surface: surface as SurfaceOptions }),
  };
}

/**
 * The mouth of a goal seen from the shooter's side, with the shots laid on it: where each crossed the goal line (`x` across from the middle, positive to the shooter's right, and `z` up). A shot wide of the posts or over the bar is drawn
 * outside the frame, a post or crossbar on it; the nine zones (the top shelf and the five-hole in hockey, the top corners and the bottom corners everywhere) are drawn when asked and counted in `zones`.
 * @example
 * ```ts
 * import { drawGoalMouth } from "@johnmorrisdotca/kyogijo-stadiums/target";
 * const view = drawGoalMouth(
 *   [
 *     { x: -2.4, z: 3.6, outcome: "goal" },
 *     { x: 0, z: 0.4, outcome: "saved" },
 *     { x: 3.4, z: 2, outcome: "wide" },
 *   ],
 *   { sport: "nhl", zones: true },
 * );
 * console.log(view.placed, view.zones["top-left-corner"], view.zones["wide-right"], view.target.width, view.target.height);
 * // 3 1 1 6 4
 * ```
 */
export function drawGoalMouth(shots: readonly TargetShot[], options: Omit<TargetOptions, "sport"> & { sport: GoalSport }): TargetDrawing {
  if (!(GOAL_SPORTS as readonly string[]).includes(options.sport)) throw new RangeError(`A goal mouth is for ${GOAL_SPORTS.join(", ")}, not "${String(options.sport)}"`);
  return drawTarget(shots, options);
}

/**
 * The strike zone seen from the catcher's position: home plate's 17 inches across, the zone from the batter's knees to his belt (`bottom` and `top`, in feet), the nine cells of the zone (1 to 9, top left to bottom right as the catcher sees them) and
 * the four chase zones round them (11 to 14), the batter's side, and the pitches numbered in order, coloured by result or type and shaped by what became of them. The place is Statcast's `plate_x` and `plate_z`.
 * @example
 * ```ts
 * import { drawStrikeZone } from "@johnmorrisdotca/kyogijo-stadiums/target";
 * const view = drawStrikeZone([
 *   { x: 0.1, z: 2.6, outcome: "called-strike", type: "FF" },
 *   { x: 1.3, z: 1.1, outcome: "ball", type: "SL" },
 *   { x: -0.4, z: 2.0, outcome: "swinging-strike", type: "SL" },
 * ], { bats: "R" });
 * console.log(view.placed, view.zones["zone-5"], view.zones["zone-13"] ?? 0, view.key.map((k) => k.id).join(" "));
 * // 3 1 0 ball called-strike swinging-strike
 * ```
 */
export function drawStrikeZone(pitches: readonly TargetShot[], options: Omit<TargetOptions, "sport"> = {}): TargetDrawing {
  return drawTarget(pitches, { ...options, sport: "mlb" });
}

/**
 * The stumps seen from the bowler's end: three stumps across 9 inches and 28 inches high with the bails, the line zones either side of them, and the deliveries where they reached the stumps' line (`x` across, `z` up), each with the length it
 * pitched at if you give one (`length`): `lengthZoneOf` names its length zone.
 * @example
 * ```ts
 * import { drawStumps, lengthZoneOf } from "@johnmorrisdotca/kyogijo-stadiums/target";
 * const view = drawStumps([{ x: 0.02, z: 0.4, outcome: "wicket", length: 5.1 }, { x: 0.5, z: 0.9, outcome: "dot", length: 7.4 }]);
 * console.log(view.zones["on-stumps"], view.zones["wide-right"], lengthZoneOf(5.1), lengthZoneOf(7.4));
 * // 1 1 good-length short-of-a-length
 * ```
 */
export function drawStumps(deliveries: readonly TargetShot[], options: Omit<TargetOptions, "sport"> = {}): TargetDrawing {
  return drawTarget(deliveries, { ...options, sport: "cricket" });
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function round(value: number, places: number): number {
  return Math.round(value * 10 ** places) / 10 ** places;
}
