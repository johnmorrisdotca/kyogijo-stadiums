// The index of the sound sets: a crowd bed for each kind of venue, and the cues of each sport. It is data, as the examples' index of games is: a surface's sound is looked up here, and the
// controls a page shows are the ones the surface's set has. A surface with no set has no sound, and no controls. Nothing here is a recording: the voices are names, which the engine
// (sound.dom.ts) makes in the browser with Web Audio or plays from a file a page gives it.
import type { Sport } from "./types.ts";

/** How excited a crowd is, from a near-empty room to a roar. */
export type SoundLevel = "quiet" | "murmur" | "engaged" | "loud" | "roar";

/** The levels, quietest first. */
export const SOUND_LEVELS: readonly SoundLevel[] = ["quiet", "murmur", "engaged", "loud", "roar"];

/**
 * The layers of a crowd bed, each a loop the engine keeps running while the sound is on, and turns up and down: `room` the air of the building, `murmur` people talking, `applause` hands, `roar`
 * a crowd's voice together. The pool's bed has `water` as well.
 */
export type SoundLayer = "room" | "murmur" | "applause" | "roar" | "water";

/** The voices a cue may use. Each is a short sound the engine makes in the browser, or plays from a file a page gives (`files`). */
export type SoundVoice =
  /** An arena's goal horn: one long blast of a low chord, never a tune. */
  | "horn"
  /** A referee's pea whistle, with its trill. */
  | "whistle"
  /** A long whistle and two short ones before it: the end of a game in football and the field games. */
  | "whistle-end"
  /** A scoreboard's buzzer at the end of a period. */
  | "buzzer"
  /** A ring's bell, struck three times. */
  | "bell"
  /** A starting gun. */
  | "gun"
  /** The electronic start of a swimming race. */
  | "beep"
  /** A crowd that rises for a moment: "ooh", a near miss. */
  | "ooh"
  /** A cheer of a few people, for a point in a quiet hall. */
  | "cheer"
  /** Applause that comes and goes. */
  | "applause"
  /** The whole crowd's roar, swelling and settling over some seconds: a goal. */
  | "swell";

/** What a kind of venue sounds like: the bed's layers and the room they are heard in. */
export interface SoundBed {
  /** The kind of venue, as in `SOUND_BEDS`. */
  id: SoundBedId;
  /** Indoors (an arena, a hall, a pool) or out (a stadium, a ballpark, a track) when the venue says nothing of its roof. */
  indoor: boolean;
  /** How long the room rings, in seconds, for a venue of `seats` people: a full arena is about 2 s, a stadium in the open about 0.6 s. */
  decay: number;
  /** The people the bed is made for: a venue of other size is louder or quieter than the bed by the share of people (the context's `seats`). */
  seats: number;
  /** The layers the bed has. */
  layers: readonly SoundLayer[];
  /** The crowd levels it offers, quietest first: a dojo for kyudo has no roar. */
  levels: readonly SoundLevel[];
}

/** The kinds of venue that have a bed. */
export type SoundBedId = "arena" | "stadium" | "ballpark" | "hall" | "pool" | "dojo" | "ring" | "track";

const ALL = SOUND_LEVELS;
const CROWD: readonly SoundLayer[] = ["room", "murmur", "applause", "roar"];

/** The crowd beds, one for each kind of venue. */
export const SOUND_BEDS: Readonly<Record<SoundBedId, SoundBed>> = {
  arena: { id: "arena", indoor: true, decay: 2.2, seats: 18000, layers: CROWD, levels: ALL },
  stadium: { id: "stadium", indoor: false, decay: 0.7, seats: 50000, layers: CROWD, levels: ALL },
  ballpark: { id: "ballpark", indoor: false, decay: 0.6, seats: 40000, layers: CROWD, levels: ALL },
  hall: { id: "hall", indoor: true, decay: 1.6, seats: 4000, layers: CROWD, levels: ALL },
  pool: { id: "pool", indoor: true, decay: 2.6, seats: 5000, layers: ["room", "water", "murmur", "applause", "roar"], levels: ALL },
  dojo: { id: "dojo", indoor: true, decay: 1.3, seats: 2000, layers: ["room", "murmur", "applause"], levels: ["quiet", "murmur", "engaged", "loud"] },
  ring: { id: "ring", indoor: true, decay: 1.8, seats: 8000, layers: CROWD, levels: ALL },
  track: { id: "track", indoor: false, decay: 0.8, seats: 30000, layers: CROWD, levels: ALL },
};

/** The kinds of moment a cue answers. A timeline's own event kinds are read into these by `cueKindOf`. */
export type CueKind = "goal" | "point" | "shot" | "whistle" | "period-start" | "period-end" | "game-end" | "start" | "finish" | "round-start" | "round-end";

/** The kinds of moment, in the order the docs list them. */
export const CUE_KINDS: readonly CueKind[] = ["goal", "point", "shot", "whistle", "period-start", "period-end", "game-end", "start", "finish", "round-start", "round-end"];

/** A sport's sound: the bed of its usual venue and what plays for each kind of moment (nothing, for a kind it does not list). */
export interface SoundSet {
  /** The set's id: the sport's family (`hockey`, `soccer`, `court`, ...). */
  id: string;
  bed: SoundBedId;
  cues: Readonly<Partial<Record<CueKind, readonly SoundVoice[]>>>;
  /** The crowd levels this sport offers, when fewer than its bed's (kyudo: a still hall). */
  levels?: readonly SoundLevel[];
}

const FIELD: SoundSet["cues"] = { goal: ["swell"], point: ["cheer"], shot: ["ooh"], whistle: ["whistle"], "period-start": ["whistle"], "period-end": ["whistle-end"], "game-end": ["whistle-end", "swell"] };
const COURT: SoundSet["cues"] = { goal: ["applause"], point: ["applause"], shot: ["ooh"], whistle: ["whistle"], "period-end": ["whistle"], "game-end": ["applause", "swell"] };
const set = (id: string, bed: SoundBedId, cues: SoundSet["cues"], levels?: readonly SoundLevel[]): SoundSet => (levels === undefined ? { id, bed, cues } : { id, bed, cues, levels });

/** The sound sets, by family: a sport takes its family's (`SOUND_OF_SPORT`). */
export const SOUND_SETS: Readonly<Record<string, SoundSet>> = {
  hockey: set("hockey", "arena", { goal: ["horn", "swell"], point: ["horn", "swell"], shot: ["ooh"], whistle: ["whistle"], "period-end": ["buzzer"], "game-end": ["buzzer", "horn", "swell"] }),
  basketball: set("basketball", "arena", { goal: ["cheer"], point: ["cheer"], shot: ["ooh"], whistle: ["whistle"], "period-end": ["buzzer"], "game-end": ["buzzer", "swell"] }),
  football: set("football", "stadium", { ...FIELD, "period-end": ["whistle"], "game-end": ["whistle", "swell"] }),
  soccer: set("soccer", "stadium", FIELD),
  field: set("field", "stadium", FIELD),
  baseball: set("baseball", "ballpark", { goal: ["swell"], point: ["swell"], shot: ["ooh"], "game-end": ["swell"] }),
  cricket: set("cricket", "ballpark", { goal: ["applause"], point: ["applause"], shot: ["ooh"], "game-end": ["applause"] }),
  court: set("court", "hall", COURT),
  curling: set("curling", "hall", { goal: ["applause"], point: ["applause"], shot: ["ooh"], "game-end": ["applause"] }, ["quiet", "murmur", "engaged"]),
  pool: set("pool", "pool", { start: ["beep"], goal: ["swell"], point: ["cheer"], finish: ["swell"], whistle: ["whistle"], "game-end": ["swell"] }),
  track: set("track", "track", { start: ["gun"], finish: ["swell"], goal: ["swell"], point: ["cheer"], "game-end": ["applause"] }),
  skating: set("skating", "arena", { start: ["gun"], finish: ["swell"], goal: ["swell"], point: ["applause"], "game-end": ["applause"] }),
  budo: set("budo", "dojo", { goal: ["applause"], point: ["applause"], "game-end": ["applause"] }),
  kyudo: set("kyudo", "dojo", { goal: ["applause"], point: ["applause"], "game-end": ["applause"] }, ["quiet", "murmur"]),
  sumo: set("sumo", "ring", { goal: ["swell"], point: ["swell"], "game-end": ["swell"] }),
  combat: set("combat", "ring", { goal: ["swell"], point: ["ooh"], shot: ["ooh"], "round-start": ["bell"], "round-end": ["bell"], "game-end": ["bell", "swell"] }),
};

/** Which set each sport takes: every surface the package draws has one. */
export const SOUND_OF_SPORT: Readonly<Record<Sport, string>> = {
  nfl: "football",
  cfl: "football",
  ifaf: "football",
  nhl: "hockey",
  nba: "basketball",
  mlb: "baseball",
  soccer: "soccer",
  curling: "curling",
  tennis: "court",
  volleyball: "court",
  badminton: "court",
  pickleball: "court",
  tabletennis: "court",
  padel: "court",
  squash: "court",
  racquetball: "court",
  sepaktakraw: "court",
  teqball: "court",
  roundnet: "court",
  netball: "court",
  handball: "court",
  swimming: "pool",
  waterpolo: "pool",
  diving: "pool",
  artisticswimming: "pool",
  athletics: "track",
  skating: "skating",
  judo: "budo",
  karate: "budo",
  kendo: "budo",
  dojo: "budo",
  kyudo: "kyudo",
  sumo: "sumo",
  mma: "combat",
  boxing: "combat",
  wrestling: "combat",
  prowrestling: "combat",
  lacrosse: "field",
  rugby: "field",
  afl: "field",
  gaelic: "field",
  fieldhockey: "field",
  cricket: "cricket",
};
