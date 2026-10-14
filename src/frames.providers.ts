// The coordinate frames of the data providers of hockey, basketball, football and baseball, as landmarks on the surfaces in
// frames.ts. Each is cited in docs/sources.md ("Coordinate frames"), which says what was read, where, and what is ours.
// Soccer's providers are registered by src/surfaces/soccer-providers.ts. Facts only: no code of sportypy, sportyR or
// hockey_rink is used.
import { isPoolSport } from "./pool.ts";
import type { PoolSport } from "./pool.types.ts";
import { CURLING, FOOTBALL, NBA, NHL, footballLength, surfaceSize } from "./geometry.ts";
import { FRAMES, registerFrame, span, type Frame, type FrameMap } from "./frames.ts";
import type { Point } from "./units.ts";

// The surfaces in feet, in the drawing's own landscape frame: x along the surface from the left end, y across it from the top.
const NFL_LENGTH = footballLength(FOOTBALL.nfl);
const NFL_WIDTH = FOOTBALL.nfl.width;

/** NHL API play-by-play: `xCoord` -100 to 100 and `yCoord` -42.5 to 42.5 feet, from centre ice. */
const nhlApi: Frame = {
  name: "nhl-api",
  title: "NHL API play-by-play (xCoord, yCoord)",
  sport: "nhl",
  unit: "ft",
  x: [-100, 100],
  y: [-42.5, 42.5],
  origin: "centre ice",
  yDirection: "up",
  size: "fixed",
  ends: "fixed",
  landmarks: { x: span(-100, 100, 0, NHL.length), y: span(-NHL.width / 2, NHL.width / 2, NHL.width, 0) },
  source: "NHL API coordinates",
  note: "The sources read give the ranges and the centre-ice origin, and not the sign of y: positive y is taken as the left of a team attacking right, drawn upward. Check one shot against your data.",
};

/** HockeyTech (the AHL, ECHL, OHL, PWHL and others): a canvas of 600 by 300 with the origin at the top left. */
const hockeyTech: Frame = {
  name: "hockeytech",
  title: "HockeyTech canvas (600 by 300)",
  sport: "nhl",
  unit: "px",
  x: [0, 600],
  y: [0, 300],
  origin: "the top left corner of the canvas",
  yDirection: "down",
  size: "fixed",
  ends: "fixed",
  landmarks: { x: span(0, 600, 0, NHL.length), y: span(0, 300, 0, NHL.width) },
  source: "HockeyTech coordinates",
  note: "The whole canvas is the rink inside the boards: 3 units a foot along it, about 3.53 across.",
};

/** stats.nba.com shot chart (`LOC_X`, `LOC_Y`): tenths of a foot, the hoop at the origin, shots at the basket attacked. */
const nbaStats: Frame = {
  name: "nba-stats",
  title: "NBA stats legacy shot coordinates (LOC_X, LOC_Y)",
  sport: "nba",
  unit: "tenth-ft",
  x: [-250, 250],
  y: [-(NBA.basket * 10), (NBA.length - NBA.basket) * 10],
  origin: "the centre of the hoop",
  yDirection: "up",
  size: "fixed",
  ends: "shooter",
  // LOC_X is across the court, negative at the shooter's left; LOC_Y is along it, from the hoop towards half court. The right basket is attacked.
  landmarks: {
    swap: true,
    x: span(-250, 250, 0, NBA.width),
    y: span(-NBA.basket * 10, (NBA.length - NBA.basket) * 10, NBA.length, 0),
  },
  source: "NBA stats shot coordinates",
  note: "Every point is placed at the right basket; give attacking: \"left\" for the left one. The sign of LOC_X (negative at the shooter's left) is one source's finding, checked against its corner threes.",
};

/** NFL tracking data (Big Data Bowl, Next Gen Stats, nflverse): yards, 0 to 120 along the field and 0 to 53.3 across. */
const nflTracking: Frame = {
  name: "nfl-tracking",
  title: "NFL tracking data (x, y in yards)",
  sport: "nfl",
  unit: "yd",
  x: [0, 120],
  y: [0, FOOTBALL.nfl.width / 3],
  origin: "the corner of the back of the left end zone, at the bottom of the field diagram",
  yDirection: "up",
  size: "fixed",
  ends: "fixed",
  landmarks: { x: span(0, 120, 0, NFL_LENGTH), y: span(0, NFL_WIDTH / 3, NFL_WIDTH, 0) },
  source: "NFL tracking data",
  note: "x counts the end zones, so the goal lines are at 10 and 110. The sources read give the ranges and units and not the corner of the origin: it is taken as the bottom left of the field diagram, y up.",
};

/** MLBAM and Statcast hit coordinates `hc_x`, `hc_y`: pixels of the Gameday image with home plate at (125.42, 198.27). */
const mlbam: Frame = {
  name: "mlbam",
  title: "MLBAM and Statcast hit coordinates (hc_x, hc_y)",
  sport: "mlb",
  unit: "px",
  x: [0, 250],
  y: [0, 250],
  origin: "the top left of the image; home plate stands at (125.42, 198.27)",
  yDirection: "down",
  size: "fixed",
  ends: "none",
  // 2.5 feet a unit, the common reading; the surface's x is across the field (right field positive), its y is the distance out, as minus.
  landmarks: { x: span(125.42, 126.42, 0, 2.5), y: span(197.27, 198.27, -2.5, 0) },
  source: "MLBAM and Statcast hit coordinates",
  note: "The scale is approximate: a unit is about 2.5 feet (one analysis found 2.48), and the pixel frame is not a survey, so balls near a foul line can fall on the wrong side. Home plate's place is the figure all the sources use.",
};

/** Retrosheet's hit locations, as the places on the field a zone's code stands for, in feet from home plate. */
const retrosheet: Frame = {
  name: "retrosheet",
  title: "Retrosheet hit locations (zone centres, in feet)",
  sport: "mlb",
  unit: "ft",
  x: [-330, 330],
  y: [-60, 420],
  origin: "the back point of home plate",
  yDirection: "up",
  size: "fixed",
  ends: "none",
  landmarks: { x: span(0, 1, 0, 1), y: span(0, 1, 0, -1) },
  source: "Retrosheet hit locations",
  note: "Positive x is right field, positive y is out from home plate. A zone code stands for a place read off the diagram: `RETROSHEET_ZONES`, `zoneToPoint`, `zoneAt`.",
};

/**
 * A curling stone's place in feet from the button of the house it is played to: x across the sheet, positive to the thrower's right; y along it,
 * positive from the button towards the back line, negative towards the hog line. A sheet is 146 to 150 feet and its tee is always 57 feet from
 * the middle, so the frame fits any size. It stands at the right (bottom, when the sheet is tall) house, as every frame faces right; give
 * `attacking: "left"` for the house at the left (the top one, the far end of a tall drawing).
 */
const curling: Frame = {
  name: "curling",
  title: "Curling stones, in feet from the button",
  sport: "curling",
  unit: "ft",
  x: [-7.8, 7.8],
  y: [-132, 18],
  origin: "the button of the house the stones are played to",
  yDirection: "down",
  size: "variable",
  ends: "shooter",
  landmarks: (size) => ({
    swap: true,
    x: span(-size.width / 2, size.width / 2, 0, size.width),
    y: span(0, 1, size.length / 2 + CURLING.teeFromMiddle, size.length / 2 + CURLING.teeFromMiddle + 1),
  }),
  source: "this package's own frame: the button as the origin, as the rulebooks measure a stone's score from the tee",
  note: "Positive x is the thrower's right; positive y is away from the thrower, towards the back line. The frame is not a data provider's: it is the plain reading of the rules (a stone is scored by its distance from the tee).",
};

/**
 * A net sport's court in the plain frame of the net: the centre of the net, on the court, as the origin; x along the court, positive towards the end drawn at the
 * right; y across it, positive towards the top as the court is drawn wide. The unit is the one the rulebook prints first (feet for tennis and pickleball, metres
 * for volleyball, badminton and table tennis). Tennis, badminton, pickleball and table tennis have one size; a volleyball court is indoor or beach, so its frame fits the
 * size of the court it is placed on. This package's own frame: no
 * tracking provider's format was read (Hawk-Eye's and the others' are not published), and a rulebook measures a court from the net.
 */
function netFrame(sport: "tennis" | "volleyball" | "badminton" | "pickleball" | "tabletennis", title: string, unit: "ft" | "m", x: number, y: number, what: string): Frame {
  const per = unit === "ft" ? 1 : 0.3048;
  const map = (size: { length: number; width: number }): FrameMap => ({ x: span(-(size.length * per) / 2, (size.length * per) / 2, 0, size.length), y: span(-(size.width * per) / 2, (size.width * per) / 2, size.width, 0) });
  return {
    name: sport,
    title,
    sport,
    unit,
    x: [-x, x],
    y: [-y, y],
    origin: `the centre of the net, on ${what}`,
    yDirection: "up",
    size: sport === "volleyball" ? "variable" : "fixed",
    ends: "fixed",
    landmarks: sport === "volleyball" ? map : map(surfaceSize(sport, "ft")),
    source: "this package's own frame: the centre of the net as the origin, as the rulebook measures the court from the net",
    note: "Positive x is towards the end drawn at the right, positive y towards the top as the court is drawn wide. The frame is not a data provider's: it is the plain reading of the rules, which measure everything from the net.",
  };
}

const tennisFrame = netFrame("tennis", "Tennis court, in feet from the centre of the net", "ft", 39, 18, "the court");
const volleyballFrame = netFrame("volleyball", "Volleyball court, in metres from the centre of the net", "m", 9, 4.5, "the court");
const badmintonFrame = netFrame("badminton", "Badminton court, in metres from the centre of the net", "m", 6.7, 3.05, "the court");
const pickleballFrame = netFrame("pickleball", "Pickleball court, in feet from the centre of the net", "ft", 22, 10, "the court");
const tableTennisFrame = netFrame("tabletennis", "Table tennis table, in metres from the centre of the net", "m", 1.37, 0.7625, "the table");

/**
 * A field sport's surface in the plain frame of its middle: the centre of the surface as the origin, x along it, positive towards the end drawn at the right, y across it, positive towards the top as it is drawn wide.
 * The unit is the one the sport's rulebook prints first (metres; yards for cricket, whose frame is measured from the middle of the pitch, which is the middle of the ground). The size of these surfaces is a range, so the frame
 * fits the size of the surface it is placed on. This package's own frame: no tracking provider's format was read for these sports, and each rulebook measures a field from its lines (the figures of `LEAGUES`).
 */
function centreFrame(sport: "lacrosse" | "rugby" | "afl" | "gaelic" | "cricket" | "fieldhockey" | "handball" | PoolSport, title: string, unit: "m" | "yd", x: number, y: number): Frame {
  const per = unit === "m" ? 1 / 0.3048 : 3;
  const map = (size: { length: number; width: number }): FrameMap => ({ x: span(-size.length / per / 2, size.length / per / 2, 0, size.length), y: span(-size.width / per / 2, size.width / per / 2, size.width, 0) });
  return {
    name: sport,
    title,
    sport,
    unit,
    x: [-x, x],
    y: [-y, y],
    origin: sport === "cricket" ? "the middle of the pitch, the centre of the ground" : isPoolSport(sport) ? "the centre of the water" : "the centre of the surface",
    yDirection: "up",
    size: "variable",
    ends: sport === "cricket" ? "none" : "fixed",
    landmarks: map,
    source: "this package's own frame: the centre of the surface as the origin",
    note: "Positive x is towards the end drawn at the right, positive y towards the top as the surface is drawn wide. The frame is not a data provider's: it is the plain reading of the surface, and it is fitted to the size the surface is drawn at.",
  };
}

const lacrosseFrame = centreFrame("lacrosse", "Lacrosse surface, in metres from the centre", "m", 50, 30);
const rugbyFrame = centreFrame("rugby", "Rugby field, in metres from the centre, the in-goal areas included", "m", 60, 35);
const aflFrame = centreFrame("afl", "Australian football ground, in metres from the centre", "m", 80, 70.5);
const gaelicFrame = centreFrame("gaelic", "Gaelic games field, in metres from the centre", "m", 72.5, 45);
const cricketFrame = centreFrame("cricket", "Cricket ground, in yards from the middle of the pitch", "yd", 75, 75);
const fieldHockeyFrame = centreFrame("fieldhockey", "Field hockey pitch, in metres from the centre", "m", 45.7, 27.5);
const handballFrame = centreFrame("handball", "Handball court, in metres from the centre", "m", 20, 10);
// The pools: the middle of the water, x along it from the starting wall (left) towards the turning wall, y positive towards the top as the pool is drawn wide, so that lane 1 (or 0) is at the bottom. The frame of a
// race replay (`raceTimeline`) puts a swimmer's distance along the pool and the lane's place across it in this frame.
const swimmingFrame = centreFrame("swimming", "Swimming pool, in metres from the centre of the water", "m", 25, 13);
const waterPoloFrame = centreFrame("waterpolo", "Water polo pool, in metres from the centre of the water", "m", 12.8, 10);
const divingFrame = centreFrame("diving", "Diving well, in metres from the centre of the water", "m", 10.5, 13.5);
const artisticFrame = centreFrame("artisticswimming", "Artistic swimming area, in metres from the centre of the water", "m", 15, 10);

for (const frame of [nhlApi, hockeyTech, nbaStats, nflTracking, mlbam, retrosheet, curling, tennisFrame, volleyballFrame, badmintonFrame, pickleballFrame, tableTennisFrame, lacrosseFrame, rugbyFrame, aflFrame, gaelicFrame, cricketFrame, fieldHockeyFrame, handballFrame, swimmingFrame, waterPoloFrame, divingFrame, artisticFrame]) if (!Object.prototype.hasOwnProperty.call(FRAMES, frame.name)) registerFrame(frame);

// Retrosheet's hit-location diagram (Project Scoresheet's) draws the field in sectors: columns of the outfield from the left field
// line to the right (7L, 7, 78, 8, 89, 9, 9L), each cut into rings of about 50 feet by depth (S shallow, none medium, D deep, XD
// extra deep), the infield in sectors by the fielders' numbers, and the foul ground beside them with an F. The figures below are
// the centres of those sectors read off the diagram, which is drawn to scale for a park of 330 feet down the lines and 405 to
// centre: the outfield's by the depth of its ring and the angle of its column, the infield's by their place on the picture.
// They are ours (good to a few feet, not a survey) and are documented as such in docs/sources.md.

/** The depth, in feet from home plate, of each ring of the outfield. */
const RING: Readonly<Record<string, number>> = { S: 238, "": 290, D: 330, XD: 380 };
/** The angle from dead centre field of each column: negative to the left. */
const COLUMN: Readonly<Record<string, number>> = { "7L": -40.5, "7": -31, "78": -16, "8": 0, "89": 16, "9": 31, "9L": 40.5 };
/** The rings each column has: the diagram has the extra-deep ring only in the three middle columns. */
const RINGS: Readonly<Record<string, readonly string[]>> = { "7L": ["S", "", "D"], "7": ["S", "", "D"], "78": ["S", "", "D", "XD"], "8": ["S", "", "D", "XD"], "89": ["S", "", "D", "XD"], "9": ["S", "", "D"], "9L": ["S", "", "D"] };

const round = (n: number): number => Math.round(n * 10) / 10;

/** The places of the zones of the infield and the foul ground, as [x, y] feet: x to the right of home plate (the first-base side), y out from it. Left-side zones are the mirror of the right's. */
const NEAR: Readonly<Record<string, Point>> = {
  "2": [0, 13],
  "2F": [0, -22],
  "1S": [0, 37],
  "1": [0, 60.5],
  "25": [-26, 33],
  "23": [26, 33],
  "25F": [-36, 22],
  "23F": [36, 22],
  "15": [-16, 54],
  "13": [16, 54],
  "5S": [-49, 55],
  "3S": [49, 55],
  "56S": [-41, 73],
  "34S": [41, 73],
  "6S": [-23, 86],
  "4S": [23, 86],
  "6MS": [-8, 105],
  "4MS": [8, 105],
  "6M": [-10, 146],
  "4M": [10, 146],
  "5F": [-85, 73],
  "3F": [85, 73],
  "5": [-78, 92],
  "3": [78, 92],
  "56": [-61, 107],
  "34": [61, 107],
  "6": [-39, 131],
  "4": [39, 131],
  "5D": [-118, 139],
  "3D": [118, 139],
  "5DF": [-134, 119],
  "3DF": [134, 119],
  "56D": [-90, 160],
  "34D": [90, 160],
  "6D": [-50, 179],
  "4D": [50, 179],
  "6MD": [-16, 188],
  "4MD": [16, 188],
  "7LSF": [-181, 160],
  "9LSF": [181, 160],
  "7LF": [-215, 200],
  "9LF": [215, 200],
  "7LDF": [-236, 222],
  "9LDF": [236, 222],
};

function zones(): Record<string, Point> {
  const table: Record<string, Point> = {};
  for (const [code, point] of Object.entries(NEAR)) table[code] = point;
  for (const [column, angle] of Object.entries(COLUMN)) {
    for (const ring of RINGS[column]) {
      const radians = (angle * Math.PI) / 180;
      table[`${column}${ring}`] = [round(RING[ring] * Math.sin(radians)), round(RING[ring] * Math.cos(radians))];
    }
  }
  return table;
}

/** The place, in feet from home plate (x towards right field, y out), that each of Retrosheet's hit-location codes stands for: the centre of its sector. */
export const RETROSHEET_ZONES: Readonly<Record<string, Point>> = Object.freeze(zones());

/** The place a Retrosheet hit-location code stands for, or `undefined` for a code not on the diagram. The code is the location alone (`8D`), not the batted-ball type before it (`F`, `L`, `G`, `P`) nor a leading `B` for a bunt. */
export function zoneToPoint(code: string): Point | undefined {
  const key = String(code).trim().toUpperCase();
  return Object.prototype.hasOwnProperty.call(RETROSHEET_ZONES, key) ? RETROSHEET_ZONES[key] : undefined;
}

/**
 * The code of the Retrosheet zone whose centre is nearest a point, in feet from home plate (x to the right, y out): the
 * zone the point most probably lay in. Zone centres are not boundaries, so a point near the edge of two may go to either.
 * @example
 * ```ts
 * import { zoneAt, zoneToPoint } from "@johnmorrisdotca/kyogijo-stadiums/frames";
 * console.log(zoneAt([0, 335]), zoneToPoint("8D"));
 * // 8D [ 0, 330 ]
 * ```
 */
export function zoneAt(point: Point): string {
  let best = "";
  let distance = Infinity;
  for (const [code, [x, y]] of Object.entries(RETROSHEET_ZONES)) {
    const d = (x - point[0]) ** 2 + (y - point[1]) ** 2;
    if (d < distance) {
      distance = d;
      best = code;
    }
  }
  return best;
}
