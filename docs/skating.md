# The skating rinks

`sport: "skating"` draws the ice of three disciplines, chosen by `league`: the standard 400 m speed skating track of the International Skating Union (`isu-long-track`, the default), the short track oval of 111.12 m on its rink (`isu-short-track`) and the figure skating rink (`isu-figure`). The long track has its two lanes, its warm-up lane, the blocks of its curves, the coaches' area, the finishing line and the starting lines of every race; the short track its seven blocks in each curve, its tracks and its starting positions; the figure skating rink its boards and the places of the judges. The figures are cited rule by rule in [sources.md](./sources.md#ice-skating). They lie wide, with the score in the middle; `orientation: "portrait"` lays them tall.

```ts
import { drawKyogijo, RANGES } from "@johnmorrisdotca/kyogijo-stadiums";

const track = drawKyogijo({ sport: "skating" });
const start = drawKyogijo({ sport: "skating", league: "isu-short-track", range: "start" });
console.log(track.includes('data-sport="skating"'), start.match(/viewBox="([^"]*)"/)?.[1]);
// true 59.9 0.84 80.34 37.69
console.log(RANGES.skating.map((range) => range.id).join(", "));
// home-straight, crossing-straight, first-bend, second-bend, bend, finish, start, infield, half, judges, kiss-and-cry
```

## The long track

The track is worked out from the radius of its inner edge and a lap of 400 m, as the ISU's table of measurements has it (Rule 227.1: the track is measured 0.5 m outside the inner edge). A skater changes lanes once a lap, on the crossing straight (Rule 254.5), so a lap is a straight, the inner curve, the crossing, the outer curve and a straight: `f + sqrt(f² + 4²) + π (d + e) = 400`, where `d` and `e` are the radii of the two lanes' lines.

| Part | What is drawn | Rule |
| --- | --- | --- |
| The track | two lanes: the inner 4 m wide, the outer at least 4 m (4 m drawn, up to 6 m); the inner curve of 25 m to 26 m radius (25 m drawn); the straights follow (113.57 m for 25 m, 112.00 m for 25.5 m, 110.43 m for 26 m); a lap of 400 m at most | Rule 203, H. Track |
| The lines | the lanes' demarcation, fully painted lines 5 cm wide, in the straights and in the curves | Rule 226 |
| The warm-up lane | inside the competition lanes, at least 4 m wide | Rules 205 and 206 |
| The blocks | inside the painted lines of the inner lane's edge and of the line between the lanes, 50 cm apart for the first 15 m of a curve and 2 m apart after, a cone at the entrance | Rule 226 |
| The crossing straight | the whole straight between the curves, where a skater changes lanes | Rules 203.2 and 254.5 |
| The finishing line | the 400 m mark, 100 m from the beginning of the finishing straight, and the metres marked in the last 5 m before it | Rule 227.2, H. Track |
| The starting lines | for each race marked, each lane's line a pre-start line's 2 m after, in the lane, or one across both | Rules 227.2 and 253.3 |
| The coaches' area | a line 1 m from the outside edge, from 25 m after the end of a curve to 10 m before the next | Rule 227.3 |
| The padding | at least 80 cm high and 30 cm thick, nothing fixed within 3 m of the edge | Rule 228.2 |

The lines of the races are derived, not copied. A race's starting line is the race's distance back from its finishing line along the skater's own way, worked out for each lane, so that each lane's line stands where its own curves put it:

| Race | Finish | Start |
| --- | --- | --- |
| 500 m | the 400 m mark | the 300 m mark, at the end of the curve: both lanes on one line |
| 1000 m | the middle of the finishing straight | on the crossing straight, 6.32 m (inner lane) and 6.25 m (outer) from its middle: no change of lanes on the first straight (Rule 254.5b) |
| 1500 m | the 400 m mark | near the beginning of the crossing straight: the inner lane's line 6.25 m before the end of the curve, the outer lane's 6.25 m into the straight; no change of lanes on the first straight |
| 3000 m, 5000 m | the 400 m mark | on the crossing straight, 7.32 m and 19.89 m from the beginning of the next curve: the two lanes' lines 12.57 m apart, the difference of the curves |
| 10,000 m | the 400 m mark | the finishing line |
| Mass start | the 400 m mark | the middle of the finishing straight, in rows (Rule 257.3) |
| Team pursuit, team sprint | the middle of the finishing straight | the middle of the straights, one team on each (Rule 256.1.2 and 256.2.2) |

The numbers 6.32, 6.25, 7.32 and 12.57 are the layout plan's own dimensions (k, j, i and the difference of the curves); a test holds the derived lines to them.

```ts
import { finishAt, longOval, startOf } from "@johnmorrisdotca/kyogijo-stadiums/skating";

const oval = longOval();
console.log(oval.straight.toFixed(2), oval.crossing.toFixed(2), (oval.straight + Math.PI * oval.d + oval.crossing + Math.PI * oval.e).toFixed(1));
// 113.57 113.64 400.0
const finish = finishAt(oval, "400m");
console.log(startOf(oval, 0, 1500, finish, true).pose.x.toFixed(2), startOf(oval, 1, 3000, finish).pose.x.toFixed(2));
// 63.04 -36.91
```

## The short track

The oval is 111.12 m round: two straights of S = 28.85 m between the centres of the curves and a track line of C = R8.50 m; the blocks stand 0.5 m inside it, on R8.00 m, seven in each curve (Rule 280.4). The rink is at least 60 by 30 m (Rule 280.1a), the barrier at least 7 m from the line of the blocks (Rule 280.1b); a line is drawn between the last block of a curve and the first of the next (Rule 280.1g). Beside the standard track the diagram lays out four or six more, each moved along the straight (1.00 m for five tracks, 0.70 m for seven), with starting lines 2.00 m or 1.40 m apart: a track moved by δ starts the half-lap races 2δ along the straight, so that the single finishing line, in the middle of the finishing straight, is a half lap on. The 500 m (4½ laps) and the 1500 m (13½) start on the straight opposite the finishing line, the others (9, 18, 27 and 45 laps) at it. The finishing line is the width of the straight and 1.5 m more, the lines at most 2 cm wide (Rule 280.2), and the starting positions of the 500 m and the 1000 m are five dots every 1.3 m from 50 cm out from the inner side (Rule 280.2c).

## The figure skating rink

The skating area is rectangular, 60 m by 30 m if possible, not larger and not less than 56 m by 26 m (Rule 342.1), with the judges and the referee seated at the rinkboard and the technical panel, if possible, in an elevated position. `furniture` draws them beside the boards, and the kiss and cry; the Rules give no place and no size for them, nor a radius for the corners: those are ours.

## Options

Everything is optional. `skating` takes:

| Option | What it does |
| --- | --- |
| `innerRadius` | Long track: the radius of the inner edge, 25 m to 26 m. Another number is an error that says the range. |
| `laneWidth` | Long track: the outer lane's width, 4 m to 6 m. |
| `warmUp`, `blocks`, `coaches`, `padding` | Long track (the blocks and the padding the short track's too): on by default; `false` leaves the part out. |
| `infield` | Long track: `floor` (the default) or `ice`. |
| `races` | Long and short track: the races whose starting lines are drawn: none by default, `"all"` or a list (`500m`, `1000m`, `1500m`, `3000m`, `5000m`, `10000m`, `mass-start`, `team-pursuit`, `team-sprint` on the long track; `500m` to `5000m` on the short). The finishing line is always drawn. |
| `start` | The race of the close-up `range: "start"` (the 500 m by default). |
| `tracks` | Short track: 5 or 7 tracks. |
| `rink` | Short track: `{ length, width }`, at least 60 by 30 m. Figure skating: within 56 m to 60 m by 26 m to 30 m. |
| `furniture` | Figure skating: all by default, `false` for none, or a list of `judges`, `referee`, `technical-panel` and `kiss-and-cry`. |

`look` is any look (the ice, the boards and the lines take the hockey rink's colours: the lanes' lines are the look's blue, the starting and finishing lines its red); `line-drawing` is ink only. The lines take the ISU's colours: blue for the lanes' demarcation, red for the starting, finishing and coaches' lines. `range` crops to a part: `home-straight`, `crossing-straight`, `first-bend`, `second-bend`, `finish`, `start` and `infield` on the long track; `home-straight`, `crossing-straight`, `bend`, `finish`, `start` and `infield` on the short; `half`, `judges` and `kiss-and-cry` on the figure skating rink.

## The data

`@johnmorrisdotca/kyogijo-stadiums/skating` has five charts, each as the other charts are (`draw`, `table`, `summary`, `totals`, layers you can add to).

```ts
import { figureElements, skatingPairs } from "@johnmorrisdotca/kyogijo-stadiums/skating";

const pairs = skatingPairs([{ pair: 1, inner: { name: "A. Skater" }, outer: { name: "B. Skater" } }], { race: "1000m" });
console.log(pairs.title, "|", pairs.summary);
// Pairs, 1000 m | 2 skaters in the 1000 m, last pair: 1.
const elements = figureElements([{ kind: "jump", name: "3Lz", x: -12, y: 4, order: 1 }, { kind: "spin", name: "CCoSp4", x: 6, y: -3, order: 2 }]);
console.log(elements.totals.elements, elements.totals.kinds.jump);
// 2 1
```

| Chart | What it draws |
| --- | --- |
| `skatingPairs(pairs, { race, pair })` | A pair of a long track race on the close-up of its start: each skater's name and flag behind the starting line of his lane, and an armband's colour, white for the inner lane and red for the outer (Rule 253.3.1). The table lists every pair. The caller passes each flag as SVG. |
| `skatingGrid(starters, { race })` | The starters of a short track race on the five starting positions. |
| `skatingResults(results, { race })` | The results as a leaderboard on the ice inside the track: the places as discs (gold, silver and bronze), the names and times; the splits as marks along the lane; the table with the pair, the lane, the times, the splits and the lap times. |
| `skatingReplay(runners, { race })` | A timeline for [the replay](./replay.md): each skater on his own way, from his lane's starting line (or his starting position), at the pace of his splits and finish time, to the finishing line and on, coasting. A long track skater's lane is changed on every crossing straight, except on the first straight of the 1000 m and the 1500 m. `drawFrame(replay.options, replay.timeline, t, replay.look)` draws one instant. The mass start, the team races and the relays are not replayed. |
| `figureElements(elements, options)` | The elements of a programme as marks on the rink: a shape for each kind (a jump, a spin, a step sequence, a choreographic sequence, a lift, a spiral, a twizzle, a death spiral, a throw jump), the track of a sequence as a dashed line, the order and the name beside it. |

Skating has its own frame, `skating`: metres from the middle of the rink, x along it and y down ([frames](./frames.md)). A heat layer counts into the zone set `skating-track` (the finishing straight, the first curve, the crossing straight, the second curve and the infield; a figure skating rink in thirds).

## What is ours

The colours of the ice and of the looks; the corner of a figure skating rink and the places and sizes of the furniture; the padding's place (3 m from the edge, the Rules' clear distance, drawn 0.3 m thick); the spacing of the short track's seven blocks (30 degrees apart: the diagram shows seven and the Rules give no angle); the block's size as drawn; the short track's rink corner; the crossing as a straight line from the one lane to the other (the table's own model). The lap of the short track is 111.11 m as the diagram's S and C make it (the diagram prints 111.12 m). Not drawn: the warm-up lane's own markings (the Rules name none), the cones of a team race's changeover area and a relay's exchange zone, the lap counters and the officials' places on the long track.
