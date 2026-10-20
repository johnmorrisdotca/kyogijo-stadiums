// The surfaces of the combat sports: the MMA cage and, as they are added, the boxing ring, the wrestling mats and the professional wrestling ring, each from the rulebook or the regulation it was read in, with every
// figure in metres. A figure that no rule gives is said so in its comment (ours), and a figure that is common practice and not a rule is said so (typical). Nothing here draws.
import { span, type Span } from "./fields.ts";
import type { LeagueBase } from "./types.ts";

/** One foot, and one inch, in metres: the rules are written in feet and inches. */
const FT = 0.3048;
const IN = 0.0254;

/** The figures of an MMA cage (a fenced area), in metres. */
export interface MmaFigures {
  kind: "mma";
  /**
   * The width of the fenced area: no smaller than 20 feet and no larger than 32 feet (NRUC 5.010 3(a); IMMAF 1: 20 by 20 to 32 by 32 feet). A cage with eight sides is measured across the flats, as a cage is called "30 feet across". Two sizes
   * are common (typical, not a rule): 30 feet, the larger, which is drawn, and 25 feet, the smaller one that promotions use in smaller venues.
   */
  width: Span;
  /** The sides: the fenced area is round or has at least six equal sides (NRUC 5.010 3(a)); eight is the common cage and is drawn (typical). */
  sides: number;
  /** The platform: not more than 4 feet above the floor of the building, with suitable steps (NRUC 5.010 3(c)). 4 feet is the usual height of a cage on a stage and is drawn (typical). */
  platform: { height: Span; steps: { treads: number; tread: number; width: number } };
  /** The width of the platform beyond the fence, the apron: the rules give none, so 1.2 m, four feet of walkway (ours). */
  apron: number;
  /** The floor: at least a 1 inch layer of closed-cell foam under a canvas, duck or vinyl cover (NRUC 5.010 3(b)). */
  foam: number;
  /** The fence: posts of metal, not more than 6 inches across, run from the floor of the building to between 5 and 7 feet above the floor of the fenced area (NRUC 5.010 3(d)); the fence itself is 6 feet in the usual cage and is drawn (typical). */
  fence: Span;
  /** The width of a post, 6 inches at most (NRUC 5.010 3(d)), and the padding on it and on the rails: the rules say "properly padded" and give no size (ours: a pad 0.3 m across at the post, a rail pad 0.12 m deep). */
  post: { diameter: number; pad: number; rail: number };
  /** The entrances: two, with secure locking mechanisms (NRUC 5.010 3(g)); the IMMAF asks for them on opposite sides and opening outward. Their width, 0.9 m, and height, 1.5 m, are typical and not a rule. */
  gates: { count: number; width: number; height: number };
}

/** A cage league: a regulation's cage. */
export type MmaLeague = LeagueBase<"mma", MmaFigures>;

/** The fenced area of the Nevada Rules of Unarmed Combat (NRUC 5.010 3), which most commissions copy. */
export const NRUC_CAGE: MmaFigures = {
  kind: "mma",
  width: span(20 * FT, 32 * FT, 30 * FT),
  sides: 8,
  platform: { height: span(0, 4 * FT, 4 * FT), steps: { treads: 3, tread: 0.3, width: 1.2 } },
  apron: 1.2,
  foam: 1 * IN,
  fence: span(5 * FT, 7 * FT, 6 * FT),
  post: { diameter: 6 * IN, pad: 0.3, rail: 0.12 },
  gates: { count: 2, width: 0.9, height: 1.5 },
};

/** The amateur fenced area of the IMMAF's Unified Rules for amateur competition: the same sizes, with 40 mm of foam and a vinyl cover. */
export const IMMAF_CAGE: MmaFigures = { ...NRUC_CAGE, foam: 0.04 };

/** The leagues of each combat sport: for each the rulebook's own first. */
export const MMA_LEAGUES: readonly MmaLeague[] = [
  { id: "nruc", family: "mma", name: { en: "MMA cage, Nevada Rules of Unarmed Combat", ja: "総合格闘技のケージ（ネバダ州の規則）" }, unit: "ft", figuresUnit: "m", dimensions: NRUC_CAGE, sources: ["nruc", "oar-230-070-0025", "wp-mma-cage"], builtIn: true },
  { id: "immaf", family: "mma", name: { en: "MMA cage, IMMAF amateur rules", ja: "総合格闘技のケージ（IMMAFのアマチュア規則）" }, unit: "ft", figuresUnit: "m", dimensions: IMMAF_CAGE, sources: ["immaf-amateur", "nruc"] },
];

/**
 * The figures of a ring, in metres: the boxing ring and, with its own figures, the professional wrestling ring. A ring is a raised square platform whose canvas is bounded by ropes held by a post at each corner, with the apron
 * beyond the ropes and steps up to it.
 */
export interface RingFigures {
  /** The ring, a square, measured inside the ropes. */
  size: Span;
  /** The platform: the most it may stand over the floor of the building, and the least it is drawn (0 puts the ring on the floor). */
  platform: { height: Span; steps: { sets: number; treads: number; tread: number; width: number } };
  /** The apron, the canvas beyond the ropes: the least the rules ask (the drawn width is the least unless said), and the thickness of the padding under the canvas. */
  apron: Span;
  foam: Span;
  /** The ropes: how many, their heights over the ring floor, and their thickness. */
  ropes: { count: number; heights: readonly number[]; diameter: Span };
  /** The corner posts: their height over the ring floor, their thickness, and how far each stands from the ropes (the ropes reach it by an extension). */
  post: { height: number; diameter: number; fromRopes: number; pad: number };
}

/** The figures of a boxing ring, in metres. */
export interface BoxingFigures extends RingFigures {
  kind: "boxing";
}

/** A boxing league: a regulation's ring. */
export type BoxingLeague = LeagueBase<"boxing", BoxingFigures>;

const STEPS = { sets: 3, treads: 3, tread: 0.3, width: 1.2 };

/** The ring of the Nevada Rules of Unarmed Combat (NRUC 2.050): 20 feet within the ropes, a floor 18 inches beyond them, a platform of at most 5 feet, posts of 58 inches over the ring floor at least 18 inches from the ropes, at least four ropes of at least 1 inch, the lowest 18 inches up. */
export const NRUC_RING: BoxingFigures = {
  kind: "boxing",
  size: span(20 * FT, 20 * FT, 20 * FT),
  platform: { height: span(0, 5 * FT, 4 * FT), steps: STEPS },
  apron: span(18 * IN, 4 * FT, 2 * FT),
  foam: span(1 * IN, 1.5 * IN, 1 * IN),
  ropes: { count: 4, heights: [18 * IN, 30 * IN, 42 * IN, 54 * IN], diameter: span(1 * IN, 2 * IN, 1 * IN) },
  post: { height: 58 * IN, diameter: 3 * IN, fromRopes: 18 * IN, pad: 0.3 },
};

/** The ring of Wisconsin's rule (SPS 192.38): 16 to 20 feet within the ropes, an apron of at least 18 inches, a platform of at most 4 feet with three sets of steps, ropes at 18, 30, 42 and 54 inches, posts at least 3 inches across and 58 inches high. */
export const WISCONSIN_RING: BoxingFigures = {
  kind: "boxing",
  size: span(16 * FT, 20 * FT, 20 * FT),
  platform: { height: span(0, 4 * FT, 4 * FT), steps: STEPS },
  apron: span(18 * IN, 4 * FT, 2 * FT),
  foam: span(1 * IN, 1 * IN, 1 * IN),
  ropes: { count: 4, heights: [18 * IN, 30 * IN, 42 * IN, 54 * IN], diameter: span(1 * IN, 2 * IN, 1 * IN) },
  post: { height: 58 * IN, diameter: 3 * IN, fromRopes: 18 * IN, pad: 0.3 },
};

/** The amateur ring of the WBC Amateur rules (Rule 1, 2026): 4.50 to 6.10 m within the ropes, a platform of 0.90 to 1.20 m, an apron of at least 0.50 m, ropes of 3 to 5 cm at 41, 71, 102 and 132 cm, three sets of steps. Ontario's amateur rules agree (4.9 to 6.1 m, ropes at 40, 70, 100 and 130 cm, an apron of at least 45 cm, a platform of at most 1.2 m). */
export const WBC_AMATEUR_RING: BoxingFigures = {
  kind: "boxing",
  size: span(4.5, 6.1, 6.1),
  platform: { height: span(0.9, 1.2, 1.2), steps: STEPS },
  apron: span(0.5, 1.5, 0.5),
  foam: span(0.01, 0.025, 0.02),
  ropes: { count: 4, heights: [0.41, 0.71, 1.02, 1.32], diameter: span(0.03, 0.05, 0.04) },
  post: { height: 1.5, diameter: 0.076, fromRopes: 0.45, pad: 0.3 },
};

/** The boxing leagues: the Nevada commission's first. */
export const BOXING_LEAGUES: readonly BoxingLeague[] = [
  { id: "nruc-ring", family: "boxing", name: { en: "Boxing ring, Nevada Rules of Unarmed Combat", ja: "ボクシングのリング（ネバダ州の規則）" }, unit: "ft", figuresUnit: "m", dimensions: NRUC_RING, sources: ["nruc", "wp-boxing-ring"], builtIn: true },
  { id: "wisconsin", family: "boxing", name: { en: "Boxing ring, Wisconsin", ja: "ボクシングのリング（ウィスコンシン州の規則）" }, unit: "ft", figuresUnit: "m", dimensions: WISCONSIN_RING, sources: ["wi-sps-192", "wp-boxing-ring"] },
  { id: "wbc-amateur", family: "boxing", name: { en: "Boxing ring, WBC Amateur rules", ja: "ボクシングのリング（WBCアマチュア規則）" }, unit: "m", dimensions: WBC_AMATEUR_RING, sources: ["wbc-amateur", "ontario-amateur-boxing"] },
];

/**
 * The figures of a wrestling mat, in metres. The UWW's mat (freestyle and Greco-Roman, which are wrestled on the same one) is a circle of 9 m with a central circle, an orange passivity band 1 m wide inside the circle and a
 * protection area 1.5 m wide round it, on a platform at the great events; the folkstyle mats of the NCAA and the high schools (NFHS) are a competition circle with a matted area round it and two parallel starting lines at the middle.
 */
export interface WrestlingFigures {
  kind: "wrestling";
  /** The wrestling area: the circle's diameter (the UWW's is fixed at 9 m; the NCAA's is 32 to 42 feet; the NFHS's is at least 28 feet). */
  circle: Span;
  /** The matted area round the circle (the UWW's protection area 1.5 m; the NCAA's at least 5 feet; the NFHS's about 5 feet). */
  border: Span;
  /** The orange passivity band inside the circle, 1 m wide (the UWW's only), and the line that outlines the circle (the NCAA's 2 inch line, which is in bounds). */
  passivity: number;
  rim: number;
  /** The circle in the middle: the UWW's central circle of 1 m inside with a band of 10 cm; the NFHS's optional circle of 10 feet; none for the NCAA. */
  centre: { diameter: number; band: number } | null;
  /** The starting lines: two parallel lines of `width` and `length`, `apart` between them, closed at the ends by a green and a red line (folkstyle); null for the UWW. */
  lines: { length: number; width: number; apart: number } | null;
  /** The platform the mat is installed on at the great events (the UWW: 0.80 m to 1.10 m, and at least 1 m round each side of the mat; a mat on the floor is also allowed, at the other events); the folkstyle rules give none (ours: 0 drawn, up to the UWW's greatest). `least` is the lowest a platform may be when there is one. */
  platform: { height: Span; around: number; least: number };
}

/** A wrestling league: a rule's mat. */
export type WrestlingLeague = LeagueBase<"wrestling", WrestlingFigures>;

/** The UWW's mat (Wrestling Rules, Article 4, January 2026), for freestyle, Greco-Roman and women's wrestling alike: 9 m, a 1.50 m border, an orange band of 1 m, a central circle of 1 m with a band of 10 cm, a platform of 0.80 to 1.10 m. */
export const UWW_MAT: WrestlingFigures = {
  kind: "wrestling",
  circle: span(9, 9, 9),
  border: span(1.5, 1.5, 1.5),
  passivity: 1,
  rim: 0,
  centre: { diameter: 1, band: 0.1 },
  lines: null,
  platform: { height: span(0, 1.1, 1), around: 1, least: 0.8 },
};

/** The NCAA's mat (Wrestling Rules 2025-26 and 2026-27, Rule 1, Section 1): a competition circle of 32 to 42 feet, a matted area of at least 5 feet round it, the circle's edge a 2 inch line in bounds, two down-position starting lines of 1 inch, 3 feet long and 10 inches apart, closed by a green and a red neutral line. */
export const NCAA_MAT: WrestlingFigures = {
  kind: "wrestling",
  circle: span(32 * FT, 42 * FT, 32 * FT),
  border: span(5 * FT, 10 * FT, 5 * FT),
  passivity: 0,
  rim: 2 * IN,
  centre: null,
  lines: { length: 3 * FT, width: 1 * IN, apart: 10 * IN },
  platform: { height: span(0, 1.1, 0), around: 1, least: 0 },
};

/** The high schools' mat (NFHS Rule 2-1): a wrestling area of at least 28 feet, a safety mat of about 5 feet round it, a 10 foot circle (optional from 2024-25) and the two starting lines of 1 inch, 3 feet long and 12 inches outside to outside, closed by a green and a red line. */
export const NFHS_MAT: WrestlingFigures = {
  kind: "wrestling",
  circle: span(28 * FT, 42 * FT, 28 * FT),
  border: span(5 * FT, 10 * FT, 5 * FT),
  passivity: 0,
  rim: 2 * IN,
  centre: { diameter: 10 * FT, band: 2 * IN },
  lines: { length: 3 * FT, width: 1 * IN, apart: 10 * IN },
  platform: { height: span(0, 1.1, 0), around: 1, least: 0 },
};

/** The wrestling leagues: the UWW's first. */
export const WRESTLING_LEAGUES: readonly WrestlingLeague[] = [
  { id: "uww", family: "wrestling", name: { en: "Wrestling mat, UWW (freestyle and Greco-Roman)", ja: "レスリングのマット（UWW：フリースタイルとグレコローマン）" }, unit: "m", dimensions: UWW_MAT, sources: ["uww-wrestling-rules"], builtIn: true },
  { id: "ncaa-wrestling", family: "wrestling", name: { en: "Wrestling mat, NCAA folkstyle", ja: "レスリングのマット（NCAA：フォークスタイル）" }, unit: "ft", figuresUnit: "m", dimensions: NCAA_MAT, sources: ["ncaa-wrestling"] },
  { id: "nfhs-wrestling", family: "wrestling", name: { en: "Wrestling mat, high school folkstyle (NFHS)", ja: "レスリングのマット（NFHS：アメリカの高校のフォークスタイル）" }, unit: "ft", figuresUnit: "m", dimensions: NFHS_MAT, sources: ["nfhs-wrestling-mat", "ncaa-wrestling"] },
];

/** The figures of a combat league. */
export type CombatFigures = MmaFigures | BoxingFigures | WrestlingFigures;

/** A league with a combat surface of its own. */
export type CombatLeague = MmaLeague | BoxingLeague | WrestlingLeague;

/** Every combat league, once each. */
export const COMBAT_LEAGUES: readonly CombatLeague[] = Object.freeze([...MMA_LEAGUES, ...BOXING_LEAGUES, ...WRESTLING_LEAGUES]);
