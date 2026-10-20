// What stands on a surface, in 3D: `uprightsFor` reads the options as `drawKyogijo` does (the sport, the league, the season, the park) and says what stands on the
// surface, where and how high, as planes in the drawing's own frame (x along the surface and y across it, in feet, z the height above it). Pure: no page, no
// stylesheet. `describeUprights` says the same in words, for a reader who cannot see it.
import { courtFor, courtGeometry, isNetSport } from "./court.ts";
import { drawingId, feetFence, lengthUnit } from "./common.ts";
import { drawKyogijo, pitchOf } from "./draw.ts";
import { rulesFor, footballIn } from "./eras.ts";
import { fieldPlan, isFieldSport } from "./fields.ts";
import { footballLength } from "./geometry.ts";
import { diamondFence } from "./leagues/baseball.ts";
import { NBA_COURT } from "./leagues/basketball.ts";
import { NHL_RINK } from "./leagues/hockey.ts";
import { chooseLeague, courtOf, diamondOf, fieldOf, rinkOf } from "./leagues.ts";
import { fenceFor, parkById, parkWallsIn } from "./parks.ts";
import { fenceOutline } from "./surfaces/baseball.ts";
import { KYOGIJO_STRINGS, fill } from "./strings.ts";
import { soccerSpec } from "./surfaces/soccer-spec.ts";
import { thinnest, type Plane, type Upright, type UprightKind } from "./turn.kit.ts";
import { scoreboard } from "./uprights.board.ts";
import { ballparkUprights, fieldUprights, footballUprights, soccerUprights } from "./uprights.fields.ts";
import { netUprights } from "./uprights.net.ts";
import { isPoolSport, poolPlan, feet as poolFeet } from "./pool.ts";
import { poolUprights } from "./uprights.pools.ts";
import { athleticsUprights, skatingUprights } from "./uprights.track.ts";
import { budoUprights } from "./uprights.budo.ts";
import { isBudoSport, isMatSport } from "./budo/plan.ts";
import { courtUprights, rinkUprights } from "./uprights.rinks.ts";
import { convertLength, type Unit } from "./units.ts";
import { sheetFor } from "./sheet.ts";
import { roomVenue } from "./venue.room.ts";
import { NO_VENUE, standsVenue, type VenueBuild } from "./venue.ts";
import type { Language, ScoreOptions, SurfaceOptions } from "./types.ts";

/** What can be asked of the uprights. */
export interface UprightOptions {
  /** Volleyball: the net at the men's height (2.43 m, the default) or the women's (2.24 m). */
  netHeight?: "men" | "women";
  /** Where the score of a score drawing goes: `board` (the default) hangs it up as a scoreboard (over the middle of a court or a rink, behind an end of a field) and takes the panel off the floor; `floor` leaves it on the floor. */
  score?: "board" | "floor";
  /** Leave the boards and the glass off a rink, and the walls and fence off a padel, squash or racquetball court, so that it can be seen into. On by default. */
  boards?: boolean;
  /** Only these kinds of thing; every kind the surface has when missing. */
  only?: readonly UprightKind[];
  /** The venue round the surface: the stands of its crowd raised, their roof if asked, a dojo's walls with their doors and windows, its dais, banner, balconies and the edge of its mats. Off here when missing: `buildTurn` turns it on for a drawing with a crowd or a dojo. `id` is the prefix of the ids of the patterns it uses. */
  venue?: VenueBuild;
}

/** What stands on a surface. */
export interface Uprights {
  items: Upright[];
  /** How far the surface itself stands over the ground, in feet: a table tennis table's top, 0 on every other surface. */
  lift: number;
  /** The thinnest line or strip drawn on this surface, in feet. */
  thin: number;
  /** The playing surface itself in feet, the part the view is fitted to (the ground round it may run out of the picture): `undefined` for a surface with no uprights, which is fitted whole. */
  area?: { x0: number; y0: number; x1: number; y1: number };
  /** True when the view is fitted to the whole floor drawing, not to `area` (which is then only where the score board goes): a raised platform stands in a floor that must not be cut at any angle. */
  whole?: boolean;
  /** The patterns the venue's planes are drawn with (the contents of an SVG `defs`), when it has any. */
  defs?: string;
  /** How far the venue reaches beyond the surface, in feet, when it has one: the ground a floor needs for it to stand on. */
  reach?: number;
}

/** All the planes of all the things. */
export const planesOf = (u: Pick<Uprights, "items">): Plane[] => u.items.flatMap((item) => item.planes);

/** The unit each sport's rulebook gives its heights in, when the options name none. */
const RULEBOOK_UNIT: Partial<Record<string, Unit>> = { volleyball: "m", badminton: "m", tabletennis: "m", padel: "m", squash: "m", athletics: "m", skating: "m", judo: "m", karate: "m", kendo: "m", sumo: "m", kyudo: "m", dojo: "m", mma: "ft", boxing: "ft", wrestling: "m", swimming: "m", waterpolo: "m", diving: "m", artisticswimming: "m", sepaktakraw: "m", teqball: "m", roundnet: "m", netball: "m", soccer: "m", handball: "m", fieldhockey: "m", rugby: "m", afl: "m", gaelic: "m" };

/** What stands on the surface the options draw: nothing on a curling sheet, which is flat. */
export function uprightsFor(o: SurfaceOptions, settings: UprightOptions = {}): Uprights {
  const { sport, league } = chooseLeague(o);
  const unit = lengthUnit(o);
  let items: Upright[] = [];
  let lift = 0;
  let thin = 0.2;
  let area: Uprights["area"];
  let whole = false;
  if (sport === "nfl" || sport === "cfl" || sport === "ifaf") {
    const spec = league?.family === "football" ? fieldOf(league, o.year) : footballIn(sport, o.year);
    const shape = league?.family === "football" || sport === "ifaf" ? "slingshot" : rulesFor(sport, o.year).rules.postShape;
    thin = thinnest(footballLength(spec), spec.width);
    area = { x0: 0, y0: 0, x1: footballLength(spec), y1: spec.width };
    // Over the ground: the NFL's 10 + 35 ft, the CFL's 40 ft, and the NCAA's least 30 ft for the rest.
    items = footballUprights(spec, shape, league !== undefined ? 30 : sport === "nfl" ? 45 : sport === "cfl" ? 40 : 30, thin);
  } else if (sport === "nhl") {
    const rink = league?.family === "hockey" ? rinkOf(league, o.year) : NHL_RINK;
    const goalLine = league?.family === "hockey" ? rink.goalLine : rulesFor("nhl", o.year).rules.goalLine;
    thin = thinnest(rink.length, rink.width);
    area = { x0: 0, y0: 0, x1: rink.length, y1: rink.width };
    items = rinkUprights(rink, goalLine, thin, settings.boards !== false);
  } else if (sport === "nba") {
    const court = league?.family === "basketball" ? courtOf(league, o.year) : NBA_COURT;
    thin = thinnest(court.length, court.width);
    area = { x0: 0, y0: 0, x1: court.length, y1: court.width };
    items = courtUprights(court, thin, league?.id === "fiba");
  } else if (sport === "mlb") {
    const diamond = league?.family === "baseball" ? diamondOf(league, o.year) : undefined;
    const park = parkById(o.park);
    const points = fenceFor(park, feetFence(o.fence, unit), o.year, diamond === undefined ? undefined : diamondFence(diamond));
    thin = 0.4;
    items = ballparkUprights(points, park === undefined ? [] : parkWallsIn(park, o.year), thin);
    // The surface is the field out to the fence and the backstop behind home plate.
    const out = fenceOutline(points, 3).map(([u, v]) => [u, -v] as const);
    area = { x0: Math.min(...out.map((p) => p[0])), x1: Math.max(...out.map((p) => p[0])), y0: Math.min(...out.map((p) => p[1])), y1: 70 };
  } else if (sport === "soccer") {
    const spec = soccerSpec(pitchOf(o), o.units === undefined ? "m" : unit);
    thin = thinnest(spec.length * 3.2808, spec.width * 3.2808);
    area = { x0: 0, y0: 0, x1: spec.length * 3.2808, y1: spec.width * 3.2808 };
    items = soccerUprights(spec, o.cornerFlags !== false, thin);
  } else if (isNetSport(sport)) {
    const plan = courtFor({ ...o, sport });
    const geo = courtGeometry(plan);
    thin = thinnest(geo.length, geo.width);
    area = { x0: 0, y0: 0, x1: geo.length, y1: geo.width };
    const built = netUprights(plan, geo, { netHeight: settings.netHeight, boards: settings.boards }, thin);
    items = built.items;
    lift = built.lift;
  } else if (isPoolSport(sport)) {
    const plan = poolPlan({ sport, pool: o.pool });
    const [w, h] = [poolFeet(plan.length), poolFeet(plan.width)];
    thin = thinnest(w, h);
    area = { x0: 0, y0: 0, x1: w, y1: h };
    items = poolUprights({ ...o, sport } as SurfaceOptions, thin).items;
  } else if (sport === "athletics") {
    const built = athleticsUprights({ ...o, sport }, 0.3);
    area = built.area;
    thin = thinnest(area.x1, area.y1);
    items = athleticsUprights({ ...o, sport }, thin).items;
  } else if (sport === "skating") {
    const built = skatingUprights({ ...o, sport }, 0.3);
    area = built.area;
    thin = thinnest(area.x1, area.y1);
    items = skatingUprights({ ...o, sport }, thin).items;
  } else if (isMatSport(sport)) {
    const built = budoUprights({ ...o, sport }, 0.3);
    area = built.area;
    thin = thinnest(area.x1, area.y1);
    items = budoUprights({ ...o, sport }, thin).items;
    lift = built.lift;
    whole = built.whole;
  } else if (isFieldSport(sport)) {
    const plan = fieldPlan({ ...o, sport });
    thin = thinnest(plan.length, plan.width);
    area = { x0: 0, y0: 0, x1: plan.length, y1: plan.width };
    items = fieldUprights(plan, thin);
  }
  if (sport === "curling") {
    const sheet = sheetFor(o).spec;
    thin = thinnest(sheet.length, sheet.width);
    area = { x0: 0, y0: 0, x1: sheet.length, y1: sheet.width };
  }
  // The venue: the stands and the room, raised. A dojo's own walls are the room's, with their doors and windows.
  let defs = "";
  let reach = 0;
  if (settings.venue !== undefined) {
    const stands = standsVenue(o, settings.venue, lift);
    const room = isBudoSport(sport) ? roomVenue({ ...o, sport } as SurfaceOptions, settings.venue, lift) : NO_VENUE;
    if (room.items.some((item) => item.kind === "walls")) items = items.filter((item) => item.kind !== "walls");
    items.push(...stands.items, ...room.items);
    defs = stands.defs + room.defs;
    reach = Math.max(stands.reach, room.reach);
  }
  // The score, hung up: the badge on a board that turns to face the eye.
  const scored = (o as Partial<ScoreOptions>).home !== undefined && (o as Partial<ScoreOptions>).away !== undefined && (o as Partial<ScoreOptions>).size !== "badge";
  if (scored && settings.score !== "floor" && area !== undefined) {
    const board = scoreboard(drawKyogijo({ ...o, size: "badge", style: "none", id: `${drawingId(o)}-board` }), sport, area, thin);
    if (board !== undefined) items.push(board);
  }
  if (settings.only !== undefined) items = items.filter((item) => settings.only!.includes(item.kind));
  return { items, lift, thin, area, ...(whole ? { whole } : {}), ...(defs === "" ? {} : { defs }), ...(reach === 0 ? {} : { reach }) };
}

/** A length in feet as a rulebook would print it in `unit`: metres to the centimetre, feet to a tenth. */
function said(feet: number, unit: Unit, language: Language): string {
  const value = convertLength(feet, "ft", unit);
  const text = String(Math.round(value * (unit === "m" ? 100 : 10)) / (unit === "m" ? 100 : 10));
  const units = KYOGIJO_STRINGS[language].league.units;
  return `${text} ${units[unit === "m" || unit === "yd" ? unit : "ft"]}`;
}

/** The unit the heights are said in: the options' own, else the rulebook's of the sport. */
export function heightUnit(o: Pick<SurfaceOptions, "sport" | "league" | "units">): Unit {
  if (o.units !== undefined) return lengthUnit(o);
  const { sport, league } = chooseLeague(o);
  return league?.unit ?? RULEBOOK_UNIT[sport] ?? "ft";
}

/** What stands on the surface, in a sentence, with heights: for a reader who cannot see the 3D view. An empty string when nothing stands on it. */
export function describeUprights(o: SurfaceOptions, uprights: Uprights, language: Language = "en"): string {
  const words = KYOGIJO_STRINGS[language].turn;
  const unit = heightUnit(o);
  // One entry for each kind, and for a kind that has two (a goal at each end) the first: both are the same.
  const seen = new Set<UprightKind>();
  const list: string[] = [];
  for (const item of uprights.items) {
    if (seen.has(item.kind)) continue;
    seen.add(item.kind);
    if (item.height <= 0) continue;
    const name = words.parts[item.kind];
    // A rink's boards are said by the top of the glass; a table by the height of its top.
    const height = item.kind === "boards" ? (item.low ?? item.height) : item.height;
    list.push(item.kind === "net" && item.low !== undefined && Math.abs(item.low - item.height) > 0.02 ? fill(words.itemSag, { name, h: said(height, unit, language), low: said(item.low, unit, language) }) : fill(words.item, { name, h: said(height, unit, language) }));
  }
  return list.length === 0 ? "" : fill(words.standing, { list: list.join(KYOGIJO_STRINGS[language].layers.listSep) });
}
