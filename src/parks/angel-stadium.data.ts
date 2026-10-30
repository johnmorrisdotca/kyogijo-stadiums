// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "angel-stadium",
  "wikidata": "Q531897",
  "name": "Angel Stadium",
  "nameJa": "エンゼル・スタジアム・オブ・アナハイム",
  "aliases": [
    { "name": "Angel Stadium", "lang": "en", "kind": "wikipedia", "revision": 1379214381, "source": "en.wikipedia.org" },
    { "name": "エンゼル・スタジアム・オブ・アナハイム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q531897 sitelink" },
    { "name": "Edison International Field of Anaheim", "lang": "en", "kind": "sponsor", "from": 1998, "to": 2003, "source": "en.wikipedia.org revision 1379214381" },
    { "name": "Anaheim Stadium", "lang": "en", "kind": "former", "from": 1966, "to": 1997, "source": "en.wikipedia.org revision 1379214381" },
    { "name": "The Big A", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379214381" }
  ],
  "team": "Los Angeles Angels",
  "city": "Anaheim",
  "country": "US",
  "lat": 33.80028,
  "lon": -117.88278,
  "league": "MLB",
  "unit": "ft",
  "status": "current",
  "opened": 1966,
  "points": [
    [-45, 347],
    [-22.5, 390],
    [0, 396],
    [15, 370],
    [28, 365],
    [45, 350]
  ],
  "en": {
    "title": "Angel Stadium",
    "revision": 1379214381
  },
  "backstop_ft": 60.5,
  "walls": [
    {
      "from": 15,
      "to": 28,
      "height": 8,
      "last": 1997,
      "place": "rightCenter"
    },
    {
      "from": 15,
      "to": 28,
      "height": 19,
      "first": 1998,
      "place": "rightCenter"
    }
  ]
};
