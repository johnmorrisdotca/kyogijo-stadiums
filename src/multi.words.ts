// The words of a tournament layout, in English and Japanese: what each surface is called, what the empty places say, and the sentences of the description and the table. A test holds the two languages to the
// same keys. The names of the events and halls in `multi.data.ts` are proper names and are not translated.
import type { Language } from "./types.ts";
import type { MultiWord } from "./multi.types.ts";

export interface MultiWords {
  /** The name of a surface on the plan, `{n}` its number. */
  names: Record<MultiWord, string>;
  /** The names of the things that stand on and round the floor. */
  parts: { chair: string; table: string; scoreboard: string; shared: string; barrier: string; board: string; floor: string; hall: string; stands: string };
  /** What an empty place says: it is a place to be filled by the event, and nothing is printed in it. */
  slots: { floorText: string; floorLogo: string; board: string };
  /** The sentences of the title and the description. */
  say: {
    title: string;
    drawn: string;
    grid: string;
    stagger: string;
    floor: string;
    shared: string;
    slots: string;
    venue: string;
    stadium: string;
    event: string;
    basisRulebook: string;
    basisEvent: string;
  };
  /** The fit's sentences. */
  fit: { fits: string; short: string; maybe: string; tooSmall: string; turned: string; spare: string; area: string };
  /** The table that says the same as the picture. */
  table: { caption: string; surface: string; row: string; column: string; x: string; y: string; size: string; slot: string; kind: string; what: string };
}

export const MULTI_WORDS: Record<Language, MultiWords> = {
  en: {
    names: { table: "Table {n}", court: "Court {n}", sheet: "Sheet {n}", area: "Area {n}" },
    parts: { chair: "Umpire's chair", table: "Score table", scoreboard: "Scoreboard", shared: "One scoreboard for all, hung over the middle", barrier: "Barrier", board: "Board", floor: "Floor", hall: "Hall floor", stands: "Stands" },
    slots: { floorText: "Event name, year and city", floorLogo: "Logo", board: "Board" },
    say: {
      title: "{name}",
      drawn: "Drawn as: {name}, {surfaces} playing surfaces to scale on one floor of {length} by {width} metres ({area} square metres).",
      grid: "They are laid {rows} by {columns}: {rows} rows of {columns}.",
      stagger: "Every other row is moved along by {share} of a bay.",
      floor: "The floor is {look}.",
      shared: "One scoreboard for all is hung over the middle of the floor.",
      slots: "The empty places for the event's own words and marks are drawn dashed: {n}.",
      venue: "Set in {venue}: {fit}",
      stadium: "Drawn inside a stadium to the same scale: walls, stands and crowd.",
      event: "Tied to {event}, {year}, {venue}, {city}.",
      basisRulebook: "The spacing is the rulebook's; no event's plan is drawn.",
      basisEvent: "The spacing is the rulebook's; the arrangement is what the event used, read from reports and photographs, not a measured plan.",
    },
    fit: {
      fits: "it fits, with {length} by {width} metres to spare{turned}.",
      short: "it does not fit: it is short by {length} metres along and {width} metres across{turned}.",
      maybe: "it may fit: it needs {need} of its {have} square metres, and the shape of the floor is not published.",
      tooSmall: "it does not fit: it needs {need} square metres and the floor has {have}.",
      turned: ", turned a quarter",
      spare: "{length} by {width} metres",
      area: "{area} square metres",
    },
    table: { caption: "{name}: the playing surfaces and the empty places", surface: "Surface", row: "Row", column: "Column", x: "Left (m)", y: "Top (m)", size: "Size (m)", slot: "Empty place", kind: "Kind", what: "For" },
  },
  ja: {
    names: { table: "第{n}台", court: "第{n}コート", sheet: "第{n}シート", area: "第{n}試合場" },
    parts: { chair: "審判席", table: "記録台", scoreboard: "スコアボード", shared: "中央の真上に吊るした全面共用のスコアボード", barrier: "フェンス", board: "ボード", floor: "床", hall: "会場の床", stands: "スタンド" },
    slots: { floorText: "大会名・年・開催地", floorLogo: "ロゴ", board: "ボード" },
    say: {
      title: "{name}",
      drawn: "{name}。競技面を{surfaces}面、横{length}m×縦{width}m（{area}平方メートル）の床1枚の上に縮尺どおりに描いています。",
      grid: "{rows}行×{columns}列に並べています。",
      stagger: "1行おきに、1区画の{share}だけずらしています。",
      floor: "床は{look}です。",
      shared: "床の中央の上に、全面共用のスコアボードを1台吊るしています。",
      slots: "大会の文字やマークを入れる空き枠を破線で描いています：{n}か所。",
      venue: "{venue}に置いた場合：{fit}",
      stadium: "同じ縮尺で、壁・スタンド・観客を備えたスタジアムの中に描いています。",
      event: "関連する大会：{event}（{year}年、{venue}、{city}）。",
      basisRulebook: "間隔は競技規則のとおりです。特定の大会の図面は描いていません。",
      basisEvent: "間隔は競技規則のとおりです。並べ方は大会で実際に使われたものを報道や写真から読み取ったもので、実測の図面ではありません。",
    },
    fit: {
      fits: "収まります。横に{length}m、縦に{width}mの余裕があります{turned}。",
      short: "収まりません。横に{length}m、縦に{width}m足りません{turned}。",
      maybe: "収まるかもしれません。必要な面積は{need}平方メートル、床は{have}平方メートルですが、床の形は公表されていません。",
      tooSmall: "収まりません。{need}平方メートルが必要ですが、床は{have}平方メートルしかありません。",
      turned: "（90度回した向き）",
      spare: "横{length}m×縦{width}m",
      area: "{area}平方メートル",
    },
    table: { caption: "{name}：競技面と空き枠の一覧", surface: "競技面", row: "行", column: "列", x: "左（m）", y: "上（m）", size: "大きさ（m）", slot: "空き枠", kind: "種類", what: "用途" },
  },
};
