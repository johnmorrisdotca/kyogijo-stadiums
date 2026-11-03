# Architecture: how a drawing is made

[日本語](ja/architecture.md) · English

This guide is the map for someone who wants to change the package or to understand why it behaves as it does. The file-by-file list is in [architecture](../architecture.md); this page gives the ideas that list rests on, and the checks that keep them true.

## The three rules

1. **A drawing is a pure function of its options.** No clock, no random number, no counter, no DOM. The same options give the same string, and a test holds it. An id inside a drawing is made from a hash of the options unless the caller gives one. This is why the string can be cached, compared and snapshot-tested, and why the server and the browser agree.
2. **Everything from outside is made safe on the way in.** Text is escaped, a colour passes `safeColour`, a logo address passes `safeLogo`. A new option that reaches the markup has a test with a hostile value.
3. **Every entry stands apart.** There are about forty entry points. Importing `parks` loads no rink; importing `district` loads no football field. The size of a page is the sum of what it imports, and a budget per page is checked in CI (`scripts/bundle-budget.json`).

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const options = { sport: "nhl", away: { name: "USA", score: 3 }, home: { name: "Canada", score: 2 }, status: "final" } as const;
console.log(drawKyogijo(options) === drawKyogijo(options));
// true
```

## The flow of one call

```text
options ──► draw.ts ──► a surface (surfaces/*.ts) ──► the layers (draw.parts.ts) ──► score (score.ts) ──► one string
              │               │
              │               └─ geometry.ts holds every dimension, each with its source in docs/sources.md
              └─ the stylesheet, written once per drawing unless `style: "none"`
```

`draw.ts` reads the options, chooses a surface and asks it for its markup and the places where teams and the score go. A surface is a function that returns markup and those places; it knows nothing of scores. `score.ts` puts the teams at their ends and the score in the middle. The layers, the crowd, the pageant and the situation are held in a table that `full.ts` fills, so the lean district, which draws many venues, does not carry the parts it never uses.

## Where the numbers come from

Every number in `src/geometry.ts` comes from a rulebook, a federation's diagram or a ballpark's published figures, and `docs/sources.md` says where. A change to a dimension cites its source and has a test that would have caught the old value. The ballparks, grounds, arenas and venues are not typed by hand: `scripts/*.data.json` holds the reviewed lists (distances only, never text or pictures of an article), and `pnpm parks`, `pnpm grounds`, `pnpm arenas` and `pnpm venues` write `src/*.data.ts` from them. Never edit a generated file; change its source and run the script.

## Renderers read the drawing, not redraw it

The SVG is written once. `scene` parses that text into plain data (every shape in paint order, colours worked out for light or dark), and `canvas`, `d3`, `plot`, `geojson` and `png` read the scene. `writeSvg(parseSvg(svg)) === svg` for every drawing in the package's tests, so a renderer cannot disagree with the SVG.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";
import { parseSvg, sceneOf, writeSvg } from "@johnmorrisdotca/kyogijo-stadiums/scene";

const svg = drawKyogijo({ sport: "nhl", id: "rink" });
console.log(writeSvg(parseSvg(svg)) === svg, sceneOf({ sport: "nhl", id: "rink" }).items.length > 10);
// true true
```

## The 3D view is the flat drawing, tipped

The 3D view takes the flat drawing as the floor and stands the rulebook's parts on it as planes with a `matrix3d` each. It adds no second drawing of the surface, so any change to a surface shows in 3D at once. The camera, the viewpoints and the quality tiers are shared by the district, the circuits, the judging view and the fly-through.

## How it is kept true

| Check | What it holds |
| --- | --- |
| `pnpm check` | lint, types, the unit tests (snapshots of every sport, contrast of every look, size budgets), the build and the packed package |
| `pnpm test:readme` | every example in the README, the docs and these guides, run against the built package, with the output their comments state |
| `pnpm test:demo` | the demo in Chromium and WebKit at a phone's width and a desk's, and the speed checks of three device classes |
| `pnpm docs:check` | the guides and their Japanese twins (titles, the same blocks of code, links, pictures), the README and the changelog, then the tests of the pages and every example |

A release that adds something a reader can see is not finished until the npm page shows it: new pictures through `pnpm screenshots:readme`, and a section in the README or the docs. See [CONTRIBUTING](../../CONTRIBUTING.md).
