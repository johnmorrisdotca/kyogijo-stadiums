// The sound entry (`@johnmorrisdotca/kyogijo-stadiums/sound`): a surface's sound in a page, a crowd bed for its kind of venue at a level, heard in the room its venue makes, and the cues of
// its sport (a goal horn, a whistle, a buzzer, a bell) from a replay it follows or from events pushed as they happen. Made in the browser with Web Audio; recordings are a page's own files.
export { SOUND_TAIL, createKyogijoSound } from "./sound.dom.ts";
export type { KyogijoSound, SoundAudioContext, SoundFetch, SoundFileName, SoundFollow, SoundLevelChoice, SoundQuiet, SoundSettings, SoundState } from "./sound.dom.ts";
export { LEVEL_MIX, cueKindOf, cuesOf, cuesOfChange, excitementAt, levelFor, soundLevelsOf, soundMix, soundRoom, soundSetOf, soundVoicesOf } from "./sound.mix.ts";
export type { GameMoment, SoundContext, SoundCue, SoundMix, SoundPeriod, SoundRoom, SoundVenue } from "./sound.mix.ts";
export { CUE_KINDS, SOUND_BEDS, SOUND_LEVELS, SOUND_OF_SPORT, SOUND_SETS } from "./sound.sets.ts";
export type { CueKind, SoundBed, SoundBedId, SoundLayer, SoundLevel, SoundSet, SoundVoice } from "./sound.sets.ts";
export { SOUND_WORDS } from "./sound.words.ts";
export type { SoundWords } from "./sound.words.ts";
