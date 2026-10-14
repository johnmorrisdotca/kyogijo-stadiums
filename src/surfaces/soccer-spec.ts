// The soccer pitch: the Laws of the Game's figures, the presets of the bodies that publish their own, and the small-sided
// and futsal variants. Metres throughout (the Laws give metres, with yards beside them); the drawing turns them to feet.
// Every figure is cited in docs/sources.md. Nothing here draws.

export const METRES_PER_YARD = 0.9144;
export const METRES_PER_FOOT = 0.3048;

/** How a pitch's penalty area is shaped: a box (two lines and a line across), futsal's two quarter circles and a line, or the FA small-sided laws' semicircle round the middle of the goal line. */
export type SoccerArea = "box" | "arcs" | "semicircle";

/** The formats: eleven a side under the IFAB Laws, the small-sided ones of the FA, and futsal under FIFA's Futsal Laws. */
export type SoccerFormat = "11" | "9" | "7" | "5" | "futsal";

/** A pitch: its size and every marking. All lengths in metres. */
export interface SoccerSpec {
  id: string;
  /** The name written in the title. */
  name: string;
  format: SoccerFormat;
  /** Goal line to goal line (the touchline). */
  length: number;
  /** Touchline to touchline (the goal line). */
  width: number;
  /** The penalty area: how far it reaches into the field from the goal line, and its width along the goal line. */
  penaltyDepth: number;
  penaltyWidth: number;
  /** The goal area (the six-yard box). `0` when the format has none. */
  goalAreaDepth: number;
  goalAreaWidth: number;
  /** The penalty mark, from the goal line. `0` when there is none. */
  spot: number;
  /** A second penalty mark (futsal's 10 metres), from the goal line. */
  secondSpot: number;
  /** The radius of the centre circle. */
  centreRadius: number;
  /** The radius of the penalty arc, drawn outside the penalty area. `0` when there is none. */
  arcRadius: number;
  /** The radius of the corner arc. */
  cornerRadius: number;
  /** The goal, inside the posts. */
  goalWidth: number;
  goalHeight: number;
  /** How deep the net is drawn behind the goal line. The Laws do not fix it. */
  goalDepth: number;
  /** The shape of the penalty area. */
  area: SoccerArea;
  /** Futsal: the line across the front of the penalty area, between its two quarter circles. */
  areaLine: number;
  /** The width of the lines, at most this (the Laws: 12 cm; futsal: 8 cm). */
  lineWidth: number;
}

/**
 * Law 1 of the IFAB Laws of the Game (2025/26), the markings of a full pitch: the goal area reaches 5.5 m from the
 * posts and into the field, the penalty area 16.5 m, the penalty mark is 11 m from the goal line, the arcs and the
 * centre circle have a radius of 9.15 m, the corner arc 1 m; the goal is 7.32 m between the posts and 2.44 m high; the
 * lines are at most 12 cm wide. The Laws give yards beside each (6, 18, 12, 10 and 8 yards and 8 feet).
 */
export const SOCCER = {
  goalWidth: 7.32,
  goalHeight: 2.44,
  goalAreaReach: 5.5,
  penaltyReach: 16.5,
  spot: 11,
  centreRadius: 9.15,
  arcRadius: 9.15,
  cornerRadius: 1,
  /** Corner flags stand at least 1.5 m high. */
  flagHeight: 1.5,
  /** The least and the most of a pitch's length and width in any match, and in an international one. */
  limits: { length: [90, 120], width: [45, 90], internationalLength: [100, 110], internationalWidth: [64, 75] },
  lineWidth: 0.12,
  /** The marks off the field that show the distance of a corner kick: 9.15 m from the corner arc. */
  cornerMark: 9.15,
} as const;

/** The goal area's width and the penalty area's, which follow from the goal and the reach. */
export const goalAreaWidth = (goal: number = SOCCER.goalWidth, reach: number = SOCCER.goalAreaReach): number => goal + 2 * reach;
export const penaltyAreaWidth = (goal: number = SOCCER.goalWidth, reach: number = SOCCER.penaltyReach): number => goal + 2 * reach;

/** A full-size, eleven-a-side pitch of any size, with the Laws' markings. */
export function fullPitch(id: string, name: string, length: number, width: number): SoccerSpec {
  return {
    id,
    name,
    format: "11",
    length,
    width,
    penaltyDepth: SOCCER.penaltyReach,
    penaltyWidth: penaltyAreaWidth(),
    goalAreaDepth: SOCCER.goalAreaReach,
    goalAreaWidth: goalAreaWidth(),
    spot: SOCCER.spot,
    secondSpot: 0,
    centreRadius: SOCCER.centreRadius,
    arcRadius: SOCCER.arcRadius,
    cornerRadius: SOCCER.cornerRadius,
    goalWidth: SOCCER.goalWidth,
    goalHeight: SOCCER.goalHeight,
    goalDepth: 2,
    area: "box",
    areaLine: 0,
    lineWidth: SOCCER.lineWidth,
  };
}

/** Where the markings stand, in metres: the spec's, or a data provider's own. */
export interface SoccerLayout {
  penaltyDepth: number;
  penaltyHalfWidth: number;
  goalAreaDepth: number;
  goalAreaHalfWidth: number;
  spot: number;
  goalHalfWidth: number;
}

/** The layout of a spec as the Laws and the federation give it. */
export function layoutOf(spec: SoccerSpec): SoccerLayout {
  return {
    penaltyDepth: spec.penaltyDepth,
    penaltyHalfWidth: spec.penaltyWidth / 2,
    goalAreaDepth: spec.goalAreaDepth,
    goalAreaHalfWidth: spec.goalAreaWidth / 2,
    spot: spec.spot,
    goalHalfWidth: spec.goalWidth / 2,
  };
}

/** Which of the Laws' ranges a length and a width fall in. */
export type SoccerPitchClass = "international" | "within-laws" | "outside-laws";

/**
 * Where a pitch of this size stands under Law 1: `international` (100 to 110 m by 64 to 75 m, for international
 * matches), `within-laws` (90 to 120 m by 45 to 90 m, and the touchline longer than the goal line) or `outside-laws`.
 * @example
 * ```ts
 * import { soccerPitchClass } from "@johnmorrisdotca/kyogijo-stadiums";
 * console.log(soccerPitchClass(105, 68), soccerPitchClass(95, 60), soccerPitchClass(60, 40));
 * // international within-laws outside-laws
 * ```
 */
export function soccerPitchClass(length: number, width: number): SoccerPitchClass {
  const { limits } = SOCCER;
  const within = (value: number, range: readonly [number, number]): boolean => value >= range[0] && value <= range[1];
  if (!(length > width)) return "outside-laws";
  if (within(length, limits.internationalLength) && within(width, limits.internationalWidth)) return "international";
  return within(length, limits.length) && within(width, limits.width) ? "within-laws" : "outside-laws";
}

const yd = (n: number): number => n * METRES_PER_YARD;
const ft = (n: number): number => n * METRES_PER_FOOT;

/** A small-sided pitch: a box, its markings given by the federation, no goal area drawn unless it has one. */
function small(id: string, name: string, format: SoccerFormat, length: number, width: number, o: Partial<SoccerSpec>): SoccerSpec {
  return {
    ...fullPitch(id, name, length, width),
    format,
    secondSpot: 0,
    cornerRadius: 0.5,
    goalDepth: 1.2,
    ...o,
  };
}

/** The ids of the presets. */
export type SoccerPitchId = "fifa" | "uefa" | "mls" | "ncaa" | "law-min" | "law-max" | "9-a-side" | "7-a-side" | "5-a-side" | "futsal";

/** The ids of the presets, in the order a menu lists them. */
export const SOCCER_PITCH_IDS: readonly SoccerPitchId[] = ["fifa", "uefa", "mls", "ncaa", "law-min", "law-max", "9-a-side", "7-a-side", "5-a-side", "futsal"];

/**
 * The presets: the international pitch of 105 by 68 m (the Laws' usual, the Premier League's and UEFA's categories 3 and
 * 4), the least size the MLS requires (110 by 70 yards) and the NCAA's best (120 by 75 yards), the least and most the Laws
 * allow, the FA's 9-, 7- and 5-a-side pitches and FIFA's futsal court. Each is a full `SoccerSpec`.
 * @example
 * ```ts
 * import { SOCCER_PITCHES } from "@johnmorrisdotca/kyogijo-stadiums";
 * const { length, width, name } = SOCCER_PITCHES.fifa;
 * console.log(name, length, width);
 * // International (FIFA) 105 68
 * ```
 */
export const SOCCER_PITCHES: Readonly<Record<SoccerPitchId, SoccerSpec>> = {
  fifa: fullPitch("fifa", "International (FIFA)", 105, 68),
  uefa: fullPitch("uefa", "UEFA", 105, 68),
  mls: fullPitch("mls", "MLS (least size)", yd(110), yd(70)),
  ncaa: fullPitch("ncaa", "NCAA (best size)", yd(120), yd(75)),
  "law-min": fullPitch("law-min", "Smallest under the Laws", 90, 45),
  "law-max": fullPitch("law-max", "Largest under the Laws", 120, 90),
  // The FA's recommended pitch and goal sizes (Handbook, Section 38); the markings of 5- and 7-a-side are those of its small-sided laws (a semicircle of 6 m round the middle of each goal line, the mark at 6 m, the centre circle of 3 m), and the 9-a-side's are ours.
  "9-a-side": small("9-a-side", "9-a-side", "9", yd(80), yd(50), { penaltyDepth: 11, penaltyWidth: 22 + ft(16), goalAreaDepth: 0, goalAreaWidth: 0, spot: 9, arcRadius: 0, centreRadius: 7.3, goalWidth: ft(16), goalHeight: ft(7), cornerRadius: 0.25 }),
  "7-a-side": small("7-a-side", "7-a-side", "7", yd(60), yd(40), { penaltyDepth: 6, penaltyWidth: 12, area: "semicircle", goalAreaDepth: 0, goalAreaWidth: 0, spot: 6, arcRadius: 0, centreRadius: 3, goalWidth: ft(12), goalHeight: ft(6), cornerRadius: 0.25 }),
  "5-a-side": small("5-a-side", "5-a-side", "5", yd(40), yd(30), { penaltyDepth: 6, penaltyWidth: 12, area: "semicircle", goalAreaDepth: 0, goalAreaWidth: 0, spot: 6, arcRadius: 0, centreRadius: 3, goalWidth: ft(12), goalHeight: ft(6), cornerRadius: 0.25 }),
  futsal: {
    ...fullPitch("futsal", "Futsal (FIFA)", 40, 20),
    format: "futsal",
    penaltyDepth: 6,
    penaltyWidth: 3.16 + 12,
    goalAreaDepth: 0,
    goalAreaWidth: 0,
    spot: 6,
    secondSpot: 10,
    centreRadius: 3,
    arcRadius: 0,
    cornerRadius: 0.25,
    goalWidth: 3,
    goalHeight: 2,
    goalDepth: 1,
    area: "arcs",
    areaLine: 3.16,
    lineWidth: 0.08,
  },
};

/** A pitch given by size: any positive length and width, in metres, yards or feet. */
export interface SoccerSize {
  length: number;
  width: number;
  /** `m` (the default), `yd`, `ft`, `in`, `cm` or `mm`. */
  unit?: "m" | "yd" | "ft" | "in" | "cm" | "mm";
}

const UNIT: Record<NonNullable<SoccerSize["unit"]>, number> = { m: 1, yd: METRES_PER_YARD, ft: METRES_PER_FOOT, in: METRES_PER_FOOT / 12, cm: 0.01, mm: 0.001 };

const isSize = (value: unknown): value is SoccerSize => typeof value === "object" && value !== null && typeof (value as SoccerSize).length === "number" && typeof (value as SoccerSize).width === "number";

/**
 * The pitch an option asks for: a preset's id, or a size. An unknown id, or a size that is not a positive number (or
 * is more than 400 m), gives the international pitch. A size has the Laws' markings of a full pitch, sized to fit:
 * the areas are never wider than the pitch.
 * @example
 * ```ts
 * import { soccerSpec } from "@johnmorrisdotca/kyogijo-stadiums";
 * const pitch = soccerSpec({ length: 110, width: 70, unit: "yd" });
 * console.log(pitch.length.toFixed(2), pitch.width.toFixed(2));
 * // 100.58 64.01
 * ```
 */
export function soccerSpec(pitch?: SoccerPitchId | SoccerSize | string, defaultUnit: NonNullable<SoccerSize["unit"]> = "m"): SoccerSpec {
  if (typeof pitch === "string") return Object.prototype.hasOwnProperty.call(SOCCER_PITCHES, pitch) ? SOCCER_PITCHES[pitch as SoccerPitchId] : SOCCER_PITCHES.fifa;
  if (!isSize(pitch)) return SOCCER_PITCHES.fifa;
  const unit = pitch.unit !== undefined && Object.prototype.hasOwnProperty.call(UNIT, pitch.unit) ? UNIT[pitch.unit] : UNIT[defaultUnit];
  const length = pitch.length * unit;
  const width = pitch.width * unit;
  if (!(Number.isFinite(length) && Number.isFinite(width) && length > 0 && width > 0 && length <= 400 && width <= 400)) return SOCCER_PITCHES.fifa;
  const base = fullPitch("custom", "Custom pitch", length, width);
  // The areas of a short or narrow pitch are held to what fits.
  const penaltyWidth = Math.min(base.penaltyWidth, width * 0.9);
  const goalAreaWidth = Math.min(base.goalAreaWidth, penaltyWidth * 0.5);
  const reach = Math.min(base.penaltyDepth, length * 0.24);
  return { ...base, penaltyWidth, goalAreaWidth, penaltyDepth: reach, goalAreaDepth: Math.min(base.goalAreaDepth, reach * 0.4), spot: Math.min(base.spot, reach * 0.8), centreRadius: Math.min(base.centreRadius, width * 0.3), arcRadius: Math.min(base.arcRadius, width * 0.3) };
}
