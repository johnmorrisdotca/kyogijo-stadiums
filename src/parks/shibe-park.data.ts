// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "shibe-park",
  "wikidata": "Q7496044",
  "name": "Shibe Park",
  "nameJa": "シャイブ・パーク",
  "aliases": [
    { "name": "Shibe Park", "lang": "en", "kind": "wikipedia", "revision": 1376110848, "source": "en.wikipedia.org" },
    { "name": "シャイブ・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q7496044 sitelink" },
    { "name": "Connie Mack Stadium", "lang": "en", "kind": "former", "from": 1953, "to": 1976, "source": "en.wikipedia.org revision 1376110848" }
  ],
  "team": "Philadelphia Athletics / Philadelphia Phillies",
  "city": "Philadelphia",
  "country": "US",
  "lat": 39.99611,
  "lon": -75.165,
  "league": "MLB",
  "unit": "ft",
  "status": "past",
  "opened": 1909,
  "closed": 1970,
  "from": 1909,
  "to": 1970,
  "points": [
    [-45, 334],
    [-22.5, 387],
    [0, 410],
    [22.5, 390],
    [45, 329]
  ],
  "en": {
    "title": "Shibe Park",
    "revision": 1376110848
  },
  "periods": [
    {
      "from": 1909,
      "to": 1924,
      "points": [
        [-45, 378],
        [0, 515],
        [45, 340]
      ]
    },
    {
      "from": 1925,
      "to": 1949,
      "points": [
        [-45, 334],
        [0, 468],
        [45, 331]
      ]
    },
    {
      "from": 1950,
      "to": 1967,
      "points": [
        [-45, 334],
        [-22.5, 420],
        [0, 447],
        [22.5, 405],
        [45, 329]
      ]
    }
  ],
  "note": "Also called Connie Mack Stadium. Opening day of 1909 had left field at 360 feet; center is the deepest corner (515 and 468 feet) in the first two periods.",
  "walls": [
    {
      "from": 22.5,
      "to": 45,
      "height": 12,
      "last": 1934,
      "place": "right"
    },
    {
      "from": 22.5,
      "to": 45,
      "height": 34,
      "first": 1935,
      "place": "right"
    }
  ]
};
