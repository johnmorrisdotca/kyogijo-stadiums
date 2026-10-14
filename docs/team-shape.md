# Team shape

Eight kinds of [data layer](./layers.md) read where a team's players stand and how they move: a **pass network**, a **formation**, a **lineup** (the players of a team placed by position code), the **Voronoi** cells that say who controls the space, a **Delaunay** triangulation of who is near whom, the **convex hull** of a team's shape, a **flow field** of average directions and a **sonar** of direction roses. Each is drawn on any surface, in the surface's feet or a provider's [frame](./frames.md), cut to the surface's outline, in the team colours of the page (light and dark), with a title, a description and a table of its numbers for a screen reader. The geometry is written for this package, with no dependency.

| Kind | What it draws | Its data |
| --- | --- | --- |
| `network` | A node for each player at the average place of the passes he made and received, sized by touches, and a link for each pair sized and shaded by their passes. Also `passNetwork(passes, options)` in the [charts](./charts.md) entry. | passes: `{ from, to, x, y, x2, y2, team }` |
| `formation` | A labelled mark for each position of a named formation, with the players of a lineup on them. See [Formations](#formations). | a `formation` and, if you like, `{ position, number, name }` players |
| `lineup` | A team's players placed by position code, as discs or jerseys with the number in them and the name under them. See [Lineups](#lineups). | `players`: `{ pos, name, number, flag, captain }`, and a `formation` if you like |
| `voronoi` | The part of the surface nearest each player, in his team's colour: space control, with each team's share. | players: `{ x, y, team }` |
| `delaunay` | The triangulation of the players, for each team or all of them. | players |
| `hull` | The convex hull of each team's players, with its area. | players |
| `flow` | An arrow in each cell of a grid: the average direction of the movements that start there. | movements: `{ x, y, x2, y2 }` or `{ x, y, dx, dy }` |
| `sonar` | A rose of how many movements go each way (or how long they are), for the whole surface, each player, each cell or each zone. | movements |

## Pass networks

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

// Passes in Opta's numbers: who passed to whom, from where to where. Players are told apart by id (and by team).
const passes = [
  { from: 4, to: 8, x: 30, y: 40, x2: 45, y2: 55, team: "home", fromNumber: 4, toNumber: 8 },
  { from: 8, to: 4, x: 45, y: 55, x2: 32, y2: 42, team: "home" },
  { from: 4, to: 8, x: 31, y: 41, x2: 46, y2: 54, team: "home" },
  { from: 8, to: 9, x: 46, y: 54, x2: 70, y2: 50, team: "home", toNumber: 9 },
];
const svg = drawKyogijo({ sport: "soccer", layers: [{ kind: "network", from: "opta", data: passes, minPasses: 2 }] });
console.log(svg.includes("Pass network: 3 players, 1 links from 4 passes"));
console.log(svg.includes("Strongest link: 4 and 8, 3 passes."));
// true
// true
```

A player is a node at the average of the places he passed from and received at (the pass's `x`, `y` and, if given, `x2`, `y2`), as big as his touches (passes made and received). A pair is one link, as wide and as dark as the passes between them, unless the network is `directed`, which draws a link for each direction, bowed apart, with a head. The layer's options:

| Option | What it does |
| --- | --- |
| `minPasses` | Leave out links of fewer passes than this. 1 by default (the chart's default is 3). The description says so. |
| `directed` | One link for each direction, with a head. |
| `nodes` | `{ id, x, y, team, name, number }` for players whose place you give, over the averages. |
| `nodeSize`, `linkWidth`, `linkOpacity` | The smallest and the largest, `[least, most]`: widths in the layer's units, opacity from 0 to 1. |
| `labels` | What a node says: `number` (the default), `name`, `id` or `none`. |

Two teams in one layer are two networks: a player is told apart by his team, so number 4 of each is two players. The chart makes the layer, a key and the totals in one call:

```ts
import { passNetwork } from "@johnmorrisdotca/kyogijo-stadiums/charts";

const chart = passNetwork(
  [
    { from: 4, to: 8, x: 30, y: 40, x2: 45, y2: 55, team: "home" },
    { from: 8, to: 4, x: 45, y: 55, x2: 32, y2: 42, team: "home" },
    { from: 4, to: 8, x: 31, y: 41, x2: 46, y2: 54, team: "home" },
    { from: 8, to: 9, x: 46, y: 54, x2: 70, y2: 50, team: "home" },
  ],
  { provider: "opta", minPasses: 2 },
);
console.log(chart.summary);
console.log(chart.totals.busiest, chart.totals.strongest);
console.log(chart.layers.map((layer) => layer.id).join(" "));
// Passes 4, players 3, links 1.
// { id: 8, name: '8', touches: 4 } { from: '4', to: '8', passes: 3 }
// network key-marks key-text
```

`passNetwork` takes the options of the other charts (`language`, `id`, `key`, `surface`) and `provider` (the frame of the passes, `international` by default), `attacking`, `minPasses`, `directed`, `labels`, `pitch` and `ground`; `chart.table()` is two tables, the players (touches, passes made and received, where) and the links.

## Formations

`FORMATIONS` holds the named formations of thirteen sports. Each position is a place in a registered [frame](./frames.md), for a team that attacks the right end of the surface as it is drawn wide, so a formation lies on a surface of any size and a layer needs no coordinates.

| Sport | Formations (`id`) |
| --- | --- |
| Soccer, in `opta` | `4-4-2`, `4-3-3`, `4-2-3-1`, `4-1-4-1`, `3-5-2`, `3-4-3`, `5-3-2`, `5-4-1`, `4-3-2-1`, `4-4-2-diamond` |
| Hockey, in `nhl-api` | `hockey-5v5` (the goaltender and five skaters), `hockey-1-3-1` (a power play), `hockey-two-lines` (the six on the ice and the next line and pair in a row along the bench) |
| Basketball, in `nba-stats` | `basketball-traditional`, `basketball-5-out`, `basketball-4-out-1-in`, `basketball-high-post` |
| Football, in `nfl-tracking` | `football-i-formation`, `football-shotgun` (the offence), `football-4-3`, `football-3-4` (the defence) |
| Baseball and softball, in `retrosheet` | `baseball-standard`, `baseball-shift`, `softball-standard` (a 60-foot diamond); each lists the designated hitter beside home plate |
| Rugby union, in `rugby` | `rugby-15`: the numbers 1 to 15 |
| Australian football, in `afl` | `afl-18`: five lines of three and three followers |
| Cricket, in `cricket` | `cricket-test-attacking` (three slips and a gully), `cricket-powerplay` (two outside the circle), `cricket-boundary-defence` (five outside it), for a right-handed batter |
| Volleyball, in `volleyball` | `volleyball-rotation`: the six places `P1` to `P6` |
| Handball, in `handball` | `handball-attack`, `handball-6-0` (a defence) |
| Water polo, in `waterpolo` | `waterpolo-attack` (six on five) |
| Field hockey, in `fieldhockey` | `fieldhockey-4-3-3`, `fieldhockey-3-4-3` |
| Netball, in `netball` | `netball-start`: the seven positions, which are its zones |

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";
import { FORMATIONS, formationById, positionName } from "@johnmorrisdotca/kyogijo-stadiums/layers";

console.log(Object.keys(FORMATIONS).length, formationById("4-3-3").positions.length);
console.log(positionName("soccer", "LB", "en"), positionName("soccer", "LB", "ja"));
// 36 11
// Left back 左サイドバック
const svg = drawKyogijo({
  sport: "soccer",
  layers: [
    {
      kind: "formation",
      formation: "4-2-3-1",
      team: "home",
      data: [
        { position: "GK", number: 1, name: "Okafor" },
        { position: "ST", number: 9, name: "Silva" },
      ],
      names: true,
    },
    { kind: "formation", formation: "4-4-2", team: "away", attacking: "left" },
  ],
});
console.log(svg.includes("Players: Okafor (Goalkeeper), Silva (Striker)."));
// true
```

A mark says its position (`GK`, `LB`), or, with a lineup in `data`, the player's `number`; `labels` says `position`, `number`, `name` or `none`, and `names` writes the name under the mark. A position nobody stands on is hollow. `attacking: "left"` turns the formation for a team that attacks the left. A football formation is written with the ball at midfield and the offence going right (a defence faces it): `los` is where the ball lies, in the numbers of `nfl-tracking` (yards from the back of the left end zone), and `attacking` is the way the offence goes. A formation of your own is `{ id, sport, frame, name, about, positions: [{ id, x, y }] }` as the `formation`. A formation may also list `extra` places, which a `formation` layer leaves out and a [lineup](#lineups) draws (baseball's designated hitter), and a position's `size` (a lineup's mark is that much of the usual one; a second line's is 0.8).

A formation is a convention that coaches draw a little differently each time, so each place is an example of the shape and not a measurement, and the numbers are ours. The position names are conventional too, in English and Japanese: the Laws of the Game (Law 3) name the goalkeeper and no other position, and the Official Baseball Rules name the nine fielders. The baseball shift is the one against a left-handed pull hitter; since 2023 MLB's Rule 5.02 requires two infielders on each side of second base, so it is not allowed there. [sources.md](./sources.md#formations) says where each figure is from.

## Lineups

A **lineup** places a team's players by their position code, so a team sheet is all it needs: no coordinates. It reads where each position stands from a [formation](#formations), draws each player as a disc or a jersey with his number in it and his name under it, and puts the visitors at the other end. Two teams are two layers.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const home = [
  { pos: "GK", number: 1, name: "Okafor" },
  { pos: "RB", number: 2, name: "Silva" },
  { pos: "CB", number: 4, name: "Van der Berg-Hoekstra", captain: true },
  { pos: "CB", number: 5, name: "Mbeki" },
  { pos: "LB", number: 3, name: "Ito" },
  { pos: "DM", number: 6, name: "Rossi" },
  { pos: "DM", number: 8, name: "Nakamura" },
  { pos: "RW", number: 7, name: "Costa" },
  { pos: "AM", number: 10, name: "Dubois" },
  { pos: "LW", number: 11, name: "Haddad" },
  { pos: "ST", number: 9, name: "Kowalski" },
];
const away = [{ pos: "GK", number: 1, name: "Meyer" }, { pos: "ST", number: 9, name: "Moreau" }, { pos: "ST", number: 10, name: "Eze" }];
const svg = drawKyogijo({
  sport: "soccer",
  layers: [
    { kind: "lineup", side: "home", shape: "jersey", players: home },
    { kind: "lineup", side: "away", formation: "4-4-2", players: away },
  ],
});
console.log(svg.includes("Lineup in 4-2-3-1: 11 players"));
console.log(svg.includes("Captain: Van der Berg-Hoekstra."));
// true
// true
```

The home team above has no `formation`: the one of the surface's sport that places the most of the players is chosen (4-2-3-1 for this sheet, with two defensive midfielders and an attacking one), and the first of the table on a tie. `formation` names one (`"4-4-2"`, `"cricket-powerplay"`) or is one of your own.

| Option | What it does |
| --- | --- |
| `side` | `home` (the default) or `away`: the team's colour and the end it attacks, the right or the left. A football lineup's `side` is only the colour (the offence goes right and a defence faces it; `attacking` says otherwise), and baseball's fielders and a cricket field do not turn. |
| `players` | `{ pos, name, number, flag, captain, line, color, title }`. `pos` is a code, below. A player with no place in the formation is not drawn; the description and the table list him. |
| `formation` | An id of `FORMATIONS`, or a formation of your own. Without it, the best fit (a softball field gets `softball-standard`). |
| `shape` | `disc` (the default) or `jersey`. |
| `labels` | What a mark says: `number` (the default; the position's code where a player has no number), `position`, `name` or `none`. |
| `names` | Write each name under its mark. On by default. |
| `size` | The width of a mark in the layer's units, a share of the surface by default. |
| `rotation` | Volleyball: how many rotations on, 1 to 6. Players are listed in the serving order, `P1` to `P6`, and each moves one place clockwise for each rotation. |
| `los`, `attacking` | As for a `formation`. |

A lineup is not cut to the surface's outline, so that a fielder at the foul line keeps his whole jersey (`clip: "surface"` cuts it).

**Position codes.** A code is a position's id in the formation (`GK`, `SS`, `QB`, `LW`) or a short one that stands for several; the first free place that fits is taken, and a code that names a place has it before a short one. `LINEUP_CODES` (in the layers entry) lists them all. Case, spaces, dots and hyphens do not matter.

| Sport | Codes |
| --- | --- |
| Soccer, field hockey | The ids (`GK`, `RB`, `RCB`, `CDM`, `RW`, `ST`...) and `CB`, `D` (a centre-back of either side), `DM`, `CM`, `AM`, `RM`, `LM`, `ST`, `CF` and `FW`, which take the places of that kind in the formation |
| Hockey | `G`, `LD`, `RD`, `LW`, `C`, `RW`; `D` (either defenceman), `W` (either wing), `GOALIE`. `line: 2` puts a player on the second line or pair (`hockey-two-lines`). |
| Basketball | `PG`, `SG`, `SF`, `PF`, `C`; `G`, `F`, `GF` and `FC` |
| Football | The ids (`QB`, `HB`, `WR1`, `LDE`, `MLB`...) and `WR`, `RB`, `OG`, `OT`, `DE`, `DT`, `CB`, `S`, `LB`, `OLB`, `ILB` |
| Baseball, softball | `P`, `C`, `1B`, `2B`, `3B`, `SS`, `LF`, `CF`, `RF`, the scorer's numbers 1 to 9, `OF`, `IF`, and `DH`, who is listed beside home plate |
| Rugby union | The numbers 1 to 15, and `LHP`, `HK`, `THP`, `LK`, `BF`, `OF`, `N8`, `SH`, `FH`, `SO`, `IC`, `OC`, `CTB`, `WG`, `FB` |
| Australian football | The ids (`BPL`, `FB`, `HBFL`, `CHB`, `WL`, `C`, `CHF`, `FF`, `RUC`, `RR`, `ROV`...) and `BP`, `HBF`, `W`, `HFF`, `FP` |
| Cricket | `BWL`, `WK`, `SL1` to `SL3`, `GU`, `PT`, `CV`, `MO`, `MN`, `MW`, `SQ`, `FL`, `TM`, `LO`, `LN`, `DC`, `DM` |
| Volleyball | `P1` to `P6`, or the numbers 1 to 6 |
| Handball | `GK`, `LW`, `LB`, `CB`, `RB`, `RW`, `PV`; `P` for the pivot |
| Water polo | `GK`, `LW`, `RW`, `LD`, `RD`, `CF`, `CB`; `HS` for the hole set (the centre forward) and `PT` for the point (the centre back) |
| Netball | `GS`, `GA`, `WA`, `C`, `WD`, `GD`, `GK` |

Left and right are the team's own, as it faces the end it attacks: a team that attacks the right has its left at the top of the page, and the visitors, who attack the left, have theirs at the bottom.

**The marks.** The number is in the mark, in white on the team's colour with a dark outline, so it reads on any team's colour, in a light and a dark page. A name goes under the mark at the biggest size that fits between its neighbours, down to a fifth of the mark's width; a name still too long is cut with an ellipsis, and a name with no room for two letters (a football line stands shoulder to shoulder, so use a `range` or a bigger `size`) is left out of the picture but stays in the tooltip, the description and the table. The mark of a place nobody takes is hollow and says its code. A `captain` has a small yellow "C" on the mark. A `flag` is a small badge on the other corner: an SVG as text, an image `data:` address or the address of an image (the same as a team's `logo`; a script is refused). The package draws no flag of its own: [`@johnmorrisdotca/hata`](https://www.npmjs.com/package/@johnmorrisdotca/hata) draws them.

**Football, baseball and the others.** Two football teams are an offence and a defence: `{ kind: "lineup", side: "home", players: [{ pos: "QB" }, ...] }` takes the I formation, `{ kind: "lineup", side: "away", players: [{ pos: "DE" }, ...] }` takes the 4-3, and `los` moves the ball. A baseball lineup adds the designated hitter (`pos: "DH"`) beside home plate. A volleyball team stands in the six places of its rotation, and a hockey team's second line is a row of smaller marks along the bench. Cricket's formations are fielding presets for a right-handed batter, with the striker's end at the right: the off side is up the page. [sources.md](./sources.md#formations) says what each rests on.

## Space and shape

```ts
import { drawKyogijo, layerTable } from "@johnmorrisdotca/kyogijo-stadiums";
import { convexHull, delaunay, voronoiCells } from "@johnmorrisdotca/kyogijo-stadiums/layers";

const players = [
  { x: 25, y: 50, team: "home", number: 4 },
  { x: 45, y: 25, team: "home", number: 8 },
  { x: 45, y: 75, team: "home", number: 10 },
  { x: 65, y: 50, team: "away", number: 5 },
  { x: 80, y: 30, team: "away", number: 9 },
];
const layers = [
  { kind: "voronoi", from: "opta", data: players },
  { kind: "hull", from: "opta", data: players },
  { kind: "delaunay", from: "opta", data: players, triangles: true },
] as const;
const svg = drawKyogijo({ sport: "soccer", layers });
console.log(svg.includes("Share of the surface nearest each team's players: home"));
console.log(layerTable(layers, { surface: { sport: "soccer" } }).includes("Share of the surface (%)"));
// true
// true

// The geometry on its own: the corners of the hull, the triangles and the cells in a box.
const points: [number, number][] = [[0, 0], [10, 0], [5, 8], [5, 3]];
console.log(convexHull(points).length, delaunay(points).triangles.length / 3, voronoiCells(points, { x: 0, y: 0, w: 10, h: 10 }).length);
// 3 3 4
```

- **`voronoi`** gives each player the part of the surface nearer him than any other player, coloured by his team: the space his team controls. The description gives each team's share of the surface, counted on a grid laid over the surface and kept where the surface is, so a rink's rounded corners and a ballpark's fence are not counted. Players standing in one place share one cell, and the description says how many have none.
- **`delaunay`** triangulates the players of each team (`by: "team"`, the default) or all of them (`by: "all"`): triangles whose circle holds no other player, a mesh of near neighbours. `triangles: true` fills them; without it only the edges are drawn.
- **`hull`** is the smallest convex shape that holds a team's players, with its area in the layer's units squared. Two players are a line and one is a dot, and nothing fails.
- All three mark each player with a dot (`points: false` leaves them out) and take a player's own `color`.

The geometry is [Andrew's monotone chain](https://en.wikipedia.org/wiki/Gift_wrapping_algorithm) for the hull, Bowyer and Watson's incremental method for the triangulation (the hull is kept with "ghost" triangles, so that no sliver of it is lost), and, for each cell, the surface's box cut by the bisector of each neighbour in the triangulation. `convexHull`, `delaunay`, `voronoiCells`, `polygonArea` and `polygonCentroid` are exported from the layers entry. They are held by tests on random points, a lattice (four points on every circle), points all on one circle, collinear points, repeated points, one point, none, points far from the origin and points of a tiny or a huge scale.

## Flow fields and sonars

```ts
import { drawKyogijo, layerTable } from "@johnmorrisdotca/kyogijo-stadiums";

// 60 passes that go forward and a little up the page, from different players.
const passes = Array.from({ length: 60 }, (_, i) => ({ x: 20 + (i % 10) * 5, y: 30 + (i % 6) * 8, x2: 32 + (i % 10) * 5, y2: 34 + (i % 6) * 8, id: i % 3 }));
const flow = { kind: "flow", from: "opta", data: passes, bins: 8 } as const;
const sonar = { kind: "sonar", from: "opta", data: passes, by: "player", angles: 8 } as const;
console.log(drawKyogijo({ sport: "soccer", layers: [flow] }).includes("Flow of 60 movements"));
console.log(drawKyogijo({ sport: "soccer", layers: [sonar] }).includes("3 roses of 8 directions"));
console.log(layerTable([sonar], { surface: { sport: "soccer" } }).includes("From (degrees)"));
// true
// true
// true
```

A movement is `{ x, y, x2, y2 }` or the vector `{ x, y, dx, dy }`, in the layer's frame.

- **`flow`** bins the movements by where they start, on a grid (`bins`: cells across the longer side, 12 by default, or `[across, down]`), and draws an arrow in each cell that has `minCount` (2) or more: the direction of their mean vector. With `lengths: "mean"` (the default) an arrow is as long as the mean movement of its cell, the longest filling most of a cell; with `lengths: "fixed"` all are alike and the opacity says how steady the direction is (the length of the mean vector over the mean length). The table gives each cell's count, direction, mean length and steadiness.
- **`sonar`** draws a rose: a bar for each of `angles` directions (12 by default, from 3 to 72), as long as the number of movements that way (`statistic: "count"`) or their mean length (`"mean"`), all on one scale so that roses can be compared. `by` says what a rose is of: `all` (one, at the middle of the starts), `player` (one for each `id`, at the average start of his), `grid` (one for each cell, `bins`) or `zone` (one for each zone of `zones`, one of the [zone sets](./layers.md#zone-sets)). `radius` is the longest bar, in the layer's units.
- **Angles** are degrees on the surface as it is drawn wide: 0 toward the right end, 90 toward the top edge, counter-clockwise, whatever the frame's y does. A tall drawing turns with the surface. The first bar is centred on 0 degrees.

## Accessibility

Each layer is a group with a `<title>` and a `<desc>`: a network says how many players, links and passes, who touched the ball most and which link is strongest; a formation lists its positions and its players; a Voronoi layer says each team's share of the surface; a hull says its area; a flow field and a sonar say the longest mean movement or the commonest direction and how the angles are measured. A node, a link, a cell, a hull and a bar each have a tooltip. `layerTable(layers, { surface })` returns a table for each layer, and two for a network (the players, then the links) or a sonar (the bars, then the roses); the numbers are the layer's own, in its frame. Without `surface` the data is listed as it was given. Nothing is told by colour alone: a team is also told by the table and the description, a position nobody stands on is hollow, and a pass network's size and width are named in its key.

## Colours, size and speed

The marks use the layer colours of [Data layers](./layers.md#colours) (`--ky-layer`, `--ky-layer-home`, `--ky-layer-away`, `--ky-layer-edge`, `--ky-layer-hollow`), so they are right in a light and a dark page and follow a score drawing's teams. Their few rules are in `KYOGIJO_TEAM_STYLE`, written beside the first layer of these kinds (and part of `KYOGIJO_STYLE`, for a page with `style: "none"`).

Tests hold these budgets, each added to a drawing with its stylesheet: a Voronoi diagram of 22 players under 12 kB, of 400 under 140 kB in under 400 ms; a triangulation or a hull of 22 players under 10 kB, a triangulation of 1,000 points in under 600 ms; a pass network of 600 passes under 16 kB in under 100 ms; a formation under 5 kB; a flow field of 5,000 movements under 20 kB in under 150 ms; a sonar of 22 players of 5,000 movements under 60 kB in under 150 ms. On a laptop each is several times faster.

## Ideas credited

[mplsoccer](https://github.com/andrewRowlinson/mplsoccer) (MIT) draws pass networks, Voronoi diagrams, Delaunay triangulations, convex hulls, pass flows and pass sonars; those lists were what to match, and no code of it is used (see [references.md](./references.md#team-shape)). The hull, the triangulation and the cells, the counting and averaging of a network, the binning of a flow field and the roses are written from their textbook definitions. The formations and the names of the positions are [sourced here](./sources.md#formations).
