// What stands on a surface, in 3D: `uprightsFor` reads the options as `drawKyogijo` does (the sport, the league, the season, the park) and says what stands on the
// surface, where and how high, as planes in the drawing's own frame (x along the surface and y across it, in feet, z the height above it). Pure: no page, no
// stylesheet. `describeUprights` says the same in words, for a reader who cannot see it.
import { courtFor, courtGeometry, isNetSport } from "./court.ts";
import { feetFence, lengthUnit } from "./common.ts";
import { pitchOf } from "./draw.ts";
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
import { ballparkUprights, fieldUprights, footballUprights, soccerUprights } from "./uprights.fields.ts";
import { netUprights } from "./uprights.net.ts";
import { courtUprights, rinkUprights } from "./uprights.rinks.ts";
import { convertLength, type Unit } from "./units.ts";
import type { Language, SurfaceOptions } from "./types.ts";

/** What can be asked of the uprights. */
export interface UprightOptions {
  /** Volleyball: the net at the men's height (2.43 m, the default) or the women's (2.24 m). */
  netHeight?: "men" | "women";
  /** Leave the boards and the glass off a rink, so that the ice can be seen into. On by default. */
  boards?: boolean;
  /** Only these kinds of thing; every kind the surface has when missing. */
  only?: readonly UprightKind[];
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
}

/** All the planes of all the things. */
export const planesOf = (u: Pick<Uprights, "items">): Plane[] => u.items.flatMap((item) => item.planes);

/** The unit each sport's rulebook gives its heights in, when the options name none. */
const RULEBOOK_UNIT: Partial<Record<string, Unit>> = { volleyball: "m", badminton: "m", tabletennis: "m", soccer: "m", handball: "m", fieldhockey: "m", rugby: "m", afl: "m", gaelic: "m" };

/** What stands on the surface the options draw: nothing on a curling sheet, which is flat. */
export function uprightsFor(o: SurfaceOptions, settings: UprightOptions = {}): Uprights {
  const { sport, league } = chooseLeague(o);
  const unit = lengthUnit(o);
  let items: Upright[] = [];
  let lift = 0;
  let thin = 0.2;
  let area: Uprights["area"];
  if (sport === "nfl" || sport === "cfl" || sport === "ifaf") {
    const spec = league?.family === "football" ? fieldOf(league, o.year) : footballIn(sport, o.year);
    const shape = league?.family === "football" || sport === "ifaf" ? "slingshot" : rulesFor(sport, o.year).rules.postShape;
    thin = thinnest(footballLength(spec), spec.width);
    area = { x0: 0, y0: 0, x1: footballLength(spec), y1: spec.width };
    items = footballUprights(spec, shape, sport === "nfl" && league === undefined ? 35 : 20, thin);
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
    items = courtUprights(court, thin);
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
    const built = netUprights(plan, geo, { netHeight: settings.netHeight }, thin);
    items = built.items;
    lift = built.lift;
  } else if (isFieldSport(sport)) {
    const plan = fieldPlan({ ...o, sport });
    thin = thinnest(plan.length, plan.width);
    area = { x0: 0, y0: 0, x1: plan.length, y1: plan.width };
    items = fieldUprights(plan, thin);
  }
  if (settings.only !== undefined) items = items.filter((item) => settings.only!.includes(item.kind));
  return { items, lift, thin, area };
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
