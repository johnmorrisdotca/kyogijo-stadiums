# The stands and the crowd

`crowd: true` draws the stands round a surface and the people in them, on every surface that has spectators: the fields, pitches, rinks, courts, ballparks, the curling sheet and the rest. The seating is a bowl, two sides, a horseshoe or, for a ballpark, grandstands along the foul lines and bleachers behind the park's own fence; it stands at a distance from the surface that a venue of its kind keeps; the people are heads and shoulders in a seeded pattern, in the home colours on most of the bowl with the visitors at an end, and the empty seats show. It is off by default, and a drawing without it is the same text as it always was.

```ts
import { drawKyogijo, crowdStands } from "@johnmorrisdotca/kyogijo-stadiums";

const clean = drawKyogijo({ sport: "soccer", id: "c" });
const full = drawKyogijo({ sport: "soccer", id: "c", crowd: true });
console.log(clean.includes("ky-cr-"), full.includes('class="ky-crowd"'), full === drawKyogijo({ sport: "soccer", id: "c", crowd: true }));
// false true true
console.log(crowdStands({ sport: "soccer", crowd: true })?.rings.map((ring) => ring.id).join(" "));
// lower upper
```

The distances, the depths and the heights of the stands are conventions for a drawing: no rulebook gives them, and a stadium's stands are as unlike one another as its fences. What is the surface's own is the surface (the pitch's size, the park's fence, the football field's 360 by 160 feet). The people are drawn for this package, and no photograph or other drawing was copied.

## Options

`crowd` is `true` for the sport's usual venue, 85 percent full, or an object. Every part is optional.

| Option | What it does |
| --- | --- |
| `shape` | `bowl` (stands on every side), `sides` (the long sides only), `horseshoe` (three sides) or `grandstand` (a ballpark's infield stands only). Each sport has its usual one. |
| `open` | The end of a `horseshoe` that is open: `right` (the usual) or `left`. A ballpark's horseshoe is open at the batter's eye. |
| `stadium` | What a soccer pitch is inside: `auto` (the default), `purpose` (a ground of its own), `nfl` or `cfl` (a gridiron stadium). See below. |
| `density` | How full the stands are, 0 to 1: the share of seats with someone in them. 0.85 by default. |
| `attendance`, `capacity` | The people in the stands and the seats: the density is their quotient. `capacity` defaults to the ground's (`ground` in a soccer drawing has the article's figure), else to the seats the drawing's own stands have. `density` wins over both. |
| `seed` | The seed of the crowd: the same seed is always the same crowd, on every machine and in every renderer. 1 by default. |
| `home`, `away` | The home fans' colour and the visitors'. By default the colours of the two teams in a score, else the colours of the two sides (`leftColor` and `rightColor`). The home team is on the right in North American sports and on the left in soccer and the sports that put the home team first ([score](./score.md#which-side-the-home-team-is-on)). |
| `awayEnd` | Where the visitors sit: `auto` (the sport's usual place: an end for the football codes and the pitch sports, a corner block in an arena), `left`, `right`, `corner` or `none`. |
| `tifo`, `tifoDesign` | A card display in the colours of a team in the lower stands behind its goal: `home`, `away`, `both` (`true` is `home`). `stripes` (the usual) or `checks`. |
| `gaps` | The tunnel, the camera platform, the benches and the media row. On by default. |
| `detail` | `fine` (the people, the empty seats, the aisles and the shade), `plain` (blocks of colour), or `auto` (the default): `plain` for `detail: "simple"` or a `width` under 480 pixels. |

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({
  sport: "soccer",
  id: "g",
  leftColor: "#1d4f91",
  rightColor: "#b5452c",
  crowd: { attendance: 41_250, capacity: 55_000, tifo: "home", seed: 4 },
});
console.log(svg.includes("--ky-cr-home:#1d4f91"), svg.includes("--ky-cr-away:#b5452c"), svg.includes('id="g-cr-th"'));
// true true true
```

## The venues

Each sport has a plain profile in feet: how far its first row is from the surface along a side and at an end (more on the bench side, where the benches and the cameras are), the corner's radius, and its tiers, each with its depth, its height above the surface and so its rake. A ground's seats are about the capacity of a real venue of its kind.

| Sport | Shape | Tiers | First row from the surface |
| --- | --- | --- | --- |
| `nfl`, `cfl`, `ifaf` | bowl | lower, upper | 40 feet at the sides, 26 at the ends (the CFL's 42 and 28) |
| `soccer` | bowl | lower, upper | 28 feet at the sides (36 on the bench side), 34 at the ends |
| `rugby`, `gaelic`, `lacrosse`, `fieldhockey` | bowl | lower, upper | a little less for the smaller sports, a little more for rugby and Gaelic games |
| `afl`, `cricket` | oval, round the oval ground | lower, upper | 30 feet all round |
| `nhl` | bowl | lower, upper | 8 feet |
| `nba`, `handball` | bowl | courtside rows, lower, upper | 5 feet at the sides, 10 at the ends |
| `tennis`, `volleyball`, `badminton`, `tabletennis` | bowl | lower, upper | the run-back and a little over |
| `curling`, `pickleball` | sides | lower | 14 and 18 feet |
| `mlb` | horseshoe | lower and upper infield, bleachers | laid from the park's fence (below) |

```ts
import { crowdStands } from "@johnmorrisdotca/kyogijo-stadiums";

const arena = crowdStands({ sport: "nba", crowd: true });
console.log(arena?.rings.map((ring) => `${ring.id} ${ring.from}-${ring.to} ft, ${ring.height[0]}-${ring.height[1]} ft up, ${ring.rake} deg`).join("; "));
// courtside 0-7 ft, 1-4 ft up, 23.2 deg; lower 13-70 ft, 3-32 ft up, 27 deg; upper 82-136 ft, 42-80 ft up, 35.1 deg
console.log(arena?.seats, crowdStands({ sport: "nhl", crowd: true })?.seats);
// 19372 23948
```

## A ballpark

The grandstands follow the foul lines from the poles in to a curve behind home plate, each in a lower and an upper tier, and the bleachers stand behind the outfield fence, along the fence's own outline: `park` and `year` pick the fence, `fence` changes its distances, and every seat of the bleachers is behind the wall at its bearing. A horseshoe leaves a gap at the batter's eye in centre field; `bowl` closes it, and `grandstand` draws the infield's stands only. The stands stand on a plaza of their own, not on the foul ground's grass, and the visitors sit along the third-base line.

```ts
import { crowdStands } from "@johnmorrisdotca/kyogijo-stadiums";

const fenway = crowdStands({ sport: "mlb", park: "fenway-park", crowd: true });
console.log(fenway?.rings.map((ring) => `${ring.id} ${ring.seats}`).join(", "), fenway?.seats);
// lower 11653, upper 12649, bleachers 6850 31152
console.log(crowdStands({ sport: "mlb", park: "fenway-park", crowd: { shape: "grandstand" } })?.rings.length);
// 2
```

## A soccer pitch in a gridiron stadium

Many grounds that stage soccer are the home of a football club (the grounds of the NFL's and the CFL's clubs in the package's list: `GRIDIRON_GROUNDS`). Their stands are where a football field's stands are, round a field of 120 yards with its end zones by 160 feet, not where a soccer ground's are round a pitch. For such a ground (`ground: "metlife-stadium"`, or `stadium: "nfl"` or `"cfl"` for any pitch) the stands keep the football field's footprint and the pitch stands in the middle of it, and the footprint is drawn faintly over the pitch, with its end zones, its five-yard lines and a dashed outline, so that the gap is seen.

It is to scale, and it is not the gap one might expect. The pitch is 68 metres wide, 223 feet, and the field is 160 feet, so the touchlines are 8.5 feet from the front rows on both sides, against 28 and 36 in a ground built for soccer; the ends are 33.8 feet, a little less than a purpose-built ground's 34 (the pitch is 344 feet long and the field 360). A soccer pitch in a gridiron stadium has stands right up to its touchlines and the football field's end zones round its goals.

```ts
import { crowdStands } from "@johnmorrisdotca/kyogijo-stadiums";

const gaps = (id: string) => {
  const stands = crowdStands({ sport: "soccer", ground: id, crowd: true });
  const hole = stands?.rings[0].hole;
  if (stands === undefined || hole?.kind !== "rrect") return "";
  const round = (n: number) => Math.round(n * 10) / 10;
  return `${stands.stadium}: ${round(stands.box.y - hole.y0)} ft at the side, ${round(hole.y1 - stands.box.y - stands.box.h)} at the bench side, ${round(stands.box.x - hole.x0)} at the end`;
};
console.log(gaps("metlife-stadium"));
// nfl: 8.5 ft at the side, 8.5 at the bench side, 33.8 at the end
console.log(gaps("wembley"));
// purpose: 28 ft at the side, 36 at the bench side, 34 at the end
console.log(crowdStands({ sport: "soccer", ground: "bc-place", crowd: true })?.footprint?.field.w);
// 450
```

The package has no data of which club plays where beyond the grounds' articles, so which grounds are gridiron stadiums is the list `GRIDIRON_GROUNDS` (eleven NFL grounds, the Rose Bowl, BC Place), and `stadium` says it for any other. The places of the atlas do not carry a tenant: a follow-up.

## The people

The crowd is a tile of 36 seats, 14.4 feet square, repeated over each tier as an SVG pattern: each seat is empty with the probability the density leaves, or has a shoulders-and-head, a dot of a shirt (the team's colour, in two shades, or a neutral) with a smaller dot of hair over it, laid with a little jitter from the seed. A dot is a stroke of no length with round caps, a few bytes, so a tile is about 1 kB and a stadium is two or three tiles: the home tile, the visitors' and the card display's. The upper tier is a little emptier than the lower: its tile has a veil of the seats' bed over it. The aisles are lines across each tier, and the front wall of each tier throws a soft shade on its first rows and the roof's edge on the upper tier's last. In the dark, the crowd is one opacity (`--ky-cr-dim`) dimmer.

The visitors' block is a sector of the two tiers at an end (or in a corner) in the other team's colour; with `awayEnd: "none"` the whole bowl is the home fans'. A card display is a block of the lower tier behind a goal in stripes or checks of the team's colour and white.

## The places left open

On the bench side, a tunnel crosses the lower tier, a camera platform stands on the upper tier and a media row runs behind the front rows; two benches stand in the gap between the surface and the front row, for the sports that have them; the open end of a horseshoe and the ends of two sides are cut square. `gaps: false` leaves out the tunnel, the platform, the benches and the media row.

## Small sizes and size

`detail: "auto"` draws blocks for a drawing that is asked to be small: each tier is its bed with the home colour over it at an opacity that follows the density, the visitors' block and the card display are flat colour, and there is no pattern, no aisle and no shade. SVG does not know how large it is drawn, so the drawing has to be told: pass `width` in pixels (`width: 300`), `detail: "simple"`, or `crowd: { detail: "plain" }`.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const clean = drawKyogijo({ sport: "soccer", id: "d" });
const fine = drawKyogijo({ sport: "soccer", id: "d", crowd: true });
const thumb = drawKyogijo({ sport: "soccer", id: "d", width: 300, crowd: true });
console.log(fine.includes("<pattern"), thumb.includes("<pattern"), thumb.includes("ky-cr-blk"), fine.length - clean.length < 10_000, thumb.length - clean.length < 6_000);
// true false true true true
```

A soccer ground's stands add about 9 kB to the drawing in the detail and about 4.5 kB as blocks; a ballpark's 14 kB and 10 kB (its stands are polygons, not rounded rectangles). Neither grows with the seats. A test holds both to a budget.

## Everywhere

The stands lie over the ground and under the surface, so the surface's own paint, a score's teams, the round marks and the data layers sit over them. The drawing's view is made wide enough to hold the stands (the surface's own margin grows to fit; a `margin` of your own is kept, and then the stands may be cut at the edge). Wide and tall, light and dark, a score on the surface, `range` (a crop shows the stands it covers), `theme`, grids and every league work as they do without it. A special game (`host`) has no stands. The scene reads the patterns, the canvas tiles them (a soccer ground is about 40,000 strokes and takes under 100 milliseconds), and the d3, Plot and PNG renderers get an SVG that needs no stylesheet ([renderers](./renderers.md)); GeoJSON gets the shapes and need not use them.

```ts
import { sceneOf } from "@johnmorrisdotca/kyogijo-stadiums/scene";

const scene = sceneOf({ sport: "soccer", id: "s", crowd: { tifo: "both" } });
console.log(scene.patterns.map((p) => p.id).join(" "));
// s-cr-h s-cr-a s-cr-th s-cr-ta
```

A page that draws with `style: "none"` and supplies the stylesheet itself gets the crowd's rules from `KYOGIJO_STYLE` (or `KYOGIJO_CROWD_STYLE` alone): the seats' bed, the aisles, the benches and the footprint, light and dark, and `--ky-cr-home` and `--ky-cr-away`, which a page can set.

## The stands as data

`crowdStands(options)` gives the stands as data, in feet in the surface's wide frame, without drawing them: the `rings` (each with `region` and `hole` outlines, `from` and `to` its distance from the surface, `height` of its first and last row, `rake` in degrees, `fill` and `seats`), `covers`, the `sectors` of visitors and of the card display, the `gaps`, the gridiron `footprint`, the `reach` the stands need beyond the surface on each side, and the `seats` the model holds. `outlinePath` and `outlinePoints` turn an outline into a path or a polygon. This is what a view that raises the stands needs, such as the 3D view of the `work/turn` branch: a follow-up, not done here.

## What is not drawn

The roof and its shadow on the stands beyond the shade of its edge, the concourse's food and stairs, the scoreboard, the cameras and the crowd's movement, the pitch's advertising boards and a ballpark's dugouts and bullpens (a park's `quirks` draw them on the field), the seating of a curling hall beyond its two sides, the tenants of the atlas's places. They are left for another change, not for want of a rule.
