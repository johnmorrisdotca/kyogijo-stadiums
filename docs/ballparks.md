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

Every park is on a map in [the atlas](./atlas.md), and the [gallery](./gallery.md) draws a sample of them.
