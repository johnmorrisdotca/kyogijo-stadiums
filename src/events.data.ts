// The special games: where each was played and on what, with the place of the game's own surface in its host and the sources of all of it. Every date, venue and
// figure here is read from the sources named in `EVENT_SOURCES` (docs/sources.md has the same list with what each gave); nothing is estimated. Where no source gives
// where the surface stood, the place is a convention (`rule`), which `eventPlacement` works out, and the game says so.
import type { HostOptions, Placement, Sport } from "./types.ts";
import type { Fence } from "./types.ts";

/** The words of a thing in both languages. */
export interface Words {
  en: string;
  ja: string;
}

/** A source a game was read from. */
export interface EventSource {
  id: string;
  title: string;
  /** The author and the publication, or the encyclopedia and its licence. */
  by: string;
  /** The revision of an article of Wikipedia, or the date of a page. */
  edition: string;
  url: string;
  /** What it gave. */
  gave: string;
}

/** The ways a surface is placed when no source gives where it stood. */
export type PlacementRule = "infield" | "midfield" | "diamond" | "deck";

/** How the place of the surface was decided. */
export type PlacementBasis = { kind: "published"; note: Words; sources: string[] } | { kind: "convention"; rule: PlacementRule };

/** A game played on a surface set inside another. */
export interface SpecialEventData {
  /** The key: `winter-classic-2009`. */
  id: string;
  name: Words;
  /** The day or days it was played, `YYYY-MM-DD`. */
  dates: string[];
  /** The venue's name when the game was played. */
  venue: Words;
  /** The surface the game was played on, as the options of a drawing: its sport, its season and the fence or the league that makes it what it was. */
  guest: { sport: Sport; year: number; league?: string; fence?: Partial<Fence> };
  /** What it was set inside. */
  host: HostOptions;
  placement: Placement;
  basis: PlacementBasis;
  /** Something about the game a reader of the drawing needs. */
  note?: Words;
  /** The sources of the game: its date, its venue and the host. */
  sources: string[];
}

const wiki = (id: string, title: string, revision: number, gave: string): EventSource => ({
  id,
  title,
  by: "Wikipedia, CC BY-SA 4.0",
  edition: `revision ${revision}`,
  url: `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(title.replace(/ /g, "_"))}&oldid=${revision}`,
  gave,
});

/** Every source, by key. Read on 2026-10-13. */
export const EVENT_SOURCES: Readonly<Record<string, EventSource>> = Object.freeze(
  Object.fromEntries(
    [
      wiki("wc-2009", "2009 NHL Winter Classic", 1373320166, "The date (January 1, 2009), Wrigley Field."),
      wiki("wc-2010", "2010 NHL Winter Classic", 1366739177, "The date (January 1, 2010), Fenway Park."),
      wiki("wc-2017", "2017 NHL Winter Classic", 1379900792, "The date (January 2, 2017), Busch Stadium."),
      wiki("wc-2018", "2018 NHL Winter Classic", 1374252992, "The date (January 1, 2018), Citi Field."),
      wiki("wc-2019", "2019 NHL Winter Classic", 1373254484, "The date (January 1, 2019), Notre Dame Stadium."),
      wiki("wc-2022", "2022 NHL Winter Classic", 1379456628, "The date (January 1, 2022), Target Field."),
      wiki("wc-2023", "2023 NHL Winter Classic", 1366207097, "The date (January 2, 2023), Fenway Park."),
      wiki("wc-list", "NHL Winter Classic", 1374788408, "The venue of each Winter Classic and the sport its stadium is for; that Notre Dame Stadium is a college football stadium."),
      wiki("ss-2014", "2014 NHL Stadium Series", 1372152454, "The dates (January 25, 26 and 29, 2014) and the venues, Dodger Stadium and Yankee Stadium."),
      wiki("hc-2003", "2003 NHL Heritage Classic", 1374350751, "The date (November 22, 2003), Commonwealth Stadium."),
      wiki("hc-2011", "2011 NHL Heritage Classic", 1374350772, "The date (February 20, 2011), McMahon Stadium."),
      wiki("hc-2014", "2014 NHL Heritage Classic", 1374350779, "The date (March 2, 2014), BC Place, with its roof closed."),
      wiki("hc-2016", "2016 NHL Heritage Classic", 1377841702, "The date (October 23, 2016), Investors Group Field, home of the CFL's Blue Bombers."),
      wiki("hc-2019", "2019 NHL Heritage Classic", 1374350802, "The date (October 26, 2019), Mosaic Stadium, home field of the CFL's Saskatchewan Roughriders."),
      wiki("hc-2023", "2023 NHL Heritage Classic", 1374350813, "The date (October 29, 2023), Commonwealth Stadium."),
      wiki("hc-list", "NHL Heritage Classic", 1372780976, "That the Heritage Classic is held in football stadiums based in Canada."),
      wiki("commonwealth", "Commonwealth Stadium", 1378728638, "Primarily used as the home field of the Edmonton Elks of the Canadian Football League."),
      wiki("mcmahon", "McMahon Stadium", 1373806532, "A Canadian football stadium in Calgary."),
      wiki("bc-place", "BC Place", 1372065649, "The home of the BC Lions of the Canadian Football League; a stadium with a retractable roof."),
      wiki("princess-auto", "Princess Auto Stadium", 1377634185, "The stadium (formerly IG Field) is home to the Winnipeg Blue Bombers of the CFL."),
      wiki("notre-dame", "Notre Dame Stadium", 1378192410, "The home field of the University of Notre Dame's football team."),
      wiki("london-series", "MLB London Series", 1377779354, "The dates of the games (June 29 and 30, 2019; June 24 and 25, 2023), the field laid over the stadium's running track and pitch, and its fence: 330 feet to the foul poles, 382 to left center and right center, 385 to center field in 2019; 387 in the power alleys and 392 to center field in 2023."),
      wiki("london-stadium", "London Stadium", 1377039897, "The stadium's field of play, 105 by 68 metres."),
      wiki("carrier-classic", "Carrier Classic", 1372668329, "The date (November 11, 2011), the game on the flight deck of USS Carl Vinson between Michigan State and North Carolina."),
      wiki("nimitz", "Nimitz-class aircraft carrier", 1378895753, "The class's overall length, 1,092 feet, and overall beam, 252 feet."),
      wiki("carl-vinson", "USS Carl Vinson", 1378362261, "That USS Carl Vinson is a Nimitz-class carrier and played host to the first NCAA basketball game on an aircraft carrier."),
      {
        id: "svg-2008",
        title: "2009 NHL Winter Classic Takes the Mound",
        by: "Carolyn Braff, Sports Video Group",
        edition: "30 December 2008",
        url: "https://www.sportsvideo.org/2008/12/30/2009-nhl-winter-classic-takes-the-mound/",
        gave: "At Wrigley Field the 200- by 85-foot rink \"splits the pitchers' mound from first to third\" and \"sits 112 feet from home plate and 288 feet from the center-field wall\"; the 2008 and 2003 games were played on football fields.",
      },
      {
        id: "nhl-2024",
        title: "Winter Classic at Wrigley evokes memories of 1st outdoor game at Cubs' home",
        by: "Tracey Myers, NHL.com",
        edition: "29 December 2024",
        url: "https://www.nhl.com/news/topic/winter-classic/2009-wrigley-winter-classic-oral-history",
        gave: "Dan Craig, who built the 2009 rink: the diagram had center ice at second base, and the rink was moved inside the infield, so that center ice was basically at the pitching mound.",
      },
      {
        id: "globe-2022",
        title: "The NHL is about to move into Fenway Park. Here's a look at how it will set up for the Winter Classic.",
        by: "Michael Silverman, The Boston Globe",
        edition: "18 December 2022",
        url: "https://www.bostonglobe.com/2022/12/18/sports/nhl-is-about-move-into-fenway-park-heres-look-how-it-will-set-up-winter-classic",
        gave: "At Fenway Park in 2023 the 200-foot rink is roughly centered length-wise across the first and third bases, stretched along a second-to-third-base axis across the Green Monster, shifted from its 2010 layout.",
      },
    ].map((source) => [source.id, source]),
  ),
);

/** The rink every outdoor game of the NHL was played on is the NHL's: 200 by 85 feet (Rule 1 of the NHL rulebook, in docs/sources.md); the 2009 game's story prints that size. */
const rink = (year: number): SpecialEventData["guest"] => ({ sport: "nhl", year });

const park = (id: string, year: number): HostOptions => ({ park: id, year });
const cfl = (year: number): HostOptions => ({ field: "cfl", year });

const infield: PlacementBasis = { kind: "convention", rule: "infield" };
const midfield: PlacementBasis = { kind: "convention", rule: "midfield" };

/** The games, in the order they were played. `eventPlacement(rule)` in events.ts works out each convention's numbers; a test holds the numbers here to it. */
export const EVENT_DATA: SpecialEventData[] = [
  {
    id: "heritage-classic-2003",
    name: { en: "2003 NHL Heritage Classic", ja: "2003年NHLヘリテージ・クラシック" },
    dates: ["2003-11-22"],
    venue: { en: "Commonwealth Stadium", ja: "コモンウェルス・スタジアム" },
    guest: rink(2003),
    host: cfl(2003),
    placement: { x: 225, y: 97.5, angle: 0 },
    basis: midfield,
    sources: ["hc-2003", "hc-list", "commonwealth"],
  },
  {
    id: "winter-classic-2009",
    name: { en: "2009 NHL Winter Classic", ja: "2009年NHLウィンター・クラシック" },
    dates: ["2009-01-01"],
    venue: { en: "Wrigley Field", ja: "リグレー・フィールド" },
    guest: rink(2008),
    host: park("wrigley-field", 2009),
    placement: { x: 0, y: -69.5, angle: 0 },
    basis: {
      kind: "published",
      note: {
        en: "the rink ran from first base to third, 200 by 85 feet, and its edge toward center field was 112 feet from home plate and 288 feet from the 400-foot center-field wall, so that its middle was 69.5 feet out, within 9 feet of the pitching mound, where the man who built it says center ice was.",
        ja: "リンクは200×85フィートで、長辺は一塁と三塁を結ぶ向きでした。中堅側の縁は本塁から112フィート、400フィートの中堅フェンスから288フィートの位置にあり、そのため中心は本塁から69.5フィート、マウンドから9フィート以内にありました。リンクを造った人物は、センターアイスはこのマウンドのあたりだったと語っています。",
      },
      sources: ["svg-2008", "nhl-2024"],
    },
    sources: ["wc-2009", "wc-list", "svg-2008", "nhl-2024"],
  },
  {
    id: "winter-classic-2010",
    name: { en: "2010 NHL Winter Classic", ja: "2010年NHLウィンター・クラシック" },
    dates: ["2010-01-01"],
    venue: { en: "Fenway Park", ja: "フェンウェイ・パーク" },
    guest: rink(2009),
    host: park("fenway-park", 2010),
    placement: { x: 0, y: -63.64, angle: 0 },
    basis: infield,
    sources: ["wc-2010", "wc-list", "globe-2022"],
  },
  {
    id: "heritage-classic-2011",
    name: { en: "2011 NHL Heritage Classic", ja: "2011年NHLヘリテージ・クラシック" },
    dates: ["2011-02-20"],
    venue: { en: "McMahon Stadium", ja: "マクマホン・スタジアム" },
    guest: rink(2010),
    host: cfl(2011),
    placement: { x: 225, y: 97.5, angle: 0 },
    basis: midfield,
    sources: ["hc-2011", "hc-list", "mcmahon"],
  },
  {
    id: "stadium-series-2014-dodger",
    name: { en: "2014 NHL Stadium Series at Dodger Stadium", ja: "2014年NHLスタジアム・シリーズ（ドジャー・スタジアム）" },
    dates: ["2014-01-25"],
    venue: { en: "Dodger Stadium", ja: "ドジャー・スタジアム" },
    guest: rink(2013),
    host: park("dodger-stadium", 2014),
    placement: { x: 0, y: -63.64, angle: 0 },
    basis: infield,
    sources: ["ss-2014"],
  },
  {
    id: "stadium-series-2014-yankee",
    name: { en: "2014 NHL Stadium Series at Yankee Stadium", ja: "2014年NHLスタジアム・シリーズ（ヤンキー・スタジアム）" },
    dates: ["2014-01-26", "2014-01-29"],
    venue: { en: "Yankee Stadium", ja: "ヤンキー・スタジアム" },
    guest: rink(2013),
    host: park("yankee-stadium", 2014),
    placement: { x: 0, y: -63.64, angle: 0 },
    basis: infield,
    sources: ["ss-2014"],
  },
  {
    id: "heritage-classic-2014",
    name: { en: "2014 NHL Heritage Classic", ja: "2014年NHLヘリテージ・クラシック" },
    dates: ["2014-03-02"],
    venue: { en: "BC Place", ja: "BCプレース" },
    guest: rink(2013),
    host: cfl(2014),
    placement: { x: 225, y: 97.5, angle: 0 },
    basis: midfield,
    note: { en: "BC Place has a retractable roof, and it was closed for this game.", ja: "BCプレースには開閉式の屋根があり、この試合では閉じられていました。" },
    sources: ["hc-2014", "hc-list", "bc-place"],
  },
  {
    id: "heritage-classic-2016",
    name: { en: "2016 NHL Heritage Classic", ja: "2016年NHLヘリテージ・クラシック" },
    dates: ["2016-10-23"],
    venue: { en: "Investors Group Field", ja: "インベスターズ・グループ・フィールド" },
    guest: rink(2016),
    host: cfl(2016),
    placement: { x: 225, y: 97.5, angle: 0 },
    basis: midfield,
    sources: ["hc-2016", "hc-list", "princess-auto"],
  },
  {
    id: "winter-classic-2017",
    name: { en: "2017 NHL Winter Classic", ja: "2017年NHLウィンター・クラシック" },
    dates: ["2017-01-02"],
    venue: { en: "Busch Stadium", ja: "ブッシュ・スタジアム" },
    guest: rink(2016),
    host: park("busch-stadium", 2017),
    placement: { x: 0, y: -63.64, angle: 0 },
    basis: infield,
    sources: ["wc-2017", "wc-list"],
  },
  {
    id: "winter-classic-2018",
    name: { en: "2018 NHL Winter Classic", ja: "2018年NHLウィンター・クラシック" },
    dates: ["2018-01-01"],
    venue: { en: "Citi Field", ja: "シティ・フィールド" },
    guest: rink(2017),
    host: park("citi-field", 2018),
    placement: { x: 0, y: -63.64, angle: 0 },
    basis: infield,
    sources: ["wc-2018", "wc-list"],
  },
  {
    id: "winter-classic-2019",
    name: { en: "2019 NHL Winter Classic", ja: "2019年NHLウィンター・クラシック" },
    dates: ["2019-01-01"],
    venue: { en: "Notre Dame Stadium", ja: "ノートルダム・スタジアム" },
    guest: rink(2018),
    host: { field: "nfl", league: "ncaa", year: 2019 },
    placement: { x: 180, y: 80, angle: 0 },
    basis: midfield,
    note: { en: "Notre Dame Stadium is a college football stadium, so its field is drawn as the NCAA marks it.", ja: "ノートルダム・スタジアムは大学アメリカンフットボールのスタジアムなので、フィールドはNCAAのラインの引き方に合わせて描いています。" },
    sources: ["wc-2019", "wc-list", "notre-dame"],
  },
  {
    id: "heritage-classic-2019",
    name: { en: "2019 NHL Heritage Classic", ja: "2019年NHLヘリテージ・クラシック" },
    dates: ["2019-10-26"],
    venue: { en: "Mosaic Stadium", ja: "モザイク・スタジアム" },
    guest: rink(2019),
    host: cfl(2019),
    placement: { x: 225, y: 97.5, angle: 0 },
    basis: midfield,
    sources: ["hc-2019", "hc-list"],
  },
  {
    id: "winter-classic-2022",
    name: { en: "2022 NHL Winter Classic", ja: "2022年NHLウィンター・クラシック" },
    dates: ["2022-01-01"],
    venue: { en: "Target Field", ja: "ターゲット・フィールド" },
    guest: rink(2021),
    host: park("target-field", 2022),
    placement: { x: 0, y: -63.64, angle: 0 },
    basis: infield,
    note: { en: "The game was planned for 2021 and played a year late, in January 2022.", ja: "この試合は2021年に予定されていましたが、1年遅れて2022年1月に行われました。" },
    sources: ["wc-2022", "wc-list"],
  },
  {
    id: "winter-classic-2023",
    name: { en: "2023 NHL Winter Classic", ja: "2023年NHLウィンター・クラシック" },
    dates: ["2023-01-02"],
    venue: { en: "Fenway Park", ja: "フェンウェイ・パーク" },
    guest: rink(2022),
    host: park("fenway-park", 2023),
    placement: { x: 0, y: -63.64, angle: -45 },
    basis: {
      kind: "published",
      note: {
        en: "the 200-foot rink is roughly centered length-wise across first and third bases and stretched along a second-to-third-base axis, so its middle is drawn halfway between first and third, with its length turned to run from third base toward second.",
        ja: "200フィートのリンクは、一塁と三塁をまたぐように長さ方向のほぼ中央で置かれ、二塁と三塁を結ぶ軸に沿って伸びていました。そこで、中心を一塁と三塁の中間に置き、長辺を三塁から二塁に向けて描いています。",
      },
      sources: ["globe-2022"],
    },
    sources: ["wc-2023", "wc-list", "globe-2022"],
  },
  {
    id: "heritage-classic-2023",
    name: { en: "2023 NHL Heritage Classic", ja: "2023年NHLヘリテージ・クラシック" },
    dates: ["2023-10-29"],
    venue: { en: "Commonwealth Stadium", ja: "コモンウェルス・スタジアム" },
    guest: rink(2023),
    host: cfl(2023),
    placement: { x: 225, y: 97.5, angle: 0 },
    basis: midfield,
    sources: ["hc-2023", "hc-list", "commonwealth"],
  },
  {
    id: "carrier-classic-2011",
    name: { en: "2011 Carrier Classic", ja: "2011年キャリアー・クラシック" },
    dates: ["2011-11-11"],
    venue: { en: "USS Carl Vinson", ja: "空母カール・ビンソン" },
    guest: { sport: "nba", year: 2011, league: "ncaa-men" },
    host: { deck: { length: 1092, width: 252, unit: "ft" }, name: "USS Carl Vinson", nameJa: "空母カール・ビンソン", year: 2011 },
    placement: { x: 546, y: 126, angle: 0 },
    basis: { kind: "convention", rule: "deck" },
    note: {
      en: "The deck is drawn as a plain rectangle of the Nimitz class's overall length and beam, 1,092 by 252 feet; the ship's flight deck is angled and narrower at its ends.",
      ja: "甲板は、ニミッツ級の全長と最大幅（1,092×252フィート）の単純な長方形で描いています。実際の飛行甲板は斜めの部分があり、端に向かって細くなります。",
    },
    sources: ["carrier-classic", "nimitz", "carl-vinson"],
  },
  {
    id: "mlb-london-2019",
    name: { en: "2019 MLB London Series", ja: "2019年MLBロンドン・シリーズ" },
    dates: ["2019-06-29", "2019-06-30"],
    venue: { en: "London Stadium", ja: "ロンドン・スタジアム" },
    guest: { sport: "mlb", year: 2019, fence: { left: 330, leftCenter: 382, center: 385, rightCenter: 382, right: 330 } },
    host: { pitch: { length: 105, width: 68, unit: "m" }, name: "London Stadium", nameJa: "ロンドン・スタジアム", year: 2019 },
    placement: { x: 108.6, y: 111.55, angle: 90 },
    basis: { kind: "convention", rule: "diamond" },
    note: {
      en: "The baseball field was laid over the stadium's running track and pitch, so most of it lies beyond the pitch. The fence is 330 feet to the foul poles, 382 to left center and right center and 385 to center field.",
      ja: "野球のグラウンドはスタジアムの陸上トラックとピッチの上に敷かれたため、大部分がピッチの外にあります。フェンスまでの距離は、ポールまで330フィート、左中間と右中間まで382フィート、中堅まで385フィートです。",
    },
    sources: ["london-series", "london-stadium"],
  },
  {
    id: "mlb-london-2023",
    name: { en: "2023 MLB London Series", ja: "2023年MLBロンドン・シリーズ" },
    dates: ["2023-06-24", "2023-06-25"],
    venue: { en: "London Stadium", ja: "ロンドン・スタジアム" },
    guest: { sport: "mlb", year: 2023, fence: { left: 330, leftCenter: 387, center: 392, rightCenter: 387, right: 330 } },
    host: { pitch: { length: 105, width: 68, unit: "m" }, name: "London Stadium", nameJa: "ロンドン・スタジアム", year: 2023 },
    placement: { x: 108.6, y: 111.55, angle: 90 },
    basis: { kind: "convention", rule: "diamond" },
    note: {
      en: "For 2023 the fence was moved out to 387 feet in the power alleys and 392 to center field; the 330 feet to the foul poles is that of 2019, which the source does not restate.",
      ja: "2023年はフェンスが外側に移され、左中間・右中間は387フィート、中堅は392フィートになりました。ポールまでの330フィートは2019年の数字で、2023年について資料は改めて触れていません。",
    },
    sources: ["london-series", "london-stadium"],
  },
];
