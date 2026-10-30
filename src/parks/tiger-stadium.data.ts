// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "tiger-stadium",
  "wikidata": "Q1750255",
  "name": "Tiger Stadium",
  "nameJa": "タイガー・スタジアム",
  "aliases": [
    { "name": "Tiger Stadium (Detroit)", "lang": "en", "kind": "wikipedia", "revision": 1379484942, "source": "en.wikipedia.org" },
    { "name": "タイガー・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1750255 sitelink" },
    { "name": "Navin Field", "lang": "en", "kind": "former", "from": 1912, "to": 1937, "source": "en.wikipedia.org revision 1379484942" },
    { "name": "Briggs Stadium", "lang": "en", "kind": "former", "from": 1938, "to": 1960, "source": "en.wikipedia.org revision 1379484942" },
    { "name": "The Corner", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379484942" }
  ],
  "team": "Detroit Tigers",
  "city": "Detroit",
  "country": "US",
  "lat": 42.33194,
  "lon": -83.06889,
  "league": "MLB",
  "unit": "ft",
  "status": "past",
  "opened": 1912,
  "closed": 2009,
  "from": 1912,
  "to": 1999,
  "points": [
    [-45, 340],
    [-22.5, 365],
    [0, 440],
    [22.5, 370],
    [45, 325]
  ],
  "en": {
    "title": "Tiger Stadium (Detroit)",
    "revision": 1379484942
  },
  "note": "Called Navin Field and Briggs Stadium before.",
  "backstop_ft": 66,
  "quirks": [
    {
      "kind": "overhang",
      "from": 22.5,
      "to": 45,
      "depth_ft": 10,
      "first": 1936
    },
    {
      "kind": "flagpole",
      "angle": -6,
      "feet": 440,
      "height_ft": 125
    }
  ]
};
