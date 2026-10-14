# Annotations

Three options mark a surface for teaching and for charts that need a reference: `direction` draws the end each team attacks, `axes` draws a scale along the surface's edges, and `landmarks` names its parts. All three are drawn in the margin, in the surface's own frame inside the group that turns it, so they follow a surface turned a quarter, and every word stays upright. A margin that is too narrow for them is made wider, unless `margin` fixes it. Their words are in `language`, and the description says what they show. The default drawing is byte for byte what it was when none of them is used.

## Direction of play

`direction` draws an arrow for each team that is given, the home team's below the surface and the away team's above it, in the layer colours (`--ky-layer-home` and `--ky-layer-away`, which are the teams' own colours in a score drawing), with the team's name or "Home" and "Away".

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({ sport: "nhl", direction: { home: "right", away: "left" } });
console.log(svg.includes("Home attacking"), svg.includes("Away attacks the left end."));
// true true
```

| Key | What it does |
| --- | --- |
| `home`, `away` | `left` or `right`: the end that team attacks as the surface is drawn wide (the same words `attackingIn` uses). A tall drawing turns the surface a quarter clockwise, so its left end is at the top. |
| `period` | The period the arrows are for. The teams change ends by the sport's rule (hockey after every period, football after the first and the third quarters, basketball at the half), so `home: "right", period: 2` in hockey is home attacking the left. |
| `changedAfter` | The periods after which the teams change ends, for a sport with no rule here (soccer) or an overtime a rule does not settle. |
| `label` | The words by the arrow: one text, `{ home, away }`, or `false` for none. |

Baseball and curling have no ends to attack, so `direction` is an error there. The arrows come from ggsoccer's direction label and the idea of one per team and period is ours.

## Axes

`axes` draws ticks and numbers along the bottom and left edges of the surface as it lies wide. By default they are the drawing's own numbers: x along the surface from the left and y across it from the top, in `units` or, without, the rulebook's unit for the sport (yards for football, feet for the rink and the court, metres for a pitch and a sheet).

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({ sport: "nfl", axes: { ticks: 10, labels: { x: "yards" } } });
console.log(svg.includes("Axes in the drawing's own numbers, in yd: x from 0 to 120"));
// true
```

Give `frame` the name of any registered frame of the sport (`FRAMES`, `registerFrame`) to put the ticks at that provider's numbers, however its axes run: the NHL API's x is measured from the middle of the rink, and the NBA's `LOC_X` runs across the court, so its ticks stand on the left edge. A frame of another sport is an error.

| Key | What it does |
| --- | --- |
| `frame` | A frame's name, or a frame. The surface's own numbers when missing. |
| `ticks` | The distance between ticks, or the values to put one at, for both axes or `{ x, y }` each. A round step that gives about eight when missing. |
| `labels` | `false` for ticks with no numbers; or the titles of the axes, `{ x: "yards", y: "yards" }`. |

## Landmarks

`landmarks: true` names the parts of the surface in the margin, each with a leader to its place: the blue lines and the creases of a rink, the three-point line and the key of a court, the yard numbers and the hash marks of a field, the penalty arc and the goal area of a pitch, the bases and the warning track of a ballpark, the hog lines and the house of a sheet. A word goes in the first row where it clears the others, so a crowded surface has two or three rows of words. A part the drawing does not show (one goal of half a pitch, a part outside a [`range`](./ranges.md), or a goal drawn with `goals: "none"`) is left out.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({ sport: "soccer", landmarks: true, language: "ja" });
console.log(svg.includes("ペナルティーアーク"), svg.includes("コーナーアーク"));
// true true
```

The names are `KYOGIJO_STRINGS[language].notes.names`, in English and Japanese; the list of what each sport labels is in [the gallery](https://johnmorrisdotca.github.io/kyogijo-stadiums/docs/gallery-styling.html).

## Together

The three keep to their own places: the axes nearest the surface, then the words, then the arrows. A drawing that has all of them is the one to print for a lesson.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({ sport: "nba", look: "chalkboard", landmarks: true, direction: { home: "right" }, axes: { ticks: 10 } });
console.log(svg.includes("ky-an-marks"), svg.includes("ky-an-axes"), svg.includes("ky-an-dir"));
// true true true
```

## Turned and mirrored

ggsoccer warns that a pitch drawn with its y reversed puts the penalty arcs inside the box. Everything here is placed in the surface's wide frame and the surface is turned with its group, and a test holds the result for every surface, wide and tall and with each team attacking either end: an arrow points at the end it names as the eye sees it, the words are upright, every anchor is on the surface, and a soccer pitch's penalty arc is outside its penalty area in every provider's numbers.
