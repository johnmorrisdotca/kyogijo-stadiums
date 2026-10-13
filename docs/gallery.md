# Gallery

Every picture the package draws, each with the code that draws it and a button to copy the code. The pictures are drawn by the build of the docs site from that code, so a picture cannot part from its snippet, and a test runs every snippet against the source.

The gallery is made when the site is built (`pnpm site`), so its pages are on the [docs site](https://johnmorrisdotca.github.io/kyogijo/docs/gallery.html) and not in this repository:

- [Surfaces and scores](https://johnmorrisdotca.github.io/kyogijo/docs/gallery-surfaces.html): the thirteen surfaces bare, with a game on each, wide and tall, as a strip and a compact card, the court's looks, light and dark.
- [The soccer pitch](https://johnmorrisdotca.github.io/kyogijo/docs/gallery-soccer.html): a pitch of every preset size, the mowing patterns, the goal styles, one half, a shoot-out.
- [Every league's surface](https://johnmorrisdotca.github.io/kyogijo/docs/gallery-leagues.html): each league that marks a court, rink, field or diamond its own way.
- [Surfaces through the years](https://johnmorrisdotca.github.io/kyogijo/docs/gallery-years.html): each sport in the seasons before and after its markings changed.
- [Ballparks and grounds](https://johnmorrisdotca.github.io/kyogijo/docs/gallery-places.html): a sample of the 94 parks and 64 grounds, a past park in two seasons.
- [Data on a surface](https://johnmorrisdotca.github.io/kyogijo/docs/gallery-data.html): every kind of data layer, every heat layer, the ready-made charts, the team-shape layers (networks, formations, Voronoi, triangulations, hulls, flow fields and sonars) and a frame of a replay.
- [Curling](https://johnmorrisdotca.github.io/kyogijo/docs/gallery-curling.html): the sheet of each rule book, its display ranges and house colours, the board and the badge, and the stones of an end.
- [Net sports](https://johnmorrisdotca.github.io/kyogijo/docs/gallery-courts.html): each court wide and tall, every look, the free zone, the singles sticks, the board of sets and games with its serving ball, and the zones of each side of the net.
- [Looks and annotations](https://johnmorrisdotca.github.io/kyogijo/docs/gallery-styling.html): the seven named looks, colours by feature, line widths and dashes, goal styles, mowing patterns, and the arrows, axes and labels that mark a surface for teaching.
- [Display ranges and zoom](https://johnmorrisdotca.github.io/kyogijo/docs/gallery-ranges.html): a drawing cropped to a zone, a half court, the red zone, the penalty area, the infield or a box of your own, at either end, wide and tall, with data, labels and a score.

Every picture in these pages is an SVG string, and each can be put somewhere else without drawing it again: pass the same options (or the SVG, or a chart's `options`) to `drawToCanvas`, `appendSurface`, `surfaceMark`, `sceneToGeoJSON` or `toPNG`, as [the renderers](./renderers.md) say. A picture here and the canvas drawn from the same scene differ in a few pixels: the edges of the letters, and a logo the canvas was not given.

The same site draws one surface in each of the twenty-two [coordinate frames](./frames.md), side by side, and puts every ballpark and ground on [a map](./atlas.md).
