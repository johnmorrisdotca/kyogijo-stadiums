// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "yankee-stadium",
  "wikidata": "Q753529",
  "name": "Yankee Stadium",
  "nameJa": "ヤンキー・スタジアム",
  "aliases": [
    { "name": "Yankee Stadium", "lang": "en", "kind": "wikipedia", "revision": 1378222004, "source": "en.wikipedia.org" },
    { "name": "ヤンキー・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q753529 sitelink" },
    { "name": "The Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1378222004" },
    { "name": "The House That Jeter Built", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1378222004" },
    { "name": "The House That George Built", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1378222004" },
    { "name": "New Yankee Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1378222004" }
  ],
  "team": "New York Yankees",
  "city": "New York",
  "country": "US",
  "lat": 40.82957,
  "lon": -73.92639,
  "league": "MLB",
  "unit": "ft",
  "status": "current",
  "opened": 2009,
  "points": [
    [-45, 318],
    [-22.5, 399],
    [0, 408],
    [22.5, 385],
    [45, 314]
  ],
  "en": {
    "title": "Yankee Stadium",
    "revision": 1378222004
  },
  "backstop_ft": 52.333,
  "walls": [
    {
      "from": -45,
      "to": 22.5,
      "height": 8.417,
      "place": "leftToCenter"
    },
    {
      "from": 22.5,
      "to": 45,
      "height": 8,
      "place": "right"
    }
  ]
};
