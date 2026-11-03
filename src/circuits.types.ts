// What a circuit is: its facts (each with where it was read and whether a source says it), what OpenStreetMap maps of it, and the options of a drawing. Types only.
import type { LonLat } from "./venues.geo.ts";
import type { Language } from "./types.ts";

/** Whether a source says a fact (`documented`) or it is ours (`plausible`). */
export type CircuitBasis = "documented" | "plausible";

/** One fact, the source it was read from and in what words. */
export interface CircuitFact<T> {
  value: T;
  basis: CircuitBasis;
  /** Where it was read: `wikidata` (CC0), `wikipedia` (the article and revision of the record, CC BY-SA 4.0, in our own words) or `openstreetmap` (ODbL); missing for one of ours. */
  source?: "wikidata" | "wikipedia" | "openstreetmap";
  /** What was read, in our own words. */
  read: string;
}

/** A circuit's facts: `scripts/circuits.data.json`, checked against the raw answers by `pnpm circuits`. */
export interface CircuitData {
  /** The key: kebab case. */
  id: string;
  /** The Wikidata item. */
  wikidata: string;
  /** The articles and the revisions read. */
  en: { title: string; revision: number };
  ja: { title: string; revision: number };
  /** The circuit's name: Wikidata's labels. */
  names: { en: string; ja: string };
  /** The country, as its two-letter code (Wikidata's P17). */
  country: string;
  /** The day it opened, `yyyy-mm-dd`. */
  opened: CircuitFact<string>;
  /** The length of a lap, in metres, as published. */
  length: CircuitFact<number>;
  /** How many corners (turns) the lap has, as published. */
  corners: CircuitFact<number>;
  /** Which way the cars go round, seen from above. */
  direction: CircuitFact<"clockwise" | "counterclockwise">;
  /** The width of the track the ribbon is drawn at, in metres. */
  width: CircuitFact<number>;
  /** The width of the pit lane, in metres. */
  pitLaneWidth: CircuitFact<number>;
  /** Where the turns' numbers come from. */
  turnNumbers: Omit<CircuitFact<never>, "value">;
  /** Where the pit building comes from. */
  pitBuilding: Omit<CircuitFact<never>, "value">;
}

/** A point of OpenStreetMap's that the drawing places: a turn, the start, the finish. */
export interface CircuitOsmPoint {
  /** The node, `node/<id>`. */
  source: string;
  at: LonLat;
}

/** What OpenStreetMap maps of a circuit (ODbL 1.0): `src/circuits.osm.data.ts`, apart from every other file. */
export interface CircuitOsm {
  /** The relation of the circuit, `relation/<id>`. */
  source: string;
  /** The day the answer was read, and the base of the data it was read from. */
  read: string;
  base: string;
  licence: "ODbL-1.0";
  attribution: string;
  /** The lap: the relation's ways in the order and the direction it runs, joined into one ring, from the start, simplified to `tolerance` metres; longitude and latitude to six decimals. The first point is not repeated. */
  lap: LonLat[];
  /** How many points the lap had before it was simplified, and the tolerance it was simplified to, in metres. */
  points: number;
  tolerance: number;
  /** The pit lane, as a line in the way it is driven. */
  pitLane: { source: string; line: LonLat[] };
  /** The ground of the circuit (the area its owner holds: the paddock), as a ring. */
  area: { source: string; ring: LonLat[] };
  /** The turns, in the order of the lap, each where OpenStreetMap puts its number. */
  turns: (CircuitOsmPoint & { n: number })[];
  start: CircuitOsmPoint;
  finish: CircuitOsmPoint;
  /** The pit building beside the pit lane: its outline, its height in metres and its levels, as mapped. */
  pitBuilding?: { source: string; ring: LonLat[]; height: number; levels?: number };
}

/** A circuit: its facts and what OpenStreetMap maps of it. */
export interface Circuit extends CircuitData {
  osm: CircuitOsm;
}

/** The options of a circuit's drawing. */
export interface CircuitOptions {
  /** The circuit's key: `las-vegas`. */
  circuit: string;
  /** `en` (the default) or `ja`. */
  language?: Language;
  /** `light` or `dark` forces a theme; left out, the drawing follows the page and the device. */
  theme?: "light" | "dark";
  /** The name and the line of facts in the top corner: `true` (the default) or `false`. */
  label?: boolean;
  /** The turns' numbers: `true` (the default) or `false`. */
  turns?: boolean;
  /** The arrows that show which way the lap runs: `true` (the default) or `false`. */
  arrows?: boolean;
  /** `false` leaves out the drawing's frame (its ground, the north arrow, the scale bar and the credit): for a drawing laid inside another that has its own (a district). `true` when missing. */
  frame?: boolean;
  /** The prefix of the ids inside the drawing, for a page with more than one; a hash of the options when missing. */
  id?: string;
  /** More classes on the root. */
  className?: string;
  /** `none` leaves the stylesheet out, for a page that puts `KYOGIJO_CIRCUIT_STYLE` in once. */
  css?: "none";
}
