// Surfaces through the years. A sport's markings change: the NHL had no centre red line before 1943, the NBA no three-point line
// before 1979, the NFL's hash marks moved four times, a CFL end zone was 25 yards deep until 1986, the baseball pitcher threw
// from 50 feet until 1893. Here every such change is data: a list of "spans" for each marking (the season a state began, its
// value, what it was, and the sources that say so), and `rulesFor(sport, year)` which gives the markings in force in a season.
// The surfaces draw from that. Nothing here draws.
//
// How `year` maps to a season: a season is named by the year it starts in, so `1979` is the 1979–80 season of the NHL and the NBA;
// the NFL, the CFL and baseball play in one calendar year, so `1974` is the 1974 season. A change "from 1979" is in force for
// 1979 and every later season, until another change.
//
// What is not here: a change that could not be cited. A marking whose state is known only from some season on keeps that
// state before it (the nearest cited one) and `gaps` says so; a state read from a source that gives no measure for it
// (a box's size) is `approx`. docs/references.md lists what was looked for and not found.

import { FOOTBALL, MLB, NBA, NHL, type FootballSpec } from "./geometry.ts";

/** The sports whose markings have a history here. The IFAF's surface is 2021's and has none. */
export type EraSport = "nfl" | "cfl" | "nhl" | "nba" | "mlb";

/** The sports with a history, in the order a menu lists them. */
export const ERA_SPORTS: readonly EraSport[] = ["nfl", "cfl", "nhl", "nba", "mlb"];

/**
 * The season whose rules are "today's", and the one a drawing without a `year` shows: the data were last checked in 2026. A
 * change scheduled for a later season is `planned` and is drawn only when that season is asked for.
 */
export const ERA_CURRENT = 2026;

/** Where a change was read. */
export interface EraSource {
  id: string;
  /** The page: the article's title for Wikipedia, else the page's own. */
  title: string;
  /** Who publishes it. */
  by: string;
  /** For Wikipedia (CC BY-SA 4.0): the revision of the article, so that the figure can be checked. */
  revision?: number;
  url: string;
  /** What was taken from it. */
  note?: string;
}

const wikipedia = (id: string, title: string, revision: number, note: string): EraSource => ({
  id,
  title,
  by: "Wikipedia",
  revision,
  url: `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(title.replace(/ /g, "_"))}&oldid=${revision}`,
  note,
});

/** Every page a change was read from, by id. Wikipedia is cited by revision, for facts only. */
export const ERA_SOURCES: Readonly<Record<string, EraSource>> = Object.freeze(
  Object.fromEntries(
    [
      wikipedia("wp-offside", "Offside (ice hockey)", 1366324643, "the two blue lines of 1928-29, the centre red line introduced in 1943-44"),
      wikipedia("wp-rink", "Ice hockey rink", 1369579112, "the NHL's blue lines at 75 feet and goal lines at 11 feet; the trapezoid from 2005-06, 18 feet at the goal line, 22 feet from 2014-15"),
      wikipedia("wp-nhl-rules", "National Hockey League rules", 1379666522, "the trapezoid since 2005-06, lengthened by 2 feet each side in 2014"),
      {
        id: "csm-1998",
        title: "Sports 101",
        by: "The Christian Science Monitor, 16 October 1998",
        url: "https://proof.csmonitor.com/1998/1016/101698.feat.feat.11.html",
        note: "the goal line 'increased from 11 to 13 feet' for 1998-99, the neutral zone 54 feet and the offensive zones 73",
      },
      {
        id: "nhl-records",
        title: "Historical Rule Changes",
        by: "NHL Records (records.nhl.com)",
        url: "https://records.nhl.com/history/historical-rule-changes",
        note: "the 2005-06 package: goal lines 11 feet from the end boards, the neutral zone cut from 54 to 50 feet, the trapezoid (as a search result described the page, which is script-rendered; read together with the AHL's release)",
      },
      {
        id: "ahl-2005",
        title: "AHL announces rules package for 2005-06",
        by: "American Hockey League",
        url: "https://theahl.com/news/ahl-announces-rules-package-for-2005-06",
        note: "the AHL's goal lines at 11 feet and its blue lines moved 4 feet towards centre ice (50-foot neutral zone), the package the NHL adopted for 2005-06",
      },
      wikipedia("wp-key", "Key (basketball)", 1377850804, "the lane 6 feet wide, 12 feet from 1951-52, 16 feet from 1964-65; the restricted area arc from 1997-98"),
      wikipedia("wp-three-point", "Three-point field goal", 1372084496, "the NBA's three-point line from 1979-80, a uniform 22 feet for 1994-95 to 1996-97, 23 feet 9 inches again from 1997-98"),
      wikipedia("wp-court", "Basketball court", 1376335874, "the three-point line of 1979-80 and its 22-foot years; the no-charge arc of 4 feet first in the NBA in 1997-98"),
      {
        id: "deseret-1997",
        title: "Will more paint on the floor lead to more points on the board?",
        by: "Deseret News, 5 October 1997",
        url: "https://www.deseret.com/1997/10/5/19338479/nba-tries-to-perk-up-offenses/",
        note: "for 1997-98 the three-point line back to 23 feet 9 inches (22 in the corners) and a four-foot-radius no-charge half circle marked in the key",
      },
      wikipedia("wp-hash", "Hash mark (sports)", 1335201669, "the NFL's hash marks: none before 1933, 30 feet from the sideline in 1933, 45 in 1935, 60 in 1945, 70 feet 9 inches from 1972; the CFL's 24 yards, narrowed in 2022"),
      wikipedia("wp-afield", "American football field", 1379828601, "the NFL's hash marks since 1972 and 1945-1971, the goal posts on the goal line until 1974"),
      {
        id: "si-goalposts",
        title: "The History of NFL Goal Posts: Excitement And Danger",
        by: "Sports Illustrated, 21 June 2017",
        url: "https://www.si.com/nfl/2017/06/21/history-nfl-goal-posts",
        note: "posts on the goal line from 1920, at the back of the end zone from 1927, back on the goal line in 1933 until 1974; H-shaped until 1967, then the slingshot",
      },
      wikipedia("wp-canadian", "Canadian football", 1374069475, "the CFL's end zones 25 yards deep until 1986, 20 after; the 110-yard goal-line distance; the 2027 field of 100 yards, 15-yard end zones and posts on the end line"),
      {
        id: "cfl-2022",
        title: "Building on our strengths: game changes put emphasis on big CFL field, exciting kick returns and high scoring",
        by: "Canadian Football League, 27 April 2022",
        url: "https://press.cfl.ca/building-on-our-strengths-game-changes-put-emphasis-on-big-cfl-field-exciting-kick-returns-and-high-scoring",
        note: "hash marks 28 yards from each sideline instead of 24 (9 yards apart instead of 17); the field 110 yards by 65 with 20-yard end zones",
      },
      {
        id: "tsn-2026",
        title: "Stampeders WR Philpot keeping an open mind about CFL's 2027 field changes",
        by: "TSN, The Canadian Press, 13 April 2026",
        url: "https://www.tsn.ca/cfl/article/stampeders-wr-philpot-keeping-an-open-mind-about-cfls-2027-field-changes/",
        note: "for 2027 the field shortened by 10 yards (to 100), the end zones by 5 yards (to 15), the goal posts to the back of the end zones",
      },
      wikipedia("wp-baseball", "Baseball field", 1376335066, "the pitcher's box at 45 feet, 50 feet from 1881, its 1887 size, the plate at 60 feet 6 inches from 1893, the mound's height, the home plate through the years, the batter's boxes of 1874 and 1885"),
    ].map((source) => [source.id, Object.freeze(source)]),
  ),
);

/** One state of a marking, from a season on. */
export interface EraSpan<T> {
  /** The first season it was in force, or `null` for "from the start" (the state the earliest season of the sport had). */
  from: number | null;
  value: T;
  /** What it was, in a sentence. */
  what: string;
  /** The same in Japanese. */
  ja: string;
  /** Keys of `ERA_SOURCES`; at least one. */
  sources: string[];
  /** A rule announced for a season that has not been played yet. It is drawn only when that season is asked for. */
  planned?: boolean;
  /** The source gives this state but not its measure (the box's size): drawn as the nearest figure that is cited. */
  approx?: boolean;
}

type Spans<R> = { [K in keyof R]: EraSpan<R[K]>[] };

/** The NHL rink's markings in a season. Lengths are feet. */
export interface NhlRules {
  /** The centre red line across the middle of the ice. */
  centreLine: boolean;
  /** The goal line's distance from the end boards. */
  goalLine: number;
  /** The blue line's distance from the end boards. */
  blueLine: number;
  /** The goaltender's trapezoid behind the net, or none. */
  trapezoid: { atGoalLine: number; atBoards: number } | null;
}

/** The NBA court's markings in a season. Lengths are feet. */
export interface NbaRules {
  /** The width of the free-throw lane. */
  keyWidth: number;
  /** The three-point arc's radius from the basket (the corners stay at 22 feet), or none. */
  threePoint: { radius: number } | null;
  /** The restricted area (the no-charge arc) under each basket. */
  restrictedArea: boolean;
}

/** A football field's markings in a season: the NFL's or the CFL's. Lengths are feet. */
export interface FootballRules {
  /** Goal line to goal line. */
  length: number;
  /** The depth of each end zone. */
  endZone: number;
  /** The hash marks' distance from each sideline, or `null` before there were hash marks. */
  hash: number | null;
  /** Where the goal posts stand. */
  posts: "goal-line" | "end-line";
  /** Two poles joined by a crossbar (`h`), or one curved support behind the crossbar (`slingshot`). */
  postShape: "h" | "slingshot";
}

/** The baseball field's markings in a season. Lengths are feet, the mound's height inches. */
export interface MlbRules {
  /**
   * Where the pitcher throws from: a chalked box whose front edge is `distance` from the back point of home plate, with its
   * `width` and `depth`, or (from 1893) the rubber, whose front edge is `distance` from it.
   */
  pitcher: { kind: "box" | "plate"; distance: number; width: number; depth: number };
  /** The batter's boxes, or none (there were none before 1874). */
  battersBox: { width: number; length: number; gap: number } | null;
  /** The shape of home plate. */
  plateShape: "circle" | "square" | "diamond" | "pentagon";
  /** Where it lies: `centred` on the foul lines' meeting, `behind` it, or (since 1877) `front`, its back point on it, in fair ground. */
  platePlacement: "centred" | "behind" | "front";
  /** The mound's greatest height above home plate, in inches, or `null` when the sources give none. */
  moundHeight: number | null;
}

/** The rules of a sport in a season. */
export interface EraRulesOf {
  nhl: NhlRules;
  nba: NbaRules;
  nfl: FootballRules;
  cfl: FootballRules;
  mlb: MlbRules;
}

const yd = (n: number): number => n * 3;
const CFL_HASH_THEN = yd(24);

const NHL_SPANS: Spans<NhlRules> = {
  centreLine: [
    { from: null, value: false, what: "No centre red line: two blue lines divide the ice and nothing marks the middle.", ja: "センターレッドラインはなく、リンクを分けるのは2本のブルーラインだけで、中央に線はありません。", sources: ["wp-offside"] },
    { from: 1943, value: true, what: "The centre red line is added, so that a team can pass out of its own zone up to it.", ja: "センターレッドラインが加わり、自陣ゾーンからこのラインまでのパスが認められるようになります。", sources: ["wp-offside"] },
  ],
  goalLine: [
    { from: 1997, value: NHL.goalLine, what: "Goal lines are 11 feet from the end boards.", ja: "ゴールラインはエンドボードから11フィート（約3.4m）です。", sources: ["csm-1998"] },
    { from: 1998, value: 13, what: "Goal lines move out to 13 feet from the end boards, for room behind the net.", ja: "ゴールラインがエンドボードから13フィート（約4.0m）の位置に移り、ゴール裏が広くなります。", sources: ["csm-1998"] },
    { from: 2005, value: NHL.goalLine, what: "Goal lines move back to 11 feet from the end boards.", ja: "ゴールラインがエンドボードから11フィートの位置に戻ります。", sources: ["nhl-records", "ahl-2005", "wp-rink"] },
  ],
  blueLine: [
    { from: 1998, value: 73, what: "Blue lines are 73 feet from the end boards: a 54-foot neutral zone and 73-foot offensive zones.", ja: "ブルーラインはエンドボードから73フィート（約22.3m）で、ニュートラルゾーンは54フィート（約16.5m）です。", sources: ["csm-1998"] },
    { from: 2005, value: NHL.blueLine, what: "Blue lines move out to 75 feet from the end boards, cutting the neutral zone to 50 feet.", ja: "ブルーラインがエンドボードから75フィート（約22.9m）に移り、ニュートラルゾーンが50フィート（約15.2m）に狭まります。", sources: ["nhl-records", "ahl-2005", "wp-rink"] },
  ],
  trapezoid: [
    { from: null, value: null, what: "No trapezoid behind the net: the goaltender may play the puck anywhere.", ja: "ゴール裏にトラペゾイド（台形の区域）はなく、ゴールキーパーはどこでもパックを扱えます。", sources: ["wp-rink", "wp-nhl-rules"] },
    { from: 2005, value: { atGoalLine: 18, atBoards: 28 }, what: "The goaltender's trapezoid is marked behind each net: 18 feet at the goal line, 28 feet at the end boards.", ja: "各ゴールの裏に、ゴールキーパーがパックを扱える区域として台形（トラペゾイド）が引かれます。ゴールライン側が18フィート、エンドボード側が28フィートです。", sources: ["wp-rink", "wp-nhl-rules"] },
    { from: 2014, value: { atGoalLine: NHL.trapezoid.atGoalLine, atBoards: NHL.trapezoid.atBoards }, what: "The trapezoid is widened to 22 feet at the goal line (2 feet each side).", ja: "トラペゾイドのゴールライン側が左右2フィートずつ広がり、22フィートになります。", sources: ["wp-rink", "wp-nhl-rules"] },
  ],
};

const NBA_SPANS: Spans<NbaRules> = {
  keyWidth: [
    { from: null, value: 6, what: "The lane is 6 feet wide, the narrow keyhole the key is named for.", ja: "レーン（ペイントエリア）の幅は6フィート（約1.8m）で、細い鍵穴のような形です。「キー」という呼び名はこの形に由来します。", sources: ["wp-key"] },
    { from: 1951, value: 12, what: "The lane is widened to 12 feet, against George Mikan.", ja: "ジョージ・マイカンへの対策として、レーンの幅が12フィート（約3.7m）に広がります。", sources: ["wp-key"] },
    { from: 1964, value: NBA.lane, what: "The lane is widened to 16 feet, against Wilt Chamberlain.", ja: "ウィルト・チェンバレンへの対策として、レーンの幅が16フィート（約4.9m）に広がります。", sources: ["wp-key"] },
  ],
  threePoint: [
    { from: null, value: null, what: "No three-point line.", ja: "スリーポイントラインはありません。", sources: ["wp-three-point", "wp-court"] },
    { from: 1979, value: { radius: NBA.threePoint.radius }, what: "The three-point line is adopted: 23 feet 9 inches from the basket, 22 feet in the corners.", ja: "スリーポイントラインが採用されます。バスケットから23フィート9インチ（約7.24m）、コーナーは22フィート（約6.7m）です。", sources: ["wp-three-point", "wp-court"] },
    { from: 1994, value: { radius: 22 }, what: "The three-point line is shortened to a uniform 22 feet all the way round.", ja: "スリーポイントラインが短くなり、全周でバスケットから22フィートになります。", sources: ["wp-three-point", "wp-court"] },
    { from: 1997, value: { radius: NBA.threePoint.radius }, what: "The three-point line goes back to 23 feet 9 inches (22 feet in the corners).", ja: "スリーポイントラインが元の23フィート9インチ（コーナーは22フィート）に戻ります。", sources: ["wp-three-point", "deseret-1997"] },
  ],
  restrictedArea: [
    { from: null, value: false, what: "No restricted area under the basket.", ja: "バスケットの下にノーチャージセミサークル（リストリクテッドエリア）はありません。", sources: ["wp-key", "wp-court"] },
    { from: 1997, value: true, what: "The restricted area is marked, a half circle of 4 feet from the middle of the basket.", ja: "バスケットの中心から半径4フィート（約1.2m）の半円で、ノーチャージセミサークル（リストリクテッドエリア）が描かれます。", sources: ["wp-key", "wp-court", "deseret-1997"] },
  ],
};

const nflHash = (n: number | null, when: number | null, what: string, ja: string, sources: string[]): EraSpan<number | null> => ({ from: when, value: n, what, ja, sources });

const NFL_SPANS: Partial<Spans<FootballRules>> = {
  hash: [
    nflHash(null, null, "No hash marks: a play starts where the ball was whistled dead.", "ハッシュマークはなく、プレーはボールデッドになった地点から再開されます。", ["wp-hash"]),
    nflHash(yd(10), 1933, "Hash marks are adopted, 10 yards (30 feet) from each sideline.", "ハッシュマークが採用され、両サイドラインから10ヤード（30フィート）の位置に引かれます。", ["wp-hash"]),
    nflHash(yd(15), 1935, "The hash marks move in to 15 yards (45 feet) from each sideline.", "ハッシュマークが内側に寄り、両サイドラインから15ヤード（45フィート）の位置になります。", ["wp-hash"]),
    nflHash(yd(20), 1945, "The hash marks move in to 20 yards (60 feet) from each sideline.", "ハッシュマークが内側に寄り、両サイドラインから20ヤード（60フィート）の位置になります。", ["wp-hash", "wp-afield"]),
    nflHash(FOOTBALL.nfl.hash, 1972, "The hash marks move in to 70 feet 9 inches from each sideline, the width of the goal posts.", "ハッシュマークが内側に寄り、両サイドラインから70フィート9インチ（約21.6m）の位置になって、左右の間隔がゴールポストの幅と同じになります。", ["wp-hash", "wp-afield"]),
  ],
  posts: [
    { from: 1920, value: "goal-line", what: "The goal posts stand on the goal line.", ja: "ゴールポストはゴールラインの上に立っています。", sources: ["si-goalposts"] },
    { from: 1927, value: "end-line", what: "The goal posts move back to the end line, at the back of the end zone.", ja: "ゴールポストがエンドゾーンの奥、エンドラインの上に下がります。", sources: ["si-goalposts"] },
    { from: 1933, value: "goal-line", what: "The goal posts come forward again to the goal line, to encourage field goals.", ja: "フィールドゴールを増やすため、ゴールポストがゴールラインの上に戻ります。", sources: ["si-goalposts", "wp-afield"] },
    { from: 1974, value: "end-line", what: "The goal posts go back to the end line, to discourage field goals.", ja: "フィールドゴールを減らすため、ゴールポストがエンドラインの上に下がります。", sources: ["si-goalposts", "wp-afield"] },
  ],
  postShape: [
    { from: 1920, value: "h", what: "The goal posts are an H: two poles in the ground joined by the crossbar.", ja: "ゴールポストは「H」の形で、地面に立つ2本の支柱をクロスバーがつないでいます。", sources: ["si-goalposts"] },
    { from: 1967, value: "slingshot", what: "The slingshot post is introduced: one curved support behind the crossbar.", ja: "スリングショット型のゴールポストが登場します。クロスバーの後ろに湾曲した1本の支柱が立つ形です。", sources: ["si-goalposts"] },
  ],
};

const CFL_SPANS: Partial<Spans<FootballRules>> = {
  endZone: [
    { from: null, value: yd(25), what: "End zones are 25 yards deep (a field 160 yards long in all).", ja: "エンドゾーンの奥行きは25ヤードで、エンドゾーンを含むフィールド全体の長さは160ヤードです。", sources: ["wp-canadian"] },
    { from: 1986, value: FOOTBALL.cfl.endZone, what: "End zones are cut to 20 yards deep.", ja: "エンドゾーンの奥行きが20ヤードに短くなります。", sources: ["wp-canadian", "cfl-2022"] },
    { from: 2027, value: yd(15), planned: true, what: "Planned: end zones 15 yards deep.", ja: "予定：エンドゾーンの奥行きが15ヤードになります。", sources: ["tsn-2026", "wp-canadian"] },
  ],
  length: [
    { from: null, value: FOOTBALL.cfl.length, what: "110 yards between the goal lines.", ja: "ゴールライン間は110ヤードです。", sources: ["wp-canadian", "cfl-2022"] },
    { from: 2027, value: yd(100), planned: true, what: "Planned: 100 yards between the goal lines.", ja: "予定：ゴールライン間が100ヤードになります。", sources: ["tsn-2026", "wp-canadian"] },
  ],
  hash: [
    { from: 2015, value: CFL_HASH_THEN, what: "Hash marks are 24 yards from each sideline, 17 yards apart.", ja: "ハッシュマークは両サイドラインから24ヤードで、間隔は17ヤードです。", sources: ["wp-hash", "cfl-2022"] },
    { from: 2022, value: FOOTBALL.cfl.hash, what: "The hash marks move in to 28 yards from each sideline, 9 yards apart.", ja: "ハッシュマークが内側に寄り、両サイドラインから28ヤードの位置になって、間隔は9ヤードになります。", sources: ["cfl-2022", "wp-hash"] },
  ],
  posts: [
    { from: null, value: "goal-line", what: "The goal posts stand on the goal line.", ja: "ゴールポストはゴールラインの上に立っています。", sources: ["wp-canadian"] },
    { from: 2027, value: "end-line", planned: true, what: "Planned: the goal posts move to the end line, the back of the end zone.", ja: "予定：ゴールポストがエンドゾーンの奥、エンドラインの上に移ります。", sources: ["tsn-2026", "wp-canadian"] },
  ],
};

const MLB_PITCHER_BOX = { kind: "box", width: 4, depth: 5.5 } as const;

const MLB_SPANS: Spans<MlbRules> = {
  pitcher: [
    { from: 1871, value: { ...MLB_PITCHER_BOX, distance: 45 }, approx: true, what: "The pitcher throws from a chalked box whose front edge is 45 feet from home plate (its size is not given; drawn as the 1887 box).", ja: "投手は、本塁側の辺が本塁から45フィート（約13.7m）の位置にある、チョークで描いたピッチャーズボックスの中から投げます（ボックスの大きさは不明のため、1887年のものと同じ大きさで描いています）。", sources: ["wp-baseball"] },
    { from: 1881, value: { ...MLB_PITCHER_BOX, distance: 50 }, approx: true, what: "The box's front edge moves back to 50 feet (its size is not given; drawn as the 1887 box).", ja: "ピッチャーズボックスの本塁側の辺が本塁から50フィート（約15.2m）の位置に遠ざかります（ボックスの大きさは不明のため、1887年のものと同じ大きさで描いています）。", sources: ["wp-baseball"] },
    { from: 1887, value: { ...MLB_PITCHER_BOX, distance: 50 }, what: "The box is 4 feet wide and 5½ feet deep, its front edge 50 feet from home plate.", ja: "ピッチャーズボックスは幅4フィート、奥行き5.5フィートで、本塁側の辺は本塁から50フィートです。", sources: ["wp-baseball"] },
    { from: 1893, value: { kind: "plate", distance: MLB.pitcher, width: 2, depth: 0.5 }, what: "The box gives way to the pitcher's plate, its front edge 60 feet 6 inches from home plate.", ja: "ピッチャーズボックスに代わって投手板が使われ、その本塁側の縁は本塁から60フィート6インチ（約18.44m）です。", sources: ["wp-baseball"] },
  ],
  battersBox: [
    { from: null, value: null, what: "No batter's boxes: the batter hits with the front foot on a line through the centre of the plate.", ja: "バッターボックスはなく、打者は本塁の中心を通る線の上に前足を置いて打ちます。", sources: ["wp-baseball"] },
    { from: 1874, value: { width: 3, length: 6, gap: 1 }, what: "Batter's boxes appear, 6 feet by 3 feet, 12 inches from the plate.", ja: "バッターボックスが登場し、6フィート×3フィートで、本塁から12インチ離れています。", sources: ["wp-baseball"] },
    { from: 1885, value: { width: MLB.boxes.batterWidth, length: MLB.boxes.batterLength, gap: MLB.boxes.gap }, what: "Batter's boxes take their modern size, 6 feet by 4 feet, 6 inches from the plate (the National League in 1885).", ja: "バッターボックスが現在と同じ6フィート×4フィートの大きさになり、本塁から6インチ離れます（ナショナルリーグでは1885年）。", sources: ["wp-baseball"] },
  ],
  plateShape: [
    { from: 1857, value: "circle", what: "Home plate is a round iron plate of one square foot, about 13½ inches across.", ja: "本塁は面積が1平方フィートの円形の鉄板で、直径は約13.5インチです。", sources: ["wp-baseball"] },
    { from: 1868, value: "square", what: "Home plate is a 12-inch square, its flat sides towards the pitcher and the catcher.", ja: "本塁は一辺12インチの正方形で、平らな辺が投手と捕手のほうを向きます。", sources: ["wp-baseball"] },
    { from: 1871, value: "diamond", what: "The 12-inch square is turned 45 degrees, a corner towards the pitcher.", ja: "一辺12インチの正方形が45度回され、角が投手のほうを向きます。", sources: ["wp-baseball"] },
    { from: 1900, value: "pentagon", what: "The five-sided plate of white rubber is adopted, as it is today.", ja: "現在と同じ五角形の白いゴム製の本塁が採用されます。", sources: ["wp-baseball"] },
  ],
  platePlacement: [
    { from: 1861, value: "centred", what: "The centre of home plate stands on the meeting of the foul lines.", ja: "本塁の中心がファウルラインの交点に置かれます。", sources: ["wp-baseball"] },
    { from: 1875, value: "behind", what: "Home plate is moved wholly into foul ground, the pitcher's point on the meeting of the foul lines.", ja: "本塁が完全にファウルゾーンへ移り、投手側の角がファウルラインの交点に置かれます。", sources: ["wp-baseball"] },
    { from: 1877, value: "front", what: "Home plate is moved forward to its modern place, wholly in fair ground, its back point on the foul lines' meeting.", ja: "本塁が現在の位置、つまり完全にフェアゾーンの中に移り、後ろの角がファウルラインの交点に置かれます。", sources: ["wp-baseball"] },
  ],
  moundHeight: [
    { from: 1903, value: 15, what: "The mound may stand 15 inches above home plate.", ja: "マウンドは本塁より15インチ（約38cm）まで高くできます。", sources: ["wp-baseball"] },
    { from: 1969, value: 10, what: "The mound is lowered to 10 inches, after the Year of the Pitcher.", ja: "「投手の年」と呼ばれた1968年のあと、マウンドの高さが10インチ（約25cm）に低くなります。", sources: ["wp-baseball"] },
  ],
};

/** All of a sport's spans, by marking. */
const SPANS: { [S in EraSport]: Partial<Spans<EraRulesOf[S]>> } = {
  nhl: NHL_SPANS,
  nba: NBA_SPANS,
  nfl: NFL_SPANS,
  cfl: CFL_SPANS,
  mlb: MLB_SPANS,
};

/** The rules that hold with no change at all: the surface as geometry.ts draws it today. */
function present(sport: EraSport): EraRulesOf[EraSport] {
  switch (sport) {
    case "nhl":
      return { centreLine: true, goalLine: NHL.goalLine, blueLine: NHL.blueLine, trapezoid: { atGoalLine: NHL.trapezoid.atGoalLine, atBoards: NHL.trapezoid.atBoards } };
    case "nba":
      return { keyWidth: NBA.lane, threePoint: { radius: NBA.threePoint.radius }, restrictedArea: true };
    case "nfl":
    case "cfl": {
      const spec = FOOTBALL[sport];
      return { length: spec.length, endZone: spec.endZone, hash: spec.hash, posts: spec.posts, postShape: "slingshot" };
    }
    case "mlb":
      return {
        pitcher: { kind: "plate", distance: MLB.pitcher, width: 2, depth: 0.5 },
        battersBox: { width: MLB.boxes.batterWidth, length: MLB.boxes.batterLength, gap: MLB.boxes.gap },
        plateShape: "pentagon",
        platePlacement: "front",
        moundHeight: 10,
      };
  }
}

/** A change in the markings: one span of one marking that started in some season. */
export interface EraChange {
  /** `nhl.trapezoid.2005`. */
  id: string;
  sport: EraSport;
  /** The marking's name: a key of the sport's rules. */
  feature: string;
  /** The first season, or `null` for the state the sport started with. */
  from: number | null;
  value: unknown;
  what: string;
  ja: string;
  sources: string[];
  planned: boolean;
  approx: boolean;
}

const changeOf = (sport: EraSport, feature: string, span: EraSpan<unknown>): EraChange => ({
  id: `${sport}.${feature}.${span.from === null ? "start" : span.from}`,
  sport,
  feature,
  from: span.from,
  value: span.value,
  what: span.what,
  ja: span.ja,
  sources: span.sources,
  planned: span.planned === true,
  approx: span.approx === true,
});

const featuresOf = (sport: EraSport): [string, EraSpan<unknown>[]][] => Object.entries(SPANS[sport]) as [string, EraSpan<unknown>[]][];

/**
 * Every change of a sport's markings, in season order: what moved, from which season, in a sentence in English and in Japanese,
 * and the sources that say so. The state a sport started with is not a change and is left out (see `eraStates`).
 * @example
 * ```ts
 * import { eraChanges } from "@johnmorrisdotca/kyogijo/eras";
 * const nhl = eraChanges("nhl");
 * console.log(nhl.length, nhl[0].id, nhl[0].from);
 * // 8 nhl.centreLine.1943 1943
 * ```
 */
export function eraChanges(sport: EraSport): EraChange[] {
  return featuresOf(sport)
    .flatMap(([feature, spans]) => spans.filter((span) => span.from !== null).map((span) => changeOf(sport, feature, span)))
    .sort((a, b) => (a.from as number) - (b.from as number) || a.id.localeCompare(b.id));
}

/** The state each marking of a sport started with: the spans that begin "from the start". */
export function eraStates(sport: EraSport): EraChange[] {
  return featuresOf(sport).flatMap(([feature, spans]) => spans.filter((span) => span.from === null).map((span) => changeOf(sport, feature, span)));
}

/** The first season each league played (baseball: the first professional league, the National Association). */
const SPORT_START: Readonly<Record<EraSport, number>> = Object.freeze({ nhl: 1917, nba: 1946, nfl: 1920, cfl: 1958, mlb: 1871 });

/** The seasons a sport's history is drawn for: from the league's first to today's, or to a planned season when one is announced. */
export function eraRange(sport: EraSport): { from: number; to: number } {
  return { from: SPORT_START[sport], to: Math.max(ERA_CURRENT, ...eraChanges(sport).map((change) => change.from as number)) };
}

/**
 * The name of a season as the sport writes it: `1979–80` for the NHL and the NBA, which play across the new year, and `1974` for
 * the NFL, the CFL and baseball. The year is the one the season starts in.
 * @example
 * ```ts
 * import { seasonLabel } from "@johnmorrisdotca/kyogijo/eras";
 * console.log(seasonLabel("nba", 1979), seasonLabel("nhl", 1999), seasonLabel("nfl", 1974));
 * // 1979–80 1999–00 1974
 * ```
 */
export function seasonLabel(sport: EraSport, year: number): string {
  const y = Math.floor(year);
  return sport === "nhl" || sport === "nba" ? `${y}–${String((y + 1) % 100).padStart(2, "0")}` : String(y);
}

/** The markings in force in a season, with what differs from today's and what is not known. */
export interface EraRules<S extends EraSport = EraSport> {
  sport: S;
  /** The season asked for (the year it starts in); today's when none was. */
  year: number;
  /** Its name: `1979–80`. */
  season: string;
  /** The markings. Every one is in feet, except the mound's height in inches. */
  rules: EraRulesOf[S];
  /** The states in force that are not today's, each as the change that began it (a marking in `gaps` is not listed). */
  differences: EraChange[];
  /** Markings that no source covers for this season: they keep the nearest cited state. */
  gaps: string[];
  /** Markings whose state is cited but whose measure is not: drawn at the nearest cited figure. */
  approx: string[];
  /** True when a marking is one that is announced for this season and has not been played yet. */
  planned: boolean;
}

/** The span of a marking in force in a season: the last that has begun, else the first (a gap). */
function spanIn<T>(spans: EraSpan<T>[], year: number): { span: EraSpan<T>; gap: boolean } {
  let found: EraSpan<T> | undefined;
  for (const span of spans) if (span.from === null || span.from <= year) found = span;
  return found === undefined ? { span: spans[0], gap: true } : { span: found, gap: false };
}

const sameValue = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * The markings of a sport's surface in a season: what the rule books and the leagues had painted on it then. Without a year it is
 * today's (`ERA_CURRENT`). A season is named by the year it starts in (`1979` is the 1979–80 season). `differences` lists what is
 * not as it is today, `gaps` the markings that no source covers for the season, and `approx` those whose measure is not cited.
 * @example
 * ```ts
 * import { rulesFor } from "@johnmorrisdotca/kyogijo/eras";
 * const nba = rulesFor("nba", 1995);
 * console.log(nba.season, nba.rules.threePoint, nba.rules.restrictedArea, nba.differences.length);
 * // 1995–96 { radius: 22 } false 2
 * ```
 */
export function rulesFor<S extends EraSport>(sport: S, year?: number): EraRules<S> {
  if (!ERA_SPORTS.includes(sport)) throw new Error(`No history for "${String(sport)}": use one of ${ERA_SPORTS.join(", ")}`);
  const asked = typeof year === "number" && Number.isFinite(year) ? Math.floor(year) : ERA_CURRENT;
  const rules: Record<string, unknown> = { ...present(sport) };
  const differences: EraChange[] = [];
  const gaps: string[] = [];
  const approx: string[] = [];
  let planned = false;
  for (const [feature, spans] of featuresOf(sport)) {
    const now = spanIn(spans, ERA_CURRENT).span;
    const { span, gap } = spanIn(spans, asked);
    rules[feature] = span.value;
    if (gap) gaps.push(feature);
    if (span.approx === true) approx.push(feature);
    if (span.planned === true && span.from !== null && span.from <= asked) planned = true;
    // A gap is not known to differ, so it is not listed as a difference.
    if (!gap && !sameValue(span.value, now.value)) differences.push(changeOf(sport, feature, span));
  }
  return { sport, year: asked, season: seasonLabel(sport, asked), rules: rules as unknown as EraRulesOf[S], differences, gaps, approx, planned };
}

/**
 * A football field's spec in a season: the NFL's or the CFL's as `FOOTBALL` has it today, with the length, the end zones, the
 * hash marks and the goal posts of that season. The IFAF's has no history and is returned as it is.
 * @example
 * ```ts
 * import { footballIn } from "@johnmorrisdotca/kyogijo/eras";
 * console.log(footballIn("cfl", 1985).endZone / 3, footballIn("cfl", 1986).endZone / 3, footballIn("nfl", 1960).hash / 3);
 * // 25 20 20
 * ```
 */
export function footballIn(sport: "nfl" | "cfl" | "ifaf", year?: number): FootballSpec {
  const base = FOOTBALL[sport];
  if (sport === "ifaf") return { ...base };
  const { rules } = rulesFor(sport, year);
  // No hash marks yet: the spec keeps the modern figure and the drawing leaves the marks out (see `hashMarks`).
  return { ...base, length: rules.length, endZone: rules.endZone, hash: rules.hash ?? base.hash, posts: rules.posts };
}
