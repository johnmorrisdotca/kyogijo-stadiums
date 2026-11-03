// An adapter: the answers of an OpenF1-style API (lap rows, pit rows, driver rows and, if given, location rows) as kyogijo's open race timeline. Pure: the rows in, a feed out; it makes no request and keeps nothing.
// The rows are the user's, from a source the user chose; the names, teams and times in them are shown only at run time, never shipped. The shapes read are those OpenF1 documents (openf1.org): fields this does
// not name are left behind, and a row it cannot read is skipped.
import type { RaceFeed } from "./circuits.feed.ts";

/** A lap row: who, which lap, when it started and how long it took. */
export interface OpenF1Lap {
  driver_number: number;
  lap_number: number;
  date_start?: string | null;
  lap_duration?: number | null;
}
/** A pit row: who, on which lap, when it entered the pit lane and how long it was in it and standing. */
export interface OpenF1Pit {
  driver_number: number;
  lap_number?: number;
  date: string;
  pit_duration?: number | null;
  lane_duration?: number | null;
  stop_duration?: number | null;
}
/** A driver row: the code, the name and the team as the source gives them. */
export interface OpenF1Driver {
  driver_number: number;
  name_acronym?: string;
  broadcast_name?: string;
  last_name?: string;
  team_name?: string;
  team_colour?: string;
}
/** A location row: where a car was, in the source's own frame. */
export interface OpenF1Location {
  driver_number: number;
  date: string;
  x: number;
  y: number;
}

/** What the adapter is given: the rows of each answer the user's source gave. Only `laps` is needed. */
export interface OpenF1Rows {
  laps: readonly OpenF1Lap[];
  pit?: readonly OpenF1Pit[];
  drivers?: readonly OpenF1Driver[];
  location?: readonly OpenF1Location[];
  /** The laps of the race, if known. */
  totalLaps?: number;
  /** True while the session is going on. */
  live?: boolean;
}

const ms = (date: unknown): number => (typeof date === "string" ? Date.parse(date) : Number.NaN);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Whether a list looks like OpenF1's lap rows: objects with a driver number and a lap number. */
export const looksLikeOpenF1Laps = (input: unknown): input is OpenF1Lap[] =>
  Array.isArray(input) && input.length > 0 && input.slice(0, 5).every((r) => typeof r === "object" && r !== null && isNum((r as OpenF1Lap).driver_number) && isNum((r as OpenF1Lap).lap_number));

/**
 * OpenF1-style rows as a race feed. The start is the earliest start of a first lap; a lap is completed at its start plus its duration (or, where the duration is missing, at the next lap's start). A pit stop runs from
 * its row's time for its lane duration. Location rows, when given, become the feed's positions.
 * @example
 * ```ts
 * import { openF1Feed } from "@johnmorrisdotca/kyogijo-stadiums/circuits";
 * const feed = openF1Feed({ laps: [
 *   { driver_number: 7, lap_number: 1, date_start: "2030-01-01T20:00:00Z", lap_duration: 101 },
 *   { driver_number: 7, lap_number: 2, date_start: "2030-01-01T20:01:41Z", lap_duration: 97.5 },
 * ], drivers: [{ driver_number: 7, name_acronym: "ABC", team_name: "Made-up Team", team_colour: "3366CC" }] });
 * console.log(feed.cars[0].code, feed.cars[0].colour, feed.crossings.map((c) => c.t).join(" "));
 * // ABC #3366cc 101 198.5
 * ```
 */
export function openF1Feed(rows: OpenF1Rows): RaceFeed {
  const laps = rows.laps.filter((l) => isNum(l.driver_number) && isNum(l.lap_number));
  const firsts = laps.filter((l) => l.lap_number === 1).map((l) => ms(l.date_start)).filter(Number.isFinite);
  const zero = firsts.length > 0 ? Math.min(...firsts) : Math.min(...laps.map((l) => ms(l.date_start)).filter(Number.isFinite));
  const at = (date: unknown): number => (ms(date) - zero) / 1000;
  const numbers = [...new Set(laps.map((l) => l.driver_number))];
  const drivers = new Map((rows.drivers ?? []).map((d) => [d.driver_number, d]));
  const cars = numbers.map((n) => {
    const d = drivers.get(n);
    const colour = typeof d?.team_colour === "string" && /^[0-9a-f]{6}$/i.test(d.team_colour) ? `#${d.team_colour.toLowerCase()}` : undefined;
    return {
      id: String(n),
      code: (d?.name_acronym ?? String(n)).slice(0, 4),
      name: d?.last_name ?? d?.broadcast_name ?? String(n),
      ...(d?.team_name === undefined ? {} : { team: d.team_name }),
      ...(colour === undefined ? {} : { colour }),
    };
  });
  const crossings: RaceFeed["crossings"] = [];
  for (const n of numbers) {
    const mine = laps.filter((l) => l.driver_number === n).sort((a, b) => a.lap_number - b.lap_number);
    mine.forEach((l, i) => {
      const next = mine[i + 1];
      const end = isNum(l.lap_duration) && Number.isFinite(at(l.date_start)) ? at(l.date_start) + l.lap_duration : next !== undefined && next.lap_number === l.lap_number + 1 ? at(next.date_start) : Number.NaN;
      if (Number.isFinite(end) && end > 0) crossings.push({ car: String(n), lap: l.lap_number, t: Math.round(end * 1000) / 1000 });
    });
  }
  const pits = (rows.pit ?? [])
    .filter((p) => isNum(p.driver_number) && Number.isFinite(at(p.date)))
    .map((p) => {
      const lane = [p.lane_duration, p.pit_duration].find(isNum) ?? 20;
      return { car: String(p.driver_number), in: at(p.date), out: at(p.date) + lane, ...(isNum(p.stop_duration) ? { stop: p.stop_duration } : {}) };
    })
    .filter((p) => p.in >= 0);
  const positions = (rows.location ?? []).filter((p) => isNum(p.driver_number) && isNum(p.x) && isNum(p.y) && Number.isFinite(at(p.date))).map((p) => ({ car: String(p.driver_number), t: at(p.date), x: p.x, y: p.y }));
  return {
    kind: "kyogijo-race",
    version: 1,
    ...(isNum(rows.totalLaps) ? { laps: rows.totalLaps } : {}),
    cars,
    crossings,
    ...(pits.length > 0 ? { pits } : {}),
    ...(positions.length > 0 ? { positions } : {}),
    ...(rows.live === true ? { live: true } : {}),
  };
}
