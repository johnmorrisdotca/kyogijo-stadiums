// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "baker-bowl",
  "wikidata": "Q4849117",
  "name": "Baker Bowl",
  "nameJa": "ベイカー・ボウル",
  "aliases": [
    { "name": "Baker Bowl", "lang": "en", "kind": "wikipedia", "revision": 1375146474, "source": "en.wikipedia.org" },
    { "name": "ベイカー・ボウル", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q4849117 sitelink" },
    { "name": "National League Park", "lang": "en", "kind": "official", "from": 1895, "source": "en.wikipedia.org revision 1375146474" },
    { "name": "Philadelphia Baseball Grounds", "lang": "en", "kind": "former", "from": 1887, "to": 1895, "source": "en.wikipedia.org revision 1375146474" }
  ],
  "team": "Philadelphia Phillies",
  "city": "Philadelphia",
  "country": "US",
  "lat": 39.99306,
  "lon": -75.15583,
  "league": "MLB",
  "unit": "ft",
  "status": "past",
  "opened": 1887,
  "closed": 1938,
  "from": 1887,
  "to": 1938,
  "points": [
    [-45, 341],
    [0, 408],
    [22.5, 300],
    [45, 280]
  ],
  "en": {
    "title": "Baker Bowl",
    "revision": 1375146474
  },
  "walls": [
    {
      "from": 22.5,
      "to": 45,
      "height": 60,
      "label": "Baker Wall",
      "place": "right"
    }
  ]
};
