// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand. One record of src/parks.data.ts, for a page that draws this venue alone.
import type { ParkData } from "../parks.core.ts";

export const PARK: ParkData = {
  "id": "forbes-field",
  "wikidata": "Q1963954",
  "name": "Forbes Field",
  "nameJa": "フォーブス・フィールド",
  "aliases": [
    { "name": "Forbes Field", "lang": "en", "kind": "wikipedia", "revision": 1372176812, "source": "en.wikipedia.org" },
    { "name": "フォーブス・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1963954 sitelink" },
    { "name": "The House of Thrills", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372176812" },
    { "name": "The Old Lady of Schenley Park", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372176812" },
    { "name": "The Oakland Orchard", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372176812" }
  ],
  "team": "Pittsburgh Pirates",
  "city": "Pittsburgh",
  "country": "US",
  "lat": 40.44118,
  "lon": -79.95255,
  "league": "MLB",
  "unit": "ft",
  "status": "past",
  "opened": 1909,
  "closed": 1970,
  "from": 1909,
  "to": 1970,
  "points": [
    [-45, 365],
    [-30, 406],
    [-15, 457],
    [0, 442],
    [15, 436],
    [30, 375],
    [45, 300]
  ],
  "en": {
    "title": "Forbes Field",
    "revision": 1372176812
  },
  "periods": [
    {
      "from": 1909,
      "to": 1911,
      "points": [
        [-45, 360],
        [0, 462],
        [45, 376]
      ]
    }
  ],
  "note": "The final posted distances. Straightaway center was never marked; 442 is the figure some sources give. The original fence of 1909 was 360, 462 and 376 feet.",
  "walls": [
    {
      "from": -45,
      "to": 22.5,
      "height": 12,
      "place": "leftToCenter"
    },
    {
      "from": 22.5,
      "to": 45,
      "height": 9.5,
      "first": 1925,
      "place": "right"
    }
  ]
};
