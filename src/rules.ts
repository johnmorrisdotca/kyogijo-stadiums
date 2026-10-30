// The rulebook as code: where a point on a surface lies in the sport's own terms. `zoneAt(sport, point, options)` answers with the zone (the offensive zone,
// the frontcourt, the attacking third, the infield, the red zone), the finer area in it (the crease, the paint, the six-yard box, the warning track,
// between the hashes) and every other area that holds, with the id of each. The geometry is the package's own: a rink's blue lines and creases from
// `rinkOf`, a court's keys and arcs from `courtOf`, a pitch's boxes from `soccerSpec`, a ballpark's fence from `fenceFor`, a field's end zones and hashes
// from `footballIn`. Nothing is drawn here, and no hand-made polygon stands in for a rule: where a rule has no figure of its own (the slot, the
// half-spaces) the package's zone sets (heat.zones.ts) are used, and a test holds the two to the same answer. A sport with no rules of its own here answers
// in the zone sets of its sport (`ZONE_SETS`).
//
// A point is a pair `[x, y]` or `{ x, y }` in the frame of `options.frame` (a provider's, or the drawing's own in `units`, feet by default). The team is
// taken to attack the right end of the surface as it is drawn wide; `attacking: "left"` says the numbers are of a team that attacks the left, and they are
// turned a half turn first, as the data layers do.
import { chooseLeague, courtOf, diamondOf, fieldOf, rinkOf } from "./leagues.ts";
import { footballIn, rulesFor } from "./eras.ts";
import { FEET_PER_METRE, MLB, NBA, fenceAt, footballLength } from "./geometry.ts";
import { NBA_COURT, type CourtSpec } from "./leagues/basketball.ts";
import { NHL_RINK, type RinkSpec } from "./leagues/hockey.ts";
import { diamondFence } from "./leagues/baseball.ts";
import { frameByName, toSurface, type Attacking, type Frame, type SurfaceSize } from "./frames.ts";
import "./frames.providers.ts";
import "./surfaces/soccer-providers.ts";
import { buildZoneSet, infieldReach, ZONE_SETS, ZONE_SET_IDS, type ZoneContext, type ZoneSet } from "./heat.zones.ts";
import { feetFence, lengthUnit } from "./common.ts";
import { fenceFor, heldPark, parkWallsIn, type Park } from "./parks.core.ts";
import { PARK_IDS_WITHOUT_WALLS } from "./parks.walls.ts";
import { frameSizeOf, outlineOf, type Outline } from "./outline.ts";
import { soccerSpec } from "./surfaces/soccer-spec.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import type { RuleId } from "./rules.types.ts";
import type { Language, Sport, SurfaceOptions } from "./types.ts";
import { FEET_PER, isUnit, type Unit } from "./units.ts";

export { RULE_IDS } from "./rules.types.ts";
export type { RuleId } from "./rules.types.ts";

/** A place: `[x, y]` or `{ x, y }`. */
export type PlaceLike = readonly [number, number] | { readonly x: number; readonly y: number };

/** What `zoneAt` and the predicates take besides the point: the surface's own options (the league, the season, the park, the pitch) and the frame the point is in. */
export interface ZoneOptions extends Partial<Pick<SurfaceOptions, "league" | "year" | "pitch" | "park" | "fence" | "units" | "sheet" | "net" | "field" | "pool" | "athletics" | "skating" | "language">> {
  /** The frame the point is in: the name of a frame (`nhl-api`, `opta`), a frame, or nothing for the drawing's own (feet, or `units`). */
  frame?: Frame | string;
  /** The size of the surface when the frame is a variable one, in place of the drawing's own. */
  size?: SurfaceSize;
  /** The end the point's team attacks, as the surface is drawn wide; `left` turns the numbers a half turn so that the team attacks right. */
  attacking?: Attacking;
}

/** What the rules say of a point. */
export interface ZoneAnswer {
  sport: Sport;
  /** The point on the surface, in feet in the drawing's wide frame, the team attacking the right. */
  at: [number, number];
  /** True when the point is on the surface, or on its edge. Off it, `zone`, `subzone` and `zones` are empty (a ballpark is the exception: its foul ground and the stands beyond the fence are zones). */
  inBounds: boolean;
  /** The zone the point is in: one of a partition of the surface, such as `offensive-zone`. */
  zone: string | undefined;
  /** The finer area in the zone, when there is one: `crease`, `paint`, `six-yard-box`, `warning-track`. */
  subzone: string | undefined;
  /** Every id that holds, the zone and the subzone first. */
  zones: string[];
  /** The zone of each of the package's zone sets for the sport (`ZONE_SETS`) that the point is in. */
  sets: Record<string, string>;
  /** The name of each id in `zones`, in the language asked for. */
  names: Record<string, string>;
}

interface Verdict {
  zone?: string;
  subzone?: string;
  flags: string[];
  names?: Record<string, string>;
}

type Judge = (x: number, y: number) => Verdict;

interface Ruled {
  sport: Sport;
  /** The league asked for, as given: it decides which of the governing bodies' words names a zone. */
  league: string | undefined;
  o: SurfaceOptions;
  outline: Outline;
  judge: Judge;
  language: Language;
  sets: () => ZoneSet[];
}

const PICK = ["league", "year", "pitch", "park", "fence", "units", "sheet", "net", "field", "pool", "athletics", "skating"] as const;
const cache = new Map<string, Ruled>();

const num = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function placeOf(point: PlaceLike): [number, number] {
  const xy: unknown = Array.isArray(point) ? point : [(point as { x: number }).x, (point as { y: number }).y];
  const [x, y] = xy as [unknown, unknown];
  if (!num(x) || !num(y)) throw new TypeError("a point is [x, y] or { x, y }, two finite numbers");
  return [x, y];
}

// ----- hockey

function rinkFigures(o: SurfaceOptions, league: ReturnType<typeof chooseLeague>["league"]): RinkSpec {
  if (league?.family === "hockey") return rinkOf(league, o.year);
  const era = rulesFor("nhl", o.year).rules;
  return { ...NHL_RINK, goalLine: era.goalLine, blueLine: era.blueLine, trapezoid: era.trapezoid };
}

function hockeyJudge(o: SurfaceOptions, league: ReturnType<typeof chooseLeague>["league"]): Judge {
  const rink = rinkFigures(o, league);
  const { length: L, width: W, goalLine: g, blueLine: blue } = rink;
  const mid = W / 2;
  const post = rink.net.width / 2;
  const dots = g + rink.endSpotFromGoalLine;
  const inner = rink.spotOffset - rink.circleRadius;
  const top = dots + rink.circleRadius;
  return (x, y) => {
    const flags: string[] = [];
    const zone = x < blue ? "defensive-zone" : x > L - blue ? "offensive-zone" : "neutral-zone";
    const local = x > L / 2 ? L - x : x;
    const dy = Math.abs(y - mid);
    const u = local - g;
    let sub: string | undefined;
    if (u >= 0 && dy <= rink.crease.halfWidth && Math.hypot(u, dy) <= rink.crease.radius) {
      flags.push("crease");
      sub = "crease";
    }
    if (u < 0) {
      flags.push("behind-goal-line");
      const t = rink.trapezoid;
      if (t !== null && local >= 0 && dy <= t.atGoalLine / 2 + ((g - local) / g) * ((t.atBoards - t.atGoalLine) / 2)) flags.push("trapezoid");
      sub = sub ?? "behind-goal-line";
    }
    // The slot, as the package's zone set defines it (heat.zones.ts, "nhl-slot"): the inner slot from the goal line out to the dots between the posts and the circles' inner edges, the outer slot from the dots to the circles' tops.
    if (local >= g && local < dots && dy <= post + ((local - g) / (dots - g)) * (inner - post)) {
      flags.push("inner-slot", "slot");
      sub = sub ?? "inner-slot";
    } else if (local >= dots && local <= top && dy <= inner) {
      flags.push("outer-slot", "slot");
      sub = sub ?? "outer-slot";
    }
    if (Math.hypot(local - dots, dy - rink.spotOffset) <= rink.circleRadius) {
      flags.push("faceoff-circle");
      sub = sub ?? "faceoff-circle";
    } else if (Math.hypot(x - L / 2, y - mid) <= rink.circleRadius) {
      flags.push("centre-circle");
      sub = sub ?? "centre-circle";
    }
    return { zone, subzone: sub, flags };
  };
}

// ----- basketball

/** The court's figures in a season, with the NBA's own history laid over the NBA's court. */
function courtFigures(o: SurfaceOptions, league: ReturnType<typeof chooseLeague>["league"]): CourtSpec {
  if (league?.family === "basketball") return courtOf(league, o.year);
  const era = rulesFor("nba", o.year).rules;
  const three = era.threePoint === null ? null : { radius: era.threePoint.radius, sideInset: NBA_COURT.threePoint?.sideInset ?? NBA.threePoint.sideInset };
  return { ...NBA_COURT, laneWidth: era.keyWidth, threePoint: three, restricted: era.restrictedArea ? NBA_COURT.restricted : null };
}

/** The three-point line: the straight lines' inset from the sidelines and where the arc meets them, from the baseline. `null` for a court with no line. */
function threeLine(court: CourtSpec): { radius: number; inset: number; join: number } | null {
  if (court.threePoint === null) return null;
  const { radius, sideInset } = court.threePoint;
  const half = court.width / 2 - sideInset;
  return { radius, inset: sideInset, join: court.basket + Math.sqrt(Math.max(0, radius * radius - half * half)) };
}

function basketJudge(o: SurfaceOptions, league: ReturnType<typeof chooseLeague>["league"]): Judge {
  const court = courtFigures(o, league);
  const { length: L, width: W } = court;
  const mid = W / 2;
  const three = threeLine(court);
  return (x, y) => {
    const flags: string[] = [];
    const front = x > L / 2;
    const zone = front ? "frontcourt" : "backcourt";
    // The basket the team attacks is at the right end: a point is measured from it wherever it lies on the court.
    const local = L - x;
    const dy = y - mid;
    const dist = Math.hypot(local - court.basket, dy);
    let isThree = false;
    let corner = false;
    if (three !== null) {
      if (local <= three.join) {
        isThree = Math.abs(dy) > mid - three.inset;
        corner = isThree;
      } else isThree = dist > three.radius;
    }
    let sub: string | undefined;
    if (front) {
      // The lane may be wider at the baseline than at the free-throw line (a trapezoid): half its width at this distance from the baseline.
      const end = court.laneEndWidth ?? court.laneWidth;
      const half = (court.freeThrowLine <= 0 ? court.laneWidth : end + ((court.laneWidth - end) * Math.min(Math.max(local, 0), court.freeThrowLine)) / court.freeThrowLine) / 2;
      if (court.restricted !== null && dist <= court.restricted) sub = "restricted-area";
      else if (local <= court.freeThrowLine && Math.abs(dy) <= half) sub = "paint";
      else if (isThree) sub = corner ? (dy < 0 ? "corner-three-left" : "corner-three-right") : "above-the-break";
      else sub = "mid-range";
      if (court.restricted !== null && dist <= court.restricted) flags.push("restricted-area");
      if (local <= court.freeThrowLine && Math.abs(dy) <= half) flags.push("paint");
    }
    if (isThree) flags.push("three-point");
    if (front && sub !== undefined && !flags.includes(sub)) flags.push(sub);
    return { zone, subzone: sub, flags };
  };
}

// ----- soccer

function soccerJudge(o: SurfaceOptions, outline: Outline): Judge {
  const spec = soccerSpec(o.pitch, o.units === undefined ? "m" : lengthUnit(o));
  const L = outline.box.w;
  const W = outline.box.h;
  const mid = W / 2;
  const k = FEET_PER_METRE;
  const pd = spec.penaltyDepth * k;
  const pw = spec.penaltyWidth * k;
  const gd = spec.goalAreaDepth * k;
  const gw = (spec.goalAreaWidth > 0 ? spec.goalAreaWidth : spec.goalWidth) * k;
  const spot = spec.spot * k;
  const arc = spec.arcRadius * k;
  const lanes = [(W - pw) / 2, (W - gw) / 2, (W + gw) / 2, (W + pw) / 2];
  const names = ["wing-left", "half-space-left", "central-corridor", "half-space-right", "wing-right"];
  return (x, y) => {
    const flags: string[] = [];
    const zone = x < L / 3 ? "defensive-third" : x > (2 * L) / 3 ? "attacking-third" : "middle-third";
    const attacked = x > L / 2;
    const local = attacked ? L - x : x;
    const dy = Math.abs(y - mid);
    const own = attacked ? "" : "own-";
    const inArea = spec.area === "semicircle" ? Math.hypot(local, y - mid) <= pd : local <= pd && dy <= pw / 2;
    let sub: string | undefined;
    if (gd > 0 && spec.goalAreaWidth > 0 && local <= gd && dy <= gw / 2) {
      flags.push(`${own}six-yard-box`);
      sub = `${own}six-yard-box`;
    }
    if (inArea) {
      flags.push(`${own}penalty-area`);
      sub = sub ?? `${own}penalty-area`;
    } else if (spot > 0 && arc > 0 && local <= spot + arc && Math.hypot(local - spot, y - mid) <= arc) {
      // The D: the part of the penalty mark's circle outside the penalty area.
      flags.push(`${own}penalty-arc`);
      sub = sub ?? `${own}penalty-arc`;
    }
    // Left and right are the attacker's: facing the right end, left is the top of the drawing.
    const lane = lanes.filter((edge) => y >= edge).length;
    flags.push(names[lane]);
    sub = sub ?? names[lane];
    return { zone, subzone: sub, flags };
  };
}

// ----- baseball

/** The wall height at a bearing: the stretch of the park's fence that covers it in the season, in feet, or `null` where the park's data holds none. */
export function wallHeightAt(park: Park, angle: number, year?: number): number | null {
  const found = parkWallsIn(park, year).filter((wall) => angle >= wall.from && angle <= wall.to);
  if (found.length === 0) return null;
  // Where stretches overlap (a short wall inside a long one), the narrower stretch is the more particular.
  found.sort((a, b) => a.to - a.from - (b.to - b.from));
  return found[0].height_ft;
}

function baseJudge(o: SurfaceOptions, league: ReturnType<typeof chooseLeague>["league"]): Judge {
  const generic = league?.family === "baseball" ? diamondFence(diamondOf(league, o.year)) : undefined;
  const points = fenceFor(heldPark(o.park), feetFence(o.fence, lengthUnit(o)), o.year, generic);
  const track = heldPark(o.park)?.track_ft ?? MLB.warningTrack;
  return (x, y) => {
    const flags: string[] = [];
    // The foul lines are the fair territory's edges, and a ball on one is fair: fair is out from home plate between them.
    const fair = y < 0 && Math.abs(x) <= -y;
    if (!fair) return { zone: "foul-territory", flags: ["foul-territory"] };
    flags.push("fair-territory");
    const angle = (Math.atan2(x, -y) * 180) / Math.PI;
    const r = Math.hypot(x, y);
    const fence = fenceAt(points, angle);
    const sector = angle < -15 ? 0 : angle > 15 ? 2 : 1;
    if (r > fence) return { zone: "over-the-wall", subzone: ["left-field", "centre-field", "right-field"][sector], flags: ["fair-territory", "over-the-wall"] };
    if (r <= infieldReach(angle)) {
      const side = ["third-base-side", "middle-infield", "first-base-side"][sector];
      flags.push("infield", side);
      return { zone: "infield", subzone: side, flags };
    }
    const field = ["left-field", "centre-field", "right-field"][sector];
    flags.push("outfield", field);
    let sub = field;
    if (r >= fence - track) {
      flags.push("warning-track");
      sub = "warning-track";
    }
    return { zone: "outfield", subzone: sub, flags };
  };
}

// ----- football

function footballJudge(o: SurfaceOptions, sport: "nfl" | "cfl" | "ifaf", league: ReturnType<typeof chooseLeague>["league"]): Judge {
  const spec = league?.family === "football" ? fieldOf(league, o.year) : footballIn(sport, o.year);
  const L = footballLength(spec);
  const ez = spec.endZone;
  const W = spec.width;
  const red = 60;
  return (x, y) => {
    const flags: string[] = [];
    let zone: string;
    if (x < ez) zone = "own-end-zone";
    else if (x > L - ez) zone = "opponent-end-zone";
    else if (x >= L - ez - red) zone = "red-zone";
    else zone = x < L / 2 ? "own-half" : "opponent-half";
    flags.push(zone);
    if (zone.endsWith("end-zone")) flags.push("end-zone");
    if (zone === "red-zone") flags.push("red-zone");
    let sub: string;
    if (y >= spec.hash && y <= W - spec.hash) sub = "between-the-hashes";
    // Facing the right end, the offence's left is the top of the drawing.
    else sub = y < spec.hash ? "outside-hashes-left" : "outside-hashes-right";
    flags.push(sub);
    return { zone, subzone: sub, flags };
  };
}

// ----- the package's own zone sets, for every other sport

function contextFor(o: SurfaceOptions, outline: Outline, language: Language): ZoneContext {
  return { o, outline, direction: "right", end: "both", los: undefined, bats: undefined, words: KYOGIJO_STRINGS[language].layers.zones };
}

function setsFor(sport: Sport, o: SurfaceOptions, outline: Outline, language: Language): ZoneSet[] {
  const out: ZoneSet[] = [];
  for (const id of ZONE_SET_IDS) {
    if (!ZONE_SETS[id].sports.includes(sport)) continue;
    // The sets a sport has two ends for are built for both; a set the sport's options cannot make (a pool set for a pool with none) is left out.
    try {
      out.push(buildZoneSet(id, contextFor(o, outline, language)));
    } catch {
      // A set that cannot be made for these options has no say.
    }
  }
  return out;
}

function setsJudge(sets: () => ZoneSet[]): Judge {
  return (x, y) => {
    const found: { id: string; name: string }[] = [];
    for (const set of sets()) {
      const i = set.which(x, y);
      if (i >= 0) found.push({ id: set.zones[i].id, name: set.zones[i].name });
    }
    return { zone: found[0]?.id, subzone: found[1]?.id, flags: found.map((f) => f.id), names: Object.fromEntries(found.map((f) => [f.id, f.name])) };
  };
}

function ruled(sport: Sport, options: ZoneOptions): Ruled {
  const language: Language = options.language === "ja" ? "ja" : "en";
  const surface: Record<string, unknown> = { sport };
  for (const key of PICK) if (options[key] !== undefined) surface[key] = options[key];
  const key = JSON.stringify([surface, language]);
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const o = surface as unknown as SurfaceOptions;
  const { sport: drawn, league } = chooseLeague(o);
  const outline = outlineOf({ ...o, sport: drawn });
  let sets: ZoneSet[] | undefined;
  const lazy = (): ZoneSet[] => (sets ??= setsFor(drawn, { ...o, sport: drawn }, outline, language));
  let judge: Judge;
  switch (drawn) {
    case "nhl":
      judge = hockeyJudge(o, league);
      break;
    case "nba":
      judge = basketJudge(o, league);
      break;
    case "soccer":
      judge = soccerJudge(o, outline);
      break;
    case "mlb":
      judge = baseJudge(o, league);
      break;
    case "nfl":
    case "cfl":
    case "ifaf":
      judge = footballJudge(o, drawn, league);
      break;
    default:
      judge = setsJudge(lazy);
  }
  const made: Ruled = { sport: drawn, league: typeof options.league === "string" ? options.league : undefined, o: { ...o, sport: drawn }, outline, judge, language, sets: lazy };
  if (cache.size > 200) cache.clear();
  cache.set(key, made);
  return made;
}

/** The point on the surface, in feet in the drawing's wide frame with the team attacking the right. */
function onSurface(r: Ruled, point: PlaceLike, options: ZoneOptions): [number, number] {
  const [px, py] = placeOf(point);
  const unit: Unit = options.units !== undefined && isUnit(options.units) ? options.units : "ft";
  if (options.frame === undefined) {
    const k = FEET_PER[unit];
    const p: [number, number] = [px * k, py * k];
    return options.attacking === "left" ? [r.outline.box.x * 2 + r.outline.box.w - p[0], r.outline.box.y * 2 + r.outline.box.h - p[1]] : p;
  }
  const frame = typeof options.frame === "string" ? frameByName(options.frame) : options.frame;
  const size = options.size ?? frameSizeOf(r.o, r.outline.box);
  const sized = size === undefined ? undefined : { length: size.length, width: size.width, unit: "ft" as const };
  const [x, y] = toSurface([[px, py]], { from: frame, size: sized ?? options.size, attacking: options.attacking })[0];
  return [x, y];
}

/** The leagues whose rule book words some zones another way than the NBA's: FIBA's, which the Japan Basketball Association follows. */
const FIBA_WORDS: ReadonlySet<string> = new Set(["fiba"]);

const nameOf = (id: string, language: Language, own?: Record<string, string>, league?: string): string => {
  if (own?.[id] !== undefined) return own[id];
  const words = KYOGIJO_STRINGS[language];
  if (league !== undefined && FIBA_WORDS.has(league) && words.rulesFiba[id as RuleId] !== undefined) return words.rulesFiba[id as RuleId] as string;
  return (words.rules as Record<string, string>)[id] ?? id;
};

/**
 * Where a point lies by the rules of a sport: the zone, the area in it and every other area that holds, each by id and name. Hockey answers in the
 * offensive, neutral and defensive zones with the crease, the trapezoid, the slot, the face-off circles and behind the goal line; basketball in the
 * frontcourt and backcourt with the restricted area, the paint, the mid-range, the corner threes and the arc; soccer in thirds with the six-yard box,
 * the penalty area, the D, the half-spaces and the wings; baseball in the infield, the outfield, foul territory, the warning track and over the
 * wall by the park's own fence; football in the end zones, the halves, the red zone and between the hashes. Every other sport answers in its zone sets.
 * @example
 * ```ts
 * import { zoneAt } from "@johnmorrisdotca/kyogijo-stadiums/zones";
 * // The NHL API's (69, 22) is the face-off dot in the right end zone: the offensive zone, inside a face-off circle.
 * const dot = zoneAt("nhl", [69, 22], { frame: "nhl-api" });
 * console.log(dot.zone, dot.subzone, dot.zones.includes("faceoff-circle"));
 * // offensive-zone faceoff-circle true
 * ```
 */
export function zoneAt(sport: Sport, point: PlaceLike, options: ZoneOptions = {}): ZoneAnswer {
  const r = ruled(sport, options);
  return answer(r, onSurface(r, point, options));
}

/** `zoneAt` for a place already on the surface: feet in the drawing's wide frame, the team attacking the right. What a drawing's click is asked with (pointer.ts). */
export function zoneAtSurface(sport: Sport, at: readonly [number, number], options: ZoneOptions = {}): ZoneAnswer {
  return answer(ruled(sport, options), [at[0], at[1]]);
}

function answer(r: Ruled, at: [number, number]): ZoneAnswer {
  const inBounds = r.outline.contains(at[0], at[1]);
  const open = r.sport === "mlb" || inBounds;
  const v = open ? r.judge(at[0], at[1]) : { flags: [] as string[] };
  const zones = [...new Set([...(v.zone === undefined ? [] : [v.zone]), ...(v.subzone === undefined ? [] : [v.subzone]), ...v.flags])];
  const sets: Record<string, string> = {};
  if (open) {
    for (const set of r.sets()) {
      const i = set.which(at[0], at[1]);
      if (i >= 0) sets[set.id] = set.zones[i].id;
    }
  }
  const names: Record<string, string> = {};
  for (const id of zones) names[id] = nameOf(id, r.language, v.names, r.league);
  return { sport: r.sport, at, inBounds, zone: v.zone, subzone: v.subzone, zones, sets, names };
}

/**
 * A function from a place on the surface (feet, the drawing's wide frame, the team attacking the right) to the id of the finest zone it lies in: what a data
 * layer's marks carry as `data-zone`. Built once for the options of a drawing; `undefined` where the sport has no zone there.
 */
export function zoneResolver(sport: Sport, options: ZoneOptions = {}): (x: number, y: number) => string | undefined {
  const r = ruled(sport, options);
  return (x, y) => {
    if (r.sport !== "mlb" && !r.outline.contains(x, y)) return undefined;
    const v = r.judge(x, y);
    return v.subzone ?? v.zone;
  };
}

/**
 * The name of a zone id in a language: the rules engine's own ids have words in both; any other id (a zone set's) comes back as it is. A court of `league: "fiba"` has the words of FIBA's rule book, which the
 * Japan Basketball Association follows: the restricted area is the no-charge semicircle (ノーチャージセミサークル); in the NBA and the leagues that follow its words it is the restricted area (リストリクテッドエリア).
 */
export const zoneName = (id: string, language: Language = "en", league?: string): string => nameOf(id, language === "ja" ? "ja" : "en", undefined, league);

const holds = (sport: Sport, id: string) => (point: PlaceLike, options: ZoneOptions = {}): boolean => zoneAt(sport, point, options).zones.includes(id);

/** True when a shot from the place would count three: beyond the three-point line (the arc, or past the straight lines at the sidelines), at the basket the team attacks. */
export const isThreePointer = holds("nba", "three-point");
/** True when the place is in the paint (the free-throw lane, the key), outside the restricted area. */
export const inPaint = (point: PlaceLike, options: ZoneOptions = {}): boolean => {
  const a = zoneAt("nba", point, options);
  return a.zones.includes("paint");
};
/** True when the place is in the restricted area under the basket. */
export const inRestrictedArea = holds("nba", "restricted-area");
/** True when the place is in the slot (the package's definition: the inner and outer slot in front of the net, between the face-off circles), at either end. */
export const inSlot = holds("nhl", "slot");
/** True when the place is in a goal crease. */
export const inCrease = holds("nhl", "crease");
/** True when the place is in a penalty area, at the end the team attacks or the one it defends. */
export const inPenaltyArea = (point: PlaceLike, options: ZoneOptions = {}): boolean => {
  const a = zoneAt("soccer", point, options);
  return a.zones.includes("penalty-area") || a.zones.includes("own-penalty-area");
};
/** True when the place is in a goal area (the six-yard box), at either end. */
export const inSixYardBox = (point: PlaceLike, options: ZoneOptions = {}): boolean => {
  const a = zoneAt("soccer", point, options);
  return a.zones.includes("six-yard-box") || a.zones.includes("own-six-yard-box");
};
/** True when the place is in the red zone: inside the opponent's 20-yard line. */
export const inRedZone = holds("nfl", "red-zone");
/** True when the place is between the hash marks. */
export const betweenHashes = holds("nfl", "between-the-hashes");
/** True when the place is in fair territory: between the foul lines, which are fair themselves. */
export const isFair = holds("mlb", "fair-territory");
/** True when the place, in fair territory, lies beyond the park's fence: where a ball came down over the wall. `park` is a key of `PARKS`. */
export const overWall = (point: PlaceLike, options: ZoneOptions = {}): boolean => zoneAt("mlb", point, options).zones.includes("over-the-wall");
/** True when the place is on the warning track. */
export const onWarningTrack = holds("mlb", "warning-track");

/** What a home-run decision rests on. */
export interface HomeRunVerdict {
  /** True: a home run. False: in play or foul. `undefined`: it cannot be told, because the ball was over the fence and its height was given but the park holds no wall height there. */
  homeRun: boolean | undefined;
  /** The place is in fair territory. */
  fair: boolean;
  /** How far from home plate, and the fence's distance in that direction (at the bearing), in feet. */
  distance: number;
  fence: number;
  /** The bearing from dead centre, in degrees (negative to left field). */
  angle: number;
  /** The wall's height at the bearing in feet, or `null` where the park's data holds none. */
  wall: number | null;
  /** True when the park has wall heights at all; `isHomeRun` reports it so that a caller can say the data is missing. */
  wallData: boolean;
  /** Why, in a word: `foul`, `short` (the ball came down inside the fence), `over` (beyond the fence), `cleared` or `struck-wall` (the given height did not clear the wall), `unknown-wall`. */
  reason: "foul" | "short" | "over" | "cleared" | "struck-wall" | "unknown-wall";
}

/** What a caller can give about the ball. */
export interface HomeRunOptions extends ZoneOptions {
  /** The height of the ball in feet as it crossed the fence's line. Without it, a ball that came down beyond the fence in fair territory is a home run. */
  height?: number;
}

/**
 * The ballparks whose wall heights the package holds nowhere in their fence: of the 94 parks, the 35 whose article gives heights have them for some stretch,
 * and for the rest the height is not known here, so a decision that needs it is undecided (`homeRun: undefined`), never guessed.
 */
export const PARKS_WITHOUT_WALL_HEIGHTS: readonly string[] = Object.freeze([...PARK_IDS_WITHOUT_WALLS]);

/**
 * Whether a ball is a home run, from the park's own fence: the fence's distance at the bearing and, when the height of the ball is given, the wall's height there
 * (`wall` data of the park: the stretches of fence with their heights). A ball in fair territory that came down beyond the fence is a home run; one that was
 * lower than the wall where it crossed struck the wall and is in play. Where the park holds no height for the bearing the answer to a question that needs it
 * is `homeRun: undefined`, and `wallData` says whether the park has any heights at all. `park` is a key of `PARKS` (or a park); the place is in the frame of `options.frame`
 * (`retrosheet` and `mlbam` are the usual) or the drawing's own.
 * @example
 * ```ts
 * import { homeRun } from "@johnmorrisdotca/kyogijo-stadiums/zones";
 * // Fenway Park's Green Monster is 37 feet 2 inches high, 310 feet down the line in left.
 * console.log(homeRun("fenway-park", [-250, 250], { frame: "retrosheet", height: 30 }).reason, homeRun("fenway-park", [-250, 250], { frame: "retrosheet", height: 40 }).reason);
 * // struck-wall cleared
 * ```
 */
export function homeRun(park: string | Park, point: PlaceLike, options: HomeRunOptions = {}): HomeRunVerdict {
  const found = typeof park === "string" ? heldPark(park) : park;
  if (found === undefined) throw new RangeError(`Unknown park "${String(park)}": use a key of PARKS`);
  const o = { ...options, park: found.id };
  const r = ruled("mlb", o);
  const [x, y] = onSurface(r, point, o);
  const fair = y < 0 && Math.abs(x) <= -y;
  const angle = y < 0 ? (Math.atan2(x, -y) * 180) / Math.PI : 0;
  const distance = Math.hypot(x, y);
  const fence = fenceAt(fenceFor(found, feetFence(o.fence, lengthUnit(o)), o.year), Math.max(-45, Math.min(45, angle)));
  const wall = fair ? wallHeightAt(found, angle, o.year) : null;
  const wallData = (found.walls ?? []).length > 0;
  const base = { fair, distance, fence, angle, wall, wallData };
  if (!fair) return { homeRun: false, reason: "foul", ...base };
  if (distance <= fence) return { homeRun: false, reason: "short", ...base };
  if (options.height === undefined || !num(options.height)) return { homeRun: true, reason: "over", ...base };
  if (wall === null) return { homeRun: undefined, reason: "unknown-wall", ...base };
  return options.height > wall ? { homeRun: true, reason: "cleared", ...base } : { homeRun: false, reason: "struck-wall", ...base };
}

/** `homeRun` as a yes or no: `true` for a home run, `false` for foul, in play or the wall struck, `undefined` where the park's wall height is missing and the decision needs it. */
export const isHomeRun = (park: string | Park, point: PlaceLike, options: HomeRunOptions = {}): boolean | undefined => homeRun(park, point, options).homeRun;
