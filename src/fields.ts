// What a field sport's surface is for a set of options: the league's figures, the size asked for, and the plan that follows. Kept apart from the drawing so that the outline, the description, the ranges, the tests
// and the drawing agree. Every length that is a rulebook's figure is cited in docs/sources.md; what is ours (the width a line is drawn at where a book prints none, the size drawn within a range) is said to be.
import { aflPlan } from "./fields/afl.ts";
import { cricketPlan } from "./fields/cricket.ts";
import { fieldHockeyPlan } from "./fields/fieldhockey.ts";
import { gaelicPlan } from "./fields/gaelic.ts";
import { handballPlan } from "./fields/handball.ts";
import { lacrossePlan } from "./fields/lacrosse.ts";
import { rugbyPlan } from "./fields/rugby.ts";
import type { FieldPlan } from "./fields.types.ts";
import { chooseLeague, LEAGUES } from "./leagues.ts";
import type { AflLeague } from "./leagues/aussie.ts";
import type { CricketLeague } from "./leagues/cricket.ts";
import type { FieldHockeyLeague } from "./leagues/fieldhockey.ts";
import type { GaelicLeague } from "./leagues/gaelic.ts";
import type { HandballLeague } from "./leagues/handball.ts";
import type { LacrosseLeague } from "./leagues/lacrosse.ts";
import type { RugbyLeague } from "./leagues/rugby.ts";
import type { FieldSport, SurfaceOptions } from "./types.ts";
import { lengthUnit } from "./common.ts";

export type { FieldPlan } from "./fields.types.ts";

/** The field sports, in the order a menu lists them. */
export const FIELD_SPORTS: readonly FieldSport[] = ["lacrosse", "rugby", "afl", "gaelic", "cricket", "fieldhockey", "handball"];

/** True for a sport whose surface is a field sport's. */
export const isFieldSport = (sport: string): sport is FieldSport => (FIELD_SPORTS as readonly string[]).includes(sport);

/**
 * The plan the options ask for. A `league` picks the rulebook (the sport's own first one by default); `field` a size within its range and the sport's own parameters; `detail: "simple"` leaves out the small marks.
 * @throws RangeError when a size is outside the league's range, and Error when the ground or the look is not one the sport has.
 */
export function fieldPlan(o: Pick<SurfaceOptions, "sport" | "league" | "field" | "units" | "detail">): FieldPlan {
  const sport = o.sport;
  if (!isFieldSport(sport)) throw new Error(`"${String(sport)}" is not a field sport`);
  const { league: picked } = chooseLeague(o);
  const league = picked ?? LEAGUES[sport][0];
  const unit = lengthUnit(o);
  const full = o.detail !== "simple";
  switch (sport) {
    case "lacrosse":
      return lacrossePlan(league as LacrosseLeague, o.field, unit, full);
    case "rugby":
      return rugbyPlan(league as RugbyLeague, o.field, unit, full);
    case "afl":
      return aflPlan(league as AflLeague, o.field, unit, full);
    case "gaelic":
      return gaelicPlan(league as GaelicLeague, o.field, unit, full);
    case "cricket":
      return cricketPlan(league as CricketLeague, o.field, unit, full);
    case "fieldhockey":
      return fieldHockeyPlan(league as FieldHockeyLeague, o.field, unit, full);
    default:
      return handballPlan(league as HandballLeague, o.field, unit, full);
  }
}
