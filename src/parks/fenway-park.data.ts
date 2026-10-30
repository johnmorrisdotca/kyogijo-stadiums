// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "fenway-park",
  "wikidata": "Q49136",
  "name": "Fenway Park",
  "nameJa": "フェンウェイ・パーク",
  "aliases": [
    { "name": "Fenway Park", "lang": "en", "kind": "wikipedia", "revision": 1376280796, "source": "en.wikipedia.org" },
    { "name": "フェンウェイ・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q49136 sitelink" },
    { "name": "America's Most Beloved Ballpark", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1376280796" },
    { "name": "Friendly Fenway", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1376280796" },
    { "name": "Fenway", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1376280796" }
  ],
  "team": "Boston Red Sox",
  "city": "Boston",
  "country": "US",
  "lat": 42.34639,
  "lon": -71.0975,
  "league": "MLB",
  "unit": "ft",
  "status": "current",
  "opened": 1912,
  "points": [
    [-45, 310],
    [-24, 379],
    [0, 389.75],
    [18, 420],
    [28, 380],
    [45, 302]
  ],
  "en": {
    "title": "Fenway Park",
    "revision": 1376280796
  },
  "backstop_ft": 60,
  "walls": [
    {
      "from": -45,
      "to": -24,
      "height": 25,
      "first": 1912,
      "last": 1933,
      "place": "left"
    },
    {
      "from": -45,
      "to": -24,
      "height": 37.167,
      "label": "Green Monster",
      "first": 1934,
      "place": "left"
    }
  ],
  "quirks": [
    {
      "kind": "pole",
      "label": "Pesky's Pole",
      "angle": 45,
      "feet": 302
    }
  ]
};
