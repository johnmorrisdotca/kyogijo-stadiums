// The formations of the sports beyond the first five (rugby, Australian football, cricket, volleyball, handball, water polo, field hockey and netball), softball's
// defence, hockey's second line, a traditional basketball set and baseball's designated hitter, with the names of their positions. Kept apart from formations.ts so that
// the first table stays short. As there, the names of the positions are the conventional ones and the numbers are ours: a formation is an example of the shape, not a
// measurement, and the rulebooks name few places (docs/sources.md, "Formations"). Every sport's places are in the plain frame of its surface, for a team that attacks the right.
import type { Named } from "./formations.ts";
import type { Formation, FormationPosition, FormationSport } from "./team.types.ts";

const named = (en: string, ja: string): Named => ({ en, ja });
const at = (id: string, x: number, y: number, size?: number): FormationPosition => (size === undefined ? { id, x, y } : { id, x, y, size });

/** The names of the positions of the sports in this file, and of the places this file adds to the first five, by id. */
export const MORE_NAMES: Readonly<Partial<Record<FormationSport, Readonly<Record<string, Named>>>>> = Object.freeze({
  nhl: {
    LW2: named("Left wing on the second line", "第2ラインの左ウイング"),
    C2: named("Centre on the second line", "第2ラインのセンター"),
    RW2: named("Right wing on the second line", "第2ラインの右ウイング"),
    LD2: named("Left defenceman on the second pair", "第2ペアの左ディフェンス"),
    RD2: named("Right defenceman on the second pair", "第2ペアの右ディフェンス"),
  },
  mlb: {
    DH: named("Designated hitter", "指名打者"),
  },
  rugby: {
    "1": named("Loosehead prop", "左プロップ"),
    "2": named("Hooker", "フッカー"),
    "3": named("Tighthead prop", "右プロップ"),
    "4": named("Lock", "ロック（4番）"),
    "5": named("Lock", "ロック（5番）"),
    "6": named("Blindside flanker", "ブラインドサイドフランカー"),
    "7": named("Openside flanker", "オープンサイドフランカー"),
    "8": named("Number eight", "ナンバーエイト"),
    "9": named("Scrum-half", "スクラムハーフ"),
    "10": named("Fly-half", "スタンドオフ"),
    "11": named("Left wing", "左ウイング"),
    "12": named("Inside centre", "インサイドセンター"),
    "13": named("Outside centre", "アウトサイドセンター"),
    "14": named("Right wing", "右ウイング"),
    "15": named("Full-back", "フルバック"),
  },
  afl: {
    FB: named("Full-back", "フルバック"),
    BPL: named("Left back pocket", "左バックポケット"),
    BPR: named("Right back pocket", "右バックポケット"),
    CHB: named("Centre half-back", "センターハーフバック"),
    HBFL: named("Left half-back flank", "左ハーフバックフランク"),
    HBFR: named("Right half-back flank", "右ハーフバックフランク"),
    C: named("Centre", "センター"),
    WL: named("Left wing", "左ウイング"),
    WR: named("Right wing", "右ウイング"),
    CHF: named("Centre half-forward", "センターハーフフォワード"),
    HFFL: named("Left half-forward flank", "左ハーフフォワードフランク"),
    HFFR: named("Right half-forward flank", "右ハーフフォワードフランク"),
    FF: named("Full-forward", "フルフォワード"),
    FPL: named("Left forward pocket", "左フォワードポケット"),
    FPR: named("Right forward pocket", "右フォワードポケット"),
    RUC: named("Ruck", "ルック"),
    RR: named("Ruck-rover", "ルックローバー"),
    ROV: named("Rover", "ローバー"),
  },
  cricket: {
    BWL: named("Bowler", "ボウラー"),
    WK: named("Wicketkeeper", "ウィケットキーパー"),
    SL1: named("First slip", "ファーストスリップ"),
    SL2: named("Second slip", "セカンドスリップ"),
    SL3: named("Third slip", "サードスリップ"),
    GU: named("Gully", "ガリー"),
    PT: named("Point", "ポイント"),
    CV: named("Cover", "カバー"),
    MO: named("Mid-off", "ミッドオフ"),
    MN: named("Mid-on", "ミッドオン"),
    MW: named("Mid-wicket", "ミッドウィケット"),
    SQ: named("Square leg", "スクエアレッグ"),
    FL: named("Fine leg", "ファインレッグ"),
    TM: named("Third man", "サードマン"),
    LO: named("Long-off", "ロングオフ"),
    LN: named("Long-on", "ロングオン"),
    DC: named("Deep cover", "ディープカバー"),
    DM: named("Deep mid-wicket", "ディープミッドウィケット"),
  },
  volleyball: {
    P1: named("Position 1, right back", "ポジション1（右後衛）"),
    P2: named("Position 2, right front", "ポジション2（右前衛）"),
    P3: named("Position 3, centre front", "ポジション3（中央前衛）"),
    P4: named("Position 4, left front", "ポジション4（左前衛）"),
    P5: named("Position 5, left back", "ポジション5（左後衛）"),
    P6: named("Position 6, centre back", "ポジション6（中央後衛）"),
  },
  handball: {
    GK: named("Goalkeeper", "ゴールキーパー"),
    LW: named("Left wing", "左ウイング"),
    LB: named("Left back", "左バック"),
    CB: named("Centre back", "センターバック"),
    RB: named("Right back", "右バック"),
    RW: named("Right wing", "右ウイング"),
    PV: named("Pivot", "ピボット"),
  },
  waterpolo: {
    GK: named("Goalkeeper", "ゴールキーパー"),
    LW: named("Left wing", "左ウイング"),
    RW: named("Right wing", "右ウイング"),
    LD: named("Left flat", "左ドライバー"),
    RD: named("Right flat", "右ドライバー"),
    CF: named("Centre forward", "センターフォワード"),
    CB: named("Centre back", "センターバック"),
  },
  fieldhockey: {
    GK: named("Goalkeeper", "ゴールキーパー"),
    RB: named("Right back", "右フルバック"),
    LB: named("Left back", "左フルバック"),
    RCB: named("Right centre-back", "右センターバック"),
    LCB: named("Left centre-back", "左センターバック"),
    CB: named("Centre-back", "センターバック"),
    RM: named("Right midfielder", "右ミッドフィールダー"),
    LM: named("Left midfielder", "左ミッドフィールダー"),
    CM: named("Central midfielder", "センターミッドフィールダー"),
    RCM: named("Right central midfielder", "右センターミッドフィールダー"),
    LCM: named("Left central midfielder", "左センターミッドフィールダー"),
    RW: named("Right winger", "右フォワード"),
    LW: named("Left winger", "左フォワード"),
    CF: named("Centre forward", "センターフォワード"),
  },
  netball: {
    GS: named("Goal shooter", "ゴールシュート"),
    GA: named("Goal attack", "ゴールアタック"),
    WA: named("Wing attack", "ウイングアタック"),
    C: named("Centre", "センター"),
    WD: named("Wing defence", "ウイングディフェンス"),
    GD: named("Goal defence", "ゴールディフェンス"),
    GK: named("Goal keeper", "ゴールキーパー"),
  },
});

/** The extra places of the baseball and softball formations: the designated hitter, listed beside home plate where the batter on deck waits (feet, the frame `retrosheet`). */
const DH = [at("DH", -34, -10)];

// Rugby union, in the `rugby` frame: metres from the middle of the pitch, x towards the end the team attacks, y up the page, so the team's right is the low y. The pack is bound as for a scrum,
// the scrum-half beside it, the backs in a line out to the wings and the full-back deep.
const rugby15: Formation = {
  id: "rugby-15",
  sport: "rugby",
  frame: "rugby",
  name: { en: "Rugby union, the fifteen", ja: "ラグビーユニオン（15人）" },
  about: { en: "The fifteen in their numbers, 1 to 15: the pack of eight bound as for a scrum, the scrum-half beside it, the fly-half and the centres in a line behind, the wings wide and the full-back deep.", ja: "背番号1〜15の15人。スクラムを組む形のフォワード8人、その脇にスクラムハーフ、後方に斜めに並ぶスタンドオフとセンター、両端のウイング、最後方のフルバック。" },
  positions: [at("1", -6, 9), at("2", -6, 0), at("3", -6, -9), at("4", -14, 4.5), at("5", -14, -4.5), at("6", -14, 14), at("7", -14, -14), at("8", -22, 0), at("9", -23, -17), at("10", -27, 8), at("12", -30, 16), at("13", -34, 24), at("11", -40, 32), at("14", -40, -32), at("15", -46, -3)],
};

// Australian football, in the `afl` frame: metres from the middle of the ground. Three men on each of five lines and three followers, 18 in all (the interchange is not on the ground).
const afl18: Formation = {
  id: "afl-18",
  sport: "afl",
  frame: "afl",
  name: { en: "Australian football, the eighteen", ja: "オーストラリアンフットボール（18人）" },
  about: { en: "The eighteen on the ground: three on each of the back, half-back, centre, half-forward and forward lines, and three followers at the centre.", ja: "グラウンド上の18人。バック、ハーフバック、センター、ハーフフォワード、フォワードの各ラインに3人ずつと、中央に立つフォロワー3人。" },
  positions: [at("BPL", -52, 17), at("FB", -56, 0), at("BPR", -52, -17), at("HBFL", -32, 26), at("CHB", -34, 0), at("HBFR", -32, -26), at("WL", -12, 32), at("C", -14, 0), at("WR", -12, -32), at("HFFL", 26, 26), at("CHF", 28, 0), at("HFFR", 26, -26), at("FPL", 50, 17), at("FF", 54, 0), at("FPR", 50, -17), at("RUC", 6, 0), at("RR", -3, 14), at("ROV", -3, -14)],
};

// Cricket, in the `cricket` frame: yards from the middle of the pitch, the striker's end at the right and a right-handed batter facing the bowler at the left, so the off side is up the page. The ground is 150 yards
// across and the circle 30 yards from the stumps. Eleven fielders, the bowler and the wicketkeeper among them.
const cricketTest: Formation = {
  id: "cricket-test-attacking",
  sport: "cricket",
  frame: "cricket",
  name: { en: "Cricket, attacking field for a fast bowler", ja: "クリケット（速球投手に対する攻撃的な守備）" },
  about: { en: "For a right-handed batter: three slips and a gully on the off side to catch an edge, point, cover, mid-off, mid-on and square leg all close, and the wicketkeeper standing back. Nobody is on the boundary.", ja: "右打者に対する守備。エッジを捕るために、オフ側にスリップ3人とガリー、近くにポイント、カバー、ミッドオフ、ミッドオン、スクエアレッグ、後ろに下がったウィケットキーパー。境界線付近には誰もいません。" },
  positions: [at("BWL", -13, 0), at("WK", 19, -1.5), at("SL1", 18, 4), at("SL2", 16.5, 10), at("SL3", 15, 16), at("GU", 11.5, 22), at("PT", 11, 28), at("CV", -1, 28), at("MO", -15, 21), at("MN", -15, -21), at("SQ", 12, -22)],
};
const cricketPowerplay: Formation = {
  id: "cricket-powerplay",
  sport: "cricket",
  frame: "cricket",
  name: { en: "Cricket, one-day powerplay", ja: "クリケット（ワンデーのパワープレー）" },
  about: { en: "The first ten overs of a one-day international, when no more than two fielders may be outside the 30-yard circle: nine close, with third man and fine leg deep.", ja: "ワンデー国際試合の最初の10オーバー。30ヤードサークルの外に置ける野手は2人までなので、9人はサークル内に、サードマンとファインレッグが外に立ちます。" },
  positions: [at("BWL", -13, 0), at("WK", 14, 0), at("SL1", 17, 4), at("PT", 11, 28), at("CV", -1, 28), at("MO", -14, 20), at("MN", -14, -20), at("MW", 1, -25), at("SQ", 11, -22), at("TM", 46, 38), at("FL", 46, -36)],
};
const cricketDeath: Formation = {
  id: "cricket-boundary-defence",
  sport: "cricket",
  frame: "cricket",
  name: { en: "Cricket, defending the boundary", ja: "クリケット（境界線を守る守備）" },
  about: { en: "The last ten overs of a one-day international, when five fielders may be outside the circle: long-off, long-on, deep cover, deep mid-wicket and fine leg on the boundary, the rest close.", ja: "ワンデー国際試合の最後の10オーバー。サークルの外に5人置けるので、ロングオフ、ロングオン、ディープカバー、ディープミッドウィケット、ファインレッグが境界線付近に、残りは近くに立ちます。" },
  positions: [at("BWL", -13, 0), at("WK", 14, 0), at("PT", 11, 28), at("MO", -14, 20), at("MN", -14, -20), at("SQ", 11, -22), at("LO", -55, 20), at("LN", -55, -20), at("DC", -12, 58), at("DM", -2, -58), at("FL", 46, -36)],
};

// Volleyball, in the `volleyball` frame: metres from the middle of the net, x along the court, the team on the left half facing the net with its right hand towards the bottom of the page. The positions
// are the six places of the rotation order: 1 the server's, then 2, 3 and 4 along the front and 5 and 6 at the back.
const volleyball: Formation = {
  id: "volleyball-rotation",
  sport: "volleyball",
  frame: "volleyball",
  name: { en: "Volleyball, the six places of the rotation", ja: "バレーボール（ローテーションの6つの位置）" },
  about: { en: "The six places, numbered as the rules number them: 1 right back (the server), 2 right front, 3 centre front, 4 left front, 5 left back and 6 centre back. After each side-out the team moves one place clockwise.", ja: "ルールの番号どおりの6つの位置。1右後衛（サーバー）、2右前衛、3中央前衛、4左前衛、5左後衛、6中央後衛。サイドアウトのたびに1つずつ時計回りに移ります。" },
  positions: [at("P4", -2.5, 3), at("P3", -2.5, 0), at("P2", -2.5, -3), at("P5", -6.5, 3), at("P6", -6.5, 0), at("P1", -7, -3)],
};

// Handball, in the `handball` frame: metres from the middle of the court, the team attacking the right goal; the goal-area line is 6 m and the free-throw line 9 m from the goal.
const handballAttack: Formation = {
  id: "handball-attack",
  sport: "handball",
  frame: "handball",
  name: { en: "Handball, attack", ja: "ハンドボール（攻撃）" },
  about: { en: "The seven in attack: the three backs outside the 9 m line, a wing in each corner, the pivot on the 6 m line among the defenders, and the goalkeeper at home.", ja: "攻撃時の7人。9mラインの外側に3人のバック、両コーナーにウイング、6mライン付近で相手の守備の間に立つピボット、自陣のゴールキーパー。" },
  positions: [at("GK", -19, 0), at("LW", 16.5, 8.2), at("LB", 11.5, 6), at("CB", 10.5, 0), at("RB", 11.5, -6), at("RW", 16.5, -8.2), at("PV", 15, 0)],
};
const handball60: Formation = {
  id: "handball-6-0",
  sport: "handball",
  frame: "handball",
  name: { en: "Handball, 6-0 defence", ja: "ハンドボール（6-0ディフェンス）" },
  about: { en: "The six defenders in a line along the 6 m line of their own goal, the goalkeeper behind them. It is the commonest defence.", ja: "自分のゴールの6mラインに沿って6人が横一列に並び、その後ろにゴールキーパー。最もよく使われる守備です。" },
  positions: [at("GK", -19, 0), at("LW", -15.5, 6.8), at("LB", -14.5, 4), at("CB", -14, 1.3), at("RB", -14, -1.3), at("RW", -14.5, -4), at("PV", -15.5, -6.8)],
};

// Water polo, in the `waterpolo` frame: metres from the middle of the pool, the team attacking the right goal, the 2 m line at 10.8 m from the middle and the 5 m line at 7.8 m.
const waterPolo: Formation = {
  id: "waterpolo-attack",
  sport: "waterpolo",
  frame: "waterpolo",
  name: { en: "Water polo, six on five", ja: "水球（6対5の攻撃）" },
  about: { en: "A man-up attack of six: the centre forward on the 2 m line in front of the goal, a wing at each side of it, two drivers and the centre back at the point, with the goalkeeper at home.", ja: "数的優位の攻撃の形。ゴール前の2mライン上にセンターフォワード、その両脇にウイング、2人のドライバーと、後方のセンターバック。自陣にはゴールキーパー。" },
  positions: [at("GK", -12, 0), at("CF", 10.2, 0), at("LW", 10.8, 7), at("RW", 10.8, -7), at("LD", 8.5, 3.6), at("RD", 8.5, -3.6), at("CB", 7, 0)],
};

// Field hockey, in the `fieldhockey` frame: metres from the middle of the pitch, the team attacking the right goal.
const fieldHockey = (id: string, en: string, ja: string, about: Named, positions: FormationPosition[]): Formation => ({ id, sport: "fieldhockey", frame: "fieldhockey", name: { en, ja }, about, positions: [at("GK", -43, 0), ...positions] });
const fieldHockey433 = fieldHockey("fieldhockey-4-3-3", "Field hockey, 4-3-3", "フィールドホッケー（4-3-3）", { en: "The goalkeeper, four defenders, three midfielders and three forwards.", ja: "ゴールキーパー、ディフェンダー4人、ミッドフィールダー3人、フォワード3人。" }, [at("RB", -30, -19), at("RCB", -33, -7), at("LCB", -33, 7), at("LB", -30, 19), at("RCM", -8, -14), at("CM", -10, 0), at("LCM", -8, 14), at("RW", 22, -20), at("CF", 28, 0), at("LW", 22, 20)]);
const fieldHockey343 = fieldHockey("fieldhockey-3-4-3", "Field hockey, 3-4-3", "フィールドホッケー（3-4-3）", { en: "The goalkeeper, three defenders, four midfielders and three forwards.", ja: "ゴールキーパー、ディフェンダー3人、ミッドフィールダー4人、フォワード3人。" }, [at("RCB", -32, -13), at("CB", -34, 0), at("LCB", -32, 13), at("RM", -6, -21), at("RCM", -9, -7), at("LCM", -9, 7), at("LM", -6, 21), at("RW", 22, -18), at("CF", 28, 0), at("LW", 22, 18)]);

// Netball, in the `netball` frame: metres from the middle of the court, the team attacking the right goal. The seven positions are its zones: each player's bibs name the thirds and the circles she may enter.
const netball: Formation = {
  id: "netball-start",
  sport: "netball",
  frame: "netball",
  name: { en: "Netball, the seven positions", ja: "ネットボール（7つのポジション）" },
  about: { en: "The seven positions in the places they start from: the shooter and the attack in the goal third, the wing attack and the centre in the middle third, and the wing defence, goal defence and keeper behind them. Each may go only to her own zones.", ja: "スタート時の位置どおりに並んだ7つのポジション。ゴール側のサードにシューターとアタック、中央のサードにウイングアタックとセンター、その後ろにウイングディフェンス、ゴールディフェンス、キーパー。各選手は自分のゾーンにしか入れません。" },
  positions: [at("GS", 12.8, 0), at("GA", 9.5, 3.5), at("WA", 5, -4.5), at("C", 0, 0), at("WD", -5, 4.5), at("GD", -9.5, -3.5), at("GK", -12.8, 0)],
};

// Hockey's second line, in the `nhl-api` frame (feet): the first line where `hockey-5v5` puts it, and the second unit in a row along the benches at the top of the page, smaller.
const hockeyLines: Formation = {
  id: "hockey-two-lines",
  sport: "nhl",
  frame: "nhl-api",
  name: { en: "Hockey, two lines", ja: "アイスホッケー（2つのライン）" },
  about: { en: "The six on the ice and, in a row along the bench side, the next forward line and defence pair, each marked as the second unit. The codes of the second unit end in 2.", ja: "氷上の6人と、ベンチ側に一列に並ぶ次のフォワードラインとディフェンスペア（第2ユニットとして表示）。第2ユニットのコードは2で終わります。" },
  positions: [at("G", -87, 0), at("LD", -60, 16), at("RD", -60, -16), at("LW", -30, 28), at("C", -30, 0), at("RW", -30, -28), at("LD2", -66, 33, 0.8), at("RD2", -50, 33, 0.8), at("LW2", -16, 33, 0.8), at("C2", -2, 33, 0.8), at("RW2", 12, 33, 0.8)],
};

// Basketball in the `nba-stats` frame (tenths of feet): the traditional set, the guards out front, the forwards on the wings and a big man on each block.
const basketballTraditional: Formation = {
  id: "basketball-traditional",
  sport: "nba",
  frame: "nba-stats",
  name: { en: "Basketball, the five positions", ja: "バスケットボール（5つのポジション）" },
  about: { en: "The five positions where they traditionally stand: the point guard at the top, the shooting guard and the small forward on the wings, the power forward and the centre near the blocks.", ja: "5つのポジションの伝統的な位置。トップにポイントガード、両ウイングにシューティングガードとスモールフォワード、ゴール近くにパワーフォワードとセンター。" },
  positions: [at("PG", 0, 262), at("SG", 173, 173), at("SF", -173, 173), at("PF", 85, 70), at("C", -85, 70)],
};

// Softball, in the `retrosheet` frame (feet from home plate, y out towards the pitcher): a 60-foot diamond, the pitcher 43 feet away and a fence at 200.
const softball: Formation = {
  id: "softball-standard",
  sport: "mlb",
  frame: "retrosheet",
  name: { en: "Softball, standard defence", ja: "ソフトボール（通常の守備位置）" },
  about: { en: "The nine fielders of a 60-foot diamond where they usually stand, with the designated hitter listed beside home plate.", ja: "塁間60フィートのダイヤモンドでの9人の野手の定位置。指名打者はホームベースの脇に載せています。" },
  positions: [at("P", 0, 43), at("C", 0, -3), at("1B", 46, 52), at("2B", 24, 92), at("SS", -24, 92), at("3B", -46, 52), at("LF", -85, 165), at("CF", 0, 185), at("RF", 85, 165)],
  extra: DH,
};

/** The formations of this file, in the order of the table that holds them. */
export const MORE_FORMATIONS: readonly Formation[] = [hockeyLines, basketballTraditional, softball, rugby15, afl18, cricketTest, cricketPowerplay, cricketDeath, volleyball, handballAttack, handball60, waterPolo, fieldHockey433, fieldHockey343, netball];

/** The designated hitter's place, which `baseball-standard` and `baseball-shift` list and do not field. */
export const DESIGNATED_HITTER: readonly FormationPosition[] = DH;
