// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "pnc-park",
  "wikidata": "Q1151177",
  "name": "PNC Park",
  "nameJa": "PNCパーク",
  "aliases": [
    { "name": "PNC Park", "lang": "en", "kind": "wikipedia", "revision": 1379228702, "source": "en.wikipedia.org" },
    { "name": "PNCパーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1151177 sitelink" }
  ],
  "team": "Pittsburgh Pirates",
  "city": "Pittsburgh",
  "country": "US",
  "lat": 40.44694,
  "lon": -80.00583,
  "league": "MLB",
  "unit": "ft",
  "status": "current",
  "opened": 2001,
  "points": [
    [-45, 325],
    [-27, 383],
    [-13, 410],
    [0, 399],
    [22.5, 375],
    [45, 320]
  ],
  "en": {
    "title": "PNC Park",
    "revision": 1379228702
  },
  "track_ft": 18,
  "backstop_ft": 51,
  "dugouts": {
    "home": "third"
  },
  "walls": [
    {
      "from": -45,
      "to": -22.5,
      "height": 6,
      "place": "left"
    },
    {
      "from": -22.5,
      "to": 22.5,
      "height": 10,
      "place": "center"
    },
    {
      "from": 22.5,
      "to": 45,
      "height": 21,
      "place": "right"
    }
  ]
};
