# The surfaces

Thirteen surfaces, each drawn to scale from its rulebook. Every dimension is kept in feet in the code (`@johnmorrisdotca/kyogijo/geometry`) and can be had in any unit (see [Units](./units.md)), and each is cited in [docs/sources.md](./sources.md).

| `sport` | Surface | Size | Drawn |
| --- | --- | --- | --- |
| `nfl` | NFL field | 120 by 53⅓ yards with 10-yard end zones | yard lines every 5 yards, hash marks 70 feet 9 inches from each sideline, the sideline ticks, numbers every 10 yards upright and upside down with arrows, goal posts on the end lines, pylons |
| `cfl` | CFL field | 150 by 65 yards with 20-yard end zones | the same lines, hash marks 28 yards from each sideline, the centre marked C, goal posts on the goal lines |
| `ifaf` | IFAF field | 120 by 53⅓ yards with 10-yard end zones | hash marks 60 feet from each sideline, numbers 27 feet from the sideline, posts on the end lines |
| `nhl` | NHL rink | 200 by 85 feet, corners of 28 feet | goal lines 11 feet and blue lines 75 feet from the ends, the red line, five face-off circles and four more spots, creases, nets, trapezoids, the referee's crease |
| `nba` | NBA court | 94 by 50 feet | 16-foot keys, free-throw circles, three-point lines of 23 feet 9 inches and 22 feet in the corners, restricted areas, backboards and rims, the small marks |
| `soccer` | Soccer pitch | 105 by 68 m, or any size, or a preset | the halfway line and centre circle, penalty areas, goal areas, marks, arcs, corner arcs and flags, the marks off the field, goals |
| `mlb` | Baseball field | 90-foot bases, a fence from the park's distances | foul lines, the infield cut by a 95-foot arc round the mound, bases, the plate, batter's boxes, the running lane, warning track and fence |
| `curling` | Curling sheet | 150 by 15 feet 7 inches (45.72 by 4.75 m), 146 to 150 feet long and 14 feet 2 inches to 15 feet 7 inches wide by the rules | a house at each end (the 12-, 8- and 4-foot circles and the button), the tee, back, hog and centre lines, the hacks, and World Curling's hack and courtesy lines; tall by default ([Curling](./curling.md)) |
| `tennis` | Tennis court | 78 by 36 feet, 27 feet wide for singles | baselines, doubles and singles sidelines, service lines 21 feet from the net, the centre service line, centre marks, the net with its posts (and singles sticks) ([Tennis and the other net sports](./courts.md)) |
| `volleyball` | Volleyball court | 18 by 9 m, or 16 by 8 m with `league: "fivb-beach"` | the centre line and attack lines (not on the beach), the front zones, the attack line's extension and the service zone's limits for the FIVB's competitions, the net with its posts and antennae, the free zone |
| `badminton` | Badminton court | 13.40 by 6.10 m, 5.18 m wide for singles | singles and doubles side lines, short and doubles long service lines, centre lines, the net and its posts |
| `pickleball` | Pickleball court | 44 by 20 feet | the non-volley zones, the centerlines, the net and its posts, the playing surface round it |
| `tabletennis` | Table tennis table | 2.74 by 1.525 m | the white edge lines, the centre line, the net and its posts |

`league` draws a surface as one league's rulebook marks it, `sport` naming the family (`drawKyogijo({ sport: "nba", league: "fiba" })`): the WNBA, FIBA, the NCAA, the IIHF, the AHL, the CHL, high school, Little League, PONY, softball, Curling Canada and FIVB's beach volleyball, in [docs/variants.md](./variants.md).

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
