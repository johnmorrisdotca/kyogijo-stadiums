// The races of ice skating, with the words for each in English, Japanese and French, and the kinds of element of a figure skating programme. The distances are the ISU's: 500 m to 10,000 m on the long
// track (Special Regulations and Technical Rules Speed Skating, Rule 201 and the layout plan after Rule 225) and 500 m to 5000 m on the short track (Rule 280's diagram: 4 1/2 to 45 laps).
import type { LongTrackRace, RaceInfo, ShortTrackRace, SkatingRace } from "./types.ts";

const race = (r: RaceInfo): RaceInfo => Object.freeze(r);

/** The races of the long track, in the order a menu lists them. The mass start is 16 laps (6400 m); the team pursuit and the team sprint are marked by their lines in the middle of the straights. */
export const LONG_TRACK_RACES: readonly RaceInfo[] = Object.freeze([
  race({ id: "500m", distance: 500, name: { en: "500 m", ja: "500m", fr: "500\u00a0m" } }),
  race({ id: "1000m", distance: 1000, name: { en: "1000 m", ja: "1000m", fr: "1000\u00a0m" } }),
  race({ id: "1500m", distance: 1500, name: { en: "1500 m", ja: "1500m", fr: "1500\u00a0m" } }),
  race({ id: "3000m", distance: 3000, name: { en: "3000 m", ja: "3000m", fr: "3000\u00a0m" } }),
  race({ id: "5000m", distance: 5000, name: { en: "5000 m", ja: "5000m", fr: "5000\u00a0m" } }),
  race({ id: "10000m", distance: 10000, name: { en: "10,000 m", ja: "10000m", fr: "10\u00a0000\u00a0m" } }),
  race({ id: "mass-start", distance: 6400, name: { en: "Mass start", ja: "マススタート", fr: "Départ groupé" } }),
  race({ id: "team-pursuit", distance: 3200, name: { en: "Team pursuit", ja: "チームパシュート", fr: "Poursuite par équipes" } }),
  race({ id: "team-sprint", distance: 1200, name: { en: "Team sprint", ja: "チームスプリント", fr: "Sprint par équipes" } }),
]);

/** The races of the short track. */
export const SHORT_TRACK_RACES: readonly RaceInfo[] = Object.freeze([
  race({ id: "500m", distance: 500, name: { en: "500 m", ja: "500m", fr: "500\u00a0m" } }),
  race({ id: "1000m", distance: 1000, name: { en: "1000 m", ja: "1000m", fr: "1000\u00a0m" } }),
  race({ id: "1500m", distance: 1500, name: { en: "1500 m", ja: "1500m", fr: "1500\u00a0m" } }),
  race({ id: "2000m", distance: 2000, name: { en: "2000 m", ja: "2000m", fr: "2000\u00a0m" } }),
  race({ id: "3000m", distance: 3000, name: { en: "3000 m", ja: "3000m", fr: "3000\u00a0m" } }),
  race({ id: "5000m", distance: 5000, name: { en: "5000 m", ja: "5000m", fr: "5000\u00a0m" } }),
]);

/** Every race of both tracks, once by id. */
export const RACES: readonly RaceInfo[] = Object.freeze([...LONG_TRACK_RACES, ...SHORT_TRACK_RACES.filter((r) => !LONG_TRACK_RACES.some((l) => l.id === r.id))]);

export const LONG_TRACK_RACE_IDS: readonly LongTrackRace[] = Object.freeze(LONG_TRACK_RACES.map((r) => r.id as LongTrackRace));
export const SHORT_TRACK_RACE_IDS: readonly ShortTrackRace[] = Object.freeze(SHORT_TRACK_RACES.map((r) => r.id as ShortTrackRace));
export const RACE_IDS: readonly SkatingRace[] = Object.freeze(RACES.map((r) => r.id));

/** A race by its id, or `undefined`. */
export const raceById = (id: unknown): RaceInfo | undefined => RACES.find((r) => r.id === id);

/** The kinds of element of a figure skating programme a mark can stand for. */
export const ELEMENT_KINDS = Object.freeze(["jump", "spin", "step-sequence", "choreographic-sequence", "lift", "spiral", "twizzle", "death-spiral", "throw"] as const);
export type ElementKind = (typeof ELEMENT_KINDS)[number];

/** The words of a kind of element. */
export const ELEMENT_NAMES: Readonly<Record<ElementKind, { en: string; ja: string; fr: string }>> = Object.freeze({
  jump: { en: "Jump", ja: "ジャンプ", fr: "Saut" },
  spin: { en: "Spin", ja: "スピン", fr: "Pirouette" },
  "step-sequence": { en: "Step sequence", ja: "ステップシークエンス", fr: "Séquence de pas" },
  "choreographic-sequence": { en: "Choreographic sequence", ja: "コレオシークエンス", fr: "Séquence chorégraphique" },
  lift: { en: "Lift", ja: "リフト", fr: "Levée" },
  spiral: { en: "Spiral", ja: "スパイラル", fr: "Spirale" },
  twizzle: { en: "Twizzle", ja: "ツイズル", fr: "Twizzle" },
  "death-spiral": { en: "Death spiral", ja: "デススパイラル", fr: "Spirale de la mort" },
  throw: { en: "Throw jump", ja: "スロージャンプ", fr: "Saut lancé" },
});
