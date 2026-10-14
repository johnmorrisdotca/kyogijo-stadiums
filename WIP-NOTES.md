# WIP notes for work/dx (remove before release)

Ticket cmv7w6pe90004jm06na3wg3ku (spx-stats board, claimed as "Mac Studio", not done).

## Done
- `src/rules.ts`, `src/rules.types.ts`, `src/zones-entry.ts`: rules engine `zoneAt(sport, point, { frame, attacking, league, year, park, pitch... })`
  (hockey, basketball, soccer, baseball, football from the package's own figures; every other sport answers in its `ZONE_SETS`),
  predicates (`isThreePointer`, `inPaint`, `inSlot`, `inPenaltyArea`, `isFair`, `overWall`, `inRedZone`...), `homeRun` / `isHomeRun(park, point, { height })`
  with `wallHeightAt` and `PARKS_WITHOUT_WALL_HEIGHTS` (59 of 94 parks hold no wall height; the answer is `undefined`, never guessed), `zoneResolver`, `zoneName`.
  The frames entry already exports a different `zoneAt` (Retrosheet sectors); the new one lives in the new `./zones` entry.
- `src/pointer.ts`, `src/pointer-entry.ts`, `src/field.data.ts`, `src/pointer.fixture.ts`, `src/pointer.test.ts` (74 tests pass):
  `clientPointToField`, `fieldPointToClient`, `clientPointToFrames`. They use the browser's `getScreenCTM` of `.ky-surface-group`.
  Decision: a drawing writes `data-box` and `data-rules` on its surface group only with the new option `pointer: true`
  (default off, so every plain drawing stays byte for byte the same and the fingerprint tests stay valid). The 3D view returns null.
- `src/strings.ts`: `rules` section (en and ja) for the zone names. Japanese NOT yet reviewed.
- Data attributes (`data-mark-id`, `data-index`, `data-zone`, lines also `data-zone-end`) on points, lines, arrows, text, heat cells, zone cells, contour bands,
  player dots, voronoi cells, formation, network nodes and links. `id?: string | number` added to `MarkDatum` and to the chart datum types (NbaShot, NhlShot, Ball, NflPass, SoccerShot).
  `renderLayers` takes a 6th argument, a zone function (the soccer goal mouth passes a no-op).
- `infieldReach` exported from `src/heat.zones.ts`.

## Left
1. Tests red because layered output changed on purpose: charts.test, charts.network.test, layers.test (snapshot and the 60-bytes-a-point budget),
   heat.test (per-cell paths: size budget 30 kB for a 50x30 grid, structure tests), team.test, styling.identity (`layers` rows). Re-baseline snapshots (`vitest -u`), then
   check the budgets: heat cells are now one path each inside a group per colour; raise the budgets only if the growth is reasonable, else fall back to opt-in marks for big grids.
   Also `architecture.test` (docs/architecture.md must list the new files), `docs.test` (run `pnpm docs:make` for docs/strings-ja.md).
2. New entries in package.json `exports` (`./zones`, `./pointer`, `./goal`), docs/entry-points.md, README table, docs-gallery entries map, renderers.budget.test list.
3. Rules tests: exhaustive known points per sport, and a cross-check of hockey slot and basketball zones against `buildZoneSet("nhl-slot")` and `("nba-shot")` on a grid.
4. Goal mouth: `drawGoalMouth` in a `./goal` entry for hockey 6x4 ft, soccer 24x8 ft (7.32x2.44 m), handball 3x2 m, water polo 3x0.9 m, lacrosse 6x6 ft (1.83 m), field hockey 3.66x2.14 m;
   outcomes goal, saved, post, crossbar, wide, high; zones (top shelf, five-hole, corners, ours, not a rulebook); light and dark; renders through scene/canvas/d3/plot/geojson/png because it is an SVG string.
   Figures are in `soccer-spec.ts`, `leagues/handball.ts`, `leagues/fieldhockey.ts`, `leagues/lacrosse.ts`, `pool.figures.ts` (WATER_POLO.goal), `geometry.ts` (NHL.net). `soccerGoalMouth` in charts.soccer.ts already exists: generalise from it.
5. Coordinator's additions: `view: "strike-zone"` (catcher's view, 17 in plate, OBR strike zone with `top` and `bottom` options, 9-zone grid, 13-zone chase grid, L/R marker, numbered pitches by result/type/shape);
   cricket stumps elevation (Laws 8: 28 in by 9 in, bails; line and length zones); lacrosse 6x6 ft check against box and field rules.
6. Demo: in "Move a point between providers" (`demo/demo.js` drawProviders/convert, `scripts/site.mjs` section #providers) click/drag on a drawing (pass `pointer: true`) showing `clientPointToFrames` and the zone name; e2e in `e2e/soccer.demo.mjs`.
   Browser tests that click real drawings (check `getScreenCTM` includes the group's own transform in Chromium).
7. Docs (frames/zones/pointer/goal pages, layers data attributes with a React and a vanilla delegated-listener example), gallery, CHANGELOG Unreleased, Japanese strings through japanese-reviewer, then `pnpm check`, `test:readme`, `test:demo`, PNGs of the goal mouth with shots in the scratchpad ky-dx folder.

## Decisions to keep
- `zone` in a mark's `data-zone` is the finest zone (`subzone ?? zone`).
- The team attacks the right in the drawing; `attacking: "left"` turns provider numbers as the layers do, so `[69, 22]` of a left-attacking team is its defensive zone.
- Off the surface the rules answer nothing, except baseball (foul ground and over the wall are zones; `inBounds` is false there).
