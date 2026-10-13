# The surfaces

Seven surfaces, each drawn to scale from its rulebook. Every dimension is kept in feet in the code (`@johnmorrisdotca/kyogijo/geometry`) and can be had in any unit (see [Units](./units.md)), and each is cited in [docs/sources.md](./sources.md).

| `sport` | Surface | Size | Drawn |
| --- | --- | --- | --- |
| `nfl` | NFL field | 120 by 53⅓ yards with 10-yard end zones | yard lines every 5 yards, hash marks 70 feet 9 inches from each sideline, the sideline ticks, numbers every 10 yards upright and upside down with arrows, goal posts on the end lines, pylons |
| `cfl` | CFL field | 150 by 65 yards with 20-yard end zones | the same lines, hash marks 28 yards from each sideline, the centre marked C, goal posts on the goal lines |
| `ifaf` | IFAF field | 120 by 53⅓ yards with 10-yard end zones | hash marks 60 feet from each sideline, numbers 27 feet from the sideline, posts on the end lines |
| `nhl` | NHL rink | 200 by 85 feet, corners of 28 feet | goal lines 11 feet and blue lines 75 feet from the ends, the red line, five face-off circles and four more spots, creases, nets, trapezoids, the referee's crease |
| `nba` | NBA court | 94 by 50 feet | 16-foot keys, free-throw circles, three-point lines of 23 feet 9 inches and 22 feet in the corners, restricted areas, backboards and rims, the small marks |
| `soccer` | Soccer pitch | 105 by 68 m, or any size, or a preset | the halfway line and centre circle, penalty areas, goal areas, marks, arcs, corner arcs and flags, the marks off the field, goals |
| `mlb` | Baseball field | 90-foot bases, a fence from the park's distances | foul lines, the infield cut by a 95-foot arc round the mound, bases, the plate, batter's boxes, the running lane, warning track and fence |

`league` draws a surface as one league's rulebook marks it, `sport` naming the family (`drawKyogijo({ sport: "nba", league: "fiba" })`): the WNBA, FIBA, the NCAA, the IIHF, the AHL, the CHL, high school, Little League, PONY and softball, in [docs/variants.md](./variants.md).

Lines are drawn a little thicker than they are painted, as broadcast graphics do, so that they stay in view at a small size; `exactLines: true` draws them at their true widths.

## The same surface, as a league marks it

`league` keeps the family and changes the rulebook: `drawKyogijo({ sport: "nba", league: "fiba" })` is a court with FIBA's keys and three-point line. Every league, with its figures and the pages it was read from, is in [League variants](./variants.md). `year` draws the markings a surface had in a season ([Surfaces through the years](./eras.md)), and a ballpark is drawn from its own fence ([Ballparks](./ballparks.md)). The soccer pitch has pages of its own, for its sizes, mowing patterns, goals and providers' coordinates ([Soccer](./soccer.md)).

```ts
import { drawKyogijo, drawSurface } from "@johnmorrisdotca/kyogijo";

// No teams: the NFL field at its true shape, 120 by 53⅓ yards with 12 feet of ground round it.
console.log(/viewBox="-12 -12 384 184"/.test(drawSurface({ sport: "nfl" })));
// A court by the FIBA rulebook is not the NBA's.
console.log(drawKyogijo({ sport: "nba", league: "fiba" }) === drawKyogijo({ sport: "nba" }));
// true
// false
```

Every surface is in the [gallery](./gallery.md), each with the code that drew it.
