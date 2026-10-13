# Layouts and backgrounds

`drawGrid` puts many drawings in one SVG: small multiples, one per park, per period or per player, under a title and a subtitle, over a credit line, with a key they share. It is what mplsoccer's `grid` does for pitches, for every surface and every chart of the package. Behind a drawing or a grid, `background` lays a quiet pattern drawn in SVG (felt, grass, wood, ice, paper, a grid, dots) and, when you have one, a photograph.

```ts
import { drawGrid } from "@johnmorrisdotca/kyogijo/layouts";

const svg = drawGrid(
  [
    { drawing: { sport: "mlb", park: "fenway-park" }, label: "Fenway Park" },
    { drawing: { sport: "mlb", park: "wrigley-field" }, label: "Wrigley Field" },
    { drawing: { sport: "mlb", park: "oracle-park" }, label: "Oracle Park" },
  ],
  { preset: "card", title: "Three ballparks", subtitle: "Each fence from its published figures", endnote: "Drawn with Kyogijo" },
);
console.log(svg.startsWith("<svg"), svg.includes('viewBox="0 0 1200 675"'));
// true true
```

The grid is one picture. Its drawings keep their own title and description, with ids of their own, so the same drawing may appear twice; the group has a title and a description made from them; and [the scene and every renderer](./renderers.md) read it like any other drawing. The same cells and options always give the same string.

## Cells

`drawGrid(cells, options)` takes a list of one to 200 cells. A cell is any of:

- the options of `drawKyogijo` (`{ sport: "nhl", layers }`), drawn for you;
- the SVG of a drawing you already have;
- a chart (anything with a `draw()` that returns an SVG: `nbaShotChart(...)`, `soccerShotMap(...)`);
- `{ drawing, label }`, any of the above with a caption written over it. The caption is one line, made smaller to fit and cut with an ellipsis when it still does not.

A drawing given as options takes the grid's `language` and `style: "none"` unless it has its own. Every drawing is set in its cell at the largest size the cell allows, centred with its caption; the last row is centred.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo";
import { nbaShotChart } from "@johnmorrisdotca/kyogijo/charts";
import { drawGrid } from "@johnmorrisdotca/kyogijo/layouts";

const shots = Array.from({ length: 60 }, (_, i) => ({ x: ((i * 97) % 480) - 240, y: (i * 61) % 300, made: i % 3 === 0 }));
const chart = nbaShotChart(shots, { id: "first" });
// A chart, a drawing's SVG, options, and the same chart again with a caption: four cells, no id twice.
const svg = drawGrid([chart, drawKyogijo({ sport: "nba" }), { sport: "nhl" }, { drawing: chart, label: "Again" }], { id: "g" });
const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);
console.log(svg.match(/class="ky-g-cell"/g)?.length, new Set(ids).size === ids.length);
// 4 true
```

## Sizes

`preset` fits the picture to where it will be shown; a `width`, a `height` or `columns` of your own wins over the preset's.

<!-- made:presets -->
| `preset` | Size | Columns | Ground |
| --- | --- | --- | --- |
| `card` | 1200 by 675, a social card | the number that makes the drawings largest | plain |
| `square` | 1080 by 1080, a square post | the number that makes the drawings largest | plain |
| `phone` | 390 wide, as tall as the drawings need | 1 | none |
<!-- /made:presets -->

Without a preset the grid is 960 wide and as tall as the drawings need, with as many columns as fit a cell at least 280 wide. With a fixed height the drawings are fitted inside it, and the columns are the number that makes them largest taken together. `gap` is the space between cells, about a sixtieth of the width by default. The numbers are the picture's own units: its `viewBox` is the size in pixels, and `toPNG(svg, { width })` draws it at any other.

## Title, subtitle, credit line and key

```ts
import { drawGrid } from "@johnmorrisdotca/kyogijo/layouts";

const svg = drawGrid([{ sport: "nhl" }, { sport: "nhl", orientation: "portrait" }], {
  width: 900,
  title: "Shots on the rink",
  subtitle: "Wide and tall",
  endnote: "Source: the league's play-by-play",
  legend: [{ label: "Goal", color: "#c8102e" }, { label: "Block", shape: "x", hollow: true }],
});
console.log(svg.includes('class="ky-g-t"'), svg.includes('class="ky-g-legend"'));
// true true
```

`title` and `subtitle` are set at the top and wrap at the picture's width; `endnote` is the line at the foot (a credit, a source, a date); `legend` is a list of `{ label, color, shape, hollow }` set under the title, with `shape` one of the marks of a data layer. Type is set by estimate, in the font of the drawings, and scales with the width.

## What a screen reader gets

The root is a `group` named by `label` (or the `title`, or "A grid of drawings (n)"); its description lists the subtitle, every drawing's title, the key and the credit line, or is `description` when you give one. Each drawing is an `img` with its own title and description, whose ids begin with the grid's id and its place in the list (`g-0-`, `g-1-`), so that a reference inside one cannot land in another. A drawing without a title is named "Drawing 2 of 6".

## Light, dark and language

`theme: "light"` or `"dark"` forces the grid and every drawing that has none of its own; without it the grid follows the device and the page, like a drawing does. `language: "ja"` sets the grid's own words and the language of the drawings that have none. The stylesheet is written once however many drawings there are: the rules each drawing carries are peeled off and said once, and `style: "none"` leaves all of it to the page (`KYOGIJO_STYLE` has every rule).

## Backgrounds

`background` takes a pattern's name, `"none"`, or an object:

<!-- made:backgrounds -->
| Pattern | What it draws | Opacity |
| --- | --- | --- |
| `felt` | specks in the ink and the line colour | 0.8 |
| `grass` | short blades | 0.7 |
| `wood` | planks, with grain | 0.8 |
| `ice` | scratches | 0.9 |
| `paper` | fibres | 0.75 |
| `grid` | graph paper | 0.55 |
| `dots` | a dot grid | 0.7 |
<!-- /made:backgrounds -->

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo";

// A pattern, drawn over the apron and under the surface, in the drawing's ink: it follows light and dark.
const felt = drawKyogijo({ sport: "nba", id: "c", background: "felt" });
console.log(felt.includes('fill="url(#c-bg)"'));
// true
// Without a background, or with one that is nothing, the drawing is byte for byte what it was.
console.log(drawKyogijo({ sport: "nba", id: "c", background: "none" }) === drawKyogijo({ sport: "nba", id: "c" }));
// true
// A colour under the pattern, a pattern of your own opacity and scale, and a photograph at 40 percent.
const photo = drawKyogijo({
  sport: "nhl",
  id: "p",
  background: { color: "#1d2f27", pattern: "dots", opacity: 0.5, scale: 2, image: "https://example.com/arena.jpg", imageOpacity: 0.4 },
});
console.log(photo.includes('href="https://example.com/arena.jpg"'), photo.includes('opacity="0.4"'));
// true true
```

- `pattern`: one of the seven above. Each is a few shapes in a tile, with no random number, so the same options always draw the same ground. The tile is a forty-eighth of the drawing's longer side times `scale` (0.25 to 8), so that a ground looks the same on a rink in feet and on a card in pixels. `opacity` (0 to 1) replaces the pattern's own.
- `color`: a colour under the pattern and the photograph (a hex colour, `rgb()`, `hsl()`, a name or `var(--name)`; anything else is ignored). On a drawing, without one the apron keeps its own colour. On a grid, without one a plain ground colour that follows light and dark is used.
- `image`: a photograph's address or a `data:` image, held to the rules of a team's `logo` (`safeLogo`): `https:` and `http:` addresses, relative paths, image `data:` addresses and SVG documents as text are drawn; `javascript:` and the rest are dropped, and nothing can end the attribute. It is drawn over the colour and under the pattern, as an `<image>`, at `imageOpacity` (0.35 by default).
- `imageFit`: `cover` (the default: fills the ground and cuts what overhangs, with a clip, so that a canvas cuts it too), `contain` or `stretch`.

On a drawing the ground lies on the apron, round the surface and under it, wide or tall, cropped to a range, round a special game's host, and on a compact card; a badge has no surface and no ground. On a grid it lies under everything: `card` and `square` have a plain one unless it is `"none"`, `phone` has none. A grid's `background: "felt"` is a pattern on the plain colour; give a `color` of your own with a dark `theme` for a green felt.

```ts
import { drawGrid } from "@johnmorrisdotca/kyogijo/layouts";

const cells = (["nhl", "nba", "soccer", "mlb"] as const).map((sport) => ({ sport }));
// A pattern and a colour under four drawings, in the dark.
const table = drawGrid(cells, { preset: "square", theme: "dark", background: { pattern: "felt", color: "#16241f" }, title: "On the table" });
console.log(table.includes('data-theme="dark"'), table.includes('class="ky-bg-pattern"'));
// true true
```

## With the renderers

A grid is read by `sceneOf` and `sceneFromSvg` as every drawing is: each drawing is a group moved and scaled into its cell and clipped to its frame, so a scene lists every shape in paint order with its transform and its clip, the grounds as pattern fills and images, and the words as text. `drawToCanvas`, `sceneToSvg`, `sceneToGeoJSON` and `toPNG` take it as they take a drawing. A photograph that fills a ground (`slice`) is drawn by the canvas renderer cut at the ground's edges, as the SVG's own rule would.

## Limits

| What | Limit |
| --- | --- |
| Drawings in a grid | 200 (`GRID_MAX_CELLS`); more is a `RangeError` |
| Width | 120 to 8000 |
| Title, subtitle, credit line | 3, 4 and 3 lines; more are cut with an ellipsis |
| A drawing | an SVG with a `viewBox` (or a `width` and a `height`), as the package writes |
