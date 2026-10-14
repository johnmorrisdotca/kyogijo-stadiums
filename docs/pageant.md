# The pageant: flags on the halves

A stadium that hosts a final lays giant flags on the pitch, one over each half, and a round emblem on the centre circle. A drawing can do the same: each team's flag or crest large over its own half of the surface, an emblem in the middle, and the score where it can still be read. It is off by default, and a drawing without it is the same text as before.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const flag = (a: string, b: string): string => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="30" height="20" fill="${a}"/><circle cx="15" cy="10" r="5" fill="${b}"/></svg>`;
const svg = drawKyogijo({
  sport: "soccer",
  away: { name: "Aurelia", abbr: "AUR", score: 2, color: "#0f7a7a", logo: flag("#0f7a7a", "#f4f0e4") },
  home: { name: "Calvara", abbr: "CAL", score: 1, color: "#6b2d5c", logo: flag("#6b2d5c", "#f2c230") },
  status: "final",
  pageant: "carpet",
});
console.log(svg.includes('data-pageant="carpet"'), svg.split("ky-pg-carpet").length - 1);
// true 2
```

`pageant` is `"carpet"`, `"stage"`, `true` (a carpet) or the options below. It needs a score (`home` and `away`) and the full or the compact size; a bare surface, a badge and a [special game](./special-games.md) are drawn as they were. The gallery draws [every surface with each style](https://johnmorrisdotca.github.io/kyogijo-stadiums/docs/gallery-pageant.html), and the demo has the controls (Look, "Flags on the halves"). The nations and flags in the examples are made up, and the package draws no real flag or crest. A real country's flag is a code (`flag: "CA"`) drawn by [Hata](./flags.md), plugged in with `useFlags`: a carpet asks for it at its own ratio and a stage for it round. For a team with no flag, and for the middle, plug in [Dougu Sports](./emblems.md), whose generic crests, trophies and medals are ids.

## The two styles

- **`carpet`** lays each team's flag or logo flat over its half, filling the room the half gives it with a margin of about 5% of the surface's width (`fit: "fill"`, the default), as ceremony flags are made to the size of the half and not at a flag's legal ratio. The carpet's shape may differ from the flag's ratio by up to 1.75 to 1 either way, and the art is stretched a little and cropped a little, each by the square root of the difference, so that stripes stay stripes and a centred emblem stays nearly round. `fit: "ratio"` keeps the flag's own ratio and leaves the rest of the half bare. A logo shown whole on its team's colour (`markFit: "contain"`) is never stretched. A border band goes round it (dark by default, or `border: "team"` for each team's colour, or any colour), `borderWidth` is its share of the carpet's shorter side (0.02 to 0.15, 0.06 by default), a soft shadow lies under it, and, unless `fabric: false`, a gentle fixed wave of light and shade lies over it, so that a flag reads as cloth and keeps its colours. The flag's ratio is `Team.logoRatio` if you give one, else the `viewBox` (or the `width` and `height`) of an SVG logo, else 3 to 2, held between a square and 3 to 1.
- **`stage`** puts each crest on a large round disc with a ring: gold by default, `ring: "team"` for each team's colour, or any colour. The crest is a [round mark](./score.md#round-marks) inside the disc: a flag is cut to the circle (`cover`), and `markFit: "contain"` on a team shows a crest whole on a plain disc.

A team with no flag or logo is its colours as a carpet of two (its `color`, and its `textColor` or the ink that reads on it) with its name across a band, or its initials on its colour on a stage. `names: true` also writes each team's name in a pill on its flag; `names: false` leaves a bare-colour carpet nameless.

## Where the pictures go

Each picture lies in its half of the playing surface, and is moved in until it is wholly inside the surface's outline (a filled carpet gives up some of its length along the surface at the outer end, so that it keeps its full breadth): a rink's rounded corners, a ballpark's fence, an oval's curve. Where a surface has no halves:

| Surface | Where the pictures are |
| --- | --- |
| Soccer, football (NFL, CFL, IFAF), NHL, NBA, the net sports, lacrosse, rugby, Australian football, Gaelic games, field hockey, handball | One over each half, split at the middle. |
| Cricket | One on each side of the pitch, which they keep clear of. |
| Baseball | The home team on the infield, the visitors in the outfield beyond the plate, whichever side each is on. The home team's is the smaller, as the infield is. |
| Curling | One in each house. |

Tall and wide drawings put the halves where the reader sees them (a tall drawing lays them one above the other), and every picture is turned back upright: a flag is the right way up in both. The first team (the left, or the top of a tall drawing) is the one on the left of the surface, as `homeSide` decides.

`scale` (0.4 to 1, 1 by default) makes the pictures smaller than the room they have.

## The emblem

`emblem` is a competition's emblem or a trophy, given as a logo is: the id of an emblem from [Dougu Sports](./emblems.md), once it is plugged in with `useEmblems` (`"trophy:cup"`, `"trophy:soccer-globe"`, `"medal:gold"`), or your own (an address, an image `data:` address or an SVG document as text). It goes in the centre circle of a pitch, centre ice, centre court, the middle of a field, the middle of a curling sheet, or on the pitcher's mound.

- `emblemShape: "round"` (the default) draws it on a disc with a ring, like a team's stage; `emblemFit` is `contain` (the default, shown whole) or `cover`.
- `emblemShape: "plain"` draws the picture as it is over a soft shadow, for a trophy with a cut-out outline.
- `emblemName` names it in the description: `The Northern Cup emblem is in the middle.`

The pictures keep clear of the emblem. A range that does not show the middle leaves it out, and so does a tall curling sheet, whose board stays in the middle.

## The score

The score has to be readable over all this, so there are two places for it, chosen by `score`:

- **`centre`**: the plate stays in the middle of the surface with its dark backing, a little smaller (85%), and the pictures are narrowed to keep clear of it.
- **`strip`**: the compact strip under the drawing (`data-size` is `compact`), and the pictures have the whole of their halves. The strip carries each team's [round mark](./score.md#round-marks), as a compact card does.
- **`auto`** (the default): the strip when there is an emblem (it takes the middle) or the sport's board is large (the net sports' and cricket's tables of sets and innings), and otherwise whichever leaves the pictures at least 70% of the width they would have without the plate: the plate stays on a rink, a diamond and a tall pitch, and goes to the strip on a wide pitch, field or court. A tall curling sheet keeps its board.

A `size: "compact"` card has the strip already and keeps the pictures.

## The lines of the surface

`lines` says where the surface's markings lie: `over` the pictures (the default), `under` them (the pictures cover the lines beneath), or `through` (under, and the pictures are a little see-through, so that the lines show faintly). In a pageant a team's end is not painted in its colour, since the picture is the team's; a football end zone keeps its colour, which is a part of the field.

## Small, dark and cropped

- **Small sizes.** Under 320 pixels wide (`width`), or with `detail: "simple"`, the fabric, the hairlines and the name pills are left out, and the picture is simple.
- **Dark theme.** The border, the hairline, the shadow and the light disc of the emblem have their own dark colours, set by custom properties (`--ky-pg-border`, `--ky-pg-edge`, `--ky-pg-seam`, `--ky-pg-shadow`, `--ky-pg-disc`, `--ky-pg-groove`, `--ky-pg-light`), so that a page can change them. `KYOGIJO_PAGEANT_STYLE` is the rules, for a drawing made with `style: "none"` (`KYOGIJO_STYLE` has them).
- **A `range`.** A carpet is laid out for the whole surface and shown where the range shows it; with room for annotations it is cut with the surface.

## The entrance

`animate: "unfurl"` rolls each carpet out from its own end (a stage and the emblem grow), `"fade"` brings each in; `"none"` is the default. It is CSS only (`KYOGIJO_PAGEANT_MOTION`, written into the drawing only when asked for), the second team's picture and the emblem come a little later, and every rule is inside `@media (prefers-reduced-motion: no-preference)`, so a reader who has asked for less motion sees the finished drawing. The canvas, the PNG and the other [renderers](./renderers.md) read no animation and draw it finished.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({
  sport: "nhl",
  away: { name: "Northern Owls", abbr: "NOW", score: 3, color: "#3a2d6b" },
  home: { name: "Lakeshore Anchors", abbr: "LSA", score: 2, color: "#0f7a7a" },
  pageant: { style: "stage", ring: "team", animate: "unfurl" },
});
console.log(svg.includes("@keyframes ky-pg-grow"), svg.includes("prefers-reduced-motion:no-preference"));
// true true
```

## The renderers

A pageant is part of the drawing, so every [renderer](./renderers.md) draws it from the scene: the canvas, `appendSurface` (d3), `surfaceMark` (Observable Plot) and `toPNG`. [`sceneToGeoJSON`](./renderers.md#geojson) leaves it out, since the GeoJSON is of the surface and a picture laid over it is not a part of it.

## All the options

| Option | What it does |
| --- | --- |
| `style` | `carpet` (the default) or `stage`. |
| `border`, `borderWidth` | A carpet's border band: `dark` (the default), `team` or a colour; its share of the carpet's shorter side, 0.02 to 0.15. |
| `fit` | `fill` (the default): a carpet takes the room its half gives it; `ratio`: it keeps its flag's ratio. |
| `fabric` | A carpet's fabric of light and shade. On by default. |
| `ring` | A stage's ring: `gold` (the default), `team` or a colour. |
| `lines` | `over` (the default), `under` or `through`. |
| `emblem`, `emblemShape`, `emblemFit`, `emblemName` | The emblem in the middle, its shape (`round` or `plain`), its fit (`contain` or `cover`) and its name. |
| `score` | `auto` (the default), `centre` or `strip`. |
| `scale` | The pictures' share of the room they have, 0.4 to 1. |
| `names` | A name on each picture; by default only a team with no picture has its name. |
| `animate` | `none` (the default), `unfurl` or `fade`. |

A value that is not one of these is the default's, a number is held to its range, a colour must be a safe one (`safeColour`) and the emblem a safe picture (`safeLogo`). Team: `logoRatio` is the ratio of a carpet's width over its height. Exports: the types `PageantOptions` and `PageantStyle`, and the rules `KYOGIJO_PAGEANT_STYLE` and `KYOGIJO_PAGEANT_MOTION`; the element takes `options='{"pageant": "carpet"}'` or the attribute `pageant="carpet"`.
