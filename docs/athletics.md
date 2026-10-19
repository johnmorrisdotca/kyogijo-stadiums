# The athletics stadium

`sport: "athletics"` draws the 400 m standard track of World Athletics' *Track and Field Facilities Manual* (2019) and Book C2.1 of the Technical Rules (in force 1 July 2026): eight lanes of 1.22 m with the running lines where Rule 14 puts them, the finish straight, the lane numbers, the start lines of every race, the exchange zones of the relays, the hurdles, the steeplechase and its water jump, and each field event where the Marking Plan puts it, round a soccer pitch (or plain grass). It draws one field event alone at a large scale, a close-up of any start or of the finish, and the covered 200 m track. The figures are cited rule by rule in [sources.md](./sources.md#athletics). The drawing lies wide, with the score (a team meeting) in the middle; `orientation: "portrait"` lays it tall.

```ts
import { drawKyogijo, RANGES } from "@johnmorrisdotca/kyogijo-stadiums";

const stadium = drawKyogijo({ sport: "athletics" });
const start = drawKyogijo({ sport: "athletics", range: "start", athletics: { start: "800m" } });
console.log(stadium.includes('data-sport="athletics"'), start.match(/viewBox="([^"]*)"/)?.[1]);
// true -63.56 -27.14 140.25 48.65
console.log(RANGES.athletics.map((range) => range.id).join(", "));
// bend, home-straight, back-straight, finish, start, infield, high-jump, pole-vault, long-jump, triple-jump, shot-put, discus-throw, hammer-throw, javelin-throw, water-jump
```

## The track

| Part | What is drawn | Rule |
| --- | --- | --- |
| The oval | 400 m: two straights of 84.39 m and two bends of radius 36.50 m (the kerb), a lap of 398.12 m at the kerb and 400.0012 m on lane 1's running line | Manual 2.2.1.1, Table 2.2.1.1 |
| The lanes | 4 to 9 outdoors (8 by default), each 1.22 m wide, the lines 50 mm; lane 1's running line 0.30 m from the kerb and the others 0.20 m from the line on their left | Rule 14 |
| The straight | the finish straight runs on beyond the oval and may have 6 to 10 lanes (`straightLanes`; the oval's number by default) | Manual 2.2.2 |
| The finish | the finish line across every lane, and the lane numbers painted behind the start lines and the finish | Marking Plan |
| The staggers | the start line of each lane of the 200 m, the 400 m and the 400 m hurdles, the 800 m and the 4 x 400 m with their breakline | Table 2.2.1.6a |
| The curved starts | the 1000 m to the 10,000 m and the mile: a curved line across the track, and the group start of the longer races | Rule 17.5.2, Manual 2.2.1.6 |
| The relays | the 4 x 100 m's three takeover zones of 30 m, the 4 x 400 m's of 20 m, with the scratch lines | Rule 24.3 |
| The hurdles | the 100 m and 110 m hurdles (13.72 m to the first, 9.14 m between, 14.02 m to the finish; 13 m, 8.5 m and 10.5 m for the 100 m women's), the 400 m hurdles (45 m, 35 m, 40 m) | Rule 22.2, 22.3, Table 2.2.3.1 |
| The steeplechase | the lap of 396.08 m with the water jump inside the second bend (419.41 m outside), five hurdles a lap, the start of the 2000 m and the 3000 m | Rule 23, Manual 2.2.4.1 |

The staggers are worked out, not copied from the table: the 200 m's and the 400 m's out of the running lines' radii (π times the difference of the diameters for each bend), the 800 m's and the 4 x 400 m's out of the breakline's construction (an involute of lane 1's circle through the end of the first bend), and a curved start line is the involute that makes every point of the line the same distance from the finish by the shortest way. A test holds the 200 m and the 400 m to within a millimetre of Table 2.2.1.6a and the 800 m and the 4 x 400 m to within three.

```ts
import { WA_STAGGER_TABLE, WA_STANDARD_TRACK, breaklineStagger, lap, stagger, type Oval } from "@johnmorrisdotca/kyogijo-stadiums/athletics";

const oval: Oval = { ...WA_STANDARD_TRACK, lanes: 8 };
console.log(lap(oval, 1).toFixed(4), stagger(oval, 8, 2).toFixed(3));
// 400.0012 53.030
console.log(breaklineStagger(oval, 8).toFixed(3), WA_STAGGER_TABLE["800m"][6]);
// 26.932 26.93
```

## Options

Everything is optional. `athletics` takes:

| Option | What it does |
| --- | --- |
| `lanes` | 4 to 9 lanes outdoors (8 by default), 4 to 6 on the covered track (6). Another number is an error that says the range. |
| `straightLanes` | 6 to 10 lanes on the finish straight. |
| `track` | `red` (the default), `blue`, `terracotta` or `green`. A colour of your own is `colors.track`. |
| `infield` | `pitch` (a soccer pitch laid out as the package draws it; the default), `grass` or `none`. `pitch` names a preset or a size, as the soccer option does. |
| `events` | The field events drawn: all by default, `false` for none, or a list of `high-jump`, `pole-vault`, `long-jump`, `triple-jump`, `shot-put`, `discus-throw`, `hammer-throw` and `javelin-throw`. |
| `races` | The races whose starts, zones and hurdles are drawn: none by default, `"all"`, or a list of the 20 races (`60m` to `4x400m`; the 60 m and its hurdles are the covered track's). |
| `start` | The race of the close-up `range: "start"` (the 400 m by default). |
| `layout` | One field event alone, at a large scale: its runway or circle, its pit or sector and its landing area. |
| `waterJump` | `inside` (the default), `outside` or `none`, with the steeplechase. |
| `numbers` | The lane numbers painted on the track: on by default. |

The `league` is `world-athletics` (the standard track, the default) or `world-athletics-short` (the covered 200 m track: bends of radius 17.205 m at the kerb, banked 10 degrees, their centres 44.983 m apart, up to six lanes of 1.00 m, a straight of six lanes of 1.22 m through the middle for the 60 m and its hurdles, and its own stagger table; the plan's transitions are drawn as one circular bend, which is ours). A `ground` that has a track (`track: true` in the atlas, the six grounds Wikidata marks with one) draws the stadium with that ground's pitch. The [atlas](./atlas.md) links them: `surfacesOf(place)` of such a ground lists `{ sport: "athletics", ground }` after its other surfaces.

`look` is any look; `line-drawing` is ink only (black lines on white, with the track, the pits and the mats as outlines), for a printer or a plan to colour in. `detail`, `exactLines`, `landmarks` and `theme` are as for every sport; a start close-up and a finish close-up work in every renderer and in portrait.

## Close-ups

`range: "start"` turns the track so that the athletes run to the right (up the page in portrait), with the start lines of the race, and the lane numbers in stencil digits (drawn as paths: no font, no file) just behind the line. On a bend the numbers are discs that fit their lane. `range: "finish"` is the finish line and its lane numbers. The other ranges are `bend`, `home-straight`, `back-straight`, `infield`, one for each field event and `water-jump`; each is a box on the surface, and `range` also takes a box of your own.

## The field events

Each is drawn from the Manual's own diagram, in its place in the standard arena (Figure 2.5a):

| Event | What is drawn | Rule |
| --- | --- | --- |
| High jump | the uprights 4.02 m apart, the crossbar, the landing mat of 6 m by 4 m with the bar's plane 0.5 m inside its front edge, the 50 mm lines 3 m outside each upright, and the run-up fan | Rule 27, Manual 2.3.3 |
| Pole vault | the runway of 45 m, the box with its stop board and the 0-line, the uprights and the landing mat | Rule 28, Manual 2.3.4 |
| Long jump and triple jump | the runway of two lines 1.22 m apart, the take-off boards of 1.22 m by 0.20 m, and the pit of 8 m by 3 m: the long jump's board 3 m from the pit, the triple jump's 13 m (men) or 11 m (women) | Rules 29, 30 and 31, Manual 2.3.1 |
| Shot put | the circle of 2.135 m, the stop board of 1.21 m, the sector | Rules 32 and 33, Manual 2.4.4 |
| Discus and hammer | the circle (2.50 m, reduced to 2.135 m for the hammer), the U-shaped cage with its mouth 6 m wide 7 m in front of the circle, and the sector | Rule 32, Rules 35 and 37, Manual 2.4.1 |
| Javelin | the runway of 4 m and 36.5 m, the arc of 8 m radius with its 0.75 m marks, and the sector | Rule 32, Manual 2.4.3 |

The sector of 34.92 degrees is 2 times asin 0.3: its lines are 0.6 m further apart for every metre from the circle's centre, 12 m apart 20 m out and 48 m apart 80 m out; the javelin's, from the 8 m arc, are 28.96 degrees (2 times asin of a quarter), 50 m apart 100 m out. A test checks each.

## The data

`@johnmorrisdotca/kyogijo-stadiums/athletics` has four charts, each as the other charts are (`draw`, `table`, `summary`, `totals`, layers you can add to).

```ts
import { fieldMarks, laneDraw } from "@johnmorrisdotca/kyogijo-stadiums/athletics";

const draw = laneDraw([{ lane: 3, name: "A. Runner", country: "ITA" }, { lane: 4, name: "B. Sprinter", country: "USA" }], { race: "100m" });
console.log(draw.title, "|", draw.summary);
// Lane draw, 100 m | 2 athletes in the 100 m, from lane 3 to lane 4.
const throws = fieldMarks("javelin-throw", [{ athlete: "A", distance: 84.2 }, { athlete: "A", distance: 90.7, across: 6 }, { athlete: "A", valid: false }]);
console.log(JSON.stringify(throws.totals));
// {"attempts":3,"valid":2,"fouls":1,"best":{"distance":90.7,"athlete":"A"}}
```

| Chart | What it draws |
| --- | --- |
| `laneDraw(entries, { race })` | The lane draw on the start of the race: each athlete's name and flag behind the line of his lane, at the lane's stagger. The caller passes each flag as SVG (`flag`). A lane given twice is an error. |
| `raceResults(results, { race })` | The finish: the places as discs (gold, silver and bronze), the times, the reaction times, and a mark where each split was taken. |
| `raceReplay(runners, { race })` | A timeline for [the replay](./replay.md): each runner on the curve of his lane, from his lane's start line, by his reaction time, his splits and his finish time (a runner on a bend is at the stagger of his lane, so lane 8 of the 400 m starts 53.03 m ahead of lane 1 and every runner is at the line at his own time). `drawFrame(replay.options, replay.timeline, t, replay.look)` draws one instant. |
| `fieldMarks(event, attempts)` | A throw or a jump as a mark where it landed, by its distance and how far across it is (`across`), a foul at the line, and the best valid mark picked out with its distance. |

Athletics has its own frame, `athletics`: metres from the middle of the track, x along the straights and y down, so that a data provider's numbers lie on the track as the frame says ([frames](./frames.md)). A heat layer counts into the zone set `athletics-track` (the finish straight, the first bend, the back straight, the second bend and the infield).

## The Japanese words

The Japanese words of this page, with the rule books they were read in and the everyday words that are aliases, are in [the terminology](./terminology.md#athletics).

## What is ours

The shapes of the cages' rear (an arc about the circle's centre), the covered track's bends (one circle for the plan's three sections), the water jump's pit and the colours are ours, and the sources page says so. The grass of a sector is drawn out to the reach the standard arena draws (`SECTOR_REACH`: the shot's 25 m, the discus's 80 m, the hammer's 90 m, the javelin's 100 m), not to a record. Starting blocks, sponsors' boards, the photo-finish gantry and the officials' places are not drawn. The banking is drawn only on the covered track.
