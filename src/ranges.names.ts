// The names of the ranges of each sport (`RANGES`) and the check of a drawing's `range` option (`parseRange`): kept apart from ranges.ts, which crops, so that the curling sheet's
// own builder can read a named range without importing the code that crops every surface.
import { LEAGUES, chooseLeague } from "./leagues.ts";
import type { RangeBox, RangeName, Side, Sport, SurfaceOptions } from "./types.ts";

/** One range of a sport: its name, and the end it is at by default when it is at an end (`left` or `right`, as the surface is drawn wide). A range with no `end` is in the middle or is the whole of something. */
export interface RangeInfo {
  id: RangeName;
  end?: Side;
  /** The leagues the range is for, when only some of the sport's have it (rugby union's 22 and rugby league's 20-metre area; the fielding circle of the ICC's grounds). Every league when missing. */
  leagues?: readonly string[];
}

const range = (id: RangeName, end?: Side, leagues?: readonly string[]): RangeInfo => Object.freeze({ id, ...(end === undefined ? {} : { end }), ...(leagues === undefined ? {} : { leagues: Object.freeze([...leagues]) }) });

const FOOTBALL: readonly RangeInfo[] = Object.freeze([range("red-zone", "right"), range("end-zone", "right"), range("between-the-20s"), range("field-of-play"), range("own-half", "left"), range("opponent-half", "right")]);
const NET: readonly RangeInfo[] = Object.freeze([range("half-court", "left")]);

/**
 * The named ranges of each sport, in the order a menu lists them: `{ id, end }`, with `end` the end the range is at when `range` gives none (`left` or `right`, as the surface is
 * drawn wide; a range with no `end` is in the middle or is the whole of something and ignores one). Offensive ranges are at the right by default, as a frame's numbers are for a team
 * that attacks the right (see `toSurface`); defensive and own ranges at the left; the others, such as a half, at the left, as a curling sheet's house is.
 */
export const RANGES: Readonly<Record<Sport, readonly RangeInfo[]>> = Object.freeze({
  nfl: FOOTBALL,
  cfl: FOOTBALL,
  ifaf: FOOTBALL,
  nhl: Object.freeze([range("offensive-zone", "right"), range("defensive-zone", "left"), range("neutral-zone"), range("half", "left")]),
  nba: Object.freeze([range("half-court", "left"), range("paint", "left")]),
  soccer: Object.freeze([range("half", "left"), range("final-third", "right"), range("defensive-third", "left"), range("middle-third"), range("penalty-area", "left")]),
  mlb: Object.freeze([range("infield"), range("outfield")]),
  curling: Object.freeze([range("sheet"), range("half", "left"), range("house", "left"), range("folded")]),
  tennis: NET,
  volleyball: NET,
  badminton: NET,
  pickleball: NET,
  tabletennis: NET,
  lacrosse: Object.freeze([range("half", "left"), range("crease", "right")]),
  rugby: Object.freeze([range("half", "left"), range("twenty-two", "right", ["world-rugby"]), range("twenty", "right", ["nrl", "irl"]), range("in-goal", "right")]),
  afl: Object.freeze([range("half", "left"), range("forward-fifty", "right"), range("centre-square")]),
  gaelic: Object.freeze([range("half", "left"), range("large-rectangle", "right")]),
  cricket: Object.freeze([range("pitch"), range("circle", undefined, ["icc-men", "icc-women"])]),
  fieldhockey: Object.freeze([range("half", "left"), range("circle", "right"), range("twenty-three", "right")]),
  handball: Object.freeze([range("half", "left"), range("goal-area", "right")]),
});

/** What a drawing's `range` asks for, checked: a name (at an end, or at its default) or a box. */
/** A name carries its `end` (the one asked for, else the range's default; none for a range with no end) and `asked`, the end the options named, if they did. */
export type ParsedRange = { kind: "name"; name: RangeName; end: Side | undefined; asked: Side | undefined } | { kind: "box"; box: RangeBox };

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

/**
 * The range the options ask for, or `undefined` when they ask for none.
 * @throws RangeError for a name the sport does not have (the message lists the sport's), or an `end` that is not `left` or `right`.
 * @throws TypeError for a box without its four numbers.
 */
export function parseRange(o: Pick<SurfaceOptions, "sport" | "league" | "range">): ParsedRange | undefined {
  const given: unknown = o.range;
  if (given === undefined || given === null) return undefined;
  const { sport, league } = chooseLeague(o);
  const named = typeof given === "string" || (typeof given === "object" && "name" in given && typeof (given as { name: unknown }).name === "string");
  if (named) {
    const name = typeof given === "string" ? given : (given as { name: string }).name;
    const end: unknown = typeof given === "object" ? (given as { end?: unknown }).end : undefined;
    const info = (RANGES[sport] ?? []).find((one) => one.id === name);
    if (info === undefined) throw new RangeError(`The ${sport} surface has no range "${name}": use one of ${(RANGES[sport] ?? []).map((one) => one.id).join(", ")}, or a box { x0, x1, y0, y1 }`);
    const leagueId = league?.id ?? LEAGUES[sport]?.[0]?.id;
    if (info.leagues !== undefined && leagueId !== undefined && !info.leagues.includes(leagueId)) throw new RangeError(`The ${sport} league "${leagueId}" has no range "${name}": it is for ${info.leagues.join(" and ")}`);
    // A curling sheet's ends are also read as a tall sheet's: the top end is the left one and the bottom end the right.
    const asked = sport === "curling" && end === "top" ? "left" : sport === "curling" && end === "bottom" ? "right" : end;
    if (asked !== undefined && asked !== "left" && asked !== "right") throw new RangeError(`A range's end is "left" or "right", not "${String(end)}"`);
    return { kind: "name", name: info.id, end: info.end === undefined ? undefined : ((asked as Side | undefined) ?? info.end), asked: asked as Side | undefined };
  }
  const box = given as Partial<RangeBox>;
  if (typeof given !== "object" || !isNumber(box.x0) || !isNumber(box.x1) || !isNumber(box.y0) || !isNumber(box.y1)) throw new TypeError(`range is the name of a range of the sport, or a box { x0, x1, y0, y1 } of numbers`);
  if (box.attacking !== undefined && box.attacking !== "left" && box.attacking !== "right") throw new RangeError(`A range's attacking is "left" or "right", not "${String(box.attacking)}"`);
  return { kind: "box", box: box as RangeBox };
}

