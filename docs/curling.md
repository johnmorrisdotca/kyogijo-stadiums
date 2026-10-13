# Curling

`sport: "curling"` draws a curling sheet to scale: a house at each end (the 12-, 8- and 4-foot circles round the button), the tee, back, hog and centre lines, the hacks, and, if asked, the free guard zone and the ice's pebble. It is drawn from two rule books, each cited figure by figure in [sources.md](./sources.md#curling): R1 of World Curling's *The Rules of Curling and Rules of Competition* (1 September 2026) and Rule 3 of Curling Canada's *Rules of Curling for General Play* (September 2022 to August 2026). The sheet lies **tall** by default, with the far house at the top; `orientation: "landscape"` lays it wide.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo";

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
import { dimensionsOf, surfaceSize } from "@johnmorrisdotca/kyogijo/geometry";
import { LEAGUES, leagueFigures } from "@johnmorrisdotca/kyogijo/leagues";

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
| `sheet.show`, `sheet.end` | A part of a bare sheet: `half` (the hog line to the back line, which holds the free guard zone and the house) or `house`, at the `left` end (the top of a tall drawing, the default) or the `right`. A score always shows the whole sheet. |
| `detail: "simple"` | Leaves out the hacks, the hack line and the courtesy lines. |

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo";

const house = drawKyogijo({ sport: "curling", sheet: { show: "house", rings: { outer: "#0b6e4f", inner: "#d4a017" } } });
console.log(house.includes("--ky-rg-o:#0b6e4f"), house.match(/viewBox="([^"]*)"/)?.[1]);
// true 0 0 21.58 15
console.log(drawKyogijo({ sport: "curling", sheet: { length: 146, width: 14.5 } }).match(/viewBox="([^"]*)"/)?.[1]);
// 0 0 20.5 152
```

The sheet has no history in the package: a `year` is ignored.

## A score

A curling score is a board on the ice between the hog lines. A team's `ends` is its score in each end, in order (`"X"` for a conceded end, `null` for one not played yet); `hammer: true` marks the team that has the last stone. The board has ten ends and an `E` for each extra end, each team's total, and the status under it. A tall sheet has the ends down the board and a team in each column; a wide one has the ends across and a team in each row. The hammer is a small stone beside the team's name, on the board and on the badge.

```ts
import { drawKyogijo, statusLabel } from "@johnmorrisdotca/kyogijo";

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
import { curlingScore, curlingStones } from "@johnmorrisdotca/kyogijo/charts";

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

## Where it differs from `@sportsdataverse/sporty`

[`@sportsdataverse/sporty`](https://github.com/sportsdataverse/sdvplot-js) (MIT) draws a curling sheet too. Its numbers for both of its leagues (`wcf` and `curling canada`) are the same, and match these: 150 by 15.5833 feet, the tee line 57 feet from the middle, the back line 6 feet and the hog line 21 feet from the tee, rings of 6, 4 and 2 feet and a button of 0.5 feet, the centre line 12 feet beyond the tee, the hog line 4 inches. Where this package differs, and why:

- **The two books are told apart.** It draws the hack line and the courtesy lines for both leagues; here they are World Curling's (R1(b)V and VI), and Curling Canada's book prints neither.
- **The size is a range.** The books allow 146 to 150 feet and a width down to 14 ft 2 in or 14 ft 6 in; `sheet.length` and `sheet.width` take any size in them.
- **The rules around the sheet** (which stones are out of play, which score, which are in the free guard zone) are in the code here, from the rules cited above.

No code of sporty, and none of GPL-3.0 sportypy or sportyR, was used: only sporty's table of numbers was read, as facts, and every figure was read again from the two rule books.

## What is not drawn

World Curling's wheelchair lines (R1(c)), the positioned stones of mixed doubles (R17), the no-tick shot's zone (R7, which is a stone on the centre line and not an area), and the sheet's dividers and side boards beyond a plain band. The Five Rock Rule and the No-Tick rule are about what happens in play; the drawing shows the zone they refer to.
