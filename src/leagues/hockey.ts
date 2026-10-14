// The ice rinks: the NHL's, which the package started with, and each league that marks its rink differently. Every figure is the
// rulebook's, in its own unit; docs/sources.md says which rule.
import { NHL } from "../geometry.ts";
import type { Unit } from "../units.ts";
import { inFeet, type LeagueBase } from "./types.ts";

/** The figures of an ice rink. Lengths, in the unit of the table they are in. */
export interface RinkFigures {
  /** End boards to end boards. */
  length: number;
  width: number;
  /** The radius of the boards' corners. */
  cornerRadius: number;
  /** The goal line, from the end boards. */
  goalLine: number;
  /** The blue lines, from the end boards. */
  blueLine: number;
  /** The face-off circles' radius. */
  circleRadius: number;
  /** An end-zone face-off spot, from the goal line, and from the rink's long axis. */
  endSpotFromGoalLine: number;
  spotOffset: number;
  spotRadius: number;
  /** A neutral-zone spot, from the blue line. */
  neutralSpotFromBlue: number;
  centreSpotRadius: number;
  /** The hash marks beside an end-zone circle: how long, and how far apart; none when the rules give none. */
  hash: { length: number; apart: number } | null;
  /** The goal crease: the radius of its arc, how deep its straight sides are, half its width at the goal line, and where the short marks stand (from the goal line). */
  crease: { radius: number; depth: number; halfWidth: number; mark: number | null };
  /** The goal net: its width and its depth. */
  net: { width: number; depth: number };
  /** The goalkeeper's trapezoid behind the net, or none. */
  trapezoid: { atBoards: number; atGoalLine: number } | null;
  /** The referee's crease, a semicircle, or none. */
  refereeCrease: number | null;
  /** The width of the goal line, the blue and red lines, and the face-off circles' lines. */
  lineWidths: { goal: number; major: number; minor: number };
}

/** A rink as the drawing wants it: the figures with every length in feet. */
export type RinkSpec = RinkFigures;

/** A rink's figures in feet, from the unit its rulebook gives them in. */
export const rinkInFeet = (figures: RinkFigures, unit: Unit): RinkSpec => inFeet(figures, unit);

/** The NHL rink today, from `NHL` (geometry.ts). Rule 1 of the NHL rulebook. */
export const NHL_RINK: RinkFigures = {
  length: NHL.length,
  width: NHL.width,
  cornerRadius: NHL.cornerRadius,
  goalLine: NHL.goalLine,
  blueLine: NHL.blueLine,
  circleRadius: NHL.circleRadius,
  endSpotFromGoalLine: NHL.endSpotFromGoalLine,
  spotOffset: NHL.spotOffset,
  spotRadius: NHL.spotRadius,
  neutralSpotFromBlue: NHL.neutralSpotFromBlue,
  centreSpotRadius: NHL.centreSpotRadius,
  hash: { length: NHL.hashLength, apart: NHL.hashApart },
  crease: { radius: NHL.crease.radius, depth: NHL.crease.depth, halfWidth: NHL.crease.halfWidth, mark: 4 },
  net: { width: NHL.net.width, depth: NHL.net.depth },
  trapezoid: { atBoards: NHL.trapezoid.atBoards, atGoalLine: NHL.trapezoid.atGoalLine },
  refereeCrease: NHL.refereeCrease,
  lineWidths: { goal: NHL.goalLineWidth, major: NHL.lineWidth, minor: 1 / 6 },
};

/**
 * The IIHF rink, Rules 1.2 to 1.9 and Appendix VI of the IIHF Official Rule Book 2025/26, in metres. The rules give a range for the width (26 to 30 m) and the corner radius (7 to 8.5 m): the largest of each is drawn.
 */
const IIHF_RINK: RinkFigures = {
  length: 60,
  width: 30,
  cornerRadius: 8.5,
  goalLine: 4,
  blueLine: 22.5,
  circleRadius: 4.5,
  endSpotFromGoalLine: 6,
  spotOffset: 7,
  spotRadius: 0.3,
  neutralSpotFromBlue: 1.5,
  centreSpotRadius: 0.15,
  hash: { length: 0.6, apart: 1.7 },
  crease: { radius: 1.83, depth: 1.36, halfWidth: 1.225, mark: null },
  net: { width: 1.83, depth: 1 },
  trapezoid: { atBoards: 8.6, atGoalLine: 6.8 },
  refereeCrease: 3,
  lineWidths: { goal: 0.05, major: 0.3, minor: 0.05 },
};

/** A league with an ice rink of its own. */
export type HockeyLeague = LeagueBase<"hockey", RinkFigures>;

/** The NHL's rink with other markings laid over it: most leagues' Rule 1 is the NHL's, nearly word for word. */
const rink = (over: Partial<RinkFigures>): RinkFigures => ({ ...NHL_RINK, ...over });

/** Hash marks beside an end-zone circle, as the NCAA prints them: 2 feet long, 5 ft 7 in apart (the NHL's Rule 1.9 says the same, and `NHL_RINK` has it). */
const HASH_5_7 = { length: 2, apart: 5 + 7 / 12 };

/** The trapezoid the NCAA marks for Division I men's games from 2026-27: 28 feet at the boards, 22 at the goal line. */
const NCAA_TRAPEZOID = { atBoards: 28, atGoalLine: 22 };

/** The hockey leagues, the NHL first. */
export const HOCKEY_LEAGUES: readonly HockeyLeague[] = [
  { id: "nhl", family: "hockey", name: { en: "NHL hockey rink", ja: "NHLのアイスホッケーリンク" }, unit: "ft", dimensions: NHL_RINK, sources: ["nhl-rules"], builtIn: true },
  {
    id: "iihf",
    family: "hockey",
    name: { en: "IIHF ice hockey rink", ja: "IIHF（国際アイスホッケー連盟）のアイスホッケーリンク" },
    unit: "m",
    // Rules 1.2 to 1.9 and Appendix VI of the IIHF Official Rule Book 2025/26 (the 2026/27 edition is the same), in metres. The rules give a range for the width (26 to 30 m) and the corner radius (7 to 8.5 m): the largest of each is drawn. The spots' places and the crease are read from the diagram; the goal's depth is the rules' none.
    dimensions: IIHF_RINK,
    sources: ["iihf-2025"],
    history: {
      blueLine: [
        { from: 2018, value: 22.86, what: "Blue lines are 22.86 m (75 feet) from the end boards.", ja: "ブルーラインはエンドボードから22.86m（75フィート）の位置にあります。", sources: ["iihf-2018"] },
        { from: 2022, value: 22.5, what: "Blue lines are 22.50 m from the end boards (the diagram of the 2022/23 rule book; the sources do not say which edge of the line is measured).", ja: "ブルーラインはエンドボードから22.50mの位置です（2022/23年版ルールブックの図による。線のどちらの縁から測るかは、資料には書かれていません）。", sources: ["iihf-2022-23"] },
      ],
      trapezoid: [
        { from: 2018, value: null, what: "No restricted area behind the goal: the goalkeeper may play the puck anywhere.", ja: "ゴール裏にトラペゾイドはなく、ゴールキーパーはどこでもパックを扱えます。", sources: ["iihf-2018"] },
        { from: 2021, value: { atBoards: 8.6, atGoalLine: 6.8 }, what: "A restricted area for goalkeepers behind the net is marked: 6.80 m at the goal line, 8.60 m at the boards.", ja: "ゴール裏にゴールキーパーの制限区域（トラペゾイド）が引かれます。ゴールライン側が6.80m、エンドボード側が8.60mです。", sources: ["iihf-2021"] },
      ],
    },
  },
  {
    id: "ncaa-men",
    family: "hockey",
    name: { en: "NCAA men's ice hockey rink", ja: "NCAA男子のアイスホッケーリンク" },
    unit: "ft",
    // Rule 1 of the NCAA Men's and Women's Ice Hockey Rules: 200 by 85 feet, the corners 20 feet in radius, goal lines 11 feet (10 to 15 allowed), blue lines 64 feet from the goal lines (60 at least). Division I men's games have the trapezoid from 2026-27.
    dimensions: rink({ cornerRadius: 20, hash: HASH_5_7, trapezoid: NCAA_TRAPEZOID }),
    sources: ["ncaa-hockey", "ncaa-news-2026"],
    history: {
      trapezoid: [
        { from: null, value: null, what: "No trapezoid behind the net.", ja: "ゴール裏にトラペゾイド（台形の区域）はありません。", sources: ["ncaa-news-2026"] },
        { from: 2026, value: NCAA_TRAPEZOID, what: "Division I men's games have the trapezoid behind the net: 22 feet at the goal line, 28 at the boards.", ja: "ディビジョンI男子の試合では、ゴール裏にトラペゾイドが引かれます。ゴールライン側が22フィート、エンドボード側が28フィートです。", sources: ["ncaa-news-2026"] },
      ],
    },
  },
  {
    id: "ncaa-women",
    family: "hockey",
    name: { en: "NCAA women's ice hockey rink", ja: "NCAA女子のアイスホッケーリンク" },
    unit: "ft",
    // The same rink with no painted trapezoid: the goalkeeper's privileged area is bounded by imaginary lines (Rule 1.6).
    dimensions: rink({ cornerRadius: 20, hash: HASH_5_7, trapezoid: null }),
    sources: ["ncaa-hockey"],
  },
  {
    id: "ahl",
    family: "hockey",
    name: { en: "AHL hockey rink", ja: "AHLのアイスホッケーリンク" },
    unit: "ft",
    // Rule 1 of the AHL Official Rules is the NHL's: 200 by 85 feet, goal lines 11 feet, blue lines 64 feet from the goal lines.
    dimensions: NHL_RINK,
    sources: ["ahl-2025"],
    history: {
      blueLine: [
        { from: null, value: 71, what: "Blue lines are 71 feet from the end boards: 60-foot attack zones and a 58-foot neutral zone (worked out from the AHL's move of 4 feet).", ja: "ブルーラインはエンドボードから71フィート（約21.6m）で、アタッキングゾーンは60フィート、ニュートラルゾーンは58フィートです（AHLが発表した4フィートの移動から算出）。", sources: ["ahl-2005"] },
        { from: 2005, value: 75, what: "Blue lines move 4 feet towards centre ice: 64-foot attack zones and a 50-foot neutral zone.", ja: "ブルーラインがリンクの中央寄りに4フィート移り、アタッキングゾーンは64フィート、ニュートラルゾーンは50フィートになります。", sources: ["ahl-2005"] },
      ],
    },
  },
  {
    id: "echl",
    family: "hockey",
    name: { en: "ECHL hockey rink", ja: "ECHLのアイスホッケーリンク" },
    unit: "ft",
    // Rule 1 of the ECHL Official Rules is the NHL's (its blue-line sentence reads "sixty feet (64')": the numeral is taken).
    dimensions: NHL_RINK,
    sources: ["echl-2025"],
  },
  {
    id: "ohl",
    family: "hockey",
    name: { en: "OHL hockey rink", ja: "OHLのアイスホッケーリンク" },
    unit: "ft",
    // Rule 1 of the OHL Official Rules is the NHL's.
    dimensions: NHL_RINK,
    sources: ["ohl-2025"],
  },
  {
    id: "whl",
    family: "hockey",
    name: { en: "WHL hockey rink", ja: "WHLのアイスホッケーリンク" },
    unit: "ft",
    // Rule 1 of the WHL Rule Book is the NHL's.
    dimensions: NHL_RINK,
    sources: ["whl-2025"],
  },
  {
    id: "qmjhl",
    family: "hockey",
    name: { en: "QMJHL hockey rink", ja: "QMJHLのアイスホッケーリンク" },
    unit: "ft",
    // Rule 1 of the QMJHL Playing Rules is the NHL's, except that the hash marks beside a circle are 2 feet long and 5 feet apart.
    dimensions: rink({ hash: { length: 2, apart: 5 } }),
    sources: ["qmjhl-2025"],
  },
  {
    id: "ushl",
    family: "hockey",
    name: { en: "USHL hockey rink", ja: "USHLのアイスホッケーリンク" },
    unit: "ft",
    // The USHL's rinks must follow the USA Hockey Junior rulebook (Rules 101 to 105): 185 to 200 by 85 to 100 feet (200 by 85 is drawn), goal lines 11 feet, blue lines 64 feet from the goal lines, circles 30 feet across, hash marks 2 feet long and 4 apart, no trapezoid. The rules give no corner radius: the NHL's is drawn.
    dimensions: rink({ hash: { length: 2, apart: 4 }, trapezoid: null }),
    sources: ["usa-hockey-junior", "ushl-2021"],
  },
  {
    id: "pwhl",
    family: "hockey",
    name: { en: "PWHL hockey rink", ja: "PWHLのアイスホッケーリンク" },
    unit: "ft",
    // Rule 1 of the PWHL Rulebook is the NHL's, with no restricted area for goalkeepers (1.8 and 27.8).
    dimensions: rink({ trapezoid: null }),
    sources: ["pwhl-2025"],
  },
  {
    id: "olympic",
    family: "hockey",
    name: { en: "Olympic ice hockey rink (60 by 26 m)", ja: "オリンピックのアイスホッケーリンク（60×26m）" },
    unit: "m",
    // The IIHF rink at the narrowest width its rules allow (Rule 1.2: 26 to 30 m). The IIHF's statement of 9 December 2025 gives the ice of Milano Cortina 2026 as 60.0 by 26.0 m, "the rink size used at the Beijing 2022 Olympic Winter Games", and "fully consistent with" the NHL's Global Series arena specifications; it says nothing of the markings, which are the IIHF's own (the corner radius and the rest are the IIHF rink's).
    dimensions: { ...IIHF_RINK, width: 26 },
    sources: ["iihf-milan-2025", "iihf-2025"],
  },
  {
    id: "boston-garden",
    family: "hockey",
    name: { en: "Boston Garden hockey rink", ja: "ボストン・ガーデンのアイスホッケーリンク" },
    unit: "ft",
    // Boston Garden (1928 to 1995, the Bruins' home) had an ice surface of 58.2 by 25.3 m (191 by 83 feet), "some nine feet shorter and two feet narrower than standard". Only the size is published; every other figure is the NHL rink's (the boards' corners, the lines and the circles are those of today's Rule 1), which is how it is drawn.
    dimensions: rink({ length: 58.2 / 0.3048, width: 25.3 / 0.3048 }),
    sources: ["wp-boston-garden"],
  },
];
