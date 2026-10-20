# Limits

Each is held by a test, and the ones with a name are exported. The counts are made from the code by `pnpm docs:make`.

<!-- made:limits -->
| Limit | Value | Where |
| --- | --- | --- |
| Sports | 41 | `SPORTS` |
| Soccer pitches and providers | 10 presets, 10 providers (90 maps between them, each landmark to its landmark) | `SOCCER_PITCHES`, `SOCCER_PROVIDERS` |
| League variants | 82 leagues of 34 families, besides each sport's own | `LEAGUES` |
| Ballparks | 94 (30 current MLB, 44 past MLB, 12 NPB home parks, 8 other NPB grounds) | `PARKS` |
| Grounds | 64 | `GROUNDS` |
| Arenas | 167 | `ARENAS` |
| Special games | 18 (a surface set inside another: ballparks, football stadiums, a deck, a stadium's pitch) | `EVENTS` |
| Places on the atlas | 330 | `PLACES` |
| Units | 6 (`yd`, `m`, `ft`, `in`, `cm`, `mm`) | `UNITS` |
| Coordinate frames | 48 to start with (`nhl-api`, `hockeytech`, `nba-stats`, `nfl-tracking`, `mlbam`, `retrosheet`, `curling`, `tennis`, `volleyball`, `badminton`, `pickleball`, `tabletennis`, `padel`, `squash`, `racquetball`, `sepaktakraw`, `teqball`, `roundnet`, `netball`, `lacrosse`, `rugby`, `afl`, `gaelic`, `cricket`, `fieldhockey`, `handball`, `swimming`, `waterpolo`, `diving`, `artisticswimming`, `athletics`, `skating`, `judo`, `karate`, `kendo`, `sumo`, `kyudo`, `dojo` and the 10 soccer providers), more by `registerFrame` | `FRAMES` |
| A colour | a hex colour, `rgb()`, `rgba()`, `hsl()`, `hsla()`, a name or `var(--name)`, 64 characters at most | `safeColour` |
| A logo | an https or relative address, an image data address, or SVG text up to 200,000 characters | `safeLogo` |
| A grid of drawings | 200 drawings at most, 120 to 8,000 wide; each drawing keeps its own ids, and the base stylesheet is written once | `drawGrid` |
| A name | any length: it is set on one line or two, in the biggest size that fits its place | `fitLines` |
| Formations | 36 named formations of 13 sports, 346 places in all | `FORMATIONS` |
| The team layers | a Voronoi diagram of 22 players adds under 12 kB; 1,000 points are triangulated in under 600 ms; a pass network of 600 passes adds under 16 kB | `voronoi`, `delaunay`, `network` |
| A layer's marks | 1,000 points add under 70 kB; 10,000 draw in under 250 ms | `drawKyogijo` |
| A drawing's size | under 22 kB for a football field, 15 kB for a soccer pitch with a score, 14 kB for a rink or a court, 17 kB for a ballpark, 17.5 kB for a curling sheet, a net sport's court with its board or a field sport's surface with its score, 19 kB for a swimming pool, 17.5 kB for a water polo pool, 15.5 kB for a diving well 14 kB for an artistic swimming area, 22 kB for a judo area, 20 kB for a karate area, 18 kB for a dojo and 17.5 kB for a kendo shiai-jo, a dohyō or a kyūdōjō, each with its 8 to 10 kB stylesheet (a test holds each) | `drawKyogijo` |
<!-- /made:limits -->
