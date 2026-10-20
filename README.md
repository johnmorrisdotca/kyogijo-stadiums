<h1 align="center">Kyogijo Stadiums <sub>競技場</sub></h1>

<p align="center"><strong>Sports surfaces as SVG, drawn to scale, with the score on them.</strong><br>
The NFL, CFL and IFAF football fields, the NHL rink, the NBA court, the soccer pitch and futsal court, the baseball field of every MLB ballpark, current and past, and every NPB home park, the rink and court of 167 NHL, NBA, WNBA and PWHL arenas, and the surfaces of curling, athletics, speed, short track and figure skating, swimming, water polo, diving, artistic swimming, tennis, volleyball (indoor, beach and sitting), badminton, pickleball, table tennis, padel, squash, racquetball, sepak takraw, teqball, roundnet, netball, lacrosse, rugby, Australian football, Gaelic games, cricket, field hockey, handball, judo, karate, kendo, sumo, kyūdō and a dojo of tatami, thirty-nine sports in all, each drawn from its rulebook or its published distances, with each team's name and logo on its side and the score in the middle, a lineup and the situation of the game on them, with stands and a crowd, a pageant of flags and a 3D view. Wide or tall, light or dark, a badge for a list, a helper for React, a custom element and a frame for a page that runs no script. One function, no dependencies.</p>

<p align="center">
  <a href="https://github.com/johnmorrisdotca/kyogijo-stadiums/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/johnmorrisdotca/kyogijo-stadiums/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@johnmorrisdotca/kyogijo-stadiums"><img alt="npm" src="https://img.shields.io/npm/v/@johnmorrisdotca/kyogijo-stadiums?color=2f5d4a"></a>
  <a href="./LICENSE"><img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-2f5d4a"></a>
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-2f5d4a">
  <img alt="TypeScript" src="https://img.shields.io/badge/types-TypeScript-3178c6">
</p>

<p align="center"><a href="https://johnmorrisdotca.github.io/kyogijo-stadiums/"><strong>Open the demo →</strong></a> · <a href="https://johnmorrisdotca.github.io/kyogijo-stadiums/docs/">Documentation</a> · <a href="https://johnmorrisdotca.github.io/kyogijo-stadiums/docs/gallery.html">Gallery</a> · <a href="./docs/compare.md">How it compares</a> · <a href="https://johnmorrisdotca.github.io/kyogijo-stadiums/api.html">API reference</a></p>

> **Renamed.** Previously `@johnmorrisdotca/kyogijo`; renamed in 0.4.0 to `@johnmorrisdotca/kyogijo-stadiums`. The product is still Kyogijo Stadiums (競技場); only the package and the repository names changed. See the [changelog](./CHANGELOG.md).

<table align="center">
<tr>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/hero-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/hero-desk-light.webp" alt="The demo on a desk, in English: the heading Kyogijo Stadiums with the language chooser, the Docs and API reference links, five cloth patches and the Help switch, and an NHL rink drawn wide on an ice-blue background of faint skate marks and rink lines, with a made-up game on it, the USA and its flag on the left, Canada and its flag on the right, and a panel of the score 3 to 2, Final/OT, in the middle. The controls on the right list the sports, from the NFL and the NHL to handball, and then the layout and the teams." width="640">
</picture>
<br><em>The demo on a desk: a rink, with the teams on their sides and the score in the middle.</em>
</td>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/hero-phone-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/hero-phone-light.webp" alt="The demo on a phone: the heading Kyogijo Stadiums over the page's controls, and under them, on a background of floodlight beams, a football field turned a quarter to stand tall, Mexico's green end zone at the top and the USA's navy end zone at the bottom, each with its flag and name written across it, the yard numbers upright, and a score panel at midfield reading 27 to 24, Final." width="240">
</picture>
<br><em>On a phone the same surface stands tall, the words still upright.</em>
</td>
</tr>
</table>

Kyogijo Stadiums draws the places a game is played on, and puts a game on them. It was made to show the score of a game or a championship on the surface it was played on: the teams at their ends, the score in the middle, a label for what it was. The surfaces are drawn to scale from the rulebooks, so that a football field has its hash marks where the rules put them and a ballpark has its fence where its published distances put it.

## In 30 seconds

```sh
npm install @johnmorrisdotca/kyogijo-stadiums
```

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({
  sport: "nhl",
  away: { name: "USA", abbr: "USA", score: 3, color: "#1c3f7a" },
  home: { name: "Canada", abbr: "CAN", score: 2, color: "#d52b1e" },
  status: "final-ot",
  competition: "Cup Final, Game 7",
});
console.log(svg.startsWith("<svg"), svg.includes("USA 3, Canada 2"));
// true true
```

`svg` is a string of SVG: put it in a page with `innerHTML`, write it to a file, or send it in an email. With no build step at all:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo-stadiums@0/dist/element-define.js"></script>
<kyogijo-field sport="nhl" orientation="auto" away="USA" home="Canada" away-score="3" home-score="2" status="final-ot"></kyogijo-field>
```

## Who it is for

- **A results page or a stats site** that has the score of a game and wants a picture of where it was played: the teams, the score, the round and the date, with the winner clear.
- **A list of games** that needs a compact strip for each, small enough for a phone.
- **Anyone drawing a rink, a field, a court or a ballpark** for a poster, a diagram or a lesson, who wants the dimensions right and the colours their own.
- **A site that uses a framework or none**: the drawing is a string, so it works from a server, a build step, a framework, a custom element or a frame.

## Features

- **Thirty-nine surfaces, to scale.** The NFL, CFL and IFAF fields, the NHL rink, the NBA court, the soccer pitch and futsal court, the baseball field, the curling sheet, the courts of twelve net and racket sports, the pools, the athletics stadium, the skating rinks, the fields of seven field sports, and the budō. Every figure is cited in [sources](./docs/sources.md). [The surfaces](./docs/surfaces.md).
- **Each league's rulebook.** `league: "fiba"` draws a court as FIBA marks it: 48 variants, from the WNBA, the NCAA and the IIHF to Little League, PONY, softball, Curling Canada, FIVB's beach volleyball, rugby league and the NLL's box lacrosse, each cited. [League variants](./docs/variants.md).
- **A realistic basketball floor.** `court: { hardwood: true }` draws maple boards that run the length of the court with staggered ends, grain, stained keys, the baskets and stanchions with soft shadows, a coaching box and benches, and a satin sheen, in every league and renderer. The clean floor stays the default. [Hardwood](./docs/hardwood.md).
- **The stands and the crowd.** `crowd: true` draws the seating round any surface that has spectators: a bowl, two sides, a horseshoe, courtside rows or a ballpark's grandstands, with the people as seeded heads and shoulders in the home colours, the visitors at an end and the empty seats showing (`density`, or `attendance` over `capacity`). Blocks at small sizes. [The crowd](./docs/crowd.md).
- **Curling, from the rule books.** A sheet from World Curling's and Curling Canada's rules, tall by default, with the board and the hammer in a score, `curlingStones` for the stones of an end, scored by the rules, `show: "folded"` for the whole sheet with both houses enlarged beside it, and a heat map and statistics for many ends. [Curling](./docs/curling.md).
- **Net, racket and court sports, from their rulebooks.** The ITF's, FIVB's (indoor, beach, sitting), BWF's, USA Pickleball's and ITTF's courts and table, the padel, squash, racquetball, sepak takraw, teqball, roundnet and netball courts, each in its look (hard court, clay, grass, wood, sand), with a board of sets and games. [Net, racket and court sports](./docs/courts.md).
- **Swimming, water polo, diving and artistic swimming, from World Aquatics' regulations.** The competition pool of 50 or 25 m with its lanes, ropes, blocks, touch panels and flags; the water polo field; the diving well with its springboards and platforms; the artistic swimming area; several pools in a natatorium. A race's lanes carry names, flags, places, times and splits, with a replay (`raceTimeline`) and a `splitsChart`. [Pools](./docs/pools.md).
- **Lacrosse, rugby, Australian football, Gaelic games, cricket, field hockey and handball, from their rulebooks.** The fields and floors of World Lacrosse, World Rugby, the NRL, the AFL, the GAA, the FIH and the IHF, and a cricket ground with a boundary of your own. A score is goals and behinds, goals and points or a board of runs, wickets and overs. [Field sports](./docs/field-sports.md).
- **The athletics stadium, from World Athletics' rules.** The 400 m track with its lanes and staggers worked out from the running lines, curved and relay starts, hurdles, the steeplechase, every field event, a close-up of each start, the covered 200 m track, and lane draws, results, a race replay and the marks of throws and jumps. [The athletics stadium](./docs/athletics.md).
- **The skating rinks, from the ISU's rules.** The 400 m speed skating track with its lanes, blocks and the starting and finishing lines of every race worked out lane by lane; the short track's oval of 111.12 m; the figure skating rink of 60 by 30 m with its judges' seats; and pairs, results, a race replay and the elements of a programme on the ice. [The skating rinks](./docs/skating.md).
- **The budō, from the federations' rules.** The IJF's and the All Japan Judo Federation's judo areas, the WKF's karate areas, the kendo shiai-jo, the sumo dohyō, the kyūdōjō, and **a dojo builder**: a floor of tatami laid as real units (no four corners meet), in jō or metres, with the walls, doors, windows, shrine and kamiza. Five famous halls are on the atlas, and the scores are judo's ippon, waza-ari and shido, karate's and kendo's points and sumo's kimarite. [The budō](./docs/budo.md).
- **Soccer, to the Laws.** A pitch from Law 1 of the IFAB Laws of the Game of any size, with presets (international, UEFA, MLS, NCAA, the FA's 9-, 7- and 5-a-side, FIFA's futsal), half pitches, five mowing patterns, four goal styles, penalties and extra time in a score. [Soccer](./docs/soccer.md).
- **Every ballpark.** The 30 current MLB parks and 44 that MLB clubs have left (the Polo Grounds, Ebbets Field, the Astrodome and more), and the 12 home parks of Nippon Professional Baseball with eight other NPB grounds, each with its fence drawn from the distances published for it; a past park whose fence moved is drawn as it stood in a season. [Ballparks](./docs/ballparks.md).
- **Soccer grounds, arenas and an atlas.** 64 soccer grounds, each pitch at its published size, and 167 NHL, NBA, WNBA and PWHL arenas (`drawKyogijo({ sport: "nhl", arena: "boston-garden" })`), and every park, ground, arena and budō hall (330 places) on a map, by sport, league, country and year, each found by any of its names. [The grounds](./docs/grounds.md), [the arenas](./docs/arenas.md), [the atlas](./docs/atlas.md), [names](./docs/ballparks.md#names).
- **Walls and quirks.** How high the fence stands, stretch by stretch and season by season (the Green Monster at 37 feet 2 inches), drawn as a band outside the fence whose width and shade say the height, with a key (`walls`); and Tal's Hill, Wrigley Field's ivy and basket, poles, bullpens and dugouts (`quirks`), each from the park's article, none guessed: [ballparks](./docs/ballparks.md).
- **Special games.** A surface set inside another, to scale: an NHL rink on a ballpark's infield or a football stadium's field, a college basketball court on the deck of a carrier, a baseball field laid over a London stadium's pitch. 18 games, each with its day, its venue and its sources. [Special games](./docs/special-games.md).
- **Surfaces through the years.** `year: 1975` draws a surface as its league's rules marked it that season, each change cited. [Surfaces through the years](./docs/eras.md).
- **Score mode.** Each team's name and logo on its side (the end zones, the ends of the ice, the halves of the court, the dugouts) and the score large in the middle, with the competition, the status and the date, and the winner emphasised; a flag or a crest can be round, in a circle with a ring (`markShape: "round"`). [Score and layout](./docs/score.md#round-marks).
- **The situation of a game.** `situation` draws what is happening: hockey's power play or empty net and a shootout; baseball's runners lit on the diamond with a scorebug; football's line of scrimmage, first-down line, red zone and down-and-distance tag, with a drive chart; in the badge and the compact card too. [The situation](./docs/situation.md).
- **Lineups.** A `lineup` layer places a team's players by position code (`GK`, `CB`, `HK`, `C`) with no coordinates: it reads where each stands from a formation (36 of them, in 13 sports), draws a disc or a jersey with the shirt number and the name under it, a captain's C and a flag, and puts the visitors at the other end. [Lineups](./docs/team-shape.md#lineups).
- **A pageant.** Each team's flag or crest laid large over its half of the surface: `pageant: "carpet"` (a flag at its own ratio with a border) or `"stage"` (a crest on a round disc with a gold ring), an emblem or a trophy in the centre circle, the score in the middle or in the strip, with an entrance in CSS for readers who have not asked for less motion. [The pageant](./docs/pageant.md).
- **Trophies, medals, balls and crests, by id.** `useEmblems(renderEmblem)` plugs in the sister package [Dougu Sports](https://johnmorrisdotca.github.io/dougu-sports/) in one line, and an id goes wherever a logo, a flag or a mark is taken: `logo: "crest:shield"`, `pageant: { emblem: "trophy:hockey-cup" }`, `"ball:puck"`. Kyogijo bundles no emblem and keeps zero dependencies. [Emblems](./docs/emblems.md).
- **Country flags, by code.** `useFlags(render)` plugs in the sister package [Hata](https://github.com/johnmorrisdotca/hata) through a small adapter, and a team's `flag: "CA"` is its flag: round in a round mark, at its own proportions on a banner, a badge or a carpet. The same adapter serves [Taisen Brackets](https://github.com/johnmorrisdotca/taisen-brackets). Kyogijo bundles no flag and keeps zero dependencies. [Flags](./docs/flags.md).
- **Zoom to a part of a surface.** `range: "offensive-zone"` crops a drawing to a rink's zone, a half court, the paint, the red zone, a soccer half, third or penalty area, the infield, a curling house, or a box of your own in any frame, with its data, heat, labels and score following. [Display ranges](./docs/ranges.md).
- **Wide, tall or fit the box.** Every surface lies wide or tall: tall turns it a quarter, keeps every word upright and puts the teams top and bottom. With `orientation: "auto"` the browser helpers follow the box.
- **Where a point lies, by the rules, and a click as a place.** `zoneAt("nhl", [69, 22], { frame: "nhl-api" })` names the zone and the area in it from the surface's own figures, with `isThreePointer`, `inSlot`, `isFair`, `isHomeRun` and the like; `clientPointToField(svg, x, y, { provider })` is a pointer's place in any of the frames, with the zone. `marks: true` writes `data-mark-id` and `data-zone` on every mark of a layer. [Zones](./docs/zones.md), [pointing](./docs/pointer.md).
- **Goals, the strike zone and the stumps, end-on.** A goal mouth for hockey, soccer, handball, water polo, lacrosse and field hockey with the shots laid on it and its zones (the top shelf, the five-hole, the corners), the catcher's view of the strike zone with its pitches numbered, and the wicket from the bowler's end with its line and length zones. [Targets](./docs/targets.md).
- **Data on the surface.** Points, lines, arrows, text, heat maps, hexagons, zone charts and density contours over any surface, in its feet or a data provider's frame, cut to its outline, with a table for each layer; ready-made shot and pass charts. [Data layers](./docs/layers.md), [charts](./docs/charts.md).
- **Small multiples and backgrounds.** `drawGrid` puts many drawings in one SVG, under a title and a subtitle, over a credit line, with a key they share, in a size for a social card, a square post or a phone; `background` lays a quiet pattern (felt, grass, wood, ice, paper, a grid, dots) or a photograph behind a drawing or a grid. [Layouts and backgrounds](./docs/layouts.md).
- **Tournament layouts.** Several surfaces laid out together for one large event, to scale, on one floor, as one SVG: thirteen presets from table tennis, pickleball, curling, judo, karate, badminton and tennis, each with its rule and sources, whether it fits a hall, and a real stadium round it. [Tournament layouts](./docs/multi.md).
- **Replay.** Tracking data played on any surface: the players with their numbers, the ball and its trail, and the passes, shots and goals as they happen, with controls, the keyboard and a live region, steps for a reader who prefers reduced motion, and a pause when the page is hidden. [Replay](./docs/replay.md).
- **A 3D view.** Any surface as a floor that turns by mouse, touch, wheel or keys, with four viewpoints (overhead, broadcast, end-on, low corner), and what the rulebook stands on it at its height (nets, baskets, rink boards and glass, goals, a ballpark's fence, the walls of padel and squash, a pool's blocks, a table tennis area's surrounds); and the venue round it (raked stands, roofs on request, a dojo's walls and gallery). Plain DOM and CSS over the same SVG. [The 3D view](./docs/turn.md).
- **Renderers.** The same drawing as plain data (a scene), on a canvas (a browser's or a Node canvas), in a d3 selection, as a mark of an Observable Plot, as GeoJSON and as a PNG in Node, each an entry of its own that imports nothing from outside the package. [Renderers](./docs/renderers.md).
- **Units and frames.** Each surface in its rulebook's unit and any other, and 48 coordinate frames (ten soccer providers, the NHL API, HockeyTech, NBA stats, NFL tracking, MLBAM, Retrosheet, and a place from the net, the centre or the middle of the water of each other surface) to move a provider's points onto a surface. [Units](./docs/units.md), [coordinate frames](./docs/frames.md).
- **A compact badge and a compact card.** One strip for a list, or the surface with that strip under it.
- **Light and dark**, by the device or the page, and every colour a custom property; eight named looks, colours by feature, line widths and dashes, goal styles and mowing patterns, and arrows, axes and labels for teaching. [Theming](./docs/theming.md), [annotations](./docs/annotations.md).
- **Accessible.** Each drawing is an `img` with a title and a description that say the surface and the result, in English or Japanese. [Accessibility](./docs/accessibility.md).
- **Four ways in.** A function that returns SVG text; a helper that draws into a container; a standard custom element; a frame for pages that run no script. A React helper that does not import React.
- **No dependencies**, no network requests, nothing stored. Text, colours and logo addresses that come from outside are made safe before they are drawn.
- **A docs site.** Guides, a search over every page, a gallery that draws every picture from the code beside it, and [how it compares](./docs/compare.md) with the other packages: [the documentation](./docs/README.md).

### What's in it

| Part | What it is |
| --- | --- |
| `drawKyogijo`, `drawSurface`, `drawScore`, `drawBadge` | The drawing, as a string of SVG. |
| `SPORTS`, `PARKS`, `PARK_IDS`, `COURT_THEMES` | The thirty-nine sports, the 94 ballparks, the court looks. |
| `SOCCER_PITCHES`, `SOCCER_PROVIDERS`, `rescale`, `soccerSpec` | The soccer pitches, the data providers' coordinate systems and the map between them. |
| `GROUNDS`, `groundById` | The 64 soccer grounds, each pitch at its own size. |
| `EVENTS`, `eventOptions` | The 18 special games: a rink in a ballpark, a court on a carrier's deck, with `host` and `placement` in the options. |
| `./zones`, `./pointer`, `./target` | Where a point lies by a sport's own rules, and the yes-or-no questions; a click on a drawing as a place in a provider's numbers; a goal, the strike zone or the stumps seen end-on. |
| `./geometry`, `./frames`, `./layers`, `./charts`, `./replay` | The dimensions in any unit; the providers' frames; data layers; ready-made charts; tracking data played on a surface. |
| `./athletics` | The athletics stadium: the plan, the track's geometry (the stagger of any lane), the races and field events, and the lane draw, results, race replay and field marks charts. |
| `./budo` | The budō: the judo and karate areas, the kendo shiai-jo, the sumo dohyō, the kyūdōjō and the dojo builder (`dojo`, `drawDojo`), the plans, the tatami layout, the 82 kimarite, the looks and the five halls. |
| `./skating` | The skating rinks: the plan, the long track's geometry (a skater's way round it, the start of a race), the races, and the pairs, starting positions, results, race replay and programme elements charts. |
| `./parks`, `./grounds`, `./arenas`, `./atlas`, `./eras`, `./leagues`, `./events` | The ballparks, the grounds, the arenas, every place, the markings of a season, each league's rulebook, the special games. |
| `./turn` | A surface as a 3D view that turns, with the net, basket, goal or posts standing on it. |
| `./scene`, `./canvas`, `./d3`, `./plot`, `./geojson`, `./png` | The drawing as data; on a canvas; in a d3 selection; as an Observable Plot mark; as GeoJSON; as a PNG (the optional peer `@resvg/resvg-js`). |
| `./multi` | `drawMulti`, `multiFit`: several surfaces laid out for one event, in a hall ([docs](./docs/multi.md), [demo](https://johnmorrisdotca.github.io/kyogijo-stadiums/halls.html)). |
| `./layouts` | `drawGrid` and `GRID_PRESETS`: small multiples with a title, a subtitle, a key and a credit line; the grounds behind a drawing or a grid. |
| `./mount`, `./react`, `./element`, `./element/define` | Draw into a container; React props; the `<kyogijo-field>` element and its registration. |

The full list of entry points is in [entry points](./docs/entry-points.md); every export is in the [API reference](https://johnmorrisdotca.github.io/kyogijo-stadiums/api.html).

## Use it in your project

### Install

```sh
npm install @johnmorrisdotca/kyogijo-stadiums
# or: pnpm add @johnmorrisdotca/kyogijo-stadiums
# or: yarn add @johnmorrisdotca/kyogijo-stadiums
```

It needs Node 22 or later on a server, and any current browser. It is plain ES modules, with types. Once it is on npm the same files are on the CDNs: `https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo-stadiums@0/+esm` is the package as one module for the browser, and `https://unpkg.com/@johnmorrisdotca/kyogijo-stadiums@0/dist/index.js` the file itself.

### Four ways in

1. **A string of SVG.** `drawKyogijo(options)` returns SVG text; it needs no DOM and the same options always give the same text.
2. **A container in the browser.** `mountKyogijo(element, options)` draws into an element and, with `orientation: "auto"`, draws again when its shape changes.
3. **A custom element.** `<kyogijo-field>`: import `element/define` once and use the tag with attributes.
4. **A frame.** For a page that cannot run scripts, the demo site serves `embed.html`, which draws what its address says.

Each is shown with its code in [getting started](./docs/getting-started.md); React, Vue and Svelte are below.

## Examples

Each example is run against the built package by `pnpm test:readme`, and each links to the page that has the rest.

### A score on the rink

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({
  sport: "nhl",
  away: { name: "USA", abbr: "USA", score: 3, color: "#1c3f7a" },
  home: { name: "Canada", abbr: "CAN", score: 2, color: "#d52b1e" },
  status: "final-ot",
  competition: "Cup Final, Game 7",
  date: "June 24",
});
console.log(svg.includes("Cup Final, Game 7"), svg.includes("Final/OT"));
// true true
```

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/football-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/football-desk-light.webp" alt="A football field drawn wide on a background of floodlight beams: Mexico's green end zone on the left with its flag and its name written along it, the USA's navy end zone on the right with its flag, the yard lines, hash marks and upright and upside-down yard numbers between them, and the score panel at midfield reading 27 to 24, Final, Championship Game." width="720">
</picture>
<br><em>A football field: the end zones in the teams' colours, the score at midfield.</em>
</p>

### Trophies, medals, balls and crests

Kyogijo draws none of its own. Plug in [Dougu Sports](https://johnmorrisdotca.github.io/dougu-sports/) (`npm install @johnmorrisdotca/dougu-sports`) once, and its 167 emblems are ids: [Emblems](./docs/emblems.md).

```ts
import { drawKyogijo, useEmblems } from "@johnmorrisdotca/kyogijo-stadiums";
import { renderEmblem } from "@johnmorrisdotca/dougu-sports/emblems";

useEmblems(renderEmblem);

const svg = drawKyogijo({
  sport: "soccer",
  away: { name: "Brazil", abbr: "BRA", score: 2, color: "#009739", logo: "crest:shield" },
  home: { name: "England", abbr: "ENG", score: 1, color: "#c8102e", logo: "crest:roundel" },
  status: "final",
  pageant: { style: "stage", emblem: "trophy:soccer-globe", emblemName: "Northern Cup" },
});
console.log(svg.includes(encodeURIComponent(">BRA<")), svg.includes("Northern Cup"));
// true true
```

### A bare surface, and tall for a phone

```ts
import { drawKyogijo, drawSurface } from "@johnmorrisdotca/kyogijo-stadiums";

// No teams: just the NFL field at its true shape, 120 by 53⅓ yards with 12 feet of ground round it.
console.log(/viewBox="-12 -12 384 184"/.test(drawSurface({ sport: "nfl" })));
// true
const game = { away: { name: "Mexico", score: 27 }, home: { name: "USA", score: 24 }, status: "final" };
const wide = drawKyogijo({ sport: "nfl", ...game, orientation: "landscape" });
const tall = drawKyogijo({ sport: "nfl", ...game, orientation: "portrait" });
const box = (svg: string) => /viewBox="[^ ]+ [^ ]+ ([^ ]+) ([^ "]+)"/.exec(svg)!.slice(1).map(Number);
console.log(box(wide), box(tall));
// [ 384, 184 ] [ 184, 384 ]
```

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/tall-phone-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/tall-phone-light.webp" alt="A hockey rink standing tall on a phone, on an ice-blue background, the same game as on the desk: the USA's flag and name in the upper zone, Canada's in the lower, each reading upright, the score panel between them over the centre line." width="240">
</picture>
<br><em>The same game tall: the teams top and bottom, every word upright.</em>
</p>

[The surfaces](./docs/surfaces.md) lists the thirty-nine, with their sizes and what is drawn; [score and layout](./docs/score.md) has the options of a score, a strip and a compact card.

### A league's rulebook

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

// A court as FIBA marks it is not the NBA's.
console.log(drawKyogijo({ sport: "nba", league: "fiba" }) === drawKyogijo({ sport: "nba" }));
// false
```

Thirty-five leagues, each with its figures and its sources, are in [league variants](./docs/variants.md).

### A ballpark, by name

```ts
import { PARKS, drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const park = PARKS["hanshin-koshien-stadium"];
console.log(park.name, park.nameJa, park.points.length);
// Koshien Stadium 甲子園球場 5
const svg = drawKyogijo({ sport: "mlb", park: "hanshin-koshien-stadium", language: "ja" });
console.log(svg.includes("甲子園球場のグラウンド"), svg.includes("阪神甲子園球場のグラウンド"), svg.includes("正式名称は阪神甲子園球場です"));
// true false true
```

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/ballpark-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/ballpark-desk-light.webp" alt="The baseball field of Hanshin Koshien Stadium on a royal purple background, with the outfield fence drawn through its published distances, 95 metres at the lines and 118 metres in the alleys and the middle, with mown arcs on the grass, the warning track, the infield dirt, and a red and a navy panel in the foul ground at the bottom for the teams' dugouts, each with its country's flag, Japan's and the USA's." width="640">
</picture>
<br><em>A ballpark's fence, drawn through the distances its article publishes.</em>
</p>

### A ballpark of the past, in a season

```ts
import { PARKS, parkPointsIn, drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const polo = PARKS["polo-grounds"];
console.log(polo.name, polo.from, polo.to, parkPointsIn(polo, 1915).map(([, feet]) => feet));
// Polo Grounds 1891 1963 [ 277, 433, 258 ]
console.log(drawKyogijo({ sport: "mlb", park: "polo-grounds", year: 1915 }) === drawKyogijo({ sport: "mlb", park: "polo-grounds", year: 1930 }));
// false
```

Your own fence (`fence: { left: 310, center: 420 }`) and every park's key are in [ballparks](./docs/ballparks.md) and [parks](./docs/parks.md).

### A rink in a ballpark

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";
import { EVENTS, eventOptions } from "@johnmorrisdotca/kyogijo-stadiums/events";

// The 2009 Winter Classic: the NHL's rink, 200 by 85 feet, on the infield of Wrigley Field.
const game = EVENTS["winter-classic-2009"];
console.log(game.name.en, game.dates[0], game.venue.en);
// 2009 NHL Winter Classic 2009-01-01 Wrigley Field
const svg = drawKyogijo({
  ...eventOptions("winter-classic-2009"),
  away: { name: "Detroit Red Wings", abbr: "DET", score: 6, color: "#ce1126" },
  home: { name: "Chicago Blackhawks", abbr: "CHI", score: 4, color: "#111111" },
  status: "final",
});
console.log(svg.includes("Detroit Red Wings 6, Chicago Blackhawks 4"), svg.includes("lies outside the outline"));
// true true
```

The host, the rink and where it stood are each cited, and each game says whether its place is a source's or a convention: [special games](./docs/special-games.md).

### A badge for a list

```ts
import { drawBadge } from "@johnmorrisdotca/kyogijo-stadiums";

const badge = drawBadge({
  sport: "nba",
  away: { name: "Australia", abbr: "AUS", score: 98, color: "#00843d" },
  home: { name: "Japan", abbr: "JPN", score: 104, color: "#bc002d" },
  status: "Q4 2:31",
});
console.log(/viewBox="0 0 440 64"/.test(badge));
// true
```

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/badges-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/badges-desk-light.webp" alt="A list of eight score strips in the demo, on a midnight-blue background, each a team block with its country's flag, a short name and its score at each end, in the team's colour, and in the middle a small picture of the sport and the state of the game, such as Final, Final/OT and 2nd period." width="640">
</picture>
<br><em>Badges for a list of games.</em>
</p>

### A court of your own look

```ts
import { COURT_THEMES, drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({
  sport: "nba",
  court: { ...COURT_THEMES.twoTone, baselineText: ["SUMMIT PEAKS", "METRO BOLTS"], paintThreePoint: true },
});
console.log(svg.includes("--ky-key:#1e4f8f"), svg.includes("METRO BOLTS"));
// true true
```

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/court-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/court-desk-light.webp" alt="A basketball court in the two-tone look, in a warm glow: a pale floor with a deep blue key, centre circle and border, the words AUSTRALIA and JAPAN along the baselines, each country's flag and name on its half, and the score panel at centre court reading 108 to 112, Finals, Game 6." width="640">
</picture>
<br><em>A court in a look of its own: the paint, the border and the words on the baselines are options.</em>
</p>

The five court looks, the eight looks of every sport and every colour property are in [theming](./docs/theming.md).

### Turn it, and see the net

```ts no-run
import { mountKyogijoTurn } from "@johnmorrisdotca/kyogijo-stadiums/turn";

const view = mountKyogijoTurn(document.querySelector("#court")!, { sport: "volleyball", status: "live" }, { preset: "end" });
view.preset("corner");
```

```ts
import { turnMarkup, uprightsFor } from "@johnmorrisdotca/kyogijo-stadiums/turn";

const { items } = uprightsFor({ sport: "volleyball" }, { netHeight: "women" });
const html = turnMarkup({ sport: "volleyball" }, { preset: "end" });
console.log(items.map((item) => item.kind).join(), html.includes("preserve-3d"));
// net,netposts,antennae false
```

The flat drawing is the floor, turned by a drag, a swipe, the keys or four viewpoints (overhead, broadcast, end-on, low corner), and what the rulebook stands on the surface is built up on it at its height. Each part is a flat rectangle placed by one `matrix3d`, so there is no 3D context for a phone to lose; where 3D is not drawn the flat drawing stays. In the element it is `<kyogijo-field sport="nhl" turn turn-view="broadcast">`. [The 3D view](./docs/turn.md).

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/turn-volleyball-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/turn-volleyball-desk-light.webp" alt="A volleyball court from behind an end line under a spotlight, turned in the demo: the net at 2.43 metres on its posts with the red and white antennae, and under it the buttons for the four viewpoints, turning, raising, zooming and resetting." width="640">
</picture>
<br><em>A volleyball net at its rulebook height, with its posts and antennae.</em>
</p>

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/turn-rink-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/turn-rink-desk-light.webp" alt="An ice rink from a low corner on an ice-blue background, turned in the demo: the boards with their glass round the ice, a goal at each end, and the score on the ice." width="640">
</picture>
<br><em>A rink with its boards, glass and goals.</em>
</p>

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/turn-court-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/turn-court-desk-light.webp" alt="A basketball court from the main camera in a warm glow, turned in the demo: a basket on its backboard and padded stanchion at each end of the floor." width="640">
</picture>
<br><em>A court with a basket at each end, the rim at 10 feet.</em>
</p>

### A shoot-out, and a famous ground

```ts
import { drawKyogijo, soccerSpec } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({
  sport: "soccer",
  away: { name: "USA", abbr: "USA", score: 2, penalties: 4, color: "#1c3f7a" },
  home: { name: "Canada", abbr: "CAN", score: 2, penalties: 2, color: "#d52b1e" },
  status: "final-pens",
  ground: "metlife-stadium",
});
console.log(svg.includes("Final · 2-4 pens"), soccerSpec({ length: 110, width: 70, unit: "yd" }).length.toFixed(2));
// true 100.58
```

Pitch sizes, mowing patterns, goals and providers are in [soccer](./docs/soccer.md); the 64 grounds are in [the grounds](./docs/grounds.md).

### A surface in a season

```ts
import { drawKyogijo, rulesFor } from "@johnmorrisdotca/kyogijo-stadiums";

const rink = rulesFor("nhl", 1960);
console.log(rink.season, rink.rules.centreLine, rink.rules.trapezoid);
// 1960–61 true null
console.log(drawKyogijo({ sport: "nba", year: 1978 }) === drawKyogijo({ sport: "nba", year: 1979 }));
// false
```

Every change and its source is in [surfaces through the years](./docs/eras.md).

### Units and a provider's frame

```ts
import { convertLength, surfaceSize } from "@johnmorrisdotca/kyogijo-stadiums/geometry";
import { convert, toSurface } from "@johnmorrisdotca/kyogijo-stadiums/frames";

console.log(surfaceSize("nfl").unit, convertLength(100, "yd", "ft"));
// yd 300
// The right end-zone face-off dot, in the NHL API's feet and in HockeyTech's canvas, is one place.
console.log(toSurface([[69, 22]], { from: "nhl-api" }), convert("hockeytech", "nhl-api")([[600, 0]]));
// [ [ 169, 20.5 ] ] [ [ 100, 42.5 ] ]
```

[Units](./docs/units.md) and [coordinate frames](./docs/frames.md) have the tables of every surface's unit and every frame's range, origin and source.

### Data on a surface

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

// The NHL API's coordinates are feet from centre ice: `from` puts them on the rink.
const svg = drawKyogijo({
  sport: "nhl",
  layers: [
    {
      kind: "points",
      name: "shots",
      from: "nhl-api",
      data: [
        { x: 69, y: 22, team: "home", outcome: "goal", value: 0.31 },
        { x: 54, y: -8, team: "home", outcome: "shot", value: 0.07 },
        { x: -61, y: 12, team: "away", outcome: "blocked", value: 0.04 },
      ],
      style: { size: { range: [2, 5] }, outcomes: { blocked: { hollow: true, shape: "x" } } },
    },
  ],
});
console.log(svg.includes("3 shots"), svg.includes("By outcome: goal 1, shot 1, blocked 1."));
// true true
```

Zoom to a part of the surface with `range`: the data, the heat and the labels follow the crop ([display ranges](./docs/ranges.md)).

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const zone = drawKyogijo({ sport: "nhl", range: "offensive-zone", layers: [{ kind: "points", name: "shots", data: [{ x: 169, y: 20.5 }, { x: 150, y: 40 }] }] });
console.log(zone.includes('data-range="offensive-zone"'), zone.includes("Shows only the offensive zone at the right end."));
// true true
```

Lines, arrows, text, heat maps, hexagons, zones and contours are in [data layers](./docs/layers.md); a shot chart, a shot map, a spray chart, a pass chart and a soccer shot map are one call each in [charts](./docs/charts.md). Pass networks, formations, lineups (a team's players placed by position code, as discs or jerseys), Voronoi cells, Delaunay triangles, hulls, flow fields and sonars are layers too: [team shape](./docs/team-shape.md). Every kind is drawn, with its code, in the [gallery](https://johnmorrisdotca.github.io/kyogijo-stadiums/docs/gallery.html).

### Small multiples on a card

Many drawings in one SVG, with a title, a credit line and a ground behind them ([layouts and backgrounds](./docs/layouts.md)).

```ts
import { drawGrid } from "@johnmorrisdotca/kyogijo-stadiums/layouts";

const svg = drawGrid(
  ["fenway-park", "wrigley-field", "oracle-park"].map((park) => ({ drawing: { sport: "mlb", park }, label: park })),
  { preset: "card", title: "Three ballparks", endnote: "Drawn with Kyogijo", background: "grass" },
);
console.log(svg.includes('viewBox="0 0 1200 675"'), svg.includes("Three ballparks"));
// true true
```

### Several surfaces on one floor

`drawMulti` lays the package's own surfaces out together for one large event, to scale, on one floor, with the officials' chairs, the boards and empty places for the event's words and marks ([tournament layouts](./docs/multi.md)). Thirteen presets with their rules and sources; `multiFit` says whether a layout fits a hall, `stadium: true` sets it inside real stands, and `mountMultiTurn` turns the floor in 3D.

```ts
import { drawMulti, multiLayout } from "@johnmorrisdotca/kyogijo-stadiums/multi";

const svg = drawMulti({ preset: "judo-1x3" });
const layout = multiLayout({ preset: "judo-1x3" });
console.log(svg.startsWith("<svg"), layout.cells.length);
// true 3
console.log(layout.needs.length, layout.needs.width);
// 47 19
```

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/multi-judo-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/multi-judo-desk-light.webp" alt="Three judo contest areas in a row on one red floor of mats, each numbered, with dashed empty places for the event's name and logos and a board along each edge." width="640">
</picture>
<br><em>Three judo contest areas on one floor of mats: 47 by 19 metres.</em>
</p>

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/multi-tabletennis-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/multi-tabletennis-desk-light.webp" alt="Four table tennis areas in two rows of two on one blue floor, numbered Table 1 to Table 4, with a scoreboard hung over the middle and boards along the edges." width="640">
</picture>
<br><em>Four table tennis areas under one scoreboard.</em>
</p>

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/multi-tabletennis-3d-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/multi-tabletennis-3d-desk-light.webp" alt="Four table tennis areas in 3D from a low corner: tables on legs, a surround round each, a hung scoreboard, and the 3D view's controls." width="640">
</picture>
<br><em>The same four in 3D.</em>
</p>

The [demo](https://johnmorrisdotca.github.io/kyogijo-stadiums/halls.html) picks a preset, sets it in a hall, switches the stadium on and off, and turns it in 3D.

### A table tennis area

A table is drawn in the ITTF's playing area, 14 m by 7 m (`net.area` for Masters and wheelchair events), with dark surrounds and the umpires' chairs ([courts](./docs/courts.md#the-table-tennis-playing-area)).

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/tabletennis-area-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/tabletennis-area-desk-light.webp" alt="A table tennis table in its 14 m by 7 m playing area, with dark surrounds, chairs and table for the umpires" width="660">
</picture>
<br><em>The table in its playing area.</em>
</p>

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/tabletennis-area-3d-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/tabletennis-area-3d-desk-light.webp" alt="The same area in 3D: the surrounds round the floor, the table on its legs" width="660">
</picture>
<br><em>The same area in 3D.</em>
</p>

### A judo kata area

`budo: { style: "kata" }` is the IJF's kata area: a tape at the centre and one 3 m either side, and with `officials` the five judges and the coach's chair ([the budō page](./docs/budo.md#the-kata-area)).

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/judo-kata-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/judo-kata-desk-light.webp" alt="The IJF's kata area with the five judges' seats above it and the coach's chair below" width="660">
</picture>
<br><em>The kata area, its judges and the coach's chair.</em>
</p>

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/judo-kata-tapes-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/judo-kata-tapes-desk-light.webp" alt="Three short white tapes 3 m apart across the middle of a kata area" width="660">
</picture>
<br><em>Close up: the centre tape and the two starting tapes.</em>
</p>

### The element in a page

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo-stadiums@0/dist/element-define.js"></script>

<!-- score is home-away; home-score and away-score say it the other way -->
<kyogijo-field sport="nba" size="compact" orientation="auto"
  home="Japan" away="Australia" score="112-108"
  home-color="#c2410c" away-color="#14233f" status="final"></kyogijo-field>
```

The attributes are the options' names in kebab case, and the parts you can style are listed in [getting started](./docs/getting-started.md#3-a-custom-element).

### In React

```tsx no-run
import React from "react";
import { createKyogijo, kyogijoProps } from "@johnmorrisdotca/kyogijo-stadiums/react";

// A component made from your React, which measures its box for orientation="auto":
const Kyogijo = createKyogijo(React);
export const Game = () => (
  <Kyogijo sport="nhl" orientation="auto" away={{ name: "USA", score: 3 }} home={{ name: "Canada", score: 2 }} status="final" />
);

// Or props to spread onto your own element; nothing here imports React:
export const Plain = () => <div {...kyogijoProps({ sport: "nba" })} />;
```

### In Vue

```vue
<script setup>
import "@johnmorrisdotca/kyogijo-stadiums/element/define";
</script>

<template>
  <kyogijo-field sport="nfl" orientation="auto" away="Mexico" home="USA" away-score="27" home-score="24" status="final" />
</template>
```

Tell Vue the tag is a custom element with `compilerOptions.isCustomElement: (tag) => tag === "kyogijo-field"`.

### In Svelte

```svelte
<script>
  import "@johnmorrisdotca/kyogijo-stadiums/element/define";
  import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";
  export let home = 0;
  export let away = 0;
  $: svg = drawKyogijo({ sport: "nhl", away: { name: "USA", score: away }, home: { name: "Canada", score: home } });
</script>

<!-- the string of SVG, or the element: either works -->
{@html svg}
<kyogijo-field sport="nhl" away="USA" home="Canada" away-score={away} home-score={home} />
```

A page that moves (`mountKyogijo`), a file written on a server and a frame for a page with no script are in [getting started](./docs/getting-started.md).

## API

The [API reference](https://johnmorrisdotca.github.io/kyogijo-stadiums/api.html) lists every export of every entry point with its signature and its doc comment. It is made from the source by `pnpm site`, so it cannot fall behind the code. [Entry points](./docs/entry-points.md) says what each of the 15 holds: the main one draws; `/geometry`, `/frames`, `/layers`, `/charts`, `/replay`, `/parks`, `/eras`, `/leagues`, `/grounds` and `/atlas` stand apart and need nothing else; `/mount`, `/turn`, `/react`, `/element` and `/element/define` put a drawing in a page.

Every function is pure: it returns new values and never changes what it was given.

## Theming

Nothing is branded. The drawing is coloured by custom properties on its `svg`, with a light set and a dark set that follow the device (or `data-theme` on the page's root, or `theme` in the options); a page sets only the ones it wants different, and its own rule always wins. Each property is listed with its light and dark value, with the court's five looks, in [theming](./docs/theming.md).

## Limits

Each is held by a test: thirty-nine sports, ten soccer pitches and ten providers, 94 ballparks, 64 grounds, six units, forty-eight frames, a drawing of under 22 kB. The table, made from the code, is [limits](./docs/limits.md).

## Accessibility

- Each drawing is an `img` with a `<title>` and a `<desc>` that say the teams, the score, the surface and the result, in English or Japanese.
- A score is also text, words stay upright when the surface lies tall, colour is never the only sign, and each data layer has a table for a screen reader.
- Nothing moves by itself: a replay plays when asked, steps for a reader who prefers reduced motion, and pauses when the page is hidden; a changed score pulses once.

The rest, with the contrast and what is not yet done, is in [accessibility](./docs/accessibility.md).

## Browser and runtime support

Any browser with ES modules, `:where()` and SVG 2's `href` on images: Chrome and Edge 88, Safari 14, Firefox 78, all from 2021 on. The custom element needs shadow DOM and `part`, in every browser of 2021 on. The drawing function runs on Node 22 or later and in any other JavaScript runtime: it touches no DOM. The demo is played in a real browser, at a phone's width and a desk's, in Chromium and WebKit, before every release.

## Languages

English and Japanese: the title, the description and the standard statuses of a drawing, the sentence of each change in `eraChanges`, and the demo. The words are listed beside their English in [the Japanese of Kyogijo](./docs/strings-ja.md). Team names, competitions and dates are written as you give them, in any language; Japanese names of the NPB parks are in `PARKS`. Not yet: the Japanese read by a native reader (the demo says so when it is shown).

## Roadmap

Not here yet, and each welcome as an [issue](https://github.com/johnmorrisdotca/kyogijo-stadiums/issues):

- **More surfaces**: the FIBA and college courts, the international rink, rugby pitches, a stadium's seating, soccer's beach and street formats.
- **Wall heights and quirks** in a ballpark: the Green Monster, Tal's Hill, the walls of Japan's parks.
- **More parks of the past**: the grounds of the 19th century, and the parks whose articles give no distances yet (the Kingdome, Joe Robbie Stadium, the Los Angeles Coliseum), when they do.
- **More charts on data layers**: a formation chart, a pass sonar chart and a Voronoi chart of their own (the layers exist; see [team shape](./docs/team-shape.md)).
- **Football in a different standard**: the college and high-school hash marks.

Left out on purpose: statistics, rosters and schedules. Kyogijo Stadiums draws the place and the score it is given.

## Architecture

The drawing is plain functions over plain data with no DOM and no dependency. The dimensions are in one file, the ballparks are generated from a reviewed list, and each surface is a function that returns its markup and the places the teams and the score go. Every entry point stands apart, so that importing the geometry, the parks or the grounds loads nothing else. The files and what each is for are in [architecture](./docs/architecture.md).

Tests sit beside the code. `scripts/` builds the demo and the docs site, checks the packed package and the README's examples, and takes the README's pictures; `demo/` is the page and the frame; `e2e/` plays the demo and the docs in a real browser.

## The name

*Kyogijo* (競技場, kyōgijō, きょうぎじょう) is Japanese for a sports ground: the place a contest is held. "Stadiums" is added in English, so that the name says what it draws; in Japanese the name stays 競技場. It is written with 競技, "contest" or "competition", and 場, "place", and said in five beats, *kyo-u-gi-jo-u*. In Japanese it is the general word for a place where sport is played, a stadium or a ground; the package uses it as a name for every surface it draws, the field, the rink, the court and the diamond. The long vowels are written without a macron in the package's name, as in the other packages of the family.

## Where it comes from, and where it is used

Kyogijo Stadiums was made for [SPX Stats](https://spxn.com), the historical record of the NHL, NBA, MLB, NFL and CFL, to show the score of a game or a championship on the surface it was played on, with each team's name and logo at its side. Its Japanese names and its Japanese parks are there because the same author makes a Japanese study app and a site for Japanese board games, and because baseball in Japan is a sport its fans know by its grounds.

### Used by

- [SPX Stats](https://spxn.com), planned, for the score of a game or a championship.

Using Kyogijo Stadiums in something? Open an *Add my project* issue and we will add you.

### The family

<!-- family:start (made by scripts/family-readme.mjs from scripts/family-template.mjs; change those, not this) -->
Kyogijo Stadiums is one of thirty-two packages, each made for the same site, each at
[github.com/johnmorrisdotca](https://github.com/johnmorrisdotca) or [github.com/spxis](https://github.com/spxis). The code of every one is MIT.

**Games — board**

- [Domino](https://github.com/johnmorrisdotca/domino) (ドミノ): dominoes and Mexican Train. [Demo](https://johnmorrisdotca.github.io/domino/).
- [Gunjin](https://github.com/johnmorrisdotca/gunjin) (軍人): five hidden-rank strategy games with pass-the-device play. [Demo](https://johnmorrisdotca.github.io/gunjin/).
- [Narabe](https://github.com/johnmorrisdotca/narabe) (並べ): one rules engine for abstract board games, from gomoku and Reversi to Go and checkers. [Demo](https://johnmorrisdotca.github.io/narabe/).
- [Sugoroku](https://github.com/johnmorrisdotca/sugoroku) (双六): backgammon and its variants, with the doubling cube and match play. [Demo](https://johnmorrisdotca.github.io/sugoroku/).
- [Tenka](https://github.com/johnmorrisdotca/tenka) (天下): world conquest for two to six, on a map of the real world. [Demo](https://johnmorrisdotca.github.io/tenka/).

**Games — cards & tiles**

- [Hitotsu](https://github.com/johnmorrisdotca/hitotsu) (一つ): a colour-card shedding game for two to eight, with the house rules people play. [Demo](https://johnmorrisdotca.github.io/hitotsu/).
- [Jarajara](https://github.com/johnmorrisdotca/jarajara) (ジャラジャラ): mahjong tiles drawn as SVG, stacked layouts, and the matching solitaire Awase. [Demo](https://johnmorrisdotca.github.io/jarajara/).
- [Kumimoji](https://github.com/johnmorrisdotca/kumimoji) (組み文字): a crossword tile race, in English and Japanese kana. [Demo](https://johnmorrisdotca.github.io/kumimoji/).
- [Toranpu](https://github.com/johnmorrisdotca/toranpu) (トランプ): a deck of playing cards, card games with computer players, and solitaires. [Demo](https://johnmorrisdotca.github.io/toranpu/).

**Games — puzzles**

- [Houseki](https://github.com/johnmorrisdotca/houseki) (宝石): gem and stone matching puzzles: falling triplets, stone collapse, colour chains and gem swap. [Demo](https://johnmorrisdotca.github.io/houseki/).
- [Jirai](https://github.com/johnmorrisdotca/jirai) (地雷): minesweeper on shaped grids with verified no-guess boards. [Demo](https://johnmorrisdotca.github.io/jirai/).
- [Karakuri](https://github.com/johnmorrisdotca/karakuri) (からくり): eight hyper-casual puzzle games, some of them physics: draw a shield, pull pins, cut ropes, slide blocks, pour tubes. [Demo](https://johnmorrisdotca.github.io/karakuri/).
- [Kazu](https://github.com/johnmorrisdotca/kazu) (数): grid number puzzles: Sudoku and its variants, Futoshiki and Skyscrapers. [Demo](https://johnmorrisdotca.github.io/kazu/).
- [Kyuubu](https://github.com/johnmorrisdotca/kyuubu) (キューブ): a turning cube for the browser, 2×2 to 7×7, with record solves to replay. [Demo](https://johnmorrisdotca.github.io/kyuubu/).
- [Meikyuu](https://github.com/johnmorrisdotca/meikyuu) (迷宮): mazes on squares, hexagons, triangles and circles, made from a seed and drawn through with a finger or the mouse. [Demo](https://johnmorrisdotca.github.io/meikyuu/).
- [Suido](https://github.com/johnmorrisdotca/suido) (水道): a pipe puzzle: turn the pieces until the water reaches every drain. [Demo](https://johnmorrisdotca.github.io/suido/).
- [Tobiishi](https://github.com/johnmorrisdotca/tobiishi) (飛び石): peg solitaire with nine boards and seeded solvable challenges. [Demo](https://johnmorrisdotca.github.io/tobiishi/).
- [Tsunagi](https://github.com/johnmorrisdotca/tsunagi) (繋ぎ): a line-joining logic puzzle whose every level has exactly one answer. [Demo](https://johnmorrisdotca.github.io/tsunagi/).

**Games — dice & random**

- [Korokoro](https://github.com/johnmorrisdotca/korokoro) (コロコロ): dice, with notation, exact odds, real sounds and the dice of many games. [Demo](https://johnmorrisdotca.github.io/korokoro/).
- [Tane](https://github.com/johnmorrisdotca/tane) (種): seeded random numbers and daily seeds, the same in every browser and on every server. [Demo](https://johnmorrisdotca.github.io/tane/).

**Language**

- [Bushu](https://github.com/johnmorrisdotca/bushu) (部首): find a kanji by the parts it is made of. [Demo](https://johnmorrisdotca.github.io/bushu/).
- [Hikidashi](https://github.com/johnmorrisdotca/hikidashi) (引き出し): a drawer of small Japanese text tools: era dates, kanji numerals, readings and sentence difficulty. [Demo](https://johnmorrisdotca.github.io/hikidashi/).
- [Kotoba](https://github.com/johnmorrisdotca/kotoba) (言葉): word lists and word-game rules in English, French, German and Japanese. [Demo](https://johnmorrisdotca.github.io/kotoba/).

**Geography & data**

- [address-plus](https://github.com/johnmorrisdotca/address-plus) (アドレスプラス): parse and format addresses in the United States, Canada, Japan, Australia, France, Germany and the United Kingdom. [Demo](https://johnmorrisdotca.github.io/address-plus/).
- [Chizu](https://github.com/johnmorrisdotca/chizu) (地図): maps of the world and of countries' regions, in English and Japanese, with a quiz and callouts. [Demo](https://johnmorrisdotca.github.io/chizu/).
- [Hata](https://github.com/johnmorrisdotca/hata) (旗): country and regional flags as SVG, at their true proportions and keyed by ISO code. [Demo](https://johnmorrisdotca.github.io/hata/).
- [Kuni](https://github.com/johnmorrisdotca/kuni) (国): countries and their regions, with ISO codes and names in English and Japanese. [Demo](https://johnmorrisdotca.github.io/kuni/).

**Sports**

- [Dougu Sports](https://github.com/johnmorrisdotca/dougu-sports) (道具): sports emblems as SVG: trophies, medals, crests, and the ball and gear of every sport, with optional 3D turning. [Demo](https://johnmorrisdotca.github.io/dougu-sports/).
- [Kyogijo Stadiums](https://github.com/johnmorrisdotca/kyogijo-stadiums) (競技場): sports fields, rinks, courts and ballparks drawn to scale as SVG, with each team and the score on them. [Demo](https://johnmorrisdotca.github.io/kyogijo-stadiums/).
- [Senshu Jerseys](https://github.com/johnmorrisdotca/senshu-jerseys) (選手): sports jerseys, sweaters, kits, caps, helmets and retired-number banners as SVG, front and back, with optional 2.5D turning. [Demo](https://johnmorrisdotca.github.io/senshu-jerseys/).
- [Taisen Brackets](https://github.com/johnmorrisdotca/taisen-brackets) (対戦): a sport-agnostic tournament bracket, drawn as SVG, from a list of ties. [Demo](https://johnmorrisdotca.github.io/taisen-brackets/).

**Developer tools**

- [REST in Pieces](https://github.com/spxis/rest-in-pieces) (レスト・イン・ピーシーズ): seeded test data and REST APIs for frontend development, with latency and error drills. [Demo](https://spxis.github.io/rest-in-pieces/).


**This package is Kyogijo Stadiums.** The demos of all thirty-two share one header and footer, so each links the rest.
<!-- family:end -->

## Development

```sh
pnpm install
pnpm check          # lint, types, every test, the build and the packed package
pnpm test:package   # pack, install and import it as somebody who installed it would
pnpm test:demo      # build the demo and the docs and play them in a real browser, at a phone's width and a desk's
pnpm site           # build the demo and the docs site into site/, as the Pages workflow publishes it
pnpm screenshots:readme   # remake every README picture from the built demo, in light and dark, each on one of the family's backgrounds
pnpm test:readme    # run every example in the README and the docs against the built package
pnpm docs:make      # rewrite what the docs make from the source: the Japanese words, the leagues, the frames and units tables
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). The commands are under [Development](#development).

Please follow the [code of conduct](./CODE_OF_CONDUCT.md). Text, a colour or a logo address that gets out of the drawing, or a name that makes it run for a very long time, is for the [security policy](./SECURITY.md), not a public issue.

## Changes

See [CHANGELOG.md](./CHANGELOG.md). The first release, 0.1.0, draws the twenty surfaces and the 94 ballparks, with scores, badges, wide and tall layouts, a custom element and a frame.

## Licence

The code is [MIT](./LICENSE) © John Morris. The ballparks' fence distances are facts published in Wikipedia's articles, re-expressed here as numbers, with the article and revision of each cited in [NOTICE.md](./NOTICE.md) (shipped in the package) and [docs/references.md](./docs/references.md). The dimensions of the surfaces are facts from the rulebooks and the federations' diagrams, cited in [docs/sources.md](./docs/sources.md).

| Data | Made from | Terms |
| --- | --- | --- |
| The dimensions of the football fields, the rink and the court | The NFL, CFL, IFAF, NHL and NBA rules and diagrams | Facts; no text or drawing copied |
| The soccer pitch's dimensions and the providers' coordinates | The IFAB and FIFA Futsal Laws of the Game, UEFA, MLS, NCAA and FA documents, and each provider's own pages (docs/sources.md) | Facts; no text or drawing copied |
| The fence distances of 94 ballparks | The English and Japanese Wikipedia articles of each, at the revision cited | Facts; the articles are CC BY-SA 4.0 and none of their text is used |
| The Wikidata item of each ballpark | Wikidata, as linked from the cited article | CC0 |
| 64 soccer grounds | English Wikipedia articles at the revision cited; Wikidata | Facts; CC BY-SA 4.0 articles, no text used; CC0 |
| The demo's countries and their logos | The names and codes of real countries; the maple leaf, the sun disc and the roundels are drawn for this package | MIT |
| The demo's country flags | [Hata](https://github.com/johnmorrisdotca/hata), a development dependency whose flags are loaded into the demo site with its licence and notice; the package itself draws none | MIT, and its flags' own licences in its NOTICE.md |
| The demo's trophies, medals, balls and crests | [Dougu Sports](https://github.com/johnmorrisdotca/dougu-sports), a development dependency copied into the demo site with its licences; the package itself draws none | MIT, and its sources' licences in its NOTICE.md |
