// What a curling sheet is for a set of options: the league's figures with the length and the width the caller asked for, held to the
// range the rulebook allows, and how it is shown. Kept apart from the drawing so that the outline, the description and the charts agree.
import { chooseLeague, sheetOf } from "./leagues.ts";
import { CURLING_LEAGUES, type CurlingLeague, type SheetSpec } from "./leagues/curling.ts";
import { lengthUnit } from "./common.ts";
import type { SheetShow, SurfaceOptions } from "./types.ts";
import { parseRange } from "./ranges.names.ts";
import { convertLength } from "./units.ts";

/** A sheet to draw. */
export interface SheetPlan {
  league: CurlingLeague;
  /** The figures in feet, with the length and the width of the options. */
  spec: SheetSpec;
  pebble: boolean;
  guardZone: boolean;
  show: SheetShow;
  end: "left" | "right";
}

const SHOWS: readonly SheetShow[] = ["sheet", "half", "house"];
const FEET = (feet: number): string => String(Math.round(feet * 100) / 100);

/**
 * The sheet the options ask for. A `league` picks the rulebook (World Curling's by default); `sheet.length` and `sheet.width` are in `units`
 * (feet by default) and must lie within what the rulebook allows, or it is an error that says the range.
 * @throws RangeError when the length or the width is outside the league's range.
 */
export function sheetFor(o: Pick<SurfaceOptions, "sport" | "league" | "sheet" | "units" | "range">): SheetPlan {
  const picked = o.sport === "curling" ? chooseLeague(o).league : undefined;
  const league = picked !== undefined && picked.family === "curling" ? picked : CURLING_LEAGUES[0];
  const base = sheetOf(league);
  const unit = lengthUnit(o);
  const asked = o.sheet ?? {};
  const pick = (name: "length" | "width", least: number, most: number): number => {
    const given = asked[name];
    if (given === undefined) return most;
    const feet = typeof given === "number" ? convertLength(given, unit, "ft") : NaN;
    if (!(feet >= least - 0.01 && feet <= most + 0.01)) throw new RangeError(`The sheet's ${name} must be ${FEET(least)} to ${FEET(most)} feet in ${league.id}'s rules: ${String(given)} ${unit} is not`);
    return feet;
  };
  const length = pick("length", base.lengthMin, base.length);
  const width = pick("width", base.widthMin, base.width);
  // The sheet's own `show` and `end`, and the named ranges of a curling sheet (`range: "house"`, or at an end), which say the same and win.
  const ranged = o.sport === "curling" ? parseRange(o) : undefined;
  const named = ranged !== undefined && ranged.kind === "name" ? ranged : undefined;
  const show = named !== undefined ? (named.name as SheetShow) : SHOWS.includes(asked.show as SheetShow) ? (asked.show as SheetShow) : "sheet";
  const end = named !== undefined && named.end !== undefined ? named.end : asked.end === "right" ? "right" : "left";
  return { league, spec: { ...base, length, width }, pebble: asked.pebble === true, guardZone: asked.guardZone === true, show, end };
}
