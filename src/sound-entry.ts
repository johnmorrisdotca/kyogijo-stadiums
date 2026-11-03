// The sound entry (`@johnmorrisdotca/kyogijo-stadiums/sound`): a surface's sound in a page, a crowd bed for its kind of venue at a level, heard in the room its venue makes. Made in the
// browser with Web Audio; recordings are a page's own files.
export { createKyogijoSound } from "./sound.dom.ts";
export type { KyogijoSound, SoundAudioContext, SoundFetch, SoundFileName, SoundQuiet, SoundSettings, SoundState } from "./sound.dom.ts";
export { LEVEL_MIX, levelFor, soundLevelsOf, soundMix, soundRoom, soundSetOf } from "./sound.mix.ts";
export type { SoundContext, SoundMix, SoundRoom, SoundVenue } from "./sound.mix.ts";
export { SOUND_BEDS, SOUND_LEVELS, SOUND_OF_SPORT, SOUND_SETS } from "./sound.sets.ts";
export type { CueKind, SoundBed, SoundBedId, SoundLayer, SoundLevel, SoundSet, SoundVoice } from "./sound.sets.ts";
export { SOUND_WORDS } from "./sound.words.ts";
export type { SoundWords } from "./sound.words.ts";
