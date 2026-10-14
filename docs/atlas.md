# The atlas

Every ballpark, soccer ground and arena the package draws, and the famous halls of the budō, on one map: 330 places in 23 countries, and the 798 clubs (519 of them different) that played their home matches in 322 of them. The five halls (the Kodokan, the Nippon Budokan, the Ryōgoku Kokugikan, the old Butokuden and the Budokwai) are in [the budō page](./budo.md#famous-halls-on-the-atlas). See the Atlas section of [the demo](https://johnmorrisdotca.github.io/kyogijo-stadiums/#atlas) and [Tenants](#tenants) below.

![A world map with a marker on each of 330 places: a circle for a place in use today, a diamond for one of the past, baseball parks solid, soccer grounds with a dot in the middle, hockey arenas with a bar across, basketball arenas with an upright bar and halls of the budō with a small square. Most are in the United States, Canada, Japan and western Europe.](./atlas-map.svg)

*The map is made by `pnpm site` with [chizu](https://github.com/johnmorrisdotca/chizu) from Natural Earth (public domain), with a marker on each place; the same markers are on the demo's interactive map.*

| Kind | Sport | In use today | Of the past |
| --- | --- | --- | --- |
| Ballpark (`PARKS`) | baseball | 44 (30 MLB, 14 NPB) | 50 (44 MLB, 6 NPB) |
| Ground (`GROUNDS`) | soccer | 60 | 4 |
| Hall (`HALLS`) | budō | 5 | 0 |
| Arena (`ARENAS`) | ice hockey, basketball | 57 (38 with hockey, 41 with basketball) | 110 (52 with hockey, 84 with basketball) |

## The data

`@johnmorrisdotca/kyogijo-stadiums/atlas` joins the four lists into one, `PLACES`, and needs nothing else (no dependency, no network).

| Field | What it is |
| --- | --- |
| `id` | The key in `PARKS`, `GROUNDS`, `HALLS` or `ARENAS`: unique across all four (`fenway-park`, `maracana`, `kodokan`, `boston-garden`). |
| `kind` | `park`, `ground`, `hall` or `arena`. |
| `name`, `nameJa`, `readingJa` | The everyday name in English and in Japanese, and the reading of the Japanese one in kana where it has kanji (every place has both names). |
| `localName`, `localLanguage` | The everyday name in the language of the place, where it is not English (`San Siro`, `it`; `Maracanã`, `pt`). |
| `aliases`, `names` | Every other name, each with where it was read and the years it was used (`{ name, lang, kind, from?, to?, source? }`), and the names a ground had for some years. See [names](./ballparks.md#names). |
| `sport`, `sports` | The sport a place is first drawn for: `baseball` for a park, `soccer` for a ground, `budo` for a hall, and for an arena `hockey` if an ice hockey club played there, else `basketball`. `sports` has every sport it is drawn for: one for a park or a ground, one or both for an arena (`TD Garden`: `hockey` and `basketball`). The `sport` filter of `placesBy` matches any of them. |
| `hall` | A hall of the budō: its capacity, how it came to be, the surfaces it offers each with what is documented of it (`basis`), and its sources: see [the budō](./budo.md#famous-halls-on-the-atlas). Absent for a park or a ground. |
| `leagues` | The leagues of the club of a park (`MLB` or `NPB`) and of every club that played its home matches in the place (`CFL` and `MLS` for BC Place, `MLB` and `CFL` for the Olympic Stadium in Montreal), then `FIFA World Cup` and `FIFA Women's World Cup` for a ground that staged matches of one. A ground with no tenant that staged none has none. |
| `tenants` | The clubs that play, or played, their home matches there, each with its league, its sport and the years it was there: see [Tenants](#tenants). Empty for a place no club is known to have called home. |
| `country`, `city` | ISO 3166-1 alpha-2, and the city the data names. |
| `team` | The club that plays in a park (a ground has none: see `tenants`). |
| `lat`, `lon` | Wikidata's coordinates (P625), in degrees. |
| `status` | `current` or `past`. A ground a club also uses (`secondary` in `PARKS`) is `current`. An arena is `current` when a club of the NHL, the NBA, the WNBA or the PWHL plays its home games there today. |
| `from`, `to` | The first and the last year in use. For a past MLB park they are its first and last MLB season (the Polo Grounds, 1891 to 1963); for a ground the year it opened and the year it closed, as Wikidata gives them, and for an arena the year it opened and the last year a club of those leagues played there ([arenas](./arenas.md#what-from-and-to-are)). A current place has no `to`. A year the data does not give is left out. |
| `wikidata` | The Wikidata item (`Q49136`), the key to join a place to other data. |

```ts
import { PLACES, atlasFacets, placeById, placesBy, surfaceOf } from "@johnmorrisdotca/kyogijo-stadiums/atlas";
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const nineteenFifty = placesBy({ year: 1950, sport: "baseball", country: "US" });
console.log(PLACES.length, nineteenFifty.length, atlasFacets().countries.length);
const polo = placeById("polo-grounds")!;
console.log(polo.from, polo.to, drawKyogijo({ ...surfaceOf(polo), style: "none" }).startsWith("<svg"));
```

```text
330 14 23
1891 1963 true
```

```ts
import { placeByName, placesByName } from "@johnmorrisdotca/kyogijo-stadiums/atlas";

console.log(placeByName("甲子園")?.id, placeByName("Koshien Stadium")?.id, placeByName("サンシーロ")?.id);
// hanshin-koshien-stadium hanshin-koshien-stadium san-siro
console.log(placesByName("Wrigley Field").map((place) => place.id).join(), placeByName("nothing here"));
// wrigley-field,wrigley-field-los-angeles undefined
```

`placeByName(name)` finds a place by any of its names, and `placesByName(name)` every place that answers to it, best match first (the everyday names, then the official and cited names, then the former names and the nicknames), ignoring case, accents, spaces, punctuation, full-width and half-width, hiragana and katakana and the long vowel mark: `placeByName("甲子園")` and `placeByName("Koshien Stadium")` are both `hanshin-koshien-stadium`, and `placeByName("サンシーロ")` is `san-siro`. `placesBy({ sport, kind, league, country, status, year, text })` keeps the places that match every field given, in the order of `PLACES`. Each of the first five takes one value or a list (a list matches any of its members). `year` keeps the places in use that year; a place with no known first year, or no known last year, is not shut out by that bound, so a place whose year the data lacks is shown rather than hidden. `text` finds every word in a name (the everyday names, the aliases and the readings), the city, the club or the country code, ignoring case and accents: `text: "meazza"` finds San Siro and `text: "こうしえん"` Koshien. `atlasFacets()` lists the sports, leagues and countries and the span of years, for the controls of a page, and `surfaceOf(place)` gives the options `drawKyogijo` takes to draw a place's surface: a park's fence, a ground's pitch at its own size or an arena's rink or court (`{ sport: "nhl", arena }`, `{ sport: "nba", arena }`), at its own size where an article gives one. `league` keeps the places with a club of that league as well as those that staged a tournament: `placesBy({ league: "CFL" })` finds BC Place and the Rogers Centre. `text` also finds a word of the name of a club, in English or in Japanese: `text: "whitecaps"` or `text: "ライオンズ"`.

## Tenants

A place is rarely a place of one sport. BC Place staged a World Cup, and is the BC Lions' home (the CFL, since 1983) and the Vancouver Whitecaps' (MLS, since 2011); the Olympic Stadium in Montreal was the Expos' and the Alouettes'; the Rogers Centre is the Blue Jays', the Argonauts' and, from 1995 to 1999, the Raptors'. `Place.tenants` lists the clubs that played their home matches in a place, with the league each played in there, its sport and the years it was there, and the place's `leagues` name every one of them.

| Field of a tenant | What it is |
| --- | --- |
| `club`, `clubJa`, `aliasesJa` | The club's name in English, as the place's article names it (`Boston Braves` for the club that is the Atlanta Braves now), else Wikidata's label; its name in Japanese as Japanese media say it (`BCライオンズ`), where there is one for that name: Wikidata's label, or the curated form where the label is not what is said ([below](#names-in-japanese)); and, where the two differ, Wikidata's label as an alias (`ブリティッシュ・コロンビア・ライオンズ`), which `placesByClub` and the `text` filter of `placesBy` still find the club by. |
| `league` | The league it played in there: `CFL`, `MLS`, `NFL`, `NBA`, `NHL`, `NPB`, `Premier League`, `J1 League`... A league that was played in different periods under one name is one (`NASL` is the league of 1968 to 1984). |
| `sport` | `baseball`, `soccer`, `american-football`, `canadian-football`, `basketball`, `ice-hockey`, `rugby-union`, `rugby-league`, `australian-football`, `lacrosse` or `cricket`. It decides the surface the place offers for the club. |
| `from`, `to` | The first and the last year it played there; a club still there has no `to`, and a club whose years neither source gives has neither. A club that was away for some seasons (the Blue Jays in 2020) has the first and the last. |
| `wikidata` | The club's Wikidata item (`Q919062`), the key to join a tenant to other data. |
| `source` | Where it was read: `wikidata` (`P466`, the place lists it as an occupant, `P115`, it lists the place as its home venue, or both), `wikipedia` (the title and revision of the place's article, whose infobox lists it among the tenants) and `years` (`wikidata` or `wikipedia`, whichever the years were read from). |

### Names in Japanese

Wikidata's Japanese label is the title of a Japanese Wikipedia page, which is not always the name people say: it spells out the initials of a name (`ブリティッシュ・コロンビア・ライオンズ` for the BC Lions, who are `BCライオンズ`), keeps a formal name or a suffix (`インテルナツィオナーレ・ミラノ` for Inter, who are `インテル・ミラノ`; `リヴァプールFC` for Liverpool, who are `リバプール`), carries a disambiguator or "history of" (`ボルチモア・コルツの歴史`), or is the club's name in another period (`OLレイン` for the Seattle Reign). `scripts/tenants.names-ja.json` holds the everyday form for each such club, by its Wikidata item, with a `kind` (`abbreviation`, `formal`, `title` or `era`) and a `note` that says what was checked, where and when; `pnpm tenants` puts it in as `clubJa` and keeps Wikidata's label as `aliasesJa`. The table is `TENANT_JAPANESE_NAMES` (`nameJaOf(tenant)` finds a tenant's row). A club is added by hand, with its source, and read by someone who reads Japanese; every other label is Wikidata's as it came.

```ts
import { placeById, placesByClub, tenantsOf } from "@johnmorrisdotca/kyogijo-stadiums/atlas";

const bcPlace = placeById("bc-place")!;
console.log(bcPlace.leagues.join(", "));
// CFL, MLS, WBL, NASL, FIFA World Cup, FIFA Women's World Cup
for (const tenant of tenantsOf(bcPlace)) console.log(`${tenant.club} (${tenant.league}) ${tenant.from}–${tenant.to ?? ""}`);
// BC Lions (CFL) 1983–
// Vancouver Whitecaps FC (MLS) 2011–
// Vancouver Nighthawks (WBL) 1988–1988
// Vancouver Whitecaps (NASL) 1983–1984
console.log(tenantsOf("olympic-stadium-montreal").map((tenant) => `${tenant.club} ${tenant.league}`).join(", "));
// Montreal Expos MLB, Montreal Alouettes CFL, Montreal Machine WLAF, Montreal Manic NASL
console.log(tenantsOf("rogers-centre", { year: 1997 }).map((tenant) => tenant.club).join(", "));
// Toronto Blue Jays, Toronto Argonauts, Toronto Raptors
console.log(placesByClub("BC Lions").map((place) => place.id).join(), "|", placesByClub("Montreal Expos").map((place) => place.id).join());
// bc-place | jarry-park-stadium,olympic-stadium-montreal
console.log(placesByClub("whitecaps")[0]?.id, placesByClub("ブリティッシュ・コロンビア・ライオンズ")[0]?.id);
// bc-place bc-place
```

`tenantsOf(place, filter)` takes a place or its key and gives its clubs, the current ones first (by the year they came) and then those that have left (the latest to leave first); the filter's `year` keeps the clubs that played there that year (a bound the data does not give shuts none out), `league` and `sport` one value or a list, and `current` the clubs that are there now (`true`) or have left (`false`). `placesByClub(name)` gives the places a club played in, best match first: a club whose name is the one given (ignoring case, accents, spaces, punctuation, width, and in Japanese hiragana or katakana), then a club with every word given in its name; the names are the club's in English and in Japanese.

### One place, several surfaces

`surfacesOf(place)` lists the surfaces a place offers (a hall's are its floors, see `hallSurfaces`), the place's own first: a park's fence (`mlb` with the park) or a ground's pitch at its own size (`soccer` with the ground), then one for each sport a tenant plays that the package draws. `surfaceOf(place)` is still the place's own, and with a sport it is the surface the place offers for it, else `undefined`.

| A tenant plays | The surface | Options |
| --- | --- | --- |
| American football (the NFL, the AFL of 1960 to 1969, the AAFC, the XFL, the USFL...) | the NFL's field | `{ sport: "nfl" }` |
| Canadian football | the CFL's field | `{ sport: "cfl" }` |
| Baseball | a park's fence; a ground has none to draw | `{ sport: "mlb", park }` |
| Soccer | at a ground, its pitch at its size; at a park, the international 105 by 68 m | `{ sport: "soccer", ground }` or `{ sport: "soccer" }` |
| Basketball (the NBA...) | the NBA's court; at an arena, its court | `{ sport: "nba" }`; at an arena `{ sport: "nba", arena }` |
| Ice hockey | the NHL's rink; at an arena, its rink | `{ sport: "nhl" }`; at an arena `{ sport: "nhl", arena }` |
| Rugby union; rugby league | World Rugby's field; the NRL's | `{ sport: "rugby" }`; `{ sport: "rugby", league: "nrl" }` |
| Australian football; cricket | the AFL's ground; the ICC's | `{ sport: "afl" }`; `{ sport: "cricket" }` |

A lacrosse club asks for no surface, nor does one of a league whose field is not the one the package draws for its sport (arena football, played on an indoor field of 50 yards, and the World Basketball League of 1988). A drawing of a place that has no tenant, or has the tenants of its own sport only, is the same as before.

```ts
import { placeById, surfaceOf, surfacesOf } from "@johnmorrisdotca/kyogijo-stadiums/atlas";
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const bcPlace = placeById("bc-place")!;
console.log(surfacesOf(bcPlace).map((surface) => surface.sport).join(), surfaceOf(bcPlace, "cfl"), surfaceOf(bcPlace, "mlb"));
// soccer,cfl { sport: 'cfl' } undefined
console.log(surfacesOf(placeById("olympic-stadium-montreal")!).map((surface) => surface.sport).join());
// mlb,cfl,nfl,soccer
console.log(drawKyogijo({ ...surfaceOf(bcPlace, "cfl")!, style: "none" }).includes('data-sport="cfl"'));
// true
```

### Arenas

An arena is a place of one or two sports, and it offers both: TD Garden was the Bruins' and is the Celtics', so `surfacesOf` gives its rink and its court, and the first is the sport of its first club (hockey where an ice hockey club played there, else basketball). Each carries the `arena`, so `drawKyogijo({ ...surfaceOf(place, "nhl") })` draws the rink at the arena's own size where an article gives one: Boston Garden's was 58.2 by 25.3 metres, nine feet shorter and two feet narrower than the NHL's, and the Boston Arena's ice was 220 by 90 feet until 1972, then 200 by 80 (the `year` picks the one that held). The Chicago Stadium, Buffalo's Memorial Auditorium and the Cow Palace are said to have had a short rink that no article measures, and are drawn at the NHL's size with a sentence in the description that says so. The 167 arenas, how an arena is chosen and where each figure was read are in [arenas](./arenas.md).

```ts
import { placeById, surfaceOf, surfacesOf, placesBy } from "@johnmorrisdotca/kyogijo-stadiums/atlas";
import { arenaRinkIn, ARENAS } from "@johnmorrisdotca/kyogijo-stadiums/arenas";
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const garden = placeById("td-garden")!;
console.log(garden.sport, garden.sports.join(), surfacesOf(garden).map((surface) => surface.sport).join());
// hockey hockey,basketball nhl,nba
console.log(arenaRinkIn(ARENAS["boston-garden"]), arenaRinkIn(ARENAS["matthews-arena"], 1926), arenaRinkIn(ARENAS["matthews-arena"], 1972));
// { length: 190.9, width: 83 } { length: 220, width: 90 } { length: 200, width: 80 }
const svg = drawKyogijo({ ...surfaceOf(placeById("boston-garden")!, "nhl")!, style: "none" });
console.log(svg.includes("Boston Garden, hockey rink"), placesBy({ sport: "hockey", status: "current" }).length);
// true 38
```

### Where the tenants come from

The clubs are those Wikidata (CC0) lists for the place as its occupants (property P466) or lists the place as their home venue (P115), and those in the `tenants` line of the infobox of the place's English Wikipedia article (CC BY-SA 4.0), at the revision named in `source.wikipedia`; a club is in a place when either says so, and `source` says which. The years are Wikidata's (the start time P580 and end time P582 of the statement) where Wikidata has them, and the article's where it has none; where the two differ, the article's, because a reader can check it at the revision named (for 21 clubs they differ; the article's end year of the Argonauts at the Rogers Centre, 2015, is right, and so is the start of the Yakult Swallows at Meiji Jingu Stadium in 1964, while Wikidata gives 2016 and 2006). A year is never guessed: a club whose years neither gives has none (10 do).

What is not a tenant: a club the article says plays only some of its matches there (select, part-time, intermittent, derby matches), a national team, a college team, a bowl game and any other event, a season, a club of a lower division or of a league the package draws no surface for and the table lists as left out (scripts/tenants.curated.json says which and why), and a club Wikidata names for no years when the article lists tenants without it. A franchise that moved or was renamed is the club of the name the article gives it then (`Boston Braves` at Braves Field, `St. Louis Browns` at Sportsman's Park), and the same franchise under its present name is left out of the same place.

`scripts/tenants.curated.json` holds the table of leagues (with the titles of their articles, their short forms and Wikidata items, and the sport each is played in) and the handful of decisions a person made, each with its reason. `pnpm tenants:fetch` reads Wikidata and English Wikipedia, one request at a time with a User-Agent that names this project and john@johnmorris.ca, as Wikimedia asks, into `scripts/tenants.wikidata.json` (it needs the network and is not part of `pnpm check`); `pnpm tenants` makes `src/tenants.data.ts` from it and prints, with `-- --report`, what it left out and where the sources disagree.

## Where the coordinates come from

The grounds' coordinates were read when the grounds were made. The parks' are fetched by `pnpm parks:coordinates` from Wikidata's coordinate location (P625, CC0) of each park's item, with the years it opened and closed (P1619 or P571, P3999 or P576), one request at a time with a User-Agent that names this project and john@johnmorris.ca, as Wikimedia asks, and written to `scripts/parks.data.json`. `pnpm parks:check` and `pnpm grounds:check` read Wikidata again and compare: the item's coordinates, its country and, for the parks, its years. Neither is part of `pnpm check`, because they need the network.

A test holds every place to a rough box round its country, so that a sign slipped in a coordinate puts nothing in the sea, and holds every id and every Wikidata item to being unique.

## The demo

The Atlas section of the demo is a chizu world map with a marker on every place:

- **Markers.** A circle is a place in use today and a diamond one of the past, so that the two differ by shape and not by colour alone; baseball parks are solid, soccer grounds have a dot in the middle, hockey arenas a bar across it and basketball arenas an upright bar, in the sport's colour (an arena of both sports shows the first). Drag the map, zoom with its buttons, Ctrl and the wheel or a pinch, and press a marker to choose it.
- **Filters.** Sport (baseball, soccer, hockey, basketball; an arena of both is found by either), today or the past, league (the main leagues and tournaments first, then every league a club of the atlas played in), country, a search of the name, the city or a club (`Whitecaps`, `ライオンズ`), and a year: pick a year and the map and the list keep only the places in use then. Choosing a country frames it on the map.
- **The list** beside the map holds the same places and does everything the markers do, so that the page works by keyboard and for a screen reader (the markers are not in the tab order): the arrow keys, Home and End move through it and Enter or Space chooses a place. Choosing a place in the list frames its country.
- **The surface.** The chosen place's surface is drawn beside the map by kyogijo, a park's fence (as it stood in the year picked, where the park has dated fences), a ground's pitch at its size or an arena's rink (at its own size, in the year picked, where an article gives one; the arena's name of that year is in the title) or court, with its facts (an arena's rink and court sizes and its seats for each sport), the clubs that played there (each with its league and years, the current ones first), its coordinates and a link to its Wikidata item, and a button to try it in the playground above. A place that more than one sport played in has a button for each of the other surfaces it offers (BC Place: the CFL field; TD Garden: the court beside the rink), which opens the playground on that sport.
- **English and Japanese**, light and dark, on a phone and on a desk. `?place=fenway-park` opens the page on a place.

The map is chizu's own build, copied into the demo by `pnpm site`; it is a development dependency of this package and nothing of it is in the package itself.

## Credits

- The map: [Natural Earth](https://www.naturalearthdata.com/) (public domain), drawn with [chizu](https://github.com/johnmorrisdotca/chizu) (MIT).
- The coordinates, the Wikidata items and the years: [Wikidata](https://www.wikidata.org/) (CC0). The clubs and their leagues: Wikidata, and the tenants lines of the English Wikipedia articles of the places (CC BY-SA 4.0, at the revisions named in the data; no text copied).
- The fences, the pitches and the rinks: the figures published by the English and Japanese Wikipedia articles cited for each place (see [parks](./parks.md), [grounds](./grounds.md), [arenas](./arenas.md) and [references](./references.md)).
