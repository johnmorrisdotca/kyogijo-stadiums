// Made by scripts/build-grounds.mjs from scripts/grounds.data.json and scripts/grounds.editions.json: do not edit by hand. One record of src/grounds.data.ts, for a page that draws this venue alone.
import type { GroundData } from "../grounds.core.ts";

export const GROUND: GroundData = {
    "id": "stade-de-france",
    "wikidata": "Q13205",
    "track": true,
    "trackSource": "Wikidata, property P641 (sport) lists athletics",
    "name": "Stade de France",
    "nameJa": "スタッド・ド・フランス",
    "localName": "Stade de France",
    "localLanguage": "fr",
    "aliases": [
      {"name": "Stade de France", "lang": "en", "kind": "wikipedia", "revision": 1379022826, "source": "en.wikipedia.org"},
      {"name": "スタッド・ド・フランス", "lang": "ja", "kind": "wikipedia", "revision": 109911694, "source": "ja.wikipedia.org"}
    ],
    "city": "Saint-Denis",
    "country": "FR",
    "lat": 48.92444,
    "lon": 2.36,
    "status": "current",
    "from": 1998,
    "capacity": 81338,
    "pitchSize": "default",
    "pitchNote": "The infobox gives 119 by 75 m, which is outside the 100 to 110 by 64 to 75 m that Law 1 allows for international matches, and this ground held the 1998 final; not used.",
    "en": {"title": "Stade de France", "revision": 1379022826},
    "ja": {"title": "スタッド・ド・フランス", "revision": 109911694},
    "tournaments": [
      {"competition": "world-cup", "year": 1998, "final": true}
    ],
  };
