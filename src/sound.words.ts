// The words of a surface's sound in English and Japanese, for a page that makes its own controls: the levels, the kinds of venue and the controls' names.
import type { SoundBedId, SoundLevel } from "./sound.sets.ts";

/** The words of the sound in a language. */
export interface SoundWords {
  /** The sound's toggle and its tip. */
  sound: string;
  soundTip: string;
  volume: string;
  /** The group of the crowd's levels. */
  crowdLevel: string;
  /** The level that follows the game. */
  auto: string;
  levels: Readonly<Record<SoundLevel, string>>;
  beds: Readonly<Record<SoundBedId, string>>;
}

/** The sound's words, by language. */
export const SOUND_WORDS: Readonly<Record<"en" | "ja", SoundWords>> = {
  en: {
    sound: "Sound",
    soundTip: "The crowd and the game's sounds, made in your browser. Off until you turn it on.",
    volume: "Volume",
    crowdLevel: "Crowd",
    auto: "Follow the game",
    levels: { quiet: "Quiet", murmur: "Murmur", engaged: "Engaged", loud: "Loud", roar: "Roar" },
    beds: { arena: "Arena", stadium: "Open stadium", ballpark: "Ballpark", hall: "Court hall", pool: "Pool", dojo: "Dojo", ring: "Ring", track: "Track" },
  },
  ja: {
    sound: "サウンド",
    soundTip: "観客と試合の音をブラウザーの中で作ります。オンにするまで鳴りません。",
    volume: "音量",
    crowdLevel: "観客",
    auto: "試合に合わせる",
    levels: { quiet: "静か", murmur: "ざわめき", engaged: "盛り上がり", loud: "歓声", roar: "大歓声" },
    beds: { arena: "アリーナ", stadium: "屋外スタジアム", ballpark: "野球場", hall: "体育館", pool: "プール", dojo: "道場", ring: "リング", track: "陸上競技場" },
  },
};
