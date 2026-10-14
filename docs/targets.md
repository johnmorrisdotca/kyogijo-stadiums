# Goal mouths, the strike zone and the stumps

A target seen end-on: the mouth of a goal from the shooter's side, the strike zone from the catcher's, the stumps from the bowler's end. Each is a flat elevation, `x` across (positive to the viewer's right) and `z` up from the ground, drawn to scale from the rulebook's figure, with zones, and with where each shot, pitch or delivery crossed it laid on as marks. The module is `@johnmorrisdotca/kyogijo-stadiums/target`. The marks are the [data layers](./layers.md)', so each is described, tabled and upright, in light and dark, and (unlike a plain layer, these views are small) always carries `data-mark-id`, `data-index` and `data-zone`. The drawing is one SVG string, so it is data in [every renderer](./renderers.md). (`soccerGoalMouth` of the [charts](./charts.md#soccer) is the soccer goal fed from a shot map; this is the same view for six sports, with zones.)

## A goal

```ts
import { drawGoalMouth } from "@johnmorrisdotca/kyogijo-stadiums/target";

const view = drawGoalMouth(
  [
    { x: -2.4, z: 3.6, outcome: "goal" },
    { x: 0, z: 0.4, outcome: "saved" },
    { x: 3.4, z: 2, outcome: "wide" },
    { x: 1.0, z: 4.6, outcome: "high" },
  ],
  { sport: "nhl", zones: "labels" },
);
console.log(view.placed, view.zones["top-left-corner"], view.zones["five-hole"], view.zones["wide-right"], view.zones["over-the-bar"]);
console.log(view.target.width, view.target.height, view.target.unit);
// 4 1 1 1 1
// 6 4 ft
```

| `sport` | The goal | Where the figure is read |
| --- | --- | --- |
| `nhl` | 6 by 4 feet | NHL Official Rules, Rule 2.1 |
| `soccer` | 7.32 by 2.44 m (8 yards by 8 feet), or the format's own goal for a `pitch` of a small-sided format | IFAB Laws of the Game, Law 1 |
| `handball` | 3 by 2 m | IHF Rules of the Game for Indoor Handball, Rule 1:2 |
| `waterpolo` | 3.0 m between the posts, the crossbar's underside 0.9 m over the water | World Aquatics Competition Regulations (February 2026), Part Six Article 21.6 (21.6.3.2 posts, 21.6.4.2 crossbar) |
| `lacrosse` | 6 by 6 feet (World Lacrosse's 1.83 m, the NCAA's and the PLL's six feet); `league: "nll"` or `"world-box"`, the box floor's 4 feet 9 inches by 4 | each league's rules, in [the sources](./sources.md) |
| `fieldhockey` | 3.66 by 2.14 m | FIH Rules of Hockey 2026, Field and Equipment Specifications 1.5 (Goals) |

`units` is the unit of the shots' `x` and `z` (and of `goal`, a goal of another size): the rulebook's own by default, feet for hockey and lacrosse and metres for the rest. A shot's `outcome` is `goal`, `saved`, `post`, `crossbar`, `wide`, `high` or `blocked` (a block has no place across the goal and is left out and counted); without one a shot outside the frame is `wide` or `high`. A post and a crossbar are drawn on the frame, a shot wide or high outside it.

The zones are nine cells across the opening, the shooter's left first: the three corners at the top and the bottom, the sides and the middle, and in hockey the top shelf (under the crossbar) and the five-hole (low, between the pads) for the middle cells of those rows. No rulebook defines them; the names are the game's, and the cells are the thirds of the opening. Outside it, `wide-left`, `wide-right` and `over-the-bar`. `zones` counts the marks of each, `targetZoneAt({ sport }, x, z)` names the zone of a place, and `zones: true` or `"labels"` draws the cells with their names (each cell a `<rect>` with the zone's id and a `<title>`, so a listener can use it too).

## The strike zone

`drawStrikeZone(pitches, options)` is the catcher's view of home plate, 17 inches across (Official Baseball Rules 2.02), with the zone from the batter's knees to his belt. The rules' definition of the zone depends on the batter, so `top` and `bottom` (feet) are options; the defaults, 3.5 and 1.5, are a batter of average build and ours, not the rulebook's. A pitch is `{ x, z, outcome, type, order }`: `x` and `z` are Statcast's `plate_x` (positive to the catcher's right) and `plate_z`, in feet.

```ts
import { drawStrikeZone, targetZoneAt } from "@johnmorrisdotca/kyogijo-stadiums/target";

const view = drawStrikeZone(
  [
    { x: 0.1, z: 2.6, outcome: "called-strike", type: "FF" },
    { x: 1.3, z: 1.1, outcome: "ball", type: "SL" },
    { x: -0.4, z: 2.0, outcome: "swinging-strike", type: "SL" },
  ],
  { bats: "R", top: 3.4, bottom: 1.6 },
);
console.log(view.placed, view.zones["zone-5"], view.zones["zone-14"], view.key.map((k) => k.id).join(" "));
console.log(targetZoneAt({ sport: "mlb" }, -0.6, 3.3).zone, targetZoneAt({ sport: "mlb" }, 0.9, 1.1).zone);
// 3 1 1 ball called-strike swinging-strike
// zone-1 zone-14
```

- **The nine zones**, numbered 1 to 9 from the top left, as the catcher sees them (Gameday's and Statcast's `zone`), and the **chase grid** of four more, 11 to 14 (high left, high right, low left, low right), the zone enlarged by half its width and height on every side. A place beyond them is `outside`. `chase: false` leaves them out.
- **The batter's side:** `bats: "R"` puts a marker with an R on the catcher's left of the plate, where a right-handed batter stands; `"L"` on the right.
- **The pitches** are numbered in the order given (`order` says another), coloured by `result` (the default) or by `type` (`colorBy: "type"`) and shaped by the result: a ball a hollow circle, a called strike a square, a swinging strike an x, a foul a hollow triangle, a ball in play a star, a hit batter a diamond. `numbers: false` leaves the numbers off. `key` says what each colour and shape is.

## The stumps

`drawStumps(deliveries, options)` is the wicket from the bowler's end: three stumps across 9 inches (22.86 cm), their tops 28 inches (71.12 cm) over the ground (MCC Laws of Cricket, Law 8.1 and 8.2), the bails 4.31 inches long and standing no more than half an inch over the stumps, and the line zones either side: the stumps' own width again on each side, and wide of that (`on-stumps`, `outside-left`, `outside-right`, `wide-left`, `wide-right`, `over-stumps`). Which side is the off side depends on the batter's hand and the way the picture looks, so the ids say left and right as the bowler sees them and do not guess.

```ts
import { drawStumps, lengthZoneOf } from "@johnmorrisdotca/kyogijo-stadiums/target";

const view = drawStumps([
  { x: 0.02, z: 0.4, outcome: "wicket", length: 5.1 },
  { x: 0.5, z: 0.9, outcome: "dot", length: 7.4 },
]);
console.log(view.zones["on-stumps"], view.zones["wide-right"], lengthZoneOf(5.1), lengthZoneOf(7.4));
// 1 1 good-length short-of-a-length
```

A delivery's `length` is how far from the batter's stumps it pitched: it names the length zone (`yorker` under 2 m, `full` to 4, `good-length` to 6, `short-of-a-length` to 8, `short` beyond), which is the delivery's tooltip. Those bands are ours: broadcasters' differ with the bowler's pace, and the Laws have none. The stump's diameter is drawn at 1.5 inches, which is a figure for the drawing, not the Laws'.

## Light, dark, Japanese and every renderer

`theme`, `language` (`"ja"`), `id`, `title`, `className` and `style: "none"` are options as in a drawing. Light and dark are the colours of the drawing's custom properties, the words are in both languages, and the SVG is the same string for the same options. `sceneOf`, `sceneToSvg`, `sceneToGeoJSON`, `drawToCanvas`, `appendSurface`, `surfaceMark` and `toPNG` take it as they take any drawing.
