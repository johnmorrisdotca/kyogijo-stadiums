// The words of a circuit's drawing and its 3D view, in English and Japanese. `{name}` and the like are filled in by `fill`.
import type { Language } from "./types.ts";

/** What a circuit's pictures say. */
export interface CircuitWords {
  /** The title: the circuit's name. */
  title: string;
  /** The line under the name: the length and the number of turns. */
  facts: string;
  /** The description, sentence by sentence. */
  lap: string;
  counterclockwise: string;
  clockwise: string;
  turns: string;
  pit: string;
  building: string;
  width: string;
  /** What stands up in the 3D view. */
  standing: string;
  standingNoBuilding: string;
  /** The credit of the data. */
  credit: string;
  /** A circuit in a district: its sentence beside the venues', the description of a district of the circuit alone, and its title. */
  inDistrict: string;
  districtAlone: string;
  districtTitle: string;
  /** A turn's number, for a screen reader. */
  turn: string;
  /** The scale bar's unit. */
  metres: string;
  /** The north arrow's name, for a screen reader. */
  northArrow: string;
  /** The table: its caption and its heads. */
  table: { caption: string; fact: string; value: string; basis: string; documented: string; plausible: string; length: string; measured: string; corners: string; direction: string; opened: string; width: string; pitLaneWidth: string; wikidata: string; counterclockwise: string; clockwise: string };
}

export const CIRCUIT_WORDS: Readonly<Record<Language, CircuitWords>> = Object.freeze({
  en: {
    title: "{name}",
    facts: "{km} km · {turns} turns",
    lap: "A plan of {name}: a lap of {km} km, drawn on the ways OpenStreetMap maps for it (the line measures {measured} km).",
    counterclockwise: "The lap runs counterclockwise, as the arrows show.",
    clockwise: "The lap runs clockwise, as the arrows show.",
    turns: "Its {turns} turns are numbered where OpenStreetMap numbers them, and the start and finish lines are drawn across the track.",
    pit: "The pit lane runs beside the start.",
    building: "The pit building stands beside the pit lane.",
    width: "The track is drawn {width} m wide, which is ours: no source gives it.",
    standing: "In 3D the pit building stands {height} m high, and each turn's number stands on a post.",
    standingNoBuilding: "In 3D each turn's number stands on a post.",
    credit: "Map data: {credit}.",
    inDistrict: "{name}, a lap of {km} km, lies on the same ground where OpenStreetMap maps it.",
    districtAlone: "A plan of {name}, a lap of {km} km, where OpenStreetMap maps it, among what lies round it.",
    districtTitle: "{name} and its surroundings",
    turn: "Turn {n}",
    metres: "m",
    northArrow: "North",
    table: { caption: "{name}: the facts and where they come from", fact: "Fact", value: "Value", basis: "Basis", documented: "documented", plausible: "ours (plausible)", length: "Length of a lap", measured: "Length of the drawn line", corners: "Turns", direction: "Direction", opened: "Opened", width: "Track width drawn", pitLaneWidth: "Pit lane width drawn", wikidata: "Wikidata", counterclockwise: "counterclockwise", clockwise: "clockwise" },
  },
  ja: {
    title: "{name}",
    facts: "全長{km} km・{turns}コーナー",
    lap: "{name}の平面図。1周{km} kmのコースを、OpenStreetMapに登録された道路に沿って描いています（描いた線の長さは{measured} km）。",
    counterclockwise: "矢印のとおり、コースは反時計回りです。",
    clockwise: "矢印のとおり、コースは時計回りです。",
    turns: "{turns}か所のコーナーには、OpenStreetMapと同じ番号を同じ位置に記し、スタートラインとフィニッシュラインはコースを横切る線で描いています。",
    pit: "ピットレーンはスタート地点の脇を通ります。",
    building: "ピットビルはピットレーンの脇に建っています。",
    width: "コース幅は{width} mで描いています。この値は独自のもので、出典はありません。",
    standing: "3D表示では、ピットビルは高さ{height} mで建ち、各コーナーの番号はポールの上に掲げられます。",
    standingNoBuilding: "3D表示では、各コーナーの番号はポールの上に掲げられます。",
    credit: "地図データ：{credit}。",
    inDistrict: "1周{km} kmの{name}も、OpenStreetMapに登録された位置のとおり同じ地面に描いています。",
    districtAlone: "1周{km} kmの{name}を、OpenStreetMapに登録された位置のとおり、周辺の様子とあわせて描いた平面図です。",
    districtTitle: "{name}とその周辺",
    turn: "ターン{n}",
    metres: "m",
    northArrow: "北",
    table: { caption: "{name}：データとその出典", fact: "項目", value: "値", basis: "根拠", documented: "出典あり", plausible: "独自の値（妥当な推定）", length: "1周の長さ", measured: "描いた線の長さ", corners: "コーナー数", direction: "走行方向", opened: "開業", width: "描いたコース幅", pitLaneWidth: "描いたピットレーン幅", wikidata: "Wikidata", counterclockwise: "反時計回り", clockwise: "時計回り" },
  },
});
