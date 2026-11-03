// What a surface sounds like in its context, worked out as plain numbers: the set of its sport, the room its venue makes (indoors or out, large or small), how many people are in it, the view
// it is seen from, the crowd's level and how a game's state moves it, and which cue each event of a timeline calls. Pure: no clock, no page, no audio. The engine (sound.dom.ts) plays
// what these say.
import type { ReplayChange, ReplayEvent } from "./replay.types.ts";
import { SOUND_BEDS, SOUND_LEVELS, SOUND_OF_SPORT, SOUND_SETS } from "./sound.sets.ts";
import type { CueKind, SoundBed, SoundLayer, SoundLevel, SoundSet, SoundVoice } from "./sound.sets.ts";

/** The venue a surface is in, as far as the sound cares: its roof and its seats. Both are optional; without them the bed's own are used. */
export interface SoundVenue {
  /**
   * The kind of roof, as the venues and the stadiums give it: `open` and `canopy` leave the crowd under the sky; `cable` and `panels` (a retractable roof) mostly close it in; `fixed`, `dome`,
   * `saddle` and `barrel` close it in. An unknown word is taken as the bed's own.
   */
  roof?: string;
  /** The seats. */
  seats?: number;
}

/** Where and how a surface is heard. */
export interface SoundContext {
  /** The surface: a sport of the package (`nhl`, `soccer`, `judo`, ...). */
  sport: string;
  venue?: SoundVenue;
  /** The share of the seats that are taken, 0 to 1 (1 by default): 0 is an empty building, as when a page's Crowd is off. */
  crowd?: number;
  /** The view: `3d` is in the building, `2d` the drawing from above, heard as a broadcast is, the crowd further off and the room drier. */
  view?: "2d" | "3d";
}

/** The room a surface is heard in. */
export interface SoundRoom {
  bed: SoundBed;
  /** How closed in it is, 0 (open sky) to 1 (a roof all over). */
  enclosure: number;
  /** How long the room rings, in seconds. */
  decay: number;
  /** How much of the sound is the room's echo, 0 to 1. */
  wet: number;
  /** The people in it. */
  people: number;
  /** How loud the crowd is for the people in it, 0 (nobody) to a little over 1 (more than the bed was made for). */
  crowd: number;
  /** All of it, for the view: 1 in 3D, less from above. */
  gain: number;
}

/** A mix: each layer's gain, and the room. */
export interface SoundMix extends SoundRoom {
  level: SoundLevel;
  layers: Readonly<Record<SoundLayer, number>>;
}

const clamp = (value: number, least: number, greatest: number): number => Math.min(greatest, Math.max(least, value));
const isNum = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const round = (value: number): number => Math.round(value * 1000) / 1000;

/** The set of a surface's sport, or `undefined` when it has none (a surface with no sound shows no sound controls). */
export function soundSetOf(sport: string): SoundSet | undefined {
  const id = (SOUND_OF_SPORT as Record<string, string | undefined>)[sport];
  return id === undefined ? undefined : SOUND_SETS[id];
}

/** The crowd levels a surface offers, quietest first: none for a surface with no sound. */
export function soundLevelsOf(sport: string): readonly SoundLevel[] {
  const found = soundSetOf(sport);
  if (found === undefined) return [];
  return found.levels ?? SOUND_BEDS[found.bed].levels;
}

/** The voices a surface's cues use, each once, in the order of `CUE_KINDS`: what a page loads when it has files for them. */
export function soundVoicesOf(sport: string): readonly SoundVoice[] {
  const found = soundSetOf(sport);
  if (found === undefined) return [];
  return [...new Set(Object.values(found.cues).flat())] as SoundVoice[];
}

/** How closed in each kind of roof leaves the crowd. */
const ENCLOSURE: Readonly<Record<string, number>> = { open: 0, canopy: 0.3, cable: 0.7, panels: 0.6, retractable: 0.6, fixed: 1, dome: 1, saddle: 1, barrel: 1 };

/**
 * The room of a surface in its context: how closed in the venue is (its roof, else its bed's), how long it rings (longer closed in and larger), how much echo, and how loud the crowd is for the
 * people in it (the seats times the share taken, on a scale that grows as a crowd's sound does, slower than its number). `undefined` for a surface with no sound.
 * @example
 * ```ts
 * import { soundRoom } from "@johnmorrisdotca/kyogijo-stadiums/sound";
 * const arena = soundRoom({ sport: "nhl", venue: { roof: "fixed", seats: 18000 } })!;
 * const field = soundRoom({ sport: "soccer", venue: { roof: "open", seats: 50000 } })!;
 * console.log(arena.bed.id, arena.decay > field.decay, arena.wet > field.wet);
 * console.log(soundRoom({ sport: "nhl", crowd: 0 })!.crowd);
 * // arena true true
 * // 0
 * ```
 */
export function soundRoom(context: SoundContext): SoundRoom | undefined {
  const found = soundSetOf(context.sport);
  if (found === undefined) return undefined;
  const bed = SOUND_BEDS[found.bed];
  const roof = context.venue?.roof;
  const enclosure = roof !== undefined && Object.hasOwn(ENCLOSURE, roof) ? ENCLOSURE[roof] : bed.indoor ? 1 : 0;
  const seats = isNum(context.venue?.seats) && context.venue.seats > 0 ? context.venue.seats : bed.seats;
  const share = isNum(context.crowd) ? clamp(context.crowd, 0, 1) : 1;
  const people = Math.round(seats * share);
  const size = clamp((seats / bed.seats) ** 0.25, 0.7, 1.3);
  const flat = context.view === "2d";
  const decay = round((0.6 + 1.8 * enclosure) * size);
  const wet = round((0.12 + 0.33 * enclosure) * (flat ? 0.5 : 1));
  const crowd = people === 0 ? 0 : round(clamp(0.35 + (0.65 * Math.log10(1 + people)) / Math.log10(1 + bed.seats), 0, 1.15));
  return { bed, enclosure, decay, wet, people, crowd, gain: flat ? 0.7 : 1 };
}

/** Each layer's gain at each level, before the crowd's size: the room and the water stay, the voices come up. */
export const LEVEL_MIX: Readonly<Record<SoundLevel, Readonly<Record<SoundLayer, number>>>> = {
  quiet: { room: 1, water: 0.8, murmur: 0.12, applause: 0, roar: 0 },
  murmur: { room: 0.7, water: 0.7, murmur: 0.55, applause: 0.03, roar: 0.04 },
  engaged: { room: 0.5, water: 0.6, murmur: 0.7, applause: 0.2, roar: 0.18 },
  loud: { room: 0.4, water: 0.5, murmur: 0.6, applause: 0.4, roar: 0.5 },
  roar: { room: 0.3, water: 0.4, murmur: 0.45, applause: 0.55, roar: 0.95 },
};
const VOICES: readonly SoundLayer[] = ["murmur", "applause", "roar"];

/** The nearest level a surface offers to the one asked for: a dojo asked to roar is loud. */
export function levelFor(sport: string, level: SoundLevel): SoundLevel {
  const offered = soundLevelsOf(sport);
  if (offered.length === 0 || offered.includes(level)) return level;
  const want = SOUND_LEVELS.indexOf(level);
  return offered.reduce((best, l) => (Math.abs(SOUND_LEVELS.indexOf(l) - want) < Math.abs(SOUND_LEVELS.indexOf(best) - want) ? l : best), offered[0]);
}

/**
 * The mix of a surface in its context at a crowd level: each of its bed's layers' gain (the crowd's voices scaled by the people in the room; a layer the bed does not have is 0) and the room.
 * `undefined` for a surface with no sound.
 * @example
 * ```ts
 * import { soundMix } from "@johnmorrisdotca/kyogijo-stadiums/sound";
 * const quiet = soundMix({ sport: "nhl" }, "quiet")!;
 * const roar = soundMix({ sport: "nhl" }, "roar")!;
 * console.log(quiet.layers.roar, roar.layers.roar > roar.layers.murmur, soundMix({ sport: "kyudo" }, "roar")!.level);
 * // 0 true murmur
 * ```
 */
export function soundMix(context: SoundContext, level: SoundLevel): SoundMix | undefined {
  const room = soundRoom(context);
  if (room === undefined) return undefined;
  const at = levelFor(context.sport, level);
  const base = LEVEL_MIX[at];
  const layers = Object.fromEntries(
    (["room", "water", "murmur", "applause", "roar"] as const).map((layer) => [layer, room.bed.layers.includes(layer) ? round(base[layer] * (VOICES.includes(layer) ? room.crowd : 1)) : 0]),
  ) as Record<SoundLayer, number>;
  return { ...room, level: at, layers };
}

/** A period of a game on the timeline's clock, as the example games give them. */
export interface SoundPeriod {
  number?: number;
  start: number;
  end: number;
}

/** A game at a moment: what moves the crowd. */
export interface GameMoment {
  /** The time on the timeline's clock. */
  t: number;
  /** The game's periods; without them the whole timeline is one. */
  periods?: readonly SoundPeriod[];
  /** The timeline's first and last moments. */
  start: number;
  end: number;
  /** The score now. */
  score?: { home: number; away: number };
  /** Seconds since the last goal, when there was one. */
  sinceGoal?: number;
}

/**
 * How excited the crowd is at a moment of a game: a murmur before the start, between periods and after the end; engaged while it plays; loud late in a close game; a roar for a few seconds
 * after a goal; and back to a murmur when one side is far ahead late on.
 * @example
 * ```ts
 * import { excitementAt } from "@johnmorrisdotca/kyogijo-stadiums/sound";
 * const periods = [{ start: 0, end: 100 }, { start: 120, end: 220 }];
 * console.log(excitementAt({ t: 50, start: 0, end: 220, periods, score: { home: 0, away: 0 } }));
 * console.log(excitementAt({ t: 110, start: 0, end: 220, periods }));
 * console.log(excitementAt({ t: 200, start: 0, end: 220, periods, score: { home: 2, away: 1 } }));
 * console.log(excitementAt({ t: 60, start: 0, end: 220, periods, sinceGoal: 2 }));
 * // engaged
 * // murmur
 * // loud
 * // roar
 * ```
 */
export function excitementAt(moment: GameMoment): SoundLevel {
  const periods = moment.periods !== undefined && moment.periods.length > 0 ? moment.periods : [{ start: moment.start, end: moment.end }];
  const inPlay = periods.some((p) => moment.t >= p.start && moment.t < p.end);
  if (!inPlay) return "murmur";
  if (isNum(moment.sinceGoal) && moment.sinceGoal >= 0 && moment.sinceGoal < 6) return "roar";
  const first = periods[0].start;
  const last = periods[periods.length - 1].end;
  const progress = last > first ? (moment.t - first) / (last - first) : 0;
  const gap = moment.score === undefined ? 0 : Math.abs(moment.score.home - moment.score.away);
  if (gap >= 3 && progress > 0.6) return "murmur";
  if (gap <= 1 && progress >= 2 / 3) return "loud";
  return "engaged";
}

/** The words of a timeline's events that are read as each kind of moment (lower case): a timeline of a sport with its own words (a `try`, a `touchdown`) calls the cues of its kind. */
const KIND_WORDS: Readonly<Record<string, CueKind>> = {
  goal: "goal",
  touchdown: "goal",
  try: "goal",
  run: "goal",
  "home-run": "goal",
  basket: "point",
  point: "point",
  score: "point",
  "field-goal": "point",
  behind: "point",
  ippon: "goal",
  knockout: "goal",
  ko: "goal",
  shot: "shot",
  save: "shot",
  miss: "shot",
  post: "shot",
  whistle: "whistle",
  foul: "whistle",
  penalty: "whistle",
  offside: "whistle",
  stoppage: "whistle",
  "period-start": "period-start",
  "faceoff": "period-start",
  "kick-off": "period-start",
  kickoff: "period-start",
  "period-end": "period-end",
  "half-time": "period-end",
  halftime: "period-end",
  "game-end": "game-end",
  "full-time": "game-end",
  final: "game-end",
  start: "start",
  gun: "start",
  finish: "finish",
  "round-start": "round-start",
  "round-end": "round-end",
  bell: "round-end",
};

/** The kind of moment a timeline's event is, or `undefined` for one with no cue (a pass). */
export function cueKindOf(event: Pick<ReplayEvent, "kind">): CueKind | undefined {
  const word = String(event.kind).toLowerCase().trim();
  return Object.hasOwn(KIND_WORDS, word) ? KIND_WORDS[word] : undefined;
}

/**
 * The voices an event calls on a surface: its kind's cue in the sport's set, or none.
 * @example
 * ```ts
 * import { cuesOf } from "@johnmorrisdotca/kyogijo-stadiums/sound";
 * console.log(cuesOf({ kind: "goal" }, "nhl").join(), cuesOf({ kind: "goal" }, "soccer").join(), cuesOf({ kind: "whistle" }, "nba").join());
 * console.log(cuesOf({ kind: "pass" }, "nhl").length, cuesOf({ kind: "goal" }, "a-surface-with-no-sound").length);
 * // horn,swell swell whistle
 * // 0 0
 * ```
 */
export function cuesOf(event: Pick<ReplayEvent, "kind">, sport: string): readonly SoundVoice[] {
  const kind = cueKindOf(event);
  const found = soundSetOf(sport);
  if (kind === undefined || found === undefined) return [];
  return found.cues[kind] ?? [];
}

/** A cue to play: its voice, the event that called it, and the time on the timeline's clock it belongs to. */
export interface SoundCue {
  voice: SoundVoice;
  kind: CueKind;
  t: number;
  team?: "home" | "away";
}

/**
 * The cues of a move of a replay: the events it went by and the periods it began or ended, each with its voices. Only a move made by the clock playing (`tick`) or by a step forward calls
 * cues; a seek, a jump back, a pause or a change of speed calls none, as scrubbing announces nothing. The end of the last period is the game's end.
 * @example
 * ```ts
 * import { cuesOfChange } from "@johnmorrisdotca/kyogijo-stadiums/sound";
 * const state = { t: 10, start: 0, end: 60, playing: true, ended: false, speed: 1, loop: false, motion: "smooth" as const, follow: "off" as const, followHeld: false };
 * const change = { state, reason: "tick" as const, crossed: [{ t: 9.5, kind: "goal", team: "home" as const }] };
 * console.log(cuesOfChange(change, 9, "nhl").map((c) => c.voice).join());
 * console.log(cuesOfChange({ ...change, reason: "seek" as const }, 9, "nhl").length);
 * // horn,swell
 * // 0
 * ```
 */
export function cuesOfChange(change: ReplayChange, from: number, sport: string, periods: readonly SoundPeriod[] = []): SoundCue[] {
  if (change.reason !== "tick" && change.reason !== "step") return [];
  const to = change.state.t;
  if (!(to > from)) return [];
  const found = soundSetOf(sport);
  if (found === undefined) return [];
  const marks: { t: number; kind: CueKind; team?: "home" | "away" }[] = [];
  for (const event of change.crossed) {
    const kind = cueKindOf(event);
    if (kind !== undefined) marks.push(event.team === undefined ? { t: event.t, kind } : { t: event.t, kind, team: event.team });
  }
  periods.forEach((p, i) => {
    if (p.start > from && p.start <= to) marks.push({ t: p.start, kind: "period-start" });
    if (p.end > from && p.end <= to) marks.push({ t: p.end, kind: i === periods.length - 1 ? "game-end" : "period-end" });
  });
  marks.sort((a, b) => a.t - b.t);
  const out: SoundCue[] = [];
  for (const mark of marks) for (const voice of found.cues[mark.kind] ?? []) out.push(mark.team === undefined ? { voice, kind: mark.kind, t: mark.t } : { voice, kind: mark.kind, t: mark.t, team: mark.team });
  return out;
}
