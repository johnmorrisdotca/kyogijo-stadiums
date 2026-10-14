// The demo's teams are real countries, each drawn with its national flag through the flag plug-in (flags.js), and the demo's own logos, to show that a logo of your own works as well: a maple leaf with the
// word CANADA and a red sun disc with the word JAPAN, drawn here in code, and for every other country a roundel with its three letters. Only national flags and country names are used, never a
// federation's crest or logo.
import { NATIONS } from "./nations.js";

const disc = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#fff"/>${inner}</svg>`;
const word = (text, colour) => `<text x="50" y="86" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="13" letter-spacing="1" fill="${colour}">${text}</text>`;

// A maple leaf of eleven points, drawn from half of its outline and mirrored.
const LEAF_HALF = [[0, 14], [5, 26], [10, 23], [9, 36], [22, 28], [19, 39], [31, 35], [27, 44], [33, 53], [22, 52], [24, 58], [6, 55], [5, 70]];
const LEAF = [...LEAF_HALF, ...LEAF_HALF.slice(0, -1).reverse().map(([dx, y]) => [-dx, y])].map(([dx, y]) => `${50 + dx},${y}`).join(" ");

/** A roundel of a country's colour with its three letters: the logo of a country that has no drawing of its own here. */
const roundel = (abbr, colour) => disc(`<circle cx="50" cy="50" r="40" fill="${colour}"/><circle cx="50" cy="50" r="33" fill="none" stroke="#fff" stroke-width="2"/><text x="50" y="58" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="24" fill="#fff">${abbr}</text>`);

/** The demo's own logos, by country: the maple leaf and the sun disc, and a roundel for each of the others. */
export const EMBLEMS = Object.fromEntries(Object.entries(NATIONS).map(([key, n]) => [key, roundel(n.abbr, n.color)]));
EMBLEMS.canada = disc(`<polygon points="${LEAF}" fill="#d52b1e"/>${word("CANADA", "#d52b1e")}`);
EMBLEMS.japan = disc(`<circle cx="50" cy="42" r="22" fill="#bc002d"/>${word("JAPAN", "#bc002d")}`);

/** The made-up emblem of a made-up cup, drawn in code for a pageant's centre: a gold cup on a navy disc with a white ring. */
export const PAGEANT_EMBLEM = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#14233f"/><circle cx="50" cy="50" r="42" fill="none" stroke="#f4f0e4" stroke-width="2"/><path d="M33 26H67V42Q67 58 50 62Q33 58 33 42Z" fill="#f2c230"/><path d="M33 30H24Q24 46 36 50M67 30H76Q76 46 64 50" fill="none" stroke="#f2c230" stroke-width="4"/><path d="M46 62H54V72H62V78H38V72H46Z" fill="#f2c230"/></svg>`;

/** A game for each sport: [away, home], each a country: its name, short form and colour (from nations.js), its flag code and the key of its own logo. */
const team = (key) => ({ name: NATIONS[key].name, abbr: NATIONS[key].abbr, color: NATIONS[key].color, flag: NATIONS[key].flag, emblem: key });
export const TEAMS = {
  football: { away: team("mexico"), home: team("usa") },
  hockey: { away: team("usa"), home: team("canada") },
  basketball: { away: team("australia"), home: team("japan") },
  soccer: { away: team("brazil"), home: team("england") },
  curling: { away: team("japan"), home: team("canada") },
  net: { away: team("korea"), home: team("germany") },
  baseball: { away: team("japan"), home: team("usa") },
};

/** The same countries with Japanese names, for the page in Japanese. */
const ja = (key) => NATIONS[key].ja;
export const TEAMS_JA = {
  football: { away: ja("mexico"), home: ja("usa") },
  hockey: { away: ja("usa"), home: ja("canada") },
  basketball: { away: ja("australia"), home: ja("japan") },
  soccer: { away: ja("brazil"), home: ja("england") },
  baseball: { away: ja("japan"), home: ja("usa") },
  curling: { away: ja("japan"), home: ja("canada") },
  net: { away: ja("korea"), home: ja("germany") },
};

export const FAMILIES = { nfl: "football", cfl: "football", ifaf: "football", nhl: "hockey", nba: "basketball", mlb: "baseball", soccer: "soccer", curling: "curling", tennis: "net", volleyball: "net", badminton: "net", pickleball: "net", tabletennis: "net", padel: "net", squash: "net", racquetball: "net", sepaktakraw: "net", teqball: "net", roundnet: "net", netball: "net", athletics: "football", skating: "hockey", lacrosse: "football", rugby: "football", afl: "football", gaelic: "football", cricket: "football", fieldhockey: "football", handball: "football", swimming: "football", waterpolo: "football", diving: "football", artisticswimming: "football", judo: "football", karate: "football", kendo: "football", sumo: "football", kyudo: "football", dojo: "football" };

/** Typical scores and a competition line for each sport. */
export const GAMES = {
  nfl: { away: 27, home: 24, status: "final", competition: "Championship Game", date: "Jan 26" },
  cfl: { away: 31, home: 34, status: "final-ot", competition: "Cup Final", date: "Nov 23" },
  ifaf: { away: 14, home: 17, status: "final", competition: "World Championship", date: "Jul 12" },
  nhl: { away: 3, home: 2, status: "final-ot", competition: "Cup Final, Game 7", date: "Jun 24" },
  nba: { away: 108, home: 112, status: "final", competition: "Finals, Game 6", date: "Jun 19" },
  soccer: { away: 2, home: 2, status: "final-pens", competition: "Cup Final", date: "May 24", awayPens: 4, homePens: 2 },
  mlb: { away: 4, home: 6, status: "Bottom 9th", competition: "Division Series", date: "Oct 9" },
  curling: { away: 5, home: 4, status: "end-10", competition: "Final", date: "Mar 8", awayEnds: [0, 1, 0, 2, 0, 0, 1, 0, 1, "X"], homeEnds: [1, 0, 2, 0, 1, 0, 0, 1, 0], hammer: "home" },
  // The net sports: the score is the sets (or games) won, `sets` the score in each, the last the one in progress; in tennis the game's points and a tie-break.
  tennis: { away: 1, home: 1, status: "set-3", competition: "Final", date: "Jun 14", awaySets: [6, 6, 2], homeSets: [7, 3, 3], awayTiebreaks: [5, null, null], awayPoints: "40", homePoints: "30", serving: "away" },
  volleyball: { away: 2, home: 1, status: "set-4", competition: "Semifinal", date: "Aug 9", awaySets: [25, 22, 25, 18], homeSets: [21, 25, 20, 20], serving: "away" },
  badminton: { away: 1, home: 1, status: "game-3", competition: "Final", date: "Aug 4", awaySets: [21, 18, 11], homeSets: [17, 21, 9], serving: "away" },
  pickleball: { away: 1, home: 1, status: "game-3", competition: "Final", date: "Sep 7", awaySets: [11, 8, 5], homeSets: [7, 11, 4], serving: "away" },
  tabletennis: { away: 3, home: 2, status: "final", competition: "Final", date: "Jul 21", awaySets: [11, 9, 11, 7, 11], homeSets: [7, 11, 8, 11, 6] },
  padel: { away: 1, home: 1, status: "set-3", competition: "Final", date: "Jun 28", awaySets: [6, 4, 3], homeSets: [3, 6, 4], serving: "away" },
  squash: { away: 3, home: 2, status: "final", competition: "Final", date: "Apr 6", awaySets: [11, 9, 11, 7, 11], homeSets: [7, 11, 8, 11, 6] },
  racquetball: { away: 3, home: 1, status: "final", competition: "Final", date: "Nov 2", awaySets: [11, 8, 11, 11], homeSets: [7, 11, 9, 5] },
  sepaktakraw: { away: 2, home: 1, status: "final", competition: "Final", date: "Aug 24", awaySets: [21, 17, 15], homeSets: [18, 21, 12], serving: "away" },
  teqball: { away: 2, home: 1, status: "final", competition: "Final", date: "Sep 20", awaySets: [12, 9, 12], homeSets: [10, 12, 7], serving: "away" },
  roundnet: { away: 2, home: 1, status: "final", competition: "Final", date: "Jul 6", awaySets: [21, 18, 21], homeSets: [15, 21, 17], serving: "away" },
  netball: { away: 52, home: 49, status: "final", competition: "Final", date: "Aug 3" },
  // Athletics: a team match, scored in points.
  athletics: { away: 103, home: 96, status: "final", competition: "Team match", date: "Aug 2" },
  // Ice skating: a team meeting, scored in points.
  skating: { away: 41, home: 38, status: "final", competition: "Team pursuit final", date: "Feb 14" },
  // The field sports: a plain score, except Australian football's goals and behinds, Gaelic games' goals and points and cricket's wickets, overs and innings, which an edited score does not keep.
  lacrosse: { away: 11, home: 9, status: "final", competition: "Final", date: "Jun 1" },
  rugby: { away: 27, home: 24, status: "final", competition: "Final", date: "Oct 31" },
  afl: { away: 72, home: 68, status: "final", competition: "Grand Final", date: "Sep 27", awayExtra: { goals: 10, behinds: 12 }, homeExtra: { goals: 9, behinds: 14 } },
  gaelic: { away: 20, home: 18, status: "final", competition: "All-Ireland Final", date: "Jul 20", awayExtra: { goals: 2, points: 14 }, homeExtra: { goals: 1, points: 15 } },
  cricket: { away: 245, home: 187, status: "final", competition: "Final", date: "Nov 19", awayExtra: { wickets: 6, overs: "50", innings: [245] }, homeExtra: { wickets: 10, overs: "41.2", innings: [187] } },
  fieldhockey: { away: 3, home: 2, status: "final", competition: "Final", date: "Aug 8" },
  handball: { away: 28, home: 26, status: "final", competition: "Final", date: "Aug 10" },
  // The pools: a water polo match, and the points of a dual meet (swimming, diving and artistic swimming are scored by the points of the meet).
  swimming: { away: 146, home: 154, status: "final", competition: "Dual meet", date: "Feb 14" },
  waterpolo: { away: 9, home: 11, status: "final", competition: "Quarter-final", date: "Aug 9" },
  diving: { away: 146, home: 154, status: "final", competition: "Dual meet", date: "Feb 14" },
  artisticswimming: { away: 146, home: 154, status: "final", competition: "Team event", date: "Aug 7" },
  // The budo: what each side scored as its sport counts it (`budo`, on the team): judo's waza-ari and yuko, karate's points, kendo's points by the target struck, sumo's winning technique, kyudo's hits and a dojo's team match.
  judo: { away: 11, home: 10, status: "final", competition: "Final, 73 kg", date: "Aug 2", awayExtra: { budo: { wazaari: 1, yuko: 1, shido: 1 } }, homeExtra: { budo: { wazaari: 1, shido: 2 } } },
  karate: { away: 5, home: 3, status: "final", competition: "Kumite final", date: "Aug 7", awayExtra: { budo: { wazaari: 2, yuko: 1, senshu: true } }, homeExtra: { budo: { wazaari: 1, yuko: 1 } } },
  kendo: { away: 2, home: 1, status: "final", competition: "Final", date: "Nov 3", awayExtra: { budo: { techniques: ["men", "kote"] } }, homeExtra: { budo: { techniques: ["do"] } } },
  sumo: { away: 1, home: 0, status: "final", competition: "Day 15", date: "Sep 28", awayExtra: { budo: { kimarite: "yorikiri" } } },
  kyudo: { away: 17, home: 15, status: "final", competition: "Team final", date: "May 4" },
  dojo: { away: 3, home: 2, status: "final", competition: "Kohaku team match", date: "Jan 11" },
};
