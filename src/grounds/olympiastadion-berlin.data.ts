// Made by scripts/build-grounds.mjs from scripts/grounds.data.json and scripts/grounds.editions.json: do not edit by hand. One record of src/grounds.data.ts, for a page that draws this venue alone.
import type { GroundData } from "../grounds.core.ts";

export const GROUND: GroundData = {
    "id": "olympiastadion-berlin",
    "wikidata": "Q151374",
    "name": "Berlin Olympic Stadium",
    "nameJa": "ベルリン・オリンピアシュタディオン",
    "localName": "Olympiastadion Berlin",
    "localLanguage": "de",
    "aliases": [
      {"name": "Olympiastadion (Berlin)", "lang": "en", "kind": "wikipedia", "revision": 1377305597, "source": "en.wikipedia.org"},
      {"name": "ベルリン・オリンピアシュタディオン", "lang": "ja", "kind": "wikipedia", "revision": 109745416, "source": "ja.wikipedia.org"},
      {"name": "Olympiastadion Berlin", "lang": "de", "kind": "official", "source": "Wikidata Q151374 P1448"},
      {"name": "Deutsches Stadion", "lang": "en", "kind": "former", "source": "en.wikipedia.org revision 1377305597"}
    ],
    "city": "Berlin",
    "country": "DE",
    "lat": 52.51472,
    "lon": 13.23944,
    "status": "current",
    "from": 1936,
    "capacity": 74475,
    "pitchSize": "published",
    "pitch": {"length": 105, "width": 68, "unit": "m"},
    "en": {"title": "Olympiastadion (Berlin)", "revision": 1377305597},
    "ja": {"title": "ベルリン・オリンピアシュタディオン", "revision": 109745416},
    "tournaments": [
      {"competition": "world-cup", "year": 1974},
      {"competition": "world-cup", "year": 2006, "final": true},
      {"competition": "womens-world-cup", "year": 2011}
    ],
  };
