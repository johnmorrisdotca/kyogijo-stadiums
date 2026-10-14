// The dojo builder's public face: `dojo(spec)` lays a floor of tatami out as real units and returns it as plain data (every mat, the floor in metres and in jō, where the kamiza, the doors and the windows are),
// and `drawDojo(spec)` draws it. The same spec always gives the same floor.
import { drawKyogijo } from "../draw.ts";
import { DOJO_LEAGUES } from "../leagues/budo.ts";
import type { SurfaceOptions } from "../types.ts";
import { dojoLayout, dojoLeague } from "./dojo.ts";
import type { MBox } from "./parts.ts";
import type { Piece } from "./tatami.ts";
import type { Compass, DojoPattern, DojoSpec } from "./types.ts";

/** One mat of a dojo's floor, or a part of one, in metres from the floor's top left corner. */
export type Tatami = Piece;

/** A dojo made from a spec: the floor as data. */
export interface Dojo {
  /** The spec it was made from. */
  spec: DojoSpec;
  /** The mat standard: a league of the `dojo` sport (`chukyoma`, `kyoma`, `edoma`, `danchima`, `judo-2x1`) and the mat's size in metres. */
  standard: string;
  mat: { length: number; width: number };
  /** The floor in metres: its width (x, the longer side) and its length (y). */
  width: number;
  length: number;
  /** The floor's area in jō: the area over the area of a mat, a half mat counting a half. */
  jo: number;
  /** How many whole mats, half mats (hanjō) and cut pieces the floor holds. */
  counts: { full: number; half: number; cut: number };
  pattern: DojoPattern;
  /** Every mat, in metres, with the tone it is painted in (1, 2 or 3). */
  mats: readonly Tatami[];
  /** The seat of honour's wall, and the doors and windows with where each is. */
  kamiza: Compass;
  entrances: readonly { wall: Compass; box: MBox }[];
  windows: readonly { wall: Compass; box: MBox }[];
  shrine: MBox | undefined;
  /** The thickness of the walls round the floor, 0 for none. */
  wall: number;
  /** The contest areas laid on the floor, in metres. */
  contests: readonly MBox[];
  /** The options that draw it: `drawKyogijo(dojo.options)`. */
  options: SurfaceOptions;
}

/**
 * A dojo (道場): the floor in mats, laid as real tatami units, with the walls, doors, windows, shrine and kamiza. `mats` is the floor: a number is its area in jō (8, 12, 20, 50, 100 and 200 give the usual shapes), `[across, along]`
 * the whole mats across and along, `{ width, length, unit }` a size in metres, feet, mats or jō; `pattern` is how it is laid (`traditional`: no four corners meet; `competition`, `checker`, `border`).
 * @example
 * ```ts
 * import { dojo } from "@johnmorrisdotca/kyogijo-stadiums/budo";
 * const d = dojo({ jo: 20 });
 * console.log(d.jo, d.width.toFixed(2), d.length.toFixed(2), d.counts.full, d.counts.half, d.pattern);
 * // 20 7.28 4.55 18 4 traditional
 * ```
 */
export function dojo(spec: DojoSpec = {}): Dojo {
  const standard = spec.standard ?? "chukyoma";
  const league = dojoLeague(standard);
  const L = dojoLayout(spec, league);
  return {
    spec,
    standard,
    mat: { length: L.mat.length, width: L.mat.width },
    width: L.width,
    length: L.length,
    jo: L.jo,
    counts: L.counts,
    pattern: L.pattern,
    mats: L.pieces,
    kamiza: L.kamiza,
    entrances: L.entrances,
    windows: L.windows,
    shrine: L.shrine,
    wall: L.wall,
    contests: L.contests,
    options: { sport: "dojo", ...(standard === "chukyoma" ? {} : { league: standard }), dojo: spec },
  };
}

/** Draw a dojo: `drawKyogijo` with the spec as the options' `dojo`, and any other option the caller gives. */
export function drawDojo(spec: DojoSpec = {}, more: Partial<SurfaceOptions> = {}): string {
  const d = dojo(spec);
  return drawKyogijo({ ...d.options, ...more, sport: "dojo", dojo: spec } as SurfaceOptions);
}

/** The mat standards a dojo can be laid with. */
export const DOJO_STANDARDS: readonly string[] = DOJO_LEAGUES.map((l) => l.id);
