// What a league's surface is made of: the figures its rulebook gives, in the unit it gives them in. The drawings are made in
// feet (geometry.ts), so `inFeet` turns a league's table into one. Nothing here draws.
import { lengthsIn, type Scaled, type Unit } from "../units.ts";

/** The words of a league in both languages. */
export interface Named {
  en: string;
  ja: string;
}

/** The families of surface a league is a variant of. */
export type Family = "basketball" | "hockey" | "football" | "baseball" | "curling" | "tennis" | "volleyball" | "badminton" | "pickleball" | "tabletennis" | "lacrosse" | "rugby" | "afl" | "gaelic" | "cricket" | "fieldhockey" | "handball" | "athletics" | "skating";

/** The state of one marking from a season on, in a league's own history: the season it began, what it was, and its sources. */
export interface LeagueSpan<T> {
  /** The first season it was in force, or `null` for the state before the first change that is cited. */
  from: number | null;
  value: T;
  /** What it was, in a sentence. */
  what: string;
  /** The same in Japanese. */
  ja: string;
  /** Keys of `LEAGUE_SOURCES`; at least one. */
  sources: string[];
}

/** What every league has. */
export interface LeagueBase<F extends Family, D> {
  /** The id the `league` option takes: `fiba`, `ncaa-women`. */
  id: string;
  family: F;
  name: Named;
  /** The unit its rulebook states its principal figures in: the one its size is written in, and `units: "rulebook"`. */
  unit: Unit;
  /** The unit `dimensions` are kept in: `unit`, unless said. A football field's figures are in feet, its size in yards. */
  figuresUnit?: Unit;
  /** The rulebook's figures. */
  dimensions: D;
  /** True for the league a sport draws without a `league` (the NBA, the NHL, the NFL, the CFL, the IFAF, MLB): its history is `rulesFor`'s. */
  builtIn?: boolean;
  /** Keys of `LEAGUE_SOURCES`. */
  sources: string[];
  /** The markings that changed, by name: only what a source dates. */
  history?: { [K in keyof D]?: LeagueSpan<D[K]>[] };
}

/** A table of figures in a league's unit, as feet. */
export const inFeet = <T>(table: T, unit: Unit): Scaled<T> => lengthsIn(table, "ft", unit);
