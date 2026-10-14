# Theming

Nothing is branded. The drawing is coloured by custom properties on its `svg`, with a light set and a dark set that follow the device (or `data-theme="light"` or `"dark"` on the page's root, or `theme` in the options). A page sets only the ones it wants different, on the drawing or on a container above it. The defaults sit in `:where()`, which has no weight, so a page's own rule always wins. `colors` in the options sets them from code.

Every part carries a class (`ky-surface`, `ky-line`, `ky-zone-left`, `ky-banner`, `ky-plate`, `ky-score`, `ky-winbar`, `ky-lose`, `ky-badge`) for anything a property cannot reach. Pass `style: "none"` to leave the stylesheet out of each drawing and put `KYOGIJO_STYLE` in the page once, which is what the demo does for its many drawings.

```ts
import { KYOGIJO_STYLE, drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

// Two drawings on a page: the stylesheet once, and a colour of the page's own on one.
const rink = drawKyogijo({ sport: "nhl", style: "none", colors: { surface: "#dfe9f3" } });
console.log(rink.includes("<style>"), KYOGIJO_STYLE.includes("--ky-surface"), rink.includes("--ky-surface:#dfe9f3"));
// false true true
```

## A court's look

A court's own look is `court: { wood, woodAlt, apron, border, key, keyLeft, keyRight, line, centreCircle, centreLogo, baselineText, baselineInk, paintThreePoint }`; `COURT_THEMES` has five to start from: `maple`, `twoTone`, `night`, `sunburst` and `tournament` (a floor painted edge to edge, with no wood).

```ts
import { COURT_THEMES, drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({
  sport: "nba",
  court: { ...COURT_THEMES.twoTone, baselineText: ["SUMMIT PEAKS", "METRO BOLTS"], paintThreePoint: true },
});
console.log(svg.includes("--ky-key:#1e4f8f"), svg.includes("METRO BOLTS"));
// true true
```

## Named looks

`look` paints a whole drawing in one palette, light and dark, for every sport: the surface, its lines, the ground round it and the words on that ground. Seven are built in (`LOOKS`, `LOOK_NAMES`), and each is a set of the properties below on `.kyogijo[data-palette="<name>"]`, at no weight, so your own rule and the options' `colors` still win.

| `look` | What it is |
| --- | --- |
| `grass` | The natural colours of each sport (grass, ice, maple), tuned so that every painted line reads against what it is painted on. |
| `night` | A floodlit evening: a deep ground, a dark apron and pale lines. |
| `chalkboard` | Chalk on a slate board: white lines, pink and blue chalk for the red and blue ones. |
| `blueprint` | White lines on blueprint blue. |
| `print` | Black on white with greys, for a printer that has no colour; dark mode is white on black. |
| `broadcast` | Television graphics: saturated turf and wood, a navy apron, bright red and blue lines. |
| `high-contrast` | Black on white, or white on black, at the highest contrast the colours allow. |

```ts
import { LOOKS, contrastOf, drawKyogijo, lookPalette } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({ sport: "nba", look: "chalkboard", theme: "dark" });
const palette = lookPalette("chalkboard", "dark", "nba");
console.log(svg.includes('data-palette="chalkboard"'), Object.keys(LOOKS).length, contrastOf(palette.line, palette.surface)! >= 3);
// true 7 true
```

A test holds every look, in both modes and for every sport, to the contrast that WCAG 2.2 asks: every painted line is 3:1 against what it is painted on (the surface, and where the sport paints them under the line, the second tone of the mowing or planks, the key, the dirt, the infield and the foul ground), and the drawing's words are 4.5:1 against the apron. `LOOK_PAIRS` lists the pairs. A sport added later with no palette of its own takes the look's base. A court's own look (`court`, above), a net sport's `net.look` ([net sports](./courts.md)) and `colors` are over a look's colours, in that order; the attribute that says which look a drawing has is `data-palette`, since `data-look` is a net court's. The net sports (tennis, volleyball, badminton, pickleball, table tennis) take the look's surface, free zone, painted areas, lines and net.

With `style: "none"` a page puts `KYOGIJO_STYLE` in once, which has every look; a drawing that embeds its stylesheet carries only its own look's.

## Colours by feature

`featureColors` colours a part of a surface by its name: `{ "blue-lines": "#1d4f8f" }`. `FEATURES[sport]` lists the names (the three football fields share theirs) and `FEATURE_INFO[sport]` says what each is and which custom properties its colour goes to. A name the sport does not have is an error that lists the ones it has, and a colour that is not a hex colour, `rgb()`, `hsl()`, a name or `var(--name)` is ignored.

```ts
import { FEATURES, drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({ sport: "nhl", featureColors: { "blue-lines": "#0a7d3b", "face-off-circles": "#e07b00", nets: "#1d4f8f" } });
console.log(FEATURES.nhl.slice(0, 4).join(", "), svg.includes("--ky-f-blue-lines:#0a7d3b"));
// apron, boards, ice, centre-line true
```

The colour is `--ky-f-<name>` on the drawing and the part carries the class `ky-f-<name>`, so a page can also set it from its own stylesheet; only a feature that is asked for has the class, and a drawing that colours none is the same text as before.

## Lines

| Option | What it does |
| --- | --- |
| `lineWidth` | A multiple of the width the lines are drawn at (`2`, or `{ scale: 2 }`), or an absolute width in `units` for the surface's ordinary line (`{ width: 0.5 }`). The others keep their proportion to it. |
| `lineDash` | `dashed`, `dotted`, `dash-dot`, `solid`, or lengths of your own in `units` (`[2, 1]`). A line the rules dash already (a free-throw circle) keeps its own. |
| `lineOpacity` | 0 to 1, for the lines, the spots on them and the yard numbers. |

Fixtures keep their size (posts, rims, nets, the fence) and so do filled marks (plates, bases, a curling sheet's hog lines); the lines of a net sport's court are filled rectangles of the rulebook's width, so only `lineOpacity` changes them. A value that cannot be read is ignored.

## Goals and mowing

The pools have a palette in each look too (the water, the deck, the lines, and the lane ropes' own colours), and `pool.look` and `pool.deck` draw the water and the deck in a flat, a "water" or a tiled style: see [Pools](./pools.md#the-water-and-the-deck). `goals` (`box`, `line`, `strip`, `none`) styles a soccer goal, a hockey net, a basketball basket (`box` is the backboard, its arm and the rim; `line` the backboard alone; `strip` a solid backboard and a filled rim) and a football field's posts, and the goals of lacrosse, field hockey and handball (a net behind the goal line, a line across the mouth, a solid strip, or none). `goalMarkup` takes a function of your own that draws the goals: it is given where each stands (`GoalInfo`: the end, the middle of the mouth in feet, its width, its depth, which way it reaches, and the width of the drawing's ordinary line) and returns SVG in the drawing's wide frame, in feet. What it returns is written into the drawing as it is, so it must not come from a form.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({
  sport: "nhl",
  goalMarkup: ({ x, y, width, out }) => `<rect class="my-net" x="${out < 0 ? x - 4 : x}" y="${y - width / 2}" width="4" height="${width}" fill="#1d4f8f"/>`,
});
console.log(svg.split('class="my-net"').length - 1);
// 2
```

`stripePattern` mows football fields, ballparks and soccer pitches: `bands` (the usual), `wide`, `narrow`, `lengthwise`, `checks`, `diagonal`, `circles` (rings about the middle) and `none`. A ballpark is mown in `rings` (arcs about home plate) by default, and also in a `fan` (wedges out from home plate). Ice and wood have no grass, so they ignore it. [Annotations](./annotations.md) label, measure and point the surface out.

## The colours

Each property is listed with its light and dark value.

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
| `--ky-rg-o`, `--ky-rg-m`, `--ky-rg-i`, `--ky-rg-b` | a curling house: the 12-foot band, the 8-foot, the 4-foot and the button | `#2a5db0`, `#fff`, `#c8372d`, `#fff` | `#3f6cc0`, `#dfe8ef`, `#c9473e`, `#dfe8ef` |
| `--ky-hog`, `--ky-hack`, `--ky-fgz`, `--ky-pebble` | a curling sheet's hog lines, hacks, free guard zone and ice pebble | `#c8372d`, `#3a4046`, a blue tint, a grey-blue speck | darker |
| `--ky-free`, `--ky-area`, `--ky-net` | the net sports' courts: the free zone round the court (the court itself is `--ky-surface`), a painted area on it (a non-volley zone, a volleyball front zone) and the net with its posts | by look | by look |
| `--ky-serve` | the ball that marks the server | `#d8e33b` | the same |
| `--ky-dirt`, `--ky-foul`, `--ky-infield` | the baseball field | `#c28e5c`, `#3a8148`, `#58a05d` | `#8a6040`, `#275a31`, `#367a42` |
| `--ky-left`, `--ky-right` | the teams' colours | `#2f6db0`, `#b5452c` | the same |
| `--ky-left-ink`, `--ky-right-ink` | the words on those colours | `#ffffff` | the same |
| `--ky-plate`, `--ky-plate-ink` | the score's panel | `rgba(18,24,21,.9)`, `#ffffff` | `rgba(0,0,0,.82)`, the same |
| `--ky-halo` | the outline round a name painted on ice or wood | `rgba(255,255,255,.92)` | the same |
| `--ky-layer`, `--ky-layer-home`, `--ky-layer-away`, `--ky-layer-edge`, `--ky-layer-hollow`, `--ky-layer-ink`, `--ky-layer-halo` | a data layer's marks (see [data layers](./layers.md)) | light set | lightened |
| `--ky-font` | the face of every word | the system's, with Hiragino and Noto Sans JP | the same |

## Marks and the road chart

A round team mark (`mark: "round"`, and every mark of [the road to the final](./charts.md#the-road-to-the-final)) has three properties, each with a fallback so that a page need not set any: `--ky-mark-ring` (the ring inside the edge, `#fff`; `#e9ece6` in the road chart's dark set), `--ky-mark-edge` (the hairline outside it, `rgba(0,0,0,.32)`) and `--ky-mark-plain` (the disc under a crest shown whole, `#f4f5f6`). The road chart adds its own, set on `.kyogijo-road`: `--ky-road-bg` (the ground, `#f6f4ee` light and `#131716` dark), `--ky-road-ink`, `--ky-road-muted`, `--ky-road-panel` (the pill behind a round's name), `--ky-road-spine` (the dotted road), `--ky-road-left` and `--ky-road-right` (the colours of a finalist with none of its own) and `--ky-road-plain` (an opponent with none). `KYOGIJO_MARK_STYLE` and `KYOGIJO_ROAD_STYLE` have the rules; a drawing writes in the ones it uses, and `KYOGIJO_STYLE` has them all.
