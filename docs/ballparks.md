# Ballparks

[日本語](ballparks.ja.md) · English

`park` takes a key of `PARKS`, and `year` a season (a past park's fence, and the field's markings: see [Surfaces through the years](./eras.md)). The fence is a smooth curve through the distances the park's article publishes (the foul lines, the alleys, the middle), so that it never swings out past them. `fence: { left, leftCenter, center, rightCenter, right }` lays your own distances over a park's or over the generic field of 330, 375, 400, 375 and 330 feet.

| League | Parks |
| --- | --- |
| MLB, current | the 30 current parks, from `oriole-park-at-camden-yards` to `oracle-park` |
| MLB, past | the 44 parks clubs have left, from `baker-bowl` (1887) to `turner-field` (2016), by their first season of MLB use |
| NPB, home parks | the 12 home parks, from `tokyo-dome` to `mizuho-paypay-dome-fukuoka` |
| NPB, other and past | the 8 other grounds, from `sapporo-dome` to `nagoya-stadium` |

Each park has its name (in Japanese too for the parks of Japan), team, city, coordinates, `wikidata` item and the article and revision its figures were read from; a past MLB park has `from` and `to`, and where an article dates earlier fences they are in `periods` (`year: 1915` draws the Polo Grounds' 277, 433 and 258 feet). All the keys and facts are in [parks.md](./parks.md) and [references.md](./references.md). A park may be the host of another surface, as the infield of Wrigley Field was for the rink of the 2009 Winter Classic: see [special games](./special-games.md).

## Names

A park has the name people use and every other name it answers to, each with where it was read. This holds for the parks of Japan as for the parks of the United States and Canada.

- `name` is the **everyday name in English**, the one English sports media use (`Koshien Stadium`, `Oracle Park`, `Mazda Stadium`). Where a park carries a sponsor's name and that is what people say, it is the sponsor's. It is not always the title of the article that was cited: that title is an alias.
- `nameJa` is the **everyday name in Japanese**, as Japanese media say it (`甲子園球場`, `神宮球場`, `マツダスタジアム`); for a park of the United States or Canada, the title of its Japanese article. `readingJa` is its reading in kana wherever it has kanji (`こうしえんきゅうじょう`). `localName` and `localLanguage` give the name in the language of the place (`ja`, and `fr` for the two parks of Montreal); the parks of English-speaking places have none.
- `aliases` are the others, `{ name, lang, kind, from?, to?, source?, revision? }`. `kind` is `wikipedia` (the title of a cited article in English or in Japanese, with its `revision`: no citation is lost), `official` (what the owner or the operator calls the park, when that is not the everyday name: `阪神甲子園球場`, `Hanshin Koshien Stadium`), `sponsor` (a naming-rights name), `former` (an earlier name) or `nickname` (a short form, a name people use: `Camden Yards`, `ハマスタ`). `from` and `to` are the years a source gives, and `source` says where the name was read: an article and its revision, or a Wikidata item and property (`Wikidata Q49136 P1449`).
- `parkByName(name)` (and `parksByName`, every park that answers to it, best match first) finds a park by any of these names, in English or in Japanese. The comparison ignores case, accents, spaces and punctuation, full-width and half-width, hiragana and katakana and the long vowel mark, so `ﾏﾂﾀﾞｽﾀｼﾞｱﾑ` and `マツダ スタジアム` are the same name. The everyday names come before the official, cited and sponsors' names, and those before the former names and the nicknames. `placeByName` of the [atlas](./atlas.md) does the same over the parks and the grounds together.
- A drawing is titled with the everyday name in its language. Where the park is officially called something else, the description says so in that language (`Its official name is Hanshin Koshien Stadium.`, `正式名称は阪神甲子園球場です。`); `parkOfficialName(park, language, year)` gives that name.

```ts
import { PARKS, parkByName, parkOfficialName, parksByName } from "@johnmorrisdotca/kyogijo-stadiums/parks";

const koshien = PARKS["hanshin-koshien-stadium"];
console.log(koshien.name, koshien.nameJa, koshien.readingJa);
// Koshien Stadium 甲子園球場 こうしえんきゅうじょう
console.log(parkOfficialName(koshien), parkOfficialName(koshien, "ja"));
// Hanshin Koshien Stadium 阪神甲子園球場
console.log(parkByName("Camden Yards")?.id, parkByName("ハマスタ")?.id, parkByName("ﾏﾂﾀﾞｽﾀｼﾞｱﾑ")?.id);
// oriole-park-at-camden-yards yokohama-stadium mazda-stadium-hiroshima
console.log(parksByName("Wrigley Field").map((park) => park.id).join(), parkByName("Tiger Stadium (Detroit)")?.id);
// wrigley-field,wrigley-field-los-angeles tiger-stadium
```

The parks whose everyday name in English is not the title of the English article that was cited (a park that is not in this table is named by that title; the table is made from the code by `pnpm docs:make`). The same table for the Japanese names, with the readings, is in [Japanese](./ballparks.ja.md):

<!-- made:park-names -->
| Key | Everyday name | English article | Official name |
| --- | --- | --- | --- |
| `loandepot-park` | loanDepot Park | LoanDepot Park |  |
| `exposition-park-pittsburgh` | Exposition Park | Exposition Park (Pittsburgh) |  |
| `tiger-stadium` | Tiger Stadium | Tiger Stadium (Detroit) |  |
| `baltimore-memorial-stadium` | Memorial Stadium (Baltimore) | Baltimore Memorial Stadium |  |
| `municipal-stadium-kansas-city` | Municipal Stadium | Municipal Stadium (Kansas City, Missouri) |  |
| `olympic-stadium-montreal` | Olympic Stadium | Olympic Stadium (Montreal) |  |
| `es-con-field-hokkaido` | ES CON Field Hokkaido | Es Con Field Hokkaido |  |
| `rakuten-mobile-park-miyagi` | Rakuten Mobile Saikyo Park Miyagi | Rakuten Mobile Park Miyagi | Miyagi Baseball Stadium |
| `zozo-marine-stadium` | ZOZO Marine Stadium | Zozo Marine Stadium | Chiba Marine Stadium |
| `hiroshima-municipal-stadium` | Hiroshima Municipal Stadium (original) | Hiroshima Municipal Stadium (1957) |  |
<!-- /made:park-names -->

Where it was not certain what people call a park, the cited title is the everyday name, and [references.md](./references.md#names) says which.

## A park by name, and a past park in a season

```ts
import { PARKS, drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const park = PARKS["hanshin-koshien-stadium"];
console.log(park.name, park.nameJa, park.points.length);
// Koshien Stadium 甲子園球場 5
const svg = drawKyogijo({ sport: "mlb", park: "hanshin-koshien-stadium", language: "ja" });
console.log(svg.includes("甲子園球場のグラウンド"), svg.includes("阪神甲子園球場のグラウンド"), svg.includes("正式名称は阪神甲子園球場です"));
// true false true
```

```ts
import { PARKS, parkByWikidata, parkPointsIn, drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

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
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

// The usual 330, 375, 400, 375 and 330 feet, with a short porch in left and a deep centre.
const svg = drawKyogijo({ sport: "mlb", fence: { left: 310, center: 420 } });
console.log(svg.includes('class="ky-fence"'));
// true
```

## Walls: how high the fence stands

Where a park's article gives the height of the fence, a stretch of it has a wall: `park.walls` is a list of `{ from, to, height_ft, label?, place?, first?, last? }`, the stretch's angles from dead centre (the left field line is -45, the right field line 45), its height in feet, the name the article gives it (the Green Monster, the Crawford Boxes, the Baggie) and the seasons the height stood. 35 parks have some: 24 of MLB (the infobox's "fence height" or the article's text) and 11 of Japan (the Japanese infobox, in metres, converted once). A stretch the article gives no height for has no wall and is left bare; a park without any keeps its plain drawing.

`walls: true` draws each as a band outside the fence. The band's **width** and its **shade** both say how high the wall is (a wall of 8 feet has a band about 4 feet wide, the Green Monster's is 10), so the height can be read without colour; there are four shades, for under 10 feet, 10 to 20, 20 to 30 and 30 and over, light and dark. `walls: { legend: true }` adds a key under the field and `walls: { labels: true }` writes each wall's name and height beside it (in feet, or in metres with `units: "m"`). `year` draws the walls of that season: Fenway Park's was 25 feet until 1933 and is 37 feet 2 inches since 1934. The description lists the heights, in the language asked.

```ts
import { PARKS, parkWallsIn, drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

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
| `bullpen` | The bullpens, where the article puts them and gives a figure (the Polo Grounds', roughly 450 feet out in the gaps; Griffith Stadium's fenced-in bullpen at the end of the left field line, 388 feet out, 1956 to 1961) | `polo-grounds`, `griffith-stadium` |
| `ivy`, `basket` | The ivy on the wall (from 1937) and the basket on top of it (from 1970) | `wrigley-field` |
| `backstop` | A bar from home plate to the backstop, at the distance the article gives (the infobox's "backstop") | 43 parks |
| `dugouts` | The dugouts on the lines the article names, the home one solid and the visitors' outlined | `progressive-field`, `pnc-park`, `candlestick-park`, `loandepot-park`, `wrigley-field` (the home dugout only: its article names the third base line) |

`quirks: { only: ["hill", "backstop"] }` draws some of them and `quirks: { labels: true }` names them. The sizes of a dugout, a bullpen and a pole are for the eye and not measured: the articles give only where they are.

**No generic dugouts or bullpens.** A park gets one only where its article says which line a dugout is on (and whose) or where a bullpen stands with a distance. The other parks' articles name a bullpen only in words ("behind right-center field", "in foul territory") or a dugout without its side, which would have to be turned into a figure by guessing, so those parks have none. Read and left out: the bullpens of Progressive Field, Petco Park, Oracle Park, Tropicana Field, Camden Yards, Yankee Stadium (all words, no distance), Griffith Stadium's right-center bullpen (the article gives the distances of its corners, 438 and 401 feet, and no angle) and the dugouts of Nationals Park, Dodger Stadium, Hilltop Park and Griffith Stadium (first and third base, no side given for the home team).

```ts
import { PARKS, parkQuirksIn, drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

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
