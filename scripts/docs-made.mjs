// The parts of docs/*.md that are made from the source, so that they cannot fall behind it: the table of coordinate frames, the table of
// the units every surface and league is stated in, and the table of limits. Each sits between two comments in its page,
//
//   <!-- made:frames -->  …  <!-- /made:frames -->
//
// and `pnpm docs:make` rewrites what is between them; a test (src/docs.made.test.js) holds each page to what this file makes.
const MAIN = "@johnmorrisdotca/kyogijo";

const UNIT_WORDS = { ft: "feet", yd: "yards", m: "metres", cm: "centimetres", in: "inches", mm: "millimetres", px: "pixels", "tenth-ft": "tenths of a foot", percent: "percent of the pitch", fraction: "fractions of the pitch" };
const SPORT_NAMES = { nfl: "NFL", cfl: "CFL", ifaf: "IFAF", nhl: "NHL", nba: "NBA", mlb: "MLB", soccer: "soccer", curling: "curling", tennis: "tennis", volleyball: "volleyball", badminton: "badminton", pickleball: "pickleball", tabletennis: "table tennis", lacrosse: "lacrosse", rugby: "rugby", afl: "Australian football", gaelic: "Gaelic games", cricket: "cricket", fieldhockey: "field hockey", handball: "handball" };
const ENDS = { fixed: "fixed to the surface", shooter: "the basket or house attacked", none: "none" };
const cell = (text) => String(text).replace(/\|/g, "\\|").replace(/\n/g, " ");
const num = (n) => String(Math.round(n * 100) / 100);
const table = (head, rows) => [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`)].join("\n");

/** Every coordinate frame, one row each: where its numbers start, how far they run, which way y grows, whether it fits one size of surface, its unit and its source. */
export function framesTable(lib) {
  const { FRAMES } = lib[`${MAIN}/frames`];
  return table(
    ["Frame", "Sport", "Unit", "Range of x and y", "Origin", "y grows", "Size", "Ends", "Source"],
    Object.values(FRAMES).map((frame) => [
      `\`${frame.name}\``,
      SPORT_NAMES[frame.sport] ?? frame.sport,
      UNIT_WORDS[frame.unit] ?? frame.unit,
      `x ${num(frame.x[0])} to ${num(frame.x[1])}; y ${num(frame.y[0])} to ${num(frame.y[1])}`,
      frame.origin,
      frame.yDirection,
      frame.size === "fixed" ? "fixed: one size of surface" : "variable: the surface's size is given",
      ENDS[frame.ends] ?? frame.ends,
      frame.source,
    ]),
  );
}

/** Every surface and every league with the unit its rulebook states its figures in. */
export function unitsTable(lib) {
  const { SURFACE_UNITS, SPORTS } = lib[MAIN];
  const { LEAGUES } = lib[`${MAIN}/leagues`];
  const WORDS = { ft: "feet", yd: "yards", m: "metres", in: "inches", cm: "centimetres", mm: "millimetres" };
  const rows = SPORTS.map((sport) => [`\`${sport}\``, "the sport's own", SPORT_NAMES[sport], `\`${SURFACE_UNITS[sport]}\` (${WORDS[SURFACE_UNITS[sport]]})`]);
  // A football league serves the NFL's, the CFL's and the IFAF's field alike, so it is listed once, under all three.
  const FAMILIES = { nba: "`nba`", nhl: "`nhl`", nfl: "`nfl`, `cfl`, `ifaf`", mlb: "`mlb`", curling: "`curling`", volleyball: "`volleyball`", lacrosse: "`lacrosse`", rugby: "`rugby`", gaelic: "`gaelic`", cricket: "`cricket`" };
  for (const [sport, label] of Object.entries(FAMILIES)) for (const league of LEAGUES[sport]) if (!league.builtIn) rows.push([label, `\`${league.id}\``, league.name.en, `\`${league.unit}\` (${WORDS[league.unit]})`]);
  return table(["`sport`", "`league`", "Surface", "Rulebook unit"], rows);
}

/** The numbers a test holds, counted from the code. */
export function limitsTable(lib) {
  const { SPORTS, SOCCER_PITCHES, SOCCER_PROVIDERS, PARKS, PARK_IDS, UNITS } = lib[MAIN];
  const { FRAMES } = lib[`${MAIN}/frames`];
  const { GROUND_IDS } = lib[`${MAIN}/grounds`];
  const { EVENT_IDS } = lib[`${MAIN}/events`];
  const { LEAGUES } = lib[`${MAIN}/leagues`];
  const { PLACES } = lib[`${MAIN}/atlas`];
  const { FORMATIONS } = lib[`${MAIN}/layers`];
  const parks = PARK_IDS.map((id) => PARKS[id]);
  const count = (test) => parks.filter(test).length;
  const providers = Object.keys(SOCCER_PROVIDERS).length;
  const leagues = Object.values(LEAGUES).flat().filter((league) => !league.builtIn).length;
  const families = new Set(Object.values(LEAGUES).flat().map((league) => league.family)).size;
  const registered = Object.keys(FRAMES);
  const soccer = registered.filter((name) => FRAMES[name].sport === "soccer").length;
  return table(
    ["Limit", "Value", "Where"],
    [
      ["Sports", String(SPORTS.length), "`SPORTS`"],
      ["Soccer pitches and providers", `${Object.keys(SOCCER_PITCHES).length} presets, ${providers} providers (${providers * (providers - 1)} maps between them, each landmark to its landmark)`, "`SOCCER_PITCHES`, `SOCCER_PROVIDERS`"],
      ["League variants", `${leagues} leagues of ${families} families, besides each sport's own`, "`LEAGUES`"],
      ["Ballparks", `${PARK_IDS.length} (${count((p) => p.league === "MLB" && p.status !== "past")} current MLB, ${count((p) => p.league === "MLB" && p.status === "past")} past MLB, ${count((p) => p.league === "NPB" && p.status === "current")} NPB home parks, ${count((p) => p.league === "NPB" && p.status !== "current")} other NPB grounds)`, "`PARKS`"],
      ["Grounds", String(GROUND_IDS.length), "`GROUNDS`"],
      ["Special games", `${EVENT_IDS.length} (a surface set inside another: ballparks, football stadiums, a deck, a stadium's pitch)`, "`EVENTS`"],
      ["Places on the atlas", String(PLACES.length), "`PLACES`"],
      ["Units", `${UNITS.length} (${UNITS.map((unit) => `\`${unit}\``).join(", ")})`, "`UNITS`"],
      ["Coordinate frames", `${registered.length} to start with (${registered.filter((name) => FRAMES[name].sport !== "soccer").map((name) => `\`${name}\``).join(", ")} and the ${soccer} soccer providers), more by \`registerFrame\``, "`FRAMES`"],
      ["A colour", "a hex colour, `rgb()`, `rgba()`, `hsl()`, `hsla()`, a name or `var(--name)`, 64 characters at most", "`safeColour`"],
      ["A logo", "an https or relative address, an image data address, or SVG text up to 200,000 characters", "`safeLogo`"],
      ["A grid of drawings", `${lib[`${MAIN}/layouts`].GRID_MAX_CELLS} drawings at most, 120 to 8,000 wide; each drawing keeps its own ids, and the base stylesheet is written once`, "`drawGrid`"],
      ["A name", "any length: it is set on one line or two, in the biggest size that fits its place", "`fitLines`"],
      ["Formations", `${Object.keys(FORMATIONS).length} named formations of 5 sports, ${Object.values(FORMATIONS).reduce((n, f) => n + f.positions.length, 0)} places in all`, "`FORMATIONS`"],
      ["The team layers", "a Voronoi diagram of 22 players adds under 12 kB; 1,000 points are triangulated in under 600 ms; a pass network of 600 passes adds under 16 kB", "`voronoi`, `delaunay`, `network`"],
      ["A layer's marks", "1,000 points add under 70 kB; 10,000 draw in under 250 ms", "`drawKyogijo`"],
      ["A drawing's size", "under 22 kB for a football field, 15 kB for a soccer pitch with a score, 14 kB for a rink or a court, 17 kB for a ballpark, 17.5 kB for a curling sheet, a net sport's court with its board or a field sport's surface with its score, each with its 8 kB stylesheet (a test holds each)", "`drawKyogijo`"],
    ],
  );
}

/** What each range shows, by sport (the sports that share a list of ranges share these words) and range. */
const RANGE_COVERS = {
  football: {
    "red-zone": "the 20 yards before a goal line and the end zone behind it",
    "end-zone": "one end zone",
    "between-the-20s": "from one 20-yard line to the other",
    "field-of-play": "goal line to goal line, without the end zones",
    "own-half": "from the end line to midfield, the end zone included",
    "opponent-half": "from midfield to the other end line, the end zone included",
  },
  nhl: { "offensive-zone": "from the end boards to the blue line", "defensive-zone": "from the end boards to the blue line", "neutral-zone": "between the blue lines", half: "from the end boards to the red line" },
  nba: { "half-court": "from a baseline to the half-court line", paint: "the key from the baseline to the free-throw line, with the free-throw circle beyond it" },
  soccer: {
    half: "from a goal line to the halfway line",
    "final-third": "the third of the pitch next to a goal line",
    "defensive-third": "the third of the pitch next to a goal line",
    "middle-third": "the third between the other two",
    "penalty-area": "the penalty area with the arc beyond it (a small pitch's curved area)",
  },
  mlb: { infield: "the dirt out to the arc round the mound, and the ground behind home plate", outfield: "the grass from the fence in to second base" },
  net: { "half-court": "one side of the net" },
  curling: { sheet: "the whole sheet", half: "from the hog line to the back line at one end", house: "the house at one end" },
  lacrosse: { half: "from an end line to the centre line", crease: "the crease (the goal circle in the women's game) and the ground round it" },
  rugby: { half: "from a dead-ball line to the half-way line", "twenty-two": "from the try line to the 22-metre line (union)", twenty: "from the goal line to the 20-metre line (league)", "in-goal": "one in-goal area" },
  afl: { half: "from a goal line to the centre line", "forward-fifty": "the ground inside the Fifty Metre Arc at one end", "centre-square": "the centre square" },
  gaelic: { half: "from an end line to the half-way line", "large-rectangle": "the large rectangle (19 by 13 m) at one end" },
  cricket: { pitch: "the pitch with its creases and wickets, and a little ground round it", circle: "the fielding restriction's circle (the ICC's leagues)" },
  fieldhockey: { half: "from a back-line to the centre line", circle: "the circle at one end", "twenty-three": "from a back-line to the 23-metre line" },
  handball: { half: "from a goal line to the centre line", "goal-area": "the goal area at one end, with its arc" },
};

/** Every named range of every sport, one row each (sports that share their ranges share their rows): what it shows and the end it is at by default. */
export function rangesTable(lib) {
  const { RANGES } = lib[MAIN];
  const groups = [];
  for (const sport of Object.keys(RANGES)) {
    const found = groups.find((group) => group.list === RANGES[sport]);
    if (found) found.sports.push(sport);
    else groups.push({ list: RANGES[sport], sports: [sport] });
  }
  const family = (sports) => (sports[0] === "nfl" ? "football" : ["tennis"].includes(sports[0]) ? "net" : sports[0]);
  const rows = groups.flatMap((group) => group.list.map((info) => [group.sports.map((sport) => `\`${sport}\``).join(", "), `\`${info.id}\``, RANGE_COVERS[family(group.sports)][info.id], info.end === undefined ? "none" : `\`${info.end}\``]));
  return table(["`sport`", "`range`", "Shows", "End by default"], rows);
}

/** What each pattern of a ground draws. */
const PATTERN_DRAWS = { felt: "specks in the ink and the line colour", grass: "short blades", wood: "planks, with grain", ice: "scratches", paper: "fibres", grid: "graph paper", dots: "a dot grid" };

/** The sizes of a grid: each preset's size, columns and ground. */
export function presetsTable(lib) {
  const { GRID_PRESETS } = lib[`${MAIN}/layouts`];
  return table(
    ["`preset`", "Size", "Columns", "Ground"],
    Object.entries(GRID_PRESETS).map(([name, p]) => [`\`${name}\``, `${p.width} ${p.height === undefined ? "wide, as tall as the drawings need" : `by ${p.height}, ${name === "card" ? "a social card" : "a square post"}`}`, p.columns === undefined ? "the number that makes the drawings largest" : String(p.columns), p.ground ? "plain" : "none"]),
  );
}

/** The patterns of a ground, with the opacity each is drawn at. */
export function backgroundsTable(lib) {
  const { BACKGROUND_PATTERNS, BACKGROUND_OPACITY } = lib[`${MAIN}/layouts`];
  return table(["Pattern", "What it draws", "Opacity"], BACKGROUND_PATTERNS.map((name) => [`\`${name}\``, PATTERN_DRAWS[name], String(BACKGROUND_OPACITY[name])]));
}

/** Every made block by name. */
export const MADE = { frames: framesTable, units: unitsTable, limits: limitsTable, ranges: rangesTable, presets: presetsTable, backgrounds: backgroundsTable };

const BLOCK = /(<!-- made:([\w-]+) -->\n)([\s\S]*?)(<!-- \/made:\2 -->)/g;

/** A page's text with each made block replaced by what its function makes; the names of blocks that have no function are in `unknown`. */
export function withMade(text, lib) {
  const unknown = [];
  const out = text.replace(BLOCK, (whole, open, name, _old, close) => {
    if (!(name in MADE)) {
      unknown.push(name);
      return whole;
    }
    return `${open}${MADE[name](lib)}\n${close}`;
  });
  return { text: out, unknown };
}
