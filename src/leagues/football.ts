// The football fields: the NFL's, the CFL's and the IFAF's, which the package started with, and each league or association that
// marks its field differently. A field's figures are kept in feet, as `FOOTBALL` has them; its size is written in yards.
import { FOOTBALL, inch, type FootballSpec } from "../geometry.ts";
import type { LeagueBase } from "./types.ts";

const yd = (n: number): number => n * 3;
/** Four inches: the width the rules give the field's lines, and so the boundary band. */
const FOUR_INCHES = inch(4);

/** The figures of a football field: a `FootballSpec`, every length in feet. */
export type FootballFigures = FootballSpec;

/** A league with a football field of its own. */
export type FootballLeague = LeagueBase<"football", FootballFigures>;

/** The football leagues: the NFL, the CFL and the IFAF first. */
export const FOOTBALL_LEAGUES: readonly FootballLeague[] = [
  { id: "nfl", family: "football", name: { en: "NFL football field", ja: "NFLのフィールド" }, unit: "yd", figuresUnit: "ft", dimensions: FOOTBALL.nfl, sources: ["nfl-rules"], builtIn: true },
  { id: "cfl", family: "football", name: { en: "CFL football field", ja: "CFLのフィールド" }, unit: "yd", figuresUnit: "ft", dimensions: FOOTBALL.cfl, sources: ["cfl-rules"], builtIn: true },
  { id: "ifaf", family: "football", name: { en: "IFAF football field", ja: "IFAFのフィールド" }, unit: "yd", figuresUnit: "ft", dimensions: FOOTBALL.ifaf, sources: ["ifaf-2021"], builtIn: true },
  {
    id: "ncaa",
    family: "football",
    name: { en: "NCAA football field", ja: "NCAAのフィールド" },
    unit: "yd",
    figuresUnit: "ft",
    // Rules 1-2 and 2-12 and Appendix D of the NCAA Football Rules and Interpretations: 100 yards between the goal lines, 10-yard end zones, 160 feet wide, the hash marks 60 feet from each sideline, the numbers' tops 9 yards from it, 6 feet high, the posts on the end line 18 feet 6 in apart.
    dimensions: { id: "nfl", name: "NCAA field", length: yd(100), endZone: yd(10), width: 160, hash: 60, boundary: FOUR_INCHES, numbers: [21, 27], posts: "end-line", centre: "50", yardLine: yd(5), postWidth: 18.5 },
    sources: ["ncaa-football"],
  },
  {
    id: "nfhs",
    family: "football",
    name: { en: "High school (NFHS) football field, 11 players", ja: "全米高校連盟（NFHS）の11人制フィールド" },
    unit: "yd",
    figuresUnit: "ft",
    // Rules 1-1-2, 1-2-3 and 1-2-5 of the NFHS Football Rules: 360 by 160 feet, the hash marks 53 feet 4 inches from each sideline (in thirds), the numbers' tops 9 yards from it, the posts 23 feet 4 inches apart.
    dimensions: { id: "nfl", name: "NFHS field", length: yd(100), endZone: yd(10), width: 160, hash: 53 + 4 / 12, boundary: FOUR_INCHES, numbers: [21, 27], posts: "end-line", centre: "50", yardLine: yd(5), postWidth: 23 + 4 / 12 },
    sources: ["nfhs-football", "nfhs-diagrams"],
  },
  {
    id: "nfhs-9",
    family: "football",
    name: { en: "High school (NFHS) football field, 9 players", ja: "全米高校連盟（NFHS）の9人制フィールド" },
    unit: "yd",
    figuresUnit: "ft",
    // The NFHS nine-player field diagram: 80 yards between the goal lines and 40 wide, hash marks 48 feet 4 inches from each sideline, the numbers' tops 7 yards from it.
    dimensions: { id: "nfl", name: "NFHS nine-player field", length: yd(80), endZone: yd(10), width: yd(40), hash: 48 + 4 / 12, boundary: FOUR_INCHES, numbers: [15, 21], posts: "end-line", centre: "40", yardLine: yd(5), postWidth: 23 + 4 / 12 },
    sources: ["nfhs-diagrams", "nfhs-football"],
  },
  {
    id: "nfhs-8",
    family: "football",
    name: { en: "High school (NFHS) football field, 8 players", ja: "全米高校連盟（NFHS）の8人制フィールド" },
    unit: "yd",
    figuresUnit: "ft",
    // The NFHS eight- and six-player field diagram: 80 yards between the goal lines and 40 wide, hash marks 45 feet from each sideline, the numbers' tops 7 yards from it.
    dimensions: { id: "nfl", name: "NFHS eight-player field", length: yd(80), endZone: yd(10), width: yd(40), hash: 45, boundary: FOUR_INCHES, numbers: [15, 21], posts: "end-line", centre: "40", yardLine: yd(5), postWidth: 23 + 4 / 12 },
    sources: ["nfhs-diagrams", "nfhs-football", "nsaa-eight"],
  },
  {
    id: "nfhs-6",
    family: "football",
    name: { en: "High school (NFHS) football field, 6 players", ja: "全米高校連盟（NFHS）の6人制フィールド" },
    unit: "yd",
    figuresUnit: "ft",
    // The same diagram as the eight-player field.
    dimensions: { id: "nfl", name: "NFHS six-player field", length: yd(80), endZone: yd(10), width: yd(40), hash: 45, boundary: FOUR_INCHES, numbers: [15, 21], posts: "end-line", centre: "40", yardLine: yd(5), postWidth: 23 + 4 / 12 },
    sources: ["nfhs-diagrams", "nfhs-football"],
  },
  {
    id: "uil-6",
    family: "football",
    name: { en: "Texas (UIL) six-man football field", ja: "テキサス州（UIL）の6人制フィールド" },
    unit: "yd",
    figuresUnit: "ft",
    // Exceptions to the NCAA rules in the UIL's six-player rules: 80 by 40 yards, the hash marks 40 feet from each sideline, goal posts 25 feet apart. The end zones, the numbers and the posts' place are the NCAA's.
    dimensions: { id: "nfl", name: "UIL six-man field", length: yd(80), endZone: yd(10), width: yd(40), hash: 40, boundary: FOUR_INCHES, numbers: [21, 27], posts: "end-line", centre: "40", yardLine: yd(5), postWidth: 25 },
    sources: ["uil-six", "ncaa-football"],
  },
  {
    id: "ifl",
    family: "football",
    name: { en: "Indoor Football League field", ja: "インドア・フットボール・リーグ（IFL）のフィールド" },
    unit: "yd",
    figuresUnit: "ft",
    // Rule 1 of the 2024 IFL Rule Book: 50 by 28 yards with 8-yard end zones inside padded walls, the wide set of hash marks 30 feet apart (so 27 feet from each wall), posts centred on the end line 10 feet apart; no yard numbers are named.
    dimensions: { id: "nfl", name: "IFL field", length: yd(50), endZone: yd(8), width: yd(28), hash: 27, boundary: FOUR_INCHES, numbers: [21, 27], noNumbers: true, pylons: false, posts: "end-line", centre: "25", yardLine: yd(5), postWidth: 10 },
    sources: ["ifl-2024"],
  },
];
