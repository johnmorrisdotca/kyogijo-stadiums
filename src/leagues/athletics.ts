// The athletics track: World Athletics' 400 m Standard Track (Track and Field Facilities Manual, 2019 edition, 2.2.1, and Technical Rule 14 of Book C2.1) and its 200 m Standard Short Track
// for covered stadia (Technical Rules 41 to 44, and the Marking Plan for the Standard Short Track of 1 January 2026), with the figures of each in metres. Nothing here draws.
import { convertLength, type Unit } from "../units.ts";
import type { LeagueBase } from "./types.ts";

/** The figures of an oval track, in metres. */
export interface AthleticsFigures {
  /** The length of each straight (the distance between the centres of the semicircles, for the outdoor track's). */
  straight: number;
  /** The radius of each bend at the inside of the track, where the kerb is. */
  radius: number;
  /** The width of a lane, the line on its right included. */
  lane: number;
  /** The least, the most and the drawn number of lanes of the oval. */
  lanes: { min: number; max: number; drawn: number };
  /** The width of the painted lines. */
  line: number;
  /** The width of the kerb, as it is drawn (the rules allow 50 to 250 mm). */
  kerb: number;
  /** Where the running line is measured: from the kerb in lane 1, from the line on the left in the other lanes. */
  inner: number;
  outer: number;
  /** The obstacle-free zone inside the kerb and outside the track, at least. */
  safety: number;
  /** The lane width of the straight that runs on beyond the oval's. */
  straightLane: number;
  /** The least and the most lanes of that straight, and the lengths round it: the starting area and the run-out. */
  straightLanes: { min: number; max: number };
  startArea: number;
  runOut: number;
  /** True for a covered track: its bends are banked, at this angle in degrees. */
  banking: number | null;
}

/** The figures in feet, as the drawing's units are: the lengths only, not the counts of lanes or the angle of the banking. */
export function athleticsInFeet(figures: AthleticsFigures, unit: Unit): AthleticsFigures {
  const k = (v: number): number => convertLength(v, unit, "ft");
  return {
    straight: k(figures.straight),
    radius: k(figures.radius),
    lane: k(figures.lane),
    lanes: { ...figures.lanes },
    line: k(figures.line),
    kerb: k(figures.kerb),
    inner: k(figures.inner),
    outer: k(figures.outer),
    safety: k(figures.safety),
    straightLane: k(figures.straightLane),
    straightLanes: { ...figures.straightLanes },
    startArea: k(figures.startArea),
    runOut: k(figures.runOut),
    banking: figures.banking,
  };
}

/** A league with an athletics track of its own. */
export type AthleticsLeague = LeagueBase<"athletics", AthleticsFigures>;

/**
 * The 400 m Standard Track (Manual 2.2.1.1, Table 2.2.1.1): two semicircles of 36.50 m radius at the kerb joined by two straights of 84.39 m, lanes 1.22 m wide including the 50 mm line on the
 * right (Rule 14.4), the running line 0.30 m outside the kerb in lane 1 and 0.20 m outside the line on the left in every other lane (Rule 14.2), eight lanes at least for the big competitions (Rule
 * 14.5) and nine at the most (Manual 2.2.1.1). A straight of at least six lanes runs on beyond the oval's with a starting area of 3 m and a run-out of 17 m (Manual 2.2.2.1), and has no most (2.2.2.1).
 * The safety zones are 1.00 m wide (2.2.1.5). The kerb is drawn 0.05 m wide, the narrowest the rules allow (Rule 14.1: 50 to 250 mm).
 */
export const WA_STANDARD_TRACK: AthleticsFigures = {
  straight: 84.39,
  radius: 36.5,
  lane: 1.22,
  lanes: { min: 4, max: 9, drawn: 8 },
  line: 0.05,
  kerb: 0.05,
  inner: 0.3,
  outer: 0.2,
  safety: 1,
  straightLane: 1.22,
  straightLanes: { min: 6, max: 10 },
  startArea: 3,
  runOut: 17,
  banking: null,
};

/**
 * The 200 m Standard Short Track (Marking Plan for the World Athletics Standard Short Track, 1 January 2026; Rules 41 to 44): the bends have a construction radius of 17.205 m at the kerb and the
 * centres of the banked bends are 44.983 m apart; lanes are 1.000 m wide on the oval and 1.220 m on the infield straight, four to six of them (Rule 43: 0.90 to 1.22 m, a minimum of four lanes and
 * a maximum of six); the bends are banked at 10.000 degrees. The plan's own transitions (the ascending and descending sections) are drawn here as one circular bend of the same radius, which is ours.
 */
export const WA_SHORT_TRACK: AthleticsFigures = {
  straight: 44.983,
  radius: 17.205,
  lane: 1,
  lanes: { min: 4, max: 6, drawn: 6 },
  line: 0.05,
  kerb: 0.05,
  inner: 0.3,
  outer: 0.2,
  safety: 1,
  straightLane: 1.22,
  straightLanes: { min: 4, max: 6 },
  startArea: 3,
  runOut: 10,
  banking: 10,
};

/** The staggers of the lanes of the 400 m Standard Track as the Manual prints them (Table 2.2.1.6a), in metres on the running line, for lanes 2 to 8: 200 m, 400 m, 800 m and 4 x 400 m. */
export const WA_STAGGER_TABLE: Readonly<Record<"200m" | "400m" | "800m" | "4x400m", readonly number[]>> = Object.freeze({
  "200m": [3.519, 7.351, 11.184, 15.017, 18.85, 22.682, 26.515],
  "400m": [7.037, 14.703, 22.368, 30.034, 37.699, 45.365, 53.03],
  "800m": [3.526, 7.384, 11.259, 15.151, 19.06, 22.987, 26.93],
  "4x400m": [10.563, 22.086, 33.627, 45.185, 56.76, 68.352, 79.96],
});

/**
 * The staggers of the lanes of the 200 m Standard Short Track (Marking Plan, 1 January 2026), in metres measured 0.20 m out from the lane line, for lanes 2 to 6. The first row serves the 200 m, 400 m,
 * 800 m, 4 x 400 m and 4 x 800 m (two bends in lanes), the second the 4 x 200 m (three bends in lanes), the third the second leg of the 4 x 200 m (one bend).
 */
export const WA_SHORT_STAGGER_TABLE: Readonly<Record<"two-bends" | "three-bends" | "one-bend", readonly number[]>> = Object.freeze({
  "two-bends": [5.597, 11.821, 18.051, 24.285, 30.523],
  "three-bends": [8.407, 17.781, 27.188, 36.626, 46.092],
  "one-bend": [2.81, 5.959, 9.137, 12.341, 15.57],
});

/** The athletics leagues: the outdoor track (the sport's own) and the covered one. */
export const ATHLETICS_LEAGUES: readonly AthleticsLeague[] = [
  { id: "world-athletics", family: "athletics", name: { en: "World Athletics 400 m standard track", ja: "ワールドアスレティックスの400m標準トラック" }, unit: "m", dimensions: WA_STANDARD_TRACK, sources: ["wa-facilities-manual", "wa-technical-rules"], builtIn: true },
  { id: "world-athletics-short", family: "athletics", name: { en: "World Athletics 200 m standard short track", ja: "ワールドアスレティックスの200m標準ショートトラック" }, unit: "m", dimensions: WA_SHORT_TRACK, sources: ["wa-short-track-plan", "wa-technical-rules"] },
];
