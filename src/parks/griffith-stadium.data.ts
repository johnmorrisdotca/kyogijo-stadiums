// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "griffith-stadium",
  "wikidata": "Q5608924",
  "name": "Griffith Stadium",
  "nameJa": "グリフィス・スタジアム",
  "aliases": [
    { "name": "Griffith Stadium", "lang": "en", "kind": "wikipedia", "revision": 1379220233, "source": "en.wikipedia.org" },
    { "name": "グリフィス・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q5608924 sitelink" },
    { "name": "National Park", "lang": "en", "kind": "former", "from": 1911, "to": 1922, "source": "en.wikipedia.org revision 1379220233" }
  ],
  "team": "Washington Senators",
  "city": "Washington",
  "country": "US",
  "lat": 38.9175,
  "lon": -77.02028,
  "league": "MLB",
  "unit": "ft",
  "status": "past",
  "opened": 1911,
  "closed": 1961,
  "from": 1911,
  "to": 1961,
  "points": [
    [-45, 388],
    [-22.5, 360],
    [0, 421],
    [22.5, 373],
    [45, 320]
  ],
  "en": {
    "title": "Griffith Stadium",
    "revision": 1379220233
  },
  "note": "The infobox's final figures.",
  "backstop_ft": 61,
  "quirks": [
    {
      "kind": "bullpen",
      "label": "Left-field bullpen",
      "angle": -45,
      "feet": 388,
      "first": 1956,
      "last": 1961
    }
  ],
  "walls": [
    {
      "from": 22.5,
      "to": 45,
      "height": 30,
      "place": "right"
    }
  ]
};
