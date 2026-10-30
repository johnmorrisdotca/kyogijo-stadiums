// Made by scripts/build-grounds.mjs from scripts/grounds.data.json and scripts/grounds.editions.json: do not edit by hand. One record of src/grounds.data.ts, for a page that draws this venue alone.
import type { GroundData } from "../grounds.core.ts";

export const GROUND: GroundData = {
    "id": "camp-nou",
    "wikidata": "Q159848",
    "name": "Camp Nou",
    "names": [
      {"name": "Estadio del Club de Fútbol Barcelona", "from": 1957, "to": 1973},
      {"name": "Estadi del Futbol Club Barcelona", "from": 1973, "to": 2001}
    ],
    "nameJa": "カンプ・ノウ",
    "localName": "Camp Nou",
    "localLanguage": "ca",
    "aliases": [
      {"name": "Camp Nou", "lang": "en", "kind": "wikipedia", "revision": 1380052299, "source": "en.wikipedia.org"},
      {"name": "カンプ・ノウ", "lang": "ja", "kind": "wikipedia", "revision": 110123137, "source": "ja.wikipedia.org"},
      {"name": "Spotify Camp Nou", "lang": "ca", "kind": "official", "source": "Wikidata Q159848 P1448"},
      {"name": "Nou Camp", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1380052299"}
    ],
    "city": "Barcelona",
    "country": "ES",
    "lat": 41.38083,
    "lon": 2.12278,
    "status": "current",
    "from": 1957,
    "capacity": 62652,
    "pitchSize": "published",
    "pitch": {"length": 105, "width": 68, "unit": "m"},
    "note": "Called Spotify Camp Nou for sponsorship.",
    "en": {"title": "Camp Nou", "revision": 1380052299},
    "ja": {"title": "カンプ・ノウ", "revision": 110123137},
    "tournaments": [
      {"competition": "world-cup", "year": 1982}
    ],
  };
