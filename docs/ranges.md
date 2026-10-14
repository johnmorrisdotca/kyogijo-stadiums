# Display ranges and zoom

`range` crops a drawing to a part of its surface: the offensive zone of a rink, a half court, the red zone, the penalty area, the infield, the house of a curling sheet, or a box of your own. It is what sportypy calls `display_range` and what hockey_rink does with its partial rinks, for every one of the twenty-seven surfaces and in one option. The view is cut to the range with a small margin, the data and the heat of the layers are cut to it, the annotations stand against what is shown, a score's panel is put inside it, and `orientation` is kept: a tall drawing shows the same part on its side. Without `range` the whole surface is drawn, byte for byte as it was.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

// The right end zone of the NHL's rink: from the blue line to the end boards, with the rink's own ground at the boards.
const zone = drawKyogijo({ sport: "nhl", range: "offensive-zone" });
console.log(/viewBox="124.2 -8 83.8 101"/.test(zone), zone.includes('data-range="offensive-zone"'));
// true true
// The same zone for a team that attacks the left, and the rink as it was (no range).
console.log(/viewBox="-8 -8 83.8 101"/.test(drawKyogijo({ sport: "nhl", range: { name: "offensive-zone", end: "left" } })));
console.log(drawKyogijo({ sport: "nhl", range: undefined }) === drawKyogijo({ sport: "nhl" }));
// true
// true
```

## The named ranges

`RANGES` lists them for each sport, in the order a menu lists them, each with the end it is at by default; a name the sport does not have is an error that lists the sport's.

<!-- made:ranges -->
| `sport` | `range` | Shows | End by default |
| --- | --- | --- | --- |
| `nfl`, `cfl`, `ifaf` | `red-zone` | the 20 yards before a goal line and the end zone behind it | `right` |
| `nfl`, `cfl`, `ifaf` | `end-zone` | one end zone | `right` |
| `nfl`, `cfl`, `ifaf` | `between-the-20s` | from one 20-yard line to the other | none |
| `nfl`, `cfl`, `ifaf` | `field-of-play` | goal line to goal line, without the end zones | none |
| `nfl`, `cfl`, `ifaf` | `own-half` | from the end line to midfield, the end zone included | `left` |
| `nfl`, `cfl`, `ifaf` | `opponent-half` | from midfield to the other end line, the end zone included | `right` |
| `nhl` | `offensive-zone` | from the end boards to the blue line | `right` |
| `nhl` | `defensive-zone` | from the end boards to the blue line | `left` |
| `nhl` | `neutral-zone` | between the blue lines | none |
| `nhl` | `half` | from the end boards to the red line | `left` |
| `nba` | `half-court` | from a baseline to the half-court line | `left` |
| `nba` | `paint` | the key from the baseline to the free-throw line, with the free-throw circle beyond it | `left` |
| `soccer` | `half` | from a goal line to the halfway line | `left` |
| `soccer` | `final-third` | the third of the pitch next to a goal line | `right` |
| `soccer` | `defensive-third` | the third of the pitch next to a goal line | `left` |
| `soccer` | `middle-third` | the third between the other two | none |
| `soccer` | `penalty-area` | the penalty area with the arc beyond it (a small pitch's curved area) | `left` |
| `mlb` | `infield` | the dirt out to the arc round the mound, and the ground behind home plate | none |
| `mlb` | `outfield` | the grass from the fence in to second base | none |
| `curling` | `sheet` | the whole sheet | none |
| `curling` | `half` | from the hog line to the back line at one end | `left` |
| `curling` | `house` | the house at one end | `left` |
| `curling` | `folded` | undefined | none |
| `tennis`, `volleyball`, `badminton`, `pickleball`, `tabletennis`, `padel`, `squash`, `racquetball`, `sepaktakraw`, `teqball`, `roundnet`, `netball` | `half-court` | one side of the net | `left` |
| `lacrosse` | `half` | from an end line to the centre line | `left` |
| `lacrosse` | `crease` | the crease (the goal circle in the women's game) and the ground round it | `right` |
| `rugby` | `half` | from a dead-ball line to the half-way line | `left` |
| `rugby` | `twenty-two` | from the try line to the 22-metre line (union) | `right` |
| `rugby` | `twenty` | from the goal line to the 20-metre line (league) | `right` |
| `rugby` | `in-goal` | one in-goal area | `right` |
| `afl` | `half` | from a goal line to the centre line | `left` |
| `afl` | `forward-fifty` | the ground inside the Fifty Metre Arc at one end | `right` |
| `afl` | `centre-square` | the centre square | none |
| `gaelic` | `half` | from an end line to the half-way line | `left` |
| `gaelic` | `large-rectangle` | the large rectangle (19 by 13 m) at one end | `right` |
| `cricket` | `pitch` | the pitch with its creases and wickets, and a little ground round it | none |
| `cricket` | `circle` | the fielding restriction's circle (the ICC's leagues) | none |
| `fieldhockey` | `half` | from a back-line to the centre line | `left` |
| `fieldhockey` | `circle` | the circle at one end | `right` |
| `fieldhockey` | `twenty-three` | from a back-line to the 23-metre line | `right` |
| `handball` | `half` | from a goal line to the centre line | `left` |
| `handball` | `goal-area` | the goal area at one end, with its arc | `right` |
| `swimming` | `half` | from an end wall to the middle of the pool | `left` |
| `swimming` | `pool-end` | from an end wall to the 15 m mark | `left` |
| `waterpolo` | `half` | from a goal line to the half distance line | `left` |
| `waterpolo` | `goal-area` | the goal area at one end: from the goal line to the 2 m line | `right` |
| `diving` | `springboards` | the side of the well the 1 and 3 m springboards are on | `left` |
| `diving` | `platforms` | the side of the well the platforms are on | `right` |
| `artisticswimming` | `half` | from an end of the pool to its middle | `left` |
| `artisticswimming` | `centre-stage` | the middle third of the pool, where the athletes enter | none |
| `skating` | `home-straight` | the finishing straight with its lanes (the long track) or the finishing line's straight (the short track) | none |
| `skating` | `crossing-straight` | the straight where the lanes are changed, with the coaches' area (the long track) | none |
| `skating` | `first-bend` | the right-hand curve, entered from the finishing straight (with its seven blocks on the short track) | `right` |
| `skating` | `second-bend` | the left-hand curve, entered from the crossing straight | `left` |
| `skating` | `finish` | the finishing line, with the lines 1 m apart before it | none |
| `skating` | `start` | the starting lines of the race in `skating.start` | none |
| `skating` | `infield` | the warm-up lane and the ground inside the track | none |
| `skating` | `half` | one half of the figure skating rink, from the end boards to the middle | `left` |
| `skating` | `judges` | the judges', the referee's and the technical panel's seats at the rinkboard | none |
| `skating` | `kiss-and-cry` | the kiss and cry beside the rink | `left` |
| `athletics` | `bend` | one bend of the track, with the lanes across it | `right` |
| `athletics` | `home-straight` | the finish straight, from the end of the second bend to the end of the first, with the finish line | none |
| `athletics` | `back-straight` | the straight opposite the finish | none |
| `athletics` | `finish` | the finish line with its lanes, close enough to read the lane numbers | none |
| `athletics` | `start` | a close-up of the start of the race in `athletics.start`, turned so that the athletes run to the right (or up the page in portrait) | none |
| `athletics` | `infield` | the ground inside the track, with the field events' facilities | none |
| `athletics` | `high-jump` | a high jump: the fan and the landing area | `right` |
| `athletics` | `pole-vault` | a pole vault: the runway, the box and the landing area | `left` |
| `athletics` | `long-jump` | the long jump's runways, boards and pits | none |
| `athletics` | `triple-jump` | the triple jump's runways, boards and pits | none |
| `athletics` | `shot-put` | a shot put circle with its stop board and sector | `left` |
| `athletics` | `discus-throw` | a discus circle with its cage and the 34.92 degree sector | `right` |
| `athletics` | `hammer-throw` | a hammer circle with its cage and the 34.92 degree sector | `right` |
| `athletics` | `javelin-throw` | a javelin runway with its arc and sector | `left` |
| `athletics` | `water-jump` | the steeplechase water jump and the bend round it | `left` |
<!-- /made:ranges -->

A range at an end takes `end`: `range: { name: "half", end: "right" }`. The end is as the surface is drawn wide: `left` or `right`, whichever way the drawing lies, so that a tall drawing's left end is its top. A range with no end (the neutral zone, the middle third, the infield) ignores one. The offensive ranges are at the right by default, as a frame's numbers are for a team that attacks the right (see [coordinate frames](./frames.md)), the defensive and own ranges at the left, and the others, such as a half, at the left, as a curling sheet's house is: `end` moves any of them.

## A box of your own

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

// 60 by 50 feet of the rink in the drawing's own feet (x along the rink from the left, y across it from the top)...
const feet = drawKyogijo({ sport: "nhl", range: { x0: 100, x1: 160, y0: 10, y1: 60 } });
// ...the same box in yards, as `units` says...
const yards = drawKyogijo({ sport: "nhl", units: "yd", range: { x0: 100 / 3, x1: 160 / 3, y0: 10 / 3, y1: 60 / 3 } });
// ...and the right end zone in the NHL API's own numbers: feet from centre ice, y up.
const api = drawKyogijo({ sport: "nhl", range: { x0: 25, x1: 100, y0: -42.5, y1: 42.5, frame: "nhl-api" } });
console.log(/viewBox="99.2 9.2 61.6 51.6"/.test(feet), /viewBox="99.2 9.2 61.6 51.6"/.test(yards), /viewBox="124.2 -8 83.8 101"/.test(api));
// true true true
```

The corners are in the drawing's frame (feet, or `units`; a ballpark's x is across the field and its y minus the distance out from home plate), or, with `frame`, in that frame's own numbers and unit: any frame of `FRAMES` or one you registered, fitted to the surface the way a layer's points are (`attacking: "left"` turns a frame that belongs to the team's attack). The box may reach past the surface's edge: where it does, the surface's own ground is drawn; a box wholly outside the drawing is an error.

## What follows the crop

- **The view.** The viewBox is the range with a margin of 0.8 foot beyond a line the range is cut at, so that the line is whole, and the surface's own ground (the `margin` of the options, or the sport's) where the range reaches the surface's edge. A drawing is never larger than the whole one.
- **Data.** Layers are cut to the range as they are cut to the surface's outline, and their marks, a heat map's cells and its legend are sized and placed against what is shown, so a heat map of a zone has the cells of a zone and not of the whole rink. A mark outside the range is not drawn, and the description says so; the table of a layer (`layerTable`) still lists every row. `extent` of a heat map and `limits` are in the surface's numbers as before.
- **Annotations.** `axes` has the ticks of the range, `landmarks` names the parts that are in it, and `direction` stands against it. The ground the labels need beyond the cut is the apron's, and the surface is clipped to the range there, so nothing outside it shows.
- **A score.** The panel is moved inside the part that is shown and made smaller if it must be; a team's name is written only where its place (an end zone, an end of the ice) is in the range. When the range is too small for a panel (the paint of a court) the score is drawn as a strip under the drawing, as `size: "compact"` does, and `data-size` says `compact`. A curling score always shows the whole sheet, for the board's sake.
- **The description** says what is shown (`Shows only the offensive zone at the right end.`), and, when the drawing has data, that data outside it is not drawn; in English and Japanese. The root carries `data-range` with the range's name, or `custom` for a box.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const shots = Array.from({ length: 30 }, (_, i) => ({ x: 125 + ((i * 41) % 70), y: 8 + ((i * 29) % 70), outcome: i % 5 === 0 ? "goal" : "shot" }));
const svg = drawKyogijo({
  sport: "nhl",
  range: "offensive-zone",
  layers: [{ kind: "heatmap", name: "shots", data: shots, legend: true }, { kind: "points", name: "shots", data: shots }],
  landmarks: true,
  direction: { home: "right" },
  id: "zone",
});
// The layers are cut to the zone.
console.log(svg.includes('<g clip-path="url(#zone-lc-r)">'));
// true
console.log(svg.includes("Data outside it is not drawn."));
// true
```

## Curling's `show`

A curling sheet had `sheet.show` (`sheet`, `half` or `house`) and `sheet.end` before there were ranges. They are ranges now: `range: "house"` is `sheet: { show: "house" }`, `range: { name: "half", end: "right" }` is `sheet: { show: "half", end: "right" }`, and both keep working. Where both are given the range wins; a range given without an end keeps `sheet.end`. A box works on a sheet as on any surface.

## Soccer's `half`

`half: "left"` of a soccer pitch (a bare pitch only) still works. `range: "half"` does the same for every sport that has halves, and for a score too.

## The element

`<kyogijo-field range="offensive-zone">` takes the name, `range-end="left"` the end, and a box is JSON: `range='{"x0":100,"x1":160,"y0":10,"y1":60}'`. A name the sport does not have is left out, as a league the sport does not have is.
