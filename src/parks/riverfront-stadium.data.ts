// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "riverfront-stadium",
  "wikidata": "Q153824",
  "name": "Riverfront Stadium",
  "nameJa": "リバーフロント・スタジアム",
  "aliases": [
    { "name": "Riverfront Stadium", "lang": "en", "kind": "wikipedia", "revision": 1380015923, "source": "en.wikipedia.org" },
    { "name": "リバーフロント・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q153824 sitelink" },
    { "name": "Cinergy Field", "lang": "en", "kind": "sponsor", "from": 1996, "to": 2002, "source": "en.wikipedia.org revision 1380015923" },
    { "name": "The Home of the Big Red Machine", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1380015923" },
    { "name": "The Jungle", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1380015923" }
  ],
  "team": "Cincinnati Reds",
  "city": "Cincinnati",
  "country": "US",
  "lat": 39.09667,
  "lon": -84.50833,
  "league": "MLB",
  "unit": "ft",
  "status": "past",
  "opened": 1970,
  "closed": 2002,
  "from": 1970,
  "to": 2002,
  "points": [
    [-45, 330],
    [-22.5, 375],
    [0, 404],
    [22.5, 375],
    [45, 330]
  ],
  "en": {
    "title": "Riverfront Stadium",
    "revision": 1380015923
  },
  "backstop_ft": 51,
  "walls": [
    {
      "from": -9,
      "to": 9,
      "height": 40,
      "label": "Black Monster",
      "first": 2001,
      "place": "center"
    }
  ]
};
