# Entry points

The [API reference](https://johnmorrisdotca.github.io/kyogijo/api.html) lists every export of every entry point with its signature and its doc comment. It is made from the source by `pnpm site`, so it cannot fall behind the code.

| Entry | What it holds |
| --- | --- |
| `@johnmorrisdotca/kyogijo` | `drawKyogijo`, `drawSurface`, `drawScore`, `drawBadge`, `drawLayers`, `RANGES`, `layerTable`, `describe`, `winnerOf`, `statusLabel`, `isPortrait`, `statusText`; `OUTCOMES`, `rampColour`; `SPORTS`, `COURT_THEMES`, `LOOKS`, `LOOK_NAMES`, `LOOK_PAIRS`, `lookPalette`, `lookStyle`, `contrastOf`, `FEATURES`, `FEATURE_INFO`, `KYOGIJO_STYLE` and its parts (`KYOGIJO_LOOK_STYLE`, `KYOGIJO_FEATURE_STYLE`, `KYOGIJO_NOTE_STYLE`), `SOCCER`, `SOCCER_PITCHES`, `SOCCER_PROVIDERS`, `soccerSpec`, `soccerFrame`, `rescale`, `PARKS`, `PARK_IDS`, `parkById`, `parkByWikidata`, `parkPointsIn`, `parkSourceUrl`, `parkUnit`, `fenceFor`; `rulesFor`, `eraChanges`, `eraStates`, `eraRange`, `seasonLabel`, `footballIn`, `ERA_SPORTS`, `ERA_CURRENT`, `ERA_SOURCES`; `SURFACE_UNITS`, `UNITS`, `convertLength`; `safeColour`, `safeLogo`, `inkOn`; `fitLines`, `textWidth`, `abbreviate`, `capitals`; `KYOGIJO_STYLE`, `KYOGIJO_TEAM_STYLE`, `KYOGIJO_STRINGS`, `COLOR_PROPERTIES`, `VERSION` and the option types |
| `@johnmorrisdotca/kyogijo/geometry` | `FOOTBALL`, `NHL`, `NBA`, `MLB`, `SOCCER`, `SOCCER_PITCHES`, `soccerSpec`, `soccerPitchClass`, `fenceAt`, `fencePoints`, `threePointJoin`, `skinJoin`, `boardsY` and the other dimensions; `TENNIS`, `VOLLEYBALL`, `BEACH_VOLLEYBALL`, `BADMINTON`, `PICKLEBALL`, `TABLE_TENNIS`, `SURFACE_UNITS`, `convertLength`, `convertPoint`, `lengthsIn`, `dimensionsOf`, `surfaceSize`, `fenceIn` |
| `@johnmorrisdotca/kyogijo/frames` | `toSurface`, `fromSurface`, `convert`, `convertPoints`, `flipEnds`, `attackingIn`, `registerFrame`, `frameByName`, `framesOf`, `piecewise`, `span`, `FRAMES`, `RETROSHEET_ZONES`, `zoneToPoint`, `zoneAt`, `SOCCER_PROVIDERS`, `rescale` and the frame types |
| `@johnmorrisdotca/kyogijo/layers` | `drawLayers`, `layerTable`, `renderLayers`, `outlineOf`, `OUTCOMES`, `rampColour`, the heat numbers (`binGrid`, `densityGrid`), `ZONE_SETS`, `HEAT_RAMPS`; `FORMATIONS`, `formationById`, `positionName`; `convexHull`, `delaunay`, `voronoiCells`, `polygonArea`, `polygonCentroid`; `KYOGIJO_TEAM_STYLE` and the layer types |
| `@johnmorrisdotca/kyogijo/charts` | `nbaShotChart`, `nhlShotMap`, `mlbSprayChart`, `nflPassChart`, `soccerShotMap`, `soccerGoalMouth`, `curlingStones`, `curlingScore`, `passNetwork` and the chart types |
| `@johnmorrisdotca/kyogijo/replay` | `drawFrame`, `interpolate`, `trails`, `possession`, `activeEvents`, `eventsBetween`, `describeEvent`, `replayLayers`, `replaySnapshot`, `replaySummary`, `replayTable`, `replayInfo`, `replayTimes`, `replayEvents`, `replayClock`, `createReplay`, `REPLAY_SPEEDS` and the replay types |
| `@johnmorrisdotca/kyogijo/scene` | `sceneOf`, `sceneFromSvg`, `sceneToSvg`, `parseSvg`, `writeSvg`, `pathCommands` and the scene types: the drawing as plain data, and an SVG that needs no stylesheet |
| `@johnmorrisdotca/kyogijo/canvas` | `drawToCanvas`, `withAlpha` and the context's minimal type: a drawing on a browser's or a Node canvas context |
| `@johnmorrisdotca/kyogijo/d3` | `appendSurface`, `surfaceDomain`: a drawing in a d3 selection, placed by your scales |
| `@johnmorrisdotca/kyogijo/plot` | `surfaceMark`, `surfaceScales`: a drawing as a mark of an Observable Plot, with its scales |
| `@johnmorrisdotca/kyogijo/geojson` | `sceneToGeoJSON`: a drawing as a GeoJSON FeatureCollection, in feet or a provider's frame |
| `@johnmorrisdotca/kyogijo/png` | `toPNG`, `PNG_PEER_MISSING`: a drawing as PNG bytes in Node, through the optional peer `@resvg/resvg-js` |
| `@johnmorrisdotca/kyogijo/parks` | `PARKS`, `PARK_IDS`, `parkById`, `parkByWikidata`, `parkPointsIn`, `parkWallsIn`, `parkQuirksIn`, `parkSourceUrl`, `parkUnit`, `fenceFor` |
| `@johnmorrisdotca/kyogijo/eras` | `rulesFor`, `eraChanges`, `eraStates`, `eraRange`, `seasonLabel`, `footballIn`, `ERA_SPORTS`, `ERA_CURRENT`, `ERA_SOURCES` and the rule types |
| `@johnmorrisdotca/kyogijo/grounds` | `GROUNDS`, `GROUND_IDS`, `groundById`, `groundByWikidata`, `groundNameIn`, `groundsHosting`, `groundSourceUrl` |
| `@johnmorrisdotca/kyogijo/events` | `EVENTS`, `EVENT_IDS`, `EVENT_SOURCES`, `eventById`, `eventOptions`, `eventSources`, `eventFit`, `fitOf`, `conventionPlacement`, `KYOGIJO_SPECIAL_STYLE` and the game types: the special games, a surface set inside another |
| `@johnmorrisdotca/kyogijo/atlas` | `PLACES`, `placeById`, `placesBy`, `atlasFacets`, `surfaceOf` |
| `@johnmorrisdotca/kyogijo/mount` | `mountKyogijo` (with its `replay` method), `kyogijoElement`, `containerAspect` |
| `@johnmorrisdotca/kyogijo/react` | `kyogijoProps`, `kyogijoHtml`, `createKyogijo` |
| `@johnmorrisdotca/kyogijo/element` | `KyogijoField` (with its `timeline`, `replaySettings` and `replay`), `defineKyogijoField`, `optionsFromAttributes`, `replaySettingsFromAttributes`, `KYOGIJO_TAG`, `KYOGIJO_ATTRIBUTES` |
| `@johnmorrisdotca/kyogijo/element/define` | importing it registers `<kyogijo-field>` |

Every function of the drawing is pure: it returns new values and never changes what it was given. The [renderers](./renderers.md) (`canvas`, `d3`, `plot`) write to the context, selection or document you hand them, and `toPNG` returns a promise; each is its own entry and none imports anything from outside the package.
