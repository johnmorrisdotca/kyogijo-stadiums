# The surfaces

Twenty-four surfaces, each drawn to scale from its rulebook. Every dimension is kept in feet in the code (`@johnmorrisdotca/kyogijo-stadiums/geometry`) and can be had in any unit (see [Units](./units.md)), and each is cited in [docs/sources.md](./sources.md).

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
| `swimming` | Swimming pool | 50 by 25 m with eight lanes (25 by 21 m short course), one to ten lanes | the lane ropes in green, blue and yellow with red floats within 5 m of the walls, the lane markings and their cross lines, the starting blocks, the touch panels, the backstroke flags at 5 m, the false start rope at 15 m, a side section, the lanes of a race ([Pools](./pools.md)) |
| `waterpolo` | Water polo field | 25 by 20 m between the goal lines | the ropes and the referees' platforms in red, yellow and green by distance from the goal line, the 2, 5 and 6 metre marks and the half distance line, the goals, the goal areas, the re-entry areas, the table and the substitution areas |
| `diving` | Diving well | 25 m across, 21 m deep | the 1 and 3 m springboards and the 5, 7.5 and 10 m platforms (and the 1 and 3 m platforms) at the distances of Appendix 2, their plummets, the three lines across the well |
| `artisticswimming` | Artistic swimming area | 30 by 20 m, or 25 by 15 m with a deep part | the lines along the floor, the deep part, the judges' platform and the starting platform |
| `lacrosse` | Lacrosse field or box floor | 100 by 60 m (World Lacrosse's men's), 110 by 60 yards (the NCAA's), a floor 200 by 85 feet | the goals, creases, restraining and wing lines; the women's goal circles, marking areas, arc and fan; the PLL's two-point arc; the floor's boards, face-off circle and spots ([Field sports](./field-sports.md)) |
| `rugby` | Rugby field | 100 m between the try lines and 70 wide, with in-goal areas (union); 100 by 68 m (league) | the 22-metre lines, half-way line and dash lines of union; a line every 10 metres, the 20 and 40 metre lines red, of the NRL's league; goal posts and flag posts |
| `afl` | Australian football ground | an oval 135 to 185 by 110 to 155 m, the MCG's 160 by 141 drawn, or a named ground | the goal and behind posts, the goal squares, the centre square and circles, the Fifty Metre Arcs |
| `gaelic` | Gaelic football and hurling field | 145 by 90 m (130 to 145 by 80 to 90) | the lines across at 13, 20, 45 (and 65) metres, the midline, the two rectangles at each end, the arcs, the posts |
| `cricket` | Cricket ground | a boundary of your own (a circle of 75 yards radius by default), a pitch of 22 yards | the pitch, the creases, the wickets, the boundary and the 30-yard circle |
| `fieldhockey` | Field hockey pitch | 91.40 by 55.00 m | the centre line, the 23-metre lines, the circles with their broken lines, the penalty spots, the goals, the marks outside |
| `handball` | Handball court | 40 by 20 m | the centre line, the goal areas, the 6-, 7- and 9-metre lines, the 4-metre lines, the goals, the throw-off area |

`league` draws a surface as one league's rulebook marks it, `sport` naming the family (`drawKyogijo({ sport: "nba", league: "fiba" })`): the WNBA, FIBA, the NCAA, the IIHF, the AHL, the CHL, high school, Little League, PONY, softball, Curling Canada, FIVB's beach volleyball, rugby league, the NLL's box lacrosse and the rest, in [docs/variants.md](./variants.md).

`range` crops a drawing to a part of its surface (`range: "offensive-zone"`, `"half-court"`, `"red-zone"`, `"penalty-area"`, `"infield"`, a curling `"house"`, or a box of your own), with its data, annotations and score following: [Display ranges and zoom](./ranges.md).

Lines are drawn a little thicker than they are painted, as broadcast graphics do, so that they stay in view at a small size; `exactLines: true` draws them at their true widths.

## The same surface, as a league marks it

`league` keeps the family and changes the rulebook: `drawKyogijo({ sport: "nba", league: "fiba" })` is a court with FIBA's keys and three-point line. Every league, with its figures and the pages it was read from, is in [League variants](./variants.md). `year` draws the markings a surface had in a season ([Surfaces through the years](./eras.md)), and a ballpark is drawn from its own fence ([Ballparks](./ballparks.md)). The soccer pitch has pages of its own, for its sizes, mowing patterns, goals and providers' coordinates ([Soccer](./soccer.md)).

```ts
import { drawKyogijo, drawSurface } from "@johnmorrisdotca/kyogijo-stadiums";

// No teams: the NFL field at its true shape, 120 by 53⅓ yards with 12 feet of ground round it.
console.log(/viewBox="-12 -12 384 184"/.test(drawSurface({ sport: "nfl" })));
// A court by the FIBA rulebook is not the NBA's.
console.log(drawKyogijo({ sport: "nba", league: "fiba" }) === drawKyogijo({ sport: "nba" }));
// true
// false
```

A surface may also be set inside another, to scale, as a rink was set on a ballpark's infield: that is `host` and `placement`, with the games that were played so, in [special games](./special-games.md).

Every surface is in the [gallery](./gallery.md), each with the code that drew it.
