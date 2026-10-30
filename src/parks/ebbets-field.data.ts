// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "ebbets-field",
  "wikidata": "Q1278537",
  "name": "Ebbets Field",
  "nameJa": "エベッツ・フィールド",
  "aliases": [
    { "name": "Ebbets Field", "lang": "en", "kind": "wikipedia", "revision": 1378347217, "source": "en.wikipedia.org" },
    { "name": "エベッツ・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1278537 sitelink" }
  ],
  "team": "Brooklyn Dodgers",
  "city": "Brooklyn",
  "country": "US",
  "lat": 40.665,
  "lon": -73.95806,
  "league": "MLB",
  "unit": "ft",
  "status": "past",
  "opened": 1913,
  "from": 1913,
  "to": 1957,
  "points": [
    [-45, 348],
    [-22.5, 351],
    [0, 399],
    [22.5, 344],
    [45, 297]
  ],
  "en": {
    "title": "Ebbets Field",
    "revision": 1378347217
  },
  "periods": [
    {
      "from": 1931,
      "to": 1947,
      "points": [
        [-45, 348],
        [-30, 365],
        [-15, 407],
        [0, 399],
        [22.5, 344],
        [45, 297]
      ]
    }
  ],
  "note": "Center field is the posted 399 feet of the notch in deep right-center."
};
