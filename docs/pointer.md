# Pointing at a drawing

`clientPointToField(svg, clientX, clientY, { provider })` says where a pointer is on the field of a drawing: the place in a provider's numbers (NHL feet, Opta's 0 to 100, StatsBomb's 120 by 80, Statcast's, metres, and [every frame the package has](./frames.md)) and the [zone](./zones.md) the rules put it in. `fieldPointToClient` is the way back, for a marker. They are in their own entry, `@johnmorrisdotca/kyogijo-stadiums/pointer`, and need no dependency.

A drawing says where its surface is on its surface group when it is made with `pointer: true`: the box of the playing surface and the few options that decide its rules. It is off by default, so that a drawing that nobody points at is the same text as ever.

```ts no-run
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";
import { clientPointToField, fieldPointToClient } from "@johnmorrisdotca/kyogijo-stadiums/pointer";

declare const host: HTMLElement;
host.innerHTML = drawKyogijo({ sport: "nhl", pointer: true });
const svg = host.querySelector<SVGSVGElement>("svg")!;
svg.addEventListener("click", (event) => {
  const at = clientPointToField(svg, event.clientX, event.clientY, { provider: "nhl-api" });
  if (at !== null) console.log(at.x, at.y, at.zone, at.subzone, at.inBounds);
});
// A marker over the right end-zone face-off dot:
const dot = fieldPointToClient(svg, [69, 22], { provider: "nhl-api" });
```

The answer is `{ x, y, provider, surface, inBounds, zone, subzone, zones, names }`: `x` and `y` in the provider's numbers, `surface` the place in feet in the drawing's wide frame, `inBounds` true when the pointer is on the surface (or its edge), and the zone as `zoneAt` gives it.

## What it holds for

It uses the browser's own matrix for the surface group (`getScreenCTM`), so it follows everything the page does to the drawing:

- **Orientation:** a tall drawing is the wide one turned a quarter, and the group's own transform is that turn.
- **Size, padding and viewBox:** CSS size, `margin`, the preserved aspect ratio and a cropped `viewBox`.
- **Ranges:** a drawing cropped to `range: "offensive-zone"` is the same frame with a smaller view, so the numbers stay the whole surface's.
- **Ends:** `attacking: "left"` says the provider's numbers are of a team that attacks the left; they are turned as in the layers.
- **Pitches and rinks of a size or a league:** the frames that fit any size are fitted to the drawing's own surface.

It answers `null` where there is nothing to ask: a drawing made without `pointer`, a badge, a special game (a surface set inside another), an element that is not in the page, and the [3D view](./turn.md), whose floor is laid in CSS 3D, where the browser's matrix is the flat drawing's and would answer for a place that is not under the pointer. A frame of another sport than the drawing's is an error that lists the right ones.

`clientPointToFrames(svg, x, y)` is the same place in every frame of the sport at once, with the zone: what a readout that shows a place in every provider asks (the [demo's](https://johnmorrisdotca.github.io/kyogijo-stadiums/#providers) "Point at the field" does).

## Tests

The unit tests round-trip every frame of every sport, wide and tall, in boxes of three shapes (`src/pointer.test.ts`, with a page worked out from the viewBox and the group's transform), and the browser tests (`e2e/pointer.demo.mjs`) click real drawings in Chromium and in WebKit: the element under the computed page position is the mark that was drawn there, wide, tall, with padding and cropped to a range.
