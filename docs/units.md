# Units

Each surface keeps the unit its rulebook states its figures in. The drawing itself is made in feet, so a figure is one conversion away in either direction, and `units` says what the lengths you pass are in.

| Surface | Unit | Why |
| --- | --- | --- |
| `nfl`, `cfl`, `ifaf` | yards (`yd`) | the length of a field and its end zones are counted in yards |
| `nhl`, `nba` | feet (`ft`) | the rulebooks give feet and inches |
| `mlb` | feet (`ft`) | the Official Baseball Rules give feet |
| `soccer` | metres (`m`) | the Laws of the Game give metres, with yards beside them |
| `curling` | metres (`m`) | World Curling's rules give metres with feet beside them; Curling Canada's give feet first, so its league has feet |
| NPB parks (`parkUnit`) | metres (`m`) | the parks of Japan publish their fence in metres; `PARKS` holds them in feet, converted once at 0.3048 metres to the foot |

`SURFACE_UNITS` is that table, and each league keeps the unit of its own rulebook (a FIBA court in metres, an IIHF rink in metres):

<!-- made:units -->
| `sport` | `league` | Surface | Rulebook unit |
| --- | --- | --- | --- |
| `nfl` | the sport's own | NFL | `yd` (yards) |
| `cfl` | the sport's own | CFL | `yd` (yards) |
| `ifaf` | the sport's own | IFAF | `yd` (yards) |
| `nhl` | the sport's own | NHL | `ft` (feet) |
| `nba` | the sport's own | NBA | `ft` (feet) |
| `mlb` | the sport's own | MLB | `ft` (feet) |
| `soccer` | the sport's own | soccer | `m` (metres) |
| `curling` | the sport's own | curling | `m` (metres) |
| `tennis` | the sport's own | tennis | `ft` (feet) |
| `volleyball` | the sport's own | volleyball | `m` (metres) |
| `badminton` | the sport's own | badminton | `m` (metres) |
| `pickleball` | the sport's own | pickleball | `ft` (feet) |
| `tabletennis` | the sport's own | table tennis | `m` (metres) |
| `padel` | the sport's own | padel | `m` (metres) |
| `squash` | the sport's own | squash | `m` (metres) |
| `racquetball` | the sport's own | racquetball | `ft` (feet) |
| `sepaktakraw` | the sport's own | sepak takraw | `m` (metres) |
| `teqball` | the sport's own | teqball | `m` (metres) |
| `roundnet` | the sport's own | roundnet | `m` (metres) |
| `netball` | the sport's own | netball | `m` (metres) |
| `swimming` | the sport's own | swimming | `m` (metres) |
| `waterpolo` | the sport's own | water polo | `m` (metres) |
| `diving` | the sport's own | diving | `m` (metres) |
| `artisticswimming` | the sport's own | artistic swimming | `m` (metres) |
| `lacrosse` | the sport's own | lacrosse | `m` (metres) |
| `rugby` | the sport's own | rugby | `m` (metres) |
| `afl` | the sport's own | Australian football | `m` (metres) |
| `gaelic` | the sport's own | Gaelic games | `m` (metres) |
| `cricket` | the sport's own | cricket | `yd` (yards) |
| `fieldhockey` | the sport's own | field hockey | `m` (metres) |
| `handball` | the sport's own | handball | `m` (metres) |
| `nba` | `wnba` | WNBA basketball court | `ft` (feet) |
| `nba` | `fiba` | FIBA basketball court | `m` (metres) |
| `nba` | `ncaa-men` | NCAA men's basketball court | `ft` (feet) |
| `nba` | `ncaa-women` | NCAA women's basketball court | `ft` (feet) |
| `nba` | `nfhs` | High school (NFHS) basketball court | `ft` (feet) |
| `nba` | `gleague` | NBA G League basketball court | `ft` (feet) |
| `nhl` | `iihf` | IIHF ice hockey rink | `m` (metres) |
| `nhl` | `ncaa-men` | NCAA men's ice hockey rink | `ft` (feet) |
| `nhl` | `ncaa-women` | NCAA women's ice hockey rink | `ft` (feet) |
| `nhl` | `ahl` | AHL hockey rink | `ft` (feet) |
| `nhl` | `echl` | ECHL hockey rink | `ft` (feet) |
| `nhl` | `ohl` | OHL hockey rink | `ft` (feet) |
| `nhl` | `whl` | WHL hockey rink | `ft` (feet) |
| `nhl` | `qmjhl` | QMJHL hockey rink | `ft` (feet) |
| `nhl` | `ushl` | USHL hockey rink | `ft` (feet) |
| `nhl` | `pwhl` | PWHL hockey rink | `ft` (feet) |
| `nfl`, `cfl`, `ifaf` | `ncaa` | NCAA football field | `yd` (yards) |
| `nfl`, `cfl`, `ifaf` | `nfhs` | High school (NFHS) football field, 11 players | `yd` (yards) |
| `nfl`, `cfl`, `ifaf` | `nfhs-9` | High school (NFHS) football field, 9 players | `yd` (yards) |
| `nfl`, `cfl`, `ifaf` | `nfhs-8` | High school (NFHS) football field, 8 players | `yd` (yards) |
| `nfl`, `cfl`, `ifaf` | `nfhs-6` | High school (NFHS) football field, 6 players | `yd` (yards) |
| `nfl`, `cfl`, `ifaf` | `uil-6` | Texas (UIL) six-man football field | `yd` (yards) |
| `nfl`, `cfl`, `ifaf` | `ifl` | Indoor Football League field | `yd` (yards) |
| `mlb` | `milb` | Minor League Baseball field | `ft` (feet) |
| `mlb` | `ncaa` | NCAA baseball field | `ft` (feet) |
| `mlb` | `nfhs` | High school (NFHS) baseball field | `ft` (feet) |
| `mlb` | `little-league` | Little League baseball field (60-foot bases) | `ft` (feet) |
| `mlb` | `little-league-intermediate` | Little League Intermediate (50/70) baseball field | `ft` (feet) |
| `mlb` | `pony` | PONY League (14U) baseball field | `ft` (feet) |
| `mlb` | `pony-bronco` | PONY Bronco (12U) baseball field | `ft` (feet) |
| `mlb` | `pony-mustang` | PONY Mustang (10U) baseball field | `ft` (feet) |
| `mlb` | `ncaa-softball` | NCAA softball field | `ft` (feet) |
| `mlb` | `nfhs-softball` | High school (NFHS) softball field | `ft` (feet) |
| `mlb` | `fastpitch` | USA Softball fast-pitch field | `ft` (feet) |
| `mlb` | `slowpitch` | USA Softball slow-pitch field | `ft` (feet) |
| `mlb` | `slowpitch-wbsc` | WBSC slow-pitch softball field | `ft` (feet) |
| `curling` | `curling-canada` | Curling Canada sheet | `ft` (feet) |
| `volleyball` | `fivb-beach` | FIVB beach volleyball court | `m` (metres) |
| `volleyball` | `wpv-sitting` | World ParaVolley sitting volleyball court | `m` (metres) |
| `lacrosse` | `world-women` | World Lacrosse women's field | `m` (metres) |
| `lacrosse` | `ncaa-men` | NCAA men's lacrosse field | `yd` (yards) |
| `lacrosse` | `ncaa-women` | NCAA women's lacrosse field | `m` (metres) |
| `lacrosse` | `pll` | PLL field | `yd` (yards) |
| `lacrosse` | `nll` | NLL box lacrosse floor | `ft` (feet) |
| `lacrosse` | `world-box` | World Lacrosse box lacrosse floor | `ft` (feet) |
| `rugby` | `nrl` | NRL field (rugby league) | `m` (metres) |
| `rugby` | `irl` | International Rugby League field | `m` (metres) |
| `gaelic` | `gaa-hurling` | GAA field for hurling | `m` (metres) |
| `cricket` | `icc-women` | ICC women's ground | `yd` (yards) |
| `cricket` | `mcc` | Laws of Cricket ground (MCC) | `yd` (yards) |
<!-- /made:units -->

The table is made from the code by `pnpm docs:make`, and a test holds it to it. The units are `ft`, `in`, `yd`, `m`, `cm` and `mm`; anything else is an error and not feet.

```ts
import { NHL, SURFACE_UNITS, convertLength, dimensionsOf, lengthsIn, surfaceSize } from "@johnmorrisdotca/kyogijo-stadiums/geometry";
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

console.log(SURFACE_UNITS.nfl, surfaceSize("nfl"), convertLength(100, "yd", "ft"));
// yd { length: 120, width: 53.333333333333336, unit: 'yd' } 300
console.log(surfaceSize("nhl", "m").length.toFixed(2), lengthsIn(NHL, "m").crease.radius.toFixed(3), dimensionsOf("nba", "yd").length.toFixed(2));
// 60.96 1.829 31.33

// The margin and the fence are lengths: with `units` they are in metres, and are converted before anything is drawn.
const metres = drawKyogijo({ sport: "mlb", id: "m", margin: 3.048, fence: { left: 100, center: 122 }, units: "m" });
const feet = drawKyogijo({ sport: "mlb", id: "m", margin: 10, fence: { left: 100 / 0.3048, center: 122 / 0.3048 } });
console.log(metres === feet);
// true
```

`lengthsIn(table, unit)` converts every length in a table of dimensions (`NHL`, `NBA`, `MLB`, a football spec) and keeps its names and flags; `dimensionsOf(sport, unit)` is the table of a sport, in its own unit when none is given; `fenceIn(points, unit)` converts a fence's distances and not its angles. Nothing is changed in place.
