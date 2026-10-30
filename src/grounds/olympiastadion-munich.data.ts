// Made by scripts/build-grounds.mjs from scripts/grounds.data.json and scripts/grounds.editions.json: do not edit by hand. One record of src/grounds.data.ts, for a page that draws this venue alone.
import type { GroundData } from "../grounds.core.ts";

export const GROUND: GroundData = {
    "id": "olympiastadion-munich",
    "wikidata": "Q131610",
    "track": true,
    "trackSource": "Wikidata, property P641 (sport) lists athletics",
    "name": "Munich Olympic Stadium",
    "nameJa": "ミュンヘン・オリンピアシュタディオン",
    "localName": "Olympiastadion München",
    "localLanguage": "de",
    "aliases": [
      {"name": "Olympiastadion (Munich)", "lang": "en", "kind": "wikipedia", "revision": 1375090249, "source": "en.wikipedia.org"},
      {"name": "ミュンヘン・オリンピアシュタディオン", "lang": "ja", "kind": "wikipedia", "revision": 109325015, "source": "ja.wikipedia.org"},
      {"name": "Olympiastadion", "lang": "de", "kind": "nickname", "source": "en.wikipedia.org revision 1375090249"}
    ],
    "city": "Munich",
    "country": "DE",
    "lat": 48.17306,
    "lon": 11.54667,
    "status": "current",
    "from": 1972,
    "capacity": 63118,
    "pitchSize": "published",
    "pitch": {"length": 105, "width": 68, "unit": "m"},
    "en": {"title": "Olympiastadion (Munich)", "revision": 1375090249},
    "ja": {"title": "ミュンヘン・オリンピアシュタディオン", "revision": 109325015},
    "tournaments": [
      {"competition": "world-cup", "year": 1974, "final": true}
    ],
  };
