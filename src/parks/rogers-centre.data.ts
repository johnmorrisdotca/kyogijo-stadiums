// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "rogers-centre",
  "wikidata": "Q76318",
  "name": "Rogers Centre",
  "nameJa": "ロジャーズ・センター",
  "aliases": [
    { "name": "Rogers Centre", "lang": "en", "kind": "wikipedia", "revision": 1379619269, "source": "en.wikipedia.org" },
    { "name": "ロジャーズ・センター", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q76318 sitelink" },
    { "name": "スカイドーム", "lang": "ja", "kind": "former", "source": "Wikidata Q76318 alias" },
    { "name": "SkyDome", "lang": "en", "kind": "former", "from": 1989, "to": 2005, "source": "en.wikipedia.org revision 1379619269" }
  ],
  "team": "Toronto Blue Jays",
  "city": "Toronto",
  "country": "CA",
  "lat": 43.64139,
  "lon": -79.38917,
  "league": "MLB",
  "unit": "ft",
  "status": "current",
  "opened": 1989,
  "points": [
    [-45, 328],
    [-33, 368],
    [-22.5, 381],
    [0, 400],
    [22.5, 372],
    [33, 359],
    [45, 328]
  ],
  "en": {
    "title": "Rogers Centre",
    "revision": 1379619269
  },
  "backstop_ft": 60
};
