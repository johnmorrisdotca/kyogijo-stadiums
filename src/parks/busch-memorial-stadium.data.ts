// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "busch-memorial-stadium",
  "wikidata": "Q1017286",
  "name": "Busch Memorial Stadium",
  "nameJa": "ブッシュ・メモリアル・スタジアム",
  "aliases": [
    { "name": "Busch Memorial Stadium", "lang": "en", "kind": "wikipedia", "revision": 1375705915, "source": "en.wikipedia.org" },
    { "name": "ブッシュ・メモリアル・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1017286 sitelink" },
    { "name": "Civic Center Busch Memorial Stadium", "lang": "en", "kind": "former", "from": 1966, "to": 1981, "source": "en.wikipedia.org revision 1375705915" },
    { "name": "Busch Stadium", "lang": "en", "kind": "former", "from": 1982, "to": 2005, "source": "en.wikipedia.org revision 1375705915" },
    { "name": "Busch Stadium II", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1375705915" },
    { "name": "Baseball Heaven", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1375705915" }
  ],
  "team": "St. Louis Cardinals",
  "city": "St. Louis",
  "country": "US",
  "lat": 38.62389,
  "lon": -90.1925,
  "league": "MLB",
  "unit": "ft",
  "status": "past",
  "closed": 2005,
  "from": 1966,
  "to": 2005,
  "points": [
    [-45, 330],
    [-22.5, 372],
    [0, 402],
    [22.5, 372],
    [45, 330]
  ],
  "en": {
    "title": "Busch Memorial Stadium",
    "revision": 1375705915
  },
  "periods": [
    {
      "from": 1966,
      "to": 1995,
      "points": [
        [-45, 330],
        [-22.5, 386],
        [0, 414],
        [22.5, 386],
        [45, 330]
      ]
    }
  ],
  "note": "Also called Busch Stadium (II).",
  "backstop_ft": 64
};
