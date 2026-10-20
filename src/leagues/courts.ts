// The net sports' courts: tennis (ITF), volleyball and beach volleyball (FIVB), sitting volleyball (World ParaVolley), badminton (BWF), pickleball (USA Pickleball),
// table tennis (ITTF), padel (FIP), squash (World Squash), racquetball (IRF), sepak takraw (ISTAF), teqball (FITEQ) and roundnet (the International Roundnet Federation),
// and, drawn the same way though it has no net, netball (World Netball). Every figure is the rulebook's, in the unit it prints first (feet for the ITF's, USA
// Pickleball's and the IRF's racquetball rules, metres for the rest); docs/sources.md says which rule. The lengths of a court are measured, as each rulebook
// measures them, to the outside edge of its lines.
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
  /**
   * The playing space of each kind of event (the ITTF's Regulations for International Competitions, 3.2.3.1): a cuboid of at least 14 m by 7 m by 5 m; for wheelchair events it may be reduced to
   * 8 m by 6 m, and for Masters events to 10 m by 5 m. The height is the cuboid's, which no reduction touches.
   */
  space: { standard: PlayingSpace; masters: PlayingSpace; wheelchair: PlayingSpace };
  /** The surrounds that enclose the playing area: 50 cm to 100 cm high, all of one dark colour, the corners may be left open (3.2.3.3); `drawn` is the height drawn and `thickness` the board's, both ours within the rule. */
  surround: { least: number; greatest: number; drawn: number; thickness: number };
  /** The umpires' chairs and table, part of the playing area (3.2.3.2). The umpire sits or stands in line with the net, the assistant umpire directly facing him or her at the other side of the table (3.3.2.2); the sizes and the distance from the table are ours. */
  umpires: { chair: number; desk: { length: number; width: number }; away: number };
  /** The playing area is `standard` for the international events, `masters` the least a Masters event allows (the least for any event but a wheelchair one). The `official` zone is the standard space and the `least` the Masters one. */
  free: FreeZones;
}

/** A playing space: the cuboid's length, width and height. */
export interface PlayingSpace {
  length: number;
  width: number;
  height: number;
}

/**
 * A padel court, from "The court" in the FIP's Rules of Padel (review of application 1 January 2026). Metres. The court is measured inside its walls, so it has
 * no lines round it: the enclosure is its boundary.
 */
export interface PadelFigures {
  /** Interior length and width (a 0.5% tolerance). */
  length: number;
  width: number;
  /** All lines are 5 cm wide. */
  lineWidth: number;
  /** The service lines are this far from the net, on either side. */
  serviceLine: number;
  /** The central service line runs from the net and extends at least this far beyond the service line. */
  centreOverrun: number;
  net: {
    /** The net's length, its height at the centre and at the ends, and the greatest height of a post. */
    length: number;
    heightCentre: number;
    heightEnds: number;
    postHeight: number;
  };
  /** The enclosure: the end walls and, at each end of each side, a wall this long, with metal mesh between; the walls' heights. */
  enclosure: { sideWall: number; endHeight: number; endWall: number; sideHeight: number };
  free: FreeZones;
}

/**
 * A squash court, from the World Squash Federation's Specifications for Squash Courts (28 November 2017), clauses 4 and 5 and Appendices 1 and 2. Metres. The
 * court is measured between the playing surfaces of its walls, so it has no lines round it; the front wall's lines are heights.
 */
export interface SquashFigures {
  length: number;
  width: number;
  /** All court markings are 50 mm wide. */
  lineWidth: number;
  /** The nearest edge of the short line is this far from the back wall. */
  shortLine: number;
  /** A service box is a square of this many metres inside its lines. */
  serviceBox: number;
  /** Heights on the walls: to the top of the tin, to the lower edge of the service line and of the front wall line, and of the back wall line. */
  wall: { tin: number; serviceLine: number; frontWallLine: number; backWallLine: number };
  free: FreeZones;
}

/**
 * A racquetball court, from Rule 2.1 of the International Racquetball Federation's Official Rules 2026-2028 and its Court Specifications (2025). Feet.
 */
export interface RacquetballFigures {
  length: number;
  width: number;
  /** The lines are 1 to 1 1/2 inches wide: 1 1/2 inches is the recommended width. */
  lineWidth: number;
  /** The back edge of the short line is this far from the back wall (midway between the walls). */
  shortLine: number;
  /** The front edge of the service line is this far in front of the short line's back edge. */
  serviceLine: number;
  /** The edge of a service box's line nearest the centre is this far from the side wall; so is a drive serve line's, at its own figure. */
  serviceBox: number;
  driveServe: number;
  /** The receiving line's back edge is this far behind the short line's back edge; the broken line's end segment, a segment and a space. */
  receiving: { behind: number; end: number; dash: number; gap: number };
  /** The upper edge of the out-of-court line on the back wall, and the least height of the back wall. */
  backWall: { outOfCourt: number; least: number };
  /** The height of the court (a ceiling). */
  height: number;
  free: FreeZones;
}

/** A sepak takraw court, from Laws 1 to 3 of the ISTAF's Law of the Game (2013). Metres. */
export interface SepakTakrawFigures {
  length: number;
  width: number;
  /** The boundary lines are at most this wide, drawn inwards; the service circle's is the same. */
  lineWidth: number;
  /** The centre line, under the net. */
  centreLine: number;
  /** The quarter circles at the ends of the centre line: their radius. */
  quarterCircle: number;
  /** The service circles: their radius, and their centre's distance from the back line and from the sidelines. */
  serviceCircle: { radius: number; fromBack: number; fromSide: number };
  net: {
    /** The least length, the width, the height at the centre for men and for women, and the height at the posts for men and for women. */
    length: number;
    width: number;
    heightMen: number;
    heightWomen: number;
    postMen: number;
    postWomen: number;
    /** The posts stand this far from the sidelines, in line with the centre line; at most this far across (in radius). */
    postsOutside: number;
    postRadius: number;
  };
  free: FreeZones;
}

/** A teqball court and table, from sections 1 and 2 of the FITEQ's Official Rules and Regulations of Teqball (2026). Metres. */
export interface TeqballFigures {
  /** The least court: the sides parallel to the net are `width` long, the other two `length`. */
  length: number;
  width: number;
  table: {
    /** The table's length, its width without the net and with it, and its height with the net. */
    length: number;
    width: number;
    widthWithNet: number;
    height: number;
  };
  /** The net: its width, thickness and height above the table. */
  net: { width: number; thickness: number; height: number };
  /** The halfway line and the service line are 20 to 50 mm wide: the greatest. */
  lineWidth: number;
  /** The service line is this far from the middle of the table, parallel to the net. */
  serviceLine: number;
  /** The court surrounds: the least and the greatest height. */
  surround: { least: number; most: number };
  free: FreeZones;
}

/** A roundnet court, from Chapter 1 of the International Roundnet Federation's Rules (adopted 21 October 2022). Metres. */
export interface RoundnetFigures {
  /** The recommended least court; there are no out of bounds. */
  length: number;
  width: number;
  /** The set: its diameter and its height. */
  set: { diameter: number; height: number };
  /** The serving line is a circle this far from the centre of the set; the no hit zone line, another. */
  servingRadius: number;
  noHitRadius: number;
  /** The distance from the edge of the set to the service line, as the rule also states it. */
  edgeToService: number;
  /** The rules give no width for these lines: ours. */
  lineWidth: number;
  free: FreeZones;
}

/** A netball court, from Rule 1 of World Netball's Rules of Netball (2024 edition). Metres. */
export interface NetballFigures {
  /** The side lines' length, and the goal lines'. */
  length: number;
  width: number;
  /** All lines are 50 mm wide. */
  lineWidth: number;
  /** The centre circle's diameter, and the goal circle's radius (a semicircle centred on the middle of the outside of the goal line). */
  centreCircle: number;
  goalCircle: number;
  /** A goalpost's height, the greatest diameter of its pole, and its ring: the inside diameter, the rod's diameter, and the length of the bar that carries it forward from the pole. */
  post: { height: number; poleDiameter: number; ring: { inside: number; rod: number; bar: number } };
  free: FreeZones;
}

/** The figures of any net sport's court. */
export type NetFigures = TennisFigures | VolleyballFigures | BadmintonFigures | PickleballFigures | TableTennisFigures | PadelFigures | SquashFigures | RacquetballFigures | SepakTakrawFigures | TeqballFigures | RoundnetFigures | NetballFigures;

/** The sports of these courts. */
export type NetSport = "tennis" | "volleyball" | "badminton" | "pickleball" | "tabletennis" | "padel" | "squash" | "racquetball" | "sepaktakraw" | "teqball" | "roundnet" | "netball";

export type TennisLeague = LeagueBase<"tennis", TennisFigures>;
export type VolleyballLeague = LeagueBase<"volleyball", VolleyballFigures>;
export type BadmintonLeague = LeagueBase<"badminton", BadmintonFigures>;
export type PickleballLeague = LeagueBase<"pickleball", PickleballFigures>;
export type TableTennisLeague = LeagueBase<"tabletennis", TableTennisFigures>;
export type PadelLeague = LeagueBase<"padel", PadelFigures>;
export type SquashLeague = LeagueBase<"squash", SquashFigures>;
export type RacquetballLeague = LeagueBase<"racquetball", RacquetballFigures>;
export type SepakTakrawLeague = LeagueBase<"sepaktakraw", SepakTakrawFigures>;
export type TeqballLeague = LeagueBase<"teqball", TeqballFigures>;
export type RoundnetLeague = LeagueBase<"roundnet", RoundnetFigures>;
export type NetballLeague = LeagueBase<"netball", NetballFigures>;
/** A league with a net sport's court. */
export type NetLeague = TennisLeague | VolleyballLeague | BadmintonLeague | PickleballLeague | TableTennisLeague | PadelLeague | SquashLeague | RacquetballLeague | SepakTakrawLeague | TeqballLeague | RoundnetLeague | NetballLeague;

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
 * outside the side lines. The playing area round it is the ITTF's Regulations for International Competitions, 3.2.3 (ITTF Statutes 2026, chapter 3): a space of 14 m by 7 m by 5 m (8 m by 6 m
 * for wheelchair events, 10 m by 5 m for Masters events), enclosed by surrounds 50 cm to 100 cm high, all of one dark colour, with the umpires' chairs and tables inside it.
 */
export const ITTF_TABLE: TableTennisFigures = {
  length: 2.74,
  width: 1.525,
  height: 0.76,
  edgeLine: 0.02,
  centreLine: 0.003,
  net: { height: 0.1525, postHeight: 0.1525, postOutside: 0.1525 },
  space: { standard: { length: 14, width: 7, height: 5 }, masters: { length: 10, width: 5, height: 5 }, wheelchair: { length: 8, width: 6, height: 5 } },
  surround: { least: 0.5, greatest: 1, drawn: 0.75, thickness: 0.05 },
  umpires: { chair: 0.5, desk: { length: 1.2, width: 0.5 }, away: 0.9 },
  // The table is centred in the space: what lies beyond its end lines and its side lines is half of what the space has over the table.
  free: { official: { side: (7 - 1.525) / 2, end: (14 - 2.74) / 2 }, least: { side: (5 - 1.525) / 2, end: (10 - 2.74) / 2 } },
};

/**
 * The World ParaVolley's sitting volleyball court, from Rules 1 and 2 of the Official Sitting Volleyball Rules 2025-2028, in metres: 10 by 6 m inside a free zone of
 * at least 3 m (4 m beside the side lines and 6 m behind the end lines in World ParaVolley, World and Official Competitions); lines 5 cm wide inside the dimensions;
 * the attack line's rear edge 2 m from the axis of the centre line and, in those competitions, extended by five 15 cm lines 20 cm apart to 1.75 m; the service zone 6 m
 * wide, limited by two 15 cm lines 20 cm behind the end line; the net 0.80 m wide and 6.5 to 7 m long, 1.15 m (men) or 1.05 m (women) high; each antenna 1.60 m long and
 * 10 mm across; the posts 0.5 to 1.0 m outside the side lines, 1 m in those competitions.
 */
export const WPV_SITTING: VolleyballFigures = {
  length: 10,
  width: 6,
  lineWidth: 0.05,
  attackLine: 2,
  attackExtension: { length: 0.15, gap: 0.2, total: 1.75 },
  serviceMarks: { length: 0.15, behind: 0.2 },
  serviceZone: 6,
  net: { length: 7, width: 0.8, heightMen: 1.15, heightWomen: 1.05, postsOutside: 1, postsOutsideLeast: 0.5, antenna: { length: 1.6, diameter: 0.01 } },
  free: { official: { side: 4, end: 6 }, least: { side: 3, end: 3 } },
};

/**
 * The FIP's padel court, from "The court" (dimensions, net, enclosures) in the Rules of Padel (review of application 1 January 2026), in metres: 10 by 20 m inside
 * the walls; the service lines 6.95 m from the net on either side, the central service line between the net and each, extending at least 20 cm beyond it; lines 5 cm
 * wide; the net 10 m long, 0.88 m high at the centre and 0.92 m at the ends, on posts at most 1.05 m high whose outer side is the side limit of the court; the court
 * enclosed, the end walls 4 m high (3 m of wall and 1 m of metal fence) and each side wall, at both ends, 4 m long and 3 m high with metal fence between.
 */
export const FIP_PADEL: PadelFigures = {
  length: 20,
  width: 10,
  lineWidth: 0.05,
  serviceLine: 6.95,
  centreOverrun: 0.2,
  net: { length: 10, heightCentre: 0.88, heightEnds: 0.92, postHeight: 1.05 },
  enclosure: { sideWall: 4, endHeight: 4, endWall: 3, sideHeight: 3 },
  free: { official: null, least: null },
};

/**
 * World Squash's singles court, from clauses 4.01 and 5 and Appendix 1 of its Specifications for Squash Courts (28 November 2017), in metres: 9.75 by 6.40 m between the
 * playing surfaces; markings 50 mm wide; the nearest edge of the short line 4.26 m from the back wall; each service box a square of 1.60 m inside its lines; on the
 * front wall the top of the tin 480 mm up, the lower edge of the service line 1.78 m and of the front wall line 4.57 m, and on the back wall the back wall line 2.13 m.
 */
export const WSF_SQUASH: SquashFigures = {
  length: 9.75,
  width: 6.4,
  lineWidth: 0.05,
  shortLine: 4.26,
  serviceBox: 1.6,
  wall: { tin: 0.48, serviceLine: 1.78, frontWallLine: 4.57, backWallLine: 2.13 },
  free: { official: null, least: null },
};

/** World Squash's doubles court (Appendix 2, clause 4.02): 7.62 m wide, the rest as the singles court. */
export const WSF_SQUASH_DOUBLES: SquashFigures = { ...WSF_SQUASH, width: 7.62 };

/** World Squash's international competition width doubles court (Appendix 2 note 8, clause 4.03): 8.42 m wide, with the top of the tin 330 mm up, for WSF recognised World and Regional events and the Commonwealth Games. */
export const WSF_SQUASH_WIDE: SquashFigures = { ...WSF_SQUASH, width: 8.42, wall: { ...WSF_SQUASH.wall, tin: 0.33 } };

/**
 * The IRF's racquetball court, from Rule 2.1 of the Official Rules 2026-2028 and Section Three of the Court Specifications (2025), in feet as they are printed: 20 feet
 * wide, 40 feet long and 20 feet high; lines 1 to 1 1/2 inches wide (1 1/2 inches, bright red, recommended); the back edge of the short line 20 feet from the back wall;
 * the front edge of the service line 5 feet in front of the short line's back edge; a service box's line 18 inches from the side wall and a drive serve line 3 feet from
 * it (to the edge nearest the centre); the receiving line's back edge 5 feet behind the short line's back edge, a broken line of two 21 inch ends and sixteen 6 inch
 * lines between 6 inch spaces; the back wall at least 12 feet high, with the out-of-court line's upper edge at 12 feet.
 */
export const IRF_RACQUETBALL: RacquetballFigures = {
  length: 40,
  width: 20,
  lineWidth: inch(1.5),
  shortLine: 20,
  serviceLine: 5,
  serviceBox: 1.5,
  driveServe: 3,
  receiving: { behind: 5, end: inch(21), dash: inch(6), gap: inch(6) },
  backWall: { outOfCourt: 12, least: 12 },
  height: 20,
  free: { official: null, least: null },
};

/**
 * The ISTAF's court, from Laws 1 to 3 of the Law of the Game (2013, dated 9 December 2013), in metres: 13.40 by 6.10 m; the boundary lines at most 0.04 m wide, drawn
 * inwards; a centre line 0.02 m wide; a quarter circle of 0.9 m radius at each end of the centre line; a service circle of 0.3 m radius on each side, its centre 2.45 m
 * from the back line and 3.05 m from the sidelines, its line 0.04 m wide; a free zone of 3.0 m; the posts 0.3 m outside the sidelines, in line with the centre line,
 * 1.55 m (men) or 1.45 m (women) high; the net 0.7 m wide and at least 6.1 m long, 1.52 m (men) or 1.42 m (women) high at the centre.
 */
export const ISTAF_SEPAK_TAKRAW: SepakTakrawFigures = {
  length: 13.4,
  width: 6.1,
  lineWidth: 0.04,
  centreLine: 0.02,
  quarterCircle: 0.9,
  serviceCircle: { radius: 0.3, fromBack: 2.45, fromSide: 3.05 },
  net: { length: 6.1, width: 0.7, heightMen: 1.52, heightWomen: 1.42, postMen: 1.55, postWomen: 1.45, postsOutside: 0.3, postRadius: 0.04 },
  free: { official: { side: 3, end: 3 }, least: { side: 3, end: 3 } },
};

/**
 * The FITEQ's teqball court and table, from sections 1 and 2 of the Official Rules and Regulations of Teqball (2026), in metres: a table 3,000 mm long and 1,500 mm
 * wide (1,700 mm with the net), 900 mm high with the net; a net 1,700 mm wide, 20 mm thick and 140 mm high; the table in the exact middle of a court of at least 12 m
 * (the sides parallel to the net) by 16 m, the net parallel to the shorter sides; the halfway line across the middle, and a service line on each side 3.5 m from the
 * middle of the table, each 20 to 50 mm wide; court surrounds 500 to 1,500 mm high.
 */
export const FITEQ_TEQBALL: TeqballFigures = {
  length: 16,
  width: 12,
  table: { length: 3, width: 1.5, widthWithNet: 1.7, height: 0.9 },
  net: { width: 1.7, thickness: 0.02, height: 0.14 },
  lineWidth: 0.05,
  serviceLine: 3.5,
  surround: { least: 0.5, most: 1.5 },
  free: { official: null, least: null },
};

/**
 * The International Roundnet Federation's court, from Rules 1.1.2 and 1.2.1 to 1.2.4 (adopted 21 October 2022), in metres: a set 91.4 cm across and 20.3 cm high; a court
 * of at least 10 by 10 m (33 by 33 feet) recommended, with no out of bounds; a serving line drawn as a circle 2.6 m (8.5 feet) from the centre of the set, 2.13 m (7 feet)
 * from its edge; a no hit zone line drawn as a circle 90 cm (3 feet) from the centre; a mark at each of the four service positions, 90 degrees apart.
 */
export const IRF_ROUNDNET: RoundnetFigures = {
  length: 10,
  width: 10,
  set: { diameter: 0.914, height: 0.203 },
  servingRadius: 2.6,
  noHitRadius: 0.9,
  edgeToService: 2.13,
  lineWidth: 0.05,
  free: { official: null, least: null },
};

/**
 * World Netball's court, from Rule 1 (Technical specifications, Court and related areas, items 2 to 8, 13 and 14) of the Rules of Netball (2024 edition), in metres:
 * 30.5 m (100 feet) by 15.25 m (50 feet); two transverse lines dividing it into three equal areas; a centre circle 0.9 m (3 feet) across; at each end a goal circle, a
 * semicircle of radius 4.9 m (16 feet) centred on the middle of the outside of the goal line; lines 50 mm wide; a court surround 3.05 m (10 feet) on every side; a goalpost
 * at the middle of each goal line, its pole 65 to 100 mm across and 3.05 m high, the back of the pole at the outer edge of the goal line, with a ring of 380 mm inside
 * diameter made of 15 mm rod, on a bar 150 mm long projecting from the pole.
 */
export const WN_NETBALL: NetballFigures = {
  length: 30.5,
  width: 15.25,
  lineWidth: 0.05,
  centreCircle: 0.9,
  goalCircle: 4.9,
  post: { height: 3.05, poleDiameter: 0.1, ring: { inside: 0.38, rod: 0.015, bar: 0.15 } },
  free: { official: { side: 3.05, end: 3.05 }, least: { side: 3.05, end: 3.05 } },
};

/** The tennis leagues: the ITF's. The ATP and the WTA play by the ITF's rules. */
export const TENNIS_LEAGUES: readonly TennisLeague[] = [{ id: "itf", family: "tennis", name: { en: "ITF tennis court", ja: "ITFのテニスコート" }, unit: "ft", dimensions: ITF_TENNIS, sources: ["itf-rules"], builtIn: true }];

/** The volleyball leagues: the FIVB's indoor court, its beach court, and World ParaVolley's sitting volleyball court. */
export const VOLLEYBALL_LEAGUES: readonly VolleyballLeague[] = [
  { id: "fivb", family: "volleyball", name: { en: "FIVB volleyball court", ja: "FIVBのバレーボールコート" }, unit: "m", dimensions: FIVB_INDOOR, sources: ["fivb-volleyball"], builtIn: true },
  { id: "fivb-beach", family: "volleyball", name: { en: "FIVB beach volleyball court", ja: "FIVBのビーチバレーボールコート" }, unit: "m", dimensions: FIVB_BEACH, sources: ["fivb-beach"] },
  { id: "wpv-sitting", family: "volleyball", name: { en: "World ParaVolley sitting volleyball court", ja: "ワールドパラバレーのシッティングバレーボールコート" }, unit: "m", dimensions: WPV_SITTING, sources: ["wpv-sitting"] },
];

/** The badminton leagues: the BWF's. */
export const BADMINTON_LEAGUES: readonly BadmintonLeague[] = [{ id: "bwf", family: "badminton", name: { en: "BWF badminton court", ja: "BWFのバドミントンコート" }, unit: "m", dimensions: BWF_BADMINTON, sources: ["bwf-laws"], builtIn: true }];

/** The pickleball leagues: USA Pickleball's. */
export const PICKLEBALL_LEAGUES: readonly PickleballLeague[] = [{ id: "usap", family: "pickleball", name: { en: "USA Pickleball court", ja: "USA Pickleballのコート" }, unit: "ft", dimensions: USAP_PICKLEBALL, sources: ["usap-rulebook"], builtIn: true }];

/** The table tennis leagues: the ITTF's. */
export const TABLE_TENNIS_LEAGUES: readonly TableTennisLeague[] = [{ id: "ittf", family: "tabletennis", name: { en: "ITTF table", ja: "ITTFの卓球台" }, unit: "m", dimensions: ITTF_TABLE, sources: ["ittf-laws"], builtIn: true }];

/** The padel leagues: the FIP's. */
export const PADEL_LEAGUES: readonly PadelLeague[] = [{ id: "fip", family: "padel", name: { en: "FIP padel court", ja: "FIPのパデルコート" }, unit: "m", dimensions: FIP_PADEL, sources: ["fip-padel"], builtIn: true }];

/** The squash leagues: World Squash's singles court, its doubles court and its international competition width doubles court. */
export const SQUASH_LEAGUES: readonly SquashLeague[] = [
  { id: "wsf", family: "squash", name: { en: "World Squash singles court", ja: "ワールドスカッシュのシングルスコート" }, unit: "m", dimensions: WSF_SQUASH, sources: ["wsf-court-specs", "wsf-singles-rules"], builtIn: true },
  { id: "wsf-doubles", family: "squash", name: { en: "World Squash doubles court", ja: "ワールドスカッシュのダブルスコート" }, unit: "m", dimensions: WSF_SQUASH_DOUBLES, sources: ["wsf-court-specs"] },
  { id: "wsf-doubles-wide", family: "squash", name: { en: "World Squash international competition width doubles court", ja: "ワールドスカッシュの国際大会規格のダブルスコート" }, unit: "m", dimensions: WSF_SQUASH_WIDE, sources: ["wsf-court-specs"] },
];

/** The racquetball leagues: the IRF's. */
export const RACQUETBALL_LEAGUES: readonly RacquetballLeague[] = [{ id: "irf", family: "racquetball", name: { en: "IRF racquetball court", ja: "IRFのラケットボールコート" }, unit: "ft", dimensions: IRF_RACQUETBALL, sources: ["irf-racquetball-rules", "irf-racquetball-courts"], builtIn: true }];

/** The sepak takraw leagues: the ISTAF's. */
export const SEPAK_TAKRAW_LEAGUES: readonly SepakTakrawLeague[] = [{ id: "istaf", family: "sepaktakraw", name: { en: "ISTAF sepak takraw court", ja: "ISTAFのセパタクローコート" }, unit: "m", dimensions: ISTAF_SEPAK_TAKRAW, sources: ["istaf-law"], builtIn: true }];

/** The teqball leagues: the FITEQ's. */
export const TEQBALL_LEAGUES: readonly TeqballLeague[] = [{ id: "fiteq", family: "teqball", name: { en: "FITEQ teqball court", ja: "FITEQのテックボールコート" }, unit: "m", dimensions: FITEQ_TEQBALL, sources: ["fiteq-rules"], builtIn: true }];

/** The roundnet leagues: the International Roundnet Federation's. */
export const ROUNDNET_LEAGUES: readonly RoundnetLeague[] = [{ id: "irf-roundnet", family: "roundnet", name: { en: "International Roundnet Federation court", ja: "国際ラウンドネット連盟のコート" }, unit: "m", dimensions: IRF_ROUNDNET, sources: ["roundnet-rules"], builtIn: true }];

/** The netball leagues: World Netball's. */
export const NETBALL_LEAGUES: readonly NetballLeague[] = [{ id: "wn", family: "netball", name: { en: "World Netball court", ja: "ワールドネットボールのコート" }, unit: "m", dimensions: WN_NETBALL, sources: ["world-netball-rules"], builtIn: true }];
