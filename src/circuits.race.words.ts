// The words of a simulated race: its controls, its clock, its timing board and what it says aloud, in English and Japanese. `{lap}` and the like are filled in by `fill`.
import type { Language } from "./types.ts";

/** What a race's pictures, controls and board say. */
export interface RaceWords {
  /** The line that says what this is: a model, not a real race. */
  simulated: string;
  /** The same line for a race from a feed the reader chose. */
  feedNote: string;
  /** The race clock: the lap the leader is on, and the line under it once the flag has fallen. */
  lap: string;
  finalLap: string;
  flag: string;
  grid: string;
  /** The time since the start, for a screen reader. */
  elapsed: string;
  /** The controls. */
  group: string;
  play: string;
  pause: string;
  nextLap: string;
  /** Back to the start, one lap back, and loop. */
  start: string;
  prevLap: string;
  loop: string;
  /** The timing tower in the scene and over the view, and the podium card at the flag. */
  tower: { caption: string; fastest: string; fastShort: string; lapShort: string; pit: string };
  podium: { title: string; label: string; close: string; show: string; fastest: string; pending: string; final: string };
  /** The keys, flat and over the 3D view (whose arrow keys turn the view). */
  keys: string;
  keysTurn: string;
  speed: string;
  speedValue: string;
  position: string;
  positionValue: string;
  /** The board: its caption, its heads, and what a line says. */
  board: { caption: string; position: string; driver: string; team: string; gap: string; interval: string; last: string; best: string; stops: string; leader: string; lapDown: string; lapsDown: string; pit: string; out: string; finished: string; fastest: string };
  /** A car on the drawing, for a screen reader. */
  car: string;
  /** What is said aloud as the race goes. */
  leads: string;
  wins: string;
  /** The drawing's description, added to the circuit's: a simulation's, and a race from a feed's. */
  description: string;
  fromFeed: string;
}

export const RACE_WORDS: Readonly<Record<Language, RaceWords>> = Object.freeze({
  en: {
    simulated: "A simulated race: made-up cars and drivers, worked out from a seed. No real race, driver or team.",
    feedNote: "A race from a feed you chose: its names, times and results are the feed's, shown in this page only. Between the times it gives, each car runs at the lap's own speeds.",
    lap: "Lap {lap} / {laps}",
    finalLap: "Final lap",
    flag: "Chequered flag",
    grid: "On the grid",
    elapsed: "Race time {time}",
    group: "Race",
    play: "Play the race",
    pause: "Pause the race",
    nextLap: "Next lap",
    tower: { caption: "Timing tower", fastest: "Fastest lap", fastShort: "FL", lapShort: "L{lap}", pit: "PIT" },
    podium: { title: "Chequered flag", label: "The podium", close: "Close the podium", show: "Podium", fastest: "Fastest lap: {code} {name}, {time}, lap {lap}", pending: "still racing", final: "Final classification" },
    start: "Back to the start",
    prevLap: "Previous lap",
    loop: "Loop the race",
    keys: "The race. Space plays or pauses, the left and right arrow keys go to the previous or next lap, Shift with an arrow key moves a minute, and Home and End go to the ends.",
    keysTurn: "The race on the 3D view. Space plays or pauses; comma and full stop go to the previous or next lap, and with Shift move a minute; End goes to the end. The arrow keys still turn the view. On the race's controls the arrow keys go by laps, and Home and End go to the ends.",
    speed: "Speed",
    speedValue: "{speed}×",
    position: "Race time",
    positionValue: "{time} of {total}",
    board: { caption: "Timing board", position: "Pos", driver: "Driver", team: "Team", gap: "Gap", interval: "Interval", last: "Last lap", best: "Best lap", stops: "Pits", leader: "Leader", lapDown: "+1 lap", lapsDown: "+{n} laps", pit: "In the pit lane", out: "Out", finished: "Finished", fastest: "Fastest lap" },
    car: "{position}: {name}, {team}",
    leads: "{name} leads, lap {lap}.",
    wins: "Chequered flag: {name} wins.",
    description: "{cars} made-up cars race {laps} laps from the grid to the chequered flag: a simulation, not a real race.",
    fromFeed: "{cars} cars race {laps} laps, from a feed the reader chose: where each car is between the times it gives is worked out at the lap's own speeds.",
  },
  ja: {
    simulated: "シミュレーションによるレースです。架空のマシンとドライバーで、シード値から計算しています。実在のレース・ドライバー・チームとは関係ありません。",
    feedNote: "選んだフィードのレースです。名前、タイム、結果はフィードのもので、このページの中だけに表示します。フィードが示す時刻の間は、各マシンがそのコースの速度で走るものとして計算しています。",
    lap: "{lap} / {laps}周",
    finalLap: "ファイナルラップ",
    flag: "チェッカーフラッグ",
    grid: "スタート前",
    elapsed: "レース経過時間 {time}",
    group: "レース",
    play: "レースを再生",
    pause: "レースを一時停止",
    nextLap: "次の周へ",
    tower: { caption: "タイミングタワー", fastest: "ファステストラップ", fastShort: "FL", lapShort: "{lap}周", pit: "ピット" },
    podium: { title: "チェッカーフラッグ", label: "表彰台", close: "表彰台を閉じる", show: "表彰台", fastest: "ファステストラップ：{code} {name}、{time}（{lap}周目）", pending: "走行中", final: "最終順位" },
    start: "最初に戻る",
    prevLap: "前の周へ",
    loop: "繰り返し",
    keys: "レースです。スペースキーで再生と一時停止、左右の矢印キーで前の周と次の周に移動、Shiftキーを押しながら矢印キーで1分ずつ移動、Homeキーで最初、Endキーで最後に移動します。",
    keysTurn: "3Dビューでのレースです。スペースキーで再生と一時停止、カンマキーで前の周、ピリオドキーで次の周に移動します。Shiftキーを押しながらカンマキーかピリオドキーで1分ずつ移動し、Endキーで最後に移動します。矢印キーではこれまでどおりビューを回せます。レースの操作ボタンにフォーカスがあるときは、左右の矢印キーで周ごとに移動し、Homeキーで最初、Endキーで最後に移動します。",
    speed: "再生速度",
    speedValue: "{speed}倍",
    position: "レース経過時間",
    positionValue: "{time} / {total}",
    board: { caption: "タイミングボード", position: "順位", driver: "ドライバー", team: "チーム", gap: "トップ差", interval: "前車との差", last: "前周タイム", best: "ベストラップ", stops: "ピット回数", leader: "トップ", lapDown: "+1周", lapsDown: "+{n}周", pit: "ピットレーン", out: "リタイア", finished: "完走", fastest: "ファステストラップ" },
    car: "{position}位：{name}（{team}）",
    leads: "{lap}周目、{name}がトップ。",
    wins: "チェッカーフラッグ：{name}が優勝。",
    description: "架空のマシン{cars}台が、グリッドからチェッカーフラッグまで{laps}周を走ります。実際のレースではなく、シミュレーションです。",
    fromFeed: "選んだフィードから、{cars}台のマシンが{laps}周を走ります。フィードが示す時刻の間の各マシンの位置は、そのコースの速度から計算しています。",
  },
});
