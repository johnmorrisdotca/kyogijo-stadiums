// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "huntington-avenue-grounds",
  "wikidata": "Q1056422",
  "name": "Huntington Avenue Grounds",
  "nameJa": "ハンティントン・アベニュー・グラウンズ",
  "aliases": [
    { "name": "Huntington Avenue Grounds", "lang": "en", "kind": "wikipedia", "revision": 1372204570, "source": "en.wikipedia.org" },
    { "name": "ハンティントン・アベニュー・グラウンズ", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1056422 sitelink" },
    { "name": "Huntington Avenue American League Baseball Grounds", "lang": "en", "kind": "official", "source": "en.wikipedia.org revision 1372204570" }
  ],
  "team": "Boston Red Sox",
  "city": "Boston",
  "country": "US",
  "lat": 42.33889,
  "lon": -71.08889,
  "league": "MLB",
  "unit": "ft",
  "status": "past",
  "opened": 1901,
  "closed": 1911,
  "from": 1901,
  "to": 1911,
  "points": [
    [-45, 350],
    [-22.5, 440],
    [0, 635],
    [45, 320]
  ],
  "en": {
    "title": "Huntington Avenue Grounds",
    "revision": 1372204570
  },
  "periods": [
    {
      "from": 1901,
      "to": 1907,
      "points": [
        [-45, 350],
        [-22.5, 440],
        [0, 530],
        [45, 280]
      ]
    }
  ],
  "note": "The centre field fence was moved from 530 to 635 feet and right field from 280 to 320 for 1908. No right-center figure is published.",
  "backstop_ft": 60
};
