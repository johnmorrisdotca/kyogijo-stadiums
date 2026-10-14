# Getting started

Install the package, draw a surface as a string of SVG, and choose the way in that suits your page: a string, a container that follows its box, a custom element, or a frame for a page that runs no script.

## Install

```sh
npm install @johnmorrisdotca/kyogijo-stadiums
# or: pnpm add @johnmorrisdotca/kyogijo-stadiums
# or: yarn add @johnmorrisdotca/kyogijo-stadiums
```

It needs Node 22 or later on a server, and any current browser. It is plain ES modules, with types, and it depends on nothing. Once it is on npm the same files are on the CDNs: `https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo-stadiums@0/+esm` is the package as one module for the browser, and `https://unpkg.com/@johnmorrisdotca/kyogijo-stadiums@0/dist/index.js` the file itself.

## 1. A string of SVG

`drawKyogijo(options)` returns SVG text. It needs no DOM, so it runs in Node, an edge function, a build step or a browser. The same options always give the same text.

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

Put the string in a page with `innerHTML`, write it to a file, or send it in an email. `drawSurface` draws the surface without teams, `drawScore` the teams and score alone, and `drawBadge` the strip for a list ([Score and layout](./score.md)).

### A file on a server

```js no-run
import { writeFileSync } from "node:fs";
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

// The drawing carries its own stylesheet, so a saved file stands alone: open it in a browser, or put it in an image tag.
writeFileSync("rink.svg", drawKyogijo({ sport: "nhl", theme: "dark" }));
```

## 2. A container in the browser

`mountKyogijo(element, options)` draws into an element and returns `update`, `svg`, `orientation` and `destroy`. With `orientation: "auto"` it watches the element and draws again, tall or wide, when its shape changes.

```ts no-run
import { mountKyogijo } from "@johnmorrisdotca/kyogijo-stadiums/mount";

const card = mountKyogijo(document.querySelector("#game")!, {
  sport: "nhl",
  orientation: "auto",
  away: { name: "USA", score: 1 },
  home: { name: "Canada", score: 0 },
  status: "live",
});
// Each goal: draw again with the new score. The layout follows the box.
card.update({ sport: "nhl", orientation: "auto", away: { name: "USA", score: 2 }, home: { name: "Canada", score: 0 }, status: "live" });
```

## 3. A custom element

`<kyogijo-field>` is a standard custom element. Import `element/define` once, from the package or a CDN, and use the tag with attributes.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo-stadiums@0/dist/element-define.js"></script>

<!-- score is home-away; home-score and away-score say it the other way -->
<kyogijo-field sport="nba" size="compact" orientation="auto"
  home="Japan" away="Australia" score="112-108"
  home-color="#c2410c" away-color="#14233f" status="final"></kyogijo-field>

<style>
  kyogijo-field { --ky-plate: rgba(0, 0, 0, .6); }
  kyogijo-field::part(plate) { filter: drop-shadow(0 2px 4px rgba(0, 0, 0, .3)); }
</style>
```

The attributes are the options' names in kebab case (`sport`, `year`, `exact-lines`, `home-score`, `stripe-pattern`, `home-logo` and the rest, all in `KYOGIJO_ATTRIBUTES`), and `options` takes any other option as JSON. The parts are `figure`, `svg`, `surface`, `plate`, `team`, `home`, `away`, `score`, `home-score`, `away-score` and `badge`. React, Vue and Svelte examples are in the [README](https://github.com/johnmorrisdotca/kyogijo-stadiums#in-react).

## 4. A frame

For a page that cannot run scripts (a site builder, a forum, a newsletter archive), the demo site serves a frame that draws what its address says. Paste the tag; no script is yours to run.

```html
<iframe
  src="https://johnmorrisdotca.github.io/kyogijo-stadiums/embed.html?sport=nhl&away=USA&home=Canada&ascore=3&hscore=2&status=final-ot"
  title="USA 3, Canada 2, Final/OT"
  loading="lazy"
  style="width:100%;aspect-ratio:2.3;border:0"
></iframe>
```

The address takes `sport`, `park`, `year`, `size`, `orientation` (it fits its frame by default), `theme`, `lang`, `away`, `home`, `aabbr`, `habbr`, `ascore`, `hscore`, `acolor`, `hcolor` (six hex digits, no `#`), `alogo`, `hlogo` (an https address), `status`, `competition`, `date`, `label` and `winner`. The demo's Embed section writes the tag for what you have chosen.

## What a developer gets

- Types for every option and export, with each export's doc comment in an editor.
- A drawing that is a pure function of its options: it can be cached, compared and tested.
- Entry points that stand apart: the geometry, the parks and the grounds need nothing else, and the element loads only when imported ([the list](./entry-points.md)).

## Where next

- What each surface is, and how a league's rules change it: [Surfaces](./surfaces.md) and [League variants](./variants.md).
- A game on a surface, wide or tall, as a strip for a list: [Score and layout](./score.md).
- Your colours: [Theming](./theming.md). Your data on the surface: [Data layers](./layers.md) and [Ready-made charts](./charts.md).
- Every picture the package can draw, with the code for it: the [gallery](./gallery.md).
