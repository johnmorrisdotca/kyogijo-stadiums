# Zones and the rules

`zoneAt(sport, point, options)` says where a point lies in the sport's own terms: the zone (the offensive zone, the frontcourt, the attacking third, the infield, the red zone), the finer area in it (the crease, the paint, the six-yard box, the warning track, between the hashes), and every other area that holds, each by an id that is the same in every language and a name in English or Japanese. It is in its own entry, `@johnmorrisdotca/kyogijo-stadiums/zones`. (The frames entry has a `zoneAt` of its own, for Retrosheet's hit-location sectors; this one is for every sport.)

The geometry is the package's own: a rink's blue lines, goal lines, creases, trapezoids and face-off circles from the rink of a league and a season; a court's lane, restricted area and three-point line from the league's court and the season's rules (the NBA's arc was 22 feet from 1994 to 1997); a pitch's boxes from the Laws and the pitch's size; a ballpark's fence from the park, in the season; a field's end zones and hash marks from the league. Where a rule has no figure of its own (the slot, the half-spaces) the package's [zone sets](./layers.md#zone-sets) are used, and a test holds the two to the same answer on a grid. A sport that has no rules of its own here answers in its zone sets.

```ts
import { zoneAt } from "@johnmorrisdotca/kyogijo-stadiums/zones";

// The right end-zone face-off dot: the offensive zone, inside a face-off circle.
const dot = zoneAt("nhl", [69, 22], { frame: "nhl-api" });
console.log(dot.zone, dot.subzone, dot.names["faceoff-circle"]);
// offensive-zone faceoff-circle Face-off circle

// A shot from 25 feet out in the middle, in the NBA stats' tenths of a foot.
const arc = zoneAt("nba", [0, 250], { frame: "nba-stats" });
console.log(arc.zone, arc.subzone, arc.zones.includes("three-point"));
// frontcourt above-the-break true

// Opta's (95, 50): the six-yard box, and the penalty area it is in.
const box = zoneAt("soccer", [95, 50], { frame: "opta" });
console.log(box.zone, box.subzone, box.zones.join(" "));
// attacking-third six-yard-box attacking-third six-yard-box penalty-area central-corridor
```

## The point

A point is `[x, y]` or `{ x, y }`. `frame` says what it is in: a frame's name (`nhl-api`, `nba-stats`, `opta`, `statsbomb`, `retrosheet`, `mlbam`, `nfl-tracking` and [every other](./frames.md)), a frame of your own, or nothing, for the drawing's own numbers in feet (or `units`). `size` gives the surface's size for a frame that fits any. The surface's options (`league`, `year`, `park`, `pitch`, `fence`) say which rink, court, park or pitch: a league's blue line is its own (the IIHF's are 22.5 m from the end boards).

The team is taken to attack the right end, as the surface is drawn wide. `attacking: "left"` says the numbers are a team's that attacks the left; they are turned a half turn first, as the [data layers](./layers.md) turn them, so the same point is a team's own end (the defensive zone, `own-six-yard-box`) or the one it attacks. Left and right are the attacker's: facing the right end, left is the top of the drawing.

A point off the surface (on the apron, in the stands) is in no zone: `inBounds` is false and `zone`, `subzone` and `zones` are empty. A ballpark is the exception, because foul ground and the stands beyond the fence are zones of baseball.

## What each sport answers

| Sport | Zone | Finer areas and flags |
| --- | --- | --- |
| Hockey | `defensive-zone`, `neutral-zone`, `offensive-zone` (the blue lines) | `crease`, `trapezoid`, `behind-goal-line`, `inner-slot`, `outer-slot`, `slot`, `faceoff-circle`, `centre-circle` |
| Basketball | `frontcourt`, `backcourt` (of the basket attacked) | `restricted-area`, `paint`, `mid-range`, `corner-three-left`, `corner-three-right`, `above-the-break`, and the flag `three-point` |
| Soccer | `defensive-third`, `middle-third`, `attacking-third` | `six-yard-box`, `penalty-area`, `penalty-arc` (the D), each also as `own-` at the end the team defends; `wing-left`, `half-space-left`, `central-corridor`, `half-space-right`, `wing-right` |
| Baseball | `infield`, `outfield`, `foul-territory`, `over-the-wall` | `fair-territory`, `warning-track`, `left-field`, `centre-field`, `right-field`, `third-base-side`, `middle-infield`, `first-base-side` |
| Football | `own-end-zone`, `own-half`, `opponent-half`, `red-zone`, `opponent-end-zone` | `end-zone`, `between-the-hashes`, `outside-hashes-left`, `outside-hashes-right` |
| Every other sport | the first of its [zone sets](./layers.md#zone-sets) that the point is in | the rest, and `sets` has the zone of each set |

The `paint` flag holds for the whole key, the restricted area included, so `inPaint` is the key as a rulebook draws it; `subzone` is `restricted-area` there, as the NBA's shot zones have it. The slot is the package's definition (the zone sets' `nhl-slot`), because the NHL's rules do not define one. The red zone is the 20 yards before the opponent's goal line. The three-point test is the line's own geometry: the straight lines 3 feet from the sidelines (22 feet from the basket), the arc beyond.

## Yes or no

```ts
import { inCrease, inPenaltyArea, inSlot, isFair, isThreePointer, onWarningTrack, overWall } from "@johnmorrisdotca/kyogijo-stadiums/zones";

console.log(isThreePointer([0, 240], { frame: "nba-stats" }), isThreePointer([0, 230], { frame: "nba-stats" }));
console.log(inSlot([80, 0], { frame: "nhl-api" }), inCrease([85, 3.9], { frame: "nhl-api" }), inPenaltyArea([88, 50], { frame: "opta" }));
console.log(isFair([101, 100], { frame: "retrosheet" }), onWarningTrack([0, 380], { frame: "retrosheet", park: "fenway-park" }), overWall([0, 395], { frame: "retrosheet", park: "fenway-park" }));
// true false
// true true true
// false true true
```

`isThreePointer`, `inPaint`, `inRestrictedArea`, `inSlot`, `inCrease`, `inPenaltyArea`, `inSixYardBox`, `inRedZone`, `betweenHashes`, `isFair`, `overWall` and `onWarningTrack` each take a point and the same options. `zoneResolver(sport, options)` is the function of a surface place (feet) to the finest zone that the marks of a drawing use for their `data-zone`.

## Home runs, from the park's own fence and wall

`homeRun(park, point, { frame, height })` decides from the park's fence distance at the bearing and, when the height of the ball where it crossed the fence is given, the height of the wall there. A ball in fair territory that came down beyond the fence is a home run; one under the wall's height struck it. `isHomeRun` is the yes or no.

```ts
import { PARKS_WITHOUT_WALL_HEIGHTS, homeRun, isHomeRun } from "@johnmorrisdotca/kyogijo-stadiums/zones";

// Fenway Park's Green Monster is 37 feet 2 inches high, 310 feet down the line.
const left = [-250, 250] as const;
console.log(homeRun("fenway-park", left, { frame: "retrosheet", height: 30 }).reason, isHomeRun("fenway-park", left, { frame: "retrosheet", height: 40 }));
// struck-wall true
console.log(PARKS_WITHOUT_WALL_HEIGHTS.length, "of 94 parks hold no wall height");
// 59 of 94 parks hold no wall height
```

Where the park's article gives no wall height for the bearing, a decision that needs one is `homeRun: undefined` with `reason: "unknown-wall"` and `wallData` false: never a guess. `PARKS_WITHOUT_WALL_HEIGHTS` lists the parks (59 of the 94 hold none at all), and `wallHeightAt(park, angle, year)` is the height at a bearing, or `null`. Without `height`, a fair ball beyond the fence is a home run whatever the wall.

## Marks carry their zone

Every mark of a data layer (and of a chart) is written with `data-mark-id`, `data-index` and `data-zone`, the zone being this engine's finest, so that one listener can tie a mark to a table: see [data layers](./layers.md#linking-marks-to-a-table).
