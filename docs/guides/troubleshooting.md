# Troubleshooting and questions

[日本語](ja/troubleshooting.md) · English

The problems below are the ones that come up when the package is first put in a page. Each has the symptom, the cause and the fix. If yours is not here, the [issues](https://github.com/johnmorrisdotca/kyogijo-stadiums/issues) are open, and a report that includes the options and the version (`VERSION`, or the `data-version` of the drawing) is quick to answer.

## Nothing appears where `<kyogijo-field>` is

The tag is a custom element, and it is empty until it is registered. Import the registration once:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo-stadiums@0/dist/element-define.js"></script>
```

or, in a bundler, `import "@johnmorrisdotca/kyogijo-stadiums/element/define";`. Importing `.../element` alone gives the class without registering it. In Vue, also tell the compiler the tag is a custom element (`isCustomElement`), or it warns about an unknown component. See [frameworks](frameworks.md).

## `document is not defined`, or a blank page on the server

`mountKyogijo`, `mountKyogijoTurn` and the element need a DOM. On a server, use the string: `drawKyogijo(options)` needs none and returns SVG text. In Next.js, Nuxt or SvelteKit, call it in the server part of the page and insert the string.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

console.log(typeof document, drawKyogijo({ sport: "nhl" }).startsWith("<svg"));
// undefined true
```

## The drawing is far too big, or has no height

The `svg` is `display: block; width: 100%; height: auto`, so it is as wide as its container and as tall as its shape needs. A container with no width (a `float`, an inline-flex item with no basis) gives it none. Give the container a width, or a `max-width` for the drawing, in your CSS. For `orientation: "auto"` the container needs a height or a width that does not depend on the drawing, or it has nothing to measure.

## A colour is not what I passed

`colors` and `featureColors` accept a hex colour, `rgb()`, `rgba()`, `hsl()`, `hsla()`, a name or `var(--name)`, 64 characters at most. Anything else is ignored rather than written into the markup, and `safeColour` returns `undefined` for a value it refuses, which tells you which.

```ts
import { safeColour } from "@johnmorrisdotca/kyogijo-stadiums";

console.log(safeColour("#1c3f7a"), safeColour("url(javascript:alert(1))"));
// #1c3f7a undefined
```

A rule in your page also beats the options, because the package's defaults have no weight (`:where()`); look for `--ky-surface` and the others in your stylesheet. See [looks and colours](looks-and-colours.md).

## Dark mode does not follow my page's switch

By default a drawing follows `prefers-color-scheme`. If your page has its own switch, set `data-theme="dark"` or `"light"` on the root element (the drawing follows it), or pass `theme` in the options.

## A feature name or a park is "unknown"

`featureColors` takes the names in `FEATURES[sport]`; a name the sport does not have is an error that lists the ones it has. A park is a key of `PARKS` (`PARK_IDS` lists them) and `parkByName` finds one by any name it has been called, in English or Japanese.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

try {
  drawKyogijo({ sport: "nhl", featureColors: { "no-such-part": "#fff" } });
} catch (error) {
  console.log(String((error as Error).message).includes("blue-lines"));
}
// true
```

## The logo does not show

A `logo` is an https or relative address, an image data address, or the text of an SVG. Any other address (`http:`, `javascript:`, `file:`) is ignored, and so is a data address that is not an image. The logo is drawn as an image, so the file must be reachable from the page. A team with no usable logo is its name alone.

## The score is on the wrong side

A score is drawn the way the sport lists it: home first (left) for soccer, rugby and most of the world's codes, away first for the North American leagues. Set `homeSide: "left"` or `"right"`; do not swap your data. See [a score on a surface](score-and-layout.md#which-side-is-the-home-team-on).

## Two drawings on a page look wrong, or the page is heavy

Each drawing carries its stylesheet (8 to 10 kB) and its own ids. For many, pass `style: "none"` and put `KYOGIJO_STYLE` in the page once. If you give an `id`, give each drawing a different one; without one, an id is made from the options.

## A snapshot test fails after an upgrade

Every drawing carries `data-version`, and an id made from the options and the version. A snapshot of a whole drawing therefore changes when the version does. Snapshot the parts you care about (the title, the description, a class) or pass an `id` and strip the `data-version`. A release that changes how something is drawn says so in the [changelog](../../CHANGELOG.md), and [upgrading](upgrading.md) lists the breaking ones.

## `toPNG` fails

PNG output is for Node and needs the optional peer package `@resvg/resvg-js`. Install it, or catch the error: `PNG_PEER_MISSING` is the message to compare with. Everything else in the package needs no peer.

## The 3D view is slow on a phone

The view is DOM and CSS, and a step of the turn costs in proportion to the elements it moves. Leave `quality: "auto"` (the default) so it draws less on a device that makes few frames, or hold `low`. Show one view per page, and flat drawings for the rest. See [the 3D view](the-3d-view.md#quality-and-speed).

## The pointer helper returns `null`

`clientPointToField` answers `null` for a drawing made without `pointer: true`, for a badge, for a special game (a surface set inside another), for an element not in the page, and for the 3D view. See [data on a surface](data-on-a-surface.md#5-a-click-as-a-place).

## Which Node and which browsers?

Node 22 or later on a server; any browser with ES modules, `:where()` and SVG 2's `href` on images (Chrome and Edge 88, Safari 14, Firefox 78). The custom element needs shadow DOM and `part`.
