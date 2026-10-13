// The parts of docs/*.md that are made from the source, so that they cannot fall behind it: the table of coordinate frames, the table of
// the units every surface and league is stated in, and the table of limits. Each sits between two comments in its page,
//
//   <!-- made:frames -->  …  <!-- /made:frames -->
//
// and `pnpm docs:make` rewrites what is between them; a test (src/docs.made.test.js) holds each page to what this file makes.
const MAIN = "@johnmorrisdotca/kyogijo";

const UNIT_WORDS = { ft: "feet", yd: "yards", m: "metres", cm: "centimetres", in: "inches", mm: "millimetres", px: "pixels", "tenth-ft": "tenths of a foot", percent: "percent of the pitch", fraction: "fractions of the pitch" };
const SPORT_NAMES = { nfl: "NFL", cfl: "CFL", ifaf: "IFAF", nhl: "NHL", nba: "NBA", mlb: "MLB", soccer: "soccer", curling: "curling" };
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
  const FAMILIES = { nba: "`nba`", nhl: "`nhl`", nfl: "`nfl`, `cfl`, `ifaf`", mlb: "`mlb`", curling: "`curling`" };
  for (const [sport, label] of Object.entries(FAMILIES)) for (const league of LEAGUES[sport]) if (!league.builtIn) rows.push([label, `\`${league.id}\``, league.name.en, `\`${league.unit}\` (${WORDS[league.unit]})`]);
  return table(["`sport`", "`league`", "Surface", "Rulebook unit"], rows);
}

/** The numbers a test holds, counted from the code. */
export function limitsTable(lib) {
  const { SPORTS, SOCCER_PITCHES, SOCCER_PROVIDERS, PARKS, PARK_IDS, UNITS } = lib[MAIN];
  const { FRAMES } = lib[`${MAIN}/frames`];
  const { GROUND_IDS } = lib[`${MAIN}/grounds`];
  const { LEAGUES } = lib[`${MAIN}/leagues`];
  const { PLACES } = lib[`${MAIN}/atlas`];
  const parks = PARK_IDS.map((id) => PARKS[id]);
  const count = (test) => parks.filter(test).length;
  const providers = Object.keys(SOCCER_PROVIDERS).length;
  const leagues = Object.values(LEAGUES).flat().filter((league) => !league.builtIn).length;
  const registered = Object.keys(FRAMES);
  const soccer = registered.filter((name) => FRAMES[name].sport === "soccer").length;
  return table(
    ["Limit", "Value", "Where"],
    [
      ["Sports", String(SPORTS.length), "`SPORTS`"],
      ["Soccer pitches and providers", `${Object.keys(SOCCER_PITCHES).length} presets, ${providers} providers (${providers * (providers - 1)} maps between them, each landmark to its landmark)`, "`SOCCER_PITCHES`, `SOCCER_PROVIDERS`"],
      ["League variants", `${leagues} leagues of 5 families, besides each sport's own`, "`LEAGUES`"],
      ["Ballparks", `${PARK_IDS.length} (${count((p) => p.league === "MLB" && p.status !== "past")} current MLB, ${count((p) => p.league === "MLB" && p.status === "past")} past MLB, ${count((p) => p.league === "NPB" && p.status === "current")} NPB home parks, ${count((p) => p.league === "NPB" && p.status !== "current")} other NPB grounds)`, "`PARKS`"],
      ["Grounds", String(GROUND_IDS.length), "`GROUNDS`"],
      ["Places on the atlas", String(PLACES.length), "`PLACES`"],
      ["Units", `${UNITS.length} (${UNITS.map((unit) => `\`${unit}\``).join(", ")})`, "`UNITS`"],
      ["Coordinate frames", `${registered.length} to start with (${registered.filter((name) => FRAMES[name].sport !== "soccer").map((name) => `\`${name}\``).join(", ")} and the ${soccer} soccer providers), more by \`registerFrame\``, "`FRAMES`"],
      ["A colour", "a hex colour, `rgb()`, `rgba()`, `hsl()`, `hsla()`, a name or `var(--name)`, 64 characters at most", "`safeColour`"],
      ["A logo", "an https or relative address, an image data address, or SVG text up to 200,000 characters", "`safeLogo`"],
      ["A name", "any length: it is set on one line or two, in the biggest size that fits its place", "`fitLines`"],
      ["A layer's marks", "1,000 points add under 70 kB; 10,000 draw in under 250 ms", "`drawKyogijo`"],
      ["A drawing's size", "under 22 kB for a football field, 15 kB for a soccer pitch with a score, 14 kB for a rink or a court, 17 kB for a ballpark, 17.5 kB for a curling sheet with its board, each with its 8 kB stylesheet (a test holds each)", "`drawKyogijo`"],
    ],
  );
}

/** Every made block by name. */
export const MADE = { frames: framesTable, units: unitsTable, limits: limitsTable };

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
