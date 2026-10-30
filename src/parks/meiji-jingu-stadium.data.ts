// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "meiji-jingu-stadium",
  "wikidata": "Q944559",
  "name": "Meiji Jingu Stadium",
  "nameJa": "神宮球場",
  "readingJa": "じんぐうきゅうじょう",
  "localName": "神宮球場",
  "localLanguage": "ja",
  "aliases": [
    { "name": "Meiji Jingu Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372085507, "source": "en.wikipedia.org" },
    { "name": "明治神宮野球場", "lang": "ja", "kind": "wikipedia", "revision": 111058989, "reading": "めいじじんぐうやきゅうじょう", "source": "ja.wikipedia.org" },
    { "name": "明治神宮野球場", "lang": "ja", "kind": "official", "reading": "めいじじんぐうやきゅうじょう", "source": "ja.wikipedia.org revision 111058989" },
    { "name": "神宮", "lang": "ja", "kind": "nickname", "reading": "じんぐう", "source": "ja.wikipedia.org revision 111058989" },
    { "name": "Jingu Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372085507" }
  ],
  "team": "Tokyo Yakult Swallows",
  "teamJa": "東京ヤクルトスワローズ",
  "city": "Tokyo",
  "country": "JP",
  "lat": 35.67457,
  "lon": 139.71714,
  "league": "NPB",
  "unit": "m",
  "status": "current",
  "opened": 1926,
  "points": [
    [-45, 97.5],
    [-22.5, 112.3],
    [0, 120],
    [22.5, 112.3],
    [45, 97.5]
  ],
  "en": {
    "title": "Meiji Jingu Stadium",
    "revision": 1372085507
  },
  "ja": {
    "title": "明治神宮野球場",
    "revision": 111058989
  },
  "walls": [
    {
      "from": -45,
      "to": 45,
      "height": 3.3,
      "place": "outfield"
    }
  ]
};
