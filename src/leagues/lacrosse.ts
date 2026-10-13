// The lacrosse surfaces: the box floor of the NLL and of World Lacrosse's box rules, and the fields of World Lacrosse (men's and women's), the NCAA (men's and women's) and the PLL. Every figure is
// the rulebook's, in the unit its book prints first (feet for the box, metres for World Lacrosse and the NCAA women, yards for the NCAA men and the PLL); docs/sources.md says which rule. Where a rulebook gives
// a range the range is kept and the greatest is drawn.
import type { Unit } from "../units.ts";
import { fixed, span, type Span } from "./fields.ts";
import { inFeet, type LeagueBase } from "./types.ts";

const inches = (n: number): number => n / 12;
const ftIn = (ft: number, inch: number): number => ft + inch / 12;

/** The figures of a lacrosse surface, in the unit of the table they are in. `null` is what a game does not mark. */
export interface LacrosseFigures {
  /** `box` (a floor with boards), or the field of the `men`'s game, the `women`'s or the `pll`'s. */
  kind: "box" | "men" | "women" | "pll";
  length: Span;
  width: Span;
  lineWidth: number;
  /** The goal line's distance from the end line (the end boards on a floor). */
  goalLine: number;
  /** The goal's opening, and the depth of the net behind the goal line. */
  goalWidth: number;
  goalHeight: number;
  netDepth: number;
  /** The crease: the circle's radius about the middle of the goal line (men's game and the floor), and, on a floor, the flat that cuts it that far behind the goal line. */
  crease: number | null;
  creaseFlat: number | null;
  /** The width of the crease line (the floor's). */
  creaseLine: number | null;
  /** The half circle of the goal mouth, from the middle of the goal line to each goal line extended (the NCAA men's). */
  goalMouth: number | null;
  /** The women's game: the goal circle's radius, the semicircle (the marking area) or fan, and the arc of 45-degree lines (a fan of the NCAA women's, the 11 m marking area of World Lacrosse). All from the middle of the goal line. */
  goalCircle: number | null;
  semicircle: number | null;
  arcFan: number | null;
  /** The restraining line: its distance from the goal line (the field), or from the centre line (the floor), across the whole width. */
  restraining: number | null;
  restrainingFromCentre: number | null;
  /** The NCAA men's attack-area line: the half-length of the line parallel to the goal line, and its distance from the goal line. */
  attackHalf: number | null;
  attackFrom: number | null;
  /** The wing lines: their distance from the centre of the field, and how far each extends either side of the centre line. */
  wings: { from: number; half: number } | null;
  /** The women's game: the centre circle's radius and the short line through the centre, parallel to the goal lines. The floor: the face-off circle's outer radius and the dotted inner circle's. */
  centreCircle: number | null;
  centreLine: number | null;
  faceOffOuter: number | null;
  faceOffInner: number | null;
  /** The floor: the corner face-off spots' distance from the boards and inside the restraining lines; and the floor's corner radius. */
  cornerSpotWall: number | null;
  cornerSpotInside: number | null;
  cornerRadius: number | null;
  /** The PLL's two-point arc: its distance from the middle of the goal line at the goal line extended, and the radius of the arc across the field. */
  twoPoint: { gle: number; radius: number } | null;
}

/** The surface as the drawing wants it: the figures with every length in feet. */
export type LacrosseSpec = LacrosseFigures;

/** A surface's figures in feet, from the unit its rulebook gives them in. */
export const lacrosseInFeet = (figures: LacrosseFigures, unit: Unit): LacrosseSpec => inFeet(figures, unit) as unknown as LacrosseSpec;

/** A league with a lacrosse surface of its own. */
export type LacrosseLeague = LeagueBase<"lacrosse", LacrosseFigures>;

const NO: Omit<LacrosseFigures, "kind" | "length" | "width" | "lineWidth" | "goalLine" | "goalWidth" | "goalHeight" | "netDepth"> = {
  crease: null,
  creaseFlat: null,
  creaseLine: null,
  goalMouth: null,
  goalCircle: null,
  semicircle: null,
  arcFan: null,
  restraining: null,
  restrainingFromCentre: null,
  attackHalf: null,
  attackFrom: null,
  wings: null,
  centreCircle: null,
  centreLine: null,
  faceOffOuter: null,
  faceOffInner: null,
  cornerSpotWall: null,
  cornerSpotInside: null,
  cornerRadius: null,
  twoPoint: null,
};

/**
 * World Lacrosse's men's field (Men's Field Lacrosse Official Playing Rules 2025-2027, v1.1): 91.4 to 100 m long and 50 to 60 m wide (1.1); goal posts 1.83 m apart and 1.83 m high, 12 m from each end line
 * (2.1, 2.2); the net's anchor 2.1 m behind the goal line (4.1); the crease a circle of 3 m radius (3.1); the goal area lines 22 m from the goal line (5.1); wing lines 18 m from the centre, extending 10 m
 * either side of the centre line (7.1); lines 5 cm, the centre line 10 cm (12.1). The centre is an X or a 10 cm square (6.1).
 */
export const WORLD_MEN_FIELD: LacrosseFigures = {
  kind: "men",
  length: span(91.4, 100),
  width: span(50, 60),
  lineWidth: 0.05,
  goalLine: 12,
  goalWidth: 1.83,
  goalHeight: 1.83,
  netDepth: 2.1,
  ...NO,
  crease: 3,
  restraining: 22,
  wings: { from: 18, half: 10 },
};

/**
 * World Lacrosse's women's field (Women's Field Lacrosse Official Playing Rules 2025-2026, v1.1): 91.4 to 100 m by 50 to 60 m (1.A.2); the goal line 12 m from each end line and 1.83 m long (1.A.5); a goal circle of
 * 3 m radius (1.A.8); the 15 m marking area, a semicircle from the middle of the goal line to each goal line extended (1.A.6); the 11 m marking area, with a line from where the goal line extended meets the goal
 * circle at 45 degrees to it out to the 11 m radius (1.A.7); restraining lines 22 m from each goal line (1.A.9); the centre line 3 m long (1.A.10) and the centre circle 9 m in radius (1.A.11); lines 5 to 10
 * cm (1.A.2). The book prints no depth for the net: the men's 2.1 m is drawn.
 */
export const WORLD_WOMEN_FIELD: LacrosseFigures = {
  kind: "women",
  length: span(91.4, 100),
  width: span(50, 60),
  lineWidth: 0.05,
  goalLine: 12,
  goalWidth: 1.83,
  goalHeight: 1.83,
  netDepth: 2.1,
  ...NO,
  goalCircle: 3,
  semicircle: 15,
  arcFan: 11,
  restraining: 22,
  centreCircle: 9,
  centreLine: 3,
};

/**
 * The NCAA's men's field (NCAA Men's Lacrosse Rules and Interpretations, 2027 and 2028, Rule 1): 110 by 60 yards (1-2); the goal 6 ft by 6 ft, 15 yards from each end line (1-3); the net fastened 7 ft behind the
 * centre of the goal (1-5); a crease of 9 ft radius and a goal mouth of 6 ft radius (1-4); the attack-area line 40 yards long, 20 yards from the goal line, joined to the end lines (1-6); the defensive-area line
 * 20 yards from the goal line, sideline to sideline (1-7); wing lines 20 yards from the centre, 10 yards each side of the centre line (1-8); the goal line and goal mouth 2 in wide, the centre line 4 in (1-2).
 */
export const NCAA_MEN_FIELD: LacrosseFigures = {
  kind: "men",
  length: fixed(110),
  width: fixed(60),
  lineWidth: inches(2) / 3,
  goalLine: 15,
  goalWidth: 2,
  goalHeight: 2,
  netDepth: 7 / 3,
  ...NO,
  crease: 3,
  goalMouth: 2,
  restraining: 20,
  attackHalf: 20,
  attackFrom: 20,
  wings: { from: 20, half: 10 },
};

/**
 * The NCAA's women's field (NCAA Women's Lacrosse Rules, 2026 and 2027, Rule 1): 101 to 110 m by 55 to 64 m, the optimal 110 by 60 m with the goals 92 m apart, 9 m behind each goal line (1-1); the goal 1.83 m
 * by 1.83 m with the net 2.1 m behind the goal line (1-18); a goal circle of 2.6 m radius (1-21); a restraining line 27 m from each goal line (1-4); a centre circle of 9 m radius and a 3 m line through the centre
 * (1-5); an arc of 8 m and a fan of 12 m from the goal circle, the arc ending at lines at 45 degrees to the goal line extended and the fan at the goal line extended (1-6); lines 5 to 10.1 cm, the goal line 5 cm (1-3).
 */
export const NCAA_WOMEN_FIELD: LacrosseFigures = {
  kind: "women",
  length: span(101, 110),
  width: span(55, 64, 60),
  lineWidth: 0.05,
  goalLine: 9,
  goalWidth: 1.83,
  goalHeight: 1.83,
  netDepth: 2.1,
  ...NO,
  goalCircle: 2.6,
  semicircle: 14.6,
  arcFan: 10.6,
  restraining: 27,
  centreCircle: 9,
  centreLine: 3,
};

/**
 * The PLL's field (2024 PLL Rulebook, Section II, the newest book found): 100 by 60 yards (A); the goal 6 ft by 6 ft, 15 yards from each end line (C, D); a crease of 9 ft radius (E); the two-point arc 13 yards from
 * the middle of the goal line at the goal line extended, parallel to the sideline until it is 15 yards from it, then an arc of 15 yards, and two straight lines from the goal line extended to the end line (G); wing
 * lines 19 yards from the centre, 10 yards each side (H); the centre line and the arc 4 in wide, the goal lines 2 in (A). The net is "approximately seven feet" back (F).
 */
export const PLL_FIELD: LacrosseFigures = {
  kind: "pll",
  length: fixed(100),
  width: fixed(60),
  lineWidth: inches(2) / 3,
  goalLine: 15,
  goalWidth: 2,
  goalHeight: 2,
  netDepth: 7 / 3,
  ...NO,
  crease: 3,
  wings: { from: 19, half: 10 },
  twoPoint: { gle: 13, radius: 15 },
};

const box = (kind: "box", figures: Partial<LacrosseFigures>): LacrosseFigures => ({
  kind,
  length: span(180, 200),
  width: fixed(85),
  lineWidth: inches(2),
  goalLine: 12,
  goalWidth: ftIn(4, 9),
  goalHeight: 4,
  netDepth: ftIn(4, 6),
  ...NO,
  crease: ftIn(9, 3),
  creaseFlat: 1,
  creaseLine: inches(5),
  restrainingFromCentre: ftIn(42, 6),
  faceOffOuter: 11,
  faceOffInner: inches(17),
  cornerSpotWall: 15,
  cornerSpotInside: 15,
  cornerRadius: 28,
  ...figures,
});

/**
 * The NLL's floor (Official Rules 2025-26, Section 1 and Diagram A): 180 to 200 ft long and 85 wide, corners of 28 ft radius (the diagram's labels); the goal 4 ft 9 in apart and 4 ft high, the goal line 12 ft from the
 * end boards (2.1), poles of 4 ft 6 in behind (2.2); the crease a circle of 9 ft 3 in radius cut by a line 1 ft behind the goal line (3.1); restraining lines 42 ft 6 in from the centre line (1.5); the centre face-off
 * circle of 11 ft radius with a dotted circle of 17 in (6.1); corner face-off spots 5 yards from the boards and 5 yards inside the restraining lines (6.2). The NLL's book prints no line width: World Lacrosse's 2 in is drawn.
 */
export const NLL_FLOOR: LacrosseFigures = box("box", {});

/**
 * World Lacrosse's box floor (Box Lacrosse Official Playing Rules 2026-2028, v2.0): the diagram's 200 ft by 85 ft, the same crease (1.1.7), goals (1.2.1), restraining lines (1.1.5) and face-off circles (1.1.9) as the
 * NLL's, all lines 2 in (1.1.3). Its Rule 1.2.2 says "25 m from the midline", which does not fit the feet.
 */
export const WORLD_BOX_FLOOR: LacrosseFigures = box("box", { length: fixed(200) });

/** The lacrosse leagues: World Lacrosse's men's field first, which is what a drawing has without a league. */
export const LACROSSE_LEAGUES: readonly LacrosseLeague[] = [
  { id: "world-men", family: "lacrosse", name: { en: "World Lacrosse men's field", ja: "ワールドラクロスの男子フィールド" }, unit: "m", dimensions: WORLD_MEN_FIELD, sources: ["wl-men"], builtIn: true },
  { id: "world-women", family: "lacrosse", name: { en: "World Lacrosse women's field", ja: "ワールドラクロスの女子フィールド" }, unit: "m", dimensions: WORLD_WOMEN_FIELD, sources: ["wl-women"] },
  { id: "ncaa-men", family: "lacrosse", name: { en: "NCAA men's lacrosse field", ja: "NCAA男子ラクロスのフィールド" }, unit: "yd", dimensions: NCAA_MEN_FIELD, sources: ["ncaa-men-lacrosse"] },
  { id: "ncaa-women", family: "lacrosse", name: { en: "NCAA women's lacrosse field", ja: "NCAA女子ラクロスのフィールド" }, unit: "m", dimensions: NCAA_WOMEN_FIELD, sources: ["ncaa-women-lacrosse"] },
  { id: "pll", family: "lacrosse", name: { en: "PLL field", ja: "PLLのフィールド" }, unit: "yd", dimensions: PLL_FIELD, sources: ["pll-2024"] },
  { id: "nll", family: "lacrosse", name: { en: "NLL box lacrosse floor", ja: "NLLのボックスラクロスのフロア" }, unit: "ft", dimensions: NLL_FLOOR, sources: ["nll-rules", "wl-box"] },
  { id: "world-box", family: "lacrosse", name: { en: "World Lacrosse box lacrosse floor", ja: "ワールドラクロスのボックスラクロスのフロア" }, unit: "ft", dimensions: WORLD_BOX_FLOOR, sources: ["wl-box"] },
];
