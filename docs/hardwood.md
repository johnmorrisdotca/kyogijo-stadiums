# A realistic basketball floor

`court: { hardwood: true }` draws a basketball court as a maple strip floor seen from above instead of the clean, flat one: narrow boards that run the length of the court with their ends staggered, a little grain and a tone of their own on each board, keys, centre circle and border that are stain with the wood showing through, a strip behind each baseline in the colour of the team that defends it, the baskets and their stanchions with soft shadows, and a satin sheen. The clean floor stays the default, and a drawing without the option is the same text as it always was.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const clean = drawKyogijo({ sport: "nba", id: "c" });
const floor = drawKyogijo({ sport: "nba", id: "c", court: { hardwood: true } });
console.log(clean.includes("<pattern"), floor.includes('<pattern id="c-hw-a"'), floor === drawKyogijo({ sport: "nba", id: "c", court: { hardwood: true } }));
// false true true
```

The lines, the keys, the circles, the three-point line and the restricted areas are the court's own, the league's rulebook figures, whichever look the floor has. The boards, the stain, the shadows and the sheen are ours: no rulebook prints them. They were drawn for this package from how a strip floor is laid, and no photograph or other drawing was copied.

## Options

`hardwood` is `true` for the defaults, or an object. Every part is optional.

| Option | What it does |
| --- | --- |
| `seed` | The seed of the boards' lengths and tones and of the grain. The same seed always gives the same floor, on every machine and in every renderer; another seed is another floor. 1 by default. |
| `detail` | `fine`: the seams between the boards and the butt joints at their ends, the grain, the soft shadows, the table and the benches. `plain`: broad boards and one shadow, for a thumbnail. `auto` (the default) is `plain` when the drawing has `detail: "simple"` or a `width` under 480 pixels, and `fine` otherwise. |
| `board` | The width of a board in inches, 1.5 to 6. 2.25 by default, the width a maple strip floor is laid in. |
| `stain` | How much of the paint is stain, 0.3 to 1. The lower it is, the more of the wood shows through the keys, the circle and the border. 0.82 by default. |
| `sheen` | The satin sheen, 0 (none) to 1.5. 1 by default. |
| `hoops` | The baskets from above, with the stanchion and its shadows. On by default; `false` leaves the usual box goal, and a `goals` choice or a `goalMarkup` of your own is followed as it is on the clean floor. |
| `bench` | The coaching box's lines across the border of the bottom sideline, the scorers' table and the two benches. On by default in the `fine` detail, and only when the ground beyond the border is deep enough to hold them. |

The rest of a court's look is the court's own and works as it does on the clean floor ([theming](./theming.md#a-courts-look)): `wood` is the colour the boards start from, `border` the stain of the border, `key`, `keyLeft` and `keyRight` the paint of the keys, `centreCircle` the paint of the circle, `line`, `apron` the ground round the court, `baselineText` and `baselineInk` the words, `centreLogo` a logo, and `paintThreePoint`. Two options are for the hardwood floor only:

| Option | What it does |
| --- | --- |
| `baselineColor` | The colour of the strip behind each baseline: one colour for both, or `[left, right]`. Without it the strip takes the colour of the team on that side (`leftColor` and `rightColor`, or a team's `color` in a score) and, with none, the border's. |
| `sidelineText` | Words along the sidelines, in the border: one text for both, or `[top, bottom]`. |

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({
  sport: "nba",
  leftColor: "#1d4f91",
  rightColor: "#8a2432",
  court: {
    hardwood: true,
    apron: "#14171c",
    border: "#13233f",
    keyLeft: "#1d4f91",
    keyRight: "#8a2432",
    baselineText: ["HARBOUR CITY", "PRAIRIE RIDGE"],
    sidelineText: "KYOGIJO LEAGUE",
  },
});
console.log(svg.includes("--ky-hw-end-left:#1d4f91"), svg.includes(">PRAIRIE RIDGE<"), (svg.match(/>KYOGIJO LEAGUE</g) ?? []).length);
// true true 2
```

## What is drawn

- **The boards.** Strips of one width run the length of the court. Each row of boards ends in different places from the row above it (no end is within a foot and a fifth of a neighbour's), each board has a tone of its own among five, and fine streaks of grain run along them. The floor is laid from two tiles of an SVG pattern, so a court has a few shapes, not thousands.
- **The stain.** The keys, the centre circle and the border are drawn with the paint's colour at `stain` opacity over the boards, so the wood shows through; the seams are drawn over the paint, so they show too. The border's two sides are the border's colour; the strip behind each baseline is the team's.
- **The words and the logo.** `baselineText` is set in the strip behind each baseline, off the middle where the stanchion's arm crosses it (the left end's lower down the page, the right end's higher); `sidelineText` in the border along each side; `centreLogo` (an address or an SVG document as text) fills the centre circle.
- **The baskets.** Each backboard stands where the court's figures put it (the NBA's is 6 feet wide, 4 feet from the baseline, with the rim 5.25 feet in), seen from above with its rim and net, its arm and its padded stanchion standing beyond the baseline. Each throws a soft shadow, a few translucent layers, as if the light came from the top left.
- **The sheen.** Light along the middle of the floor and a fall-off at its edges, a few broad glints, and a shade where the floor meets the ground round it, all gradients over the paint.
- **The lines** are drawn at 0.3 feet, nearer a real court's two inches than the clean floor's 0.4, unless the drawing is small and they would vanish; `exactLines` draws them at their true width.

The stanchion, the table, the benches and the coaching box's lines beyond the sideline are drawn to look right and are not measured from a rulebook: only the court's own figures are. That is why `bench` and `hoops` can be turned off.

## Small sizes

A floor with seams and grain is a blur at the size of a thumbnail, and its pattern costs a renderer for nothing. `detail: "auto"` therefore draws the `plain` floor for a drawing that is asked to be small: the broad boards (a board four times as wide, in longer lengths), the stain and the sheen stay, and the seams, the ends, the grain, the soft shadow layers, the edge shade, the table and the benches are left out. SVG does not know how large it is drawn, so the drawing has to be told: pass `width` in pixels (`width: 320` or `"320px"`), `detail: "simple"`, or `court: { hardwood: { detail: "plain" } }`. A `fine` floor is never made plain, and a `plain` one never fine.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const large = drawKyogijo({ sport: "nba", id: "h", court: { hardwood: true } });
const thumb = drawKyogijo({ sport: "nba", id: "h", width: 320, court: { hardwood: true } });
const clean = drawKyogijo({ sport: "nba", id: "h" });
console.log(large.includes('id="h-hw-b"'), thumb.includes('id="h-hw-b"'), thumb.length < large.length, large.length < 32_000);
// true false true true
```

## Size

The clean NBA court is about 11 kB, most of it the stylesheet, and 31 shapes. The hardwood floor adds two patterns of about 5 kB each (the boards, and the seams over the paint), a few gradients and about 90 shapes: about 30 kB and 119 elements in the `fine` detail, about 15 kB in the `plain`. A test holds both to a budget. The size does not grow with the court or with how large it is drawn.

## Every renderer, and the data on it

The floor is SVG patterns, gradients and rectangles, and nothing the other renderers lack: no blur, no filter, no mask, no blend mode. The scene reads the patterns and the gradients, the canvas tiles the patterns, and the d3, Plot and PNG renderers get an SVG that needs no stylesheet ([renderers](./renderers.md)), so the same floor is on a canvas, in a d3 selection, in a plot and in a PNG. A score's team panels, the data layers and the charts sit over the floor, its shadows and its sheen, as they sit over the clean one, and `range`, `orientation: "portrait"`, `host`, `theme` and the grids work as they do on any court. Every league of the sport takes it: the NBA, WNBA, FIBA, the NCAA's men's and women's courts, the NFHS's and the G League's ([league variants](./variants.md)).

```ts
import { sceneOf } from "@johnmorrisdotca/kyogijo-stadiums/scene";

const scene = sceneOf({ sport: "nba", id: "s", league: "fiba", court: { hardwood: true } });
console.log(scene.patterns.map((p) => `${p.id} ${p.width} by ${p.height}`).join(", "), scene.gradients.length);
// s-hw-a 96 by 6, s-hw-b 96 by 6 7
```

A page that draws with `style: "none"` and supplies the stylesheet itself gets the hardwood floor's few rules from `KYOGIJO_STYLE` (or `KYOGIJO_HARDWOOD_STYLE` alone): the strip behind each baseline (`--ky-hw-end-left` and `--ky-hw-end-right`), the stanchion, the backboard and the benches.

## What is not drawn

The nets of the baskets beyond a ring and a circle, the scorers' equipment, the court's wear and scuffs, the reflection of the arena's lights and the crowd. They are left for another change, not for want of a rule.
