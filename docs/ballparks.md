# Ballparks

`park` takes a key of `PARKS`, and `year` a season (a past park's fence, and the field's markings: see [Surfaces through the years](./eras.md)). The fence is a smooth curve through the distances the park's article publishes (the foul lines, the alleys, the middle), so that it never swings out past them. `fence: { left, leftCenter, center, rightCenter, right }` lays your own distances over a park's or over the generic field of 330, 375, 400, 375 and 330 feet.

| League | Parks |
| --- | --- |
| MLB, current | the 30 current parks, from `oriole-park-at-camden-yards` to `oracle-park` |
| MLB, past | the 44 parks clubs have left, from `baker-bowl` (1887) to `turner-field` (2016), by their first season of MLB use |
| NPB, home parks | the 12 home parks, from `tokyo-dome` to `mizuho-paypay-dome-fukuoka` |
| NPB, other and past | the 8 other grounds, from `sapporo-dome` to `nagoya-stadium` |

Each park has its name (in Japanese too for the parks of Japan), team, city, coordinates, `wikidata` item and the article and revision its figures were read from; a past MLB park has `from` and `to`, and where an article dates earlier fences they are in `periods` (`year: 1915` draws the Polo Grounds' 277, 433 and 258 feet). All the keys and facts are in [parks.md](./parks.md) and [references.md](./references.md). A park may be the host of another surface, as the infield of Wrigley Field was for the rink of the 2009 Winter Classic: see [special games](./special-games.md).

## A park by name, and a past park in a season

```ts
import { PARKS, drawKyogijo } from "@johnmorrisdotca/kyogijo";

const park = PARKS["hanshin-koshien-stadium"];
console.log(park.name, park.nameJa, park.points.length);
// Hanshin Koshien Stadium 阪神甲子園球場 5
const svg = drawKyogijo({ sport: "mlb", park: "hanshin-koshien-stadium", language: "ja" });
console.log(svg.includes("阪神甲子園球場のグラウンド"));
// true
```

```ts
import { PARKS, parkByWikidata, parkPointsIn, drawKyogijo } from "@johnmorrisdotca/kyogijo";

const polo = PARKS["polo-grounds"];
console.log(polo.name, polo.wikidata, polo.from, polo.to, polo.periods?.length);
// Polo Grounds Q1276360 1891 1963 2
console.log(parkPointsIn(polo, 1915).map(([, feet]) => feet), parkPointsIn(polo, 1930).length);
// [ 277, 433, 258 ] 13
console.log(parkByWikidata("Q1276360") === polo);
// true
const svg = drawKyogijo({ sport: "mlb", park: "polo-grounds", year: 1915 });
console.log(svg === drawKyogijo({ sport: "mlb", park: "polo-grounds", year: 1930 }));
// false
```

## Your own fence

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo";

// The usual 330, 375, 400, 375 and 330 feet, with a short porch in left and a deep centre.
const svg = drawKyogijo({ sport: "mlb", fence: { left: 310, center: 420 } });
console.log(svg.includes('class="ky-fence"'));
// true
```

## Walls: how high the fence stands

Where a park's article gives the height of the fence, a stretch of it has a wall: `park.walls` is a list of `{ from, to, height_ft, label?, place?, first?, last? }`, the stretch's angles from dead centre (the left field line is -45, the right field line 45), its height in feet, the name the article gives it (the Green Monster, the Crawford Boxes, the Baggie) and the seasons the height stood. 35 parks have some: 24 of MLB (the infobox's "fence height" or the article's text) and 11 of Japan (the Japanese infobox, in metres, converted once). A stretch the article gives no height for has no wall and is left bare; a park without any keeps its plain drawing.

`walls: true` draws each as a band outside the fence. The band's **width** and its **shade** both say how high the wall is (a wall of 8 feet has a band about 4 feet wide, the Green Monster's is 10), so the height can be read without colour; there are four shades, for under 10 feet, 10 to 20, 20 to 30 and 30 and over, light and dark. `walls: { legend: true }` adds a key under the field and `walls: { labels: true }` writes each wall's name and height beside it (in feet, or in metres with `units: "m"`). `year` draws the walls of that season: Fenway Park's was 25 feet until 1933 and is 37 feet 2 inches since 1934. The description lists the heights, in the language asked.

```ts
import { PARKS, parkWallsIn, drawKyogijo } from "@johnmorrisdotca/kyogijo";

const fenway = PARKS["fenway-park"];
console.log(parkWallsIn(fenway, 1920).map((wall) => wall.height_ft), parkWallsIn(fenway).map((wall) => [wall.label, wall.height_ft]));
// [ 25 ] [ [ 'Green Monster', 37.167 ] ]
const svg = drawKyogijo({ sport: "mlb", park: "fenway-park", walls: { legend: true, labels: true } });
console.log(svg.includes("Green Monster 37.2 ft"), svg.includes("Wall height"), svg.includes("Wall heights: Green Monster 37.2 ft."));
// true true true
```

## Quirks

`quirks: true` draws what a park's article describes with figures (`park.quirks`), in the season `year` names:

| Quirk | What is drawn | Parks |
| --- | --- | --- |
| `hill` | An incline against the fence, as wide as the article says (Tal's Hill, 90 feet wide at 30 degrees, from 2000 to 2016) | `daikin-park` |
| `overhang` | A stand that hangs over the fence into the field, by the depth the article gives | `polo-grounds` (21 feet in left), `tiger-stadium` (10 feet in right, from 1936) |
| `pole`, `flagpole` | A foul pole or a flagpole at its angle and distance (Pesky's Pole at 302 feet; the Tiger Stadium flagpole near the 440 mark) | `fenway-park`, `tiger-stadium` |
| `bullpen` | The bullpens, where the article puts them (the Polo Grounds', roughly 450 feet out in the gaps) | `polo-grounds` |
| `ivy`, `basket` | The ivy on the wall (from 1937) and the basket on top of it (from 1970) | `wrigley-field` |
| `backstop` | A bar from home plate to the backstop, at the distance the article gives (the infobox's "backstop") | 43 parks |
| `dugouts` | The dugouts on the lines the article names, the home one solid and the visitors' outlined | `progressive-field`, `pnc-park`, `candlestick-park`, `loandepot-park` |

`quirks: { only: ["hill", "backstop"] }` draws some of them and `quirks: { labels: true }` names them. The sizes of a dugout, a bullpen and a pole are for the eye and not measured: the articles give only where they are.

```ts
import { PARKS, parkQuirksIn, drawKyogijo } from "@johnmorrisdotca/kyogijo";

const daikin = PARKS["daikin-park"];
console.log(parkQuirksIn(daikin, 2010).map((quirk) => quirk.label), parkQuirksIn(daikin).length);
// [ "Tal's Hill" ] 0
const svg = drawKyogijo({ sport: "mlb", park: "daikin-park", year: 2010, quirks: { labels: true } });
console.log(svg.includes('class="ky-hill"'), svg.includes("Features of the park: Tal's Hill, a hill 90 ft wide, sloping at 30 degrees"));
// true true
```

## The warning track and the extra points

A warning track is drawn 15 feet wide, the rule of thumb, unless the article gives it: PNC Park's is 18 feet (`track_ft`). A park's article sometimes gives more points of the fence in its text than in its infobox, and these are in `points` with their labels in `park.labels` (`[angle, words]`, the revision being the park's own): Wrigley Field's two wells, Sportsman's Park's twelve markers and Milwaukee County Stadium's nine. A park whose article gives no figure keeps its drawing, byte for byte. Where each figure was read, and what was left out, is in [references](./references.md).

Every park is on a map in [the atlas](./atlas.md), and the [gallery](./gallery.md) draws a sample of them.
