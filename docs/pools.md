# Swimming, water polo, diving and artistic swimming

Four sports draw a pool: `sport: "swimming"` (the competition pool, in lanes), `"waterpolo"` (the field of play), `"diving"` (the well, with its springboards and platforms) and `"artisticswimming"` (the routine area). Each is drawn to scale from World Aquatics' *Competition Regulations* (in force as from 25 June 2025), which is where the Facilities Rules (FR 2 to FR 8 of the 2017 to 2025 editions) now sit as Article 16 of Part Two, Article 13 of Part Four, Article 18 of Part Six and Article 27 of Part Seven. Every figure is cited in [sources.md](./sources.md#the-pools), and each says where the rules give no figure and the drawing's is ours. The pool is drawn **wide** (the start at the left; a tall drawing turns it a quarter, with the words still upright), in metres, the unit the rules print.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const wide = drawKyogijo({ sport: "swimming", id: "p" });
const tall = drawKyogijo({ sport: "swimming", orientation: "portrait", id: "p" });
console.log(wide.match(/viewBox="([^"]*)"/)?.[1], "|", tall.match(/viewBox="([^"]*)"/)?.[1]);
// -8.2 -8.2 180.45 98.43 | 0 0 98.43 180.45
```

| `sport` | What it draws | Its size | The rules |
| --- | --- | --- | --- |
| `swimming` | the pool in lanes: ropes, floor markings, blocks, touch panels, backstroke flags, false start rope | 50 or 25 m, 1 to 10 lanes | Part Two, Article 16 |
| `waterpolo` | the field of play, its ropes, lines, goals, re-entry areas, platforms and table | 25 by 20 m between the goal lines | Part Six, Article 18 and Appendix 4 |
| `diving` | the boards seen from above, at the distances of the table, and the lines across the well | 25 m across, 21 m deep | Part Four, Article 13 and Appendix 2 |
| `artisticswimming` | the routine area, its floor lines, the judges' platform and the starting platform | 30 by 20 m, or 25 by 15 m | Part Seven, Article 27 |

All four take a `pool` option for the look, `layers`, `range`, `landmarks`, a `score` of two teams (a dual meet, a water polo match), every renderer, and the usual themes and [looks](./theming.md). The pools have no `league`: World Aquatics has one rulebook.

## The swimming pool

The default is the pool of the Olympic Games: 50 m between the touch panels, eight lanes of 2.5 m with a space of 2.5 m outside the first and the last (CR 16.2.6.2), 25 m wide. `pool.course: "short"` is the 25 m pool; `pool.lanes` is 1 to 10.

```ts
import { swimPlan } from "@johnmorrisdotca/kyogijo-stadiums";

const ten = swimPlan({ sport: "swimming", pool: { lanes: 10 } });
console.log(ten.width, ten.lanes.map((lane) => lane.number).join());
console.log(ten.ropes.map((rope) => rope.colour[0]).join(""));
// 25 9,8,7,6,5,4,3,2,1,0
// gbbbyyybbbg
```

| Figure | Rule | In the drawing |
| --- | --- | --- |
| Length 50.000 m or 25.000 m between the touch panels | CR 16.1.1, was FR 2.1 | the pool's water |
| Lanes at least 2.5 m wide; lanes 0 and 9 2.4 m wide with spaces of 0.1 m outside them for ten lanes in a permanent pool, all 2.5 m with spaces of 0.5 m for a temporary one (26 m wide) | CR 16.1.6, 16.2.6.3 | `lanes`, `temporary`; a pool of another number of lanes has spaces of 0.5 m, as the 25 by 21 m pool of eight lanes of Annexes 6 and 7 does |
| Lane 1 (lane 0 for ten) on the right facing the course from the start | CR 16.2.9 | at the bottom of a wide drawing |
| Lane ropes: floats 0.15 m across; green outside, then blue, then yellow in the middle (two green, four blue and three yellow for eight lanes; two, six and three for ten) | CR 16.1.7.1, 16.2.7.1 | one run of beaded floats for each rope |
| The floats within 5.0 m of each wall red; a distinct colour at 15 m from each wall and, in a 50 m pool, at 25 m | CR 16.1.7.1 to 16.1.7.3 | red floats, and a run of four white ones (the length of a run is ours) |
| Lane markings on the floor 0.2 to 0.3 m wide, 46 m (21 m) long, ending 2 m from the wall in a cross line 1 m long | CR 16.2.15, was FR 2.14 | a line in each lane with a cross line at each end |
| A cross line 0.5 m long at 15 m from each wall | CR 16.2.15 | a small cross on each lane marking |
| Touch panels 2.4 m wide, 0.3 m above the water and 0.6 m below, with a target line down the middle | CR 16.3.4, 16.2.15 | a yellow panel on each wall, in every lane, with the target line and its cross line |
| Starting blocks 0.5 by 0.6 m, 0.5 to 0.75 m above the water, numbered on top | CR 16.2.8, 16.2.9 | a block behind each wall, in every lane, with the lane number |
| Backstroke flags on a rope 1.8 m above the water, 5.0 m from each wall | CR 16.1.10, was FR 2.9 | a rope of alternating flags across the pool, on standards at both sides |
| The false start rope 15.0 m from the starting end, at least 1.2 m up | CR 16.1.12, was FR 2.11 | a dashed line across the pool |
| Depth: 1.35 m from 1.0 to at least 6.0 m from a wall with blocks; 2.5 m at the Olympic Games and World Championships, 2.0 m for the 25 m World Championships | CR 16.1.4, 16.2.4 | the side section |

The blocks, the flags and the false start rope make a *competition* pool. `pool.kind: "warm-up"` leaves them out with the touch panels: the same lanes and ropes in a pool for warming up. The rules set no size for a swimming warm-up pool, so it is whatever `course` and `lanes` say. `blocks`, `pads`, `flags` and `falseStart` switch each one on or off.

| Option | What it does |
| --- | --- |
| `pool.course` | `long` (50 m, the default) or `short` (25 m). |
| `pool.lanes` | The lanes, 1 to 10, 8 by default. Ten lanes are numbered 0 to 9. |
| `pool.temporary` | The temporary pool of ten lanes: 26 m wide, all lanes 2.5 m. |
| `pool.kind` | `competition` (the default) or `warm-up`. |
| `pool.look`, `pool.deck`, `pool.seed` | The water and the deck: see below. |
| `pool.section` | A side section under the plan: `true`, or `{ depth, exaggerate }`. |
| `pool.race` | The lanes of a race: see below. |
| `pool.venue` | Several pools in one hall: see [the natatorium](#a-natatorium). |
| `detail: "simple"` | Leaves out the crosses at 15 m, the marks on the deck, the standards and the numbers on the blocks. |
| `exactLines: true` | Draws the lines, ropes and fixtures at their true sizes: a rope 0.15 m across and a block 0.5 by 0.6 m, which on a page are thin. |

Lines are drawn a little thicker than they are painted, as the other surfaces' are, and the small fixtures (blocks, flags, standards) about half as large again. The ropes are rows of round floats drawn as dots in one path each, so a pool with nine ropes stays under 19 kB with its stylesheet.

## The water and the deck

The rules say nothing of how water or a deck look, so these are ours. `pool.look` is `flat` (the default: one clean colour), `water` (a net of light on the floor, in a repeating tile, with the water a little darker towards the middle of the pool) or `tiled` (the same, with the tiles of the floor showing through). `pool.deck` is `plain` or `tiled`. The light is a few soft closed curves made from a seed (`pool.seed`, 1 by default), with no random number: the same seed draws the same light, and a tile is one `pattern` that every pool of a drawing reuses.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const flat = drawKyogijo({ sport: "swimming", id: "l" });
const lit = drawKyogijo({ sport: "swimming", id: "l", pool: { look: "tiled", deck: "tiled", seed: 7 } });
console.log(flat.includes("<pattern"), lit.match(/<pattern/g)?.length);
console.log(lit === drawKyogijo({ sport: "swimming", id: "l", pool: { look: "tiled", deck: "tiled", seed: 7 } }));
// false 3
// true
```

The scenes and the other renderers read the patterns, the gradients and the dashes that make the floats; a pool as a PNG is the same picture. The colours of the water, deck, ropes, panels and blocks are custom properties (`--ky-surface`, `--ky-apron`, `--ky-pg`, `--ky-pb`, `--ky-py`, `--ky-pr`, `--ky-pw` for the ropes' green, blue, yellow, red and white), light and dark, and every [named look](./theming.md) paints a pool in its own palette; `featureColors` names `water`, `apron`, `gutter`, `lane-lines`, `lane-ropes`, `rope-red`, `touch-pads`, `starting-blocks`, `backstroke-flags` and `false-start-rope`.

## A side section

`pool.section: true` draws a section along the pool under the plan, on the same scale along the pool: the water and its depth, the blocks and touch panels at the walls, a pennant for the backstroke flags 5 m from each end, a dot and a pole for the false start rope at 15 m, a lane rope at the surface, the lane marking on the floor, the depth as a dimension, and the least depth the rules ask near a wall with blocks (1.35 m, a dashed line from 1 to 6 m). The depth is 2.5 m for a 50 m pool and 2.0 m for a 25 m one, or `section: { depth }`. The height is exaggerated (2.5 times by default, `exaggerate`): a pool 50 m long and 2.5 m deep is a sliver otherwise, and the description says the section's depth.

## The lanes of a race

`pool.race` puts a race on the pool: the swimmers in their lanes with their names and flags at the starting end, and, once the race is swum, each place (a medal for the first three), time, reaction time and the splits at the turning end.

```ts
import { swimPlan } from "@johnmorrisdotca/kyogijo-stadiums";

const pool = {
  race: {
    event: "Men's 100 m freestyle, final",
    distance: 100,
    swimmers: [
      { lane: 4, name: "A. Swimmer", abbr: "AUR", splits: [25.1, 52.4], reaction: 0.64 },
      { lane: 5, name: "B. Swimmer", abbr: "CAL", splits: [25.6, 52.9], reaction: 0.7 },
      { lane: 3, name: "C. Swimmer", abbr: "BOR", status: "dq", time: 52.0 },
    ],
  },
};
const rows = swimPlan({ sport: "swimming", pool }).race!.rows;
console.log(rows.map((row) => `lane ${row.lane}: ${row.timeText}, place ${row.place}`).join("; "));
// lane 5: 52.90, place 2; lane 4: 52.40, place 1; lane 3: 52.00, place undefined
```

| A swimmer | |
| --- | --- |
| `lane`, `name` | The lane, as the pool numbers it (1 to 8, or 0 to 9), and the name. A lane the pool does not have is an error that names the pool's, and so are two swimmers in one lane. |
| `abbr` | The country's three letters, or a club's. The package keeps no table of countries. |
| `flag` | The flag or crest: an `https:` or relative address, an image `data:` address, or an SVG document as text, held to the rules of a team's `logo` (`safeLogo`). **The package bundles no flags**: you pass them. |
| `color` | A stripe on the name's plate. |
| `time` | Seconds (`106.12`) or text (`"1:46.12"`). Without one, the last split is the time when the splits reach the whole race. |
| `place` | 1 and up. When no swimmer has one, it is worked out from the times, equal times sharing a place; the first three get a gold, a silver and a bronze medal. |
| `reaction` | The reaction time in seconds, written `RT 0.64`. |
| `splits` | The cumulative times at 50, 100, 150 m... in a 50 m pool and every 25 m in a 25 m one (`race.splitEvery` says another), the last being the time. |
| `status` | `dq`, `dns` or `dnf`, written in place of the time with no medal. |
| `seed`, `record` | The entry time (shown on a start list, and once there are results only if `show.seeds` says so), and a record the swim set: `WR`, `CR`... |

The race itself is `{ event, distance, swimmers, show, pace, splitEvery }`. The distance comes from the splits when it is missing. `show` takes `names`, `flags`, `results`, `reaction`, `splits`, `medals` and `seeds`, each `false` to leave out. The rows go down the page in the order of the lanes, so lane 8 is at the top of a wide drawing; the names and times of a *tall* drawing lie along the lanes, and the numbers in the discs stay upright.

`pace: true` draws the **split pace bars**: each lane as the whole race laid out flat (a 200 m race in a 50 m pool is swum along the lane and back, and drawn from the start at the left to the finish at the right), each split a bar as long as its share of the race, in a colour from the field's slowest pace (dark) to its fastest (bright), with the split's time on it unless `pace: { labels: false }`, under a ruler of the distances. [`splitsChart`](./charts.md#the-splits-of-a-race) wraps it with a title, a summary and a table.

The description says it all in words: the event, then each lane (`Lane 4: Name (AUR), place 1, gold medal, time 1:46.12, reaction time 0.64, splits ...`), and what the bars show.

## A race replay

`raceTimeline` (from `@johnmorrisdotca/kyogijo-stadiums/replay`) turns a race's splits into a [replay](./replay.md) timeline: each swimmer goes down the first length and back the next at the speed of each split, in a straight line between the splits, and is on the block until the reaction time. The timeline is in the pool's frame (`swimming`: metres from the middle of the water, `x` towards the turning end, `y` up the page, so lane 1 is below lane 8), and its events are the start, the turns at the walls and the finishes, each with the swimmer's name and the time.

```ts
import { drawFrame, raceTimeline } from "@johnmorrisdotca/kyogijo-stadiums/replay";

const pool = { race: { distance: 100, swimmers: [{ lane: 4, name: "A. Swimmer", splits: [25.1, 52.4] }, { lane: 5, name: "B. Swimmer", splits: [25.6, 52.9] }] } };
const timeline = raceTimeline({ pool });
console.log(timeline.frames.length, timeline.events.map((event) => event.kind).join());
console.log(drawFrame({ sport: "swimming", pool }, timeline, 30).includes("2 tracked objects"));
// 575 start,turn,turn,finish,finish
// true
```

`raceTimeline(options, { fps, lead, tail, reaction, block, language })` takes ten frames a second, 1.5 s before the signal and 3 s after the last touch by default; a swimmer with no reaction time leaves the block after `reaction` (0.7 s). `drawFrame`, `mountKyogijo(...).replay` and `<kyogijo-field>` play it as they play any timeline. Pass `{ trailOf: ["home"] }` for a wake behind each swimmer. The marks are circles with the lane's number on them, in a colour that reads on water.

## Water polo

The field of play is 25.00 by 20.00 m between the goal lines for men and women alike (CR 18.1.2). It lies in a pool 0.30 m longer at each end, where the nets hang (CR 18.3.5). `pool.table` (`bottom` by default, or `top`) is the side of the official table.

| Part | Rule |
| --- | --- |
| Goal lines and the half distance line white; the 2 m line red; the 6 m line yellow; a red mark at 5 m for the penalty throw | Appendix 4, 20.4.1.5 |
| The ropes along both sides, and the referees' platforms: red from the goal line to 2 m, yellow from 2 to 6 m, green from 6 m to the half distance line, white marks at the goal lines and the half distance line | CR 18.3.1, 18.3.2, Appendix 4, 20.4.1.5 |
| The goals: posts and crossbar 75 or 80 mm square, white, 3.0 m between the posts, the crossbar 0.9 m above the water, nets with at least 0.30 m clear behind the goal line | CR 18.3.3, 18.3.5, Appendix 4, 20.4.2 |
| The goal areas: lines 2 m long from the outer faces of the posts | Appendix 4, 20.4.1.2, Appendix 3 |
| The excluded players' re-entry area, 2.0 by 1.08 m, in each corner on the side away from the table | CR 18.3.4, Appendix 4, 20.4.1.6 |
| The referees' platforms 1 m wide, 0.7 m above the water | CR 18.3.2 |
| An area for flying substitutions at least 0.50 m wide on the bench side, from the goal line in front of the bench to the centre, drawn in each team's colour | CR 18.1.8 |
| The official table (its size is ours; the rules do not give it) | CR 18.3.6 |

A score puts the home team on the **left**: water polo lists the home team first, as soccer and handball do ([score](./score.md)). The names stand on the decks at the ends.

## Diving

The well is seen from above with the boards' wall at the left and the dive towards the right. `pool.platforms` (5, 7.5 and 10 by default; 1, 3, 5, 7.5 and 10 are the rules'), `pool.springboards` (on) and `pool.boards` (the springboards of each height, 2 by default so that a synchronised pair stands side by side) say what stands there. Every distance is measured from the **plummet**, the vertical line through the middle of the front edge, as Appendix 2 does.

| Figure | Rule | In the drawing |
| --- | --- | --- |
| Springboard 4.88 by 0.50 m, 1 m or 3 m above the water | CR 13.1.1.1 | an orange bar, its front end (the plummet) 2.22 m beyond the wall (A) |
| Platforms: length 5 or 6 m; width 1 to 3 m by height; heights 1, 3, 5, 7.5, 10 m | CR 13.1.2.2, Appendix 2 | a grey rectangle, its front edge 0.75 to 1.50 m beyond the wall (A) |
| B, plummet to the side wall (3.5 m for a 3 m board, 5.75 m for the 10 m platform), the preferred figure | Appendix 2 | the boards' places from the side walls |
| C, plummet to plummet (2.0, 2.6 m for boards; 3.0, 2.75, 2.85 m for platforms), the preferred figure | Appendix 2 | the boards' places from each other: the distance of the *higher* board's C |
| Three lines across the well, 21 m long, 2.5 m apart, the first under the plummet of the 3 m springboard | CR 13.2.7 | dark lines across the well |
| 5 m of water under the boards at least for new facilities and the Olympic Games | CR 13.1.3.1, 13.2.1 | said in the description's sources, not drawn |

The rules give clearances, not the size of the well; the drawing makes it 25 m across and 21 m deep, and wider if the boards asked for need more room. The springboards stand from the left wall (3 m boards outside, 1 m boards inside), the platforms from the right (the tallest the distance B from the wall).

## Artistic swimming

The routine area of the Olympic Games and the World Championships is at least 30.0 by 20.0 m and 3.00 m deep (CR 27.2.2, 27.2.3); elsewhere at least 15 by 25 m, of which 12 by 12 m is 3.0 m deep and the rest 2.0 m (CR 27.1.2). `pool.area: "olympic"` (the default) and `"minimum"` (25 by 15 m, the deep part shaded and dashed). The floor is marked with lines in one direction along the pool, as the lane markings are (CR 27.2.4); the judges' platform (at least 0.6 m high) is within 2 m of the edge (CR 27.2.8); the starting platform (0.7 m) stands at centre stage (CR 27.2.7). The platforms' sizes are ours, as the rules give their heights.

## A natatorium

`pool.venue` sets several pools in one hall, to scale, each drawn by its own sport's builder, with the deck drawn once, the paint of the water defined once and the names written under the pools. The pools stand at least 8 m apart (the rules' least distance between a swimming pool and a diving well, 10 m preferred and the default, CR 16.2.17). `"natatorium"` is a competition pool, a diving well and a warm-up pool, with seating along the top; your own is `{ pools, apart, labels, seating }`, each pool `{ sport, course, lanes, kind, name, x, y }` (`x` and `y`, in metres from the corner of the hall's water, or none to let the rows fall).

```ts
import { venueLayout } from "@johnmorrisdotca/kyogijo-stadiums";

const hall = venueLayout({ venue: "natatorium" })!;
console.log(hall.items.map((item) => `${item.plan.sport} at ${item.x}, ${item.y}`).join("; "));
console.log(hall.width, hall.height);
// swimming at 0, 0; diving at 60, 0; swimming at 0, 35
// 81 56
```

Two pools nearer than `apart` are an error that says the rule. The hall is a swimming drawing: its outline, `layers` and description are the whole hall's.

## Scores, parts, zones and data

A **score** is a dual meet's points, or a water polo match. `range` crops to a part: `half` and `pool-end` (the first 15 m) for swimming, `half` and `goal-area` for water polo, `springboards` and `platforms` for diving, `half` and `centre-stage` for artistic swimming ([ranges](./ranges.md)). `landmarks: true` names the parts of each pool. Heat and zone layers have a zone set for each pool ([layers](./layers.md#zone-sets)): `pool-lanes` for swimming, `water-polo-areas`, and `pool-thirds` for diving and artistic swimming. The coordinate frames are the pools' `swimming`, `waterpolo`, `diving` and `artisticswimming`, in metres from the middle of the water ([frames](./frames.md)). The figures are `SWIMMING`, `WATER_POLO`, `DIVING` and `ARTISTIC` from `/geometry`, each in any unit by `dimensionsOf`.

```ts
import { dimensionsOf, surfaceSize } from "@johnmorrisdotca/kyogijo-stadiums/geometry";

console.log(surfaceSize("swimming", "ft"), dimensionsOf("swimming").laneLine.longLength);
console.log(dimensionsOf("diving", "ft").springboard.length.toFixed(2));
// { length: 164.04199475065616, width: 82.02099737532808, unit: 'ft' } 46
// 16.01
```

## What is not here

- The annexes' diagrams of the regulations (the pool diagrams, the diving field of play, the artistic swimming diagrams) are pictures. They were not read, so nothing is measured from one; the figures are the text's and the tables'.
- The backstroke ledge, the lane rope's wave-reducing parts, the lighting, the water's temperature and the turnover are in the rules and have no place in a plan.
- Open water, high diving, beach water polo and the dry-land facilities are not drawn.
- A tall drawing's names and times lie along the lanes instead of upright, because a lane is 2.5 m wide.
