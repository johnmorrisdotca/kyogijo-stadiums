// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "daikin-park",
  "wikidata": "Q1193671",
  "name": "Daikin Park",
  "nameJa": "ダイキン・パーク",
  "aliases": [
    { "name": "Daikin Park", "lang": "en", "kind": "wikipedia", "revision": 1377935430, "source": "en.wikipedia.org" },
    { "name": "ダイキン・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1193671 sitelink" },
    { "name": "ミニッツメイド・パーク", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q1193671 alias" },
    { "name": "Enron Field", "lang": "en", "kind": "sponsor", "from": 2000, "to": 2002, "source": "en.wikipedia.org revision 1377935430" },
    { "name": "Minute Maid Park", "lang": "en", "kind": "sponsor", "from": 2002, "to": 2024, "source": "en.wikipedia.org revision 1377935430" },
    { "name": "Astros Field", "lang": "en", "kind": "former", "from": 2002, "to": 2002, "source": "en.wikipedia.org revision 1377935430" },
    { "name": "The Ice Box", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377935430" }
  ],
  "team": "Houston Astros",
  "city": "Houston",
  "country": "US",
  "lat": 29.75694,
  "lon": -95.35556,
  "league": "MLB",
  "unit": "ft",
  "status": "current",
  "opened": 2000,
  "points": [
    [-45, 315],
    [-25, 366],
    [-12, 399],
    [0, 409],
    [12, 408],
    [25, 370],
    [45, 326]
  ],
  "en": {
    "title": "Daikin Park",
    "revision": 1377935430
  },
  "note": "Formerly Minute Maid Park.",
  "backstop_ft": 49,
  "walls": [
    {
      "from": -45,
      "to": -25,
      "height": 19,
      "label": "Crawford Boxes",
      "place": "left"
    }
  ],
  "quirks": [
    {
      "kind": "hill",
      "label": "Tal's Hill",
      "angle": 0,
      "feet": 436,
      "width_ft": 90,
      "slope_deg": 30,
      "first": 2000,
      "last": 2016
    }
  ]
};
