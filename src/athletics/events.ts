// The races and the field events of athletics, with the figures that say how each is marked and the words for each in English, Japanese and French. The races' starts are marked as the
// World Athletics Track and Field Facilities Manual (2019 edition, 2.2.1.6, Table 2.2.1.6a) and the Technical Rules (Rules 14, 16, 17.5, 22, 23 and 24 of Book C2.1, in force 1 July 2026) say.
import type { AthleticsFieldEvent, AthleticsRace, FieldEventInfo, RaceInfo } from "./types.ts";

const race = (r: RaceInfo): RaceInfo => Object.freeze(r);

/**
 * The races, in the order a menu lists them. `kind` says how the start is made: `straight` (the sprints and the sprint hurdles, on the finish straight), `stagger` (the lanes' staggers of Table
 * 2.2.1.6a: `bends` half-turns in lanes), `curved` (a curved start line, the waterfall, for a race run without lanes) and `steeplechase` (the water jump's lap). The breakline (Rule 17.5.1) is the
 * 800 m's and the 4 x 400 m's; the group starts (Rule 17.5.2) are those of the races over 1000 m.
 */
export const RACES: readonly RaceInfo[] = Object.freeze([
  race({ id: "60m", distance: 60, kind: "straight", indoor: true, name: { en: "60 m", ja: "60m", fr: "60\u00a0m" } }),
  race({ id: "60m-hurdles", distance: 60, kind: "straight", hurdles: true, indoor: true, name: { en: "60 m hurdles", ja: "60mハードル", fr: "60\u00a0m haies" } }),
  race({ id: "100m", distance: 100, kind: "straight", name: { en: "100 m", ja: "100m", fr: "100\u00a0m" } }),
  race({ id: "100m-hurdles", distance: 100, kind: "straight", hurdles: true, name: { en: "100 m hurdles", ja: "100mハードル", fr: "100\u00a0m haies" } }),
  race({ id: "110m-hurdles", distance: 110, kind: "straight", hurdles: true, name: { en: "110 m hurdles", ja: "110mハードル", fr: "110\u00a0m haies" } }),
  race({ id: "200m", distance: 200, kind: "stagger", bends: 1, name: { en: "200 m", ja: "200m", fr: "200\u00a0m" } }),
  race({ id: "400m", distance: 400, kind: "stagger", bends: 2, name: { en: "400 m", ja: "400m", fr: "400\u00a0m" } }),
  race({ id: "400m-hurdles", distance: 400, kind: "stagger", bends: 2, hurdles: true, name: { en: "400 m hurdles", ja: "400mハードル", fr: "400\u00a0m haies" } }),
  race({ id: "800m", distance: 800, kind: "stagger", bends: 1, breakline: true, name: { en: "800 m", ja: "800m", fr: "800\u00a0m" } }),
  race({ id: "1000m", distance: 1000, kind: "curved", group: true, name: { en: "1000 m", ja: "1000m", fr: "1000\u00a0m" } }),
  race({ id: "1500m", distance: 1500, kind: "curved", name: { en: "1500 m", ja: "1500m", fr: "1500\u00a0m" } }),
  race({ id: "mile", distance: 1609.344, kind: "curved", name: { en: "Mile", ja: "1マイル", fr: "Mile" } }),
  race({ id: "2000m", distance: 2000, kind: "curved", group: true, name: { en: "2000 m", ja: "2000m", fr: "2000\u00a0m" } }),
  race({ id: "3000m", distance: 3000, kind: "curved", group: true, name: { en: "3000 m", ja: "3000m", fr: "3000\u00a0m" } }),
  race({ id: "5000m", distance: 5000, kind: "curved", group: true, name: { en: "5000 m", ja: "5000m", fr: "5000\u00a0m" } }),
  race({ id: "10000m", distance: 10000, kind: "curved", group: true, name: { en: "10,000 m", ja: "10000m", fr: "10\u00a0000\u00a0m" } }),
  race({ id: "2000m-steeplechase", distance: 2000, kind: "steeplechase", name: { en: "2000 m steeplechase", ja: "2000m障害", fr: "2000\u00a0m steeple" } }),
  race({ id: "3000m-steeplechase", distance: 3000, kind: "steeplechase", group: true, name: { en: "3000 m steeplechase", ja: "3000m障害", fr: "3000\u00a0m steeple" } }),
  race({ id: "4x100m", distance: 400, kind: "stagger", bends: 2, legs: [100, 100, 100, 100], name: { en: "4 x 100 m relay", ja: "4×100mリレー", fr: "Relais 4\u00a0×\u00a0100\u00a0m" } }),
  race({ id: "4x400m", distance: 1600, kind: "stagger", bends: 3, breakline: true, legs: [400, 400, 400, 400], name: { en: "4 x 400 m relay", ja: "4×400mリレー", fr: "Relais 4\u00a0×\u00a0400\u00a0m" } }),
]);

/** The ids of the races. */
export const RACE_IDS: readonly AthleticsRace[] = Object.freeze(RACES.map((r) => r.id));

/** A race by its id, or `undefined`. */
export const raceById = (id: unknown): RaceInfo | undefined => RACES.find((r) => r.id === id);

const field = (f: FieldEventInfo): FieldEventInfo => Object.freeze(f);

/** The field events, in the order a menu lists them: the jumps and then the throws. */
export const FIELD_EVENTS: readonly FieldEventInfo[] = Object.freeze([
  field({ id: "high-jump", name: { en: "High jump", ja: "走高跳", fr: "Saut en hauteur" } }),
  field({ id: "pole-vault", name: { en: "Pole vault", ja: "棒高跳", fr: "Saut à la perche" } }),
  field({ id: "long-jump", name: { en: "Long jump", ja: "走幅跳", fr: "Saut en longueur" } }),
  field({ id: "triple-jump", name: { en: "Triple jump", ja: "三段跳", fr: "Triple saut" } }),
  field({ id: "shot-put", name: { en: "Shot put", ja: "砲丸投", fr: "Lancer du poids" } }),
  field({ id: "discus-throw", name: { en: "Discus throw", ja: "円盤投", fr: "Lancer du disque" } }),
  field({ id: "hammer-throw", name: { en: "Hammer throw", ja: "ハンマー投", fr: "Lancer du marteau" } }),
  field({ id: "javelin-throw", name: { en: "Javelin throw", ja: "やり投", fr: "Lancer du javelot" } }),
]);

/** The ids of the field events. */
export const FIELD_EVENT_IDS: readonly AthleticsFieldEvent[] = Object.freeze(FIELD_EVENTS.map((f) => f.id));

/** A field event by its id, or `undefined`. */
export const fieldEventById = (id: unknown): FieldEventInfo | undefined => FIELD_EVENTS.find((f) => f.id === id);
