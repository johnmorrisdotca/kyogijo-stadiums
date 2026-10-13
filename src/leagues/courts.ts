// The net sports' courts: tennis (ITF), volleyball and beach volleyball (FIVB), badminton (BWF), pickleball (USA Pickleball) and table tennis (ITTF).
// Every figure is the rulebook's, in the unit it prints first (feet for the ITF's and USA Pickleball's rules, metres for the rest); docs/sources.md says
// which rule. The lengths of a court are measured, as each rulebook measures them, to the outside edge of its lines.
import type { Unit } from "../units.ts";
import { inFeet, type LeagueBase } from "./types.ts";

/** The ground round a court that a rulebook gives a figure for: beside the sidelines and behind the end lines. `null` when it gives none. */
export type FreeZone = { side: number; end: number } | null;

/** The two figures a rulebook can give for the ground round its court: what it asks of its own competitions, and the least it allows or recommends. */
export interface FreeZones {
  official: FreeZone;
  least: FreeZone;
}

/**
 * A tennis court, from Rule 1 of the ITF's Rules of Tennis and its Appendix X. Feet, as the ITF prints them first.
 */
export interface TennisFigures {
  /** Baseline to baseline, to the outside of the lines. */
  length: number;
  /** The singles court's width, and the doubles court's. */
  widthSingles: number;
  widthDoubles: number;
  /** The service lines: each is this far from the net, to its outside edge. */
  serviceLine: number;
  /** The width of the lines: 1 to 2 inches (the greatest is drawn); a baseline may be up to 4 inches. */
  lineWidth: number;
  baselineWidthMax: number;
  /** The centre mark: 4 inches long, 2 inches wide, drawn inside the court from the baseline. The centre service line is 2 inches wide. */
  centreMark: { length: number; width: number };
  centreServiceWidth: number;
  net: {
    /** The net's height at the posts and at the centre. */
    heightPosts: number;
    heightCentre: number;
    /** The centres of the posts are this far outside the doubles court; the centres of singles sticks this far outside the singles court. */
    postsOutside: number;
    sticksOutside: number;
    /** The posts are at most 6 inches square, the singles sticks 3 inches. */
    postSize: number;
    stickSize: number;
  };
  /** The ground behind the baselines and beside the sidelines: Appendix X's international and club guides. */
  free: FreeZones;
}

/** A volleyball or beach volleyball court, from Rules 1 and 2 of the FIVB's rules. Metres. */
export interface VolleyballFigures {
  length: number;
  width: number;
  /** All lines are 5 cm wide and drawn inside the dimensions of the court. */
  lineWidth: number;
  /** Indoors: the axis of the centre line is the middle of the court; the attack line's rear edge is this far from it. Beach volleyball has neither. */
  attackLine: number | null;
  /** The broken lines that extend each attack line outside the side lines, in the FIVB's competitions: five short lines (their number follows from the total: it is `total / (length + gap)`), their length, the gap between them (and from the side line), the total length. */
  attackExtension: { length: number; gap: number; total: number } | null;
  /** The service zone's limits: two short lines, each this long, this far behind the end line, in the side lines' extensions. Indoor only. */
  serviceMarks: { length: number; behind: number } | null;
  /** The width of the service zone: 9 m indoors, 8 m on the beach. */
  serviceZone: number;
  net: {
    /** The net's length: at most (indoors 9.50 to 10 m, on the beach 8.5 m), and its width. */
    length: number;
    width: number;
    /** The height of its top, over the middle of the court: men's and women's. */
    heightMen: number;
    heightWomen: number;
    /** The posts stand this far outside the side lines: the FIVB's competitions' figure, and the least the rules allow. */
    postsOutside: number;
    postsOutsideLeast: number;
    /** An antenna, fixed at the outer edge of each side band: its length and its diameter. */
    antenna: { length: number; diameter: number };
  };
  free: FreeZones;
}

/** A badminton court, from Law 1 of the BWF's Laws of Badminton and its Diagram A. Metres. */
export interface BadmintonFigures {
  /** Back boundary line to back boundary line, to the outside of the lines. */
  length: number;
  /** The doubles court's width. The singles sidelines are inside it. */
  width: number;
  /** The lines are 40 mm wide. */
  lineWidth: number;
  /** A singles side line's outside edge is this far inside the doubles side line's. */
  singlesInset: number;
  /** The doubles long service line: its outside edge is this far inside the back boundary line's. */
  doublesLongServiceInset: number;
  /** The short service line's edge nearer the net is this far from the net. */
  shortServiceLine: number;
  net: { postHeight: number; heightCentre: number; heightSides: number; depth: number; widthMin: number };
  free: FreeZones;
}

/** A pickleball court, from Section 3 of the USA Pickleball rulebook. Feet. */
export interface PickleballFigures {
  length: number;
  width: number;
  /** The non-volley zone: each of its lines is this far from the net, to its outside edge. */
  nonVolley: number;
  /** All lines are 2 inches wide. */
  lineWidth: number;
  net: {
    /** The net's height at the sidelines and at the centre. */
    heightSides: number;
    heightCentre: number;
    /** From the inside of one post to the inside of the other (so each stands 1 foot outside a sideline), and the greatest diameter of a post. */
    postsInside: number;
    postDiameter: number;
    /** The least length of the net. */
    lengthMin: number;
  };
  /** The playing surface round the court: the recommended 34 by 64 feet for tournaments, and the least, 30 by 60 feet. */
  free: FreeZones;
}

/** A table tennis table, from Laws 2.1 and 2.2 of the ITTF's Laws of Table Tennis. Metres. */
export interface TableTennisFigures {
  length: number;
  width: number;
  /** The height of the playing surface above the floor. */
  height: number;
  /** The white side lines and end lines are 2 cm wide, the centre line 3 mm. */
  edgeLine: number;
  centreLine: number;
  net: {
    /** The top of the net above the playing surface, and the height of the posts. */
    height: number;
    postHeight: number;
    /** The outside limits of a post are this far outside the side line. */
    postOutside: number;
  };
  free: FreeZones;
}

/** The figures of any net sport's court. */
export type NetFigures = TennisFigures | VolleyballFigures | BadmintonFigures | PickleballFigures | TableTennisFigures;

/** The sports of these courts. */
export type NetSport = "tennis" | "volleyball" | "badminton" | "pickleball" | "tabletennis";

export type TennisLeague = LeagueBase<"tennis", TennisFigures>;
export type VolleyballLeague = LeagueBase<"volleyball", VolleyballFigures>;
export type BadmintonLeague = LeagueBase<"badminton", BadmintonFigures>;
export type PickleballLeague = LeagueBase<"pickleball", PickleballFigures>;
export type TableTennisLeague = LeagueBase<"tabletennis", TableTennisFigures>;
/** A league with a net sport's court. */
export type NetLeague = TennisLeague | VolleyballLeague | BadmintonLeague | PickleballLeague | TableTennisLeague;

/** A net sport's figures in feet, from the unit its rulebook gives them in. */
export const netInFeet = <F extends NetFigures>(figures: F, unit: Unit): F => inFeet(figures, unit) as unknown as F;

const inch = (n: number): number => n / 12;

/**
 * The ITF's court, from Rule 1 of the Rules of Tennis (2026) and its Appendix X, in feet as the ITF prints them: 78 feet long, 27 feet wide for singles and
 * 36 feet for doubles; the net 3 feet 6 inches at the posts and 3 feet at the centre; the centres of the net posts 3 feet outside the doubles court and the
 * centres of singles sticks 3 feet outside the singles court; the service lines 21 feet from the net; the centre mark 4 inches long and the centre service
 * line 2 inches wide; the other lines 1 to 2 inches wide and the baselines up to 4 inches; posts at most 6 inches square, singles sticks 3. Appendix X
 * recommends 21 feet behind the baselines and 12 feet beside the sidelines for international competitions, 18 and 10 for clubs.
 */
export const ITF_TENNIS: TennisFigures = {
  length: 78,
  widthSingles: 27,
  widthDoubles: 36,
  serviceLine: 21,
  lineWidth: inch(2),
  baselineWidthMax: inch(4),
  centreMark: { length: inch(4), width: inch(2) },
  centreServiceWidth: inch(2),
  net: { heightPosts: 3.5, heightCentre: 3, postsOutside: 3, sticksOutside: 3, postSize: inch(6), stickSize: inch(3) },
  free: { official: { side: 12, end: 21 }, least: { side: 10, end: 18 } },
};

/**
 * The FIVB's indoor court, from Rules 1 and 2 of the Official Volleyball Rules 2025-2028, in metres as it prints them: 18 by 9 m inside a free zone of at least 3 m
 * (5 m beside the side lines and 6.5 m behind the end lines in the FIVB's competitions); lines 5 cm wide inside the dimensions; the attack line's rear edge 3 m
 * from the axis of the centre line and, in the FIVB's competitions, extended by five 15 cm lines 20 cm apart to 1.75 m; the service zone 9 m wide, limited by
 * two 15 cm lines 20 cm behind the end line; the net 1 m wide and 9.50 to 10 m long, 2.43 m (men) or 2.24 m (women) high; each antenna 1.80 m long and 10 mm
 * across, at the outer edge of a side band; the posts 0.50 to 1.00 m outside the side lines, 1 m in the FIVB's competitions.
 */
export const FIVB_INDOOR: VolleyballFigures = {
  length: 18,
  width: 9,
  lineWidth: 0.05,
  attackLine: 3,
  attackExtension: { length: 0.15, gap: 0.2, total: 1.75 },
  serviceMarks: { length: 0.15, behind: 0.2 },
  serviceZone: 9,
  net: { length: 10, width: 1, heightMen: 2.43, heightWomen: 2.24, postsOutside: 1, postsOutsideLeast: 0.5, antenna: { length: 1.8, diameter: 0.01 } },
  free: { official: { side: 5, end: 6.5 }, least: { side: 3, end: 3 } },
};

/**
 * The FIVB's beach court, from Rules 1 and 2 of the Official Beach Volleyball Rules 2025-2028, in metres: 16 by 8 m inside a free zone of at least 3 m (at least 5 m
 * in the FIVB's competitions); lines 5 cm wide inside the dimensions and no centre line; the service zone 8 m wide; the net 8.5 m long and 1 m wide, at the same
 * heights; the posts 0.70 to 1.00 m outside the side lines, 1 m in the FIVB's competitions.
 */
export const FIVB_BEACH: VolleyballFigures = {
  length: 16,
  width: 8,
  lineWidth: 0.05,
  attackLine: null,
  attackExtension: null,
  serviceMarks: null,
  serviceZone: 8,
  net: { length: 8.5, width: 1, heightMen: 2.43, heightWomen: 2.24, postsOutside: 1, postsOutsideLeast: 0.7, antenna: { length: 1.8, diameter: 0.01 } },
  free: { official: { side: 5, end: 5 }, least: { side: 3, end: 3 } },
};

/**
 * The BWF's court, from Law 1 of the Laws of Badminton (as amended 26 April 2025) and its Diagram A, in metres: 13.40 by 6.10 m, lines 40 mm wide; the singles
 * side lines 460 mm inside the doubles side lines (so 5.18 m apart, outside to outside); the short service lines 1.98 m from the net; the doubles long service
 * lines 760 mm inside the back boundary lines; the net 1.524 m high at the centre and 1.55 m over the doubles side lines, 760 mm deep and at least 6.1 m
 * wide; the posts 1.55 m high, on the doubles side lines.
 */
export const BWF_BADMINTON: BadmintonFigures = {
  length: 13.4,
  width: 6.1,
  lineWidth: 0.04,
  singlesInset: 0.46,
  doublesLongServiceInset: 0.76,
  shortServiceLine: 1.98,
  net: { postHeight: 1.55, heightCentre: 1.524, heightSides: 1.55, depth: 0.76, widthMin: 6.1 },
  free: { official: null, least: null },
};

/**
 * USA Pickleball's court, from Section 3 of the 2026 rulebook, in feet as it prints them: 20 by 44 feet to the outside edge of the lines (3.A.1, 3.A.2); the
 * non-volley zone 7 feet from the net (3.A.4.c); all lines 2 inches wide (3.A.4.e); the posts 22 feet apart, inside to inside, and at most 3 inches across
 * (3.B.2); the net at least 21 feet 9 inches long (3.B.3), 36 inches high at the sidelines (3.B.6) and 34 inches at the centre (3.B.7); a playing surface of at least
 * 30 by 60 feet, 34 by 64 feet recommended for tournaments (3.A.3).
 */
export const USAP_PICKLEBALL: PickleballFigures = {
  length: 44,
  width: 20,
  nonVolley: 7,
  lineWidth: inch(2),
  net: { heightSides: 3, heightCentre: 34 / 12, postsInside: 22, postDiameter: inch(3), lengthMin: 21 + 9 / 12 },
  free: { official: { side: 7, end: 10 }, least: { side: 5, end: 8 } },
};

/**
 * The ITTF's table, from Laws 2.1 and 2.2 of the Laws of Table Tennis (the 2026 statutes), in metres: 2.74 by 1.525 m and 76 cm above the floor; a white side line
 * and end line 2 cm wide, a white centre line 3 mm wide; the net 15.25 cm above the playing surface, hung from posts 15.25 cm high whose outside limits are 15.25 cm
 * outside the side lines.
 */
export const ITTF_TABLE: TableTennisFigures = {
  length: 2.74,
  width: 1.525,
  height: 0.76,
  edgeLine: 0.02,
  centreLine: 0.003,
  net: { height: 0.1525, postHeight: 0.1525, postOutside: 0.1525 },
  free: { official: null, least: null },
};

/** The tennis leagues: the ITF's. The ATP and the WTA play by the ITF's rules. */
export const TENNIS_LEAGUES: readonly TennisLeague[] = [{ id: "itf", family: "tennis", name: { en: "ITF tennis court", ja: "ITFのテニスコート" }, unit: "ft", dimensions: ITF_TENNIS, sources: ["itf-rules"], builtIn: true }];

/** The volleyball leagues: the FIVB's indoor court, and its beach court. */
export const VOLLEYBALL_LEAGUES: readonly VolleyballLeague[] = [
  { id: "fivb", family: "volleyball", name: { en: "FIVB volleyball court", ja: "FIVBのバレーボールコート" }, unit: "m", dimensions: FIVB_INDOOR, sources: ["fivb-volleyball"], builtIn: true },
  { id: "fivb-beach", family: "volleyball", name: { en: "FIVB beach volleyball court", ja: "FIVBのビーチバレーボールコート" }, unit: "m", dimensions: FIVB_BEACH, sources: ["fivb-beach"] },
];

/** The badminton leagues: the BWF's. */
export const BADMINTON_LEAGUES: readonly BadmintonLeague[] = [{ id: "bwf", family: "badminton", name: { en: "BWF badminton court", ja: "BWFのバドミントンコート" }, unit: "m", dimensions: BWF_BADMINTON, sources: ["bwf-laws"], builtIn: true }];

/** The pickleball leagues: USA Pickleball's. */
export const PICKLEBALL_LEAGUES: readonly PickleballLeague[] = [{ id: "usap", family: "pickleball", name: { en: "USA Pickleball court", ja: "USA Pickleballのコート" }, unit: "ft", dimensions: USAP_PICKLEBALL, sources: ["usap-rulebook"], builtIn: true }];

/** The table tennis leagues: the ITTF's. */
export const TABLE_TENNIS_LEAGUES: readonly TableTennisLeague[] = [{ id: "ittf", family: "tabletennis", name: { en: "ITTF table", ja: "ITTFの卓球台" }, unit: "m", dimensions: ITTF_TABLE, sources: ["ittf-laws"], builtIn: true }];
