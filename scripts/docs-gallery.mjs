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

// ---- The teams of the made-up games, the same on every page. ----
const OWLS = { name: "Northern Owls", abbr: "NOW", score: 3, color: "#3a2d6b" };
const ANCHORS = { name: "Lakeshore Anchors", abbr: "LSA", score: 2, color: "#0f7a7a" };
const GULLS = { name: "Harbour City Gulls", abbr: "HCG", score: 27, color: "#1d4f91" };
const BISON = { name: "Prairie Ridge Bison", abbr: "PRB", score: 24, color: "#a8452c" };
const PEAKS = { name: "Summit Peaks", abbr: "SMT", score: 108, color: "#14233f" };
const BOLTS = { name: "Metro Bolts", abbr: "MTB", score: 112, color: "#c2410c" };
const STARS = { name: "Valley Stars", abbr: "VAL", score: 4, color: "#c8102e" };
const PINES = { name: "Coastal Pines", abbr: "CPN", score: 6, color: "#1f6b3c" };
const WOLVES = { name: "Harbour City Gulls", abbr: "HCG", score: 5, color: "#1d4f91", ends: [0, 1, 0, 2, 0, 0, 1, 0, 1, "X"] };
const RIDGE = { name: "Prairie Ridge Bison", abbr: "PRB", score: 4, color: "#a8452c", hammer: true, ends: [1, 0, 2, 0, 1, 0, 0, 1, 0] };
// The net sports: Harbour City is serving, a set in progress is the last column; in tennis a set's games and the points of the game.
const GULLS_SETS = { name: "Harbour City Gulls", abbr: "HCG", score: 1, color: "#1d4f91", sets: [6, 6, 2], tiebreaks: [5, null, null], points: "40", serving: true };
const BISON_SETS = { name: "Prairie Ridge Bison", abbr: "PRB", score: 1, color: "#a8452c", sets: [7, 3, 3], points: "30" };
const GULLS_VOLLEY = { name: "Harbour City Gulls", abbr: "HCG", score: 2, color: "#1d4f91", sets: [25, 22, 25, 18], serving: true };
const BISON_VOLLEY = { name: "Prairie Ridge Bison", abbr: "PRB", score: 1, color: "#a8452c", sets: [21, 25, 20, 20] };
const GULLS_GAMES = { name: "Harbour City Gulls", abbr: "HCG", score: 1, color: "#1d4f91", sets: [21, 18, 11], serving: true };
const BISON_GAMES = { name: "Prairie Ridge Bison", abbr: "PRB", score: 1, color: "#a8452c", sets: [17, 21, 9] };
const GULLS_PICKLE = { name: "Harbour City Gulls", abbr: "HCG", score: 1, color: "#1d4f91", sets: [11, 8, 5], serving: true };
const BISON_PICKLE = { name: "Prairie Ridge Bison", abbr: "PRB", score: 1, color: "#a8452c", sets: [7, 11, 4] };
const GULLS_TABLE = { name: "Harbour City Gulls", abbr: "HCG", score: 3, color: "#1d4f91", sets: [11, 9, 11, 7, 11] };
const BISON_TABLE = { name: "Prairie Ridge Bison", abbr: "PRB", score: 2, color: "#a8452c", sets: [7, 11, 8, 11, 6] };
// The field sports: rugby and lacrosse are plain scores; Australian football writes goals, behinds and the total; Gaelic games goals, points and the total; cricket runs for wickets, overs and the innings.
const RUGBY_AWAY = { name: "Harbour City Gulls", abbr: "HCG", score: 27, color: "#1d4f91" };
const RUGBY_HOME = { name: "Prairie Ridge Bison", abbr: "PRB", score: 24, color: "#a8452c" };
const AFL_AWAY = { name: "Harbour City Gulls", abbr: "HCG", goals: 10, behinds: 12, color: "#1d4f91" };
const AFL_HOME = { name: "Prairie Ridge Bison", abbr: "PRB", goals: 9, behinds: 14, color: "#a8452c" };
const GAA_AWAY = { name: "Harbour City Gulls", abbr: "HCG", goals: 2, points: 14, color: "#1d4f91" };
const GAA_HOME = { name: "Prairie Ridge Bison", abbr: "PRB", goals: 1, points: 15, color: "#a8452c" };
const CRICKET_AWAY = { name: "Harbour City Gulls", abbr: "HCG", score: 245, wickets: 6, overs: "50", color: "#1d4f91", innings: [245] };
const CRICKET_HOME = { name: "Prairie Ridge Bison", abbr: "PRB", score: 187, wickets: 10, overs: "41.2", color: "#a8452c", innings: [187] };
const SOCCER_AWAY = { name: "Northern Owls", abbr: "NOW", score: 2, penalties: 4, color: "#3a2d6b" };
const SOCCER_HOME = { name: "Lakeshore Anchors", abbr: "LSA", score: 2, penalties: 2, color: "#0f7a7a" };

const GAMES = {
  nfl: { away: GULLS, home: BISON, status: "final", competition: "Championship Game" },
  cfl: { away: GULLS, home: BISON, status: "final", competition: "Grey Cup" },
  ifaf: { away: GULLS, home: BISON, status: "final", competition: "World Championship" },
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
  lacrosse: { away: RUGBY_AWAY, home: RUGBY_HOME, status: "final", competition: "Final" },
  rugby: { away: RUGBY_AWAY, home: RUGBY_HOME, status: "final", competition: "Final" },
  afl: { away: AFL_AWAY, home: AFL_HOME, status: "final", competition: "Grand Final" },
  gaelic: { away: GAA_AWAY, home: GAA_HOME, status: "final", competition: "All-Ireland Final" },
  cricket: { away: CRICKET_AWAY, home: CRICKET_HOME, status: "final", competition: "Final" },
  fieldhockey: { away: GULLS, home: BISON, status: "final", competition: "Final" },
  handball: { away: GULLS, home: BISON, status: "final", competition: "Final" },
};
const SPORT_TITLES = { nfl: "NFL field", cfl: "CFL field", ifaf: "IFAF field", nhl: "NHL rink", nba: "NBA court", soccer: "Soccer pitch", mlb: "Baseball field", curling: "Curling sheet", tennis: "Tennis court", volleyball: "Volleyball court", badminton: "Badminton court", pickleball: "Pickleball court", tabletennis: "Table tennis table", lacrosse: "Lacrosse field", rugby: "Rugby field", afl: "Australian football ground", gaelic: "Gaelic games field", cricket: "Cricket ground", fieldhockey: "Field hockey pitch", handball: "Handball court" };

/** A repeatable list of points for the data snippets: no random numbers, so that the same code always draws the same marks. */
const SPOTS = "Array.from({ length: 36 }, (_, i) => ({ x: 20 + ((i * 53) % 160), y: 8 + ((i * 29) % 70), team: i % 2 ? \"away\" : \"home\", outcome: i % 5 === 0 ? \"goal\" : \"shot\", value: 0.05 + (i % 7) / 20 }))";
const CLUSTER = "Array.from({ length: 360 }, (_, i) => { const t = i * 2.399963; const r = 4 + 54 * Math.sqrt((i % 120) / 120); return { x: 189 - r * Math.abs(Math.cos(t)) * 1.1, y: 42.5 + r * Math.sin(t) * 0.7 }; })";

/** Two made-up teams of eleven on the `opta` frame's 0 to 100, the same on every picture; passes among eleven players; and movements for the flow fields and sonars. No random numbers. */
const SQUADS = "Array.from({ length: 22 }, (_, i) => ({ x: 8 + ((i * 37 + (i < 11 ? 3 : 17)) % 88), y: 8 + ((i * 53 + (i < 11 ? 5 : 11)) % 84), team: i < 11 ? \"home\" : \"away\", number: (i % 11) + 1 }))";
const PASSES = "Array.from({ length: 240 }, (_, i) => { const a = (i * 7) % 11; const b = (a + 1 + ((i * 3) % 4)) % 11; return { from: a + 1, to: b + 1, x: 14 + a * 6 + (i % 5), y: 12 + ((a * 17) % 76) + (i % 7), x2: 14 + b * 6, y2: 12 + ((b * 17) % 76), team: \"home\", fromNumber: a + 1, toNumber: b + 1 }; })";
const MOVES = "Array.from({ length: 400 }, (_, i) => { const x = 5 + ((i * 13) % 90); const y = 5 + ((i * 29) % 90); return { x, y, x2: x + 8 + (i % 5) + (x > 50 ? 4 : 0), y2: y + ((i % 7) - 3) * 2.2, id: (i % 5) + 1 }; })";

/** The flags of the road-to-the-final snippets: three shapes each, drawn in code, of nations that do not exist. */
const MARK_CODE = String.raw`const flag = (a, b, c) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="30" height="20" fill="' + a + '"/><path d="M15 2L27 10L15 18L3 10Z" fill="' + b + '"/><circle cx="15" cy="10" r="3.4" fill="' + c + '"/></svg>';
const stripes = (a, b, c) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="10.1" height="20" fill="' + a + '"/><rect x="10" width="10.1" height="20" fill="' + b + '"/><rect x="20" width="10" height="20" fill="' + c + '"/></svg>';
const aurelia = { name: "Aurelia", abbr: "AUR", score: 2, penalties: 4, color: "#0f7a7a", logo: flag("#0f7a7a", "#f4f0e4", "#e07a1f") };
const calvara = { name: "Calvara", abbr: "CAL", score: 2, penalties: 3, color: "#6b2d5c", logo: stripes("#6b2d5c", "#f2c230", "#14233f") };`;

const ROAD_CODE = String.raw`const flag = (a, b, c) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="30" height="20" fill="' + a + '"/><path d="M15 2L27 10L15 18L3 10Z" fill="' + b + '"/><circle cx="15" cy="10" r="3.4" fill="' + c + '"/></svg>';
const stripes = (a, b, c) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="10.1" height="20" fill="' + a + '"/><rect x="10" width="10.1" height="20" fill="' + b + '"/><rect x="20" width="10" height="20" fill="' + c + '"/></svg>';
const aurelia = {
  name: "Aurelia", abbr: "AUR", color: "#0f7a7a", logo: flag("#0f7a7a", "#f4f0e4", "#e07a1f"),
  group: [
    { opponent: { name: "Isenmark", abbr: "ISE", color: "#3a2d6b", logo: stripes("#3a2d6b", "#f4f0e4", "#3a2d6b") }, score: [2, 0] },
    { opponent: { name: "Lumeria", abbr: "LUM", color: "#14233f", logo: flag("#14233f", "#f2c230", "#14233f") }, score: [1, 1] },
    { opponent: { name: "Rovana", abbr: "ROV", color: "#1f6b3c", logo: stripes("#f2c230", "#1f6b3c", "#f2c230") }, score: [3, 0] },
  ],
  path: [
    { round: "round-of-16", opponent: { name: "Fenlund", abbr: "FEN", color: "#1f6b3c", logo: flag("#1f6b3c", "#f2c230", "#1f6b3c") }, score: [2, 1] },
    { round: "quarter-final", opponent: { name: "Garrovia", abbr: "GAR", color: "#14233f", logo: stripes("#14233f", "#f2a900", "#14233f") }, score: [1, 1], decidedBy: "pens", pens: [5, 4] },
    { round: "semi-final", opponent: { name: "Norvane", abbr: "NRV", color: "#1f6b3c", logo: flag("#f4f0e4", "#1f6b3c", "#f4f0e4") }, score: [2, 1], decidedBy: "aet" },
  ],
};
const calvara = {
  name: "Calvara", abbr: "CAL", color: "#6b2d5c", logo: stripes("#6b2d5c", "#f2c230", "#14233f"),
  group: [
    { opponent: { name: "Estria", abbr: "EST", color: "#3a2d6b", logo: flag("#e8e2cf", "#3a2d6b", "#e8e2cf") }, score: [4, 1] },
    { opponent: { name: "Borea", abbr: "BOR", color: "#8a2d4b", logo: stripes("#8a2d4b", "#e8e2cf", "#2f7a67") }, score: [0, 1] },
    { opponent: { name: "Kestrel Isles", abbr: "KES", color: "#14233f", logo: flag("#14233f", "#e8e2cf", "#c2410c") }, score: [2, 2] },
  ],
  path: [
    { round: "round-of-16", opponent: { name: "Dornmark", abbr: "DOR", color: "#c2410c", logo: flag("#c2410c", "#14233f", "#c2410c") }, score: [1, 0] },
    { round: "quarter-final", opponent: { name: "Helmara", abbr: "HEL", color: "#7a2a8c", logo: stripes("#f2c230", "#7a2a8c", "#f2c230") }, score: [2, 2], decidedBy: "pens", pens: [3, 2] },
    { round: "semi-final", opponent: { name: "Valdor", abbr: "VAL", color: "#c2410c", logo: stripes("#c2410c", "#f4f0e4", "#c2410c") }, score: [3, 1] },
  ],
};`;

const item = (id, title, code, note = "", extra = {}) => ({ id, title, code, note, ...extra });
const section = (id, title, intro, items) => ({ id, title, intro, items });

// ---- The pages. Each is a list of sections, and each section a list of items. ----

function surfacesPage(lib) {
  const sports = ["nfl", "cfl", "ifaf", "nhl", "nba", "soccer", "mlb", "curling", "tennis", "volleyball", "badminton", "pickleball", "tabletennis", "lacrosse", "rugby", "afl", "gaelic", "cricket", "fieldhockey", "handball"];
  const themes = lib[MAIN].COURT_THEMES;
  return {
    slug: "gallery-surfaces",
    title: "Gallery: surfaces and scores",
    ja: "競技場と得点",
    intro: "The twenty surfaces bare, with a game on each, wide and tall, as a strip and as a compact card, and the court's looks. Every picture is drawn by the build from the code under it.",
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
      section("marks", "Round marks", "`mark: \"round\"` on a team, or `markShape: \"round\"` for both, clips a flag or a logo to a circle with a ring: on each side of the surface, in the badge and in the strip of a compact card. A team with no logo is its initials on its colour. The flags are made-up shapes drawn in the code.", [
        item("mark-pitch", "Round marks on a pitch, wide", `import { drawKyogijo } from "${MAIN}";\n\n${MARK_CODE}\nconst svg = drawKyogijo({ sport: "soccer", markShape: "round", away: aurelia, home: calvara, status: "final-pens", competition: "Northern Cup final", orientation: "landscape" });`),
        item("mark-pitch-tall", "Round marks on a pitch, tall", `import { drawKyogijo } from "${MAIN}";\n\n${MARK_CODE}\nconst svg = drawKyogijo({ sport: "soccer", markShape: "round", away: aurelia, home: calvara, status: "final-pens", competition: "Northern Cup final", orientation: "portrait" });`, "The flags stay upright where the names are turned."),
        item("mark-badge", "Round marks in a badge", `import { drawKyogijo } from "${MAIN}";\n\n${MARK_CODE}\nconst svg = drawKyogijo({ sport: "soccer", markShape: "round", away: aurelia, home: calvara, status: "final-pens", size: "badge" });`),
        item("mark-compact", "Round marks in a compact card", `import { drawKyogijo } from "${MAIN}";\n\n${MARK_CODE}\nconst svg = drawKyogijo({ sport: "soccer", markShape: "round", away: aurelia, home: calvara, status: "final-pens", size: "compact" });`),
        item("mark-initials", "No flag: the initials on the team's colour", `import { drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({\n  sport: "nhl",\n  markShape: "round",\n  away: { name: "Northern Owls", abbr: "NOW", score: 3, color: "#3a2d6b" },\n  home: { name: "Lakeshore Anchors", abbr: "LSA", score: 2, color: "#0f7a7a" },\n  status: "final-ot",\n});`),
      ]),
      section("courts", "The court's looks", "Five looks to start from, in `COURT_THEMES`; each colour of a look is an option too.", Object.keys(themes).map((name) => item(`court-${name}`, `Court: ${name}`, `import { COURT_THEMES, drawKyogijo } from "${MAIN}";\n\nconst svg = drawKyogijo({ sport: "nba", court: COURT_THEMES.${name}, away: ${literal(PEAKS)}, home: ${literal(BOLTS)}, status: "final" });`))),
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
  return {
    slug: "gallery-places",
    title: "Gallery: ballparks and grounds",
    ja: "球場とスタジアム",
    intro: "A sample of the 94 ballparks and 64 grounds, each from its own published figures, and the walls and quirks of eight of them. The atlas has every one on a map.",
    sections: [
      section("parks", "Ballparks of today", "`park` takes a key of `PARKS`.", parks.map(([id, title]) => item(`park-${id}`, title, drawing({ sport: "mlb", park: id })))),
      section("past", "Ballparks of the past", "A past park is drawn as it stood in a `year`, where its article dates earlier fences.", past.map(([id, year, title]) => item(`past-${id}${year === undefined ? "" : `-${year}`}`, title, drawing(year === undefined ? { sport: "mlb", park: id } : { sport: "mlb", park: id, year })))),
      section("grounds", "Soccer grounds", "`ground` draws the pitch at the size its article publishes, or at 105 by 68 metres where it gives none.", grounds.map(([id, title]) => item(`ground-${id}`, title, drawing({ sport: "soccer", ground: id })))),
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
    item("chart-road-card", "Road to the final, card", `import { roadToFinal } from "${MAIN}/charts";\n\n${ROAD_CODE}\nconst svg = roadToFinal([aurelia, calvara], { title: "Northern Cup 2030", final: { score: [2, 2], decidedBy: "pens", pens: [4, 3] }, endnote: "Made-up teams, flags and results" }).draw();`, "1080 by 1350. The winner of each match is brighter; the final's loser is quiet."),
    item("chart-road-wide", "Road to the final, wide", `import { roadToFinal } from "${MAIN}/charts";\n\n${ROAD_CODE}\nconst svg = roadToFinal([aurelia, calvara], { title: "Northern Cup 2030", size: "wide" }).draw();`, "1200 by 675, before the final is played: the middle says v."),
    item("chart-road-phone", "Road to the final, phone, dark", `import { roadToFinal } from "${MAIN}/charts";\n\n${ROAD_CODE}\nconst svg = roadToFinal([aurelia, calvara], { title: "Northern Cup 2030", size: "phone", theme: "dark" }).draw();`, "390 wide and as tall as the rounds need, with each round's name over its row."),
    item("chart-road-series", "Road to the final: a series, with no flags", `import { roadToFinal } from "${MAIN}/charts";\n\nconst owls = {\n  name: "Northern Owls", abbr: "NOW", color: "#3a2d6b",\n  path: [\n    { round: "first-round", opponent: { name: "Coastal Pines", abbr: "CPN", color: "#1f6b3c" }, score: "4-0", note: "Game 4" },\n    { round: "second-round", opponent: { name: "Lakeshore Anchors", abbr: "LSA", color: "#0f7a7a" }, score: "4-2", note: "Game 6" },\n    { round: "conference-final", opponent: { name: "Prairie Ridge Bison", abbr: "PRB", color: "#a8452c" }, score: "4-3", note: "Game 7" },\n  ],\n};\nconst gulls = {\n  name: "Harbour City Gulls", abbr: "HCG", color: "#1d4f91",\n  path: [\n    { round: "first-round", opponent: { name: "Metro Bolts", abbr: "MTB", color: "#c2410c" }, score: "4-1", note: "Game 5" },\n    { round: "second-round", opponent: { name: "Summit Peaks", abbr: "SMT", color: "#14233f" }, score: "4-3", note: "Game 7" },\n    { round: "conference-final", opponent: { name: "Valley Stars", abbr: "VAL", color: "#c8102e" }, score: "4-2", note: "Game 6" },\n  ],\n};\nconst labels = { "first-round": "First round", "second-round": "Second round", "conference-final": "Conference final", final: "Cup final" };\nconst svg = roadToFinal([owls, gulls], { title: "Cup play-offs", labels, size: "square" }).draw();`, "A team with no flag or logo is its initials on its colour; the rounds are named by the caller and the scores are games won."),
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
    item("team-voronoi", "Voronoi: space control", `import { drawKyogijo } from "${MAIN}";\n\nconst players = ${SQUADS};\nconst svg = drawKyogijo({ sport: "soccer", layers: [{ kind: "voronoi", from: "opta", data: players }] });`, "Each player's cell is the part of the pitch nearer him than any other player; the description gives each team's share."),
    item("team-delaunay", "Delaunay triangles", `import { drawKyogijo } from "${MAIN}";\n\nconst players = ${SQUADS};\nconst svg = drawKyogijo({ sport: "soccer", layers: [{ kind: "delaunay", from: "opta", data: players, triangles: true }] });`),
    item("team-hull", "Convex hulls", `import { drawKyogijo } from "${MAIN}";\n\nconst players = ${SQUADS};\nconst svg = drawKyogijo({ sport: "soccer", layers: [{ kind: "hull", from: "opta", data: players }] });`),
    item("team-shape-dark", "Space and shape, tall and dark", `import { drawKyogijo } from "${MAIN}";\n\nconst players = ${SQUADS};\nconst svg = drawKyogijo({\n  sport: "soccer",\n  orientation: "portrait",\n  theme: "dark",\n  layers: [{ kind: "voronoi", from: "opta", data: players }, { kind: "hull", from: "opta", data: players }],\n});`),
    item("team-flow", "Flow field", `import { drawKyogijo } from "${MAIN}";\n\nconst moves = ${MOVES};\nconst svg = drawKyogijo({ sport: "soccer", layers: [{ kind: "flow", from: "opta", data: moves, bins: 12 }] });`, "The mean direction of the passes that start in each cell."),
    item("team-sonar-player", "Sonars: a rose for each player", `import { drawKyogijo } from "${MAIN}";\n\nconst moves = ${MOVES};\nconst svg = drawKyogijo({ sport: "soccer", layers: [{ kind: "sonar", from: "opta", data: moves, by: "player", angles: 10 }] });`),
    item("team-sonar-grid", "Sonars: a rose for each cell of a rink", `import { drawKyogijo } from "${MAIN}";\n\nconst moves = ${MOVES}.map((m) => ({ x: m.x * 2 - 100, y: m.y * 0.85 - 42.5, x2: m.x2 * 2 - 100, y2: m.y2 * 0.85 - 42.5 }));\nconst svg = drawKyogijo({ sport: "nhl", layers: [{ kind: "sonar", from: "nhl-api", data: moves, by: "grid", bins: 8, angles: 8 }] });`),
    item("team-sonar-zones", "Sonars: a rose for each zone", `import { drawKyogijo } from "${MAIN}";\n\nconst moves = ${MOVES};\nconst svg = drawKyogijo({ sport: "soccer", layers: [{ kind: "sonar", from: "opta", data: moves, by: "zone", zones: "soccer-thirds", angles: 8, statistic: "mean" }] });`, "The bars are the mean length of the passes in each direction."),
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
    ],
  };
}


function curlingPage() {
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
    title: "Gallery: tennis, volleyball, badminton, pickleball and table tennis",
    ja: "テニス、バレーボール、バドミントン、ピックルボール、卓球",
    intro: "Five net sports from their own rulebooks, wide and tall, in their named looks, with the free zone and the singles sticks, the board of sets and games with its serving ball, and the zones of each side of the net.",
    sections: [
      section("courts", "Each court", "`sport` is `tennis`, `volleyball`, `badminton`, `pickleball` or `tabletennis`; beach volleyball is `league: \"fivb-beach\"`. They lie wide unless `orientation` says tall.", [
        item("court-tennis", "Tennis court (ITF)", drawing({ sport: "tennis" })),
        item("court-volleyball", "Volleyball court (FIVB)", drawing({ sport: "volleyball" })),
        item("court-beach", "Beach volleyball court (FIVB Beach)", drawing({ sport: "volleyball", league: "fivb-beach" }), "16 by 8 metres and no centre line or attack line."),
        item("court-badminton", "Badminton court (BWF)", drawing({ sport: "badminton" })),
        item("court-pickleball", "Pickleball court (USA Pickleball)", drawing({ sport: "pickleball" })),
        item("court-table", "Table tennis table (ITTF)", drawing({ sport: "tabletennis" })),
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
        item("badge-tennis", "Badge, tennis", drawing({ sport: "tennis", ...GAMES.tennis, size: "badge" }), "The serving ball is in the corner of the team that is serving."),
        item("compact-badminton", "Compact card, badminton", drawing({ sport: "badminton", ...GAMES.badminton, size: "compact" })),
      ]),
      section("zones", "Each side of the net", "The `net-court` zones split each side at the court's own line: tennis's service line, volleyball's attack line, badminton's short service line, pickleball's non-volley zone line.", [
        item("zones-tennis", "Zones: tennis", `import { drawKyogijo } from "${MAIN}";\n\nconst balls = ${touches(80)};\nconst svg = drawKyogijo({ sport: "tennis", layers: [{ kind: "zones", name: "balls", zones: "net-court", from: "tennis", data: balls, labels: true, legend: true }] });`),
        item("zones-pickleball", "Zones: pickleball", `import { drawKyogijo } from "${MAIN}";\n\nconst balls = ${touches(80)};\nconst svg = drawKyogijo({ sport: "pickleball", layers: [{ kind: "zones", name: "balls", zones: "net-court", from: "pickleball", data: balls, labels: true, legend: true }] });`),
      ]),
    ],
  };
}

function stylingPage(lib) {
  const looks = lib[MAIN].LOOK_NAMES;
  const features = lib[MAIN].FEATURES;
  const landmarkSports = [["nhl", "NHL rink"], ["nba", "NBA court"], ["nfl", "NFL field"], ["soccer", "Soccer pitch"], ["mlb", "Baseball field"], ["curling", "Curling sheet"], ["tennis", "Tennis court"], ["volleyball", "Volleyball court"], ["pickleball", "Pickleball court"]];
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

export const GALLERY_BUILDERS = [surfacesPage, soccerPage, leaguesPage, yearsPage, placesPage, specialPage, dataPage, curlingPage, courtsPage, fieldsPage, stylingPage, rangesPage, layoutsPage];

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
  lacrosse: { frame: "lacrosse", spot: [16, 0], what: "the middle of the right restraining line" },
  rugby: { frame: "rugby", spot: [28, 0], what: "the middle of the right 22-metre line" },
  afl: { frame: "afl", spot: [30, 0], what: "the middle of the right Fifty Metre Arc" },
  gaelic: { frame: "gaelic", spot: [27.5, 0], what: "the middle of the right 45 m line" },
  cricket: { frame: "cricket", spot: [11, 0], what: "the middle of the right bowling crease" },
  fieldhockey: { frame: "fieldhockey", spot: [39.2, 0], what: "the right penalty spot" },
  handball: { frame: "handball", spot: [13, 0], what: "the middle of the right 7-metre line" },
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
    const size = frame.size === "variable" ? (frame.sport === "curling" ? { length: 150, width: 15.58, unit: "ft" } : frame.sport === "volleyball" ? { length: 18, width: 9, unit: "m" } : lib[MAIN].FIELD_SPORTS.includes(frame.sport) ? fieldSize(frame.sport) : { length: 105, width: 68, unit: "m" }) : undefined;
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
  const entries = { "": "index", "/charts": "charts-entry", "/frames": "frames-entry", "/layers": "layers-entry", "/leagues": "leagues-entry", "/eras": "eras-entry", "/grounds": "grounds-entry", "/parks": "parks-entry", "/atlas": "atlas-entry", "/events": "events-entry", "/geometry": "geometry-entry", "/replay": "replay-entry", "/layouts": "layouts-entry", "/turn": "turn-entry" };
  const lib = {};
  for (const [suffix, file] of Object.entries(entries)) lib[`${MAIN}${suffix}`] = await importer(`${dir}/${file}${ext}`);
  return lib;
}
