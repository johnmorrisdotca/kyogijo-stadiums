# Architecture

The drawing is plain functions over plain data with no DOM and no dependency. The dimensions are in one file, the ballparks are generated from a reviewed list, and each surface is a function that returns its markup and the places the teams and the score go.

```text
src/
├── index.ts            the main entry
├── draw.ts             drawKyogijo: options in, one string of SVG out
├── score.ts            the teams' places, the score's panel and the badge
├── curling.board.ts    the curling scoreboard: each end, the total and the hammer
├── sheet.ts            the curling sheet a set of options asks for, held to the rules' range
├── surfaces/
│   ├── surface.ts      what a surface is, and the quarter turn
│   ├── football.ts     the NFL, CFL and IFAF fields
│   ├── hockey.ts       the NHL rink
│   ├── basketball.ts   the NBA court
│   ├── baseball.ts     the baseball field and its fence
│   ├── soccer.ts       the soccer pitch
│   ├── curling.ts      the curling sheet
│   ├── soccer-spec.ts  the Laws' figures, the presets, futsal and the small-sided pitches
│   └── soccer-providers.ts  the data providers' coordinates, registered as frames, and rescale
├── layers.ts           data layers: drawLayers, layerTable and the marks
├── layers.marks.ts     the shapes, curves, waves, heads and colour ramps of the marks
├── layers.types.ts     the types of a layer
├── layers.env.ts       what the layers share
├── heat.ts             the heat layers
├── heat.stats.ts       bins, density, contours
├── heat.colour.ts      the colour ramps
├── heat.zones.ts       the sports' zones
├── heat.types.ts       the heat layers' types
├── team.layers.ts      the team layers: one function that draws any of the seven kinds and one that lists their tables
├── team.network.ts     the pass network: nodes, links, touches
├── team.shape.ts       Voronoi cells, Delaunay triangles and convex hulls of a team's players
├── team.formation.ts   a formation drawn on a surface, with a lineup on it
├── team.motion.ts      flow fields and sonars of movements
├── team.common.ts      what the team layers share: teams, classes, tables, grouping
├── team.geometry.ts    convex hull, Delaunay triangulation (Bowyer and Watson) and Voronoi cells, from the textbook
├── team.types.ts       the team layers' types
├── formations.ts       the named formations of five sports and the names of their positions
├── layers-entry.ts     the layers' entry
├── charts.ts           ready-made charts and what they share
├── charts.baseball.ts  the spray chart
├── charts.soccer.ts    the soccer shot map and goal mouth
├── charts.curling.ts   the curling stones chart and the score of an end
├── charts.network.ts   the pass network chart
├── charts.types.ts     the charts' types
├── charts-entry.ts     the charts' entry
├── replay.ts           a replay's frame and its pure functions: interpolate, trails, possession, events, drawFrame
├── replay.control.ts   the replay's clock as a state machine: play, seek, step, speed, loop, reduced motion
├── replay.dom.ts       the replay's controls, keyboard, live region and the painter that moves only the marks that move
├── replay.types.ts     the replay's types
├── replay-entry.ts     the replay's entry
├── outline.ts          a surface's outline: where a layer is cut
├── common.ts           the drawing's id, the orientation and the unit, shared by the drawing and its layers
├── geometry.ts         every dimension, in feet, with the fence's curve
├── eras.ts             the markings of each surface in a season, each change with its sources
├── eras-entry.ts       the eras' entry
├── leagues.ts          the leagues: which rulebook marks a surface
├── leagues-entry.ts    the leagues' entry
├── leagues/
│   ├── types.ts        what a league is
│   ├── sources.ts      the rulebooks read
│   ├── basketball.ts   the courts
│   ├── hockey.ts       the rinks
│   ├── curling.ts      the sheets
│   ├── football.ts     the fields
│   └── baseball.ts     the diamonds
├── geometry-entry.ts   the geometry's entry
├── units.ts            the units of length, each surface's own, and the converters
├── frames.ts           coordinate frames: the mapper, the registry, toSurface and fromSurface
├── frames.providers.ts the NHL, HockeyTech, NBA, NFL, MLBAM, Retrosheet and curling frames
├── frames-entry.ts     the frames' entry
├── parks.ts            the ballparks, their fences and their sources
├── parks.data.ts       made by scripts/build-parks.mjs from scripts/parks.data.json
├── parks-entry.ts      the parks' entry
├── grounds.ts          the soccer grounds
├── grounds.data.ts     made by scripts/build-grounds.mjs
├── grounds-entry.ts    the grounds' entry
├── atlas.ts            every park and ground with its place, and the filters
├── atlas-entry.ts      the atlas' entry
├── themes.ts           the court looks
├── style.ts            the stylesheet, light and dark
├── strings.ts          the words, in English and Japanese
├── text.ts             measuring and fitting a name
├── colour.ts           safe colours and logo addresses
├── format.ts           numbers, escaping and elements as text
├── types.ts            the options
├── mount.ts            drawing into a container, and following its shape
├── mount-entry.ts      the mount's entry
├── react.ts            props and a component for React, without React
├── react-entry.ts      React's entry
├── element.ts          the custom element
├── element-entry.ts    the element's entry
├── element-define.ts   registers the element
└── version.ts          the version
```

Tests sit beside the code. `scripts/` builds the demo and the docs site, checks the packed package and the README's examples, and takes the README's pictures; `demo/` is the page and the frame; `e2e/` plays the demo and the docs in a real browser.

## The docs site

`pnpm site` builds the demo and then these pages as `site/docs/`. Nothing of it is in the package: `marked` is a development dependency, read at build time only.

```text
scripts/
├── site.mjs            builds the demo, the API reference and the docs site into site/
├── docs-pages.mjs      docs/*.md as pages: the contents, the search index, the pager, the links
├── docs-assets.mjs     the docs' stylesheet and script (the search box, the contents, the copy buttons)
├── docs-gallery.mjs    the gallery and the frames' drawings: code that is run, and the picture it draws
├── docs-made.mjs       the tables of docs/*.md made from the source: frames, units, limits
├── docs-examples.mjs   what an example says it prints, and how to hold it to what it prints
└── api.mjs             the API reference, read from the doc comments with the TypeScript compiler
```

- A page of the docs is a Markdown file of `docs/`, listed in `NAV` of `docs-pages.mjs` with its title in Japanese. A link in it is to another page by its file (`./soccer.md#data-providers`), and `resolveLink` turns it into the page's address on the site, or on GitHub for a file of the repository; a test holds every link, and every anchor, of the README and of every page.
- `<!-- made:frames -->` and its end comment mark a table `pnpm docs:make` writes from the code; `<!-- site:frames -->` marks where the build draws the same spot in every frame. Both are comments, so on GitHub the page reads as it is.
- The gallery's pages are not Markdown: each picture is the value of a snippet of code, run by the build against the built package, and the snippet is shown beside it. A test runs every snippet against the source.
- Every `ts` example of the README and of every page is run by `src/docs.examples.test.js` against the source, and again, type-checked, by `pnpm test:readme` against the built package; what a block prints is held to the comment lines after its `console.log`.
