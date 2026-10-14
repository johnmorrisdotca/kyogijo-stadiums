// The types of the ready-made charts: what each chart function takes (the marks and the options) and what it gives back. Plain data, so that
// a chart's layers can be saved as JSON and the same input always draws the same drawing.
import type { Frame } from "./frames.ts";
import type { HeatRamp } from "./heat.types.ts";
import type { Layer, LayerTeam, MarkShape, TableOptions } from "./layers.types.ts";
import type { SoccerProviderId } from "./surfaces/soccer-providers.ts";
import type { Language, SheetShow, SurfaceOptions } from "./types.ts";
import type { Unit } from "./units.ts";

/** What every chart gives back: the layers and the drawing options to put them on, a sentence, the totals, and the ways to draw them. */
export interface Chart<Totals = Record<string, never>> {
  /** The drawing's options: the sport, the layers, the language, a title and what the chart needs of the surface (the park and the season of a spray chart, the half of a pitch). Pass them to `drawKyogijo`, `drawSurface`, `mountKyogijo` or `kyogijoProps`; change any of them first if you like. */
  options: SurfaceOptions;
  /** The layers, the same list as `options.layers`: the zones under the marks, the marks, and a key. They are plain data, so a layer can be changed, taken out or followed by layers of your own. */
  layers: Layer[];
  /** The chart's accessible name, in the chart's language. */
  title: string;
  /** What the chart shows, in a sentence or two, for a caption. */
  summary: string;
  /** The numbers behind it: counts, percentages and expected goals, and the zones with theirs. */
  totals: Totals;
  /** The drawing as an SVG string: `drawKyogijo({ ...options, ...extra })`. */
  draw(extra?: Partial<SurfaceOptions>): string;
  /** One HTML table for each layer that holds data (not the key), with the zones as rows. The table that stands for the drawing for a screen reader. */
  table(options?: Omit<TableOptions, "surface" | "language">): string;
}

/** One entry of a chart's key: a mark and what it means. A chart lists its own in `key`. */
export interface KeyItem {
  /** The outcome the mark stands for (`made`, `goal`). */
  outcome: string;
  /** What the mark is called, in the chart's language. */
  label: string;
  shape: MarkShape;
  /** Drawn open (a miss, a save) and not filled. */
  hollow: boolean;
}

/** The options every chart takes. */
export interface ChartOptions {
  /** The language of the chart's words: its title, its key, the labels of its zones and its table. English by default. */
  language?: Language;
  /** A prefix for the ids inside the drawing. Made from the chart when missing, so that two charts on a page do not share ids. */
  id?: string;
  /** Draw the key (what each mark is) in the margin above the surface. On by default. */
  key?: boolean;
  /** Draw the colour bar of the zones, hexagons or cells. On by default (a curling heat chart of a folded sheet leaves it out unless asked, as it would be drawn at the strip's small scale). */
  legend?: boolean;
  /** The colour ramp of the zones, hexagons or cells: a built-in name, a list of stops or `{ light, dark }`. */
  ramp?: HeatRamp;
  /** Options of the drawing laid over the chart's own: the theme, the orientation, `colors`, `style: "none"`, `className`. */
  surface?: Partial<SurfaceOptions>;
}

// ----- basketball

/** A shot as stats.nba.com's shot chart gives it: `LOC_X` and `LOC_Y` and whether it went in. */
export interface NbaShot {
  x: number | null;
  y: number | null;
  /** True for a shot that went in. Or give `outcome`. */
  made?: boolean;
  /** `made` or `missed`, in place of `made`. */
  outcome?: "made" | "missed" | (string & {});
  /** A number to carry with the shot (a distance, a value over average). */
  value?: number | null;
  team?: LayerTeam;
  /** The tooltip of the mark and its line in the table. */
  title?: string;
}

/** What `nbaShotChart` takes. */
export interface NbaShotOptions extends ChartOptions {
  /** The frame the shots are in: `nba-stats` (the default), or another frame of the court. */
  from?: Frame | string;
  /** The basket the shots were taken at: `right` (the default; the shot chart puts every shot at the right basket) or `left`. */
  end?: "left" | "right";
  /** Count the shots into the six shot zones (restricted area, in the paint, mid-range, both corner threes, above the break) and colour each by its field-goal percentage. On by default. */
  zones?: boolean;
  /** Draw each shot as a mark: filled when made, an open x when missed. On by default. */
  marks?: boolean;
  /** The league's field-goal percentage (46 for 46 percent). With it the zones are coloured by how far they are above or below it, on a diverging ramp; without it, by the percentage alone. */
  league?: number;
  /** A zone with fewer shots than this is left uncoloured (a percentage from two shots says little). 3 by default. */
  minShots?: number;
  /** Write each zone's percentage and its made over taken (`13/31`). On by default. */
  labels?: boolean;
}

/** One zone of a chart: its name, the shots in it and the share that went in. */
export interface ZoneTotal {
  id: string;
  name: string;
  taken: number;
  made: number;
  /** The percent that went in, one decimal, or null for a zone with no shots. */
  percent: number | null;
}

/** The numbers behind an NBA shot chart. */
export interface NbaTotals {
  shots: number;
  made: number;
  /** The percent that went in, one decimal, or null with no shots. */
  percent: number | null;
  /** Rows left out for want of a place. */
  skipped: number;
  zones: ZoneTotal[];
}

// ----- hockey

/** A shot as the NHL's play-by-play gives it. */
export interface NhlShot {
  x: number | null;
  y: number | null;
  /** `goal`, `saved` (a shot on goal), `missed`, `blocked`, or `shot` for an attempt of no known result. */
  outcome?: "goal" | "saved" | "missed" | "blocked" | "shot" | (string & {});
  /** True for a goal, in place of `outcome`. */
  goal?: boolean;
  /** The chance the shot had of scoring, 0 to 1. */
  xg?: number | null;
  team?: LayerTeam;
  title?: string;
}

/** What `nhlShotMap` takes. */
export interface NhlShotOptions extends ChartOptions {
  /** The frame the shots are in: `nhl-api` (the default), `hockeytech`, or another frame of the rink. */
  from?: Frame | string;
  /** Turn the shots at the left end a half turn so that all of them are at the right end: one half of the rink, every shot. Off by default. */
  fold?: boolean;
  /** `xg` sizes each mark by its chance of scoring (the area of the mark follows `xg`); `none` draws them all alike. `xg` by default when any shot has an `xg`. */
  sizeBy?: "xg" | "none";
  /** The `xg` that is the largest mark. 0.5 by default; a larger one is drawn as large. */
  xgMax?: number;
  /** Count the shots into the rink's slot zones (`nhl-slot`), or into home plate (`nhl-home-plate`). `true` is the slot. Off by default. */
  zones?: boolean | "nhl-slot" | "nhl-home-plate";
  /** Count the shots into hexagons (`true`, or their size in feet). Off by default; with `zones` as well, the zones win. */
  hexbin?: boolean | { size?: number };
  /** What the zones or hexagons show: `shots` (the count, the default), `xg` (the sum of the chances) or `goals` (the percent that were goals). */
  statistic?: "shots" | "xg" | "goals";
  /** The end the shots attack, in the frame's numbers, when they are not folded: leave out for shots at both ends. */
  attacking?: "left" | "right";
  /** Draw the marks. On by default. */
  marks?: boolean;
  /** Write the numbers on the zones. On by default for zones. */
  labels?: boolean;
}

/** The numbers behind a hockey shot map. */
export interface NhlTotals {
  shots: number;
  goals: number;
  /** The sum of the shots' chances, two decimals, or null when no shot has one. */
  xg: number | null;
  skipped: number;
  /** The zones, when the chart has them. */
  zones: ZoneTotal[];
  /** Shots and goals by team, when the shots name one. */
  teams: Record<string, { shots: number; goals: number; xg: number | null }>;
}

// ----- baseball

/** A ball in play. Give `x` and `y` in the frame, or for Retrosheet a `zone` (the location code, `8D`). */
export interface Ball {
  x?: number | null;
  y?: number | null;
  /** A Retrosheet hit-location code in place of `x` and `y`. */
  zone?: string;
  /** What happened: `single`, `double`, `triple`, `home run`, `out`, or the words of Statcast's `events` (`home_run`, `field_out`) or the usual short forms (`1B`, `HR`). Any other word is drawn as it is. */
  type?: string;
  /** A number to carry with the ball (exit velocity, distance). */
  value?: number | null;
  team?: LayerTeam;
  title?: string;
}

/** What `mlbSprayChart` takes. */
export interface MlbSprayOptions extends ChartOptions {
  /** The frame the balls are in: `mlbam` (the default; Statcast's `hc_x` and `hc_y`), `retrosheet` (feet from home plate, or zone codes), or another frame of the field. */
  from?: Frame | string;
  /** The ballpark: a key of `PARKS`, past parks included. The generic field when missing. */
  park?: string;
  /** The season: a past park is drawn with the fence it had in it (`polo-grounds` in 1915). */
  year?: number;
  /** The side the batter bats from, `R` (the default) or `L`: it says which side of the field is pull. `none` names the thirds left, centre and right field. */
  bats?: "L" | "R" | "none";
  /** Count the balls into the spray zones (`baseball-spray`, pull, centre and opposite by infield and outfield; `true` is this) or Retrosheet's sectors (`baseball-retrosheet`). Off by default. */
  zones?: boolean | "baseball-spray" | "baseball-retrosheet";
  /** What the zones show: `share` of all the balls (the default), `count`, or the `hit-rate` (the percent that were hits). */
  statistic?: "share" | "count" | "hit-rate";
  /** The ground round the fence, in feet. A ball beyond the fence is drawn there, over the ground round it; 40 by default so that there is room. A ball farther than the margin is drawn at its edge. */
  margin?: number;
  /** Draw the marks. On by default. */
  marks?: boolean;
  /** Write the numbers on the zones. On by default for zones. */
  labels?: boolean;
}

/** The numbers behind a spray chart. */
export interface MlbTotals {
  balls: number;
  /** Balls by type: `single`, `double`, `triple`, `home run`, `out`, and any other word given. */
  types: Record<string, number>;
  /** Balls that came down beyond the fence of the park in that season. */
  beyondFence: number;
  skipped: number;
  /** The zones, when the chart has them: the balls in each and, for a hit rate, the hits. */
  zones: ZoneTotal[];
}

// ----- football

/** A pass. The destination is `x` and `y`; the passer's place is `fromX` and `fromY` when you have it. */
export interface NflPass {
  /** Where the ball came down or was caught, in the frame. */
  x: number | null;
  y: number | null;
  /** Where it was thrown from. With it a pass can be drawn as an arrow. */
  fromX?: number | null;
  fromY?: number | null;
  /** `complete`, `incomplete`, `touchdown` or `interception`. */
  outcome?: "complete" | "incomplete" | "touchdown" | "interception" | (string & {});
  /** The yards the ball travelled past the line of scrimmage. Worked out from the destination and `los` when missing. */
  airYards?: number | null;
  team?: LayerTeam;
  title?: string;
}

/** What `nflPassChart` takes. */
export interface NflPassOptions extends ChartOptions {
  /** The frame the passes are in: `nfl-tracking` (the default; yards, the end zones counted) or another frame of the field. */
  from?: Frame | string;
  /** The line of scrimmage, in the frame's numbers along the field (60 for midfield in `nfl-tracking`). Midfield by default. */
  los?: number;
  /** The way the offence goes in the frame's numbers: `right` (the default) or `left`. The chart is drawn with the offence going right. */
  direction?: "left" | "right";
  /** Count the passes into the pass grid (short and deep by left, middle and right) and colour each by its completion percentage. On by default. */
  zones?: boolean;
  /** Draw each pass from its passer to its destination as an arrow (dashed when incomplete), for passes that have `fromX` and `fromY`. Off by default. */
  arrows?: boolean;
  /** Draw the destinations as marks. On by default. */
  marks?: boolean;
  /** Draw the line of scrimmage. On by default. */
  line?: boolean;
  /** Write each zone's percentage and its completions over attempts. On by default. */
  labels?: boolean;
  /** A zone with fewer passes than this is left uncoloured. 3 by default. */
  minPasses?: number;
}

/** The numbers behind a pass chart. */
export interface NflTotals {
  passes: number;
  complete: number;
  touchdowns: number;
  interceptions: number;
  /** The percent that were caught (touchdowns included), one decimal, or null with no passes. */
  percent: number | null;
  /** The mean air yards of the passes that have a place, or null. */
  airYards: number | null;
  skipped: number;
  zones: ZoneTotal[];
}

// ----- soccer

/** A shot. The place is in the provider's frame; `goalY` and `goalZ` say where it crossed the goal line. */
export interface SoccerShot {
  x: number | null;
  y: number | null;
  /** `goal`, `saved`, `blocked`, `missed` or `post`. */
  outcome?: "goal" | "saved" | "blocked" | "missed" | "post" | (string & {});
  /** True for a goal, in place of `outcome`. */
  goal?: boolean;
  /** Expected goals, 0 to 1. */
  xg?: number | null;
  /** Where the shot crossed the goal line, for the goal-mouth view: across the goal from its centre, positive to the shooter's right, in `goalUnit` (metres by default). */
  goalY?: number | null;
  /** How high above the ground it crossed the goal line, in `goalUnit`. */
  goalZ?: number | null;
  team?: LayerTeam;
  title?: string;
}

/** What `soccerShotMap` takes. */
export interface SoccerShotOptions extends ChartOptions {
  /** The provider the shots are in (`opta`, `statsbomb`, `wyscout`, ...): the pitch is drawn in its numbers and the marks use them. Or a `Frame` of your own, for a pitch drawn as usual. `international` (metres) by default. */
  provider?: SoccerProviderId | Frame;
  /** Show only the half the shots attack: `true` for the right half (the default for `attacking: "right"`), `"left"` or `"right"` to choose. All of the pitch when false or missing. */
  half?: boolean | "left" | "right";
  /** The end the shots attack, in the provider's numbers: `right` (the default; each team attacks left to right) or `left`. */
  attacking?: "left" | "right";
  /** Size each mark by its expected goals (`xg`). On by default when any shot has one. */
  xg?: boolean;
  /** The `xg` that is the largest mark. 0.8 by default. */
  xgMax?: number;
  /** The pitch: a preset or a size, as `pitch` of a drawing. */
  pitch?: SurfaceOptions["pitch"];
  /** The ground, as `ground` of a drawing. */
  ground?: string;
  /** The unit of `goalY` and `goalZ`: `m` (the default), `yd` or `ft`. */
  goalUnit?: "m" | "yd" | "ft";
}

/** The numbers behind a soccer shot map. */
export interface SoccerTotals {
  shots: number;
  goals: number;
  /** The sum of the shots' expected goals, two decimals, or null when none has one. */
  xg: number | null;
  skipped: number;
  teams: Record<string, { shots: number; goals: number; xg: number | null }>;
}

/** The options of the goal-mouth view. */
export interface GoalMouthOptions {
  language?: Language;
  id?: string;
  /** The unit of `goalY` and `goalZ`: `m` (the default), `yd` or `ft`. */
  unit?: "m" | "yd" | "ft";
  /** The size of the goal in metres: the Laws' 7.32 by 2.44 by default. */
  goal?: { width: number; height: number };
  /** Size the marks by expected goals. On when any shot has one. */
  xg?: boolean;
  xgMax?: number;
  theme?: SurfaceOptions["theme"];
  style?: SurfaceOptions["style"];
  className?: string;
  title?: string;
}

/** The goal-mouth view: a small drawing of the goal frame seen from the front, with where each shot crossed the goal line. */
export interface GoalMouth {
  /** The drawing as an SVG string. */
  svg: string;
  /** The layers of the marks, in the frame of the goal (`x` across from the centre, `y` the height, in metres), if you want to draw them another way. */
  layers: Layer[];
  /** The shots that had a place across the goal and the ones that did not. */
  placed: number;
  skipped: number;
  /** The table of the shots with their place across the goal (`x` across from the centre, `y` the height, in metres). */
  table(options?: Omit<TableOptions, "surface" | "language">): string;
}

/** A soccer shot map: the chart, and the goal-mouth view of the same shots. */
export interface SoccerChart extends Chart<SoccerTotals> {
  /** The goal-mouth view of the shots that have `goalY` and `goalZ`: a small drawing of the goal frame, seen from the front, with where each shot crossed the goal line. */
  goalMouth(options?: GoalMouthOptions): GoalMouth;
}

// ----- curling

/** A stone at rest, as its place on the sheet: feet from the button of the house it was played to (the `curling` frame), x across the sheet (positive to the thrower's right) and y along it (positive towards the back line). */
export interface CurlingStone {
  x: number | null;
  y: number | null;
  /** The team that threw it: `home` or `away` take the two stone colours (red and yellow by default). */
  team?: LayerTeam;
  /** Its number among its team's eight, 1 to 8, written on the stone. */
  number?: number;
  /** The tooltip of the stone and its line in the table. Made from the team, the number and the distance when missing. */
  title?: string;
}

/** What `curlingStones` takes. */
export interface CurlingOptions extends ChartOptions {
  /** The number of the end, for the title: `6` gives "End 6". */
  end?: number;
  /** The team that has the hammer, the last stone of the end. It is named in the summary. */
  hammer?: "home" | "away";
  /** The teams' names, for the summary and the stones' tooltips. */
  names?: { home?: string; away?: string };
  /** The house the stones are at: the `left` one (the top house of a tall drawing, the default) or the `right`. */
  house?: "left" | "right";
  /** The unit of the stones' places: feet by default. */
  units?: Unit;
  /** Write each stone's number on it. On by default, for the stones that have one. */
  numbers?: boolean;
  /** How much of the sheet to draw: `half` (the default, the free guard zone and the house at `house`), `house`, `sheet` (the whole sheet), or `folded` (the whole sheet as a strip with both houses enlarged beside it). `surface.sheet.show` says the same and wins. */
  show?: SheetShow;
}

/** What `curlingHeat` takes. */
export interface CurlingHeatOptions extends ChartOptions {
  /** The house the stones are at: the `left` one (the top house of a tall drawing, the default) or the `right`. */
  house?: "left" | "right";
  /** The unit of the stones' places: feet by default. */
  units?: Unit;
  /** Only this team's stones. Both by default. */
  team?: "home" | "away";
  /** Which stones: `all` of those in play (the default), `guards` (the free guards only: between the tee line and the hog line, outside the house) or `house` (those in or touching it). */
  only?: "all" | "guards" | "house";
  /** How the stones are drawn: `heatmap` (counts in square cells, the default), `hexbin`, `contour` (a density), `zones` (counted into the button, the rings and the free guard zone) or `discs` (each stone a translucent disc in its team's colour, so that stones that fall on each other build up colour). */
  view?: "heatmap" | "hexbin" | "contour" | "zones" | "discs";
  /** The width of a cell of the `heatmap`, or the radius of a hexagon of the `hexbin`, in feet. 1 foot by default. */
  cell?: number;
  /** How much of the sheet to draw, as for `curlingStones`: `half` by default. */
  show?: SheetShow;
  /** The teams' names, for the summary. */
  names?: { home?: string; away?: string };
  /** Write the number of stones in each cell, hexagon or zone. Off by default, except for the zones. */
  labels?: boolean;
}

/** The numbers behind a heat chart of stones. */
export interface CurlingHeatTotals {
  /** Stones with a place, and the stones in play among them. */
  stones: number;
  inPlay: number;
  /** The stones drawn: in play, and of the team and the kind asked for. */
  drawn: number;
  /** Of those in play, the free guards and the stones in the house, for each team. */
  guards: { home: number; away: number };
  house: { home: number; away: number };
  /** Each zone of the house and the free guard zone, with the stones drawn that came to rest in it and their share of all drawn, as a percent. */
  zones: { id: string; name: string; stones: number; share: number | null }[];
  /** Rows left out for want of a place. */
  skipped: number;
}

/** One stone as the chart judged it. */
export interface CurlingStoneResult {
  /** The place of the stone in the list given. */
  index: number;
  /** Its centre's distance from the button, in feet. */
  distance: number;
  /** In play: it did not touch a sideline, and it stands wholly beyond the hog line and not wholly beyond the back line. */
  inPlay: boolean;
  /** Any part of it is within 6 feet of the button (in or touching the house), so that it can score. */
  inHouse: boolean;
  /** It scores. */
  counting: boolean;
  /** It is the stone nearest the button of those that can score. */
  shot: boolean;
}

/** The numbers behind a curling chart. */
export interface CurlingTotals {
  /** Stones with a place. */
  stones: number;
  /** In play, and out of play (removed, so not drawn). */
  inPlay: number;
  out: number;
  /** The stones that score, and the points. */
  counting: number;
  points: number;
  /** The team that scores, or `null` for a blank end. */
  scoring: string | null;
  /** The shot rock's place in the list given, or `null`. */
  shot: number | null;
  /** No one scores: no stone in the house, or the two nearest are as near. */
  blank: boolean;
  /** Rows left out for want of a place. */
  skipped: number;
  /** Every stone, as judged. */
  results: CurlingStoneResult[];
}
