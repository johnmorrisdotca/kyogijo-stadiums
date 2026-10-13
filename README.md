<h1 align="center">Kyogijo <sub>競技場</sub></h1>

<p align="center"><strong>Sports surfaces as SVG, drawn to scale, with the score on them.</strong><br>
The NFL, CFL and IFAF football fields, the NHL rink, the NBA court, the soccer pitch and futsal court, and the baseball field of every MLB ballpark, current and past, and every NPB home park, each drawn from its rulebook or its published distances, with each team's name and logo on its side and the score in the middle. Wide or tall, light or dark, a compact badge for a list, a helper for React, a custom element and a frame for a page that runs no script. One function, no dependencies.</p>

<p align="center">
  <a href="https://github.com/johnmorrisdotca/kyogijo/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/johnmorrisdotca/kyogijo/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@johnmorrisdotca/kyogijo"><img alt="npm" src="https://img.shields.io/npm/v/@johnmorrisdotca/kyogijo?color=2f5d4a"></a>
  <a href="./LICENSE"><img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-2f5d4a"></a>
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-2f5d4a">
  <img alt="TypeScript" src="https://img.shields.io/badge/types-TypeScript-3178c6">
</p>

<p align="center"><a href="https://johnmorrisdotca.github.io/kyogijo/"><strong>Open the demo →</strong></a> · <a href="https://johnmorrisdotca.github.io/kyogijo/api.html">API reference</a></p>

<table align="center">
<tr>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo/main/docs/images/hero-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo/main/docs/images/hero-desk-light.webp" alt="The demo on a desk, in English: the page header with the language chooser, five cloth patches and the Help switch, and an NHL rink drawn wide on green felt, with a made-up game on it, the Northern Owls and their owl emblem on the left, the Lakeshore Anchors and their anchor on the right, and a panel of the score 3 to 2, Final/OT, in the middle. The controls for the sport, the layout and the teams are on the right." width="640">
</picture>
<br><em>The demo on a desk: a rink, with the teams on their sides and the score in the middle.</em>
</td>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo/main/docs/images/hero-phone-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo/main/docs/images/hero-phone-light.webp" alt="The demo on a phone: a football field turned a quarter to stand tall, the visiting team's blue end zone at the top and the home team's red end zone at the bottom, each with its logo and name written across it, the yard numbers upright, and a score panel at midfield reading 27 to 24, Final." width="240">
</picture>
<br><em>On a phone the same surface stands tall, the words still upright.</em>
</td>
</tr>
</table>

Kyogijo draws the places a game is played on, and puts a game on them. It was made to show the score of a game or a championship on the surface it was played on: the teams at their ends, the score in the middle, a label for what it was. The surfaces are drawn to scale from the rulebooks, so that a football field has its hash marks where the rules put them and a ballpark has its fence where its published distances put it.

## In 30 seconds

```sh
npm install @johnmorrisdotca/kyogijo
```

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo";

const svg = drawKyogijo({
  sport: "nhl",
  away: { name: "Northern Owls", abbr: "NOW", score: 3, color: "#3a2d6b" },
  home: { name: "Lakeshore Anchors", abbr: "LSA", score: 2, color: "#0f7a7a" },
  status: "final-ot",
  competition: "Cup Final, Game 7",
});
console.log(svg.startsWith("<svg"), svg.includes("NORTHERN OWLS"));
// true true
```

`svg` is a string of SVG: put it in a page with `innerHTML`, write it to a file, or send it in an email. Or, with no build step at all:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo@0/dist/element-define.js"></script>
<kyogijo-field sport="nhl" orientation="auto" away="Northern Owls" home="Lakeshore Anchors" away-score="3" home-score="2" status="final-ot"></kyogijo-field>
```

## Who it is for

- **A results page or a stats site** that has the score of a game and wants a picture of where it was played: the teams, the score, a line for the round and the date, with the winner clear.
- **A list of games** that needs a compact strip for each, small enough for a phone, with the team, the score and the state of the game.
- **Anyone drawing a rink, a field, a court or a ballpark** for a poster, a diagram or a lesson, who wants the dimensions right and the colours their own.
- **A site that uses a framework or none**: the drawing is a string, so it works from a server, a build step, a React component, a Vue or Svelte template, a custom element or a frame.

## Features

- **Seven surfaces, to scale.** The NFL field (360 by 160 feet with its end zones), the CFL field (450 by 195), the IFAF field, the NHL rink (200 by 85 with a 28-foot corner radius), the NBA court (94 by 50), the soccer pitch (105 by 68 metres, in ten sizes and variants) and the baseball field, with the markings of each: yard lines, hash marks, numbers and goal posts; blue and red lines, five face-off circles, creases and nets; keys, three-point lines and restricted areas; penalty areas, goal areas, arcs and goals; infield, mound, bases, foul lines and fence. Every figure is cited in [docs/sources.md](./docs/sources.md).
- **Soccer, to the Laws.** A pitch from Law 1 of the IFAB Laws of the Game of any size, with presets (international, UEFA, MLS, NCAA, the FA's 9-, 7- and 5-a-side, FIFA's futsal), half pitches, five mowing patterns, four goal styles, penalties and extra time in a score, and the pitch drawn in the coordinates of Opta, StatsBomb, Wyscout, Tracab, Metrica, SkillCorner, Second Spectrum or Impect, with `rescale` between them. See [Soccer](#soccer).
- **Every ballpark.** The 30 current MLB parks and 44 that MLB clubs have left (the Polo Grounds, Ebbets Field, Forbes Field, Tiger Stadium, the Astrodome and more), and the 12 home parks of Nippon Professional Baseball with eight other NPB grounds, past and present, each with its fence drawn from the distances published for it. A named park is one option (`park: "fenway-park"`), and a past park whose fence moved is drawn as it stood in a season (`year: 1915`); the 94 are in `PARKS`, each with its Wikidata item.
- **Score mode.** Each team's name and logo on its side (the end zones of a football field, the ends of the ice, the halves of the court, the dugouts of a ballpark) and the score large in the middle, with the competition, the status (Final, OT, SO, a period, an inning) and the date, and the winner emphasised.
- **Wide, tall or fit the box.** Every surface lies wide or tall. Tall turns it a quarter, keeps every word upright, and puts the teams top and bottom. With `orientation: "auto"` the browser helpers watch the box and lay it out again when its shape changes.
- **Data on the surface.** Points, lines, arrows and text over any surface, in its feet or a provider's frame, cut to its outline, with a title, a description and a table for each layer.
- **A compact badge and a compact card.** One strip for a list, or the surface with that strip under it.
- **Light and dark**, by the device or the page, and every colour a custom property; a basketball court's paint, border, wood and baseline words are options, with five looks to start from.
- **Accessible.** Each drawing is an `img` with a title and a description that say the surface and the result, in English or Japanese.
- **Four ways in.** A function that returns SVG text; a helper that draws into a container and keeps it laid out; a standard custom element; a frame for pages that run no script. A React helper that does not import React.
- **No dependencies**, no network requests, nothing stored. Text, colours and logo addresses that come from outside are made safe before they are drawn.

### What's in it

| Part | What it is |
| --- | --- |
| `drawKyogijo`, `drawSurface`, `drawScore`, `drawBadge` | The drawing, as a string of SVG. |
| `SPORTS`, `PARKS`, `PARK_IDS`, `COURT_THEMES` | The seven sports, the 94 ballparks, the court looks. |
| `SOCCER_PITCHES`, `SOCCER_PROVIDERS`, `rescale`, `soccerSpec` | The soccer pitches, the data providers' coordinate systems and the map between them. |
| `@johnmorrisdotca/kyogijo/geometry` | The dimensions of every surface in feet, in any unit, and the functions that follow from them. |
| `@johnmorrisdotca/kyogijo/frames` | Providers' coordinate frames and the functions that put their points on a surface. |
| `@johnmorrisdotca/kyogijo/layers` | `drawLayers`, `layerTable` and the layer types. |
| `@johnmorrisdotca/kyogijo/parks` | The ballparks and the article each was read from. |
| `@johnmorrisdotca/kyogijo/mount` | `mountKyogijo`: draw into a container and keep it laid out; `kyogijoElement`. |
| `@johnmorrisdotca/kyogijo/react` | `kyogijoProps` and `createKyogijo`, for React, without depending on it. |
| `@johnmorrisdotca/kyogijo/element` | The `<kyogijo-field>` class; `element/define` registers it. |

## Use it in your project

### Install

```sh
npm install @johnmorrisdotca/kyogijo
# or: pnpm add @johnmorrisdotca/kyogijo
# or: yarn add @johnmorrisdotca/kyogijo
```

It needs Node 22 or later on a server, and any current browser. It is plain ES modules, with types. Once it is on npm the same files are on the CDNs: `https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo@0/+esm` is the package as one module for the browser, and `https://unpkg.com/@johnmorrisdotca/kyogijo@0/dist/index.js` the file itself.

### 1. A string of SVG

`drawKyogijo(options)` returns SVG text. It needs no DOM, so it runs in Node, an edge function, a build step or a browser. The same options always give the same text.

### 2. A container in the browser

`mountKyogijo(element, options)` draws into an element and returns `update`, `svg`, `orientation` and `destroy`. With `orientation: "auto"` it watches the element and draws again, tall or wide, when its shape changes.

### 3. A custom element

`<kyogijo-field>` is a standard custom element. Import `element/define` once, from the package or a CDN, and use the tag with attributes. See [Examples](#the-element-in-a-page) for the attributes and the parts.

### 4. A frame

For a page that cannot run scripts of its own, the demo site serves `embed.html`, which draws what its address says. See [A frame](#a-frame-for-a-page-with-no-script).

### What a developer gets

- Types for every option and every export, and the doc comment of each export beside it in an editor.
- A drawing that is a pure function of its options: it can be cached, compared and tested.
- Entry points that stand apart: the geometry and the parks need nothing else, and the element is not loaded until it is imported.

### In a framework

The drawing is a string, so every framework can show it. React has a helper; Vue, Svelte and plain HTML use the custom element or `innerHTML`. See the examples below.

## Examples

### A score on the rink

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo";

const svg = drawKyogijo({
  sport: "nhl",
  away: { name: "Northern Owls", abbr: "NOW", score: 3, color: "#3a2d6b" },
  home: { name: "Lakeshore Anchors", abbr: "LSA", score: 2, color: "#0f7a7a" },
  status: "final-ot",
  competition: "Cup Final, Game 7",
  date: "June 24",
});
console.log(svg.includes("Cup Final, Game 7"), svg.includes("Final/OT"));
// true true
```

### A bare surface

```ts
import { drawSurface } from "@johnmorrisdotca/kyogijo";

// No teams: just the NFL field at its true shape, 120 by 53⅓ yards with 12 feet of ground round it.
const svg = drawSurface({ sport: "nfl" });
console.log(/viewBox="-12 -12 384 184"/.test(svg));
// true
```

### Tall for a phone

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo";

const game = { away: { name: "Harbour City Gulls", score: 27 }, home: { name: "Prairie Ridge Bison", score: 24 }, status: "final" };
const wide = drawKyogijo({ sport: "nfl", ...game, orientation: "landscape" });
const tall = drawKyogijo({ sport: "nfl", ...game, orientation: "portrait" });
const box = (svg: string) => /viewBox="[^ ]+ [^ ]+ ([^ ]+) ([^ "]+)"/.exec(svg)!.slice(1).map(Number);
console.log(box(wide), box(tall));
// [ 384, 184 ] [ 184, 384 ]
```

### A ballpark, by name

```ts
import { PARKS, drawKyogijo } from "@johnmorrisdotca/kyogijo";

const park = PARKS["hanshin-koshien-stadium"];
console.log(park.name, park.nameJa, park.points.length);
// Hanshin Koshien Stadium 阪神甲子園球場 5
const svg = drawKyogijo({ sport: "mlb", park: "hanshin-koshien-stadium", language: "ja" });
console.log(svg.includes("阪神甲子園球場のグラウンド"));
// true
```

### A ballpark of the past, in a season

```ts
import { PARKS, parkByWikidata, parkPointsIn, drawKyogijo } from "@johnmorrisdotca/kyogijo";

const polo = PARKS["polo-grounds"];
console.log(polo.name, polo.wikidata, polo.from, polo.to, polo.periods?.length);
// Polo Grounds Q1276360 1891 1963 2
console.log(parkPointsIn(polo, 1915).map(([, feet]) => feet), parkPointsIn(polo, 1930).length);
// [ 277, 433, 258 ] 13
console.log(parkByWikidata("Q1276360") === polo);
// true
const svg = drawKyogijo({ sport: "mlb", park: "polo-grounds", year: 1915 });
console.log(svg === drawKyogijo({ sport: "mlb", park: "polo-grounds", year: 1930 }));
// false
```

### Your own fence

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo";

// The usual 330, 375, 400, 375 and 330 feet, with a short porch in left and a deep centre.
const svg = drawKyogijo({ sport: "mlb", fence: { left: 310, center: 420 } });
console.log(svg.includes('class="ky-fence"'));
// true
```

### A badge for a list

```ts
import { drawBadge } from "@johnmorrisdotca/kyogijo";

const badge = drawBadge({
  sport: "nba",
  away: { name: "Summit Peaks", abbr: "SMT", score: 98, color: "#14233f" },
  home: { name: "Metro Bolts", abbr: "MTB", score: 104, color: "#c2410c" },
  status: "Q4 2:31",
});
console.log(/viewBox="0 0 440 64"/.test(badge));
// true
```

### A court of your own look

```ts
import { COURT_THEMES, drawKyogijo } from "@johnmorrisdotca/kyogijo";

const svg = drawKyogijo({
  sport: "nba",
  court: { ...COURT_THEMES.twoTone, baselineText: ["SUMMIT PEAKS", "METRO BOLTS"], paintThreePoint: true },
});
console.log(svg.includes("--ky-key:#1e4f8f"), svg.includes("METRO BOLTS"));
// true true
```

### A page that moves

```ts no-run
import { mountKyogijo } from "@johnmorrisdotca/kyogijo/mount";

const card = mountKyogijo(document.querySelector("#game")!, {
  sport: "nhl",
  orientation: "auto",
  away: { name: "Northern Owls", score: 1 },
  home: { name: "Lakeshore Anchors", score: 0 },
  status: "live",
});
// Each goal: draw again with the new score. The layout follows the box.
card.update({ sport: "nhl", orientation: "auto", away: { name: "Northern Owls", score: 2 }, home: { name: "Lakeshore Anchors", score: 0 }, status: "live" });
```

### A file on a server

```js no-run
import { writeFileSync } from "node:fs";
import { drawKyogijo } from "@johnmorrisdotca/kyogijo";

// The drawing carries its own stylesheet, so a saved file stands alone: open it in a browser, or put it in an image tag.
writeFileSync("rink.svg", drawKyogijo({ sport: "nhl", theme: "dark" }));
```

### The element in a page

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo@0/dist/element-define.js"></script>

<!-- score is home-away; home-score and away-score say it the other way -->
<kyogijo-field sport="nba" size="compact" orientation="auto"
  home="Metro Bolts" away="Summit Peaks" score="112-108"
  home-color="#c2410c" away-color="#14233f" status="final"></kyogijo-field>

<style>
  kyogijo-field { --ky-plate: rgba(0, 0, 0, .6); }
  kyogijo-field::part(plate) { filter: drop-shadow(0 2px 4px rgba(0, 0, 0, .3)); }
</style>
```

The attributes are `sport`, `size`, `theme`, `language`, `orientation`, `park`, `year`, `pitch`, `pitch-type`, `half`, `goals`, `stripe-pattern`, `corner-flags`, `detail`, `margin`, `stripes`, `exact-lines`, `uppercase`, `home`, `away`, `home-abbr`, `away-abbr`, `home-score`, `away-score`, `home-penalties`, `away-penalties`, `score`, `home-logo`, `away-logo`, `home-color`, `away-color`, `status`, `competition`, `date`, `label`, `winner`, `home-side`, `description` and `options` (any other option, as JSON). The parts are `figure`, `svg`, `surface`, `plate`, `team`, `home`, `away`, `score`, `home-score`, `away-score` and `badge`.

### In React

```tsx no-run
import React from "react";
import { createKyogijo, kyogijoProps } from "@johnmorrisdotca/kyogijo/react";

// A component made from your React, which measures its box for orientation="auto":
const Kyogijo = createKyogijo(React);
export const Game = () => (
  <Kyogijo sport="nhl" orientation="auto" away={{ name: "Northern Owls", score: 3 }} home={{ name: "Lakeshore Anchors", score: 2 }} status="final" />
);

// Or props to spread onto your own element; nothing here imports React:
export const Plain = () => <div {...kyogijoProps({ sport: "nba" })} />;
```

### In Vue

```vue
<script setup>
import "@johnmorrisdotca/kyogijo/element/define";
</script>

<template>
  <kyogijo-field sport="nfl" orientation="auto" away="Harbour City Gulls" home="Prairie Ridge Bison" away-score="27" home-score="24" status="final" />
</template>
```

Tell Vue the tag is a custom element with `compilerOptions.isCustomElement: (tag) => tag === "kyogijo-field"`.

### In Svelte

```svelte
<script>
  import "@johnmorrisdotca/kyogijo/element/define";
  import { drawKyogijo } from "@johnmorrisdotca/kyogijo";
  export let home = 0;
  export let away = 0;
  $: svg = drawKyogijo({ sport: "nhl", away: { name: "Northern Owls", score: away }, home: { name: "Lakeshore Anchors", score: home } });
</script>

<!-- the string of SVG, or the element: either works -->
{@html svg}
<kyogijo-field sport="nhl" away="Northern Owls" home="Lakeshore Anchors" away-score={away} home-score={home} />
```

### A frame for a page with no script

For a page that cannot run scripts (a site builder, a forum, a newsletter archive), the demo site serves a frame that draws what its address says. Paste the tag; no script is yours to run.

```html
<iframe
  src="https://johnmorrisdotca.github.io/kyogijo/embed.html?sport=nhl&away=Northern+Owls&home=Lakeshore+Anchors&ascore=3&hscore=2&status=final-ot"
  title="Northern Owls 3, Lakeshore Anchors 2, Final/OT"
  loading="lazy"
  style="width:100%;aspect-ratio:2.3;border:0"
></iframe>
```

The address takes `sport`, `park`, `year`, `size`, `orientation` (it fits its frame by default), `theme`, `lang`, `away`, `home`, `aabbr`, `habbr`, `ascore`, `hscore`, `acolor`, `hcolor` (six hex digits, no `#`), `alogo`, `hlogo` (an https address), `status`, `competition`, `date`, `label` and `winner`. The demo's Embed section writes the tag for what you have chosen.

## The surfaces

Every dimension is kept in feet in the code (`@johnmorrisdotca/kyogijo/geometry`) and can be had in any unit (see [Units](#units)), and each is cited in [docs/sources.md](./docs/sources.md).

| `sport` | Surface | Size | Drawn |
| --- | --- | --- | --- |
| `nfl` | NFL field | 120 by 53⅓ yards with 10-yard end zones | yard lines every 5 yards, hash marks 70 feet 9 inches from each sideline, the sideline ticks, numbers every 10 yards upright and upside down with arrows, goal posts on the end lines, pylons |
| `cfl` | CFL field | 150 by 65 yards with 20-yard end zones | the same lines, hash marks 28 yards from each sideline, the centre marked C, goal posts on the goal lines |
| `ifaf` | IFAF field | 120 by 53⅓ yards with 10-yard end zones | hash marks 60 feet from each sideline, numbers 27 feet from the sideline, posts on the end lines |
| `nhl` | NHL rink | 200 by 85 feet, corners of 28 feet | goal lines 11 feet and blue lines 75 feet from the ends, the red line, five face-off circles and four more spots, creases, nets, trapezoids, the referee's crease |
| `nba` | NBA court | 94 by 50 feet | 16-foot keys, free-throw circles, three-point lines of 23 feet 9 inches and 22 feet in the corners, restricted areas, backboards and rims, the small marks |
| `soccer` | Soccer pitch | 105 by 68 m, or any size, or a preset | the halfway line and centre circle, penalty areas, goal areas, marks, arcs, corner arcs and flags, the marks off the field, goals |
| `mlb` | Baseball field | 90-foot bases, a fence from the park's distances | foul lines, the infield cut by a 95-foot arc round the mound, bases, the plate, batter's boxes, the running lane, warning track and fence |

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo/main/docs/images/football-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo/main/docs/images/football-desk-light.webp" alt="A football field drawn wide on the demo's felt: the visiting team's blue end zone on the left with its gull emblem and its name written along it, the home team's rust-red end zone on the right with its bison, the yard lines, hash marks and upright and upside-down yard numbers between them, and the score panel at midfield reading 27 to 24, Final, Championship Game." width="720">
</picture>
<br><em>A football field: the end zones in the teams' colours, the score at midfield.</em>
</p>

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo/main/docs/images/court-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo/main/docs/images/court-desk-light.webp" alt="A basketball court in the two-tone look: a pale floor with a deep blue key, centre circle and border, the words SUMMIT PEAKS and METRO BOLTS along the baselines, each team's emblem and name on its half, and the score panel at centre court reading 108 to 112, Finals, Game 6." width="640">
</picture>
<br><em>A court in a look of its own: the paint, the border and the words on the baselines are options.</em>
</p>

Lines are drawn a little thicker than they are painted, as broadcast graphics do, so that they stay in view at a small size; `exactLines: true` draws them at their true widths.

## Soccer

`sport: "soccer"` draws a pitch from Law 1 of the IFAB Laws of the Game: the halfway line, the centre circle of 9.15 m, both penalty areas (16.5 m), goal areas (5.5 m), penalty marks (11 m), arcs, corner arcs (1 m) with flags, the marks off the field that show a corner kick's distance, and goals of 7.32 by 2.44 m. In a score each team's name is in its penalty area, in its colour.

| Option | What it does |
| --- | --- |
| `pitch` | A preset or a size: `{ length, width, unit }` in metres (or `yd`, `ft`, `in`, `cm`, `mm`; `units` sets the default). The international 105 by 68 m by default. |
| `half` | `left` or `right`: one half, for a bare pitch. A drawing with teams always shows the whole. |
| `stripePattern` | `bands` (19, the default), `wide`, `narrow`, `lengthwise`, `checks`, `diagonal` or `none`; `stripes: false` also turns them off. |
| `goals` | `box` (the net, the default), `line`, `strip` or `none`. `cornerFlags` turns the flags off. |
| `pitchType` | Draw the pitch in a data provider's own coordinates (below). |

| `pitch` | Size | Read from |
| --- | --- | --- |
| `fifa`, `uefa` | 105 by 68 m | Law 1; the UEFA Stadium Infrastructure Regulations, 5.01 (categories 3 and 4) |
| `mls`, `ncaa` | 110 by 70 yd (the MLS's least), 120 by 75 yd (the NCAA's best) | the MLS Competition Guidelines; the NCAA rules, Rule 1.1.1 |
| `law-min`, `law-max` | 90 by 45 m, 120 by 90 m | Law 1.3 |
| `9-a-side`, `7-a-side`, `5-a-side` | 80 by 50, 60 by 40 and 40 by 30 yd | The FA Handbook, Section 38; the markings of the FA's small-sided laws |
| `futsal` | 40 by 20 m, quarter-circle areas, marks at 6 and 10 m | FIFA's Futsal Laws, Law 1 |

`status` also takes `final-aet`, `final-pens`, `extra-time` and `penalties`. A team's `penalties` is its goals in the shoot-out: both are written with the status (`Final · 4-2 pens`) and a level game goes to the winner of the shoot-out.

```ts
import { drawKyogijo, soccerPitchClass, soccerSpec } from "@johnmorrisdotca/kyogijo";

const svg = drawKyogijo({
  sport: "soccer",
  away: { name: "Northern Owls", abbr: "NOW", score: 2, penalties: 4, color: "#3a2d6b" },
  home: { name: "Lakeshore Anchors", abbr: "LSA", score: 2, penalties: 2, color: "#0f7a7a" },
  status: "final-pens",
  competition: "Cup Final",
});
console.log(svg.includes("Final · 4-2 pens"), svg.includes("Northern Owls won 4-2 on penalties."));
// true true
const pitch = soccerSpec({ length: 110, width: 70, unit: "yd" });
console.log(pitch.length.toFixed(2), pitch.width.toFixed(2), soccerPitchClass(pitch.length, pitch.width));
// 100.58 64.01 international
```

### Data providers

A provider writes the pitch in its own numbers: Opta's 0 to 100 with y up, StatsBomb's 120 by 80 yards with y down, Tracab's centimetres from the centre spot, Metrica's 0 to 1. `SOCCER_PROVIDERS` has the ten (`opta`, `statsbomb`, `wyscout`, `tracab`, `metrica`, `skillcorner`, `secondspectrum`, `impect`, `uefa`, `international`), each as a frame: its extents, which way y runs and where it puts the penalty area, the goal area, the mark and the posts. Opta, StatsBomb and Wyscout fix those numbers, so their lines are not where the Laws put them on a 105 by 68 m pitch. The others follow the pitch's size.

- `pitchType: "opta"` stands the lines where the provider puts them and adds an empty `<g class="ky-data">` whose `transform` turns the provider's own x and y into the pitch's metres: put raw data in it and it plots. (A circle in it is stretched, as a provider's units are not square.)
- `rescale(from, to)` maps one provider's points to another's, piecewise linear between the landmarks (the goal line, goal area, mark, penalty area, halfway line, touchlines and posts), so that a point on the penalty line stays on it. Its `inverse` goes back. The providers are also frames of the [frames module](#coordinate-frames), so `toSurface` and `convert` take them by name with a `size`.

```ts
import { drawKyogijo, rescale } from "@johnmorrisdotca/kyogijo";
import { toSurface } from "@johnmorrisdotca/kyogijo/frames";

const svg = drawKyogijo({ sport: "soccer", pitchType: "opta", id: "o" });
console.log(/<g class="ky-data" data-frame="opta" transform="matrix\(1.05 0 0 -0.68 0 68\)"\/>/.test(svg));
// true
// Opta's penalty line, 17 from the goal line, is StatsBomb's, 18 yards from it.
console.log(rescale("opta", "statsbomb")(83, 50));
// [ 102, 40 ]
console.log(toSurface([[50, 50]], { from: "opta", size: { length: 105, width: 68, unit: "m" } }).map((p) => p.map(Math.round)));
// [ [ 172, 112 ] ]
```

## Ballparks

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo/main/docs/images/ballpark-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo/main/docs/images/ballpark-desk-light.webp" alt="The baseball field of Hanshin Koshien Stadium with the outfield fence drawn through its published distances, 95 metres at the lines and 118 metres in the alleys and the middle, with mown arcs on the grass, the warning track, the infield dirt, and a red and a green panel in the foul ground at the bottom for the teams' dugouts." width="640">
</picture>
<br><em>A ballpark's fence, drawn through the distances its article publishes.</em>
</p>

`park` takes a key of `PARKS`, and `year` a season for a past park whose fence moved. The fence is a smooth curve through the distances the park's article publishes (the foul lines, the alleys, the middle), so that it never swings out past them. `fence: { left, leftCenter, center, rightCenter, right }` lays your own distances over a park's or over the generic field of 330, 375, 400, 375 and 330 feet.

| League | Parks |
| --- | --- |
| MLB, current | the 30 current parks, from `oriole-park-at-camden-yards` to `oracle-park` |
| MLB, past | the 44 parks clubs have left, from `baker-bowl` (1887) to `turner-field` (2016), by their first season of MLB use: `baker-bowl`, `exposition-park-pittsburgh`, `polo-grounds`, `south-end-grounds`, `huntington-avenue-grounds`, `league-park-cleveland`, `sportsmans-park`, `hilltop-park`, `forbes-field`, `shibe-park`, `comiskey-park`, `griffith-stadium`, `crosley-field`, `tiger-stadium`, `ebbets-field`, `braves-field`, `yankee-stadium-1923`, `cleveland-stadium`, `milwaukee-county-stadium`, `baltimore-memorial-stadium`, `municipal-stadium-kansas-city`, `seals-stadium`, `candlestick-park`, `wrigley-field-los-angeles`, `metropolitan-stadium`, `colt-stadium`, `robert-f-kennedy-memorial-stadium`, `shea-stadium`, `astrodome`, `atlanta-fulton-county-stadium`, `busch-memorial-stadium`, `oakland-coliseum`, `sicks-stadium`, `jarry-park-stadium`, `three-rivers-stadium`, `riverfront-stadium`, `veterans-stadium`, `arlington-stadium`, `exhibition-stadium`, `olympic-stadium-montreal`, `metrodome`, `mile-high-stadium`, `globe-life-park-in-arlington`, `turner-field` |
| NPB, home parks | `tokyo-dome`, `hanshin-koshien-stadium`, `meiji-jingu-stadium`, `yokohama-stadium`, `vantelin-dome-nagoya`, `mazda-stadium-hiroshima`, `es-con-field-hokkaido`, `rakuten-mobile-park-miyagi`, `belluna-dome`, `zozo-marine-stadium`, `kyocera-dome-osaka`, `mizuho-paypay-dome-fukuoka` |
| NPB, other and past | `sapporo-dome`, `hotto-motto-field-kobe`, `hiroshima-municipal-stadium`, `korakuen-stadium`, `osaka-stadium`, `heiwadai-stadium`, `kawasaki-stadium`, `nagoya-stadium` |

Each park has its name in English (and in Japanese for the parks of Japan), its team, its city, `wikidata` (the Wikidata item of the ground, such as `Q49136` for Fenway Park, to join a park to other data; `parkByWikidata` finds a park by it), and the article and revision its figures were read from (`parkSourceUrl`). A past MLB park also has `status: "past"` and `from` and `to`, the first and last season an MLB club played there (the Polo Grounds, 1891 to 1963). `PARKS` has the park's last fence in `points`; where an article dates earlier fences they are in `periods`, each with its first and last season, and `year` (or `parkPointsIn(park, year)`) picks the one that stood that season: `drawKyogijo({ sport: "mlb", park: "polo-grounds", year: 1915 })` draws the 277, 433 and 258 feet of 1911 to 1922, not the 279, 483 and 258 of the Polo Grounds' last years. A park an article gives no distances for is not in `PARKS`; they are listed in [docs/references.md](./docs/references.md). The articles give distances and not directions, so the angle each figure is taken at is our reading of its label; see [docs/references.md](./docs/references.md). Japanese parks are measured in metres and converted once. A fence is not drawn with its wall's height or its quirks (the Green Monster, Tal's Hill).

## Units

Each surface keeps the unit its rulebook states its figures in. The drawing itself is made in feet, so a figure is one conversion away in either direction, and `units` says what the lengths you pass are in.

| Surface | Unit | Why |
| --- | --- | --- |
| `nfl`, `cfl`, `ifaf` | yards (`yd`) | the length of a field and its end zones are counted in yards |
| `nhl`, `nba` | feet (`ft`) | the rulebooks give feet and inches |
| `mlb` | feet (`ft`) | the Official Baseball Rules give feet |
| `soccer` | metres (`m`) | the Laws of the Game give metres, with yards beside them |
| NPB parks (`parkUnit`) | metres (`m`) | the parks of Japan publish their fence in metres; `PARKS` holds them in feet, converted once at 0.3048 metres to the foot |

`SURFACE_UNITS` is that table. The units are `ft`, `in`, `yd`, `m`, `cm` and `mm`; anything else is an error and not feet.

```ts
import { NHL, SURFACE_UNITS, convertLength, dimensionsOf, lengthsIn, surfaceSize } from "@johnmorrisdotca/kyogijo/geometry";
import { drawKyogijo } from "@johnmorrisdotca/kyogijo";

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

## Coordinate frames

A data provider puts a point on a rink or a field in its own numbers: the NHL's feet from centre ice, HockeyTech's canvas of 600 by 300, the NBA's tenths of a foot from the hoop. A `Frame` says how those numbers lie on the surface (their unit, range, origin, which way y grows, whether the surface's size matters, and the landmarks they map through), and `toSurface` and `fromSurface` move points between a frame and the drawing's own coordinates. `convert(from, to)` goes from one provider's frame to another's. The module is `@johnmorrisdotca/kyogijo/frames`, and each frame is cited in [docs/sources.md](./docs/sources.md).

| Frame | Sport | Unit and range | Origin | y grows | Ends |
| --- | --- | --- | --- | --- | --- |
| `nhl-api` | NHL | feet, x -100 to 100, y -42.5 to 42.5 | centre ice | up | fixed to the rink |
| `hockeytech` | NHL | canvas, x 0 to 600, y 0 to 300 | top left | down | fixed to the rink |
| `nba-stats` | NBA | tenths of a foot, x -250 to 250, y -52.5 to 887.5 | the hoop | towards half court | the basket attacked |
| `nfl-tracking` | NFL | yards, x 0 to 120, y 0 to 53.3 | bottom left of the field | up | fixed to the field |
| `mlbam` | MLB | image units, home plate at (125.42, 198.27) | top left | down | none |
| `retrosheet` | MLB | feet from home plate (zone centres: `RETROSHEET_ZONES`) | home plate | out | none |
| `opta`, `statsbomb`, `wyscout`, `tracab`, `metrica`, `skillcorner`, `secondspectrum`, `impect`, `uefa`, `international` | soccer | see [Soccer](#data-providers); a pitch of any size, so `size` is given | by provider | by provider | fixed to the pitch |

```ts
import { convert, fromSurface, toSurface } from "@johnmorrisdotca/kyogijo/frames";

// The right end-zone face-off dot: 69 feet from centre ice, 22 to one side.
console.log(toSurface([[69, 22]], { from: "nhl-api" }), toSurface([[507, 150 - (22 * 300) / 85]], { from: "hockeytech" })[0].map((n) => Math.round(n * 100) / 100));
// [ [ 169, 20.5 ] ] [ 169, 20.5 ]

// The same point in metres lands where the point in feet does, and goes back.
const metres = toSurface([[69, 22]], { from: "nhl-api", units: "m" });
console.log(metres[0].map((n) => n.toFixed(3)), fromSurface(metres, { to: "nhl-api", units: "m" })[0].map((n) => Math.round(n)));
// [ '51.511', '6.248' ] [ 69, 22 ]

// A team that attacked the left end in a period is turned a half turn, so that every shot attacks the right.
console.log(toSurface([[69, 22]], { from: "nhl-api", attacking: "left" }), convert("hockeytech", "nhl-api")([[600, 0]]));
// [ [ 31, 64.5 ] ] [ [ 100, 42.5 ] ]
```

- **Units, anchors and limits.** `units` is the unit of the surface's numbers (feet by default); `anchors` replace a frame's landmarks with your own for a venue whose markings differ, and `limits` keeps points on the surface (`"surface"`) or in a box. Anchors and limits are converted with `units`, not only the points.
- **Ends.** `attacking: "left"` turns points a half turn about the middle of the surface. `attackingIn("nhl", period, "right")` says which end a team attacks in a period (hockey changes ends every period, football after the first and third quarters, basketball at the half); for a period no rule here settles, pass `changedAfter`. A baseball frame has no ends and refuses `attacking`.
- **Your own frame.** `registerFrame(frame)` adds one to `FRAMES`, and `piecewise(landmarks)` is the mapper the frames use: straight between landmarks, so a frame whose axis bends (a pitch drawn at a provider's own figures) is a list of landmarks. A frame for a surface of any size takes its landmarks as a function of the surface's size, and `toSurface` is then given `size`.
- **Retrosheet's zones.** `zoneToPoint("8D")` is the centre of a hit-location sector in feet from home plate and `zoneAt([x, y])` the zone whose centre is nearest a point. The centres are read off Retrosheet's diagram and are good to a few feet.
- **What is ours.** The NHL API's sign of y, the NFL tracking data's corner of origin and the MLBAM scale of 2.5 feet a unit are conventions the sources read do not settle; each is marked in `note` and in [docs/sources.md](./docs/sources.md). Check one known point against your data before trusting a frame.

## Data layers

`layers` in the options of `drawKyogijo` and `drawSurface` lays data on the surface: a list of layers, each a `kind` (`points`, `lines`, `arrows` or `text`) with its `data` and a `style`. The marks sit in the surface's own frame, over the markings and under a score's panel, cut to its outline and upright when it lies tall.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo";

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

A miss is drawn hollow and a failed pass dashed. Shapes, colour rules, comets, units and frames are in [docs/layers.md](./docs/layers.md).

```ts
import { drawKyogijo, layerTable } from "@johnmorrisdotca/kyogijo";

const passes = {
  kind: "arrows",
  name: "passes",
  from: "nfl-tracking",
  data: [
    { x: 40, y: 30, x2: 62, y2: 18, outcome: "complete" },
    { x: 40, y: 30, x2: 55, y2: 44, outcome: "incomplete" },
  ],
  style: { curve: 0.1, comet: true },
} as const;

console.log(drawKyogijo({ sport: "nfl", orientation: "portrait", layers: [passes] }).includes("linearGradient"));
console.log(layerTable([passes]).includes("<caption>2 passes"));
// true
// true
```

`drawLayers(options, layers)` returns the group alone. `layerTable(layers)` returns an HTML table for each layer, for a screen reader. Each layer has a `<title>` and a `<desc>` ("24 shots", "By outcome: goal 3, shot 21."), and a mark's `title` is its tooltip.

## Score mode

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo/main/docs/images/badges-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo/main/docs/images/badges-desk-light.webp" alt="A list of eight score strips in the demo, each a team block with its emblem, a short name and its score at each end, in the team's colour, and in the middle a small picture of the sport and the state of the game, such as Final, Final/OT and 2nd period." width="640">
</picture>
<br><em>Badges for a list of games.</em>
</p>

Pass `home` and `away`. Each team has a `name`, an optional `abbr`, `score`, `penalties` (a soccer shoot-out), `logo`, `color` and `textColor`.

| Option | What it does |
| --- | --- |
| `size` | `full` (on the surface), `compact` (the surface with a strip under it) or `badge` (the strip alone). |
| `status` | `final`, `final-ot`, `final-so`, `final-aet`, `final-pens`, `live`, `half`, `extra-time`, `penalties`, `postponed` (translated), or any text such as `2nd period` or `Bottom 9th`. |
| `competition`, `date` | The round and the day, as written. |
| `label` | A line for the foot of the panel in place of the status and the date. |
| `winner` | `auto` (the leader once the status is a final one), `leader`, `none`, `home` or `away`. |
| `homeSide` | `right` (the default, as in "away at home") or `left`. |
| `uppercase` | Names in capitals. On by default. |

A team's logo is an `https:` or relative address, an image `data:` address, or the text of an SVG. It is drawn as an image, so it cannot run a script, and an address of any other kind is ignored. A team without a logo is its name alone.

## Layout

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo/main/docs/images/tall-phone-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/kyogijo/main/docs/images/tall-phone-light.webp" alt="A hockey rink standing tall on a phone, the same game as on the desk: the Northern Owls' emblem and name in the upper zone, the Lakeshore Anchors' in the lower, each reading upright, the score panel between them over the centre line." width="240">
</picture>
<br><em>The same game tall: the teams top and bottom, every word upright.</em>
</p>

`orientation` is `landscape` (the default), `portrait` or `auto`. Portrait turns the surface a quarter clockwise, so the away team is at the top and the home team at the bottom; every name, number and score is turned back so that it reads upright. `auto` follows `aspect`, the container's width over its height: in a string it is landscape unless `aspect` is given, and the browser helpers measure the container, draw again when its shape changes, and treat a container that is as tall as its content and under 560 pixels wide as tall.

A baseball field is already upright, so in portrait it stays as it is and the teams go in strips above and below it.

## API

The [API reference](https://johnmorrisdotca.github.io/kyogijo/api.html) lists every export of every entry point with its signature and its doc comment. It is made from the source by `pnpm site`, so it cannot fall behind the code.

| Entry | What it holds |
| --- | --- |
| `@johnmorrisdotca/kyogijo` | `drawKyogijo`, `drawSurface`, `drawScore`, `drawBadge`, `drawLayers`, `layerTable`, `describe`, `winnerOf`, `statusLabel`, `isPortrait`, `statusText`; `OUTCOMES`, `rampColour`; `SPORTS`, `COURT_THEMES`, `SOCCER`, `SOCCER_PITCHES`, `SOCCER_PROVIDERS`, `soccerSpec`, `soccerFrame`, `rescale`, `PARKS`, `PARK_IDS`, `parkById`, `parkByWikidata`, `parkPointsIn`, `parkSourceUrl`, `parkUnit`, `fenceFor`; `SURFACE_UNITS`, `UNITS`, `convertLength`; `safeColour`, `safeLogo`, `inkOn`; `fitLines`, `textWidth`, `abbreviate`, `capitals`; `KYOGIJO_STYLE`, `KYOGIJO_STRINGS`, `COLOR_PROPERTIES`, `VERSION` and the option types |
| `@johnmorrisdotca/kyogijo/geometry` | `FOOTBALL`, `NHL`, `NBA`, `MLB`, `SOCCER`, `SOCCER_PITCHES`, `soccerSpec`, `soccerPitchClass`, `fenceAt`, `fencePoints`, `threePointJoin`, `skinJoin`, `boardsY` and the other dimensions; `SURFACE_UNITS`, `convertLength`, `convertPoint`, `lengthsIn`, `dimensionsOf`, `surfaceSize`, `fenceIn` |
| `@johnmorrisdotca/kyogijo/frames` | `toSurface`, `fromSurface`, `convert`, `convertPoints`, `flipEnds`, `attackingIn`, `registerFrame`, `frameByName`, `framesOf`, `piecewise`, `span`, `FRAMES`, `RETROSHEET_ZONES`, `zoneToPoint`, `zoneAt`, `SOCCER_PROVIDERS`, `rescale` and the frame types |
| `@johnmorrisdotca/kyogijo/layers` | `drawLayers`, `layerTable`, `renderLayers`, `outlineOf`, `OUTCOMES`, `rampColour` and the layer types |
| `@johnmorrisdotca/kyogijo/parks` | `PARKS`, `PARK_IDS`, `parkById`, `parkByWikidata`, `parkPointsIn`, `parkSourceUrl`, `parkUnit`, `fenceFor` |
| `@johnmorrisdotca/kyogijo/mount` | `mountKyogijo`, `kyogijoElement`, `containerAspect` |
| `@johnmorrisdotca/kyogijo/react` | `kyogijoProps`, `kyogijoHtml`, `createKyogijo` |
| `@johnmorrisdotca/kyogijo/element` | `KyogijoField`, `defineKyogijoField`, `optionsFromAttributes`, `KYOGIJO_TAG`, `KYOGIJO_ATTRIBUTES` |
| `@johnmorrisdotca/kyogijo/element/define` | importing it registers `<kyogijo-field>` |

Every function is pure: it returns new values and never changes what it was given.

## Theming

Nothing is branded. The drawing is coloured by custom properties on its `svg`, with a light set and a dark set that follow the device (or `data-theme="light"` or `"dark"` on the page's root, or `theme` in the options). A page sets only the ones it wants different, on the drawing or on a container above it. The defaults sit in `:where()`, which has no weight, so a page's own rule always wins. `colors` in the options sets them from code.

| Property | What it colours | Light | Dark |
| --- | --- | --- | --- |
| `--ky-apron` | the ground round the surface | `#dcd8c9` | `#1b1f1c` |
| `--ky-surface` | turf, ice, wood or outfield grass | by sport | by sport |
| `--ky-surface-alt` | mown stripes and planks | by sport | by sport |
| `--ky-line` | painted lines | `#ffffff` | `#e9ece6` |
| `--ky-zone` | a football end zone no team colours | `#2d6a40` | `#1f4a2d` |
| `--ky-red`, `--ky-blue`, `--ky-crease` | the rink's lines, and the crease's fill | `#c8372d`, `#2a5db0`, `#bfd3ec` | `#d4574d`, `#5584d4`, `#8ea9cc` |
| `--ky-boards` | the boards, a court's border, a ballpark's fence | by sport | by sport |
| `--ky-key` | the paint of a court's keys | `#c25b3c` | `#8a3f2b` |
| `--ky-court` | a futsal court's floor | `#3b79ad` | `#2a5478` |
| `--ky-dirt`, `--ky-foul`, `--ky-infield` | the baseball field | `#c28e5c`, `#3a8148`, `#58a05d` | `#8a6040`, `#275a31`, `#367a42` |
| `--ky-left`, `--ky-right` | the teams' colours | `#2f6db0`, `#b5452c` | the same |
| `--ky-left-ink`, `--ky-right-ink` | the words on those colours | `#ffffff` | the same |
| `--ky-plate`, `--ky-plate-ink` | the score's panel | `rgba(18,24,21,.9)`, `#ffffff` | `rgba(0,0,0,.82)`, the same |
| `--ky-halo` | the outline round a name painted on ice or wood | `rgba(255,255,255,.92)` | the same |
| `--ky-layer`, `--ky-layer-home`, `--ky-layer-away`, `--ky-layer-edge`, `--ky-layer-hollow`, `--ky-layer-ink`, `--ky-layer-halo` | a data layer's marks (see [docs/layers.md](./docs/layers.md)) | light set | lightened |
| `--ky-font` | the face of every word | the system's, with Hiragino and Noto Sans JP | the same |

Every part carries a class (`ky-surface`, `ky-line`, `ky-zone-left`, `ky-banner`, `ky-plate`, `ky-score`, `ky-winbar`, `ky-lose`, `ky-badge`) for anything a property cannot reach. Pass `style: "none"` to leave the stylesheet out of each drawing and put `KYOGIJO_STYLE` in the page once, which is what the demo does for its many drawings.

A court's own look is `court: { wood, woodAlt, apron, border, key, keyLeft, keyRight, line, centreCircle, centreLogo, baselineText, baselineInk, paintThreePoint }`; `COURT_THEMES` has five to start from: `maple`, `twoTone`, `night`, `sunburst` and `tournament` (a floor painted edge to edge, with no wood).

## Limits

Each is held by a test, and the ones with a name are exported.

| Limit | Value | Where |
| --- | --- | --- |
| Sports | 7 | `SPORTS` |
| Soccer pitches and providers | 10 presets, 10 providers (90 maps between them, each landmark to its landmark) | `SOCCER_PITCHES`, `SOCCER_PROVIDERS` |
| Ballparks | 94 (30 current MLB, 44 past MLB, 12 NPB home parks, 8 other NPB grounds) | `PARKS` |
| Units | 6 (`ft`, `in`, `yd`, `m`, `cm`, `mm`) | `UNITS` |
| Coordinate frames | 16 to start with (`nhl-api`, `hockeytech`, `nba-stats`, `nfl-tracking`, `mlbam`, `retrosheet` and the ten soccer providers), more by `registerFrame` | `FRAMES` |
| A colour | a hex colour, `rgb()`, `rgba()`, `hsl()`, `hsla()`, a name or `var(--name)`, 64 characters at most | `safeColour` |
| A logo | an https or relative address, an image data address, or SVG text up to 200,000 characters | `safeLogo` |
| A name | any length: it is set on one line or two, in the biggest size that fits its place | `fitLines` |
| A layer's marks | 1,000 points add under 70 kB; 10,000 are drawn in under 250 ms | `drawKyogijo` |
| A drawing's size | under 22 kB for a football field, 15 kB for a soccer pitch with a score, 14 kB for a rink or a court, 17 kB for a ballpark, each with its 8 kB stylesheet (a test holds each under a budget) | `drawKyogijo` |

## Accessibility

- **Each drawing says what it is.** The `svg` has `role="img"`, a `<title>` (the teams and the score, or the surface) and a `<desc>` (the competition, the status, the result, and what the surface is), linked by `aria-labelledby`. The words are in English or Japanese by `language`.
- **A score is also text.** The names, scores and statuses in a drawing are text elements, so they can be selected and found in a page. Pass `title` and `description` to say it your own way.
- **Words stay upright.** In a tall drawing the text is turned back, and a football field's numbers are upright on both sides.
- **Colour is not the only sign.** The winner is marked by a bar under the score and the loser's side is lighter, as well as by the colours.
- **Contrast.** The score sits on a dark panel with white words in both themes; a team's words on its colour are black or white by the colour's lightness, or the `textColor` you give.
- **Motion.** Nothing in the package animates. The demo's live score moves only when pressed, or every few seconds when told to play and the page is in view.
- **Not yet: a spoken update.** A page that changes the score may announce it with its own live region; the drawing does not.

## Browser and runtime support

Any browser with ES modules, `:where()` and SVG 2's `href` on images: Chrome and Edge 88, Safari 14, Firefox 78, all from 2021 on. The custom element needs shadow DOM and `part`, in every browser of 2021 on. The drawing function runs on Node 22 or later and in any other JavaScript runtime: it touches no DOM. The demo is played in a real browser, at a phone's width and a desk's, in Chromium and WebKit, before every release.

## Languages

English and Japanese: the title, the description and the standard statuses of a drawing, and the demo. The words are listed beside their English in [docs/strings-ja.md](./docs/strings-ja.md). Team names, competitions and dates are written as you give them, in any language; Japanese names of the NPB parks are in `PARKS`. Not yet: the Japanese read by a native reader (the demo says so when it is shown).

## Roadmap

Not here yet, and each welcome as an [issue](https://github.com/johnmorrisdotca/kyogijo/issues):

- **More surfaces**: the FIBA and college courts, the international rink, rugby pitches, a stadium's seating, soccer's beach and street formats.
- **Wall heights and quirks** in a ballpark: the Green Monster, Tal's Hill and the walls of Japan's parks.
- **More parks of the past**: the grounds of the 19th century, and the parks whose articles give no distances yet (the Kingdome, Joe Robbie Stadium, the Los Angeles Coliseum), when they do.
- **More charts on data layers**: heat maps, hexbins, pass networks, a legend and animation.
- **Football in a different standard**: the college and high-school hash marks.

Left out on purpose: statistics, rosters and schedules. Kyogijo draws the place and the score it is given; it does not look anything up.

## Architecture

The drawing is plain functions over plain data with no DOM and no dependency. The dimensions are in one file, the ballparks are generated from a reviewed list, and each surface is a function that returns its markup and the places the teams and the score go.

```text
src/
├── index.ts            the main entry
├── draw.ts             drawKyogijo: options in, one string of SVG out
├── score.ts            the teams' places, the score's panel and the badge
├── surfaces/
│   ├── surface.ts      what a surface is, and the quarter turn
│   ├── football.ts     the NFL, CFL and IFAF fields
│   ├── hockey.ts       the NHL rink
│   ├── basketball.ts   the NBA court
│   ├── baseball.ts     the baseball field and its fence
│   ├── soccer.ts       the soccer pitch
│   ├── soccer-spec.ts  the Laws' figures, the presets, futsal and the small-sided pitches
│   └── soccer-providers.ts  the data providers' coordinates, registered as frames, and rescale
├── layers.ts           data layers: drawLayers, layerTable and the marks
├── layers.marks.ts     the shapes, curves, waves, heads and colour ramps of the marks
├── layers.types.ts     the types of a layer
├── layers-entry.ts     the layers' entry
├── outline.ts          a surface's outline: where a layer is cut
├── common.ts           the drawing's id, the orientation and the unit, shared by the drawing and its layers
├── geometry.ts         every dimension, in feet, with the fence's curve
├── geometry-entry.ts   the geometry's entry
├── units.ts            the units of length, each surface's own, and the converters
├── frames.ts           coordinate frames: the mapper, the registry, toSurface and fromSurface
├── frames.providers.ts the NHL, HockeyTech, NBA, NFL, MLBAM and Retrosheet frames
├── frames-entry.ts     the frames' entry
├── parks.ts            the ballparks, their fences and their sources
├── parks.data.ts       made by scripts/build-parks.mjs from scripts/parks.data.json
├── parks-entry.ts      the parks' entry
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

Tests sit beside the code. `scripts/` builds the demo, checks the packed package and the README's examples, and takes the README's pictures; `demo/` is the page and the frame; `e2e/` plays the demo in a real browser.

## The name

*Kyogijo* (競技場, きょうぎじょう) is Japanese for a sports ground: the place a contest is held. It is written with 競技, "contest" or "competition", and 場, "place", and said in five beats, *kyo-u-gi-jo-u*. In Japanese it is the general word for a place where sport is played, a stadium or a ground; the package uses it as a name for every surface it draws, the field, the rink, the court and the diamond. The long vowels are written without a macron in the package's name, as in the other packages of the family.

## Where it comes from, and where it is used

Kyogijo was made for [SPX Stats](https://spxn.com), the historical record of the NHL, NBA, MLB, NFL and CFL, to show the score of a game or a championship on the surface it was played on, with each team's name and logo at its side. Its Japanese names and its Japanese parks are there because the same author makes a Japanese study app and a site for Japanese board games, and because baseball in Japan is a sport its fans know by its grounds.

### Used by

- [SPX Stats](https://spxn.com), planned, for the score of a game or a championship.

Using Kyogijo in something? Open an *Add my project* issue and we will add you.

### The family

<!-- family:start (made by scripts/family-readme.mjs from scripts/family-template.mjs; change those, not this) -->
Kyogijo is one of twenty-five packages, each made for the same site, each at
[github.com/johnmorrisdotca](https://github.com/johnmorrisdotca). The code of every one is MIT.

- [Korokoro](https://github.com/johnmorrisdotca/korokoro) (コロコロ): dice, with notation, exact odds, real sounds and the dice of many games. [Demo](https://johnmorrisdotca.github.io/korokoro/).
- [Kyuubu](https://github.com/johnmorrisdotca/kyuubu) (キューブ): a turning cube for the browser, 2×2 to 7×7, with record solves to replay. [Demo](https://johnmorrisdotca.github.io/kyuubu/).
- [Hitotsu](https://github.com/johnmorrisdotca/hitotsu) (一つ): a colour-card shedding game for two to eight, with the house rules people play. [Demo](https://johnmorrisdotca.github.io/hitotsu/).
- [Toranpu](https://github.com/johnmorrisdotca/toranpu) (トランプ): a deck of playing cards, card games with computer players, and solitaires. [Demo](https://johnmorrisdotca.github.io/toranpu/).
- [Tane](https://github.com/johnmorrisdotca/tane) (種): seeded random numbers and daily seeds, the same in every browser and on every server. [Demo](https://johnmorrisdotca.github.io/tane/).
- [Narabe](https://github.com/johnmorrisdotca/narabe) (並べ): one rules engine for abstract board games, from gomoku and Reversi to Go and checkers. [Demo](https://johnmorrisdotca.github.io/narabe/).
- [Tenka](https://github.com/johnmorrisdotca/tenka) (天下): world conquest for two to six, on a map of the real world. [Demo](https://johnmorrisdotca.github.io/tenka/).
- [Kumimoji](https://github.com/johnmorrisdotca/kumimoji) (組み文字): a crossword tile race, in English and Japanese kana. [Demo](https://johnmorrisdotca.github.io/kumimoji/).
- [Tsunagi](https://github.com/johnmorrisdotca/tsunagi) (繋ぎ): a line-joining logic puzzle whose every level has exactly one answer. [Demo](https://johnmorrisdotca.github.io/tsunagi/).
- [Jarajara](https://github.com/johnmorrisdotca/jarajara) (ジャラジャラ): mahjong tiles drawn as SVG, stacked layouts, and the matching solitaire Awase. [Demo](https://johnmorrisdotca.github.io/jarajara/).
- [Suido](https://github.com/johnmorrisdotca/suido) (水道): a pipe puzzle: turn the pieces until the water reaches every drain. [Demo](https://johnmorrisdotca.github.io/suido/).
- [Domino](https://github.com/johnmorrisdotca/domino) (ドミノ): dominoes and Mexican Train. [Demo](https://johnmorrisdotca.github.io/domino/).
- [Kotoba](https://github.com/johnmorrisdotca/kotoba) (言葉): word lists and word-game rules in English, French, German and Japanese. [Demo](https://johnmorrisdotca.github.io/kotoba/).
- [Sugoroku](https://github.com/johnmorrisdotca/sugoroku) (双六): backgammon and its variants, with the doubling cube and match play. [Demo](https://johnmorrisdotca.github.io/sugoroku/).
- [Kazu](https://github.com/johnmorrisdotca/kazu) (数): grid number puzzles: Sudoku and its variants, Futoshiki and Skyscrapers. [Demo](https://johnmorrisdotca.github.io/kazu/).
- [Meikyuu](https://github.com/johnmorrisdotca/meikyuu) (迷宮): mazes on squares, hexagons, triangles and circles, made from a seed and drawn through with a finger or the mouse. [Demo](https://johnmorrisdotca.github.io/meikyuu/).
- [Hikidashi](https://github.com/johnmorrisdotca/hikidashi) (引き出し): a drawer of small Japanese text tools: era dates, kanji numerals, readings and sentence difficulty. [Demo](https://johnmorrisdotca.github.io/hikidashi/).
- [Chizu](https://github.com/johnmorrisdotca/chizu) (地図): maps of the world and of countries' regions, in English and Japanese, with a quiz and callouts. [Demo](https://johnmorrisdotca.github.io/chizu/).
- [Bushu](https://github.com/johnmorrisdotca/bushu) (部首): find a kanji by the parts it is made of. [Demo](https://johnmorrisdotca.github.io/bushu/).
- [Tobiishi](https://github.com/johnmorrisdotca/tobiishi) (飛び石): peg solitaire with nine boards and seeded solvable challenges. [Demo](https://johnmorrisdotca.github.io/tobiishi/).
- [Jirai](https://github.com/johnmorrisdotca/jirai) (地雷): minesweeper on shaped grids with verified no-guess boards. [Demo](https://johnmorrisdotca.github.io/jirai/).
- [Gunjin](https://github.com/johnmorrisdotca/gunjin) (軍人): five hidden-rank strategy games with pass-the-device play. [Demo](https://johnmorrisdotca.github.io/gunjin/).
- [Karakuri](https://github.com/johnmorrisdotca/karakuri) (からくり): eight hyper-casual puzzle games, some of them physics: draw a shield, pull pins, cut ropes, slide blocks, pour tubes. [Demo](https://johnmorrisdotca.github.io/karakuri/).
- [Houseki](https://github.com/johnmorrisdotca/houseki) (宝石): gem and stone matching puzzles: falling triplets, stone collapse, colour chains and gem swap. [Demo](https://johnmorrisdotca.github.io/houseki/).
- [Kyogijo](https://github.com/johnmorrisdotca/kyogijo) (競技場): sports fields, rinks, courts and ballparks drawn to scale as SVG, with each team and the score on them. [Demo](https://johnmorrisdotca.github.io/kyogijo/).

**This package is Kyogijo.** The demos of all twenty-five share one header and footer, so each links the rest.
<!-- family:end -->

## Development

```sh
pnpm install
pnpm check          # lint, types, every test, the build and the packed package
pnpm test:package   # pack, install and import it as somebody who installed it would
pnpm test:demo      # build the demo and play it in a real browser, at a phone's width and a desk's
pnpm site           # build the demo into site/, as the Pages workflow publishes it
pnpm screenshots:readme   # take the README's pictures from the built demo, in light and dark
pnpm test:readme    # run every example in the README against the built package
pnpm docs:make      # rewrite docs/strings-ja.md after changing a word
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). The commands are under [Development](#development).

Please follow the [code of conduct](./CODE_OF_CONDUCT.md). Text, a colour or a logo address that gets out of the drawing, or a name that makes it run for a very long time, is for the [security policy](./SECURITY.md), not a public issue.

## Changes

See [CHANGELOG.md](./CHANGELOG.md). The first release, 0.1.0, draws the seven surfaces and the 94 ballparks, with scores, badges, wide and tall layouts, a custom element and a frame.

## Licence

The code is [MIT](./LICENSE) © John Morris. The ballparks' fence distances are facts published in Wikipedia's articles, re-expressed here as numbers, with the article and revision of each cited in [NOTICE.md](./NOTICE.md) (shipped in the package) and [docs/references.md](./docs/references.md). The dimensions of the surfaces are facts from the rulebooks and the federations' diagrams, cited in [docs/sources.md](./docs/sources.md).

| Data | Made from | Terms |
| --- | --- | --- |
| The dimensions of the football fields, the rink and the court | The NFL, CFL, IFAF, NHL and NBA rules and diagrams | Facts; no text or drawing copied |
| The soccer pitch's dimensions and the providers' coordinates | The IFAB and FIFA Futsal Laws of the Game, UEFA, MLS, NCAA and FA documents, and each provider's own pages (docs/sources.md) | Facts; no text or drawing copied |
| The fence distances of 94 ballparks | The English and Japanese Wikipedia articles of each, at the revision cited | Facts; the articles are CC BY-SA 4.0 and none of their text is used |
| The Wikidata item of each ballpark | Wikidata, as linked from the cited article | CC0 |
| The demo's teams and emblems | Written for this package | MIT |
