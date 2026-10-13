# Data layers

`layers` in the options of `drawKyogijo` and `drawSurface` lays data on a surface. This page lists what each kind of layer takes; the README has two worked examples, and the [API reference](https://johnmorrisdotca.github.io/kyogijo/api.html) has every type.

A layer is `{ kind, data, style, ...places }`. The marks are plain SVG elements in the surface's own frame, drawn over the markings and under a score's panel, cut to the surface's outline and turned back upright when the surface lies tall. The same options always give the same string.

- **Points.** `shape` is `circle`, `square`, `triangle`, `diamond`, `cross`, `x`, `star` or `logo` (a team's logo: its own `logo`, `style.logos`, or the team's in a score drawing). `size` is a width in the layer's units or a `Scale` from each mark's `value` (`{ range: [2, 5] }`, by area); without one a mark is 1.3 percent of the surface's longer side. `fill` is a colour or a rule: `{ by: "team" }`, `{ by: "value", stops }` or `{ by: "outcome", colors }`. A mark's own `color` always wins. A mark that carries a `team` of `home` or `away` takes the layer's home or away colour.
- **Outcomes.** A mark's `outcome` is a word of yours. The standard ones are in `OUTCOMES`: `goal`, `made`, `hit`, `complete` are filled and `goal` is a little larger; `shot`, `missed`, `saved`, `blocked`, `incomplete`, `failed` are hollow. A hollow point is drawn open and a hollow line is dashed, so an outcome is never told by colour alone. `style.outcomes` adds words and changes these: `{ outcomes: { homer: { shape: "star", scale: 1.5 } } }`.
- **Lines and arrows.** Each is `x, y, x2, y2`, or `points` for a path. `curve` bows a line by a share of its length, `wavy` draws it as a wave (a carry), `head` is `triangle`, `open` or `none` (arrows have a triangle), `dash` is `auto` (a hollow outcome dashes), `solid`, `dashed` or `dotted`, and `comet` fades a line in along its length with a gradient of its own (`comet: { taper: true }` also thickens it). Gradient ids start with the drawing's id, so two drawings on a page do not share one.
- **Text.** `text` is a word or a number at `(x, y)`, upright when the surface is tall, with a halo (`--ky-layer-halo`) so that it reads on any ground; `rotate` turns it as the eye sees it.
- **Places.** Without `from`, coordinates are in the layer's `units` (the drawing's `units`, else feet; `"rulebook"` is the unit of the sport's rulebook). With `from` (a name in `FRAMES` or a `Frame`), they are the frame's numbers and go through `toSurface` with the layer's `attacking`, `surfaceSize` and `anchors`. `limits` holds a mark on the surface instead of cutting it. `clip: "none"` lets a layer run over the ground round the surface.


## Colours

Marks use custom properties, set on the drawing's `svg` with a light and a dark set: `--ky-layer` (the plain colour), `--ky-layer-home` and `--ky-layer-away` (marks with a `team`; in a score drawing the teams' own colours), `--ky-layer-edge`, `--ky-layer-hollow`, `--ky-layer-ink` and `--ky-layer-halo`. `colors` in the options sets them from code (`layer`, `layerHome`, `layerAway`, `layerEdge`, `layerHollow`, `layerInk`, `layerHalo`). With `style: "none"` the page supplies the rules: put `KYOGIJO_STYLE` in the page once.

## Accessibility

Each layer is a group with a `<title>` and a `<desc>`. Marks may carry a `title`, which is their tooltip. `layerTable(layers, { language, maxRows, className })` returns one HTML table for each layer, hidden layers included, with the numbers as text in the layer's own frame; every cell is escaped.

## Size and speed

1,000 points add about 60 kB to a drawing, and 10,000 points are drawn in about 20 ms on a laptop; tests hold the first under 70 kB and the second under 250 ms. A line with a comet costs about 400 bytes, with the gradient of its own.

## Ideas credited

See [references.md](./references.md): hockey_rink's and mplsoccer's lists of charts were read to know what to match; no code of either is used.
