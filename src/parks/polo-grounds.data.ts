// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "polo-grounds",
  "wikidata": "Q1276360",
  "name": "Polo Grounds",
  "nameJa": "ポロ・グラウンズ",
  "aliases": [
    { "name": "Polo Grounds", "lang": "en", "kind": "wikipedia", "revision": 1379229018, "source": "en.wikipedia.org" },
    { "name": "ポロ・グラウンズ", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1276360 sitelink" },
    { "name": "Brotherhood Park", "lang": "en", "kind": "former", "from": 1890, "to": 1890, "source": "en.wikipedia.org revision 1379229018" },
    { "name": "Brush Stadium", "lang": "en", "kind": "former", "from": 1911, "to": 1919, "source": "en.wikipedia.org revision 1379229018" },
    { "name": "The Bathtub", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379229018" },
    { "name": "Coogan's Bluff", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379229018" }
  ],
  "team": "New York Giants / New York Yankees / New York Mets",
  "city": "New York",
  "country": "US",
  "lat": 40.83083,
  "lon": -73.9375,
  "league": "MLB",
  "unit": "ft",
  "status": "past",
  "opened": 1890,
  "closed": 1963,
  "from": 1891,
  "to": 1963,
  "points": [
    [-45, 279],
    [-37.5, 315],
    [-30, 360],
    [-22.5, 414],
    [-15, 447],
    [-7.5, 455],
    [0, 483],
    [7.5, 455],
    [15, 449],
    [22.5, 395],
    [30, 339],
    [37.5, 294],
    [45, 258]
  ],
  "en": {
    "title": "Polo Grounds",
    "revision": 1379229018
  },
  "periods": [
    {
      "from": 1891,
      "to": 1910,
      "points": [
        [-45, 335],
        [0, 500],
        [45, 335]
      ]
    },
    {
      "from": 1911,
      "to": 1922,
      "points": [
        [-45, 277],
        [0, 433],
        [45, 258]
      ]
    }
  ],
  "note": "The distances are those compiled in the article; 1923 to 1963 is the last fence. Center field is the posted 483 feet.",
  "quirks": [
    {
      "kind": "overhang",
      "from": -45,
      "to": -22.5,
      "depth_ft": 21,
      "first": 1923
    },
    {
      "kind": "bullpen",
      "side": "visitors",
      "angle": -15,
      "feet": 450,
      "first": 1923
    },
    {
      "kind": "bullpen",
      "side": "home",
      "angle": 15,
      "feet": 450,
      "first": 1923
    }
  ]
};
