# Architecture

The drawing is plain functions over plain data with no DOM and no dependency. The dimensions are in one file, the ballparks are generated from a reviewed list, and each surface is a function that returns its markup and the places the teams and the score go.

```text
src/
├── index.ts            the main entry
├── draw.ts             drawKyogijo: options in, one string of SVG out
├── score.ts            the teams' places, the score's panel and the badge
├── homeside.ts         which side the home team is on by default, for each sport: home first for soccer and the world codes, away first for the North American leagues
├── mark.ts             the round team mark: a flag or a logo in a circle with a ring, or the team's initials on its colour
├── curling.board.ts    the curling scoreboard: each end, the total and the hammer
├── sets.board.ts       the net sports' scoreboard: each set or game, the points of the game, the sets won and the server's ball
├── court.ts            the net sports' court a set of options asks for: the look, the free zone, the lines, areas and fixtures as rectangles
├── court.more.ts       the geometry of padel, squash, racquetball, sepak takraw, teqball, roundnet and netball: rectangles, rings, walls and fixtures
├── courts.style.ts     the net sports' rules and the colours of each look, in light and dark
├── cricket.board.ts    the cricket scoreboard: runs and wickets, the overs and each innings
├── field.score.ts      the scores the field sports write their own way: goals and behinds, goals and points, and the total
├── fields.ts           the field sports' plan a set of options asks for: the league, the size held to its range
├── fields.types.ts     what a plan is: the shapes in feet, the areas, the goals, the places of the names, the ranges and the landmarks
├── fields.kit.ts       the small functions a plan is made of: a line, an arc, a ring, a size held to a range, the outline's path
├── fields.style.ts     the colours of the field sports that are not grass: a handball floor, a hockey pitch
├── fields/
│   ├── lacrosse.ts     the lacrosse plans: the box floor and the fields of World Lacrosse, the NCAA and the PLL
│   ├── rugby.ts        the rugby plans: union's dash lines and league's lines every 10 metres
│   ├── afl.ts          the Australian football ground: the oval cut at the goal lines, the goal squares and the Fifty Metre Arcs
│   ├── gaelic.ts       the Gaelic games' field: the lines across, the rectangles, the arcs
│   ├── cricket.ts      the cricket ground: the boundary, the circle, the pitch and its creases
│   ├── fieldhockey.ts  the field hockey pitch: the circles, the broken lines, the marks outside
│   └── handball.ts     the handball court: the goal areas, the free-throw line, the small lines
├── sheet.ts            the curling sheet a set of options asks for, held to the rules' range
├── surfaces/
│   ├── surface.ts      what a surface is, and the quarter turn
│   ├── football.ts     the NFL, CFL and IFAF fields
│   ├── hockey.ts       the NHL rink
│   ├── basketball.ts   the NBA court
│   ├── basketball.floor.ts  a hardwood floor's layers: the boards under the paint, the stained border, the seams and the sheen over it, the words in the border
│   ├── basketball.gear.ts   what stands on a hardwood floor seen from above: the baskets and stanchions with their soft shadows, the coaching box, the table and the benches
│   ├── baseball.ts     the baseball field and its fence
│   ├── baseball.walls.ts  a park's walls and quirks drawn on the field: the bands of the walls, the hill, the overhang, the ivy, the poles, the backstop, the dugouts, the legend
│   ├── soccer.ts       the soccer pitch
│   ├── curling.ts      the curling sheet
│   ├── curling.fold.ts the folded sheet: the whole sheet as a strip, its two houses enlarged beside it, the fan that joins them and their labels
│   ├── net.ts          the court of every net, racket and court sport: the ground, the walls, the lines, the rings, the net, the board's place
│   ├── field.ts        a field sport's surface, drawn from its plan
│   ├── soccer-spec.ts  the Laws' figures, the presets, futsal and the small-sided pitches
│   └── soccer-providers.ts  the data providers' coordinates, registered as frames, and rescale
├── layout.ts           drawGrid: many drawings in one SVG, with a title, a subtitle, a key and a credit line, in a size for a card or a phone
├── layout.style.ts     the grid's rules: the ground colour and the ink of its words, light and dark
├── layouts-entry.ts    the layouts' entry
├── background.ts       the ground behind a drawing or a grid: SVG patterns, a colour and a photograph at an opacity
├── hardwood.ts         the realistic basketball floor (`court.hardwood`): its options, the boards laid from a seed as two pattern tiles, and its rules
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
├── charts.curling.heat.ts  the curling heat chart: where the stones of many ends came to rest, as cells, hexagons, a density, zones or discs
├── curling.stats.ts    curling's statistics: the free guards, the stones in play, the ends (hammer, steals, forced ends) and the shots
├── charts.network.ts   the pass network chart
├── charts.types.ts     the charts' types
├── road.ts             roadToFinal: the two finalists' road to the final, as round marks of both teams with the score between them
├── road.model.ts       the road chart's data read and checked: scores, winners, rounds in order, the words, the summary and the table
├── road.draw.ts        the road chart drawn: the card, square, wide and phone arrangements
├── road.style.ts       the road chart's rules: the ground, the ink, the panels and the road, light and dark
├── road.types.ts       the road chart's types
├── charts-entry.ts     the charts' entry
├── replay.ts           a replay's frame and its pure functions: interpolate, trails, possession, events, drawFrame
├── replay.control.ts   the replay's clock as a state machine: play, seek, step, speed, loop, reduced motion
├── replay.dom.ts       the replay's controls, keyboard, live region and the painter that moves only the marks that move
├── replay.types.ts     the replay's types
├── replay-entry.ts     the replay's entry
├── scene.ts            sceneOf and sceneFromSvg: the drawing as plain data, read from the markup that writes the SVG
├── scene.types.ts      the scene's types: items, styles, clips, gradients and patterns
├── scene.xml.ts        a reader and writer of the package's SVG that gives the same text back, byte for byte
├── scene.css.ts        the part of CSS the stylesheet uses: selectors, light and dark, var(), calc() and the cascade
├── scene.path.ts       path data as absolute segments (arcs as curves), transforms, and a shape flattened to points
├── scene.flat.ts       a scene as elements that need no stylesheet, and sceneToSvg
├── scene.fit.ts        what d3 and Plot need to put a scene where their scales say
├── scene-entry.ts      the scene's entry
├── canvas.ts           a scene drawn onto a canvas context, with the context typed by what is called
├── canvas-entry.ts     the canvas' entry
├── d3.ts               a scene appended to a d3 selection, in the caller's scales
├── d3-entry.ts         the d3 entry
├── plot.ts             a scene as a mark for Observable Plot, and the scales that fit it
├── plot-entry.ts       the Plot entry
├── geojson.ts          a scene as a GeoJSON FeatureCollection, in feet or a provider's frame
├── geojson-entry.ts    the GeoJSON entry
├── png.ts              a scene as PNG bytes in Node, through the optional peer resvg
├── png-entry.ts        the PNG entry
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
│   ├── courts.ts       the courts of the net sports, sitting volleyball and the sports added after the first five
│   ├── fields.ts       a range of sizes: what the field sports' leagues share
│   ├── lacrosse.ts     the lacrosse fields and floor
│   ├── rugby.ts        the rugby fields
│   ├── aussie.ts       the Australian football ground and its named grounds
│   ├── gaelic.ts       the Gaelic games' field
│   ├── cricket.ts      the cricket grounds
│   ├── fieldhockey.ts  the field hockey pitch
│   ├── handball.ts     the handball court
│   ├── football.ts     the fields
│   └── baseball.ts     the diamonds
├── geometry-entry.ts   the geometry's entry
├── units.ts            the units of length, each surface's own, and the converters
├── frames.ts           coordinate frames: the mapper, the registry, toSurface and fromSurface
├── frames.providers.ts the NHL, HockeyTech, NBA, NFL, MLBAM, Retrosheet, curling, net sports and field sports frames
├── frames-entry.ts     the frames' entry
├── names.ts            the names of a place: the aliases, the lookup by any name and the official name
├── parks.ts            the ballparks, their fences, walls, quirks, names and their sources
├── ballpark.ts         what a drawing asks of a park's walls and quirks (`walls`, `quirks`), and the words that name them
├── parks.data.ts       made by scripts/build-parks.mjs from scripts/parks.data.json
├── parks-entry.ts      the parks' entry
├── grounds.ts          the soccer grounds
├── grounds.data.ts     made by scripts/build-grounds.mjs
├── grounds-entry.ts    the grounds' entry
├── atlas.ts            every park and ground with its place, its tenants and the surfaces it offers, and the filters
├── tenants.ts          the clubs that played in a place: their types, the sport each draws as and the leagues that ask for no surface
├── tenants.data.ts     made by scripts/build-tenants.mjs from scripts/tenants.wikidata.json
├── atlas-entry.ts      the atlas' entry
├── special.ts          a special game: the host and the guest as one surface, where the guest stands and how it fits
├── special.style.ts    the host's colours inside a special game
├── events.ts           the special games, their options, their words and how each fits
├── events.data.ts      the games, their places and their sources
├── events-entry.ts     the events' entry
├── themes.ts           the court looks
├── look.ts             the named looks (grass, night, chalkboard, blueprint, print, broadcast, high-contrast), light and dark, and the pairs that must read
├── features.ts         the named features of each surface and the rules that colour them
├── restyle.ts          the width, dashes and opacity of the painted lines, laid over what a surface wrote
├── mow.ts              the mowing patterns of a football field, a ballpark and a pitch
├── annotate.ts         direction arrows, axes and the labels of a surface's parts
├── ranges.ts           a drawing cropped to a range: the view, the clip, the annotations' room, the score's panel
├── ranges.names.ts     the named ranges of each sport and the check of the `range` option
├── style.ts            the stylesheet, light and dark
├── strings.ts          the words, in English and Japanese
├── text.ts             measuring and fitting a name
├── colour.ts           safe colours and logo addresses
├── format.ts           numbers, escaping and elements as text
├── types.ts            the options
├── turn.kit.ts         what the 3D view is built from: a plane (a flat rectangle placed by three vectors with a little SVG on it), a strip, a wall, a mesh
├── turn.camera.ts      the eye: the four viewpoints, a drag or a key as a new view, the fit of the scene in a box, and the one matrix that places a plane
├── turn.model.ts       a 3D view as data: the flat floor, what stands on it, the sizes and the words
├── turn.markup.ts      a 3D view as markup: every element carries its place in one `matrix3d`, stacked far to near; the buttons
├── turn.style.ts       the 3D view's colours, light and dark, and its rules
├── turn.dom.ts         the 3D view in a page: the pointer, the touch, the wheel, the keys, the glide, the live region, and the flat fallback
├── turn-entry.ts       the 3D view's entry
├── uprights.ts         what stands on a surface: read from the options as the drawing is, with its heights and its sentence
├── uprights.goal.ts    the parts several sports share: a goal with its net, a pair of posts, a flag on a pole
├── uprights.net.ts     the net sports: the net, its posts and antennae, the table tennis table on its legs
├── uprights.netkit.ts  what the net sports' uprights share: a net hung between a top and a bottom line, its sag, a table on its legs
├── uprights.more.ts    padel's walls and fence, squash's and racquetball's walls, sepak takraw's net, teqball's table, roundnet's set, netball's goalposts
├── uprights.rinks.ts   the hockey rink's boards and glass and goals, the basketball court's baskets and stanchions
├── uprights.board.ts   the score stood up: its badge on a board that faces the eye, hung over the middle of a court or a rink and standing behind an end of a field
├── uprights.fields.ts  football's posts and pylons, a soccer pitch's goals and flags, the posts of rugby, Gaelic and Australian football, stumps, a ballpark's fence, poles and backstop
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
