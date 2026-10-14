# Data layers

`layers` in the options of `drawKyogijo` and `drawSurface` lays data on a surface. Two worked examples come first; then what each kind of layer takes. The [API reference](https://johnmorrisdotca.github.io/kyogijo-stadiums/api.html) has every type.

## Two examples

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

// The NHL API's coordinates are feet from centre ice: `from` puts them on the rink.
const svg = drawKyogijo({
  sport: "nhl",
  layers: [
    {
      kind: "points",
      name: "shots",
      from: "nhl-api",
      data: [
        { x: 69, y: 22, team: "home", outcome: "goal", value: 0.31 },
        { x: 54, y: -8, team: "home", outcome: "shot", value: 0.07 },
        { x: -61, y: 12, team: "away", outcome: "blocked", value: 0.04 },
      ],
      style: { size: { range: [2, 5] }, outcomes: { blocked: { hollow: true, shape: "x" } } },
    },
  ],
});
console.log(svg.includes("3 shots"), svg.includes("By outcome: goal 1, shot 1, blocked 1."));
// true true
```

A miss is drawn hollow and a failed pass dashed. Shapes, colour rules, comets, units, frames and the heat layers are below.

```ts
import { drawKyogijo, layerTable } from "@johnmorrisdotca/kyogijo-stadiums";

const passes = {
  kind: "arrows",
  name: "passes",
  from: "nfl-tracking",
  data: [
    { x: 40, y: 30, x2: 62, y2: 18, outcome: "complete" },
    { x: 40, y: 30, x2: 55, y2: 44, outcome: "incomplete" },
  ],
  style: { curve: 0.1, comet: true },
} as const;

console.log(drawKyogijo({ sport: "nfl", orientation: "portrait", layers: [passes] }).includes("linearGradient"));
console.log(layerTable([passes]).includes("<caption>2 passes"));
// true
// true
```

`drawLayers(options, layers)` returns the group alone; `layerTable(layers)` an HTML table for each layer, for a screen reader. Each layer has a `<title>` and a `<desc>` ("24 shots", "By outcome: goal 3, shot 21."), and a mark's `title` is its tooltip.

## What a layer takes

A layer is `{ kind, data, style, ...places }`. The marks are plain SVG elements in the surface's own frame, drawn over the markings and under a score's panel, cut to the surface's outline and turned back upright when the surface lies tall. The same options always give the same string.

- **Points.** `shape` is `circle`, `square`, `triangle`, `diamond`, `cross`, `x`, `star` or `logo` (a team's logo: its own `logo`, `style.logos`, or the team's in a score drawing). `size` is a width in the layer's units or a `Scale` from each mark's `value` (`{ range: [2, 5] }`, by area); without one a mark is 1.3 percent of the surface's longer side. `fill` is a colour or a rule: `{ by: "team" }`, `{ by: "value", stops }` or `{ by: "outcome", colors }`. A mark's own `color` always wins. A mark that carries a `team` of `home` or `away` takes the layer's home or away colour.
- **Outcomes.** A mark's `outcome` is a word of yours. The standard ones are in `OUTCOMES`: `goal`, `made`, `hit`, `complete` are filled and `goal` is a little larger; `shot`, `missed`, `saved`, `blocked`, `incomplete`, `failed` are hollow. A hollow point is drawn open and a hollow line is dashed, so an outcome is never told by colour alone. `style.outcomes` adds words and changes these: `{ outcomes: { homer: { shape: "star", scale: 1.5 } } }`.
- **Lines and arrows.** Each is `x, y, x2, y2`, or `points` for a path. `curve` bows a line by a share of its length, `wavy` draws it as a wave (a carry), `head` is `triangle`, `open` or `none` (arrows have a triangle), `dash` is `auto` (a hollow outcome dashes), `solid`, `dashed` or `dotted`, and `comet` fades a line in along its length with a gradient of its own (`comet: { taper: true }` also thickens it). Gradient ids start with the drawing's id, so two drawings on a page do not share one.
- **Text.** `text` is a word or a number at `(x, y)`, upright when the surface is tall, with a halo (`--ky-layer-halo`) so that it reads on any ground; `rotate` turns it as the eye sees it.
- **Places.** Without `from`, coordinates are in the layer's `units` (the drawing's `units`, else feet; `"rulebook"` is the unit of the sport's rulebook). With `from` (a name in `FRAMES` or a `Frame`), they are the frame's numbers and go through `toSurface` with the layer's `attacking`, `surfaceSize` and `anchors`. `limits` holds a mark on the surface instead of cutting it. `clip: "none"` lets a layer run over the ground round the surface.


## Team layers

Seven more kinds read where a team's players stand and how they move: `network`, `formation`, `voronoi`, `delaunay`, `hull`, `flow` and `sonar`. They take the same places as the others and are on their own page: [Team shape](./team-shape.md).

## Heat layers

Five more kinds count marks into cells, hexagons, named zones or a density, and read the result in a colour ramp. They take the same places as the others (`from`, `units`, `attacking`, `limits`, `clip`, `hidden`) and the same marks as `data`: `{ x, y }`, with a `value` (a number to sum or average: expected goals, a distance, points) and an `outcome` (`made`, `goal`: what a success is for the `rate` statistic). They are drawn over a pale or dark ground (`ground: "plate"`, the default) so that the ramp is read against one colour whatever the surface, and cut to its outline: the boards, the fence, the lines of the court.

| Kind | What it draws | Its own options |
| --- | --- | --- |
| `heatmap` | A statistic in each cell of a grid over the surface (hockey_rink's `heatmap`, mplsoccer's `bin_statistic`). | `bins`: a number across the longer side (square cells, about 24 by default), `[across, down]`, or `{ x, y }` each a count or a list of edges in the layer's coordinates; `extent`: grid only part of the surface. |
| `hexbin` | The same on hexagons. | `size` (centre to corner, in the layer's units), `orientation` (`pointy` or `flat`). |
| `zones` | A statistic in each named zone of the sport. | `zones` (a set, below), `direction`, `end`, `los`, `bats`. |
| `contour` | A Gaussian kernel density of the marks as filled bands or lines, clipped (hockey_rink's `contourf`, mplsoccer's `kdeplot`). | `bandwidth` (units, or `[x, y]`, or `scott`), `smooth` (a multiple), `grid`, `levels` (a count, or the levels), `by` (`peak` or `mass`), `threshold`, `filled`, `weighted`, `extent`. |
| `legend` | A colour bar with ticks and the statistic's name, on its own. | `for` (the `id` of a heat layer, drawn before or after), or `ramp`, `domain`; `position`, `ticks`, `name` (the heading). |

**Statistics** (`statistic`, the same for the first three): `count` (the default), `sum`, `mean`, `median`, `max` or `min` of the marks' `value`, `percent` (a bin's share of all the marks, 0 to 100), `rate` (the percent of a bin's marks whose `outcome` is in `success`, by default `made`, `goal`, `scored`, `hit`, `complete`, `success`, `won`: a field-goal percentage) or a function `(values, { count, hits, total }) => number | null` (the one option that is not plain data). `normalize` rescales afterwards: `max` (the highest becomes 1), `sum` (a share of the total, 0 to 1) or `percent`. `minCount` leaves out a cell or zone with too few marks (a rate from two shots). A mark with no place, or outside the grid or every zone, is not counted, and the description says how many.

**Labels and legends.** `labels: true` writes each cell's or zone's value, upright when the surface is tall; `labels: { show, decimals, size, minCount }` writes `value`, `name`, `count`, `share` or `ratio` (made over taken, `13/31`) a line each, smaller to fit a small zone and left out when it cannot be read. `legend: true` (or `{ position, title, ticks }`) draws the bar in a group of its own, not cut to the surface, at the lower edge (a ballpark's lower right, outside the foul lines) or a corner; on a tall surface it is turned upright.

**Colours.** `ramp` is a built-in name, a list of stops, or `{ light, dark }` lists. Built-in: sequential `ember` (the default), `ocean` and `mono`, diverging `balance` (blue to orange) and `tide` (purple to green), each with a light page's nine stops and a dark page's. On a light page more is darker, on a dark page more is brighter. The ramp is cut into `steps` (9) over `domain` (the data's own range) and a layer's cells are drawn in one path for each step, in `fill:var(--ky-hv4,#d9561f)`: the dark set is a rule scoped to the layer's id (`@media (prefers-color-scheme:dark)`, `[data-theme=dark]`), so a layer is right in both without a script, and with `style: "none"` the layer still brings it. `center` makes the ramp diverge from a value (`balance` by default): the domain becomes symmetric about it. The first fifth of a sequential ramp is left unused, so that the least value present is still a tint and not the ground. The ground, the outlines and the legend are `--ky-heat-ground`, `--ky-layer-edge`, `--ky-plate` and `--ky-plate-ink`; their rules are in `KYOGIJO_HEAT_STYLE` (written beside a heat layer, and part of `KYOGIJO_STYLE`).

How they were checked: a test reads the surface colours of all the sports and the ground out of the stylesheet, lays the ground over each, and requires that each ramp's strong end (the top four stops of a sequential ramp, the outer two on each side of a diverging one) is at least 3:1 against every surface, light and dark (the lowest is 3.1:1, `tide` on a light page; most are over 4), the middle of a sequential ramp at least 2:1, the diverging ramps' neutral middle within 1.4:1 of the ground (no difference draws nothing loud), every step distinct from the last, and the steps ordered by luminance the right way for the page. Cells in the faintest steps are meant to be faint.

### Zone sets

`zones` names a set. Where a set is for a sport it refuses another. The zones do not overlap, a point belongs to one or none, and the sources of the definitions are in [sources.md](./sources.md#zone-sets).

| Set | Sport | The zones |
| --- | --- | --- |
| `soccer-positional` | soccer | Juego de posición: five lanes (wings, half-spaces, centre) by six bands from the team's own goal, 30 in all. |
| `soccer-thirds`, `soccer-channels`, `soccer-18` | soccer | Defensive, middle and attacking third; the five lanes alone; six bands by three lanes, numbered along the attack. |
| `nba-shot` | NBA | Restricted area, in the paint (not the restricted area), mid-range, left and right corner 3, above the break 3: at one end, or at both (`end`). |
| `nhl-slot`, `nhl-home-plate` | NHL | Inner slot, outer slot, behind the goal line and the rest of the offensive zone; or home plate and the rest. |
| `baseball-spray` | MLB | Pull, centre, opposite (or left, centre, right with `bats: "none"`) by infield and outfield. |
| `baseball-retrosheet` | MLB | Retrosheet's 68 hit-location sectors, each point in the sector with the nearest centre (the same as `zoneAt`). |
| `curling-house` | curling | The button, the 4-, 8- and 12-foot rings and the free guard zone, at each end (`end`). |
| `net-court` | tennis, volleyball, badminton, pickleball, table tennis | Each side of the net (`end`): the front court and the back court, split at the sport's own line (the service line, the attack line, the short service line, the non-volley zone line), or one half court where there is none. |
| `field-thirds` | lacrosse, rugby, Australian football, Gaelic games, field hockey, handball | The surface in thirds along it, counted from the team's own end (`direction`). |
| `cricket-ground` | cricket | The pitch, the ground inside the fielding circle (where the league has one) and the outfield. |
| `football-pass` | NFL, CFL, IFAF | Short and deep (15 yards past the line of scrimmage, `los`) by left, middle (between the hash marks) and right. |

`direction` is the way the team attacks as the surface is drawn wide (`right` by default): it names the sides of a soccer team's lanes, counts its bands from its own end and says which way a football pass goes. Left and right are the team's, or the passer's, or the shooter's facing the basket (the NBA's `LOC_X` is negative at his left, so a shot in `from: "nba-stats"` lands in the left corner when its `LOC_X` is under -220). `ZONE_SETS` lists the sets with their sports and their sources; `buildZoneSet(set, context)` gives the shapes and the classifier of one, from the `/layers` entry, for a caller who wants the counts without a drawing.

### The numbers

The layers entry exports what the layers use: `binGrid`, `hexBins`, `reduceBin` (the statistics), `densityGrid`, `scottBandwidth`, `massThresholds`, `contourRings`, `niceTicks` and `resolveRamp`, all pure functions of numbers. The density is a Gaussian kernel summed on a grid of nodes (each mark adds a bell to the nodes within four bandwidths, so the cost is the number of marks times a small window); Scott's rule sets each axis's bandwidth to its standard deviation times n^(-1/6) (Silverman's rule is the same number in two dimensions); the density is not folded back at the edges, so what lies beyond the box is lost; contours are marching squares on a grid padded with a border below every level, so every ring closes, drawn with the even-odd rule so that a hole is empty.

## Colours

Marks use custom properties, set on the drawing's `svg` with a light and a dark set: `--ky-layer` (the plain colour), `--ky-layer-home` and `--ky-layer-away` (marks with a `team`; in a score drawing the teams' own colours), `--ky-layer-edge`, `--ky-layer-hollow`, `--ky-layer-ink` and `--ky-layer-halo`. `colors` in the options sets them from code (`layer`, `layerHome`, `layerAway`, `layerEdge`, `layerHollow`, `layerInk`, `layerHalo`). With `style: "none"` the page supplies the rules: put `KYOGIJO_STYLE` in the page once.

## Accessibility

Each layer is a group with a `<title>` and a `<desc>`. Marks may carry a `title`, which is their tooltip. `layerTable(layers, { language, maxRows, className, surface })` returns one HTML table for each layer, hidden layers included, with the numbers as text in the layer's own frame; every cell is escaped. For a heat layer, pass the drawing's options as `surface`: the table then has a row for each zone (zone, count, value, share), the cells that hold something, the hottest first (centre, count, value), or each contour level (level, marks inside, share); without `surface` the marks are listed as points. A heat layer's `<desc>` gives the statistic and its range and names the three hottest cells or zones (or the density's peak).

## Size and speed

1,000 points add about 60 kB to a drawing, and 10,000 points are drawn in about 20 ms on a laptop; tests hold the first under 70 kB and the second under 250 ms. A line with a comet costs about 400 bytes, with the gradient of its own.

A heat map on a grid of 50 by 30 adds under 30 kB to a drawing on any of the twenty sports (13 to 23 kB with the legend off, about 5 ms to draw), and under 100 kB with every cell labelled; a test holds both. A density of 10,000 marks takes about 25 ms on a laptop (a grid of 100 by 60 nodes; 40 ms at 200 by 100) and adds about 8 kB; the test holds it under 500 ms. Hexagons take 15 ms for 10,000 marks.

## Ideas credited

See [references.md](./references.md): hockey_rink's and mplsoccer's lists of charts were read to know what to match (the heat layers match their binned statistics, heat maps, hexbins, contours and positional zones); no code of either is used.
