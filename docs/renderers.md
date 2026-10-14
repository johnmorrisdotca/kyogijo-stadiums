# Renderers

One drawing, put on a canvas, a d3 selection, an Observable Plot, a GeoJSON file or a PNG, as well as written as SVG. The surfaces, the layers, the charts and a frame of a replay are drawn once, by the code that writes the SVG; each renderer here reads the same drawing as data and paints it again. Nothing is drawn twice, and none of them is a dependency: the core stays at no dependencies, and each renderer is an entry of its own that imports nothing from outside the package.

| Entry | What it is for | What it needs |
| --- | --- | --- |
| [`/scene`](#the-scene) | The drawing as plain data: every shape in paint order, its colours worked out for light or dark. An SVG that needs no stylesheet. | nothing |
| [`/canvas`](#canvas) | `drawToCanvas(ctx, drawing, { width, theme })` on a browser's canvas, an `OffscreenCanvas` or a Node canvas. | a canvas context, yours |
| [`/d3`](#d3) | `appendSurface(selection, drawing, x, y)`: the surface in a d3 selection, placed by your scales. | a d3 selection and two linear scales, yours |
| [`/plot`](#observable-plot) | `surfaceMark(drawing)` and `surfaceScales(drawing)`: the surface under the marks of a plot. | Observable Plot, yours |
| [`/geojson`](#geojson) | `sceneToGeoJSON(drawing, { frame })`: each shape a feature, in feet or a provider's frame. | nothing |
| [`/png`](#png) | `toPNG(drawing, { width })` in Node. | the optional package `@resvg/resvg-js` |

A *drawing*, wherever one is asked for, is the options of `drawKyogijo`, the SVG a chart (`chart.draw()`) or a replay (`drawFrame`) returned, or a scene made earlier. The renderers take all three, so a chart on a canvas is `drawToCanvas(ctx, chart.options)`.

## The scene

```ts
import { sceneOf } from "@johnmorrisdotca/kyogijo-stadiums/scene";

const scene = sceneOf({ sport: "nhl", id: "rink" }, { theme: "dark" });
const [apron, boards] = scene.items;
console.log(scene.items.length, scene.theme, apron.kind, apron.style.fill, boards.kind);
// 31 dark rect #1a2025 path
```

A scene is plain data (it survives `JSON.stringify`): the `viewBox` of the drawing, its title and description, and `items`, the shapes in the order they are painted. An item is a `rect`, `circle`, `ellipse`, `line`, `polygon`, `polyline`, `path`, `text` or `image`, with its geometry and:

- **`style`**, worked out as a browser would for the theme: `fill` and `stroke` as colours (or a reference to one of `scene.gradients` and `scene.patterns`), `strokeWidth`, `opacity`, `lineJoin`, `lineCap`, `dash`, `fillRule`, `paintOrder` (a halo round a label is `stroke`) and `filter`. The stylesheet, the custom properties, `var()` with its fallbacks, `calc()`, the dark rules and the inheritance are already applied, so a renderer needs no CSS.
- **`matrix`**, the six numbers of the transform from the drawing's frame to the shape's: every group above it and its own `transform` multiplied (a tall drawing's quarter turn, the turn of a label). A `path` also has its `commands` as absolute `M`, `L`, `C`, `Q` and `Z`, with arcs turned into curves.
- **`clips`**, the clips it is cut by, as indexes into `scene.clips` (the surface's outline, for a layer).
- **`class`**, `id`, the `data-*` of the groups it is in (`data.kind` is the kind of layer) and its `label`, the tooltip of a mark.

Light is the default, or the drawing's own `data-theme`; `theme: "dark"` works the colours out for dark. A drawing made with `style: "none"` is read with the package's own stylesheet; `css` adds a page's rules, for the classes you add yourself. Coordinates are the drawing's own: feet, x along the surface from its left end and y across it from the top (a ballpark's x across and y minus the distance out from home plate). A tall drawing is already turned: `scene.orientation` says so and `scene.turn` is the quarter turn; ask for `orientation: "landscape"` to draw on the surface's own axes.

### How the SVG stays the same

The SVG is still written once, by the code that has always written it, and a scene is read from that markup: the text is parsed into a tree that remembers every attribute as it was written, and the scene is worked out from the tree. `parseSvg` and `writeSvg` are that tree, and `writeSvg(parseSvg(svg)) === svg` for every drawing in the package's tests (127 of them: every sport wide, tall, as a badge and a compact card, light and dark, with and without its stylesheet, in Japanese, every kind of layer, the five charts and a frame of a replay). The tests that hold the drawing itself, the snapshots of every sport and the fingerprint of the text, are unchanged.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";
import { parseSvg, writeSvg } from "@johnmorrisdotca/kyogijo-stadiums/scene";

const svg = drawKyogijo({ sport: "nhl", id: "rink" });
console.log(writeSvg(parseSvg(svg)) === svg);
// true
```

### An SVG without a stylesheet

`sceneToSvg` writes a scene as SVG with every colour, width and font an attribute, every transform on its shape and each clip as a group. It is the SVG for anything that does not read CSS variables: an image converter, an email, a slide, a tool that draws an SVG with its own engine. It is also what the d3, Plot and PNG renderers are built from.

```ts
import { sceneToSvg } from "@johnmorrisdotca/kyogijo-stadiums/scene";

const svg = sceneToSvg({ sport: "nhl", id: "rink" }, { theme: "dark", width: 800 });
console.log(svg.includes("var("), svg.includes("<style"), svg.includes('width="800" height="374"'));
// false false true
```

## Canvas

`drawToCanvas(ctx, drawing, options)` paints a scene on a 2D context. No canvas library is imported: the context is typed by the members that are called (`CanvasContext`), so a browser's `CanvasRenderingContext2D`, an `OffscreenCanvasRenderingContext2D` and the contexts of `@napi-rs/canvas`, `skia-canvas` and `canvas` all do. It returns the box it drew.

```ts no-run
import { drawToCanvas } from "@johnmorrisdotca/kyogijo-stadiums/canvas";

const canvas = document.querySelector("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
const ratio = window.devicePixelRatio;
canvas.width = 800 * ratio;
canvas.height = 374 * ratio;
// Draw at the canvas's own pixels; the width in pixels, the height follows.
drawToCanvas(ctx, { sport: "nhl", id: "rink", theme: "dark" }, { width: canvas.width, clear: true });
```

- **Size.** `width`, `height` (the drawing is fitted inside and centred when both are given) or `scale`, pixels for a foot. `x` and `y` move the corner. `background` fills the box first and `clear` clears it.
- **Logos.** A team's logo is an address, and a canvas draws a loaded picture, so `images` is a function from the address to one (an `Image` that has loaded, an `ImageBitmap`, a canvas) or to nothing, and then that logo is left out.
- **What is exact.** Every colour, line width, dash, join, halo, gradient and clip, the pattern of a curling sheet's pebble (tiled inside its shape) and each label's font, size and place. A small size of text is drawn larger and the drawing taken down by the transform, so the engine renders it at a size it does well.
- **What is not.** A group's `opacity` is the product of its parents' on each shape, which differs from a browser's only where the shapes of one group overlap. A group's `filter` (a loser's banner is greyed) is applied to each shape in it, and only where the context has `filter` (a browser's; not Safari before 18 or most Node canvases).

In Node, with `@napi-rs/canvas`:

```ts no-check
import { createCanvas } from "@napi-rs/canvas";
import { drawToCanvas } from "@johnmorrisdotca/kyogijo-stadiums/canvas";

const canvas = createCanvas(1200, 561);
drawToCanvas(canvas.getContext("2d") as never, { sport: "nhl", id: "rink" }, { width: 1200, background: "#fff" });
const png = canvas.toBuffer("image/png");
```

## d3

`appendSurface(selection, drawing, x, y)` appends a group to a d3 selection and draws the surface in it, placed by the two scales you pass: a point with the drawing's numbers goes through the same `x` and `y` to the same place on the page, so a mark you add with those scales lands on the right spot of the rink. d3 is not imported: the selection need only have `append`, `attr` and `text`, which every selection does, and the scales are plain functions. The scales must be linear (the drawing is moved and stretched, never bent), and anything else is an error that says so. Every colour and width is an attribute, so the page needs no stylesheet.

```ts no-check
import * as d3 from "d3";
import { appendSurface, surfaceDomain } from "@johnmorrisdotca/kyogijo-stadiums/d3";

const options = { sport: "nhl", id: "rink" } as const;
const { x: xd, y: yd } = surfaceDomain(options); // [-8, 208] and [-8, 93]: the drawing's feet, its margin included
const x = d3.scaleLinear().domain(xd).range([0, 800]);
const y = d3.scaleLinear().domain(yd).range([0, 374]);
const svg = d3.select("body").append("svg").attr("viewBox", "0 0 800 374");
appendSurface(svg, options, x, y);
// Shots in the feet of the NHL API are put on the rink by the same scales, after the frame moves them onto the surface.
svg.selectAll("circle.shot").data(shots).join("circle").attr("class", "shot").attr("cx", (d) => x(d.x)).attr("cy", (d) => y(d.y)).attr("r", 4);
```

`surfaceDomain` gives the numbers to put in the scales' domains. `className` names the group (`kyogijo-surface`); each shape has the class the drawing gives it (`ky-surface`, `ky-red`), to select or to restyle.

## Observable Plot

`surfaceMark(drawing)` is a mark and `surfaceScales(drawing)` the options that make a plot's scales the surface's: the drawing's numbers on both axes, y growing down as it does in a drawing, a foot as wide as it is tall (`aspectRatio: 1`), no axes and no margin. Plot takes a function as a mark and calls it with its scales and its `document`, so there is nothing to import: Plot is the caller's, and only its calling convention is relied on.

```ts no-check
import * as Plot from "@observablehq/plot";
import { surfaceMark, surfaceScales } from "@johnmorrisdotca/kyogijo-stadiums/plot";

const options = { sport: "nhl", id: "rink" } as const;
const plot = Plot.plot({
  ...surfaceScales(options),
  width: 800,
  marks: [surfaceMark(options), Plot.dot(shots, { x: "x", y: "y", fill: "outcome", r: 4 })],
});
document.body.append(plot);
```

The marks after the surface use the drawing's numbers, so provider data goes through `toSurface` first ([coordinate frames](./frames.md)). The drawing is light unless `theme: "dark"`.

## GeoJSON

`sceneToGeoJSON(drawing, options)` writes every shape as a feature of a `FeatureCollection` (RFC 7946): a filled shape is a `Polygon` or `MultiPolygon` (a ring inside another is its hole, the exterior wound counter-clockwise and a hole clockwise, as the RFC has it), an outline or a line a `LineString` or `MultiLineString`, a label a `Point` with its `text`, and a logo a `Polygon` with its `href`. Curves are cut into straight pieces no more than 0.05 feet from the curve. The painting of each shape is in its `properties` (`class`, `fill`, `stroke`, `strokeWidth`, `opacity`, `label`, the `data` of its layer, and `order`, its place in the paint order), so a map style can colour it the way the drawing does.

```ts
import { sceneToGeoJSON } from "@johnmorrisdotca/kyogijo-stadiums/geojson";

// The playing surface of the rink, in the NHL API's frame: feet from centre ice, y up.
const ice = sceneToGeoJSON({ sport: "nhl", id: "rink" }, { frame: "nhl-api", filter: (item) => item.class === "ky-surface" });
console.log(ice.features.length, ice.features[0].geometry.type, ice.bbox);
// 1 Polygon [ -100, -42.5, 100, 42.5 ]
```

- **Units.** Without a `frame` the numbers are the surface's own: feet from its left end and its top, with a tall drawing turned back. With `frame` (the name of one of the 22 [frames](./frames.md), or a `Frame` of yours) each point is moved by `fromSurface`, so a layer's marks and the lines come out in the provider's numbers; a frame for a surface of any size (the soccer providers) also needs `size`. `filter` leaves out the shapes it returns false for.
- **A flat plane, not longitude and latitude.** The coordinates are in feet, or the frame's unit, which RFC 7946 does not allow of a position, and the file says so (`kyogijo.note`). Use a tool that takes a plane: Leaflet's `CRS.Simple`, d3's `geoIdentity()`, deck.gl's Cartesian coordinates, or QGIS with a local CRS. Putting a ballpark or a ground on the map in longitude and latitude, with the local projection of `@johnmorrisdotca/chizu`, is not done here yet.
- **Clips are not applied.** A layer is cut to the surface's outline on the drawing; in GeoJSON its shapes are whole.

## PNG

`toPNG(drawing, { width })` returns PNG bytes, by [resvg](https://github.com/yisibl/resvg-js), a Rust renderer. It is an optional peer dependency: `npm install @resvg/resvg-js` to use it, and without it `toPNG` throws an error that says what to install. It is loaded when `toPNG` is called, by name, so nothing that does not call it needs it, and it runs in Node only. It draws the stylesheet-free SVG of the scene (resvg does not read CSS variables).

```ts
import { toPNG } from "@johnmorrisdotca/kyogijo-stadiums/png";

// With @resvg/resvg-js installed this is the PNG; without, it stays undefined. The first bytes of a PNG are its signature.
const png = await toPNG({ sport: "nhl", id: "rink" }, { width: 800, theme: "dark" }).catch(() => undefined);
console.log(png === undefined || (png[1] === 80 && png[2] === 78 && png[3] === 71));
// true
```

`width` or `height` sets the size in pixels (1200 wide by default), `background` fills behind the drawing (the picture is transparent without it), `theme` and `css` are the scene's, and `font` is passed to resvg's font options (`{ fontFiles: ["Inter.ttf"], loadSystemFonts: false }`), because resvg draws with the fonts of the machine and the drawing asks for the system's UI font.

**In a browser**, or anywhere resvg is awkward, rasterise with the canvas instead: draw to a canvas and ask it for the picture.

```ts no-run
import { drawToCanvas } from "@johnmorrisdotca/kyogijo-stadiums/canvas";

const canvas = document.createElement("canvas");
canvas.width = 1200;
canvas.height = 561;
drawToCanvas(canvas.getContext("2d") as CanvasRenderingContext2D, { sport: "nhl", id: "rink" }, { width: 1200 });
const blob: Blob | null = await new Promise((done) => canvas.toBlob(done, "image/png"));
```

## How the renderers were held to the drawing

- **The tree** gives back every drawing of the package byte for byte (above).
- **The style** is held to a browser's (`e2e/renderers.demo.mjs`, in Chromium): every painted element of 44 drawings (every sport as a score, tall and bare and as a strip, layers of three kinds, two charts), light and dark, is given to `getComputedStyle`, and the fill, stroke, width, opacity, fill opacity, join, cap, dashes, font size and weight and text anchor of each must match the scene's. They do, and the same check found no difference over the 127 drawings of the unit tests, run once by hand.
- **The canvas** is held to the same SVG drawn by the browser into an image: the median drawing differs in under 1.2 percent of its pixels (the letters' edges) and none in as many as 5 percent. The unit tests hold the calls: a recording context must be told one fill for each filled shape, one stroke for each stroke, each label's words in order and a clip once for each run of clipped shapes.
- **d3, Plot and resvg** were run against the real packages (d3 7.9, Observable Plot 0.6.17, resvg-js 2.6): a mark of the plot lands at centre ice when it is given the NHL API's `(0, 0)`. The tests in the repository use a fake selection and a fake document of the same shape, and the PNG tests run when resvg is installed and are skipped when it is not.
- **GeoJSON** is checked by a validator written from RFC 7946: positions, closed rings of four or more positions, the winding of every exterior ring and hole, two positions in a line, and the bounding box.
- **Size.** The scene is under 80 kB of source, comments included, and each renderer under 20 kB; the main entry and every entry that is not a renderer reach none of it, and no renderer reaches another.

## Limits

- A scene is read from the markup the package writes. It reads the stylesheet in the drawing (or the package's own), not a page's other rules; `css` adds rules by hand.
- Text is placed, not measured: the scene carries each label's place, size and anchor, and the font is the renderer's, so letters may be a pixel wider or narrower from one renderer to the next.
- `scene.items` of a replay frame or a chart is the picture at that moment; to animate, draw the frames in turn, or use [the replay](./replay.md) in a page.
