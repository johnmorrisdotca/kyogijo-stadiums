// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "sportsmans-park",
  "wikidata": "Q7579980",
  "name": "Sportsman's Park",
  "nameJa": "スポーツマンズ・パーク",
  "aliases": [
    { "name": "Sportsman's Park", "lang": "en", "kind": "wikipedia", "revision": 1372232220, "source": "en.wikipedia.org" },
    { "name": "スポーツマンズ・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q7579980 sitelink" },
    { "name": "Busch Stadium (I)", "lang": "en", "kind": "former", "from": 1953, "to": 1966, "source": "en.wikipedia.org revision 1372232220" }
  ],
  "team": "St. Louis Browns / St. Louis Cardinals",
  "city": "St. Louis",
  "country": "US",
  "lat": 38.65778,
  "lon": -90.22028,
  "league": "MLB",
  "unit": "ft",
  "status": "past",
  "from": 1902,
  "to": 1966,
  "points": [
    [-45, 351],
    [-37.5, 358],
    [-30, 379],
    [-22.5, 400],
    [-15, 426],
    [-7.5, 425],
    [0, 422],
    [9, 422],
    [18, 405],
    [27, 354],
    [36, 322],
    [45, 310]
  ],
  "en": {
    "title": "Sportsman's Park",
    "revision": 1372232220
  },
  "note": "The deepest corner to the left of center, 426 feet, is taken left of center field, 422.",
  "labels": [
    [
      -45,
      "Left field line"
    ],
    [
      -37.5,
      "Medium left-centre"
    ],
    [
      -30,
      "True left-centre"
    ],
    [
      -22.5,
      "Deep left-centre"
    ],
    [
      -15,
      "Deepest corner, just left of dead centre"
    ],
    [
      -7.5,
      "Just to the right of that corner"
    ],
    [
      0,
      "True centre field"
    ],
    [
      9,
      "Deepest corner, just right of dead centre"
    ],
    [
      18,
      "Deep right-centre"
    ],
    [
      27,
      "True right-centre"
    ],
    [
      36,
      "Medium right-centre"
    ],
    [
      45,
      "Right field line"
    ]
  ],
  "backstop_ft": 68
};
