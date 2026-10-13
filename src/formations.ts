// Formations: where the players of a team stand, as named positions in a registered coordinate frame, so that a formation lies on a surface of any
// size and can be read back in a provider's own numbers. The positions are the usual ones of each sport, and the numbers are ours: a formation is a
// convention that coaches draw a little differently each time, so each place is an example of the shape and not a measurement. The names of the
// positions are the conventional ones; the rulebooks name few of them (the Laws of the Game, Law 3, name the goalkeeper and no other position; the
// Official Baseball Rules name the nine fielders, whose numbers 1 to 9 are the scorer's). The sources are in docs/sources.md.
import type { Formation, FormationPosition, FormationSport } from "./team.types.ts";

/** A name in both languages. */
export interface Named {
  en: string;
  ja: string;
}

const named = (en: string, ja: string): Named => ({ en, ja });

/** The names of the positions of each sport, by the id a formation uses for them. */
export const POSITION_NAMES: Readonly<Record<FormationSport, Readonly<Record<string, Named>>>> = Object.freeze({
  soccer: {
    GK: named("Goalkeeper", "ゴールキーパー"),
    RB: named("Right back", "右サイドバック"),
    LB: named("Left back", "左サイドバック"),
    CB: named("Centre-back", "センターバック"),
    RCB: named("Right centre-back", "右センターバック"),
    LCB: named("Left centre-back", "左センターバック"),
    RWB: named("Right wing-back", "右ウイングバック"),
    LWB: named("Left wing-back", "左ウイングバック"),
    CDM: named("Defensive midfielder", "アンカー"),
    RDM: named("Right defensive midfielder", "右ボランチ"),
    LDM: named("Left defensive midfielder", "左ボランチ"),
    CM: named("Central midfielder", "センターハーフ"),
    RCM: named("Right central midfielder", "右センターハーフ"),
    LCM: named("Left central midfielder", "左センターハーフ"),
    RM: named("Right midfielder", "右サイドハーフ"),
    LM: named("Left midfielder", "左サイドハーフ"),
    CAM: named("Attacking midfielder", "攻撃的ミッドフィルダー"),
    RAM: named("Right attacking midfielder", "右の攻撃的ミッドフィルダー"),
    LAM: named("Left attacking midfielder", "左の攻撃的ミッドフィルダー"),
    RW: named("Right winger", "右ウイング"),
    LW: named("Left winger", "左ウイング"),
    ST: named("Striker", "ストライカー"),
    RS: named("Right striker", "右ストライカー"),
    LS: named("Left striker", "左ストライカー"),
  },
  nhl: {
    G: named("Goaltender", "ゴーリー"),
    LD: named("Left defenceman", "左ディフェンス"),
    RD: named("Right defenceman", "右ディフェンス"),
    LW: named("Left wing", "レフトウイング"),
    C: named("Centre", "センター"),
    RW: named("Right wing", "ライトウイング"),
  },
  nba: {
    PG: named("Point guard", "ポイントガード"),
    SG: named("Shooting guard", "シューティングガード"),
    SF: named("Small forward", "スモールフォワード"),
    PF: named("Power forward", "パワーフォワード"),
    C: named("Centre", "センター"),
  },
  nfl: {
    QB: named("Quarterback", "クォーターバック"),
    HB: named("Halfback", "ハーフバック"),
    FB: named("Fullback", "フルバック"),
    WR1: named("Wide receiver 1", "ワイドレシーバー1"),
    WR2: named("Wide receiver 2", "ワイドレシーバー2"),
    WR3: named("Wide receiver 3", "ワイドレシーバー3"),
    TE: named("Tight end", "タイトエンド"),
    C: named("Centre", "センター"),
    LG: named("Left guard", "左ガード"),
    RG: named("Right guard", "右ガード"),
    LT: named("Left tackle", "左タックル"),
    RT: named("Right tackle", "右タックル"),
    LDE: named("Left defensive end", "左ディフェンシブエンド"),
    RDE: named("Right defensive end", "右ディフェンシブエンド"),
    LDT: named("Left defensive tackle", "左ディフェンシブタックル"),
    RDT: named("Right defensive tackle", "右ディフェンシブタックル"),
    NT: named("Nose tackle", "ノーズタックル"),
    LLB: named("Left linebacker", "左ラインバッカー"),
    MLB: named("Middle linebacker", "ミドルラインバッカー"),
    RLB: named("Right linebacker", "右ラインバッカー"),
    LOLB: named("Left outside linebacker", "左アウトサイドラインバッカー"),
    LILB: named("Left inside linebacker", "左インサイドラインバッカー"),
    RILB: named("Right inside linebacker", "右インサイドラインバッカー"),
    ROLB: named("Right outside linebacker", "右アウトサイドラインバッカー"),
    LCB: named("Left cornerback", "左コーナーバック"),
    RCB: named("Right cornerback", "右コーナーバック"),
    FS: named("Free safety", "フリーセーフティ"),
    SS: named("Strong safety", "ストロングセーフティ"),
  },
  mlb: {
    P: named("Pitcher", "ピッチャー"),
    C: named("Catcher", "キャッチャー"),
    "1B": named("First baseman", "ファースト"),
    "2B": named("Second baseman", "セカンド"),
    SS: named("Shortstop", "ショート"),
    "3B": named("Third baseman", "サード"),
    LF: named("Left fielder", "レフト"),
    CF: named("Centre fielder", "センター"),
    RF: named("Right fielder", "ライト"),
  },
});

const at = (id: string, x: number, y: number): FormationPosition => ({ id, x, y });

// Soccer, in the `opta` frame: x runs 0 to 100 from the team's own goal to the one it attacks, y runs 0 to 100 up the page, so the team's right flank is the low y.
const GK = at("GK", 5, 50);
const BACK4: FormationPosition[] = [at("RB", 24, 12), at("RCB", 21, 37), at("LCB", 21, 63), at("LB", 24, 88)];
const BACK3: FormationPosition[] = [at("RCB", 21, 27), at("CB", 19, 50), at("LCB", 21, 73)];
const BACK5: FormationPosition[] = [at("RWB", 32, 8), at("RCB", 22, 28), at("CB", 20, 50), at("LCB", 22, 72), at("LWB", 32, 92)];

const soccer = (id: string, en: string, ja: string, about: { en: string; ja: string }, positions: FormationPosition[]): Formation => ({ id, sport: "soccer", frame: "opta", name: { en, ja }, about, positions: [GK, ...positions] });

// Football, in the `nfl-tracking` frame: x in yards from the back of the left end zone, y in yards from the bottom of the field diagram. The ball is at midfield (x 60) and the offence goes right.
const LINE: FormationPosition[] = [at("C", 60, 26.67), at("LG", 60, 28), at("LT", 60, 29.3), at("RG", 60, 25.33), at("RT", 60, 24)];

/** The formations, by id. */
export const FORMATIONS: Readonly<Record<string, Formation>> = Object.freeze(
  Object.fromEntries(
    (
      [
        soccer("4-4-2", "4-4-2", "4-4-2", { en: "Four defenders, four midfielders in a flat line and two strikers.", ja: "ディフェンダー4人、横一列のミッドフィルダー4人、ストライカー2人。" }, [...BACK4, at("RM", 48, 12), at("RCM", 44, 38), at("LCM", 44, 62), at("LM", 48, 88), at("RS", 70, 38), at("LS", 70, 62)]),
        soccer("4-3-3", "4-3-3", "4-3-3", { en: "Four defenders, three midfielders and a front three of two wingers and a striker.", ja: "ディフェンダー4人、ミッドフィルダー3人、両ウイングとストライカーの3トップ。" }, [...BACK4, at("RCM", 46, 28), at("CM", 46, 50), at("LCM", 46, 72), at("RW", 72, 14), at("ST", 80, 50), at("LW", 72, 86)]),
        soccer("4-2-3-1", "4-2-3-1", "4-2-3-1", { en: "Four defenders, two holding midfielders, three behind a lone striker.", ja: "ディフェンダー4人、ボランチ2人、攻撃的な3人、1トップ。" }, [...BACK4, at("RDM", 40, 36), at("LDM", 40, 64), at("RW", 64, 14), at("CAM", 62, 50), at("LW", 64, 86), at("ST", 82, 50)]),
        soccer("4-1-4-1", "4-1-4-1", "4-1-4-1", { en: "Four defenders, one holding midfielder, a line of four midfielders and a lone striker.", ja: "ディフェンダー4人、アンカー1人、横一列のミッドフィルダー4人、1トップ。" }, [...BACK4, at("CDM", 36, 50), at("RM", 52, 12), at("RCM", 52, 38), at("LCM", 52, 62), at("LM", 52, 88), at("ST", 80, 50)]),
        soccer("3-5-2", "3-5-2", "3-5-2", { en: "Three centre-backs, wing-backs wide of three midfielders and two strikers.", ja: "センターバック3人、両ウイングバックと中央のミッドフィルダー3人、ストライカー2人。" }, [...BACK3, at("RWB", 46, 8), at("RCM", 46, 33), at("CM", 40, 50), at("LCM", 46, 67), at("LWB", 46, 92), at("RS", 72, 38), at("LS", 72, 62)]),
        soccer("3-4-3", "3-4-3", "3-4-3", { en: "Three centre-backs, four midfielders and a front three.", ja: "センターバック3人、ミッドフィルダー4人、3トップ。" }, [...BACK3, at("RM", 46, 12), at("RCM", 44, 38), at("LCM", 44, 62), at("LM", 46, 88), at("RW", 72, 18), at("ST", 78, 50), at("LW", 72, 82)]),
        soccer("5-3-2", "5-3-2", "5-3-2", { en: "Five at the back with wing-backs, three midfielders and two strikers.", ja: "ウイングバックを含む5バック、ミッドフィルダー3人、ストライカー2人。" }, [...BACK5, at("RCM", 48, 32), at("CM", 44, 50), at("LCM", 48, 68), at("RS", 74, 38), at("LS", 74, 62)]),
        soccer("5-4-1", "5-4-1", "5-4-1", { en: "Five at the back, a flat line of four midfielders and a lone striker: a deep, defensive shape.", ja: "5バック、横一列のミッドフィルダー4人、1トップ。引いて守る形です。" }, [...BACK5, at("RM", 52, 14), at("RCM", 48, 38), at("LCM", 48, 62), at("LM", 52, 86), at("ST", 78, 50)]),
        soccer("4-3-2-1", "4-3-2-1", "4-3-2-1", { en: "Four defenders, three midfielders and two attacking midfielders behind a lone striker (the \"Christmas tree\").", ja: "ディフェンダー4人、ミッドフィルダー3人、1トップの後ろに攻撃的ミッドフィルダー2人（クリスマスツリー型）。" }, [...BACK4, at("RCM", 46, 30), at("CM", 42, 50), at("LCM", 46, 70), at("RAM", 64, 35), at("LAM", 64, 65), at("ST", 80, 50)]),
        soccer("4-4-2-diamond", "4-4-2 diamond", "4-4-2（ダイヤモンド型）", { en: "Four defenders, a diamond of midfielders (holding, two central, attacking) and two strikers.", ja: "ディフェンダー4人、ひし形に並ぶミッドフィルダー4人（守備的、中央2人、攻撃的）、ストライカー2人。" }, [...BACK4, at("CDM", 34, 50), at("RCM", 48, 30), at("LCM", 48, 70), at("CAM", 62, 50), at("RS", 76, 40), at("LS", 76, 62)]),
        {
          id: "hockey-5v5",
          sport: "nhl",
          frame: "nhl-api",
          name: { en: "Hockey, five skaters and the goaltender", ja: "アイスホッケー（スケーター5人とゴーリー）" },
          about: { en: "The six players on the ice at even strength: the goaltender, two defencemen and a line of centre and two wings.", ja: "5対5でプレーするときの氷上の6人。ゴーリー、ディフェンス2人、センターと両ウイングのライン。" },
          positions: [at("G", -87, 0), at("LD", -60, 16), at("RD", -60, -16), at("LW", -30, 28), at("C", -30, 0), at("RW", -30, -28)],
        },
        {
          id: "hockey-1-3-1",
          sport: "nhl",
          frame: "nhl-api",
          name: { en: "Hockey, 1-3-1 power play", ja: "アイスホッケー（1-3-1のパワープレー）" },
          about: { en: "A power-play set in the attacking zone: one at the point, three across the middle and one low. Which player takes which place varies by team.", ja: "攻撃ゾーンでのパワープレーの形。ブルーライン付近に1人、中ほどに3人、ゴール近くに1人。どの選手がどこに立つかはチームによって異なります。" },
          positions: [at("G", -87, 0), at("RD", 30, 0), at("LW", 56, 26), at("LD", 50, 0), at("RW", 56, -26), at("C", 80, 0)],
        },
        {
          id: "basketball-5-out",
          sport: "nba",
          frame: "nba-stats",
          name: { en: "Basketball, five out", ja: "バスケットボール（ファイブアウト）" },
          about: { en: "All five on the three-point line: the point guard at the top, wings and both corners.", ja: "5人全員がスリーポイントライン付近に立つ形。トップにポイントガード、両ウイングと両コーナー。" },
          positions: [at("PG", 0, 262), at("SG", 173, 173), at("SF", -173, 173), at("PF", 222, 40), at("C", -222, 40)],
        },
        {
          id: "basketball-4-out-1-in",
          sport: "nba",
          frame: "nba-stats",
          name: { en: "Basketball, four out and one in", ja: "バスケットボール（フォーアウト・ワンイン）" },
          about: { en: "Four players on the three-point line and the centre on the block.", ja: "4人がスリーポイントライン付近、センターがブロック（ゴール近く）に立つ形。" },
          positions: [at("PG", 0, 262), at("SG", 173, 173), at("SF", -173, 173), at("PF", 222, 40), at("C", 60, 60)],
        },
        {
          id: "basketball-high-post",
          sport: "nba",
          frame: "nba-stats",
          name: { en: "Basketball, 1-4 high", ja: "バスケットボール（1-4ハイ）" },
          about: { en: "The point guard at the top, two forwards at the elbows of the free-throw line and a guard on each wing.", ja: "トップにポイントガード、フリースローラインの両端（エルボー）にフォワード2人、両ウイングにガード。" },
          positions: [at("PG", 0, 272), at("PF", -60, 190), at("C", 60, 190), at("SG", 190, 140), at("SF", -190, 140)],
        },
        {
          id: "football-i-formation",
          sport: "nfl",
          frame: "nfl-tracking",
          name: { en: "Football, I formation", ja: "アメリカンフットボール（Iフォーメーション）" },
          about: { en: "Offence: the quarterback under centre with the fullback and the halfback in a line behind him, a tight end and two wide receivers.", ja: "オフェンス。センターの真後ろにクォーターバック、その後ろにフルバックとハーフバックが縦一列、タイトエンド1人とワイドレシーバー2人。" },
          positions: [...LINE, at("QB", 58.8, 26.67), at("FB", 55, 26.67), at("HB", 52, 26.67), at("TE", 60, 22.4), at("WR1", 60, 50), at("WR2", 58.5, 4)],
        },
        {
          id: "football-shotgun",
          sport: "nfl",
          frame: "nfl-tracking",
          name: { en: "Football, shotgun", ja: "アメリカンフットボール（ショットガン）" },
          about: { en: "Offence: the quarterback a few yards behind the centre with a halfback beside him, a tight end and three wide receivers.", ja: "オフェンス。クォーターバックはセンターの数ヤード後ろに下がり、隣にハーフバック、タイトエンド1人とワイドレシーバー3人。" },
          positions: [...LINE, at("QB", 54, 26.67), at("HB", 54, 30), at("TE", 60, 22.4), at("WR1", 60, 50), at("WR2", 59, 5), at("WR3", 59, 41)],
        },
        {
          id: "football-4-3",
          sport: "nfl",
          frame: "nfl-tracking",
          name: { en: "Football, 4-3 defence", ja: "アメリカンフットボール（4-3ディフェンス）" },
          about: { en: "Defence against an offence going right: four linemen, three linebackers, two cornerbacks and two safeties. Left and right are the defenders' own.", ja: "右へ進むオフェンスに対するディフェンス。ディフェンスライン4人、ラインバッカー3人、コーナーバック2人、セーフティ2人。左右はディフェンス側から見たものです。" },
          positions: [at("LDE", 61, 20), at("LDT", 61, 25), at("RDT", 61, 28.4), at("RDE", 61, 33), at("LLB", 65, 17), at("MLB", 65, 26.67), at("RLB", 65, 36), at("LCB", 65, 5), at("RCB", 65, 48), at("FS", 72, 33), at("SS", 72, 20)],
        },
        {
          id: "football-3-4",
          sport: "nfl",
          frame: "nfl-tracking",
          name: { en: "Football, 3-4 defence", ja: "アメリカンフットボール（3-4ディフェンス）" },
          about: { en: "Defence against an offence going right: three linemen, four linebackers, two cornerbacks and two safeties. Left and right are the defenders' own.", ja: "右へ進むオフェンスに対するディフェンス。ディフェンスライン3人、ラインバッカー4人、コーナーバック2人、セーフティ2人。左右はディフェンス側から見たものです。" },
          positions: [at("LDE", 61, 21), at("NT", 61, 26.67), at("RDE", 61, 32), at("LOLB", 64.5, 15), at("LILB", 64.5, 23), at("RILB", 64.5, 30.5), at("ROLB", 64.5, 38), at("LCB", 65, 5), at("RCB", 65, 48), at("FS", 72, 33), at("SS", 72, 20)],
        },
        {
          id: "baseball-standard",
          sport: "mlb",
          frame: "retrosheet",
          name: { en: "Baseball, standard defence", ja: "野球（通常の守備位置）" },
          about: { en: "The nine fielders where they usually stand: a straight infield and the outfielders in their fields.", ja: "9人の野手の定位置。内野はシフトなしで、外野手はそれぞれ自分の守備範囲に立ちます。" },
          positions: [at("P", 0, 60.5), at("C", 0, -3), at("1B", 70, 78), at("2B", 36, 140), at("SS", -36, 140), at("3B", -70, 78), at("LF", -120, 260), at("CF", 0, 290), at("RF", 120, 260)],
        },
        {
          id: "baseball-shift",
          sport: "mlb",
          frame: "retrosheet",
          name: { en: "Baseball, infield shift against a left-handed pull hitter", ja: "野球（左打者の引っ張り対策の内野シフト）" },
          about: { en: "Three infielders on the right side of second base and the outfield turned the same way. Since 2023 MLB's Rule 5.02 requires two infielders on each side of second base, so this shift is not allowed there.", ja: "二塁ベースの一塁側に内野手3人が寄り、外野手も同じ方向に寄った守備。2023年から、MLBの規則5.02は二塁ベースの一塁側と三塁側に内野手を2人ずつ置くことを求めているため、MLBではこのシフトは認められません。" },
          positions: [at("P", 0, 60.5), at("C", 0, -3), at("1B", 82, 92), at("2B", 60, 175), at("SS", 24, 135), at("3B", -34, 138), at("LF", -70, 275), at("CF", 60, 295), at("RF", 135, 270)],
        },
      ] as Formation[]
    ).map((f) => [f.id, f]),
  ),
);

/** The ids of the formations, in the order of the table. */
export const FORMATION_IDS: readonly string[] = Object.freeze(Object.keys(FORMATIONS));

/** The formations of one sport. */
export const formationsOf = (sport: FormationSport): Formation[] => Object.values(FORMATIONS).filter((f) => f.sport === sport);

/** A formation by id, or an error that lists the ids. */
export function formationById(id: string): Formation {
  if (!Object.prototype.hasOwnProperty.call(FORMATIONS, id)) throw new RangeError(`Unknown formation "${id}": use one of ${FORMATION_IDS.join(", ")}`);
  return FORMATIONS[id];
}

/** The name of a position in a language: the sport's name for its id, or the id itself when the sport has none. */
export function positionName(sport: FormationSport, id: string, language: "en" | "ja"): string {
  const names = POSITION_NAMES[sport];
  return Object.prototype.hasOwnProperty.call(names, id) ? names[id][language] : id;
}
