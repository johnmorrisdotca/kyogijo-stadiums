// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "petco-park",
  "wikidata": "Q1194586",
  "name": "Petco Park",
  "nameJa": "ペトコ・パーク",
  "aliases": [
    { "name": "Petco Park", "lang": "en", "kind": "wikipedia", "revision": 1377977726, "source": "en.wikipedia.org" },
    { "name": "ペトコ・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1194586 sitelink" }
  ],
  "team": "San Diego Padres",
  "city": "San Diego",
  "country": "US",
  "lat": 32.70733,
  "lon": -117.15694,
  "league": "MLB",
  "unit": "ft",
  "status": "current",
  "opened": 2004,
  "points": [
    [-45, 336],
    [-33, 343],
    [-20, 386],
    [0, 396],
    [20, 391],
    [33, 382],
    [45, 331]
  ],
  "en": {
    "title": "Petco Park",
    "revision": 1377977726
  },
  "walls": [
    {
      "from": 22.5,
      "to": 45,
      "height": 11,
      "last": 2012,
      "place": "right"
    },
    {
      "from": 22.5,
      "to": 45,
      "height": 8,
      "first": 2013,
      "place": "right"
    }
  ]
};
