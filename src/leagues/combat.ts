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

/** The figures of a combat league. */
export type CombatFigures = MmaFigures;

/** A league with a combat surface of its own. */
export type CombatLeague = MmaLeague;

/** Every combat league, once each. */
export const COMBAT_LEAGUES: readonly CombatLeague[] = Object.freeze([...MMA_LEAGUES]);
