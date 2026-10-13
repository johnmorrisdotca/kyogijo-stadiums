# Limits

Each is held by a test, and the ones with a name are exported. The counts are made from the code by `pnpm docs:make`.

<!-- made:limits -->
| Limit | Value | Where |
| --- | --- | --- |
| Sports | 8 | `SPORTS` |
| Soccer pitches and providers | 10 presets, 10 providers (90 maps between them, each landmark to its landmark) | `SOCCER_PITCHES`, `SOCCER_PROVIDERS` |
| League variants | 51 leagues of 5 families, besides each sport's own | `LEAGUES` |
| Ballparks | 94 (30 current MLB, 44 past MLB, 12 NPB home parks, 8 other NPB grounds) | `PARKS` |
| Grounds | 64 | `GROUNDS` |
| Places on the atlas | 158 | `PLACES` |
| Units | 6 (`yd`, `m`, `ft`, `in`, `cm`, `mm`) | `UNITS` |
| Coordinate frames | 17 to start with (`nhl-api`, `hockeytech`, `nba-stats`, `nfl-tracking`, `mlbam`, `retrosheet`, `curling` and the 10 soccer providers), more by `registerFrame` | `FRAMES` |
| A colour | a hex colour, `rgb()`, `rgba()`, `hsl()`, `hsla()`, a name or `var(--name)`, 64 characters at most | `safeColour` |
| A logo | an https or relative address, an image data address, or SVG text up to 200,000 characters | `safeLogo` |
| A name | any length: it is set on one line or two, in the biggest size that fits its place | `fitLines` |
| A layer's marks | 1,000 points add under 70 kB; 10,000 draw in under 250 ms | `drawKyogijo` |
| A drawing's size | under 22 kB for a football field, 15 kB for a soccer pitch with a score, 14 kB for a rink or a court, 17 kB for a ballpark, 17.5 kB for a curling sheet with its board, each with its 8 kB stylesheet (a test holds each) | `drawKyogijo` |
<!-- /made:limits -->
