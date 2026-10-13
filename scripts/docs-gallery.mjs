// The gallery of the docs site: every surface, league variant, season, park and ground sample, layer kind, heat kind and chart the package
// draws, each drawn by the build from the code shown beside it, so that a picture cannot part from its code. A gallery item is a title and a
// snippet of code that ends by setting `svg`; the build runs the snippet (`runSnippet`) against the built package and puts what it made on the
// page. A test runs every snippet against the source and checks that what the page shows is what the snippet draws.
//
//   const pages = galleryPages(lib);   // lib: { "@johnmorrisdotca/kyogijo": module, "@johnmorrisdotca/kyogijo/charts": module, ... }
import { escapeHtml, slugOf } from "./docs-pages.mjs";

const MAIN = "@johnmorrisdotca/kyogijo";

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
};
const SPORT_TITLES = { nfl: "NFL field", cfl: "CFL field", ifaf: "IFAF field", nhl: "NHL rink", nba: "NBA court", soccer: "Soccer pitch", mlb: "Baseball field", curling: "Curling sheet" };

/** A repeatable list of points for the data snippets: no random numbers, so that the same code always draws the same marks. */
const SPOTS = "Array.from({ length: 36 }, (_, i) => ({ x: 20 + ((i * 53) % 160), y: 8 + ((i * 29) % 70), team: i % 2 ? \"away\" : \"home\", outcome: i % 5 === 0 ? \"goal\" : \"shot\", value: 0.05 + (i % 7) / 20 }))";
const CLUSTER = "Array.from({ length: 360 }, (_, i) => { const t = i * 2.399963; const r = 4 + 54 * Math.sqrt((i % 120) / 120); return { x: 189 - r * Math.abs(Math.cos(t)) * 1.1, y: 42.5 + r * Math.sin(t) * 0.7 }; })";

const item = (id, title, code, note = "", extra = {}) => ({ id, title, code, note, ...extra });
const section = (id, title, intro, items) => ({ id, title, intro, items });

// ---- The pages. Each is a list of sections, and each section a list of items. ----

function surfacesPage(lib) {
  const sports = ["nfl", "cfl", "ifaf", "nhl", "nba", "soccer", "mlb", "curling"];
  const themes = lib[MAIN].COURT_THEMES;
  return {
    slug: "gallery-surfaces",
    title: "Gallery: surfaces and scores",
    ja: "競技場とスコア",
    intro: "The eight surfaces bare, with a game on each, wide and tall, as a strip and as a compact card, and the court's looks. Every picture is drawn by the build from the code under it.",
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
    ["hanshin-koshien-stadium", "Hanshin Koshien Stadium"],
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
    intro: "A sample of the 94 ballparks and 64 grounds, each from its own published figures. The atlas has every one on a map.",
    sections: [
      section("parks", "Ballparks of today", "`park` takes a key of `PARKS`.", parks.map(([id, title]) => item(`park-${id}`, title, drawing({ sport: "mlb", park: id })))),
      section("past", "Ballparks of the past", "A past park is drawn as it stood in a `year`, where its article dates earlier fences.", past.map(([id, year, title]) => item(`past-${id}${year === undefined ? "" : `-${year}`}`, title, drawing(year === undefined ? { sport: "mlb", park: id } : { sport: "mlb", park: id, year })))),
      section("grounds", "Soccer grounds", "`ground` draws the pitch at the size its article publishes, or at 105 by 68 metres where it gives none.", grounds.map(([id, title]) => item(`ground-${id}`, title, drawing({ sport: "soccer", ground: id })))),
      section("fence", "A fence of your own", "`fence` lays your distances over a park's or the generic field.", [item("fence-custom", "Short porch in left, deep centre", drawing({ sport: "mlb", fence: { left: 310, center: 420 } }))]),
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
  return {
    slug: "gallery-data",
    title: "Gallery: data on a surface",
    ja: "データ、ヒートマップ、チャート",
    intro: "Every kind of data layer, every heat layer, the five ready-made charts and a frame of a replay, on made-up data that the code under each picture makes. The marks are in the surface's own frame, or a provider's.",
    sections: [
      section("layers", "Data layers", "`layers` in the options of `drawKyogijo`: points, lines, arrows and text.", points),
      section("heat", "Heat layers", "Counts in cells, hexagons, named zones or a density, in a colour ramp.", heat),
      section("charts", "Ready-made charts", "One call for a good chart: `@johnmorrisdotca/kyogijo/charts`.", charts),
      section("replay", "Replay", "A frame of tracking data on a surface: `drawFrame` from `@johnmorrisdotca/kyogijo/replay`. The same frame, played, is `mountKyogijo(...).replay(...)`.", replay),
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

export const GALLERY_BUILDERS = [surfacesPage, soccerPage, leaguesPage, yearsPage, placesPage, dataPage, curlingPage];

/** The sections of every page, with each item's picture made by running its code. */
export function galleryData(lib) {
  return GALLERY_BUILDERS.map((build) => {
    const page = build(lib);
    return { ...page, sections: page.sections.map((one) => ({ ...one, items: one.items.map((entry) => ({ ...entry, svg: runSnippet(entry.code, lib) })) })) };
  });
}

/** The base stylesheet is in the page once; a drawing carries it too, which is 8 kB each. The gallery leaves it out of each and says so. */
const STYLE_RE = /<style>[\s\S]*?<\/style>/;

const itemHtml = (entry, style) => {
  const svg = entry.svg.replace(STYLE_RE, (block) => (block.includes(style.slice(0, 60)) ? "" : block));
  const code = escapeHtml(entry.code);
  return `<figure class="g-item" id="${entry.id}" data-testid="gallery-item">
  <h3 id="t-${entry.id}">${escapeHtml(entry.title)}</h3>
  <div class="g-art" data-testid="gallery-art">${svg}</div>
  ${entry.note ? `<p class="g-note">${escapeHtml(entry.note)}</p>` : ""}
  <div class="g-actions"><button type="button" class="fam-button" data-copy-for="code-${entry.id}" aria-describedby="t-${entry.id}" data-testid="gallery-copy"><span data-copy-label data-docs-copy-label>Copy</span></button><span class="g-status" role="status" aria-live="polite"></span></div>
  <details class="g-code"><summary data-say="docsShowCode">Show the code</summary><pre id="code-${entry.id}"><code class="language-ts">${code}</code></pre></details>
</figure>`;
};

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
  return { slug: page.slug, title: page.title, description: page.intro.replace(/`/g, "").slice(0, 280), html, headings };
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
};
const round2 = (n) => Math.round(n * 100) / 100;
const UNIT_WORDS = { ft: "feet", yd: "yards", m: "metres", cm: "centimetres", in: "inches", mm: "millimetres", px: "pixels", "tenth-ft": "tenths of a foot", percent: "percent", fraction: "fractions" };

/** One item for each frame: the surface, the spot written in the frame's numbers, and the way x and y grow from it. */
export function framesItems(lib) {
  const { FRAMES, convert } = lib[`${MAIN}/frames`];
  return Object.values(FRAMES).map((frame) => {
    const reference = REFERENCE[frame.sport];
    const size = frame.size === "variable" ? (frame.sport === "curling" ? { length: 150, width: 15.58, unit: "ft" } : { length: 105, width: 68, unit: "m" }) : undefined;
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

/** The package's entry points as `runSnippet` wants them, read from a folder of built (`.js`) or source (`.ts`) files. */
export async function libraryFrom(dir, ext, importer) {
  const entries = { "": "index", "/charts": "charts-entry", "/frames": "frames-entry", "/layers": "layers-entry", "/leagues": "leagues-entry", "/eras": "eras-entry", "/grounds": "grounds-entry", "/parks": "parks-entry", "/atlas": "atlas-entry", "/geometry": "geometry-entry", "/replay": "replay-entry" };
  const lib = {};
  for (const [suffix, file] of Object.entries(entries)) lib[`${MAIN}${suffix}`] = await importer(`${dir}/${file}${ext}`);
  return lib;
}
