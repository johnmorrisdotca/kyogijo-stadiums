# Ready-made charts

`@johnmorrisdotca/kyogijo/charts` has one function for each of six charts, `passNetwork` for a seventh, which [Team shape](./team-shape.md#pass-networks) describes, and `roadToFinal` for an eighth that is not drawn on a surface at all: [the road to the final](#the-road-to-the-final). Each takes plain data and returns the [data layers](./layers.md) and the drawing options to lay them on, so one call gives a good chart and every layer can still be changed.

| Function | Chart | Reads |
| --- | --- | --- |
| `nbaShotChart(shots, options)` | made and missed shots, and the six shot zones coloured by field-goal percentage against the league's | stats.nba.com's `LOC_X` and `LOC_Y` (frame `nba-stats`) |
| `nhlShotMap(shots, options)` | goals and shots sized by expected goals, with the ends folded to one, and optional slot zones or hexagons | the NHL API (`nhl-api`) or HockeyTech (`hockeytech`) |
| `mlbSprayChart(balls, options)` | balls in play on the ballpark of their season, each hit type in its own mark, beyond-the-fence balls drawn beyond it, and spray zones by the side the batter bats from | Statcast's `hc_x` and `hc_y` (`mlbam`), feet from home plate or Retrosheet's codes (`retrosheet`) |
| `nflPassChart(passes, options)` | where each pass came down, by outcome and air yards, on the line of scrimmage and the pass grid | NFL tracking data (`nfl-tracking`) |
| `curlingStones(stones, options)` | the stones of a curling end on the house, with the stones that score ringed, the shot rock ringed twice and the end scored by the rules (`curlingScore`) | feet from the button (`curling`) |
| `soccerShotMap(shots, options)` | shots on the pitch or the half it attacks, sized by expected goals, with the xG total, and `goalMouth()` for where they crossed the goal line | a soccer provider (`opta`, `statsbomb`, `wyscout` and the rest) |
| `roadToFinal(finalists, options)` | the two finalists of a tournament and the matches each played on the way: round flags or crests of both teams with the score between them, the rounds named down the middle, the group stage as a row at the foot | the matches you give it, and flags or logos of your own (see [the road to the final](#the-road-to-the-final)) |

The charts are made from the layers of [Data layers](./layers.md) (`points`, `lines`, `text`, `zones`, `hexbin` and their legends), the frames of [sources.md](./sources.md#coordinate-frames) and the zone sets of [sources.md](./sources.md#zone-sets). The data is yours and nothing is read from a network.

## What a chart gives back

```ts
import { nbaShotChart } from "@johnmorrisdotca/kyogijo/charts";

const chart = nbaShotChart([{ x: 0, y: 20, made: true }, { x: -120, y: 90, made: false }], { minShots: 1 });
console.log(Object.keys(chart).join(" "));
console.log(chart.layers.map((layer) => layer.id).join(" "), chart.options.sport);
// options layers title summary totals key draw table
// zones shots key-marks key-text nba
```

| Property | What it is |
| --- | --- |
| `options` | The drawing's options: `sport`, `layers`, `language`, a `title`, the ground round the surface (`margin`) and what the chart needs of the surface (a spray chart's `park` and `year`, a soccer map's `half` and `pitchType`). Pass them to `drawKyogijo`, `drawSurface`, `mountKyogijo`, `kyogijoProps` or the element. |
| `layers` | The same list as `options.layers`: the zones under the marks, the marks, and the key (`key-marks` and `key-text`). Plain data: change one, take one out, add yours. |
| `draw(extra?)` | `drawKyogijo({ ...options, ...extra })`. A tall drawing leaves out the key, which runs along the top edge as the eye sees the surface wide. |
| `table()` | One HTML table for each layer that holds data, the zones as rows: the table that stands for the drawing for a screen reader. |
| `totals`, `summary`, `title`, `key` | The numbers behind the chart, a sentence for a caption, the chart's accessible name, and the key as data. |

Options every chart takes: `language` (`en` or `ja`: the chart's words, its key, its zone names and its table), `id` (a prefix for the ids inside the drawing; without it a hash of the chart, so two charts on a page do not share ids), `key`, `legend`, `ramp` and `surface` (options of the drawing laid over the chart's own: `theme`, `orientation`, `colors`, `style: "none"`).

Every mark differs in shape as well as in fill (a miss is an open x, a save an open circle, a goal a star), so an outcome is never told by colour alone. The key, the legend, each layer's title and description and the table say the same in words. The outcome words in a table's Outcome column are the data's own (`made`, `goal`), in English whatever the language.

## Basketball

`nbaShotChart(shots, options)`. A shot is `{ x, y, made }` (or `outcome: "made" | "missed"`), `LOC_X` and `LOC_Y` of stats.nba.com's shot chart in tenths of a foot from the hoop, every shot at the basket attacked. The chart puts them at the right basket (`end: "left"` for the left one) and counts them into the six shot zones: restricted area, in the paint, mid-range, both corner threes and above the break. Each zone is coloured by its field-goal percentage and written as a percent and as made over taken.

```ts
import { nbaShotChart } from "@johnmorrisdotca/kyogijo/charts";

const shots = [
  { x: 0, y: 12, made: true },
  { x: 10, y: 20, made: true },
  { x: -30, y: 35, made: false },
  { x: -231, y: 18, made: true },
  { x: -235, y: 30, made: false },
  { x: 120, y: 140, made: false },
  { x: 90, y: 160, made: true },
  { x: 0, y: 270, made: false },
];
// With the league's percentage, a zone is coloured by how far it is above or below it.
const chart = nbaShotChart(shots, { league: 46, minShots: 1 });
console.log(chart.summary);
console.log(chart.totals.zones.filter((zone) => zone.taken > 0).map((zone) => `${zone.name} ${zone.made}/${zone.taken}`).join("; "));
// Shots 8, made 4 (50%). The zones are coloured by how far they are above or below the league figure of 46 percent.
// Above the break 3 0/1; Left corner 3 1/2; Mid-range 1/2; In the paint (non-RA) 0/1; Restricted area 2/2
```

| Option | What it does |
| --- | --- |
| `from` | The frame of the shots: `nba-stats` (the default) or another frame of the court. |
| `end` | The basket: `right` (the default) or `left`. |
| `zones`, `marks` | Draw the zones (on by default) and the shots as marks (filled when made, an open x when missed). |
| `league` | The league's field-goal percentage. With it the ramp diverges (`balance`) from it; without it the zones are coloured by the percentage alone. |
| `minShots` | A zone with fewer shots is left uncoloured. 3 by default. |
| `labels` | Write each zone's percent and made over taken. On by default. |

## Hockey

`nhlShotMap(shots, options)`. A shot is `{ x, y, outcome, xg }`: `goal`, `saved`, `missed`, `blocked` or `shot`, and the chance it had of scoring (or `goal: true`). `fold: true` turns the shots at the left end a half turn so that all of them are at the right end. With `xg` the area of a mark follows it. Slot zones (`zones: true`, or `"nhl-home-plate"`) or hexagons (`hexbin: true`) count the shots into a statistic of your choice: `shots`, `xg` or `goals` (the percent that were goals).

```ts
import { nhlShotMap } from "@johnmorrisdotca/kyogijo/charts";
import type { PointsLayer } from "@johnmorrisdotca/kyogijo/layers";

const shots = [
  { x: 78, y: 3, outcome: "goal", xg: 0.28, team: "home" },
  { x: -62, y: -10, outcome: "saved", xg: 0.07, team: "away" },
  { x: 48, y: 22, outcome: "missed", xg: 0.03, team: "home" },
  { x: -70, y: 6, outcome: "blocked", xg: 0.05, team: "away" },
];
const chart = nhlShotMap(shots, { fold: true, zones: true, statistic: "goals" });
console.log(chart.summary);
// The two shots at the left end were turned a half turn: every shot is now at the right end.
console.log((chart.layers[1] as PointsLayer).data.map((shot) => `${shot.x},${shot.y}`).join(" "));
console.log(JSON.stringify(chart.totals.teams));
// Shots 4, goals 1, expected goals (xG) 0.43.
// 78,3 62,10 48,22 70,-6
// {"home":{"shots":2,"goals":1,"xg":0.31},"away":{"shots":2,"goals":0,"xg":0.12}}
```

| Option | What it does |
| --- | --- |
| `from` | `nhl-api` (the default), `hockeytech` or another frame of the rink. |
| `fold` | Every shot to the right end. Off by default. |
| `sizeBy` | `xg` (the default when a shot has an `xg`) or `none`. `xgMax` is the chance that is the largest mark (0.5). |
| `zones` | `true` or `nhl-slot`, or `nhl-home-plate`: count into zones. Off by default. |
| `hexbin` | `true`, or `{ size }` in feet: count into hexagons. |
| `statistic` | What zones and hexagons show: `shots`, `xg` or `goals`. |
| `attacking` | For one team's shots all at the left end of the frame, without folding. |

## Baseball

`mlbSprayChart(balls, options)`. A ball is `{ x, y, type }` in the frame (`mlbam`: Statcast's `hc_x` and `hc_y`), or `{ zone: "8D", type }` with a Retrosheet hit-location code. `type` is `single`, `double`, `triple`, `home run` or `out`, or the words of Statcast's `events` (`home_run`, `field_out`) and the usual short forms (`1B`, `HR`); any other word is drawn as it is. `park` and `year` draw the real park of that season, with the fence it had (the Polo Grounds had a fence of 277, 433 and 258 feet in 1915 and 279, 483 and 258 in 1950); balls that came down beyond it are drawn beyond it, over the ground round the fence, with a note of how many. `bats` says which side of the field is pull.

```ts
import { mlbSprayChart } from "@johnmorrisdotca/kyogijo/charts";

const balls = [
  { x: 125.4, y: 100, type: "single" },
  { x: 90, y: 60, type: "home_run" },
  { x: 140, y: 120, type: "field_out" },
  { x: 118, y: 40, type: "double" },
  { zone: "7D", type: "triple" },
];
// A ball 450 feet from home plate, straight to centre field, is beyond the 1915 fence (433) and inside the 1950 one (483).
const deep = [{ x: 125.42, y: 198.27 - 450 / 2.5, type: "home_run" }];
const chart = mlbSprayChart(balls, { park: "polo-grounds", year: 1915, bats: "R", zones: true });
console.log(chart.summary);
console.log(mlbSprayChart(deep, { park: "polo-grounds", year: 1915 }).totals.beyondFence, mlbSprayChart(deep, { park: "polo-grounds", year: 1950 }).totals.beyondFence);
// Balls in play 5: Single 1, Double 1, Triple 1, Home run 1, Out 1.
// 1 0
```

Hit types are styled by shape and size as well as fill: a single a small circle, a double a diamond, a triple a triangle, a home run a star, an out an open circle. The layer system cuts a layer to the surface's outline; balls beyond the fence are in a layer of their own (`beyond`) with `clip: "none"`, held on the drawing by `limits`, with 40 feet of ground round the fence (`margin`; a ball that came down farther is drawn at the edge). A Retrosheet zone is put at the centre of its sector, good to a few feet.

| Option | What it does |
| --- | --- |
| `from` | `mlbam` (the default), `retrosheet` or another frame of the field. |
| `park`, `year` | A key of `PARKS`, past parks included, and the season. |
| `bats` | `R` (the default), `L` or `none`: names the zones pull, centre and opposite (or left, centre and right field). |
| `zones` | `true` or `baseball-spray`, or `baseball-retrosheet`: count into zones. Off by default. |
| `statistic` | What the zones show: `share` of all the balls (the default), `count` or `hit-rate`. |
| `margin` | The ground round the fence, in feet. |

Balls of batters from both sides: the pull side is a property of the layer. Draw one chart for each side, or turn the left-handed batters' balls about the line to centre field before you chart them.

## Football

`nflPassChart(passes, options)`. A pass is `{ x, y, outcome }`: where the ball came down or was caught, in the yards of NFL tracking data, `complete`, `incomplete`, `touchdown` or `interception`. `fromX` and `fromY` add the passer's place, for arrows; `airYards` is given or worked out from the destination and `los`, the line of scrimmage (midfield by default). The offence goes to the right; `direction: "left"` says it went left in the data. The pass grid (short is up to 15 yards past the line of scrimmage, deep is beyond, by left, middle and right) is coloured by completion percentage.

```ts
import { nflPassChart } from "@johnmorrisdotca/kyogijo/charts";
import type { ArrowsLayer } from "@johnmorrisdotca/kyogijo/layers";

const passes = [
  { x: 70, y: 20, outcome: "complete" },
  { x: 78, y: 30, outcome: "incomplete" },
  { x: 95, y: 26, outcome: "complete" },
  { x: 112, y: 12, outcome: "touchdown" },
  { x: 66, y: 40, outcome: "interception" },
];
const chart = nflPassChart(passes, { los: 62, minPasses: 1 });
console.log(chart.summary);
console.log((chart.layers.find((layer) => layer.id === "passes") as ArrowsLayer).data.map((pass) => pass.value).join(" "));
// Passes 5, complete 3 (60%), touchdowns 1, interceptions 1.
// 8 16 33 50 4
```

| Option | What it does |
| --- | --- |
| `from` | `nfl-tracking` (the default) or another frame of the field. |
| `los`, `direction` | The line of scrimmage in the frame's numbers, and the way the offence goes in them. |
| `zones`, `marks`, `line` | The pass grid, the destinations and the line of scrimmage, each on by default. |
| `arrows` | An arrow from each passer to the destination, dashed when incomplete. Off by default. |
| `minPasses` | A zone with fewer passes is left uncoloured. 3 by default. |

## Soccer

`soccerShotMap(shots, options)`. A shot is `{ x, y, outcome, xg }` in a provider's numbers (`provider`: `opta`, `statsbomb`, `wyscout`... or a `Frame`; `international` by default): `goal`, `saved`, `blocked`, `missed` or `post`. The pitch is drawn in the provider's own coordinates, all of it or the half the shots attack (`half: true`). Marks are sized by expected goals and the xG total is written beside the key. `goalMouth()` of the result is a small drawing of the goal frame seen from the front, with where each shot crossed the goal line: `goalY` across the goal from its centre (positive to the shooter's right) and `goalZ` up from the ground, in `goalUnit` (metres, `yd` or `ft`). A shot with no place across the goal (a block) is left out and counted. For StatsBomb's `end_location` `[x, y, z]`, `goalY` is `y - 40` and `goalZ` is `z`, with `goalUnit: "yd"`.

```ts
import { soccerShotMap } from "@johnmorrisdotca/kyogijo/charts";

const shots = [
  { x: 104, y: 36, outcome: "goal", xg: 0.31, goalY: -1.2, goalZ: 0.6 },
  { x: 98, y: 50, outcome: "saved", xg: 0.08, goalY: 2.4, goalZ: 1.1 },
  { x: 90, y: 30, outcome: "missed", xg: 0.04, goalY: 5, goalZ: 0.5 },
  { x: 84, y: 40, outcome: "blocked", xg: 0.05 },
];
const chart = soccerShotMap(shots, { provider: "statsbomb", half: true, goalUnit: "yd" });
const mouth = chart.goalMouth();
console.log(chart.summary);
console.log(mouth.placed, mouth.skipped, chart.options.half, chart.options.pitchType);
// Shots 4, goals 1, expected goals (xG) 0.48.
// 3 1 right statsbomb
```

`soccerGoalMouth(shots, options)` makes the view without the map. The goal is the Laws' 7.32 by 2.44 metres unless `goal` says another, the marks are in metres from the centre and up, and the view has its own table.

## The road to the final

`roadToFinal(finalists, options)` draws the two finalists of a tournament and the way each came: the two large round marks at the top with their names; down the middle the rounds, the last at the top; on each finalist's side its matches, each as the round mark of both teams with the score between them in large type and FT, AET or the shoot-out under it; and the group stage as a compact row of small marks, three-letter codes and scores at the foot. It is the kind of graphic sports sites post for a World Cup final, drawn from your data: the arrangement, the type and the code are the package's own, and no one's artwork is used. Unlike the charts above it is not a surface with layers, so what it gives back has no `layers`; it has the rest of what a chart gives (`options`, `title`, `summary`, `totals`, `draw()` and `table()`).

A finalist is a `Team` (`name`, `abbr`, `color`, and `logo` for its flag or crest) with a `path`, its matches before the final, the earliest first, and optionally a `group`. A match is `{ round, opponent, score, decidedBy, pens }`:

| Field | What it is |
| --- | --- |
| `round` | A key. `round-of-32`, `round-of-16`, `quarter-final` and `semi-final` have words in English and Japanese; any other key is written as it is, or as `options.labels` names it (`{ "first-round": "First round" }`), so a play-off series reads as well as a knockout. |
| `opponent` | A `Team`: its name, three letters, colour and flag or crest. |
| `score` | The finalist's first: `[2, 1]`, or text, `"4-2"` for the games of a series, split at its dash. A text that has no dash (`walkover`) is written whole. |
| `decidedBy`, `pens` | `ft` (the default), `aet` or `pens`, with the shoot-out `[4, 3]`, the finalist's first. FT, AET or the shoot-out is written under the score, in the order the two marks stand. |
| `homeFirst` | `true` puts the finalist's mark first (on the left) of the pair, `false` its opponent's. By default the finalist is at the outer edge of its side, so that the two paths mirror each other. |
| `note` | Words under the score in place of FT, AET or the shoot-out: `Game 6`. An empty text writes nothing. |

A group match is the same without `round`; its words under the score are left out unless `decidedBy` or `note` asks for them.

```ts
import { roadToFinal, type RoadFinalist } from "@johnmorrisdotca/kyogijo/charts";

const owls: RoadFinalist = {
  name: "Northern Owls", abbr: "NOW", color: "#3a2d6b",
  path: [
    { round: "quarter-final", opponent: { name: "Coastal Pines", abbr: "CPN" }, score: [2, 0] },
    { round: "semi-final", opponent: { name: "Valley Stars", abbr: "VAL" }, score: [1, 1], decidedBy: "pens", pens: [4, 3] },
  ],
  group: [{ opponent: { name: "Summit Peaks", abbr: "SMT" }, score: [3, 1] }],
};
const gulls: RoadFinalist = {
  name: "Harbour City Gulls", abbr: "HCG", color: "#1d4f91",
  path: [
    { round: "quarter-final", opponent: { name: "Metro Bolts", abbr: "MTB" }, score: [3, 1] },
    { round: "semi-final", opponent: { name: "Lakeshore Anchors", abbr: "LSA" }, score: [2, 1], decidedBy: "aet" },
  ],
};
const chart = roadToFinal([owls, gulls], { title: "Northern Cup 2030", final: { score: [1, 2] }, size: "square" });
console.log(chart.title);
console.log(chart.summary);
console.log(chart.totals.rounds.join(" "), chart.totals.champion, chart.totals.finalists[0].matches);
// Northern Owls and Harbour City Gulls: Northern Cup 2030, Road to the final
// Northern Owls played 3 matches on the way to the final and Harbour City Gulls played 2. The final: Northern Owls 1-2 Harbour City Gulls (FT). Harbour City Gulls won the final.
// quarter-final semi-final Harbour City Gulls 3
```

The options:

| Option | What it does |
| --- | --- |
| `title`, `subtitle` | The tournament, set large at the top, and the line under it (`Road to the final` once a title is given). |
| `final` | `{ score, decidedBy, pens, note }` once the final is played: its score is written between the two large marks, the loser is quieter and the table has a row for it. Without it the middle says "v". |
| `labels`, `groupLabel` | The names of the rounds by key, and of the group stage, over the package's own words. |
| `size` | `card` (1080 by 1350, a tall post: the default), `square` (1080 by 1080), `wide` (1200 by 675, the finalists at the two ends) or `phone` (390 wide, as tall as the rounds need, each round's name over its row). `ROAD_SIZES` lists them. |
| `winner` | `auto` (the default): the side that won each match is brighter and the other's mark and number are quiet; the winner of a shoot-out wins. `none` draws both alike. |
| `codes` | Write the opponent's three letters under its mark. On by default. |
| `language`, `theme`, `endnote`, `className`, `id`, `style` | The words (`en` or `ja`), `light` or `dark` (without it the drawing follows the device and the page), a foot line for a source or a credit, a class, a prefix for the ids, and `style: "none"` to leave the stylesheet to the page (`KYOGIJO_STYLE`). |

`draw(extra)` lays options over the chart's own, so one chart gives every size: `chart.draw({ size: "phone", language: "ja" })`.

Two to six rounds draw in every size, with or without a group row, and a round only one finalist played (a bye) is an empty place on the other's side. A name too long for its place is set on two lines in a smaller size (`fitLines`). The drawing is accessible by `role="img"`, a title and a description, and `table()` lists every match as text: a row for each group match, each round in order and the final, with the team, the round, the opponent, the score (the first column's team first), how it was decided and the result.

### The marks

Each team is a flag or a crest clipped to a circle with a thin ring. Give `logo` an SVG as text, an `https:` or relative address, or an image `data:` address; it goes through `safeLogo`, so an address that could run a script is dropped. A flag fills the circle (its edges are cut); a crest that must be seen whole takes `markFit: "contain"` and sits on a plain disc. A team with no `logo` is drawn as its initials, three letters at most, on its `color` (the left finalist's and the right's own colours when it has none): the chart never draws a hole. The same mark is on a soccer pitch or a rink in [score mode](./score.md#round-marks), as `mark: "round"`.

Colours are custom properties on the chart, so a page sets them: `--ky-road-bg`, `--ky-road-ink`, `--ky-road-muted`, `--ky-road-panel`, `--ky-road-spine`, `--ky-road-left`, `--ky-road-right`, and for the marks `--ky-mark-ring`, `--ky-mark-edge` and `--ky-mark-plain` ([Theming](./theming.md#marks-and-the-road-chart)). A flag that repeats down a side is written into the SVG each time it is used (the scene and every renderer read it, and a `<use>` would not survive them), so keep a flag small: the demo's, made of three shapes, is about 250 bytes.

## Sizes, and what was checked

A chart is one SVG string. Tests hold the road to the final, with flags, to under 40 kB at 1080 by 1350 and 390 wide, and 420 NBA shots with zones and legend to under 70 kB, 90 hockey shots to under 40 kB, 150 balls in play with zones to under 45 kB, 48 passes to under 35 kB, 28 soccer shots to under 25 kB and a goal mouth to under 16 kB, and that the same input gives the same drawing. Every example on this page is run by a test. The made-up data of the demo and the tests (`demo/charts-data.js`) is generated from fixed seeds and holds no real game, player or team.

## Ideas credited

The road to the final follows the "road to the final" graphics that sports sites post for a World Cup: a finalist at each side, the rounds between, the score of each match between the two teams' flags. Only that idea was taken; no artwork, layout, type or code of any of them is used, and the demo's nations and flags are made up (see [references.md](./references.md#the-road-to-the-final)). See [references.md](./references.md) for the others: mplsoccer's shot maps, pass maps and goal-mouth plots (MIT) and sporty's charts (MIT) were read for the list of charts to match; GeomMLBStadiums' spray chart, sportypy, sportyR and hockey_rink (GPL) were not read for code, and no code of any of them is used. Where a figure or a convention is ours it is in [sources.md](./sources.md).
