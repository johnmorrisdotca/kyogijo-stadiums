# Theming

Nothing is branded. The drawing is coloured by custom properties on its `svg`, with a light set and a dark set that follow the device (or `data-theme="light"` or `"dark"` on the page's root, or `theme` in the options). A page sets only the ones it wants different, on the drawing or on a container above it. The defaults sit in `:where()`, which has no weight, so a page's own rule always wins. `colors` in the options sets them from code.

Every part carries a class (`ky-surface`, `ky-line`, `ky-zone-left`, `ky-banner`, `ky-plate`, `ky-score`, `ky-winbar`, `ky-lose`, `ky-badge`) for anything a property cannot reach. Pass `style: "none"` to leave the stylesheet out of each drawing and put `KYOGIJO_STYLE` in the page once, which is what the demo does for its many drawings.

```ts
import { KYOGIJO_STYLE, drawKyogijo } from "@johnmorrisdotca/kyogijo";

// Two drawings on a page: the stylesheet once, and a colour of the page's own on one.
const rink = drawKyogijo({ sport: "nhl", style: "none", colors: { surface: "#dfe9f3" } });
console.log(rink.includes("<style>"), KYOGIJO_STYLE.includes("--ky-surface"), rink.includes("--ky-surface:#dfe9f3"));
// false true true
```

## A court's look

A court's own look is `court: { wood, woodAlt, apron, border, key, keyLeft, keyRight, line, centreCircle, centreLogo, baselineText, baselineInk, paintThreePoint }`; `COURT_THEMES` has five to start from: `maple`, `twoTone`, `night`, `sunburst` and `tournament` (a floor painted edge to edge, with no wood).

```ts
import { COURT_THEMES, drawKyogijo } from "@johnmorrisdotca/kyogijo";

const svg = drawKyogijo({
  sport: "nba",
  court: { ...COURT_THEMES.twoTone, baselineText: ["SUMMIT PEAKS", "METRO BOLTS"], paintThreePoint: true },
});
console.log(svg.includes("--ky-key:#1e4f8f"), svg.includes("METRO BOLTS"));
// true true
```

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
