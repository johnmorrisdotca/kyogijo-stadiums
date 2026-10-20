// The words of a judging assignment, in English and Japanese: what a mat is called, what the chart's columns are, and the sentences of the description and the table. A test holds the two languages to the same keys.
// Names and IDs are the caller's and are never translated.
import type { Language } from "./types.ts";

export interface JudgingWords {
  /** The name of a mat when the caller gives none, `{n}` its number. */
  mat: string;
  /** What a style is called on the plan, `{count}` the number of seats. */
  styleName: { kata: string; shiai: string };
  /** The chart: its heading, its columns, the word before an ID and what a seat with nobody in it says. */
  chart: { heading: string; seat: string; name: string; id: string; idLabel: string; vacant: string };
  /** The sentences of the title and the description. */
  say: { title: string; matsOne: string; matsMany: string; mat: string; seat: string; seatNoId: string; seatVacant: string; names: string; chartOnly: string; join: string };
  /** The table that says the same as the picture. */
  table: { caption: string; mat: string; seat: string; name: string; id: string };
  /** What the 3D view says of the seats' name cards. */
  turn: { standing: string; board: string };
}

export const JUDGING_WORDS: Record<Language, JudgingWords> = {
  en: {
    mat: "Mat {n}",
    styleName: { kata: "Kata, {count} judges", shiai: "Shiai, {count} officials" },
    chart: { heading: "Judging assignments", seat: "Seat", name: "Name", id: "ID", idLabel: "ID", vacant: "Not assigned" },
    say: {
      title: "Judging assignments: {style}, {mats}",
      matsOne: "1 mat",
      matsMany: "{n} mats",
      mat: "{label}: {seats}.",
      seat: "{seat} {name}, ID {id}",
      seatNoId: "{seat} {name}",
      seatVacant: "{seat} not assigned",
      names: "The names are in the seats where they fit, and in the chart of mat, seat, name and ID.",
      chartOnly: "The names are in the chart of mat, seat, name and ID.",
      join: "; ",
    },
    table: { caption: "{title}", mat: "Mat", seat: "Seat", name: "Name", id: "ID" },
    turn: { standing: "A name card stands at each judge's seat, turned to face the eye, and the name of each mat stands over its judges' table.", board: "Mat" },
  },
  ja: {
    mat: "第{n}試合場",
    styleName: { kata: "形（{count}人制）", shiai: "試合（{count}人体制）" },
    chart: { heading: "審判員の配置", seat: "席", name: "氏名", id: "ID", idLabel: "ID", vacant: "未定" },
    say: {
      title: "審判員の配置：{style}、{mats}",
      matsOne: "試合場1面",
      matsMany: "試合場{n}面",
      mat: "{label}：{seats}。",
      seat: "{seat}は{name}（ID {id}）",
      seatNoId: "{seat}は{name}",
      seatVacant: "{seat}は未定",
      names: "氏名は、席に収まる場合は各席の中に表示し、試合場・席・氏名・IDの一覧表にも載せています。",
      chartOnly: "氏名は、試合場・席・氏名・IDの一覧表に載せています。",
      join: "、",
    },
    table: { caption: "{title}", mat: "試合場", seat: "席", name: "氏名", id: "ID" },
    turn: { standing: "各審判員の席に名札を置き、見ている方向に向くようにしています。各試合場の名前は審判員席の上に掲げています。", board: "試合場" },
  },
};
