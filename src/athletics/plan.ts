// What an athletics surface is for a set of options: the track's geometry, the infield, the races and the field events marked, and where each can be cropped to, all as plain data in metres, in
// the frame of track.ts (the origin the middle of the track, x along the straights, y down the page). Kept apart from the drawing so that the outline, the description, the ranges, the replay,
// the tests and the drawing agree: a test reads a figure from the plan, not from the markup. Nothing here draws.
import { lengthUnit } from "../common.ts";
import type { Area, Shape } from "../fields.types.ts";
import { num } from "../format.ts";
import { ATHLETICS_LEAGUES, WA_SHORT_TRACK, WA_STANDARD_TRACK, type AthleticsFigures, type AthleticsLeague } from "../leagues/athletics.ts";
import { chooseLeague } from "../leagues.ts";
import { groundById } from "../grounds.ts";
import { soccerSpec, type SoccerSpec } from "../surfaces/soccer-spec.ts";
import type { SurfaceOptions } from "../types.ts";
import { FIELD_EVENT_IDS, RACES, RACE_IDS, raceById } from "./events.ts";
import { infieldParts, jumpStrip, ARENA } from "./infield.ts";
import type { Facility } from "./facilities.ts";
import { addParts, emptyParts, indoorStraightOf, indoorStraightParts, outerRadius, ovalParts, stadiumD, straightOf, type Digits, type StraightPlan } from "./oval.ts";
import { layoutOf } from "./layout.ts";
import { markRace, startPivot, startPoints, type RaceMarks } from "./races.ts";
import { parseRange } from "../ranges.names.ts";
import { steeplechaseParts, waterPitBox } from "./steeplechase.ts";
import { laneEdge, type Oval } from "./track.ts";
import type { AthleticsFieldEvent, AthleticsInfield, AthleticsRace, AthleticsStyle, AthleticsTrackLook, RaceInfo, WaterJump } from "./types.ts";

/** A box in metres. */
export interface MBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** A named part of the plan to crop to, in metres: one box, or one at each end (`left` and `right` as the stadium is drawn wide). */
export type MRange = MBox | { left: MBox; right: MBox };

/** A part of the plan to label (`landmarks`): where it is, in metres, and the side of the drawing its label stands on. */
export interface MMark {
  id: string;
  x: number;
  y: number;
  side: "top" | "bottom";
}

/** What an athletics drawing is. */
export interface AthleticsPlan {
  sport: "athletics";
  league: string;
  /** True for the covered 200 m track. */
  indoor: boolean;
  figures: AthleticsFigures;
  oval: Oval;
  lanes: number;
  straight: StraightPlan | undefined;
  track: AthleticsTrackLook;
  infield: AthleticsInfield;
  /** The playing surface: the outer edge of the oval. The data frame's own box. */
  box: MBox;
  /** Everything drawn: the box and what lies beyond it (the jump strip, the runways' ends, the straight). */
  extent: MBox;
  areas: Area[];
  shapes: Shape[];
  digits: Digits[];
  /** The turf: its outline and the lighter bands, for the mown look. */
  turf: { d: string; stripes: string } | undefined;
  /** The soccer pitch laid inside the track, and where its corner is. */
  pitch: { spec: SoccerSpec; x: number; y: number } | undefined;
  facilities: Facility[];
  races: RaceMarks[];
  /** The steeplechase's lap, when it is drawn. */
  waterJump: WaterJump | undefined;
  events: AthleticsFieldEvent[];
  /** The width the ordinary line is painted at by the rules, and the width it is drawn at unless `exactLines` says otherwise. */
  lineWidth: number;
  drawnLine: number;
  ranges: Readonly<Record<string, MRange>>;
  marks: MMark[];
  /** The race a close-up of a start (`range: "start"`) shows. */
  start: AthleticsRace;
  /** The close-up of the start of that race, when the options ask for one (`range: "start"`): where it is turned about, and the part shown, in the frame in which the athletes run to the right. */
  startView: { pivot: { x: number; y: number; heading: number }; window: MBox } | undefined;
  /** True when the lane numbers are painted. */
  numbers: boolean;
  /** The field event drawn alone at a large scale, when the options ask for one: its facility is the whole plan. */
  layout?: AthleticsFieldEvent;
}

const isAthleticsLeague = (l: unknown): l is AthleticsLeague => typeof l === "object" && l !== null && (l as AthleticsLeague).family === "athletics";

/** The league a set of options asks for: the outdoor standard track, or the covered one. */
export function athleticsLeague(o: Pick<SurfaceOptions, "sport" | "league">): AthleticsLeague {
  const { league } = chooseLeague(o);
  return isAthleticsLeague(league) ? league : ATHLETICS_LEAGUES[0];
}

const TRACKS: readonly AthleticsTrackLook[] = ["red", "blue", "terracotta", "green"];
const INFIELDS: readonly AthleticsInfield[] = ["pitch", "grass", "none"];

/** A whole number of lanes within a range, or the drawn one. @throws RangeError for a number outside the range the rules allow. */
function lanesIn(asked: unknown, range: { min: number; max: number }, drawn: number, label: string): number {
  if (asked === undefined) return drawn;
  if (typeof asked !== "number" || !Number.isInteger(asked)) throw new RangeError(`${label} must be a whole number`);
  if (asked < range.min || asked > range.max) throw new RangeError(`${label} of ${asked} is outside what the rules allow: ${range.min} to ${range.max}`);
  return asked;
}

/** The field events the options ask for: all of them, none, or a list. @throws Error for a name that is not a field event. */
export function eventsOf(style: AthleticsStyle | undefined): AthleticsFieldEvent[] {
  const asked = style?.events;
  if (asked === undefined || asked === true) return [...FIELD_EVENT_IDS];
  if (asked === false) return [];
  if (!Array.isArray(asked)) throw new TypeError("athletics.events is true, false or a list of field events");
  for (const e of asked) if (!(FIELD_EVENT_IDS as readonly string[]).includes(e)) throw new Error(`Unknown field event "${String(e)}": use one of ${FIELD_EVENT_IDS.join(", ")}`);
  return FIELD_EVENT_IDS.filter((e) => asked.includes(e));
}

/** The races the options ask to be marked. @throws Error for a name that is not a race. */
export function racesOf(style: AthleticsStyle | undefined, indoor = false): RaceInfo[] {
  const asked = style?.races;
  if (asked === undefined) return [];
  const here = (r: RaceInfo): boolean => (indoor ? INDOOR_RACES.includes(r.id) : r.indoor !== true);
  if (asked === "all") return RACES.filter(here);
  if (!Array.isArray(asked)) throw new TypeError('athletics.races is "all" or a list of races');
  for (const r of asked) if (raceById(r) === undefined) throw new Error(`Unknown race "${String(r)}": use one of ${RACE_IDS.join(", ")}`);
  const list = RACES.filter((r) => (asked as readonly string[]).includes(r.id));
  for (const r of list) if (!here(r)) throw new RangeError(indoor ? `The covered 200 m track does not mark the ${r.id}: use one of ${INDOOR_RACES.join(", ")}` : `The ${r.id} is run on the covered track: the 400 m track marks the other races`);
  return list;
}

/** The races the covered track marks: the 60 m and its hurdles on the infield straight, and the races of 200 m to 5000 m on the oval. */
export const INDOOR_RACES: readonly AthleticsRace[] = Object.freeze(["60m", "60m-hurdles", "200m", "400m", "800m", "1000m", "1500m", "mile", "3000m", "5000m"]);

/** Round a box out by `m`. */
const grow = (b: MBox, m: number): MBox => ({ x0: b.x0 - m, y0: b.y0 - m, x1: b.x1 + m, y1: b.y1 + m });
const union = (boxes: readonly MBox[]): MBox => ({ x0: Math.min(...boxes.map((b) => b.x0)), y0: Math.min(...boxes.map((b) => b.y0)), x1: Math.max(...boxes.map((b) => b.x1)), y1: Math.max(...boxes.map((b) => b.y1)) });

/** The lighter bands of the mown turf, aligned to a pitch of 105 m in 19 bands, so that the grass round a pitch is mown as the pitch is (the soccer builder's `bands`). */
function turfBands(x0: number, x1: number, y0: number, y1: number): string {
  const band = 105 / 19;
  const left = -52.5;
  let d = "";
  for (let i = -3; i < 22; i += 1) {
    if (Math.abs(i) % 2 !== 1) continue;
    const a = left + i * band;
    const b = a + band;
    if (b <= x0 || a >= x1) continue;
    d += `M${num(Math.max(a, x0))} ${num(y0)}H${num(Math.min(b, x1))}V${num(y1)}H${num(Math.max(a, x0))}Z`;
  }
  return d;
}

/** The turf of the standard stadium: the oval's inside, cut off at each end where the synthetic surface of the segments begins (Marking Plan; Manual 2.2.1.1). */
function turfOf(o: Oval): { d: string } {
  const S = o.straight;
  const R = o.radius;
  const xg = S / 2 + ARENA.turf;
  const yc = Math.sqrt(R * R - ARENA.turf * ARENA.turf);
  const d = `M${num(-xg)} ${num(-yc)}A${num(R)} ${num(R)} 0 0 1 ${num(-S / 2)} ${num(-R)}H${num(S / 2)}A${num(R)} ${num(R)} 0 0 1 ${num(xg)} ${num(-yc)}V${num(yc)}A${num(R)} ${num(R)} 0 0 1 ${num(S / 2)} ${num(R)}H${num(-S / 2)}A${num(R)} ${num(R)} 0 0 1 ${num(-xg)} ${num(yc)}Z`;
  return { d };
}

/** The number of lanes of the oval the options ask for. */
export function athleticsLanes(o: Pick<SurfaceOptions, "sport" | "league" | "athletics">): number {
  const fig = athleticsLeague(o).dimensions;
  return lanesIn(o.athletics?.lanes, fig.lanes, fig.lanes.drawn, "The number of lanes");
}

/** The standard track and everything the options ask to be marked on it, as a plan. */
export function athleticsPlan(o: Pick<SurfaceOptions, "sport" | "league" | "athletics" | "units" | "pitch" | "detail"> & Partial<Pick<SurfaceOptions, "range" | "ground">>): AthleticsPlan {
  const league = athleticsLeague(o);
  const fig = league.dimensions;
  const indoor = fig.banking !== null;
  const style = o.athletics;
  const lanes = lanesIn(style?.lanes, fig.lanes, fig.lanes.drawn, "The number of lanes");
  const straightLanes = lanesIn(style?.straightLanes, fig.straightLanes, Math.max(lanes, fig.straightLanes.min), "The number of lanes of the straight");
  const track = style?.track === undefined ? "red" : style.track;
  if (!TRACKS.includes(track)) throw new Error(`Unknown track look "${String(track)}": use one of ${TRACKS.join(", ")}`);
  const infield = style?.infield === undefined ? (indoor ? "none" : "pitch") : style.infield;
  if (!INFIELDS.includes(infield)) throw new Error(`Unknown infield "${String(infield)}": use one of ${INFIELDS.join(", ")}`);
  const layoutEvent = style?.layout;
  if (layoutEvent !== undefined && !(FIELD_EVENT_IDS as readonly string[]).includes(layoutEvent)) throw new Error(`Unknown field event "${String(layoutEvent)}": use one of ${FIELD_EVENT_IDS.join(", ")}`);
  const events = indoor ? [] : eventsOf(style);
  const races = racesOf(style, indoor);
  const startRace = style?.start === undefined ? "400m" : style.start;
  if (raceById(startRace) === undefined) throw new Error(`Unknown race "${String(startRace)}": use one of ${RACE_IDS.join(", ")}`);
  const wj: WaterJump = style?.waterJump === undefined ? "inside" : style.waterJump;
  if (wj !== "inside" && wj !== "outside" && wj !== "none") throw new Error(`Unknown water jump "${String(wj)}": use inside, outside or none`);
  const numbers = style?.numbers !== false;
  const parsed = o.range === undefined ? undefined : parseRange({ sport: "athletics", league: o.league, range: o.range });
  const closeUp = parsed?.kind === "name" && parsed.name === "start";
  const oval: Oval = { straight: fig.straight, radius: fig.radius, lane: fig.lane, lanes, line: fig.line, inner: fig.inner, outer: fig.outer };
  if (layoutEvent !== undefined) return layoutPlan(layoutEvent, league, oval, lanes, track, numbers);
  const R = oval.radius;
  const S = oval.straight;
  const Rout = outerRadius(oval);
  const longest = indoor ? 60 : 110;
  const straight = indoor ? indoorStraightOf(oval, fig, straightLanes, 60) : straightOf(oval, fig, straightLanes, longest);
  const parts = emptyParts();
  const D = turfOf(oval);
  // The ground inside the track: the synthetic surface of the segments, and the turf between them (Marking Plan).
  addParts(parts, ovalParts(oval, fig, indoor ? undefined : straight, numbers, indoor ? undefined : D.d));
  if (indoor) {
    // The covered track's bends are banked (Rule 43): shaded, as a plan shows a slope.
    const rr = Rout;
    parts.areas.push(
      { id: "banking-east", feature: "banking", cls: "ky-ath-bank", d: `M${num(S / 2)} ${num(-rr)}A${num(rr)} ${num(rr)} 0 0 1 ${num(S / 2)} ${num(rr)}V${num(R)}A${num(R)} ${num(R)} 0 0 0 ${num(S / 2)} ${num(-R)}Z` },
      { id: "banking-west", feature: "banking", cls: "ky-ath-bank", d: `M${num(-S / 2)} ${num(rr)}A${num(rr)} ${num(rr)} 0 0 1 ${num(-S / 2)} ${num(-rr)}V${num(-R)}A${num(R)} ${num(R)} 0 0 0 ${num(-S / 2)} ${num(R)}Z` },
    );
    addParts(parts, indoorStraightParts(straight, numbers, fig.line));
  }
  const turf = infield === "none" || indoor ? undefined : { d: D.d, stripes: turfBands(-S / 2 - ARENA.turf, S / 2 + ARENA.turf, -R, R) };
  // The pitch inside the track: the options', else the size the ground's article publishes, else the international 105 by 68 m.
  const ground = groundById(o.ground);
  const groundPitch = ground === undefined || ground.pitchSize === "default" ? undefined : ({ ...ground.pitch, unit: "m" } as const);
  const spec = soccerSpec(o.athletics?.pitch ?? o.pitch ?? groundPitch, "m");
  let pitch: AthleticsPlan["pitch"] = infield === "pitch" && !indoor ? { spec, x: -spec.length / 2, y: -spec.width / 2 } : undefined;
  void lengthUnit;

  // The races: the starts and marks of each.
  const raceMarks: RaceMarks[] = [];
  const ctx = { oval, fig, lanes, straight, numbers, numberHeight: 0.95 };
  const sc = races.filter((r) => r.kind === "steeplechase");
  const raceIds = new Set<AthleticsRace>(races.map((r) => r.id));
  if (!raceIds.has(startRace) && (o.athletics?.start !== undefined || closeUp)) raceIds.add(startRace);
  for (const race of RACES) {
    if (!raceIds.has(race.id)) continue;
    if (race.kind === "steeplechase") continue;
    raceMarks.push(markRace(ctx, race));
  }
  let waterJump: WaterJump | undefined;
  if (sc.length > 0 && wj !== "none") {
    waterJump = wj;
    let first = true;
    for (const race of sc) {
      const made = steeplechaseParts(ctx, wj, race, first);
      first = false;
      addParts(parts, made.parts);
    }
  }
  for (const r of raceMarks) addParts(parts, r.parts);
  let startView: AthleticsPlan["startView"];
  if (closeUp) {
    const marks = raceMarks.find((r) => r.race.id === startRace);
    if (marks !== undefined) {
      const pivot = startPivot(oval, marks);
      const pts = startPoints(oval, marks, straight);
      const c = Math.cos(pivot.heading);
      const sn = Math.sin(pivot.heading);
      const rot = pts.map(([x, y]): [number, number] => [(x - pivot.x) * c + (y - pivot.y) * sn, -(x - pivot.x) * sn + (y - pivot.y) * c]);
      const xs = rot.map((p) => p[0]);
      const ys = rot.map((p) => p[1]);
      const side = marks.race.kind === "straight" ? 0.8 : 3;
      const win: MBox = { x0: Math.min(...xs) - (marks.race.kind === "straight" ? 7 : 9), x1: Math.max(...xs) + (marks.race.kind === "straight" ? 7 : 9), y0: Math.min(...ys) - side, y1: Math.max(...ys) + side };
      startView = { pivot, window: win };
      // The pitch is left out of a close-up that does not reach it.
      if (pitch !== undefined) {
        const corners = [[win.x0, win.y0], [win.x1, win.y0], [win.x1, win.y1], [win.x0, win.y1]].map(([x, y]) => [pivot.x + x * c - y * sn, pivot.y + x * sn + y * c]);
        const gx0 = Math.min(...corners.map((p) => p[0]));
        const gx1 = Math.max(...corners.map((p) => p[0]));
        const gy0 = Math.min(...corners.map((p) => p[1]));
        const gy1 = Math.max(...corners.map((p) => p[1]));
        if (gx1 < pitch.x || gx0 > pitch.x + pitch.spec.length || gy1 < pitch.y || gy0 > pitch.y + pitch.spec.width) pitch = undefined;
      }
      // On a bend the numbers painted on the track would be specks beside the fan of the starts: they become tags that read at the size of the view.
      if (marks.race.kind !== "straight") {
        // A tag's disc is 1.56 times its figure's height across and must sit inside a lane (1.22 m): the figure is 0.66 m, a disc of 1.03 m.
        const tag = 0.66;
        for (const d of marks.parts.digits) {
          if (d.id !== "start-number") continue;
          const back = tag * 0.78 + 0.35;
          const at = d.from === undefined ? [d.x, d.y] : [d.from[0] - d.from[2] * back, d.from[1] - d.from[3] * back];
          Object.assign(d, { h: tag, tag: true, x: at[0], y: at[1] });
        }
      }
    }
  }

  // The field events.
  const inf = indoor ? { parts: emptyParts(), facilities: [] as Facility[] } : infieldParts(oval, new Set(events));
  addParts(parts, inf.parts);

  const box: MBox = { x0: -S / 2 - Rout, y0: -Rout, x1: S / 2 + Rout, y1: Rout };
  let extent = grow(box, 1);
  const edgeStraight = R + straight.lanes * straight.lane;
  if (!indoor) extent = union([extent, { x0: straight.x0, y0: -Rout, x1: straight.x1, y1: edgeStraight }]);
  if (events.includes("long-jump") || events.includes("triple-jump")) extent = union([extent, jumpStrip()]);
  if (events.includes("javelin-throw")) extent = union([extent, ...inf.facilities.filter((f) => f.event === "javelin-throw").map((f) => f.box)].map((b) => ({ x0: Math.max(b.x0, -S / 2 - Rout - 6), y0: b.y0, x1: Math.min(b.x1, S / 2 + Rout + 6), y1: b.y1 })));
  extent = grow(extent, 0);

  const plan: AthleticsPlan = {
    sport: "athletics",
    league: league.id,
    indoor,
    figures: fig,
    oval,
    lanes,
    straight,
    track,
    infield,
    box,
    extent,
    areas: parts.areas,
    shapes: parts.shapes,
    digits: parts.digits,
    turf,
    pitch,
    facilities: inf.facilities,
    races: raceMarks,
    waterJump,
    events,
    lineWidth: fig.line,
    drawnLine: Math.max(fig.line, (box.x1 - box.x0) * 0.0009),
    ranges: {},
    marks: [],
    start: startRace,
    startView,
    numbers,
  };
  (plan as { ranges: Record<string, MRange> }).ranges = rangesOf(plan);
  plan.marks.push(...marksOf(plan));
  return plan;
}

/** The plan of one field event alone, at a large scale: its facility in its own frame (the athlete throws or jumps to the right from the origin), with the box round it as the playing surface. */
function layoutPlan(event: AthleticsFieldEvent, league: AthleticsLeague, oval: Oval, lanes: number, track: AthleticsTrackLook, numbers: boolean): AthleticsPlan {
  const lay = layoutOf(event);
  const box = grow(lay.box, 0);
  const width = box.x1 - box.x0;
  const plan: AthleticsPlan = {
    sport: "athletics",
    league: league.id,
    indoor: false,
    figures: league.dimensions,
    oval,
    lanes,
    straight: undefined,
    track,
    infield: "none",
    box,
    extent: box,
    areas: lay.parts.areas,
    shapes: lay.parts.shapes.map((sh) => (sh.kind !== "dot" && sh.kind !== "bar" && sh.cls === "ky-ath-s" ? { ...sh, least: Math.max(0.07, width * 0.0011) } : sh)),
    digits: [],
    turf: undefined,
    pitch: undefined,
    facilities: [lay.facility],
    races: [],
    waterJump: undefined,
    events: [event],
    lineWidth: 0.05,
    drawnLine: Math.max(0.05, width * 0.0016),
    ranges: {},
    marks: lay.marks,
    start: "400m",
    startView: undefined,
    numbers,
    layout: event,
  };
  return plan;
}

/** The union of the boxes of the facilities of one event on one side of the stadium. */
function facilityBox(plan: AthleticsPlan, event: AthleticsFieldEvent, side: "left" | "right" | "all"): MBox | undefined {
  const list = plan.facilities.filter((f) => f.event === event && (side === "all" || (side === "left" ? f.x < 0 : f.x >= 0)));
  return list.length === 0 ? undefined : grow(union(list.map((f) => f.box)), 1.5);
}

/** The named ranges of the plan, in metres. */
function rangesOf(plan: AthleticsPlan): Record<string, MRange> {
  const o = plan.oval;
  const S = o.straight;
  const R = o.radius;
  const Rout = plan.box.y1;
  const out: Record<string, MRange> = {};
  const outer = plan.indoor || plan.straight === undefined;
  const edge = outer ? R + plan.lanes * o.lane : R + (plan.straight as StraightPlan).lanes * (plan.straight as StraightPlan).lane;
  out.bend = { left: { x0: -S / 2 - Rout, y0: -Rout, x1: -S / 2, y1: Rout }, right: { x0: S / 2, y0: -Rout, x1: S / 2 + Rout, y1: Rout } };
  out["home-straight"] = outer ? { x0: -S / 2, y0: R - 1, x1: S / 2, y1: edge + 1 } : { x0: (plan.straight as StraightPlan).x0, y0: R - 1, x1: (plan.straight as StraightPlan).x1, y1: edge + 1 };
  out["back-straight"] = { x0: -S / 2, y0: -Rout, x1: S / 2, y1: -R + 1 };
  out.finish = { x0: S / 2 - 20, y0: R - 2, x1: S / 2 + 10, y1: edge + 2 };
  out.infield = { x0: -S / 2 - R, y0: -R, x1: S / 2 + R, y1: R };
  for (const e of FIELD_EVENT_IDS) {
    const left = facilityBox(plan, e, "left");
    const right = facilityBox(plan, e, "right");
    if (left !== undefined && right !== undefined) out[e] = { left, right };
    else if (left !== undefined || right !== undefined) out[e] = (left ?? right) as MBox;
  }
  // The water jump's pit, wherever the jump is (the steeplechase's lap is drawn only when a steeplechase is marked): the inside one by default.
  const wj = plan.waterJump ?? "inside";
  const pit = waterPitBox(plan.oval, wj);
  out["water-jump"] = grow(pit, 5);
  void laneEdge;
  void stadiumD;
  return out;
}

/** The parts of the plan to label. */
function marksOf(plan: AthleticsPlan): MMark[] {
  const o = plan.oval;
  const S = o.straight;
  const R = o.radius;
  const marks: MMark[] = [
    { id: "finish-line", x: S / 2, y: R + 0.6 * o.lane, side: "bottom" },
    { id: "kerb", x: -S / 4, y: -R, side: "top" },
    { id: "lane-lines", x: -S / 4, y: R + o.lane, side: "bottom" },
    { id: "bend", x: S / 2 + R * 0.7071 + 2, y: -R * 0.7071, side: "top" },
    { id: "straight", x: 0, y: -R - 3, side: "top" },
  ];
  if (plan.pitch !== undefined) marks.push({ id: "infield-pitch", x: 0, y: -plan.pitch.spec.width / 2, side: "top" });
  return marks;
}

export { WA_SHORT_TRACK, WA_STANDARD_TRACK };
