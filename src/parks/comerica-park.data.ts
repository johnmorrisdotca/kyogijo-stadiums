// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "comerica-park",
  "wikidata": "Q868482",
  "name": "Comerica Park",
  "nameJa": "コメリカ・パーク",
  "aliases": [
    { "name": "Comerica Park", "lang": "en", "kind": "wikipedia", "revision": 1376178715, "source": "en.wikipedia.org" },
    { "name": "コメリカ・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q868482 sitelink" }
  ],
  "team": "Detroit Tigers",
  "city": "Detroit",
  "country": "US",
  "lat": 42.33917,
  "lon": -83.04861,
  "league": "MLB",
  "unit": "ft",
  "status": "current",
  "opened": 2000,
  "points": [
    [-45, 342],
    [-22.5, 370],
    [0, 412],
    [22.5, 365],
    [45, 330]
  ],
  "en": {
    "title": "Comerica Park",
    "revision": 1376178715
  },
  "walls": [
    {
      "from": -22.5,
      "to": 45,
      "height": 7,
      "first": 2023,
      "place": "centerToRight"
    }
  ]
};
