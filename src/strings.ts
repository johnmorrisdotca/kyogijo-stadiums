import type { Language, Sport } from "./types.ts";

/** The words the drawing says itself, in English and Japanese. */
export interface KyogijoWords {
  /** The name of each surface. */
  surface: Record<Sport, string>;
  /** What each surface is, for the description: a sentence fragment. */
  about: Record<Sport, string>;
  /** The standard statuses. */
  status: Record<"final" | "final-ot" | "final-so" | "live" | "half" | "postponed", string>;
  /** The title of a score: placeholders {away}, {awayScore}, {home} and {homeScore}. */
  scoreTitle: string;
  /** The sentences of a description. */
  said: {
    home: string;
    away: string;
    won: string;
    tied: string;
    park: string;
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
    surface: { nfl: "NFL football field", cfl: "CFL football field", ifaf: "IFAF football field", nhl: "NHL hockey rink", nba: "NBA basketball court", mlb: "Baseball field" },
    about: {
      nfl: "an American football field, 120 by 53 and a third yards with its end zones, with a yard line every 5 yards, hash marks, numbers and goal posts",
      cfl: "a Canadian football field, 150 by 65 yards with its 20-yard end zones, with a yard line every 5 yards, hash marks, numbers and goal posts on the goal lines",
      ifaf: "an international (IFAF) football field, 120 by 53 and a third yards with its end zones, with a yard line every 5 yards, hash marks, numbers and goal posts",
      nhl: "an ice hockey rink, 200 by 85 feet with rounded corners, with its red and blue lines, face-off circles, creases and goal nets",
      nba: "a basketball court, 94 by 50 feet, with its keys, three-point lines, free-throw circles and the centre circle",
      mlb: "a baseball field, with a 90-foot infield, the mound, the foul lines and the outfield fence",
    },
    status: { final: "Final", "final-ot": "Final/OT", "final-so": "Final/SO", live: "Live", half: "Halftime", postponed: "Postponed" },
    scoreTitle: "{away} {awayScore}, {home} {homeScore}",
    said: { home: "home", away: "away", won: "{name} won.", tied: "The game is level.", park: "The outfield fence follows the figures published for {park}.", on: "Drawn as", sep: ", ", stop: ".", colon: ": ", gap: " " },
  },
  ja: {
    surface: { nfl: "NFLのフィールド", cfl: "CFLのフィールド", ifaf: "IFAFのフィールド", nhl: "NHLのアイスホッケーリンク", nba: "NBAのバスケットボールコート", mlb: "野球場" },
    about: {
      nfl: "アメリカンフットボールのフィールド。エンドゾーンを含めて120ヤード×53⅓ヤードで、5ヤードごとのヤードライン、ハッシュマーク、ヤードナンバー、ゴールポストがあります",
      cfl: "カナディアンフットボールのフィールド。20ヤードのエンドゾーンを含めて150ヤード×65ヤードで、5ヤードごとのヤードライン、ハッシュマーク、ヤードナンバー、ゴールライン上のゴールポストがあります",
      ifaf: "国際アメリカンフットボール連盟（IFAF）規格のフィールド。エンドゾーンを含めて120ヤード×53⅓ヤードで、5ヤードごとのヤードライン、ハッシュマーク、ヤードナンバー、ゴールポストがあります",
      nhl: "アイスホッケーのリンク。200フィート（約61m）×85フィート（約26m）で角が丸く、レッドライン、ブルーライン、フェイスオフサークル、クリース、ゴールがあります",
      nba: "バスケットボールのコート。94フィート（約28.7m）×50フィート（約15.2m）で、ペイントエリア、スリーポイントライン、フリースローサークル、センターサークルがあります",
      mlb: "野球場。塁間90フィート（約27.4m）の内野、マウンド、ファウルライン、外野フェンスがあります",
    },
    status: { final: "試合終了", "final-ot": "試合終了（延長）", "final-so": "試合終了（SO）", live: "試合中", half: "ハーフタイム", postponed: "延期" },
    scoreTitle: "{away} {awayScore}、{home} {homeScore}",
    said: { home: "ホーム", away: "アウェイ", won: "{name}の勝ちです。", tied: "同点です。", park: "外野フェンスは、{park}の公表されている距離をもとに描かれています。", on: "図の内容", sep: "、", stop: "。", colon: "：", gap: "" },
  },
};

/** Fill {placeholders} in a template. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
