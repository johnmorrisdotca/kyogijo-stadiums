// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "shea-stadium",
  "wikidata": "Q1056326",
  "name": "Shea Stadium",
  "nameJa": "シェイ・スタジアム",
  "aliases": [
    { "name": "Shea Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372229796, "source": "en.wikipedia.org" },
    { "name": "シェイ・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1056326 sitelink" },
    { "name": "William A. Shea Municipal Stadium", "lang": "en", "kind": "official", "source": "en.wikipedia.org revision 1372229796" },
    { "name": "Flushing Meadow Park Municipal Stadium", "lang": "en", "kind": "former", "from": 1961, "to": 1962, "source": "en.wikipedia.org revision 1372229796" },
    { "name": "Shea", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372229796" }
  ],
  "team": "New York Mets / New York Yankees",
  "city": "New York",
  "country": "US",
  "lat": 40.75556,
  "lon": -73.84806,
  "league": "MLB",
  "unit": "ft",
  "status": "past",
  "opened": 1964,
  "closed": 2008,
  "from": 1964,
  "to": 2008,
  "points": [
    [-45, 338],
    [-33.8, 358],
    [-22.5, 371],
    [-11.2, 396],
    [0, 410],
    [11.2, 396],
    [22.5, 371],
    [33.8, 358],
    [45, 338]
  ],
  "en": {
    "title": "Shea Stadium",
    "revision": 1372229796
  },
  "periods": [
    {
      "from": 1964,
      "to": 1977,
      "points": [
        [-45, 341],
        [-33.8, 358],
        [-22.5, 371],
        [-11.2, 396],
        [0, 410],
        [11.2, 396],
        [22.5, 371],
        [33.8, 358],
        [45, 341]
      ]
    }
  ],
  "note": "The Yankees played here in 1974 and 1975."
};
