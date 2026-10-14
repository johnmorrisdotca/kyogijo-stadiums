// What a skating surface is for a set of options: the standard 400 m speed skating track, the short track oval or the figure skating rink, with the lines of the races marked, where each can be cropped to,
// and the names of its parts, as plain data in metres in the frame of track.ts (the origin the middle of the surface, x along it, y down the page). Kept apart from the drawing so that the outline, the
// description, the ranges, the replay, the tests and the drawing agree: a test reads a figure from the plan, not from the markup. Nothing here draws.
import type { Area, Shape } from "../fields.types.ts";
import { ISU_FIGURE_RINK, ISU_LONG_TRACK, ISU_SHORT_TRACK, SKATING_LEAGUES, type FigureRinkFigures, type LongTrackFigures, type ShortTrackFigures, type SkatingFigures, type SkatingLeague } from "../leagues/skating.ts";
import { chooseLeague } from "../leagues.ts";
import type { SurfaceOptions } from "../types.ts";
import { LONG_TRACK_RACE_IDS, LONG_TRACK_RACES, RACE_IDS, SHORT_TRACK_RACE_IDS, SHORT_TRACK_RACES, raceById } from "./events.ts";
import { figureParts, FURNITURE, furnitureBoxes, type FigureRink } from "./figure.ts";
import { longParts, LONG_DEFAULTS, iceRadius, markRace, type RaceMarks } from "./long.ts";
import { grow, union, type MBox, type MMark, type MRange } from "./parts.ts";
import { shortOval, shortParts, trackLines, type ShortOval } from "./short.ts";
import { longOval, laneEdges, outerEdge, type LongOval } from "./track.ts";
import type { LongTrackRace, ShortTrackRace, SkatingDiscipline, SkatingFurniture, SkatingRace, SkatingStyle } from "./types.ts";

export type { MBox, MMark, MRange };

/** What a skating drawing is. */
export interface SkatingPlan {
  sport: "skating";
  league: string;
  discipline: SkatingDiscipline;
  figures: SkatingFigures;
  /** The oval of the long track, or `undefined`. */
  oval: LongOval | undefined;
  /** The short track's oval and rink, or `undefined`. */
  short: ShortOval | undefined;
  /** The figure skating rink, or `undefined`. */
  rink: FigureRink | undefined;
  /** The playing surface: the ice out to the padding (the long track), the rink (the others). The data frame's own box. */
  box: MBox;
  /** Everything drawn: the box and what lies beyond it (the furniture of a figure skating rink). */
  extent: MBox;
  areas: Area[];
  shapes: Shape[];
  /** The long track's races marked, with where each starts. */
  races: RaceMarks[];
  /** The short track's races marked. */
  shortRaces: ShortTrackRace[];
  /** The number of tracks of the short track. */
  tracks: 5 | 7;
  furniture: SkatingFurniture[];
  /** The width the ordinary line is painted at by the rules, and the width it is drawn at unless `exactLines` says otherwise. */
  lineWidth: number;
  drawnLine: number;
  ranges: Readonly<Record<string, MRange>>;
  marks: MMark[];
  /** The race a close-up of a start (`range: "start"`) shows. */
  start: SkatingRace;
}

const isSkatingLeague = (l: unknown): l is SkatingLeague => typeof l === "object" && l !== null && (l as SkatingLeague).family === "skating";

/** The league a set of options asks for: the long track (the sport's own), the short track or the figure skating rink. */
export function skatingLeague(o: Pick<SurfaceOptions, "sport" | "league">): SkatingLeague {
  const { league } = chooseLeague(o);
  return isSkatingLeague(league) ? league : SKATING_LEAGUES[0];
}

/** The discipline of a set of options. */
export const disciplineOf = (o: Pick<SurfaceOptions, "sport" | "league">): SkatingDiscipline => skatingLeague(o).dimensions.kind;

/** A size within the range the rules give, or the drawn one. @throws RangeError for a size outside it. */
function sizeIn(asked: unknown, span: { min: number; max: number; drawn: number }, label: string, rule: string): number {
  if (asked === undefined) return span.drawn;
  if (typeof asked !== "number" || !Number.isFinite(asked)) throw new TypeError(`${label} is a number of metres`);
  if (asked < span.min || asked > span.max) throw new RangeError(`${label} of ${asked} m is outside what ${rule} allows: ${span.min} m to ${span.max} m`);
  return asked;
}

/** The races the options ask to be marked, for a discipline. @throws Error for a name that is not a race, RangeError for one the discipline does not have. */
export function racesOf(style: SkatingStyle | undefined, discipline: SkatingDiscipline): SkatingRace[] {
  const asked = style?.races;
  if (asked === undefined) return [];
  const own: readonly SkatingRace[] = discipline === "long-track" ? LONG_TRACK_RACE_IDS : discipline === "short-track" ? SHORT_TRACK_RACE_IDS : [];
  if (asked === "all") return [...own];
  if (!Array.isArray(asked)) throw new TypeError('skating.races is "all" or a list of races');
  for (const r of asked) if (raceById(r) === undefined) throw new Error(`Unknown race "${String(r)}": use one of ${RACE_IDS.join(", ")}`);
  for (const r of asked) if (!own.includes(r)) throw new RangeError(`The ${discipline} rink does not mark the ${String(r)}: use ${own.length === 0 ? "none: a figure skating rink has no races" : `one of ${own.join(", ")}`}`);
  return own.filter((r) => (asked as readonly string[]).includes(r));
}

/** The furniture the options ask for. @throws Error for a name that is not furniture. */
export function furnitureOf(style: SkatingStyle | undefined): SkatingFurniture[] {
  const asked = style?.furniture;
  if (asked === undefined || asked === true) return [...FURNITURE];
  if (asked === false) return [];
  if (!Array.isArray(asked)) throw new TypeError("skating.furniture is true, false or a list of judges, referee, technical-panel and kiss-and-cry");
  for (const f of asked) if (!(FURNITURE as readonly string[]).includes(f)) throw new Error(`Unknown furniture "${String(f)}": use one of ${FURNITURE.join(", ")}`);
  return FURNITURE.filter((f) => asked.includes(f));
}

/** The width a line is drawn at unless the drawing is at true widths: a little under two thousandths of the surface, so that a lane line stays in sight in a drawing that holds the whole track. */
const drawn = (box: MBox): number => Math.max(0.1, Math.round((box.x1 - box.x0) * 0.0018 * 100) / 100);

const flag = (v: unknown, def: boolean, label: string): boolean => {
  if (v === undefined) return def;
  if (typeof v !== "boolean") throw new TypeError(`${label} is true or false`);
  return v;
};

/** The skating plan the options ask for. */
export function skatingPlan(o: Pick<SurfaceOptions, "sport" | "league" | "skating" | "range" | "detail">): SkatingPlan {
  const league = skatingLeague(o);
  const style = o.skating;
  const discipline = league.dimensions.kind;
  const base = { sport: "skating" as const, league: league.id, discipline, figures: league.dimensions };
  const given = racesOf(style, discipline);
  const start: SkatingRace = style?.start ?? "500m";
  // A close-up of a start marks the start's race, whether or not the options name it.
  const named = typeof o.range === "string" ? o.range : typeof o.range === "object" && o.range !== null && "name" in o.range ? o.range.name : undefined;
  const own: readonly SkatingRace[] = discipline === "long-track" ? LONG_TRACK_RACE_IDS : discipline === "short-track" ? SHORT_TRACK_RACE_IDS : [];
  const asked = named === "start" && own.includes(start) && !given.includes(start) ? [...given, start] : given;
  if (style?.start !== undefined && raceById(style.start) === undefined) throw new Error(`Unknown race "${String(style.start)}": use one of ${RACE_IDS.join(", ")}`);
  const blocks = flag(style?.blocks, LONG_DEFAULTS.blocks, "skating.blocks");
  const padding = flag(style?.padding, LONG_DEFAULTS.padding, "skating.padding");
  if (discipline === "long-track") {
    const fig = league.dimensions as LongTrackFigures;
    if (style?.infield !== undefined && style.infield !== "floor" && style.infield !== "ice") throw new Error('skating.infield is "floor" or "ice"');
    const oval = longOval(style?.innerRadius, style?.laneWidth, fig);
    const { parts, marks: races, box } = longParts(oval, { fig, warmUp: flag(style?.warmUp, LONG_DEFAULTS.warmUp, "skating.warmUp"), infield: style?.infield ?? LONG_DEFAULTS.infield, blocks, coaches: flag(style?.coaches, LONG_DEFAULTS.coaches, "skating.coaches"), padding, races: asked as LongTrackRace[] });
    const plan: SkatingPlan = { ...base, oval, short: undefined, rink: undefined, box, extent: box, areas: parts.areas, shapes: parts.shapes, races, shortRaces: [], tracks: 5, furniture: [], lineWidth: fig.line, drawnLine: drawn(box), ranges: {}, marks: [], start };
    return { ...plan, ranges: longRanges(plan), marks: longMarks(plan) };
  }
  if (discipline === "short-track") {
    const fig = league.dimensions as ShortTrackFigures;
    const tracks = style?.tracks ?? 5;
    if (tracks !== 5 && tracks !== 7) throw new RangeError("skating.tracks is 5 or 7");
    const length = style?.rink?.length ?? fig.rink.length;
    const width = style?.rink?.width ?? fig.rink.width;
    if (typeof length !== "number" || length < fig.rink.length || length > 70) throw new RangeError(`The rink's length of ${String(length)} m is outside what Rule 280 allows: at least ${fig.rink.length} m (and, for this drawing, at most 70 m)`);
    if (typeof width !== "number" || width < fig.rink.width || width > 40) throw new RangeError(`The rink's width of ${String(width)} m is outside what Rule 280 allows: at least ${fig.rink.width} m (and, for this drawing, at most 40 m)`);
    const oval = shortOval(length, width, fig);
    const { parts, box } = shortParts(oval, { fig, tracks, blocks, padding, races: asked as ShortTrackRace[], corner: 8.5 });
    const plan: SkatingPlan = { ...base, oval: undefined, short: oval, rink: { length, width }, box, extent: box, areas: parts.areas, shapes: parts.shapes, races: [], shortRaces: asked as ShortTrackRace[], tracks, furniture: [], lineWidth: fig.line, drawnLine: drawn(box), ranges: {}, marks: [], start };
    return { ...plan, ranges: shortRanges(plan), marks: shortMarks(plan) };
  }
  const fig = league.dimensions as FigureRinkFigures;
  const length = sizeIn(style?.rink?.length, fig.length, "The rink's length", "Rule 342.1");
  const width = sizeIn(style?.rink?.width, fig.width, "The rink's width", "Rule 342.1");
  const rink: FigureRink = { length, width };
  const furniture = furnitureOf(style);
  const { parts, box, marks } = figureParts(rink, { fig, furniture });
  const boards: MBox = { x0: -length / 2, y0: -width / 2, x1: length / 2, y1: width / 2 };
  const extra = furniture.length === 0 ? [] : furniture.flatMap((k) => furnitureBoxes(rink, fig)[k]);
  const plan: SkatingPlan = { ...base, oval: undefined, short: undefined, rink, box: boards, extent: union([box, ...extra.map((b) => grow(b, 0.3))]), areas: parts.areas, shapes: parts.shapes, races: [], shortRaces: [], tracks: 5, furniture, lineWidth: 0.05, drawnLine: drawn(box), ranges: {}, marks: [...marks, { id: "ice", x: 0, y: -width / 4, side: "top" }, { id: "boards", x: -length / 4, y: -width / 2, side: "top" }], start };
  return { ...plan, ranges: figureRanges(plan) };
}

/** The ranges of the long track. */
function longRanges(plan: SkatingPlan): Record<string, MRange> {
  const o = plan.oval as LongOval;
  const f = o.straight;
  const edges = laneEdges(o, 4);
  const out = outerEdge(o);
  const R = iceRadius(o);
  const r: Record<string, MRange> = {};
  r["home-straight"] = { x0: -f / 2, y0: edges.inner - 2, x1: f / 2, y1: out + 2 };
  r["crossing-straight"] = { x0: -f / 2, y0: -out - 2, x1: f / 2, y1: -edges.inner + 2 };
  r["first-bend"] = { x0: f / 2, y0: -R, x1: f / 2 + R, y1: R };
  r["second-bend"] = { x0: -f / 2 - R, y0: -R, x1: -f / 2, y1: R };
  r.finish = { x0: -f / 2 + 100 - 18, y0: edges.inner - 2, x1: -f / 2 + 100 + 12, y1: out + 2 };
  r.infield = { x0: -f / 2 - edges.warmUp, y0: -edges.warmUp, x1: f / 2 + edges.warmUp, y1: edges.warmUp };
  const place = (LONG_TRACK_RACE_IDS as readonly string[]).includes(plan.start) ? markRace(o, plan.start as LongTrackRace) : undefined;
  if (place !== undefined) {
    const xs = place.starts.map((s) => s.x);
    const ys = place.starts.map((s) => s.y);
    r.start = { x0: Math.min(...xs) - 14, y0: Math.min(...ys, ...ys.map((y) => y)) - 6, x1: Math.max(...xs) + 14, y1: Math.max(...ys) + 6 };
  } else r.start = { x0: -f / 2 - 14, y0: edges.inner - 6, x1: -f / 2 + 14, y1: out + 2 };
  return r;
}

function longMarks(plan: SkatingPlan): MMark[] {
  const o = plan.oval as LongOval;
  const f = o.straight;
  const edges = laneEdges(o, 4);
  return [
    { id: "finish-line", x: -f / 2 + 100, y: edges.outer, side: "bottom" },
    { id: "inner-lane", x: -f / 4, y: (edges.inner + edges.between) / 2, side: "bottom" },
    { id: "outer-lane", x: f / 4, y: (edges.between + edges.outer) / 2, side: "bottom" },
    { id: "warm-up-lane", x: -f / 4, y: -(edges.warmUp + edges.inner) / 2, side: "top" },
    { id: "crossing-straight", x: 0, y: -edges.outer, side: "top" },
    { id: "padding", x: f / 4, y: -iceRadius(o), side: "top" },
    { id: "infield", x: 0, y: 0, side: "top" },
  ];
}

/** The ranges of the short track. */
function shortRanges(plan: SkatingPlan): Record<string, MRange> {
  const o = plan.short as ShortOval;
  const S = o.straight;
  const W = o.width / 2;
  const r: Record<string, MRange> = {};
  r["home-straight"] = { x0: -S / 2 - 3, y0: o.blocks - 2, x1: S / 2 + 3, y1: W };
  r["crossing-straight"] = { x0: -S / 2 - 3, y0: -W, x1: S / 2 + 3, y1: -o.blocks + 2 };
  r["first-bend"] = { x0: S / 2, y0: -W, x1: S / 2 + o.radius + 3, y1: W };
  r["second-bend"] = { x0: -S / 2 - o.radius - 3, y0: -W, x1: -S / 2, y1: W };
  r.finish = { x0: -10, y0: o.blocks - 4, x1: 10, y1: W };
  const lines = trackLines(plan.tracks);
  r.start = { x0: Math.min(...lines) - 8, y0: -W, x1: Math.max(...lines) + 8, y1: -o.blocks + 4 };
  r.infield = { x0: -S / 2 - o.blocks, y0: -o.blocks, x1: S / 2 + o.blocks, y1: o.blocks };
  return r;
}

function shortMarks(plan: SkatingPlan): MMark[] {
  const o = plan.short as ShortOval;
  const S = o.straight;
  return [
    { id: "finish-line", x: 0, y: o.width / 2, side: "bottom" },
    { id: "blocks", x: S / 2 + o.blocks * 0.7071, y: -o.blocks * 0.7071, side: "top" },
    { id: "track-line", x: -S / 4, y: o.radius, side: "bottom" },
    { id: "start-lines", x: 0, y: -o.width / 2, side: "top" },
    { id: "infield", x: 0, y: 0, side: "top" },
  ];
}

/** The ranges of the figure skating rink. */
function figureRanges(plan: SkatingPlan): Record<string, MRange> {
  const r = plan.rink as FigureRink;
  const L = r.length / 2;
  const W = r.width / 2;
  const out: Record<string, MRange> = { half: { left: { x0: -L, y0: -W, x1: 0, y1: W }, right: { x0: 0, y0: -W, x1: L, y1: W } } };
  const boxes = furnitureBoxes(r);
  const judges = plan.furniture.includes("judges") ? union([...boxes.judges, ...(plan.furniture.includes("referee") ? boxes.referee : []), ...(plan.furniture.includes("technical-panel") ? boxes["technical-panel"] : [])].map((b) => grow(b, 1.5))) : { x0: -8, y0: W - 4, x1: 8, y1: W + 3 };
  out.judges = { ...judges, y0: Math.min(judges.y0, W - 3) };
  out["kiss-and-cry"] = grow(plan.furniture.includes("kiss-and-cry") ? boxes["kiss-and-cry"][0] : { x0: -L + 3, y0: W + 0.6, x1: -L + 6.5, y1: W + 2.2 }, 4);
  return out;
}

export { LONG_TRACK_RACES, SHORT_TRACK_RACES, ISU_FIGURE_RINK, ISU_LONG_TRACK, ISU_SHORT_TRACK };
