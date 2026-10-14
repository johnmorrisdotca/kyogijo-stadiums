# Coordinate frames

A data provider puts a point on a rink or a field in its own numbers: the NHL's feet from centre ice, HockeyTech's canvas of 600 by 300, the NBA's tenths of a foot from the hoop. A `Frame` says how those numbers lie on the surface (unit, range, origin, which way y grows, landmarks), and `toSurface` and `fromSurface` move points between a frame and the drawing's own coordinates. `convert(from, to)` goes from one provider's frame to another's. The module is `@johnmorrisdotca/kyogijo-stadiums/frames`; each frame is cited in [sources.md](./sources.md).

## Every frame

One row for each frame the package starts with. The table is made from the code (`FRAMES`) by `pnpm docs:make`, and a test holds it to it, so it cannot fall behind: the range, the origin, the way y grows, whether the frame fits one size of surface or any, the unit and the source of each are the frame's own fields. A frame's `note` says what the source does not settle. Each source is cited in [sources.md](./sources.md#coordinate-frames) (the soccer providers in [sources.md](./sources.md#soccer-coordinate-frames)).

<!-- made:frames -->
| Frame | Sport | Unit | Range of x and y | Origin | y grows | Size | Ends | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `nhl-api` | NHL | feet | x -100 to 100; y -42.5 to 42.5 | centre ice | up | fixed: one size of surface | fixed to the surface | NHL API coordinates |
| `hockeytech` | NHL | pixels | x 0 to 600; y 0 to 300 | the top left corner of the canvas | down | fixed: one size of surface | fixed to the surface | HockeyTech coordinates |
| `nba-stats` | NBA | tenths of a foot | x -250 to 250; y -52.5 to 887.5 | the centre of the hoop | up | fixed: one size of surface | the basket or house attacked | NBA stats shot coordinates |
| `nfl-tracking` | NFL | yards | x 0 to 120; y 0 to 53.33 | the corner of the back of the left end zone, at the bottom of the field diagram | up | fixed: one size of surface | fixed to the surface | NFL tracking data |
| `mlbam` | MLB | pixels | x 0 to 250; y 0 to 250 | the top left of the image; home plate stands at (125.42, 198.27) | down | fixed: one size of surface | none | MLBAM and Statcast hit coordinates |
| `retrosheet` | MLB | feet | x -330 to 330; y -60 to 420 | the back point of home plate | up | fixed: one size of surface | none | Retrosheet hit locations |
| `curling` | curling | feet | x -7.8 to 7.8; y -132 to 18 | the button of the house the stones are played to | down | variable: the surface's size is given | the basket or house attacked | this package's own frame: the button as the origin, as the rulebooks measure a stone's score from the tee |
| `tennis` | tennis | feet | x -39 to 39; y -18 to 18 | the centre of the net, on the court | up | fixed: one size of surface | fixed to the surface | this package's own frame: the centre of the net as the origin, as the rulebook measures the court from the net |
| `volleyball` | volleyball | metres | x -9 to 9; y -4.5 to 4.5 | the centre of the net, on the court | up | variable: the surface's size is given | fixed to the surface | this package's own frame: the centre of the net as the origin, as the rulebook measures the court from the net |
| `badminton` | badminton | metres | x -6.7 to 6.7; y -3.05 to 3.05 | the centre of the net, on the court | up | fixed: one size of surface | fixed to the surface | this package's own frame: the centre of the net as the origin, as the rulebook measures the court from the net |
| `pickleball` | pickleball | feet | x -22 to 22; y -10 to 10 | the centre of the net, on the court | up | fixed: one size of surface | fixed to the surface | this package's own frame: the centre of the net as the origin, as the rulebook measures the court from the net |
| `tabletennis` | table tennis | metres | x -1.37 to 1.37; y -0.76 to 0.76 | the centre of the net, on the table | up | fixed: one size of surface | fixed to the surface | this package's own frame: the centre of the net as the origin, as the rulebook measures the court from the net |
| `lacrosse` | lacrosse | metres | x -50 to 50; y -30 to 30 | the centre of the surface | up | variable: the surface's size is given | fixed to the surface | this package's own frame: the centre of the surface as the origin |
| `rugby` | rugby | metres | x -60 to 60; y -35 to 35 | the centre of the surface | up | variable: the surface's size is given | fixed to the surface | this package's own frame: the centre of the surface as the origin |
| `afl` | Australian football | metres | x -80 to 80; y -70.5 to 70.5 | the centre of the surface | up | variable: the surface's size is given | fixed to the surface | this package's own frame: the centre of the surface as the origin |
| `gaelic` | Gaelic games | metres | x -72.5 to 72.5; y -45 to 45 | the centre of the surface | up | variable: the surface's size is given | fixed to the surface | this package's own frame: the centre of the surface as the origin |
| `cricket` | cricket | yards | x -75 to 75; y -75 to 75 | the middle of the pitch, the centre of the ground | up | variable: the surface's size is given | none | this package's own frame: the centre of the surface as the origin |
| `fieldhockey` | field hockey | metres | x -45.7 to 45.7; y -27.5 to 27.5 | the centre of the surface | up | variable: the surface's size is given | fixed to the surface | this package's own frame: the centre of the surface as the origin |
| `handball` | handball | metres | x -20 to 20; y -10 to 10 | the centre of the surface | up | variable: the surface's size is given | fixed to the surface | this package's own frame: the centre of the surface as the origin |
| `athletics` | athletics | metres | x -100 to 100; y -60 to 60 | the middle of the track | down | variable: the surface's size is given | none | this package's own frame: the middle of the track as the origin |
| `opta` | soccer | percent of the pitch | x 0 to 100; y 0 to 100 | the bottom left corner of the pitch | up | variable: the surface's size is given | fixed to the surface | Stats Perform's event specification is not public: the figures are those mplsoccer and ggsoccer agree on (docs/sources.md) |
| `statsbomb` | soccer | yards | x 0 to 120; y 0 to 80 | the top left corner of the pitch | down | variable: the surface's size is given | fixed to the surface | StatsBomb Open Data Events v4.0.0, Appendix 2, Locations (github.com/statsbomb/open-data, doc/) |
| `wyscout` | soccer | percent of the pitch | x 0 to 100; y 0 to 100 | the top left corner of the pitch | down | variable: the surface's size is given | fixed to the surface | Wyscout Data Glossary, Pitch coordinates (dataglossary.wyscout.com/pitch_coordinates); the posts are from ggsoccer, which the glossary does not mark |
| `tracab` | soccer | centimetres | x -5250 to 5250; y -3400 to 3400 | the centre spot | up | variable: the surface's size is given | fixed to the surface | Tracab's specification is not public: the origin, unit and y direction are those mplsoccer, kloppy and floodlight use (docs/sources.md); the lines are the Laws' |
| `metrica` | soccer | fractions of the pitch | x 0 to 1; y 0 to 1 | the top left corner of the pitch | down | variable: the surface's size is given | fixed to the surface | Metrica Sports sample-data README (github.com/metrica-sports/sample-data) |
| `skillcorner` | soccer | metres | x -52.5 to 52.5; y -34 to 34 | the centre spot | up | variable: the surface's size is given | fixed to the surface | SkillCorner open data README and field diagram (github.com/SkillCorner/opendata) |
| `secondspectrum` | soccer | metres | x -52.5 to 52.5; y -34 to 34 | the centre spot | up | variable: the surface's size is given | fixed to the surface | Second Spectrum's specification is not public: the origin, unit and y direction are those mplsoccer, kloppy and floodlight use (docs/sources.md) |
| `impect` | soccer | metres | x -52.5 to 52.5; y -34 to 34 | the centre spot | up | variable: the surface's size is given | fixed to the surface | Impect Glossary, context variables, "How is the pitch defined?" (glossary.impect.com/context-variable) |
| `uefa` | soccer | metres | x 0 to 105; y 0 to 68 | the bottom left corner of the pitch | up | variable: the surface's size is given | fixed to the surface | UEFA Stadium Infrastructure Regulations, Article 5.01: 105 by 68 metres for categories 3 and 4; mplsoccer's 'uefa' type is the same in its code (its text says 65) |
| `international` | soccer | metres | x 0 to 105; y 0 to 68 | the bottom left corner of the pitch | up | variable: the surface's size is given | fixed to the surface | IFAB Laws of the Game, Law 1; ggsoccer's pitch_international |
<!-- /made:frames -->

## The same spot in each frame

Each picture is the same surface with the same spot marked, written in the frame's own numbers: the star is the spot, and an arrow from it shows which way x grows and another which way y does, each with its letter. They are drawn by the build of the docs site from the code under each, with `from` naming the frame, so every one lands on the same place. The soccer providers that fix their lines (Opta, StatsBomb, Wyscout) are drawn with the lines where they put them. To try a point of your own, use the converter in [the demo](https://johnmorrisdotca.github.io/kyogijo-stadiums/#providers).

<!-- site:frames -->

## Using a frame

```ts
import { convert, fromSurface, toSurface } from "@johnmorrisdotca/kyogijo-stadiums/frames";

// The right end-zone face-off dot: 69 feet from centre ice, 22 to one side.
console.log(toSurface([[69, 22]], { from: "nhl-api" }), toSurface([[507, 150 - (22 * 300) / 85]], { from: "hockeytech" })[0].map((n) => Math.round(n * 100) / 100));
// [ [ 169, 20.5 ] ] [ 169, 20.5 ]

// The same point in metres lands where the point in feet does, and goes back.
const metres = toSurface([[69, 22]], { from: "nhl-api", units: "m" });
console.log(metres[0].map((n) => n.toFixed(3)), fromSurface(metres, { to: "nhl-api", units: "m" })[0].map((n) => Math.round(n)));
// [ '51.511', '6.248' ] [ 69, 22 ]

// A team that attacked the left end in a period is turned a half turn, so that every shot attacks the right.
console.log(toSurface([[69, 22]], { from: "nhl-api", attacking: "left" }), convert("hockeytech", "nhl-api")([[600, 0]]));
// [ [ 31, 64.5 ] ] [ [ 100, 42.5 ] ]
```

- **Units, anchors and limits.** `units` is the unit of the surface's numbers (feet by default); `anchors` replace a frame's landmarks with your own for a venue whose markings differ, and `limits` keeps points on the surface (`"surface"`) or in a box. Anchors and limits are converted with `units`, not only the points.
- **Ends.** `attacking: "left"` turns points a half turn about the middle of the surface. `attackingIn("nhl", period, "right")` says which end a team attacks in a period (hockey changes ends every period, football after the first and third quarters, basketball at the half); for a period no rule here settles, pass `changedAfter`. A baseball frame has no ends and refuses `attacking`.
- **Your own frame.** `registerFrame(frame)` adds one to `FRAMES`, and `piecewise(landmarks)` is the mapper the frames use: straight between landmarks. A frame for a surface of any size takes its landmarks as a function of the surface's size, and `toSurface` is then given `size`.
