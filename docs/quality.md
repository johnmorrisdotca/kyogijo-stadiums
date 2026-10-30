# Quality: drawing less on a device that needs it

A 3D view of a district is thousands of elements, and a step of its turn costs the browser in proportion to how many it moves. A laptop moves them all at 60 frames a second; a phone may not. `quality` says how much the view draws, and `auto` (the default) chooses by the frames the view really makes while it turns. It does not look at the browser's name or the device's model, so a slow laptop is treated as a slow laptop and a fast phone as a fast phone.

```ts no-run
import { mountDistrictTurn } from "@johnmorrisdotca/kyogijo-stadiums/district";

const view = mountDistrictTurn(document.querySelector("#city")!, { venues: ["bc-place", "rogers-arena"] }, {
  quality: "auto",                                   // "auto" (the default), "high", "medium" or "low"
  onQualityChange: (tier, quality) => console.log(`drawn at ${tier} (asked for ${quality})`),
});
view.setQuality("low");   // a tier at once: the camera and the auto-turn go on
view.quality;             // what was asked for: "auto" or a tier
view.tier;                // what is drawn now: "high", "medium" or "low"
```

The demo's [district page](https://johnmorrisdotca.github.io/kyogijo-stadiums/district.html?venues=t-mobile-park:mlb,lumen-field:nfl,climate-pledge-arena&mode=city&view=3d&quality=auto) has the choice in its own controls over the view (Auto, High, Medium, Low, and the tier it is drawn at now), and `?quality=auto|high|medium|low` in the address; `auto` is the default and is left out of the address.

Only a district's view has tiers. The 3D view of a single surface, a venue, a hall or a tournament layout accepts the option and answers `high`: it is small, nothing of it would be left out, and it is not timed or made smaller.

## The tiers

| | `high` | `medium` | `low` |
| --- | --- | --- | --- |
| Buildings round a district that stand up | the 130 biggest | the 24 biggest | none: every footprint stays on the floor, shaded by height |
| Trees on the floor | all | every other one | one in four |
| A venue that is small on the plan (under 12 percent of the plan's longest side), when the district has more than one | in full | one block with its height (walls and a roof) | one block with its height |
| A venue under 40 percent of the plan's longest side | in full | in full | a ring of walls, open at the top, with its field and its stands' footprint showing inside |
| The small parts of a venue (benches, glass, goals, posts, masts, fascia, rails, the faint floors of a building) | drawn | left out | left out |
| The crowd in the stands | heads and shoulders | blocks of colour | blocks of colour |
| The crowd outside | as chosen | half the people, 0.7 of the canvas's width | none |
| The pixel ratio of the layers | the device's own | at most 2 (1.5 on a phone or a tablet) | at most 1 |

`high` is everything as it always was: the same elements and the same pixels as a view with no `quality`, in the same order (a test compares them). A district of one venue never draws it as a block, whatever the tier: it is what the view is of. The flat 2D plan and the flat drawing a browser without 3D shows are not changed by any tier.

What the lower tiers draw is still the place: the footprints of every building stay on the floor, where the streets and the water are, and the tallest buildings and the venues stand where they stand. A tier changes how much is drawn, never where.

## Auto

`auto` starts on `high`, watches the frames while the view turns (a drag, the auto-turn, a glide; nothing is measured while it is still), and moves between the tiers:

- **Down**: when the mean interval between frames over a window (at least 8 frames and 0.7 seconds) is over 21 ms, which is below 48 frames a second (a view that misses one refresh in three does not hold 60; the slowest twelfth of the window is left out, so a hitch is not a slow view), it steps one tier down. Frames that are far apart (over 250 ms: a hidden page, a stopped turn) are a pause and not slow frames, and the first 0.6 second after the mount is not judged.
- **Up**: when the mean has been 18.5 ms or less (60 frames a second held) for 5 seconds, it tries the tier above.
- **A try that fails is taken back, and the next one waits longer**: a step down within 30 seconds of a step up doubles the wait (5, 10, 20, 40, 80, 160 seconds, and no more than 5 minutes). A device on the edge between two tiers settles on the lower one and tries the higher less and less often; it never flickers between them.
- **A slow display is not a slow view**: the page measures the display's own interval once, in an idle moment after the mount, so a phone that refreshes at 30 Hz is not run down to `low`, and a 120 Hz display is judged by the same 21 ms.
- **A tier asked for by name is never changed by the frames.**

A step draws the view again at the new tier (the model of each tier is kept, so a step back is only the elements) and **keeps the camera exactly where it is**: the lower tiers are framed as `high` is (`TurnModel.box` is that of `high`), the view, the pointer and the auto-turn are not touched, and a drag that is in the middle of being made goes on. The model for a lower tier is built once per set of options, so the first step down costs a build and the elements.

The judging can be tuned for a test or an unusual screen: `qualityTuning: { frames, settleMs, warmMs, budgetMs, steadyMs, upAfterMs, maxUpAfterMs, quietMs, pauseMs }` (`GOVERNOR_TUNING` has the defaults, and `createGovernor` is the governor on its own, with `frame(interval, now)` and `display(interval)`, for a page that draws its own way).

## The pixels of the layers

Every plane of the view is a layer the browser keeps pixels for, as wide and as high as the plane times the device's pixel ratio. At a ratio of 3 a district's layers are hundreds of megabytes (the Kodokan's building: fourteen floors and walls, each a layer of 1,114 by 1,186 pixels, 47 megabytes each, 713 in all), which a phone's browser does not always keep. So the layers are made at a share of their size, `rasterShares`: each element is that share as wide and as high, and its matrix widens it back, so the picture is the same and the layer holds the square of the share as many pixels.

- **The view's own share (every tier).** The scene is made 1,400 pixels across, and a phone shows it a sixth of that size: a layer as fine as the scene is five times finer than the screen can show. A layer is made as fine as the screen shows it and no finer (`viewShare`: the scale that fits the scene in its box, at any tip of the view, times the zoom, times a margin of a quarter for the perspective, rounded up to 0.25, 0.4, 0.6 or 1). The Kodokan alone on a phone is made at 0.25, a sixteenth of the pixels. The floor, one layer with the thinnest lines of the view, is made at 0.6 at least (`FLOOR_SHARE`). The share follows the view: a zoom that needs a finer one draws the layers again a moment after it stops (a pinch is not drawn again at every step), a view that is zoomed out or made smaller waits a second and a half before it makes them coarser, and the page carries the share in `data-share` on `.ky-turn`.
- `auto` caps a phone or a tablet at a ratio of 2 even at `high` (`handheld()`: a coarse pointer, or a screen of 820 CSS pixels or less on a side), so a ratio of 3 holds 4/9 of the pixels. `high` asked for by name is the device's own ratio, as it always was; the view's share applies to it too.
- `medium` caps at 1.5 on a phone or a tablet and 2 elsewhere, `low` at 1.
- A layer past a budget of device pixels (2 million at `medium` and 1 million at `low` on a handheld, 4 and 2 elsewhere) is made smaller still: the floors of a building are the big ones.
- The canvas of the crowd outside is made 0.7 as wide at `medium` and 0.5 as wide at `low`, and is not painted at `low`.

**What this does and does not do.** The sizes the package reports (`scripts/perf-district.mjs`, "layers") are the boxes times the ratio squared, which is what an engine that keeps a layer's pixels to its own box holds (WebKit does, and so does the iPhone's compositor). Chromium draws a layer at the scale its matrix has, so its memory is not that figure; but it does draw a layer made smaller a little less finely, so a one-pixel line, such as the north arrow, shows steps in it at a ratio of 3 when its layer is made at a quarter (the floor is made at 0.6 for that). The screenshots of every preset, tier and theme agree with the ones before: a wide screen (which needs the whole share) is the same byte for byte; on a phone at a ratio of 3 WebKit differs by at most 0.23 percent of the pixels by more than 8 levels (of 255) and 0.05 percent by more than 32, Chromium by at most 1.8 and 0.13 percent. The differences are the thin lines and the patterns that alias (a football field's yard lines are cleaner, a one-pixel arrow a little rougher in Chromium), never a colour or a place. We could not measure the memory an iPhone allocates; the figure is the boxes, and WebKit's frames (below) fall with it, which they would not if the box did not matter.

## Measured

`node scripts/perf-district.mjs --quality high,medium,low,auto` measures every district preset of the demo at each tier in Chromium (a desk window, and a phone window at a ratio of 3) and in WebKit (a phone window at a ratio of 3), with the CPU slowed 4 times or not (Chromium only): the planes, the milliseconds a frame and the frames a second of a turn made of pointer moves, and the layers' box. For `auto` it turns the view for up to 20 seconds, until the tier has stood still for 4, and says the tier it settled on. The table of the release it was made for is in the [changelog](../CHANGELOG.md).

## Never

The tier is never decided from the browser's name. A page that wants a tier for its own reason says it (`quality: "low"`), and one that wants the frames to decide leaves `auto`. Nothing here is stored: a view that is mounted again starts on `high` and the frames bring it back to where it was in a second or two of turning.
