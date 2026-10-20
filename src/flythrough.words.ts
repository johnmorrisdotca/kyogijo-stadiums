// The words of the fly-through, in English and Japanese: the stages, the controls, what is said of each stage and the credit. `{name}` and the like are filled in by the mount.
import type { StageId } from "./flythrough.path.ts";
import type { Language } from "./types.ts";

/** The words of one language. */
export interface FlythroughWords {
  /** The name of the whole thing, for the region's label: `{arena}`. */
  title: string;
  /** What the region is, for a screen reader. */
  region: string;
  /** What a screen reader is told about the whole fly-through: `{arena}`, `{place}`. */
  about: string;
  /** The stages: their names and what is said of each (`{arena}`, `{place}`, `{seats}`, `{tiers}`). */
  stage: Record<StageId, { name: string; text: string }>;
  /** Said when the stage changes: `{n}`, `{total}`, `{name}`, `{text}`. */
  announce: string;
  play: string;
  pause: string;
  back: string;
  next: string;
  stages: string;
  /** The keys, under the view. */
  keys: string;
  /** The credit of the map and of the building's outline, drawn with the picture. */
  creditMap: string;
  creditPlain: string;
  /** The sentence on a still stage, for a reader who prefers reduced motion. */
  still: string;
}

export const FLYTHROUGH_WORDS: Record<Language, FlythroughWords> = {
  en: {
    title: "Fly-through: {arena}",
    region: "fly-through",
    about: "A fly-through from a map to {arena} in {place}: the map, the city, the arena in 3D, the way in over the stands and the rink seen from a seat. Play, pause, step back or forward and choose a stage with the buttons or the keys.",
    stage: {
      map: { name: "Map", text: "{arena} stands in {place}." },
      city: { name: "City", text: "The building of {arena} from above, as OpenStreetMap maps it." },
      arena: { name: "Arena", text: "{arena} in 3D, turning." },
      bowl: { name: "Bowl", text: "In over the stands, with the roof lifted away: a plausible bowl of {seats} seats in {tiers} tiers, not a seat map." },
      rink: { name: "Rink", text: "A view across the ice from the stands, turning; the place and the height of the seat are ours, not a real seat's." },
    },
    announce: "Stage {n} of {total}: {name}. {text}",
    play: "Play",
    pause: "Pause",
    back: "Back",
    next: "Next",
    stages: "Stages",
    keys: "Space plays or pauses. Left and right arrows go back and forward a stage; the number keys choose a stage; Home starts again.",
    creditMap: "Map: Natural Earth (public domain), drawn with chizu. Building outline: (c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright.",
    creditPlain: "Building outline: (c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright.",
    still: "Each stage is shown as a still picture, because this device is set to reduce motion.",
  },
  ja: {
    title: "フライスルー：{arena}",
    region: "フライスルー",
    about: "地図から{place}の{arena}まで進むフライスルーです。地図、都市、3Dのアリーナ、スタンドの上空から中へ入る場面、客席から見たリンクの順に見られます。ボタンまたはキーで、再生・一時停止、前後の場面への移動、場面の選択ができます。",
    stage: {
      map: { name: "地図", text: "{arena}は{place}にあります。" },
      city: { name: "都市", text: "{arena}の建物を真上から見たところです（OpenStreetMapの記録による）。" },
      arena: { name: "アリーナ", text: "{arena}を3Dで回転させて表示しています。" },
      bowl: { name: "客席", text: "屋根を取り払い、スタンドの上空から中へ入ります。{seats}席・{tiers}層の推定のスタンドで、実際の座席表ではありません。" },
      rink: { name: "リンク", text: "スタンドからリンクを見渡した眺めで、ゆっくり回転します。視点の位置と高さは仮のもので、実在の座席ではありません。" },
    },
    announce: "場面{n}／{total}：{name}。{text}",
    play: "再生",
    pause: "一時停止",
    back: "戻る",
    next: "次へ",
    stages: "場面",
    keys: "スペースキーで再生・一時停止。左右の矢印キーで前後の場面へ、数字キーで場面を選び、Homeキーで最初に戻ります。",
    creditMap: "地図：Natural Earth（パブリックドメイン）、chizuで描画。建物の輪郭：(c) OpenStreetMap contributors、ODbL 1.0、openstreetmap.org/copyright。",
    creditPlain: "建物の輪郭：(c) OpenStreetMap contributors、ODbL 1.0、openstreetmap.org/copyright。",
    still: "この端末は動きを減らす設定のため、各場面を静止画で表示しています。",
  },
};

/** A sentence with its `{name}` slots filled in. */
export const say = (text: string, values: Record<string, string | number | undefined>): string => text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
