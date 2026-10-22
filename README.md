<h1 align="center">Kyogijo Stadiums <sub>競技場</sub></h1>

<p align="center"><strong>Sports surfaces as SVG, drawn to scale, with the score on them.</strong><br>
The surfaces of forty-three sports, from football and curling to the budō and the combat sports, each drawn from its rulebook or its published distances, with each team's name and logo on its side and the score in the middle, a lineup, stands and a crowd, a pageant of flags and a 3D view. Wide or tall, light or dark, a badge for a list, a helper for React, a custom element and a frame for a page that runs no script. One function, no dependencies.</p>

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
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/hero-desk-light.webp" alt="The demo on a desk: an NHL rink drawn wide on an ice-blue background, the USA on the left, Canada on the right and the score 3 to 2, Final/OT, in the middle, with the controls beside it." width="640">
</picture>
<br><em>The demo on a desk: a rink, with the teams on their sides and the score in the middle.</em>
</td>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/hero-phone-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/hero-phone-light.webp" alt="The demo on a phone: a football field standing tall under floodlight beams, Mexico's green end zone at the top and the USA's navy one at the bottom, and a score panel at midfield reading 27 to 24, Final." width="240">
</picture>
<br><em>On a phone the same surface stands tall, the words still upright.</em>
</td>
</tr>
</table>

Kyogijo Stadiums draws the places a game is played on, with the score of the game on them: the teams at their ends, the score in the middle, a label for what it was. The surfaces are drawn to scale from the rulebooks: a football field has its hash marks where the rules put them, a ballpark its fence where its published distances put it.

## Look at these first

<table align="center">
<tr>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/venues-saddledome-3d-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/venues-saddledome-3d-desk-light.webp" alt="The Scotiabank Saddledome in 3D: two tiers of seats under its saddle roof." width="400">
</picture>
<br><strong><a href="./docs/venues.md">Real arenas</a></strong>: all thirty-two arenas of the NHL, each in the outline of its building with a plausible bowl of the seats, tiers and roof the sources give; 2D and 3D, with the stands, walls and roof to switch.
</td>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/multi-tabletennis-3d-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/multi-tabletennis-3d-desk-light.webp" alt="Four table tennis areas on one floor in 3D, with a hung scoreboard." width="400">
</picture>
<br><strong><a href="./docs/multi.md">Tournament layouts</a></strong>: judo, table tennis and other areas on one floor, to scale, in a hall or a stadium, flat or in 3D.
</td>
</tr>
<tr>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/judging-broadcast-3d-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/judging-broadcast-3d-desk-light.webp" alt="A kata mat in 3D from the broadcast camera, with a board at its side listing each judge." width="400">
</picture>
<br><strong><a href="./docs/judging.md">Who judges where</a></strong>: each judo mat's officials by seat, a broadcast view with the officials on a board, and a page to print.
</td>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/mma-cage-3d-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/mma-cage-3d-desk-light.webp" alt="An MMA cage in 3D: a mesh fence on a solid platform." width="400">
</picture>
<br><strong><a href="./docs/combat.md">The combat sports</a></strong>: an MMA cage, boxing and wrestling rings and mats, flat and in 3D.
</td>
</tr>
</table>

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

- **A results page or a stats site** that has a game's score and wants a picture of where it was played.
- **A list of games** that needs a compact strip for each, small enough for a phone.
- **Anyone drawing a rink, field, court or ballpark** for a poster or a lesson, with the dimensions right and the colours their own.
- **A site that uses a framework or none**: the drawing is a string, so it works from a server, a build step, a framework, a custom element or a frame.

## Features

- **Forty-three surfaces, to scale.** The NFL, CFL and IFAF fields, the NHL rink, the NBA court, soccer, baseball, curling, twelve net and racket sports, the pools, athletics, skating, seven field sports, the budō, the MMA cage, the rings and the mats. Every figure is cited in [sources](./docs/sources.md). [The surfaces](./docs/surfaces.md).
- **Each league's rulebook.** `league: "fiba"` draws a court as FIBA marks it: 48 variants, from the WNBA and the IIHF to Little League, softball, rugby league and box lacrosse, each cited. [League variants](./docs/variants.md).
- **A realistic basketball floor.** `court: { hardwood: true }` draws maple boards that run the length of the court with staggered ends, grain and stained keys, the baskets with soft shadows, and benches. The clean floor stays the default. [Hardwood](./docs/hardwood.md).
- **The stands and the crowd.** `crowd: true` draws the seating round any surface that has spectators: a bowl, two sides, a horseshoe, courtside rows or a ballpark's grandstands, with the people as seeded heads in the home colours and the empty seats showing. `crowd: { real: true }` puts an NHL arena, or BC Place, in its building's outline (OpenStreetMap) with a plausible bowl, never a seat map. [The crowd](./docs/crowd.md), [venues](./docs/venues.md), [stadiums](./docs/stadiums.md).
- **Curling, from the rule books.** A sheet from World Curling's and Curling Canada's rules, tall by default, with the board and the hammer in a score, `curlingStones` for an end's stones, `show: "folded"` for both houses enlarged. [Curling](./docs/curling.md).
- **Net, racket and court sports, from their rulebooks.** The ITF's, FIVB's, BWF's, USA Pickleball's and ITTF's courts and table, and padel, squash, racquetball, sepak takraw, teqball, roundnet and netball, each in its look, with a board of sets and games. [Net, racket and court sports](./docs/courts.md).
- **Swimming, water polo, diving and artistic swimming, from World Aquatics' regulations.** The 50 or 25 m pool with its lanes, ropes, blocks and touch panels; the water polo field; the diving well; the artistic swimming area. [Pools](./docs/pools.md).
- **Lacrosse, rugby, Australian football, Gaelic games, cricket, field hockey and handball, from their rulebooks.** The fields and floors of World Lacrosse, World Rugby, the NRL, the AFL, the GAA, the FIH and the IHF, and a cricket ground. [Field sports](./docs/field-sports.md).
- **The athletics stadium, from World Athletics' rules.** The 400 m track with its lanes and staggers worked out from the running lines, every race start, hurdles, the steeplechase and the field events, with lane draws, results and a race replay. [The athletics stadium](./docs/athletics.md).
- **The skating rinks, from the ISU's rules.** The 400 m speed skating track with each race's lines worked out lane by lane; the short track's oval; the figure skating rink; and results, a race replay and a programme's elements. [The skating rinks](./docs/skating.md).
- **The budō, from the federations' rules.** The IJF's and the All Japan Judo Federation's judo areas, the WKF's karate areas, the kendo shiai-jo, the sumo dohyō, the kyūdōjō, and **a dojo builder**: tatami laid as real units, with its walls, doors, windows and shrine. [The budō](./docs/budo.md).
- **Soccer, to the Laws.** A pitch from Law 1 of the IFAB Laws of the Game of any size, with presets from international to 5-a-side, half pitches, five mowing patterns and four goal styles. [Soccer](./docs/soccer.md).
- **Every ballpark.** The 30 current MLB parks and 44 that MLB clubs have left, and the 12 home parks of Nippon Professional Baseball with eight other NPB grounds, each with its fence drawn from the distances published for it, as it stood in a season, with its walls and quirks (`walls`, `quirks`), none guessed. [Ballparks](./docs/ballparks.md).
- **Soccer grounds, arenas and an atlas.** 64 soccer grounds at their published sizes, 167 NHL, NBA, WNBA and PWHL arenas (`drawKyogijo({ sport: "nhl", arena: "boston-garden" })`), and 330 places on a map, found by any of their names. [Grounds](./docs/grounds.md), [arenas](./docs/arenas.md), [atlas](./docs/atlas.md), [names](./docs/ballparks.md#names).
- **Special games.** A surface set inside another, to scale: an NHL rink on a ballpark's infield, a baseball field over a London stadium's pitch. 18 games, each cited. [Special games](./docs/special-games.md).
- **Surfaces through the years.** `year: 1975` draws a surface as its league's rules marked it that season, each change cited. [Surfaces through the years](./docs/eras.md).
- **Score mode.** Each team's name and logo on its side (end zones, ends of the ice, halves of the court, dugouts) and the score large in the middle, with the competition, status and date, and the winner emphasised. [Score and layout](./docs/score.md#round-marks).
- **The situation of a game.** `situation` draws what is happening: hockey's power play and shootout, baseball's runners and count, football's line of scrimmage, first-down line, red zone and down and distance, with a drive chart. [The situation](./docs/situation.md).
- **Lineups.** A `lineup` layer places a team's players by position code (`GK`, `CB`, `HK`, `C`) with no coordinates, from a formation (36, in 13 sports), as a disc or a jersey with the number, the name, a captain's C and a flag. [Lineups](./docs/team-shape.md#lineups).
- **A pageant.** Each team's flag or crest laid large over its half of the surface: `pageant: "carpet"` (a flag at its own ratio) or `"stage"` (a crest on a round disc), an emblem or a trophy in the centre circle, the score in the middle or in the strip. [The pageant](./docs/pageant.md).
- **Trophies, medals, balls and crests, by id.** `useEmblems(renderEmblem)` plugs in the sister package [Dougu Sports](https://johnmorrisdotca.github.io/dougu-sports/), and an id goes wherever a logo, a flag or a mark is taken: `logo: "crest:shield"`, `"ball:puck"`. [Emblems](./docs/emblems.md).
- **Country flags, by code.** `useFlags(render)` plugs in the sister package [Hata](https://github.com/johnmorrisdotca/hata) through a small adapter, and a team's `flag: "CA"` is its flag: round in a round mark, at its own proportions on a banner, a badge or a carpet. [Flags](./docs/flags.md).
- **Zoom to a part of a surface.** `range: "offensive-zone"` crops a drawing to a rink's zone, a half court, the paint, the red zone, a penalty area, the infield, a house, or a box of your own. [Display ranges](./docs/ranges.md).
- **Wide, tall or fit the box.** Every surface lies wide or tall: tall turns it a quarter, keeps every word upright and puts the teams top and bottom; `orientation: "auto"` follows the box.
- **Where a point lies, by the rules, and a click as a place.** `zoneAt("nhl", [69, 22], { frame: "nhl-api" })` names the zone from the surface's own figures; `clientPointToField` is a pointer's place in any frame. [Zones](./docs/zones.md), [pointing](./docs/pointer.md).
- **Goals, the strike zone and the stumps, end-on.** A goal mouth for six sports with the shots laid on it, the catcher's view of the strike zone with its pitches numbered, and the wicket from the bowler's end with its zones. [Targets](./docs/targets.md).
- **Data on the surface.** Points, lines, arrows, text, heat maps, hexagons and density contours over any surface, in its own feet or a provider's frame; ready-made shot and pass charts. [Data layers](./docs/layers.md), [charts](./docs/charts.md).
- **Small multiples and backgrounds.** `drawGrid` puts many drawings in one SVG with a title, a shared key and a credit line, for a card or a phone; `background` lays a pattern or a photograph behind them. [Layouts and backgrounds](./docs/layouts.md).
- **Tournament layouts.** Several surfaces laid out for one event, to scale, as one SVG: thirteen presets, each with its rule and sources, and a stadium round it. [Tournament layouts](./docs/multi.md).
- **Judging assignments.** Who judges where. [Judging](./docs/judging.md). **Boards over a surface.** [Boards](./docs/boards.md).
- **Replay.** Tracking data played on any surface: the players, the ball and its trail, and the passes, shots and goals as they happen, with controls and the keyboard. [Replay](./docs/replay.md).
- **A 3D view.** Any surface as a floor that turns by mouse, touch, wheel or keys, with four viewpoints (overhead, broadcast, end-on, low corner), and what stands on it at its height (nets, baskets, goals, a cage's mesh) and the venue round it (raked stands, roofs, walls). [The 3D view](./docs/turn.md).
- **Renderers.** The same drawing as plain data (a scene), on a canvas, in a d3 selection, as an Observable Plot mark, as GeoJSON and as a PNG in Node, each an entry of its own. [Renderers](./docs/renderers.md).
- **Units and frames.** Each surface in its rulebook's unit and any other, and 48 coordinate frames (ten soccer providers, the NHL API, NBA stats, NFL tracking, MLBAM and more) for a provider's points. [Units](./docs/units.md), [coordinate frames](./docs/frames.md).
- **A compact badge and a compact card.** One strip for a list, or the surface with that strip under it.
- **Light and dark**, by the device or the page; every colour a custom property; eight named looks, colours by feature, line widths and dashes, arrows, axes and labels. [Theming](./docs/theming.md), [annotations](./docs/annotations.md).
- **Accessible.** Each drawing is an `img` with a title and a description of the surface and the result, in English or Japanese. [Accessibility](./docs/accessibility.md).
- **Four ways in.** A function that returns SVG text; a helper that draws into a container; a custom element; a frame for pages with no script; a React helper that imports no React.
- **No dependencies**, no network requests, nothing stored. Text, colours and logo addresses from outside are made safe.
- **A docs site.** Guides, a search, a gallery that draws every picture from the code beside it, and [how it compares](./docs/compare.md): [the documentation](./docs/README.md).

### What's in it

| Part | What it is |
| --- | --- |
| `drawKyogijo`, `drawSurface`, `drawScore`, `drawBadge` | The drawing, as a string of SVG. |
| `SPORTS`, `PARKS`, `PARK_IDS`, `COURT_THEMES` | The forty-three sports, the 94 ballparks, the court looks. |
| `SOCCER_PITCHES`, `SOCCER_PROVIDERS`, `rescale`, `soccerSpec` | The soccer pitches, the data providers' coordinate systems and the map between them. |
| `GROUNDS`, `groundById` | The 64 soccer grounds, each pitch at its own size. |
| `EVENTS`, `eventOptions` | The 18 special games: a rink in a ballpark, a court on a carrier's deck. |
| `./zones`, `./pointer`, `./target` | Where a point lies by a sport's own rules; a click as a place in a provider's numbers; a goal, the strike zone or the stumps end-on. |
| `./geometry`, `./frames`, `./layers`, `./charts`, `./replay` | The dimensions in any unit; the providers' frames; data layers; charts; tracking data played on a surface. |
| `./athletics`, `./budo`, `./skating` | The athletics stadium, the budō (areas, dohyō, kyūdōjō, the dojo builder `drawDojo`, the 82 kimarite) and the skating rinks: plans, races and charts. |
| `./parks`, `./grounds`, `./arenas`, `./atlas`, `./eras`, `./leagues`, `./events` | The ballparks, grounds, arenas, every place, a season's markings, each league's rulebook, the special games. |
| `./venues`, `./stadiums`, `./district`, `./plateau` | Real arenas and stadiums in their buildings' outlines; districts on one plan, among PLATEAU's buildings. |
| `./turn` | A surface as a 3D view that turns, with the net, basket, goal or posts standing on it. |
| `./scene`, `./canvas`, `./d3`, `./plot`, `./geojson`, `./png` | The drawing as data, on a canvas, in d3, as an Observable Plot mark, as GeoJSON, as a PNG (the optional peer `@resvg/resvg-js`). |
| `./multi`, `./judging`, `./layouts` | `drawMulti` (several surfaces for one event, [docs](./docs/multi.md), [demo](https://johnmorrisdotca.github.io/kyogijo-stadiums/halls.html)); `drawJudging` (who judges where, [docs](./docs/judging.md)); `drawGrid` (small multiples, backgrounds). |
| `./mount`, `./react`, `./element`, `./element/define` | Draw into a container; React props; the `<kyogijo-field>` element and its registration. |

The full list of entry points is in [entry points](./docs/entry-points.md); every export is in the [API reference](https://johnmorrisdotca.github.io/kyogijo-stadiums/api.html).

## Use it in your project

### Install

```sh
npm install @johnmorrisdotca/kyogijo-stadiums
# or: pnpm add @johnmorrisdotca/kyogijo-stadiums
# or: yarn add @johnmorrisdotca/kyogijo-stadiums
```

It needs Node 22 or later on a server, and any current browser. It is plain ES modules, with types, and on the CDNs once on npm: `https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo-stadiums@0/+esm` is the package as one module for the browser.

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
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/football-desk-light.webp" alt="A football field drawn wide under floodlight beams: Mexico's green end zone on the left with its flag and name, the USA's navy one on the right, the yard lines and numbers between, and the score panel at midfield reading 27 to 24." width="720">
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
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/tall-phone-light.webp" alt="A hockey rink standing tall on a phone, on ice blue: the USA's flag and name in the upper zone, Canada's in the lower, each upright, the score panel between them." width="240">
</picture>
<br><em>The same game tall: the teams top and bottom, every word upright.</em>
</p>

[The surfaces](./docs/surfaces.md) lists the forty-three, with their sizes and what is drawn; [score and layout](./docs/score.md) has the options of a score, a strip and a compact card.

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
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/ballpark-desk-light.webp" alt="The baseball field of Hanshin Koshien Stadium on royal purple: the outfield fence at its published distances, 95 metres at the lines and 118 in the alleys, the infield dirt, and a red and a navy dugout panel with Japan's and the USA's flags." width="640">
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
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/badges-desk-light.webp" alt="Eight score strips in the demo on a midnight-blue background, each with a team block, flag, short name and score at each end, and in the middle a small picture of the sport and the state of the game, such as Final or 2nd period." width="640">
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
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/court-desk-light.webp" alt="A basketball court in the two-tone look, in a warm glow: a pale floor with a deep blue key, centre circle and border, AUSTRALIA and JAPAN along the baselines, each flag and name on its half, and the score panel at centre court reading 108 to 112." width="640">
</picture>
<br><em>A court in a look of its own: the paint, the border and the words on the baselines are options.</em>
</p>

The five court looks, the eight looks of every sport and every colour property are in [theming](./docs/theming.md).

### Turn it, and see the net

```ts no-run
import { mountKyogijoTurn } from "@johnmorrisdotca/kyogijo-stadiums/turn";

const view = mountKyogijoTurn(document.querySelector("#court")!, { sport: "volleyball", status: "live" }, { preset: "end" });
view.preset("corner");
view.setDirection("clockwise"); // the auto-turn goes the other way (`direction` in the settings says it at the start)
```

```ts
import { turnMarkup, uprightsFor } from "@johnmorrisdotca/kyogijo-stadiums/turn";

const { items } = uprightsFor({ sport: "volleyball" }, { netHeight: "women" });
const html = turnMarkup({ sport: "volleyball" }, { preset: "end" });
console.log(items.map((item) => item.kind).join(), html.includes("preserve-3d"));
// net,netposts,antennae false
```

The flat drawing is the floor, turned by a drag, a swipe, the keys or four viewpoints, with what the rulebook stands on it at its height; each part is one `matrix3d`. The auto-turn waits for Play, and turns either way: `counterclockwise` (the near side swinging to the viewer's right) by default, `clockwise` on the Reverse button. In the element: `<kyogijo-field sport="nhl" turn turn-view="broadcast">`. [The 3D view](./docs/turn.md).

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/turn-volleyball-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/turn-volleyball-desk-light.webp" alt="A volleyball court from behind an end line, turned in the demo: the net at 2.43 metres on its posts with the antennae, and the viewpoint buttons under it." width="640">
</picture>
<br><em>A volleyball net at its rulebook height, with its posts and antennae.</em>
</p>

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/turn-rink-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/turn-rink-desk-light.webp" alt="An ice rink from a low corner: the boards and glass round the ice, a goal at each end, and the score on the ice." width="640">
</picture>
<br><em>A rink with its boards, glass and goals.</em>
</p>

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/turn-court-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/turn-court-desk-light.webp" alt="A basketball court from the main camera: a basket on its backboard and padded stanchion at each end." width="640">
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

Zoom to a part with `range`: the data follows the crop ([display ranges](./docs/ranges.md)).

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const zone = drawKyogijo({ sport: "nhl", range: "offensive-zone", layers: [{ kind: "points", name: "shots", data: [{ x: 169, y: 20.5 }, { x: 150, y: 40 }] }] });
console.log(zone.includes('data-range="offensive-zone"'), zone.includes("Shows only the offensive zone at the right end."));
// true true
```

Lines, arrows, text, heat maps, hexagons, zones and contours are in [data layers](./docs/layers.md); shot, spray and pass charts in [charts](./docs/charts.md); pass networks, formations, lineups, Voronoi cells and flow fields are layers too ([team shape](./docs/team-shape.md)).

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

`drawMulti` lays the package's own surfaces out for one large event, to scale, on one floor, with the officials' chairs and boards and places for the event's words (`sample: true` fills them with an invented event; [tournament layouts](./docs/multi.md)). `multiFit` says whether it fits a hall, `stadium: true` sets it inside stands, `mountMultiTurn` turns it in 3D.

```ts
import { drawMulti, multiLayout } from "@johnmorrisdotca/kyogijo-stadiums/multi";

const svg = drawMulti({ preset: "judo-1x3", sample: true });
const layout = multiLayout({ preset: "judo-1x3" });
console.log(svg.startsWith("<svg"), layout.cells.length);
// true 3
console.log(layout.needs.length, layout.needs.width);
// 47 19
```

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/turning-hall-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/turning-hall-desk-light.webp" alt="A tournament layout turning once round in 3D, slowly: four table tennis areas on one floor, a surround round each and a scoreboard hung over them." width="640">
</picture>
<br><em>A tournament layout, turning: four table tennis areas under one scoreboard.</em>
</p>

### Boards over a surface

`board` lays a results board, a bout presentation or a medal table, any SVG, over a surface in 2D and 3D, off its middle and never stretched ([boards](./docs/boards.md)).

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/boards-swimming-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/boards-swimming-desk-light.webp" alt="A results board over the top of a swimming pool: eight swimmers, their times and a record badge." width="640">
</picture>
<br><em>A final over the pool.</em>
</p>

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/boards-judo-3d-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/boards-judo-3d-desk-light.webp" alt="A bout presentation board over a judo mat seen in 3D, steady while the mat turns." width="640">
</picture>
<br><em>A bout over the mat, in 3D.</em>
</p>

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/boards-medals-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/boards-medals-desk-light.webp" alt="A medal table in the top right corner of an athletics stadium, off the middle of the field." width="640">
</picture>
<br><em>A medal table in a corner.</em>
</p>

### The real venues

`crowd: { real: true }` draws an NHL arena in its building: the outline from OpenStreetMap, the rink lying along the building where it says so, and a plausible bowl of the seats, tiers and roof the sources give. All thirty-two arenas of the league, division by division ([the real venues](./docs/venues.md)). `boards: true` adds LED ribbon boards and a hung scoreboard, generic content ([LED boards](./docs/venues.md#led-boards)). In 3D the demo's [venues page](https://johnmorrisdotca.github.io/kyogijo-stadiums/venues.html) turns while the pointer is over it, with the stands, walls, roof, LED boards, lighting, building, markings and labels switched on the view while it turns.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";
import { planVenue, venueById } from "@johnmorrisdotca/kyogijo-stadiums/venues";

const svg = drawKyogijo({ sport: "nhl", arena: "climate-pledge-arena", crowd: { real: true } });
console.log(svg.includes("ky-cr-shell"), planVenue(venueById("climate-pledge-arena")!).total);
// true 17151
```

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/turning-venue-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/turning-venue-desk-light.webp" alt="A real arena turning once round in 3D, slowly: Climate Pledge Arena in the outline of its building, two tiers of seats with a suite level of windows between them, and a darker concourse floor round the bowl." width="640">
</picture>
<br><em>A real arena, turning: Climate Pledge Arena in the outline of its building (OpenStreetMap).</em>
</p>

### A real stadium, and a district

`stadium: "bc-place"` draws BC Place for football or soccer under its cable roof, and Lumen Field, T-Mobile Park, Tokyo Dome, Koshien Stadium (`park`) and Korakuen Hall (`sport: "boxing"`) likewise ([stadiums](./docs/stadiums.md)); `drawDistrict({ venues: ["bc-place", "rogers-arena"] })` puts venues at their real positions, tight as neighbours or spread as a city, to turn together in 3D ([districts](./docs/district.md)).

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/stadiums-bc-place-3d-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/stadiums-bc-place-3d-desk-light.webp" alt="BC Place's soccer pitch in 3D: two bowls of seats under a cable-supported roof with an opening." width="640">
</picture>
<br><em>BC Place, in 3D.</em>
</p>

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/district-bc-rogers-3d-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/district-bc-rogers-3d-desk-light.webp" alt="BC Place and Rogers Arena in 3D on one ground with a grid, a scale and a north arrow." width="640">
</picture>
<br><em>BC Place and Rogers Arena.</em>
</p>

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/district-seattle-3d-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/district-seattle-3d-desk-light.webp" alt="Lumen Field and T-Mobile Park in 3D on one ground: a football stadium under canopies and a ballpark under its roof." width="640">
</picture>
<br><em>Seattle's SoDo.</em>
</p>

### A fly-through

`mountFlythrough` flies one camera from a map to a real arena: the map falls to the city and the building, which rises into 3D, the roof lifts away, and the camera comes in to a seat, where a made-up play runs on the ice ([the fly-through](./docs/flythrough.md)).

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/turning-flythrough-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/turning-flythrough-desk-light.webp" alt="The fly-through, sped up: a map of North America with a pin on Seattle, the building's outline in the city, Climate Pledge Arena rising into 3D and turning, the roof lifting away, a seat's view across the rink and a play on the ice." width="640">
</picture>
<br><em>The fly-through to Climate Pledge Arena, sped up.</em>
</p>

### Who judges where

`drawJudging` puts each judo mat's officials by seat in the picture and in a chart ([judging](./docs/judging.md)).

The broadcast view puts the mat large, with the officials on a board at its side; `judgingPrint` prints one mat to an A4 or US letter page.

### A table tennis area

A table in the ITTF's playing area, 14 m by 7 m, with surrounds and chairs ([courts](./docs/courts.md#the-table-tennis-playing-area)).

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/tabletennis-area-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/tabletennis-area-desk-light.webp" alt="A table tennis table in its playing area, with surrounds and the umpires' chairs" width="660">
</picture>
<br><em>The table in its playing area.</em>
</p>

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/tabletennis-area-3d-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/tabletennis-area-3d-desk-light.webp" alt="The same table area in 3D, from a low corner" width="660">
</picture>
<br><em>The same area in 3D.</em>
</p>

### A judo kata area

`budo: { style: "kata" }` is the IJF's kata area: a tape at the centre and one 3 m either side, and with `officials` the five judges and the coach's chair ([the budō page](./docs/budo.md#the-kata-area)).

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/judo-kata-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/judo-kata-desk-light.webp" alt="The IJF's kata area with the judges' seats above and the coach's chair below" width="660">
</picture>
<br><em>The kata area, its judges and the coach's chair.</em>
</p>

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/judo-kata-tapes-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo-stadiums/main/docs/images/judo-kata-tapes-desk-light.webp" alt="Three short white tapes across the middle of a kata area" width="660">
</picture>
<br><em>Close up: the centre tape and the two starting tapes.</em>
</p>

### The combat sports

An MMA cage, rings and wrestling mats ([the combat sports page](./docs/combat.md)).

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

The [API reference](https://johnmorrisdotca.github.io/kyogijo-stadiums/api.html) lists every export of every entry point with its signature and doc comment, made from the source by `pnpm site`. [Entry points](./docs/entry-points.md) says what each holds: the main one draws, the data and geometry ones stand apart, and `/mount`, `/turn`, `/react`, `/element` and `/element/define` put a drawing in a page.

Every function is pure: it returns new values and never changes what it was given.

## Theming

Nothing is branded. The drawing is coloured by custom properties on its `svg`, with a light set and a dark set that follow the device (or `data-theme`, or `theme` in the options); a page's own rule always wins. Each property is listed in [theming](./docs/theming.md).

## Limits

Each is held by a test: forty-three sports, ten soccer pitches and ten providers, 94 ballparks, 64 grounds, six units, forty-eight frames, a drawing of under 22 kB. The table, made from the code, is [limits](./docs/limits.md).

## Accessibility

- Each drawing is an `img` with a `<title>` and a `<desc>` that say the teams, the score, the surface and the result, in English or Japanese.
- A score is also text, words stay upright when the surface lies tall, colour is never the only sign, and each data layer has a table for a screen reader.
- Nothing moves by itself: a replay plays when asked, steps for a reader who prefers reduced motion, and pauses when the page is hidden.

The rest is in [accessibility](./docs/accessibility.md).

## Browser and runtime support

Any browser with ES modules, `:where()` and SVG 2's `href` on images: Chrome and Edge 88, Safari 14, Firefox 78, all from 2021 on. The custom element needs shadow DOM and `part`. The drawing function runs on Node 22 or later and in any runtime: it touches no DOM. The demo is played in Chromium and WebKit, at a phone's width and a desk's, before every release.

## Languages

English and Japanese: the title, the description and the statuses of a drawing, the sentence of each change in `eraChanges`, and the demo. The words are listed beside their English in [the Japanese of Kyogijo](./docs/strings-ja.md). Team names, competitions and dates are written as you give them, in any language. Not yet: the Japanese read by a native reader (the demo says so when it is shown).

## Roadmap

Not here yet, each welcome as an [issue](https://github.com/johnmorrisdotca/kyogijo-stadiums/issues):

- **More surfaces**: the FIBA and college courts, the international rink, rugby pitches, soccer's beach and street formats.
- **More real venues**: the NBA's, NFL's and MLB's, and more districts.
- **More parks of the past**: the 19th-century grounds, and the parks whose articles give no distances yet.
- **More charts on data layers**: a formation chart, a pass sonar chart and a Voronoi chart of their own (the layers exist; see [team shape](./docs/team-shape.md)).
- **Football in a different standard**: the college and high-school hash marks.

Left out on purpose: statistics, rosters and schedules.

## Architecture

The drawing is plain functions over plain data with no DOM and no dependency. The dimensions are in one file, the ballparks are generated from a reviewed list, and each surface is a function that returns its markup and the places the teams and the score go. Every entry point stands apart. The files are in [architecture](./docs/architecture.md).

## The name

*Kyogijo* (競技場, kyōgijō, きょうぎじょう) is Japanese for a sports ground, the place a contest is held, written with 競技, "contest", and 場, "place". "Stadiums" is added in English so that the name says what it draws. The long vowels are written without a macron, as in the other packages of the family.

## Where it comes from, and where it is used

Kyogijo Stadiums was made for [SPX Stats](https://spxn.com), the historical record of the NHL, NBA, MLB, NFL and CFL, to show the score of a game or a championship on the surface it was played on, with each team's name and logo at its side. Its Japanese names and parks are there because the same author makes a Japanese study app and a site for Japanese board games.

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
pnpm test:package   # pack, install and import it, as a user would
pnpm test:demo      # build the site and play it in a real browser, at a phone's width and a desk's
pnpm site           # build the demo and the docs site into site/, as the Pages workflow publishes it
pnpm screenshots:readme   # remake every README picture from the built demo, in light and dark
pnpm test:readme    # run every example in the README and the docs against the built package
pnpm docs:make      # rewrite what the docs make from the source: the Japanese words and the tables
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). The commands are under [Development](#development).

Please follow the [code of conduct](./CODE_OF_CONDUCT.md). Text, a colour or a logo address that gets out of the drawing, or a name that makes it run for a very long time, is for the [security policy](./SECURITY.md), not a public issue.

## Changes

See [CHANGELOG.md](./CHANGELOG.md). The first release, 0.1.0, draws the twenty surfaces and the 94 ballparks, with scores, badges, wide and tall layouts, a custom element and a frame.

## Licence

The code is [MIT](./LICENSE) © John Morris. The ballparks' fence distances are facts published in Wikipedia's articles, re-expressed as numbers, with each article and revision cited in [NOTICE.md](./NOTICE.md) (shipped in the package) and [docs/references.md](./docs/references.md). The surfaces' dimensions are facts from the rulebooks and diagrams, cited in [docs/sources.md](./docs/sources.md).

| Data | Made from | Terms |
| --- | --- | --- |
| The dimensions of the football fields, the rink and the court | The NFL, CFL, IFAF, NHL and NBA rules and diagrams | Facts; no text or drawing copied |
| The soccer pitch's dimensions and the providers' coordinates | The IFAB and FIFA Futsal Laws of the Game, UEFA, MLS, NCAA and FA documents, and each provider's own pages (docs/sources.md) | Facts; no text or drawing copied |
| The fence distances of 94 ballparks | The English and Japanese Wikipedia articles of each, at the revision cited | Facts; the articles are CC BY-SA 4.0 and none of their text is used |
| The Wikidata item of each ballpark | Wikidata, as linked from the cited article | CC0 |
| The outlines of the real venues and stadiums | OpenStreetMap, read 2026-10-20, kept as returned | ODbL 1.0, (c) OpenStreetMap contributors, in files of their own; a drawing carries the credit |
| 64 soccer grounds | English Wikipedia articles at the revision cited; Wikidata | Facts; CC BY-SA 4.0 articles, no text used; CC0 |
| The demo's countries and their logos | The names and codes of real countries; the maple leaf, the sun disc and the roundels are drawn for this package | MIT |
| The demo's country flags | [Hata](https://github.com/johnmorrisdotca/hata), a development dependency whose flags are loaded into the demo site with its licence and notice; the package itself draws none | MIT, and its flags' own licences in its NOTICE.md |
| The demo's trophies, medals, balls and crests | [Dougu Sports](https://github.com/johnmorrisdotca/dougu-sports), a development dependency copied into the demo site with its licences; the package itself draws none | MIT, and its sources' licences in its NOTICE.md |
