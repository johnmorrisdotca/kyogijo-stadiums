// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "wrigley-field",
  "wikidata": "Q1052807",
  "name": "Wrigley Field",
  "nameJa": "リグレー・フィールド",
  "aliases": [
    { "name": "Wrigley Field", "lang": "en", "kind": "wikipedia", "revision": 1377918987, "source": "en.wikipedia.org" },
    { "name": "リグレー・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1052807 sitelink" },
    { "name": "Weeghman Park", "lang": "en", "kind": "former", "from": 1914, "to": 1920, "source": "en.wikipedia.org revision 1377918987" },
    { "name": "Cubs Park", "lang": "en", "kind": "former", "from": 1920, "to": 1926, "source": "en.wikipedia.org revision 1377918987" },
    { "name": "The Friendly Confines", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377918987" }
  ],
  "team": "Chicago Cubs",
  "city": "Chicago",
  "country": "US",
  "lat": 41.94806,
  "lon": -87.65556,
  "league": "MLB",
  "unit": "ft",
  "status": "current",
  "opened": 1914,
  "points": [
    [-45, 355],
    [-36, 357],
    [-30, 360],
    [-22.5, 368],
    [0, 400],
    [22.5, 368],
    [30, 363],
    [45, 353]
  ],
  "en": {
    "title": "Wrigley Field",
    "revision": 1377918987
  },
  "labels": [
    [
      -45,
      "Left field line, the notch in the wall just beyond the foul pole"
    ],
    [
      -36,
      "Where the bleacher wall begins to curve inward in left-centre, the left well (unmarked)"
    ],
    [
      -30,
      "The front of the left-centre well (about 360)"
    ],
    [
      -22.5,
      "Left-centre (marked)"
    ],
    [
      0,
      "The centre field marker, the deepest point (true centre field is unmarked, about 390)"
    ],
    [
      22.5,
      "Right-centre"
    ],
    [
      30,
      "The notch of the right-centre well (unmarked)"
    ],
    [
      45,
      "Right field line"
    ]
  ],
  "backstop_ft": 55,
  "dugouts": {
    "home": "third"
  },
  "walls": [
    {
      "from": -45,
      "to": -30,
      "height": 15,
      "last": 2014,
      "place": "leftCorner"
    },
    {
      "from": -45,
      "to": -30,
      "height": 11,
      "first": 2015,
      "place": "leftCorner"
    },
    {
      "from": -30,
      "to": 30,
      "height": 11.5,
      "place": "outfield"
    },
    {
      "from": 30,
      "to": 45,
      "height": 15,
      "last": 2014,
      "place": "rightCorner"
    },
    {
      "from": 30,
      "to": 45,
      "height": 11,
      "first": 2015,
      "place": "rightCorner"
    }
  ],
  "quirks": [
    {
      "kind": "ivy",
      "from": -45,
      "to": 45,
      "first": 1937
    },
    {
      "kind": "basket",
      "from": -45,
      "to": 45,
      "first": 1970
    }
  ]
};
