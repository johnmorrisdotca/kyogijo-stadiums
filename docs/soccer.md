# Soccer

`sport: "soccer"` draws a pitch from Law 1 of the IFAB Laws of the Game: the halfway line, the centre circle of 9.15 m, both penalty areas (16.5 m), goal areas (5.5 m), penalty marks (11 m), arcs, corner arcs (1 m) with flags, the marks off the field that show a corner kick's distance, and goals of 7.32 by 2.44 m. In a score each team's name is in its penalty area, in its colour.

| Option | What it does |
| --- | --- |
| `pitch` | A preset or a size: `{ length, width, unit }` in metres (or `yd`, `ft`, `in`, `cm`, `mm`; `units` sets the default). The international 105 by 68 m by default. |
| `ground` | A ground of `GROUNDS` ([below](./soccer.md#famous-grounds)): its pitch size. |
| `half` | `left` or `right`: one half, for a bare pitch. A drawing with teams always shows the whole. |
| `stripePattern` | `bands` (19, the default), `wide`, `narrow`, `lengthwise`, `checks`, `diagonal`, `circles` (rings about the centre) or `none`; `stripes: false` also turns them off. A football field and a ballpark take the same option ([Theming](./theming.md#goals-and-mowing)). |
| `goals` | `box` (the net, the default), `line`, `strip` or `none`; the same four style a hockey net, a basket and a field's posts, and `goalMarkup` draws a goal of your own ([Theming](./theming.md#goals-and-mowing)). `cornerFlags` turns the flags off. |
| `pitchType` | Draw the pitch in a data provider's own coordinates (below). |

The presets are `fifa`, `uefa`, `mls`, `ncaa`, `law-min`, `law-max`, `9-a-side`, `7-a-side`, `5-a-side` and `futsal`; each size and the rule it is read from is in [sources.md](./sources.md#soccer).

`status` also takes `final-aet`, `final-pens`, `extra-time` and `penalties`. A team's `penalties` is its goals in the shoot-out: both are written with the status (`Final · 2-4 pens`, the home team's first, as the home team is on the left in soccer, [Score](./score.md#which-side-the-home-team-is-on)) and a level game goes to the winner of the shoot-out.

```ts
import { drawKyogijo, soccerPitchClass, soccerSpec } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({
  sport: "soccer",
  away: { name: "Northern Owls", abbr: "NOW", score: 2, penalties: 4, color: "#3a2d6b" },
  home: { name: "Lakeshore Anchors", abbr: "LSA", score: 2, penalties: 2, color: "#0f7a7a" },
  status: "final-pens",
  competition: "Cup Final",
});
console.log(svg.includes("Final · 2-4 pens"), svg.includes("Northern Owls won 4-2 on penalties."));
// true true
const pitch = soccerSpec({ length: 110, width: 70, unit: "yd" });
console.log(pitch.length.toFixed(2), pitch.width.toFixed(2), soccerPitchClass(pitch.length, pitch.width));
// 100.58 64.01 international
```

## Famous grounds

`ground` draws a pitch at the size of a ground of `GROUNDS`: 64 venues of World Cup finals, of 2026 and of well-known clubs, each with its place, Wikidata item, coordinates, names by year (`year`), local and Japanese names and World Cups ([grounds.md](./grounds.md)). A ground whose article gives no football pitch size (22 of 64) is drawn at 105 by 68 m and marked `pitchSize: "default"`: no size is guessed. A `pitch` of your own wins.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";
import { GROUNDS, groundNameIn, groundsHosting } from "@johnmorrisdotca/kyogijo-stadiums/grounds";

const svg = drawKyogijo({ sport: "soccer", ground: "metlife-stadium", year: 2026 });
console.log(svg.includes("New York New Jersey Stadium, soccer pitch"), GROUNDS["anfield"].pitch);
// true { length: 101, width: 68 }
console.log(groundsHosting("world-cup", 1966).map((g) => g.name), groundNameIn(GROUNDS["soccer-city"], 2010));
// [ 'Wembley Stadium (1923)', 'Old Trafford' ] Soccer City
```

## Data providers

A provider writes the pitch in its own numbers (Opta's 0 to 100 with y up, StatsBomb's 120 by 80 yards with y down, Tracab's centimetres from the centre spot). `SOCCER_PROVIDERS` has ten (`opta`, `statsbomb`, `wyscout`, `tracab`, `metrica`, `skillcorner`, `secondspectrum`, `impect`, `uefa`, `international`), each as a frame. Opta, StatsBomb and Wyscout fix their lines, so they are not where the Laws put them on a 105 by 68 m pitch; the others follow the pitch's size.

- `pitchType: "opta"` stands the lines where the provider puts them and adds an empty `<g class="ky-data">` whose `transform` turns the provider's x and y into metres: raw data put in it plots.
- `rescale(from, to)` maps one provider's points to another's, landmark to landmark, so that a point on the penalty line stays on it; `inverse` goes back. The providers are also [frames](./frames.md).

```ts
import { drawKyogijo, rescale } from "@johnmorrisdotca/kyogijo-stadiums";
import { toSurface } from "@johnmorrisdotca/kyogijo-stadiums/frames";

const svg = drawKyogijo({ sport: "soccer", pitchType: "opta", id: "o" });
console.log(/<g class="ky-data" data-frame="opta" transform="matrix\(1.05 0 0 -0.68 0 68\)"\/>/.test(svg));
// true
// Opta's penalty line, 17 from the goal line, is StatsBomb's, 18 yards from it.
console.log(rescale("opta", "statsbomb")(83, 50));
// [ 102, 40 ]
console.log(toSurface([[50, 50]], { from: "opta", size: { length: 105, width: 68, unit: "m" } }).map((p) => p.map(Math.round)));
// [ [ 172, 112 ] ]
```
