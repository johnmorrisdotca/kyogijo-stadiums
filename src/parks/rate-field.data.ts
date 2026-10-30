// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "rate-field",
  "wikidata": "Q633613",
  "name": "Rate Field",
  "nameJa": "レート・フィールド",
  "aliases": [
    { "name": "Rate Field", "lang": "en", "kind": "wikipedia", "revision": 1379317170, "source": "en.wikipedia.org" },
    { "name": "レート・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q633613 sitelink" },
    { "name": "ギャランティード・レート・フィールド", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q633613 label" },
    { "name": "USセルラー・フィールド", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q633613 alias" },
    { "name": "U.S. Cellular Field", "lang": "en", "kind": "sponsor", "from": 2003, "to": 2016, "source": "en.wikipedia.org revision 1379317170" },
    { "name": "Guaranteed Rate Field", "lang": "en", "kind": "sponsor", "from": 2017, "to": 2024, "source": "en.wikipedia.org revision 1379317170" },
    { "name": "Comiskey Park II", "lang": "en", "kind": "former", "from": 1991, "to": 2003, "source": "en.wikipedia.org revision 1379317170" },
    { "name": "White Sox Park", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379317170" },
    { "name": "Sox Park", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379317170" },
    { "name": "New Comiskey", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379317170" },
    { "name": "The Cell", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379317170" }
  ],
  "team": "Chicago White Sox",
  "city": "Chicago",
  "country": "US",
  "lat": 41.83,
  "lon": -87.63389,
  "league": "MLB",
  "unit": "ft",
  "status": "current",
  "opened": 1991,
  "points": [
    [-45, 330],
    [-22.5, 375],
    [0, 400],
    [22.5, 375],
    [45, 335]
  ],
  "en": {
    "title": "Rate Field",
    "revision": 1379317170
  },
  "backstop_ft": 60,
  "walls": [
    {
      "from": -45,
      "to": 45,
      "height": 8,
      "place": "outfield"
    }
  ]
};
