import type { Language, Sport } from "./types.ts";

/** The words the drawing says itself, in English and Japanese. */
export interface KyogijoWords {
  /** The name of each surface. */
  surface: Record<Sport, string>;
  /** What each surface is, for the description: a sentence fragment. */
  about: Record<Sport, string>;
  /** The standard statuses. */
  status: Record<"final" | "final-ot" | "final-so" | "final-aet" | "final-pens" | "live" | "half" | "extra-time" | "penalties" | "postponed", string>;
  /** The soccer pitch: its names, and the descriptions with {length} and {width} in metres. */
  soccer: { futsal: string; aboutFutsal: string; half: string };
  /** The title of a score: placeholders {away}, {awayScore}, {home} and {homeScore}. */
  scoreTitle: string;
  /** The sentences of a description. */
  said: {
    home: string;
    away: string;
    won: string;
    tied: string;
    park: string;
    /** A game decided on penalties: {name}, and the shoot-out score {a}-{b}, winner first. */
    wonPens: string;
    /** The shoot-out, as it is written beside a status: {a} and {b}, in the order of the sides on the drawing. */
    pens: string;
    on: string;
    /** What joins a title's parts. */
    sep: string;
    /** The end of a sentence, the colon, and what goes between sentences. */
    stop: string;
    colon: string;
    gap: string;
  };
}

/** The words of the package, by language. */
export const KYOGIJO_STRINGS: Record<Language, KyogijoWords> = {
  en: {
    surface: { nfl: "NFL football field", cfl: "CFL football field", ifaf: "IFAF football field", nhl: "NHL hockey rink", nba: "NBA basketball court", mlb: "Baseball field", soccer: "Soccer pitch" },
    about: {
      nfl: "an American football field, 120 by 53 and a third yards with its end zones, with a yard line every 5 yards, hash marks, numbers and goal posts",
      cfl: "a Canadian football field, 150 by 65 yards with its 20-yard end zones, with a yard line every 5 yards, hash marks, numbers and goal posts on the goal lines",
      ifaf: "an international (IFAF) football field, 120 by 53 and a third yards with its end zones, with a yard line every 5 yards, hash marks, numbers and goal posts",
      nhl: "an ice hockey rink, 200 by 85 feet with rounded corners, with its red and blue lines, face-off circles, creases and goal nets",
      nba: "a basketball court, 94 by 50 feet, with its keys, three-point lines, free-throw circles and the centre circle",
      mlb: "a baseball field, with a 90-foot infield, the mound, the foul lines and the outfield fence",
      soccer: "a soccer pitch, {length} by {width} metres, with the halfway line, the centre circle, both penalty areas, goal areas, penalty marks and arcs, the corner arcs and the goals",
    },
    status: { final: "Final", "final-ot": "Final/OT", "final-so": "Final/SO", "final-aet": "Final/AET", "final-pens": "Final/Pens", live: "Live", half: "Halftime", "extra-time": "Extra time", penalties: "Penalties", postponed: "Postponed" },
    soccer: { futsal: "Futsal court", aboutFutsal: "a futsal court, {length} by {width} metres, with the halfway line, the centre circle, both penalty areas, the penalty marks and the goals", half: "Half of it is shown." },
    scoreTitle: "{away} {awayScore}, {home} {homeScore}",
    said: { home: "home", away: "away", won: "{name} won.", tied: "The game is level.", park: "The outfield fence follows the figures published for {park}.", wonPens: "{name} won {a}-{b} on penalties.", pens: "{a}-{b} pens", on: "Drawn as", sep: ", ", stop: ".", colon: ": ", gap: " " },
  },
  ja: {
    surface: { nfl: "NFLのフィールド", cfl: "CFLのフィールド", ifaf: "IFAFのフィールド", nhl: "NHLのアイスホッケーリンク", nba: "NBAのバスケットボールコート", mlb: "野球場", soccer: "サッカーのピッチ" },
    about: {
      nfl: "アメリカンフットボールのフィールド。エンドゾーンを含めて120ヤード×53⅓ヤードで、5ヤードごとのヤードライン、ハッシュマーク、ヤードナンバー、ゴールポストがあります",
      cfl: "カナディアンフットボールのフィールド。20ヤードのエンドゾーンを含めて150ヤード×65ヤードで、5ヤードごとのヤードライン、ハッシュマーク、ヤードナンバー、ゴールライン上のゴールポストがあります",
      ifaf: "国際アメリカンフットボール連盟（IFAF）規格のフィールド。エンドゾーンを含めて120ヤード×53⅓ヤードで、5ヤードごとのヤードライン、ハッシュマーク、ヤードナンバー、ゴールポストがあります",
      nhl: "アイスホッケーのリンク。200フィート（約61m）×85フィート（約26m）で角が丸く、レッドライン、ブルーライン、フェイスオフサークル、クリース、ゴールがあります",
      nba: "バスケットボールのコート。94フィート（約28.7m）×50フィート（約15.2m）で、ペイントエリア、スリーポイントライン、フリースローサークル、センターサークルがあります",
      mlb: "野球場。塁間90フィート（約27.4m）の内野、マウンド、ファウルライン、外野フェンスがあります",
      soccer: "サッカーのピッチ。{length}m×{width}mで、ハーフウェーライン、センターサークル、両側のペナルティーエリア、ゴールエリア、ペナルティーマークとペナルティーアーク、コーナーアーク、ゴールがあります",
    },
    status: { final: "試合終了", "final-ot": "試合終了（延長）", "final-so": "試合終了（SO）", "final-aet": "試合終了（延長戦）", "final-pens": "試合終了（PK戦）", live: "試合中", half: "ハーフタイム", "extra-time": "延長戦", penalties: "PK戦", postponed: "延期" },
    soccer: { futsal: "フットサルのコート", aboutFutsal: "フットサルのコート。{length}m×{width}mで、ハーフウェーライン、センターサークル、両側のペナルティーエリア、ペナルティーマーク、ゴールがあります", half: "半面のみ表示しています。" },
    scoreTitle: "{away} {awayScore}、{home} {homeScore}",
    said: { home: "ホーム", away: "アウェイ", won: "{name}の勝ちです。", tied: "同点です。", park: "外野フェンスは、{park}の公表されている距離をもとに描かれています。", wonPens: "{name}がPK戦を{a}-{b}で制しました。", pens: "PK戦 {a}-{b}", on: "図の内容", sep: "、", stop: "。", colon: "：", gap: "" },
  },
};

/** Fill {placeholders} in a template. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
