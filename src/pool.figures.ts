// The pools of the aquatic sports, from World Aquatics' Competition Regulations (in force as from February 2026), in metres, the unit the rules print them in. A rule
// is cited by its part and its number in that edition (Part Two, Swimming Rules, Article 15 for the swimming pool; Part Four, Article 15 and Appendix 2 for diving;
// Part Six, Articles 20 and 21 for water polo; Part Seven, Article 12 for artistic swimming): "Part Two 15.6.2.1" is clause 15.6.2.1 of Part Two. The part is always
// named, because Parts Two and Four both have an Article 15. The numbers changed from the edition in force as from 25 June 2025 (Part Two Article 16, Part Four
// Article 13, Part Six Article 18 and Appendix 4, Part Seven Article 27); a figure that is that edition's and that the February 2026 text does not repeat is marked "June 2025
// edition value" and says what the new text gives. The same rules were the Facilities Rules FR 2 to FR 8 of the 2017-2021 and 2021-2025 editions; the old number is given where a reader of
// those editions would look for it ("was FR 2.9"). The diagrams of the rules (the appendices) are pictures and were not read: nothing here is measured from one. Where the rules
// give no figure and the drawing needs one, the figure is named `drawn` and is ours.

/**
 * The swimming pool (Part Two, Article 15). Lengths are metres; widths run across the course and depths down. `lane` is the width of a lane and the distance between the centres of two (Part Two 15.13.2,
 * 15.6.1); a 10-lane pool for the World Championships has lanes 0 and 9 2.4 m wide with spaces of 0.1 m outside them in a permanent pool (Part Two 15.6.2.1), or all lanes 2.5 m
 * with spaces of 0.5 m (a 26 m wide temporary pool, Part Two 15.6.2.2).
 */
export const SWIMMING = {
  /** The lengths between the touch panels: 50.000 m and 25.000 m (Part Two 15.1.1.1 and 15.1.2.1, was FR 2.1.1 and FR 2.1.2; June 2025: CR 16.1.1.1 and 16.1.1.2). */
  longCourse: 50,
  shortCourse: 25,
  /** A lane is at least 2.5 m wide (Part Two 15.6.3, was FR 2.5; June 2025: CR 16.1.6); the first and the last may be 2.4 m wide, in the World Championships' permanent pool (Part Two 15.6.2.1) and at all other competitions (15.6.3). */
  lane: 2.5,
  edgeLane: 2.4,
  /** The spaces outside the first and the last lane: Olympic Games, 2.5 m each side (Part Two 15.6.1); World Championships' permanent pool 0.1 m (15.6.2.1), temporary pool 0.5 m (15.6.2.2). */
  spaceOlympic: 2.5,
  spacePermanentWorld: 0.1,
  spaceTemporaryWorld: 0.5,
  /** The space of a pool of the minimum standard: the 25 by 21 m, 8-lane pool of Appendix 6 of Part Two (Article 17.6) is 8 lanes of 2.5 m and two spaces, which makes the spaces 0.5 m (arithmetic, not a stated figure). */
  spaceMinimum: 0.5,
  /** Lane ropes: floats end to end, "between 0.1 metres (at maximum) and 0.15 metres (at minimum)" across (Part Two 15.7.4: unverified, the sentence contradicts itself; June 2025 edition value: 0.10 to 0.15 m, 0.15 m at the Olympic Games and the World Championships, CR 16.1.7.1 and 16.2.7.1; 0.15 m is drawn). */
  floatDiameter: 0.15,
  /** The floats within 5.0 m of each end wall are red (Part Two 15.7.7); those at 15 m from each end wall, and at 25 m in a 50 m pool, are distinct in colour (Part Two 15.7.9 and 15.7.10). */
  redEnds: 5,
  markAt15: 15,
  markAt25: 25,
  /** How long a run of floats of a distinct colour is drawn: the rules do not say, a run of four floats is ours (drawn). */
  markRun: 0.6,
  /** Lane markings on the floor: 0.2 to 0.3 m wide, 46.0 m long in a 50 m pool and 21.0 m in a 25 m one, ending 2.0 m from the end wall in a cross line 1.0 m long (Part Two 15.13.1 and 15.13.2, was FR 2.14; June 2025: CR 16.2.15). */
  laneLine: { width: 0.25, longLength: 46, shortLength: 21, endGap: 2, cross: 1 },
  /** Target lines on the end walls: the width of the lane line, down the wall to 3 m at most, with a cross line 0.5 m long 0.3 m below the water (Part Two 15.13.3); cross lines 0.5 m long at 15 m from each end (Part Two 15.13.4, pools built from 1 January 2006). */
  target: { width: 0.25, maxDepth: 3, cross: 0.5, crossBelowSurface: 0.3, crossAt15: 0.5 },
  /** The starting platform: at least 0.5 m by 0.5 m, 0.5 to 0.75 m above the water (Part Two 15.8.1). The length 0.6 m is the June 2025 edition value (0.5 by 0.6 m at the Olympic Games and the World Championships, CR 16.2.8); February 2026 says at least 0.5 by 0.5 m everywhere. */
  block: { width: 0.5, length: 0.6, heightLeast: 0.5, heightMost: 0.75, height: 0.7 },
  /** Touch panels: 2.4 m wide and 0.9 m high, 0.3 m above the water and 0.6 m below it, with a 0.025 m black border (Part Two 15.16.4.1, 15.16.4.2 and 15.16.4.5; June 2025: CR 16.3.4). */
  pad: { width: 2.4, height: 0.9, above: 0.3, below: 0.6, border: 0.025 },
  /** Backstroke turn flags: flagged ropes 1.8 m above the water on standards 5.0 m from each end wall; a flag is a triangle of 0.40 m sides, 0.25 m apart (Part Two 15.9.1 and 15.9.2, was FR 2.9; June 2025: CR 16.1.10). */
  flags: { at: 5, height: 1.8, side: 0.4, apart: 0.25 },
  /** The false start rope: not less than 1.2 m above the water, on standards 15.0 m in front of the starting end (was FR 2.11; June 2025 edition value, CR 16.1.12). Unverified: the February 2026 text has no clause for it (Part Two Article 15 has false start detection equipment, 15.16.3.4, and no rope). */
  falseStart: { at: 15, height: 1.2 },
  /** Depth: 1.35 m from 1.0 to at least 6.0 m from an end wall that has starting platforms, 1.0 m elsewhere (Part Two 15.4.3 and 15.8.4; June 2025: CR 16.1.4); the Olympic Games and the World Championships 2.5 m (15.4.1), the 25 m World Championships 2.0 m (2.5 m preferred, 15.4.2); a pool shared with artistic swimming 3 m is the June 2025 edition value (CR 16.2.4) and unverified: Part Two Article 15.4 no longer says it (Part Seven 12.1.1 and 12.2.2 ask 3.0 m for the artistic swimming area). */
  depth: { least: 1, atBlocks: 1.35, blocksFrom: 1, blocksTo: 6, olympic: 2.5, shortWorld: 2, shared: 3 },
  /** The wall: a slip-resistant surface 0.8 m below the water (Part Two 15.5.1); a rest ledge not less than 1.2 m below the surface, 0.1 to 0.15 m wide (Part Two 15.5.2). */
  wall: { slipResistant: 0.8, ledgeDepth: 1.2 },
  /** The distance between a swimming pool and a diving well in the same area: 8 m, 10 m preferred, in pools built from 1 January 2014 (Part Two 15.15.1; June 2025: CR 16.2.17). */
  poolsApart: 8,
  poolsApartPreferred: 10,
  /** The deck beyond the pool, our figure: the rules do not set one (drawn). */
  deck: 2.5,
} as const;

/** The widths of the pools the rules draw, as Appendices 1 to 9 of Part Two (Article 17) name them (the pool's width by its length and lanes): 50 by 25 (8 or 10 lanes), 50 by 26 (10 lanes, temporary), 25 by 21 (8), 25 by 25 and 25 by 26 (10). */
export const SWIMMING_WIDTHS = { permanent: 25, temporary: 26, shortEight: 21 } as const;

/**
 * The water polo field of play, in metres (Part Six, Articles 20 and 21). The field is 25.00 by 20.00 m, the distance between the two goal lines and between the two side lines (Part Six 20.2.2.1 and 20.2.2.2);
 * the water at least 2.00 m deep everywhere (Part Six 20.2.4 and 20.8.2.1). `depth` 1.8 m is the June 2025 edition value (1.80 m, 2.00 m at the Olympic Games and the World Championships, CR 18.1.3 and 18.2.2);
 * February 2026 says 2.00 m.
 */
export const WATER_POLO = {
  length: 25,
  width: 20,
  depth: 1.8,
  depthOlympic: 2,
  /** The marks on both sides of the field: white for the goal line and the half distance line, red 2 m from each goal line, yellow 6 m from it, and a red mark 5 m from it for the penalty throw (Part Six 21.7.1.1 to 21.7.1.5; June 2025: Appendix 4, 20.4.1.5). */
  twoMetre: 2,
  fiveMetre: 5,
  sixMetre: 6,
  /** The sides of the field are marked red from the goal line to 2 m, yellow from 2 to 6 m and green from 6 m to the half distance line, which is white (Part Six 21.7.2.2 and 21.7.1.5; June 2025: Appendix 4, 20.4.1.5 and CR 18.3.1). */
  half: 12.5,
  /** Boundary lines 2 m long from the goal posts, marked red, make the goal areas (Part Six 20.4 and 21.7.2.1.2; June 2025: Appendix 4, 20.4.1.2). */
  goalAreaLine: 2,
  /** The goal: posts and crossbar of 75 to 80 mm square, white (Part Six 21.6.2.2 and 21.6.2.4; 80 mm is drawn); 3.0 m between the inner sides of the posts (21.6.3.2); the crossbar's underside 0.9 m above the water (21.6.4.2); a goal at least 0.30 m deep from the goal line to the rear of the net (21.6.5). */
  goal: { width: 3, post: 0.08, crossbarHeight: 0.9, netClear: 0.3 },
  /** The excluded players' re-entry area, 2.0 m wide along the goal line and 1.0 to 1.1 m long along the side line (Part Six 20.7.2; 1.08 m is drawn, inside the range), behind the goal line on the side of the team benches, opposite the official table (20.7.1 and 21.11); June 2025: CR 18.3.4 and Appendix 4, 20.4.1.6. */
  reEntry: { length: 2, depth: 1.08, fromCorner: 2 },
  /** The area for flying substitutions, not less than 0.50 m wide, on the side of the team benches, from the goal line in front of the bench to the halfway line (Part Six 20.6.1 to 20.6.3; June 2025: CR 18.1.8). */
  substitution: 0.5,
  /** The referees' platforms: 1 m wide and 0.70 m above the water, on both sides of the field, colour coded like the lane ropes (Part Six 21.9.3.1 to 21.9.3.3; June 2025: CR 18.3.2). */
  platform: { width: 1, height: 0.7 },
  /** The lane ropes of a water polo field are 0.06 to 0.12 m across, at least 0.10 m at the Olympic Games and the World Championships (Part Six 21.7.4.2; June 2025: CR 18.1.7 and 18.2.6); 0.10 m is drawn. */
  rope: 0.1,
  /** The deck beyond the pool, ours (drawn). */
  deck: 3,
  /** The official table: the secretariat sits at a table behind the referees' platform (Part Six 21.10.1; June 2025: CR 18.3.6); its size is ours (drawn). */
  table: { length: 6, depth: 1.2 },
} as const;

/** How many lines cross a diving well for the Olympic Games and the World Championships (Part Four 15.6.3.1; June 2025: CR 13.2.7). A count, so it is kept out of the table of lengths. */
export const DIVING_LINES = 3;

/**
 * Diving, in metres (Part Four of the Competition Regulations, Article 15 and Appendix 2, "Diving facility specifications", which is Article 17.2 of Part Four). A springboard is 4.88 m long and 0.50 m wide
 * (Part Four 15.3.2), 1 m or 3 m above the water (Appendix 2); a platform of the length, width and height of the table (Part Four 15.4.3 and Appendix 2). Every distance is measured from the plummet, the vertical line
 * through the middle of the front edge of the springboard or platform (Part Four 15.1.1). `A` is from the plummet back to the pool wall (for a platform on concrete: how far its front edge projects beyond the wall, Part Four 15.4.9),
 * `B` to the pool wall at the side, `C` to the next plummet (the platforms' widths: Part Four 15.2.2), `D` to the wall ahead, `H` the depth of water at the plummet; each as [minimum, preferred]. A depth of 5 m under the boards is
 * what a pool built after 1 January 2025 should have if possible (Part Four 15.1.2.1). The minima of `H` are the June 2025 edition's values (3.50, 3.80, 3.30, 3.60, 3.80, 4.30 and 5.00 m, Appendix 2 of Part Four, "Table Diving Facilities");
 * February 2026 gives 3.40, 3.70, 3.20, 3.50, 3.70, 4.10 and 4.50 m, and the same 5.00 m preferred. The other figures of the table, A to D, are the same in both editions.
 */
export const DIVING = {
  springboard: { length: 4.88, width: 0.5 },
  /** Each platform: length, width (minimum, preferred) and height above the water. The 5, 7.5 and 10 m platforms have one width. */
  platforms: {
    "1": { length: 5, width: [1, 2.9], height: 1 },
    "3": { length: 5, width: [1, 2], height: 3 },
    "5": { length: 6, width: [2.9, 2.9], height: 5 },
    "7.5": { length: 6, width: [2, 2], height: 7.5 },
    "10": { length: 6, width: [3, 3], height: 10 },
  },
  /** A, from the plummet back to the pool wall: springboards at 2.22 m for a concrete platform (the board then reaches 2.22 m beyond the wall), platforms 0.75 m (1 m), 1.25 m (3, 5 and 7.5 m) and 1.50 m (10 m). */
  A: { springboard1: [2.22, 2.22], springboard3: [2.22, 2.22], platform1: [0.75, 0.75], platform3: [1.25, 1.25], platform5: [1.25, 1.25], platform75: [1.25, 1.25], platform10: [1.5, 1.5] },
  /** B, from the plummet to the pool wall at the side. */
  B: { springboard1: [2.5, 2.5], springboard3: [3.5, 3.5], platform1: [2.5, 2.5], platform3: [3, 3.6], platform5: [4, 4.5], platform75: [4.5, 4.75], platform10: [5.75, 5.75] },
  /** C, from the plummet to the adjacent one: 1 m boards 2.00 apart, 3 m boards 2.20 (2.60 preferred) from a 3 m or a 1 m board; platforms 1.85 (2.15), 2.20 (2.35), 2.85, 2.75 and 3.00. */
  C: { springboard1: [2, 2], springboard3: [2.2, 2.6], platform1: [1.85, 2.15], platform3: [2.2, 2.35], platform5: [2.85, 2.85], platform75: [2.75, 2.75], platform10: [3, 3] },
  /** D, from the plummet to the pool wall ahead: 9.00 (1 m), 10.25 (3 m), 8.00, 9.50, 10.25, 11.00 and 13.50 m for the platforms. */
  D: { springboard1: [9, 9], springboard3: [10.25, 10.25], platform1: [8, 8], platform3: [9.5, 9.5], platform5: [10.25, 10.25], platform75: [11, 11], platform10: [13.5, 13.5] },
  /** H, the depth of water at the plummet, minimum: June 2025 edition value 3.50 m (1 m), 3.80 (3 m), 3.30, 3.60, 3.80, 4.30 and 5.00 m; February 2026 says 3.40, 3.70, 3.20, 3.50, 3.70, 4.10 and 4.50 m (Part Four, Appendix 2). 5.00 m is preferred everywhere in both. */
  H: { springboard1: [3.5, 5], springboard3: [3.8, 5], platform1: [3.3, 5], platform3: [3.6, 5], platform5: [3.8, 5], platform75: [4.3, 5], platform10: [5, 5] },
  /** The depth of water is never less than 1.8 m anywhere in the diving pool (Part Four 15.1.3; June 2025: 13.1.3.9); 5 m under the boards for facilities built after 1 January 2025, if possible (Part Four 15.1.2.1). The June 2025 edition also made 5 m the rule at the Olympic Games and the World Championships (13.1.3.1); unverified in February 2026, whose Article 15.6 only applies Articles 15.2 to 15.5 there, with the minima of Appendix 2. */
  depthLeast: 1.8,
  depthBoards: 5,
  /** The least distance between adjacent platforms: 0.25 m (Part Four, Appendix 2, notes). */
  platformsApart: 0.25,
  /** Lane markings of a diving well for the Olympic Games and the World Championships: three lines across the well, 21.0 m long in a 25 m wide well, 2.5 m apart, the first directly under the plummet of the 3 m springboard (Part Four 15.6.3.1, 15.6.3.1.1 and 15.6.3.1.2, with the dimensions of Part Two 15.13.1; June 2025: 13.2.7). */
  lines: { length: 21, apart: 2.5, width: 0.25 },
  /** The pool: 25 m across, as the swimming pool's width (Part Four 15.6.3.1 asks for lines running the width of the well, with the dimensions of the swimming pool's lane markings), and the length ahead of the boards, ours; the rules set the clearances above, not the size of the well (drawn). */
  well: { width: 25, length: 21 },
  /** Judges sit side by side in a straight line along both sides of the pool (Part Four 15.5.1.1); the June 2025 edition (13.1.7.1.3) put them in line with or behind the front of the boards, never ahead of the plummet line. Unverified: Part Four 15.5.1.4 of February 2026 reads "No Judge may be seated alongside or behind the direct line of the front edge", which is the opposite on its face and is taken as a slip for "ahead of". */
  judges: { seat: 0.9 },
} as const;

/**
 * Artistic swimming, in metres (Part Seven, Article 12). The routine area for the Olympic Games and the World Championships is at least 30.0 by 20.0 m, 3.0 m deep (Part Seven 12.2.2); elsewhere at least
 * 15 by 25 m, of which 12 by 12 m is at least 3.0 m deep and the rest at least 2.0 m (Part Seven 12.1.1). The starting platform at least 0.7 m high at the Olympic Games and the World Championships, 1.0 m recommended (Part Seven 12.2.4),
 * 0.5 m least elsewhere, 1.0 m recommended (12.1.6); the Technical Officials' platform (the judges') at least 0.6 m high and not more than 2 m from the pool's edge (12.2.5). A practice warm-up pool at least 25 by 25 m or 30 by 20 m,
 * 3 m deep (12.2.6). June 2025: Article 27, 27.2.2 and 27.2.3, 27.1.2, 27.2.7 and 27.1.7, 27.2.8, 27.2.9.
 */
export const ARTISTIC = {
  olympic: { length: 30, width: 20, depth: 3 },
  minimum: { length: 25, width: 15, deepLength: 12, deepWidth: 12, deepDepth: 3, depth: 2 },
  warmUp: { length: 30, width: 20, depth: 3 },
  /** The lane markings of the pool, or contrasting lines in one direction along its length if there are none (Part Seven 12.1.3; June 2025: 27.2.4). */
  line: 0.25,
  start: { heightOlympic: 0.7, heightRecommended: 1, heightLeast: 0.5 },
  judges: { height: 0.6, fromEdge: 2 },
  /** The sizes of the starting platform, the judges' platform and its seats are not set by the rules (drawn). */
  drawn: { start: { length: 2, depth: 1.2 }, judges: { length: 12, depth: 1.4 }, deck: 3 },
} as const;
