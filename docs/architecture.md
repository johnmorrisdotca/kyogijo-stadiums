# Architecture

The drawing is plain functions over plain data with no DOM and no dependency. The dimensions are in one file, the ballparks are generated from a reviewed list, and each surface is a function that returns its markup and the places the teams and the score go.

```text
src/
├── index.ts            the main entry
├── draw.ts             drawKyogijo: options in, one string of SVG out
├── score.ts            the teams' places, the score's panel and the badge
├── homeside.ts         which side the home team is on by default, for each sport: home first for soccer and the world codes, away first for the North American leagues
├── mark.ts             the round team mark: a flag or a logo in a circle with a ring, or the team's initials on its colour
├── pageant.ts          the pageant: what the options ask for, the carpet's ratio, and where each team's picture and the emblem go on the surface
├── pageant.draw.ts     the pageant drawn: a carpet (a flag laid flat with a border and fabric), a stage (a crest on a round disc with a ring) and the emblem
├── pageant.style.ts    the pageant's colours, light and dark, and its entrance (CSS only, for readers who have not asked for less motion)
├── situation.types.ts  what a game's situation is: hockey's skaters and shootout, baseball's bases, outs and count, football's down, distance and drives
├── situation.ts        a situation read from the options (which team attacks, which end, what is lit) and its words
├── situation.widgets.ts the pill, the scorebug, the down-and-distance tag and the shootout strip, each upright in a frame of its own
├── situation.draw.ts   a situation drawn on a surface (the tinted zone, the lit bases, the line of scrimmage, the drive chart) and in the badge
├── situation.style.ts  the situation's colours, light and dark
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
├── athletics.style.ts  the athletics stadium's rules and the track looks: red, blue, terracotta and green, the lanes' lines, the infield's mowing
├── athletics-entry.ts  the athletics entry (`@johnmorrisdotca/kyogijo-stadiums/athletics`): the plan, the track's geometry, the events and the charts
├── skating.style.ts    the skating rinks' colours: the ice, the floor, the warm-up lane, the padding, the furniture and the blue and red lines
├── skating-entry.ts    the skating entry (`@johnmorrisdotca/kyogijo-stadiums/skating`): the plan, the track's geometry, the races and the charts
├── skating/
│   ├── types.ts        the disciplines, the races, the furniture and the options
│   ├── events.ts       the races and the kinds of element of a programme, with their names in three languages
│   ├── track.ts        the long track: its radii and straight from a lap of 400 m, a skater's way round it, the start of a race
│   ├── parts.ts        what a part adds (areas and shapes), the stadium's path, the blocks of a curve as dots
│   ├── long.ts         the long track's ice, lanes, blocks, coaches' area, finishing lines and the starting lines of each race
│   ├── short.ts        the short track's oval, blocks, tracks, starting lines and starting positions
│   ├── figure.ts       the figure skating rink with its boards and furniture
│   ├── plan.ts         the plan a set of options asks for, with the ranges
│   └── describe.ts     the sentences that describe a rink
├── budo.style.ts       the budō surfaces' rules (the mats in three tones, the heri, the floor, the clay, the straw, the tape) in the sheet's properties, and the colours of each look in light and dark
├── budo.score.ts       what a judo, karate or kendo side has scored, as its sport counts it: the total and the cleaned numbers a board draws
├── budo.board.ts       the budō scoreboards: judo's waza-ari, yuko and shido, karate's warnings and senshu, kendo's techniques, sumo's kimarite
├── budo-entry.ts       the budō entry (`@johnmorrisdotca/kyogijo-stadiums/budo`): the plans, the dojo builder, the tatami layout, the kimarite, the looks and the halls
├── halls.ts            the five famous halls of the budō, with only the facts a source gives and what each surface offers
├── budo/
│   ├── types.ts        the options of a budō drawing, the score of a side, and the dojo spec
│   ├── parts.ts        what a part of a plan adds (areas and shapes), and the boxes a plan is laid out with
│   ├── kit.ts          the small pieces plans are made of: a painted box, a tape, a ring, a size held to its range
│   ├── tatami.ts       mats as real units: the traditional lay in which no four corners meet, cutting where a colour changes, the heri, the seams and the count in jō
│   ├── judo.ts         a judo competition area: contest and safety areas, the common safe zone, the free zone, the platform, the tape and the technical table
│   ├── karate.ts       a karate competition area: the matted square, its boundary band, the safety area, the start mats, the referee and the judges
│   ├── kendo.ts        a kendo shiai-jo: the floor and its boards, the boundary lines, the cross, the kaishi-sen and the space outside
│   ├── sumo.ts         a sumo dohyō: the clay, the 20 tawara, the jano-me, the shikiri-sen and the four tassels
│   ├── kyudo.ts        a kyūdōjō: the shajō with its shooting positions and honza, the yamichi, the azuchi with its targets, the path for the arrows
│   ├── mat.ts          a wrestling mat: the circle and the matted area, the passivity band, the circles in the middle, the starting lines, the platform
│   ├── ring.ts         a ring: the platform and its steps, the canvas, the ropes and their extensions, the four posts with their pads in the corner colours
│   ├── cage.ts         an MMA cage: the platform and its steps, the canvas, the eight-sided fence with its gates, the padded posts
│   ├── room.ts         the room round a budō surface as data: walls, surround, dais, banner, balconies, doors and windows, for a 3D view to raise
│   ├── dojo.ts         the dojo builder's layout: the floor in jō, metres or mats, the lay, the walls, doors, windows, shrine and kamiza
│   ├── dojo.api.ts     `dojo()` and `drawDojo()`: the floor as data, and drawn
│   ├── plan.ts         the plan a set of options asks for, with the ranges, and the Budokan's octagonal arena floor
│   ├── looks.ts        the colours of the budō looks, light and dark
│   ├── kimarite.ts     the 82 winning techniques of sumo, the five non-techniques and the two other results
│   └── describe.ts     the sentences that describe a budō surface and its score
├── athletics/
│   ├── types.ts        the options, the races and the field events
│   ├── events.ts       the races and the field events, with their names in three languages
│   ├── track.ts        the oval: the lane radii, the poses along a running line, the staggers and the breakline
│   ├── oval.ts         the oval's outline, its lane lines, the finish straight and the covered track's straight
│   ├── races.ts        each race's marks: the starts, the curved lines, the zones, the hurdles and the lane numbers
│   ├── steeplechase.ts the steeplechase lap with the water jump inside or outside, and its hurdles
│   ├── facilities.ts   the field events' facilities: circles, cages, sectors, runways, pits and the high jump fan
│   ├── infield.ts      where the Marking Plan puts each facility in the stadium
│   ├── layout.ts       one field event alone at a large scale
│   ├── plan.ts         the plan a set of options asks for, with the ranges
│   ├── stencil.ts      the lane numbers as stroked paths, with no font
│   └── describe.ts     the sentences that describe a track
├── fields/
│   ├── lacrosse.ts     the lacrosse plans: the box floor and the fields of World Lacrosse, the NCAA and the PLL
│   ├── rugby.ts        the rugby plans: union's dash lines and league's lines every 10 metres
│   ├── afl.ts          the Australian football ground: the oval cut at the goal lines, the goal squares and the Fifty Metre Arcs
│   ├── gaelic.ts       the Gaelic games' field: the lines across, the rectangles, the arcs
│   ├── cricket.ts      the cricket ground: the boundary, the circle, the pitch and its creases
│   ├── fieldhockey.ts  the field hockey pitch: the circles, the broken lines, the marks outside
│   └── handball.ts     the handball court: the goal areas, the free-throw line, the small lines
├── sheet.ts            the curling sheet a set of options asks for, held to the rules' range
├── pool.ts             the pool a set of options asks for (swimming, water polo, diving, artistic swimming): the lanes and ropes, the boards, the area, the hall of several pools
├── pool.figures.ts     the pools' figures in metres, each with its rule in World Aquatics' Competition Regulations
├── pool.types.ts       the options of a pool: the look, the race and its swimmers, the section, the venue
├── pool.race.ts        a race read and checked: times, places, splits and pace
├── pool.kit.ts         what every pool is painted with: the light on the water, the tiles, the floats of a rope
├── pool.labels.ts      a race on the pool: the plates of names, flags and results, the medals and the pace bars
├── pool.section.ts     the side section of a swimming pool
├── pool.style.ts       the pools' colours and rules, light and dark, only what a drawing uses
├── pool.words.ts       what a pool says of itself in the description
├── pool.replay.ts      a race replay by lane: the splits as swimmers going down their lanes and back
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
│   ├── athletics.ts    the athletics stadium and its close-ups of a start or the finish
│   ├── skating.ts      the skating rink: the ice, the lines and the furniture
│   ├── budo.ts         the budō surfaces lying wide: the floor and the mats, the heri and the seams, the walls, the clay, the targets
│   ├── curling.ts      the curling sheet
│   ├── curling.fold.ts the folded sheet: the whole sheet as a strip, its two houses enlarged beside it, the fan that joins them and their labels
│   ├── pool.ts         the swimming pool, lying wide: the ropes, floor markings, blocks, panels, flags and rope, the race on it
│   ├── polo.ts         the water polo field: the ropes and platforms, the lines, the goals, the re-entry areas
│   ├── dive.ts         the diving well seen from above: the springboards and platforms at the distances of Appendix 2
│   ├── artistic.ts     the artistic swimming area: the floor lines, the deep part, the platforms
│   ├── venue.ts        several pools in one hall, to scale
│   ├── net.ts          the court of every net, racket and court sport: the ground, the walls, the lines, the rings, the net, the board's place
│   ├── field.ts        a field sport's surface, drawn from its plan
│   ├── soccer-spec.ts  the Laws' figures, the presets, futsal and the small-sided pitches
│   └── soccer-providers.ts  the data providers' coordinates, registered as frames, and rescale
├── multi-entry.ts      the tournament layouts entry (`@johnmorrisdotca/kyogijo-stadiums/multi`): `drawMulti`, `multiLayout`, `multiFit`, `multiTable`, `mountMultiTurn`, the presets, the halls and the sources
├── multi.types.ts      what a layout, a preset, a hall, a fit and the options are
├── multi.data.ts       the presets (each with its rule, its event and its sources), the halls whose floors are published, and the documents the figures were read from
├── multi.ts            a layout laid out: where each surface stands, the floor it needs, the empty places, and whether it fits a hall
├── multi.draw.ts       a layout drawn: each surface by `drawKyogijo`, moved to its place, with the floor, the barriers, the scoreboard, the boards, the places, and the hall and stadium round it (or, for the 3D view, the floor alone)
├── multi.turn.ts       a layout in 3D: each surface as it stands on its own page, moved to its cell, with the table tops, the surrounds, the chairs and score tables, the scoreboards and the stands of the stadium, as a `TurnModel` for the 3D view; `mountMultiTurn`
├── multi.style.ts      the layout's rules, light and dark: the floors' colours, the barriers, the boards, the empty places and the colour of a layout that does not fit
├── multi.words.ts      the words of a layout in English and Japanese
├── judging-entry.ts    the judging assignments entry (`@johnmorrisdotca/kyogijo-stadiums/judging`): `drawJudging`, `judgingChart`, `judgingTable`, `judgingBoard`, `mountJudgingTurn`, `mountJudgingBroadcast`, `judgingPrint`, the seats and the words
├── judging.types.ts    what an assignment, a mat, an official and a seat are
├── judging.data.ts     the seats of each style (a kata area's five judges, the central one in the middle) and the sources they are read from
├── judging.ts          an assignment worked out: the options held to what they may be, each official put in a seat, and where the seats are on the judo plan
├── judging.fit.ts      a name and an ID set in a box without cutting either: the biggest size that fits, wrapped at its spaces, and the chart's rows that grow
├── judging.card.ts     the name card of a seat and the badge of its number, as markup for the plan and for the 3D view
├── judging.plan.ts     the plan of a mat as both views draw it: the judo area clipped to what is shown, a badge or a card at every seat, and the sizes a picture is laid out in
├── judging.text.ts     what a judging picture says in words: its title and description
├── judging.draw.ts     an assignment drawn: each mat's judo area with a badge or a card at every seat and the chart of seat, name and ID; `judgingTable`, the text alternative
├── judging.board.ts    the officials' board of the broadcast view, the score panel's look for officials: seat badges, names on chips, IDs, the mat's name and its style; `judgingBoard`
├── judging.broadcast.ts the broadcast picture: the mat large, 16:9, with the board at its side and never over the contest area
├── judging.mount.ts    the broadcast view in a page: the 3D view of the mat with the board laid over it; `mountJudgingBroadcast`
├── judging.print.ts    an assignment on paper: one mat to a page, A4 or US letter, the plan-and-chart layout; `judgingPrint`
├── judging.turn.ts     an assignment in 3D: the judges' table and chairs, a name card on the table, the mat's name on a sign, as a `TurnModel` for the 3D view; `mountJudgingTurn`
├── judging.style.ts    the rules of an assignment, light and dark: the ground, the chart's rows, the badges and the cards
├── judging.words.ts    the words of an assignment in English and Japanese
├── layout.ts           drawGrid: many drawings in one SVG, with a title, a subtitle, a key and a credit line, in a size for a card or a phone
├── layout.style.ts     the grid's rules: the ground colour and the ink of its words, light and dark
├── layouts-entry.ts    the layouts' entry
├── background.ts       the ground behind a drawing or a grid: SVG patterns, a colour and a photograph at an opacity
├── hardwood.ts         the realistic basketball floor (`court.hardwood`): its options, the boards laid from a seed as two pattern tiles, and its rules
├── crowd.ts            the stands round a surface as data (`crowd`): the options, each sport's venue, the rings with their outlines, heights and rake, the visitors' blocks and the places left open
├── crowd.park.ts       a ballpark's stands, laid from the park's own wall outline: the grandstands along the foul lines and the bleachers behind the fence
├── crowd.draw.ts       the stands and the people as SVG: tiles of heads and shoulders, seeded, empty seats, aisles, shade, and the rules
├── layers.ts           data layers: drawLayers, layerTable and the marks
├── layers.marks.ts     the shapes, curves, waves, heads and colour ramps of the marks
├── layers.types.ts     the types of a layer
├── layers.env.ts       what the layers share
├── heat.ts             the heat layers
├── heat.stats.ts       bins, density, contours
├── heat.colour.ts      the colour ramps
├── heat.zones.ts       the sports' zones
├── heat.types.ts       the heat layers' types
├── team.layers.ts      the team layers: one function that draws any of the eight kinds and one that lists their tables
├── team.network.ts     the pass network: nodes, links, touches
├── team.shape.ts       Voronoi cells, Delaunay triangles and convex hulls of a team's players
├── team.formation.ts   a formation drawn on a surface, with a lineup on it
├── team.lineup.ts      the lineup layer: a team placed by position code, as discs or jerseys with number, name, captain and flag
├── lineup.codes.ts     the short position codes of each sport and how a lineup finds each player's place
├── team.motion.ts      flow fields and sonars of movements
├── team.common.ts      what the team layers share: teams, classes, tables, grouping
├── team.geometry.ts    convex hull, Delaunay triangulation (Bowyer and Watson) and Voronoi cells, from the textbook
├── team.types.ts       the team layers' types
├── formations.ts       the named formations and the names of their positions
├── formations.sports.ts the formations of rugby, Australian football, cricket, volleyball, handball, water polo, field hockey and netball, softball, hockey's second line and a traditional basketball set
├── layers-entry.ts     the layers' entry
├── charts.ts           ready-made charts and what they share
├── charts.baseball.ts  the spray chart
├── charts.soccer.ts    the soccer shot map and goal mouth
├── charts.curling.ts   the curling stones chart and the score of an end
├── charts.curling.heat.ts  the curling heat chart: where the stones of many ends came to rest, as cells, hexagons, a density, zones or discs
├── curling.stats.ts    curling's statistics: the free guards, the stones in play, the ends (hammer, steals, forced ends) and the shots
├── charts.pool.ts      the splits of a swimming race as pace bars in the lanes, with a table
├── charts.athletics.ts the lane draw, the results, the race replay and the marks of throws and jumps
├── charts.skating.ts   the pairs, the starting positions, the results, the replay and the elements of a programme
├── charts.network.ts   the pass network chart
├── charts.types.ts     the charts' types
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
│   ├── athletics.ts    the World Athletics tracks and their stagger tables
│   ├── skating.ts      the ISU's long track, short track and figure skating rink
│   ├── budo.ts         the IJF's, the AJJF's, the WKF's, the FIK's, the Japan Sumo Association's and the ANKF's figures, and the tatami standards
│   ├── combat.ts       the combat sports' figures: the MMA cage's, the boxing ring's and the wrestling mats'
│   ├── football.ts     the fields
│   └── baseball.ts     the diamonds
├── geometry-entry.ts   the geometry's entry
├── units.ts            the units of length, each surface's own, and the converters
├── frames.ts           coordinate frames: the mapper, the registry, toSurface and fromSurface
├── frames.providers.ts the NHL, HockeyTech, NBA, NFL, MLBAM, Retrosheet, curling, net sports and field sports frames
├── frames-entry.ts     the frames' entry
├── rules.ts            the rules engine: zoneAt, the yes-or-no questions, home runs from a park's fence and wall
├── rules.types.ts      the ids of the zones the rules engine names
├── zones-entry.ts      the zones' entry
├── field.data.ts       what a drawing writes on its surface group for the pointer (the box and the rules' options)
├── pointer.ts          a click as a place on the field: clientPointToField, fieldPointToClient, clientPointToFrames
├── pointer-entry.ts    the pointer's entry
├── target.ts           the goals, the strike zone and the stumps seen end-on, with their zones and marks
├── target-entry.ts     the targets' entry
├── names.ts            the names of a place: the aliases, the lookup by any name and the official name
├── parks.ts            the ballparks, their fences, walls, quirks, names and their sources
├── ballpark.ts         what a drawing asks of a park's walls and quirks (`walls`, `quirks`), and the words that name them
├── parks.data.ts       made by scripts/build-parks.mjs from scripts/parks.data.json
├── parks-entry.ts      the parks' entry
├── grounds.ts          the soccer grounds
├── grounds.data.ts     made by scripts/build-grounds.mjs
├── grounds-entry.ts    the grounds' entry
├── arenas.ts           the hockey and basketball arenas: their names, seats and the rink or court sizes the sources publish
├── arenas.data.ts      made by scripts/build-arenas.mjs from scripts/arenas.data.json
├── arenas-entry.ts     the arenas' entry
├── atlas.ts            every park, ground and arena with its place, its tenants and the surfaces it offers, and the filters
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
├── colour.ts           safe colours and picture addresses
├── logo.ts             the one path a logo, flag, mark or emblem takes into a drawing: an address, a data address, an SVG document or, with a renderer plugged in, an emblem's id
├── emblems-source.ts   the plug-in for emblems (`useEmblems`, `emblems`): the renderer in use, what an id looks like and nothing of any emblem's art, which is Dougu Sports'
├── flags-source.ts     the plug-in for country flags (`useFlags`, `flags`): the renderer in use, what a country code looks like and nothing of any flag's art, which is Hata's
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
├── uprights.pools.ts   the pools' starting blocks, flags and false start rope, springboards and platforms, water polo goals, judges' and starting platforms
├── uprights.track.ts   an athletics stadium's hurdles, steeplechase barriers, jumps' uprights and bars and cage; a skating rink's padding and boards
├── uprights.budo.ts    the dohyō's clay mound, a kyūdōjō's azuchi and its tilted targets, a dojo's walls
├── uprights.ring.ts    a ring in 3D: the platform as a solid block, the steps, the posts in the corner colours, the ropes and their ties
├── uprights.cage.ts    an MMA cage in 3D: the platform as a solid block, the steps, the padded posts, the fence in mesh with its gates
├── uprights.rinks.ts   the hockey rink's boards and glass and goals, the basketball court's baskets and stanchions
├── uprights.board.ts   the score stood up: its badge on a board that faces the eye, hung over the middle of a court or a rink and standing behind an end of a field
├── venue.ts            the stands raised: every ring of `crowdStands()` a strip of raked planes with the crowd's pattern, the walks, the low walls, a ballpark's wall seats, the roof
├── venue.geom.ts       what the venue is cut with: a ring sampled into quads, polygons clipped to the places left open, a planar polygon as one plane
├── venue.room.ts       a dojo's room raised from `dojoRoom()`: walls with doors and windows, dais, banner, shrine, balconies, the edge of the mats
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
