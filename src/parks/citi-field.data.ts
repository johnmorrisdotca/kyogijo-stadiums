// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "citi-field",
  "wikidata": "Q1072882",
  "name": "Citi Field",
  "nameJa": "シティ・フィールド",
  "aliases": [
    { "name": "Citi Field", "lang": "en", "kind": "wikipedia", "revision": 1377977619, "source": "en.wikipedia.org" },
    { "name": "シティ・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1072882 sitelink" }
  ],
  "team": "New York Mets",
  "city": "New York",
  "country": "US",
  "lat": 40.75699,
  "lon": -73.84578,
  "league": "MLB",
  "unit": "ft",
  "status": "current",
  "opened": 2009,
  "points": [
    [-45, 335],
    [-30, 358],
    [-17, 385],
    [0, 408],
    [17, 398],
    [30, 375],
    [45, 330]
  ],
  "en": {
    "title": "Citi Field",
    "revision": 1377977619
  },
  "walls": [
    {
      "from": -45,
      "to": -22.5,
      "height": 16,
      "label": "Great Wall of Flushing",
      "last": 2011,
      "place": "left"
    },
    {
      "from": -45,
      "to": -22.5,
      "height": 8,
      "first": 2012,
      "place": "left"
    }
  ]
};
