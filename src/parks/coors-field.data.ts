// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "coors-field",
  "wikidata": "Q1129916",
  "name": "Coors Field",
  "nameJa": "クアーズ・フィールド",
  "aliases": [
    { "name": "Coors Field", "lang": "en", "kind": "wikipedia", "revision": 1375299958, "source": "en.wikipedia.org" },
    { "name": "クアーズ・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1129916 sitelink" }
  ],
  "team": "Colorado Rockies",
  "city": "Denver",
  "country": "US",
  "lat": 39.75611,
  "lon": -104.99417,
  "league": "MLB",
  "unit": "ft",
  "status": "current",
  "opened": 1995,
  "points": [
    [-45, 347],
    [-22.5, 390],
    [0, 415],
    [22.5, 375],
    [45, 350]
  ],
  "en": {
    "title": "Coors Field",
    "revision": 1375299958
  },
  "backstop_ft": 56,
  "walls": [
    {
      "from": -45,
      "to": -33.75,
      "height": 13,
      "first": 2016,
      "place": "leftCorner"
    },
    {
      "from": -22.5,
      "to": 45,
      "height": 16.5,
      "first": 2016,
      "place": "centerToRight"
    }
  ]
};
