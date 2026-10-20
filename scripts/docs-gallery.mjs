// The gallery of the docs site: every surface, league variant, season, park and ground sample, layer kind, heat kind and chart the package
// draws, each drawn by the build from the code shown beside it, so that a picture cannot part from its code. A gallery item is a title and a
// snippet of code that ends by setting `svg`; the build runs the snippet (`runSnippet`) against the built package and puts what it made on the
// page. A test runs every snippet against the source and checks that what the page shows is what the snippet draws.
//
//   const pages = galleryPages(lib);   // lib: { "@johnmorrisdotca/kyogijo-stadiums": module, "@johnmorrisdotca/kyogijo-stadiums/charts": module, ... }
import { escapeHtml, slugOf } from "./docs-pages.mjs";

const MAIN = "@johnmorrisdotca/kyogijo-stadiums";

/** A value as the JavaScript that makes it: unquoted keys, short things on one line, the rest broken one to a line. */
export function literal(value, indent = 0) {
  const pad = " ".repeat(indent);
  const compact = (v) => {
    if (v === null || typeof v !== "object") return JSON.stringify(v);
    if (Array.isArray(v)) return `[${v.map(compact).join(", ")}]`;
    return `{ ${Object.entries(v).map(([k, x]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${compact(x)}`).join(", ")} }`;
  };
  const one = compact(value);
  if (value === null || typeof value !== "object" || pad.length + one.length <= 96) return one;
  const inner = " ".repeat(indent + 2);
  if (Array.isArray(value)) return `[\n${value.map((v) => `${inner}${literal(v, indent + 2)},`).join("\n")}\n${pad}]`;
  return `{\n${Object.entries(value).map(([k, x]) => `${inner}${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${literal(x, indent + 2)},`).join("\n")}\n${pad}}`;
}

/** A snippet that draws `options` with `drawKyogijo`. */
export const drawing = (options, fn = "drawKyogijo") => `import { ${fn} } from "${MAIN}";\n\nconst svg = ${fn}(${literal(options)});`;

/**
 * Run a gallery snippet: its `import { a, b } from "name"` lines are taken from `lib`, and the value of its `svg` is returned. The snippets are
 * plain JavaScript that TypeScript also reads, so that a reader may paste one into either.
 */
export function runSnippet(code, lib) {
  const names = [];
  const body = code.replace(/^import\s*\{([^}]*)\}\s*from\s*"([^"]+)";?\s*$/gm, (whole, list, from) => {
    if (!(from in lib)) throw new Error(`the snippet imports "${from}", which the gallery was not given`);
    names.push(`const {${list}} = __lib[${JSON.stringify(from)}];`);
    return "";
  });
  const run = new Function("__lib", `${names.join("\n")}\n${body}\nreturn svg;`);
  const svg = run(lib);
  if (typeof svg !== "string" || !svg.startsWith("<svg")) throw new Error("the snippet did not set `svg` to an SVG string");
  return svg;
}

// ---- The teams of the games, the same on every page: real countries, by name, three letters and colour (Canada, the USA and Japan first), and no flag: a snippet cannot await Hata's `flag()`. ----
// A team carries only a country's name and a colour, never a federation's crest or logo; the colours are the demo's (demo/nations.js).
const COUNTRIES = {
  canada: ["Canada", "CAN", "#d52b1e"], usa: ["USA", "USA", "#1c3f7a"], japan: ["Japan", "JPN", "#bc002d"], mexico: ["Mexico", "MEX", "#006847"], brazil: ["Brazil", "BRA", "#009739"],
  england: ["England", "ENG", "#c8102e"], australia: ["Australia", "AUS", "#00843d"], ireland: ["Ireland", "IRL", "#169b62"], germany: ["Germany", "GER", "#222222"], france: ["France", "FRA", "#0055a4"],
  italy: ["Italy", "ITA", "#0b5cab"], korea: ["Korea", "KOR", "#c60c30"], spain: ["Spain", "ESP", "#aa151b"], thailand: ["Thailand", "THA", "#2d2a4a"], malaysia: ["Malaysia", "MAS", "#010066"],
  hungary: ["Hungary", "HUN", "#436f4d"], mongolia: ["Mongolia", "MGL", "#c4272f"],
};
/** A team: a country by key, its score (or `undefined` where a sport has none) and what else the sport's board needs. */
const side = (key, score, extra = {}) => {
  const [name, abbr, color] = COUNTRIES[key];
  return { name, abbr, ...(score === undefined ? {} : { score }), color, ...extra };
};
const OWLS = side("usa", 3);
const ANCHORS = side("canada", 2);
const GULLS = side("mexico", 27);
const BISON = side("usa", 24);
const PEAKS = side("australia", 108);
const BOLTS = side("japan", 112);
const STARS = side("japan", 4);
const PINES = side("usa", 6);
const WOLVES = side("japan", 5, { ends: [0, 1, 0, 2, 0, 0, 1, 0, 1, "X"] });
const RIDGE = side("canada", 4, { hammer: true, ends: [1, 0, 2, 0, 1, 0, 0, 1, 0] });
// The net sports: the away side is serving, a set in progress is the last column; in tennis a set's games and the points of the game.
const GULLS_SETS = side("canada", 1, { sets: [6, 6, 2], tiebreaks: [5, null, null], points: "40", serving: true });
const BISON_SETS = side("japan", 1, { sets: [7, 3, 3], points: "30" });
const GULLS_VOLLEY = side("japan", 2, { sets: [25, 22, 25, 18], serving: true });
const BISON_VOLLEY = side("usa", 1, { sets: [21, 25, 20, 20] });
const GULLS_GAMES = side("japan", 1, { sets: [21, 18, 11], serving: true });
const BISON_GAMES = side("korea", 1, { sets: [17, 21, 9] });
const GULLS_PICKLE = side("usa", 1, { sets: [11, 8, 5], serving: true });
const BISON_PICKLE = side("canada", 1, { sets: [7, 11, 4] });
const GULLS_TABLE = side("japan", 3, { sets: [11, 9, 11, 7, 11] });
const BISON_TABLE = side("germany", 2, { sets: [7, 11, 8, 11, 6] });
const GULLS_BEST5 = side("usa", 3, { sets: [11, 8, 11, 11] });
const BISON_BEST5 = side("mexico", 1, { sets: [7, 11, 9, 5] });
const GULLS_SEPAK = side("thailand", 2, { sets: [21, 17, 15], serving: true });
const BISON_SEPAK = side("malaysia", 1, { sets: [18, 21, 12] });
const GULLS_TEQ = side("hungary", 2, { sets: [12, 9, 12], serving: true });
const BISON_TEQ = side("brazil", 1, { sets: [10, 12, 7] });
const GULLS_ROUND = side("usa", 2, { sets: [21, 18, 21], serving: true });
const BISON_ROUND = side("canada", 1, { sets: [15, 21, 17] });
const NETBALL_AWAY = side("australia", 52);
const NETBALL_HOME = side("england", 49);
// The field sports: rugby and lacrosse are plain scores; Australian football writes goals, behinds and the total; Gaelic games goals, points and the total; cricket runs for wickets, overs and the innings.
const RUGBY_AWAY = side("england", 27);
const RUGBY_HOME = side("france", 24);
const AFL_AWAY = side("australia", undefined, { goals: 10, behinds: 12 });
const AFL_HOME = side("ireland", undefined, { goals: 9, behinds: 14 });
const GAA_AWAY = side("ireland", undefined, { goals: 2, points: 14 });
const GAA_HOME = side("australia", undefined, { goals: 1, points: 15 });
const CRICKET_AWAY = side("australia", 245, { wickets: 6, overs: "50", innings: [245] });
const CRICKET_HOME = side("england", 187, { wickets: 10, overs: "41.2", innings: [187] });
// The pools: a dual meet's points, and a water polo match.
const POOL_AWAY = side("japan", 146);
const POOL_HOME = side("usa", 154);
const POLO_AWAY = side("italy", 9);
const POLO_HOME = side("spain", 11);
// The budō: a judo side's waza-ari, yuko and shido, a karate side's points and warnings, a kendo side's points by the target, and a sumo winner's kimarite.
const JUDO_AWAY = side("japan", undefined, { budo: { wazaari: 1, yuko: 2, shido: 1 } });
const JUDO_HOME = side("france", undefined, { budo: { wazaari: 1, shido: 2 } });
const KARATE_AWAY = side("japan", undefined, { budo: { ippon: 1, wazaari: 1, senshu: true, shido: 1 } });
const KARATE_HOME = side("italy", undefined, { budo: { wazaari: 2, yuko: 1 } });
const KENDO_AWAY = side("japan", undefined, { budo: { techniques: ["men", "kote"] } });
const KENDO_HOME = side("korea", undefined, { budo: { techniques: ["do"] } });
const SUMO_EAST = side("japan", 1, { budo: { kimarite: "yorikiri" } });
const SUMO_WEST = side("mongolia", 0);
const KYUDO_AWAY = side("japan", 14);
const KYUDO_HOME = side("usa", 12);
const SOCCER_AWAY = side("brazil", 2, { penalties: 4 });
const SOCCER_HOME = side("england", 2, { penalties: 2 });

const GAMES = {
  nfl: { away: GULLS, home: BISON, status: "final", competition: "Championship Game" },
  cfl: { away: side("canada", 27), home: side("usa", 24), status: "final", competition: "Grey Cup" },
  ifaf: { away: side("japan", 27), home: side("mexico", 24), status: "final", competition: "World Championship" },
  nhl: { away: OWLS, home: ANCHORS, status: "final-ot", competition: "Cup Final, Game 7" },
  nba: { away: PEAKS, home: BOLTS, status: "final", competition: "Finals, Game 6" },
  soccer: { away: SOCCER_AWAY, home: SOCCER_HOME, status: "final-pens", competition: "Cup Final" },
  mlb: { away: STARS, home: PINES, status: "Bottom 9th", competition: "Game 5", park: "fenway-park" },
  curling: { away: WOLVES, home: RIDGE, status: "end-10", competition: "Final" },
  tennis: { away: GULLS_SETS, home: BISON_SETS, status: "set-3", competition: "Final" },
  volleyball: { away: GULLS_VOLLEY, home: BISON_VOLLEY, status: "set-4", competition: "Semifinal" },
  badminton: { away: GULLS_GAMES, home: BISON_GAMES, status: "game-3", competition: "Final" },
  pickleball: { away: GULLS_PICKLE, home: BISON_PICKLE, status: "game-3", competition: "Final" },
  tabletennis: { away: GULLS_TABLE, home: BISON_TABLE, status: "final", competition: "Final" },
  padel: { away: GULLS_SETS, home: BISON_SETS, status: "set-3", competition: "Final" },
  squash: { away: GULLS_TABLE, home: BISON_TABLE, status: "final", competition: "Final" },
  racquetball: { away: GULLS_BEST5, home: BISON_BEST5, status: "final", competition: "Final" },
  sepaktakraw: { away: GULLS_SEPAK, home: BISON_SEPAK, status: "final", competition: "Final" },
  teqball: { away: GULLS_TEQ, home: BISON_TEQ, status: "final", competition: "Final" },
  roundnet: { away: GULLS_ROUND, home: BISON_ROUND, status: "final", competition: "Final" },
  netball: { away: NETBALL_AWAY, home: NETBALL_HOME, status: "final", competition: "Final" },
  athletics: { away: side("japan", 27), home: side("usa", 24), status: "final", competition: "Relay final" },
  skating: { away: side("canada", 27), home: side("japan", 24), status: "final", competition: "Team pursuit final" },
  judo: { away: JUDO_AWAY, home: JUDO_HOME, status: "final", competition: "Final, 73 kg" },
  karate: { away: KARATE_AWAY, home: KARATE_HOME, status: "final", competition: "Kumite final" },
  kendo: { away: KENDO_AWAY, home: KENDO_HOME, status: "final", competition: "Final" },
  sumo: { away: SUMO_EAST, home: SUMO_WEST, status: "final", competition: "Day 15" },
  kyudo: { away: KYUDO_AWAY, home: KYUDO_HOME, status: "final", competition: "Team final" },
  dojo: { away: side("japan", 27), home: side("canada", 24), status: "final", competition: "Open day" },
  lacrosse: { away: side("canada", 27), home: side("usa", 24), status: "final", competition: "Final" },
  rugby: { away: RUGBY_AWAY, home: RUGBY_HOME, status: "final", competition: "Final" },
  afl: { away: AFL_AWAY, home: AFL_HOME, status: "final", competition: "Grand Final" },
  gaelic: { away: GAA_AWAY, home: GAA_HOME, status: "final", competition: "All-Ireland Final" },
  cricket: { away: CRICKET_AWAY, home: CRICKET_HOME, status: "final", competition: "Final" },
  fieldhockey: { away: side("australia", 27), home: side("germany", 24), status: "final", competition: "Final" },
  handball: { away: side("france", 27), home: side("japan", 24), status: "final", competition: "Final" },
  swimming: { away: POOL_AWAY, home: POOL_HOME, status: "final", competition: "Dual meet" },
  waterpolo: { away: POLO_AWAY, home: POLO_HOME, status: "final", competition: "Quarter-final" },
  diving: { away: POOL_AWAY, home: POOL_HOME, status: "final", competition: "Dual meet" },
  artisticswimming: { away: POOL_AWAY, home: POOL_HOME, status: "final", competition: "Team event" },
};
const SPORT_TITLES = { nfl: "NFL field", cfl: "CFL field", ifaf: "IFAF field", nhl: "NHL rink", nba: "NBA court", soccer: "Soccer pitch", mlb: "Baseball field", curling: "Curling sheet", tennis: "Tennis court", volleyball: "Volleyball court", badminton: "Badminton court", pickleball: "Pickleball court", tabletennis: "Table tennis table", padel: "Padel court", squash: "Squash court", racquetball: "Racquetball court", sepaktakraw: "Sepak takraw court", teqball: "Teqball court", roundnet: "Roundnet court", netball: "Netball court", athletics: "Athletics stadium", skating: "Skating rink", lacrosse: "Lacrosse field", rugby: "Rugby field", afl: "Australian football ground", gaelic: "Gaelic games field", cricket: "Cricket ground", fieldhockey: "Field hockey pitch", handball: "Handball court", swimming: "Swimming pool", waterpolo: "Water polo field", diving: "Diving well", artisticswimming: "Artistic swimming area", judo: "Judo competition area", karate: "Karate competition area", kendo: "Kendo shiai-jo", sumo: "Sumo dohyō", kyudo: "Kyūdōjō", dojo: "Dojo" };

/** A repeatable list of points for the data snippets: no random numbers, so that the same code always draws the same marks. */
const SPOTS = "Array.from({ length: 36 }, (_, i) => ({ x: 20 + ((i * 53) % 160), y: 8 + ((i * 29) % 70), team: i % 2 ? \"away\" : \"home\", outcome: i % 5 === 0 ? \"goal\" : \"shot\", value: 0.05 + (i % 7) / 20 }))";
const CLUSTER = "Array.from({ length: 360 }, (_, i) => { const t = i * 2.399963; const r = 4 + 54 * Math.sqrt((i % 120) / 120); return { x: 189 - r * Math.abs(Math.cos(t)) * 1.1, y: 42.5 + r * Math.sin(t) * 0.7 }; })";

/** Two made-up teams of eleven on the `opta` frame's 0 to 100, the same on every picture; passes among eleven players; and movements for the flow fields and sonars. No random numbers. */
const SQUADS = "Array.from({ length: 22 }, (_, i) => ({ x: 8 + ((i * 37 + (i < 11 ? 3 : 17)) % 88), y: 8 + ((i * 53 + (i < 11 ? 5 : 11)) % 84), team: i < 11 ? \"home\" : \"away\", number: (i % 11) + 1 }))";
const PASSES = "Array.from({ length: 240 }, (_, i) => { const a = (i * 7) % 11; const b = (a + 1 + ((i * 3) % 4)) % 11; return { from: a + 1, to: b + 1, x: 14 + a * 6 + (i % 5), y: 12 + ((a * 17) % 76) + (i % 7), x2: 14 + b * 6, y2: 12 + ((b * 17) % 76), team: \"home\", fromNumber: a + 1, toNumber: b + 1 }; })";
const MOVES = "Array.from({ length: 400 }, (_, i) => { const x = 5 + ((i * 13) % 90); const y = 5 + ((i * 29) % 90); return { x, y, x2: x + 8 + (i % 5) + (x > 50 ? 4 : 0), y2: y + ((i % 7) - 3) * 2.2, id: (i % 5) + 1 }; })";

/** The marks of the round-mark snippets: our own maple leaf and sun disc, drawn in code, for Canada and Japan. */
const MARK_CODE = String.raw`// Our own marks, drawn here: a maple leaf for Canada and a sun disc for Japan (never a federation's crest or logo, and no flag: a snippet cannot await Hata's flag()).
const leaf = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#fff"/><polygon points="50,14 55,26 60,23 59,36 72,28 69,39 81,35 77,44 83,53 72,52 74,58 56,55 55,70 44,55 26,58 28,52 17,53 23,44 19,35 31,39 28,28 41,36 40,23 45,26 50,14" fill="#d52b1e"/></svg>';
const sun = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#fff"/><circle cx="50" cy="50" r="24" fill="#bc002d"/></svg>';
const canada = { name: "Canada", abbr: "CAN", score: 2, penalties: 4, color: "#d52b1e", logo: leaf };
const japan = { name: "Japan", abbr: "JPN", score: 2, penalties: 3, color: "#bc002d", logo: sun };`;

const item = (id, title, code, note = "", extra = {}) => ({ id, title, code, note, ...extra });
const section = (id, title, intro, items) => ({ id, title, intro, items });

// ---- The pages. Each is a list of sections, and each section a list of items. ----

function surfacesPage(lib) {
  const sports = ["nfl", "cfl", "ifaf", "nhl", "nba", "soccer", "mlb", "curling", "tennis", "volleyball", "badminton", "pickleball", "tabletennis", "padel", "squash", "racquetball", "sepaktakraw", "teqball", "roundnet", "netball", "athletics", "skating", "lacrosse", "rugby", "afl", "gaelic", "cricket", "fieldhockey", "handball", "swimming", "waterpolo", "diving", "artisticswimming", "judo", "karate", "kendo", "sumo", "kyudo", "dojo"];
  const themes = lib[MAIN].COURT_THEMES;
  return {
    slug: "gallery-surfaces",
    title: "Gallery: surfaces and scores",
    ja: "競技場と得点",
    intro: "The thirty-nine surfaces bare, with a game on each, wide and tall, as a strip and as a compact card, and the court's looks. Every picture is drawn by the build from the code under it.",
    sections: [
      section("bare", "Each surface, bare", "`drawKyogijo` with a `sport` and nothing else.", sports.map((sport) => item(`bare-${sport}`, SPORT_TITLES[sport], drawing({ sport })))),
      section("scores", "A game on each surface", "The teams on their sides and the score in the middle.", sports.map((sport) => item(`score-${sport}`, `${SPORT_TITLES[sport]}, with a score`, drawing({ sport, ...GAMES[sport] })))),
      section("tall", "Wide and tall", "`orientation: \"portrait\"` turns the surface a quarter and keeps every word upright.", [
        item("tall-nhl", "NHL rink, tall", drawing({ sport: "nhl", ...GAMES.nhl, orientation: "portrait" })),
        item("tall-nfl", "NFL field, tall", drawing({ sport: "nfl", ...GAMES.nfl, orientation: "portrait" })),
        item("tall-nba", "NBA court, tall", drawing({ sport: "nba", ...GAMES.nba, orientation: "portrait" })),
        item("tall-soccer", "Soccer pitch, tall", drawing({ sport: "soccer", ...GAMES.soccer, orientation: "portrait" })),
        item("tall-mlb", "Baseball field, tall", drawing({ sport: "mlb", ...GAMES.mlb, orientation: "portrait" }), "A ballpark is already upright, so the teams go in strips above and below it."),
        item("wide-curling", "Curling sheet, wide", drawing({ sport: "curling", ...GAMES.curling, orientation: "landscape" }), "A curling sheet lies tall unless it is asked to lie wide."),
      ]),
      section("strips", "A strip for a list, and a compact card", "`size: \"badge\"` is the strip alone; `size: \"compact\"` is the surface with that strip under it.", [
        item("badge-nhl", "Badge, hockey", drawing({ sport: "nhl", ...GAMES.nhl, size: "badge" })),
        item("badge-nba", "Badge, basketball", drawing({ sport: "nba", ...GAMES.nba, size: "badge" })),
        item("badge-nfl", "Badge, football", drawing({ sport: "nfl", ...GAMES.nfl, size: "badge" })),
        item("badge-mlb", "Badge, baseball", drawing({ sport: "mlb", ...GAMES.mlb, size: "badge" })),
        item("badge-curling", "Badge, curling", drawing({ sport: "curling", ...GAMES.curling, size: "badge" }), "The hammer is the small stone in the corner of the team that has it."),
        item("compact-nba", "Compact card, basketball", drawing({ sport: "nba", ...GAMES.nba, size: "compact" })),
        item("compact-nhl", "Compact card, hockey", drawing({ sport: "nhl", ...GAMES.nhl, size: "compact" })),
      ]),
      section("marks", "Round marks", "`mark: \"round\"` on a team, or `markShape: \"round\"` for both, clips a flag or a logo to a circle with a ring: on each side of the surface, in the badge and in the strip of a compact card. A team with no logo is its initials on its colour. The marks are a maple leaf and a sun disc drawn in the code.", [
        item("mark-pitch", "Round marks on a pitch, wide", `import { drawKyogijo } from "${MAIN}";\n\n${MARK_CODE}\nconst svg = drawKyogijo({ sport: "soccer", markShape: "round", away: canada, home: japan, status: "final-pens", competition: "Northern Cup final", orientation: "landscape" });`),
        item("mark-pitch-tall", "Round marks on a pitch, tall", `import { drawKyogijo } from "${MAIN}";\n\n${MARK_CODE}\nconst svg = drawKyogijo({ sport: "soccer", markShape: "round", away: canada, home: japan, status: "final-pens", competition: "Northern Cup final", orientation: "portrait" });`, "Each mark turns with its name where the name is turned."),
        item("mark-badge", "Round marks in a badge", `import { drawKyogijo } from "${MAIN}";\n\n${MARK_CODE}\nconst svg = drawKyogijo({ sport: "soccer", markShape: "round", away: canada, home: japan, status: "final-pens", size: "badge" });`),
        item("mark-compact", "Round marks in a compact card", `import { drawKyogijo } from "${MAIN}";\n\n${MARK_CODE}\nconst svg = drawKyogijo({ sport: "soccer", markShape: "round", away: canada, home: japan, status: "final-pens", size: "compact" });`),
        item("mark-initials", "No flag: the initials on the team's colour", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({\n  sport: "nhl",\n  markShape: "round",\n  away: { name: "USA", abbr: "USA", score: 3, color: "#1c3f7a" },\n  home: { name: "Canada", abbr: "CAN", score: 2, color: "#d52b1e" },\n  status: "final-ot",\n});`),
      ]),
      section("courts", "The court's looks", "Five looks to start from, in `COURT_THEMES`; each colour of a look is an option too.", Object.keys(themes).map((name) => item(`court-${name}`, `Court: ${name}`, `import { COURT_THEMES, drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "nba", court: COURT_THEMES.${name}, away: ${literal(PEAKS)}, home: ${literal(BOLTS)}, status: "final" });`))),
      section("hardwood", "A realistic basketball floor", "`court: { hardwood: true }` lays maple boards that run the length of the court, with staggered ends, grain and tone, stained paint and border, the baskets and their shadows from above, and a satin sheen. The clean floor stays the default.", [
        item("hardwood-bare", "Hardwood, bare", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "nba", court: { hardwood: true } });`, "The court's lines are the NBA's; the boards, the stain and the shadows are drawn from a seed, so the same call is always the same floor."),
        item("hardwood-team", "Hardwood in a club's colours", `import { drawKyogijo } from "${MAIN}";\n\nconst logo = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#10294f"/><circle cx="50" cy="50" r="38" fill="none" stroke="#f2f2f2" stroke-width="4"/><path d="M20 62Q35 30 50 50T80 38" fill="none" stroke="#f2c230" stroke-width="7" stroke-linecap="round"/></svg>';\nconst svg = drawKyogijo({\n  sport: "nba",\n  leftColor: "#1d4f91",\n  rightColor: "#8a2432",\n  court: {\n    hardwood: true,\n    apron: "#14171c",\n    border: "#13233f",\n    keyLeft: "#1d4f91",\n    keyRight: "#8a2432",\n    centreCircle: "#1d4f91",\n    centreLogo: logo,\n    baselineText: ["HARBOUR CITY", "PRAIRIE RIDGE"],\n    sidelineText: "KYOGIJO LEAGUE",\n  },\n});`, "The strip behind each baseline takes the colour of the team that defends it (`leftColor` and `rightColor`, or `baselineColor`); the paint is stain, so the boards show through it."),
        item("hardwood-dark", "Hardwood, dark", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "nba", theme: "dark", court: { hardwood: true, sidelineText: "KYOGIJO LEAGUE" } });`),
        item("hardwood-tall", "Hardwood, tall", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "nba", orientation: "portrait", court: { hardwood: true, baselineText: ["LAKEVIEW", "HARBOUR CITY"], sidelineText: "KYOGIJO LEAGUE" } });`, "The boards still run the length of the court; the baseline words read left to right and the sideline words run along their strips."),
        item("hardwood-fiba", "Hardwood, FIBA", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "nba", league: "fiba", court: { hardwood: { seed: 7 } } });`, "Every league of the sport takes it: the NBA, WNBA, FIBA, NCAA, NFHS and G League courts; another `seed` is another floor."),
        item("hardwood-wnba", "Hardwood, WNBA", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "nba", league: "wnba", court: { hardwood: { board: 3, stain: 0.6 }, key: "#4b2e83", keyLeft: "#4b2e83", keyRight: "#4b2e83", border: "#2b1a4d" } });`, "Boards 3 inches wide and a lighter stain."),
        item("hardwood-plain", "Hardwood, plain for a thumbnail", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "nba", width: 320, court: { hardwood: true } });`, "Under 480 pixels wide (or with `detail: \"simple\"`) the floor keeps its broad boards, its stain and its sheen and leaves out the seams, the grain and the soft shadows, so that a small drawing stays clean."),
        item("hardwood-shots", "Hardwood under a shot chart", `import { drawKyogijo } from "${MAIN}";\n\nconst shots = Array.from({ length: 48 }, (_, i) => ({ x: 6 + ((i * 17) % 84), y: 4 + ((i * 29) % 42), outcome: i % 3 === 0 ? "goal" : "shot" }));\nconst svg = drawKyogijo({ sport: "nba", court: { hardwood: true }, layers: [{ kind: "points", data: shots }] });`, "The data layers sit over the floor, shadows and sheen as they do over the clean one."),
        item("hardwood-score", "Hardwood with a score", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "nba", away: ${literal(PEAKS)}, home: ${literal(BOLTS)}, status: "final", court: { hardwood: true } });`),
      ]),
      section("crowd", "The stands and the crowd", "`crowd: true` draws the stands round a surface that has spectators and the people in them, in the home colours with the visitors at an end and the empty seats showing. The clean drawing stays the default.", [
        item("crowd-soccer", "Soccer in a bowl", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "soccer", leftColor: "#1d4f91", rightColor: "#b5452c", crowd: true });`, "A bowl of two tiers, the home fans in the home team's colour and the visitors in a block at one end, with a tunnel, benches and a camera platform on the bench side."),
        item("crowd-soccer-nfl", "Soccer in an NFL stadium", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "soccer", ground: "metlife-stadium", leftColor: "#1d4f91", rightColor: "#b5452c", crowd: true });`, "The stands keep the football field's footprint (drawn faintly over the pitch with its end zones and yard lines): the pitch is wider than the field, so its touchlines are 8.5 feet from the front rows."),
        item("crowd-mlb", "A ballpark", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "mlb", park: "fenway-park", leftColor: "#1d4f91", rightColor: "#b5452c", crowd: true });`, "Grandstands along the foul lines and behind home plate, bleachers behind the park's own fence with a gap at the batter's eye."),
        item("crowd-nhl", "An NHL arena", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "nhl", leftColor: "#1d4f91", rightColor: "#c2410c", crowd: true });`),
        item("crowd-nba", "An NBA arena", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "nba", leftColor: "#14233f", rightColor: "#c2410c", crowd: { density: 0.95 } });`, "Courtside rows, a lower bowl and an upper tier, 95 percent full."),
        item("crowd-curling", "A curling hall", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "curling", orientation: "landscape", crowd: true });`, "Two sides of seating along the sheet."),
        item("crowd-tifo", "A card display", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "soccer", leftColor: "#0f7a7a", rightColor: "#6b2d5c", crowd: { tifo: "both", tifoDesign: "checks", seed: 3 } });`, "Blocks of the lower stands behind each goal in checks of each team's colour."),
        item("crowd-half", "A half-empty horseshoe", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "rugby", crowd: { shape: "horseshoe", attendance: 18000, capacity: 45000 } });`, "Three sides, open at one end; the empty seats show."),
        item("crowd-tall", "A tall football field in the dark, with a score", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "nfl", orientation: "portrait", theme: "dark", crowd: true, away: ${literal(PEAKS)}, home: ${literal(BOLTS)}, status: "final" });`),
        item("crowd-thumb", "A thumbnail, as blocks", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "nhl", width: 300, crowd: true });`, "Under 480 pixels wide (or with `detail: \"simple\"`) the stands are blocks of colour: no pattern, no aisles, a few kB."),
      ]),
      section("looks", "Light, dark and detail", "`theme` picks the drawing's colours; `exactLines` draws the lines at their true widths; `detail: \"simple\"` leaves out the small markings.", [
        item("theme-light", "Rink, light", drawing({ sport: "nhl", theme: "light" })),
        item("theme-dark", "Rink, dark", drawing({ sport: "nhl", theme: "dark" })),
        item("exact-nfl", "Field, lines at their true widths", drawing({ sport: "nfl", exactLines: true })),
        item("simple-nfl", "Field, simple", drawing({ sport: "nfl", detail: "simple" })),
      ]),
    ],
  };
}

function soccerPage(lib) {
  const presets = Object.keys(lib[MAIN].SOCCER_PITCHES);
  return {
    slug: "gallery-soccer",
    title: "Gallery: the soccer pitch",
    ja: "サッカーのピッチ",
    intro: "A pitch of every preset size, the five ways to mow the grass, the four goal styles, one half, and a shoot-out in the score.",
    sections: [
      section("presets", "Pitches by size", "`pitch` takes a preset or a size of your own; every size and its rule is in the sources.", presets.map((name) => item(`pitch-${name}`, `Pitch: ${name}`, drawing({ sport: "soccer", pitch: name })))),
      section("patterns", "Mowing patterns", "`stripePattern`.", ["bands", "wide", "narrow", "lengthwise", "checks", "diagonal", "none"].map((name) => item(`pattern-${name}`, `Stripes: ${name}`, drawing({ sport: "soccer", stripePattern: name })))),
      section("goals", "Goals", "`goals`, and `cornerFlags` for the flags.", ["box", "line", "strip", "none"].map((name) => item(`goals-${name}`, `Goals: ${name}`, drawing({ sport: "soccer", goals: name })))),
      section("halves", "One half", "`half` draws one half of a bare pitch.", ["left", "right"].map((name) => item(`half-${name}`, `Half: ${name}`, drawing({ sport: "soccer", half: name })))),
      section("pens", "A shoot-out", "A team's `penalties` are written with the status.", [item("shootout", "Final, on penalties", drawing({ sport: "soccer", ...GAMES.soccer }))]),
    ],
  };
}

function leaguesPage(lib) {
  const leagues = lib[`${MAIN}/leagues`].LEAGUES;
  const families = [
    ["basketball", "Basketball courts", "nba"],
    ["hockey", "Ice hockey rinks", "nhl"],
    ["football", "Football fields", "nfl"],
    ["baseball", "Baseball and softball fields", "mlb"],
    ["curling", "Curling sheets", "curling"],
    ["volleyball", "Volleyball courts", "volleyball"],
    ["lacrosse", "Lacrosse fields and floors", "lacrosse"],
    ["rugby", "Rugby fields", "rugby"],
    ["gaelic", "Gaelic games", "gaelic"],
    ["cricket", "Cricket grounds", "cricket"],
  ];
  return {
    slug: "gallery-leagues",
    title: "Gallery: every league's surface",
    ja: "リーグごとの競技場",
    intro: "Each league that marks a surface its own way, drawn from its rulebook. The figures and the pages they were read from are in League variants.",
    sections: families.map(([family, title, sport]) =>
      section(
        family,
        title,
        `\`sport: "${sport}"\` with a \`league\`.`,
        leagues[sport].filter((league) => !league.builtIn).map((league) => item(`league-${sport}-${league.id}`, league.name.en, drawing({ sport, league: league.id }), `league: "${league.id}"`)),
      ),
    ),
  };
}

function yearsPage() {
  const years = [
    ["nhl", [1930, 1950, 2000, 2020], "The centre red line from 1943–44, the blue lines and the trapezoid as the rules moved them."],
    ["nba", [1950, 1970, 1990, 2020], "The lane widened in 1951–52 and 1964–65; the three-point line came in 1979–80."],
    ["nfl", [1925, 1940, 1960, 1975, 2020], "The hash marks moved in 1933, 1935, 1945 and 1972; the goal posts moved to the end line in 1974."],
    ["cfl", [1980, 2000, 2022], "The end zones were 25 yards deep until 1985."],
    ["mlb", [1860, 1890, 1920, 2020], "The pitcher's box, the plate's shape and place, the batter's boxes."],
  ];
  return {
    slug: "gallery-years",
    title: "Gallery: surfaces through the years",
    ja: "年ごとの競技場",
    intro: "`year` draws a surface as the rules marked it in a season. Each change is cited in the sources.",
    sections: years.map(([sport, list, intro]) => section(`years-${sport}`, SPORT_TITLES[sport], intro, list.map((year) => item(`year-${sport}-${year}`, `${SPORT_TITLES[sport]}, ${year}`, drawing({ sport, year }))))),
  };
}

function placesPage() {
  const parks = [
    ["fenway-park", "Fenway Park"],
    ["wrigley-field", "Wrigley Field"],
    ["oracle-park", "Oracle Park"],
    ["coors-field", "Coors Field"],
    ["yankee-stadium", "Yankee Stadium"],
    ["tokyo-dome", "Tokyo Dome"],
    ["hanshin-koshien-stadium", "Koshien Stadium"],
  ];
  const past = [
    ["polo-grounds", 1915, "Polo Grounds, 1915"],
    ["polo-grounds", 1930, "Polo Grounds, 1930"],
    ["ebbets-field", undefined, "Ebbets Field"],
    ["astrodome", undefined, "Astrodome"],
    ["candlestick-park", undefined, "Candlestick Park"],
    ["metropolitan-stadium", undefined, "Metropolitan Stadium"],
  ];
  const grounds = [
    ["maracana", "Maracanã Stadium"],
    ["wembley", "Wembley Stadium"],
    ["anfield", "Anfield"],
    ["estadio-azteca", "Estadio Azteca"],
    ["nissan-stadium-yokohama", "Nissan Stadium"],
    ["metlife-stadium", "MetLife Stadium"],
  ];
  const arenas = [
    ["nhl", "td-garden", undefined, "TD Garden, the rink"],
    ["nba", "td-garden", undefined, "TD Garden, the court"],
    ["nhl", "boston-garden", undefined, "Boston Garden: the rink 190.9 by 83 feet"],
    ["nhl", "matthews-arena", 1926, "The Boston Arena in 1926: the ice 220 by 90 feet"],
    ["nhl", "matthews-arena", 1972, "Matthews Arena in 1972: reduced to 200 by 80 feet"],
    ["nhl", "montreal-forum", undefined, "Montreal Forum"],
    ["nhl", "chicago-stadium", undefined, "Chicago Stadium: its short rink has no published size"],
    ["nba", "crypto-com-arena", 2005, "Staples Center in 2005"],
  ];
  return {
    slug: "gallery-places",
    title: "Gallery: ballparks, grounds and arenas",
    ja: "球場、スタジアム、アリーナ",
    intro: "A sample of the 94 ballparks, 64 grounds and 167 arenas, each from its own published figures, and the walls and quirks of eight of the parks. The atlas has every one on a map.",
    sections: [
      section("parks", "Ballparks of today", "`park` takes a key of `PARKS`.", parks.map(([id, title]) => item(`park-${id}`, title, drawing({ sport: "mlb", park: id })))),
      section("past", "Ballparks of the past", "A past park is drawn as it stood in a `year`, where its article dates earlier fences.", past.map(([id, year, title]) => item(`past-${id}${year === undefined ? "" : `-${year}`}`, title, drawing(year === undefined ? { sport: "mlb", park: id } : { sport: "mlb", park: id, year })))),
      section("grounds", "Soccer grounds", "`ground` draws the pitch at the size its article publishes, or at 105 by 68 metres where it gives none.", grounds.map(([id, title]) => item(`ground-${id}`, title, drawing({ sport: "soccer", ground: id })))),
      section("arenas", "Arenas", "`arena` draws the NHL's rink or the NBA's court at the size its article publishes, with the arena's name and the markings of the `year`; an arena with no published size has the league's.", arenas.map(([sport, id, year, title]) => item(`arena-${sport}-${id}${year === undefined ? "" : `-${year}`}`, title, drawing(year === undefined ? { sport, arena: id } : { sport, arena: id, year })))),
      section("walls", "Walls and quirks", "`walls` draws a band outside each stretch of the fence whose width and shade say how high it stands, from the height the park's article gives; `quirks` draws what the article describes with figures. Both follow `year`.", [
        item("walls-fenway", "Fenway Park: the Green Monster, with a key and names", drawing({ sport: "mlb", park: "fenway-park", walls: { legend: true, labels: true }, quirks: { labels: true } })),
        item("walls-oracle", "Oracle Park: five heights, up to the 24 foot right field wall", drawing({ sport: "mlb", park: "oracle-park", walls: { legend: true, labels: true } })),
        item("walls-wrigley", "Wrigley Field: the ivy, the basket and the two wells", drawing({ sport: "mlb", park: "wrigley-field", walls: { legend: true }, quirks: true })),
        item("walls-daikin-2010", "Daikin Park in 2010: Tal's Hill and the Crawford Boxes", drawing({ sport: "mlb", park: "daikin-park", year: 2010, walls: { labels: true }, quirks: { labels: true } })),
        item("walls-polo", "Polo Grounds: the overhang in left and the bullpens in the gaps", drawing({ sport: "mlb", park: "polo-grounds", quirks: { labels: true } })),
        item("walls-progressive", "Progressive Field: the Little Green Monster, the backstop and the dugouts", drawing({ sport: "mlb", park: "progressive-field", walls: { legend: true, labels: true }, quirks: { labels: true } })),
        item("walls-metrodome-1990", "Metrodome in 1990: the Plexiglas screen and the Baggie", drawing({ sport: "mlb", park: "metrodome", year: 1990, walls: { legend: true, labels: true } })),
        item("walls-tokyo-dome-ja", "Tokyo Dome, in metres and in Japanese", drawing({ sport: "mlb", park: "tokyo-dome", units: "m", language: "ja", walls: { legend: true, labels: true } })),
      ]),
      section("fence", "A fence of your own", "`fence` lays your distances over a park's or the generic field.", [item("fence-custom", "Short porch in left, deep centre", drawing({ sport: "mlb", fence: { left: 310, center: 420 } }))]),
    ],
  };
}

function specialPage(lib) {
  const { EVENTS, EVENT_IDS } = lib[`${MAIN}/events`];
  const teams = (sport) => (sport === "nba" ? [PEAKS, BOLTS, "Finals, Game 6"] : sport === "mlb" ? [STARS, PINES, "Game 5"] : [OWLS, ANCHORS, "Cup Final, Game 7"]);
  const game = (id) => {
    const [away, home] = teams(EVENTS[id].guest.sport);
    return `import { drawKyogijo } from "${MAIN}";\nimport { eventOptions } from "${MAIN}/events";\n\nconst svg = drawKyogijo({\n  ...eventOptions(${JSON.stringify(id)}),\n  away: ${literal(away)},\n  home: ${literal(home)},\n  status: "final",\n});`;
  };
  const where = (id) => (EVENTS[id].basis.kind === "published" ? "Its place is the sources'." : "Its place is a convention: no source gives it.");
  const group = (ids) => ids.map((id) => item(`event-${id}`, EVENTS[id].name.en, game(id), `${EVENTS[id].venue.en}. ${where(id)}`));
  const byHost = (test) => EVENT_IDS.filter((id) => test(EVENTS[id].host));
  return {
    slug: "gallery-special",
    title: "Gallery: special games",
    ja: "特設会場での試合",
    intro: "One surface set inside another, to scale: the host drawn as it is alone, the game's surface set inside it with its teams and score. Each game is a key of `EVENTS`, with its day, its venue and its sources.",
    sections: [
      section("ballparks", "A rink in a ballpark", "The NHL's rink over a ballpark's infield. A rink reaches over foul ground, which a ballpark's outline (the fair ground) does not hold, so each says how much of it lies beyond.", group(byHost((host) => host.park !== undefined))),
      section("stadiums", "A rink in a football stadium", "The rink at the middle of the field, its length along it. A football stadium's field is the CFL's or the NCAA's.", group(byHost((host) => host.field !== undefined))),
      section("others", "A court on a deck, baseball over a pitch", "The deck is a plain rectangle of the Nimitz class's length and beam; the London Series' field was laid over the stadium's running track and pitch, with the fence its article gives.", group(byHost((host) => host.deck !== undefined || host.pitch !== undefined))),
      section("own", "Your own host and place", "`host` and `placement` take any surface and any place: a court at midfield, a rink turned across a ballpark, with a data layer in the rink's own numbers.", [
        item("own-court", "A basketball court at midfield of an NFL field", drawing({ sport: "nba", host: { field: "nfl" } })),
        item("own-rink-turned", "A rink turned 30 degrees on the infield of Fenway Park", drawing({ sport: "nhl", host: { park: "fenway-park" }, placement: { x: 0, y: -63.64, angle: 30 } })),
        item("own-layer", "Shots in the rink's own numbers", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({\n  sport: "nhl",\n  host: { park: "wrigley-field" },\n  placement: { x: 0, y: -69.5, angle: 0 },\n  layers: [{ kind: "points", name: "shots", data: [{ x: 172, y: 30 }, { x: 160, y: 55 }, { x: 28, y: 42.5, outcome: "goal" }] }],\n});`, "A point is where the rink puts it, wherever the rink stands."),
      ]),
    ],
  };
}

function dataPage() {
  const points = [
    item("points-shapes", "Points: the seven shapes", `import { drawKyogijo } from "${MAIN}";\n\nconst shapes = ["circle", "square", "triangle", "diamond", "cross", "x", "star"];\nconst svg = drawKyogijo({\n  sport: "nhl",\n  layers: [{ kind: "points", name: "shapes", data: shapes.map((shape, i) => ({ x: 40 + i * 20, y: 42.5, shape, title: shape })), style: { size: 8 } }],\n});`),
    item("points-outcomes", "Points: outcomes, size and team", `import { drawKyogijo } from "${MAIN}";\n\nconst shots = ${SPOTS};\nconst svg = drawKyogijo({\n  sport: "nhl",\n  layers: [{ kind: "points", name: "shots", data: shots, style: { size: { range: [1.6, 4.6] }, outcomes: { shot: { hollow: true, shape: "x" } } } }],\n});`, "A miss is open, a goal a star, and the size follows each mark's `value`."),
    item("lines", "Lines: straight, curved and wavy", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({\n  sport: "nfl",\n  layers: [\n    { kind: "lines", name: "straight", data: [{ x: 40, y: 12, x2: 80, y2: 12 }], style: { width: 1.4 } },\n    { kind: "lines", name: "curved", data: [{ x: 40, y: 26, x2: 80, y2: 26, curve: 0.25 }], style: { width: 1.4 } },\n    { kind: "lines", name: "wavy", data: [{ x: 40, y: 40, x2: 80, y2: 40 }], style: { width: 1.4, wavy: true } },\n  ],\n});`),
    item("arrows", "Arrows: heads, dashes and a comet", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({\n  sport: "nfl",\n  layers: [\n    { kind: "arrows", name: "complete", data: [{ x: 40, y: 12, x2: 80, y2: 16, outcome: "complete" }], style: { width: 1.4 } },\n    { kind: "arrows", name: "incomplete", data: [{ x: 40, y: 26, x2: 80, y2: 30, outcome: "incomplete" }], style: { width: 1.4 } },\n    { kind: "arrows", name: "comet", data: [{ x: 40, y: 40, x2: 100, y2: 44 }], style: { width: 1.4, comet: { taper: true } } },\n  ],\n});`),
    item("text", "Text: words on the surface", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({\n  sport: "nba",\n  layers: [{ kind: "text", name: "notes", data: [{ x: 47, y: 25, text: "Centre" }, { x: 12, y: 25, text: "Key" }, { x: 82, y: 25, text: "Key" }], style: { size: 3 } }],\n});`),
  ];
  const heat = [
    item("heatmap", "Heat map", `import { drawKyogijo } from "${MAIN}";\n\nconst shots = ${CLUSTER};\nconst svg = drawKyogijo({\n  sport: "nhl",\n  layers: [{ kind: "heatmap", name: "shots", data: shots, bins: [50, 21], legend: { title: "Shots in each 4 by 4 feet" } }],\n});`, "A count in each cell of a grid, in a ramp, cut to the boards."),
    item("hexbin", "Hexagons", `import { drawKyogijo } from "${MAIN}";\n\nconst shots = ${CLUSTER};\nconst svg = drawKyogijo({ sport: "nhl", layers: [{ kind: "hexbin", name: "shots", data: shots, size: 5, legend: true }] });`),
    item("zones-nhl", "Zones: the slot", `import { drawKyogijo } from "${MAIN}";\n\nconst shots = ${CLUSTER};\nconst svg = drawKyogijo({ sport: "nhl", layers: [{ kind: "zones", name: "shots", zones: "nhl-slot", data: shots, labels: true, legend: true }] });`),
    item("zones-nba", "Zones: shot zones", `import { drawKyogijo } from "${MAIN}";\n\nconst shots = Array.from({ length: 160 }, (_, i) => ({ x: ((i * 97) % 480) - 240, y: (i * 61) % 300, outcome: i % 3 === 0 ? "made" : "missed" }));\nconst svg = drawKyogijo({\n  sport: "nba",\n  layers: [{ kind: "zones", name: "shots", zones: "nba-shot", from: "nba-stats", data: shots, statistic: "rate", labels: true, legend: true }],\n});`),
    item("zones-soccer", "Zones: positional play", `import { drawKyogijo } from "${MAIN}";\n\nconst touches = Array.from({ length: 220 }, (_, i) => ({ x: 6 + ((i * 41) % 93), y: 4 + ((i * 29) % 92) }));\nconst svg = drawKyogijo({ sport: "soccer", layers: [{ kind: "zones", name: "touches", zones: "soccer-positional", from: "opta", data: touches, statistic: "percent", legend: true }] });`),
    item("zones-football", "Zones: passes", `import { drawKyogijo } from "${MAIN}";\n\nconst passes = Array.from({ length: 90 }, (_, i) => ({ x: 62 + ((i * 17) % 45), y: 6 + ((i * 23) % 42) }));\nconst svg = drawKyogijo({ sport: "nfl", layers: [{ kind: "zones", name: "passes", zones: "football-pass", from: "nfl-tracking", los: 62, data: passes, labels: true, legend: true }] });`),
    item("contour", "Contours: a density", `import { drawKyogijo } from "${MAIN}";\n\nconst shots = ${CLUSTER};\nconst svg = drawKyogijo({ sport: "nhl", layers: [{ kind: "contour", name: "shots", data: shots, levels: 6, filled: true, legend: true }] });`),
    item("legend", "A legend of its own", `import { drawKyogijo } from "${MAIN}";\n\nconst shots = ${CLUSTER};\nconst svg = drawKyogijo({\n  sport: "nhl",\n  layers: [\n    { kind: "heatmap", id: "heat", name: "shots", data: shots, bins: [40, 17] },\n    { kind: "legend", for: "heat", title: "Shots", position: "bottom" },\n  ],\n});`),
  ];
  const charts = [
    item("chart-nba", "NBA shot chart", `import { nbaShotChart } from "${MAIN}/charts";\n\nconst shots = Array.from({ length: 140 }, (_, i) => ({ x: ((i * 97) % 480) - 240, y: (i * 61) % 300, made: i % 3 === 0 }));\nconst svg = nbaShotChart(shots, { league: 46, minShots: 2 }).draw();`),
    item("chart-nhl", "NHL shot map", `import { nhlShotMap } from "${MAIN}/charts";\n\nconst shots = Array.from({ length: 40 }, (_, i) => ({ x: (i % 2 ? -1 : 1) * (50 + ((i * 11) % 38)), y: ((i * 23) % 60) - 30, outcome: ["goal", "saved", "missed", "blocked"][i % 4], xg: 0.03 + (i % 9) / 30, team: i % 2 ? "away" : "home" }));\nconst svg = nhlShotMap(shots, { fold: true, zones: true, statistic: "xg" }).draw();`),
    item("chart-mlb", "MLB spray chart", `import { mlbSprayChart } from "${MAIN}/charts";\n\nconst types = ["single", "field_out", "double", "field_out", "home_run", "triple"];\nconst balls = Array.from({ length: 60 }, (_, i) => ({ x: 125.4 + (((i * 37) % 120) - 60), y: 198.27 - (30 + ((i * 53) % 110)), type: types[i % types.length] }));\nconst svg = mlbSprayChart(balls, { park: "fenway-park", zones: true }).draw();`),
    item("chart-nfl", "NFL pass chart", `import { nflPassChart } from "${MAIN}/charts";\n\nconst outcomes = ["complete", "complete", "incomplete", "touchdown", "interception"];\nconst passes = Array.from({ length: 40 }, (_, i) => ({ x: 66 + ((i * 13) % 44), y: 8 + ((i * 17) % 40), outcome: outcomes[i % outcomes.length], fromX: 60, fromY: 26 }));\nconst svg = nflPassChart(passes, { los: 62, arrows: true }).draw();`),
    item("chart-soccer", "Soccer shot map", `import { soccerShotMap } from "${MAIN}/charts";\n\nconst outcomes = ["goal", "saved", "missed", "blocked"];\nconst shots = Array.from({ length: 24 }, (_, i) => ({ x: 84 + ((i * 7) % 30), y: 18 + ((i * 11) % 44), outcome: outcomes[i % 4], xg: 0.04 + (i % 8) / 20 }));\nconst svg = soccerShotMap(shots, { provider: "statsbomb", half: true }).draw();`),
  ];
  const replay = [
    item("replay-rink", "A frame of a replay: the rink", `import { drawFrame } from "${MAIN}/replay";\n\nconst skater = (id, team, number, x, y, t) => ({ id, team, number, x: x + 6 * Math.sin(t / 1.4 + number), y: y + 4 * Math.cos(t / 1.1 + number) });\nconst frames = Array.from({ length: 51 }, (_, i) => {\n  const t = i / 5;\n  const objects = [skater("h9", "home", 9, 30, 0, t), skater("h17", "home", 17, 48, 18, t), skater("h28", "home", 28, 48, -18, t), skater("a4", "away", 4, 62, 8, t), skater("a8", "away", 8, 62, -8, t), skater("a31", "away", 31, 89, 0, 0)];\n  const puck = objects[Math.min(2, Math.floor(t / 3.5))];\n  return { t, objects: [...objects, { id: "puck", team: "puck", x: puck.x, y: puck.y }] };\n});\nconst events = [\n  { t: 3.5, kind: "pass", team: "home", by: "h9", to: "h17", until: 4 },\n  { t: 7, kind: "shot", team: "home", by: "h28", x2: 89, y2: 2, until: 7.6 },\n];\nconst svg = drawFrame({ sport: "nhl" }, { from: "nhl-api", frames, events }, 7.8);`, "Tracking data in the NHL API's frame, played on the rink: the players with their numbers, the puck with its trail, and the events that are on the surface at 7.8 seconds (the pass has gone, the shot is on its way). Played, with controls, it is mountKyogijo(...).replay(...)."),
    item("replay-pitch", "A frame of a replay: the pitch", `import { drawFrame } from "${MAIN}/replay";\n\nconst spot = (id, team, number, x, y, t) => ({ id, team, number, x: x + 4 * Math.sin(t / 1.7 + number), y: y + 5 * Math.cos(t / 1.3 + number) });\nconst frames = Array.from({ length: 41 }, (_, i) => {\n  const t = i / 5;\n  const objects = [spot("h1", "home", 1, 4, 50, t), spot("h4", "home", 4, 30, 35, t), spot("h8", "home", 8, 50, 55, t), spot("h9", "home", 9, 72, 45, t), spot("a5", "away", 5, 66, 60, t), spot("a1", "away", 1, 96, 50, 0)];\n  const ball = objects[Math.min(3, Math.floor(t / 2))];\n  return { t, possession: ball.id, objects: [...objects, { id: "ball", team: "ball", x: ball.x, y: ball.y }] };\n});\nconst events = [{ t: 2, kind: "pass", team: "home", by: "h4", to: "h8", until: 2.4 }, { t: 6, kind: "goal", team: "home", x: 100, y: 48 }];\nconst svg = drawFrame({ sport: "soccer" }, { from: "opta", frames, events }, 6.4, { trail: 3 });`, "The same on the pitch, in Opta's frame, with a trail of three seconds and the goal marked by a star."),
  ];
  const team = [
    item("team-network", "Pass network", `import { drawKyogijo } from "${MAIN}";\n\nconst passes = ${PASSES};\nconst svg = drawKyogijo({ sport: "soccer", layers: [{ kind: "network", from: "opta", data: passes, minPasses: 3 }] });`, "A node at the average place of each player's passes, sized by his touches; a link for each pair, wider the more passes between them."),
    item("team-network-directed", "Pass network, directed", `import { drawKyogijo } from "${MAIN}";\n\nconst passes = ${PASSES};\nconst svg = drawKyogijo({ sport: "soccer", layers: [{ kind: "network", from: "opta", data: passes, minPasses: 6, directed: true, labels: "id" }] });`),
    item("team-network-chart", "Pass network chart", `import { passNetwork } from "${MAIN}/charts";\n\nconst passes = ${PASSES};\nconst svg = passNetwork(passes, { provider: "opta", minPasses: 4 }).draw();`, "With the key and the totals; `table()` lists the players and the links."),
    item("team-formation-soccer", "Formations: 4-4-2 against 4-3-3", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({\n  sport: "soccer",\n  layers: [\n    { kind: "formation", formation: "4-4-2", team: "home" },\n    { kind: "formation", formation: "4-3-3", team: "away", attacking: "left" },\n  ],\n});`),
    item("team-formation-lineup", "A formation with its lineup", `import { drawKyogijo } from "${MAIN}";\n\nconst lineup = [["GK", 1, "Okafor"], ["RB", 2, "Haas"], ["LB", 3, "Ito"], ["ST", 9, "Silva"]].map(([position, number, name]) => ({ position, number, name }));\nconst svg = drawKyogijo({ sport: "soccer", layers: [{ kind: "formation", formation: "4-2-3-1", team: "home", data: lineup, names: true }] });`, "A position nobody stands on is hollow."),
    item("team-formation-hockey", "Formations: a rink", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({\n  sport: "nhl",\n  layers: [\n    { kind: "formation", formation: "hockey-5v5", team: "home" },\n    { kind: "formation", formation: "hockey-1-3-1", team: "away", attacking: "left" },\n  ],\n});`),
    item("team-formation-basketball", "Formations: a court", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "nba", layers: [{ kind: "formation", formation: "basketball-high-post", team: "home" }] });`),
    item("team-formation-football", "Formations: offence and defence", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({\n  sport: "nfl",\n  layers: [\n    { kind: "formation", formation: "football-shotgun", team: "home", los: 40 },\n    { kind: "formation", formation: "football-4-3", team: "away", los: 40 },\n  ],\n});`, "The ball is on the 30-yard line (40 yards from the back of the left end zone)."),
    item("team-formation-baseball", "Formations: a ballpark and a shift", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "mlb", layers: [{ kind: "formation", formation: "baseball-shift", team: "away" }] });`, "An infield shift against a left-handed pull hitter. Not allowed in MLB since 2023."),
    item("team-lineup-soccer", "Lineups: 4-2-3-1 against 4-4-2", `import { drawKyogijo } from "${MAIN}";\n\nconst home = ["Okafor", "Silva", "Mbeki", "Rossi", "Ito", "Nakamura", "Costa", "Dubois", "Haddad", "Kowalski", "Eze"];\nconst codes = ["GK", "RB", "CB", "CB", "LB", "DM", "DM", "RW", "AM", "LW", "ST"];\nconst players = home.map((name, i) => ({ pos: codes[i], name, number: i + 1, captain: i === 2 }));\nconst svg = drawKyogijo({\n  sport: "soccer",\n  layers: [\n    { kind: "lineup", side: "home", players },\n    { kind: "lineup", side: "away", formation: "4-4-2", shape: "jersey", players: [{ pos: "GK", name: "Meyer", number: 1 }, { pos: "ST", name: "Moreau", number: 9 }, { pos: "ST", name: "Eze", number: 10 }] },\n  ],\n});`, "The home team has no formation: the best fit is chosen. The visitors attack the other way."),
    item("team-lineup-hockey", "Lineups: a rink with a second line", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({\n  sport: "nhl",\n  layers: [\n    {\n      kind: "lineup",\n      side: "home",\n      players: [\n        { pos: "G", name: "Hellebuyck", number: 37 }, { pos: "D", name: "Josi", number: 59, captain: true }, { pos: "D", name: "Makar", number: 8 },\n        { pos: "LW", name: "Marner", number: 16 }, { pos: "C", name: "McDavid", number: 97 }, { pos: "RW", name: "Rantanen", number: 96 },\n        { pos: "LW", name: "Hyman", number: 18, line: 2 }, { pos: "C", name: "Draisaitl", number: 29, line: 2 }, { pos: "RW", name: "Kane", number: 93, line: 2 },\n      ],\n    },\n  ],\n});`),
    item("team-lineup-baseball", "Lineups: a ballpark with the designated hitter", `import { drawKyogijo } from "${MAIN}";\n\nconst codes = ["P", "C", "1B", "2B", "SS", "3B", "LF", "CF", "RF", "DH"];\nconst names = ["Cole", "Rutschman", "Alonso", "Albies", "Witt", "Ramirez", "Soto", "Trout", "Judge", "Ohtani"];\nconst players = codes.map((pos, i) => ({ pos, name: names[i], number: i + 1 }));\nconst svg = drawKyogijo({ sport: "mlb", layers: [{ kind: "lineup", shape: "jersey", players }] });`),
    item("team-lineup-rugby", "Lineups: two rugby teams", `import { drawKyogijo } from "${MAIN}";\n\nconst fifteen = () => Array.from({ length: 15 }, (_, i) => ({ pos: String(i + 1), number: i + 1, name: "Player " + (i + 1) }));\nconst svg = drawKyogijo({ sport: "rugby", layers: [{ kind: "lineup", side: "home", shape: "jersey", players: fifteen() }, { kind: "lineup", side: "away", shape: "jersey", players: fifteen() }] });`),
    item("team-lineup-football", "Lineups: an offence and a defence", `import { drawKyogijo } from "${MAIN}";\n\nconst offence = ["QB", "HB", "FB", "TE", "WR", "WR", "C", "LG", "RG", "LT", "RT"];\nconst defence = ["DE", "DT", "DT", "DE", "LB", "LB", "LB", "CB", "CB", "S", "S"];\nconst of = (codes) => codes.map((pos, i) => ({ pos, number: i + 1 }));\nconst svg = drawKyogijo({\n  sport: "nfl",\n  range: "between-the-20s",\n  layers: [{ kind: "lineup", side: "home", players: of(offence) }, { kind: "lineup", side: "away", players: of(defence) }],\n});`, "A football line stands shoulder to shoulder, so the picture is zoomed to the middle of the field."),
    item("team-lineup-cricket", "Lineups: a fielding preset", `import { drawKyogijo } from "${MAIN}";\n\nconst codes = ["BWL", "WK", "SL1", "SL2", "SL3", "GU", "PT", "CV", "MO", "MN", "SQ"];\nconst svg = drawKyogijo({ sport: "cricket", layers: [{ kind: "lineup", formation: "cricket-test-attacking", players: codes.map((pos, i) => ({ pos, number: i + 1 })) }] });`, "For a right-handed batter with the striker at the right end: the off side is up the page."),
    item("team-lineup-volleyball", "Lineups: a volleyball rotation", `import { drawKyogijo } from "${MAIN}";\n\nconst six = ["P1", "P2", "P3", "P4", "P5", "P6"].map((pos, i) => ({ pos, number: i + 1 }));\nconst svg = drawKyogijo({ sport: "volleyball", layers: [{ kind: "lineup", side: "home", rotation: 2, players: six }, { kind: "lineup", side: "away", players: six }] });`, "The home team is on its second rotation: each player has moved one place clockwise."),
    item("team-voronoi", "Voronoi: space control", `import { drawKyogijo } from "${MAIN}";\n\nconst players = ${SQUADS};\nconst svg = drawKyogijo({ sport: "soccer", layers: [{ kind: "voronoi", from: "opta", data: players }] });`, "Each player's cell is the part of the pitch nearer him than any other player; the description gives each team's share."),
    item("team-delaunay", "Delaunay triangles", `import { drawKyogijo } from "${MAIN}";\n\nconst players = ${SQUADS};\nconst svg = drawKyogijo({ sport: "soccer", layers: [{ kind: "delaunay", from: "opta", data: players, triangles: true }] });`),
    item("team-hull", "Convex hulls", `import { drawKyogijo } from "${MAIN}";\n\nconst players = ${SQUADS};\nconst svg = drawKyogijo({ sport: "soccer", layers: [{ kind: "hull", from: "opta", data: players }] });`),
    item("team-shape-dark", "Space and shape, tall and dark", `import { drawKyogijo } from "${MAIN}";\n\nconst players = ${SQUADS};\nconst svg = drawKyogijo({\n  sport: "soccer",\n  orientation: "portrait",\n  theme: "dark",\n  layers: [{ kind: "voronoi", from: "opta", data: players }, { kind: "hull", from: "opta", data: players }],\n});`),
    item("team-flow", "Flow field", `import { drawKyogijo } from "${MAIN}";\n\nconst moves = ${MOVES};\nconst svg = drawKyogijo({ sport: "soccer", layers: [{ kind: "flow", from: "opta", data: moves, bins: 12 }] });`, "The mean direction of the passes that start in each cell."),
    item("team-sonar-player", "Sonars: a rose for each player", `import { drawKyogijo } from "${MAIN}";\n\nconst moves = ${MOVES};\nconst svg = drawKyogijo({ sport: "soccer", layers: [{ kind: "sonar", from: "opta", data: moves, by: "player", angles: 10 }] });`),
    item("team-sonar-grid", "Sonars: a rose for each cell of a rink", `import { drawKyogijo } from "${MAIN}";\n\nconst moves = ${MOVES}.map((m) => ({ x: m.x * 2 - 100, y: m.y * 0.85 - 42.5, x2: m.x2 * 2 - 100, y2: m.y2 * 0.85 - 42.5 }));\nconst svg = drawKyogijo({ sport: "nhl", layers: [{ kind: "sonar", from: "nhl-api", data: moves, by: "grid", bins: 8, angles: 8 }] });`),
    item("team-sonar-zones", "Sonars: a rose for each zone", `import { drawKyogijo } from "${MAIN}";\n\nconst moves = ${MOVES};\nconst svg = drawKyogijo({ sport: "soccer", layers: [{ kind: "sonar", from: "opta", data: moves, by: "zone", zones: "soccer-thirds", angles: 8, statistic: "mean" }] });`, "The bars are the mean length of the passes in each direction."),
  ];
  const targets = [
    item("target-goal-nhl", "A hockey net with its zones", `import { drawGoalMouth } from "${MAIN}/target";\n\nconst shots = [\n  { x: -2.4, z: 3.6, outcome: "goal" },\n  { x: 0, z: 0.4, outcome: "saved" },\n  { x: 1.5, z: 1.2, outcome: "goal" },\n  { x: -3, z: 2.5, outcome: "post" },\n  { x: 1, z: 4, outcome: "crossbar" },\n  { x: 3.4, z: 2, outcome: "wide" },\n  { x: 1.2, z: 4.6, outcome: "high" },\n];\nconst svg = drawGoalMouth(shots, { sport: "nhl", zones: "labels" }).svg;`, "The net is the NHL's 6 by 4 feet, seen from the front with the shooter's left on the left. A post and a crossbar are on the frame, a shot wide or high is outside it; the top shelf and the five-hole are hockey's names for the middle cells of the top and bottom rows."),
    item("target-goal-soccer", "A soccer goal, dark", `import { drawGoalMouth } from "${MAIN}/target";\n\nconst shots = [\n  { x: -3.3, z: 2.2, outcome: "goal", value: 0.4 },\n  { x: 1, z: 0.5, outcome: "saved", value: 0.1 },\n  { x: 3.66, z: 1.2, outcome: "post", value: 0.05 },\n  { x: 4.4, z: 1, outcome: "wide", value: 0.03 },\n  { x: 0, z: 2.9, outcome: "high", value: 0.02 },\n];\nconst svg = drawGoalMouth(shots, { sport: "soccer", theme: "dark", zones: true, sizeBy: "value" }).svg;`, "The Laws' 7.32 by 2.44 metres; the marks are sized by expected goals."),
    item("target-goal-lacrosse", "A lacrosse goal: 6 by 6 feet", `import { drawGoalMouth } from "${MAIN}/target";\n\nconst shots = [{ x: -2, z: 5, outcome: "goal" }, { x: 2.5, z: 1, outcome: "saved" }, { x: 3.4, z: 3, outcome: "wide" }];\nconst svg = drawGoalMouth(shots, { sport: "lacrosse", zones: true }).svg;`, "World Lacrosse's 1.83 m and the NCAA's and the PLL's 6 feet are the same goal; the box floor's (`league: \"nll\"`) is 4 feet 9 inches by 4."),
    item("target-goal-waterpolo", "A water polo goal", `import { drawGoalMouth } from "${MAIN}/target";\n\nconst svg = drawGoalMouth([{ x: -1.2, z: 0.7, outcome: "goal" }, { x: 0.4, z: 0.2, outcome: "saved" }, { x: 1.6, z: 0.5, outcome: "wide" }], { sport: "waterpolo", zones: true }).svg;`, "3.0 metres between the posts, the crossbar's underside 0.9 m over the water."),
    item("target-strike-zone", "The strike zone: the catcher's view", `import { drawStrikeZone } from "${MAIN}/target";\n\nconst pitches = [\n  { x: 0.1, z: 2.6, outcome: "called-strike", type: "FF" },\n  { x: 1.3, z: 1.1, outcome: "ball", type: "SL" },\n  { x: -0.4, z: 2.0, outcome: "swinging-strike", type: "SL" },\n  { x: 0.9, z: 3.9, outcome: "foul", type: "CH" },\n  { x: -0.2, z: 2.4, outcome: "in-play", type: "FF" },\n];\nconst svg = drawStrikeZone(pitches, { bats: "R", top: 3.5, bottom: 1.5 }).svg;`, "Plate 17 inches across, a zone from the batter's knees to his belt, the nine cells and the four chase zones round them, the pitches numbered in order, coloured by result and shaped by what became of them."),
    item("target-strike-zone-type", "The strike zone, left-handed, by pitch type, dark", `import { drawStrikeZone } from "${MAIN}/target";\n\nconst pitches = [\n  { x: 0.3, z: 2.9, outcome: "called-strike", type: "FF" },\n  { x: -1.1, z: 1.4, outcome: "ball", type: "CH" },\n  { x: 0.5, z: 1.8, outcome: "swinging-strike", type: "SL" },\n];\nconst svg = drawStrikeZone(pitches, { bats: "L", colorBy: "type", theme: "dark", top: 3.6, bottom: 1.6 }).svg;`),
    item("target-stumps", "The stumps from the bowler's end", `import { drawStumps } from "${MAIN}/target";\n\nconst svg = drawStumps([\n  { x: 0.02, z: 0.4, outcome: "wicket", length: 5.1 },\n  { x: 0.3, z: 0.5, outcome: "dot", length: 7.4 },\n  { x: -0.5, z: 0.2, outcome: "runs", length: 2 },\n]).svg;`, "Three stumps across 9 inches and 28 inches high, with the bails; the line zones are the stumps' own width either side. The length of a delivery (where it pitched) names its length zone."),
  ];
  return {
    slug: "gallery-data",
    title: "Gallery: data on a surface",
    ja: "データ、ヒートマップ、チャート",
    intro: "Every kind of data layer, every heat layer, the ready-made charts, the team-shape layers and a frame of a replay, on made-up data that the code under each picture makes. The marks are in the surface's own frame, or a provider's.",
    sections: [
      section("layers", "Data layers", "`layers` in the options of `drawKyogijo`: points, lines, arrows and text.", points),
      section("heat", "Heat layers", "Counts in cells, hexagons, named zones or a density, in a colour ramp.", heat),
      section("charts", "Ready-made charts", "One call for a good chart: `@johnmorrisdotca/kyogijo-stadiums/charts`.", charts),
      section("team", "Team shape", "Pass networks, formations, space control, triangulations, hulls, flow fields and sonars, as on the Team shape page. Made-up players and passes from a fixed formula.", team),
      section("replay", "Replay", "A frame of tracking data on a surface: `drawFrame` from `@johnmorrisdotca/kyogijo-stadiums/replay`. The same frame, played, is `mountKyogijo(...).replay(...)`.", replay),
      section("targets", "Goals, the strike zone and the stumps", "A target seen end-on, with where each shot, pitch or delivery crossed it: `@johnmorrisdotca/kyogijo-stadiums/target`.", targets),
    ],
  };
}


function curlingPage() {
  // Made-up stones from a fixed formula, no real game: some in the house, some guards, some in between.
  const crowd = `const luck = (n) => {\n  const v = Math.sin(n * 12.9898) * 43758.5453;\n  return v - Math.floor(v);\n};\nconst bell = (n) => luck(n) + luck(n + 1) + luck(n + 2) - 1.5;\nconst stones = Array.from({ length: 240 }, (_, i) => {\n  const inHouse = luck(i * 7) < 0.45;\n  return { x: bell(i * 5) * (inHouse ? 3 : 2.5), y: inHouse ? bell(i * 11) * 3 : -8 - 9 * luck(i * 13), team: i % 2 ? "home" : "away" };\n});`;
  const stones = `[
  { x: 0.4, y: 0.3, team: "home", number: 8 },
  { x: -1.2, y: -0.8, team: "home", number: 6 },
  { x: 1.9, y: 1.1, team: "away", number: 7 },
  { x: -2.6, y: 2.8, team: "away", number: 5 },
  { x: 0.2, y: -9, team: "away", number: 3 },
  { x: 0.1, y: -14, team: "home", number: 2 },
]`;
  return {
    slug: "gallery-curling",
    title: "Gallery: curling",
    ja: "カーリング",
    intro: "The sheet from World Curling's and Curling Canada's rules, its display ranges and house colours, the board and the badge, and the stones of an end with their score worked out.",
    sections: [
      section("sheets", "The sheet", "`sport: \"curling\"`: tall by default, with the far house at the top; `orientation: \"landscape\"` lays it wide.", [
        item("curling-tall", "The sheet, tall", drawing({ sport: "curling" })),
        item("curling-wide", "The sheet, wide", drawing({ sport: "curling", orientation: "landscape" })),
        item("curling-wcf", "World Curling, with its hack and courtesy lines", drawing({ sport: "curling", orientation: "landscape", league: "wcf", detail: "full" })),
        item("curling-canada", "Curling Canada's rules", drawing({ sport: "curling", orientation: "landscape", league: "curling-canada" }), "Its book prints no hack line and no courtesy line."),
        item("curling-short", "The shortest sheet and the narrowest", drawing({ sport: "curling", orientation: "landscape", league: "curling-canada", sheet: { length: 146, width: 14 + 2 / 12 } }), "146 feet by 14 feet 2 inches, the least Curling Canada allows."),
      ]),
      section("looks", "Colours, ice and guard zone", "`sheet` sets the colours of the rings, the ice's pebble and the shading of the free guard zone.", [
        item("curling-rings", "Rings in a club's colours", drawing({ sport: "curling", sheet: { rings: { outer: "#0b6e4f", middle: "#ffffff", inner: "#d4a017", button: "#ffffff" }, pebble: true } })),
        item("curling-guard", "The free guard zone", drawing({ sport: "curling", orientation: "landscape", sheet: { guardZone: true } })),
        item("curling-dark", "The sheet, dark", drawing({ sport: "curling", theme: "dark" })),
      ]),
      section("ranges", "Part of the sheet", "`sheet.show` is `half` (the hog line to the back line) or `house`, at the `left` end (the top of a tall drawing) or the `right`.", [
        item("curling-half", "Hog line to back line", drawing({ sport: "curling", sheet: { show: "half", guardZone: true } })),
        item("curling-house", "The house", drawing({ sport: "curling", sheet: { show: "house", pebble: true } })),
        item("curling-house-right", "The house at the right end, wide", drawing({ sport: "curling", orientation: "landscape", sheet: { show: "house", end: "right" } })),
      ]),
      section("folded", "The top end, the bottom end, both folded", "`sheet.show: \"folded\"` is the whole sheet as a strip with its two houses enlarged beside it, so that a sheet 150 feet long fills a square. `end: \"top\"` or `\"bottom\"` is one end alone.", [
        item("curling-folded-tall", "Folded, tall: the top house on the left, the bottom house on the right", drawing({ sport: "curling", sheet: { show: "folded" } }), "The strip keeps its scale; each panel is the same sheet from the hog line to the back line, enlarged, with a fan to the part it shows."),
        item("curling-folded-wide", "Folded, wide: the left house above, the right house below", drawing({ sport: "curling", orientation: "landscape", sheet: { show: "folded" } })),
        item("curling-folded-house", "Folded, with only the houses", drawing({ sport: "curling", sheet: { show: "folded", panels: "house", guardZone: true } }), "`panels: \"house\"`; the free guard zone is shaded on the strip."),
        item("curling-folded-fit", "Folded, a little wider than tall", drawing({ sport: "curling", sheet: { show: "folded", fit: 1.2, pebble: true } }), "`fit` is width over height; a panel is never longer than the strip."),
        item("curling-folded-dark", "Folded, dark, in Curling Canada's rules", drawing({ sport: "curling", league: "curling-canada", theme: "dark", sheet: { show: "folded" } })),
        item("curling-top", "Only the top end", drawing({ sport: "curling", sheet: { show: "half", end: "top", guardZone: true } })),
        item("curling-bottom", "Only the bottom end", drawing({ sport: "curling", sheet: { show: "half", end: "bottom", guardZone: true } })),
        item("chart-curling-folded", "The stones of an end, folded", `import { curlingStones } from "${MAIN}/charts";\n\nconst stones = ${stones};\nconst chart = curlingStones(stones, { end: 6, hammer: "home", show: "folded" });\nconst svg = chart.draw();`, "The stones are in the strip, small, and in the top panel, large, at the house they were played to."),
        item("chart-curling-folded-wide", "The same end, folded wide, with its key", `import { curlingStones } from "${MAIN}/charts";\n\nconst stones = ${stones};\nconst chart = curlingStones(stones, { end: 6, hammer: "home", show: "folded" });\nconst svg = chart.draw({ orientation: "landscape" });`),
      ]),
      section("heat", "Where the stones of many ends came to rest", "`curlingHeat` counts the stones of many ends into cells, hexagons, a density or the zones of the house, or draws each as a translucent disc in its team's colour; it can keep one team's stones, the free guards or the stones in the house.", [
        item("curling-heat-cells", "Cells, the half of the sheet", `import { curlingHeat } from "${MAIN}/charts";\n\n${crowd}\nconst svg = curlingHeat(stones).draw();`, "A cell is a foot square; a cell with no stone is not drawn."),
        item("curling-heat-hex", "Hexagons, wide", `import { curlingHeat } from "${MAIN}/charts";\n\n${crowd}\nconst svg = curlingHeat(stones, { view: "hexbin", cell: 1.2 }).draw({ orientation: "landscape" });`),
        item("curling-heat-contour", "A density, one team, wide", `import { curlingHeat } from "${MAIN}/charts";\n\n${crowd}\nconst svg = curlingHeat(stones, { view: "contour", team: "home" }).draw({ orientation: "landscape" });`),
        item("curling-heat-zones", "The zones of the house", `import { curlingHeat } from "${MAIN}/charts";\n\n${crowd}\nconst svg = curlingHeat(stones, { view: "zones", show: "house" }).draw();`, "The number in each zone is the stones that came to rest in it, by their centres."),
        item("curling-heat-guards", "The free guards, as discs in the teams' colours, folded", `import { curlingHeat } from "${MAIN}/charts";\n\n${crowd}\nconst svg = curlingHeat(stones, { view: "discs", only: "guards", show: "folded" }).draw();`, "Stones that fall on each other build up colour."),
        item("curling-heat-folded", "Cells, folded", `import { curlingHeat } from "${MAIN}/charts";\n\n${crowd}\nconst svg = curlingHeat(stones, { show: "folded" }).draw();`, "The colour bar stands in the enlarged house the stones are at."),
        item("curling-heat-house", "The stones in the house, the house alone", `import { curlingHeat } from "${MAIN}/charts";\n\n${crowd}\nconst svg = curlingHeat(stones, { only: "house", show: "house", cell: 0.8 }).draw();`),
        item("curling-ends-grid", "A game's ends in one picture", `import { curlingStones } from "${MAIN}/charts";\nimport { drawGrid } from "${MAIN}/layouts";\n\n${crowd}\nconst ends = [0, 1, 2, 3, 4, 5].map((end) => {\n  const chart = curlingStones(stones.slice(end * 8, end * 8 + 8).map((s, i) => ({ ...s, y: s.y > -2 ? s.y : s.y * 0.4, number: i + 1 })), { end: end + 1, id: \`end-\${end + 1}\` });\n  return { drawing: chart, label: \`End \${end + 1}: \${chart.totals.scoring ?? "blank"} \${chart.totals.points}\` };\n});\nconst svg = drawGrid(ends, { columns: 3, width: 900, title: "A game, end by end" });`, "Each cell is the chart of that end, scored by the rules."),
      ]),
      section("score", "The board and the badge", "Each team's score in each end (`ends`), the total, the hammer, and an end as the status.", [
        item("curling-board-tall", "The board, tall", drawing({ sport: "curling", ...GAMES.curling })),
        item("curling-board-wide", "The board, wide", drawing({ sport: "curling", ...GAMES.curling, orientation: "landscape" })),
        item("curling-compact", "A compact card, wide", drawing({ sport: "curling", ...GAMES.curling, orientation: "landscape", size: "compact" })),
        item("curling-extra", "An extra end", drawing({ sport: "curling", away: { ...WOLVES, score: 6, ends: [0, 1, 0, 2, 0, 0, 1, 0, 1, 0, 1] }, home: { ...RIDGE, score: 5, hammer: false, ends: [1, 0, 2, 0, 1, 0, 0, 1, 0, 0, 0] }, status: "extra-end", size: "badge" })),
      ]),
      section("stones", "The stones of an end", "`curlingStones` judges the stones by the rules and rings the ones that score: one ring for a counting stone, two for the shot rock.", [
        item("chart-curling", "An end, the house at the top", `import { curlingStones } from "${MAIN}/charts";\n\nconst stones = ${stones};\nconst chart = curlingStones(stones, { end: 6, hammer: "home", names: { home: "Prairie Ridge", away: "Harbour City" } });\nconst svg = chart.draw();`, "Home scores 2: its two stones are nearer the button than every stone of the other team."),
        item("chart-curling-wide", "The same end, wide, with its key", `import { curlingStones } from "${MAIN}/charts";\n\nconst stones = ${stones};\nconst chart = curlingStones(stones, { end: 6, hammer: "home" });\nconst svg = chart.draw({ orientation: "landscape" });`),
        item("zones-curling", "Zones: the rings", `import { drawKyogijo } from "${MAIN}";\n\nconst stones = Array.from({ length: 80 }, (_, i) => ({ x: 8.5 * Math.cos(i * 2.4) * Math.sqrt((i % 40) / 40), y: 8 * Math.sin(i * 2.4) * Math.sqrt((i % 40) / 40) - 14 + (i % 3) * 3, outcome: i % 4 ? "stone" : "counting" }));\nconst svg = drawKyogijo({ sport: "curling", sheet: { show: "half", end: "left" }, layers: [{ kind: "zones", name: "stones", zones: "curling-house", from: "curling", attacking: "left", end: "left", data: stones, labels: { show: ["value"] }, legend: true }] });`),
      ]),
    ],
  };
}

function courtsPage() {
  const looks = (sport, names, extra = {}) => names.map((look) => item(`looks-${sport}-${look}`, `${SPORT_TITLES[sport]}: ${look}`, drawing({ sport, net: { look }, ...extra })));
  const touches = (n) => `Array.from({ length: ${n} }, (_, i) => ({ x: ((i * 53) % 40) - 20, y: ((i * 29) % 16) - 8 }))`;
  return {
    slug: "gallery-courts",
    title: "Gallery: net, racket and court sports",
    ja: "ネット型・ラケット型などのコート競技",
    intro: "Twelve court sports from their own rulebooks (tennis, volleyball with beach and sitting volleyball, badminton, pickleball, table tennis, padel, squash, racquetball, sepak takraw, teqball, roundnet and netball), wide and tall, in their named looks, with the free zone and the singles sticks, the board of sets and games with its serving ball, and the zones of each side of the net.",
    sections: [
      section("courts", "Each court", "`sport` is `tennis`, `volleyball`, `badminton`, `pickleball`, `tabletennis`, `padel`, `squash`, `racquetball`, `sepaktakraw`, `teqball`, `roundnet` or `netball`; beach volleyball is `league: \"fivb-beach\"` and sitting volleyball `league: \"wpv-sitting\"`. They lie wide unless `orientation` says tall.", [
        item("court-tennis", "Tennis court (ITF)", drawing({ sport: "tennis" })),
        item("court-volleyball", "Indoor volleyball court (FIVB)", drawing({ sport: "volleyball" }), "18 by 9 metres: the centre line under the net (white, between the net's edges), the attack lines 3 metres from it with the front zone a shade apart, the attack lines' five-dash extensions beyond the side lines, the service zone's two marks behind each end line, and the antennae."),
        item("court-beach", "Beach volleyball court (FIVB Beach)", drawing({ sport: "volleyball", league: "fivb-beach" }), "The beach court is 16 by 8 metres with four boundary lines and nothing else: no centre line, no attack line and no service marks (Beach Rules 1.3.2). The sand look draws its lines in blue."),
        item("court-badminton", "Badminton court (BWF)", drawing({ sport: "badminton" })),
        item("court-pickleball", "Pickleball court (USA Pickleball)", drawing({ sport: "pickleball" })),
        item("court-table", "Table tennis table (ITTF)", drawing({ sport: "tabletennis" })),
        item("court-sitting", "Sitting volleyball court (World ParaVolley)", drawing({ sport: "volleyball", league: "wpv-sitting" }), "10 by 6 metres, the attack lines 2 metres from the centre line, a 7 metre net 1.15 metres high (1.05 for women): the free zone is 4 metres beside the side lines and 6 behind the end lines for World ParaVolley's competitions."),
        item("court-padel", "Padel court (FIP)", drawing({ sport: "padel" }), "20 by 10 metres inside its walls: the service lines 6.95 metres from the net, the central service line running under the net and 20 centimetres past each service line. The end walls and the 4 metre walls at the ends of the sides are drawn solid, the metal fence between them lighter."),
        item("court-squash", "Squash court (World Squash)", drawing({ sport: "squash" }), "9.75 by 6.4 metres, the front wall at the left laid flat beside the court as if hinged on its foot: the tin (480 mm), the service line (1.78 m up) and the front wall line (4.57 m up). On the floor the short line, the half court line and the two service boxes."),
        item("court-squash-doubles", "Squash doubles court", drawing({ sport: "squash", league: "wsf-doubles" }), "7.62 metres wide; `wsf-doubles-wide` is the international competition width, 8.42 metres, with a tin of 330 mm."),
        item("court-racquetball", "Racquetball court (IRF)", drawing({ sport: "racquetball" }), "40 by 20 feet, the front wall at the left: the short line at the middle, the service zone in front of it with its service boxes and drive serve lines, and the broken receiving line 5 feet behind it. The IRF recommends red lines."),
        item("court-sepaktakraw", "Sepak takraw court (ISTAF)", drawing({ sport: "sepaktakraw" }), "13.4 by 6.1 metres: the centre line under the net, a quarter circle of 0.9 metres at each end of it and a service circle of 0.3 metres on each side."),
        item("court-teqball", "Teqball court (FITEQ)", drawing({ sport: "teqball" }), "At least 16 by 12 metres, with the 3 by 1.5 metre table in the middle, the net across it, the halfway line and a service line 3.5 metres from each side of the table."),
        item("court-roundnet", "Roundnet court (International Roundnet Federation)", drawing({ sport: "roundnet" }), "A square of 10 metres with no out of bounds, the set in the middle, the no hit zone line (0.9 metres) and the serving line (2.6 metres), with a mark at each of the four service positions. The court is square, so it lies the same tall or wide."),
        item("court-netball", "Netball court (World Netball)", drawing({ sport: "netball" }), "30.5 by 15.25 metres: two transverse lines in thirds, the centre circle, two goal circles of 4.9 metres and a goalpost with its ring at each goal line, inside a court surround of 3.05 metres."),
        item("court-squash-tall", "Squash court, tall", drawing({ sport: "squash", orientation: "portrait" })),
        item("court-padel-tall", "Padel court, tall", drawing({ sport: "padel", orientation: "portrait" })),
        item("court-netball-tall", "Netball court, tall", drawing({ sport: "netball", orientation: "portrait" })),
        item("court-tennis-tall", "Tennis court, tall", drawing({ sport: "tennis", orientation: "portrait" })),
        item("court-pickleball-tall", "Pickleball court, tall", drawing({ sport: "pickleball", orientation: "portrait" })),
        item("court-dark", "Tennis court, dark", drawing({ sport: "tennis", theme: "dark", net: { look: "clay" } })),
      ]),
      section("looks", "Named looks", "`net.look` is the colour of the court and of the ground round it. The lines and sizes are the rulebook's whatever the look.", [
        ...looks("tennis", ["hard-blue", "hard-green", "clay", "grass"]),
        ...looks("volleyball", ["wood", "blue", "sand"]),
        ...looks("badminton", ["green", "blue", "wood"]),
        ...looks("pickleball", ["blue-green", "green", "red"]),
        ...looks("tabletennis", ["blue", "green"]),
        ...looks("padel", ["blue", "green", "terracotta"]),
        ...looks("squash", ["wood", "blue"]),
        ...looks("racquetball", ["wood", "convertible"]),
        ...looks("sepaktakraw", ["blue", "green", "wood"]),
        ...looks("teqball", ["grey", "blue", "green"]),
        ...looks("roundnet", ["grass", "sand", "indoor"]),
        ...looks("netball", ["wood", "blue", "green"]),
      ]),
      section("details", "Free zone, posts and sticks", "`net.free` is `official` (the default), `least` or `none`; `net.sticks` draws the tennis singles sticks; `detail: \"simple\"` leaves out the small marks.", [
        item("free-volleyball-official", "Volleyball: the FIVB's free zone and attack line extensions", drawing({ sport: "volleyball", net: { free: "official" } }), "5 metres beside the side lines, 6.5 behind the end lines, posts 1 metre out."),
        item("free-volleyball-least", "Volleyball: the least the rules allow", drawing({ sport: "volleyball", net: { free: "least" } }), "A free zone of 3 metres, posts 0.5 metre out and no extension of the attack line."),
        item("free-tennis-least", "Tennis: a club's run-back", drawing({ sport: "tennis", net: { free: "least" } }), "18 feet behind the baselines and 10 beside the sidelines (Appendix X)."),
        item("free-none", "Tennis: no free zone", drawing({ sport: "tennis", net: { free: "none" } })),
        item("sticks-tennis", "Tennis: singles sticks", drawing({ sport: "tennis", net: { sticks: true } }), "A doubles net held up for singles by two sticks 3 feet outside the singles court."),
        item("simple-badminton", "Badminton: simple", drawing({ sport: "badminton", detail: "simple" })),
      ]),
      section("score", "The board and the badge", "Each team's score in each set (`sets`), the points of the game in progress (`points`) and a tie-break (`tiebreaks`) in tennis, the sets or games won, and a ball beside the team that is `serving`. A set or a game is the status: `set-3`, `game-2`, `tiebreak`.", [
        item("board-tennis", "Tennis, in the third set", drawing({ sport: "tennis", ...GAMES.tennis }), "The first set went to a tie-break, 7-6 (5): the 5 is written small beside the games of the team that lost it."),
        item("board-volleyball", "Volleyball, in the fourth set", drawing({ sport: "volleyball", ...GAMES.volleyball })),
        item("board-beach", "Beach volleyball, two sets", drawing({ sport: "volleyball", league: "fivb-beach", away: { ...GULLS_VOLLEY, score: 2, sets: [21, 23] }, home: { ...BISON_VOLLEY, score: 0, sets: [18, 21], serving: false }, status: "final" })),
        item("board-badminton", "Badminton, in the third game", drawing({ sport: "badminton", ...GAMES.badminton, orientation: "landscape" })),
        item("board-pickleball-tall", "Pickleball, tall", drawing({ sport: "pickleball", ...GAMES.pickleball, orientation: "portrait" })),
        item("board-table", "Table tennis, final", drawing({ sport: "tabletennis", ...GAMES.tabletennis })),
        item("board-sitting", "Sitting volleyball, in the fourth set", drawing({ sport: "volleyball", league: "wpv-sitting", ...GAMES.volleyball })),
        item("board-padel", "Padel, in the third set", drawing({ sport: "padel", ...GAMES.padel })),
        item("board-squash", "Squash, best of five", drawing({ sport: "squash", ...GAMES.squash })),
        item("board-racquetball", "Racquetball, best of five", drawing({ sport: "racquetball", ...GAMES.racquetball })),
        item("board-sepaktakraw", "Sepak takraw, three sets", drawing({ sport: "sepaktakraw", ...GAMES.sepaktakraw })),
        item("board-teqball", "Teqball, three sets", drawing({ sport: "teqball", ...GAMES.teqball })),
        item("board-roundnet", "Roundnet: the board lies below the circles", drawing({ sport: "roundnet", ...GAMES.roundnet }), "The set is in the middle of the court, so the board lies on the ground below the serving line."),
        item("board-netball", "Netball: the usual score, with the teams in the goal thirds", drawing({ sport: "netball", ...GAMES.netball }), "Netball is scored in goals, so it has the usual score, not a board of sets: the home team is on the left."),
        item("badge-tennis", "Badge, tennis", drawing({ sport: "tennis", ...GAMES.tennis, size: "badge" }), "The serving ball is in the corner of the team that is serving."),
        item("compact-badminton", "Compact card, badminton", drawing({ sport: "badminton", ...GAMES.badminton, size: "compact" })),
      ]),
      section("zones", "Each side of the net", "The `net-court` zones split each side at the court's own line: tennis's service line, volleyball's attack line, badminton's short service line, pickleball's non-volley zone line, padel's and teqball's service lines. Squash and racquetball have the `wall-court` zones (the front court and the back court, split at the short line), roundnet the `roundnet-rings` and netball the `field-thirds`.", [
        item("zones-tennis", "Zones: tennis", `import { drawKyogijo } from "${MAIN}";\n\nconst balls = ${touches(80)};\nconst svg = drawKyogijo({ sport: "tennis", layers: [{ kind: "zones", name: "balls", zones: "net-court", from: "tennis", data: balls, labels: true, legend: true }] });`),
        item("zones-padel", "Zones: padel", `import { drawKyogijo } from "${MAIN}";\n\nconst balls = Array.from({ length: 80 }, (_, i) => ({ x: ((i * 53) % 16) - 8, y: ((i * 29) % 8) - 4 }));\nconst svg = drawKyogijo({ sport: "padel", layers: [{ kind: "zones", name: "balls", zones: "net-court", from: "padel", data: balls, labels: true, legend: true }] });`),
        item("zones-squash", "Zones: squash", `import { drawKyogijo } from "${MAIN}";\n\nconst balls = Array.from({ length: 80 }, (_, i) => ({ x: ((i * 53) % 9) - 4.5, y: ((i * 29) % 6) - 3 }));\nconst svg = drawKyogijo({ sport: "squash", layers: [{ kind: "zones", name: "balls", zones: "wall-court", from: "squash", data: balls, labels: true, legend: true }] });`),
        item("zones-roundnet", "Zones: roundnet", `import { drawKyogijo } from "${MAIN}";\n\nconst balls = Array.from({ length: 80 }, (_, i) => ({ x: ((i * 53) % 9) - 4.5, y: ((i * 29) % 9) - 4.5 }));\nconst svg = drawKyogijo({ sport: "roundnet", layers: [{ kind: "zones", name: "balls", zones: "roundnet-rings", from: "roundnet", data: balls, labels: true, legend: true }] });`),
        item("zones-pickleball", "Zones: pickleball", `import { drawKyogijo } from "${MAIN}";\n\nconst balls = ${touches(80)};\nconst svg = drawKyogijo({ sport: "pickleball", layers: [{ kind: "zones", name: "balls", zones: "net-court", from: "pickleball", data: balls, labels: true, legend: true }] });`),
      ]),
    ],
  };
}

function stylingPage(lib) {
  const looks = lib[MAIN].LOOK_NAMES;
  const features = lib[MAIN].FEATURES;
  const landmarkSports = [["nhl", "NHL rink"], ["nba", "NBA court"], ["nfl", "NFL field"], ["soccer", "Soccer pitch"], ["mlb", "Baseball field"], ["curling", "Curling sheet"], ["tennis", "Tennis court"], ["volleyball", "Volleyball court"], ["pickleball", "Pickleball court"], ["padel", "Padel court"], ["squash", "Squash court"], ["racquetball", "Racquetball court"], ["netball", "Netball court"]];
  const goalCode = [
    `import { drawKyogijo } from "${MAIN}";`,
    "",
    "const svg = drawKyogijo({",
    '  sport: "nhl",',
    "  goalMarkup: ({ x, y, width, out }) => '<rect x=\"' + (out < 0 ? x - 4 : x) + '\" y=\"' + (y - width / 2) + '\" width=\"4\" height=\"' + width + '\" fill=\"#1d4f91\"/>',",
    "});",
  ].join("\n");
  return {
    slug: "gallery-styling",
    title: "Gallery: looks and annotations",
    ja: "スタイルと注釈",
    intro: "The named looks on four sports, colours by feature, line widths and dashes, goal styles, mowing patterns, and the arrows, axes and labels that mark a surface for teaching. Every picture is drawn by the build from the code under it.",
    sections: [
      section("looks", "Named looks", "`look` paints the surface, its lines and the ground round it in one palette. Each look is shown on the rink, the court, the field and the ballpark; the page's `theme` makes them light or dark.", looks.flatMap((name) => ["nhl", "nba", "nfl", "mlb"].map((sport) => item(`look-${name}-${sport}`, `${name}: ${SPORT_TITLES[sport]}`, drawing({ sport, look: name }))))),
      section("features", "Colours by feature", `\`featureColors\` colours a part by its name; \`FEATURES\` lists the names (the rink has ${features.nhl.length}, the court ${features.nba.length}, the pitch ${features.soccer.length}).`, [
        item("feature-nhl", "Rink: blue lines, circles and nets", drawing({ sport: "nhl", featureColors: { "blue-lines": "#0a7d3b", "face-off-circles": "#e07b00", "face-off-dots": "#e07b00", nets: "#1d4f91", crease: "#ffd9a0" } })),
        item("feature-soccer", "Pitch: areas, goals and the centre circle", drawing({ sport: "soccer", featureColors: { "penalty-areas": "#ffe600", goals: "#ff3df2", "centre-circle": "#00e5ff", mowing: "#2f8f4a" } })),
        item("feature-nba", "Court: rims, backboards and the key", drawing({ sport: "nba", featureColors: { key: "#6a3d9a", rims: "#00a0ff", backboards: "#ffe600", "three-point-line": "#ffe600" } })),
      ]),
      section("lines", "Line widths, dashes and opacity", "`lineWidth` scales every painted line or sets the ordinary one to an absolute width; `lineDash` and `lineOpacity` do what they say.", [
        item("lines-thick", "Court, lines twice as wide", drawing({ sport: "nba", lineWidth: 2 })),
        item("lines-absolute", "Rink, the ordinary line 1 foot wide", drawing({ sport: "nhl", lineWidth: { width: 1 } })),
        item("lines-dashed", "Pitch, dashed", drawing({ sport: "soccer", lineDash: "dashed", lineWidth: 2 })),
        item("lines-dotted", "Court, dotted", drawing({ sport: "nba", lineDash: "dotted", lineWidth: { width: 0.7 } })),
        item("lines-dashdot", "Rink, dash and dot", drawing({ sport: "nhl", lineDash: "dash-dot" })),
        item("lines-faint", "Field, faint lines", drawing({ sport: "nfl", lineOpacity: 0.45 })),
      ]),
      section("goals", "Goals", "`goals` styles a hockey net, a basket and a field's posts as it does a soccer goal; `goalMarkup` draws them with a function of your own.", [
        ...["box", "line", "strip", "none"].map((name) => item(`goals-nhl-${name}`, `Rink nets: ${name}`, drawing({ sport: "nhl", goals: name, exactLines: true }))),
        ...["box", "line", "strip", "none"].map((name) => item(`goals-nba-${name}`, `Court baskets: ${name}`, drawing({ sport: "nba", goals: name }))),
        ...["line", "strip", "none"].map((name) => item(`goals-nfl-${name}`, `Field posts: ${name}`, drawing({ sport: "nfl", goals: name }))),
        item("goals-custom", "A function of your own", goalCode, "`goalMarkup` is given where each goal stands and returns SVG in feet."),
      ]),
      section("mowing", "Mowing patterns", "`stripePattern` on a football field and a ballpark, as on a soccer pitch.", [
        ...["wide", "narrow", "lengthwise", "checks", "diagonal", "circles"].map((name) => item(`mow-nfl-${name}`, `Field: ${name}`, drawing({ sport: "nfl", stripePattern: name }))),
        ...["bands", "lengthwise", "checks", "diagonal", "fan"].map((name) => item(`mow-mlb-${name}`, `Ballpark: ${name}`, drawing({ sport: "mlb", stripePattern: name }))),
        item("mow-soccer-circles", "Pitch: circles", drawing({ sport: "soccer", stripePattern: "circles" })),
      ]),
      section("direction", "Direction of play", "`direction` draws an arrow for the end each team attacks, by the sport's rule for the periods.", [
        item("direction-nhl", "Rink: home attacks the right", drawing({ sport: "nhl", direction: { home: "right", away: "left" } })),
        item("direction-nhl-p2", "Rink, second period: the ends have changed", drawing({ sport: "nhl", direction: { home: "right", away: "left", period: 2 } })),
        item("direction-nfl-tall", "Field, tall", drawing({ sport: "nfl", orientation: "portrait", direction: { home: "right", away: "left" } })),
        item("direction-soccer", "Pitch, with a label of your own", drawing({ sport: "soccer", direction: { home: "left", label: "Attacking the south goal" } })),
      ]),
      section("axes", "Axes", "`axes` puts ticks and numbers along the edges, in the drawing's own numbers or any frame of the sport.", [
        item("axes-nfl", "Field, in yards", drawing({ sport: "nfl", axes: { ticks: 10, labels: { x: "yards", y: "yards" } } })),
        item("axes-nhl", "Rink, in the NHL API's numbers", drawing({ sport: "nhl", axes: { frame: "nhl-api", ticks: { x: 25, y: 10 } } })),
        item("axes-nba", "Court, in the NBA stats frame", drawing({ sport: "nba", axes: { frame: "nba-stats", ticks: 100 } })),
        item("axes-soccer", "Pitch, in Opta's 0 to 100", drawing({ sport: "soccer", pitchType: "opta", axes: { frame: "opta", ticks: 10 } })),
        item("axes-mlb", "Ballpark, in feet from home plate", drawing({ sport: "mlb", axes: { ticks: 100 } })),
      ]),
      section("landmarks", "Landmarks", "`landmarks: true` names the parts of a surface, wide and tall.", [
        ...landmarkSports.map(([sport, title]) => item(`landmarks-${sport}`, `${title}, labelled`, drawing({ sport, landmarks: true }))),
        item("landmarks-tall-nhl", "Rink, tall", drawing({ sport: "nhl", landmarks: true, orientation: "portrait" })),
        item("landmarks-tall-nfl", "Field, tall", drawing({ sport: "nfl", landmarks: true, orientation: "portrait" })),
        item("landmarks-ja", "Pitch, in Japanese", drawing({ sport: "soccer", landmarks: true, language: "ja" })),
      ]),
      section("together", "All of it together", "A look, labels, a scale and the arrows, for a lesson.", [
        item("together-nba", "Court on the chalkboard", drawing({ sport: "nba", look: "chalkboard", landmarks: true, direction: { home: "right" }, axes: { ticks: 10 } })),
        item("together-nhl", "Rink as a blueprint", drawing({ sport: "nhl", look: "blueprint", landmarks: true, direction: { home: "right", away: "left" }, axes: { ticks: 20 } })),
      ]),
    ],
  };
}

/** The shots, the same on every picture of the ranges page: over the whole of a rink in its own feet, so that some are in any zone and some outside it. */
const RANGE_SHOTS = "Array.from({ length: 48 }, (_, i) => ({ x: 6 + ((i * 53) % 190), y: 6 + ((i * 29) % 74), outcome: i % 6 === 0 ? \"goal\" : \"shot\" }))";

function rangesPage(lib) {
  const { RANGES } = lib[MAIN];
  const SPORTS_SHOWN = ["nfl", "nhl", "nba", "soccer", "mlb", "curling", "tennis"];
  const TITLES = { nfl: "NFL field", nhl: "NHL rink", nba: "NBA court", soccer: "Soccer pitch", mlb: "Baseball field", curling: "Curling sheet", tennis: "Tennis court" };
  const named = SPORTS_SHOWN.flatMap((sport) =>
    RANGES[sport].map((info) => item(`range-${sport}-${info.id}`, `${TITLES[sport]}: ${info.id}`, drawing({ sport, range: info.id, ...(sport === "curling" ? { orientation: "landscape" } : {}) }), info.end === undefined ? "A range with no end." : `At the ${info.end} end unless \`end\` says the other.`)),
  );
  const shots = RANGE_SHOTS;
  const code = (options) => `import { drawKyogijo } from "${MAIN}";\n\nconst shots = ${shots};\nconst svg = drawKyogijo({ ${options} });`;
  return {
    slug: "gallery-ranges",
    title: "Gallery: display ranges and zoom",
    ja: "表示範囲とズーム",
    intro: "A drawing cropped to a named part of its surface (`range`), at either end, wide and tall, to a box of your own, with data, annotations and a score. Every picture is drawn by the build from the code under it.",
    sections: [
      section("named", "The named ranges", "`RANGES` lists them for each sport; `range: \"offensive-zone\"` is the name, and each has the end it is at by default.", named),
      section("ends", "The other end, and tall", "`range: { name, end }` puts a range at the other end; a tall drawing shows the same part on its side, with the left end at the top.", [
        item("range-ends-nhl", "The offensive zone at the left end", drawing({ sport: "nhl", range: { name: "offensive-zone", end: "left" } })),
        item("range-ends-nfl", "The red zone at the left end", drawing({ sport: "nfl", range: { name: "red-zone", end: "left" } })),
        item("range-tall-nhl", "The offensive zone, tall", drawing({ sport: "nhl", range: "offensive-zone", orientation: "portrait" })),
        item("range-tall-nba", "The half court, tall", drawing({ sport: "nba", range: "half-court", orientation: "portrait" })),
        item("range-tall-soccer", "The penalty area, tall", drawing({ sport: "soccer", range: { name: "penalty-area", end: "right" }, orientation: "portrait" })),
        item("range-tall-mlb", "The outfield, tall", drawing({ sport: "mlb", range: "outfield", orientation: "portrait" })),
        item("range-curling-house-right", "A curling house, wide, at the right end", drawing({ sport: "curling", range: { name: "house", end: "right" }, orientation: "landscape" }), "The same as `sheet: { show: \"house\", end: \"right\" }`."),
        item("range-football-cfl", "The CFL's red zone", drawing({ sport: "cfl", range: "red-zone" })),
      ]),
      section("boxes", "A box of your own", "`{ x0, x1, y0, y1 }` in the drawing's feet, in `units`, or in a frame's own numbers.", [
        item("range-box-feet", "A box in feet", drawing({ sport: "nhl", range: { x0: 100, x1: 160, y0: 10, y1: 60 } })),
        item("range-box-yards", "The same box in yards", drawing({ sport: "nhl", units: "yd", range: { x0: 100 / 3, x1: 160 / 3, y0: 10 / 3, y1: 60 / 3 } })),
        item("range-box-frame", "The right end zone in the NHL API's numbers", drawing({ sport: "nhl", range: { x0: 25, x1: 100, y0: -42.5, y1: 42.5, frame: "nhl-api" } })),
        item("range-box-opta", "A pitch's final third in Opta's 0 to 100", drawing({ sport: "soccer", range: { x0: 66, x1: 100, y0: 0, y1: 100, frame: "opta" } })),
        item("range-box-mlb", "The left-field corner of a ballpark", drawing({ sport: "mlb", range: { x0: -330, x1: -60, y0: -330, y1: -60 } })),
      ]),
      section("data", "Data on a range", "Layers are cut to the range, and a heat map has the cells of the zone, not of the whole surface.", [
        item("range-data-points", "Shots in the offensive zone", code('sport: "nhl", range: "offensive-zone", layers: [{ kind: "points", name: "shots", data: shots }]')),
        item("range-data-heat", "A heat map of the zone, with its legend", code('sport: "nhl", range: "offensive-zone", layers: [{ kind: "heatmap", name: "shots", data: shots, legend: true }]')),
        item("range-data-hexbin", "Hexagons over a half court", drawing({ sport: "nba", range: "half-court", layers: [{ kind: "hexbin", name: "shots", data: Array.from({ length: 60 }, (_, i) => ({ x: 4 + ((i * 17) % 44), y: 3 + ((i * 11) % 44) })), legend: true }] })),
        item("range-data-zones", "Zones of the half court", drawing({ sport: "nba", range: "half-court", layers: [{ kind: "zones", name: "shots", zones: "nba-shot", data: Array.from({ length: 60 }, (_, i) => ({ x: 4 + ((i * 17) % 44), y: 3 + ((i * 11) % 44) })), labels: { show: ["count"] } }] })),
      ]),
      section("notes", "Annotations on a range", "The ticks, the names of the parts and the arrows are of what is shown, on the apron beyond the cut.", [
        item("range-notes-landmarks", "The offensive zone, labelled", drawing({ sport: "nhl", range: "offensive-zone", landmarks: true })),
        item("range-notes-axes", "The red zone, with axes", drawing({ sport: "nfl", range: "red-zone", axes: { ticks: 10, labels: { x: "yards", y: "yards" } } })),
        item("range-notes-all", "A half court on the chalkboard", drawing({ sport: "nba", range: "half-court", look: "chalkboard", landmarks: true, direction: { home: "right" }, axes: { ticks: 10 } })),
        item("range-notes-ja", "The penalty area, in Japanese", drawing({ sport: "soccer", range: "penalty-area", landmarks: true, language: "ja" })),
      ]),
      section("score", "A score on a range", "The panel is moved inside what is shown, or, when the range is too small for it, the score is a strip under the drawing.", [
        item("range-score-nhl", "The offensive zone, with a score", drawing({ sport: "nhl", range: "offensive-zone", ...GAMES.nhl })),
        item("range-score-nhl-tall", "The offensive zone with a score, tall", drawing({ sport: "nhl", range: "offensive-zone", orientation: "portrait", ...GAMES.nhl })),
        item("range-score-nba", "The half court, with a score", drawing({ sport: "nba", range: "half-court", ...GAMES.nba })),
        item("range-score-paint", "The paint: the score is a strip", drawing({ sport: "nba", range: "paint", ...GAMES.nba })),
        item("range-score-mlb", "The infield, with a score", drawing({ sport: "mlb", range: "infield", ...GAMES.mlb })),
        item("range-score-nfl", "The red zone, with a score", drawing({ sport: "nfl", range: "red-zone", ...GAMES.nfl })),
      ]),
    ],
  };
}

/** A snippet that draws `cells` and `options` with `drawGrid`. */
const gridCode = (cells, options = {}, extra = "") => `import { drawGrid } from "${MAIN}/layouts";\n${extra}\nconst svg = drawGrid(${cells}, ${literal(options)});`;

/** A made-up photograph for the ground behind a drawing: an SVG document as text, which `safeLogo` takes. A caller passes the address of a real photograph. */
const SKY = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 225'><defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#274b7a'/><stop offset='.62' stop-color='#f0b36a'/><stop offset='1' stop-color='#3d5a3b'/></linearGradient></defs><rect width='400' height='225' fill='url(#s)'/><path d='M0 170L60 120L120 160L200 100L290 150L350 125L400 160V225H0Z' fill='#1d2f27'/></svg>";

function layoutsPage() {
  const four = '[{ drawing: { sport: "nhl" }, label: "Rink" }, { drawing: { sport: "nba" }, label: "Court" }, { drawing: { sport: "soccer" }, label: "Pitch" }, { drawing: { sport: "mlb", park: "fenway-park" }, label: "Ballpark" }]';
  const parks = '["fenway-park", "wrigley-field", "oracle-park", "coors-field", "yankee-stadium", "tokyo-dome"].map((park) => ({ drawing: { sport: "mlb", park }, label: park }))';
  const keyed = [{ label: "Goal", color: "#c8102e" }, { label: "Shot", color: "#1f5fa8", hollow: true }, { label: "Block", color: "#6b6f72", shape: "x" }];
  const patterns = ["felt", "grass", "wood", "ice", "paper", "grid", "dots"];
  return {
    slug: "gallery-layouts",
    title: "Gallery: layouts and backgrounds",
    ja: "レイアウトと背景",
    intro: "Small multiples in one SVG, with a title, a subtitle, a key and a credit line, in the size of a social card, a square post or a phone; and the grounds behind a drawing or a grid: seven patterns and a photograph.",
    sections: [
      section("presets", "Sizes for a card, a post and a phone", "`preset` fixes the size: `card` is 1200 by 675, `square` 1080 by 1080, `phone` 390 wide in one column and as tall as the drawings need.", [
        item("grid-card", "A social card", gridCode(four, { preset: "card", title: "Four surfaces", subtitle: "Each drawn to scale from its rulebook", endnote: "Drawn with Kyogijo" })),
        item("grid-square", "A square post", gridCode(four, { preset: "square", title: "Four surfaces", subtitle: "Each drawn to scale", endnote: "Drawn with Kyogijo", background: "grid" })),
        item("grid-phone", "A phone's width", gridCode(four, { preset: "phone", title: "Four surfaces", subtitle: "One column", endnote: "Drawn with Kyogijo" }), "The picture is as tall as the drawings need."),
      ]),
      section("columns", "Columns, gaps and the last row", "`columns` and `gap` are yours; with neither, the grid picks the columns that make the drawings largest. The last row is centred.", [
        item("grid-columns-two", "Two columns", gridCode(parks, { columns: 2, width: 800, title: "Six parks", endnote: "Each park's fence from its published figures" }), "Two columns of three rows, as tall as the drawings need."),
        item("grid-columns-three", "Three columns, a wide gap", gridCode(parks, { columns: 3, gap: 40, width: 900 })),
        item("grid-odd", "Five drawings in three columns", gridCode('["nhl", "nba", "soccer", "mlb", "curling"].map((sport) => ({ drawing: { sport }, label: sport }))', { columns: 3, width: 900 })),
      ]),
      section("key", "A key they share", "`legend` is a list of `{ label, color, shape, hollow }`, set under the title; the description for a screen reader lists it.", [
        item("grid-key", "Three marks", gridCode('[{ sport: "nhl" }, { sport: "nhl", orientation: "portrait" }]', { width: 900, title: "Shots on the rink", subtitle: "Wide and tall", legend: keyed })),
      ]),
      section("charts", "Charts and scores in a cell", "A cell is the options of `drawKyogijo`, a drawing's SVG, a chart or `{ drawing, label }`: a chart is drawn by its own `draw()`, with ids of its own.", [
        item(
          "grid-charts",
          "Two shot charts and a score",
          `import { nbaShotChart } from "${MAIN}/charts";\nimport { drawGrid } from "${MAIN}/layouts";\n\nconst shots = (n) => Array.from({ length: n }, (_, i) => ({ x: ((i * 97) % 480) - 240, y: (i * 61) % 300, made: i % 3 === 0 }));\nconst svg = drawGrid(\n  [\n    { drawing: nbaShotChart(shots(90), { league: 46, minShots: 2 }), label: "First half" },\n    { drawing: nbaShotChart(shots(140), { league: 46, minShots: 2 }), label: "Second half" },\n    { drawing: { sport: "nba", away: ${literal(PEAKS)}, home: ${literal(BOLTS)}, status: "final" }, label: "Final" },\n  ],\n  { columns: 2, width: 1000, title: "A game in three pictures", endnote: "Synthetic shots" },\n);`,
        ),
      ]),
      section("themes", "Light, dark and Japanese", "`theme` forces light or dark on the grid and on every drawing in it; `language` sets the grid's own words and the language of the drawings that have none of their own.", [
        item("grid-dark", "Dark", gridCode(four, { preset: "card", theme: "dark", title: "Four surfaces", subtitle: "Dark", background: { pattern: "felt", color: "#16241f" } })),
        item("grid-ja", "In Japanese", gridCode(four, { preset: "card", language: "ja", title: "4つの競技場", subtitle: "それぞれルールブックどおりの寸法で描いています", endnote: "Kyogijoで描画" })),
      ]),
      section("drawing-grounds", "A ground behind a drawing", "`background` on a drawing lays a pattern (and a colour, and a photograph) on the apron, under the surface. Every pattern is a few shapes in the drawing's own ink, so it follows light and dark.", patterns.map((name) => item(`bg-${name}`, `Ground: ${name}`, drawing({ sport: "nba", background: name })))),
      section("grid-grounds", "A ground behind a grid", "The same option on a grid lays the ground under every drawing and the words; a colour of your own sits under the pattern.", [
        item("grid-ground-wood", "Wood", gridCode(four, { width: 900, columns: 2, background: { pattern: "wood", color: "#e6d3b3" }, title: "On the table" })),
        item("grid-ground-ice", "Ice", gridCode(four, { width: 900, columns: 2, background: { pattern: "ice", color: "#e9f2f8" }, title: "On the ice" })),
      ]),
      section("photo", "A photograph behind the surface", "`image` is an address or a `data:` image held to the rules of a team's `logo`, drawn over the ground's colour and under the pattern at `imageOpacity`. The picture here is a made-up scene written as an SVG document; pass the address of a real photograph.", [
        item("photo-drawing", "A photograph behind a court", `import { drawKyogijo } from "${MAIN}";\n\nconst photo = ${JSON.stringify(SKY)};\nconst svg = drawKyogijo({ sport: "nba", background: { color: "#1d2f27", image: photo, imageOpacity: 0.7, pattern: "dots" } });`),
        item("photo-grid", "A photograph behind a grid", `import { drawGrid } from "${MAIN}/layouts";\n\nconst photo = ${JSON.stringify(SKY)};\nconst svg = drawGrid(${four}, { preset: "card", title: "Four surfaces", background: { image: photo, imageOpacity: 0.5, color: "#1d2f27" }, theme: "dark" });`),
      ]),
    ],
  };
}

/** The field sports: lacrosse, rugby, Australian football, Gaelic games, cricket, field hockey and handball. */
function fieldsPage(lib) {
  const grounds = lib[`${MAIN}/leagues`].AFL_GROUNDS;
  return {
    slug: "gallery-fields",
    title: "Gallery: lacrosse, rugby, Australian football, Gaelic games, cricket, field hockey and handball",
    ja: "ラクロス、ラグビー、オーストラリアンフットボール、ゲーリック・ゲームズ、クリケット、フィールドホッケー、ハンドボール",
    intro: "Seven field sports from their own rulebooks: each league's surface, the scores they write their own way (goals and behinds, goals and points, runs for wickets), a named ground, a boundary of your own and a part of the surface.",
    sections: [
      section("fields", "Each surface, each league", "`sport` is `lacrosse`, `rugby`, `afl`, `gaelic`, `cricket`, `fieldhockey` or `handball`; `league` picks the rulebook.", [
        item("fields-lacrosse", "Lacrosse: World Lacrosse's men's field", drawing({ sport: "lacrosse" })),
        item("fields-lacrosse-women", "Lacrosse: World Lacrosse's women's field", drawing({ sport: "lacrosse", league: "world-women" }), "The 15 metre and 11 metre marking areas, the goal circle and the restraining lines."),
        item("fields-lacrosse-box", "Lacrosse: the NLL's box floor", drawing({ sport: "lacrosse", league: "nll" }), "Boards with rounded corners, the crease cut by a flat, the restraining lines and the face-off circle."),
        item("fields-rugby", "Rugby union: World Rugby's field", drawing({ sport: "rugby" })),
        item("fields-rugby-league", "Rugby league: the NRL's field", drawing({ sport: "rugby", league: "nrl" }), "A line every 10 metres, the 20 and 40 metre lines red, and the scrum lines."),
        item("fields-afl", "Australian football: the AFL's ground", drawing({ sport: "afl" }), "An oval cut at each end by the goal line and the behind lines, at the size of the MCG."),
        item("fields-gaelic", "Gaelic football: the GAA's field", drawing({ sport: "gaelic" })),
        item("fields-hurling", "Hurling: the same field with the 65 metre lines", drawing({ sport: "gaelic", league: "gaa-hurling" })),
        item("fields-cricket", "Cricket: the ICC's ground with its 30-yard circle", drawing({ sport: "cricket" })),
        item("fields-hockey", "Field hockey: the FIH's pitch", drawing({ sport: "fieldhockey" })),
        item("fields-handball", "Handball: the IHF's court", drawing({ sport: "handball" })),
      ]),
      section("scores", "The scores", "Australian football writes goals, behinds and the total; Gaelic games goals, points and the total; a cricket score is a board of runs, wickets and overs, innings by innings.", [
        item("field-score-afl", "Australian football: 10.12 (72) to 9.14 (68)", drawing({ sport: "afl", ...GAMES.afl })),
        item("field-score-gaelic", "Gaelic football: 2-14 (20) to 1-15 (18)", drawing({ sport: "gaelic", ...GAMES.gaelic })),
        item("field-score-cricket", "Cricket: a limited-overs match", drawing({ sport: "cricket", ...GAMES.cricket })),
        item("field-score-cricket-test", "Cricket: a Test match, innings by innings", drawing({ sport: "cricket", away: { ...CRICKET_AWAY, score: 490, wickets: 4, overs: "112", innings: ["312", "178/4"] }, home: { ...CRICKET_HOME, score: 564, wickets: 10, overs: "130.3", innings: ["263", "301"] }, status: "innings-4", competition: "Test, day 5" })),
        item("field-score-rugby-tall", "Rugby, tall", drawing({ sport: "rugby", ...GAMES.rugby, orientation: "portrait" })),
        item("field-score-handball-badge", "Handball, as a strip", drawing({ sport: "handball", ...GAMES.handball, size: "badge" })),
      ]),
      section("size", "A size, a ground and a boundary", "`field` takes a length and a width within the range the rules allow, a named ground of the AFL, or a cricket boundary, round or oval.", [
        ...grounds.map((ground) => item(`ground-afl-${ground.id}`, `${ground.name.en}: ${ground.length} by ${ground.width} metres`, drawing({ sport: "afl", field: { ground: ground.id } }), `The length and width the AFL's venue page prints.`)),
        item("size-rugby-short", "Rugby union at its least: 94 by 68 metres, in-goal 6 metres", drawing({ sport: "rugby", units: "m", field: { length: 94, width: 68, inGoal: 6 } })),
        item("size-cricket-oval", "Cricket: an oval boundary, 90 yards straight and 65 square", drawing({ sport: "cricket", units: "yd", field: { boundary: { straight: 90, square: 65 } } })),
        item("size-cricket-women", "Cricket: the ICC's women's ground, circle of 25.15 yards", drawing({ sport: "cricket", league: "icc-women" })),
      ]),
      section("parts", "A part of the surface, a look and a feature", "`range` crops to a named part; `look` and `featureColors` colour the whole or a part.", [
        item("parts-rugby-22", "Rugby: the 22", drawing({ sport: "rugby", range: "twenty-two" })),
        item("parts-afl-fifty", "Australian football: inside the fifty metre arc", drawing({ sport: "afl", range: "forward-fifty" })),
        item("parts-cricket-pitch", "Cricket: the pitch, with its creases and wickets", drawing({ sport: "cricket", range: "pitch" })),
        item("parts-hockey-circle", "Field hockey: the circle", drawing({ sport: "fieldhockey", range: "circle" })),
        item("parts-handball-area", "Handball: the goal area", drawing({ sport: "handball", range: "goal-area" })),
        item("parts-lacrosse-crease", "Lacrosse: the crease", drawing({ sport: "lacrosse", league: "ncaa-men", range: "crease" })),
        item("parts-night-rugby", "Rugby, night", drawing({ sport: "rugby", look: "night" })),
        item("parts-chalk-gaelic", "Gaelic football, chalkboard", drawing({ sport: "gaelic", look: "chalkboard", landmarks: true })),
        item("parts-feature-nrl", "Rugby league, red lines in gold", drawing({ sport: "rugby", league: "nrl", featureColors: { "red-lines": "#d4a017" } })),
      ]),
    ],
  };
}

/** The teams and cup of the pageant's pictures: Canada and Japan with our own maple leaf and sun disc, and a made-up cup, all drawn in code (no flag, federation crest or emblem). */
const PAGEANT_CODE = String.raw`// Our own marks, drawn here: a maple leaf for Canada and a sun disc for Japan (never a federation's crest or logo, and no flag: a snippet cannot await Hata's flag()).
const leaf = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#fff"/><polygon points="50,14 55,26 60,23 59,36 72,28 69,39 81,35 77,44 83,53 72,52 74,58 56,55 55,70 44,55 26,58 28,52 17,53 23,44 19,35 31,39 28,28 41,36 40,23 45,26 50,14" fill="#d52b1e"/></svg>';
const sun = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#fff"/><circle cx="50" cy="50" r="24" fill="#bc002d"/></svg>';
const cup = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#14233f"/><path d="M33 26H67V42Q67 58 50 62Q33 58 33 42Z" fill="#f2c230"/><path d="M33 30H24Q24 46 36 50M67 30H76Q76 46 64 50" fill="none" stroke="#f2c230" stroke-width="4"/><path d="M46 62H54V72H62V78H38V72H46Z" fill="#f2c230"/></svg>';
const canada = { name: "Canada", abbr: "CAN", score: 2, color: "#d52b1e", logo: leaf };
const japan = { name: "Japan", abbr: "JPN", score: 1, color: "#bc002d", logo: sun };`;

function pageantPage() {
  const sports = ["nfl", "cfl", "ifaf", "nhl", "nba", "soccer", "mlb", "curling", "tennis", "volleyball", "badminton", "pickleball", "tabletennis", "lacrosse", "rugby", "afl", "gaelic", "cricket", "fieldhockey", "handball"];
  const call = (extra, more = "") => `import { drawKyogijo } from "${MAIN}";\n\n${PAGEANT_CODE}\nconst svg = drawKyogijo({ ${extra}, away: canada, home: japan, status: "final", competition: "Northern Cup final"${more} });`;
  return {
    slug: "gallery-pageant",
    title: "Gallery: flags on the halves",
    ja: "ハーフに広げる旗",
    intro: "Each team's flag or crest laid large over its half of the surface, as a stadium does for a final's ceremony: as a carpet, or on a round stage, with an emblem in the centre. The teams are Canada and Japan with a maple leaf and a sun disc, and the cup is made up, all drawn in the code under each picture.",
    sections: [
      section("carpets", "A carpet on every surface", "`pageant: \"carpet\"` lays each flag at its own ratio, with a dark border and a gentle fabric of light and shade. A diamond's home team is on the infield and the visitors are in the outfield; a curling sheet has a flag in each house. Where the plate would cost the carpets their size the score goes to the strip.", sports.map((sport) => item(`pageant-carpet-${sport}`, `${SPORT_TITLES[sport]}, carpets`, call(`sport: "${sport}", pageant: "carpet"`)))),
      section("stages", "A stage on every surface", "`pageant: \"stage\"` puts each crest on a large round disc with a gold ring. A flag is cut to the circle; `markFit: \"contain\"` on a team shows a crest whole.", sports.map((sport) => item(`pageant-stage-${sport}`, `${SPORT_TITLES[sport]}, stages`, call(`sport: "${sport}", pageant: "stage"`)))),
      section("emblem", "An emblem in the centre", "`emblem` is a competition's picture or a trophy, in the centre circle, centre ice or centre court. The score then goes to the strip under the drawing.", [
        item("pageant-emblem-soccer", "Soccer pitch: carpets and the cup", call('sport: "soccer", pageant: { emblem: cup, emblemName: "Northern Cup" }')),
        item("pageant-emblem-soccer-stage", "Soccer pitch: stages and the cup", call('sport: "soccer", pageant: { style: "stage", emblem: cup, emblemName: "Northern Cup" }')),
        item("pageant-emblem-nhl", "NHL rink: stages and the cup at centre ice", call('sport: "nhl", pageant: { style: "stage", emblem: cup }')),
        item("pageant-emblem-nba", "NBA court: carpets and the cup at centre court", call('sport: "nba", pageant: { emblem: cup }')),
        item("pageant-emblem-nfl", "NFL field: carpets and the cup at midfield", call('sport: "nfl", pageant: { emblem: cup }')),
        item("pageant-emblem-plain", "A trophy as it is, with no disc", `import { drawKyogijo } from "${MAIN}";\n\n${PAGEANT_CODE}\nconst trophy = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M30 14H70V40Q70 62 50 66Q30 62 30 40Z" fill="#d8ae4a"/><path d="M30 20H16Q16 44 34 50M70 20H84Q84 44 66 50" fill="none" stroke="#d8ae4a" stroke-width="5"/><path d="M44 66H56V80H68V88H32V80H44Z" fill="#a67a1d"/></svg>';\nconst svg = drawKyogijo({ sport: "soccer", away: canada, home: japan, status: "final", pageant: { emblem: trophy, emblemShape: "plain" } });`, "`emblemShape: \"plain\"` draws a picture with a cut-out outline as it is, over a soft shadow."),
        item("pageant-emblem-baseball", "Baseball field: the cup on the mound", call('sport: "mlb", pageant: { emblem: cup }')),
      ]),
      section("tall", "Tall, and small", "A tall drawing lays the halves one above the other, and each flag is turned back upright. Under 320 pixels wide, or with `detail: \"simple\"`, the fabric, the hairlines and the name pills are left out.", [
        item("pageant-tall-soccer", "Soccer pitch, tall, with the cup", call('sport: "soccer", orientation: "portrait", pageant: { emblem: cup }')),
        item("pageant-tall-nfl", "NFL field, tall", call('sport: "nfl", orientation: "portrait", pageant: "carpet"')),
        item("pageant-tall-stage", "NBA court, tall, stages", call('sport: "nba", orientation: "portrait", pageant: "stage"')),
        item("pageant-small", "A small drawing", call('sport: "nhl", width: 280, pageant: "carpet"')),
      ]),
      section("choices", "Borders, lines, fabric and names", "Each choice on its own: the border band (`dark`, `team` or a colour) and its width, the lines of the surface over, under or through the pictures, the fabric, a name on each flag, the score in the middle, a smaller picture, and a team with no flag.", [
        item("pageant-ratio-fit", "Carpets at the flags' own ratio", call('sport: "soccer", pageant: { fit: "ratio", score: "strip" }'), "`fit: \"ratio\"` keeps each flag's own ratio and leaves the rest of the half bare."),
        item("pageant-border-team", "A border in each team's colour", call('sport: "soccer", pageant: { border: "team", borderWidth: 0.1 }')),
        item("pageant-border-gold", "A gold border", call('sport: "soccer", pageant: { border: "#c9a24a" }')),
        item("pageant-lines-over", "Lines over the carpets (the default)", call('sport: "soccer", pageant: { score: "strip" }')),
        item("pageant-lines-under", "Lines under the carpets", call('sport: "soccer", pageant: { lines: "under", score: "strip" }'), "The carpets cover the lines under them."),
        item("pageant-lines-through", "Lines through the carpets", call('sport: "soccer", pageant: { lines: "through", score: "strip" }'), "The carpets are a little see-through, so the lines show faintly."),
        item("pageant-no-fabric", "No fabric", call('sport: "nhl", pageant: { fabric: false }')),
        item("pageant-names", "A name on each flag", call('sport: "nhl", pageant: { names: true }')),
        item("pageant-centre", "The score in the middle", call('sport: "nhl", pageant: { score: "centre" }'), "The plate is a little smaller and the carpets keep clear of it."),
        item("pageant-scale", "Smaller pictures", call('sport: "soccer", pageant: { scale: 0.7, score: "strip" }')),
        item("pageant-stage-team", "A stage ringed in the team's colour", call('sport: "nhl", pageant: { style: "stage", ring: "team" }')),
        item("pageant-no-flags", "No marks: the team's colours with its name", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({\n  sport: "nhl",\n  away: { name: "USA", abbr: "USA", score: 3, color: "#1c3f7a" },\n  home: { name: "Canada", abbr: "CAN", score: 2, color: "#d52b1e" },\n  status: "final-ot",\n  pageant: "carpet",\n});`),
        item("pageant-no-flags-stage", "No marks, on stages", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({\n  sport: "nhl",\n  away: { name: "USA", abbr: "USA", score: 3, color: "#1c3f7a" },\n  home: { name: "Canada", abbr: "CAN", score: 2, color: "#d52b1e" },\n  status: "final-ot",\n  pageant: "stage",\n});`, "A team with no picture is its initials on its colour."),
        item("pageant-ratio", "A mark of 2 to 1", `import { drawKyogijo } from "${MAIN}";\n\n${PAGEANT_CODE}\nconst long = { ...canada, logoRatio: 2, logo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20"><rect width="40" height="20" fill="#d52b1e"/><polygon transform="translate(20 10) scale(.2) translate(-50 -42)" points="50,14 55,26 60,23 59,36 72,28 69,39 81,35 77,44 83,53 72,52 74,58 56,55 55,70 44,55 26,58 28,52 17,53 23,44 19,35 31,39 28,28 41,36 40,23 45,26 50,14" fill="#fff"/></svg>' };\nconst svg = drawKyogijo({ sport: "soccer", away: long, home: japan, status: "final", pageant: { score: "strip" } });`, "A carpet is at its mark's own ratio, read from an SVG's viewBox or given as `logoRatio`."),
      ]),
      section("themes", "Dark, a crop and an entrance", "In the dark theme the border, the hairline and the shadow change. A drawing cropped to a `range` shows the carpet in the part that is shown. `animate` is CSS only and for readers who have not asked for less motion; a picture here is the finished drawing.", [
        item("pageant-dark", "Dark theme", call('sport: "soccer", theme: "dark", pageant: { emblem: cup }')),
        item("pageant-dark-stage", "Dark theme, stages", call('sport: "nhl", theme: "dark", pageant: "stage"')),
        item("pageant-range", "Cropped to the left half", call('sport: "soccer", range: { name: "half", end: "left" }, pageant: { score: "strip" }')),
        item("pageant-compact", "A compact card", call('sport: "nba", size: "compact", pageant: "carpet"')),
        item("pageant-round", "With round marks in the strip", call('sport: "soccer", markShape: "round", pageant: { style: "stage", emblem: cup }')),
        item("pageant-animate", "With an entrance", call('sport: "soccer", pageant: { animate: "unfurl", emblem: cup }'), "The carpets roll out from their ends and the cup grows; the picture shows them finished."),
      ]),
    ],
  };
}

/** The teams of the situation pages: the same two countries on every surface (Canada and the USA on ice and diamond, Mexico and the USA on the gridiron). */
const SIT_OWLS = side("usa", 3);
const SIT_ANCHORS = side("canada", 2);
const SIT_GULLS = side("mexico", 27);
const SIT_BISON = side("usa", 24);

/** The situation of a game: hockey's strength and shootout, baseball's bases and count, football's down and drives. */
function situationPage() {
  const rink = (situation, extra = {}) => drawing({ sport: "nhl", away: SIT_OWLS, home: SIT_ANCHORS, status: "live", ...extra, situation });
  const park = (situation, extra = {}) => drawing({ sport: "mlb", away: { ...SIT_OWLS, score: 4 }, home: { ...SIT_ANCHORS, score: 4 }, status: "Top 7", ...extra, situation });
  const field = (situation, extra = {}) => drawing({ sport: "nfl", away: SIT_GULLS, home: SIT_BISON, status: "live", ...extra, situation });
  const pp = { awaySkaters: 5, homeSkaters: 4, clock: "1:42" };
  const loaded = { bases: [true, true, true], outs: 2, inning: 7, half: "top", balls: 3, strikes: 2 };
  const red = { ballOn: 88, toGo: 7, down: 3, possession: "away" };
  const drive = [
    { from: 25, to: 48, result: "punt" },
    { from: 30, to: 100, result: "touchdown" },
    { from: 20, to: 62, result: "field-goal" },
    { team: "home", from: 25, to: 40, result: "interception" },
  ];
  return {
    slug: "gallery-situation",
    title: "Gallery: the situation of a game",
    ja: "ギャラリー：試合の状況",
    intro: "Hockey's skaters and shootout, baseball's runners, outs and count, and football's down, distance and drives, drawn on the surface, in the badge and in the compact card. The teams are real countries.",
    sections: [
      section("hockey", "Hockey: the strength, the empty net and the shootout", "A pill says the strength (`5v4 PP`), the empty net (`EN`), a delayed penalty and the clock; the attacking zone is tinted in the attacking team's colour. A shootout is a strip of dots across centre ice: a goal filled, a miss hollow, and the rounds after the third apart, as sudden death.", [
        item("situation-pp", "A power play, 5 against 4", rink(pp)),
        item("situation-en", "The goalkeeper pulled, the net ringed", rink({ awaySkaters: 6, homeSkaters: 5, emptyNet: "away" })),
        item("situation-delayed", "A delayed penalty", rink({ delayedPenalty: "home" })),
        item("situation-4v4", "Four against four", rink({ awaySkaters: 4, homeSkaters: 4 })),
        item("situation-so", "A shootout into sudden death", rink({ shootout: { rounds: [[true, false], [true, true], [false, true], [false, false], [true, false]] } }, { status: "final-so" })),
        item("situation-pp-tall", "A power play, tall", rink(pp, { orientation: "portrait" })),
        item("situation-pp-2000", "A power play on the rink of 2000-01", rink(pp, { year: 2000 }), "The blue lines are 73 feet from the end boards, the goal lines 13, and there is no trapezoid."),
        item("situation-pp-zone", "Cropped to the offensive zone", rink(pp, { range: "offensive-zone" })),
        item("situation-olympic", "The Olympic rink, 60 by 26 m", rink({ awaySkaters: 6, homeSkaters: 5, emptyNet: "away" }, { league: "olympic" })),
        item("situation-pp-badge", "The badge", rink(pp, { size: "badge", status: "P3 1:12" })),
        item("situation-pp-compact", "The compact card", rink(pp, { size: "compact", status: "P3 1:12" })),
      ]),
      section("baseball", "Baseball: the bases, the outs and the count", "The occupied bases are lit on the park's diamond, and a scorebug stands behind home plate: the diamond with its runners, the outs, the inning with an arrow for its half, and the count. In the badge and the compact card the scorebug takes the place of the picture of the field.", [
        item("situation-bases-loaded", "Bases loaded, two out, a full count", park(loaded)),
        item("situation-runners", "Runners on first and third", park({ bases: [true, false, true], outs: 1, inning: 3, half: "bottom", balls: 1, strikes: 1 }, { status: "Bottom 3" })),
        item("situation-empty", "Nobody on, nobody out", park({ bases: [false, false, false], outs: 0, inning: 1, half: "top", balls: 0, strikes: 0 }, { status: "Top 1" })),
        item("situation-fenway", "At Fenway Park", park(loaded, { park: "fenway-park" })),
        item("situation-softball", "Softball", park(loaded, { league: "fastpitch" })),
        item("situation-npb", "At Koshien", park(loaded, { park: "hanshin-koshien-stadium" })),
        item("situation-infield", "Cropped to the infield", park(loaded, { range: "infield" })),
        item("situation-bug-badge", "The badge", park(loaded, { size: "badge" })),
        item("situation-bug-compact", "The compact card", park(loaded, { size: "compact" })),
      ]),
      section("football", "Football: the line of scrimmage, the first down and the drives", "The line of scrimmage is blue and the first-down line yellow, the red zone is tinted, and a tag says the down and distance and the yard line. `drive` draws a drive chart: an arrow for each drive, in a lane of its own, with how it ended. The CFL's field is 110 yards with end zones of 20, and a team has three downs.", [
        item("situation-3rd-and-7", "Third and 7 in the red zone", field(red)),
        item("situation-drive-chart", "With a drive chart", field({ ...red, drive })),
        item("situation-goal", "First and goal", field({ ballOn: 96, toGo: "goal", down: 1, possession: "home" })),
        item("situation-cfl", "The CFL: third down on a field of 110 yards", drawing({ sport: "cfl", away: SIT_GULLS, home: SIT_BISON, status: "live", situation: { ballOn: 98, toGo: 12, down: 3, possession: "home" } })),
        item("situation-ifaf", "The IFAF's field", drawing({ sport: "ifaf", away: SIT_GULLS, home: SIT_BISON, status: "live", situation: red })),
        item("situation-ncaa", "The NCAA's field", field(red, { league: "ncaa" })),
        item("situation-1980", "The field of 1980", field(red, { year: 1980 })),
        item("situation-tall", "Tall", field(red, { orientation: "portrait" })),
        item("situation-red-zone", "Cropped to the red zone", field({ ...red, drive: drive.slice(1, 3) }, { range: "red-zone" })),
        item("situation-night", "Under a night look", field(red, { look: "night" })),
        item("situation-football-badge", "The badge", field(red, { size: "badge", status: "Q3 4:21" })),
        item("situation-football-compact", "The compact card", field(red, { size: "compact", status: "Q3 4:21" })),
      ]),
      section("themes", "Dark, and in Japanese", "The pill, the scorebug and the tag take the score panel's colours, so they follow the theme; the words of the description follow `language`.", [
        item("situation-dark-hockey", "Hockey, dark", rink(pp, { theme: "dark" })),
        item("situation-dark-baseball", "Baseball, dark", park(loaded, { theme: "dark" })),
        item("situation-dark-football", "Football, dark", field({ ...red, drive }, { theme: "dark" })),
        item("situation-ja-badge", "The badge in Japanese", field(red, { size: "badge", language: "ja", status: "Q3 4:21" })),
        item("situation-ja-field", "The field in Japanese", field(red, { language: "ja" })),
      ]),
    ],
  };
}

/** The eight swimmers of the pool pages' races, in code: made-up names, the three letters of the country each swims for (no flag: a snippet cannot await Hata's flag()) and the splits at 50, 100, 150 and 200 m. */
const SWIMMERS_CODE = `const swimmers = [
  [4, "Ivo Lindqvist", "SWE", 0.64, [25.31, 52.28, 79.6, 106.12]],
  [5, "Mateo Varga", "HUN", 0.67, [25.55, 52.6, 79.95, 106.48]],
  [3, "Oskar Dahl", "NOR", 0.61, [25.12, 52.3, 79.98, 106.92]],
  [6, "Ren Takahashi", "JPN", 0.7, [25.8, 53.02, 80.4, 107.15]],
  [2, "Callum Rhodes", "AUS", 0.66, [25.7, 52.95, 80.66, 107.8]],
  [7, "Pavel Novak", "CZE", 0.69, [26.01, 53.4, 81.02, 108.21]],
  [8, "Jonas Berg", "CAN", 0.72, [26.1, 53.55, 81.38, 108.77]],
  [1, "Daniel Okoro", "USA", 0.74, [26.2, 53.71, 81.45, 108.9]],
].map(([lane, name, abbr, reaction, splits]) => ({ lane, name, abbr, reaction, splits }));`;

/** A snippet that draws a swimming pool with the eight swimmers: `pool` the pool's own options (each ending in a comma), `race` the race's own, `swimmers` what the list is made into, `top` more options of the drawing. */
const raceCode = ({ pool = "", race = "", swimmers = "swimmers", top = "" } = {}) =>
  `import { drawKyogijo } from "${MAIN}";\n\n${SWIMMERS_CODE}\nconst svg = drawKyogijo({ sport: "swimming"${top}, pool: { ${pool}race: { event: "Men's 200 m freestyle, final (made up)", distance: 200, ${race}swimmers: ${swimmers} } } });`;

/** Swimming, water polo, diving and artistic swimming. */
function poolsPage() {
  return {
    slug: "gallery-pools",
    title: "Gallery: swimming, water polo, diving and artistic swimming",
    ja: "ギャラリー：競泳、水球、飛込、アーティスティックスイミング",
    intro: "The four pools from World Aquatics' Competition Regulations: the swimming pool in 50 and 25 m, the water polo field, the diving well and the artistic swimming area, with the looks of the water and the deck, a side section, the lanes of a made-up race with their flags, results, splits and pace, a frame of a race replay, the split pace chart and a natatorium.",
    sections: [
      section("pools", "Each pool", "`sport` is `swimming`, `waterpolo`, `diving` or `artisticswimming`; `pool` has the course, the lanes, the boards and the area.", [
        item("pools-long", "Swimming: the 50 m pool of eight lanes", drawing({ sport: "swimming" }), "Ropes green, blue and yellow with red floats within 5 m of the walls, the lane markings and their cross lines, the blocks, the touch panels, the backstroke flags at 5 m and the false start rope at 15 m."),
        item("pools-ten", "Swimming: ten lanes, numbered 0 to 9", drawing({ sport: "swimming", pool: { lanes: 10 } }), "Lanes 0 and 9 are 2.4 m wide with spaces of 0.1 m outside them in a permanent pool; `temporary: true` is the 26 m pool."),
        item("pools-short", "Swimming: the 25 m short course", drawing({ sport: "swimming", pool: { course: "short" } }), "Eight lanes of 2.5 m with spaces of 0.5 m make a pool 21 m wide."),
        item("pools-warmup", "Swimming: a warm-up pool", drawing({ sport: "swimming", pool: { course: "short", kind: "warm-up" } }), "The same lanes and ropes, without blocks, panels, flags or the false start rope."),
        item("pools-polo", "Water polo: the field of play", drawing({ sport: "waterpolo" }), "25 by 20 m between the goal lines: the ropes red to 2 m, yellow to 6 m and green to the half distance line, the 2, 5 and 6 m lines, the goals, the re-entry areas, the referees' platforms, the table and the substitution areas."),
        item("pools-diving", "Diving: the 1 and 3 m springboards and the 5, 7.5 and 10 m platforms", drawing({ sport: "diving" }), "Each board at the distances of Appendix 2, seen from above, with its plummet; the three lines across the well."),
        item("pools-diving-all", "Diving: every platform", drawing({ sport: "diving", pool: { platforms: [1, 3, 5, 7.5, 10] } })),
        item("pools-artistic", "Artistic swimming: the Olympic area", drawing({ sport: "artisticswimming" }), "30 by 20 m, the lines along the floor, the judges' platform and the starting platform at centre stage."),
        item("pools-artistic-least", "Artistic swimming: the least area", drawing({ sport: "artisticswimming", pool: { area: "minimum" } }), "25 by 15 m with a deep part of 12 by 12 m."),
      ]),
      section("looks", "The look of the water and the deck", "`pool.look` is `flat` (the default), `water` (a faint, seeded net of light) or `tiled`; `pool.deck` is `plain` or `tiled`; `pool.section` adds a side section with the depth.", [
        item("looks-water", "The water look, from a seed", drawing({ sport: "swimming", pool: { look: "water", seed: 3 } }), "The same seed draws the same light; the light is one small pattern, defined once."),
        item("looks-tiled", "Tiles on the floor and the deck", drawing({ sport: "swimming", pool: { look: "tiled", deck: "tiled" } })),
        item("looks-section", "A side section", drawing({ sport: "swimming", pool: { look: "water", section: true } }), "The depth, the blocks and panels, the flags 5 m from each end, the false start rope at 15 m and the least depth the rules ask of the water near a wall with blocks. The height is exaggerated."),
        item("looks-dark", "Swimming, dark", drawing({ sport: "swimming", theme: "dark", pool: { look: "water" } })),
        item("looks-night", "Water polo, the night look", drawing({ sport: "waterpolo", look: "night", pool: { look: "water" } })),
        item("looks-tall", "Swimming, tall", drawing({ sport: "swimming", orientation: "portrait", pool: { look: "water" } })),
        item("looks-polo-tall", "Water polo, tall", drawing({ sport: "waterpolo", orientation: "portrait" })),
        item("looks-chalk", "Diving, chalkboard, with its parts named", drawing({ sport: "diving", look: "chalkboard", landmarks: true })),
      ]),
      section("races", "The lanes of a race", "`pool.race` gives each swimmer a lane, a name, a flag you pass as SVG or an address, and, once the race is swum, the time, the reaction time and the splits. Places come from the times; the first three get a medal.", [
        item("race-start", "A start list: the lane, the country, the name and the entry time", raceCode({ swimmers: "swimmers.map(({ splits, reaction, ...s }) => ({ ...s, seed: splits[3] + 0.4 }))" }), "With no results, the entry times are shown."),
        item("race-results", "The results: places, times, reaction times and splits", raceCode({ pool: "look: \"water\", " }), "Swimmers sit in the order of their lanes; the splits are written under each time."),
        item("race-pace", "Split pace bars", raceCode({ pool: "look: \"water\", ", race: "pace: true, " }), "Each lane is the whole race laid out flat: each split a bar as long as its share of the race, in a colour from the field's slowest pace to its fastest."),
        item("race-short", "A 100 m race in a short course pool", `import { drawKyogijo } from "${MAIN}";\n\nconst swimmers = [[4, "Ivo Lindqvist", [11.5, 23.74, 35.8, 47.9]], [5, "Mateo Varga", [11.62, 23.9, 36.1, 48.21]], [3, "Oskar Dahl", [11.3, 23.65, 36.0, 48.4]], [6, "Ren Takahashi", [11.75, 24.1, 36.45, 48.66]]].map(([lane, name, splits]) => ({ lane, name, splits }));\nconst svg = drawKyogijo({ sport: "swimming", pool: { course: "short", lanes: 6, look: "water", race: { event: "Men's 100 m freestyle, short course (made up)", swimmers } } });`, "A split every 25 m."),
        item("race-tall", "A race, tall", raceCode({ top: ', orientation: "portrait"' }), "The names and times lie along the lanes; the numbers in the discs stay upright."),
        item("race-dnf", "A disqualification, a swimmer who did not start", `import { drawKyogijo } from "${MAIN}";\n\nconst swimmers = [{ lane: 4, name: "A. Swimmer", time: 49.12, reaction: 0.62 }, { lane: 5, name: "B. Swimmer", time: 49.4, reaction: 0.66 }, { lane: 3, name: "C. Swimmer", status: "dq", time: 48.98 }, { lane: 6, name: "D. Swimmer", status: "dns" }];\nconst svg = drawKyogijo({ sport: "swimming", pool: { race: { event: "Men's 50 m freestyle, final (made up)", swimmers } } });`),
      ]),
      section("data", "Charts and a replay", "`splitsChart` from `/charts` is the pace bars with a title, a summary and a table; `raceTimeline` from `/replay` plays the splits as swimmers going down their lanes and back.", [
        item("chart-splits", "The split pace chart", `import { splitsChart } from "${MAIN}/charts";\n\n${SWIMMERS_CODE}\nconst chart = splitsChart({ event: "Men's 200 m freestyle, final (made up)", distance: 200, swimmers }, { pool: { look: "water" } });\nconst svg = chart.draw();`, "The chart also gives `chart.totals` (the fastest split of the field) and `chart.table()`."),
        item("replay-race", "A frame of the race replay, 75 seconds after the signal", `import { drawFrame, raceTimeline } from "${MAIN}/replay";\n\n${SWIMMERS_CODE}\nconst pool = { look: "water", race: { event: "Men's 200 m freestyle, final (made up)", distance: 200, swimmers, show: { results: false } } };\nconst timeline = raceTimeline({ pool });\nconst svg = drawFrame({ sport: "swimming", pool }, timeline, 75, { trail: 3, trailOf: ["home"] });`, "The marks are the swimmers, numbered by lane, moving from the splits; the clock and the controls are the replay's own."),
        item("zones-lanes", "Heat by lane", `import { drawKyogijo } from "${MAIN}";\n\nconst data = Array.from({ length: 240 }, (_, i) => ({ x: 20 + ((i * 37) % 120), y: 4 + ((i * 17) % 76) }));\nconst svg = drawKyogijo({ sport: "swimming", layers: [{ kind: "zones", zones: "pool-lanes", data, labels: { show: ["name", "value"] }, legend: true }] });`, "The zone set `pool-lanes` counts marks into the lanes."),
      ]),
      section("hall", "A natatorium", "`pool.venue` sets several pools in one hall, to scale, at least 8 m apart (10 m by default), with the deck round them drawn once.", [
        item("hall-flat", "The competition pool, the diving well and a warm-up pool", drawing({ sport: "swimming", pool: { venue: "natatorium" } })),
        item("hall-water", "The same hall in water and tiles", drawing({ sport: "swimming", pool: { venue: "natatorium", look: "water", deck: "tiled" } })),
        item("hall-own", "A hall of your own: a water polo pool and an artistic swimming area", drawing({ sport: "swimming", pool: { venue: { pools: [{ sport: "waterpolo" }, { sport: "artisticswimming" }, { sport: "swimming", course: "short", lanes: 6, kind: "warm-up" }], apart: 12 } } })),
      ]),
      section("scores", "A score, a part of the pool and its parts named", "A dual meet's points, a water polo match, a crop to the first 15 m of a pool or the goal area, and the parts of the pool named.", [
        item("pool-score-swimming", "A dual meet", drawing({ sport: "swimming", ...GAMES.swimming })),
        item("pool-score-polo", "A water polo match", drawing({ sport: "waterpolo", ...GAMES.waterpolo })),
        item("pool-score-diving-badge", "Diving, as a strip", drawing({ sport: "diving", ...GAMES.diving, size: "badge" })),
        item("pool-range-end", "Swimming: the end of the pool to the 15 m mark", drawing({ sport: "swimming", range: "pool-end" })),
        item("pool-range-goal", "Water polo: the goal area", drawing({ sport: "waterpolo", range: "goal-area" })),
        item("pool-range-boards", "Diving: the springboards", drawing({ sport: "diving", range: "springboards" })),
        item("pool-range-stage", "Artistic swimming: centre stage", drawing({ sport: "artisticswimming", range: "centre-stage" })),
        item("pool-landmarks", "Swimming, with its parts named", drawing({ sport: "swimming", landmarks: true })),
      ]),
    ],
  };
}


const ATH_FLAGS = `const flag = (a, b, c) => \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="1" height="2" fill="\${a}"/><rect x="1" width="1" height="2" fill="\${b}"/><rect x="2" width="1" height="2" fill="\${c}"/></svg>\`;
const field = [
  { lane: 1, name: "Bromell", country: "USA", flag: flag("#b22234", "#fff", "#3c3b6e") },
  { lane: 2, name: "Hughes", country: "GBR", flag: flag("#012169", "#fff", "#c8102e") },
  { lane: 3, name: "Jacobs", country: "ITA", flag: flag("#009246", "#fff", "#ce2b37") },
  { lane: 4, name: "Kerley", country: "USA", flag: flag("#b22234", "#fff", "#3c3b6e") },
  { lane: 5, name: "Thompson", country: "JAM", flag: flag("#009b3a", "#000", "#fed100") },
  { lane: 6, name: "Simbine", country: "RSA", flag: flag("#007749", "#e03c31", "#001489") },
];`;

/** The athletics stadium: the oval, its starts and finish, the field events, the covered track, the looks and the data. */
function athleticsPage() {
  const a = (opts) => drawing({ sport: "athletics", ...opts });
  const start = (race, extra = {}) => a({ range: "start", athletics: { start: race, ...extra } });
  const layoutOf = (event) => a({ athletics: { layout: event } });
  return {
    slug: "gallery-athletics",
    title: "Gallery: the athletics stadium",
    ja: "陸上競技場",
    intro: "The 400 m track of World Athletics' Facilities Manual with its staggers, curved starts, relay zones and hurdles, the steeplechase's water jump, every field event, a close-up of each start and the finish, the covered 200 m track and the data: lane draws, results, a race replay and the marks of throws and jumps.",
    sections: [
      section("stadium", "The stadium", "`sport: \"athletics\"`: eight lanes of 1.22 m, a grass infield with the soccer pitch inside it, and each field event where the Marking Plan puts it.", [
        item("ath-stadium", "The stadium", a({})),
        item("ath-stadium-tall", "The stadium, tall", a({ orientation: "portrait" })),
        item("ath-blue", "A blue track, nine lanes", a({ athletics: { track: "blue", lanes: 9 } })),
        item("ath-grass", "Grass inside, no pitch", a({ athletics: { infield: "grass" } })),
        item("ath-ground", "A stadium that has a track", a({ ground: "stade-de-france" }), "The pitch is the ground's own size."),
        item("ath-score", "A relay final, with a score", drawing({ sport: "athletics", ...GAMES.athletics })),
        item("ath-line", "Line drawing, for a printer", a({ look: "line-drawing", athletics: { races: "all" } }), "Black lines on white, with no colour on the track."),
        item("ath-night", "Night", a({ look: "night" })),
      ]),
      section("races", "Staggers, hurdles and relays", "`races` marks the start lines, the breakline, the exchange zones and the hurdles of the races you name, or of `\"all\"`.", [
        item("ath-200", "200 m: the stagger is half of 400 m's", a({ athletics: { races: ["200m"] } }), "Lane 8 starts 26.515 m ahead of lane 1 (Table 2.2.1.6a)."),
        item("ath-400", "400 m: a stagger of 7.037 to 53.030 m", a({ athletics: { races: ["400m"] } })),
        item("ath-800", "800 m: the breakline", a({ athletics: { races: ["800m"] } }), "The runners keep their lanes to the line across the track at the end of the first bend."),
        item("ath-4x100", "4 x 100 m: the exchange zones", a({ athletics: { races: ["4x100m"] } })),
        item("ath-4x400", "4 x 400 m: zones and breakline", a({ athletics: { races: ["4x400m"] } })),
        item("ath-hurdles", "The hurdles: 100 m, 110 m and 400 m", a({ athletics: { races: ["100m-hurdles", "110m-hurdles", "400m-hurdles"] } })),
        item("ath-1500", "1500 m: the curved start line", a({ athletics: { races: ["1500m"] } })),
        item("ath-all", "Every race at once", a({ athletics: { races: "all" } })),
        item("ath-straight", "A ten-lane straight", a({ athletics: { races: ["100m"], straightLanes: 10 } })),
      ]),
      section("steeplechase", "The steeplechase", "`waterJump` puts the pit inside the bend or outside it; the lap, the hurdles and the start of the 3000 m follow.", [
        item("ath-sc-inside", "Water jump inside", a({ athletics: { races: ["3000m-steeplechase"], waterJump: "inside" } })),
        item("ath-sc-outside", "Water jump outside", a({ athletics: { races: ["3000m-steeplechase"], waterJump: "outside" } })),
        item("ath-sc-pit", "The water jump", a({ range: "water-jump", athletics: { races: ["3000m-steeplechase"] } })),
      ]),
      section("starts", "A close-up of each start, and the finish", "`range: \"start\"` with `athletics.start` turns the track so that the athletes run to the right (up the page in portrait), with the lane numbers painted behind the line.", [
        item("ath-start-100", "100 m", start("100m")),
        item("ath-start-110h", "110 m hurdles", start("110m-hurdles")),
        item("ath-start-200", "200 m", start("200m")),
        item("ath-start-400", "400 m", start("400m")),
        item("ath-start-800", "800 m", start("800m")),
        item("ath-start-1500", "1500 m: the waterfall", start("1500m"), "The curved line is an involute of lane 1's circle, so every runner is as far from the finish by the shortest way."),
        item("ath-start-400-tall", "400 m, tall", a({ range: "start", orientation: "portrait", athletics: { start: "400m" } })),
        item("ath-start-line", "A start in ink", a({ range: "start", look: "line-drawing", athletics: { start: "400m" } }), "The same close-up in `look: \"line-drawing\"`."),
        item("ath-finish", "The finish", a({ range: "finish" })),
        item("ath-finish-tall", "The finish, tall", a({ range: "finish", orientation: "portrait" })),
      ]),
      section("events", "The field events", "`events` switches each one on or off; `layout` draws one alone at a large scale.", [
        item("ath-events-two", "Two events only", a({ athletics: { events: ["shot-put", "high-jump"] } })),
        item("ath-events-none", "The track alone", a({ athletics: { events: false } })),
        item("ath-hj", "High jump", layoutOf("high-jump")),
        item("ath-pv", "Pole vault", layoutOf("pole-vault")),
        item("ath-lj", "Long jump", layoutOf("long-jump")),
        item("ath-tj", "Triple jump", layoutOf("triple-jump")),
        item("ath-sp", "Shot put", layoutOf("shot-put")),
        item("ath-dt", "Discus throw", layoutOf("discus-throw"), "The cage, and the 34.92 degree sector."),
        item("ath-ht", "Hammer throw", layoutOf("hammer-throw")),
        item("ath-jt", "Javelin throw", layoutOf("javelin-throw"), "The runway, the 8 m arc and the 28.96 degree sector."),
      ]),
      section("indoor", "The covered track", "`league: \"world-athletics-short\"`: a 200 m banked track of six lanes with a 60 m straight.", [
        item("ath-indoor", "The covered track", a({ league: "world-athletics-short" })),
        item("ath-indoor-400", "The covered 400 m", a({ league: "world-athletics-short", athletics: { races: ["400m"] } })),
        item("ath-indoor-60h", "60 m hurdles", a({ league: "world-athletics-short", athletics: { races: ["60m-hurdles"] } })),
      ]),
      section("parts", "A part of the track", "`range` crops to a named part.", [
        item("ath-bend", "A bend", a({ range: "bend" })),
        item("ath-home", "The home straight", a({ range: "home-straight" })),
        item("ath-infield", "The infield", a({ range: "infield" })),
      ]),
      section("data", "The data", "`@johnmorrisdotca/kyogijo-stadiums/athletics`: the lane draw, the results, a replay and the marks of throws and jumps.", [
        item("ath-lane-draw", "A lane draw", `import { laneDraw } from "${MAIN}/athletics";\n\n${ATH_FLAGS}\nconst svg = laneDraw(field, { race: "100m" }).draw();`, "Names and flags behind the start line; the caller passes the flags as SVG."),
        item("ath-lane-draw-400", "A lane draw, 400 m", `import { laneDraw } from "${MAIN}/athletics";\n\n${ATH_FLAGS}\nconst svg = laneDraw(field, { race: "400m" }).draw();`, "Each athlete stands at the stagger of the lane."),
        item("ath-results", "Results", `import { raceResults } from "${MAIN}/athletics";\n\n${ATH_FLAGS}\nconst results = field.map((entry, i) => ({ ...entry, place: [4, 5, 2, 1, 3, 6][i], time: 9.8 + [3, 5, 1, 0, 2, 6][i] * 0.03, reaction: 0.13 + i * 0.01, splits: [{ distance: 50, time: 5.6 + i * 0.01 }] }));\nconst svg = raceResults(results, { race: "100m" }).draw();`, "The medals, the times, the reaction times and the splits."),
        item("ath-replay", "A race replay, the 400 m", `import { raceReplay } from "${MAIN}/athletics";\nimport { drawFrame } from "${MAIN}/replay";\n\nconst runners = Array.from({ length: 8 }, (_, i) => ({ lane: i + 1, name: "Runner " + (i + 1), time: 44.2 + i * 0.25, reaction: 0.14 }));\nconst replay = raceReplay(runners, { race: "400m" });\nconst svg = drawFrame(replay.options, replay.timeline, 20, replay.look);`, "Each runner is on the curve of the lane, starting at its stagger; at 20 seconds the field is on the back straight."),
        item("ath-marks", "Throws: the best mark", `import { fieldMarks } from "${MAIN}/athletics";\n\nconst attempts = [{ athlete: "A", distance: 84.2, across: 2 }, { athlete: "A", distance: 88.1, across: -4 }, { athlete: "A", valid: false }, { athlete: "A", distance: 90.7, across: 6 }, { athlete: "A", distance: 86, across: -1 }];\nconst svg = fieldMarks("javelin-throw", attempts, { surface: { athletics: { layout: "javelin-throw" } } }).draw();`, "A foul is marked where it was thrown; the best valid mark is picked out."),
        item("ath-marks-lj", "Jumps in the pit", `import { fieldMarks } from "${MAIN}/athletics";\n\nconst jumps = [{ athlete: "B", distance: 8.1 }, { athlete: "B", distance: 8.46, across: 0.3 }, { athlete: "B", distance: 8.28, across: -0.2 }];\nconst svg = fieldMarks("long-jump", jumps, { surface: { athletics: { layout: "long-jump" } }, labels: true }).draw();`),
      ]),
    ],
  };
}

const SKATE_FLAGS = `const flag = (a, b, c) => \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="1" height="2" fill="\${a}"/><rect x="1" width="1" height="2" fill="\${b}"/><rect x="2" width="1" height="2" fill="\${c}"/></svg>\`;
const ned = flag("#ae1c28", "#fff", "#21468b");
const nor = flag("#ba0c2f", "#00205b", "#fff");`;

/** The skating rinks: the long track, the short track and the figure skating rink, their lines and the data. */
function skatingPage() {
  const a = (opts) => drawing({ sport: "skating", ...opts });
  const short = (opts) => a({ league: "isu-short-track", ...opts });
  const figure = (opts) => a({ league: "isu-figure", ...opts });
  return {
    slug: "gallery-skating",
    title: "Gallery: the skating rinks",
    ja: "スケートリンク",
    intro: "The standard 400 m speed skating track with its two lanes, warm-up lane, blocks and the lines of every race, the 111.12 m short track oval on its rink, the figure skating rink with its judges' seats, and the data: pairs, starting positions, results, a race replay and the elements of a programme.",
    sections: [
      section("long", "The long track", "`sport: \"skating\"`, the long track by default: an inner lane of 4 m and an outer lane of at least 4 m, the warm-up lane inside, the blocks of the curves, the coaches' area on the crossing straight and the finishing line.", [
        item("ska-long", "The standard 400 m track", a({})),
        item("ska-long-tall", "The track, tall", a({ orientation: "portrait" })),
        item("ska-long-races", "The lines of every race", a({ skating: { races: "all" } }), "The 500 m on the 300 m mark, the 1000 m's finish in the middle of the straight, the 1500 m, 3000 m and 5000 m on the crossing straight, the mass start and the team races in the middle of the straights."),
        item("ska-long-26", "An inner curve of 26 m, an outer lane of 5 m", a({ skating: { innerRadius: 26, laneWidth: 5 } }), "The straight follows, so that a lap stays 400 m (110.43 m for 26 m)."),
        item("ska-long-bare", "Without the warm-up lane, blocks and padding", a({ skating: { warmUp: false, blocks: false, coaches: false, padding: false } })),
        item("ska-long-ice", "The infield iced", a({ skating: { infield: "ice" } })),
        item("ska-long-line", "Line drawing", a({ look: "line-drawing", skating: { races: "all" } })),
        item("ska-long-night", "Night", a({ look: "night" })),
        item("ska-long-score", "A team race, with a score", drawing({ sport: "skating", ...GAMES.skating })),
      ]),
      section("starts", "A close-up of each start, and the finish", "`range: \"start\"` with `skating.start` shows the starting lines of the race, each lane's at the distance from the finish its own curve makes.", [
        item("ska-start-500", "500 m", a({ range: "start", skating: { start: "500m" } })),
        item("ska-start-1000", "1000 m", a({ range: "start", skating: { start: "1000m" } }), "The lane's lines stand 6.25 m and 6.32 m from the middle of the crossing straight: no lane is changed on its first straight."),
        item("ska-start-1500", "1500 m", a({ range: "start", skating: { start: "1500m" } })),
        item("ska-start-3000", "3000 m and 5000 m", a({ range: "start", skating: { start: "3000m" } }), "The two lanes' lines are 12.57 m apart, the difference of the curves."),
        item("ska-start-mass", "Mass start", a({ range: "start", skating: { start: "mass-start" } })),
        item("ska-start-team", "Team pursuit", a({ range: "start", skating: { start: "team-pursuit" } })),
        item("ska-finish", "The finish", a({ range: "finish" })),
        item("ska-crossing", "The crossing straight", a({ range: "crossing-straight" })),
        item("ska-bend", "A curve", a({ range: "first-bend" })),
      ]),
      section("short", "The short track", "`league: \"isu-short-track\"`: an oval of 111.12 m on a rink of 60 by 30 m, seven blocks in each curve, five or seven tracks laid out beside the standard one.", [
        item("ska-short", "The short track", short({})),
        item("ska-short-races", "The starting lines of the half-lap races", short({ skating: { races: ["500m", "1000m", "1500m"] } }), "The 500 m and the 1500 m start on the straight opposite the finishing line, the others at it; the five dots of the 500 m and the 1000 m are the starting positions."),
        item("ska-short-seven", "Seven tracks", short({ skating: { tracks: 7, races: ["500m"] } })),
        item("ska-short-start", "A close-up of the 500 m's start", short({ range: "start", skating: { start: "500m" } })),
        item("ska-short-finish", "The finishing line", short({ range: "finish" })),
        item("ska-short-bend", "A curve with its seven blocks", short({ range: "first-bend" })),
        item("ska-short-line", "Line drawing", short({ look: "line-drawing", skating: { races: ["500m"] } })),
      ]),
      section("figure", "The figure skating rink", "`league: \"isu-figure\"`: 60 m by 30 m if possible and never less than 56 m by 26 m, with the judges and the referee at the rinkboard, the technical panel and the kiss and cry.", [
        item("ska-figure", "The rink", figure({})),
        item("ska-figure-small", "The smallest rink: 56 m by 26 m", figure({ skating: { rink: { length: 56, width: 26 } } })),
        item("ska-figure-bare", "The ice alone", figure({ skating: { furniture: false } })),
        item("ska-figure-judges", "The judges", figure({ range: "judges" })),
        item("ska-figure-half", "One half", figure({ range: "half" })),
        item("ska-figure-tall", "The rink, tall", figure({ orientation: "portrait" })),
      ]),
      section("data", "The data", "`@johnmorrisdotca/kyogijo-stadiums/skating`: the pairs of a race, the starting positions, the results, a replay and the elements of a programme.", [
        item("ska-pairs", "A pair on the start of the 1000 m", `import { skatingPairs } from "${MAIN}/skating";\n\n${SKATE_FLAGS}\nconst svg = skatingPairs([{ pair: 1, inner: { name: "Nuis", country: "NED", flag: ned }, outer: { name: "Stolz", country: "NED", flag: ned } }, { pair: 2, inner: { name: "Kulizhnikov" }, outer: { name: "Lundin", country: "NOR", flag: nor } }], { race: "1000m" }).draw();`, "The inner lane's armband is white and the outer's red (Rule 253.3.1)."),
        item("ska-grid", "The starting positions of a short track race", `import { skatingGrid } from "${MAIN}/skating";\n\nconst svg = skatingGrid([{ position: 1, name: "Hwang" }, { position: 2, name: "Liu" }, { position: 4, name: "Shaoang" }], { race: "500m" }).draw();`),
        item("ska-results", "Results", `import { skatingResults } from "${MAIN}/skating";\n\nconst results = [\n  { name: "Nuis", place: 1, time: 67.8, lane: "inner", pair: 1, splits: [{ distance: 200, time: 17.3 }, { distance: 600, time: 45.1 }] },\n  { name: "Stolz", place: 2, time: 68.2, lane: "outer" },\n  { name: "Kulizhnikov", place: 3, time: 68.9 },\n  { name: "Lundin", place: 4, time: 69.1 },\n];\nconst svg = skatingResults(results, { race: "1000m" }).draw();`, "The medals and the times in the middle of the ice, and the splits along the lane."),
        item("ska-replay", "A race replay, the 1000 m", `import { skatingReplay } from "${MAIN}/skating";\nimport { drawFrame } from "${MAIN}/replay";\n\nconst replay = skatingReplay([{ name: "A", lane: "inner", time: 68 }, { name: "B", lane: "outer", time: 69 }], { race: "1000m" });\nconst svg = drawFrame(replay.options, replay.timeline, 30, replay.look);`, "Each skater is on his own way: the first straight of the 1000 m in one lane, then a lane changed on every crossing."),
        item("ska-replay-short", "A short track replay", `import { skatingReplay } from "${MAIN}/skating";\nimport { drawFrame } from "${MAIN}/replay";\n\nconst replay = skatingReplay([{ name: "A", position: 1, time: 40 }, { name: "B", position: 3, time: 41 }, { name: "C", position: 5, time: 41.4 }], { race: "500m", surface: { league: "isu-short-track" } });\nconst svg = drawFrame(replay.options, replay.timeline, 10, replay.look);`),
        item("ska-elements", "The elements of a programme on the ice", `import { figureElements } from "${MAIN}/skating";\n\nconst svg = figureElements([\n  { kind: "jump", name: "3Lz", x: -18, y: 5, order: 1 },\n  { kind: "spin", name: "CCoSp4", x: 2, y: -4, order: 2 },\n  { kind: "step-sequence", name: "StSq3", x: -24, y: -9, x2: 22, y2: -9, order: 3 },\n  { kind: "jump", name: "3F", x: 20, y: 6, order: 4 },\n]).draw();`, "A mark for each element where it starts, a shape for its kind, the track of a sequence as a dashed line."),
      ]),
    ],
  };
}

/** A snippet that draws a tournament layout. */
// The gallery dresses each layout with sample content (an invented event, `sample: true`); the one picture of the empty places is `multi(options, false)`.
const multi = (options, sample = true) => `import { drawMulti } from "${MAIN}/multi";\n\nconst svg = drawMulti(${literal(sample ? { ...options, sample: true } : options)});`;

function multiPage() {
  return {
    slug: "gallery-multi",
    title: "Gallery: tournament layouts",
    ja: "大会向けレイアウト",
    intro: "Several of the package's surfaces laid out together for one large event, to scale, on one floor: table tennis, pickleball, curling, judo, karate, badminton and tennis, each from its rule; then the same layouts set in a hall whose floor is published, with the real stadium round them switched on. The empty dashed places are for the event's own words and marks: nothing real is printed in them.",
    sections: [
      section("tabletennis", "Table tennis", "Areas of 14 m by 7 m (ITTF Statutes 2026, chapter 3, 3.2.3.1), each enclosed by barriers (50 to 100 cm high in the rule, 75 cm drawn), with an umpire's chair and a score table, and one scoreboard hung over the middle for all of them, as at the Worlds in London in 2026.", [
        item("multi-tt4", "Four areas on one floor (2 x 2)", multi({ preset: "tabletennis-4" })),
        item("multi-tt8", "Eight areas (2 x 4)", multi({ preset: "tabletennis-8" })),
        item("multi-tt4-empty", "The same four areas with the places left empty", multi({ preset: "tabletennis-4" }, false), "Without `sample`, the places for the event's words and marks are dashed and empty: what an organiser fills."),
        item("multi-tt-staggered", "A staggered grid", multi({ preset: "tabletennis-4", rows: 3, columns: 3, stagger: 0.5 }), "Every other row is moved along by half a bay."),
      ]),
      section("pickleball", "Pickleball", "A playing surface of 34 by 64 feet to each court, the rulebook's recommendation for tournament play (3.A.3); the rulebook names no gap between courts.", [
        item("multi-pb22", "Four courts (2 x 2)", multi({ preset: "pickleball-2x2" })),
        item("multi-pb24", "Eight courts (2 x 4)", multi({ preset: "pickleball-2x4" })),
        item("multi-pb44", "Sixteen courts (4 x 4)", multi({ preset: "pickleball-4x4" }), "Sixteen is the least the PPA Tour asks a host to provide."),
      ]),
      section("curling", "Curling", "Sheets at most 4.75 m wide, at least 45.72 m long (World Curling R1), side by side.", [item("multi-curling", "Four sheets (1 x 4)", multi({ preset: "curling-1x4" }))]),
      section("budo", "Judo and karate", "One coloured floor of mats with the contest areas laid on it in a row (judo) or in rows (karate); the branding is printed on the mats themselves, so the empty places are on the mat.", [
        item("multi-judo3", "Judo, three areas in a row (1 x 3)", multi({ preset: "judo-1x3" }), "10 m areas, a safety area of 4 m, 4 m common between them (IJF 8.7), as at the Worlds in Baku in 2018."),
        item("multi-judo4", "Judo, four areas (1 x 4)", multi({ preset: "judo-1x4" })),
        item("multi-karate6", "Karate, six tatami (2 x 3)", multi({ preset: "karate-2x3" }), "The WKF's Karate1 Series A lays six areas in two rows of three on one carpet."),
        item("multi-karate8", "Karate, eight tatami (2 x 4)", multi({ preset: "karate-2x4" })),
      ]),
      section("rackets", "Badminton and tennis", "Badminton courts always lie side by side, at least 1.5 m apart (BWF 5.3.4) and 4 m recommended at Grade 1 and 2 events; tennis courts 7.32 m apart (a secondary source).", [
        item("multi-badminton4", "Four courts, the spacing recommended for Grade 1 and 2", multi({ preset: "badminton-1x4" })),
        item("multi-badminton4-min", "Four courts, the least spacing", multi({ preset: "badminton-1x4-min" })),
        item("multi-tennis3", "Three tennis courts", multi({ preset: "tennis-1x3" })),
      ]),
      section("halls", "In a hall, and whether it fits", "`venue` sets the layout in a hall whose floor is published and says whether it fits; `stadium: true` draws the real stands and crowd round it, to the same scale. Off by default.", [
        item("multi-hall-ice", "Four curling sheets on an NHL-size ice pad", multi({ preset: "curling-1x4", venue: "nhl-ice-pad" }), "200 by 85 feet: the four sheets fit."),
        item("multi-hall-ice-stadium", "The same, in the arena", multi({ preset: "curling-1x4", venue: "nhl-ice-pad", stadium: true }), "The stands and the crowd are the package's own for a hockey arena."),
        item("multi-hall-wembley", "Four table tennis areas in a hall known only by its area", multi({ preset: "tabletennis-4", venue: "ovo-arena-wembley", stadium: true }), "2,655 m² and no published length or width: the answer is that it may fit."),
        item("multi-hall-copper", "Sixteen pickleball courts in the Copper Box Arena", multi({ preset: "pickleball-4x4", venue: "copper-box-arena" }), "The floor is 60 by 40 m; sixteen courts need 78 by 41.5 m, so the layout hangs over, in dashes."),
        item("multi-hall-budokan", "Three judo areas in the Nippon Budokan", multi({ preset: "judo-1x3", venue: "nippon-budokan", stadium: true }), "An octagon 55 m across the flats: the four corners of the layout are inside it."),
      ]),
      section("themes", "Dark and Japanese", "Every colour is a custom property with a value for dark; the words come in English and Japanese.", [
        item("multi-dark", "Dark", multi({ preset: "tabletennis-4", theme: "dark" })),
        item("multi-ja", "In Japanese", multi({ preset: "judo-1x3", language: "ja" })),
      ]),
    ],
  };
}

/** A snippet that draws a judging assignment. */
const judging = (options, fn = "drawJudging") => `import { ${fn} } from "${MAIN}/judging";\n\nconst svg = ${fn}(${literal(options)});`;

/** Invented names for the judging pictures: five judges, one name too long for its seat, and a second mat with two seats empty. */
const JUDGES_ONE = [
  { seat: 1, name: "Aiko Mori", id: "J-1042" },
  { seat: 2, name: "Daniel Okafor", id: "J-0377" },
  { seat: 3, name: "Sofia Lindqvist-Hernandez", id: "J-2210" },
  { seat: 4, name: "Kenji Watanabe", id: "J-0918" },
  { seat: 5, name: "Marta Kowalczyk", id: "J-1555" },
];
const JUDGES_TWO = [{ seat: 1, name: "Li Wei", id: "J-3001" }, { seat: 3, name: "Priya Raman", id: "J-0042" }, { seat: 5, name: "Tomás Ferreira", id: "J-2764" }];
const OFFICIALS = [
  { seat: "referee", name: "Hana Ito", id: "R-204" },
  { seat: "timekeeper", name: "Sam Cole", id: "T-011" },
  { seat: "scorekeeper", name: "Ana Ruiz", id: "T-012" },
  { seat: "supervisor", name: "Peter Lindqvist-Haraldsson", id: "S-003" },
  { seat: "side-judge-1", name: "Kim Park", id: "J-707" },
];
const JUDGES_SHORT = [
  { seat: 1, name: "Aiko Mori", id: "J-1042" },
  { seat: 2, name: "Dan Okafor", id: "J-0377" },
  { seat: 3, name: "Sofia Berg", id: "J-2210" },
  { seat: 4, name: "Ken Sato", id: "J-0918" },
  { seat: 5, name: "Marta Nowak", id: "J-1555" },
];

function judgingPage() {
  const mat1 = { label: "Mat 1", officials: JUDGES_ONE };
  const mat2 = { label: "Mat 2", officials: JUDGES_TWO };
  return {
    slug: "gallery-judging",
    title: "Gallery: judging assignments",
    ja: "審判員の配置",
    intro: "The officials of each judo mat by seat, with a name and an ID: in the seat where they fit, and in a chart whose rows grow until nothing is cut. The names are invented. Every picture is drawn by the build from the code under it.",
    sections: [
      section("mat", "One mat", "A kata area's five judges. A name that does not fit its seat is in the chart, and a seat with nobody in it says so.", [
        item("judging-mat", "A mat with the chart beside it", judging({ style: "kata", mats: [mat1] }), "The seats are numbers, large and round, and the chart is the key: each name wrapped whole, its ID under it."),
        item("judging-names", "Names on the seats", judging({ style: "kata", mats: [mat1], seatNames: true, focus: "bench" }), "`seatNames: true`: the name in the chart's own face, scaled evenly; Judge 3's name is too long for its seat at a readable size, so that seat shows its number."),
        item("judging-bench", "The judges' bench close up, names on the seats", judging({ style: "kata", mats: [{ label: "Mat 1", officials: JUDGES_SHORT }], focus: "bench", seatNames: true }), "With `seatNames: true` and short names every name is on its seat, and the chart is not drawn."),
        item("judging-bench-chart", "The bench close up, with the chart", judging({ style: "kata", mats: [mat1], focus: "bench", seatNames: true }), "Four names fit their cards; the fifth is a number, and its name is in the chart."),
        item("judging-chart", "The chart alone", judging({ style: "kata", mats: [mat1] }, "judgingChart"), "For a page that puts the chart beside the 3D view."),
      ]),
      section("shiai", "A contest", "A referee on the mat, the timekeeper, the scorekeeper and the referee supervisor at the technical table, and the side judges of an event with no CARE system.", [
        item("judging-shiai", "A contest area", judging({ style: "shiai", mats: [{ label: "Mat 1", officials: OFFICIALS }] }), "The referee's seat is on the mat, 2 m back from the line the athletes start on; the side judge's, at a corner of the contest area (the place is ours)."),
        item("judging-shiai-names", "Names in the seats", judging({ style: "shiai", mats: [{ label: "Mat 1", officials: [{ seat: "referee", name: "Hana Ito", id: "R-204" }, { seat: "timekeeper", name: "Sam Cole", id: "T-011" }, { seat: "scorekeeper", name: "Ana Ruiz", id: "T-012" }, { seat: "supervisor", name: "Eva Roth", id: "S-003" }] }], chart: "never", seatNames: true }), "`seatNames: true`: every name fits its seat, so no chart is needed."),
        item("judging-shiai-bench", "The technical table close up", judging({ style: "shiai", mats: [{ label: "Mat 1", officials: [{ seat: "timekeeper", name: "Sam Cole", id: "T-011" }, { seat: "scorekeeper", name: "Ana Ruiz", id: "T-012" }, { seat: "supervisor", name: "Eva Roth", id: "S-003" }] }], focus: "bench", seatNames: true }), "The referee and the side judges are on the mat and its corners: only the table's seats are in the picture of the bench."),
        item("judging-shiai-side", "With both side judges", judging({ style: "shiai", mats: [{ label: "Mat 1", officials: OFFICIALS }], sideJudges: true })),
      ]),
      section("mats", "Several mats", "One panel for each mat, one under another; a page with a tab for each mat draws one with `mat`.", [
        item("judging-two", "Two mats", judging({ style: "kata", mats: [mat1, mat2] })),
        item("judging-one-of-two", "The second mat alone", judging({ style: "kata", mats: [mat1, mat2], mat: 2 }), "`mat: 2`: one tab of the page."),
      ]),
      section("tablet", "A tablet, both ways up", "Landscape puts the chart beside the plan; portrait puts it under, full width.", [
        item("judging-portrait", "Portrait", judging({ style: "kata", mats: [mat1], orientation: "portrait", width: 768 })),
        item("judging-limits", "The longest name and ID", judging({ style: "kata", mats: [{ label: "A mat with a long name of its own", officials: [{ seat: 1, name: "Maximilian Alexander Friedrich von Hohenlohe-Schillingsfürst und Waldenburg zu Bartenstein", id: "0123456789-0123456789-0123456789-0123456789-0123456789-abcd" }, { seat: 2, name: "Li", id: "J-1" }] }] }), "A name of ninety characters and an ID of sixty are whole: the row grows."),
      ]),
      section("themes", "Dark and Japanese", "Every colour is a custom property with a value for dark; the words come in English and Japanese, and the names are as they were given.", [
        item("judging-dark", "Dark", judging({ style: "kata", mats: [mat1], theme: "dark" })),
        item("judging-ja", "In Japanese", judging({ style: "kata", language: "ja", mats: [{ officials: [{ seat: 1, name: "森 愛子", id: "J-1042" }, { seat: 2, name: "山田 花子", id: "J-0377" }, { seat: 3, name: "ダニエル・オカフォー", id: "J-2210" }] }] })),
      ]),
    ],
  };
}

export const GALLERY_BUILDERS = [surfacesPage, soccerPage, leaguesPage, yearsPage, placesPage, specialPage, dataPage, curlingPage, courtsPage, fieldsPage, poolsPage, athleticsPage, skatingPage, budoPage, stylingPage, rangesPage, layoutsPage, multiPage, judgingPage, pageantPage, situationPage];

/** The sections of every page, with each item's picture made by running its code. */
export function galleryData(lib) {
  return GALLERY_BUILDERS.map((build) => {
    const page = build(lib);
    return { ...page, major: String(lib[MAIN].VERSION).split(".")[0], version: String(lib[MAIN].VERSION), sections: page.sections.map((one) => ({ ...one, items: one.items.map((entry) => ({ ...entry, svg: runSnippet(entry.code, lib) })) })) };
  });
}

/** The base stylesheet is in the page once; a drawing carries it too, which is 8 kB each. The gallery leaves it out of each and says so. */
const STYLE_RE = /<style>[\s\S]*?<\/style>/;

/** Where a gallery item's own files are, beside the pages: its drawing as an SVG file, and a page that draws it from the published package. */
export const itemFiles = (id) => ({ svg: `gallery/${id}.svg`, page: `gallery/${id}.html` });

const itemHtml = (entry, style) => {
  const svg = entry.svg.replace(STYLE_RE, (block) => (block.includes(style.slice(0, 60)) || style.includes(block.slice("<style>".length, -"</style>".length)) ? "" : block));
  const code = escapeHtml(entry.code);
  const files = itemFiles(entry.id);
  return `<figure class="g-item" id="${entry.id}" data-testid="gallery-item">
  <h3 id="t-${entry.id}">${escapeHtml(entry.title)}</h3>
  <div class="g-art" data-testid="gallery-art">${svg}</div>
  ${entry.note ? `<p class="g-note">${escapeHtml(entry.note)}</p>` : ""}
  <div class="g-actions"><button type="button" class="fam-button" data-copy-for="code-${entry.id}" aria-describedby="t-${entry.id}" data-testid="gallery-copy"><span data-copy-label data-docs-copy-label>Copy</span></button><a class="fam-button" href="${files.svg}" download="${entry.id}.svg" aria-describedby="t-${entry.id}" data-testid="gallery-download" data-say="docsDownload">Download SVG</a><a class="fam-button" href="${files.page}" aria-describedby="t-${entry.id}" data-testid="gallery-open" data-say="docsOpenPage">Open in a page</a><span class="g-status" role="status" aria-live="polite"></span></div>
  <p class="g-note g-published" data-say="docsOpenNote">Open in a page loads the published package from jsDelivr, which serves only released versions.</p>
  <details class="g-code"><summary data-say="docsShowCode">Show the code</summary><pre id="code-${entry.id}"><code class="language-ts">${code}</code></pre></details>
</figure>`;
};

/** The address of the package, or one of its entries (`@johnmorrisdotca/kyogijo-stadiums/charts`), on jsDelivr as one ES module, for the published major version. */
export const cdnUrl = (from, major) => `https://cdn.jsdelivr.net/npm/${from.replace(MAIN, `${MAIN}@${major}`)}/+esm`;

/**
 * A page of one HTML file that draws a gallery item: the picture the build drew (shown at once, and kept when the package cannot be loaded) and the snippet, run
 * against the package on jsDelivr. jsDelivr serves only published versions, and the page says so. The imports of the snippet become dynamic ones, so that an entry
 * the published version does not have is reported on the page and does not stop it.
 */
export function standalonePage(entry, major, version) {
  const script = entry.code
    .replace(/^import\s*\{([^}]*)\}\s*from\s*"([^"]+)";?\s*$/gm, (whole, list, from) => `const {${list}} = await import(${JSON.stringify(cdnUrl(from, major))});`)
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n")
    .replace(/<\//g, "<\\/");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(entry.title)} · Kyogijo Stadiums</title>
<style>
:root { color-scheme: light dark; --bg: #f6f4ee; --ink: #1f2320; --muted: #566059; --rule: #cfd3cb; --code: #ecebe4; }
@media (prefers-color-scheme: dark) { :root { --bg: #131716; --ink: #ece8dc; --muted: #a9b2ac; --rule: #2d3430; --code: #1c211f; } }
body { margin: 0 auto; max-width: 60rem; padding: 16px; background: var(--bg); color: var(--ink); font: 16px/1.5 system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Noto Sans JP", sans-serif; }
h1 { font-size: 1.4rem; margin: .4em 0; }
#art svg { max-width: 100%; height: auto; }
#art svg[data-orientation="portrait"] { max-height: 80vh; width: auto; }
pre { overflow: auto; padding: 12px; border: 1px solid var(--rule); border-radius: 10px; background: var(--code); font-size: .85rem; }
.note { color: var(--muted); font-size: .9rem; }
</style>
</head>
<body>
<h1>${escapeHtml(entry.title)}</h1>
${entry.note ? `<p class="note">${escapeHtml(entry.note)}</p>\n` : ""}<div id="art">${entry.svg}</div>
<p id="status" class="note" role="status">The picture above was drawn when the docs were built. The script below draws it again with the published package.</p>
<pre><code>${escapeHtml(entry.code)}</code></pre>
<p class="note">This page imports the package from <a href="https://www.jsdelivr.com/package/npm/${MAIN}">jsDelivr</a> (major version ${escapeHtml(major)}), which serves only versions that have been published to npm. A feature added after the last release is not in it: the page then keeps the picture above and says why. The docs were built from version ${escapeHtml(version)}.</p>
<script type="module">
const art = document.getElementById("art");
const status = document.getElementById("status");
try {
${script}
  if (typeof svg !== "string" || !svg.startsWith("<svg")) throw new Error("the snippet did not set svg to an SVG string");
  art.innerHTML = svg;
  status.textContent = "Drawn just now by the published package from jsDelivr.";
} catch (error) {
  status.textContent = "The published package could not draw this: " + (error && error.message ? error.message : String(error)) + ". It may not have a release with this feature yet; the picture above is the build's.";
}
</script>
</body>
</html>
`;
}

/** A gallery page as HTML for docs-pages.mjs: `{ slug, title, description, html, headings }`. `style` is `KYOGIJO_STYLE`, put in the page once. */
export function galleryPageHtml(page, style) {
  const headings = [{ depth: 1, text: page.title, id: slugOf(page.title) }];
  const sections = page.sections
    .map((one) => {
      headings.push({ depth: 2, text: one.title, id: one.id });
      const items = one.items
        .map((entry) => {
          headings.push({ depth: 3, text: entry.title, id: entry.id });
          return itemHtml(entry, style);
        })
        .join("\n");
      return `<section aria-labelledby="${one.id}"><h2 id="${one.id}">${escapeHtml(one.title)}<a class="docs-anchor" href="#${one.id}" aria-label="${escapeHtml(one.title)}">#</a></h2>\n<p>${escapeHtml(one.intro).replace(/`([^`]+)`/g, "<code>$1</code>")}</p>\n<div class="g-grid">\n${items}\n</div></section>`;
    })
    .join("\n");
  const html = `<h1 id="${headings[0].id}">${escapeHtml(page.title)}</h1>\n<p>${escapeHtml(page.intro).replace(/`([^`]+)`/g, "<code>$1</code>")} The pictures share one stylesheet, which is left out of each one's SVG here; <code>drawKyogijo</code> puts it in every drawing unless <code>style: "none"</code> says not to.</p>\n<style>${style}</style>\n${sections}\n`;
  const major = page.major ?? "0";
  const version = page.version ?? `${major}.x`;
  const files = page.sections.flatMap((one) => one.items).flatMap((entry) => [{ path: itemFiles(entry.id).svg, content: `${entry.svg}\n` }, { path: itemFiles(entry.id).page, content: standalonePage(entry, major, version) }]);
  return { slug: page.slug, title: page.title, description: page.intro.replace(/`/g, "").slice(0, 280), html, headings, files };
}

// ---- The coordinate frames, each drawing the same spot on the same surface in its own numbers. ----

/** The budō: judo and karate competition areas, the kendo shiai-jo, the sumo dohyō, the kyūdōjō, the dojo builder, the halls on the atlas and the scores. */
function budoPage() {
  const judo = (opts) => drawing({ sport: "judo", ...opts });
  const karate = (opts) => drawing({ sport: "karate", ...opts });
  const kendo = (opts) => drawing({ sport: "kendo", ...opts });
  const sumo = (opts) => drawing({ sport: "sumo", ...opts });
  const kyudo = (opts) => drawing({ sport: "kyudo", ...opts });
  const dojo = (opts) => drawing({ sport: "dojo", dojo: opts });
  const hall = (id, sport) => `import { drawKyogijo } from "${MAIN}";\nimport { placeById, surfaceOf } from "${MAIN}/atlas";\n\nconst svg = drawKyogijo({ ...surfaceOf(placeById("${id}")${sport === undefined ? "" : `, "${sport}"`}), crowd: true });`;
  return {
    slug: "gallery-budo",
    title: "Gallery: the budō",
    ja: "武道",
    intro: "The IJF's judo competition area in its looks, with two or three areas, the platform and the AJJF's layout; the WKF's karate areas; the kendo shiai-jo; the sumo dohyō; the kyūdōjō for kinteki and enteki; the dojo builder at every size and in every lay; the five halls of the atlas; and the scores. Every picture is drawn by the build from the code under it.",
    sections: [
      section("judo", "Judo", "`sport: \"judo\"`: a contest area of 10 m in a safety area of 4 m, laid with tatami of 2 m by 1 m. The IJF's official colours are yellow and red; the other looks are ours.", [
        item("budo-judo", "The IJF's competition area", judo({}), "The contest area in yellow and the safety area in red, the tape where the contestants start 4 m apart."),
        item("budo-judo-blue", "Yellow and blue", judo({ budo: { look: "yellow-blue" } })),
        item("budo-judo-grey", "Blue and grey", judo({ budo: { look: "blue-grey" } })),
        item("budo-judo-green", "Green and beige, the traditional tatami", judo({ budo: { look: "green-beige" } })),
        item("budo-judo-black", "Black and red", judo({ budo: { look: "black-red" } })),
        item("budo-judo-8", "The smallest: 8 m in a safety area of 3 m", judo({ budo: { size: 8, safety: 3 } })),
        item("budo-judo-two", "Two areas side by side, with the technical tables", judo({ budo: { areas: 2, officials: true } }), "A common safe zone of 4 m between them."),
        item("budo-judo-three", "Three areas on a platform", judo({ budo: { areas: 3, platform: true } }), "The platform is a metre wider and longer than the tatami, and a free zone of 50 cm lies round it."),
        item("budo-judo-ajjf", "The All Japan Judo Federation's layout", judo({ league: "ajjf", budo: { look: "green-red" } }), "Tatami of 182 cm by 91 cm, the red danger zone one tatami wide, the red and white tape 4 m apart; the sizes made a whole number of mats."),
        item("budo-judo-kata", "A kata area", judo({ budo: { style: "kata" } }), "Two white tapes 3 m from the centre either side and one at the centre, a safety area of 2 m."),
        item("budo-judo-kata-officials", "A kata area with its judges", judo({ budo: { style: "kata", officials: true } }), "The five judges 1.25 m apart on the shomen side, the central one at the centre, and the coach's chair opposite."),
        item("budo-judo-start", "Close up: the start", judo({ range: "start" })),
        item("budo-judo-half", "Tatami of 1 m by 1 m, half the area", judo({ budo: { tatami: "1x1" }, range: "half" })),
        item("budo-judo-score", "A score: waza-ari, yuko and shido on the board", drawing({ sport: "judo", ...GAMES.judo })),
      ]),
      section("karate", "Karate", "`sport: \"karate\"`: the WKF's matted square of 8 m, its outer metre in another colour, a safety area of 2 m, the two start mats, the referee and the judges.", [
        item("budo-karate", "The kumite area", karate({}), "The referee 2 m inside the near boundary, a judge about 1.5 m off each corner."),
        item("budo-karate-officials", "With the officials' table", karate({ budo: { officials: true } })),
        item("budo-karate-black", "Blue and black", karate({ budo: { look: "blue-black" } })),
        item("budo-karate-kata", "The kata area", karate({ league: "wkf-kata" }), "The same square with no band and no start mats."),
        item("budo-karate-two", "Two areas, 2 m apart", karate({ budo: { areas: 2 } })),
        item("budo-karate-score", "A score: points, the senshu and the warnings", drawing({ sport: "karate", ...GAMES.karate })),
      ]),
      section("kendo", "Kendo", "`sport: \"kendo\"`: a wooden floor of 9 m to 11 m a side with its white lines, the cross at the centre and the two kaishi-sen, and 1.5 m kept clear outside.", [
        item("budo-kendo", "The shiai-jo, 10 m", kendo({})),
        item("budo-kendo-9", "The smallest, 9 m", kendo({ budo: { size: 9 } })),
        item("budo-kendo-11", "The largest, 11 m", kendo({ budo: { size: 11, look: "blond" } })),
        item("budo-kendo-score", "A score: the points by the target struck", drawing({ sport: "kendo", ...GAMES.kendo })),
      ]),
      section("sumo", "Sumo", "`sport: \"sumo\"`: the clay square of 6.7 m, the ring of 4.55 m made of 20 tawara with its four tokudawara, the sand of the jano-me and the two shikiri-sen; the tassels of the roof in the colours of the quarters.", [
        item("budo-sumo", "The dohyō", sumo({})),
        item("budo-sumo-tassels", "With the four tassels", sumo({ budo: { tassels: true } }), "Green east, red south, white west, black north."),
        item("budo-sumo-bare", "The clay alone", sumo({ budo: { tawara: false } })),
        item("budo-sumo-ring", "Close up: the ring", sumo({ range: "ring", budo: { tassels: true } })),
        item("budo-sumo-score", "A score: the kimarite of the winner", drawing({ sport: "sumo", ...GAMES.sumo })),
      ]),
      section("kyudo", "Kyūdō", "`sport: \"kyudo\"`: the shajō with its shooting positions and honza, the yamichi, the azuchi with its targets, and the path for the arrows.", [
        item("budo-kyudo", "Kinteki, 28 m", kyudo({}), "Five shooters 1.8 m apart, a target of 36 cm each."),
        item("budo-kyudo-enteki", "Enteki, 60 m", kyudo({ league: "enteki" }), "Targets of 1 m, shooters 1.6 m apart."),
        item("budo-kyudo-three", "Three shooters, no roofs", kyudo({ budo: { shooters: 3, roof: false } })),
        item("budo-kyudo-shajo", "Close up: the shajō", kyudo({ range: "shajo" })),
        item("budo-kyudo-azuchi", "Close up: the azuchi", kyudo({ range: "azuchi" })),
        item("budo-kyudo-score", "A score: hits", drawing({ sport: "kyudo", ...GAMES.kyudo })),
      ]),
      section("dojo", "The dojo builder", "`sport: \"dojo\"` or `dojo(spec)`: the floor in mats, laid as real units. A number is the area in jō.", [
        item("budo-dojo-8", "8 jō", dojo({ jo: 8 })),
        item("budo-dojo-12", "12 jō", dojo({ jo: 12 })),
        item("budo-dojo-20", "20 jō, with a shrine and four windows", dojo({ jo: 20, shinzen: true, windows: 4 }), "Eighteen whole mats and four half mats, laid so that no four corners meet."),
        item("budo-dojo-50", "50 jō: a school club's dojo", dojo({ jo: 50, shinzen: true, windows: 4 })),
        item("budo-dojo-100", "100 jō", dojo({ jo: 100, kamiza: "west", shinzen: true, windows: 6 })),
        item("budo-dojo-200", "200 jō with a judo contest area laid on it", dojo({ jo: 200, areas: 1, pattern: "border" }), "A contest area of 8 m with the safety area round it, and a border."),
        item("budo-dojo-checker", "A checker floor in yellow and red", dojo({ mats: [5, 4], pattern: "checker", look: "yellow-red", walls: false })),
        item("budo-dojo-competition", "A floor in the colours of a contest area", dojo({ jo: 100, pattern: "competition", look: "yellow-blue" })),
        item("budo-dojo-weave", "The weave of the mats, on a competition floor", dojo({ jo: 50, pattern: "competition", look: "yellow-blue", texture: "weave" }), "Ridges along each mat, a faint light edge; the traditional lay has them by default (`texture: \"none\"` leaves them out)."),
        item("budo-dojo-kodokan", "A dojo of four contest areas, a dais, a banner and a wood surround", dojo({ mats: { width: 26.4, length: 26.4 }, surround: 1, areas: { across: 2, down: 2 }, dais: true, banner: true, look: "yellow-green" }), "`areas: { across, down }`, `surround`, `dais` and `banner`; the Kodokan's main dojo is drawn this way."),
        item("budo-dojo-eras", "A floor with two eras", dojo({ mats: { width: 26.4, length: 26.4 }, areas: { across: 2, down: 2 }, outline: true, eras: [{ name: "earlier", look: "green-orange", outline: true }, { name: "current", look: "yellow-green" }], era: "earlier" }), "`eras` carry a floor's history; `era` picks one by name and `year` the one that holds the year."),
        item("budo-dojo-edo", "Edoma tatami (1760 by 880 mm), in metres", drawing({ sport: "dojo", league: "edoma", dojo: { mats: { width: 6, length: 9, unit: "m" } } }), "A floor in metres is made a whole number of mats where it can, and cut at its edges where it cannot."),
        item("budo-dojo-code", "The builder as data", `import { dojo, drawDojo } from "${MAIN}/budo";\n\nconst hall = dojo({ jo: 20, kamiza: "east", entrances: [{ wall: "west" }] });\nconsole.log(hall.jo, hall.counts, hall.mats.length);\nconst svg = drawDojo({ jo: 20, kamiza: "east", entrances: [{ wall: "west" }] });`, "`dojo()` returns every mat in metres with its tone, the floor's size, where the doors and windows are, and the options that draw it."),
      ]),
      section("halls", "The halls of the atlas", "`surfaceOf(placeById(id))`: the Kodokan's main dojo, the Nippon Budokan's octagon, the Kokugikan's dohyō, the old Butokuden and the Budokwai, each with only what a source gives; a floor whose size is not known is drawn at a plausible one.", [
        item("budo-hall-kodokan", "The Kodokan's main dojo: 420 jō", hall("kodokan"), "The mat count is the Kodokan's own; the shape of the floor and the colours are not documented."),
        item("budo-hall-kodokan-earlier", "The Kodokan's main dojo in its earlier colours", `import { drawKyogijo } from "${MAIN}";\nimport { hallSurfaces, placeById } from "${MAIN}/atlas";\n\nconst earlier = hallSurfaces(placeById("kodokan")).find((floor) => floor.id === "main-dojo-earlier");\nconst svg = drawKyogijo({ sport: earlier.sport, ...earlier.options, crowd: true });`, "All green mats, the four contest areas outlined by red-orange border mats (the owner's older photograph). The years of the two looks are not known, so the eras carry none."),
        item("budo-hall-budokan", "The Nippon Budokan: judo on the octagon", hall("nippon-budokan"), "The arena is an octagon 55 m across the flats; two contest areas on a platform are plausible, not the Games' own plan."),
        item("budo-hall-budokan-karate", "The Budokan: karate", hall("nippon-budokan", "karate")),
        item("budo-hall-kokugikan", "The Ryōgoku Kokugikan: the dohyō", hall("ryogoku-kokugikan")),
        item("budo-hall-butokuden", "The old Butokuden", hall("kyu-butokuden"), "The size of its floor was not found: 100 jō is plausible."),
        item("budo-hall-budokwai", "The Budokwai", hall("budokwai"), "The size of its dojo was not found: 50 jō is plausible."),
      ]),
    ],
  };
}

/** The spot every frame of a sport marks, in the numbers of a frame that all of them can convert from. */
const REFERENCE = {
  nhl: { frame: "nhl-api", spot: [69, 22], what: "the right end-zone face-off dot" },
  nba: { frame: "nba-stats", spot: [0, 190], what: "the middle of the free-throw line" },
  nfl: { frame: "nfl-tracking", spot: [90, 26.67], what: "the middle of the right 20-yard line" },
  mlb: { frame: "retrosheet", spot: [63.64, 63.64], what: "first base" },
  soccer: { frame: "international", spot: [94, 34], what: "the right penalty mark" },
  curling: { frame: "curling", spot: [0, 6], what: "the middle of the back line" },
  tennis: { frame: "tennis", spot: [21, 0], what: "the T, where the centre service line meets the right service line" },
  volleyball: { frame: "volleyball", spot: [3, 0], what: "the middle of the right attack line" },
  badminton: { frame: "badminton", spot: [1.98, 0], what: "the middle of the right short service line" },
  pickleball: { frame: "pickleball", spot: [7, 0], what: "the middle of the right non-volley zone line" },
  tabletennis: { frame: "tabletennis", spot: [1.37, 0], what: "the middle of the right end line" },
  padel: { frame: "padel", spot: [6.95, 0], what: "the middle of the right service line" },
  squash: { frame: "squash", spot: [0.59, 0], what: "the middle of the short line" },
  racquetball: { frame: "racquetball", spot: [0, 0], what: "the middle of the short line (its back edge)" },
  sepaktakraw: { frame: "sepaktakraw", spot: [4.25, 0], what: "the centre of the right service circle" },
  teqball: { frame: "teqball", spot: [3.5, 0], what: "the middle of the right service line" },
  roundnet: { frame: "roundnet", spot: [2.6, 0], what: "the right service position" },
  netball: { frame: "netball", spot: [5.08, 0], what: "the middle of the right transverse line" },
  skating: { frame: "skating", spot: [43.2, 25.5], what: "the finishing line on the inner lane's line (the long track)" },
  judo: { frame: "judo", spot: [2, 0], what: "the middle of the tape where the contestant to the referee's right starts" },
  karate: { frame: "karate", spot: [1.5, 0], what: "the middle of the right start mat" },
  kendo: { frame: "kendo", spot: [1.4, 0], what: "the middle of the right kaishi-sen" },
  sumo: { frame: "sumo", spot: [0.38, 0], what: "the middle of the right shikiri-sen" },
  kyudo: { frame: "kyudo", spot: [17.5, 5.4], what: "the face of the first target on the azuchi" },
  dojo: { frame: "dojo", spot: [0, 0], what: "the middle of the floor" },
  athletics: { frame: "athletics", spot: [42.195, 40.3], what: "the finish line on lane 1's running line" },
  lacrosse: { frame: "lacrosse", spot: [16, 0], what: "the middle of the right restraining line" },
  rugby: { frame: "rugby", spot: [28, 0], what: "the middle of the right 22-metre line" },
  afl: { frame: "afl", spot: [30, 0], what: "the middle of the right Fifty Metre Arc" },
  gaelic: { frame: "gaelic", spot: [27.5, 0], what: "the middle of the right 45 m line" },
  cricket: { frame: "cricket", spot: [11, 0], what: "the middle of the right bowling crease" },
  fieldhockey: { frame: "fieldhockey", spot: [39.2, 0], what: "the right penalty spot" },
  handball: { frame: "handball", spot: [13, 0], what: "the middle of the right 7-metre line" },
  swimming: { frame: "swimming", spot: [-10, -8.75], what: "the 15 m cross line in lane 1" },
  waterpolo: { frame: "waterpolo", spot: [-7.5, 0], what: "the 5 m mark in front of the left goal" },
  diving: { frame: "diving", spot: [-9, 6.75], what: "the plummet of the 10 m platform" },
  artisticswimming: { frame: "artisticswimming", spot: [0, -10], what: "centre stage, at the pool's edge" },
};
const round2 = (n) => Math.round(n * 100) / 100;
const UNIT_WORDS = { ft: "feet", yd: "yards", m: "metres", cm: "centimetres", in: "inches", mm: "millimetres", px: "pixels", "tenth-ft": "tenths of a foot", percent: "percent", fraction: "fractions" };

/** One item for each frame: the surface, the spot written in the frame's numbers, and the way x and y grow from it. */
export function framesItems(lib) {
  const { FRAMES, convert } = lib[`${MAIN}/frames`];
  return Object.values(FRAMES).map((frame) => {
    const reference = REFERENCE[frame.sport];
    // A frame of a surface that has a range of sizes is fitted to the one the surface is drawn at.
    const fieldSize = (sport) => {
      const plan = lib[MAIN].fieldPlan({ sport });
      return { length: plan.length, width: plan.width, unit: "ft" };
    };
    const budoSize = (sport) => {
      const box = lib[`${MAIN}/budo`].budoPlan({ sport }).box;
      return { length: round2(box.x1 - box.x0), width: round2(box.y1 - box.y0), unit: "m" };
    };
    const size = frame.size === "variable" ? (frame.sport === "curling" ? { length: 150, width: 15.58, unit: "ft" } : frame.sport === "volleyball" ? { length: 18, width: 9, unit: "m" } : frame.sport === "squash" ? { length: 9.75, width: 6.4, unit: "m" } : lib[MAIN].FIELD_SPORTS.includes(frame.sport) ? fieldSize(frame.sport) : lib[MAIN].POOL_SPORTS.includes(frame.sport) ? { length: lib[MAIN].poolPlan({ sport: frame.sport, pool: {} }).length, width: lib[MAIN].poolPlan({ sport: frame.sport, pool: {} }).width, unit: "m" } : lib[`${MAIN}/budo`].isBudoSport(frame.sport) ? budoSize(frame.sport) : { length: 105, width: 68, unit: "m" }) : undefined;
    const [spot] = convert(reference.frame, frame.name, size ? { size } : {})([reference.spot]);
    const x = round2(spot[0]);
    const y = round2(spot[1]);
    const step = (range) => round2(Math.abs(range[1] - range[0]) * 0.12);
    const dx = step(frame.x);
    const dy = step(frame.y);
    const from = frame.name;
    const where = size ? { surfaceSize: size } : {};
    const layers = [
      { kind: "arrows", name: "x grows", from, ...where, data: [{ x, y, x2: round2(x + dx), y2: y }], style: { width: 1.2, color: "var(--ky-layer-home)" } },
      { kind: "arrows", name: "y grows", from, ...where, data: [{ x, y, x2: x, y2: round2(y + dy) }], style: { width: 1.2, color: "var(--ky-layer-away)" } },
      { kind: "points", name: reference.what, from, ...where, data: [{ x, y, title: `${reference.what}: ${x}, ${y}` }], style: { size: 4, shape: "star" } },
      { kind: "text", name: "axes", from, ...where, data: [{ x: round2(x + dx * 1.3), y, text: "x" }, { x, y: round2(y + dy * 1.4), text: "y" }], style: { size: 4 } },
    ];
    const options = frame.sport === "soccer" ? { sport: "soccer", pitchType: frame.name, layers } : { sport: frame.sport, layers };
    const unit = UNIT_WORDS[frame.unit] ?? frame.unit;
    return item(
      `frame-${frame.name}`,
      frame.name,
      drawing(options),
      `${frame.title}. ${reference.what[0].toUpperCase()}${reference.what.slice(1)} is (${x}, ${y}) in ${unit}; the arrows show which way x (blue) and y (orange) grow.`,
    );
  });
}

/** The frames' drawings as the HTML of the `<!-- site:frames -->` marker of docs/frames.md. */
export function framesBlockHtml(lib, style) {
  const items = framesItems(lib).map((entry) => ({ ...entry, svg: runSnippet(entry.code, lib) }));
  return `<style>${style}</style>\n<div class="g-frames" data-testid="frames-gallery">\n${items.map((entry) => itemHtml(entry, style)).join("\n")}\n</div>\n`;
}

/** The files of the frames' items (each drawing as an SVG and as a page that draws it from the published package), for `buildDocs`' `files`. */
export function framesFiles(lib) {
  const major = String(lib[MAIN].VERSION).split(".")[0];
  const version = String(lib[MAIN].VERSION);
  return framesItems(lib).flatMap((entry) => {
    const full = { ...entry, svg: runSnippet(entry.code, lib) };
    return [{ path: itemFiles(entry.id).svg, content: `${full.svg}\n` }, { path: itemFiles(entry.id).page, content: standalonePage(full, major, version) }];
  });
}

/** The package's entry points as `runSnippet` wants them, read from a folder of built (`.js`) or source (`.ts`) files. */
export async function libraryFrom(dir, ext, importer) {
  const entries = { "": "index", "/charts": "charts-entry", "/frames": "frames-entry", "/layers": "layers-entry", "/leagues": "leagues-entry", "/eras": "eras-entry", "/grounds": "grounds-entry", "/arenas": "arenas-entry", "/parks": "parks-entry", "/atlas": "atlas-entry", "/events": "events-entry", "/geometry": "geometry-entry", "/replay": "replay-entry", "/layouts": "layouts-entry", "/multi": "multi-entry", "/turn": "turn-entry", "/athletics": "athletics-entry", "/skating": "skating-entry", "/target": "target-entry", "/zones": "zones-entry", "/pointer": "pointer-entry", "/budo": "budo-entry", "/judging": "judging-entry" };
  const lib = {};
  for (const [suffix, file] of Object.entries(entries)) lib[`${MAIN}${suffix}`] = await importer(`${dir}/${file}${ext}`);
  return lib;
}
