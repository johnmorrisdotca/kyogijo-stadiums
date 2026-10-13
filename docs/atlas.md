# The atlas

Every ballpark and soccer ground the package draws, on one map: 158 places in 23 countries. See the [README](../README.md#features), and the Atlas section of [the demo](https://johnmorrisdotca.github.io/kyogijo/#atlas).

![A world map with a marker on each of 158 places: a circle for a place in use today, a diamond for one of the past, baseball parks solid and soccer grounds with a dot in the middle. Most are in the United States, Japan and western Europe.](./atlas-map.svg)

*The map is made by `pnpm site` with [chizu](https://github.com/johnmorrisdotca/chizu) from Natural Earth (public domain), with a marker on each place; the same markers are on the demo's interactive map.*

| Kind | Sport | In use today | Of the past |
| --- | --- | --- | --- |
| Ballpark (`PARKS`) | baseball | 44 (30 MLB, 14 NPB) | 50 (44 MLB, 6 NPB) |
| Ground (`GROUNDS`) | soccer | 60 | 4 |

## The data

`@johnmorrisdotca/kyogijo/atlas` joins the two lists into one, `PLACES`, and needs nothing else (no dependency, no network).

| Field | What it is |
| --- | --- |
| `id` | The key in `PARKS` or `GROUNDS`: unique across both (`fenway-park`, `maracana`). |
| `kind` | `park` or `ground`. |
| `name`, `nameJa` | The name in English, and in Japanese where the data has one (every ground, and the parks of Japan). |
| `sport` | `baseball` or `soccer`. |
| `leagues` | `MLB` or `NPB` for a park; `FIFA World Cup` and `FIFA Women's World Cup` for a ground that staged matches of one. A club ground that staged none has none. |
| `country`, `city` | ISO 3166-1 alpha-2, and the city the data names. |
| `team` | The club that plays in a park. |
| `lat`, `lon` | Wikidata's coordinates (P625), in degrees. |
| `status` | `current` or `past`. A ground a club also uses (`secondary` in `PARKS`) is `current`. |
| `from`, `to` | The first and the last year in use. For a past MLB park they are its first and last MLB season (the Polo Grounds, 1891 to 1963); for any other place the year it opened and the year it closed, as Wikidata gives them. A current place has no `to`. A year the data does not give is left out. |
| `wikidata` | The Wikidata item (`Q49136`), the key to join a place to other data. |

```ts
import { PLACES, atlasFacets, placeById, placesBy, surfaceOf } from "@johnmorrisdotca/kyogijo/atlas";
import { drawKyogijo } from "@johnmorrisdotca/kyogijo";

const nineteenFifty = placesBy({ year: 1950, sport: "baseball", country: "US" });
console.log(PLACES.length, nineteenFifty.length, atlasFacets().countries.length);
const polo = placeById("polo-grounds")!;
console.log(polo.from, polo.to, drawKyogijo({ ...surfaceOf(polo), style: "none" }).startsWith("<svg"));
```

```text
158 14 23
1891 1963 true
```

`placesBy({ sport, kind, league, country, status, year, text })` keeps the places that match every field given, in the order of `PLACES`. Each of the first five takes one value or a list (a list matches any of its members). `year` keeps the places in use that year; a place with no known first year, or no known last year, is not shut out by that bound, so a place whose year the data lacks is shown rather than hidden. `text` finds every word in the name, the name in Japanese, the city, the club or the country code, ignoring case and accents. `atlasFacets()` lists the sports, leagues and countries and the span of years, for the controls of a page, and `surfaceOf(place)` gives the options `drawKyogijo` takes to draw a place's surface: a park's fence or a ground's pitch at its own size.

## Where the coordinates come from

The grounds' coordinates were read when the grounds were made. The parks' are fetched by `pnpm parks:coordinates` from Wikidata's coordinate location (P625, CC0) of each park's item, with the years it opened and closed (P1619 or P571, P3999 or P576), one request at a time with a User-Agent that names this project and john@johnmorris.ca, as Wikimedia asks, and written to `scripts/parks.data.json`. `pnpm parks:check` and `pnpm grounds:check` read Wikidata again and compare: the item's coordinates, its country and, for the parks, its years. Neither is part of `pnpm check`, because they need the network.

A test holds every place to a rough box round its country, so that a sign slipped in a coordinate puts nothing in the sea, and holds every id and every Wikidata item to being unique.

## The demo

The Atlas section of the demo is a chizu world map with a marker on every place:

- **Markers.** A circle is a place in use today and a diamond one of the past, so that the two differ by shape and not by colour alone; baseball parks are solid and soccer grounds have a dot in the middle, in the sport's colour. Drag the map, zoom with its buttons, Ctrl and the wheel or a pinch, and press a marker to choose it.
- **Filters.** Sport, today or the past, league, country, a search of the name, the city or the club, and a year: pick a year and the map and the list keep only the places in use then. Choosing a country frames it on the map.
- **The list** beside the map holds the same places and does everything the markers do, so that the page works by keyboard and for a screen reader (the markers are not in the tab order): the arrow keys, Home and End move through it and Enter or Space chooses a place. Choosing a place in the list frames its country.
- **The surface.** The chosen place's surface is drawn beside the map by kyogijo, a park's fence (as it stood in the year picked, where the park has dated fences) or a ground's pitch at its size, with its facts, its coordinates and a link to its Wikidata item, and a button to try it in the playground above.
- **English and Japanese**, light and dark, on a phone and on a desk. `?place=fenway-park` opens the page on a place.

The map is chizu's own build, copied into the demo by `pnpm site`; it is a development dependency of this package and nothing of it is in the package itself.

## Credits

- The map: [Natural Earth](https://www.naturalearthdata.com/) (public domain), drawn with [chizu](https://github.com/johnmorrisdotca/chizu) (MIT).
- The coordinates, the Wikidata items and the years: [Wikidata](https://www.wikidata.org/) (CC0).
- The fences and the pitches: the figures published by the English and Japanese Wikipedia articles cited for each place (see [parks](./parks.md), [grounds](./grounds.md) and [references](./references.md)).
