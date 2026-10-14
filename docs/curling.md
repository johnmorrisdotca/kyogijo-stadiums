# Curling

`sport: "curling"` draws a curling sheet to scale: a house at each end (the 12-, 8- and 4-foot circles round the button), the tee, back, hog and centre lines, the hacks, and, if asked, the free guard zone and the ice's pebble. It is drawn from two rule books, each cited figure by figure in [sources.md](./sources.md#curling): R1 of World Curling's *The Rules of Curling and Rules of Competition* (1 September 2026) and Rule 3 of Curling Canada's *Rules of Curling for General Play* (September 2022 to August 2026). The sheet lies **tall** by default, with the far house at the top; `orientation: "landscape"` lays it wide.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const tall = drawKyogijo({ sport: "curling" });
const wide = drawKyogijo({ sport: "curling", orientation: "landscape" });
console.log(tall.includes('data-orientation="portrait"'), wide.includes('data-orientation="landscape"'));
// true true
console.log(tall.match(/viewBox="([^"]*)"/)?.[1], "|", wide.match(/viewBox="([^"]*)"/)?.[1]);
// 0 0 21.58 156 | -3 -3 156 21.58
```

## The figures

The two books agree on every line and circle; they differ in what they print around them. World Curling's is the sport's own league (`wcf`, the default; its figures are in metres, the unit it prints first); Curling Canada's is `league: "curling-canada"` (feet, which it prints first).

| Figure | World Curling, R1 | Curling Canada, Rule 3 |
| --- | --- | --- |
| Sheet length | at least 45.720 m (150 ft); 44.501 m (146 ft) in an existing facility | 146 to 150 ft (44.501 to 45.720 m) from backboard to backboard |
| Sheet width | at most 4.750 m (15 ft 7 in); at least 4.420 m (14 ft 6 in) in an existing facility | 14 ft 2 in (4.318 m) to 15 ft 7 in (4.750 m) |
| Tee line | its centre 17.375 m (57 ft) from the middle of the sheet | 114 ft (34.747 m) from tee to tee; 16 ft (146-ft sheet) or 18 ft (150-ft) from the backboard |
| Back line | outside edge 1.829 m (6 ft) from the tee line's centre | 6 ft from the tee line's centre, tangent to the 12-foot circle |
| Hog line | 102 mm (4 in) wide, inside edge 6.401 m (21 ft) from the tee line's centre | the same |
| Centre line | from tee to tee and 3.658 m (12 ft) beyond each tee | the same |
| Circles | radii 1.829, 1.219 and 0.610 m; button at least 0.152 m | radii 6, 4 and 2 ft; button at least 6 in |
| Hacks | two, each inside edge 76 mm from the centre line, at most 152 mm wide and 203 mm in front of the hack line | back edge 12 ft from the tee, inside edge at most 3 in from the centre line, at most 8 in long |
| Hack line | 457 mm (1 ft 6 in) long, across the centre line 3.658 m from the tee | none printed |
| Courtesy lines | 152 mm long, 1.219 m (4 ft) outside each hog line, at each side | none printed |
| Free guard zone | between the tee line and the hog line, excluding the house (R6) | the same, with the Five Rock Rule (Rule 12) |
| A stone scores | in or touching the house, nearer the tee than any stone of the other team (R12) | any part of it within 6 ft of the tee (Rule 13) |

The sheet is drawn at the largest the rules allow, 150 feet by 15 feet 7 inches, with a line a little thicker than painted, as the other surfaces' are (`exactLines: true` draws them at their true widths: half an inch, and 4 inches for the hog line). The hog line is red, the other lines dark, the 12-foot band blue and the 4-foot band red. The hack line and the courtesy lines are World Curling's only, because Curling Canada's book prints neither.

```ts
import { dimensionsOf, surfaceSize } from "@johnmorrisdotca/kyogijo-stadiums/geometry";
import { LEAGUES, leagueFigures } from "@johnmorrisdotca/kyogijo-stadiums/leagues";

console.log(surfaceSize("curling", "ft"), dimensionsOf("curling", "ft").teeFromMiddle);
// { length: 150, width: 15.583333333333334, unit: 'ft' } 57
console.log(leagueFigures(LEAGUES.curling[1]).slice(0, 3).map(([name, value]) => `${name}: ${value}`).join("; "));
// sheet: 150 ft by 15 ft 7 in; least sheet: 146 ft by 14 ft 2 in; tee to tee: 114 ft
```

## Options

| Option | What it does |
| --- | --- |
| `league` | `wcf` (the default) or `curling-canada`: the book the figures and the marks follow. |
| `orientation` | `portrait` (the default for a sheet), `landscape`, or `auto`. |
| `sheet.length`, `sheet.width` | The length and the width of the sheet, in `units` (feet by default), within the league's range; a size outside it is an error that says the range. |
| `sheet.rings` | The colours of the house: `outer` (the 12-foot band, blue), `middle` (the 8-foot, white), `inner` (the 4-foot, red) and `button` (white). Any CSS colour that `colors` takes. |
| `sheet.pebble` | A fine texture of dots over the ice. Off by default. |
| `sheet.guardZone` | Shade the free guard zone at both ends. Off by default. |
| `sheet.show`, `sheet.end` | A part of a bare sheet: `half` (the hog line to the back line, which holds the free guard zone and the house), `house`, or `folded` (the whole sheet with both houses enlarged beside it: see [the top, the bottom, or both](#the-top-end-the-bottom-end-or-both-folded)), at the `left` end (the top of a tall drawing, the default) or the `right`; `top` and `bottom` say the same, as a tall sheet's ends are read. A score always shows the whole sheet. These are the sheet's `range` (`range: "house"`, `range: { name: "half", end: "bottom" }`, `range: "folded"`), which wins where both are given: see [Display ranges and zoom](./ranges.md). |
| `sheet.panels`, `sheet.fit` | For `folded`: what each enlarged panel holds, the `half` (the default) or the `house`, and the shape of the whole, width over height as it lies, from 0.5 to 2 (1, a square, by default). |
| `detail: "simple"` | Leaves out the hacks, the hack line and the courtesy lines. |

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const house = drawKyogijo({ sport: "curling", sheet: { show: "house", rings: { outer: "#0b6e4f", inner: "#d4a017" } } });
console.log(house.includes("--ky-rg-o:#0b6e4f"), house.match(/viewBox="([^"]*)"/)?.[1]);
// true 0 0 21.58 15
console.log(drawKyogijo({ sport: "curling", sheet: { length: 146, width: 14.5 } }).match(/viewBox="([^"]*)"/)?.[1]);
// 0 0 20.5 152
```

The sheet has no history in the package: a `year` is ignored.

## The top end, the bottom end, or both folded

A tall sheet is a strip 150 feet long and 15 wide, and a house on it is small. Three ways to look closer, each a `sheet.show` (and a named `range`):

| To see | Ask for | In a tall drawing |
| --- | --- | --- |
| only the top end | `show: "half"` or `"house"`, `end: "top"` (or `end: "left"`, or leave `end` out) | the far house, at the top |
| only the bottom end | `show: "half"` or `"house"`, `end: "bottom"` (or `end: "right"`) | the near house, at the bottom |
| both, enlarged beside the whole sheet | `show: "folded"` | the whole strip in the middle, the top house on its left and the bottom house on its right |

`top` is the left end of the sheet and `bottom` the right, as a tall sheet's ends are read; a wide sheet's are still its left and its right, and `left` and `right` mean what they always did. A `half` is the hog line to the back line, with the free guard zone; a `house` is just the circles with a little ice round them.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const viewBox = (svg: string): string | undefined => svg.match(/viewBox="([^"]*)"/)?.[1];
console.log(viewBox(drawKyogijo({ sport: "curling", sheet: { show: "half", end: "top" } })));
console.log(viewBox(drawKyogijo({ sport: "curling", sheet: { show: "half", end: "bottom" } })));
const bottom = drawKyogijo({ sport: "curling", id: "a", sheet: { show: "house", end: "bottom" } });
console.log(bottom === drawKyogijo({ sport: "curling", id: "a", sheet: { show: "house", end: "right" } }));
// 0 0 21.58 30.34
// 0 0 21.58 30.34
// true
```

### Folded

`show: "folded"` draws the whole sheet as a strip, and each house again, larger, beside it, so that the drawing fills a roughly square frame instead of a sliver. A tall drawing has the top house on the left and the bottom house on the right; a wide one has the left house above the strip and the right house below it (the same drawing turned a quarter).

- **The strip keeps its own scale and its own numbers**, so data laid on it (the stones of an end, a heat map) is where it was on a sheet drawn whole, and a layer that works on the strip works on the folded sheet.
- **Each panel is cut from the same sheet at a larger scale**, chosen so that the whole is square (`sheet.fit` says another shape, width over height as it lies, 0.5 to 2; a panel is never longer than the strip, so a very wide frame is as wide as the panels allow). `sheet.panels: "half"` (the default) gives each panel the hog line to the back line, with the free guard zone; `"house"` gives just the house.
- **Each panel is named and joined to its place.** A label ("Top house" and "Bottom house" in a tall drawing, "Left house" and "Right house" in a wide one, in Japanese too) stands beside the panel; a faint fan runs from the panel's edge to the part of the strip it enlarges, and that part is framed on the strip, as an inset on a map is joined to what it shows.
- **Data is drawn in the strip and again in each panel**, at the panel's scale: stones at the top house are in the strip, small, and in the top panel, large, and a heat map of them likewise. The copies in the panels are hidden from a screen reader, which hears the strip's layer once, and carry ids of their own; a colour bar that has a `region` inside a panel's part of the sheet (`curlingHeat` gives it one) is drawn there, large; one sized against the whole sheet is cut away in the panels.
- **The description says what is enlarged and where**, and that data is drawn in the enlarged parts as well.
- **Every renderer reads it**: the scene, the canvas, d3, Plot, GeoJSON and PNG read the drawing the SVG writes, panels, clips and all.
- **What it leaves out:** the annotations (`landmarks`, `axes`, `direction`) have no margin to stand in and are not drawn on a folded sheet, and a score shows the whole sheet, as with every `show`.

```ts
import { drawKyogijo, describe } from "@johnmorrisdotca/kyogijo-stadiums";

const tall = drawKyogijo({ sport: "curling", sheet: { show: "folded" } });
const wide = drawKyogijo({ sport: "curling", orientation: "landscape", sheet: { show: "folded", panels: "house" } });
console.log(tall.match(/viewBox="([^"]*)"/)?.[1], "|", wide.match(/viewBox="([^"]*)"/)?.[1]);
console.log(describe({ sport: "curling", sheet: { show: "folded" } }).description.split(". ").slice(1).join(". "));
// 0 0 156 156 | -3 -70.21 156 156
// Shown folded: the whole sheet is in the middle, with its top house enlarged on the left and its bottom house enlarged on the right. Each enlarged part runs from the hog line to the back line.
```

`curlingStones` and `curlingHeat` take `show: "folded"` too (`surface.sheet.show` says the same and wins), and put their key above the whole drawing.

```ts
import { curlingStones } from "@johnmorrisdotca/kyogijo-stadiums/charts";

const chart = curlingStones(
  [
    { x: 0.4, y: 0.3, team: "home", number: 8 },
    { x: -1.2, y: -0.8, team: "home", number: 6 },
    { x: 1.9, y: 1.1, team: "away", number: 7 },
    { x: 0.2, y: -9, team: "away", number: 3 },
  ],
  { end: 6, hammer: "home", show: "folded" },
);
const svg = chart.draw({ orientation: "landscape" });
console.log(chart.totals.points, svg.includes("ky-fold-data"), svg.includes("Left house"));
// 2 true true
```

## A score

A curling score is a board on the ice between the hog lines. A team's `ends` is its score in each end, in order (`"X"` for a conceded end, `null` for one not played yet); `hammer: true` marks the team that has the last stone. The board has ten ends and an `E` for each extra end, each team's total, and the status under it. A tall sheet has the ends down the board and a team in each column; a wide one has the ends across and a team in each row. The hammer is a small stone beside the team's name, on the board and on the badge.

```ts
import { drawKyogijo, statusLabel } from "@johnmorrisdotca/kyogijo-stadiums";

const game = {
  sport: "curling" as const,
  away: { name: "Harbour City Gulls", abbr: "HCG", score: 5, color: "#1d4f91", ends: [0, 1, 0, 2, 0, 0, 1, 0, 1, "X"] },
  home: { name: "Prairie Ridge Bison", abbr: "PRB", score: 4, color: "#a8452c", hammer: true, ends: [1, 0, 2, 0, 1, 0, 0, 1, 0] },
  status: "end-10",
};
const svg = drawKyogijo(game);
console.log(svg.includes("End 10"), svg.includes("Prairie Ridge Bison has the hammer."));
console.log(statusLabel("end-6"), statusLabel("extra-end"), statusLabel("End 6", "ja"));
// true true
// End 6 Extra end 第6エンド
```

- **Statuses.** `end-6` (or "End 6") is written "End 6", and `extra-end` "Extra end"; `final` is "Final" and decides the winner as for any game.
- **The sizes.** `size: "badge"` is the strip, with the house as its picture. `size: "compact"` is the sheet with that strip under it when the sheet lies wide; a tall sheet is a seventh as wide as it is high, too narrow for a strip under it, so its compact size is the board on the ice.
- **The description** says who has the hammer and each team's score in each end, as well as the score, so that a reader who cannot see the board has it.

## The stones of an end

`curlingStones` is a ready-made chart ([charts](./charts.md)) for the stones of an end on the house. It judges them by the rules, takes off the stones the rules take off, rings the stones that score and rings the shot rock twice, and tells the score of the end.

```ts
import { curlingScore, curlingStones } from "@johnmorrisdotca/kyogijo-stadiums/charts";

const stones = [
  { x: 0.4, y: 0.3, team: "home", number: 8 },
  { x: -1.2, y: -0.8, team: "home", number: 6 },
  { x: 1.9, y: 1.1, team: "away", number: 7 },
  { x: 0.2, y: -9, team: "away", number: 3 },
  { x: 8.5, y: 0, team: "home", number: 1 },
];
const chart = curlingStones(stones, { end: 6, hammer: "home", names: { home: "Prairie Ridge", away: "Harbour City" } });
console.log(chart.title, "|", chart.summary);
// Curling stones, End 6 | 4 stones in play. Prairie Ridge scores 2. 1 out of play. Prairie Ridge has the hammer.
console.log(chart.totals.points, chart.totals.scoring, chart.totals.shot, curlingScore(stones.slice(0, 3)).counting);
// 2 home 0 2
```

A stone is a place in feet from the button (the [`curling` frame](./frames.md)): `x` across the sheet, positive to the thrower's right, and `y` along it, positive towards the back line and negative towards the hog line. `units` gives another unit. The rules it applies:

- **Out of play.** A stone that touches a sideline, one that does not come to rest wholly beyond the hog line's inside edge, and one that has wholly crossed the back line's outside edge are removed (World Curling R2, Curling Canada Rule 13). They are counted in `totals.out` and not drawn.
- **Which stones can score.** A stone in or touching the house: any part of it within 6 feet of the button. A stone is drawn at the greatest the rules allow, 36 inches round, a little over 11 inches across.
- **Points.** The team with the stone nearest the button scores one point for each of its stones nearer than every stone of the other team. Stones as near as each other are equal, and equal stones do not count: if the two nearest, one of each team, are as near, the end is blank (World Curling R12(f), Curling Canada Rule 13(12)).

`chart.draw()` shows the half of the sheet from the hog line to the back line with the free guard zone shaded, at the left (top) house, or the right with `house: "right"`, and the stones as seen from above: grey granite, a handle in the team's colour (red for `home` and yellow for `away`, over `colors.layerHome` and `layerAway`), the stone's number. `chart.table()` lists every stone with its distance from the button, and says which count. The key is above a wide drawing.

The zone set `curling-house` counts any `zones` layer into the button, the 4-, 8- and 12-foot rings and the free guard zone, at each end ([data layers](./layers.md)).

## Where the stones of many ends came to rest

`curlingHeat` is a chart of the stones of many ends on a house: where they stopped, counted into cells, hexagons or a density, into the zones of the house, or drawn as translucent discs in each team's colour so that stones that fall on each other build up colour. It judges the stones by the same rules as `curlingStones` (a stone out of play is not drawn), and it can keep one team's stones, or only the free guards, or only the stones in the house, so that "where do the guards end up when the team has the hammer" is one call.

| Option | What it does |
| --- | --- |
| `view` | `heatmap` (counts in square cells, the default), `hexbin`, `contour` (a density), `zones` (the button, the three rings and the free guard zone, with the count in each) or `discs`. |
| `team` | Only this team's stones: `home` or `away`. |
| `only` | `all` of those in play (the default), `guards` (the free guards: between the tee line and the hog line, outside the house) or `house` (in or touching it). |
| `cell` | The width of a cell, or the radius of a hexagon, in feet. 1 foot by default. |
| `house`, `units`, `show` | The house the stones are at (`left`, the top, or `right`), their unit (feet from the button, as for `curlingStones`) and how much of the sheet is drawn: `half` by default, `house`, `sheet` or `folded`. |
| `labels`, `legend`, `ramp` | The count written in each cell or zone (off, except for zones); the colour bar (on; sized to the part of the sheet drawn, and on a folded sheet standing in the enlarged house the stones are at); the colour ramp of the heat layers. |

```ts
import { curlingHeat } from "@johnmorrisdotca/kyogijo-stadiums/charts";

// The stones that came to rest in a few ends, as feet from the button.
const stones = [
  { x: 0.3, y: 0.2, team: "home" },
  { x: -1.1, y: 0.9, team: "away" },
  { x: 0.1, y: -14, team: "away" },
  { x: 2.4, y: -17, team: "home" },
  { x: 0, y: -10, team: "home" },
  { x: 0, y: -30, team: "home" },
];
const chart = curlingHeat(stones, { only: "guards", view: "discs", show: "folded" });
console.log(chart.totals.inPlay, chart.totals.drawn, chart.totals.guards, chart.totals.house);
console.log(chart.summary);
// 5 3 { home: 2, away: 1 } { home: 1, away: 1 }
// 5 stones in play: 2 in the house and 3 in the free guard zone. Only the free guards.
```

The totals say how many stones were in play and drawn, the free guards and the stones in the house for each team (by the rules: a stone touching the house is in it), and the share of the stones drawn that came to rest in each zone (`totals.zones`, counted by the stone's centre, as the zone set `curling-house` does). `chart.table()` lists the cells or zones.

## Statistics

Small pure functions beside `curlingScore` ([charts](./charts.md)), for the numbers behind the pictures. They take plain data and draw nothing, so a chart of them is yours (Observable Plot and d3 read them as they are).

| Function | What it works out |
| --- | --- |
| `curlingFreeGuards(stones)` | the free guards of a layout: how many each team has and which stones they are. |
| `curlingInPlay(layouts)` | the stones in play after each throw of an end, and the most there were. |
| `curlingHammers(ends, first)` | the team with the hammer in each end: the team that scored gives it up; a blank end keeps it. |
| `curlingEndStats(ends, { hammer })` | each end (who scored, the hammer, a blank end, a steal, a forced end) and, for each team, its points, **hammer efficiency** (points per end with the hammer), how often it scored, blanked, was held to one or was stolen from with the hammer, and its **steal rate** without it. |
| `curlingGuardScores(ends)` | the **free guard analysis**: the average points each team scored against how many guards each had out, in bands (0, 1-2, 3+), with the pairs of bands as a table. |
| `curlingShotStats(shots)` | the **shot percentage** (points 0 to 4 as a percent of 4 for each scored shot), the **hit rate**, and how often each type of shot was played, for all the shots and for each team. |

```ts
import { curlingEndStats, curlingGuardScores, curlingInPlay, curlingShotStats } from "@johnmorrisdotca/kyogijo-stadiums/charts";

// What each team scored in each end, with the hammer to home in the first.
const game = curlingEndStats(
  [{ home: 2, away: 0 }, { home: 0, away: 1 }, { home: 0, away: 1 }, { home: 1, away: 0 }, { home: 0, away: 2 }, { home: 0, away: 0 }],
  { hammer: "home" },
);
console.log(game.home.points, game.away.points, game.blanks);
console.log(game.home.withHammer.efficiency, game.home.withHammer.stolenRate, game.away.withoutHammer.stealRate);
// 3 4 1
// 0.75 25 25

const guards = curlingGuardScores([
  { hammerGuards: 0, otherGuards: 1, hammerPoints: 1, otherPoints: 0 },
  { hammerGuards: 2, otherGuards: 0, hammerPoints: 2, otherPoints: 0 },
  { hammerGuards: 1, otherGuards: 2, hammerPoints: 0, otherPoints: 1 },
]);
console.log(guards.bands.join(" "), guards.hammer.map((band) => band.average ?? "-").join(" "));
// 0 1-2 3+ 1 1 -

const shots = curlingShotStats([
  { team: "home", type: "draw", score: 4 },
  { team: "home", type: "take-out", score: 3 },
  { team: "away", type: "Hit and Roll", score: 2 },
  { team: "away", type: "guard", score: 4 },
]);
console.log(shots.percent, shots.hitRate, shots.types.map((t) => `${t.type} ${t.share}%`).join(", "));
// 81.3 50 draw 25%, guard 25%, hit and roll 25%, take out 25%

// The most stones in play, throw by throw, for a histogram over many ends.
console.log(curlingInPlay([[{ x: 0, y: -12 }], [{ x: 0, y: -12 }, { x: 1, y: 0 }]]).max);
// 2
```

- **An end is scored by one team**, so an end with a score for both is an error, and a score is a whole number. The hammer's first holder is `hammer` (or the first end names its own); with neither, the hammer figures are left empty and the points are still counted.
- **Hits are the shot types in `CURLING_HIT_TYPES`** (take-out, double take-out, raise take-out, hit and roll, peel, clearing and runback), or what a shot says with `hit`; `curlingIsHit` is the test. Any other type is not a hit. Types are compared in lower case with one space between words, so `Hit-and-Roll` and `Hit & Roll` are `hit and roll`.
- **The shot percentage is World Curling's**: each shot is scored 0 to 4, and a team's percentage is the points it earned over four for each scored shot. A shot with no score is counted in the types and left out of the percentage; a score outside 0 to 4 is an error.
- **No inference.** Chi-square tests and the like are not here: a drawing package is for the picture and the counts behind it.

## What other curling analyses offer, and what is here

Two analyses were read for what a curling chart is worth having: [jdumm/curlovision](https://github.com/jdumm/curlovision) (broadcast video to stone positions, and the analyses of them) and Jordan Myslik's [Curling Analytics](https://jordanmyslik.com/portfolio/curling-analytics/) (World Curling's shot-by-shot summaries to a database, and a study of men's and women's play). What each offers, from the README and the page (for curlovision also the names of its functions), and what Kyogijo had before and has now. Nothing of either was copied: see [references](./references.md#curling).

| Feature | curlovision | Myslik | Kyogijo before | Kyogijo now |
| --- | --- | --- | --- | --- |
| The sheet and the house drawn to the rules | a house and its lines in pixels (`draw_house`) | a reference diagram of a sheet | yes, from both rule books, figure by figure | the same, and folded: the top and the bottom house enlarged beside the whole strip |
| The stones of an end drawn on the house | yes (`StoneLayout.draw`: grey stone, a handle in the team's colour) | an example of World Curling's shot-by-shot diagram, not drawn by the analysis | yes: `curlingStones`, with the number, the counting stones ringed and the shot rock ringed twice | the same, on the half, the house, the strip or the folded sheet, with the stones in the strip and in the enlarged house |
| Only the top end or only the bottom end | no (one house) | no | `show: "half"` or `"house"` with `end: "left"` or `"right"` | the same, with `top` and `bottom` as names for a tall sheet's ends, documented |
| All the ends of a game in one picture | yes (`MatchResult.draw`) | no | by hand | a `drawGrid` of the ends' charts (the gallery shows it) |
| An end's score from the stones | yes (`score_layout`: counts the nearest stones of one colour within the house) | the end's score is stored, not derived | yes: `curlingScore`, with the out-of-play rules, the equal-distance rule and the shot rock | the same |
| Stones in play, after each throw; the most in play | the stones left for each team and the layout after each throw | a histogram of the most stones in play, by gender | the count of one layout (`curlingScore`) | `curlingInPlay`: after each throw and the most |
| A heat map of where stones stop | yes (every stone of a set of matches, grey on the house) | yes (700,000 stones, the house at the bottom) | by hand, on the heat layers, with a cell size to find | `curlingHeat`: cells, hexagons, a density or zones, per team, for the guards or the house, on any part of the sheet |
| The free guards, drawn by team | yes (translucent discs, red and yellow) | no | the zone shaded | `curlingHeat` with `only: "guards"` and `view: "discs"`; `curlingFreeGuards` counts them |
| The free guard analysis: points against guards | yes (average score by the guards each team had out, hammer against not) | no | no | `curlingGuardScores` |
| The hammer: efficiency, steals, forced ends, blanks | reads who has the hammer; uses it in the guard analysis | stores `color_hammer`, does not analyse it | the hammer drawn on the board | `curlingHammers` and `curlingEndStats` |
| End-by-end scoring | reads each end's score from the scoreboard | stores each end's score (a third are missing), does not chart it | the board, with the score of each end | the same, and `curlingEndStats` for each end's record and the running score |
| Shot types, and hits against not | no | yes (shot type by gender; hit and not hit) | no | `curlingShotStats`: the types by how often each was played, and the hit rate |
| Shot percentage | no | stores each shot's score, 0 to 100, does not analyse it | no | `curlingShotStats`: the percentage, by team and by type |
| Stone paths | no (stones at rest) | no | lines and arrows on the curling frame; a replay of tracking data | the same: nothing curling-specific is drawn for a path |
| Tests of significance | no | yes (chi-square) | no | no: not a drawing |
| Positions from video, or from the PDFs | yes (OpenCV on broadcast video) | yes (OpenCV on the shot-by-shot PDFs) | no | no: data in, SVG out; the data is yours |

Of the other curling drawings, [`@sportsdataverse/sporty`](https://github.com/sportsdataverse/sdvplot-js) (MIT) and sportypy and sportyR (GPL-3.0) draw the sheet and no stones, scores or statistics; [Where it differs from `@sportsdataverse/sporty`](#where-it-differs-from-sportsdataversesporty) says how the sheet differs.

## Where it differs from `@sportsdataverse/sporty`

[`@sportsdataverse/sporty`](https://github.com/sportsdataverse/sdvplot-js) (MIT) draws a curling sheet too. Its numbers for both of its leagues (`wcf` and `curling canada`) are the same, and match these: 150 by 15.5833 feet, the tee line 57 feet from the middle, the back line 6 feet and the hog line 21 feet from the tee, rings of 6, 4 and 2 feet and a button of 0.5 feet, the centre line 12 feet beyond the tee, the hog line 4 inches. Where this package differs, and why:

- **The two books are told apart.** It draws the hack line and the courtesy lines for both leagues; here they are World Curling's (R1(b)V and VI), and Curling Canada's book prints neither.
- **The size is a range.** The books allow 146 to 150 feet and a width down to 14 ft 2 in or 14 ft 6 in; `sheet.length` and `sheet.width` take any size in them.
- **The rules around the sheet** (which stones are out of play, which score, which are in the free guard zone) are in the code here, from the rules cited above.

No code of sporty, and none of GPL-3.0 sportypy or sportyR, was used: only sporty's table of numbers was read, as facts, and every figure was read again from the two rule books.

## What is not drawn

World Curling's wheelchair lines (R1(c)), the positioned stones of mixed doubles (R17), the no-tick shot's zone (R7, which is a stone on the centre line and not an area), and the sheet's dividers and side boards beyond a plain band. The Five Rock Rule and the No-Tick rule are about what happens in play; the drawing shows the zone they refer to.
